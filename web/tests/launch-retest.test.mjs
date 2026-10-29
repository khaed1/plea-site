// Launch re-test (two testers on forks of launch #2647): the fact-score rules by network (F1), the
// season projection with the approvals a close records (F2), the objections filter (F3), the share
// pages after the death (F4), and the cheap nits.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  factParts,
  factTerms,
  factMax,
  heldPoints,
  recordBest,
  insertEntry,
  closeBoard,
  closePayout,
  Q96,
} from "../src/models.ts";
import { siteFrom } from "../src/site.ts";
import { loadNetwork } from "../scripts/network.mjs";
import { manifestFor, useNetwork } from "./site-setup.mjs";

const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-launch-retest-"));
after(() => rm(dir, { recursive: true, force: true }));
async function load(name) {
  const outfile = path.join(dir, name + ".mjs");
  await build({
    entryPoints: [fileURLToPath(new URL("../src/" + name + ".ts", import.meta.url))],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    plugins: [
      {
        name: "locked",
        setup(b) {
          b.onResolve({ filter: /^(viem|wagmi)(\/.*)?$/ }, (a) => ({
            path: require.resolve(a.path),
            external: true,
          }));
        },
      },
    ],
  });
  return import(pathToFileURL(outfile));
}
const chain = await load("chain"),
  seasonText = await load("season-text");
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

// Seasons.SHARES: 4.50% for rank 1 down to 3.50% for rank 25, two bytes a rank.
const SHARES = "01c201be01ba01b601b101ad01a901a501a1019c019801940190018c01880184017f017b01770173016f016a01660162015e"
  .match(/..../g)
  .map((h) => BigInt(parseInt(h, 16)));
const [p1, p2, p3, p4, p5, owner] = ["0x01", "0x02", "0x03", "0x04", "0x05", "0x5bf3597216f9019cf10cf680783289efc8639bf0"].map(
  (w) => w.padEnd(42, "0"),
);

test("F2: Seasons._record's best three: the lowest goes, the newest of equal lowest first, an older equal plea takes its place", () => {
  const best = { points: [0, 0, 0], ids: [0n, 0n, 0n] };
  assert.deepEqual(recordBest(best, p1, 4n, 30), { wallet: p1, points: 30, pleaId: 4n });
  assert.deepEqual(recordBest(best, p1, 7n, 20), { wallet: p1, points: 50, pleaId: 7n });
  assert.deepEqual(recordBest(best, p1, 9n, 20), { wallet: p1, points: 70, pleaId: 9n });
  // Full: a lower plea changes nothing (Recorded with points 0).
  assert.equal(recordBest(best, p1, 10n, 19), undefined);
  // Equal to the lowest and newer: nothing; older: it replaces the newest of the equal lowest (#9).
  assert.equal(recordBest(best, p1, 11n, 20), undefined);
  assert.deepEqual(recordBest(best, p1, 8n, 20), { wallet: p1, points: 70, pleaId: 8n });
  assert.deepEqual(best, { points: [30, 20, 20], ids: [4n, 7n, 8n] });
  // More than the lowest: the newer of the two 20s (#8) drops.
  assert.deepEqual(recordBest(best, p1, 12n, 25), { wallet: p1, points: 75, pleaId: 12n });
  assert.deepEqual(best, { points: [30, 20, 25], ids: [4n, 7n, 12n] });
});

test("F2: Seasons._insertWallet: moves a wallet up, ties go to the older newest plea, a full board keeps out a lower one", () => {
  const e = (wallet, points, pleaId) => ({ wallet, points, pleaId });
  let board = [e(p1, 60, 3n), e(p2, 50, 5n)];
  board = insertEntry(board, e(p3, 50, 4n), 3);
  assert.deepEqual(board.map((x) => x.wallet), [p1, p3, p2], "50 with #4 ranks over 50 with #5");
  board = insertEntry(board, e(p4, 49, 1n), 3);
  assert.deepEqual(board.map((x) => x.wallet), [p1, p3, p2], "a full board keeps out a lower one");
  board = insertEntry(board, e(p4, 51, 9n), 3);
  assert.deepEqual(board.map((x) => [x.wallet, x.points]), [[p1, 60], [p4, 51], [p3, 50]], "the last row drops");
  board = insertEntry(board, e(p3, 70, 11n), 3);
  assert.deepEqual(board.map((x) => [x.wallet, x.points]), [[p3, 70], [p1, 60], [p4, 51]], "an entry moves up, not twice");
});

