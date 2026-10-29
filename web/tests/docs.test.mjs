// The Docs section (src/docs): the Markdown parser and renderer (every construct, the {{number}},
// diagram and callout extensions, no raw placeholder ever printed), the page order against docs/*.md,
// Previous / Next, the search index, and numbers.json's formats against the chain-bound values.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DOCS, fileOf, pageOf, prevNext, docHref, headingElementId } from "../src/docs/order.ts";
import { parse, parseInline, checkPage, checkDocs, plain, tocOf, slugify, docLink } from "../src/docs/markdown.ts";
import { buildIndex, search, snippet } from "../src/docs/search.ts";

const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-docs-"));
after(() => rm(dir, { recursive: true, force: true }));
const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const ROOT_DOCS = fileURLToPath(new URL("../../docs/", import.meta.url));
const DIAGRAM_DIR = path.join(SRC, "docs/diagrams");
const NUMBERS = JSON.parse(fs.readFileSync(path.join(SRC, "docs/numbers.json"), "utf8"));
const diagramNames = fs.readdirSync(DIAGRAM_DIR).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4));
const docFiles = Object.fromEntries(
  fs.readdirSync(ROOT_DOCS).filter((f) => /^\d\d-.*\.md$/.test(f)).map((f) => [f, fs.readFileSync(path.join(ROOT_DOCS, f), "utf8")]),
);
const fileText = (k) => (k === "_meta" ? undefined : NUMBERS[k]?.text);

// The renderer, the numbers module and the real diagrams, bundled as Vite would (JSX, JSON), with
// React and the wallet libraries left to node.
const entry = [
  `export { renderToStaticMarkup } from "react-dom/server";`,
  `export { createElement } from "react";`,
  `export { Markdown } from ${JSON.stringify(path.join(SRC, "docs/render.tsx"))};`,
  `export * as numbers from ${JSON.stringify(path.join(SRC, "docs/numbers.ts"))};`,
  `export { readerFor, NumbersProvider } from ${JSON.stringify(path.join(SRC, "docs/numbers-context.tsx"))};`,
  `export * as kit from ${JSON.stringify(path.join(SRC, "docs/kit.tsx"))};`,
  ...diagramNames.map((n, i) => `import d${i} from ${JSON.stringify(path.join(DIAGRAM_DIR, n + ".tsx"))};`),
  `export const diagrams = {${diagramNames.map((n, i) => `${JSON.stringify(n)}: d${i}`).join(", ")}};`,
].join("\n");
const outfile = path.join(dir, "docs-bundle.mjs");
await build({
  stdin: { contents: entry, resolveDir: SRC, loader: "tsx" },
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  jsx: "automatic",
  logLevel: "silent",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "locked",
      setup(b) {
        b.onResolve({ filter: /^(viem|wagmi|@tanstack\/react-query|react|react-dom)(\/.*)?$/ }, (a) => ({
          path: require.resolve(a.path),
          external: true,
        }));
      },
    },
  ],
});
const R = await import(pathToFileURL(outfile));
const ctx = (over = {}) => ({ slug: "fees", num: fileText, diagrams: R.diagrams, ...over });
const html = (md, over) => R.renderToStaticMarkup(R.createElement(R.Markdown, { tree: parse(md, fileText).blocks, ctx: ctx(over) }));

test("the sidebar is the 18 pages in order, and docs/ holds exactly their files", () => {
  assert.deepEqual(
    DOCS.map((p) => [p.n, p.slug, p.title]),
    [
      ["01", "start-here", "Start here"],
      ["02", "buying", "Buying"],
      ["03", "plead", "Selling: plead"],
      ["04", "your-bar", "Your bar"],
      ["05", "judges", "The judges"],
      ["06", "appeals", "Appeals"],
      ["07", "letters", "Letters"],
      ["08", "auto-sell", "The auto-sell box"],
      ["09", "objection", "Objection!"],
      ["10", "seasons", "Seasons and prizes"],
      ["11", "fees", "Fees"],
      ["12", "pool", "The pool: cap, burn and the buy wall"],
      ["13", "dead-man", "The dead-man"],
      ["14", "keepers", "Keepers"],
      ["15", "contracts", "Contracts and owner"],
      ["16", "audits", "Audits"],
      ["17", "risks", "Risks and FAQ"],
      ["18", "glossary", "Glossary"],
    ],
  );
  assert.deepEqual(Object.keys(docFiles).sort(), DOCS.map(fileOf));
  for (const p of DOCS) assert.equal(docFiles[fileOf(p)].split("\n")[0], `# ${p.title}`, fileOf(p));
  // IMD's run 9 notes stay in docs/imd-run9 and are no page.
  assert.ok(fs.statSync(path.join(ROOT_DOCS, "imd-run9")).isDirectory());
  assert.equal(pageOf(undefined).slug, "start-here");
  assert.equal(pageOf("fees").title, "Fees");
  assert.equal(pageOf("nope"), undefined);
  assert.equal(docHref("fees"), "#/docs/fees");
  assert.equal(docHref("fees", "example"), "#/docs/fees/example");
  assert.equal(headingElementId("example"), "docs-example");
});

