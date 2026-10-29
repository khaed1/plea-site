/** Diagram "appeal-window" (docs/06-appeals.md): a denial, the window it opens, the appeal and its
 * verdict, on the site's own timeline. CabalGate.sol: _appeal :371-393 (the original's seller, Denied,
 * not an appeal, within COOLDOWN of the denial, once, at most the original amount), _payAppeal
 * :396-401 (APPEAL_POOL_SHARE to the wall) and _ask (ORACLE_FEE), _expire :508 (an unanswered appeal
 * frees the slot), _question :717-731 (the judges see the denied plea, its score and its need).
 * Every number is numbers.json's. */
import type { ReactNode } from "react";
import { Icon } from "../../components";
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Figure } from "../dg";

type Step = { icon: string; state: "is-done" | "is-now" | "is-later"; title: string; body: string; stamps?: ReactNode };

export default function AppealWindow() {
  const n = useNumbers(),
    t = n.text;
  const steps: Step[] = [
    {
      icon: "gavel",
      state: "is-done",
      title: "Denied",
      body: `Your score is below your need. A window of ${t("appeal_window")} opens. It is also your cooldown: no new plea before it ends.`,
      stamps: <Stamp state="DENIED" sub="score < need" size="sm" />,
    },
    {
      icon: "timer",
      state: "is-now",
      title: `Appeal within ${t("appeal_window")}`,
      body: `Once, for the same amount or less, with a new text. Pay the ${t("oracle_fee")} oracle fee and ${t("appeal_wall_share")} for the buy wall: ${t("appeal_total")}.`,
    },
    {
      icon: "hourglass",
      state: "is-later",
      title: "The judges read it",
      body: `A new plea with a new need, judged on its own text. The judges also see the denied plea, its score and its need. Up to ${t("pending_expiry")}.`,
      stamps: <Stamp state="PENDING" size="sm" />,
    },
    {
      icon: "gavel",
      state: "is-later",
      title: "The appeal's verdict",
      body: `Overturned: sell within ${t("sell_window")}, as after any approval. Upheld: no further appeal. No verdict: you may appeal again inside the window, paying again.`,
      stamps: (
        <span className="cluster cluster--sm">
          <Stamp state="OVERTURNED" size="sm" />
          <Stamp state="UPHELD" size="sm" />
          <Stamp state="NO VERDICT" size="sm" />
        </span>
      ),
    },
  ];
  const alt =
    "A timeline of an appeal. " +
    steps.map((s, i) => `${i + 1}, ${s.title}: ${s.body}`).join(" ") +
    ` After an upheld appeal, or a sale, the next plea waits ${t("cooldown")} from then.`;
  return (
    <Figure title={`A denial opens one appeal, for ${t("appeal_window")}`} alt={alt}>
      <ol className="timeline">
        {steps.map((s) => (
          <li className={s.state} key={s.title}>
            <span className="timeline__dot">
              <Icon name={s.icon} />
            </span>
            <div className="stack stack--sm">
              <p className="timeline__title">{s.title}</p>
              {s.stamps && <div>{s.stamps}</div>}
              <p className="timeline__meta">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Figure>
  );
}
