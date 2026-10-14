import type { Problem } from "./types";
import { TREE_BUILDER } from "./seed-snowflake-h";
import { TREE_SERIALIZER } from "./seed-snowflake-lc-c";

// Blind 75 for the Snowflake backend screen, part I: the second half of the
// tree group and Serialize and Deserialize BST. Python in seed-python-snowflake-v.ts.

const NODE_DOC = `/** Tree nodes are { val, left, right }; children are null when absent. */`;

const CODEC_DRIVER = `${TREE_BUILDER}
${TREE_SERIALIZER}
function __judgeCodec(values, mode) {
  const data = serialize(__buildTree(values));
  if (typeof data !== "string") return "serialize must return a string";
  if (mode === "compact") {
    const digits = values.reduce((sum, v) => sum + (v === null ? 0 : String(v).length), 0);
    return data.length <= digits + values.length + 1;
  }
  return __toLevelOrder(deserialize(data));
}`;

export const snowflakeBlindProblemsI: Problem[] = [
  {
    slug: "serialize-and-deserialize-binary-tree",
    title: "Serialize and Deserialize Binary Tree",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Preorder with explicit null markers is unambiguous; the decoder consumes tokens recursively.",
    prompt: [
      "Write `serialize(root)`, turning a binary tree into a string, and `deserialize(data)`, turning that string back into the same tree. Any format works as long as the round trip is exact. The tests build a tree, serialize it, deserialize the result, and compare level orders.",
      "",
      "```",
      "deserialize(serialize([1, 2, 3, null, null, 4, 5]))  ->  [1, 2, 3, null, null, 4, 5]",
      "deserialize(serialize([]))                           ->  []",
      "```",
    ].join("\n"),
    hints: [
      "Preorder with a marker for null (`1 2 # # 3 4 # # 5 # #`) can be decoded by a recursive function that consumes one token per call.",
      "Level order with nulls (the test format) also works; trim trailing nulls or not, as long as both sides agree.",
    ],
    solution: [
      "## Approach",
      "",
      "Serialize in preorder, emitting `#` for every missing child, joined by spaces. Deserialize by splitting into tokens and recursing: read a token; if it is `#` return null; otherwise create the node and build its left then right subtree from the following tokens. Null markers are what make preorder alone sufficient.",
      "",
      "## Complexity",
      "",
      "O(n) both ways.",
      "",
      "## Worth saying out loud",
      "",
      "- Negative numbers and multi-digit values are why tokens are separated rather than read character by character.",
      "- For a BST the null markers can be dropped (preorder plus value ranges), which is the compact follow-up.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function serialize(root) {
  const out = [];
  const walk = (node) => {
    if (!node) {
      out.push("#");
      return;
    }
    out.push(String(node.val));
    walk(node.left);
    walk(node.right);
  };
  walk(root);
  return out.join(" ");
}

function deserialize(data) {
  const tokens = data.split(" ");
  let i = 0;
  const build = () => {
    const token = tokens[i++];
    if (token === "#") return null;
    return { val: Number(token), left: build(), right: build() };
  };
  return build();
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {object | null} root
 * @returns {string}
 */
function serialize(root) {
  // Your code here
  return "";
}

/**
 * @param {string} data
 * @returns {object | null} the tree the string encodes
 */
function deserialize(data) {
  // Your code here
  return null;
}
`,
      entry: "__judgeCodec",
      driverCode: CODEC_DRIVER,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, null, null, 4, 5], "roundTrip"], expected: [1, 2, 3, null, null, 4, 5] },
        { name: "Empty", input: [[], "roundTrip"], expected: [] },
        { name: "Root only", input: [[1], "roundTrip"], expected: [1] },
        { name: "Right chain", input: [[1, null, 2, null, 3], "roundTrip"], expected: [1, null, 2, null, 3] },
        { name: "Negative and multi-digit values", input: [[-1, 10, -22], "roundTrip"], expected: [-1, 10, -22] },
      ],
    },
  },
  {
    slug: "serialize-and-deserialize-bst",
    title: "Serialize and Deserialize BST",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "For a BST, preorder alone is enough: rebuild by consuming values while they fit the current (lo, hi) range.",
    prompt: [
      "Write `serialize(root)` and `deserialize(data)` for a binary **search** tree with distinct values. The encoding should be as compact as possible: no markers for missing children. The tests round-trip trees and also check that the string is no longer than the values themselves plus one separator each.",
      "",
      "```",
      "deserialize(serialize([2, 1, 3]))              ->  [2, 1, 3]",
      "serialize([5, 3, 7, 2, 4, 6, 8])              ->  something like \"5 3 2 4 7 6 8\"",
      "```",
    ].join("\n"),
    hints: [
      "Preorder lists each node before its subtrees; in a BST the left subtree's values are all below the node and the right subtree's above, so the boundaries are implied.",
      "Decode with `build(lo, hi)`: consume the next value only if it lies in (lo, hi), then build left with (lo, value) and right with (value, hi).",
    ],
    solution: [
      "## Approach",
      "",
      "Serialize the preorder values joined by spaces. Deserialize with a recursive builder over the token queue: `build(lo, hi)` takes the next value when `lo < value < hi`, creates the node, builds its left subtree in `(lo, value)` and its right in `(value, hi)`, and returns null otherwise. The ranges replace the null markers.",
      "",
      "## Complexity",
      "",
      "O(n) both ways; the string holds exactly the values.",
      "",
      "## Worth saying out loud",
      "",
      "- Duplicates break the strict range check; say which side would allow equality.",
      "- Explain why the trick fails on a general binary tree: without ordering, preorder alone is ambiguous.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function serialize(root) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    out.push(String(node.val));
    walk(node.left);
    walk(node.right);
  };
  walk(root);
  return out.join(" ");
}

function deserialize(data) {
  const values = data ? data.split(" ").map(Number) : [];
  let i = 0;
  const build = (lo, hi) => {
    if (i < values.length && lo < values[i] && values[i] < hi) {
      const val = values[i++];
      return { val, left: build(lo, val), right: build(val, hi) };
    }
    return null;
  };
  return build(-Infinity, Infinity);
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {object | null} root a binary search tree
 * @returns {string} as compact as you can make it
 */
function serialize(root) {
  // Your code here
  return "";
}

/**
 * @param {string} data
 * @returns {object | null} the tree the string encodes
 */
function deserialize(data) {
  // Your code here
  return null;
}
`,
      entry: "__judgeCodec",
      driverCode: CODEC_DRIVER,
      tests: [
        { name: "Prompt example", input: [[2, 1, 3], "roundTrip"], expected: [2, 1, 3] },
        { name: "Seven nodes", input: [[5, 3, 7, 2, 4, 6, 8], "roundTrip"], expected: [5, 3, 7, 2, 4, 6, 8] },
        { name: "Empty", input: [[], "roundTrip"], expected: [] },
        { name: "Right chain", input: [[1, null, 2, null, 3], "roundTrip"], expected: [1, null, 2, null, 3] },
        { name: "Compact: no null markers", input: [[50, 30, 70, 20, 40, 60, 80], "compact"], expected: true },
        { name: "Compact on a skewed tree", input: [[1, null, 2, null, 3], "compact"], expected: true },
      ],
    },
  },
  {
    slug: "subtree-of-another-tree",
    title: "Subtree of Another Tree",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "At every node of the big tree, ask Same Tree; or compare serialisations with null markers.",
    prompt: [
      "Return whether `subRoot` is a subtree of `root`: some node of `root` together with all its descendants is identical to `subRoot`.",
      "",
      "```",
      "isSubtree([3, 4, 5, 1, 2], [4, 1, 2])                                ->  true",
      "isSubtree([3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2])     ->  false",
      "```",
    ].join("\n"),
    hints: [
      "Write isSameTree first; then at each node of root test it against subRoot.",
      "O(n + m): serialise both trees in preorder with null markers and check whether one string contains the other (with separators so values cannot blend).",
    ],
    solution: [
      "## Approach",
      "",
      "Traverse `root`; at each node run a same-tree comparison against `subRoot`. The serialisation alternative encodes both trees as token strings with null markers and leading separators, then searches for the small string inside the big one.",
      "",
      "## Complexity",
      "",
      "O(n × m) for the direct version, O(n + m) with serialisation and a linear string search.",
      "",
      "## Worth saying out loud",
      "",
      "- Without null markers, `[12]` would match inside `[2]` and shapes would blur; the markers and separators matter.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function isSubtree(root, subRoot) {
  const same = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) return false;
    return same(a.left, b.left) && same(a.right, b.right);
  };
  const walk = (node) => {
    if (!node) return false;
    return same(node, subRoot) || walk(node.left) || walk(node.right);
  };
  return walk(root);
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {object | null} root
 * @param {object | null} subRoot
 * @returns {boolean}
 */
