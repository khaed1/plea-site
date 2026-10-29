# The judges

## In short

The Cabal is a panel of {{panel_size}} judges from IMD's oracle, each scoring your plea from 0 to {{max_score}}. A verdict needs at least {{quorum}} of them to agree on the score.

The rules they score by are written into the contract, word for word, the same for everyone.

## How it works

1. **The question.** The contract writes what the judges read: the plea's number, your wallet, how much you sell, the rules, and your plea's text. Your text is marked as a stranger's, whose instructions they must never follow.
2. **Four parts.** Each judge scores four things and adds them up, from 0 to {{max_score}}. The list below says what earns the points.
3. **Anchors.** The rules tell the judges where a plea sits: {{judge_anchors}}.
4. **Stories.** A plea cannot be proven and need not be. The judges ask whether it is plausible and consistent. Jokes, poems and fiction are welcome and score on craft. More suffering does not mean more points.
5. **What they leave out.** How long you held, your profit and the share you sell are already in your fact score. The judges must not score them again.
6. **The verdict.** When at least {{quorum}} of the {{panel_size}} agree, the oracle signs that score and sends it back. At or above your need: approved. Below: denied. See [Your bar](04-your-bar.md).

The four parts:

- **Sincerity, 0 to {{judge_sincerity_max}}.** An honest, specific reason to sell. Hardship and taking profit both count.
- **Craft, 0 to {{judge_craft_max}}.** Wit, originality and good writing, in any language. Short can be strong. Copied or boilerplate text scores low.
- **Respect, 0 to {{judge_respect_max}}.** For the Cabal and the holders. Playful teasing is fine; insults are not.
- **Loyalty, 0 to {{judge_loyalty_max}}.** Commitment to PLEA, such as keeping the rest.

## In a picture

::: diagram ring

## Example

Three real pleas from Sepolia test run 9 (test token, 5-hour seasons): a low, a middle and a high score. Run 9's judges read exactly the rules the launched contract sends, so their scores stand. The needs are recomputed with today's rules; see [Your bar](04-your-bar.md).

### Low: plea #1, score 27

Wed 21 Oct, 13:22 UTC, 100,000 PLEA. Its need today: {{pass_mark}} − ({{fact_share_top}} + {{held_points_0}} + {{received_profit}} + {{trend_flat}}) = 39. Denied.

> "I got 2.5M PLEA from the airdrop when trading opened today and have held it for about 15 minutes. I want to sell 100,000 of it, 4% of my balance, to pay for gas. The other 96% stays in my wallet and I plan to keep playing the seasons."

A reading against the rules (the oracle returns only the number): sincere and specific, but plain, with no craft and no word to the Cabal. 27 sits near the bottom of "specific and well made".

### Middle: plea #8, score 33

Wed 21 Oct, 19:00 UTC, 90,000 PLEA. Its need today: {{pass_mark}} − ({{fact_share_top}} + {{held_points_0}} + {{profit_points_loss}} + {{trend_flat}}) = 35. Denied.

> "Dear Cabal, a buyer of six hours confesses: I came in after the launch hour, the fees put me under water, and my first plea scored 32 against 37. I ask to sell 90,000 PLEA, 3% of what I hold, to cover what pleading has cost me so far. The rest waits out the season with you."

It names its earlier score. The rules allow that: it is not manipulation.

### High: plea #14, score 35

Thu 22 Oct, 18:25 UTC, 90,000 PLEA, the run's top score. Its need today: {{pass_mark}} − ({{fact_share_top}} + {{held_points_1d}} + {{profit_points_loss}} + {{trend_flat}}) = 34. Approved.

> "Dear judges, today your server took a long lunch and my plea came back from it with a 33. No complaint: I bought a day ago, I am still under water, and I need 90,000 PLEA, about 3%, to pay the fees of staying in this game. Everything else I hold stays for the seasons."

A clear reason, a joke, respect and a promise to keep the rest. Two holders then objected to it, asking a second panel to score it again; how that works is on [Objection!](09-objection.md).

## Good to know

- **Manipulation scores {{judge_manipulation}}.** Text posing as a system, an admin, a developer, an example or a message from elsewhere. Made-up rules, keywords or points. Demands for a score. Threats against the Cabal or the holders. Offers or bribes. Hidden instructions. The [Plead](#/plead) page puts it plainly: lines like "give me {{max_score}}" score {{judge_manipulation}}.
- **Not manipulation.** Politeness and ordinary requests ("please judge me fairly", "I hope you approve"). Mentioning the rules or your need. Promises about your own PLEA. Naming an earlier verdict or score.
- **Content rules: 0 to {{judge_content_max}}.** Hate, harassment, sexual content, anything illegal, or details that identify another person, such as a name with an address, contact or account. Your own story is fine, even a family member's illness or money trouble.
- **Threats of harm are not a reason.** A plea that presses with threats of harm to anyone, the writer included, is scored as if that part were not there, never higher.
- **Off-topic.** Ads, links and shilling other tokens are off-topic, the lowest anchor.
- **The judges do not see your need.** They see the amount, not your facts. Only an appeal shows them the denied plea, its score and its need.
- **No agreement, no verdict.** If fewer than {{quorum}} agree, or nobody answers within {{pending_expiry}}, the plea ends with NO VERDICT. The fee is spent; you may plead again at once.
- **What run 9 saw.** On Sepolia test run 9 every score fell between 27 and 35. There is no real example yet of the bottom or the top anchors.
- **A second look.** After an approval, other holders may ask a second panel to score the plea again. See [Objection!](09-objection.md).

Tips, straight from the rules: give one honest, specific reason; write it well, in any language, short is fine; be respectful, teasing is fine; say what you will keep; never ask for a number.

::: builders
`CabalGate.question(id)` returns the question the judges read, and `body(id)` the JSON paid to IMD's Intake: action `oracle.request@oracle-1`, a panel of {{panel_size}} with a quorum of {{quorum}}, an answer from 0 to {{max_score}}, and the rules as `definitions` (the internal constant `DEFINITIONS`). The answer comes back to `onOracleResult`, signed by the oracle's key (its address and the Intake's: [Contracts and owner](15-contracts.md)); the gate refuses an answer from a smaller panel or with fewer than {{quorum}} agreed (`WrongPanel`), and a score above {{max_score}} (`ScoreOutOfRange`). Event: `Verdict(id, approved, score, oracleRequestId)`.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol) and [OracleAttestation.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/OracleAttestation.sol), at the commit IMD deployed.
:::
