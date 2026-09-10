import type { Problem } from "./types";

// Apple phone-screen bank, part C: Number of Islands, insert-interval plus
// sessionization, and Design HashMap. Same sourcing and conventions as
// seed-apple-a.ts.

export const appleProblemsC: Problem[] = [
  {
    slug: "number-of-islands",
    title: "Number of Islands, Three Ways",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "DFS, BFS or union-find — the reported pass came from choosing out loud, not from the code.",
    prompt: [
      "Count the islands in a grid of `'0'` (water) and `'1'` (land). Land cells connect four-directionally — up, down, left, right — and an island is a maximal connected group of land. The grid arrives as a list of equal-length strings.",
      "",
      "```",
      "[\"11000\",",
      " \"11000\",",
      " \"00100\",",
      " \"00011\"]   ->  3",
      "```",
      "",
      "Do not mutate the input.",
      "",
      "The candidate who reported this screen described what earned the pass: before writing anything, they compared DFS, BFS and union-find with pros and cons, asked the interviewer which follow-up was coming, *then* chose an approach, and hand-ran test cases at the end. Do the same.",
      "",
      "## Worth asking out loud",
      "",
      "Do diagonal neighbours connect? Can the grid be huge — is recursion depth a concern? Will cells be added or removed later (which would favour union-find)? May I mark visited cells in place, or must the input stay untouched?",
    ].join("\n"),
    hints: [
      "Scan every cell; each unvisited land cell starts a new island, and a flood fill (iterative DFS with an explicit stack, or BFS with a queue) marks everything reachable from it as visited before the scan continues.",
      "Recursive DFS risks a stack overflow on one huge island; an explicit stack or a queue does not. Union-find is the structure to name if islands can be added later — each successful union removes one component from a running count.",
    ],
    solution: [
      "## Approach",
      "",
      "Do not just write it. The reported script is: recursive DFS risks stack overflow on one huge island; BFS is safe on large connected regions; union-find is what you want if islands get added or removed dynamically. Ask which case matters, then write it. The reference uses an iterative DFS with an explicit stack and a visited set — the strings are immutable, so the input stays untouched without a copy — and the Python version is the BFS variant.",
      "",
      "Every cell is visited at most once, so the scan plus the flood fills is linear in the grid.",
      "",
      "## Complexity",
      "",
      "O(m·n) time for all three approaches; O(min(m, n)) frontier space for a well-behaved BFS, O(m·n) worst case for the visited set or the union-find parent array.",
      "",
      "## Worth saying out loud",
      "",
      "- **Islands added one at a time** is LeetCode 305, and union-find is the only one of the three that answers it without re-scanning: count land cells up, and subtract one for every union that joins two components.",
      "- **Do not mutate the input** — the reference keeps a visited set; flipping cells to `'0'` in a copy is the alternative. Say which you did and why: silently destroying the caller's grid is a real code-review note.",
      "- **Diagonals count?** Ask. It is a one-line change to the neighbour list and a free demonstration that you clarify.",
      "- The union-find version counts *down* from total land rather than up from zero; explain that inversion, because it reads as a bug otherwise.",
    ].join("\n"),
    judge: {
      solutionCode: `// Iterative DFS with an explicit stack: no recursion depth, input untouched.
function countIslands(grid) {
  const rows = grid.length;
  if (rows === 0) return 0;
  const cols = grid[0].length;
  const seen = new Set();
  let islands = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== "1" || seen.has(r * cols + c)) continue;
      islands++;
      const stack = [[r, c]];
      seen.add(r * cols + c);
      while (stack.length > 0) {
        const [x, y] = stack.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = x + dx, b = y + dy;
          if (a < 0 || b < 0 || a >= rows || b >= cols) continue;
          if (grid[a][b] !== "1" || seen.has(a * cols + b)) continue;
          seen.add(a * cols + b);
          stack.push([a, b]);
        }
      }
    }
  }
  return islands;
}
`,
      starterCode: `/**
 * @param {string[]} grid rows of '0' (water) and '1' (land)
 * @returns {number} how many four-directionally connected islands there are
 */
function countIslands(grid) {
  // Your code here
  return 0;
}
`,
      entry: "countIslands",
      tests: [
        { name: "One island", input: [["11110", "11010", "11000", "00000"]], expected: 1 },
        { name: "Prompt example", input: [["11000", "11000", "00100", "00011"]], expected: 3 },
        { name: "Diagonal neighbours do not connect", input: [["10", "01"]], expected: 2 },
        { name: "All water", input: [["000", "000"]], expected: 0 },
        { name: "Empty grid", input: [[]], expected: 0 },
        { name: "Single land cell", input: [["1"]], expected: 1 },
        { name: "Ring around a lake is one island", input: [["111", "101", "111"]], expected: 1 },
        { name: "Alternating cells in one row", input: [["1010101"]], expected: 4 },
        { name: "Checkerboard", input: [["101", "010", "101"]], expected: 5 },
      ],
    },
  },
  {
    slug: "insert-interval-sessionize",
    title: "Insert Interval, Then Sessionize",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Three linear phases instead of a re-sort — and the same sweep groups events into sessions.",
    prompt: [
      "One 45-minute Apple phone screen asked two problems back to back: merge overlapping intervals, then insert a new interval into an already-merged list. This problem is the second half plus the data-pipeline cousin an AIML data-engineering screen asked about — \"grouping processes within a specific time window\".",
      "",
      "## Phase 1 — `insertInterval(intervals, newInterval)`",
      "",
      "`intervals` is a list of closed `[start, end]` pairs that are sorted by start and do not overlap. Insert `newInterval`, merging where it overlaps, and return the list still sorted and non-overlapping. Touching intervals merge (`[1, 4]` and `[4, 5]` become `[1, 5]`). Do it in one pass without re-sorting.",
      "",
      "```",
      "insertInterval([[1, 3], [6, 9]], [2, 5])                       ->  [[1, 5], [6, 9]]",
      "insertInterval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])  ->  [[1, 2], [3, 10], [12, 16]]",
      "```",
      "",
      "## Phase 2 — `sessionize(events, gap)`",
      "",
      "`events` is an unordered list of `[entity, timestamp]` pairs. For each entity, group its events into sessions: consecutive events (in time order) that are at most `gap` apart belong to the same session. Return `{ entity: [[start, end, count], ...] }` with each entity's sessions in time order.",
      "",
      "```",
      "sessionize([[\"u1\", 1], [\"u1\", 5], [\"u1\", 30], [\"u2\", 2]], 10)",
      "  ->  { \"u1\": [[1, 5, 2], [30, 30, 1]], \"u2\": [[2, 2, 1]] }",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Are the intervals closed or half-open — does `[1, 4]` touching `[4, 5]` make one interval or two? Is the merged list guaranteed sorted, so I can rely on the invariant instead of re-sorting? For sessions, is the gap inclusive, and are events already sorted by entity and time?",
    ].join("\n"),
    hints: [
      "Insert is three linear phases over the sorted list: copy everything that ends before the new interval starts; absorb everything that starts before the new interval ends by widening it; copy the rest. No sort needed — the invariant gives you O(n).",
      "Sessionize is the same sweep after sorting by (entity, timestamp): open a session on the first event, extend it while the next timestamp is within `gap` of the session's current end, otherwise close it and open a new one.",
    ],
    solution: [
      "## Approach",
      "",
      "For insert, resist re-sorting: the list is already merged, so it is three linear phases — everything strictly before, everything overlapping (collapsed into the new interval by taking the min start and max end), everything after. Saying \"I do not need to re-sort, the invariant gives me O(n)\" is the whole point of asking insert after merge.",
      "",
      "Sessionization is the same idea with a gap instead of an overlap: sort the events by entity and time, walk them, and either extend the entity's open session (when the timestamp is within `gap` of its end) or start a new one. The state per entity is one open session, which is exactly what a windowed `lag()` in Spark gives you.",
      "",
      "## Complexity",
      "",
      "Insert: O(n) time, O(n) for the output. Sessionize: O(e log e) for the sort, then a linear sweep; O(e) space for the sessions.",
      "",
      "## Worth saying out loud",
      "",
      "- **Do it in Spark?** `lag()` over a window partitioned by entity and ordered by timestamp, flag rows where the gap exceeds the threshold, cumulative-sum the flags to get a session id. Name the skew risk: one hot entity puts the whole partition on one executor.",
      "- **Streaming with late-arriving events?** Watermarks. A late event can reopen a closed session, so you either bound lateness and drop, or emit a correction.",
      "- **Closed vs half-open:** the code merges touching intervals; a booking system would deliberately not, so a checkout and a check-in at the same instant do not collide.",
    ].join("\n"),
    judge: {
      solutionCode: `// O(n), no re-sort: before, overlapping (collapsed), after.
function insertInterval(intervals, newInterval) {
  const out = [];
  let [start, end] = newInterval;
  let i = 0;
  while (i < intervals.length && intervals[i][1] < start) out.push([...intervals[i++]]);
  while (i < intervals.length && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }
  out.push([start, end]);
  while (i < intervals.length) out.push([...intervals[i++]]);
  return out;
}

// Sort by (entity, time), then one sweep with one open session per entity.
function sessionize(events, gap) {
  const sorted = [...events].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1],
  );
  const out = {};
  for (const [entity, ts] of sorted) {
    const sessions = (out[entity] ??= []);
    const last = sessions[sessions.length - 1];
    if (last && ts - last[1] <= gap) {
      last[1] = ts;
      last[2]++;
    } else {
      sessions.push([ts, ts, 1]);
    }
  }
  return out;
}
`,
      starterCode: `/**
 * @param {[number, number][]} intervals sorted, non-overlapping, closed
 * @param {[number, number]} newInterval
 * @returns {[number, number][]} still sorted and non-overlapping
 */
function insertInterval(intervals, newInterval) {
  // Your code here
  return intervals;
}

/**
 * @param {[string, number][]} events unordered [entity, timestamp] pairs
 * @param {number} gap events at most this far apart share a session
 * @returns {Record<string, [number, number, number][]>} entity -> [[start, end, count], ...]
 */
function sessionize(events, gap) {
  // Your code here
  return {};
}
`,
      entry: "__judgeIntervals",
      driverCode: `function __judgeIntervals(kind, a, b) {
  return kind === "insert" ? insertInterval(a, b) : sessionize(a, b);
}`,
      tests: [
        { name: "Insert: overlaps the first interval", input: ["insert", [[1, 3], [6, 9]], [2, 5]], expected: [[1, 5], [6, 9]] },
        {
          name: "Insert: swallows three intervals",
          input: ["insert", [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]],
          expected: [[1, 2], [3, 10], [12, 16]],
        },
        { name: "Insert into an empty list", input: ["insert", [], [5, 7]], expected: [[5, 7]] },
        { name: "Insert before everything", input: ["insert", [[3, 4]], [1, 2]], expected: [[1, 2], [3, 4]] },
        { name: "Insert after everything", input: ["insert", [[1, 2]], [3, 4]], expected: [[1, 2], [3, 4]] },
        { name: "Insert: touching intervals merge", input: ["insert", [[1, 4]], [4, 5]], expected: [[1, 5]] },
        { name: "Insert: contained entirely", input: ["insert", [[1, 10]], [3, 4]], expected: [[1, 10]] },
        {
          name: "Sessionize: prompt example",
          input: ["sessionize", [["u1", 1], ["u1", 5], ["u1", 30], ["u2", 2]], 10],
          expected: { u1: [[1, 5, 2], [30, 30, 1]], u2: [[2, 2, 1]] },
        },
        {
          name: "Sessionize: unsorted input",
          input: ["sessionize", [["a", 50], ["a", 10], ["a", 20]], 10],
          expected: { a: [[10, 20, 2], [50, 50, 1]] },
        },
        {
          name: "Sessionize: the gap is inclusive",
          input: ["sessionize", [["a", 0], ["a", 10], ["a", 21]], 10],
          expected: { a: [[0, 10, 2], [21, 21, 1]] },
        },
        { name: "Sessionize: no events", input: ["sessionize", [], 5], expected: {} },
        {
          name: "Sessionize: gap 0 joins only simultaneous events",
          input: ["sessionize", [["a", 1], ["a", 1], ["a", 2]], 0],
          expected: { a: [[1, 1, 2], [2, 2, 1]] },
        },
      ],
    },
  },
  {
    slug: "design-hashmap",
    title: "Design HashMap",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Separate chaining with a resize — the fixed-bucket version passes LeetCode and fails the follow-up.",
    prompt: [
      "Implement a hash map with `put(key, value)`, `get(key)` and `remove(key)` **without using any built-in hash table** (no `Map`, `Set`, `dict` or plain-object-as-map for the storage itself). Keys are non-negative integers; `get` returns `-1` for a missing key.",
      "",
      "```",
      "map = MyHashMap()",
      "map.put(1, 1); map.put(2, 2)",
      "map.get(1)    ->  1",
      "map.get(3)    ->  -1",
      "map.put(2, 1)             // update",
      "map.get(2)    ->  1",
      "map.remove(2)",
      "map.get(2)    ->  -1",
      "```",
      "",
      "Rehearse this one until you can type it without thinking. The reported screen was hostile: the interviewer interrupted throughout, gave no hints, deleted part of the scaffold so the code would not compile, and stopped the candidate with three minutes left. Typing it cold is the only defence against that room.",
      "",
      "## Follow-up",
      "",
      "Keep operations O(1) amortised as the map grows: resize when the load factor passes a threshold, and be ready to explain what a production hash map does beyond that.",
      "",
      "## Worth asking out loud",
      "",
      "Are keys integers only, or arbitrary hashable values? How many entries — does resizing matter? Is thread safety in scope? Should collisions chain or probe?",
    ].join("\n"),
    hints: [
      "Separate chaining: an array of buckets, each a small list of [key, value] pairs, indexed by key modulo the capacity. put scans the bucket for an existing key before appending; get and remove scan the same bucket.",
      "Track the entry count and double the bucket array when count exceeds 0.75 × capacity, re-inserting every pair under the new modulus. Mask or otherwise force the hash non-negative before taking the modulo.",
    ],
    solution: [
      "## Approach",
      "",
      "Fixed-size bucket arrays pass LeetCode; they do not pass a follow-up. Open with \"separate chaining, and I will resize at a 0.75 load factor so lookups stay O(1) amortised\" — then write it. Each bucket is a list of pairs; the index is the key modulo the capacity (mask the hash non-negative first if keys can hash negative). `put` updates in place when the key exists, otherwise appends and checks the load factor; `get` scans one bucket; `remove` splices one entry. Resizing doubles the bucket array and re-inserts every pair, which is O(n) once per doubling and O(1) amortised over the inserts that triggered it.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per operation, O(n) on a resize; O(n + capacity) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **What is in a real HashMap?** Java 8+ turns a bucket into a red-black tree past eight entries, so a collision-heavy bucket degrades to O(log n) rather than O(n). Apple has reported this exact follow-up as \"implement a HashMap and explain the underlying data structures.\"",
      "- **Open addressing instead?** Better cache locality, but deletion needs tombstones and the table degrades badly past ~0.7 load. Naming the tombstone is the tell that you have implemented one.",
      "- **Thread-safe?** Lock striping — one lock per bucket group, not one global lock.",
    ].join("\n"),
    judge: {
      solutionCode: `class MyHashMap {
  constructor(capacity = 16, loadFactor = 0.75) {
    this.capacity = capacity;
    this.loadFactor = loadFactor;
    this.size = 0;
    this.buckets = Array.from({ length: capacity }, () => []);
  }

  index(key) {
    return Math.abs(key) % this.capacity;
  }

  resize() {
    const old = this.buckets;
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    for (const bucket of old) {
      for (const pair of bucket) this.buckets[this.index(pair[0])].push(pair);
    }
  }

  put(key, value) {
    const bucket = this.buckets[this.index(key)];
    for (const pair of bucket) {
      if (pair[0] === key) {
        pair[1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.size++;
    if (this.size > this.loadFactor * this.capacity) this.resize();
  }

  get(key) {
    for (const pair of this.buckets[this.index(key)]) {
      if (pair[0] === key) return pair[1];
    }
    return -1;
  }

  remove(key) {
    const bucket = this.buckets[this.index(key)];
    const at = bucket.findIndex((pair) => pair[0] === key);
    if (at === -1) return;
    bucket.splice(at, 1);
    this.size--;
  }
}
`,
      starterCode: `class MyHashMap {
  constructor() {
    // Your buckets here — no Map, Set or object-as-dictionary for the storage
  }

  put(key, value) {
    // Your code here
  }

  /** @returns {number} the value, or -1 if absent */
  get(key) {
    return -1;
  }

  remove(key) {
    // Your code here
  }
}
`,
      entry: "__runOperations",
      // "stress" fills n keys, removes every third and sums the reads — a
      // resize test without a thousand-entry operation list.
      driverCode: `function __runOperations(operations, args) {
  let map = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op === "MyHashMap") {
      map = new MyHashMap();
      out.push(null);
    } else if (op === "stress") {
      const n = args[i][0];
      for (let k = 0; k < n; k++) map.put(k, k * 2);
      for (let k = 0; k < n; k += 3) map.remove(k);
      let sum = 0;
      for (let k = 0; k < n; k++) sum += map.get(k);
      out.push(sum);
    } else {
      out.push(map[op](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            ["MyHashMap", "put", "put", "get", "get", "put", "get", "remove", "get"],
            [[], [1, 1], [2, 2], [1], [3], [2, 1], [2], [2], [2]],
          ],
          expected: [null, null, null, 1, -1, null, 1, null, -1],
        },
        {
          name: "Keys that share a bucket (1, 17, 33, 49 at capacity 16)",
          input: [
            ["MyHashMap", "put", "put", "put", "put", "get", "get", "get", "get", "remove", "get", "get"],
            [[], [1, 10], [17, 20], [33, 30], [49, 40], [1], [17], [33], [49], [17], [17], [33]],
          ],
          expected: [null, null, null, null, null, 10, 20, 30, 40, null, -1, 30],
        },
        {
          name: "Removing a missing key is harmless; updates overwrite",
          input: [
            ["MyHashMap", "remove", "get", "put", "get", "put", "get"],
            [[], [5], [5], [5, 7], [5], [5, 8], [5]],
          ],
          expected: [null, null, -1, null, 7, null, 8],
        },
        { name: "Small stress: 10 keys, every third removed", input: [["MyHashMap", "stress"], [[], [10]]], expected: [null, 50] },
        { name: "Resize stress: 1000 keys, every third removed", input: [["MyHashMap", "stress"], [[], [1000]]], expected: [null, 665000] },
        { name: "Large key", input: [["MyHashMap", "put", "get", "get"], [[], [1000000, 1], [1000000], [0]]], expected: [null, null, 1, -1] },
      ],
    },
  },
];
