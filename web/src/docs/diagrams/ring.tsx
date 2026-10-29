/** Diagram "ring" (docs/05-judges.md): the Cabal's 30 seats, the least agreement that makes a verdict
 * (17 of them), and what follows. CabalGate.sol: PANEL_SIZE / QUORUM :124-125, onOracleResult
 * :545-554 (a signed answer from a panel of at least 30 with at least 17 agreed, else WrongPanel;
 * approved when score >= need), PENDING_EXPIRY :114 (no verdict). Every number is numbers.json's. */
import { useNumbers } from "../numbers-context";
import { Figure } from "../dg";

const C = 150,
  R = 118,
  SEAT = 9.5; // 30 seats on R = 118 sit 24.7 apart; 2 × (9.5 + 1.25 stroke) leaves a 3-unit gap

/** One seat: agreeing seats are filled and ticked; the rest are dashed rings with a dash. */
function Seat({ x, y, agrees }: { x: number; y: number; agrees: boolean }) {
  return agrees ? (
    <g>
      <circle cx={x} cy={y} r={SEAT} style={{ fill: "var(--approved)", stroke: "var(--line)", strokeWidth: 2.5 }} />
      <path
        d={`M${x - 5} ${y} l3.5 4 l7 -8`}
        style={{ fill: "none", stroke: "var(--night)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}
      />
    </g>
  ) : (
    <g>
      <circle
        cx={x}
        cy={y}
        r={SEAT}
        style={{ fill: "var(--card)", stroke: "var(--line)", strokeWidth: 2.5, strokeDasharray: "5 3" }}
      />
      <path d={`M${x - 4.5} ${y} h9`} style={{ stroke: "var(--ink)", strokeWidth: 2.5, strokeLinecap: "round" }} />
    </g>
  );
}

export default function Ring() {
  const n = useNumbers(),
    t = n.text;
  const seats = Number(n.value("panel_size") ?? 0n),
    quorum = Number(n.value("quorum") ?? 0n);
  const pos = Array.from({ length: seats }, (_, i) => {
    const a = (2 * Math.PI * i) / seats - Math.PI / 2;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a), agrees: i < quorum };
  });
  const lines = [
    `Each of the ${t("panel_size")} judges scores your plea from 0 to ${t("max_score")}.`,
    `When at least ${t("quorum")} agree on a score, the oracle signs it and sends it back. Your plea is approved if that score is at least your need, and denied if not.`,
    `With fewer in agreement there is no verdict: after ${t("pending_expiry")} anyone may close the plea, the fee is spent, and you may plead again at once.`,
  ];
  const alt =
    `A ring of ${t("panel_size")} seats, the Cabal. ${t("quorum")} seats are filled and ticked: they agree on the score, the least agreement that makes a verdict. The other ${seats - quorum} are dashed: another answer, or none. ` +
    lines.join(" ");
  return (
    <Figure title={`${t("panel_size")} judges, and ${t("quorum")} must agree`} alt={alt}>
      <div className="dg-ring">
        <svg className="dg-ring__svg" viewBox="0 0 300 300" aria-hidden="true">
          <circle cx={C} cy={C} r={R} style={{ fill: "none", stroke: "var(--line-soft)", strokeWidth: 2 }} />
          {pos.map((p, i) => (
            <Seat key={i} {...p} />
          ))}
          <text
            x={C}
            y={C - 8}
            textAnchor="middle"
            style={{ fill: "var(--ink)", fontFamily: "var(--font-display)", fontStretch: "125%", fontWeight: 800, fontSize: 64 }}
          >
            {t("quorum")}
          </text>
          <text x={C} y={C + 22} textAnchor="middle" style={{ fill: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 17 }}>
            of {t("panel_size")} must agree
          </text>
        </svg>
        <div className="dg-key">
          <p className="dg-key__row">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <Seat x={16} y={16} agrees />
            </svg>
            <span>Agrees on the score</span>
          </p>
          <p className="dg-key__row">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <Seat x={16} y={16} agrees={false} />
            </svg>
            <span>Another answer, or none</span>
          </p>
          {lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      </div>
    </Figure>
  );
}
