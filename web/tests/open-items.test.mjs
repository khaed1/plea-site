// Round-2 open items (run9-site-open-items.md), P1: T2/r2T-N1, X1/r2X-1, C2.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { feeDisplay } from "../src/models.ts";
import { rpcDetail } from "../src/rpc-health.ts";
const require = createRequire(import.meta.url),
  dir = await mkdtemp(path.join(tmpdir(), "plea-open-items-"));
after(() => rm(dir, { recursive: true, force: true }));
async function load(name) {
  const outfile = path.join(dir, name + ".mjs");
  await build({
    entryPoints: [
      fileURLToPath(new URL("../src/" + name + ".ts", import.meta.url)),
    ],
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
const { scanLogs, nodeHead, HEAD_LAG, pleaLead, judgeLine } =
  await load("chain");
const { resilientTransport } = await load("config");

const E = 10n ** 18n;
const hook = Object.fromEntries(
  Object.entries({
    IMD_FEE_BPS: 200,
    CASHBACK_BPS: 50,
    OWNER_BPS: 100,
    PRIZE_BPS: 25,
    POOL_BPS: 25,
  }).map(([k, v]) => ["PleaHook." + k, v]),
);
const dec = (text) => {
  const negative = text.startsWith("−"),
    [whole, fraction = ""] = text.replace("−", "").replaceAll(",", "").split(".");
  const value =
    BigInt(whole) * E + BigInt((fraction + "0".repeat(18)).slice(0, 18));
  return negative ? -value : value;
};

test("r2T-N1: with no launch fee, every amount from 0.01 to 500.00 reaches + fees = you pay", () => {
  for (const [extra, dead] of [
    [0n, false],
    [0n, true],
    [6662n, false],
    [1n, false],
  ]) {
    let wrong = 0;
    for (let cents = 1n; cents <= 50000n; cents++) {
      const text = (Number(cents) / 100).toFixed(2),
        d = feeDisplay(cents * 10n ** 16n, hook, extra, dead, text),
        launch = dec(d.launch);
      if (
        dec(d.reaches) + dec(d.fees) + launch !== dec(d.pay) ||
        dec(d.cash) + dec(d.owner) + dec(d.prize) + dec(d.wall) !==
          dec(d.fees) ||
        launch < 0n ||
        (extra === 0n && launch !== 0n)
      )
        wrong++;
    }
    assert.equal(wrong, 0, `extra ${extra}, dead ${dead}`);
  }
});
test("r2T-N1: the amounts the testers saw now add up", () => {
  const line = (text) => {
    const [w, f = ""] = text.split("."),
      d = feeDisplay(
        BigInt(w) * E + BigInt((f + "0".repeat(18)).slice(0, 18)),
        hook,
        0n,
        false,
        text,
      );
    return `${d.reaches} + ${d.fees} = ${d.pay}`;
  };
  assert.equal(line("26"), "25.492 + 0.508 = 26.00");
  assert.equal(line("77"), "75.492 + 1.508 = 77.00");
  assert.equal(line("1.01"), "0.994 + 0.016 = 1.01");
  assert.equal(line("4.07"), "4.00 + 0.07 = 4.07");
  assert.equal(line("6.11"), "6.00 + 0.11 = 6.11");
  assert.equal(line("0.5"), "0.486 + 0.014 = 0.50");
  // Home's 100 imdTEST sentence is unchanged.
  const d = feeDisplay(100n * E, hook);
  assert.deepEqual(
    [d.reaches, d.fees, d.launch, d.pay],
    ["98.028", "1.972", "0.00", "100.00"],
  );
});

// A fake runtime whose getLogs node is `lag` blocks behind `head`, like sentio.
function lagging({ head, lag, limit, message }) {
  const calls = [];
  return {
    calls,
    r: {
      addresses: { CabalGate: "0x0000000000000000000000000000000000000001" },
      abis: {},
      client: {
        async getLogs({ fromBlock, toBlock }) {
          calls.push([fromBlock, toBlock]);
          if (limit && toBlock - fromBlock + 1n > limit)
            throw Object.assign(new Error("HTTP request failed."), {
              cause: {
                status: 429,
                details: `public eth_getLogs is limited to ${limit} blocks`,
              },
            });
          if (toBlock > head - lag)
            throw Object.assign(new Error("RPC Request failed."), {
              cause: {
                code: -32000,
                details: message(toBlock, head - lag),
              },
            });
          return [];
        },
      },
    },
  };
}
test("r2X-1: a node one block behind reads to the block it names; the rest is not yet due, with no error", async () => {
  const { r, calls } = lagging({
    head: 11962410n,
    lag: 1n,
    limit: 1000n,
    message: (b, has) =>
      `block ${b} is beyond the latest block ${has} of this node, retry later`,
  });
  const started = Date.now(),
    scan = await scanLogs(r, 11948819n, 11962410n);
  assert.equal(scan.error, undefined);
  assert.equal(scan.lagged, true);
  assert.equal(scan.covered, 11962409n);
  assert.ok(Date.now() - started < 1000, "no 2-second waits");
  // 1,000-block chunks from the limit; only the last one is cut at the node's head.
  assert.ok(calls.every(([a, b]) => b - a + 1n <= 10000n));
  const [a, b] = calls.at(-1);
  assert.equal(b, 11962409n);
  assert.ok(b - a + 1n <= 1000n);
  // The next read resumes at the block that was not yet due.
  const next = await scanLogs(r, scan.covered + 1n, 11962410n);
  assert.equal(next.error, undefined);
  assert.equal(next.covered, 11962409n);
});
test("r2X-1: a lag with no named block steps back; a node far behind is still a history error", async () => {
  const unnamed = lagging({
    head: 1000n,
    lag: 3n,
    message: () => "block range extends beyond current head block",
  });
  const scan = await scanLogs(unnamed.r, 1n, 1000n);
  assert.equal(scan.error, undefined);
  assert.equal(scan.covered, 997n);
  const far = lagging({
    head: 1000n,
    lag: HEAD_LAG + 5n,
    message: (b, has) => `block ${b} is beyond the latest block ${has}`,
  });
  const stale = await scanLogs(far.r, 1n, 1000n);
  assert.ok(stale.error);
  assert.equal(stale.lagged, false);
  assert.equal(nodeHead("block 7 is beyond the latest block 6 of this node, retry later"), 6n);
  assert.equal(nodeHead("block range extends beyond current head block"), undefined);
});
test("r2X-1: with one endpoint refused and the next one lagging, the caller sees the lag", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("one")) throw new TypeError("Failed to fetch");
    const body = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: body.id,
        error: {
          code: -32000,
          message: "block 11 is beyond the latest block 10 of this node, retry later",
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  try {
    const t = resilientTransport(
      ["https://one.invalid", "https://two.invalid"],
      100,
      60000,
    )({});
    await assert.rejects(
      () =>
        t.request({
          method: "eth_getLogs",
          params: [{ fromBlock: "0x1", toBlock: "0xb" }],
        }),
      (e) => /latest block 10 of this node/.test(rpcDetail(e).text),
    );
  } finally {
    globalThis.fetch = original;
  }
});

const court = {
  constants: { "CabalGate.EXECUTE_WINDOW": 420 },
  logs: [],
  v: {},
};
const plea = (o) => ({
  id: 8n,
  amount: 10n * E,
  verdictAt: 1792600000n,
  status: 2,
  standing: [false, false, 255],
  excluded: false,
  ...o,
});
test("C2/r2C-N1: the lead agrees with the sale panel for sustained and excluded pleas", () => {
  const lead = (p, state, canSell = false) =>
    pleaLead(plea(p), court, { state, canSell, mine: true, missedSeason: false });
  const sustained = { standing: [false, true, 30] };
  const inWindow = lead(sustained, "APPROVED", true);
  assert.match(inWindow, /^The Cabal approved your plea\. Sell within the 7-minute window/);
  assert.match(inWindow, /no points for this plea\.$/);
  assert.doesNotMatch(inWindow, /sale stands/);
  assert.equal(
    lead({ ...sustained, status: 5 }, "LAPSED"),
    "The approval lapsed unsold. An objection was sustained: no points for this plea.",
  );
  assert.equal(
    lead({ excluded: true, status: 5 }, "LAPSED"),
    "The approval lapsed unsold. This seller is excluded from season points.",
  );
  assert.equal(
    lead({ ...sustained, status: 4 }, "SOLD"),
    "A second panel sustained an objection. No points; the sale stands.",
  );
  assert.equal(
    lead({ status: 5 }, "LAPSED"),
    "The approval lapsed unsold; its points still count.",
  );
});
test("C2: the UPHELD judge line follows plea.html", () => {
  assert.equal(
    judgeLine({ panelSize: 30, agreed: 24, comment: "Louder, not better." }, 30n, 260),
    "Judged by 30 · 24 agreed · 4m 20s. A judge said: “Louder, not better.”",
  );
  assert.equal(judgeLine({}, 30n, 41), "Judged by 30 · 41s.");
});
test("X1: a hung first endpoint costs one hedge delay, then cools down; eth_getLogs is never doubled", async () => {
  const original = globalThis.fetch,
    calls = [];
  globalThis.fetch = (url, init) => {
    calls.push(String(url));
    if (String(url).includes("one"))
      return new Promise((_, reject) =>
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        ),
      );
    const body = JSON.parse(init.body),
      answer = (x) => ({ jsonrpc: "2.0", id: x.id, result: x.method === "eth_getLogs" ? [] : "0xaa36a7" });
    return Promise.resolve(
      new Response(JSON.stringify(Array.isArray(body) ? body.map(answer) : answer(body)), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
  try {
    const t = resilientTransport(
      ["https://one.invalid", "https://two.invalid"],
      400,
      60000,
      50,
    )({});
    let started = Date.now();
    assert.equal(await t.request({ method: "eth_chainId" }), "0xaa36a7");
    assert.ok(Date.now() - started < 300, "answered by the hedge, not after the timeout");
    assert.deepEqual(calls, ["https://one.invalid/", "https://two.invalid/"]);
    await t.request({ method: "eth_chainId" });
    assert.equal(calls.filter((u) => u.includes("one")).length, 1, "the hung endpoint cools down");
    const logs = resilientTransport(["https://one.invalid", "https://two.invalid"], 300, 60000, 50)({});
    calls.length = 0;
    started = Date.now();
    await logs.request({ method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "0x2" }] });
    assert.ok(Date.now() - started >= 290, "eth_getLogs waits for the timeout");
    assert.deepEqual(calls, ["https://one.invalid/", "https://two.invalid/"]);
  } finally {
    globalThis.fetch = original;
  }
});
