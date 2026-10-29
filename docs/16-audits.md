# Audits

## In short

PLEA's code was checked many times before it was launched: {{audit_rounds}} rounds by IMD's audit swarm, IMD's own audit in each launch job, an outside AI review, {{tests_count}} tests and live test runs on Sepolia. Every finding, and what was done about it, is public.

Audits lower the risk but are no guarantee: code that many have read can still hold a mistake that nobody saw.

## How it works

1. **Swarm rounds.** A round is three IMD audit jobs, one for each part of the code: the game (CabalGate, the Tribunal, Seasons), letters and the launch (the Letterbox, PleaLaunch, PLEA, PleaDistributor and the launch settings), and the market (PleaHook). In each job, four specialists read the code for math, permissions, economics and control flow. A judge then reproduces their findings and ranks them.
2. **Severity.** Critical: anyone could steal or freeze funds, sell without a plea, remove the locked liquidity or mint PLEA. High: a real loss, or a broken rule. Medium: a limited loss or a nuisance. Low: an edge case with no real loss. Info: wording, style, tests.
3. **Fix, then audit again.** Every finding goes into a public ledger as fixed, documented or accepted. A Critical or High is always fixed. A Medium is fixed, or accepted by the owner in writing with the reason. Then the next round audits the new code. A round may skip a part whose code has not changed.
4. **IMD's launch audit.** Every IMD launch job audits the code once more before deploying it: an import audit, an adaptation step, four specialists, a test writer and a judge.
5. **An outside review.** The One Dollar Audit, an AI audit service, reviewed the code in five jobs.
6. **Tests.** {{tests_count}} tests in {{tests_suites}} suites pass on the launched commit, including rehearsals against copies of Sepolia and Ethereum.
7. **Live runs.** The same contracts ran on Sepolia, with a test token, before the launch.
8. **The code on Ethereum is the code audited.** Sourcify matches each launched contract with its source at the launch commit. See [Contracts and owner](15-contracts.md).

## In a picture

::: diagram audit-timeline

## Every audit

The ledger of every finding is [FINDINGS.md](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/audit/FINDINGS.md), the rules the auditors check against are in [THREAT-MODEL.md](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/audit/THREAT-MODEL.md), and the judges' reports are in [audit/rounds](https://github.com/khaed1/plea/tree/42e0f855875786a953e945e528e9d7f2724a5352/audit/rounds), one folder a round. All are at the launch commit.

### The swarm rounds

Rounds 1 to 8 audited the code of the Sepolia test runs. Rounds 9 to 12 audited the Ethereum code.

- **Round 1**, 15 Oct 2026, commit cd88136, all three parts: {{audit_r1}}. Both Mediums fixed; every Low fixed or documented.
- **Round 2**, 15 Oct, 4b14d13, all three parts: {{audit_r2}}. Three Mediums fixed. The fourth was accepted by the owner in writing: anyone may buy PLEA in another wallet's name, which moves that wallet's average buy time toward now.
- **Round 3**, 15 Oct, 3766112, all three parts: {{audit_r3}}. The High and the Medium fixed, and checked by round 4's judges; the rest fixed or documented. The High is the example below.
- **Round 4**, 15 Oct, e41e426, all three parts: {{audit_r4}}. All fixed or documented.
- **Round 5**, 15 Oct, 9b89d98, all three parts: {{audit_r5}}. The Medium fixed: a sham objection in the window's last second could block a real one, so two objections may now wait at once. The rest fixed or documented.
- **Round 6**, 16 Oct, f6b1e9a, the game and the letters: {{audit_r6}}. All fixed.
- **Round 7**, 16 Oct, 533dcec, all three parts: {{audit_r7}}. All fixed, the two Mediums among them: a plea slightly larger than its buy record was scored as received PLEA, and after the death a large sale through a router could fail.
- **Round 8**, 16 Oct, 02407c1, the game and the market: {{audit_r8}}. All fixed or documented.
- **Round 9**, 28 Oct, 6ffcf66, the game, on the Ethereum code with the pass mark of {{pass_mark}}: {{audit_r9}}, in the README's wording. Documented.
- **Round 10**, 28 Oct, 6422b1b, the game and the letters: {{audit_r10}}, one in the threat model's wording and one in a deploy script. Both fixed.
- **Round 11**, 28 Oct, 238eebb, the game and the letters: {{audit_r11}}, both wording. Both fixed.
- **Round 12**, 28 Oct, 571ae80, the market at the {{market_cap}} opening: {{audit_r12}}, four in the documentation and one name. Fixing them changed no byte of the contracts' code: that fix is 42e0f85, the commit IMD deployed.

