/** The docs' Markdown, parsed to a small tree that render.tsx turns into React elements (never
 * HTML strings). Pure: no React, no DOM, so the build (vite.config.ts) and the unit tests run the same
 * checks the site relies on. What it reads (web/src/docs/AUTHORING.md says it for writers):
 *
 * - `#` to `####` headings (one `#`, the page title, first); `## Heading {#id}` sets the link id
 * - paragraphs, **bold**, *italic* or _italic_, `code`, [links](…), `\` escapes
 * - `-` / `*` and `1.` lists, nested one level (indent the inner items by two spaces or more)
 * - pipe tables with a `|---|` line (`---:` right-aligns a column), `>` quotes, ``` fences, `---` rules
 * - `{{key}}`: a number from web/src/docs/numbers.json, anywhere (code too)
 * - `::: diagram <name>`: web/src/docs/diagrams/<name>.tsx
 * - `::: note`, `::: warn`, `::: builders` (an optional title after the kind) … `:::` callouts
 */
import { DOCS, headingElementId } from "./order.ts";

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "code"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "num"; key: string };
export type ListItem = { c: Inline[]; sub?: List };
export type List = { t: "list"; ordered: boolean; start: number; items: ListItem[] };
export type Align = "l" | "c" | "r";
export type CalloutKind = "note" | "warn" | "builders";
export type Block =
  | { t: "h"; level: 1 | 2 | 3 | 4; id: string; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | List
  | { t: "table"; align: Align[]; head: Inline[][]; rows: Inline[][][] }
  | { t: "quote"; c: Block[] }
  | { t: "pre"; lang: string; c: Inline[] }
  | { t: "hr" }
  | { t: "diagram"; name: string; line: number }
  | { t: "callout"; kind: CalloutKind; title?: Inline[]; c: Block[] };
export type Parsed = { blocks: Block[]; errors: string[] };
/** The words a placeholder prints in ids and the search index (numbers.json's `text`). */
export type NumberText = (key: string) => string | undefined;

/** "Selling: plead" -> "selling-plead"; ids are lower case, a-z 0-9 and single hyphens. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";

const ESCAPABLE = /[\\`*_{}\[\]()#+\-.!|>:~<]/;
/** Inline Markdown to nodes. */
export function parseInline(src: string, errors: string[] = []): Inline[] {
  const out: Inline[] = [];
  const text = (v: string) => {
    const last = out[out.length - 1];
    if (last?.t === "text") last.v += v;
    else if (v) out.push({ t: "text", v });
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length && ESCAPABLE.test(src[i + 1])) {
      text(src[i + 1]);
      i += 2;
      continue;
    }
    if (ch === "{" && src.startsWith("{{", i)) {
      const end = src.indexOf("}}", i + 2);
      if (end < 0) {
        errors.push(`an unclosed placeholder: "${src.slice(i, i + 24)}"`);
        text(src.slice(i));
        break;
      }
      out.push({ t: "num", key: src.slice(i + 2, end).trim() });
      i = end + 2;
      continue;
    }
    if (ch === "`") {
      let n = 1;
      while (src[i + n] === "`") n++;
      const fence = "`".repeat(n);
      const end = src.indexOf(fence, i + n);
      if (end > 0) {
        let body = src.slice(i + n, end);
        if (body.startsWith(" ") && body.endsWith(" ") && body.trim()) body = body.slice(1, -1);
        out.push({ t: "code", c: codeText(body, errors) });
        i = end + n;
        continue;
      }
      text(fence);
      i += n;
      continue;
    }
    if (ch === "*" && src[i + 1] === "*") {
      const end = closing(src, i + 2, "**");
      if (end > 0) {
        out.push({ t: "strong", c: parseInline(src.slice(i + 2, end), errors) });
        i = end + 2;
        continue;
      }
    }
    if ((ch === "*" || ch === "_") && src[i + 1] !== ch && opens(src, i)) {
      const end = closing(src, i + 1, ch);
      if (end > 0) {
        out.push({ t: "em", c: parseInline(src.slice(i + 1, end), errors) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "[") {
      const close = matchBracket(src, i);
      if (close > 0 && src[close + 1] === "(") {
        const end = src.indexOf(")", close + 2);
        if (end > 0) {
          out.push({
            t: "link",
            href: src.slice(close + 2, end).trim(),
            c: parseInline(src.slice(i + 1, close), errors),
          });
          i = end + 1;
          continue;
        }
      }
    }
    text(ch);
    i++;
  }
  return out;
}
/** Code keeps its text as written, but a placeholder still prints its number. */
function codeText(body: string, errors: string[]): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  while (i < body.length) {
    const at = body.indexOf("{{", i);
    if (at < 0) break;
    const end = body.indexOf("}}", at + 2);
    if (end < 0) {
      errors.push(`an unclosed placeholder: "${body.slice(at, at + 24)}"`);
      break;
    }
    if (at > i) out.push({ t: "text", v: body.slice(i, at) });
    out.push({ t: "num", key: body.slice(at + 2, end).trim() });
    i = end + 2;
  }
  if (i < body.length) out.push({ t: "text", v: body.slice(i) });
  return out;
}
const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);
/** An emphasis mark opens when the next character is not a space; `_` also needs no letter before it
 * (snake_case stays text). */
function opens(src: string, i: number) {
  if (isSpace(src[i + 1])) return false;
  return src[i] === "*" || !isWordChar(src[i - 1]);
}
/** The index of the mark that closes an emphasis started before `from`, or -1. */
function closing(src: string, from: number, mark: string) {
  let i = from;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > 0) {
        i = end + 1;
        continue;
      }
    }
    if (src.startsWith(mark, i) && i > from && !isSpace(src[i - 1])) {
      if (mark === "*" && src[i + 1] === "*") {
        i += 2;
        continue;
      }
      if (mark === "_" && isWordChar(src[i + 1])) {
        i++;
        continue;
      }
      return i;
    }
    i++;
  }
  return -1;
}
function matchBracket(src: string, i: number) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "\\") {
      j++;
      continue;
    }
    if (src[j] === "[") depth++;
    if (src[j] === "]" && --depth === 0) return j;
  }
  return -1;
}

