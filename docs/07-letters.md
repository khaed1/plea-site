# Letters

## In short

You can plead without the site: send your plea as a plain text message, a letter, to the Letterbox, from Etherscan or your wallet.

A letter pleads {{letter_share}} of your PLEA, pays its fees in PLEA, and keeps the PLEA it pleads in escrow. If the Cabal approves, anyone may sell it for you within {{sell_window}}, and the sale is yours.

## How it works

1. **Send a letter.** From the wallet that holds your PLEA, with 0 ETH, to the Letterbox. Its address is on the [Letters](#/letters) page. There are three ways:
   - Etherscan's message page, [etherscan.io/idm](https://etherscan.io/idm): the Letterbox as the recipient, your plea as the message.
   - Etherscan's Write Contract tab for the Letterbox: the function `letter`, with your plea as its text.
   - Your wallet's data field: your plea, written as hex.
2. **The first word decides.** APPEAL followed by a text appeals your newest plea, if it was denied. SELL sells your own approved letter. NAME followed by a name sets your display name. Any other text is a new plea. The command words are in capitals.
3. **A plea for {{letter_share}}.** A letter pleads {{letter_share}} of your PLEA, never more than {{max_sell}}. The same judges, rules and need as on the site apply; your fact score is read from your PLEA before the escrow. See [Your bar](04-your-bar.md).
4. **Fees in PLEA.** In the same transaction, some of your PLEA is sold for {{letter_fee}}: the {{oracle_fee}} oracle fee and a {{runner_tip}} tip for whoever delivers the sale. An appeal letter buys {{letter_appeal_fee}}, with the {{appeal_wall_share}} for the buy wall. The fee sale may spend PLEA worth up to {{fee_cap}} of the fees at the hourly price; what it does not spend comes back at once.
5. **The fees' limit.** The fees may take at most {{max_fee_share}} of your PLEA. So a letter needs PLEA worth about {{letter_min_value}} or more at the hourly price.
6. **Escrow.** The {{letter_share}} waits in the Letterbox while the Cabal judges the plea.
7. **Delivered.** Approved: within {{sell_window}}, anyone may deliver it, that is, sell the escrow for you. The sale's IMD goes to you, after the usual trade fee; a letter pays no auto-sell fee. The {{runner_tip}} tip goes to whoever delivered. Send SELL and you deliver it yourself, and keep the tip.
8. **Settled.** Denied, no verdict, or approved but not delivered in time: anyone may settle the letter, and your PLEA and the tip come back to you. The oracle fee is spent. An approval that was not delivered still counts for the season.

On the site, a letter's page has the buttons: "Deliver approved sale" for anyone, "Sell yourself" for you, and "Return escrow and tip" to settle.

## In a picture

::: diagram letter-path

## Example

The smallest letter, if the hourly price is the opening {{seed_price}} a PLEA.

1. **The fees' cap.** The fees are {{letter_fee}}. The fee sale may spend up to {{fee_cap}} of that, 0.825 IMD, which is 0.825 ÷ {{seed_price}} = 41,250 PLEA.
2. **Your PLEA.** The fees may take at most {{max_fee_share}} of it: 41,250 ÷ {{max_fee_share}} = 412,500 PLEA. You need about that much or more, worth 412,500 × {{seed_price}} = {{letter_min_value}}.
3. **The plea.** The letter pleads {{letter_share}} of 412,500 = 82,500 PLEA, worth 82,500 × {{seed_price}} = 1.65 IMD. That clears both minimums: {{min_letter}} and {{min_sale_value}}.
4. **The fee sale.** It sells about 38,400 PLEA: {{letter_fee}}, plus the trade's fee, at {{seed_price}}. The rest of the 41,250 comes back at once. Like any sale, it shrinks your buy record.
5. **Delivered.** The sale must pay at least {{delivery_floor}} of the escrow's hourly value: 1.65 × {{delivery_floor}} = 1.53 IMD. All of it is yours. The runner gets the {{runner_tip}} tip.
6. **Or settled.** Your 82,500 PLEA and the {{runner_tip}} tip come back. The {{oracle_fee}} is spent.

At another price the PLEA counts change, but {{letter_min_value}} stays the least your PLEA must be worth.

## Good to know

- **Same rules as the site.** One plea at a time, the cooldown, the need above {{max_score}}: a letter is refused exactly as a plea from the site would be.
- **A new letter settles the old one.** If your last letter is finished, your next one first returns its PLEA and tip. If it is still waiting for a verdict or inside its sell window, the new letter is refused.
- **Commands are capitals, then a space.** "SELL" sells; "sell" is read as a new plea, and is refused while you have an open one. APPEAL alone is refused. NAME alone clears your name.
- **Names.** {{name_min_length}} to {{name_max_length}} characters, using {{name_chars}}. Each name belongs to one wallet. Reserved: {{name_reserved}}.
- **An appeal letter.** It appeals your newest plea for its original amount, a little less if the fee sale shrank your PLEA. Its fees must fit in {{max_fee_share}} of your PLEA, or in {{fee_cap}} of the denied plea's amount, so you need about {{letter_appeal_min_value}} unless the second fits. See [Appeals](06-appeals.md).
- **Read your letter's state.** The Letterbox's `status` on Etherscan's Read Contract tab, given your wallet, answers in one sentence. `leaderboard` gives the season's top {{top}}.
- **Points.** An approved letter's score counts for the season like any other. Its points can be recorded once the objection window has passed. See [Seasons and prizes](10-seasons.md).
- **After the Cabal dies.** New letters are refused. PLEA still waiting in a letter comes back through settle.

### What a wallet or Etherscan shows

When a letter would fail, a wallet or Etherscan names the error. In plain words:

- `LetterTooLong`: over {{max_plea_bytes}} bytes. Shorten it.
- `LetterTooSmall`: {{letter_share}} of your PLEA is under {{min_letter}}, so you need at least {{letter_min_balance}}.
- `TooSmallForTheFee`: the plea is worth less than {{min_sale_value}} at the hourly price.
- `FeeTooHigh`: the fees would take more than {{max_fee_share}} of your PLEA, or the price fell since the hourly price was taken. Try after the next hour.
- `PendingExists`: your previous plea or letter is still open.
- `Cooldown`, `CannotPass`, `BadPleaText`: as for a plea from the site; see [Selling: plead](03-plead.md).
- `NothingToAppeal`, `NotDenied`, `AppealClosed`: nothing to appeal, or too late.
- `NotOpen`: SELL with no approved letter waiting.
- `BadName`, `NameTaken`: the name breaks the rules, or another wallet holds it.
- `NoPrice`: trading has not opened yet.

::: builders
`Letterbox`: a letter is a call with the text as input data (the `fallback`) or `letter(text)`. `deliver(id)` sells an approved escrow for anyone and pays them the tip; `settle(id)` returns an escrow that will not sell. `feesFor(isAppeal)` gives the IMD a letter buys and the most PLEA it may spend now; `escrowOf(id)` and `openOf(wallet)` read escrows; `status(wallet)` and `leaderboard()` answer in words; `setName(name)` and `nameOf(wallet)` are the names. The Letterbox pleads through `CabalGate.submitFor` and `appealFor`. Events: `Escrowed`, `Delivered`, `Settled`, `NameSet`.

Its numbers (the {{letter_share}} share, the tip, the {{max_fee_share}} limit, the {{min_sale_value}} floor) are internal constants, with no getter. No owner, no admin.

Source: [Letterbox.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Letterbox.sol), at the commit IMD deployed.
:::
