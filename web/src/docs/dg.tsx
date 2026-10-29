/** Shared parts of the docs' flow diagrams (diagrams/loop, plea-states, appeal-window, letter-path,
 * auto-sell, objection-window): the figure, a step box, the arrow that points down on a phone and
 * across once the figure is wide, and the band that holds a rule for the whole drawing. Classes are
 * docs.css's dg-* section (tokens only). Not a diagram itself: it lives outside diagrams/ so the
 * site does not list it as one. */
import { useId, type CSSProperties, type ReactNode } from "react";
import { Icon } from "../components";

/** The figure every diagram sits in: a title (figcaption), then the drawing, which is one image
 * (role="img") named by `alt`, and then any words that repeat it for everyone (`after`). */
export function Figure({
  title,
  alt,
  children,
  lead,
  after,
}: {
  title: ReactNode;
  alt: string;
  children: ReactNode;
  /** Words before the drawing (what it shows). */
  lead?: ReactNode;
  after?: ReactNode;
}) {
  const id = "dg-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <figure className="docs-figure panel stack stack--md dg">
      <figcaption className="docs-figure__title">{title}</figcaption>
      {lead}
      <div className="dg-art" role="img" aria-labelledby={id}>
        <span id={id} className="sr-only">
          {alt}
        </span>
        {children}
      </div>
      {after}
    </figure>
  );
}
/** The arrow between two boxes: down on a phone, across once the figure is wide (or always down). */
export function Arrow({ down = false }: { down?: boolean }) {
  if (down)
    return (
      <span className="dg-arrow" aria-hidden="true">
        <Icon name="arrow-down" />
      </span>
    );
  return (
    <span className="dg-arrow" aria-hidden="true">
      <span className="dg-arrow__down">
        <Icon name="arrow-down" />
      </span>
      <span className="dg-arrow__across">
        <Icon name="arrow-right" />
      </span>
    </span>
  );
}
/** A step: its number (or an icon), its name, and what happens in it. */
export function Node({
  n,
  icon,
  title,
  children,
  wait = false,
}: {
  n?: number;
  icon?: string;
  title: ReactNode;
  children?: ReactNode;
  wait?: boolean;
}) {
  return (
    <div className={`dg-node${wait ? " dg-node--wait" : ""}`}>
      <span className="dg-node__head">
        {n !== undefined && <span className="dg-n">{n}</span>}
        {icon && <Icon name={icon} />}
        <span>{title}</span>
      </span>
      {children}
    </div>
  );
}
/** One way a step can end: its stamp first, then what follows. */
export function Lane({ children }: { children: ReactNode }) {
  return <div className="dg-lane">{children}</div>;
}
export function Lanes({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="dg-lanes" style={{ "--lanes": n } as CSSProperties}>
      {children}
    </div>
  );
}
/** A rule that holds for the whole drawing, in a band under it. */
export function Band({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="dg-band">
      <Icon name={icon} />
      <p>{children}</p>
    </div>
  );
}
/** "A → B" inside a box, the arrow drawn and spoken as "then". */
export function Then({ children }: { children: ReactNode }) {
  return <p className="dg-then">{children}</p>;
}
export function ThenArrow() {
  return <Icon name="arrow-right" />;
}
