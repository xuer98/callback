import type { Problem } from "./types";

// Apple coding bank, part N: sessionizing events, any-to-any unit conversion
// queries, and the token-bucket rate limiter. Python variants live in
// seed-python-apple-d.ts.

export const appleProblemsN: Problem[] = [
  {
    slug: "sessionize-events",
    title: "Sessionize Events by Entity",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Sort by (entity, time), then extend or open one session per entity in a single sweep.",
    prompt: [
      "`events` is an unordered list of `[entity, timestamp]` pairs. For each entity, group its events into sessions: consecutive events (in time order) that are at most `gap` apart belong to the same session. Return `{ entity: [[start, end, count], ...] }` with each entity's sessions in time order.",
      "",
      "```",
      "sessionize([[\"u1\", 1], [\"u1\", 5], [\"u1\", 30], [\"u2\", 2]], 10)",
      "  ->  { \"u1\": [[1, 5, 2], [30, 30, 1]], \"u2\": [[2, 2, 1]] }",
      "```",
      "",
      "The gap is inclusive: events exactly `gap` apart share a session.",
    ].join("\n"),
    hints: [
      "Sort by (entity, timestamp), then sweep: open a session on an entity's first event, extend it while the next timestamp is within `gap` of the session's current end, otherwise close it and open a new one.",
      "The only state per entity is its open session — the last element of its list.",
    ],
    solution: [
      "## Approach",
      "",
      "Sort the events by entity and time, walk them, and either extend the entity's open session (when the timestamp is within `gap` of its end) or start a new one. The state per entity is one open session, which is exactly what a windowed `lag()` in Spark gives you.",
      "",
      "## Complexity",
      "",
      "O(e log e) for the sort, then a linear sweep; O(e) space for the sessions.",
      "",
      "## Worth saying out loud",
      "",
      "- **Do it in Spark?** `lag()` over a window partitioned by entity and ordered by timestamp, flag rows where the gap exceeds the threshold, cumulative-sum the flags to get a session id. Name the skew risk: one hot entity puts the whole partition on one executor.",
      "- **Streaming with late-arriving events?** Watermarks. A late event can reopen a closed session, so you either bound lateness and drop, or emit a correction.",
    ].join("\n"),
    judge: {
      solutionCode: `// Sort by (entity, time), then one sweep with one open session per entity.
function sessionize(events, gap) {
  const sorted = [...events].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1],
  );
  const out = {};
  for (const [entity, ts] of sorted) {
    const sessions = (out[entity] ??= []);
    const last = sessions[sessions.length - 1];
    if (last && ts - last[1] <= gap) {
      last[1] = ts;
      last[2]++;
    } else {
      sessions.push([ts, ts, 1]);
    }
  }
  return out;
}
`,
      starterCode: `/**
 * @param {[string, number][]} events unordered [entity, timestamp] pairs
 * @param {number} gap events at most this far apart share a session
 * @returns {Record<string, [number, number, number][]>} entity -> [[start, end, count], ...]
 */
function sessionize(events, gap) {
  // Your code here
  return {};
}
`,
      entry: "sessionize",
      tests: [
        {
          name: "Prompt example",
          input: [[["u1", 1], ["u1", 5], ["u1", 30], ["u2", 2]], 10],
          expected: { u1: [[1, 5, 2], [30, 30, 1]], u2: [[2, 2, 1]] },
        },
        {
          name: "Unsorted input",
          input: [[["a", 50], ["a", 10], ["a", 20]], 10],
          expected: { a: [[10, 20, 2], [50, 50, 1]] },
        },
        {
          name: "The gap is inclusive",
          input: [[["a", 0], ["a", 10], ["a", 21]], 10],
          expected: { a: [[0, 10, 2], [21, 21, 1]] },
        },
        { name: "No events", input: [[], 5], expected: {} },
        {
          name: "Gap 0 joins only simultaneous events",
          input: [[["a", 1], ["a", 1], ["a", 2]], 0],
          expected: { a: [[1, 1, 2], [2, 2, 1]] },
        },
      ],
    },
  },
  {
    slug: "unit-conversion-queries",
    title: "Unit Conversion Queries",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary: "Convert through the base unit — and divide with a modular inverse, since you can't divide mod p.",
    prompt: [
      "There are `n` unit types, numbered `0` to `n - 1`. Each conversion `[source, target, factor]` means one unit of `source` equals `factor` units of `target`. The conversions form a tree rooted at unit `0`, and every factor is at least 1.",
      "",
      "Each query `[a, b]` asks how many units of `b` equal one unit of `a`, modulo `1_000_000_007`. Return one answer per query.",
      "",
      "```",
      "queryConversions(3, [[0, 1, 2], [1, 2, 3]], [[0, 2], [2, 0]])  ->  [6, 166666668]",
      "```",
      "",
      "One unit of 0 is 6 units of 2, so one unit of 2 is 1/6 of a unit of 0 — which is 166666668 modulo 1_000_000_007. Products can exceed 2^53 before the modulo — in JavaScript, do the arithmetic in `BigInt` (the harness converts your answers back to numbers).",
    ].join("\n"),
    hints: [
      "First compute ans[i] = units of i per one unit of 0 with one traversal from the root: ans[child] = ans[parent] × factor (mod p).",
      "One unit of a is ans[b] / ans[a] units of b — but you cannot divide under a modulus. Because p is prime, Fermat gives the inverse: ans[a]^(p−2) mod p. Multiply instead of dividing.",
    ],
    solution: [
      "## Approach",
      "",
      "Route every conversion through the base unit. One iterative DFS computes `ans[i]`, the units of `i` per unit of `0`. Then one unit of `a` is `ans[b] / ans[a]` units of `b` — and here is the catch: you cannot divide under a modulus. Say \"`ans[b] / ans[a]` becomes `ans[b] · ans[a]^-1`, and since 10^9 + 7 is prime I get the inverse from Fermat as `pow(x, p - 2, p)`.\" That sentence is the whole problem.",
      "",
      "## Complexity",
      "",
      "O(n) to build the table, O(log p) per query for the modular exponentiation; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **A general graph, not a tree?** That is the evaluate-division problem: BFS/DFS per query, or union-find with weights — and a general graph can contain an inconsistent cycle, so you need a validation pass. Raising that unprompted is a strong move.",
      "- **Round-trip check:** converting a→b then b→a must multiply to 1 mod p. It is a two-line test and it catches an inverted factor immediately.",
    ].join("\n"),
    judge: {
      solutionCode: `const MOD = 1000000007n;

function modPow(base, exp) {
  let result = 1n;
  base %= MOD;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % MOD;
    base = (base * base) % MOD;
    exp >>= 1n;
  }
  return result;
}

function baseUnitConversions(n, conversions) {
  const children = Array.from({ length: n }, () => []);
  for (const [source, target, factor] of conversions) children[source].push([target, BigInt(factor)]);
  const ans = new Array(n).fill(0n);
  ans[0] = 1n;
  const stack = [0];
  while (stack.length > 0) {
    const u = stack.pop();
    for (const [v, factor] of children[u]) {
      ans[v] = (ans[u] * factor) % MOD;
      stack.push(v);
    }
  }
  return ans;
}

// One unit of a == ans[b] * inverse(ans[a]) units of b; Fermat inverse since MOD is prime.
function queryConversions(n, conversions, queries) {
  const ans = baseUnitConversions(n, conversions);
  return queries.map(([a, b]) => (ans[b] * modPow(ans[a], MOD - 2n)) % MOD);
}
`,
      starterCode: `const MOD = 1000000007n;

/**
 * @param {number} n
 * @param {[number, number, number][]} conversions [source, target, factor]
 * @param {[number, number][]} queries [a, b] -> units of b per one unit of a
 * @returns {(bigint|number)[]}
 */
function queryConversions(n, conversions, queries) {
  // Your code here
  return queries.map(() => 0);
}
`,
      entry: "__judgeQueries",
      driverCode: `function __judgeQueries(n, conversions, queries) {
  return Array.from(queryConversions(n, conversions, queries), Number);
}`,
      tests: [
        {
          name: "Prompt example plus inverses",
          input: [3, [[0, 1, 2], [1, 2, 3]], [[0, 2], [2, 0], [1, 2], [2, 1], [0, 0]]],
          expected: [6, 166666668, 3, 333333336, 1],
        },
        {
          name: "Inverses of large factors",
          input: [3, [[0, 1, 1000000000], [1, 2, 1000000000]], [[2, 0], [1, 2], [0, 2], [2, 1]]],
          expected: [448979595, 1000000000, 49, 857142863],
        },
        {
          name: "Siblings convert through their parent",
          input: [3, [[0, 1, 2], [0, 2, 4]], [[1, 2], [2, 1]]],
          expected: [2, 500000004],
        },
        { name: "No queries", input: [2, [[0, 1, 5]], []], expected: [] },
      ],
    },
  },
  {
    slug: "token-bucket-rate-limiter",
    title: "Token-Bucket Rate Limiter",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Store (tokens, last seen) per key and refill lazily on each call — O(1) per key.",
    prompt: [
      "Implement a token-bucket rate limiter, `TokenBucket(capacity, rate)`. Time is passed in explicitly, so nothing here depends on the clock.",
      "",
      "Each key starts with a full bucket of `capacity` tokens the first time it is seen. Tokens refill continuously at `rate` per unit of time, never exceeding `capacity`. `allow(key, now, cost = 1)` refills the bucket to `now`, then admits and deducts `cost` if at least `cost` tokens are available; a rejected request keeps its (refilled) balance. Keys are independent.",
      "",
      "```",
      "bucket = TokenBucket(3, 1)",
      "bucket.allow(\"k\", 0); bucket.allow(\"k\", 0); bucket.allow(\"k\", 0)   ->  true, true, true",
      "bucket.allow(\"k\", 0)     ->  false",
      "bucket.allow(\"k\", 1)     ->  true    // one token refilled",
      "bucket.allow(\"k\", 100, 2)  ->  true  // back at capacity, cost 2",
      "```",
    ].join("\n"),
    hints: [
      "Store (tokens, lastSeen) per key. Refill lazily on each call with min(capacity, tokens + (now − lastSeen) × rate), then compare against the cost.",
      "A rejected call still updates lastSeen to now, keeping the refilled balance — otherwise the same elapsed time would be credited twice.",
    ],
    solution: [
      "## Approach",
      "",
      "No timers and no queue: each key's state is `(tokens, lastSeen)`. A call refills proportionally to the elapsed time, caps at capacity, and admits when the balance covers the cost. It absorbs bursts up to the capacity while holding the long-run rate, in O(1) memory per key — which is why it's the one you would ship.",
      "",
      "## Complexity",
      "",
      "O(1) per call, O(1) memory per key.",
      "",
      "## Worth saying out loud",
      "",
      "- **Make it distributed?** State moves to Redis as `(tokens, lastSeen)`, and the read-modify-write must be atomic — a Lua script, not GET-then-SET. If you say \"otherwise two nodes both see one token left and both admit\", you have named the actual bug.",
      "- **Compared with a sliding-window log:** the log is exact but costs O(limit) per key and can't absorb a burst; the bucket trades exactness for O(1) state.",
      "- **What do you return when you reject?** HTTP 429 with `Retry-After`, computed as `(cost − tokens) / rate`.",
      "- **Memory leak:** a dict entry per key forever. Expire idle keys with a TTL — a full bucket needs no state at all.",
    ].join("\n"),
    judge: {
      solutionCode: `// Token bucket: bursts up to capacity, refills at rate per unit time, O(1) per key.
class TokenBucket {
  constructor(capacity, rate) {
    this.capacity = capacity;
    this.rate = rate;
    this.state = new Map(); // key -> [tokens, lastSeen]
  }

  allow(key, now, cost = 1) {
    const [had, last] = this.state.get(key) ?? [this.capacity, now];
    const tokens = Math.min(this.capacity, had + (now - last) * this.rate);
    if (tokens >= cost) {
      this.state.set(key, [tokens - cost, now]);
      return true;
    }
    this.state.set(key, [tokens, now]);
    return false;
  }
}
`,
      starterCode: `class TokenBucket {
  /** Buckets start full; tokens refill at \`rate\` per unit time up to \`capacity\`. */
  constructor(capacity, rate) {
    this.capacity = capacity;
    this.rate = rate;
  }

  /** @returns {boolean} whether \`cost\` tokens were available (and deducted) */
  allow(key, now, cost = 1) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let bucket = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "TokenBucket") {
      bucket = new TokenBucket(...args[i]);
      out.push(null);
    } else {
      out.push(bucket[operations[i]](...args[i]));
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            ["TokenBucket", "allow", "allow", "allow", "allow", "allow", "allow", "allow", "allow", "allow", "allow"],
            [[3, 1], ["k", 0], ["k", 0], ["k", 0], ["k", 0], ["k", 1], ["k", 1.5], ["k", 2], ["k", 100], ["k", 100, 2], ["k", 100]],
          ],
          expected: [null, true, true, true, false, true, false, true, true, true, false],
        },
        {
          name: "A cost above capacity never passes",
          input: [["TokenBucket", "allow", "allow"], [[3, 1], ["k", 0, 5], ["k", 1000, 5]]],
          expected: [null, false, false],
        },
        {
          name: "Keys start full independently",
          input: [
            ["TokenBucket", "allow", "allow", "allow", "allow"],
            [[1, 0.5], ["a", 0], ["a", 1], ["b", 1], ["a", 2]],
          ],
          expected: [null, true, false, true, true],
        },
      ],
    },
  },
];
