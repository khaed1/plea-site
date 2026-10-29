# The dead-man

## In short

The Cabal lives as long as verdicts keep coming. Every verdict, approved or denied, restarts a clock of {{deadman}}.

If that clock runs out, the Cabal dies, for good. From then on there are no pleas, and PLEA trades like any other token.

## How it works

1. **The clock starts.** When trading opens, the Cabal has {{deadman}} to give its first verdict.
2. **A verdict restarts it.** The judges' signed score on a plea or an appeal, approved or denied, sets the clock back to {{deadman}}.
3. **Nothing else does.** A plea that gets no verdict, an objection's ruling, a trade, a sale or a recorded point: none of them touch the clock.
4. **The death.** When {{deadman}} pass with no verdict, the Cabal is dead. Nobody has to press anything: from that second on, every contract treats it as dead.
5. **For good.** A verdict needs a living Cabal, so nothing can bring it back.
6. **Selling opens.** Anyone may sell PLEA in the pool, with no plea, and send it to any wallet. Any app that lists the pool can trade it.
7. **Pleas close.** New pleas, appeals and letters are refused. Objections end too: every approval's window has long passed.
8. **The fees stay.** Every trade still pays {{fee_total}}. With no seasons left, the {{fee_prize}} prize share goes to the buy wall. The cap, the trims and the wall carry on. See [The pool](12-pool.md).
9. **The last season.** It ends at the moment of the death. {{close_grace}} later anyone may close it and pay its prizes. Then anyone may send what is left of the pot to the buy wall, which also burns the PLEA bonus that is left. See [Seasons and prizes](10-seasons.md).

## In a picture

::: diagram heartbeat

## Example

Trading has been open for some days. On Monday at 10:00 UTC, the Cabal denies a plea.

1. **Mon 10:00.** A verdict. The Cabal now dies at Tue 19:00, {{deadman}} later, unless another verdict comes first.
2. **Tue 14:00.** A plea is sent, but no verdict comes by 14:20, {{pending_expiry}} later. It is closed with no verdict. The clock does not move: still Tue 19:00.
3. **Tue 18:50.** A verdict, approved: the clock restarts. Tue 18:50 + {{deadman}} = Thu 03:50.
4. **Thu 03:50.** No plea has been judged since. The Cabal is dead.
5. **Thu 04:50.** The season that was running ended at 03:50. {{close_grace}} later, anyone may close it and pay its prizes.
6. **After that close.** Anyone may send what is left of the pot to the buy wall. From now on PLEA sells on the [Buy](#/buy) page like any token.

Had one more plea been judged before Thu 03:50, approved or denied, the clock would have restarted from that verdict.

## Good to know

- **Quiet days count.** The Cabal dies if nobody pleads for {{deadman}}, just as it does if the judges are down that long.
- **No clock before trading.** Until trading opens, the dead-man does not run.
- **The site shows the clock.** The top bar says how long the Cabal has left without a verdict, and so does Home's dead-man panel.
- **After the death.** A banner says: "The Cabal is dead: no verdict for {{deadman}}. PLEA trades freely forever. Pleas and objections are closed; sell on the Buy page."
- **A plea sent after the death.** The site says: "The Cabal is not taking pleas. Check whether trading has opened or the Cabal has died."
- **Waiting letters come back.** A letter's PLEA still in escrow is returned with its tip by "Return escrow and tip". See [Letters](07-letters.md).
- **Points still count.** Approved pleas can be recorded until the last season is closed. Prizes are paid as usual.
- **No more buy records.** Your cost and holding time only ever fed the fact score. With no pleas, they no longer matter.
- **Cashback needs a name.** A trade through a router that does not name its trader pays no cashback; that share stays in the pool. See [Fees](11-fees.md).

::: builders
`CabalGate`: `cabalAlive()` is `startedAt != 0 && block.timestamp < lastVerdictAt + DEADMAN`; `diedAt()` gives the moment of the death (zero while alive); `restricted()` is true before trading opens and while the Cabal lives. `begin()` (from `PleaLaunch.seed`) sets `startedAt` and `lastVerdictAt`; `onOracleResult` moves `lastVerdictAt` on every signed verdict and refuses one after the death (`TooLate`). `onPleaFailure` and `expire` never move it. No transaction marks the death: it is a comparison with the clock. Event: `CabalBegins`.

`PLEA.restricted()` reads the gate: when it turns false, transfers are free and anyone may `burn` their own PLEA. `PleaHook` stops refusing sales (`SellsOnlyViaGate`), exact-output buys and unnamed traders, and sends the prize share to the wall. `Seasons.seasonBounds` ends the last season at `diedAt()`; `finished()` turns true once it is closed, and then `flushToWall()` may run.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), at the commit IMD deployed.
:::
