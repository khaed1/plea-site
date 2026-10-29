// Round-2 open items, COURT batch: objection states (IMD5, r2C-N2, r2D-N5, r2C-N3, E3a),
// no-verdict reasons (r2C-N5), share labels and posts (S13, r2C-V1, r2C-N4), the share
// percentage (E3b) and the letter delivery estimate (r2D-N6).
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deliverOut, LETTERBOX } from "../src/models.ts";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-court-"));
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
  caseState,
  objectionStale,
  objectionLine,
  objectionCase,
  recordFrom,
  recordHint,
  noVerdict,
  sharePercent,
  clock,
  pendingVerdictWords,
} = await load("chain");
const { shareSentence, shareStatus, shareState } = await load("share-text");

const E = 10n ** 18n;
const V = 1792600000; // verdict time
const snap = (o = {}) => ({
  constants: {
    "Tribunal.OBJECTION_WINDOW": 1200,
    "Tribunal.PENDING_EXPIRY": 1200,
    "Tribunal.MAX_OBJECTIONS": 2,
    "Tribunal.MARGIN": 2,
    "CabalGate.PENDING_EXPIRY": 1200,
    "CabalGate.EXECUTE_WINDOW": 420,
    "CabalGate.COOLDOWN": 14400,
    "CabalGate.QUORUM": 17,
    pairSymbol: "imdTEST",
    pairDecimals: 18,
    decimals: 18,
    symbol: "PLEA",
  },
  logs: [],
  v: { "CabalGate.cabalAlive": true, "CabalGate.diedAt": 0n },
  timestamp: V,
  ...o,
});
const plea = (o = {}) => ({
  id: 7n,
  seller: "0x00000000000000000000000000000000000000a1",
  amount: 500000n * E,
  balance: 2500000n * E,
  need: 37,
  score: 44,
  status: 4,
  verdictAt: BigInt(V),
  submittedAt: BigInt(V - 240),
  standing: [true, false, 255],
  points: 44,
  excluded: false,
  objections: [],
  text: "A plea.",
  ...o,
});
const objection = (id, ruling, o = {}) => ({
  id: BigInt(id),
  pleaId: 7n,
  objector: "0x00000000000000000000000000000000000000b" + id,
  ruling,
  newScore: 0,
  filedAt: BigInt(V + 60),
  settled: false,
  text: "Too high.",
  ...o,
});

test("IMD5/r2C-N2: a pending objection past filedAt + PENDING_EXPIRY is stale, frees its slot and holds nothing", () => {
  const s = snap(),
    o = objection(1, 1, { filedAt: BigInt(V + 60) }),
    p = plea({ objections: [o], standing: [true, false, 255] });
  assert.equal(objectionStale(o, p, s, V + 60 + 1200), false);
  assert.equal(objectionStale(o, p, s, V + 60 + 1201), true);
  // The Tribunal's standing() already ignores it (its Intake request completed): stale at once.
  assert.equal(
    objectionStale(o, { ...p, standing: [false, false, 255] }, s, V + 600),
    true,
  );
  // A sustain or an excluded seller says nothing about the pending one.
  assert.equal(
    objectionStale(o, { ...p, standing: [false, true, 30] }, s, V + 600),
    false,
  );
  assert.equal(
    objectionStale(
      o,
      { ...p, standing: [false, false, 255], excluded: true },
      s,
      V + 600,
    ),
    false,
  );
  const cs = caseState(p, s, V + 1300);
  assert.equal(cs.filed, 0);
  assert.equal(cs.pending.length, 0);
  assert.equal(cs.stale.length, 1);
  assert.equal(cs.closed, `at ${clock(V + 1200)}`);
  assert.match(
    objectionLine(o, p, s, V + 1300),
    /^no answer within 20 minutes: void once anyone expires it/,
  );
  assert.equal(objectionLine(o, p, s, V + 600), "pending");
  // One stale and one live: the case is not full (object() voids the stale one first).
  const two = plea({
    objections: [o, objection(2, 1, { filedAt: BigInt(V + 1150) })],
  });
  const c2 = caseState(two, s, V + 1190 + 100);
  assert.equal(c2.filed, 1);
  assert.equal(c2.full, false);
  // No stale objection is ever the share card's or post's state.
  assert.equal(objectionCase(p, s, V + 1300).state, undefined);
  assert.equal(shareState(p, s, V + 1300), "SOLD");
  assert.doesNotMatch(
    shareStatus({ ...p, standing: [false, false, 255] }, s, V + 1300, "my plea"),
    /re-scores/,
  );
});

