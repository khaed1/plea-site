/** Diagram "pool" (docs/12-pool.md): an illustration of eight days of trades, drawn with the hook's
 * own rules. Top: the PLEA the pool holds and the inventory cap. The cap starts at the PLEA seeded
 * and follows the pool's PLEA down, but never faster than (seeded − CAP_FLOOR) / CAP_DECAY_DAYS a
 * day (the allowance banks over time) and never up; a trade that leaves the pool above the cap is
 * trimmed: that slice of the liquidity is removed, its PLEA burned and its IMD kept for the wall,
 * and the price does not move (PleaHook._applyCap :789-827). Bottom: the price, and the highest a
 * rebalance may place the buy wall: the guard falls at once to a lower price and rises at most
 * WALL_GUARD_TICKS_PER_DAY ticks a day (1.0001 per tick; _updateWallGuard :1030-1055). The trades
 * are made up; every rule's number is numbers.json's (the chain's once it has answered). */
import { Costs, Icon } from "../../components";
import { useNumbers } from "../numbers-context";
import { Figure } from "../dg";

/** The illustration's trades: the pool's PLEA change every quarter day, in millions (buys take PLEA
 * out, approved sales bring some back). */
const STEPS_PER_DAY = 4;
const DELTAS = [
  -40, -35, -25, -20, -15, -15, -15, -15, -10, -10, 6, -16, -12, 6, -14, -10, -8, -6, -6, -5, 8, 4, -10, -6, -8, -6, -4,
  -6, 6, -10, -8, 5,
];
const W = 1000;

