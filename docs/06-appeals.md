# Appeals

## In short

A denied plea gets one appeal. You send it within {{appeal_window}} of the denial, for the same amount or less, with a new text.

It costs {{appeal_total}}: the {{oracle_fee}} oracle fee and {{appeal_wall_share}} for the buy wall. The judges score it on its own, against a fresh need.

## How it works

1. **A denial opens the window.** For {{appeal_window}} after the verdict you may appeal. The same {{appeal_window}} is your cooldown, so an appeal is the only plea you can send in it.
2. **Open your plea's page.** The denied plea's page, from your [Profile](#/profile), has a "One appeal" box while the window is open. Only the wallet that pleaded can appeal.
3. **Choose the amount.** The same amount or less. It must also fit today's limits: at most {{max_share}} and at least {{min_share}} of the smaller of your PLEA now and your PLEA when you pleaded.
4. **Write a new text.** The judges score the appeal on its own text. They also see the denied plea, its score and its need. Repeating the old plea adds nothing; naming the old score is allowed.
5. **Pay {{appeal_total}}.** The {{oracle_fee}} oracle fee goes to the judges and {{appeal_wall_share}} to the buy wall, both in IMD.
6. **A fresh need.** The contract scores your facts again, as they are now. For the share sold it takes the smaller of the appeal's share and the denied plea's, so an appeal never lands in a worse share band. See [Your bar](04-your-bar.md).
7. **The verdict.** Approved: the stamp reads OVERTURNED, and you sell within {{sell_window}}, as after any approval. Denied: UPHELD, and there is no further appeal. Your next plea waits {{cooldown}} from that verdict, or from your sale.
8. **No verdict.** If no verdict comes within {{pending_expiry}}, the appeal is closed and its slot is free again. Inside the window you may appeal once more, paying again.

## In a picture

::: diagram appeal-window

## Example

A real appeal from Sepolia test run 9 (test token, 5-hour seasons). Plea #1, the low example on [The judges](05-judges.md), asked to sell 100,000 PLEA on Wed 21 Oct at 13:22 UTC and was denied. At 14:44 the same wallet appealed, for the same 100,000 PLEA:

> "Honoured Cabal, a fair verdict: my first plea was as plain as a gas receipt. Since then I bought in with my own imdTEST too. I still ask to sell 100,000 PLEA, 4% of my bag, to pay my gas; the rest stays and keeps playing the seasons. Thank you for reading me twice."

| Part | Plea #1 | Appeal #2 |
| --- | --- | --- |
| Share sold, about 4% | {{fact_share_top}} | {{fact_share_top}} |
| Held | {{held_points_0}} | {{held_points_0}} |
| Profit | {{received_profit}}, received | {{profit_points_loss}}, at a loss |
| Trend | {{trend_flat}} | {{trend_flat}} |
| **Fact score** | **30** | **34** |
| **Need: {{pass_mark}} − fact** | **39** | **35** |
| Judges' score | 27 | 30 |
| Approved? | No, 12 short | No, 5 short |

Between the two, the wallet made its first buy, at 14:42. That buy covered the appeal's 100,000 PLEA, bought at a loss: {{profit_points_loss}} points for profit instead of {{received_profit}} for received PLEA. So the appeal's need fell from 39 to 35.

The new text scored 30, so the denial was UPHELD. The appeal cost {{oracle_fee}} + {{appeal_wall_share}} = {{appeal_total}}. The wallet's next plea, #7, came at 18:59, after the cooldown that started with the appeal's verdict.

::: note Recomputed with today's rules
Run 9 used a pass mark of 71 and counted received PLEA at 10 for profit. Its needs were 40 and 37, with the same verdicts. The needs above use the launched rules.
:::

## Good to know

- **Too late.** After {{appeal_window}}: "The appeal window closed. Wait for your next plea."
- **Once only.** A second appeal, or an appeal of an appeal: "This plea has already been appealed."
- **Only a denial.** An approved plea, or one with no verdict, cannot be appealed: "This plea was not denied. Refresh its status before appealing."
- **Only your own.** "Only the seller can send this action. Connect the wallet that wrote the plea."
- **Not more than before.** An amount above the denied plea's: "The amount is over the limit. Reduce it or press Max."
- **The fee is spent.** Both parts of {{appeal_total}} are paid whatever the verdict. The {{appeal_wall_share}} goes to the buy wall; see [The pool](12-pool.md).
- **Other ways to appeal.** Tick "Sell automatically if approved" on the appeal and its fees are paid in PLEA, {{letter_appeal_fee}} worth; see [The auto-sell box](08-auto-sell.md). Without the site, send a letter that starts with APPEAL; see [Letters](07-letters.md).
- **The appeal's points.** An overturned appeal earns its score as season points, like any approval. Others may object to it. See [Objection!](09-objection.md)

::: builders
`CabalGate.appeal(originalId, amount, text)` appeals; it pulls `APPEAL_POOL_SHARE` in IMD, sends it to the wall (`PleaHook.fundWall`), then pays `ORACLE_FEE` as a plea does. Approve the gate for {{appeal_total}} first. The appeal is a new plea with `isAppeal` set and `originalId` pointing back; the denied plea gets `appealed`. `question(id)` of an appeal quotes the denied plea, its score and its need.

Errors: `AppealClosed`, `AlreadyAppealed`, `NotDenied`, `NotSeller`, `AmountTooLarge`, `AmountTooSmall`, `PendingExists`, `CannotPass(need)`, `CabalNotWatching`. The Letterbox's `appealAuto(originalId, text)` is the auto-sell appeal.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), at the commit IMD deployed.
:::
