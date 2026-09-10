import type { Problem } from "./types";

// Apple phone-screen bank, part D: Design Task Manager, unit conversion in a
// tree, and Valid Sudoku. Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsD: Problem[] = [
  {
    slug: "design-task-manager",
    title: "Design Task Manager",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "A heap cannot update a key — push the new entry and discard stale ones at pop time.",
    prompt: [
      "Design a task manager over tasks that carry `(userId, taskId, priority)`. Task ids are unique.",
      "",
      "- `TaskManager(tasks)` — initialise with a list of `[userId, taskId, priority]` triples.",
      "- `add(userId, taskId, priority)` — add a new task.",
      "- `edit(taskId, newPriority)` — change an existing task's priority.",
      "- `rmv(taskId)` — remove an existing task.",
      "- `execTop()` — run and remove the highest-priority task, **breaking ties by the larger task id**, and return its `userId`; return `-1` when no task is left.",
      "",
      "```",
      "tm = TaskManager([[1, 101, 10], [2, 102, 20], [3, 103, 15]])",
      "tm.add(4, 104, 5)",
      "tm.edit(102, 8)",
      "tm.execTop()   ->  3      // task 103 (priority 15) runs",
      "tm.rmv(101)",
      "tm.add(5, 105, 15)",
      "tm.execTop()   ->  5      // task 105 (priority 15) runs",
      "```",
      "",
      "Reported as the second of two Apple phone screens for a Senior Software Engineer — both were recent LeetCode problems, which is a signal on its own: this screener was pulling from the current set, not a 2019 list.",
      "",
      "## Worth asking out loud",
      "",
      "Can `edit` and `rmv` be called on a task that does not exist? Are priorities and task ids bounded? How many operations — does the heap's growth under repeated edits matter? Is `execTop` called far more often than `edit`?",
    ].join("\n"),
    hints: [
      "Keep an authoritative map from taskId to (userId, priority) alongside a max-heap ordered by (priority, taskId). add and edit push a fresh heap entry; rmv only touches the map.",
      "execTop pops until the entry agrees with the map — same task present, same priority — then removes it from the map and returns the user. Entries that disagree are stale leftovers of edits and removals; discard them.",
    ],
    solution: [
      "## Approach",
      "",
      "The trap is `edit`. A heap cannot update a key, so the honest options are a heap with lazy deletion, or a sorted structure keyed on `(priority, taskId)`. Say \"I will push the new entry and discard stale ones at pop time, validating against the authoritative map\" — that sentence is the answer. The map holds `taskId -> (userId, priority)`; the heap holds `(priority, taskId)` entries and may hold several per task. `execTop` pops while the top is stale (task gone, or its priority no longer matches), then commits the first live one.",
      "",
      "## Complexity",
      "",
      "All operations O(log n) amortised; O(n + stale entries) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **The heap grows forever if I edit a lot?** True, and worth conceding before they say it. Bound it by rebuilding when stale entries outnumber live ones, which keeps the amortised cost the same.",
      "- **Make `rmv` O(1) and keep the heap clean?** An indexed binary heap that stores each task's position, with sift-up and sift-down on update. More code, real O(log n) deletes. Offer it; write it only if asked.",
      "- Verify the tie-break by hand on two equal priorities. In Python, negating both fields is what makes one min-heap serve a max on priority and a max on id.",
    ].join("\n"),
    judge: {
      solutionCode: `// Max-heap on [priority, taskId]; stale entries are skipped at pop time.
class MaxHeap {
  constructor() { this.a = []; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  static before(x, y) { return x[0] > y[0] || (x[0] === y[0] && x[1] > y[1]); }
  push(item) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!MaxHeap.before(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let best = i;
        if (l < a.length && MaxHeap.before(a[l], a[best])) best = l;
        if (r < a.length && MaxHeap.before(a[r], a[best])) best = r;
        if (best === i) break;
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return top;
  }
}

class TaskManager {
  constructor(tasks) {
    this.info = new Map(); // taskId -> [userId, priority]  (authoritative)
    this.heap = new MaxHeap();
    for (const [userId, taskId, priority] of tasks) this.add(userId, taskId, priority);
  }

  add(userId, taskId, priority) {
    this.info.set(taskId, [userId, priority]);
    this.heap.push([priority, taskId]);
  }

  edit(taskId, newPriority) {
    const [userId] = this.info.get(taskId);
    this.info.set(taskId, [userId, newPriority]);
    this.heap.push([newPriority, taskId]); // the old entry becomes stale
  }

  rmv(taskId) {
    this.info.delete(taskId);
  }

  execTop() {
    while (this.heap.size() > 0) {
      const [priority, taskId] = this.heap.pop();
      const current = this.info.get(taskId);
      if (!current || current[1] !== priority) continue; // stale -> discard
      this.info.delete(taskId);
      return current[0];
    }
    return -1;
  }
}
`,
      starterCode: `class TaskManager {
  /** @param {[number, number, number][]} tasks [userId, taskId, priority] triples */
  constructor(tasks) {
    // Your state here
  }

  add(userId, taskId, priority) {
    // Your code here
  }

  edit(taskId, newPriority) {
    // Your code here
  }

  rmv(taskId) {
    // Your code here
  }

  /** @returns {number} the userId of the task that ran, or -1 */
  execTop() {
    return -1;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let manager = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "TaskManager") {
      manager = new TaskManager(...args[i]);
      out.push(null);
    } else {
      out.push(manager[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            ["TaskManager", "add", "edit", "execTop", "rmv", "add", "execTop"],
            [[[[1, 101, 10], [2, 102, 20], [3, 103, 15]]], [4, 104, 5], [102, 8], [], [101], [5, 105, 15], []],
          ],
          expected: [null, null, null, 3, null, null, 5],
        },
        {
          name: "Equal priorities: the larger task id runs first",
          input: [["TaskManager", "execTop", "execTop", "execTop"], [[[[1, 1, 5], [2, 2, 5]]], [], [], []]],
          expected: [null, 2, 1, -1],
        },
        {
          name: "Editing a priority down reorders",
          input: [["TaskManager", "edit", "execTop", "execTop", "execTop"], [[[[1, 10, 50], [2, 20, 40]]], [10, 30], [], [], []]],
          expected: [null, null, 2, 1, -1],
        },
        {
          name: "Several edits leave stale entries behind",
          input: [
            ["TaskManager", "edit", "edit", "edit", "add", "execTop", "execTop", "execTop"],
            [[[[7, 1, 1]]], [1, 5], [1, 3], [1, 9], [8, 2, 9], [], [], []],
          ],
          expected: [null, null, null, null, null, 8, 7, -1],
        },
        {
          name: "Removed tasks never run",
          input: [["TaskManager", "rmv", "execTop", "rmv", "execTop"], [[[[1, 1, 9], [2, 2, 1]]], [1], [], [2], []]],
          expected: [null, null, 2, null, -1],
        },
        {
          name: "Empty manager, then one task",
          input: [["TaskManager", "execTop", "add", "execTop", "execTop"], [[[]], [], [1, 1, 1], [], []]],
          expected: [null, -1, null, 1, -1],
        },
      ],
    },
  },
  {
    slug: "unit-conversion-tree",
    title: "Unit Conversion in a Tree, Then Any-to-Any",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "One DFS multiplies factors down the tree; the modular inverse is what makes arbitrary queries work.",
    prompt: [
      "There are `n` unit types, numbered `0` to `n - 1`, and unit `0` is the base. Each conversion `[source, target, factor]` means one unit of `source` equals `factor` units of `target`. The conversions form a tree rooted at `0`, and every factor is at least 1.",
      "",
      "## Phase 1 — `baseUnitConversions(n, conversions)`",
      "",
      "Return `ans` where `ans[i]` is how many units of type `i` equal one unit of type `0`, modulo `1_000_000_007`.",
      "",
      "```",
      "baseUnitConversions(3, [[0, 1, 2], [1, 2, 3]])  ->  [1, 2, 6]",
      "```",
      "",
      "## Phase 2 — `queryConversions(n, conversions, queries)`",
      "",
      "Each query `[a, b]` asks how many units of `b` equal one unit of `a`, again modulo `1_000_000_007`. Return one answer per query.",
      "",
      "```",
      "queryConversions(3, [[0, 1, 2], [1, 2, 3]], [[0, 2], [2, 0]])  ->  [6, 166666668]",
      "```",
      "",
      "Products can exceed 2^53 before the modulo — in JavaScript, do the arithmetic in `BigInt` (the harness converts your answers back to numbers).",
      "",
      "Reported as the first of two Apple phone screens for a Senior Software Engineer; the second was Design Task Manager.",
      "",
      "## Worth asking out loud",
      "",
      "Is the graph guaranteed to be a tree rooted at 0, or could it be a general graph with cycles? Can `n` be large enough that recursion depth matters? Are the factors integers? Is the modulus prime — so I can invert with Fermat?",
    ].join("\n"),
    hints: [
      "Phase 1 is one traversal from the root: ans[0] = 1 and ans[child] = ans[parent] × factor (mod p). Use an explicit stack; the tree can be a path.",
      "Phase 2 is ans[b] / ans[a] — but you cannot divide under a modulus. Because p is prime, Fermat gives the inverse: ans[a]^(p−2) mod p. Multiply instead of dividing.",
    ],
    solution: [
      "## Approach",
      "",
      "Phase 1 is a single DFS from the root multiplying factors down; an explicit stack keeps a path-shaped tree from blowing the recursion limit. Phase 2 is where people stall: you cannot divide under a modulus. Say \"`ans[b] / ans[a]` becomes `ans[b] · ans[a]^-1`, and since 10^9 + 7 is prime I get the inverse from Fermat as `pow(x, p - 2, p)`.\" That one sentence is the whole difference between the two problems. JavaScript needs `BigInt` for the products, so the reference keeps everything as `BigInt` and lets the harness convert.",
      "",
      "## Complexity",
      "",
      "O(n) to build the table, O(log p) per query for the modular exponentiation; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **A general graph, not a tree?** That is LeetCode 399, Evaluate Division: BFS/DFS per query, or union-find with weights — and a general graph can contain an inconsistent cycle, so you need a validation pass. Raising that unprompted is a strong move.",
      "- **Why iterative and not recursive?** `n` up to 10^5 and the tree can be a path, so recursion blows the stack.",
      "- **Round-trip check:** converting a→b then b→a must multiply to 1 mod p. It is a two-line test and it catches an inverted factor immediately.",
    ].join("\n"),
    judge: {
      solutionCode: `const MOD = 1000000007n;

function modPow(base, exp) {
  let result = 1n;
  base %= MOD;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % MOD;
    base = (base * base) % MOD;
    exp >>= 1n;
  }
  return result;
}

// ans[i] = units of i per one unit of 0. Iterative DFS: the tree can be a path.
function baseUnitConversions(n, conversions) {
  const children = Array.from({ length: n }, () => []);
  for (const [source, target, factor] of conversions) children[source].push([target, BigInt(factor)]);
  const ans = new Array(n).fill(0n);
  ans[0] = 1n;
  const stack = [0];
  while (stack.length > 0) {
    const u = stack.pop();
    for (const [v, factor] of children[u]) {
      ans[v] = (ans[u] * factor) % MOD;
      stack.push(v);
    }
  }
  return ans;
}

// One unit of a == ans[b] * inverse(ans[a]) units of b; Fermat inverse since MOD is prime.
function queryConversions(n, conversions, queries) {
  const ans = baseUnitConversions(n, conversions);
  return queries.map(([a, b]) => (ans[b] * modPow(ans[a], MOD - 2n)) % MOD);
}
`,
      starterCode: `const MOD = 1000000007n;

/**
 * @param {number} n
 * @param {[number, number, number][]} conversions [source, target, factor]
 * @returns {(bigint|number)[]} ans[i] = units of i per one unit of 0, mod 1e9+7
 */
function baseUnitConversions(n, conversions) {
  // Your code here
  return new Array(n).fill(0);
}

/**
 * @param {[number, number][]} queries [a, b] -> units of b per one unit of a
 * @returns {(bigint|number)[]}
 */
function queryConversions(n, conversions, queries) {
  // Your code here
  return queries.map(() => 0);
}
`,
      entry: "__judgeUnits",
      driverCode: `function __judgeUnits(kind, n, conversions, queries) {
  const out = kind === "base" ? baseUnitConversions(n, conversions) : queryConversions(n, conversions, queries);
  return Array.from(out, Number);
}`,
      tests: [
        { name: "Base: prompt example", input: ["base", 3, [[0, 1, 2], [1, 2, 3]], null], expected: [1, 2, 6] },
        {
          name: "Base: a wider tree",
          input: ["base", 7, [[0, 1, 2], [0, 2, 3], [1, 3, 4], [1, 4, 5], [2, 5, 2], [4, 6, 3]], null],
          expected: [1, 2, 3, 8, 10, 6, 30],
        },
        {
          name: "Base: conversions listed out of order",
          input: ["base", 5, [[4, 3, 4], [2, 4, 2], [1, 2, 3], [0, 1, 2]], null],
          expected: [1, 2, 6, 48, 12],
        },
        {
          name: "Base: products overflow 2^53 before the modulo",
          input: ["base", 4, [[0, 1, 1000000000], [1, 2, 1000000000], [2, 3, 1000000000]], null],
          expected: [1, 1000000000, 49, 999999664],
        },
        { name: "Base: a single unit", input: ["base", 1, [], null], expected: [1] },
        {
          name: "Queries: prompt example plus inverses",
          input: ["queries", 3, [[0, 1, 2], [1, 2, 3]], [[0, 2], [2, 0], [1, 2], [2, 1], [0, 0]]],
          expected: [6, 166666668, 3, 333333336, 1],
        },
        {
          name: "Queries: inverses of large factors",
          input: ["queries", 3, [[0, 1, 1000000000], [1, 2, 1000000000]], [[2, 0], [1, 2], [0, 2], [2, 1]]],
          expected: [448979595, 1000000000, 49, 857142863],
        },
      ],
    },
  },
  {
    slug: "valid-sudoku",
    title: "Valid Sudoku",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "One pass, three sets — and derive the box index out loud instead of asserting it.",
    prompt: [
      "Given a 9×9 board, decide whether the filled cells are valid: no repeated digit in any row, any column, or any 3×3 sub-box. Empty cells are `'.'` and need no validation. The board does not have to be solvable — only the filled cells are checked.",
      "",
      "The board arrives as nine strings of nine characters.",
      "",
      "```",
      "[\"53..7....\",",
      " \"6..195...\",",
      " \".98....6.\",",
      " \"8...6...3\",",
      " \"4..8.3..1\",",
      " \"7...2...6\",",
      " \".6....28.\",",
      " \"...419..5\",",
      " \"....8..79\"]   ->  true",
      "```",
      "",
      "Reported as the entire backend screening round of an Apple full-stack loop; the same loop's frontend screen was React and CSS theory.",
      "",
      "## Worth asking out loud",
      "",
      "Is the board always 9×9, or should the code generalise to n²×n²? Are the characters guaranteed to be `'1'`–`'9'` or `'.'`? Do you want the validator, or the solver as a follow-up?",
    ].join("\n"),
    hints: [
      "Keep nine sets each for rows, columns and boxes and make a single pass over the cells; the first digit already present in any of its three sets ends the check.",
      "The box index is (row ÷ 3) × 3 + column ÷ 3 with integer division — derive it out loud, because getting it wrong fails silently.",
    ],
    solution: [
      "## Approach",
      "",
      "Easy problem, one thing to get right: do it in one pass with three families of sets, not three passes. For each filled cell, compute its box as `(i // 3) * 3 + j // 3`, check the digit against the row set, the column set and the box set, and add it to all three. The first collision returns false.",
      "",
      "## Complexity",
      "",
      "O(81) time and space — constant; O(n⁴) in cells for an n²×n² board, which is linear in the input.",
      "",
      "## Worth saying out loud",
      "",
      "- **n²×n²?** The same code generalises with box side n; call the complexity linear in the number of cells.",
      "- **Now solve it** is LeetCode 37: backtracking with the same three sets as the constraint check. Mention that the validator you just wrote is the inner loop of the solver.",
      "- Do not reach for a single set of encoded strings like `\"r\" + i + v` to save lines. It works, but it is slower and harder to read, and readability is being scored.",
    ].join("\n"),
    judge: {
      solutionCode: `function isValidSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const v = board[i][j];
      if (v === ".") continue;
      const b = Math.floor(i / 3) * 3 + Math.floor(j / 3);
      if (rows[i].has(v) || cols[j].has(v) || boxes[b].has(v)) return false;
      rows[i].add(v);
      cols[j].add(v);
      boxes[b].add(v);
    }
  }
  return true;
}
`,
      starterCode: `/**
 * @param {string[]} board nine strings of nine characters, '.' for empty
 * @returns {boolean}
 */
function isValidSudoku(board) {
  // Your code here
  return false;
}
`,
      entry: "isValidSudoku",
      tests: [
        {
          name: "Prompt example is valid",
          input: [["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]],
          expected: true,
        },
        {
          name: "Column duplicate: an 8 above another 8",
          input: [["83..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]],
          expected: false,
        },
        {
          name: "Row duplicate",
          input: [["553.7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]],
          expected: false,
        },
        {
          name: "Box duplicate only: an 8 in the top-left box",
          input: [["53..7....", "68.195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]],
          expected: false,
        },
        {
          name: "Empty board is valid",
          input: [[".........", ".........", ".........", ".........", ".........", ".........", ".........", ".........", "........."]],
          expected: true,
        },
        {
          name: "A solved board is valid",
          input: [["534678912", "672195348", "198342567", "859761423", "426853791", "713924856", "961537284", "287419635", "345286179"]],
          expected: true,
        },
        {
          name: "Duplicate in the last box",
          input: [[".........", ".........", ".........", ".........", ".........", ".........", "......1..", ".........", "........1"]],
          expected: false,
        },
      ],
    },
  },
];
