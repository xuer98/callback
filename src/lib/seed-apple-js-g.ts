import type { Problem } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), part G: the
// domain-operation simulator from a July 2025 online screen, the min stack
// and multiply-without-* pair from a 2022 round, and the four Glassdoor
// warm-ups plus Blind's Fibonacci. JavaScript judges here; the Python
// variants live in seed-python-apple-c.ts.

const REPORTED_EXAMPLE = [
  ["PUT", "www.apple.com", "10.20.30.40"],
  ["PUT", "jobs.apple.com", "10.20.30.50"],
  ["PUT", "sites.google.com", "142.258.145.693"],
  ["GET", "sample.com"],
  ["GET", "www.apple.com"],
  ["COUNT", "apple.com"],
  ["COUNT", "com"],
];

export const appleJsProblemsG: Problem[] = [
  {
    slug: "domain-operation-simulator",
    title: "Domain Operation Simulator",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "PUT, GET and a COUNT of everything under a domain: match on the label boundary, then make COUNT fast with a trie.",
    prompt: [
      "Process rows of `[op, domain, ip]` in order and return the outputs of the `GET` and `COUNT` rows.",
      "",
      "- `PUT domain ip` stores the IP for the domain, replacing any earlier one. It outputs nothing.",
      "- `GET domain` outputs the stored IP, or `\"404\"`.",
      "- `COUNT domain` outputs, as a string, how many stored domains equal `domain` or sit under it.",
      "",
      "```",
      "[\"PUT\", \"www.apple.com\", \"10.20.30.40\"]",
      "[\"PUT\", \"jobs.apple.com\", \"10.20.30.50\"]",
      "[\"PUT\", \"sites.google.com\", \"142.258.145.693\"]",
      "[\"GET\", \"sample.com\"]",
      "[\"GET\", \"www.apple.com\"]",
      "[\"COUNT\", \"apple.com\"]",
      "[\"COUNT\", \"com\"]",
      "",
      "Expected: [\"404\", \"10.20.30.40\", \"2\", \"3\"]",
      "```",
      "",
      "\"Under\" means on a label boundary: `www.apple.com` is under `apple.com`, and `pineapple.com` is not.",
      "",
      "## Follow-up",
      "",
      "A first answer scans every stored domain on each `COUNT`. The follow-up asks for a `COUNT` whose cost does not grow with the number of stored domains. The tests don't time you, so say the complexity out loud.",
      "",
      "*Reported in: a 60-minute online screen for a Frontend Engineer role in Hyderabad (Medium, Jul 2025).*",
    ].join("\n"),
    hints: [
      "Keep a `Map` from domain to IP for `PUT` and `GET`. A `COUNT` can then scan the keys with `d === domain || d.endsWith(\".\" + domain)`. The dot is what stops `pineapple.com` from counting under `apple.com`.",
      "For the fast version, keep a trie of labels read right to left (`com`, then `apple`, then `www`), with a counter on each node. A `PUT` of a new domain adds 1 along its path, and a `COUNT` walks to its node and reads the counter.",
      "A second `PUT` for the same domain only changes the IP. Check the map first so the trie counts it once.",
    ],
    solution: [
      "## Approach",
      "",
      "A `Map` answers `PUT` and `GET`. For `COUNT`, store each domain's labels in reverse in a trie, where every node counts the stored domains at or below it. A `PUT` of a domain not yet stored walks its reversed labels and adds 1 at each node, and a `COUNT` walks the query's reversed labels and returns that node's counter, or 0 if the path is missing. `COUNT` then costs O(labels in the query), no matter how many domains are stored.",
      "",
      "## Worth saying out loud",
      "",
      "- **Match on the label boundary.** `endsWith(\".\" + domain)` stops `pineapple.com` from counting under `apple.com`, and a bare `endsWith(domain)` gets it wrong.",
      "- The `Map` guard matters: a second `PUT` for the same domain updates the IP and must not count twice.",
      "- Domain names are case-insensitive, and a trailing dot is the DNS root. Say you'd lowercase and strip it; the tests don't need it.",
      "- Supporting deletes means decrementing along the path. A counter, rather than a flag, makes that possible.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * @param {string[][]} operations rows of [op, domain, ip]
 * @returns {string[]} outputs of the GET and COUNT rows
 */
function processDomainOperations(operations) {
  // Your code here
  return [];
}
`,
      solutionCode: `function processDomainOperations(operations) {
  const ips = new Map();
  const root = { count: 0, next: new Map() };
  const out = [];
  for (const [op, domain, ip] of operations) {
    if (op === "PUT") {
      if (!ips.has(domain)) {
        // a new domain: count it once along its reversed labels
        let node = root;
        for (const label of domain.split(".").reverse()) {
          if (!node.next.has(label)) node.next.set(label, { count: 0, next: new Map() });
          node = node.next.get(label);
          node.count++;
        }
      }
      ips.set(domain, ip);
    } else if (op === "GET") {
      out.push(ips.get(domain) ?? "404");
    } else if (op === "COUNT") {
      let node = root;
      for (const label of domain.split(".").reverse()) {
        node = node?.next.get(label);
      }
      out.push(String(node?.count ?? 0));
    }
  }
  return out;
}
`,
      entry: "processDomainOperations",
      tests: [
        { name: "The reported example", input: [REPORTED_EXAMPLE], expected: ["404", "10.20.30.40", "2", "3"] },
        { name: "Labels, not suffixes", input: [[["PUT", "pineapple.com", "1.1.1.1"], ["PUT", "apple.com", "2.2.2.2"], ["COUNT", "apple.com"]]], expected: ["1"] },
        { name: "A second PUT updates without double counting", input: [[["PUT", "a.com", "1.0.0.1"], ["PUT", "a.com", "1.0.0.2"], ["GET", "a.com"], ["COUNT", "a.com"]]], expected: ["1.0.0.2", "1"] },
        { name: "COUNT includes the domain itself", input: [[["PUT", "apple.com", "1.1.1.1"], ["PUT", "www.apple.com", "2.2.2.2"], ["COUNT", "apple.com"]]], expected: ["2"] },
        { name: "An unstored parent still counts its subdomains", input: [[["PUT", "www.apple.com", "1.1.1.1"], ["COUNT", "apple.com"], ["GET", "apple.com"]]], expected: ["1", "404"] },
        { name: "No matches gives 0", input: [[["PUT", "a.com", "1.1.1.1"], ["COUNT", "b.com"]]], expected: ["0"] },
        { name: "A longer query than any stored domain", input: [[["PUT", "apple.com", "1.1.1.1"], ["COUNT", "www.apple.com"]]], expected: ["0"] },
        { name: "Deeper subdomains count at every level", input: [[["PUT", "a.b.c.com", "1.1.1.1"], ["PUT", "b.c.com", "2.2.2.2"], ["COUNT", "c.com"], ["COUNT", "b.c.com"], ["COUNT", "a.b.c.com"]]], expected: ["2", "2", "1"] },
        { name: "No operations", input: [[]], expected: [] },
        { name: "Only PUTs output nothing", input: [[["PUT", "a.com", "1.1.1.1"], ["PUT", "b.com", "2.2.2.2"]]], expected: [] },
      ],
    },
  },
  {
    slug: "min-stack-and-multiply",
    title: "Min Stack, Then Multiply Without *",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "Constant-time `getMin` with a second stack, then multiplication by doubling and halving, including the overflow the published answer missed.",
    prompt: [
      "Two short questions from a round that was otherwise behavioral.",
      "",
      "## Part 1: `MinStack`",
      "",
      "`push(x)`, `pop()` and `getMin()`, **all O(1)**. `pop` returns the removed value. On an empty stack, `pop` and `getMin` return `undefined` (`None` in Python, where the method is `get_min`).",
      "",
      "## Part 2: `multiply(a, b)`",
      "",
      "Multiply two integers without `*`, `/`, `**` or a multiplying helper, in O(log |b|) additions. Either may be negative or zero, and `b` fits in 32 bits. The tests can't see how you multiplied, so hold yourself to the rule.",
      "",
      "*Reported in: a senior front-end loop in Hyderabad (Medium, 2022). The published answers to both had bugs, covered in the solution.*",
    ].join("\n"),
    hints: [
      "Keep a second stack holding the minimum at each depth. Every push adds `min(x, current minimum)`, and every pop removes one, so `getMin` is just its top.",
      "Multiplication is repeated doubling: for every set bit of `b`, add the matching power-of-two multiple of `a`. Double `a` with `n += n` and halve `b` with a shift.",
      "Work on absolute values and fix the sign at the end.",
    ],
    solution: [
      "## Approach",
      "",
      "The min stack stores, beside every item, the minimum of the stack up to that depth. The two stacks grow and shrink together, so every operation is O(1). `multiply` is binary long multiplication: when the low bit of `b` is set, add the current multiple of `a`, then double the multiple and halve `b`. That makes one pass per bit of `b`, so O(log |b|) additions.",
      "",
      "## Worth saying out loud",
      "",
      "- The second stack stores the minimum at each depth, not only when it changes. The \"push only on a new minimum\" variant must still push ties, or popping a duplicate minimum breaks it.",
      "- The published versions had bugs. The stack left `this.` off its fields. The multiply doubled with `n << 1`, which overflows past 2^31 because JavaScript's shifts work on 32-bit integers, and it ignored negative inputs. `n += n` doubles safely.",
      "- `m >>>= 1` needs `b` to fit in 32 bits. For larger values, use `Math.floor(m / 2)`, or `BigInt`.",
    ].join("\n"),
    judge: {
      starterCode: `class MinStack {
  push(x) {
    // Your code here
  }

  /** Remove and return the top value (undefined when empty). */
  pop() {
    // Your code here
  }

  /** The smallest value on the stack (undefined when empty). */
  getMin() {
    // Your code here
  }
}

/** a times b without *, /, ** or a multiplying helper. */
function multiply(a, b) {
  // Your code here
  return 0;
}
`,
      solutionCode: `class MinStack {
  #items = [];
  #mins = []; // the minimum at each depth

  push(x) {
    this.#items.push(x);
    const min = this.#mins.length ? this.#mins[this.#mins.length - 1] : x;
    this.#mins.push(x < min ? x : min);
  }

  pop() {
    this.#mins.pop();
    return this.#items.pop();
  }

  getMin() {
    return this.#mins[this.#mins.length - 1];
  }
}

function multiply(a, b) {
  const negative = a < 0 !== b < 0;
  let n = a < 0 ? -a : a;
  let m = b < 0 ? -b : b;
  let out = 0;
  while (m > 0) {
    if (m & 1) out += n; // this bit of m is set: add the current power-of-two multiple
    n += n; // double (n << 1 would overflow past 2^31)
    m >>>= 1; // halve
  }
  return negative ? 0 - out : out;
}
`,
      entry: "__judgeStackAndMultiply",
      driverCode: `function __judgeStackAndMultiply(kind, a, b) {
  if (kind === "multiply") {
    var product = multiply(a, b);
    return product === 0 ? 0 : product; // -0 prints as 0; only real mistakes fail
  }
  if (kind === "stack") {
    var stack = null;
    var out = [];
    for (var i = 0; i < a.length; i++) {
      if (a[i] === "MinStack") {
        stack = new MinStack();
        out.push(null);
        continue;
      }
      var result = stack[a[i]].apply(stack, b[i]);
      out.push(result === undefined ? null : result);
    }
    return out;
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        {
          name: "getMin follows pushes and pops",
          input: ["stack", ["MinStack", "push", "push", "push", "getMin", "pop", "getMin", "pop", "getMin"], [[], [5], [3], [7], [], [], [], [], []]],
          expected: [null, null, null, null, 3, 7, 3, 3, 5],
        },
        {
          name: "A repeated minimum survives one pop",
          input: ["stack", ["MinStack", "push", "push", "pop", "getMin"], [[], [2], [2], [], []]],
          expected: [null, null, null, 2, 2],
        },
        {
          name: "An empty stack gives undefined",
          input: ["stack", ["MinStack", "pop", "getMin"], [[], [], []]],
          expected: [null, null, null],
        },
        {
          name: "Negative values",
          input: ["stack", ["MinStack", "push", "push", "push", "getMin", "pop", "pop", "getMin"], [[], [-1], [-5], [3], [], [], [], []]],
          expected: [null, null, null, null, -5, 3, -5, -1],
        },
        { name: "6 times 7", input: ["multiply", 6, 7], expected: 42 },
        { name: "A negative first factor", input: ["multiply", -6, 7], expected: -42 },
        { name: "A negative second factor", input: ["multiply", 6, -7], expected: -42 },
        { name: "Two negatives", input: ["multiply", -6, -7], expected: 42 },
        { name: "Zero times 5", input: ["multiply", 0, 5], expected: 0 },
        { name: "5 times zero", input: ["multiply", 5, 0], expected: 0 },
        { name: "123456 times 7890", input: ["multiply", 123456, 7890], expected: 974067840 },
        { name: "Past 2^31 without overflow", input: ["multiply", 2147483647, 2], expected: 4294967294 },
        { name: "A 31-bit multiplier", input: ["multiply", 1, 2147483647], expected: 2147483647 },
      ],
    },
  },
  {
    slug: "screen-warm-ups",
    title: "Five Warm-Ups: toInt, sumTo, sqrt, twoSum, fibonacci",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "The easy question from five different screens: parse without parsing, recurse, binary-search a root, Two Sum, and a Fibonacci that stays exact.",
    prompt: [
      "Each of these was the easy question in a screen. Write all five:",
      "",
      "- `toInt(str)`: `\"1234\"` to `1234` without `parseInt`, `Number` or unary plus. An optional leading `-` or `+` is allowed. Anything else that isn't a digit, or a string with no digits, gives `NaN`. (Web Applications Engineer, 2017.)",
      "- `sumTo(n)`: the sum `n + (n - 1) + ... + 1`, **recursively**. `n <= 0` gives 0. (Senior UI Engineer, 2019.)",
      "- `sqrt(x)`: the square root without `Math.sqrt`, `Math.pow` or `** 0.5`, accurate to 6 decimal places. A negative `x` gives `NaN`. (Front End Engineer, 2021.)",
      "- `twoSum(nums, target)`: indices `[i, j]` with `i < j` of the one pair that sums to `target`, or `null`. (Frontend Engineer, 2023.)",
      "- `fibonacci()`: a generator that yields `0, 1, 1, 2, 3, 5, ...` forever, **exactly**. A Blind report mentions returning \"the first X digits of a popular sequence\" without naming it, and Fibonacci is the likely one.",
      "",
      "In Python the names are snake_case, `NaN` is `float(\"nan\")` and `null` is `None`.",
      "",
      "The JavaScript grader switches off `parseInt`, `parseFloat`, `Math.sqrt` and `Math.pow` where they would give the answer away. The Python grader switches off `math.sqrt`. Hold yourself to the rest of the rules. The grader compares `sqrt` results to 6 decimal places, and takes as many Fibonacci values as each test needs.",
      "",
      "*Reported in: Glassdoor (2017 to 2023) and Blind.*",
    ].join("\n"),
    hints: [
      "`toInt`: map each digit character to its value through a lookup table and accumulate `n = n * 10 + d`. Handle the sign first and reject everything else.",
      "`sqrt`: binary-search between 0 and `max(1, x)`. The `max` matters for `x < 1`, whose root is larger than `x`. Loop a fixed number of times rather than `while (hi - lo > epsilon)`, which never ends for large inputs.",
      "`fibonacci`: past the 78th term, JavaScript numbers lose precision. Use `BigInt` (`0n`, `1n`), or Python's integers, which never overflow.",
    ],
    solution: [
      "## Approach",
      "",
      "- `toInt` validates while it accumulates: sign, then digits from a lookup table, with `NaN` on anything else.",
      "- `sumTo` is the textbook recursion with a base case at `n <= 0`.",
      "- `sqrt` binary-searches the answer in `[0, max(1, x)]` for a fixed 200 rounds, which pins a double down completely.",
      "- `twoSum` makes one pass with a map from value to index, looking up `target - value` before storing each value.",
      "- `fibonacci` is an infinite generator over two `BigInt` values.",
      "",
      "## Worth saying out loud",
      "",
      "- **`sqrt` loops a fixed number of times.** A `while (hi - lo > epsilon)` loop never ends for large inputs, where adjacent doubles are further apart than epsilon.",
      "- **`sumTo` overflows the stack near 10,000 frames in Chrome and Node.** Safari's JavaScriptCore is the only major engine with ES2015 proper tail calls, and they need strict mode plus an accumulator, so the recursive call is the last thing the function does.",
      "- `BigInt` keeps Fibonacci exact past the 78th term, where ordinary numbers lose precision.",
      "- `twoSum` looks up before it stores, so an element can't pair with itself.",
    ].join("\n"),
    judge: {
      starterCode: `/** "1234" -> 1234 without parseInt, Number or unary plus; NaN when invalid. */
function toInt(str) {
  // Your code here
  return NaN;
}

/** n + (n - 1) + ... + 1, recursively; 0 when n <= 0. */
function sumTo(n) {
  // Your code here
  return 0;
}

/** The square root without Math.sqrt, Math.pow or ** 0.5; NaN when x < 0. */
function sqrt(x) {
  // Your code here
  return 0;
}

/** Indices [i, j], i < j, of the pair that sums to target, or null. */
function twoSum(nums, target) {
  // Your code here
  return null;
}

/** Yield 0, 1, 1, 2, 3, 5, ... forever, exactly. */
function* fibonacci() {
  // Your code here
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

const sumTo = (n) => (n <= 0 ? 0 : n + sumTo(n - 1));

function sqrt(x) {
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

function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return null;
}

function* fibonacci() {
  let [a, b] = [0n, 1n]; // BigInt: exact past the 78th term
  for (;;) {
    yield a;
    [a, b] = [b, a + b];
  }
}
`,
      entry: "__judgeWarmups",
      driverCode: `function __judgeWarmups(kind, a, b) {
  function without(owner, names, run) {
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
  }
  if (kind === "toInt") {
    var parsed = without(globalThis, ["parseInt", "parseFloat"], function () {
      return without(Number, ["parseInt", "parseFloat"], function () { return toInt(a); });
    });
    if (typeof parsed === "number" && Number.isNaN(parsed)) return "NaN";
    return parsed === 0 ? 0 : parsed;
  }
  if (kind === "sumTo") return sumTo(a);
  if (kind === "sqrt") {
    var root = without(Math, ["sqrt", "pow", "cbrt", "hypot"], function () { return sqrt(a); });
    if (typeof root !== "number") return root;
    return Number.isNaN(root) ? "NaN" : root.toFixed(6);
  }
  if (kind === "twoSum") {
    var pair = twoSum(a, b);
    return pair === undefined ? null : pair;
  }
  if (kind === "fibonacci" || kind === "fibonacciNth") {
    var it = fibonacci();
    var values = [];
    for (var i = 0; i < a; i++) {
      var step = it.next();
      if (step.done) break;
      values.push(String(step.value));
    }
    return kind === "fibonacci" ? values : values[values.length - 1];
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "toInt reads digits", input: ["toInt", "1234"], expected: 1234 },
        { name: "toInt with a minus sign", input: ["toInt", "-42"], expected: -42 },
        { name: "toInt with a plus sign", input: ["toInt", "+7"], expected: 7 },
        { name: "Leading zeros", input: ["toInt", "007"], expected: 7 },
        { name: "An empty string is NaN", input: ["toInt", ""], expected: "NaN" },
        { name: "A lone sign is NaN", input: ["toInt", "-"], expected: "NaN" },
        { name: "A stray letter is NaN", input: ["toInt", "12a"], expected: "NaN" },
        { name: "The largest safe integer", input: ["toInt", "9007199254740991"], expected: 9007199254740991 },
        { name: "sumTo(100)", input: ["sumTo", 100], expected: 5050 },
        { name: "sumTo(1)", input: ["sumTo", 1], expected: 1 },
        { name: "sumTo(0)", input: ["sumTo", 0], expected: 0 },
        { name: "A negative n sums to 0", input: ["sumTo", -5], expected: 0 },
        { name: "sqrt of a perfect square", input: ["sqrt", 16], expected: "4.000000" },
        { name: "sqrt(2)", input: ["sqrt", 2], expected: "1.414214" },
        { name: "sqrt of a value below 1", input: ["sqrt", 0.25], expected: "0.500000" },
        { name: "sqrt(0)", input: ["sqrt", 0], expected: "0.000000" },
        { name: "sqrt of a large value", input: ["sqrt", 10000000000], expected: "100000.000000" },
        { name: "sqrt of a negative is NaN", input: ["sqrt", -1], expected: "NaN" },
        { name: "twoSum finds the pair", input: ["twoSum", [2, 7, 11, 15], 9], expected: [0, 1] },
        { name: "twoSum later in the array", input: ["twoSum", [3, 2, 4], 6], expected: [1, 2] },
        { name: "twoSum with equal values", input: ["twoSum", [3, 3], 6], expected: [0, 1] },
        { name: "twoSum with no pair", input: ["twoSum", [1, 2, 3], 7], expected: null },
        { name: "The first ten Fibonacci numbers", input: ["fibonacci", 10], expected: ["0", "1", "1", "2", "3", "5", "8", "13", "21", "34"] },
        { name: "Exact past 2^53: the 80th value", input: ["fibonacciNth", 80], expected: "14472334024676221" },
        { name: "The 100th value", input: ["fibonacciNth", 100], expected: "218922995834555169026" },
      ],
    },
  },
];
