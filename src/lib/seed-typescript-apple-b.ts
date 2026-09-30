import type { JudgeLanguage } from "./types";

// TypeScript judge definitions for the Apple front-end bank, part two
// (seed-apple-js-d.ts and seed-apple-js-e.ts). Same conventions as
// seed-typescript-apple.ts: the JavaScript driver runs unchanged.

export const appleTypescriptJudgesB: Record<string, JudgeLanguage> = {
  "implement-clone-deep": {
    entry: "__judgeCloneDeep",
    starterCode: `/**
 * Deep-copy value: cycles, shared references, Date, RegExp, Map, Set,
 * prototypes and symbol keys all survive.
 */
function cloneDeep<T>(value: T): T {
  // Your code here
  return value;
}
`,
    solutionCode: `function cloneDeep<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== "object") return value; // primitives and functions
  const source = value as unknown as object;
  if (seen.has(source)) return seen.get(source) as T; // cycles and shared references

  if (source instanceof Date) {
    const copy = new Date(source.getTime());
    seen.set(source, copy);
    return copy as unknown as T;
  }
  if (source instanceof RegExp) {
    const copy = new RegExp(source.source, source.flags);
    seen.set(source, copy);
    return copy as unknown as T;
  }
  if (source instanceof Map) {
    const copy = new Map<unknown, unknown>();
    seen.set(source, copy); // register before recursing
    source.forEach((v, k) => copy.set(cloneDeep(k, seen), cloneDeep(v, seen)));
    return copy as unknown as T;
  }
  if (source instanceof Set) {
    const copy = new Set<unknown>();
    seen.set(source, copy);
    source.forEach((v) => copy.add(cloneDeep(v, seen)));
    return copy as unknown as T;
  }

  const copy: Record<PropertyKey, unknown> = Array.isArray(source)
    ? ([] as unknown as Record<PropertyKey, unknown>)
    : Object.create(Object.getPrototypeOf(source));
  seen.set(source, copy);
  for (const key of Reflect.ownKeys(source)) {
    if (Array.isArray(source) && key === "length") continue;
    copy[key] = cloneDeep((source as Record<PropertyKey, unknown>)[key], seen);
  }
  return copy as unknown as T;
}
`,
  },
  "memoize-curry-once": {
    entry: "__judgeFunctional",
    starterCode: `type AnyFn = (this: any, ...args: any[]) => any;

/** Cache fn's results per resolver(...args); JSON.stringify(args) by default. */
function memoize<F extends AnyFn>(
  fn: F,
  resolver: (...args: Parameters<F>) => unknown = (...args) => JSON.stringify(args),
): F {
  // Your code here
  return fn;
}

/** Collect arguments until fn.length have arrived, then call fn. */
function curry(fn: AnyFn): AnyFn {
  // Your code here
  return fn;
}

/** Call fn once; later calls return the first result. */
function once<F extends AnyFn>(fn: F): F {
  // Your code here
  return fn;
}
`,
    solutionCode: `type AnyFn = (this: any, ...args: any[]) => any;

function memoize<F extends AnyFn>(
  fn: F,
  resolver: (...args: Parameters<F>) => unknown = (...args) => JSON.stringify(args),
): F {
  const cache = new Map<unknown, ReturnType<F>>();
  return function (this: unknown, ...args: Parameters<F>) {
    const key = resolver(...args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args)); // has, not truthiness
    return cache.get(key);
  } as F;
}

function curry(fn: AnyFn): AnyFn {
  return function curried(this: unknown, ...args: unknown[]): unknown {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function (this: unknown, ...more: unknown[]) {
      return curried.apply(this, [...args, ...more]); // a new array: partials stay independent
    };
  };
}

function once<F extends AnyFn>(fn: F): F {
  let called = false;
  let result: ReturnType<F> | undefined;
  return function (this: unknown, ...args: Parameters<F>) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  } as F;
}
`,
  },
  "implement-lodash-get": {
    entry: "get",
    starterCode: `/**
 * Read a nested value by path ("a[0].b.c", "a.0.b.c" or ["a", "0", "b", "c"]).
 * Returns fallback when the path leads nowhere or ends at undefined.
 */
function get(obj: unknown, path: string | string[], fallback?: unknown): unknown {
  // Your code here
  return fallback;
}
`,
    solutionCode: `function get(obj: unknown, path: string | string[], fallback?: unknown): unknown {
  const keys = Array.isArray(path)
    ? path
    : String(path).replace(/\\[(\\w+)\\]/g, ".$1").split(".").filter(Boolean);
  let cur: any = obj;
  for (const key of keys) {
    if (cur == null) return fallback; // null or undefined: nowhere to go
    cur = cur[key];
  }
  return cur === undefined ? fallback : cur; // null, 0 and false are real values
}
`,
  },
  "chunk-and-group-by": {
    entry: "__judgeCollections",
    starterCode: `/** Split array into arrays of \`size\` (rounded down); [] when size < 1. */
function chunk<T>(array: T[], size: number): T[][] {
  // Your code here
  return [];
}

/** Map each key (iteratee function or property name) to its items, in input order. */
function groupBy<T>(array: T[], iteratee: ((item: T) => unknown) | string): Record<string, T[]> {
  // Your code here
  return {};
}
`,
    solutionCode: `function chunk<T>(array: T[], size: number): T[][] {
  const step = Math.floor(size);
  if (!(step >= 1)) return []; // also catches NaN; a size of 0 would loop forever
  const out: T[][] = [];
  for (let i = 0; i < array.length; i += step) out.push(array.slice(i, i + step));
  return out;
}

function groupBy<T>(array: T[], iteratee: ((item: T) => unknown) | string): Record<string, T[]> {
  const keyOf =
    typeof iteratee === "function" ? iteratee : (item: T) => (item as any)[iteratee];
  const out: Record<string, T[]> = Object.create(null); // no inherited keys like "constructor"
  for (const item of array) {
    const key = String(keyOf(item));
    if (!(key in out)) out[key] = [];
    out[key].push(item);
  }
  return out;
}
`,
  },
  "nested-object-key-paths": {
    entry: "__judgeKeyPaths",
    starterCode: `/**
 * Dotted paths to every primitive (null included) in a nested object or array.
 * Skip references back to an object already on the current path.
 */
function fetchKeys(input: object): string[] {
  // Your code here
  return [];
}
`,
    solutionCode: `function fetchKeys(input: object): string[] {
  const out: string[] = [];
  const onPath = new Set<object>(); // ancestors of the current value, for cycles
  const walk = (value: unknown, path: string): void => {
    if (value === null || typeof value !== "object") {
      out.push(path); // typeof null is "object", so null is checked first
      return;
    }
    if (onPath.has(value)) return; // a cycle back to an ancestor
    onPath.add(value);
    for (const key of Object.keys(value)) {
      walk((value as Record<string, unknown>)[key], path ? path + "." + key : key);
    }
    onPath.delete(value); // a shared object may be reached again by another route
  };
  walk(input, "");
  return out;
}
`,
  },
};
