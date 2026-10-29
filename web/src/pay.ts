/** "Pay with" ETH or USDC on the Buy page (Ethereum; site.json `pay`, site.ts PayRoute).
 *
 * A route is the currency's own v4 pools into IMD (ETH: IMD's ETH pool; USDC: Uniswap's USDC/ETH pool
 * first), then PLEA's pool, in one Universal Router transaction (universal-router.ts encodeBuyVia).
 * The quote is Uniswap's V4 Quoter for the part up to IMD (an eth_call through every pool and hook),
 * then the site's own walk of PLEA's pool for that IMD (pages-trade.tsx poolQuote): the Quoter reads
 * 0 PLEA for PLEA's hop while the Cabal lives, because the hook sends the PLEA straight to the buyer.
 * On a fork of PLEA's deployment the two parts gave exactly the PLEA the router bought.
 *
 * The pools' fees are read live from Uniswap's PoolManager (each pool's Slot0: its LP fee and
 * Uniswap's protocol fee, which the USDC/ETH pool charges), so the words follow the chain. */
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  encodePacked,
  keccak256,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import type { PayRoute } from "./site.ts";
import { NATIVE, v4QuoterAbi, type PathKey, type PoolKey } from "./universal-router.ts";

export const isNative = (a: string) => a.toLowerCase() === NATIVE;
/** The currency every route ends in: the pool currency (IMD), checked against PleaLaunch at load. */
export const routeEnd = (route: PayRoute) => route.path[route.path.length - 1].currency;

/** The route's hops up to IMD, as a v4 path (its pools take no hookData). */
export const routeToImd = (route: PayRoute): PathKey[] =>
  route.path.map((h) => ({
    intermediateCurrency: h.currency,
    fee: h.fee,
    tickSpacing: h.tickSpacing,
    hooks: h.hooks,
    hookData: "0x",
  }));

/** The whole buy: the route's hops, then PLEA's own pool (its pool key) with hookData =
 * abi.encode(buyer), the hook's trader. */
export function buyPath(route: PayRoute, pleaKey: PoolKey, plea: Address, buyer: Address): PathKey[] {
  const imd = routeEnd(route).toLowerCase();
  const keyHasPair = [pleaKey.currency0, pleaKey.currency1].map((c) => c.toLowerCase());
  if (!keyHasPair.includes(imd) || !keyHasPair.includes(plea.toLowerCase()))
    throw Error("PLEA’s pool does not pair PLEA with this route’s currency.");
  return [
    ...routeToImd(route),
    {
      intermediateCurrency: plea,
      fee: pleaKey.fee,
      tickSpacing: pleaKey.tickSpacing,
      hooks: pleaKey.hooks,
      hookData: encodeAbiParameters([{ type: "address" }], [buyer]),
    },
  ];
}

/** Hop `i`'s pool key (its two currencies sorted, as v4 sorts them) and whether the hop swaps
 * currency0 for currency1. */
export function hopKey(route: PayRoute, i: number): { key: PoolKey; zeroForOne: boolean } {
  const from = (i ? route.path[i - 1].currency : route.currency).toLowerCase() as Address,
    to = route.path[i].currency.toLowerCase() as Address,
    h = route.path[i];
  const zeroForOne = BigInt(from) < BigInt(to);
  return {
    key: {
      currency0: zeroForOne ? from : to,
      currency1: zeroForOne ? to : from,
      fee: h.fee,
      tickSpacing: h.tickSpacing,
      hooks: h.hooks,
    },
    zeroForOne,
  };
}
/** A v4 pool's id: keccak256(abi.encode(PoolKey)). */
export const poolId = (k: PoolKey): Hex =>
  keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }],
      [k.currency0, k.currency1, k.fee, k.tickSpacing, k.hooks],
    ),
  );
