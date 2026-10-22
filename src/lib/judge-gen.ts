import {
  alphabet,
  bounds,
  clone,
  count,
  distinctInts,
  GenError,
  isGenSpec,
  makeRng,
  num,
  pair,
  randInt,
  randString,
  shuffle,
  type Ctx,
  type GenSpec,
  type JudgeTest,
} from "./judge-gen-core";
import { adjacency, namedEdges, parents, tree } from "./judge-gen-graphs";

export { GenError, isGenSpec, MAX_N, type GenSpec } from "./judge-gen-core";

// Large judge inputs without large seed files: a test's input may hold
// generator specs — objects with a `$gen` key — that the runners expand on
// the fly, so a 100,000-element array costs one line in the seed, the
// database and the page. Expansion is a seeded xorshift stream, so every
// runner (the browser workers, the Judge0 server path) sees the same input
// for the same spec. The expected value of such a test is normally
// `REFERENCE`: the runner computes it by running the problem's JavaScript
// reference solution on the expanded input before judging the user's code
// (prepareTests in run-judge.ts; the vm equivalent in judge0.ts).
//
// Specs (`seed` is required at the top level and inherited inside `list`,
// `pick`, `repeat`, `join`, `concat` and `calls` templates; `n` is capped
// at MAX_N):
//   { $gen: "int", min, max }
//   { $gen: "ints", n, min, max, sort?, distinct? }
//   { $gen: "range", n, from?, step?, shuffle?, prefix? }  0..n-1 by default;
//       with a prefix, strings: "v0", "v1", ...
//   { $gen: "seq", start?, step? }                          the next value each time
//       it is expanded within one test: increasing timestamps, unique ids
//   { $gen: "repeat", n, value }                            value cloned n times
//   { $gen: "list", n, item }                               item re-expanded n times
//   { $gen: "pick", from: [...] }                           one option, expanded
//   { $gen: "string", n, alphabet? }
//   { $gen: "words", n, length: k | [min, max], alphabet? }
//   { $gen: "join", n, item, sep? }                         n strings joined
//   { $gen: "concat", parts: [...] }                        arrays joined, or strings
//   { $gen: "intervals", n, max, maxLen, minLen?, gap?: [min, max] }
//       [[start, end], ...]; with `gap`, sorted and non-overlapping
//   { $gen: "matrix", rows, cols, min, max }
//   { $gen: "grid", rows, cols, alphabet }                  rows as strings
//   { $gen: "edges", n, m, directed?, acyclic?, connected?, bipartite?, weights?: [min, max],
//       plain?, prefix? }   ids are shuffled unless `plain` (then an acyclic
//       edge runs low to high and a connected graph's tree is rooted at 0);
//       a prefix turns ids into strings
//   { $gen: "adjacency", n, m, directed?, acyclic?, connected?, prefix?, weights? }
//       { name: [neighbours] } (or { name: { neighbour: weight } } with weights)
//   { $gen: "parents", n, roots? }                          parent[i] < i, roots are -1
//   { $gen: "tree", n, min, max, kind?: "random" | "balanced" | "full" }
//       level-order with nulls; random and balanced are BSTs, full has 0 or 2 children
//   { $gen: "calls", n, first?: [name, args], prefix?: [[name, args], ...],
//       methods: [[name, args, weight?], ...] }
//       -> [names, argsList], the LeetCode-style class-call pair: the
//       constructor call, the fixed prefix, then n weighted random calls
// Any spec placed directly in a test's input may carry `spread: true`, in
// which case the array it generates becomes several arguments.

export const REFERENCE = { $ref: "solution" } as const;

export interface ExpandedTest {
  name?: string;
  input: unknown[];
  expected: unknown;
  /** How the runners show the input: the specs as written, not the expansion. */
  display?: string;
  /** Whether anything about the test was generated or needs the reference. */
  generated: boolean;
}

export function isReference(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { $ref?: unknown }).$ref === "solution"
  );
}

/** Whether a value holds a generator spec anywhere inside it. */
export function hasGenSpec(value: unknown): boolean {
  if (isGenSpec(value)) return true;
  if (Array.isArray(value)) return value.some(hasGenSpec);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(hasGenSpec);
  }
  return false;
}