const FENCE = /^```\s*([\w-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})\s*$/;
const DIRECTIVE = /^:::\s*(.*?)\s*$/;
const QUOTE = /^>\s?/;
const MARKER = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_RULE = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const isTableStart = (lines: string[], i: number) =>
  /^\s*\|/.test(lines[i]) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1].trim());
const startsBlock = (lines: string[], i: number) => {
  const l = lines[i];
  return (
    FENCE.test(l) ||
    HEADING.test(l) ||
    RULE.test(l) ||
    DIRECTIVE.test(l) ||
    QUOTE.test(l) ||
    isTableStart(lines, i) ||
    (MARKER.test(l) && MARKER.exec(l)![1].length < 2)
  );
};
/** Cells of a table row, split on `|` outside code and escapes. */
function cells(line: string) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const out: string[] = [];
  let cur = "",
    code = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (s[i] === "`") {
      code = !code;
      cur += "`";
    } else if (s[i] === "|" && !code) {
      out.push(cur.trim());
      cur = "";
    } else cur += s[i];
  }
  out.push(cur.trim());
  return out;
}

/** Parses a page (or a callout's or quote's body: `offset` is its first line's number - 1). */
export function parse(md: string, numberText: NumberText = (k) => k, offset = 0, ids = new Map<string, number>()): Parsed {
  // An HTML comment (a note for writers, hidden on GitHub too) is dropped, its lines kept blank.
  const lines = md
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ""))
    .split("\n");
  const blocks: Block[] = [];
  const errors: string[] = [];
  const err = (line: number, what: string) => errors.push(`line ${offset + line + 1}: ${what}`);
  const inline = (s: string, line: number) => {
    const e: string[] = [];
    const nodes = parseInline(s, e);
    for (const x of e) err(line, x);
    return nodes;
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = FENCE.exec(line))) {
      const start = i++;
      const body: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      if (i >= lines.length) err(start, "a code block (```) is never closed");
      i++;
      const e: string[] = [];
      blocks.push({ t: "pre", lang: m[1], c: codeText(body.join("\n"), e) });
      for (const x of e) err(start, x);
      continue;
    }
    if ((m = HEADING.exec(line))) {
      const level = m[1].length;
      let title = m[2],
        id = "";
      const custom = /\s*\{#([a-z0-9-]+)\}\s*$/.exec(title);
      if (custom) {
        id = custom[1];
        title = title.slice(0, custom.index);
      }
      if (level > 4) err(i, `a level-${level} heading: the docs use # to #### only`);
      const c = inline(title, i);
      id ||= slugify(plain(c, numberText));
      const seen = ids.get(id) || 0;
      ids.set(id, seen + 1);
      if (seen) id = `${id}-${seen + 1}`;
      blocks.push({ t: "h", level: Math.min(level, 4) as 1 | 2 | 3 | 4, id, c });
      i++;
      continue;
    }
    if (RULE.test(line)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }
    if ((m = DIRECTIVE.exec(line))) {
      const [kind, ...rest] = m[1].split(/\s+/);
      const arg = m[1].slice(kind.length).trim();
      if (kind === "diagram") {
        if (!/^[a-z0-9-]+$/.test(arg) || rest.length !== 1)
          err(i, `"::: diagram" needs one name in a-z, 0-9 and -: "${line.trim()}"`);
        blocks.push({ t: "diagram", name: arg, line: offset + i + 1 });
        i++;
        continue;
      }
      if (kind === "note" || kind === "warn" || kind === "builders") {
        const start = i++;
        const body: string[] = [];
        while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
          if (DIRECTIVE.exec(lines[i])?.[1] && !/^diagram\b/.test(DIRECTIVE.exec(lines[i])![1]))
            err(i, "a callout inside a callout: close the first with ::: before opening another");
          body.push(lines[i++]);
        }
        if (i >= lines.length) err(start, `"::: ${kind}" is never closed with a line of :::`);
        i++;
        const inner = parse(body.join("\n"), numberText, offset + start + 1, ids);
        errors.push(...inner.errors);
        blocks.push({ t: "callout", kind, title: arg ? inline(arg, start) : undefined, c: inner.blocks });
        continue;
      }
      err(i, kind ? `an unknown block "::: ${kind}" (use diagram, note, warn or builders)` : "a ::: that closes nothing");
      i++;
      continue;
    }
    if (QUOTE.test(line)) {
      const start = i;
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) body.push(lines[i++].replace(QUOTE, ""));
      const inner = parse(body.join("\n"), numberText, offset + start, ids);
      errors.push(...inner.errors);
      blocks.push({ t: "quote", c: inner.blocks });
      continue;
    }
    if (isTableStart(lines, i)) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c): Align =>
        c.endsWith(":") ? (c.startsWith(":") ? "c" : "r") : "l",
      );
      if (align.length !== head.length) err(i, "the table's --- line has a different number of columns from its head");
      const start = i;
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const row = cells(lines[i]);
        if (row.length !== head.length) err(i, `a table row with ${row.length} cells under a head of ${head.length}`);
        rows.push(row.map((c) => inline(c, i)));
        i++;
      }
      blocks.push({ t: "table", align, head: head.map((c) => inline(c, start)), rows });
      continue;
    }
    if ((m = MARKER.exec(line)) && m[1].length < 2) {
      const list = parseList(lines, i, inline, err);
      blocks.push(list.list);
      i = list.next;
      continue;
    }
    const start = i;
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && (i === start || !startsBlock(lines, i))) para.push(lines[i++].trim());
    blocks.push({ t: "p", c: inline(para.join(" "), start) });
  }
  return { blocks, errors };
}
const ordered = (marker: string) => /\d/.test(marker);
function parseList(
  lines: string[],
  from: number,
  inline: (s: string, line: number) => Inline[],
  err: (line: number, what: string) => void,
) {
  const first = MARKER.exec(lines[from])!;
  const list: List = { t: "list", ordered: ordered(first[2]), start: parseInt(first[2]) || 1, items: [] };
  let i = from,
    subIndent = -1;
  // The text of the item (or sub-item) lines are added to, joined with spaces at the end.
  let open: { item: ListItem; parts: string[]; line: number } | undefined;
  const pending: { item: ListItem; parts: string[]; line: number }[] = [];
  const close = () => {
    if (open) pending.push(open);
    open = undefined;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const next = j < lines.length ? MARKER.exec(lines[j]) : null;
      if (next && (next[1].length >= 2 ? list.items.length > 0 : ordered(next[2]) === list.ordered)) {
        i = j;
        continue;
      }
      break;
    }
    const m = MARKER.exec(line);
    if (m && m[1].length < 2) {
      if (ordered(m[2]) !== list.ordered) break;
      close();
      const item: ListItem = { c: [] };
      list.items.push(item);
      open = { item, parts: [m[3]], line: i };
      subIndent = -1;
      i++;
      continue;
    }
    if (m && list.items.length) {
      const parent = list.items[list.items.length - 1];
      if (subIndent < 0) subIndent = m[1].length;
      if (m[1].length > subIndent + 1) err(i, "a list nested more than one level: the docs nest lists one level only");
      if (!parent.sub) parent.sub = { t: "list", ordered: ordered(m[2]), start: parseInt(m[2]) || 1, items: [] };
      close();
      const item: ListItem = { c: [] };
      parent.sub.items.push(item);
      open = { item, parts: [m[3]], line: i };
      i++;
      continue;
    }
    if (m || startsBlock(lines, i)) break;
    if (open) open.parts.push(line.trim());
    i++;
  }
  close();
  for (const p of pending) p.item.c = inline(p.parts.join(" "), p.line);
  return { list, next: i };
}

