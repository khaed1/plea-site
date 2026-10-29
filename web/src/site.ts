/** The deployment's site settings and the words that differ by network.
 *
 * The settings are the manifest's `site` block (web/networks/<key>/site.json, copied into
 * dist/imd-deployment.json by the build; scripts/network.mjs fills `eventStart` and `expected` from the
 * deployment when site.json leaves them null) joined with its `network` block. loadConfig calls
 * `setSite` before anything renders; every network word on the site comes from here, so the same
 * code builds the Sepolia run 9 site and the Ethereum site.
 *
 * The settings live on globalThis so that every bundle of this module (the tests bundle each source
 * file separately) reads the same deployment. */
import type { Address } from "viem";

export type TradeSettings =
  | { kind: "poolSwapTest"; router: Address }
  | { kind: "universalRouter"; router: Address; minHopPrice: boolean; permit2: Address };
/** The fact-score rules the deployed CabalGate fixes and no view returns (CabalGate._heldPoints,
 * _factScoreAt): holding-time points, longest band first, and the profit points PLEA that no buy
 * record covers scores. Sepolia run 9 (testnet9): 7 / 4 / 2 at 7 / 3 / 1 days, profit 10;
 * Ethereum (launch #2647): 3 / 2 / 1, profit 9. */
export type FactRules = {
  held: { days: number; points: number }[];
  receivedProfit: number;
};
export type SiteSettings = {
  key: string;
  /** The deployment in words: "Sepolia test run 9", "Ethereum". */
  name: string;
  /** The test-run strip's text, or null for none. */
  strip: string | null;
  /** The footer's network sentence. */
  footer: string;
  siteUrl: string;
  /** The first block of PLEA's history: the launch's deploy block. */
  eventStart: number;
  oracleApi: string;
  claimsPath: string;
  /** The Letterbox, Tribunal and hook PleaLaunch must name, or null to take PleaLaunch's. */
  expected: Record<"Letterbox" | "Tribunal" | "PleaHook", string> | null;
  facts: FactRules;
  trade: TradeSettings;
  delegateRegistry: Address;
  /** imd/acc's Stacker and its sIMD vault (null: cashback is never staked on this network). */
  cashback: { stacker: Address; simd: Address | null; simdDecimals: number };
  /** The seat NFT Seasons reads; `note` qualifies it on the Contracts page ("a test NFT on Sepolia"). */
  seat: { address: Address; name: string; note: string | null };
  /** Etherscan's message page for raw letters, where the network has one, and the network it sends
   * on in the Letters card's words ("etherscan.io/idm (Ethereum mainnet only)"). */
  letterMessagePage: { url: string; network: string } | null;
  indexer: { graphql: string } | null;
  /** eth_getLogs block ranges: `default` for the scan, and per RPC URL (0: never ask it for logs). */
  logRanges: Record<string, number>;
  /** The explorer's name in sentences ("Sepolia Etherscan", "Etherscan"). */
  explorerName: string;
  /** The pool currency's symbol until the chain has said it. */
  pairSymbol: string;
  /** PLEA's source code: repo and the branch, tag or commit this deployment was built from (Ethereum:
   * the launched commit, 42e0f85; IMD's delivered copy bc2fda9 has the same src/). */
  source: { repo: string; ref: string };
  /** The Contracts section's meta and PLEA's contracts panel meta (null: the source commit). */
  contracts: { meta: string; launch: string | null };
  meta: Record<string, string>;
};
export type Site = SiteSettings & {
  /** The chain's name: "Sepolia", "Ethereum". */
  chain: string;
  chainId: number;
  testnet: boolean;
  explorer: string;
  sourceCommit?: string;
};

const KEY = "__PLEA_SITE__";
const store = globalThis as unknown as Record<string, Site | undefined>;

/** The site settings from a manifest (dist/imd-deployment.json): its `site` and `network` blocks. */
export function siteFrom(manifest: any): Site {
  const s = manifest?.site,
    n = manifest?.network;
  if (!s || typeof s !== "object" || !n)
    throw Error("The deployment file has no site settings. Reload this page.");
  if (!Number.isSafeInteger(s.eventStart) || s.eventStart < 0)
    throw Error("The deployment file names no first block for PLEA's history.");
  if (!s.trade?.router || !["poolSwapTest", "universalRouter"].includes(s.trade.kind))
    throw Error("The deployment file names no swap router.");
  if (!validFacts(s.facts)) throw Error("The deployment file names no fact-score rules.");
  return {
    ...s,
    chain: n.name,
    chainId: n.chainId,
    testnet: !!n.testnet,
    explorer: n.explorer,
    sourceCommit: manifest.sourceCommit,
  };
}
/** Holding bands longest first, whole days and points, and a whole profit score. */
export const validFacts = (f: any): f is FactRules =>
  Array.isArray(f?.held) &&
  f.held.length > 0 &&
  f.held.every(
    (b: any, i: number) =>
      Number.isSafeInteger(b?.days) &&
      b.days > 0 &&
      Number.isSafeInteger(b?.points) &&
      b.points >= 0 &&
      (i === 0 || b.days < f.held[i - 1].days),
  ) &&
  Number.isSafeInteger(f.receivedProfit) &&
  f.receivedProfit >= 0;
