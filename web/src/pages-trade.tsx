import { site } from "./site";
import { DisplayError, NO_FUNDS } from "./errors";
import {
  pendingState,
  feeDisplay,
  LETTERBOX,
  Q96,
  ceil,
  min as minBig,
  max as maxBig,
  sharePoints,
  factParts,
  factTerms,
  autoSellBlock,
  feeSaleShort,
} from "./models";
import { appealClosedWhy, returnedEscrow } from "./appeal";
import {
  estimateHookOutput,
  priceLimit,
  bandOf,
  bandImd,
  pleaIsZero,
  swapZeroForOne,
  unpackDelta,
  LIQUIDITY_SHORT,
  NO_LIQUIDITY,
  minimumOf,
  sendMinimum,
} from "./swap-math";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  encodeAbiParameters,
  encodeFunctionData,
  decodeEventLog,
  parseAbi,
  parseUnits,
  formatUnits,
  type Address,
} from "viem";
import { useApp, useRead, useTx, receiptEvents } from "./context";
import { erc20Abi, swapAbi, resetHealth } from "./config";
import { cashbackWords, sellGateWarning } from "./site";
import { tradeSteps } from "./trade-text";
import {
  encodeBuy,
  encodeBuyVia,
  encodeSell,
  permit2Abi,
  permit2Spendable,
  universalRouterAbi,
} from "./universal-router";
import {
  atPoolPrice,
  buyPath,
  ethMax,
  feeWords,
  gasReserve,
  impactBps,
  IMPACT_CONFIRM_BPS,
  isNative,
  quoteToImd,
  rateLine,
  readHopFees,
  routeLine,
  routeRefusal,
} from "./pay";
import type { PayRoute } from "./site";
import {
  amount,
  pct,
  signedPercent,
  openPleaNotice,
  openPleaParts,
  perMillion,
  NO_PRICE,
  exactAmount,
  feeInPlea,
  feeInPleaText,
  clock,
  span,
  smallAmount,
  short,
  con,
  read,
  readPlea,
  tokenAmount,
  duration,
  heldTime,
  utc,
  val,
  cashback,
} from "./chain";
import {
  Action,
  Icon,
  FactCells,
  Stamp,
  AmountInput,
  ApprovedAction,
  Costs,
  Empty,
  Meter,
  Notice,
  Panel,
  PleaCard,
  TextBox,
  Title,
  TradingGate,
  textCheck,
  Countdown,
} from "./components";
/** How long a Permit2 allowance for the router lasts, and a router trade's deadline: 30 minutes. */
const PERMIT_LIFE = 1800;
/** The Buy page's "Pay with" choice, per browser (a route's symbol, or PAY_PAIR for the pool
 * currency): a convenience only, so a blocked or empty storage falls back to the first route. */
const PAY_KEY = "plea-pay-with",
  PAY_PAIR = "pair";