test("Previous and Next follow the sidebar, with none before the first or after the last", () => {
  assert.deepEqual(prevNext("start-here"), { prev: undefined, next: DOCS[1] });
  assert.deepEqual(prevNext("fees"), { prev: DOCS[9], next: DOCS[11] });
  assert.equal(prevNext("fees").prev.slug, "seasons");
  assert.equal(prevNext("fees").next.slug, "pool");
  assert.deepEqual(prevNext("glossary"), { prev: DOCS[16], next: undefined });
  assert.deepEqual(prevNext("nope"), { prev: undefined, next: undefined });
});

test("every page passes the build's checks, and the skeletons keep the five parts", () => {
  assert.deepEqual(checkDocs(docFiles, { numbers: Object.keys(NUMBERS), diagrams: diagramNames, numberText: fileText }), []);
  for (const p of DOCS) {
    const heads = tocOf(parse(docFiles[fileOf(p)], fileText).blocks).map((h) => h.text);
    for (const part of ["In short", "How it works", "Example", "Good to know"]) assert.ok(heads.includes(part), `${fileOf(p)}: ${part}`);
  }
  assert.match(docFiles["11-fees.md"], /^::: diagram fee-bar$/m);
});

test("headings: h1 to h4, ids from the words, {#custom} ids, repeats numbered, h5 refused", () => {
  const { blocks, errors } = parse("# Selling: plead\n\n## How it works\n\n### Step 1 {#first}\n\n#### Small print\n\n## How it works\n\n## Sell in {{sell_window}}", fileText);
  assert.deepEqual(errors, []);
  assert.deepEqual(
    blocks.map((b) => [b.level, b.id]),
    [[1, "selling-plead"], [2, "how-it-works"], [3, "first"], [4, "small-print"], [2, "how-it-works-2"], [2, "sell-in-7-minutes"]],
  );
  assert.match(parse("##### Too deep").errors[0], /level-5 heading/);
  assert.equal(slugify("Objection!"), "objection");
  assert.equal(slugify("Café & co."), "cafe-co");
});

test("inline: bold, italic, code, links, escapes and placeholders; snake_case stays text", () => {
  assert.deepEqual(parseInline("**bold** and *it* and _it_"), [
    { t: "strong", c: [{ t: "text", v: "bold" }] },
    { t: "text", v: " and " },
    { t: "em", c: [{ t: "text", v: "it" }] },
    { t: "text", v: " and " },
    { t: "em", c: [{ t: "text", v: "it" }] },
  ]);
  assert.deepEqual(parseInline("PLEA_BURN_BPS and 2 * 3"), [{ t: "text", v: "PLEA_BURN_BPS and 2 * 3" }]);
  assert.deepEqual(parseInline("`letter(text)` costs {{oracle_fee}}"), [
    { t: "code", c: [{ t: "text", v: "letter(text)" }] },
    { t: "text", v: " costs " },
    { t: "num", key: "oracle_fee" },
  ]);
  assert.deepEqual(parseInline("`PASS_MARK() = {{pass_mark}}`")[0].c, [{ t: "text", v: "PASS_MARK() = " }, { t: "num", key: "pass_mark" }]);
  assert.deepEqual(parseInline("[the **fees**](11-fees.md#example)"), [
    { t: "link", href: "11-fees.md#example", c: [{ t: "text", v: "the " }, { t: "strong", c: [{ t: "text", v: "fees" }] }] },
  ]);
  assert.deepEqual(parseInline("\\*not\\* \\{{x}}"), [{ t: "text", v: "*not* {{x}}" }]);
  const e = [];
  parseInline("an {{open placeholder", e);
  assert.match(e[0], /unclosed placeholder/);
  assert.equal(docLink("11-fees.md"), "#/docs/fees");
  assert.equal(docLink("./04-your-bar.md#need"), "#/docs/your-bar/need");
  assert.equal(docLink("#/buy"), "#/buy");
});

