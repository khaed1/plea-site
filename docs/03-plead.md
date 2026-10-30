# Selling: plead

## In short

While the Cabal lives, the only way to sell PLEA is a plea: you write why, choose how much, and pay the {{oracle_fee}} oracle fee.

The Cabal usually answers within minutes. Approved, you have {{sell_window}} to sell; denied, you may appeal once, or wait and try again.

## How it works

1. **Write your plea.** 1 to {{max_plea_bytes}} bytes of text, in any language, on one line. Tell the judges why you want to sell. See [The judges](05-judges.md) for what they score.
2. **Choose the amount.** At least {{min_share}} of your PLEA and at most {{max_share}}, and never more than {{max_sell}}.
3. **Check your need.** The [Plead](#/plead) page shows your fact score and your need before you send. If your need is above {{max_score}}, not even a perfect plea can pass, so the contract refuses it and you pay nothing. See [Your bar](04-your-bar.md).
4. **Send it.** One transaction pays the {{oracle_fee}} oracle fee in IMD (the site asks you to approve it once). Your plea, its amount, your fact score and your need are stored on Ethereum.
5. **Wait for the verdict.** {{panel_size}} judges score your plea. If the score is at least your need, it is approved; if not, denied.
6. **Approved: sell.** Press Sell now within {{sell_window}}. The whole amount sells in one go, for at least the minimum the page shows: the quote less 1%. Miss the window and the approval lapses: nothing is sold, but its points still count.
7. **Denied: appeal or wait.** You may appeal once within {{appeal_window}}. See [Appeals](06-appeals.md).
8. **No verdict.** If no verdict comes within {{pending_expiry}}, anyone may close the plea. You may plead again at once. The fee is spent.
9. **Cooldown.** After a sale, a denial or a lapse, your next plea waits {{cooldown}}. A lapse counts from the moment of the approval.

Prefer not to sell by hand? Tick the [auto-sell box](08-auto-sell.md) and anyone may sell it for you. Or plead without the site, by [letter](07-letters.md).

## In a picture

::: diagram plea-states

## Example

You hold 3,000,000 PLEA, bought this morning, now worth a little less than you paid. The price is flat. You plead to sell 200,000 PLEA.

1. **The limits.** At least {{min_share}} of 3,000,000 = 30,000 PLEA. At most {{max_share}} = 1,500,000 PLEA, which is under {{max_sell}}. 200,000 fits.
2. **Your need.** You sell 6.67%: {{fact_share_top}} points. Held under a day: {{held_points_0}}. At a loss: {{profit_points_loss}}. Flat price: {{trend_flat}}. Fact score {{fact_share_top}} + {{held_points_0}} + {{profit_points_loss}} + {{trend_flat}} = 34, so your need is {{pass_mark}} − 34 = 35.
3. **12:00 UTC.** You send the plea and pay {{oracle_fee}}. It is PENDING.
4. **12:04.** The Cabal answers: 37 vs need 35. APPROVED. You may sell until 12:11, {{sell_window}} after the approval.
5. **12:06.** You press Sell now. SOLD. Your next plea can come from 16:06, {{cooldown}} after the sale.

The same plea could have ended three other ways:

- **Not sold by 12:11.** LAPSED. Your next plea can come from 16:04, {{cooldown}} after the approval.
- **33 vs need 35 at 12:04.** DENIED. You may appeal until 16:04, or plead again from 16:04.
- **No answer by 12:20**, {{pending_expiry}} after you sent it. NO VERDICT. Anyone may close it, and you may plead again at once. The {{oracle_fee}} is spent.

## Good to know

- **Text the contract refuses.** Line breaks, invisible characters (zero-width spaces, direction marks), some emoji that carry an invisible style character, and the markers "[PLEA" and "[OBJECTION" in any case. The checks under the text box flag them. The site says: "Your plea contains refused text. Fix the checks under the text box."
- **Bytes, not letters.** English letters take one byte each. Accented letters, Greek, Cyrillic, Arabic and Hebrew take two, Chinese, Japanese and Korean three, emoji four. So {{max_plea_bytes}} bytes is about {{max_plea_bytes}} English letters, or {{max_plea_bytes}} ÷ 3 = about 93 Chinese characters.
- **Too much or too little.** The site says: "The amount is over the limit. Reduce it or press Max." or "The amount is below the minimum. Increase it to the minimum shown."
- **Big holders.** Above {{min_share_cap_balance}}, {{min_share}} of your PLEA is more than {{max_sell}}. Then the least and the most a plea may sell are both {{max_sell}}.
- **A need above {{max_score}}.** The site says: "This plea cannot pass: your need is above {{max_score}}. Sell a smaller share or wait for your facts to improve." Nothing is paid.
- **One plea at a time.** While a plea waits for its verdict, or is approved and not yet sold, a new one is refused: "You already have an open plea. Open its status page first."
- **The cooldown.** A plea sent too soon is refused: "Your cooldown is still running. Wait until the time shown before sending another plea."
- **Too late to sell.** After the window the plea's page shows it as lapsed. A sale mined just after the window is refused: "The window closed at 12:11:00 UTC. Plea #… lapsed: nothing was sold. Your +37 points still count. Next plea at 16:04 UTC."
- **The price moved.** The sale's minimum is fixed at 1% under the quote: there is no slippage to choose. If the price has already fallen past it when you press Sell now, nothing is sent and the site says "The price moved: the sale now gets about …"; the page shows the new quote, and pressing Sell now again sells at it. If the price falls further before the sale is mined, nothing is sold, and you may try again inside the window: "The price moved more than 1%. Nothing was sold; your PLEA stays in your wallet. The window is open until 12:11:00 UTC: try again."
- **The sale pays the usual fee.** {{fee_total}} of every trade, as on a buy. Your buy record shrinks by the share you sold. See [Fees](11-fees.md).
- **The fee is spent.** The {{oracle_fee}} pays the judges, whatever the verdict.
- **Your need is fixed when you send.** The facts use hourly prices, so the need the site shows changes only with a new hour, a change in your balance or another day held.
- **When the Cabal is not watching.** Before trading opens and after the Cabal dies, a plea is refused: "The Cabal is not taking pleas. Check whether trading has opened or the Cabal has died." After the death you sell like any token, with no plea.
- **Public for good.** Your plea's text is stored on Ethereum next to your wallet.

::: builders
`CabalGate.submitSell(amount, text)` pleads; it pulls `ORACLE_FEE` in IMD from the caller, so approve the gate first. `factScore(seller, amount)` gives the fact score it will use. `executeSell(minOut)` sells the caller's approved plea; `expire(id)` closes a plea with no verdict once it is stale. `getPlea(id)` returns the stored plea; its `status` is `Pending`, `Approved`, `Denied`, `Executed` (sold), `Lapsed` or `Expired` (no verdict). A lapse is written when the seller next pleads; until then an unsold approval past its window still reads `Approved`.

Errors: `BadPleaText`, `AmountTooLarge`, `AmountTooSmall`, `CannotPass(need)`, `PendingExists`, `Cooldown(until)`, `CabalNotWatching`, `NotApproved`, `WindowLapsed`, `SlippageExceeded(out, minOut)`. Events: `PleaSubmitted`, `Verdict`, `SellExecuted`, `PleaLapsed`, `PleaExpired`, `PleaFailed`.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), at the commit IMD deployed.
:::
