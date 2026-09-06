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
  "implement-debounce": {
    entry: "__runDebounceScenario",
    starterCode: `type AnyFn = (...args: any[]) => void;

/** Delays fn until wait ms of quiet; .cancel() drops a pending call. */
function debounce(fn: AnyFn, wait: number): AnyFn & { cancel(): void } {
  // Your code here
  return Object.assign((...args: any[]) => fn(...args), { cancel() {} });
}
`,
  },
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
    starterCode: `class EscapeRoomGame {
  /** playerIds fixes the room-0 tie order; rooms run 0..maxRoom. */
  constructor(playerIds: number[], maxRoom: number) {
    // Your state here
  }

  /** Move the player forward one room; at the last room, a no-op. O(1). */
  advance(playerId: number): void {
    // Your code here
  }

  /** The player's current room. O(1). */
  getRoom(playerId: number): number {
    return -1;
  }

  /** Up to k ids: room desc, ties by earliest entry. O(N + k). */
  leaderboard(k: number): number[] {
    return [];
  }
}
`,
    driverCode: `function __runOperations(operations, args) {
  let game = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "EscapeRoomGame") {
      game = new EscapeRoomGame(...args[i]);
      out.push(null);
    } else {
      out.push(game[operations[i]](...args[i]) ?? null);
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
  "design-adjustable-id-allocator": {
    entry: "__runAllocatorCase",
    starterCode: `type Bucket = [name: string, start: number, end: number];

/**
 * Pack (name, size) requests into [0, 999] from ID 0, preserving order.
 * A zero-size bucket packs as [name, -1, -1] and doesn't advance the
 * cursor. Throw on a negative size, or when the sizes sum past 1000.
 */
function packBuckets(requests: [string, number][]): Bucket[] {
  // Your code here
  return [];
}

/**
 * Resize one bucket of a packed layout to exactly newSize IDs. The target
 * keeps its start; later buckets shift by the delta. Must NOT mutate
 * \`buckets\` when the resize is rejected. Throw on an unknown name, a
 * negative size, or a layout past 1000 IDs.
 */
function resizeBuckets(
  buckets: Bucket[],
  name: string,
  newSize: number,
): Bucket[] {
  // Your code here
  return buckets;
}
`,
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

  // -- Airbnb frontend bank -------------------------------------------------
  // Typed starters and reference implementations; the JavaScript drivers judge
  // the type-stripped output.
  "store-data-change-listeners": {
    entry: "__runOperations",
    starterCode: `type Listener<V> = (oldValue: V | undefined, newValue: V | undefined, key: string) => void;

class StoreData<V = unknown> {
  constructor() {
    // Your state here
  }

  /** The current value, or undefined. */
  get(key: string): V | undefined {
    return undefined;
  }

  has(key: string): boolean {
    return false;
  }

  /** Alias of set. Fires change events only when the value actually changes; returns this. */
  add(key: string, value: V): this {
    return this;
  }

  set(key: string, value: V): this {
    return this.add(key, value);
  }

  /** Alias of unset. Soft delete; true if something was removed. */
  remove(key: string): boolean {
    return false;
  }

  unset(key: string): boolean {
    return this.remove(key);
  }

  /** Returns an unsubscribe function. */
  on(event: string, callback: Listener<V>): () => void {
    return () => {};
  }

  once(event: string, callback: Listener<V>): () => void {
    return () => {};
  }

  off(event: string, callback?: Listener<V>): void {}

  toJSON(): Record<string, V> {
    return {};
  }
}
`,
    solutionCode: `type Listener<V> = (oldValue: V | undefined, newValue: V | undefined, key: string) => void;

// StoreData — a Backbone.Model-style key/value store with change listeners.
// Events accepted by on(): 'change:name' | 'name' (same thing), 'change' (any key), 'unset'.
class StoreData<V = unknown> {
  #attrs = new Map<string, { value: V; deleted: boolean }>();   // deleted = soft-delete tombstone
  #listeners = new Map<string, Set<Listener<V>>>();

