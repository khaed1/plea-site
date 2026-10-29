import { site, type FactRules } from "./site.ts";

/** Immutable internal Letterbox constants, pinned src/Letterbox.sol:111–136 (testnet9). */
export const LETTERBOX = {
  LETTER_SHARE_BPS: 2000n,
  MIN_LETTER: 1000n * 10n ** 18n,
  TIP: 250000000000000000n,
  AUTO_SELL_FEE: 350000000000000000n,
  MIN_SALE_VALUE: 700000000000000000n,
  MIN_OUT_BPS: 9500n,
  MAX_FEE_SHARE_BPS: 1000n,
  FEE_CAP_BPS: 11000n,
};
export const Q96 = 2n ** 96n;
export const min = (a: bigint, b: bigint) => (a < b ? a : b);
export const max = (a: bigint, b: bigint) => (a > b ? a : b);
export const ceil = (a: bigint, b: bigint) => (a + b - 1n) / b;
export const sharePoints = (bps: bigint) =>
  bps <= 2000n ? 16 : bps <= 3500n ? 9 : 3;
export function pendingState(
  p: any,
  now: number,
  execute: number,
  expiry: number,
  lastLapsed = 0,
) {
  if (!p) return { open: false, lapsedAt: lastLapsed, settleable: false };
  const open =
    (p.status === 1 && !p.completed && now <= Number(p.submittedAt) + expiry) ||
    (p.status === 2 && now <= Number(p.verdictAt) + execute);
  const lapsedAt =
    p.status === 2 && !open
      ? Math.max(lastLapsed, Number(p.verdictAt))
      : lastLapsed;
  return {
    open,
    lapsedAt,
    settleable:
      [3, 5, 6].includes(p.status) || ([1, 2].includes(p.status) && !open),
  };
}
/** What the writer gets from Letterbox._deliver for a sale of `sold`: a letter (BY_LETTER, flag 1)
 * pays no auto-sell fee; the site's auto-sell box pays AUTO_SELL_FEE, never more than the sale (r2D-N6). */
export const deliverOut = (sold: bigint, flags: number) =>
  flags & 1 ? sold : sold - min(sold, LETTERBOX.AUTO_SELL_FEE);
export function potFor(
  fees: bigint,
  season: bigint,
  nextToClose: bigint,
  rollover: bigint,
) {
  return fees + (season === nextToClose ? rollover : 0n);
}
/** What the seasons before a later one roll into it. Seasons close in order (nextToClose), and
 * closeSeason takes in seasonFees + rollover, pays each qualifying rank its share of that, rounded
 * down on its own, and rolls the rest over (Seasons.closeSeason). `waiting` lists the seasons from
 * nextToClose up to the one before, oldest first, with their seasonFees and the share bps of the
 * ranks their boards would pay as they stand; `rollover` is Seasons.rollover now. */
export function carriedRollover(
  rollover: bigint,
  waiting: { fees: bigint; paidBps: bigint[] }[],
) {
  let carry = rollover;
  for (const w of waiting) {
    const amountIn = w.fees + carry;
    carry =
      amountIn -
      w.paidBps.reduce((n, bps) => n + (amountIn * bps) / 10000n, 0n);
  }
  return carry;
}
export function clampAppeal(
  original: bigint,
  balance: bigint,
  originalBalance: bigint,
  maxSell: bigint,
  price: bigint,
  automatic: boolean,
  requested = original,
) {
  const minimum = min(min(balance, originalBalance || balance) / 100n, maxSell);
  if (!automatic)
    return { amount: requested, minimum, maximum: min(original, balance / 2n) };
  let amount = min(original, balance / 2n);
  if (originalBalance)
    amount = max(min(amount, (balance * original) / originalBalance), minimum);
  if (price && amount < ceil(LETTERBOX.MIN_SALE_VALUE * Q96, price))
    amount = min(
      min(ceil(LETTERBOX.MIN_SALE_VALUE * Q96, price), original),
      balance / 2n,
    );
  return { amount, minimum, maximum: min(original, balance / 2n) };
}
/** CabalGate._heldPoints: the points for PLEA held since `since` (0: no record) at `now`, from the
 * deployment's holding bands (site.json `facts`). */