/** The words of inline nodes, a placeholder as its number's text. */
export function plain(nodes: Inline[], numberText: NumberText = (k) => k): string {
  return nodes
    .map((n) => (n.t === "text" ? n.v : n.t === "num" ? (numberText(n.key) ?? n.key) : plain(n.c, numberText)))
    .join("");
}
/** Every block, callouts' and quotes' included, in document order. */
export function* walk(blocks: Block[]): Generator<Block> {
  for (const b of blocks) {
    yield b;
    if (b.t === "callout" || b.t === "quote") yield* walk(b.c);
  }
}
/** Every inline node list in the blocks (headings, paragraphs, items, cells, titles, code). */
export function* inlines(blocks: Block[]): Generator<Inline[]> {
  const deep = function* (nodes: Inline[]): Generator<Inline[]> {
    yield nodes;
    for (const n of nodes) if ("c" in n) yield* deep(n.c);
  };
  const items = function* (l: List): Generator<Inline[]> {
    for (const it of l.items) {
      yield* deep(it.c);
      if (it.sub) yield* items(it.sub);
    }
  };
  for (const b of walk(blocks)) {
    if (b.t === "h" || b.t === "p" || b.t === "pre") yield* deep(b.c);
    else if (b.t === "list") yield* items(b);
    else if (b.t === "table") for (const row of [b.head, ...b.rows]) for (const c of row) yield* deep(c);
    else if (b.t === "callout" && b.title) yield* deep(b.title);
  }
}
/** The page's h2 and h3, for "On this page". */
export const tocOf = (blocks: Block[], numberText?: NumberText) =>
  blocks
    .filter((b): b is Extract<Block, { t: "h" }> => b.t === "h" && (b.level === 2 || b.level === 3))
    .map((b) => ({ id: b.id, level: b.level, text: plain(b.c, numberText) }));