function storedPayWith(routes: PayRoute[]) {
  let v: string | null = null;
  try {
    v = localStorage.getItem(PAY_KEY);
  } catch {}
  return v === PAY_PAIR || routes.some((x) => x.symbol === v)
    ? v!
    : routes[0]?.symbol ?? PAY_PAIR;
}
export function parseAmount(s: string, decimals = 18) {
  try {
    s = s.replaceAll(",", "");
    if (!/^\d+(\.\d*)?$/.test(s)) return 0n;
    return parseUnits(s, decimals);
  } catch {
    return 0n;
  }
}
export function WalletBalances() {
  const { r, s, now } = useApp();
  const { address } = useAccount();
  const result = useRead(
    async () => {
      const [
        plea,
        pair,
        basis,
        pending,
        executed,
        denied,
        lapsed,
        last,
        name,
        seat,
        claims,
      ] = await Promise.all([
        read(r, "PLEA", "balanceOf", [address]),
        read(r, "PairToken", "balanceOf", [address]),
        read(r, "PleaHook", "basisOf", [address]),
        read(r, "CabalGate", "pendingOf", [address]),
        read(r, "CabalGate", "lastExecutedAt", [address]),
        read(r, "CabalGate", "lastDeniedAt", [address]),
        read(r, "CabalGate", "lastLapsedAt", [address]),
        read(r, "CabalGate", "lastPleaOf", [address]),
        read(r, "Letterbox", "nameOf", [address]),
        read(r, "Seasons", "holdsSeat", [address]),
        r.client.readContract({
          address: r.network.uniswapV4.poolManager,
          abi: [
            {
              type: "function",
              name: "balanceOf",
              stateMutability: "view",
              inputs: [{ type: "address" }, { type: "uint256" }],
              outputs: [{ type: "uint256" }],
            },
          ],
          functionName: "balanceOf",
          args: [address!, BigInt(r.addresses.PairToken)],
        }),
      ]);
      const pendingPlea = pending
        ? await readPlea(r, pending, val(s, "CabalGate.intake"))
        : undefined;
      return {
        pendingPlea: pendingPlea ? { ...pendingPlea, id: pending } : undefined,
        plea,
        pair,
        basis,
        pending,
        executed,
        denied,
        lapsed,
        last,
        name,
        seat,
        claims,
        cooldown:
          Math.max(Number(executed), Number(denied), Number(lapsed)) +
          Number(con(s, "CabalGate.COOLDOWN")),
      };
    },
    [address],
    !!address && !!s,
  );
  if (result.data) {
    const state = pendingState(
      result.data.pendingPlea,
      now,
      Number(con(s, "CabalGate.EXECUTE_WINDOW")),
      Number(con(s, "CabalGate.PENDING_EXPIRY")),
      Number(result.data.lapsed),
    );
    return {
      ...result,
      data: {
        ...result.data,
        ...state,
        cooldownCause:
          Number(result.data.executed) >=
          Math.max(Number(result.data.denied), state.lapsedAt)
            ? "sale"
            : Number(result.data.denied) >= state.lapsedAt
              ? "denied plea"
              : "plea lapsed",
        cooldown:
          Math.max(
            Number(result.data.executed),
            Number(result.data.denied),
            state.lapsedAt,
          ) + Number(con(s, "CabalGate.COOLDOWN")),
      },
    };
  }
  return result as typeof result & { data?: any };
}
const transferAbi = parseAbi([
  "event Transfer(address indexed from,address indexed to,uint256 value)",
]);
export async function poolQuote(
  r: any,
  s: any,
  raw: bigint,
  selling: boolean,
  extra?: bigint,
) {
  const [sqrt, market, wall, liveExtra] = await Promise.all([
    read(r, "PleaHook", "currentSqrtPriceX96"),
    read(r, "PleaHook", "market"),
    read(r, "PleaHook", "wall"),
    read(r, "PleaHook", "launchExtraBps"),
  ]);
  const launchExtra = extra ?? BigInt(liveExtra),
    key = val(s, "PleaHook.poolKey");
  return estimateHookOutput({
    amount: raw,
    // The pool key decides the direction: imdTEST is currency0 on Sepolia run 9, PLEA may be on
    // Ethereum (a buy is then oneForZero).
    zeroForOne: swapZeroForOne(selling, pleaIsZero(key, r.addresses.PLEA)),
    sqrt,
    // v4's steps also end at its tick bitmap's word ends: the walk stops there too.
    tickSpacing: Number(key.tickSpacing),
    bands: [bandOf(market), bandOf(wall)],
    inputBps: BigInt(
      selling
        ? con(s, "PleaHook.PLEA_BURN_BPS")
        : BigInt(con(s, "PleaHook.IMD_FEE_BPS")) + launchExtra,
    ),
    outputBps: BigInt(
      con(s, selling ? "PleaHook.IMD_FEE_BPS" : "PleaHook.PLEA_BURN_BPS"),
    ),
  });
}
export function Buy() {
  const { r, s, now, toast } = useApp(),
    { address } = useAccount(),
    balance = WalletBalances();
  const routes = site().pay?.routes ?? [];
  const [input, setInput] = useState(""),
    [selling, setSelling] = useState(false),
    [payWith, setPayWith] = useState(() => storedPayWith(routes)),
    [maxNote, setMaxNote] = useState(""),
    [slip, setSlip] = useState(100),
    [revision, setRevision] = useState(0),
    [approved, setApproved] = useState(false),
    [fill, setFill] = useState(""),
    [maxRaw, setMaxRaw] = useState<bigint>();
  // "Pay with" ETH or USDC (Ethereum): the route's currency is swapped into IMD on its own pools,
  // then IMD into PLEA, in one router transaction; selling always takes IMD.
  const route = selling ? undefined : routes.find((x) => x.symbol === payWith),
    native = !!route && isNative(route.currency),
    decimals = route ? route.decimals : 18;
  const tx = useTx(`${input}:${selling}:${slip}:${maxRaw}:${route?.symbol ?? ""}`),
    dead = !!val(s, "CabalGate.diedAt"),
    seeded = !!val(s, "PleaHook.seeded"),
    pair = s?.constants.pairSymbol || site().pairSymbol,
    unit = selling ? "PLEA" : route ? route.symbol : pair,
    raw = maxRaw ?? parseAmount(input, decimals);
  const payBalance = useRead(
    async () =>
      (native
        ? r.client.getBalance({ address: address! })
        : r.client.readContract({
            address: route!.currency,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address!],
          })) as Promise<bigint>,
    [address, route?.symbol],
    !!address && !!s && !!route,
  );
  // The ETH a routed buy leaves for gas (Max keeps it; a typed amount that leaves less is warned).
  const reserve = useRead(() => gasReserve(r.client), [address], !!address && !!s && native);
  const inputToken = selling
      ? r.addresses.PLEA
      : route
        ? route.currency
        : r.addresses.PairToken,
    available = selling
      ? balance.data?.plea
      : route
        ? payBalance.data
        : balance.data?.pair;
  /** An amount in the paying currency: "0.05 ETH", "150.00 USDC". */
  const payAmount = (v: bigint | undefined, mode: "down" | "up" = "down") =>
    route
      ? `${amount(v, route.decimals, native ? 4 : 2, mode)} ${route.symbol}`
      : tokenAmount(v, s, !selling, selling ? 0 : 2, mode);
  /** The other currencies this page can pay with, for a wallet that has none of this one. */
  const others = routes.length
    ? [...routes.map((x) => x.symbol), pair].filter((v) => v !== unit)
    : [];
  function choosePay(v: string, remember = true) {
    setPayWith(v);
    if (remember)
      try {
        localStorage.setItem(PAY_KEY, v);
      } catch {}
    // The field's number meant the old currency: start again rather than reread it.
    setInput("");
    setMaxRaw(undefined);
    setMaxNote("");
  }
  const launch = Number(val(s, "PleaHook.launchedAt")),
    window = Number(con(s, "PleaHook.LAUNCH_WINDOW")),
    launchActive = !!val(s, "PleaHook.seeded") && now < launch + window;
  const extra = launchActive
    ? BigInt(
        Math.floor(
          (Number(con(s, "PleaHook.LAUNCH_EXTRA_BPS")) *
            (launch + window - now)) /
            window,
        ),
      )
    : 0n;
  const tradeDone = tx.done && !approved;
  const [frozenQuote, setFrozenQuote] = useState<any>();
  // A route's quote: Uniswap's V4 Quoter for the part up to IMD, then the site's own walk of PLEA's
  // pool for that IMD (the Quoter reads 0 PLEA there while the Cabal lives). `imd` is the PLEA leg's
  // input either way.
  const legQuote = async (launchExtra?: bigint) => {
    const imd = route
      ? await quoteToImd(r.client, site().pay!.quoter, route, raw, pair)
      : raw;
    return { ...(await poolQuote(r, s!, imd, selling, launchExtra)), imd };
  };
  const liveQuote = useRead(
    async () => {
      const key = val(s, "PleaHook.poolKey"),
        zeroForOne =
          key.currency0.toLowerCase() ===
          (selling ? r.addresses.PLEA : r.addresses.PairToken).toLowerCase(),
        hookData = address
          ? encodeAbiParameters([{ type: "address" }], [address])
          : "0x";
      // A route's pools at their current prices, read with the quote: what the IMD would be without
      // the buy's own price impact (atPoolPrice).
      const [estimate, hops] = await Promise.all([
        legQuote(extra),
        route
          ? readHopFees(r.client, r.network.uniswapV4.poolManager, route)
          : undefined,
      ]);
      const atPrice = hops && route ? atPoolPrice(raw, route, hops) : undefined;
      return { ...estimate, atPrice, key, zeroForOne, hookData, at: Date.now() };
    },
    [raw.toString(), selling, address, slip, revision, route?.symbol ?? ""],
    !!s && raw > 0n && !!val(s, "PleaHook.seeded") && !tradeDone,
  );
  // Each hop's live fee (the pools' LP fee and Uniswap's protocol fee), for the words.
  const hopFees = useRead(
    () => readHopFees(r.client, r.network.uniswapV4.poolManager, route!),
    [route?.symbol],
    !!s && !!route,
  );
  const quote =
    tradeDone && frozenQuote
      ? { ...liveQuote, data: frozenQuote, loading: false, error: "" }
      : liveQuote;
  /** The IMD the PLEA leg pays: the amount itself, or what the route's pools turn it into. */
  const legRaw: bigint = route ? (quote.data?.imd ?? 0n) : raw;
  // A route's price impact on its own pools (IMD's ETH pool is shallow): from IMPACT_CONFIRM_BPS up
  // the buyer confirms it, for this amount in this currency.
  const impact =
      route && quote.data?.atPrice !== undefined
        ? impactBps(quote.data.imd, quote.data.atPrice)
        : 0,
    impactKey = `${raw}:${route?.symbol ?? ""}`;
  const [impactOk, setImpactOk] = useState(""),
    confirmImpact = !tradeDone && impact >= IMPACT_CONFIRM_BPS,
    impactAccepted = impactOk === impactKey;
  // On Ethereum the Universal Router takes the input through Permit2: the token approves Permit2
  // (step 1), Permit2 allows the router for 30 minutes (step 2), then the trade. A step whose
  // allowance already covers the amount (and, for Permit2, has not expired) is skipped. On
  // Sepolia PoolSwapTest takes it directly: one approval, then the trade.
  const trade = site().trade,
    universal = trade.kind === "universalRouter",
    spender = trade.kind === "universalRouter" ? trade.permit2 : trade.router;
  const allowance = useRead(
    async () => {
      const [token, permit] = await Promise.all([
        r.client.readContract({
          address: inputToken,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address!, spender],
        }),
        trade.kind === "universalRouter"
          ? r.client.readContract({
              address: trade.permit2,
              abi: permit2Abi,
              functionName: "allowance",
              args: [address!, inputToken, trade.router],
            })
          : undefined,
      ]);
      return { token, permit };
    },
    [address, inputToken, revision],
    !!address && !!s && !native,
  );
  // An allowance that expires within the minute is renewed rather than raced. Native ETH needs
  // none: it is the transaction's value.
  const step: "token" | "permit2" | "trade" | undefined = native
    ? "trade"
    : allowance.data === undefined
      ? undefined
      : allowance.data.token < raw
        ? "token"
        : allowance.data.permit &&
            permit2Spendable(allowance.data.permit as any, now + 60) < raw
          ? "permit2"
          : "trade";
  const needsApproval = step === "token" || step === "permit2";
  // "Step 2 of 3": the steps this amount needed when it was entered, so the count holds while
  // the steps are done one by one.
  const planKey = `${address}:${selling}:${raw}:${unit}`,
    [plan, setPlan] = useState<{ key: string; total: number }>();
  const remaining =
    step === "token" ? (universal ? 3 : 2) : step === "permit2" ? 2 : 1;
  useEffect(() => {
    if (step && plan?.key !== planKey && !tx.busy)
      setPlan({ key: planKey, total: remaining });
  }, [planKey, step]);
  const total = plan?.key === planKey ? Math.max(plan.total, remaining) : remaining,
    stepNumber = total - remaining + 1;
  const cap = con(s, "PleaHook.LAUNCH_MAX_BUY"),
    capError =
      !tradeDone &&
      launchActive &&
      !selling &&
      quote.data &&
      quote.data.gross > cap
        ? `This buy would take ${tokenAmount(quote.data.gross, s)} before the burn. Until ${clock(launch + window)} one buy can take at most ${tokenAmount(cap, s)}. Pay less ${unit}, or split the buy in two.`
        : "";
  const invalid =
    !tradeDone && ((available !== undefined && raw > available) || !!capError);
  const amountReason = !val(s, "PleaHook.seeded")
    ? "Trading is not open yet."
    : raw <= 0n
      ? `Enter how much ${unit} to ${selling ? "sell" : "pay"}, or press Max. The quote and the fees show once there is an amount.`
      : available !== undefined && raw > available
        ? available === 0n
          ? // Max cannot help: another currency, or adding this one, can.
            selling
            ? "You have no PLEA to sell."
            : `You have ${payAmount(0n)}. Add ${unit}${others.length ? `, or pay with ${others.join(" or ")}` : ""}.`
          : `You have ${payAmount(available)}. Lower the amount or press Max.`
        : capError ||
          // A route the Quoter refused (a pool on the way cannot fill it): only another amount or
          // currency helps.
          (route && routeRefusal(quote.error) ? quote.error : "") ||
          // The pool cannot fill this amount at any price: no approval can help, so none is offered.
          (quote.error === LIQUIDITY_SHORT
            ? `Lower the amount: the pool cannot fill ${selling ? "this sale" : "this buy"}.`
            : quote.error === NO_LIQUIDITY
              ? selling
                ? `The pool has no ${pair} left to pay for a sale; nothing can be sold until someone buys.`
                : "The pool has no PLEA left to buy; nothing can be bought until someone sells."
              : "");
  const poolBlocked =
    quote.error === LIQUIDITY_SHORT ||
    quote.error === NO_LIQUIDITY ||
    (!!route && routeRefusal(quote.error));
  // Native ETH also pays the gas: an amount that leaves less than the reserve is warned (the wallet
  // has the last word on its own fee), Max never takes it.
  const gasLeft =
    native && available !== undefined && raw > 0n && raw <= available
      ? available - raw
      : undefined;
  const gasNote =
    !tradeDone && gasLeft !== undefined && reserve.data !== undefined && gasLeft < reserve.data
      ? `This leaves ${amount(gasLeft, 18, 4)} ETH; the wallet needs about ${amount(reserve.data, 18, 4, "up")} ETH free for the gas. Lower the amount or press Max.`
      : "";
  const reason = tradeDone
    ? ""
    : amountReason ||
      (confirmImpact && !impactAccepted
        ? `Tick “Buy anyway” above to pay ${pct(impact)} below the pool’s price, or lower the amount.`
        : "") ||
      (!needsApproval
        ? quote.error ||
          (!quote.data ? "Waiting for the quote from the pool." : "")
        : "");
  const minOut = quote.data ? minimumOf(quote.data.out, slip) : undefined;
  const normal = BigInt(con(s, "PleaHook.IMD_FEE_BPS") || 0),
    rate = normal + extra,
    fee = (legRaw * rate) / (10000n + rate),
    reaches = legRaw - fee;
  const feePart = (key: string) =>
      (reaches * BigInt(con(s, `PleaHook.${key}`) || 0)) / 10000n,
    cashbackNow = feePart("CASHBACK_BPS");
  const payout = useRead(
    async () => {
      const own =
        BigInt(val(s, "PleaHook.imdInMarket")) +
        BigInt(val(s, "PleaHook.retainClaims")) +
        bandImd(
          bandOf(val(s, "PleaHook.wall")),
          BigInt(val(s, "PleaHook.currentSqrtPriceX96")),
          pleaIsZero(val(s, "PleaHook.poolKey"), r.addresses.PLEA),
        );
      const needed =
        feePart("CASHBACK_BPS") +
        feePart("OWNER_BPS") +
        (dead ? 0n : feePart("PRIZE_BPS"));
      if (own >= needed) return "plain";
      const pmBalance = await read(r, "PairToken", "balanceOf", [
        r.network.uniswapV4.poolManager,
      ]);
      return pmBalance >= needed
        ? "plain"
        : own + fee < BigInt(con(s, "PleaHook.PAYOUT_RESERVE"))
          ? "pool"
          : "claims";
    },
    [legRaw.toString(), selling],
    !!s && legRaw > 0n && !selling,
  );
  const capMessage = {
    title: `Not bought: more than ${tokenAmount(cap, s)} in one buy.`,
    body: `Until ${clock(launch + window)} one buy can take at most ${tokenAmount(cap, s)}. Pay less ${unit}, or split the buy in two. Nothing was bought.`,
  };
  const priceMessage = {
    title: `The price moved more than ${slip / 100}%.`,
    body: `Nothing was ${selling ? "sold" : "bought"}; your ${unit} stays in your wallet. Try again, or ${slip >= 200 ? "lower the amount." : `raise the slippage to ${slip < 100 ? 1 : 2}%.`}`,
  };
  const swapErrors = {
    BuyTooLarge: capMessage,
    PriceLimitAlreadyExceeded: priceMessage,
  };
  // A route's fee parts are of the IMD its pools deliver (no typed IMD amount to keep).
  const display =
    s && (!route || quote.data)
      ? feeDisplay(legRaw, s.constants, extra, dead, route ? undefined : input || undefined)
      : undefined;
  // What the field shows for this amount: Max fills the field rounded down; a typed amount is
  // shown as typed (feeDisplay's "you pay").
  const shownPay = route
    ? exactAmount(raw, route.decimals, 2)
    : maxRaw !== undefined
      ? amount(maxRaw, 18, selling ? 0 : 2)
      : display && !selling
        ? display.pay
        : exactAmount(raw, 18, selling ? 0 : 2);
  const permitMessage = {
    title: "Your Permit2 allowance for the router ran out.",
    body: `Press the button to allow the router again (it lasts 30 minutes), then ${selling ? "sell" : "buy"}. Nothing was ${selling ? "sold" : "bought"}.`,
  };
  /** The price moved past the slippage between the page's quote and the click (sendMinimum). */
  const movedMessage = (fresh: bigint, minimum: bigint) => ({
    title: `The price moved: the new quote is ≈ ${tokenAmount(fresh, s, selling)}.`,
    body: `That is below the minimum this page showed, ${tokenAmount(minimum, s, selling)}, so nothing was sent and your ${unit} stays in your wallet. The quote above is the new one: press ${selling ? "Sell" : "Buy"} again to ${selling ? "sell" : "buy"} at it.`,
  });
  // Native ETH pays the gas too: the wallet's "insufficient funds" in the gas reserve's words.
  const fundsMessage = {
    title: "Not bought: too little ETH is left for the gas.",
    body: `${gasLeft !== undefined ? `Paying ${payAmount(raw)} leaves ${amount(gasLeft, 18, 4)} ETH; the` : "The"} wallet needs ${reserve.data !== undefined ? `about ${amount(reserve.data, 18, 4, "up")} ETH` : "ETH"} free for the gas. Lower the amount or press Max. Nothing was sent.`,
  };
  const routerErrors: Record<string, { title: string; body: string }> = universal
    ? {
        BalanceTooLow: priceMessage,
        V4TooLittleReceived: priceMessage,
        AllowanceExpired: permitMessage,
        InsufficientAllowance: permitMessage,
      }
    : {};
  async function buy() {
    if (step === "token") {
      setApproved(true);
      if (
        await tx.send(
          "",
          "approve",
          [],
          {
            to: inputToken,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [spender, raw],
            }),
          },
          {
            errors: swapErrors,
            prepare:
              launchActive && !selling
                ? async () => {
                    const q = await legQuote();
                    if (q.gross > BigInt(cap))
                      throw new DisplayError(capMessage);
                  }
                : undefined,
          },
        )
      )
        setRevision((n) => n + 1);
      return;
    }
    if (step === "permit2" && trade.kind === "universalRouter") {
      setApproved(true);
      if (
        await tx.send("", "approve", [], undefined, {
          errors: swapErrors,
          prepare: async () => {
            if (launchActive && !selling) {
              const q = await legQuote();
              if (q.gross > BigInt(cap)) throw new DisplayError(capMessage);
            }
            // Exactly this amount, for 30 minutes from the chain's clock.
            const block = await r.client.getBlock();
            return {
              to: trade.permit2,
              data: encodeFunctionData({
                abi: permit2Abi,
                functionName: "approve",
                args: [
                  inputToken,
                  trade.router,
                  raw,
                  Number(block.timestamp) + PERMIT_LIFE,
                ],
              }),
            };
          },
        })
      )
        setRevision((n) => n + 1);
      return;
    }
    // The quote this click was made on: the trade is sent with its minimum, the one the page shows.
    const shown = quote.data;
    setApproved(false);
    await tx.send("", "swap", [], undefined, {
      errors: {
        ...swapErrors,
        ...routerErrors,
        ...(native ? { [NO_FUNDS]: fundsMessage } : {}),
      },
      prepare: async () => {
        if (!shown)
          throw new DisplayError({ title: "Waiting for the quote from the pool." });
        const q = await legQuote(),
          key = val(s, "PleaHook.poolKey");
        // A price that moved more than the slippage since the page's quote: nothing is sent, and
        // the page reads the new quote for the next press.
        const { minimum, moved } = sendMinimum(shown.out, q.out, slip);
        if (moved) {
          setRevision((n) => n + 1);
          throw new DisplayError(movedMessage(q.out, minimum));
        }
        if (trade.kind === "universalRouter") {
          // The quote is the site's own walk of the pool (the v4 Quoter sees 0 PLEA while the
          // Cabal lives); the router enforces the page's minimum: a balance check on the buyer's
          // PLEA for a buy, the IMD it takes for a sale.
          const router = { address: trade.router, minHopPrice: trade.minHopPrice },
            [block, held] = await Promise.all([
              r.client.getBlock(),
              selling
                ? Promise.resolve(0n)
                : read(r, "PLEA", "balanceOf", [address]),
            ]);
          const encoded = route
            ? // ETH or USDC: the route's pools into IMD, then PLEA's pool, in the same execute.
              encodeBuyVia({
                router,
                currencyIn: route.currency,
                path: buyPath(route, key, r.addresses.PLEA, address!),
                plea: r.addresses.PLEA,
                buyer: address!,
                amountIn: raw,
                minPleaOut: minimum,
                pleaBalance: BigInt(held),
              })
            : selling
            ? encodeSell({
                router,
                key,
                imd: r.addresses.PairToken,
                seller: address!,
                amountIn: raw,
                minImdOut: minimum,
              })
            : encodeBuy({
                router,
                key,
                imd: r.addresses.PairToken,
                buyer: address!,
                amountIn: raw,
                minPleaOut: minimum,
                pleaBalance: BigInt(held),
              });
          setFrozenQuote({ ...q, at: Date.now() });
          return {
            to: trade.router,
            data: encodeFunctionData({
              abi: universalRouterAbi,
              functionName: "execute",
              args: [
                encoded.commands,
                encoded.inputs,
                block.timestamp + BigInt(PERMIT_LIFE),
              ],
            }),
            // Native ETH is the transaction's value; every other currency comes through Permit2.
            value: (encoded as { value?: bigint }).value ?? 0n,
          };
        }
        const zeroForOne =
            key.currency0.toLowerCase() === inputToken.toLowerCase(),
          hookData = encodeAbiParameters([{ type: "address" }], [address!]);
        const args = [
          key,
          {
            zeroForOne,
            amountSpecified: -raw,
            sqrtPriceLimitX96: priceLimit(q.next, slip, zeroForOne),
          },
          { takeClaims: false, settleUsingBurn: false },
          hookData,
        ] as const;
        const simulation = await r.client.simulateContract({
          address: trade.router,
          abi: swapAbi,
          functionName: "swap",
          args,
          account: address!,
        });
        const delta = unpackDelta(simulation.result),
          spent = -(zeroForOne ? delta[0] : delta[1]);
        if (spent < raw) throw new DisplayError(priceMessage);
        setFrozenQuote({ ...q, at: Date.now() });
        return {
          to: trade.router,
          data: encodeFunctionData({
            abi: swapAbi,
            functionName: "swap",
            args,
          }),
        };
      },
      toast: (receipt) => {
        const events = receiptEvents(r, receipt),
          transfers = receipt.logs.flatMap((log) => {
            try {
              return [
                {
                  ...decodeEventLog({
                    abi: transferAbi,
                    data: log.data,
                    topics: log.topics,
                  }),
                  address: log.address,
                },
              ];
            } catch {
              return [];
            }
          }) as any[];
        // Native ETH leaves no Transfer log: an exact-input route spends all of it.
        let spent = native
          ? raw
          : transfers
              .filter(
                (l) =>
                  l.address.toLowerCase() === inputToken.toLowerCase() &&
                  l.args.from.toLowerCase() === address?.toLowerCase(),
              )
              .reduce((n, l) => n + l.args.value, 0n);
        const refund = events
          .filter(
            (e) =>
              e.eventName === "FeeRefunded" &&
              e.args.trader?.toLowerCase() === address?.toLowerCase(),
          )
          .reduce((n, e) => n + BigInt(e.args.amount || 0n), 0n);
        // A route's refund (a wei of the hook's fee) comes back in IMD, not in the paying currency.
        if (!route) spent -= refund;
        // The IMD the route's pools delivered to PLEA's pool: the hook's FeesTaken (what reached the
        // pool and its fee) plus any refund.
        const taken = events.find(
            (e) =>
              e.eventName === "FeesTaken" &&
              e.args.buy &&
              e.args.trader?.toLowerCase() === address?.toLowerCase(),
          )?.args,
          leg = taken
            ? BigInt(taken.imdBasis) + BigInt(taken.imdFee) + refund
            : undefined;
        const outToken = selling ? r.addresses.PairToken : r.addresses.PLEA;
        const received = transfers
          .filter(
            (l) =>
              l.address.toLowerCase() === outToken.toLowerCase() &&
              l.args.to.toLowerCase() === address?.toLowerCase() &&
              (!selling ||
                l.args.from.toLowerCase() ===
                  r.network.uniswapV4.poolManager.toLowerCase()),
          )
          .reduce((n, l) => n + l.args.value, 0n);
        // A full fill names the amount the field, Balance and sum line showed (r2T-N6).
        const paid =
          spent === raw ? `${shownPay} ${unit}` : payAmount(spent, "up");
        const text = selling
          ? `Sold ${paid} for ${tokenAmount(received, s, true)}.`
          : route
            ? `Bought ${tokenAmount(received, s)} for ${paid}${leg ? ` (${tokenAmount(leg, s, true, 3)} through ${route.path[route.path.length - 1].pool})` : ""}.`
            : `Bought ${tokenAmount(received, s)} for ${paid}.`;
        const cash = events
          .filter((e) =>
            [
              "CashbackStacked",
              "CashbackPaidPlain",
              "CashbackPaidClaims",
            ].includes(e.eventName),
          )
          .reduce((n, e) => n + BigInt(e.args.amount), 0n);
        const body = events.some((e) => e.eventName === "PayoutsToPool")
          ? "No cashback on this opening buy: its payouts joined the pool."
          : `${smallAmount(cash, s)} cashback ${events.some((e) => e.eventName === "CashbackPaidClaims") ? "paid as a PoolManager claim (see Profile)" : events.some((e) => e.eventName === "CashbackStacked") ? "staked" : "paid to you"}.`;
        const short =
          spent < raw
            ? ` ${payAmount(raw - spent)} did not fill and stayed in your wallet: the price reached your ${slip / 100}% limit.`
            : "";
        setFill(text + " " + body + short);
        return { kind: "sold", text, body: body + short };
      },
    });
  }
  return (
    <div className="stack stack--lg">
      <Title title={selling ? "Sell PLEA" : "Buy PLEA"}>
        {dead
          ? "The Cabal is dead, so buying and selling are open to everyone, forever."
          : "Buying is open to anyone. Selling needs a plea while the Cabal lives."}
      </Title>
      <div className="split">
        <Panel
          card
          level={2}
          title={`Swap ${unit} for\u00a0${selling ? pair : "PLEA"}`}
        >
          <TradingGate
            onSeed={() => {
              // The opening buy is in IMD, whatever this browser pays with.
              choosePay(PAY_PAIR, false);
              setInput(formatUnits(con(s, "PleaHook.PAYOUT_RESERVE"), 18));
              document.getElementById("pay")?.focus();
            }}
          />
          {dead && (
            <div className="chips" role="group" aria-label="Buy or sell">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  className="chip"
                  aria-pressed={selling === v}
                  onClick={() => {
                    if (selling === v) return;
                    setSelling(v);
                    // The field's number meant the other token (USDC has 6 decimals, PLEA 18):
                    // start again rather than reread it, as choosePay does.
                    setInput("");
                    setMaxRaw(undefined);
                    setMaxNote("");
                  }}
                >
                  {v ? "Sell" : "Buy"}
                </button>
              ))}
            </div>
          )}
          {!selling && routes.length > 0 && (
            <div className="field">
              <div className="field__top">
                <p className="field__label" id="pay-with-label">
                  Pay with
                </p>
              </div>
              <div
                className="chips"
                role="group"
                aria-labelledby="pay-with-label"
                aria-describedby="pay-with-route"
              >
                {[...routes.map((x) => x.symbol), PAY_PAIR].map((v) => (
                  <button
                    className="chip"
                    key={v}
                    aria-pressed={payWith === v}
                    disabled={tx.busy}
                    onClick={() => payWith !== v && choosePay(v)}
                  >
                    {v === PAY_PAIR ? pair : v}
                  </button>
                ))}
              </div>
              <p className="small text-2" id="pay-with-route">
                {route
                  ? `${routeLine(route, routes, pair, pct(normal + BigInt(con(s, "PleaHook.PLEA_BURN_BPS") || 0)), hopFees.data)}${native ? " No approval: the ETH is the transaction’s value." : ` ${route.symbol} needs two approvals first, each for exactly this amount.`}`
                  : `${pair} buys PLEA directly in PLEA’s pool.`}
              </p>
            </div>
          )}
          <AmountInput
            id="pay"
            label={selling ? "You sell" : "You pay"}
            value={input}
            onChange={(v) => {
              setInput(v);
              setMaxRaw(undefined);
              setMaxNote("");
            }}
            unit={unit}
            invalid={invalid}
            hint={invalid ? capError || amountReason : maxNote || gasNote || undefined}
            aside={
              address ? (
                <>
                  <span>Balance {payAmount(available)}</span> ·{" "}
                  <button
                    className="link-btn"
                    onClick={() => {
                      if (available === undefined) return;
                      if (native) {
                        // Max leaves the gas: what a routed buy may burn at today's fees.
                        if (reserve.data === undefined) return;
                        const most = ethMax(available, reserve.data);
                        if (!most) {
                          setMaxNote(
                            `Max keeps about ${amount(reserve.data, 18, 4, "up")} ETH free for the gas, and this wallet has ${amount(available, 18, 4)} ETH: too little to buy with ETH. Add ETH, or pay with another currency.`,
                          );
                          return;
                        }
                        setInput(exactAmount(most, 18, 0));
                        setMaxRaw(most);
                        setMaxNote(
                          `Max keeps about ${amount(reserve.data, 18, 4, "up")} ETH free for the gas.`,
                        );
                        return;
                      }
                      setInput(amount(available, decimals, selling ? 0 : 2));
                      setMaxRaw(available);
                    }}
                  >
                    Max
                    <span className="sr-only">
                      : {selling ? "sell" : "pay"} all{" "}
                      {payAmount(available)}
                      {native ? ", less the gas" : ""}
                    </span>
                  </button>
                </>
              ) : (
                "Your balance shows once you connect"
              )
            }
          />
          <AmountInput
            id="quote"
            loading={quote.loading && !quote.data}
            label="You get (quote)"
            value={
              quote.data
                ? `≈ ${amount(quote.data.out, 18, selling ? 2 : 0)}`
                : ""
            }
            unit={selling ? pair : "PLEA"}
            aside={
              quote.loading ? (
                <span className="loading-label">
                  <Icon name="hourglass" />
                  {route ? "Reading the pools…" : "Reading the pool…"}
                </span>
              ) : quote.data ? (
                `Updated ${Math.floor((Date.now() - quote.data.at) / 1000)} s ago`
              ) : (
                ""
              )
            }
          />
          {route && quote.data && (
            <p className="small">
              ≈ {amount(quote.data.imd, 18, 3)} {pair} on{" "}
              {route.path[route.path.length - 1].pool}
              {route.path.length > 1
                ? ` (after ${route.path
                    .slice(0, -1)
                    .map((h) => h.pool)
                    .join(", ")})`
                : ""}{" "}
              → ≈ {amount(quote.data.out, 18, 0)} PLEA.
              {quote.data.atPrice !== undefined &&
                ` ${rateLine(route, pair, raw, quote.data.imd, quote.data.atPrice)}`}
            </p>
          )}
          <div className="field">
            <div className="field__top">
              <p className="field__label" id="slip-label">
                Slippage
              </p>
              <span className="field__aside">
                If the price moves more, nothing is{" "}
                {selling ? "sold" : "bought"}
              </span>
            </div>
            <div className="chips" role="group" aria-labelledby="slip-label">
              {[50, 100, 200].map((n) => (
                <button
                  className="chip"
                  key={n}
                  aria-pressed={slip === n}
                  onClick={() => setSlip(n)}
                >
                  {n / 100}%
                </button>
              ))}
            </div>
          </div>
          {raw > 0n && s && seeded && !tradeDone && display && (!route || quote.data) && (
            <>
              <Costs
                rows={[
                  ...(!selling
                    ? ([
                        [
                          "Price",
                          perMillion(
                            (BigInt(val(s, "PleaHook.priceX96") || 0) *
                              10n ** 24n) /
                              Q96,
                            s,
                          )
                            ? `1M PLEA = ${perMillion((BigInt(val(s, "PleaHook.priceX96") || 0) * 10n ** 24n) / Q96, s)}`
                            : NO_PRICE,
                        ],
                      ] as [string, string][])
                    : []),
                  // A route's own pools first: each one's fee (live: its LP fee and Uniswap's
                  // protocol fee), then the IMD they deliver to PLEA's pool.
                  ...(route && quote.data
                    ? ([
                        ...route.path.map((h, i): [string, string] => {
                          const f = hopFees.data?.[i],
                            pips = f?.total ?? h.fee,
                            split =
                              f && f.protocol
                                ? `: ${feeWords(f.lp)} to its liquidity, ${feeWords(f.protocol)} Uniswap’s protocol fee`
                                : "";
                          return [
                            `${h.pool} fee (${feeWords(pips)})`,
                            i === 0
                              ? `≈ ${amount((raw * BigInt(pips) + 999_999n) / 1_000_000n, route.decimals, native ? 6 : 4, "up")} ${route.symbol}${split}`
                              : `${feeWords(pips)} of the ETH${split}`,
                          ];
                        }),
                        [
                          `${pair} into PLEA’s pool`,
                          `≈ ${amount(quote.data.imd, 18, 3)} ${pair}`,
                        ],
                      ] as [string, string][])
                    : []),
                  [
                    `Minimum, ${slip / 100}% slippage`,
                    minOut !== undefined
                      ? tokenAmount(minOut, s, selling)
                      : quote.error
                        ? "No quote"
                        : "Waiting for the quote",
                  ],
                  ...(!selling
                    ? ([["Reaches the pool", `${display.reaches} ${pair}`]] as [
                        string,
                        string,
                      ][])
                    : []),
                  [
                    `${route ? "PLEA’s fees" : "Fees"}, ${pct(normal + BigInt(con(s, "PleaHook.PLEA_BURN_BPS")))}`,
                    selling
                      ? `${pct(normal)} of the ${pair} + ${pct(con(s, "PleaHook.PLEA_BURN_BPS"))} of the PLEA`
                      : `${display.fees} ${pair} + ${pct(con(s, "PleaHook.PLEA_BURN_BPS"))} of the PLEA`,
                    "total",
                  ],
                  ...((!selling
                    ? [
                        [
                          cashbackWords(pair).row(
                            pct(con(s, "PleaHook.CASHBACK_BPS")),
                          ),
                          payout.data === "pool"
                            ? "none on this opening buy: the cashback, owner and prize shares join the pool"
                            : `${display.cash} ${pair}${payout.data === "claims" ? ", paid as a claim on the PoolManager (see Profile)" : ""}`,
                          "part",
                        ],
                        // An opening buy's payouts join the pool (PleaHook._payFees: PayoutsToPool
                        // zeroes the cashback, owner and prize shares; the whole fee is retained for
                        // the buy wall).
                        [
                          `Owner (${pct(con(s, "PleaHook.OWNER_BPS"))})`,
                          payout.data === "pool"
                            ? "none: joins the pool"
                            : `${display.owner} ${pair}`,
                          "part",
                        ],
                        ...(!dead
                          ? [
                              [
                                `Season prize pot (${pct(con(s, "PleaHook.PRIZE_BPS"))})`,
                                payout.data === "pool"
                                  ? "none: joins the pool"
                                  : `${display.prize} ${pair}`,
                                "part",
                              ],
                            ]
                          : []),
                        [
                          `Buy wall (${pct(payout.data === "pool" ? normal : BigInt(con(s, "PleaHook.POOL_BPS")) + (dead ? BigInt(con(s, "PleaHook.PRIZE_BPS")) : 0n))})`,
                          `${payout.data === "pool" ? display.fees : display.wall} ${pair}`,
                          "part",
                        ],
                        [
                          `Burned (${pct(con(s, "PleaHook.PLEA_BURN_BPS"))})`,
                          `${pct(con(s, "PleaHook.PLEA_BURN_BPS"))} of the PLEA`,
                          "part",
                        ],
                        ...(extra
                          ? [
                              [
                                `Launch fee (${(Number(extra) / 100).toFixed(1)}%), to the buy wall`,
                                `${display.launch} ${pair}`,
                              ],
                            ]
                          : []),
                      ]
                    : [["Plea needed", "none, the Cabal is dead"]]) as [
                    string,
                    string,
                    ("part" | "total")?,
                  ][]),
                ]}
              />
              {!selling && (
                <p className="small">
                  {display.reaches} {pair} reaches the pool + {display.fees}{" "}
                  {pair} fees
                  {extra
                    ? ` + ${display.launch} ${pair} launch fee`
                    : ""} = {display.pay} {pair}{" "}
                  {route
                    ? `from ${route.path[route.path.length - 1].pool}, for your ${shownPay} ${unit}`
                    : "you pay"}
                  . The {dead ? "three" : "four"} parts add up to{" "}
                  {display.fees} {pair}.
                </p>
              )}
            </>
          )}
          {quote.error && (
            <Notice
              kind="bad"
              title={
                /RPC|public RPC/i.test(quote.error)
                  ? "Can’t read the price"
                  : "Can’t quote this amount"
              }
            >
              <p>{quote.error}</p>
              {!poolBlocked && (
                <div className="btn-row">
                  <button
                    className="btn btn--sm"
                    onClick={() => {
                      resetHealth();
                      setRevision((n) => n + 1);
                    }}
                  >
                    <Icon name="arrow-clockwise" />
                    Try again
                  </button>
                </div>
              )}
            </Notice>
          )}
          {confirmImpact &&
            route &&
            quote.data?.atPrice !== undefined &&
            !amountReason && (
              <>
                <Notice
                  kind="warn"
                  title={`This buy gets ${pct(impact)} less ${pair} than the pool’s price.`}
                >
                  <p>
                    {rateLine(route, pair, raw, quote.data.imd, quote.data.atPrice)}{" "}
                    The less the pools on the way hold, the more a big buy moves
                    their price against it: a smaller buy, or a few spread over
                    time, gets more {pair} for each {route.symbol}.
                  </p>
                </Notice>
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    className="box"
                    checked={impactAccepted}
                    onChange={(e) => setImpactOk(e.target.checked ? impactKey : "")}
                    aria-labelledby="impact-title"
                    disabled={tx.busy}
                  />
                  <span className="toggle-card__title" id="impact-title">
                    Buy anyway, {pct(impact)} below the pool’s price
                  </span>
                </label>
              </>
            )}
          <Action
            {...tx}
            block
            done={tx.done && !approved}
            confirmed={tx.done}
            label={
              step === "token"
                ? `Approve ${unit}`
                : step === "permit2"
                  ? "Allow the router"
                  : selling
                    ? "Sell PLEA"
                    : "Buy PLEA"
            }
            walletLabel={
              step === "token"
                ? universal
                  ? `Approve ${unit} for Permit2 in your wallet…`
                  : `Approve ${unit} in your wallet…`
                : step === "permit2"
                  ? "Confirm the Permit2 allowance in your wallet…"
                  : selling
                    ? "Confirm the sale in your wallet…"
                    : "Confirm the buy in your wallet…"
            }
            connectText={`Connect in the top bar to ${selling ? "sell" : "buy"}.`}
            onRun={buy}
            disabled={
              !tx.ready || !!reason || (!native && allowance.data === undefined)
            }
            reason={invalid ? undefined : reason}
            describedBy={invalid ? "pay-hint" : undefined}
          />
          {address &&
            raw > 0n &&
            seeded &&
            !tradeDone &&
            !poolBlocked &&
            (needsApproval ||
              total > 1 ||
              (!selling && payout.data !== "pool")) && (
              <p className="small">
                {tradeSteps({
                  step: step || "trade",
                  stepNumber,
                  total,
                  universal,
                  selling,
                  amount: `${exactAmount(raw, route ? route.decimals : Number(s?.constants[selling ? "decimals" : "pairDecimals"] ?? 18), selling ? 0 : 2)} ${unit}`,
                  // The costs row's own figure: one rounding rule for both (sweep R12).
                  cashback:
                    selling || payout.data === "pool"
                      ? undefined
                      : `${display ? `${display.cash} ${pair}` : smallAmount(cashbackNow, s)}`,
                  claims: payout.data === "claims",
                  staked: !!site().cashback.simd,
                })}
              </p>
            )}
          {fill && <p role="status">{fill}</p>}
          {tx.done && !approved && (
            <button
              className="link-btn"
              onClick={() => {
                tx.reset();
                setFill("");
                setInput("");
                setMaxRaw(undefined);
                setMaxNote("");
                setFrozenQuote(undefined);
              }}
            >
              Make another trade
            </button>
          )}
        </Panel>
        <div className="stack stack--lg">
          {launchActive && (
            <Panel level={2} title="Launch window">
              <Notice
                kind="warn"
                title={`Launch window: ${Math.floor((now - launch) / 60)} of ${window / 60} minutes gone.`}
              >
                <p>
                  Until {clock(launch + window)} every buy pays a launch fee on
                  top of the normal{" "}
                  {(Number(normal) + Number(con(s, "PleaHook.PLEA_BURN_BPS"))) /
                    100}
                  %; a buy over the cap is refused.
                </p>
              </Notice>
              <Costs
                rows={[
                  [
                    "Launch fee now",
                    `${(Number(extra) / 100).toFixed(1)}% of the ${pair} that reaches the pool`,
                  ],
                  [
                    "How it falls",
                    `in a straight line from ${Number(con(s, "PleaHook.LAUNCH_EXTRA_BPS")) / 100}% to 0% at ${clock(launch + window)}`,
                  ],
                  ["Most per buy", tokenAmount(cap, s)],
                  [
                    "Normal fees, on top",
                    `${(Number(normal) + Number(con(s, "PleaHook.PLEA_BURN_BPS"))) / 100}%`,
                  ],
                ]}
              />
              <div>
                <Countdown
                  until={launch + window}
                  label={`Launch fee ends at ${clock(launch + window)}`}
                />
              </div>
            </Panel>
          )}
          <Panel level={2} title="Your PLEA">
            {address ? (
              <>
                <p>
                  <span className="stat__label">Balance</span>
                  <span className="stat__value">
                    {tokenAmount(balance.data?.plea, s)}
                  </span>
                </p>
                <div className="stack stack--sm">
                  <p className="label">Your buy record</p>
                  <Costs
                    rows={
                      balance.data
                        ? [
                            [
                              "Cost basis",
                              balance.data.basis[1]
                                ? tokenAmount(
                                    (balance.data.basis[0] * 10n ** 24n) /
                                      balance.data.basis[1],
                                    s,
                                    true,
                                  ) + " per 1M"
                                : "No buy record",
                            ],
                            [
                              "Held, buy-weighted",
                              balance.data.basis[2]
                                ? heldTime(now - Number(balance.data.basis[2]))
                                : "No buy record",
                            ],
                            ...(seeded
                              ? ([
                                  [
                                    perMillion(
                                      (BigInt(val(s, "PleaHook.priceX96") || 0n) *
                                        10n ** 24n) /
                                        Q96,
                                      s,
                                    )
                                      ? `Now, at ${perMillion((BigInt(val(s, "PleaHook.priceX96") || 0n) * 10n ** 24n) / Q96, s)} per 1M`
                                      : `Now: ${NO_PRICE}`,
                                    balance.data.basis[0]
                                      ? signedPercent(
                                          (Number(
                                            (balance.data.basis[1] *
                                              BigInt(
                                                val(s, "PleaHook.priceX96") ||
                                                  0n,
                                              )) /
                                              Q96,
                                          ) *
                                            100) /
                                            Number(balance.data.basis[0]) -
                                            100,
                                        )
                                      : "No buy record",
                                  ],
                                ] as [string, string][])
                              : []),
                          ]
                        : []
                    }
                  />
                </div>
                <div className="stack stack--sm">
                  <p className="label">What selling takes</p>
                  <p className="small">
                    {dead
                      ? "Nothing more than a swap. No plea and no need: the Cabal is dead, so PLEA sells like any token on Uniswap v4."
                      : `A plea. The Cabal scores why you sell. Your hold time and profit or loss above are two of the four facts that set your need (${con(s, "CabalGate.PASS_MARK")} − fact score); a new buy updates both.`}
                  </p>
                  {!dead &&
                    seeded &&
                    (balance.data?.open ? (
                      <>
                        <p className="small">
                          <b>
                            {
                              openPleaParts(balance.data.pendingPlea, s!, now)
                                .head
                            }
                          </b>
                          {balance.data.pendingPlea.status === 2 &&
                            ` ${openPleaParts(balance.data.pendingPlea, s!, now).rest}`}
                        </p>
                        <div>
                          <a
                            className="btn btn--sm"
                            href={`#/p/${balance.data.pending}`}
                          >
                            Open plea #{String(balance.data.pending)}{" "}
                            <Icon name="arrow-right" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <a className="btn btn--sm" href="#/plead">
                            Plead to sell <Icon name="arrow-right" />
                          </a>
                        </div>
                        {balance.data && balance.data.cooldown > now && (
                          <p className="small">
                            Next plea from {clock(balance.data.cooldown)}.
                          </p>
                        )}
                      </>
                    ))}
                </div>
              </>
            ) : (
              <p>Connect in the top bar to see your balance and buy record.</p>
            )}
          </Panel>
          <Panel level={2} title="Cashback">
            {address ? (
              <>
                <p className="stat__label">Earned so far</p>
                <p className="stat__value">
                  {s && !s.historyError
                    ? smallAmount(cashback(s.logs, address), s)
                    : "Reading cashback…"}
                </p>
                {site().cashback.simd ? (
                  <p className="small">
                    Paid as staked {pair} through imd/acc:{" "}
                    {pct(con(s, "PleaHook.CASHBACK_BPS") || 0)} of every trade
                    {legRaw > 0n && seeded && !selling
                      ? ` (${smallAmount(cashbackNow, s)} on this buy)`
                      : ""}
                    , in the same transaction. See it on{" "}
                    <a href="https://imdacc.fun" target="_blank" rel="noreferrer">
                      imdacc.fun
                    </a>
                    .
                  </p>
                ) : (
                  <p className="small">
                    Paid in the same transaction:{" "}
                    {pct(con(s, "PleaHook.CASHBACK_BPS") || 0)} of every trade
                    {legRaw > 0n && seeded && !selling
                      ? ` (${smallAmount(cashbackNow, s)} on this buy)`
                      : ""}
                    .{" "}
                    {s?.logs.some(
                      (e) =>
                        e.eventName === "CashbackStacked" &&
                        e.args.trader?.toLowerCase() === address.toLowerCase(),
                    ) ? (
                      <a href="https://imdacc.fun" target="_blank" rel="noreferrer">
                        Staked through imd/acc.
                      </a>
                    ) : (
                      cashbackWords(pair).plainNote
                    )}
                  </p>
                )}
              </>
            ) : (
              <p>Connect in the top bar to see your cashback.</p>
            )}
          </Panel>
          {!dead && (
            <Notice kind="warn" title="Before you buy">
              <p>
                While the Cabal lives you can only sell with an approved plea.
                The Cabal dies after{" "}
                {span(Number(con(s, "CabalGate.DEADMAN") || 118800))} without a
                verdict; then PLEA trades freely forever.
              </p>
              {sellGateWarning() && (
                <p>
                  <b>{sellGateWarning()!.title}</b> {sellGateWarning()!.body}
                </p>
              )}
            </Notice>
          )}
        </div>
      </div>
    </div>
  );
}

