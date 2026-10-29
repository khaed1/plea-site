/** Diagram "audit-timeline" (docs/16-audits.md): every audit of PLEA's code in date order, on the
 * site's timeline. The swarm rounds' findings by severity are numbers.json's audit_r1 to audit_r12
 * (audit/FINDINGS.md's Rounds table, at the launch commit), drawn as badges that name their severity
 * in words; IMD's launch audits and the One Dollar Audit jobs are numbers.json's audit_imd_* and
 * audit_oda_* phrases. Dates and commits are FINDINGS.md's. */
import { Icon } from "../../components";
import { useNumbers } from "../numbers-context";
import { Figure } from "../dg";

type Line = { label: string; commit?: string; found: string; badges?: boolean };
type Day = { date: string; icon: string; title: string; lines: Line[]; state: "is-done" | "is-now" };

const LEVEL: Record<string, string> = { High: "high", Medium: "medium", Low: "low", Info: "info" };

/** "1 High, 1 Medium, 4 Low, 5 Info" as badges: the count and the word on each. */
function Badges({ found }: { found: string }) {
  return (
    <span className="dg-sev">
      {found.split(", ").map((part) => {
        const word = part.split(" ")[1];
        return (
          <span key={part} className={`dg-sev__badge dg-sev__badge--${LEVEL[word] ?? "info"}`}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

export default function AuditTimeline() {
  const n = useNumbers(),
    t = n.text;
  const round = (r: number, commit: string): Line => ({
    label: `Swarm round ${r}`,
    commit,
    found: t(`audit_r${r}`),
    badges: true,
  });
  const days: Day[] = [
    {
      date: "14 Oct 2026",
      icon: "seal-check",
      title: "IMD's launch audits of test runs 5 and 6",
      state: "is-done",
      lines: [
        { label: "Run 5", commit: "68b2281", found: t("audit_imd_run5") },
        { label: "Run 6", commit: "8edd852", found: t("audit_imd_run6") },
      ],
    },
    {
      date: "15 Oct 2026",
      icon: "scales",
      title: "Swarm rounds 1 to 5, and IMD's launch audit of run 7",
      state: "is-done",
      lines: [
        round(1, "cd88136"),
        round(2, "4b14d13"),
        round(3, "3766112"),
        round(4, "e41e426"),
        round(5, "9b89d98"),
        { label: "IMD, run 7", commit: "e1755aa", found: t("audit_imd_run7") },
      ],
    },
    {
      date: "16 Oct 2026",
      icon: "scales",
      title: "Swarm rounds 6 to 8, and IMD's launch audits of runs 8 and 8.5",
      state: "is-done",
      lines: [
        round(6, "f6b1e9a"),
        round(7, "533dcec"),
        round(8, "02407c1"),
        { label: "IMD, run 8", commit: "dc3826b", found: t("audit_imd_run8") },
        { label: "IMD, run 8.5", commit: "af57f6d", found: t("audit_imd_run85") },
      ],
    },
    {
      date: "17 Oct 2026",
      icon: "magnifying-glass",
      title: "One Dollar Audit: five jobs on run 8.5's code",
      state: "is-done",
      lines: [
        { label: "1014, the hook", found: t("audit_oda_1014") },
        { label: "1015, the gate", found: t("audit_oda_1015") },
        { label: "1016, letters and the launch", found: t("audit_oda_1016") },
        { label: "1017, the Tribunal and Seasons", found: t("audit_oda_1017") },
        { label: "1018, the hook again", found: t("audit_oda_1018") },
      ],
    },
    {
      date: "21 to 26 Oct 2026",
      icon: "gavel",
      title: "Sepolia test run 9: the code live, with real verdicts",
      state: "is-done",
      lines: [
        {
          label: "Run 9",
          found: "Pleas judged, sold, appealed and objected to, a season's prize paid, and the Cabal's death",
        },
      ],
    },
    {
      date: "28 Oct 2026",
      icon: "check-circle",
      title: "Swarm rounds 9 to 12 on the Ethereum code, IMD's launch audit, and the launch",
      state: "is-now",
      lines: [
        round(9, "6ffcf66"),
        round(10, "6422b1b"),
        round(11, "238eebb"),
        round(12, "571ae80"),
        { label: "IMD, launch " + t("launch_id"), commit: "42e0f85", found: t("audit_imd_launch") },
      ],
    },
  ];
  const alt =
    "Every audit of PLEA's code, in date order. " +
    days
      .map(
        (d) =>
          `${d.date}: ${d.title}. ` +
          d.lines.map((l) => `${l.label}${l.commit ? `, commit ${l.commit}` : ""}: ${l.found}.`).join(" "),
      )
      .join(" ") +
    ` In all, the ${t("audit_rounds")} swarm rounds found ${t("audit_high")} High, ${t("audit_medium")} Medium, ${t("audit_low")} Low and ${t("audit_info")} Info, and no Critical.`;
  return (
    <Figure title="Every audit, in date order" alt={alt}>
      <ol className="timeline dg-audits">
        {days.map((d) => (
          <li className={d.state} key={d.date}>
            <span className="timeline__dot">
              <Icon name={d.icon} />
            </span>
            <div className="stack stack--sm">
              <p className="timeline__title">
                <span className="dg-audits__date">{d.date}</span> {d.title}
              </p>
              <ul className="dg-audits__lines">
                {d.lines.map((l) => (
                  <li key={l.label}>
                    <span className="dg-audits__label">
                      {l.label}
                      {l.commit && <span className="mono text-2"> · {l.commit}</span>}
                    </span>
                    {l.badges ? <Badges found={l.found} /> : <span className="dg-audits__found">{l.found}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      <div className="dg-band">
        <Icon name="seal-check" />
        <p>
          <b>
            The {t("audit_rounds")} swarm rounds in all: {t("audit_total")} findings.
          </b>{" "}
          <Badges
            found={`${t("audit_high")} High, ${t("audit_medium")} Medium, ${t("audit_low")} Low, ${t("audit_info")} Info`}
          />{" "}
          No Critical.
        </p>
      </div>
    </Figure>
  );
}
