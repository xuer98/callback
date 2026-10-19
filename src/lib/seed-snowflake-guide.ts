import type { Problem } from "./types";

// Snowflake coding prompts from the SWE interview study guide's
// backend-families toolkit that had no counterpart in the bank: the
// common-substring family the recruiter's email names, topological sort as
// the plain function GreatFrontEnd asks for, and two happy-number
// variations. Python in seed-python-snowflake-x.ts.

export const snowflakeGuideProblems: Problem[] = [
  {
    slug: "longest-common-substring",
    title: "Longest Common Substring",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "A table that resets to zero on a mismatch, so the answer is the largest cell rather than the corner, and one row of it is enough.",
    prompt: [
      'Given two strings, return their **longest common substring**: the longest string that appears contiguously in both. When several share the longest length, return the one that starts earliest in the first string. Two strings with nothing in common give `""`.',
      "",
      'This is not the longest common *subsequence*: `"abcde"` and `"ace"` share the subsequence `"ace"` but no substring longer than one letter.',
      "",
      "```",
      'longestCommonSubstring("snowflake", "flakes")   ->  "flake"',
      'longestCommonSubstring("abcxyz", "xyzabc")      ->  "abc"      // "xyz" is as long but starts later in the first string',
      'longestCommonSubstring("abc", "xyz")            ->  ""',
      "```",
    ].join("\n"),
    hints: [
      "Let `dp[i][j]` be the length of the common suffix of the first `i` letters of one string and the first `j` of the other: `dp[i-1][j-1] + 1` when the letters match, otherwise 0. The answer is the largest cell and where it sits.",
      "Only the previous row is read, so keep two rows. Record a new best only on a strictly larger length while scanning the first string left to right, and the earliest start falls out for free.",
      "A follow-up asks for better than O(m × n): binary search on the length with a set of rolling hashes of every window, and say what collisions cost.",
    ],
    solution: [
      "## Approach",
      "",
      "The subsequence table takes the larger of its neighbours on a mismatch; the substring table resets to zero, because a mismatch breaks contiguity. `dp[i][j]` is the length of the longest string that ends at position `i` in the first string and at position `j` in the second. The answer is the largest value anywhere in the table together with its end position in the first string, and the substring is the slice ending there. Since only the previous row is read, two rows suffice. Recording a new best only when the length is strictly larger, while scanning the first string left to right, returns the earliest start among ties.",
      "",
      "## Complexity",
      "",
      "O(m × n) time, O(n) extra space with two rows.",
      "",
      "## Worth saying out loud",
      "",
      "- The hash-table reading of the hint is a trap: storing every substring of both strings is O(n²) memory and O(n³) time. The hash table that helps is a set of rolling hashes of every window of one length, inside a binary search on the length: O((m + n) log min(m, n)), with a collision check or a second modulus.",
      "- Why the binary search is sound: if a common substring of length L exists, so does one of every shorter length.",
      "- Neighbours the interviewer may pivot to: the same table on integer arrays, the longest repeated substring of one string (the same binary search comparing a string with itself), edit distance and the shortest common supersequence.",
      "- Tests to name: identical strings, one empty, no letters in common, a tie resolved by position in the first string, and a match at the very end of both.",
    ].join("\n"),
    judge: {
      solutionCode: `// Two rows of the common-suffix table; the best only moves on a strictly longer match.
function longestCommonSubstring(a, b) {
  let prev = new Array(b.length + 1).fill(0);
  let bestLength = 0;
  let bestEnd = 0;
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > bestLength) {
          bestLength = cur[j];
          bestEnd = i;
        }
      }
    }
    prev = cur;
  }
  return a.slice(bestEnd - bestLength, bestEnd);
}
`,
      starterCode: `/**
 * @param {string} a
 * @param {string} b
 * @returns {string} the longest substring of both; among ties, the one that starts earliest in a
 */
function longestCommonSubstring(a, b) {
  // Your code here
  return "";
}
`,
      entry: "longestCommonSubstring",
      tests: [
        {
          name: "Prompt example",
          input: ["snowflake", "flakes"],
          expected: "flake",
        },
        {
          name: "Tie goes to the earliest start in the first string",
          input: ["abcxyz", "xyzabc"],
          expected: "abc",
        },
        { name: "Nothing in common", input: ["abc", "xyz"], expected: "" },
        {
          name: "Identical strings",
          input: ["banana", "banana"],
          expected: "banana",
        },
        { name: "One string empty", input: ["", "abc"], expected: "" },
        {
          name: "A subsequence is not a substring",
          input: ["abcde", "ace"],
          expected: "a",
        },
        {
          name: "Match at the end of both",
          input: ["xxhello", "yyhello"],
          expected: "hello",
        },
        { name: "Repeated letters", input: ["aaaa", "aa"], expected: "aa" },
        { name: "Case matters", input: ["Snow", "snow"], expected: "now" },
        {
          name: "Longer strings",
          input: ["thequickbrownfoxjumps", "alazydogthequickbrowncat"],
          expected: "thequickbrown",
        },
      ],
    },
  },
  {
    slug: "topological-sort",
    title: "Topological Sort",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Kahn's algorithm with a min-heap in place of the queue: in-degrees, a frontier of ready nodes, and an empty result when a node never becomes ready.",
    prompt: [
      "A directed graph arrives as an object: each key is a node and its value lists the nodes its outgoing edges point to. Every node appears as a key, even one with no edges. Return a **topological order**: every edge goes from an earlier node to a later one. When several orders exist, return the **lexicographically smallest**, comparing node names as strings. Return `[]` when the graph has a cycle, since then no order exists.",
      "",
      "```",
      'topologicalSort({ a: ["b", "c"], b: ["d"], c: ["d"], d: [] })  ->  ["a", "b", "c", "d"]',
      'topologicalSort({ b: ["a"], a: [], c: [] })                    ->  ["b", "a", "c"]   // "a" waits for "b"; "c" is free but sorts after "a"',
      'topologicalSort({ a: ["b"], b: ["a"] })                        ->  []',
      "```",
    ].join("\n"),
    hints: [
      "Count in-degrees from the adjacency lists; the nodes with none are ready. Pop a ready node, append it, and lower the in-degree of each neighbour, releasing the ones that reach zero.",
      "A plain queue gives some valid order; a min-heap, or a sorted insertion, over the ready nodes gives the lexicographically smallest one.",
      "If the result holds fewer nodes than the graph has keys, the rest sit on or behind a cycle: return `[]`. Count the nodes from the keys, not from the edges.",
    ],
    solution: [
      "## Approach",
      "",
      "Build the in-degrees from the lists. Seed a min-heap with every node whose in-degree is zero. Pop the smallest, append it to the order, and for each of its neighbours decrement the in-degree, pushing the ones that hit zero. Taking the smallest ready node at every step gives the lexicographically smallest valid order: any order that places a larger node at that position can swap the smaller ready node in without breaking an edge. If the loop ends with fewer nodes than keys, the leftover nodes all kept a positive in-degree, so they form or hang off a cycle, and the answer is `[]`.",
      "",
      "## Complexity",
      "",
      "O((V + E) log V) with a heap. A sorted array with binary-search insertion has the same bound here, since each node is inserted once.",
      "",
      "## Worth saying out loud",
      "",
      "- The depth-first version: three colours, a back edge means a cycle, append on exit and reverse at the end. It cannot produce the lexicographically smallest order directly, which is why Kahn's algorithm wins for this phrasing.",
      "- The order is unique exactly when the ready set never holds more than one node.",
      "- Report the cycle, not just `[]`: keep the depth-first stack and return the nodes from the first repeat.",
      "- Course prerequisites, build systems and [Workflow With Dependencies](/problems/workflow-dependencies) are the same algorithm with a story on top; the timing variants replace the queue with a per-node finish time.",
    ].join("\n"),
    judge: {
      solutionCode: `// Kahn's algorithm; the ready list stays sorted so the smallest node always goes next.
function topologicalSort(graph) {
  const nodes = Object.keys(graph);
  const indegree = new Map(nodes.map((node) => [node, 0]));
  for (const node of nodes) {
    for (const next of graph[node]) indegree.set(next, indegree.get(next) + 1);
  }
  const ready = nodes.filter((node) => indegree.get(node) === 0).sort();
  const order = [];
  while (ready.length) {
    const node = ready.shift();
    order.push(node);
    for (const next of graph[node]) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) insertSorted(ready, next);
    }
  }
  return order.length === nodes.length ? order : [];
}

function insertSorted(list, value) {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  list.splice(lo, 0, value);
}
`,
      starterCode: `/**
 * @param {Record<string, string[]>} graph each node's outgoing edges; every node is a key
 * @returns {string[]} the lexicographically smallest topological order, or [] when there is a cycle
 */
function topologicalSort(graph) {
  // Your code here
  return [];
}
`,
      entry: "topologicalSort",
      tests: [
        {
          name: "Prompt example",
          input: [{ a: ["b", "c"], b: ["d"], c: ["d"], d: [] }],
          expected: ["a", "b", "c", "d"],
        },
        {
          name: "The smallest valid order, not the smallest name first",
          input: [{ b: ["a"], a: [], c: [] }],
          expected: ["b", "a", "c"],
        },
        {
          name: "A two-node cycle",
          input: [{ a: ["b"], b: ["a"] }],
          expected: [],
        },
        {
          name: "No edges",
          input: [{ c: [], a: [], b: [] }],
          expected: ["a", "b", "c"],
        },
        { name: "A single node", input: [{ only: [] }], expected: ["only"] },
        { name: "An empty graph", input: [{}], expected: [] },
        {
          name: "A cycle behind a free node",
          input: [{ a: ["b"], b: ["c"], c: ["b"], d: [] }],
          expected: [],
        },
        {
          name: "Named tasks in a diamond",
          input: [
            {
              build: ["test", "lint"],
              lint: ["deploy"],
              test: ["deploy"],
              deploy: [],
            },
          ],
          expected: ["build", "lint", "test", "deploy"],
        },
        {
          name: "A chain with a shortcut",
          input: [{ e: [], d: ["e"], c: ["d"], b: ["c"], a: ["b", "e"] }],
          expected: ["a", "b", "c", "d", "e"],
        },
        {
          name: "Ties resolved again and again",
          input: [{ z: ["m"], y: ["m"], x: ["m"], m: ["a"], a: [] }],
          expected: ["x", "y", "z", "m", "a"],
        },
        { name: "A self-loop", input: [{ a: ["a"], b: [] }], expected: [] },
      ],
    },
  },
  {
    slug: "happy-number-cycle",
    title: "Happy Number Cycle",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "Iterate the digit-square sum until a value repeats; the loop is the path from that value's first visit, and a happy number's loop is just [1].",
    prompt: [
      "Repeatedly replace a positive integer by the **sum of the squares of its digits**. The sequence always ends in a loop: a happy number reaches `1` and stays there, and every other number falls into the same eight-value loop. Return the loop the given number enters, as its values in the order they are visited, starting from the first value that is visited twice.",
      "",
      "```",
      "happyCycle(19)   ->  [1]                                 // 19 → 82 → 68 → 100 → 1 → 1 …",
      "happyCycle(2)    ->  [4, 16, 37, 58, 89, 145, 42, 20]    // 2 → 4 → 16 → … → 20 → 4",
      "happyCycle(116)  ->  [58, 89, 145, 42, 20, 4, 16, 37]    // the same loop, entered at 58",
      "```",
    ].join("\n"),
    hints: [
      "Keep the values in order and a set of what has been seen; stop at the first value that is already in the set.",
      "The loop is the slice of the path from that value's first appearance to the end.",
      "For O(1) extra space, Floyd's two pointers find a value inside the loop; walk from it until it comes round again to list the loop.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk the sequence, appending each value to a list and recording its index in a map, until the next value is already in the map. That value is the first one visited twice, so the loop is the list from its recorded index to the end. A happy number's walk stops when `1` maps to `1` again, giving `[1]`; everything else stops at the eight-value loop, entered at whichever member the walk reaches first.",
      "",
      "## Complexity",
      "",
      "The digit-square sum of a number with k digits is at most 81k, so any start drops below 1,000 within a step or two and the path has a small bounded length; time and space are proportional to that path.",
      "",
      "## Worth saying out loud",
      "",
      "- The plain question only asks whether the walk reaches `1`: the same loop ending in `return next === 1`, or Floyd's two pointers for O(1) space, which works because a bounded sequence must repeat.",
      "- Variations swap the digit function: cubes, the product of the digits, another base. Pass the function in and nothing else changes. Returning the loop's length, or the number of steps before it, is the same walk with a different last line.",
      "- That base ten has exactly one loop besides `1` is a fact to state, not prove: every number below 1,000 has been checked.",
      "- Tests to name: `1` itself, a happy number with a long path, a loop member such as `4`, and a number that enters the loop in the middle.",
    ].join("\n"),
    judge: {
      solutionCode: `// Walk until a value repeats; the loop is the path from that value's first visit.
function happyCycle(n) {
  const path = [];
  const seenAt = new Map();
  let value = n;
  while (!seenAt.has(value)) {
    seenAt.set(value, path.length);
    path.push(value);
    value = digitSquareSum(value);
  }
  return path.slice(seenAt.get(value));
}

function digitSquareSum(n) {
  let sum = 0;
  while (n > 0) {
    const digit = n % 10;
    sum += digit * digit;
    n = Math.floor(n / 10);
  }
  return sum;
}
`,
      starterCode: `/**
 * @param {number} n a positive integer
 * @returns {number[]} the loop the digit-square sequence enters, from the first value visited twice
 */
function happyCycle(n) {
  // Your code here
  return [];
}
`,
      entry: "happyCycle",
      tests: [
        { name: "A happy number", input: [19], expected: [1] },
        {
          name: "The unhappy loop from its start",
          input: [2],
          expected: [4, 16, 37, 58, 89, 145, 42, 20],
        },
        {
          name: "Entering the loop in the middle",
          input: [116],
          expected: [58, 89, 145, 42, 20, 4, 16, 37],
        },
        { name: "One", input: [1], expected: [1] },
        {
          name: "A loop member",
          input: [4],
          expected: [4, 16, 37, 58, 89, 145, 42, 20],
        },
        { name: "Seven", input: [7], expected: [1] },
        {
          name: "Another entry point",
          input: [3],
          expected: [37, 58, 89, 145, 42, 20, 4, 16],
        },
        { name: "A large happy number", input: [1000000], expected: [1] },
        {
          name: "A large unhappy number",
          input: [99999999],
          expected: [58, 89, 145, 42, 20, 4, 16, 37],
        },
      ],
    },
  },
  {
    slug: "happy-numbers-up-to-n",
    title: "Happy Numbers Up to N",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "One memo shared across every start: each value on a walk inherits the answer of where the walk stopped, so no value is followed twice.",
    prompt: [
      "A number is **happy** when repeatedly replacing it by the sum of the squares of its digits reaches `1`; every other number falls into a loop that never contains `1`. Return every happy number from `1` to `n` inclusive, in increasing order. Checking each number from scratch repeats the same walks over and over; share the work so that no value's fate is computed twice.",
      "",
      "```",
      "happyNumbersUpTo(50)  ->  [1, 7, 10, 13, 19, 23, 28, 31, 32, 44, 49]",
      "happyNumbersUpTo(6)   ->  [1]",
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from value to happy or not, seeded with `1 → true`. Walk a number until the current value is in the map or has already appeared on this walk.",
      "Every value on the walk shares the outcome: a known value passes its answer back along the path; a repeat inside the walk marks the whole path unhappy.",
      "Walks pass through values above `n` (`99` goes to `162`); memoise them too, since later walks reuse them.",
    ],
    solution: [
      "## Approach",
      "",
      "A memo from value to its fate starts with `1` as happy. For each start from `1` to `n`, follow the digit-square sums, collecting the path, until the current value is in the memo or repeats within this path. In the first case every value on the path takes the memo's answer; in the second the path has closed a loop without `1`, so every value on it is unhappy. Each value is followed at most once across the whole run, which is the point of one shared memo rather than a fresh check per number.",
      "",
      "## Complexity",
      "",
      "O(n) steps and memo entries, plus the handful of values above `n` that walks pass through. Collecting the answers is one more pass.",
      "",
      "## Worth saying out loud",
      "",
      '- Without the memo each number costs a walk of a dozen steps or so, which is also fine for small `n`; the memo is what you reach for when the interviewer says "now for every number up to ten million".',
      "- The per-walk set doubles as the cycle detector. Floyd's two pointers remove that set but not the memo.",
      "- The same sweep answers related questions: the longest walk before a loop below `n`, or how many numbers enter the loop at each of its members.",
      "- Tests to name: `n = 1`, an `n` below `7` where only `1` qualifies, `n = 50` against the known list, and a walk that leaves the range before coming back.",
    ].join("\n"),
    judge: {
      solutionCode: `// One memo for every start: a walk stops at a known value or at a repeat, and the whole path takes that answer.
function happyNumbersUpTo(n) {
  const fate = new Map([[1, true]]);
  const out = [];
  for (let start = 1; start <= n; start++) {
    const path = [];
    const onPath = new Set();
    let value = start;
    while (!fate.has(value) && !onPath.has(value)) {
      onPath.add(value);
      path.push(value);
      value = digitSquareSum(value);
    }
    const happy = fate.has(value) ? fate.get(value) : false;
    for (const visited of path) fate.set(visited, happy);
    if (fate.get(start)) out.push(start);
  }
  return out;
}

function digitSquareSum(n) {
  let sum = 0;
  while (n > 0) {
    const digit = n % 10;
    sum += digit * digit;
    n = Math.floor(n / 10);
  }
  return sum;
}
`,
      starterCode: `/**
 * @param {number} n
 * @returns {number[]} every happy number from 1 to n, ascending
 */
function happyNumbersUpTo(n) {
  // Your code here
  return [];
}
`,
      entry: "happyNumbersUpTo",
      tests: [
        {
          name: "Prompt example",
          input: [50],
          expected: [1, 7, 10, 13, 19, 23, 28, 31, 32, 44, 49],
        },
        { name: "Only one qualifies", input: [6], expected: [1] },
        { name: "n = 1", input: [1], expected: [1] },
        { name: "n = 0", input: [0], expected: [] },
        {
          name: "Up to 100",
          input: [100],
          expected: [
            1, 7, 10, 13, 19, 23, 28, 31, 32, 44, 49, 68, 70, 79, 82, 86, 91,
            94, 97, 100,
          ],
        },
        {
          name: "Up to 200",
          input: [200],
          expected: [
            1, 7, 10, 13, 19, 23, 28, 31, 32, 44, 49, 68, 70, 79, 82, 86, 91,
            94, 97, 100, 103, 109, 129, 130, 133, 139, 167, 176, 188, 190, 192,
            193,
          ],
        },
        {
          name: "Walks leave the range and come back",
          input: [99],
          expected: [
            1, 7, 10, 13, 19, 23, 28, 31, 32, 44, 49, 68, 70, 79, 82, 86, 91,
            94, 97,
          ],
        },
      ],
    },
  },
];
