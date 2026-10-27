// Site sweep fixes: objection void reasons, the plea lead and timeline for every viewer, the
// toasts that read as someone else's (record, claim) or said nothing (settle, expire, rebalance,
// flush), incomplete-history states (open cases, plea transactions, claims), season projections
// and closed seasons, and the remaining sweep items.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-sweep-"));
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
const chain = await load("chain");
const toasts = await load("toast-text");
const models = await load("models");
const {
  voidKind,
  objectionLine,
  pleaLead,
  cooldownStep,
  missingTxText,
  readCourtHistory,
  stakeNote,
  claimState,
  utc,
  clock,
} = chain;
const plain = (t) =>
  t === undefined
    ? undefined
    : typeof t === "string"
      ? t
      : t.map((x) => (typeof x === "string" ? x : x.text)).join("");

const E = 10n ** 18n;
const V = 1792600000; // a verdict time
const SEASONS = "0x00000000000000000000000000000000000000c5";
const snap = (o = {}) => ({
  constants: {
    "Tribunal.OBJECTION_WINDOW": 1200,
    "Tribunal.PENDING_EXPIRY": 1200,
    "Tribunal.MAX_OBJECTIONS": 2,
    "Tribunal.MARGIN": 2,
    "Tribunal.STAKE": 35n * 10n ** 16n,
    "CabalGate.PENDING_EXPIRY": 1200,
    "CabalGate.EXECUTE_WINDOW": 420,
    "CabalGate.COOLDOWN": 14400,
    "CabalGate.ORACLE_FEE": 5n * 10n ** 17n,
    "CabalGate.QUORUM": 17,
    pairSymbol: "imdTEST",
    pairDecimals: 18,
    decimals: 18,
    symbol: "PLEA",
  },
  logs: [],
  pleas: [],
  v: { "CabalGate.cabalAlive": true, "CabalGate.diedAt": 0n },
  timestamp: V,
  ...o,
});
const plea = (o = {}) => ({
  id: 7n,
  seller: "0x4B8900000000000000000000000000000000de28",
  amount: 500000n * E,
  balance: 2500000n * E,
  need: 37,
  score: 44,
  status: 2,
  flags: 0,
  verdictAt: BigInt(V),
  submittedAt: BigInt(V - 240),
  standing: [true, false, 255],
  points: 44,
  excluded: false,
  objections: [],
  text: "A plea.",
  name: "",
  ...o,
});

