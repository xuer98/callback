import type { Problem } from "./types";

// Apple front-end bank, part L: short warm-ups — parse an integer without
// parseInt, a recursive sum, a square root by binary search, Two Sum, and an
// exact Fibonacci generator. Python variants live in seed-python-apple-c.ts
// and seed-python-apple-e.ts.

const withoutNatives = `  function without(owner, names, run) {
    var saved = {};
    names.forEach(function (name) {
      saved[name] = owner[name];
      owner[name] = function () {
        throw new Error("Write it yourself: " + name + " is off limits here");
      };
    });
    try {
      return run();
    } finally {
      names.forEach(function (name) {
        owner[name] = saved[name];
      });
    }
  }`;

export const appleJsProblemsL: Problem[] = [
  {
    slug: "string-to-integer",
    title: "Parse an Integer Without parseInt",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Sign, then digits through a lookup table, accumulating n * 10 + d — and NaN for anything else.",
    prompt: [
      "Write `toInt(str)`: turn `\"1234\"` into `1234` without `parseInt`, `Number` or unary plus (in Python, without `int()` or `float()` on the string).",
      "",
      "- An optional leading `-` or `+` is allowed.",
      "- Anything else that isn't a digit, or a string with no digits, gives `NaN` (`float(\"nan\")` in Python).",
      "",
      "```",
      "toInt(\"1234\")   // 1234",
      "toInt(\"-42\")    // -42",
      "toInt(\"12a\")    // NaN",
      "```",
      "",
      "The JavaScript grader switches off `parseInt` and `parseFloat`. Hold yourself to the rest of the rules.",
    ].join("\n"),
    hints: [
      "Map each digit character to its value through a lookup table and accumulate `n = n * 10 + d`.",
      "Handle the sign first and reject everything else — including a lone sign with no digits.",
    ],
    solution: [
      "## Approach",
      "",
      "Validate while accumulating: read an optional sign, reject an empty remainder, then fold each digit into `n * 10 + d` through a lookup table, returning `NaN` on the first non-digit.",
      "",
      "## Worth saying out loud",
      "",
      "- `ch.charCodeAt(0) - 48` is the other digit trick; a lookup table rejects non-digits for free.",
      "- Past 2^53 − 1 the accumulation stops being exact in JavaScript; say whether the caller needs `BigInt`.",
      "- `parseInt` itself is more forgiving: it stops at the first bad character (`parseInt(\"12a\")` is 12). This version rejects the whole string.",
    ].join("\n"),
    judge: {
      starterCode: `/** "1234" -> 1234 without parseInt, Number or unary plus; NaN when invalid. */
function toInt(str) {
  // Your code here
  return NaN;
}
`,
      solutionCode: `const DIGITS = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9 };

function toInt(str) {
  let i = 0;
  let sign = 1;
  if (str[0] === "-" || str[0] === "+") {
    if (str[0] === "-") sign = -1;
    i = 1;
  }
  if (i === str.length) return NaN; // no digits at all
  let n = 0;
  for (; i < str.length; i++) {
    const d = DIGITS[str[i]];
    if (d === undefined) return NaN;
    n = n * 10 + d;
  }
  return sign * n;
}
`,
      entry: "__judgeToInt",
      driverCode: `function __judgeToInt(s) {
${withoutNatives}
  var parsed = without(globalThis, ["parseInt", "parseFloat"], function () {
    return without(Number, ["parseInt", "parseFloat"], function () { return toInt(s); });
  });
  if (typeof parsed === "number" && Number.isNaN(parsed)) return "NaN";
  return parsed === 0 ? 0 : parsed;
}`,
      tests: [
        { name: "toInt reads digits", input: ["1234"], expected: 1234 },
        { name: "toInt with a minus sign", input: ["-42"], expected: -42 },
        { name: "toInt with a plus sign", input: ["+7"], expected: 7 },
        { name: "Leading zeros", input: ["007"], expected: 7 },
        { name: "An empty string is NaN", input: [""], expected: "NaN" },
        { name: "A lone sign is NaN", input: ["-"], expected: "NaN" },
        { name: "A stray letter is NaN", input: ["12a"], expected: "NaN" },
        { name: "The largest safe integer", input: ["9007199254740991"], expected: 9007199254740991 },
      ],
    },
  },
  {
    slug: "recursive-sum-to-n",
    title: "Sum 1 to n Recursively",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "A base case at n <= 0 and one recursive call — then say where the call stack runs out.",
    prompt: [
      "Write `sumTo(n)`: the sum `n + (n - 1) + ... + 1`, computed **recursively**. `n <= 0` gives 0.",
      "",
      "```",
      "sumTo(100)   // 5050",
      "sumTo(0)     // 0",
      "sumTo(-5)    // 0",
      "```",
    ].join("\n"),
    hints: [
      "The base case is `n <= 0`, returning 0; otherwise return `n + sumTo(n - 1)`.",
    ],
    solution: [
      "## Approach",
      "",
      "The textbook recursion: a base case at `n <= 0`, and `n` plus the sum of everything below it.",
      "",
      "## Worth saying out loud",
      "",
      "- **The recursion overflows the stack near 10,000 frames in Chrome and Node.** Safari's JavaScriptCore is the only major engine with ES2015 proper tail calls, and they need strict mode plus an accumulator, so the recursive call is the last thing the function does.",
      "- The closed form `n (n + 1) / 2` is O(1) — mention it, even though the question asks for recursion.",
    ].join("\n"),
    judge: {
      starterCode: `/** n + (n - 1) + ... + 1, recursively; 0 when n <= 0. */
function sumTo(n) {
  // Your code here
  return 0;
}
`,
      solutionCode: `const sumTo = (n) => (n <= 0 ? 0 : n + sumTo(n - 1));
`,
      entry: "sumTo",
      tests: [
        { name: "sumTo(100)", input: [100], expected: 5050 },
        { name: "sumTo(1)", input: [1], expected: 1 },
        { name: "sumTo(0)", input: [0], expected: 0 },
        { name: "A negative n sums to 0", input: [-5], expected: 0 },
        { name: "sumTo(200)", input: [200], expected: 20100 },
      ],
    },
  },
  {
    slug: "square-root-binary-search",
    title: "Square Root Without Math.sqrt",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Binary-search the root in [0, max(1, x)] for a fixed number of rounds — an epsilon loop never ends for large x.",
    prompt: [
      "Write `sqrt(x)`: the square root without `Math.sqrt`, `Math.pow` or `** 0.5` (in Python, without `math.sqrt`), accurate to 6 decimal places. A negative `x` gives `NaN` (`float(\"nan\")` in Python).",
      "",
      "```",
      "sqrt(16)     // 4",
      "sqrt(2)      // 1.414214",
      "sqrt(0.25)   // 0.5",
      "```",
      "",
      "The grader switches off the built-in root functions and compares results to 6 decimal places.",
    ].join("\n"),
    hints: [
      "Binary-search between 0 and `max(1, x)`. The `max` matters for `x < 1`, whose root is larger than `x`.",
      "Loop a fixed number of times rather than `while (hi - lo > epsilon)`, which never ends for large inputs.",
    ],
    solution: [
      "## Approach",
      "",
      "Binary-search the answer in `[0, max(1, x)]`: if `mid * mid` overshoots, move `hi` down, otherwise move `lo` up. A fixed 200 rounds pins a double down completely.",
      "",
      "## Worth saying out loud",
      "",
      "- **Loop a fixed number of times.** A `while (hi - lo > epsilon)` loop never ends for large inputs, where adjacent doubles are further apart than epsilon.",
      "- Newton's method (`r = (r + x / r) / 2`) converges quadratically and is the faster alternative once it's running.",
    ].join("\n"),
    judge: {
      starterCode: `/** The square root without Math.sqrt, Math.pow or ** 0.5; NaN when x < 0. */
function sqrt(x) {
  // Your code here
  return 0;
}
`,
      solutionCode: `function sqrt(x) {
  if (x < 0) return NaN;
  let lo = 0;
  let hi = x < 1 ? 1 : x; // the root of x < 1 is larger than x
  for (let i = 0; i < 200; i++) {
    // a fixed count: an epsilon loop never ends for large x
    const mid = (lo + hi) / 2;
    if (mid * mid > x) hi = mid;
    else lo = mid;
  }
  return lo;
}
`,
      entry: "__judgeSqrt",
      driverCode: `function __judgeSqrt(x) {
${withoutNatives}
  var root = without(Math, ["sqrt", "pow", "cbrt", "hypot"], function () { return sqrt(x); });
  if (typeof root !== "number") return root;
  return Number.isNaN(root) ? "NaN" : root.toFixed(6);
}`,
      tests: [
        { name: "sqrt of a perfect square", input: [16], expected: "4.000000" },
        { name: "sqrt(2)", input: [2], expected: "1.414214" },
        { name: "sqrt of a value below 1", input: [0.25], expected: "0.500000" },
        { name: "sqrt(0)", input: [0], expected: "0.000000" },
        { name: "sqrt of a large value", input: [10000000000], expected: "100000.000000" },
        { name: "sqrt of a negative is NaN", input: [-1], expected: "NaN" },
      ],
    },
  },
  {
    slug: "two-sum",
    title: "Two Sum",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "One pass with a map from value to index — look up the complement before storing.",
    prompt: [
      "Write `twoSum(nums, target)`: return the indices `[i, j]` with `i < j` of the one pair that sums to `target`, or `null` (`None` in Python) when there is none.",
      "",
      "```",
      "twoSum([2, 7, 11, 15], 9)   // [0, 1]",
      "twoSum([3, 3], 6)           // [0, 1]",
      "twoSum([1, 2, 3], 7)        // null",
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from value to index. For each element, look up `target - value` before storing the element itself.",
    ],
    solution: [
      "## Approach",
      "",
      "One pass with a map from value to index. For each element, if its complement `target - value` is already in the map, the pair is found; otherwise store the element and continue.",
      "",
      "## Worth saying out loud",
      "",
      "- Looking up before storing is what stops an element pairing with itself (`[3]` with target 6).",
      "- O(n) time and space. With a sorted array, two pointers need no extra space — but sorting loses the original indices.",
    ].join("\n"),
    judge: {
      starterCode: `/** Indices [i, j], i < j, of the pair that sums to target, or null. */
function twoSum(nums, target) {
  // Your code here
  return null;
}
`,
      solutionCode: `function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return null;
}
`,
      entry: "__judgeTwoSum",
      driverCode: `function __judgeTwoSum(nums, target) {
  var pair = twoSum(nums, target);
  return pair === undefined ? null : pair;
}`,
      tests: [
        { name: "twoSum finds the pair", input: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { name: "twoSum later in the array", input: [[3, 2, 4], 6], expected: [1, 2] },
        { name: "twoSum with equal values", input: [[3, 3], 6], expected: [0, 1] },
        { name: "twoSum with no pair", input: [[1, 2, 3], 7], expected: null },
        { name: "Negative numbers", input: [[-3, 4, 3, 90], 0], expected: [0, 2] },
      ],
    },
  },
  {
    slug: "fibonacci-generator",
    title: "An Exact Fibonacci Generator",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "An infinite generator over two BigInts — ordinary numbers lose precision past the 78th term.",
    prompt: [
      "Write `fibonacci()`: a generator that yields `0, 1, 1, 2, 3, 5, ...` forever, **exactly** — the 100th value must be right to the last digit.",
      "",
      "```",
      "const it = fibonacci();",
      "it.next().value, it.next().value, it.next().value   // 0, 1, 1",
      "```",
      "",
      "The grader takes as many values as each test needs and compares them as strings.",
    ].join("\n"),
    hints: [
      "Keep the last two values and yield in an infinite loop: `yield a; [a, b] = [b, a + b]`.",
      "Past the 78th term, JavaScript numbers lose precision. Use `BigInt` (`0n`, `1n`), or Python's integers, which never overflow.",
    ],
    solution: [
      "## Approach",
      "",
      "An infinite generator over two `BigInt` values: yield the current one, then shift the pair forward. The caller decides how many values to take.",
      "",
      "## Worth saying out loud",
      "",
      "- `BigInt` keeps Fibonacci exact past the 78th term, where ordinary numbers lose precision.",
      "- A generator is lazy, so \"the first X values\" is the caller's loop, not a parameter.",
      "- The nth value alone is O(log n) with matrix exponentiation or fast doubling.",
    ].join("\n"),
    judge: {
      starterCode: `/** Yield 0, 1, 1, 2, 3, 5, ... forever, exactly. */
function* fibonacci() {
  // Your code here
}
`,
      solutionCode: `function* fibonacci() {
  let [a, b] = [0n, 1n]; // BigInt: exact past the 78th term
  for (;;) {
    yield a;
    [a, b] = [b, a + b];
  }
}
`,
      entry: "__judgeFibonacci",
      driverCode: `function __judgeFibonacci(kind, count) {
  var it = fibonacci();
  var values = [];
  for (var i = 0; i < count; i++) {
    var step = it.next();
    if (step.done) break;
    values.push(String(step.value));
  }
  return kind === "first" ? values : values[values.length - 1];
}`,
      tests: [
        { name: "The sequence starts at 0", input: ["first", 1], expected: ["0"] },
        { name: "The first ten Fibonacci numbers", input: ["first", 10], expected: ["0", "1", "1", "2", "3", "5", "8", "13", "21", "34"] },
        { name: "Exact past 2^53: the 80th value", input: ["nth", 80], expected: "14472334024676221" },
        { name: "The 100th value", input: ["nth", 100], expected: "218922995834555169026" },
      ],
    },
  },
];
