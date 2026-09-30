import type { Problem } from "./types";

// Apple coding bank, part C: Number of Islands, Insert Interval, and Design
// HashMap. Same conventions as seed-apple-a.ts; sessionization lives in
// seed-apple-n.ts.

export const appleProblemsC: Problem[] = [
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Flood fill from every unvisited land cell — and know when DFS, BFS or union-find fits.",
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
    ].join("\n"),
    hints: [
      "Scan every cell; each unvisited land cell starts a new island, and a flood fill (iterative DFS with an explicit stack, or BFS with a queue) marks everything reachable from it as visited before the scan continues.",
      "Recursive DFS risks a stack overflow on one huge island; an explicit stack or a queue does not. Union-find is the structure to name if islands can be added later — each successful union removes one component from a running count.",
    ],
    solution: [
      "## Approach",
      "",
      "Compare the three before writing: recursive DFS risks stack overflow on one huge island; BFS is safe on large connected regions; union-find is what you want if islands get added or removed dynamically. Pick one for a stated reason, then write it. The reference uses an iterative DFS with an explicit stack and a visited set — the strings are immutable, so the input stays untouched without a copy — and the Python version is the BFS variant.",
      "",
      "Every cell is visited at most once, so the scan plus the flood fills is linear in the grid.",
      "",
      "## Complexity",
      "",
      "O(m·n) time for all three approaches; O(min(m, n)) frontier space for a well-behaved BFS, O(m·n) worst case for the visited set or the union-find parent array.",
      "",
      "## Worth saying out loud",
      "",
      "- **Islands added one at a time?** Union-find is the only one of the three that answers it without re-scanning: count land cells up, and subtract one for every union that joins two components.",
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
    slug: "insert-interval",
    title: "Insert Interval",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Three linear phases instead of a re-sort: before, overlapping, after.",
    prompt: [
      "`intervals` is a list of closed `[start, end]` pairs that are sorted by start and do not overlap. Insert `newInterval`, merging where it overlaps, and return the list still sorted and non-overlapping. Touching intervals merge (`[1, 4]` and `[4, 5]` become `[1, 5]`). Do it in one pass without re-sorting.",
      "",
      "```",
      "insertInterval([[1, 3], [6, 9]], [2, 5])                       ->  [[1, 5], [6, 9]]",
      "insertInterval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])  ->  [[1, 2], [3, 10], [12, 16]]",
      "```",
    ].join("\n"),
    hints: [
      "Insert is three linear phases over the sorted list: copy everything that ends before the new interval starts; absorb everything that starts before the new interval ends by widening it; copy the rest. No sort needed — the invariant gives you O(n).",
    ],
    solution: [
      "## Approach",
      "",
      "Resist re-sorting: the list is already merged, so it is three linear phases — everything strictly before, everything overlapping (collapsed into the new interval by taking the min start and max end), everything after. Saying \"I do not need to re-sort, the invariant gives me O(n)\" is the point of the question.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) for the output.",
      "",
      "## Worth saying out loud",
      "",
      "- **Closed vs half-open:** the code merges touching intervals; a booking system would deliberately not, so a checkout and a check-in at the same instant do not collide.",
      "- **Many inserts?** Keep the intervals in a balanced tree keyed by start; each insert then finds its neighbours in O(log n) and only touches the intervals it absorbs.",
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
`,
      entry: "insertInterval",
      tests: [
        { name: "Overlaps the first interval", input: [[[1, 3], [6, 9]], [2, 5]], expected: [[1, 5], [6, 9]] },
        {
          name: "Swallows three intervals",
          input: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]],
          expected: [[1, 2], [3, 10], [12, 16]],
        },
        { name: "Into an empty list", input: [[], [5, 7]], expected: [[5, 7]] },
        { name: "Before everything", input: [[[3, 4]], [1, 2]], expected: [[1, 2], [3, 4]] },
        { name: "After everything", input: [[[1, 2]], [3, 4]], expected: [[1, 2], [3, 4]] },
        { name: "Touching intervals merge", input: [[[1, 4]], [4, 5]], expected: [[1, 5]] },
        { name: "Contained entirely", input: [[[1, 10]], [3, 4]], expected: [[1, 10]] },
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
      "Separate chaining with a resize at a load-factor threshold — fixed buckets aren't enough.",
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
      "Keep operations O(1) amortised as the map grows: resize when the load factor passes a threshold.",
    ].join("\n"),
    hints: [
      "Separate chaining: an array of buckets, each a small list of [key, value] pairs, indexed by key modulo the capacity. put scans the bucket for an existing key before appending; get and remove scan the same bucket.",
      "Track the entry count and double the bucket array when count exceeds 0.75 × capacity, re-inserting every pair under the new modulus. Mask or otherwise force the hash non-negative before taking the modulo.",
    ],
    solution: [
      "## Approach",
      "",
      "A fixed-size bucket array degrades as the map grows. Open with \"separate chaining, and I will resize at a 0.75 load factor so lookups stay O(1) amortised\" — then write it. Each bucket is a list of pairs; the index is the key modulo the capacity (mask the hash non-negative first if keys can hash negative). `put` updates in place when the key exists, otherwise appends and checks the load factor; `get` scans one bucket; `remove` splices one entry. Resizing doubles the bucket array and re-inserts every pair, which is O(n) once per doubling and O(1) amortised over the inserts that triggered it.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per operation, O(n) on a resize; O(n + capacity) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **What is in a real HashMap?** Java 8+ turns a bucket into a red-black tree past eight entries, so a collision-heavy bucket degrades to O(log n) rather than O(n).",
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