test("F2: the close's projection: the tester's fork, where the close recorded #16 and paid p1 rank 1's share", () => {
  // dead.hex: p1's #1 recorded at 40 (overruled at 40), p5's #11 at 52 (44 × 1.2); #16 (p1, 43),
  // #13 (p3, 44), #14 (p2, 43) and #17 (p4, 42) approved and unrecorded. The recorded board pays no
  // one (52 and 40 are under 60); the close records the four first and p1 reaches 83.
  const board = [
      { wallet: p5, points: 52, pleaId: 11n },
      { wallet: p1, points: 40, pleaId: 1n },
    ],
    records = [
      { pleaId: 1n, wallet: p1, points: 40 },
      { pleaId: 11n, wallet: p5, points: 52 },
    ],
    pending = [
      { id: 13n, seller: p3, points: 44 },
      { id: 14n, seller: p2, points: 43 },
      { id: 16n, seller: p1, points: 43 },
      { id: 17n, seller: p4, points: 42 },
    ],
    pot = 951111111111111111n,
    bonus = 10_000_000n * E,
    o = { shares: SHARES, pot, bonus, minPoints: 60, excluded: () => false };
  const before = closePayout(board, o);
  assert.deepEqual([before.wallets, before.paid, before.bonusPaid], [0, 0n, 0n], "what the site said: paid to 0 wallets");
  const after = closeBoard(board, records, pending, 25);
  assert.deepEqual(
    after.map((x) => [x.wallet, x.points, x.pleaId]),
    [
      [p1, 83, 16n],
      [p5, 52, 11n],
      [p3, 44, 13n],
      [p2, 43, 14n],
      [p4, 42, 17n],
    ],
  );
  const paid = closePayout(after, o);
  assert.equal(paid.wallets, 1);
  assert.equal(paid.bps, 450n);
  assert.equal(paid.paid, (pot * 450n) / 10000n, "0.0428 IMD");
  assert.equal(paid.bonusPaid, 450_000n * E, "450,000 PLEA, as the close paid p1");
  // The owner's rank is paid to no one (_dropOwner): rank 2 keeps rank 2's share.
  const owned = [{ wallet: owner, points: 90, pleaId: 2n }, ...after],
    dropped = closePayout(owned, { ...o, excluded: (w) => w === owner });
  assert.deepEqual(dropped.paidBps, [SHARES[1]]);
  // Only the top 25 are paid: a 26th wallet is not on the board.
  const many = Array.from({ length: 26 }, (_, i) => ({ id: BigInt(100 + i), seller: `0x${(i + 16).toString(16)}`.padEnd(42, "0"), points: 61 }));
  const full = closeBoard([], [], many, 25);
  assert.equal(full.length, 25);
  assert.equal(full.at(-1).pleaId, 124n, "equal points: the older newest plea ranks higher, #125 stays out");
  assert.equal(closePayout(full, o).bps, 10000n);
});

