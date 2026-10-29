# Seasons and prizes

## In short

While the Cabal lives, approved pleas compete in seasons of {{season_length}}. Each approved plea earns its score as points, and your best {{best_count}} count.

When a season ends, the top {{top}} wallets with at least {{min_points}} points share its IMD prize pot. The first {{bonus_seasons}} seasons also share {{bonus_per_season}} each.

## How it works

1. **Seasons run back to back.** Season 1 starts the moment trading opens and lasts {{season_length}}. Season 2 starts when it ends, and so on. The [Seasons](#/seasons) page shows the season running now and its countdown.
2. **An approval earns points.** The judges' score of an approved plea is its points, from 0 to {{max_score}}. A plea counts in the season of its verdict. An approval that lapsed unsold counts too. So do letters and auto-sell pleas.
3. **A seat adds a fifth.** If your wallet holds an IMD seat NFT when the plea is recorded, its points are the score times {{seat_multiplier}}, rounded down: {{seat_example}}. The seat changes points only, never your need.
4. **Points wait for objections.** For {{objection_window}} after the verdict, others may object. If an objection is sustained, the plea earns nothing; if overruled, the lower score counts. See [Objection!](09-objection.md).
5. **Then someone records them.** Once the window is over, anyone may record the plea's points: press "Record my points" on its page. It must happen before the season is closed. Keepers do it for everyone, and the close records what is still missing. See [Keepers](14-keepers.md).
6. **Your best {{best_count}} count.** The leaderboard adds up each wallet's {{best_count}} best pleas of the season. That is at most {{max_points}} points, or {{max_points_seat}} with a seat.
7. **The pot fills.** Every trade pays {{fee_prize}} of its IMD to the pot of the season running now. Overruled objections add their {{objection_stake}} stake, and each auto-sell sale adds {{auto_sell_fee}}. See [Fees](11-fees.md).
8. **The close.** {{close_grace}} after a season ends, anyone may close it. The close pays the pot to the top {{top}} wallets with at least {{min_points}} points: {{share_first}} to 1st, down to {{share_last}} to {{top}}th.
9. **The PLEA bonus.** Each of the first {{bonus_seasons}} seasons also pays {{bonus_per_season}}, with the same shares and the same {{min_points}}-point bar.
10. **Leftovers.** A share nobody qualifies for is not paid to anyone else. Its IMD rolls over into the next season's pot. Its PLEA bonus is burned.

The owner does not play. Pleas from the owner's wallets earn no points, no prize and no bonus.

## In a picture

::: diagram season

## Example

A season's numbers, worked out. Season 1's pot holds 100 IMD at the close. Only 10 wallets have {{min_points}} points or more.

1. **mira_eth's pleas.** She holds an IMD seat. Her approved pleas this season scored 38, 36, 35 and 31.
2. **Her points.** Each score times {{seat_multiplier}}, rounded down: 38 × 1.2 = 45.6, so 45. 36 × 1.2 = 43.2, so 43. 35 × 1.2 = 42. 31 × 1.2 = 37.2, so 37.
3. **Her total.** Her best {{best_count}}: 45 + 43 + 42 = 130 points. The 37 does not count. Without a seat she would have 38 + 36 + 35 = 109.
4. **Her prize.** 130 is the season's best: 1st place. She gets {{share_first}} of the pot: 100 × {{share_first}} = 4.5 IMD. Season 1 is a bonus season, so she also gets {{share_first}} of {{bonus_per_season}}: 450,000 PLEA.
5. **The other qualified wallets.** Ranks 1 to 10 take these shares, in percent: 4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17 and 4.12. Together that is 43.13%, so 43.13 IMD is paid.
6. **What rolls over.** Ranks 11 to {{top}} are empty or under {{min_points}} points. Their shares are not paid: 100 − 43.13 = 56.87 IMD goes into season 2's pot.
7. **What burns.** The bonus pays 43.13% of {{bonus_per_season}}: 4,313,000 PLEA. The other 10,000,000 − 4,313,000 = 5,687,000 PLEA is burned.

Every rank's share, 1st to {{top}}th, in percent: {{shares_list}}. They add up to 100%.

## Good to know

- **Keep your seat where you sell.** The seat is checked when the plea is recorded, and anyone may record it the moment its window closes. Hold the seat in the selling wallet from the verdict on.
- **The {{min_points}}-point bar is the same for everyone.** The seat raises your points, not the bar.
- **Ties.** Two wallets with the same points: the one whose newest counted plea came first ranks higher.
- **Too early to record.** While the objection window is open, or an objection waits for its panel, the site says: "Points are held while objections are open or a panel is pending. Wait for the window to end."
- **Too late to record.** Once the plea's season is closed, its points are lost: "This season has already closed. Its points can no longer change." The close records every approval its caller lists; the keepers list them all.
- **Recorded once.** "These points were already recorded. Refresh to see them."
- **No points after a sustained objection.** "An objection was sustained. This plea earns no points."
- **The owner's wallets.** "This wallet is excluded from season prizes. Use an eligible holder wallet." If the owner's wallet is on the leaderboard, its place is skipped: its share rolls over, and its bonus share burns.
- **Too early to close.** Before the season has ended and {{close_grace}} has passed: "The season cannot close yet. Wait until the grace period ends." Seasons close one at a time, oldest first.
- **Each pot is its own season's.** A close pays that season's fees plus what earlier seasons rolled over. Fees that arrive after the season ended belong to the next one.
- **A failed payment stays in the pot.** If a prize cannot be sent to a wallet, it rolls over with the rest.
- **The bonus is locked.** {{bonus_total}} waits in the Seasons contract for the first {{bonus_seasons}} seasons. Nobody can take it out; it is paid out or burned.
- **When the Cabal dies.** The running season ends at that moment and is closed as usual. After the last close, anyone may send what is left of the pot to the buy wall, which also burns the bonus that is left. See [The dead-man](13-dead-man.md).

::: builders
`Seasons`: `record(pleaId)` records an approved plea's points; `closeSeason(pleaIds)` records the listed pleas, then closes the oldest open season and pays it; `flushToWall()` sends what is left to the hook's wall once the Cabal is dead and its last season closed. Views: `currentSeason()`, `seasonBounds(season)`, `topOf(season)`, `bestOf(season, wallet)`, `pointsFor(wallet, score)`, `pointsOf(pleaId)`, `shareBps(rank)`, `pot()`, `seasonFees(season)`, `rollover()`, `nextToClose()`, `excluded(wallet)`, `holdsSeat(wallet)`. The contract counts seasons from 0: the site's season 1 is season 0. `checkpoint()` books IMD sent to the contract to the running season.

Constants: `MIN_POINTS`, `TOP`, `CLOSE_GRACE`, `BONUS_SEASONS`, `BONUS_PER_SEASON`, `SEAT_MULTIPLIER_BPS`, `SEASON`. Events: `Recorded`, `SeatMultiplier`, `PrizeFunded`, `SeasonClosedOut`, `PrizePaid`, `BonusPaid`, `BonusBurned`, `LeftoverToWall`. Errors: `NotApproved`, `AlreadyRecorded`, `OwnerExcluded`, `SeasonClosed`, `Held`, `ObjectionSustained`, `NotReady`, `NotFinished`.

Source: [Seasons.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Seasons.sol), at the commit IMD deployed.
:::
