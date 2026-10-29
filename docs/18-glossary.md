# Glossary

## In short

Every word these docs use, in a line or two. Each one links to the page that explains it.

The words follow a plea's life first, then come again from A to Z.

## How it works

The words in the order you meet them.

1. You **buy** PLEA against **IMD**. The pool keeps your **buy record**: what you paid and when.
2. To sell, you write a **plea** and pay the **oracle fee**. The contract scores four facts about the sale, your **fact score**, and sets your **need**: the **pass mark** minus the fact score.
3. The **Cabal**, a panel of IMD's judges, scores your plea. A **quorum** must agree. Their answer is the **verdict**: **approved** or **denied**, or **no verdict** at all.
4. Approved: you sell within the **sell window**. Unsold, the approval **lapses**. Denied: you may **appeal** once. After a sale, a denial or a lapse comes the **cooldown**.
5. A **letter** or the **auto-sell** box keeps the PLEA in **escrow**; a **runner** **delivers** the sale and earns the **tip**.
6. For a short while, others may lodge an **objection**, with a **stake**.
7. An approval earns **points** in a **season**; a **seat** raises them. The best wallets share the **pot**, and in the first seasons the **bonus**.
8. Every trade pays the **fee**: some comes back as **cashback**, some fills the **buy wall**. PLEA sold back above the **cap** is burned in a **trim**.
9. **Keepers** do the upkeep. If no verdict comes for long enough, the **dead-man** rule ends the Cabal.

## In a picture

::: diagram word-map

## A to Z

