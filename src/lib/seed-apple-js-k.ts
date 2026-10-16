import type { Problem } from "./types";

// Apple front-end bank, part K: the two readings of [3, 4, 5] -> [20, 15, 12]
// and per-character totals in first-seen order. (Apple's run-length codec is
// run-length-encode-decode in the Anduril bank, tagged for both.) Python
// variants live in seed-python-apple-c.ts and seed-python-apple-e.ts.

export const appleJsProblemsK: Problem[] = [
  {
    slug: "product-of-others",
    title: "Array Products I",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Prefix products left to right, suffix products right to left — no division, so zeros need no special case.",
    prompt: [
      "Turn an array into one where each position holds the product of every **other** element: `productOfOthers(nums)`. No division, O(n) time.",
      "",
      "```",
      "productOfOthers([3, 4, 5])      // [20, 15, 12]",
      "productOfOthers([1, 2, 3, 4])   // [24, 12, 8, 6]",
      "```",
      "",
      "Inputs are integers and may include zeros and negatives.",
    ].join("\n"),
    hints: [
      "Fill the output with the product of everything to the left of each index, then sweep from the right and multiply in the product of everything to its right.",
      "Division looks easier, but a single zero breaks it. The two sweeps need no special case.",
    ],
    solution: [
      "## Approach",
      "",
      "Two passes: left to right, each slot gets the running product of everything before it; right to left, each slot is multiplied by the running product of everything after it.",
      "",
      "## Worth saying out loud",
      "",
      "- **The prefix and suffix passes avoid division, so a zero in the input needs no special case.** With division, one zero means dividing by zero, and two zeros make every product 0.",
      "- The output array doesn't count as extra space, so the two-pass version is O(1) extra.",
      "- In JavaScript, a product of `0` and a negative number is `-0`. It prints as `0` but fails an `Object.is` comparison.",
    ].join("\n"),
    judge: {
      starterCode: `/** Each position gets the product of every other element, without division. */
function productOfOthers(nums) {
  // Your code here
  return [];
}
`,
      solutionCode: `function productOfOthers(nums) {
  const out = new Array(nums.length).fill(1);
  let left = 1;
  for (let i = 0; i < nums.length; i++) {
    out[i] = left; // product of everything before i
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    out[i] *= right; // times everything after i
    right *= nums[i];
  }
  return out;
}
`,
      entry: "__judgeProducts",
      // -0 prints as 0 but fails Object.is; normalize it so only real
      // mistakes fail.
      driverCode: `function __judgeProducts(nums) {
  var out = productOfOthers(nums);
  if (!Array.isArray(out)) return out;
  return out.map(function (v) { return v === 0 ? 0 : v; });
}`,
      tests: [
        { name: "Three elements", input: [[3, 4, 5]], expected: [20, 15, 12] },
        { name: "Every other element, length 4", input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
        { name: "One zero needs no special case", input: [[2, 0, 3]], expected: [0, 6, 0] },
        { name: "Two zeros", input: [[0, 2, 0]], expected: [0, 0, 0] },
        { name: "Negative numbers", input: [[-1, 2, -3]], expected: [-6, 3, -2] },
        { name: "A single element", input: [[7]], expected: [1] },
        { name: "Larger values", input: [[100000, 3000, 7]], expected: [21000, 700000, 300000000] },
      ],
    },
  },
  {
    slug: "product-of-next-two",
    title: "Array Products II",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Each position multiplies its two successors, wrapping around the end with modular indices.",
    prompt: [
      "Turn an array into one where each position holds the product of the **next two** elements, wrapping around the end: `productOfNextTwo(nums)`.",
      "",
      "```",
      "productOfNextTwo([3, 4, 5])      // [20, 15, 12]",
      "productOfNextTwo([1, 2, 3, 4])   // [6, 12, 4, 2]",
      "```",
      "",
      "Inputs are integers, may include zeros and negatives, and have at least three elements.",
    ].join("\n"),
    hints: [
      "The two neighbors of index `i` are `(i + 1) % n` and `(i + 2) % n` — one `map` does it.",
    ],
    solution: [
      "## Approach",
      "",
      "One pass reading two neighbors with modular indices, so the last two positions wrap around to the front.",
      "",
      "## Worth saying out loud",
      "",
      "- `[3, 4, 5]` → `[20, 15, 12]` fits this rule and the \"product of every other element\" rule; they differ from length 4 on. With only one example, ask which is meant.",
      "- In JavaScript, a product of `0` and a negative number is `-0`. It prints as `0` but fails an `Object.is` comparison.",
    ].join("\n"),
    judge: {
      starterCode: `/** Each position gets the product of the next two elements, wrapping around. */
function productOfNextTwo(nums) {
  // Your code here
  return [];
}
`,
      solutionCode: `function productOfNextTwo(nums) {
  const n = nums.length;
  return nums.map((_, i) => nums[(i + 1) % n] * nums[(i + 2) % n]);
}
`,
      entry: "__judgeProducts",
      // -0 prints as 0 but fails Object.is; normalize it so only real
      // mistakes fail.
      driverCode: `function __judgeProducts(nums) {
  var out = productOfNextTwo(nums);
  if (!Array.isArray(out)) return out;
  return out.map(function (v) { return v === 0 ? 0 : v; });
}`,
      tests: [
        { name: "Three elements", input: [[3, 4, 5]], expected: [20, 15, 12] },
        { name: "The next two, length 4", input: [[1, 2, 3, 4]], expected: [6, 12, 4, 2] },
        { name: "The next two wrap around", input: [[2, 5, 1, 3]], expected: [5, 3, 6, 10] },
        { name: "The next two with a zero and negatives", input: [[0, -2, 3]], expected: [-6, 0, 0] },
      ],
    },
  },
  {
    slug: "character-totals-in-order",
    title: "Count Each Character in First-Seen Order",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "One counting pass into a Map, emitted in insertion order: AAABBAA becomes 5A2B.",
    prompt: [
      "Write each character's **total** count followed by the character, in first-seen order: `compressTotals(s)`.",
      "",
      "```",
      "compressTotals(\"AAABBAA\")   // \"5A2B\"",
      "compressTotals(\"BAB\")       // \"2B1A\"",
      "```",
      "",
      "Inputs contain letters only.",
    ].join("\n"),
    hints: [
      "Count into a `Map`. It keeps insertion order, which is exactly first-seen order.",
    ],
    solution: [
      "## Approach",
      "",
      "One counting pass into a `Map`, then emit count and character for each entry in insertion order.",
      "",
      "## Worth saying out loud",
      "",
      "- Unlike [run-length encoding](/problems/run-length-encode-decode), totals can't be decoded back: `\"5A2B\"` could have come from `\"AAABBAA\"` or `\"AAAAABB\"`.",
      "- A plain object would also keep insertion order for these letter keys, but integer-like keys jump to the front — a `Map` never reorders.",
    ].join("\n"),
    judge: {
      starterCode: `/** Each character's total count, in first-seen order: "AAABBAA" -> "5A2B". */
function compressTotals(s) {
  // Your code here
  return "";
}
`,
      solutionCode: `function compressTotals(s) {
  const counts = new Map(); // insertion order is first-seen order
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return [...counts].map(([ch, n]) => n + ch).join("");
}
`,
      entry: "compressTotals",
      tests: [
        { name: "Totals of AAABBAA", input: ["AAABBAA"], expected: "5A2B" },
        { name: "Totals keep first-seen order", input: ["BAB"], expected: "2B1A" },
        { name: "Totals of an empty string", input: [""], expected: "" },
        { name: "A single character", input: ["Z"], expected: "1Z" },
      ],
    },
  },
];
