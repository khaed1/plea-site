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
  atPoolPrice,
  buyPath,
  ethMax,
  impactBps,
  IMPACT_CONFIRM_BPS,
  perUnit,
  rateLine,
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
  // The price too (Slot0's low 160 bits), for the route's price impact.
  assert.deepEqual(fees.map((f) => f.sqrtPriceX96), [1n, 1n]);
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

// RT1-3: the IMD a route's pools give at their current prices after their fees, against the Quoter's
// quote, is the buy's price impact. Slot0 words and the Quoter's IMD read on a fork of PLEA's deployment
// (block 26,294,880, IMD's ETH pool untouched).
test("RT1-3: the price impact is the Quoter's IMD against the pools' price after their fees; from 3% the Buy page asks", () => {
  const hop = (route, i, word) => ({ pool: route.path[i].pool, ...swapFee(BigInt(word), hopKey(route, i).zeroForOne), sqrtPriceX96: BigInt(word) & ((1n << 160n) - 1n) });
  const imdWord = "0x00000000271000000000f3de0000000000000016ad7c093340cb1de39b7bcfe3",
    usdcWord = "0x0000000001f407d07dfcf7ea000000000000000000032e2502e7cfbcdc6daf82";
  const ethHops = [hop(ETH_ROUTE, 0, imdWord)],
    usdcHops = [hop(USDC_ROUTE, 0, usdcWord), hop(USDC_ROUTE, 1, imdWord)];
  const E = 10n ** 18n;
  // 0.0001 ETH: the pool's price (after its 1%) and the Quoter differ by 0.0006%, rounded up to 0.01%.
  assert.equal(atPoolPrice(10n ** 14n, ETH_ROUTE, ethHops), 50913412405059880n);
  assert.equal(impactBps(50913102525459520n, 50913412405059880n), 1);
  // 0.05 ETH: 25.379 IMD against 25.457 at the pool's price, 0.31%. 1 ETH: 479.92 against 509.13, 5.74%.
  assert.equal(atPoolPrice(5n * 10n ** 16n, ETH_ROUTE, ethHops), 25456706202529940150n);
  assert.equal(impactBps(25379470875060206126n, 25456706202529940150n), 31);
  const one = atPoolPrice(E, ETH_ROUTE, ethHops);
  assert.equal(one, 509134124050598803008n);
  assert.equal(impactBps(479923842022559961005n, one), 574);
  // USDC goes through the USDC/ETH pool (0.0625% that way) first: 150 USDC 0.39%, 1000 USDC 2.53%.
  assert.equal(atPoolPrice(150n * 10n ** 6n, USDC_ROUTE, usdcHops), 32410719390656882521n);
  assert.equal(impactBps(32285072063215839881n, 32410719390656882521n), 39);
  assert.equal(impactBps(210607176848392859922n, atPoolPrice(1000n * 10n ** 6n, USDC_ROUTE, usdcHops)), 253);
  // A quote at or above the pools' price has no impact.
  assert.equal(impactBps(one, one), 0);
  assert.equal(impactBps(one + 1n, one), 0);
  // Per whole unit, whatever the currency's decimals.
  assert.equal(perUnit(479923842022559961005n, E, 18), 479923842022559961005n);
  assert.equal(perUnit(32285072063215839881n, 150n * 10n ** 6n, 6), 215233813754772265n);
  assert.equal(perUnit(1n, 0n, 18), 0n);
  // The words: the rate, the gap and the pools' price after their fees.
  assert.equal(
    rateLine(ETH_ROUTE, "IMD", E, 479923842022559961005n, one),
    "≈ 479.92 IMD per ETH, 5.74% below the price of IMD’s ETH pool (509.13 after its fee).",
  );
  assert.equal(
    rateLine(USDC_ROUTE, "IMD", 150n * 10n ** 6n, 32285072063215839881n, 32410719390656882521n),
    "≈ 0.2152 IMD per USDC, 0.39% below the prices of Uniswap’s USDC/ETH pool and IMD’s ETH pool (0.2160 after their fees).",
  );
  assert.doesNotMatch(rateLine(USDC_ROUTE, "IMD", 1n, 1n, 2n), /mainnet|chain id 1\b/i);
  // The Buy page asks from 3% (the docs' number), so 1 ETH on this fork asks and 0.05 ETH does not.
  assert.equal(IMPACT_CONFIRM_BPS, 300);
  const N = JSON.parse(fs.readFileSync(new URL("../src/docs/numbers.json", import.meta.url)));
  assert.equal(Number(N.pay_impact_confirm.value), IMPACT_CONFIRM_BPS);
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /confirmImpact = !tradeDone && impact >= IMPACT_CONFIRM_BPS/);
  assert.match(src, /confirmImpact && !impactAccepted\s*\?\s*`Tick “Buy anyway”/);
  // The confirmation holds for this amount in this currency only.
  assert.match(src, /impactKey = `\$\{raw\}:\$\{route\?\.symbol \?\? ""\}`/);
});

// RT1-1: the minimum a trade is sent with is the one the page showed at the click. The fork's case: the
// page showed ≈ 3,044,008 PLEA (1% minimum 3,013,568); another wallet's 1 ETH buy was mined; the fresh
// quote at the click was 2,651,744. The old code sent 1% under the fresh quote, 2,625,227.
test("RT1-1: the send keeps the page's minimum; a fresh quote below it sends nothing and shows the new quote", async () => {
  const { sendMinimum, minimumOf } = await import("../src/swap-math.ts");
  const E = 10n ** 18n,
    shown = 3_044_008n * E,
    fresh = 2_651_744n * E;
  assert.equal(minimumOf(shown, 100), 3_013_567_920n * 10n ** 15n);
  assert.deepEqual(sendMinimum(shown, fresh, 100), { minimum: minimumOf(shown, 100), moved: true });
  // A fresh quote above the minimum: sent with the page's minimum, not one rebuilt from the fresh quote.
  assert.deepEqual(sendMinimum(shown, shown - 10n * E, 100), { minimum: minimumOf(shown, 100), moved: false });
  assert.deepEqual(sendMinimum(shown, shown + 10n ** 24n, 100), { minimum: minimumOf(shown, 100), moved: false });
  assert.equal(sendMinimum(shown, minimumOf(shown, 100), 100).moved, false, "exactly the minimum still buys");
  assert.equal(sendMinimum(shown, minimumOf(shown, 100) - 1n, 100).moved, true);
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  // Every route (ETH, USDC, IMD, and a sale) builds its minimum from the quote shown at the click.
  assert.match(src, /const shown = quote\.data;/);
  assert.match(src, /const \{ minimum, moved \} = sendMinimum\(shown\.out, q\.out, slip\);\s*if \(moved\) \{\s*setRevision\(\(n\) => n \+ 1\);\s*throw new DisplayError\(movedMessage\(q\.out, minimum\)\);/);
  assert.doesNotMatch(src, /q\.out \* BigInt\(10000 - slip\)/);
  assert.match(src, /title: `The price moved: the new quote is ≈ \$\{tokenAmount\(fresh, s, selling\)\}\.`/);
});

test("RT1-2: switching Buy and Sell clears the field and Max, as changing the currency does", () => {
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /if \(selling === v\) return;\s*setSelling\(v\);[\s\S]{0,200}?setInput\(""\);\s*setMaxRaw\(undefined\);\s*setMaxNote\(""\);/);
  assert.doesNotMatch(src, /onClick=\{\(\) => setSelling\(v\)\}/);
});

test("PAY-3: on the ETH route the wallet's insufficient funds reads in the gas reserve's words", async () => {
  const { explainError, NO_FUNDS } = await import("../src/errors.ts");
  const own = { title: "Not bought: too little ETH is left for the gas.", body: "…" };
  const wallet = { message: "insufficient funds for gas * price + value: have 1000000000000000 want 3100000000000000" };
  assert.deepEqual(explainError(wallet, [], { [NO_FUNDS]: own }), own);
  // Without it, the plain gas words.
  assert.match(explainError(wallet).title, /You need (Sepolia )?ETH for gas/);
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /\.\.\.\(native \? \{ \[NO_FUNDS\]: fundsMessage \} : \{\}\)/);
  assert.match(src, /title: "Not bought: too little ETH is left for the gas\."/);
});

test("RT1-7: a wallet with none of the paying currency is told to add it or pay with another", () => {
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /available === 0n\s*\?[\s\S]{0,160}?`You have \$\{payAmount\(0n\)\}\. Add \$\{unit\}\$\{others\.length \? `, or pay with \$\{others\.join\(" or "\)\}` : ""\}\.`/);
  assert.match(src, /const others = routes\.length\s*\? \[\.\.\.routes\.map\(\(x\) => x\.symbol\), pair\]\.filter\(\(v\) => v !== unit\)/);
});

test("RT1-4/5/6: the Sepolia docs say Pay with is Ethereum's; the docs quote the Buy page's own numbers and words", () => {
  const docs = fs.readFileSync(new URL("../src/docs/Docs.tsx", import.meta.url), "utf8");
  assert.match(docs, /\{!site\(\)\.pay &&\s*` Pay with ETH or USDC is Ethereum only: here the Buy page pays with \$\{site\(\)\.pairSymbol\}\.`\}/);
  const buying = fs.readFileSync(new URL("../../docs/02-buying.md", import.meta.url), "utf8"),
    src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  // The worked example rounds the IMD down, as the Buy page and its toast do (25.3486 IMD: 25.348).
  assert.doesNotMatch(buying, /25\.349/);
  assert.match(buying, /it bought 25\.348 IMD/);
  // The launch cap: the Buy page's hint and its refusal, word for word.
  assert.match(src, /one buy can take at most \$\{tokenAmount\(cap, s\)\}\. Pay less \$\{unit\}, or split the buy in two\./);
  assert.match(buying, /one buy can take at most \{\{launch_max_buy\}\}\. Pay less IMD, or split the buy in two\./);
  assert.match(src, /title: `Not bought: more than \$\{tokenAmount\(cap, s\)\} in one buy\.`/);
  assert.match(buying, /"Not bought: more than \{\{launch_max_buy\}\} in one buy\."/);
  assert.doesNotMatch(buying, /This buy exceeds the launch cap/);
  // The price moved before the send, and the price impact's confirmation, in the page's words.
  assert.match(buying, /"The price moved: the new quote is …"/);
  assert.match(buying, /From \{\{pay_impact_confirm\}\} below, it asks you to tick "Buy anyway" first\./);
});
