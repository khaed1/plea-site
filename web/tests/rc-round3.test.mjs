// The re-testers' third round (N1..N3): a fee history from an RPC that is behind is not used for the tip
// (N1: pay.test.mjs has readRouteFees' own cases); Max's note and the gas hints say how much ETH can still be
// paid at the site's fees when Max has nothing to spend (N2); Sell now sends the minimum the page shows and
// stops when the price fell past it, as a buy does (N3).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { apartDigits, gasFix } from "../src/trade-text.ts";
import { ethFit, ethMax, fitFees, gasFloor, gasReserve, ROUTE_GAS, routeFees, WALLET_TIP } from "../src/pay.ts";
import { minimumOf, sendMinimum } from "../src/swap-math.ts";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const trade = read("../src/pages-trade.tsx"),
  court = read("../src/pages-court.tsx"),
  sale = read("../src/sale.ts"),
  buying = read("../../docs/02-buying.md"),
  plead = read("../../docs/03-plead.md");
const E = 10n ** 18n,
  gwei = (n) => BigInt(Math.round(n * 1e9)),
  eth = (n) => BigInt(Math.round(n * 1e6)) * 10n ** 12n;

test("N1: the docs say a fee history from an RPC that is behind is not used", () => {
  assert.match(buying, /\{\{pay_wallet_tip\}\} if it cannot read them, and an RPC whose history ends more than a few blocks before the latest block is not used\)/);
});

test("N2: below Max's reserve a smaller amount can still go at the site's fees: how much, from the balance and the fees", () => {
  // The re-tester's busy market: a 43.93 gwei base fee and a 6.3 gwei tip; a 0.2 ETH wallet.
  const busy = routeFees(gwei(43.93), gwei(6.3));
  assert.equal(gasFloor(busy), ROUTE_GAS * gwei(50.23));
  assert.equal(gasFloor(busy), eth(0.120552));
  assert.ok(gasReserve(busy) > eth(0.2), "Max keeps more than the wallet has");
  assert.equal(ethMax(eth(0.2), gasReserve(busy)), 0n);
  assert.equal(ethFit(eth(0.2), busy), eth(0.0794));
  // That amount is sent (with a lower top fee); 0.0001 ETH more is refused, as the send's check does.
  assert.ok(fitFees(busy, eth(0.2) - eth(0.0794)));
  assert.equal(fitFees(busy, eth(0.2) - eth(0.0795)), undefined);
  // A calm market (0.28 gwei base, 0.72 gwei tip, 2026-10-29): a 0.004 ETH wallet; the fork's 0.001 ETH buy fits.
  const calm = routeFees(281_790_934n, 718_134_522n);
  assert.equal(ethMax(eth(0.004), gasReserve(calm)), 0n);
  assert.equal(ethFit(eth(0.004), calm), eth(0.0016));
  assert.ok(fitFees(calm, eth(0.004) - eth(0.001)));
  // Nothing fits: at or under the chain's fee for the gas.
  assert.equal(ethFit(gasFloor(calm), calm), 0n);
  assert.equal(ethFit(0n, calm), 0n);
  assert.ok(gasReserve(calm) >= ROUTE_GAS * (2n * calm.baseFee + WALLET_TIP));
});

