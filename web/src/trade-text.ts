// The Buy page's words for its steps (PoolSwapTest on Sepolia, Uniswap's Universal Router with
// Permit2 on Ethereum): pure, so the unit tests read them without the page.
/** The line under the Buy button: which step this is, what it allows, and where the cashback goes. */
export function tradeSteps(o: {
  step: "token" | "permit2" | "trade";
  stepNumber: number;
  total: number;
  universal: boolean;
  selling: boolean;
  amount: string;
  cashback?: string;
  claims?: boolean;
  staked?: boolean;
}) {
  const nothing = `Nothing is ${o.selling ? "sold" : "bought"} yet.`,
    head = `Step ${o.stepNumber} of ${o.total}:`;
  if (o.step === "token")
    return o.universal
      ? `${head} lets Permit2 move exactly ${o.amount} from your wallet, for Uniswap’s router. ${nothing}`
      : `${head} lets the ${o.selling ? "sale" : "buy"} spend exactly ${o.amount}. ${nothing}`;
  if (o.step === "permit2")
    return `${head} lets Uniswap’s Universal Router take exactly ${o.amount} through Permit2, for 30 minutes. ${nothing}`;
  const cash = o.cashback
    ? o.claims
      ? `${o.cashback} cashback arrives as a claim on the PoolManager (see Profile), in the same transaction.`
      : o.staked
        ? `${o.cashback} cashback is staked for you in the same transaction.`
        : `${o.cashback} cashback is paid to you in the same transaction.`
    : "";
  return [o.total > 1 ? `${head} the ${o.selling ? "sale" : "buy"}.` : "", cash]
    .filter(Boolean)
    .join(" ");
}

/** The Buy page's slippage choices, in basis points, and the one it starts on at every visit (never
 * remembered). The Plead page's sale keeps its fixed 1%. */
export const SLIPPAGES = [50, 100, 200, 500] as const;
export const DEFAULT_SLIP = 100;
/** A slippage in words: 50 → "0.5%". */
export const slipWords = (bps: number) => `${bps / 100}%`;
/** What a trade that failed on price suggests: the next slippage up, or a smaller amount at the top. */
export function slipAdvice(bps: number) {
  const next = SLIPPAGES.find((n) => n > bps);
  return next ? `raise the slippage to ${slipWords(next)}.` : "lower the amount.";
}
/** The warning under the chips at the top slippage (5%): how much less the trade may get, who can cause
 * it, and when to choose it. While the Cabal lives PLEA sells only through an approved plea, so a bot
 * cannot simply buy PLEA ahead of a buy and sell it straight after, but other buys still move the price
 * and so can a holder whose approved plea is open (CabalGate.executeSell sells it at a moment the seller
 * picks inside its window: RC2-1); the route's own pools (IMD's ETH pool, and Uniswap's USDC/ETH pool
 * before it on a USDC buy: RC2-5) trade both ways, so a bot can sandwich the route's swaps there; after
 * the death PLEA's pool trades both ways too. */
export function slipWarning(o: {
  bps: number;
  selling: boolean;
  dead: boolean;
  /** The pools a route buys the IMD on, in order (IMD’s ETH pool; Uniswap’s USDC/ETH pool first for
   * USDC), or undefined for a buy paid with IMD. */
  routePools?: string[];
  pair: string;
}) {
  if (o.bps < SLIPPAGES[SLIPPAGES.length - 1]) return "";
  const most = slipWords(o.bps),
    at = `At ${most} the ${o.selling ? "sale" : "buy"} can get up to ${most} less ${o.selling ? o.pair : "PLEA"} than the quote if someone trades just before it`;
  if (o.selling)
    return `${at}: a bot that sees your sale before it is mined can sell ahead of it and buy back after. Choose ${most} only when sales at 2% keep failing.`;
  const when = `Choose ${most} only when buys at 2% keep failing${o.dead ? "." : ", as on a busy launch."}`;
  if (o.dead)
    return `${at}: a bot that sees your buy before it is mined can buy ahead of it and sell after. ${when}`;
  if (o.routePools?.length === 1)
    return `${at}: a bot that sees your buy before it is mined can buy ${o.pair} ahead of it on ${o.routePools[0]} and sell it after. ${when}`;
  if (o.routePools?.length)
    return `${at}: a bot that sees your buy before it is mined can buy ahead of it on the route’s pools (${o.routePools.join(" and ")}) and sell after. ${when}`;
  return `${at}. While the Cabal lives PLEA sells only through an approved plea, so a bot cannot simply buy ahead of you and sell straight after; other buyers can still move the price, and so can a holder whose approved plea is open, by buying ahead of you and selling after. ${when}`;
}
/** What helps when the ETH a buy leaves cannot pay the gas: a smaller amount, or Max, while Max has
 * something to spend; otherwise more ETH or another currency (the pool currency first). */
export const gasFix = (maxSpends: boolean, others: string[]) =>
  maxSpends
    ? "Lower the amount or press Max."
    : `Add ETH${others.length ? `, or pay with ${others.join(" or ")}` : ""}.`;
