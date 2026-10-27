import { getAddress, isAddress } from "viem";
import { short } from "./chain";
/** A wallet as the loaded profile shows it: checksummed, so the letter case does not change on
 * load (#/profile/0x8826…af16 reads 0x8826…Af16 throughout). */
const wallet = (id: string) =>
  short(
    isAddress(id, { strict: false }) ? getAddress(id.toLowerCase()) : id,
  );
/** The line each route's loading band reads (round-2 X5; the mockups' Loading bands). A profile
 * names its wallet short, as everywhere else (0x7a3f…c21e): the full 42-character address
 * does not wrap and pushed a 320-360 px page sideways (r2X-4). Its display name is not known
 * before the first read. */
export function loadingLine(page: string, id?: string, connected?: string) {
  const lines: Record<string, string> = {
    buy: "Reading the pool…",
    plead: "Reading your balance and buy record from the chain…",
    wall: "Reading pleas from the chain…",
    seasons: "Reading the leaderboard from Seasons…",
    objections: "Reading approvals and objections from the chain…",
    profile: `Reading ${id ? wallet(id) : connected ? wallet(connected) : "your wallet"}’s balances, pleas and seasons from the chain…`,
    p: `Reading plea #${id} from the chain…`,
  };
  return (
    lines[page] || "Reading the pool, the Cabal and the season from the chain…"
  );
}
const TITLES: Record<string, string> = {
  buy: "Buy PLEA",
  plead: "Plead to sell",
  wall: "The Wall",
  seasons: "Seasons",
  objections: "Objection!",
  letters: "Plead by letter",
  claim: "Claim your PLEA",
  share: "Share PLEA",
  "share-cards": "Share PLEA",
};
/** The season Seasons is titled by (seasons.tsx: "Season N"), from the reads that ride along with
 * the constants (CabalGate.startedAt, diedAt, Seasons.currentSeason), as readSnapshot computes
 * displayedSeason; undefined when they are not in. */
export function loadingSeason(c?: Record<string, any>) {
  if (!c) return undefined;
  const started = c["CabalGate.startedAt"],
    died = c["CabalGate.diedAt"],
    current = c["Seasons.currentSeason"],
    length = c["Seasons.SEASON"];
  if (started === undefined || died === undefined) return undefined;
  if (!BigInt(started)) return null;
  if (BigInt(died) && length)
    return (BigInt(died) - 1n - BigInt(started)) / BigInt(length);
  return current === undefined ? undefined : BigInt(current[1]);
}
/** The loading band's h1: the loaded page's own where it is known before the first read. A profile
 * is titled by its short address until the name arrives (profile.tsx: name, else the address). */
export function loadingTitle(
  page: string,
  id?: string,
  connected?: string,
  statics?: Record<string, any>,
) {
  if (page === "p") return `Plea #${id}`;
  if ((page === "share" || page === "share-cards") && id && /^\d+$/.test(id))
    return `Share plea #${id}`;
  if (page === "seasons") {
    const k = loadingSeason(statics);
    if (k !== undefined && k !== null) return `Season ${k + 1n}`;
  }
  if (page === "profile") {
    const who = id || connected;
    return who && isAddress(who, { strict: false })
      ? wallet(who)
      : id
        ? "Profile"
        : "Your profile";
  }
  return TITLES[page] || "PLEA";
}
/** Home's lead, the same words in the loaded hero and in its loading band (r2X-11): the panel
 * size and the top score are CabalGate.PANEL_SIZE and MAX_PLEA_SCORE, read with the other constants
 * before the first snapshot. */
export function homeLead(
  c: { symbol?: string; [key: string]: any },
  dead = false,
) {
  return `${c.symbol || "PLEA"} is a meme token on Uniswap v4. ${
    dead
      ? "The Cabal is dead, so buying and selling are open to everyone, forever."
      : `To sell, you write why, and the Cabal, ${c["CabalGate.PANEL_SIZE"]} judges on an IMD oracle panel, scores it from 0 to ${c["CabalGate.MAX_PLEA_SCORE"]}.`
  }`;
}
/** Home's hero buttons: alive, dead, or (state not known yet: Home's loading band before the
 * constants carry CabalGate.diedAt) the two that hold either way, Buy and the Wall (sweep R14). */
export function homeButtons(dead: boolean | undefined, symbol = "PLEA") {
  return dead === undefined
    ? [
        { label: `Buy ${symbol}`, href: "#/buy" },
        { label: "See the Wall", href: "#/wall" },
      ]
    : dead
      ? [
          { label: "Buy or sell PLEA", href: "#/buy" },
          { label: "See the Wall", href: "#/wall" },
        ]
      : [
          { label: `Buy ${symbol}`, href: "#/buy" },
          { label: "Plead to sell", href: "#/plead" },
        ];
}
