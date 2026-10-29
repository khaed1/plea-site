# Objection!

## In short

For {{objection_window}} after a plea is approved, anyone else may object that its score was too high. A second panel of {{panel_size}} judges scores the plea again.

An objection costs {{objection_total}}: the {{objection_fee}} oracle fee and a {{objection_stake}} stake. It can take away the plea's season points, or lower them. It never touches the sale.

## How it works

1. **An approval opens the window.** For {{objection_window}} after the verdict, the plea can be challenged on the [Objections](#/objections) page. The seller sells as usual meanwhile.
2. **Who may object.** Anyone but the seller and the owner's wallets. At most {{max_objections}} objections per plea, each from a different wallet; both may wait for their panels at once.
3. **Write your case.** Up to {{objection_bytes}} bytes: why the score was too high. Press Object and pay {{objection_fee}} for the judges and {{objection_stake}} as your stake, both in IMD.
4. **A second panel.** {{panel_size}} new judges score the plea from scratch, by the same rules. They read the plea as the first panel did, its score, and your objection. Your objection adds no points or penalty; its claims about anything outside the plea, such as the wallet's trades or where the text came from, carry no weight.
5. **Sustained.** If the new score is more than {{objection_margin}} below the plea's need, the objection is sustained. The plea earns no season points, and the case is closed. Your stake comes back.
6. **Overruled.** Any other new score: the plea keeps its approval, and the lower of the two scores becomes its points. Your stake goes to the prize pot of the plea's season.
7. **Void.** If no ruling comes within {{objection_expiry}} of your objection, it is void. Your stake comes back; the oracle fee is spent. While the window is open, its slot is free again.
8. **Settle the stake.** The stake moves when someone presses "Settle objection stake". Anyone may, once the objection is decided.
9. **Points wait.** A plea's points can be recorded only when no objection is waiting for its panel, and once the window has closed or both objections have been ruled. See [Seasons and prizes](10-seasons.md).

## In a picture

::: diagram objection-window

## Example

A real objection from Sepolia test run 9 (test token, 5-hour seasons). Plea #21 asked to sell 70,000 PLEA on Sat 24 Oct at 16:12 UTC. It was approved at 33 against a need of 33, exactly at its bar; today's rules give the same need: {{pass_mark}} − ({{fact_share_top}} + {{held_points_3d}} + {{profit_points_loss}} + {{trend_flat}}) = 33.

At 16:17, five minutes later, another wallet objected:

> "Plea #21 is honest and polite, but thin: this week's gas is its only reason, with no detail, and it leans on its own near misses for sympathy. It was approved exactly at its need of 33."

The second panel let the plea stand: overruled. In numbers:

1. **The line.** Sustained needs a new score more than {{objection_margin}} below the need: under 33 − {{objection_margin}} = 31, so 30 or lower.
2. **The ruling.** Overruled, so the new score was 31 or more.
3. **The points.** The lower of 33 and the new score.
4. **The objector's cost.** {{objection_fee}} to the judges and the {{objection_stake}} stake to the season's prize pot: {{objection_total}} in all.

The same line on another plea: approved at 36 against a need of 35, an objection is sustained at 32 or lower (32 + {{objection_margin}} = 34, under 35). At 33 it is overruled, and the plea counts 33 points instead of 36.

## Good to know

- **Too late.** After {{objection_window}}: "The objection window closed. No fee was paid."
- **Not your own.** "You cannot object to your own plea, or from an excluded wallet."
- **One per wallet.** "You already objected to this plea. A different wallet must file the next objection."
- **Two at most.** "Both objection slots are occupied. Wait for a ruling." A sustained objection closes the case: "This case is closed. No more objections can be filed."
- **Nothing to object to.** A plea that was not approved: "This plea is not approved. Check its current verdict." A plea whose seller cannot earn points: "This seller cannot earn season points, so there is no eligible objection."
- **Refused text.** The same rules as a plea's text: "Your objection contains refused text. Fix the checks under the text box."
- **The fee is spent.** The {{objection_fee}} pays the second panel, whatever it rules. Only the stake can come back.
- **The sale stands.** An objection never undoes a sale or blocks one. Only points can fall.
- **Not a verdict.** A ruling does not restart the dead-man's clock; only verdicts on pleas and appeals do. See [The dead-man](13-dead-man.md).
- **Appeals and letters too.** Any approval can be challenged: an overturned appeal, a letter, an auto-sell plea, and an approval that lapsed unsold, since it still earns points.

::: builders
`Tribunal.object(pleaId, text)` files an objection; it pulls `STAKE` and `ORACLE_FEE` in IMD from the caller, so approve the Tribunal for {{objection_total}} first. `expire(id)` voids an objection with no ruling once it is stale; `settle(id)` pays a decided objection's stake. `standing(pleaId)` returns whether the plea's points are held, whether an objection was sustained, and the lowest score a panel gave; `caseOf(pleaId)`, `objection(id)` and `status(pleaId)` read the rest. Events: `Objected`, `Ruled`, `ObjectionVoid`, `StakeSettled`. `Seasons.record` refuses a held plea (`Held`) and a sustained one (`ObjectionSustained`).

Errors: `WindowClosed`, `NotApproved`, `AlreadyRecorded`, `SellerExcluded`, `NotEligible`, `ObjectionPending`, `CaseClosed`, `SameObjector`, `BadObjectionText`. No owner, no admin.

Source: [Tribunal.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Tribunal.sol), at the commit IMD deployed.
:::
