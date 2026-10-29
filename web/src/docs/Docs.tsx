/** The Docs section (#/docs, #/docs/<slug>, #/docs/<slug>/<heading-id>): the sidebar of the 18 pages
 * with the search box, the page, "On this page", and Previous / Next. Static text: it shows at once,
 * before the chain has answered; a number bound to the chain changes to the chain's value when the
 * contracts' constants arrive (numbers.ts). Loaded as its own chunk (App.tsx). */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useApp } from "../context";
import { Empty, Icon, Title } from "../components";
import { DOCS, docHref, headingElementId, pageOf, prevNext } from "./order";
import { tocOf } from "./markdown";
import { numberWords } from "./numbers";
import { search, terms, type SearchEntry } from "./search";
import { Markdown } from "./render";
import { DIAGRAMS, INDEX, NUMBERS, PAGES } from "./pages";
import { NumbersProvider, readerFor } from "./numbers-context";

export default function Docs({ slug, heading }: { slug?: string; heading?: string }) {
  const { statics, s } = useApp();
  const constants = statics ?? s?.constants;
  const num = useCallback((key: string) => numberWords(NUMBERS, key, constants), [constants]);
  const reader = useMemo(() => readerFor(constants), [constants]);
  const doc = pageOf(slug);
  const page = doc && PAGES.find((p) => p.slug === doc.slug);
  // A heading link scrolls to its heading and moves the focus there (the router leaves the scroll
  // alone for these links); a page link starts at the top (the router does that).
  useEffect(() => {
    if (!heading) return;
    const el = document.getElementById(headingElementId(heading));
    if (!el) return;
    el.scrollIntoView();
    el.focus({ preventScroll: true });
  }, [doc?.slug, heading]);
  const toc = useMemo(() => (page ? tocOf(page.blocks, num) : []), [page, num]);
  const { prev, next } = prevNext(doc?.slug || "");
  return (
    <NumbersProvider value={reader}>
      <div className="docs">
        <DocsSide current={doc?.slug} />
        <article className="docs__page">
          {page ? (
            <div className="docs-body">
              <Markdown tree={page.blocks} ctx={{ slug: page.slug, num, diagrams: DIAGRAMS }} />
            </div>
          ) : (
            <div className="stack stack--lg">
              <Title title="Page not found" />
              <Empty title={`No docs page at #/docs/${slug}`} action={{ href: "#/docs", label: "Start here" }}>
                Pick a page from the list, or search the docs.
              </Empty>
            </div>
          )}
          {page && (
            <nav className="docs-pager" aria-label="Previous and next page">
              {prev && (
                <a className="docs-pager__link" href={docHref(prev.slug)} rel="prev">
                  <span className="label">Previous</span>
                  <span className="docs-pager__title">
                    <span className="docs-pager__back">
                      <Icon name="arrow-right" />
                    </span>
                    {prev.title}
                  </span>
                </a>
              )}
              {next && (
                <a className="docs-pager__link docs-pager__link--next" href={docHref(next.slug)} rel="next">
                  <span className="label">Next</span>
                  <span className="docs-pager__title">
                    {next.title}
                    <Icon name="arrow-right" />
                  </span>
                </a>
              )}
            </nav>
          )}
        </article>
        {page && toc.length > 0 && (
          <nav className="docs__toc" aria-label="On this page">
            <p className="label">On this page</p>
            <ul>
              {toc.map((h) => (
                <li key={h.id} className={h.level === 3 ? "docs__toc-sub" : undefined}>
                  <a href={docHref(page.slug, h.id)} aria-current={h.id === heading ? "location" : undefined}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </NumbersProvider>
  );
}

/** The sidebar: search, then the pages. On phones the pages fold into a menu button. */
function DocsSide({ current }: { current?: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [current]);
  const at = DOCS.findIndex((p) => p.slug === current);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open && document.getElementById("docs-pages")?.contains(document.activeElement)) {
      setOpen(false);
      toggle.current?.focus();
    } else if (e.key === "Escape" && open && document.activeElement === toggle.current) setOpen(false);
  };
  return (
    <div className="docs__side" onKeyDown={onKey}>
      <DocsSearch />
      <button
        ref={toggle}
        type="button"
        className="docs__toggle"
        aria-expanded={open}
        aria-controls="docs-pages"
        onClick={() => setOpen(!open)}
      >
        <Icon name={open ? "x" : "list"} />
        <span className="docs__toggle-text">
          <span className="strong">Docs pages</span>
          {at >= 0 && (
            <span className="meta">
              {at + 1} of {DOCS.length}: {DOCS[at].title}
            </span>
          )}
        </span>
      </button>
      <nav id="docs-pages" className={`docs-nav${open ? " is-open" : ""}`} aria-label="Docs pages">
        <ol>
          {DOCS.map((p) => (
            <li key={p.slug}>
              <a href={docHref(p.slug)} aria-current={p.slug === current ? "page" : undefined}>
                {p.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

/** "Search the docs": results under the box as links (page and heading), updated as you type.
 * Down and Up move between the box and the results, Enter opens the first result, Escape clears. */
function DocsSearch() {
  const [query, setQuery] = useState("");
  const box = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const SHOWN = 8;
  const all = useMemo(() => search(INDEX, query, Infinity), [query]);
  const results = all.slice(0, SHOWN);
  const active = terms(query).join("").length >= 2;
  useEffect(() => {
    const clear = () => setQuery("");
    window.addEventListener("hashchange", clear);
    return () => window.removeEventListener("hashchange", clear);
  }, []);
  const links = () => [...(list.current?.querySelectorAll<HTMLAnchorElement>("a") || [])];
  const move = (e: KeyboardEvent, from: number) => {
    const all = links();
    if (e.key === "ArrowDown" && all.length) {
      e.preventDefault();
      all[Math.min(from + 1, all.length - 1)].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (from <= 0) box.current?.focus();
      else all[from - 1].focus();
    } else if (e.key === "Escape" && query) {
      e.preventDefault();
      e.stopPropagation();
      setQuery("");
      box.current?.focus();
    }
  };
  return (
    <form
      role="search"
      className="docs-search"
      onSubmit={(e) => {
        e.preventDefault();
        if (results[0]) location.hash = results[0].href;
      }}
    >
      <label className="sr-only" htmlFor="docs-q">
        Search the docs
      </label>
      <div className="input input--text">
        <Icon name="magnifying-glass" />
        <input
          ref={box}
          id="docs-q"
          className="input__control"
          type="search"
          placeholder="Search the docs"
          autoComplete="off"
          spellCheck={false}
          value={query}
          aria-describedby="docs-q-count"
          aria-controls={active && results.length ? "docs-results" : undefined}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => move(e, -1)}
        />
      </div>
      <p id="docs-q-count" className="sr-only" aria-live="polite">
        {active
          ? `${all.length || "No"} result${all.length === 1 ? "" : "s"}${all.length > SHOWN ? `, the first ${SHOWN} shown` : ""}`
          : ""}
      </p>
      {active &&
        (results.length ? (
          <ul ref={list} id="docs-results" className="docs-results" aria-label="Search results">
            {results.map((r, i) => (
              <li key={r.href}>
                <a href={r.href} onKeyDown={(e) => move(e, i)}>
                  <span className="docs-results__where">
                    <Where entry={r.entry} />
                  </span>
                  {r.snippet && (
                    <span className="docs-results__text">
                      <Marked text={r.snippet} query={query} />
                    </span>
                  )}
                </a>
              </li>
            ))}
            {all.length > SHOWN && (
              <li className="small text-2 docs-results__more" aria-hidden="true">
                {all.length} sections match; the first {SHOWN} are shown. Add a word to narrow it.
              </li>
            )}
          </ul>
        ) : (
          <p className="small text-2 docs-results__none">No section mentions “{query.trim()}”.</p>
        ))}
    </form>
  );
}
const Where = ({ entry }: { entry: SearchEntry }) => (
  <>
    {entry.page}
    {entry.heading && (
      <>
        <span aria-hidden="true"> › </span>
        <span className="sr-only">, </span>
        {entry.heading}
      </>
    )}
  </>
);
/** The snippet with the query's words marked. */
function Marked({ text, query }: { text: string; query: string }) {
  const words = terms(query).filter((w) => w.length > 1);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}
