import type { Problem } from "./types";

// Apple phone-screen bank, part E: Is Graph Bipartite, the 0/1 grammar tree,
// and the queue-based rate limiter. Same sourcing and conventions as
// seed-apple-a.ts.

export const appleProblemsE: Problem[] = [
  {
    slug: "is-graph-bipartite",
    title: "Is Graph Bipartite?",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Two-colour with BFS from every unvisited node; an odd cycle is the only way to fail.",
    prompt: [
      "Given an undirected graph with `n` nodes numbered `0` to `n - 1` and a list of edges `[u, v]`, can it be coloured with exactly two colours so that no edge joins two same-coloured nodes? The graph may be disconnected, may contain duplicate edges, and may contain a self-loop.",
      "",
      "```",
      "isBipartite(4, [[0, 1], [1, 2], [2, 3], [3, 0]])  ->  true    // an even cycle",
      "isBipartite(3, [[0, 1], [1, 2], [2, 0]])          ->  false   // an odd cycle",
      "```",
      "",
      "Reported in a Java coding round of an Apple full-stack loop, and independently in another Apple screen.",
      "",
      "## Worth asking out loud",
      "",
      "Is the graph connected — do I need to start a search from every node? Are there self-loops or duplicate edges? Should I return the two sides as well as the yes/no? Is `n` large enough that recursion depth matters?",
    ].join("\n"),
    hints: [
      "A graph is bipartite exactly when it has no odd-length cycle. Assign colour 1 to a start node and BFS, giving each neighbour the opposite colour; a neighbour that already has the same colour proves an odd cycle.",
      "The graph may be disconnected, so loop over all n nodes and start a BFS from every uncoloured one. A self-loop fails naturally: the node is its own same-coloured neighbour.",
    ],
    solution: [
      "## Approach",
      "",
      "Two words earn the credit: \"two-colouring\" and \"odd cycle\". A graph is bipartite exactly when it has no odd-length cycle — say that, then BFS from every unvisited node assigning alternating colours. Store colours as `1` and `-1` with `0` meaning unvisited: flipping is `-colour`, and there is no separate visited structure. Each edge is examined at most twice, and the disconnected case is not a bonus — looping over all `n` nodes is the requirement.",
      "",
      "## Complexity",
      "",
      "O(V + E) time, O(V + E) space for the adjacency list and colours.",
      "",
      "## Worth saying out loud",
      "",
      "- **Self-loop** makes it instantly non-bipartite — the check catches it because the node is its own same-coloured neighbour. Point that out; most solutions crash or lie here.",
      "- **DFS instead?** Fine, with the stack-depth caveat at V = 10^5.",
      "- **Return the two sides, not just true/false?** The colour array already is the partition; hand it back grouped.",
    ].join("\n"),
    judge: {
      solutionCode: `function isBipartite(n, edges) {
  const adjacent = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adjacent[u].push(v);
    adjacent[v].push(u);
  }
  const colour = new Array(n).fill(0); // 0 unvisited, 1 / -1 the two colours
  for (let start = 0; start < n; start++) {
    if (colour[start] !== 0) continue;
    colour[start] = 1;
    const queue = [start];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const v of adjacent[u]) {
        if (colour[v] === colour[u]) return false; // same side (or a self-loop)
        if (colour[v] === 0) {
          colour[v] = -colour[u];
          queue.push(v);
        }
      }
    }
  }
  return true;
}
`,
      starterCode: `/**
 * @param {number} n nodes 0..n-1
 * @param {[number, number][]} edges undirected
 * @returns {boolean}
 */
function isBipartite(n, edges) {
  // Your code here
  return false;
}
`,
      entry: "isBipartite",
      tests: [
        { name: "Even cycle", input: [4, [[0, 1], [1, 2], [2, 3], [3, 0]]], expected: true },
        { name: "Odd cycle", input: [3, [[0, 1], [1, 2], [2, 0]]], expected: false },
        { name: "Dense graph with a triangle", input: [4, [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3]]], expected: false },
        { name: "Three disconnected edges", input: [6, [[0, 1], [2, 3], [4, 5]]], expected: true },
        { name: "One component is an odd cycle", input: [5, [[0, 1], [2, 3], [3, 4], [4, 2]]], expected: false },
        { name: "Self-loop", input: [2, [[0, 0]]], expected: false },
        { name: "No edges", input: [3, []], expected: true },
        { name: "Path plus an isolated node", input: [4, [[0, 1], [1, 2]]], expected: true },
        { name: "Duplicate and reversed edges", input: [2, [[0, 1], [1, 0], [0, 1]]], expected: true },
        { name: "Star with one rim edge", input: [5, [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2]]], expected: false },
      ],
    },
  },
  {
    slug: "kth-symbol-in-grammar",
    title: "Nth Node at Level L in a 0/1 Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Never build the tree — halve recursively, or read the answer off the parity of popcount(n − 1).",
    prompt: [
      "A binary tree of 0s and 1s: the root is `0`, each left child equals its parent, and each right child is its parent flipped. Levels are numbered from `1` at the root, and positions within a level from `1` on the left. Given a level `l` and a position `n`, return that node's value.",
      "",
      "```",
      "level 1:  0",
      "level 2:  0 1",
      "level 3:  0 1 1 0",
      "level 4:  0 1 1 0 1 0 0 1",
      "",
      "kthGrammar(3, 3)  ->  1",
      "kthGrammar(4, 5)  ->  1",
      "```",
      "",
      "`l` can be 30, so the level holds half a billion nodes.",
      "",
      "This was the second problem in the ICT3 ML-platform phone screen that produced an offer — paired with the memory-bounded ballot counter, so the pair was one practical streaming problem and one pure mathematical one in the same 45 minutes.",
      "",
      "## Worth asking out loud",
      "",
      "Is the root level 0 or level 1, and are positions 1-based? How large can `l` be — is building a level out of the question? Do you want the recurrence or the closed form?",
    ].join("\n"),
    hints: [
      "Level l has 2^(l−1) nodes and its left half is level l−1 verbatim; its right half is level l−1 flipped. So if n is in the left half the answer is unchanged, otherwise it is 1 minus the answer for the mirrored position.",
      "Closed form: each right turn on the path from the root flips the value, and the right turns are exactly the set bits of n − 1. The answer is the parity of popcount(n − 1).",
    ],
    solution: [
      "## Approach",
      "",
      "Never build the tree; level 30 has half a billion nodes. Say that first. Then halve recursively: the left half of any level is the previous level, the right half is the previous level flipped, so if `n` is in the left half the answer is unchanged and otherwise it is the flip of the mirrored position — O(l) steps. The punchline is the closed form: the answer is the parity of the number of set bits in `n - 1`, because each 1 bit is one right turn on the path down and each right turn flips the value. The JavaScript reference shows the recursion and the Python reference the popcount.",
      "",
      "## Complexity",
      "",
      "O(log n) time and O(1) extra space for the closed form; O(l) recursion depth for the halving version.",
      "",
      "## Worth saying out loud",
      "",
      "- **Why popcount?** Being able to explain why the trick works is the difference between having memorised it and having derived it.",
      "- **Verify against brute force** for every level up to 11. On an index-arithmetic problem this is the fastest way to prove correctness in the room, and it costs four lines.",
      "- **Off-by-one watch:** is the root level 0 or level 1? Ask. LeetCode says 1; the reported prompt did not specify.",
    ].join("\n"),
    judge: {
      solutionCode: `// Halving: the left half of level l is level l-1, the right half is it flipped.
function kthGrammar(level, position) {
  if (level === 1) return 0;
  const half = 2 ** (level - 2);
  if (position <= half) return kthGrammar(level - 1, position);
  return 1 - kthGrammar(level - 1, position - half);
}
`,
      starterCode: `/**
 * @param {number} level 1 at the root
 * @param {number} position 1-based within the level
 * @returns {0|1}
 */
function kthGrammar(level, position) {
  // Your code here
  return 0;
}
`,
      entry: "kthGrammar",
      tests: [
        { name: "Root", input: [1, 1], expected: 0 },
        { name: "Level 2, left", input: [2, 1], expected: 0 },
        { name: "Level 2, right", input: [2, 2], expected: 1 },
        { name: "Level 3, position 3", input: [3, 3], expected: 1 },
        { name: "Level 4, position 5", input: [4, 5], expected: 1 },
        { name: "Level 4, position 8", input: [4, 8], expected: 1 },
        { name: "Level 5, position 16", input: [5, 16], expected: 0 },
        { name: "Level 30, position 1", input: [30, 1], expected: 0 },
        { name: "Level 30, last node of the left half", input: [30, 536870912], expected: 1 },
        { name: "Level 30, first node of the right half", input: [30, 536870913], expected: 1 },
        { name: "Level 31, last node", input: [31, 1073741824], expected: 0 },
      ],
    },
  },
  {
    slug: "sliding-window-rate-limiter",
    title: "Rate Limiter: Sliding Window, Then Token Bucket",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "\"Using a queue\" hints at the sliding-window log; the token bucket is what you would actually ship.",
    prompt: [
      "> \"Design a rate limiter using a queue, with rate and frequency parameters.\"",
      "",
      "Reported verbatim as the third item in a single Apple phone screen, after top-k frequent and an implement-Java-iterators problem. The candidate went blank: they had not prepared design for a phone screen and found the requirements unclear. Time is passed in explicitly, so nothing here depends on the clock.",
      "",
      "## Phase 1 — `SlidingWindowLimiter(limit, window)`",
      "",
      "`allow(key, now)` admits a request when fewer than `limit` requests for `key` were admitted in the window `(now - window, now]`, and records it. Rejected requests are not recorded. Keys are independent.",
      "",
      "```",
      "limiter = SlidingWindowLimiter(2, 10)",
      "limiter.allow(\"k\", 0)   ->  true",
      "limiter.allow(\"k\", 1)   ->  true",
      "limiter.allow(\"k\", 2)   ->  false   // two already inside (-8, 2]",
      "limiter.allow(\"k\", 10)  ->  true    // the request at 0 has aged out",
      "```",
      "",
      "## Phase 2 — `TokenBucket(capacity, rate)`",
      "",
      "Each key starts with a full bucket of `capacity` tokens the first time it is seen. Tokens refill continuously at `rate` per unit of time, never exceeding `capacity`. `allow(key, now, cost = 1)` refills the bucket to `now`, then admits and deducts `cost` if at least `cost` tokens are available; a rejected request keeps its (refilled) balance.",
      "",
      "```",
      "bucket = TokenBucket(3, 1)",
      "bucket.allow(\"k\", 0); bucket.allow(\"k\", 0); bucket.allow(\"k\", 0)   ->  true, true, true",
      "bucket.allow(\"k\", 0)     ->  false",
      "bucket.allow(\"k\", 1)     ->  true    // one token refilled",
      "bucket.allow(\"k\", 100, 2)  ->  true  // back at capacity, cost 2",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Is the window inclusive at the old edge? Is `now` monotonic per key? Do rejected requests count against the window? Per key or global? What should a rejected caller be told?",
    ].join("\n"),
    hints: [
      "Sliding window: keep a queue of admitted timestamps per key. On each call, pop from the front while the oldest timestamp is at or before now − window; admit if the queue is shorter than the limit and push now.",
      "Token bucket: store (tokens, lastSeen) per key. Refill with min(capacity, tokens + (now − lastSeen) × rate), then compare against the cost. Both structures grow one entry per key — say how you would expire idle keys.",
    ],
    solution: [
      "## Approach",
      "",
      "\"Using a queue\" is a hint at the sliding-window log: a deque of admitted timestamps per key, evict anything older than the window, admit if the length is under the limit. Write that, then say the sentence that wins the round: \"this is O(limit) memory per key and it cannot absorb bursts — in production I would ship a token bucket, which is O(1) per key.\" Then write the bucket too; it is eight lines. Each key's state is `(tokens, lastSeen)`; a call refills proportionally to the elapsed time, caps at capacity, and admits when the balance covers the cost.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per call for both. Sliding window: O(limit) memory per key. Token bucket: O(1) per key.",
      "",
      "## Worth saying out loud",
      "",
      "- **Make it distributed?** State moves to Redis as `(tokens, lastSeen)`, and the read-modify-write must be atomic — a Lua script or `INCR` with a TTL, not GET-then-SET. If you say \"otherwise two nodes both see one token left and both admit\", you have named the actual bug.",
      "- **Fixed window instead?** Cheapest, but allows 2× the limit across a boundary. That concrete failure is the reason sliding windows exist.",
      "- **What do you return when you reject?** HTTP 429 with `Retry-After`. Answering in HTTP rather than booleans reads as someone who has shipped one.",
      "- **Memory leak:** both structures grow a dict entry per key forever. Say it, and fix it with a TTL or an LRU.",
    ].join("\n"),
    judge: {
      solutionCode: `// Sliding-window log: exactly limit admissions per window, O(limit) memory per key.
class SlidingWindowLimiter {
  constructor(limit, window) {
    this.limit = limit;
    this.window = window;
    this.log = new Map(); // key -> admitted timestamps, oldest first
  }

  allow(key, now) {
    const queue = this.log.get(key) ?? [];
    let head = 0;
    while (head < queue.length && queue[head] <= now - this.window) head++;
    const live = queue.slice(head);
    if (live.length < this.limit) {
      live.push(now);
      this.log.set(key, live);
      return true;
    }
    this.log.set(key, live);
    return false;
  }
}

// Token bucket: bursts up to capacity, refills at rate per unit time, O(1) per key.
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
      starterCode: `class SlidingWindowLimiter {
  /** At most \`limit\` admissions per key within any (now - window, now]. */
  constructor(limit, window) {
    this.limit = limit;
    this.window = window;
  }

  /** @returns {boolean} whether the request at time \`now\` is admitted */
  allow(key, now) {
    return false;
  }
}

class TokenBucket {
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
  let limiter = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op === "SlidingWindowLimiter") {
      limiter = new SlidingWindowLimiter(...args[i]);
      out.push(null);
    } else if (op === "TokenBucket") {
      limiter = new TokenBucket(...args[i]);
      out.push(null);
    } else {
      out.push(limiter[op](...args[i]));
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Sliding window: prompt example",
          input: [
            ["SlidingWindowLimiter", "allow", "allow", "allow", "allow", "allow", "allow"],
            [[2, 10], ["k", 0], ["k", 1], ["k", 2], ["k", 10], ["k", 11], ["k", 12]],
          ],
          expected: [null, true, true, false, true, true, false],
        },
        {
          name: "Sliding window: keys are independent",
          input: [
            ["SlidingWindowLimiter", "allow", "allow", "allow", "allow"],
            [[1, 5], ["a", 0], ["a", 1], ["b", 1], ["a", 5]],
          ],
          expected: [null, true, false, true, true],
        },
        {
          name: "Sliding window: rejected requests are not recorded",
          input: [
            ["SlidingWindowLimiter", "allow", "allow", "allow", "allow", "allow"],
            [[1, 10], ["k", 0], ["k", 3], ["k", 6], ["k", 9], ["k", 10]],
          ],
          expected: [null, true, false, false, false, true],
        },
        {
          name: "Token bucket: prompt example",
          input: [
            ["TokenBucket", "allow", "allow", "allow", "allow", "allow", "allow", "allow", "allow", "allow", "allow"],
            [[3, 1], ["k", 0], ["k", 0], ["k", 0], ["k", 0], ["k", 1], ["k", 1.5], ["k", 2], ["k", 100], ["k", 100, 2], ["k", 100]],
          ],
          expected: [null, true, true, true, false, true, false, true, true, true, false],
        },
        {
          name: "Token bucket: a cost above capacity never passes",
          input: [["TokenBucket", "allow", "allow"], [[3, 1], ["k", 0, 5], ["k", 1000, 5]]],
          expected: [null, false, false],
        },
        {
          name: "Token bucket: keys start full independently",
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
