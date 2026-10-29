# Writing a docs page

The Docs section of the PLEA site (`#/docs`) is 18 Markdown files. The site renders them in its own
theme; GitHub shows the same files. This note is for whoever writes them.

## Files

- Each page is one file at the repository root: `docs/NN-slug.md`. The site serves it at
  `#/docs/<slug>`. `#/docs` alone is Start here.
- The sidebar order, slugs and titles are fixed in `web/src/docs/order.ts`:

  | File | Title |
  | --- | --- |
  | `01-start-here.md` | Start here |
  | `02-buying.md` | Buying |
  | `03-plead.md` | Selling: plead |
  | `04-your-bar.md` | Your bar |
  | `05-judges.md` | The judges |
  | `06-appeals.md` | Appeals |
  | `07-letters.md` | Letters |
  | `08-auto-sell.md` | The auto-sell box |
  | `09-objection.md` | Objection! |
  | `10-seasons.md` | Seasons and prizes |
  | `11-fees.md` | Fees |
  | `12-pool.md` | The pool: cap, burn and the buy wall |
  | `13-dead-man.md` | The dead-man |
  | `14-keepers.md` | Keepers |
  | `15-contracts.md` | Contracts and owner |
  | `16-audits.md` | Audits |
  | `17-risks.md` | Risks and FAQ |
  | `18-glossary.md` | Glossary |

- The first line of a file is `# <title>`, exactly as above. To rename or add a page, change
  `order.ts` and the file together (the build refuses a mismatch).
- `docs/imd-run9/` holds IMD's notes from the Sepolia run. It is not a page; leave it alone.

## The five parts

Every page has the same five parts, as `##` headings, in this order:

1. `## In short`: two or three plain sentences.
2. `## How it works`: numbered steps (`1.`, `2.`, …).
3. `## In a picture`: the page's one diagram (`::: diagram <name>`, below). You may rename this
   heading, or put the diagram inside How it works and drop the heading.
4. `## Example`: one worked example with real numbers. Show the arithmetic.
5. `## Good to know`: limits, what can go wrong, and the exact error a user would see, in plain
   words.

Then, if the page needs one, a `::: builders` box last (below).

Use `###` under a `##`, and `####` under a `###`. Never skip a level. Never use `#` again.

## Words

- Short sentences. Plain English. One idea per paragraph.
- No jargon on the first read. Contract and function names (`CabalGate`, `PASS_MARK()`) go only in
  the "For builders" box at the end of a page.
- Say "Ethereum" for the network. Never write the main network's nickname (the word "main" and the
  word "net" run together) and never the words "chain id" followed by the number one: the Sepolia
  build fails if its bundle contains either, and the docs are bundled into both builds. The build and
  the unit tests refuse both.
- The site is not an official IMD page. Never use IMD's diamond logo.
- Every statement must be true of the launched contracts (khaed1/plea at `42e0f85`, the branch IMD
  deployed for launch #2647; `src/`). Check it in the code before you write it.
- A real example from the Sepolia test runs is labelled "Sepolia test run 9 (test token, 5-hour
  seasons)". If its numbers used run 9's rules (pass mark 71), recompute with today's or say so.

## Numbers: `{{key}}`

Every number comes from `web/src/docs/numbers.json`, so one edit changes it everywhere. Write
`{{pass_mark}}` and the page prints `69`.

- An entry is `key -> { text, value, chain, format, source, what }`. The page prints `text`.
- `chain` names a contract constant the site reads at load (`"CabalGate.PASS_MARK"`). Once the chain
  has answered, the page prints the chain's value in the entry's `format` instead. If the chain ever
  disagrees with `value`, the chain wins and the browser console says so once.
- `format` is one of `int` (`69`), `imd` (`0.5 IMD`), `plea` (`2,500,000 PLEA`), `duration`
  (`7 minutes`, `33 hours`, `15 days`), `bps` (`0.25%`), `multiplier` (`×1.2`), or `text` (always the
  file's words, never the chain's).
- For an entry with `chain`, `format(value)` must equal `text` exactly (the unit tests check it). So
  a unit word that is not part of the format goes in the page: `{{max_plea_bytes}} bytes`.
- To add a number: add an entry with its `source` (`src/File.sol:line`) and `what`; bind it to the
  chain when the site reads that constant (an upper-case view with no inputs in `web/public/abi`).
- A worked example may print computed numbers. Each must follow from numbers.json and the contracts,
  with the sum shown: "Need = {{pass_mark}} − 34 = 35".
