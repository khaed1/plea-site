// Round-2 open items, TRADE batch: T5, X8, r2X-2, r2T-N2..N6, r2D-N4, r2D-VN1, E1, E2, E3c, TRAP2.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  LETTERBOX,
  Q96,
  factParts,
  factTerms,
  letterMinimum,
  autoSellBlock,
  feeSaleShort,
} from "../src/models.ts";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-trade-batch-"));
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
const { openPleaParts, openPleaNotice, perMillion, exactAmount } =
  await load("chain");
const E = 10n ** 18n;
const s = {
  constants: {
    symbol: "PLEA",
    decimals: 18,
    pairSymbol: "imdTEST",
    pairDecimals: 18,
    "CabalGate.COOLDOWN": 14400n,
    "CabalGate.EXECUTE_WINDOW": 420n,
  },
  v: {},
};

test("r2X-2 / WW9: every Contract.CONSTANT the source names is a public constant in its pinned ABI", () => {
  const abis = {};
  for (const file of fs.readdirSync(new URL("../public/abi/", import.meta.url)))
    abis[file.replace(".json", "")] = JSON.parse(
      fs.readFileSync(new URL("../public/abi/" + file, import.meta.url)),
    );
  const names = new Set();
  for (const file of fs.readdirSync(new URL("../src/", import.meta.url))) {
    if (!/\.tsx?$/.test(file)) continue;
    const text = fs.readFileSync(new URL("../src/" + file, import.meta.url), "utf8");
    for (const m of text.matchAll(
      /"(PLEA|CabalGate|Seasons|PleaHook|Letterbox|Tribunal|PleaDistributor|PleaLaunch)\.([A-Z][A-Z_0-9]*)"/g,
    ))
      names.add(`${m[1]}.${m[2]}`);
  }
  assert.ok(names.has("Tribunal.PANEL_SIZE"));
  for (const name of names) {
    const [contract, fn] = name.split(".");
    assert.ok(
      abis[contract].some(
        (f) => f.type === "function" && f.name === fn && f.inputs.length === 0,
      ),
      `${name} is not readable from chain`,
    );
  }
  // Letterbox.sol keeps LETTER_SHARE_BPS internal (testnet9: 2_000), so the site pins it.
  assert.equal(LETTERBOX.LETTER_SHARE_BPS, 2000n);
  const how = fs.readFileSync(new URL("../src/home-info.tsx", import.meta.url), "utf8");
  assert.match(how, /LETTERBOX\.LETTER_SHARE_BPS/);
});

// Letterbox._plead with amount 0 (a plain letter), testnet9.
function letter(bal, maxFeePlea, price) {
  let amount = (bal * LETTERBOX.LETTER_SHARE_BPS) / 10000n;
  if (amount > 2_500_000n * E) amount = 2_500_000n * E;
  if (amount < LETTERBOX.MIN_LETTER) return "LetterTooSmall";
  if ((amount * price) / Q96 < LETTERBOX.MIN_SALE_VALUE) return "TooSmallForTheFee";
  if (maxFeePlea * 10000n > bal * LETTERBOX.MAX_FEE_SHARE_BPS) return "FeeTooHigh";
  if (amount + maxFeePlea > bal) return "FeeTooHigh";
  return "ok";
}
test("E1 / r2D-N4: the letter minimum is the least balance the Letterbox accepts", () => {
  // The run 9 fork: feesFor(false) = (0.75, 144,138.3 PLEA), latestPrice 1M PLEA = 5.72 imdTEST.
  const fee = 144138318330564330878184n,
    price = 453475764330517343134832n;
  const fork = letterMinimum(fee, price);
  assert.equal(fork.reason, "fee");
  assert.equal(fork.minimum, fee * 10n);
  assert.equal(letter(fork.minimum, fee, price), "ok");
  assert.equal(letter(fork.minimum - 1n, fee, price), "FeeTooHigh");
  // ~1.44M PLEA: about what the HANDOFF note says (1.45M).
  assert.ok(fork.minimum / E > 1_440_000n && fork.minimum / E < 1_450_000n);
  // A cheap fee and a low price: the 0.70 imdTEST floor binds.
  const low = letterMinimum(10n ** 18n, price / 10n);
  assert.equal(low.reason, "value");
  assert.ok(low.possible);
  assert.equal(letter(low.minimum, 10n ** 18n, price / 10n), "ok");
  assert.equal(letter(low.minimum - 1n, 10n ** 18n, price / 10n), "TooSmallForTheFee");
  // So low that 2,500,000 PLEA (the most a letter pleads) is worth less than 0.70 imdTEST.
  const never = letterMinimum(10n ** 18n, price / 100n);
  assert.equal(never.possible, false);
  assert.equal(letter(never.minimum * 10n, 10n ** 18n, price / 100n), "TooSmallForTheFee");
  // A huge price: only the 1,000 PLEA floor is left.
  const high = letterMinimum(1n, price * 10n ** 6n);
  assert.equal(high.reason, "letter");
  assert.equal(high.minimum, 5000n * E);
  assert.equal(letter(high.minimum, 1n, price * 10n ** 6n), "ok");
  assert.equal(letter(high.minimum - 1n, 1n, price * 10n ** 6n), "LetterTooSmall");
});

