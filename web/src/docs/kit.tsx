/** The site's own illustrations for the docs' diagrams, drawn from given values rather than from a
 * plea on the chain: the verdict stamp and the score-vs-need meter (the same markup and classes as
 * components.tsx's Stamp and Meter, which read the live snapshot and so cannot draw an example).
 * The pass mark and the top score come from numbers.json (the chain's once it has answered). */
import type { CSSProperties } from "react";
import { useNumbers } from "./numbers-context";

export type StampState =
  | "APPROVED"
  | "DENIED"
  | "PENDING"
  | "NO VERDICT"
  | "LAPSED"
  | "SOLD"
  | "OVERTURNED"
  | "UPHELD"
  | "OBJECTION"
  | "SUSTAINED"
  | "OVERRULED"
  | "VOID";
const CLASS: Record<StampState, string> = {
  APPROVED: "approved",
  OVERTURNED: "approved",
  DENIED: "denied",
  UPHELD: "denied",
  PENDING: "pending",
  "NO VERDICT": "noverdict",
  LAPSED: "lapsed",
  SOLD: "sold",
  OBJECTION: "objection",
  SUSTAINED: "objection",
  OVERRULED: "objection",
  VOID: "objection",
};
/** A verdict stamp: the state in words (never colour alone), and "38 vs need 35" or a time under it. */
export function Stamp({ state, sub, size }: { state: StampState; sub?: string; size?: "sm" | "lg" | "xl" }) {
  return (
    <span className={`stamp stamp--${CLASS[state]}${size ? ` stamp--${size}` : ""}`}>
      {state}
      {sub && <span className="stamp__sub">{sub}</span>}
    </span>
  );
}
/** The score-vs-need meter for an example plea: the judges' score against need = pass mark − fact
 * score, on the 0 to top-score scale. `verdict` APPROVED or DENIED fills the bar; none draws the need
 * alone. Its words say everything the bar shows. */
export function Meter({ fact, score, verdict }: { fact: number; score?: number; verdict?: "APPROVED" | "DENIED" }) {
  const n = useNumbers();
  const pass = Number(n.value("pass_mark")),
    max = Number(n.value("max_score")),
    need = pass - fact,
    judged = verdict !== undefined && score !== undefined,
    denied = verdict === "DENIED",
    difference = judged ? (denied ? `${need - score!} short` : `passes by ${score! - need}`) : "";
  return (
    <div
      className={`meter ${!judged ? "meter--none" : denied ? "meter--denied" : ""}`}
      style={{ "--score": Math.max(0, Math.min(max, score ?? 0)), "--need": Math.max(0, Math.min(max, need)) } as CSSProperties}
    >
      <div className="meter__legend">
        <span>{judged ? `Judges ${score}` : "No score yet"}</span>
        <span>
          Need <b>{need}</b> = {pass} − fact <b>{fact}</b>
        </span>
        {judged && <span className={denied ? "bad-text" : "ok-text"}>{difference}</span>}
      </div>
      <div
        className="meter__bar"
        role="img"
        aria-label={judged ? `Score ${score} of ${max}, need ${need}: ${difference}` : `No score yet, need ${need} of ${max}.`}
      >
        <span className="meter__fill" />
        <span className="meter__need" />
      </div>
      <div className="meter__scale" aria-hidden="true">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