function isSubtree(root, subRoot) {
  // Your code here
  return false;
}
`,
      entry: "__judgeSubtree",
      driverCode: `${TREE_BUILDER}
function __judgeSubtree(a, b) {
  return isSubtree(__buildTree(a), __buildTree(b));
}`,
      tests: [
        { name: "Prompt example", input: [[3, 4, 5, 1, 2], [4, 1, 2]], expected: true },
        { name: "Extra leaf breaks it", input: [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], expected: false },
        { name: "Identical", input: [[1], [1]], expected: true },
        { name: "A leaf", input: [[1, 2], [2]], expected: true },
        { name: "Partial match only", input: [[1, 2, 3], [1, 2]], expected: false },
        { name: "Values that would blend", input: [[12], [2]], expected: false },
      ],
    },
  },
  {
    slug: "validate-binary-search-tree",
    title: "Validate Binary Search Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Pass down an open interval each node must lie in; comparing only with the parent is the classic mistake.",
    prompt: [
      "Return whether a binary tree is a valid binary search tree: every node's value is strictly greater than every value in its left subtree and strictly less than every value in its right subtree.",
      "",
      "```",
      "isValidBST([2, 1, 3])                    ->  true",
      "isValidBST([5, 1, 4, null, null, 3, 6])  ->  false",
      "isValidBST([5, 4, 6, null, null, 3, 7])  ->  false     // 3 is under the right child but below 5",
      "```",
    ].join("\n"),
    hints: [
      "Carry (low, high) bounds: the left child must be below the node, and still above every ancestor bound it inherited.",
      "An inorder traversal of a valid BST is strictly increasing; checking that is the other correct approach.",
    ],
    solution: [
      "## Approach",
      "",
      "Recursive validation with bounds: `valid(node, low, high)` requires `low < node.val < high`, then checks the left subtree with `high = node.val` and the right with `low = node.val`. Start with infinite bounds. The inorder version keeps the previous value and fails on the first non-increase.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(height) space.",
      "",
      "## Worth saying out loud",
      "",
      "- `[5, 4, 6, null, null, 3, 7]` is the case that defeats parent-only checks.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function isValidBST(root) {
  const valid = (node, low, high) => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
  };
  return valid(root, -Infinity, Infinity);
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {boolean}
 */
