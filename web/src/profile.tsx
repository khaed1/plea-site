import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import {
  isAddress,
  getAddress,
  keccak256,
  stringToHex,
  zeroAddress,
  type Address,
} from "viem";
import { useApp, useRead, useTx } from "./context";
import { claimsAbi, resetHealth, vaultAbi } from "./config";
import { cashbackWords, site } from "./site";
import {
  read,
  countedPleas,
  getPlea,
  con,
  val,
  amount,
  tokenAmount,
  cashback,
  smallAmount,
  seasonState,
  potOf,
  clock,
  timeLeft,
  escrowWaiting,
  heldTime,
  short,
  signedPercent,
  multiplierText,
  type Plea,
} from "./chain";
import { seasonPrize, seasonsFoot } from "./season-text";
import { pendingState, factParts, LETTERBOX } from "./models";
import { returnedEscrow } from "./appeal";
import {
  Action,
  AddressView,
  AmountInput,
  Costs,
  Countdown,
  Empty,
  FactCells,
  Icon,
  Meter,
  Notice,
  Panel,
  PleaCard,
  TextBox,
  Title,
  textCheck,
} from "./components";
export function Profile({ target }: { target?: string }) {
  const { r, s, now, refresh } = useApp(),
    { address } = useAccount(),
    { disconnect } = useDisconnect(),
    wallet = target
      ? isAddress(target, { strict: false })
        ? getAddress(target.toLowerCase())
        : undefined
      : address,
    mine = !!wallet && wallet.toLowerCase() === address?.toLowerCase(),
    [lookup, setLookup] = useState(target || ""),
    [name, setName] = useState(""),
    [dirty, setDirty] = useState(false),
    tx = useTx(name);
  const season = seasonState(s, now),
    info = useRead(
      async () => {
        const [
          plea,
          pair,
          basis,
          current,
          seat,
          claimBalance,
          pending,
          executed,
          denied,
          lapsed,
          excluded,
        ] = await Promise.all([
          read(r, "PLEA", "balanceOf", [wallet]),
          read(r, "PairToken", "balanceOf", [wallet]),
          read(r, "PleaHook", "basisOf", [wallet]),
          read(r, "Letterbox", "nameOf", [wallet]),
          read(r, "Seasons", "holdsSeat", [wallet]),
          r.client.readContract({
            address: r.network.uniswapV4.poolManager,
            abi: claimsAbi,
            functionName: "balanceOf",
            args: [wallet!, BigInt(r.addresses.PairToken)],
          }),
          read(r, "CabalGate", "pendingOf", [wallet]),
          read(r, "CabalGate", "lastExecutedAt", [wallet]),
          read(r, "CabalGate", "lastDeniedAt", [wallet]),
          read(r, "CabalGate", "lastLapsedAt", [wallet]),
          read(r, "Seasons", "excluded", [wallet]),
        ]);
        // An escrow that settle can return now (a denied, lapsed or unanswered letter plea).
        const escrow = await returnedEscrow(r, s!, wallet!, now);
        const pendingPlea = pending
            ? await getPlea(r, pending, s?.logs)
            : undefined,
          raw =
            plea / 5n < BigInt(con(s, "CabalGate.MAX_SELL"))
              ? plea / 5n
              : BigInt(con(s, "CabalGate.MAX_SELL")),
          fact = raw
            ? Number(await read(r, "CabalGate", "factScore", [wallet, raw]))
            : 0;
        // The latest two pleas: the PleaSubmitted logs, joined by what the chain says without them
        // (CabalGate.lastPleaOf and the newest pleas the snapshot read), so a gap in history never
        // reads as "No pleas yet" (r2S-N1).
        const last = BigInt(await read(r, "CabalGate", "lastPleaOf", [wallet]));
        const ids = [
          ...new Set<bigint>([
            ...s!.logs
              .filter(
                (l) =>
                  l.eventName === "PleaSubmitted" &&
                  l.args.seller.toLowerCase() === wallet!.toLowerCase(),
              )
              .map((l) => l.args.id as bigint),
            ...s!.pleas
              .filter((p) => p.seller.toLowerCase() === wallet!.toLowerCase())
              .map((p) => p.id),
            ...(last ? [last] : []),
          ]),
        ]
          .sort((a, b) => Number(b - a))
          .slice(0, 2);
        const pleas = await Promise.all(
          ids.map((id) => getPlea(r, id, s!.logs, s!.v.objections)),
        );
        // A row per season with points, read from Seasons.bestOf for every season so far: the chain
        // knows them without the Recorded logs (r2S-N1). A prize needs 60+ points, so points cover it.
        const count = season ? Number(season.displayed) + 1 : 0,
          bests = await Promise.all(
            Array.from({ length: count }, (_, k) =>
              read(r, "Seasons", "bestOf", [BigInt(k), wallet]),
            ),
          );
        const keys = bests.flatMap((b: any, k) =>
          b.some((x: any) => Number(x)) ? [BigInt(k)] : [],
        );
        const seasons = await Promise.all(
          keys.map(async (index) => {
            const best = bests[Number(index)],
              [top, closed, fees, bounds] = await Promise.all([
                read(r, "Seasons", "topOf", [index]),
                read(r, "Seasons", "closed", [index]),
                read(r, "Seasons", "seasonFees", [index]),
                read(r, "Seasons", "seasonBounds", [index]),
              ]);
            const rank = top.findIndex(
                (e: any) => e.wallet.toLowerCase() === wallet!.toLowerCase(),
              ),
              points = best.reduce((n: number, x: number) => n + Number(x), 0),
              share = rank >= 0 ? BigInt(s!.v.shares[rank]) : 0n,
              pot =
                BigInt(fees) +
                (index === BigInt(val(s, "Seasons.nextToClose"))
                  ? BigInt(val(s, "Seasons.rollover"))
                  : 0n),
              bonus =
                index < BigInt(con(s, "Seasons.BONUS_SEASONS"))
                  ? BigInt(con(s, "Seasons.BONUS_PER_SEASON"))
                  : 0n;
            const paid = s!.logs.filter(
              (l) =>
                ["PrizePaid", "BonusPaid"].includes(l.eventName) &&
                l.args.season === index &&
                l.args.wallet.toLowerCase() === wallet!.toLowerCase(),
            );
            return {
              index,
              best: [...best].sort((a, b) => Number(b) - Number(a)),
              rank,
              points,
              closed,
              bounds,
              excluded,
              // A closed season's prize is its PrizePaid logs: unknown while history is incomplete.
              known: !closed || !s!.historyError || paid.length > 0,
              qualifies:
                !excluded && points >= Number(con(s, "Seasons.MIN_POINTS")),
              imd: closed
                ? paid
                    .filter((l) => l.eventName === "PrizePaid")
                    .reduce((n, l) => n + BigInt(l.args.amount), 0n)
                : !excluded && points >= Number(con(s, "Seasons.MIN_POINTS"))
                  ? (pot * share) / 10000n
                  : 0n,
              bonus: closed
                ? paid
                    .filter((l) => l.eventName === "BonusPaid")
                    .reduce((n, l) => n + BigInt(l.args.amount), 0n)
                : !excluded && points >= Number(con(s, "Seasons.MIN_POINTS"))
                  ? (bonus * share) / 10000n
                  : 0n,
            };
          }),
        );
        return {
          escrow,
          plea,
          pair,
          basis,
          current,
          seat,
          claimBalance,
          pendingPlea,
          executed,
          denied,
          lapsed,
          raw,
          fact,
          pleas,
          last,
          seasons,
          excluded,
        };
      },
      [wallet],
      !!wallet && !!s,
    );
  // The wallet's staked cashback on networks that stake it: sIMD shares and their IMD value now.
  const vault = site().cashback.simd,
    staked = useRead(
      async () => {
        const shares = (await r.client.readContract({
          address: vault!,
          abi: vaultAbi,
          functionName: "balanceOf",
          args: [wallet!],
        })) as bigint;
        const assets = shares
          ? ((await r.client.readContract({
              address: vault!,
              abi: vaultAbi,
              functionName: "convertToAssets",
              args: [shares],
            })) as bigint)
          : 0n;
        return { shares, assets };
      },
      [wallet, vault],
      !!wallet && !!s && !!vault,
    );
  useEffect(() => {
    if (info.data && !dirty) setName(info.data.current);
  }, [info.data, dirty]);
  const owner = useRead(
      () => read(r, "Letterbox", "nameOwner", [keccak256(stringToHex(name))]),
      [name],
      !!s && !!name && textCheck("name", name).ok,
    ),
    taken =
      !!owner.data &&
      owner.data !== zeroAddress &&
      owner.data.toLowerCase() !== wallet?.toLowerCase();
  const data = info.data,
    derived = pendingState(
      data?.pendingPlea,
      now,
      Number(con(s, "CabalGate.EXECUTE_WINDOW")),
      Number(con(s, "CabalGate.PENDING_EXPIRY")),
      Number(data?.lapsed || 0n),
    ),
    cooldown =
      Math.max(
        Number(data?.executed || 0n),
        Number(data?.denied || 0n),
        derived.lapsedAt,
      ) + Number(con(s, "CabalGate.COOLDOWN")),
    label = data?.current || short(wallet || ""),
    next = derived.open
      ? `after #${data?.pendingPlea?.id}`
      : cooldown > now
        ? clock(cooldown)
        : "Ready now";
  if (target && !isAddress(target, { strict: false }))
    return (
      <>
        <Title title="Profile" />
        <Notice kind="bad" title="That is not an address.">
          <p>
            Paste one that starts with 0x and has 40 more characters, 0–9 and
            a–f in either case.
          </p>
        </Notice>
        <AddressLookup value={lookup} setValue={setLookup} />
        {address && (
          <a className="btn btn--sm" href="#/profile">
            Back to your profile
          </a>
        )}
      </>
    );
  if (!wallet)
    return (
      <>
        <Title title="Your profile" />
        <Notice title="Connect in the top bar to see your profile.">
          <p>
            Balances, pleas and seasons read without a wallet. Look up any
            address below.
          </p>
        </Notice>
        <AddressLookup value={lookup} setValue={setLookup} />
      </>
    );
  return (
    <>
      <Title
        title={label || "Profile"}
        aside={
          <>
            {data?.seat && (
              <span className="badge badge--seat">
                <Icon name="armchair" />
                SEAT ×{Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS")) / 10000}
              </span>
            )}
            {!mine && <span className="pill">Read only</span>}
          </>
        }
      />
      <AddressView address={wallet} label={data?.current || "profile"} />
      <p className="lead">
        {mine
          ? val(s, "CabalGate.diedAt")
            ? "Your wallet as PLEA sees it: what you hold, your buy record, your name, your pleas and your seasons."
            : "Your wallet as PLEA sees it: what you hold, the buy record your next plea is scored on, your name, your pleas and your seasons."
          : `${label}’s public PLEA holdings, pleas and seasons.`}
      </p>
      {mine && (
        <button className="link-btn" onClick={() => disconnect()}>
          Disconnect this wallet
        </button>
      )}
      {info.error ? (
        <div className="error-box" role="alert">
          <p className="error-box__title">
            <Icon name="plugs" />
            Can’t read this profile
          </p>
          <p className="small">{info.error}</p>
          <div className="btn-row">
            <button
              className="btn btn--sm"
              type="button"
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
      ) : !data ? (
        <div className="panel stack" aria-busy="true">
          <p className="loading-label">
            <Icon name="hourglass" />
            Reading {label}’s balances, pleas and seasons from the chain…
          </p>
          <div className="skeleton" aria-hidden="true">
            <div className="skeleton__block" />
            <div className="skeleton__line" />
            <div className="skeleton__line skeleton__line--mid" />
            <div className="skeleton__line skeleton__line--short" />
          </div>
        </div>
      ) : (
        <>
          <div className="stats stats--4">
            {(mine
              ? [
                  [
                    "PLEA",
                    tokenAmount(data.plea, s),
                    val(s, "CabalGate.diedAt")
                      ? "Sells freely on the Buy page"
                      : `A plea: ${tokenAmount(data.plea / 100n, s)} to ${tokenAmount(data.plea / 2n < BigInt(con(s, "CabalGate.MAX_SELL")) ? data.plea / 2n : BigInt(con(s, "CabalGate.MAX_SELL")), s)}`,
                  ],
                  [
                    s?.constants.pairSymbol,
                    tokenAmount(data.pair, s, true),
                    // After the death there is no plea, so no oracle fee to pay.
                    val(s, "CabalGate.diedAt")
                      ? "For buys on the Buy page"
                      : `For buys and the ${tokenAmount(con(s, "CabalGate.ORACLE_FEE"), s, true)} oracle fee`,
                  ],
                  // Cashback is summed from logs: hidden while history is incomplete (r2S-N1).
                  s!.historyError
                    ? ["Cashback earned", "—", "Shows once the history is read"]
                    : [
                        "Cashback earned",
                        smallAmount(cashback(s!.logs, wallet), s),
                        cashbackWords(String(s!.constants.pairSymbol)).profileNote,
                      ],
                  [
                    "Next plea",
                    val(s, "CabalGate.diedAt") ? "Closed" : next,
                    val(s, "CabalGate.diedAt")
                      ? "Pleas are closed; sell on the Buy page."
                      : "A sale, denial or lapse starts the cooldown",
                  ],
                ]
              : [
                  [
                    "PLEA",
                    tokenAmount(data.plea, s),
                    val(s, "CabalGate.diedAt")
                      ? "Sells freely on the Buy page"
                      : "Public holdings",
                  ],
                  ...data.seasons
                    .slice(-2)
                    .reverse()
                    .map((k) => [
                      `Season ${k.index + 1n}`,
                      k.rank >= 0 ? `#${k.rank + 1}` : "none yet",
                      `${k.points} points · ${k.best.join(" + ")}`,
                    ]),
                  [
                    "Next plea",
                    val(s, "CabalGate.diedAt") ? "Closed" : next,
                    val(s, "CabalGate.diedAt")
                      ? "Pleas are closed; sell on the Buy page."
                      : "Public cooldown",
                  ],
                ]
            ).map(([a, b, note], i) => (
              <div className="stat" key={i}>
                <span className="stat__label">{a}</span>
                <span className="stat__value">{b}</span>
                <span className="stat__note">{note}</span>
              </div>
            ))}
          </div>
          {!mine && (
            <Notice title={`You are viewing ${label}’s profile.`}>
              <p>
                Balances, pleas and seasons are public and read from the chain.
                Only {label} can change this name, so there is no name box.{" "}
                {address && <a href="#/profile">Back to your profile</a>}
              </p>
            </Notice>
          )}
          {data.escrow.returned > 0n &&
            (() => {
              const e = escrowWaiting(
                {
                  id: data.escrow.id,
                  amount: data.escrow.returned,
                  tip: LETTERBOX.TIP,
                },
                s!,
                mine,
              );
              return (
                <Notice title={e.title}>
                  <p>{e.body}</p>
                  <a className="btn btn--sm" href={`#/p/${data.escrow.id}`}>
                    Open plea #{String(data.escrow.id)}
                  </a>
                </Notice>
              );
            })()}
          {mine && derived.open && data.pendingPlea?.status === 2 && (
            <Notice
              title={`Plea #${data.pendingPlea.id} is open: sell by ${clock(Number(data.pendingPlea.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW")))}.`}
            >
              <div>
                <Countdown
                  urgent
                  until={
                    Number(data.pendingPlea.verdictAt) +
                    Number(con(s, "CabalGate.EXECUTE_WINDOW"))
                  }
                  label="Sell within"
                />
              </div>
              <a
                className="btn btn--ink btn--sm"
                href={`#/p/${data.pendingPlea.id}`}
              >
                Open plea #{String(data.pendingPlea.id)} to sell
              </a>
            </Notice>
          )}
          <div className="split form-actions-top">
            <Panel level={2} title={mine ? "Your buy record" : "Buy record"}>
              <p className="small text-2">
                {val(s, "CabalGate.diedAt")
                  ? `The hook records every buy ${mine ? "you make" : "this wallet makes"}. Pleas are closed, so no plea is scored on it any more; the Buy page shows the spot price.`
                  : mine
                    ? "The hook records every buy you make. Your next plea’s facts come from it, at the hook’s hourly price; the Buy page shows the spot price."
                    : "The hook records every buy this wallet makes. Its next plea’s facts come from it, at the hook’s hourly price; the Buy page shows the spot price."}
              </p>
              <Costs
                rows={[
                  [
                    "Cost basis",
                    data.basis[1]
                      ? tokenAmount(
                          (data.basis[0] * 10n ** 24n) / data.basis[1],
                          s,
                          true,
                        ) + " per 1M"
                      : "No buy record",
                  ],
                  [
                    "Held, buy-weighted",
                    data.basis[2]
                      ? heldTime(now - Number(data.basis[2]))
                      : "No buy record",
                  ],
                  // The hourly checkpoint the next plea is scored on, labelled as such: #/buy and the
                  // header show the spot price (r2D-VN2). Signed, with U+2212, as on #/buy (r2X-7, r2D-N8).
                  [
                    `At the hourly price, ${tokenAmount((BigInt(val(s, "PleaHook.latestPrice") || 0n) * 10n ** 24n) / 2n ** 96n, s, true)} per 1M`,
                    data.basis[0]
                      ? signedPercent(
                          (Number(
                            (data.basis[1] *
                              BigInt(val(s, "PleaHook.latestPrice") || 0n)) /
                              2n ** 96n,
                          ) *
                            100) /
                            Number(data.basis[0]) -
                            100,
                        )
                      : "No buy record",
                  ],
                  ...(vault
                    ? ([
                        [
                          `Staked ${s?.constants.pairSymbol} (sIMD)`,
                          staked.data
                            ? simdText(staked.data.shares, staked.data.assets, s)
                            : staked.error
                              ? "Can’t read it now"
                              : "Reading…",
                        ],
                      ] as [string, string][])
                    : []),
                  [
                    `${s?.constants.pairSymbol} claims on the PoolManager`,
                    smallAmount(data.claimBalance, s),
                  ],
                ]}
              />
              {vault && (
                <p className="small">
                  Cashback is staked through imd/acc’s Stacker as sIMD, a
                  vault share worth more {s?.constants.pairSymbol} as the vault
                  earns; the value shown is today’s. See it or unstake on{" "}
                  <a href="https://imdacc.fun" target="_blank" rel="noreferrer">
                    imdacc.fun
                  </a>
                  .
                </p>
              )}
              <p className="small">
                {vault ? "The claims are paid" : "Paid"} on opening buys when
                the pool could not pay at once. They are ERC-6909 balances on
                Uniswap v4’s PoolManager (id = the {s?.constants.pairSymbol}{" "}
                address), separate from the {s?.constants.pairSymbol} balance;
                this site cannot redeem them.
              </p>
              {mine && !val(s, "CabalGate.diedAt") && (
                <>
                  <h3>Your next plea, at 20%</h3>
                  {data.plea === 0n ? (
                    <p>
                      This wallet holds no PLEA, so it has nothing to plead.
                    </p>
                  ) : (
                    <>
                      <FactCells
                        parts={factParts(
                          data.plea,
                          data.raw,
                          data.basis,
                          BigInt(val(s, "PleaHook.latestPrice") || 0n),
                          BigInt(val(s, "PleaHook.price24hAgo") || 0n),
                          Number(val(s, "CabalGate.startedAt")),
                          now,
                        )}
                        total={data.fact}
                      />
                      <Meter
                        fact={data.fact}
                        need={Number(con(s, "CabalGate.PASS_MARK")) - data.fact}
                        label={`No score yet. A 20% plea needs ${Number(con(s, "CabalGate.PASS_MARK")) - data.fact} of ${con(s, "CabalGate.MAX_PLEA_SCORE")} from the judges.`}
                      />
                      <p>
                        {tokenAmount(data.raw, s)} at today’s balance. A new buy
                        or checkpoint can change these facts.
                      </p>
                      <a className="btn btn--sm" href="#/plead">
                        Plead to sell <Icon name="arrow-right" />
                      </a>
                    </>
                  )}
                </>
              )}
            </Panel>
            {mine && (
              <Panel level={2} card title="Display name">
                <p>
                  Shown on the Wall and the leaderboard instead of{" "}
                  <span className="mono">{short(wallet)}</span>:
                </p>
                <div className="wall-card__who">
                  <span className={`${name ? "" : "mono "}strong`}>
                    {name || short(wallet)}
                  </span>
                  {data.seat && (
                    <span className="badge badge--seat">
                      SEAT ×
                      {Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS")) / 10000}
                    </span>
                  )}
                </div>
                <TextBox
                  kind="name"
                  fieldId="profile-name"
                  label="Display name"
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    setDirty(true);
                  }}
                  currentName={data.current}
                  extraError={
                    taken ? `${name} is taken. Try another name.` : undefined
                  }
                />
                <div className="btn-row">
                  <Action
                    connectText="Connect in the top bar to set a display name."
                    {...tx}
                    label="Save name"
                    describedBy="profile-name-checks"
                    pendingLabel="Saving name…"
                    onRun={() =>
                      tx.send("Letterbox", "setName", [name], undefined, {
                        toast: () => ({
                          text: name
                            ? `Name saved: ${name}.`
                            : "Display name cleared.",
                        }),
                      })
                    }
                    disabled={
                      !tx.ready ||
                      !textCheck("name", name).ok ||
                      (!name && !data.current) ||
                      name === data.current ||
                      taken ||
                      owner.loading
                    }
                  />
                  {data.current && (
                    <button
                      className="link-btn"
                      aria-disabled={tx.busy}
                      onClick={() => {
                        if (!tx.busy) {
                          setName("");
                          setDirty(true);
                        }
                      }}
                    >
                      Clear name
                    </button>
                  )}
                </div>
                <p className="field__hint">
                  Names are unique. Reserved: cabal, admin, imd, plea and owner.
                </p>
                <p className="small">
                  Or send the letter NAME &lt;name&gt; to the Letterbox from
                  Etherscan; NAME alone clears it.{" "}
                  <a href="#/letters">How letters work</a>
                </p>
              </Panel>
            )}
          </div>
          <section className="section">
            <div className="section__head">
              <h2>{mine ? "Your" : "Their"} pleas</h2>
              <a className="link-btn" href={`#/wall?wallet=${wallet}`}>
                All pleas on the Wall <Icon name="arrow-right" />
              </a>
            </div>
            {season &&
              (() => {
                const k = data.seasons.find(
                  (k) => k.index === season.displayed,
                );
                const also =
                  k &&
                  countedPleas(s!, k.index, wallet, k.best)?.filter(
                    (p) => !data.pleas.some((x) => x.id === p.pleaId),
                  );
                return also?.length ? (
                  <p>
                    Season {String(season.displayed + 1n)} also counts{" "}
                    {also.map((p, i) => (
                      <span key={String(p.pleaId)}>
                        {i ? " and " : ""}
                        <a href={`#/p/${p.pleaId}`}>#{String(p.pleaId)}</a>
                      </span>
                    ))}
                    .
                  </p>
                ) : null;
              })()}
            {data.pleas.length ? (
              <>
                <div className="wall-grid">
                  {data.pleas.map((p) => (
                    <PleaCard key={String(p.id)} p={p} />
                  ))}
                </div>
                {/* The two newest come from history and the newest pleas read; with a gap in
                    history an older one may be missing (r2S-N1). */}
                {s!.historyError && (
                  <p className="small">
                    Older pleas show once the history is read.
                  </p>
                )}
              </>
            ) : (
              <Empty
                title="No pleas yet"
                action={
                  mine &&
                  !val(s, "CabalGate.diedAt") &&
                  val(s, "PleaHook.seeded")
                    ? { href: "#/plead", label: "Write a plea" }
                    : undefined
                }
              >
                When this wallet makes its case, it appears here.
              </Empty>
            )}
          </section>
          <section className="section">
            <div className="split split--stretch">
              {/* profile.html:186-199: a flush panel whose table runs edge to edge, table--tight so
                  the four columns fit at 320 px (r2S-N4), and the foot as panel__foot. */}
              <section
                className="panel panel--flush panel--fill"
                aria-labelledby="profile-seasons-title"
              >
                <div className="panel__head">
                  <h2 id="profile-seasons-title">
                    {mine ? "Your seasons" : "Seasons"}
                  </h2>
                  {season && (
                    <a className="link-btn" href="#/seasons">
                      Season {String(season.displayed + 1n)} leaderboard
                      <Icon name="arrow-right" />
                    </a>
                  )}
                </div>
                {/* The owner never plays seasons (Seasons.excluded; record reverts OwnerExcluded) (F6). */}
                {data.excluded && (
                  <div className="panel__body">
                    <p className="small">
                      {mine ? "This wallet is" : `${label} is`} PLEA’s owner or
                      the launch owner, excluded from seasons: its pleas earn no
                      points, prize or bonus.
                    </p>
                  </div>
                )}
                {!data.seasons.length ? (
                  data.excluded ? null : (
                    <div className="panel__body">
                      <p className="small">
                        No plea of this wallet is recorded in any season yet.
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    <div
                      className="table-wrap"
                      role="region"
                      aria-label="Points, rank and prize by season"
                      tabIndex={0}
                    >
                      <table className="table table--tight">
                        <caption className="sr-only">
                          {mine ? "Your" : "This wallet’s"} points, rank and
                          prize in each season
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Season</th>
                            <th scope="col" className="r">
                              Points
                            </th>
                            <th scope="col" className="r">
                              Rank
                            </th>
                            <th scope="col" className="r">
                              Prize
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.seasons.map((k) => {
                            const prize = seasonPrize(
                              k,
                              Number(con(s, "Seasons.MIN_POINTS")),
                              s,
                            );
                            return (
                              <tr key={String(k.index)}>
                                <td className="strong">
                                  <span className="nowrap">
                                    Season {String(k.index + 1n)}
                                  </span>
                                  <span className="cell-note">
                                    {k.closed
                                      ? "closed, paid"
                                      : now >= Number(k.bounds[2])
                                        ? "awaiting close"
                                        : `${timeLeft(Number(k.bounds[2]) - now)} left`}
                                  </span>
                                </td>
                                <td className="r">{k.points}</td>
                                <td className="r">
                                  {k.rank >= 0 ? k.rank + 1 : "—"}
                                  {!k.closed && (
                                    <span className="cell-note">so far</span>
                                  )}
                                </td>
                                <td className="r">
                                  {prize.value}
                                  {prize.note && (
                                    <span className="cell-note">
                                      {prize.note}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="meta panel__foot">
                      {season &&
                        (() => {
                          const k = data.seasons.find(
                            (k) => k.index === season.displayed,
                          );
                          return seasonsFoot({
                            season: season.displayed,
                            rank: k ? k.rank : -1,
                            qualifies: !!k?.qualifies && !k.closed,
                            closed: !!season.current?.closed,
                            closeFrom: clock(
                              Number(season.current.bounds[2]) +
                                Number(con(s, "Seasons.CLOSE_GRACE")),
                            ),
                          });
                        })()}
                    </p>
                  </>
                )}
              </section>
              <section className="panel" aria-labelledby="profile-seat-title">
                <h2 className="card__title" id="profile-seat-title">
                  IMD seat
                </h2>
                <div className="stack stack--lg">
                  <p>
                    {(() => {
                      // profile.html:205, with this wallet's own example: its newest plea whose points
                      // are still to be recorded (p.points is Seasons.pointsFor now), else a score of 36.
                      const bps = Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS")),
                        mult = multiplierText(s),
                        who = mine ? "You hold" : `${label} holds`,
                        ex = data.pleas.find(
                          (p) =>
                            [2, 4, 5].includes(p.status) &&
                            !p.excluded &&
                            !p.standing?.[1] &&
                            !p.recorded,
                        ),
                        score = ex
                          ? Math.min(ex.score, Number(ex.standing?.[2] ?? 255))
                          : 36,
                        seated = Math.floor((score * bps) / 10000);
                      if (data.excluded)
                        return `${who} ${data.seat ? "an" : "no"} identity.md seat. The multiplier never applies here: this wallet earns no season points.`;
                      return data.seat
                        ? `${who} an identity.md seat, so every recorded plea earns × ${mult}. ${ex ? `Plea #${ex.id}’s ${score} becomes ${ex.points} points.` : `A score of ${score} becomes ${seated} points.`}`
                        : `${who} no identity.md seat now, so a recorded plea earns its judges’ score. With a seat when ${ex ? `plea #${ex.id}` : "a plea"} is recorded, ${ex ? `its ${score}` : `a score of ${score}`} would earn ${seated} points (× ${mult}, rounded down).`;
                    })()}
                  </p>
                  <div className="stack stack--sm">
                    <p className="label">Seat NFT · identity.md</p>
                    <AddressView
                      address={val(s, "Seasons.seat")}
                      label="identity.md seat NFT"
                      shortDisplay
                    />
                  </div>
                  <div>
                    <a className="link-btn" href="#/seasons?seat=1">
                      How the seat multiplier works <Icon name="arrow-right" />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </>
  );
}
function AddressLookup({
  value,
  setValue,
}: {
  value: string;
  setValue: (v: string) => void;
}) {
  const invalid = !!value && !isAddress(value, { strict: false });
  return (
    <div className="field form-actions-top">
      <label className="field__label" htmlFor="profile-address">
        Any address
      </label>
      <div className={`input input--addr ${invalid ? "is-invalid" : ""}`}>
        <input
          id="profile-address"
          className="input__control"
          value={value}
          onChange={(e) => setValue(e.target.value.trim())}
          spellCheck={false}
          aria-invalid={invalid}
          aria-describedby={invalid ? "profile-address-error" : undefined}
        />
      </div>
      {invalid && (
        <p className="field__hint bad-text" id="profile-address-error">
          That is not an address. Paste one that starts with 0x and has 40 more
          characters, 0–9 and a–f in either case.
        </p>
      )}
      <button
        className="btn form-actions-top"
        aria-disabled={!isAddress(value, { strict: false })}
        onClick={() =>
          isAddress(value, { strict: false }) &&
          (location.hash = `#/profile/${getAddress(value.toLowerCase())}`)
        }
      >
        Show profile
      </button>
    </div>
  );
}

/** "0.003065 sIMD, worth 0.02 IMD now": sIMD has 24 decimals; six are enough to see a cashback. */
export function simdText(shares: bigint, assets: bigint, s: any) {
  if (!shares) return "none";
  const decimals = site().cashback.simdDecimals || 24;
  const shown =
    shares < 10n ** BigInt(decimals - 6)
      ? "< 0.000001"
      : amount(shares, decimals, 6).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return `${shown} sIMD, worth ${smallAmount(assets, s)} now`;
}
