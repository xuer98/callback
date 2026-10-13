import type { Problem } from "./types";
import { TREE_BUILDER } from "./seed-snowflake-h";

// Snowflake coding bank, LeetCode tag part C: binary trees — inorder
// traversal, rebuilding from preorder and inorder, and next-right pointers;
// part O continues them. Judged in JavaScript and Python; the Python judges
// live in seed-python-snowflake-h.ts.

/** Serialises a {val, left, right} tree back to level order, trailing nulls trimmed. */
export const TREE_SERIALIZER = `function __toLevelOrder(root) {
  const out = [];
  const queue = [root ?? null];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    if (node === null || node === undefined) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left ?? null, node.right ?? null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}`;

const NODE_DOC = `/** Tree nodes are { val, left, right }; children are null when absent. */`;

export const snowflakeLcProblemsC: Problem[] = [
  {
    slug: "binary-tree-inorder-traversal",
    title: "Binary Tree Inorder Traversal",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Left, node, right — and the iterative version with an explicit stack is the one interviewers wait for.",
    prompt: [
      "Return the values of a binary tree in inorder (left subtree, node, right subtree). Trees arrive in level order with `null` for missing children.",
      "",
      "```",
      "inorderTraversal([1, null, 2, 3])  ->  [1, 3, 2]",
      "inorderTraversal([])               ->  []",
      "```",
      "",
      "Do it without recursion.",
    ].join("\n"),
    hints: [
      "Walk left pushing nodes onto a stack until there is no left child; pop, record, then move to the popped node's right child and repeat.",
      "The loop runs while either the current node or the stack is non-empty.",
    ],
    solution: [
      "## Approach",
      "",
      "Simulate the recursion with a stack. From the current node, descend left pushing every node. When the descent ends, pop a node, record its value, and continue from its right child. The traversal finishes when the stack is empty and there is no current node.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(height) stack space.",
      "",
      "## Worth saying out loud",
      "",
      "- Morris traversal achieves O(1) extra space by temporarily threading right pointers; mention it, write the stack version.",
      "- Preorder and postorder use the same stack idea with the record step moved.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function inorderTraversal(root) {
  const out = [];
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    out.push(node.val);
    node = node.right;
  }
  return out;
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {{ val: number, left: object | null, right: object | null } | null} root
 * @returns {number[]} values in inorder
 */
function inorderTraversal(root) {
  // Your code here
  return [];
}
`,
      entry: "__judgeInorder",
      driverCode: `${TREE_BUILDER}
function __judgeInorder(values) {
  return inorderTraversal(__buildTree(values));
}`,
      tests: [
        { name: "Prompt example", input: [[1, null, 2, 3]], expected: [1, 3, 2] },
        { name: "Empty tree", input: [[]], expected: [] },
        { name: "A lone root", input: [[1]], expected: [1] },
        { name: "A full tree", input: [[1, 2, 3, 4, 5]], expected: [4, 2, 5, 1, 3] },
        { name: "A left chain", input: [[1, 2, null, 3]], expected: [3, 2, 1] },
      ],
    },
  },
  {
    slug: "construct-binary-tree-from-preorder-and-inorder",
    title: "Construct Binary Tree From Preorder and Inorder Traversal",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Preorder names the root; inorder splits the rest into the two subtrees — index the inorder positions so each split is O(1).",
    prompt: [
      "Given the preorder and inorder traversals of a binary tree with distinct values, rebuild the tree. The grader serialises your tree in level order.",
      "",
      "```",
      "buildTree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7])  ->  [3, 9, 20, null, null, 15, 7]",
      "buildTree([-1], [-1])                            ->  [-1]",
      "```",
      "",
      "Return nodes shaped `{ val, left, right }` with `null` for a missing child.",
    ].join("\n"),
    hints: [
      "The first preorder value is the root. Its position in the inorder list tells you how many values belong to the left subtree, which fixes the preorder ranges of both subtrees.",
      "A map from value to inorder index avoids an O(n) search per node, and a shared preorder cursor avoids slicing arrays.",
    ],
    solution: [
      "## Approach",
      "",
      "Recursive construction over index ranges. Keep a cursor into preorder: the next value is the root of the current range. Look up its inorder position; everything left of it in the inorder range is the left subtree, everything right is the right subtree. Build the left subtree first (it consumes the next preorder values), then the right.",
      "",
      "## Complexity",
      "",
      "O(n) time with the index map; O(n) space for the map and recursion.",
      "",
      "## Worth saying out loud",
      "",
      "- Distinct values are what make the inorder lookup unambiguous; say it before relying on the map.",
      "- Postorder with inorder is the mirror: walk postorder from the end and build right subtrees first.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
function buildTree(preorder, inorder) {
  const indexOf = new Map(inorder.map((v, i) => [v, i]));
  let cursor = 0;
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const val = preorder[cursor++];
    const mid = indexOf.get(val);
    const node = { val, left: null, right: null };
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  return build(0, inorder.length - 1);
}
`,
      starterCode: `${NODE_DOC}
/**
 * @param {number[]} preorder
 * @param {number[]} inorder
 * @returns {{ val: number, left: object | null, right: object | null } | null}
 */
function buildTree(preorder, inorder) {
  // Your code here
  return null;
}
`,
      entry: "__judgeBuild",
      driverCode: `${TREE_SERIALIZER}
function __judgeBuild(preorder, inorder) {
  return __toLevelOrder(buildTree(preorder, inorder));
}`,
      tests: [
        { name: "Prompt example", input: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], expected: [3, 9, 20, null, null, 15, 7] },
        { name: "A lone root", input: [[-1], [-1]], expected: [-1] },
        { name: "Left child only", input: [[1, 2], [2, 1]], expected: [1, 2] },
        { name: "Right child only", input: [[1, 2], [1, 2]], expected: [1, null, 2] },
        { name: "A full tree", input: [[1, 2, 4, 5, 3], [4, 2, 5, 1, 3]], expected: [1, 2, 3, 4, 5] },
        { name: "Empty", input: [[], []], expected: [] },
      ],
    },
  },
  {
    slug: "populating-next-right-pointers",
    title: "Populating Next Right Pointers in Each Node",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Walk each level through the next pointers you just built, so the whole thing takes O(1) extra space even for a non-perfect tree.",
    prompt: [
      "Give every node of a binary tree a `next` pointer to the node immediately to its right on the same level, or `null` if there is none. The tree is **not** necessarily perfect. Use O(1) extra space beyond the recursion stack. The grader walks each level along your `next` pointers.",
      "",
      "```",
      "connect([1, 2, 3, 4, 5, null, 7])  ->  levels read through next: [[1], [2, 3], [4, 5, 7]]",
      "```",
    ].join("\n"),
    hints: [
      "Process one level at a time using the previous level's `next` chain as the iterator, and a dummy head that collects the children in order.",
      "The dummy's `next` after a level is done is the first node of the next level; reset it for each level.",
    ],
    solution: [
      "## Approach",
      "",
      "Level by level. Keep a pointer to the leftmost node of the current level and a dummy node whose `next` will become the leftmost child. Walk the current level via `next`; for each child in left-to-right order, append it to the chain growing from the dummy. When the level ends, the dummy's `next` is the start of the next level. No queue, so constant extra space.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- The perfect-tree version can use `node.left.next = node.right` and `node.right.next = node.next.left`; the dummy-head version handles both.",
      "- A breadth-first search with a queue is the obvious O(width) answer; the space bound is the point of the question.",
    ].join("\n"),
    judge: {
      solutionCode: `${NODE_DOC}
// Thread each level through a dummy head using the previous level's next chain.
function connect(root) {
  let level = root ?? null;
  while (level) {
    const dummy = { next: null };
    let tail = dummy;
    for (let node = level; node; node = node.next ?? null) {
      if (node.left) {
        tail.next = node.left;
        tail = node.left;
      }
      if (node.right) {
        tail.next = node.right;
        tail = node.right;
      }
    }
    tail.next = null;
    level = dummy.next;
  }
  return root ?? null;
}
`,
      starterCode: `${NODE_DOC}
/**
 * Set node.next on every node; return the root.
 * @param {{ val: number, left: object | null, right: object | null, next?: object | null } | null} root
 */
function connect(root) {
  // Your code here
  return root;
}
`,
      entry: "__judgeConnect",
      driverCode: `${TREE_BUILDER}
function __judgeConnect(values) {
  const root = __buildTree(values);
  connect(root);
  const levels = [];
  let level = root;
  while (level) {
    const row = [];
    let first = null;
    for (let node = level; node; node = node.next ?? null) {
      row.push(node.val);
      if (!first) first = node.left ?? node.right ?? null;
      if (row.length > 1000) throw new Error("next pointers form a cycle");
    }
    levels.push(row);
    level = first;
  }
  return levels;
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 4, 5, null, 7]], expected: [[1], [2, 3], [4, 5, 7]] },
        { name: "Empty tree", input: [[]], expected: [] },
        { name: "A lone root", input: [[1]], expected: [[1]] },
        { name: "A chain", input: [[1, 2, null, 3, null, 4]], expected: [[1], [2], [3], [4]] },
        { name: "Gaps between cousins", input: [[1, 2, 3, null, 4, 5]], expected: [[1], [2, 3], [4, 5]] },
        { name: "Only the far cousins have children", input: [[1, 2, 3, 4, null, null, 5]], expected: [[1], [2, 3], [4, 5]] },
      ],
    },
  },
];
