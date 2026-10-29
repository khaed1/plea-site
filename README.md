# PLEA site

The PLEA website: a static Vite + React + TypeScript app (wagmi/viem) that reads PLEA's contracts from public RPCs. Not an official IMD page.

- `web/`: the source. It started as IMD's run 9 site (launch #2234 repository, commit `b214b529673ac46ec8adbb0766086403971efc34`, folder `web/`), with its licences (`web/licenses/`), unit tests (`web/tests/`) and QA scripts (`web/scripts/`).
- `dist/`: the built export, committed. IMD hosts exactly these bytes (its import reads this repository as a site with `build: false`, `exportDir: "dist"`).
- `docs/NN-slug.md`: the site's Docs section (`#/docs`, `#/docs/<slug>`, `#/docs/<slug>/<heading-id>`), 18 Markdown pages the build bundles and renders in the site's theme (`web/src/docs/`; how to write one: `web/src/docs/AUTHORING.md`; every number in `web/src/docs/numbers.json`).
- `docs/imd-run9/`: IMD's notes from the three run 9 site jobs (FRONTEND, DESIGN, FIXES, VALIDATION). Not a docs page.
- Branches: `next` is work in progress; `main` is what IMD hosts and moves only when a version passes every check. The old v10 static copy is kept on branch `archive/v10-copy`.

## Build

Node 22.22.0 and npm 10.9.4 (`.nvmrc`, `web/package.json` `engines`).

```sh
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web test
npm --prefix web run build          # writes dist/ and dist/imd-deployment.json
npm --prefix web run verify-export  # rebuilds and fails if dist/ differs from the commit
```

The build is reproducible: a clean `npm ci` + build gives the same bytes on any machine with these versions (it reproduced IMD's own run 9 export byte for byte).

## Networks

One source builds either deployment, chosen at build time with `PLEA_NETWORK`: `ethereum` (the default: PLEA's launch #2647 on Ethereum, block 26,293,890) or `sepolia-run9` (run 9 on Sepolia). Each has `web/networks/<key>/site.json` (Sepolia keeps its chain and contracts in `web/network-input.json` and `web/deployment-input.json`; Ethereum in `web/networks/ethereum/network.json` and `deployment.json`). The build copies the site settings into `dist/imd-deployment.json` (`site`), and the app reads every network-specific value from there at load (`web/src/site.ts`): the words (chain, strip, footer, explorer), the swap router (PoolSwapTest on Sepolia; Uniswap's Universal Router with Permit2 on Ethereum), the Buy page's "Pay with" routes (`pay`: on Ethereum ETH and USDC, swapped into IMD on IMD's own ETH pool, USDC first on Uniswap's USDC/ETH pool, priced by Uniswap's V4 Quoter, in the same router transaction as the PLEA; `null` on Sepolia, which pays IMD only), cashback (plain on Sepolia; staked as sIMD on Ethereum), the seat NFT, the first block of history, the indexer, the RPCs' log ranges and the source links. The JavaScript is the same for both builds; `index.html` (its meta and its first paint, "Loading the Sepolia deployment…") and the manifest differ.

```sh
npm --prefix web run build                             # Ethereum (networks/ethereum/deployment.json: launch #2647)
PLEA_NETWORK=sepolia-run9 npm --prefix web run build   # Sepolia run 9
# a test build against an Ethereum fork (never commit it):
node web/scripts/fork-deployment.mjs <base.json> <out.json>
PLEA_NETWORK=ethereum PLEA_DEPLOYMENT=<out.json> npm --prefix web run build
# Pay with ETH / USDC against PLEA's real deployment on a seeded local fork (never a public chain):
node web/scripts/ethereum-fork-pay.mjs <anvil port>
```

A testnet build fails if its pages, scripts or settings name the main network ("mainnet", "chain id 1"). The committed `dist/` is the default build (Ethereum); `verify-export` rebuilds it. `web/networks/ethereum/deployment.json` is written from IMD's launch record (`GET /launches/1fae5a48-dbc8-4f8e-9a61-e014f787bb47`: the five launch contracts, their deploy block, the attested ABI hashes, which equal `web/public/abi`'s); `site.json` names the Letterbox, Tribunal and hook the owner's deploy calls made (blocks 26,294,106 / 26,294,111 / 26,294,113), and the indexer `https://indexer.pleaimd.fun/graphql`. A test deployment (`PLEA_DEPLOYMENT`, from `fork-deployment.mjs`) brings its own first block and addresses.
