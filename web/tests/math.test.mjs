import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateHookOutput,
  priceLimit,
  integerSqrt,
  sqrtAtTick,
  wordEnds,
} from "../src/swap-math.ts";
import { explainError } from "../src/errors.ts";
import { parseAbi, encodeErrorResult } from "viem";
const Q = 2n ** 96n,
  L = 10n ** 24n,
  bands = [{ tickLower: -1000, tickUpper: 1000, liquidity: L }];
test("indicative exact-input calculation charges both hook fee legs", () => {
  const input = 10n ** 18n,
    fee = (input * 200n) / 10200n,
    net = input - fee,
    next = (L * Q * Q + L * Q + net * Q - 1n) / (L * Q + net * Q),
    raw = (L * (Q - next)) / Q;
  const { out } = estimateHookOutput({
    amount: input,
    zeroForOne: true,
    sqrt: Q,
    bands,
    inputBps: 200n,
    outputBps: 25n,
  });
  assert.equal(out, raw - (raw * 25n) / 10000n);
  assert.ok(out > 0n && out < input);
});
test("quotes are monotonic and never manufacture value at unit price", () => {
  let last = 0n;
  for (const size of [1n, 10n, 100n, 1000n, 10000n]) {
    const input = size * 10n ** 18n;
    const { out } = estimateHookOutput({
      amount: input,
      zeroForOne: false,
      sqrt: Q,
      bands,
      inputBps: 25n,
      outputBps: 200n,
    });
    assert.ok(out >= last && out < input);
    last = out;
  }
});
test("walks a second liquidity range when crossing its boundary", () => {
  const split = [
    { tickLower: -1000, tickUpper: 0, liquidity: L },
    { tickLower: 0, tickUpper: 1000, liquidity: L },
  ];
  const input = 10n ** 22n,
    params = {
      amount: input,
      zeroForOne: true,
      sqrt: sqrtAtTick(100),
      inputBps: 0n,
      outputBps: 0n,
    };
  const whole = estimateHookOutput({ ...params, bands }).out;
  const pieces = estimateHookOutput({ ...params, bands: split }).out;
  assert.ok(whole >= pieces && whole - pieces <= 3n);
});
test("price slippage is applied to price rather than twice to its square root", () => {
  const down = priceLimit(Q, 100, true),
    up = priceLimit(Q, 100, false);
  assert.ok(down * down <= (Q * Q * 9900n) / 10000n);
  assert.ok((down + 1n) * (down + 1n) > (Q * Q * 9900n) / 10000n);
  assert.ok(up > Q);
  assert.equal(integerSqrt(81n), 9n);
});
test("out-of-liquidity estimates fail instead of returning a partial quote", () => {
  assert.throws(
    () =>
      estimateHookOutput({
        amount: 10n ** 40n,
        zeroForOne: true,
        sqrt: Q,
        bands,
        inputBps: 0n,
        outputBps: 0n,
      }),
    /liquidity/,
  );
});
test("custom error data and wallet rejection become plain remedies", () => {
  const abi = parseAbi(["error CannotPass(uint256 need)"]);
  const data = encodeErrorResult({ abi, errorName: "CannotPass", args: [50n] });
  assert.match(explainError({ cause: { data } }, [abi]).title, /cannot pass/);
  assert.match(explainError({ code: 4001 }).title, /declined/);
  assert.match(
    explainError({ message: "insufficient funds for gas" }).title,
    /Sepolia ETH/,
  );
});

test("oracle attestation IDs map to API UUIDs, not Intake hashes", async () => {
  const { requestUuid } = await import("../src/oracle-id.ts");
  assert.equal(
    requestUuid("0xebe6ff4d3f1948e1a4cc1c2f0e35547d" + "0".repeat(32)),
    "ebe6ff4d-3f19-48e1-a4cc-1c2f0e35547d",
  );
  assert.equal(requestUuid("0x" + "a".repeat(64)), undefined);
  assert.equal(requestUuid("0x" + "0".repeat(64)), undefined);
});