  // Normalize every accepted event spelling to one internal key. Attribute
  // events are namespaced so a key literally called "change" can't collide.
  static #eventKey(event: string): string {
    if (event === 'change' || event === 'unset') return event;
    const name = event.startsWith('change:') ? event.slice('change:'.length) : event;
    return \`attr:\${name}\`;
  }

  get(key: string): V | undefined {
    const rec = this.#attrs.get(key);
    return rec && !rec.deleted ? rec.value : undefined;
  }

  has(key: string): boolean {
    const rec = this.#attrs.get(key);
    return rec !== undefined && !rec.deleted;
  }

  // add === set. Fires change events only when the value actually changes.
  add(key: string, value: V): this {
    const rec = this.#attrs.get(key);
    const live = rec !== undefined && !rec.deleted ? rec : undefined;
    if (live && Object.is(live.value, value)) return this;   // no-op, no events
    this.#attrs.set(key, { value, deleted: false });
    this.#emitChange(key, live?.value, value);
    return this;
  }
  set(key: string, value: V): this { return this.add(key, value); }

  // remove === unset. Soft delete: keep a tombstone so the old value is still
  // available to listeners / audit, and \`has\` reports false.
  remove(key: string): boolean {
    const rec = this.#attrs.get(key);
    if (!rec || rec.deleted) return false;
    rec.deleted = true;
    this.#emitChange(key, rec.value, undefined);
    this.#fire('unset', rec.value, undefined, key);
    return true;
  }
  unset(key: string): boolean { return this.remove(key); }

  on(event: string, callback: Listener<V>): () => void {
    const k = StoreData.#eventKey(event);
    let set = this.#listeners.get(k);
    if (!set) {
      set = new Set();
      this.#listeners.set(k, set);
    }
    set.add(callback);
    return () => this.off(event, callback);   // unsubscribe handle
  }

  once(event: string, callback: Listener<V>): () => void {
    const off = this.on(event, (...args) => { off(); callback(...args); });
    return off;
  }

  off(event: string, callback?: Listener<V>): void {
    const set = this.#listeners.get(StoreData.#eventKey(event));
    if (!set) return;
    if (callback) set.delete(callback); else set.clear();
  }

  toJSON(): Record<string, V> {
    const out: Record<string, V> = {};
    for (const [k, rec] of this.#attrs) if (!rec.deleted) out[k] = rec.value;
    return out;
  }

  #emitChange(key: string, oldValue: V | undefined, newValue: V | undefined): void {
    this.#fire(\`attr:\${key}\`, oldValue, newValue, key);   // change:key listeners
    this.#fire('change', oldValue, newValue, key);        // global listeners
  }

  #fire(k: string, oldValue: V | undefined, newValue: V | undefined, key: string): void {
    const set = this.#listeners.get(k);
    if (!set) return;
    for (const cb of [...set]) {            // copy: a listener may unsubscribe mid-loop
      try { cb(oldValue, newValue, key); }
      catch (err) { console.error(err); }   // one bad listener must not break the others
    }
  }
}
`,
  },
  "implement-promise": {
    entry: "__runPromiseScenario",
    starterCode: `type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;

class MyPromise<T> {
  constructor(executor: (resolve: Resolve<T>, reject: Reject) => void) {
    // Your state here: 'pending' | 'fulfilled' | 'rejected', the value, queued handlers
  }

  /** Always returns a new MyPromise; callbacks run in a microtask. */
  then<U = T, R = never>(
    onFulfilled?: (value: T) => U | PromiseLike<U>,
    onRejected?: (reason: unknown) => R | PromiseLike<R>,
  ): MyPromise<U | R> {
    return new MyPromise<U | R>(() => {});
  }

  catch<R = never>(onRejected?: (reason: unknown) => R | PromiseLike<R>): MyPromise<T | R> {
    return this.then(undefined, onRejected);
  }

  finally(onFinally: () => unknown): MyPromise<T> {
    return this;
  }

  static resolve<U>(value: U | PromiseLike<U>): MyPromise<U> {
    return new MyPromise<U>((resolve) => resolve(value));
  }

  static reject<U = never>(reason: unknown): MyPromise<U> {
    return new MyPromise<U>((_, reject) => reject(reason));
  }

  static all<U>(iterable: Iterable<U | PromiseLike<U>>): MyPromise<U[]> {
    return new MyPromise<U[]>(() => {});
  }
}

/** Bonus: executor(resolve, reject, onAbort); abort() runs the cleanup and rejects with an AbortError. */
class AbortablePromise<T> extends MyPromise<T> {
  abort(): void {}
}
`,
    solutionCode: `type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;
type Handler<T> = {
  onFulfilled: ((value: T) => unknown) | undefined;
  onRejected: ((reason: unknown) => unknown) | undefined;
  resolve: Resolve<unknown>;
  reject: Reject;
};

// MyPromise — Promises/A+-shaped implementation: states, then-chaining,
// thenable adoption, async (microtask) callbacks, catch/finally, resolve/reject/all.
class MyPromise<T> {
  #state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
  #value: unknown = undefined;
  #handlers: Handler<T>[] = [];

  constructor(executor: (resolve: Resolve<T>, reject: Reject) => void) {
    let called = false;                              // resolve/reject may only win once
    const resolve: Resolve<T> = (value) => { if (!called) { called = true; this.#resolve(value); } };
    const reject: Reject = (reason) => { if (!called) { called = true; this.#settle('rejected', reason); } };
    try { executor(resolve, reject); } catch (err) { reject(err); }
  }

  // Resolution procedure: unwrap thenables (including other MyPromises).
  #resolve(value: unknown): void {
    if (value === this) return this.#settle('rejected', new TypeError('Chaining cycle detected'));
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      let then: unknown;
      try { then = (value as { then?: unknown }).then; } catch (err) { return this.#settle('rejected', err); }
      if (typeof then === 'function') {
        let called = false;
        try {
          (then as (onF: (v: unknown) => void, onR: (r: unknown) => void) => void).call(
            value,
            (v) => { if (!called) { called = true; this.#resolve(v); } },
            (r) => { if (!called) { called = true; this.#settle('rejected', r); } },
          );
        } catch (err) {
          if (!called) { called = true; this.#settle('rejected', err); }
        }
        return;
      }
    }
    this.#settle('fulfilled', value);
  }

  #settle(state: 'fulfilled' | 'rejected', value: unknown): void {
    if (this.#state !== 'pending') return;
    this.#state = state;
    this.#value = value;
    this.#flush();
  }

  // Run queued handlers asynchronously (microtask), never synchronously.
  #flush(): void {
    if (this.#state === 'pending') return;
    const handlers = this.#handlers;
    this.#handlers = [];
    for (const h of handlers) queueMicrotask(() => this.#run(h));
  }

  #run({ onFulfilled, onRejected, resolve, reject }: Handler<T>): void {
    const cb = this.#state === 'fulfilled' ? onFulfilled : onRejected;
    if (typeof cb !== 'function') {                   // no handler: pass value/reason through
      return this.#state === 'fulfilled' ? resolve(this.#value) : reject(this.#value);
    }
    try { resolve((cb as (v: unknown) => unknown)(this.#value)); } catch (err) { reject(err); }
  }

  then<U = T, R = never>(
    onFulfilled?: (value: T) => U | PromiseLike<U>,
    onRejected?: (reason: unknown) => R | PromiseLike<R>,
  ): MyPromise<U | R> {
    return new MyPromise<U | R>((resolve, reject) => {
      this.#handlers.push({ onFulfilled, onRejected, resolve: resolve as Resolve<unknown>, reject });
      this.#flush();                                   // already settled? schedule now
    });
  }

  catch<R = never>(onRejected?: (reason: unknown) => R | PromiseLike<R>): MyPromise<T | R> {
    return this.then(undefined, onRejected);
  }

  finally(onFinally: () => unknown): MyPromise<T> {
    return this.then(
      (v) => MyPromise.resolve(onFinally()).then(() => v),
      (r) => MyPromise.resolve(onFinally()).then(() => { throw r; }),
    );
  }

  static resolve<U>(v: U | PromiseLike<U>): MyPromise<U> {
    return v instanceof MyPromise ? (v as MyPromise<U>) : new MyPromise<U>((res) => res(v));
  }
  static reject<U = never>(r: unknown): MyPromise<U> { return new MyPromise<U>((_, rej) => rej(r)); }

  static all<U>(iterable: Iterable<U | PromiseLike<U>>): MyPromise<U[]> {
    return new MyPromise<U[]>((resolve, reject) => {
      const items = [...iterable];
      const results = new Array<U>(items.length);
      let remaining = items.length;
      if (remaining === 0) return resolve(results);
      items.forEach((item, i) => {
        MyPromise.resolve(item).then((v) => {
          results[i] = v;                              // keep input order, not completion order
          if (--remaining === 0) resolve(results);
        }, reject);                                    // first rejection wins
      });
    });
  }
}

// Bonus follow-up: an abortable promise. Native promises are not cancellable —
// cancellation lives in the *work* (AbortController), and the promise just rejects.
class AbortablePromise<T> extends MyPromise<T> {
  abort: (reason?: Error) => void;

  constructor(
    executor: (resolve: Resolve<T>, reject: Reject, onAbort: (cleanup: () => void) => void) => void,
  ) {
    let rejectRef: Reject = () => {};
    let cleanup: () => void = () => {};
    super((resolve, reject) => {
      rejectRef = reject;
      executor(resolve, reject, (onAbort) => { cleanup = onAbort; });
    });
    this.abort = (reason = Object.assign(new Error('Aborted'), { name: 'AbortError' })) => {
      cleanup();           // e.g. clearTimeout / controller.abort()
      rejectRef(reason);   // no-op if already settled
    };
  }
}
`,
  },
  "debounce-cancel-flush-throttle": {
    entry: "__runTimingScenario",
    starterCode: `type Debounced<A extends unknown[]> = ((this: unknown, ...args: A) => void) & {
  cancel(): void;
  flush(): void;
};

/** Trailing-edge debounce with .cancel() and .flush(). */
function debounceWithControls<A extends unknown[]>(
  fn: (this: unknown, ...args: A) => void,
  wait: number,
): Debounced<A> {
  // Your code here
  const debounced = function (this: unknown, ...args: A) {
    fn.apply(this, args);
  } as Debounced<A>;
  debounced.cancel = () => {};
  debounced.flush = () => {};
  return debounced;
}

/** Leading call, then at most one call per wait ms, with a trailing call carrying the latest args. */
function throttle<A extends unknown[]>(fn: (this: unknown, ...args: A) => void, wait: number) {
  return function throttled(this: unknown, ...args: A): void {
    fn.apply(this, args);
  };
}
`,
    solutionCode: `// Debounce: run fn only after calls have stopped for \`wait\` ms (trailing edge).
function debounce<A extends unknown[]>(fn: (this: unknown, ...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function debounced(this: unknown, ...args: A): void {   // function, not arrow: keep caller's \`this\`
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}

type Debounced<A extends unknown[]> = ((this: unknown, ...args: A) => void) & {
  cancel(): void;
  flush(): void;
};

// Debounce II: adds cancel() (drop the pending call) and flush() (run it now).
function debounceWithControls<A extends unknown[]>(
  fn: (this: unknown, ...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: A | undefined;
  let pendingThis: unknown;

  const invoke = () => {
    timer = null;
    const args = pendingArgs as A;
    const ctx = pendingThis;
    pendingArgs = undefined;
    pendingThis = undefined;
    fn.apply(ctx, args);
  };

  const debounced = function (this: unknown, ...args: A) {
    pendingArgs = args;
    pendingThis = this;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(invoke, wait);
  } as Debounced<A>;

  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pendingArgs = undefined;
    pendingThis = undefined;
  };

  debounced.flush = () => {
    if (timer !== null) {                    // only if something is pending
      clearTimeout(timer);
      invoke();
    }
  };

  return debounced;
}

// Throttle: run at most once per \`wait\` ms (leading call + trailing call with latest args).
function throttle<A extends unknown[]>(fn: (this: unknown, ...args: A) => void, wait: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | undefined;
  let lastThis: unknown;
  return function throttled(this: unknown, ...args: A): void {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      last = now;
      fn.apply(this, args);
    } else if (timer === null) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(lastThis, lastArgs as A);
      }, remaining);
    }
  };
}
`,
  },
  "input-validation-rules": {
    entry: "__judgeValidation",
    starterCode: `// Validators return an error message, or null when the value passes.
type Validator = (value: unknown) => string | null;

const rules = {
  required: (msg = "Required"): Validator => (value) => null,
  minLength: (n: number, msg = \`Must be at least \${n} characters\`): Validator => (value) => null,
  pattern: (re: RegExp, msg = "Invalid format"): Validator => (value) => null,
  email: (msg = "Enter a valid email"): Validator => (value) => null,
  range: (min: number, max: number, msg = \`Must be between \${min} and \${max}\`): Validator => (value) => null,
};

/** The first failing rule's message per field; {} when valid. */
function validate(values: Record<string, unknown>, schema: Record<string, Validator[]>): Record<string, string> {
  // Your code here
  return {};
}
`,
    solutionCode: `// Input validation: declarative rules → { fieldName: firstErrorMessage }.
// Rules run in order; the first failing rule is the message shown (one error per field, not five).
type Validator = (value: unknown) => string | null;

const pattern = (re: RegExp, msg = 'Invalid format'): Validator => (v) => (re.test(String(v)) ? null : msg);

const rules = {
  required: (msg = 'Required'): Validator => (v) => (String(v ?? '').trim() === '' ? msg : null),
  minLength: (n: number, msg = \`Must be at least \${n} characters\`): Validator => (v) => (String(v).length < n ? msg : null),
  pattern,
  email: (msg = 'Enter a valid email'): Validator => pattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, msg),
  range: (min: number, max: number, msg = \`Must be between \${min} and \${max}\`): Validator => (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? null : msg;
  },
};

function validate(values: Record<string, unknown>, schema: Record<string, Validator[]>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const message = rule(values[field]);
      if (message) { errors[field] = message; break; }
    }
  }
  return errors;                    // {} means valid
}

// Example schema for a listing form:
const listingSchema: Record<string, Validator[]> = {
  title: [rules.required(), rules.minLength(3)],
  email: [rules.required(), rules.email()],
  guests: [rules.required(), rules.range(1, 16)],
};
`,
  },
  "in-memory-file-system": {
    entry: "__runOperations",
    starterCode: `class FileSystem {
  constructor() {
    // Your state here — a tree of nodes keyed by path segment
  }

  /** true if created; false if the path already exists; throws when the parent is missing. */
  create(path: string, value?: unknown): boolean {
    return false;
  }

  /** The node's value, or undefined when the path doesn't exist. */
  get(path: string): unknown {
    return undefined;
  }

  /** Overwrite the node's value; throws when the path doesn't exist. */
  set(path: string, value: unknown): void {}

  /** Child names, sorted; [] for a missing path. */
  list(path = ""): string[] {
    return [];
  }
}
`,
    solutionCode: `interface FsNode {
  children: Map<string, FsNode>;
  value: unknown;
}

// In-memory file system: create(path) / get(path) / set(path, value) / list(path)
// Paths look like "a/b/c". Tree of nodes; each node may hold a value and children.
class FileSystem {
  #root: FsNode = { children: new Map(), value: undefined };

  #walk(path: string, { create = false }: { create?: boolean } = {}): FsNode | null {
    let node = this.#root;
    for (const part of path.split('/').filter(Boolean)) {
      let next = node.children.get(part);
      if (!next) {
        if (!create) return null;
        next = { children: new Map(), value: undefined };
        node.children.set(part, next);
      }
      node = next;
    }
    return node;
  }

  // Create a path; parent must exist (like \`mkdir\` without -p). Returns false if it exists already.
  create(path: string, value: unknown = undefined): boolean {
    const parts = path.split('/').filter(Boolean);
    const parent = this.#walk(parts.slice(0, -1).join('/'));
    if (!parent) throw new Error(\`Parent of "\${path}" does not exist\`);
    const name = parts[parts.length - 1];
    if (parent.children.has(name)) return false;
    parent.children.set(name, { children: new Map(), value });
    return true;
  }

  get(path: string): unknown {
    const node = this.#walk(path);
    return node ? node.value : undefined;
  }

  set(path: string, value: unknown): void {
    const node = this.#walk(path);
    if (!node) throw new Error(\`"\${path}" does not exist\`);
    node.value = value;
  }

  list(path = ''): string[] {
    const node = this.#walk(path);
    return node ? [...node.children.keys()].sort() : [];
  }
}
`,
  },
  "pour-water": {
    entry: "__judgeWater",
    starterCode: `/** Rows from the top down (height max(water)), joined by "\\n": "#" ground, "~" water, " " air. */
function printTerrain(heights: number[], water: number[]): string {
  return "";
}

/** Final heights after dropping volume units at index k, one unit at a time. */
function pourWater(heights: number[], volume: number, k: number): number[] {
  return heights;
}
`,
    solutionCode: `// Pour Water (LeetCode 755, Airbnb-tagged)
// heights[i] = terrain height; drop \`volume\` units at index k, one unit at a time.
// Each unit tries to move LEFT to a strictly lower final resting spot, then RIGHT, else stays.
function pourWater(heights: number[], volume: number, k: number): number[] {
  const h = [...heights];
  for (let v = 0; v < volume; v++) {
    let landed = false;
    for (const dir of [-1, 1]) {                // left first, then right
      let best = k;
      let i = k;
      while (i + dir >= 0 && i + dir < h.length && h[i + dir] <= h[i]) {
        i += dir;
        if (h[i] < h[best]) best = i;           // lowest point reachable without climbing
      }
      if (best !== k) { h[best]++; landed = true; break; }
    }
    if (!landed) h[k]++;
  }
  return h;
}

// Follow-up that was reported alongside it: print the terrain + water as ASCII rows.
function printTerrain(heights: number[], water: number[]): string {
  const top = Math.max(...water);
  const rows: string[] = [];
  for (let level = top; level >= 1; level--) {
    rows.push(heights.map((ground, i) => (level <= ground ? '#' : level <= water[i] ? '~' : ' ')).join(''));
  }
  return rows.join('\\n');
}
`,
  },

  // -- Airbnb bank, string / async wildcards --------------------------------
  "boxed-sentence": {
    entry: "__judgeBox",
    starterCode: `/** Greedy word wrap: never split a word; a line never starts with punctuation. */
function wrapWords(sentence: string, width: number): string[] {
  // Your code here
  return [sentence];
}

/** One sentence in a box, wrapped at width. */
function renderBox(sentence: string, width: number): string {
  return "";
}

interface Block {
  text: string;
  width: number;
}

/** Bonus: several sentences, each with its own wrap width, in one aligned box. */
function renderMultiBox(blocks: Block[]): string {
  return "";
}
`,
    solutionCode: `// Word wrap → boxed sentence (phone screen, Aug 2026; FE onsite 2016 as "text justification")
// Greedy: append words while they fit; never split a word; a line never starts with punctuation.
const LEADING_PUNCT = /^[.,;:!?]/;

function wrapWords(sentence: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of sentence.split(/\\s+/).filter(Boolean)) {
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width || LEADING_PUNCT.test(word)) line += \` \${word}\`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

// Part 1/2: one sentence in a box, wrapped at \`width\`.
function renderBox(sentence: string, width: number): string {
  const rule = \`+\${'-'.repeat(width + 2)}+\`;
  const body = wrapWords(sentence, width).map((l) => \`| \${l.padEnd(width)} |\`);
  return [rule, ...body, rule].join('\\n');
}

interface Block {
  text: string;
  width: number;
}

// Part 3 (bonus): several sentences, each with its OWN wrap width, inside one aligned outer box.
function renderMultiBox(blocks: Block[]): string {
  const inner = Math.max(...blocks.map((b) => b.width));
  const rule = \`+\${'-'.repeat(inner + 2)}+\`;
  const out = [rule];
  blocks.forEach((b, i) => {
    if (i > 0) out.push(\`| \${'-'.repeat(inner)} |\`);              // separator between sentences
    wrapWords(b.text, b.width).forEach((l) => out.push(\`| \${l.padEnd(inner)} |\`));
  });
  out.push(rule);
  return out.join('\\n');
}
`,
  },
  "parse-query-string": {
    entry: "parseQuery",
    starterCode: `type Scalar = string | true;
type QueryValue = Scalar | Scalar[];

/**
 * "?a=b&c=d" -> { a: "b", c: "d" }. A bare key is true; a repeated key becomes
 * an array; percent-decode after splitting; drop the #fragment; no "?" -> {}.
 */
function parseQuery(url: string): Record<string, QueryValue> {
  // Your code here
  return {};
}
`,
    solutionCode: `type Scalar = string | true;
type QueryValue = Scalar | Scalar[];

// URL query-string parser (phone screen, Aug 2026)
// ?a=b&c=d → {a:'b', c:'d'}; bare key → true; repeated key → array; percent-decoding after splitting.
const decode = (s: string): string => {
  try { return decodeURIComponent(s.replace(/\\+/g, ' ')); } catch { return s; }
};

function parseQuery(url: string): Record<string, QueryValue> {
  const q = url.indexOf('?');
  if (q === -1) return {};
  const query = url.slice(q + 1).split('#')[0];                       // drop the fragment
  const out: Record<string, QueryValue> = {};
  for (const part of query.split('&')) {
    if (!part) continue;                                              // trailing "&" / "&&" are no-ops
    const eq = part.indexOf('=');
    const key = decode(eq === -1 ? part : part.slice(0, eq));         // decode AFTER splitting on & and =
    const value: Scalar = eq === -1 ? true : decode(part.slice(eq + 1));
    const existing = out[key];
    if (existing === undefined) out[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else out[key] = [existing, value];
  }
  return out;
}
`,
  },
  "review-token-tagging": {
    entry: "tagTokens",
    starterCode: `/**
 * Wrap each case-insensitive occurrence of a token as [label]{original text}.
 * Multi-word tokens match across a space; the longest match wins at an offset.
 */
function tagTokens(review: string, tokens: Record<string, string>): string {
  // Your code here
  return review;
}
`,
    solutionCode: `// Review token tagging (senior phone screen, Aug 2026)
// Wrap each case-insensitive occurrence of a token as [label]{original text}; multi-word tokens
// match across whitespace; longest match wins at a given offset. Trie over lowercased tokens.
interface TrieNode {
  children: Map<string, TrieNode>;
  label?: string;                                                   // set on a token's last character
}

function tagTokens(review: string, tokens: Record<string, string>): string {
  const root: TrieNode = { children: new Map() };
  for (const [token, label] of Object.entries(tokens)) {
    let node = root;
    for (const ch of token.toLowerCase()) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map() };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.label = label;
  }

  const lower = review.toLowerCase();
  let out = '';
  let i = 0;
  while (i < lower.length) {
    let node = root;
    let best: { end: number; label: string } | null = null;
    for (let j = i; j < lower.length; j++) {
      const next = node.children.get(lower[j]);
      if (!next) break;
      node = next;
      if (node.label !== undefined) best = { end: j + 1, label: node.label };   // keep going → longest match
    }
    if (best) { out += \`[\${best.label}]{\${review.slice(i, best.end)}}\`; i = best.end; }
    else { out += review[i]; i++; }
  }
  return out;
}
`,
  },
  "retry-wrapper": {
    entry: "__runRetryScenario",
    starterCode: `/** A backoff strategy: the delay in ms before the retry after attempt (0-based). */
type Backoff = (attempt: number) => number;

const backoff = {
  fixed: (ms: number): Backoff => () => ms,
  linear: (ms: number): Backoff => (attempt) => 0,
  exponential: (base: number, cap = 30_000): Backoff => (attempt) => 0,
  /** Jitter spreads synchronized retries: delay * [0.5, 1.5). */
  exponentialJitter: (base: number, cap = 30_000, random: () => number = Math.random): Backoff => (attempt) => 0,
};

interface RetryOptions {
  maxAttempts?: number;
  backoff?: Backoff;
  isRetryable?: (err: unknown) => boolean;
  onAttempt?: (attempt: number) => void;
  onFailure?: (err: unknown, attempt: number) => void;
  sleep?: (ms: number) => Promise<void>;
}

class Retryer {
  constructor(options: RetryOptions = {}) {
    // Your state here
  }

  /** Run fn(attempt) until it resolves; rethrow the last (or a non-retryable) error. Honors signal.throwIfAborted(). */
  async run<T>(fn: (attempt: number) => Promise<T> | T, options: { signal?: { throwIfAborted?: () => void } } = {}): Promise<T> {
    return fn(0);
  }

  /** Decorator form: retryer.wrap(fetchJson) returns a retrying version. */
  wrap<A extends unknown[], T>(fn: (...args: A) => Promise<T> | T): (...args: A) => Promise<T> {
    return (...args) => this.run(() => fn(...args));
  }
}
`,
    solutionCode: `// Retryer (onsite "AI coding" round, Aug 2026 — Claude Code available; you still own the code).
// Composes three pluggable pieces: backoff strategy, retryable-error filter, hooks.
type Backoff = (attempt: number) => number;

const backoff = {
  fixed: (ms: number): Backoff => () => ms,
  linear: (ms: number): Backoff => (attempt) => ms * (attempt + 1),
  exponential: (base: number, cap = 30_000): Backoff => (attempt) => Math.min(cap, base * 2 ** attempt),
  // jitter prevents synchronized retry storms: delay * [0.5, 1.5)
  exponentialJitter: (base: number, cap = 30_000, random: () => number = Math.random): Backoff =>
    (attempt) => Math.min(cap, base * 2 ** attempt) * (0.5 + random()),
};

interface RetryOptions {
  maxAttempts?: number;
  backoff?: Backoff;
  isRetryable?: (err: unknown) => boolean;                 // e.g. (err) => err.status >= 500
  onAttempt?: (attempt: number) => void;                   // hooks: logging / metrics
  onFailure?: (err: unknown, attempt: number) => void;
  sleep?: (ms: number) => Promise<void>;
}

/** The subset of AbortSignal the retryer needs — a plain object works too. */
interface Abortable {
  throwIfAborted?: () => void;
}

class Retryer {
  readonly maxAttempts: number;
  readonly delayFor: Backoff;
  readonly isRetryable: (err: unknown) => boolean;
  readonly onAttempt: (attempt: number) => void;
  readonly onFailure: (err: unknown, attempt: number) => void;
  readonly sleep: (ms: number) => Promise<void>;

  constructor({
    maxAttempts = 3,
    backoff: delayFor = backoff.exponentialJitter(200),
    isRetryable = () => true,
    onAttempt = () => {},
    onFailure = () => {},
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }: RetryOptions = {}) {
    this.maxAttempts = maxAttempts;
    this.delayFor = delayFor;
    this.isRetryable = isRetryable;
    this.onAttempt = onAttempt;
    this.onFailure = onFailure;
    this.sleep = sleep;
  }

  async run<T>(fn: (attempt: number) => Promise<T> | T, { signal }: { signal?: Abortable } = {}): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      signal?.throwIfAborted?.();
      this.onAttempt(attempt);
      try {
        return await fn(attempt);                     // await INSIDE try so async rejections are caught
      } catch (err) {
        const last = attempt === this.maxAttempts - 1;
        this.onFailure(err, attempt);
        if (last || !this.isRetryable(err)) throw err; // re-raise the last / non-retryable error
        await this.sleep(this.delayFor(attempt));
      }
    }
  }

  // Decorator form: const safeFetch = retryer.wrap(fetchJson)
  wrap<A extends unknown[], T>(fn: (...args: A) => Promise<T> | T): (...args: A) => Promise<T> {
    return (...args) => this.run(() => fn(...args));
  }
}
`,
  },
  "fifo-order-allocator": {
    entry: "__runOperations",
    starterCode: `interface Lot {
  lotId: string;
  quantity: number;
  receivedAt: number;
}

interface Allocation {
  lotId: string;
  quantity: number;
}

class StockAllocator {
  constructor() {
    // Your state here
  }

  /** Add a lot of stock. Lots are consumed oldest receivedAt first; ties in the order received. */
  receive(lotId: string, quantity: number, receivedAt: number): void {}

  /** Fill an order from the oldest stock. All-or-nothing: null (and no change) when stock is short. */
  allocate(orderId: string, quantity: number): Allocation[] | null {
    return null;
  }

  /** Total units still in stock. */
  available(): number {
    return 0;
  }

  /** Remaining lots in consumption order. */
  lots(): Lot[] {
    return [];
  }
}
`,
    solutionCode: `interface Lot {
  lotId: string;
  quantity: number;
  receivedAt: number;
}

interface Allocation {
  lotId: string;
  quantity: number;
}

// FIFO stock allocation: consume the oldest lot first, partially if needed,
// and hand back which lots an order drew from. All-or-nothing on shortage.
class StockAllocator {
  #lots: (Lot & { seq: number })[] = [];   // kept sorted: receivedAt asc, then arrival order
  #seq = 0;

  receive(lotId: string, quantity: number, receivedAt: number): void {
    if (quantity <= 0) return;
    this.#lots.push({ lotId, quantity, receivedAt, seq: this.#seq++ });
    this.#lots.sort((a, b) => a.receivedAt - b.receivedAt || a.seq - b.seq);
  }

  available(): number {
    return this.#lots.reduce((sum, lot) => sum + lot.quantity, 0);
  }

  lots(): Lot[] {
    return this.#lots.map(({ lotId, quantity, receivedAt }) => ({ lotId, quantity, receivedAt }));
  }

  allocate(orderId: string, quantity: number): Allocation[] | null {
    if (quantity <= 0) return [];
    if (this.available() < quantity) return null;    // all-or-nothing: leave the stock untouched
    const allocations: Allocation[] = [];
    let remaining = quantity;
    while (remaining > 0) {
      const lot = this.#lots[0];                       // the oldest lot is always at the front
      const take = Math.min(lot.quantity, remaining);
      allocations.push({ lotId: lot.lotId, quantity: take });
      lot.quantity -= take;
      remaining -= take;
      if (lot.quantity === 0) this.#lots.shift();
    }
    return allocations;
  }
}
`,
  },
};
