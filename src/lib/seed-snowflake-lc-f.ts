import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part F: array classics — trapping
// rain water, jump game, one stock trade, rescue boats, distance to a
// character, and the emptiest seat. Judged in JavaScript and Python; the
// Python judges live in seed-python-snowflake-i.ts.

export const snowflakeLcProblemsF: Problem[] = [
  {
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Water over a bar is min(tallest to the left, tallest to the right) minus the bar; two pointers compute it in one pass.",
    prompt: [
      "Given an elevation map where each bar has width 1, return how much water it traps after rain.",
      "",
      "```",
      "trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])  ->  6",
      "trap([4, 2, 0, 3, 2, 5])                    ->  9",
      "```",
    ].join("\n"),
    hints: [
      "The water above bar i is min(maxLeft[i], maxRight[i]) − height[i]; two prefix arrays give an O(n) answer with O(n) space.",
      "Two pointers from both ends, always advancing the side with the smaller running maximum, give the same answer in O(1) space: that side's water is decided by its own maximum.",
    ],
    solution: [
      "## Approach",
      "",
      "Left and right pointers with their running maxima. Whichever maximum is smaller bounds the water on its own side, so that pointer can be settled: add `max − height` there and move it inward. Continue until the pointers meet. The two-array version precomputes the maxima from each side and sums the minimum minus height; both are O(n).",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space with two pointers.",
      "",
      "## Worth saying out loud",
      "",
      "- Why the smaller side is safe: a taller bar exists on the other side already, so the water level on this side is exactly this side's maximum.",
      "- A monotonic stack solves it horizontally, layer by layer, and is the way to go when the question becomes \"fill the container\" with 2-D output.",
    ].join("\n"),
    judge: {
      solutionCode: `function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}
`,
      starterCode: `/**
 * @param {number[]} height non-negative bar heights
 * @returns {number} units of trapped water
 */
function trap(height) {
  // Your code here
  return 0;
}
`,
      entry: "trap",
      tests: [
        { name: "Prompt example", input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
        { name: "A deep basin", input: [[4, 2, 0, 3, 2, 5]], expected: 9 },
        { name: "Empty", input: [[]], expected: 0 },
        { name: "One bar", input: [[1]], expected: 0 },
        { name: "A single well", input: [[3, 0, 3]], expected: 3 },
        { name: "Monotonic holds nothing", input: [[1, 2, 3]], expected: 0 },
      ],
    },
  },
  {
    slug: "jump-game-ii",
    title: "Jump Game II",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Greedy BFS over index ranges: each jump extends the reach to the farthest index seen in the current range.",
    prompt: [
      "Each element of `nums` is the maximum jump length from that index. Starting at index `0`, return the minimum number of jumps to reach the last index. It is always reachable.",
      "",
      "```",
      "jump([2, 3, 1, 1, 4])  ->  2",
      "jump([2, 3, 0, 1, 4])  ->  2",
      "jump([0])              ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Treat the indices reachable with j jumps as a range. Scan it tracking the farthest index any element reaches; that is the next range's end.",
      "Count a jump each time the scan passes the current range's end; stop once the range covers the last index.",
    ],
    solution: [
      "## Approach",
      "",
      "Implicit breadth-first search. Maintain the end of the current jump's range and the farthest index reachable from anything scanned so far. Walk the indices; when the walk reaches the end of the current range, one more jump is needed and the range extends to the farthest index. The walk stops before the last index because reaching it needs no further jump.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The O(n²) DP is the fallback if the greedy argument does not come: `dp[i]` = 1 + min over indices that can jump to i.",
      "- Jump Game I (\"can you reach the end?\") is the same scan asking only whether the farthest reach ever stalls.",
    ].join("\n"),
    judge: {
      solutionCode: `function jump(nums) {
  let jumps = 0;
  let rangeEnd = 0;
  let farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === rangeEnd) {
      jumps++;
      rangeEnd = farthest;
    }
  }
  return jumps;
}
`,
      starterCode: `/**
 * @param {number[]} nums maximum jump length per index
 * @returns {number} the fewest jumps to the last index
 */
function jump(nums) {
  // Your code here
  return 0;
}
`,
      entry: "jump",
      tests: [
        { name: "Prompt example", input: [[2, 3, 1, 1, 4]], expected: 2 },
        { name: "A zero in the middle", input: [[2, 3, 0, 1, 4]], expected: 2 },
        { name: "Already there", input: [[0]], expected: 0 },
        { name: "One jump", input: [[1, 2]], expected: 1 },
        { name: "Ones all the way", input: [[1, 1, 1, 1]], expected: 3 },
        { name: "A single long jump", input: [[5, 1, 1, 1, 1, 1]], expected: 1 },
      ],
    },
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Track the lowest price so far; the best sale today is today's price minus that minimum.",
    prompt: [
      "Given daily prices, choose one day to buy and a later day to sell to maximise profit. Return the maximum profit, or `0` if no profitable trade exists.",
      "",
      "```",
      "maxProfit([7, 1, 5, 3, 6, 4])  ->  5    // buy at 1, sell at 6",
      "maxProfit([7, 6, 4, 3, 1])     ->  0",
      "```",
    ].join("\n"),
    hints: ["One pass keeping the minimum price seen so far and the best difference between the current price and that minimum."],
    solution: [
      "## Approach",
      "",
      "Scan the prices once. For each day, the best possible sale is today's price minus the lowest price seen before it, so keep that minimum and the best difference. The answer is the best difference, never below zero.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- It is maximum subarray over the daily differences in disguise, which is the bridge to the multi-transaction variants.",
      "- Returning the days as well as the profit is the usual follow-up; record the minimum's index when it changes and the pair when the best improves.",
    ].join("\n"),
    judge: {
      solutionCode: `function maxProfit(prices) {
  let lowest = Infinity;
  let best = 0;
  for (const price of prices) {
    lowest = Math.min(lowest, price);
    best = Math.max(best, price - lowest);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[]} prices
 * @returns {number} the best profit from one buy and one later sell
 */
function maxProfit(prices) {
  // Your code here
  return 0;
}
`,
      entry: "maxProfit",
      tests: [
        { name: "Prompt example", input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
        { name: "Falling prices", input: [[7, 6, 4, 3, 1]], expected: 0 },
        { name: "One day", input: [[1]], expected: 0 },
        { name: "Best buy comes after the best sell", input: [[2, 4, 1]], expected: 2 },
        { name: "Flat", input: [[3, 3]], expected: 0 },
        { name: "Rising prices", input: [[1, 2, 3, 4, 5]], expected: 4 },
      ],
    },
  },
  {
    slug: "boats-to-save-people",
    title: "Boats to Save People",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Sort, then pair the heaviest remaining person with the lightest if they fit; either way the heaviest leaves on this boat.",
    prompt: [
      "Each boat carries at most two people and at most `limit` total weight; everyone weighs at most `limit`. Return the minimum number of boats to carry everyone.",
      "",
      "```",
      "numRescueBoats([1, 2], 3)        ->  1",
      "numRescueBoats([3, 2, 2, 1], 3)  ->  3",
      "numRescueBoats([3, 5, 3, 4], 5)  ->  4",
      "```",
    ].join("\n"),
    hints: ["Sort. Two pointers: the heaviest person always takes a boat; if the lightest remaining fits beside them, they share it."],
    solution: [
      "## Approach",
      "",
      "Sort the weights. The heaviest person must leave on some boat; the best partner for them is the lightest person, because if the lightest does not fit no one does, and if they do fit, pairing them wastes the least capacity later. So walk two pointers inward: always consume the heavy end, and also consume the light end when the pair fits. Each iteration is one boat.",
      "",
      "## Complexity",
      "",
      "O(n log n) time for the sort; O(1) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- The two-person cap is what makes the greedy exact; with three or more per boat the problem becomes bin packing.",
      "- Counting sort on weights (bounded by `limit`) makes it linear.",
    ].join("\n"),
    judge: {
      solutionCode: `function numRescueBoats(people, limit) {
  const sorted = [...people].sort((a, b) => a - b);
  let light = 0;
  let heavy = sorted.length - 1;
  let boats = 0;
  while (light <= heavy) {
    if (sorted[light] + sorted[heavy] <= limit) light++;
    heavy--;
    boats++;
  }
  return boats;
}
`,
      starterCode: `/**
 * @param {number[]} people weights, each <= limit
 * @param {number} limit a boat's capacity
 * @returns {number} the fewest boats
 */
function numRescueBoats(people, limit) {
  // Your code here
  return 0;
}
`,
      entry: "numRescueBoats",
      tests: [
        { name: "They share", input: [[1, 2], 3], expected: 1 },
        { name: "Only the lightest pair fits", input: [[3, 2, 2, 1], 3], expected: 3 },
        { name: "Nobody shares", input: [[3, 5, 3, 4], 5], expected: 4 },
        { name: "One person", input: [[1], 1], expected: 1 },
        { name: "Everyone pairs", input: [[2, 2, 2, 2], 4], expected: 2 },
        { name: "Heaviest with lightest", input: [[5, 1, 4, 2], 6], expected: 2 },
      ],
    },
  },
  {
    slug: "shortest-distance-to-a-character",
    title: "Shortest Distance to a Character",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Two sweeps: distance from the nearest occurrence on the left, then take the minimum with the nearest on the right.",
    prompt: [
      "For each index of `s`, return the distance to the closest occurrence of the character `c`, which appears at least once.",
      "",
      "```",
      "shortestToChar(\"loveleetcode\", \"e\")  ->  [3, 2, 1, 0, 1, 0, 0, 1, 2, 2, 1, 0]",
      "shortestToChar(\"aaab\", \"b\")          ->  [3, 2, 1, 0]",
      "```",
    ].join("\n"),
    hints: ["Sweep left to right carrying the index of the last `c` seen, then right to left carrying the next one; the answer is the smaller distance."],
    solution: [
      "## Approach",
      "",
      "Two linear sweeps. Going right, remember the position of the most recent `c` and record the distance to it (infinite until one is seen). Going left, do the same with the next `c` and keep the minimum. Every index ends up with the distance to its nearest occurrence on either side.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) output.",
      "",
      "## Worth saying out loud",
      "",
      "- A breadth-first search from every `c` gives the same answer and generalises to grids, which is [Nearest Bathroom for Every Desk](/problems/nearest-bathroom-distances).",
      "- The 1-D sweep is the same trick as [Closest Person to a Cake](/problems/closest-person-cake-distance), applied to one kind of marker.",
    ].join("\n"),
    judge: {
      solutionCode: `function shortestToChar(s, c) {
  const n = s.length;
  const out = Array(n).fill(Infinity);
  let last = -Infinity;
  for (let i = 0; i < n; i++) {
    if (s[i] === c) last = i;
    out[i] = i - last;
  }
  last = Infinity;
  for (let i = n - 1; i >= 0; i--) {
    if (s[i] === c) last = i;
    out[i] = Math.min(out[i], last - i);
  }
  return out;
}
`,
      starterCode: `/**
 * @param {string} s
 * @param {string} c a character that occurs in s
 * @returns {number[]} distance from each index to the nearest c
 */
function shortestToChar(s, c) {
  // Your code here
  return [];
}
`,
      entry: "shortestToChar",
      tests: [
        { name: "Prompt example", input: ["loveleetcode", "e"], expected: [3, 2, 1, 0, 1, 0, 0, 1, 2, 2, 1, 0] },
        { name: "Only at the end", input: ["aaab", "b"], expected: [3, 2, 1, 0] },
        { name: "One character", input: ["b", "b"], expected: [0] },
        { name: "Alternating", input: ["abab", "a"], expected: [0, 1, 0, 1] },
        { name: "Only at the start", input: ["baa", "b"], expected: [0, 1, 2] },
      ],
    },
  },
  {
    slug: "maximize-distance-to-closest-person",
    title: "Maximize Distance to Closest Person",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Gaps between occupied seats are worth half their length; the two ends are worth their full length.",
    prompt: [
      "In a row of seats, `1` is occupied and `0` is empty, with at least one of each. Sit in an empty seat that maximises the distance to the nearest person, and return that distance.",
      "",
      "```",
      "maxDistToClosest([1, 0, 0, 0, 1, 0, 1])  ->  2",
      "maxDistToClosest([1, 0, 0, 0])           ->  3",
      "maxDistToClosest([0, 1])                 ->  1",
      "```",
    ].join("\n"),
    hints: [
      "Scan for runs of empty seats. A run between two people of length L gives distance (L + 1) / 2 rounded down; a run at either end gives L.",
      "One pass tracking the index of the previous occupied seat is enough.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk the seats remembering the last occupied index. At each occupied seat, the run of empties before it is either a leading run (worth its full length, sitting at index 0) or an interior run (worth half the gap, sitting in the middle). After the loop, a trailing run is worth its full length. The answer is the largest of these.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The interior gap formula is `(next − prev) / 2` rounded down, not the run length divided by two — check it on a gap of three empties.",
      "- The follow-up with people arriving and leaving over time (Exam Room) keeps the gaps in a sorted structure and reuses this scoring.",
    ].join("\n"),
    judge: {
      solutionCode: `function maxDistToClosest(seats) {
  let best = 0;
  let prev = -1;
  for (let i = 0; i < seats.length; i++) {
    if (seats[i] !== 1) continue;
    if (prev === -1) best = Math.max(best, i);
    else best = Math.max(best, Math.floor((i - prev) / 2));
    prev = i;
  }
  return Math.max(best, seats.length - 1 - prev);
}
`,
      starterCode: `/**
 * @param {number[]} seats 1 occupied, 0 empty
 * @returns {number} the largest achievable distance to the nearest person
 */
function maxDistToClosest(seats) {
  // Your code here
  return 0;
}
`,
      entry: "maxDistToClosest",
      tests: [
        { name: "Prompt example", input: [[1, 0, 0, 0, 1, 0, 1]], expected: 2 },
        { name: "Trailing run", input: [[1, 0, 0, 0]], expected: 3 },
        { name: "Two seats", input: [[0, 1]], expected: 1 },
        { name: "Leading run", input: [[0, 0, 1]], expected: 2 },
        { name: "Only the middle seat", input: [[1, 0, 1]], expected: 1 },
        { name: "An even interior gap", input: [[1, 0, 0, 0, 0, 1]], expected: 2 },
      ],
    },
  },
];