test("blocks: paragraphs, lists nested one level, tables, quotes, code, rules, diagrams, callouts, comments", () => {
  const md = [
    "# Fees",
    "",
    "One line",
    "and the next.",
    "<!-- a note for writers -->",
    "",
    "- first",
    "  - inner one",
    "  - inner two",
    "- second",
    "  continued",
    "",
    "3. three",
    "4. four",
    "",
    "| Part | Share |",
    "| --- | ---: |",
    "| Owner | {{fee_owner}} |",
    "| Code | `a\\|b` |",
    "",
    "> Quoted **words**.",
    "",
    "```sh",
    "cast call {{pass_mark}}",
    "```",
    "",
    "---",
    "",
    "::: diagram fee-bar",
    "",
    "::: warn The fee is spent",
    "Either way.",
    ":::",
    "",
    "::: builders",
    "`PleaHook.POOL_BPS`",
    ":::",
  ].join("\n");
  const { blocks, errors } = parse(md, fileText);
  assert.deepEqual(errors, []);
  assert.deepEqual(blocks.map((b) => b.t), ["h", "p", "list", "list", "table", "quote", "pre", "hr", "diagram", "callout", "callout"]);
  assert.equal(plain(blocks[1].c), "One line and the next.");
  const ul = blocks[2];
  assert.equal(ul.ordered, false);
  assert.deepEqual(ul.items.map((i) => plain(i.c)), ["first", "second continued"]);
  assert.deepEqual(ul.items[0].sub.items.map((i) => plain(i.c)), ["inner one", "inner two"]);
  assert.equal(blocks[3].ordered, true);
  assert.equal(blocks[3].start, 3);
  assert.deepEqual(blocks[4].align, ["l", "r"]);
  assert.equal(plain(blocks[4].rows[1][1]), "a|b");
  assert.equal(blocks[6].lang, "sh");
  assert.equal(blocks[8].name, "fee-bar");
  assert.equal(blocks[9].kind, "warn");
  assert.equal(plain(blocks[9].title), "The fee is spent");
  assert.equal(blocks[10].kind, "builders");
  // Mistakes a writer can make are errors (the build lists them).
  assert.match(parse("```\nnever closed").errors[0], /never closed/);
  assert.match(parse("::: note\nnever closed").errors[0], /never closed/);
  assert.match(parse("::: tip\nx\n:::").errors[0], /unknown block "::: tip"/);
  assert.match(parse("- a\n  - b\n      - c").errors[0], /more than one level/);
  assert.match(parse("::: note\n::: warn\nx\n:::\n:::").errors.join(), /callout inside a callout/);
});