test("F2: the close's records come from the Recorded logs with the seat's points, in chain order", () => {
  const log = (eventName, blockNumber, logIndex, args) => ({ eventName, blockNumber, logIndex, args });
  const s = {
    logs: [
      log("Recorded", 20n, 3, { pleaId: 11n, season: 0n, wallet: p5, score: 44, points: 52 }),
      log("SeatMultiplier", 20n, 2, { pleaId: 11n, wallet: p5, score: 44, pleaPoints: 52 }),
      log("Recorded", 9n, 1, { pleaId: 1n, season: 0n, wallet: p1, score: 40, points: 40 }),
      log("Recorded", 30n, 1, { pleaId: 21n, season: 1n, wallet: p1, score: 41, points: 41 }),
    ],
  };
  assert.deepEqual(chain.seasonRecords(s, 0n), [
    { pleaId: 1n, wallet: p1, points: 40 },
    { pleaId: 11n, wallet: p5, points: 52 },
  ]);
});

test("F2: the projection says which unrecorded pleas it counts", () => {
  const { closeCounts } = seasonText;
  assert.equal(
    closeCounts({ pleas: [{ id: 16n, points: 43, held: false, seat: false }], mult: "1.2" }),
    "Counts plea #16 (+43), approved and not recorded: the close records it first.",
  );
  assert.equal(
    closeCounts({
      pleas: [
        { id: 13n, points: 44, held: false, seat: false },
        { id: 16n, points: 51, held: true, seat: true },
        { id: 17n, points: 42, held: false, seat: false },
      ],
      mult: "1.2",
    }),
    "Counts pleas #13 (+44), #16 (+51, seat × 1.2, if no objection is sustained) and #17 (+42), approved and not recorded: the close records them first. The close reads the seat again as it records.",
  );
  assert.equal(closeCounts({ pleas: [], mult: "1.2" }), "");
  assert.match(closeCounts({ pleas: [], mult: "1.2", historyError: true }), /not known until the history is read.*stays off until then/);
  // F6: the launch owner gets no season pitch.
  const { noPleaText } = seasonText;
  const base = { season: 0n, ended: false, last: false, minPoints: 60, mult: "1.2" };
  assert.match(noPleaText({ ...base, excluded: true }), /does not play seasons/);
  assert.match(noPleaText(base), /two pleas that score 30 already reach the 60-point bar/);
});

test("N1, N2, N4: countdowns read 6m 05s; no 'yet' for a plea number that never comes; an Intake's no answer is not an expiry", () => {
  // N1: under an hour a countdown is minutes and seconds, never a clock-like 06:51.
  assert.equal(chain.duration(411), "6m 51s");
  assert.equal(chain.duration(5), "0m 05s");
  assert.equal(chain.duration(3599), "59m 59s");
  assert.equal(chain.duration(4 * 3600 + 12 * 60), "4h 12m");
  // N2: #0 and #abc never exist; after the death no new plea does either.
  const alive = { v: { "CabalGate.diedAt": 0n } },
    dead = { v: { "CabalGate.diedAt": 1793361296n } };
  assert.equal(chain.missingPleaTitle("19", alive), "No plea #19 yet");
  assert.equal(chain.missingPleaTitle("0", alive), "No plea #0");
  assert.equal(chain.missingPleaTitle("abc", alive), "No plea #abc");
  assert.equal(chain.missingPleaTitle("19", dead), "No plea #19");
  // N4: plea #10 on the testers' fork: the Intake reported no answer (status 2, 0 answered).
  const V = 1792600000,
    s = {
      constants: { "CabalGate.PENDING_EXPIRY": 1200, "CabalGate.QUORUM": 17 },
      logs: [{ eventName: "PleaFailed", args: { id: 10n } }],
      v: {},
      timestamp: V + 30,
    },
    p = { id: 10n, status: 6, submittedAt: BigInt(V), failure: { status: 2, answered: 0, agreed: 0 } };
  const n = chain.noVerdict(p, s, V + 30);
  assert.equal(n.kind, "no answer");
  assert.equal(n.sentence, "The panel gave no answer.");
  assert.equal(n.detail, "Cleared at once by the Intake.");
  // Without the Intake's report the expiry is what ended it.
  const expired = chain.noVerdict({ ...p, failure: undefined }, { ...s, logs: [] }, V + 1300);
  assert.equal(expired.sentence, `No answer within ${chain.span(1200)}.`);
});