/** Whether any test needs expanding or the reference solution. */
export function hasGeneratedTests(tests: readonly JudgeTest[]): boolean {
  return tests.some(
    (test) => isReference(test.expected) || test.input.some(hasGenSpec),
  );
}

/** The input as the runners display it: one JSON value per argument. */
export function displayInput(input: readonly unknown[]): string {
  return input
    .map((arg) => {
      const json = JSON.stringify(arg);
      return json === undefined ? String(arg) : json;
    })
    .join(", ");
}

// -- the class-call generator and the expansion -----------------------------

function calls(spec: GenSpec, ctx: Ctx): [string[], unknown[][]] {
  const r = ctx.r;
  const n = count(spec);
  const methods = spec.methods;
  if (!Array.isArray(methods) || methods.length === 0) {
    throw new GenError('calls needs a non-empty "methods" list');
  }
  const names: string[] = [];
  const args: unknown[][] = [];
  const first = spec.first;
  if (first !== undefined) {
    if (!Array.isArray(first) || typeof first[0] !== "string") {
      throw new GenError('calls "first" must be [name, args]');
    }
    names.push(first[0]);
    args.push(expandValue(first[1] ?? [], ctx) as unknown[]);
  }
  if (spec.prefix !== undefined) {
    const fixed = expandValue(spec.prefix, ctx);
    if (!Array.isArray(fixed))
      throw new GenError('calls "prefix" must be a list of calls');
    for (const call of fixed) {
      if (!Array.isArray(call) || typeof call[0] !== "string") {
        throw new GenError('calls "prefix" entries must be [name, args]');
      }
      names.push(call[0]);
      args.push((call[1] ?? []) as unknown[]);
    }
  }
  const weights = methods.map((m) =>
    Array.isArray(m) && typeof m[2] === "number" ? m[2] : 1,
  );
  const total = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) {
    let pick = r() * total;
    let index = 0;
    while (index < methods.length - 1 && pick >= weights[index]) {
      pick -= weights[index];
      index++;
    }
    const method = methods[index];
    if (!Array.isArray(method) || typeof method[0] !== "string") {
      throw new GenError(
        'calls "methods" entries must be [name, args, weight?]',
      );
    }
    names.push(method[0]);
    args.push(expandValue(method[1] ?? [], ctx) as unknown[]);
  }
  return [names, args];
}

