import {
  NO_ANSWER,
  archivePattern,
  classifyRpc,
  rpcDetail,
  rpcFetch,
  registerHealthReset,
} from "./rpc-health";
export { resetHealth } from "./rpc-health";
import {
  createPublicClient,
  defineChain,
  custom,
  http,
  keccak256,
  toHex,
  parseAbi,
  type Abi,
  type Address,
} from "viem";
import { createConfig, createStorage, noopStorage } from "wagmi";
import { injected } from "wagmi/connectors";
import expectedAbi from "./abi-hashes.json";
import { setSite, type Site } from "./site";
/** The ABI hashes of the contracts the deployment file does not list (Letterbox, Tribunal, PleaHook).
 * Every network setting (the first block, the oracle API, the swap router, the expected addresses…)
 * comes from the deployment's site block: `site()` (site.ts). */
export const APP = { expectedAbi };
export const erc20Abi = parseAbi([
  "function symbol() view returns(string)",
  "function decimals() view returns(uint8)",
  "function balanceOf(address) view returns(uint256)",
  "function allowance(address,address) view returns(uint256)",
  "function approve(address,uint256) returns(bool)",
]);
/** imd/acc's sIMD vault (ERC-4626, 24 decimals): the wallet's staked cashback. */
export const vaultAbi = parseAbi([
  "function balanceOf(address) view returns(uint256)",
  "function convertToAssets(uint256) view returns(uint256)",
]);
export const intakeAbi = parseAbi([
  "function requests(bytes32) view returns(address payer,address callbackTarget,bytes4 callbackSelector,bool completed)",
]);
export const claimsAbi = parseAbi([
  "function balanceOf(address,uint256) view returns(uint256)",
  "function transfer(address,uint256,uint256) returns(bool)",
]);
export const registryAbi = parseAbi([
  "struct Delegation { uint8 type; address to; address from; bytes32 rights; address contract_; uint256 tokenId; uint256 amount; }",
  "function getIncomingDelegations(address) view returns(Delegation[])",
]);
export const poolTuple =
  "(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)";
export const swapAbi = parseAbi([
  `function swap(${poolTuple} key,(bool zeroForOne,int256 amountSpecified,uint160 sqrtPriceLimitX96) params,(bool takeClaims,bool settleUsingBurn) testSettings,bytes hookData) payable returns(int256 delta)`,
]);
export const quoterAbi = parseAbi([
  `function quoteExactInputSingle((${poolTuple} poolKey,bool zeroForOne,uint128 exactAmount,bytes hookData) params) returns(uint256 amountOut,uint256 gasEstimate)`,
]);
const canonical = (v: any): any =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical(v[k])]),
        )
      : v;
export async function loadConfig() {
  const response = await fetch("./imd-deployment.json");
  if (!response.ok)
    throw Error("The deployment file could not be loaded. Reload this page.");
  const manifest = await response.json();
  const n = manifest.network;
  if (n.chainId !== manifest.chainId)
    throw Error("Deployment and network disagree. Transactions are disabled.");
  const siteSettings: Site = setSite(manifest);
  const chain = defineChain({
    id: manifest.chainId,
    name: n.name,
    nativeCurrency: n.nativeCurrency,
    rpcUrls: { default: { http: n.rpcUrls } },
    blockExplorers: { default: { name: "Etherscan", url: n.explorer } },
    testnet: n.testnet,
    contracts: {
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
        blockCreated: 751532,
      },
    },
  });
  const transport = resilientTransport(
    n.rpcUrls,
    undefined,
    undefined,
    undefined,
    siteSettings.logRanges,
  );
  const client = createPublicClient({
    chain,
    transport,
    batch: { multicall: { wait: 16 } },
  });
  const abis: Record<string, Abi> = {};
  const addresses: Record<string, Address> = {};
  await Promise.all(
    [
      ...manifest.contracts.map((c: any) => c.name),
      "Letterbox",
      "Tribunal",
      "PleaHook",
    ].map(async (name) => {
      const entry = manifest.contracts.find((c: any) => c.name === name);
      const r = await fetch("./" + (entry?.abiPath || `abi/${name}.json`));
      if (!r.ok) throw Error(`Cannot load ${name}'s interface.`);
      const abi = await r.json();
      if (
        keccak256(toHex(JSON.stringify(canonical(abi)))).slice(2) !==
        (entry?.abiHash ||
          APP.expectedAbi[name as keyof typeof APP.expectedAbi])
      )
        throw Error(`${name}'s interface does not match the deployment.`);
      abis[name] = abi;
      if (entry) addresses[name] = entry.address;
    }),
  );
  const walletConfig = createConfig({
    chains: [chain],
    multiInjectedProviderDiscovery: true,
    connectors: [injected()],
    transports: { [chain.id]: transport },
    storage: createStorage({ storage: walletStorage() }),
  });
  return {
    manifest,
    network: n,
    site: siteSettings,
    chain,
    client,
    abis,
    addresses,
    walletConfig,
  };
}
/** wagmi's storage (it remembers the connected wallet between visits): the browser's, or none where the
 * browser blocks it. With every cookie blocked Chrome throws on reading window.localStorage itself, which
 * wagmi's default storage does unguarded, so the deployment never loaded; now the site loads and only
 * forgets the wallet between visits. */
