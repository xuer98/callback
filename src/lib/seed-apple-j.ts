import type { Problem } from "./types";

// Apple phone-screen bank, part J: recurring classics reported in Apple
// screens — Group Anagrams, Basic Calculator II, sorted list to balanced BST.
// Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsJ: Problem[] = [
  {
    slug: "group-anagrams",
    title: "Group Anagrams",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "A 26-count key instead of sorting each word — the only decision in the problem.",
    prompt: [
      "Group the anagrams in a list of lowercase words. Return the groups with each group sorted ascending and the groups ordered by their first word.",
      "",
      "```",
      "groupAnagrams([\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"])",
      "  ->  [[\"ate\", \"eat\", \"tea\"], [\"bat\"], [\"nat\", \"tan\"]]",
      "```",
      "",
      "Duplicates stay in their group. Reported in an Apple phone screen (solved in 15 minutes, with the rest of the slot behavioural) and again in a full-stack loop.",
      "",
      "## Worth asking out loud",
      "",
      "Lowercase ASCII only, or Unicode? Is the output order specified? How long are the words — does O(L) per word versus O(L log L) matter?",
    ].join("\n"),
    hints: [
      "Anagrams share a canonical key. Sorting each word gives one in O(L log L); a 26-slot letter count gives one in O(L).",
      "Bucket words by key in a map, then sort inside each bucket and sort the buckets by first element for deterministic output.",
    ],
    solution: [
      "## Approach",
      "",
      "Use a 26-length count as the key, not the sorted word — O(L) instead of O(L log L). Say that; it is the only decision in the problem. Count each word's letters, join the counts into a string key, and append the word to that key's bucket. Sorting the buckets and their contents is only for a deterministic answer.",
      "",
      "## Complexity",
      "",
      "O(N·L) to key N words of length L, plus the sorts for output; O(N·L) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The sorted-word key is fine in the room if you note the extra log factor; the count key is the one that scales to long strings.",
      "- Unicode input breaks the 26-slot array — a map of character counts is the general form, and saying so shows you read the constraint.",
    ].join("\n"),
    judge: {
      solutionCode: `function groupAnagrams(words) {
  const groups = new Map();
  for (const word of words) {
    const counts = new Array(26).fill(0);
    for (const ch of word) counts[ch.charCodeAt(0) - 97]++;
    const key = counts.join(","); // O(L) key, beats sorting
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()]
    .map((group) => group.sort())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}
`,
      starterCode: `/**
 * @param {string[]} words lowercase a-z
 * @returns {string[][]} each group sorted; groups ordered by first word
 */
function groupAnagrams(words) {
  // Your code here
  return [];
}
`,
      entry: "groupAnagrams",
      tests: [
        {
          name: "Prompt example",
          input: [["eat", "tea", "tan", "ate", "nat", "bat"]],
          expected: [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]],
        },
        { name: "Empty string", input: [[""]], expected: [[""]] },
        { name: "Single word", input: [["a"]], expected: [["a"]] },
        { name: "Duplicates stay in their group", input: [["ab", "ba", "ab"]], expected: [["ab", "ab", "ba"]] },
        {
          name: "Three groups of different sizes",
          input: [["abc", "bca", "cab", "xyz", "zyx", "q"]],
          expected: [["abc", "bca", "cab"], ["q"], ["xyz", "zyx"]],
        },
        { name: "No words", input: [[]], expected: [] },
        { name: "Same letters, different counts", input: [["aab", "abb", "aba"]], expected: [["aab", "aba"], ["abb"]] },
      ],
    },
  },
  {
    slug: "basic-calculator-ii",
    title: "Basic Calculator II",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "One pass with a stack of signed terms; the trap is integer division truncating toward zero.",
    prompt: [
      "Evaluate an expression of non-negative integers, `+ - * /` and spaces, with normal precedence and **integer division truncating toward zero**. No parentheses, no unary operators; the result fits in a 32-bit integer.",
      "",
      "```",
      "calculate(\"3+2*2\")      ->  7",
      "calculate(\" 3/2 \")      ->  1",
      "calculate(\" 3+5 / 2 \")  ->  5",
      "calculate(\"1-7/2\")      ->  -2      // -7/2 truncates to -3, not -4",
      "```",
      "",
      "Reported for an Apple Senior Software Engineer technical phone screen with a senior engineer, on WebEx plus CoderPad.",
      "",
      "## Worth asking out loud",
      "",
      "Are parentheses or unary minus possible? Does division truncate toward zero or floor? Can a number have leading spaces or multiple digits? Should an invalid expression throw?",
    ].join("\n"),
    hints: [
      "Scan once, building the current number digit by digit. When an operator (or the end) arrives, apply the previous operator: push the number for +, its negation for -, and for * or / pop the last term and push the product or quotient.",
      "The answer is the sum of the stack. Division must truncate toward zero: floor division gives the wrong sign for negative terms, so truncate explicitly.",
    ],
    solution: [
      "## Approach",
      "",
      "One pass with a stack of signed terms. Keep the pending operator and the number being read; each operator (and a sentinel `+` at the end) applies the pending one: `+` pushes the number, `-` pushes its negation, `*` and `/` combine with the term on top of the stack so precedence is handled without a second pass. The trap is integer division truncating toward zero: `-3 // 2` is `-2` in Python and `Math.floor(-3 / 2)` is `-2` in JavaScript, but the answer wants `-1`, so use `int(t / num)` or `Math.trunc`.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) stack in the worst case, O(1) if you keep a running sum plus the last term instead.",
      "",
      "## Worth saying out loud",
      "",
      "- The stack collapses to two variables — the running total and the last term — which is the follow-up if they ask for O(1) space.",
      "- Parentheses turn this into LeetCode 224: recurse or push the running state on `(` and pop on `)`.",
    ].join("\n"),
    judge: {
      solutionCode: `// One pass over the string with a stack of signed terms.
function calculate(s) {
  const stack = [];
  let number = 0;
  let op = "+";
  const input = s + "+"; // sentinel so the last number is applied
  for (const ch of input) {
    if (ch >= "0" && ch <= "9") {
      number = number * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch !== " ") {
      if (op === "+") stack.push(number);
      else if (op === "-") stack.push(-number);
      else if (op === "*") stack.push(stack.pop() * number);
      else stack.push(Math.trunc(stack.pop() / number)); // truncate toward zero
      number = 0;
      op = ch;
    }
  }
  return stack.reduce((sum, term) => sum + term, 0);
}
`,
      starterCode: `/**
 * @param {string} s digits, + - * / and spaces; division truncates toward zero
 * @returns {number}
 */
function calculate(s) {
  // Your code here
  return 0;
}
`,
      entry: "calculate",
      tests: [
        { name: "Precedence", input: ["3+2*2"], expected: 7 },
        { name: "Division truncates", input: [" 3/2 "], expected: 1 },
        { name: "Spaces everywhere", input: [" 3+5 / 2 "], expected: 5 },
        { name: "Subtraction then division", input: ["14-3/2"], expected: 13 },
        { name: "Negative term truncates toward zero", input: ["1-7/2"], expected: -2 },
        { name: "A single number", input: ["42"], expected: 42 },
        { name: "Chained multiplication", input: ["2*3*4"], expected: 24 },
        { name: "Chained division is left-associative", input: ["100/10/2"], expected: 5 },
        { name: "Zero term", input: ["0*5+3"], expected: 3 },
        { name: "Left-to-right subtraction", input: ["10-2-3"], expected: 5 },
      ],
    },
  },
  {
    slug: "sorted-list-to-bst",
    title: "Sorted List to Balanced BST",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Build in-order and pull values off a forward-only iterator — no middle-finding, no array copy.",
    prompt: [
      "Turn a sorted singly linked list into a height-balanced binary search tree. The harness hands you a **forward-only iterator** over the values plus the count `n`; do not copy the values into an array, and do not walk the list repeatedly to find middles.",
      "",
      "Build the subtree for index range `[lo, hi]` with root at `mid = floor((lo + hi) / 2)`, so the result is deterministic: for `1 → 2 → 5 → 6 → 8 → 10 → 19` the root is `6`.",
      "",
      "```",
      "sortedListToBst(iterator over [1, 2, 5, 6, 8, 10, 19], 7)",
      "        6",
      "      /   \\",
      "     2     10",
      "    / \\   /  \\",
      "   1   5 8    19",
      "```",
      "",
      "Return the root node; nodes have `val`, `left` and `right`. The harness serialises the tree in level order with `null` for missing children (trailing nulls trimmed): `[6, 2, 10, 1, 5, 8, 19]`.",
      "",
      "Reported in an Apple phone screen with exactly that example and expected root.",
      "",
      "## Worth asking out loud",
      "",
      "Can I traverse the list more than once? Is copying to an array acceptable (O(n) extra space) or is the point to avoid it? Which middle for an even count?",
    ].join("\n"),
    hints: [
      "Simulate an in-order traversal: build(lo, hi) recursively builds the left subtree for [lo, mid − 1], then takes the next value from the iterator as the root, then builds the right subtree — the values arrive in exactly in-order sequence.",
      "The recursion depth is O(log n) for a balanced build, and the iterator is consumed exactly once. The O(n log n) find-the-middle version is what to say first, then improve.",
    ],
    solution: [
      "## Approach",
      "",
      "Do not find the middle by walking the list each time. Build in-order and pull values off the iterator as you go: `build(lo, hi)` builds the left subtree, creates the root from the next value, then builds the right subtree. Because the tree is built in in-order sequence, the k-th node created receives the k-th value — no array, no repeated middle-finding, and it works on a list you can only traverse forwards.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(log n) stack; no copy of the values.",
      "",
      "## Worth saying out loud",
      "",
      "- Say the O(n log n) slow-fast-pointer version first, then this one; the improvement is the point of the question.",
      "- The mid rule decides the shape for even counts. Ask which middle they want and state it before writing.",
    ].join("\n"),
    judge: {
      solutionCode: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// In-order simulation: O(n) time, O(log n) stack, one pass over the iterator.
function sortedListToBst(iterator, n) {
  function build(lo, hi) {
    if (lo > hi) return null;
    const mid = Math.floor((lo + hi) / 2);
    const left = build(lo, mid - 1);
    const node = new TreeNode(iterator.next().value);
    node.left = left;
    node.right = build(mid + 1, hi);
    return node;
  }
  return build(0, n - 1);
}
`,
      starterCode: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

/**
 * @param {Iterator<number>} iterator forward-only; iterator.next().value yields the next sorted value
 * @param {number} n how many values there are
 * @returns {TreeNode|null} the root
 */
function sortedListToBst(iterator, n) {
  // Your code here
  return null;
}
`,
      entry: "__judgeBst",
      driverCode: `function __judgeBst(values) {
  const root = sortedListToBst(values[Symbol.iterator](), values.length);
  const out = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null || node === undefined) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left, node.right);
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 5, 6, 8, 10, 19]], expected: [6, 2, 10, 1, 5, 8, 19] },
        { name: "Empty list", input: [[]], expected: [] },
        { name: "One value", input: [[1]], expected: [1] },
        { name: "Two values: lower middle is the root", input: [[1, 2]], expected: [1, null, 2] },
        { name: "Three values", input: [[1, 2, 3]], expected: [2, 1, 3] },
        { name: "Four values", input: [[1, 2, 3, 4]], expected: [2, 1, 3, null, null, null, 4] },
        { name: "Ten values", input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], expected: [5, 2, 8, 1, 3, 6, 9, null, null, null, 4, null, 7, null, 10] },
      ],
    },
  },
];