test("N2: the words: the most that can still be paid, then more ETH or another currency; Max's note says why it has nothing to spend", () => {
  assert.equal(gasFix(false, ["IMD", "USDC"], "0.0794"), "Pay at most 0.0794 ETH at the fees the site sends, add ETH, or pay with IMD or USDC.");
  assert.equal(gasFix(false, [], "0.0794"), "Pay at most 0.0794 ETH at the fees the site sends, or add ETH.");
  assert.equal(gasFix(false, ["IMD", "USDC"]), "Add ETH, or pay with IMD or USDC.");
  assert.equal(gasFix(true, ["IMD", "USDC"], "0.0794"), "Lower the amount or press Max.");
  // One helper for every place: the amount check, the gas note, Max's note, both send refusals.
  assert.match(trade, /const fits = ethFit\(eth, fees\);\s*return gasFix\(false, others, fits > 0n \? amount\(fits, 18, 4\) : undefined\);/);
  assert.equal((trade.match(/ethHelp\(/g) || []).length, 3, "used by ethFix, fundsMessage and lessEthMessage");
  assert.doesNotMatch(trade, /gasFix\(false, others\)/);
  assert.match(
    trade,
    /ethFit\(available, gasFees\.data!\) > 0n\s*\? `Max keeps about \$\{amount\(reserve, 18, 4, "up"\)\} ETH for the gas in case your wallet sets its own fee, and this wallet has \$\{amount\(available, 18, 4\)\} ETH, so Max has nothing to spend\. \$\{ethFix\}`\s*: `Max keeps about \$\{amount\(reserve, 18, 4, "up"\)\} ETH free for the gas, and this wallet has \$\{amount\(available, 18, 4\)\} ETH: too little to buy with ETH, even at the fees the site sends\. \$\{ethFix\}`/,
  );
  assert.match(buying, /If Max leaves nothing to spend, the site says the most you can still pay at the fees it sends, if any, and suggests adding ETH or paying with IMD or USDC\./);
});

test("N3: Sell now sends the minimum the page shows; a price that fell past it sends nothing and rereads the quote", () => {
  // The page's minimum is the Buy page's rule at 1%: the same number the old (net * 99) / 100 gave.
  for (const net of [0n, 1n, 99n, 725_694_753_353_553_668n, 10n ** 24n + 7n]) assert.equal(minimumOf(net, 100), (net * 99n) / 100n);
  assert.match(court, /const minOut = minimumOf\(net, 100\);/);
  assert.match(court, /const fresh = simulation\.result as bigint,\s*\{ minimum, moved \} = sendMinimum\(net, fresh, 100\);\s*if \(moved\) \{\s*setSaleRevision\(\(n\) => n \+ 1\);/);
  assert.match(court, /return \[minimum\];/);
  assert.doesNotMatch(court, /simulation\.result as bigint\) \* 99n/);
  assert.match(court, /const saleQuote = useSaleQuote\(p, saleRevision\);/);
  assert.match(sale, /export function useSaleQuote\(p\?: Plea, revision = 0\)/);
  assert.match(sale, /\[p\?\.id, address, p\?\.status, revision\],/);
  // The fork's case (ui3/n3-new.log): the page's quote 0.7914 IMD, four approved sales, then 0.7754 IMD.
  const shown = 791_354_960_418_001_047n, fresh = 775_389_056_017_630_045n;
  assert.deepEqual(sendMinimum(shown, fresh, 100), { minimum: 783_441_410_813_821_036n, moved: true });
  assert.equal(sendMinimum(fresh, fresh, 100).moved, false);
  // The message and the docs' quote of it.
  assert.match(court, /title: `The price moved: the sale now gets about \$\{tokenAmount\(fresh, s, true, digits\)\}\.`/);
  assert.match(court, /body: `That is below the minimum this page showed, \$\{tokenAmount\(minimum, s, true, digits\)\}, so nothing was sold and your PLEA stays in your wallet\. The quote above is the new one: press Sell now again before \$\{clock\(sellUntil, true\)\} to sell at it\.`/);
  assert.match(plead, /If the price has already fallen past it when you press Sell now, nothing is sent and the site says "The price moved: the sale now gets about …"; the page shows the new quote, and pressing Sell now again sells at it\./);
  assert.match(plead, /for at least the minimum the page shows: the quote less 1%\./);
});

test("N3: a price-moved message shows enough digits for its two amounts to read apart", () => {
  // The fork's second case: 0.7753 against 0.7756 IMD both read 0.77 at 2 digits.
  const fresh = 775_389_056_017_630_045n, minimum = 775_660_000_000_000_000n,
    shown = (v, d) => (v / 10n ** BigInt(18 - d)).toString().padStart(d + 1, "0").replace(new RegExp(`(\\d{${d}})$`), ".$1");
  assert.equal(shown(fresh, 2), "0.77");
  assert.equal(shown(minimum, 2), "0.77");
  assert.equal(apartDigits(fresh, minimum, 18, 2), 4);
  assert.deepEqual([shown(fresh, 4), shown(minimum, 4)], ["0.7753", "0.7756"]);
  // Apart already: the page's own digits; never more than 6.
  assert.equal(apartDigits(70n * E / 100n, 80n * E / 100n, 18, 2), 2);
  assert.equal(apartDigits(5n, 6n, 18, 2), 6);
  assert.equal(apartDigits(1_000_000n * E, 990_000n * E, 18, 0), 0);
  assert.match(trade, /const digits = apartDigits\(fresh, minimum, Number\(s\?\.constants\[selling \? "pairDecimals" : "decimals"\] \?\? 18\), selling \? 2 : 0\);/);
});
