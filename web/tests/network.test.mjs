// Two-network build: the network a build is for (PLEA_NETWORK, PLEA_DEPLOYMENT), the site settings
// the manifest carries, the words that differ by network, the Buy page's steps on each router, the
// history path (indexer, then logs) and the Ethereum RPCs' log limits.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { encodeErrorResult, encodeAbiParameters, parseAbi } from "viem";
import { loadNetwork, siteFor, htmlMeta } from "../scripts/network.mjs";
import * as site from "../src/site.ts";
import { manifestFor, useNetwork } from "./site-setup.mjs";
import { explainError } from "../src/errors.ts";
import { readErrorTitle, NO_ANSWER, archivePattern } from "../src/rpc-health.ts";

const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-network-"));
after(() => rm(dir, { recursive: true, force: true }));
async function load(name) {
  const outfile = path.join(dir, name + ".mjs");
  await build({
    entryPoints: [fileURLToPath(new URL("../src/" + name + ".ts", import.meta.url))],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    plugins: [
      {
        name: "locked",
        setup(b) {
          b.onResolve({ filter: /^(viem|wagmi)(\/.*)?$/ }, (a) => ({
            path: require.resolve(a.path),
            external: true,
          }));
        },
      },
    ],
  });
  return import(pathToFileURL(outfile));
}
const fork = new URL("./fixtures/ethereum-fork-deployment.json", import.meta.url).pathname;
after(() => useNetwork("sepolia-run9"));

test("PLEA_NETWORK: sepolia-run9 by default, ethereum by name, nothing else", () => {
  const saved = process.env.PLEA_NETWORK;
  delete process.env.PLEA_NETWORK;
  try {
    const n = loadNetwork();
    assert.equal(n.key, "sepolia-run9");
    assert.equal(n.net.network.chainId, 11155111);
    assert.equal(n.site.eventStart, 11948819);
    assert.equal(n.site.trade.kind, "poolSwapTest");
    assert.equal(n.site.expected.Letterbox, "0xbc335ae3dc12d4bf78f8e44a03f4fc62e3afd1d3");
    assert.ok(n.net.walletAddChain, "Sepolia can be added to a wallet");
    assert.throws(() => loadNetwork("mainnet"), /PLEA_NETWORK must be one of sepolia-run9, ethereum/);
  } finally {
    if (saved !== undefined) process.env.PLEA_NETWORK = saved;
  }
});

test("the Ethereum build refuses to build without the launch's addresses ([after launch])", () => {
  assert.throws(() => loadNetwork("ethereum", undefined), /No contract addresses for ethereum yet \(\[after launch\]\)/);
  // A deployment for another chain is refused too.
  assert.throws(
    () => loadNetwork("ethereum", path.join(path.dirname(fork), "../../deployment-input.json")),
    /The deployment is for chain 11155111, the network is 1/,
  );
});

test("PLEA_DEPLOYMENT: an Ethereum fork's deployment fills the first block and the expected addresses", () => {
  const n = loadNetwork("ethereum", fork);
  assert.equal(n.net.network.chainId, 1);
  assert.equal(n.site.eventStart, 26278701, "the launch's deploy block");
  assert.deepEqual(n.site.expected, {
    Letterbox: "0xd880df8ac733a5fddf7f20d83b5426584b3fb647",
    Tribunal: "0xc15a7a283eaad3aa281c376b6bcff5c67b1109b4",
    PleaHook: "0xa2fa389268344712b1ef1e1046a74bf16952e8cc",
  });
  assert.equal(n.site.trade.kind, "universalRouter");
  assert.equal(n.site.trade.router, "0x23617e59a5925b2a4bf75d73ff6711cd0b29de85");
  assert.equal(n.site.cashback.simd, "0x9efa934d9fad4ae28c998a40195646b965a97247");
  assert.equal(n.site.cashback.simdDecimals, 24);
  assert.equal(n.site.seat.address, "0x0000ec93127baa929e58e97dd0095a2bfb38ec1d");
  assert.equal(n.site.seat.name, "identity.md seat");
  assert.equal(n.site.letterMessagePage, "https://etherscan.io/idm");
  assert.equal(n.net.walletAddChain, null, "Ethereum is switched to, never added");
  assert.equal(n.net.network.rpcUrls.at(-1), "https://mainnet.gateway.tenderly.co", "Tenderly last (429 on bursts)");
  assert.equal(n.site.logRanges["https://rpc.flashbots.net"], 0, "Flashbots answers old ranges with []");
  // A site.json that names its own values keeps them; no first block anywhere is an error.
  assert.equal(siteFor({ key: "x", eventStart: 5, expected: null }, { contracts: [{ blockNumber: 9 }] }).eventStart, 5);
  assert.throws(() => siteFor({ key: "x", eventStart: null }, { contracts: [{}] }), /No first block/);
  // index.html's link preview names the deployment's own URL.
  assert.equal(htmlMeta(n.site).ogUrl, "https://plea.sites.imd.fun/");
  assert.equal(htmlMeta(loadNetwork("sepolia-run9").site).ogUrl, "https://plea-test-run-9.sites.imd.fun/");
});

