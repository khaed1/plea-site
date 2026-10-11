# PLEA site (Sepolia test launch #1242)

Static build of the PLEA site, served by GitHub Pages at https://khaed1.github.io/plea-site/.

- Built by IMD site job `d456a90e-3839-4e7d-9942-4b2b25409ec7`; source in
  [identity-md-launches/launch-1242-launch-plea-sepolia-foundry](https://github.com/identity-md-launches/launch-1242-launch-plea-sepolia-foundry/tree/e1a93f13dc30072e5ba524b34bdb9d5f1e8e56b2/web) at `e1a93f13` (PR #2).
- One local fix on top of that commit (`source/simd-decimals.diff`): sIMD has 24 decimals, and the cashback figure from `Stacker.stackedBy` is in tIMD.
- Rebuild: `cd web && npm ci && npm run build` (Vite, relative base `./`, hash routing), then copy `dist/` here.
- Reads the live Sepolia contracts of launch #1242; testnet only.
