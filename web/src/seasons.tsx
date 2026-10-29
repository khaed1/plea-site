import { soFar } from "./site";
import {
  potFor,
  carriedRollover,
  closeBoard,
  closePayout,
  standingOn,
  LETTERBOX,
} from "./models";
import { resetHealth, type Runtime } from "./config";
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
  smallAmount,
  clock,
  span,
  short,
  getPlea,
  type Plea,
  type Snapshot,
  amount,
  verdictSeason,
  plural,
  multiplierText,
  seatBracket,
  judgesRow,
  pointsHeld,
  nameOf,
  seasonRecords,
} from "./chain";
import {
  atClose,
  closeCounts,
  closingCopy,
  flushCopy,
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
          {val(s, "Seasons.finished") && <Leftovers />}
        </>
      )}
      <PastSeasons />
    </>
  );
}
/** After the death and the last close: flushToWall while Seasons still holds something, then
 * what it sent (flushCopy). */
function Leftovers() {
  const { r, s } = useApp(),
    pleaLeft = useRead(
      () => chainRead(r, "PLEA", "balanceOf", [r.addresses.Seasons]),
      [],
      !!s,
    ),
    log = (n: string) =>
      s!.logs.find(
        (l) =>
          l.eventName === n &&
          (n !== "BonusBurned" ||
            BigInt(l.args.season) === BigInt(val(s, "Seasons.nextToClose"))),
      )?.args.amount,
    copy = flushCopy({
      pot: BigInt(val(s, "Seasons.pot") || 0n),
      pleaLeft: pleaLeft.data === undefined ? undefined : BigInt(pleaLeft.data),
      last: BigInt(s!.v.displayedSeason),
      bonusSeasons: BigInt(con(s, "Seasons.BONUS_SEASONS")),
      flushed: { toWall: log("LeftoverToWall"), burned: log("BonusBurned") },
      s,
    });
  return (
    <Panel level={2} title="No more seasons">
      <p className="small">{copy.text}</p>
      {copy.offer && (
        <TxButton
          connectText="Connect in the top bar to send leftovers to the buy wall."
          name="Seasons"
          fn="flushToWall"
          label="Send leftovers to the buy wall"
        />
      )}
    </Panel>
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
  // The pot as the details show it: its fees and, estimated, what the earlier closes roll in.
  const carry = useCarry(season),
    estimated = season > BigInt(val(s, "Seasons.nextToClose"));
  return (
    <details
      className="panel waiting-season"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        Season {String(season + 1n)} ended · Awaiting close · pot{" "}
        {tokenAmount(
          info.data?.fees === undefined
            ? undefined
            : BigInt(info.data.fees) + BigInt(carry.data ?? 0n),
          s,
          true,
        )}
        {estimated ? ", estimated" : ""}
        {info.data?.own.length
          ? ` · your plea ${info.data.own.map((l) => `#${l.id}`).join(", ")} to record`
          : ""}
      </summary>
      {open && <SeasonView season={season} ended />}
    </details>
  );
}

/** The approved pleas no Recorded log names, read from the chain (getPlea). */
const unrecorded = (r: Runtime, s: Snapshot) =>
  Promise.all(
    s.logs
      .filter(
        (l) =>
          l.eventName === "Verdict" &&
          l.args.approved &&
          !s.logs.some((x) => x.eventName === "Recorded" && x.args.pleaId === l.args.id),
      )
      .map((l) => getPlea(r, l.args.id, s.logs)),
  );
const pleaSeason = (p: Plea, s: Snapshot) =>
  verdictSeason(
    p.verdictAt,
    BigInt(val(s, "CabalGate.startedAt")),
    BigInt(con(s, "Seasons.SEASON")),
  );
/** What closeSeason records first (_tryRecord), and the close is sent with: the season's approvals
 * nobody recorded, not an excluded seller's, with no sustained objection. */
const closingPleas = (pleas: Plea[], s: Snapshot, season: bigint) =>
  pleas.filter(
    (p) =>
      pleaSeason(p, s) === season &&
      !p.recorded &&
      !p.excluded &&
      !p.standing?.[1],
  );
/** What the waiting seasons before `season` roll into it at their closes, which come first
 * (Seasons.nextToClose): estimated from their boards as they stand plus the approvals each close
 * records first (closeBoard, carriedRollover). Not read for
 * nextToClose itself, whose rollover is Seasons.rollover. */
function useCarry(season: bigint) {
  const { r, s } = useApp(),
    next = BigInt(val(s, "Seasons.nextToClose") ?? 0n),
    minPoints = Number(con(s, "Seasons.MIN_POINTS"));
  return useRead(
    async () => {
      const pleas = s!.historyError ? [] : await unrecorded(r, s!);
      const waiting = await Promise.all(
        Array.from({ length: Number(season - next) }, async (_, i) => {
          const j = next + BigInt(i);
          const [fees, top] = await Promise.all([
            chainRead(r, "Seasons", "seasonFees", [j]),
            chainRead(r, "Seasons", "topOf", [j]),
          ]);
          const entries = (top as any[]).filter(
            (e) => !/^0x0{40}$/i.test(e.wallet),
          );
          const excluded = await Promise.all(
            entries.map((e) => chainRead(r, "Seasons", "excluded", [e.wallet])),
          );
          // Each close records its season's approvals nobody recorded first (closeBoard).
          const board = closeBoard(
            entries.map((e) => ({ wallet: e.wallet, points: Number(e.points), pleaId: BigInt(e.pleaId) })),
            seasonRecords(s!, j),
            closingPleas(pleas, s!, j).map((p) => ({ id: p.id, seller: p.seller, points: Number(p.points || 0) })),
            Number(con(s, "Seasons.TOP")),
          );
          return {
            fees: BigInt(fees),
            paidBps: closePayout(board, {
              shares: s!.v.shares,
              pot: 0n,
              bonus: 0n,
              minPoints,
              excluded: (w) => entries.some((e, k) => equal(e.wallet, w) && excluded[k]),
            }).paidBps,
          };
        }),
      );
      return carriedRollover(BigInt(val(s, "Seasons.rollover")), waiting);
    },
    [String(season), String(next)],
    !!s && season > next,
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
  const next = BigInt(val(s, "Seasons.nextToClose")),
    carry = useCarry(season);
  return data ? (
    <SeasonBody
      season={season}
      ended={ended}
      data={data}
      carry={season > next && !data.closed ? carry : undefined}
    />
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
  carry,
}: {
  season: bigint;
  ended: boolean;
  data: any;
  carry?: { data?: bigint; error: string; loading: boolean };
}) {
  const { r, s, now, refresh } = useApp(),
    { address } = useAccount(),
    bounds = data.bounds,
    // A closed season shows what its close took in and paid (SeasonClosedOut, PrizePaid), as Past
    // seasons does: closeSeason deleted its seasonFees and moved the rollover on.
    closedLog = data.closed
      ? s!.logs.find(
          (l) =>
            l.eventName === "SeasonClosedOut" && BigInt(l.args.season) === season,
        )
      : undefined,
    carried = carry?.data === undefined ? 0n : BigInt(carry.data),
    pot = data.closed
      ? BigInt(closedLog?.args.pot ?? 0n)
      : BigInt(data.pot) + carried,
    top = data.top.filter((e: any) => !/^0x0{40}$/i.test(e.wallet));
  const paidTo = (wallet: string, kind = "PrizePaid") =>
    BigInt(
      s!.logs.find(
        (l) =>
          l.eventName === kind &&
          BigInt(l.args.season) === season &&
          equal(l.args.wallet, wallet),
      )?.args.amount ?? 0n,
    );
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
  // Who closed a closed season, and when: the Ends panel says so, as Past seasons does.
  const closer = useRead(
    async () => {
      const [time, tx] = await Promise.all([
        blockTime(r, closedLog!.blockNumber),
        r.client.getTransaction({ hash: closedLog!.transactionHash }),
      ]);
      const name = await nameOf(r, tx.from).catch(() => "");
      return { time, from: tx.from, name };
    },
    [closedLog?.transactionHash],
    !!closedLog,
  );
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
      const [best, seatHeld, ownExcluded] = address
        ? await Promise.all([
            read("Seasons", "bestOf", [season, address]),
            read("Seasons", "holdsSeat", [address]),
            read("Seasons", "excluded", [address]),
          ])
        : [[0, 0, 0], false, false];
      const pleas = await unrecorded(r, s!),
        closing = closingPleas(pleas, s!, season);
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
        closing,
        seatHeld,
        ownExcluded,
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
  const seasonOf = (p: Plea) => pleaSeason(p, s!);
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
  // What the close pays: the board after it records the approvals nobody recorded (closeSeason's
  // _tryRecord: each at its points now, into the seller's best three), the owner's rank paid to no
  // one, the top TOP at MIN_POINTS+ by rank. With incomplete history those approvals and the best
  // three they join are not known: the recorded board alone.
  const closing: Plea[] = s!.historyError ? [] : query.data?.closing || [],
    excluded = (w: string) => rows.some((e: any) => equal(e.wallet, w) && e.excluded),
    closeRows = closeBoard(
      rows.map((e: any) => ({
        wallet: e.wallet,
        points: Number(e.points),
        pleaId: BigInt(e.pleaId),
      })),
      seasonRecords(s!, season),
      closing.map((p) => ({ id: p.id, seller: p.seller, points: Number(p.points || 0) })),
      Number(con(s, "Seasons.TOP")),
    ),
    {
      wallets: paidWallets,
      bps: shares,
      paid,
      bonusPaid,
    } = closePayout(closeRows, {
      shares: s!.v.shares,
      pot,
      bonus,
      minPoints,
      excluded,
    });
  // An ended season that is not closed: Your standing's prize is what its close pays, on the same
  // board as "What the close pays" (the approvals nobody recorded counted), not the recorded board's
  // (R1). A running season's Prize now stays the recorded board's, as the leaderboard shows it.
  const closes = !data.closed && (ended || !!bounds[3] || last),
    // An ended season's close records the approvals nobody recorded first (Seasons._tryRecord), so its
    // recorded board is not what the close pays: the board's figures say "recorded" then (NEW-1, round 2).
    recordedOnly = closes && closing.length > 0,
    you = standingOn(closeRows, address, {
      shares: s!.v.shares,
      pot,
      bonus,
      minPoints,
      excluded,
    });
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
      others: (closes ? closeRows : rows)
        .filter((e: any) => !equal(e.wallet, address))
        .map((e: any) => Number(e.points)),
      shares: s!.v.shares,
      pot,
      bonus,
      minPoints,
      top: Number(con(s, "Seasons.TOP")),
      s,
      ended: closes,
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
              data.closed
                ? [
                    "Closed",
                    closer.data ? (
                      <>
                        <a
                          href={`${r.network.explorer}/tx/${closedLog!.transactionHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {clock(closer.data.time)}
                        </a>{" "}
                        by{" "}
                        <span className={closer.data.name ? "nowrap" : "mono nowrap"}>
                          {closer.data.name || short(getAddress(closer.data.from))}
                        </span>
                      </>
                    ) : closedLog ? (
                      closer.error ? (
                        "Closed"
                      ) : (
                        "Reading…"
                      )
                    ) : (
                      "Closed; the closing transaction shows once the history is read"
                    ),
                  ]
                : ["Anyone can close it", `from ${clock(closeAt)}`],
            ]}
          />
        </Panel>
        <Panel
          level={level}
          title="Season prize pot"
          className="md-span-4 lg-span-4"
        >
          <p className="stat__value">
            <span className="nowrap">
              {data.closed && !closedLog
                ? "—"
                : data.closed
                  ? smallAmount(pot, s)
                  : tokenAmount(pot, s, true)}
            </span>
          </p>
          <Costs
            rows={
              data.closed
                ? closedLog
                  ? [
                      [
                        `Paid to ${plural(
                          s!.logs.filter(
                            (l) =>
                              l.eventName === "PrizePaid" &&
                              BigInt(l.args.season) === season,
                          ).length,
                          "wallet",
                        )}`,
                        smallAmount(BigInt(closedLog.args.paid), s),
                      ],
                      [
                        last ? "Left for the buy wall" : `Rolled over to season ${season + 2n}`,
                        smallAmount(
                          BigInt(closedLog.args.pot) - BigInt(closedLog.args.paid),
                          s,
                        ),
                      ],
                      ["Total, at the close", smallAmount(pot, s), "total"],
                    ]
                  : [["What the close paid", "Shows once the history is read"]]
                : [
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
                      // Letterbox.AUTO_SELL_FEE is internal (pinned in models.ts); the stake is Tribunal.STAKE (r2D-N9).
                      `Site auto-sell sales (${deliveries.length} × ${amount(LETTERBOX.AUTO_SELL_FEE, s!.constants.pairDecimals ?? 18, 2)}; letters pay none)`,
                      tokenAmount(autoFees, s, true),
                    ],
                    [
                      `Overruled stakes (${stakes.length} × ${amount(BigInt(con(s, "Tribunal.STAKE")), s!.constants.pairDecimals ?? 18, 2)})`,
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
              // Earlier waiting seasons close first and roll their unpaid part in (carriedRollover).
              ...(carry
                ? [
                    [
                      `From season ${season}’s close, estimated`,
                      carry.data !== undefined
                        ? tokenAmount(carried, s, true)
                        : carry.error
                          ? "Can’t read yet"
                          : "Reading…",
                    ] as [string, string],
                  ]
                : []),
              [
                carry ? "Total, estimated" : "Total",
                tokenAmount(pot, s, true),
                "total",
              ],
            ]}
          />
          {s!.historyError && !data.closed && (
            <p className="small">
              The parts of the pot show once the history is read.
            </p>
          )}
          {carry && (
            <p className="small">
              Season {String(season)} closes first and rolls over what its
              leaderboard leaves unpaid; the estimate counts the leaderboards
              as they stand and the approvals each close records first.
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
                  `Shares, as for the ${s?.constants.pairSymbol}`,
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
          ) : query.data?.ownExcluded ? (
            // The owner never ranks or earns (Seasons.excluded, record's OwnerExcluded, _dropOwner):
            // no rank, points, bar or season pitch, only the line that says so (L1).
            <p className="small">
              {noPleaText({
                excluded: true,
                season,
                ended: ended || !!bounds[3],
                last,
                minPoints,
                mult,
              })}
            </p>
          ) : (
            <>
              <div className="cluster standing">
                <div className="stat">
                  <span className="stat__label">
                    {recordedOnly ? "Recorded rank" : "Rank"}
                  </span>
                  <span className="stat__value">
                    {rank >= 0 ? rank + 1 : closes ? "none" : "none yet"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat__label">
                    {recordedOnly ? "Recorded points" : "Points"}
                  </span>
                  <span className="stat__value">{points}</span>
                  <span className="stat__note">
                    {minPoints} to share the season prize pot
                  </span>
                </div>
                {(rank >= 0 || (closes && you.rank >= 0)) && (
                  <div className="stat">
                    <span className="stat__label">
                      {data.closed
                        ? "Prize"
                        : closes
                          ? "Prize at the close"
                          : "Prize now"}
                    </span>
                    {/* Incomplete history: the approvals nobody recorded (which the close records
                        first) and the close's payouts are not known, so neither is the prize (L2). */}
                    {s!.historyError ? (
                      <>
                        <span className="stat__value">Not known</span>
                        <span className="stat__note">
                          until the history is read
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="stat__value">
                          {smallAmount(
                            closes
                              ? you.prize
                              : !qualifies
                                ? 0n
                                : data.closed
                                  ? paidTo(address)
                                  : (pot * share) / 10000n,
                            s,
                          )}
                        </span>
                        <span className="stat__note">
                          +{" "}
                          {tokenAmount(
                            closes
                              ? you.bonus
                              : !qualifies
                                ? 0n
                                : data.closed
                                  ? paidTo(address, "BonusPaid")
                                  : (bonus * share) / 10000n,
                            s,
                          )}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* The band "no recorded plea" has no costs: only the sentence below (r2S-N7). */}
              {(points > 0 || rank >= 0 || (closes && you.rank >= 0)) && (
                <Costs
                  rows={[
                    ...(points > 0 || rank >= 0
                      ? ([["Best three", sums(best)]] as [string, string][])
                      : []),
                    ...(points > 0 && judgesRow(counted(address, best), mult)
                      ? [judgesRow(counted(address, best), mult)!]
                      : []),
                    // An ended season: where the close puts you, as "What the close pays" counts it (R1).
                    ...(closes && !s!.historyError
                      ? ([
                          [
                            "At the close",
                            atClose(you, minPoints, con(s, "Seasons.TOP")),
                          ],
                        ] as [string, string][])
                      : rank >= 0
                      ? ([
                          [
                            "Share at rank " + (rank + 1),
                            s!.historyError
                              ? qualifies
                                ? `${pct(share)} on the recorded board`
                                : `no prize yet: ${points} of ${minPoints} recorded`
                              : qualifies
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
                    ) : pointsHeld(p, s!, now) ? (
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
                    ) : (
                      // Unrecorded and recordable: the same projection as while held (R1).
                      <p>{projection(p)}</p>
                    )}
                    {!data.closed && (
                      <TxButton
                        name="Seasons"
                        fn="record"
                        args={[p.id]}
                        label="Record my points"
                        srLabel={` for plea #${p.id}`}
                        connectText="Connect in the top bar to record points."
                        disabled={pointsHeld(p, s!, now) || data.closed}
                        reason={
                          pointsHeld(p, s!, now)
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
        {!ended && !data.closed && (
          // seasons.html:147: the heading, then one stack--lg for the panel's body. A closed
          // season takes no more points, so the seat no longer matters to it (sweep nit).
          <section className="panel" id="seat" aria-labelledby="seat-title">
            <h2 className="card__title" id="seat-title">
              The seat multiplier
            </h2>
            <div className="stack stack--lg">
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
            </div>
          </section>
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
              {data.closed
                ? `No plea was recorded in season ${season + 1n}.`
                : bounds[3] || last
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
                <span className="lb__prize">
                  {recordedOnly ? "Recorded prize" : "Prize now"}
                </span>
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
                              {smallAmount(
                                data.closed
                                  ? paidTo(e.wallet)
                                  : (pot * bps) / 10000n,
                                s,
                              )}
                            </span>{" "}
                            +{" "}
                            <span className="nowrap">
                              {tokenAmount(
                                data.closed
                                  ? paidTo(e.wallet, "BonusPaid")
                                  : (bonus * bps) / 10000n,
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
          {rows.length > 0 && recordedOnly && (
            <p className="small">
              These are the recorded points. The close records{" "}
              {closing.length === 1
                ? "1 more approved plea"
                : `${closing.length} more approved pleas`}{" "}
              first, so the ranks and prizes it pays are in What the close pays.
            </p>
          )}
          <p className="panel__foot">
            Equal points: the wallet whose newest counted plea is older ranks
            higher. Seat holders’ judges’ scores are in brackets (each × 1.2,
            rounded down).
          </p>
        </div>
        <div className="split split--even split--stretch form-actions-top">
          {/* A closed season's pot panel above shows what the close paid. */}
          {!data.closed && (
          <Panel
            level={ended ? 4 : 3}
            title={
              ended || bounds[3] || last
                ? "What the close pays"
                : "If the season ended now"
            }
            className="panel--sunken"
          >
            {query.error ? (
              readError("above")
            ) : !board ? (
              reading
            ) : (
              <>
                {/* With incomplete history the approvals the close records first are not known, so
                    the payout is not stated: the recorded board alone would read as fact (L2). */}
                <Costs
                  rows={
                    s!.historyError
                      ? [["Prizes and the PLEA bonus", "Not known until the history is read"]]
                      : [
                          [
                            `Paid to ${plural(paidWallets, "wallet")}`,
                            `${pct(shares)} · ${smallAmount(paid, s)}`,
                          ],
                          [
                            last
                              ? "Left for the buy wall"
                              : `Rolls over to season ${season + 2n}`,
                            `${pct(10000n - shares)} · ${tokenAmount(pot - paid, s, true)}`,
                          ],
                          ["PLEA bonus paid", tokenAmount(bonusPaid, s)],
                          ["PLEA bonus burned", tokenAmount(bonus - bonusPaid, s)],
                        ]
                  }
                />
                {(s!.historyError || closing.length > 0) && (
                  <p className="small">
                    {closeCounts({
                      pleas: closing.map((p) => ({
                        id: p.id,
                        points: Number(p.points || 0),
                        held: pointsHeld(p, s!, now),
                        seat: !!p.seat,
                      })),
                      mult,
                      historyError: !!s!.historyError,
                    })}
                  </p>
                )}
                {!s!.historyError && (
                  <p className="small text-2">
                    {roundingNote(pair, paidWallets)}
                  </p>
                )}
              </>
            )}
          </Panel>
          )}
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
                    historyError: !!s!.historyError,
                  })}
                </p>
                <TxButton
                  connectText="Connect in the top bar to close the season."
                  name="Seasons"
                  fn="closeSeason"
                  resetKey={`close:${season}`}
                  args={[(query.data?.closing || []).map((p: Plea) => p.id)]}
                  label={`Close season ${season + 1n}`}
                  disabled={
                    now < closeAt ||
                    !bounds[0] ||
                    season !== nextToClose ||
                    !!s!.historyError ||
                    !query.data
                  }
                  // A reason no wallet can change is shown to every viewer, before the connect
                  // text (round-2 C11).
                  lockedReason={
                    now < closeAt
                      ? `Anyone can close it from ${clock(closeAt)} (${span(grace, "adj")} grace).`
                      : season !== nextToClose
                        ? "Close the oldest season first."
                        : // closeSeason records only the approvals it is sent: without the history they are
                          // not known, and a close then could pay nobody and burn the PLEA bonus (NEW-1).
                          s!.historyError
                          ? "The history is incomplete, so the approved pleas the close must record first are not known. Close it once the history is read (Try history again at the top)."
                          : undefined
                  }
                  reason={
                    query.error
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
        <p>No seasons have closed{soFar()}.</p>
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
                    <a
                      href={`${r.network.explorer}/tx/${l.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
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
                        // Under a cent reads "< 0.01", as the prize paid from it does (sweep nit).
                        ["Season prize pot", smallAmount(BigInt(l.args.pot), s)],
                        [
                          `Paid to ${plural(prizes.length, "wallet")}`,
                          smallAmount(BigInt(l.args.paid), s),
                        ],
                        [
                          val(s, "CabalGate.diedAt") &&
                          k === BigInt(s!.v.displayedSeason)
                            ? "Left for the buy wall"
                            : `Rolled over to season ${Number(k) + 2}`,
                          smallAmount(
                            BigInt(l.args.pot) - BigInt(l.args.paid),
                            s,
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
                                  {smallAmount(
                                    prizes.find((p) =>
                                      equal(p.args.wallet, e.wallet),
                                    )?.args.amount || 0n,
                                    s,
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
