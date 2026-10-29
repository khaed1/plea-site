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
  gasHeld,
  impactBps,
  impactWords,
  IMPACT_CONFIRM_BPS,
  perUnit,
  rateLine,
  feeWords,
  fitFees,
  gasReserve,
  hopKey,
  marketTip,
  PAY_KEY,
  PAY_PAIR,
  payChoices,
  poolId,
  quoteToImd,
  readHopFees,
  readRouteFees,
  rememberPay,
  ROUTE_GAS,
  routeFees,
  routeLine,
  routeRefusal,
  routeToImd,
  slot0Slot,
  storedPay,
  swapFee,
  TIP_BLOCKS,
  TIP_PERCENTILE,
  WALLET_TIP,
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

// RT3-1: the tip a routed ETH buy is sent with is the market's. Read-only on 2026-10-29 (publicnode,
// mevblocker, flashbots and tenderly gave the same history): eth_feeHistory(20, latest, [75]) from block
// 26,300,031, base fee 0.2818 gwei; eth_maxPriorityFeePerGas 46,119 wei (tenderly 0); MetaMask's gas API
// (suggestedGasFees) medium: a 2 gwei tip and a 2.403 gwei max fee. The old floor sent 2 gwei always.
const LIVE = {
  base: 281_790_934n,
  nodeTip: 46_119n,
  p75: ["797724960", "117363492", "770142227", "1000000000", "1000000000", "2000000000", "770142227", "376368987", "503920899", "719473710", "443770526", "676938154", "268632675", "207377383", "1000000000", "600000000", "1000000000", "417979799", "718059978", "718209066"].map(BigInt),
  ratio: [0.356, 0.209, 0.666, 0.448, 0.424, 0.319, 0.407, 0.46, 0.501, 0.376, 0.312, 0.361, 0.403, 0.271, 0.608, 0.495, 0.421, 0.506, 0.498, 0.51],
  metaMaskTip: 2_000_000_000n,
  metaMaskMaxFee: 2_402_961_036n,
};
const history = (p75, ratio = p75.map(() => 0.5)) => ({ reward: p75.map((t) => [t]), gasUsedRatio: ratio });

test("RT3-1: the tip is the market's: the median of the last 20 blocks' 75th percentile tips, at least the node's; 2 gwei without a history", async () => {
  assert.deepEqual([TIP_BLOCKS, TIP_PERCENTILE], [20, 75]);
  // The live window: 0.718 gwei (the 10th and 11th of the 20 sorted, averaged), not 2 gwei.
  const live = marketTip(history(LIVE.p75, LIVE.ratio), LIVE.nodeTip);
  assert.equal(live, 718_134_522n);
  // An odd count takes the middle one; a block with no transactions (gas used 0, reward 0) says nothing.
  assert.equal(marketTip(history([5n, 1n, 3n]), 0n), 3n);
  assert.equal(marketTip(history([0n, 5n, 1n, 3n], [0, 0.5, 0.5, 0.5]), 0n), 3n);
  // At least the node's own suggestion.
  assert.equal(marketTip(history([5n, 1n, 3n]), 4n), 4n);
  // No history (the call failed, or only empty blocks): a wallet's own tip, or the node's if higher.
  assert.equal(marketTip(undefined, LIVE.nodeTip), WALLET_TIP);
  assert.equal(marketTip(history([0n, 0n], [0, 0]), 0n), WALLET_TIP);
  assert.equal(marketTip({ gasUsedRatio: [0.5] }, 0n), WALLET_TIP);
  assert.equal(marketTip(undefined, 3n * 10n ** 9n), 3n * 10n ** 9n);
  // readRouteFees asks for exactly that window, and falls back when a read fails.
  let asked;
  const client = (o = {}) => ({
    getBlock: async () => ({ baseFeePerGas: LIVE.base }),
    estimateMaxPriorityFeePerGas: o.noNode ? async () => { throw Error("no"); } : async () => LIVE.nodeTip,
    getFeeHistory: o.noHistory ? async () => { throw Error("no"); } : async (a) => ((asked = a), history(LIVE.p75, LIVE.ratio)),
  });
  const fees = await readRouteFees(client());
  assert.deepEqual(asked, { blockCount: 20, rewardPercentiles: [75] });
  assert.deepEqual(fees, { baseFee: LIVE.base, maxFeePerGas: 2n * LIVE.base + live, maxPriorityFeePerGas: live });
  assert.deepEqual(await readRouteFees(client({ noNode: true })), fees);
  assert.equal((await readRouteFees(client({ noHistory: true }))).maxPriorityFeePerGas, WALLET_TIP);
  assert.deepEqual(
    await readRouteFees({ getBlock: async () => ({ baseFeePerGas: null }), estimateMaxPriorityFeePerGas: async () => { throw Error("no"); }, getFeeHistory: async () => { throw Error("no"); } }),
    { baseFee: 0n, maxFeePerGas: WALLET_TIP, maxPriorityFeePerGas: WALLET_TIP },
  );
  // What a buy pays in tips at the 570,000 to 980,000 gas it uses: 0.0004 to 0.0007 ETH, not 0.0011 to 0.0020.
  assert.equal(980_000n * live, 703_771_831_560_000n);
  assert.equal(980_000n * WALLET_TIP, 1_960_000_000_000_000n);
});

