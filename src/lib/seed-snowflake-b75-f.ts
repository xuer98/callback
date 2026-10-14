import type { Problem } from "./types";
import { LIST_BUILDER, LIST_NODE_DOC } from "./seed-snowflake-b75-e";

// Blind 75 for the Snowflake backend screen, part F: the rest of the
// linked-list group, the matrix group, and the first string problem.
// Python in seed-python-snowflake-s.ts.

export const snowflakeBlindProblemsF: Problem[] = [
  {
    slug: "remove-nth-node-from-end",
    title: "Remove Nth Node From End of List",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Two pointers n apart, started from a dummy head, so the one that stops is just before the victim.",
    prompt: [
      "Remove the n-th node from the end of a singly linked list and return the head. Nodes are `{ val, next }`; n is valid (between 1 and the length).",
      "",
      "```",
      "removeNthFromEnd(1 -> 2 -> 3 -> 4 -> 5, 2)  ->  1 -> 2 -> 3 -> 5",
      "removeNthFromEnd(1, 1)                      ->  empty",
      "```",
      "",
      "One pass, please.",
    ].join("\n"),
    hints: [
      "Advance a lead pointer n steps, then move lead and a trailing pointer together until lead hits the end; the trailer sits before the node to remove.",
      "A dummy node before the head makes removing the first node the same as any other.",
    ],
    solution: [
      "## Approach",
      "",
      "Create a dummy node pointing at the head. Move `lead` n + 1 steps from the dummy, then advance `lead` and `trail` together until `lead` is null. `trail.next` is the node to drop; splice it out and return `dummy.next`.",
      "",
      "## Complexity",
      "",
      "O(length) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Two passes (count, then walk) is fine too; the one-pass version is what the follow-up asks for.",
      "- The dummy head is the standard way to avoid a special case for removing the head.",
    ].join("\n"),
    judge: {
      solutionCode: `${LIST_NODE_DOC}
function removeNthFromEnd(head, n) {
  const dummy = { val: 0, next: head };
  let lead = dummy;
  let trail = dummy;
  for (let i = 0; i <= n; i++) lead = lead.next;
  while (lead) {
    lead = lead.next;
    trail = trail.next;
  }
  trail.next = trail.next.next;
  return dummy.next;
}
`,
      starterCode: `${LIST_NODE_DOC}
/**
 * @param {{ val: number, next: object | null } | null} head
 * @param {number} n 1-based from the end
 * @returns {{ val: number, next: object | null } | null} the head after removal
 */
function removeNthFromEnd(head, n) {
  // Your code here
  return head;
}
`,
      entry: "__judgeRemoveNth",
      driverCode: `${LIST_BUILDER}
function __judgeRemoveNth(values, n) {
  return __toArray(removeNthFromEnd(__buildList(values), n));
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 4, 5], 2], expected: [1, 2, 3, 5] },
        { name: "Only node", input: [[1], 1], expected: [] },
        { name: "Remove the tail", input: [[1, 2], 1], expected: [1] },
        { name: "Remove the head", input: [[1, 2], 2], expected: [2] },
      ],
    },
  },
  {
    slug: "reorder-list",
    title: "Reorder List",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Find the middle, reverse the second half, then weave the two halves together.",
    prompt: [
      "Reorder a singly linked list `L0 → L1 → … → Ln` in place to `L0 → Ln → L1 → Ln-1 → L2 → …`, changing only the `next` pointers, not the values. Nodes are `{ val, next }`; the tests read the list back from the original head.",
      "",
      "```",
      "reorderList(1 -> 2 -> 3 -> 4)       ->  1 -> 4 -> 2 -> 3",
      "reorderList(1 -> 2 -> 3 -> 4 -> 5)  ->  1 -> 5 -> 2 -> 4 -> 3",
      "```",
    ].join("\n"),
    hints: [
      "Three known tools in sequence: slow/fast pointers to find the middle, reverse the second half, merge alternately.",
      "Cut the first half's tail (`slow.next = null`) before merging, or the loop never ends.",
    ],
    solution: [
      "## Approach",
      "",
      "Find the middle with slow and fast pointers, detach the second half and reverse it, then alternate nodes from the first and second halves. The first half is never shorter than the second, so the merge ends cleanly.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Copying to an array and relinking is O(n) space; say it, then do the pointer version.",
      "- Each sub-step is a classic problem on its own; interviewers like hearing them named.",
    ].join("\n"),
    judge: {
      solutionCode: `${LIST_NODE_DOC}
function reorderList(head) {
  if (!head || !head.next) return;
  let slow = head;
  let fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second) {
    const next = second.next;
    second.next = prev;
    prev = second;
    second = next;
  }
  let first = head;
  second = prev;
  while (second) {
    const firstNext = first.next;
    const secondNext = second.next;
    first.next = second;
    second.next = firstNext;
    first = firstNext;
    second = secondNext;
  }
}
`,
      starterCode: `${LIST_NODE_DOC}
/**
 * Reorders the list in place; returns nothing.
 * @param {{ val: number, next: object | null } | null} head
 */
function reorderList(head) {
  // Your code here
}
`,
      entry: "__judgeReorder",
      driverCode: `${LIST_BUILDER}
function __judgeReorder(values) {
  const head = __buildList(values);
  reorderList(head);
  return __toArray(head);
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 4]], expected: [1, 4, 2, 3] },
        { name: "Odd length", input: [[1, 2, 3, 4, 5]], expected: [1, 5, 2, 4, 3] },
        { name: "One node", input: [[1]], expected: [1] },
        { name: "Empty", input: [[]], expected: [] },
        { name: "Two nodes", input: [[1, 2]], expected: [1, 2] },
      ],
    },
  },
  {
    slug: "set-matrix-zeroes",
    title: "Set Matrix Zeroes",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Use the first row and column as the markers, with two flags for the row and column themselves.",
    prompt: [
      "If an element of an `m × n` matrix is 0, set its entire row and column to 0. Do it in place; the tests read the matrix back after your call.",
      "",
      "```",
      "setZeroes([[1, 1, 1], [1, 0, 1], [1, 1, 1]])  ->  [[1, 0, 1], [0, 0, 0], [1, 0, 1]]",
      "```",
      "",
      "Aim for O(1) extra space.",
    ].join("\n"),
    hints: [
      "O(m + n) space: record which rows and columns contain a zero, then clear them.",
      "O(1): store those marks in the first row and first column, after noting separately whether the first row and first column themselves need clearing.",
    ],
    solution: [
      "## Approach",
      "",
      "First note whether the first row and the first column contain a zero. Then for every other cell that is zero, set `matrix[r][0] = 0` and `matrix[0][c] = 0` as markers. Clear the interior from those markers, and finally clear the first row and column according to the two flags.",
      "",
      "## Complexity",
      "",
      "O(m × n) time, O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- The naive \"set as you go\" cascades zeros across the whole matrix; the markers exist to avoid that.",
      "- The O(m + n) version is acceptable first; offer the in-place one as the follow-up.",
    ].join("\n"),
    judge: {
      solutionCode: `function setZeroes(matrix) {
  const rows = matrix.length;
  const cols = rows ? matrix[0].length : 0;
  let firstRowZero = false;
  let firstColZero = false;
  for (let c = 0; c < cols; c++) if (matrix[0][c] === 0) firstRowZero = true;
  for (let r = 0; r < rows; r++) if (matrix[r][0] === 0) firstColZero = true;
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
    }
  }
  if (firstRowZero) for (let c = 0; c < cols; c++) matrix[0][c] = 0;
  if (firstColZero) for (let r = 0; r < rows; r++) matrix[r][0] = 0;
}
`,
      starterCode: `/**
 * Zeroes rows and columns in place; returns nothing.
 * @param {number[][]} matrix
 */
function setZeroes(matrix) {
  // Your code here
}
`,
      entry: "__judgeZeroes",
      driverCode: `function __judgeZeroes(matrix) {
  setZeroes(matrix);
  return matrix;
}`,
      tests: [
        { name: "Prompt example", input: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] },
        {
          name: "Zeros in the first row",
          input: [[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]],
          expected: [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]],
        },
        { name: "No zeros", input: [[[1]]], expected: [[1]] },
        { name: "All zero", input: [[[0]]], expected: [[0]] },
        { name: "Zero in the first column", input: [[[1, 2], [0, 3]]], expected: [[0, 2], [0, 0]] },
      ],
    },
  },
  {
    slug: "spiral-matrix",
    title: "Spiral Matrix",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Four shrinking boundaries; the two inner edges need a guard so a single row or column is not read twice.",
    prompt: [
      "Return every element of an `m × n` matrix in spiral order: along the top row, down the right column, back along the bottom row, up the left column, then inward.",
      "",
      "```",
      "spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]])  ->  [1, 2, 3, 6, 9, 8, 7, 4, 5]",
      "```",
    ].join("\n"),
    hints: [
      "Keep top, bottom, left, right boundaries. Read one edge, move its boundary inward, repeat while top <= bottom and left <= right.",
      "Before the bottom and left edges, re-check the boundaries: a last single row or column would otherwise be read twice.",
    ],
    solution: [
      "## Approach",
      "",
      "Peel the matrix layer by layer with four boundary indices. After reading the top row and right column, read the bottom row only if `top <= bottom` and the left column only if `left <= right`.",
      "",
      "## Complexity",
      "",
      "O(m × n) time, O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- The direction-vector version (turn right when the next cell is visited or out of bounds) is the same count of code and generalises to Spiral Matrix II.",
      "- Test a 1 × n and an n × 1 matrix; both expose the double-read bug.",
    ].join("\n"),
    judge: {
      solutionCode: `function spiralOrder(matrix) {
  const out = [];
  if (matrix.length === 0) return out;
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}
`,
      starterCode: `/**
 * @param {number[][]} matrix
 * @returns {number[]} the elements in spiral order
 */
function spiralOrder(matrix) {
  // Your code here
  return [];
}
`,
      entry: "spiralOrder",
      tests: [
        { name: "Prompt example", input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [1, 2, 3, 6, 9, 8, 7, 4, 5] },
        {
          name: "Wider than tall",
          input: [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]],
          expected: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7],
        },
        { name: "One cell", input: [[[1]]], expected: [1] },
        { name: "One column", input: [[[1], [2], [3]]], expected: [1, 2, 3] },
        { name: "One row", input: [[[1, 2, 3]]], expected: [1, 2, 3] },
        { name: "Empty", input: [[]], expected: [] },
      ],
    },
  },
  {
    slug: "rotate-image",
    title: "Rotate Image",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Transpose, then reverse each row — a 90° clockwise rotation in place with no temporary matrix.",
    prompt: [
      "Rotate an `n × n` matrix 90 degrees clockwise in place. The tests read the matrix back after your call.",
      "",
      "```",
      "rotate([[1, 2, 3], [4, 5, 6], [7, 8, 9]])  ->  [[7, 4, 1], [8, 5, 2], [9, 6, 3]]",
      "```",
    ].join("\n"),
    hints: [
      "A clockwise rotation moves (r, c) to (c, n-1-r). Transposing moves it to (c, r); reversing each row then fixes the column.",
      "Transpose by swapping across the diagonal for c > r only, or every pair swaps back.",
    ],
    solution: [
      "## Approach",
      "",
      "Transpose the matrix (swap `matrix[r][c]` with `matrix[c][r]` for `c > r`), then reverse every row. Counter-clockwise is transpose then reverse each column.",
      "",
      "## Complexity",
      "",
      "O(n²) time, O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- The four-way cycle swap (rotating each group of four cells) is the other in-place method; it is harder to index correctly under pressure.",
      "- Check a 1 × 1 and a 2 × 2 out loud.",
    ].join("\n"),
    judge: {
      solutionCode: `function rotate(matrix) {
  const n = matrix.length;
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
    }
  }
  for (const row of matrix) row.reverse();
}
`,
      starterCode: `/**
 * Rotates the square matrix clockwise in place; returns nothing.
 * @param {number[][]} matrix
 */
function rotate(matrix) {
  // Your code here
}
`,
      entry: "__judgeRotate",
      driverCode: `function __judgeRotate(matrix) {
  rotate(matrix);
  return matrix;
}`,
      tests: [
        { name: "Prompt example", input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] },
        {
          name: "Four by four",
          input: [[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]],
          expected: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]],
        },
        { name: "One cell", input: [[[1]]], expected: [[1]] },
        { name: "Two by two", input: [[[1, 2], [3, 4]]], expected: [[3, 1], [4, 2]] },
      ],
    },
  },
  {
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A sliding window whose left edge jumps to just past the last occurrence of the repeated character.",
    prompt: [
      "Return the length of the longest substring of `s` with no repeated character.",
      "",
      "```",
      "lengthOfLongestSubstring(\"abcabcbb\")  ->  3     // abc",
      "lengthOfLongestSubstring(\"bbbbb\")     ->  1",
      "lengthOfLongestSubstring(\"pwwkew\")    ->  3     // wke",
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from character to its last index. When the current character was seen inside the window, move the window start past that index.",
      "The window never moves backwards: take max(start, lastIndex + 1).",
    ],
    solution: [
      "## Approach",
      "",
      "Sliding window with a last-seen map. For each index `i`, if `s[i]` was last seen at or after `start`, set `start` to that index plus one; record `i - start + 1` as a candidate; update the map.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(alphabet) space.",
      "",
      "## Worth saying out loud",
      "",
      "- `\"abba\"` is the test that catches a window start moving backwards.",
      "- The same window with a count map answers \"at most k distinct characters\".",
    ].join("\n"),
    judge: {
      solutionCode: `function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();
  let start = 0;
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    const seen = lastSeen.get(s[i]);
    if (seen !== undefined && seen >= start) start = seen + 1;
    lastSeen.set(s[i], i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {string} s
 * @returns {number} length of the longest substring without a repeated character
 */
function lengthOfLongestSubstring(s) {
  // Your code here
  return 0;
}
`,
      entry: "lengthOfLongestSubstring",
      tests: [
        { name: "Prompt example", input: ["abcabcbb"], expected: 3 },
        { name: "All the same", input: ["bbbbb"], expected: 1 },
        { name: "Window in the middle", input: ["pwwkew"], expected: 3 },
        { name: "Empty", input: [""], expected: 0 },
        { name: "Repeat outside the window", input: ["dvdf"], expected: 3 },
        { name: "Start must not move back", input: ["abba"], expected: 2 },
      ],
    },
  },
];
