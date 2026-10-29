# Fees

## In short

Every trade, buy or sale, pays {{fee_total}}: {{fee_imd}} of its IMD and {{fee_burn}} of its PLEA, taken inside the trade, with nothing to claim later.

The IMD part has four shares: {{fee_cashback}} back to you, {{fee_owner}} to the owner, {{fee_prize}} to the season's prize pot and {{fee_pool}} to the buy wall. The PLEA part is burned.

## How it works

1. **The IMD that counts.** On a buy, the fee is {{fee_imd}} of the IMD that reaches the pool, on top: you pay that IMD plus the fee. On a sale, it is {{fee_imd}} of the IMD the pool pays out, and you get the rest.
2. **The PLEA that burns.** On a buy, {{fee_burn}} of the PLEA the pool sends you is burned. On a sale, {{fee_burn}} of the PLEA that reaches the pool is burned, on top of it.
3. **{{fee_cashback}} back to you.** It comes back as staked IMD (sIMD), through imd/acc, in the same transaction. Your [Profile](#/profile) shows what you have earned.
4. **{{fee_owner}} to the owner.** It goes to one fixed address, set at the launch. Nobody can change it. See [Contracts and owner](15-contracts.md).
5. **{{fee_prize}} to the prize pot.** It goes to the pot of the season running now. Once the Cabal is dead there are no seasons, and this share goes to the buy wall instead. See [Seasons and prizes](10-seasons.md).
6. **{{fee_pool}} to the buy wall.** It stays in the pool, and becomes part of the buy wall at the next rebalance. See [The pool](12-pool.md).
7. **The launch fee.** In the first {{launch_window}} after trading opens, buys pay an extra fee that falls from {{launch_extra}} to 0% of the IMD that reaches the pool. It stays in the pool, for the buy wall. See [Buying](02-buying.md).
8. **Every sale pays it.** A sale by hand, a letter's or auto-sell plea's sale, and the small sale that pays a letter's fees: each pays the same {{fee_total}}.

## In a picture

::: diagram fee-bar

## Example

A 100 IMD buy, after the launch window.

1. **What reaches the pool.** The fee is {{fee_imd}} of what reaches the pool, so 100 IMD splits as 100 × 100 ÷ 102 = 98.04 IMD to the pool and 1.96 IMD of fee.
2. **Back to you.** {{fee_cashback}} of 98.04 = 0.49 IMD, as staked IMD.
3. **The owner.** {{fee_owner}} of 98.04 = 0.98 IMD.
4. **The prize pot.** {{fee_prize}} of 98.04 = 0.245 IMD.
5. **The buy wall.** {{fee_pool}} of 98.04 = 0.245 IMD.
6. **Check.** 0.49 + 0.98 + 0.245 + 0.245 = 1.96 IMD, the whole fee.
7. **The burn.** Of every 100,000 PLEA the pool sends you, {{fee_burn}} = 250 PLEA is burned and 99,750 reach your wallet.

A sale works the other way round. Say the pool pays out 50 IMD for your PLEA. The fee is {{fee_imd}} of 50 = 1 IMD: 0.25 IMD back to you, 0.5 to the owner, 0.125 to the prize pot and 0.125 to the buy wall. You receive 49 IMD. If 1,000,000 PLEA reached the pool, you sent 1,002,500 PLEA, and the 2,500 on top are burned.

## Good to know

- **Fixed for good.** Every rate here is a constant in the code. No one, the owner included, can change a fee.
- **No pool fee on top.** The pool's own trading fee is {{lp_fee}}. Every fee is the one on this page.
- **The very first buys.** While the pool's own IMD plus a buy's fee is under {{payout_reserve}}, and the pool cannot pay out yet, that buy's cashback, owner and prize shares stay in the pool, for the buy wall.
- **No buyer, no cashback.** After the Cabal dies, a trade through a router that does not name its trader pays no cashback. That share stays in the pool.
- **If staking fails.** If imd/acc cannot stake your cashback, you get it as plain IMD in the same trade.
- **Enough gas.** A trade must still have {{swap_min_gas}} gas when it reaches the pool's hook, for the cashback. With less, it fails and the site says: "The swap needs more gas for cashback. Retry with a fresh estimate." Let your wallet estimate the gas.
- **Other costs, not trade fees.** A plea or an appeal pays the {{oracle_fee}} oracle fee, and an appeal {{appeal_wall_share}} more for the buy wall. An objection pays {{oracle_fee}} and a {{objection_stake}} stake. A letter or auto-sell plea adds a {{runner_tip}} tip, and an auto-sell sale {{auto_sell_fee}} for the prize pot. Every transaction also pays Ethereum gas.
- **The launch window's fee is large.** At the very open a buy pays {{launch_open_fee}} of what reaches the pool, which is {{launch_open_fee_of_payment}} of what you pay. See [Buying](02-buying.md).

::: builders
`PleaHook` takes every fee inside the swap (`beforeSwap` / `afterSwap`) and pays it in `_payFees`. On the IMD side the rate is `IMD_FEE_BPS` (`CASHBACK_BPS` + `OWNER_BPS` + `PRIZE_BPS` + `POOL_BPS`), plus `launchExtraBps()` on buys; on the PLEA side `PLEA_BURN_BPS`. An exact-input fee is `amount × rate ÷ (10,000 + rate)`, an exact-output fee `amount × rate ÷ (10,000 − rate)`. The cashback is credited through the Stacker (`stacker.credit`), plain IMD if that reverts. When the PoolManager cannot pay a payout in the same swap, it is minted as an ERC-6909 IMD claim instead.

Events: `FeesTaken(trader, buy, imdBasis, imdFee, pleaBurned, toPrize)`, `CashbackStacked`, `CashbackPaidPlain`, `CashbackPaidClaims`, `PayoutsToPool`, `FeeRefunded`. Totals: `totalCashback()`, `totalOwnerFees()`, `totalPrize()`, `totalPoolFees()`, `totalBurned()`. Error: `NotEnoughGas(needed, left)`.

Source: [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol), at the commit IMD deployed.
:::
