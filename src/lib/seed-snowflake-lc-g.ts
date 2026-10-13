import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part G: arithmetic and dynamic
// programming over arrays — painting walls with a free painter, server
// upgrades funded by sales, pair removals, fence colourings, patching a
// subset-sum range, and the closest pair across two arrays. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-j.ts.

export const snowflakeLcProblemsG: Problem[] = [
  {
    slug: "painting-the-walls",
    title: "Painting the Walls",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Paying for a wall buys time[i] free walls too, so it is a knapsack where each paid wall covers time[i] + 1 walls.",
    prompt: [
      "There are `n` walls. A paid painter paints wall `i` in `time[i]` units for `cost[i]`. A free painter paints any wall in 1 unit at no cost, but only while the paid painter is busy. Return the minimum cost to paint every wall.",
      "",
      "```",
      "paintWalls([1, 2, 3, 2], [1, 2, 3, 2])  ->  3",
      "paintWalls([2, 3, 4, 2], [1, 1, 1, 1])  ->  4",
      "```",
    ].join("\n"),
    hints: [
      "While the paid painter spends time[i] on wall i, the free painter finishes time[i] other walls, so paying for wall i covers time[i] + 1 walls in total.",
      "dp[j] = cheapest way to cover at least j walls; for each wall, dp[j] = min(dp[j], dp[max(0, j − time[i] − 1)] + cost[i]).",
    ],
    solution: [
      "## Approach",
      "",
      "Choosing which walls to pay for decides everything: the paid walls take `Σ time` units, during which the free painter handles that many other walls, so the chosen set must satisfy `Σ (time[i] + 1) ≥ n`. That is a knapsack: `dp[j]` is the minimum cost to cover at least `j` walls, updated for each wall by `dp[j] = min(dp[j], dp[max(0, j − time[i] − 1)] + cost[i])`, iterating `j` downward so each wall is used once. The answer is `dp[n]`.",
      "",
      "## Complexity",
      "",
      "O(n²) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The reformulation \"a paid wall covers time + 1 walls\" is the whole problem; without it the free painter's schedule looks like a simulation.",
      "- Clamping the index at 0 is what makes \"at least j\" work when a wall covers more than needed.",
    ].join("\n"),
    judge: {
      solutionCode: `// Knapsack: paying for wall i covers time[i] + 1 walls.
function paintWalls(cost, time) {
  const n = cost.length;
  const dp = Array(n + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 0; i < n; i++) {
    for (let j = n; j >= 1; j--) {
      const from = Math.max(0, j - time[i] - 1);
      dp[j] = Math.min(dp[j], dp[from] + cost[i]);
    }
  }
  return dp[n];
}
`,
      starterCode: `/**
 * @param {number[]} cost paid painter's price per wall
 * @param {number[]} time paid painter's time per wall
 * @returns {number} the minimum cost to paint every wall
 */
function paintWalls(cost, time) {
  // Your code here
  return 0;
}
`,
      entry: "paintWalls",
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 2], [1, 2, 3, 2]], expected: 3 },
        { name: "All walls take one unit", input: [[2, 3, 4, 2], [1, 1, 1, 1]], expected: 4 },
        { name: "A single wall", input: [[5], [1]], expected: 5 },
        { name: "One paid wall frees the other", input: [[1, 1], [1, 1]], expected: 1 },
        { name: "A slow cheap wall covers everything", input: [[10, 1], [1, 5]], expected: 1 },
        { name: "Two paid walls needed", input: [[1, 2, 3], [1, 1, 1]], expected: 3 },
      ],
    },
  },
  {
    slug: "max-upgradable-servers",
    title: "Maximum Number of Upgradable Servers",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Selling s servers funds the upgrades of the rest: solve k × upgrade ≤ money + (count − k) × sell for the largest k.",
    prompt: [
      "Each data centre `i` has `count[i]` servers, `money[i]` in cash, an upgrade price `upgrade[i]` per server and a sale price `sell[i]` per server. You may sell any number of its servers to raise cash; a sold server cannot be upgraded. Return, for each data centre independently, the maximum number of servers that can be upgraded.",
      "",
      "```",
      "maxUpgrades([4, 3], [2, 1], [4, 3], [8, 5])  ->  [4, 3]",
      "maxUpgrades([5, 2], [10, 100], [1, 1], [7, 0])  ->  [1, 0]",
      "```",
    ].join("\n"),
    hints: [
      "Upgrading k servers and selling the other count − k is feasible when k × upgrade ≤ money + (count − k) × sell.",
      "Rearrange for k: k ≤ (money + count × sell) / (upgrade + sell), rounded down and capped at count. Binary search on k is the same answer without the algebra.",
    ],
    solution: [
      "## Approach",
      "",
      "If `k` servers are upgraded, the most cash available comes from selling every other server, so feasibility is `k × upgrade ≤ money + (count − k) × sell`. Solving gives `k ≤ (money + count × sell) / (upgrade + sell)`; take the floor and cap it at `count`. Each data centre is independent, so it is one formula per entry.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) output.",
      "",
      "## Worth saying out loud",
      "",
      "- Monotonicity (if k is feasible, so is k − 1) is why a binary search also works and why the closed form is safe.",
      "- Watch for overflow in `count × sell` in fixed-width languages before dividing.",
    ].join("\n"),
    judge: {
      solutionCode: `function maxUpgrades(count, upgrade, sell, money) {
  return count.map((c, i) => Math.min(c, Math.floor((money[i] + c * sell[i]) / (upgrade[i] + sell[i]))));
}
`,
      starterCode: `/**
 * @param {number[]} count servers per data centre
 * @param {number[]} upgrade upgrade price per server
 * @param {number[]} sell sale price per server
 * @param {number[]} money cash per data centre
 * @returns {number[]} the most servers each data centre can upgrade
 */
function maxUpgrades(count, upgrade, sell, money) {
  // Your code here
  return [];
}
`,
      entry: "maxUpgrades",
      tests: [
        { name: "Prompt example", input: [[4, 3], [2, 1], [4, 3], [8, 5]], expected: [4, 3] },
        { name: "Expensive upgrades", input: [[5, 2], [10, 100], [1, 1], [7, 0]], expected: [1, 0] },
        { name: "Selling is worthless", input: [[3], [1], [0], [2]], expected: [2] },
        { name: "The only server cannot fund itself", input: [[1], [5], [10], [0]], expected: [0] },
        { name: "Sales fund most of the fleet", input: [[6], [3], [2], [7]], expected: [3] },
      ],
    },
  },
  {
    slug: "min-array-length-after-pair-removals",
    title: "Minimum Array Length After Pair Removals",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "The most frequent value is the only obstacle: answer = max(2 × maxFreq − n, n mod 2).",
    prompt: [
      "`nums` is sorted. Any number of times, pick indices `i < j` with `nums[i] < nums[j]` and remove both elements. Return the minimum length the array can reach.",
      "",
      "```",
      "minLengthAfterRemovals([1, 3, 4, 9])  ->  0",
      "minLengthAfterRemovals([1, 1, 2])     ->  1",
      "minLengthAfterRemovals([1, 1, 1, 1])  ->  4",
      "```",
    ].join("\n"),
    hints: [
      "A pair must have two different values, so copies of the same value never pair with each other. If a value appears more than half the time, its surplus copies remain.",
      "Otherwise everything pairs off except one element when n is odd: answer = max(2 × maxFreq − n, n mod 2).",
    ],
    solution: [
      "## Approach",
      "",
      "Count the most frequent value. Elements of other values can always be paired with copies of it (and with each other) — pairing the first half of the sorted array against the second half shows how — so the only leftovers are the copies of the dominant value that outnumber everything else, `2 × maxFreq − n` when positive, and otherwise one element when the length is odd.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space on a sorted array (the longest run is the maximum frequency).",
      "",
      "## Worth saying out loud",
      "",
      "- The constructive argument — pair index i with index i + n/2 — is what proves the formula; mention it rather than just stating the answer.",
      "- The greedy simulation with a heap of counts gives the same result in O(n log n) and is the safe fallback if the formula does not come to mind.",
    ].join("\n"),
    judge: {
      solutionCode: `function minLengthAfterRemovals(nums) {
  const n = nums.length;
  let maxFreq = 0;
  for (let i = 0; i < n; ) {
    let j = i;
    while (j < n && nums[j] === nums[i]) j++;
    maxFreq = Math.max(maxFreq, j - i);
    i = j;
  }
  return Math.max(2 * maxFreq - n, n % 2);
}
`,
      starterCode: `/**
 * @param {number[]} nums sorted
 * @returns {number} the smallest reachable length
 */
function minLengthAfterRemovals(nums) {
  // Your code here
  return 0;
}
`,
      entry: "minLengthAfterRemovals",
      tests: [
        { name: "All distinct, even length", input: [[1, 3, 4, 9]], expected: 0 },
        { name: "Odd length", input: [[1, 1, 2]], expected: 1 },
        { name: "All equal", input: [[1, 1, 1, 1]], expected: 4 },
        { name: "Exactly half equal", input: [[1, 1, 1, 2, 2, 3]], expected: 0 },
        { name: "A single element", input: [[1]], expected: 1 },
        { name: "A dominant value", input: [[1, 1, 1, 2]], expected: 2 },
      ],
    },
  },
  {
    slug: "paint-fence",
    title: "Paint Fence",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Track colourings whose last two posts match and those whose last two differ; no three in a row may match.",
    prompt: [
      "Paint `n` fence posts with `k` colours so that no three **consecutive** posts share a colour. Return the number of valid colourings.",
      "",
      "```",
      "numWays(3, 2)  ->  6",
      "numWays(1, 1)  ->  1",
      "numWays(7, 2)  ->  42",
      "```",
    ].join("\n"),
    hints: [
      "Split the count by whether the last two posts match. A post that differs from its predecessor can follow anything in k − 1 ways; a post that matches can only follow a differing pair.",
      "same[i] = diff[i − 1]; diff[i] = (same[i − 1] + diff[i − 1]) × (k − 1).",
    ],
    solution: [
      "## Approach",
      "",
      "Two running counts: colourings of the first `i` posts whose last two posts are the same colour, and those whose last two differ. A new post painted differently from its predecessor extends any colouring in `k − 1` ways; a new post painted the same as its predecessor is only allowed after a differing pair, so `same` becomes the old `diff`. Start with one post (`k` ways, counted as `diff`) and iterate.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The constraint is about three in a row, not two, which is why the state needs the last two posts and not just the last colour.",
      "- The recurrence collapses to total[i] = (k − 1) × (total[i − 1] + total[i − 2]), a Fibonacci-like form.",
    ].join("\n"),
    judge: {
      solutionCode: `function numWays(n, k) {
  if (n === 0) return 0;
  let same = 0;
  let diff = k;
  for (let i = 2; i <= n; i++) {
    const nextSame = diff;
    const nextDiff = (same + diff) * (k - 1);
    same = nextSame;
    diff = nextDiff;
  }
  return same + diff;
}
`,
      starterCode: `/**
 * @param {number} n posts
 * @param {number} k colours
 * @returns {number} colourings with no three consecutive posts alike
 */
function numWays(n, k) {
  // Your code here
  return 0;
}
`,
      entry: "numWays",
      tests: [
        { name: "Prompt example", input: [3, 2], expected: 6 },
        { name: "One post, one colour", input: [1, 1], expected: 1 },
        { name: "Seven posts, two colours", input: [7, 2], expected: 42 },
        { name: "Two posts", input: [2, 3], expected: 9 },
        { name: "One post, many colours", input: [1, 5], expected: 5 },
        { name: "Four posts, three colours", input: [4, 3], expected: 66 },
      ],
    },
  },
  {
    slug: "patching-array",
    title: "Patching Array",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "If every number below `miss` is a subset sum, the next array element ≤ miss extends the range for free; otherwise patch with `miss` itself.",
    prompt: [
      "Given a sorted array of positive integers and a limit `n`, add (patch) the fewest numbers so that every integer from `1` to `n` is the sum of some subset of the array. Return the number of patches.",
      "",
      "```",
      "minPatches([1, 3], 6)       ->  1    // add 2",
      "minPatches([1, 5, 10], 20)  ->  2    // add 2 and 4",
      "minPatches([1, 2, 2], 5)    ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Let `miss` be the smallest sum not yet reachable; every sum below it is. Taking an element `x ≤ miss` makes every sum below `miss + x` reachable.",
      "If the next element is larger than `miss` (or the array is exhausted), the best patch is `miss` itself, which doubles the covered range.",
    ],
    solution: [
      "## Approach",
      "",
      "Maintain `miss`, the smallest value that cannot yet be formed; everything below it can. Walk the array: an element no larger than `miss` is absorbed and raises `miss` by its value. Otherwise there is a gap, and the most useful patch is `miss` itself, which raises the frontier to `2 × miss` — no smaller patch does better, and a larger one would leave `miss` uncovered. Stop when `miss` exceeds `n`.",
      "",
      "## Complexity",
      "",
      "O(m + log n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The invariant \"all sums below miss are reachable\" is the proof; state it before writing the loop.",
      "- `miss` can exceed 32-bit range when n is near 2³¹; use a wide integer type in languages that overflow.",
    ].join("\n"),
    judge: {
      solutionCode: `function minPatches(nums, n) {
  let miss = 1;
  let patches = 0;
  let i = 0;
  while (miss <= n) {
    if (i < nums.length && nums[i] <= miss) {
      miss += nums[i++];
    } else {
      miss += miss;
      patches++;
    }
  }
  return patches;
}
`,
      starterCode: `/**
 * @param {number[]} nums sorted positive integers
 * @param {number} n the range to cover, 1..n
 * @returns {number} the fewest patches
 */
function minPatches(nums, n) {
  // Your code here
  return 0;
}
`,
      entry: "minPatches",
      tests: [
        { name: "Prompt example", input: [[1, 3], 6], expected: 1 },
        { name: "Two patches", input: [[1, 5, 10], 20], expected: 2 },
        { name: "Already covered", input: [[1, 2, 2], 5], expected: 0 },
        { name: "Empty array", input: [[], 7], expected: 3 },
        { name: "Just one", input: [[1], 1], expected: 0 },
        { name: "Missing the number one", input: [[2], 1], expected: 1 },
      ],
    },
  },
  {
    slug: "min-absolute-difference-two-values",
    title: "Minimum Absolute Difference Between Two Values",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Sort both arrays and walk two pointers, always advancing the smaller head.",
    prompt: [
      "Given two non-empty integer arrays `a` and `b`, return the smallest `|a[i] - b[j]|` over all pairs of one value from each.",
      "",
      "```",
      "minAbsoluteDifference([1, 3, 15, 11, 2], [23, 127, 235, 19, 8])  ->  3    // 11 and 8",
      "minAbsoluteDifference([5], [5])                                  ->  0",
      "```",
    ].join("\n"),
    hints: ["Sort both. With a pointer into each, record the gap between the heads and advance the pointer whose head is smaller: moving the larger one could only widen the gap."],
    solution: [
      "## Approach",
      "",
      "Sort both arrays and merge-walk them. At each step the two heads are candidates; record their difference, then advance the smaller head, because the larger one paired with anything later on the other side is farther away. Stop when either array is exhausted. The best difference seen is the answer.",
      "",
      "## Complexity",
      "",
      "O(n log n + m log m) time; O(1) extra space beyond the sorts.",
      "",
      "## Worth saying out loud",
      "",
      "- Binary-searching each element of the smaller array in the sorted larger one is the alternative when one side is much bigger.",
      "- The within-one-array version (minimum difference between any two elements) is sort plus adjacent differences.",
    ].join("\n"),
    judge: {
      solutionCode: `function minAbsoluteDifference(a, b) {
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  let i = 0;
  let j = 0;
  let best = Infinity;
  while (i < x.length && j < y.length) {
    best = Math.min(best, Math.abs(x[i] - y[j]));
    if (x[i] < y[j]) i++;
    else j++;
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[]} a non-empty
 * @param {number[]} b non-empty
 * @returns {number} the smallest |a[i] - b[j]|
 */
function minAbsoluteDifference(a, b) {
  // Your code here
  return 0;
}
`,
      entry: "minAbsoluteDifference",
      tests: [
        { name: "Prompt example", input: [[1, 3, 15, 11, 2], [23, 127, 235, 19, 8]], expected: 3 },
        { name: "Equal values", input: [[5], [5]], expected: 0 },
        { name: "Disjoint ranges", input: [[1, 2, 3], [10, 20]], expected: 7 },
        { name: "Negatives", input: [[-5, 0], [-7, 4]], expected: 2 },
        { name: "One against many", input: [[100], [1, 50, 99]], expected: 1 },
      ],
    },
  },
];
