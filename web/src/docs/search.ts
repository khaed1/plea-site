/** The docs' search: a small index built in the browser from the parsed pages (no service). One entry
 * per section: a page's opening (before its first heading) and each heading with the text under it.
 * A result needs every word of the query (any case, any part of a word); a word in the heading counts
 * most, then in the page's title, then in the text. */
import { plain, docLink, type Block, type List, type NumberText } from "./markdown.ts";

export type SearchEntry = {
  slug: string;
  page: string;
  /** The heading's words; "" for the page's opening. */
  heading: string;
  /** The heading's id ("" for the opening): the result links to #/docs/<slug>/<id>. */
  id: string;
  text: string;
  order: number;
};
export type SearchResult = { entry: SearchEntry; href: string; snippet: string };

const listText = (l: List, n?: NumberText): string =>
  l.items.map((it) => plain(it.c, n) + (it.sub ? " " + listText(it.sub, n) : "")).join(" ");
function blockText(b: Block, n?: NumberText): string {
  switch (b.t) {
    case "p":
    case "pre":
      return plain(b.c, n);
    case "list":
      return listText(b, n);
    case "table":
      return [b.head, ...b.rows].map((r) => r.map((c) => plain(c, n)).join(" ")).join(" ");
    case "quote":
      return b.c.map((x) => blockText(x, n)).join(" ");
    case "callout":
      return [b.kind === "builders" ? "For builders" : "", b.title ? plain(b.title, n) : "", ...b.c.map((x) => blockText(x, n))].join(" ");
    default:
      return "";
  }
}
export function buildIndex(pages: { slug: string; title: string; blocks: Block[] }[], numberText?: NumberText) {
  const index: SearchEntry[] = [];
  for (const p of pages) {
    let cur: SearchEntry = { slug: p.slug, page: p.title, heading: "", id: "", text: "", order: index.length };
    const parts: string[] = [];
    const flush = () => {
      cur.text = parts.join(" ").replace(/\s+/g, " ").trim();
      if (cur.heading || cur.text) index.push({ ...cur, order: index.length });
      parts.length = 0;
    };
    for (const b of p.blocks) {
      if (b.t === "h" && b.level === 1) continue;
      if (b.t === "h") {
        flush();
        cur = { slug: p.slug, page: p.title, heading: plain(b.c, numberText), id: b.id, text: "", order: 0 };
        continue;
      }
      parts.push(blockText(b, numberText));
    }
    flush();
  }
  return index;
}
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
/** The query's words, lower case, accents dropped. */
export const terms = (query: string) => norm(query).split(/[^\p{L}\p{N}%.×-]+/u).filter((w) => w.length > 0);
const count = (hay: string, w: string) => {
  let n = 0,
    i = hay.indexOf(w);
  while (i >= 0 && n < 5) {
    n++;
    i = hay.indexOf(w, i + w.length);
  }
  return n;
};
/** The best `limit` sections for `query` (none under two characters). */
export function search(index: SearchEntry[], query: string, limit = 8): SearchResult[] {
  const words = terms(query);
  if (words.join("").length < 2) return [];
  const scored: { e: SearchEntry; score: number }[] = [];
  for (const e of index) {
    const heading = norm(e.heading),
      page = norm(e.page),
      text = norm(e.text);
    let score = 0;
    for (const w of words) {
      const s = (heading.includes(w) ? 10 : 0) + (page.includes(w) ? 5 : 0) + count(text, w);
      if (!s) {
        score = 0;
        break;
      }
      const whole = new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u");
      score += s + (whole.test(heading) || whole.test(text) ? 2 : 0);
    }
    if (score) scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.order - b.e.order);
  return scored.slice(0, limit).map(({ e }) => ({
    entry: e,
    href: docLink(`#/docs/${e.slug}${e.id ? `/${e.id}` : ""}`),
    snippet: snippet(e.text, words),
  }));
}
/** About 120 characters of `text` around the first word found, cut at spaces. */
export function snippet(text: string, words: string[], width = 120) {
  const lower = norm(text);
  const at = Math.min(...words.map((w) => lower.indexOf(w)).filter((i) => i >= 0), Infinity);
  if (text.length <= width) return text;
  let start = at === Infinity ? 0 : Math.max(0, at - Math.floor(width / 3));
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  let end = Math.min(text.length, start + width);
  if (end < text.length) end = text.lastIndexOf(" ", end) > start ? text.lastIndexOf(" ", end) : end;
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
