import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part F: a priority task executor and a key-value
// store with prefix scans. Judged in JavaScript and Python; the Python judges
// live in seed-python-snowflake-b.ts.

export const snowflakeProblemsF: Problem[] = [
  {
    slug: "priority-task-executor",
    title: "Priority Task Executor",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A heap of entries with lazy deletion: a task added twice has two entries, and the stale one is skipped on the way out.",
    prompt: [
      "Design `TaskExecutor`:",
      "",
      "```",
      "addTask(taskId, priority, timestamp)",
      "executeTask()   // runs one task and returns its id, or null when nothing is left",
      "```",
      "",
      "`executeTask` picks the entry with the **highest priority**; among equals, the **earliest timestamp**; among those, the one added first. The same task may be added several times with different priorities or timestamps. A task runs at most once: once executed, every entry for it is ignored, including entries added later.",
      "",
      "```",
      'add("a", 1, 1) · add("a", 9, 2) · add("b", 5, 3)',
      'executeTask() -> "a"   executeTask() -> "b"   executeTask() -> null',
      "```",
    ].join("\n"),
    hints: [
      "A heap ordered by (−priority, timestamp, insertion sequence) gives the next entry in O(log n). Do not try to remove a task's other entries when it runs.",
      "Lazy deletion: keep a set of executed task ids, and when popping, discard entries whose task has already run until a live one appears.",
    ],
    solution: [
      "## Approach",
      "",
      "A binary heap of entries keyed by `(−priority, timestamp, sequence)` plus a set of executed ids. `addTask` pushes an entry; `executeTask` pops until the top belongs to a task that has not run, records it, and returns it. Stale entries — the other additions of a task that already ran — are discarded lazily on the way out, which keeps `addTask` at O(log n) without a secondary index.",
      "",
      "## Complexity",
      "",
      "O(log n) per add, amortised O(log n) per execute; O(entries) space.",
      "",
      "## Worth saying out loud",
      "",
      "- State the tie-break before coding, because the prompt usually leaves it open: priority, then timestamp, then insertion order is the natural one.",
      "- Run your own tests before saying done: a duplicate add, a re-add after execution, and an empty executor are the three that catch bugs.",
      "- A larger version with edits and removals is [Design Task Manager](/problems/design-task-manager); the same lazy-deletion idea carries over.",
    ].join("\n"),
    judge: {
      solutionCode: `// A binary heap on (-priority, timestamp, sequence) with lazy deletion of executed tasks.
class TaskExecutor {
  constructor() {
    this.heap = [];
    this.done = new Set();
    this.sequence = 0;
  }

  addTask(taskId, priority, timestamp) {
    this.push([-priority, timestamp, this.sequence++, taskId]);
  }

  executeTask() {
    while (this.heap.length > 0) {
      const taskId = this.pop()[3];
      if (!this.done.has(taskId)) {               // stale entries are skipped here
        this.done.add(taskId);
        return taskId;
      }
    }
    return null;
  }

  less(a, b) {
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  }

  push(entry) {
    const heap = this.heap;
    heap.push(entry);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  }

  pop() {
    const heap = this.heap;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let smallest = i;
        for (const child of [2 * i + 1, 2 * i + 2]) {
          if (child < heap.length && this.less(heap[child], heap[smallest])) smallest = child;
        }
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top;
  }
}
`,
      starterCode: `class TaskExecutor {
  constructor() {
    // Your state here
  }

  /** The same task may be added several times. */
  addTask(taskId, priority, timestamp) {}

  /** @returns {string|null} highest priority, then earliest timestamp, then added first; null when empty */
  executeTask() {
    return null;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("TaskExecutor"),
      tests: [
        {
          name: "Priority first, then timestamp",
          input: [
            ["TaskExecutor", "addTask", "addTask", "addTask", "executeTask", "executeTask", "executeTask", "executeTask"],
            [[], ["a", 1, 1], ["b", 5, 2], ["c", 5, 3], [], [], [], []],
          ],
          expected: [null, null, null, null, "b", "c", "a", null],
        },
        {
          name: "Prompt example: a duplicate entry is skipped",
          input: [
            ["TaskExecutor", "addTask", "addTask", "addTask", "executeTask", "executeTask", "executeTask"],
            [[], ["a", 1, 1], ["a", 9, 2], ["b", 5, 3], [], [], []],
          ],
          expected: [null, null, null, null, "a", "b", null],
        },
        {
          name: "Re-adding an executed task does nothing",
          input: [
            ["TaskExecutor", "addTask", "executeTask", "addTask", "executeTask"],
            [[], ["a", 1, 1], [], ["a", 9, 2], []],
          ],
          expected: [null, null, "a", null, null],
        },
        {
          name: "A full tie goes to the one added first",
          input: [
            ["TaskExecutor", "addTask", "addTask", "executeTask", "executeTask"],
            [[], ["x", 1, 1], ["y", 1, 1], [], []],
          ],
          expected: [null, null, null, "x", "y"],
        },
        {
          name: "Interleaved adds and executes",
          input: [
            ["TaskExecutor", "addTask", "executeTask", "addTask", "addTask", "executeTask", "executeTask", "executeTask"],
            [[], ["a", 2, 1], [], ["b", 1, 5], ["c", 3, 6], [], [], []],
          ],
          expected: [null, null, "a", null, null, "c", "b", null],
        },
        {
          name: "Empty",
          input: [
            ["TaskExecutor", "executeTask"],
            [[], []],
          ],
          expected: [null, null],
        },
      ],
    },
  },
  {
    slug: "kv-store-with-prefix-scan",
    title: "Key-Value Store With Prefix Scan",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A hash map for the point operations and a sorted key list for the scan — agree the smallest version, then extend.",
    prompt: [
      "Build a small key-value store with a range-style query:",
      "",
      "```",
      "put(key, value)",
      "get(key)        -> value, or null",
      "delete(key)     -> true if the key existed",
      "scan(prefix)    -> every key starting with prefix, in sorted order",
      "```",
      "",
      'Keys are strings; `scan("")` lists every key. Keep point operations fast and make `scan` proportional to the number of matching keys plus a logarithmic search, not to the size of the store.',
      "",
      "```",
      'put("a", 1) · put("ab", 2) · put("b", 3)',
      'scan("a")  ->  ["a", "ab"]      get("zzz")  ->  null      delete("a")  ->  true',
      "```",
    ].join("\n"),
    hints: [
      "A map answers put, get and delete. The scan needs order: keep the keys in a sorted array maintained by binary-search insertion and removal.",
      "scan is a binary search for the first key >= prefix, then a walk while keys still start with the prefix.",
    ],
    solution: [
      "## Approach",
      "",
      "Two structures with one owner: a map from key to value for the point operations, and a sorted array of keys for ordering. `put` of a new key inserts at its binary-search position, `delete` removes from both, and `scan` binary-searches to the first key at or after the prefix and walks forward while the prefix matches. Insertion into an array is O(n), which is the honest trade-off to name; a balanced tree or skip list makes it O(log n) when writes are frequent.",
      "",
      "## Complexity",
      "",
      "O(1) get; O(n) put of a new key with the sorted array (O(log n) with a tree); O(log n + m) scan for m matches.",
      "",
      "## Worth saying out loud",
      "",
      "- Agree the smallest buildable version before typing — these four operations — and only then extend. Over-scoping the first version is the usual way to run out of time.",
      "- Extensions in order of ambition: persistence (a write-ahead log replayed on start), per-key TTL (store an expiry and check it on read, sweep lazily), and replication (ship the log to followers; decide whether reads may be stale).",
      "- The transactional variant is [Nested-Transaction KV Store](/problems/transactional-kv-store).",
    ].join("\n"),
    judge: {
      solutionCode: `// A map for point operations plus a sorted key array for ordered scans.
class PrefixStore {
  constructor() {
    this.values = new Map();
    this.keys = [];                              // sorted
  }

  firstAtLeast(key) {                            // lower bound in the sorted keys
    let lo = 0;
    let hi = this.keys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.keys[mid] < key) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  put(key, value) {
    if (!this.values.has(key)) this.keys.splice(this.firstAtLeast(key), 0, key);
    this.values.set(key, value);
  }

  get(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  delete(key) {
    if (!this.values.has(key)) return false;
    this.values.delete(key);
    this.keys.splice(this.firstAtLeast(key), 1);
    return true;
  }

  scan(prefix) {
    const out = [];
    for (let i = this.firstAtLeast(prefix); i < this.keys.length && this.keys[i].startsWith(prefix); i++) {
      out.push(this.keys[i]);
    }
    return out;
  }
}
`,
      starterCode: `class PrefixStore {
  constructor() {
    // Your state here
  }

  put(key, value) {}

  /** @returns the value, or null */
  get(key) {
    return null;
  }

  /** @returns {boolean} true if the key existed */
  delete(key) {
    return false;
  }

  /** @returns {string[]} every key starting with prefix, sorted */
  scan(prefix) {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("PrefixStore"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["PrefixStore", "put", "put", "put", "scan", "scan", "scan"],
            [[], ["a", 1], ["ab", 2], ["b", 3], ["a"], [""], ["c"]],
          ],
          expected: [null, null, null, null, ["a", "ab"], ["a", "ab", "b"], []],
        },
        {
          name: "get and overwrite",
          input: [
            ["PrefixStore", "put", "get", "get", "put", "get"],
            [[], ["a", 1], ["a"], ["zzz"], ["a", 9], ["a"]],
          ],
          expected: [null, null, 1, null, null, 9],
        },
        {
          name: "delete",
          input: [
            ["PrefixStore", "put", "put", "delete", "delete", "scan", "get"],
            [[], ["a", 1], ["ab", 2], ["a"], ["a"], ["a"], ["a"]],
          ],
          expected: [null, null, null, true, false, ["ab"], null],
        },
        {
          name: "A prefix longer than any key",
          input: [
            ["PrefixStore", "put", "scan"],
            [[], ["app", 1], ["apple"]],
          ],
          expected: [null, null, []],
        },
        {
          name: "Keys come out sorted whatever the insertion order",
          input: [
            ["PrefixStore", "put", "put", "put", "put", "scan"],
            [[], ["b", 1], ["a", 2], ["ba", 3], ["ab", 4], [""]],
          ],
          expected: [null, null, null, null, null, ["a", "ab", "b", "ba"]],
        },
        {
          name: "Values can be anything",
          input: [
            ["PrefixStore", "put", "get"],
            [[], ["k", { n: 1 }], ["k"]],
          ],
          expected: [null, null, { n: 1 }],
        },
      ],
    },
  },
];
