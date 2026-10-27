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
 * The swap struct differs between router versions: v2.1.x (Uniswap's current deployments) has
 * `minHopPriceX36`; v2 does not. Each reverts with the other's encoding, so the network config names
 * the router and its struct. */
import { encodeAbiParameters, encodePacked, parseAbi, type Address, type Hex } from "viem";

export const UR_COMMANDS = { BALANCE_CHECK_ERC20: 0x0e, V4_SWAP: 0x10 } as const;
export const V4_ACTIONS = { SWAP_EXACT_IN_SINGLE: 0x06, SETTLE_ALL: 0x0c, TAKE_ALL: 0x0f } as const;
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
