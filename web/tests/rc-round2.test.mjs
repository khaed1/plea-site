// The re-testers' second round (RC2-*, RS1-*): the docs quote the plea page's own refusals, Home's market
// cap before the open, a test build's own addresses on Contracts and owner, the Copy toast, the shared
// address, the empty-wallet Plead hint and Profile before the open, and the objections table's title.
// The Buy page's (RC2-1..5) are in buy-choices.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const court = read("../src/pages-court.tsx"),
  trade = read("../src/pages-trade.tsx"),
  info = read("../src/pages-info.tsx"),
  profile = read("../src/profile.tsx"),
  share = read("../src/share.tsx"),
  components = read("../src/components.tsx"),
  docsPage = read("../src/docs/Docs.tsx"),
  errors = read("../src/errors.ts"),
  plead = read("../../docs/03-plead.md"),
  keepers = read("../../docs/14-keepers.md");

/** A one-level template literal from the source as a pattern for the docs' quote of it: each ${…} is any
 * words, the site's ’ is the docs' '. */
function quoted(template) {
  return new RegExp(
    template
      .split(/\$\{[^}]*\}/)
      .map((piece) => piece.replaceAll("’", "'").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join('[^"]+?'),
  );
}
const templateOf = (src, key, start) => {
  const at = src.indexOf(`${key}: \`${start}`);
  assert.ok(at > 0, `${key}: ${start}`);
  const from = at + key.length + 3;
  return src.slice(from, src.indexOf("`,", from));
};

test("RS1-L1: the docs quote the plea page's own refusals for a plea sale and a Letterbox delivery that miss their minimum", () => {
  const sell = templateOf(court, "SlippageExceeded", "The price moved more than 1%."),
    deliver = templateOf(court, "SlippageExceeded", "The pool price is more than 5%");
  assert.match(plead, quoted(sell));
  assert.match(keepers, quoted(deliver));
  // The plea sale's minimum is fixed at 1%: no slippage to raise, so not errors.ts's generic words.
  const generic = errors.match(/SlippageExceeded:\s*"([^"]+)"/)[1];
  assert.equal(generic, "The price moved beyond your minimum. Refresh the quote or raise your slippage.");
  assert.ok(!plead.includes(generic) && !keepers.includes(generic));
  assert.match(plead, /The sale's minimum is fixed at 1% under the quote: there is no slippage to choose\./);
  assert.match(plead, /for at least the minimum the page shows: the quote less 1%\./);
  // Sell now sends the page's own minimum (N3: rc-round3.test.mjs).
  assert.match(court, /\{ minimum, moved \} = sendMinimum\(net, fresh, 100\);/);
  // Sell now's own lapse message, in the docs' example (approved at 12:04, the window to 12:11, the
  // cooldown from the approval: 16:04).
  assert.match(court, /WindowLapsed: `The window closed at \$\{clock\(sellUntil, true\)\}\. Plea #\$\{p\.id\} lapsed: nothing was sold\. \$\{p\.standing\?\.\[1\] \|\| p\.excluded \? "" : `Your \+\$\{p\.points\} points still count\. `\}Next plea at \$\{clock\(/);
  assert.match(plead, /"The window closed at 12:11:00 UTC\. Plea #… lapsed: nothing was sold\. Your \+37 points still count\. Next plea at 16:04 UTC\."/);
});

test("RS1-L2: before the open, Home's market cap says not open yet and the cap trading opens at, never 0 IMD", () => {
  assert.match(
    info,
    /"Market cap",[^\]]*?seeded\s*\? tokenAmount\(\(supply \* price\) \/ 2n \*\* 96n, s, true, 0\)\s*: "Not open yet",\s*seeded\s*\? `Supply \$\{tokenAmount\(supply, s\)\}`\s*: `Opens at \$\{tokenAmount\(con\(s, "PleaHook\.MARKET_CAP_IMD"\), s, true, 0\)\}`,/,
  );
});

test("RS1-L3: a test build's Contracts and owner page lists its own addresses in its banner, where Home's notice and the footer point", () => {
  assert.match(docsPage, /\{page\.slug === "contracts" && <SiteContracts \/>\}/);
  assert.match(docsPage, /const EIGHT = \["PLEA", "CabalGate", "Seasons", "PleaHook", "Letterbox", "Tribunal", "PleaDistributor", "PleaLaunch"\];/);
  assert.match(docsPage, /\["The owner", owner\],/);
  assert.match(docsPage, /This site’s own contracts on \{site\(\)\.chain\}:/);
  // The banner shows on a test build only.
  assert.match(docsPage, /\{page && test && \(\s*<Notice title="These docs describe PLEA on Ethereum">/);
  assert.match(info, /All of PLEA’s contracts are on the\{" "\}\s*<a href="#\/docs\/contracts">Contracts and owner<\/a> page in the docs\./);
});

test("RS1-N1: the Copy toast starts with a capital letter, whatever the row's label", () => {
  assert.match(components, /text: `\$\{label\[0\]\.toUpperCase\(\)\}\$\{label\.slice\(1\)\} address copied\.`/);
  assert.match(components, /aria-label=\{`Copy \$\{label\} address`\}/);
});

test("RS1-N2: the share card and the Share on X link name the site's own address, not the alias it was opened through", () => {
  assert.match(share, /const cardUrl = site\(\)\.siteUrl\.replace\(\/\^https\?:\\\/\\\/\/, ""\) \+ \(p \? `#\/p\/\$\{p\.id\}` : ""\);/);
  assert.match(share, /const url = site\(\)\.siteUrl \+ \(p \? `#\/p\/\$\{p\.id\}` : "#\/"\);/);
  assert.doesNotMatch(share, /location\.(host|href|pathname)/);
  for (const key of ["ethereum", "sepolia-run9"]) {
    const { siteUrl } = JSON.parse(read(`../networks/${key}/site.json`));
    assert.match(siteUrl, /^https:\/\/[^/#?]+\/$/, key);
  }
  assert.equal(JSON.parse(read("../networks/ethereum/site.json")).siteUrl, "https://pleaimd.fun/");
});

test("RS1-N4: an empty wallet's Plead hint names the rule, not 0 to 0 PLEA; before the open Profile says so", () => {
  assert.match(
    trade,
    /: !balance\.data\s*\? undefined\s*: bal === 0n\s*\? \/\/[^\n]*\n\s*`This wallet has no PLEA to plead with\. A plea sells from \$\{Number\(con\(s, "CabalGate\.MIN_SHARE_BPS"\) \|\| 100\) \/ 100\}% to \$\{Number\(con\(s, "CabalGate\.MAX_SHARE_BPS"\) \|\| 0\) \/ 100\}% of your PLEA, at most \$\{tokenAmount\(cap, s\)\}\.`/,
  );
  assert.match(profile, /next = !val\(s, "PleaHook\.seeded"\)\s*\? "After trading opens"\s*: derived\.open/);
  assert.match(profile, /val\(s, "PleaHook\.latestPrice"\)\s*\? `At the hourly price, \$\{[^\n]+\} per 1M`\s*: "At the hourly price, once trading opens",/);
});

test("RS1-N5: the objections table is titled for what it lists, pending ones included", () => {
  assert.match(court, /<h2>Recent objections<\/h2>/);
  assert.match(court, /aria-label="Recent objections"/);
  assert.doesNotMatch(court, /Recent rulings/);
});