- **Allowed sender.** An address the owner lets send PLEA freely while the Cabal lives. Added for good, never removed. [Contracts and owner](15-contracts.md).
- **Appeal.** One more try after a denial: within {{appeal_window}}, the same amount or less, for {{appeal_total}}. [Appeals](06-appeals.md).
- **Approved.** The judges' score reached your need. You may sell within {{sell_window}}. [Selling: plead](03-plead.md).
- **Auto-sell.** The site's box that lets anyone sell your approved plea for you. Fees in PLEA, and {{auto_sell_fee}} of the sale to the prize pot. [The auto-sell box](08-auto-sell.md).
- **Bonus.** {{bonus_per_season}} in each of the first {{bonus_seasons}} seasons, shared like the pot. [Seasons and prizes](10-seasons.md).
- **Buy record.** What your buys cost and their average time, kept by the pool's contract for your fact score. [Your bar](04-your-bar.md).
- **Buy wall.** The pool's kept IMD, placed as buy orders just below the price. [The pool](12-pool.md).
- **Cabal.** The panel of {{panel_size}} IMD judges that scores pleas. It lives while verdicts keep coming. [The judges](05-judges.md).
- **Cap.** The most PLEA the pool may hold. It follows the pool's PLEA down and never rises. [The pool](12-pool.md).
- **Cashback.** {{fee_cashback}} of every trade's IMD, back to the trader as staked IMD. [Fees](11-fees.md).
- **Claim list.** Who may claim the distributor's {{supply_distributor}}. The owner sets it once. [Contracts and owner](15-contracts.md).
- **Cooldown.** {{cooldown}} after a sale, a denial or a lapse before your next plea. [Selling: plead](03-plead.md).
- **Dead-man.** The rule that ends the Cabal after {{deadman}} without a verdict, for good. [The dead-man](13-dead-man.md).
- **Deliver.** To sell a letter's or an auto-sell plea's escrow for its writer, within the sell window. [Letters](07-letters.md).
- **Denied.** The judges' score fell short of your need. [Selling: plead](03-plead.md).
- **Escrow.** The PLEA a letter or an auto-sell plea leaves in the Letterbox while it is judged. [Letters](07-letters.md).
- **Fact score.** Points from four facts about your sale: the share you sell, how long you held, your profit or loss, and the price trend. From {{fact_min}} to {{fact_max}}. [Your bar](04-your-bar.md).
- **Fee.** {{fee_total}} of every trade. [Fees](11-fees.md).
- **Hourly price.** The pool's price just before each hour's first trade. Your fact score uses it, never the price of the moment. [Your bar](04-your-bar.md).
- **IMD.** The token PLEA trades against, and the one fees are paid in. Also the launchpad that launched PLEA, whose judges are the Cabal. [Start here](01-start-here.md).
- **Intake.** IMD's contract that takes a question to the judges and brings back their signed answer. [Contracts and owner](15-contracts.md).
- **Keeper.** Anyone who does the upkeep: delivering, returning escrows, recording points, closing seasons. [Keepers](14-keepers.md).
- **Lapsed.** Approved, but not sold within the sell window. Nothing is sold; the points still count. [Selling: plead](03-plead.md).
- **Launch window.** The first {{launch_window}} of trading: an extra fee on buys, and at most {{launch_max_buy}} a buy. [Buying](02-buying.md).
- **Letter.** A plea sent as a plain text transaction to the Letterbox, without the site. [Letters](07-letters.md).
- **Need.** The score your plea must reach: {{pass_mark}} minus your fact score. [Your bar](04-your-bar.md).
- **No verdict.** No answer within {{pending_expiry}}. The fee is spent; there is no cooldown. [Selling: plead](03-plead.md).
- **Objection.** A challenge to an approval's score, within {{objection_window}}, for {{objection_total}}. [Objection!](09-objection.md).
- **Oracle fee.** The {{oracle_fee}} paid to the judges for each plea, appeal or objection, whatever the verdict. [Selling: plead](03-plead.md).
- **Overturned, upheld.** An appeal approved, an appeal denied. [Appeals](06-appeals.md).
- **Pass mark.** {{pass_mark}}: your need is the pass mark minus your fact score. [Your bar](04-your-bar.md).
- **Plea.** Your written case to sell: 1 to {{max_plea_bytes}} bytes, in any language. [Selling: plead](03-plead.md).
- **Points.** An approved plea's score, times {{seat_multiplier}} with a seat. Your best {{best_count}} count in a season. [Seasons and prizes](10-seasons.md).
- **Pot.** A season's prize pot, in IMD. [Seasons and prizes](10-seasons.md).
- **Quorum.** {{quorum}} of the {{panel_size}} judges must agree for a verdict. [The judges](05-judges.md).
- **Rebalance.** Anyone's call that burns what the buy wall bought and places the wall again. [The pool](12-pool.md).
- **Record.** To write an approved plea's points into its season, once its objection window is over. [Seasons and prizes](10-seasons.md).
- **Rollover.** The unpaid part of a season's pot, carried into the next season's. [Seasons and prizes](10-seasons.md).
- **Runner.** Whoever delivers a letter's sale, and earns the tip. [Letters](07-letters.md).
- **Season.** {{season_length}} of play. When it ends, the top {{top}} wallets with {{min_points}} points or more share the pot. [Seasons and prizes](10-seasons.md).
- **Seat.** An IMD seat NFT. Held in the selling wallet, it multiplies a plea's points by {{seat_multiplier}}. [Seasons and prizes](10-seasons.md).
- **Sell window.** The {{sell_window}} after an approval. [Selling: plead](03-plead.md).
- **Settle.** To give a letter's escrow and tip back when no sale will happen, or to pay out an objection's stake. [Keepers](14-keepers.md).
- **sIMD.** Staked IMD, the form your cashback takes. [Fees](11-fees.md).
- **Stake.** The {{objection_stake}} an objector puts down: back if the objection is sustained or void, to the pot if overruled. [Objection!](09-objection.md).
- **Sustained, overruled, void.** An objection's three endings: the plea loses its points; the plea keeps them, at the lower score; no ruling came. [Objection!](09-objection.md).
- **Tick.** The pool's smallest price step, 0.01%. [The pool](12-pool.md).
- **Tip.** The {{runner_tip}} paid to whoever delivers a letter's sale. [Letters](07-letters.md).
- **Trim.** The burn of PLEA that a sale pushed above the cap. [The pool](12-pool.md).
- **Verdict.** The judges' signed answer: approved or denied. [The judges](05-judges.md).
- **The Wall.** The site's [Wall](#/wall) page: every plea and its verdict. Not the buy wall.

## Example

A plea's page might read: "APPROVED, 37 vs need 35, objections close in {{objection_window}}, +44 points once recorded, seat {{seat_multiplier}}". Word by word:

1. **APPROVED.** The verdict: the score reached the need. Sell within {{sell_window}}.
2. **37.** The judges' score, out of {{max_score}}.
3. **Need 35.** {{pass_mark}} minus the fact score: {{pass_mark}} − 34 = 35. Here the fact score is {{fact_share_top}} + {{held_points_0}} + {{profit_points_loss}} + {{trend_flat}} = 34: at most {{share_band_top}} of the PLEA, held under a day, at a loss, a flat price.
4. **Objections close in {{objection_window}}.** The objection window. Until it closes, the points wait.
5. **+44 points.** The seller holds a seat: 37 × 1.2 = 44.4, rounded down to 44. They count once someone records them.

## Good to know

- **Two walls.** The buy wall is IMD in the pool. The Wall is the site's page of pleas. They have nothing to do with each other.
- **Season numbers.** The site counts seasons from 1. The contracts count from 0, so the site's season 1 is the contract's season 0.
- **Contract names.** These docs name contracts only in the "For builders" boxes. Every one is on [Contracts and owner](15-contracts.md).
- **The site's words.** A stamp on the site, such as SOLD or NO VERDICT, means the same as the word here.
