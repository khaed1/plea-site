# Risks and FAQ

## In short

PLEA is an experiment with unusual rules: buying is open to everyone, but while the Cabal lives you can sell only with an approved plea, and you may be denied.

Read this page before you buy, and only buy what you are happy to hold. Nothing here is financial advice.

## How it works

The risks, one by one.

1. **You may not be able to sell.** While the Cabal lives, every sale needs an approved plea. The judges may deny you, again and again. One plea sells at most {{max_share}} of your PLEA, and never more than {{max_sell}}. See [Your bar](04-your-bar.md).
2. **Pleading costs money, whatever the verdict.** Every plea pays the {{oracle_fee}} oracle fee; it is never refunded. An appeal costs {{appeal_total}}. After a sale, a denial or a lapse you wait {{cooldown}} before the next plea.
3. **The pool may not be able to pay.** The pool starts with no IMD at all: it only holds the IMD that buyers have put in, plus the buy wall. A sale bigger than the pool can fill fails, and an approved plea sells all at once or not at all. Early on, the pool may be small.
4. **Fees are high at the start.** Every trade pays {{fee_total}}. In the first {{launch_window}}, a buy also pays the launch fee: at the very open its whole fee is {{launch_open_fee}} of what reaches the pool, {{launch_open_fee_of_payment}} of what you pay. See [Buying](02-buying.md).
5. **Scanners may call PLEA a trap.** Wallets and token scanners test a token by trying a plain sale. While the Cabal lives a plain sale fails, so they may warn that PLEA cannot be sold. That is the plea rule at work, written in the code and on this site, not a hidden trap. Once the Cabal dies, PLEA sells like any token.
6. **No sending, either.** While the Cabal lives you cannot send PLEA to another wallet. Only the pool, PLEA's own contracts and the owner's allowed senders can.
7. **The judges can go quiet.** The Cabal is IMD's oracle. If it does not answer, your plea gets no verdict and its fee is spent. If no verdict comes for {{deadman}}, the Cabal dies, and everyone may sell at once. See [The dead-man](13-dead-man.md).
8. **Your words are public forever.** A plea's text, a letter and an objection are stored on Ethereum, next to your wallet. They cannot be deleted.
9. **The owner has a few powers.** It opens trading early if it wants, sets the claim list once, may let chosen addresses send PLEA freely, and receives the {{fee_owner}} fee. An allowed address could move its PLEA to another market. See [Contracts and owner](15-contracts.md).
10. **The code may have a flaw.** It was audited many times; that lowers the risk but is no guarantee. See [Audits](16-audits.md).
11. **The price can fall.** The buy wall is not a floor: enough selling uses it up.

## In a picture

::: diagram sale-gates

## Example

The costs of a hard start, worked out. You buy with 100 IMD, 30 minutes after trading opens.

1. **The buy.** The launch fee has fallen to 46.66%, so the fee is {{fee_imd}} + 46.66% = 48.66% of what reaches the pool. Then 100 × 100 ÷ 148.66 = 67.27 IMD reaches the pool, and 32.73 IMD is fee.
2. **A denied plea.** The next day you plead to sell a fifth. Denied: {{oracle_fee}} spent.
3. **A denied appeal.** You appeal within {{appeal_window}}. Denied again: {{appeal_total}} spent.
4. **An approval.** After the {{cooldown}} cooldown you plead again. Approved: {{oracle_fee}} more. Pleading has cost 0.5 + 0.85 + 0.5 = 1.85 IMD.
5. **The sale.** At an unchanged price, your PLEA is worth what reached the pool, less the {{fee_burn}} burned on its way to you: 67.27 × 0.9975 = 67.10 IMD. A fifth is about 13.42 IMD. A sale pays the {{fee_total}} too: {{fee_burn}} of the PLEA burned, then {{fee_imd}} of the IMD. That leaves you about 13.42 ÷ 1.0025 × 0.98 = 13.12 IMD, before the price moves under your own sale.
6. **The account.** 101.85 IMD spent, 13.12 IMD back, and four fifths of your PLEA still held, worth about 67.10 × 4 ÷ 5 = 53.68 IMD at that price. The rest went to fees: the launch fee to the buy wall, the oracle fees to the judges.

Buy after the launch window and the same 100 IMD puts 98.04 IMD into the pool instead.

## Good to know

- **Is PLEA a honeypot?** No hidden trap: the sale rule is the whole idea, and it is written here and in the code. But while the Cabal lives, you cannot sell freely. If that is a problem for you, do not buy.
- **Can I sell on Uniswap's app or an aggregator?** Not while the Cabal lives: sales go through an approved plea, on the [Plead](#/plead) page or by letter. After the death, any app that lists the pool can trade it.
- **Can I buy elsewhere?** While the Cabal lives, most apps cannot buy PLEA either: the buy must name its buyer. Buy on the [Buy](#/buy) page. See [Buying](02-buying.md).
- **Can the owner take the pool's money?** No. The liquidity is locked forever and no one, the owner included, can take it out. The owner does receive {{fee_owner}} of every trade's IMD.
- **Do I get my fee back if I am denied?** No. The {{oracle_fee}} pays the judges, whatever the verdict.
- **What if my approved sale fails?** You have {{sell_window}} to try again. If the pool cannot fill the whole amount, the site says: "The pool could not fill the required trade. Lower the amount or refresh the quote." An approved plea's amount cannot change; if it never sells, it lapses, and its points still count.
- **What if I miss my sell window?** The approval lapses, nothing is sold, and your next plea waits {{cooldown}} from the approval.
- **Is a letter's PLEA safe in escrow?** It waits in the Letterbox, which has no owner. If no sale happens, anyone may return it to you with the tip.
- **What happens when the Cabal dies?** Everyone may sell, send and trade PLEA freely, forever. Many may sell at once.
- **Is this an official IMD site?** No. IMD launched PLEA and its judges are the Cabal, but this site is not an official IMD page.
- **Is this advice?** No. Nothing on this site is financial, legal or tax advice.

::: builders
Where each risk lives in the code: the sale gate in `PleaHook.beforeSwap` (`SellsOnlyViaGate`) and `PLEA._update` (`CabalIsWatching`); the plea limits in `CabalGate._checkAmount`; a sale that the pool cannot fill reverts `PartialFill` in `CabalGate.unlockCallback`; the dead-man in `CabalGate.cabalAlive`; the owner's powers in `PLEA.allow`, `PleaDistributor.setMerkleRoot` and `PleaLaunch.seed`. The threat model lists every actor's trust and what is deliberate: [THREAT-MODEL.md](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/audit/THREAT-MODEL.md).
:::
