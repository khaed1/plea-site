// The Buy page's choices after the user's round: IMD first and by default (pay.test.mjs), the slippage chips
// 0.5% · 1% · 2% · 5% with a warning at 5%, the failed-buy advice one step up, and the ETH gas words (RT3-2..5,
// RT2-2..4).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEFAULT_SLIP, gasFix, SLIPPAGES, slipAdvice, slipWarning, slipWords } from "../src/trade-text.ts";
import { minimumOf, priceLimit, sendMinimum } from "../src/swap-math.ts";

const src = fs.readFileSync(new URL("../src/pages-trade.tsx", import.meta.url), "utf8");
const N = JSON.parse(fs.readFileSync(new URL("../src/docs/numbers.json", import.meta.url)));
const buying = fs.readFileSync(new URL("../../docs/02-buying.md", import.meta.url), "utf8");
const POOL = "IMD’s ETH pool";

test("slippage: 0.5% · 1% · 2% · 5%, every visit at 1%; the chips, the minimum and the docs follow one list", () => {
  assert.deepEqual([...SLIPPAGES], [50, 100, 200, 500]);
  assert.equal(DEFAULT_SLIP, 100);
  assert.deepEqual(SLIPPAGES.map(slipWords), ["0.5%", "1%", "2%", "5%"]);
  // The page: the chips from SLIPPAGES, the start at DEFAULT_SLIP in plain state (never stored), and every
  // place the slippage is used takes the chosen one.
  assert.match(src, /\{SLIPPAGES\.map\(\(n\) => \(/);
  assert.match(src, /\[slip, setSlip\] = useState<number>\(DEFAULT_SLIP\)/);
  assert.doesNotMatch(src, /\[50, 100, 200\]/);
  assert.match(src, /const minOut = quote\.data \? minimumOf\(quote\.data\.out, slip\) : undefined;/);
  assert.match(src, /sendMinimum\(shown\.out, q\.out, slip\)/);
  assert.match(src, /sqrtPriceLimitX96: priceLimit\(q\.next, slip, zeroForOne\)/);
  assert.match(src, /`Minimum, \$\{slipWords\(slip\)\} slippage`/);
  assert.match(src, /the price reached your \$\{slipWords\(slip\)\} limit\./);
  assert.match(src, /title: `The price moved more than \$\{slipWords\(slip\)\}\.`/);
  assert.doesNotMatch(src, /slip \/ 100/);
  // The Plead page's sale and a plea's own Sell keep their fixed 1%.
  const court = fs.readFileSync(new URL("../src/pages-court.tsx", import.meta.url), "utf8");
  assert.match(src, /"At least, with 1% slippage",\s*quoteValue\(tokenAmount\(\(expected \* 99n\) \/ 100n, s, true\)\)/);
  assert.match(court, /"At least, with 1% slippage",/);
  // The docs name the four choices and the start from numbers.json, which follows trade-text.ts.
  assert.equal(N.buy_slippages.text, `${SLIPPAGES.slice(0, -1).map(slipWords).join(", ")} or ${slipWords(SLIPPAGES.at(-1))}`);
  assert.equal(Number(N.buy_slippage_default.value), DEFAULT_SLIP);
  assert.match(buying, /The Buy page offers \{\{buy_slippages\}\}, and every visit starts at \{\{buy_slippage_default\}\}\./);
});

test("5% works like the others: the minimum the buy and the sale are sent with, and the direct swap's price limit", () => {
  const E = 10n ** 18n,
    quote = 1_000_000n * E;
  assert.equal(minimumOf(quote, 500), 950_000n * E);
  assert.deepEqual(sendMinimum(quote, 960_000n * E, 500), { minimum: 950_000n * E, moved: false });
  assert.deepEqual(sendMinimum(quote, 949_999n * E, 500), { minimum: 950_000n * E, moved: true });
  // A front-run that took 3% of the quote: refused at 2%, through at 5%.
  assert.equal(sendMinimum(quote, 970_000n * E, 200).moved, true);
  assert.equal(sendMinimum(quote, 970_000n * E, 500).moved, false);
  // PoolSwapTest's limit (Sepolia): the price itself 5% below or above, not its square root.
  const Q = 2n ** 96n,
    down = priceLimit(Q, 500, true),
    up = priceLimit(Q, 500, false);
  assert.ok(down * down <= (Q * Q * 9500n) / 10000n && (down + 1n) ** 2n > (Q * Q * 9500n) / 10000n);
  assert.ok(up * up <= (Q * Q * 10000n) / 9500n && (up + 1n) ** 2n > (Q * Q * 10000n) / 9500n);
});

test("a buy that failed on price suggests one step up: 0.5% → 1%, 1% → 2%, 2% → 5%, at 5% a smaller amount", () => {
  assert.equal(slipAdvice(50), "raise the slippage to 1%.");
  assert.equal(slipAdvice(100), "raise the slippage to 2%.");
  assert.equal(slipAdvice(200), "raise the slippage to 5%.");
  assert.equal(slipAdvice(500), "lower the amount.");
  assert.match(src, /body: `Nothing was \$\{selling \? "sold" : "bought"\}; your \$\{unit\} stays in your wallet\. Try again, or \$\{slipAdvice\(slip\)\}`/);
  assert.match(buying, /1% after 0\.5%, 2% after 1%, 5% after 2%, and a smaller amount after 5%\./);
  assert.match(buying, /"The price moved more than 1%\. Nothing was bought; your IMD stays in your wallet\. Try again, or raise the slippage to 2%\."/);
});

test("the 5% warning: up to 5% less than the quote, who can cause it on which pool, and when to choose it", () => {
  const base = { selling: false, dead: false, pair: "IMD" };
  for (const bps of [50, 100, 200]) assert.equal(slipWarning({ ...base, bps }), "", `${bps}: no warning`);
  // IMD while the Cabal lives: PLEA cannot be sold back, so no sandwich on PLEA's pool, only other buys.
  assert.equal(
    slipWarning({ ...base, bps: 500 }),
    "At 5% the buy can get up to 5% less PLEA than the quote if someone trades just before it. PLEA cannot be sold while the Cabal lives, so no bot can buy ahead of you and sell straight after; other buyers can still move the price. Choose 5% only when buys at 2% keep failing, as on a busy launch.",
  );
  // ETH or USDC: IMD's ETH pool trades both ways.
  assert.equal(
    slipWarning({ ...base, bps: 500, routePool: POOL }),
    "At 5% the buy can get up to 5% less PLEA than the quote if someone trades just before it: a bot that sees your buy before it is mined can buy IMD ahead of it on IMD’s ETH pool and sell it after. Choose 5% only when buys at 2% keep failing, as on a busy launch.",
  );
  // After the death PLEA's own pool trades both ways, for buys and sales.
  assert.equal(
    slipWarning({ ...base, bps: 500, dead: true }),
    "At 5% the buy can get up to 5% less PLEA than the quote if someone trades just before it: a bot that sees your buy before it is mined can buy ahead of it and sell after. Choose 5% only when buys at 2% keep failing.",
  );
  assert.equal(slipWarning({ ...base, bps: 500, dead: true, routePool: POOL }), slipWarning({ ...base, bps: 500, dead: true }));
  assert.equal(
    slipWarning({ ...base, bps: 500, dead: true, selling: true }),
    "At 5% the sale can get up to 5% less IMD than the quote if someone trades just before it: a bot that sees your sale before it is mined can sell ahead of it and buy back after. Choose 5% only when sales at 2% keep failing.",
  );
  for (const o of [{}, { routePool: POOL }, { dead: true }, { dead: true, selling: true }])
    assert.doesNotMatch(slipWarning({ ...base, bps: 500, ...o }), /mainnet|chain id 1\b/i);
  // Under the chips, describing them, only at 5%; the route's pool is the last hop's (IMD's ETH pool).
  assert.match(src, /const slipNote = slipWarning\(\{\s*bps: slip,\s*selling,\s*dead,\s*routePool: route\?\.path\[route\.path\.length - 1\]\.pool,\s*pair,\s*\}\);/);
  assert.match(src, /aria-describedby=\{slipNote \? "slip-note" : undefined\}/);
  assert.match(src, /\{slipNote && \(\s*<p className="field__hint" id="slip-note">\s*\{slipNote\}\s*<\/p>\s*\)\}/);
  // The docs say the same.
  assert.match(buying, /At 5% a buy can get up to 5% less PLEA than the quote if someone trades just before it\. While the Cabal lives PLEA cannot be sold/);
  assert.match(buying, /IMD's ETH pool trades both ways/);
  assert.match(buying, /Choose 5% only when buys at 2% keep failing, for example on a busy launch\./);
});

test("RT3-5 + RT2-2: when Max has nothing to spend, the ETH words offer more ETH or IMD, then USDC; otherwise a smaller amount or Max", () => {
  assert.equal(gasFix(true, ["IMD", "USDC"]), "Lower the amount or press Max.");
  assert.equal(gasFix(false, ["IMD", "USDC"]), "Add ETH, or pay with IMD or USDC.");
  assert.equal(gasFix(false, []), "Add ETH.");
  // Every place: the amount check, the gas note, Max's own note, the send's refusals.
  assert.match(src, /maxSpends =\s*!native \|\| available === undefined \|\| reserve === undefined \|\| ethMax\(available, reserve\) > 0n,\s*ethFix = gasFix\(maxSpends, others\);/);
  assert.match(src, /`You have \$\{payAmount\(available\)\}\. \$\{native \? ethFix : "Lower the amount or press Max\."\}`/);
  assert.match(src, /too little for the gas at today’s fees: Max keeps about \$\{amount\(reserve, 18, 4, "up"\)\} ETH for it\. \$\{ethFix\}`/);
  assert.match(src, /too little to buy with ETH\. \$\{gasFix\(false, others\)\}`/);
  assert.match(src, /fix = gasFix\(eth === undefined \|\| need === undefined \|\| ethMax\(eth, need\) > 0n, others\);/);
  assert.doesNotMatch(src, /pay with another currency/);
  assert.match(buying, /If even Max leaves nothing to spend, the site suggests adding ETH or paying with IMD or USDC\./);
});

test("RT3-4: the gas note warns only when the send would refuse; a buy that fits the fees sent gets a margin note", () => {
  assert.match(
    src,
    /\? fitFees\(gasFees\.data, gasLeft\)\s*\? `This leaves \$\{amount\(gasLeft, 18, 4\)\} ETH for the gas: enough at the fees the site sends, less than the \$\{amount\(reserve, 18, 4, "up"\)\} ETH Max keeps in case your wallet sets its own fee\.`\s*: `This leaves \$\{amount\(gasLeft, 18, 4\)\} ETH, too little for the gas at today’s fees/,
  );
  assert.doesNotMatch(src, /the wallet needs about/);
});

test("RT3-2: Max's note is worded from the balance and fees read now, gives way to the gas note, and goes when a send is refused", () => {
  assert.match(src, /\[maxNote, setMaxNote\] = useState<"" \| "kept" \| "short">\(""\)/);
  assert.match(src, /: gasLeft !== undefined && gasLeft >= reserve\s*\? `Max keeps about \$\{amount\(gasLeft, 18, 4\)\} ETH free for the gas\.`\s*: "";/);
  assert.match(src, /hint=\{invalid \? capError \|\| amountReason : gasNote \|\| maxText \|\| undefined\}/);
  assert.match(src, /setMaxNote\("short"\);/);
  assert.match(src, /setMaxNote\("kept"\);/);
  // Both refusals of the send clear it.
  assert.equal((src.match(/setRevision\(\(n\) => n \+ 1\);\s*setMaxNote\(""\);\s*throw new DisplayError\((lessEthMessage|fundsMessage)\(/g) || []).length, 2);
});

test("RT3-3: a wallet whose ETH fell below the amount is told what it has now, and the balance is reread", () => {
  assert.match(src, /if \(native && eth! < raw\) \{\s*setRevision\(\(n\) => n \+ 1\);\s*setMaxNote\(""\);\s*throw new DisplayError\(lessEthMessage\(eth!, fees\)\);\s*\}/);
  assert.match(src, /title: "Not bought: the wallet has less ETH than the amount\.",\s*body: `The wallet now has \$\{amount\(eth, 18, 4\)\} ETH, less than the \$\{payAmount\(raw\)\} to pay\./);
  // The check comes before fitFees, so no "leaves −0.0350 ETH".
  assert.ok(src.indexOf("lessEthMessage(eth!, fees)") < src.indexOf("fitFees(fees, eth - raw)"));
  assert.match(src, /\[address, route\?\.symbol, revision\],/);
});

test("RT2-4: the cashback row, the step line and the toast round the same amount one way: down, \"< 0.01\" below a cent", () => {
  assert.match(src, /cashText = smallAmount\(cashbackNow, s\);/);
  assert.match(src, /: `\$\{cashText\}\$\{payout\.data === "claims" \? ", paid as a claim on the PoolManager \(see Profile\)" : ""\}`/);
  assert.match(src, /cashback:\s*selling \|\| payout\.data === "pool" \? undefined : cashText,/);
  assert.match(src, /`\$\{smallAmount\(cash, s\)\} cashback \$\{/);
  assert.doesNotMatch(src, /\$\{display\.cash\}/);
  const chain = fs.readFileSync(new URL("../src/chain.ts", import.meta.url), "utf8");
  assert.match(chain, /export function smallAmount\(v: bigint \| undefined, s: Snapshot \| undefined\) \{\s*return v && v < 10n \*\* 16n\s*\? `< 0\.01 \$\{s\?\.constants\.pairSymbol\}`\s*: tokenAmount\(v, s, true\);/);
});

test("RT2-4: the sentence under the costs no longer claims the shown parts add up exactly: each is rounded on its own", () => {
  assert.doesNotMatch(src, /parts add up to\{" "\}/);
  assert.match(src, /parts share the\{" "\}\s*\{display\.fees\} \{pair\}, each rounded on its own\./);
});

test("blocked storage: wagmi gets a storage that cannot throw, so the site loads where the browser blocks localStorage", () => {
  const config = fs.readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");
  assert.match(config, /storage: createStorage\(\{ storage: walletStorage\(\) \}\),/);
  assert.match(config, /function walletStorage\(\) \{\s*try \{\s*const storage = window\.localStorage;\s*storage\.getItem\("wagmi\.store"\);\s*return storage;\s*\} catch \{\s*return noopStorage;\s*\}\s*\}/);
});
