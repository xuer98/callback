import type { Problem } from "./types";

// Snowflake coding bank, part T: the long-tail tree prompts — a pre-order
// that skips marked subtrees, deleting a node from a forest stored as a
// parent array, and rewriting merged complete trees with subtree sums.
// Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-m.ts.

/**
 * Builds a binary tree from a level-order list with nulls, the way the
 * tests write them. Nodes are plain { val, left, right } objects, so user
 * code never has to match a class name.
 */
const TREE_BUILDER = `function __buildTree(values) {
  if (values.length === 0 || values[0] === null) return null;
  const nodes = values.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let child = 1;
  for (let i = 0; i < nodes.length && child < nodes.length; i++) {
    if (nodes[i] === null) continue;
    nodes[i].left = nodes[child++] ?? null;
    if (child < nodes.length) nodes[i].right = nodes[child++] ?? null;
  }
  return nodes[0];
}`;

export const snowflakeProblemsT: Problem[] = [
  {
    slug: "preorder-skipping-marked-nodes",
    title: "Pre-Order Traversal Skipping Marked Nodes",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "A pre-order walk with a stack; a marked node is dropped before its children are pushed, so its whole subtree disappears.",
    prompt: [
      "Return the pre-order traversal (node, left subtree, right subtree) of a binary tree, except that a node whose value is in `marked` is skipped **together with its entire subtree**. Trees arrive in level order with `null` for missing children.",
      "",
      "```",
      "preorderSkipping([1, 2, 3, 4, 5, 6, 7], [2])     ->  [1, 3, 6, 7]",
      "preorderSkipping([1, 2, 3, 4, 5, 6, 7], [4, 7])  ->  [1, 2, 5, 3, 6]",
      "preorderSkipping([1, 2, 3], [1])                 ->  []",
      "```",
    ].join("\n"),
    hints: ["Iterative pre-order: pop a node, skip it entirely if marked, otherwise record it and push the right child then the left child."],
    solution: [
      "## Approach",
      "",
      "A standard iterative pre-order with the skip test at the pop: a marked node is discarded without pushing its children, which prunes the subtree for free. Keep the marked values in a set so the test is constant time.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(height) stack in the worst case.",
      "",
      "## Worth saying out loud",
      "",
      "- Confirm which variant is wanted: skipping only the node but still visiting its children is the same loop with the children pushed before the skip test.",
      "- Pushing the right child first is what keeps the left subtree first in the output.",
    ].join("\n"),
    judge: {
      solutionCode: `/** Tree nodes are { val, left, right }; children are null when absent. */
function preorderSkipping(root, marked) {
  const skip = new Set(marked);
  const out = [];
  const stack = root ? [root] : [];
  while (stack.length) {
    const node = stack.pop();
    if (skip.has(node.val)) continue;
    out.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return out;
}
`,
      starterCode: `/** Tree nodes are { val, left, right }; children are null when absent. */
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @param {number[]} marked values whose subtrees are skipped
 * @returns {number[]} the pre-order of everything else
 */
function preorderSkipping(root, marked) {
  // Your code here
  return [];
}
`,
      entry: "__judgePreorder",
      driverCode: `${TREE_BUILDER}
function __judgePreorder(values, marked) {
  return preorderSkipping(__buildTree(values), marked);
}`,
      tests: [
        { name: "Skip a whole left subtree", input: [[1, 2, 3, 4, 5, 6, 7], [2]], expected: [1, 3, 6, 7] },
        { name: "Skip two leaves", input: [[1, 2, 3, 4, 5, 6, 7], [4, 7]], expected: [1, 2, 5, 3, 6] },
        { name: "The root is marked", input: [[1, 2, 3], [1]], expected: [] },
        { name: "Nothing marked", input: [[1, 2, 3, 4, 5, 6, 7], []], expected: [1, 2, 4, 5, 3, 6, 7] },
        { name: "Empty tree", input: [[], [1]], expected: [] },
        { name: "A marked value that is not in the tree", input: [[1, null, 2, 3], [9]], expected: [1, 2, 3] },
      ],
    },
  },
  {
    slug: "delete-node-in-parent-array-forest",
    title: "Delete a Node From a Forest Stored as a Parent Array",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Children of the deleted node are re-parented to its parent; a deleted root's children become roots.",
    prompt: [
      "A forest is stored as `parent[i]`, the parent index of node `i`, with `-1` for a root. Delete node `x`: its children are re-parented to `x`'s parent (they become roots if `x` was a root), and `x`'s own entry becomes `null`. Return the new array without renumbering the other nodes.",
      "",
      "```",
      "deleteNode([-1, 0, 0, 1, 1], 1)  ->  [-1, null, 0, 0, 0]",
      "deleteNode([-1, 0, 0, 1, 1], 0)  ->  [null, -1, -1, 1, 1]",
      "```",
    ].join("\n"),
    hints: ["One pass: every entry equal to x is replaced by parent[x]; then null out x."],
    solution: [
      "## Approach",
      "",
      "Read the grandparent (`parent[x]`, which is -1 for a root) first, then rewrite every entry that points at `x` to that value and set `x`'s own entry to `null`. Nothing else changes, so the indices of all other nodes stay valid — the reason to prefer tombstoning over renumbering.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) output.",
      "",
      "## Worth saying out loud",
      "",
      "- Deleting several nodes at once is the same rule applied to each in any order, as long as a deleted node is never used as a destination parent — chase through tombstones when it is.",
      "- The pointer-tree version of this promotion is [Tree Height After Deleting Nodes](/problems/height-after-deleting-nodes).",
    ].join("\n"),
    judge: {
      solutionCode: `function deleteNode(parent, x) {
  const out = parent.slice();
  const up = parent[x];
  for (let i = 0; i < out.length; i++) if (parent[i] === x) out[i] = up;
  out[x] = null;
  return out;
}
`,
      starterCode: `/**
 * @param {number[]} parent parent index per node, -1 for a root
 * @param {number} x the node to delete
 * @returns {(number | null)[]} the new parent array, null at x
 */
function deleteNode(parent, x) {
  // Your code here
  return parent;
}
`,
      entry: "deleteNode",
      tests: [
        { name: "Delete an inner node", input: [[-1, 0, 0, 1, 1], 1], expected: [-1, null, 0, 0, 0] },
        { name: "Delete the root", input: [[-1, 0, 0, 1, 1], 0], expected: [null, -1, -1, 1, 1] },
        { name: "Delete a leaf", input: [[-1, 0, 0, 1, 1], 3], expected: [-1, 0, 0, null, 1] },
        { name: "A forest", input: [[-1, -1, 0, 1], 1], expected: [-1, null, 0, -1] },
        { name: "A single node", input: [[-1], 0], expected: [null] },
      ],
    },
  },
  {
    slug: "complete-tree-subtree-sums",
    title: "Rewrite Two Complete Trees With Subtree Sums",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "In array form the children of i are 2i + 1 and 2i + 2, so merge by index and accumulate sums from the last index down.",
    prompt: [
      "Two complete binary trees are given in array form: level order with no gaps, where the children of index `i` are `2i + 1` and `2i + 2`. Merge them into one complete tree by adding the values at each index (a node present in only one tree keeps its value), then rewrite every node as the **sum of its subtree**. Return the resulting array.",
      "",
      "```",
      "subtreeSums([1, 2, 3], [4, 5])                 ->  [15, 7, 3]      // merged [5, 7, 3]",
      "subtreeSums([1, 2, 3, 4, 5, 6, 7], [])         ->  [28, 11, 16, 4, 5, 6, 7]",
      "subtreeSums([1, 1, 1, 1], [1, 1])              ->  [6, 3, 1, 1]",
      "```",
    ].join("\n"),
    hints: [
      "The merged array has the length of the longer input; missing entries count as 0.",
      "Walk indices from the end to the start adding each node's value into its parent at (i − 1) / 2, or compute sum[i] = value[i] + sum[2i + 1] + sum[2i + 2] in the same order.",
    ],
    solution: [
      "## Approach",
      "",
      "Array form makes both steps index arithmetic. The merged value at `i` is the sum of the inputs at `i` where present. Then, because children have larger indices than parents, a single pass from the last index down to 0 can add each node's value into its parent's running total, leaving every entry equal to its subtree sum.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) output.",
      "",
      "## Worth saying out loud",
      "",
      "- Completeness is what makes the index formulas valid; a sparse tree in array form would need null markers and a skip.",
      "- The single-tree version is the same pass without the merge, and the pointer-tree version is a post-order traversal.",
    ].join("\n"),
    judge: {
      solutionCode: `function subtreeSums(a, b) {
  const n = Math.max(a.length, b.length);
  const sums = Array.from({ length: n }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0));
  for (let i = n - 1; i > 0; i--) sums[(i - 1) >> 1] += sums[i];
  return sums;
}
`,
      starterCode: `/**
 * @param {number[]} a a complete tree in array form
 * @param {number[]} b another complete tree in array form
 * @returns {number[]} the merged tree with every node replaced by its subtree sum
 */
function subtreeSums(a, b) {
  // Your code here
  return [];
}
`,
      entry: "subtreeSums",
      tests: [
        { name: "Prompt example", input: [[1, 2, 3], [4, 5]], expected: [15, 7, 3] },
        { name: "A full tree alone", input: [[1, 2, 3, 4, 5, 6, 7], []], expected: [28, 11, 16, 4, 5, 6, 7] },
        { name: "Different sizes", input: [[1, 1, 1, 1], [1, 1]], expected: [6, 3, 1, 1] },
        { name: "A single node", input: [[1], []], expected: [1] },
        { name: "Both empty", input: [[], []], expected: [] },
        { name: "Negative values", input: [[5, -2, 3], [0, 0, -3]], expected: [3, -2, 0] },
      ],
    },
  },
];
