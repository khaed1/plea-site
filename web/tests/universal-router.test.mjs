import test from "node:test";
import assert from "node:assert/strict";
import { decodeAbiParameters, decodeFunctionData, encodeFunctionData } from "viem";
import {
  encodeBuy,
  encodeSell,
  permit2Spendable,
  universalRouterAbi,
} from "../src/universal-router.ts";

const IMD = "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7",
  PLEA = "0x267f755d6bc38d145f4b4bf74130c5f638e41720",
  HOOK = "0xa2fa389268344712b1ef1e1046a74bf16952e8cc",
  BUYER = "0x1111111111111111111111111111111111111111",
  key = { currency0: PLEA, currency1: IMD, fee: 0, tickSpacing: 60, hooks: HOOK },
  v21 = { address: "0x23617e59a5925b2a4bf75d73ff6711cd0b29de85", minHopPrice: true },
  v2 = { address: "0x66a9893cc07d91d95644aedd05d03f95e1dba8af", minHopPrice: false };
const keyT = {
  type: "tuple",
  components: [
    { name: "currency0", type: "address" },
    { name: "currency1", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
  ],
};
const swapT = (hop) => ({
  type: "tuple",
  components: [
    { name: "poolKey", ...keyT },
    { name: "zeroForOne", type: "bool" },
    { name: "amountIn", type: "uint128" },
    { name: "amountOutMinimum", type: "uint128" },
    ...(hop ? [{ name: "minHopPriceX36", type: "uint256" }] : []),
    { name: "hookData", type: "bytes" },
  ],
});
const split = (input) => decodeAbiParameters([{ type: "bytes" }, { type: "bytes[]" }], input);

test("a buy is V4_SWAP then BALANCE_CHECK_ERC20 on the buyer's PLEA, minimum in the check only", () => {
  for (const router of [v21, v2]) {
    const { commands, inputs } = encodeBuy({
      router, key, imd: IMD, buyer: BUYER, amountIn: 2n * 10n ** 18n, minPleaOut: 80_000n * 10n ** 18n, pleaBalance: 5n,
    });
    assert.equal(commands, "0x100e");
    const [actions, params] = split(inputs[0]);
    assert.equal(actions, "0x060c0f");
    const [swap] = decodeAbiParameters([swapT(router.minHopPrice)], params[0]);
    assert.equal(swap.zeroForOne, false, "IMD is currency1 here: a buy pays currency1");
    assert.equal(swap.amountIn, 2n * 10n ** 18n);
    assert.equal(swap.amountOutMinimum, 0n, "the hook takes the PLEA to the buyer: the router sees 0");
    if (router.minHopPrice) assert.equal(swap.minHopPriceX36, 0n);
    assert.equal(decodeAbiParameters([{ type: "address" }], swap.hookData)[0].toLowerCase(), BUYER);
    const [payTok, payMax] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[1]);
    assert.equal(payTok.toLowerCase(), IMD);
    assert.equal(payMax, 2n * 10n ** 18n, "SETTLE_ALL pays at most the amount in");
    const [tok, min] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[2]);
    assert.equal(tok.toLowerCase(), PLEA);
    assert.equal(min, 0n);
    const [owner, token, minBalance] = decodeAbiParameters([{ type: "address" }, { type: "address" }, { type: "uint256" }], inputs[1]);
    assert.equal(owner.toLowerCase(), BUYER);
    assert.equal(token.toLowerCase(), PLEA);
    assert.equal(minBalance, 5n + 80_000n * 10n ** 18n);
  }
});

test("the two router versions differ only by minHopPriceX36", () => {
  const a = encodeBuy({ router: v21, key, imd: IMD, buyer: BUYER, amountIn: 1n, minPleaOut: 1n, pleaBalance: 0n });
  const b = encodeBuy({ router: v2, key, imd: IMD, buyer: BUYER, amountIn: 1n, minPleaOut: 1n, pleaBalance: 0n });
  assert.equal(split(a.inputs[0])[1][0].length - split(b.inputs[0])[1][0].length, 64, "one extra word");
  assert.equal(a.inputs[1], b.inputs[1]);
});