test("sweep P1: a void objection says refused, no answer, or split-or-no-answer, from ObjectionVoid", () => {
  const stale = "0x" + Buffer.from("stale").toString("hex").padEnd(64, "0"),
    failed = "0x" + Buffer.from("failed").toString("hex").padEnd(64, "0");
  const logs = [
    { eventName: "ObjectionVoid", args: { id: 5n, pleaId: 6n, status: 2, reason: failed } },
    { eventName: "ObjectionVoid", args: { id: 7n, pleaId: 18n, status: 1, reason: failed } },
    { eventName: "ObjectionVoid", args: { id: 8n, pleaId: 18n, status: 2, reason: stale } },
  ];
  assert.equal(voidKind(logs, 5n), "failed");
  assert.equal(voidKind(logs, 7n), "refused");
  assert.equal(voidKind(logs, 8n), "stale");
  assert.equal(voidKind(logs, 9n), "unknown");
  const s = snap(),
    p = plea({ status: 4 }),
    line = (id) =>
      objectionLine({ id: BigInt(id), ruling: 4, reason: voidKind(logs, BigInt(id)) }, p, s, V);
  assert.equal(line(5), "#5: the panel split or gave no answer: nothing changes");
  assert.equal(line(7), "#7: request refused: nothing changes");
  assert.equal(line(8), "#8: no answer within 20 minutes: nothing changes");
  assert.equal(line(9), "#9: no ruling: nothing changes");
  for (const id of [5, 7, 8, 9]) assert.doesNotMatch(line(id), /^#\d+: the panel split:/);
  assert.equal(chain.voidWords("refused", s, true), "request refused");
  assert.equal(chain.voidWords("failed", s, true), "split or no answer");
});

test("sweep P7: only the seller is told to sell; others read who can, until when", () => {
  const s = snap(),
    o = { state: "APPROVED", canSell: true, missedSeason: false };
  assert.match(
    plain(pleaLead(plea(), s, { ...o, mine: true })),
    /^The Cabal approved your plea\. Sell within the 7-minute window, by /,
  );
  const other = pleaLead(plea(), s, { ...o, mine: false });
  assert.equal(
    plain(other),
    `The Cabal approved this plea. 0x4B89…de28 can sell until ${clock(V + 420)}.`,
  );
  assert.ok(other.some((x) => typeof x === "object" && x.mono), "the address is mono");
  assert.doesNotMatch(plain(other), /Sell within/);
  assert.equal(
    plain(pleaLead(plea({ name: "lynx_judge" }), s, { ...o, mine: false })),
    `The Cabal approved this plea. lynx_judge can sell until ${clock(V + 420)}.`,
  );
  assert.equal(
    plain(pleaLead(plea({ flags: 3 }), s, { ...o, mine: false })),
    `The Cabal approved this plea. Anyone can sell it for 0x4B89…de28 until ${clock(V + 420)}.`,
  );
  assert.match(
    plain(pleaLead(plea({ excluded: true }), s, { ...o, mine: false })),
    /can sell until .*\. This seller is excluded from season points\.$/,
  );
});

test("sweep P12: the Timeline's cooldown runs from the sale, or from the verdict on a lapse", () => {
  const s = snap();
  // Inside the window: both branches, as plea.html:181.
  const open = cooldownStep(plea(), s, V + 60, undefined, true);
  assert.equal(
    open.text,
    `From the sale: next plea at ${clock(V + 60 + 14400)} if you sell now. If the plea lapses, from the verdict: ${clock(V + 14400)}.`,
  );
  assert.match(cooldownStep(plea(), s, V + 60).text, /if it is sold now\./);
  // Sold: from the sale's block time.
  const sold = cooldownStep(plea({ status: 4 }), s, V + 600, V + 18);
  assert.equal(sold.text, `From the sale until ${clock(V + 18 + 14400)}`);
  assert.equal(sold.done, false);
  assert.equal(cooldownStep(plea({ status: 4 }), s, V + 600).text, "Runs from the sale.");
  assert.equal(cooldownStep(plea({ status: 4 }), s, V + 18 + 14401, V + 18).done, true);
  // Lapsed (by the clock or the chain) and denied: from the verdict.
  assert.equal(cooldownStep(plea(), s, V + 421).text, `From this verdict until ${clock(V + 14400)}`);
  assert.equal(cooldownStep(plea({ status: 5 }), s, V + 600).text, `From this verdict until ${clock(V + 14400)}`);
  assert.equal(cooldownStep(plea({ status: 3 }), s, V + 600).text, `From this verdict until ${clock(V + 14400)}`);
});

test("sweep M2: a plea's transaction under incomplete history is not 'No transaction yet'", () => {
  assert.equal(
    missingTxText(BigInt(V), "History could not be read completely."),
    `${clock(V)} · the link shows once the history is read`,
  );
  assert.equal(missingTxText(0n, "History could not be read completely."), "No transaction yet");
  assert.equal(missingTxText(BigInt(V), undefined), "No transaction yet");
});

test("sweep M1: approvals inside their window are open even when the history scan has no Verdict log", async () => {
  const constants = { "CabalGate.PENDING_EXPIRY": 1200, "Tribunal.OBJECTION_WINDOW": 1200 };
  const r = {
    client: {
      async getBlock() {
        throw Error("not needed");
      },
      async readContract() {
        throw Error("not needed");
      },
    },
  };
  const recent = [
    plea({ id: 3n, status: 1, verdictAt: 0n }),
    plea({ id: 2n, status: 2, verdictAt: BigInt(V) }),
    plea({ id: 1n, status: 4, verdictAt: BigInt(V - 1300) }),
  ];
  const court = await readCourtHistory(r, [], recent, constants, V + 500);
  assert.deepEqual(court.open.map((p) => p.id), [2n]);
  const later = await readCourtHistory(r, [], recent, constants, V + 1201);
  assert.deepEqual(later.open, []);
});

test("sweep P10: a settled stake says where it went", () => {
  assert.equal(stakeNote({ ruling: 3, settled: false }), "to the season prize pot");
  assert.equal(stakeNote({ ruling: 3, settled: true }), "went to the season prize pot");
  assert.equal(stakeNote({ ruling: 2, settled: false }), "back to the objector");
  assert.equal(stakeNote({ ruling: 2, settled: true }), "returned");
  assert.equal(stakeNote({ ruling: 4, settled: true }), "returned");
  assert.equal(stakeNote({ ruling: 1 }, true), "held until expired, then back to the objector");
  const s = snap();
  const pot = toasts.stakeSettledToast(
    { id: 3n, to: SEASONS, amount: 35n * 10n ** 16n },
    s,
    SEASONS,
    "0x00000000000000000000000000000000000000b2",
    1n,
  );
  assert.equal(plain(pot.text), "Objection #3 settled: 0.35 imdTEST went to the season prize pot.");
  assert.equal(pot.href, "#/p/1");
  const back = toasts.stakeSettledToast(
    { id: 4n, to: "0x7a3f00000000000000000000000000000000c21e", amount: 35n * 10n ** 16n },
    s,
    SEASONS,
    "0x00000000000000000000000000000000000000b2",
  );
  assert.equal(plain(back.text), "Objection #4 settled: 0.35 imdTEST returned to 0x7a3f…c21e.");
  const mine = toasts.stakeSettledToast(
    { id: 4n, to: "0x7a3f00000000000000000000000000000000c21e", amount: 35n * 10n ** 16n },
    s,
    SEASONS,
    "0x7A3F00000000000000000000000000000000C21E",
  );
  assert.equal(plain(mine.text), "Objection #4 settled: 0.35 imdTEST returned to you.");
  const escrow = toasts.escrowReturnedToast(
    { id: 7n, writer: "0x7a3f00000000000000000000000000000000c21e", amount: 500000n * E, tip: 25n * 10n ** 16n },
    s,
  );
  assert.equal(
    plain(escrow.text),
    "Plea #7’s escrow returned: 500,000 PLEA and the 0.25 imdTEST tip to 0x7a3f…c21e.",
  );
  assert.equal(escrow.body, "The 0.50 imdTEST oracle fee is spent.");
});

test("sweep P9: recording another wallet's plea names whose points they are", () => {
  const rec = { pleaId: 2n, season: 0n, wallet: "0x00000000000000000000000000000000000000a2" };
  const own = toasts.recordedToast(rec, 44, { best: [44, 0, 0], rank: 0 }, rec.wallet);
  assert.equal(plain(own.text), "+44 points recorded.");
  assert.equal(own.body, "Season 1: 44 points (44), rank 1.");
  const other = toasts.recordedToast(
    rec,
    44,
    { best: [44, 0, 0], rank: 0 },
    "0x00000000000000000000000000000000000000a5",
  );
  assert.equal(plain(other.text), "Plea #2: +44 points recorded for 0x0000…00a2.");
  assert.equal(other.body, "Season 1: 44 points, rank 1.");
  assert.equal(other.href, "#/p/2");
  const named = toasts.recordedToast(rec, 44, undefined, undefined, "lynx_judge");
  assert.equal(plain(named.text), "Plea #2: +44 points recorded for lynx_judge.");
  assert.equal(named.body, undefined);
});

test("sweep P6: a claim for another address is not called a vault claim", () => {
  const s = snap(),
    c = { index: 3n, account: "0x8826000000000000000000000000000000Af16", amount: 2500000n * E };
  const listed = toasts.claimToast(c, s);
  assert.equal(plain(listed.text), "Claimed 2,500,000 PLEA for 0x8826…Af16.");
  assert.equal(listed.body, "Claim #3 is done. Selling it will take a plea.");
  const vault = toasts.claimToast(c, s, true);
  assert.equal(plain(vault.text), "Claimed 2,500,000 PLEA for the vault 0x8826…Af16.");
  assert.equal(vault.body, "The PLEA is on the vault; this wallet paid only the gas.");
});

test("sweep P11, P20, P4: expire, rebalance and flush have their own toasts", () => {
  const s = snap();
  const late = toasts.pleaExpiredToast(4n, s, { submittedAt: BigInt(V), flags: 0 }, V + 1320);
  assert.equal(plain(late.text), "Plea #4 expired: no answer within 20 minutes.");
  assert.equal(late.body, "No cooldown; the 0.50 imdTEST oracle fee is spent.");
  const early = toasts.pleaExpiredToast(4n, s, { submittedAt: BigInt(V), flags: 2 }, V + 300);
  assert.equal(plain(early.text), "Plea #4 expired: the Intake closed it without a verdict.");
  assert.match(early.body, /Return escrow and tip gives the writer’s PLEA and the tip back\.$/);
  assert.equal(plain(toasts.pleaExpiredToast(4n, s).text), "Plea #4 expired: no answer within 20 minutes.");
  const rebal = toasts.rebalanceToast(s, { imdDeployed: 185131n * 10n ** 14n }, { pleaBurned: 0n });
  assert.equal(plain(rebal.text), "Buy wall rebalanced: 18.51 imdTEST placed just below the price.");
  assert.equal(rebal.body, undefined);
  const both = toasts.rebalanceToast(s, { imdDeployed: E }, { pleaBurned: 120000n * E });
  assert.equal(both.body, "The old wall’s 120,000 PLEA was burned.");
  assert.equal(toasts.rebalanceToast(s).body, "No new wall was placed this time.");
  const flush = toasts.flushToast(s, 14583n * 10n ** 14n, 1000000n * E);
  assert.equal(flush.text, "Leftovers sent to the buy wall.");
  assert.equal(
    flush.body,
    "The 1.45 imdTEST now backs the wall and the unused 1,000,000 PLEA bonus is burned. Nothing is left in Seasons.",
  );
});

test("sweep P19 and R5: claim dates carry the day; an unread isClaimed is never 'claimable'", () => {
  const today = Math.floor(Date.now() / 1000);
  assert.equal(utc(today), new Date(today * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC");
  assert.equal(utc(today, true).length, "2026-10-27 09:14:00 UTC".length);
  assert.doesNotMatch(clock(today), /^\d{4}-/, "clock() still drops today's date elsewhere");
  assert.equal(claimState({ data: true }), "claimed");
  assert.equal(claimState({ data: false }), "claimable");
  assert.equal(claimState({ loading: true }), "checking");
  assert.equal(claimState({ error: "The public RPC did not answer." }), "unknown");
});

const seasonText = await load("season-text");
const appeal = await load("appeal");

test("sweep R3: points are no longer held once the page clock passes the window and the last live objection", () => {
  const s = snap(),
    o = { id: 1n, pleaId: 7n, ruling: 1, filedAt: BigInt(V + 75), objector: "0xb1" },
    p = plea({ status: 4, objections: [o], standing: [true, false, 255] });
  // Filed 75 s after the verdict: held until filedAt + PENDING_EXPIRY, past the window.
  assert.equal(chain.recordFrom(p, s, V + 600).until, V + 75 + 1200);
  assert.equal(chain.pointsHeld(p, s, V + 75 + 1200), true);
  // Stale by the page clock, with the snapshot's standing() still read as held: recordable now.
  assert.equal(chain.recordFrom(p, s, V + 75 + 1201), undefined);
  assert.equal(chain.pointsHeld(p, s, V + 75 + 1201), false);
  assert.equal(chain.recordHint(p, s, V + 75 + 1201), "Record your +44 points now.");
  // No objection: the window alone, inclusive of its last second (Tribunal.standing: <=).
  const q = plea({ status: 4 });
  assert.equal(chain.pointsHeld(q, s, V + 1200), true);
  assert.equal(chain.pointsHeld(q, s, V + 1201), false);
});

test("sweep P2: a later waiting season's pot carries what the earlier closes roll over", () => {
  // Season 1 (fees 1.23, nobody qualifies) closes first and rolls everything into season 2.
  const s1 = { fees: 123n * 10n ** 16n, paidBps: [] };
  assert.equal(models.carriedRollover(0n, [s1]), 123n * 10n ** 16n);
  // The run-9 numbers: season 1 0.3708 unpaid, season 2's own 0.0562: amountIn 0.4270, and
  // rank 1's 4.50% of it is 0.0192 (PrizePaid); the rest rolls into season 3.
  const fees1 = 3708n * 10n ** 14n,
    fees2 = 562n * 10n ** 14n,
    carried = models.carriedRollover(0n, [{ fees: fees1, paidBps: [] }]);
  const amountIn = fees2 + carried;
  assert.equal(amountIn, 4270n * 10n ** 14n);
  assert.equal((amountIn * 450n) / 10000n, 19215n * 10n ** 12n);
  // Two waiting seasons ahead, each paying a share rounded down on its own.
  const two = models.carriedRollover(10n ** 18n, [
    { fees: 0n, paidBps: [450n, 400n] },
    { fees: 10n ** 18n, paidBps: [450n] },
  ]);
  const first = 10n ** 18n - (10n ** 18n * 450n) / 10000n - (10n ** 18n * 400n) / 10000n;
  assert.equal(two, first + 10n ** 18n - ((first + 10n ** 18n) * 450n) / 10000n);
});

test("sweep P4: the flush is offered only while Seasons holds something", () => {
  const s = snap(),
    base = { last: 8n, bonusSeasons: 6n, s };
  const offer = seasonText.flushCopy({ ...base, pot: 14583n * 10n ** 14n, pleaLeft: 0n });
  assert.equal(offer.offer, true);
  assert.match(offer.text, /^What is left in Seasons goes to the buy wall/);
  const early = seasonText.flushCopy({ ...base, last: 1n, pot: 0n, pleaLeft: 40000000n * E });
  assert.equal(early.offer, true);
  assert.match(early.text, /Season 2 was the last, so the 40,000,000 PLEA of seasons 3 to 6 is burned\.$/);
  const done = seasonText.flushCopy({
    ...base,
    pot: 0n,
    pleaLeft: 0n,
    flushed: { toWall: 14583n * 10n ** 14n },
  });
  assert.equal(done.offer, false);
  assert.equal(
    done.text,
    "The leftovers went to the buy wall: 1.45 imdTEST now backs it. Nothing is left in Seasons.",
  );
  assert.equal(
    seasonText.flushCopy({ ...base, pot: 0n, pleaLeft: 0n }).text,
    "The leftovers went to the buy wall. Nothing is left in Seasons.",
  );
  assert.equal(seasonText.flushCopy({ ...base, pot: 0n }).offer, false);
});

test("sweep R8, R9: a prize under a cent is '< 0.01'; the seasons foot after the last close", () => {
  const s = snap();
  assert.deepEqual(
    seasonText.seasonPrize({ closed: true, points: 70, imd: 9n * 10n ** 14n, bonus: 450000n * E }, 60, s),
    { value: "< 0.01 imdTEST", note: "+ 450,000 PLEA" },
  );
  assert.equal(
    seasonText.seasonPrize({ closed: true, points: 70, imd: 72n * 10n ** 15n, bonus: 0n }, 60, s).value,
    "0.07 imdTEST",
  );
  assert.equal(
    seasonText.seasonsFoot({ season: 8n, rank: 0, qualifies: false, closeFrom: "08:42 UTC", closed: true }),
    "Prizes were rounded down and paid at each season’s close.",
  );
  assert.match(
    seasonText.seasonsFoot({ season: 1n, rank: 0, qualifies: true, closeFrom: "19:11 UTC" }),
    /paid at the close, from 19:11 UTC\.$/,
  );
});

test("sweep R11, R21: a letter's cooldown and a closed appeal window are known before sending", () => {
  assert.equal(appeal.letterCooldown([0, 0, 0, 0], 14400), 0);
  assert.equal(appeal.letterCooldown([V, V + 60, 0, 0], 14400), V + 60 + 14400);
  const denied = { status: 3, isAppeal: false, appealed: false, verdictAt: BigInt(V) };
  assert.equal(appeal.appealClosedWhy(16n, denied, V + 14400, 14400), "");
  assert.equal(
    appeal.appealClosedWhy(16n, denied, V + 14401, 14400),
    `The appeal window for plea #16 closed at ${clock(V + 14400)}.`,
  );
  assert.equal(
    appeal.appealClosedWhy(16n, { ...denied, appealed: true }, V + 60, 14400),
    "Plea #16 has already been appealed.",
  );
  assert.equal(
    appeal.appealClosedWhy(16n, { ...denied, isAppeal: true }, V + 60, 14400),
    "Plea #16 is itself an appeal: no further appeal.",
  );
  assert.match(appeal.appealClosedWhy(16n, { ...denied, status: 4 }, V + 60, 14400), /was not denied/);
  assert.equal(appeal.appealClosedWhy(0n, undefined, V, 14400), "You have no plea to appeal.");
});

test("sweep P3: an open escrow is named on Letters and Profile, before and after the death", () => {
  const alive = snap(),
    dead = snap({ v: { "CabalGate.cabalAlive": false, "CabalGate.diedAt": BigInt(V) } }),
    e = { id: 7n, amount: 500000n * E, tip: 25n * 10n ** 16n };
  const mineDead = chain.escrowWaiting(e, dead, true);
  assert.equal(mineDead.title, "Plea #7’s escrow still holds 500,000 PLEA.");
  assert.equal(
    mineDead.body,
    "Return escrow and tip on plea #7 sends it back to you with the 0.25 imdTEST tip.",
  );
  assert.match(chain.escrowWaiting(e, alive, true).body, /your next letter also returns it first\.$/);
  assert.equal(
    chain.escrowWaiting(e, dead, false).title,
    "Plea #7’s escrow still holds this wallet’s 500,000 PLEA.",
  );
});
