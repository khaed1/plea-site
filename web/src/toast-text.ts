/** Toast and transaction-outcome copy, kept free of React so the unit tests can check it. The
 * texts follow components.html and the page mockups' toasts; every number comes from the chain
 * snapshot, a receipt's events or a contract constant (r2D-N9). */
import { LETTERBOX } from "./models";
import {
  clock,
  con,
  val,
  span,
  short,
  tokenAmount,
  soldFor,
  recordHint,
  recordFrom,
  feeInPlea,
  type Plea,
  type Snapshot,
} from "./chain";
import type { ErrorMessage } from "./errors";
/** A toast line: plain text, or parts where an object is kept on one line, in the mono face when
 * `mono` (an address or a letter command) and bold when `strong`, as the mockups' toasts mark them
 * (<span class="mono nowrap">0x7a3f…c21e</span>, <b class="mono nowrap">APPEAL &lt;text&gt;</b>). */
export type ToastPart = string | { text: string; mono?: boolean; strong?: boolean };
export type ToastText = string | ToastPart[];
/** The words of a toast line, without its marks (tests, receipts, de-duplication). */
export const plainText = (t?: ToastText) =>
  t === undefined
    ? undefined
    : typeof t === "string"
      ? t
      : t.map((part) => (typeof part === "string" ? part : part.text)).join("");
export type Toast = {
  text: ToastText;
  body?: ToastText;
  icon?: string;
  kind?: "bad" | "ok" | "pending" | "sold" | "info";
  /** The transaction: linked once, as "View transaction" (or `receiptLabel`). */
  hash?: string;
  receiptLabel?: string;
  /** A page on the site, e.g. #/p/12 with the link text "Open plea #12". */
  href?: string;
  link?: string;
  role?: "status" | "alert";
};
/** The links a toast shows, in its body: the site page first, then the transaction. One
 * "Open plea #N" to #/p/N and one "View transaction" to the explorer, never two links with the same
 * name (r2X-3, r2D-N3; components.html toasts). */
