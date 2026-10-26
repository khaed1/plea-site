import { potFor } from "./models";
import { resetHealth } from "./config";
import { getAddress } from "viem";
import { Fragment, useState } from "react";
import { useAccount } from "wagmi";
import { useApp, useRead } from "./context";
import {
  con,
  read as chainRead,
  pct,
  countedPleas,
  blockTime,
  val,
  seasonState,
  tokenAmount,
  clock,
  span,
  short,
  getPlea,
  type Plea,
  amount,
  verdictSeason,
  plural,
  multiplierText,
  seatBracket,
  judgesRow,
} from "./chain";
import {
  closingCopy,
  noPleaText,
  projection as projectionText,
  roundingNote,
} from "./season-text";
import {
  Action,
  AddressView,
  Costs,
  Countdown,
  Empty,
  Icon,
  Notice,
  Panel,
  Title,
  TxButton,
} from "./components";
const equal = (a: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();
export function Seasons() {
  const { s, now } = useApp(),
    state = seasonState(s, now);
  return (
    <>
      <Title title={state ? `Season ${state.displayed + 1n}` : "Seasons"}>
        {state?.dead
          ? `Season ${state.displayed + 1n} ended at ${clock(state.current.bounds[2])}, when the Cabal died. No season ${state.displayed + 2n} follows: the leaderboard as it stands is the last one.`
          : s
            ? `${span(Number(con(s, "Seasons.SEASON")))}. Your best three approved pleas count, and the top ${con(s, "Seasons.TOP")} with at least ${con(s, "Seasons.MIN_POINTS")} points share the season prize pot and the PLEA bonus.`
            : "Reading the leaderboard from Seasons…"}
      </Title>
      {!s ? (
        <p className="loading-label">
          <Icon name="hourglass" />
          Reading the leaderboard from Seasons…
        </p>
      ) : !state ? (
        <Empty icon="trophy" title="No season has begun.">
          The first season begins when trading opens.
        </Empty>
      ) : (
        <>
          {state.awaitingAll.length > 1 && (
            <p>
              Seasons {String(state.awaitingAll[0] + 1n)} to{" "}
              {String(state.awaitingAll.at(-1)! + 1n)} wait to be closed, oldest
              first.
            </p>
          )}
          {state.awaiting !== undefined && state.awaiting < state.displayed && (
            <section className="section">
              <div className="section__head">
                <h2>Season {String(state.awaiting + 1n)} ended</h2>
                <span className="pill">Awaiting close</span>
              </div>
              <SeasonView season={state.awaiting} ended />
              {state.awaitingAll
                .filter((k) => k > state.awaiting! && k < state.displayed)
                .map((k) => (
                  <WaitingSeason key={String(k)} season={k} />
                ))}
            </section>
          )}
          <div className="pills">
            {state.dead ? (
              <span className="pill">
                {state.current.closed ? "Closed" : "Ended with the Cabal"}
              </span>
            ) : (
              <Countdown
                until={Number(state.current.bounds[2])}
                label={`Season ${state.displayed + 1n} ends in`}
              />
            )}
          </div>
          <SeasonView season={state.displayed} />
          {val(s, "Seasons.finished") && (
            <Panel level={2} title="No more seasons">
              <p>
                The Cabal is dead and every season is closed. Send the remaining
                prize assets to the buy wall; leftover PLEA bonuses are burned.
              </p>
              <TxButton
                connectText="Connect in the top bar to send leftovers to the buy wall."
                name="Seasons"
                fn="flushToWall"
                label="Send leftovers to the buy wall"
              />
            </Panel>
          )}
        </>
      )}
      <PastSeasons />
    </>
  );
}
function WaitingSeason({ season }: { season: bigint }) {
  const { r, s } = useApp(),
    { address } = useAccount(),
    [open, setOpen] = useState(false);
  const info = useRead(
    async () => {
      const [fees, excluded] = await Promise.all([
        chainRead(r, "Seasons", "seasonFees", [season]),
        address ? chainRead(r, "Seasons", "excluded", [address]) : false,
      ]);
      const candidates = s!.logs
        .filter(
          (l) =>
            l.eventName === "Verdict" &&
            l.args.approved &&
            !s!.logs.some(
              (x) => x.eventName === "Recorded" && x.args.pleaId === l.args.id,
            ),
        )
        .filter((l) =>
          s!.logs.some(
            (x) =>
              x.eventName === "PleaSubmitted" &&
              x.args.id === l.args.id &&
              equal(x.args.seller, address),
          ),
        );
      const own = (
        await Promise.all(
          candidates.map(async (l) => ({
            id: l.args.id,
            time: await blockTime(r, l.blockNumber),
          })),
        )
      ).filter(
        (l) =>
          verdictSeason(
            BigInt(l.time),
            BigInt(val(s, "CabalGate.startedAt")),
            BigInt(con(s, "Seasons.SEASON")),
          ) === season,
      );
      // Only pleas Seasons.record accepts, as SeasonBody's own list: not an excluded
      // seller's, not one with a sustained objection (Tribunal.standing) (S1).
      const standing = excluded
        ? []
        : await Promise.all(
            own.map((l) => chainRead(r, "Tribunal", "standing", [l.id])),
          );
      return {
        fees,
        own: excluded ? [] : own.filter((_, i) => !standing[i][1]),
      };
    },
    [season, address],
    !!s,
  );
  return (
    <details
      className="panel waiting-season"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        Season {String(season + 1n)} ended · Awaiting close · pot{" "}
        {tokenAmount(info.data?.fees, s, true)}
        {info.data?.own.length
          ? ` · your plea ${info.data.own.map((l) => `#${l.id}`).join(", ")} to record`
          : ""}
      </summary>
      {open && <SeasonView season={season} ended />}
    </details>
  );
}

function SeasonView({
  season,
  ended = false,
}: {
  season: bigint;
  ended?: boolean;
}) {
  const { r, s } = useApp(),
    known = s!.v.seasons[String(season)];
  const query = useRead(
    async () => {
      const [bounds, fees, top, closed] = await Promise.all(
        ["seasonBounds", "seasonFees", "topOf", "closed"].map((fn) =>
          chainRead(r, "Seasons", fn, [season]),
        ),
      );
      return {
        bounds,
        fees,
        top,
        closed,
        pot: potFor(
          fees,
          season,
          BigInt(val(s, "Seasons.nextToClose")),
          BigInt(val(s, "Seasons.rollover")),
        ),
      };
    },
    [season],
    !known,
  );
  const data = known || query.data;
  return data ? (
    <SeasonBody season={season} ended={ended} data={data} />
  ) : (
    <div aria-busy="true">
      <p className="loading-label">Reading season {String(season + 1n)}…</p>
      {query.error && <p role="alert">{query.error}</p>}
    </div>
  );
}
function SeasonBody({
  season,
  ended,
  data,
}: {
  season: bigint;
  ended: boolean;
  data: any;
}) {
  const { r, s, now, refresh } = useApp(),
    { address } = useAccount(),
    bounds = data.bounds,
    pot = BigInt(data.pot),
    top = data.top.filter((e: any) => !/^0x0{40}$/i.test(e.wallet));
  const last =
      !!val(s, "CabalGate.diedAt") && season === BigInt(s!.v.displayedSeason),
    level = ended ? 3 : 2;
  const minPoints = Number(con(s, "Seasons.MIN_POINTS")),
    bonus =
      season < BigInt(con(s, "Seasons.BONUS_SEASONS"))
        ? BigInt(con(s, "Seasons.BONUS_PER_SEASON"))
        : 0n,
    grace = Number(con(s, "Seasons.CLOSE_GRACE")),
    closeAt = Number(bounds[2]) + grace;
  const query = useRead(
    async () => {
      const rows = await Promise.all(
        top.map(async (e: any) => {
          const [name, best, seat, excluded] = await Promise.all([
            read("Letterbox", "nameOf", [e.wallet]),
            read("Seasons", "bestOf", [season, e.wallet]),
            read("Seasons", "holdsSeat", [e.wallet]),
            read("Seasons", "excluded", [e.wallet]),
          ]);
          return {
            ...e,
            name,
            best: [...best].sort((a, b) => Number(b) - Number(a)),
            seat,
            excluded,
          };
        }),
      );
      const [best, seatHeld] = address
        ? await Promise.all([
            read("Seasons", "bestOf", [season, address]),
            read("Seasons", "holdsSeat", [address]),
          ])
        : [[0, 0, 0], false];
      const eligibleLogs = s!.logs.filter(
        (l) => l.eventName === "Verdict" && l.args.approved,
      );
      const ids = eligibleLogs
        .filter(
          (l) =>
            !s!.logs.some(
              (x) => x.eventName === "Recorded" && x.args.pleaId === l.args.id,
            ),
        )
        .map((l) => l.args.id);
      const pleas = await Promise.all(ids.map((id) => getPlea(r, id, s!.logs)));
      const closeIds = pleas
        .filter(
          (p) =>
            seasonOf(p) === season &&
            !p.recorded &&
            !p.excluded &&
            !p.standing?.[1],
        )
        .map((p) => p.id);
      const own = pleas.filter(
        (p) =>
          equal(p.seller, address) &&
          !p.excluded &&
          !p.standing?.[1] &&
          seasonOf(p) === season,
      );
      return {
        rows,
        best: [...best].sort((a, b) => Number(b) - Number(a)),
        own,
        closeIds,
        seatHeld,
      };
    },
    [
      String(season),
      address,
      top.map((x: any) => x.wallet + ":" + x.points).join(","),
    ],
    !!s,
  );
  function read(name: string, fn: string, args: any[] = []) {
    return r.client.readContract({
      address: r.addresses[name],
      abi: r.abis[name],
      functionName: fn,
      args,
    }) as Promise<any>;
  }
  function seasonOf(p: Plea) {
    return verdictSeason(
      p.verdictAt,
      BigInt(val(s, "CabalGate.startedAt")),
      BigInt(con(s, "Seasons.SEASON")),
    );
  }
  const fundedTx = s!.logs
    .filter((l) => l.eventName === "PrizeFunded" && l.args.season === season)
    .map((l) => l.transactionHash);
  const deliveries = s!.logs.filter(
      (l) =>
        l.eventName === "Delivered" &&
        fundedTx.includes(l.transactionHash) &&
        l.args.fee > 0n,
    ),
    stakes = s!.logs.filter(
      (l) =>
        l.eventName === "StakeSettled" &&
        equal(l.args.to, r.addresses.Seasons) &&
        fundedTx.includes(l.transactionHash),
    );
  const autoFees = deliveries.reduce((n, l) => n + BigInt(l.args.fee), 0n),
    stakeFees = stakes.reduce((n, l) => n + BigInt(l.args.amount), 0n),
    rolled =
      season === BigInt(val(s, "Seasons.nextToClose"))
        ? BigInt(val(s, "Seasons.rollover"))
        : 0n;
  const rows = query.data?.rows || [],
    rank = rows.findIndex((e: any) => equal(e.wallet, address)),
    best = query.data?.best || [0, 0, 0],
    points = best.reduce((a: number, b: number) => a + Number(b), 0),
    share = rank >= 0 ? BigInt(s!.v.shares[rank]) : 0n,
    qualifies = rank >= 0 && points >= minPoints && !rows[rank]?.excluded;
  const qualifiesRows = rows.filter(
    (e: any) => !e.excluded && Number(e.points) >= minPoints,
  );
  const shares = rows.reduce(
      (n: bigint, e: any, i: number) =>
        n +
        (!e.excluded && Number(e.points) >= minPoints
          ? BigInt(s!.v.shares[i])
          : 0n),
      0n,
    ),
    paid = rows.reduce(
      (n: bigint, e: any, i: number) =>
        n +
        (!e.excluded && Number(e.points) >= minPoints
          ? (pot * BigInt(s!.v.shares[i])) / 10000n
          : 0n),
      0n,
    ),
    bonusPaid = rows.reduce(
      (n: bigint, e: any, i: number) =>
        n +
        (!e.excluded && Number(e.points) >= minPoints
          ? (bonus * BigInt(s!.v.shares[i])) / 10000n
          : 0n),
      0n,
    );
  const seatHeld = query.data?.seatHeld,
    // While the board cannot be read (loading or a read error), nothing below shows a number as
    // fact: Your standing and "If the season ended now" show the reading or error state (r2S-N2).
    board = !!query.data,
    mult = multiplierText(s),
    pair = s!.constants.pairSymbol;
  const sums = (values: number[]) =>
    values.join(" + ") + " = " + values.reduce((a, b) => a + Number(b), 0);
  // The judges' scores behind the points, × 1.2 only where Seasons multiplied (r2S-VN1).
  const counted = (wallet: string, values: number[]) =>
    countedPleas(s!, season, wallet, values);
  const line = `${minPoints}-point line · below it no prize: the ${pair} share ${last ? "goes to the buy wall" : `rolls over to season ${season + 2n}`}${bonus ? " and the PLEA bonus share is burned" : ""}`;
  const projection = (p: Plea) =>
    projectionText({
      best,
      points: Number(p.points || 0),
      others: rows
        .filter((e: any) => !equal(e.wallet, address))
        .map((e: any) => Number(e.points)),
      shares: s!.v.shares,
      pot,
      bonus,
      minPoints,
      top: Number(con(s, "Seasons.TOP")),
      s,
    });
  const nextToClose = BigInt(val(s, "Seasons.nextToClose")),
    ready = now >= closeAt && season === nextToClose,
    readError = (where: "above" | "below") => (
      <p className="small" role="status">
        Can’t read the leaderboard, so this is not shown. Use Try again{" "}
        {where === "above" ? "above" : "in the leaderboard below"}; your points
        are on the chain and not affected.
      </p>
    ),
    reading = (
      <div aria-busy="true">
        <p className="loading-label">
          <Icon name="hourglass" />
          Reading the leaderboard from Seasons…
        </p>
        <div className="skeleton" aria-hidden="true">
          <div className="skeleton__line skeleton__line--mid" />
          <div className="skeleton__line skeleton__line--short" />
        </div>
      </div>
    );
  return (
    <>
      <div className="grid season-summary form-actions-top">
        <Panel level={level} title="Ends" className="md-span-8 lg-span-4">
          <p className="stat__value">{clock(bounds[2])}</p>
          <Costs
            rows={[
              [
                "Left",
                bounds[3] ? (
                  "Ended"
                ) : (
                  <Countdown until={Number(bounds[2])} label="Ends in" />
                ),
              ],
              ["Started", clock(bounds[1])],
              ["Length", span(Number(con(s, "Seasons.SEASON")))],
              ["Grace after the end", span(grace)],
              ["Anyone can close it", `from ${clock(closeAt)}`],
            ]}
          />
        </Panel>
        <Panel
          level={level}
          title="Season prize pot"
          className="md-span-4 lg-span-4"
        >
          <p className="stat__value">
            <span className="nowrap">{tokenAmount(pot, s, true)}</span>
          </p>
          <Costs
            rows={[
              // The parts come from logs: with incomplete history only the chain's total shows (r2S-N1).
              ...(s!.historyError
                ? []
                : ([
                    [
                      `Trade fees (${Number(con(s, "PleaHook.PRIZE_BPS")) / 100}% of every trade)`,
                      tokenAmount(
                        BigInt(data.fees) - autoFees - stakeFees,
                        s,
                        true,
                      ),
                    ],
                    [
                      `Site auto-sell sales (${deliveries.length} × 0.35; letters pay none)`,
                      tokenAmount(autoFees, s, true),
                    ],
                    [
                      `Overruled stakes (${stakes.length} × 0.35)`,
                      tokenAmount(stakeFees, s, true),
                    ],
                  ] as [string, string][])),
              ...(rolled
                ? [
                    [
                      `Rolled over from season ${season}`,
                      tokenAmount(rolled, s, true),
                    ] as [string, string],
                  ]
                : []),
              ["Total", tokenAmount(pot, s, true), "total"],
            ]}
          />
          {s!.historyError && (
            <p className="small">
              The parts of the pot show once the history is read.
            </p>
          )}
          {season > BigInt(val(s, "Seasons.nextToClose")) && (
            <p className="small">
              Plus what season {String(season)} rolls over at its close.
            </p>
          )}
        </Panel>
        <Panel level={level} title="PLEA bonus" className="md-span-4 lg-span-4">
          <p className="stat__value">
            <span className="nowrap">{tokenAmount(bonus, s)}</span>
          </p>
          {bonus ? (
            <Costs
              rows={[
                [
                  "Season",
                  `${season + 1n} of ${con(s, "Seasons.BONUS_SEASONS")}`,
                ],
                [
                  "Paid to",
                  `top ${con(s, "Seasons.TOP")}, ${minPoints}+ points`,
                ],
                [
                  "Shares, as for the imdTEST",
                  `${pct(s!.v.shares[0])} to ${pct(s!.v.shares.at(-1))}`,
                ],
                ["Unpaid shares", "burned at the close"],
                ["From", "the 6% season bonus"],
              ]}
            />
          ) : (
            <p>
              The PLEA bonus ran in seasons 1 to{" "}
              {String(con(s, "Seasons.BONUS_SEASONS"))}.
            </p>
          )}
        </Panel>
      </div>
      <div className="split split--stretch form-actions-top">
        <Panel card level={level} title="Your standing">
          {!address ? (
            <Notice title="Connect in the top bar to see your rank.">
              <p>
                The leaderboard, the season prize pot and past seasons read
                without a wallet.
              </p>
            </Notice>
          ) : query.error ? (
            readError("below")
          ) : !board ? (
            reading
          ) : (
            <>
              <div className="cluster standing">
                <div className="stat">
                  <span className="stat__label">Rank</span>
                  <span className="stat__value">
                    {rank >= 0 ? rank + 1 : "none yet"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat__label">Points</span>
                  <span className="stat__value">{points}</span>
                  <span className="stat__note">
                    {minPoints} to share the season prize pot
                  </span>
                </div>
                {rank >= 0 && (
                  <div className="stat">
                    <span className="stat__label">Prize now</span>
                    <span className="stat__value">
                      {tokenAmount(
                        qualifies ? (pot * share) / 10000n : 0n,
                        s,
                        true,
                      )}
                    </span>
                    <span className="stat__note">
                      +{" "}
                      {tokenAmount(
                        qualifies ? (bonus * share) / 10000n : 0n,
                        s,
                      )}
                    </span>
                  </div>
                )}
              </div>
              {/* The band "no recorded plea" has no costs: only the sentence below (r2S-N7). */}
              {(points > 0 || rank >= 0) && (
                <Costs
                  rows={[
                    ["Best three", sums(best)],
                    ...(points > 0 && judgesRow(counted(address, best), mult)
                      ? [judgesRow(counted(address, best), mult)!]
                      : []),
                    ...(rank >= 0
                      ? ([
                          [
                            "Share at rank " + (rank + 1),
                            qualifies
                              ? pct(share)
                              : `no prize (${points} of ${minPoints})`,
                          ],
                        ] as [string, string][])
                      : []),
                  ]}
                />
              )}
              {query.data?.own.map((p: Plea) => {
                const until = Math.max(
                  Number(p.verdictAt) +
                    Number(con(s, "Tribunal.OBJECTION_WINDOW")),
                  ...(p.objections || [])
                    .filter((o) => o.ruling === 1)
                    .map(
                      (o) =>
                        Number(o.filedAt) +
                        Number(con(s, "Tribunal.PENDING_EXPIRY")),
                    ),
                );
                return (
                  <div className="stack" key={String(p.id)}>
                    <p>
                      <a href={`#/p/${p.id}`}>Plea #{String(p.id)}</a> · +
                      {p.points} points
                    </p>
                    {data.closed ? (
                      <p>
                        Season {season + 1n} is closed; these points were not
                        recorded.
                      </p>
                    ) : (
                      p.standing?.[0] && (
                        <>
                          <Notice
                            title={`Plea #${p.id}’s +${p.points} points are held until ${clock(until)}.`}
                          >
                            <p>{projection(p)}</p>
                          </Notice>
                          <div>
                            <Countdown
                              until={until}
                              label="Objections close in"
                            />
                          </div>
                        </>
                      )
                    )}
                    {!data.closed && (
                      <TxButton
                        name="Seasons"
                        fn="record"
                        args={[p.id]}
                        label="Record my points"
                        srLabel={` for plea #${p.id}`}
                        connectText="Connect in the top bar to record points."
                        disabled={!!p.standing?.[0] || data.closed}
                        reason={
                          p.standing?.[0]
                            ? `Record your +${p.points} points after ${clock(until)}, when objections on plea #${p.id} close. Nothing records them by itself: anyone can press Record my points.`
                            : `Objections on plea #${p.id} closed. Anyone can record a plea’s points; nothing records them by itself.`
                        }
                      />
                    )}
                  </div>
                );
              })}
              {!points && !query.data?.own.length && (
                <>
                  <p className="small">
                    {noPleaText({
                      season,
                      ended: ended || !!bounds[3],
                      last,
                      dead: !!val(s, "CabalGate.diedAt"),
                      current: BigInt(s!.v.displayedSeason),
                      minPoints,
                      mult,
                    })}
                  </p>
                  {/* Only a running season invites a plea (r2S-N7). */}
                  {!ended && !bounds[3] && !last && (
                    <div>
                      <a className="btn btn--sm" href="#/plead">
                        Write a plea
                      </a>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Panel>
        {!ended && (
          <Panel level={2} title="The seat multiplier" id="seat">
            <p>
              Hold an IMD seat NFT when your plea is recorded and its points are
              the judges’ score <span className="nowrap">× {mult}</span>,
              rounded down.
            </p>
            <Costs
              rows={[
                [
                  "Score 36, with a seat",
                  String(
                    Math.floor(
                      (36 * Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS"))) /
                        10000,
                    ),
                  ) + " points",
                ],
                [
                  "Score 45, with a seat",
                  String(
                    Math.floor(
                      (45 * Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS"))) /
                        10000,
                    ),
                  ) + " points",
                ],
                ["Score 36, no seat", "36 points"],
              ]}
            />
            <p className="small">
              One seat or ten, the same. Points only: the judges’ score, your
              need and the {minPoints}-point bar don’t change. The leaderboard
              shows a seat holder’s judges’ scores in brackets.
            </p>
            <div className="stack stack--sm">
              <p className="label">Seat NFT · identity.md</p>
              <AddressView
                address={val(s, "Seasons.seat")}
                label="identity.md seat NFT"
                shortDisplay
              />
            </div>
            {seatHeld && (
              <Notice
                kind="ok"
                icon="check-circle"
                title={`Seat held: every recorded plea earns × ${mult}.`}
              />
            )}
          </Panel>
        )}
      </div>
      <section className="section">
        <div
          className="panel panel--flush"
          aria-busy={!query.error && query.loading ? true : undefined}
        >
          <div className="panel__head">
            {ended ? (
              <h3>Season {String(season + 1n)} leaderboard</h3>
            ) : (
              <h2>Season {String(season + 1n)} leaderboard</h2>
            )}
            <p className="meta">
              Season prize pot {tokenAmount(pot, s, true)} +{" "}
              {tokenAmount(bonus, s)} · top {String(con(s, "Seasons.TOP"))} with{" "}
              {minPoints}+ points
            </p>
          </div>
          {query.error ? (
            <div className="panel__body">
              <div className="error-box" role="alert">
                <p className="error-box__title">
                  <Icon name="plugs" />
                  Can’t read the leaderboard
                </p>
                <p className="small">
                  The public RPC did not answer. The site tries the next one by
                  itself; your points are on the chain and not affected.
                </p>
                <div className="btn-row">
                  <button
                    className="btn btn--sm"
                    onClick={() => {
                      resetHealth();
                      void refresh();
                    }}
                  >
                    <Icon name="arrow-clockwise" />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : query.loading ? (
            <div className="panel__body stack">
              <p className="loading-label">
                <Icon name="hourglass" />
                Reading the leaderboard from Seasons…
              </p>
              <div className="skeleton" aria-hidden="true">
                {["", "--mid", "", "--mid", "", "--short"].map((v, i) => (
                  <div
                    key={i}
                    className={
                      v ? `skeleton__line skeleton__line${v}` : "skeleton__line"
                    }
                  />
                ))}
              </div>
            </div>
          ) : !top.length ? (
            <Empty
              icon="trophy"
              title={bounds[3] || last ? "No points" : "No points yet"}
              action={
                !bounds[3] && !last
                  ? { href: "#/plead", label: "Write a plea" }
                  : undefined
              }
            >
              {bounds[3] || last
                ? `No plea is recorded in season ${season + 1n}. Approved pleas of season ${season + 1n} can be recorded until it closes; the close records any that nobody recorded.`
                : `Season ${season + 1n} has begun. The first approved plea to be recorded takes rank 1${season ? `; its season prize pot starts with what season ${season} rolled over` : ""}. The gavel is polished and waiting.`}
            </Empty>
          ) : (
            <ol className="lb" aria-label={`Season ${season + 1n} leaderboard`}>
              <li className="lb__head" aria-hidden="true">
                <span className="lb__rank">Rank</span>
                <span className="lb__who">Player</span>
                <span className="lb__best">Best three</span>
                <span className="lb__pts">Points</span>
                <span className="lb__prize">Prize now</span>
              </li>
              {rows.map((e: any, i: number) => {
                const qualified = !e.excluded && Number(e.points) >= minPoints,
                  bps = BigInt(s!.v.shares[i]);
                return (
                  <Fragment key={e.wallet}>
                    {i === qualifiesRows.length && (
                      <li className="lb__bar">{line}</li>
                    )}
                    <li
                      className={`lb__row ${!qualified ? "lb__row--out" : ""} ${equal(e.wallet, address) ? "lb__row--you" : ""}`}
                    >
                      <span className="lb__rank">
                        <span className="sr-only">Rank </span>
                        {i + 1}
                      </span>
                      <span className="lb__who">
                        <a
                          href={`#/profile/${e.wallet}`}
                          className={!e.name ? "mono" : ""}
                        >
                          {e.name || short(e.wallet)}
                        </a>
                        {e.seat && (
                          <span className="badge badge--seat">
                            SEAT ×{mult}
                          </span>
                        )}
                        {equal(e.wallet, address) && (
                          <span className="badge badge--you">YOU</span>
                        )}
                      </span>
                      <span className="lb__best">
                        <span className="lb__label">Best three </span>
                        {e.best.filter(Number).join(" · ")}
                        {(() => {
                          const bracket = seatBracket(
                            counted(e.wallet, e.best),
                            mult,
                          );
                          return bracket ? (
                            <>
                              {" "}
                              <span className="seatx nowrap">({bracket})</span>
                            </>
                          ) : null;
                        })()}
                      </span>
                      <span className="lb__pts">
                        <span className="lb__label">Points </span>
                        {e.points}
                      </span>
                      <span className="lb__prize">
                        <span className="lb__label">Prize now </span>
                        {qualified ? (
                          <>
                            <span className="nowrap">
                              {tokenAmount((pot * bps) / 10000n, s, true)}
                            </span>{" "}
                            +{" "}
                            <span className="nowrap">
                              {tokenAmount((bonus * bps) / 10000n, s)}
                            </span>
                          </>
                        ) : (
                          <>
                            no prize{" "}
                            <span className="nowrap">
                              ({String(e.points)} of {minPoints})
                            </span>
                          </>
                        )}
                      </span>
                    </li>
                  </Fragment>
                );
              })}
              {rows.length > 0 && qualifiesRows.length === rows.length && (
                <li className="lb__bar">{line}</li>
              )}
            </ol>
          )}
          <p className="panel__foot">
            Equal points: the wallet whose newest counted plea is older ranks
            higher. Seat holders’ judges’ scores are in brackets (each × 1.2,
            rounded down).
          </p>
        </div>
        <div className="split split--even split--stretch form-actions-top">
          <Panel
            level={ended ? 4 : 3}
            title="If the season ended now"
            className="panel--sunken"
          >
            {query.error ? (
              readError("above")
            ) : !board ? (
              reading
            ) : (
              <>
                <Costs
                  rows={[
                    [
                      `Paid to ${plural(qualifiesRows.length, "wallet")}`,
                      `${pct(shares)} · ${tokenAmount(paid, s, true)}`,
                    ],
                    [
                      last
                        ? "Left for the buy wall"
                        : `Rolls over to season ${season + 2n}`,
                      `${pct(10000n - shares)} · ${tokenAmount(pot - paid, s, true)}`,
                    ],
                    ["PLEA bonus paid", tokenAmount(bonusPaid, s)],
                    ["PLEA bonus burned", tokenAmount(bonus - bonusPaid, s)],
                  ]}
                />
                <p className="small text-2">
                  {roundingNote(pair, qualifiesRows.length)}
                </p>
              </>
            )}
          </Panel>
          <Panel level={ended ? 4 : 3} title="Closing the season">
            {data.closed ? (
              <p>Season {String(season + 1n)} is closed.</p>
            ) : (
              <>
                <p className="small">
                  {closingCopy({
                    season,
                    ready,
                    last,
                    bonus: bonus > 0n,
                    top: con(s, "Seasons.TOP"),
                    minPoints,
                    pair,
                  })}
                </p>
                <TxButton
                  connectText="Connect in the top bar to close the season."
                  name="Seasons"
                  fn="closeSeason"
                  resetKey={`close:${season}`}
                  args={[query.data?.closeIds || []]}
                  label={`Close season ${season + 1n}`}
                  disabled={
                    now < closeAt ||
                    !bounds[0] ||
                    season !== nextToClose ||
                    !query.data
                  }
                  reason={
                    now < closeAt
                      ? `Anyone can close it from ${clock(closeAt)} (${span(grace, "adj")} grace).`
                      : season !== nextToClose
                        ? "Close the oldest season first."
                        : query.error
                          ? "Can’t read the leaderboard, so the pleas the close records are not known. Use Try again above."
                          : !query.data
                            ? "Reading the leaderboard from Seasons…"
                            : undefined
                  }
                />
              </>
            )}
          </Panel>
        </div>
      </section>
    </>
  );
}
function PastSeasons() {
  const { r, s } = useApp(),
    { address } = useAccount(),
    // The closed seasons come from the chain (seasons 0 to nextToClose − 1 are closed, oldest first),
    // so a gap in history never reads as "no season has closed". Each one's pot, prizes and closing
    // transaction come from its SeasonClosedOut log, when history has it (r2S-N1).
    closedCount = Number(val(s, "Seasons.nextToClose") || 0n),
    seasons = Array.from({ length: closedCount }, (_, i) =>
      BigInt(closedCount - 1 - i),
    ),
    logOf = (k: bigint) =>
      s?.logs.find(
        (l) => l.eventName === "SeasonClosedOut" && BigInt(l.args.season) === k,
      ),
    logged = seasons.filter((k) => logOf(k)).length;
  const details = useRead(
    () =>
      Promise.all(
        seasons.map(async (k) => {
          const l = logOf(k);
          const [block, tx, bounds, top] = await Promise.all([
            l ? r.client.getBlock({ blockNumber: l.blockNumber }) : undefined,
            l
              ? r.client.getTransaction({ hash: l.transactionHash })
              : undefined,
            chainRead(r, "Seasons", "seasonBounds", [k]),
            chainRead(r, "Seasons", "topOf", [k]),
          ]);
          const names = Object.fromEntries(
            await Promise.all(
              (top as any[])
                .filter((e: any) => !/^0x0{40}$/i.test(e.wallet))
                .map(async (e: any) => [
                  e.wallet,
                  await chainRead(r, "Letterbox", "nameOf", [e.wallet]),
                ]),
            ),
          );
          return { k, l, block, tx, bounds, top, names };
        }),
      ),
    [closedCount, logged],
    !!s && closedCount > 0,
  );
  const minPoints = Number(con(s, "Seasons.MIN_POINTS"));
  return (
    <section className="section">
      <div className="section__head">
        <h2>Past seasons</h2>
      </div>
      {!closedCount ? (
        <p>No seasons have closed in this test run.</p>
      ) : details.error && !details.data ? (
        <p className="small" role="status">
          Can’t read the past seasons right now. The site tries again with the
          next refresh.
        </p>
      ) : !details.data ? (
        <p className="loading-label">
          <Icon name="hourglass" />
          Reading past seasons…
        </p>
      ) : (
        details.data.map(({ k, l, block, tx, bounds, top, names }: any) => {
          const prizes = s!.logs.filter(
              (e) => e.eventName === "PrizePaid" && BigInt(e.args.season) === k,
            ),
            bonuses = s!.logs.filter(
              (e) => e.eventName === "BonusPaid" && BigInt(e.args.season) === k,
            ),
            burn =
              s!.logs.find(
                (e) =>
                  e.eventName === "BonusBurned" && BigInt(e.args.season) === k,
              )?.args.amount || 0n;
          const selected = top
            .map((e: any, i: number) => ({ ...e, rank: i + 1 }))
            .filter(
              (e: any) =>
                !/^0x0{40}$/i.test(e.wallet) &&
                (e.rank <= 3 || equal(e.wallet, address)),
            );
          return (
            <article className="panel stack" key={String(k)}>
              <div className="cluster cluster--between">
                <h3>Season {Number(k) + 1}</h3>
                <span className="pill">Closed</span>
              </div>
              <p className="meta">
                <span className="nowrap">{clock(bounds[1])}</span> to{" "}
                <span className="nowrap">{clock(bounds[2])}.</span>
                {l && block && tx && (
                  <>
                    {" "}
                    Closed{" "}
                    <a href={`${r.network.explorer}/tx/${l.transactionHash}`}>
                      {clock(block.timestamp)}
                    </a>{" "}
                    by{" "}
                    <span className="mono nowrap">
                      {short(getAddress(tx.from))}
                    </span>
                    .
                  </>
                )}
              </p>
              {!l ? (
                // History is incomplete: the season is closed (chain), but its pot and prizes are
                // in logs this page could not read. Leave them out rather than guess.
                <p className="small">
                  Its season prize pot, prizes and closing transaction are in
                  history this page could not read yet. They show once the
                  history is read.
                </p>
              ) : (
                <div className="split split--even">
                  <div className="stack stack--sm">
                    <p className="label">Season prize pot and bonus</p>
                    <Costs
                      rows={[
                        ["Season prize pot", tokenAmount(l.args.pot, s, true)],
                        [
                          `Paid to ${plural(prizes.length, "wallet")}`,
                          tokenAmount(l.args.paid, s, true),
                        ],
                        [
                          val(s, "CabalGate.diedAt") &&
                          k === BigInt(s!.v.displayedSeason)
                            ? "Left for the buy wall"
                            : `Rolled over to season ${Number(k) + 2}`,
                          tokenAmount(
                            BigInt(l.args.pot) - BigInt(l.args.paid),
                            s,
                            true,
                          ),
                        ],
                        [
                          "PLEA bonus paid",
                          tokenAmount(
                            bonuses.reduce(
                              (n, e) => n + BigInt(e.args.amount),
                              0n,
                            ),
                            s,
                          ),
                        ],
                        ["PLEA bonus burned", tokenAmount(burn, s)],
                      ]}
                    />
                    <p className="small text-2">
                      Each {s!.constants.pairSymbol} amount is rounded down on
                      its own, as the chain pays and prints it, so parts and
                      totals can differ by a cent.
                    </p>
                  </div>
                  <div className="stack stack--sm">
                    {selected.length ? (
                      <>
                        <p className="label">Top three, and you</p>
                        <Costs
                          rows={selected.map((e: any) => [
                            <span>
                              <span className="nowrap">
                                {e.rank} ·{" "}
                                <a
                                  className={names[e.wallet] ? "" : "mono"}
                                  href={`#/profile/${e.wallet}`}
                                >
                                  {names[e.wallet] || short(e.wallet)}
                                </a>
                                {equal(e.wallet, address) ? " (you)" : ""},
                              </span>{" "}
                              <span className="nowrap">
                                {String(e.points)} points
                              </span>
                            </span>,
                            Number(e.points) >= minPoints ? (
                              <>
                                <span className="nowrap">
                                  {tokenAmount(
                                    prizes.find((p) =>
                                      equal(p.args.wallet, e.wallet),
                                    )?.args.amount || 0n,
                                    s,
                                    true,
                                  )}
                                </span>{" "}
                                <span className="nowrap">
                                  +{" "}
                                  {tokenAmount(
                                    bonuses.find((b) =>
                                      equal(b.args.wallet, e.wallet),
                                    )?.args.amount || 0n,
                                    s,
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                no prize{" "}
                                <span className="nowrap">
                                  ({String(e.points)} of {minPoints})
                                </span>
                              </>
                            ),
                          ])}
                        />
                      </>
                    ) : (
                      <p>No plea was recorded in season {Number(k) + 1}.</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