/** A doc link written as a file ("11-fees.md", "./11-fees.md#example") as the site's #/docs/… link;
 * other links as they are. */
export function docLink(href: string) {
  const m = /^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(href);
  return m ? `#/docs/${m[2]}${m[3] ? `/${m[3]}` : ""}` : href;
}
/** The word the docs never use: a testnet build fails on it (scripts/manifest.mjs). */
export const MAIN_NETWORK = /\bmain[ -]?net\b|chain[ -]?id:? ?1\b/i;

export type CheckInput = {
  /** numbers.json's keys ("_meta" is not one). */
  numbers: string[];
  /** web/src/docs/diagrams' file names without ".tsx". */
  diagrams: string[];
  numberText?: NumberText;
};
/** Everything wrong with one page: parse errors, the title, heading order, unknown placeholders and
 * diagrams, links to pages that do not exist, and the main network's nickname (MAIN_NETWORK). */
export function checkPage(md: string, title: string, input: CheckInput) {
  const { blocks, errors } = parse(md, input.numberText);
  const problems = [...errors];
  const heads = [...walk(blocks)].filter((b): b is Extract<Block, { t: "h" }> => b.t === "h");
  if (blocks[0]?.t !== "h" || blocks[0].level !== 1) problems.push(`the first line must be "# ${title}"`);
  else if (plain(blocks[0].c) !== title) problems.push(`the title is "${plain(blocks[0].c)}", the sidebar's is "${title}"`);
  if (heads.filter((h) => h.level === 1).length > 1) problems.push("more than one # title");
  for (let k = 1; k < heads.length; k++)
    if (heads[k].level > heads[k - 1].level + 1)
      problems.push(`"${plain(heads[k].c)}" is a level-${heads[k].level} heading under a level-${heads[k - 1].level} one`);
  for (const b of walk(blocks))
    if ((b.t === "callout" || b.t === "quote") && b.c.some((x) => x.t === "h"))
      problems.push("a heading inside a callout or quote");
  const known = new Set(input.numbers.filter((k) => k !== "_meta"));
  for (const nodes of inlines(blocks))
    for (const n of nodes) {
      if (n.t === "num" && !known.has(n.key)) problems.push(`an unknown number {{${n.key}}}: add it to web/src/docs/numbers.json`);
      if (n.t === "text" && /\{\{|\}\}/.test(n.v)) problems.push(`raw braces "${n.v.trim().slice(0, 30)}": a page never prints {{ or }}`);
      if (n.t === "link") {
        const href = docLink(n.href);
        if (href.startsWith("#/docs")) {
          const slug = href.split("/")[2];
          if (slug && !DOCS.some((p) => p.slug === slug)) problems.push(`a link to a docs page that does not exist: ${n.href}`);
        } else if (!/^(#\/|https:\/\/|mailto:)/.test(href))
          problems.push(`a link that is neither a site page (#/…), a docs file (NN-slug.md) nor https: ${n.href}`);
      }
    }
  for (const b of walk(blocks))
    if (b.t === "diagram" && !input.diagrams.includes(b.name))
      problems.push(`line ${b.line}: an unknown diagram "${b.name}": add web/src/docs/diagrams/${b.name}.tsx`);
  const word = md.match(MAIN_NETWORK);
  if (word) problems.push(`the word "${word[0]}": say "Ethereum" (a testnet build fails on it)`);
  return { blocks, problems };
}
/** Every page: the files must be the sidebar's 18 (docs/NN-slug.md, in order), each passing
 * checkPage, and a heading link (#/docs/<slug>/<id>) must name a heading on that page.
 * `files` maps a file name ("11-fees.md") to its text. */
export function checkDocs(files: Record<string, string>, input: CheckInput) {
  const problems: string[] = [];
  const expected = DOCS.map((p) => `${p.n}-${p.slug}.md`);
  for (const f of Object.keys(files))
    if (!expected.includes(f)) problems.push(`docs/${f} is not in the sidebar (web/src/docs/order.ts)`);
  const pages = new Map<string, Block[]>();
  for (const p of DOCS) {
    const f = `${p.n}-${p.slug}.md`;
    if (!(f in files)) {
      problems.push(`docs/${f} is missing`);
      continue;
    }
    const r = checkPage(files[f], p.title, input);
    problems.push(...r.problems.map((x) => `docs/${f}: ${x}`));
    pages.set(p.slug, r.blocks);
  }
  for (const [slug, blocks] of pages)
    for (const nodes of inlines(blocks))
      for (const n of nodes) {
        if (n.t !== "link") continue;
        const [, , target, id] = docLink(n.href).split("/");
        if (docLink(n.href).startsWith("#/docs/") && id && pages.has(target)) {
          const ids = [...walk(pages.get(target)!)].flatMap((b) => (b.t === "h" ? [b.id] : []));
          if (!ids.includes(id)) problems.push(`docs/${DOCS.find((p) => p.slug === slug)!.n}-${slug}.md: a link to a heading that does not exist: ${n.href}`);
        }
      }
  return problems;
}
export { headingElementId };
