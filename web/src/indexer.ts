/** History from the IMD Indexer job's Ponder GraphQL (Ethereum), as raw logs in eth_getLogs' shape, so
 * the site decodes them with its own ABIs exactly like a chunked log scan. The indexer the site expects
 * keeps every event of PLEA's contracts raw in one table, `rawLog`:
 *   id (text, "<blockNumber>-<logIndex>"), blockNumber (bigint), blockHash (hex), blockTimestamp (bigint),
 *   transactionHash (hex), transactionIndex (int), logIndex (int), address (hex, lowercase),
 *   topic0..topic3 (hex or null), data (hex)
 * served by Ponder's GraphQL as `rawLogs(where, orderBy, orderDirection, limit, after)` with `items` and
 * `pageInfo { hasNextPage endCursor }`, and `_meta { status }` naming the last indexed block.
 * Anything the indexer has not reached (or an indexer that fails) is left to the RPC scan: `syncedTo`
 * says how far these logs go. */
import type { Address, Hex } from "viem";

export type RawLog = {
  address: Address;
  blockHash: Hex;
  blockNumber: bigint;
  data: Hex;
  logIndex: number;
  removed: false;
  topics: Hex[];
  transactionHash: Hex;
  transactionIndex: number;
  blockTimestamp?: bigint;
};

const PAGE = 1000;
const QUERY = `query Logs($from: BigInt!, $to: BigInt!, $after: String) {
  rawLogs(where: { blockNumber_gte: $from, blockNumber_lte: $to }, orderBy: "id", orderDirection: "asc", limit: ${PAGE}, after: $after) {
    items { blockNumber blockHash blockTimestamp transactionHash transactionIndex logIndex address topic0 topic1 topic2 topic3 data }
    pageInfo { hasNextPage endCursor }
  }
  _meta { status }
}`;

/** The last block the indexer has, from Ponder's `_meta.status` ({<chain>: {block: {number}, ready}}). */
export function indexedBlock(status: any, chainId: number): bigint | undefined {
  if (!status || typeof status !== "object") return undefined;
  const entry =
    status[String(chainId)] ??
    Object.values(status).find((v: any) => Number(v?.id ?? v?.chainId) === chainId) ??
    (Object.keys(status).length === 1 ? Object.values(status)[0] : undefined);
  const n = (entry as any)?.block?.number;
  return n === undefined || n === null ? undefined : BigInt(n);
}

export function toRawLog(x: any): RawLog {
  const topics = [x.topic0, x.topic1, x.topic2, x.topic3].filter((t) => typeof t === "string" && t.length === 66);
  if (!topics.length) throw Error("A raw log without topic0.");
  return {
    address: String(x.address).toLowerCase() as Address,
    blockHash: x.blockHash,
    blockNumber: BigInt(x.blockNumber),
    data: (x.data || "0x") as Hex,
    logIndex: Number(x.logIndex),
    removed: false,
    topics: topics as Hex[],
    transactionHash: x.transactionHash,
    transactionIndex: Number(x.transactionIndex ?? 0),
    ...(x.blockTimestamp !== undefined && x.blockTimestamp !== null ? { blockTimestamp: BigInt(x.blockTimestamp) } : {}),
  };
}

/** Raw logs of `addresses` in [from, to] from the indexer, as far as it has indexed (`syncedTo`, at
 * most `to`; `from - 1` when it has nothing). Throws when the indexer cannot be read: the caller then
 * scans the whole range from the RPCs. */
export async function indexerLogs(
  url: string,
  chainId: number,
  addresses: string[],
  from: bigint,
  to: bigint,
  fetchFn: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<{ logs: RawLog[]; syncedTo: bigint }> {
  const want = new Set(addresses.map((a) => a.toLowerCase()));
  const logs: RawLog[] = [];
  let after: string | null = null,
    synced: bigint | undefined,
    pages = 0;
  for (;;) {
    const response = await fetchFn(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { from: String(from), to: String(to), after } }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw Error(`The indexer answered ${response.status}.`);
    const body: any = await response.json();
    if (body.errors?.length) throw Error(`The indexer refused the query: ${String(body.errors[0]?.message).slice(0, 200)}`);
    const page = body.data?.rawLogs;
    if (!page || !Array.isArray(page.items)) throw Error("The indexer's answer has no rawLogs.");
    synced ??= indexedBlock(body.data?._meta?.status, chainId);
    for (const x of page.items) {
      const log = toRawLog(x);
      if (want.has(log.address)) logs.push(log);
    }
    if (!page.pageInfo?.hasNextPage) break;
    after = page.pageInfo.endCursor;
    if (!after || ++pages > 10_000) throw Error("The indexer's paging did not end.");
  }
  if (synced === undefined) throw Error("The indexer did not say how far it has indexed.");
  const syncedTo = synced < to ? synced : to;
  logs.sort((a, b) => (a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1));
  // Only blocks the indexer has fully indexed count; later ones are left to the RPC scan.
  return { logs: logs.filter((l) => l.blockNumber <= syncedTo), syncedTo: syncedTo < from ? from - 1n : syncedTo };
}

/** After the indexer fails (refused, an error status, a timeout), the history leaves it alone for a
 * while and reads logs only: 1 minute after the first failure, doubling to 15 minutes, until it answers
 * again. A down indexer then costs one failed request (and the browser's one console line) per back-off
 * instead of one per poll, and a hanging one a single timeout. The back-off is kept per indexer URL in
 * this browser (localStorage, when it can be used), so reloading the page does not ask a down indexer
 * again before the back-off ends. */
export type IndexerBackoff = { until: number; wait: number };
const BACKOFF_KEY = "plea-indexer-backoff",
  FIRST_WAIT = 60_000,
  LONGEST_WAIT = 15 * 60_000;
const backoffs = new Map<string, IndexerBackoff>();
function storedBackoff(url: string): IndexerBackoff | undefined {
  if (backoffs.has(url)) return backoffs.get(url);
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(BACKOFF_KEY) || "null");
    if (saved?.url === url && Number.isFinite(saved.until) && Number.isFinite(saved.wait))
      return { until: saved.until, wait: saved.wait };
  } catch {}
  return undefined;
}
/** The back-off after one more failure. */
export function nextBackoff(previous: IndexerBackoff | undefined, now: number): IndexerBackoff {
  const wait = previous ? Math.min(LONGEST_WAIT, Math.max(FIRST_WAIT, previous.wait * 2)) : FIRST_WAIT;
  return { until: now + wait, wait };
}
/** Whether the history may ask the indexer at `now`. */
export function indexerDue(url: string, now = Date.now()) {
  const b = storedBackoff(url);
  return !b || now >= b.until;
}
/** Records whether the indexer answered: a success clears the back-off, a failure extends it. */
export function noteIndexer(url: string, ok: boolean, now = Date.now()) {
  const b = ok ? undefined : nextBackoff(storedBackoff(url), now);
  if (b) backoffs.set(url, b);
  else backoffs.delete(url);
  try {
    if (b) globalThis.localStorage?.setItem(BACKOFF_KEY, JSON.stringify({ url, ...b }));
    else if (JSON.parse(globalThis.localStorage?.getItem(BACKOFF_KEY) || "null")?.url === url)
      globalThis.localStorage?.removeItem(BACKOFF_KEY);
  } catch {}
}