test("F3: FeeTooHigh's two errors: the gate's (pleaIn above its cap) reads as the price fell, the Letterbox's never", () => {
  const fee = 144138318330564330878184n;
  // CabalGate.FeeTooHigh(pleaIn, maxPleaIn): the fee sale needed more PLEA than the Letterbox's cap.
  assert.equal(feeSaleShort([fee + 1n, fee]), true);
  assert.equal(feeSaleShort([(fee * 13n) / 10n, fee]), true);
  // Letterbox.FeeTooHigh(maxFeePlea, balance): its 10% rule and its fit rule, at balances the site
  // lets the box send and just under them; the fee is never above the balance there.
  for (const bal of [fee * 10n - 1n, fee * 10n, fee * 11n, fee * 100n]) {
    assert.equal(feeSaleShort([fee, bal]), false, String(bal));
  }
  assert.equal(feeSaleShort([fee, fee]), false);
  assert.equal(feeSaleShort(undefined), false);
  assert.equal(feeSaleShort(["not a number", 1n]), false);
});

// Letterbox.plead(amount, text) (the site's auto-sell box), testnet9.
function plead(bal, amount, maxFeePlea, price) {
  if ((amount * price) / Q96 < LETTERBOX.MIN_SALE_VALUE) return "TooSmallForTheFee";
  if (maxFeePlea * 10000n > bal * LETTERBOX.MAX_FEE_SHARE_BPS) return "FeeTooHigh";
  if (amount + maxFeePlea > bal) return "FeeTooHigh";
  if (amount > 2_500_000n * E || amount > (bal * 5000n) / 10000n) return "AmountTooLarge";
  return "ok";
}
test("TRAP2: auto-sell starts off exactly when no amount can pass the Letterbox's rules", () => {
  const fee = 144138318330564330878184n,
    price = 453475764330517343134832n,
    cap = 2_500_000n * E;
  // 606,108 PLEA (a 10 imdTEST launch-window buy): the fees would take more than 10%.
  assert.equal(autoSellBlock(606108n * E, fee, price, cap), "fee");
  assert.equal(autoSellBlock(fee * 10n - 1n, fee, price, cap), "fee");
  assert.equal(autoSellBlock(fee * 10n, fee, price, cap), "");
  // At the threshold some amount passes (the floor), one wei under none does.
  const floor = (LETTERBOX.MIN_SALE_VALUE * Q96 + price - 1n) / price;
  assert.equal(plead(fee * 10n, floor, fee, price), "ok");
  // A cheap fee but a low price: half the balance is worth less than 0.70 imdTEST.
  const lowPrice = price / 10n,
    lowFloor = (LETTERBOX.MIN_SALE_VALUE * Q96 + lowPrice - 1n) / lowPrice;
  assert.equal(autoSellBlock(lowFloor * 2n - 2n, 1n, lowPrice, cap), "value");
  assert.equal(autoSellBlock(lowFloor * 2n, 1n, lowPrice, cap), "");
  assert.equal(plead(lowFloor * 2n, lowFloor, 1n, lowPrice), "ok");
  // 2.5M claimed PLEA (p5..p8 in the base state): auto-sell works.
  assert.equal(autoSellBlock(2_500_000n * E, fee, price, cap), "");
  // Before the seed there is no fee and no price: keep the default.
  assert.equal(autoSellBlock(0n, 0n, 0n, cap), "");
});

