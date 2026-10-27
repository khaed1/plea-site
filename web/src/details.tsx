import { resetHealth } from "./config";
import { cashbackWords, site } from "./site";
import { LETTERBOX, Q96, feeDisplay, letterMinimum } from "./models";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useApp, useRead } from "./context";
import {
  con,
  pct,
  caseState,
  recordFrom,
  pointsHeld,
  rulingWait,
  noVerdict,
  feeInPleaText,
  read,
  tokenAmount,
  utc,
  val,
  clock,
  span,
  soldFor,
  pleaState,
  cooldownStep,
  blockTime,
  short,
  type Plea,
} from "./chain";
import {
  AddressView,
  Costs,
  Countdown,
  Icon,
  Meter,
  Panel,
  TxButton,
  ApprovedAction,
  AmountInput,
} from "./components";
import { parseAmount } from "./pages-trade";
export function HomeDetails() {
  const { r, s } = useApp(),
    dead = !!val(s, "CabalGate.diedAt"),
    c = (key: string) => Number(con(s, `PleaHook.${key}`) || 0),
    pair = s?.constants.pairSymbol;
  const total = BigInt(con(s, "PLEA.TOTAL_SUPPLY") || 0n);
  const display = feeDisplay(100n * 10n ** 18n, s?.constants || {}, 0n, dead);
  const scanned =
    s?.logs.filter(
      (l) =>
        l.contract === "PLEA" &&
        l.eventName === "Transfer" &&
        /^0x0{40}$/i.test(l.args.from),
    ) || [];
  const [mintTry, setMintTry] = useState(0);
  const mintQuery = useRead(
    async () => {
      const logs = await r.client.getContractEvents({
        address: r.addresses.PLEA,
        abi: r.abis.PLEA,
        eventName: "Transfer",
        fromBlock: BigInt(site().eventStart),
        toBlock: BigInt(site().eventStart),
      });
      return logs.filter((l: any) => /^0x0{40}$/i.test(l.args.from));
    },
    [mintTry],
    !!s && !scanned.length,
  );
  // A failed mint read says so, with Try again, instead of loading forever (r2T-N3).
  const mintError = !scanned.length && !mintQuery.data ? mintQuery.error : "";
  const minted = (name: string) => {
    const logs = scanned.length ? scanned : mintQuery.data || [];
    const entry = logs.filter(
      (l: any) => l.args.to.toLowerCase() === r.addresses[name]?.toLowerCase(),
    );
    return entry.length
      ? entry.reduce((n: bigint, l: any) => n + BigInt(l.args.value), 0n)
      : undefined;
  };
  const allocation = (name: string) => {
    const n = minted(name);
    return n === undefined
      ? mintError
        ? "Can’t read the mint events"
        : "Reading mint events…"
      : `${tokenAmount(n, s)} (${total ? (n * 100n) / total : 0n}%)`;
  };
  return (
    <section className="section">
      <div className="section__head">
        <h2>Fees and supply</h2>
        <p className="meta">Paid inside the swap, nothing to claim later</p>
      </div>
      <div className="split">
        <Panel title="Fees on every trade">
          <Costs
            rows={[
              [
                cashbackWords(String(pair)).feesRow,
                `${pct(c("CASHBACK_BPS"))}`,
              ],
              ["Owner", `${pct(c("OWNER_BPS"))}`],
              ...(!dead
                ? [
                    ["Season prize pot", `${pct(c("PRIZE_BPS"))}`] as [
                      string,
                      string,
                    ],
                  ]
                : []),
              [
                `${pair} buy wall, kept in the pool`,
                pct(c("POOL_BPS") + (dead ? c("PRIZE_BPS") : 0)),
              ],
              ["Burned", `${pct(c("PLEA_BURN_BPS"))} of the PLEA`],
              ["Total", pct(c("IMD_FEE_BPS") + c("PLEA_BURN_BPS")), "total"],
            ]}
          />
          <p className="small">
            The {pair} parts are taken from the {pair} that reaches the pool. On
            a 100 {pair} buy, {display.reaches} {pair} reaches the pool and the
            fee is {display.fees} {pair}: {display.cash} back to you,{" "}
            {display.owner} to the owner
            {dead
              ? ` and ${display.wall} to the buy wall`
              : `, ${display.prize} to the season prize pot and ${display.wall} to the buy wall`}
            ; {pct(c("PLEA_BURN_BPS"))} of the PLEA is burned. Launch fees come
            on top during the opening window.
          </p>
          {val(s, "PleaHook.pendingRebalance") && (
            <>
              <p className="small">
                Anyone may press this, unpaid: it burns the PLEA the buy wall
                has bought and places all the {pair} the hook has collected as
                one buy wall just below the price. The {pair} never leaves the
                pool.
              </p>
              <TxButton
                connectText="Connect in the top bar to rebalance the buy wall."
                name="PleaHook"
                fn="rebalance"
                label="Rebalance buy wall"
                small
              />
            </>
          )}
        </Panel>
        <Panel title="Supply">
          <Costs
            rows={[
              ["Pool liquidity, locked forever", allocation("PleaHook")],
              [
                `Season bonus: ${tokenAmount(con(s, "Seasons.BONUS_PER_SEASON"), s)} in each of the first ${["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][Number(con(s, "Seasons.BONUS_SEASONS"))] || con(s, "Seasons.BONUS_SEASONS")} seasons`,
                allocation("Seasons"),
              ],
              [
                "Claim list: swarm 10% + airdrop 2%",
                allocation("PleaDistributor"),
              ],
              ["Total PLEA at launch", tokenAmount(total, s), "total"],
              [
                "Burned so far",
                // Rounded away from zero, so Total − Burned = Supply now, rounded down (r2T-N5).
                tokenAmount(
                  -(total - BigInt(val(s, "PLEA.totalSupply") || 0n)),
                  s,
                  false,
                  0,
                  "up",
                ),
              ],
              [
                "Supply now",
                tokenAmount(val(s, "PLEA.totalSupply"), s),
                "total",
              ],
            ]}
          />
          {mintError && (
            <div className="error-box" role="alert">
              <p className="error-box__title">
                <Icon name="plugs" />
                Can’t read the mint events
              </p>
              <p className="small">{mintError}</p>
              <div className="btn-row">
                <button
                  className="btn btn--sm"
                  onClick={() => {
                    resetHealth();
                    setMintTry((n) => n + 1);
                  }}
                >
                  <Icon name="arrow-clockwise" />
                  Try again
                </button>
              </div>
            </div>
          )}
          <a className="btn btn--sm" href="#/claim">
            Check the claim list <Icon name="arrow-right" />
          </a>
        </Panel>
      </div>
    </section>
  );
}
export function BuyWallPanel() {
  return null;
}
/** The least PLEA a plain letter accepts at today's hourly price, from the chain (E1, r2D-N4). */
export function letterLimit(s: any) {
  return s?.v.fees && val(s, "PleaHook.latestPrice")
    ? letterMinimum(
        BigInt(s.v.fees[1]),
        BigInt(val(s, "PleaHook.latestPrice")),
        BigInt(con(s, "CabalGate.MAX_SELL") || 2_500_000n * 10n ** 18n),
      )
    : undefined;
}
/** "a balance of at least about 1,441,383 PLEA at today's price: the fees (at most 144,139 PLEA)
 * may take at most 10% of your PLEA" (letters.html Limits), naming the rule that binds. */
