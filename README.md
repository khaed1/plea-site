# PLEA site

The PLEA website: a static Vite + React + TypeScript app (wagmi/viem) that reads PLEA's contracts from public RPCs. Not an official IMD page.

- `web/`: the source. It started as IMD's run 9 site (launch #2234 repository, commit `b214b529673ac46ec8adbb0766086403971efc34`, folder `web/`), with its licences (`web/licenses/`), unit tests (`web/tests/`) and QA scripts (`web/scripts/`).
- `dist/`: the built export, committed. IMD hosts exactly these bytes (its import reads this repository as a site with `build: false`, `exportDir: "dist"`).
- `docs/imd-run9/`: IMD's notes from the three run 9 site jobs (FRONTEND, DESIGN, FIXES, VALIDATION).
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

One source builds either deployment, chosen at build time with `PLEA_NETWORK`: `sepolia-run9` (the default, run 9 on Sepolia) or `ethereum`. Each has `web/networks/<key>/site.json` (Sepolia keeps its chain and contracts in `web/network-input.json` and `web/deployment-input.json`; Ethereum in `web/networks/ethereum/network.json` and `deployment.json`). The build copies the site settings into `dist/imd-deployment.json` (`site`), and the app reads every network-specific value from there at load (`web/src/site.ts`): the words (chain, strip, footer, explorer), the swap router (PoolSwapTest on Sepolia; Uniswap's Universal Router with Permit2 on Ethereum), cashback (plain on Sepolia; staked as sIMD on Ethereum), the seat NFT, the first block of history, the indexer, the RPCs' log ranges and the source links. The JavaScript is the same for both builds; `index.html` (its meta and its first paint, "Loading the Sepolia deployment…") and the manifest differ.

```sh
PLEA_NETWORK=ethereum npm --prefix web run build   # refuses until the launch's addresses are in networks/ethereum/deployment.json ([after launch])
# a test build against an Ethereum fork (never commit it):
node web/scripts/fork-deployment.mjs <base.json> <out.json>
PLEA_NETWORK=ethereum PLEA_DEPLOYMENT=<out.json> npm --prefix web run build
```

A testnet build fails if its pages, scripts or settings name the main network ("mainnet", "chain id 1"). The committed `dist/` is the default build.
