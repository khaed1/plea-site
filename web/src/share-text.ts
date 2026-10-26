import {
  amount,
  clock,
  con,
  idList,
  noVerdict,
  objectionCase,
  pleaState,
  sharePercent,
  short,
  soldFor,
  span,
  tokenAmount,
  type Plea,
  type Snapshot,
} from "./chain";

/** The state a share card, its label and its post lead with: the deciding objection state when an
 * objection is ruled or live (a stale or void one changes nothing), else the plea's own. */
export function shareState(p: Plea, s: Snapshot, now: number) {
  return objectionCase(p, s, now).state ?? pleaState(p, now, s);
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
function appealOpen(p: Plea, s: Snapshot, now: number) {
  return (
    p.status === 3 &&
    !p.isAppeal &&
    !p.appealed &&
    !!s.v["CabalGate.cabalAlive"] &&
    !s.v["CabalGate.diedAt"] &&
    now <= Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN"))
  );
}
const appealOf = (p: Plea, s: Snapshot) =>
  s.logs.find(
    (l) => l.eventName === "PleaSubmitted" && l.args.originalId === p.id,
  )?.args.id as bigint | undefined;

/** The share frame's sentence after the quote, per state, from share-cards.html's aria-labels:
 * "Approved, 36 vs need 33. +43 points held, season 2 rank 4.", "Sold, 34 vs need 33, for 10.78
 * imdTEST. Objection #8 sustained, 29 vs need 33: no points." Points only where the card shows
 * them (S13). */
export function shareSentence(
  p: Plea,
  s: Snapshot,
  now: number,
  extra: { rank?: number; season?: bigint; originalScore?: number } = {},
) {
  const state = pleaState(p, now, s),
    oc = objectionCase(p, s, now),
    pair = s.constants.pairSymbol,
    sold = p.status === 4,
    earns = [2, 4, 5].includes(p.status) && !p.excluded && !p.standing?.[1],
    points =
      earns && p.points
        ? `+${p.points} points${p.standing?.[0] ? " held" : ""}`
        : "",
    rank =
      earns && extra.rank !== undefined && extra.rank >= 0
        ? `season ${String((extra.season ?? 0n) + 1n)} rank ${extra.rank + 1}`
        : "",
    forX = `${amount(soldFor(p, s), s.constants.pairDecimals ?? 18, 2)} ${pair}`;
  if (state === "PENDING")
    return `Pending until ${clock(Number(p.submittedAt) + Number(con(s, "CabalGate.PENDING_EXPIRY")))}. Need ${p.need}, ${amount(p.amount, s.constants.decimals ?? 18)} PLEA${p.balance ? `, ${sharePercent(p.amount, p.balance)} of the bag` : ""}.`;
  if (state === "NO VERDICT") {
    const nv = noVerdict(p, s, now),
      why = {
        refused: ": the request was refused",
        split: `: the panel split, ${p.failure?.agreed} of ${p.failure?.answered} judges agreed, ${con(s, "CabalGate.QUORUM")} needed`,
        "no answer": `: no answer within ${span(Number(con(s, "CabalGate.PENDING_EXPIRY")))}`,
        closed: ": the Intake closed the request",
        unknown: "",
      }[nv.kind];
    return `No verdict${why}. No cooldown.`;
  }
  if (state === "DENIED") {
    const appeal = appealOf(p, s);
    return `Denied, ${p.score} vs need ${p.need}: no points.${appeal ? ` Appealed in plea #${appeal}.` : appealOpen(p, s, now) ? ` Appeal open until ${clock(Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")))}.` : ""}`;
  }
  if (state === "UPHELD")
    return `Upheld on appeal, ${p.score} vs need ${p.need}: no points.${extra.originalScore !== undefined ? ` The first plea, #${p.originalId}, scored ${extra.originalScore}.` : ""} No further appeal.`;
  const head =
    state === "OVERTURNED"
      ? `Overturned on appeal, ${p.score} vs need ${p.need}.${sold ? ` Sold for ${forX}.` : ""}`
      : `${cap(state.toLowerCase())}, ${p.score} vs need ${p.need}${sold ? `, for ${forX}` : ""}.`;
  if (oc.state) {
    const each = oc.list
      .map((o) =>
        o.ruling === 1
          ? `objection #${o.id} pending`
          : `objection #${o.id} ${o.ruling === 2 ? "sustained" : "overruled"}, ${o.newScore} vs need ${p.need}`,
      )
      .join("; ");
    const tail =
      oc.state === "SUSTAINED" || !earns
        ? "no points"
        : oc.state === "OBJECTION"
          ? `+${p.points} points held`
          : `counts ${p.points} points`;
    return `${head} ${cap(each)}: ${tail}.`;
  }
  const facts = [points, rank].filter(Boolean).join(", ");
  return `${head}${facts ? ` ${cap(facts)}.` : p.excluded ? " This seller is excluded from season points." : ""}`;
}

/** The post text's first part (share-cards.html's notice: the state in capitals with the score
 * against the need). "the sale stands" only for a sold plea (r2C-V1); the appeal only while it is
 * open (r2C-N4); every ruled or pending objection named (E3a). */
export function shareStatus(
  p: Plea,
  s: Snapshot,
  now: number,
  subject: string,
) {
  const state = pleaState(p, now, s),
    oc = objectionCase(p, s, now),
    sold = p.status === 4,
    many = (n: number, one: string, more: string) => (n > 1 ? more : one),
    scores = (list: any[]) =>
      list.map((o) => o.newScore).join(" and ");
  if (state === "PENDING")
    return `PENDING: the Cabal is judging ${subject}; need ${p.need}.`;
  if (state === "NO VERDICT")
    return `NO VERDICT on ${subject}; ${noVerdict(p, s, now).sub}. No cooldown.`;
  if (oc.state === "SUSTAINED")
    return `${many(oc.sustained.length, "Objection", "Objections")} ${idList(oc.sustained)} SUSTAINED: ${subject} re-scored ${scores(oc.sustained)} vs need ${p.need}, no points${sold ? "; the sale stands" : state === "LAPSED" ? "; nothing was sold" : ""}.`;
  if (oc.state === "OBJECTION")
    return `${many(oc.pending.length, "OBJECTION", "OBJECTIONS")} ${idList(oc.pending)} to ${subject} (${state}, ${p.score} vs need ${p.need}): ${many(oc.pending.length, "a new panel re-scores", "new panels re-score")} it, and ${p.need - Number(con(s, "Tribunal.MARGIN")) - 1} or less means no points.`;
  if (oc.state === "OVERRULED")
    return `${many(oc.overruled.length, "Objection", "Objections")} ${idList(oc.overruled)} OVERRULED: ${subject} re-scored ${scores(oc.overruled)} vs need ${p.need}, counts ${p.points} points.`;
  return `${state}: ${subject}, ${p.score} vs need ${p.need}.${sold ? ` Sold for ${tokenAmount(soldFor(p, s), s, true)}.` : state === "UPHELD" ? " No further appeal." : state === "DENIED" && appealOpen(p, s, now) ? ` Appeal until ${clock(Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")))}.` : ""}`;
}

/** Who the post is about: "my plea" only for the seller's own post. */
export const shareSubject = (p: Plea, viewer?: string) =>
  viewer?.toLowerCase() === p.seller.toLowerCase()
    ? "my plea"
    : `plea #${p.id} by ${p.name || short(p.seller)}`;
