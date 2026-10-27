import test from "node:test";
import assert from "node:assert/strict";
import { indexerLogs, indexedBlock, toRawLog } from "../src/indexer.ts";

const A = "0x267f755d6bc38d145f4b4bf74130c5f638e41720",
  B = "0x8b21219cd72938e25e0d37a1aa55599fdb23823a",
  T = "0x" + "ab".repeat(32);
const row = (block, index, address = A) => ({
  blockNumber: String(block), blockHash: "0x" + "11".repeat(32), blockTimestamp: "1793039819",
  transactionHash: "0x" + "22".repeat(32), transactionIndex: 3, logIndex: index, address: address.toUpperCase().replace("0X", "0x"),
  topic0: T, topic1: null, topic2: null, topic3: null, data: "0x01",
});
function fake(pages, status = { 1: { block: { number: 120 }, ready: true } }) {
  const calls = [];
  const fn = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.variables);
    const i = body.variables.after ? Number(body.variables.after) : 0;
    const items = pages[i];
    return { ok: true, json: async () => ({ data: { rawLogs: { items, pageInfo: { hasNextPage: i + 1 < pages.length, endCursor: String(i + 1) } }, _meta: { status } } }) };
  };
  return { fn, calls };
}

test("raw logs come back in eth_getLogs' shape, ordered, only for the asked addresses", async () => {
  const { fn, calls } = fake([[row(105, 2), row(101, 0), row(101, 1, B)], [row(110, 0), row(111, 0, "0x" + "99".repeat(20))]]);
  const { logs, syncedTo } = await indexerLogs("http://idx/graphql", 1, [A, B], 100n, 115n, fn);
  assert.equal(calls.length, 2, "follows the cursor");
  assert.equal(calls[0].from, "100");
  assert.equal(calls[1].after, "1");
  assert.deepEqual(logs.map((l) => `${l.blockNumber}-${l.logIndex}`), ["101-0", "101-1", "105-2", "110-0"]);
  assert.equal(logs[0].address, A, "lowercased");
  assert.deepEqual(logs[0].topics, [T]);
  assert.equal(typeof logs[0].blockNumber, "bigint");
  assert.equal(syncedTo, 115n, "the indexer is past `to`");
});

test("blocks the indexer has not reached are left to the RPC scan", async () => {
  const { fn } = fake([[row(101, 0), row(119, 0)]], { 1: { block: { number: 110 } } });
  const { logs, syncedTo } = await indexerLogs("http://idx/graphql", 1, [A], 100n, 130n, fn);
  assert.equal(syncedTo, 110n);
  assert.deepEqual(logs.map((l) => l.blockNumber), [101n]);
});

test("an indexer that has nothing yet covers nothing", async () => {
  const { fn } = fake([[]], { 1: { block: { number: 50 } } });
  assert.equal((await indexerLogs("http://idx/graphql", 1, [A], 100n, 130n, fn)).syncedTo, 99n);
});

test("errors throw, so the caller scans from the RPCs", async () => {
  await assert.rejects(indexerLogs("u", 1, [A], 1n, 2n, async () => ({ ok: false, status: 502 })), /502/);
  await assert.rejects(indexerLogs("u", 1, [A], 1n, 2n, async () => ({ ok: true, json: async () => ({ errors: [{ message: "no rawLogs" }] }) })), /refused/);
  await assert.rejects(indexerLogs("u", 1, [A], 1n, 2n, async () => ({ ok: true, json: async () => ({ data: { rawLogs: { items: [], pageInfo: {} }, _meta: { status: {} } } }) })), /how far/);
});

test("Ponder's _meta.status forms", () => {
  assert.equal(indexedBlock({ 1: { block: { number: 7, timestamp: 9 }, ready: true } }, 1), 7n);
  assert.equal(indexedBlock({ mainnet: { id: 1, block: { number: "8" } } }, 1), 8n);
  assert.equal(indexedBlock({ mainnet: { block: { number: 9 } } }, 1), 9n, "a single chain");
  assert.equal(indexedBlock({ a: { block: { number: 1 } }, b: { block: { number: 2 } } }, 1), undefined);
  assert.throws(() => toRawLog({ ...row(1, 0), topic0: null }), /topic0/);
});