test("the site settings come from the manifest and are checked", () => {
  const m = manifestFor("ethereum");
  const x = site.siteFrom(m);
  assert.equal(x.chain, "Ethereum");
  assert.equal(x.chainId, 1);
  assert.equal(x.testnet, false);
  assert.equal(x.explorer, "https://etherscan.io");
  assert.throws(() => site.siteFrom({ network: m.network }), /no site settings/);
  assert.throws(() => site.siteFrom({ ...m, site: { ...m.site, eventStart: null } }), /no first block/);
  assert.throws(() => site.siteFrom({ ...m, site: { ...m.site, trade: { kind: "x" } } }), /no swap router/);
});

test("network words: Sepolia keeps its test-run words, Ethereum says none of them", () => {
  const sepolia = site.siteFrom(manifestFor("sepolia-run9")),
    eth = site.siteFrom(manifestFor("ethereum"));
  assert.equal(site.cantReach(false, sepolia), "Can’t reach Sepolia");
  assert.equal(site.cantReach(true, eth), "Can’t read Ethereum");
  assert.equal(site.switchText(sepolia), "Switch to Sepolia");
  assert.equal(site.switchText(eth), "Switch to Ethereum");
  assert.equal(site.soFar(sepolia), " in this test run");
  assert.equal(site.soFar(eth), " yet");
  assert.match(site.fundsFix(sepolia), /test tokens/);
  assert.doesNotMatch(site.fundsFix(eth), /test/);
  assert.equal(site.gasText(sepolia), "You need Sepolia ETH for gas and enough tokens for this action. Add test funds and try again.");
  assert.equal(site.gasText(eth), "You need ETH for gas and enough tokens for this action. Add funds and try again.");
  assert.equal(site.walletNote(sepolia), "Sepolia test tokens have no value. Connecting never sends a transaction.");
  assert.equal(site.walletNote(eth), "Connecting never sends a transaction.");
  assert.equal(sepolia.strip, "Sepolia test run 9 · test tokens, no value");
  assert.equal(eth.strip, null, "no test-run strip");
  assert.equal(sepolia.footer, "Sepolia test tokens have no value.");
  assert.equal(eth.footer, "Any PLEA traded before launch day isn’t ours.");
  assert.equal(site.sourceLink("src/CabalGate.sol", sepolia), "https://github.com/khaed1/plea/blob/testnet9/src/CabalGate.sol");
  assert.equal(site.sourceLink("src/CabalGate.sol", eth), "https://github.com/khaed1/plea/blob/mainnet/src/CabalGate.sol");
  assert.deepEqual(site.routerRow(sepolia), { name: "Uniswap v4 PoolSwapTest", note: "the swap router this test run trades through" });
  assert.equal(site.routerRow(eth).name, "Uniswap Universal Router");
  assert.equal(sepolia.explorerName, "Sepolia Etherscan");
  assert.equal(eth.explorerName, "Etherscan");
  assert.equal(sepolia.pairSymbol, "imdTEST");
  assert.equal(eth.pairSymbol, "IMD");
  assert.equal(sepolia.contracts.launch, "Sepolia test run 9 · launch #2234");
  assert.equal(eth.contracts.meta, "Ethereum mainnet");
  assert.equal(sepolia.seat.note, "a test NFT on Sepolia");
  assert.equal(eth.seat.note, null);
  assert.equal(sepolia.letterMessagePage, null, "Sepolia keeps the message-page card hidden");
  // Cashback: staked as sIMD on Ethereum, plain imdTEST in the test run.
  const plain = site.cashbackWords("imdTEST", sepolia),
    staked = site.cashbackWords("IMD", eth);
  assert.equal(plain.row("0.50%"), "Back to you as cashback (0.50%)");
  assert.equal(staked.row("0.50%"), "Back to you as staked IMD (0.50%)");
  assert.equal(plain.plainNote, "In this test run it arrives as plain imdTEST, not staked.");
  assert.equal(staked.plainNote, "");
  assert.equal(staked.profileNote, "As staked IMD through imd/acc");
  assert.equal(plain.profileNote, "Paid in plain imdTEST in this test run");
  assert.equal(staked.step("0.5%", "0.49 IMD on a 100 IMD buy"), "0.5% comes back to you as staked IMD (0.49 IMD on a 100 IMD buy)");
  assert.equal(plain.feesRow, "Cashback to you, in plain imdTEST");
  assert.equal(staked.feesRow, "Cashback to you, as staked IMD through imd/acc");
  // The scanner warning: Ethereum only, plain words.
  assert.equal(site.sellGateWarning(sepolia), undefined);
  const w = site.sellGateWarning(eth);
  assert.match(w.title, /unsellable/);
  assert.match(w.body, /Blockaid in MetaMask, GoPlus and honeypot\.is/);
  assert.match(w.body, /selling needs an approved plea/);
  // Neither network's words say "mainnet" where the Sepolia build could show them.
  for (const text of [site.gasText(eth), site.fundsFix(eth), site.walletNote(eth), w.title, w.body, staked.row("1%")])
    assert.doesNotMatch(text, /mainnet|chain id 1\b/i);
});