/** The PoolManager storage slot of a pool's Slot0 (v4-core StateLibrary: keccak256(poolId, 6)). */
export const slot0Slot = (id: Hex): Hex => keccak256(encodePacked(["bytes32", "uint256"], [id, 6n]));
/** A swap's fee in millionths from a Slot0 word: the LP fee (bits 208-231), Uniswap's protocol fee
 * for this direction (bits 184-207: 12 bits each way, zeroForOne the low ones), and what the swap
 * pays, protocol + LP − protocol × LP ÷ 1,000,000 (v4-core ProtocolFeeLibrary.calculateSwapFee). */
export function swapFee(slot0: bigint, zeroForOne: boolean) {
  const lp = Number((slot0 >> 208n) & 0xffffffn),
    both = Number((slot0 >> 184n) & 0xffffffn),
    protocol = zeroForOne ? both & 0xfff : both >> 12;
  return { lp, protocol, total: protocol + lp - Math.floor((protocol * lp) / 1_000_000) };
}
/** Millionths as a percentage, no trailing zeros: 10,000 → "1%", 625 → "0.0625%". */
export const feeWords = (pips: number) => `${String(+(pips / 10_000).toFixed(4))}%`;

const managerAbi = parseAbi(["function extsload(bytes32 slot) view returns (bytes32)"]);
/** A hop's live fee and price (Slot0's sqrtPriceX96, its low 160 bits). */
export type HopFee = { pool: string; lp: number; protocol: number; total: number; sqrtPriceX96: bigint };
/** Each hop's live fee and price, read from the PoolManager. */
export async function readHopFees(
  client: { readContract: (a: any) => Promise<any> },
  poolManager: Address,
  route: PayRoute,
): Promise<HopFee[]> {
  return Promise.all(
    route.path.map(async (h, i) => {
      const { key, zeroForOne } = hopKey(route, i);
      const word = await client.readContract({
        address: poolManager,
        abi: managerAbi,
        functionName: "extsload",
        args: [slot0Slot(poolId(key))],
      });
      // An uninitialized pool's Slot0 is empty: no price, no fee to name.
      if (BigInt(word) === 0n) throw Error(`${h.pool} is not open.`);
      return {
        pool: h.pool,
        ...swapFee(BigInt(word), zeroForOne),
        sqrtPriceX96: BigInt(word) & ((1n << 160n) - 1n),
      };
    }),
  );
}

/** The IMD `amountIn` buys at the pools' current prices, after their fees: what a buy too small to
 * move them gets. Each hop in its own direction at Slot0's price (currency0 in currency1 is
 * (sqrtPriceX96 ÷ 2^96)²), less its fee. On a fork of PLEA's deployment 0.0001 ETH got 0.0006% less
 * from the Quoter (POOL4's hook takes nothing on a buy): the gap the Quoter shows for a bigger amount
 * is the buy's own price impact. */
export function atPoolPrice(amountIn: bigint, route: PayRoute, hops: HopFee[]): bigint {
  let num = amountIn,
    den = 1n;
  hops.forEach((h, i) => {
    const square = h.sqrtPriceX96 * h.sqrtPriceX96,
      q192 = 1n << 192n;
    if (hopKey(route, i).zeroForOne) [num, den] = [num * square, den * q192];
    else [num, den] = [num * q192, den * square];
    [num, den] = [num * BigInt(1_000_000 - h.total), den * 1_000_000n];
  });
  return den ? num / den : 0n;
}
/** How much less the quote is than the pools' price (atPoolPrice), in basis points, rounded up. */
export const impactBps = (quoted: bigint, atPrice: bigint) =>
  atPrice > quoted ? Number(((atPrice - quoted) * 10_000n + atPrice - 1n) / atPrice) : 0;
/** From this price impact up the Buy page asks the buyer to confirm: IMD's ETH pool is shallow (on
 * 2026-10-29 the Quoter gave 1 ETH 5.76% less IMD than the pool's price after its fee, 0.01 ETH 0.06%). */
export const IMPACT_CONFIRM_BPS = 300;
/** IMD per whole unit of the route's currency (in IMD wei), at `out` for `amountIn`. */
export const perUnit = (out: bigint, amountIn: bigint, decimals: number) =>
  amountIn > 0n ? (out * 10n ** BigInt(decimals)) / amountIn : 0n;
