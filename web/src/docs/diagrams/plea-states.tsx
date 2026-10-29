/** Diagram "plea-states" (docs/03-plead.md): every state of a plea, each drawn as the site's stamp.
 * PENDING, then APPROVED (score >= need), DENIED or NO VERDICT; an approval ends SOLD or LAPSED, a
 * denial may be appealed once (the appeal ends OVERTURNED or UPHELD). CabalGate.sol: Status enum
 * :29-37, onOracleResult :554-564, _sell :620 (EXECUTE_WINDOW), _clearStale :492-496 (a lapse, its
 * cooldown from the approval), _appeal :379 (COOLDOWN), expire :514-521 (PENDING_EXPIRY, no
 * cooldown), _requireCanPlead :469-476. Every number is numbers.json's. */
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Arrow, Band, Figure, Lane, Lanes, Node } from "../dg";

export default function PleaStates() {
  const n = useNumbers(),
    t = n.text;
  const words = {
    pending: `The Cabal reads your plea. A verdict can come for up to ${t("pending_expiry")}.`,
    approved: `Your score is at least your need. Sell it all, in one go, within ${t("sell_window")}.`,
    sold: "You sold in time.",
    lapsed: "The window passed with no sale. Nothing was sold; the points still count.",
    denied: `Your score is below your need. You may appeal once within ${t("appeal_window")}: a new plea, judged on its own text.`,
    overturned: "The appeal is approved: sell within the window.",
    upheld: "The appeal is denied too. No further appeal.",
    none: `No verdict within ${t("pending_expiry")}. Anyone may close the plea. The fee is spent.`,
    cooldown: `After a sale, a denial or a lapse, your next plea waits ${t("cooldown")}. After no verdict, it need not wait.`,
  };
  const alt =
    `The states of a plea, each a stamp. PENDING: ${words.pending} Then one of three. ` +
    `APPROVED: ${words.approved} It ends SOLD (${words.sold}) or LAPSED (${words.lapsed}) ` +
    `DENIED: ${words.denied} The appeal ends OVERTURNED (${words.overturned}) or UPHELD (${words.upheld}) ` +
    `NO VERDICT: ${words.none} Cooldown: ${words.cooldown}`;
  return (
    <Figure title="A plea's states, as the site stamps them" alt={alt}>
      <Node title="Sent">
        <Stamp state="PENDING" size="sm" />
        <span className="dg-node__text">{words.pending}</span>
      </Node>
      <Arrow down />
      <Lanes n={3}>
        <Lane>
          <Stamp state="APPROVED" sub="score ≥ need" />
          <p className="small">{words.approved}</p>
          <p className="small strong">Then it ends:</p>
          <p className="dg-then">
            <Stamp state="SOLD" size="sm" />
            <span>{words.sold}</span>
          </p>
          <p className="dg-then">
            <Stamp state="LAPSED" size="sm" />
            <span>{words.lapsed}</span>
          </p>
        </Lane>
        <Lane>
          <Stamp state="DENIED" sub="score < need" />
          <p className="small">{words.denied}</p>
          <p className="small strong">An appeal ends:</p>
          <p className="dg-then">
            <Stamp state="OVERTURNED" size="sm" />
            <span>{words.overturned}</span>
          </p>
          <p className="dg-then">
            <Stamp state="UPHELD" size="sm" />
            <span>{words.upheld}</span>
          </p>
        </Lane>
        <Lane>
          <Stamp state="NO VERDICT" sub="expired" />
          <p className="small">{words.none}</p>
        </Lane>
      </Lanes>
      <Band icon="timer">
        <b>Cooldown.</b> {words.cooldown}
      </Band>
    </Figure>
  );
}