function generate(spec: GenSpec, outer: Ctx | null): unknown {
  const ctx: Ctx | null =
    spec.seed !== undefined
      ? {
          r: makeRng(num(spec, "seed")),
          counters: outer?.counters ?? new Map(),
        }
      : outer;
  if (!ctx) throw new GenError(`${spec.$gen} needs a "seed"`);
  const r = ctx.r;
  switch (spec.$gen) {
    case "int": {
      const [min, max] = bounds(spec);
      return randInt(r, min, max);
    }
    case "ints": {
      const n = count(spec);
      const [min, max] = bounds(spec);
      const out = spec.distinct
        ? distinctInts(r, n, min, max)
        : Array.from({ length: n }, () => randInt(r, min, max));
      if (spec.sort) out.sort((a, b) => a - b);
      return out;
    }
    case "range": {
      const n = count(spec);
      const from = num(spec, "from", 0);
      const step = num(spec, "step", 1);
      const numbers = Array.from({ length: n }, (_, i) => from + i * step);
      const out =
        typeof spec.prefix === "string"
          ? numbers.map((value) => `${spec.prefix}${value}`)
          : numbers;
      return spec.shuffle ? shuffle(out as unknown[], r) : out;
    }
    case "seq": {
      const start = num(spec, "start", 0);
      const step = num(spec, "step", 1);
      const k = ctx.counters.get(spec) ?? 0;
      ctx.counters.set(spec, k + 1);
      return start + k * step;
    }
    case "repeat": {
      const n = count(spec);
      const value = expandValue(spec.value, ctx);
      return Array.from({ length: n }, () => clone(value));
    }
    case "list": {
      const n = count(spec);
      return Array.from({ length: n }, () => expandValue(spec.item, ctx));
    }
    case "pick": {
      const from = spec.from;
      if (!Array.isArray(from) || from.length === 0) {
        throw new GenError('pick needs a non-empty "from" list');
      }
      return expandValue(from[randInt(r, 0, from.length - 1)], ctx);
    }
    case "string":
      return randString(r, count(spec), alphabet(spec));
    case "words": {
      const n = count(spec);
      const letters = alphabet(spec);
      const length = spec.length;
      const [lo, hi] =
        typeof length === "number"
          ? [length, length]
          : (pair(spec, "length") ?? [1, 8]);
      return Array.from({ length: n }, () =>
        randString(r, randInt(r, lo, hi), letters),
      );
    }
    case "join": {
      const n = count(spec);
      const sep = typeof spec.sep === "string" ? spec.sep : "";
      return Array.from({ length: n }, () => {
        const item = expandValue(spec.item, ctx);
        if (typeof item !== "string") {
          throw new GenError("join items must be strings");
        }
        return item;
      }).join(sep);
    }
    case "concat": {
      const parts = spec.parts;
      if (!Array.isArray(parts)) throw new GenError('concat needs "parts"');
      const expanded = parts.map((part) => expandValue(part, ctx));
      if (expanded.every((part) => typeof part === "string")) {
        return expanded.join("");
      }
      return expanded.flatMap((part) => {
        if (!Array.isArray(part)) {
          throw new GenError("concat parts must all be arrays or all strings");
        }
        return part;
      });
    }
    case "intervals": {
      const n = count(spec);
      const max = num(spec, "max");
      const maxLen = num(spec, "maxLen");
      const minLen = num(spec, "minLen", 0);
      const gap = pair(spec, "gap");
      let cursor = 0;
      return Array.from({ length: n }, () => {
        // With a gap the intervals follow one another: sorted and disjoint.
        const start = gap
          ? cursor + randInt(r, gap[0], gap[1])
          : randInt(r, 0, max);
        const end = start + randInt(r, minLen, maxLen);
        cursor = end;
        return [start, end];
      });
    }
    case "matrix": {
      const rows = count(spec, "rows");
      const cols = count(spec, "cols");
      const [min, max] = bounds(spec);
      return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => randInt(r, min, max)),
      );
    }
    case "grid": {
      const rows = count(spec, "rows");
      const cols = count(spec, "cols");
      const letters = alphabet(spec);
      return Array.from({ length: rows }, () => randString(r, cols, letters));
    }
    case "edges":
      return namedEdges(spec, r);
    case "adjacency":
      return adjacency(spec, r);
    case "parents":
      return parents(spec, r);
    case "tree":
      return tree(spec, r);
    case "calls":
      return calls(spec, ctx);
    default:
      throw new GenError(`unknown generator "${spec.$gen}"`);
  }
}

/** Expands every spec inside a value; plain values pass through. */
function expandValue(value: unknown, ctx: Ctx | null): unknown {
  if (isGenSpec(value)) return generate(value, ctx);
  if (Array.isArray(value)) return value.map((item) => expandValue(item, ctx));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, expandValue(item, ctx)]),
    );
  }
  return value;
}

/**
 * The tests with their inputs expanded. A generated test keeps `expected`
 * as written — a `REFERENCE` is for the caller to resolve — and records
 * the spec'd input as its display. Throws GenError for a malformed spec.
 */
export function expandTests(tests: readonly JudgeTest[]): ExpandedTest[] {
  return tests.map((test) => {
    const generated = isReference(test.expected) || test.input.some(hasGenSpec);
    if (!generated) {
      return {
        name: test.name,
        input: test.input,
        expected: test.expected,
        generated,
      };
    }
    // One counter map per test, so `seq` runs on across its arguments; the
    // stream itself comes from each top-level spec's own seed.
    const counters = new Map<GenSpec, number>();
    const unseeded: Ctx = {
      r: () => {
        throw new GenError("a top-level spec needs a seed");
      },
      counters,
    };
    const input: unknown[] = [];
    for (const arg of test.input) {
      if (isGenSpec(arg) && arg.spread) {
        const value = generate(arg, unseeded);
        if (!Array.isArray(value)) {
          throw new GenError(`${arg.$gen} with spread must generate an array`);
        }
        input.push(...value);
      } else {
        input.push(expandValue(arg, unseeded));
      }
    }
    return {
      name: test.name,
      input,
      expected: test.expected,
      display: displayInput(test.input),
      generated,
    };
  });
}
