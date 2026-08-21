import type { Problem, Track } from "./types";

// Canonical seed content. Postgres is the runtime read path (src/lib/data.ts);
// edit content here, then sync the database with `npm run db:seed`.

export const problems: Problem[] = [
  {
    slug: "pair-sum-sorted",
    title: "Pair Sum in a Sorted Array",
    category: "algorithms",
    difficulty: "easy",
    companies: ["google", "amazon"],
    summary: "The two-pointer warm-up every loop still asks.",
    prompt:
      "Given an array of integers sorted in ascending order and a target value, return the indices of two distinct elements that sum to the target, or [-1, -1] if no such pair exists.\n\nFollow-up: solve it in O(n) time and O(1) extra space, then discuss how your approach changes if the array is unsorted.",
    hints: [
      "Start one pointer at each end. What does the current sum tell you about which pointer can safely move?",
      "If the sum is too small, moving the right pointer left only makes it smaller — so only one move can ever help.",
    ],
    judge: {
      starterCode: `/**
 * @param {number[]} numbers - sorted ascending
 * @param {number} target
 * @returns {number[]} indices [i, j] with i < j, or [-1, -1]
 */
function pairSum(numbers, target) {
  // Your code here
  return [-1, -1];
}
`,
      entry: "pairSum",
      tests: [
        { input: [[1, 2, 4, 7, 11, 15], 15], expected: [2, 4] },
        { input: [[-3, -1, 0, 2, 6], 3], expected: [0, 4] },
        { input: [[2, 3], 5], expected: [0, 1] },
        { input: [[1, 2, 3], 7], expected: [-1, -1] },
      ],
    },
  },
  {
    slug: "merge-intervals",
    title: "Merge Overlapping Intervals",
    category: "algorithms",
    difficulty: "medium",
    companies: ["google", "meta"],
    summary: "Sort, then sweep — the pattern behind a dozen calendar problems.",
    prompt:
      "Given a list of intervals [start, end], merge all overlapping intervals and return the result sorted by start time.\n\nFollow-up: how would you handle a stream of intervals that arrive out of order?",
    hints: [
      "Sort by start time first. What invariant does that buy you when you sweep left to right?",
      "An interval overlaps the last merged one exactly when its start is less than or equal to the last merged end.",
    ],
    judge: {
      starterCode: `/**
 * @param {number[][]} intervals - [start, end] pairs, in any order
 * @returns {number[][]} merged intervals, sorted by start
 */
function mergeIntervals(intervals) {
  // Your code here
  return intervals;
}
`,
      entry: "mergeIntervals",
      tests: [
        {
          input: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
          expected: [[1, 6], [8, 10], [15, 18]],
        },
        { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
        { input: [[[3, 4], [1, 2]]], expected: [[1, 2], [3, 4]] },
        { input: [[[1, 10], [2, 3], [4, 5]]], expected: [[1, 10]] },
      ],
    },
  },
  {
    slug: "lru-cache",
    title: "Design an LRU Cache",
    category: "algorithms",
    difficulty: "medium",
    companies: ["amazon", "meta"],
    summary: "Hash map plus doubly linked list, all operations O(1).",
    prompt:
      "Design a data structure for a least-recently-used (LRU) cache with a fixed capacity. Implement get(key) and put(key, value), both in O(1) average time. When the cache is full, put evicts the least recently used entry.\n\nBe ready to discuss thread safety, and what changes for an LFU variant.",
    hints: [
      "You need O(1) lookup and O(1) reordering. Which two structures combine to give you both?",
      "A doubly linked list makes move-to-front and evict-from-back constant time; the map points at its nodes.",
    ],
    judge: {
      starterCode: `class LRUCache {
  /** @param {number} capacity */
  constructor(capacity) {
    this.capacity = capacity;
  }

  /** @returns {number} the value, or -1 if absent */
  get(key) {
    return -1;
  }

  put(key, value) {
    // Your code here
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let instance = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "LRUCache") {
      instance = new LRUCache(...args[i]);
      out.push(null);
    } else {
      out.push(instance[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Interleaved puts and gets (capacity 2)",
          input: [
            ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"],
            [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]],
          ],
          expected: [null, null, null, 1, null, -1, null, -1, 3, 4],
        },
        {
          name: "Capacity 1 evicts on every put",
          input: [
            ["LRUCache", "put", "put", "get", "put", "get", "get"],
            [[1], [2, 1], [3, 2], [2], [2, 6], [3], [2]],
          ],
          expected: [null, null, null, -1, null, -1, 6],
        },
        {
          name: "Updating a key must not evict",
          input: [
            ["LRUCache", "put", "put", "put", "get", "get"],
            [[2], [1, 1], [2, 2], [1, 9], [1], [2]],
          ],
          expected: [null, null, null, null, 9, 2],
        },
      ],
    },
  },
  {
    slug: "course-schedule",
    title: "Course Schedule",
    category: "algorithms",
    difficulty: "medium",
    companies: ["netflix", "stripe"],
    summary: "Cycle detection dressed up as a scheduling question.",
    prompt:
      "There are n courses labeled 0 to n-1, and a list of prerequisite pairs [a, b] meaning you must take course b before course a. Determine whether it is possible to finish all courses.\n\nFollow-up: when it is possible, return one valid ordering (topological sort).",
    hints: [
      "Model courses as a directed graph. Completion is impossible exactly when the graph has a cycle.",
      "Kahn's algorithm: repeatedly remove nodes with in-degree zero. If anything is left over, you found a cycle.",
    ],
    judge: {
      starterCode: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites - [a, b] means b must come before a
 * @returns {boolean} true if all courses can be finished
 */
function canFinish(numCourses, prerequisites) {
  // Your code here
  return true;
}
`,
      entry: "canFinish",
      tests: [
        { input: [2, [[1, 0]]], expected: true },
        { input: [2, [[1, 0], [0, 1]]], expected: false },
        { input: [5, [[1, 0], [2, 1], [3, 2], [4, 3]]], expected: true },
        { input: [3, []], expected: true },
        { name: "Self-loop is a cycle", input: [1, [[0, 0]]], expected: false },
      ],
    },
  },
  {
    slug: "max-width",
    title: "Max Width",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Greedy line packing and fiddly space math — full text justification.",
    prompt: `Given an array of words and a max_width parameter, write a function justify to format the text such that each line has exactly max_width characters. Pad extra spaces " " when necessary so that each line has exactly max_width characters.

Extra spaces between words should be distributed as evenly as possible. If the number of spaces on a line does not divide evenly between words, place excess spaces on the right-hand side of each line.

Note: you may assume that there is no word in words that is longer than max_width.

Example:

\`\`\`
words = ["This", "is", "an", "example", "of", "text", "justification."]
max_width = 16

justify(words, max_width)
=> [
  "This    is    an",
  "example  of text",
  "justification.  "
]
\`\`\``,
    hints: [
      "Greedy: keep adding words to the current line while they still fit with single spaces between them, then justify the finished line.",
      "For a line with g gaps and s spaces to place, every gap gets floor(s / g), and the leftmost s mod g gaps get one extra — that reproduces \"example  of text\" from the example.",
    ],
    judge: {
      starterCode: `/**
 * @param {string[]} words
 * @param {number} maxWidth
 * @returns {string[]} lines, each exactly maxWidth characters
 */
function justify(words, maxWidth) {
  // Your code here
  return [];
}
`,
      entry: "justify",
      tests: [
        {
          name: "Example from the prompt",
          input: [
            ["This", "is", "an", "example", "of", "text", "justification."],
            16,
          ],
          expected: ["This    is    an", "example  of text", "justification.  "],
        },
        {
          name: "Single short word",
          input: [["hello"], 10],
          expected: ["hello     "],
        },
        {
          input: [["ab", "cd", "ef"], 5],
          expected: ["ab cd", "ef   "],
        },
        {
          name: "Excess spaces go to the leftmost gaps",
          input: [["a", "b", "c", "d", "longword"], 9],
          expected: ["a  b  c d", "longword "],
        },
        {
          name: "Word exactly max_width wide",
          input: [
            ["This", "is", "an", "example", "of", "text", "justification."],
            14,
          ],
          expected: [
            "This   is   an",
            "example     of",
            "text          ",
            "justification.",
          ],
        },
      ],
    },
  },
  {
    slug: "round-numeric-strings",
    title: "Round Numeric String Values",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Arbitrary-precision rounding — floats need not apply.",
    prompt: `You are given numeric values as strings, for example "3.45", "-2.5", or "123456789123456789123456789.5". The values may be far too large for built-in integer or float types in most languages, and converting to float would lose precision — so treat this as pure string manipulation.

Round each value to the nearest integer, rounding half away from zero, and return the result as a string with no leading zeros and never "-0".

Example:

\`\`\`
"3.45"  -> "3"      "2.5"   -> "3"      "-2.5"  -> "-3"
"-0.4"  -> "0"      "9.99"  -> "10"     "999.5" -> "1000"
"123456789123456789123456789.5" -> "123456789123456789123456790"
\`\`\`

Part 2: given a comma-separated string of such values, return the comma-separated rounded values.`,
    hints: [
      "Only the first fractional digit matters for direction: with half-away-from-zero, the magnitude rounds up exactly when that digit is 5 or more.",
      "Split off the sign and round the magnitude, reattaching the sign only when the result is not 0. Rounding up is big-integer addition: walk the integer digits right to left carrying a 1, and prepend a digit if the carry survives (999 to 1000).",
    ],
    judge: {
      starterCode: `/**
 * Part 1: round one numeric string to the nearest integer, rounding
 * half away from zero. No leading zeros in the result, and never "-0".
 * Values can exceed any built-in numeric type — stay in string land.
 * @param {string} s - e.g. "3.45", "-2.5", "999.5"
 * @returns {string}
 */
function roundNumericString(s) {
  // Your code here
  return s;
}

/**
 * Part 2: round every value in a comma-separated list.
 * @param {string} csv - e.g. "2.5,-2.5,9.99"
 * @returns {string}
 */
function roundAll(csv) {
  // Your code here
  return csv;
}
`,
      entry: "__dispatch",
      driverCode: `function __dispatch(kind, value) {
  return kind === "csv" ? roundAll(value) : roundNumericString(value);
}`,
      tests: [
        { name: "Example: 3.45", input: ["single", "3.45"], expected: "3" },
        {
          name: "Tie rounds away from zero",
          input: ["single", "2.5"],
          expected: "3",
        },
        {
          name: "Negative tie",
          input: ["single", "-2.5"],
          expected: "-3",
        },
        { name: "Never -0", input: ["single", "-0.4"], expected: "0" },
        {
          name: "Carry ripples through 999",
          input: ["single", "999.5"],
          expected: "1000",
        },
        {
          name: "Bigger than any float",
          input: ["single", "123456789123456789123456789.5"],
          expected: "123456789123456789123456790",
        },
        { name: "No decimal point", input: ["single", "42"], expected: "42" },
        {
          name: "Strips leading zeros",
          input: ["single", "007.4"],
          expected: "7",
        },
        {
          name: "Part 2: comma-separated list",
          input: ["csv", "2.5,-2.5,9.99,-0.4"],
          expected: "3,-3,10,0",
        },
      ],
    },
  },
  {
    slug: "violation-log-analyzer",
    title: "Violation Log Analyzer",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Streaming design: recent counts, top-k, and sliding-window bans.",
    prompt: `Trust & Safety receives a stream of violation events, each (timestamp, user_id, violation_type), with timestamps arriving in non-decreasing order. Design and implement a class supporting:

\`\`\`
log.record(timestamp, user_id, violation_type)      # ingest one event
log.count_recent(user_id, window)   # violations by user within the last window
                                    # seconds, measured from the latest timestamp seen
log.top_k(k)                        # top-k users by all-time violation count,
                                    # ties broken lexicographically -> [(user, count), ...]
log.should_ban(user_id, max_violations, window)
                                    # True if the user ever had >= max_violations
                                    # within ANY window of window seconds
\`\`\`

Conventions for the judge: timestamps are integer seconds, and a window of W seconds ending at time T covers the half-open interval (T - W, T] — an event exactly W seconds old is outside it. count_recent measures from the latest timestamp seen so far; should_ban considers the user's entire history. So with window = 10, events at t = 0 and t = 9 fit in one window, while events at t = 0 and t = 10 do not.`,
    hints: [
      "Per-user append-only timestamp lists (time never decreases) plus a running all-time count per user are enough state for all three queries.",
      "For shouldBan, run two pointers over that user's timestamps: advance the left pointer while t[right] - t[left] >= window, and check whether the window ever holds maxViolations events.",
    ],
    judge: {
      starterCode: `class ViolationLog {
  constructor() {
    // Your state here
  }

  /**
   * @param {number} timestamp - non-decreasing across calls
   * @param {string} userId
   * @param {string} violationType
   */
  record(timestamp, userId, violationType) {
    // Your code here
  }

  /** @returns {number} violations by userId in (latest - window, latest] */
  countRecent(userId, window) {
    return 0;
  }

  /** @returns {[string, number][]} top-k by all-time count, ties lexicographic */
  topK(k) {
    return [];
  }

  /** @returns {boolean} true if userId ever had >= maxViolations in any window-second span */
  shouldBan(userId, maxViolations, window) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let log = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "ViolationLog") {
      log = new ViolationLog(...args[i]);
      out.push(null);
    } else {
      out.push(log[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "record and countRecent window boundary",
          input: [
            [
              "ViolationLog",
              "record",
              "record",
              "record",
              "countRecent",
              "countRecent",
              "countRecent",
              "countRecent",
            ],
            [
              [],
              [100, "alice", "spam"],
              [102, "bob", "scam"],
              [105, "alice", "spam"],
              ["alice", 5],
              ["alice", 6],
              ["bob", 2],
              ["carol", 100],
            ],
          ],
          expected: [null, null, null, null, 1, 2, 0, 0],
        },
        {
          name: "topK with lexicographic ties",
          input: [
            [
              "ViolationLog",
              "record",
              "record",
              "record",
              "record",
              "record",
              "record",
              "topK",
              "topK",
              "topK",
            ],
            [
              [],
              [1, "bob", "a"],
              [2, "alice", "b"],
              [3, "carol", "c"],
              [4, "bob", "d"],
              [5, "alice", "e"],
              [6, "dave", "f"],
              [2],
              [3],
              [10],
            ],
          ],
          expected: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            [["alice", 2], ["bob", 2]],
            [["alice", 2], ["bob", 2], ["carol", 1]],
            [["alice", 2], ["bob", 2], ["carol", 1], ["dave", 1]],
          ],
        },
        {
          name: "shouldBan scans the full history",
          input: [
            [
              "ViolationLog",
              "record",
              "record",
              "record",
              "record",
              "shouldBan",
              "shouldBan",
              "shouldBan",
              "shouldBan",
              "shouldBan",
            ],
            [
              [],
              [0, "eve", "x"],
              [9, "eve", "x"],
              [50, "eve", "x"],
              [100, "mallory", "x"],
              ["eve", 2, 10],
              ["eve", 3, 10],
              ["eve", 2, 9],
              ["mallory", 1, 5],
              ["nobody", 1, 100],
            ],
          ],
          expected: [
            null,
            null,
            null,
            null,
            null,
            true,
            false,
            false,
            true,
            false,
          ],
        },
        {
          name: "span exactly equal to window stays outside",
          input: [
            [
              "ViolationLog",
              "record",
              "record",
              "record",
              "shouldBan",
              "shouldBan",
              "countRecent",
              "countRecent",
            ],
            [
              [],
              [10, "u", "a"],
              [19, "u", "a"],
              [21, "u", "a"],
              ["u", 3, 12],
              ["u", 3, 11],
              ["u", 2],
              ["u", 3],
            ],
          ],
          expected: [null, null, null, null, true, false, 1, 2],
        },
      ],
    },
  },
  {
    slug: "nested-set-equality",
    title: "Nested Set Equality",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Order and duplicates vanish at every depth — canonicalize.",
    prompt: `A "nested set" is a collection that can contain integers and/or other nested sets, with no meaningful order and no meaningful duplicates — exactly like a mathematical set. Because sets cannot contain sets in most languages, the input is given as nested lists.

Write a function that determines whether two nested sets are equal.

Examples:

\`\`\`
[1, [2, 3]]      vs  [[3, 2], 1]        -> true   (order ignored at every depth)
[1, 1, 2]        vs  [2, 1]             -> true   (duplicates collapse)
[1, [2]]         vs  [1, 2]             -> false  ({2} is not the same as 2)
[[]]             vs  []                 -> false  (a set containing the empty set is not empty)
[[1, 2], [2, 3]] vs  [[2, 3], [1, 2]]   -> true
\`\`\``,
    hints: [
      "Recursively canonicalize each structure bottom-up into a comparable form — one that erases order and duplicates at every depth, then compare the canonical forms.",
      "In JavaScript: map children to canonical strings, collapse duplicates with a Set, sort, and wrap in braces. An integer and a one-element set containing it must stay distinct.",
    ],
    judge: {
      starterCode: `/**
 * Nested sets are given as (possibly nested) arrays of integers.
 * @param {(number | Array)[]} a
 * @param {(number | Array)[]} b
 * @returns {boolean} true when a and b are equal as sets, at every depth
 */
function nestedSetEqual(a, b) {
  // Your code here
  return false;
}
`,
      entry: "nestedSetEqual",
      tests: [
        {
          name: "Order ignored at every depth",
          input: [[1, [2, 3]], [[3, 2], 1]],
          expected: true,
        },
        {
          name: "Duplicates collapse",
          input: [[1, 1, 2], [2, 1]],
          expected: true,
        },
        {
          name: "A set is not its element",
          input: [[1, [2]], [1, 2]],
          expected: false,
        },
        {
          name: "Set containing empty set is not empty",
          input: [[[]], []],
          expected: false,
        },
        {
          name: "Sets of sets",
          input: [[[1, 2], [2, 3]], [[2, 3], [1, 2]]],
          expected: true,
        },
        { name: "Both empty", input: [[], []], expected: true },
        {
          name: "Int and set of it coexist",
          input: [[1, [1]], [[1], 1]],
          expected: true,
        },
        { name: "Deep nesting", input: [[[[1]]], [[[1]]]], expected: true },
      ],
    },
  },
  {
    slug: "assign-pins-shortest-columns",
    title: "Assign Pins to Shortest Columns",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "The masonry-layout greedy: shortest column wins, leftmost on ties.",
    prompt: `Pinterest's home feed lays pins out in k vertical columns. Pins arrive one at a time in feed order; each pin i has height heights[i]. Each arriving pin is placed at the bottom of the column whose current total height is smallest; ties go to the leftmost such column.

Return the column index assigned to each pin.

Example:

\`\`\`
heights = [5, 3, 4, 2], k = 2
pin0 -> col0 (both 0, leftmost)     cols: [5, 0]
pin1 -> col1 (0 < 5)                cols: [5, 3]
pin2 -> col1 (3 < 5)                cols: [5, 7]
pin3 -> col0 (5 < 7)                cols: [7, 7]
answer: [0, 1, 1, 0]
\`\`\``,
    hints: [
      "Track each column's running height; every pin goes to the current minimum. A scan per pin is O(n·k); a min-heap of (height, columnIndex) makes it O(n log k).",
      "Ordering pairs by height first and column index second makes the leftmost-on-tie rule fall out of the comparison for free.",
    ],
    judge: {
      starterCode: `/**
 * @param {number[]} heights - pin heights, in feed order
 * @param {number} k - number of columns
 * @returns {number[]} the column index assigned to each pin, in order
 */
function assignPins(heights, k) {
  // Your code here
  return [];
}
`,
      entry: "assignPins",
      tests: [
        {
          name: "Worked example",
          input: [[5, 3, 4, 2], 2],
          expected: [0, 1, 1, 0],
        },
        {
          name: "All-equal heights tie-break",
          input: [[1, 1, 1], 3],
          expected: [0, 1, 2],
        },
        {
          name: "Ties alternate correctly",
          input: [[2, 2, 2, 2, 2], 2],
          expected: [0, 1, 0, 1, 0],
        },
        { name: "Single column", input: [[4, 2, 7], 1], expected: [0, 0, 0] },
        { name: "One pin, many columns", input: [[10], 4], expected: [0] },
        { name: "No pins", input: [[], 3], expected: [] },
      ],
    },
  },
  {
    slug: "collect-reachable-pins",
    title: "Collect Pins from Reachable Boards",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "BFS over the bipartite pin-board graph without building board-to-board edges.",
    prompt: `On Pinterest, a board contains pins, and the same pin can be saved to many boards. From any board you can "hop" to any other board that shares at least one pin with it.

Given a mapping boards (board id to the pin ids on that board) and a starting board, return all pins reachable from the start — i.e., every pin on every board in the start board's connected component.

Example:

\`\`\`
boards = {
  "B1": ["p1", "p2"],
  "B2": ["p2", "p3"],     // reachable from B1 via shared p2
  "B3": ["p4"],           // not reachable
  "B4": ["p3", "p5"],     // reachable from B2 via shared p3
  "B5": [],
}
collectReachablePins(boards, "B1")  ->  ["p1", "p2", "p3", "p5"]
\`\`\`

For the judge, return the reachable pins as a sorted array. A missing start board returns an empty array.`,
    hints: [
      "Do not build board-to-board edges — every pair of boards sharing a pin would get one, which blows up on popular pins. Traverse board -> its pins -> their boards instead, using an inverted pin-to-boards index.",
      "Mark both pins and boards as visited. The visited-pin set is what keeps one pin saved to thousands of boards from being re-expanded each time.",
    ],
    judge: {
      starterCode: `/**
 * @param {Record<string, string[]>} boards - board id -> pin ids on that board
 * @param {string} start - starting board id
 * @returns {string[]} every reachable pin id, sorted; [] if start is unknown
 */
function collectReachablePins(boards, start) {
  // Your code here
  return [];
}
`,
      entry: "collectReachablePins",
      tests: [
        {
          name: "Multi-hop through shared pins",
          input: [
            { B1: ["p1", "p2"], B2: ["p2", "p3"], B3: ["p4"], B4: ["p3", "p5"], B5: [] },
            "B1",
          ],
          expected: ["p1", "p2", "p3", "p5"],
        },
        {
          name: "Disconnected board",
          input: [
            { B1: ["p1", "p2"], B2: ["p2", "p3"], B3: ["p4"], B4: ["p3", "p5"], B5: [] },
            "B3",
          ],
          expected: ["p4"],
        },
        {
          name: "Empty board",
          input: [
            { B1: ["p1", "p2"], B2: ["p2", "p3"], B3: ["p4"], B4: ["p3", "p5"], B5: [] },
            "B5",
          ],
          expected: [],
        },
        {
          name: "Missing start board",
          input: [{ B1: ["p1"] }, "B9"],
          expected: [],
        },
        {
          name: "Cycle does not loop forever",
          input: [{ X: ["a", "b"], Y: ["b", "a"] }, "X"],
          expected: ["a", "b"],
        },
        {
          name: "Popular pin connects many boards",
          input: [{ A: ["hub"], B: ["hub", "x"], C: ["hub", "y"] }, "A"],
          expected: ["hub", "x", "y"],
        },
      ],
    },
  },
  {
    slug: "stream-line-reader",
    title: "Stream Line Reader",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Reassemble lines from arbitrary chunks, then settle the balances they carry.",
    prompt: `You are given an API you cannot modify:

\`\`\`
readChunk() -> string    // next chunk of a log stream; "" means end of stream
\`\`\`

Chunks split arbitrarily: one chunk may contain several lines, and one line may span several chunks. Implement a LineReader class whose readLine() returns the next complete line WITHOUT the newline; the final line may lack a trailing newline; return null once the stream is exhausted. Call readChunk lazily — only when you do not already have a complete line buffered.

Example:

\`\`\`
chunks: ["ab", "c\\nde", "f\\n"]      ->  readLine(): "abc", then "def", then null
chunks: ["a\\n\\nb"]                  ->  "a", "" (empty line preserved), "b"
\`\`\`

Part 2 (as actually reported): each line of the stream is payer,payee,amount. Implement settleFromStream(readChunk): parse the stream with your LineReader, compute each person's net balance, and return the minimum number of transactions needed to settle everyone.`,
    hints: [
      "Keep two pieces of state: a queue of complete lines ready to serve, and the fragments of the current unterminated line. chunk.split(\"\\n\") tells you everything — every piece except the last completes a line, and the last piece is the new partial. Join fragments only when a line completes, and flush the partial at EOF.",
      "For Part 2, compute net balances first — people who net to zero drop out entirely. Settling the remaining nonzero balances in the fewest transactions is a backtracking search: match each nonzero against later opposite-sign balances (exponential, but fine because few distinct nonzero balances remain).",
    ],
    judge: {
      starterCode: `class LineReader {
  /** @param {() => string} readChunk - returns "" once the stream ends */
  constructor(readChunk) {
    // Your state here
  }

  /** @returns {string | null} next line without the newline; null at end */
  readLine() {
    return null;
  }
}

/**
 * Part 2: lines are "payer,payee,amount" (amount is an integer).
 * @param {() => string} readChunk
 * @returns {number} minimum number of transactions to settle all balances
 */
function settleFromStream(readChunk) {
  // Your code here (use your LineReader)
  return 0;
}
`,
      entry: "__dispatch",
      driverCode: `function __dispatch(kind, chunks, cap) {
  let i = 0;
  const readChunk = () => (i < chunks.length ? chunks[i++] : "");
  if (kind === "settle") return settleFromStream(readChunk);
  const reader = new LineReader(readChunk);
  const out = [];
  for (let n = 0; n < cap; n++) {
    const line = reader.readLine();
    out.push(line);
    if (line === null) break;
  }
  return out;
}`,
      tests: [
        {
          name: "Lines split across chunks",
          input: ["lines", ["ab", "c\nde", "f\n"], 10],
          expected: ["abc", "def", null],
        },
        {
          name: "Empty lines are preserved",
          input: ["lines", ["a\n\nb"], 10],
          expected: ["a", "", "b", null],
        },
        {
          name: "One line spanning four chunks",
          input: ["lines", ["a", "b", "c", "\n", "d"], 10],
          expected: ["abc", "d", null],
        },
        {
          name: "Chunk that is exactly a newline",
          input: ["lines", ["\n"], 10],
          expected: ["", null],
        },
        { name: "Empty stream", input: ["lines", [], 5], expected: [null] },
        {
          name: "Settle: middleman nets to zero",
          input: ["settle", ["a,b,5\na,c", ",5\nb,c,5"], 0],
          expected: 1,
        },
        {
          name: "Settle: everyone already even",
          input: ["settle", ["a,b,1\nb,c,1\nc,a,1\n"], 0],
          expected: 0,
        },
        {
          name: "Settle: two independent debts",
          input: ["settle", ["a,b,1\nc,d,1"], 0],
          expected: 2,
        },
      ],
    },
  },
  {
    slug: "escape-room-leaderboard",
    title: "Escape-Room Leaderboard",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Best-time standings with live ranks — the data-structure trade-off talk.",
    prompt: `Teams attempt an escape room repeatedly. Each attempt reports (team, timeSeconds); a team's standing is its best (lowest) time. Implement:

\`\`\`
lb.addResult(team, time)   // record an attempt (keep the team's best)
lb.rank(team)              // 1-indexed rank by best time; ties broken
                           // alphabetically; -1 if the team never played
lb.topK(k)                 // the k best team names, in rank order
\`\`\``,
    hints: [
      "Keep a map of each team's best time; an attempt only matters when it beats the stored best. Rank and topK both read from the standings ordered by (bestTime, team).",
      "Ordering by the (time, team) pair gives the alphabetical tie-break for free. Re-sorting on every query is acceptable here — name the O(log n) order-statistic upgrade rather than hand-waving it.",
    ],
    judge: {
      starterCode: `class Leaderboard {
  constructor() {
    // Your state here
  }

  /** Record an attempt; only improvements change the standings. */
  addResult(team, time) {
    // Your code here
  }

  /** @returns {number} 1-indexed rank by best time (ties alphabetical), or -1 */
  rank(team) {
    return -1;
  }

  /** @returns {string[]} the k best team names, in rank order */
  topK(k) {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let lb = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "Leaderboard") {
      lb = new Leaderboard(...args[i]);
      out.push(null);
    } else {
      out.push(lb[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Ties break alphabetically",
          input: [
            ["Leaderboard", "addResult", "addResult", "addResult", "rank", "rank", "rank", "topK"],
            [[], ["alpha", 300], ["beta", 300], ["gamma", 250], ["alpha"], ["beta"], ["gamma"], [2]],
          ],
          expected: [null, null, null, null, 2, 3, 1, ["gamma", "alpha"]],
        },
        {
          name: "Improvements move ranks, regressions are ignored",
          input: [
            ["Leaderboard", "addResult", "addResult", "rank", "addResult", "rank", "addResult", "rank", "topK"],
            [[], ["x", 100], ["y", 90], ["x"], ["x", 80], ["x"], ["x", 999], ["x"], [5]],
          ],
          expected: [null, null, null, 2, null, 1, null, 1, ["x", "y"]],
        },
        {
          name: "Unknown team and empty board",
          input: [
            ["Leaderboard", "rank", "topK"],
            [[], ["ghost"], [3]],
          ],
          expected: [null, -1, []],
        },
      ],
    },
  },
  {
    slug: "rebalance-experiment-buckets",
    title: "Rebalance Experiment Buckets with Minimal Reassignment",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Meet new group sizes while disrupting as few buckets as possible.",
    prompt: `Pinterest's experiment framework hashes every user into one of n buckets, 0..n-1. Each bucket is assigned to at most one experiment group; unassigned buckets are null. You are given the current assignment and new target sizes:

\`\`\`
current = ["A", "A", "A", "B", null, null]      // per-bucket group
targets = { "A": 1, "B": 3 }                    // desired bucket count per group
\`\`\`

Produce a new assignment meeting the targets exactly while changing as few buckets as possible — every changed bucket disrupts the experiment for the users hashed into it. Groups present in current but absent from targets lose all their buckets; a bucket going from a group to null counts as a change. You may assume the targets fit: the target counts sum to at most n.

The judge accepts any assignment that meets the targets exactly with the minimum possible number of changed buckets.`,
    hints: [
      "A group can keep at most min(currentCount, target) of its buckets, so keep each group's buckets up to its target in a first pass; every other assigned bucket is surplus and must change no matter what.",
      "Fill deficits from surplus buckets before touching never-assigned ones: a surplus bucket's change is already paid for, while an untouched null bucket only costs a change if you use it.",
    ],
    judge: {
      starterCode: `/**
 * @param {(string | null)[]} current - per-bucket group, null = unassigned
 * @param {Record<string, number>} targets - desired bucket count per group
 * @returns {(string | null)[]} new assignment meeting targets exactly,
 *   changing as few buckets as possible
 */
function rebalanceBuckets(current, targets) {
  // Your code here
  return current;
}
`,
      entry: "__judgeRebalance",
      driverCode: `function __judgeRebalance(current, targets) {
  const result = rebalanceBuckets(current.slice(), { ...targets });
  if (!Array.isArray(result) || result.length !== current.length) {
    return { validShape: false };
  }
  const counts = {};
  for (const g of result) {
    if (g !== null) counts[g] = (counts[g] ?? 0) + 1;
  }
  const targetsMet =
    Object.keys(targets).every((g) => (counts[g] ?? 0) === targets[g]) &&
    Object.keys(counts).every((g) => g in targets);
  let changes = 0;
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== result[i]) changes++;
  }
  return { targetsMet, changes };
}`,
      tests: [
        {
          name: "Shrink A, grow B — two changes suffice",
          input: [["A", "A", "A", "B", null, null], { A: 1, B: 3 }],
          expected: { targetsMet: true, changes: 2 },
        },
        {
          name: "Group disappears entirely",
          input: [["A", "A", "B"], { B: 2 }],
          expected: { targetsMet: true, changes: 2 },
        },
        {
          name: "Already balanced is a no-op",
          input: [["A", null, "B"], { A: 1, B: 1 }],
          expected: { targetsMet: true, changes: 0 },
        },
        {
          name: "Growing into unassigned buckets",
          input: [[null, null, "A"], { A: 2 }],
          expected: { targetsMet: true, changes: 1 },
        },
        {
          name: "Shrinking frees a bucket to null",
          input: [["A", "A"], { A: 1 }],
          expected: { targetsMet: true, changes: 1 },
        },
      ],
    },
  },
  {
    slug: "list-unallocated-buckets",
    title: "List Unallocated Experiment Buckets",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Interval sweep for the free ranges — independent of bucket-space size.",
    prompt: `Same bucket space [0, n). Existing experiments hold ranges of buckets, given as inclusive [start, end] pairs — possibly overlapping, possibly out of bounds (clamp them), and in no particular order. Return the unallocated buckets as a minimal sorted list of inclusive [start, end] ranges (adjacent free buckets merge into one range).

\`\`\`
unallocatedRanges(10, [[2, 4], [6, 6]])  ->  [[0, 1], [5, 5], [7, 9]]
\`\`\``,
    hints: [
      "Sort ranges by start and sweep once with a cursor holding the smallest bucket not yet proven allocated: any gap before a range's start is free.",
      "Advance the cursor with max(cursor, end + 1) — the max is what absorbs overlapping and fully-contained ranges. Emit the tail after the last range, and note why the sweep beats a boolean array when n is huge.",
    ],
    judge: {
      starterCode: `/**
 * @param {number} n - bucket space is [0, n)
 * @param {[number, number][]} allocated - inclusive ranges, any order,
 *   possibly overlapping or partly out of bounds (clamp)
 * @returns {[number, number][]} minimal sorted list of free inclusive ranges
 */
function unallocatedRanges(n, allocated) {
  // Your code here
  return [];
}
`,
      entry: "unallocatedRanges",
      tests: [
        {
          name: "Worked example",
          input: [10, [[2, 4], [6, 6]]],
          expected: [[0, 1], [5, 5], [7, 9]],
        },
        { name: "Nothing allocated", input: [5, []], expected: [[0, 4]] },
        { name: "Fully allocated", input: [4, [[0, 3]]], expected: [] },
        {
          name: "Overlapping ranges",
          input: [10, [[0, 3], [2, 5]]],
          expected: [[6, 9]],
        },
        {
          name: "Adjacent ranges leave no phantom gap",
          input: [6, [[0, 1], [2, 3]]],
          expected: [[4, 5]],
        },
        {
          name: "Unsorted input",
          input: [8, [[5, 7], [0, 2]]],
          expected: [[3, 4]],
        },
        {
          name: "Out-of-bounds ranges are clamped",
          input: [5, [[-3, 1], [6, 9]]],
          expected: [[2, 4]],
        },
      ],
    },
  },
  {
    slug: "adjustable-id-allocator",
    title: "Design Adjustable ID Allocator",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Smallest-free allocation under a capacity that moves at runtime.",
    prompt: `Design an ID allocator over the space [0, capacity):

\`\`\`
a = new IDAllocator(1000)
a.allocate()        // -> smallest available ID, or -1 if none
a.release(id)       // -> true if id was allocated; false otherwise
                    //    (double-release, never-allocated)
a.setCapacity(c)    // capacity is ADJUSTABLE at runtime, up or down
\`\`\`

Shrinking must not invalidate IDs already handed out — an ID beyond the new capacity stays valid until released; it just cannot be re-allocated while capacity is below it. If capacity grows back, previously released high IDs become allocatable again.`,
    hints: [
      "Keep a pool of released IDs, a watermark for the smallest never-handed-out ID, and a set of currently allocated IDs for release validation. The smallest free ID is the best released one under capacity, else the watermark.",
      "Make setCapacity lazy — just store the number. Released IDs at or above capacity stay in the pool, dormant until capacity grows back over them; a min-ordering guarantees they never block smaller IDs.",
    ],
    judge: {
      starterCode: `class IDAllocator {
  /** @param {number} capacity - IDs live in [0, capacity) */
  constructor(capacity) {
    // Your state here
  }

  /** @returns {number} smallest available ID, or -1 if none */
  allocate() {
    return -1;
  }

  /** @returns {boolean} true only if id was currently allocated */
  release(id) {
    return false;
  }

  /** Adjust capacity up or down; already-issued IDs stay valid. */
  setCapacity(c) {
    // Your code here
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let a = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "IDAllocator") {
      a = new IDAllocator(...args[i]);
      out.push(null);
    } else {
      out.push(a[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Exhaustion, reuse, and release validation",
          input: [
            ["IDAllocator", "allocate", "allocate", "allocate", "allocate", "release", "allocate", "release", "release", "release"],
            [[3], [], [], [], [], [1], [], [1], [1], [99]],
          ],
          expected: [null, 0, 1, 2, -1, true, 1, true, false, false],
        },
        {
          name: "The shrink dance",
          input: [
            ["IDAllocator", "allocate", "allocate", "allocate", "setCapacity", "release", "allocate", "release", "allocate", "setCapacity", "allocate", "allocate"],
            [[3], [], [], [], [1], [2], [], [0], [], [5], [], []],
          ],
          expected: [null, 0, 1, 2, null, true, -1, true, 0, null, 2, 3],
        },
        {
          name: "Released IDs come back smallest-first",
          input: [
            ["IDAllocator", "allocate", "allocate", "allocate", "allocate", "release", "release", "allocate", "allocate", "allocate"],
            [[10], [], [], [], [], [1], [3], [], [], []],
          ],
          expected: [null, 0, 1, 2, 3, true, true, 1, 3, 4],
        },
      ],
    },
  },
  {
    slug: "flag-spam-numbers",
    title: "Cross-Reference Logs to Flag Spam Numbers",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "A hash join across two logs — and saying that word out loud.",
    prompt: `You are given two logs:

\`\`\`
callLog = [[caller, callee], ...]        // phone calls made
reports  = [[reporter, number], ...]     // users reporting a number as spam
\`\`\`

A report is valid only if the reporter actually received a call from the number they reported (cross-referencing — this filters fake or mistaken reports). Flag every number with at least minReports distinct valid reporters. Return the flagged numbers sorted.`,
    hints: [
      "This is a hash join: build number -> set of people it called from the call log, then stream the reports and keep only those where the reporter appears in that set.",
      "Count distinct valid reporters per number (a set per number — the same user reporting twice counts once), then threshold and sort.",
    ],
    judge: {
      starterCode: `/**
 * @param {[string, string][]} callLog - [caller, callee] pairs
 * @param {[string, string][]} reports - [reporter, number] pairs
 * @param {number} minReports - distinct valid reporters needed to flag
 * @returns {string[]} flagged numbers, sorted
 */
function flagSpamNumbers(callLog, reports, minReports) {
  // Your code here
  return [];
}
`,
      entry: "flagSpamNumbers",
      tests: [
        {
          name: "Two valid reporters flag the number",
          input: [
            [["555", "alice"], ["555", "bob"], ["555", "carol"], ["777", "alice"], ["888", "dave"]],
            [["alice", "555"], ["bob", "555"]],
            2,
          ],
          expected: ["555"],
        },
        {
          name: "Duplicate reports from one user count once",
          input: [
            [["555", "alice"], ["555", "bob"]],
            [["alice", "555"], ["alice", "555"], ["bob", "555"]],
            3,
          ],
          expected: [],
        },
        {
          name: "Report without a matching call is dropped",
          input: [
            [["555", "alice"], ["888", "dave"]],
            [["dave", "555"]],
            1,
          ],
          expected: [],
        },
        {
          name: "Threshold exactly met",
          input: [
            [["555", "alice"], ["555", "bob"], ["555", "carol"]],
            [["alice", "555"], ["bob", "555"], ["carol", "555"]],
            3,
          ],
          expected: ["555"],
        },
        {
          name: "Multiple flagged numbers come back sorted",
          input: [
            [["555", "alice"], ["555", "bob"], ["777", "alice"]],
            [["alice", "777"], ["alice", "555"], ["bob", "555"]],
            1,
          ],
          expected: ["555", "777"],
        },
        {
          name: "Empty call log invalidates everything",
          input: [[], [["a", "b"]], 1],
          expected: [],
        },
      ],
    },
  },
  {
    slug: "sparse-matrix-operations",
    title: "Sparse Matrix Storage, Addition, and Multiplication",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Storage proportional to nonzeros — and the cancellation trap.",
    prompt: `Matrices in Pinterest's recommender pipelines are enormous but almost entirely zeros. Design a SparseMatrix class whose storage is proportional to the number of nonzero entries, supporting:

\`\`\`
SparseMatrix.fromDense(rows)     // build from a dense array of arrays
m.get(r, c) / m.set(r, c, v)
a.add(b)                         // -> new SparseMatrix
a.multiply(b)                    // -> new SparseMatrix
m.toDense()
m.nnz()                          // number of stored nonzero entries
\`\`\`

Addition and multiplication must exploit sparsity — never iterate the full dense dimensions. Entries that become zero (including by cancellation in add) must be removed from storage: nnz() is how the judge checks you. Dimension mismatches in add or multiply must throw.`,
    hints: [
      "A dict-of-rows representation (row -> { col: value }) gives O(1) get/set and natural sparse iteration; never store zeros — set(r, c, 0) deletes.",
      "For multiply, iterate only A's nonzeros (r, k, va), and for each one only B's row-k nonzeros — cost proportional to matching nonzeros, not dimensions. In add, route every write through set so cancellations delete their entries.",
    ],
    judge: {
      starterCode: `class SparseMatrix {
  constructor(nRows, nCols) {
    this.nRows = nRows;
    this.nCols = nCols;
    // Your storage here
  }

  /** @param {number[][]} dense */
  static fromDense(dense) {
    // Your code here
    return new SparseMatrix(dense.length, dense[0]?.length ?? 0);
  }

  get(r, c) {
    return 0;
  }

  /** Storing 0 must remove the entry. */
  set(r, c, v) {
    // Your code here
  }

  /** @returns {SparseMatrix} throws on dimension mismatch */
  add(other) {
    // Your code here
    return this;
  }

  /** @returns {SparseMatrix} throws on dimension mismatch */
  multiply(other) {
    // Your code here
    return this;
  }

  /** @returns {number[][]} */
  toDense() {
    return [];
  }

  /** @returns {number} count of stored nonzero entries */
  nnz() {
    return 0;
  }
}
`,
      entry: "__judgeSparse",
      driverCode: `function __judgeSparse(op, denseA, denseB, extra) {
  const a = SparseMatrix.fromDense(denseA);
  if (op === "get") return a.get(...extra);
  if (op === "set") {
    a.set(...extra);
    return { dense: a.toDense(), nnz: a.nnz() };
  }
  const b = SparseMatrix.fromDense(denseB);
  let out;
  try {
    out = op === "add" ? a.add(b) : a.multiply(b);
  } catch {
    return "error";
  }
  return { dense: out.toDense(), nnz: out.nnz() };
}`,
      tests: [
        {
          name: "Sparse multiply",
          input: [
            "multiply",
            [[1, 0, 0], [-1, 0, 3]],
            [[7, 0, 0], [0, 0, 0], [0, 0, 1]],
            [],
          ],
          expected: { dense: [[7, 0, 0], [-7, 0, 3]], nnz: 3 },
        },
        {
          name: "Addition that cancels everything stores nothing",
          input: ["add", [[2, 0], [0, 5]], [[-2, 0], [0, -5]], []],
          expected: { dense: [[0, 0], [0, 0]], nnz: 0 },
        },
        {
          name: "Plain addition",
          input: ["add", [[1, 2], [0, 0]], [[0, 3], [4, 0]], []],
          expected: { dense: [[1, 5], [4, 0]], nnz: 3 },
        },
        {
          name: "Multiply dimension mismatch throws",
          input: ["multiply", [[1, 0], [0, 1]], [[1], [2], [3]], []],
          expected: "error",
        },
        {
          name: "Setting zero removes the entry",
          input: ["set", [[0, 7], [0, 0]], null, [0, 1, 0]],
          expected: { dense: [[0, 0], [0, 0]], nnz: 0 },
        },
        {
          name: "get reads stored and absent cells",
          input: ["get", [[0, 0], [0, 9]], null, [1, 1]],
          expected: 9,
        },
        {
          name: "Multiply against empty matching rows",
          input: ["multiply", [[0, 5], [0, 0]], [[3, 3], [0, 0]], []],
          expected: { dense: [[0, 0], [0, 0]], nnz: 0 },
        },
      ],
    },
  },
  {
    slug: "nearest-eligible-elevator",
    title: "Select the Nearest Eligible Elevator",
    category: "algorithms",
    difficulty: "easy",
    companies: ["pinterest"],
    summary: "A requirements-gathering problem wearing a simulation costume.",
    prompt: `A building has elevators, each described by:

\`\`\`
{ "id": 1, "floor": 4, "direction": "up" | "down" | "idle", "serviced": [1, 3, 5] }
\`\`\`

(serviced = floors this elevator stops at — service and freight elevators skip floors.)

A hail arrives: (floor, direction). An elevator is eligible if it services that floor AND is either idle, or already moving in the hailed direction toward the floor (an "up" elevator at or below the hail floor; a "down" elevator at or above it). Among eligible elevators return the id of the nearest (minimum |currentFloor - hailFloor|); break ties by lowest id. Return -1 if none.`,
    hints: [
      "Write the eligibility predicate as its own small check with early rejections — services the floor, then direction: idle always matches; a moving elevator must match the hailed direction and be on the correct side (at the hail floor counts as toward).",
      "One linear scan keeping the best (distance, id) pair is optimal — every elevator must be examined once. The pair comparison gives the lowest-id tie-break for free.",
    ],
    judge: {
      starterCode: `/**
 * @param {{id: number, floor: number, direction: "up" | "down" | "idle",
 *          serviced: number[]}[]} elevators
 * @param {number} floor - hail floor
 * @param {"up" | "down"} direction - hailed direction
 * @returns {number} nearest eligible elevator id (ties -> lowest id), or -1
 */
function selectElevator(elevators, floor, direction) {
  // Your code here
  return -1;
}
`,
      entry: "selectElevator",
      tests: [
        {
          name: "Wrong-side mover is ineligible",
          input: [
            [
              { id: 3, floor: 4, direction: "down", serviced: [5] },
              { id: 1, floor: 6, direction: "down", serviced: [5] },
            ],
            5,
            "down",
          ],
          expected: 1,
        },
        {
          name: "Idle matches either direction",
          input: [
            [{ id: 7, floor: 10, direction: "idle", serviced: [3] }],
            3,
            "up",
          ],
          expected: 7,
        },
        {
          name: "Nearest wins regardless of idle vs moving",
          input: [
            [
              { id: 1, floor: 6, direction: "idle", serviced: [5] },
              { id: 2, floor: 1, direction: "up", serviced: [5] },
            ],
            5,
            "up",
          ],
          expected: 1,
        },
        {
          name: "Nobody services the floor",
          input: [
            [{ id: 1, floor: 5, direction: "idle", serviced: [1, 2] }],
            3,
            "up",
          ],
          expected: -1,
        },
        {
          name: "Exact tie goes to the lowest id",
          input: [
            [
              { id: 9, floor: 4, direction: "idle", serviced: [5] },
              { id: 2, floor: 6, direction: "idle", serviced: [5] },
            ],
            5,
            "up",
          ],
          expected: 2,
        },
        {
          name: "At the hail floor moving the right way",
          input: [
            [{ id: 4, floor: 5, direction: "up", serviced: [5] }],
            5,
            "up",
          ],
          expected: 4,
        },
        {
          name: "Moving away is ineligible",
          input: [
            [{ id: 1, floor: 2, direction: "up", serviced: [5] }],
            5,
            "down",
          ],
          expected: -1,
        },
        { name: "No elevators", input: [[], 3, "up"], expected: -1 },
      ],
    },
  },
  {
    slug: "subsequence-expression-target",
    title: "Decide Target via Subsequence Plus/Multiply Expression",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Expression search with precedence — the (total, pending product) trick.",
    prompt: `Given an array of positive integers nums and a target T: can you choose a subsequence (keep relative order, at least one element) and insert + or * between consecutive chosen elements — standard precedence, * binds first — so the expression equals T?

\`\`\`
canReachTarget([2, 3, 5], 11)  ->  true    // 2*3 + 5
canReachTarget([2, 3, 5], 17)  ->  true    // 2 + 3*5
canReachTarget([2, 3, 5], 13)  ->  false   // no subsequence works
\`\`\``,
    hints: [
      "Handle precedence with the (total, last) state from Expression Add Operators: the true value is total + last, where last is the pending product. Adding v commits the product (total += last, last = v); multiplying extends it (last *= v).",
      "Layer subsequence choice on top: at each index either skip, start here if nothing is chosen yet, or extend with + or *. Memoize visited (index, total, last, started) states — the search is exponential in the worst case, and saying so is expected.",
    ],
    judge: {
      starterCode: `/**
 * @param {number[]} nums - positive integers
 * @param {number} target
 * @returns {boolean} true if some subsequence with + and * (standard
 *   precedence) evaluates exactly to target
 */
function canReachTarget(nums, target) {
  // Your code here
  return false;
}
`,
      entry: "canReachTarget",
      tests: [
        { name: "2*3 + 5", input: [[2, 3, 5], 11], expected: true },
        { name: "2 + 3*5", input: [[2, 3, 5], 17], expected: true },
        { name: "Unreachable", input: [[2, 3, 5], 13], expected: false },
        { name: "Single element hits", input: [[5], 5], expected: true },
        { name: "Single element misses", input: [[5], 6], expected: false },
        { name: "Pure addition", input: [[1, 1, 1], 3], expected: true },
        {
          name: "Needs a skip in the middle",
          input: [[2, 9, 3, 5], 17],
          expected: true,
        },
        { name: "Empty array", input: [[], 7], expected: false },
      ],
    },
  },
  {
    slug: "cleaning-robot-coverage",
    title: "Compute Reachable Cells for a Cleaning Robot",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Slide-until-blocked physics: rest positions are the states, not cells.",
    prompt: `A cleaning robot sits in a grid ('.' open, '#' obstacle). When it moves, it picks a direction (up/down/left/right) and slides until it hits a wall or obstacle — it cannot stop mid-slide. It cleans every cell it passes through.

Return [number of cells the robot can clean, number of cells where it can come to rest]. The start cell counts as both cleaned and a rest cell.

\`\`\`
. # .        start (0,0): right is blocked; down, then right, then up...
. . .        cleans 5 cells (all but the '#'), can rest at 4
\`\`\``,
    hints: [
      "With sliding movement the search states are rest positions, not cells — a cell you fly through is cleaned but is not a place you can branch from. BFS over rest positions; each expansion simulates the four slides.",
      "During each slide, add every cell passed through to a cleaned set; enqueue only the slide's endpoint (if new). Plain flood fill is the classic wrong answer here — it ignores the physics.",
    ],
    judge: {
      starterCode: `/**
 * @param {string[]} grid - rows of '.' (open) and '#' (obstacle)
 * @param {[number, number]} start - [row, col], guaranteed open
 * @returns {[number, number]} [cleanableCells, restCells]
 */
function robotCoverage(grid, start) {
  // Your code here
  return [0, 0];
}
`,
      entry: "robotCoverage",
      tests: [
        {
          name: "Worked 2x3 example",
          input: [[".#.", "..."], [0, 0]],
          expected: [5, 4],
        },
        {
          name: "Corridor rests only at the ends",
          input: [["....."], [0, 0]],
          expected: [5, 2],
        },
        {
          name: "Open square: the center is unreachable rest",
          input: [["...", "...", "..."], [0, 0]],
          expected: [8, 4],
        },
        {
          name: "No legal moves",
          input: [["."], [0, 0]],
          expected: [1, 1],
        },
        {
          name: "Ring around an obstacle",
          input: [["...", ".#.", "..."], [0, 0]],
          expected: [8, 4],
        },
      ],
    },
  },
  {
    slug: "warehouse-boxes",
    title: "Maximize Boxes Stored Through One Entrance",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Prefix-min ceilings plus an exchange-argument greedy.",
    prompt: `A warehouse is a row of n rooms accessed through a single entrance at the left; heights[i] is room i's ceiling. You have boxes with heights boxes[j]. Boxes are pushed in from the entrance and slide right; a box cannot pass through any room with a ceiling lower than the box (equal heights pass), and each room stores at most one box. Boxes may be inserted in any order you choose, and you may discard boxes. Maximize the number of boxes stored.

\`\`\`
maxBoxes([5, 3, 3, 4, 1], [1, 2, 2, 3, 4])  ->  5
maxBoxes([1, 2, 2, 3, 4], [3, 4, 1, 2])     ->  1    // height-1 entrance chokes everything
\`\`\``,
    hints: [
      "A room's real ceiling is the minimum of every ceiling on the way in: usable[i] = min(heights[0..i]), a non-increasing prefix min.",
      "Sort boxes ascending and walk rooms deepest-first (most constrained): if the smallest unused box fits the current room's usable ceiling, place it. An exchange argument shows smallest-into-deepest never loses a box.",
    ],
    judge: {
      starterCode: `/**
 * @param {number[]} heights - room ceilings, entrance at index 0
 * @param {number[]} boxes - box heights, any insertion order allowed
 * @returns {number} maximum number of boxes that can be stored
 */
function maxBoxes(heights, boxes) {
  // Your code here
  return 0;
}
`,
      entry: "maxBoxes",
      tests: [
        {
          name: "Worked example",
          input: [[5, 3, 3, 4, 1], [1, 2, 2, 3, 4]],
          expected: 5,
        },
        {
          name: "Low entrance chokes everything",
          input: [[1, 2, 2, 3, 4], [3, 4, 1, 2]],
          expected: 1,
        },
        {
          name: "Decreasing warehouse takes everything",
          input: [[4, 3, 2, 1], [1, 2, 3, 4]],
          expected: 4,
        },
        {
          name: "Box taller than the entrance",
          input: [[2, 5, 5], [3]],
          expected: 0,
        },
        {
          name: "More boxes than rooms",
          input: [[3, 3], [1, 1, 1, 1]],
          expected: 2,
        },
        { name: "No rooms", input: [[], [1]], expected: 0 },
        { name: "No boxes", input: [[3], []], expected: 0 },
      ],
    },
  },
  {
    slug: "mark-and-compact-subtree",
    title: "Mark and Compact a Heap-Indexed Subtree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Garbage collection in miniature: mark a subtree, compact, remap.",
    prompt: `A memory manager stores a binary tree in an array: the node at index i has children at 2i+1 and 2i+2; a null slot means no node (and thus no subtree below it). Implement the GC operation markAndCompact(heapArray, k):

Mark the entire subtree rooted at index k as garbage, then compact the surviving values to the front of a new array, preserving their original order, and return [newArray, remap] where remap maps old index to new index for every survivor (references into the array must be patched — that is the remap's job). An out-of-range k, or a k pointing at a null slot, marks nothing — but compaction still drops the null slots.

\`\`\`
markAndCompact(["A","B","C","D","E","F","G"], 1)
  -> [["A","C","F","G"], {0: 0, 2: 1, 5: 2, 6: 3}]
\`\`\``,
    hints: [
      "Phase one, mark: walk the implicit tree from k with an explicit stack (children 2i+1 and 2i+2), stopping at out-of-range indices and null slots — a null slot prunes its whole implicit subtree.",
      "Phase two, compact: one left-to-right pass copying every non-null unmarked value, recording old -> new in the remap as you go. Voicing why the remap must be returned (compaction breaks the implicit indexing) is the design point.",
    ],
    judge: {
      starterCode: `/**
 * @param {(string | null)[]} heapArray - implicit binary tree; null = no node
 * @param {number} k - root index of the subtree to collect
 * @returns {[(string)[], Record<number, number>]} [newArray, remap] where
 *   remap maps each survivor's old index to its new index
 */
function markAndCompact(heapArray, k) {
  // Your code here
  return [[], {}];
}
`,
      entry: "__judgeMarkCompact",
      driverCode: `function __judgeMarkCompact(heapArray, k) {
  const result = markAndCompact(heapArray.slice(), k);
  if (!Array.isArray(result) || result.length !== 2) {
    return { validShape: false };
  }
  return { newArray: result[0], remap: result[1] };
}`,
      tests: [
        {
          name: "Worked 7-node example",
          input: [["A", "B", "C", "D", "E", "F", "G"], 1],
          expected: {
            newArray: ["A", "C", "F", "G"],
            remap: { 0: 0, 2: 1, 5: 2, 6: 3 },
          },
        },
        {
          name: "Collecting the root empties everything",
          input: [["A", "B"], 0],
          expected: { newArray: [], remap: {} },
        },
        {
          name: "A null hole prunes the marked walk",
          input: [["A", "B", "C", null, "E"], 1],
          expected: { newArray: ["A", "C"], remap: { 0: 0, 2: 1 } },
        },
        {
          name: "Out-of-range k still compacts nulls",
          input: [["A", "B"], 5],
          expected: { newArray: ["A", "B"], remap: { 0: 0, 1: 1 } },
        },
        {
          name: "k on a null slot is a no-op mark",
          input: [["A", null, "C"], 1],
          expected: { newArray: ["A", "C"], remap: { 0: 0, 2: 1 } },
        },
        {
          name: "Removing a leaf",
          input: [["A", "B", "C"], 2],
          expected: { newArray: ["A", "B"], remap: { 0: 0, 1: 1 } },
        },
      ],
    },
  },
  {
    slug: "single-tab-browser-history",
    title: "Implement Single-Tab Browser History Navigation",
    category: "algorithms",
    difficulty: "medium",
    companies: ["chime"],
    summary:
      "A cursor over one visit stack: truncate forward history, clamp at both ends.",
    prompt: `Implement a \`BrowserSession\` for a single-tab browser.

## APIs

- \`BrowserSession(homepage)\` — initialize the session; the current page starts at \`homepage\`.
- \`visit(url)\` — navigate to \`url\` from the current page and clear any forward history.
- \`back(steps)\` — move up to \`steps\` pages back; if fewer pages exist, move as far as possible. Return the current url after the move.
- \`forward(steps)\` — move up to \`steps\` pages forward; if fewer pages exist, move as far as possible. Return the current url after the move.
- \`haveVisited(url)\` — return whether the session has ever visited \`url\` at least once since construction, regardless of whether it currently sits in back/forward history.

## Driver contract for this console

In JavaScript, TypeScript, and Python you implement a single function \`solution(operations, args)\`:

- \`operations\` is a list of method-name strings; the first is always \`"BrowserSession"\`.
- \`args\` is a parallel list of argument lists, one per operation.
- Replay the operations against one \`BrowserSession\` instance and return a list of results, one per operation: null for the constructor and for \`visit\` (which return nothing), the resulting url for \`back\` and \`forward\`, and the boolean for \`haveVisited\`.

The starter code already contains that replay loop, so only the class body is yours to fill in. In Java, C++, and Go you implement the \`BrowserSession\` class alone and the harness replays the operations for you.

## Edge cases to handle

- \`steps <= 0\` (including negative) must not move the cursor.
- \`visit\` must truncate any forward history before appending the new page.
- \`back\` and \`forward\` past the ends clamp to the oldest and newest page.
- \`haveVisited\` is true for every url ever visited (and for the homepage), even after a later \`visit\` drops that url from the live forward history.

## Examples

\`\`\`
operations = ["BrowserSession", "visit", "visit", "visit",
              "back", "back", "forward", "visit",
              "forward", "back", "back"]
args       = [["leetcode.com"], ["google.com"],
              ["facebook.com"], ["youtube.com"], [1], [1], [1],
              ["linkedin.com"], [2], [2], [7]]

-> [null, null, null, null, "facebook.com", "google.com",
    "facebook.com", null, "linkedin.com", "google.com",
    "leetcode.com"]
\`\`\`

After visiting google, facebook, and youtube the cursor sits at youtube. back(1) lands on facebook and back(1) again on google, then forward(1) returns to facebook. Visiting linkedin.com there clears the forward history — youtube is gone — so forward(2) clamps to linkedin, back(2) reaches google, and back(7) clamps to the homepage.

\`\`\`
operations = ["BrowserSession", "visit", "visit",
              "haveVisited", "haveVisited", "back", "haveVisited"]
args       = [["home.com"], ["a.com"], ["b.com"],
              ["a.com"], ["z.com"], [1], ["b.com"]]

-> [null, null, null, true, false, "a.com", true]
\`\`\`

a.com was visited so it reports true, while z.com never was. After back(1) lands on a.com, b.com still reports true: the visited set never shrinks.

## Constraints

- The first operation is always \`BrowserSession(homepage)\`, and the current page always exists.
- Urls are non-empty strings.
- \`steps\` may be zero or negative; non-positive steps must not move the cursor.
- \`back\` and \`forward\` clamp at the oldest and newest page rather than erroring.
- Target O(1) amortized time per operation and O(n) space for n total visits.
- Be ready to justify the structure you pick — dynamic array plus cursor, two stacks, or doubly linked list plus cursor — and its trade-offs.`,
    hints: [
      "An array of urls plus a cursor index covers every operation: back and forward are clamped index arithmetic, and visit drops everything after the cursor before appending.",
      "haveVisited cannot read the live history, because visit truncates urls that were still visited. Keep a separate set that only ever grows — written once at construction, then on every visit.",
    ],
    judge: {
      starterCode: `function solution(operations, args) {
  class BrowserSession {
    constructor(homepage) {
      // TODO: initialize history at homepage
    }

    visit(url) {
      // TODO: navigate to url, clearing forward history
    }

    back(steps) {
      // TODO: move up to steps pages back, return current url
    }

    forward(steps) {
      // TODO: move up to steps pages forward, return current url
    }

    haveVisited(url) {
      // TODO: has url ever been visited?
    }
  }

  let obj = null;
  const res = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const arg = args[i];
    if (op === "BrowserSession") {
      obj = new BrowserSession(...arg);
      res.push(null);
    } else if (op === "visit") {
      obj.visit(...arg);
      res.push(null);
    } else if (op === "back") {
      res.push(obj.back(...arg));
    } else if (op === "forward") {
      res.push(obj.forward(...arg));
    } else if (op === "haveVisited") {
      res.push(obj.haveVisited(...arg));
    }
  }
  return res;
}
`,
      entry: "solution",
      tests: [
        {
          name: "Canonical walk with a truncating visit",
          input: [
            ["BrowserSession", "visit", "visit", "visit", "back", "back", "forward", "visit", "forward", "back", "back"],
            [["leetcode.com"], ["google.com"], ["facebook.com"], ["youtube.com"], [1], [1], [1], ["linkedin.com"], [2], [2], [7]],
          ],
          expected: [null, null, null, null, "facebook.com", "google.com", "facebook.com", null, "linkedin.com", "google.com", "leetcode.com"],
        },
        {
          name: "The visited set never shrinks",
          input: [
            ["BrowserSession", "visit", "visit", "haveVisited", "haveVisited", "back", "haveVisited"],
            [["home.com"], ["a.com"], ["b.com"], ["a.com"], ["z.com"], [1], ["b.com"]],
          ],
          expected: [null, null, null, true, false, "a.com", true],
        },
        {
          name: "Non-positive steps hold the cursor",
          input: [
            ["BrowserSession", "visit", "visit", "back", "back", "forward", "forward", "back"],
            [["a.com"], ["b.com"], ["c.com"], [0], [-3], [0], [-1], [1]],
          ],
          expected: [null, null, null, "c.com", "c.com", "c.com", "c.com", "b.com"],
        },
        {
          name: "visit truncates the forward history",
          input: [
            ["BrowserSession", "visit", "visit", "visit", "back", "visit", "forward", "haveVisited", "haveVisited"],
            [["home.com"], ["a.com"], ["b.com"], ["c.com"], [2], ["d.com"], [5], ["c.com"], ["e.com"]],
          ],
          expected: [null, null, null, null, "a.com", null, "d.com", true, false],
        },
        {
          name: "One-page session clamps both ways",
          input: [
            ["BrowserSession", "back", "forward", "haveVisited", "haveVisited"],
            [["chime.com"], [3], [3], ["chime.com"], ["nope.com"]],
          ],
          expected: [null, "chime.com", "chime.com", true, false],
        },
      ],
    },
  },
  {
    slug: "implement-debounce",
    title: "Implement debounce()",
    category: "frontend",
    difficulty: "easy",
    companies: ["meta", "stripe"],
    summary: "Closures and timers, the frontend screen classic.",
    prompt:
      "Implement debounce(fn, wait): return a wrapped function that delays invoking fn until wait milliseconds have passed since the last call. Support a cancel() method, and be ready to explain how debounce differs from throttle and when a leading-edge option matters.\n\nWrite it in TypeScript with correct this-binding and argument forwarding.",
    hints: [
      "Each call should reset the pending timer — a closure over the timer id is all the state you need.",
      "For leading-edge behavior, fire immediately when no timer is pending, then suppress calls until things go quiet.",
    ],
  },
  {
    slug: "top-earners-per-department",
    title: "Top Earners per Department",
    category: "sql",
    difficulty: "medium",
    companies: ["amazon", "netflix"],
    summary: "Window functions beat self-joins — know why.",
    prompt:
      "Given tables employees(id, name, salary, department_id) and departments(id, name), write a query returning each department's name alongside its highest-paid employees, including ties.\n\nFollow-up: return the top three per department, and compare the performance of a window-function solution against a correlated subquery.",
    hints: [
      "DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) handles ties cleanly.",
      "Window functions cannot appear in WHERE — filter on the rank in an outer query or CTE.",
    ],
  },
  {
    slug: "design-rate-limiter",
    title: "Design a Rate Limiter",
    category: "system-design",
    difficulty: "medium",
    companies: ["stripe", "amazon"],
    summary: "Token bucket, sliding window, and where the counters live.",
    prompt:
      "Design a rate limiter for a public API that enforces per-client limits such as 100 requests per minute. Cover the algorithm choice (fixed window, sliding window, token bucket), where counters live in a multi-node deployment, failure modes when the counter store is down, and what response a throttled client should receive.",
    hints: [
      "Compare fixed window, sliding window log, and token bucket by the burst behavior each allows.",
      "Centralized counters (for example in Redis) trade latency for accuracy. Decide when approximately correct is acceptable.",
    ],
  },
  {
    slug: "design-url-shortener",
    title: "Design a URL Shortener",
    category: "system-design",
    difficulty: "medium",
    companies: ["google"],
    summary: "The classic: encoding, storage, and redirects at scale.",
    prompt:
      "Design a URL-shortening service like bit.ly: generating short codes, storing mappings, and redirecting with low latency. Cover capacity estimation, the read/write ratio, hot links, and how you would add per-link analytics without slowing down redirects.",
    hints: [
      "Base62 over an auto-incrementing id is simple — think about what it leaks and when you need random codes instead.",
      "Redirects are overwhelmingly read-heavy. Work out where caches and CDNs fit before sharding anything.",
    ],
  },
  {
    slug: "design-news-feed",
    title: "Design a News Feed",
    category: "system-design",
    difficulty: "hard",
    companies: ["meta"],
    summary: "Fan-out on write vs. read, ranking, and the celebrity problem.",
    prompt:
      "Design the backend for a social news feed: following, posting, and a personalized timeline. Compare fan-out-on-write and fan-out-on-read, explain how you would handle accounts with millions of followers, and sketch where a ranking service fits in the read path.",
    hints: [
      "Precomputing timelines is cheap for most users and ruinous for celebrities — hybrid fan-out exists for a reason.",
      "Separate the storage problem (what happened) from the ranking problem (what to show first).",
    ],
  },
  {
    slug: "conflict-with-teammate",
    title: "Tell Me About a Conflict",
    category: "behavioral",
    difficulty: "medium",
    companies: ["amazon"],
    summary: "STAR structure for the most common behavioral prompt.",
    prompt:
      "“Tell me about a time you disagreed with a teammate or your manager.” Prepare a STAR answer (Situation, Task, Action, Result) drawn from a real project. Interviewers are listening for how you disagree productively: whether you sought data, escalated appropriately, and preserved the relationship.\n\nFor Amazon loops, map your story to a leadership principle such as Have Backbone; Disagree and Commit.",
    hints: [
      "Pick a story where someone changed their mind — you or them. Stalemates make weak answers.",
      "End with the measurable result and what you would do differently, not with who turned out to be right.",
    ],
  },
];

export const tracks: Track[] = [
  {
    slug: "swe-foundations",
    name: "SWE Foundations",
    description:
      "The core coding-round ramp: pointers and sweeps up through graphs, in the order the patterns build on each other.",
    problemSlugs: [
      "pair-sum-sorted",
      "merge-intervals",
      "lru-cache",
      "course-schedule",
      "implement-debounce",
    ],
  },
  {
    slug: "system-design-primer",
    name: "System Design Primer",
    description:
      "Three designs that cover the moves most loops test: limiting load, read-heavy serving, and fan-out.",
    problemSlugs: [
      "design-rate-limiter",
      "design-url-shortener",
      "design-news-feed",
    ],
  },
  {
    slug: "amazon-loop-prep",
    name: "Amazon Loop in 2 Weeks",
    description:
      "Amazon-tagged coding and data questions, plus the behavioral work the Leadership Principles rounds demand.",
    problemSlugs: [
      "pair-sum-sorted",
      "lru-cache",
      "top-earners-per-department",
      "design-rate-limiter",
      "conflict-with-teammate",
    ],
  },
];

