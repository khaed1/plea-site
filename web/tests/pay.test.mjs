// "Pay with" ETH or USDC on the Buy page (Ethereum): the routes in site.json, their v4 paths, the
// pools' live fees, the Quoter's refusals and Max's gas reserve.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  encodeErrorResult,
} from "viem";
import { manifestFor } from "./site-setup.mjs";
import { payValid } from "../scripts/network.mjs";
import { siteFrom, validPay } from "../src/site.ts";
import { NATIVE, v4QuoterAbi } from "../src/universal-router.ts";
import { explainReadError } from "../src/rpc-health.ts";
import { LIQUIDITY_SHORT, NO_LIQUIDITY } from "../src/swap-math.ts";
import {
  buyPath,
  ethMax,
  feeWords,
  gasReserve,
  hopKey,
  poolId,
  quoteToImd,
  readHopFees,
  routeLine,
  routeRefusal,
  routeToImd,
  slot0Slot,
  swapFee,
} from "../src/pay.ts";

const IMD = "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7",
  PLEA = "0x1f158929496162b53fb232536468948e25170ab3",
  HOOK = "0xf1122bc96adea8768cff2badf02b6d4594f928cc",
  POOL4 = "0xc6c965bd164c483e87d0b550671798e9a3602840",
  USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  QUOTER = "0x52f0e24d1c21c8a0cb1e5a5dd6198556bd9e1203",
  BUYER = "0x1111111111111111111111111111111111111111",
  // PleaHook.poolKey() of launch #2647 (read on the fork of the real deployment).
  pleaKey = { currency0: PLEA, currency1: IMD, fee: 0, tickSpacing: 60, hooks: HOOK };
const eth = manifestFor("ethereum").site,
  [ETH_ROUTE, USDC_ROUTE] = eth.pay.routes;

test("site.json: Ethereum names the Quoter and the ETH and USDC routes into IMD; Sepolia run 9 has none", () => {
  assert.equal(eth.pay.quoter, QUOTER);
  assert.deepEqual(eth.pay.routes.map((r) => [r.symbol, r.currency, r.decimals]), [
    ["ETH", NATIVE, 18],
    ["USDC", USDC, 6],
  ]);
  // ETH: IMD's own ETH/IMD pool (POOL4, 1%, tick spacing 60), pool id 0x4158…a704.
  assert.deepEqual(ETH_ROUTE.path.map(({ currency, fee, tickSpacing, hooks }) => [currency, fee, tickSpacing, hooks]), [[IMD, 10000, 60, POOL4]]);
  // USDC: Uniswap's USDC/ETH 0.05% pool (tick spacing 10, no hook), then the same IMD hop.
  assert.deepEqual(USDC_ROUTE.path.map(({ currency, fee, tickSpacing, hooks }) => [currency, fee, tickSpacing, hooks]), [
    [NATIVE, 500, 10, NATIVE],
    [IMD, 10000, 60, POOL4],
  ]);
  assert.equal(manifestFor("sepolia-run9").site.pay, null);
  // The manifest carries the block as site.json has it (check-export compares the manifest's site
  // with network.mjs's): the build's copy is the file's.
  const file = JSON.parse(fs.readFileSync(new URL("../networks/ethereum/site.json", import.meta.url)));
  assert.deepEqual(eth.pay, file.pay);
});

test("pay settings: network.mjs and site.ts accept and refuse the same blocks", () => {
  const ur = eth.trade,
    good = eth.pay;
  const clone = () => JSON.parse(JSON.stringify(good));
  const bad = [
    ["no quoter", (p) => delete p.quoter],
    ["a checksummed address", (p) => (p.quoter = "0x52F0e24D1c21C8A0cB1e5a5dD6198556BD9E1203")],
    ["no routes", (p) => (p.routes = [])],
    ["a repeated symbol", (p) => (p.routes[1].symbol = "ETH")],
    ["a lower-case symbol", (p) => (p.routes[0].symbol = "eth")],
    ["routes ending in different currencies", (p) => (p.routes[1].path[1].currency = USDC)],
    ["a route that is the pool currency itself", (p) => (p.routes[0].currency = IMD)],
    ["a hop to the currency it starts from", (p) => (p.routes[1].path[0].currency = USDC)],
    ["IMD before the last hop", (p) => (p.routes[1].path[0].currency = IMD)],
    ["a fee of 100%", (p) => (p.routes[0].path[0].fee = 1_000_000)],
    ["a tick spacing of 0", (p) => (p.routes[0].path[0].tickSpacing = 0)],
    ["a fractional decimals", (p) => (p.routes[1].decimals = 6.5)],
    ["a hop without a pool name", (p) => (p.routes[0].path[0].pool = "")],
    ["an empty path", (p) => (p.routes[0].path = [])],
  ];
  assert.ok(payValid(good, ur) && validPay(good, ur));
  assert.ok(payValid(null, ur) && validPay(null, ur) && payValid(undefined, ur) && validPay(undefined, ur));
  // Routes need the Universal Router: PoolSwapTest (Sepolia) cannot pay with anything but IMD.
  assert.ok(!payValid(good, { kind: "poolSwapTest" }) && !validPay(good, { kind: "poolSwapTest" }));
  for (const [why, change] of bad) {
    const p = clone();
    change(p);
    assert.equal(payValid(p, ur), false, `network.mjs: ${why}`);
    assert.equal(validPay(p, ur), false, `site.ts: ${why}`);
  }
  // The site refuses a manifest whose routes are not valid, as it refuses the other settings.
  const m = manifestFor("ethereum");
  m.site = { ...m.site, pay: { ...good, routes: [] } };
  assert.throws(() => siteFrom(m), /payment routes are not valid/);
});

