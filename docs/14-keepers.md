# Keepers

## In short

PLEA needs a little upkeep: selling approved letters, returning escrows, closing seasons. Every one of these jobs is a call that anyone may make.

A keeper is whoever does them. Delivering a letter's sale pays a {{runner_tip}} tip. The other jobs pay nothing, and none of them gives any power.

## How it works

1. **Open to all.** Each job is one call to a contract, from any wallet. It cannot change a rule or send anything anywhere the rules do not.
2. **Deliver.** An approved letter or auto-sell plea must be sold within {{sell_window}}. Whoever delivers it first sells the escrow for the writer and earns the {{runner_tip}} tip. On the plea's page: "Deliver approved sale".
3. **Return an escrow.** A letter or auto-sell plea that was denied, got no verdict, or was not delivered in time: anyone may give the writer back its PLEA and tip. "Return escrow and tip".
4. **Close a plea with no verdict.** {{pending_expiry}} after a plea was sent with no verdict, anyone may close it, so its seller may plead again. "Expire unanswered plea".
5. **Objections.** {{objection_expiry}} after an objection with no ruling, anyone may void it: "Expire unanswered objection". Once an objection is decided, anyone may pay out its stake: "Settle objection stake". See [Objection!](09-objection.md).
6. **Record points.** After a plea's objection window, anyone may record its season points: "Record the points". See [Seasons and prizes](10-seasons.md).
7. **Close a season.** {{close_grace}} after a season ends, anyone may close it and pay its prizes: "Close season" on the [Seasons](#/seasons) page. The close also records any approvals it is given.
8. **After the death.** Once the last season is closed, anyone may send what is left of the pot to the buy wall: "Send leftovers to the buy wall". See [The dead-man](13-dead-man.md).
9. **Rebalance.** When the buy wall has work, anyone may rebalance it: "Rebalance buy wall" on Home. See [The pool](12-pool.md).
10. **The keeper bot.** A small program does all of this, every few seconds, for everyone. Anyone may run one: the guide is [keeper/VPS.md](https://github.com/khaed1/plea/blob/main/keeper/VPS.md), and what it does is in its [README](https://github.com/khaed1/plea/blob/main/keeper/README.md).

## The jobs at a glance

| Job | When |
| --- | --- |
| Deliver a sale, for the {{runner_tip}} tip | Within {{sell_window}} of the approval |
| Return an escrow | Once no sale can happen |
| Close a plea | {{pending_expiry}} with no verdict |
| Void an objection | {{objection_expiry}} with no ruling |
| Pay out a stake | Once the objection is decided |
| Record points | After the objection window |
| Close a season | {{close_grace}} after it ends |
| Send the leftovers to the wall | After the death and the last close |
| Rebalance the wall | When it has work |

Only a delivery pays. Every other job pays nothing.

## Example

A letter approved on Friday at 12:00:00 UTC, in a season that ends on Sunday at 15:00.

1. **12:00:12.** A keeper sees the approval in the next block and delivers it. The writer gets the sale. The keeper gets the {{runner_tip}} tip. Anyone could have done it until 12:07:00, {{sell_window}} after the approval.
2. **12:20:00.** The objection window, {{objection_window}}, has passed with no objection. A keeper records the plea's points. The delivery had tried to record them too, but they were still held.
3. **Sunday 16:00.** The season ended at 15:00. {{close_grace}} later, a keeper closes it and lists every approval still unrecorded. The prizes are paid.
4. **The keeper's account.** {{runner_tip}} earned, for the delivery; the record and the close paid nothing. It paid the gas for all three in ETH.

## Good to know

- **No power.** No keeper call can pick a winner, change a number or take anyone's funds. If nobody runs one, nothing is stolen: letters wait to be returned, seasons wait to be closed. An approved letter that nobody delivers in time lapses, and its PLEA comes back.
- **Record your own points.** If a season closes before your plea is recorded, and the close does not list it, its points are lost. Keepers list every approval, but you may always press "Record my points" yourself.
- **First come, first served.** If two keepers race, only the first call works. The second fails and costs its gas, for example: "This escrow is no longer open. Refresh the plea."
- **A delivery can fail on price.** The sale must pay at least {{delivery_floor}} of the escrow's value at the hourly price. If the price fell further: "The price moved beyond your minimum. Refresh the quote or raise your slippage." It may be tried again inside the window. After it: "The sell window closed. The plea has lapsed; its points may still count."
- **Too early.** A plea closed before its time: "The deadline has not passed. Wait for the countdown to reach zero." An escrow returned too soon: "This plea cannot be settled yet. Wait for its final state." A stake paid before the ruling: "The objection has no ruling yet. Wait for the panel or expire it after the deadline." A season closed too soon: "The season cannot close yet. Wait until the grace period ends." Leftovers sent while the Cabal lives: "The Cabal still lives or a season needs closing. Close the remaining seasons first."
- **Already done.** "This escrow or stake has already been returned. Refresh its status." or "These points were already recorded. Refresh to see them."
- **Nothing to rebalance.** "The buy wall has no work ready. Wait for more fees or a market move."
- **Running the bot.** It needs its own wallet with a little ETH for gas, and keeps the tips it earns. It tries every call first and skips one that would fail. It can also warn you on Telegram as the Cabal's clock runs low.

::: builders
The calls: `Letterbox.deliver(id)` (pays `TIP` to the caller), `Letterbox.settle(id)`, `CabalGate.expire(id)`, `Tribunal.expire(id)`, `Tribunal.settle(id)`, `Seasons.record(pleaId)`, `Seasons.closeSeason(pleaIds)`, `Seasons.flushToWall()`, `PleaHook.rebalance()`. None has a caller check. To find work: `Letterbox.openOf(wallet)` and `escrowOf(id)`, `CabalGate.getPlea(id)`, `Tribunal.objection(id)` and `standing(pleaId)`, `Seasons.recorded(pleaId)`, `nextToClose()`, `seasonBounds(season)` and `finished()`, `PleaHook.pendingRebalance()` (a hint: simulate the call). Events: `PleaSubmitted`, `Verdict`, `Escrowed`, `Delivered`, `Settled`, `Objected`, `Ruled`, `ObjectionVoid`, `StakeSettled`, `Recorded`, `SeasonClosedOut`.

The keeper bot reads everything from `PleaLaunch` and decides by the latest block's time. Its code is in [keeper/](https://github.com/khaed1/plea/tree/main/keeper) on the repository's main branch.
:::
