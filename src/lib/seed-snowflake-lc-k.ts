import type { Problem } from "./types";

// Snowflake coding bank, part K of the custom prompts: document coverage
// (the minimum window) and the best query type for a time budget; part P
// continues them. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-l.ts.

export const snowflakeLcProblemsK: Problem[] = [
  {
    slug: "document-coverage-window",
    title: "Document Coverage: The Shortest Window",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Minimum window over tokens: expand until every term is covered, shrink while it stays covered, keep the shortest.",
    prompt: [
      "A document is a list of words and a query is a set of distinct terms. Return the shortest contiguous span of the document that contains every term at least once, as `[start, end]` indices (inclusive). If several spans are shortest, return the one that starts first; if no span covers the query, return `[]`.",
      "",
      "```",
      "shortestCoverage([\"a\", \"b\", \"c\", \"a\", \"d\", \"b\", \"c\"], [\"a\", \"b\", \"c\"])  ->  [0, 2]",
      "shortestCoverage([\"x\", \"a\", \"y\", \"b\", \"z\", \"c\", \"a\", \"b\", \"c\"], [\"a\", \"b\", \"c\"])  ->  [5, 7]",
      "shortestCoverage([\"a\", \"b\"], [\"c\"])  ->  []",
      "```",
    ].join("\n"),
    hints: [
      "Sliding window with a count per term and the number of terms currently satisfied. Advance the right end; whenever every term is satisfied, advance the left end as far as it can go without losing a term.",
      "Record a window only when it is strictly shorter than the best so far — that is what makes ties resolve to the earliest start.",
    ],
    solution: [
      "## Approach",
      "",
      "The minimum window pattern over words instead of characters. Keep a map from term to how many more occurrences the window needs, and a counter of terms still missing. Move the right end rightwards; when the missing counter hits zero, move the left end rightwards while the window still covers everything, recording the window whenever it is shorter than the best found. Because the right end only grows, the first window of the minimal length found has the smallest start.",
      "",
      "## Complexity",
      "",
      "O(words + terms) time; O(terms) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Decrementing a need below zero is fine and expected; the `missing` counter only moves at the zero boundary.",
      "- Streaming input: the same window state works token by token, but \"shortest overall\" needs the whole stream — say what you would report incrementally.",
    ].join("\n"),
    judge: {
      solutionCode: `function shortestCoverage(words, terms) {
  const need = new Map();
  for (const t of terms) need.set(t, 1);
  let missing = need.size;
  let best = [];
  let left = 0;
  for (let right = 0; right < words.length; right++) {
    const w = words[right];
    if (need.has(w)) {
      need.set(w, need.get(w) - 1);
      if (need.get(w) === 0) missing--;
    }
    while (missing === 0) {
      if (best.length === 0 || right - left < best[1] - best[0]) best = [left, right];
      const out = words[left++];
      if (need.has(out)) {
        need.set(out, need.get(out) + 1);
        if (need.get(out) === 1) missing++;
      }
    }
  }
  return best;
}
`,
      starterCode: `/**
 * @param {string[]} words the document
 * @param {string[]} terms distinct required terms
 * @returns {number[]} [start, end] of the shortest covering span, or []
 */
function shortestCoverage(words, terms) {
  // Your code here
  return [];
}
`,
      entry: "shortestCoverage",
      tests: [
        { name: "Prompt example", input: [["a", "b", "c", "a", "d", "b", "c"], ["a", "b", "c"]], expected: [0, 2] },
        { name: "The earlier of two shortest spans near the end", input: [["x", "a", "y", "b", "z", "c", "a", "b", "c"], ["a", "b", "c"]], expected: [5, 7] },
        { name: "No coverage", input: [["a", "b"], ["c"]], expected: [] },
        { name: "One word", input: [["a"], ["a"]], expected: [0, 0] },
        { name: "Earliest of equal lengths", input: [["b", "a", "a", "c", "b", "c"], ["a", "b"]], expected: [0, 1] },
        { name: "Ties resolve to the first start", input: [["a", "b", "c", "b", "a"], ["a", "c"]], expected: [0, 2] },
      ],
    },
  },
  {
    slug: "max-revenue-query-type",
    title: "Pick the Query Type That Maximises Revenue",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Committing to one type, you run it floor(k / duration) times; score every type and keep the best, earliest on ties.",
    prompt: [
      "Each query type `i` takes `durations[i]` minutes and earns `revenues[i]` when it completes. You must commit to **one** type and run it back to back for `k` minutes; a run that does not finish inside the budget earns nothing. Return the index of the type with the highest total revenue, the smallest index on ties, or `-1` if no type can complete even once.",
      "",
      "```",
      "bestQueryType([3, 5, 2], [10, 20, 5], 10)  ->  1    // 2 runs × 20 = 40",
      "bestQueryType([4, 4], [7, 7], 8)           ->  0    // tie, lowest index",
      "bestQueryType([10], [100], 5)              ->  -1",
      "```",
    ].join("\n"),
    hints: ["Score type i as floor(k / durations[i]) × revenues[i]; keep the first index that attains the maximum, and require that maximum to be positive."],
    solution: [
      "## Approach",
      "",
      "One pass. The number of completed runs is the integer quotient of the budget by the duration, so each type's revenue is that quotient times its payout. Track the best score and the first index achieving it; a best of zero means nothing completed, which is the `-1` case.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- State the model before coding: back-to-back runs of one type, no partial credit, strict ties to the lowest index.",
      "- If types could be mixed, this becomes an unbounded knapsack over minutes — the natural follow-up.",
    ].join("\n"),
    judge: {
      solutionCode: `function bestQueryType(durations, revenues, k) {
  let best = 0;
  let index = -1;
  for (let i = 0; i < durations.length; i++) {
    const total = Math.floor(k / durations[i]) * revenues[i];
    if (total > best) {
      best = total;
      index = i;
    }
  }
  return index;
}
`,
      starterCode: `/**
 * @param {number[]} durations minutes per run
 * @param {number[]} revenues payout per completed run
 * @param {number} k minutes available
 * @returns {number} the best type's index, or -1
 */
function bestQueryType(durations, revenues, k) {
  // Your code here
  return -1;
}
`,
      entry: "bestQueryType",
      tests: [
        { name: "Prompt example", input: [[3, 5, 2], [10, 20, 5], 10], expected: 1 },
        { name: "A tie", input: [[4, 4], [7, 7], 8], expected: 0 },
        { name: "Nothing completes", input: [[10], [100], 5], expected: -1 },
        { name: "Fewer, richer runs win", input: [[1, 2], [1, 3], 4], expected: 1 },
        { name: "Close call", input: [[2, 3], [3, 5], 6], expected: 1 },
        { name: "Tie among several", input: [[5, 5, 5], [1, 2, 2], 5], expected: 1 },
      ],
    },
  },
];