- A placeholder works anywhere: text, headings, lists, tables, code. An unknown key fails the build
  and the tests; a raw `{{…}}` never reaches the page.

## Diagrams: `::: diagram <name>`

A line `::: diagram fee-bar` draws the default export of `web/src/docs/diagrams/fee-bar.tsx`. To add
one, add a file there; the site finds it by itself. An unknown name fails the build and the tests.
`fee-bar.tsx` is the worked model. A diagram:

- reads its numbers with `useNumbers()` from `../numbers-context`: `text("oracle_fee")` is what
  `{{oracle_fee}}` prints, `value("oracle_fee")` the raw number (`500000000000000000n`) for its
  arithmetic. Never type a number into a diagram.
- is inline SVG with `role="img"` and a `<title>` that says everything the picture shows, or an
  element with `role="img"` and an `aria-label`. Repeat the key facts in visible words next to it.
- uses the site's tokens only: `style={{ fill: "var(--approved)", stroke: "var(--line)" }}`. Outlines
  in `--line`, text in `--ink`; on a state fill (`--approved`, `--denied`, `--pending`, `--executed`,
  `--objection`, `--noverdict`) use `--night` text, which stays dark in both themes. Check both
  themes.
- reads at 320 px. An SVG with a `viewBox` shrinks its text on a phone: keep words in HTML next to
  the drawing, or put them on top of a stretched bar (as fee-bar does).
- never uses colour alone: each part carries a number, a word or a pattern.
- reuses the site's look: `Costs`, `Notice`, `Icon` and `FactCells` from `../../components`, and
  `Stamp` and `Meter` from `../kit` (the verdict stamp and the need meter, drawn from the values you
  give). For other parts of the kit (`.lb` leaderboard rows, `.timeline`, `.countdown`, `.steps`,
  `.facts`) copy the markup of `plea/site-design/components.html` with its classes. Do not use the
  site's chain-reading components (components.tsx's `Stamp`, `Meter`): they read the live snapshot,
  which a docs page does not wait for.

## Callouts

```
::: note
A side remark.
:::

::: warn The fee is spent
The 0.5 IMD oracle fee is not refunded, whatever the verdict.
:::

::: builders
`CabalGate.PASS_MARK()` returns {{pass_mark}}.
:::
```

- `note` is a plain notice, `warn` the striped warning, `builders` a box titled "For builders".
- Text after the kind is the box's title (`::: warn The fee is spent`).
- A callout holds paragraphs, lists, code and diagrams, not headings or other callouts.

## Links

- Another docs page: `[your bar](04-your-bar.md)`, or a heading on it:
  `[the need](04-your-bar.md#how-it-works)`. These work on GitHub and on the site.
- A site page: `[Buy](#/buy)`, `[the Wall](#/wall)`.
- Outside: `https://…` only. It opens in a new tab with the site's external-link icon.
- The build refuses a link to a page or a heading that does not exist.

## Heading links

- Every heading has an id: its words in lower case, joined by hyphens ("Good to know" is
  `good-to-know`; a repeat gets `-2`). Fix one with `## Heading {#my-id}` so links survive a rename.
- A heading's address on the site is `#/docs/<slug>/<id>`, e.g. `#/docs/fees/example`. Opening it
  scrolls to the heading and moves the focus there. Every `##` and `###` shows a link icon ("Link to
  <heading>") with that address, and they make the page's "On this page" list.
- Ids are made from numbers.json's `text`, so a number in a heading keeps its link when the chain
  answers. Better: keep numbers out of headings.

## Markdown the site reads

`#` to `####` headings; paragraphs; `**bold**`, `*italic*` or `_italic_`; `` `code` ``; links;
`-` or `1.` lists, nested one level (indent the inner items two spaces or more); pipe tables with a
`| --- |` line under the head (`---:` right-aligns a column, `:---:` centres it); `>` quotes; code
blocks in ```` ``` ````; `---` rules; `<!-- comments -->` (hidden); `\` before `*`, `_` or `` ` `` to
print the mark itself.
Not read: images, HTML (it shows as text), `#####`, footnotes, lists nested deeper than one level.

## Check before you commit

```sh
npm --prefix web test                                # the docs' tests among them
npm --prefix web run build                           # lists every problem in the docs
PLEA_NETWORK=sepolia-run9 npm --prefix web run build # must pass too
npm --prefix web run build                           # the default again: dist/ is the Ethereum build
```

Then look at your page at 320 px and at 1280 px, in light and dark, and commit `dist/` with it.
