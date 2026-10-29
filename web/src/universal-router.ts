/** Uniswap's Universal Router path for PLEA on Ethereum (PoolSwapTest exists only on Sepolia).
 *
 * A buy is one `execute`: V4_SWAP (SWAP_EXACT_IN_SINGLE with hookData = abi.encode(buyer) and
 * amountOutMinimum 0, SETTLE_ALL of the IMD through Permit2, TAKE_ALL of the PLEA with 0), then
 * BALANCE_CHECK_ERC20 on the buyer's PLEA. While the Cabal lives the hook takes the whole PLEA output
 * to the buyer, so the router sees 0 PLEA: the minimum is enforced by the balance check, which reverts
 * the whole transaction when the buyer holds less than `balance before + minimum`. After the death the
 * same calldata works (the router takes the PLEA to the buyer; the check still holds).
 * A sell (only after the death) is V4_SWAP with SETTLE_ALL of the PLEA and TAKE_ALL of the IMD with the
 * minimum. Both were checked on an anvil fork of Ethereum against PLEA's mainnet build.
 *
 * A buy paid in another currency (encodeBuyVia: ETH or USDC on Ethereum) is the same two commands
 * with SWAP_EXACT_IN over a v4 path: the currency → IMD on its own pools (ETH through IMD's ETH pool;
 * USDC first through the USDC/ETH pool), then IMD → PLEA on PLEA's pool with hookData =
 * abi.encode(buyer); SETTLE_ALL pays the currency (native ETH from the transaction's value, an ERC-20
 * through Permit2), TAKE_ALL takes PLEA with 0, and BALANCE_CHECK_ERC20 holds the minimum. Checked
 * on an anvil fork of Ethereum at PLEA's real deployment: 0.05 ETH bought exactly the PLEA a direct
 * buy with the 25.379 IMD the V4 Quoter named for the first hop would have.
 *
 * The swap struct differs between router versions: v2.1.x (Uniswap's current deployments) has
 * `minHopPriceX36`; v2 does not. Each reverts with the other's encoding, so the network config names
 * the router and its struct. */
import { encodeAbiParameters, encodePacked, parseAbi, type Address, type Hex } from "viem";

export const UR_COMMANDS = { BALANCE_CHECK_ERC20: 0x0e, V4_SWAP: 0x10 } as const;
export const V4_ACTIONS = {
  SWAP_EXACT_IN_SINGLE: 0x06,
  SWAP_EXACT_IN: 0x07,
  SETTLE_ALL: 0x0c,
  TAKE_ALL: 0x0f,
} as const;
/** Native ETH as a v4 currency. */
export const NATIVE = "0x0000000000000000000000000000000000000000" as Address;
export const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3" as Address;

export const universalRouterAbi = parseAbi([
  "function execute(bytes commands, bytes[] inputs, uint256 deadline) payable",
  "error ExecutionFailed(uint256 commandIndex, bytes message)",
  "error TransactionDeadlinePassed()",
  "error LengthMismatch()",
  "error BalanceTooLow()",
  "error V4TooLittleReceived(uint256 minAmountOutReceived, uint256 amountReceived)",
  "error V4TooMuchRequested(uint256 maxAmountInRequested, uint256 amountRequested)",
  "error DeltaNotPositive(address currency)",
  "error DeltaNotNegative(address currency)",
  "error InsufficientBalance()",
]);
export const permit2Abi = parseAbi([
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
  "function allowance(address user, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
  "error AllowanceExpired(uint256 deadline)",
  "error InsufficientAllowance(uint256 amount)",
]);

export type PoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};
export type RouterSpec = { address: Address; minHopPrice: boolean };
/** One hop of a v4 path (v4-periphery PathKey): the currency it ends in and the pool's other fields. */
export type PathKey = {
  intermediateCurrency: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
  hookData: Hex;
};

