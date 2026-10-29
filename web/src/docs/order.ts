/** The docs' pages in sidebar order. Each is the Markdown file docs/<n>-<slug>.md at the repository
 * root, served at #/docs/<slug>; its first line is `# <title>`. The build (vite.config.ts) and the
 * unit tests check that the files match this list exactly. */
export type DocPage = { n: string; slug: string; title: string };
export const DOCS: DocPage[] = [
  { n: "01", slug: "start-here", title: "Start here" },
  { n: "02", slug: "buying", title: "Buying" },
  { n: "03", slug: "plead", title: "Selling: plead" },
  { n: "04", slug: "your-bar", title: "Your bar" },
  { n: "05", slug: "judges", title: "The judges" },
  { n: "06", slug: "appeals", title: "Appeals" },
  { n: "07", slug: "letters", title: "Letters" },
  { n: "08", slug: "auto-sell", title: "The auto-sell box" },
  { n: "09", slug: "objection", title: "Objection!" },
  { n: "10", slug: "seasons", title: "Seasons and prizes" },
  { n: "11", slug: "fees", title: "Fees" },
  { n: "12", slug: "pool", title: "The pool: cap, burn and the buy wall" },
  { n: "13", slug: "dead-man", title: "The dead-man" },
  { n: "14", slug: "keepers", title: "Keepers" },
  { n: "15", slug: "contracts", title: "Contracts and owner" },
  { n: "16", slug: "audits", title: "Audits" },
  { n: "17", slug: "risks", title: "Risks and FAQ" },
  { n: "18", slug: "glossary", title: "Glossary" },
];
/** The file name of a page: "11-fees.md". */
export const fileOf = (p: DocPage) => `${p.n}-${p.slug}.md`;
/** The page a #/docs path names: `#/docs` is the first page (Start here). */
export const pageOf = (slug: string | undefined) =>
  slug ? DOCS.find((p) => p.slug === slug) : DOCS[0];
/** The pages before and after `slug` in the sidebar, if any. */
export function prevNext(slug: string) {
  const i = DOCS.findIndex((p) => p.slug === slug);
  return {
    prev: i > 0 ? DOCS[i - 1] : undefined,
    next: i >= 0 && i < DOCS.length - 1 ? DOCS[i + 1] : undefined,
  };
}
/** A page's link, or a heading's on it: #/docs/<slug> or #/docs/<slug>/<heading-id>. */
export const docHref = (slug: string, heading?: string) =>
  `#/docs/${slug}${heading ? `/${heading}` : ""}`;
/** The element id of a heading whose link is #/docs/<slug>/<id>: prefixed, so a heading never takes
 * an id the site's own markup uses (main, drawer, how, contracts). */
export const headingElementId = (id: string) => `docs-${id}`;
