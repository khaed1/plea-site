import { con, read, readPlea, type Plea, type Snapshot } from "./chain";
import type { Runtime } from "./config";
import {
  LETTERBOX,
  appealFeeBlock,
  clampAppeal,
  ceil,
  min,
  sharePoints,
  pendingState,
  Q96,
} from "./models";
export async function returnedEscrow(
  r: Runtime,
  s: Snapshot,
  wallet: `0x${string}`,
  now: number,
) {
  const [id] = await read(r, "Letterbox", "openOf", [wallet]);
  if (!id) return { returned: 0n, blocked: "", id: 0n };
  const [escrow, plea] = await Promise.all([
    read(r, "Letterbox", "escrowOf", [id]),
    readPlea(r, id, s.v["CabalGate.intake"]),
  ]);
  const state = pendingState(
    plea,
    now,
    Number(con(s, "CabalGate.EXECUTE_WINDOW")),
    Number(con(s, "CabalGate.PENDING_EXPIRY")),
  );
  return {
    id: BigInt(id),
    returned: escrow[1] && state.settleable ? BigInt(escrow[2]) : 0n,
    blocked:
      escrow[1] && !state.settleable
        ? `Plea #${id} is still open: one plea at a time.`
        : "",
  };
}
export async function appealPreview(
  r: Runtime,
  s: Snapshot,
  p: Plea,
  wallet: `0x${string}`,
  automatic: boolean,
  requested: bigint,
) {
  const [held, originalBalance, price, escrow] = await Promise.all([
    read(r, "PLEA", "balanceOf", [wallet]),
    read(r, "CabalGate", "pleaBalance", [p.id]),
    read(r, "PleaHook", "latestPrice"),
    automatic
      ? returnedEscrow(r, s, wallet, s.timestamp)
      : { returned: 0n, blocked: "", id: 0n },
  ]);
  const balance = BigInt(held) + escrow.returned;
  const result = clampAppeal(
    p.amount,
    balance,
    originalBalance,
    BigInt(con(s, "CabalGate.MAX_SELL")),
    price,
    automatic,
    requested,
  );
  let fact = Number(
    await read(r, "CabalGate", "factScore", [wallet, result.amount]),
  );
  if (held && balance && originalBalance)
    fact +=
      sharePoints(
        min(
          ceil(result.amount * 10000n, balance),
          ceil(p.amount * 10000n, originalBalance),
        ),
      ) - sharePoints(ceil(result.amount * 10000n, held));
  const fee = BigInt(s.v.appealFees?.[1] || 0n);
  // Letterbox._appeal with the site's box (no BY_LETTER): the appeal must be worth MIN_SALE_VALUE
  // (TooSmallForTheFee), and its fees must fit 10% of the balance or the original's 10% margin, and
  // the balance (FeeTooHigh).
  const autoBlock: "" | "value" | "fee" = !automatic
    ? ""
    : price && (result.amount * price) / Q96 < LETTERBOX.MIN_SALE_VALUE
      ? "value"
      : appealFeeBlock(fee, balance, p.amount, result.amount)
        ? "fee"
        : "";
  const reason =
    escrow.blocked ||
    (autoBlock === "value"
      ? "Auto-sell needs a sale worth at least 0.70 imdTEST. Untick auto-sell to appeal manually."
      : autoBlock === "fee"
        ? "The auto-sell fee exceeds this appeal’s balance or fee cap. Untick auto-sell to pay from your imdTEST."
        : "");
  return {
    ...result,
    fact,
    need: Number(con(s, "CabalGate.PASS_MARK")) - fact,
    balance,
    returned: escrow.returned,
    value: price ? (result.amount * price) / Q96 : 0n,
    fee,
    autoBlock,
    reason,
  };
}

/** What a letter from `wallet` meets in the Letterbox before its rules are checked: _settleOpen
 * returns a settleable earlier escrow first (or refuses while one is still open), and an APPEAL
 * letter appeals _appealTarget, the newest plea or, for an appeal the oracle never answered, the
 * denied plea it appealed. Read for the Letters page's checks (FIXUP: returned escrow, APPEAL fees). */
export async function letterPrecheck(
  r: Runtime,
  s: Snapshot,
  wallet: `0x${string}`,
) {
  const [held, escrow, last] = await Promise.all([
    read(r, "PLEA", "balanceOf", [wallet]),
    returnedEscrow(r, s, wallet, s.timestamp),
    read(r, "CabalGate", "lastPleaOf", [wallet]),
  ]);
  const balance = BigInt(held) + escrow.returned;
  let target = BigInt(last || 0n),
    original: any;
  if (target) {
    const p = await readPlea(r, target, s.v["CabalGate.intake"]);
    const settleable = pendingState(
      p,
      s.timestamp,
      Number(con(s, "CabalGate.EXECUTE_WINDOW")),
      Number(con(s, "CabalGate.PENDING_EXPIRY")),
    ).settleable;
    if (p.isAppeal && (p.status === 6 || (p.status === 1 && settleable)))
      target = BigInt(p.originalId);
    original =
      target === BigInt(last)
        ? p
        : await read(r, "CabalGate", "getPlea", [target]);
  }
  let appeal: { id: bigint; amount: bigint; original: bigint } | undefined;
  if (target && original) {
    const originalBalance = BigInt(
      await read(r, "CabalGate", "pleaBalance", [target]),
    );
    appeal = {
      id: target,
      original: BigInt(original.amount),
      amount: clampAppeal(
        BigInt(original.amount),
        balance,
        originalBalance,
        BigInt(con(s, "CabalGate.MAX_SELL")),
        BigInt(s.v["PleaHook.latestPrice"] || 0n),
        true,
      ).amount,
    };
  }
  return {
    held: BigInt(held),
    returned: escrow.returned,
    escrowId: escrow.id,
    blocked: escrow.blocked,
    balance,
    appeal,
    // The gate would take this appeal (denied, not itself an appeal, not appealed, within the
    // cooldown): only then is the fee rule the one that decides it.
    appealable:
      !!original &&
      Number(original.status) === 3 &&
      !original.isAppeal &&
      !original.appealed &&
      s.timestamp <=
        Number(original.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")),
  };
}