export function heldPoints(since: number, now: number, facts: FactRules = site().facts) {
  if (!since || since > now) return 0;
  return facts.held.find((b) => now - since >= b.days * 86400)?.points ?? 0;
}
/** The most a fact score can be: share 16 + the longest hold + a loss 13 + a rising trend 9 (45 on
 * Sepolia run 9, 41 on Ethereum). */
export const factMax = (facts: FactRules = site().facts) =>
  16 + Math.max(...facts.held.map((b) => b.points)) + 13 + 9;
export function factParts(
  balance: bigint,
  amount: bigint,
  basis: readonly bigint[],
  latest: bigint,
  previous: bigint,
  started: number,
  now: number,
  facts: FactRules = site().facts,
) {
  const held = (t: number) => heldPoints(t, now, facts),
    receivedProfit = facts.receivedProfit;
  const share = balance ? sharePoints(ceil(amount * 10000n, balance)) : 0,
    heldRecord = held(Number(basis[2]));
  const value = (basis[1] * latest) / Q96,
    spent = basis[0],
    gain = value - spent;
  const profit = !spent
    ? 0
    : value < spent
      ? 13
      : gain * 2n <= spent
        ? 12
        : gain <= spent * 2n
          ? 10
          : gain <= spent * 5n
            ? 8
            : gain <= spent * 10n
              ? 6
              : 4;
  const trend = !previous
    ? 5
    : latest > (previous * 102n) / 100n
      ? 9
      : latest * 100n >= previous * 98n
        ? 5
        : 0;
  // CabalGate._factScoreAt: PLEA no buy record covers (claims, prizes, exempt transfers) counts as
  // held since trading opened, at the deployment's received profit (10 on Sepolia run 9, 9 on
  // Ethereum); a plea larger than the record takes the PLEA-weighted mean of the two, rounded to the
  // nearest point (E2).
  const openHeld = held(started),
    covered = Number(
      basis[1] < amount && amount
        ? (basis[1] * BigInt(heldRecord + profit) +
            (amount - basis[1]) * BigInt(openHeld + receivedProfit) +
            amount / 2n) /
            amount
        : BigInt(heldRecord + profit),
    );
  const mode: "record" | "received" | "mixed" =
    !amount || basis[1] >= amount
      ? "record"
      : basis[1] === 0n
        ? "received"
        : "mixed";
  const received = mode === "received";
  return {
    shareBps: balance ? ceil(amount * 10000n, balance) : null,
    heldFor: received
      ? started
        ? Math.max(0, now - started)
        : null
      : basis[1] && basis[2]
        ? Math.max(0, now - Number(basis[2]))
        : null,
    pnlBps: !received && spent ? ((value - spent) * 10000n) / spent : null,
    trendLabel: trend === 9 ? "up" : trend === 0 ? "down" : "flat",
    share,
    held: received ? openHeld : heldRecord,
    profit: received ? receivedProfit : profit,
    trend,
    total: balance ? share + covered + trend : 0,
    uncovered: basis[1] < amount ? amount - basis[1] : 0n,
    weighted: covered,
    mode,
    covered: basis[1] < amount ? basis[1] : amount,
    record: heldRecord + profit,
    openHeld,
    openFor: started ? Math.max(0, now - started) : null,
  };
}
/** The terms that add up to the fact score, as the contract adds them (E2): share + held + profit
 * + trend, or for a plea larger than its buy record share + the PLEA-weighted held and profit +
 * trend. */
