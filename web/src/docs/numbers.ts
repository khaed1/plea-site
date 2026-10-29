/** The docs' numbers: web/src/docs/numbers.json, one entry per number, printed with {{key}}.
 *
 * An entry prints its `text`. One with `chain` (a key of the site's constants, read once at load
 * with the contracts' other constants: con(s, "CabalGate.PASS_MARK")) prints the chain's value once
 * the chain has answered, formatted by `format`; the unit tests check that `format` applied to
 * `value` gives `text`, so the page reads the same before and after. If the chain ever disagrees
 * with `value`, the chain wins (it is the truth) and the console says so, once per number. */
import { span } from "../chain";

export type Format = "int" | "imd" | "plea" | "duration" | "bps" | "multiplier" | "text";
export const FORMATS: Format[] = ["int", "imd", "plea", "duration", "bps", "multiplier", "text"];
export type NumberEntry = {
  text: string;
  value: string | null;
  chain: string | null;
  format: Format;
  source: string;
  what: string;
};
export type Numbers = Record<string, NumberEntry>;

/** 2500000000000000000000000 with 18 decimals -> "2,500,000"; 500000000000000000 -> "0.5". */
export function decimal(raw: bigint, decimals = 18) {
  const negative = raw < 0n,
    abs = negative ? -raw : raw,
    scale = 10n ** BigInt(decimals),
    whole = (abs / scale).toLocaleString("en-US"),
    frac = (abs % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return (negative ? "−" : "") + whole + (frac ? "." + frac : "");
}
/** Basis points as a percentage: 25 -> "0.25", 5000 -> "50". */
const percent = (bps: bigint) => decimal(bps, 2);
/** A raw value (a decimal string, a bigint or a number) in an entry's format; undefined for "text"
 * (never formatted from the chain) or a value that is no whole number. */
export function formatValue(format: Format, raw: unknown): string | undefined {
  let v: bigint;
  try {
    if (raw === null || raw === undefined || raw === "") return undefined;
    v = BigInt(raw as string | number | bigint);
  } catch {
    return undefined;
  }
  switch (format) {
    case "int":
      return v.toLocaleString("en-US");
    case "imd":
      return `${decimal(v)} IMD`;
    case "plea":
      return `${decimal(v)} PLEA`;
    case "duration":
      return span(Number(v));
    case "bps":
      return `${percent(v)}%`;
    case "multiplier":
      return `×${decimal(v, 4)}`;
    default:
      return undefined;
  }
}
const warned = new Set<string>();
/** What {{key}} prints: the chain's value once `constants` (the site's statics) has it, else the
 * file's text. Undefined for a key numbers.json lacks (the build and the tests refuse those). */
export function numberWords(numbers: Numbers, key: string, constants?: Record<string, unknown>) {
  const e = key === "_meta" ? undefined : numbers[key];
  if (!e) return undefined;
  const raw = e.chain ? constants?.[e.chain] : undefined;
  if (raw === undefined || raw === null) return e.text;
  let same = true;
  try {
    same = e.value !== null && BigInt(raw as any) === BigInt(e.value);
  } catch {
    same = false;
  }
  if (!same && !warned.has(key)) {
    warned.add(key);
    console.warn(
      `Docs: ${e.chain} on chain is ${String(raw)}, numbers.json's ${key} says ${e.value}; the page shows the chain's.`,
    );
  }
  if (e.format === "text") return e.text;
  return formatValue(e.format, raw) ?? e.text;
}
/** The raw value behind {{key}}, for a diagram's arithmetic: the chain's once `constants` has it,
 * else numbers.json's `value`; undefined when there is neither. */
export function numberValue(numbers: Numbers, key: string, constants?: Record<string, unknown>) {
  const e = key === "_meta" ? undefined : numbers[key];
  if (!e) return undefined;
  const raw = e.chain ? constants?.[e.chain] : undefined;
  try {
    if (raw !== undefined && raw !== null) return BigInt(raw as any);
    return e.value === null ? undefined : BigInt(e.value);
  } catch {
    return undefined;
  }
}
/** Problems with numbers.json itself: an entry's shape, and `text` against `format(value)` for every
 * chain-bound entry (the unit tests run it; so does the build). */
export function checkNumbers(numbers: Numbers) {
  const problems: string[] = [];
  for (const [key, e] of Object.entries(numbers)) {
    if (key === "_meta") continue;
    if (!/^[a-z][a-z0-9_]*$/.test(key)) problems.push(`${key}: a key is lower case a-z, 0-9 and _`);
    if (!e || typeof e.text !== "string" || !e.text) {
      problems.push(`${key}: no text`);
      continue;
    }
    if (!FORMATS.includes(e.format)) problems.push(`${key}: an unknown format "${e.format}"`);
    if (/\{\{|\}\}/.test(e.text)) problems.push(`${key}: a placeholder inside a number's text`);
    if (e.value !== null && typeof e.value !== "string") problems.push(`${key}: value is a decimal string or null`);
    if (e.chain !== null && !/^[A-Z][A-Za-z]*\.[A-Z][A-Z0-9_]*$/.test(e.chain ?? ""))
      problems.push(`${key}: chain is "Contract.NAME" or null`);
    if (e.chain && e.format !== "text") {
      const f = formatValue(e.format, e.value);
      if (f !== e.text) problems.push(`${key}: ${e.format}(${e.value}) is "${f}", text is "${e.text}"`);
    }
  }
  return problems;
}
