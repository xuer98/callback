import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part H: binary-tree problems and a string codec.
// Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-c.ts.

/**
 * Builds a binary tree from a level-order list with nulls, the way the
 * tests write them. Nodes are plain { val, left, right } objects, so user
 * code never has to match a class name.
 */
export const TREE_BUILDER = `function __buildTree(values) {
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

const NODE_DOC = `/** Tree nodes are { val, left, right }; children are null when absent. */`;

export const snowflakeProblemsH: Problem[] = [
  {
    slug: "boundary-of-binary-tree",
    title: "Boundary of a Binary Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Three walks — left edge down, leaves left to right, right edge back up — with leaves counted exactly once.",
    prompt: [
      "Return the boundary of a binary tree in anti-clockwise order starting from the root: the root, then the **left boundary** (the path from the root's left child going left, or right when there is no left child, excluding leaves), then every **leaf** from left to right, then the **right boundary** from the bottom up (the mirror path, excluding leaves). No value appears twice.",
      "",
      "The tree arrives as a level-order list with `null` for missing children.",
      "",
      "```",
      "boundaryOfBinaryTree([1, null, 2, 3, 4])                    ->  [1, 3, 4, 2]",
      "boundaryOfBinaryTree([1, 2, 3, 4, 5, 6, null, null, null, 7, 8, 9, 10])  ->  [1, 2, 4, 7, 8, 9, 10, 6, 3]",
      "```",
    ].join("\n"),
    hints: [
      "Do it as three separate walks: down the left edge collecting non-leaves, an in-order pass collecting leaves, and down the right edge collecting non-leaves into a list you reverse.",
      "The root is special-cased first — a root that is itself a leaf is the whole answer — and leaves are excluded from both edge walks so they appear once.",
    ],
    solution: [
      "## Approach",
      "",
      "Three walks. Emit the root (done if it is a leaf). Walk the left boundary from `root.left`, preferring the left child and falling back to the right, emitting non-leaves. Collect leaves with a depth-first pass over both subtrees. Walk the right boundary from `root.right` the mirror way into a buffer and append it reversed. Excluding leaves from the edge walks is what keeps every value to one appearance.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(h) stack.",
      "",
      "## Worth saying out loud",
      "",
      "- The traps are a root with one child (the edge on the missing side is empty) and a left boundary that bends right when a node has only a right child.",
      "- A sum-of-the-boundary variant is the same walks with an accumulator; a complete tree makes the edges the leftmost and rightmost paths, but the general code already handles it.",
    ].join("\n"),
    judge: {
      solutionCode: `// Root, left edge down (no leaves), leaves left to right, right edge back up (no leaves).
function boundaryOfBinaryTree(root) {
  if (!root) return [];
  const isLeaf = (node) => !node.left && !node.right;
  const out = [root.val];
  if (isLeaf(root)) return out;
  for (let node = root.left; node; node = node.left ?? node.right) {
    if (!isLeaf(node)) out.push(node.val);
  }
  const leaves = (node) => {
    if (!node) return;
    if (isLeaf(node)) out.push(node.val);
    leaves(node.left);
    leaves(node.right);
  };
  leaves(root.left);
  leaves(root.right);
  const right = [];
  for (let node = root.right; node; node = node.right ?? node.left) {
    if (!isLeaf(node)) right.push(node.val);
  }
  return out.concat(right.reverse());
}
`,
      starterCode: `${NODE_DOC}
function boundaryOfBinaryTree(root) {
  // Your code here
  return [];
}
`,
      entry: "__judgeBoundary",
      driverCode: `${TREE_BUILDER}
function __judgeBoundary(values) {
  return boundaryOfBinaryTree(__buildTree(values));
}`,
      tests: [
        { name: "A right child with two leaves", input: [[1, null, 2, 3, 4]], expected: [1, 3, 4, 2] },
        { name: "A full example", input: [[1, 2, 3, 4, 5, 6, null, null, null, 7, 8, 9, 10]], expected: [1, 2, 4, 7, 8, 9, 10, 6, 3] },
        { name: "A lone root", input: [[1]], expected: [1] },
        { name: "Root and a left leaf", input: [[1, 2]], expected: [1, 2] },
        { name: "Root and a right leaf", input: [[1, null, 2]], expected: [1, 2] },
        { name: "Two leaves", input: [[1, 2, 3]], expected: [1, 2, 3] },
        { name: "Edges and leaves are distinct", input: [[1, 2, 3, 4, null, null, 5]], expected: [1, 2, 4, 5, 3] },
        { name: "Empty tree", input: [[]], expected: [] },
      ],
    },
  },
  {
    slug: "longest-univalue-path",
    title: "Longest Univalue Path",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Post-order: each node returns its longest same-value arm, and the answer is the best left arm plus right arm seen anywhere.",
    prompt: [
      "Return the length, in edges, of the longest path in a binary tree where every node on the path has the same value. The path need not pass through the root.",
      "",
      "The tree arrives as a level-order list with `null` for missing children.",
      "",
      "```",
      "longestUnivaluePath([5, 4, 5, 1, 1, null, 5])  ->  2      // 5 - 5 - 5 along the right",
      "longestUnivaluePath([1, 4, 5, 4, 4, null, 5])  ->  2      // 4 - 4 - 4 on the left",
      "```",
    ].join("\n"),
    hints: [
      "Post-order recursion: for a node, compute the longest downward arm through each child that shares its value (child's arm + 1, or 0 when the value differs).",
      "The best path through this node is left arm + right arm; return only the longer arm to the parent, since a parent's path can continue down one side only.",
    ],
    solution: [
      "## Approach",
      "",
      "A node's *arm* is the longest downward chain of its own value through one child: `child's arm + 1` when the child shares the value, else 0. The best path through a node joins its left and right arms; the function returns the longer arm upward and records the sum in a running maximum. One post-order pass.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(h) stack.",
      "",
      "## Worth saying out loud",
      "",
      "- The same return-one-arm, record-both pattern solves tree diameter and maximum path sum; name the family.",
      "- Length is in edges here; a nodes version is one more than this answer (and 1, not 0, for a lone node).",
    ].join("\n"),
    judge: {
      solutionCode: `// Post-order: return the longest same-value arm, record arm + arm along the way.
function longestUnivaluePath(root) {
  let best = 0;
  const arm = (node) => {
    if (!node) return 0;
    const left = arm(node.left);
    const right = arm(node.right);
    const leftArm = node.left && node.left.val === node.val ? left + 1 : 0;
    const rightArm = node.right && node.right.val === node.val ? right + 1 : 0;
    best = Math.max(best, leftArm + rightArm);
    return Math.max(leftArm, rightArm);
  };
  arm(root);
  return best;
}
`,
      starterCode: `${NODE_DOC}
function longestUnivaluePath(root) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeUnivalue",
      driverCode: `${TREE_BUILDER}
function __judgeUnivalue(values) {
  return longestUnivaluePath(__buildTree(values));
}`,
      tests: [
        { name: "Along the right", input: [[5, 4, 5, 1, 1, null, 5]], expected: 2 },
        { name: "Through a node on the left", input: [[1, 4, 5, 4, 4, null, 5]], expected: 2 },
        { name: "Empty tree", input: [[]], expected: 0 },
        { name: "A lone node", input: [[1]], expected: 0 },
        { name: "Every value equal", input: [[1, 1, 1, 1, 1, 1, 1]], expected: 4 },
        { name: "No two neighbours equal", input: [[1, 2, 3, 4, 5]], expected: 0 },
        { name: "A long single chain", input: [[7, 7, null, 7, null, 7]], expected: 3 },
      ],
    },
  },
  {
    slug: "step-by-step-directions",
    title: "Step-by-Step Directions Between Nodes",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Find both root paths, drop the shared prefix, and climb up from one before walking down the other.",
    prompt: [
      "A binary tree has unique values. Return the directions from `startValue` to `destValue` as a string of `U` (to the parent), `L` (to the left child) and `R` (to the right child), using the shortest route.",
      "",
      "The tree arrives as a level-order list with `null` for missing children.",
      "",
      "```",
      'getDirections([5, 1, 2, 3, null, 6, 4], 3, 6)  ->  "UURL"',
      'getDirections([2, 1], 2, 1)                     ->  "L"',
      "```",
    ].join("\n"),
    hints: [
      "Find the path from the root to each node as a string of L and R moves.",
      "Strip the common prefix — that is the lowest common ancestor — then the answer is one U per remaining step of the start path followed by the remaining destination path.",
    ],
    solution: [
      "## Approach",
      "",
      "Compute the root-to-node paths for both values with one depth-first search each, as strings of `L` and `R`. Their longest common prefix leads to the lowest common ancestor; what remains of the start path must be climbed (one `U` per letter) and what remains of the destination path is walked as is. Concatenate.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(h) stack and output.",
      "",
      "## Worth saying out loud",
      "",
      "- Finding the LCA explicitly and then two searches from it works too, but the common-prefix trick avoids the LCA code entirely.",
      "- Build the path strings with a list and a backtracking push/pop rather than string concatenation at every level, so the search stays linear.",
    ].join("\n"),
    judge: {
      solutionCode: `// Two root paths; strip the shared prefix; U's for what is left of the start path.
function getDirections(root, startValue, destValue) {
  const pathTo = (target) => {
    const steps = [];
    const search = (node) => {
      if (!node) return false;
      if (node.val === target) return true;
      steps.push("L");
      if (search(node.left)) return true;
      steps[steps.length - 1] = "R";
      if (search(node.right)) return true;
      steps.pop();
      return false;
    };
    search(root);
    return steps.join("");
  };
  const fromStart = pathTo(startValue);
  const toDest = pathTo(destValue);
  let shared = 0;
  while (shared < fromStart.length && shared < toDest.length && fromStart[shared] === toDest[shared]) shared++;
  return "U".repeat(fromStart.length - shared) + toDest.slice(shared);
}
`,
      starterCode: `${NODE_DOC}
function getDirections(root, startValue, destValue) {
  // Your code here
  return "";
}
`,
      entry: "__judgeDirections",
      driverCode: `${TREE_BUILDER}
function __judgeDirections(values, startValue, destValue) {
  return getDirections(__buildTree(values), startValue, destValue);
}`,
      tests: [
        { name: "Up twice, then right and left", input: [[5, 1, 2, 3, null, 6, 4], 3, 6], expected: "UURL" },
        { name: "Straight down", input: [[2, 1], 2, 1], expected: "L" },
        { name: "Up and over", input: [[1, 2, 3], 2, 3], expected: "UR" },
        { name: "Same node", input: [[1, 2, 3], 2, 2], expected: "" },
        { name: "Straight up", input: [[1, 2, 3, 4], 4, 1], expected: "UU" },
        { name: "Deep on both sides", input: [[1, 2, 3, 4, 5, 6, 7], 4, 7], expected: "UURR" },
      ],
    },
  },
  {
    slug: "throne-inheritance",
    title: "Throne Inheritance",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "The inheritance order is a pre-order walk of the family tree; death is a flag the walk skips, not a removal.",
    prompt: [
      "A kingdom's succession follows the family tree in pre-order: a person comes before their children, children in birth order, and each child's whole line before the next sibling. Dead people are skipped but their descendants keep their place. Design `ThroneInheritance`:",
      "",
      "```",
      "new ThroneInheritance(kingName)",
      "birth(parentName, childName)",
      "death(name)",
      "getInheritanceOrder()   // living people in succession order",
      "```",
      "",
      "```",
      "king -> andy, bob, catherine; andy -> matthew; bob -> alex, asha",
      'getInheritanceOrder()  ->  ["king", "andy", "matthew", "bob", "alex", "asha", "catherine"]',
      'death("bob")  then     ->  ["king", "andy", "matthew", "alex", "asha", "catherine"]',
      "```",
    ].join("\n"),
    hints: [
      "Store children per parent in birth order plus a set of the dead. The order is a depth-first pre-order traversal that appends a name only when it is alive.",
      "Keep death a flag rather than a deletion so the dead person's children stay attached and in place.",
    ],
    solution: [
      "## Approach",
      "",
      "The succession rule *is* pre-order traversal. Keep `children: name → [names]` in birth order and a `dead` set; `getInheritanceOrder` walks from the king, emitting living names before recursing into their children. Births append in O(1), deaths flip a flag in O(1), and the order is O(n) when asked for.",
      "",
      "## Complexity",
      "",
      "O(1) birth and death; O(n) per order query; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Use an explicit stack for the walk if the lineage can be deep.",
      "- If the order is read far more often than it changes, cache it and invalidate on birth or death; otherwise recompute, which is what the simple version does.",
    ].join("\n"),
    judge: {
      solutionCode: `// Pre-order over the family tree, skipping the dead.
class ThroneInheritance {
  constructor(kingName) {
    this.king = kingName;
    this.children = new Map();
    this.dead = new Set();
  }

  birth(parentName, childName) {
    if (!this.children.has(parentName)) this.children.set(parentName, []);
    this.children.get(parentName).push(childName);
  }

  death(name) {
    this.dead.add(name);
  }

  getInheritanceOrder() {
    const order = [];
    const stack = [this.king];
    while (stack.length > 0) {
      const name = stack.pop();
      if (!this.dead.has(name)) order.push(name);
      const kids = this.children.get(name) ?? [];
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);   // eldest on top
    }
    return order;
  }
}
`,
      starterCode: `class ThroneInheritance {
  constructor(kingName) {
    // Your state here
  }

  birth(parentName, childName) {}

  death(name) {}

  /** @returns {string[]} the living, in succession order */
  getInheritanceOrder() {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("ThroneInheritance"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["ThroneInheritance", "birth", "birth", "birth", "birth", "birth", "birth", "getInheritanceOrder", "death", "getInheritanceOrder"],
            [["king"], ["king", "andy"], ["king", "bob"], ["king", "catherine"], ["andy", "matthew"], ["bob", "alex"], ["bob", "asha"], [], ["bob"], []],
          ],
          expected: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            ["king", "andy", "matthew", "bob", "alex", "asha", "catherine"],
            null,
            ["king", "andy", "matthew", "alex", "asha", "catherine"],
          ],
        },
        {
          name: "The king alone",
          input: [
            ["ThroneInheritance", "getInheritanceOrder"],
            [["k"], []],
          ],
          expected: [null, ["k"]],
        },
        {
          name: "A dead king still passes the line to the children",
          input: [
            ["ThroneInheritance", "birth", "birth", "death", "getInheritanceOrder"],
            [["k"], ["k", "a"], ["a", "b"], ["k"], []],
          ],
          expected: [null, null, null, null, ["a", "b"]],
        },
        {
          name: "Births after a death keep their place",
          input: [
            ["ThroneInheritance", "birth", "death", "birth", "getInheritanceOrder"],
            [["k"], ["k", "a"], ["a"], ["a", "c"], []],
          ],
          expected: [null, null, null, null, ["k", "c"]],
        },
      ],
    },
  },
  {
    slug: "encode-decode-strings",
    title: "Encode and Decode Strings",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A length prefix per string beats any delimiter, because a delimiter can appear in the data.",
    prompt: [
      "Design `encode(strings)`, which turns a list of strings into one string, and `decode(encoded)`, which turns it back into the same list. The strings may contain any characters — including whatever you pick as a separator — and may be empty, and the list may be empty.",
      "",
      "```",
      'decode(encode(["hello", "world"]))  ->  ["hello", "world"]',
      'decode(encode(["", ""]))            ->  ["", ""]',
      "decode(encode([]))                   ->  []",
      "```",
      "",
      "The grader round-trips each list through your two functions.",
    ].join("\n"),
    hints: [
      "Prefix every string with its length and a terminator the length cannot contain, such as `5#hello`. Decoding reads the number, skips the terminator and slices exactly that many characters.",
      "Count in whatever unit your language's slicing uses so lengths and slices agree, and make sure an empty list encodes to something that decodes to an empty list, not to one empty string.",
    ],
    solution: [
      "## Approach",
      "",
      "A length prefix: `encode` writes `length#data` for each string, and `decode` reads digits up to the `#`, then takes exactly that many characters, repeating until the input is consumed. Because the length is read before the data, the data may contain `#`, digits or anything else. An empty list encodes to the empty string and decodes to no strings, which a delimiter-join scheme gets wrong.",
      "",
      "## Complexity",
      "",
      "O(total length) both ways.",
      "",
      "## Worth saying out loud",
      "",
      "- Compare the three designs when asked: length prefix (robust, simple), delimiter plus escaping (needs an escape pass both ways, and escaping the escape), fixed-width header (simple but caps the length or wastes space).",
      "- Say what the length counts — bytes or code units — and keep the two sides consistent, or multi-byte characters break the decoder.",
    ].join("\n"),
    judge: {
      solutionCode: `// length#data per string: the length is read before the data, so the data may contain anything.
function encode(strings) {
  let out = "";
  for (const s of strings) out += s.length + "#" + s;
  return out;
}

function decode(encoded) {
  const out = [];
  let i = 0;
  while (i < encoded.length) {
    const hash = encoded.indexOf("#", i);
    const length = Number(encoded.slice(i, hash));
    out.push(encoded.slice(hash + 1, hash + 1 + length));
    i = hash + 1 + length;
  }
  return out;
}
`,
      starterCode: `/** @param {string[]} strings @returns {string} */
function encode(strings) {
  // Your code here
  return "";
}

/** @param {string} encoded @returns {string[]} */
function decode(encoded) {
  // Your code here
  return [];
}
`,
      entry: "__judgeCodec",
      driverCode: `function __judgeCodec(strings) {
  const encoded = encode(strings.slice());
  if (typeof encoded !== "string") return "encode must return a string";
  return decode(encoded);
}`,
      tests: [
        { name: "Two words", input: [["hello", "world"]], expected: ["hello", "world"] },
        { name: "Empty strings", input: [["", ""]], expected: ["", ""] },
        { name: "An empty list", input: [[]], expected: [] },
        { name: "The data looks like the encoding", input: [["a#b", "#", "12#3", "5#hello"]], expected: ["a#b", "#", "12#3", "5#hello"] },
        { name: "Digits and separators", input: [["1", "22", ",", ";", "|"]], expected: ["1", "22", ",", ";", "|"] },
        { name: "Line breaks and tabs", input: [["line\nbreak", "tab\tbed", " "]], expected: ["line\nbreak", "tab\tbed", " "] },
        { name: "Non-ASCII text", input: [["ünïcödé", "日本語", "😀"]], expected: ["ünïcödé", "日本語", "😀"] },
        { name: "One long string", input: [["x".repeat(1000)]], expected: ["x".repeat(1000)] },
      ],
    },
  },
];
