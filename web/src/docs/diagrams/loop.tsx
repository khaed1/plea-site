/** Diagram "loop" (docs/01-start-here.md): the whole loop on one line, buy, plead, judged, sell, with
 * the two other endings of a plea (denied: appeal or wait; no verdict: plead again) and the dead-man
 * under it all. CabalGate.sol: _plead/_ask (the oracle fee), onOracleResult (score >= need,
 * PANEL_SIZE / QUORUM), _sell (EXECUTE_WINDOW), _appeal (COOLDOWN), expire (PENDING_EXPIRY, no
 * cooldown), cabalAlive (DEADMAN, reset by a verdict). Every number is numbers.json's. */
import { Fragment } from "react";
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Arrow, Band, Figure, Lane, Lanes, Node } from "../dg";

export default function Loop() {
  const n = useNumbers(),
    t = n.text;
  const steps = [
    { title: "Buy", text: "Open to anyone. Each buy records what you paid and when." },
    { title: "Plead", text: `Write why you want to sell, and pay the ${t("oracle_fee")} oracle fee.`, stamp: "PENDING" as const },
    {
      title: "Judged",
      text: `${t("panel_size")} judges score it from 0 to ${t("max_score")}; ${t("quorum")} must agree. Your need or more: approved.`,
      stamp: "APPROVED" as const,
    },
    { title: "Sell", text: `Sell what you asked for, in one go, within ${t("sell_window")}.`, stamp: "SOLD" as const },
  ];
  const denied = `Appeal once within ${t("appeal_window")}. Or wait out the cooldown, ${t("cooldown")}, and plead again.`;
  const none = `No answer within ${t("pending_expiry")}. The fee is spent, and you may plead again at once.`;
  const dead = `Every verdict restarts its clock. After ${t("deadman")} without one, the Cabal dies for good: no more pleas, and PLEA trades freely.`;
  const alt =
    "The PLEA loop, left to right: " +
    steps.map((s, i) => `${i + 1}, ${s.title}: ${s.text}`).join(" ") +
    ` A plea can also end two other ways. Denied: ${denied} No verdict: ${none} Under it all, the dead-man: ${dead}`;
  return (
    <Figure title="Buy, plead, be judged, sell" alt={alt}>
      <div className="dg-flow">
        {steps.map((s, i) => (
          <Fragment key={s.title}>
            {i > 0 && <Arrow />}
            <Node n={i + 1} title={s.title}>
              <span className="dg-node__text">{s.text}</span>
              {s.stamp && <Stamp state={s.stamp} size="sm" />}
            </Node>
          </Fragment>
        ))}
      </div>
      <p className="small strong">Or the plea ends another way:</p>
      <Lanes n={2}>
        <Lane>
          <Stamp state="DENIED" size="sm" />
          <p className="small">{denied}</p>
        </Lane>
        <Lane>
          <Stamp state="NO VERDICT" size="sm" />
          <p className="small">{none}</p>
        </Lane>
      </Lanes>
      <Band icon="hourglass">
        <b>Under it all, the dead-man.</b> {dead}
      </Band>
    </Figure>
  );
}
