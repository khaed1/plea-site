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