// The main network's nickname, built here so that this file never spells it (a testnet build refuses it).
const NICKNAME = ["main", "net"].join("");
test("the page checks: title, heading order, unknown numbers and diagrams, links, the main network's nickname", () => {
  const input = { numbers: Object.keys(NUMBERS), diagrams: diagramNames, numberText: fileText };
  assert.deepEqual(checkPage("# Fees\n\n## A\n\n### B\n\n{{fee_total}}\n\n::: diagram fee-bar", "Fees", input).problems, []);
  const bad = (md) => checkPage(md, "Fees", input).problems.join("\n");
  assert.match(bad("# Charges"), /the title is "Charges"/);
  assert.match(bad("Fees"), /first line must be "# Fees"/);
  assert.match(bad("# Fees\n\n### Skipped"), /level-3 heading under a level-1/);
  assert.match(bad("# Fees\n\n{{no_such_number}}"), /unknown number \{\{no_such_number\}\}/);
  assert.match(bad("# Fees\n\n`{{_meta}}`"), /unknown number \{\{_meta\}\}/);
  assert.match(bad("# Fees\n\n::: diagram no-such"), /unknown diagram "no-such"/);
  assert.match(bad("# Fees\n\nEscaped \\{{pass_mark}}"), /raw braces/);
  assert.match(bad("# Fees\n\n[x](99-nope.md)"), /does not exist/);
  assert.match(bad("# Fees\n\n[x](../keeper/VPS.md)"), /neither a site page/);
  assert.match(bad(`# Fees\n\nOn Ethereum ${NICKNAME}.`), new RegExp(`the word "${NICKNAME}"`));
  const chainOne = ["Chain", "ID", String(1)].join(" ");
  assert.match(bad(`# Fees\n\n${chainOne}.`), new RegExp(`the word "${chainOne}"`));
  const files = { ...docFiles, "11-fees.md": docFiles["11-fees.md"] + "\n[x](04-your-bar.md#no-such-heading)\n", "19-extra.md": "# Extra\n" };
  const all = checkDocs(files, input).join("\n");
  assert.match(all, /docs\/19-extra.md is not in the sidebar/);
  assert.match(all, /a link to a heading that does not exist: 04-your-bar.md#no-such-heading/);
});

test("the renderer draws every construct in the site's components, never a raw placeholder", () => {
  const out = html(
    [
      "# Fees",
      "",
      "## How it works",
      "",
      "### Step one",
      "",
      "#### Small print",
      "",
      "Pay **{{oracle_fee}}**, *once*, with `code`. See [your bar](04-your-bar.md), [Buy](#/buy) and [IMD](https://imd.fun).",
      "",
      "1. one",
      "   - inner",
      "2. two",
      "",
      "| Part | Share |",
      "| :---: | ---: |",
      "| Owner | {{fee_owner}} |",
      "",
      "> A quote.",
      "",
      "```",
      "{{pass_mark}} <b>not html</b>",
      "```",
      "",
      "---",
      "",
      "::: note",
      "A note.",
      ":::",
      "",
      "::: warn Careful",
      "- a warning",
      ":::",
      "",
      "::: builders",
      "`CabalGate.PASS_MARK()` is {{pass_mark}}.",
      ":::",
      "",
      "::: diagram fee-bar",
    ].join("\n"),
  );
  assert.ok(!out.includes("{{"), "a raw placeholder");
  assert.match(out, /<div class="page-title"><h1>Fees<\/h1><\/div>/);
  assert.match(
    out,
    /<div class="docs-h docs-h--2"><h2 id="docs-how-it-works" tabindex="-1">How it works<\/h2><a class="docs-anchor" href="#\/docs\/fees\/how-it-works" aria-label="Link to How it works">/,
  );
  assert.match(out, /<h3 id="docs-step-one" tabindex="-1">Step one<\/h3><a class="docs-anchor" href="#\/docs\/fees\/step-one" aria-label="Link to Step one">/);
  assert.match(out, /<h4 id="docs-small-print" tabindex="-1">Small print<\/h4>/);
  assert.match(out, /<strong><span class="nowrap">0.5 IMD<\/span><\/strong>, <em>once<\/em>, with <code>code<\/code>/);
  assert.match(out, /<a href="#\/docs\/your-bar">your bar<\/a>/);
  assert.match(out, /<a href="#\/buy">Buy<\/a>/);
  assert.match(
    out,
    /<a href="https:\/\/imd.fun" target="_blank" rel="noreferrer" class="docs-ext">IMD<svg class="icon" aria-hidden="true"><use href="#i-arrow-square-out"><\/use><\/svg><span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/,
  );
  assert.match(out, /<ol><li>one<ul><li>inner<\/li><\/ul><\/li><li>two<\/li><\/ol>/);
  assert.match(out, /<div class="table-wrap docs-table" role="region" aria-label="Table: Part, Share" tabindex="0"><table class="table">/);
  assert.match(out, /<th scope="col" class="c">Part<\/th><th scope="col" class="r">Share<\/th>/);
  assert.match(out, /<td class="r"><span class="nowrap">1%<\/span><\/td>/);
  assert.match(out, /<blockquote class="docs-quote stack stack--sm"><p>A quote.<\/p><\/blockquote>/);
  assert.match(out, /<pre class="docs-code"><code><span class="nowrap">69<\/span> &lt;b&gt;not html&lt;\/b&gt;<\/code><\/pre>/);
  assert.match(out, /<hr\/>/);
  assert.match(out, /<div class="notice notice--info"><svg class="icon" aria-hidden="true"><use href="#i-info">/);
  assert.match(out, /<div class="notice notice--warn">.*?<p class="notice__title">Careful<\/p>.*?<li>a warning<\/li>/);
  assert.match(out, /<div class="notice notice--builders">.*?<p class="notice__title">For builders<\/p>.*?<code>CabalGate.PASS_MARK\(\)<\/code> is <span class="nowrap">69<\/span>/);
  assert.match(out, /<div class="docs-diagram"><figure class="docs-figure panel stack stack--md">/);
});

test("an unknown number or diagram fails to render (the build refuses them first)", () => {
  assert.throws(() => html("# Fees\n\n{{no_such_number}}"), /unknown number \{\{no_such_number\}\}/);
  assert.throws(() => html("# Fees\n\n`{{no_such_number}}`"), /unknown number/);
  assert.throws(() => html("# Fees\n\n::: diagram no-such"), /unknown diagram "no-such"/);
});

test("every page renders with the real diagrams and numbers: no raw placeholder, no network nickname", () => {
  for (const p of DOCS) {
    const out = R.renderToStaticMarkup(
      R.createElement(R.Markdown, { tree: parse(docFiles[fileOf(p)], fileText).blocks, ctx: ctx({ slug: p.slug }) }),
    );
    assert.ok(!/\{\{|\}\}/.test(out), `${fileOf(p)} prints a raw placeholder`);
    assert.ok(!/\bmain[ -]?net\b|chain[ -]?id:? ?1\b/i.test(out), `${fileOf(p)} names the main network`);
    assert.equal((out.match(/<h1>/g) || []).length, 1, fileOf(p));
  }
});

test("the fee-bar diagram: an image with words, five numbered parts that add up to the total", () => {
  const out = R.renderToStaticMarkup(R.createElement(R.diagrams["fee-bar"]));
  assert.match(out, /<svg class="docs-bar__svg" viewBox="0 0 1000 48" preserveAspectRatio="none" role="img" aria-labelledby="([^"]+)"><title id="\1">/);
  // The numbers on the bar sit at the middle of their parts: 50, 100, 25, 25, 25 of 225.
  const keys = [...out.matchAll(/<span class="docs-bar__key" style="left:([\d.]+)%" aria-hidden="true">(\d)<\/span>/g)];
  assert.deepEqual(keys.map((k) => k[2]), ["1", "2", "3", "4", "5"]);
  assert.deepEqual(keys.map((k) => Number(k[1]).toFixed(2)), ["11.11", "44.44", "72.22", "83.33", "94.44"]);
  const alt = out.match(/<title id="[^"]+">([^<]+)<\/title>/)[1].replace(/&#x27;|’/g, "'");
  assert.equal(
    alt,
    "A bar for the 2.25% fee every trade pays, in five numbered parts: 1, back to you, as staked IMD: 0.5% of the IMD; 2, the owner: 1% of the IMD; 3, the season's prize pot: 0.25% of the IMD; 4, the buy wall, kept in the pool: 0.25% of the IMD; 5, burned: 0.25% of the PLEA. Parts 1 to 4 are 2% of the trade's IMD; part 5 is 0.25% of its PLEA.",
  );
  assert.equal(NUMBERS.fee_total.text, "2.25%");
  assert.match(out, /<figcaption class="docs-figure__title">The 2.25% fee on every trade: 2% of its IMD in four parts, and 0.25% of its PLEA, burned<\/figcaption>/);
  for (const n of [1, 2, 3, 4, 5]) assert.match(out, new RegExp(`<span class="sr-only">Part ${n}: </span>`));
  assert.match(out, /<div class="total"><dt>Every trade<\/dt><dd>2.25%<\/dd><\/div>/);
  // The chain's values, when they differ, redraw it (and say so once in the console).
  const warn = console.warn,
    said = [];
  console.warn = (m) => said.push(m);
  try {
    const live = R.renderToStaticMarkup(
      R.createElement(R.NumbersProvider, { value: R.readerFor({ "PleaHook.OWNER_BPS": 200n }) }, R.createElement(R.diagrams["fee-bar"])),
    );
    assert.match(live, /<dd>3.25%<\/dd>/);
    assert.match(live, /<dd>2% <span class="text-2">of the IMD<\/span><\/dd>/);
  } finally {
    console.warn = warn;
  }
  assert.equal(said.length, 1);
});

