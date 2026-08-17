import type { Company, Problem, Track } from "./types";

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

export const companies: Company[] = [
  {
    slug: "google",
    name: "Google",
    blurb:
      "Algorithm-heavy loops with a high bar for code quality and complexity analysis. Googleyness rounds probe collaboration and comfort with ambiguity.",
    process: [
      "Recruiter screen",
      "Phone screen: one 45-minute coding interview",
      "Onsite: 3-4 coding rounds plus system design (level-dependent)",
      "Googleyness & leadership round",
      "Hiring committee review",
    ],
  },
  {
    slug: "amazon",
    name: "Amazon",
    blurb:
      "Every interview weaves in the Leadership Principles — expect a behavioral question in each round, with follow-ups that dig for data and ownership.",
    process: [
      "Recruiter screen",
      "Online assessment: two coding problems plus a work simulation",
      "Phone screen",
      "Onsite loop: 4-5 rounds pairing coding or design with Leadership Principles",
      "Bar raiser round",
    ],
  },
  {
    slug: "meta",
    name: "Meta",
    blurb:
      "Fast-paced coding rounds — two problems in 45 minutes is common — plus a product-minded design round and a dedicated behavioral round.",
    process: [
      "Recruiter screen",
      "Phone screen: 1-2 coding problems",
      "Onsite: two coding rounds",
      "System or product design round",
      "Behavioral round",
    ],
  },
  {
    slug: "stripe",
    name: "Stripe",
    blurb:
      "Practical over puzzle: expect to write working code in a real editor, debug an unfamiliar codebase, and design APIs with careful edge-case handling.",
    process: [
      "Recruiter screen",
      "Phone screen: practical coding",
      "Onsite: coding round plus a bug squash in a real codebase",
      "Integration / API design round",
      "Hiring manager conversation",
    ],
  },
  {
    slug: "netflix",
    name: "Netflix",
    blurb:
      "Senior-leaning loops that weigh judgment and culture heavily — expect deep dives on past architecture decisions alongside coding.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding plus architecture deep dives",
      "Culture conversation",
      "Team matching",
    ],
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    blurb:
      "Product-minded loops with practical coding rounds — string and array manipulation with fiddly edge cases shows up often, and design rounds stay grounded in surfaces like feeds and boards.",
    process: [
      "Recruiter screen",
      "Technical phone screen: one coding problem",
      "Onsite: two coding rounds",
      "System design round",
      "Behavioral / cross-functional round",
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

