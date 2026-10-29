/** The Docs section (#/docs, #/docs/<slug>, #/docs/<slug>/<heading-id>): the sidebar of the 18 pages
 * with the search box, the page, "On this page", and Previous / Next. Static text: it shows at once,
 * before the chain has answered; on Ethereum a number bound to the chain changes to the chain's value when the
 * contracts' constants arrive (numbers.ts). Loaded as its own chunk (App.tsx). */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useApp } from "../context";
import { AddressView, Empty, Icon, Notice, Title } from "../components";
import { val } from "../chain";
import { site } from "../site";
import { DOCS, docHref, headingElementId, pageOf, prevNext } from "./order";
import { tocOf } from "./markdown";
import { numberWords } from "./numbers";
import { search, terms, type SearchEntry } from "./search";
import { Markdown } from "./render";
import { DIAGRAMS, INDEX, NUMBERS, PAGES } from "./pages";
import { NumbersProvider, readerFor } from "./numbers-context";

/** PLEA's eight contracts as Home's old Contracts list named them, for a test build's own list. */
const EIGHT = ["PLEA", "CabalGate", "Seasons", "PleaHook", "Letterbox", "Tribunal", "PleaDistributor", "PleaLaunch"];
/** A test build's own addresses, in its banner on Contracts and owner (RS1-L3): the page lists
 * Ethereum's, and Home's "Only one PLEA" notice and the footer's Contracts link point here. */
function SiteContracts() {
  const { r, s } = useApp(),
    owner = val(s, "PLEA.owner") as string | undefined;
  const rows: [string, string | undefined][] = [
    ...EIGHT.map((name): [string, string | undefined] => [name, r.addresses[name]]),
    ["The owner", owner],
    [s?.constants.pairSymbol || site().pairSymbol, r.addresses.PairToken],
  ];
  return (
    <>
      <p>This site’s own contracts on {site().chain}:</p>
      <dl className="addr-list">
        {rows.map(
          ([name, address]) =>
            address && (
              <div key={name}>
                <dt>{name}</dt>
                <dd>
                  <AddressView address={address} label={name.replace(/^The /, "the ")} />
                </dd>
              </div>
            ),
        )}
      </dl>
    </>
  );
}

export default function Docs({ slug, heading }: { slug?: string; heading?: string }) {
  const { statics, s } = useApp();
  // The docs describe PLEA on Ethereum (numbers.json). A test build (Sepolia run 9) has other
  // numbers on its chain, and the worked examples' sums follow the file's: it shows the file's
  // numbers, never its own chain's, and says so above each page.
  const test = site().testnet;
  const constants = test ? undefined : (statics ?? s?.constants);
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
          {page && test && (
            <Notice title="These docs describe PLEA on Ethereum">
              <p>
                This site is {site().name}, whose numbers differ (the pass mark, the holding points, the
                seasons' length, the opening). The docs show Ethereum's.
                {!site().pay &&
                  ` Pay with ETH or USDC is Ethereum only: here the Buy page pays with ${site().pairSymbol}.`}
              </p>
              {page.slug === "contracts" && <SiteContracts />}
            </Notice>
          )}
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
