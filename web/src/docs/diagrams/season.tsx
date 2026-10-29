/** Diagram "season" (docs/10-seasons.md): one season. Its prize pot only grows while the season runs
 * (Seasons.checkpoint books the hook's PRIZE_BPS share of every trade, overruled stakes through
 * checkpointObjection and the Letterbox's AUTO_SELL_FEE to the running season), then CLOSE_GRACE
 * after it ends anyone calls closeSeason: the top TOP wallets with MIN_POINTS or more are paid
 * shareBps(rank) of the season's fees plus the rollover, and in the first BONUS_SEASONS seasons the
 * same shares of BONUS_PER_SEASON; unpaid IMD rolls over, unpaid bonus PLEA burns (Seasons.sol
 * :320-351, :437-460). Under it, the example page's leaderboard as the site draws it (.lb): best
 * three, the seat multiplier rounded down (pointsFor :133-135), points and prize. The pot's steps
 * are an illustration (no real trades); every rule's number is numbers.json's. */
import type { ReactNode } from "react";
import { Costs } from "../../components";
import { useNumbers } from "../numbers-context";
import { formatValue } from "../numbers";
import { Arrow, Figure, Node } from "../dg";

/** The illustration's pot: what the season before rolled over, then a step each day (no units). */
const ROLLOVER = 18;
const DAILY = [5, 7, 4, 9, 6, 8, 3, 7, 10, 6, 5, 8, 4, 7, 6];
const W = 1000,
  H = 1000;
/** The example page's season: a pot of 100 IMD, and the scores of three wallets (Example, step 1). */
const POT = 100n * 10n ** 18n;
const ROWS = [
  { name: "mira_eth", seat: true, scores: [38, 36, 35] },
  { name: "oath_keeper", seat: false, scores: [37, 36, 34] },
];
const OUT = { name: "fresh_start", rank: 11, scores: [33, 25] };