export function factTerms(parts: {
  mode?: string;
  share: number;
  held: number;
  profit: number;
  weighted: number;
  trend: number;
}) {
  return parts.mode === "mixed"
    ? [parts.share, parts.weighted, parts.trend]
    : [parts.share, parts.held, parts.profit, parts.trend];
}
/** The least PLEA a plain letter (Letterbox._plead with amount 0) accepts, from the fee cap
 * (Letterbox.feesFor(false)[1]) and the hourly price (PleaHook.latestPrice), E1 / r2D-N4:
 * - FeeTooHigh: maxFeePlea × 10,000 > balance × MAX_FEE_SHARE_BPS, so balance ≥ 10 × maxFeePlea;
 * - TooSmallForTheFee: 20% of the balance (rounded down) must be worth MIN_SALE_VALUE at the
 *   hourly price, so balance ≥ 5 × ceil(MIN_SALE_VALUE × Q96 / price);
 * - LetterTooSmall: 20% of the balance must be at least MIN_LETTER, so balance ≥ 5 × MIN_LETTER. */
export function letterMinimum(
  maxFeePlea: bigint,
  price: bigint,
  maxSell = 2_500_000n * 10n ** 18n,
) {
  const per = 10000n / LETTERBOX.LETTER_SHARE_BPS,
    byFee = ceil(maxFeePlea * 10000n, LETTERBOX.MAX_FEE_SHARE_BPS),
    floorAmount = price ? ceil(LETTERBOX.MIN_SALE_VALUE * Q96, price) : 0n,
    byValue = floorAmount * per,
    byLetter = LETTERBOX.MIN_LETTER * per;
  const minimum = max(byFee, max(byValue, byLetter));
  return {
    minimum,
    byFee,
    byValue,
    byLetter,
    floorAmount,
    // A letter pleads at most MAX_SELL: if that is worth less than the floor, no balance passes.
    possible: floorAmount <= maxSell,
    reason:
      minimum === byFee ? "fee" : minimum === byValue ? "value" : "letter",
  } as const;
}
/** Letterbox._appeal's FeeTooHigh, for an APPEAL letter and the site's auto-sell appeal alike: the
 * fees may take 10% of the balance or, when that is more, at most the denied plea's amount + 10%
 * (FEE_CAP_BPS) ("cap"); and the escrow and the fees must fit the balance ("fit"). The balance is
 * the one after Letterbox._settleOpen returned an earlier escrow. */
export function appealFeeBlock(
  maxFeePlea: bigint,
  balance: bigint,
  original: bigint,
  amount: bigint,
): "" | "cap" | "fit" {
  if (!maxFeePlea) return "";
  if (
    maxFeePlea * 10000n > balance * LETTERBOX.MAX_FEE_SHARE_BPS &&
    maxFeePlea * 10000n > original * LETTERBOX.FEE_CAP_BPS
  )
    return "cap";
  return amount + maxFeePlea > balance ? "fit" : "";
}
/** Why the site's auto-sell box (Letterbox.plead) cannot work for this balance at any amount, or
 * "" (TRAP2): its fees may take at most 10% of the balance (FeeTooHigh), and the plea must be worth
 * MIN_SALE_VALUE at the hourly price (TooSmallForTheFee) within the gate's max (50%, MAX_SELL). */
export function autoSellBlock(
  balance: bigint,
  maxFeePlea: bigint,
  price: bigint,
  maxSell: bigint,
): "" | "fee" | "value" {
  if (!maxFeePlea || !price) return "";
  if (maxFeePlea * 10000n > balance * LETTERBOX.MAX_FEE_SHARE_BPS) return "fee";
  const floorAmount = ceil(LETTERBOX.MIN_SALE_VALUE * Q96, price),
    most = min(balance / 2n, maxSell);
  if (floorAmount > most || floorAmount + maxFeePlea > balance) return "value";
  return "";
}

