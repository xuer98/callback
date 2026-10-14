import type { Problem } from "./types";

// Blind 75 for the Snowflake backend screen, part B: the binary group and
// the first dynamic-programming warm-up. Python in seed-python-snowflake-o.ts.

export const snowflakeBlindProblemsB: Problem[] = [
  {
    slug: "sum-of-two-integers",
    title: "Sum of Two Integers",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "XOR is the sum without carries; AND shifted left is the carries. Repeat until nothing carries.",
    prompt: [
      "Return `a + b` without using the `+` or `-` operators. Both are 32-bit signed integers and so is the result.",
      "",
      "```",
      "getSum(1, 2)   ->  3",
      "getSum(-5, 3)  ->  -2",
      "```",
    ].join("\n"),
    hints: [
      "`a ^ b` adds each bit pair ignoring carries; `(a & b) << 1` is exactly the carries, shifted into place.",
      "Loop: sum without carries, then add the carries the same way, until the carry is zero. Bitwise operators in JavaScript are 32-bit, which is what the problem wants.",
    ],
    solution: [
      "## Approach",
      "",
      "While there is a carry: `carry = (a & b) << 1`, `a = a ^ b`, `b = carry`. XOR adds without carrying, AND finds the positions that carry, and the shift moves them one bit up. Signed overflow wraps in 32 bits, which matches two's complement addition.",
      "",
      "## Complexity",
      "",
      "At most 32 iterations: O(1).",
      "",
      "## Worth saying out loud",
      "",
      "- Languages with unbounded integers (Python) need a 32-bit mask on every step and a final conversion back to signed.",
      "- Subtraction is the same loop with the two's complement of b (`~b + 1`), once you may use `+` for that.",
    ].join("\n"),
    judge: {
      solutionCode: `function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}
`,
      starterCode: `/**
 * @param {number} a 32-bit signed
 * @param {number} b 32-bit signed
 * @returns {number} a + b, computed without + or -
 */
function getSum(a, b) {
  // Your code here
  return 0;
}
`,
      entry: "getSum",
      tests: [
        { name: "Prompt example", input: [1, 2], expected: 3 },
        { name: "Carries", input: [2, 3], expected: 5 },
        { name: "Opposites", input: [-1, 1], expected: 0 },
        { name: "Negative result", input: [-5, 3], expected: -2 },
        { name: "Zeros", input: [0, 0], expected: 0 },
        { name: "Near the top", input: [2147483647, -1], expected: 2147483646 },
      ],
    },
  },
  {
    slug: "number-of-1-bits",
    title: "Number of 1 Bits",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "n & (n - 1) clears the lowest set bit; count how many times you can do it.",
    prompt: [
      "Return the number of set bits in the binary form of an unsigned 32-bit integer `n` (its Hamming weight).",
      "",
      "```",
      "hammingWeight(11)          ->  3     // 1011",
      "hammingWeight(128)         ->  1",
      "hammingWeight(4294967293)  ->  31",
      "```",
    ].join("\n"),
    hints: [
      "`n & (n - 1)` turns off the lowest set bit. Loop until zero, counting iterations.",
      "In JavaScript bitwise operators work on 32-bit signed values; values above 2³¹ wrap to negative, and the loop still terminates in at most 32 steps.",
    ],
    solution: [
      "## Approach",
      "",
      "Repeatedly clear the lowest set bit with `n &= n - 1` and count the steps. The loop runs once per set bit rather than once per bit.",
      "",
      "## Complexity",
      "",
      "O(number of set bits), at most 32.",
      "",
      "## Worth saying out loud",
      "",
      "- The lookup-table version (8 bits at a time) is what hardware-minded interviewers want to hear about for a hot loop.",
      "- `n.toString(2)` counting is fine as a first answer; the bit trick is the follow-up.",
    ].join("\n"),
    judge: {
      solutionCode: `function hammingWeight(n) {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}
`,
      starterCode: `/**
 * @param {number} n an unsigned 32-bit integer
 * @returns {number} how many bits are set
 */
function hammingWeight(n) {
  // Your code here
  return 0;
}
`,
      entry: "hammingWeight",
      tests: [
        { name: "Prompt example", input: [11], expected: 3 },
        { name: "Power of two", input: [128], expected: 1 },
        { name: "All but one bit", input: [4294967293], expected: 31 },
        { name: "Zero", input: [0], expected: 0 },
        { name: "All bits", input: [4294967295], expected: 32 },
      ],
    },
  },
  {
    slug: "counting-bits",
    title: "Counting Bits",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "bits[i] = bits[i >> 1] + (i & 1): each count comes from a smaller one already computed.",
    prompt: [
      "Return an array `bits` of length `n + 1` where `bits[i]` is the number of set bits in `i`, in O(n).",
      "",
      "```",
      "countBits(2)  ->  [0, 1, 1]",
      "countBits(5)  ->  [0, 1, 1, 2, 1, 2]",
      "```",
    ].join("\n"),
    hints: [
      "Dropping the lowest bit of i gives i >> 1, whose count is already known; add back 1 if i is odd.",
      "Equivalently `bits[i] = bits[i & (i - 1)] + 1`.",
    ],
    solution: [
      "## Approach",
      "",
      "Dynamic programming over the numbers in order: `bits[i] = bits[i >> 1] + (i & 1)`. Every entry is one lookup and one addition.",
      "",
      "## Complexity",
      "",
      "O(n) time and output space.",
      "",
      "## Worth saying out loud",
      "",
      "- Calling a popcount per number is O(n log n); the recurrence is the point of the question.",
      "- The same recurrence seeds a lookup table for the byte-at-a-time popcount.",
    ].join("\n"),
    judge: {
      solutionCode: `function countBits(n) {
  const bits = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
  return bits;
}
`,
      starterCode: `/**
 * @param {number} n
 * @returns {number[]} set-bit counts of 0..n
 */
function countBits(n) {
  // Your code here
  return [];
}
`,
      entry: "countBits",
      tests: [
        { name: "Prompt example", input: [2], expected: [0, 1, 1] },
        { name: "Up to five", input: [5], expected: [0, 1, 1, 2, 1, 2] },
        { name: "Zero", input: [0], expected: [0] },
        { name: "Up to eight", input: [8], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1] },
      ],
    },
  },
  {
    slug: "missing-number",
    title: "Missing Number",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Expected sum minus actual sum, or XOR everything with its index — both O(1) space.",
    prompt: [
      "`nums` holds `n` distinct numbers from the range `[0, n]`, so exactly one number of the range is missing. Return it.",
      "",
      "```",
      "missingNumber([3, 0, 1])                    ->  2",
      "missingNumber([0, 1])                       ->  2",
      "missingNumber([9, 6, 4, 2, 3, 5, 7, 0, 1])  ->  8",
      "```",
    ].join("\n"),
    hints: [
      "The sum of 0..n is n(n+1)/2; subtract the array's sum.",
      "XOR of all indices 0..n and all values cancels every pair and leaves the missing number, with no overflow concern.",
    ],
    solution: [
      "## Approach",
      "",
      "Gauss: the range sums to n(n+1)/2; the difference from the actual sum is the missing value. The XOR version folds each index and each value into one accumulator; every present number appears twice and cancels.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Sorting or a set also works but costs O(n log n) or O(n) space; mention them, then give the arithmetic one.",
      "- The XOR trick generalises to the single-number family of problems.",
    ].join("\n"),
    judge: {
      solutionCode: `function missingNumber(nums) {
  const n = nums.length;
  let total = (n * (n + 1)) / 2;
  for (const value of nums) total -= value;
  return total;
}
`,
      starterCode: `/**
 * @param {number[]} nums n distinct numbers from 0..n
 * @returns {number} the one that is missing
 */
function missingNumber(nums) {
  // Your code here
  return 0;
}
`,
      entry: "missingNumber",
      tests: [
        { name: "Prompt example", input: [[3, 0, 1]], expected: 2 },
        { name: "Missing the top", input: [[0, 1]], expected: 2 },
        { name: "Longer", input: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 },
        { name: "Missing zero", input: [[1]], expected: 0 },
        { name: "Single zero", input: [[0]], expected: 1 },
      ],
    },
  },
  {
    slug: "reverse-bits",
    title: "Reverse Bits",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Peel the low bit off the input and push it onto the output, 32 times, keeping the result unsigned.",
    prompt: [
      "Reverse the bits of an unsigned 32-bit integer and return the result as an unsigned 32-bit integer.",
      "",
      "```",
      "reverseBits(43261596)    ->  964176192     // 00000010100101000001111010011100 -> 00111001011110000010100101000000",
      "reverseBits(4294967293)  ->  3221225471",
      "```",
    ].join("\n"),
    hints: [
      "Loop 32 times: shift the result left, OR in the lowest bit of n, shift n right.",
      "JavaScript's `<<` produces a signed result; finish with `>>> 0` to read it as unsigned.",
    ],
    solution: [
      "## Approach",
      "",
      "Thirty-two iterations of `result = (result << 1) | (n & 1); n >>>= 1`, then `result >>> 0` so the top bit does not read as a sign. Every bit moves exactly once.",
      "",
      "## Complexity",
      "",
      "O(1): 32 steps.",
      "",
      "## Worth saying out loud",
      "",
      "- The follow-up \"called many times\" wants a byte lookup table (reverse 4 bytes and swap their order), or the divide-and-conquer mask swaps (16, 8, 4, 2, 1).",
      "- Unsigned handling is the trap in languages with signed ints.",
    ].join("\n"),
    judge: {
      solutionCode: `function reverseBits(n) {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = (result << 1) | (n & 1);
    n >>>= 1;
  }
  return result >>> 0;
}
`,
      starterCode: `/**
 * @param {number} n an unsigned 32-bit integer
 * @returns {number} its bits reversed, as an unsigned 32-bit integer
 */
function reverseBits(n) {
  // Your code here
  return 0;
}
`,
      entry: "reverseBits",
      tests: [
        { name: "Prompt example", input: [43261596], expected: 964176192 },
        { name: "High bit set", input: [4294967293], expected: 3221225471 },
        { name: "Zero", input: [0], expected: 0 },
        { name: "One becomes the top bit", input: [1], expected: 2147483648 },
        { name: "All ones", input: [4294967295], expected: 4294967295 },
      ],
    },
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Fibonacci in disguise: ways(n) = ways(n-1) + ways(n-2), kept in two variables.",
    prompt: [
      "You climb a staircase of `n` steps taking 1 or 2 steps at a time. Return how many distinct sequences of steps reach the top.",
      "",
      "```",
      "climbStairs(2)  ->  2     // 1+1, 2",
      "climbStairs(3)  ->  3     // 1+1+1, 1+2, 2+1",
      "```",
    ].join("\n"),
    hints: [
      "The last move was a 1-step from n-1 or a 2-step from n-2, so ways(n) = ways(n-1) + ways(n-2).",
      "Only the last two values are needed; roll them forward in a loop.",
    ],
    solution: [
      "## Approach",
      "",
      "Bottom-up with two variables: start from ways(1) = 1 and ways(2) = 2 and roll forward. It is the Fibonacci sequence shifted by one.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space; the matrix-power or closed-form version is O(log n) and worth naming.",
      "",
      "## Worth saying out loud",
      "",
      "- Naive recursion is exponential; memoisation is the usual first fix, then the two-variable loop.",
      "- With a set of allowed step sizes it becomes the coin-change counting problem (ordered sequences).",
    ].join("\n"),
    judge: {
      solutionCode: `function climbStairs(n) {
  let prev = 1;
  let current = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + current;
    prev = current;
    current = next;
  }
  return current;
}
`,
      starterCode: `/**
 * @param {number} n steps, n >= 1
 * @returns {number} distinct ways to climb them with 1- and 2-steps
 */
function climbStairs(n) {
  // Your code here
  return 0;
}
`,
      entry: "climbStairs",
      tests: [
        { name: "Prompt example", input: [2], expected: 2 },
        { name: "Three steps", input: [3], expected: 3 },
        { name: "One step", input: [1], expected: 1 },
        { name: "Ten steps", input: [10], expected: 89 },
        { name: "Forty-five steps", input: [45], expected: 1836311903 },
      ],
    },
  },
];
