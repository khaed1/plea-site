/** Diagram "word-map" (docs/18-glossary.md): where each glossary word sits in a plea's life, from the
 * buy to the season, and the words around it all (the pool, the owner, the keepers, the dead-man).
 * Every A to Z entry of the page appears once, as a badge (words only: no colour carries meaning).
 * The few numbers come from numbers.json. */
import { Fragment } from "react";
import { useNumbers } from "../numbers-context";
import { Arrow, Band, Figure, Node } from "../dg";

type Stage = { title: string; text: string; words: string[] };

export default function WordMap() {
  const n = useNumbers(),
    t = n.text;
  const stages: Stage[] = [
    {
      title: "Buy",
      text: `Pay IMD, get PLEA. Every trade pays the ${t("fee_total")} fee.`,
      words: ["IMD", "Buy record", "Launch window", "Fee", "Cashback", "sIMD"],
    },
    {
      title: "Plead",
      text: "Write why you want to sell. Or send a letter, or tick auto-sell.",
      words: ["Plea", "Oracle fee", "Fact score", "Hourly price", "Pass mark", "Need", "Letter", "Auto-sell", "Escrow"],
    },
    {
      title: "Judged",
      text: `${t("panel_size")} judges answer through IMD's Intake.`,
      words: ["Cabal", "Intake", "Quorum", "Verdict", "Approved", "Denied", "No verdict"],
    },
    {
      title: "After the verdict",
      text: "Sell, appeal or wait; others may object.",
      words: ["Sell window", "Lapsed", "Deliver", "Runner", "Tip", "Settle", "Appeal", "Overturned", "Upheld", "Cooldown", "Objection", "Stake", "Sustained", "Overruled", "Void"],
    },
    {
      title: "The season",
      text: "Approvals become points.",
      words: ["Record", "Points", "Seat", "Season", "Pot", "Bonus", "Rollover"],
    },
  ];
  const around = ["Cap", "Trim", "Buy wall", "Rebalance", "Tick", "Keeper", "Claim list", "Allowed sender", "Dead-man", "The Wall"];
  const alt =
    "Where each word of this glossary sits in a plea's life, top to bottom. " +
    stages.map((s, i) => `${i + 1}, ${s.title}: ${s.text} Words: ${s.words.join(", ")}.`).join(" ") +
    ` Around it all: ${around.join(", ")}.`;
  return (
    <Figure title="Where each word sits in a plea's life" alt={alt}>
      <div className="dg-flow dg-flow--down">
        {stages.map((s, i) => (
          <Fragment key={s.title}>
            {i > 0 && <Arrow down />}
            <Node n={i + 1} title={s.title}>
              <span className="dg-node__text">{s.text}</span>
              <span className="cluster cluster--sm">
                {s.words.map((w) => (
                  <span className="badge" key={w}>
                    {w}
                  </span>
                ))}
              </span>
            </Node>
          </Fragment>
        ))}
      </div>
      <Band icon="scales">
        <b>Around it all.</b>{" "}
        <span className="cluster cluster--sm">
          {around.map((w) => (
            <span className="badge" key={w}>
              {w}
            </span>
          ))}
        </span>
      </Band>
    </Figure>
  );
}