test("a buy with IMD as currency0 swaps zeroForOne", () => {
  const k0 = { ...key, currency0: IMD, currency1: PLEA };
  const { inputs } = encodeBuy({ router: v21, key: k0, imd: IMD, buyer: BUYER, amountIn: 1n, minPleaOut: 0n, pleaBalance: 0n });
  const [swap] = decodeAbiParameters([swapT(true)], split(inputs[0])[1][0]);
  assert.equal(swap.zeroForOne, true);
});

test("a sell settles PLEA and takes IMD with the minimum, in the swap and the take", () => {
  const { commands, inputs } = encodeSell({ router: v21, key, imd: IMD, seller: BUYER, amountIn: 7n, minImdOut: 3n });
  assert.equal(commands, "0x10");
  const [actions, params] = split(inputs[0]);
  assert.equal(actions, "0x060c0f");
  const [swap] = decodeAbiParameters([swapT(true)], params[0]);
  assert.equal(swap.zeroForOne, true, "PLEA is currency0 here: a sell pays currency0");
  assert.equal(swap.amountOutMinimum, 3n);
  const [inTok, inAmt] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[1]);
  assert.equal(inTok.toLowerCase(), PLEA);
  assert.equal(inAmt, 7n);
  const [outTok, outMin] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[2]);
  assert.equal(outTok.toLowerCase(), IMD);
  assert.equal(outMin, 3n);
});

test("execute calldata round-trips through the router ABI", () => {
  const { commands, inputs } = encodeBuy({ router: v21, key, imd: IMD, buyer: BUYER, amountIn: 1n, minPleaOut: 1n, pleaBalance: 0n });
  const data = encodeFunctionData({ abi: universalRouterAbi, functionName: "execute", args: [commands, inputs, 99n] });
  const back = decodeFunctionData({ abi: universalRouterAbi, data });
  assert.equal(back.functionName, "execute");
  assert.equal(back.args[2], 99n);
});

test("a Permit2 allowance counts only until it expires", () => {
  assert.equal(permit2Spendable([10n, 2000, 0], 1999), 10n);
  assert.equal(permit2Spendable([10n, 2000, 0], 2000), 0n);
  assert.equal(permit2Spendable({ amount: 4n, expiration: 0 }, 1), 0n);
});