/** The rate in words: "≈ 479.92 IMD per ETH, 5.74% below the price of IMD’s ETH pool (509.13 after its
 * fee)". Small rates (USDC's) keep four decimals. */
export function rateLine(route: PayRoute, pair: string, amountIn: bigint, quoted: bigint, atPrice: bigint) {
  const rate = (v: bigint) => {
    const unit = perUnit(v, amountIn, route.decimals),
      digits = unit >= 10n ** 19n ? 2 : 4,
      cut = unit / 10n ** BigInt(18 - digits),
      scale = 10n ** BigInt(digits);
    return `${(cut / scale).toLocaleString("en-US")}.${(cut % scale).toString().padStart(digits, "0")}`;
  };
  const pools = route.path.map((h) => h.pool),
    one = pools.length === 1,
    bps = impactBps(quoted, atPrice);
  return `≈ ${rate(quoted)} ${pair} per ${route.symbol}, ${(bps / 100).toFixed(2)}% below the ${one ? "price" : "prices"} of ${pools.join(" and ")} (${rate(atPrice)} after ${one ? "its fee" : "their fees"}).`;
}

/** The price impact in what the buyer gets: "8.13% less IMD than at the pool’s price" (USDC's two pools:
 * "pools’ prices"). Not "below the price", which reads like a discount: 8.13% less IMD is about 8.9%
 * more paid for each IMD. */
export const impactWords = (route: PayRoute, pair: string, bps: number) =>
  `${(bps / 100).toFixed(2)}% less ${pair} than at the ${route.path.length > 1 ? "pools’ prices" : "pool’s price"}`;

/** A currency's name in a route's words: ETH, the pool currency, or another route's symbol. */
export function symbolOf(c: string, routes: PayRoute[], pair: string) {
  if (isNative(c)) return "ETH";
  if (routes.length && c.toLowerCase() === routeEnd(routes[0]).toLowerCase()) return pair;
  return routes.find((x) => x.currency.toLowerCase() === c.toLowerCase())?.symbol ?? "tokens";
}
/** The route in one line: "ETH buys IMD on IMD’s ETH pool (1% fee) and the IMD buys PLEA (2.25%
 * fees), in one transaction." Fees: the live ones, else the pool keys' LP fees. */
export function routeLine(route: PayRoute, routes: PayRoute[], pair: string, pleaFee: string, fees?: HopFee[]) {
  const hops = route.path.map((h, i) => {
    const from = symbolOf(i ? route.path[i - 1].currency : route.currency, routes, pair),
      to = symbolOf(h.currency, routes, pair);
    return `${i ? `the ${from}` : from} buys ${to} on ${h.pool} (${feeWords(fees?.[i]?.total ?? h.fee)} fee)`;
  });
  return `${hops.join(", ")} and the ${pair} buys PLEA (${pleaFee} fees), in one transaction.`;
}

/** Why the Quoter refused (plain words, no RPC terms: a read error with these words reads as itself,
 * rpc-health.ts explainReadError). The Buy page blocks on it and offers no approval. */
export const routeRefusal = (message: string | undefined) =>
  !!message && / cannot fill this amount\.|found no way to swap /.test(message);

/** The IMD that `amountIn` of the route's currency buys at the pools' current prices (Uniswap's V4
 * Quoter: an eth_call, nothing is sent). A refusal (a pool that cannot fill the amount, a pool that
 * reverts) is a plain Error the page shows as the reason; an RPC failure is thrown as it came. */
