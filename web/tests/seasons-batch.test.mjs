// Round-2 open items, SEASONS batch: the seat brackets (r2S-VN1, r2S-N6), time left in words
// (r2S-N5), plurals (r2S-VN3), the closing copy and rounding note (S7), the no-plea band in ended
// seasons (r2S-N7), the no-prize projection (r2S-N8), the profile prize cell and foot (r2S-VN2), and
// share text that leaves out what incomplete history cannot tell (r2S-N1).
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-seasons-"));
after(() => rm(dir, { recursive: true, force: true }));
async function load(name) {
  const outfile = path.join(dir, name + ".mjs");
  await build({
    entryPoints: [
      fileURLToPath(new URL("../src/" + name + ".ts", import.meta.url)),
    ],
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
const {
  countedPleas,
  seatBracket,
  judgesRow,
  multiplierText,
  plural,
  timeLeft,
  signedPercent,
} = await load("chain");
const {
  closingCopy,
  roundingNote,
  noPleaText,
  projection,
  seasonPrize,
  seasonsFoot,
} = await load("season-text");
const { shareSentence, shareStatus, shareGaps } = await load("share-text");

const E = 10n ** 18n;
const constants = {
  "Seasons.SEAT_MULTIPLIER_BPS": 12000n,
  "CabalGate.PENDING_EXPIRY": 1200,
  "CabalGate.EXECUTE_WINDOW": 420,
  "CabalGate.COOLDOWN": 14400,
  "Tribunal.OBJECTION_WINDOW": 1200,
  "Tribunal.PENDING_EXPIRY": 1200,
  "Tribunal.MAX_OBJECTIONS": 2,
  "Tribunal.MARGIN": 2,
  pairSymbol: "imdTEST",
  pairDecimals: 18,
  decimals: 18,
  symbol: "PLEA",
};
const wallet = "0x3Be3A5E3A27D8575E5f3CDaC80d0d5eBa997D2aa";
const recorded = (pleaId, score, pts) => ({
  eventName: "Recorded",
  args: { pleaId, season: 1n, wallet, score, points: pts },
});
const seatLog = (pleaId, score, pleaPoints) => ({
  eventName: "SeatMultiplier",
  args: { pleaId, wallet, score, pleaPoints },
});

test("r2S-VN1: × 1.2 only on the pleas Seasons multiplied", () => {
  // p5 recorded #5 with a seat (42 → 50), moved the seat, then recorded #7 without one (41 → 41).
  const s = {
    constants,
    logs: [recorded(5n, 42, 50), seatLog(5n, 42, 50), recorded(7n, 41, 91)],
  };
  const counted = countedPleas(s, 1n, wallet, [50, 41, 0]);
  assert.deepEqual(
    counted.map((p) => [p.pleaId, p.score, p.multiplied]),
    [
      [5n, 42, true],
      [7n, 41, false],
    ],
  );
  const mult = multiplierText(s);
  assert.equal(mult, "1.2");
  assert.equal(seatBracket(counted, mult), "42 × 1.2 · 41");
  assert.deepEqual(judgesRow(counted, mult), [
    "Judges’ scores",
    "42 × 1.2 · 41",
  ]);
  // Every counted plea multiplied: the mockup's "(38·37·36 × 1.2)" and its standing row.
  const all = [
    { score: 38, multiplied: true },
    { score: 37, multiplied: true },
    { score: 36, multiplied: true },
  ];
  assert.equal(seatBracket(all, mult), "38·37·36 × 1.2");
  assert.deepEqual(judgesRow(all, mult), [
    "Judges’ scores, before × 1.2",
    "38 · 37 · 36",
  ]);
  // None multiplied (a seat holder's unmultiplied pleas), or unknown pleas: no bracket, no row.
  assert.equal(
    seatBracket([{ score: 41, multiplied: false }], mult),
    undefined,
  );
  assert.equal(judgesRow(undefined, mult), undefined);
  // History incomplete: countedPleas knows nothing, so nothing is claimed.
  assert.equal(
    countedPleas({ ...s, historyError: "x" }, 1n, wallet, [50, 41, 0]),
    undefined,
  );
});

test("r2S-N5: time left in words, never a clock in the last hour", () => {
  assert.equal(timeLeft(9 * 86400 + 4 * 3600 + 59), "9d 4h");
  assert.equal(timeLeft(4 * 3600 + 12 * 60), "4h 12m");
  assert.equal(timeLeft(7 * 60 + 42), "7 min");
  assert.equal(timeLeft(59), "less than a minute");
  assert.equal(timeLeft(-5), "less than a minute");
});

test("r2S-VN3: one wallet, many wallets", () => {
  assert.equal(plural(1, "wallet"), "1 wallet");
  assert.equal(plural(0, "wallet"), "0 wallets");
  assert.equal(plural(21n, "wallet"), "21 wallets");
});

test("S7: closing copy per state and the mockup's rounding note", () => {
  const base = {
    season: 1n,
    top: 25n,
    minPoints: 60,
    pair: "imdTEST",
    bonus: true,
  };
  assert.equal(
    closingCopy({ ...base, ready: false, last: false }),
    "The close records any approved plea nobody recorded, pays the top 25 with 60+ points in imdTEST and PLEA, rolls the unpaid imdTEST over to season 3 and burns the unpaid PLEA.",
  );
  assert.equal(
    closingCopy({ ...base, ready: true, last: false }),
    "The grace is over: anyone can close season 2 now. The close records any approved plea nobody recorded, pays the top 25 with 60+ points and rolls the rest over.",
  );
  assert.equal(
    closingCopy({ ...base, ready: false, last: true }),
    "The close records any approved plea nobody recorded and pays the top 25 with 60+ points in imdTEST and PLEA.",
  );
  // L2: with incomplete history the site's close is off, and the copy says so, not "anyone can close".
  const blind = closingCopy({ ...base, ready: true, last: true, historyError: true });
  assert.doesNotMatch(blind, /anyone can close/);
  assert.match(blind, /^The grace is over, but the site's close of season 2 stays off until the history is read: /);
  assert.equal(closingCopy({ ...base, ready: false, last: false, historyError: true }), closingCopy({ ...base, ready: false, last: false }));
  // From season 7 on there is no PLEA bonus to pay or burn.
  assert.equal(
    closingCopy({
      ...base,
      season: 7n,
      bonus: false,
      ready: false,
      last: false,
    }),
    "The close records any approved plea nobody recorded, pays the top 25 with 60+ points in imdTEST, rolls the unpaid imdTEST over to season 9.",
  );
  assert.equal(
    roundingNote("imdTEST", 21),
    "Each imdTEST amount is rounded down on its own, as the chain pays and prints it, so parts and totals can differ by a cent, and the 21 prizes above by up to a cent each.",
  );
  assert.match(
    roundingNote("imdTEST", 1),
    /, and the prize above by up to a cent\.$/,
  );
  assert.match(roundingNote("imdTEST", 0), /differ by a cent\.$/);
});

test("r2S-N7: an ended season invites no plea; a running one keeps the band's pitch", () => {
  const o = { minPoints: 60, mult: "1.2", current: 2n };
  assert.equal(
    noPleaText({ ...o, season: 0n, ended: true, last: false }),
    "No approved plea of yours is recorded in season 1. Season 1 has ended, so no new plea counts in it; a plea approved now counts in season 3.",
  );
  assert.equal(
    noPleaText({ ...o, season: 2n, ended: false, last: false }),
    "No approved plea of yours is recorded in season 3. Your best three count, and two pleas that score 30 already reach the 60-point bar; an IMD seat makes each one × 1.2.",
  );
  assert.doesNotMatch(
    noPleaText({ ...o, season: 2n, ended: true, last: true }),
    /best three count|Write a plea/,
  );
  // After the death an older waiting season points to no later season: pleas are closed.
  assert.equal(
    noPleaText({
      ...o,
      current: 8n,
      season: 2n,
      ended: true,
      last: false,
      dead: true,
    }),
    "No approved plea of yours is recorded in season 3. Season 3 has ended, and pleas are closed.",
  );
});

test("r2S-N8: the no-prize projection ends at the bar; a prize keeps 'at today’s season prize pot'", () => {
  const s = { constants };
  const shares = [450n, 446n, 442n];
  const p = {
    best: [0, 0, 0],
    others: [],
    shares,
    pot: 100n * E,
    bonus: 10000000n * E,
    minPoints: 60,
    top: 25,
    s,
  };
  assert.equal(
    projection({ ...p, points: 39 }),
    "Recorded, they make 39 points (39 + 0 + 0) and rank 1: no prize yet (39 of 60).",
  );
  assert.equal(
    projection({ ...p, best: [43, 40, 37], points: 44, others: [130] }),
    "Recorded, they make 127 points (44 + 43 + 40; the 37 drops out) and rank 2: 4.46 imdTEST + 446,000 PLEA at today’s season prize pot.",
  );
});

test("r2S-VN2: under 60 points the profile's prize cell and foot claim no prize", () => {
  const s = { constants };
  assert.deepEqual(
    seasonPrize({ closed: false, points: 49, imd: 0n, bonus: 0n }, 60, s),
    { value: "no prize", note: "(49 of 60)" },
  );
  assert.deepEqual(
    seasonPrize(
      { closed: true, points: 97, imd: 841n * 10n ** 16n, bonus: 396000n * E },
      60,
      s,
    ),
    { value: "8.41 imdTEST", note: "+ 396,000 PLEA" },
  );
  // A closed season's paid prize is in its PrizePaid logs: unknown while history is incomplete.
  assert.equal(
    seasonPrize(
      { closed: true, points: 91, imd: 0n, bonus: 0n, known: false },
      60,
      s,
    ).value,
    "not read",
  );
  assert.equal(
    seasonsFoot({
      season: 1n,
      rank: 1,
      qualifies: false,
      closeFrom: "05:05 UTC",
    }),
    "Prizes are rounded down and paid at the close, from 05:05 UTC.",
  );
  assert.equal(
    seasonsFoot({
      season: 1n,
      rank: 3,
      qualifies: true,
      closeFrom: "05:05 UTC",
    }),
    "Season 2’s prize is rank 4’s share if it ended now. Prizes are rounded down and paid at the close, from 05:05 UTC.",
  );
});

test("r2X-7 / r2D-N8: the profile's P/L is signed with U+2212, as on #/buy", () => {
  assert.equal(signedPercent(-39.94), "−39.9%");
  assert.equal(signedPercent(0.8), "+0.8%");
});

test("r2S-N1: with incomplete history a hand sale's amount is left out, never '— imdTEST'", () => {
  const V = 1792600000;
  const plea = {
    id: 8n,
    seller: "0x00000000000000000000000000000000000000a1",
    amount: 500000n * E,
    balance: 2500000n * E,
    need: 37,
    score: 40,
    status: 4,
    verdictAt: BigInt(V),
    submittedAt: BigInt(V - 240),
    standing: [false, false, 255],
    points: 40,
    excluded: false,
    objections: [],
    text: "A plea.",
  };
  const s = {
    constants,
    logs: [],
    v: {
      "CabalGate.cabalAlive": true,
      "CabalGate.diedAt": 0n,
      "Tribunal.nextId": 3n,
      objections: [{ id: 2n }, { id: 1n }],
    },
    timestamp: V + 3600,
    historyError: "History could not be read completely.",
  };
  assert.equal(
    shareStatus(plea, s, V + 3600, "my plea"),
    "SOLD: my plea, 40 vs need 37.",
  );
  assert.equal(
    shareSentence(plea, s, V + 3600),
    "Sold, 40 vs need 37. +40 points.",
  );
  assert.deepEqual(shareGaps(plea, s), ["the sale amount"]);
  // With its SellExecuted log the amount is back, and nothing is missing.
  const full = {
    ...s,
    historyError: undefined,
    logs: [
      {
        eventName: "SellExecuted",
        args: { id: 8n, imdOut: 1078n * 10n ** 16n },
      },
    ],
  };
  assert.equal(
    shareStatus(plea, full, V + 3600, "my plea"),
    "SOLD: my plea, 40 vs need 37. Sold for 10.78 imdTEST.",
  );
  assert.deepEqual(shareGaps(plea, full), []);
  // More objections than the snapshot read from the Tribunal: an objection may be missing.
  assert.deepEqual(
    shareGaps(plea, { ...s, v: { ...s.v, "Tribunal.nextId": 70n } }),
    ["the sale amount", "an objection"],
  );
});
