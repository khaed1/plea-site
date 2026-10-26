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
