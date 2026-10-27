import { rpcDetail, rangePattern, headPattern } from "./rpc-health";
import { potFor, factParts, sharePoints, ceil, min } from "./models";
import {
  decodeEventLog,
  keccak256,
  encodePacked,
  isAddress,
  zeroAddress,
  type Address,
  type Abi,
} from "viem";
import { APP, erc20Abi, intakeAbi, type Runtime } from "./config";
export type Plea = {
  id: bigint;
  seller: Address;
  factScore: number;
  need: number;
  score: number;
  status: number;
  appealed: boolean;
  isAppeal: boolean;
  flags: number;
  amount: bigint;
  submittedAt: bigint;
  verdictAt: bigint;
  originalId: bigint;
  intakeId: `0x${string}`;
  text: string;
  standing?: readonly [boolean, boolean, number];
  recorded?: boolean;
  excluded?: boolean;
  points?: number;
  name?: string;
  seat?: boolean;
  escrow?: readonly [Address, boolean, bigint, bigint];
  objections?: any[];
  completed?: boolean;
  failure?: any;
  failureAt?: number;
  balance?: bigint;
  facts?: any;
  submittedLog?: any;
  verdictLog?: any;
};
export type Snapshot = {
  v: Record<string, any>;
  constants: Record<string, any>;
  logs: any[];
  pleas: Plea[];
  court: CourtHistory;
  block: bigint;
  head?: bigint;
  timestamp: number;
  historyError?: string;
};
export type CourtHistory = {
  pending: Plea[];
  open: Plea[];
  latestVerdict?: Plea;
  verdictTimes: Record<string, number>;
};
export const read = (r: Runtime, name: string, fn: string, args: any[] = []) =>
  r.client.readContract({
    address: r.addresses[name],
    abi: r.abis[name] || erc20Abi,
    functionName: fn,
    args,
  }) as Promise<any>;