export function setSite(manifest: any): Site {
  const site = siteFrom(manifest);
  store[KEY] = site;
  return site;
}
/** The settings loadConfig set. Before that (the first paint) nothing network-specific is shown. */
export function site(): Site {
  const s = store[KEY];
  if (!s) throw Error("The deployment's site settings are not loaded yet.");
  return s;
}
export const siteLoaded = () => !!store[KEY];

// ---- Words that differ by network -------------------------------------------------------------

/** "Can’t reach Sepolia" (no answer) or "Can’t read Sepolia" (an error came back). */
export const cantReach = (answered = false, x = site()) =>
  `${answered ? "Can’t read" : "Can’t reach"} ${x.chain}`;
export const switchText = (x = site()) => `Switch to ${x.chain}`;
/** A sentence's ending for "nothing of this kind yet": " in this test run" or " yet". */
export const soFar = (x = site()) => (x.testnet ? " in this test run" : " yet");
/** ERC20InsufficientBalance's fix. */
export const fundsFix = (x = site()) =>
  x.testnet ? "Lower the amount or add test tokens." : "Lower the amount or add tokens to this wallet.";
/** No ETH for gas. */
export const gasText = (x = site()) =>
  x.testnet
    ? `You need ${x.chain} ETH for gas and enough tokens for this action. Add test funds and try again.`
    : "You need ETH for gas and enough tokens for this action. Add funds and try again.";
/** The wallet sheet's line under the wallets. */
export const walletNote = (x = site()) =>
  x.testnet
    ? `${x.chain} test tokens have no value. Connecting never sends a transaction.`
    : "Connecting never sends a transaction.";
/** A link to PLEA's source at this deployment's branch: `path` like "src/CabalGate.sol". */
export const sourceLink = (path: string, x = site()) =>
  `${x.source.repo}/blob/${x.source.ref}/${path}`;
/** The swap router's row on the Contracts page. */
export function routerRow(x = site()): { name: string; note: string } {
  return x.trade.kind === "poolSwapTest"
    ? { name: "Uniswap v4 PoolSwapTest", note: "the swap router this test run trades through" }
    : { name: "Uniswap Universal Router", note: "the router the Buy page trades through, with Permit2" };
}
/** Cashback in words. `staked`: this wallet's cashback was staked (a CashbackStacked log). */
export function cashbackWords(pair: string, x = site()) {
  const staked = !!x.cashback.simd;
  return {
    /** Buy's costs row label. */
    row: (bps: string) => (staked ? `Back to you as staked ${pair} (${bps})` : `Back to you as cashback (${bps})`),
    /** How it works, step 1. */
    step: (bps: string, example: string) =>
      staked
        ? `${bps} comes back to you as staked ${pair} (${example})`
        : `${bps} comes back to you as cashback in ${pair} (${example})`,
    /** The Buy page's cashback panel, after "… of every trade (… on this buy)." */
    howPaid: staked
      ? `Paid as staked ${pair} (sIMD) through imd/acc, in the same transaction.`
      : `Paid in the same transaction.`,
    /** Where a network never stakes it. */
    plainNote: staked ? "" : `In this test run it arrives as plain ${pair}, not staked.`,
    /** Home's fees table row. */
    feesRow: staked
      ? `Cashback to you, as staked ${pair} through imd/acc`
      : `Cashback to you, in plain ${pair}`,
    /** Profile's cashback stat note. */
    profileNote: staked ? `As staked ${pair} through imd/acc` : `Paid in plain ${pair} in this test run`,
  };
}
/** The plain warning that a scanner's sell simulation fails while the Cabal lives (not on testnets,
 * where those scanners do not run). */
export function sellGateWarning(x = site()) {
  return x.testnet
    ? undefined
    : {
        title: "Wallets and token scanners will likely call PLEA unsellable.",
        body: "Honeypot checks, Blockaid in MetaMask, GoPlus and honeypot.is test a token by simulating a plain sell. While the Cabal lives a plain sell reverts: selling needs an approved plea, so their simulation fails and they warn. That is the plea rule at work, not a trap. Once the Cabal dies, PLEA sells like any token.",
      };
}
