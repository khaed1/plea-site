// Re-test FIXUP batch: the head-lag scan (P1), the share labels against share-cards.html (S13),
// every sustained or ruled objection named (E3a), the dead-man words (X8), the APPEAL letter's fee
// rule, the read-error titles (r2X-9) and the profile loading band (checksummed address).
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { appealFeeBlock, LETTERBOX } from "../src/models.ts";
import { NO_ANSWER, readErrorTitle } from "../src/rpc-health.ts";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-fixup-"));
after(() => rm(dir, { recursive: true, force: true }));
// `as` builds a separate copy: chain.ts keeps the node's block limit in a module-level variable,
// so each scan case gets a fresh module, as a fresh page load would.
async function load(name, as = name) {
  const outfile = path.join(dir, as + ".mjs");
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
const { caseState, caseClosedText, deadmanWords, clock } = await load("chain");
const { shareSentence, shareStatus } = await load("share-text");
const { loadingLine, loadingTitle } = await load("loading-text");

// A node `lag` blocks behind `head` that refuses ranges over `limit` blocks. `headFirst`: it checks
// the head before the range (the order sentio uses is unknown; both must read every block).
function node({ head, lag, limit, headFirst }) {
  const calls = [];
  const tooWide = (a, b) =>
    b - a + 1n > limit &&
    Object.assign(new Error("HTTP request failed."), {
      cause: { status: 429, details: `public eth_getLogs is limited to ${limit} blocks` },
    });
  const beyond = (b) =>
    b > head - lag &&
    Object.assign(new Error("RPC Request failed."), {
      cause: {
        code: -32000,
        details: `block ${b} is beyond the latest block ${head - lag} of this node, retry later`,
      },
    });
  return {
    calls,
    r: {
      addresses: { CabalGate: "0x0000000000000000000000000000000000000001" },
      abis: {},
      client: {
        async getLogs({ fromBlock: a, toBlock: b }) {
          calls.push([a, b]);
          const first = headFirst ? beyond(b) : tooWide(a, b),
            second = headFirst ? tooWide(a, b) : beyond(b);
          if (first) throw first;
          if (second) throw second;
          return [];
        },
      },
    },
  };
}
/** The blocks the scan read, merged; they must be from..covered with no gap. */
function gaps(calls, from, covered) {
  const ok = calls.filter(([a, b], i) => i >= 0).sort((x, y) => Number(x[0] - y[0]));
  let next = from;
  const holes = [];
  for (const [a, b] of ok) {
    if (a > next) holes.push([next, a - 1n]);
    if (b + 1n > next) next = b + 1n;
  }
  if (next <= covered) holes.push([next, covered]);
  return holes;
}

test("P1: a node that answers the head lag before its block limit still reads the whole range", async () => {
  for (const headFirst of [true, false]) {
    const { scanLogs } = await load("chain", `chain-scan-${headFirst}`);
    const n = node({ head: 11962713n, lag: 1n, limit: 1000n, headFirst });
    const scan = await scanLogs(n.r, 11958819n, 11962713n);
    assert.equal(scan.error, undefined, `headFirst ${headFirst}`);
    assert.equal(scan.lagged, true);
    // Everything up to the node's head is read, in reads the node accepts.
    assert.equal(scan.covered, 11962712n, `headFirst ${headFirst}`);
    const served = [];
    for (const [a, b] of n.calls)
      if (b - a + 1n <= 1000n && b <= 11962712n) served.push([a, b]);
    assert.deepEqual(gaps(served, 11958819n, scan.covered), []);
    // The next poll resumes at the block that was not yet due.
    const next = await scanLogs(n.r, scan.covered + 1n, 11962713n);
    assert.equal(next.error, undefined);
    assert.equal(next.covered, 11962712n);
  }
});
test("P1: a lag inside a split chunk still stops the scan at the node's head", async () => {
  const { scanLogs } = await load("chain", "chain-scan-split");
  // The limit is learnt on the first chunk; the lag shows only in the last 1,000-block piece.
  const n = node({ head: 25000n, lag: 2n, limit: 1000n, headFirst: false });
  const scan = await scanLogs(n.r, 1n, 25000n);
  assert.equal(scan.error, undefined);
  assert.equal(scan.lagged, true);
  assert.equal(scan.covered, 24998n);
  const served = n.calls.filter(([a, b]) => b - a + 1n <= 1000n && b <= 24998n);
  assert.deepEqual(gaps(served, 1n, scan.covered), []);
  // No read past the head once the lag is known.
  assert.ok(n.calls.every(([, b]) => b <= 25000n));
});

const E = 10n ** 18n;
const V = 1792600000;
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
  pleas: [],
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

test("S13: denied, appealed, overturned and upheld labels follow share-cards.html", () => {
  const denied = plea({ id: 4n, status: 3, score: 10, standing: [false, false, 255], points: 0, appealed: true }),
    submitted = { eventName: "PleaSubmitted", args: { id: 11n, originalId: 4n } };
  // Appealed: the outcome from the appeal's Verdict log, or from the appeal plea itself.
  assert.equal(
    shareSentence(denied, snap({ logs: [submitted, { eventName: "Verdict", args: { id: 11n, approved: true } }] }), V + 3000),
    "Denied, 10 vs need 37. Appealed in plea #11, overturned.",
  );
  assert.equal(
    shareSentence(denied, snap({ logs: [submitted, { eventName: "Verdict", args: { id: 11n, approved: false } }] }), V + 3000),
    "Denied, 10 vs need 37. Appealed in plea #11, upheld.",
  );
  const appealPlea = plea({ id: 11n, isAppeal: true, originalId: 4n, status: 1, verdictAt: 0n, submittedAt: BigInt(V + 2900) });
  assert.equal(
    shareSentence(denied, snap({ logs: [submitted], pleas: [appealPlea] }), V + 3000),
    "Denied, 10 vs need 37. Appealed in plea #11, pending.",
  );
  assert.equal(
    shareSentence(denied, snap({ logs: [submitted] }), V + 3000),
    "Denied, 10 vs need 37. Appealed in plea #11.",
  );
  // Denied with the appeal open, and closed: no "no points" (the mockup's "Denied, 31 vs need 36.").
  const open = plea({ status: 3, score: 31, need: 36, standing: [false, false, 255], points: 0 });
  assert.equal(
    shareSentence(open, snap(), V + 600),
    `Denied, 31 vs need 36. Appeal open until ${clock(V + 14400)}.`,
  );
  assert.equal(shareSentence(open, snap(), V + 14401), "Denied, 31 vs need 36.");
  // Overturned: the sale and the points in one sentence ("Sold for 15.48 IMD, +40 points.").
  const sold = snap({ logs: [{ eventName: "SellExecuted", args: { id: 7n, imdOut: 56n * 10n ** 16n } }] });
  assert.equal(
    shareSentence(plea({ isAppeal: true, originalId: 4n }), sold, V + 600),
    "Overturned on appeal, 44 vs need 37. Sold for 0.56 imdTEST, +44 points held.",
  );
  assert.equal(
    shareSentence(plea({ isAppeal: true, originalId: 4n, standing: [false, false, 255] }), sold, V + 3000, { rank: 0, season: 0n }),
    "Overturned on appeal, 44 vs need 37. Sold for 0.56 imdTEST, +44 points, season 1 rank 1.",
  );
  // Upheld: "Upheld on appeal, 29 vs need 33. The first plea, #201, scored 28. No further appeal."
  assert.equal(
    shareSentence(plea({ isAppeal: true, originalId: 201n, status: 3, score: 29, need: 33, points: 0 }), snap(), V + 600, { originalScore: 28 }),
    "Upheld on appeal, 29 vs need 33. The first plea, #201, scored 28. No further appeal.",
  );
  // The sustained objection keeps the mockup's ": no points".
  assert.equal(
    shareSentence(plea({ standing: [false, true, 29], points: 0, objections: [objection(8, 2, { newScore: 29 })] }), sold, V + 600),
    "Sold, 44 vs need 37, for 0.56 imdTEST. Objection #8 sustained, 29 vs need 37: no points.",
  );
});

test("E3a: the Objections pill and the post name every sustained, overruled and pending objection", () => {
  const s = snap({ logs: [{ eventName: "SellExecuted", args: { id: 7n, imdOut: 56n * 10n ** 16n } }] }),
    now = V + 600;
  const two = plea({
    standing: [false, true, 20],
    points: 0,
    objections: [objection(1, 2, { newScore: 20 }), objection(2, 2, { newScore: 25 })],
  });
  assert.equal(caseState(two, s, now).closed, "objections #1 and #2 were sustained");
  assert.equal(caseClosedText(caseState(two, s, now).closed), "Objections closed: objections #1 and #2 were sustained");
  const one = plea({ standing: [false, true, 20], points: 0, objections: [objection(3, 2, { newScore: 20 })] });
  assert.equal(caseState(one, s, now).closed, "objection #3 was sustained");
  // Sustained per standing() with the objection not read (incomplete history): no "#" without a number.
  assert.equal(caseState(plea({ standing: [false, true, 20], points: 0 }), s, now).closed, "an objection was sustained");
  // Overruled #11, then sustained #12 (run 9's #13): the post names both.
  const mixed = plea({
    standing: [false, true, 20],
    points: 0,
    objections: [objection(11, 3, { newScore: 40 }), objection(12, 2, { newScore: 20 })],
  });
  assert.equal(
    shareStatus(mixed, s, now, "my plea"),
    "Objection #12 SUSTAINED: my plea re-scored 20 vs need 37, no points; the sale stands. Objection #11 was overruled, 40 vs need 37.",
  );
  // Overruled #13, pending #14 (run 9's #14).
  const pending = plea({
    standing: [true, false, 40],
    objections: [objection(13, 3, { newScore: 40 }), objection(14, 1, { filedAt: BigInt(V + 300) })],
  });
  assert.equal(
    shareStatus(pending, s, now, "my plea"),
    "OBJECTION #14 to my plea (SOLD, 44 vs need 37): a new panel re-scores it, and 34 or less means no points. Objection #13 was overruled, 40 vs need 37.",
  );
  // Sustained beside a pending one.
  const both = plea({
    standing: [false, true, 20],
    points: 0,
    objections: [objection(1, 2, { newScore: 20 }), objection(2, 1, { filedAt: BigInt(V + 300) })],
  });
  assert.equal(
    shareStatus(both, s, now, "my plea"),
    "Objection #1 SUSTAINED: my plea re-scored 20 vs need 37, no points; the sale stands. Objection #2 is still pending.",
  );
  // One kind only: unchanged.
  assert.equal(
    shareStatus(two, s, now, "my plea"),
    "Objections #1 and #2 SUSTAINED: my plea re-scored 20 and 25 vs need 37, no points; the sale stands.",
  );
});

test("X8: the dead-man countdown's label is in hours and minutes, like its visible 32h 59m", () => {
  assert.equal(deadmanWords(32 * 3600 + 59 * 60 + 51), "32 hours 59 minutes");
  assert.equal(deadmanWords(118551), "32 hours 55 minutes");
  assert.equal(deadmanWords(3600), "1 hour");
  assert.equal(deadmanWords(3660), "1 hour 1 minute");
  assert.equal(deadmanWords(59 * 60 + 59), "59 minutes");
  assert.equal(deadmanWords(30), "0 minutes");
  assert.equal(deadmanWords(-5), "0 minutes");
});

test("APPEAL letter: Letterbox._appeal's FeeTooHigh (10% of the balance, or the denied amount + 10%)", () => {
  const fee = 211403n * E,
    original = 118964n * E;
  // w1 on the fork: 594,820 PLEA against fees of 211,403: blocked by the cap.
  assert.equal(appealFeeBlock(fee, 594820n * E, original, 59482n * E), "cap");
  // Ten times the fees passes the 10% rule.
  assert.equal(appealFeeBlock(fee, fee * 10n, original, original), "");
  // Fees within 110% of the denied amount pass even above 10% of the balance...
  assert.equal(appealFeeBlock(fee, 1000000n * E, (fee * 10000n) / LETTERBOX.FEE_CAP_BPS + E, 200000n * E), "");
  // ...but the escrow and the fees must still fit the balance.
  assert.equal(appealFeeBlock(fee, 400000n * E, 200000n * E, 200000n * E), "fit");
  assert.equal(appealFeeBlock(0n, 1n, 1n, 1n), "");
});

test("r2X-9: 'Can’t reach Sepolia' only when the RPC did not answer", () => {
  const answered = "The RPC answered, but with an error instead of the contract data. The site reads again by itself; your funds are not affected.";
  assert.equal(readErrorTitle("p", NO_ANSWER, "9"), "Can’t reach Sepolia");
  assert.equal(readErrorTitle("p", answered, "9"), "Can’t read this plea");
  assert.equal(readErrorTitle("share", answered, "9"), "Can’t read this plea");
  assert.equal(readErrorTitle("share", answered), "Can’t read Sepolia");
  for (const page of ["plead", "objections", "letters", "claim"]) {
    assert.equal(readErrorTitle(page, answered), "Can’t read Sepolia");
    assert.equal(readErrorTitle(page, NO_ANSWER), "Can’t reach Sepolia");
  }
  assert.equal(readErrorTitle("p", "This plea does not exist. Check the plea number.", "99"), "Can’t read this plea");
  // The mockups' own titles stay.
  assert.equal(readErrorTitle("", answered), "Can’t read the latest verdicts");
  assert.equal(readErrorTitle("seasons", NO_ANSWER), "Can’t read the leaderboard");
  assert.equal(readErrorTitle("buy", answered), "Can’t read the price");
});

test("Profile loading band: the address in its checksum case, as the loaded page shows it", () => {
  const lower = "0x8826f38e5028c6d4458e8eb999eb979b2728af16";
  assert.equal(loadingTitle("profile", lower), "0x8826…Af16");
  assert.equal(
    loadingLine("profile", lower),
    "Reading 0x8826…Af16’s balances, pleas and seasons from the chain…",
  );
  assert.equal(loadingTitle("profile", "0x8826F38E5028c6D4458e8EB999EB979b2728Af16"), "0x8826…Af16");
});
