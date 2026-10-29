// Copy builders for #/seasons and the profile's seasons table, kept pure so the tests can check them.
// Every rule number comes in from the chain constants (Seasons.TOP, MIN_POINTS, the shares, the pot).
import { smallAmount, tokenAmount, type Snapshot } from "./chain";

/** "Closing the season", per state: not yet (the mockup's main copy), ready (now ≥ end + CLOSE_GRACE
 * and this season is nextToClose: the band "Close season 2 after the grace"), and the last season
 * after the death (the dead band). seasons.html:211, its bands; S7, S3. */
export function closingCopy(o: {
  season: bigint;
  ready: boolean;
  last: boolean;
  bonus: boolean;
  top: number | bigint;
  minPoints: number;
  pair: string;
  /** Incomplete history: the approvals the close must be sent are not known, so the site's close
   * stays off (L2). */
  historyError?: boolean;
}) {
  const n = o.season + 1n,
    paysIn = `in ${o.pair}${o.bonus ? " and PLEA" : ""}`,
    grace = o.ready
      ? o.historyError
        ? `The grace is over, but the site's close of season ${n} stays off until the history is read. `
        : `The grace is over: anyone can close season ${n} now. `
      : "";
  if (o.last)
    return `${grace}The close records any approved plea nobody recorded and pays the top ${o.top} with ${o.minPoints}+ points ${paysIn}.`;
  if (o.ready)
    return `${grace}The close records any approved plea nobody recorded, pays the top ${o.top} with ${o.minPoints}+ points and rolls the rest over.`;
  return `The close records any approved plea nobody recorded, pays the top ${o.top} with ${o.minPoints}+ points ${paysIn}, rolls the unpaid ${o.pair} over to season ${n + 1n}${o.bonus ? " and burns the unpaid PLEA" : ""}.`;
}

/** The note under "If the season ended now" (seasons.html:207): the chain rounds each prize down. */
export function roundingNote(pair: string, prizes: number) {
  return `Each ${pair} amount is rounded down on its own, as the chain pays and prints it, so parts and totals can differ by a cent${
    prizes > 1
      ? `, and the ${prizes} prizes above by up to a cent each`
      : prizes === 1
        ? ", and the prize above by up to a cent"
        : ""
  }.`;
}

/** The note under "What the close pays" naming the approved pleas nobody recorded that it counts:
 * closeSeason records them first (Seasons._tryRecord), each at its points now (the lower score after
 * an overruled objection, × the seat multiplier while the seller holds a seat). `held`: objections
 * may still be filed or are pending; a sustained one drops the plea. With incomplete history they
 * are not known, and the projection is the recorded board's. */