export function toastLinks(t: Toast, explorer: string) {
  const links: { href: string; text: string; external: boolean }[] = [];
  if (t.href && t.link) links.push({ href: t.href, text: t.link, external: false });
  if (t.hash)
    links.push({
      href: `${explorer}/tx/${t.hash}`,
      text: t.receiptLabel || "View transaction",
      external: true,
    });
  return links;
}
const nextPleaAt = (p: Plea, s: Snapshot) =>
  clock(Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")));
/** An approved plea whose sell window closed unsold (plea.html:466). A lapse starts the cooldown at
 * the verdict (CabalGate._clearStale: lastLapsedAt = verdictAt); its points still count unless an
 * objection was sustained or the seller is excluded, and they are held until the objection window
 * (or a pending objection) ends. */
export function windowClosedToast(p: Plea, s: Snapshot, now: number): Toast {
  const end =
      Number(p.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW")),
    counts = !p.excluded && !p.standing?.[1];
  let points = "";
  if (counts && p.recorded) points = ` Your +${p.points} points are recorded.`;
  else if (counts) {
    const held = recordFrom(p, s, now);
    points =
      held && held.until > now
        ? ` Your +${p.points} points still count: held until ${clock(held.until)}, then record them.`
        : ` Your +${p.points} points still count: record them now.`;
  }
  return {
    kind: "info",
    icon: "clock",
    text: `The window closed at ${clock(end, true)}.`,
    body: `Plea #${p.id} lapsed: nothing was sold.${points} Next plea at ${nextPleaAt(p, s)}.`,
    href: `#/p/${p.id}`,
    link: `Open plea #${p.id}`,
  };
}
/** The verdict toast for the connected wallet's own plea. A denial's body shows only while an
 * appeal is possible (not an appeal, not appealed, the Cabal alive, within COOLDOWN of the verdict:
 * CabalGate.appeal's AppealClosed). A letter's denial is appealed by an APPEAL letter, which costs
 * Letterbox.feesFor(true) in PLEA; settle instead returns the escrow and the tip, and the oracle fee
 * is spent (letters.html:360). */
export function verdictToast(p: Plea, s: Snapshot, approved: boolean): Toast {
  const link = { href: `#/p/${p.id}`, link: `Open plea #${p.id}` };
  if (approved) {
    const window = Number(con(s, "CabalGate.EXECUTE_WINDOW"));
    return {
      kind: "ok",
      icon: "check-circle",
      role: "status",
      text: `Approved, ${p.score} vs need ${p.need}.`,
      body: `Sell within ${span(window)}, by ${clock(Number(p.verdictAt) + window)}.`,
      ...link,
    };
  }
  const until = Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")),
    open =
      !p.isAppeal &&
      !p.appealed &&
      !!val(s, "CabalGate.cabalAlive") &&
      s.timestamp <= until;
  let body: ToastText | undefined;
  if (open && p.flags & 1) {
    const fee = BigInt(
        s.v.appealFees?.[0] ??
          BigInt(con(s, "CabalGate.ORACLE_FEE")) +
            BigInt(con(s, "CabalGate.APPEAL_POOL_SHARE")) +
            LETTERBOX.TIP,
      ),
      plea = feeInPlea(s, fee);
    body = [
      "One appeal: send ",
      { text: "APPEAL <text>", mono: true, strong: true },
      ` before ${clock(until)} (`,
      { text: tokenAmount(fee, s, true) },
      ` in ${s.constants.symbol}${plea === undefined ? "" : `, about ${tokenAmount(plea, s, false, 0, "up")}`}). Or call settle to get your ${tokenAmount(p.escrow?.[2] || p.amount, s)} and the ${tokenAmount(LETTERBOX.TIP, s, true)} tip back; the ${tokenAmount(BigInt(con(s, "CabalGate.ORACLE_FEE")), s, true)} oracle fee is spent.`,
    ];
  } else if (open) body = `One appeal until ${clock(until)}.`;
  return {
    kind: "bad",
    icon: "x-circle",
    role: "status",
    text: `Denied, ${p.score} vs need ${p.need}: ${p.need - p.score} short.`,
    body,
    ...link,
  };
}
/** Letterbox.deliver's toast, by who is looking (r2D-N1). The writer of a plea a runner sold gets
 * letters.html:359's "sold for you"; a writer who delivered it themselves gets the sale and the tip
 * back; a runner gets a runner line and never the writer's points or cooldown. The writer's
 * amount is Delivered.imdOut (after the auto-sell fee), the next plea is the Delivered block time +
 * COOLDOWN (CabalGate.executeSellFor: lastExecutedAt = block.timestamp); without that block's time
 * (its read failed) the toast leaves the next plea out rather than guess it. */
export function deliveredToast(
  p: Plea,
  s: Snapshot,
  args: { runner: string; imdOut?: bigint; tip: bigint },
  time: number | undefined,
  wallet?: string,
): Toast {
  const seller = p.seller.toLowerCase(),
    runner = String(args.runner).toLowerCase(),
    out = args.imdOut ?? soldFor(p, s),
    tip = tokenAmount(BigInt(args.tip), s, true),
    hint = recordHint(p, s, time ?? s.timestamp, "your", false),
    next =
      time === undefined
        ? ""
        : ` Next plea after ${clock(time + Number(con(s, "CabalGate.COOLDOWN")))}.`;
  if (wallet?.toLowerCase() !== seller)
    return {
      kind: "sold",
      text: `Delivered plea #${p.id}: ${tokenAmount(p.amount, s)} sold for the writer; you earned the ${tip} tip.`,
      body: [
        "The writer (",
        { text: short(p.seller), mono: true },
        `) got ${tokenAmount(out, s, true)}.`,
      ],
      href: `#/p/${p.id}`,
      link: `Open plea #${p.id}`,
    };
  if (runner === seller)
    return {
      kind: "sold",
      text: `Sold ${tokenAmount(p.amount, s)} for ${tokenAmount(out, s, true)}.`,
      body: `You delivered it yourself, so the ${tip} tip came back to you.${hint ? ` ${hint}` : ""}${next}`,
    };
  return {
    kind: "sold",
    text: `Approved, ${p.score} vs need ${p.need}, and sold for you: ${tokenAmount(p.amount, s)} for ${tokenAmount(out, s, true)}.`,
    body: [
      "A runner (",
      { text: short(args.runner), mono: true },
      `) sold it within the ${span(Number(con(s, "CabalGate.EXECUTE_WINDOW")))} and earned the ${tip} tip.${hint ? ` ${hint}` : ""}${next}`,
    ],
  };
}
/** The objector's toast when its objection is ruled (objections.html:275-276). A sustained
 * objection takes the plea's points and settle pays the stake back to the objector; an overruled
 * one leaves the plea counting the lowest panel score (Seasons.record: lowest < score ? lowest :
 * score), times the seat multiplier for a seat holder, and settle pays the stake to the season's
 * prize pot (Tribunal.settle). */
export function ruledToast(
  o: { id: bigint; ruling: number; newScore: number },
  p: Plea | undefined,
  s: Snapshot,
): Toast {
  const sustained = o.ruling === 2,
    stake = tokenAmount(BigInt(con(s, "Tribunal.STAKE")), s, true),
    text = `Objection #${o.id} ${sustained ? "sustained" : "overruled"}, ${o.newScore} vs need ${p?.need ?? "?"}.`;
  if (!p) return { kind: "info", icon: "gavel", text };
  const counted = Math.min(p.score, Number(o.newScore), Number(p.standing?.[2] ?? 255)),
    mult = Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS")) / 10000,
    seat =
      p.seat && p.points !== undefined && p.points !== counted
        ? [
            `: ${p.points} points with `,
            p.name ? p.name : { text: short(p.seller), mono: true },
            `’s seat (${counted} × ${mult})`,
          ]
        : [];
  return {
    kind: "info",
    icon: "gavel",
    text,
    body: sustained
      ? `Plea #${p.id} gets no points. Your ${stake} stake comes back when anyone calls settle. The Tribunal thanks you for your service.`
      : [
          `Plea #${p.id} counts ${counted}`,
          ...seat,
          `. Your ${stake} stake goes to the season prize pot when anyone calls settle.`,
        ],
  };
}
/** Tribunal.expire's toast (ObjectionVoid, r2D-N10): expire voids only a stale objection
 * (Tribunal._stale: past filedAt + PENDING_EXPIRY, or its Intake request completed without an
 * answer), Tribunal.standing already ignores it so nothing changes for the plea, and Tribunal.settle
 * returns the stake to the objector (a void ruling pays the objector). `filedAt` and `at` (the
 * expire's time) tell the two apart; without them the toast names the time limit. */
export function objectionVoidToast(
  args: { id: bigint; pleaId: bigint },
  s: Snapshot,
  objector?: string,
  wallet?: string,
  filedAt?: number,
  at?: number,
): Toast {
  const mine =
      !!objector && !!wallet && objector.toLowerCase() === wallet.toLowerCase(),
    expiry = Number(con(s, "Tribunal.PENDING_EXPIRY")),
    early = filedAt !== undefined && at !== undefined && at <= filedAt + expiry;
  return {
    kind: "ok",
    text: `Objection #${args.id} is void: ${early ? "its panel gave no answer" : `no answer within ${span(expiry)}`}.`,
    body: `Nothing changes for plea #${args.pleaId}. Settle returns the ${tokenAmount(BigInt(con(s, "Tribunal.STAKE")), s, true)} stake to ${mine ? "you" : "the objector"}.`,
    href: `#/p/${args.pleaId}`,
    link: `Open plea #${args.pleaId}`,
  };
}
/** Writes whose revert means a trade did not happen: the swap (buy, or sell after the death), Sell
 * now and a Letterbox delivery. Every other write gets the neutral text (r2D-N7). */
export const TRADE_WRITES = ["swap", "executeSell", "deliver"];
export function revertedText(fn: string): ErrorMessage {
  return TRADE_WRITES.includes(fn)
    ? {
        title: "Mined but reverted.",
        body: "Nothing was traded; only the gas was spent. Try again.",
      }
    : {
        title: "Mined but reverted.",
        body: "Nothing changed; only the gas was spent.",
      };
}
/** How long after sending the site says it is still waiting for the receipt (RECEIPT_WAIT), and
 * when it stops waiting and lets the button go (RECEIPT_GIVE_UP), in ms since the send. */
export const RECEIPT_WAIT = 180000,
  RECEIPT_GIVE_UP = 900000;
/** What to do when a receipt wait ends without a receipt (a timeout, or an RPC error, which viem
 * does not retry), `elapsed` ms after the send: keep waiting, say once that it is still waiting, or
 * give up. Measured in time, not attempts, so a burst of RPC errors never ends the wait early. */
export function receiptWaitStep(
  elapsed: number,
  noted: boolean,
): "wait" | "note" | "give-up" {
  if (elapsed >= RECEIPT_GIVE_UP) return "give-up";
  return !noted && elapsed >= RECEIPT_WAIT ? "note" : "wait";
}
/** A sent transaction whose receipt has not come (r2D-N2): it was sent, so never "Nothing was
 * sent"; it may still confirm. `final` is the message once the site stops waiting. */
export function unconfirmedText(final: boolean): ErrorMessage {
  return final
    ? {
        title: "Sent, but no receipt yet.",
        body: `Sepolia has not confirmed this transaction in ${span(RECEIPT_GIVE_UP / 1000)}. It may have been dropped or may still go through: check View transaction before you send it again.`,
        sent: true,
      }
    : {
        title: "Sent. Waiting for the receipt.",
        body: `No receipt after ${span(RECEIPT_WAIT / 1000)}: Sepolia or its RPC is slow. The site keeps waiting; do not send it again.`,
        sent: true,
      };
}
/** A contract error decoded from a mined revert's replay. Some error texts are written for a
 * refusal before sending and end "Nothing was sent."; once a hash exists that is false, so the
 * sentence says what did happen (r2D-N2). */
export function afterSend(m: ErrorMessage): ErrorMessage {
  const fix = (t?: string) =>
    t?.replace(/Nothing was sent([.;]|$)/g, "It was mined but reverted: only the gas was spent$1");
  return { ...m, title: fix(m.title)!, body: fix(m.body) };
}