function walletStorage() {
  try {
    const storage = window.localStorage;
    storage.getItem("wagmi.store");
    return storage;
  } catch {
    return noopStorage;
  }
}
export type Runtime = Awaited<ReturnType<typeof loadConfig>>;
export async function discover(r: Runtime) {
  if ((await r.client.getChainId()) !== r.chain.id)
    throw Error("The RPC answered for another network. Try again.");
  for (const [name, method] of [
    ["Letterbox", "letterbox"],
    ["Tribunal", "tribunal"],
    ["PleaHook", "hook"],
  ]) {
    const address = (await r.client.readContract({
      address: r.addresses.PleaLaunch,
      abi: r.abis.PleaLaunch,
      functionName: method,
    })) as Address;
    const expected = r.site.expected?.[name as "Letterbox"];
    if (expected && address.toLowerCase() !== expected.toLowerCase())
      throw Error(
        `${name} differs from this deployment’s address. Transactions are disabled.`,
      );
    r.addresses[name] = address;
  }
  const token = (await r.client.readContract({
    address: r.addresses.PleaLaunch,
    abi: r.abis.PleaLaunch,
    functionName: "imd",
  })) as Address;
  r.addresses.PairToken = token;
  const pm = await r.client.readContract({
    address: r.addresses.PleaLaunch,
    abi: r.abis.PleaLaunch,
    functionName: "poolManager",
  });
  if (
    String(pm).toLowerCase() !== r.network.uniswapV4.poolManager.toLowerCase()
  )
    throw Error("PoolManager differs from the network handoff.");
  // The cashback Stacker and the seat NFT the site names must be the ones the contracts use.
  const [stacker, seat] = await Promise.all([
    r.client.readContract({
      address: r.addresses.PleaHook,
      abi: r.abis.PleaHook,
      functionName: "stacker",
    }),
    r.client.readContract({
      address: r.addresses.Seasons,
      abi: r.abis.Seasons,
      functionName: "seat",
    }),
  ]);
  if (String(stacker).toLowerCase() !== r.site.cashback.stacker.toLowerCase())
    throw Error("The cashback Stacker differs from this deployment’s.");
  if (String(seat).toLowerCase() !== r.site.seat.address.toLowerCase())
    throw Error("The seat NFT differs from this deployment’s.");
  // "Pay with" routes end in the pool's IMD: PleaLaunch's, never a guess.
  const pay = r.site.pay;
  if (pay && pay.routes.some((route) => route.path.at(-1)!.currency !== token.toLowerCase()))
    throw Error("The payment routes do not end in this deployment’s pool currency. Transactions are disabled.");
  const trade = r.site.trade;
  await Promise.all(
    [
      ...Object.values(r.addresses),
      trade.router,
      ...(trade.kind === "universalRouter" ? [trade.permit2] : []),
      ...(r.site.cashback.simd ? [r.site.cashback.simd] : []),
      ...(pay
        ? [
            pay.quoter,
            ...pay.routes.flatMap((route) => [route.currency, ...route.path.map((h) => h.hooks)]),
          ].filter((a, i, all) => !/^0x0{40}$/.test(a) && all.indexOf(a) === i)
        : []),
    ].map(async (a) => {
      const code = await r.client.getCode({ address: a });
      if (!code || code === "0x")
        throw Error(`A required contract has no code: ${a}`);
    }),
  );
  return r;
}

/** Shared endpoint health: failures cool down once; JSON-RPC reverts remain request errors.
 * A read the first endpoint has not answered within `hedge` ms is also sent to the next
 * one: the first answer wins and the slower endpoint cools down, so a hung RPC costs
 * 2 s once instead of the 6 s timeout (X1). eth_getLogs is never doubled. */