test("r2D-N5/r2C-N3: points can be recorded when the window closes or the last live objection is ruled or expires", () => {
  const s = snap();
  // Window open, nothing filed.
  assert.deepEqual(recordFrom(plea(), s, V + 100), {
    until: V + 1200,
    objection: undefined,
    objections: [],
    nextBlock: false,
  });
  assert.equal(
    recordHint(plea(), s, V + 100),
    `Record your +44 points after ${clock(V + 1200)}, when objections close.`,
  );
  assert.equal(
    recordHint(plea(), s, V + 100, "your", false),
    `Record your +44 points after ${clock(V + 1200)}.`,
  );
  // Filed late in the window: held until filedAt + PENDING_EXPIRY, never a past time.
  const late = objection(2, 1, { filedAt: BigInt(V + 1100) }),
    p = plea({ objections: [late] });
  const f = recordFrom(p, s, V + 1500);
  assert.equal(f.until, V + 1100 + 1200);
  assert.equal(f.objection.id, 2n);
  assert.equal(
    recordHint(p, s, V + 1500, "the"),
    `Record the +44 points after ${clock(V + 2300)}, when objection #2 is ruled or expires.`,
  );
  // Two pending: both named.
  const both = plea({
    objections: [
      objection(1, 1, { filedAt: BigInt(V + 1090) }),
      objection(2, 1, { filedAt: BigInt(V + 1100) }),
    ],
  });
  assert.equal(
    recordHint(both, s, V + 1500),
    `Record your +44 points after ${clock(V + 2300)}, when objections #1 and #2 are ruled or expire.`,
  );
  // Two rulings before the sale close the case: record now (the chain says not held).
  const ruled = plea({
    standing: [false, false, 39],
    objections: [objection(1, 3, { newScore: 40 }), objection(2, 3, { newScore: 39 })],
  });
  assert.equal(recordFrom(ruled, s, V + 300), undefined);
  assert.equal(recordHint(ruled, s, V + 300), "Record your +44 points now.");
  // No hint where there are no points.
  assert.equal(recordHint(plea({ standing: [false, true, 30] }), s, V + 100), "");
  assert.equal(recordHint(plea({ excluded: true }), s, V + 100), "");
  assert.equal(recordHint(plea({ recorded: true }), s, V + 2000), "");
});

test("r2C-N5: with no PleaFailed log, no verdict never states an expiry still to come", () => {
  const sub = BigInt(V),
    end = V + 1200;
  // Refused, history complete: the log names the reason.
  const log = { eventName: "PleaFailed", args: { id: 12n } };
  const refused = plea({
    id: 12n,
    status: 6,
    submittedAt: sub,
    failure: { status: 1, answered: 0, agreed: 0 },
  });
  assert.equal(noVerdict(refused, snap({ logs: [log] }), V + 30).kind, "refused");
  assert.equal(
    noVerdict(refused, snap({ logs: [log] }), V + 30).detail,
    "Cleared at once by the Intake.",
  );
  // The same plea while the history scan failed: closed by the Intake, no future expiry.
  const unread = { ...refused, failure: undefined };
  const n = noVerdict(unread, snap({ historyError: "x" }), V + 30);
  assert.equal(n.kind, "closed");
  assert.doesNotMatch(n.detail + n.sentence, /expired at/);
  // Past the expiry with incomplete history: the reason is unknown.
  const u = noVerdict(unread, snap({ historyError: "x" }), end + 60);
  assert.equal(u.kind, "unknown");
  assert.equal(u.detail, "");
  // Past the expiry with full history and no log: no answer, at a time already past.
  const a = noVerdict(unread, snap(), end + 60);
  assert.equal(a.kind, "no answer");
  assert.equal(a.detail, `The request expired at ${clock(end)} with no answer.`);
  // Still pending on chain, but the Intake completed the request.
  assert.equal(
    noVerdict({ ...unread, status: 1, completed: true }, snap(), V + 30).kind,
    "closed",
  );
  // Split.
  assert.equal(
    noVerdict(
      { ...refused, failure: { status: 2, answered: 29, agreed: 14 } },
      snap({ logs: [log] }),
      V + 30,
    ).sub,
    "panel split 14/29",
  );
});

