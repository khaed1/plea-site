// Round-2 open items, SHELL batch: toasts (X6, r2X-3/r2D-N3, r2D-N1, r2D-N9, r2D-N10), a sent
// transaction's outcome (r2D-N2, r2D-N7), read-error wording (r2X-9), the loading lines (X5, r2X-4)
// and the wallet chooser (IMD4, r2X-5).
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LETTERBOX } from "../src/models.ts";
import { listedConnectors, isMobileWithoutWallet } from "../src/wallet-list.ts";
import { explainReadError } from "../src/rpc-health.ts";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-shell-"));
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
  toastLinks,
  windowClosedToast,
  verdictToast,
  deliveredToast,
  objectionVoidToast,
  revertedText,
  unconfirmedText,
  receiptWaitStep,
  afterSend,
  RECEIPT_WAIT,
  RECEIPT_GIVE_UP,
} = await load("toast-text");
const { clock } = await load("chain");
const { loadingLine, loadingTitle } = await load("loading-text");

const E = 10n ** 18n;
const V = 1792600000; // verdict time
const Q96 = 2n ** 96n;
const SELLER = "0x3EF81b875d7666C3ba942653CF0e4A89471551c4",
  RUNNER = "0x490C7EF902335207Df5067d3af30D1879904fe62";
const snap = (o = {}) => ({
  constants: {
    "Tribunal.OBJECTION_WINDOW": 1200,
    "Tribunal.PENDING_EXPIRY": 1200,
    "Tribunal.MAX_OBJECTIONS": 2,
    "Tribunal.STAKE": 35n * 10n ** 16n,
    "CabalGate.PENDING_EXPIRY": 1200,
    "CabalGate.EXECUTE_WINDOW": 420,
    "CabalGate.COOLDOWN": 14400,
    "CabalGate.ORACLE_FEE": 5n * 10n ** 17n,
    "CabalGate.APPEAL_POOL_SHARE": 35n * 10n ** 16n,
    "PleaHook.IMD_FEE_BPS": 200n,
    "PleaHook.PLEA_BURN_BPS": 25n,
    pairSymbol: "imdTEST",
    pairDecimals: 18,
    decimals: 18,
    symbol: "PLEA",
  },
  logs: [],
  v: {
    "CabalGate.cabalAlive": true,
    "CabalGate.diedAt": 0n,
    "PleaHook.seeded": true,
    // 1 PLEA = 0.000005 imdTEST
    "PleaHook.latestPrice": (Q96 * 5n) / 1000000n,
    fees: [75n * 10n ** 16n, 0n],
    appealFees: [110n * 10n ** 16n, 0n],
  },
  timestamp: V + 450,
  ...o,
});
const plea = (o = {}) => ({
  id: 7n,
  seller: SELLER,
  amount: 500000n * E,
  balance: 2500000n * E,
  need: 37,
  score: 44,
  status: 2,
  flags: 0,
  isAppeal: false,
  appealed: false,
  verdictAt: BigInt(V),
  submittedAt: BigInt(V - 240),
  standing: [true, false, 255],
  points: 44,
  excluded: false,
  recorded: false,
  objections: [],
  text: "A plea.",
  ...o,
});
const words = (t) => [t.text, t.body].filter(Boolean).join(" / ");

test("r2X-3/r2D-N3: one 'Open plea #N' to the plea page and one 'View transaction' to the explorer", () => {
  const links = toastLinks(
    { text: "Plea #6 sent.", href: "#/p/6", link: "Open plea #6", hash: "0xabc" },
    "https://sepolia.etherscan.io",
  );
  assert.deepEqual(links, [
    { href: "#/p/6", text: "Open plea #6", external: false },
    {
      href: "https://sepolia.etherscan.io/tx/0xabc",
      text: "View transaction",
      external: true,
    },
  ]);
  // The claim toast names its receipt link itself; nothing else borrows the page link's name.
  assert.deepEqual(
    toastLinks({ text: "Claimed.", hash: "0xabc", receiptLabel: "View the receipt" }, "x").map((l) => l.text),
    ["View the receipt"],
  );
  assert.deepEqual(toastLinks({ text: "Copied." }, "x"), []);
});