test("the docs kit draws the site's stamp and need meter from given values and numbers.json", () => {
  const stamp = R.renderToStaticMarkup(R.createElement(R.kit.Stamp, { state: "NO VERDICT", sub: "expired", size: "lg" }));
  assert.equal(stamp, '<span class="stamp stamp--noverdict stamp--lg">NO VERDICT<span class="stamp__sub">expired</span></span>');
  assert.equal(R.renderToStaticMarkup(R.createElement(R.kit.Stamp, { state: "OVERRULED" })), '<span class="stamp stamp--objection">OVERRULED</span>');
  // Need = 69 - 34 = 35; a score of 33 is 2 short.
  const meter = R.renderToStaticMarkup(R.createElement(R.kit.Meter, { fact: 34, score: 33, verdict: "DENIED" }));
  assert.match(meter, /^<div class="meter meter--denied" style="--score:33;--need:35">/);
  assert.match(meter, /Need <b>35<\/b> = 69 − fact <b>34<\/b>/);
  assert.match(meter, /<span class="bad-text">2 short<\/span>/);
  assert.match(meter, /role="img" aria-label="Score 33 of 45, need 35: 2 short"/);
  const none = R.renderToStaticMarkup(R.createElement(R.kit.Meter, { fact: 41 }));
  assert.match(none, /class="meter meter--none"/);
  assert.match(none, /aria-label="No score yet, need 28 of 45."/);
});