export default function Season() {
  const n = useNumbers(),
    t = n.text;
  const mult = Number(n.value("seat_multiplier") ?? 10000n),
    min = Number(n.value("min_points") ?? 0n),
    bonus = n.value("bonus_per_season") ?? 0n;
  // Seasons.shareBps(rank): the numbers file's list, "4.50, 4.46, …", in basis points.
  const shares = t("shares_list")
    .split(",")
    .map((x) => BigInt(Math.round(parseFloat(x) * 100)));
  const points = (score: number, seat: boolean) => (seat ? Math.floor((score * mult) / 10000) : score);
  const rows = ROWS.map((r, i) => {
    const pts = r.scores.map((s) => points(s, r.seat));
    const share = shares[i] ?? 0n;
    return {
      ...r,
      rank: i + 1,
      pts,
      total: pts.reduce((a, b) => a + b, 0),
      imd: formatValue("imd", (POT * share) / 10000n)!,
      plea: formatValue("plea", (bonus * share) / 10000n)!,
      share: formatValue("bps", share)!,
    };
  });
  const outTotal = OUT.scores.reduce((a, b) => a + b, 0);

  // The pot's steps across the season, and where its words sit.
  const total = ROLLOVER + DAILY.reduce((a, b) => a + b, 0);
  let level = ROLLOVER;
  const step = W / DAILY.length;
  const y = (v: number) => H - (v / total) * H * 0.92;
  let d = `M0,${H} L0,${y(level)}`;
  DAILY.forEach((inc, i) => {
    d += ` L${(i + 1) * step - step / 2},${y(level)}`;
    level += inc;
    d += ` L${(i + 1) * step - step / 2},${y(level)}`;
  });
  d += ` L${W},${y(level)} L${W},${H} Z`;
  const days = Number((n.value("season_length") ?? 0n) / 86400n);
  const ticks = [0, 1 / 3, 2 / 3, 1].map((f) => ({ f, day: Math.round(days * f) }));

  const feeders: [ReactNode, ReactNode][] = [
    ["Every trade, while the Cabal lives", <>{t("fee_prize")} of its IMD</>],
    ["Each overruled objection", <>its {t("objection_stake")} stake</>],
    ["Each auto-sell sale", t("auto_sell_fee")],
  ];
  const alt =
    `A season of ${t("season_length")}. Its prize pot starts with what the season before rolled over and only grows while the season runs: ` +
    `${t("fee_prize")} of every trade's IMD, ${t("objection_stake")} from each overruled objection and ${t("auto_sell_fee")} from each auto-sell sale. ` +
    `The steps are an illustration. When the season ends, ${t("close_grace")} later anyone may close it. The close pays the top ${t("top")} wallets with at least ${t("min_points")} points, ` +
    `${t("share_first")} of the pot to 1st down to ${t("share_last")} to ${t("top")}th, and in the first ${t("bonus_seasons")} seasons the same shares of ${t("bonus_per_season")}. ` +
    `Unpaid IMD rolls over to the next season; unpaid bonus PLEA is burned.`;
  return (
    <Figure
      title={`One season: the pot fills for ${t("season_length")}, then anyone closes it`}
      alt={alt}
      after={
        <div className="stack stack--sm">
          <p className="small text-2">
            The example below as the leaderboard shows it: a pot of {formatValue("imd", POT)} at the close, in a bonus
            season.
          </p>
          <div className="dg-lb">
            <ol className="lb" aria-label={`Example leaderboard, a pot of ${formatValue("imd", POT)}`}>
              <li className="lb__head" aria-hidden="true">
                <span className="lb__rank">Rank</span>
                <span className="lb__who">Player</span>
                <span className="lb__best">Best {t("best_count")}</span>
                <span className="lb__pts">Points</span>
                <span className="lb__prize">Prize</span>
              </li>
              {rows.map((r) => (
                <li className="lb__row" key={r.name}>
                  <span className="lb__rank">
                    <span className="sr-only">Rank </span>
                    {r.rank}
                  </span>
                  <span className="lb__who">
                    {r.name}
                    {r.seat && <span className="badge badge--seat">SEAT {t("seat_multiplier")}</span>}
                  </span>
                  <span className="lb__best">
                    <span className="lb__label">Best {t("best_count")}</span> {r.pts.join(" · ")}{" "}
                    {r.seat && <span className="seatx nowrap">({r.scores.join("·")} {t("seat_multiplier")})</span>}
                  </span>
                  <span className="lb__pts">
                    <span className="lb__label">Points</span> {r.total}
                  </span>
                  <span className="lb__prize">
                    <span className="lb__label">Prize</span> <span className="nowrap">{r.imd}</span>{" "}
                    <span className="nowrap">+ {r.plea}</span> <span className="text-2 nowrap">({r.share})</span>
                  </span>
                </li>
              ))}
              <li className="lb__bar">
                {t("min_points")}-point line · below it no prize: the IMD share rolls over to the next season and the PLEA
                bonus share is burned
              </li>
              <li className="lb__row lb__row--out">
                <span className="lb__rank">
                  <span className="sr-only">Rank </span>
                  {OUT.rank}
                </span>
                <span className="lb__who">{OUT.name}</span>
                <span className="lb__best">
                  <span className="lb__label">Best {t("best_count")}</span> {OUT.scores.join(" · ")}
                </span>
                <span className="lb__pts">
                  <span className="lb__label">Points</span> {outTotal}
                </span>
                <span className="lb__prize">
                  <span className="lb__label">Prize</span> no prize{" "}
                  <span className="nowrap">
                    ({outTotal} of {min})
                  </span>
                </span>
              </li>
            </ol>
          </div>
        </div>
      }
    >
      <div className="dg-pot">
        <span className="dg-chart__title">The season's prize pot (an illustration: it only grows until the close)</span>
        <div className="dg-pot__plot">
          <svg className="dg-chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={d} vectorEffect="non-scaling-stroke" style={{ fill: "var(--pending)", stroke: "var(--ink)", strokeWidth: 2 }} />
            <rect x="0" y={y(ROLLOVER)} width={W} height={H - y(ROLLOVER)} style={{ fill: "var(--noverdict)" }} />
            <line x1="0" y1={y(ROLLOVER)} x2={W} y2={y(ROLLOVER)} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--ink)", strokeWidth: 2, strokeDasharray: "6 4" }} />
          </svg>
          <span className="dg-pot__tag dg-pot__tag--low">Rolled over from the season before</span>
          <span className="dg-pot__tag dg-pot__tag--high">Added this season</span>
        </div>
        <div className="dg-chart__row">
          {ticks.map((k) => (
            <span
              key={k.f}
              className={`dg-chart__x${k.f === 0 ? " dg-chart__x--start" : k.f === 1 ? " dg-chart__x--end" : ""}`}
              style={{ left: `${k.f * 100}%` }}
            >
              {k.f === 0 ? `Day ${k.day}` : k.day}
            </span>
          ))}
        </div>
        <Costs rows={feeders} />
      </div>
      <div className="dg-flow">
        <Node icon="clock" title="The season ends">
          <span className="dg-node__text">After {t("season_length")}, or when the Cabal dies. Pleas judged after it count in the next season.</span>
        </Node>
        <Arrow />
        <Node icon="hourglass" title={`${t("close_grace")} later`} wait>
          <span className="dg-node__text">Anyone may close it. Approvals still unrecorded can be listed in the close.</span>
        </Node>
        <Arrow />
        <Node icon="trophy" title="Paid">
          <span className="dg-node__text">
            Top {t("top")} with {t("min_points")}+ points: {t("share_first")} down to {t("share_last")}, plus the bonus in
            the first {t("bonus_seasons")} seasons. Unpaid IMD rolls over; unpaid PLEA burns.
          </span>
        </Node>
      </div>
    </Figure>
  );
}
