// Copy builders for #/seasons and the profile's seasons table, kept pure so the tests can check them.
// Every rule number comes in from the chain constants (Seasons.TOP, MIN_POINTS, the shares, the pot).
import { tokenAmount, type Snapshot } from "./chain";

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
}) {
  const n = o.season + 1n,
    paysIn = `in ${o.pair}${o.bonus ? " and PLEA" : ""}`,
    grace = o.ready
      ? `The grace is over: anyone can close season ${n} now. `
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
}) {
  const n = o.season + 1n,
    head = `No approved plea of yours is recorded in season ${n}.`;
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
    value: tokenAmount(k.imd, s, true),
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
}) {
  return `${o.season !== undefined && o.rank >= 0 && o.qualifies ? `Season ${o.season + 1n}’s prize is rank ${o.rank + 1}’s share if it ended now. ` : ""}Prizes are rounded down and paid at the close, from ${o.closeFrom}.`;
}
