import type { JudgeTest } from "./types";

// The shared foundation of the judge's input generators (judge-gen.ts and
// judge-gen-graphs.ts): the spec type, the seeded random stream, and the
// field accessors that turn a spec into validated numbers, strings and
// bounds, throwing GenError for anything malformed.

export interface GenSpec {
  $gen: string;
  seed?: number;
  spread?: boolean;
  [key: string]: unknown;
}

/** The most elements one generator may produce. */
export const MAX_N = 500_000;
const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export class GenError extends Error {}

export function isGenSpec(value: unknown): value is GenSpec {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as GenSpec).$gen === "string"
  );
}

export type Rng = () => number;

/** One test's expansion: its random stream plus the `seq` counters. */
export interface Ctx {
  r: Rng;
  counters: Map<GenSpec, number>;
}

/** xorshift32 seeded from an integer; returns numbers in [0, 1). */
export function makeRng(seed: number): Rng {
  let s = (Math.floor(seed) ^ 0x9e3779b9) >>> 0 || 0x1234567;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function randInt(r: Rng, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

export function shuffle<T>(items: T[], r: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function num(spec: GenSpec, key: string, fallback?: number): number {
  const value = spec[key];
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new GenError(`${spec.$gen} needs a numeric "${key}"`);
  }
  return value;
}

export function count(spec: GenSpec, key = "n"): number {
  const n = Math.floor(num(spec, key));
  if (n < 0 || n > MAX_N) {
    throw new GenError(`${spec.$gen} "${key}" must be between 0 and ${MAX_N}`);
  }
  return n;
}

export function bounds(spec: GenSpec): [number, number] {
  const min = num(spec, "min");
  const max = num(spec, "max");
  if (min > max) throw new GenError(`${spec.$gen} has min above max`);
  return [min, max];
}

export function pair(spec: GenSpec, key: string): [number, number] | undefined {
  const value = spec[key];
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((v) => typeof v !== "number")
  ) {
    throw new GenError(`${spec.$gen} "${key}" must be [min, max]`);
  }
  return value as [number, number];
}

export function alphabet(spec: GenSpec): string {
  const value = spec.alphabet ?? DEFAULT_ALPHABET;
  if (typeof value !== "string" || value === "") {
    throw new GenError(`${spec.$gen} needs a non-empty "alphabet"`);
  }
  return value;
}

export function randString(r: Rng, n: number, letters: string): string {
  let out = "";
  for (let i = 0; i < n; i++) out += letters[Math.floor(r() * letters.length)];
  return out;
}

export function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

export function distinctInts(
  r: Rng,
  n: number,
  min: number,
  max: number,
): number[] {
  if (max - min + 1 < n) {
    throw new GenError("ints: not enough distinct values in [min, max]");
  }
  const seen = new Set<number>();
  const out: number[] = [];
  while (out.length < n) {
    const value = randInt(r, min, max);
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/** A test as the seed files write it; re-exported for the generator modules. */
export type { JudgeTest };