// ---- Pay with ETH or USDC (encodeBuyVia): the calldata the fork of PLEA's real deployment proved ----
// tools/mainnet/eth-buy.mjs, 2026-10-29: 0.05 ETH → 25.379 IMD (IMD's ETH pool) → 1,236,235.5397 PLEA,
// exactly a direct 25.379 IMD buy; 150 USDC → (USDC/ETH 0.05%) → 32.285 IMD → 1,571,961.33 PLEA.
import { encodeAbiParameters, encodePacked } from "viem";
import { encodeBuyVia, NATIVE, v4QuoterAbi } from "../src/universal-router.ts";
const REAL = {
  PLEA: "0x1f158929496162b53fb232536468948e25170ab3",
  HOOK: "0xf1122bc96adea8768cff2badf02b6d4594f928cc",
  POOL4: "0xc6c965bd164c483e87d0b550671798e9a3602840",
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
};
const buyerData = encodeAbiParameters([{ type: "address" }], [BUYER]);
const ethPath = [
  { intermediateCurrency: IMD, fee: 10000, tickSpacing: 60, hooks: REAL.POOL4, hookData: "0x" },
  { intermediateCurrency: REAL.PLEA, fee: 0, tickSpacing: 60, hooks: REAL.HOOK, hookData: buyerData },
];
const usdcPath = [
  { intermediateCurrency: NATIVE, fee: 500, tickSpacing: 10, hooks: NATIVE, hookData: "0x" },
  ...ethPath,
];
const pathKeyT = {
  type: "tuple[]",
  components: [
    { name: "intermediateCurrency", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
    { name: "hookData", type: "bytes" },
  ],
};
const exactInT = (hop) => ({
  type: "tuple",
  components: [
    { name: "currencyIn", type: "address" },
    { name: "path", ...pathKeyT },
    ...(hop ? [{ name: "minHopPriceX36", type: "uint256[]" }] : []),
    { name: "amountIn", type: "uint128" },
    { name: "amountOutMinimum", type: "uint128" },
  ],
});
/** eth-buy.mjs's own encoding, written out independently of src/universal-router.ts. */
function forkEncoding(currencyIn, path, amountIn, minimumBalance, hop = true) {
  const params = { currencyIn, path, ...(hop ? { minHopPriceX36: path.map(() => 0n) } : {}), amountIn, amountOutMinimum: 0n };
  const swap = encodeAbiParameters([exactInT(hop)], [params]);
  const settle = encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [currencyIn, amountIn]);
  const take = encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [REAL.PLEA, 0n]);
  const check = encodeAbiParameters([{ type: "address" }, { type: "address" }, { type: "uint256" }], [BUYER, REAL.PLEA, minimumBalance]);
  const input = encodeAbiParameters([{ type: "bytes" }, { type: "bytes[]" }], [encodePacked(["uint8", "uint8", "uint8"], [0x07, 0x0c, 0x0f]), [swap, settle, take]]);
  return { commands: "0x100e", inputs: [input, check] };
}

test("an ETH buy is the fork's calldata byte for byte: SWAP_EXACT_IN over IMD's ETH pool then PLEA's, ETH as the value", () => {
  const amountIn = 5n * 10n ** 16n, min = 1_223_873n * 10n ** 18n, held = 7n;
  const got = encodeBuyVia({ router: v21, currencyIn: NATIVE, path: ethPath, plea: REAL.PLEA, buyer: BUYER, amountIn, minPleaOut: min, pleaBalance: held });
  const want = forkEncoding(NATIVE, ethPath, amountIn, held + min);
  assert.equal(got.commands, want.commands);
  assert.deepEqual(got.inputs, want.inputs);
  assert.equal(got.value, amountIn, "native ETH is paid as msg.value, no approval");
  // Decoded: the actions, the path, one zero minimum hop price per hop, the settle and the take.
  const [actions, params] = split(got.inputs[0]);
  assert.equal(actions, "0x070c0f");
  const [swap] = decodeAbiParameters([exactInT(true)], params[0]);
  assert.equal(swap.currencyIn, NATIVE);
  assert.equal(swap.path.length, 2);
  assert.equal(swap.path[0].intermediateCurrency.toLowerCase(), IMD);
  assert.deepEqual([swap.path[0].fee, swap.path[0].tickSpacing, swap.path[0].hooks.toLowerCase(), swap.path[0].hookData], [10000, 60, REAL.POOL4, "0x"]);
  assert.equal(swap.path[1].intermediateCurrency.toLowerCase(), REAL.PLEA);
  assert.equal(decodeAbiParameters([{ type: "address" }], swap.path[1].hookData)[0].toLowerCase(), BUYER, "PLEA's hop names the buyer");
  assert.deepEqual(swap.minHopPriceX36, [0n, 0n]);
  assert.equal(swap.amountIn, amountIn);
  assert.equal(swap.amountOutMinimum, 0n, "the router sees 0 PLEA while the Cabal lives: the minimum is the balance check");
  assert.deepEqual(decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[1]), [NATIVE, amountIn]);
  const [takeTok, takeMin] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[2]);
  assert.deepEqual([takeTok.toLowerCase(), takeMin], [REAL.PLEA, 0n]);
  const [owner, token, minBalance] = decodeAbiParameters([{ type: "address" }, { type: "address" }, { type: "uint256" }], got.inputs[1]);
  assert.deepEqual([owner.toLowerCase(), token.toLowerCase(), minBalance], [BUYER, REAL.PLEA, held + min]);
});