const keyType = {
  type: "tuple",
  components: [
    { name: "currency0", type: "address" },
    { name: "currency1", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
  ],
} as const;
const swapType = (minHopPrice: boolean) =>
  ({
    type: "tuple",
    components: [
      { name: "poolKey", ...keyType },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint128" },
      { name: "amountOutMinimum", type: "uint128" },
      ...(minHopPrice ? [{ name: "minHopPriceX36", type: "uint256" }] : []),
      { name: "hookData", type: "bytes" },
    ],
  }) as const;
const pathKeyType = {
  type: "tuple[]",
  components: [
    { name: "intermediateCurrency", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
    { name: "hookData", type: "bytes" },
  ],
} as const;
/** v4-periphery's ExactInputParams; v2.1.x adds one minimum hop price per hop after the path. */
const exactInType = (minHopPrice: boolean) =>
  ({
    type: "tuple",
    components: [
      { name: "currencyIn", type: "address" },
      { name: "path", ...pathKeyType },
      ...(minHopPrice ? [{ name: "minHopPriceX36", type: "uint256[]" }] : []),
      { name: "amountIn", type: "uint128" },
      { name: "amountOutMinimum", type: "uint128" },
    ],
  }) as const;
const pair = (a: Address, n: bigint) =>
  encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [a, n]);

function v4Swap(
  router: RouterSpec,
  key: PoolKey,
  zeroForOne: boolean,
  amountIn: bigint,
  amountOutMinimum: bigint,
  trader: Address,
  input: Address,
  output: Address,
  takeMinimum: bigint,
): Hex {
  const params = {
    poolKey: key,
    zeroForOne,
    amountIn,
    amountOutMinimum,
    ...(router.minHopPrice ? { minHopPriceX36: 0n } : {}),
    hookData: encodeAbiParameters([{ type: "address" }], [trader]),
  };
  const actions = encodePacked(
    ["uint8", "uint8", "uint8"],
    [V4_ACTIONS.SWAP_EXACT_IN_SINGLE, V4_ACTIONS.SETTLE_ALL, V4_ACTIONS.TAKE_ALL],
  );
  return encodeAbiParameters(
    [{ type: "bytes" }, { type: "bytes[]" }],
    [
      actions,
      [
        encodeAbiParameters([swapType(router.minHopPrice)] as any, [params] as any),
        pair(input, amountIn),
        pair(output, takeMinimum),
      ],
    ],
  );
}

/** A buy of PLEA with exactly `amountIn` IMD; reverts unless the buyer ends with at least
 * `pleaBalance + minPleaOut` PLEA. `imd` is the pool's IMD currency. */
export function encodeBuy(o: {
  router: RouterSpec;
  key: PoolKey;
  imd: Address;
  buyer: Address;
  amountIn: bigint;
  minPleaOut: bigint;
  pleaBalance: bigint;
}): { commands: Hex; inputs: Hex[] } {
  const imdIsZero = o.key.currency0.toLowerCase() === o.imd.toLowerCase();
  const plea = imdIsZero ? o.key.currency1 : o.key.currency0;
  return {
    commands: encodePacked(["uint8", "uint8"], [UR_COMMANDS.V4_SWAP, UR_COMMANDS.BALANCE_CHECK_ERC20]),
    inputs: [
      v4Swap(o.router, o.key, imdIsZero, o.amountIn, 0n, o.buyer, o.imd, plea, 0n),
      encodeAbiParameters(
        [{ type: "address" }, { type: "address" }, { type: "uint256" }],
        [o.buyer, plea, o.pleaBalance + o.minPleaOut],
      ),
    ],
  };
}

/** A buy of PLEA with exactly `amountIn` of `currencyIn` (NATIVE: ETH, paid as the transaction's
 * `value`; an ERC-20 through Permit2) along `path`, whose last hop is PLEA's pool with hookData =
 * abi.encode(buyer). Reverts unless the buyer ends with at least `pleaBalance + minPleaOut` PLEA: while
 * the Cabal lives PLEA's hook sends the PLEA straight to the buyer, so the router (and Uniswap's
 * Quoter) see 0 PLEA, and the minimum is the balance check's. */
export function encodeBuyVia(o: {
  router: RouterSpec;
  currencyIn: Address;
  path: PathKey[];
  plea: Address;
  buyer: Address;
  amountIn: bigint;
  minPleaOut: bigint;
  pleaBalance: bigint;
}): { commands: Hex; inputs: Hex[]; value: bigint } {
  const last = o.path.at(-1);
  if (!last || last.intermediateCurrency.toLowerCase() !== o.plea.toLowerCase())
    throw Error("The path must end in PLEA.");
  const params = {
    currencyIn: o.currencyIn,
    path: o.path,
    ...(o.router.minHopPrice ? { minHopPriceX36: o.path.map(() => 0n) } : {}),
    amountIn: o.amountIn,
    amountOutMinimum: 0n,
  };
  const actions = encodePacked(
    ["uint8", "uint8", "uint8"],
    [V4_ACTIONS.SWAP_EXACT_IN, V4_ACTIONS.SETTLE_ALL, V4_ACTIONS.TAKE_ALL],
  );
  return {
    commands: encodePacked(["uint8", "uint8"], [UR_COMMANDS.V4_SWAP, UR_COMMANDS.BALANCE_CHECK_ERC20]),
    inputs: [
      encodeAbiParameters(
        [{ type: "bytes" }, { type: "bytes[]" }],
        [
          actions,
          [
            encodeAbiParameters([exactInType(o.router.minHopPrice)] as any, [params] as any),
            pair(o.currencyIn, o.amountIn),
            pair(o.plea, 0n),
          ],
        ],
      ),
      encodeAbiParameters(
        [{ type: "address" }, { type: "address" }, { type: "uint256" }],
        [o.buyer, o.plea, o.pleaBalance + o.minPleaOut],
      ),
    ],
    value: o.currencyIn.toLowerCase() === NATIVE ? o.amountIn : 0n,
  };
}

/** Uniswap's V4 Quoter: what an exact input buys along a path, simulated through every pool and hook
 * (an eth_call; it never sends). NotEnoughLiquidity names a pool that cannot fill the whole input. */
export const v4QuoterAbi = [
  {
    type: "function",
    name: "quoteExactInput",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "exactCurrency", type: "address" },
          { name: "path", ...pathKeyType },
          { name: "exactAmount", type: "uint128" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
  { type: "error", name: "NotEnoughLiquidity", inputs: [{ name: "poolId", type: "bytes32" }] },
  { type: "error", name: "UnexpectedRevertBytes", inputs: [{ name: "revertData", type: "bytes" }] },
] as const;

/** A sell of exactly `amountIn` PLEA for at least `minImdOut` IMD (only after the Cabal's death). */
export function encodeSell(o: {
  router: RouterSpec;
  key: PoolKey;
  imd: Address;
  seller: Address;
  amountIn: bigint;
  minImdOut: bigint;
}): { commands: Hex; inputs: Hex[] } {
  const imdIsZero = o.key.currency0.toLowerCase() === o.imd.toLowerCase();
  const plea = imdIsZero ? o.key.currency1 : o.key.currency0;
  return {
    commands: encodePacked(["uint8"], [UR_COMMANDS.V4_SWAP]),
    inputs: [v4Swap(o.router, o.key, !imdIsZero, o.amountIn, o.minImdOut, o.seller, plea, o.imd, o.minImdOut)],
  };
}

/** What a Permit2 allowance still lets the router spend at `now` (seconds): 0 once expired. */
export function permit2Spendable(
  allowance: readonly [bigint, number, number] | { amount: bigint; expiration: number },
  now: number,
): bigint {
  const [amount, expiration] = Array.isArray(allowance)
    ? [allowance[0], allowance[1]]
    : [(allowance as any).amount, (allowance as any).expiration];
  return Number(expiration) > now ? BigInt(amount) : 0n;
}
