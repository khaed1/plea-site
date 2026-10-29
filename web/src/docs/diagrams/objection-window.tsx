/** Diagram "objection-window" (docs/09-objection.md): the 20 minutes after an approval on one clock,
 * with the 7-minute sell window inside it (never touched), and the three ways an objection ends.
 * Tribunal.sol: OBJECTION_WINDOW :127 (object :263), the fee and stake :130-131, a sustain when the
 * new score + MARGIN < need :330, the lowest score counts :335 (Seasons.record), PENDING_EXPIRY :129
 * (void, expire :361-368), settle :370-381 (the stake back, or to the plea's season pot). The sale:
 * CabalGate.EXECUTE_WINDOW. Every number is numbers.json's. */
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Figure, Lane, Lanes } from "../dg";

export default function ObjectionWindow() {
  const n = useNumbers(),
    t = n.text;
  const sell = Number(n.value("sell_window") ?? 0n),
    window = Number(n.value("objection_window") ?? 1n);
  const sellPct = Math.min(100, (sell * 100) / window);
  const outcomes = [
    {
      state: "SUSTAINED" as const,
      text: `The new score is more than ${t("objection_margin")} below the plea's need. The plea earns no season points, and the case is closed. The stake comes back.`,
    },
    {
      state: "OVERRULED" as const,
      text: `Any other score. The lower of the two scores counts as the plea's points. The stake goes to the plea's season prize pot.`,
    },
    {
      state: "VOID" as const,
      text: `No ruling within ${t("objection_expiry")} of the objection. The stake comes back; the fee is spent.`,
    },
  ];
  const bars = [
    {
      name: `Sell window: ${t("sell_window")}`,
      note: "The sale happens here as usual. An objection never touches it.",
      pct: sellPct,
      fill: "var(--executed)",
    },
    {
      name: `Objections open: ${t("objection_window")}`,
      note: `Anyone but the seller and the owner may object, for ${t("objection_total")}. The plea's points wait.`,
      pct: 100,
      fill: "var(--objection)",
    },
  ];
  const alt =
    `A clock of the ${t("objection_window")} after a plea is approved. ` +
    bars.map((b) => `${b.name}. ${b.note}`).join(" ") +
    " An objection ends one of three ways. " +
    outcomes.map((o) => `${o.state}: ${o.text}`).join(" ");
  return (
    <Figure title={`${t("objection_window")} to object, and three ways it ends`} alt={alt}>
      <div className="dg-time">
        {bars.map((b) => (
          <div className="dg-time__row" key={b.name}>
            <span className="dg-time__name">{b.name}</span>
            <div className="dg-time__track">
              <span className="dg-time__fill" style={{ width: `${b.pct}%`, background: b.fill }} />
            </div>
          </div>
        ))}
        <div className="dg-chart__row">
          <span className="dg-chart__x dg-chart__x--start" style={{ left: 0 }}>
            Approved
          </span>
          <span className="dg-chart__x" style={{ left: `${sellPct}%` }}>
            {Number(sell) / 60} min
          </span>
          <span className="dg-chart__x dg-chart__x--end" style={{ left: "100%" }}>
            {Number(window) / 60} min
          </span>
        </div>
        {bars.map((b) => (
          <p className="small text-2" key={b.name}>
            <b>{b.name.split(":")[0]}.</b> {b.note}
          </p>
        ))}
      </div>
      <Lanes n={3}>
        {outcomes.map((o) => (
          <Lane key={o.state}>
            <Stamp state={o.state} size="sm" />
            <p className="small">{o.text}</p>
          </Lane>
        ))}
      </Lanes>
    </Figure>
  );
}