export async function quoteToImd(
  client: { simulateContract: (a: any) => Promise<any> },
  quoter: Address,
  route: PayRoute,
  amountIn: bigint,
  pair: string,
): Promise<bigint> {
  if (amountIn >= 1n << 128n)
    throw Error(`${route.path[0].pool} cannot fill this amount. Lower it, or pay with ${pair}.`);
  try {
    const { result } = await client.simulateContract({
      address: quoter,
      abi: v4QuoterAbi,
      functionName: "quoteExactInput",
      args: [{ exactCurrency: route.currency, path: routeToImd(route), exactAmount: amountIn }],
    });
    return BigInt(result[0]);
  } catch (e) {
    const revert =
      e instanceof BaseError
        ? (e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null)
        : null;
    if (!revert) throw e;
    if (revert.data?.errorName === "NotEnoughLiquidity") {
      const id = String(revert.data.args?.[0]).toLowerCase(),
        hop = route.path.find((_, i) => poolId(hopKey(route, i).key) === id);
      throw Error(
        `${hop?.pool ?? "A pool on the way"} cannot fill this amount. Lower it, or pay with ${pair}.`,
      );
    }
    throw Error(
      `Uniswap’s Quoter found no way to swap this ${route.symbol} into ${pair} through ${route.path
        .map((h) => h.pool)
        .join(" and ")}. Pay with ${pair}, or try again later.`,
    );
  }
}

/** The gas limit a routed buy is sent with, which the wallet must cover at its max fee: the site sends
 * 1.3 × the estimate, and a routed buy estimates at about 1.7M gas (1,689,555 for ETH, 1,728,084 for
 * USDC on a fork of PLEA's deployment: PleaHook refuses a swap that reaches it with less than 1,400,000
 * gas left, so the estimate sits far above the 540,000 to 980,000 gas a buy used there). */
export const ROUTE_GAS = 2_400_000n;
/** A wallet's own tip, for a wallet that ignores the fees the site sends: MetaMask's default ("Market",
 * its gas API's medium) asked 2 gwei on 2026-10-29 (a 2.40 gwei max fee at a 0.28 gwei base fee), and
 * the same when it was read again. The site's tip is the market's (marketTip), which is usually far
 * less; Max still keeps enough for this one (gasReserve). Also the tip sent when the fee history
 * cannot be read. */
export const WALLET_TIP = 2_000_000_000n;
/** The fee history the site's tip is read from: the last TIP_BLOCKS blocks, each block's
 * TIP_PERCENTILE-th percentile tip (eth_feeHistory weighs it by gas). */
export const TIP_BLOCKS = 20,
  TIP_PERCENTILE = 75;
/** The market tip from eth_feeHistory: the median of the blocks' TIP_PERCENTILE-th percentile tips
 * (blocks with no transactions say nothing and are left out), at least the node's own
 * eth_maxPriorityFeePerGas. On 2026-10-29 the last 20 blocks' 75th percentiles read 0.12 to 2 gwei
 * (median 0.72 gwei; their medians 0.01 to 0.21 gwei) while the RPCs' eth_maxPriorityFeePerGas read
 * 46,119 wei (tenderly 0). WALLET_TIP when there is no history to read. */
