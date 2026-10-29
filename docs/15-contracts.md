# Contracts and owner

## In short

PLEA is eight contracts on Ethereum. None of them has an admin, and none can be upgraded: the code that runs is the code that was launched.

The owner has a few small powers and receives the {{fee_owner}} fee. The owner cannot change a fee, a time limit, a prize or any other rule, and does not play the seasons.

## How it works

1. **The launch.** IMD's launch {{launch_id}} deployed five contracts in one transaction, at block {{launch_block}}: PLEA, CabalGate, Seasons, PleaDistributor and PleaLaunch.
2. **The other three.** PleaLaunch then deployed the Letterbox, the Tribunal and PleaHook, from code fixed in the launch, so their code and settings are the same whoever makes the call. PLEA's whole supply was minted with PleaHook, at block {{hook_block}}.
3. **No admin, no upgrades.** No contract can be paused, upgraded or swapped. Every fee, time limit and prize is fixed in the code. The Letterbox and the Tribunal have no owner at all.
4. **The owner.** One wallet: PLEA's owner and the distributor's owner, and the receiver of the {{fee_owner}} fee. Its address is under the picture.
5. **Power 1: opening trading early.** From {{start}} anyone may open trading. Before that, only the owner may.
6. **Power 2: the claim list, once.** The owner sets the distributor's list of who may claim its {{supply_distributor}}. Once set, it can never change. See [Claim](#/claim).
7. **Power 3: free senders.** The owner may let an address send PLEA freely while the Cabal lives. It is for good: an address can be added, never removed. Even then, it cannot send PLEA into the pool or the gate, so it cannot sell in PLEA's pool without a plea.
8. **Handing over.** The owner may hand PLEA or the distributor to a new owner, in two steps, or give ownership up. The distributor cannot be given up before its list is set.
9. **The {{fee_owner}} fee.** It goes to the owner's wallet as it was at the launch, written into the pool's contract for good. It stays there even if PLEA's ownership is handed over.
10. **What the owner cannot do.** Change any fee, time limit, number or rule. Take liquidity out of the pool. Move anyone's PLEA or IMD. Mint more PLEA. Change the judges. Earn season points, prizes or the bonus, or object to a plea.

## In a picture

::: diagram contracts

## Example

Who held PLEA when it was minted, worked out from the code's split.

1. **The supply.** {{total_supply}}, minted once, at block {{hook_block}}. No contract can mint more.
2. **The pool.** {{supply_pool_pct}} of it, 1,000,000,000 × {{supply_pool_pct}} = {{supply_pool}}, went to PleaHook: the pool's locked liquidity.
3. **The seasons' bonus.** {{supply_seasons_pct}}, 1,000,000,000 × {{supply_seasons_pct}} = {{supply_seasons}}, went to Seasons: {{bonus_seasons}} seasons × {{bonus_per_season}}.
4. **The claim list.** {{supply_distributor_pct}}, 1,000,000,000 × {{supply_distributor_pct}} = {{supply_distributor}}, went to PleaDistributor: the plan is {{supply_swarm_pct}} for the IMD swarm and a {{supply_airdrop_pct}} airdrop.
5. **Check.** 820,000,000 + 60,000,000 + 120,000,000 = 1,000,000,000. The owner's wallet received none.

And the owner's fee on a 100 IMD buy: {{fee_owner}} of the 98.04 IMD that reaches the pool, 0.98 IMD. See [Fees](11-fees.md).

## Good to know

- **The source is public and matches.** Sourcify matches each contract's code on Ethereum with its source at the launch commit: seven in full, and PleaHook on its running code. The links are under the picture.
- **Check a free sender.** Every address the owner allows is public: PLEA's `allowed` view answers for any address, and each one is logged as an `Allowed` event. Such an address could send PLEA to another market; it can never sell in PLEA's pool without a plea.
- **The claim list decides the {{supply_distributor}}.** The code pays whatever the list says. Until it is set, nobody can claim: the [Claim](#/claim) page says "The list is not open yet".
- **A safety check at the open.** On Ethereum, opening trading is refused if the seasons are shorter than {{seed_check_season}}, the dead-man shorter than {{seed_check_deadman}}, or the opening market cap under {{market_cap_check}}. The launched code opens at {{market_cap}}.
- **Before the start time.** Anyone but the owner who tries to open trading early is refused: "Trading is not open yet. Wait until the start time shown."
- **The owner does not play.** A plea from the owner's wallets earns no points; the season's prizes skip them; they cannot object. See [Seasons and prizes](10-seasons.md).
- **Not an IMD page.** IMD launched PLEA, and its judges are the Cabal. This site is not an official IMD page.
- **On the site.** Home's [Contracts](#/contracts) list shows the same addresses, the outside contracts PLEA works with, and the owner's powers.

::: builders
Owner functions: `PLEA.allow(account)` (add-only), `PleaDistributor.setMerkleRoot(root)` (once; `RootAlreadySet`, `ZeroRoot`), `PleaLaunch.seed()` before `START` (it reads `PLEA.owner()` when called; anyone after `START`), and OpenZeppelin's `Ownable2Step` on PLEA and PleaDistributor: `transferOwnership`, `acceptOwnership`, `renounceOwnership` (the distributor's refuses `RootNotSet` until the root is set). `PleaHook.owner()` is the fee receiver, immutable. Views: `PLEA.allowed(account)`, `PLEA.owner()`, `PleaDistributor.merkleRoot()`, `PleaLaunch.START()`, `opened()`, `hook()`, `letterbox()`, `tribunal()`, `hookInitCodeHash()`, `letterboxCodeHash()`, `tribunalCodeHash()`. Events: `Allowed`, `RootSet`, `OwnershipTransferStarted`, `OwnershipTransferred`, `HookDeployed`, `LetterboxDeployed`, `TribunalDeployed`, `TradingOpened`. Seed refusals: `TooEarly`, `BelowAgreedTiming`, `BelowAgreedMarketCap`, `HookNotDeployed`, `LetterboxNotDeployed`, `TribunalNotDeployed`.

Source, at the commit IMD deployed: [PLEA.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PLEA.sol), [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), [Seasons.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Seasons.sol), [PleaDistributor.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaDistributor.sol), [PleaLaunch.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaLaunch.sol), [Letterbox.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Letterbox.sol), [Tribunal.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Tribunal.sol), [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol).
:::
