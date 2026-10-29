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
  { key: "fee_burn", label: "Burned", fill: "", of: "PLEA" },
] as const;
const W = 360,
  H = 64,
  BAR = { x: 1.5, y: 8, w: 357, h: 48 };

export default function FeeBar() {
  const n = useNumbers();
  const id = "fee-bar-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bps = PARTS.map((p) => n.value(p.key) ?? 0n);
  const total = bps.reduce((a, b) => a + b, 0n);
  const imd = bps.slice(0, 4).reduce((a, b) => a + b, 0n);
  const pct = (v: bigint) => formatValue("bps", v)!;
  // Each part's share of the bar's width, in the bar's own units.
  let x = BAR.x;
  const segs = PARTS.map((p, i) => {
    const w = total ? (BAR.w * Number(bps[i])) / Number(total) : BAR.w / PARTS.length;
    const seg = { ...p, x, w, n: i + 1, text: n.text(p.key) };
    x += w;
    return seg;
  });
  const hatch = `${id}-hatch`,
    clip = `${id}-clip`;
  const alt =
    `A bar for the ${pct(total)} fee every trade pays, in five numbered parts: ` +
    segs.map((s) => `${s.n}, ${s.label.toLowerCase()}: ${s.text} of the ${s.of}`).join("; ") +
    `. Parts 1 to 4 are ${pct(imd)} of the trade’s IMD; part 5 is ${segs[4].text} of its PLEA.`;
  return (
    <figure className="docs-figure panel stack stack--md">
      <figcaption className="docs-figure__title">
        The {pct(total)} fee on every trade: {pct(imd)} of its IMD in four parts, and {segs[4].text} of
        its PLEA, burned
      </figcaption>
      <svg className="docs-figure__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-alt`} style={{ maxWidth: 560 }}>
        <title id={`${id}-alt`}>{alt}</title>
        <defs>
          <pattern id={hatch} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" style={{ fill: "var(--noverdict)" }} />
            <line x1="0" y1="0" x2="0" y2="8" style={{ stroke: "var(--night)", strokeWidth: 3 }} />
          </pattern>
          <clipPath id={clip}>
            <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx="8" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          {segs.map((s) => (
            <rect key={s.key} x={s.x} y={BAR.y} width={s.w} height={BAR.h} style={{ fill: s.fill || `url(#${hatch})` }} />
          ))}
        </g>
        {segs.slice(1).map((s) => (
          <line key={s.key} x1={s.x} y1={BAR.y} x2={s.x} y2={BAR.y + BAR.h} style={{ stroke: "var(--line)", strokeWidth: 3 }} />
        ))}
        <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx="8" style={{ fill: "none", stroke: "var(--line)", strokeWidth: 3 }} />
        {segs.map((s) => (
          <g key={s.key}>
            <circle cx={s.x + s.w / 2} cy={BAR.y + BAR.h / 2} r="11" style={{ fill: "var(--day)", stroke: "var(--night)", strokeWidth: 2 }} />
            <text
              x={s.x + s.w / 2}
              y={BAR.y + BAR.h / 2}
              dy="0.35em"
              textAnchor="middle"
              style={{ fill: "var(--night)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14 }}
            >
              {s.n}
            </text>
          </g>
        ))}
      </svg>
      <Costs
        rows={[
          ...segs.map(
            (s): [ReactNode, ReactNode] => [
              <span className="docs-key-row">
                {/* The part's swatch, as drawn in the bar: its fill and its number. */}
                <svg className="docs-key" viewBox="0 0 28 28" aria-hidden="true">
                  <rect x="1" y="1" width="26" height="26" rx="4" style={{ fill: s.fill || `url(#${hatch})`, stroke: "var(--line)", strokeWidth: 2 }} />
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
        Once the Cabal is dead there are no more seasons: part 3 joins the pool too.
      </p>
    </figure>
  );
}