test("RT3-1: Max keeps 2.4M gas at twice the base fee plus the larger of the tip sent and a wallet's own 2 gwei; the send fits the fees it actually sends", () => {
  const gwei = 10n ** 9n,
    tip = 718_134_522n,
    fees = routeFees(LIVE.base, tip);
  assert.deepEqual(fees, { baseFee: LIVE.base, maxFeePerGas: 2n * LIVE.base + tip, maxPriorityFeePerGas: tip });
  // The reserve covers a wallet that ignores the site's fees and uses its own default (MetaMask: 2 gwei).
  assert.equal(gasReserve(fees), ROUTE_GAS * (2n * LIVE.base + WALLET_TIP)); // 0.0061526 ETH
  assert.equal(gasReserve(fees), 6_152_596_483_200_000n);
  const limit = (1_729_778n * 130n + 99n) / 100n; // the site's gas limit: 1.3 x the fork's estimate
  assert.ok(limit <= ROUTE_GAS);
  assert.ok(gasReserve(fees) >= limit * LIVE.metaMaskMaxFee, "covers what MetaMask's own fee holds");
  // The fees sent hold less: ROUTE_GAS at their own max fee.
  assert.equal(gasHeld(fees), ROUTE_GAS * fees.maxFeePerGas);
  assert.ok(gasHeld(fees) < gasReserve(fees));
  // A tip above the wallet's own: the reserve follows it.
  assert.equal(gasReserve(routeFees(LIVE.base, 5n * gwei)), ROUTE_GAS * (2n * LIVE.base + 5n * gwei));
  // Max leaves the reserve; the fees go as they are.
  const balance = 5n * 10n ** 16n,
    paid = ethMax(balance, gasReserve(fees));
  assert.equal(paid, 438n * 10n ** 14n, "0.05 ETH: Max 0.0438, 0.0062 kept");
  assert.equal(fitFees(fees, balance - paid), fees);
  assert.equal(ethMax(2n * 10n ** 18n + 123_456_789n, gasReserve(fees)), 19_938n * 10n ** 14n, "rounded down: the field shows what is paid");
  assert.equal(ethMax(gasReserve(fees), gasReserve(fees)), 0n, "nothing to spend once the gas is kept");
  // A typed amount that leaves less than Max keeps but still covers the fees sent: sent as they are.
  assert.equal(fitFees(fees, gasHeld(fees)), fees);
  // Less than that: the max fee is lowered to what is left, down to the base fee plus the tip.
  assert.deepEqual(fitFees(fees, gasHeld(fees) - 1n), { ...fees, maxFeePerGas: fees.maxFeePerGas - 1n });
  const least = ROUTE_GAS * (LIVE.base + tip);
  assert.deepEqual(fitFees(fees, least), { ...fees, maxFeePerGas: LIVE.base + tip });
  // Below it nothing is sent (the page says too little ETH is left), and a negative remainder too.
  assert.equal(fitFees(fees, least - 1n), undefined);
  assert.equal(fitFees(fees, -1n), undefined);
  // The base fee rose 1.5x and 2.25x since Max: Max's reserve still covers the fees then (it keeps room
  // for twice the base fee plus 2 gwei); at 2.25x the max fee is lowered, never below the base fee plus the tip.
  const kept = gasReserve(fees);
  const up15 = routeFees((LIVE.base * 3n) / 2n, tip), up225 = routeFees((LIVE.base * 9n) / 4n, tip);
  assert.equal(fitFees(up15, kept), up15);
  assert.equal(fitFees(up225, kept), up225, "2 x 2.25 x 0.28 + 0.72 = 1.99 gwei, under the 2.56 gwei kept");
  const steep = routeFees(LIVE.base * 6n, tip); // 1.69 gwei: 2 x base + tip is 4.1 gwei, more than the 2.56 kept
  assert.deepEqual(fitFees(steep, kept), { ...steep, maxFeePerGas: kept / ROUTE_GAS });
  assert.equal(fitFees(routeFees(LIVE.base * 7n, tip), kept), undefined, "1.97 gwei + 0.72: more than the 2.56 kept");
});

