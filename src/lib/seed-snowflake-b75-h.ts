import type { Problem } from "./types";
import { TREE_BUILDER } from "./seed-snowflake-h";
import { TREE_SERIALIZER } from "./seed-snowflake-lc-c";

// Blind 75 for the Snowflake backend screen, part H: the first half of the
// tree group, plus Maximum Width of Binary Tree, named in the recruiter's
// email for the backend round. Trees arrive in level order with null for
// missing children. Python in seed-python-snowflake-u.ts.

const NODE_DOC = `/** Tree nodes are { val, left, right }; children are null when absent. */`;

/** A 40-node left chain: deep enough to overflow naive index numbering. */
const LEFT_CHAIN = (() => {
  const values: (number | null)[] = [1];
  for (let i = 2; i <= 40; i++) values.push(i, null);
  return values;
})();

export const snowflakeBlindProblemsH: Problem[] = [
  {
    slug: "maximum-depth-of-binary-tree",
    title: "Maximum Depth of Binary Tree",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "One plus the deeper child, recursively — or count levels with a queue.",
    prompt: [
      "Return the number of nodes on the longest path from the root down to a leaf (0 for an empty tree).",
      "",
      "```",
      "maxDepth([3, 9, 20, null, null, 15, 7])  ->  3",
      "maxDepth([])                             ->  0",
      "```",
    ].join("\n"),
    hints: ["depth(node) = 1 + max(depth(left), depth(right)), with depth(null) = 0."],
    solution: [
      "## Approach",
      "",
      "Post-order recursion: a missing node has depth 0; otherwise one plus the larger child depth. Level-order with a queue counts the same thing iteratively.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(height) stack.",
      "",
      "## Worth saying out loud",
      "",
      "- A 10⁵-node chain overflows the recursion stack in some runtimes; the queue version does not.",
      "- Minimum depth is the trap variant: a node with one child is not a leaf.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {number}
 */
function maxDepth(root) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeDepth",
      driverCode: `${TREE_BUILDER}
function __judgeDepth(values) {
  return maxDepth(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
        { name: "Right chain", input: [[1, null, 2]], expected: 2 },
        { name: "Empty", input: [[]], expected: 0 },
        { name: "Root only", input: [[1]], expected: 1 },
      ],
    },
  },
  {
    slug: "same-tree",
    title: "Same Tree",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Both null: equal. One null or different values: not. Otherwise recurse on both children.",
    prompt: [
      "Return whether two binary trees are structurally identical with equal values at every node.",
      "",
      "```",
      "isSameTree([1, 2, 3], [1, 2, 3])        ->  true",
      "isSameTree([1, 2], [1, null, 2])        ->  false",
      "```",
    ].join("\n"),
    hints: ["Compare the roots, then recurse on the left pair and the right pair. Two nulls match; one null does not."],
    solution: [
      "## Approach",
      "",
      "Recursive comparison node by node. The iterative version pushes pairs onto a stack; it is the same three checks per pair.",
      "",
      "## Complexity",
      "",
      "O(min(n, m)) time, O(height) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Comparing serialisations with null markers also works and is the basis of Subtree of Another Tree.",
      "- Symmetric Tree is this function called on `(left, mirror of right)`.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function isSameTree(p, q) {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {object | null} p
 * @param {object | null} q
 * @returns {boolean}
 */
function isSameTree(p, q) {
  // Your code here
  return false;
}
`,
      entry: "__judgeSame",
      driverCode: `${TREE_BUILDER}
function __judgeSame(a, b) {
  return isSameTree(__buildTree(a), __buildTree(b));
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3], [1, 2, 3]], expected: true },
        { name: "Different shape", input: [[1, 2], [1, null, 2]], expected: false },
        { name: "Different values", input: [[1, 2, 1], [1, 1, 2]], expected: false },
        { name: "Both empty", input: [[], []], expected: true },
        { name: "One empty", input: [[], [1]], expected: false },
      ],
    },
  },
  {
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Swap the children at every node; the order of the traversal does not matter.",
    prompt: [
      "Mirror a binary tree: swap the left and right children of every node. Return the root; the tests read it back in level order.",
      "",
      "```",
      "invertTree([4, 2, 7, 1, 3, 6, 9])  ->  [4, 7, 2, 9, 6, 3, 1]",
      "invertTree([])                     ->  []",
      "```",
    ].join("\n"),
    hints: ["At each node swap `left` and `right`, then recurse into both (or do it with a queue)."],
    solution: [
      "## Approach",
      "",
      "Visit every node once and swap its two child pointers. Pre-order, post-order or breadth-first all work because the swap at a node does not depend on its subtrees being done.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(height) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The famous question is famous for being short; write it, then offer the iterative version.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function invertTree(root) {
  if (!root) return null;
  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  return root;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {object | null} the mirrored tree's root
 */
function invertTree(root) {
  // Your code here
  return root;
}
`,
      entry: "__judgeInvert",
      driverCode: `${TREE_BUILDER}
${TREE_SERIALIZER}
function __judgeInvert(values) {
  return __toLevelOrder(invertTree(__buildTree(values)));
}`,
      tests: [
        { name: "Prompt example", input: [[4, 2, 7, 1, 3, 6, 9]], expected: [4, 7, 2, 9, 6, 3, 1] },
        { name: "Three nodes", input: [[2, 1, 3]], expected: [2, 3, 1] },
        { name: "Empty", input: [[]], expected: [] },
        { name: "Left child only", input: [[1, 2]], expected: [1, null, 2] },
      ],
    },
  },
  {
    slug: "binary-tree-maximum-path-sum",
    title: "Binary Tree Maximum Path Sum",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Each node reports the best downward gain; the best path through it is value + left gain + right gain.",
    prompt: [
      "A path is any sequence of nodes connected by parent-child edges, visiting each node at most once; it need not pass through the root. Return the largest sum of node values along any path.",
      "",
      "```",
      "maxPathSum([1, 2, 3])                       ->  6",
      "maxPathSum([-10, 9, 20, null, null, 15, 7])  ->  42     // 15 + 20 + 7",
      "maxPathSum([-3])                            ->  -3",
      "```",
    ].join("\n"),
    hints: [
      "Define gain(node) as the best sum of a path that starts at node and goes down one side; negative gains are clamped to 0.",
      "At each node, the best path that bends there is value + gain(left) + gain(right); keep the global maximum, return value + max(gains) to the parent.",
    ],
    solution: [
      "## Approach",
      "",
      "Post-order recursion returning the best downward gain from each node (never below zero). At each node, update the answer with `val + leftGain + rightGain`, which is the best path whose highest point is this node. Initialise the answer to -Infinity so an all-negative tree returns its largest single node.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(height) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The two different quantities (gain returned upward, path sum recorded globally) are the whole difficulty; name them both.",
      "- Diameter of Binary Tree is the same recursion with edge counts instead of sums.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function maxPathSum(root) {
  let best = -Infinity;
  const gain = (node) => {
    if (!node) return 0;
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  };
  gain(root);
  return best;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null }} root non-empty
 * @returns {number} the largest path sum
 */