test("paths: ETH → IMD's ETH pool → PLEA's pool; USDC → USDC/ETH → IMD → PLEA; only PLEA's hop names the buyer", () => {
  const buyer = encodeAbiParameters([{ type: "address" }], [BUYER]);
  assert.deepEqual(routeToImd(ETH_ROUTE), [{ intermediateCurrency: IMD, fee: 10000, tickSpacing: 60, hooks: POOL4, hookData: "0x" }]);
  assert.deepEqual(buyPath(ETH_ROUTE, pleaKey, PLEA, BUYER), [
    { intermediateCurrency: IMD, fee: 10000, tickSpacing: 60, hooks: POOL4, hookData: "0x" },
    { intermediateCurrency: PLEA, fee: 0, tickSpacing: 60, hooks: HOOK, hookData: buyer },
  ]);
  assert.deepEqual(buyPath(USDC_ROUTE, pleaKey, PLEA, BUYER).map((h) => h.intermediateCurrency), [NATIVE, IMD, PLEA]);
  assert.throws(() => buyPath(ETH_ROUTE, { ...pleaKey, currency1: USDC }, PLEA, BUYER), /does not pair PLEA/);
});

test("pool keys and ids: the hops are the pools on chain (IMD's ETH pool 0x4158…a704, USDC/ETH 0x21c6…ca27)", () => {
  const imdHop = hopKey(ETH_ROUTE, 0);
  assert.deepEqual(imdHop, { key: { currency0: NATIVE, currency1: IMD, fee: 10000, tickSpacing: 60, hooks: POOL4 }, zeroForOne: true });
  assert.equal(poolId(imdHop.key), "0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704");
  const usdcHop = hopKey(USDC_ROUTE, 0);
  assert.equal(usdcHop.zeroForOne, false, "USDC is currency1 of the USDC/ETH pool: USDC → ETH is one for zero");
  assert.equal(poolId(usdcHop.key), "0x21c67e77068de97969ba93d4aab21826d33ca12bb9f565d8496e8fda8a82ca27");
  assert.equal(poolId(hopKey(USDC_ROUTE, 1).key), poolId(imdHop.key));
});

/** A Slot0 word as the PoolManager stores it: price, tick, protocol fee (both ways), LP fee. */
const slot0 = (sqrt, tick, protocolFee, lpFee) =>
  BigInt(sqrt) | (BigInt.asUintN(24, BigInt(tick)) << 160n) | (BigInt(protocolFee) << 184n) | (BigInt(lpFee) << 208n);

test("fees: the LP fee plus Uniswap's protocol fee, per direction, as v4 charges them", () => {
  // Read from Ethereum on 2026-10-29: IMD's ETH pool 0 / 10000; the USDC/ETH pool 512125 (125 each
  // way) / 500, so a USDC → ETH swap pays 625 millionths, 0.0625%.
  const imd = slot0(1809982231508399746702137533534n, 62577, 0, 10000),
    usdc = slot0(3819992442360974856790502n, -198807, 512125, 500);
  assert.deepEqual(swapFee(imd, true), { lp: 10000, protocol: 0, total: 10000 });
  assert.deepEqual(swapFee(usdc, false), { lp: 500, protocol: 125, total: 625 });
  // 12 bits each way: zeroForOne the low ones.
  assert.deepEqual(swapFee(slot0(1n, 0, (300 << 12) | 100, 3000), true), { lp: 3000, protocol: 100, total: 3100 - 0 });
  assert.equal(swapFee(slot0(1n, 0, (300 << 12) | 100, 3000), false).total, 300 + 3000 - 0);
  assert.equal(swapFee(slot0(1n, 0, 1000 | (1000 << 12), 1000), true).total, 1999, "1000 + 1000 − 1000 × 1000 ÷ 1e6");
  assert.deepEqual([10000, 625, 500, 125, 1].map(feeWords), ["1%", "0.0625%", "0.05%", "0.0125%", "0.0001%"]);
  // The slot is StateLibrary's: keccak256(abi.encodePacked(poolId, 6)).
  assert.equal(slot0Slot("0x415829f72e9f54531c26eae76f107618540e898a45d6ae35959e143f5faca704").length, 66);
});

