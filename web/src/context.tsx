import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  decodeEventLog,
  type TransactionReceipt,
  type Address,
  type Hex,
} from "viem";
import type { Runtime } from "./config";
import { discover, resetHealth } from "./config";
import {
  readStatic,
  getPlea,
  read,
  blockTime,
  short,
  val,
  con,
  plural,
  readSnapshot,
  scanLogs,
  tokenAmount,
  clock,
  recordHint,
  type Snapshot,
} from "./chain";
import { explainReadError } from "./rpc-health";
import {
  explainError,
  decodeCustomError,
  DisplayError,
  type ErrorMessage,
  type ErrorMap,
} from "./errors";
import {
  afterSend,
  deliveredToast,
  objectionVoidToast,
  plainText,
  receiptWaitStep,
  ruledToast,
  revertedText,
  toastLinks,
  unconfirmedText,
  verdictToast,
  windowClosedToast,
  RECEIPT_GIVE_UP,
  RECEIPT_WAIT,
  type Toast,
  type ToastText,
} from "./toast-text";
import { LETTERBOX } from "./models";
export type { Toast } from "./toast-text";
type AppContext = {
  r: Runtime;
  s?: Snapshot;
  /** The contracts' constants and the token symbols, read once before the first snapshot. */
  statics?: Record<string, any>;
  error: string;
  refresh: () => Promise<boolean>;
  verified: boolean;
  now: number;
  toast?: (x: Toast) => void;
  /** Removes the receipt-wait note of transaction `hash`. */
  untoast?: (hash: string) => void;
  landVerdict: (id: string) => boolean;
  receipts: { key: string; hash: string; text: string }[];
  snapshot: () => Snapshot | undefined;
  saveReceipt: (receipt: { key: string; hash: string; text: string }) => void;
};
const C = createContext<AppContext>(null!);
export function DataProvider({
  r,
  children,
}: {
  r: Runtime;
  children: ReactNode;
}) {
  const [s, setS] = useState<Snapshot>();
  const [receipts, setReceipts] = useState<
    { key: string; hash: string; text: string }[]
  >([]);
  const saveReceipt = useCallback(
    (receipt: { key: string; hash: string; text: string }) =>
      setReceipts((old) => [
        ...old.filter((x) => x.key !== receipt.key),
        receipt,
      ]),
    [],
  );
  useEffect(() => {
    const clear = () => setReceipts([]);
    window.addEventListener("hashchange", clear);
    return () => window.removeEventListener("hashchange", clear);
  }, []);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [statics, setStatics] = useState<Record<string, any>>();
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [toasts, setToasts] = useState<(Toast & { id: number })[]>([]);
  const toastId = useRef(0);
  const pushToast = useCallback(
    (t: Toast) =>
      setToasts((old) => {
        if (
          t.hash &&
          old.some(
            (x) => x.hash === t.hash && plainText(x.text) === plainText(t.text),
          )
        )
          return old;
        // A transaction's next word replaces its receipt-wait note.
        const kept = t.hash
          ? old.filter((x) => !(x.wait && x.hash === t.hash))
          : old;
        return [...kept.slice(-2), { ...t, id: ++toastId.current }];
      }),
    [],
  );
  const untoast = useCallback(
    (hash: string) =>
      setToasts((old) => old.filter((x) => !(x.wait && x.hash === hash))),
    [],
  );
  const { address } = useAccount();
  const wallet = useRef(address);
  wallet.current = address;
  const refreshWaiters = useRef<((ok: boolean) => void)[]>([]);
  const queued = useRef(false),
    failures = useRef(0),
    lastSnapshot = useRef(0),
    observedHead = useRef<bigint | undefined>(undefined);
  const previous = useRef<Snapshot | undefined>(undefined);
  const constants = useRef<Record<string, any> | undefined>(undefined);
  const busy = useRef(false);
  const clockBase = useRef<{ chain: number; local: number } | undefined>(
    undefined,
  );
  const liveVerdicts = useRef(new Set<string>());
  const watchedWindows = useRef(new Set<string>()),
    notifiedWindows = useRef(new Set<string>());
  useEffect(() => {
    if (!s || !address) return;
    for (const p of s.pleas) {
      if (p.seller.toLowerCase() !== address.toLowerCase()) continue;
      const end =
          Number(p.verdictAt) + Number(s.constants["CabalGate.EXECUTE_WINDOW"]),
        id = String(p.id);
      if (p.status === 2 && now <= end) watchedWindows.current.add(id);
      if (
        [2, 5].includes(p.status) &&
        now > end &&
        watchedWindows.current.has(id) &&
        !notifiedWindows.current.has(id)
      ) {
        notifiedWindows.current.add(id);
        pushToast(windowClosedToast(p, s, now));
      }
    }
  }, [now, s, address, pushToast]);
  const landed = useRef(new Set<string>());
  const landVerdict = useCallback((id: string) => {
    if (!liveVerdicts.current.has(id) || landed.current.has(id)) return false;
    landed.current.add(id);
    return true;
  }, []);
  const refresh = useCallback(async () => {
    if (busy.current) {
      queued.current = true;
      return new Promise<boolean>((resolve) =>
        refreshWaiters.current.push(resolve),
      );
    }
    busy.current = true;
    try {
      if (!constants.current) {
        await discover(r);
        // diedAt rides along for the loading band only: Home's lead and title differ once the
        // Cabal is dead, and the constants alone cannot tell (r2X-11). It stays out of the
        // snapshot's constants; when it fails, the band keeps its skeleton lead.
        const [c, diedAt] = await Promise.all([
          readStatic(r),
          read(r, "CabalGate", "diedAt").catch(() => undefined),
        ]);
        constants.current = c;
        setStatics(
          diedAt === undefined ? c : { ...c, "CabalGate.diedAt": diedAt },
        );
        setVerified(true);
      }
      const next = await readSnapshot(r, constants.current, previous.current);
      if (previous.current) {
        for (const p of next.pleas) {
          const old = previous.current.pleas.find((x) => x.id === p.id);
          if (old?.verdictAt === 0n && p.verdictAt > 0n)
            liveVerdicts.current.add(String(p.id));
        }
        for (const event of next.logs.slice(previous.current.logs.length))
          if (event.eventName === "Verdict")
            liveVerdicts.current.add(String(event.args.id));
      }
      if (previous.current && wallet.current) {
        const fresh = next.logs.slice(previous.current.logs.length),
          me = wallet.current.toLowerCase();
        for (const event of fresh)
          // A toast's own reads never fail the snapshot (r2D-N2).
          try {
            const eventId = ["Verdict", "Delivered"].includes(event.eventName)
              ? event.args.id
              : undefined;
            const p = eventId
              ? next.pleas.find((p) => p.id === eventId) ||
                (await getPlea(r, eventId, next.logs))
              : undefined;
            if (
              event.eventName === "Verdict" &&
              !fresh.some(
                (l) =>
                  l.eventName === "Delivered" && l.args.id === event.args.id,
              ) &&
              p?.seller.toLowerCase() === me
            )
              pushToast(verdictToast(p, next, !!event.args.approved));
            if (event.eventName === "Ruled") {
              const o = next.pleas
                .flatMap((p) => p.objections || [])
                .find((o) => o.id === event.args.id);
              if (o?.objector?.toLowerCase() === me)
                pushToast(
                  ruledToast(
                    o,
                    next.pleas.find((p) => p.id === o.pleaId),
                    next,
                  ),
                );
            }
            // Only the writer hears a runner's sale here; the runner has the receipt's toast.
            if (event.eventName === "Delivered" && p?.seller.toLowerCase() === me)
              pushToast({
                ...deliveredToast(
                  p,
                  next,
                  event.args,
                  await blockTime(r, event.blockNumber).catch(() => undefined),
                  wallet.current,
                ),
                hash: event.transactionHash,
              });
          } catch {}
      }
      clockBase.current = { chain: next.timestamp, local: Date.now() };
      setNow(next.timestamp);
      lastSnapshot.current = Date.now();
      observedHead.current = next.head;
      failures.current = 0;
      previous.current = next;
      setS(next);
      setError("");
      return true;
    } catch (e) {
      failures.current++;
      if (!previous.current || failures.current >= 2)
        setError(explainReadError(e));
      return false;
    } finally {
      busy.current = false;
      if (queued.current) {
        queued.current = false;
        const waiting = refreshWaiters.current.splice(0);
        void refresh().then((ok) => waiting.forEach((resolve) => resolve(ok)));
      }
    }
  }, [r]);
  useEffect(() => {
    refresh();
    let stopped = false,
      timerPoll: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (stopped) return;
      if (!document.hidden && !busy.current) {
        try {
          const block = await r.client.getBlock();
          const scan =
            observedHead.current === undefined
              ? undefined
              : await scanLogs(r, observedHead.current + 1n, block.number);
          if (scan?.error) throw scan.error;
          // Blocks a lagging node has not reached yet are looked at again next time.
          observedHead.current = scan?.lagged ? scan.covered : block.number;
          if (
            !previous.current ||
            failures.current ||
            previous.current.historyError ||
            scan?.logs.length ||
            Date.now() - lastSnapshot.current >= 60000
          )
            await refresh();
        } catch (e) {
          failures.current++;
          if (failures.current >= 2) setError(explainReadError(e));
        }
      }
      if (!stopped)
        timerPoll = setTimeout(
          poll,
          failures.current
            ? Math.min(60000, 15000 * 2 ** (failures.current - 1))
            : 12000,
        );
    };
    timerPoll = setTimeout(poll, 12000);
    const recover = () => {
      if (!document.hidden) {
        resetHealth();
        void refresh();
      }
    };
    window.addEventListener("online", recover);
    document.addEventListener("visibilitychange", recover);
    const timer = setInterval(
      () =>
        setNow(
          clockBase.current
            ? clockBase.current.chain +
                Math.floor((Date.now() - clockBase.current.local) / 1000)
            : Math.floor(Date.now() / 1000),
        ),
      1000,
    );
    return () => {
      window.removeEventListener("online", recover);
      document.removeEventListener("visibilitychange", recover);
      stopped = true;
      clearTimeout(timerPoll);
      clearInterval(timer);
    };
  }, [refresh]);
  return (
    <C.Provider
      value={{
        r,
        s,
        statics,
        error,
        refresh,
        verified,
        now,
        toast: pushToast,
        untoast,
        landVerdict,
        receipts,
        snapshot: () => previous.current,
        saveReceipt,
      }}
    >
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.kind === "info"
                ? "toast"
                : `toast toast--${toast.kind || "ok"}`
            }
            role={toast.role || (toast.kind === "bad" ? "alert" : "status")}
          >
            <svg className="icon" aria-hidden="true">
              <use
                href={`#i-${toast.icon || { bad: "warning-circle", pending: "hourglass", sold: "coins", info: "info", ok: "check-circle" }[toast.kind || "ok"]}`}
              />
            </svg>
            <div>
              <p className="toast__title">{rich(toast.text)}</p>
              {(toast.body || toastLinks(toast, r.network.explorer).length > 0) && (
                <p>
                  {rich(toast.body)}
                  {toastLinks(toast, r.network.explorer).map((l, i) => (
                    <Fragment key={l.href}>
                      {toast.body || i > 0 ? " " : ""}
                      <a
                        className="nowrap"
                        href={l.href}
                        target={l.external ? "_blank" : undefined}
                        rel={l.external ? "noreferrer" : undefined}
                      >
                        {l.text}
                      </a>
                    </Fragment>
                  ))}
                </p>
              )}
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Dismiss"
              onClick={() =>
                setToasts((old) => old.filter((t) => t.id !== toast.id))
              }
            >
              <svg className="icon" aria-hidden="true">
                <use href="#i-x" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </C.Provider>
  );
}
/** A toast line with its marks: kept parts on one line, addresses and commands in mono. */
function rich(t?: ToastText) {
  return typeof t === "string" || t === undefined
    ? t
    : t.map((part, i) =>
        typeof part === "string" ? (
          part
        ) : part.strong ? (
          <b key={i} className={part.mono ? "mono nowrap" : "nowrap"}>
            {part.text}
          </b>
        ) : (
          <span key={i} className={part.mono ? "mono nowrap" : "nowrap"}>
            {part.text}
          </span>
        ),
      );
}
export const useApp = () => useContext(C);
export function useRead<T = any>(
  fn: () => Promise<T>,
  deps: any[],
  enabled = true,
) {
  const { s } = useApp();
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(deps, (_, v) =>
      typeof v === "bigint" ? v.toString() : v,
    ),
    oldKey = useRef("");
  const saved = useRef<T | undefined>(undefined),
    failed = useRef(0);
  useEffect(() => {
    let active = true;
    if (oldKey.current !== key || !enabled) {
      oldKey.current = key;
      saved.current = undefined;
      setData(undefined);
      setError("");
      failed.current = 0;
    }
    if (enabled) {
      setLoading(saved.current === undefined);
      fn()
        .then((d) => {
          if (active) {
            saved.current = d;
            setData(d);
            setError("");
            failed.current = 0;
          }
        })
        .catch((e) => {
          if (active && (++failed.current >= 2 || saved.current === undefined))
            setError(explainReadError(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else setLoading(false);
    return () => {
      active = false;
    };
  }, [...deps, enabled, s]);
  return { data, error, loading };
}
export function useTx(resetKey?: string) {
  const { r, s, verified, refresh, toast, untoast, saveReceipt, snapshot } =
    useApp();
  const { address, chainId, connector } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorMessage>();
  const [hash, setHash] = useState<Hex>();
  const [done, setDone] = useState(false);
  const lock = useRef(false);
  const activeKey = `${address || ""}:${chainId || ""}:${resetKey || ""}`;
  const lastKey = useRef(activeKey);
  const reset = () => {
    if (lock.current) return;
    setDone(false);
    setHash(undefined);
    setError(undefined);
  };
  useEffect(() => {
    if (!busy && lastKey.current !== activeKey) {
      lastKey.current = activeKey;
      reset();
    }
  }, [activeKey, busy]);

  const send = async (
    name: string,
    fn: string,
    args: any[] = [],
    raw?: { to: Address; data: Hex; value?: bigint },
    options?: {
      prepare?: () => Promise<{
        to: Address;
        data: Hex;
        value?: bigint;
      } | void>;
      toast?: (receipt: TransactionReceipt) => Toast;
      errors?: ErrorMap;
    },
  ) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setDone(false);
    setError(undefined);
    setHash(undefined);
    let sentHash: Hex | undefined;
    try {
      if (!connector || !address)
        throw Error("Connect in the top bar to send this transaction.");
      if (!verified || chainId !== r.chain.id)
        throw Error("Switch to Sepolia in the top bar before sending.");
      const provider = await connector.getProvider();
      const wallet = createWalletClient({
        account: address,
        chain: r.chain,
        transport: custom(provider as any),
      });
      const prepared = await options?.prepare?.();
      const req = prepared ||
        raw || {
          to: r.addresses[name],
          data: encodeFunctionData({
            abi: r.abis[name],
            functionName: fn,
            args,
          }),
          value: 0n,
        };
      await r.client.call({ ...req, account: address });
      const estimate = await r.client.estimateGas({ ...req, account: address });
      const h = await wallet.sendTransaction({
        ...req,
        account: address,
        chain: r.chain,
        gas: (estimate * 130n + 99n) / 100n,
      });
      sentHash = h;
      setHash(h);
      // From here the transaction is sent: no text may say nothing was sent (r2D-N2). A slow
      // receipt is said once and waited for again, so the button stays busy instead of offering a
      // second send.
      let receipt: TransactionReceipt | undefined,
        noted = false;
      const sentAt = Date.now();
      while (!receipt)
        try {
          receipt = await r.client.waitForTransactionReceipt({
            hash: h,
            confirmations: 1,
            timeout: Math.max(
              1000,
              (noted ? RECEIPT_GIVE_UP : RECEIPT_WAIT) - (Date.now() - sentAt),
            ),
          });
        } catch (e) {
          const step = receiptWaitStep(Date.now() - sentAt, noted);
          if (step === "give-up") throw new DisplayError(unconfirmedText(true));
          if (step === "note") {
            noted = true;
            const note = unconfirmedText(false);
            toast?.({
              kind: "pending",
              text: note.title,
              body: note.body,
              hash: h,
              wait: true,
            });
          }
          // An RPC error ends viem's wait at once: try again shortly.
          if ((e as any)?.name !== "WaitForTransactionReceiptTimeoutError")
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      // The receipt came: the "waiting for the receipt" note is no longer true. A toast that
      // follows replaces it anyway; an approval has none (FIXUP).
      if (noted) untoast?.(h);
      if (receipt.status !== "success") {
        // The replay names the contract's reason when it can; otherwise the neutral text for
        // this kind of write (r2D-N7).
        let reason: ErrorMessage | undefined;
        try {
          await r.client.call({
            ...req,
            account: address,
            blockNumber: receipt.blockNumber,
          });
        } catch (e) {
          if (decodeCustomError(e, Object.values(r.abis)))
            reason = afterSend(
              explainError(e, Object.values(r.abis), options?.errors),
            );
        }
        throw new DisplayError(reason || revertedText(fn));
      }
      await refresh();
      setDone(true);
      if (fn !== "approve") {
        // The toast's own reads (the plea, a block time, Seasons) may fail: the transaction is
        // still confirmed, so a plain confirmed toast stands in (r2D-N2).
        const built = await receiptToast(
          r,
          snapshot?.() || s!,
          receipt,
          fn,
          address,
        ).catch((): Toast => ({ text: "Transaction confirmed." }));
        let own: Toast | undefined;
        try {
          own = options?.toast?.(receipt);
        } catch {}
        const message = { ...built, ...own, hash: h };
        toast?.(message);
        saveReceipt({
          key: resetKey || name + ":" + fn,
          hash: h,
          text: plainText(message.text)!,
        });
      }
      return h;
    } catch (e) {
      const text =
        sentHash && !(e instanceof DisplayError)
          ? {
              title: "Sent, but the site lost track of it.",
              body: "Check View transaction before you send it again.",
              sent: true,
            }
          : explainError(e, Object.values(r.abis), options?.errors);
      setError(text);
      toast?.({
        text: text.title,
        body: text.body,
        kind: "bad",
        hash: sentHash,
      });
      return undefined;
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return {
    send,
    reset,
    busy,
    error,
    hash,
    done,
    ready:
      !!address && !!connector && !!s && chainId === r.chain.id && verified,
  };
}

export function receiptEvents(r: Runtime, receipt: TransactionReceipt) {
  return receipt.logs.flatMap((log) => {
    for (const abi of Object.values(r.abis))
      try {
        return [
          {
            ...decodeEventLog({ abi, data: log.data, topics: log.topics }),
            transactionHash: receipt.transactionHash,
          },
        ];
      } catch {}
    return [];
  }) as any[];
}
async function receiptToast(
  r: Runtime,
  s: Snapshot,
  receipt: TransactionReceipt,
  fn: string,
  wallet?: string,
): Promise<Toast> {
  const events = receiptEvents(r, receipt),
    find = (n: string) => events.find((e) => e.eventName === n)?.args;
  const p = find("PleaSubmitted"),
    object = find("Objected"),
    sale = find("SellExecuted"),
    delivered = find("Delivered"),
    recorded = find("Recorded"),
    claim = find("Claimed"),
    closed = find("SeasonClosedOut");
  if (fn === "seed")
    return { kind: "ok", text: "Trading is open. Make your opening buy now." };
  const escrow = find("Escrowed");
  if (p && escrow && Number(escrow.flags) & 1) {
    // The imdTEST the letter bought with its PLEA: Letterbox.feesFor (the tip, an appeal's wall
    // share and, unless minted, the oracle fee); Escrowed.feePlea is the PLEA it spent (r2D-N9).
    const appeal = !!p.originalId,
      fee =
        (appeal ? s.v.appealFees : s.v.fees)?.[0] ??
        BigInt(con(s, "CabalGate.ORACLE_FEE")) +
          (appeal ? BigInt(con(s, "CabalGate.APPEAL_POOL_SHARE")) : 0n) +
          LETTERBOX.TIP;
    return {
      kind: "pending",
      text: `Letter received as ${appeal ? `appeal #${p.id} of plea #${p.originalId}` : `plea #${p.id}`}. The Cabal is reading your mail.`,
      body: `${tokenAmount(BigInt(fee), s, true)} in fees, about ${tokenAmount(escrow.feePlea, s, false, 0, "up")}, paid from your ${s.constants.symbol}. Usually 3 to 6 minutes.`,
      href: `#/p/${p.id}`,
      link: `Open plea #${p.id}`,
    };
  }
  if (p)
    return {
      kind: "pending",
      text: p.originalId
        ? `Appeal #${p.id} of plea #${p.originalId} sent. The Cabal is deliberating.`
        : `Plea #${p.id} sent. The Cabal is deliberating.`,
      body: "Usually 3 to 6 minutes.",
      href: `#/p/${p.id}`,
      link: `Open plea #${p.id}`,
    };
  if (object)
    return {
      kind: "pending",
      text: `Objection #${object.id} filed. A new panel is reading plea #${object.pleaId}.`,
      body: `Usually 3 to 6 minutes. Your ${tokenAmount(BigInt(con(s, "Tribunal.STAKE")), s, true)} stake waits in the Tribunal and moves when anyone calls settle after the ruling.`,
      href: `#/p/${object.pleaId}`,
      link: `Open plea #${object.pleaId}`,
    };
  if (delivered)
    return deliveredToast(
      // The snapshot's plea has what the toast needs; reading it again can fail (r2D-N2).
      s.pleas.find((x) => x.id === delivered.id) ??
        (await getPlea(r, delivered.id, s.logs)),
      s,
      delivered,
      await blockTime(r, receipt.blockNumber).catch(() => undefined),
      wallet,
    );
  const voided = find("ObjectionVoid");
  if (voided) {
    const o =
      s.pleas
        .flatMap((p) => p.objections || [])
        .find((o) => o.id === voided.id) ??
      (await read(r, "Tribunal", "objection", [voided.id]));
    return objectionVoidToast(
      voided,
      s,
      o?.objector,
      wallet,
      o?.filedAt === undefined ? undefined : Number(o.filedAt),
      await blockTime(r, receipt.blockNumber).catch(() => undefined),
    );
  }
  if (sale) {
    // The title is the receipt's own SellExecuted; the body needs reads, and a failing one leaves
    // out only what it would have told (r2D-N2). The next plea is the sale's block time + COOLDOWN.
    const time = await blockTime(r, receipt.blockNumber).catch(() => undefined),
      p =
        s.pleas.find((x) => x.id === sale.id) ??
        (await getPlea(r, sale.id, s.logs).catch(() => undefined)),
      body = [
        p ? recordHint(p, s, time ?? s.timestamp, "your", false) : "",
        time === undefined
          ? ""
          : `Next plea at ${clock(time + Number(con(s, "CabalGate.COOLDOWN")))}.`,
      ]
        .filter(Boolean)
        .join(" ");
    return {
      kind: "sold",
      text: `Sold ${tokenAmount(sale.amountIn, s)} for ${tokenAmount(sale.imdOut, s, true)}.`,
      body: body || undefined,
    };
  }
  if (closed) {
    const prizes = events.filter((e) => e.eventName === "PrizePaid"),
      bonuses = events.filter((e) => e.eventName === "BonusPaid"),
      burned = find("BonusBurned")?.amount || 0n;
    return {
      text: `Season ${Number(closed.season) + 1} closed.`,
      body: `${plural(prizes.length, "wallet")} paid ${tokenAmount(closed.paid, s, true)} + ${tokenAmount(
        bonuses.reduce((n, e) => n + BigInt(e.args.amount), 0n),
        s,
      )}. ${tokenAmount(BigInt(closed.pot) - BigInt(closed.paid), s, true)} ${val(s, "CabalGate.diedAt") && BigInt(closed.season) === BigInt(s.v.displayedSeason) ? "is left for the buy wall" : `rolls over to season ${Number(closed.season) + 2}`}; ${tokenAmount(burned, s)} burned.`,
    };
  }
  if (recorded) {
    const points =
      events.find(
        (e) =>
          e.eventName === "SeatMultiplier" && e.args.pleaId === recorded.pleaId,
      )?.args.pleaPoints ?? recorded.score;
    // The season line needs Seasons reads; without them the toast keeps the receipt's points.
    const season = await Promise.all([
      read(r, "Seasons", "bestOf", [recorded.season, recorded.wallet]),
      read(r, "Seasons", "topOf", [recorded.season]),
    ])
      .then(([bestOf, top]) => {
        const best = bestOf
            .filter(Number)
            .sort((a: number, b: number) => b - a),
          rank = top.findIndex(
            (e: any) =>
              e.wallet.toLowerCase() === recorded.wallet.toLowerCase(),
          );
        return `Season ${Number(recorded.season) + 1}: ${best.reduce((a: number, b: number) => a + b, 0)} points (${best.join(" + ")})${rank >= 0 ? `, rank ${rank + 1}` : ""}.`;
      })
      .catch(() => undefined);
    return { text: `+${points} points recorded.`, body: season };
  }
  if (claim) {
    const vault = claim.account.toLowerCase() !== wallet?.toLowerCase();
    return {
      text: [
        `Claimed ${tokenAmount(claim.amount, s)} for ${vault ? "the vault " : ""}`,
        { text: short(claim.account), mono: true },
        ".",
      ],
      body: vault
        ? "The PLEA is on the vault; this wallet paid only the gas."
        : `Claim #${claim.index} is done. Selling it will take a plea.`,
      receiptLabel: "View the receipt",
    };
  }
  const nameSet = find("NameSet");
  if (nameSet)
    return {
      text: nameSet.name
        ? `Name saved: ${nameSet.name}.`
        : "Display name cleared.",
    };
  if (fn === "setName") return { text: "Display name saved." };
  if (fn === "flushToWall") return { text: "Leftovers sent to the buy wall." };
  if (fn === "settle")
    return { text: "Escrow or stake settled. Check the updated balance." };
  return { text: "Transaction confirmed." };
}

