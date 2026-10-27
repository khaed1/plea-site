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
