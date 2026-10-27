// A deployment file (IMD's handoff format) for a test deployment of PLEA, e.g. an Ethereum fork made by
// khaed1/claude plea/site-design/tools/mainnet/deploy.mjs + base.mjs:
//   node web/scripts/fork-deployment.mjs <base.json or addresses.json> <out.json>
// then PLEA_NETWORK=ethereum PLEA_DEPLOYMENT=<out.json> npm --prefix web run build. Never for a real release.
import fs from "node:fs";
import { keccak256, toHex } from "viem";
const [src, out] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(src, "utf8"));
const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v;
const abiHash = (n) => keccak256(toHex(JSON.stringify(canonical(JSON.parse(fs.readFileSync(new URL(`../public/abi/${n}.json`, import.meta.url), "utf8")))))).slice(2);
const contracts = ["PLEA", "CabalGate", "Seasons", "PleaDistributor", "PleaLaunch"].map((name) => ({
  name, address: A[name].toLowerCase(), blockNumber: A.deployBlock, abiHash: abiHash(name),
}));
const d = { version: 1, launchId: "fork-test", chainId: A.chainId, repoUrl: "local fork", sourceCommit: "fork-test",
  attestationHash: "0".repeat(64), contracts, test: { letterbox: A.Letterbox, tribunal: A.Tribunal, hook: A.PleaHook } };
fs.writeFileSync(out, JSON.stringify(d, null, 1) + "\n");
console.log(`wrote ${out}: ${contracts.length} contracts on chain ${A.chainId}, deploy block ${A.deployBlock}`);