export function closeCounts(o: {
  pleas: { id: bigint; points: number; held: boolean; seat: boolean }[];
  mult: string;
  historyError?: boolean;
}) {
  if (o.historyError)
    return "Approved pleas nobody recorded are not known until the history is read, and the close records them before it pays, so what it pays is not known yet. The close records the ones it is sent, so it stays off until then.";
  if (!o.pleas.length) return "";
  const items = o.pleas.map(
      (p) =>
        `#${p.id} (+${p.points}${p.seat ? `, seat × ${o.mult}` : ""}${p.held ? ", if no objection is sustained" : ""})`,
    ),
    list =
      items.length === 1
        ? `plea ${items[0]}`
        : `pleas ${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
  return `Counts ${list}, approved and not recorded: the close records ${items.length === 1 ? "it" : "them"} first.${
    o.pleas.some((p) => p.seat) ? " The close reads the seat again as it records." : ""
  }`;
}

/** Your standing for a wallet with no recorded plea in the season. A running season gets the band's
 * pitch; an ended or waiting one says nothing more can be pleaded for it (r2S-N7); the last season
 * after the death says pleas are closed. `current`: the running season, while the Cabal lives. */
export function noPleaText(o: {
  season: bigint;
  ended: boolean;
  last: boolean;
  dead?: boolean;
  current?: bigint;
  minPoints: number;
  mult: string;
  /** Seasons.excluded: the launch owner does not play (F6). */
  excluded?: boolean;
}) {
  const n = o.season + 1n,
    head = `No approved plea of yours is recorded in season ${n}.`;
  if (o.excluded)
    return "This wallet does not play seasons: it is the launch owner's, so its pleas earn no points and no prize or bonus goes to it.";
  if (o.last)
    return `${head} It was the last season: pleas are closed, and no new plea counts in it.`;
  if (o.ended && o.dead)
    return `${head} Season ${n} has ended, and pleas are closed.`;
  if (o.ended)
    return `${head} Season ${n} has ended, so no new plea counts in it${
      o.current !== undefined && o.current > o.season
        ? `; a plea approved now counts in season ${o.current + 1n}`
        : ""
    }.`;
  return `${head} Your best three count, and two pleas that score ${o.minPoints / 2} already reach the ${o.minPoints}-point bar; an IMD seat makes each one × ${o.mult}.`;
}

/** The held notice's sentence: what recording the plea's points makes (S5). The no-prize case ends
 * at the bar, with no "at today's season prize pot" (r2S-N8). `others`: the points of the other
 * wallets on the board (a tie ranks the older counted plea first, so they stay ahead). */
export function projection(o: {
  best: number[];
  points: number;
  others: number[];
  shares: (bigint | number)[];
  pot: bigint;
  bonus: bigint;
  minPoints: number;
  top: number;
  s: Snapshot | undefined;
}) {
  const best = o.best.map(Number),
    filled = best.filter(Boolean),
    next = [...best, o.points].sort((a, b) => b - a).slice(0, 3),
    total = next.reduce((a, b) => a + b, 0),
    rank = 1 + o.others.filter((p) => p >= total).length,
    bps = BigInt(o.shares[rank - 1] || 0),
    eligible = total >= o.minPoints && rank <= o.top,
    drop =
      filled.length === 3 && o.points > Math.min(...filled)
        ? `; the ${Math.min(...filled)} drops out`
        : "";
  return `Recorded, they make ${total} points (${next.join(" + ")}${drop}) and rank ${rank}: ${
    eligible
      ? `${tokenAmount((o.pot * bps) / 10000n, o.s, true)}${o.bonus ? ` + ${tokenAmount((o.bonus * bps) / 10000n, o.s)}` : ""} at today’s season prize pot.`
      : `no prize yet (${total} of ${o.minPoints}).`
  }`;
}

/** A profile seasons row's prize cell (profile.html:194): "8.41 imdTEST" with the note "+ 396,000
 * PLEA", or "no prize" with "(49 of 60)" under the bar, as on the leaderboard (r2S-VN2). A closed
 * season's paid prize comes from its PrizePaid logs; when history is incomplete it is not known. */
export function seasonPrize(
  k: {
    closed: boolean;
    points: number;
    imd: bigint;
    bonus: bigint;
    excluded?: boolean;
    known?: boolean;
  },
  minPoints: number,
  s: Snapshot | undefined,
): { value: string; note?: string } {
  if (k.points < minPoints)
    return { value: "no prize", note: `(${k.points} of ${minPoints})` };
  if (k.excluded) return { value: "no prize", note: "excluded" };
  if (k.closed && k.known === false)
    return { value: "not read", note: "history incomplete" };
  if (!k.imd && !k.bonus) return { value: "no prize" };
  return {
    // A prize under a cent reads "< 0.01", as cashback and claims do, never "0.00" when paid.
    value: smallAmount(k.imd, s),
    note: k.bonus ? `+ ${tokenAmount(k.bonus, s)}` : undefined,
  };
}

/** The profile seasons panel's foot (profile.html:198): rank R's share only when the wallet would be
 * paid if the season ended now (on the board, at or over the bar, not excluded). */
export function seasonsFoot(o: {
  season?: bigint;
  rank: number;
  qualifies: boolean;
  closeFrom: string;
  /** The displayed season is closed: with it every season is (the last one, after the death). */
  closed?: boolean;
}) {
  if (o.closed)
    return "Prizes were rounded down and paid at each season’s close.";
  return `${o.season !== undefined && o.rank >= 0 && o.qualifies ? `Season ${o.season + 1n}’s prize is rank ${o.rank + 1}’s share if it ended now. ` : ""}Prizes are rounded down and paid at the close, from ${o.closeFrom}.`;
}

/** The "No more seasons" panel (seasons.html:369-381). Seasons.flushToWall sends pot() to the buy
 * wall and burns the PLEA Seasons still holds (the bonus of the first BONUS_SEASONS seasons that
 * never ran); with nothing left it does nothing, so the button is offered only while pot() or
 * PLEA.balanceOf(Seasons) is above zero. `pleaLeft` undefined: not read yet. `flushed`: the
 * LeftoverToWall and BonusBurned amounts of the flush, when history has them. */
export function flushCopy(o: {
  pot: bigint;
  pleaLeft?: bigint;
  last: bigint;
  bonusSeasons: bigint;
  flushed?: { toWall?: bigint; burned?: bigint };
  s: Snapshot | undefined;
}): { offer: boolean; text: string } {
  if (o.pot > 0n || (o.pleaLeft ?? 0n) > 0n) {
    const never =
      o.pleaLeft && o.last + 1n < o.bonusSeasons
        ? ` Season ${o.last + 1n} was the last, so the ${tokenAmount(o.pleaLeft, o.s)} of seasons ${o.last + 2n} to ${o.bonusSeasons} is burned.`
        : "";
    return {
      offer: true,
      text: `What is left in Seasons goes to the buy wall, and the PLEA bonus of any of the first ${o.bonusSeasons} seasons that never ran is burned, in one call that anyone can make.${never}`,
    };
  }
  if (o.pleaLeft === undefined) return { offer: false, text: "Reading what is left in Seasons…" };
  const f = o.flushed;
  return {
    offer: false,
    text:
      f && (f.toWall || f.burned)
        ? `The leftovers went to the buy wall: ${f.toWall ? `${tokenAmount(f.toWall, o.s, true)} now backs it` : "no prize assets were left"}${f.burned ? ` and the unused ${tokenAmount(f.burned, o.s)} bonus was burned` : ""}. Nothing is left in Seasons.`
        : "The leftovers went to the buy wall. Nothing is left in Seasons.",
  };
}