test("E3b: the share of the bag is CabalGate._shareBps (rounded up), printed one way", () => {
  // 331.something bps: the floor read 3.31%, the fact cells 3.32%.
  assert.equal(sharePercent(3315n * E, 100000n * E), "3.32%");
  assert.equal(sharePercent(3310n * E, 100000n * E), "3.31%");
  assert.equal(sharePercent(20000n * E, 100000n * E), "20%");
  assert.equal(sharePercent(20000n * E + 1n, 100000n * E), "20.01%");
});

test("r2D-N6: a letter's delivery pays no auto-sell fee", () => {
  assert.equal(deliverOut(5n * E, 3), 5n * E);
  assert.equal(deliverOut(5n * E, 2), 5n * E - LETTERBOX.AUTO_SELL_FEE);
  assert.equal(deliverOut(LETTERBOX.AUTO_SELL_FEE - 1n, 2), 0n);
});

test("S13/r2C-V1/E3a: share labels and posts per state; 'the sale stands' only for a sold plea; every ruling named", () => {
  const s = snap({
    logs: [{ eventName: "SellExecuted", args: { id: 7n, imdOut: 1078n * 10n ** 16n } }],
  });
  const now = V + 600;
  // Sold with one pending objection.
  const pending = plea({ objections: [objection(9, 1)] });
  assert.equal(
    shareSentence(pending, s, now),
    "Sold, 44 vs need 37, for 10.78 imdTEST. Objection #9 pending: +44 points held.",
  );
  assert.equal(
    shareStatus(pending, s, now, "my plea"),
    "OBJECTION #9 to my plea (SOLD, 44 vs need 37): a new panel re-scores it, and 34 or less means no points.",
  );
  // Sustained: sold, unsold in the window, lapsed.
  const sus = { standing: [false, true, 30], points: 0, objections: [objection(8, 2, { newScore: 30 })] };
  assert.equal(
    shareSentence(plea(sus), s, now),
    "Sold, 44 vs need 37, for 10.78 imdTEST. Objection #8 sustained, 30 vs need 37: no points.",
  );
  assert.equal(
    shareStatus(plea(sus), s, now, "my plea"),
    "Objection #8 SUSTAINED: my plea re-scored 30 vs need 37, no points; the sale stands.",
  );
  const unsold = plea({ ...sus, status: 2 });
  assert.equal(
    shareStatus(unsold, s, V + 300, "my plea"),
    "Objection #8 SUSTAINED: my plea re-scored 30 vs need 37, no points.",
  );
  assert.equal(
    shareSentence(unsold, s, V + 300),
    "Approved, 44 vs need 37. Objection #8 sustained, 30 vs need 37: no points.",
  );
  assert.equal(
    shareStatus(unsold, s, V + 500, "my plea"),
    "Objection #8 SUSTAINED: my plea re-scored 30 vs need 37, no points; nothing was sold.",
  );
  // Two sustained objections (run 9 plea #14): both named.
  const two = plea({
    ...sus,
    objections: [objection(1, 2, { newScore: 30 }), objection(2, 2, { newScore: 28 })],
  });
  assert.equal(
    shareStatus(two, s, now, "plea #7 by kafka_cat"),
    "Objections #1 and #2 SUSTAINED: plea #7 by kafka_cat re-scored 30 and 28 vs need 37, no points; the sale stands.",
  );
  assert.equal(
    shareSentence(two, s, now),
    "Sold, 44 vs need 37, for 10.78 imdTEST. Objection #1 sustained, 30 vs need 37; objection #2 sustained, 28 vs need 37: no points.",
  );
  // Overruled.
  const over = plea({ standing: [false, false, 40], points: 40, objections: [objection(7, 3, { newScore: 40 })] });
  assert.equal(
    shareSentence(over, s, now),
    "Sold, 44 vs need 37, for 10.78 imdTEST. Objection #7 overruled, 40 vs need 37: counts 40 points.",
  );
  // Pending plea and no verdict, from share-cards.html.
  const pend = plea({ status: 1, verdictAt: 0n, submittedAt: BigInt(V), objections: [] });
  assert.equal(
    shareSentence(pend, s, V + 60),
    `Pending until ${clock(V + 1200)}. Need 37, 500,000 PLEA, 20% of the bag.`,
  );
  assert.equal(
    shareSentence({ ...pend, status: 6 }, s, V + 1300),
    "No verdict: no answer within 20 minutes. No cooldown.",
  );
  // Denied: the appeal only while it is open (r2C-N4).
  const denied = plea({ status: 3, score: 20, standing: [false, false, 255], points: 0 });
  assert.equal(
    shareStatus(denied, s, V + 600, "my plea"),
    `DENIED: my plea, 20 vs need 37. Appeal until ${clock(V + 14400)}.`,
  );
  assert.equal(shareStatus(denied, s, V + 14401, "my plea"), "DENIED: my plea, 20 vs need 37.");
  assert.equal(
    shareSentence(denied, s, V + 14401),
    "Denied, 20 vs need 37.",
  );
  // Appeals: overturned and sold, upheld with the first plea's score.
  assert.equal(
    shareSentence(plea({ isAppeal: true, originalId: 5n, standing: [false, false, 255] }), s, V + 3000),
    "Overturned on appeal, 44 vs need 37. Sold for 10.78 imdTEST, +44 points.",
  );
  assert.equal(
    shareSentence(plea({ isAppeal: true, originalId: 5n, status: 3, score: 30, points: 0 }), s, V + 3000, { originalScore: 28 }),
    "Upheld on appeal, 30 vs need 37. The first plea, #5, scored 28. No further appeal.",
  );
  // Plain approved, with the rank.
  assert.equal(
    shareSentence(plea({ status: 2 }), s, V + 60, { rank: 3, season: 1n }),
    "Approved, 44 vs need 37. +44 points held, season 2 rank 4.",
  );
});

test("L3: a pending plea reads 'no verdict yet' only while a verdict can still come", () => {
  const pending = plea({ status: 1, verdictAt: 0n, submittedAt: BigInt(V - 240) });
  assert.equal(pendingVerdictWords(pending, snap(), V), "no verdict yet");
  // Past CabalGate.PENDING_EXPIRY (_stale) no verdict can come; anyone may expire it.
  assert.equal(pendingVerdictWords(pending, snap(), V - 240 + 1200), "no verdict yet");
  assert.equal(pendingVerdictWords(pending, snap(), V - 240 + 1201), "no verdict");
  // Its Intake request completed without an answer: stale too.
  assert.equal(pendingVerdictWords({ ...pending, completed: true }, snap(), V), "no verdict");
  // After the death onOracleResult refuses every verdict, however fresh the plea.
  const dead = snap({ v: { "CabalGate.cabalAlive": false, "CabalGate.diedAt": BigInt(V - 60) } });
  assert.equal(pendingVerdictWords(pending, dead, V), "no verdict");
});
