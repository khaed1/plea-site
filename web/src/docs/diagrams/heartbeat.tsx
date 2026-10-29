/** Diagram "heartbeat" (docs/13-dead-man.md): the Cabal's pulse. The clock starts when trading
 * opens (CabalGate.begin: lastVerdictAt = startedAt), every signed verdict on a plea or an appeal,
 * approved or denied, sets lastVerdictAt to now (onOracleResult :557), a plea with no verdict sets
 * nothing (_expire, onPleaFailure), and the Cabal is alive while now < lastVerdictAt + DEADMAN
 * (cabalAlive :200-204); dead, it stays dead (a verdict needs a living Cabal, :537). The drawing:
 * a pulse line with a beat at each verdict and the flatline, and under it the time left, which
 * falls and jumps back at each beat. The hours of the beats are an example; the 33 hours are
 * numbers.json's (the chain's once it has answered). */
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Figure } from "../dg";

/** The example: hours after trading opens of three verdicts, and of a plea that got none. */
const BEATS = [
  { hour: 6, state: "DENIED" as const },
  { hour: 14, state: "APPROVED" as const },
  { hour: 30, state: "DENIED" as const },
];
const NO_VERDICT = 40;
const W = 1000,
  H = 1000;

export default function Heartbeat() {
  const n = useNumbers(),
    t = n.text;
  const dead = Number(n.value("deadman") ?? 0n) / 3600; // hours
  const last = BEATS[BEATS.length - 1].hour;
  const death = last + dead;
  const end = Math.ceil((death + 6) / 24) * 24; // the axis runs past the death, to a whole day
  const x = (h: number) => (h / end) * W;
  // The pulse: flat, a beat (up, down, back) at each verdict, then flat for good after the death.
  const base = H * 0.62;
  let pulse = `0,${base}`;
  for (const b of BEATS) {
    const c = x(b.hour);
    pulse += ` ${c - 14},${base} ${c - 6},${H * 0.08} ${c + 4},${H * 0.92} ${c + 12},${base}`;
  }
  pulse += ` ${W},${base}`;
  // The time left: falls from the full 33 hours, back to full at each verdict, zero at the death.
  const yLeft = (h: number) => H - (h / dead) * H * 0.9;
  let left = `0,${yLeft(dead)}`,
    from = 0;
  for (const b of BEATS) {
    left += ` ${x(b.hour)},${yLeft(dead - (b.hour - from))} ${x(b.hour)},${yLeft(dead)}`;
    from = b.hour;
  }
  left += ` ${x(death)},${yLeft(0)} ${W},${yLeft(0)}`;
  const marks = [
    { n: 1, hour: 0, text: `Trading opens. The clock starts with ${t("deadman")} to go.` },
    ...BEATS.map((b, i) => ({
      n: i + 2,
      hour: b.hour,
      stamp: b.state,
      text: `Hour ${b.hour}: a verdict, ${b.state.toLowerCase()}. Back to ${t("deadman")}.`,
    })),
    {
      n: BEATS.length + 2,
      hour: NO_VERDICT,
      stamp: "NO VERDICT" as const,
      text: `Hour ${NO_VERDICT}: a plea gets no verdict. Nothing changes; the clock keeps running.`,
    },
    {
      n: BEATS.length + 3,
      hour: death,
      text: `Hour ${death}: ${t("deadman")} since the last verdict. The Cabal is dead, for good.`,
    },
  ];
  const ticks = Array.from({ length: Math.floor(end / 24) + 1 }, (_, i) => i * 24);
  const alt =
    `The Cabal's pulse over ${end} hours after trading opens, with the time left before it dies under it. ` +
    marks.map((m) => `${m.n}, ${m.text}`).join(" ") +
    ` After that the line stays flat: no plea can be judged again, and PLEA trades freely.`;
  return (
    <Figure
      title={`Every verdict restarts the clock; after ${t("deadman")} without one, the Cabal dies`}
      alt={alt}
      after={
        <ol className="dg-beats">
          {marks.map((m) => (
            <li key={m.n}>
              <span className="dg-beat__n" aria-hidden="true">
                {m.n}
              </span>
              <span className="stack stack--sm">
                {"stamp" in m && m.stamp && (
                  <span>
                    <Stamp state={m.stamp} size="sm" />
                  </span>
                )}
                <span>{m.text}</span>
              </span>
            </li>
          ))}
        </ol>
      }
    >
      <div className="dg-chart">
        <span className="dg-chart__title">The pulse: a beat for each verdict</span>
        <div className="dg-chart__plot dg-beat__plot">
          <svg className="dg-chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <rect x={x(death)} y="0" width={W - x(death)} height={H} style={{ fill: "var(--paper-2)" }} />
            <polyline
              points={pulse}
              vectorEffect="non-scaling-stroke"
              style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round" }}
            />
          </svg>
          {marks.map((m) => (
            <span
              key={m.n}
              className={`dg-beat__key${m.n % 2 ? "" : " dg-beat__key--low"}`}
              style={{ left: `${x(m.hour) / 10}%` }}
            >
              {m.n}
            </span>
          ))}
          {/* From just after the last beat to the right edge, so a narrow figure wraps the label
              rather than lay it over that beat. */}
          <span className="dg-beat__dead" style={{ left: `calc(${x(last) / 10}% + 16px)` }}>
            Dead: flat for good
          </span>
        </div>
        <span className="dg-chart__title">Time left before the Cabal dies</span>
        <div className="dg-chart__plot dg-beat__left">
          <svg className="dg-chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <polygon points={`0,${H} ${left} ${W},${H}`} style={{ fill: "var(--pending)" }} />
            <polyline
              points={left}
              vectorEffect="non-scaling-stroke"
              style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 2 }}
            />
          </svg>
          <span className="dg-chart__y" style={{ top: `${yLeft(dead) / 10}%` }}>
            {Math.round(dead)} h
          </span>
          <span className="dg-chart__y" style={{ top: "100%" }}>
            0
          </span>
        </div>
        <div className="dg-chart__row">
          {ticks.map((h) => (
            <span
              key={h}
              className={`dg-chart__x${h === 0 ? " dg-chart__x--start" : h === end ? " dg-chart__x--end" : ""}`}
              style={{ left: `${x(h) / 10}%` }}
            >
              {h === end ? `${h} h` : h}
            </span>
          ))}
        </div>
        <span className="dg-chart__title">Hours after trading opens</span>
      </div>
    </Figure>
  );
}