export function Plead() {
  const { r, s, now } = useApp(),
    { address } = useAccount(),
    balance = WalletBalances();
  const [input, setInput] = useState(""),
    [text, setText] = useState(""),
    // undefined: the default, ticked unless this wallet cannot pass the auto-sell rules (TRAP2).
    [choice, setAuto] = useState<boolean>(),
    raw = parseAmount(input);
  const returned = useRead(
    () => returnedEscrow(r, s!, address!, s!.timestamp),
    [address],
    !!s && !!address,
  );
  // The owner never plays seasons (Seasons.excluded); a denial's cooldown is its appeal window, so
  // the latest plea is read to point to its appeal (F6, N11).
  const excluded = useRead(
      () => read(r, "Seasons", "excluded", [address]),
      [address],
      !!s && !!address,
    ),
    denial = useRead(
      () => read(r, "CabalGate", "getPlea", [balance.data!.last]),
      [String(balance.data?.last)],
      !!s && !!balance.data?.last && balance.data.cooldownCause === "denied plea",
    ),
    appealable =
      !!denial.data &&
      !appealClosedWhy(
        BigInt(balance.data!.last),
        denial.data,
        now,
        Number(con(s, "CabalGate.COOLDOWN")),
      );
  const autoBlock =
      balance.data && s?.v.fees
        ? autoSellBlock(
            BigInt(balance.data.plea) + (returned.data?.returned || 0n),
            BigInt(s.v.fees[1]),
            BigInt(val(s, "PleaHook.latestPrice") || 0n),
            BigInt(con(s, "CabalGate.MAX_SELL") || 0n),
          )
        : "",
    auto = choice ?? !autoBlock,
    tx = useTx(`${input}:${auto}:${text}`);
  const bal =
      BigInt(balance.data?.plea || 0n) +
      (auto ? returned.data?.returned || 0n : 0n),
    cap = BigInt(con(s, "CabalGate.MAX_SELL") || 0n),
    gateMin = minBig(bal / 100n, cap),
    price = BigInt(val(s, "PleaHook.latestPrice") || 0n),
    max = minBig(bal / 2n, cap);
  const floor = price ? ceil(LETTERBOX.MIN_SALE_VALUE * Q96, price) : 0n,
    min = auto ? maxBig(gateMin, floor) : gateMin;
  const fact = useRead(
    async () => {
      const result = Number(
        await read(r, "CabalGate", "factScore", [address, raw]),
      );
      if (auto && returned.data?.returned && balance.data?.plea)
        return (
          result -
          sharePoints(ceil(raw * 10000n, balance.data.plea)) +
          sharePoints(ceil(raw * 10000n, bal))
        );
      return result;
    },
    [address, raw.toString(), auto, bal.toString()],
    !!s && !!address && raw > 0n,
  );
  const need =
      fact.data === undefined
        ? undefined
        : Number(con(s, "CabalGate.PASS_MARK")) - fact.data,
    fees = s?.v.fees,
    oracle = BigInt(con(s, "CabalGate.ORACLE_FEE") || 0n),
    feeCap = BigInt(fees?.[1] || 0n),
    pair = s?.constants.pairSymbol || site().pairSymbol,
    // The manual plea pays the fixed oracle fee from the wallet's imdTEST (r2D-VN1).
    pairShort =
      balance.data && BigInt(balance.data.pair) < oracle
        ? `You need ${tokenAmount(oracle, s, true)} for the oracle fee; you hold ${tokenAmount(balance.data.pair, s, true)}.`
        : "",
    manualInstead = pairShort
      ? `The manual plea needs ${tokenAmount(oracle, s, true)} for the oracle fee; you hold ${tokenAmount(balance.data?.pair, s, true)}.`
      : `Untick 'Sell automatically if approved' to pay the ${tokenAmount(oracle, s, true)} oracle fee from your ${pair}.`,
    autoBal = BigInt(balance.data?.plea || 0n) + (returned.data?.returned || 0n),
    autoWhy =
      autoBlock === "fee"
        ? `its fees (at most ${tokenAmount(feeCap, s, false, 0, "up")}) may take at most 10% of your PLEA, so it needs at least ${tokenAmount(feeCap * 10n, s, false, 0, "up")}; you hold ${tokenAmount(autoBal, s)}.`
        : autoBlock === "value"
          ? `a plea must be worth at least ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} at the hourly price (${tokenAmount(floor, s, false, 0, "up")}), more than the ${tokenAmount(minBig(autoBal / 2n, cap), s)} you can plead.`
          : "";
  const quote = useRead(
    () => poolQuote(r, s!, raw, true),
    [raw.toString()],
    !!s && raw > 0n && !!val(s, "PleaHook.seeded"),
  );
  const chipAmounts = [1, 10, 20, 35, 50].map((n) => {
    let v = n === 50 ? max : (bal * BigInt(n)) / 100n;
    v =
      n === 1
        ? ceil(maxBig(v, min), 10n ** 18n) * 10n ** 18n
        : (v / 10n ** 18n) * 10n ** 18n;
    return { n, v };
  });
  const chipFacts = useRead(
    () =>
      Promise.all(
        chipAmounts.map(async ({ v, n }) => ({
          n,
          v,
          score: await read(r, "CabalGate", "factScore", [address, v]),
        })),
      ),
    [address, auto, bal.toString()],
    !!s && !!address && bal > 0n,
  );
  const passing = chipFacts.data
    ?.filter(
      (c) =>
        Number(con(s, "CabalGate.PASS_MARK")) - Number(c.score) <=
        Number(con(s, "CabalGate.MAX_PLEA_SCORE")),
    )
    .at(-1);
  const invalid = raw > 0n && (raw < min || raw > max),
    cannot =
      need !== undefined && need > Number(con(s, "CabalGate.MAX_PLEA_SCORE"));
  const reason = !val(s, "PleaHook.seeded")
    ? "Trading is not open yet."
    : balance.data?.open
      ? `Plea #${balance.data.pending} is still open. You can write your next plea now; it is kept until you can send it.`
      : balance.data && balance.data.cooldown > now
        ? `Cooldown until ${clock(balance.data.cooldown)}. You can write your plea now and send it then.`
        : auto && returned.data?.blocked
          ? returned.data.blocked
          : auto && autoWhy
            ? `Auto-sell: ${autoWhy} ${manualInstead}`
            : !auto && pairShort
              ? pairShort
            : invalid
              ? raw < min
                ? `At least ${tokenAmount(min, s)}${auto ? ` (worth ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} at the hourly price)` : ""}. Raise the amount.`
                : `At most ${tokenAmount(max, s)} in one plea. Lower the amount.`
              : raw <= 0n
                ? "Enter an amount to read your fact score and need."
                : cannot
                  ? `Need ${need} of ${con(s, "CabalGate.MAX_PLEA_SCORE")}: cannot pass at this size. Nothing is paid.`
                  : // An approved plea the pool cannot fill can only lapse (fee spent, cooldown): refuse it here.
                    quote.error === LIQUIDITY_SHORT
                    ? `The pool cannot fill a sale of ${tokenAmount(raw, s)} now, so an approval could not be sold. Lower the amount, or plead after more PLEA has been bought. Nothing is paid.`
                    : quote.error === NO_LIQUIDITY
                      ? `The pool has no ${pair} to pay for a sale yet; nothing can be sold until someone buys. Nothing is paid.`
                      : fact.error ||
                    (!fact.data
                      ? "Reading your fact score."
                      : !textCheck("plea", text).ok
                        ? "Fix the text above to submit. Nothing is paid until it passes."
                        : "");
  if (val(s, "CabalGate.diedAt"))
    return (
      <>
        <Title title="Plead to sell" />
        <Empty
          icon="gavel"
          title="Plead is closed"
          action={{ href: "#/buy", label: "Sell on the Buy page" }}
        >
          No verdict for {span(Number(con(s, "CabalGate.DEADMAN")))}, so PLEA
          trades freely forever: sell on the Buy page with no plea. Court is
          adjourned.
        </Empty>
      </>
    );
  const parts =
    balance.data && raw > 0n
      ? factParts(
          bal,
          raw,
          balance.data.basis,
          price,
          BigInt(val(s, "PleaHook.price24hAgo") || 0n),
          Number(val(s, "CabalGate.startedAt")),
          now,
        )
      : undefined;
  const expected = quote.data?.out || 0n,
    autoOut =
      expected > LETTERBOX.AUTO_SELL_FEE
        ? expected - LETTERBOX.AUTO_SELL_FEE
        : 0n,
    minimumAuto =
      (((((raw * price) / Q96) * LETTERBOX.MIN_OUT_BPS) / 10000n) *
        (10000n -
          BigInt(con(s, "PleaHook.IMD_FEE_BPS") || 0n) -
          BigInt(con(s, "PleaHook.PLEA_BURN_BPS") || 0n))) /
      10000n;
  const feePlea = feeInPlea(s, oracle + LETTERBOX.TIP);
  const quoteValue = (value: string) =>
    !val(s, "PleaHook.seeded")
      ? "after trading opens"
      : raw === 0n
        ? "enter an amount"
        : quote.loading
          ? "Reading the pool…"
          : quote.error === LIQUIDITY_SHORT
            ? "more than the pool can fill"
            : quote.error === NO_LIQUIDITY
              ? `the pool has no ${pair} yet`
              : quote.error
                ? "can’t read the pool"
                : value;
  return (
    <div className="stack stack--lg">
      <Title title="Plead to sell">
        Write why you want to sell. The Cabal,{" "}
        {String(con(s, "CabalGate.PANEL_SIZE") || "the panel of")} judges,
        scores it from 0 to {String(con(s, "CabalGate.MAX_PLEA_SCORE") || 45)}.
        You pass if the score reaches your need.
      </Title>
      <div className="split">
        <Panel card level={2} title="New plea">
          <TradingGate />
          <AmountInput
            id="plea-amount"
            label="Amount"
            value={input}
            onChange={setInput}
            unit="PLEA"
            invalid={invalid}
            aside={
              address
                ? `Balance ${tokenAmount(bal, s)}`
                : "Your balance shows once you connect"
            }
            hint={
              address
                ? invalid
                  ? reason
                  : `From ${tokenAmount(min, s)}${auto ? ` (worth ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} at the hourly price)` : ""} to ${tokenAmount(max, s)}: at most ${Number(con(s, "CabalGate.MAX_SHARE_BPS") || 0) / 100}% and ${tokenAmount(cap, s)}.`
                : undefined
            }
          />
          <div
            className="chips chips--fit"
            role="group"
            aria-label="Share of your balance"
          >
            {chipAmounts.map(({ n, v }) => (
              <button
                className="chip"
                key={n}
                aria-disabled={bal === 0n}
                aria-pressed={raw > 0n && raw === v}
                onClick={() => bal > 0n && setInput(amount(v, 18))}
              >
                {n === 50 ? "Max" : n + "%"}
              </button>
            ))}
          </div>
          {address && bal === 0n && (
            <p className="small">You hold no PLEA yet. Buy PLEA first.</p>
          )}
          {fact.data !== undefined ? (
            <>
              <div className="field__top">
                <h3 className="label">Your fact score</h3>
                <span className="field__aside">
                  From the chain:{" "}
                  {parts && parts.total === fact.data
                    ? `${factTerms(parts).join(" + ")} = ${fact.data}`
                    : fact.data}
                </span>
              </div>
              <FactCells parts={parts} total={fact.data} />
              <Meter fact={fact.data} need={need!} own />
            </>
          ) : address && raw > 0n && fact.loading ? (
            <div className="stack" aria-busy="true">
              <p className="loading-label">
                <Icon name="hourglass" />
                Reading your balance and buy record from the chain…
              </p>
              <div className="skeleton">
                <div className="skeleton__line skeleton__line--short" />
                <div className="skeleton__block" />
                <div className="skeleton__line skeleton__line--mid" />
              </div>
            </div>
          ) : (
            <p className="loading-label">
              {address
                ? raw > 0n
                  ? "Reading your balance and buy record from the chain…"
                  : "Enter an amount to read your fact score and need."
                : "Connect and enter an amount to see your facts."}
            </p>
          )}
          <TextBox label="Your plea" value={text} onChange={setText} />
          <p className="field__hint">
            Be honest, specific, funny. Lines like “give me 45” count as
            manipulation and score 0.
          </p>
          <label className="toggle-card">
            <input
              type="checkbox"
              className="box"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              aria-labelledby="auto-title"
              aria-describedby={autoWhy && !auto ? "auto-desc auto-why" : "auto-desc"}
            />
            <span className="stack stack--sm">
              <span id="auto-title" className="toggle-card__title">
                Sell automatically if approved
              </span>
              <span className="small text-2" id="auto-desc">
                The fees are paid in PLEA. If approved, anyone can sell it for
                you within{" "}
                {span(Number(con(s, "CabalGate.EXECUTE_WINDOW") || 420))} and
                earns the {tokenAmount(LETTERBOX.TIP, s, true)} tip.{" "}
                {tokenAmount(LETTERBOX.AUTO_SELL_FEE, s, true)} of the sale goes
                to the season prize pot.
              </span>
            </span>
          </label>
          {autoWhy && !auto && (
            <p className="small" id="auto-why">
              Auto-sell is off for this wallet: {autoWhy}
            </p>
          )}
          <Costs
            rows={
              auto
                ? [
                    ["Oracle fee", tokenAmount(oracle, s, true)],
                    [
                      "Tip for whoever sells it",
                      tokenAmount(LETTERBOX.TIP, s, true),
                    ],
                    [
                      `Paid in PLEA, ${tokenAmount(oracle + LETTERBOX.TIP, s, true)}`,
                      price
                        ? `about ${tokenAmount(feePlea, s, false, 0, "up")}`
                        : "after trading opens",
                    ],
                    [
                      "At most",
                      fees
                        ? tokenAmount(feeCap, s, false, 0, "up")
                        : "after trading opens",
                    ],
                    [
                      "Auto-sell fee, from the sale to the season prize pot",
                      tokenAmount(LETTERBOX.AUTO_SELL_FEE, s, true),
                    ],
                    [
                      "You get, if approved and sold",
                      quoteValue(`about ${tokenAmount(autoOut, s, true)}`),
                    ],
                    [
                      "At least",
                      quoteValue(
                        tokenAmount(
                          minimumAuto > LETTERBOX.AUTO_SELL_FEE
                            ? minimumAuto - LETTERBOX.AUTO_SELL_FEE
                            : 0n,
                          s,
                          true,
                        ),
                      ),
                    ],
                  ]
                : [
                    [
                      `Oracle fee, from your ${pair} (approve once)`,
                      tokenAmount(oracle, s, true),
                    ],
                    ["Extra fee", "none"],
                    [
                      "You get, if approved and sold",
                      quoteValue(`about ${tokenAmount(expected, s, true)}`),
                    ],
                    [
                      "At least, with 1% slippage",
                      quoteValue(tokenAmount((expected * 99n) / 100n, s, true)),
                    ],
                  ]
            }
          />
          <p className="small">
            {auto
              ? `Press Sell yourself and you keep the tip. If nobody sells it, or on any other ending, your PLEA and the tip come back; the ${tokenAmount(oracle, s, true)} oracle fee is spent.`
              : `Off: you pay the ${tokenAmount(oracle, s, true)} oracle fee from your ${pair} and sell yourself within ${span(Number(con(s, "CabalGate.EXECUTE_WINDOW") || 420))}, no extra fee.`}
          </p>
          {!address ? (
            <Notice title="Connect in the top bar to plead.">
              <p>Everything else here reads without a wallet.</p>
            </Notice>
          ) : balance.data?.open ? (
            <Notice
              title={`Plea #${balance.data.pending} is open: one plea at a time.`}
            >
              <p>
                {openPleaNotice(balance.data.pendingPlea, s!, now)}{" "}
                <a href={`#/p/${balance.data.pending}`}>
                  Open plea #{String(balance.data.pending)}
                </a>
              </p>
            </Notice>
          ) : balance.data && balance.data.cooldown > now ? (
            <Notice
              kind="warn"
              title={`Next plea possible at ${clock(balance.data.cooldown)}.`}
            >
              <p>
                {span(Number(con(s, "CabalGate.COOLDOWN")), "adj")} cooldown
                after your{" "}
                {balance.data.cooldownCause === "sale"
                  ? "sale"
                  : balance.data.cooldownCause === "denied plea"
                    ? "denied plea"
                    : "plea lapsed"}
                .
                {appealable && (
                  <>
                    {" "}
                    Plea #{String(balance.data.last)} can be appealed once until{" "}
                    {clock(
                      Number(denial.data.verdictAt) +
                        Number(con(s, "CabalGate.COOLDOWN")),
                    )}
                    :{" "}
                    <a href={`#/p/${balance.data.last}`}>
                      Appeal plea #{String(balance.data.last)}
                    </a>
                  </>
                )}
              </p>
            </Notice>
          ) : cannot ? (
            <Notice kind="bad" icon="prohibit" title="This plea cannot pass.">
              <p>
                Even a perfect plea (
                {String(con(s, "CabalGate.MAX_PLEA_SCORE"))}) cannot pass at
                this size.{" "}
                {passing
                  ? `Plead ${passing.n}% or less (${tokenAmount(passing.v, s)}) or wait for better facts.`
                  : "Wait for better facts."}
              </p>
            </Notice>
          ) : null}
          {excluded.data && (
            <Notice title="This wallet does not play seasons.">
              <p>
                It is PLEA’s owner or the launch owner (Seasons.excluded): its
                pleas earn no season points, prize or bonus, and nobody can
                object to them. Pleading and selling work as for anyone.
              </p>
            </Notice>
          )}
          {auto ? (
            <Action
              connectText="Connect a wallet first: your balance, facts and need come from it."
              {...tx}
              label="Submit plea"
              sub={`${tokenAmount(oracle + LETTERBOX.TIP, s, true)} in PLEA`}
              block
              onRun={() =>
                tx.send("Letterbox", "plead", [raw, text], undefined, {
                  errors: {
                    TooSmallForTheFee: (args) =>
                      `Worth ${tokenAmount(BigInt(args[0]), s, true)} at the hourly price; auto-sell needs at least ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} (about ${tokenAmount(floor, s)}). Raise the amount or untick auto-sell.`,
                    // The gate's FeeTooHigh (the price fell under the snapshot) reads as errors.ts says.
                    FeeTooHigh: (args) =>
                      feeSaleShort(args)
                        ? ""
                        : BigInt(args[0]) * 10n > BigInt(args[1])
                          ? `Auto-sell’s fees (at most ${tokenAmount(BigInt(args[0]), s, false, 0, "up")}) may take at most 10% of your PLEA, so it needs at least ${tokenAmount(BigInt(args[0]) * 10n, s, false, 0, "up")}; you hold ${tokenAmount(BigInt(args[1]), s)}. ${manualInstead}`
                          : `The plea and its fees (at most ${tokenAmount(BigInt(args[0]), s, false, 0, "up")}) must fit your ${tokenAmount(BigInt(args[1]), s)}. Lower the amount. Nothing was sent.`,
                  },
                })
              }
              disabled={!!reason || !tx.ready}
              reason={reason}
            />
          ) : (
            <ApprovedAction
              connectText="Connect a wallet first: your balance, facts and need come from it."
              name="CabalGate"
              fn="submitSell"
              args={[raw, text]}
              label="Submit plea"
              sub={tokenAmount(oracle, s, true)}
              token={r.addresses.PairToken}
              spender={r.addresses.CabalGate}
              spend={oracle}
              spendFor="for the oracle fee"
              disabled={!!reason}
              reason={reason}
            />
          )}
          <p className="small">
            Submit stays off until your text passes the checks; nothing is paid
            before that. One plea at a time, and a{" "}
            {span(Number(con(s, "CabalGate.COOLDOWN") || 14400), "adj")}{" "}
            cooldown follows a sale, a denial or a lapse.
          </p>
        </Panel>
        <div className="stack stack--lg">
          <Panel level={2} title="What happens next">
            <ol className="timeline">
              {[
                [
                  "arrow-right",
                  "Submitted",
                  "The contract checks your text, amount and need before taking the fee.",
                ],
                [
                  "hourglass",
                  "Waiting for the Cabal",
                  `Up to ${span(Number(con(s, "CabalGate.PENDING_EXPIRY") || 1200))}, usually 3 to 6. ${con(s, "CabalGate.PANEL_SIZE") || 30} judges score it; ${con(s, "CabalGate.QUORUM") || 17} must agree.`,
                ],
                [
                  "gavel",
                  "Verdict",
                  `Approved: sell within ${span(Number(con(s, "CabalGate.EXECUTE_WINDOW") || 420))}. Denied: one appeal within ${span(Number(con(s, "CabalGate.COOLDOWN") || 14400))}. No verdict: no cooldown, no fee back.`,
                ],
                [
                  "timer",
                  "Cooldown",
                  `${span(Number(con(s, "CabalGate.COOLDOWN") || 14400))} after a sale, a denial or a lapse.`,
                ],
              ].map(([icon, title, body], i) => (
                <li className={i === 0 ? "is-now" : "is-later"} key={title}>
                  <span className="timeline__dot">
                    <Icon name={icon} />
                  </span>
                  <div>
                    <p className="timeline__title">{title}</p>
                    <p className="timeline__meta">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel level={2} title="Rules the contract checks">
            <p>
              One line, 1 to {String(con(s, "CabalGate.MAX_PLEA_BYTES") || 280)}{" "}
              bytes; no hidden characters or plea markers. Sell{" "}
              {Number(con(s, "CabalGate.MIN_SHARE_BPS") || 100) / 100}% to{" "}
              {Number(con(s, "CabalGate.MAX_SHARE_BPS") || 5000) / 100}% of the
              balance, at most {tokenAmount(cap, s)}. The need may not exceed{" "}
              {String(con(s, "CabalGate.MAX_PLEA_SCORE") || 45)}. One open plea
              per wallet.
            </p>
          </Panel>
          <Panel level={2} title="Pleas that passed">
            {s?.pleas
              .filter((p) => [2, 4, 5].includes(p.status))
              .slice(0, 2)
              .map((p) => (
                <div key={String(p.id)}>
                  <Stamp p={p} />
                  <p>
                    <a href={`#/p/${p.id}`}>Plea #{String(p.id)}</a> ·{" "}
                    {p.name || short(p.seller)}
                  </p>
                  <p>“{p.text}”</p>
                </div>
              ))}
            {s && !s.pleas.some((p) => [2, 4, 5].includes(p.status)) && (
              <p>No approvals yet.</p>
            )}
            <a className="link-btn" href="#/wall">
              Every plea on the Wall <Icon name="arrow-right" />
            </a>
          </Panel>
        </div>
      </div>
    </div>
  );
}
