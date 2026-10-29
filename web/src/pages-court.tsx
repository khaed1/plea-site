import { site, soFar } from "./site";
import { useSaleQuote } from "./sale";
import { Share } from "./share";
import { LETTERBOX, Q96, deliverOut, factTerms } from "./models";
import { appealPreview } from "./appeal";
import { PleaTimeline } from "./details";
import { oracleRequest, type OracleData } from "./oracle";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { formatUnits, getAddress, isAddress, type Address } from "viem";
import { rich, useApp, useRead, useTx } from "./context";
import {
  amount,
  caseState,
  caseClosedText,
  noVerdict,
  blockTime,
  feeInPlea,
  feeInPleaText,
  words,
  clock,
  span,
  seasonState,
  potOf,
  soldFor,
  objectionLine,
  stakeNote,
  missingTxText,
  con,
  courtCounts,
  duration,
  elapsed,
  getPlea,
  judgeLine,
  nameOf,
  objectionCase,
  objectionStale,
  pleaLead,
  pleaState,
  read,
  recordFrom,
  pointsHeld,
  latestAppealOf,
  recordHint,
  rulingWait,
  idList,
  sharePercent,
  short,
  tokenAmount,
  utc,
  val,
  verdictSeason,
  plural,
  type Plea,
  missingPleaTitle,
} from "./chain";
import {
  Action,
  AddressView,
  Stamp,
  FactCells,
  AmountInput,
  ApprovedAction,
  Costs,
  Countdown,
  Empty,
  Icon,
  Meter,
  Notice,
  Panel,
  PleaCard,
  TextBox,
  Title,
  TxButton,
  textCheck,
} from "./components";
import { parseAmount, WalletBalances, poolQuote } from "./pages-trade";
export function Wall() {
  const { r, s, now } = useApp(),
    { address } = useAccount(),
    [family, setFamily] = useState("All"),
    [flags, setFlags] = useState<string[]>([]),
    [sort, setSort] = useState("Newest"),
    [older, setOlder] = useState<Plea[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const previousLogs = useRef(0);
  useEffect(() => {
    if (!s) return;
    const diff = s.logs.slice(previousLogs.current);
    previousLogs.current = s.logs.length;
    const ids = new Set(
      diff.flatMap((l) => {
        const oid = ["Ruled", "ObjectionVoid"].includes(l.eventName)
          ? s.v.objections?.find((o: any) => o.id === l.args.id)?.pleaId
          : undefined;
        return [
          l.args.pleaId,
          oid,
          ...([
            "Verdict",
            "PleaFailed",
            "PleaExpired",
            "PleaLapsed",
            "SellExecuted",
            "Delivered",
          ].includes(l.eventName)
            ? [l.args.id]
            : []),
        ]
          .filter(Boolean)
          .map(String);
      }),
    );
    const affected = older.filter((p) => ids.has(String(p.id)));
    if (affected.length)
      void Promise.all(affected.map((p) => getPlea(r, p.id, s.logs)))
        .then((fresh) =>
          setOlder((old) =>
            old.map((p) => fresh.find((x) => x.id === p.id) || p),
          ),
        )
        .catch(() => setError("Older pleas could not refresh. Try again."));
  }, [s]);
  const wallet = new URLSearchParams(location.hash.split("?")[1]).get("wallet"),
    all = [...(s?.pleas || []), ...older].filter(
      (p, i, a) => a.findIndex((x) => x.id === p.id) === i,
    ),
    oldest = all.reduce((v, p) => (p.id < v ? p.id : v), all[0]?.id || 1n);
  const walletName = useRead(
    () => read(r, "Letterbox", "nameOf", [wallet]),
    [wallet],
    !!wallet && /^0x[\da-f]{40}$/i.test(wallet),
  );
  const group = (p: Plea) =>
    [2, 4, 5].includes(p.status)
      ? "Approved"
      : p.status === 3
        ? "Denied"
        : pleaState(p, now, s!) === "PENDING"
          ? "Pending"
          : "No verdict";
  const shown = all
    .filter(
      (p) =>
        (family === "All" || group(p) === family) &&
        (!wallet || p.seller.toLowerCase() === wallet.toLowerCase()) &&
        flags.every((f) =>
          f === "Sold"
            ? p.status === 4
            : f === "Appeals"
              ? p.isAppeal
              : f === "By letter"
                ? !!(p.flags & 1)
                : !!p.objections?.length,
        ),
    )
    .sort((a, b) =>
      sort === "Newest"
        ? Number(b.id - a.id)
        : (b.verdictAt ? b.score : -1) - (a.verdictAt ? a.score : -1) ||
          Number(b.id - a.id),
    );
  const total = Number(val(s, "CabalGate.nextId") || 1n) - 1,
    court = courtCounts(s, now),
    approved = court?.approved || 0,
    denied = court?.denied || 0;
  const counts: Record<string, number | string> = {
    All: total,
    Approved: court?.approved ?? "—",
    Denied: court?.denied ?? "—",
    Pending: court?.pending ?? "—",
    "No verdict": court?.noVerdict ?? "—",
  };
  async function loadMore() {
    if (busy || oldest <= 1n) return;
    setBusy(true);
    try {
      const more = await Promise.all(
        Array.from({ length: Math.min(12, Number(oldest - 1n)) }, (_, i) =>
          getPlea(r, oldest - 1n - BigInt(i), s?.logs),
        ),
      );
      setOlder((o) => [...o, ...more]);
      setError("");
    } catch {
      setError("Older pleas could not be read. Try again.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (
      s &&
      !shown.length &&
      oldest > 1n &&
      !busy &&
      !error &&
      (family !== "All" || flags.length || wallet)
    )
      void loadMore();
  }, [family, flags.join(), wallet, oldest, shown.length, busy]);
  // The "nothing yet" copy only when it is true: no filter but the one, and nothing of that kind
  // on chain (no objection filed at all, or no denial among the verdicts); any other empty
  // combination is "No matching pleas" (r2S-N3).
  const empty =
    !wallet &&
    family === "All" &&
    flags.length === 1 &&
    flags[0] === "Objected" &&
    BigInt(val(s, "Tribunal.nextId") ?? 1n) <= 1n
      ? "objections"
      : !wallet && family === "Denied" && !flags.length && court?.denied === 0
        ? "denied"
        : "";
  const reset = () => {
    setFamily("All");
    setFlags([]);
    setSort("Newest");
    if (wallet) location.hash = "#/wall";
  };
  return (
    <>
      <Title title="The Wall">
        Every plea and its verdict, newest first; times are when each plea was
        sent. Open a card for its facts and the judges’ note.
      </Title>
      <div className="wall-tools">
        <div className="chips" role="group" aria-label="Show pleas by verdict">
          {Object.keys(counts).map((f) => (
            <button
              className="chip"
              key={f}
              aria-pressed={family === f}
              onClick={() => setFamily(f)}
            >
              {f}
              {!s?.historyError && (
                <span className="chip__count">{counts[f]}</span>
              )}
            </button>
          ))}
        </div>
        <details className="wall-tools__more">
          <summary className="chip">
            More filters{flags.length ? ` · ${flags.length} on` : ""}{" "}
            <Icon name="caret-down" />
          </summary>
          <div className="panel wall-tools__panel">
            <div>
              <p className="label">Show only</p>
              <div className="chips" role="group" aria-label="Show only">
                {["Sold", "Appeals", "By letter", "Objected"].map((f) => (
                  <button
                    key={f}
                    className="chip"
                    aria-pressed={flags.includes(f)}
                    onClick={() =>
                      setFlags((a) =>
                        a.includes(f) ? a.filter((x) => x !== f) : [...a, f],
                      )
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Sort</p>
              <div className="chips" role="group" aria-label="Sort pleas">
                {["Newest", "Highest score"].map((f) => (
                  <button
                    className="chip"
                    key={f}
                    aria-pressed={sort === f}
                    onClick={() => setSort(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>
        <p className="meta" aria-live="polite">
          {shown.length
            ? `Showing #${shown[0].id} to #${shown.at(-1)!.id}: ${shown.length} of ${counts[family]} ${family === "All" ? "pleas" : family.toLowerCase() + " plea" + (counts[family] === 1 ? "" : "s")}, ${sort.toLowerCase()} first`
            : "No matching pleas"}
          {wallet
            ? ` · Showing pleas by ${walletName.data || short(isAddress(wallet, { strict: false }) ? getAddress(wallet.toLowerCase()) : wallet)}`
            : ""}
          {flags.length
            ? ` · ${flags.map((f) => (f === "By letter" ? "pleas sent by letter" : f === "Appeals" ? "appeals" : f.toLowerCase() + " pleas")).join(", ")}`
            : ""}
          {approved + denied && !s?.historyError
            ? ` · ${((approved * 100) / (approved + denied)).toFixed(1)}% of judged pleas approved`
            : ""}
        </p>
      </div>
      {shown.length ? (
        <div className="wall-grid">
          {shown.map((p) => (
            <PleaCard key={String(p.id)} p={p} />
          ))}
        </div>
      ) : busy ? (
        <p className="loading-label">
          <Icon name="hourglass" />
          Reading older pleas…
        </p>
      ) : (
        <Empty
          icon={empty === "objections" ? "gavel" : "scales"}
          title={
            empty === "objections"
              ? "No objections yet"
              : empty === "denied"
                ? "No denied pleas yet"
                : total
                  ? "No matching pleas"
                  : "No pleas yet"
          }
          action={
            total ? { onClick: reset, label: "Show all pleas" } : undefined
          }
        >
          {empty === "objections"
            ? "Every approval so far went unchallenged. Suspicious."
            : empty === "denied"
              ? "The Cabal is in a good mood. It will not last."
              : !val(s, "PleaHook.seeded")
                ? "The first plea comes after trading opens."
                : total
                  ? "No plea on the Wall matches these filters."
                  : "Every verdict lands here, newest first."}
        </Empty>
      )}
      {error && (
        <p className="bad-text" role="alert">
          {error}
        </p>
      )}
      {oldest > 1n ? (
        <div className="wall-more">
          <button
            className="btn"
            aria-busy={busy}
            aria-disabled={busy}
            onClick={() => !busy && loadMore()}
          >
            {busy
              ? `Reading #${oldest - 1n} to #${oldest > 12n ? oldest - 12n : 1n}…`
              : "Load older pleas"}
          </button>
          <p className="small">
            {busy
              ? `The ${shown.length} cards above stay put.`
              : `Next: #${oldest - 1n} to #${oldest > 12n ? oldest - 12n : 1n}`}
          </p>
        </div>
      ) : (
        total > 0 && (
          <div className="wall-more">
            <p className="strong">That is every plea, back to #1.</p>
            {/* "Yours" only to a connected wallet; after the death no plea follows (N5). */}
            {!val(s, "CabalGate.diedAt") && (
              <p className="meta">
                {address ? "Yours would be" : "The next plea will be"} #
                {total + 1}.
              </p>
            )}
            {val(s, "PleaHook.seeded") && !val(s, "CabalGate.diedAt") && (
              <a className="btn btn--sm" href="#/plead">
                Write a plea <Icon name="arrow-right" />
              </a>
            )}
          </div>
        )
      )}
    </>
  );
}
export function Appeal({ p }: { p: Plea }) {
  const { r, s, now } = useApp();
  const { address } = useAccount();
  const balances = WalletBalances();
  const [text, setText] = useState("");
  // undefined: the default, ticked unless this wallet cannot pass the auto-sell rules (TRAP2).
  const [choice, setAuto] = useState<boolean>();
  const [input, setInput] = useState(
    formatUnits(p.amount, s?.constants.decimals || 18),
  );
  const raw = parseAmount(input, s?.constants.decimals || 18);
  // The auto-sell appeal's amount is fixed by the contract, so it does not depend on the input.
  const autoPreview = useRead(
    () => appealPreview(r, s!, p, address!, true, p.amount),
    [address, p.id.toString()],
    !!address && !!s,
  );
  const autoBlock = autoPreview.data?.autoBlock || "",
    auto = choice ?? !autoBlock;
  const tx = useTx(`${p.id}:${auto}:${input}:${text}`);
  const manualPreview = useRead(
    () => appealPreview(r, s!, p, address!, false, raw),
    [address, raw.toString(), p.id.toString()],
    !!address && !!s && !auto,
  );
  const preview = auto ? autoPreview : manualPreview;
  const need = preview.data?.need;
  const openReason = balances.data?.open
    ? `Plea #${balances.data.pending} is open: one plea at a time.`
    : "";
  const fee =
    (con(s, "CabalGate.ORACLE_FEE") || 0n) +
    (con(s, "CabalGate.APPEAL_POOL_SHARE") || 0n);
  // Why the auto-sell box cannot work here, and what the manual appeal needs instead (TRAP2,
  // r2D-VN1): never point a wallet without imdTEST at paying from its imdTEST.
  const auto0 = autoPreview.data,
    pairHeld = balances.data?.pair,
    manualInstead =
      pairHeld !== undefined && BigInt(pairHeld) < BigInt(fee)
        ? `The manual appeal needs ${tokenAmount(fee, s, true)} for the oracle fee and the buy-wall share; you hold ${tokenAmount(pairHeld, s, true)}.`
        : `Untick auto-sell to pay the ${tokenAmount(fee, s, true)} from your ${s?.constants.pairSymbol}.`,
    autoWhy =
      autoBlock === "value"
        ? `an appeal must be worth at least ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} at the hourly price; this one, ${tokenAmount(auto0?.amount, s)}, is worth ${tokenAmount(auto0?.value, s, true)}.`
        : autoBlock === "fee"
          ? `its fees (at most ${tokenAmount(auto0?.fee, s, false, 0, "up")}) may take at most 10% of your PLEA, and the appeal and its fees must fit your ${tokenAmount(auto0?.balance, s)}.`
          : "";
  const end = Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN"));
  const closed =
    now > Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")) ||
    p.appealed ||
    p.isAppeal ||
    !val(s, "CabalGate.cabalAlive");
  return (
    <Panel card title="One appeal">
      <Countdown
        until={Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN"))}
        label={`Appeal until ${clock(end)}`}
        ariaLabel={`Appeal until ${clock(end)}, ${words(end - now)} left`}
      />
      {auto ? (
        <>
          <p className="label">Appeal amount</p>
          <p className="stat__value">{tokenAmount(preview.data?.amount, s)}</p>
          {!!preview.data?.returned && (
            <p>
              Your open escrow of {tokenAmount(preview.data.returned, s)} comes
              back first.
            </p>
          )}
        </>
      ) : (
        <AmountInput
          id={`appeal-${p.id}`}
          label="Appeal amount"
          value={input}
          onChange={setInput}
          unit="PLEA"
        />
      )}
      {need !== undefined && (
        <Meter need={need} fact={Number(preview.data?.fact)} own />
      )}
      <TextBox label="Your appeal" value={text} onChange={setText} />
      <label className="toggle-card">
        <input
          type="checkbox"
          className="box"
          checked={auto}
          onChange={(e) => setAuto(e.target.checked)}
          aria-labelledby="appeal-auto-title"
          aria-describedby={
            autoWhy && !auto
              ? "appeal-auto-desc appeal-auto-why"
              : "appeal-auto-desc"
          }
        />
        <span className="toggle-card__title" id="appeal-auto-title">
          Sell automatically if approved
        </span>
        <span className="small" id="appeal-auto-desc">
          The fees are paid in PLEA. Anyone may sell within{" "}
          {span(Number(con(s, "CabalGate.EXECUTE_WINDOW")))} and earn the{" "}
          {tokenAmount(LETTERBOX.TIP, s, true)} tip. A delivered site sale pays{" "}
          {tokenAmount(LETTERBOX.AUTO_SELL_FEE, s, true)} to the prize pot.
        </span>
      </label>
      {autoWhy && !auto && (
        <p className="small" id="appeal-auto-why">
          Auto-sell is off for this wallet: {autoWhy}
        </p>
      )}
      <Costs
        rows={
          auto
            ? [
                [
                  "Oracle fee",
                  tokenAmount(con(s, "CabalGate.ORACLE_FEE"), s, true),
                ],
                [
                  "To the buy wall",
                  tokenAmount(con(s, "CabalGate.APPEAL_POOL_SHARE"), s, true),
                ],
                [
                  "Tip for whoever sells it",
                  tokenAmount(LETTERBOX.TIP, s, true),
                ],
                [
                  `Paid in PLEA, ${tokenAmount(s?.v.appealFees?.[0], s, true)}`,
                  s?.v.appealFees
                    ? `about ${tokenAmount(feeInPlea(s!, s!.v.appealFees[0]), s, false, 0, "up")}`
                    : "after trading opens",
                ],
                [
                  "At most",
                  tokenAmount(s?.v.appealFees?.[1], s, false, 0, "up"),
                ],
                [
                  "Auto-sell fee, to the season prize pot",
                  tokenAmount(LETTERBOX.AUTO_SELL_FEE, s, true),
                ],
              ]
            : [
                [
                  `Oracle fee, from your ${s?.constants.pairSymbol}`,
                  tokenAmount(con(s, "CabalGate.ORACLE_FEE"), s, true),
                ],
                [
                  `To the buy wall, from your ${s?.constants.pairSymbol}`,
                  tokenAmount(con(s, "CabalGate.APPEAL_POOL_SHARE"), s, true),
                ],
                ["You pay", tokenAmount(fee, s, true, 2, "up")],
                ["Extra fee", "none"],
              ]
        }
      />
      {/* plea.html:301. An open escrow is named above, only when there is one. */}
      <p className="small text-2">
        {auto
          ? "Press Sell yourself and you keep the tip. If nobody sells it, or on any other ending, your PLEA and the tip come back; the oracle fee and the buy-wall share are spent."
          : `Off: you pay in ${s?.constants.pairSymbol} and, if approved, sell yourself within ${span(Number(con(s, "CabalGate.EXECUTE_WINDOW")))}.`}
      </p>
      {auto ? (
        <Action
          connectText="Connect in the top bar to appeal."
          {...tx}
          label="Appeal"
          lockedReason={closed ? "This appeal window is closed." : undefined}
          sub={
            auto
              ? `${tokenAmount(s?.v.appealFees?.[0], s, true)} in PLEA`
              : tokenAmount(fee, s, true)
          }
          onRun={() => tx.send("Letterbox", "appealAuto", [p.id, text])}
          disabled={
            !tx.ready ||
            !!openReason ||
            closed ||
            !!preview.data?.reason ||
            !textCheck("plea", text).ok ||
            need === undefined ||
            need > Number(con(s, "CabalGate.MAX_PLEA_SCORE"))
          }
          reason={
            openReason ||
            preview.error ||
            (autoBlock && preview.data?.autoBlock
              ? `Auto-sell: ${autoWhy} ${manualInstead}`
              : preview.data?.reason) ||
            (!text
              ? `Appeal stays off until your text passes the checks; nothing is paid before that. Send it before ${clock(end)}.`
              : !textCheck("plea", text).ok
                ? "Fix the text above to appeal. Nothing is paid until it passes."
                : need === undefined
                  ? "Reading your fact score and need…"
                  : "") ||
            (closed
              ? "This appeal window is closed."
              : need && need > Number(con(s, "CabalGate.MAX_PLEA_SCORE"))
                ? "This plea cannot pass. Try a smaller amount or wait for your facts to improve."
                : undefined)
          }
        />
      ) : (
        <ApprovedAction
          connectText="Connect in the top bar to appeal."
          name="CabalGate"
          fn="appeal"
          args={[p.id, raw, text]}
          label="Appeal"
          lockedReason={closed ? "This appeal window is closed." : undefined}
          sub={
            auto
              ? `${tokenAmount(s?.v.appealFees?.[0], s, true)} in PLEA`
              : tokenAmount(fee, s, true)
          }
          token={r.addresses.PairToken}
          spender={r.addresses.CabalGate}
          spend={fee}
          spendFor="for the oracle fee and the buy-wall share"
          disabled={
            closed ||
            !!openReason ||
            !preview.data ||
            raw < (preview.data?.minimum || 0n) ||
            raw > (preview.data?.maximum || p.amount) ||
            raw <= 0n ||
            raw > p.amount ||
            !textCheck("plea", text).ok ||
            need === undefined ||
            need > Number(con(s, "CabalGate.MAX_PLEA_SCORE"))
          }
          reason={
            openReason ||
            (closed
              ? "This appeal window is closed."
              : raw > p.amount
                ? "An appeal cannot increase the original amount."
                : undefined)
          }
          textReason={
            !text
              ? `Appeal stays off until your text passes the checks; nothing is paid before that. Send it before ${clock(end)}.`
              : !textCheck("plea", text).ok
                ? "Fix the text above to appeal. Nothing is paid until it passes."
                : need === undefined
                  ? "Reading your fact score and need…"
                  : undefined
          }
        />
      )}
      <p className="small">
        Or send APPEAL &lt;text&gt; to the Letterbox from Etherscan:{" "}
        {tokenAmount(
          BigInt(con(s, "CabalGate.ORACLE_FEE")) +
            BigInt(con(s, "CabalGate.APPEAL_POOL_SHARE")) +
            LETTERBOX.TIP,
          s,
          true,
        )}{" "}
        paid in PLEA, about{" "}
        {tokenAmount(
          feeInPlea(
            s!,
            BigInt(con(s, "CabalGate.ORACLE_FEE")) +
              BigInt(con(s, "CabalGate.APPEAL_POOL_SHARE")) +
              LETTERBOX.TIP,
          ),
          s,
          false,
          0,
          "up",
        )}{" "}
        (oracle fee + buy-wall share + tip, back if you send SELL yourself).{" "}
        <a href="#/letters">How letters work</a>
      </p>
      {p.escrow?.[1] && (
        <p className="small">
          Not appealing? Call Return escrow and tip above to get your PLEA back;
          a new plea waits for the cooldown, until{" "}
          {clock(Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")))}.
        </p>
      )}
      <p className="small">
        Name the earlier verdict if it helps. Demands for a score count as
        manipulation.
      </p>
    </Panel>
  );
}
export function PleaPage({ id }: { id: string }) {
  const { r, s, now } = useApp();
  const { address } = useAccount();
  const number = /^\d+$/.test(id) ? BigInt(id) : 0n;
  const loaded =
    s?.pleas.find((p) => p.id === number) ||
    s?.court.open.find((p) => p.id === number) ||
    (s?.court.latestVerdict?.id === number ? s.court.latestVerdict : undefined);
  const query = useRead(
    () => getPlea(r, number, s?.logs),
    [id],
    !!s && number > 0n && number < val(s, "CabalGate.nextId") && !loaded,
  );
  const p = loaded || query.data;
  const recordSeason =
    p && s
      ? verdictSeason(
          p.verdictAt,
          BigInt(val(s, "CabalGate.startedAt")),
          BigInt(con(s, "Seasons.SEASON")),
        )
      : undefined;
  const knownClosed =
    recordSeason === undefined
      ? undefined
      : s?.v.seasons[String(recordSeason)]?.closed;
  const recordSeasonQuery = useRead(
    () => read(r, "Seasons", "closed", [recordSeason]),
    [recordSeason?.toString()],
    !!p &&
      [2, 4, 5].includes(p.status) &&
      !p.recorded &&
      recordSeason !== undefined &&
      knownClosed === undefined,
  );
  const seasonClosed = knownClosed ?? recordSeasonQuery.data;
  const saleQuote = useSaleQuote(p);

  const mine = p?.seller.toLowerCase() === address?.toLowerCase();
  const tx = useTx(id);
  const pointTx = useTx(id);
  const oracle = useRead(
    () => oracleRequest(r, p!, s?.logs || []),
    [p?.id.toString(), p?.status],
    !!p,
  );
  if (!s)
    return (
      <div className="stack">
        <Title title={`Plea #${id}`} />
        <p>Reading the plea from {site().chain}…</p>
      </div>
    );
  if (!p)
    return (
      <div className="stack">
        <nav className="meta" aria-label="Breadcrumb">
          <a href="#/wall">Wall</a> /{" "}
          <a href={`#/p/${id}`} aria-current="page">
            Plea #{id}
          </a>
        </nav>
        <Title title={`Plea #${id}`} />
        {query.loading ? (
          <p>Reading the case…</p>
        ) : (
          <Empty
            icon="scales"
            title={missingPleaTitle(id, s)}
            action={{ href: "#/wall", label: "See the Wall" }}
            actions={
              val(s, "CabalGate.cabalAlive") && val(s, "PleaHook.seeded")
                ? [{ href: "#/plead", label: "Plead to sell" }]
                : []
            }
          >
            {query.error ||
              (val(s, "PleaHook.seeded")
                ? `Check the plea number in this link. ${Number(val(s, "CabalGate.nextId")) - 1} pleas so far.`
                : "The first plea comes after trading opens.")}
          </Empty>
        )}
      </div>
    );
  const state = pleaState(p, now, s);
  const approved = [2, 4, 5].includes(p.status);
  const sellUntil =
    Number(p.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW"));
  const objectionUntil =
    Number(p.verdictAt) + Number(con(s, "Tribunal.OBJECTION_WINDOW"));
  const net = saleQuote.data || 0n;
  const minOut = (net * 99n) / 100n;
  const canSell = p.status === 2 && now <= sellUntil;
  const auto = (p.flags & 2) > 0;
  const missedSeason =
    approved &&
    !p.recorded &&
    !p.excluded &&
    !p.standing?.[1] &&
    seasonClosed === true;
  const closedMessage = `Season ${String((recordSeason ?? 0n) + 1n)} is closed; these points were not recorded.`;
  const held =
    !missedSeason && !p.excluded && !p.standing?.[1] && pointsHeld(p, s, now);
  const settled = p.escrow && !p.escrow[1];
  const recordAt = recordFrom(p, s, now),
    cs = caseState(p, s, now),
    // This wallet's objection that still counts (not void, not stale), as ObjectionForm's `same`.
    ownObjection = p.objections?.find(
      (o) =>
        o.objector.toLowerCase() === address?.toLowerCase() &&
        o.ruling !== 4 &&
        !objectionStale(o, p, s, now),
    );
  const appealId = latestAppealOf(s, p.id);
  return (
    <div className="stack stack--lg">
      <nav aria-label="Breadcrumb" className="meta">
        <a href="#/wall">Wall</a> /{" "}
        <a href={`#/p/${id}`} aria-current="page">
          Plea #{id}
        </a>
      </nav>
      <div className="page-title">
        <h1>Plea #{id}</h1>
        {mine && <span className="badge badge--you">YOU</span>}
      </div>
      <p className="lead">
        {rich(pleaLead(p, s, { state, canSell, mine: !!mine, missedSeason }))}{" "}
        {held
          ? recordAt?.nextBlock
            ? `The +${p.points} points are free from ${clock(recordAt.until)}; record them once the next block is mined.`
            : recordAt?.objection
            ? `The +${p.points} points are held until ${rulingWait(recordAt.objections)}; record them after ${clock(recordAt.until)}.`
            : `The +${p.points} points are held while objections are open; record them after ${clock(recordAt?.until ?? objectionUntil)}.`
          : p.recorded
            ? `+${p.points} points recorded.`
            : ""}
      </p>
      <div className="split split--even status">
        <div className="stack status__plea">
          <PleaCard p={p} detail missedSeason={missedSeason} />
          <PleaTimeline
            p={p}
            missedSeason={missedSeason ? recordSeason : undefined}
          />
          <Panel level={2} title="The judges">
            <Costs
              rows={[
                ["Amount", tokenAmount(p.amount, s)],
                ["Submitted", utc(p.submittedAt)],
                [
                  "Verdict",
                  pleaState(p, now, s) === "NO VERDICT"
                    ? `No verdict: ${noVerdict(p, s, now).sub}`
                    : p.verdictAt > 0n
                      ? utc(p.verdictAt)
                      : "Waiting",
                ],
                ["Oracle request", short(p.intakeId)],
              ]}
            />
            <p className="small">
              {oracle.loading
                ? "Reading the oracle request…"
                : oracle.error
                  ? "Oracle request details are unavailable. The on-chain verdict above remains the source of truth."
                  : "Oracle request loaded from api.imd.fun."}
            </p>
            {oracle.data && (
              <div className="stack stack--sm">
                <p className="plea__judge">
                  Judged by{" "}
                  {oracle.data.panelSize ?? con(s, "CabalGate.PANEL_SIZE")}
                  {oracle.data.agreed === undefined
                    ? ""
                    : ` · ${oracle.data.agreed} agreed`}{" "}
                  · {elapsed(Number(p.verdictAt) - Number(p.submittedAt))}
                  {oracle.data.comment
                    ? ` · A judge said: “${oracle.data.comment}”`
                    : ""}
                </p>
                <a
                  className="link-btn"
                  href={`${site().oracleApi}/oracle/requests/${encodeURIComponent(oracle.data.id)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View oracle request
                </a>
              </div>
            )}
            <a className="btn" href={`#/share/${p.id}`}>
              <Icon name="share-network" />
              Share this plea
            </a>
          </Panel>
        </div>
        <div className="stack stack--lg status__side">
          <Panel
            level={2}
            card
            className="status__sell"
            title={mine ? "Your sale" : "Sale status"}
          >
            {state === "PENDING" ? (
              <>
                <Countdown
                  until={
                    Number(p.submittedAt) +
                    Number(con(s, "CabalGate.PENDING_EXPIRY"))
                  }
                  label="Waiting for the Cabal"
                  block
                  wait
                  total={Number(con(s, "CabalGate.PENDING_EXPIRY"))}
                />
                <p>
                  Usually 3 to 6 minutes. The request expires at{" "}
                  {utc(
                    Number(p.submittedAt) +
                      Number(con(s, "CabalGate.PENDING_EXPIRY")),
                  )}
                  .
                  <Meter fact={p.factScore} need={p.need} verdict="PENDING" />
                </p>
              </>
            ) : canSell ? (
              <>
                {p.isAppeal && <AppealHistory p={p} />}
                <Countdown
                  until={sellUntil}
                  label="Sell within"
                  urgent={!!mine}
                  block={!!mine}
                  total={Number(con(s, "CabalGate.EXECUTE_WINDOW"))}
                />
                <p className="small">
                  The window closes at {clock(sellUntil, true)}. Miss it and the
                  plea lapses
                  {!p.standing?.[1] && !p.excluded
                    ? " (the points still count)"
                    : ""}
                  .
                </p>
                {auto ? (
                  <>
                    <p>
                      PLEA is escrowed in the Letterbox. Anyone can deliver; the
                      sale goes to the writer. The runner earns the tip.
                    </p>
                    <Action
                      connectText="Connect in the top bar to deliver the sale."
                      {...tx}
                      label={mine ? "Sell yourself" : "Deliver approved sale"}
                      variant={mine ? "ink" : undefined}
                      primary={false}
                      block
                      sub={quoteSub(saleQuote, (n) =>
                        tokenAmount(deliverOut(n, p.flags), s, true),
                      )}
                      reason={saleQuote.error || undefined}
                      onRun={() =>
                        tx.send("Letterbox", "deliver", [p!.id], undefined, {
                          errors: {
                            SlippageExceeded: `The pool price is more than 5% under the hourly snapshot, so the Letterbox’s minimum can’t be met. Nothing was sold; try again before ${clock(sellUntil, true)}.`,
                          },
                        })
                      }
                      disabled={!tx.ready}
                    />
                  </>
                ) : mine ? (
                  <>
                    <Costs
                      rows={[
                        ["Sells", tokenAmount(p.amount, s)],
                        // A failed or zero quote says so, as the button does ("no quote"): a
                        // thinned pool's 0 never reads as still loading (sweep nit).
                        [
                          "You get about",
                          saleQuote.data
                            ? tokenAmount(net, s, true)
                            : saleQuote.error || saleQuote.data === 0n
                              ? "No quote"
                              : "Reading the pool…",
                        ],
                        [
                          "At least, with 1% slippage",
                          saleQuote.data
                            ? tokenAmount(minOut, s, true)
                            : saleQuote.error || saleQuote.data === 0n
                              ? "No quote"
                              : "Reading the pool…",
                        ],
                      ]}
                    />
                    <ApprovedAction
                      connectText="Connect in the top bar to sell."
                      name="CabalGate"
                      fn="executeSell"
                      args={[minOut]}
                      label="Sell now"
                      token={r.addresses.PLEA}
                      spender={r.addresses.CabalGate}
                      spend={p.amount}
                      variant="ink"
                      sub={quoteSub(saleQuote, (n) => tokenAmount(n, s, true))}
                      disabled={minOut <= 0n}
                      reason={saleQuote.error}
                      prepare={async () => {
                        const simulation = await r.client.simulateContract({
                          address: r.addresses.CabalGate,
                          abi: r.abis.CabalGate,
                          functionName: "executeSell",
                          args: [0n],
                          account: address!,
                        });
                        return [((simulation.result as bigint) * 99n) / 100n];
                      }}
                      errors={{
                        SlippageExceeded: `The price moved more than 1%. Nothing was sold; your PLEA stays in your wallet. The window is open until ${clock(sellUntil, true)}: try again.`,
                        WindowLapsed: `The window closed at ${clock(sellUntil, true)}. Plea #${p.id} lapsed: nothing was sold. ${p.standing?.[1] || p.excluded ? "" : `Your +${p.points} points still count. `}Next plea at ${clock(Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")))}.`,
                      }}
                    />
                  </>
                ) : (
                  <p>Only the seller can sell plea #{String(p.id)}.</p>
                )}
              </>
            ) : (
              <SaleSummary
                p={p}
                state={state}
                appealId={appealId}
                missedSeason={missedSeason}
                judged={oracle.data}
              />
            )}
            {p.status === 1 && state === "NO VERDICT" && !auto && (
              <TxButton
                connectText="Connect in the top bar to expire it."
                label="Expire unanswered plea"
                name="CabalGate"
                fn="expire"
                args={[p.id]}
              />
            )}{" "}
            {auto &&
              p.escrow?.[1] &&
              !canSell &&
              (p.status !== 1 || state === "NO VERDICT") && (
                <TxButton
                  connectText="Connect in the top bar to return the escrow."
                  label="Return escrow and tip"
                  name="Letterbox"
                  fn="settle"
                  args={[p.id]}
                />
              )}
          </Panel>
          {approved && (
            <Panel level={2} title={mine ? "Your points" : "Points"}>
              <p className="stat__value">
                {p.standing?.[1] || p.excluded
                  ? "No points"
                  : missedSeason
                    ? "Not recorded"
                    : `+${p.points} points ${p.recorded ? "recorded" : held ? "held" : seasonClosed === undefined ? "· checking season" : "once recorded"}`}
              </p>
              {missedSeason && <p>{closedMessage}</p>}
              {p.seat && (
                <p className="small">
                  Seat multiplier ×
                  {Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS")) / 10000},
                  rounded down. The judges’ score and need stay the same.
                </p>
              )}
              {held && recordAt && !recordAt.nextBlock && (
                <Countdown
                  until={recordAt.until}
                  label={
                    recordAt.objection
                      ? `${recordAt.objections.length > 1 ? `Objections ${idList(recordAt.objections)}` : `Objection #${recordAt.objection.id}`} ruled or void within`
                      : "Objections close in"
                  }
                />
              )}
              <Action
                connectText="Connect in the top bar to record points."
                {...pointTx}
                lockedReason={
                  p.excluded
                    ? "This seller is excluded from season points and prizes."
                    : p.recorded
                      ? `+${p.points} points recorded.`
                      : p.standing?.[1]
                        ? "An objection was sustained. This plea earns no points."
                        : missedSeason
                          ? "Recording is closed for this season."
                          : held
                            ? recordHint(p, s, now, mine ? "your" : "the")
                            : undefined
                }
                label={mine ? "Record my points" : "Record the points"}
                primary={false}
                onRun={() => pointTx.send("Seasons", "record", [p!.id])}
                disabled={
                  !pointTx.ready ||
                  held ||
                  p.recorded ||
                  p.standing?.[1] ||
                  p.excluded ||
                  seasonClosed !== false
                }
                reason={
                  p.excluded
                    ? "This seller is excluded from season points and prizes."
                    : p.recorded
                      ? `+${p.points} points recorded.`
                      : p.standing?.[1]
                        ? "An objection was sustained. This plea earns no points."
                        : missedSeason
                          ? "Recording is closed for this season."
                          : seasonClosed === undefined
                            ? recordSeasonQuery.error ||
                              "Reading this plea’s season status…"
                            : held
                              ? recordHint(p, s, now, mine ? "your" : "the")
                              : "Anyone may record these points. Nothing records them by itself."
                }
              />
            </Panel>
          )}
          {state === "DENIED" &&
            !p.isAppeal &&
            !p.appealed &&
            now <= Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN")) &&
            val(s, "CabalGate.cabalAlive") &&
            mine && <Appeal p={p} />}
          {approved && (
            <Panel level={2} title="Objections">
              {cs.closed ? (
                <div className="cluster">
                  <span className="pill">{caseClosedText(cs.closed)}</span>
                  {/* A closed case counts every objection filed, the void and unanswered ones it
                      lists too; the slots (N of 2) matter only while it is open (N7). */}
                  <span className="pill">{filedText(p)}</span>
                </div>
              ) : (
                <>
                  <div className="cluster">
                    <Countdown
                      until={objectionUntil}
                      label="Objections close in"
                    />
                    <span className="pill">
                      {cs.filed} of {cs.max} filed
                    </span>
                  </div>
                  {cs.full ? (
                    <Notice kind="warn" title="This case is full.">
                      <p>
                        {cs.pending.length === cs.max
                          ? `Two objections are pending on plea #${p.id}. Nothing to send.`
                          : `Objection #${cs.pending[0]?.id} is pending and the other slot has a ruling. Nothing to send.`}
                      </p>
                    </Notice>
                  ) : mine ? (
                    <p className="small">
                      <b>You can’t object to your own plea.</b> Others may until{" "}
                      {clock(objectionUntil)}, for a{" "}
                      {tokenAmount(con(s, "Tribunal.ORACLE_FEE"), s, true)} fee
                      + {tokenAmount(con(s, "Tribunal.STAKE"), s, true)} stake.
                      A new panel of {String(con(s, "Tribunal.PANEL_SIZE"))}{" "}
                      re-scores it: sustained only at{" "}
                      {p.need - Number(con(s, "Tribunal.MARGIN")) - 1} or less
                      (more than {String(con(s, "Tribunal.MARGIN"))} below your
                      need of {p.need}), and then no points. Void if that panel
                      splits or gives no answer within{" "}
                      {span(Number(con(s, "Tribunal.PENDING_EXPIRY")))}: nothing
                      changes. The sale is never touched.
                    </p>
                  ) : ownObjection ? (
                    // One objection per wallet: Object is offered only to a wallet that has none
                    // standing on this plea (as the Objections page's form says, N6).
                    <p className="small">
                      <b>You already objected to this plea.</b> Objection #
                      {String(ownObjection.id)}{" "}
                      {ownObjection.ruling === 1
                        ? "is pending: a new panel is re-scoring it."
                        : "was ruled."}
                    </p>
                  ) : address ? (
                    <>
                      <a
                        className="btn btn--primary btn--block"
                        href={`#/objections?plea=${p.id}`}
                      >
                        Object{" "}
                        <span className="btn__sub">
                          {tokenAmount(
                            BigInt(con(s, "Tribunal.ORACLE_FEE")) +
                              BigInt(con(s, "Tribunal.STAKE")),
                            s,
                            true,
                          )}
                        </span>
                      </a>
                      <p className="small text-2">
                        {tokenAmount(con(s, "Tribunal.ORACLE_FEE"), s, true)}{" "}
                        oracle fee +{" "}
                        {tokenAmount(con(s, "Tribunal.STAKE"), s, true)} stake.
                        A new panel of {String(con(s, "Tribunal.PANEL_SIZE"))}{" "}
                        re-scores it; the sale is never touched.
                      </p>
                    </>
                  ) : (
                    <>
                      <Notice title="Connect in the top bar to object.">
                        <p>
                          The plea, its verdict and its timeline read without a
                          wallet.
                          {/* An auto-sell plea is sold by anyone, for the seller, as the lead says (F5). */}
                          {canSell
                            ? auto
                              ? " Anyone can sell it for the seller."
                              : " Only the seller can sell it."
                            : ""}
                        </p>
                      </Notice>
                      <button
                        type="button"
                        className="btn btn--primary btn--block"
                        aria-disabled="true"
                        aria-describedby="object-connect"
                      >
                        Object{" "}
                        <span className="btn__sub">
                          {tokenAmount(
                            BigInt(con(s, "Tribunal.ORACLE_FEE")) +
                              BigInt(con(s, "Tribunal.STAKE")),
                            s,
                            true,
                          )}
                        </span>
                      </button>
                      <p className="small" id="object-connect">
                        Connect a wallet first. Objections close at{" "}
                        {clock(objectionUntil)}.
                      </p>
                    </>
                  )}
                </>
              )}
              <ObjectionLines p={p} />
              {cs.stale.map((o: any) => (
                <TxButton
                  key={String(o.id)}
                  connectText="Connect in the top bar to expire it."
                  name="Tribunal"
                  fn="expire"
                  args={[o.id]}
                  // Each button names its objection on screen: two stale ones gave two
                  // identical buttons below both lines.
                  label={`Expire objection #${o.id}`}
                  small
                />
              ))}
              <a className="btn" href={`#/objections?plea=${p.id}`}>
                How objections work <Icon name="arrow-right" />
              </a>
            </Panel>
          )}
        </div>
      </div>
      <section className="section">
        <div className="split split--even split--stretch">
          <div>
            <Share id={String(p.id)} embedded />
          </div>
          <Panel level={2} title="Details">
            <dl className="addr-list">
              <div>
                <dt>Seller</dt>
                <dd>
                  {p.name && <p>{p.name}</p>}
                  <AddressView address={p.seller} label="seller" />
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>
                  {tokenAmount(p.amount, s)}{" "}
                  {p.balance
                    ? `(${sharePercent(p.amount, p.balance)} of ${tokenAmount(p.balance, s)})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Value</dt>
                <dd>
                  {tokenAmount(
                    (p.amount * BigInt(val(s, "PleaHook.latestPrice") || 0n)) /
                      Q96,
                    s,
                    true,
                  )}{" "}
                  at 1M PLEA ={" "}
                  {tokenAmount(
                    (BigInt(val(s, "PleaHook.latestPrice") || 0n) *
                      10n ** 24n) /
                      Q96,
                    s,
                    true,
                  )}
                </dd>
              </div>
              <div>
                <dt>Fact score</dt>
                <dd>
                  {p.factScore}
                  {p.facts?.total === p.factScore
                    ? ` (${factTerms(p.facts).join(" + ")})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Need</dt>
                <dd>
                  {p.need} ({String(con(s, "CabalGate.PASS_MARK"))} −{" "}
                  {p.factScore})
                </dd>
              </div>
              <div>
                <dt>Panel</dt>
                <dd>
                  {String(con(s, "CabalGate.PANEL_SIZE"))} seats, quorum{" "}
                  {String(con(s, "CabalGate.QUORUM"))}
                  {oracle.data
                    ? oracle.data.agreed === undefined
                      ? ""
                      : `: ${oracle.data.agreed} of ${oracle.data.panelSize ?? con(s, "CabalGate.PANEL_SIZE")} agreed, in ${elapsed(Number(p.verdictAt) - Number(p.submittedAt))}`
                    : ""}
                </dd>
              </div>
              {[
                ["Plea transaction", p.submittedLog, p.submittedAt],
                ["Verdict transaction", p.verdictLog, p.verdictAt],
              ].map(([label, log, time]: any) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {log ? (
                      <a
                        href={`${r.network.explorer}/tx/${log.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {clock(time)} · View transaction
                      </a>
                    ) : (
                      missingTxText(time, s.historyError)
                    )}
                  </dd>
                </div>
              ))}
              <div>
                <dt>Contract</dt>
                <dd>
                  <AddressView
                    address={r.addresses.CabalGate}
                    label="CabalGate"
                  />
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </section>
    </div>
  );
}
import { resetHealth } from "./config";
export function ObjectionForm({ p }: { p: Plea }) {
  const { r, s, now } = useApp(),
    { address } = useAccount(),
    [text, setText] = useState("");
  const info = useRead(
      async () => {
        const [c, excluded, sellerExcluded] = await Promise.all([
          read(r, "Tribunal", "caseOf", [p.id]),
          address ? read(r, "Seasons", "excluded", [address]) : false,
          read(r, "Seasons", "excluded", [p.seller]),
        ]);
        return { c, excluded, sellerExcluded };
      },
      [p.id, address],
      !!s,
    ),
    c = info.data?.c,
    pending = c?.pending.filter((n: bigint) => n !== 0n).length || 0,
    cs = caseState(p, s!, now),
    count = cs.filed,
    full = cs.full,
    own = address?.toLowerCase() === p.seller.toLowerCase(),
    until = Number(p.verdictAt) + Number(con(s, "Tribunal.OBJECTION_WINDOW")),
    // A plea that was never approved never had an objection window (F3): no "closed at".
    approved = [2, 4, 5].includes(p.status),
    closed = !approved
      ? "this plea is not approved"
      : cs.closed ||
        (!val(s, "CabalGate.cabalAlive") ? "the Cabal is dead" : undefined),
    closedText = (closed: string) =>
      approved
        ? caseClosedText(closed)
        : `No objections: plea #${p.id} ${p.status === 1 ? "has no verdict yet" : p.status === 3 ? "was denied" : "got no verdict"}.`;
  const cost =
      BigInt(con(s, "Tribunal.ORACLE_FEE")) + BigInt(con(s, "Tribunal.STAKE")),
    // A void or stale objection does not count against its objector: object() voids a stale one first.
    same = p.objections?.some(
      (o) =>
        o.objector.toLowerCase() === address?.toLowerCase() &&
        o.ruling !== 4 &&
        !objectionStale(o, p, s!, now),
    ),
    name = useNames((p.objections || []).map((o) => o.objector)),
    reason = closed
      ? closedText(closed!)
      : own
        ? "You can’t object to your own plea."
        : full
          ? `This case is full. A plea takes at most ${con(s, "Tribunal.MAX_OBJECTIONS")} objections, from different wallets.`
          : same
            ? "You already objected to this plea."
            : info.data?.excluded || info.data?.sellerExcluded
              ? "This wallet or seller is excluded from seasons."
              : undefined,
    textReason = !textCheck("objection", text).ok
      ? text
        ? "The Tribunal refuses it: BadObjectionText. Fix the text above to object; nothing is paid until it passes."
        : "Write your objection to send it; nothing is paid until it passes."
      : undefined;
  return (
    <article className="card plea stack">
      <div className="plea__head">
        <h3>Plea #{String(p.id)}</h3>
        <span className="meta">
          by{" "}
          <span className={!p.name ? "mono" : ""}>
            {p.name || short(p.seller)}
          </span>
        </span>
      </div>
      <Stamp p={p} />
      <p className="plea__text">“{p.text}”</p>
      <p className="small">
        Judges {p.score} · Need {p.need} ={" "}
        {String(con(s, "CabalGate.PASS_MARK"))} − fact {p.factScore} ·{" "}
        {p.status === 4
          ? `Sold ${tokenAmount(p.amount, s)} for ${tokenAmount(soldFor(p, s!), s, true)}`
          : `Sells ${tokenAmount(p.amount, s)}`}
      </p>
      {!closed ? (
        <div>
          <Countdown until={until} label="Objections close in" />
        </div>
      ) : (
        approved && <p>{closedText(closed!)}</p>
      )}
      {approved && (
        <div>
          <span className="pill">
            {closed
              ? filedText(p)
              : `${count} of ${con(s, "Tribunal.MAX_OBJECTIONS")} filed${count === cs.max - 1 ? " · one slot left" : ""}`}
          </span>
        </div>
      )}
      {p.objections
        ?.filter((o) => o.ruling === 1)
        .map((o) => {
          const stale = objectionStale(o, p, s!, now);
          return (
            <div
              className="panel panel--sunken stack stack--sm"
              key={String(o.id)}
            >
              <p className="cluster cluster--sm small">
                <span className="stamp stamp--sm stamp--objection">
                  Objection #{String(o.id)}
                </span>
                <span>
                  {stale
                    ? `no answer within ${span(Number(con(s, "Tribunal.PENDING_EXPIRY")))}`
                    : "pending"}
                </span>
                <span className="text-2">
                  by <Who address={o.objector} name={name(o.objector)} /> ·{" "}
                  {stale
                    ? "void once anyone expires it; nothing changes"
                    : "a new panel is re-scoring the plea"}
                </span>
              </p>
              <p>“{o.text}”</p>
            </div>
          );
        })}
      {approved && (
        <p>
          {p.standing?.[1] || p.excluded
            ? "No points"
            : `+${p.points || 0} points${pointsHeld(p, s!, now) ? " held" : ""}`}
        </p>
      )}
      {closed ? (
        <Notice title={closedText(closed)}>
          <p>
            {p.excluded
              ? "This seller is excluded from season points."
              : p.standing?.[1]
                ? "No points for this plea."
                : p.recorded
                  ? `+${p.points} points recorded.`
                  : cs.pending.length
                    ? "The points may be recorded once no panel is pending."
                    : ![2, 4, 5].includes(p.status)
                      ? "Only an approved plea can take an objection."
                      : `+${p.points} points to record: anyone can press Record on plea #${p.id}; nothing records them by itself.`}
          </p>
        </Notice>
      ) : own ? (
        <Notice title="You can’t object to your own plea.">
          <p>Anyone else may ask a second panel. The sale stands.</p>
        </Notice>
      ) : full ? (
        <>
          <Notice icon="prohibit" title="This case is full.">
            <p>
              A plea takes at most {String(con(s, "Tribunal.MAX_OBJECTIONS"))}{" "}
              objections, from different wallets.
            </p>
          </Notice>
          <button
            type="button"
            className="btn btn--primary btn--block"
            aria-disabled="true"
            aria-describedby={`full-why-${p.id}`}
          >
            Object <span className="btn__sub">{tokenAmount(cost, s, true)}</span>
          </button>
          <p className="small" id={`full-why-${p.id}`}>
            {cs.pending.length === cs.max
              ? `Two objections are pending on plea #${p.id}. Nothing to send.`
              : `Objection #${cs.pending[0]?.id} is pending and the other slot has a ruling. Nothing to send.`}
          </p>
        </>
      ) : (
        <>
          <h4>Object to plea #{String(p.id)}</h4>
          <TextBox
            kind="objection"
            label="Your objection"
            value={text}
            onChange={setText}
          />
          <p className="field__hint">
            Say why the score is too high. On plea #{String(p.id)} the objection
            is sustained if the new score is{" "}
            {p.need - Number(con(s, "Tribunal.MARGIN")) - 1} or less, more than{" "}
            {String(con(s, "Tribunal.MARGIN"))} below the need {p.need}.{" "}
            <a href="#/objections">How a ruling works</a>
          </p>
          {!address && (
            <Notice title="Connect in the top bar to object.">
              <p>The cases and rulings read without a wallet.</p>
            </Notice>
          )}
          <ApprovedAction
            connectText="Connect in the top bar to object."
            name="Tribunal"
            fn="object"
            args={[p.id, text]}
            label="Object"
            sub={tokenAmount(cost, s, true)}
            token={r.addresses.PairToken}
            spender={r.addresses.Tribunal}
            spend={cost}
            spendFor="for the oracle fee and the stake"
            disabled={!!reason || info.loading || !info.data}
            reason={reason}
            textReason={textReason}
          />
          <p className="small">
            {tokenAmount(con(s, "Tribunal.ORACLE_FEE"), s, true)} oracle fee +{" "}
            {tokenAmount(con(s, "Tribunal.STAKE"), s, true)} stake, from your{" "}
            {s?.constants.pairSymbol} balance. Write your objection to send it;
            nothing is paid until it passes.
          </p>
        </>
      )}
    </article>
  );
}
/** A sale button's sub-label: "≈ 25.98 imdTEST" from the quote, "no quote" when the pool cannot
 * quote it (a failed read, or nothing out), never "≈ 0.00". */
function quoteSub(
  q: { data?: bigint; error: string; loading: boolean },
  fmt: (n: bigint) => string,
) {
  return q.data
    ? `≈ ${fmt(q.data)}`
    : q.error || q.data === 0n
      ? "no quote"
      : "reading the pool…";
}
export function Objections() {
  const { r, s, now, refresh } = useApp(),
    specific = new URLSearchParams(location.hash.split("?")[1]).get("plea"),
    // ?plea=N names one plea; one that does not exist says so, never "No open cases" (F3).
    exists =
      !!s &&
      !!specific &&
      /^\d+$/.test(specific) &&
      BigInt(specific) > 0n &&
      BigInt(specific) < val(s, "CabalGate.nextId"),
    requested = useRead(
      () => getPlea(r, BigInt(specific!), s?.logs),
      [specific],
      exists,
    );
  const open =
      s?.court.open
        .filter(
          (p) => [2, 4, 5].includes(p.status) && !caseState(p, s!, now).closed,
        )
        .sort((a, b) => Number(a.verdictAt - b.verdictAt)) || [],
    selected =
      s?.court.open.find((p) => String(p.id) === specific) ||
      s?.pleas.find((p) => String(p.id) === specific) ||
      requested.data,
    list = specific ? (selected ? [selected] : []) : open,
    shown = specific && selected ? [2, 4, 5].includes(selected.status) : true;
  const objections = (
    s?.v.objections ||
    s?.pleas.flatMap((p) => p.objections || []) ||
    []
  )
    .slice()
    .sort((a: any, b: any) => Number(b.id - a.id));
  const objectorName = useNames(objections.map((o: any) => o.objector));
  const cases = useRead(
    () =>
      Promise.all(
        [...new Set<bigint>(objections.map((o: any) => o.pleaId))].map((id) =>
          getPlea(r, id, s?.logs),
        ),
      ),
    [objections.map((o: any) => o.id + ":" + o.ruling).join(",")],
    !!s && objections.length > 0,
  );
  return (
    <>
      <Title title="Objection!">
        For {span(Number(con(s, "Tribunal.OBJECTION_WINDOW")))} after an
        approval, anyone else may object. A fresh panel re-scores the plea; the
        points can only fall, and the sale stands.
      </Title>
      <div className="cluster">
        <span className="pill">
          {span(Number(con(s, "Tribunal.OBJECTION_WINDOW")))} after an approval
        </span>
        <span className="pill">
          {tokenAmount(con(s, "Tribunal.ORACLE_FEE"), s, true)} fee +{" "}
          {tokenAmount(con(s, "Tribunal.STAKE"), s, true)} stake
        </span>
        <span className="pill">
          At most {String(con(s, "Tribunal.MAX_OBJECTIONS"))} per plea
        </span>
      </div>
      <section className="section">
        <div className="section__head">
          <h2>Open now</h2>
          <p className="meta">
            {specific
              ? selected
                ? `Plea #${selected.id}${shown ? "" : selected.status === 1 ? " · no verdict yet" : selected.status === 3 ? " · denied" : " · not approved"}`
                : exists || !s
                  ? `Plea #${specific}`
                  : `${s.historyError ? "" : `${open.length} open now · `}plea #${specific} not found`
              : s?.historyError && !list.length
                ? "History incomplete"
                : `${list.length} approved plea${list.length === 1 ? "" : "s"} · closing soonest first`}
          </p>
        </div>
        <div className="split">
          <div className="stack">
            {val(s, "CabalGate.diedAt") ? (
              <Empty
                icon="gavel"
                title="The court has risen"
                action={{ href: "#/buy", label: "Sell on the Buy page" }}
              >
                No plea can be approved any more, so there is nothing new to
                object to. Stakes on objections already filed still move when
                anyone calls settle.
              </Empty>
            ) : list.length ? (
              list.map((p) => <ObjectionForm p={p} key={String(p.id)} />)
            ) : specific && (!s || (exists && !requested.error)) ? (
              <p className="loading-label">
                <Icon name="hourglass" />
                Reading plea #{specific}…
              </p>
            ) : specific ? (
              <Empty
                icon="megaphone-simple"
                title={exists ? `Can’t read plea #${specific}` : `No plea #${specific}`}
                action={{ href: "#/objections", label: "See the open cases" }}
              >
                {exists
                  ? "The public RPC did not answer. The site tries the next one by itself."
                  : /^\d+$/.test(specific) && BigInt(specific) > 0n
                    ? `Plea #${specific} has not been submitted.`
                    : "Plea numbers start at #1."}
              </Empty>
            ) : s?.historyError ? (
              // The open cases come from history; with a gap in it, "none" is not known (r2S-N1).
              <Empty
                icon="megaphone-simple"
                title="Can’t tell which cases are open yet"
                action={{
                  label: "Try history again",
                  onClick: () => {
                    resetHealth();
                    void refresh();
                  },
                }}
              >
                Approved pleas inside their objection window are found in the
                history, and part of it could not be read. They show once the
                history is read.
              </Empty>
            ) : (
              <Empty
                icon="megaphone-simple"
                title="No open cases"
                action={{ href: "#/wall", label: "See the Wall" }}
              >
                No approved plea is inside its objection window.
              </Empty>
            )}
          </div>
          <Panel title="How a ruling works">
            <p>
              <span className="stamp stamp--sm stamp--objection">
                SUSTAINED
              </span>{" "}
              A second panel gives a score more than{" "}
              {String(con(s, "Tribunal.MARGIN"))} below the need. No points; the
              stake comes back.
            </p>
            <p>
              <span className="stamp stamp--sm stamp--objection">
                OVERRULED
              </span>{" "}
              The lowest score counts for points. The stake goes to the season
              prize pot.
            </p>
            <p>
              <span className="stamp stamp--sm stamp--objection">VOID</span> The
              panel split or gave no answer within{" "}
              {span(Number(con(s, "Tribunal.PENDING_EXPIRY")))}. Nothing
              changes; the stake comes back.
            </p>
            <Costs
              rows={[
                [
                  "Oracle fee, spent",
                  tokenAmount(con(s, "Tribunal.ORACLE_FEE"), s, true),
                ],
                [
                  "Stake: back unless overruled",
                  tokenAmount(con(s, "Tribunal.STAKE"), s, true),
                ],
                [
                  `An objection, from your ${s?.constants.pairSymbol}`,
                  tokenAmount(
                    BigInt(con(s, "Tribunal.ORACLE_FEE")) +
                      BigInt(con(s, "Tribunal.STAKE")),
                    s,
                    true,
                  ),
                ],
              ]}
            />
            <p>
              <Icon name="coins" /> The oracle fee is spent in every outcome.
            </p>
            <p>
              <Icon name="scales" /> Points can fall, never rise.
            </p>
            <p>
              <Icon name="gavel" /> The sale is never touched.
            </p>
            <p>
              <Icon name="hourglass" /> Anyone can settle a ruled stake.
            </p>
          </Panel>
        </div>
      </section>
      <section className="section">
        <div className="section__head">
          <h2>Recent rulings</h2>
        </div>
        {objections.length ? (
          <div
            className="table-wrap"
            role="region"
            aria-label="Recent rulings on objections"
            tabIndex={0}
          >
            <table className="table table--tight">
              <caption className="sr-only">
                Recent rulings on objections, newest first
              </caption>
              <thead>
                <tr>
                  {[
                    "Objection",
                    "Ruling",
                    "Plea",
                    "Points that count",
                    "Stake",
                    "Objection text",
                  ].map((t) => (
                    <th scope="col" key={t}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {objections.map((o: any) => {
                  const p =
                    cases.data?.find((p) => p.id === o.pleaId) ||
                    s?.pleas.find((p) => p.id === o.pleaId);
                  return (
                    <tr key={String(o.id)}>
                      <th scope="row">
                        <span className="mono">#{String(o.id)}</span>
                        {/* "<name or 0x…>", as the plea page names objectors (review-2 C5). */}
                        <span className="cell-note">
                          by{" "}
                          {objectorName(o.objector) || (
                            <span className="mono">{short(o.objector)}</span>
                          )}
                        </span>
                      </th>
                      <td>
                        <span className="stamp stamp--sm stamp--objection">
                          {
                            ["", "OBJECTION", "SUSTAINED", "OVERRULED", "VOID"][
                              o.ruling
                            ]
                          }
                        </span>
                        <p className="small">
                          {p ? objectionLine(o, p, s, now) : "Reading the plea…"}
                        </p>
                      </td>
                      <td>
                        <a href={`#/p/${o.pleaId}`}>#{String(o.pleaId)}</a>
                      </td>
                      <td>
                        {o.ruling === 2
                          ? `none · was ${p?.score || 0}`
                          : o.ruling === 4
                            ? "unchanged"
                            : p
                              ? `${p.points} points`
                              : "Reading…"}
                      </td>
                      <td>
                        <p>
                          {tokenAmount(con(s, "Tribunal.STAKE"), s, true)}
                          <span className="cell-note">
                            {stakeNote(o, !!p && objectionStale(o, p, s!, now))}
                          </span>
                        </p>
                        {o.ruling === 1 &&
                          now >
                            Number(o.filedAt) +
                              Number(con(s, "Tribunal.PENDING_EXPIRY")) && (
                            <TxButton
                              connectText="Connect in the top bar to expire it."
                              name="Tribunal"
                              fn="expire"
                              args={[o.id]}
                              label="Expire unanswered objection"
                            />
                          )}
                        {o.ruling > 1 && !o.settled && (
                          <TxButton
                            connectText="Connect in the top bar to settle the stake."
                            name="Tribunal"
                            fn="settle"
                            args={[o.id]}
                            label="Settle objection stake"
                          />
                        )}
                      </td>
                      <td>{o.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="scales" title="No rulings yet">
            The Tribunal has not ruled on an objection{soFar()}.
          </Empty>
        )}
      </section>
    </>
  );
}

/** Display names for a list of wallets (Letterbox.nameOf), "" while unread or unnamed. */
function useNames(addresses: string[]) {
  const { r } = useApp(),
    list = [...new Set(addresses.map((a) => a.toLowerCase()))].sort();
  const names = useRead(
    async () =>
      Object.fromEntries(
        await Promise.all(
          list.map(async (a) => [a, await nameOf(r, a).catch(() => "")]),
        ),
      ) as Record<string, string>,
    [list.join()],
    list.length > 0,
  );
  return (a: string) => names.data?.[a.toLowerCase()] || "";
}
/** An objector by display name, or the short address in mono (C5). */
function Who({ address, name }: { address: string; name: string }) {
  return <span className={name ? "strong" : "mono"}>{name || short(address)}</span>;
}
const RULING = ["", "Objection", "Sustained", "Overruled", "Void"];
/** "No objection filed", "1 objection filed", "3 objections filed": every objection a closed case had. */
const filedText = (p: Plea) =>
  `${p.objections?.length ? plural(p.objections.length, "objection") : "No objection"} filed`;
function ObjectionLines({ p }: { p: Plea }) {
  const { s, now } = useApp(),
    name = useNames((p.objections || []).map((o) => o.objector));
  return (
    <>
      {p.objections?.map((o) => {
        const stale = objectionStale(o, p, s!, now);
        return (
          <p className="cluster cluster--sm small" key={String(o.id)}>
            <span className="stamp stamp--sm stamp--objection">
              {o.ruling === 1 ? `Objection #${o.id}` : RULING[o.ruling]}
            </span>
            <span>
              {o.ruling === 1
                ? stale
                  ? `no answer within ${span(Number(con(s, "Tribunal.PENDING_EXPIRY")))}`
                  : "pending"
                : objectionLine(o, p, s, now)}
            </span>
            <span className="text-2">
              by <Who address={o.objector} name={name(o.objector)} />
              {stale ? " · void once anyone expires it; nothing changes" : ""}
              {o.text ? ` · “${o.text}”` : ""}
            </span>
          </p>
        );
      })}
    </>
  );
}
/** One objection in the Sale status: who filed it and what its panel did (C2, E3a). */
function ObjectionRuling({ o, p, who }: { o: any; p: Plea; who: ReactNode }) {
  const { r, s } = useApp(),
    panel = useRead(
      () => oracleRequest(r, p, s!.logs, o),
      [o.id, o.ruling],
      o.ruling === 2 || o.ruling === 3,
    ),
    agreed =
      panel.data?.agreed === undefined
        ? ""
        : ` (${panel.data.agreed} of ${panel.data.panelSize ?? con(s, "Tribunal.PANEL_SIZE")} agreed)`;
  if (o.ruling === 1)
    return (
      <div className="stack stack--sm">
        <p className="small">
          Objection #{String(o.id)} by {who}:
        </p>
        <p className="plea__text">“{o.text}”</p>
      </div>
    );
  return (
    <p className="small">
      Objection #{String(o.id)} by {who}:{" "}
      {o.ruling === 2
        ? `a second panel re-scored it ${o.newScore}${agreed}. The first panel gave ${p.score}.`
        : `a second panel re-scored it ${o.newScore}${agreed}: overruled (sustained only at ${p.need - Number(con(s, "Tribunal.MARGIN")) - 1} or less).`}
    </p>
  );
}
function SaleSummary({
  p,
  state,
  appealId,
  missedSeason,
  judged,
}: {
  p: Plea;
  state: string;
  appealId?: bigint;
  missedSeason: boolean;
  judged?: OracleData;
}) {
  const { r, s, now } = useApp(),
    delivered = s!.logs.find(
      (l) => l.eventName === "Delivered" && l.args.id === p.id,
    ),
    { address } = useAccount(),
    mine = address?.toLowerCase() === p.seller.toLowerCase(),
    end = Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN"));
  const saleLog =
    delivered ||
    s!.logs.find((l) => l.eventName === "SellExecuted" && l.args.id === p.id);
  const time = useRead(
    () => blockTime(r, saleLog!.blockNumber),
    [saleLog?.blockNumber],
    !!saleLog,
  );
  const original = useRead(
    () => getPlea(r, p.originalId, s!.logs),
    [p.originalId],
    !!p.isAppeal,
  );
  const oc = objectionCase(p, s!, now),
    cs = caseState(p, s!, now),
    name = useNames((p.objections || []).map((o) => o.objector)),
    who = (o: any) => <Who address={o.objector} name={name(o.objector)} />,
    stake = tokenAmount(con(s, "Tribunal.STAKE"), s, true);
  const sold =
    p.status === 4
      ? `${tokenAmount(p.amount, s)} sold for ${tokenAmount(soldFor(p, s!), s, true)}${time.data ? ` at ${clock(time.data)}` : ""}.`
      : "Nothing was sold.";
  const appealLine =
    p.isAppeal && original.data
      ? `#${p.originalId} was denied, ${original.data.score} vs need ${original.data.need}, at ${clock(original.data.verdictAt)}. The appeal scored ${p.score} at ${clock(p.verdictAt)}${state === "UPHELD" ? ": denied again." : "."}`
      : undefined;
  // A pending objection past its PENDING_EXPIRY promises nothing: it can only be voided (IMD5).
  const staleLines = cs.stale.map((o: any) => (
    <p className="small" key={String(o.id)}>
      Objection #{String(o.id)} by {who(o)} got no answer within{" "}
      {span(Number(con(s, "Tribunal.PENDING_EXPIRY")))}: anyone may expire it,
      and it changes nothing.
    </p>
  ));
  const ruled = oc.list.map((o) => (
    <ObjectionRuling key={String(o.id)} o={o} p={p} who={who(o)} />
  ));
  const onSale =
    ["SOLD", "LAPSED", "OVERTURNED"].includes(state) &&
    [4, 5, 2].includes(p.status);
  if (onSale && (oc.sustained.length || oc.pending.length))
    return (
      <>
        {ruled}
        {staleLines}
        <p className={oc.sustained.length ? undefined : "small"}>
          {oc.sustained.length ? (
            <>
              <b>No points for this plea.</b>{" "}
              {p.status === 4 ? `The sale stands: ${sold}` : sold}
            </>
          ) : p.excluded ? (
            <>
              This seller is excluded from season points.{" "}
              {p.status === 4 ? `The sale stands: ${sold}` : sold}
            </>
          ) : (
            <>
              <b>+{p.points} points held</b> until{" "}
              {oc.pending.length > 1
                ? "both panels rule"
                : "the second panel rules"}
              . Sustained if the new score is{" "}
              {p.need - Number(con(s, "Tribunal.MARGIN")) - 1} or less (more
              than {String(con(s, "Tribunal.MARGIN"))} below the need {p.need}
              ). {p.status === 4 ? `The sale stands either way: ${sold}` : sold}
            </>
          )}
        </p>
        {oc.sustained.length > 0 && (
          <p className="small text-2">
            {oc.sustained.length === 1
              ? `The objector’s ${stake} stake ${oc.sustained[0].settled ? "was returned." : "goes back when anyone calls settle."}`
              : oc.sustained
                  .map(
                    (o) =>
                      `Objection #${o.id}’s ${stake} stake ${o.settled ? "was returned." : "goes back when anyone calls settle."}`,
                  )
                  .join(" ")}
          </p>
        )}
        {appealLine && <p>{appealLine}</p>}
      </>
    );
  // Overruled objections and stale ones are named above the sale itself (E3a, IMD5).
  const notes = onSale ? (
    <>
      {ruled}
      {staleLines}
    </>
  ) : null;
  if (p.status === 4)
    return (
      <>
        {notes}
        {appealLine && <p>{appealLine}</p>}
        <Costs
          rows={
            p.isAppeal
              ? [
                  ["Sold", tokenAmount(p.amount, s)],
                  [
                    "For",
                    `${tokenAmount(soldFor(p, s!), s, true)}${time.data ? ` at ${clock(time.data)}` : ""}`,
                  ],
                  [
                    "Points",
                    p.standing?.[1] || p.excluded
                      ? "none"
                      : missedSeason
                        ? "not recorded; season closed"
                        : `+${p.points}${pointsHeld(p, s!, now) ? " held" : ""}${p.seat ? ` (${Math.min(p.score, Number(p.standing?.[2] ?? p.score))} × ${Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS")) / 10000}, seat)` : ""}`,
                  ],
                  ...(delivered
                    ? ([
                        ["Sold by", short(delivered.args.runner)],
                        [
                          "Tip, to whoever sold it",
                          tokenAmount(delivered.args.tip, s, true),
                        ],
                        [
                          "Auto-sell fee, to the season prize pot",
                          tokenAmount(delivered.args.fee, s, true),
                        ],
                      ] as [string, string][])
                    : []),
                ]
              : delivered
                ? [
                    ["Sold", tokenAmount(p.amount, s)],
                    [
                      "Sold by",
                      delivered.args.runner.toLowerCase() ===
                      address?.toLowerCase()
                        ? "you"
                        : short(delivered.args.runner),
                    ],
                    [
                      "Tip, to whoever sold it",
                      tokenAmount(delivered.args.tip, s, true),
                    ],
                    ...(delivered.args.fee > 0n
                      ? [
                          [
                            "Auto-sell fee, to the season prize pot",
                            tokenAmount(delivered.args.fee, s, true),
                          ] as [string, string],
                        ]
                      : []),
                    ["To the writer", tokenAmount(soldFor(p, s!), s, true)],
                    [
                      "Points",
                      p.standing?.[1] || p.excluded
                        ? "none"
                        : missedSeason
                          ? "not recorded; season closed"
                          : `+${p.points}${pointsHeld(p, s!, now) ? " held" : ""}`,
                    ],
                  ]
                : [
                    [
                      "Sold",
                      `${tokenAmount(p.amount, s)} for ${tokenAmount(soldFor(p, s!), s, true)}${time.data ? ` at ${clock(time.data)}` : ""}`,
                    ],
                    [
                      "Points",
                      p.standing?.[1] || p.excluded
                        ? "none"
                        : missedSeason
                          ? "not recorded; season closed"
                          : `+${p.points}`,
                    ],
                  ]
          }
        />
      </>
    );
  if (state === "LAPSED")
    return (
      <>
        {notes}
        <p>
          Approved at {clock(p.verdictAt)} but not sold within{" "}
          {span(Number(con(s, "CabalGate.EXECUTE_WINDOW")))}: the window closed
          at{" "}
          {clock(
            Number(p.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW")),
          )}
          .{" "}
          {p.standing?.[1] ? (
            "An objection was sustained: no points for this plea."
          ) : p.excluded ? (
            "This seller is excluded from season points."
          ) : missedSeason ? (
            "Its points were not recorded before the season closed."
          ) : (
            <>
              The {p.points} points still count for season{" "}
              {Number(
                (p.verdictAt - BigInt(val(s, "CabalGate.startedAt"))) /
                  BigInt(con(s, "Seasons.SEASON")),
              ) + 1}
              .
            </>
          )}
        </p>
        {/* The countdown is the seller's own; others read whose cooldown it is (review-2 C5). */}
        {now < end && mine && (
          <div>
            <Countdown until={end} label="Next plea in" />
          </div>
        )}
        <p>
          The {mine ? "" : "seller’s "}
          {span(Number(con(s, "CabalGate.COOLDOWN")), "adj")} cooldown{" "}
          {now < end ? "runs" : "ran"} from the verdict, until {clock(end)}.
        </p>
      </>
    );
  if (state === "NO VERDICT")
    return (
      <>
        <p>{noVerdict(p, s!, now).sentence}</p>
        <p>
          {noVerdict(p, s!, now).detail} No cooldown; the{" "}
          {tokenAmount(con(s, "CabalGate.ORACLE_FEE"), s, true)} oracle fee is
          not refunded.{" "}
          {/* After the death a new plea reverts (CabalGate._requireCanPlead: CabalNotWatching). */}
          {val(s, "CabalGate.diedAt")
            ? "Pleas are closed: the Cabal is dead. PLEA sells freely on the Buy page."
            : `${mine ? "You" : "The seller"} may plead again at once.`}
        </p>
      </>
    );
  if (state === "UPHELD")
    return (
      <>
        {appealLine && <p className="small">{appealLine}</p>}
        <p>
          <b>No further appeal.</b> The{" "}
          {span(Number(con(s, "CabalGate.COOLDOWN")), "adj")} cooldown ran from
          this verdict, until {clock(end)}.
        </p>
        {judged && (
          <p className="small text-2">
            {judgeLine(
              judged,
              con(s, "CabalGate.PANEL_SIZE"),
              Number(p.verdictAt) - Number(p.submittedAt),
            )}
          </p>
        )}
      </>
    );
  if (appealId)
    return (
      <p>
        Appealed as <a href={`#/p/${appealId}`}>plea #{String(appealId)}</a>.
      </p>
    );
  if (now > end) return <p>The appeal window closed at {clock(end)}.</p>;
  return (
    <p>
      {mine ? "You" : "The seller"} may appeal once, until {clock(end)}.
    </p>
  );
}

function AppealHistory({ p }: { p: Plea }) {
  const { r, s } = useApp(),
    original = useRead(
      () => getPlea(r, p.originalId, s!.logs),
      [p.originalId],
      !!p.isAppeal,
    );
  return original.data ? (
    <p>
      #{String(p.originalId)} was denied, {original.data.score} vs need{" "}
      {original.data.need}, at {clock(original.data.verdictAt)}. The appeal
      scored {p.score} at {clock(p.verdictAt)}.
    </p>
  ) : null;
}