export function resilientTransport(
  urls: string[],
  timeout = 6000,
  cooldown = 60000,
  hedge = 2000,
  /** eth_getLogs block ranges per URL and `default` (site.logRanges; 0: never ask it for logs). */
  logRanges: Record<string, number> = {},
) {
  const endpoints = urls.map((url) => ({
    url,
    /** The widest eth_getLogs range this RPC answers (0: never ask it for logs). */
    logRange: logRanges[url] ?? logRanges.default ?? Infinity,
    /** Until when this RPC is not asked for logs (it refused an old range: publicnode's archive). */
    logsDown: 0,
    transport: http(url, {
      timeout,
      retryCount: 0,
      batch: { batchSize: 5, wait: 16 },
      fetchFn: rpcFetch,
    })({}),
    logs: http(url, { timeout, retryCount: 0, fetchFn: rpcFetch })({}),
    down: 0,
  }));
  type Endpoint = (typeof endpoints)[number];
  type Outcome = { endpoint: Endpoint; ok: boolean; value: any };
  registerHealthReset(() =>
    endpoints.forEach((e) => {
      e.down = 0;
      e.logsDown = 0;
    }),
  );
  return custom(
    {
      async request(args: any) {
        let first: any, answer: any;
        const logs = args.method === "eth_getLogs";
        // eth_getLogs goes only to the RPCs that answer its range: a wider range than any of them
        // takes is refused here in the words scanLogs splits on ("limited to N blocks").
        const width = logs ? logWidth(args.params?.[0]) : undefined;
        const eligible = logs
          ? endpoints.filter(
              (e) => e.logRange > 0 && (width === undefined || width <= e.logRange),
            )
          : endpoints;
        if (logs && !eligible.length)
          throw Object.assign(
            Error(
              `eth_getLogs is limited to ${Math.max(...endpoints.map((e) => (Number.isFinite(e.logRange) ? e.logRange : 0)))} blocks on these RPCs.`,
            ),
            { code: -32005 },
          );
        const usable = logs
          ? eligible.filter((e) => e.logsDown <= Date.now())
          : eligible;
        const pool = usable.length ? usable : eligible;
        const healthy = pool.filter((e) => e.down <= Date.now());
        const candidates = healthy.length
          ? healthy
          : [...pool].sort((a, b) => a.down - b.down);
        const start = (endpoint: Endpoint): Promise<Outcome> =>
          (args.method === "eth_getLogs" ? endpoint.logs : endpoint.transport)
            .request(args)
            .then(
              (value: any) => ({ endpoint, ok: true, value }),
              (value: any) => ({ endpoint, ok: false, value }),
            );
        const live = new Map<Endpoint, Promise<Outcome>>();
        let next = 0;
        while (next < candidates.length || live.size) {
          if (!live.size) {
            const endpoint = candidates[next++];
            live.set(endpoint, start(endpoint));
          }
          let timer: ReturnType<typeof setTimeout> | undefined;
          const outcome = await Promise.race<Outcome | undefined>([
            ...live.values(),
            ...(args.method !== "eth_getLogs" &&
            live.size === 1 &&
            next < candidates.length
              ? [
                  new Promise<undefined>((resolve) => {
                    timer = setTimeout(resolve, hedge);
                  }),
                ]
              : []),
          ]);
          clearTimeout(timer);
          if (!outcome) {
            const endpoint = candidates[next++];
            live.set(endpoint, start(endpoint));
            continue;
          }
          live.delete(outcome.endpoint);
          if (outcome.ok) {
            outcome.endpoint.down = 0;
            // An endpoint asked earlier is still silent: too slow for now.
            for (const slow of live.keys()) slow.down = Date.now() + cooldown;
            return outcome.value;
          }
          // An RPC that keeps only recent history (publicnode: "Archive requests require a
          // personal token") is no answer for an old range: the next one is asked, and this one
          // is left out of log reads for a while.
          if (archivePattern.test(rpcDetail(outcome.value).text)) {
            if (logs) outcome.endpoint.logsDown = Date.now() + cooldown;
            first ||= outcome.value;
            continue;
          }
          const kind = classifyRpc(outcome.value);
          if (kind === "request") throw outcome.value;
          first ||= outcome.value;
          if (kind === "answer") answer ||= outcome.value;
          if (kind === "transport")
            outcome.endpoint.down = Date.now() + cooldown;
        }
        // A node that answered (a head lag, 4444, -32603) says more than one that did not:
        // with publicnode refused and sentio one block behind, the caller sees the lag.
        throw (
          answer ||
          first ||
          Error(NO_ANSWER)
        );
      },
    },
    { retryCount: 0 },
  );
}

/** The block range of an eth_getLogs filter, or undefined (a blockHash filter, or "latest"). */
export function logWidth(filter: any): number | undefined {
  const n = (v: any) =>
    typeof v === "string" && /^0x[0-9a-f]+$/i.test(v) ? Number(BigInt(v)) : undefined;
  const from = n(filter?.fromBlock),
    to = n(filter?.toBlock);
  return from === undefined || to === undefined ? undefined : to - from + 1;
}
