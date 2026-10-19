import type { Problem } from "./types";
import { TREE_BUILDER } from "./seed-snowflake-t";

// Snowflake coding prompts from the 2026 interview reports that the bank
// did not yet hold: the full-tree boundary variant and the workflow DAG.
// Python in seed-python-snowflake-x.ts.

export const snowflakeTrendProblems: Problem[] = [
  {
    slug: "boundary-of-full-binary-tree",
    title: "Boundary of a Full Binary Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "With no missing children the two edges are plain spines: walk them and the leaves separately, and count the corners once.",
    prompt: [
      "A binary tree is **full**: every node has either two children or none. Return its boundary anti-clockwise, starting at the root: the left edge from the root down to the leftmost leaf's parent, then every leaf from left to right, then the right edge from the rightmost leaf's parent back up to the root's right child. No node appears twice, and a lone root is its own boundary. Trees arrive in level order with `null` for missing children.",
      "",
      "```",
      "boundary([1, 2, 3, 4, 5, 6, 7])          ->  [1, 2, 4, 5, 6, 7, 3]",
      "boundary([1, 2, 3, null, null, 6, 7])    ->  [1, 2, 6, 7, 3]        // 2 is a leaf, so the left edge is just the root",
      "boundary([1])                            ->  [1]",
      "```",
    ].join("\n"),
    hints: [
      "Full means a node that is not a leaf always has both children, so each edge is a straight walk: keep going left (or right) until the next node is a leaf.",
      "Three passes — the left edge without its leaf, every leaf left to right, the right edge without its leaf in reverse — and the single-node tree handled before any of them.",
    ],
    solution: [
      "## Approach",
      "",
      "The general version of this question spends most of its lines on fallbacks: a left edge that steps to the right child when there is no left one, and the mirror on the other side. A full tree removes them. The left edge is the leftmost path from the root, the right edge the rightmost path, and the leaves are whatever a left-to-right traversal reaches. So: push the root, walk left pushing each node until the next step is a leaf, run a pre-order traversal pushing only leaves, walk right collecting until the next step is a leaf, and append that right walk reversed. The two corner leaves are picked up by the leaf pass alone, which is why each edge walk stops short of its leaf. A root with no children is a leaf and is returned on its own, before any edge walk could count it twice.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(h) extra space for the stack and the right edge.",
      "",
      "## Worth saying out loud",
      "",
      '- Ask what "full" means in the room. Some interviewers say full, complete and balanced in one breath, which is a perfect tree: then the leaves are exactly the bottom level and both edges have the same length.',
      "- The onsite phrasing asks for the **sum** of the left edge, the right edge and the leaves instead of the list: the same three walks with addition, and the same care that the root and the two corner leaves count once.",
      "- Without the full guarantee, the left edge takes the left child when it exists and the right child otherwise, and the right edge mirrors that; say so before you write the easier version.",
      "- Tests to name: a lone root, a root whose two children are leaves, a leaf directly under the root on one side only, and a tree deeper on the right than on the left.",
    ].join("\n"),
    judge: {
      solutionCode: `// Left spine, then leaves left to right, then the right spine reversed; each spine stops short of its leaf.
function boundary(root) {
  if (!root) return [];
  const isLeaf = (node) => !node.left && !node.right;
  if (isLeaf(root)) return [root.val];
  const out = [root.val];
  for (let node = root.left; !isLeaf(node); node = node.left) out.push(node.val);
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (isLeaf(node)) out.push(node.val);
    else stack.push(node.right, node.left);           // left is popped first
  }
  const right = [];
  for (let node = root.right; !isLeaf(node); node = node.right) right.push(node.val);
  for (let i = right.length - 1; i >= 0; i--) out.push(right[i]);
  return out;
}
`,
      starterCode: `/** Tree nodes are { val, left, right }; children are null when absent. */
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root a full binary tree
 * @returns {number[]} the boundary anti-clockwise from the root, each node once
 */
function boundary(root) {
  // Your code here
  return [];
}
`,
      entry: "__judgeBoundary",
      driverCode: `${TREE_BUILDER}
function __judgeBoundary(values) {
  return boundary(__buildTree(values));
}`,
      tests: [
        {
          name: "A perfect tree of seven",
          input: [[1, 2, 3, 4, 5, 6, 7]],
          expected: [1, 2, 4, 5, 6, 7, 3],
        },
        {
          name: "The right child is a leaf",
          input: [[1, 2, 3, 4, 5]],
          expected: [1, 2, 4, 5, 3],
        },
        {
          name: "The left child is a leaf",
          input: [[1, 2, 3, null, null, 6, 7]],
          expected: [1, 2, 6, 7, 3],
        },
        { name: "A lone root", input: [[1]], expected: [1] },
        {
          name: "Deeper on the left",
          input: [[1, 2, 3, 4, 5, null, null, 8, 9]],
          expected: [1, 2, 4, 8, 9, 5, 3],
        },
        {
          name: "Deeper on the right",
          input: [[1, 2, 3, null, null, 6, 7, null, null, 14, 15]],
          expected: [1, 2, 6, 14, 15, 7, 3],
        },
        {
          name: "A perfect tree of fifteen",
          input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
          expected: [1, 2, 4, 8, 9, 10, 11, 12, 13, 14, 15, 7, 3],
        },
        {
          name: "Leaves at mixed depths between the spines",
          input: [[1, 2, 3, 4, 5, 6, 7, null, null, 10, 11, 12, 13]],
          expected: [1, 2, 4, 10, 11, 12, 13, 7, 3],
        },
        { name: "Empty tree", input: [[]], expected: [] },
      ],
    },
  },
  {
    slug: "workflow-dependencies",
    title: "Workflow With Dependencies",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Insertion-ordered tasks with a dependency set each: refuse an edge that would close a cycle, emit the earliest ready task, and copy both structures.",
    prompt: [
      "Build a small workflow of named tasks and the dependencies between them:",
      "",
      "```",
      "workflow = Workflow()",
      "workflow.addTask(name)                  // a new task; a name already present is left alone",
      "workflow.addDependency(task, dependsOn) // task may run only after dependsOn; true if recorded",
      "workflow.order()                        // every task, each after everything it depends on",
      "workflow.deepCopy()                     // an independent Workflow with the same tasks and dependencies",
      "```",
      "",
      "## Rules",
      "",
      "- A dependency that would create a cycle, including a task depending on itself, is refused: `addDependency` returns `false` and records nothing. Both names must already be tasks.",
      "- `order()` is deterministic: whenever more than one task is ready, the one added first goes next. With no dependencies it is the insertion order.",
      "- Changes to a copy never show in the original, and the other way round.",
      "",
      "```",
      'addTask("build") · addTask("test") · addTask("deploy")',
      'addDependency("test", "build")    ->  true',
      'addDependency("deploy", "test")   ->  true',
      'addDependency("build", "deploy")  ->  false     // would close a cycle',
      'order()                           ->  ["build", "test", "deploy"]',
      "```",
    ].join("\n"),
    hints: [
      "Keep the tasks in an array for insertion order and a map from task to the set of tasks it depends on. A new dependency task → dependsOn closes a cycle exactly when dependsOn already depends on task, directly or transitively; one depth-first search from dependsOn answers that.",
      "For the order, count each task's unmet dependencies and repeatedly take the earliest-added task whose count is zero; when it is emitted, decrement every task that depends on it. The copy is a fresh Workflow fed the same tasks and the same dependency pairs.",
    ],
    solution: [
      "## Approach",
      "",
      "Two structures: `tasks`, the names in the order they were added, and `deps`, a map from each task to the set of tasks it depends on. Adding a task registers an empty set; adding a name twice does nothing, so the insertion order stays stable. `addDependency(task, dependsOn)` first checks that `dependsOn` does not already reach `task` through the dependency sets, with a depth-first walk from `dependsOn`, and refuses when it does, because recording the edge would close a cycle. Refusing at insert time keeps the workflow acyclic at all times, so `order()` never has to fail.",
      "",
      "`order()` is Kahn's algorithm with a fixed tie-break: compute how many unmet dependencies each task has and a reverse index from a task to the tasks that depend on it, then repeatedly emit the earliest-added task whose count is zero and decrement its dependents. Because the graph is acyclic, a zero-count task always exists until every task is out. `deepCopy()` builds a new Workflow, adds the tasks in the same order and copies each dependency set, so the two share no containers.",
      "",
      "## Complexity",
      "",
      "O(V + E) per dependency check, and O(V² + E) for the order as written, because each step scans for the earliest ready task; a min-heap keyed by insertion index makes it O((V + E) log V). The copy is O(V + E).",
      "",
      "## Worth saying out loud",
      "",
      "- Refusing cycles at insert time costs a search per `addDependency`; the alternative is to accept any edge and have `order()` report the cycle, which is cheaper on writes and the right call when dependencies arrive in bulk. Name the trade-off, pick one, and keep the other as a follow-up.",
      '- Say what "deep" protects: the task list, the dependency sets, and the task payloads if tasks ever carry mutable data.',
      "- The usual follow-ups: run tasks in parallel waves (emit every ready task at once instead of one), remove a task and its edges, and persist the graph as an edge list. Another graded walk over a DAG is [DAG Permissions I](/problems/dag-letter-permissions).",
      "- Tests to name: an empty workflow, independent tasks keeping insertion order, a refused self-dependency, a diamond, and a copy changed after copying.",
    ].join("\n"),
    judge: {
      solutionCode: `// Tasks in insertion order plus a dependency set per task; cycles are refused when the edge arrives.
class Workflow {
  constructor() {
    this.tasks = [];                       // names, in the order added
    this.deps = new Map();                 // task -> Set of the tasks it depends on
  }

  addTask(name) {
    if (this.deps.has(name)) return;
    this.tasks.push(name);
    this.deps.set(name, new Set());
  }

  /** Does \`from\` depend on \`target\`, directly or through other tasks? */
  reaches(from, target) {
    const stack = [from];
    const seen = new Set();
    while (stack.length) {
      const node = stack.pop();
      if (node === target) return true;
      if (seen.has(node)) continue;
      seen.add(node);
      for (const dep of this.deps.get(node)) stack.push(dep);
    }
    return false;
  }

  addDependency(task, dependsOn) {
    if (!this.deps.has(task) || !this.deps.has(dependsOn)) throw new Error("unknown task");
    if (this.reaches(dependsOn, task)) return false;   // task === dependsOn included
    this.deps.get(task).add(dependsOn);
    return true;
  }

  order() {
    const unmet = new Map(this.tasks.map((task) => [task, this.deps.get(task).size]));
    const dependents = new Map(this.tasks.map((task) => [task, []]));
    for (const [task, deps] of this.deps) {
      for (const dep of deps) dependents.get(dep).push(task);
    }
    const out = [];
    const done = new Set();
    while (out.length < this.tasks.length) {
      const next = this.tasks.find((task) => !done.has(task) && unmet.get(task) === 0);
      done.add(next);
      out.push(next);
      for (const task of dependents.get(next)) unmet.set(task, unmet.get(task) - 1);
    }
    return out;
  }

  deepCopy() {
    const copy = new Workflow();
    for (const task of this.tasks) copy.addTask(task);
    for (const [task, deps] of this.deps) {
      for (const dep of deps) copy.deps.get(task).add(dep);
    }
    return copy;
  }
}
`,
      starterCode: `class Workflow {
  constructor() {
    // Your state here
  }

  addTask(name) {}

  /** @returns {boolean} true if recorded, false if it would create a cycle */
  addDependency(task, dependsOn) {
    return false;
  }

  /** @returns {string[]} every task after everything it depends on; earliest added first among ready tasks */
  order() {
    return [];
  }

  /** @returns {Workflow} an independent copy */
  deepCopy() {
    return new Workflow();
  }
}
`,
      entry: "__judgeWorkflow",
      // Operations are [method, slot, ...args]; "copy" stores slot's deepCopy() under the named slot.
      driverCode: `function __judgeWorkflow(operations) {
  const slots = { a: new Workflow() };
  const out = [];
  for (const [op, slot, ...args] of operations) {
    if (op === "copy") {
      slots[args[0]] = slots[slot].deepCopy();
      out.push(null);
      continue;
    }
    const result = slots[slot][op](...args);
    out.push(result === undefined ? null : result);
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              ["addTask", "a", "build"],
              ["addTask", "a", "test"],
              ["addTask", "a", "deploy"],
              ["addDependency", "a", "test", "build"],
              ["addDependency", "a", "deploy", "test"],
              ["addDependency", "a", "build", "deploy"],
              ["order", "a"],
            ],
          ],
          expected: [
            null,
            null,
            null,
            true,
            true,
            false,
            ["build", "test", "deploy"],
          ],
        },
        {
          name: "Ties go to the task added first",
          input: [
            [
              ["addTask", "a", "a"],
              ["addTask", "a", "b"],
              ["addTask", "a", "c"],
              ["addDependency", "a", "a", "c"],
              ["order", "a"],
            ],
          ],
          expected: [null, null, null, true, ["b", "c", "a"]],
        },
        {
          name: "A task cannot depend on itself",
          input: [
            [
              ["addTask", "a", "solo"],
              ["addDependency", "a", "solo", "solo"],
              ["order", "a"],
            ],
          ],
          expected: [null, false, ["solo"]],
        },
        {
          name: "Adding a task twice changes nothing",
          input: [
            [
              ["addTask", "a", "x"],
              ["addTask", "a", "x"],
              ["addTask", "a", "y"],
              ["order", "a"],
            ],
          ],
          expected: [null, null, null, ["x", "y"]],
        },
        {
          name: "Independent tasks keep insertion order",
          input: [
            [
              ["addTask", "a", "z"],
              ["addTask", "a", "y"],
              ["addTask", "a", "x"],
              ["order", "a"],
            ],
          ],
          expected: [null, null, null, ["z", "y", "x"]],
        },
        {
          name: "A diamond",
          input: [
            [
              ["addTask", "a", "a"],
              ["addTask", "a", "b"],
              ["addTask", "a", "c"],
              ["addTask", "a", "d"],
              ["addDependency", "a", "d", "b"],
              ["addDependency", "a", "d", "c"],
              ["addDependency", "a", "b", "a"],
              ["addDependency", "a", "c", "a"],
              ["addDependency", "a", "a", "d"],
              ["order", "a"],
            ],
          ],
          expected: [
            null,
            null,
            null,
            null,
            true,
            true,
            true,
            true,
            false,
            ["a", "b", "c", "d"],
          ],
        },
        {
          name: "The copy is independent both ways",
          input: [
            [
              ["addTask", "a", "a"],
              ["addTask", "a", "b"],
              ["addDependency", "a", "b", "a"],
              ["copy", "a", "b"],
              ["addTask", "b", "c"],
              ["addDependency", "b", "c", "b"],
              ["order", "a"],
              ["order", "b"],
              ["addTask", "a", "d"],
              ["addDependency", "a", "a", "d"],
              ["order", "a"],
              ["order", "b"],
            ],
          ],
          expected: [
            null,
            null,
            true,
            null,
            null,
            true,
            ["a", "b"],
            ["a", "b", "c"],
            null,
            true,
            ["d", "a", "b"],
            ["a", "b", "c"],
          ],
        },
        { name: "No tasks", input: [[["order", "a"]]], expected: [[]] },
      ],
    },
  },
];
