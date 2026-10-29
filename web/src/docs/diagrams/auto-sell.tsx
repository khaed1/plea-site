/** Diagram "auto-sell" (docs/08-auto-sell.md): the two ways to plead on the site, side by side. By
 * hand: the oracle fee in IMD, you sell within the window, nothing more (CabalGate.submitSell,
 * executeSell :597-603). The auto-sell box: the fees bought with PLEA, the amount in escrow, anyone
 * delivers within the window for the tip, AUTO_SELL_FEE from the sale to the season's prize pot,
 * every other ending returns the PLEA and the tip (Letterbox.plead :222-225, _plead :293-312,
 * _deliver :400-426, _settle :435-455). Every number is numbers.json's. */
import { Icon } from "../../components";
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Figure, Lane, Lanes } from "../dg";

export default function AutoSell() {
  const n = useNumbers(),
    t = n.text;
  const hand = [
    `You pay the ${t("oracle_fee")} oracle fee from your IMD.`,
    `Approved: you press Sell now within ${t("sell_window")}.`,
    "The sale is yours, with no extra fee.",
    "Miss the window and nothing is sold.",
  ];
  const auto = [
    `Some of your PLEA is sold for the fees: ${t("letter_fee")}, the oracle fee and a ${t("runner_tip")} tip. No IMD needed.`,
    "The amount you plead waits in escrow.",
    `Approved: anyone may sell it for you within ${t("sell_window")} and earn the tip. Press Sell yourself and you keep it.`,
    `From the sale, ${t("auto_sell_fee")} goes to the season's prize pot. The rest is yours.`,
    "Any other ending: your PLEA and the tip come back.",
  ];
  const alt =
    "Two ways to plead on the site, side by side. By hand: " +
    hand.join(" ") +
    " With the auto-sell box: " +
    auto.join(" ") +
    " Both are judged the same way, against the same need.";
  return (
    <Figure title="By hand, or with the auto-sell box" alt={alt}>
      <Lanes n={2}>
        <Lane>
          <p className="dg-node__head">
            <Icon name="hand-palm" />
            By hand
          </p>
          <ol>
            {hand.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
          <p className="dg-then">
            <Stamp state="APPROVED" size="sm" />
            <Icon name="arrow-right" />
            <Stamp state="SOLD" size="sm" />
            <span>by you</span>
          </p>
        </Lane>
        <Lane>
          <p className="dg-node__head">
            <Icon name="coins" />
            Sell automatically if approved
          </p>
          <ol>
            {auto.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
          <p className="dg-then">
            <Stamp state="APPROVED" size="sm" />
            <Icon name="arrow-right" />
            <Stamp state="SOLD" size="sm" />
            <span>by anyone</span>
          </p>
        </Lane>
      </Lanes>
      <p className="small text-2">Either way the same judges score the plea, against the same need.</p>
    </Figure>
  );
}
