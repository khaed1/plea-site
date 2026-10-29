# Buying

## In short

Anyone can buy PLEA with IMD, or with ETH or USDC turned into IMD in the same transaction, from the moment trading opens. Buy on the site's [Buy](#/buy) page: while the Cabal lives, many other apps cannot.

The first {{launch_window}} are the launch window: buys pay an extra fee that falls from {{launch_extra}} to 0%, and one buy may take at most {{launch_max_buy}}.

## How it works

1. **Trading opens.** From {{start}} anyone may open trading; the owner may open it earlier. The pool opens at a market cap of {{market_cap}}, about {{seed_price}} a PLEA.
2. **You pay IMD, you get PLEA.** Every trade pays a fee: {{fee_imd}} of the IMD that reaches the pool, and {{fee_burn}} of the PLEA, burned. Of the IMD part, {{fee_cashback}} comes back to you as staked IMD. See [Fees](11-fees.md).
3. **Or pay with ETH or USDC.** Choose it under Pay with on the [Buy](#/buy) page. In one transaction, the ETH buys IMD on IMD's own ETH pool, which takes its {{pay_imd_pool_fee}} fee, and that IMD buys PLEA as above. USDC first buys ETH on Uniswap's USDC/ETH pool, which takes {{pay_usdc_pool_fee}} plus Uniswap's {{pay_usdc_protocol_fee}}. ETH needs no approval. USDC needs two first, each for exactly the amount: one lets Permit2 move it, the other lets Uniswap's router take it through Permit2 for {{pay_permit_life}}.
4. **The launch window.** For the first {{launch_window}}, a buy also pays a launch fee. It starts at {{launch_extra}} of the IMD that reaches the pool and falls in a straight line to 0%. It stays in the pool, for the buy wall.
5. **The launch cap.** In the same window, one buy may take at most {{launch_max_buy}} from the pool. That is {{launch_max_buy_value}} at the opening price.
6. **Your buy record.** Each buy adds to your record: the IMD you paid, fees included, the PLEA you got, and their average buy time. A buy paid with ETH or USDC records the IMD it bought. Your pleas' fact scores are read from it. See [Your bar](04-your-bar.md).
7. **The PLEA stays with you.** While the Cabal lives, PLEA cannot be sent from wallet to wallet. What you buy stays in the wallet that bought it, until you sell it through a plea or the Cabal dies.

## In a picture

::: diagram launch-fee

## Example

You buy with 100 IMD, 30 minutes after trading opens.

1. **The launch fee.** {{launch_extra}} × ({{launch_window}} − 30 minutes) ÷ {{launch_window}} = 46.67%. The contract rounds it down to whole hundredths of a percent: 46.66%.
2. **The whole fee.** The usual {{fee_imd}} + 46.66% = 48.66% of the IMD that reaches the pool.
3. **What reaches the pool.** 100 ÷ 1.4866 = 67.268 IMD. The fee is the rest: 100 − 67.268 = 32.732 IMD.
4. **Where the fee goes.** {{fee_cashback}} of 67.268 = 0.336 IMD back to you, as staked IMD. {{fee_owner}} = 0.673 IMD to the owner. {{fee_prize}} = 0.168 IMD to the season's prize pot. The rest stays in the pool for the buy wall: 32.732 − 0.336 − 0.673 − 0.168 = 31.555 IMD.
5. **What you get.** If the price were still the opening {{seed_price}}, 67.268 IMD would buy about 3.36 million PLEA, a little less after the price moves. That is under the {{launch_max_buy}} cap. Then {{fee_burn}} of it is burned.
6. **Your record.** It grows by 100 IMD paid and the PLEA you received, bought at minute 30.

After the launch window the same 100 IMD pays only the usual {{fee_imd}}: 100 ÷ 1.02 = 98.039 IMD reaches the pool, and the fee is 1.961 IMD.

At the very open the whole fee is {{launch_open_fee}} of what reaches the pool. That is {{launch_open_fee_of_payment}} of what you pay.

### Paying with ETH {#paying-with-eth}

You pay 0.05 ETH, after the launch window.

1. **IMD's ETH pool.** Its {{pay_imd_pool_fee}} fee is 0.05 × 1% = 0.0005 ETH. The other 0.0495 ETH buys IMD at the pool's price. On a copy of Ethereum with PLEA's own contracts, it bought 25.348 IMD.
2. **PLEA's pool.** Those 25.348 IMD buy PLEA exactly as a 25.348 IMD buy would: 25.348 ÷ 1.02 = 24.851 IMD reaches the pool, and the fee is 25.348 − 24.851 = 0.497 IMD, of which {{fee_cashback}} of 24.851 = 0.124 IMD comes back to you as staked IMD.
3. **What you get.** On that copy the buy brought 1,234,112 PLEA, the Buy page's quote to the last digit. Your record grows by the 25.348 IMD.

With USDC, the USDC/ETH pool first keeps {{pay_usdc_total_fee}} of it: {{pay_usdc_total_fee}} of 150 USDC is about 0.094 USDC. The ETH it buys then goes on as above.

## Good to know

- **Buy on the site.** While the Cabal lives, the pool sends the PLEA straight to the buyer. It only takes buys that say who the buyer is and spend an exact amount of IMD. Apps, aggregators and routers that expect the PLEA to come back to them, or cannot name the buyer, fail. The site's [Buy](#/buy) page is built for this pool.
- **"Get exactly this much PLEA" is refused.** While the Cabal lives you choose how much IMD to spend, never how much PLEA to get. The site says: "Exact-output buys are unavailable while the Cabal lives. Use the exact-input Buy control."
- **No buyer, no buy.** While the Cabal lives, a buy that names no buyer fails. The site says: "The buy needs your wallet as recipient. Reconnect in the top bar and try again."
- **Too big for the launch window.** A buy that would take more than {{launch_max_buy}} in the window fails. The Buy page keeps its button off and says: "This buy would take … before the burn. Until … one buy can take at most {{launch_max_buy}}. Pay less IMD, or split the buy in two." (ETH or USDC in place of IMD when you pay with them.) A buy that still reaches the pool too big is refused: "Not bought: more than {{launch_max_buy}} in one buy."
- **Too early.** Before trading opens, the pool does not exist yet, so no buy can work. The [Buy](#/buy) page says "Trading is not open yet." and keeps its button off.
- **Paying with ETH or USDC.** The Buy page asks Uniswap's Quoter how much IMD your ETH or USDC buys now, then works out the PLEA itself. Your slippage sets the least PLEA you accept: the minimum the page shows is the one your buy is sent with. If the price has already moved past it when you press Buy, nothing is sent and the site says "The price moved: the new quote is …"; press Buy again to buy at the new quote. If the prices move further before your buy is mined, it fails and the site says: "The price moved more than 1%. Nothing was bought; your ETH stays in your wallet." You pay only the gas.
- **Big buys move IMD's ETH pool.** The pool is small: on 2026-10-29, 1 ETH bought 5.7% less IMD per ETH than 0.01 ETH did. The Buy page shows the IMD per ETH (or USDC) your buy gets and how far that is below the pools' price after their fees. From {{pay_impact_confirm}} below, it asks you to tick "Buy anyway" first. Smaller buys, or a few spread over time, get more.
- **Keep ETH for gas.** Max with ETH leaves enough for the gas. If your wallet has too little, the site says so and suggests another currency.
- **When the route cannot quote.** If Uniswap's Quoter cannot price your ETH or USDC, the Buy page keeps its button off and says why, for example: "Uniswap's Quoter found no way to swap this ETH into IMD through IMD's ETH pool. Pay with IMD, or try again later."
- **Every buy pays its shares.** Every buy, even the first, pays its cashback, owner and prize shares.
- **Your record moves with you.** A sale takes its share out of your record, so the rest keeps its cost and age. PLEA you received, not bought, has no record: it counts as held since trading opened.
- **After the Cabal dies.** Buys work like on any pool: other apps can route to it once they list it. A buy that names no buyer gets no cashback.

::: builders
The fee and the launch rules live in the pool's hook, `PleaHook`: `beforeSwap` and `afterSwap`, `launchExtraBps()`, the constants `LAUNCH_WINDOW`, `LAUNCH_EXTRA_BPS`, `LAUNCH_MAX_BUY` and `IMD_FEE_BPS`, and the event `FeesTaken`. `basisOf(wallet)` returns a wallet's buy record: IMD spent, PLEA held and the average buy time.

The buyer is read from `hookData` (`abi.encode(address)`), else from the router's `msgSender()`, else from a plain wallet calling the pool manager. Refusals: `RecipientRequired`, `ExactOutputBuyRefused`, `BuyTooLarge`, and `NotEnoughGas` when a trade reaches the hook with less than {{swap_min_gas}} gas. Before trading opens the pool is not initialized (only `seed()` creates it), so the PoolManager refuses a swap with `PoolNotInitialized` before the hook is called. The site buys through Uniswap's Universal Router with Permit2. A buy paid with ETH or USDC is one `execute`: `V4_SWAP` with `SWAP_EXACT_IN` over a v4 path (USDC → ETH on the USDC/ETH pool, ETH → IMD on IMD's ETH pool, IMD → PLEA with `hookData` naming the buyer), `SETTLE_ALL` of the ETH (the transaction's value) or the USDC (through Permit2), `TAKE_ALL` of PLEA with 0, then `BALANCE_CHECK_ERC20` on the buyer's PLEA, which holds the minimum: while the Cabal lives the hook sends the PLEA straight to the buyer, so the router and the Quoter see none. The quote is Uniswap's V4 Quoter (`quoteExactInput`) for the part up to IMD, then the site's own walk of PLEA's pool.

Source: [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol), at the commit IMD deployed.
:::
