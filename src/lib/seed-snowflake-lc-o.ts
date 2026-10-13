import type { Problem } from "./types";
import { TREE_BUILDER } from "./seed-snowflake-h";

// Snowflake coding bank, LeetCode tag part O (binary trees, continued):
// subtree averages, the quad tree, and heights after subtree removals.
// Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-h.ts.

const NODE_DOC = `/** Tree nodes are { val, left, right }; children are null when absent. */`;

export const snowflakeLcProblemsO: Problem[] = [
  {
    slug: "count-nodes-equal-to-average-of-subtree",
    title: "Count Nodes Equal to Average of Subtree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Post-order returning (sum, count) for each subtree; compare the node with the floored average on the way up.",
    prompt: [
      "Return how many nodes of a binary tree have a value equal to the average of the values in their subtree (the node included), where the average is rounded **down** to an integer.",
      "",
      "```",
      "averageOfSubtree([4, 8, 5, 0, 1, null, 6])  ->  5",
      "averageOfSubtree([1])                       ->  1",
      "```",
    ].join("\n"),
    hints: ["Post-order: each call returns its subtree's sum and node count; the node qualifies when `floor(sum / count)` equals its value."],
    solution: [
      "## Approach",
      "",
      "A post-order walk that returns two numbers per subtree, its sum and its size. At each node combine the children's pairs with the node's own value, test `Math.floor(sum / count) === node.val`, and count the hits in a variable captured by the closure.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(height) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Integer division must round down even in languages where `/` on negatives truncates toward zero; values here are non-negative, but say which you mean.",
      "- Returning tuples from the recursion is the pattern for any \"compare a node with a property of its subtree\" question.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function averageOfSubtree(root) {
  let count = 0;
  const walk = (node) => {
    if (!node) return [0, 0];
    const [ls, lc] = walk(node.left);
    const [rs, rc] = walk(node.right);
    const sum = ls + rs + node.val;
    const size = lc + rc + 1;
    if (Math.floor(sum / size) === node.val) count++;
    return [sum, size];
  };
  walk(root);
  return count;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {number} nodes equal to the floored average of their subtree
 */
function averageOfSubtree(root) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeAverage",
      driverCode: `${TREE_BUILDER}
function __judgeAverage(values) {
  return averageOfSubtree(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[4, 8, 5, 0, 1, null, 6]], expected: 5 },
        { name: "A lone root", input: [[1]], expected: 1 },
        { name: "Average rounds down to the root", input: [[1, 2]], expected: 2 },
        { name: "Root above its average", input: [[2, 1]], expected: 1 },
        { name: "All equal", input: [[3, 3, 3]], expected: 3 },
        { name: "Empty tree", input: [[]], expected: 0 },
      ],
    },
  },
  {
    slug: "construct-quad-tree",
    title: "Construct Quad Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Recurse on quadrants; a block of identical cells is a leaf, and four identical leaf children collapse into one.",
    prompt: [
      "An `n × n` grid of `0`s and `1`s (`n` a power of two) is represented by a quad tree: a node is a leaf with the block's value when the whole block is identical; otherwise it is an internal node with four children, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, covering the four quadrants. Build the tree for the grid.",
      "",
      "Return nodes shaped `{ isLeaf, val, topLeft, topRight, bottomLeft, bottomRight }` (children `null` on a leaf). The grader serialises the tree in level order as `[isLeaf, val]` pairs, writing `[0, 1]` for an internal node and four `null`s under a leaf, with trailing `null`s trimmed.",
      "",
      "```",
      "construct([[0, 1], [1, 0]])  ->  [[0, 1], [1, 0], [1, 1], [1, 1], [1, 0]]",
      "construct([[1, 1], [1, 1]])  ->  [[1, 1]]",
      "```",
    ].join("\n"),
    hints: [
      "Recurse on (row, col, size): a size-1 block is a leaf. Build the four quadrants of size/2 first.",
      "If all four children are leaves with the same value, return one leaf instead of an internal node — that is the only place a scan of the block can be avoided.",
    ],
    solution: [
      "## Approach",
      "",
      "Divide and conquer on the block's top-left corner and size. A single cell is a leaf. Otherwise build the four quadrants recursively; if every child is a leaf and they all carry the same value, the block is uniform and collapses into one leaf with that value, else wrap the four children in an internal node.",
      "",
      "## Complexity",
      "",
      "O(n²) time, each cell visited once at the bottom of the recursion; O(log n) stack plus the output.",
      "",
      "## Worth saying out loud",
      "",
      "- Checking uniformity by scanning the block at each level is also O(n² log n) and easier to get wrong; the collapse-from-children rule costs nothing extra.",
      "- Prefix sums over the grid make the uniformity test O(1) per block, which matters only when the tree is shallow and wide.",
    ].join("\n"),
    judge: {
      solutionCode: `// Build quadrants bottom-up; four identical leaves collapse into one.
function construct(grid) {
  const leaf = (val) => ({ isLeaf: true, val, topLeft: null, topRight: null, bottomLeft: null, bottomRight: null });
  const build = (row, col, size) => {
    if (size === 1) return leaf(grid[row][col] === 1);
    const half = size / 2;
    const tl = build(row, col, half);
    const tr = build(row, col + half, half);
    const bl = build(row + half, col, half);
    const br = build(row + half, col + half, half);
    const kids = [tl, tr, bl, br];
    if (kids.every((k) => k.isLeaf && k.val === tl.val)) return leaf(tl.val);
    return { isLeaf: false, val: true, topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br };
  };
  return build(0, 0, grid.length);
}
`,
      starterCode: `/**
 * @param {number[][]} grid n x n of 0 and 1, n a power of two
 * @returns {{ isLeaf: boolean, val: boolean, topLeft: object | null, topRight: object | null, bottomLeft: object | null, bottomRight: object | null }}
 */
function construct(grid) {
  // Your code here
  return { isLeaf: true, val: false, topLeft: null, topRight: null, bottomLeft: null, bottomRight: null };
}
`,
      entry: "__judgeQuad",
      driverCode: `function __judgeQuad(grid) {
  const root = construct(grid);
  const out = [];
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    if (!node) {
      out.push(null);
      continue;
    }
    if (node.isLeaf) {
      out.push([1, node.val ? 1 : 0]);
      queue.push(null, null, null, null);
    } else {
      out.push([0, 1]);
      queue.push(node.topLeft, node.topRight, node.bottomLeft, node.bottomRight);
    }
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}`,
      tests: [
        { name: "Prompt example", input: [[[0, 1], [1, 0]]], expected: [[0, 1], [1, 0], [1, 1], [1, 1], [1, 0]] },
        { name: "A uniform grid", input: [[[1, 1], [1, 1]]], expected: [[1, 1]] },
        { name: "A single cell", input: [[[0]]], expected: [[1, 0]] },
        {
          name: "An 8 by 8 grid with one mixed quadrant",
          input: [
            [
              [1, 1, 1, 1, 0, 0, 0, 0],
              [1, 1, 1, 1, 0, 0, 0, 0],
              [1, 1, 1, 1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0],
              [1, 1, 1, 1, 0, 0, 0, 0],
              [1, 1, 1, 1, 0, 0, 0, 0],
              [1, 1, 1, 1, 0, 0, 0, 0],
            ],
          ],
          expected: [[0, 1], [1, 1], [0, 1], [1, 1], [1, 0], null, null, null, null, [1, 0], [1, 0], [1, 1], [1, 1]],
        },
        { name: "Four quadrants collapse to one leaf", input: [[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]], expected: [[1, 0]] },
      ],
    },
  },
  {
    slug: "height-after-subtree-removal-queries",
    title: "Height of Binary Tree After Subtree Removal Queries",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "An Euler tour turns each subtree into a contiguous range, so the height without it is the deepest node outside that range.",
    prompt: [
      "A binary tree has `n` nodes with distinct values `1` to `n`. For each query value `q`, independently remove the subtree rooted at the node with value `q` and report the height (in edges) of what remains. Queries never name the root.",
      "",
      "```",
      "treeQueries([1, 3, 4, 2, null, 6, 5, null, null, null, null, null, 7], [4])  ->  [2]",
      "treeQueries([5, 8, 9, 2, 1, 3, 7, 4, 6], [3, 2, 4, 8])                      ->  [3, 2, 3, 2]",
      "```",
    ].join("\n"),
    hints: [
      "Record each node's entry and exit index in a depth-first order along with its depth. A subtree is the index range between its root's entry and exit.",
      "Precompute prefix and suffix maxima of depth over that order; the answer for a node is the larger of the maximum before its range and the maximum after it.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk the tree depth-first, writing each node's depth into an array in visit order and remembering where each node's subtree starts and ends in that array. Removing a subtree removes a contiguous slice, so the remaining height is the maximum depth over the prefix before the slice and the suffix after it — two arrays of running maxima answer every query in O(1). The removal of the root is excluded, so at least the root always remains.",
      "",
      "## Complexity",
      "",
      "O(n + q) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- This is the LeetCode form, where the whole subtree disappears; [Tree Height After Deleting Nodes](/problems/height-after-deleting-nodes) promotes the children instead, which is why its rule differs.",
      "- The alternative is two DFS passes carrying the best height available outside the current subtree from the parent; same complexity, more fiddly.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function treeQueries(root, queries) {
  const depths = [];
  const enter = new Map();
  const exit = new Map();
  const walk = (node, depth) => {
    if (!node) return;
    enter.set(node.val, depths.length);
    depths.push(depth);
    walk(node.left, depth + 1);
    walk(node.right, depth + 1);
    exit.set(node.val, depths.length - 1);
  };
  walk(root, 0);
  const n = depths.length;
  const prefix = Array(n).fill(0);
  const suffix = Array(n).fill(0);
  for (let i = 0; i < n; i++) prefix[i] = Math.max(i ? prefix[i - 1] : 0, depths[i]);
  for (let i = n - 1; i >= 0; i--) suffix[i] = Math.max(i + 1 < n ? suffix[i + 1] : 0, depths[i]);
  return queries.map((q) => {
    const lo = enter.get(q);
    const hi = exit.get(q);
    const before = lo > 0 ? prefix[lo - 1] : 0;
    const after = hi + 1 < n ? suffix[hi + 1] : 0;
    return Math.max(before, after);
  });
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null }} root values 1..n, distinct
 * @param {number[]} queries node values to remove, one at a time
 * @returns {number[]} the height in edges after each removal
 */
function treeQueries(root, queries) {
  // Your code here
  return [];
}
`,
      entry: "__judgeTreeQueries",
      driverCode: `${TREE_BUILDER}
function __judgeTreeQueries(values, queries) {
  return treeQueries(__buildTree(values), queries);
}`,
      tests: [
        { name: "Prompt example", input: [[1, 3, 4, 2, null, 6, 5, null, null, null, null, null, 7], [4]], expected: [2] },
        { name: "Several queries", input: [[5, 8, 9, 2, 1, 3, 7, 4, 6], [3, 2, 4, 8]], expected: [3, 2, 3, 2] },
        { name: "Removing a leaf keeps the other branch", input: [[1, 2, 3], [2]], expected: [1] },
        { name: "Removing the only branch", input: [[1, 2, null, 3], [2, 3]], expected: [0, 1] },
        { name: "The deepest node is elsewhere", input: [[1, 2, 3, 4, null, null, null, 5], [3, 4]], expected: [3, 1] },
      ],
    },
  },
];
