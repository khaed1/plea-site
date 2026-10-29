// Checks "Pay with" ETH and USDC (src/pay.ts, src/universal-router.ts encodeBuyVia) against PLEA's real
// deployment on a local anvil fork of Ethereum, seeded (by the site's seed button or as the owner):
//   node web/scripts/ethereum-fork-pay.mjs <port> [buyer]
// The buyer (default: a fresh address) gets 2 ETH and 300 USDC (USDC from the PoolManager, impersonated).
// For 0.05 ETH and 150 USDC (and 1.5 ETH past the launch window): the quote is the site's (Uniswap's V4 Quoter up to IMD, then
// src/swap-math.ts's walk of PLEA's pool for that IMD, at the launch fee of the block it is mined in);
// the buy is the site's calldata (USDC: exact approval to Permit2, exact Permit2 allowance for 30
// minutes); the PLEA received must equal the quote. A buy whose minimum is above the quote is refused.
// Only ever point it at a local anvil.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createPublicClient, http, parseAbi, parseEther, formatEther, encodeFunctionData, toHex } from "viem";
import { encodeBuyVia, universalRouterAbi, permit2Abi } from "../src/universal-router.ts";
import { buyPath, quoteToImd } from "../src/pay.ts";
import { estimateHookOutput, bandOf } from "../src/swap-math.ts";

const [PORT, BUYER = "0x3333333333333333333333333333333333333333"] = process.argv.slice(2);
const RPC = `http://127.0.0.1:${PORT}`;
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(RPC)) throw Error("local anvil only");
const site = JSON.parse(readFileSync(new URL("../networks/ethereum/site.json", import.meta.url), "utf8"));
const deployment = JSON.parse(readFileSync(new URL("../networks/ethereum/deployment.json", import.meta.url), "utf8"));
const hookAbi = JSON.parse(readFileSync(new URL("../public/abi/PleaHook.json", import.meta.url), "utf8"));
const PLEA = deployment.contracts.find((c) => c.name === "PLEA").address.toLowerCase();
const HOOK = site.expected.PleaHook, UR = site.trade.router, PERMIT2 = site.trade.permit2, PM = "0x000000000004444c5dc75cb358380d2e3de08a90";
const pub = createPublicClient({ transport: http(RPC) });
const rpc = (method, params = []) => pub.request({ method, params });
const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)", "function approve(address,uint256) returns (bool)"]);
const bal = (t, a) => pub.readContract({ address: t, abi: erc20, functionName: "balanceOf", args: [a] });
async function send(from, to, data, value = 0n) {
  await rpc("anvil_impersonateAccount", [from]);
  const hash = await rpc("eth_sendTransaction", [{ from, to, data, value: toHex(value), gas: toHex(3_000_000) }]);
  return pub.waitForTransactionReceipt({ hash });
}
const h = (functionName, blockNumber) => pub.readContract({ address: HOOK, abi: hookAbi, functionName, blockNumber });
assert.equal(await h("seeded"), true, "seed the fork first");
const key = await h("poolKey");
const [eth, usdc] = site.pay.routes;
await rpc("anvil_setBalance", [BUYER, toHex(parseEther("2"))]);
await rpc("anvil_setBalance", [PM, toHex((await pub.getBalance({ address: PM })) + parseEther("0.1"))]);
assert.equal((await send(PM, usdc.currency, encodeFunctionData({ abi: erc20, functionName: "transfer", args: [BUYER, 300n * 10n ** 6n] }))).status, "success");

/** The site's quote for `amountIn` at the state of `blockNumber`, with the launch fee of time `ts`. */
async function quote(route, amountIn, blockNumber, ts) {
  const imd = await quoteToImd({ simulateContract: (a) => pub.simulateContract({ ...a, blockNumber }) }, site.pay.quoter, route, amountIn, "IMD");
  const [sqrt, market, wall, fee, burn, extraMax, window, launched] = await Promise.all(
    ["currentSqrtPriceX96", "market", "wall", "IMD_FEE_BPS", "PLEA_BURN_BPS", "LAUNCH_EXTRA_BPS", "LAUNCH_WINDOW", "launchedAt"].map((f) => h(f, blockNumber)),
  );
  const extra = ts < launched + window ? (extraMax * (launched + window - ts)) / window : 0n;
  const pleaFirst = key.currency0.toLowerCase() === PLEA;
  return { imd, ...estimateHookOutput({ amount: imd, zeroForOne: !pleaFirst, sqrt, bands: [bandOf(market), bandOf(wall)], inputBps: fee + extra, outputBps: burn, tickSpacing: Number(key.tickSpacing) }) };
}
async function buy(route, amountIn, minPleaOut) {
  if (route.currency !== "0x0000000000000000000000000000000000000000") {
    await send(BUYER, route.currency, encodeFunctionData({ abi: erc20, functionName: "approve", args: [PERMIT2, amountIn] }));
    const now = Number((await pub.getBlock()).timestamp);
    await send(BUYER, PERMIT2, encodeFunctionData({ abi: permit2Abi, functionName: "approve", args: [route.currency, UR, amountIn, now + 1800] }));
  }
  const held = await bal(PLEA, BUYER);
  const enc = encodeBuyVia({ router: { address: UR, minHopPrice: site.trade.minHopPrice }, currencyIn: route.currency, path: buyPath(route, key, PLEA, BUYER), plea: PLEA, buyer: BUYER, amountIn, minPleaOut, pleaBalance: held });
  const deadline = (await pub.getBlock()).timestamp + 1800n;
  const r = await send(BUYER, UR, encodeFunctionData({ abi: universalRouterAbi, functionName: "execute", args: [enc.commands, enc.inputs, deadline] }), enc.value);
  return { r, got: (await bal(PLEA, BUYER)) - held };
}
// Past the launch window (whose cap refuses it), 1.5 ETH too: a buy that crosses a word end of the pool's
// tick bitmap on the seeded fork, where v4 ends a step and rounds.
const open = (await pub.getBlock()).timestamp >= (await h("launchedAt")) + (await h("LAUNCH_WINDOW"));
for (const [route, amountIn] of [[eth, parseEther("0.05")], [usdc, 150n * 10n ** 6n], ...(open ? [[eth, parseEther("1.5")]] : [])]) {
  // A minimum above the quote is refused by the balance check, and nothing is bought.
  const high = await buy(route, amountIn, parseEther("1000000000"));
  assert.equal(high.r.status, "reverted", `${route.symbol}: a minimum above the quote is refused`);
  assert.equal(high.got, 0n);
  console.log(`✓ ${route.symbol}: a buy whose PLEA minimum is above the quote is refused (the balance check), nothing bought`);
  const { r, got } = await buy(route, amountIn, 1n);
  assert.equal(r.status, "success");
  const mined = await pub.getBlock({ blockNumber: r.blockNumber });
  // The quote at the block before the buy, at the launch fee of the buy's own block.
  const q = await quote(route, amountIn, r.blockNumber - 1n, mined.timestamp);
  console.log(`✓ ${formatEther(route.symbol === "ETH" ? amountIn : amountIn * 10n ** 12n)} ${route.symbol} → ${formatEther(q.imd)} IMD → ${formatEther(got)} PLEA (quote ${formatEther(q.out)}, difference ${got - q.out} wei), gas ${r.gasUsed}`);
  // The walk stops where v4's steps do (band edges and the tick bitmap's word ends): to the wei.
  assert.equal(got, q.out, `${route.symbol}: received ${got}, quote ${q.out}`);
}