test("errors and read titles name the deployment's chain", () => {
  try {
    useNetwork("ethereum");
    assert.equal(readErrorTitle("p", NO_ANSWER, "9"), "Can’t reach Ethereum");
    assert.equal(readErrorTitle("letters", "The RPC answered, but…"), "Can’t read Ethereum");
    assert.equal(explainError({ message: "insufficient funds for gas" }).title, site.gasText());
    useNetwork("sepolia-run9");
    assert.equal(readErrorTitle("p", NO_ANSWER, "9"), "Can’t reach Sepolia");
    assert.match(explainError({ message: "insufficient funds for gas" }).title, /Sepolia ETH/);
  } finally {
    useNetwork("sepolia-run9");
  }
});

test("Universal Router and Permit2 errors read in plain words", () => {
  const ur = parseAbi([
    "error ExecutionFailed(uint256 commandIndex, bytes message)",
    "error BalanceTooLow()",
    "error V4TooLittleReceived(uint256 minAmountOutReceived, uint256 amountReceived)",
    "error AllowanceExpired(uint256 deadline)",
    "error InsufficientAllowance(uint256 amount)",
  ]);
  const wrapped = (inner) =>
    ({ cause: { data: encodeErrorResult({ abi: ur, errorName: "ExecutionFailed", args: [1n, inner] }) } });
  const low = encodeErrorResult({ abi: ur, errorName: "BalanceTooLow" });
  assert.match(explainError(wrapped(low)).title, /price moved past your slippage limit/);
  // The page's own words win, as for PoolSwapTest's price limit.
  assert.equal(
    explainError(wrapped(low), [], { BalanceTooLow: { title: "The price moved more than 1%." } }).title,
    "The price moved more than 1%.",
  );
  const tooLittle = encodeErrorResult({ abi: ur, errorName: "V4TooLittleReceived", args: [10n, 9n] });
  assert.match(explainError({ cause: { data: tooLittle } }).title, /slippage limit/);
  const expired = encodeErrorResult({ abi: ur, errorName: "AllowanceExpired", args: [1793047171n] });
  assert.match(explainError({ cause: { data: expired } }).title, /Permit2 allowance for Uniswap’s router has expired/);
  const small = encodeErrorResult({ abi: ur, errorName: "InsufficientAllowance", args: [5n] });
  assert.match(explainError({ cause: { data: small } }).title, /smaller than this trade/);
  // Permit2's transferFrom refused by the token (solmate's TRANSFER_FROM_FAILED).
  const stf = "0x08c379a0" + encodeAbiParameters([{ type: "string" }], ["TRANSFER_FROM_FAILED"]).slice(2);
  assert.match(explainError({ cause: { data: stf } }).title, /Permit2 could not take the tokens/);
  // A command's failure the site cannot decode still reads as the router's.
  assert.match(explainError(wrapped("0x12345678")).title, /Uniswap’s router stopped the trade/);
});