test("search finds a heading and a word, best match first, and links to the heading", () => {
  const pages = [
    { slug: "plead", title: "Selling: plead", blocks: parse("# Selling: plead\n\nWrite a plea.\n\n## The cooldown\n\nAfter a sale you wait four hours.\n\n## Fees\n\nThe oracle fee is {{oracle_fee}}.", fileText).blocks },
    { slug: "fees", title: "Fees", blocks: parse("# Fees\n\n## Who gets what\n\nThe owner gets {{fee_owner}}. A cooldown is elsewhere.", fileText).blocks },
  ];
  const index = buildIndex(pages, fileText);
  assert.deepEqual(index.map((e) => [e.slug, e.heading, e.id]), [
    ["plead", "", ""],
    ["plead", "The cooldown", "the-cooldown"],
    ["plead", "Fees", "fees"],
    ["fees", "Who gets what", "who-gets-what"],
  ]);
  const cool = search(index, "Cooldown");
  assert.deepEqual(cool.map((r) => r.href), ["#/docs/plead/the-cooldown", "#/docs/fees/who-gets-what"]);
  assert.deepEqual(search(index, "four hours").map((r) => r.href), ["#/docs/plead/the-cooldown"]);
  assert.deepEqual(search(index, "0.5 IMD").map((r) => r.href), ["#/docs/plead/fees"]);
  assert.deepEqual(search(index, "plea write").map((r) => r.href), ["#/docs/plead"]);
  assert.deepEqual(search(index, "x"), []);
  assert.deepEqual(search(index, "nothing like this"), []);
  // Over the real pages: every page's title and its "Good to know".
  const real = buildIndex(DOCS.map((p) => ({ ...p, blocks: parse(docFiles[fileOf(p)], fileText).blocks })), fileText);
  assert.equal(search(real, "good to know", 50).length, 18);
  assert.equal(search(real, "auto-sell")[0].entry.slug, "auto-sell");
  assert.equal(search(real, "Objection")[0].entry.page, "Objection!");
  assert.equal(snippet("a ".repeat(100) + "needle " + "b ".repeat(100), ["needle"]).includes("needle"), true);
});

