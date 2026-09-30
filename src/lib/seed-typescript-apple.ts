import type { JudgeLanguage } from "./types";

// TypeScript judge definitions for the Apple front-end bank
// (seed-apple-js-a.ts to seed-apple-js-c.ts; the rest are in
// seed-typescript-apple-b.ts), merged into each problem's judge by the seed script
// alongside seed-typescript.ts. TypeScript is type-stripped and judged as
// JavaScript through the same worker, so `entry` matches the JavaScript
// judge and the JavaScript driver runs unchanged.

export const appleTypescriptJudges: Record<string, JudgeLanguage> = {
  "implement-array-flat": {
    entry: "__judgeFlat",
    starterCode: `interface Array<T> {
  myFlat(depth?: number): unknown[];
}

/** Flatten this array up to \`depth\` levels, like the native flat. Don't call flat or flatMap. */
Array.prototype.myFlat = function (this: unknown[], depth = 1): unknown[] {
  // Your code here
  return [];
};
`,
    solutionCode: `interface Array<T> {
  myFlat(depth?: number): unknown[];
}

// Iterative, so 100,000 levels of nesting can't overflow the call stack.
Array.prototype.myFlat = function (this: unknown[], depth = 1): unknown[] {
  const out: unknown[] = [];
  const stack: [unknown, number][] = [];
  for (let i = this.length - 1; i >= 0; i--) {
    if (i in this) stack.push([this[i], depth]); // skip holes, as the native does
  }
  while (stack.length > 0) {
    const [value, d] = stack.pop()!;
    if (Array.isArray(value) && d > 0) {
      for (let i = value.length - 1; i >= 0; i--) {
        if (i in value) stack.push([value[i], d - 1]);
      }
    } else {
      out.push(value);
    }
  }
  return out;
};
`,
  },
  "array-method-polyfills": {
    entry: "__judgeArrayMethods",
    starterCode: `interface Array<T> {
  myMap<U>(cb: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[];
  myFilter(cb: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): T[];
  myReduce<U>(cb: (acc: U, value: T, index: number, array: T[]) => U, ...initial: [U?]): U;
  myConcat(...items: unknown[]): unknown[];
}

/** Like Array.prototype.map: keeps holes, forwards thisArg. */
Array.prototype.myMap = function (this: unknown[], cb: Function, thisArg?: unknown): unknown[] {
  // Your code here
  return [];
};

/** Like Array.prototype.filter: skips holes. */
Array.prototype.myFilter = function (this: unknown[], cb: Function, thisArg?: unknown): unknown[] {
  // Your code here
  return [];
};

/** Like Array.prototype.reduce: an initial value counts whenever it is passed. */
Array.prototype.myReduce = function (this: unknown[], cb: Function, ...rest: unknown[]): any {
  // Your code here
  return undefined;
};

/** Like Array.prototype.concat: spreads arrays one level. */
Array.prototype.myConcat = function (this: unknown[], ...items: unknown[]): unknown[] {
  // Your code here
  return [];
};
`,
    solutionCode: `interface Array<T> {
  myMap<U>(cb: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[];
  myFilter(cb: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): T[];
  myReduce<U>(cb: (acc: U, value: T, index: number, array: T[]) => U, ...initial: [U?]): U;
  myConcat(...items: unknown[]): unknown[];
}

type Callback = (this: unknown, ...args: any[]) => any;

function assertCallable(cb: unknown): asserts cb is Callback {
  if (typeof cb !== "function") throw new TypeError(String(cb) + " is not a function");
}

Array.prototype.myMap = function (this: unknown[], cb: unknown, thisArg?: unknown): unknown[] {
  assertCallable(cb);
  const len = this.length;
  const out: unknown[] = new Array(len); // pre-sized, so holes stay holes
  for (let i = 0; i < len; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this);
  }
  return out;
};

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
  "run-promises-in-sequence": {
    entry: "__judgeSequence",
    starterCode: `type Task<T = unknown> = () => Promise<T>;

/** Run each task after the previous one settles; results in task order. */
async function runInSequence<T>(tasks: Task<T>[]): Promise<T[]> {
  // Your code here
  return [];
}

/**
 * Drive a generator: wait for each yielded value, resume with the result,
 * throw rejections back in. Resolves with the generator's return value.
 */
function run<R>(genFn: () => Generator<unknown, R, any>): Promise<R> {
  // Your code here
  return Promise.resolve(undefined as R);
}
`,
    solutionCode: `type Task<T = unknown> = () => Promise<T>;

async function runInSequence<T>(tasks: Task<T>[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task()); // a rejection throws out; later tasks never start
  }
  return results;
}

function run<R>(genFn: () => Generator<unknown, R, any>): Promise<R> {
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
  "map-async-limit": {
    entry: "__judgeMapAsync",
    starterCode: `/** Map every item through fn at once; results in input order. */
function mapAsync<T, R>(items: Iterable<T>, fn: (item: T) => Promise<R>): Promise<R[]> {
  // Your code here
  return Promise.resolve([]);
}

/** Like mapAsync, with at most \`size\` calls in flight. */
function mapAsyncLimit<T, R>(
  items: Iterable<T>,
  fn: (item: T) => Promise<R>,
  size = Infinity,
): Promise<R[]> {
  // Your code here
  return Promise.resolve([]);
}
`,
    solutionCode: `function mapAsync<T, R>(items: Iterable<T>, fn: (item: T) => Promise<R>): Promise<R[]> {
  return Promise.all(Array.from(items, (item) => fn(item)));
}

async function mapAsyncLimit<T, R>(
  items: Iterable<T>,
  fn: (item: T) => Promise<R>,
  size = Infinity,
): Promise<R[]> {
  const list = Array.from(items);
  const results: R[] = new Array(list.length);
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed && next < list.length) {
      const i = next++; // synchronous between awaits, so no two workers share an index
      try {
        results[i] = await fn(list[i]);
      } catch (err) {
        failed = true; // no new calls after the first rejection
        throw err;
      }
    }
  };
  const count = Math.min(size, list.length);
  await Promise.all(Array.from({ length: count }, worker));
  return results;
}
`,
  },
  "promise-basics-and-helpers": {
    entry: "__judgePromises",
    starterCode: `/**
 * Settle 1,000 ms after the call: resolve "Data fetched successfully!",
 * or reject with new Error("Failed to fetch data.") when success is false.
 */
function fetchData(success = true): Promise<string> {
  // Your code here
  return Promise.resolve("");
}

/** Await fetchData(success); return the value, or the error's message. */
async function getData(success?: boolean): Promise<string> {
  // Your code here
  return "";
}

/** Like Promise.all, without calling it. */
function promiseAll<T>(iterable: Iterable<T | PromiseLike<T>>): Promise<T[]> {
  // Your code here
  return Promise.resolve([]);
}

/** Settle like promise within ms, else reject with new Error("Timed out after <ms> ms"). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  // Your code here
  return promise;
}
`,
    solutionCode: `function fetchData(success = true): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) resolve("Data fetched successfully!");
      else reject(new Error("Failed to fetch data."));
    }, 1000);
  });
}

async function getData(success?: boolean): Promise<string> {
  try {
    return await fetchData(success);
  } catch (err) {
    return (err as Error).message;
  }
}

function promiseAll<T>(iterable: Iterable<T | PromiseLike<T>>): Promise<T[]> {
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out after " + ms + " ms")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
`,
  },
  "inheritance-without-class": {
    entry: "__judgeInheritance",
    starterCode: `interface Polygon {
  height: number;
  width: number;
  area(): number;
}

interface Square extends Polygon {
  setSide(n: number): void;
}

/** A polygon with a height and a width; area() lives on the prototype. */
function Polygon(this: Polygon, height: number, width: number) {
  // Your code here
}

/** A square is a Polygon with equal sides; setSide(n) changes both. */
function Square(this: Square, side: number) {
  // Your code here
}
`,
    solutionCode: `interface Polygon {
  height: number;
  width: number;
  area(): number;
}

interface Square extends Polygon {
  setSide(n: number): void;
}

function Polygon(this: Polygon, height: number, width: number) {
  this.height = height;
  this.width = width;
}

Polygon.prototype.area = function (this: Polygon): number {
  return this.height * this.width;
};

function Square(this: Square, side: number) {
  Polygon.call(this, side, side); // super(side, side)
}

Square.prototype = Object.create(Polygon.prototype); // inherit the methods
Square.prototype.constructor = Square; // repair the link

Square.prototype.setSide = function (this: Square, n: number): void {
  this.height = this.width = n;
};
`,
  },
};