### IMD's launch audits

- **Run 5**, 14 Oct, commit 68b2281: {{audit_imd_run5}}. The Lows were fixed in IMD's own adaptation, the High was fixed by moving a network check from a constructor to the opening, and the Infos were accepted.
- **Run 6**, 14 Oct, 8edd852: {{audit_imd_run6}}. The Medium fixed; of the Lows, one fixed and two accepted; the Info fixed. The job stopped on a platform fault, and nothing was deployed.
- **Run 7**, 15 Oct, e1755aa, live on Sepolia as launch #1843: {{audit_imd_run7}}. Both fixed.
- **Run 8**, 16 Oct, dc3826b: {{audit_imd_run8}}, both noted. The job stopped at IMD's test step on a platform limit, and the same code went again as run 8.5.
- **Run 8.5**, 16 Oct, af57f6d, live on Sepolia as launch #1981: {{audit_imd_run85}}. One Low fixed and one accepted by the owner in writing; the Info fixed.
- **Launch {{launch_id}}**, 28 Oct, 42e0f85, the launch on Ethereum: {{audit_imd_launch}}. The import audit's three notes were each already in the ledger. The adaptation changed no code and added regression tests; the four specialists found nothing; the test writer added tests and found no defect; the judge found no reproducible defect. Then IMD deployed it. The [delivered repository](https://github.com/identity-md-launches/launch-2647-src-cabalgate-sol-src-tribunal-sol-src-p) keeps the contracts, scripts and launch settings exactly as at 42e0f85; its [ADAPTATION.md](https://github.com/identity-md-launches/launch-2647-src-cabalgate-sol-src-tribunal-sol-src-p/blob/bc2fda914058b6d5e489eb70dc3d0d4254dbcf0c/ADAPTATION.md) records the import audit's notes and the tests.

The team also reviewed run 5's code itself (14 Oct, 20d6595). It found no High; its one new finding, a Low in a Letterbox status line, was fixed.

### The One Dollar Audit

An AI audit service. Five jobs, all on run 8.5's code (af57f6d), on 17 Oct:

