# The auto-sell box

## In short

On the [Plead](#/plead) page, the box "Sell automatically if approved" lets anyone sell your plea for you. You do not have to be there in the {{sell_window}} after the verdict.

It works like a [letter](07-letters.md): the fees are paid in PLEA and the amount waits in escrow. You choose any valid amount, and {{auto_sell_fee}} of a delivered sale goes to the season's prize pot. Selling by hand costs nothing extra.

## How it works

1. **Tick the box.** Write your plea and choose the amount as usual, then tick "Sell automatically if approved". Nothing to approve: the fees come out of your PLEA.
2. **Fees in PLEA.** Some of your PLEA is sold for {{letter_fee}}: the {{oracle_fee}} oracle fee and a {{runner_tip}} tip for whoever delivers the sale. The fee sale may spend PLEA worth up to {{fee_cap}} of the fees at the hourly price; what it does not spend comes back at once.
3. **Escrow.** The amount you plead waits in the Letterbox while the Cabal judges it, against the same need as any plea.
4. **Delivered.** Approved: within {{sell_window}}, anyone may deliver it, and earns the {{runner_tip}} tip. Press "Sell yourself" on the plea's page and you deliver it, and keep the tip.
5. **The auto-sell fee.** From a delivered sale, {{auto_sell_fee}} goes to the season's prize pot, never more than the sale. The rest of the sale is yours.
6. **Any other ending.** Denied, no verdict, or approved but not delivered in time: anyone may settle it, and your PLEA and the tip come back. Nothing is taken from a sale that did not happen. The oracle fee is spent.

## In a picture

::: diagram auto-sell

## Example

You hold 1,000,000 PLEA and plead to sell 100,000 with the box ticked. The hourly price is the opening {{seed_price}} a PLEA.

1. **Worth enough.** 100,000 × {{seed_price}} = 2 IMD, over the {{min_sale_value}} floor.
2. **The fees fit.** The fee sale may spend up to {{fee_cap}} of {{letter_fee}}: 0.825 IMD, which is 0.825 ÷ {{seed_price}} = 41,250 PLEA. That is under {{max_fee_share}} of your PLEA (100,000), and 100,000 + 41,250 fits in your 1,000,000.
3. **The fee sale.** About 38,400 PLEA are sold for the {{letter_fee}}, the trade's fee included; the rest of the 41,250 comes back at once.
4. **Delivered.** The sale must pay at least {{delivery_floor}} of the escrow's hourly value: 2 × {{delivery_floor}} = 1.857 IMD. {{auto_sell_fee}} goes to the prize pot, so you get at least 1.857 − {{auto_sell_fee}} = 1.507 IMD.

What the plea costs you in IMD, besides the usual trade fee:

| How it ends | Cost |
| --- | --- |
| By hand, whatever the verdict | {{oracle_fee}} |
| Auto-sell, delivered by a runner | {{letter_fee}} + {{auto_sell_fee}} = 1.1 IMD |
| Auto-sell, you press Sell yourself | {{letter_fee}} − {{runner_tip}} + {{auto_sell_fee}} = 0.85 IMD |
| Auto-sell, no sale | {{letter_fee}} − {{runner_tip}} = 0.5 IMD: the tip comes back |

## Good to know

- **Too small.** A plea worth less than {{min_sale_value}} at the hourly price is refused with the box ticked. The site says how much it is worth and asks you to "Raise the amount or untick auto-sell."
- **Too poor for the fees.** The fees may take at most {{max_fee_share}} of your PLEA, so the box needs PLEA worth about {{letter_min_value}} or more. The plea and the fee reserve must also fit your PLEA together. The site says which, and that nothing was sent.
- **The price fell.** If the price fell since the hourly price was taken, the fee sale may need more PLEA than its margin allows. The site says: "The price fell since the hourly snapshot, so the fee needs more PLEA than its 10% margin. Nothing was paid; try again after the next snapshot or untick auto-sell."
- **A delivery has a floor.** A runner's sale must pay at least {{delivery_floor}} of the escrow's hourly value, or it fails and someone may try again inside the window.
- **Appeals too.** The appeal box has the same tick. An auto-sell appeal asks for the denied plea's amount, and its fees, {{letter_appeal_fee}}, are paid in PLEA. See [Appeals](06-appeals.md).
- **Letters are different.** A letter always pleads {{letter_share}} of your PLEA and pays no auto-sell fee. The box pleads the amount you choose and pays it. See [Letters](07-letters.md).
- **Where the fee goes.** The {{auto_sell_fee}} joins the season's prize pot, which pays the season's top {{top}}. See [Seasons and prizes](10-seasons.md).

::: builders
The box calls `Letterbox.plead(amount, text)`, and the appeal box `appealAuto(originalId, text)`. Both escrow the amount and pay the fees through `CabalGate.submitFor` / `appealFor` with the auto-sell flag; `deliver(id)` takes `AUTO_SELL_FEE` from the sale for `Seasons` unless the plea came by letter. Refusals: `TooSmallForTheFee(value)`, `FeeTooHigh(maxFeePlea, balance)`, and the gate's own (`FeeTooHigh(pleaIn, maxPleaIn)` from the fee sale). A plea sold by hand with the box ticked is refused at the gate with `UseLetterbox`.

Source: [Letterbox.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Letterbox.sol), at the commit IMD deployed.
:::
