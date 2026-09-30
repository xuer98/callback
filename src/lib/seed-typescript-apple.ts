import type { JudgeLanguage } from "./types";

// TypeScript judge definitions for the Apple front-end bank
// (seed-apple-js-a.ts to seed-apple-js-c.ts; more are in
// seed-typescript-apple-b.ts and seed-typescript-splits.ts), merged into each problem's judge by the seed script
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
  "implement-array-map": {
    entry: "__judgeMap",
    starterCode: `interface Array<T> {
  myMap<U>(cb: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[];
}

/** Like Array.prototype.map: keeps holes, forwards thisArg. */
Array.prototype.myMap = function (this: unknown[], cb: Function, thisArg?: unknown): unknown[] {
  // Your code here
  return [];
};
`,
    solutionCode: `interface Array<T> {
  myMap<U>(cb: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[];
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
`,
    solutionCode: `type Task<T = unknown> = () => Promise<T>;

async function runInSequence<T>(tasks: Task<T>[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task()); // a rejection throws out; later tasks never start
  }
  return results;
}
`,
  },
  "map-async-limit": {
    entry: "__judgeMapAsyncLimit",
    starterCode: `/** Map every item through fn with at most \`size\` calls in flight; results in input order. */
function mapAsyncLimit<T, R>(
  items: Iterable<T>,
  fn: (item: T) => Promise<R>,
  size = Infinity,
): Promise<R[]> {
  // Your code here
  return Promise.resolve([]);
}
`,
    solutionCode: `async function mapAsyncLimit<T, R>(
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
  "promise-basics": {
    entry: "__judgeBasics",
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