// CabalGate._factScoreAt (testnet9), for the PLEA-weighted case.
function gateFacts(amount, bal, basis, latest, ago, started, now) {
  const heldPoints = (t) =>
    !t || t > now ? 0n : now - t >= 604800 ? 7n : now - t >= 259200 ? 4n : now - t >= 86400 ? 2n : 0n;
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
    facts = (heldPlea * facts + (amount - heldPlea) * (heldPoints(started) + 10n) + amount / 2n) / amount;
  score += facts;
  score += !ago ? 5n : latest > (ago * 102n) / 100n ? 9n : latest * 100n >= ago * 98n ? 5n : 0n;
  return Number(score);
}
test("E2: received PLEA shows held since the open, profit 10 and the trend; a larger plea the weighted mean", () => {
  const now = 1_800_000_000,
    started = now - 2 * 86400 - 60,
    price = 453475764330517343134832n;
  // p5..p8: claims only, no buy record.
  const bal = 2_500_000n * E,
    amount = 500_000n * E,
    received = factParts(bal, amount, [0n, 0n, 0n], price, price, started, now);
  assert.equal(received.mode, "received");
  assert.deepEqual(factTerms(received), [16, 2, 10, 5]);
  assert.equal(received.total, 33);
  assert.equal(received.total, gateFacts(amount, bal, [0n, 0n, 0n], price, price, started, now));
  assert.equal(received.heldFor, now - started);
  assert.equal(received.pnlBps, null);
  // Right after the open: +0 held.
  const fresh = factParts(bal, amount, [0n, 0n, 0n], price, 0n, now - 600, now);
  assert.deepEqual(factTerms(fresh), [16, 0, 10, 5]);
  // p1..p4: a 1.25 imdTEST buy record (~213k PLEA) next to 2.5M claimed; a 20% plea is mixed.
  const basis = [1225500000000000000n, 213518n * E, BigInt(now - 3600)],
    bal2 = 2_713_518n * E,
    amount2 = bal2 / 5n,
    mixed = factParts(bal2, amount2, basis, price, price, started, now);
  assert.equal(mixed.mode, "mixed");
  assert.equal(mixed.covered, basis[1]);
  assert.equal(mixed.uncovered, amount2 - basis[1]);
  const terms = factTerms(mixed);
  assert.equal(terms.length, 3);
  assert.equal(terms.reduce((a, b) => a + b, 0), mixed.total);
  assert.equal(mixed.total, gateFacts(amount2, bal2, basis, price, price, started, now));
  // A plea the record covers keeps the four facts.
  const small = factParts(bal2, 100_000n * E, basis, price, price, started, now);
  assert.equal(small.mode, "record");
  assert.equal(factTerms(small).reduce((a, b) => a + b, 0), small.total);
  assert.equal(small.total, gateFacts(100_000n * E, bal2, basis, price, price, started, now));
});

test("T5: the open-plea line is buy.html's 'is open: sell by', Plead's notice starts 'Sell by'", () => {
  const verdictAt = Math.floor(Date.now() / 1000) - 60,
    now = verdictAt + 30,
    approved = { id: 2n, status: 2, verdictAt: BigInt(verdictAt) };
  const parts = openPleaParts(approved, s, now);
  const t = "(\\d{4}-\\d\\d-\\d\\d )?\\d\\d:\\d\\d UTC";
  assert.match(parts.head, new RegExp(`^Plea #2 is open: sell by ${t}\\.$`));
  assert.match(
    parts.rest,
    new RegExp(`^Next plea 4 hours after the sale \\(${t} if sold now\\), or ${t} if it lapses\\.$`),
  );
  const by = new Date((verdictAt + 420) * 1000).toISOString().slice(11, 16);
  assert.ok(parts.head.includes(by));
  assert.match(openPleaNotice(approved, s, now), new RegExp(`^Sell by ${t}\\. Next plea 4 hours`));
  const pending = openPleaParts({ id: 3n, status: 1 }, s, now);
  assert.equal(pending.head, "Plea #3 is open: waiting for the verdict, usually 3 to 6 minutes.");
  assert.equal(openPleaNotice({ id: 3n, status: 1 }, s, now), pending.head);
});

test("E3c: a price per 1M below 0.01 keeps two significant digits", () => {
  assert.equal(perMillion(5720000000000000000n, s), "5.72 imdTEST");
  assert.equal(perMillion(10n ** 16n, s), "0.01 imdTEST");
  assert.equal(perMillion(31234567890000n, s), "0.000031 imdTEST");
  assert.equal(perMillion(5000000000000000n, s), "0.0050 imdTEST");
  assert.equal(perMillion(1234n, s), "0.0000000000000012 imdTEST");
  assert.equal(perMillion(0n, s), "");
});

test("r2T-N6: the step note names the exact approval", () => {
  assert.equal(exactAmount(33333n * 10n ** 15n), "33.333");
  assert.equal(exactAmount(3876543211n * 10n ** 11n), "387.6543211");
  assert.equal(exactAmount(1000n * E), "1,000.00");
  assert.equal(exactAmount(5n * 10n ** 17n), "0.50");
  assert.equal(exactAmount(1000n * E, 18, 0), "1,000");
  assert.equal(exactAmount(1000n * E + 5n * 10n ** 17n, 18, 0), "1,000.5");
});