export function marketTip(
  history: { reward?: bigint[][]; gasUsedRatio: number[] } | undefined,
  nodeTip: bigint,
): bigint {
  const tips = (history?.reward ?? [])
    .filter((_, i) => (history?.gasUsedRatio[i] ?? 0) > 0)
    .map((r) => r[0])
    .filter((t): t is bigint => typeof t === "bigint")
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (!tips.length) return nodeTip > WALLET_TIP ? nodeTip : WALLET_TIP;
  const mid = tips.length >> 1,
    median = tips.length % 2 ? tips[mid] : (tips[mid - 1] + tips[mid]) / 2n;
  return median > nodeTip ? median : nodeTip;
}
/** The fees a routed ETH buy is sent with (the base fee they were worked out at, for fitFees). */
export type RouteFees = { baseFee: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
/** The tip: the market's (marketTip); the max fee: twice the base fee plus the tip (room for the base
 * fee to double before the buy is mined). The site sends both with a routed ETH buy, and a wallet
 * uses the fees a site suggests (MetaMask marks them "Site suggested"). */
export function routeFees(baseFee: bigint, tip: bigint): RouteFees {
  return { baseFee, maxFeePerGas: 2n * baseFee + tip, maxPriorityFeePerGas: tip };
}
/** routeFees at the latest block's base fee and the market's tip (the fee history of the last
 * TIP_BLOCKS blocks, at least the RPC's eth_maxPriorityFeePerGas). */
export async function readRouteFees(client: {
  getBlock: () => Promise<{ baseFeePerGas: bigint | null }>;
  estimateMaxPriorityFeePerGas: () => Promise<bigint>;
  getFeeHistory: (a: {
    blockCount: number;
    rewardPercentiles: number[];
  }) => Promise<{ reward?: bigint[][]; gasUsedRatio: number[] }>;
}): Promise<RouteFees> {
  const [block, nodeTip, history] = await Promise.all([
    client.getBlock(),
    client.estimateMaxPriorityFeePerGas().catch(() => 0n),
    client
      .getFeeHistory({ blockCount: TIP_BLOCKS, rewardPercentiles: [TIP_PERCENTILE] })
      .catch(() => undefined),
  ]);
  return routeFees(block.baseFeePerGas ?? 0n, marketTip(history, nodeTip));
}
/** The ETH Max keeps for the gas: ROUTE_GAS at twice the base fee plus the larger of the tip sent and
 * WALLET_TIP, so it also covers a wallet that ignores the site's fees and uses its own default. */
export const gasReserve = (fees: RouteFees) =>
  ROUTE_GAS *
  (2n * fees.baseFee +
    (fees.maxPriorityFeePerGas > WALLET_TIP ? fees.maxPriorityFeePerGas : WALLET_TIP));
/** The most a routed ETH buy holds for gas at the fees it is sent with: ROUTE_GAS at their max fee. */
export const gasHeld = (fees: RouteFees) => ROUTE_GAS * fees.maxFeePerGas;
/** The fees sent with a routed ETH buy that leaves `left` ETH beside its value: `fees` when `left`
 * covers them at ROUTE_GAS (gasHeld; Max leaves more, gasReserve); when it does not (the base fee
 * rose since Max, or a typed amount leaves less), the max fee `left` covers at ROUTE_GAS, as long as
 * that still pays the base fee and the tip, so the next block can take the buy. Undefined when even
 * that is short: the ETH left cannot pay the chain's fee now for ROUTE_GAS, and nothing is sent. */
export function fitFees(fees: RouteFees, left: bigint): RouteFees | undefined {
  if (left >= gasHeld(fees)) return fees;
  const most = left / ROUTE_GAS;
  return most >= fees.baseFee + fees.maxPriorityFeePerGas ? { ...fees, maxFeePerGas: most } : undefined;
}
/** Max for native ETH: the balance less the gas reserve, rounded down to 0.0001 ETH so the field shows
 * exactly what is paid; 0 when the balance does not cover the gas. */
export const ethMax = (balance: bigint, reserve: bigint) =>
  balance > reserve ? ((balance - reserve) / 10n ** 14n) * 10n ** 14n : 0n;

/** The Buy page's "Pay with" choice, per browser: PAY_PAIR (the pool currency, IMD: the main way to
 * buy) or a route's symbol (ETH, USDC: extra options). */
export const PAY_KEY = "plea-pay-with",
  PAY_PAIR = "pair";
/** The choices in their order: the pool currency first, then the routes. */
export const payChoices = (routes: PayRoute[]) => [PAY_PAIR, ...routes.map((x) => x.symbol)];
/** The choice this browser starts with: a route the visitor picked before (stored by rememberPay),
 * else the pool currency: on a first visit, and whenever storage is empty, blocked or holds a route
 * this network does not have. */
export function storedPay(routes: PayRoute[], storage: () => Pick<Storage, "getItem"> = () => localStorage) {
  let v: string | null = null;
  try {
    v = storage().getItem(PAY_KEY);
  } catch {}
  return routes.some((x) => x.symbol === v) ? v! : PAY_PAIR;
}
/** Remembers a choice the visitor made (nothing is stored before one). Storage that is blocked or full
 * is a convenience lost, never an error. */
export function rememberPay(v: string, storage: () => Pick<Storage, "setItem"> = () => localStorage) {
  try {
    storage().setItem(PAY_KEY, v);
  } catch {}
}