export async function readStatic(r: Runtime) {
  const c: Record<string, any> = {};
  await Promise.all(
    Object.entries(r.abis).flatMap(([name, abi]) =>
      abi
        .filter(
          (f: any) =>
            f.type === "function" &&
            f.inputs.length === 0 &&
            /^[A-Z][A-Z_0-9]*$/.test(f.name) &&
            f.stateMutability !== "nonpayable",
        )
        .map(async (f: any) => {
          c[`${name}.${f.name}`] = await read(r, name, f.name);
        }),
    ),
  );
  const [symbol, decimals, pairSymbol, pairDecimals] = await Promise.all([
    read(r, "PLEA", "symbol"),
    read(r, "PLEA", "decimals"),
    read(r, "PairToken", "symbol"),
    read(r, "PairToken", "decimals"),
  ]);
  return { ...c, symbol, decimals, pairSymbol, pairDecimals };
}
// Keep successful prefixes so a temporary outage never restarts a whole history scan.
let logChunk = 10000n;
// A node may run a few blocks behind the head the site just read (sentio's log node is
// often one block behind its own eth_getBlockByNumber). Blocks it has not reached are
// not yet due: the scan stops at the last block it has, with no error, and the next read
// resumes there (X1, r2X-1). A node further behind than this is a real gap in history.
export const HEAD_LAG = 16n;
/** The last block a node says it has, e.g. "block 11962410 is beyond the latest block 11962409 of this node, retry later". */
export function nodeHead(text: string) {
  const named = text.match(/(?:latest|head) block (?:number )?(?:is )?#?(\d+)/i);
  return named ? BigInt(named[1]) : undefined;
}
export async function scanLogs(r: Runtime, from: bigint, to: bigint) {
  const logs: any[] = [];
  let covered = from - 1n,
    lagged = false,
    error: unknown;
  async function chunk(a: bigint, b: bigint, step = 0): Promise<void> {
    try {
      const batch = await r.client.getLogs({
        address: Object.entries(r.addresses)
          .filter(([n]) => n !== "PairToken")
          .map(([, a]) => a),
        fromBlock: a,
        toBlock: b,
      });
      logs.push(...batch);
      covered = b;
    } catch (e) {
      const { text } = rpcDetail(e);
      if (headPattern.test(text)) {
        // Read up to the block the node names; when it names none, one block less, then 2, 4, 8…
        const has = min(nodeHead(text) ?? b - (1n << BigInt(step)), b - 1n);
        if (step >= 5 || to - has > HEAD_LAG) throw e;
        // The blocks up to `has` are read first, splitting on the node's range limit as any read
        // does; only then is the lag flagged, which stops the loops after this chunk. Flagged
        // before, it stopped the split loop of that very read and skipped the range unread (P1).
        if (has >= a) await chunk(a, has, step + 1);
        lagged = true;
        return;
      }
      const limit = text.match(/limited to ([\d,]+) blocks/i);
      if (limit) logChunk = BigInt(limit[1].replaceAll(",", "")) || 1n;
      if (a === b || !rangePattern.test(text)) throw e;
      const size = limit ? logChunk : (b - a + 1n) / 2n || 1n;
      for (let k = a; k <= b && !lagged; k += size)
        await chunk(k, k + size - 1n > b ? b : k + size - 1n);
    }
  }
  try {
    for (let a = from; a <= to && !lagged; ) {
      const end = a + logChunk - 1n > to ? to : a + logChunk - 1n;
      await chunk(a, end);
      a = end + 1n;
    }
  } catch (e) {
    error = e;
  }
  const decoded = logs.map((log) => {
    const name = Object.keys(r.addresses).find(
      (n) => r.addresses[n].toLowerCase() === log.address.toLowerCase(),
    );
    try {
      return {
        ...log,
        ...decodeEventLog({
          abi: r.abis[name!],
          data: log.data,
          topics: log.topics,
        }),
        contract: name,
      };
    } catch {
      return { ...log, contract: name, eventName: "Unknown", args: {} };
    }
  });
  return { logs: decoded, covered, lagged, error };
}
/** `known`: objections already read from the Tribunal (the snapshot's newest ones). They join the
 * plea's Objected logs, so a plea read while history is incomplete still shows them (r2S-N1). */
export async function getPlea(
  r: Runtime,
  id: bigint,
  logs: any[] = [],
  known: any[] = [],
): Promise<Plea> {
  const p = { ...(await readPlea(r, id)), id } as Plea;
  if (p.seller === zeroAddress)
    throw Error("This plea does not exist. Check the plea number.");
  const [standing, recorded, name, seat, escrow, excluded, balance] =
    await Promise.all([
      read(r, "Tribunal", "standing", [id]),
      read(r, "Seasons", "recorded", [id]),
      read(r, "Letterbox", "nameOf", [p.seller]),
      read(r, "Seasons", "holdsSeat", [p.seller]),
      read(r, "Letterbox", "escrowOf", [id]),
      read(r, "Seasons", "excluded", [p.seller]),
      read(r, "CabalGate", "pleaBalance", [id]),
    ]);
  const objectionIds = [
    ...new Set<bigint>([
      ...logs
        .filter((l) => l.eventName === "Objected" && l.args.pleaId === id)
        .map((l) => l.args.id as bigint),
      ...known.filter((o) => o.pleaId === id).map((o) => o.id as bigint),
    ]),
  ].sort((a, b) => Number(a - b));
  const objections = await Promise.all(
    objectionIds.map(async (id: bigint) => ({
      ...(known.find((o) => o.id === id) ||
        (await read(r, "Tribunal", "objection", [id]))),
      id,
      reason: logs
        .find((l) => l.eventName === "ObjectionVoid" && l.args.id === id)
        ?.args.reason?.startsWith("0x7374616c65")
        ? "stale"
        : "split",
    })),
  );
  return {
    ...p,
    balance,
    facts: await historicalFacts(r, p, balance, logs),
    submittedLog: logs.find(
      (l) => l.eventName === "PleaSubmitted" && l.args.id === id,
    ),
    verdictLog: logs.find((l) => l.eventName === "Verdict" && l.args.id === id),
    standing,
    recorded,
    points: ![2, 4, 5].includes(p.status)
      ? 0
      : recorded
        ? await read(r, "Seasons", "pointsOf", [id])
        : excluded || standing[1]
          ? 0
          : await read(r, "Seasons", "pointsFor", [
              p.seller,
              Math.min(p.score, Number(standing[2])),
            ]),
    excluded,
    name,
    seat,
    escrow,
    objections,
    failureAt: await (async () => {
      const log = logs.find(
        (l) => l.eventName === "PleaFailed" && l.args.id === id,
      );
      return log ? blockTime(r, log.blockNumber) : undefined;
    })(),
    failure: logs.find((l) => l.eventName === "PleaFailed" && l.args.id === id)
      ?.args,
  };
}
export async function readSnapshot(
  r: Runtime,
  constants: Record<string, any>,
  previous?: Snapshot,
): Promise<Snapshot> {
  const block = await r.client.getBlock();
  const v: Record<string, any> = {};
  const calls: Record<string, string[]> = {
    PleaHook: [
      "seeded",
      "launchedAt",
      "poolKey",
      "priceX96",
      "latestPrice",
      "price24hAgo",
      "inventoryCap",
      "totalBurned",
      "totalCashback",
      "retainedImd",
      "retainClaims",
      "pleaClaims",
      "pendingRebalance",
      "wall",
      "market",
      "pleaInMarket",
      "imdInMarket",
      "pleaInWall",
      "launchExtraBps",
      "wallGuardTick",
      "currentSqrtPriceX96",
      "stacker",
    ],
    CabalGate: [
      "startedAt",
      "lastVerdictAt",
      "cabalAlive",
      "diedAt",
      "nextId",
      "intake",
    ],
    Seasons: [
      "currentSeason",
      "pot",
      "nextToClose",
      "rollover",
      "bonusBurned",
      "finished",
      "seat",
    ],
    PleaDistributor: ["merkleRoot"],
    PLEA: ["totalSupply", "owner"],
    Tribunal: ["nextId"],
  };
  await Promise.all(
    Object.entries(calls).flatMap(([name, fns]) =>
      fns.map(async (fn) => {
        try {
          v[`${name}.${fn}`] = await read(r, name, fn);
        } catch (e) {
          if (!["wallGuardTick", "priceX96", "pendingRebalance"].includes(fn))
            throw e;
        }
      }),
    ),
  );
  if (v["PleaHook.seeded"]) {
    v.fees = await read(r, "Letterbox", "feesFor", [false]);
    v.appealFees = await read(r, "Letterbox", "feesFor", [true]);
  }
  const started = BigInt(v["CabalGate.startedAt"]),
    died = BigInt(v["CabalGate.diedAt"]);
  const season =
    died && started
      ? (died - 1n - started) / BigInt(constants["Seasons.SEASON"])
      : BigInt(v["Seasons.currentSeason"][1]);
  v.displayedSeason = season;
  v.seasons = {};
  await Promise.all(
    [...new Set([String(season), String(v["Seasons.nextToClose"])])].map(
      async (k) => {
        const [bounds, fees, top, closed] = await Promise.all([
          read(r, "Seasons", "seasonBounds", [BigInt(k)]),
          read(r, "Seasons", "seasonFees", [BigInt(k)]),
          read(r, "Seasons", "topOf", [BigInt(k)]),
          read(r, "Seasons", "closed", [BigInt(k)]),
        ]);
        v.seasons[k] = {
          bounds,
          fees,
          top,
          closed,
          pot: potFor(
            fees,
            BigInt(k),
            BigInt(v["Seasons.nextToClose"]),
            v["Seasons.rollover"],
          ),
        };
      },
    ),
  );
  v.top = v.seasons[String(season)].top;
  v.bounds = v.seasons[String(v["Seasons.nextToClose"])].bounds;
  v.closed = v.seasons[String(v["Seasons.nextToClose"])].closed;
  v.shares = await Promise.all(
    Array.from({ length: Number(constants["Seasons.TOP"]) }, (_, i) =>
      read(r, "Seasons", "shareBps", [BigInt(i)]),
    ),
  );
  const scan = await scanLogs(
    r,
    previous ? previous.block + 1n : APP.eventStart,
    block.number,
  );
  const logs = [...(previous?.logs || []), ...scan.logs];
  const historyError = scan.error
    ? "History could not be read completely. Try again; court and cashback totals are hidden until the scan completes."
    : undefined;
  const next = v["CabalGate.nextId"];
  const ids = Array.from(
    { length: Math.min(Number(next - 1n), 24) },
    (_, i) => next - 1n - BigInt(i),
  );
  const pleas = await Promise.all(ids.map((id) => getPlea(r, id, logs)));
  const court = await readCourtHistory(
    r,
    logs,
    pleas,
    constants,
    Number(block.timestamp),
    previous,
  );
  const objectionCount = Number(v["Tribunal.nextId"] - 1n);
  const objections = await Promise.all(
    Array.from({ length: Math.min(objectionCount, 64) }, async (_, i) => {
      const id = BigInt(objectionCount - i);
      return { ...(await read(r, "Tribunal", "objection", [id])), id };
    }),
  );
  for (const o of objections as any[])
    o.reason = logs
      .find((l) => l.eventName === "ObjectionVoid" && l.args.id === o.id)
      ?.args.reason?.startsWith("0x7374616c65")
      ? "stale"
      : "split";
  v.objections = objections;
  for (const p of pleas)
    p.objections = objections.filter((o) => o.pleaId === p.id).reverse();
  for (const p of pleas)
    p.failure = logs.find(
      (l) => l.eventName === "PleaFailed" && l.args.id === p.id,
    )?.args;
  return {
    v,
    constants,
    logs,
    pleas,
    court,
    block: scan.covered,
    // A lagging node's last blocks are not yet due: the poll looks there again.
    head: scan.lagged && !scan.error ? scan.covered : block.number,
    timestamp: Number(block.timestamp),
    historyError,
  };
}
// Card pagination is independent of the active court and whole-history totals.
export async function readCourtHistory(
  r: Runtime,
  logs: any[],
  recent: Plea[],
  constants: Record<string, any>,
  now: number,
  previous?: Pick<Snapshot, "court">,
): Promise<CourtHistory> {
  const verdicts = logs.filter((l) => l.eventName === "Verdict"),
    terminal = new Set(
      logs
        .filter((l) =>
          ["Verdict", "PleaFailed", "PleaExpired"].includes(l.eventName),
        )
        .map((l) => l.args.id as bigint),
    ),
    page = new Map(recent.map((p) => [p.id, p])),
    full = new Map(recent.map((p) => [p.id, Promise.resolve(p)]));
  const load = (id: bigint) => {
    if (!full.has(id)) full.set(id, getPlea(r, id, logs));
    return full.get(id)!;
  };
  const cached = new Map(previous?.court.pending.map((p) => [p.id, p])),
    expiry = Number(constants["CabalGate.PENDING_EXPIRY"]),
    pendingIds = [
      ...new Set<bigint>(
        logs
          .filter(
            (l) => l.eventName === "PleaSubmitted" && !terminal.has(l.args.id),
          )
          .map((l) => l.args.id),
      ),
    ];
  const pending = await Promise.all(
    pendingIds.map(async (id) => {
      if (page.has(id)) return page.get(id)!;
      const old = cached.get(id);
      // Completion cannot be undone; submission time is immutable after expiry.
      if (old && (old.completed || now > Number(old.submittedAt) + expiry))
        return old;
      return { ...(await readPlea(r, id)), id } as Plea;
    }),
  );
  const last = verdicts.at(-1),
    latestVerdict = last ? await load(last.args.id) : undefined,
    verdictTimes = { ...previous?.court.verdictTimes },
    window = Number(constants["Tribunal.OBJECTION_WINDOW"]),
    openIds: bigint[] = [];
  // Logs are in chain order. Stop at the first verdict outside the window,
  // caching block times so settled history is never re-scanned through RPC.
  for (const log of verdicts.slice().reverse()) {
    const key = String(log.blockNumber);
    if (verdictTimes[key] === undefined) {
      const known =
        page.get(log.args.id) ||
        (latestVerdict?.id === log.args.id ? latestVerdict : undefined);
      verdictTimes[key] = known
        ? Number(known.verdictAt)
        : Number(
            (await r.client.getBlock({ blockNumber: log.blockNumber }))
              .timestamp,
          );
    }
    if (now > verdictTimes[key] + window) break;
    if (log.args.approved) openIds.push(log.args.id);
  }
  const open = (await Promise.all([...new Set(openIds)].map(load))).filter(
    (p) => [2, 4, 5].includes(p.status),
  );
  return { pending, open, latestVerdict, verdictTimes };
}
export function courtCounts(s: Snapshot | undefined, now: number) {
  if (!s || s.historyError) return undefined;
  const verdicts = new Map<bigint, boolean>(
    s.logs
      .filter((l) => l.eventName === "Verdict")
      .map((l) => [l.args.id, l.args.approved]),
  );
  const total = Number(s.v["CabalGate.nextId"] - 1n),
    approved = [...verdicts.values()].filter(Boolean).length,
    denied = verdicts.size - approved,
    pending = s.court.pending.filter(
      (p) =>
        p.status === 1 &&
        !p.completed &&
        now <=
          Number(p.submittedAt) +
            Number(s.constants["CabalGate.PENDING_EXPIRY"]),
    ).length;
  return {
    total,
    approved,
    denied,
    pending,
    noVerdict: total - approved - denied - pending,
  };
}
export function verdictSeason(
  verdictAt: bigint,
  startedAt: bigint,
  length: bigint,
) {
  return verdictAt > 0n &&
    startedAt > 0n &&
    verdictAt >= startedAt &&
    length > 0n
    ? (verdictAt - startedAt) / length
    : undefined;
}
export const val = (s: Snapshot | undefined, name: string) => s?.v[name];
export const con = (s: Snapshot | undefined, name: string) =>
  s?.constants[name];
export const short = (s: string) =>
  s.length > 16 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
export function amount(
  v: bigint | undefined,
  decimals = 18,
  digits = 0,
  mode: "down" | "up" = "down",
) {
  if (v === undefined) return "—";
  decimals = Number(decimals);
  digits = Math.min(digits, decimals);
  const negative = v < 0n;
  const abs = negative ? -v : v;
  const divisor = 10n ** BigInt(decimals - digits);
  const truncated = abs / divisor + (mode === "up" && abs % divisor ? 1n : 0n);
  const scale = 10n ** BigInt(digits);
  return (
    (negative ? "−" : "") +
    (truncated / scale).toLocaleString("en-US") +
    (digits ? "." + (truncated % scale).toString().padStart(digits, "0") : "")
  );
}
export function smallAmount(v: bigint | undefined, s: Snapshot | undefined) {
  return v && v < 10n ** 16n
    ? `< 0.01 ${s?.constants.pairSymbol}`
    : tokenAmount(v, s, true);
}
export const tokenAmount = (
  v: bigint | undefined,
  s: Snapshot | undefined,
  pair = false,
  digits = pair ? 2 : 0,
  mode: "down" | "up" = "down",
) =>
  `${amount(v, s?.constants[pair ? "pairDecimals" : "decimals"] ?? 18, digits, mode)} ${s?.constants[pair ? "pairSymbol" : "symbol"] ?? (pair ? "fee token" : "PLEA")}`;
export function duration(seconds: number) {
  seconds = Math.max(0, Math.floor(seconds));
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
export const utc = (s: number | bigint) =>
  new Date(Number(s) * 1000).toISOString().slice(0, 16).replace("T", " ") +
  " UTC";
export function pleaState(p: Plea, now: number, s: Snapshot) {
  if (p.status === 1)
    return p.completed ||
      now > Number(p.submittedAt) + Number(con(s, "CabalGate.PENDING_EXPIRY"))
      ? "NO VERDICT"
      : "PENDING";
  if (
    p.status === 2 &&
    now > Number(p.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW"))
  )
    return "LAPSED";
  if ([2, 4].includes(p.status) && p.isAppeal) return "OVERTURNED";
  if (p.status === 3 && p.isAppeal) return "UPHELD";
  return (
    (
      {
        2: "APPROVED",
        3: "DENIED",
        4: "SOLD",
        5: "LAPSED",
        6: "NO VERDICT",
      } as Record<number, string>
    )[p.status] || "NO VERDICT"
  );
}
export function cashback(logs: any[], wallet: string) {
  return logs
    .filter(
      (l) =>
        ["CashbackStacked", "CashbackPaidPlain", "CashbackPaidClaims"].includes(
          l.eventName,
        ) && l.args.trader?.toLowerCase() === wallet.toLowerCase(),
    )
    .reduce((n, l) => n + BigInt(l.args.amount), 0n);
}
export function normalizeClaims(data: any): any[] {
  if (!data || typeof data !== "object") return [];
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data.claims)
      ? data.claims
      : Object.entries(data.claims || data).map(([account, c]: any) => ({
          ...c,
          account,
        }));
  return list.flatMap((c: any) => {
    try {
      if (
        typeof c.index !== "string" ||
        typeof c.amount !== "string" ||
        !/^(?:0x[\da-fA-F]+|\d+)$/.test(c.index) ||
        !/^(?:0x[\da-fA-F]+|\d+)$/.test(c.amount)
      )
        return [];
      const index = BigInt(c.index),
        value = BigInt(c.amount),
        account = c.account || c.address;
      if (
        index < 0n ||
        value <= 0n ||
        !isAddress(account) ||
        !Array.isArray(c.proof) ||
        !c.proof.every((x: any) => /^0x[0-9a-fA-F]{64}$/.test(x))
      )
        return [];
      return [
        { ...c, account, index: index.toString(), amount: value.toString() },
      ];
    } catch {
      return [];
    }
  });
}
export function verifyClaim(c: any, root: string) {
  let hash = keccak256(
    encodePacked(
      ["uint256", "address", "uint256"],
      [BigInt(c.index), c.account, BigInt(c.amount)],
    ),
  );
  for (const proof of c.proof)
    hash = keccak256(
      (hash.toLowerCase() < proof.toLowerCase()
        ? hash + proof.slice(2)
        : proof + hash.slice(2)) as `0x${string}`,
    );
  return hash.toLowerCase() === root.toLowerCase();
}
export const countdown = duration;
export const deadman = (s: number) =>
  `${Math.floor(Math.max(s, 0) / 3600)}h ${Math.floor((Math.max(s, 0) % 3600) / 60)}m`;
/** The dead-man countdown in words, hours and minutes like its visible "32h 59m":
 * "32 hours 59 minutes" (index.html's aria-label, X8), never days or seconds. */
export function deadmanWords(s: number) {
  s = Math.max(0, Math.floor(s));
  const hours = Math.floor(s / 3600),
    minutes = Math.floor((s % 3600) / 60),
    unit = (n: number, u: string) => `${n} ${u}${n === 1 ? "" : "s"}`;
  return [
    hours ? unit(hours, "hour") : "",
    minutes || !hours ? unit(minutes, "minute") : "",
  ]
    .filter(Boolean)
    .join(" ");
}
export function span(s: number, adjective?: "adj") {
  const unit =
    s >= 172800 && s % 86400 === 0
      ? [s / 86400, "day"]
      : s >= 3600 && s % 3600 === 0
        ? [s / 3600, "hour"]
        : s >= 60 && s % 60 === 0
          ? [s / 60, "minute"]
          : [s, "second"];
  return adjective
    ? `${unit[0]}-${unit[1]}`
    : `${unit[0]} ${unit[1]}${unit[0] === 1 ? "" : "s"}`;
}
export const ago = (s: number) =>
  s < 60
    ? `${Math.max(0, Math.floor(s))} s ago`
    : s < 3600
      ? `${Math.floor(s / 60)} min ago`
      : s < 86400
        ? `${Math.floor(s / 3600)} h ago`
        : `${Math.floor(s / 86400)} d ago`;
export function clock(t: number | bigint, seconds = false) {
  const date =
    new Date(Number(t) * 1000)
      .toISOString()
      .slice(0, seconds ? 19 : 16)
      .replace("T", " ") + " UTC";
  return date.slice(0, 10) === new Date().toISOString().slice(0, 10)
    ? date.slice(11)
    : date;
}
export const heldTime = (s: number) =>
  s < 3600 ? `${Math.max(0, Math.floor(s / 60))} min` : duration(s);
export const elapsed = (s: number) =>
  s < 60 ? `${Math.max(0, s)}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
export function words(s: number) {
  s = Math.max(0, Math.floor(s));
  const units = [
    [Math.floor(s / 86400), "day"],
    [Math.floor((s % 86400) / 3600), "hour"],
    [Math.floor((s % 3600) / 60), "minute"],
    [s % 60, "second"],
  ] as const;
  return (
    units
      .filter(([n]) => n > 0)
      .map(([n, u]) => `${n} ${u}${n === 1 ? "" : "s"}`)
      .join(" ") || "0 seconds"
  );
}
export function seasonState(s: Snapshot | undefined, now: number) {
  if (!s || !val(s, "CabalGate.startedAt")) return undefined;
  const displayed = BigInt(s.v.displayedSeason),
    next = BigInt(s.v["Seasons.nextToClose"]),
    dead = !!s.v["CabalGate.diedAt"],
    current = s.v.seasons[String(displayed)],
    waiting = s.v.seasons[String(next)];
  const lastEnded =
    dead || now >= Number(current?.bounds[2]) ? displayed : displayed - 1n;
  const awaitingAll: bigint[] = [];
  for (let k = next; k <= lastEnded; k++)
    if (!s.v.seasons[String(k)]?.closed) awaitingAll.push(k);
  return {
    displayed,
    next,
    current,
    dead,
    awaitingAll,
    awaiting: awaitingAll[0],
    closeFrom:
      Number(waiting?.bounds[2]) + Number(con(s, "Seasons.CLOSE_GRACE")),
    pot: current?.pot || 0n,
  };
}
export const potOf = (s: Snapshot | undefined, k?: bigint) =>
  !s ? 0n : s.v.seasons?.[String(k ?? s.v.displayedSeason)]?.pot || 0n;
const expiryWords = (s?: Snapshot) =>
  span(Number(con(s, "Tribunal.PENDING_EXPIRY")));
/** A pending objection the Tribunal no longer treats as live (Tribunal._stale): past filedAt +
 * PENDING_EXPIRY, or its Intake request completed without a ruling, which standing() shows as not
 * held. standing() ignores it, object() voids it to free its slot, and anyone may expire() it (IMD5). */
export function objectionStale(o: any, p: Plea, s: Snapshot, now: number) {
  return (
    o.ruling === 1 &&
    (now >
      Number(o.filedAt) + Number(con(s, "Tribunal.PENDING_EXPIRY")) ||
      (!!p.standing && !p.standing[0] && !p.standing[1] && !p.excluded))
  );
}
export function objectionLine(o: any, p: Plea, s?: Snapshot, now?: number) {
  if (o.ruling === 1)
    return s && now !== undefined && objectionStale(o, p, s, now)
      ? `no answer within ${expiryWords(s)}: void once anyone expires it; nothing changes`
      : "pending";
  if (o.ruling === 4)
    return `#${o.id}: ${o.reason === "stale" ? `no answer within ${expiryWords(s)}` : "the panel split"}: nothing changes`;
  return `#${o.id}: ${o.newScore} vs need ${p.need}${o.ruling === 3 && !p.standing?.[1] && !p.excluded ? ` · counts ${p.points || 0} points` : ""}`;
}
/** The objections that decide a plea's case now, oldest first: every ruling and every live pending
 * objection (a void or stale one changes nothing). `state` is the one a share card and post lead
 * with: a sustain decides the plea even beside a pending one (Tribunal.status), then a pending
 * objection, then an overruling (E3a: every ruled objection is named). */
export function objectionCase(p: Plea, s: Snapshot, now: number) {
  const list = (p.objections || [])
    .filter((o) => [1, 2, 3].includes(o.ruling) && !objectionStale(o, p, s, now))
    .sort((a, b) => Number(a.id - b.id));
  const of = (ruling: number) => list.filter((o) => o.ruling === ruling),
    sustained = of(2),
    pending = of(1),
    overruled = of(3);
  return {
    list,
    sustained,
    pending,
    overruled,
    state: sustained.length
      ? "SUSTAINED"
      : pending.length
        ? "OBJECTION"
        : overruled.length
          ? "OVERRULED"
          : undefined,
  };
}
/** "#1 and #2", "#1, #2 and #3". */
export const idList = (items: { id: bigint }[]) =>
  items
    .map((o) => `#${o.id}`)
    .join(", ")
    .replace(/, (#\d+)$/, " and $1");
/** A plea's share of the seller's balance as CabalGate._shareBps rounds it (up, in basis points),
 * printed the one way everywhere: "20%", "3.32%" (E3b). */
export const sharePercent = (amount: bigint, balance: bigint) =>
  balance ? pct(ceil(amount * 10000n, balance)).replace(".00%", "%") : "";
export function soldFor(p: Plea, s: Snapshot) {
  return (
    p.escrow?.[3] ||
    s.logs.find((l) => l.eventName === "SellExecuted" && l.args.id === p.id)
      ?.args.imdOut
  );
}
/** The plea page's lead. It agrees with the sale panel: a sustained objection
 * (Tribunal.standing) or an excluded seller (Seasons.excluded) means no points,
 * and only a sold plea's sale stands (C2, r2C-N1). */
export function pleaLead(
  p: Plea,
  s: Snapshot,
  o: { state: string; canSell: boolean; mine: boolean; missedSeason: boolean },
) {
  const sustained = !!p.standing?.[1],
    noPoints = sustained
      ? "An objection was sustained: no points for this plea."
      : p.excluded
        ? "This seller is excluded from season points."
        : "",
    window = Number(con(s, "CabalGate.EXECUTE_WINDOW"));
  const lead =
    o.state === "PENDING"
      ? "Waiting for the Cabal: usually 3 to 6 minutes."
      : o.state === "NO VERDICT"
        ? "No verdict. No cooldown; the oracle fee is spent."
        : o.canSell
          ? `The Cabal approved ${o.mine ? "your" : "this"} plea. Sell within the ${span(window, "adj")} window, by ${clock(Number(p.verdictAt) + window)}. ${noPoints}`
          : p.status === 4
            ? sustained
              ? "A second panel sustained an objection. No points; the sale stands."
              : `Sold ${tokenAmount(p.amount, s)} for ${tokenAmount(soldFor(p, s), s, true)}. ${noPoints}`
            : o.state === "UPHELD"
              ? "The denial was upheld. No further appeal."
              : o.state === "LAPSED"
                ? noPoints
                  ? `The approval lapsed unsold. ${noPoints}`
                  : o.missedSeason
                    ? "The approval lapsed unsold."
                    : "The approval lapsed unsold; its points still count."
                : "The Cabal denied this plea.";
  return lead.trim();
}
/** plea.html's judge line: "Judged by 30 · 24 agreed · 4m 20s. A judge said: “…”" (C4). */
export function judgeLine(
  data: { panelSize?: number; agreed?: number; comment?: string },
  panel: number | bigint,
  seconds: number,
) {
  return `Judged by ${data.panelSize ?? panel}${data.agreed === undefined ? "" : ` · ${data.agreed} agreed`} · ${elapsed(seconds)}.${data.comment ? ` A judge said: “${data.comment}”` : ""}`;
}

const factCache = new Map<string, Promise<any>>();
async function historicalFacts(
  r: Runtime,
  p: Plea,
  balance: bigint,
  logs: any[],
) {
  const event = logs.find(
      (l) => l.eventName === "PleaSubmitted" && l.args.id === p.id,
    ),
    key = `${p.id}:${event?.blockNumber}`;
  if (!event) return undefined;
  if (!factCache.has(key))
    factCache.set(
      key,
      (async () => {
        try {
          const at = event.blockNumber - 1n,
            call = (name: string, fn: string, args: any[] = []) =>
              r.client.readContract({
                address: r.addresses[name],
                abi: r.abis[name],
                functionName: fn,
                args,
                blockNumber: at,
              }) as Promise<any>;
          const [basis, latest, ago, started] = await Promise.all([
            call("PleaHook", "basisOf", [p.seller]),
            call("PleaHook", "latestPrice"),
            call("PleaHook", "price24hAgo"),
            call("CabalGate", "startedAt"),
          ]);
          const parts = factParts(
            balance,
            p.amount,
            basis,
            latest,
            ago,
            Number(started),
            Number(p.submittedAt),
          );
          if (p.isAppeal) {
            const original = await read(r, "CabalGate", "getPlea", [
                p.originalId,
              ]),
              originalBalance = await read(r, "CabalGate", "pleaBalance", [
                p.originalId,
              ]);
            const share = sharePoints(
              min(
                ceil(p.amount * 10000n, balance),
                ceil(original.amount * 10000n, originalBalance),
              ),
            );
            parts.total += share - parts.share;
            parts.share = share;
          }
          return parts;
        } catch {
          return {
            shareBps: balance ? ceil(p.amount * 10000n, balance) : null,
            share: balance ? sharePoints(ceil(p.amount * 10000n, balance)) : 0,
            total: -1,
          };
        }
      })(),
    );
  return factCache.get(key);
}

export async function readPlea(r: Runtime, id: bigint, intake?: Address) {
  const p = { ...(await read(r, "CabalGate", "getPlea", [id])) };
  if (p.status === 1) {
    const address = intake || (await read(r, "CabalGate", "intake"));
    const result = await r.client.readContract({
      address,
      abi: intakeAbi,
      functionName: "requests",
      args: [p.intakeId],
    });
    p.completed = result[3];
  }
  return p;
}

export const pct = (bps: number | bigint) =>
  (Number(bps) / 100).toFixed(2) + "%";
/** "1 wallet", "21 wallets" (r2S-VN3). */
export const plural = (n: number | bigint, one: string, many = one + "s") =>
  `${n} ${Number(n) === 1 ? one : many}`;
/** Time left in words, for "… left" and "ends in …" lines: "9d 4h", "4h 12m", and in the last
 * hour "7 min" or "less than a minute", never a clock-like "07:42" (r2S-N5). Countdowns
 * (role=timer) keep their clock. */
export function timeLeft(seconds: number) {
  seconds = Math.max(0, Math.floor(seconds));
  if (seconds < 60) return "less than a minute";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return duration(seconds);
}
/** The seat multiplier as printed: 12,000 bps → "1.2". */
export const multiplierText = (s: Snapshot | undefined) =>
  String(Number(con(s, "Seasons.SEAT_MULTIPLIER_BPS") ?? 12000) / 10000);
/** The leaderboard's bracket behind a wallet's best three: the judges' scores, × the seat multiplier
 * only on the pleas Seasons multiplied (their SeatMultiplier logs). "38·37·36 × 1.2" when every counted
 * plea was, "40 × 1.2 · 38" when some were; undefined when none was or the pleas are not known
 * (seasons.html:174; r2S-VN1). */
export function seatBracket(
  counted: { score: number; multiplied: boolean }[] | undefined,
  mult: string,
) {
  if (!counted?.some((p) => p.multiplied)) return undefined;
  return counted.every((p) => p.multiplied)
    ? `${counted.map((p) => p.score).join("·")} × ${mult}`
    : counted
        .map((p) => (p.multiplied ? `${p.score} × ${mult}` : String(p.score)))
        .join(" · ");
}
/** Your standing's judges' row: "Judges' scores, before × 1.2 · 34 · 33 · 31" when every counted
 * plea was multiplied, "Judges' scores · 40 × 1.2 · 38" when only some were (r2S-VN1). */
export function judgesRow(
  counted: { score: number; multiplied: boolean }[] | undefined,
  mult: string,
): [string, string] | undefined {
  if (!counted?.some((p) => p.multiplied)) return undefined;
  return counted.every((p) => p.multiplied)
    ? [
        `Judges’ scores, before × ${mult}`,
        counted.map((p) => p.score).join(" · "),
      ]
    : [
        "Judges’ scores",
        counted
          .map((p) => (p.multiplied ? `${p.score} × ${mult}` : String(p.score)))
          .join(" · "),
      ];
}
export const signedPercent = (percent: number, digits = 1) =>
  `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent).toFixed(digits)}%`;
/** The open-plea times in one place (T5, C1): sell by = verdictAt + EXECUTE_WINDOW; next plea
 * COOLDOWN after the sale (now + COOLDOWN if sold now), or verdictAt + COOLDOWN if it lapses
 * (CabalGate._clearStale sets lastLapsedAt to verdictAt). `head` is buy.html's bold sentence. */
export function openPleaParts(p: any, s: Snapshot, now: number) {
  if (p.status === 1)
    return {
      head: `Plea #${p.id ?? ""} is open: waiting for the verdict, usually 3 to 6 minutes.`,
      sellBy: "",
      rest: "",
    };
  const cooldown = Number(con(s, "CabalGate.COOLDOWN"));
  const sellBy = `sell by ${clock(Number(p.verdictAt) + Number(con(s, "CabalGate.EXECUTE_WINDOW")))}`;
  return {
    head: `Plea #${p.id ?? ""} is open: ${sellBy}.`,
    sellBy,
    rest: `Next plea ${span(cooldown)} after the sale (${clock(now + cooldown)} if sold now), or ${clock(Number(p.verdictAt) + cooldown)} if it lapses.`,
  };
}
/** Plead's notice body (plead.html): "Sell by 08:06 UTC. Next plea …", or the pending line. */
export function openPleaNotice(p: any, s: Snapshot, now: number) {
  const parts = openPleaParts(p, s, now);
  if (!parts.sellBy) return parts.head;
  return `S${parts.sellBy.slice(1)}. ${parts.rest}`;
}
/** A price per 1M PLEA (pair-token wei) for display: 2 decimals as usual, and below 0.01 two
 * significant digits, so a pool sold down to dust after the death never reads "0.00" (E3c).
 * A zero price (the spot price rounds to 0: the pool's imdTEST side is empty) gives "": the
 * caller says the pool holds only dust (NO_PRICE). */
export const NO_PRICE = "no price, the pool holds only dust";
export function perMillion(value: bigint, s: Snapshot | undefined) {
  if (value <= 0n) return "";
  if (value >= 10n ** 16n) return tokenAmount(value, s, true);
  let digits = 3;
  while (digits < 18 && value < 10n ** BigInt(18 - digits)) digits++;
  return tokenAmount(value, s, true, Math.min(18, digits + 1));
}
/** An amount with every decimal it has (at least 2), grouped: what an exact approval spends
 * ("exactly 33.333 imdTEST", r2T-N6). */
export function exactAmount(v: bigint, decimals = 18, minDigits = 2) {
  const E = 10n ** BigInt(decimals),
    whole = (v / E).toLocaleString("en-US"),
    fraction = (v % E)
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "")
      .padEnd(minDigits, "0");
  return fraction ? `${whole}.${fraction}` : whole;
}
export function caseState(p: Plea, s: Snapshot, now: number) {
  const objections = p.objections || [],
    max = Number(con(s, "Tribunal.MAX_OBJECTIONS") ?? 2);
  // A stale pending objection frees its slot: object() voids it before counting (IMD5).
  const live = objections.filter(
      (o) => o.ruling === 1 && !objectionStale(o, p, s, now),
    ),
    stale = objections.filter((o) => objectionStale(o, p, s, now));
  const filed =
    objections.filter((o) => [2, 3].includes(o.ruling)).length + live.length;
  const rulings = objections.filter((o) => [2, 3].includes(o.ruling)).length;
  // Every sustained objection is named: "objections #1 and #2 were sustained" (E3a).
  const sustained = objections
    .filter((o) => o.ruling === 2)
    .sort((a, b) => Number(a.id - b.id));
  const end = Number(p.verdictAt) + Number(con(s, "Tribunal.OBJECTION_WINDOW"));
  const closed =
    sustained.length > 1
      ? `objections ${idList(sustained)} were sustained`
      : sustained.length
        ? `objection #${sustained[0].id} was sustained`
        : p.standing?.[1]
          ? "an objection was sustained"
          : rulings >= max
            ? "both objections were ruled"
            : p.recorded
              ? "the points were recorded"
              : p.excluded
                ? "the seller is excluded"
                : now > end
                  ? `at ${clock(end)}`
                  : undefined;
  return {
    filed,
    closed,
    full: !closed && filed >= max,
    end,
    max,
    pending: live,
    stale,
    rulings,
  };
}
/** When a held plea's points can be recorded. Seasons.record waits while Tribunal.standing says
 * held: while the objection window is open with fewer than MAX_OBJECTIONS rulings, and while a
 * live objection waits for its panel, at most until its filedAt + PENDING_EXPIRY (r2D-N5, r2C-N3).
 * Undefined when nothing holds them: they can be recorded now (or never). */
export function recordFrom(p: Plea, s: Snapshot, now: number) {
  if (!p.standing?.[0] || p.standing[1] || p.excluded || p.recorded)
    return undefined;
  const cs = caseState(p, s, now),
    expiry = Number(con(s, "Tribunal.PENDING_EXPIRY")),
    window = cs.rulings < cs.max ? cs.end : 0,
    last = cs.pending.reduce(
      (a: any, o: any) => (!a || o.filedAt > a.filedAt ? o : a),
      undefined,
    ),
    pending = last ? Number(last.filedAt) + expiry : 0;
  return pending > window
    ? { until: pending, objection: last, objections: cs.pending }
    : { until: window, objection: undefined, objections: [] };
}
/** "objection #2 is ruled or expires", "objections #1 and #2 are ruled or expire". */
export const rulingWait = (objections: { id: bigint }[]) =>
  objections.length > 1
    ? `objections ${idList(objections)} are ruled or expire`
    : `objection #${objections[0]?.id} is ruled or expires`;
/** "Record your +44 points after 15:42 UTC, when objection #2 is ruled or expires." for the
 * Points panel, toasts and the hero; "Record your +44 points now." once nothing holds them. */
export function recordHint(
  p: Plea,
  s: Snapshot,
  now: number,
  who: "your" | "the" = "your",
  why = true,
) {
  if (
    ![2, 4, 5].includes(p.status) ||
    p.excluded ||
    p.standing?.[1] ||
    p.recorded
  )
    return "";
  const f = recordFrom(p, s, now);
  return f
    ? `Record ${who} +${p.points} points after ${clock(f.until)}${f.objection ? `, when ${rulingWait(f.objections)}` : why ? ", when objections close" : ""}.`
    : `Record ${who} +${p.points} points now.`;
}
export const caseClosedText = (closed: string) =>
  closed.startsWith("at ")
    ? `Objections closed ${closed}`
    : `Objections closed: ${closed}`;
/** Why a plea got no verdict. The reason is the Intake's PleaFailed log. Without that log the page
 * says only what the chain shows: a plea cleared before its PENDING_EXPIRY (or still pending with
 * its Intake request completed) was closed by the Intake, a plea past it with full history had no
 * answer, and with incomplete history the reason is unknown; never an expiry still to come (r2C-N5). */
export function noVerdict(p: Plea, s: Snapshot, now = s.timestamp) {
  const failure = p.failure,
    log = s.logs.find(
      (l) => l.eventName === "PleaFailed" && l.args.id === p.id,
    ),
    expiry = Number(con(s, "CabalGate.PENDING_EXPIRY")),
    end = Number(p.submittedAt) + expiry;
  const kind: "refused" | "split" | "no answer" | "closed" | "unknown" =
    failure
      ? Number(failure.status) === 1
        ? "refused"
        : Number(failure.answered)
          ? "split"
          : "no answer"
      : p.status === 1
        ? p.completed
          ? "closed"
          : "no answer"
        : now <= end
          ? "closed"
          : s.historyError
            ? "unknown"
            : "no answer";
  const sub = {
    refused: "request refused",
    split: `panel split ${failure?.agreed}/${failure?.answered}`,
    "no answer": "no answer",
    closed: "closed by the Intake",
    unknown: "reason unknown",
  }[kind];
  const sentence = {
    refused: "The request was refused.",
    split: `The panel split: ${failure?.agreed} of ${failure?.answered} agreed (${con(s, "CabalGate.QUORUM")} needed).`,
    "no answer": `No answer within ${span(expiry)}.`,
    closed: "The Intake closed the request without a verdict.",
    unknown:
      "The request ended without a verdict. The reason is in history this page could not read.",
  }[kind];
  return {
    kind,
    sub,
    sentence,
    /** The Sale status line under the sentence. */
    detail: log
      ? "Cleared at once by the Intake."
      : kind === "closed"
        ? `Cleared by the Intake before the ${span(expiry)} ran out.`
        : kind === "no answer"
          ? `The request expired at ${clock(end)} with no answer.`
          : "",
    time: p.failureAt ?? log?.timestamp ?? end,
    reported: !!log,
  };
}
export function countedPleas(
  s: Snapshot,
  season: bigint,
  wallet: string,
  best: number[],
) {
  if (s.historyError) return undefined;
  const records = s.logs
    .filter(
      (l) =>
        l.eventName === "Recorded" &&
        BigInt(l.args.season) === season &&
        l.args.wallet.toLowerCase() === wallet.toLowerCase(),
    )
    .sort((a, b) => Number(a.args.pleaId - b.args.pleaId));
  const used = new Set();
  const result = best.filter(Number).map((value) => {
    const log = records.find((l) => {
      const seat = s.logs.find(
        (x) =>
          x.eventName === "SeatMultiplier" && x.args.pleaId === l.args.pleaId,
      );
      return (
        !used.has(l.args.pleaId) &&
        Number(seat?.args.pleaPoints ?? l.args.score) === Number(value)
      );
    });
    if (!log) return undefined;
    used.add(log.args.pleaId);
    return {
      pleaId: log.args.pleaId,
      score: Number(log.args.score),
      multiplied: s.logs.some(
        (x) =>
          x.eventName === "SeatMultiplier" && x.args.pleaId === log.args.pleaId,
      ),
    };
  });
  return result.some((x) => !x)
    ? undefined
    : (result as { pleaId: bigint; score: number; multiplied: boolean }[]);
}
export function feeInPlea(s: Snapshot | undefined, fee: bigint) {
  const price = BigInt(val(s, "PleaHook.latestPrice") || 0);
  if (!s || !val(s, "PleaHook.seeded") || !price) return undefined;
  return ceil(
    ceil(fee * 2n ** 96n, price) * 10000n,
    10000n -
      BigInt(con(s, "PleaHook.IMD_FEE_BPS")) -
      BigInt(con(s, "PleaHook.PLEA_BURN_BPS")),
  );
}
export const feeInPleaText = (s: Snapshot | undefined, fee: bigint) => {
  const value = feeInPlea(s, fee);
  return value === undefined
    ? "after trading opens"
    : `about ${tokenAmount(value, s, false, 0, "up")}`;
};
// Display names (Letterbox.nameOf) for objectors, read on demand and kept a minute, so a plea page
// that names its objectors does not re-read them on every 15-second refresh.
const names = new Map<string, { at: number; value: Promise<string> }>();
export function nameOf(r: Runtime, address: string) {
  const key = address.toLowerCase(),
    hit = names.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.value;
  const value = read(r, "Letterbox", "nameOf", [address])
    .then((n) => String(n || ""))
    .catch((e) => {
      names.delete(key);
      throw e;
    });
  names.set(key, { at: Date.now(), value });
  return value;
}
const blockTimes = new Map<string, Promise<number>>();
export function blockTime(r: Runtime, number: bigint) {
  const key = String(number);
  if (!blockTimes.has(key))
    blockTimes.set(
      key,
      r.client
        .getBlock({ blockNumber: number })
        .then((b) => Number(b.timestamp))
        .catch((e) => {
          blockTimes.delete(key);
          throw e;
        }),
    );
  return blockTimes.get(key)!;
}
