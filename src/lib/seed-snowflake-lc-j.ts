import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, LeetCode tag part J: more design-a-class problems
// — a log storage system, a path-based file system, and a circular deque;
// part M continues them. Operation sequences work as in part I. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-k.ts.

export const snowflakeLcProblemsJ: Problem[] = [
  {
    slug: "design-log-storage-system",
    title: "Design Log Storage System",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Zero-padded timestamps compare as strings, so a granularity is just a prefix length.",
    prompt: [
      "Timestamps have the form `Year:Month:Day:Hour:Minute:Second`, zero-padded, such as `2017:01:01:23:59:59`. Implement `LogSystem`:",
      "",
      "- `put(id, timestamp)` stores a log.",
      "- `retrieve(start, end, granularity)` returns the ids whose timestamps fall within `[start, end]` when both bounds and the logs are truncated to the granularity (`\"Year\"`, `\"Month\"`, `\"Day\"`, `\"Hour\"`, `\"Minute\"` or `\"Second\"`). Return the ids in ascending order.",
      "",
      "```",
      "s = LogSystem()",
      "s.put(1, \"2017:01:01:23:59:59\"); s.put(2, \"2017:01:01:22:59:59\"); s.put(3, \"2016:01:01:00:00:00\")",
      "s.retrieve(\"2016:01:01:01:01:01\", \"2017:01:01:23:00:00\", \"Year\")  ->  [1, 2, 3]",
      "s.retrieve(\"2016:01:01:01:01:01\", \"2017:01:01:23:00:00\", \"Hour\")  ->  [1, 2]",
      "```",
    ].join("\n"),
    hints: [
      "Map each granularity to a prefix length: Year 4, Month 7, Day 10, Hour 13, Minute 16, Second 19.",
      "Truncate the bounds and each log to that length; because the fields are fixed-width, string comparison matches chronological order.",
    ],
    solution: [
      "## Approach",
      "",
      "The format is fixed-width and zero-padded, so lexicographic order equals chronological order and truncating to a prefix implements the granularity. Store the logs as they come; to retrieve, cut the two bounds and every timestamp to the granularity's prefix length and keep the ids whose prefix lies between them, then sort the ids.",
      "",
      "## Complexity",
      "",
      "O(1) put; O(n) retrieve over n logs (a sorted structure keyed by timestamp makes it O(log n + matches)).",
      "",
      "## Worth saying out loud",
      "",
      "- Converting to seconds and bucketing by granularity also works, but the prefix trick needs no calendar arithmetic.",
      "- For a real log store this is the query side of [Design an Audit Log Service](/problems/design-audit-log-service): the index, not the scan.",
    ].join("\n"),
    judge: {
      solutionCode: `class LogSystem {
  constructor() {
    this.logs = [];
    this.prefix = { Year: 4, Month: 7, Day: 10, Hour: 13, Minute: 16, Second: 19 };
  }

  put(id, timestamp) {
    this.logs.push([id, timestamp]);
  }

  retrieve(start, end, granularity) {
    const len = this.prefix[granularity];
    const lo = start.slice(0, len);
    const hi = end.slice(0, len);
    return this.logs
      .filter(([, ts]) => {
        const key = ts.slice(0, len);
        return key >= lo && key <= hi;
      })
      .map(([id]) => id)
      .sort((a, b) => a - b);
  }
}
`,
      starterCode: `class LogSystem {
  constructor() {
    // Your state here
  }

  /** @param {number} id @param {string} timestamp "Year:Month:Day:Hour:Minute:Second" */
  put(id, timestamp) {}

  /** @param {string} start @param {string} end @param {string} granularity @returns {number[]} ids, ascending */
  retrieve(start, end, granularity) {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("LogSystem"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["LogSystem", "put", "put", "put", "retrieve", "retrieve"],
            [[], [1, "2017:01:01:23:59:59"], [2, "2017:01:01:22:59:59"], [3, "2016:01:01:00:00:00"], ["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Year"], ["2016:01:01:01:01:01", "2017:01:01:23:00:00", "Hour"]],
          ],
          expected: [null, null, null, null, [1, 2, 3], [1, 2]],
        },
        {
          name: "Second granularity is exact",
          input: [
            ["LogSystem", "put", "put", "retrieve", "retrieve"],
            [[], [1, "2017:01:01:23:59:59"], [2, "2017:01:01:22:59:59"], ["2017:01:01:22:59:59", "2017:01:01:23:59:58", "Second"], ["2017:01:01:22:59:59", "2017:01:01:23:59:59", "Minute"]],
          ],
          expected: [null, null, null, [2], [1, 2]],
        },
        {
          name: "Nothing in range",
          input: [["LogSystem", "put", "retrieve"], [[], [7, "2020:06:15:12:00:00"], ["2021:01:01:00:00:00", "2022:01:01:00:00:00", "Day"]]],
          expected: [null, null, []],
        },
      ],
    },
  },
  {
    slug: "design-file-system",
    title: "Design File System",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A map from path to value; a create succeeds only when the path is new and its parent (or the root) exists.",
    prompt: [
      "Paths look like `/leet/code`: a non-empty sequence of `/name` segments. Implement `FileSystem`:",
      "",
      "- `createPath(path, value)` creates the path with the value and returns `true`, or returns `false` if the path already exists or its parent does not.",
      "- `get(path)` returns the path's value, or `-1` if it does not exist.",
      "",
      "```",
      "fs = FileSystem()",
      "fs.createPath(\"/leet\", 1)        ->  true",
      "fs.createPath(\"/leet/code\", 2)   ->  true",
      "fs.get(\"/leet/code\")             ->  2",
      "fs.createPath(\"/c/d\", 1)         ->  false   // /c does not exist",
      "fs.get(\"/c\")                     ->  -1",
      "```",
    ].join("\n"),
    hints: [
      "The parent of a path is everything before its last slash; an empty parent means the root, which always exists.",
      "A hash map from full path to value answers both calls; a trie of segments is the alternative when prefix listings are needed.",
    ],
    solution: [
      "## Approach",
      "",
      "Keep a map from the full path string to its value. To create, reject if the path is already present; compute the parent by cutting at the last slash and reject unless the parent is the root (empty) or present; otherwise store. `get` is a lookup with a default of -1.",
      "",
      "## Complexity",
      "",
      "O(L) per operation for a path of length L; O(total path length) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The segment trie pays off when the next requirement is listing children or deleting a subtree; [In-Memory File System](/problems/in-memory-file-system) is that version.",
      "- Validate the path shape at the boundary: a trailing slash or an empty segment should be rejected before any lookup.",
    ].join("\n"),
    judge: {
      solutionCode: `class FileSystem {
  constructor() {
    this.values = new Map();
  }

  createPath(path, value) {
    if (this.values.has(path)) return false;
    const parent = path.slice(0, path.lastIndexOf("/"));
    if (parent !== "" && !this.values.has(parent)) return false;
    this.values.set(path, value);
    return true;
  }

  get(path) {
    return this.values.has(path) ? this.values.get(path) : -1;
  }
}
`,
      starterCode: `class FileSystem {
  constructor() {
    // Your state here
  }

  /** @param {string} path @param {number} value @returns {boolean} */
  createPath(path, value) {
    return false;
  }

  /** @param {string} path @returns {number} the value, or -1 */
  get(path) {
    return -1;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("FileSystem"),
      tests: [
        {
          name: "A root-level path",
          input: [["FileSystem", "createPath", "get"], [[], ["/a", 1], ["/a"]]],
          expected: [null, true, 1],
        },
        {
          name: "Nested paths need their parent",
          input: [["FileSystem", "createPath", "createPath", "get", "createPath", "get"], [[], ["/leet", 1], ["/leet/code", 2], ["/leet/code"], ["/c/d", 1], ["/c"]]],
          expected: [null, true, true, 2, false, -1],
        },
        {
          name: "Duplicates are rejected",
          input: [["FileSystem", "createPath", "createPath", "get"], [[], ["/x", 5], ["/x", 6], ["/x"]]],
          expected: [null, true, false, 5],
        },
      ],
    },
  },
  {
    slug: "design-circular-deque",
    title: "Design Circular Deque",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A fixed buffer with a head index and a size; the front moves backwards modulo the capacity.",
    prompt: [
      "Implement `MyCircularDeque(k)`, a double-ended queue of capacity `k`:",
      "",
      "- `insertFront(value)` and `insertLast(value)` return `false` when full.",
      "- `deleteFront()` and `deleteLast()` return `false` when empty.",
      "- `getFront()` and `getRear()` return `-1` when empty.",
      "- `isEmpty()` and `isFull()`.",
      "",
      "```",
      "d = MyCircularDeque(3)",
      "d.insertLast(1); d.insertLast(2); d.insertFront(3)",
      "d.insertFront(4)   ->  false",
      "d.getRear()        ->  2",
      "d.isFull()         ->  true",
      "d.deleteLast(); d.insertFront(4)",
      "d.getFront()       ->  4",
      "```",
    ].join("\n"),
    hints: [
      "A fixed array of size k, a `head` index and a `size`. The rear index is `(head + size − 1) mod k`.",
      "Inserting at the front moves `head` to `(head − 1 + k) mod k`; deleting at the front moves it forward. Insert and delete at the rear only change `size`.",
    ],
    solution: [
      "## Approach",
      "",
      "A ring buffer. Keep the capacity, a `head` index and a `size`; the rear position is derived from them. Front insertion steps `head` backwards with wrap-around before writing; rear insertion writes at the rear position after `size` grows. Deletions move `head` forward or shrink `size`. Full and empty are comparisons of `size` with the capacity and zero, which is why `size` is stored rather than inferred from two indices.",
      "",
      "## Complexity",
      "",
      "O(1) per operation; O(k) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Storing `size` avoids the classic ambiguity where `head === tail` means both empty and full; the alternative wastes one slot.",
      "- [Design a Circular Queue](/problems/design-circular-queue) is the single-ended version; the deque only adds the backwards step for the front.",
    ].join("\n"),
    judge: {
      solutionCode: `class MyCircularDeque {
  constructor(k) {
    this.buffer = Array(k).fill(0);
    this.capacity = k;
    this.head = 0;
    this.size = 0;
  }

  insertFront(value) {
    if (this.size === this.capacity) return false;
    this.head = (this.head - 1 + this.capacity) % this.capacity;
    this.buffer[this.head] = value;
    this.size++;
    return true;
  }

  insertLast(value) {
    if (this.size === this.capacity) return false;
    this.buffer[(this.head + this.size) % this.capacity] = value;
    this.size++;
    return true;
  }

  deleteFront() {
    if (this.size === 0) return false;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return true;
  }

  deleteLast() {
    if (this.size === 0) return false;
    this.size--;
    return true;
  }

  getFront() {
    return this.size === 0 ? -1 : this.buffer[this.head];
  }

  getRear() {
    return this.size === 0 ? -1 : this.buffer[(this.head + this.size - 1) % this.capacity];
  }

  isEmpty() {
    return this.size === 0;
  }

  isFull() {
    return this.size === this.capacity;
  }
}
`,
      starterCode: `class MyCircularDeque {
  /** @param {number} k capacity */
  constructor(k) {
    // Your state here
  }

  /** @param {number} value @returns {boolean} */
  insertFront(value) {
    return false;
  }

  /** @param {number} value @returns {boolean} */
  insertLast(value) {
    return false;
  }

  /** @returns {boolean} */
  deleteFront() {
    return false;
  }

  /** @returns {boolean} */
  deleteLast() {
    return false;
  }

  /** @returns {number} -1 when empty */
  getFront() {
    return -1;
  }

  /** @returns {number} -1 when empty */
  getRear() {
    return -1;
  }

  /** @returns {boolean} */
  isEmpty() {
    return true;
  }

  /** @returns {boolean} */
  isFull() {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("MyCircularDeque"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["MyCircularDeque", "insertLast", "insertLast", "insertFront", "insertFront", "getRear", "isFull", "deleteLast", "insertFront", "getFront"],
            [[3], [1], [2], [3], [4], [], [], [], [4], []],
          ],
          expected: [null, true, true, true, false, 2, true, true, true, 4],
        },
        {
          name: "Empty behaviour",
          input: [["MyCircularDeque", "getFront", "getRear", "deleteFront", "deleteLast", "isEmpty", "insertFront", "isEmpty", "getRear"], [[2], [], [], [], [], [], [9], [], []]],
          expected: [null, -1, -1, false, false, true, true, false, 9],
        },
        {
          name: "Wrap around both ends",
          input: [
            ["MyCircularDeque", "insertFront", "insertFront", "insertLast", "deleteFront", "insertLast", "getFront", "getRear", "deleteLast", "deleteLast", "getFront"],
            [[3], [1], [2], [3], [], [4], [], [], [], [], []],
          ],
          expected: [null, true, true, true, true, true, 1, 4, true, true, 1],
        },
      ],
    },
  },
];