- **Job 1014**, the hook: {{audit_oda_1014}}. None can happen on the launched code: each was checked on chain and with tests. Three passages of the threat model were reworded. [Report](https://bafkreihkbd5kvez2yk5wrdv26fmkt6rdx62caxoy6txjemfqqgpn5yd4ja.ipfs.community.bgipfs.com/).
- **Job 1015**, the gate: {{audit_oda_1015}}. The Low is by design and accepted by the owner: buying more PLEA before you plead makes the same amount a smaller share of your PLEA. [Report](https://bafkreiagqstkiyypgwmamcicrhgfy5bkjp2cvwwqfrqkehwqftlqmnwedu.ipfs.community.bgipfs.com/).
- **Job 1016**, letters and the launch: {{audit_oda_1016}}. The Low, a gap between deploying PLEA and its launcher, cannot happen in IMD's one-transaction launch; documented. [Report](https://bafkreihhugsqqnua3kg4bihiphteb4pa7ow566x47uoa7d7djtwkvaqw74.ipfs.community.bgipfs.com/).
- **Job 1017**, the Tribunal and Seasons: {{audit_oda_1017}}. None can happen, except a wiring mistake at deployment, which the launch test rules out. [Report](https://bafkreifyhrq7x5pricxvsyqn3v2rizgbjqkmbfw7g2asqmtexcm4ulekq4.ipfs.community.bgipfs.com/).
- **Job 1018**, the hook again: {{audit_oda_1018}}. None needed a code change, and it agreed that job 1014's three largest claims cannot happen. [Report](https://bafkreicgcyql5psn36p6dyc5yhpndwypdudpjxp23dr6emufoz3ohzzg2a.ipfs.community.bgipfs.com/).

On 28 Oct, four more jobs on the Ethereum code (6ffcf66), [1065](https://onedollaraudit.com/audit/1065) to [1068](https://onedollaraudit.com/audit/1068), were declined by the service, with no reason and no report.

### Tests

{{tests_count}} tests in {{tests_suites}} suites passed on the launched commit on 28 Oct: unit, fuzz, invariant and adversarial tests, plus rehearsals against copies of Sepolia and Ethereum. IMD's launch job ran the suites again, without the copies, and added its own tests; all passed. The tests are in the repository's [test folder](https://github.com/khaed1/plea/tree/42e0f855875786a953e945e528e9d7f2724a5352/test).

### The Sepolia test runs

- **Run 7**, launch #1843, 15 to 17 Oct: its whole life with no verdicts, because IMD had paused its Sepolia answers. Trading opened, the Cabal died on time after {{deadman}}, PLEA then sold freely, a trim burned PLEA, and every season was closed with its pot sent to the buy wall.
- **Run 9**, launch #2234, 21 to 26 Oct: the launched code with an earlier pass mark, holding points and received-PLEA profit, a smaller opening and 5-hour seasons, on a test token. IMD's judges gave real verdicts: pleas approved, denied, sold and appealed, letters, objections sustained and overruled, the first season prize, and the Cabal's death on Mon 26 Oct at 07:28 UTC. The examples in these docs come from it.

## Example

The swarm rounds' findings, added up, and the one High from start to end.

1. **Medium.** Rounds 1, 2, 3, 5 and 7 found Mediums: 2 + 4 + 1 + 1 + 2 = {{audit_medium}}. Nine were fixed; one was accepted in writing.
2. **Low.** Rounds 1 to 10: 8 + 3 + 4 + 4 + 2 + 2 + 1 + 2 + 1 + 1 = {{audit_low}}.
3. **Info.** All twelve rounds: 10 + 6 + 5 + 10 + 4 + 2 + 4 + 5 + 0 + 1 + 2 + 5 = {{audit_info}}.
4. **In all.** {{audit_high}} High + {{audit_medium}} + {{audit_low}} + {{audit_info}} = {{audit_total}} findings, and no Critical.
5. **The High, found.** On 15 Oct, round 3's market judge found that a router could borrow the pool's IMD for a moment, inside its own trade. Its buys then skipped the owner's, the prize pot's and the cashback shares of the fee.
6. **Fixed.** In round 4's code (e41e426), the hook decides by the pool's own IMD, which nobody can borrow. A router that tries the trick now only makes its own trade fail, and a test shows it.
7. **Checked.** Round 4's judges confirmed the fix the same day.

## Good to know

- **No guarantee.** None of these audits is a manual audit by a security firm; the One Dollar Audit is an AI review. Only buy what you are happy to hold.
- **Older code, older audits.** IMD's launch audits of runs 5 to 8.5 and the One Dollar Audit read earlier versions. What changed since is listed at the end of FINDINGS.md. The final code was audited by rounds 9 to 12 and by IMD's launch audit.
- **Known limits, accepted in writing.** A buy made in your name moves your average buy time. Buying more PLEA before you plead lowers the share you sell. Whoever records your points first fixes your seat bonus. Two wallets working with a seller can use up a plea's objections early. The judges' answer is matched to its plea by IMD's Intake. Each is in FINDINGS.md with the reason.
- **Counting the ledger.** Some ledger rows group several Infos, so counting rows gives other totals than the judges' counts above.
- **The README is behind.** The repository's README still says eight rounds; there have been {{audit_rounds}}.
- **Found something?** The code is public. Read the threat model first: it lists what is deliberate.

::: builders
The audit kit is in [audit/](https://github.com/khaed1/plea/tree/42e0f855875786a953e945e528e9d7f2724a5352/audit) at the launch commit: `README.md` (the process), `THREAT-MODEL.md` (actors, the invariants, deliberate behaviour, the severity scale), `FINDINGS.md` (the Rounds table and one row per finding: id, round, title, severity, location, status, fix commit or reason), `jobs/` (each area's objective), `make_jobs.py` (builds a round at a pinned commit) and `rounds/<n>/` (each job's objective, request, manifest and report).

The tests run with Foundry: `forge test` runs the launch and manifest suites; the full suite is `FOUNDRY_PROFILE=full forge test`, a few files at a time with `--match-path`; the fork rehearsals in `test/fork/` need an RPC URL. See the repository's README, "Build and test".
:::
