// The deployment a build is for, chosen at build time: PLEA_NETWORK=ethereum (default: launch #2647, the
// committed dist/) or sepolia-run9.
// networks/<key>/site.json holds the site's settings for that deployment; networks/<key>/network.json and
// deployment.json its chain and contracts (sepolia-run9 keeps them in web/network-input.json and
// web/deployment-input.json, the run 9 handoff files IMD's scripts read). PLEA_DEPLOYMENT=<file> replaces the
// deployment for tests (an Ethereum fork's addresses); a deployment without contracts refuses to build.
import fs from "node:fs";

const web = new URL("../", import.meta.url);
const read = (u) => JSON.parse(fs.readFileSync(u, "utf8"));
export const NETWORKS = ["sepolia-run9", "ethereum"];

export function loadNetwork(key = process.env.PLEA_NETWORK || "ethereum", deploymentFile = process.env.PLEA_DEPLOYMENT) {
  if (!NETWORKS.includes(key)) throw Error(`PLEA_NETWORK must be one of ${NETWORKS.join(", ")}, not "${key}".`);
  const dir = new URL(`networks/${key}/`, web);
  const own = (f) => fs.existsSync(new URL(f, dir));
  const net = read(own("network.json") ? new URL("network.json", dir) : new URL("network-input.json", web));
  const handoff = deploymentFile
    ? read(new URL(deploymentFile, `file://${process.cwd()}/`))
    : read(own("deployment.json") ? new URL("deployment.json", dir) : new URL("deployment-input.json", web));
  const site = read(new URL("site.json", dir));
  if (site.key !== key) throw Error(`networks/${key}/site.json names "${site.key}".`);
  if (!factsValid(site.facts))
    throw Error(`networks/${key}/site.json: facts must give the holding bands (days and points, longest first) and receivedProfit, as its CabalGate does.`);
  if (handoff.chainId !== net.network.chainId)
    throw Error(`The deployment is for chain ${handoff.chainId}, the network is ${net.network.chainId}.`);
  if (!Array.isArray(handoff.contracts) || !handoff.contracts.length)
    throw Error(`No contract addresses for ${key} yet ([after launch]). Set PLEA_DEPLOYMENT to a deployment file to build it.`);
  for (const c of handoff.contracts)
    if (!/^0x[0-9a-fA-F]{40}$/.test(c.address || "") || !/^[0-9a-f]{64}$/.test(c.abiHash || ""))
      throw Error(`${c.name}: an address and an ABI hash are required.`);
  return { key, net, handoff, site: siteFor(site, handoff) };
}

/** site.json's fact-score rules (CabalGate._heldPoints and the profit of PLEA no buy record covers):
 * whole days and points, longest band first (src/site.ts validFacts, at load). */
const whole = (n, least = 0) => Number.isSafeInteger(n) && n >= least;
export const factsValid = (f) =>
  Array.isArray(f?.held) &&
  f.held.length > 0 &&
  f.held.every((b, i) => whole(b?.days, 1) && whole(b?.points) && (i === 0 || b.days < f.held[i - 1].days)) &&
  whole(f.receivedProfit);

/** site.json as the build ships it (the manifest's `site` block). A test deployment (fork-deployment.mjs's,
 * with a `test` block) brings its own first block (its contracts' deploy block) and its own Letterbox,
 * Tribunal and hook; otherwise site.json's `eventStart` and `expected` hold, and where they are null the
 * deployment's first contract block and PleaLaunch's own addresses (read at load) are used. */
export function siteFor(site, handoff) {
  const blocks = handoff.contracts.map((c) => c.blockNumber).filter((n) => Number.isSafeInteger(n));
  const t = handoff.test;
  const eventStart = (t ? null : site.eventStart) ?? (blocks.length ? Math.min(...blocks) : null);
  if (!Number.isSafeInteger(eventStart))
    throw Error(`No first block for ${site.key}'s history: set site.json eventStart or the contracts' blockNumber.`);
  const expected =
    t?.letterbox && t?.tribunal && t?.hook
      ? { Letterbox: t.letterbox.toLowerCase(), Tribunal: t.tribunal.toLowerCase(), PleaHook: t.hook.toLowerCase() }
      : site.expected ?? null;
  return { ...site, eventStart, expected };
}

/** index.html's title, link-preview tags and first paint ("Loading the Sepolia deployment…") for the
 * deployment on `network` (network.json's `network` block). */
export function htmlMeta(site, network) {
  const m = site.meta, esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  return {
    chain: esc(network.name),
    title: esc(m.title),
    description: esc(m.description),
    ogTitle: esc(m.ogTitle),
    ogDescription: esc(m.ogDescription),
    ogImage: esc(new URL("og.png", site.siteUrl).href),
    ogUrl: esc(site.siteUrl),
    ogImageAlt: esc(m.ogImageAlt),
  };
}
