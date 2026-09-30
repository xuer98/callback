import type { JudgeLanguage } from "./types";

// TypeScript judges for problems split out of multi-question prompts, keyed
// by slug and merged into judge.typescript by the seed script. TypeScript is
// type-stripped and run against the JavaScript driver, so entries mirror the
// JavaScript judge.

export const splitTypescriptJudges: Record<string, JudgeLanguage> = {
  "round-numeric-string-list": {
    entry: "roundAll",
    starterCode: `/**
 * Round every value in a comma-separated list of numeric strings to the
 * nearest integer, rounding half away from zero. No leading zeros in the
 * results, and never "-0". Values can exceed any built-in numeric type —
 * stay in string land.
 * @param csv - e.g. "2.5,-2.5,9.99"
 */
function roundAll(csv: string): string {
  // Your code here
  return csv;
}
`,
  },
  "settle-debts-from-stream": {
    entry: "__settleStream",
    starterCode: `/**
 * Lines are "payer,payee,amount" (amount is an integer) and may be split
 * across chunks.
 * @param readChunk - returns "" once the stream ends
 * @returns minimum number of transactions to settle all balances
 */
function settleFromStream(readChunk: () => string): number {
  // Your code here
  return 0;
}
`,
    driverCode: `function __settleStream(chunks) {
  let i = 0;
  const readChunk = () => (i < chunks.length ? chunks[i++] : "");
  return settleFromStream(readChunk);
}`,
  },
  "implement-array-filter": {
    entry: "__judgeFilter",
    starterCode: `interface Array<T> {
  myFilter(cb: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): T[];
}

/** Like Array.prototype.filter: skips holes, forwards thisArg. */
Array.prototype.myFilter = function (this: unknown[], cb: Function, thisArg?: unknown): unknown[] {
  // Your code here
  return [];
};
`,
    solutionCode: `interface Array<T> {
  myFilter(cb: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): T[];
}

type Callback = (this: unknown, ...args: any[]) => any;

function assertCallable(cb: unknown): asserts cb is Callback {
  if (typeof cb !== "function") throw new TypeError(String(cb) + " is not a function");
}

Array.prototype.myFilter = function (this: unknown[], cb: unknown, thisArg?: unknown): unknown[] {
  assertCallable(cb);
  const out: unknown[] = [];
  for (let i = 0; i < this.length; i++) {
    if (!(i in this)) continue;
    const v = this[i];
    if (cb.call(thisArg, v, i, this)) out.push(v);
  }
  return out;
};
`,
  },
  "implement-array-reduce": {
    entry: "__judgeReduce",
    starterCode: `interface Array<T> {
  myReduce<U>(cb: (acc: U, value: T, index: number, array: T[]) => U, ...initial: [U?]): U;
}

/** Like Array.prototype.reduce: an initial value counts whenever it is passed. */
Array.prototype.myReduce = function (this: unknown[], cb: Function, ...rest: unknown[]): any {
  // Your code here
  return undefined;
};
`,
    solutionCode: `interface Array<T> {
  myReduce<U>(cb: (acc: U, value: T, index: number, array: T[]) => U, ...initial: [U?]): U;
}

type Callback = (this: unknown, ...args: any[]) => any;

function assertCallable(cb: unknown): asserts cb is Callback {
  if (typeof cb !== "function") throw new TypeError(String(cb) + " is not a function");
}

// ...rest, not a default parameter: reduce(fn, undefined) supplies a value.
Array.prototype.myReduce = function (this: unknown[], cb: unknown, ...rest: unknown[]): any {
  assertCallable(cb);
  const len = this.length;
  let i = 0;
  let acc: unknown;
  if (rest.length > 0) {
    acc = rest[0];
  } else {
    while (i < len && !(i in this)) i++;
    if (i >= len) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[i++];
  }
  for (; i < len; i++) {
    if (i in this) acc = cb(acc, this[i], i, this);
  }
  return acc;
};
`,
  },
  "implement-array-concat": {
    entry: "__judgeConcat",
    starterCode: `interface Array<T> {
  myConcat(...items: unknown[]): unknown[];
}

/** Like Array.prototype.concat: spreads arrays one level. */
Array.prototype.myConcat = function (this: unknown[], ...items: unknown[]): unknown[] {
  // Your code here
  return [];
};
`,
    solutionCode: `interface Array<T> {
  myConcat(...items: unknown[]): unknown[];
}

Array.prototype.myConcat = function (this: unknown[], ...items: unknown[]): unknown[] {
  const out: unknown[] = [];
  let n = 0;
  for (const item of [this, ...items]) {
    const spreadable =
      item !== null &&
      typeof item === "object" &&
      ((item as any)[Symbol.isConcatSpreadable] ?? Array.isArray(item));
    if (spreadable) {
      const list = item as ArrayLike<unknown>;
      for (let i = 0; i < list.length; i++, n++) {
        if (i in list) out[n] = list[i];
      }
    } else {
      out[n++] = item;
    }
  }
  out.length = n; // keeps a trailing hole
  return out;
};
`,
  },
  "generator-async-runner": {
    entry: "__judgeRun",
    starterCode: `/**
 * Drive a generator: wait for each yielded value, resume with the result,
 * throw rejections back in. Resolves with the generator's return value.
 */
function run<R>(genFn: () => Generator<unknown, R, any>): Promise<R> {
  // Your code here
  return Promise.resolve(undefined as R);
}
`,
    solutionCode: `function run<R>(genFn: () => Generator<unknown, R, any>): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const it = genFn();
    const step = (method: "next" | "throw", arg?: unknown): void => {
      let r: IteratorResult<unknown, R>;
      try {
        r = method === "next" ? it.next(arg) : it.throw(arg);
      } catch (err) {
        reject(err); // the generator didn't catch it
        return;
      }
      if (r.done) {
        resolve(r.value);
        return;
      }
      Promise.resolve(r.value).then(
        (value) => step("next", value),
        (err) => step("throw", err),
      );
    };
    step("next");
  });
}
`,
  },
  "map-async": {
    entry: "__judgeMapAsync",
    starterCode: `/** Map every item through fn at once; results in input order. */
function mapAsync<T, R>(items: Iterable<T>, fn: (item: T) => Promise<R>): Promise<R[]> {
  // Your code here
  return Promise.resolve([]);
}
`,
    solutionCode: `function mapAsync<T, R>(items: Iterable<T>, fn: (item: T) => Promise<R>): Promise<R[]> {
  return Promise.all(Array.from(items, (item) => fn(item)));
}
`,
  },
  "implement-promise-all": {
    entry: "__judgePromiseAll",
    starterCode: `/** Like Promise.all, without calling it. */
function promiseAll<T>(iterable: Iterable<T | PromiseLike<T>>): Promise<T[]> {
  // Your code here
  return Promise.resolve([]);
}
`,
    solutionCode: `function promiseAll<T>(iterable: Iterable<T | PromiseLike<T>>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const results: T[] = new Array(items.length);
    let pending = items.length;
    if (pending === 0) {
      resolve(results); // nothing will ever count down
      return;
    }
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value; // by index, never in completion order
        pending -= 1;
        if (pending === 0) resolve(results);
      }, reject);
    });
  });
}
`,
  },
  "promise-with-timeout": {
    entry: "__judgeTimeout",
    starterCode: `/** Settle like promise within ms, else reject with new Error("Timed out after <ms> ms"). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  // Your code here
  return promise;
}
`,
    solutionCode: `function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out after " + ms + " ms")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
`,
  },
  "implement-curry": {
    entry: "__judgeCurry",
    starterCode: `type AnyFn = (this: any, ...args: any[]) => any;

/** Collect arguments until fn.length have arrived, then call fn. */
function curry(fn: AnyFn): AnyFn {
  // Your code here
  return fn;
}
`,
    solutionCode: `type AnyFn = (this: any, ...args: any[]) => any;

function curry(fn: AnyFn): AnyFn {
  return function curried(this: unknown, ...args: unknown[]): unknown {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function (this: unknown, ...more: unknown[]) {
      return curried.apply(this, [...args, ...more]); // a new array: partials stay independent
    };
  };
}
`,
  },
  "implement-once": {
    entry: "__judgeOnce",
    starterCode: `type AnyFn = (this: any, ...args: any[]) => any;

/** Call fn once; later calls return the first result. */
function once<F extends AnyFn>(fn: F): F {
  // Your code here
  return fn;
}
`,
    solutionCode: `type AnyFn = (this: any, ...args: any[]) => any;

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
  "implement-group-by": {
    entry: "__judgeGroupBy",
    starterCode: `/** Map each key (iteratee function or property name) to its items, in input order. */
function groupBy<T>(array: T[], iteratee: ((item: T) => unknown) | string): Record<string, T[]> {
  // Your code here
  return {};
}
`,
    solutionCode: `function groupBy<T>(array: T[], iteratee: ((item: T) => unknown) | string): Record<string, T[]> {
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
};
