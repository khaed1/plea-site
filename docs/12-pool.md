# The pool: cap, burn and the buy wall

## In short

PLEA trades in one pool, against IMD, and the pool's liquidity is locked forever.

A cap follows the pool's PLEA down as people buy, and PLEA sold back above it is burned. The IMD the pool keeps from fees and burns becomes a buy wall just below the price.

## How it works

1. **One pool.** PLEA and IMD, on Uniswap v4. It opens with {{supply_pool}} and no IMD, at a market cap of {{market_cap}}: {{seed_price}} a PLEA.
2. **Locked forever.** Only the pool's own contract can add liquidity, and nothing lets anyone take it out. Not the owner, not anyone.
3. **The cap.** It starts at the PLEA put in. As people buy, the pool holds less PLEA, and the cap follows it down. It may fall at most {{cap_decay_per_day}} a day, so it reaches its floor of {{cap_floor}} in {{cap_decay_days}} days at the fastest. It never rises.
4. **The trim.** If a sale leaves the pool holding more PLEA than the cap, the excess is taken out at once, with the same share of the pool's IMD. That PLEA is burned. The IMD is kept for the buy wall. The price does not move.
5. **What the wall is made of.** The {{fee_pool}} wall share of every trade, the launch fee, the {{appeal_wall_share}} of every appeal, and the IMD from trims. After the Cabal dies, also the prize share and what is left of the season pots. Anyone may add IMD too.
6. **The wall.** A rebalance places all the kept IMD as one band of buy orders, from the lowest price up to just below the price. If sellers push the price down into it, the wall buys their PLEA.
7. **The rebalance.** Anyone may run it when there is work: at least {{wall_threshold}} kept, at least {{wall_min_fill}} bought by the wall, or PLEA owed to the burn. It burns the PLEA the wall bought, then places the wall again. It pays the caller nothing.
8. **A slow climb.** The wall's top may follow a higher price by at most {{wall_guard}} ticks, {{wall_guard_pct}}, a day. It drops at once to a lower price. A short pump cannot lift the wall; the price must hold for days.

## In a picture

::: diagram pool

## Example

A first week, in round numbers.

1. **The open.** The pool holds all {{supply_pool}}, and the cap is the same.
2. **Day 1.** Buyers take 120,000,000 PLEA, so the pool holds 700,000,000. The cap may follow by only {{cap_decay_per_day}} a day, ({{supply_pool}} − {{cap_floor}}) ÷ {{cap_decay_days}}. After one day it is about 820 − 54.6 = 765.4 million. Sales may bring the pool back up to that with no trim.
3. **Day 3.** Two more days let the cap fall about 2 × 54.6 = 109.2 million more, to about 656.2 million. But a buy leaves the pool with 699,000,000 PLEA, and the cap never falls below what the pool holds: it stops at 699,000,000.
4. **A sale.** Next comes the largest sale a plea allows, {{max_sell}}. The trade's {{fee_burn}} burn comes off first: 2,500,000 × 25 ÷ 10,025 = about 6,234 PLEA. About 2,493,766 PLEA reach the pool, which would then hold 701,493,766: 2,493,766 over the cap.
5. **The trim.** Those 2,493,766 PLEA are burned at once. The same share of the pool's IMD, 2,493,766 ÷ 701,493,766 = 0.36% of it, is kept for the wall. The pool holds 699,000,000 PLEA again, at the same price.
6. **The wall.** At the next rebalance, that IMD joins the wall below the price.

And the wall's climb: if the price doubles in a day, the wall's top needs about 10 days to follow, because 10 days of {{wall_guard_pct}} make 1.0725 × 1.0725 × … (10 times) = about 2.

## Good to know

- **Burned is gone.** Every trim, every trade's {{fee_burn}} and every PLEA the wall buys is burned, and the supply shrinks. Home shows what has burned so far.
- **The cap only falls.** Once it has caught up with the pool's PLEA, every sale above it is trimmed, for good.
- **Quiet days.** The cap's daily allowance adds up over days with no trades, so the next trade can move it further. The wall's climb does not: at most one day's rise counts at a time.
- **Nothing to press for a trim.** It happens inside the sale itself. Nobody is paid for it.
- **The wall is not a promise.** It is IMD waiting to buy PLEA below the price. Enough selling can use it up.
- **The rebalance button.** When the wall has work, Home's Fees and supply panel shows "Rebalance buy wall". If there is nothing to do, the site says: "The buy wall has no work ready. Wait for more fees or a market move."
- **Not the Wall page.** The site's [Wall](#/wall) page lists every plea and its verdict. It has nothing to do with the buy wall.
- **A reference price.** The pool's contract also keeps a reference price that moves at most {{ref_step}} ticks a block. The wall sits below the lowest of the price now, the reference and its slow top, so one block's pump cannot reach it.
- **The opening price.** The pool's prices come in steps of {{tick_spacing}} ticks. The opening is rounded up to the next step, so it is {{seed_price_rounding}} above {{seed_price}}.
- **After the Cabal dies.** The same cap, trims and wall, with anyone free to sell. See [The dead-man](13-dead-man.md).

::: builders
`PleaHook` is the pool's only liquidity provider. `seed()` (through `PleaLaunch.seed`) places the hook's whole PLEA balance as one band; `beforeAddLiquidity` refuses anyone else (`LiquidityRestrictedToHook`), and no function removes liquidity except the trim and the wall's own close. The cap: `inventoryCap()`, `capDecayPerDay()`, `pendingTrim()`, `pleaInMarket()`, `imdInMarket()`, applied after every swap in `_applyCap`. The wall: `rebalance()`, `pendingRebalance()` (a hint: simulate first), `fundWall(amount)`, `wall()`, `wallImd()`, `pleaInWall()`, `retainedImd()`, `retainClaims()`, `pleaClaims()`, `wallGuardTick()`, `refTick()`. `totalBurned()` counts every burn.

Constants: `CAP_FLOOR`, `CAP_DECAY_DAYS`, `MIN_TRIM`, `WALL_THRESHOLD`, `WALL_MIN_FILL`, `WALL_GUARD_TICKS_PER_DAY`, `MARKET_CAP_IMD`, `TICK_SPACING`, `LP_FEE`. Events: `Seeded`, `CapRatcheted`, `Trimmed`, `WallDeployed`, `WallSettled`. Errors: `RebalanceNotNeeded`, `PriceMoved`.

Source: [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol), at the commit IMD deployed.
:::