test("the Buy page's steps: two on PoolSwapTest, three through Permit2, a covered step skipped", async () => {
  const { tradeSteps } = await import("../src/trade-text.ts");
  const base = { universal: true, selling: false, amount: "5.00 IMD", staked: true };
  assert.equal(
    tradeSteps({ ...base, step: "token", stepNumber: 1, total: 3 }),
    "Step 1 of 3: lets Permit2 move exactly 5.00 IMD from your wallet, for Uniswap’s router. Nothing is bought yet.",
  );
  assert.equal(
    tradeSteps({ ...base, step: "permit2", stepNumber: 2, total: 3 }),
    "Step 2 of 3: lets Uniswap’s Universal Router take exactly 5.00 IMD through Permit2, for 30 minutes. Nothing is bought yet.",
  );
  assert.equal(
    tradeSteps({ ...base, step: "trade", stepNumber: 3, total: 3, cashback: "0.02 IMD" }),
    "Step 3 of 3: the buy. 0.02 IMD cashback is staked for you in the same transaction.",
  );
  // Only the Permit2 step left (IMD already approved to Permit2): two steps.
  assert.match(tradeSteps({ ...base, step: "permit2", stepNumber: 1, total: 2 }), /^Step 1 of 2: lets Uniswap’s Universal Router/);
  // Both covered: the buy alone, no step count.
  assert.equal(
    tradeSteps({ ...base, step: "trade", stepNumber: 1, total: 1, cashback: "0.02 IMD" }),
    "0.02 IMD cashback is staked for you in the same transaction.",
  );
  // A large buy whose cashback is an ERC-6909 claim says so (sweep nit), on either network.
  assert.equal(
    tradeSteps({ ...base, step: "trade", stepNumber: 1, total: 1, cashback: "0.49 imdTEST", claims: true, staked: false }),
    "0.49 imdTEST cashback arrives as a claim on the PoolManager (see Profile), in the same transaction.",
  );
  // Sepolia: PoolSwapTest's one approval, then the buy; plain cashback.
  assert.equal(
    tradeSteps({ step: "token", stepNumber: 1, total: 2, universal: false, selling: false, amount: "1.25 imdTEST" }),
    "Step 1 of 2: lets the buy spend exactly 1.25 imdTEST. Nothing is bought yet.",
  );
  assert.equal(
    tradeSteps({ step: "trade", stepNumber: 1, total: 1, universal: false, selling: false, amount: "1.25 imdTEST", cashback: "0.01 imdTEST" }),
    "0.01 imdTEST cashback is paid to you in the same transaction.",
  );
  // A sale after the death through the router: no cashback words.
  assert.equal(
    tradeSteps({ ...base, selling: true, amount: "347,371 PLEA", step: "trade", stepNumber: 3, total: 3 }),
    "Step 3 of 3: the sale.",
  );
});

