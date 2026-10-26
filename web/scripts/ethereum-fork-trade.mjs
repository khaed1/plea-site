// Checks src/universal-router.ts against PLEA's mainnet build on a local anvil fork of Ethereum.
//   node web/scripts/ethereum-fork-trade.mjs <port> <addresses.json> [router] [minHop 0|1]
// <addresses.json> comes from khaed1/claude plea/site-design/tools/mainnet/deploy.mjs (owner impersonated,
// not yet seeded). Seeds as the owner, then: a buy whose minimum is too high is refused (BALANCE_CHECK);
// the owner's 2 IMD opening buy; a player's buy while the Cabal lives; after the 33-hour dead-man, the
// player sells everything (and a sell whose minimum is too high is refused). Only ever point it at a local anvil.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createPublicClient, createWalletClient, http, parseEther, parseAbi, toHex, formatEther } from "viem";
import { mainnet } from "viem/chains";
import { encodeBuy, encodeSell, universalRouterAbi, permit2Abi, PERMIT2 } from "../src/universal-router.ts";

const [PORT, ADDR, ROUTER = "0x23617e59a5925b2a4bf75d73ff6711cd0b29de85", HOP = "1"] = process.argv.slice(2);
const RPC = `http://127.0.0.1:${PORT}`;
if (!/^http:\/\/127\.0\.0\.1:/.test(RPC)) throw Error("local anvil only");
const S = JSON.parse(readFileSync(ADDR, "utf8"));
const IMD = "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7";
const WHALE = "0xe54d6571aca515614927f3a70b8957c2b511603c";
const PLAYER = "0x2222222222222222222222222222222222222222";
const router = { address: ROUTER, minHopPrice: HOP === "1" };
const pub = createPublicClient({ transport: http(RPC), chain: mainnet });
const rpc = (m, p = []) => pub.request({ method: m, params: p });
const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)", "function approve(address,uint256) returns (bool)"]);
const hookAbi = parseAbi(["function poolKey() view returns ((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks))"]);
const gateAbi = parseAbi(["function cabalAlive() view returns (bool)"]);
const as = async (a) => {
  await rpc("anvil_impersonateAccount", [a]);
  await rpc("anvil_setBalance", [a, toHex(parseEther("10"))]);
  return createWalletClient({ account: a, transport: http(RPC), chain: mainnet });
};
const write = async (w, address, abi, functionName, args) => {
  const gas = await pub.estimateContractGas({ address, abi, functionName, args, account: w.account });
  const hash = await w.writeContract({ address, abi, functionName, args, gas: (gas * 13n + 9n) / 10n });
  const r = await pub.waitForTransactionReceipt({ hash });
  assert.equal(r.status, "success", functionName);
  return r;
};
const bal = (t, a) => pub.readContract({ address: t, abi: erc20, functionName: "balanceOf", args: [a] });
const deadline = async () => (await pub.getBlock()).timestamp + 600n;
// The site's flow: exact ERC-20 approval to Permit2, then a Permit2 allowance for the router with a short expiry.
async function approve(w, token, amount) {
  await write(w, token, erc20, "approve", [PERMIT2, amount]);
  const now = Number((await pub.getBlock()).timestamp);
  await write(w, PERMIT2, permit2Abi, "approve", [token, router.address, amount, now + 1800]);
}
async function buy(w, amountIn, minPleaOut) {
  const key = await pub.readContract({ address: S.PleaHook, abi: hookAbi, functionName: "poolKey" });
  const before = await bal(S.PLEA, w.account.address);
  const { commands, inputs } = encodeBuy({ router, key, imd: IMD, buyer: w.account.address, amountIn, minPleaOut, pleaBalance: before });
  await approve(w, IMD, amountIn);
  const r = await write(w, router.address, universalRouterAbi, "execute", [commands, inputs, await deadline()]);
  return { got: (await bal(S.PLEA, w.account.address)) - before, gas: r.gasUsed };
}
const owner = await as(S.owner), whale = await as(WHALE), player = await as(PLAYER);
await write(whale, IMD, erc20, "transfer", [S.owner, parseEther("10")]);
await write(whale, IMD, erc20, "transfer", [PLAYER, parseEther("20")]);
await write(owner, S.PleaLaunch, parseAbi(["function seed()"]), "seed", []);
let refused = false;
try { await buy(owner, parseEther("2"), parseEther("10000000")); } catch (e) { refused = /reverted|ExecutionFailed|BalanceTooLow/i.test(String(e.shortMessage || e.message)); }
assert.ok(refused, "a buy below its minimum is refused");
console.log("✓ a buy whose PLEA minimum is too high is refused before anything is bought");
const opening = await buy(owner, parseEther("2"), parseEther("50000"));
console.log(`✓ the owner's 2 IMD opening buy: ${formatEther(opening.got)} PLEA, gas ${opening.gas}`);
const p = await buy(player, parseEther("10"), 1n);
console.log(`✓ a player's 10 IMD buy while the Cabal lives: ${formatEther(p.got)} PLEA, gas ${p.gas}`);
await rpc("evm_increaseTime", [33 * 3600 + 60]);
await rpc("evm_mine");
assert.equal(await pub.readContract({ address: S.CabalGate, abi: gateAbi, functionName: "cabalAlive" }), false);
const key = await pub.readContract({ address: S.PleaHook, abi: hookAbi, functionName: "poolKey" });
const all = await bal(S.PLEA, PLAYER), imd0 = await bal(IMD, PLAYER);
await approve(player, S.PLEA, all);
// The player bought inside the 90-minute launch window (launch fee), so 10 IMD of PLEA sells back for less.
const tooHigh = encodeSell({ router, key, imd: IMD, seller: PLAYER, amountIn: all, minImdOut: parseEther("9") });
let low = "";
try { await write(player, router.address, universalRouterAbi, "execute", [tooHigh.commands, tooHigh.inputs, await deadline()]); }
catch (e) { low = String(e.message); }
assert.match(low, /V4TooLittleReceived/, "a sell below its minimum is refused");
console.log("✓ after the death a sell whose IMD minimum is too high is refused (V4TooLittleReceived)");
const { commands, inputs } = encodeSell({ router, key, imd: IMD, seller: PLAYER, amountIn: all, minImdOut: parseEther("5") });
const r = await write(player, router.address, universalRouterAbi, "execute", [commands, inputs, await deadline()]);
console.log(`✓ after the death the player sells ${formatEther(all)} PLEA for ${formatEther((await bal(IMD, PLAYER)) - imd0)} IMD, gas ${r.gasUsed}`);
