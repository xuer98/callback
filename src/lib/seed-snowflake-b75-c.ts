import type { Problem } from "./types";

// Blind 75 for the Snowflake backend screen, part C: dynamic programming.
// Python in seed-python-snowflake-p.ts.

export const snowflakeBlindProblemsC: Problem[] = [
  {
    slug: "coin-change",
    title: "Coin Change",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Fewest coins for an amount: dp over amounts, one pass per coin, infinity for the unreachable.",
    prompt: [
      "Given coin denominations and a total, return the fewest coins that make the total exactly, or -1 if no combination does. You have unlimited coins of each denomination.",
      "",
      "```",
      "coinChange([1, 2, 5], 11)  ->  3     // 5 + 5 + 1",
      "coinChange([2], 3)         ->  -1",
      "coinChange([1], 0)         ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Let dp[a] be the fewest coins for amount a. dp[a] = 1 + min(dp[a - coin]) over coins that fit.",
      "Initialise with a value larger than any answer; an amount still at that value at the end is unreachable.",
    ],
    solution: [
      "## Approach",
      "",
      "Bottom-up over amounts 0..total: `dp[a] = min(dp[a], dp[a - c] + 1)` for every coin `c <= a`. Greedy by largest coin fails on sets like `[1, 3, 4]` for 6, which is why the table is needed.",
      "",
      "## Complexity",
      "",
      "O(total × coins) time, O(total) space.",
      "",
      "## Worth saying out loud",
      "",
      "- BFS over amounts (each coin is an edge) finds the same answer and stops early; it is the same table explored level by level.",
      "- Counting the number of combinations is a different loop order (coins outer, amounts inner) — the follow-up Coin Change II.",
    ].join("\n"),
    judge: {
      solutionCode: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] + 1 < dp[a]) dp[a] = dp[a - coin] + 1;
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
      starterCode: `/**
 * @param {number[]} coins denominations
 * @param {number} amount
 * @returns {number} fewest coins, or -1
 */
function coinChange(coins, amount) {
  // Your code here
  return -1;
}
`,
      entry: "coinChange",
      tests: [
        { name: "Prompt example", input: [[1, 2, 5], 11], expected: 3 },
        { name: "Unreachable", input: [[2], 3], expected: -1 },
        { name: "Zero amount", input: [[1], 0], expected: 0 },
        { name: "Greedy fails", input: [[1, 3, 4], 6], expected: 2 },
        { name: "Large", input: [[186, 419, 83, 408], 6249], expected: 20 },
      ],
    },
  },
  {
    slug: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "The O(n²) table first, then patience sorting: tails[k] is the smallest tail of a length-k+1 run.",
    prompt: [
      "Return the length of the longest strictly increasing subsequence of `nums` (elements kept in order, not necessarily adjacent).",
      "",
      "```",
      "lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])  ->  4     // 2, 3, 7, 101",
      "lengthOfLIS([7, 7, 7])                     ->  1",
      "```",
    ].join("\n"),
    hints: [
      "O(n²): dp[i] = 1 + max dp[j] over j < i with nums[j] < nums[i].",
      "O(n log n): keep `tails`, where tails[k] is the smallest possible last value of an increasing run of length k+1; binary-search each value into it.",
    ],
    solution: [
      "## Approach",
      "",
      "Patience sorting. For each value, find the first tail that is >= the value (binary search) and overwrite it; if none, append. `tails` stays sorted and its length is the answer. The array does not hold an actual subsequence, only the best tail per length.",
      "",
      "## Complexity",
      "",
      "O(n log n) time, O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Non-strict (non-decreasing) changes the search to the first tail greater than the value.",
      "- Reconstructing the subsequence needs a predecessor array alongside the tails.",
    ].join("\n"),
    judge: {
      solutionCode: `function lengthOfLIS(nums) {
  const tails = [];
  for (const value of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = value;
  }
  return tails.length;
}
`,
      starterCode: `/**
 * @param {number[]} nums
 * @returns {number} length of the longest strictly increasing subsequence
 */
function lengthOfLIS(nums) {
  // Your code here
  return 0;
}
`,
      entry: "lengthOfLIS",
      tests: [
        { name: "Prompt example", input: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
        { name: "With repeats", input: [[0, 1, 0, 3, 2, 3]], expected: 4 },
        { name: "All equal", input: [[7, 7, 7]], expected: 1 },
        { name: "Empty", input: [[]], expected: 0 },
        { name: "Longer", input: [[1, 3, 6, 7, 9, 4, 10, 5, 6]], expected: 6 },
      ],
    },
  },
  {
    slug: "longest-common-subsequence",
    title: "Longest Common Subsequence",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "The classic grid: match extends the diagonal, mismatch takes the better neighbour.",
    prompt: [
      "Return the length of the longest subsequence common to `text1` and `text2`, or 0 if there is none.",
      "",
      "```",
      "longestCommonSubsequence(\"abcde\", \"ace\")  ->  3",
      "longestCommonSubsequence(\"abc\", \"def\")    ->  0",
      "```",
    ].join("\n"),
    hints: [
      "dp[i][j] is the answer for the first i characters of text1 and the first j of text2.",
      "Equal last characters: dp[i-1][j-1] + 1. Otherwise max(dp[i-1][j], dp[i][j-1]).",
    ],
    solution: [
      "## Approach",
      "",
      "Fill an (m+1) × (n+1) table row by row from the recurrence. Only the previous row is read, so two rows suffice for space.",
      "",
      "## Complexity",
      "",
      "O(m × n) time, O(min(m, n)) space with rolling rows.",
      "",
      "## Worth saying out loud",
      "",
      "- Edit distance and diff tools are this table with different costs on the three moves.",
      "- Recovering the subsequence walks the table back from the corner.",
    ].join("\n"),
    judge: {
      solutionCode: `function longestCommonSubsequence(text1, text2) {
  let prev = new Array(text2.length + 1).fill(0);
  for (let i = 1; i <= text1.length; i++) {
    const row = new Array(text2.length + 1).fill(0);
    for (let j = 1; j <= text2.length; j++) {
      row[j] = text1[i - 1] === text2[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], row[j - 1]);
    }
    prev = row;
  }
  return prev[text2.length];
}
`,
      starterCode: `/**
 * @param {string} text1
 * @param {string} text2
 * @returns {number} length of the longest common subsequence
 */
function longestCommonSubsequence(text1, text2) {
  // Your code here
  return 0;
}
`,
      entry: "longestCommonSubsequence",
      tests: [
        { name: "Prompt example", input: ["abcde", "ace"], expected: 3 },
        { name: "Identical", input: ["abc", "abc"], expected: 3 },
        { name: "Nothing in common", input: ["abc", "def"], expected: 0 },
        { name: "Empty side", input: ["", "abc"], expected: 0 },
        { name: "One letter shared", input: ["bsbininm", "jmjkbkjkv"], expected: 1 },
      ],
    },
  },
  {
    slug: "word-break",
    title: "Word Break",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "dp[i] says whether the first i characters segment; look back only as far as the longest word.",
    prompt: [
      "Return `true` if `s` can be split into a sequence of one or more words from `wordDict` (words may be reused).",
      "",
      "```",
      "wordBreak(\"leetcode\", [\"leet\", \"code\"])                            ->  true",
      "wordBreak(\"catsandog\", [\"cats\", \"dog\", \"sand\", \"and\", \"cat\"])  ->  false",
      "```",
    ].join("\n"),
    hints: [
      "dp[i] is true when some j < i has dp[j] true and s[j..i) in the dictionary.",
      "Put the words in a set and cap the look-back at the longest word's length.",
    ],
    solution: [
      "## Approach",
      "",
      "Bottom-up over prefix lengths. `dp[0]` is true (empty prefix); `dp[i]` is true if any `j` in `[i - maxLen, i)` has `dp[j]` and the substring `s[j..i)` is a dictionary word. The answer is `dp[s.length]`.",
      "",
      "## Complexity",
      "",
      "O(n × L) substring checks, where L is the longest word; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Plain recursion is exponential on inputs like `aaaa…b`; memoisation on the start index is the same table top-down.",
      "- Word Break II (all sentences) needs the same table plus backtracking, and its output can be exponential.",
    ].join("\n"),
    judge: {
      solutionCode: `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const longest = Math.max(0, ...wordDict.map((w) => w.length));
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = Math.max(0, i - longest); j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}
`,
      starterCode: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @returns {boolean} whether s splits into dictionary words
 */
function wordBreak(s, wordDict) {
  // Your code here
  return false;
}
`,
      entry: "wordBreak",
      tests: [
        { name: "Prompt example", input: ["leetcode", ["leet", "code"]], expected: true },
        { name: "Reuse a word", input: ["applepenapple", ["apple", "pen"]], expected: true },
        { name: "No split", input: ["catsandog", ["cats", "dog", "sand", "and", "cat"]], expected: false },
        { name: "Exponential for naive recursion", input: ["aaaaaaaaaaaaaaaaaaaaaaab", ["a", "aa", "aaa"]], expected: false },
        { name: "Whole string is a word", input: ["abc", ["abc"]], expected: true },
      ],
    },
  },
  {
    slug: "combination-sum-iv",
    title: "Combination Sum IV",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Ordered sequences that sum to a target: ways[t] = sum of ways[t - x] over the numbers x.",
    prompt: [
      "Given distinct positive integers and a target, return the number of ordered sequences (with repetition) that sum to the target. `[1, 2, 1]` and `[1, 1, 2]` count separately.",
      "",
      "```",
      "combinationSum4([1, 2, 3], 4)  ->  7",
      "combinationSum4([9], 3)        ->  0",
      "```",
    ].join("\n"),
    hints: [
      "ways[0] = 1. For each total t from 1 to target, ways[t] is the sum of ways[t - x] for every number x <= t.",
      "Amounts outer, numbers inner counts ordered sequences; the opposite order counts unordered combinations.",
    ],
    solution: [
      "## Approach",
      "",
      "A one-dimensional table over totals. The last element of a sequence summing to `t` is some `x`, and the rest sums to `t - x`, so `ways[t] = Σ ways[t - x]`. Climbing Stairs is this with `[1, 2]`.",
      "",
      "## Complexity",
      "",
      "O(target × n) time, O(target) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The loop order is the whole question: it decides whether `[1, 2]` and `[2, 1]` are counted once or twice.",
      "- With negative numbers the count can be infinite; the follow-up asks what constraint would make it finite (a sequence-length cap).",
    ].join("\n"),
    judge: {
      solutionCode: `function combinationSum4(nums, target) {
  const ways = new Array(target + 1).fill(0);
  ways[0] = 1;
  for (let t = 1; t <= target; t++) {
    for (const x of nums) if (x <= t) ways[t] += ways[t - x];
  }
  return ways[target];
}
`,
      starterCode: `/**
 * @param {number[]} nums distinct positive integers
 * @param {number} target
 * @returns {number} ordered sequences summing to target
 */
function combinationSum4(nums, target) {
  // Your code here
  return 0;
}
`,
      entry: "combinationSum4",
      tests: [
        { name: "Prompt example", input: [[1, 2, 3], 4], expected: 7 },
        { name: "Unreachable", input: [[9], 3], expected: 0 },
        { name: "Ones and twos", input: [[1, 2], 5], expected: 8 },
        { name: "Three numbers", input: [[2, 3, 5], 8], expected: 6 },
        { name: "Zero target", input: [[1, 2], 0], expected: 1 },
      ],
    },
  },
  {
    slug: "house-robber",
    title: "House Robber",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Take this house plus the best from two back, or skip it and keep the best from one back.",
    prompt: [
      "Each house on a street holds some money, and robbing two adjacent houses trips the alarm. Return the most you can take without ever robbing two neighbours.",
      "",
      "```",
      "rob([1, 2, 3, 1])     ->  4     // houses 1 and 3",
      "rob([2, 7, 9, 3, 1])  ->  12    // houses 1, 3 and 5",
      "```",
    ].join("\n"),
    hints: [
      "best(i) = max(best(i-1), best(i-2) + money[i]).",
      "Two running variables hold best(i-1) and best(i-2); no array needed.",
    ],
    solution: [
      "## Approach",
      "",
      "For each house, the best total through it is either the best without it (previous total) or its money plus the best total two houses back. Roll two variables forward.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The circular street (House Robber II) runs this twice, once without the first house and once without the last.",
      "- The tree version (House Robber III) returns two values per node: best with and without the node.",
    ].join("\n"),
    judge: {
      solutionCode: `function rob(nums) {
  let withPrev = 0;
  let withoutPrev = 0;
  for (const money of nums) {
    const take = withoutPrev + money;
    withoutPrev = Math.max(withoutPrev, withPrev);
    withPrev = take;
  }
  return Math.max(withPrev, withoutPrev);
}
`,
      starterCode: `/**
 * @param {number[]} nums money in each house
 * @returns {number} the most that can be taken without robbing neighbours
 */
function rob(nums) {
  // Your code here
  return 0;
}
`,
      entry: "rob",
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 1]], expected: 4 },
        { name: "Skip two", input: [[2, 7, 9, 3, 1]], expected: 12 },
        { name: "Ends win", input: [[2, 1, 1, 2]], expected: 4 },
        { name: "Empty street", input: [[]], expected: 0 },
        { name: "One house", input: [[5]], expected: 5 },
      ],
    },
  },
];
