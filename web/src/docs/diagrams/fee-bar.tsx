/** Diagram "fee-bar" (docs/11-fees.md): the fee every trade pays, as one bar in five numbered parts,
 * with the parts listed in words under it (the site's cost list). Four parts are shares of the trade's
 * IMD, one of its PLEA (PleaHook.sol: CASHBACK_BPS 50 + OWNER_BPS 100 + PRIZE_BPS 25 + POOL_BPS 25 =
 * IMD_FEE_BPS 200, and PLEA_BURN_BPS 25; _payFees: the prize share joins the pool once the Cabal is
 * dead). Every number is numbers.json's (the chain's once it has answered). */
import { useId, type ReactNode } from "react";
import { Costs } from "../../components";
import { useNumbers } from "../numbers-context";
import { formatValue } from "../numbers";

const PARTS = [
  { key: "fee_cashback", label: "Back to you, as staked IMD", fill: "var(--approved)", of: "IMD" },
  { key: "fee_owner", label: "The owner", fill: "var(--objection)", of: "IMD" },
  { key: "fee_prize", label: "The season’s prize pot", fill: "var(--pending)", of: "IMD" },
  { key: "fee_pool", label: "The buy wall, kept in the pool", fill: "var(--executed)", of: "IMD" },
  { key: "fee_burn", label: "Burned", fill: "var(--noverdict)", of: "PLEA" },
] as const;
/** The bar's width in its own units: it stretches to the page's width (the numbers sit on top as
 * text, so they stay the same size on a phone and on a desktop). */
const UNITS = 1000,
  HEIGHT = 48;

export default function FeeBar() {
  const n = useNumbers();
  const id = "fee-bar-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bps = PARTS.map((p) => n.value(p.key) ?? 0n);
  const total = bps.reduce((a, b) => a + b, 0n);
  const imd = bps.slice(0, 4).reduce((a, b) => a + b, 0n);
  const pct = (v: bigint) => formatValue("bps", v)!;
  // Each part's share of the bar's width, in the bar's own units.
  let x = 0;
  const segs = PARTS.map((p, i) => {
    const w = total ? (UNITS * Number(bps[i])) / Number(total) : UNITS / PARTS.length;
    const seg = { ...p, x, w, n: i + 1, text: n.text(p.key) };
    x += w;
    return seg;
  });
  const alt =
    `A bar for the ${pct(total)} fee every trade pays, in five numbered parts: ` +
    segs.map((s) => `${s.n}, ${s.label[0].toLowerCase() + s.label.slice(1)}: ${s.text} of the ${s.of}`).join("; ") +
    `. Parts 1 to 4 are ${pct(imd)} of the trade’s IMD; part 5 is ${segs[4].text} of its PLEA.`;
  return (
    <figure className="docs-figure panel stack stack--md">
      <figcaption className="docs-figure__title">
        The {pct(total)} fee on every trade: {pct(imd)} of its IMD in four parts, and {segs[4].text} of
        its PLEA, burned
      </figcaption>
      <div className="docs-bar">
        <svg className="docs-bar__svg" viewBox={`0 0 ${UNITS} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-labelledby={`${id}-alt`}>
          <title id={`${id}-alt`}>{alt}</title>
          {segs.map((s) => (
            <rect key={s.key} x={s.x} y="0" width={s.w} height={HEIGHT} style={{ fill: s.fill }} />
          ))}
          {/* A double line between the four IMD parts and the PLEA part. */}
          {segs.slice(1).map((s) => (
            <line
              key={s.key}
              x1={s.x}
              y1="0"
              x2={s.x}
              y2={HEIGHT}
              vectorEffect="non-scaling-stroke"
              style={{ stroke: "var(--line)", strokeWidth: s.of === "PLEA" ? 8 : 3 }}
            />
          ))}
        </svg>
        {segs.map((s) => (
          <span key={s.key} className="docs-bar__key" style={{ left: `${((s.x + s.w / 2) * 100) / UNITS}%` }} aria-hidden="true">
            {s.n}
          </span>
        ))}
      </div>
      <Costs
        rows={[
          ...segs.map(
            (s): [ReactNode, ReactNode] => [
              <span className="docs-key-row">
                {/* The part's swatch, as drawn in the bar: its fill and its number. */}
                <svg className="docs-key" viewBox="0 0 28 28" aria-hidden="true">
                  <rect x="1" y="1" width="26" height="26" rx="4" style={{ fill: s.fill, stroke: "var(--line)", strokeWidth: 2 }} />
                  <circle cx="14" cy="14" r="9" style={{ fill: "var(--day)", stroke: "var(--night)", strokeWidth: 1.5 }} />
                  <text x="14" y="14" dy="0.35em" textAnchor="middle" style={{ fill: "var(--night)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 12 }}>
                    {s.n}
                  </text>
                </svg>
                <span>
                  <span className="sr-only">Part {s.n}: </span>
                  {s.label}
                </span>
              </span>,
              <>
                {s.text} <span className="text-2">of the {s.of}</span>
              </>,
            ],
          ),
          ["Every trade", pct(total), "total"],
        ]}
      />
      <p className="small text-2">
        Once the Cabal is dead there are no more seasons: part 3 goes to the buy wall too, like part 4.
      </p>
    </figure>
  );
}