function maxPathSum(root) {
  // Your code here
  return 0;
}
`,
      entry: "__judgePathSum",
      driverCode: `${TREE_BUILDER}
function __judgePathSum(values) {
  return maxPathSum(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3]], expected: 6 },
        { name: "Skip the root", input: [[-10, 9, 20, null, null, 15, 7]], expected: 42 },
        { name: "Single negative", input: [[-3]], expected: -3 },
        { name: "Drop a negative child", input: [[2, -1]], expected: 2 },
        { name: "Mixed", input: [[1, -2, -3, 1, 3, -2, null, -1]], expected: 3 },
      ],
    },
  },
  {
    slug: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A queue, and the queue's length at the start of each round is the size of that level.",
    prompt: [
      "Return the values of a binary tree level by level, each level as its own array from left to right.",
      "",
      "```",
      "levelOrder([3, 9, 20, null, null, 15, 7])  ->  [[3], [9, 20], [15, 7]]",
      "levelOrder([])                             ->  []",
      "```",
    ].join("\n"),
    hints: ["Breadth-first search; before processing a level, read the queue length so you know where the level ends."],
    solution: [
      "## Approach",
      "",
      "Breadth-first with a queue. Each outer iteration takes exactly the nodes currently queued (one level), records their values, and enqueues their children for the next round.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(width) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Zigzag, right-side view, and level averages are this loop with a different step per level.",
      "- A recursive version passes the depth and appends to `out[depth]`.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function levelOrder(root) {
  const out = [];
  if (!root) return out;
  const queue = [root];
  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    out.push(level);
  }
  return out;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {number[][]} values per level, left to right
 */
function levelOrder(root) {
  // Your code here
  return [];
}
`,
      entry: "__judgeLevels",
      driverCode: `${TREE_BUILDER}
function __judgeLevels(values) {
  return levelOrder(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
        { name: "Root only", input: [[1]], expected: [[1]] },
        { name: "Empty", input: [[]], expected: [] },
        { name: "Gaps", input: [[1, 2, 3, 4, null, null, 5]], expected: [[1], [2, 3], [4, 5]] },
      ],
    },
  },
  {
    slug: "maximum-width-of-binary-tree",
    title: "Maximum Width of Binary Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Number nodes like a heap — left 2i, right 2i+1 — and re-base each level so indices never overflow.",
    prompt: [
      "The width of a level is the distance between its leftmost and rightmost nodes, counting the null positions in between as if the level were complete. Return the largest width over all levels.",
      "",
      "```",
      "widthOfBinaryTree([1, 3, 2, 5, 3, null, 9])                    ->  4",
      "widthOfBinaryTree([1, 3, 2, 5, null, null, 9, 6, null, 7])      ->  7",
      "widthOfBinaryTree([1, 3, 2, 5])                                ->  2",
      "```",
    ].join("\n"),
    hints: [
      "Give each node an index as in a heap array: the left child of index i is 2i, the right 2i + 1. A level's width is last index − first index + 1.",
      "Subtract the level's first index from every index as you enqueue children, so numbers stay small on deep trees.",
    ],
    solution: [
      "## Approach",
      "",
      "Breadth-first with `(node, index)` pairs. For each level, subtract the first index of the level from every node's index before computing children (`2i` and `2i + 1`), then record `last − first + 1`. Re-basing keeps the indices bounded by the level's width rather than growing exponentially with depth.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(width) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Without re-basing a 60-deep tree overflows 64-bit integers in most languages; JavaScript numbers lose precision past 2⁵³.",
      "- The same numbering answers \"is this tree complete\" (indices must be 0..n−1) and \"are two nodes cousins\".",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function widthOfBinaryTree(root) {
  if (!root) return 0;
  let best = 0;
  let queue = [[root, 0]];
  while (queue.length) {
    const first = queue[0][1];
    const next = [];
    let last = first;
    for (const [node, index] of queue) {
      const i = index - first;
      last = i;
      if (node.left) next.push([node.left, 2 * i]);
      if (node.right) next.push([node.right, 2 * i + 1]);
    }
    best = Math.max(best, last + 1);
    queue = next;
  }
  return best;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {number} the largest level width, counting gaps
 */
function widthOfBinaryTree(root) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeWidth",
      driverCode: `${TREE_BUILDER}
function __judgeWidth(values) {
  return widthOfBinaryTree(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[1, 3, 2, 5, 3, null, 9]], expected: 4 },
        { name: "Gap in the middle", input: [[1, 3, 2, 5, null, null, 9, 6, null, 7]], expected: 7 },
        { name: "Second level", input: [[1, 3, 2, 5]], expected: 2 },
        { name: "Empty", input: [[]], expected: 0 },
        { name: "Root only", input: [[1]], expected: 1 },
        { name: "Deep left chain", input: [LEFT_CHAIN], expected: 1 },
      ],
    },
  },
];
