import type { Problem } from "./types";

// Blind 75 for the Snowflake backend screen, part E: the rest of the graph
// group, intervals, and the first linked-list problems. Linked lists arrive
// as arrays and are built into { val, next } nodes by the shared driver
// below. Python in seed-python-snowflake-r.ts.

export const LIST_BUILDER = `function __buildList(values, pos = -1) {
  const nodes = values.map((val) => ({ val, next: null }));
  for (let i = 0; i + 1 < nodes.length; i++) nodes[i].next = nodes[i + 1];
  if (pos >= 0 && nodes.length > 0) nodes[nodes.length - 1].next = nodes[pos];
  return nodes[0] ?? null;
}
function __toArray(head) {
  const out = [];
  for (let node = head, i = 0; node && i < 10000; node = node.next, i++) out.push(node.val);
  return out;
}`;

export const LIST_NODE_DOC = `/** List nodes are { val, next }; next is null at the end. */`;

export const snowflakeBlindProblemsE: Problem[] = [
  {
    slug: "longest-consecutive-sequence",
    title: "Longest Consecutive Sequence",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A set, and only start counting from values whose predecessor is absent — that keeps it linear.",
    prompt: [
      "Return the length of the longest run of consecutive integers present in `nums` (order in the array does not matter), in O(n) time.",
      "",
      "```",
      "longestConsecutive([100, 4, 200, 1, 3, 2])  ->  4     // 1, 2, 3, 4",
      "longestConsecutive([])                      ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Put everything in a set. A value is the start of a run exactly when value - 1 is not in the set.",
      "From each start, count upward while the next value is present. Each value is visited by at most one count.",
    ],
    solution: [
      "## Approach",
      "",
      "Build a set. For each value whose predecessor is absent, walk `value + 1, value + 2, …` while present and record the length. Non-start values are skipped, so the total walking work is O(n).",
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Sorting gives O(n log n); the question is explicitly asking for better.",
      "- Union-find over adjacent values is another linear-ish route but more code.",
    ].join("\n"),
    judge: {
      solutionCode: `function longestConsecutive(nums) {
  const values = new Set(nums);
  let best = 0;
  for (const value of values) {
    if (values.has(value - 1)) continue;
    let length = 1;
    while (values.has(value + length)) length++;
    best = Math.max(best, length);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[]} nums
 * @returns {number} length of the longest run of consecutive integers
 */
function longestConsecutive(nums) {
  // Your code here
  return 0;
}
`,
      entry: "longestConsecutive",
      tests: [
        { name: "Prompt example", input: [[100, 4, 200, 1, 3, 2]], expected: 4 },
        { name: "Zero to eight", input: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
        { name: "Empty", input: [[]], expected: 0 },
        { name: "Duplicates", input: [[1, 2, 0, 1]], expected: 3 },
        { name: "Negatives", input: [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]], expected: 7 },
      ],
    },
  },
  {
    slug: "alien-dictionary",
    title: "Alien Dictionary",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Each adjacent word pair yields one edge; a topological order of the letters is the alphabet.",
    prompt: [
      "Words are sorted by an unknown alphabet. Derive that alphabet: return the letters in order, or `\"\"` if the words contradict every order (a cycle, or a word before its own prefix). Every letter that appears must be included. The tests use inputs with exactly one valid order.",
      "",
      "```",
      "alienOrder([\"wrt\", \"wrf\", \"er\", \"ett\", \"rftt\"])  ->  \"wertf\"",
      "alienOrder([\"z\", \"x\"])                            ->  \"zx\"",
      "alienOrder([\"z\", \"x\", \"z\"])                       ->  \"\"",
      "```",
    ].join("\n"),
    hints: [
      "Compare each adjacent pair: the first differing letter gives an edge earlier → later. A longer word before its own prefix is invalid.",
      "Kahn's algorithm over the letters; if some letter never reaches zero in-degree, there is a cycle.",
    ],
    solution: [
      "## Approach",
      "",
      "Build a graph with every letter as a node. For adjacent words, find the first position where they differ and add an edge; if one is a prefix of the other and the longer comes first, return `\"\"`. Topologically sort with a queue of zero in-degree letters. An order shorter than the letter count means a cycle.",
      "",
      "## Complexity",
      "",
      "O(total characters + 26²) time; the graph is at most 26 nodes.",
      "",
      "## Worth saying out loud",
      "",
      "- Letters with no constraints still belong in the output; seed the in-degree map from every word.",
      "- With several valid orders the problem accepts any; the tests here are constrained so one order exists.",
    ].join("\n"),
    judge: {
      solutionCode: `function alienOrder(words) {
  const after = new Map();
  const indegree = new Map();
  for (const word of words) for (const ch of word) {
    if (!after.has(ch)) after.set(ch, new Set());
    if (!indegree.has(ch)) indegree.set(ch, 0);
  }
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    let j = 0;
    while (j < a.length && j < b.length && a[j] === b[j]) j++;
    if (j === b.length && a.length > b.length) return "";
    if (j < a.length && j < b.length && !after.get(a[j]).has(b[j])) {
      after.get(a[j]).add(b[j]);
      indegree.set(b[j], indegree.get(b[j]) + 1);
    }
  }
  const queue = [...indegree.keys()].filter((ch) => indegree.get(ch) === 0);
  let order = "";
  while (queue.length) {
    const ch = queue.shift();
    order += ch;
    for (const next of after.get(ch)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  return order.length === indegree.size ? order : "";
}
`,
      starterCode: `/**
 * @param {string[]} words sorted by the unknown alphabet
 * @returns {string} the letters in alphabet order, or "" if impossible
 */
function alienOrder(words) {
  // Your code here
  return "";
}
`,
      entry: "alienOrder",
      tests: [
        { name: "Prompt example", input: [["wrt", "wrf", "er", "ett", "rftt"]], expected: "wertf" },
        { name: "Two letters", input: [["z", "x"]], expected: "zx" },
        { name: "A cycle", input: [["z", "x", "z"]], expected: "" },
        { name: "Prefix after the longer word", input: [["abc", "ab"]], expected: "" },
        { name: "Equal words", input: [["z", "z"]], expected: "z" },
        { name: "Three letters", input: [["ba", "bc", "ac", "cab"]], expected: "bac" },
      ],
    },
  },
  {
    slug: "non-overlapping-intervals",
    title: "Non-overlapping Intervals",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Sort by end; keep the interval that ends earliest, drop anything starting before it ends.",
    prompt: [
      "Return the minimum number of intervals to remove so that the rest do not overlap. Touching intervals (`[1,2]` and `[2,3]`) do not overlap.",
      "",
      "```",
      "eraseOverlapIntervals([[1, 2], [2, 3], [3, 4], [1, 3]])  ->  1",
      "eraseOverlapIntervals([[1, 2], [1, 2], [1, 2]])          ->  2",
      "```",
    ].join("\n"),
    hints: [
      "Keeping the most intervals is the activity-selection problem: sort by end time, greedily keep each interval that starts at or after the last kept end.",
      "The answer is the total minus the kept count.",
    ],
    solution: [
      "## Approach",
      "",
      "Sort by right endpoint. Walk through, keeping an interval when its start is at least the end of the last kept one, otherwise counting it as removed. Keeping the earliest-ending interval leaves the most room for the rest, which is the exchange argument.",
      "",
      "## Complexity",
      "",
      "O(n log n) time, O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- Sorting by start and dropping the longer of two overlapping intervals also works, with a slightly longer argument.",
      "- Same greedy as Minimum Number of Arrows to Burst Balloons.",
    ].join("\n"),
    judge: {
      solutionCode: `function eraseOverlapIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let removed = 0;
  let end = -Infinity;
  for (const [start, finish] of sorted) {
    if (start >= end) end = finish;
    else removed++;
  }
  return removed;
}
`,
      starterCode: `/**
 * @param {number[][]} intervals [start, end] pairs
 * @returns {number} fewest removals so that no two overlap
 */
function eraseOverlapIntervals(intervals) {
  // Your code here
  return 0;
}
`,
      entry: "eraseOverlapIntervals",
      tests: [
        { name: "Prompt example", input: [[[1, 2], [2, 3], [3, 4], [1, 3]]], expected: 1 },
        { name: "All identical", input: [[[1, 2], [1, 2], [1, 2]]], expected: 2 },
        { name: "Touching", input: [[[1, 2], [2, 3]]], expected: 0 },
        { name: "Empty", input: [[]], expected: 0 },
        { name: "One long interval", input: [[[1, 100], [11, 22], [1, 11], [2, 12]]], expected: 2 },
      ],
    },
  },
  {
    slug: "meeting-rooms",
    title: "Meeting Rooms",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Sort by start and check each meeting begins no earlier than the previous one ends.",
    prompt: [
      "Given meeting intervals `[start, end]`, return whether one person could attend all of them (no two overlap; a meeting may start exactly when another ends).",
      "",
      "```",
      "canAttendMeetings([[0, 30], [5, 10], [15, 20]])  ->  false",
      "canAttendMeetings([[7, 10], [2, 4]])             ->  true",
      "```",
    ].join("\n"),
    hints: ["Sort by start time; a conflict is any meeting that starts before the previous one ends."],
    solution: [
      "## Approach",
      "",
      "Sort by start and compare each meeting's start with the previous meeting's end. Any start before that end is an overlap.",
      "",
      "## Complexity",
      "",
      "O(n log n) time.",
      "",
      "## Worth saying out loud",
      "",
      "- Meeting Rooms II (how many rooms) is the follow-up: a min-heap of end times, or sorted starts and ends swept together.",
    ].join("\n"),
    judge: {
      solutionCode: `function canAttendMeetings(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] < sorted[i - 1][1]) return false;
  }
  return true;
}
`,
      starterCode: `/**
 * @param {number[][]} intervals [start, end] pairs
 * @returns {boolean} whether none of them overlap
 */
function canAttendMeetings(intervals) {
  // Your code here
  return false;
}
`,
      entry: "canAttendMeetings",
      tests: [
        { name: "Prompt example", input: [[[0, 30], [5, 10], [15, 20]]], expected: false },
        { name: "Out of order but fine", input: [[[7, 10], [2, 4]]], expected: true },
        { name: "No meetings", input: [[]], expected: true },
        { name: "Back to back", input: [[[1, 5], [5, 8]]], expected: true },
        { name: "Nested", input: [[[1, 10], [2, 3]]], expected: false },
      ],
    },
  },
  {
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Three pointers — previous, current, next — and the list is reversed in place in one pass.",
    prompt: [
      "Reverse a singly linked list and return the new head. Nodes are `{ val, next }` with `next` null at the end. Tests build the list from an array and read your result back the same way.",
      "",
      "```",
      "reverseList(1 -> 2 -> 3 -> 4 -> 5)  ->  5 -> 4 -> 3 -> 2 -> 1",
      "reverseList(empty)                  ->  empty",
      "```",
    ].join("\n"),
    hints: [
      "Walk the list keeping `prev` and `current`; at each node save `current.next`, point `current.next` at `prev`, then advance both.",
      "When `current` runs out, `prev` is the new head. Do it recursively afterwards if asked.",
    ],
    solution: [
      "## Approach",
      "",
      "Iterate with `prev = null`. For each node, remember its successor, redirect `next` to `prev`, and move forward. The last `prev` is the new head.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space; the recursive version uses O(n) stack.",
      "",
      "## Worth saying out loud",
      "",
      "- Reverse Linked List II (a sublist between positions) and reversing in k-groups reuse this exact loop with boundaries.",
      "- Draw the three pointers; interviewers watch for the lost-successor bug.",
    ].join("\n"),
    judge: {
      solutionCode: `${LIST_NODE_DOC}
function reverseList(head) {
  let prev = null;
  let current = head;
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  return prev;
}
`,
      starterCode: `${LIST_NODE_DOC}
/**
 * @param {{ val: number, next: object | null } | null} head
 * @returns {{ val: number, next: object | null } | null} the reversed list's head
 */
function reverseList(head) {
  // Your code here
  return head;
}
`,
      entry: "__judgeReverse",
      driverCode: `${LIST_BUILDER}
function __judgeReverse(values) {
  return __toArray(reverseList(__buildList(values)));
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
        { name: "Two nodes", input: [[1, 2]], expected: [2, 1] },
        { name: "Empty", input: [[]], expected: [] },
        { name: "One node", input: [[7]], expected: [7] },
      ],
    },
  },
  {
    slug: "linked-list-cycle",
    title: "Linked List Cycle",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Floyd's tortoise and hare: a fast pointer laps a slow one only if there is a loop.",
    prompt: [
      "Return whether a singly linked list contains a cycle. Nodes are `{ val, next }`. Tests build the list from an array plus `pos`, the index the tail links back to (-1 for none).",
      "",
      "```",
      "hasCycle([3, 2, 0, -4], pos 1)  ->  true",
      "hasCycle([1], pos -1)           ->  false",
      "```",
      "",
      "Use O(1) extra space.",
    ].join("\n"),
    hints: [
      "A set of visited nodes works in O(n) space; the follow-up wants constant space.",
      "Move one pointer one step and another two steps; they meet if and only if there is a cycle.",
    ],
    solution: [
      "## Approach",
      "",
      "Two pointers from the head: `slow` advances one node, `fast` two. If `fast` reaches null the list ends; if `fast` ever equals `slow` there is a cycle, since inside a loop the gap between them shrinks by one each step.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Linked List Cycle II (find where the cycle starts) continues from the meeting point with a second pointer from the head.",
      "- Compare nodes by identity, never by value; values repeat.",
    ].join("\n"),
    judge: {
      solutionCode: `${LIST_NODE_DOC}
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
`,
      starterCode: `${LIST_NODE_DOC}
/**
 * @param {{ val: number, next: object | null } | null} head
 * @returns {boolean} whether the list loops
 */
function hasCycle(head) {
  // Your code here
  return false;
}
`,
      entry: "__judgeCycle",
      driverCode: `${LIST_BUILDER}
function __judgeCycle(values, pos) {
  return hasCycle(__buildList(values, pos));
}`,
      tests: [
        { name: "Prompt example", input: [[3, 2, 0, -4], 1], expected: true },
        { name: "Loop to the head", input: [[1, 2], 0], expected: true },
        { name: "One node, no loop", input: [[1], -1], expected: false },
        { name: "Empty", input: [[], -1], expected: false },
        { name: "Tail loops to itself", input: [[1, 2, 3, 4, 5], 4], expected: true },
        { name: "Repeated values, no loop", input: [[1, 1, 1], -1], expected: false },
      ],
    },
  },
];