test("readHopFees reads each hop's Slot0 from the PoolManager and refuses a pool that is not open", async () => {
  const words = {
    [slot0Slot(poolId(hopKey(USDC_ROUTE, 0).key))]: slot0(1n, 0, 512125, 500),
    [slot0Slot(poolId(hopKey(USDC_ROUTE, 1).key))]: slot0(1n, 0, 0, 10000),
  };
  const client = { readContract: async ({ functionName, args }) => (assert.equal(functionName, "extsload"), "0x" + (words[args[0]] ?? 0n).toString(16).padStart(64, "0")) };
  const fees = await readHopFees(client, "0x000000000004444c5dc75cb358380d2e3de08a90", USDC_ROUTE);
  assert.deepEqual(fees.map((f) => [f.pool, f.total]), [["Uniswap’s USDC/ETH pool", 625], ["IMD’s ETH pool", 10000]]);
  await assert.rejects(readHopFees({ readContract: async () => "0x" + "0".repeat(64) }, NATIVE, ETH_ROUTE), /IMD’s ETH pool is not open/);
});

test("the route in words: each pool and its fee, then PLEA's 2.25%, one transaction", () => {
  const routes = eth.pay.routes;
  assert.equal(
    routeLine(ETH_ROUTE, routes, "IMD", "2.25%"),
    "ETH buys IMD on IMD’s ETH pool (1% fee) and the IMD buys PLEA (2.25% fees), in one transaction.",
  );
  assert.equal(
    routeLine(USDC_ROUTE, routes, "IMD", "2.25%", [{ total: 625 }, { total: 10000 }]),
    "USDC buys ETH on Uniswap’s USDC/ETH pool (0.0625% fee), the ETH buys IMD on IMD’s ETH pool (1% fee) and the IMD buys PLEA (2.25% fees), in one transaction.",
  );
  for (const r of routes) assert.doesNotMatch(routeLine(r, routes, "IMD", "2.25%"), /mainnet|chain id 1\b/i);
});

const quoterError = (errorName, args) => {
  const data = encodeErrorResult({ abi: v4QuoterAbi, errorName, args });
  const cause = new ContractFunctionRevertedError({ abi: v4QuoterAbi, data, functionName: "quoteExactInput" });
  return new ContractFunctionExecutionError(cause, { abi: v4QuoterAbi, functionName: "quoteExactInput", args: [], contractAddress: QUOTER });
};

test("quoteToImd: the Quoter's IMD for the route's hops; a refusal is a plain reason, an RPC failure stays one", async () => {
  let asked;
  const ok = { simulateContract: async (a) => ((asked = a), { result: [25_379n * 10n ** 15n, 200000n] }) };
  assert.equal(await quoteToImd(ok, QUOTER, ETH_ROUTE, 5n * 10n ** 16n, "IMD"), 25_379n * 10n ** 15n);
  assert.equal(asked.address, QUOTER);
  assert.equal(asked.functionName, "quoteExactInput");
  assert.deepEqual(asked.args, [{ exactCurrency: NATIVE, path: routeToImd(ETH_ROUTE), exactAmount: 5n * 10n ** 16n }]);
  // A pool that cannot fill the whole input: the Quoter names it by id, the site by name.
  const short = { simulateContract: async () => { throw quoterError("NotEnoughLiquidity", [poolId(hopKey(USDC_ROUTE, 0).key)]); } };
  await assert.rejects(quoteToImd(short, QUOTER, USDC_ROUTE, 10n ** 15n, "IMD"), (e) => {
    assert.equal(e.constructor, Error);
    assert.equal(e.message, "Uniswap’s USDC/ETH pool cannot fill this amount. Lower it, or pay with IMD.");
    assert.ok(routeRefusal(e.message));
    // A read error with these words reads as itself (no "Can't reach" text).
    assert.equal(explainReadError(e), e.message);
    return true;
  });
  const other = { simulateContract: async () => { throw quoterError("UnexpectedRevertBytes", ["0x1234"]); } };
  await assert.rejects(quoteToImd(other, QUOTER, ETH_ROUTE, 1n, "IMD"), (e) => {
    assert.equal(e.message, "Uniswap’s Quoter found no way to swap this ETH into IMD through IMD’s ETH pool. Pay with IMD, or try again later.");
    assert.ok(routeRefusal(e.message));
    assert.equal(explainReadError(e), e.message);
    return true;
  });
  const down = new TypeError("fetch failed");
  await assert.rejects(quoteToImd({ simulateContract: async () => { throw down; } }, QUOTER, ETH_ROUTE, 1n, "IMD"), (e) => e === down);
  await assert.rejects(quoteToImd(ok, QUOTER, ETH_ROUTE, 1n << 128n, "IMD"), /cannot fill this amount/);
  // The PLEA leg's own guards are not route refusals (the page words them itself).
  assert.ok(!routeRefusal(LIQUIDITY_SHORT) && !routeRefusal(NO_LIQUIDITY) && !routeRefusal(undefined));
});