test("history: the indexer as far as it has indexed, then chunked logs from where it stopped", async () => {
  const chain = await load("chain");
  const m = manifestFor("ethereum");
  site.setSite({ ...m, site: { ...m.site, indexer: { graphql: "http://indexer.invalid/graphql" } } });
  const calls = [],
    original = globalThis.fetch;
  const r = {
    chain: { id: 1 },
    addresses: { CabalGate: "0x8b21219cd72938e25e0d37a1aa55599fdb23823a", PairToken: "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7" },
    abis: { CabalGate: [] },
    client: {
      async getLogs({ fromBlock, toBlock, address }) {
        calls.push([fromBlock, toBlock, address]);
        return [];
      },
    },
  };
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: {
            rawLogs: {
              items: [
                {
                  blockNumber: "26278705", blockHash: "0x" + "11".repeat(32), blockTimestamp: "1793039900",
                  transactionHash: "0x" + "22".repeat(32), transactionIndex: 0, logIndex: 3,
                  address: r.addresses.CabalGate, topic0: "0x" + "ab".repeat(32), topic1: null, topic2: null, topic3: null, data: "0x",
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
            _meta: { status: { 1: { block: { number: 26300000 } } } },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    const h = await chain.readHistory(r, 26278701n, 26300100n);
    assert.equal(h.error, undefined);
    assert.equal(h.logs.length, 1, "the indexer's log, decoded like an RPC log");
    assert.equal(h.logs[0].contract, "CabalGate");
    assert.deepEqual(
      calls.map(([a, b]) => [a, b]),
      [[26300001n, 26300100n]],
      "the RPCs read only what the indexer has not reached",
    );
    assert.deepEqual(calls[0][2], [r.addresses.CabalGate], "never the pool currency's own events");
    // An indexer that fails leaves the whole range to the RPCs, in the deployment's chunks.
    calls.length = 0;
    globalThis.fetch = async () => new Response("bad gateway", { status: 502 });
    const all = await chain.readHistory(r, 26278701n, 26378700n);
    assert.equal(all.error, undefined);
    assert.equal(all.covered, 26378700n);
    assert.deepEqual(calls.map(([a, b]) => [a, b]), [
      [26278701n, 26328700n],
      [26328701n, 26378700n],
    ], "50,000-block chunks on Ethereum");
  } finally {
    globalThis.fetch = original;
    useNetwork("sepolia-run9");
  }
});

test("Ethereum RPCs: log ranges per RPC, Flashbots never asked for logs, an archive refusal tries the next", async () => {
  const { resilientTransport, logWidth } = await load("config");
  assert.equal(logWidth({ fromBlock: "0x1", toBlock: "0xc350" }), 50000);
  assert.equal(logWidth({ blockHash: "0xab" }), undefined);
  assert.ok(archivePattern.test("Archive requests require a personal token. Get one at: https://www.allnodes.com/publicnode"));
  assert.ok(archivePattern.test("pruned history unavailable"));
  const urls = ["https://publicnode.invalid", "https://mevblocker.invalid", "https://flashbots.invalid", "https://tenderly.invalid"],
    ranges = { default: 50000, "https://publicnode.invalid": 5000, "https://flashbots.invalid": 0 };
  const original = globalThis.fetch,
    calls = [];
  let archive = true;
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body),
      host = new URL(String(url)).host.split(".")[0];
    calls.push([host, (Array.isArray(body) ? body[0] : body).method]);
    const answer = (x) =>
      host === "publicnode" && x.method === "eth_getLogs" && archive
        ? { jsonrpc: "2.0", id: x.id, error: { code: -32602, message: "Archive requests require a personal token. Get one at: https://www.allnodes.com/publicnode" } }
        : { jsonrpc: "2.0", id: x.id, result: x.method === "eth_getLogs" ? [] : "0x1" };
    return new Response(JSON.stringify(Array.isArray(body) ? body.map(answer) : answer(body)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const t = resilientTransport(urls, 1000, 60000, 2000, ranges)({});
    // 50,000 blocks: publicnode (5,000) and Flashbots (0) are left out.
    await t.request({ method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "0xc350" }] });
    assert.deepEqual(calls, [["mevblocker", "eth_getLogs"]]);
    // 4,000 old blocks: publicnode refuses (archive), MEV Blocker answers; publicnode then rests for logs only.
    calls.length = 0;
    await t.request({ method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "0xfa0" }] });
    assert.deepEqual(calls, [["publicnode", "eth_getLogs"], ["mevblocker", "eth_getLogs"]]);
    calls.length = 0;
    await t.request({ method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "0xfa0" }] });
    assert.deepEqual(calls, [["mevblocker", "eth_getLogs"]]);
    calls.length = 0;
    assert.equal(await t.request({ method: "eth_chainId" }), "0x1");
    assert.deepEqual(calls, [["publicnode", "eth_chainId"]], "reads still go to publicnode first");
    // Wider than every RPC takes: refused in the words scanLogs splits on.
    const narrow = resilientTransport(urls.slice(0, 1), 1000, 60000, 2000, ranges)({});
    await assert.rejects(
      narrow.request({ method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "0xc350" }] }),
      /limited to 5000 blocks/,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("quotes follow the pool key: a pool with PLEA as currency0 (Ethereum) quotes as its mirror with imdTEST first", async () => {
  const m = await import("../src/swap-math.ts");
  const Q192 = 2n ** 192n;
  // A pool with IMD as currency0 (Sepolia run 9; price = PLEA per IMD, about 70,000): the market
  // band (PLEA) below the price, the buy wall (IMD) above it.
  const sqrt = m.sqrtAtTick(111500) + 12345n,
    market = { tickLower: 90000, tickUpper: 111600, liquidity: 10n ** 24n },
    wall = { tickLower: 111600, tickUpper: 130000, liquidity: 3n * 10n ** 23n };
  // The same pool with the currencies swapped: ticks negate, the price inverts.
  const mirror = (b) => ({ tickLower: -b.tickUpper, tickUpper: -b.tickLower, liquidity: b.liquidity });
  const sqrtMirror = Q192 / sqrt;
  const fees = { inputBps: 270n, outputBps: 25n };
  for (const selling of [false, true]) {
    const amount = selling ? 20000n * 10n ** 18n : 3n * 10n ** 18n;
    const imdFirst = m.estimateHookOutput({ amount, zeroForOne: m.swapZeroForOne(selling, false), sqrt, bands: [market, wall], ...fees });
    const pleaFirst = m.estimateHookOutput({ amount, zeroForOne: m.swapZeroForOne(selling, true), sqrt: sqrtMirror, bands: [mirror(market), mirror(wall)], ...fees });
    assert.ok(imdFirst.out > 0n);
    const diff = imdFirst.out > pleaFirst.out ? imdFirst.out - pleaFirst.out : pleaFirst.out - imdFirst.out;
    assert.ok(diff * 10n ** 9n <= imdFirst.out, `${selling ? "sell" : "buy"}: ${imdFirst.out} vs ${pleaFirst.out}`);
  }
  assert.equal(m.swapZeroForOne(false, true), false, "a buy with PLEA first is oneForZero");
  assert.equal(m.pleaIsZero({ currency0: "0x267F755D6BC38D145F4B4BF74130C5F638E41720" }, "0x267f755d6bc38d145f4b4bf74130c5f638e41720"), true);
  // The wall's IMD is token0 below the price on Sepolia, token1 on Ethereum: the same amount either way.
  const a = m.bandImd(wall, m.sqrtAtTick(120000), false),
    b = m.bandImd(mirror(wall), Q192 / m.sqrtAtTick(120000), true);
  assert.ok(a > 0n);
  assert.ok((a > b ? a - b : b - a) * 10n ** 9n <= a, `${a} vs ${b}`);
});

test("sweep nits: Seasons' loading h1 has a skeleton number until the season is read; Share keeps the plea's number", async () => {
  const { loadingTitle } = await load("loading-text");
  // Loading band, nothing read yet: "Season …", never "Seasons" (the loaded page says "Season N").
  assert.equal(loadingTitle("seasons", undefined, undefined, undefined, true), "Season …");
  assert.equal(loadingTitle("seasons", undefined, undefined, { "Seasons.SEASON": 18000n }, true), "Season …");
  // The reads are in: the loaded page's own title.
  const c = { "CabalGate.startedAt": 1792587948n, "CabalGate.diedAt": 0n, "Seasons.currentSeason": [true, 1n, 0n], "Seasons.SEASON": 18000n };
  assert.equal(loadingTitle("seasons", undefined, undefined, c, true), "Season 2");
  // Trading not open: "Seasons", as the loaded page's empty state.
  assert.equal(loadingTitle("seasons", undefined, undefined, { ...c, "CabalGate.startedAt": 0n }, true), "Seasons");
  // A failed first read keeps the page's name.
  assert.equal(loadingTitle("seasons"), "Seasons");
  assert.equal(loadingTitle("share", "7"), "Share plea #7");
});