function isValidBST(root) {
  // Your code here
  return false;
}
`,
      entry: "__judgeValidBst",
      driverCode: `${TREE_BUILDER}
function __judgeValidBst(values) {
  return isValidBST(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[2, 1, 3]], expected: true },
        { name: "Right subtree too small", input: [[5, 1, 4, null, null, 3, 6]], expected: false },
        { name: "Grandchild violates an ancestor", input: [[5, 4, 6, null, null, 3, 7]], expected: false },
        { name: "Empty", input: [[]], expected: true },
        { name: "Equal values", input: [[1, 1]], expected: false },
        { name: "Integer limits", input: [[-2147483648, null, 2147483647]], expected: true },
      ],
    },
  },
  {
    slug: "kth-smallest-element-in-a-bst",
    title: "Kth Smallest Element in a BST",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Inorder traversal visits values in sorted order; stop at the k-th one.",
    prompt: [
      "Return the k-th smallest value (1-indexed) in a binary search tree.",
      "",
      "```",
      "kthSmallest([3, 1, 4, null, 2], 1)                   ->  1",
      "kthSmallest([5, 3, 6, 2, 4, null, null, 1], 3)      ->  3",
      "```",
    ].join("\n"),
    hints: ["Iterative inorder with a stack; decrement k at each visited node and return when it reaches zero."],
    solution: [
      "## Approach",
      "",
      "Inorder traversal with an explicit stack: push the left spine, pop a node, count it, then move to its right child. Returning as soon as the count reaches k avoids walking the whole tree.",
      "",
      "## Complexity",
      "",
      "O(height + k) time, O(height) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The follow-up (frequent queries with inserts and deletes) wants subtree sizes stored on nodes, giving O(height) per query.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function kthSmallest(root, k) {
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    if (--k === 0) return node.val;
    node = node.right;
  }
  return -1;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null }} root a BST
 * @param {number} k 1-indexed
 * @returns {number} the k-th smallest value
 */
