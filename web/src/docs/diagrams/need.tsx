/** Diagram "need" (docs/04-your-bar.md): the pass mark split into the four fact parts and the need
 * the judges must reach, for the brief's typical seller (a plea of at most 20% of PLEA received in
 * the airdrop, held a day since trading opened, flat price); the site's need meter for that need; and
 * a table of the need by day for four kinds of seller. CabalGate.sol _factScoreAt :269-298 (share
 * :270, held :300-305, profit :279-288, received :289-292, trend :294-297), need :433. Every number
 * is numbers.json's (the chain's once it has answered). */
import { useNumbers } from "../numbers-context";
import { Meter } from "../kit";
import { Figure } from "../dg";

const UNITS = 1000,
  HEIGHT = 48;

export default function Need() {
  const n = useNumbers(),
    t = n.text,
    v = (k: string) => Number(n.value(k) ?? 0n);
  const pass = v("pass_mark");
  const parts = [
    { key: "share", label: "Share sold", value: `at most ${t("share_band_top")}`, pts: v("fact_share_top"), fill: "var(--executed)" },
    { key: "held", label: "Held", value: `${t("held_day_1")} day since the open`, pts: v("held_points_1d"), fill: "var(--objection)" },
    { key: "profit", label: "Profit or loss", value: "received, not bought", pts: v("received_profit"), fill: "var(--approved)" },
    { key: "trend", label: "24-hour trend", value: "flat", pts: v("trend_flat"), fill: "var(--pending)" },
  ];
  const fact = parts.reduce((a, p) => a + p.pts, 0),
    need = pass - fact;
  let x = 0;
  const segs = [...parts, { key: "need", label: "Need", value: "the judges' part", pts: need, fill: "var(--card)" }].map((p) => {
    const w = (UNITS * p.pts) / pass;
    const s = { ...p, x, w };
    x += w;
    return s;
  });
  const sum = `${parts.map((p) => p.pts).join(" + ")} = ${fact}`;
  // Need by day: a plea of at most 20%, flat price; the profit points of four kinds of seller.
  const days = [
    { day: "0", held: v("held_points_0") },
    { day: t("held_day_1"), held: v("held_points_1d") },
    { day: t("held_day_3"), held: v("held_points_3d") },
    { day: t("held_day_7"), held: v("held_points_7d") },
  ];
  const sellers = [
    { who: "Bought, now at a loss", profit: v("profit_points_loss") },
    { who: `Bought, up at most ${t("profit_band_50")}`, profit: v("profit_points_50") },
    { who: `Bought, up ${t("profit_band_200")} to ${t("profit_band_500")}`, profit: v("profit_points_500") },
    { who: "Received (airdrop, prizes)", profit: v("received_profit") },
  ];
  const needOf = (held: number, profit: number) => pass - (v("fact_share_top") + held + profit + v("trend_flat"));
  const up = v("trend_up") - v("trend_flat"),
    down = v("trend_flat") - v("trend_down");
  const alt =
    `A bar for the pass mark, ${pass}, split into the four fact parts and the need. ` +
    parts.map((p) => `${p.label}, ${p.value}: ${p.pts}`).join("; ") +
    `. Fact score ${sum}. The rest of the bar is the need, ${pass} − ${fact} = ${need}: the judges' score, from 0 to ${t("max_score")}, must reach it.`;
  return (
    <Figure
      title={`Your need is the part of ${pass} your facts do not cover`}
      alt={alt}
      lead={
        <p className="small">
          A plea of at most {t("share_band_top")} of PLEA received in the airdrop, {t("held_day_1")} day after trading
          opened, with a flat price:
        </p>
      }
      after={
        <>
          <div className="facts">
            {parts.map((p) => (
              <div className="fact" key={p.key}>
                <span className="fact__label dg-key__row">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="1" y="1" width="22" height="22" rx="4" style={{ fill: p.fill, stroke: "var(--line)", strokeWidth: 2 }} />
                  </svg>
                  {p.label}
                </span>
                <b className="fact__value">{p.value}</b>
                <span className="fact__pts">+{p.pts}</span>
              </div>
            ))}
          </div>
          <p className="strong">
            Fact score {sum}. Need {pass} − {fact} = {need}.
          </p>
          <Meter fact={fact} />
          <div className="table-wrap" role="region" aria-label="Table: need by days held" tabIndex={0}>
            <table className="table">
              <caption className="dg-caption">
                Need by days held, for a plea of at most {t("share_band_top")} at a flat price
              </caption>
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>
                    Your PLEA
                  </th>
                  <th scope="colgroup" colSpan={days.length} className="r">
                    Days held
                  </th>
                </tr>
                <tr>
                  {days.map((d) => (
                    <th scope="col" className="r" key={d.day}>
                      {d.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.who}>
                    <th scope="row">{s.who}</th>
                    {days.map((d) => (
                      <td className="r strong" key={d.day}>
                        {needOf(d.held, s.profit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small text-2">
            Price up more than {t("trend_band")} in 24 hours: each need is {up} lower. Down more than {t("trend_band")}:{" "}
            {down} higher. On trading's first day there is no price from 24 hours before, so the trend counts{" "}
            {t("trend_flat")}. Received PLEA counts its days from the moment trading opened.
          </p>
        </>
      }
    >
      <div className="dg-need">
        <svg className="dg-need__svg" viewBox={`0 0 ${UNITS} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="dg-need-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" style={{ fill: "var(--card)" }} />
              <line x1="0" y1="0" x2="0" y2="8" style={{ stroke: "var(--line-soft)", strokeWidth: 4 }} />
            </pattern>
          </defs>
          {segs.map((s) => (
            <rect
              key={s.key}
              x={s.x}
              y="0"
              width={s.w}
              height={HEIGHT}
              style={{ fill: s.key === "need" ? "url(#dg-need-hatch)" : s.fill }}
            />
          ))}
          {segs.slice(1).map((s) => (
            <line
              key={s.key}
              x1={s.x}
              y1="0"
              x2={s.x}
              y2={HEIGHT}
              vectorEffect="non-scaling-stroke"
              style={{ stroke: "var(--line)", strokeWidth: s.key === "need" ? 6 : 2 }}
            />
          ))}
        </svg>
        {segs
          .filter((s) => s.w >= UNITS * 0.07)
          .map((s) => (
            <span key={s.key} className="dg-need__key" style={{ left: `${((s.x + s.w / 2) * 100) / UNITS}%` }}>
              {s.key === "need" ? `need ${s.pts}` : s.pts}
            </span>
          ))}
      </div>
      <div className="dg-chart__row">
        <span className="dg-chart__x dg-chart__x--start" style={{ left: 0 }}>
          0
        </span>
        <span className="dg-chart__x" style={{ left: `${(fact * 100) / pass}%` }}>
          fact {fact}
        </span>
        <span className="dg-chart__x dg-chart__x--end" style={{ left: "100%" }}>
          {pass}, the pass mark
        </span>
      </div>
    </Figure>
  );
}
