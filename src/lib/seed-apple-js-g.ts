import type { Problem } from "./types";

// Apple front-end bank, part G: the domain-operation simulator, a min stack,
// and multiplication without *. The warm-ups are in seed-apple-js-l.ts.
// JavaScript judges here; the Python variants live in seed-python-apple-c.ts
// and seed-python-apple-e.ts.

const DOMAIN_EXAMPLE = [
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
      "Make `COUNT`'s cost independent of how many domains are stored — scanning every stored domain per `COUNT` is the first answer, not the goal. The tests don't time you, so say the complexity out loud.",
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
        { name: "The worked example", input: [DOMAIN_EXAMPLE], expected: ["404", "10.20.30.40", "2", "3"] },
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
    slug: "min-stack",
    title: "Min Stack",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "A second stack holds the minimum at each depth, so getMin is just its top.",
    prompt: [
      "Implement `MinStack` with `push(x)`, `pop()` and `getMin()`, **all O(1)**. `pop` returns the removed value. On an empty stack, `pop` and `getMin` return `undefined` (`None` in Python, where the method is `get_min`).",
      "",
      "```",
      "push(5); push(3); push(7)",
      "getMin()  ->  3",
      "pop()     ->  7",
      "pop()     ->  3",
      "getMin()  ->  5",
      "```",
    ].join("\n"),
    hints: [
      "Keep a second stack holding the minimum at each depth. Every push adds `min(x, current minimum)`, and every pop removes one, so `getMin` is just its top.",
    ],
    solution: [
      "## Approach",
      "",
      "Store, beside every item, the minimum of the stack up to that depth. The two stacks grow and shrink together, so every operation is O(1).",
      "",
      "## Worth saying out loud",
      "",
      "- The second stack stores the minimum at each depth, not only when it changes. The \"push only on a new minimum\" variant must still push ties, or popping a duplicate minimum breaks it.",
      "- A common bug is leaving `this.` off the fields — private `#fields` make that a syntax error instead of a silent global.",
      "- Storing pairs `(value, minSoFar)` in one stack is the same idea with one array.",
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
`,
      entry: "__runStack",
      driverCode: `function __runStack(operations, args) {
  var stack = null;
  var out = [];
  for (var i = 0; i < operations.length; i++) {
    if (operations[i] === "MinStack") {
      stack = new MinStack();
      out.push(null);
      continue;
    }
    var result = stack[operations[i]].apply(stack, args[i]);
    out.push(result === undefined ? null : result);
  }
  return out;
}`,
      tests: [
        {
          name: "getMin follows pushes and pops",
          input: [["MinStack", "push", "push", "push", "getMin", "pop", "getMin", "pop", "getMin"], [[], [5], [3], [7], [], [], [], [], []]],
          expected: [null, null, null, null, 3, 7, 3, 3, 5],
        },
        {
          name: "A repeated minimum survives one pop",
          input: [["MinStack", "push", "push", "pop", "getMin"], [[], [2], [2], [], []]],
          expected: [null, null, null, 2, 2],
        },
        {
          name: "An empty stack gives undefined",
          input: [["MinStack", "pop", "getMin"], [[], [], []]],
          expected: [null, null, null],
        },
        {
          name: "Negative values",
          input: [["MinStack", "push", "push", "push", "getMin", "pop", "pop", "getMin"], [[], [-1], [-5], [3], [], [], [], []]],
          expected: [null, null, null, null, -5, 3, -5, -1],
        },
      ],
    },
  },
  {
    slug: "multiply-without-operator",
    title: "Multiply Without *",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Binary long multiplication: add the doubled multiple for every set bit — and double with `+=`, not a 32-bit shift.",
    prompt: [
      "Multiply two integers without `*`, `/`, `**` or a multiplying helper, in O(log |b|) additions: `multiply(a, b)`. Either may be negative or zero, and `b` fits in 32 bits.",
      "",
      "```",
      "multiply(6, 7)            // 42",
      "multiply(-6, 7)           // -42",
      "multiply(2147483647, 2)   // 4294967294",
      "```",
      "",
      "The tests can't see how you multiplied, so hold yourself to the rule.",
    ].join("\n"),
    hints: [
      "Multiplication is repeated doubling: for every set bit of `b`, add the matching power-of-two multiple of `a`. Double `a` with `n += n` and halve `b` with a shift.",
      "Work on absolute values and fix the sign at the end.",
    ],
    solution: [
      "## Approach",
      "",
      "Binary long multiplication: when the low bit of `b` is set, add the current multiple of `a`, then double the multiple and halve `b`. That makes one pass per bit of `b`, so O(log |b|) additions. Signs are handled separately on absolute values.",
      "",
      "## Worth saying out loud",
      "",
      "- Doubling with `n << 1` overflows past 2^31, because JavaScript's shifts work on 32-bit integers. `n += n` doubles safely.",
      "- Ignoring negative inputs is the other common bug: take absolute values, then apply the sign.",
      "- `m >>>= 1` needs `b` to fit in 32 bits. For larger values, use `Math.floor(m / 2)`, or `BigInt`.",
    ].join("\n"),
    judge: {
      starterCode: `/** a times b without *, /, ** or a multiplying helper. */
function multiply(a, b) {
  // Your code here
  return 0;
}
`,
      solutionCode: `function multiply(a, b) {
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
      entry: "__judgeMultiply",
      driverCode: `function __judgeMultiply(a, b) {
  var product = multiply(a, b);
  return product === 0 ? 0 : product; // -0 prints as 0; only real mistakes fail
}`,
      tests: [
        { name: "6 times 7", input: [6, 7], expected: 42 },
        { name: "A negative first factor", input: [-6, 7], expected: -42 },
        { name: "A negative second factor", input: [6, -7], expected: -42 },
        { name: "Two negatives", input: [-6, -7], expected: 42 },
        { name: "Zero times 5", input: [0, 5], expected: 0 },
        { name: "5 times zero", input: [5, 0], expected: 0 },
        { name: "123456 times 7890", input: [123456, 7890], expected: 974067840 },
        { name: "Past 2^31 without overflow", input: [2147483647, 2], expected: 4294967294 },
        { name: "A 31-bit multiplier", input: [1, 2147483647], expected: 2147483647 },
      ],
    },
  },
];