test("ETH's Max leaves the gas: 2.4M gas (the limit the site sends) at twice the base fee plus the tip, rounded down to 0.0001 ETH", async () => {
  const gwei = 10n ** 9n;
  const reserve = await gasReserve({ getBlock: async () => ({ baseFeePerGas: 2n * gwei }), estimateMaxPriorityFeePerGas: async () => gwei });
  assert.equal(reserve, 2_400_000n * 5n * gwei); // 0.012 ETH
  assert.equal(await gasReserve({ getBlock: async () => ({ baseFeePerGas: 0n }), estimateMaxPriorityFeePerGas: async () => { throw Error("no"); } }), 2_400_000n * gwei);
  assert.equal(ethMax(2n * 10n ** 18n, reserve), 1_988n * 10n ** 15n);
  assert.equal(ethMax(2n * 10n ** 18n + 123_456_789n, reserve), 1_988n * 10n ** 15n, "rounded down: the field shows what is paid");
  assert.equal(ethMax(10n ** 16n, 2_400_000n * 1_002_705_384n), 75n * 10n ** 14n, "the fork's 0.01 ETH wallet: Max 0.0075, 0.0024 kept");
  assert.equal(ethMax(reserve, reserve), 0n, "nothing to spend once the gas is kept");
  assert.equal(ethMax(reserve - 1n, reserve), 0n);
});

test("the Buy page: Pay with ETH by default, remembered per browser, IMD for the seed's opening buy and for every sale", () => {
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /const PAY_KEY = "plea-pay-with"/);
  // Storage is read and written inside try/catch (a blocked storage falls back to the first route).
  assert.match(src, /try \{\s*v = localStorage\.getItem\(PAY_KEY\);\s*\} catch \{\}/);
  assert.match(src, /try \{\s*localStorage\.setItem\(PAY_KEY, v\);\s*\} catch \{\}/);
  assert.match(src, /routes\[0\]\?\.symbol \?\? PAY_PAIR/);
  assert.match(src, /choosePay\(PAY_PAIR, false\);\s*setInput\(formatUnits\(con\(s, "PleaHook\.PAYOUT_RESERVE"\), 18\)\)/);
  assert.match(src, /const route = selling \? undefined : routes\.find/);
});

test("the docs' numbers for Pay with are site.json's: the Quoter, USDC, POOL4's hook and the pools' fees", () => {
  const N = JSON.parse(fs.readFileSync(new URL("../src/docs/numbers.json", import.meta.url)));
  assert.equal(N.addr_quoter.text.toLowerCase(), eth.pay.quoter);
  assert.equal(N.addr_usdc.text.toLowerCase(), USDC_ROUTE.currency);
  assert.equal(N.addr_pool4_hook.text.toLowerCase(), ETH_ROUTE.path[0].hooks);
  // Basis points in the docs, millionths in a pool key.
  assert.equal(Number(N.pay_imd_pool_fee.value) * 100, ETH_ROUTE.path[0].fee);
  assert.equal(Number(N.pay_usdc_pool_fee.value) * 100, USDC_ROUTE.path[0].fee);
  assert.equal(feeWords(125), N.pay_usdc_protocol_fee.text);
  assert.equal(feeWords(swapFee(slot0(1n, 0, 512125, 500), false).total), N.pay_usdc_total_fee.text);
  // The Contracts page lists them among the outside contracts.
  const outside = fs.readFileSync(new URL("../src/docs/diagrams/contracts.tsx", import.meta.url), "utf8");
  for (const k of ["addr_quoter", "addr_pool4_hook", "addr_usdc"]) assert.match(outside, new RegExp(`key: "${k}"`));
});