export default function Pool() {
  const n = useNumbers(),
    t = n.text;
  const seeded = Number((n.value("supply_pool") ?? 0n) / 10n ** 18n) / 1e6,
    floor = Number((n.value("cap_floor") ?? 0n) / 10n ** 18n) / 1e6,
    days = Number(n.value("cap_decay_days") ?? 1n),
    guardTicks = Number(n.value("wall_guard") ?? 0n);
  const rate = (seeded - floor) / days; // millions of PLEA a day
  const guardStep = Math.pow(1.0001, guardTicks / STEPS_PER_DAY); // the guard's most per quarter day

  // Walk the trades with the hook's rules.
  type Point = {
    day: number;
    held: number;
    cap: number;
    price: number;
    wall: number;
    trim: number;
  };
  const pts: Point[] = [];
  let held = seeded,
    cap = seeded,
    liquidity = seeded,
    guard = 1;
  const priceOf = (x: number, l: number) => (l / x) ** 2; // a multiple of the opening price
  pts.push({ day: 0, held, cap, price: 1, wall: 1, trim: 0 });
  DELTAS.forEach((delta, i) => {
    const day = (i + 1) / STEPS_PER_DAY;
    held += delta;
    let trim = 0;
    if (held > cap) {
      // The trim: the excess goes, with the same share of the liquidity; the price stays.
      trim = held - cap;
      liquidity *= cap / held;
      held = cap;
    } else {
      cap = Math.min(cap, Math.max(held, seeded - rate * day, floor));
    }
    const price = priceOf(held, liquidity);
    guard = price < guard ? price : Math.min(price, guard * guardStep);
    pts.push({ day, held, cap, price, wall: Math.min(price, guard), trim });
  });
  const last = pts[pts.length - 1];
  const span = DELTAS.length / STEPS_PER_DAY;
  const x = (day: number) => (day / span) * W;
  // Top panel: millions of PLEA, from just under the lowest to the seeded amount.
  const lo = Math.floor(Math.min(...pts.map((p) => p.held)) / 50) * 50 - 50;
  const yTop = (v: number) => W - ((v - lo) / (seeded - lo)) * W;
  // Bottom panel: the price as a multiple of the opening price, 0 to the next whole multiple.
  const hi = Math.ceil(Math.max(...pts.map((p) => p.price)));
  const yBot = (v: number) => W - (v / hi) * W;
  const line = (f: (p: Point) => number, y: (v: number) => number) =>
    pts.map((p) => `${x(p.day)},${y(f(p))}`).join(" ");
  const wallArea = `0,${W} ${line((p) => p.wall, yBot)} ${W},${W}`;
  const trims = pts.filter((p) => p.trim > 0);
  const caughtUp = pts.find((p) => p.day > 0 && p.cap === p.held && p.cap > seeded - rate * p.day + 1e-9);
  const mult = (v: number) => `×${v.toFixed(2).replace(/0$/, "")}`;
  const million = (v: number) => `${Math.round(v)}M`;
  const ticks = [0, 2, 4, 6, 8].filter((d) => d <= span);

  const alt =
    `An illustration of ${span} days of made-up trades under the pool's rules. Top: the PLEA the pool holds falls from ${t("supply_pool")} as people buy. ` +
    `The cap starts at the same amount and follows it down, but falls at most ${t("cap_decay_per_day")} a day, so for the first days it stays above the pool's PLEA` +
    (caughtUp ? ` and catches up on day ${Math.floor(caughtUp.day)}` : "") +
    `. After that, sales that push the pool above the cap are trimmed: the excess is burned (${trims.length} times here, on days ${[...new Set(trims.map((p) => Math.floor(p.day)))].join(", ")}). ` +
    `Bottom: the price rises as the pool's PLEA falls, to ${mult(last.price)} the opening price by day ${span}. The buy wall sits below it. Its top may rise at most ${t("wall_guard")} ticks, ${t("wall_guard_pct")}, a day, so it lags behind a fast rise: ${mult(last.wall)} by day ${span}. It would fall at once with the price.`;
  return (
    <Figure
      title="The cap follows the pool's PLEA down; the wall follows the price up, slowly"
      alt={alt}
      after={
        <Costs
          rows={[
            ["The cap falls at most", <>{t("cap_decay_per_day")} a day</>],
            ["The cap never falls below", t("cap_floor")],
            ["Trimmed when the pool holds more than the cap by", <>{t("min_trim")} or more</>],
            [
              "The wall's top rises at most",
              <>
                {t("wall_guard")} ticks ({t("wall_guard_pct")}) a day
              </>,
            ],
            [
              "A rebalance has work at",
              <>
                {t("wall_threshold")} kept, or {t("wall_min_fill")} bought by the wall
              </>,
            ],
          ]}
        />
      }
    >
      <p className="small text-2">An illustration: made-up trades, the real rules.</p>
      <div className="dg-chart">
        <span className="dg-chart__title">PLEA in the pool, in millions</span>
        <div className="dg-chart__plot">
          <svg className="dg-chart__svg" viewBox={`0 0 ${W} ${W}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={line((p) => p.held, yTop)}
              vectorEffect="non-scaling-stroke"
              style={{
                fill: "none",
                stroke: "var(--ink)",
                strokeWidth: 3,
                strokeLinejoin: "round",
              }}
            />
            <polyline
              points={line((p) => p.cap, yTop)}
              vectorEffect="non-scaling-stroke"
              style={{
                fill: "none",
                stroke: "var(--denied)",
                strokeWidth: 4,
                strokeDasharray: "10 6",
              }}
            />
          </svg>
          {/* One flame for trims in a row. */}
          {trims
            .filter((p) => !trims.some((q) => Math.abs(q.day - (p.day - 1 / STEPS_PER_DAY)) < 1e-9))
            .map((p) => (
              <span
                key={p.day}
                className="dg-pool__trim"
                style={{
                  left: `${x(p.day) / 10}%`,
                  top: `${yTop(p.cap) / 10}%`,
                }}
              >
                <Icon name="fire" />
              </span>
            ))}
          <span className="dg-chart__y" style={{ top: "0%" }}>
            {million(seeded)}
          </span>
          <span className="dg-chart__y" style={{ top: "100%" }}>
            {million(lo)}
          </span>
        </div>
        <div className="dg-chart__row">
          {ticks.map((d) => (
            <span
              key={d}
              className={`dg-chart__x${d === 0 ? " dg-chart__x--start" : d === span ? " dg-chart__x--end" : ""}`}
              style={{ left: `${x(d) / 10}%` }}
            >
              {d === 0 ? "Day 0" : d}
            </span>
          ))}
        </div>
        <div className="dg-key">
          <span className="dg-key__row">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="2" y1="12" x2="22" y2="12" style={{ stroke: "var(--ink)", strokeWidth: 3 }} />
            </svg>
            The PLEA the pool holds
          </span>
          <span className="dg-key__row">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line
                x1="1"
                y1="12"
                x2="23"
                y2="12"
                style={{
                  stroke: "var(--denied)",
                  strokeWidth: 4,
                  strokeDasharray: "6 3",
                }}
              />
            </svg>
            The cap: down only, at most {t("cap_decay_per_day")} a day
          </span>
          <span className="dg-key__row">
            <span className="dg-pool__trim dg-pool__trim--key">
              <Icon name="fire" />
            </span>
            A trim: a sale left the pool above the cap; the excess PLEA is burned
          </span>
        </div>
      </div>
      <div className="dg-chart">
        <span className="dg-chart__title">The price, as a multiple of the opening price</span>
        <div className="dg-chart__plot">
          <svg className="dg-chart__svg" viewBox={`0 0 ${W} ${W}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern
                id="dg-pool-hatch"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="10" height="10" style={{ fill: "var(--approved)" }} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  style={{
                    stroke: "var(--night)",
                    strokeWidth: 2,
                    strokeOpacity: 0.35,
                  }}
                />
              </pattern>
            </defs>
            <polygon points={wallArea} style={{ fill: "url(#dg-pool-hatch)" }} />
            <polyline
              points={line((p) => p.wall, yBot)}
              vectorEffect="non-scaling-stroke"
              style={{
                fill: "none",
                stroke: "var(--ink)",
                strokeWidth: 2,
                strokeDasharray: "8 5",
              }}
            />
            <polyline
              points={line((p) => p.price, yBot)}
              vectorEffect="non-scaling-stroke"
              style={{
                fill: "none",
                stroke: "var(--ink)",
                strokeWidth: 3,
                strokeLinejoin: "round",
              }}
            />
          </svg>
          <span className="dg-pot__tag dg-pool__walltag">The buy wall: IMD waiting to buy PLEA</span>
          <span className="dg-chart__y" style={{ top: "0%" }}>
            ×{hi}
          </span>
          <span className="dg-chart__y" style={{ top: `${yBot(1) / 10}%` }}>
            ×1
          </span>
          <span className="dg-chart__y" style={{ top: "100%" }}>
            0
          </span>
        </div>
        <div className="dg-chart__row">
          {ticks.map((d) => (
            <span
              key={d}
              className={`dg-chart__x${d === 0 ? " dg-chart__x--start" : d === span ? " dg-chart__x--end" : ""}`}
              style={{ left: `${x(d) / 10}%` }}
            >
              {d === 0 ? "Day 0" : d}
            </span>
          ))}
        </div>
        <div className="dg-key">
          <span className="dg-key__row">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="2" y1="12" x2="22" y2="12" style={{ stroke: "var(--ink)", strokeWidth: 3 }} />
            </svg>
            The price: {mult(last.price)} by day {span}
          </span>
          <span className="dg-key__row">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                style={{
                  fill: "url(#dg-pool-hatch)",
                  stroke: "var(--ink)",
                  strokeWidth: 2,
                  strokeDasharray: "4 3",
                }}
              />
            </svg>
            The wall's top: up at most {t("wall_guard_pct")} a day, {mult(last.wall)} by day {span}; down at once with
            the price
          </span>
        </div>
      </div>
    </Figure>
  );
}