test("X6: window closed, the normal case holds the points until the objection window ends (plea.html:466)", () => {
  const s = snap({ timestamp: V + 421 }),
    t = windowClosedToast(plea(), s, V + 421);
  assert.equal(t.text, `The window closed at ${clock(V + 420, true)}.`);
  assert.equal(
    t.body,
    `Plea #7 lapsed: nothing was sold. Your +44 points still count: held until ${clock(V + 1200)}, then record them. Next plea at ${clock(V + 14400)}.`,
  );
  assert.equal(t.icon, "clock");
  assert.equal(t.kind, "info");
});

test("X6: window closed after a sustained objection or for an excluded seller names no points", () => {
  for (const p of [plea({ standing: [false, true, 20] }), plea({ excluded: true })])
    assert.equal(
      windowClosedToast(p, snap(), V + 421).body,
      `Plea #7 lapsed: nothing was sold. Next plea at ${clock(V + 14400)}.`,
    );
  // Nothing holds them any more: record now.
  assert.match(
    windowClosedToast(plea({ standing: [false, false, 255] }), snap(), V + 1300).body,
    /Your \+44 points still count: record them now\./,
  );
});

test("X6: a denied letter's toast gives the APPEAL letter, its fee, and what settle returns (letters.html:360)", () => {
  const s = snap(),
    t = verdictToast(
      plea({ status: 3, score: 6, flags: 3, escrow: [SELLER, true, 189495n * E, 0n] }),
      s,
      false,
    );
  assert.equal(t.text, "Denied, 6 vs need 37: 31 short.");
  assert.equal(t.kind, "bad");
  assert.equal(t.icon, "x-circle");
  assert.equal(t.role, "status");
  assert.match(
    t.body,
    new RegExp(
      `^One appeal: send APPEAL <text> before ${clock(V + 14400)} \\(1\\.10 imdTEST in PLEA, about [\\d,]+ PLEA\\)\\. Or call settle to get your 189,495 PLEA and the 0\\.25 imdTEST tip back; the 0\\.50 imdTEST oracle fee is spent\\.$`,
    ),
  );
  // The fee is read from Letterbox.feesFor(true), not added up from literals (r2D-N9).
  assert.match(
    verdictToast(plea({ status: 3, score: 6, flags: 1 }), snap({ v: { ...s.v, appealFees: [2n * E, 0n] } }), false).body,
    /\(2\.00 imdTEST in PLEA/,
  );
  // A site plea: one appeal until the cooldown ends; none once it is closed or already used.
  assert.equal(
    verdictToast(plea({ status: 3, score: 6 }), s, false).body,
    `One appeal until ${clock(V + 14400)}.`,
  );
  for (const p of [plea({ status: 3, appealed: true }), plea({ status: 3, isAppeal: true })])
    assert.equal(verdictToast(p, s, false).body, undefined);
  assert.equal(
    verdictToast(plea({ status: 3 }), snap({ timestamp: V + 14401 }), false).body,
    undefined,
  );
  assert.equal(
    words(verdictToast(plea(), s, true)),
    `Approved, 44 vs need 37. / Sell within 7 minutes, by ${clock(V + 420)}.`,
  );
});

test("r2D-N1: Delivered tells the writer it was sold for them, the runner only what the runner did", () => {
  const s = snap({ timestamp: V + 300 }),
    p = plea({ status: 4, flags: 2 }),
    args = { runner: RUNNER, imdOut: 240n * 10n ** 16n, tip: LETTERBOX.TIP },
    time = V + 300;
  const writer = deliveredToast(p, s, args, time, SELLER);
  assert.equal(
    words(writer),
    `Approved, 44 vs need 37, and sold for you: 500,000 PLEA for 2.40 imdTEST. / A runner (0x490C…fe62) sold it within the 7 minutes and earned the 0.25 imdTEST tip. Record your +44 points after ${clock(V + 1200)}. Next plea after ${clock(time + 14400)}.`,
  );
  const runner = deliveredToast(p, s, args, time, RUNNER);
  assert.equal(
    words(runner),
    "Delivered plea #7: 500,000 PLEA sold for the writer. / You earned the 0.25 imdTEST tip; the writer (0x3EF8…51c4) got 2.40 imdTEST.",
  );
  assert.doesNotMatch(words(runner), /points|Next plea|sold for you/);
  assert.equal(runner.href, "#/p/7");
  // No wallet (or another one): the runner's wording, never the writer's.
  assert.match(deliveredToast(p, s, args, time, undefined).text, /^Delivered plea #7/);
  const self = deliveredToast(p, s, { ...args, runner: SELLER }, time, SELLER);
  assert.equal(self.text, "Sold 500,000 PLEA for 2.40 imdTEST.");
  assert.match(self.body, /^You delivered it yourself, so the 0\.25 imdTEST tip came back to you\./);
  // Without the block's time the next plea is left out, never guessed.
  assert.doesNotMatch(deliveredToast(p, s, args, undefined, SELLER).body, /Next plea/);
});

test("r2D-N10: expiring an unanswered objection says it is void and how the stake comes back", () => {
  const s = snap(),
    t = objectionVoidToast({ id: 2n, pleaId: 7n }, s, RUNNER, RUNNER);
  assert.equal(
    words(t),
    "Objection #2 is void: no answer within 20 minutes. / Nothing changes for plea #7. Settle returns the 0.35 imdTEST stake to you.",
  );
  assert.match(objectionVoidToast({ id: 2n, pleaId: 7n }, s, RUNNER, SELLER).body, /stake to the objector\.$/);
  // Voided before its 20 minutes ran out (the Intake closed the request unanswered).
  assert.equal(
    objectionVoidToast({ id: 2n, pleaId: 7n }, s, RUNNER, RUNNER, V, V + 600).text,
    "Objection #2 is void: its panel gave no answer.",
  );
  assert.equal(
    objectionVoidToast({ id: 2n, pleaId: 7n }, s, RUNNER, RUNNER, V, V + 1201).text,
    "Objection #2 is void: no answer within 20 minutes.",
  );
  // PENDING_EXPIRY comes from the Tribunal (r2D-N9).
  assert.match(
    objectionVoidToast({ id: 2n, pleaId: 7n }, snap({ constants: { ...s.constants, "Tribunal.PENDING_EXPIRY": 1800 } })).text,
    /within 30 minutes/,
  );
});

test("r2D-N7: a mined revert says nothing was traded only for trades", () => {
  for (const fn of ["swap", "executeSell", "deliver"])
    assert.match(revertedText(fn).body, /Nothing was traded/);
  for (const fn of ["record", "object", "appeal", "closeSeason", "claim", "expire", "settle", "approve", "setName"]) {
    assert.equal(revertedText(fn).title, "Mined but reverted.");
    assert.equal(revertedText(fn).body, "Nothing changed; only the gas was spent.");
  }
});

test("r2D-N2: a sent transaction without a receipt is never 'Nothing was sent'", () => {
  for (const final of [false, true]) {
    const t = unconfirmedText(final);
    assert.equal(t.sent, true);
    assert.doesNotMatch(`${t.title} ${t.body}`, /Nothing was sent|could not be simulated/);
    assert.match(`${t.title} ${t.body}`, /Sent/);
  }
  assert.match(unconfirmedText(false).body, /3 minutes/);
  assert.match(unconfirmedText(true).body, /15 minutes/);
});

test("r2D-N2: the receipt wait is timed from the send, so quick RPC errors never end it early", () => {
  assert.equal(RECEIPT_WAIT, 180000);
  assert.equal(RECEIPT_GIVE_UP, 900000);
  // Five RPC errors in the first minute: keep waiting, no note yet.
  for (const t of [1000, 6000, 11000, 16000, 60000]) assert.equal(receiptWaitStep(t, false), "wait");
  // At 3 minutes: say once that it was sent and is still waiting; then keep waiting.
  assert.equal(receiptWaitStep(180000, false), "note");
  assert.equal(receiptWaitStep(185000, true), "wait");
  assert.equal(receiptWaitStep(899999, true), "wait");
  // Only after 15 minutes does the button go back, with the "sent, no receipt yet" text.
  assert.equal(receiptWaitStep(900000, true), "give-up");
  assert.equal(receiptWaitStep(900000, false), "give-up");
});

test("r2D-N2: a mined revert's decoded reason never says 'Nothing was sent'", () => {
  const fee = afterSend({
    title: "The fees do not fit.",
    body: "The plea and its fees (at most 140,000 PLEA) must fit your 1,000,000 PLEA. Lower the amount. Nothing was sent.",
  });
  assert.doesNotMatch(`${fee.title} ${fee.body}`, /Nothing was sent/);
  assert.match(fee.body, /Lower the amount\. It was mined but reverted: only the gas was spent\.$/);
  assert.deepEqual(afterSend({ title: "Nothing was sent; try again." }), {
    title: "It was mined but reverted: only the gas was spent; try again.",
    body: undefined,
  });
  // Other texts pass unchanged.
  assert.deepEqual(afterSend({ title: "The price moved more than 1%.", body: "Nothing was sold; your PLEA stays in your wallet." }), {
    title: "The price moved more than 1%.",
    body: "Nothing was sold; your PLEA stays in your wallet.",
  });
});

test("r2X-9: a read the RPC answered with an error is not called 'did not answer'", () => {
  const noAnswer = /^The public RPC did not answer\./,
    answered = /^The RPC answered, but with an error/;
  assert.match(explainReadError({ name: "TimeoutError", message: "The request took too long" }), noAnswer);
  assert.match(
    explainReadError({ name: "HttpRequestError", message: "HTTP request failed.", cause: { status: 503 } }),
    noAnswer,
  );
  assert.match(
    explainReadError(Error("The public RPC did not answer. The site tries the next one by itself; your funds are not affected.")),
    noAnswer,
  );
  assert.match(explainReadError({ message: "execution reverted", code: 3 }), answered);
  assert.match(explainReadError({ name: "RpcRequestError", message: "internal error", code: -32603 }), answered);
  assert.match(
    explainReadError({ message: "block 11962410 is beyond the latest block 11962409 of this node, retry later" }),
    answered,
  );
  // The site's own errors pass through.
  assert.equal(
    explainReadError(Error("This plea does not exist. Check the plea number.")),
    "This plea does not exist. Check the plea number.",
  );
});

test("X5/r2X-4: the profile loading line names the wallet short, never the full address", () => {
  const full = "0x4b91078b2374c956A65F7Af0999CaE0a935E6821",
    line = loadingLine("profile", full);
  assert.equal(line, "Reading 0x4b91…6821’s balances, pleas and seasons from the chain…");
  assert.ok(!line.includes(full));
  assert.equal(
    loadingLine("profile", undefined, RUNNER),
    "Reading 0x490C…fe62’s balances, pleas and seasons from the chain…",
  );
  assert.equal(
    loadingLine("profile"),
    "Reading your wallet’s balances, pleas and seasons from the chain…",
  );
  assert.equal(loadingLine("wall"), "Reading pleas from the chain…");
  assert.equal(loadingLine("p", "12"), "Reading plea #12 from the chain…");
  assert.equal(loadingLine(""), "Reading the pool, the Cabal and the season from the chain…");
  // The band's h1 is the loaded page's: a profile by its short address until its name arrives.
  assert.equal(loadingTitle("profile", full), "0x4b91…6821");
  assert.equal(loadingTitle("profile", undefined, RUNNER), "0x490C…fe62");
  assert.equal(loadingTitle("profile"), "Your profile");
  assert.equal(loadingTitle("profile", "not-an-address"), "Profile");
  assert.equal(loadingTitle("p", "12"), "Plea #12");
  assert.equal(loadingTitle("wall"), "The Wall");
});

test("IMD4/r2X-5: a phone without window.ethereum still lists the wallets announced through EIP-6963", () => {
  const generic = { id: "injected", type: "injected", name: "Injected" },
    rabby = { id: "io.rabby", type: "injected", name: "Rabby Wallet" },
    mm = { id: "io.metamask", type: "injected", name: "MetaMask" };
  const ids = (list, mobile) => listedConnectors(list, mobile).map((c) => c.id);
  assert.deepEqual(ids([generic, rabby], true), ["io.rabby"]);
  assert.deepEqual(ids([generic, mm, rabby], true), ["io.metamask", "io.rabby"]);
  assert.deepEqual(ids([generic], true), []);
  assert.deepEqual(ids([generic, rabby], false), ["io.rabby"]);
  assert.deepEqual(ids([generic], false), ["injected"]);
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
  assert.equal(isMobileWithoutWallet(iphone, undefined), true);
  assert.equal(isMobileWithoutWallet(iphone, {}), false);
  assert.equal(isMobileWithoutWallet("Mozilla/5.0 (X11; Linux x86_64)", undefined), false);
});
