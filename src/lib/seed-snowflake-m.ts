import type { Problem } from "./types";

// Snowflake coding bank, part M: short classics — merging two sorted lists,
// happy numbers, Dutch-flag sorting behind an API, and tax brackets. Judged
// in JavaScript and Python; the Python judges live in
// seed-python-snowflake-e.ts.

export const snowflakeProblemsM: Problem[] = [
  {
    slug: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Two pointers, always take the smaller head, then append whatever is left.",
    prompt: [
      "Merge two sorted arrays of integers into one sorted array, keeping duplicates.",
      "",
      "```",
      "mergeSorted([1, 2, 4], [1, 3, 4])  ->  [1, 1, 2, 3, 4, 4]",
      "```",
    ].join("\n"),
    hints: ["One index per input; push the smaller head and advance that index; when one input runs out, append the rest of the other."],
    solution: [
      "## Approach",
      "",
      "The merge step of merge sort: compare the two heads, take the smaller (the left one on ties, for stability), and when one array is exhausted append the remainder of the other in one go.",
      "",
      "## Complexity",
      "",
      "O(m + n) time and output.",
      "",
      "## Worth saying out loud",
      "",
      "- With linked lists, relink nodes behind a dummy head instead of copying; the pointer logic is identical.",
      "- Many lists at once is [Merge K Sorted Lists](/problems/merge-k-sorted-lists).",
    ].join("\n"),
    judge: {
      solutionCode: `function mergeSorted(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
  return out.concat(a.slice(i), b.slice(j));
}
`,
      starterCode: `/**
 * @param {number[]} a sorted
 * @param {number[]} b sorted
 * @returns {number[]} every value of both, sorted
 */
function mergeSorted(a, b) {
  // Your code here
  return [];
}
`,
      entry: "mergeSorted",
      tests: [
        {
          name: "Prompt example",
          input: [
            [1, 2, 4],
            [1, 3, 4],
          ],
          expected: [1, 1, 2, 3, 4, 4],
        },
        { name: "Both empty", input: [[], []], expected: [] },
        { name: "One empty", input: [[], [0]], expected: [0] },
        {
          name: "No interleaving",
          input: [
            [1, 2],
            [3, 4],
          ],
          expected: [1, 2, 3, 4],
        },
        {
          name: "Negatives",
          input: [
            [-5, -1],
            [-3, 0, 2],
          ],
          expected: [-5, -3, -1, 0, 2],
        },
      ],
    },
  },
  {
    slug: "happy-number",
    title: "Happy Number",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Repeat the digit-square sum; it either reaches 1 or loops, and a set (or Floyd's two pointers) catches the loop.",
    prompt: [
      "Replace a positive integer by the sum of the squares of its digits and repeat. If the process reaches `1` the number is happy; otherwise it loops forever. Return whether `n` is happy.",
      "",
      "```",
      "isHappy(19)  ->  true     // 82, 68, 100, 1",
      "isHappy(2)   ->  false",
      "```",
    ].join("\n"),
    hints: [
      "Keep a set of values seen; stop at 1 (happy) or on a repeat (not happy).",
      "Floyd's cycle detection — a slow and a fast pointer over the sequence — does it in O(1) space.",
    ],
    solution: [
      "## Approach",
      "",
      "Iterate the digit-square map. Every value past the first step is small (at most 9² × digits), so the sequence must either hit 1 or repeat; a set of seen values detects the repeat. Floyd's two-pointer walk gives the same answer without the set: advance one pointer by one step and the other by two until they meet, then check whether the meeting value is 1.",
      "",
      "## Complexity",
      "",
      "O(log n) per step, a bounded number of steps; O(1) space with Floyd.",
      "",
      "## Worth saying out loud",
      "",
      "- Unhappy numbers all fall into the cycle through 4, so `while (n !== 1 && n !== 4)` is a valid shortcut once you have said why.",
    ].join("\n"),
    judge: {
      solutionCode: `// Floyd's cycle detection over the digit-square sequence.
function isHappy(n) {
  const step = (x) => {
    let sum = 0;
    while (x > 0) {
      const d = x % 10;
      sum += d * d;
      x = Math.floor(x / 10);
    }
    return sum;
  };
  let slow = n;
  let fast = step(n);
  while (fast !== 1 && slow !== fast) {
    slow = step(slow);
    fast = step(step(fast));
  }
  return fast === 1;
}
`,
      starterCode: `/**
 * @param {number} n a positive integer
 * @returns {boolean}
 */
function isHappy(n) {
  // Your code here
  return false;
}
`,
      entry: "isHappy",
      tests: [
        { name: "19 is happy", input: [19], expected: true },
        { name: "2 is not", input: [2], expected: false },
        { name: "1 is happy", input: [1], expected: true },
        { name: "7 is happy", input: [7], expected: true },
        { name: "4 starts the unhappy cycle", input: [4], expected: false },
        { name: "A large happy number", input: [1000000], expected: true },
      ],
    },
  },
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
  {
    slug: "amount-paid-in-taxes",
    title: "Amount Paid in Taxes",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Walk the brackets in order, taxing only the slice of income that falls inside each one.",
    prompt: [
      "Tax brackets are `[upper, percent]` pairs sorted by `upper`: the first bracket covers income from 0 to its upper bound, the next covers from the previous upper bound to its own, and so on. Each slice of income is taxed at its bracket's percentage. Return the total tax on `income`.",
      "",
      "```",
      "calculateTax([[3, 50], [7, 10], [12, 25]], 10)  ->  2.65     // 3 × 50% + 4 × 10% + 3 × 25%",
      "```",
      "",
      "The grader rounds your answer to five decimal places.",
    ].join("\n"),
    hints: ["Keep the previous upper bound. For each bracket, the taxable slice is min(income, upper) − previous, as long as it is positive."],
    solution: [
      "## Approach",
      "",
      "One pass over the brackets with the previous bound in hand: the slice taxed by a bracket is `min(income, upper) − previous`, stopping once the income is exhausted. Multiply each slice by its rate and sum.",
      "",
      "## Complexity",
      "",
      "O(brackets) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Money and floating point: in production use integer cents or a decimal type; here the grader rounds.",
    ].join("\n"),
    judge: {
      solutionCode: `function calculateTax(brackets, income) {
  let tax = 0;
  let previous = 0;
  for (const [upper, percent] of brackets) {
    if (income <= previous) break;
    tax += (Math.min(income, upper) - previous) * percent / 100;
    previous = upper;
  }
  return tax;
}
`,
      starterCode: `/**
 * @param {number[][]} brackets [upper, percent], sorted by upper
 * @param {number} income
 * @returns {number} the total tax
 */
function calculateTax(brackets, income) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeTax",
      driverCode: `function __judgeTax(brackets, income) {
  return Math.round(calculateTax(brackets, income) * 1e5) / 1e5;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [3, 50],
              [7, 10],
              [12, 25],
            ],
            10,
          ],
          expected: 2.65,
        },
        {
          name: "Income ends inside the second bracket",
          input: [
            [
              [1, 0],
              [4, 25],
              [5, 50],
            ],
            2,
          ],
          expected: 0.25,
        },
        { name: "No income", input: [[[2, 50]], 0], expected: 0 },
        { name: "Everything in one bracket", input: [[[1, 100]], 1], expected: 1 },
        { name: "Half a bracket", input: [[[10, 10]], 5], expected: 0.5 },
      ],
    },
  },
];