// PAY-1: v4 ends a swap step at every word end of its tick bitmap, not only at initialized ticks, and
// rounds each step. A reference swap that follows v4's own loop (Pool.swap with
// TickBitmap.nextInitializedTickWithinOneWord and SwapMath.computeSwapStep, no LP fee) must equal the
// walk to the wei once the walk knows the tick spacing.
function v4Swap({ amount, zeroForOne, sqrt, bands, tickSpacing }) {
  const live = bands.filter((b) => b.liquidity > 0n),
    net = new Map();
  for (const b of live) {
    net.set(b.tickLower, (net.get(b.tickLower) ?? 0n) + b.liquidity);
    net.set(b.tickUpper, (net.get(b.tickUpper) ?? 0n) - b.liquidity);
  }
  let tick = -887272;
  for (let hi = 887272; tick < hi; ) {
    const m = Math.ceil((tick + hi) / 2);
    if (sqrtAtTick(m) <= sqrt) tick = m;
    else hi = m - 1;
  }
  let liquidity = live
    .filter((b) => b.tickLower <= tick && tick < b.tickUpper)
    .reduce((n, b) => n + b.liquidity, 0n);
  const nextTick = (t) => {
    let c = Math.floor(t / tickSpacing);
    if (zeroForOne) {
      const word = Math.floor(c / 256) * 256;
      for (let x = c; x >= word; x--) if (net.has(x * tickSpacing)) return [x * tickSpacing, true];
      return [word * tickSpacing, false];
    }
    c += 1;
    const word = Math.floor(c / 256) * 256;
    for (let x = c; x <= word + 255; x++) if (net.has(x * tickSpacing)) return [x * tickSpacing, true];
    return [(word + 255) * tickSpacing, false];
  };
  let remaining = amount,
    out = 0n,
    price = sqrt,
    steps = 0;
  const up = (a, b) => (a + b - 1n) / b;
  while (remaining > 0n) {
    let [next, initialized] = nextTick(tick);
    next = Math.max(-887272, Math.min(887272, next));
    const target = sqrtAtTick(next);
    if (target === price) throw Error("out of liquidity");
    let amountIn = zeroForOne
        ? up(up(liquidity * Q * (price - target), price), target)
        : up(liquidity * (target - price), Q),
      after = target;
    if (remaining < amountIn) {
      amountIn = remaining;
      after = zeroForOne
        ? up(liquidity * Q * price, liquidity * Q + amountIn * price)
        : price + (amountIn * Q) / liquidity;
    }
    out += zeroForOne
      ? (liquidity * (price - after)) / Q
      : (liquidity * Q * (after - price)) / after / price;
    remaining -= amountIn;
    price = after;
    steps++;
    if (price === target) {
      if (initialized) liquidity += zeroForOne ? -net.get(next) : net.get(next);
      tick = zeroForOne ? next - 1 : next;
    }
  }
  return { out, steps };
}
test("PAY-1: the walk stops at v4's tick bitmap word ends, so it equals v4's own steps to the wei", () => {
  // The word ends: going up the last tick of each 256-spacing word, going down the first.
  assert.deepEqual(wordEnds(-108180, -76000, 60, false), [-107580, -92220, -76860]);
  assert.deepEqual(wordEnds(-108180, -76000, 60, true), [-107520, -92160, -76800]);
  assert.deepEqual(wordEnds(0, 15359, 60, true), [0]);
  assert.deepEqual(wordEnds(-15361, -1, 60, false), [-60]);
  const pool = [
    { tickLower: -2000, tickUpper: 1200, liquidity: 3n * 10n ** 22n },
    { tickLower: 600, tickUpper: 9000, liquidity: 10n ** 22n },
  ];
  let crossed = 0;
  for (const zeroForOne of [false, true])
    for (const amount of [10n ** 18n, 10n ** 21n, 2n * 10n ** 21n + 12345n, 3n * 10n ** 21n + 7n, 8n * 10n ** 21n, 10n ** 30n]) {
      const sqrt = sqrtAtTick(zeroForOne ? 5000 : -1500) + 12345n;
      const params = { amount, zeroForOne, sqrt, bands: pool, inputBps: 0n, outputBps: 0n, tickSpacing: 10 };
      // More than the bands hold (8e21 going down, 1e30 either way): the walk refuses, and v4 would
      // run out of liquidity.
      if (amount === 10n ** 30n || (zeroForOne && amount === 8n * 10n ** 21n)) {
        assert.throws(() => estimateHookOutput(params), /crosses the pool’s available liquidity/);
        assert.throws(() => v4Swap({ ...params, tickSpacing: 10 }), /out of liquidity/);
        continue;
      }
      const ref = v4Swap({ amount, zeroForOne, sqrt, bands: pool, tickSpacing: 10 }),
        walk = estimateHookOutput(params);
      assert.equal(walk.gross, ref.out, `${zeroForOne ? "down" : "up"} ${amount}`);
      // A word end crossed: the walk without the spacing would have one step fewer.
      if (estimateHookOutput({ ...params, tickSpacing: undefined }).gross !== ref.out) crossed++;
    }
  assert.ok(crossed >= 2, `the cases cross word ends where it matters (${crossed})`);
  // Launch #2647 on a fork of Ethereum, seeded, past the launch window: 1.5 ETH bought 699.81 IMD on
  // IMD's ETH pool and the IMD bought 32,771,608.944791018618064486 PLEA, crossing the word end at
  // tick −107,580. The walk with the pool's spacing (60) says exactly that; without it, 20,384 wei more.
  const fork = {
    amount: 699810825398990290562n,
    zeroForOne: false,
    sqrt: 354730211826704505754848216n,
    bands: [
      { tickLower: -108180, tickUpper: 887220, liquidity: 3671402612256138977327802n },
      { tickLower: 0, tickUpper: 0, liquidity: 0n },
    ],
    inputBps: 200n,
    outputBps: 25n,
  };
  assert.equal(estimateHookOutput({ ...fork, tickSpacing: 60 }).out, 32771608944791018618064486n);
  assert.equal(estimateHookOutput(fork).out - 32771608944791018618064486n, 20384n);
});