export function letterBalanceText(s: any) {
  const limit = letterLimit(s);
  if (!limit)
    return "a balance of at least 10 times the fees in PLEA, which show once trading opens: the fees may take at most 10% of your PLEA";
  if (!limit.possible)
    return `a plea worth ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)}: at today’s price even ${tokenAmount(con(s, "CabalGate.MAX_SELL"), s)}, the most a letter pleads, is worth less, so no letter passes now`;
  const why =
    limit.reason === "fee"
      ? `the fees (at most ${tokenAmount(BigInt(s.v.fees[1]), s, false, 0, "up")}) may take at most 10% of your PLEA`
      : limit.reason === "value"
        ? `${Number(LETTERBOX.LETTER_SHARE_BPS) / 100}% of it must be worth ${tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} at the hourly price`
        : `${Number(LETTERBOX.LETTER_SHARE_BPS) / 100}% of it must be at least ${tokenAmount(LETTERBOX.MIN_LETTER, s)}`;
  return `a balance of at least about ${tokenAmount(limit.minimum, s, false, 0, "up")} at today’s price: ${why}`;
}
export function LetterDetails() {
  const { r, s } = useApp(),
    { address } = useAccount(),
    oracle = BigInt(con(s, "CabalGate.ORACLE_FEE") || 0n),
    fee = oracle + LETTERBOX.TIP,
    appeal = fee + BigInt(con(s, "CabalGate.APPEAL_POOL_SHARE") || 0n),
    pleaFee = (v: bigint) => feeInPleaText(s, v);
  const status = useRead(
      () => read(r, "Letterbox", "status", [address]),
      [address],
      !!s && !!address,
    ),
    leaderboard = useRead(() => read(r, "Letterbox", "leaderboard"), [], !!s);
  return (
    <>
      <section className="section">
        <div className="section__head">
          <h2>What it costs</h2>
        </div>
        <div className="split">
          <Panel title="Fees">
            <Costs
              rows={[
                ["Oracle fee", tokenAmount(oracle, s, true)],
                [
                  "Tip for whoever sells it",
                  tokenAmount(LETTERBOX.TIP, s, true),
                ],
                ["A letter", tokenAmount(fee, s, true)],
                ["In PLEA", pleaFee(fee)],
                [
                  "Never more than",
                  s?.v.fees
                    ? tokenAmount(s.v.fees[1], s, false, 0, "up")
                    : "after trading opens",
                ],
                ["APPEAL", tokenAmount(appeal, s, true)],
                ["Appeal in PLEA", pleaFee(appeal)],
                [
                  "Appeal, never more than",
                  s?.v.appealFees
                    ? tokenAmount(s.v.appealFees[1], s, false, 0, "up")
                    : "after trading opens",
                ],
                ["Auto-sell fee", "none for letters"],
              ]}
            />
          </Panel>
          <Panel title="Limits">
            <p className="small text-2">A letter needs:</p>
            <ul className="checks">
              <li className="check">
                <Icon name="envelope-simple" />
                <span>
                  at most {String(con(s, "CabalGate.MAX_PLEA_BYTES") || 280)}{" "}
                  bytes (≈ 280 Latin, 140 Cyrillic or Arabic, 93 CJK
                  characters)
                </span>
              </li>
              <li className="check">
                <Icon name="magnifying-glass" />
                <span>one line, no hidden characters</span>
              </li>
              <li className="check">
                <Icon name="wallet" />
                <span>{letterBalanceText(s)}</span>
              </li>
              <li className="check">
                <Icon name="coins" />
                <span>
                  a plea worth at least{" "}
                  {tokenAmount(LETTERBOX.MIN_SALE_VALUE, s, true)} (
                  {Number(LETTERBOX.LETTER_SHARE_BPS) / 100}% of your PLEA)
                </span>
              </li>
              <li className="check">
                <Icon name="scales" />
                <span>
                  the contract floor: {Number(LETTERBOX.LETTER_SHARE_BPS) / 100}
                  % must be at least {tokenAmount(LETTERBOX.MIN_LETTER, s)}
                </span>
              </li>
            </ul>
            <p className="small text-2">
              A letter that breaks one is refused, and only the gas is spent. As
              on the site: one plea at a time, and a{" "}
              {span(Number(con(s, "CabalGate.COOLDOWN") || 14400), "adj")}{" "}
              cooldown after a sale, a denial or a lapse.
            </p>
          </Panel>
        </div>
      </section>
      <section className="section">
        <div className="section__head">
          <h2>Example letters</h2>
        </div>
        <div className="auto-grid">
          {[
            "I kept the rest. This fifth pays the rent.",
            "APPEAL My first plea was too brief. Here is what I meant.",
            "NAME kafka_cat",
          ].map((text) => (
            <Panel key={text}>
              <p className="letter-sample">{text}</p>
              <p className="small">
                Reads as:{" "}
                {window.PleaText.checkLetter(text).reads?.replace(
                  /\bIMD\b/g,
                  s?.constants.pairSymbol || site().pairSymbol,
                )}
              </p>
            </Panel>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section__head">
          <h2>Read your status on Etherscan</h2>
        </div>
        <Panel>
          <p>
            {status.data ||
              "Connect in the top bar to read the wallet’s letter status here, or use status(address) on Etherscan."}
          </p>
          {leaderboard.data && <p>{leaderboard.data}</p>}
          <a
            className="btn btn--sm"
            href={`${r.network.explorer}/address/${r.addresses.Letterbox}#readContract`}
          >
            Open Read Contract <Icon name="arrow-right" />
          </a>
        </Panel>
      </section>
    </>
  );
}

export function PleaTimeline({
  p,
  missedSeason,
}: {
  p: Plea;
  missedSeason?: bigint;
}) {
  const { s, now, r } = useApp(),
    { address } = useAccount(),
    mine = address?.toLowerCase() === p.seller.toLowerCase(),
    // The sale's block time starts a sold plea's cooldown (CabalGate._sell).
    saleLog =
      p.status === 4
        ? s!.logs.find(
            (l) =>
              ["SellExecuted", "Delivered"].includes(l.eventName) &&
              l.args.id === p.id,
          )
        : undefined,
    saleTime = useRead(
      () => blockTime(r, saleLog!.blockNumber),
      [saleLog?.blockNumber],
      !!saleLog,
    ),
    approved = [2, 4, 5].includes(p.status),
    points = approved && !p.standing?.[1] && !p.excluded,
    window = Number(p.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW")),
    objection =
      Number(p.verdictAt) + Number(con(s, "Tribunal.OBJECTION_WINDOW")),
    cooldown = Number(p.verdictAt) + Number(con(s, "CabalGate.COOLDOWN"));
  const state = pleaState(p, now, s!);
  const steps: any[] = [
    ["Submitted", clock(p.submittedAt), "arrow-right", "is-done"],
    [
      state === "NO VERDICT"
        ? "No verdict"
        : p.verdictAt
          ? "Judged"
          : "Waiting for the Cabal",
      state === "NO VERDICT"
        ? noVerdict(p, s!, now).sentence
        : p.verdictAt
          ? `${clock(p.verdictAt)} · ${p.score} vs need ${p.need}`
          : "Usually 3 to 6 minutes.",
      "gavel",
      p.verdictAt || state === "NO VERDICT" ? "is-done" : "is-now",
    ],
  ];
  if (state === "NO VERDICT")
    steps.push(
      // After the death no plea is taken (CabalGate._requireCanPlead: CabalNotWatching).
      val(s, "CabalGate.diedAt")
        ? ["Pleas closed", "The Cabal is dead; sell on the Buy page.", "check", "is-done"]
        : ["No cooldown", "The seller may plead again at once.", "check", "is-done"],
    );
  if (approved)
    steps.push([
      p.status === 4 ? "Sold" : "Sell window",
      p.status === 4
        ? // "Writer" is the Letterbox's word: a letter or an auto-sell plea; a hand plea's
          // seller sold it (sweep nit).
          `${tokenAmount(soldFor(p, s!), s, true)} to the ${p.flags & 3 ? "writer" : "seller"}`
        : now > window
          ? `Closed at ${clock(window)}`
          : `Sell by ${clock(window)}`,
      "coins",
      p.status === 4 || now > window ? "is-done" : "is-now",
    ]);
  if (points)
    steps.push(
      [
        "Objections",
        caseState(p, s!, now).closed
          ? `Closed${caseState(p, s!, now).closed!.startsWith("at ") ? " " : ": "}${caseState(p, s!, now).closed}${recordFrom(p, s!, now)?.objection ? `. Points held until ${clock(recordFrom(p, s!, now)!.until)}, when ${rulingWait(recordFrom(p, s!, now)!.objections)}` : ""}`
          : `Points held until ${clock(recordFrom(p, s!, now)?.until ?? objection)}${recordFrom(p, s!, now)?.objection ? `, when ${rulingWait(recordFrom(p, s!, now)!.objections)}` : " or the panel rules"}`,
        "megaphone-simple",
        pointsHeld(p, s!, now) && missedSeason === undefined ? "is-now" : "is-done",
      ],
      [
        missedSeason !== undefined
          ? "Points not recorded"
          : "Record the points",
        p.recorded
          ? `+${p.points} points recorded.`
          : missedSeason !== undefined
            ? `Season ${missedSeason + 1n} closed before these points were recorded.`
            : `+${p.points} points. Nothing records them by itself.`,
        "trophy",
        p.recorded || missedSeason !== undefined
          ? "is-done"
          : pointsHeld(p, s!, now)
            ? "is-later"
            : "is-now",
      ],
    );
  if (p.status === 3 && !p.isAppeal)
    steps.push([
      "Appeal window",
      p.appealed
        ? "An appeal has been sent."
        : `One appeal until ${clock(cooldown)}`,
      "arrow-right",
      now <= cooldown && !p.appealed ? "is-now" : "is-done",
    ]);
  if (p.verdictAt) {
    const step = cooldownStep(p, s!, now, saleTime.data, mine);
    steps.push([
      `${span(Number(con(s, "CabalGate.COOLDOWN")), "adj")} cooldown`,
      step.text,
      "timer",
      step.done ? "is-done" : p.status === 2 && now <= window ? "is-later" : "is-now",
    ]);
  }
  return (
    <Panel level={2} title="Timeline">
      <ol className="timeline">
        {steps.map(([title, body, icon, state]) => (
          <li className={state} key={title}>
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
  );
}