function kthSmallest(root, k) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeKth",
      driverCode: `${TREE_BUILDER}
function __judgeKth(values, k) {
  return kthSmallest(__buildTree(values), k);
}`,
      tests: [
        { name: "Prompt example", input: [[3, 1, 4, null, 2], 1], expected: 1 },
        { name: "Third smallest", input: [[5, 3, 6, 2, 4, null, null, 1], 3], expected: 3 },
        { name: "Root only", input: [[1], 1], expected: 1 },
        { name: "Largest", input: [[2, 1, 3], 3], expected: 3 },
      ],
    },
  },
  {
    slug: "lowest-common-ancestor-of-a-bst",
    title: "Lowest Common Ancestor of a BST",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Walk down from the root: go left if both are smaller, right if both are larger, stop at the split.",
    prompt: [
      "Given a binary search tree and two of its nodes `p` and `q`, return their lowest common ancestor: the deepest node that has both among its descendants (a node counts as its own descendant). The tests pass node values and read back the ancestor's value.",
      "",
      "```",
      "lowestCommonAncestor([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8)  ->  6",
      "lowestCommonAncestor([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4)  ->  2",
      "```",
    ].join("\n"),
    hints: [
      "In a BST the ordering tells you where to go: if both values are below the current node go left, if both are above go right.",
      "The first node where they are on different sides (or equal to the node) is the answer.",
    ],
    solution: [
      "## Approach",
      "",
      "Start at the root. While both values are less than the node, move left; while both are greater, move right. Otherwise the node is the split point and the lowest common ancestor.",
      "",
      "## Complexity",
      "",
      "O(height) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The general binary tree version (no ordering) needs the recursive \"found in left / found in right\" approach; know both.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node) {
    if (p.val < node.val && q.val < node.val) node = node.left;
    else if (p.val > node.val && q.val > node.val) node = node.right;
    else return node;
  }
  return null;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {object} root a BST
 * @param {object} p a node in it
 * @param {object} q another node in it
 * @returns {object} the lowest common ancestor node
 */
function lowestCommonAncestor(root, p, q) {
  // Your code here
  return root;
}
`,
      entry: "__judgeLca",
      driverCode: `${TREE_BUILDER}
function __judgeLca(values, pVal, qVal) {
  const root = __buildTree(values);
  const find = (target) => {
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node) continue;
      if (node.val === target) return node;
      stack.push(node.left, node.right);
    }
    return null;
  };
  const answer = lowestCommonAncestor(root, find(pVal), find(qVal));
  return answer ? answer.val : null;
}`,
      tests: [
        { name: "Prompt example", input: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], expected: 6 },
        { name: "One is the ancestor", input: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], expected: 2 },
        { name: "Two nodes", input: [[2, 1], 2, 1], expected: 2 },
        { name: "Deep in one subtree", input: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 5], expected: 4 },
      ],
    },
  },
];
