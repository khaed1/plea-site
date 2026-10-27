import type { ReactNode } from "react";
import { useApp } from "./context";
import {
  con,
  val,
  span,
  tokenAmount,
  amount,
  deadman,
  deadmanWords,
  short,
  seasonState,
} from "./chain";
import {
  AddressView,
  Costs,
  Icon,
  Notice,
  Panel,
  FactCells,
  Countdown,
} from "./components";
import {
  site,
  cashbackWords,
  routerRow,
  sellGateWarning,
  sourceLink,
} from "./site";
import { LETTERBOX } from "./models";
const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
/** A fact-table cell from index.html: "≤ 20%: <b>16</b> · ≤ 35%: <b>9</b> · more: <b>3</b>". */
function Bands({ bands }: { bands: [string, number][] }) {
  return (
    <>
      {bands.map(([band, points], i) => (
        <span key={band}>
          {i > 0 && " · "}
          <span className="nowrap">
            {band}: <b>{points}</b>
          </span>
        </span>
      ))}
    </>
  );
}
export function HowItWorks() {
  const { s, now } = useApp(),
    c = (k: string) => con(s, k),
    n = (k: string) => Number(c(k)),
    t = (k: string) => span(n(k)),
    pair = s?.constants.pairSymbol,
    pass = n("CabalGate.PASS_MARK"),
    dead = !!val(s, "CabalGate.diedAt"),
    dies = Number(val(s, "CabalGate.lastVerdictAt")) + n("CabalGate.DEADMAN");
  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="section__head">
        <h2 id="how-title">How it works</h2>
        <p className="meta">Four steps, all on chain</p>
      </div>
      <div className="stack stack--xl">
        <ol className="steps steps--4">
          {[
            [
              "Buy",
              `Open to anyone. Every trade pays a ${(n("PleaHook.IMD_FEE_BPS") + n("PleaHook.PLEA_BURN_BPS")) / 100}% fee, and ${cashbackWords(String(pair)).step(`${n("PleaHook.CASHBACK_BPS") / 100}%`, `${tokenAmount((100n * 10n ** 18n * BigInt(c("PleaHook.CASHBACK_BPS") || 0)) / (10000n + BigInt(c("PleaHook.IMD_FEE_BPS") || 0)), s, true)} on a 100 ${pair} buy`)}.`,
            ],
            [
              "Plead",
              `Write why you want to sell ${n("CabalGate.MIN_SHARE_BPS") / 100}% to ${n("CabalGate.MAX_SHARE_BPS") / 100}% of your PLEA (at most ${amount(c("CabalGate.MAX_SELL"), Number(s?.constants.decimals ?? 18))}): 1 to ${c("CabalGate.MAX_PLEA_BYTES")} bytes, any language. Pay the ${tokenAmount(c("CabalGate.ORACLE_FEE"), s, true)} oracle fee. The contract computes your need first.`,
            ],
            [
              "The Cabal judges",
              `${c("CabalGate.PANEL_SIZE")} judges score your plea from 0 to ${c("CabalGate.MAX_PLEA_SCORE")}, and ${c("CabalGate.QUORUM")} must agree. It usually takes 3 to 6 minutes. A score at or above your need is approved.`,
            ],
            [
              `Sell in ${t("CabalGate.EXECUTE_WINDOW")}`,
              `Approved: sell within ${t("CabalGate.EXECUTE_WINDOW")}, or tick auto-sell and anyone may sell it for you for a ${tokenAmount(LETTERBOX.TIP, s, true)} tip. Denied: one appeal within ${t("CabalGate.COOLDOWN")}. After a sale, a denial or a lapse: a ${span(n("CabalGate.COOLDOWN"), "adj")} cooldown.`,
            ],
          ].map(([title, text]) => (
            <li className="step" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        {!dead && sellGateWarning() && (
          <Notice title={sellGateWarning()!.title}>
            <p>{sellGateWarning()!.body}</p>
          </Notice>
        )}
        <div className="stack stack--md">
          <h3>Your need</h3>
          <div className="split">
            <div className="stack stack--lg">
              <p className="text-2 measure">
                Before you pay, the contract scores four facts about your sale
                from the chain. Your need is {pass} minus that fact score: the
                judges must reach it.
              </p>
              <div className="panel panel--flush">
                <div className="panel__head">
                  <h4>The fact score</h4>
                  <span className="meta">
                    0 to {String(c("CabalGate.MAX_PLEA_SCORE"))} points
                  </span>
                </div>
                <div
                  className="table-wrap"
                  role="region"
                  aria-label="Fact score points"
                  tabIndex={0}
                >
                  <table className="table facts-table">
                    <caption className="sr-only">Points for each fact</caption>
                    <thead>
                      <tr>
                        <th scope="col">Fact</th>
                        <th scope="col">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          [
                            "Share sold",
                            [
                              ["≤ 20%", 16],
                              ["≤ 35%", 9],
                              ["more", 3],
                            ],
                          ],
                          [
                            <>
                              Held <span className="nowrap">(buy-weighted)</span>
                            </>,
                            [
                              ["≥ 7 days", 7],
                              ["≥ 3 days", 4],
                              ["≥ 1 day", 2],
                              ["less", 0],
                            ],
                          ],
                          [
                            "Profit or loss",
                            [
                              ["at a loss", 13],
                              ["gain ≤ 50%", 12],
                              ["≤ 200%", 10],
                              ["≤ 500%", 8],
                              ["≤ 1,000%", 6],
                              ["more", 4],
                            ],
                          ],
                          [
                            "24h trend",
                            [
                              ["up > 2%", 9],
                              ["flat ±2%", 5],
                              ["down", 0],
                            ],
                          ],
                        ] as [ReactNode, [string, number][]][]
                      ).map(([fact, bands], i) => (
                        <tr key={i}>
                          <td className="strong">{fact}</td>
                          <td>
                            <Bands bands={bands} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="panel__body">
                  <p className="small text-2">
                    PLEA that no buy record covers (received, not bought)
                    counts as held since trading opened, with 10 points for
                    profit or loss.
                  </p>
                </div>
              </div>
              <Notice
                title={`A need above ${c("CabalGate.MAX_PLEA_SCORE")} cannot pass.`}
              >
                <p>
                  The contract refuses such a plea before you pay (CannotPass),
                  so no fee is spent. Plead a smaller share or wait for better
                  facts.
                </p>
              </Notice>
            </div>
            <div className="panel stack stack--md">
              <h4>Example: a fresh buyer</h4>
              <p className="small text-2">
                Selling up to 20% at a loss, on a flat day, held under a day:
              </p>
              <FactCells
                total={34}
                parts={{
                  shareBps: 2000n,
                  heldFor: 0,
                  pnlBps: -1800n,
                  trendLabel: "flat",
                  share: 16,
                  held: 0,
                  profit: 13,
                  trend: 5,
                  total: 34,
                  uncovered: 0n,
                }}
              />
              <p className="strong num">
                Fact <span className="nowrap">16 + 0 + 13 + 5 = 34,</span> so
                the need is{" "}
                <span className="nowrap">
                  {pass} − 34 = {pass - 34}.
                </span>
              </p>
              <div
                className="table-wrap"
                role="region"
                aria-label="Need by holding time"
                tabIndex={0}
              >
                <table className="table">
                  <caption className="sr-only">
                    The same sale after holding longer
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Held</th>
                      <th scope="col" className="r">
                        Fact score
                      </th>
                      <th scope="col" className="r">
                        Need
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["under a day", 34],
                        ["a day", 36],
                        ["three days", 38],
                        ["a week", 41],
                      ] as [string, number][]
                    ).map(([held, fact]) => (
                      <tr key={held}>
                        <td>{held}</td>
                        <td className="r">{fact}</td>
                        <td className="r strong">{pass - fact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="auto-grid">
          <div className="panel stack stack--md info-panel">
            <h3 className="cluster cluster--sm">
              <Icon name="envelope-simple" />
              Letters
            </h3>
            <p>
              Plead without the site: send your plea as text to the Letterbox
              from {site().explorerName}. It pleads{" "}
              {Number(LETTERBOX.LETTER_SHARE_BPS) / 100}% of your PLEA and pays
              its fees in PLEA. If approved, anyone can sell it for you within{" "}
              {t("CabalGate.EXECUTE_WINDOW")} and earns the{" "}
              {tokenAmount(LETTERBOX.TIP, s, true)} tip; send SELL yourself and
              you keep it.
            </p>
            <a className="link-btn" href="#/letters">
              How to send a letter <Icon name="arrow-right" />
            </a>
          </div>
          <div className="panel stack stack--md info-panel">
            <h3 className="cluster cluster--sm">
              <Icon name="megaphone-simple" />
              Objection!
            </h3>
            <p>
              For {t("Tribunal.OBJECTION_WINDOW")} after an approval, anyone
              else may object: {tokenAmount(c("Tribunal.ORACLE_FEE"), s, true)}{" "}
              fee + {tokenAmount(c("Tribunal.STAKE"), s, true)} stake. A new
              panel of {String(c("Tribunal.PANEL_SIZE"))} re-scores the plea.
              The sale is never touched; only the points can fall.
            </p>
            <a className="link-btn" href="#/objections">
              Open objections <Icon name="arrow-right" />
            </a>
          </div>
          <div className="panel stack stack--md info-panel">
            <h3 className="cluster cluster--sm">
              <Icon name="trophy" />
              Seasons
            </h3>
            <p>
              {t("Seasons.SEASON")} each; your best 3 scores count once you
              record them, after the objection window. The top{" "}
              {String(c("Seasons.TOP"))} with{" "}
              {String(c("Seasons.MIN_POINTS"))}+ points share the season prize
              pot in {pair}, plus {tokenAmount(c("Seasons.BONUS_PER_SEASON"), s)}{" "}
              in each of the first{" "}
              {NUMBER_WORDS[n("Seasons.BONUS_SEASONS")] ??
                String(c("Seasons.BONUS_SEASONS"))}{" "}
              seasons. A place below {String(c("Seasons.MIN_POINTS"))} points
              rolls its {pair} into the next season
              {dead ? ", or after the last season into the buy wall," : ""} and
              its PLEA is burned. IMD seat holders earn{" "}
              {n("Seasons.SEAT_MULTIPLIER_BPS") / 10000}× points.
            </p>
            <a className="link-btn" href="#/seasons">
              See the season {String(BigInt(s?.v.displayedSeason || 0n) + 1n)}{" "}
              leaderboard <Icon name="arrow-right" />
            </a>
          </div>
          <div className="panel stack stack--md info-panel">
            <h3 className="cluster cluster--sm">
              <Icon name="hourglass" />
              The dead-man rule
            </h3>
            <p>
              The Cabal dies after {t("CabalGate.DEADMAN")} without a verdict.
              Then PLEA trades freely, forever. Every verdict, approved or
              denied, resets the clock.
            </p>
            {!val(s, "PleaHook.seeded") ? (
              <p>The clock starts when trading opens.</p>
            ) : dead ? (
              <p>The Cabal is dead.</p>
            ) : (
              <div className="cluster">
                <Countdown
                  until={dies}
                  label="Dies without a verdict in"
                  format="deadman"
                  ariaLabel={`The Cabal dies in ${deadmanWords(dies - now)} without a verdict`}
                />
              </div>
            )}
            <a
              className="link-btn"
              href={sourceLink("src/CabalGate.sol")}
            >
              Read the rule in the code <Icon name="arrow-square-out" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
export function ContractsPanel() {
  const { r, s } = useApp(),
    roles: Record<string, string> = {
      PLEA: "the token; transfers gated while the Cabal lives",
      CabalGate: "pleas, verdicts, appeals, sells and the dead-man",
      Seasons: "points, the leaderboard and payouts",
      PleaHook: "the pool’s fees, burns and buy wall",
      Letterbox: "letters and auto-sell",
      Tribunal: "objections and the second panel",
      PleaDistributor: "the 12% claim list",
      PleaLaunch: "the launch and the seed",
    };
  const x = site(),
    router = routerRow(x);
  const partners: [string | undefined, string | undefined, string?][] = [
    [s?.constants.pairSymbol, r.addresses.PairToken],
    ["imd/acc Stacker", val(s, "PleaHook.stacker")],
    ...(x.cashback.simd
      ? ([["sIMD (staked IMD)", x.cashback.simd, "the vault your cashback is staked in"]] as [string, string, string][])
      : []),
    ["identity.md seat NFT", val(s, "Seasons.seat"), x.seat.note || undefined],
    ["Uniswap v4 PoolManager", r.network.uniswapV4.poolManager],
    [router.name, x.trade.router, router.note],
    ...(x.trade.kind === "universalRouter"
      ? ([["Permit2", x.trade.permit2, "holds your approval for the router, for 30 minutes"]] as [string, string, string][])
      : []),
    ["IMD Intake v2", val(s, "CabalGate.intake")],
    ["delegate.xyz registry", x.delegateRegistry],
  ];
  return (
    <section className="section" id="contracts">
      <div className="section__head">
        <h2>Contracts</h2>
        <p className="meta">{x.contracts.meta}</p>
      </div>
      <div className="stack stack--lg">
        <Panel
          title="PLEA’s contracts"
          flush
          meta={
            x.contracts.launch ||
            (x.sourceCommit
              ? `Launch commit ${/^[0-9a-f]{40}$/i.test(x.sourceCommit) ? x.sourceCommit.slice(0, 7) : x.sourceCommit}`
              : x.name)
          }
        >
          <dl className="addr-list">
            {Object.entries(roles).map(([name, role]) => (
              <div key={name}>
                <dt>
                  <b>{name}</b>
                </dt>
                <dd>
                  <AddressView address={r.addresses[name]} label={name} />
                  <span className="meta">· {role}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="small">
            <a
              className="link-btn"
              href={`${x.source.repo}/tree/${x.source.ref}/src`}
              target="_blank"
              rel="noreferrer"
            >
              Read the source on the {x.source.ref} branch{" "}
              <Icon name="arrow-square-out" />
            </a>
          </p>
        </Panel>
        <Panel title="What PLEA works with" flush meta="Live today">
          <dl className="addr-list">
            {partners.map(
              ([name, address, note]) =>
                address &&
                name && (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>
                      <AddressView address={address} label={name} />
                      {note && <span className="meta">· {note}</span>}
                    </dd>
                  </div>
                ),
            )}
          </dl>
        </Panel>
        <Panel title="The owner’s powers, in plain words">
          <p>
            <b>One switch, add-only.</b> <code>PLEA.allow(account)</code> lets a
            sender move PLEA without a plea, permanently. Accounts can be added,
            never removed. It is for routers and the claim contract.
          </p>
          <p>
            <b>Nothing else.</b> The owner cannot change the fees, the judges,
            the rules or anyone’s pleas.
          </p>
          <p>
            <b>The owner does not play.</b> Its pleas earn no points, no prize
            and no bonus.
          </p>
          <p>The distributor’s owner sets the claim list’s root once.</p>
          <AddressView address={val(s, "PLEA.owner")} label="PLEA owner" />
        </Panel>
        {!val(s, "CabalGate.diedAt") && (
          <Notice
            kind="warn"
            title="While the Cabal lives you cannot sell without an approved plea."
          >
            <p>Only buy what you are happy to hold.</p>
          </Notice>
        )}
      </div>
    </section>
  );
}
