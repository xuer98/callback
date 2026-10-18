import type { Problem } from "./types";

// Snowflake coding bank, part V: the subtree-pruning questions, where
// deleting a node takes its whole subtree with it — the depth left after
// given deletions, the fewest deletions that cap the depth, and the same
// with the deepest possible cuts. Judged in JavaScript and Python; the
// Python judges live in seed-python-snowflake-u.ts.

export const snowflakeProblemsV: Problem[] = [
  {
    slug: "subtree-pruning-remaining-depth",
    title: "Subtree Pruning I",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "Deleting a node takes its subtree: walk down from the root, never entering a deleted node, and keep the deepest level reached.",
    prompt: [
      "A rooted tree with `n` nodes, `0` to `n - 1`, is given as a parent array: one entry is `-1`, marking the root, and every other `parent[i]` is the parent of node `i`. The root has depth `0`.",
      "",
      "Deleting a node removes it **and its whole subtree**. You are given the nodes to delete; the root may be among them, a node may be listed twice, and a listed node may already sit inside another deleted subtree.",
      "",
      "Return the largest original depth among the nodes that remain, or `-1` when nothing does.",
      "",
      "```",
      "deepestRemaining(6, [-1, 0, 0, 1, 1, 3], [3])  ->  2     // 3 takes 5 with it; 4 is left at depth 2",
      "deepestRemaining(1, [-1], [0])                   ->  -1",
      "```",
    ].join("\n"),
    hints: [
      "Build children lists and walk from the root; a deleted node is simply never entered, so its subtree never counts.",
      "Depths come from the walk itself — the parent array need not list parents before children.",
    ],
    solution: [
      "## Approach",
      "",
      "Turn the parent array into children lists and breadth-first search from the root, carrying the depth and skipping any child in the deleted set. Whatever the walk reaches is exactly what remains, so the deepest level seen is the answer; a deleted root means the walk never starts and the answer is `-1`.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Contrast this deletion rule with [Tree Height After Deletions I](/problems/height-after-deleting-nodes), where a deleted node's children are promoted. Here nothing below a deleted node survives, which is why depths can simply be read off the original tree.",
      "- Marking deleted nodes in a set, rather than deleting them one by one, makes duplicates and nested deletions free.",
    ].join("\n"),
    judge: {
      solutionCode: `// BFS from the root that never steps into a deleted node; depths are original depths.
function deepestRemaining(n, parent, deletions) {
  const children = Array.from({ length: n }, () => []);
  let root = -1;
  for (let i = 0; i < n; i++) {
    if (parent[i] === -1) root = i;
    else children[parent[i]].push(i);
  }
  const gone = new Set(deletions);
  if (root === -1 || gone.has(root)) return -1;
  let deepest = 0;
  const queue = [[root, 0]];
  for (let head = 0; head < queue.length; head++) {
    const [node, depth] = queue[head];
    if (depth > deepest) deepest = depth;
    for (const child of children[node]) {
      if (!gone.has(child)) queue.push([child, depth + 1]);
    }
  }
  return deepest;
}
`,
      starterCode: `/**
 * @param {number} n nodes 0..n-1
 * @param {number[]} parent parent[i] of node i; -1 for the root
 * @param {number[]} deletions nodes to delete, subtree included
 * @returns {number} the deepest remaining original depth, or -1
 */
function deepestRemaining(n, parent, deletions) {
  // Your code here
  return -1;
}
`,
      entry: "deepestRemaining",
      tests: [
        {
          name: "Prompt example",
          input: [6, [-1, 0, 0, 1, 1, 3], [3]],
          expected: 2,
        },
        { name: "Only the root", input: [1, [-1], []], expected: 0 },
        { name: "Deleting the root", input: [1, [-1], [0]], expected: -1 },
        {
          name: "Nothing deleted",
          input: [6, [-1, 0, 0, 1, 1, 3], []],
          expected: 3,
        },
        {
          name: "Deleting a leaf lower down the deep path",
          input: [6, [-1, 0, 0, 1, 1, 3], [5]],
          expected: 2,
        },
        {
          name: "Duplicates and a node inside a deleted subtree",
          input: [6, [-1, 0, 0, 1, 1, 3], [1, 1, 5]],
          expected: 1,
        },
        {
          name: "Parents listed after children",
          input: [4, [1, 2, -1, 0], [3]],
          expected: 2,
        },
        {
          name: "Deleting every child of the root",
          input: [3, [-1, 0, 0], [1, 2]],
          expected: 0,
        },
      ],
    },
  },
  {
    slug: "subtree-pruning-depth-limit",
    title: "Subtree Pruning II",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "When nodes within the limit must stay, the only cuts that can be made are the first nodes past it — and each is a separate cut.",
    prompt: [
      "The same tree shape: a parent array with `parent[0] = -1`, node `0` the root at depth `0`. Deleting a node removes it and its whole subtree. The root cannot be deleted, and every node already within the limit must stay.",
      "",
      "Return the fewest deletions that leave every remaining node at depth at most `k`.",
      "",
      "```",
      "fewestCuts([-1, 0, 0, 1, 1, 3], 2)     ->  1     // only node 5, at depth 3, is too deep",
      "fewestCuts([-1, 0, 0, 1, 1, 2, 2], 1)  ->  4     // the four depth-2 nodes each need their own cut",
      "```",
    ].join("\n"),
    hints: [
      "Which nodes are even allowed to be deleted? Only the ones past the limit — and deleting one of those removes everything below it.",
      "So the first too-deep node on every root-to-leaf path has to go, and nothing else can; count them.",
    ],
    solution: [
      "## Approach",
      "",
      "Because nodes within the limit stay, a cut can only land on a node whose depth exceeds `k`. Every node at depth `k + 1` must be cut (nothing above it may be, and it is too deep itself), and cutting exactly those removes everything deeper. So the answer is the number of nodes at depth `k + 1`: compute depths with one walk from the root and count.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- The rule that legal nodes must stay is what makes this a counting problem. Drop it and a single cut higher up can replace several — that version is [Subtree Pruning III](/problems/subtree-pruning-deepest-cuts).",
      "- `k = 0` means every child of the root goes; a tree already within the limit needs nothing.",
    ].join("\n"),
    judge: {
      solutionCode: `// Every node at depth k + 1 must be cut, and those cuts remove all deeper nodes.
function fewestCuts(parent, k) {
  const n = parent.length;
  const children = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i++) children[parent[i]].push(i);
  let cuts = 0;
  const queue = [[0, 0]];
  for (let head = 0; head < queue.length; head++) {
    const [node, depth] = queue[head];
    if (depth === k + 1) {
      cuts++;                      // nothing below it needs a look
      continue;
    }
    for (const child of children[node]) queue.push([child, depth + 1]);
  }
  return cuts;
}
`,
      starterCode: `/**
 * @param {number[]} parent parent[i] of node i; parent[0] is -1
 * @param {number} k the largest depth allowed to remain
 * @returns {number} the fewest deletions
 */
function fewestCuts(parent, k) {
  // Your code here
  return 0;
}
`,
      entry: "fewestCuts",
      tests: [
        {
          name: "Prompt example: one node too deep",
          input: [[-1, 0, 0, 1, 1, 3], 2],
          expected: 1,
        },
        {
          name: "Prompt example: four separate cuts",
          input: [[-1, 0, 0, 1, 1, 2, 2], 1],
          expected: 4,
        },
        {
          name: "Already within the limit",
          input: [[-1, 0, 0], 5],
          expected: 0,
        },
        { name: "Only the root", input: [[-1], 0], expected: 0 },
        {
          name: "Limit zero removes every child of the root",
          input: [[-1, 0, 0, 0], 0],
          expected: 3,
        },
        {
          name: "A path: one cut at the first node past the limit",
          input: [[-1, 0, 1, 2, 3, 4], 2],
          expected: 1,
        },
        {
          name: "A wide tree one level past the limit",
          input: [[-1, 0, 0, 0, 1, 1, 2], 1],
          expected: 3,
        },
      ],
    },
  },
  {
    slug: "subtree-pruning-deepest-cuts",
    title: "Subtree Pruning III",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "One cut per root branch that is too deep, placed at the deepest node above all of that branch's offending nodes.",
    prompt: [
      "The same tree shape: `n` nodes, a parent array with `parent[0] = -1`, node `0` the root at depth `0`. Deleting a node removes it and its whole subtree.",
      "",
      "Now **any** non-root node may be deleted, whether or not it is within the limit. First use the fewest deletions that leave every remaining node at depth at most `maxDepth`; among those plans, choose the one whose deleted nodes have the largest total original depth.",
      "",
      "Return `[deletions, depthSum]`.",
      "",
      "```",
      "bestCuts(5, [-1, 0, 1, 2, 3], 2)        ->  [1, 3]   // cut node 3 (depth 3) rather than node 1 or 2",
      "bestCuts(7, [-1, 0, 0, 1, 1, 2, 5], 2)  ->  [1, 3]   // 2, 5 or 6 would do; 6 is deepest",
      "bestCuts(1, [-1], 0)                    ->  [0, 0]",
      "```",
    ].join("\n"),
    hints: [
      "A root branch that holds any too-deep node needs at least one cut, and one cut at the branch's top is always enough — so the minimum is the number of such branches.",
      "To push a branch's single cut as deep as possible, descend while all of the branch's too-deep nodes still sit under one child.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk from the root to get depths and an order; walk it backwards to count, for every node, the too-deep nodes in its subtree. Each child of the root with a nonzero count needs exactly one cut: one is necessary, and cutting the child itself is sufficient, so the minimum number of deletions is the number of such children. For the depth sum, the cut in a branch may be any node that is an ancestor-or-self of all its too-deep nodes; the deepest such node is found by descending from the branch top while a single child still holds the whole count, stopping at a node that is itself too deep.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- The deepest valid cut is the lowest common ancestor of the branch's too-deep nodes — and when that ancestor is itself too deep, it is the cut.",
      "- `maxDepth = 0` makes every child of the root too deep: one cut each, at depth 1.",
    ].join("\n"),
    judge: {
      solutionCode: `// One cut per root branch with a too-deep node, at the deepest ancestor-or-self of all of them.
function bestCuts(n, parent, maxDepth) {
  const children = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i++) children[parent[i]].push(i);
  const depth = new Array(n).fill(0);
  const order = [0];
  for (let head = 0; head < order.length; head++) {
    const u = order[head];
    for (const v of children[u]) {
      depth[v] = depth[u] + 1;
      order.push(v);
    }
  }
  const tooDeep = new Array(n).fill(0);          // too-deep nodes in each subtree
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i];
    if (depth[u] > maxDepth) tooDeep[u] += 1;
    if (u !== 0) tooDeep[parent[u]] += tooDeep[u];
  }
  let cuts = 0;
  let depthSum = 0;
  for (const top of children[0]) {
    if (tooDeep[top] === 0) continue;
    let u = top;
    while (depth[u] <= maxDepth) {              // a too-deep node is itself the cut
      let only = -1;
      for (const v of children[u]) {
        if (tooDeep[v] === tooDeep[u]) {
          only = v;
          break;
        }
      }
      if (only === -1) break;                   // the offenders split here
      u = only;
    }
    cuts += 1;
    depthSum += depth[u];
  }
  return [cuts, depthSum];
}
`,
      starterCode: `/**
 * @param {number} n nodes 0..n-1
 * @param {number[]} parent parent[i] of node i; parent[0] is -1
 * @param {number} maxDepth the largest depth allowed to remain
 * @returns {[number, number]} [fewest deletions, largest total depth of the deleted nodes]
 */
function bestCuts(n, parent, maxDepth) {
  // Your code here
  return [0, 0];
}
`,
      entry: "bestCuts",
      tests: [
        { name: "Only the root", input: [1, [-1], 0], expected: [0, 0] },
        {
          name: "A path: cut as deep as possible",
          input: [5, [-1, 0, 1, 2, 3], 2],
          expected: [1, 3],
        },
        {
          name: "Prompt example: 2, 5 or 6 would do",
          input: [7, [-1, 0, 0, 1, 1, 2, 5], 2],
          expected: [1, 3],
        },
        {
          name: "Offenders split under the branch top: cut the top",
          input: [7, [-1, 0, 1, 1, 2, 3, 4], 2],
          expected: [1, 1],
        },
        {
          name: "Two branches, two cuts, each as deep as possible",
          input: [7, [-1, 0, 0, 1, 2, 3, 4], 2],
          expected: [2, 6],
        },
        {
          name: "Limit zero: every child of the root, at depth 1",
          input: [4, [-1, 0, 0, 0], 0],
          expected: [3, 3],
        },
        {
          name: "Nothing too deep",
          input: [4, [-1, 0, 1, 2], 3],
          expected: [0, 0],
        },
        {
          name: "Offenders split lower down",
          input: [8, [-1, 0, 1, 2, 2, 3, 4, 3], 3],
          expected: [1, 2],
        },
      ],
    },
  },
];
