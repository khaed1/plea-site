// Every unit test runs against a deployment's site settings, as the site does after loadConfig:
// Sepolia run 9's unless a test sets another with useNetwork() (the Ethereum one is an Ethereum fork's).
import { loadNetwork } from "../scripts/network.mjs";
import { setSite } from "../src/site.ts";

/** The manifest the build would write for `key` (its network, walletAddChain and site blocks). */
export function manifestFor(key = "sepolia-run9") {
  const deployment =
    key === "ethereum" ? new URL("./fixtures/ethereum-fork-deployment.json", import.meta.url).pathname : undefined;
  const { handoff, net, site } = loadNetwork(key, deployment);
  return {
    version: 1,
    launchId: handoff.launchId,
    chainId: handoff.chainId,
    sourceCommit: handoff.sourceCommit,
    network: net.network,
    walletAddChain: net.walletAddChain,
    site,
  };
}
export const useNetwork = (key) => setSite(manifestFor(key));
useNetwork("sepolia-run9");
