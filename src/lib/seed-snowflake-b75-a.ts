import type { Problem } from "./types";

// Blind 75 for the Snowflake backend screen, part A: the array group.
// JavaScript judges inline; Python in seed-python-snowflake-n.ts.

export const snowflakeBlindProblemsA: Problem[] = [
  {
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "A set of what you have seen — and the sort-first alternative when memory is the constraint.",
    prompt: [
      "Return `true` if any value appears at least twice in `nums`, and `false` if every value is distinct.",
      "",
      "```",
      "containsDuplicate([1, 2, 3, 1])  ->  true",
      "containsDuplicate([1, 2, 3, 4])  ->  false",
      "```",
    ].join("\n"),
    hints: [
      "Walk the array once, keeping a set of values seen so far; the first value already in the set answers the question.",
      "With no extra memory allowed, sort and compare neighbours.",
    ],
    solution: [
      "## Approach",
      "",
      "Insert each value into a set and stop as soon as an insert finds the value already there. Every value is touched once.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) space; the sort-and-scan alternative is O(n log n) time with O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- `new Set(nums).size !== nums.length` is the one-liner; the loop version stops early on the first duplicate.",
      "- A follow-up often asks for the duplicate itself, or for duplicates within distance k — the same set, trimmed as a sliding window.",
    ].join("\n"),
    judge: {
      solutionCode: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const value of nums) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}
`,
      starterCode: `/**
 * @param {number[]} nums
 * @returns {boolean}
 */
function containsDuplicate(nums) {
  // Your code here
  return false;
}
`,
      entry: "containsDuplicate",
      tests: [
        { name: "Prompt example", input: [[1, 2, 3, 1]], expected: true },
        { name: "All distinct", input: [[1, 2, 3, 4]], expected: false },
        { name: "Empty", input: [[]], expected: false },
        { name: "Many repeats", input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
        { name: "Negatives and zero", input: [[-1, 0, 1, 0]], expected: true },
      ],
    },
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Kadane's rule: extend the running sum, or start over whenever it would help.",
    prompt: [
      "Return the largest sum of any non-empty contiguous subarray of `nums`.",
      "",
      "```",
      "maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])  ->  6     // [4, -1, 2, 1]",
      "maxSubArray([-3, -1, -2])                     ->  -1",
      "```",
    ].join("\n"),
    hints: [
      "At each index, the best subarray ending there is either the value alone or the value plus the best subarray ending at the previous index.",
      "Keep two numbers: the best sum ending here, and the best seen anywhere.",
    ],
    solution: [
      "## Approach",
      "",
      "Kadane's algorithm. `current = max(value, current + value)` is the best sum of a subarray ending at this index; the answer is the largest `current` seen. A negative running sum never helps a later element, which is why starting over is right.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- All-negative input must return the largest single value, which the `max(value, ...)` form handles; initialising with 0 does not.",
      "- Divide and conquer gives O(n log n) and is the shape of the segment-tree follow-up (range queries over the same question).",
      "- Returning the subarray itself means recording where the current run started.",
    ].join("\n"),
    judge: {
      solutionCode: `function maxSubArray(nums) {
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[]} nums non-empty
 * @returns {number} the largest sum of a contiguous subarray
 */
function maxSubArray(nums) {
  // Your code here
  return 0;
}
`,
      entry: "maxSubArray",
      tests: [
        { name: "Prompt example", input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
        { name: "One element", input: [[1]], expected: 1 },
        { name: "Whole array", input: [[5, 4, -1, 7, 8]], expected: 23 },
        { name: "All negative", input: [[-3, -1, -2]], expected: -1 },
        { name: "Restart after a dip", input: [[2, -5, 3, 4]], expected: 7 },
      ],
    },
  },
  {
    slug: "maximum-product-subarray",
    title: "Maximum Product Subarray",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Carry the largest and the smallest product ending here — a negative flips which one is useful.",
    prompt: [
      "Return the largest product of any non-empty contiguous subarray of `nums`. Values are integers and may be negative or zero.",
      "",
      "```",
      "maxProduct([2, 3, -2, 4])  ->  6",
      "maxProduct([-2, 0, -1])    ->  0",
      "maxProduct([-2, 3, -4])    ->  24",
      "```",
    ].join("\n"),
    hints: [
      "Kadane's idea with a twist: a very negative product becomes the largest the moment the next value is negative.",
      "Track both the maximum and the minimum product ending at each index; the new candidates are the value, value × max, value × min.",
    ],
    solution: [
      "## Approach",
      "",
      "For each value, compute the largest and smallest products of a subarray ending there from the three candidates: the value alone, the value times the previous largest, the value times the previous smallest. Keep the best largest seen. A zero resets both to zero and the next value restarts cleanly.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Why the minimum matters: `[-2, 3, -4]` — the min after two elements is -6, and -6 × -4 is the answer.",
      "- The alternative is a prefix-product scan from both ends; it is shorter but harder to explain.",
    ].join("\n"),
    judge: {
      solutionCode: `function maxProduct(nums) {
  let best = nums[0];
  let high = nums[0];
  let low = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const value = nums[i];
    const candidates = [value, value * high, value * low];
    high = Math.max(...candidates);
    low = Math.min(...candidates);
    best = Math.max(best, high);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[]} nums non-empty integers
 * @returns {number} the largest product of a contiguous subarray
 */
function maxProduct(nums) {
  // Your code here
  return 0;
}
`,
      entry: "maxProduct",
      tests: [
        { name: "Prompt example", input: [[2, 3, -2, 4]], expected: 6 },
        { name: "A zero in the middle", input: [[-2, 0, -1]], expected: 0 },
        { name: "Two negatives", input: [[-2, 3, -4]], expected: 24 },
        { name: "Single negative", input: [[-2]], expected: -2 },
        { name: "Zero then positive", input: [[0, 2]], expected: 2 },
      ],
    },
  },
  {
    slug: "find-minimum-in-rotated-sorted-array",
    title: "Find Minimum in Rotated Sorted Array",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Binary search where the comparison is against the last element, not the target.",
    prompt: [
      "A sorted array of distinct integers was rotated some number of times (`[0,1,2,4,5,6,7]` could become `[4,5,6,7,0,1,2]`). Return its minimum in O(log n).",
      "",
      "```",
      "findMin([3, 4, 5, 1, 2])        ->  1",
      "findMin([4, 5, 6, 7, 0, 1, 2])  ->  0",
      "findMin([11, 13, 15, 17])       ->  11",
      "```",
    ].join("\n"),
    hints: [
      "Compare the middle element with the last one: if it is larger, the minimum is to the right; otherwise it is at the middle or to the left.",
      "Keep `hi` inclusive and move `hi = mid` (not `mid - 1`) when the middle could itself be the minimum.",
    ],
    solution: [
      "## Approach",
      "",
      "Binary search on the index. If `nums[mid] > nums[hi]`, the rotation point lies to the right, so `lo = mid + 1`; otherwise the minimum is `mid` or left of it, so `hi = mid`. The loop ends with `lo === hi` at the minimum.",
      "",
      "## Complexity",
      "",
      "O(log n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Comparing with `nums[lo]` instead fails on an unrotated array; the last element is the stable anchor.",
      "- With duplicates (the follow-up) `nums[mid] === nums[hi]` is ambiguous: shrink `hi` by one and accept O(n) worst case.",
    ].join("\n"),
    judge: {
      solutionCode: `function findMin(nums) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}
`,
      starterCode: `/**
 * @param {number[]} nums sorted, distinct, then rotated
 * @returns {number} the minimum value
 */
function findMin(nums) {
  // Your code here
  return 0;
}
`,
      entry: "findMin",
      tests: [
        { name: "Prompt example", input: [[3, 4, 5, 1, 2]], expected: 1 },
        { name: "Rotated four times", input: [[4, 5, 6, 7, 0, 1, 2]], expected: 0 },
        { name: "Not rotated", input: [[11, 13, 15, 17]], expected: 11 },
        { name: "Two elements", input: [[2, 1]], expected: 1 },
        { name: "One element", input: [[1]], expected: 1 },
      ],
    },
  },
  {
    slug: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "One half of any split is sorted; decide whether the target lives in that half and discard the other.",
    prompt: [
      "A sorted array of distinct integers was rotated at an unknown index. Return the index of `target`, or -1 if it is absent, in O(log n).",
      "",
      "```",
      "search([4, 5, 6, 7, 0, 1, 2], 0)  ->  4",
      "search([4, 5, 6, 7, 0, 1, 2], 3)  ->  -1",
      "search([1], 0)                    ->  -1",
      "```",
    ].join("\n"),
    hints: [
      "Split at the middle: at least one side is sorted. Check whether the target falls inside the sorted side's range.",
      "If it does, search that side; if not, search the other. Each step halves the range.",
    ],
    solution: [
      "## Approach",
      "",
      "Binary search. If `nums[lo] <= nums[mid]` the left half is sorted: when the target is within `[nums[lo], nums[mid])` go left, otherwise right. Symmetric when the right half is sorted. Every step discards half the array, so the rotation never costs more than a comparison.",
      "",
      "## Complexity",
      "",
      "O(log n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Two binary searches (find the pivot, then search the right piece) also work and are easier to get right under pressure.",
      "- Duplicates break the sorted-half test; the follow-up degrades to O(n) when `nums[lo] === nums[mid] === nums[hi]`.",
    ].join("\n"),
    judge: {
      solutionCode: `function search(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else if (nums[mid] < target && target <= nums[hi]) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}
`,
      starterCode: `/**
 * @param {number[]} nums sorted, distinct, then rotated
 * @param {number} target
 * @returns {number} the index of target, or -1
 */
function search(nums, target) {
  // Your code here
  return -1;
}
`,
      entry: "search",
      tests: [
        { name: "Prompt example", input: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
        { name: "Absent", input: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
        { name: "One element, absent", input: [[1], 0], expected: -1 },
        { name: "Two elements", input: [[1, 3], 3], expected: 1 },
        { name: "Target in the right half", input: [[5, 1, 2, 3, 4], 1], expected: 1 },
        { name: "Not rotated", input: [[1, 2, 3, 4, 5], 5], expected: 4 },
      ],
    },
  },
  {
    slug: "three-sum",
    title: "3Sum",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Sort, fix one value, two-pointer the rest, and skip equal neighbours so no triplet repeats.",
    prompt: [
      "Return every unique triplet `[a, b, c]` of values from `nums` (three different positions) with `a + b + c === 0`. Order of triplets and order within a triplet do not matter.",
      "",
      "```",
      "threeSum([-1, 0, 1, 2, -1, -4])  ->  [[-1, -1, 2], [-1, 0, 1]]",
      "threeSum([0, 1, 1])              ->  []",
      "threeSum([0, 0, 0])              ->  [[0, 0, 0]]",
      "```",
    ].join("\n"),
    hints: [
      "Sort first. For each index i, find pairs in the suffix that sum to -nums[i] with two pointers moving inward.",
      "Duplicates: skip an i equal to the previous i, and after recording a triplet advance both pointers past repeated values.",
    ],
    solution: [
      "## Approach",
      "",
      "Sort the array. For each `i` (stopping once `nums[i] > 0`), run two pointers `lo = i + 1`, `hi = n - 1`: a sum below zero moves `lo` up, above zero moves `hi` down, and zero records the triplet and moves both past any equal values. Skipping repeated `i` values keeps triplets unique without a set.",
      "",
      "## Complexity",
      "",
      "O(n²) time, O(1) extra space beyond the output (plus the sort).",
      "",
      "## Worth saying out loud",
      "",
      "- The hash-set version (two-sum per i) is also O(n²) but needs deduplication of the output.",
      "- kSum generalises by recursion down to two-sum; say that if asked for 4Sum.",
    ].join("\n"),
    judge: {
      solutionCode: `function threeSum(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length - 2 && sorted[i] <= 0; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let lo = i + 1;
    let hi = sorted.length - 1;
    while (lo < hi) {
      const sum = sorted[i] + sorted[lo] + sorted[hi];
      if (sum < 0) lo++;
      else if (sum > 0) hi--;
      else {
        out.push([sorted[i], sorted[lo], sorted[hi]]);
        while (lo < hi && sorted[lo] === sorted[lo + 1]) lo++;
        while (lo < hi && sorted[hi] === sorted[hi - 1]) hi--;
        lo++;
        hi--;
      }
    }
  }
  return out;
}
`,
      starterCode: `/**
 * @param {number[]} nums
 * @returns {number[][]} unique triplets summing to zero, any order
 */
function threeSum(nums) {
  // Your code here
  return [];
}
`,
      entry: "__judgeThreeSum",
      driverCode: `function __judgeThreeSum(nums) {
  const key = (t) => t.join(",");
  return threeSum(nums)
    .map((t) => [...t].sort((a, b) => a - b))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
    .filter((t, i, all) => i === 0 || key(t) !== key(all[i - 1]));
}`,
      tests: [
        { name: "Prompt example", input: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
        { name: "No triplet", input: [[0, 1, 1]], expected: [] },
        { name: "All zeros", input: [[0, 0, 0]], expected: [[0, 0, 0]] },
        { name: "Repeated values, one triplet", input: [[-2, 0, 0, 2, 2]], expected: [[-2, 0, 2]] },
        { name: "Too short", input: [[1, 2]], expected: [] },
      ],
    },
  },
  {
    slug: "container-with-most-water",
    title: "Container With Most Water",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Two pointers at the ends; moving the shorter line is the only move that can improve the area.",
    prompt: [
      "`height[i]` is the height of a vertical line at x = i. Pick two lines so that, with the x-axis, they hold the most water: return that area (width × shorter height).",
      "",
      "```",
      "maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])  ->  49",
      "maxArea([1, 1])                       ->  1",
      "```",
    ].join("\n"),
    hints: [
      "Start with the widest container (both ends). The shorter side limits the area, so moving the taller side can never help.",
      "Move the shorter pointer inward and keep the best area seen.",
    ],
    solution: [
      "## Approach",
      "",
      "Two pointers from the ends. Record the area, then move the pointer at the shorter line inward: any container keeping that shorter line and a narrower width is smaller, so nothing is skipped. The loop ends when the pointers meet.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Be ready to argue why no better pair is skipped; that argument is the interview.",
      "- Trapping Rain Water looks similar but asks a different question (water above each bar).",
    ].join("\n"),
    judge: {
      solutionCode: `function maxArea(height) {
  let lo = 0;
  let hi = height.length - 1;
  let best = 0;
  while (lo < hi) {
    best = Math.max(best, (hi - lo) * Math.min(height[lo], height[hi]));
    if (height[lo] < height[hi]) lo++;
    else hi--;
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[]} height
 * @returns {number} the largest area between two lines
 */
function maxArea(height) {
  // Your code here
  return 0;
}
`,
      entry: "maxArea",
      tests: [
        { name: "Prompt example", input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
        { name: "Two lines", input: [[1, 1]], expected: 1 },
        { name: "Edges win", input: [[4, 3, 2, 1, 4]], expected: 16 },
        { name: "Middle peak", input: [[1, 2, 1]], expected: 2 },
        { name: "Rising", input: [[1, 2, 3, 4, 5]], expected: 6 },
      ],
    },
  },
];
