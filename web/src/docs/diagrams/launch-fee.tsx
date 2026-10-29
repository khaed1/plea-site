/** Diagram "launch-fee" (docs/02-buying.md): the launch window. The extra buy fee falls in a straight
 * line from LAUNCH_EXTRA_BPS at the open to 0% at LAUNCH_WINDOW, rounded down to whole basis points
 * (PleaHook.sol launchExtraBps :311-317), on top of the usual IMD fee; and until the window ends one
 * buy may take at most LAUNCH_MAX_BUY from the pool (_checkMaxBuy :721-725). The chart stretches; its
 * words are HTML on top. The values every quarter hour are listed in words under it. */
import { Costs } from "../../components";
import { useNumbers } from "../numbers-context";
import { formatValue } from "../numbers";
import { Figure } from "../dg";

/** Points every sixth of the window (15 minutes of 90), and the chart runs one sixth past its end. */
const STEPS = 6;
const W = 1000;

export default function LaunchFee() {
  const n = useNumbers();
  const extra = n.value("launch_extra") ?? 0n,
    window = n.value("launch_window") ?? 1n,
    base = n.value("fee_imd") ?? 0n;
  const pct = (v: bigint) => formatValue("bps", v)!;
  const time = (s: bigint) => formatValue("duration", s)!;
  // PleaHook.launchExtraBps: LAUNCH_EXTRA_BPS * (LAUNCH_WINDOW - elapsed) / LAUNCH_WINDOW, rounded down.
  const at = (s: bigint) => (s >= window ? 0n : (extra * (window - s)) / window);
  const points = Array.from({ length: STEPS + 1 }, (_, i) => {
    const s = (window * BigInt(i)) / BigInt(STEPS);
    return { s, i, fee: at(s) };
  });
  const span = Number(window) * (STEPS + 1) / STEPS;
  const x = (s: bigint) => (Number(s) / span) * W;
  const y = (fee: bigint) => (extra ? W - (Number(fee) / Number(extra)) * W : W);
  const end = x(window);
  const minutes = (s: bigint) => String(Number(s) / 60);
  const alt =
    `A line chart of the launch fee over the launch window. It starts at ${pct(extra)} when trading opens and falls in a straight line to 0% at ${time(window)}, then stays at 0%. ` +
    points.map((p) => (p.i === 0 ? `At the open: ${pct(p.fee)}` : `after ${minutes(p.s)} minutes: ${pct(p.fee)}`)).join(", ") +
    `. It comes on top of the usual ${pct(base)} of the IMD that reaches the pool. Until ${time(window)} after the open, one buy may take at most ${n.text("launch_max_buy")} from the pool.`;
  return (
    <Figure
      title={`The launch fee: ${pct(extra)} at the open, 0% after ${time(window)}`}
      alt={alt}
      after={
        <>
          <Costs
            rows={points.map((p) => [
              p.i === 0 ? "At the open" : `${p.s >= window ? "From" : "After"} ${minutes(p.s)} minutes`,
              <>
                {pct(p.fee)} <span className="text-2">+ {pct(base)}</span>
              </>,
            ])}
          />
          <p className="small text-2">
            The launch fee is a share of the IMD that reaches the pool, on buys only, on top of the usual {pct(base)}. It
            stays in the pool, for the buy wall.
          </p>
        </>
      }
    >
      <div className="dg-chart">
        <span className="dg-chart__title">Launch fee, as a share of the IMD that reaches the pool</span>
        <div className="dg-chart__plot">
          <svg className="dg-chart__svg" viewBox={`0 0 ${W} ${W}`} preserveAspectRatio="none" aria-hidden="true">
            <polygon points={`0,${y(extra)} ${end},${W} 0,${W}`} style={{ fill: "var(--action-soft)" }} />
            {points.slice(1).map((p) => (
              <line
                key={p.i}
                x1={x(p.s)}
                y1="0"
                x2={x(p.s)}
                y2={W}
                vectorEffect="non-scaling-stroke"
                style={{ stroke: "var(--line-soft)", strokeWidth: 2, strokeDasharray: p.s === window ? undefined : "4 4" }}
              />
            ))}
            <polyline
              points={`0,${y(extra)} ${end},${W} ${W},${W}`}
              vectorEffect="non-scaling-stroke"
              style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round" }}
            />
          </svg>
          {points.map((p) => (
            <span key={p.i} className="dg-chart__dot" style={{ left: `${x(p.s) / 10}%`, top: `${y(p.fee) / 10}%` }} />
          ))}
          <span className="dg-chart__y" style={{ top: "0%" }}>
            {pct(extra)}
          </span>
          <span className="dg-chart__y" style={{ top: "50%" }}>
            {pct(extra / 2n)}
          </span>
          <span className="dg-chart__y" style={{ top: "100%" }}>
            0%
          </span>
        </div>
        <div className="dg-chart__row">
          {points.map((p) => (
            <span
              key={p.i}
              className={`dg-chart__x${p.i === 0 ? " dg-chart__x--start" : ""}`}
              style={{ left: `${x(p.s) / 10}%` }}
            >
              {minutes(p.s)}
            </span>
          ))}
          <span className="dg-chart__x dg-chart__x--end" style={{ left: "100%" }}>
            min
          </span>
        </div>
        <span className="dg-chart__title">Minutes after trading opens</span>
        <div className="dg-chart__row" style={{ width: `${end / 10}%` }}>
          <span className="dg-chart__span">
            Until minute {minutes(window)}: at most {n.text("launch_max_buy")} a buy
          </span>
        </div>
      </div>
    </Figure>
  );
}
