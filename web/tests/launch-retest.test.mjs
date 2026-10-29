// Launch re-test (two testers on forks of launch #2647): the fact-score rules by network (F1), the
// season projection with the approvals a close records (F2), the objections filter (F3), the share
// pages after the death (F4), and the cheap nits.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { factParts, factTerms, factMax, heldPoints, Q96 } from "../src/models.ts";
import { siteFrom } from "../src/site.ts";
import { loadNetwork } from "../scripts/network.mjs";
import { manifestFor, useNetwork } from "./site-setup.mjs";

after(() => useNetwork("sepolia-run9"));
const E = 10n ** 18n,
  DAY = 86400,
  ethereum = siteFrom(manifestFor("ethereum")).facts,
  sepolia = siteFrom(manifestFor("sepolia-run9")).facts;

// CabalGate._factScoreAt as each source writes it: launch #2647 (khaed1/plea mainnet, src/CabalGate.sol
// :270-306: held 3 / 2 / 1, received profit 9, PASS_MARK 69) and Sepolia run 9 (testnet9: 7 / 4 / 2,
// profit 10, PASS_MARK 71).
const SOURCES = {
  ethereum: { held: [3n, 2n, 1n], received: 9n, pass: 69 },
  sepolia: { held: [7n, 4n, 2n], received: 10n, pass: 71 },
};
function gateFacts(src, amount, bal, basis, latest, ago, started, now) {
  const { held, received } = SOURCES[src];
  const heldPoints = (t) =>
    !t || t > now ? 0n : now - t >= 7 * DAY ? held[0] : now - t >= 3 * DAY ? held[1] : now - t >= DAY ? held[2] : 0n;
  const shareBps = (amount * 10000n + bal - 1n) / bal;
  let score = shareBps <= 2000n ? 16n : shareBps <= 3500n ? 9n : 3n;
  const [spent, heldPlea, avg] = basis;
  let facts = heldPoints(Number(avg));
  if (spent) {
    const value = (heldPlea * latest) / Q96;
    if (value < spent) facts += 13n;
    else {
      const g = value - spent;
      facts += g * 2n <= spent ? 12n : g <= spent * 2n ? 10n : g <= spent * 5n ? 8n : g <= spent * 10n ? 6n : 4n;
    }
  }
  if (heldPlea < amount)
    facts = (heldPlea * facts + (amount - heldPlea) * (heldPoints(started) + received) + amount / 2n) / amount;
  score += facts;
  score += !ago ? 5n : latest > (ago * 102n) / 100n ? 9n : latest * 100n >= ago * 98n ? 5n : 0n;
  return Number(score);
}

test("F1: each network's settings carry its CabalGate's fact rules", () => {
  assert.deepEqual(ethereum, {
    held: [
      { days: 7, points: 3 },
      { days: 3, points: 2 },
      { days: 1, points: 1 },
    ],
    receivedProfit: 9,
  });
  assert.deepEqual(sepolia, {
    held: [
      { days: 7, points: 7 },
      { days: 3, points: 4 },
      { days: 1, points: 2 },
    ],
    receivedProfit: 10,
  });
  // The fact score's range: 0-41 on Ethereum (the launched NatSpec), 0-45 on Sepolia run 9.
  assert.equal(factMax(ethereum), 41);
  assert.equal(factMax(sepolia), 45);
  const now = 1_800_000_000;
  for (const [t, eth, sep] of [
    [0, 0, 0],
    [now + 1, 0, 0],
    [now - DAY + 1, 0, 0],
    [now - DAY, 1, 2],
    [now - 3 * DAY, 2, 4],
    [now - 7 * DAY + 1, 2, 4],
    [now - 7 * DAY, 3, 7],
  ]) {
    assert.equal(heldPoints(t, now, ethereum), eth);
    assert.equal(heldPoints(t, now, sepolia), sep);
  }
  // A manifest without the rules, or with bands out of order, is refused (at load and at build).
  const m = manifestFor("ethereum");
  assert.throws(() => siteFrom({ ...m, site: { ...m.site, facts: undefined } }), /no fact-score rules/);
  assert.throws(
    () => siteFrom({ ...m, site: { ...m.site, facts: { ...ethereum, held: [...ethereum.held].reverse() } } }),
    /no fact-score rules/,
  );
  assert.equal(loadNetwork("ethereum").site.facts.receivedProfit, 9, "the build ships them in the manifest's site block");
});

