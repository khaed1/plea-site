import { site } from "./site";
import { DisplayError } from "./errors";
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
  encodeSell,
  permit2Abi,
  permit2Spendable,
  universalRouterAbi,
} from "./universal-router";
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
  const launchExtra = extra ?? BigInt(liveExtra);
  return estimateHookOutput({
    amount: raw,
    // The pool key decides the direction: imdTEST is currency0 on Sepolia run 9, PLEA may be on
    // Ethereum (a buy is then oneForZero).
    zeroForOne: swapZeroForOne(
      selling,
      pleaIsZero(val(s, "PleaHook.poolKey"), r.addresses.PLEA),
    ),
    sqrt,
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
  const [input, setInput] = useState(""),
    [selling, setSelling] = useState(false),
    [slip, setSlip] = useState(100),
    [revision, setRevision] = useState(0),
    [approved, setApproved] = useState(false),
    [fill, setFill] = useState(""),
    [maxRaw, setMaxRaw] = useState<bigint>();
  const tx = useTx(`${input}:${selling}:${slip}:${maxRaw}`),
    dead = !!val(s, "CabalGate.diedAt"),
    seeded = !!val(s, "PleaHook.seeded"),
    pair = s?.constants.pairSymbol || site().pairSymbol,
    unit = selling ? "PLEA" : pair,
    raw = maxRaw ?? parseAmount(input);
  const inputToken = selling ? r.addresses.PLEA : r.addresses.PairToken,
    available = selling ? balance.data?.plea : balance.data?.pair;
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
  const liveQuote = useRead(
    async () => {
      const key = val(s, "PleaHook.poolKey"),
        zeroForOne = key.currency0.toLowerCase() === inputToken.toLowerCase(),
        hookData = address
          ? encodeAbiParameters([{ type: "address" }], [address])
          : "0x";
      const estimate = await poolQuote(r, s!, raw, selling, extra);
      return { ...estimate, key, zeroForOne, hookData, at: Date.now() };
    },
    [raw.toString(), selling, address, slip, revision],
    !!s && raw > 0n && !!val(s, "PleaHook.seeded") && !tradeDone,
  );
  const quote =
    tradeDone && frozenQuote
      ? { ...liveQuote, data: frozenQuote, loading: false, error: "" }
      : liveQuote;
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
    !!address && !!s,
  );
  // An allowance that expires within the minute is renewed rather than raced.
  const step: "token" | "permit2" | "trade" | undefined =
    allowance.data === undefined
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
  const planKey = `${address}:${selling}:${raw}`,
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
        ? `This buy would take ${tokenAmount(quote.data.gross, s)} before the burn. Until ${clock(launch + window)} one buy can take at most ${tokenAmount(cap, s)}. Pay less ${pair}, or split the buy in two.`
        : "";
  const invalid =
    !tradeDone && ((available !== undefined && raw > available) || !!capError);
  const amountReason = !val(s, "PleaHook.seeded")
    ? "Trading is not open yet."
    : raw <= 0n
      ? `Enter how much ${unit} to ${selling ? "sell" : "pay"}, or press Max. The quote and the fees show once there is an amount.`
      : available !== undefined && raw > available
        ? `You have ${tokenAmount(available, s, !selling)}. Lower the amount or press Max.`
        : capError ||
          // The pool cannot fill this amount at any price: no approval can help, so none is offered.
          (quote.error === LIQUIDITY_SHORT
            ? `Lower the amount: the pool cannot fill ${selling ? "this sale" : "this buy"}.`
            : quote.error === NO_LIQUIDITY
              ? selling
                ? `The pool has no ${pair} left to pay for a sale; nothing can be sold until someone buys.`
                : "The pool has no PLEA left to buy; nothing can be bought until someone sells."
              : "");
  const poolBlocked = quote.error === LIQUIDITY_SHORT || quote.error === NO_LIQUIDITY;
  const reason = tradeDone
    ? ""
    : amountReason ||
      (!needsApproval
        ? quote.error ||
          (!quote.data ? "Waiting for the quote from the pool." : "")
        : "");
  const minOut = quote.data
    ? (quote.data.out * BigInt(10000 - slip)) / 10000n
    : undefined;
  const normal = BigInt(con(s, "PleaHook.IMD_FEE_BPS") || 0),
    rate = normal + extra,
    fee = (raw * rate) / (10000n + rate),
    reaches = raw - fee;
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
    [raw.toString(), selling],
    !!s && raw > 0n && !selling,
  );
  const capMessage = {
    title: `Not bought: more than ${tokenAmount(cap, s)} in one buy.`,
    body: `Until ${clock(launch + window)} one buy can take at most ${tokenAmount(cap, s)}. Pay less ${pair}, or split the buy in two. Nothing was bought.`,
  };
  const priceMessage = {
    title: `The price moved more than ${slip / 100}%.`,
    body: `Nothing was ${selling ? "sold" : "bought"}; your ${unit} stays in your wallet. Try again, or ${slip >= 200 ? "lower the amount." : `raise the slippage to ${slip < 100 ? 1 : 2}%.`}`,
  };
  const swapErrors = {
    BuyTooLarge: capMessage,
    PriceLimitAlreadyExceeded: priceMessage,
  };
  const display = s
    ? feeDisplay(raw, s.constants, extra, dead, input || undefined)
    : undefined;
  // What the field shows for this amount: Max fills the field rounded down; a typed amount is
  // shown as typed (feeDisplay's "you pay").
  const shownPay =
    maxRaw !== undefined
      ? amount(maxRaw, 18, selling ? 0 : 2)
      : display && !selling
        ? display.pay
        : exactAmount(raw, 18, selling ? 0 : 2);
  const permitMessage = {
    title: "Your Permit2 allowance for the router ran out.",
    body: `Press the button to allow the router again (it lasts 30 minutes), then ${selling ? "sell" : "buy"}. Nothing was ${selling ? "sold" : "bought"}.`,
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
                    const q = await poolQuote(r, s!, raw, false);
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
              const q = await poolQuote(r, s!, raw, false);
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
    setApproved(false);
    await tx.send("", "swap", [], undefined, {
      errors: { ...swapErrors, ...routerErrors },
      prepare: async () => {
        const q = await poolQuote(r, s!, raw, selling),
          key = val(s, "PleaHook.poolKey");
        if (trade.kind === "universalRouter") {
          // The quote is the site's own walk of the pool (the v4 Quoter sees 0 PLEA while the
          // Cabal lives); the router enforces the minimum: a balance check on the buyer's PLEA
          // for a buy, the IMD it takes for a sale.
          const minimum = (q.out * BigInt(10000 - slip)) / 10000n,
            router = { address: trade.router, minHopPrice: trade.minHopPrice },
            [block, held] = await Promise.all([
              r.client.getBlock(),
              selling
                ? Promise.resolve(0n)
                : read(r, "PLEA", "balanceOf", [address]),
            ]);
          const encoded = selling
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
        let spent = transfers
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
        spent -= refund;
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
          spent === raw
            ? `${shownPay} ${unit}`
            : tokenAmount(spent, s, !selling, selling ? 0 : 2, "up");
        const text = selling
          ? `Sold ${paid} for ${tokenAmount(received, s, true)}.`
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
            ? ` ${tokenAmount(raw - spent, s, !selling)} did not fill and stayed in your wallet: the price reached your ${slip / 100}% limit.`
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
                  onClick={() => setSelling(v)}
                >
                  {v ? "Sell" : "Buy"}
                </button>
              ))}
            </div>
          )}
          <AmountInput
            id="pay"
            label={selling ? "You sell" : "You pay"}
            value={input}
            onChange={(v) => {
              setInput(v);
              setMaxRaw(undefined);
            }}
            unit={unit}
            invalid={invalid}
            hint={invalid ? capError || amountReason : undefined}
            aside={
              address ? (
                <>
                  <span>Balance {tokenAmount(available, s, !selling)}</span> ·{" "}
                  <button
                    className="link-btn"
                    onClick={() =>
                      available !== undefined &&
                      (setInput(amount(available, 18, selling ? 0 : 2)),
                      setMaxRaw(available))
                    }
                  >
                    Max
                    <span className="sr-only">
                      : {selling ? "sell" : "pay"} all{" "}
                      {tokenAmount(available, s, !selling)}
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
                  Reading the pool…
                </span>
              ) : quote.data ? (
                `Updated ${Math.floor((Date.now() - quote.data.at) / 1000)} s ago`
              ) : (
                ""
              )
            }
          />
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
          {raw > 0n && s && seeded && !tradeDone && display && (
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
                    `Fees, ${pct(normal + BigInt(con(s, "PleaHook.PLEA_BURN_BPS")))}`,
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
                    : ""} = {display.pay} {pair} you pay. The{" "}
                  {dead ? "three" : "four"} parts add up to {display.fees}{" "}
                  {pair}.
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
            disabled={!tx.ready || !!reason || allowance.data === undefined}
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
                  amount: `${exactAmount(raw, Number(s?.constants[selling ? "decimals" : "pairDecimals"] ?? 18), selling ? 0 : 2)} ${unit}`,
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
                    {raw && seeded && !selling
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
                    {raw && seeded && !selling
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
                    FeeTooHigh: (args) =>
                      BigInt(args[0]) * 10n > BigInt(args[1])
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
