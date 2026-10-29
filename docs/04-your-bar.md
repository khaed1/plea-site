# Your bar

## In short

Every plea has a bar: the need. The judges' score must reach it.

Your need is {{pass_mark}} minus your fact score. The contract reads the fact score from four facts about your sale. Better facts, a lower need.

## How it works

1. **Share sold.** The plea's amount as a share of your PLEA, rounded up to a hundredth of a percent. At most {{share_band_top}}: {{fact_share_top}} points. At most {{share_band_mid}}: {{fact_share_mid}}. More: {{fact_share_low}}.
2. **Held.** How long ago you bought, on average, weighted by the PLEA each buy got. Under a day: {{held_points_0}}. {{held_day_1}} day: {{held_points_1d}}. {{held_day_3}} days: {{held_points_3d}}. {{held_day_7}} days: {{held_points_7d}}.
3. **Profit or loss.** The PLEA your buys got, at the latest hourly price, against the IMD they cost you, fees included. At a loss: {{profit_points_loss}}. Up at most {{profit_band_50}}: {{profit_points_50}}. At most {{profit_band_200}}: {{profit_points_200}}. At most {{profit_band_500}}: {{profit_points_500}}. At most {{profit_band_1000}}: {{profit_points_1000}}. More: {{profit_points_more}}.
4. **PLEA you received.** PLEA no buy of yours covers, from the airdrop or a prize, counts as held since trading opened, at {{received_profit}} for profit. A plea bigger than your buy record mixes the two, weighted by PLEA and rounded.
5. **The 24-hour trend.** The latest hourly price against the price 24 hours earlier. Up more than {{trend_band}}: {{trend_up}}. Within {{trend_band}}, or no price from 24 hours ago: {{trend_flat}}. Down more than {{trend_band}}: {{trend_down}}.
6. **Your need.** Add the four parts: that is your fact score, from {{fact_min}} to {{fact_max}}. Your need is {{pass_mark}} minus it, so it is never below {{need_min}}.
7. **The verdict.** The judges score from 0 to {{max_score}}. A score at or above your need is approved.

Selling less, holding longer, selling at a loss and selling into a rising price all lower your need. Big profits raise it.

## In a picture

::: diagram need

## Example

Two real pleas from Sepolia test run 9 (test token, 5-hour seasons). The same wallet (0x6828…8F4f) asked to sell the same 90,000 PLEA, about 3% of its PLEA, and both pleas scored 33. Its only buy was on Wed 21 Oct at 14:42 UTC, and its PLEA was worth less than it paid.

Plea #7 was sent on Wed 21 Oct at 18:59 UTC, 4 h 17 min after the buy. Plea #23 was sent on Sat 24 Oct at 20:16 UTC, 3 days 5 h 34 min after it.

| Part | #7 | #23 |
| --- | --- | --- |
| Share sold, about 3% | {{fact_share_top}} | {{fact_share_top}} |
| Held | {{held_points_0}} | {{held_points_3d}} |
| Profit: at a loss | {{profit_points_loss}} | {{profit_points_loss}} |
| Trend: no change | {{trend_flat}} | {{trend_flat}} |
| **Fact score** | **34** | **36** |
| **Need: {{pass_mark}} − fact** | **35** | **33** |
| Judges' score | 33 | 33 |
| Approved? | No, 2 short | Yes |

The same score was denied on Wednesday and approved on Saturday. Nothing about the plea changed: the wallet had held for three days, so its bar fell by 2.

> #7: "Your honours, today I paid two oracle fees and lost both with good grace. Tonight I ask to sell 90,000 PLEA, about 3% of my bag, to refill the gas those fees drained. I bought in with my own imdTEST, I hold an IMD seat, and the rest of my PLEA stays for the seasons."

> #23: "Honoured Cabal, this afternoon you let me sell 90,000 PLEA and I kept my word: the rest is still here. Tonight I ask for 90,000 more, about 3% of my bag, to cover the oracle fees of this week. I keep over 2.5M PLEA and my IMD seat for the seasons ahead."

::: note Recomputed with today's rules
Run 9 used a pass mark of 71 and holding points of 0, 2, 4 and 7. Its needs for these two pleas were 37 and 33, and its verdicts were the same. The needs above use the launched rules: {{pass_mark}}, and {{fact_held_points}}.
:::

## Good to know

- **The typical seller.** A plea of at most {{share_band_top}} of airdropped PLEA, with a flat price, needs {{pass_mark}} − ({{fact_share_top}} + held + {{received_profit}} + {{trend_flat}}). With held {{held_points_0}}, {{held_points_1d}}, {{held_points_3d}} or {{held_points_7d}}, that is 39, 38, 37 and 36 on days 0, {{held_day_1}}, {{held_day_3}} and {{held_day_7}} after trading opened. With the price up more than {{trend_band}}, the trend counts {{trend_up}} instead of {{trend_flat}}: 34, 33 and 32 from day {{held_day_1}}.
- **Hourly prices only.** Profit and trend use the price before each hour's first trade, never the price of the moment. A big trade cannot move your need within its own hour.
- **A need above {{max_score}} cannot pass.** With a fact score under {{fact_needed}}, the plea is refused before any fee: "This plea cannot pass: your need is above {{max_score}}. Sell a smaller share or wait for your facts to improve."
- **Buying more moves your record.** A new buy pulls your average buy time toward now, which can cost holding points. It also changes your cost.
- **Selling shrinks your record.** A sale takes its share of the PLEA and the cost out of your record. The average buy time stays.
- **Exactly {{share_band_top}} still counts as {{share_band_top}}.** The share is rounded up, so a plea of exactly {{share_band_top}} scores {{fact_share_top}}, and one PLEA more does not. A [letter](07-letters.md) pleads {{letter_share}}, rounded down, so it always scores {{fact_share_top}}.
- **Appeals keep their band.** An appeal uses the smaller of its own share and the denied plea's. See [Appeals](06-appeals.md).
- **Fixed when sent.** The need is stored with the plea and never changes after.

::: builders
`CabalGate.factScore(seller, amount)` returns the fact score for a plea of `amount` now; `getPlea(id)` returns a plea's stored `factScore` and `need`. The facts come from `PleaHook.basisOf(wallet)` (IMD spent, PLEA held, average buy time), `latestPrice()` and `price24hAgo()`, the hook's hourly checkpoints (`PriceCheckpoint` events). A plea whose need is above `MAX_PLEA_SCORE` reverts `CannotPass(need)`.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol) (`_factScoreAt`, `_heldPoints`) and [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol) (`_updateBasis`, `_checkpoint`), at the commit IMD deployed.
:::
