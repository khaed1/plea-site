/** Diagram "sale-gates" (docs/17-risks.md): while the Cabal lives, a sale passes three gates, and each
 * can stop it, then the cooldown; the dead-man under it all. CabalGate.sol: _checkAmount (MIN_SHARE_BPS, MAX_SHARE_BPS,
 * MAX_SELL), CannotPass before any fee (need above MAX_PLEA_SCORE), ORACLE_FEE spent whatever the
 * verdict, onOracleResult (PANEL_SIZE / QUORUM, score >= need), expire (PENDING_EXPIRY, no cooldown),
 * executeSell within EXECUTE_WINDOW, in one go (PartialFill, SlippageExceeded), COOLDOWN after a sale,
 * a denial or a lapse, cabalAlive (DEADMAN). Every number is numbers.json's. */
import { Fragment } from "react";
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Arrow, Band, Figure, Node } from "../dg";

type Gate = {
  title: string;
  text: string;
  /** What can stop the sale at this gate (none for the wait). */
  stops?: string;
  note?: string;
  /** The stamps of the endings that stop it. */
  stamps: ("DENIED" | "NO VERDICT" | "LAPSED")[];
};

export default function SaleGates() {
  const n = useNumbers(),
    t = n.text;
  const gates: Gate[] = [
    {
      title: "Plead",
      text: `Pay the ${t("oracle_fee")} oracle fee. Ask for at most ${t("max_share")} of your PLEA, never more than ${t("max_sell")}.`,
      stops: `A need above ${t("max_score")} is refused, before any fee.`,
      stamps: [],
    },
    {
      title: "Judged",
      text: `${t("quorum")} of ${t("panel_size")} judges must agree on a score at or above your need.`,
      stops: `Denied, or no verdict within ${t("pending_expiry")}. Either way the fee is spent.`,
      stamps: ["DENIED", "NO VERDICT"],
    },
    {
      title: "Sell",
      text: `The whole amount, in one go, within ${t("sell_window")}.`,
      stops: "The pool cannot fill it, or the price moved past your minimum: try again inside the window. Miss it and the approval lapses.",
      stamps: ["LAPSED"],
    },
    {
      title: "Wait",
      text: `After a sale, a denial or a lapse, the next plea waits ${t("cooldown")}.`,
      note: `A denied plea may appeal once in that time, for ${t("appeal_total")}.`,
      stamps: [],
    },
  ];
  const dead = `If no verdict comes for ${t("deadman")}, the Cabal dies for good, and everyone may sell at once, with no plea.`;
  const alt =
    "While the Cabal lives, a sale passes three gates, left to right, and each can stop it; then comes a wait. " +
    gates.map((g, i) => `${i + 1}, ${g.title}: ${g.text} ${g.stops ? `What can stop it: ${g.stops}` : g.note}`).join(" ") +
    ` Under it all, the dead-man: ${dead}`;
  return (
    <Figure title="While the Cabal lives: three gates to a sale, each able to stop it, then a wait" alt={alt}>
      <div className="dg-flow">
        {gates.map((g, i) => (
          <Fragment key={g.title}>
            {i > 0 && <Arrow />}
            <Node n={i + 1} title={g.title}>
              <span className="dg-node__text">{g.text}</span>
              {g.stops ? (
                <span className="dg-node__text">
                  <b>Can stop here:</b> {g.stops}
                </span>
              ) : (
                <span className="dg-node__text">{g.note}</span>
              )}
              {g.stamps.length > 0 && (
                <span className="cluster cluster--sm">
                  {g.stamps.map((s) => (
                    <Stamp key={s} state={s} size="sm" />
                  ))}
                </span>
              )}
            </Node>
          </Fragment>
        ))}
      </div>
      <Band icon="hourglass">
        <b>Under it all, the dead-man.</b> {dead}
      </Band>
    </Figure>
  );
}
