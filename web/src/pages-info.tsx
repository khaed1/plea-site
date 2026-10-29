import { LETTERBOX, Q96, appealFeeBlock, feeSaleShort, min as minBig } from "./models";
import { letterPrecheck } from "./appeal";
import { HowItWorks } from "./home-info";
import { homeLead } from "./loading-text";
import {
  HomeDetails,
  LetterDetails,
  BuyWallPanel,
  letterLimit,
} from "./details";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  hexToString,
  isAddress,
  keccak256,
  stringToHex,
  zeroAddress,
  type Address,
} from "viem";
import { claimsAbi, registryAbi, resetHealth } from "./config";
import { site } from "./site";
import { useApp, useRead, useTx } from "./context";
import {
  amount,
  feeInPleaText,
  signedPercent,
  clock,
  span,
  deadman,
  seasonState,
  potOf,
  smallAmount,
  verifyClaim,
  claimState,
  escrowWaiting,
  cashback,
  con,
  courtCounts,
  duration,
  timeLeft,
  normalizeClaims,
  read,
  short,
  tokenAmount,
  perMillion,
  utc,
  val,
} from "./chain";
import {
  AddressView,
  HeroPlea,
  Action,
  Costs,
  Empty,
  Icon,
  Meter,
  Notice,
  Panel,
  PleaCard,
  TextBox,
  Title,
  TradingGate,
  TxButton,
  textCheck,
  Countdown,
} from "./components";
import { WalletBalances, poolQuote } from "./pages-trade";
import { LIQUIDITY_SHORT, NO_LIQUIDITY } from "./swap-math";
import { claimToast } from "./toast-text";
export function Home() {
  const { r, s, now } = useApp(),
    symbol = s?.constants.symbol || "PLEA",
    dead = !!val(s, "CabalGate.diedAt"),
    season = seasonState(s, now),
    seeded = !!val(s, "PleaHook.seeded");
  const latest = s?.court.latestVerdict || s?.pleas[0],
    price = BigInt(val(s, "PleaHook.priceX96") || 0n),
    previous = BigInt(val(s, "PleaHook.price24hAgo") || 0n),
    hourly = BigInt(val(s, "PleaHook.latestPrice") || 0n),
    supply = BigInt(val(s, "PLEA.totalSupply") || 0n),
    total = BigInt(con(s, "PLEA.TOTAL_SUPPLY") || 0n);
  const court = courtCounts(s, now);
  const count = Number(val(s, "CabalGate.nextId") || 1n) - 1,
    trend = !previous
      ? "no 24h price yet, counts as flat"
      : `24h ${signedPercent((Number(hourly) * 100) / Number(previous) - 100)}${dead ? "" : `, counts as ${hourly > (previous * 102n) / 100n ? "up" : hourly * 100n >= previous * 98n ? "flat" : "down"}`}`;
  return (
    <>
      <div className={latest ? "split hero" : "hero"}>
        <div className="stack stack--lg">
          <div>
            <div className="page-title">
              <h1 className="hero-title">
                <span className="hero-line">Buying is open.</span> Selling{" "}
                {dead ? (
                  "is open forever."
                ) : (
                  <>
                    needs <span className="nowrap">a plea.</span>
                  </>
                )}
              </h1>
            </div>
            <p className="lead">{homeLead(s?.constants || {}, dead)}</p>
          </div>
          <div className="btn-row">
            <a className="btn btn--primary" href="#/buy">
              {dead ? "Buy or sell PLEA" : `Buy ${symbol}`}
            </a>
            <a className="btn" href={dead ? "#/wall" : "#/plead"}>
              {dead ? "See the Wall" : "Plead to sell"}
            </a>
          </div>
          <TradingGate />
          {/* A copycat token named PLEA was announced on its own site (2026-10-29): name the one contract. */}
          <Notice kind="warn" title="Only one PLEA">
            <p>PLEA’s token contract on {site().chain}:</p>
            <p>
              <AddressView address={r.addresses.PLEA} label="PLEA" />
            </p>
            <p>
              Other tokens called PLEA are not ours: check the address before
              you buy. All of PLEA’s contracts are on the{" "}
              <a href="#/docs/contracts">Contracts and owner</a> page in the docs.
            </p>
          </Notice>
        </div>
        {latest && <HeroPlea p={latest} />}
      </div>
      <section className="section" aria-label="Live numbers">
        <div className="stats">
          {[
            [
              "Price · 1M PLEA",
              seeded
                ? perMillion((price * 10n ** 24n) / 2n ** 96n, s) || "No price"
                : "Not open yet",
              seeded
                ? !perMillion((price * 10n ** 24n) / 2n ** 96n, s)
                  ? "The pool holds only dust"
                  : trend
                : `Opens from ${clock(Number(con(s, "PleaLaunch.START")))}`,
            ],
            [
              "Market cap",
              // Before the seed the pool has no price: the cap it opens at, not a 0 (RS1-L2).
              seeded
                ? tokenAmount((supply * price) / 2n ** 96n, s, true, 0)
                : "Not open yet",
              seeded
                ? `Supply ${tokenAmount(supply, s)}`
                : `Opens at ${tokenAmount(con(s, "PleaHook.MARKET_CAP_IMD"), s, true, 0)}`,
            ],
            [
              "PLEA burned",
              // Rounded up, as the Supply panel's "Burned so far" (r2T-N5): one figure on the page.
              amount(total - supply, 18, 0, "up"),
              `Of ${amount(total)} at launch`,
            ],
            [
              "Pleas",
              String(count),
              dead
                ? "Final count: no new pleas"
                : court
                  ? `${court.approved} approved, ${court.denied} denied, ${court.noVerdict} no verdict, ${court.pending} pending`
                  : "Court totals are unavailable until history finishes loading.",
            ],
            [
              "Season prize pot",
              tokenAmount(potOf(s), s, true),
              season
                ? `${season.displayed < BigInt(con(s, "Seasons.BONUS_SEASONS")) ? `+ ${tokenAmount(con(s, "Seasons.BONUS_PER_SEASON"), s)}; ` : ""}${dead ? (season.current.closed ? `Season ${season.displayed + 1n} was the last.` : now >= Number(season.current.bounds[2]) + Number(con(s, "Seasons.CLOSE_GRACE")) ? `anyone can close season ${season.displayed + 1n} now` : `close season ${season.displayed + 1n} from ${clock(Number(season.current.bounds[2]) + Number(con(s, "Seasons.CLOSE_GRACE")))}`) : `season ${season.displayed + 1n} ends in ${timeLeft(Number(season.current.bounds[2]) - now)}`}${season.awaiting !== undefined && season.awaiting < season.displayed ? `; plus what season ${season.displayed} rolls over at its close` : ""}`
                : "The first season begins when trading opens",
            ],
            [
              "Cabal",
              seeded ? (
                <span className="status-item">
                  <span
                    className={`live-dot ${dead ? "live-dot--dead" : ""}`}
                    aria-hidden="true"
                  />
                  {dead ? "Dead" : "Alive"}
                </span>
              ) : (
                "Not started"
              ),
              !seeded
                ? "Begins when trading opens"
                : dead
                  ? `No verdict for ${span(Number(con(s, "CabalGate.DEADMAN")))}: trades freely forever`
                  : `Dies in ${deadman(Number(val(s, "CabalGate.lastVerdictAt")) + Number(con(s, "CabalGate.DEADMAN")) - now)} without a verdict`,
            ],
          ].map(([label, value, note], i) => (
            <div className="stat" key={i}>
              <span className="stat__label">{label}</span>
              <span className="stat__value">
                {typeof value === "string" &&
                value.endsWith(` ${s?.constants.pairSymbol}`) ? (
                  <>
                    <span className="nowrap">
                      {value.slice(0, -(s!.constants.pairSymbol.length + 1))}
                    </span>{" "}
                    <span className="nowrap small">
                      {s!.constants.pairSymbol}
                    </span>
                  </>
                ) : (
                  <span className="nowrap">{value}</span>
                )}
              </span>
              <span className="stat__note">{note}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section__head">
          <h2>Latest verdicts</h2>
          <p className="meta">
            Newest plea first, read from the chain; times are when each plea was
            sent
          </p>
        </div>
        {s?.pleas.length ? (
          <>
            <div className="wall-grid">
              {s.pleas.slice(0, 6).map((p) => (
                <PleaCard key={String(p.id)} p={p} />
              ))}
            </div>
            <a className="btn form-actions-top" href="#/wall">
              See the whole Wall <Icon name="arrow-right" />
            </a>
          </>
        ) : (
          <Empty
            icon="scales"
            title="No pleas yet"
            action={
              seeded && !dead
                ? { href: "#/plead", label: "Write the first plea" }
                : undefined
            }
          >
            {seeded
              ? "Every verdict lands here, newest first. The court is in session; the judges are filing their nails."
              : "The first case will be heard when trading opens."}
          </Empty>
        )}
      </section>
      <HowItWorks />
      <HomeDetails />
    </>
  );
}

export function Letters() {
  const { r, s, toast, now } = useApp();
  const { address } = useAccount();
  const [text, setText] = useState("");
  const tx = useTx(text);
  const result = textCheck("letter", text);
  const [copied, setCopied] = useState(false);
  // A letter first settles the writer's earlier escrow when it can (Letterbox._settleOpen), so that
  // PLEA counts, as on Plead. A plain letter pleads 20% of the balance: below the least balance the
  // Letterbox accepts, Send letter is off with the reason (E1, r2D-N4). An APPEAL letter's fees must
  // fit 10% of the balance or the denied plea's amount + 10% (Letterbox._appeal). SELL and NAME
  // have other rules.
  const pre = useRead(
    () => letterPrecheck(r, s!, address!),
    [address],
    !!s && !!address,
  );
  // A letter's sale: 20% of the PLEA it counts (within the 2.5M cap), or an APPEAL's amount. An approved
  // letter the pool cannot fill can only be settled back, its oracle fee spent: Send letter is off then.
  const letterSale =
    pre.data && result.kind === "plea"
      ? minBig(
          (pre.data.balance * LETTERBOX.LETTER_SHARE_BPS) / 10000n,
          BigInt(con(s, "CabalGate.MAX_SELL") || 0n),
        )
      : pre.data && result.kind === "appeal" && pre.data.appeal
        ? pre.data.appeal.amount
        : 0n;
  const saleQuote = useRead(
    () => poolQuote(r, s!, letterSale, true),
    [letterSale.toString()],
    !!s && letterSale > 0n && !!val(s, "PleaHook.seeded"),
  );
  const poolShort =
    saleQuote.error === LIQUIDITY_SHORT
      ? `The pool cannot fill this letter’s sale of ${tokenAmount(letterSale, s)} now, so an approval could not be delivered and the oracle fee would be spent. Send it after more PLEA has been bought, or plead a smaller amount on the Plead page.`
      : saleQuote.error === NO_LIQUIDITY
        ? `The pool has no ${s?.constants.pairSymbol || site().pairSymbol} to pay for a sale yet; nothing can be sold until someone buys.`
        : "";
  const limit = letterLimit(s),
    feeCap = BigInt(s?.v.fees?.[1] || 0n),
    appealCap = BigInt(s?.v.appealFees?.[1] || 0n),
    data = pre.data,
    holds = data
      ? `You hold ${tokenAmount(data.held, s)}${data.returned ? `, and the letter first settles plea #${data.escrowId}, whose escrow returns ${tokenAmount(data.returned, s)} to you` : ""}.`
      : "",
    needText = limit && !limit.possible
      ? `At today’s price no letter passes: even ${tokenAmount(con(s, "CabalGate.MAX_SELL"), s)}, the most a letter pleads, is worth less than ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)}.`
      : limit
      ? `A letter needs at least about ${tokenAmount(limit.minimum, s, false, 0, "up")} at today’s price: ${
          limit.reason === "fee"
            ? `its fees (at most ${tokenAmount(feeCap, s, false, 0, "up")}) may take at most 10% of your PLEA`
            : limit.reason === "value"
              ? `20% of it must be worth ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} at the hourly price`
              : `20% of it must be at least ${tokenAmount(LETTERBOX.MIN_LETTER, s)}`
        }.`
      : "",
    // Letterbox._appeal: fees ≤ 10% of the balance, or ≤ the denied plea's amount + 10%
    // (FEE_CAP_BPS); a balance of 10 times the fees always passes.
    appealFeeText = (fee: bigint, balance: bigint, original?: bigint) =>
      `An APPEAL letter’s fees (at most ${tokenAmount(fee, s, false, 0, "up")}) may take at most 10% of your PLEA (${tokenAmount(balance, s)})${original !== undefined ? `, or be at most the denied plea’s amount plus 10% (${tokenAmount((original * LETTERBOX.FEE_CAP_BPS) / 10000n, s)})` : ", or be at most the denied plea’s amount plus 10%"}. You need about ${tokenAmount(fee * 10n, s, false, 0, "up")}.`,
    appealBlock =
      result.kind === "appeal" && data?.appeal && data.appealable
        ? appealFeeBlock(
            appealCap,
            data.balance,
            data.appeal.original,
            data.appeal.amount,
          )
        : "",
    shortOf =
      data?.blocked && ["plea", "appeal"].includes(result.kind)
        ? `${data.blocked} A new letter waits until it ends.`
        : // CabalGate._requireCanPlead's cooldown, as Plead shows it; an appeal has none.
          result.kind === "plea" && data && data.cooldownUntil > now
          ? `A new plea waits for your ${span(Number(con(s, "CabalGate.COOLDOWN")), "adj")} cooldown: next plea from ${clock(data.cooldownUntil)}.`
          : result.kind === "appeal" && data?.appealWhy
            ? data.appealWhy
            : result.kind === "plea" &&
            limit &&
            data &&
            (!limit.possible || data.balance < limit.minimum)
          ? `${needText} ${holds}`
          : appealBlock === "cap"
            ? `${appealFeeText(appealCap, data!.balance, data!.appeal!.original)}${data!.returned ? ` ${holds}` : ""}`
            : appealBlock === "fit"
              ? `An APPEAL letter needs its escrow (${tokenAmount(data!.appeal!.amount, s)}) and its fees (at most ${tokenAmount(appealCap, s, false, 0, "up")}) within your PLEA (${tokenAmount(data!.balance, s)}).`
              : ["plea", "appeal"].includes(result.kind)
                ? poolShort
                : "";
  const letterErrors = {
    // The gate's FeeTooHigh: the fee sale needs more PLEA than its 10% margin (the price fell).
    FeeTooHigh: (args: any) =>
      feeSaleShort(args)
        ? "The price fell since the hourly snapshot, so the fees need more PLEA than their 10% margin. Nothing was paid; send the letter again after the next snapshot."
        : result.kind === "appeal"
          ? appealFeeText(
              BigInt(args[0]),
              BigInt(args[1]),
              data?.appeal?.original,
            )
          : `A letter needs at least about ${tokenAmount(BigInt(args[0]) * 10n, s, false, 0, "up")}: its fees (at most ${tokenAmount(BigInt(args[0]), s, false, 0, "up")}) may take at most 10% of your PLEA, and you hold ${tokenAmount(BigInt(args[1]), s)}.`,
    TooSmallForTheFee: (args: any) =>
      `${result.kind === "appeal" ? "This appeal" : "20% of your PLEA"} is worth ${tokenAmount(BigInt(args[0]), s, true)} at the hourly price; a letter must be worth at least ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)}${limit && result.kind !== "appeal" ? `, so it needs a balance of about ${tokenAmount(limit.byValue, s, false, 0, "up")}` : ""}.`,
    LetterTooSmall: (args: any) =>
      `20% of your PLEA is ${tokenAmount(BigInt(args[0]), s)}; a letter must plead at least ${tokenAmount(LETTERBOX.MIN_LETTER, s)}, so it needs a balance of at least ${tokenAmount(LETTERBOX.MIN_LETTER * 5n, s)}.`,
  };
  useEffect(() => {
    setCopied(false);
  }, [text]);
  if (val(s, "CabalGate.diedAt")) {
    // letters.html:350's dead band, and the writer's own open escrow, which only settle returns now.
    const waiting =
      data && data.returned > 0n
        ? escrowWaiting(
            { id: data.escrowId, amount: data.returned, tip: LETTERBOX.TIP },
            s!,
            true,
          )
        : undefined;
    return (
      <>
        <Title title="Plead by letter" />
        <Empty
          icon="envelope-simple"
          title="The Letterbox is closed"
          action={{ href: "#/buy", label: "Sell on the Buy page" }}
        >
          A new letter is refused (<code>CabalNotWatching</code>). PLEA still
          waiting in a letter comes back through settle. The mail room has gone
          home.
        </Empty>
        {waiting && (
          <Notice title={waiting.title}>
            <p>{waiting.body}</p>
            <a className="btn btn--sm" href={`#/p/${data!.escrowId}`}>
              Open plea #{String(data!.escrowId)}
            </a>
          </Notice>
        )}
      </>
    );
  }
  return (
    <>
      <div className="split">
        <div className="stack">
          <Title title="Plead by letter">
            No site needed. Send your plea as a plain message to the Letterbox,
            from {site().explorerName} or your wallet.
          </Title>
          <p className="meta">
            Same judges, same score, same need as a plea from the site. If the
            Cabal approves, anyone may sell it for you within{" "}
            {span(Number(con(s, "CabalGate.EXECUTE_WINDOW") || 420))}, or you
            send SELL and keep the {tokenAmount(LETTERBOX.TIP, s, true)} tip.
          </p>
          <TradingGate />
        </div>
        <Panel card level={2} title="The Letterbox">
          {r.addresses.Letterbox ? (
            <AddressView address={r.addresses.Letterbox} label="Letterbox" />
          ) : (
            <p>Reading the Letterbox address…</p>
          )}
          <div className="cluster">
            <span className="pill">Network: {site().chain}</span>
            <span className="pill">Send 0 ETH</span>
          </div>
          <p className="small">
            Send from the wallet holding your PLEA.{" "}
            {needText && (
              <>
                <b>{needText}</b>{" "}
              </>
            )}
            Nothing to approve: fees come out of your PLEA:{" "}
            {tokenAmount(
              BigInt(con(s, "CabalGate.ORACLE_FEE") || 0n) + LETTERBOX.TIP,
              s,
              true,
            )}
            ,{" "}
            {feeInPleaText(
              s,
              BigInt(con(s, "CabalGate.ORACLE_FEE") || 0n) + LETTERBOX.TIP,
            )}
            . ETH pays only gas.
          </p>
        </Panel>
      </div>
      <section className="section">
        <div className="section__head">
          <h2>
            {site().letterMessagePage ? "Three ways" : "Two ways"} to send it
          </h2>
          <p className="meta">
            {site().letterMessagePage
              ? "All three are the same letter"
              : "Both are the same letter"}
          </p>
        </div>
        <ol className={`steps ${site().letterMessagePage ? "steps--3" : ""}`}>
          {site().letterMessagePage && (
            <li className="step">
              <h3>Etherscan’s message page</h3>
              <p>
                Open{" "}
                <a
                  href={site().letterMessagePage!.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {site().letterMessagePage!.url.replace(/^https?:\/\//, "")}
                </a>{" "}
                ({site().letterMessagePage!.network} only) and connect your
                wallet. The message goes out as the transaction’s data: a raw
                letter.
              </p>
              <Costs
                rows={[
                  ["Send To", "the Letterbox"],
                  ["Message", "your letter"],
                  ["Value", "0 ETH"],
                ]}
              />
            </li>
          )}
          <li className="step">
            <h3>Etherscan’s Write Contract</h3>
            <p>
              Open the Letterbox, then Contract, Write Contract and Connect.
              Call <code>letter(text)</code> with your letter in plain words.
            </p>
            <Costs
              rows={[
                ["Tab", "Contract › Write Contract"],
                ["Function", "letter(text)"],
                ["text", "your letter, in plain words"],
              ]}
            />
            <a
              className="btn"
              href={`${r.network.explorer}/address/${r.addresses.Letterbox}#writeContract`}
              target="_blank"
              rel="noreferrer"
            >
              Open Write Contract
            </a>
          </li>
          <li className="step">
            <h3>Your wallet’s data field</h3>
            <p>
              Send 0 ETH to the Letterbox. Put the UTF-8 hex data from the
              checker below in the transaction’s data field. The sender is
              always the writer.
            </p>
            <p>
              For example, NAME mira_eth is{" "}
              <code className="addr__text">{stringToHex("NAME mira_eth")}</code>
              .
            </p>
            <Costs
              rows={[
                [
                  "To",
                  r.addresses.Letterbox
                    ? short(r.addresses.Letterbox)
                    : "Reading…",
                ],
                ["Amount", "0 ETH"],
                ["Data", "Your letter as UTF-8 hex"],
              ]}
            />
          </li>
        </ol>
      </section>
      <section className="section">
        <div className="section__head">
          <h2>What a letter can say</h2>
          <p className="meta">The first word decides</p>
        </div>
        <ul className="cmds">
          {[
            [
              "any text",
              `A new plea for 20% of your PLEA (at most ${tokenAmount(con(s, "CabalGate.MAX_SELL"), s)}). If approved, anyone may sell it for you within ${span(Number(con(s, "CabalGate.EXECUTE_WINDOW")))} and earns the ${tokenAmount(LETTERBOX.TIP, s, true)} tip. On the Wall it carries the BY LETTER badge.`,
            ],
            [
              "APPEAL <text>",
              `Appeals your latest denied plea within its ${span(Number(con(s, "CabalGate.COOLDOWN")))}, for the same share of your PLEA. It costs ${tokenAmount(BigInt(con(s, "CabalGate.ORACLE_FEE")) + BigInt(con(s, "CabalGate.APPEAL_POOL_SHARE")) + LETTERBOX.TIP, s, true)} in PLEA: ${tokenAmount(con(s, "CabalGate.APPEAL_POOL_SHARE"), s, true)} more, to the buy wall.`,
            ],
            [
              "SELL",
              `Sells your approved letter plea yourself, within its ${span(Number(con(s, "CabalGate.EXECUTE_WINDOW")))} and if nobody has yet, and the ${tokenAmount(LETTERBOX.TIP, s, true)} tip comes back to you.`,
            ],
            [
              "NAME <name>",
              "Sets your display name: 3 to 20 characters, only lower-case a–z, digits 0–9 and _. NAME alone clears it.",
            ],
          ].map(([a, b]) => (
            <li className="cmd" key={a}>
              <span className="cmd__word">{a}</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>
      <Notice title="Commands are matched in capitals, at the very start.">
        <p>
          “SELL me some mercy” is read as SELL, not as a plea. To plead, start
          with another word.
        </p>
      </Notice>
      <section className="section">
        <div className="section__head">
          <h2>Try your letter</h2>
        </div>
        <div className="split">
          <Panel card title="Check your letter">
            <TextBox
              kind="letter"
              label="Your letter"
              value={text}
              onChange={setText}
            />
            <p className="small">
              A command word must be in capitals at the very start. Text after
              SELL is ignored. The byte counter and checks follow the contract
              exactly.
            </p>
            <p className="label">Raw transaction data · UTF-8</p>
            <code className="letter-data">
              {text ? stringToHex(text) : "Write a letter to see its raw data."}
            </code>
            <div className="btn-row">
              <button
                className="btn"
                disabled={!text || !result.ok}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(stringToHex(text));
                    setCopied(true);
                    toast?.({ kind: "info", text: "Hex data copied." });
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    setCopied(false);
                    toast?.({
                      kind: "bad",
                      text: "Copy did not work here: select the text and copy it.",
                    });
                  }
                }}
              >
                {copied ? "Copied" : "Copy hex data"}
              </button>
            </div>
            <Action
              connectText="Connect in the top bar to send a letter."
              {...tx}
              label="Send letter"
              onRun={() =>
                tx.send("Letterbox", "letter", [text], undefined, {
                  errors: letterErrors,
                })
              }
              disabled={
                !tx.ready ||
                !result.ok ||
                !!shortOf ||
                !val(s, "PleaHook.seeded") ||
                !val(s, "CabalGate.cabalAlive")
              }
              reason={
                !val(s, "PleaHook.seeded")
                  ? "Trading is not open yet."
                  : !val(s, "CabalGate.cabalAlive")
                    ? "The Cabal is dead. New pleas and appeals are closed."
                    : shortOf ||
                      (!result.ok ? "Fix the text checks." : undefined)
              }
            />
          </Panel>
          <Panel title="After you send">
            <p>
              Watch the Wall or your Profile. The letter’s PLEA waits in escrow.
              A runner can deliver an approved sale within the sell window; you
              can also sell it yourself.
            </p>
            <p>
              Denied, no verdict or lapsed: settle returns the escrow and runner
              tip. The oracle fee is spent.
            </p>
            <a className="link-btn" href="#/profile">
              Your profile <Icon name="arrow-right" />
            </a>
          </Panel>
        </div>
      </section>
      <LetterDetails />
      <Notice kind="warn" title="Never tell the judges how to score.">
        <p>
          Demands like “give me 45” count as manipulation and score 0. Write an
          honest plea instead.
        </p>
      </Notice>
    </>
  );
}
function VaultClaim({
  vault,
  claims,
  open,
  loading,
  loadError,
}: {
  vault: Address;
  claims: any[] | undefined;
  open: boolean;
  loading: boolean;
  loadError: string;
}) {
  const { r, s } = useApp();
  const entry = claims?.find(
    (c) => c.account.toLowerCase() === vault.toLowerCase(),
  );
  const status = useRead(
    () => read(r, "PleaDistributor", "isClaimed", [BigInt(entry.index)]),
    [entry?.index],
    !!entry && !!s,
  );
  const tx = useTx(),
    state = entry ? claimState(status) : undefined;
  return (
    <div className="stack stack--sm">
      {/* claim.html's "Delegated vault already claimed" band is the notice alone. */}
      {state !== "claimed" && (
        <Costs
          rows={[
            ["Vault", <AddressView address={vault} label="vault" shortDisplay />],
            [
              "Claimable",
              !entry
                ? "—"
                : state === "unknown"
                  ? "Can’t read yet"
                  : state === "checking"
                    ? "Checking chain…"
                    : tokenAmount(BigInt(entry.amount), s),
            ],
          ]}
        />
      )}
      {entry && status.data ? (
        <Notice
          icon="seal-check"
          title={
            <>
              Already claimed for the vault{" "}
              <span className="mono nowrap">{short(vault)}</span>.
            </>
          }
        >
          <p>
            Its {tokenAmount(BigInt(entry.amount), s)} went to the vault.
            Nothing is left to claim for it.{" "}
            <ClaimReceipt index={entry.index} />
          </p>
        </Notice>
      ) : entry ? (
        <Action
          connectText="Connect in the top bar to send a claim. Any wallet will do: it only pays the gas."
          {...tx}
          label={`Claim ${tokenAmount(BigInt(entry.amount), s)} to the vault`}
          sub="gas only"
          primary={false}
          describedBy={`vault-note-${vault}`}
          onRun={() =>
            tx.send(
              "PleaDistributor",
              "claim",
              [
                BigInt(entry.index),
                entry.account,
                BigInt(entry.amount),
                entry.proof,
              ],
              undefined,
              {
                // Only a claim from this panel is called a vault claim (claim.html:242).
                toast: () =>
                  claimToast(
                    {
                      index: BigInt(entry.index),
                      account: entry.account,
                      amount: BigInt(entry.amount),
                    },
                    s!,
                    true,
                  ),
              },
            )
          }
          disabled={!tx.ready || !open || status.data !== false}
          reason={
            state === "unknown"
              ? "Can’t read whether this vault’s PLEA was already claimed: the public RPC did not answer. The site tries again with the next refresh."
              : undefined
          }
        />
      ) : (
        <p className="small">
          {!open
            ? "The claim list is not open yet."
            : loading
              ? "Reading the claim list…"
              : loadError
                ? "Can’t check this vault: the claim list did not load. Try again above."
                : claims
                  ? "This vault is not on the published list."
                  : "Reading the claim list…"}
        </p>
      )}
      {!(entry && status.data) && (
        <p className="small text-2" id={`vault-note-${vault}`}>
          Sent from this hot wallet; the PLEA lands on the vault, which never
          connects.
        </p>
      )}
    </div>
  );
}
export function Claim() {
  const { r, s, toast, refresh } = useApp();
  const { address } = useAccount();
  const [input, setInput] = useState(address || "");
  const [target, setTarget] = useState<string>();
  const [claims, setClaims] = useState<any[]>();
  const [loadError, setLoadError] = useState("");
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const root = val(s, "PleaDistributor.merkleRoot");
  const isOpen = root && root !== "0x" + "0".repeat(64);
  useEffect(() => {
    if (address && !input) setInput(address);
  }, [address]);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    fetch("./" + site().claimsPath)
      .then((r) => {
        if (!r.ok)
          throw Error(
            "The published claims.json file is not available yet. Load the published list below.",
          );
        return r.json();
      })
      .then((x) => {
        if (active) {
          const entries = normalizeClaims(x).filter((c) =>
            verifyClaim(c, root),
          );
          if (!entries.length)
            throw Error(
              "The file has no allocation with a valid proof for the on-chain root.",
            );
          setClaims(entries);
          setLoadError("");
        }
      })
      .catch((e) => {
        // A fetch that got no answer is a TypeError, a file that is not JSON a SyntaxError; the
        // other messages are the checks' own.
        if (active)
          setLoadError(
            e instanceof SyntaxError
              ? "The published claims.json is not a valid claim list. Load the published list below."
              : e instanceof TypeError
                ? "The claim list did not load: this site did not answer. Try again, or load the published list below."
                : e.message,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, reload]);
  const entry = claims?.find(
    (c) => c.account.toLowerCase() === target?.toLowerCase(),
  );
  const status = useRead(
    () => read(r, "PleaDistributor", "isClaimed", [BigInt(entry.index)]),
    [entry?.index, target],
    !!entry && !!s,
  );
  const tx = useTx(target);
  const delegated = useRead(
    () =>
      r.client.readContract({
        address: site().delegateRegistry,
        abi: registryAbi,
        functionName: "getIncomingDelegations",
        args: [address!],
      }),
    [address],
    !!address && !!s,
  );
  return (
    <>
      <Title title="Claim your PLEA">
        12% of PLEA (
        {tokenAmount(
          (BigInt(con(s, "PLEA.TOTAL_SUPPLY") || 0n) * 12n) / 100n,
          s,
        )}
        ) went to a claim list: the IMD swarm’s 10% and a 2% airdrop. Anyone can
        send a claim for any address, and the PLEA always goes to the address on
        the list.
      </Title>
      <div className="split">
        <div className="stack stack--lg">
          <Panel card level={2} title="Check an address">
            {s && !isOpen ? (
              <Empty title="The list is not open yet">
                The Merkle root is still zero. Claims will open when the
                published list is committed on chain.
              </Empty>
            ) : (
              <>
                <div className="field">
                  <label className="field__label" htmlFor="claim-address">
                    Address on the list
                  </label>
                  <div className="addr-check">
                    <div
                      className={`input input--addr ${input && !isAddress(input) ? "is-invalid" : ""}`}
                    >
                      <input
                        className="input__control claim-input"
                        id="claim-address"
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value.trim());
                          setTarget(undefined);
                        }}
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={!!input && !isAddress(input)}
                        aria-describedby={
                          input && !isAddress(input)
                            ? "claim-address-error"
                            : "claim-hint"
                        }
                      />
                    </div>
                    <button
                      className="btn"
                      disabled={!isAddress(input) || loading || !claims}
                      onClick={() => setTarget(input)}
                    >
                      Check
                    </button>
                  </div>
                  <p className="field__hint" id="claim-hint">
                    Any address works. The PLEA goes to this address, whoever
                    sends the claim.
                  </p>
                  {input && !isAddress(input) && (
                    <p
                      className="field__hint bad-text"
                      id="claim-address-error"
                    >
                      That is not an address. Paste one that starts with 0x and
                      has 40 more characters, 0–9 and a–f in either case.
                    </p>
                  )}
                </div>
                {loading && (
                  <p className="loading-label">Reading the claim list…</p>
                )}
                {(loadError || status.error) && (
                  <div className="error-box" role="alert">
                    <p className="error-box__title">
                      <Icon name="plugs" />
                      Can’t check the list
                    </p>
                    <p className="small">
                      {loadError
                        ? `${loadError} Nothing was sent.`
                        : "The public RPC did not answer, so the site can’t tell what this address may claim. Nothing was sent. The site tries the next RPC by itself."}
                    </p>
                    <div className="btn-row">
                      <button
                        className="btn btn--sm"
                        onClick={() => {
                          setLoadError("");
                          setFileError("");
                          resetHealth();
                          setReload((n) => n + 1);
                          void refresh();
                        }}
                      >
                        <Icon name="arrow-clockwise" />
                        Try again
                      </button>
                    </div>
                  </div>
                )}
                {loadError && (
                  <div className="field">
                    <label className="field__label">
                      Load published claims.json
                      <input
                        type="file"
                        accept="application/json,.json"
                        aria-invalid={!!fileError}
                        aria-describedby={
                          fileError ? "claim-file-error" : undefined
                        }
                        onChange={async (e) => {
                          try {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const list = normalizeClaims(
                              JSON.parse(await f.text()),
                            ).filter((c) => verifyClaim(c, root));
                            if (!list.length) throw Error();
                            setClaims(list);
                            setLoadError("");
                            setFileError("");
                            toast?.({
                              text: "Claim list loaded. Every claim is checked against the root before signing.",
                            });
                          } catch {
                            setFileError(
                              "This file is not a valid claim list. Choose the published claims.json.",
                            );
                          }
                        }}
                      />
                    </label>
                    {fileError && (
                      <p
                        className="field__hint bad-text"
                        id="claim-file-error"
                        role="alert"
                      >
                        {fileError}
                      </p>
                    )}
                  </div>
                )}
                {target &&
                  (entry && status.data ? (
                    <Notice
                      icon="seal-check"
                      title={
                        <>
                          Already claimed for{" "}
                          <span className="mono nowrap">{short(target)}</span>.
                        </>
                      }
                    >
                      <p>
                        <ClaimReceipt
                          index={entry.index}
                          amount={tokenAmount(BigInt(entry.amount), s)}
                        />
                      </p>
                    </Notice>
                  ) : entry ? (
                    <>
                      {/* While isClaimed cannot be read, the allocation is not called claimable. */}
                      <Notice
                        title={
                          claimState(status) === "unknown"
                            ? `Can’t read yet whether claim #${entry.index} (${tokenAmount(BigInt(entry.amount), s)}) was claimed.`
                            : claimState(status) === "checking"
                              ? "Checking chain…"
                              : `${tokenAmount(BigInt(entry.amount), s)} claimable (claim #${entry.index})`
                        }
                        kind={claimState(status) === "claimable" ? "ok" : "info"}
                      >
                        <AddressView address={target} label="recipient" />
                        {status.data && <ClaimReceipt index={entry.index} />}
                      </Notice>
                      <Action
                        connectText="Connect in the top bar to send a claim. Any wallet will do: it only pays the gas."
                        {...tx}
                        label={`Claim ${tokenAmount(BigInt(entry.amount), s)}`}
                        sub="gas only"
                        block
                        onRun={() =>
                          tx.send("PleaDistributor", "claim", [
                            BigInt(entry.index),
                            entry.account,
                            BigInt(entry.amount),
                            entry.proof,
                          ])
                        }
                        disabled={
                          !tx.ready ||
                          !!status.data ||
                          status.loading ||
                          status.data === undefined
                        }
                        reason={
                          claimState(status) === "unknown"
                            ? "Can’t read whether this allocation was claimed. Use Try again above."
                            : status.data
                              ? "The allocation has already been claimed."
                              : "Gas only. PLEA lands on the listed account."
                        }
                      />
                    </>
                  ) : (
                    <div className="notice">
                      <Icon name="x-circle" />
                      <div>
                        <p className="notice__title">
                          <span className="mono nowrap">{short(target)}</span>{" "}
                          is not on the list.
                        </p>
                        <p>
                          The list is final, so nothing can be added. Try
                          another address of yours.
                        </p>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </Panel>
          <Panel level={2} title="Delegated vaults" flush meta="delegate.xyz">
            {!address ? (
              <p className="small">
                Connect in the top bar to list the vaults delegated to your
                wallet on delegate.xyz.
              </p>
            ) : delegated.loading ? (
              <div className="stack" aria-busy="true">
                <p className="loading-label">
                  <Icon name="hourglass" />
                  <span>
                    Reading the delegate.xyz registry for{" "}
                    <span className="mono nowrap">{short(address)}</span>…
                  </span>
                </p>
                <div className="skeleton" aria-hidden="true">
                  <div className="skeleton__line" />
                  <div className="skeleton__line skeleton__line--mid" />
                  <div className="skeleton__line skeleton__line--short" />
                </div>
              </div>
            ) : delegated.error ? (
              <Notice kind="warn" title="Cannot read delegations">
                <p>
                  The {site().chain} registry did not answer. You can still check and
                  claim any vault address above.
                </p>
              </Notice>
            ) : delegated.data?.length ? (
              <div className="stack">
                <p className="small">
                  {new Set(delegated.data.map((d) => d.from)).size > 1
                    ? "Vaults delegated to your wallet, "
                    : "A vault delegated to your wallet, "}
                  <span className="mono nowrap">{short(address)}</span>, on
                  delegate.xyz. You can claim{" "}
                  {new Set(delegated.data.map((d) => d.from)).size > 1
                    ? "their"
                    : "its"}{" "}
                  PLEA from here.
                </p>
                {Array.from(new Set(delegated.data.map((d) => d.from))).map(
                  (vault) => (
                    <div className="stack stack--sm" key={vault}>
                      <VaultClaim
                        vault={vault}
                        claims={claims}
                        open={!!isOpen}
                        loading={loading}
                        loadError={loadError}
                      />
                    </div>
                  ),
                )}
              </div>
            ) : (
              <Empty
                icon="wallet"
                title="No delegated vaults"
                action={{
                  href: "https://delegate.xyz",
                  label: "Open delegate.xyz",
                }}
              >
                No vault has delegated to{" "}
                <span className="mono nowrap">{short(address)}</span> on
                delegate.xyz. You can still claim for any address above. Nobody
                has trusted you with their vault yet.
              </Empty>
            )}
            <div className="stack stack--sm">
              <p className="label">Read from the delegate.xyz registry</p>
              <AddressView
                address={site().delegateRegistry}
                label="the delegate.xyz registry"
              />
            </div>
          </Panel>
        </div>
        <Panel
          level={2}
          title="About the list"
          flush
          meta={isOpen ? "Final" : "Not set"}
        >
          <RootDate open={!!isOpen} />
          <Costs
            rows={[
              ["Root", isOpen ? short(root) : s ? "Not set" : "Reading…"],
              [
                "Claims on the list",
                claims ? String(claims.length) : "Not published yet",
              ],
              // Counted from Claimed logs: not shown while history is incomplete (r2S-N1).
              [
                "Claimed so far",
                s?.historyError
                  ? "Shows once the history is read"
                  : String(
                      s?.logs.filter((l) => l.eventName === "Claimed").length ||
                        0,
                    ),
              ],
              [
                "Still open",
                s?.historyError
                  ? "Shows once the history is read"
                  : claims
                    ? String(
                        Math.max(
                          0,
                          claims.length -
                            (s?.logs.filter((l) => l.eventName === "Claimed")
                              .length || 0),
                        ),
                      )
                    : "List not published yet",
              ],
              [
                "IMD swarm (10%)",
                tokenAmount(
                  (BigInt(con(s, "PLEA.TOTAL_SUPPLY") || 0n) * 10n) / 100n,
                  s,
                ),
              ],
              [
                "Airdrop (2%)",
                tokenAmount(
                  (BigInt(con(s, "PLEA.TOTAL_SUPPLY") || 0n) * 2n) / 100n,
                  s,
                ),
              ],
              [
                "In all (12%)",
                tokenAmount(
                  (BigInt(con(s, "PLEA.TOTAL_SUPPLY") || 0n) * 12n) / 100n,
                  s,
                ),
                "total",
              ],
            ]}
          />
          <div className="stack stack--sm">
            <p className="label">The receipt</p>
            <p className="small">
              Each claim emits <code>Claimed(index, account, amount)</code>.
              That event, on {site().explorerName}, is your receipt.
            </p>
          </div>
          <div className="stack stack--sm">
            <p className="label">Pleading with claimed PLEA</p>
            <p className="small">
              Claimed PLEA has no buy record, so in a plea it counts as held
              since trading opened
              {val(s, "CabalGate.startedAt") ? (
                <>
                  {" "}
                  (
                  <span className="nowrap">
                    {clock(val(s, "CabalGate.startedAt"))}
                  </span>
                  )
                </>
              ) : (
                ""
              )}{" "}
              and scores {site().facts.receivedProfit} for profit or loss.
            </p>
          </div>
          <div className="stack stack--sm">
            <p className="label">PleaDistributor</p>
            <AddressView
              address={r.addresses.PleaDistributor}
              label="PleaDistributor"
            />
          </div>
        </Panel>
      </div>
    </>
  );
}

/** The receipt of claim `index` from its Claimed log. With `amount`, the whole sentence of the band
 * "Already claimed" (claim.html:214); without, only the link. */
function ClaimReceipt({ index, amount }: { index: string; amount?: string }) {
  const { r, s } = useApp(),
    log = s?.logs.find(
      (l) =>
        l.eventName === "Claimed" && BigInt(l.args.index) === BigInt(index),
    ),
    date = useRead(
      () => r.client.getBlock({ blockNumber: log!.blockNumber }),
      [log?.transactionHash],
      !!log,
    );
  const link = log && (
    <a
      className="nowrap"
      href={`${r.network.explorer}/tx/${log.transactionHash}`}
      target="_blank"
      rel="noreferrer"
    >
      View the receipt<span className="sr-only">: the Claimed event</span>
    </a>
  );
  return amount ? (
    <>
      {amount} went to this address
      {date.data ? (
        <>
          {" "}
          on <span className="nowrap">{utc(date.data.timestamp)}</span>
        </>
      ) : (
        ""
      )}
      . Nothing is left to claim. {link}
    </>
  ) : (
    link || null
  );
}
function RootDate({ open }: { open: boolean }) {
  const { r, s } = useApp(),
    log = s?.logs.find((l) => l.eventName === "RootSet"),
    date = useRead(
      () => r.client.getBlock({ blockNumber: log!.blockNumber }),
      [log?.transactionHash],
      !!log,
    );
  return (
    <p className="small">
      {!open ? (
        "The root is not set yet. Once it is set, the list is final: no claim can be added, changed or removed."
      ) : (
        <>
          The root was set once
          {date.data ? (
            <>
              , on{" "}
              <span className="nowrap">{utc(date.data.timestamp, true)}</span>
            </>
          ) : (
            ""
          )}
          , and the list is final: no claim can be added, changed or removed.
        </>
      )}
    </p>
  );
}