/** Round each displayed fee part once; sums use those same bigint values. */
export function feeDisplay(
  raw: bigint,
  c: Record<string, any>,
  extra = 0n,
  dead = false,
  payText?: string,
) {
  const E = 10n ** 18n,
    bps = (key: string) => BigInt(c[`PleaHook.${key}`] || 0),
    normal = bps("IMD_FEE_BPS"),
    fee = (raw * (normal + extra)) / (10000n + normal + extra),
    reaches = raw - fee;
  const part = (key: string) => (reaches * bps(key)) / 10000n;
  const round = (n: bigint, d: number, up = false) => {
    const unit = 10n ** BigInt(18 - d);
    return (n / unit + (up && n % unit ? 1n : 0n)) * unit;
  };
  const cleaned = payText?.replaceAll(",", "");
  const validText =
    cleaned && /^\d+(\.\d*)?$/.test(cleaned) ? cleaned : undefined;
  const [whole, fraction = ""] = validText?.split(".") || [];
  const pay = validText
    ? BigInt(whole || "0") * E +
      BigInt((fraction + "0".repeat(18)).slice(0, 18))
    : round(raw, 2, true);
  const payDigits = Math.min(18, Math.max(2, fraction.length));
  let cashDigits = 2,
    partDigits = 3;
  // The launch fee is what the extra rate adds. With no extra, fee − R × 2% is only a
  // rounding wei (often −1), never a fee: rounded up it would hide 0.01 (r2T-N1).
  const residual = fee - (reaches * normal) / 10000n,
    launchFee = extra > 0n && residual > 0n ? residual : 0n;
  const parts = () => ({
    cash: round(part("CASHBACK_BPS"), cashDigits),
    owner: round(part("OWNER_BPS"), cashDigits, true),
    prize: dead ? 0n : round(part("PRIZE_BPS"), partDigits, true),
    wall: round(
      part("POOL_BPS") + (dead ? part("PRIZE_BPS") : 0n),
      partDigits,
      true,
    ),
    launch: round(launchFee, cashDigits, true),
  });
  let values = parts();
  const exact: Record<string, bigint> = {
    cash: part("CASHBACK_BPS"),
    owner: part("OWNER_BPS"),
    prize: dead ? 0n : part("PRIZE_BPS"),
    wall: part("POOL_BPS") + (dead ? part("PRIZE_BPS") : 0n),
    launch: launchFee,
  };
  // A part rounded at its decimals may hide most of itself on a small buy (0.000196 owner shown as
  // 0.01, a 0.0049 cashback as 0.00), and "reaches the pool" with it. More decimals until no shown
  // part is off by more than half of the exact one (buy.html's 2 and 3 decimals for usual amounts).
  const hides = (v: Record<string, bigint>) =>
    Object.entries(v).some(([k, n]) => {
      const e = exact[k],
        d = n > e ? n - e : e - n;
      return e > 0n && d * 2n > e;
    });
  // Sub-cent inputs need more precision to keep conservative rounding from exceeding the payment.
  while (
    (Object.values(values).reduce((a, b) => a + b, 0n) > pay ||
      hides(values)) &&
    partDigits < 18
  ) {
    cashDigits++;
    partDigits++;
    values = parts();
  }
  const { cash, owner, prize, wall, launch } = values,
    fees = cash + owner + prize + wall;
  const digits =
    fees % 10n ** BigInt(18 - cashDigits) ? partDigits : cashDigits;
  const fmt = (n: bigint, d = digits) =>
    `${n < 0n ? "−" : ""}${((n < 0n ? -n : n) / E).toLocaleString("en-US")}.${((n < 0n ? -n : n) % E).toString().padStart(18, "0").slice(0, d)}`;
  return {
    cash: fmt(cash, cashDigits),
    owner: fmt(owner, cashDigits),
    prize: fmt(prize, partDigits),
    wall: fmt(wall, partDigits),
    launch: fmt(launch, cashDigits),
    fees: fmt(fees),
    reaches: fmt(pay - fees - launch, Math.max(digits, payDigits)),
    pay: fmt(pay, payDigits),
    digits,
  };
}