test("numbers.json: every text is its format applied to its value, chain-bound or not", () => {
  const N = R.numbers;
  assert.deepEqual(N.checkNumbers(NUMBERS), []);
  assert.equal(N.formatValue("int", "1000"), "1,000");
  assert.equal(N.formatValue("imd", "500000000000000000"), "0.5 IMD");
  assert.equal(N.formatValue("imd", "20000000000000000000000"), "20,000 IMD");
  assert.equal(N.formatValue("plea", "2500000000000000000000000"), "2,500,000 PLEA");
  assert.equal(N.formatValue("duration", "420"), "7 minutes");
  assert.equal(N.formatValue("duration", "118800"), "33 hours");
  assert.equal(N.formatValue("duration", "1296000"), "15 days");
  assert.equal(N.formatValue("duration", 3600n), "1 hour");
  assert.equal(N.formatValue("bps", "25"), "0.25%");
  assert.equal(N.formatValue("bps", 5000n), "50%");
  assert.equal(N.formatValue("multiplier", "12000"), "×1.2");
  assert.equal(N.formatValue("text", "1"), undefined);
  for (const [key, e] of Object.entries(NUMBERS)) {
    if (key === "_meta" || e.format === "text" || (!e.chain && e.value === null)) continue;
    assert.equal(N.formatValue(e.format, e.value), e.text, key);
  }
  assert.match(N.checkNumbers({ x: { text: "70%, falling", value: "7000", chain: "PleaHook.LAUNCH_EXTRA_BPS", format: "bps" } })[0], /bps\(7000\) is "70%", text is "70%, falling"/);
  // An unbound number with a value is held to the same rule (a diagram reads its value).
  assert.match(N.checkNumbers({ y: { text: "0.70 IMD", value: "700000000000000000", chain: null, format: "imd" } })[0], /imd\(700000000000000000\) is "0.7 IMD", text is "0.70 IMD"/);
  assert.deepEqual(N.checkNumbers({ z: { text: "about 54.6 million PLEA", value: null, chain: null, format: "text" } }), []);
  // Chain-bound values as the launched contracts returned them (read-only calls, 2026-10-29).
  for (const [key, chain, value] of [
    ["pass_mark", "CabalGate.PASS_MARK", "69"],
    ["deadman", "CabalGate.DEADMAN", "118800"],
    ["cap_floor", "PleaHook.CAP_FLOOR", "900000000000000000000000"],
    ["wall_guard", "PleaHook.WALL_GUARD_TICKS_PER_DAY", "700"],
    ["launch_extra", "PleaHook.LAUNCH_EXTRA_BPS", "7000"],
    ["seat_multiplier", "Seasons.SEAT_MULTIPLIER_BPS", "12000"],
    ["objection_margin", "Tribunal.MARGIN", "2"],
  ])
    assert.deepEqual([NUMBERS[key].chain, NUMBERS[key].value], [chain, value], key);
});

test("numbers: the chain's value wins (with one console warning), a text entry never moves", () => {
  const N = R.numbers;
  assert.equal(N.numberWords(NUMBERS, "pass_mark"), "69");
  assert.equal(N.numberWords(NUMBERS, "pass_mark", { "CabalGate.PASS_MARK": 69n }), "69");
  const warn = console.warn,
    said = [];
  console.warn = (m) => said.push(m);
  try {
    assert.equal(N.numberWords(NUMBERS, "pass_mark", { "CabalGate.PASS_MARK": 71n }), "71");
    assert.equal(N.numberWords(NUMBERS, "pass_mark", { "CabalGate.PASS_MARK": 71n }), "71");
    assert.equal(N.numberWords(NUMBERS, "season_length", { "Seasons.SEASON": 18000n }), "5 hours");
    assert.equal(N.numberWords(NUMBERS, "start", { "PleaLaunch.START": 1n }), NUMBERS.start.text);
  } finally {
    console.warn = warn;
  }
  assert.equal(said.filter((m) => m.includes("PASS_MARK")).length, 1);
  assert.ok(said.some((m) => m.includes("Seasons.SEASON")));
  assert.equal(N.numberWords(NUMBERS, "no_such"), undefined);
  assert.equal(N.numberWords(NUMBERS, "_meta"), undefined);
  assert.equal(N.numberValue(NUMBERS, "oracle_fee"), 5n * 10n ** 17n);
  assert.equal(N.numberValue(NUMBERS, "oracle_fee", { "CabalGate.ORACLE_FEE": 1n }), 1n);
  assert.equal(N.numberValue(NUMBERS, "owner"), undefined);
});

test("every chain-bound number names a constant the site reads (an upper-case view without inputs)", () => {
  for (const [key, e] of Object.entries(NUMBERS)) {
    if (key === "_meta" || !e.chain) continue;
    const [contract, name] = e.chain.split(".");
    const abi = JSON.parse(fs.readFileSync(new URL(`../public/abi/${contract}.json`, import.meta.url), "utf8"));
    const f = (abi.abi || abi).find((x) => x.type === "function" && x.name === name);
    assert.ok(f, `${key}: ${e.chain} is not in public/abi/${contract}.json`);
    assert.equal(f.inputs.length, 0, key);
    assert.notEqual(f.stateMutability, "nonpayable", key);
    assert.match(name, /^[A-Z][A-Z_0-9]*$/, key);
  }
});

