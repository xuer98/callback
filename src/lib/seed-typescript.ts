import type { JudgeLanguage } from "./types";

// TypeScript judge definitions, keyed by problem slug, merged into each
// problem's judge as judge.typescript by the seed script. Tests are shared
// across languages.
//
// TypeScript is type-stripped (transpile-ts.ts) and then judged as
// JavaScript through the same worker, so `entry` and `driverCode` are the
// JavaScript judge's verbatim — plain JS, which is already valid TypeScript.
// Only the starter differs: the JSDoc types move into the signatures.

export const typescriptJudges: Record<string, JudgeLanguage> = {
  "pair-sum-sorted": {
    entry: "pairSum",
    starterCode: `/**
 * numbers is sorted ascending.
 * @returns indices [i, j] with i < j, or [-1, -1]
 */
function pairSum(numbers: number[], target: number): number[] {
  // Your code here
  return [-1, -1];
}
`,
  },
  "merge-intervals": {
    entry: "mergeIntervals",
    starterCode: `/**
 * intervals are [start, end] pairs, in any order.
 * @returns the merged intervals, sorted by start
 */
function mergeIntervals(intervals: number[][]): number[][] {
  // Your code here
  return intervals;
}
`,
  },
  "lru-cache": {
    entry: "__runOperations",
    starterCode: `class LRUCache {
  capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /** @returns the value, or -1 if absent */
  get(key: number): number {
    return -1;
  }

  put(key: number, value: number): void {
    // Your code here
  }
}
`,
    driverCode: `function __runOperations(operations, args) {
  let instance = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "LRUCache") {
      instance = new LRUCache(...args[i]);
      out.push(null);
    } else {
      out.push(instance[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
  },
  "course-schedule": {
    entry: "canFinish",
    starterCode: `/**
 * prerequisites [a, b] means b must come before a.
 * @returns true if all courses can be finished
 */
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  // Your code here
  return true;
}
`,
  },
  "max-width": {
    entry: "justify",
    starterCode: `/** @returns lines, each exactly maxWidth characters */
function justify(words: string[], maxWidth: number): string[] {
  // Your code here
  return [];
}
`,
  },
  "round-numeric-strings": {
    entry: "__dispatch",
    starterCode: `/**
 * Part 1: round one numeric string to the nearest integer, rounding
 * half away from zero. No leading zeros in the result, and never "-0".
 * Values can exceed any built-in numeric type — stay in string land.
 * @param s - e.g. "3.45", "-2.5", "999.5"
 */
function roundNumericString(s: string): string {
  // Your code here
  return s;
}

/**
 * Part 2: round every value in a comma-separated list.
 * @param csv - e.g. "2.5,-2.5,9.99"
 */
function roundAll(csv: string): string {
  // Your code here
  return csv;
}
`,
    driverCode: `function __dispatch(kind, value) {
  return kind === "csv" ? roundAll(value) : roundNumericString(value);
}`,
  },
  "violation-log-analyzer": {
    entry: "__runOperations",
    starterCode: `class ViolationLog {
  constructor() {
    // Your state here
  }

  /** @param timestamp - non-decreasing across calls */
  record(timestamp: number, userId: string, violationType: string): void {
    // Your code here
  }

  /** @returns violations by userId in (latest - window, latest] */
  countRecent(userId: string, window: number): number {
    return 0;
  }

  /** @returns top-k by all-time count, ties lexicographic */
  topK(k: number): [string, number][] {
    return [];
  }

  /** @returns true if userId ever had >= maxViolations in any window-second span */
  shouldBan(userId: string, maxViolations: number, window: number): boolean {
    return false;
  }
}
`,
    driverCode: `function __runOperations(operations, args) {
  let log = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "ViolationLog") {
      log = new ViolationLog(...args[i]);
      out.push(null);
    } else {
      out.push(log[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
  },
  "nested-set-equality": {
    entry: "nestedSetEqual",
    starterCode: `/** Integers and/or further nested sets, given as (nested) arrays. */
type NestedSet = (number | NestedSet)[];

/** @returns true when a and b are equal as sets, at every depth */
function nestedSetEqual(a: NestedSet, b: NestedSet): boolean {
  // Your code here
  return false;
}
`,
  },
  "assign-pins-shortest-columns": {
    entry: "assignPins",
    starterCode: `/**
 * @param heights - pin heights, in feed order
 * @param k - number of columns
 * @returns the column index assigned to each pin, in order
 */
function assignPins(heights: number[], k: number): number[] {
  // Your code here
  return [];
}
`,
  },
  "collect-reachable-pins": {
    entry: "collectReachablePins",
    starterCode: `/**
 * @param boards - board id -> pin ids on that board
 * @param start - starting board id
 * @returns every reachable pin id, sorted; [] if start is unknown
 */
function collectReachablePins(
  boards: Record<string, string[]>,
  start: string,
): string[] {
  // Your code here
  return [];
}
`,
  },
  "stream-line-reader": {
    entry: "__dispatch",
    starterCode: `class LineReader {
  /** @param readChunk - returns "" once the stream ends */
  constructor(readChunk: () => string) {
    // Your state here
  }

  /** @returns next line without the newline; null at end */
  readLine(): string | null {
    return null;
  }
}

/**
 * Part 2: lines are "payer,payee,amount" (amount is an integer).
 * @returns minimum number of transactions to settle all balances
 */
function settleFromStream(readChunk: () => string): number {
  // Your code here (use your LineReader)
  return 0;
}
`,
    driverCode: `function __dispatch(kind, chunks, cap) {
  let i = 0;
  const readChunk = () => (i < chunks.length ? chunks[i++] : "");
  if (kind === "settle") return settleFromStream(readChunk);
  const reader = new LineReader(readChunk);
  const out = [];
  for (let n = 0; n < cap; n++) {
    const line = reader.readLine();
    out.push(line);
    if (line === null) break;
  }
  return out;
}`,
  },
  "escape-room-leaderboard": {
    entry: "__runOperations",
    starterCode: `class Leaderboard {
  constructor() {
    // Your state here
  }

  /** Record an attempt; only improvements change the standings. */
  addResult(team: string, time: number): void {
    // Your code here
  }

  /** @returns 1-indexed rank by best time (ties alphabetical), or -1 */
  rank(team: string): number {
    return -1;
  }

  /** @returns the k best team names, in rank order */
  topK(k: number): string[] {
    return [];
  }
}
`,
    driverCode: `function __runOperations(operations, args) {
  let lb = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "Leaderboard") {
      lb = new Leaderboard(...args[i]);
      out.push(null);
    } else {
      out.push(lb[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
  },
  "rebalance-experiment-buckets": {
    entry: "__judgeRebalance",
    starterCode: `/**
 * @param current - per-bucket group, null = unassigned
 * @param targets - desired bucket count per group
 * @returns new assignment meeting targets exactly, changing as few
 *   buckets as possible
 */
function rebalanceBuckets(
  current: (string | null)[],
  targets: Record<string, number>,
): (string | null)[] {
  // Your code here
  return current;
}
`,
    driverCode: `function __judgeRebalance(current, targets) {
  const result = rebalanceBuckets(current.slice(), { ...targets });
  if (!Array.isArray(result) || result.length !== current.length) {
    return { validShape: false };
  }
  const counts = {};
  for (const g of result) {
    if (g !== null) counts[g] = (counts[g] ?? 0) + 1;
  }
  const targetsMet =
    Object.keys(targets).every((g) => (counts[g] ?? 0) === targets[g]) &&
    Object.keys(counts).every((g) => g in targets);
  let changes = 0;
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== result[i]) changes++;
  }
  return { targetsMet, changes };
}`,
  },
  "list-unallocated-buckets": {
    entry: "unallocatedRanges",
    starterCode: `/**
 * @param n - bucket space is [0, n)
 * @param allocated - inclusive ranges, any order, possibly overlapping
 *   or partly out of bounds (clamp)
 * @returns minimal sorted list of free inclusive ranges
 */
function unallocatedRanges(
  n: number,
  allocated: [number, number][],
): [number, number][] {
  // Your code here
  return [];
}
`,
  },
  "adjustable-id-allocator": {
    entry: "__runOperations",
    starterCode: `class IDAllocator {
  /** @param capacity - IDs live in [0, capacity) */
  constructor(capacity: number) {
    // Your state here
  }

  /** @returns smallest available ID, or -1 if none */
  allocate(): number {
    return -1;
  }

  /** @returns true only if id was currently allocated */
  release(id: number): boolean {
    return false;
  }

  /** Adjust capacity up or down; already-issued IDs stay valid. */
  setCapacity(c: number): void {
    // Your code here
  }
}
`,
    driverCode: `function __runOperations(operations, args) {
  let a = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "IDAllocator") {
      a = new IDAllocator(...args[i]);
      out.push(null);
    } else {
      out.push(a[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
  },
  "flag-spam-numbers": {
    entry: "flagSpamNumbers",
    starterCode: `/**
 * @param callLog - [caller, callee] pairs
 * @param reports - [reporter, number] pairs
 * @param minReports - distinct valid reporters needed to flag
 * @returns flagged numbers, sorted
 */
function flagSpamNumbers(
  callLog: [string, string][],
  reports: [string, string][],
  minReports: number,
): string[] {
  // Your code here
  return [];
}
`,
  },
  "sparse-matrix-operations": {
    entry: "__judgeSparse",
    starterCode: `class SparseMatrix {
  nRows: number;
  nCols: number;

  constructor(nRows: number, nCols: number) {
    this.nRows = nRows;
    this.nCols = nCols;
    // Your storage here
  }

  static fromDense(dense: number[][]): SparseMatrix {
    // Your code here
    return new SparseMatrix(dense.length, dense[0]?.length ?? 0);
  }

  get(r: number, c: number): number {
    return 0;
  }

  /** Storing 0 must remove the entry. */
  set(r: number, c: number, v: number): void {
    // Your code here
  }

  /** Throws on dimension mismatch. */
  add(other: SparseMatrix): SparseMatrix {
    // Your code here
    return this;
  }

  /** Throws on dimension mismatch. */
  multiply(other: SparseMatrix): SparseMatrix {
    // Your code here
    return this;
  }

  toDense(): number[][] {
    return [];
  }

  /** @returns count of stored nonzero entries */
  nnz(): number {
    return 0;
  }
}
`,
    driverCode: `function __judgeSparse(op, denseA, denseB, extra) {
  const a = SparseMatrix.fromDense(denseA);
  if (op === "get") return a.get(...extra);
  if (op === "set") {
    a.set(...extra);
    return { dense: a.toDense(), nnz: a.nnz() };
  }
  const b = SparseMatrix.fromDense(denseB);
  let out;
  try {
    out = op === "add" ? a.add(b) : a.multiply(b);
  } catch {
    return "error";
  }
  return { dense: out.toDense(), nnz: out.nnz() };
}`,
  },
  "nearest-eligible-elevator": {
    entry: "selectElevator",
    starterCode: `interface Elevator {
  id: number;
  floor: number;
  direction: "up" | "down" | "idle";
  /** floors this elevator stops at */
  serviced: number[];
}

/**
 * @param floor - hail floor
 * @param direction - hailed direction
 * @returns nearest eligible elevator id (ties -> lowest id), or -1
 */
function selectElevator(
  elevators: Elevator[],
  floor: number,
  direction: "up" | "down",
): number {
  // Your code here
  return -1;
}
`,
  },
  "subsequence-expression-target": {
    entry: "canReachTarget",
    starterCode: `/**
 * @param nums - positive integers
 * @returns true if some subsequence with + and * (standard precedence)
 *   evaluates exactly to target
 */
function canReachTarget(nums: number[], target: number): boolean {
  // Your code here
  return false;
}
`,
  },
  "cleaning-robot-coverage": {
    entry: "robotCoverage",
    starterCode: `/**
 * @param grid - rows of '.' (open) and '#' (obstacle)
 * @param start - [row, col], guaranteed open
 * @returns [cleanableCells, restCells]
 */
function robotCoverage(
  grid: string[],
  start: [number, number],
): [number, number] {
  // Your code here
  return [0, 0];
}
`,
  },
  "warehouse-boxes": {
    entry: "maxBoxes",
    starterCode: `/**
 * @param heights - room ceilings, entrance at index 0
 * @param boxes - box heights, any insertion order allowed
 * @returns maximum number of boxes that can be stored
 */
function maxBoxes(heights: number[], boxes: number[]): number {
  // Your code here
  return 0;
}
`,
  },
  "mark-and-compact-subtree": {
    entry: "__judgeMarkCompact",
    starterCode: `/**
 * @param heapArray - implicit binary tree; null = no node
 * @param k - root index of the subtree to collect
 * @returns [newArray, remap] where remap maps each survivor's old index
 *   to its new index
 */
function markAndCompact(
  heapArray: (string | null)[],
  k: number,
): [string[], Record<number, number>] {
  // Your code here
  return [[], {}];
}
`,
    driverCode: `function __judgeMarkCompact(heapArray, k) {
  const result = markAndCompact(heapArray.slice(), k);
  if (!Array.isArray(result) || result.length !== 2) {
    return { validShape: false };
  }
  return { newArray: result[0], remap: result[1] };
}`,
  },
  "single-tab-browser-history": {
    entry: "solution",
    starterCode: `type OpArgs = [string] | [number];

function solution(operations: string[], args: OpArgs[]): unknown[] {
  class BrowserSession {
    constructor(homepage: string) {
      // TODO: initialize history at homepage
    }

    visit(url: string): void {
      // TODO: navigate to url, clearing forward history
    }

    back(steps: number): string {
      // TODO: move up to steps pages back, return current url
      return "";
    }

    forward(steps: number): string {
      // TODO: move up to steps pages forward, return current url
      return "";
    }

    haveVisited(url: string): boolean {
      // TODO: has url ever been visited?
      return false;
    }
  }

  let obj: BrowserSession | null = null;
  const res: unknown[] = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const arg = args[i];
    if (op === "BrowserSession") {
      obj = new BrowserSession(arg[0] as string);
      res.push(null);
    } else if (op === "visit") {
      obj!.visit(arg[0] as string);
      res.push(null);
    } else if (op === "back") {
      res.push(obj!.back(arg[0] as number));
    } else if (op === "forward") {
      res.push(obj!.forward(arg[0] as number));
    } else if (op === "haveVisited") {
      res.push(obj!.haveVisited(arg[0] as string));
    }
  }
  return res;
}
`,
  },
};
