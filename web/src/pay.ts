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
export type HopFee = { pool: string; lp: number; protocol: number; total: number };
/** Each hop's live fee, read from the PoolManager. */
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
      return { pool: h.pool, ...swapFee(BigInt(word), zeroForOne) };
    }),
  );
}

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
 * gas left, so the estimate sits far above the 540,000 to 760,000 gas a buy uses). */
export const ROUTE_GAS = 2_400_000n;
/** The ETH a routed buy leaves for gas: ROUTE_GAS at twice the base fee plus the tip (what a wallet
 * usually allows as its max fee), so Max never spends what the wallet will ask to hold for gas. */
export async function gasReserve(client: {
  getBlock: () => Promise<{ baseFeePerGas: bigint | null }>;
  estimateMaxPriorityFeePerGas: () => Promise<bigint>;
}): Promise<bigint> {
  const [block, tip] = await Promise.all([
    client.getBlock(),
    client.estimateMaxPriorityFeePerGas().catch(() => 1_000_000_000n),
  ]);
  return ROUTE_GAS * (2n * (block.baseFeePerGas ?? 0n) + tip);
}
/** Max for native ETH: the balance less the gas reserve, rounded down to 0.0001 ETH so the field shows
 * exactly what is paid; 0 when the balance does not cover the gas. */
export const ethMax = (balance: bigint, reserve: bigint) =>
  balance > reserve ? ((balance - reserve) / 10n ** 14n) * 10n ** 14n : 0n;
