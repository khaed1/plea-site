/** Diagram "keeper-jobs" (docs/14-keepers.md): the upkeep anyone may do, in the order a letter's plea
 * meets it, on the site's own timeline, each job with its button and what it pays: only a delivery
 * pays (Letterbox.TIP to the caller); every other call pays nothing. CabalGate.expire (PENDING_EXPIRY),
 * Letterbox.deliver (within EXECUTE_WINDOW of the verdict) and settle (after it, or after a denial or
 * no verdict), Seasons.record (once Tribunal.standing no longer holds the plea: OBJECTION_WINDOW),
 * Tribunal.expire (PENDING_EXPIRY) and settle, Seasons.closeSeason (CLOSE_GRACE after the season's
 * end, recording the approvals it is given), Seasons.flushToWall (the Cabal dead, its last season
 * closed), PleaHook.rebalance (when it has work). None has a caller check. Every number is
 * numbers.json's. */
import { Icon } from "../../components";
import { useNumbers } from "../numbers-context";
import { Stamp } from "../kit";
import { Band, Figure } from "../dg";

type Job = { icon: string; when: string; what: string; button: string; pays: string | null; stamp?: "APPROVED" };

export default function KeeperJobs() {
  const n = useNumbers(),
    t = n.text;
  const jobs: Job[] = [
    {
      icon: "hourglass",
      when: "A plea is sent",
      what: `No verdict within ${t("pending_expiry")}: anyone may close it, so its seller may plead again.`,
      button: "Expire unanswered plea",
      pays: null,
    },
    {
      icon: "gavel",
      when: "Approved",
      what: `Within ${t("sell_window")}, anyone may sell a letter's or an auto-sell plea's escrow for its writer. The writer gets the sale.`,
      button: "Deliver approved sale",
      pays: `the ${t("runner_tip")} tip`,
      stamp: "APPROVED",
    },
    {
      icon: "envelope-simple",
      when: `${t("sell_window")} later, not delivered`,
      what: "Or denied, or no verdict: anyone may give the writer back the PLEA and the tip.",
      button: "Return escrow and tip",
      pays: null,
    },
    {
      icon: "scales",
      when: `${t("objection_window")} after the approval`,
      what: `The objection window is over: anyone may record the plea's season points. An objection with no ruling after ${t("objection_expiry")} may be voided ("Expire unanswered objection"), and a decided one's stake paid out ("Settle objection stake").`,
      button: "Record the points",
      pays: null,
    },
    {
      icon: "trophy",
      when: `${t("close_grace")} after the season ends`,
      what: "Anyone may close the season and pay its prizes. The close also records the approvals it is given.",
      button: "Close season",
      pays: null,
    },
    {
      icon: "fire",
      when: "After the death and the last close",
      what: "Anyone may send what is left of the pot to the buy wall.",
      button: "Send leftovers to the buy wall",
      pays: null,
    },
  ];
  const rebalance = `Whenever the buy wall has work, anyone may rebalance it: "Rebalance buy wall" on Home. It pays nothing.`;
  const paysText = (j: Job) => (j.pays ? `Pays ${j.pays}.` : "Pays nothing.");
  const alt =
    "The upkeep anyone may do, in the order a letter's plea meets it. " +
    jobs.map((j, i) => `${i + 1}, ${j.when}: ${j.what} Button: ${j.button}. ${paysText(j)}`).join(" ") +
    ` And at any time: ${rebalance} Only a delivery pays.`;
  return (
    <Figure title={`Every job is open to anyone; only a delivery pays, the ${t("runner_tip")} tip`} alt={alt}>
      <ol className="timeline">
        {jobs.map((j, i) => (
          <li className={i === 1 ? "is-now" : "is-later"} key={j.button}>
            <span className="timeline__dot">
              <Icon name={j.icon} />
            </span>
            <div className="stack stack--sm">
              <p className="timeline__title">{j.when}</p>
              {j.stamp && (
                <div>
                  <Stamp state={j.stamp} size="sm" />
                </div>
              )}
              <p className="timeline__meta">{j.what}</p>
              <p className="small">
                Button: <b>{j.button}</b>
              </p>
              <p>
                <span className={j.pays ? "badge badge--you" : "badge"}>
                  <Icon name={j.pays ? "coins" : "minus"} />
                  {paysText(j).replace(/\.$/, "")}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <Band icon="arrow-clockwise">
        <b>At any time.</b> {rebalance}
      </Band>
    </Figure>
  );
}
