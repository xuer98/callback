import type { Problem } from "./types";

// Snowflake coding bank, part M: Dutch-flag sorting behind an API. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-e.ts.

export const snowflakeProblemsM: Problem[] = [
  {
    slug: "sort-colors-with-api",
    title: "Sort Colours Through an API",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Dutch national flag with three pointers, using only getColor and swap — one pass, no counting.",
    prompt: [
      "An array of `n` colours (`0`, `1`, `2`) is hidden behind an API: `api.getColor(i)` returns the colour at index `i`, and `api.swap(i, j)` exchanges two positions. Sort the array in place so that all `0`s come first, then `1`s, then `2`s, using only those two calls, in one pass and without counting first.",
      "",
      "```",
      "hidden [2, 0, 2, 1, 1, 0]  ->  after sortColors(6, api): [0, 0, 1, 1, 2, 2]",
      "```",
      "",
      "The grader reads the array back afterwards and fails a run that reads more than `2n` colours.",
    ].join("\n"),
    hints: [
      "Three regions: 0s before `low`, 2s after `high`, unknown between `mid` and `high`. Inspect mid: a 0 swaps to low and both advance; a 2 swaps to high and only high shrinks; a 1 just advances mid.",
      "Do not advance mid after swapping with high — the value that arrived is still unknown.",
    ],
    solution: [
      "## Approach",
      "",
      "The Dutch national flag partition. Maintain `low`, `mid` and `high` so that everything before `low` is 0, everything after `high` is 2 and the stretch from `mid` to `high` is unread. Read `mid`: on 0 swap with `low` and advance both; on 2 swap with `high` and decrement `high` only, because the swapped-in value has not been read; on 1 advance `mid`. Each step either advances `mid` or shrinks `high`, so the pass reads at most `n` colours.",
      "",
      "## Complexity",
      "",
      "O(n) time with at most n reads and n swaps; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Counting sort — count the three colours, then write them back — is two passes and needs a write primitive the API lacks; the swap-only interface is what forces the three-pointer version.",
      "- The off-by-one everyone hits is re-reading after a swap with `high`; say it before the interviewer asks.",
    ].join("\n"),
    judge: {
      solutionCode: `// Dutch national flag: 0s before low, 2s after high, unread between mid and high.
function sortColors(n, api) {
  let low = 0;
  let mid = 0;
  let high = n - 1;
  while (mid <= high) {
    const colour = api.getColor(mid);
    if (colour === 0) {
      api.swap(low++, mid++);
    } else if (colour === 2) {
      api.swap(mid, high--);          // the swapped-in value is still unread
    } else {
      mid++;
    }
  }
}
`,
      starterCode: `/**
 * @param {number} n the array length
 * @param {{ getColor(i: number): number, swap(i: number, j: number): void }} api the only access to the array
 */
function sortColors(n, api) {
  // Your code here
}
`,
      entry: "__judgeSortColors",
      driverCode: `function __judgeSortColors(colors) {
  const data = colors.slice();
  let reads = 0;
  const api = {
    getColor(i) {
      reads++;
      return data[i];
    },
    swap(i, j) {
      [data[i], data[j]] = [data[j], data[i]];
    },
  };
  sortColors(data.length, api);
  if (reads > 2 * data.length) return "too many reads (" + reads + ")";
  return data;
}`,
      tests: [
        { name: "Prompt example", input: [[2, 0, 2, 1, 1, 0]], expected: [0, 0, 1, 1, 2, 2] },
        { name: "One of each", input: [[2, 0, 1]], expected: [0, 1, 2] },
        { name: "Empty", input: [[]], expected: [] },
        { name: "One element", input: [[1]], expected: [1] },
        { name: "All the same", input: [[0, 0, 0]], expected: [0, 0, 0] },
        { name: "Reversed", input: [[2, 2, 1, 1, 0, 0]], expected: [0, 0, 1, 1, 2, 2] },
        { name: "No zeros", input: [[2, 1, 2, 1]], expected: [1, 1, 2, 2] },
      ],
    },
  },
];