test("a USDC buy adds the USDC/ETH hop first, settles USDC (through Permit2: no value) and keeps the same check", () => {
  const amountIn = 150n * 10n ** 6n;
  const got = encodeBuyVia({ router: v21, currencyIn: REAL.USDC, path: usdcPath, plea: REAL.PLEA, buyer: BUYER, amountIn, minPleaOut: 1n, pleaBalance: 0n });
  assert.deepEqual(got.inputs, forkEncoding(REAL.USDC, usdcPath, amountIn, 1n).inputs);
  assert.equal(got.value, 0n);
  const [, params] = split(got.inputs[0]);
  const [swap] = decodeAbiParameters([exactInT(true)], params[0]);
  assert.deepEqual(swap.path.map((p) => p.intermediateCurrency.toLowerCase()), [NATIVE, IMD, REAL.PLEA]);
  assert.deepEqual([swap.path[0].fee, swap.path[0].tickSpacing, swap.path[0].hooks], [500, 10, NATIVE]);
  assert.deepEqual(swap.minHopPriceX36, [0n, 0n, 0n]);
  const [settleTok, settleMax] = decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[1]);
  assert.deepEqual([settleTok.toLowerCase(), settleMax], [REAL.USDC, amountIn], "SETTLE_ALL pays at most the USDC in");
});

test("a routed buy on a v2 router leaves out minHopPriceX36, and refuses a path that does not end in PLEA", () => {
  const a = encodeBuyVia({ router: v21, currencyIn: NATIVE, path: ethPath, plea: REAL.PLEA, buyer: BUYER, amountIn: 1n, minPleaOut: 0n, pleaBalance: 0n });
  const b = encodeBuyVia({ router: v2, currencyIn: NATIVE, path: ethPath, plea: REAL.PLEA, buyer: BUYER, amountIn: 1n, minPleaOut: 0n, pleaBalance: 0n });
  assert.deepEqual(b.inputs, forkEncoding(NATIVE, ethPath, 1n, 0n, false).inputs);
  // One offset word and one length word, plus a word per hop.
  assert.equal(split(a.inputs[0])[1][0].length - split(b.inputs[0])[1][0].length, 64 * (2 + ethPath.length));
  assert.throws(
    () => encodeBuyVia({ router: v21, currencyIn: NATIVE, path: ethPath.slice(0, 1), plea: REAL.PLEA, buyer: BUYER, amountIn: 1n, minPleaOut: 0n, pleaBalance: 0n }),
    /must end in PLEA/,
  );
});

test("the routed execute round-trips through the router ABI with its value", () => {
  const { commands, inputs, value } = encodeBuyVia({ router: v21, currencyIn: NATIVE, path: ethPath, plea: REAL.PLEA, buyer: BUYER, amountIn: 9n, minPleaOut: 1n, pleaBalance: 0n });
  const data = encodeFunctionData({ abi: universalRouterAbi, functionName: "execute", args: [commands, inputs, 99n] });
  const back = decodeFunctionData({ abi: universalRouterAbi, data });
  assert.deepEqual(back.args, [commands, inputs, 99n]);
  assert.equal(value, 9n);
  // The Quoter's quoteExactInput takes the same path keys (selector 0xca253dc9, in the dispatcher of
  // Uniswap's V4Quoter 0x52f0…1203 on Ethereum).
  const q = encodeFunctionData({ abi: v4QuoterAbi, functionName: "quoteExactInput", args: [{ exactCurrency: NATIVE, path: ethPath.slice(0, 1), exactAmount: 9n }] });
  assert.equal(q.slice(0, 10), "0xca253dc9");
});
