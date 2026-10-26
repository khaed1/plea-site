// The deployment a build is for, chosen at build time: PLEA_NETWORK=sepolia-run9 (default) or ethereum.
// networks/<key>/site.json holds the site's settings for that deployment; networks/<key>/network.json and
// deployment.json its chain and contracts (sepolia-run9 keeps them in web/network-input.json and
// web/deployment-input.json, the run 9 handoff files IMD's scripts read). PLEA_DEPLOYMENT=<file> replaces the
// deployment for tests (an Ethereum fork's addresses); a deployment without contracts refuses to build: the
// mainnet addresses stay "[after launch]" until the launch hands them over.
import fs from "node:fs";

const web = new URL("../", import.meta.url);
const read = (u) => JSON.parse(fs.readFileSync(u, "utf8"));
export const NETWORKS = ["sepolia-run9", "ethereum"];

export function loadNetwork(key = process.env.PLEA_NETWORK || "sepolia-run9", deploymentFile = process.env.PLEA_DEPLOYMENT) {
  if (!NETWORKS.includes(key)) throw Error(`PLEA_NETWORK must be one of ${NETWORKS.join(", ")}, not "${key}".`);
  const dir = new URL(`networks/${key}/`, web);
  const own = (f) => fs.existsSync(new URL(f, dir));
  const net = read(own("network.json") ? new URL("network.json", dir) : new URL("network-input.json", web));
  const handoff = deploymentFile
    ? read(new URL(deploymentFile, `file://${process.cwd()}/`))
    : read(own("deployment.json") ? new URL("deployment.json", dir) : new URL("deployment-input.json", web));
  const site = read(new URL("site.json", dir));
  if (site.key !== key) throw Error(`networks/${key}/site.json names "${site.key}".`);
  if (handoff.chainId !== net.network.chainId)
    throw Error(`The deployment is for chain ${handoff.chainId}, the network is ${net.network.chainId}.`);
  if (!Array.isArray(handoff.contracts) || !handoff.contracts.length)
    throw Error(`No contract addresses for ${key} yet ([after launch]). Set PLEA_DEPLOYMENT to a deployment file to build it.`);
  for (const c of handoff.contracts)
    if (!/^0x[0-9a-fA-F]{40}$/.test(c.address || "") || !/^[0-9a-f]{64}$/.test(c.abiHash || ""))
      throw Error(`${c.name}: an address and an ABI hash are required.`);
  return { key, net, handoff, site };
}

/** index.html's title and link-preview tags for the deployment. */
export function htmlMeta(site) {
  const m = site.meta, esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  return {
    title: esc(m.title),
    description: esc(m.description),
    ogTitle: esc(m.ogTitle),
    ogDescription: esc(m.ogDescription),
    ogImage: esc(new URL("og.png", site.siteUrl).href),
    ogUrl: esc(site.siteUrl),
    ogImageAlt: esc(m.ogImageAlt),
  };
}
