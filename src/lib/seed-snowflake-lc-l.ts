import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, LeetCode tag part L (design-a-class problems,
// continued): a hit counter, a time-based key-value store, and a snapshot
// array. Operation sequences work as in part I. Judged in JavaScript and
// Python; the Python judges live in seed-python-snowflake-k.ts.

export const snowflakeLcProblemsL: Problem[] = [
  {
    slug: "design-hit-counter",
    title: "Design Hit Counter",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A queue of timestamps: evict everything older than 300 seconds on each query, then the length is the answer.",
    prompt: [
      "Implement `HitCounter`, which counts hits received in the past 5 minutes (300 seconds). Timestamps are integer seconds, non-decreasing across calls.",
      "",
      "- `hit(timestamp)` records a hit.",
      "- `getHits(timestamp)` returns the number of hits in `(timestamp - 300, timestamp]`.",
      "",
      "```",
      "c = HitCounter()",
      "c.hit(1); c.hit(2); c.hit(3)",
      "c.getHits(4)     ->  3",
      "c.hit(300)",
      "c.getHits(300)   ->  4",
      "c.getHits(301)   ->  3",
      "```",
    ].join("\n"),
    hints: [
      "Timestamps arrive in order, so a queue of hit times stays sorted; on a query, pop from the front while the time is at or before timestamp − 300.",
      "Many hits per second? Store (timestamp, count) pairs instead of one entry per hit.",
    ],
    solution: [
      "## Approach",
      "",
      "Because time never goes backwards, a queue of timestamps is always sorted. `hit` appends; `getHits` discards from the front every entry at or before `timestamp − 300`, then returns the queue length. Grouping hits by second — a queue of `(second, count)` with a running total — keeps memory bounded by 300 entries when traffic is heavy.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per operation; O(300) space with per-second buckets.",
      "",
      "## Worth saying out loud",
      "",
      "- A circular array of 300 buckets keyed by `timestamp % 300`, each storing its timestamp, answers in O(300) per query with O(1) memory and no eviction loop.",
      "- Out-of-order timestamps break the queue invariant; say which assumption you rely on.",
    ].join("\n"),
    judge: {
      solutionCode: `class HitCounter {
  constructor() {
    this.queue = [];       // [second, count] in increasing time
    this.head = 0;
    this.total = 0;
  }

  hit(timestamp) {
    const last = this.queue[this.queue.length - 1];
    if (last && last[0] === timestamp) last[1]++;
    else this.queue.push([timestamp, 1]);
    this.total++;
  }

  getHits(timestamp) {
    while (this.head < this.queue.length && this.queue[this.head][0] <= timestamp - 300) {
      this.total -= this.queue[this.head][1];
      this.head++;
    }
    return this.total;
  }
}
`,
      starterCode: `class HitCounter {
  constructor() {
    // Your state here
  }

  /** @param {number} timestamp seconds, non-decreasing */
  hit(timestamp) {}

  /** @param {number} timestamp @returns {number} hits in the past 300 seconds */
  getHits(timestamp) {
    return 0;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("HitCounter"),
      tests: [
        {
          name: "Prompt example",
          input: [["HitCounter", "hit", "hit", "hit", "getHits", "hit", "getHits", "getHits"], [[], [1], [2], [3], [4], [300], [300], [301]]],
          expected: [null, null, null, null, 3, null, 4, 3],
        },
        {
          name: "No hits yet",
          input: [["HitCounter", "getHits", "hit", "getHits"], [[], [1], [5], [5]]],
          expected: [null, 0, null, 1],
        },
        {
          name: "Several hits in one second",
          input: [["HitCounter", "hit", "hit", "hit", "getHits", "getHits", "getHits"], [[], [10], [10], [10], [10], [309], [310]]],
          expected: [null, null, null, null, 3, 3, 0],
        },
      ],
    },
  },
  {
    slug: "time-based-key-value-store",
    title: "Time Based Key-Value Store",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Per key, an append-only list of (timestamp, value); a get is a binary search for the last timestamp at or before the query.",
    prompt: [
      "Implement `TimeMap`:",
      "",
      "- `set(key, value, timestamp)` stores the value for the key at that time. Timestamps for one key are strictly increasing across calls.",
      "- `get(key, timestamp)` returns the value set at the largest timestamp at or before `timestamp`, or `\"\"` if none.",
      "",
      "```",
      "m = TimeMap()",
      "m.set(\"foo\", \"bar\", 1)",
      "m.get(\"foo\", 1)   ->  \"bar\"",
      "m.get(\"foo\", 3)   ->  \"bar\"",
      "m.set(\"foo\", \"bar2\", 4)",
      "m.get(\"foo\", 4)   ->  \"bar2\"",
      "m.get(\"foo\", 5)   ->  \"bar2\"",
      "```",
    ].join("\n"),
    hints: [
      "Because timestamps increase per key, appending keeps each key's list sorted.",
      "Binary search for the rightmost entry whose timestamp is ≤ the query; if none, return the empty string.",
    ],
    solution: [
      "## Approach",
      "",
      "A map from key to a list of `[timestamp, value]` pairs. Since timestamps increase per key, `set` appends and the list stays sorted. `get` binary-searches for the last pair with timestamp at or before the query — the rightmost insertion point minus one — and returns its value, or the empty string when the query precedes every entry.",
      "",
      "## Complexity",
      "",
      "O(1) set; O(log n) get; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Out-of-order sets need an insertion by binary search, or a balanced tree per key.",
      "- [Count Events in a Time Range](/problems/count-events-in-range) is the same per-key sorted list with two binary searches.",
    ].join("\n"),
    judge: {
      solutionCode: `class TimeMap {
  constructor() {
    this.store = new Map();
  }

  set(key, value, timestamp) {
    if (!this.store.has(key)) this.store.set(key, []);
    this.store.get(key).push([timestamp, value]);
  }

  get(key, timestamp) {
    const entries = this.store.get(key);
    if (!entries) return "";
    let lo = 0;
    let hi = entries.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (entries[mid][0] <= timestamp) lo = mid + 1;
      else hi = mid;
    }
    return lo === 0 ? "" : entries[lo - 1][1];
  }
}
`,
      starterCode: `class TimeMap {
  constructor() {
    // Your state here
  }

  /** @param {string} key @param {string} value @param {number} timestamp increasing per key */
  set(key, value, timestamp) {}

  /** @param {string} key @param {number} timestamp @returns {string} the value at or before timestamp, or "" */
  get(key, timestamp) {
    return "";
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("TimeMap"),
      tests: [
        {
          name: "Prompt example",
          input: [["TimeMap", "set", "get", "get", "set", "get", "get"], [[], ["foo", "bar", 1], ["foo", 1], ["foo", 3], ["foo", "bar2", 4], ["foo", 4], ["foo", 5]]],
          expected: [null, null, "bar", "bar", null, "bar2", "bar2"],
        },
        {
          name: "Before the first write",
          input: [["TimeMap", "get", "set", "get", "get"], [[], ["k", 1], ["k", "v", 5], ["k", 4], ["k", 5]]],
          expected: [null, "", null, "", "v"],
        },
        {
          name: "Keys are independent",
          input: [["TimeMap", "set", "set", "set", "get", "get", "get"], [[], ["a", "1", 1], ["b", "2", 2], ["a", "3", 3], ["a", 2], ["b", 2], ["a", 10]]],
          expected: [null, null, null, null, "1", "2", "3"],
        },
      ],
    },
  },
  {
    slug: "snapshot-array",
    title: "Snapshot Array",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Per index, a history of (snapId, value) writes; snap is just a counter, and get binary-searches the history.",
    prompt: [
      "Implement `SnapshotArray(length)` over an array of zeros:",
      "",
      "- `set(index, val)` writes a value.",
      "- `snap()` takes a snapshot and returns its id, starting at `0`.",
      "- `get(index, snapId)` returns the value at that index as of that snapshot.",
      "",
      "```",
      "a = SnapshotArray(3)",
      "a.set(0, 5)",
      "a.snap()        ->  0",
      "a.set(0, 6)",
      "a.get(0, 0)     ->  5",
      "```",
      "",
      "Snapshots must not copy the array.",
    ].join("\n"),
    hints: [
      "Each index keeps a list of (snapId, value) pairs recording the writes, which are naturally sorted by snapId.",
      "`get` binary-searches that list for the last pair with snapId ≤ the requested one; an empty prefix means the initial 0.",
    ],
    solution: [
      "## Approach",
      "",
      "Copying the array on every snapshot is O(length); instead record writes. Each index owns a list of `[snapId, value]` where `snapId` is the current snapshot counter at write time (overwriting the last entry when it has the same id). `snap` increments the counter. `get` binary-searches the index's list for the last write at or before the requested id, defaulting to 0.",
      "",
      "## Complexity",
      "",
      "O(1) set and snap; O(log writes) get; O(total writes) space.",
      "",
      "## Worth saying out loud",
      "",
      "- It is the [Time Based Key-Value Store](/problems/time-based-key-value-store) with the index as the key and the snapshot counter as the timestamp.",
      "- Many writes to one index between snapshots should collapse into one entry; otherwise the lists grow with every set.",
    ].join("\n"),
    judge: {
      solutionCode: `class SnapshotArray {
  constructor(length) {
    this.history = Array.from({ length }, () => []);   // per index: [snapId, value]
    this.snapId = 0;
  }

  set(index, val) {
    const h = this.history[index];
    const last = h[h.length - 1];
    if (last && last[0] === this.snapId) last[1] = val;
    else h.push([this.snapId, val]);
  }

  snap() {
    return this.snapId++;
  }

  get(index, snapId) {
    const h = this.history[index];
    let lo = 0;
    let hi = h.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (h[mid][0] <= snapId) lo = mid + 1;
      else hi = mid;
    }
    return lo === 0 ? 0 : h[lo - 1][1];
  }
}
`,
      starterCode: `class SnapshotArray {
  /** @param {number} length */
  constructor(length) {
    // Your state here
  }

  /** @param {number} index @param {number} val */
  set(index, val) {}

  /** @returns {number} the new snapshot's id, starting at 0 */
  snap() {
    return 0;
  }

  /** @param {number} index @param {number} snapId @returns {number} */
  get(index, snapId) {
    return 0;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("SnapshotArray"),
      tests: [
        {
          name: "Prompt example",
          input: [["SnapshotArray", "set", "snap", "set", "get"], [[3], [0, 5], [], [0, 6], [0, 0]]],
          expected: [null, null, 0, null, 5],
        },
        {
          name: "Untouched indices read zero",
          input: [["SnapshotArray", "snap", "get", "set", "snap", "get", "get"], [[2], [], [1, 0], [1, 7], [], [1, 0], [1, 1]]],
          expected: [null, 0, 0, null, 1, 0, 7],
        },
        {
          name: "A later snapshot sees the latest write before it",
          input: [["SnapshotArray", "set", "set", "snap", "snap", "set", "snap", "get", "get", "get"], [[1], [0, 1], [0, 2], [], [], [0, 3], [], [0, 0], [0, 1], [0, 2]]],
          expected: [null, null, null, 0, 1, null, 2, 2, 2, 3],
        },
      ],
    },
  },
];
