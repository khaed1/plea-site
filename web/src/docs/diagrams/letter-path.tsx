/** Diagram "letter-path" (docs/07-letters.md): a letter's way through the Letterbox. The letter, the
 * fee sale (oracle fee + runner tip, bought with the writer's PLEA), the escrow of 20% of the PLEA,
 * the verdict, then either delivered (the sale's IMD to the writer, the tip to whoever delivered,
 * SELL for the writer) or settled (the PLEA and the tip back). Letterbox.sol: _read :204-216, _plead
 * :293-312 (LETTER_SHARE_BPS, feesFor :525-528, MAX_FEE_SHARE_BPS), _deliver :400-426 (TIP, no
 * auto-sell fee for a letter :415), _settle :435-455. Every number is numbers.json's. */
import { Fragment } from "react";
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Arrow, Band, Figure, Lane, Lanes, Node } from "../dg";

export default function LetterPath() {
  const n = useNumbers(),
    t = n.text;
  const steps = [
    {
      icon: "envelope-simple",
      title: "You send a letter",
      text: "Your plea as plain text, sent to the Letterbox from the wallet that holds your PLEA. No ETH.",
    },
    {
      icon: "coins",
      title: "Fees, paid in PLEA",
      text: `Some of your PLEA is sold for ${t("letter_fee")}: the ${t("oracle_fee")} oracle fee and a ${t("runner_tip")} tip. At most ${t("max_fee_share")} of your PLEA.`,
    },
    {
      icon: "hourglass",
      title: "Escrow",
      text: `${t("letter_share")} of your PLEA waits in the Letterbox while the Cabal judges the plea.`,
    },
  ];
  const delivered = `Within ${t("sell_window")}, anyone may deliver it: sell the escrow for you. The sale's IMD goes to you, and the ${t("runner_tip")} tip to whoever delivered. Send SELL and you deliver it yourself, and keep the tip.`;
  const settled = `Denied, no verdict, or approved but not delivered in time: anyone may settle it. Your PLEA and the ${t("runner_tip")} tip come back to you. The oracle fee is spent.`;
  const alt =
    "A letter's path. " +
    steps.map((s, i) => `${i + 1}, ${s.title}: ${s.text}`).join(" ") +
    ` Then one of two endings. Delivered, after APPROVED, ending SOLD: ${delivered} Settled, after DENIED, NO VERDICT or LAPSED: ${settled}`;
  return (
    <Figure title="A letter: fees in PLEA, escrow, then delivered or settled" alt={alt}>
      <div className="dg-flow">
        {steps.map((s, i) => (
          <Fragment key={s.title}>
            {i > 0 && <Arrow />}
            <Node icon={s.icon} title={s.title}>
              <span className="dg-node__text">{s.text}</span>
              {i === 2 && <Stamp state="PENDING" size="sm" />}
            </Node>
          </Fragment>
        ))}
      </div>
      <Arrow down />
      <Lanes n={2}>
        <Lane>
          <p className="dg-then">
            <Stamp state="APPROVED" size="sm" />
            <Stamp state="SOLD" size="sm" />
          </p>
          <p className="strong">Delivered</p>
          <p className="small">{delivered}</p>
        </Lane>
        <Lane>
          <p className="dg-then">
            <Stamp state="DENIED" size="sm" />
            <Stamp state="NO VERDICT" size="sm" />
            <Stamp state="LAPSED" size="sm" />
          </p>
          <p className="strong">Settled</p>
          <p className="small">{settled}</p>
        </Lane>
      </Lanes>
      <Band icon="envelope-simple">
        <b>Other letters.</b> APPEAL followed by a text appeals your latest denied plea. SELL delivers your approved
        letter. NAME followed by a name sets your display name.
      </Band>
    </Figure>
  );
}