// Pages 1-9's diagrams (writer-a): each is one image named in words, drawn from numbers.json.
const A_DIAGRAMS = ["loop", "launch-fee", "plea-states", "need", "ring", "appeal-window", "letter-path", "auto-sell", "objection-window"];
const draw = (name, constants) =>
  R.renderToStaticMarkup(
    constants
      ? R.createElement(R.NumbersProvider, { value: R.readerFor(constants) }, R.createElement(R.diagrams[name]))
      : R.createElement(R.diagrams[name]),
  );
const nameOf = (out) => {
  const m = out.match(/<div class="dg-art" role="img" aria-labelledby="([^"]+)"><span id="\1" class="sr-only">([^<]+)<\/span>/);
  return m && m[2];
};

test("pages 1-9's diagrams: a figure with a title, one image named in words, no raw placeholder", () => {
  for (const name of A_DIAGRAMS) {
    assert.ok(R.diagrams[name], name);
    const out = draw(name);
    assert.match(out, /^<figure class="docs-figure panel stack stack--md dg"><figcaption class="docs-figure__title">/, name);
    assert.ok((nameOf(out) || "").length > 80, `${name}: the image's name says what it shows`);
    assert.ok(!/\{\{|\}\}|undefined|NaN/.test(out), name);
    assert.ok(!/\bmain[ -]?net\b|chain[ -]?id:? ?1\b/i.test(out), name);
    assert.ok(DOCS.some((p) => docFiles[fileOf(p)].includes(`::: diagram ${name}\n`)), `${name} is on a page`);
  }
});

test("launch-fee: the fee every quarter hour is numbers.json's curve, rounded down to whole basis points", () => {
  const out = draw("launch-fee");
  const fees = [...out.matchAll(/<dd>([\d.]+%) <span class="text-2">\+ 2%<\/span><\/dd>/g)].map((m) => m[1]);
  assert.deepEqual(fees, ["70%", "58.33%", "46.66%", "35%", "23.33%", "11.66%", "0%"]);
  for (const f of fees) assert.ok(NUMBERS.launch_fee_curve.text.includes(f), f);
  assert.match(nameOf(out), /at most 5,000,000 PLEA from the pool/);
});

test("need: the pass mark split into the four facts, and the need by days held", () => {
  const out = draw("need");
  assert.match(out, /Fact score 16 \+ 1 \+ 9 \+ 5 = 31\. Need 69 − 31 = 38\./);
  const rows = [...out.matchAll(/<tr><th scope="row">([^<]+)<\/th>((?:<td[^>]*>\d+<\/td>)+)<\/tr>/g)].map((m) => [
    m[1],
    [...m[2].matchAll(/>(\d+)</g)].map((x) => Number(x[1])),
  ]);
  assert.deepEqual(rows, [
    ["Bought, now at a loss", [35, 34, 33, 32]],
    ["Bought, up at most 50%", [36, 35, 34, 33]],
    ["Bought, up 200% to 500%", [40, 39, 38, 37]],
    ["Received (airdrop, prizes)", [39, 38, 37, 36]],
  ]);
  // The chain's pass mark, if it differed, would move every need.
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.match(draw("need", { "CabalGate.PASS_MARK": 70n }), /Need 70 − 31 = 39\./);
  } finally {
    console.warn = warn;
  }
});

test("ring: 30 seats, 17 of them ticked; objection-window: the 7-minute sale inside the 20 minutes", () => {
  const ring = draw("ring");
  assert.equal((ring.match(/fill:var\(--approved\)/g) || []).length, 17 + 1); // the seats, and the key's
  assert.equal((ring.match(/stroke-dasharray:5 3/g) || []).length, 30 - 17 + 1);
  const obj = draw("objection-window");
  assert.match(obj, /<span class="dg-time__fill" style="width:35%;background:var\(--executed\)">/);
  assert.match(obj, /<span class="dg-time__fill" style="width:100%;background:var\(--objection\)">/);
  for (const s of ["SUSTAINED", "OVERRULED", "VOID"]) assert.match(obj, new RegExp(`stamp--objection stamp--sm">${s}<`));
});