test("RT3-1: the page sends the fees with a routed ETH buy only, from a fresh read of the fees and the balance", () => {
  const page = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(page, /native \? readRouteFees\(r\.client\) : undefined,\s*native \? r\.client\.getBalance\(\{ address: address! \}\) : undefined,/);
  assert.match(page, /const fit = fees && eth !== undefined \? fitFees\(fees, eth - raw\) : undefined;\s*if \(native && !fit\) \{\s*setRevision\(\(n\) => n \+ 1\);\s*setMaxNote\(""\);\s*throw new DisplayError\(fundsMessage\(eth! - raw, fees, eth\)\);/);
  // The refusal rereads the fees and the balance (so Max keeps enough again), and the wallet's own refusal keeps its words.
  assert.match(page, /readRouteFees\(r\.client\),\s*\[address, revision\],/);
  assert.match(page, /\[address, route\?\.symbol, revision\],\s*!!address && !!s && !!route,/);
  assert.match(page, /\[NO_FUNDS\]: fundsMessage\(\)/);
  assert.match(page, /\.\.\.\(fit && \{\s*maxFeePerGas: fit\.maxFeePerGas,\s*maxPriorityFeePerGas: fit\.maxPriorityFeePerGas,\s*\}\)/);
  assert.match(page, /reserve = gasFees\.data \? gasReserve\(gasFees\.data\) : undefined/);
  // useTx gives the fees to the wallet only: an eth_call with a max fee checks the balance against the
  // node's whole gas cap (50M gas on geth).
  const ctx = fs.readFileSync(new URL("../src/context.tsx", import.meta.url), "utf8");
  assert.match(ctx, /const \{\s*maxFeePerGas,\s*maxPriorityFeePerGas,\s*\.\.\.req\s*\}: NonNullable<typeof prepared> = prepared \|\|/);
  assert.match(ctx, /await r\.client\.call\(\{ \.\.\.req, account: address \}\);\s*const estimate = await r\.client\.estimateGas\(\{ \.\.\.req, account: address \}\);/);
  assert.match(ctx, /wallet\.sendTransaction\(\{\s*\.\.\.req,\s*\.\.\.\(maxFeePerGas !== undefined && \{ maxFeePerGas, maxPriorityFeePerGas \}\),/);
  // The docs' numbers are pay.ts's.
  const N = JSON.parse(fs.readFileSync(new URL("../src/docs/numbers.json", import.meta.url)));
  assert.equal(BigInt(N.pay_wallet_tip.value), WALLET_TIP);
  assert.equal(BigInt(N.pay_route_gas.value), ROUTE_GAS);
  assert.equal(Number(N.pay_tip_blocks.value), TIP_BLOCKS);
  assert.equal(N.pay_tip_percentile.text, `${TIP_PERCENTILE}th percentile`);
});

test("the Buy page: Pay with IMD first and by default; ETH or USDC only once picked, remembered per browser; IMD for the seed's opening buy and for every sale", () => {
  assert.equal(PAY_KEY, "plea-pay-with");
  assert.deepEqual(payChoices(eth.pay.routes), [PAY_PAIR, "ETH", "USDC"]);
  assert.deepEqual(payChoices([]), [PAY_PAIR]);
  const store = (v) => {
    const m = new Map(v === undefined ? [] : [[PAY_KEY, v]]);
    return () => ({ getItem: (k) => m.get(k) ?? null, setItem: (k, x) => m.set(k, String(x)), m });
  };
  const blocked = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  const routes = eth.pay.routes;
  // A first visit, an empty or blocked storage, or a choice this network does not have: IMD.
  assert.equal(storedPay(routes, store()), PAY_PAIR);
  assert.equal(storedPay(routes, store("")), PAY_PAIR);
  assert.equal(storedPay(routes, blocked), PAY_PAIR);
  assert.equal(storedPay(routes, () => ({ getItem: () => { throw Error("denied"); } })), PAY_PAIR);
  assert.equal(storedPay(routes, store("DAI")), PAY_PAIR);
  assert.equal(storedPay(routes, store(PAY_PAIR)), PAY_PAIR);
  assert.equal(storedPay([], store("ETH")), PAY_PAIR, "Sepolia: no routes, IMD only");
  // A choice the visitor made: kept.
  assert.equal(storedPay(routes, store("ETH")), "ETH");
  assert.equal(storedPay(routes, store("USDC")), "USDC");
  // Picking stores it; a blocked or full storage is no error.
  const s1 = store();
  assert.equal(storedPay(routes, s1), PAY_PAIR);
  assert.equal(s1().m.size, 0, "nothing is stored until the visitor picks");
  rememberPay("USDC", s1);
  assert.equal(s1().m.get(PAY_KEY), "USDC");
  assert.equal(storedPay(routes, s1), "USDC");
  assert.doesNotThrow(() => rememberPay("ETH", blocked));
  assert.doesNotThrow(() => rememberPay("ETH", () => ({ setItem: () => { throw new DOMException("full", "QuotaExceededError"); } })));
  // The page: the chips in payChoices' order, the start from storedPay, a write only on a pick, IMD for
  // the seed's opening buy (not stored), and no route on a sale.
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /useState\(\(\) => storedPay\(routes\)\)/);
  assert.match(src, /\{payChoices\(routes\)\.map\(\(v\) => \(/);
  assert.match(src, /if \(remember\) rememberPay\(v\);/);
  assert.equal((src.match(/rememberPay\(/g) || []).length, 1);
  assert.doesNotMatch(src, /localStorage/);
  assert.match(src, /choosePay\(PAY_PAIR, false\);\s*setInput\(formatUnits\(con\(s, "PleaHook\.PAYOUT_RESERVE"\), 18\)\)/);
  assert.match(src, /const route = selling \? undefined : routes\.find/);
  // The words: IMD is the main way, ETH and USDC extra options.
  assert.match(src, /`\$\{pair\} buys PLEA directly in PLEA’s pool: the main way to buy\. \$\{routes\.map\(\(x\) => x\.symbol\)\.join\(" and "\)\} are extra options, turned into \$\{pair\} in the same transaction\.`/);
  assert.match(src, /`An extra option: \$\{routeLine\(/);
  const site = fs.readFileSync(new URL("../src/site.ts", import.meta.url), "utf8");
  assert.doesNotMatch(site, /first route is the\s*\*?\s*default/);
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

// RT2-1: the impact in what the buyer gets. "8.13% below the pool's price" read like a discount, but 8.13%
// less IMD is about 8.9% more paid for each IMD; USDC's route has two pools.
test("RT2-1: the price impact's words say the buy gets less IMD than at the pool's price (the pools' prices for USDC)", () => {
  assert.equal(impactWords(ETH_ROUTE, "IMD", 813), "8.13% less IMD than at the pool’s price");
  assert.equal(impactWords(USDC_ROUTE, "IMD", 661), "6.61% less IMD than at the pools’ prices");
  assert.equal(impactWords(ETH_ROUTE, "IMD", 300), "3.00% less IMD than at the pool’s price");
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /`Tick “Buy anyway” above to get \$\{impactWords\(route!, pair, impact\)\}, or lower the amount\.`/);
  assert.match(src, /title=\{`This buy gets \$\{impactWords\(route, pair, impact\)\}\.`\}/);
  assert.match(src, /Buy anyway, getting \{pct\(impact\)\} less \{pair\}/);
  assert.doesNotMatch(src, /below the pool’s price|less \$\{pair\} than the pool’s price/);
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
  // RT2-3: "about": in the launch window the page's reloaded quote is a little higher (its launch fee read later).
  assert.match(src, /title: `The price moved: the new quote is about \$\{tokenAmount\(fresh, s, selling\)\}\.`/);
  assert.doesNotMatch(src, /the new quote is ≈/);
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
  assert.match(src, /\.\.\.\(native \? \{ \[NO_FUNDS\]: fundsMessage\(\) \} : \{\}\)/);
  assert.match(src, /title: "Not bought: too little ETH is left for the gas\."/);
});

test("RT1-7: a wallet with none of the paying currency is told to add it or pay with another", () => {
  const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
  assert.match(src, /available === 0n\s*\?[\s\S]{0,160}?`You have \$\{payAmount\(0n\)\}\. Add \$\{unit\}\$\{others\.length \? `, or pay with \$\{others\.join\(" or "\)\}` : ""\}\.`/);
  // The pool currency first: "Add ETH, or pay with IMD or USDC."
  assert.match(src, /const others = routes\.length\s*\? payChoices\(routes\)\s*\.map\(\(v\) => \(v === PAY_PAIR \? pair : v\)\)\s*\.filter\(\(v\) => v !== unit\)/);
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
  assert.match(buying, /"The price moved: the new quote is about …"/);
  assert.match(buying, /From \{\{pay_impact_confirm\}\} below, it asks you to tick "Buy anyway" first\./);
});
