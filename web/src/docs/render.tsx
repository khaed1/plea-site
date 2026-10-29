/** The docs' Markdown tree (markdown.ts) as React elements, in the site's own components and classes:
 * headings with a link icon, the site's tables and notices, and the numbers and diagrams the
 * extensions name. No HTML strings anywhere: text is always text. */
import type { ComponentType, ReactNode } from "react";
import { Icon, Notice } from "../components";
import { docHref, headingElementId } from "./order";
import { docLink, plain, type Block, type Inline, type List } from "./markdown";

export type RenderContext = {
  /** The page's slug: heading links are #/docs/<slug>/<id>. */
  slug: string;
  /** What {{key}} prints; undefined for a key numbers.json lacks (an error: the build refuses it). */
  num: (key: string) => string | undefined;
  /** The diagrams by name (web/src/docs/diagrams/<name>.tsx's default export). */
  diagrams: Record<string, ComponentType>;
};
const CALLOUT = {
  note: { kind: "info", icon: "info", title: undefined },
  warn: { kind: "warn", icon: "warning", title: undefined },
  builders: { kind: "builders", icon: "seal-check", title: "For builders" },
} as const;

function numberText(key: string, ctx: RenderContext) {
  const text = ctx.num(key);
  if (text === undefined) throw Error(`The docs name an unknown number {{${key}}}.`);
  return text;
}
/** A link's words split before its last word: the last word (or last non-text part) goes with the icon. */
export function splitLast(nodes: Inline[]): { head: Inline[]; tail: Inline[] } {
  const last = nodes[nodes.length - 1];
  if (!last) return { head: [], tail: [] };
  if (last.t !== "text") return { head: nodes.slice(0, -1), tail: [last] };
  const m = /^([\s\S]*?)(\S+)$/.exec(last.v);
  if (!m) return { head: nodes, tail: [] };
  return {
    head: [...nodes.slice(0, -1), ...(m[1] ? [{ t: "text" as const, v: m[1] }] : [])],
    tail: [{ t: "text", v: m[2] }],
  };
}
export function inline(nodes: Inline[], ctx: RenderContext, key = "i"): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}.${i}`;
    switch (n.t) {
      case "text":
        return n.v;
      case "num": {
        const text = numberText(n.key, ctx);
        // A short number stays on one line ("0.5 IMD"); a sentence-long one wraps.
        return text.split(" ").length <= 3 ? (
          <span key={k} className="nowrap">
            {text}
          </span>
        ) : (
          text
        );
      }
      case "strong":
        return <strong key={k}>{inline(n.c, ctx, k)}</strong>;
      case "em":
        return <em key={k}>{inline(n.c, ctx, k)}</em>;
      case "code":
        return <code key={k}>{inline(n.c, ctx, k)}</code>;
      case "link": {
        const href = docLink(n.href);
        if (/^https?:\/\//.test(href)) {
          // The icon stays on the line of the link's last word: a phone would otherwise wrap it alone.
          const { head, tail } = splitLast(n.c);
          return (
            <a key={k} href={href} target="_blank" rel="noreferrer" className="docs-ext">
              {inline(head, ctx, k)}
              <span className="nowrap">
                {inline(tail, ctx, `${k}.t`)}
                <Icon name="arrow-square-out" />
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          );
        }
        return (
          <a key={k} href={href}>
            {inline(n.c, ctx, k)}
          </a>
        );
      }
    }
  });
}
function list(l: List, ctx: RenderContext, key: string): ReactNode {
  const items = l.items.map((it, i) => (
    <li key={i}>
      {inline(it.c, ctx, `${key}.${i}`)}
      {it.sub && list(it.sub, ctx, `${key}.${i}.s`)}
    </li>
  ));
  return l.ordered ? (
    <ol key={key} start={l.start === 1 ? undefined : l.start}>
      {items}
    </ol>
  ) : (
    <ul key={key}>{items}</ul>
  );
}
const ALIGN = { l: undefined, c: "c", r: "r" } as const;
export function blocks(list_: Block[], ctx: RenderContext, key = "b"): ReactNode[] {
  return list_.map((b, i) => {
    const k = `${key}.${i}`;
    switch (b.t) {
      case "h": {
        const content = inline(b.c, ctx, k);
        if (b.level === 1)
          return (
            <div key={k} className="page-title">
              <h1>{content}</h1>
            </div>
          );
        if (b.level === 4)
          return (
            <h4 key={k} id={headingElementId(b.id)} tabIndex={-1}>
              {content}
            </h4>
          );
        const H = b.level === 2 ? "h2" : "h3";
        const words = plain(b.c, (x) => numberText(x, ctx));
        // The heading is inline, so its link icon follows the last word when the heading wraps; the
        // word joiner keeps the icon on that word's line.
        return (
          <div key={k} className={`docs-h docs-h--${b.level}`}>
            <H id={headingElementId(b.id)} tabIndex={-1}>
              {content}
              {"\u2060"}
            </H>
            <a className="docs-anchor" href={docHref(ctx.slug, b.id)} aria-label={`Link to ${words}`}>
              <Icon name="link" />
            </a>
          </div>
        );
      }
      case "p":
        return <p key={k}>{inline(b.c, ctx, k)}</p>;
      case "list":
        return list(b, ctx, k);
      case "table": {
        const label = b.head.map((c) => plain(c, (x) => numberText(x, ctx))).join(", ");
        return (
          <div key={k} className="table-wrap docs-table" role="region" aria-label={`Table: ${label}`} tabIndex={0}>
            <table className="table">
              <thead>
                <tr>
                  {b.head.map((c, j) => (
                    <th key={j} scope="col" className={ALIGN[b.align[j] || "l"]}>
                      {inline(c, ctx, `${k}.h${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((c, j) => (
                      <td key={j} className={ALIGN[b.align[j] || "l"]}>
                        {inline(c, ctx, `${k}.${r}.${j}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case "quote":
        return (
          <blockquote key={k} className="docs-quote stack stack--sm">
            {blocks(b.c, ctx, k)}
          </blockquote>
        );
      case "pre":
        return (
          <pre key={k} className="docs-code">
            <code>{inline(b.c, ctx, k)}</code>
          </pre>
        );
      case "hr":
        return <hr key={k} />;
      case "diagram": {
        const D = ctx.diagrams[b.name];
        if (!D) throw Error(`The docs name an unknown diagram "${b.name}".`);
        return (
          <div key={k} className="docs-diagram">
            <D />
          </div>
        );
      }
      case "callout": {
        const c = CALLOUT[b.kind];
        const title = b.title ? inline(b.title, ctx, `${k}.t`) : c.title;
        return (
          <div key={k} className={`docs-callout docs-callout--${b.kind}`}>
            <Notice kind={c.kind} icon={c.icon} title={title}>
              <div className="stack stack--sm">{blocks(b.c, ctx, k)}</div>
            </Notice>
          </div>
        );
      }
    }
  });
}
/** A page's tree as elements. */
export function Markdown({ tree, ctx }: { tree: Block[]; ctx: RenderContext }) {
  return <>{blocks(tree, ctx)}</>;
}