test("F1: a 20% plea of received PLEA needs what each CabalGate asks, day 0 to day 7", () => {
  const now = 1_800_000_000,
    price = 453475764330517343134832n,
    bal = 2_500_000n * E,
    amount = bal / 5n,
    none = [0n, 0n, 0n];
  const need = (src, facts, days, ago) => {
    const started = now - days * DAY,
      parts = factParts(bal, amount, none, price, ago, started, now, facts);
    assert.equal(parts.mode, "received");
    assert.equal(parts.total, gateFacts(src, amount, bal, none, price, ago, started, now));
    assert.equal(parts.profit, facts.receivedProfit);
    return SOURCES[src].pass - parts.total;
  };
  const flat = price,
    rising = (price * 100n) / 103n;
  assert.deepEqual([0, 1, 3, 7].map((d) => need("ethereum", ethereum, d, flat)), [39, 38, 37, 36]);
  assert.deepEqual([1, 3, 7].map((d) => need("ethereum", ethereum, d, rising)), [34, 33, 32]);
  // Sepolia run 9's numbers are the ones the site always showed.
  assert.deepEqual([0, 1, 3, 7].map((d) => need("sepolia", sepolia, d, flat)), [40, 38, 36, 33]);
  assert.deepEqual([1, 3, 7].map((d) => need("sepolia", sepolia, d, rising)), [34, 32, 29]);
  // The rules default to the loaded deployment's.
  useNetwork("ethereum");
  try {
    const parts = factParts(bal, amount, none, price, flat, now - 3 * DAY, now);
    assert.deepEqual(factTerms(parts), [16, 2, 9, 5]);
  } finally {
    useNetwork("sepolia-run9");
  }
  assert.deepEqual(factTerms(factParts(bal, amount, none, price, flat, now - 3 * DAY, now)), [16, 4, 10, 5]);
});

test("F1: buy records and mixed pleas match each source on a grid of cases", () => {
  const now = 1_800_000_000,
    price = 453475764330517343134832n,
    started = now - 8 * DAY;
  let n = 0;
  for (const age of [0, 3600, DAY, 2 * DAY, 3 * DAY, 6 * DAY, 7 * DAY, 30 * DAY])
    for (const gainPct of [-20n, 0n, 50n, 51n, 200n, 600n, 2000n])
      for (const [held, amount] of [
        [500_000n, 100_000n],
        [500_000n, 500_000n],
        [213_518n, 542_703n],
        [1n, 600_000n],
      ])
        for (const ago of [0n, price, (price * 100n) / 103n, (price * 103n) / 100n]) {
          const heldPlea = held * E,
            spent = (((heldPlea * price) / Q96) * 100n) / (100n + gainPct),
            basis = [spent, heldPlea, BigInt(age ? now - age : 0)],
            bal = 2_713_518n * E,
            plea = amount * E;
          for (const [src, facts] of [
            ["ethereum", ethereum],
            ["sepolia", sepolia],
          ]) {
            const parts = factParts(bal, plea, basis, price, ago, started, now, facts);
            assert.equal(parts.total, gateFacts(src, plea, bal, basis, price, ago, started, now), `${src} ${age} ${gainPct} ${held}/${amount}`);
            assert.equal(factTerms(parts).reduce((a, b) => a + b, 0), parts.total);
            n++;
          }
        }
  assert.ok(n > 1000);
});
