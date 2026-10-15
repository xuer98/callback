import type { Problem } from "./types";

// Anduril bank, part F: the sensor network (a cycle in the undirected links,
// the number of components, and a processing order over directed links) and
// rod cutting (the base DP, a cost per cut, and a limit on pieces). Judged in
// JavaScript and Python; the Python judges live in seed-python.ts and
// seed-python-splits.ts.

const unionFind = `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False           # already connected
        self.parent[ra] = rb
        return True`;

const rodSetup = `You have a rod of length \`n\` and a price table: \`prices[i]\` is what a piece of length \`i + 1\` sells for.`;

export const andurilProblemsF: Problem[] = [
  {
    slug: "sensor-network-cycles",
    title: "Sensor Network: Detect a Cycle",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary: "Union-Find: an edge whose endpoints already share a root closes a cycle.",
    prompt: `Field sensors numbered \`0\` to \`n − 1\` are linked by **undirected** edges \`(u, v)\`. Return whether the network contains a cycle.

\`\`\`
n = 5, edges = [[0, 1], [1, 2], [2, 0]]   ->  true    (a triangle)
n = 4, edges = [[0, 1], [2, 3]]           ->  false
\`\`\`

A self-loop, or the same link listed twice, counts as a cycle.`,
    hints: [
      "Union-Find: process the edges one at a time. If both endpoints already have the same root, this edge closes a cycle.",
      "DFS works too, as long as you ignore the edge you arrived by — but a duplicate link then needs care, which Union-Find handles for free.",
    ],
    solution: `## Approach

Union-Find over the sensors. Each edge either joins two different components — no cycle yet — or connects two sensors that are already connected, which closes a cycle. A self-loop and a repeated link both fall into the second case with no special handling.

\`\`\`python
${unionFind}


def has_cycle(n, edges):
    dsu = DSU(n)
    return any(not dsu.union(u, v) for u, v in edges)
\`\`\`

O(E · α(V)) — effectively linear — and streaming-friendly: edges can arrive one at a time.

## Worth saying out loud

- "Which link do we remove to break the cycle?" is the first edge whose \`union\` fails.
- String ids → put a \`dict\` id-mapper in front of the DSU; don't rewrite it.
- Directed links change the question: a cycle there needs a back edge to a node on the current DFS path, or Kahn's algorithm leaving nodes unprocessed.`,
    judge: {
      starterCode: `/**
 * Undirected edges [u, v] over sensors 0..n-1: is there a cycle?
 * @param {number} n
 * @param {number[][]} edges
 * @returns {boolean}
 */
function hasCycle(n, edges) {
  // Your code here
  return false;
}
`,
      entry: "hasCycle",
      tests: [
        { name: "Triangle plus isolated sensors", input: [5, [[0, 1], [1, 2], [2, 0]]], expected: true },
        { name: "Two links, no cycle", input: [4, [[0, 1], [2, 3]]], expected: false },
        { name: "A duplicate link is a cycle", input: [2, [[0, 1], [1, 0]]], expected: true },
        { name: "Self-loop", input: [1, [[0, 0]]], expected: true },
        { name: "No links", input: [3, []], expected: false },
        { name: "A tree plus one edge", input: [4, [[0, 1], [1, 2], [1, 3], [3, 0]]], expected: true },
      ],
    },
  },
  {
    slug: "sensor-network-components",
    title: "Sensor Network: Count Components",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary: "Start at n components; every successful union merges two into one.",
    prompt: `Field sensors numbered \`0\` to \`n − 1\` are linked by **undirected** edges \`(u, v)\`. Return the number of **disconnected components** — groups of sensors that can reach each other through links. A sensor with no links is a component of its own.

\`\`\`
n = 5, edges = [[0, 1], [1, 2], [2, 0]]   ->  3    ({0, 1, 2}, {3}, {4})
n = 4, edges = [[0, 1], [2, 3]]           ->  2
\`\`\``,
    hints: [
      "Start with n components, one per sensor. Every edge that joins two different components reduces the count by one.",
      "Union-Find tells you whether an edge joins two different components; a BFS or DFS from each unvisited sensor works too.",
    ],
    solution: `## Approach

Every sensor starts as its own component. Union-Find processes the links; a union that merges two different roots reduces the count by one, and a link inside an existing component changes nothing.

\`\`\`python
${unionFind}


def count_components(n, edges):
    dsu = DSU(n)
    components = n
    for u, v in edges:
        if dsu.union(u, v):
            components -= 1
    return components
\`\`\`

O(E · α(V)) time, O(V) space.

## Worth saying out loud

- BFS or DFS from every unvisited sensor gives the same count in O(V + E); Union-Find wins when links stream in and the count must stay current.
- Deleting links over time is the hard direction — process deletions backwards as unions (offline reverse-union) if all operations are known up front.`,
    judge: {
      starterCode: `/**
 * Undirected edges [u, v] over sensors 0..n-1: how many components?
 * @param {number} n
 * @param {number[][]} edges
 * @returns {number}
 */
function countComponents(n, edges) {
  // Your code here
  return 0;
}
`,
      entry: "countComponents",
      tests: [
        { name: "Triangle plus isolated sensors", input: [5, [[0, 1], [1, 2], [2, 0]]], expected: 3 },
        { name: "Two links", input: [4, [[0, 1], [2, 3]]], expected: 2 },
        { name: "A duplicate link merges nothing new", input: [2, [[0, 1], [1, 0]]], expected: 1 },
        { name: "No links", input: [3, []], expected: 3 },
        { name: "Everything connected", input: [4, [[0, 1], [1, 2], [2, 3]]], expected: 1 },
      ],
    },
  },
  {
    slug: "sensor-processing-order",
    title: "Sensor Network: Processing Order",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Kahn's algorithm: peel sensors with no pending inputs; leftovers mean a cycle.",
    prompt: `Field sensors numbered \`0\` to \`n − 1\` are linked by **directed** edges \`(u, v)\`: data flows from \`u\` to \`v\`, so \`u\` must be processed before \`v\`. Return an order in which all the sensors can be processed, or an empty list when a cycle makes that impossible. Any valid order is accepted.

\`\`\`
n = 4, edges = [[0, 1], [0, 2], [1, 3], [2, 3]]   ->  [0, 1, 2, 3]  (or [0, 2, 1, 3])
n = 2, edges = [[0, 1], [1, 0]]                   ->  []
\`\`\``,
    hints: [
      "Count each sensor's incoming edges. A sensor with none can be processed now; processing it removes its outgoing edges.",
      "If you run out of sensors with no remaining inputs before placing all n, the rest sit on or behind a cycle.",
    ],
    solution: `## Approach

Kahn's algorithm. Count incoming edges per sensor, start with every sensor that has none, and repeatedly take one, append it to the order, and decrement the counts of the sensors it feeds, enqueuing any that reach zero. If the order ends up shorter than \`n\`, the remaining sensors never lost all their inputs — they are on or downstream of a cycle — so return an empty list.

\`\`\`python
from collections import deque


def topo_order(n, edges):
    adj, indeg = [[] for _ in range(n)], [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []
\`\`\`

O(V + E) time and space.

## Worth saying out loud

- The sensors Kahn's algorithm never reaches are precisely those involved in or downstream of cycles — the answer to "which sensors are stuck?"
- A three-color DFS gives the same result: a back edge to a node on the current path is a cycle, and reversed finish order is a topological order.`,
    judge: {
      starterCode: `/**
 * Directed edges [u, v] (u before v) over sensors 0..n-1: an order that
 * respects every edge, or [] when there's a cycle.
 * @param {number} n
 * @param {number[][]} edges
 * @returns {number[]}
 */
function topoOrder(n, edges) {
  // Your code here
  return [];
}
`,
      entry: "__judgeOrder",
      // Topological orders aren't unique, so the order is validated: a
      // permutation of 0..n-1 with every edge pointing forward.
      driverCode: `function __judgeOrder(n, edges) {
  const order = topoOrder(n, edges);
  if (!Array.isArray(order)) return "not a list";
  if (order.length === 0) return "empty";
  const sorted = [...order].sort((a, b) => a - b);
  if (sorted.length !== n || sorted.some((v, i) => v !== i)) return "not a permutation";
  const pos = new Map(order.map((v, i) => [v, i]));
  for (const [u, v] of edges) {
    if (pos.get(u) > pos.get(v)) return "violates edge " + u + "->" + v;
  }
  return "valid-order";
}`,
      tests: [
        { name: "Order of a chain", input: [3, [[0, 1], [1, 2]]], expected: "valid-order" },
        { name: "Order with a fork and a join", input: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], expected: "valid-order" },
        { name: "No order when cyclic", input: [2, [[0, 1], [1, 0]]], expected: "empty" },
        { name: "Self-loop", input: [1, [[0, 0]]], expected: "empty" },
        { name: "Unlinked sensors in any order", input: [3, []], expected: "valid-order" },
        { name: "A cycle further downstream", input: [4, [[0, 1], [1, 2], [2, 3], [3, 1]]], expected: "empty" },
      ],
    },
  },
  {
    slug: "rod-cutting-profit",
    title: "Rod Cutting",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Unbounded knapsack in disguise — say that out loud, then roll a 1-D table.",
    prompt: `${rodSetup} Cut the rod (or don't) to **maximize revenue**, and report the cuts: return \`[revenue, pieceLengths]\`.

\`\`\`
prices = [1, 5, 8, 9, 10, 17, 17, 20], n = 8
->  [22, [2, 6]]   (pieces 2 + 6: 5 + 17)
\`\`\`

The price table may be shorter than \`n\`: lengths beyond it can't be sold, so those pieces must be cut smaller. Any cut list that sums to \`n\` and earns the maximum is accepted.`,
    hints: [
      "best[L] = max over first-piece lengths p of prices[p-1] + best[L-p]. One dimension, filled left to right — this is unbounded knapsack with weight = length, value = price.",
      "To recover the cuts, store the winning first-piece length per L and walk it back.",
    ],
    solution: `## Approach

Classic unbounded knapsack: for each length, try every legal first piece and recurse on the remainder. The 1-D table plus a \`choice\` array (the winning first piece per length) gives both the revenue and the reconstruction.

\`\`\`python
def rod_cutting(prices, n):
    """best[L] = max revenue for length L. Returns [revenue, piece lengths]."""
    best, choice = [0] * (n + 1), [0] * (n + 1)
    for length in range(1, n + 1):
        for piece in range(1, min(length, len(prices)) + 1):
            cand = prices[piece - 1] + best[length - piece]
            if cand > best[length]:
                best[length], choice[length] = cand, piece
    cuts, rem = [], n
    while rem > 0:                          # reconstruct
        cuts.append(choice[rem])
        rem -= choice[rem]
    return [best[n], cuts]
\`\`\`

## Complexity

O(n · min(n, len(prices))) time and O(n) space. Sanity example to trace out loud: \`prices=[1,5,8,9,10,17,17,20], n=8 → 22\` from pieces 2 + 6.

## Worth saying out loud

- Name the shape — "unbounded knapsack, weight = piece length, value = price" — before writing code.
- Top-down with \`@lru_cache\` is the same recurrence; write whichever is fastest for you, mention the other.
- The table rolls to O(n) because \`best[length]\` only reads earlier entries.`,
    judge: {
      starterCode: `/**
 * [revenue, pieceLengths] for the best way to cut a rod of length n
 * (prices[i] sells a piece of length i + 1).
 * @param {number[]} prices
 * @param {number} n
 * @returns {[number, number[]]}
 */
function rodCutting(prices, n) {
  // Your code here
  return [0, []];
}
`,
      entry: "__judgeRod",
      // The cut list isn't unique (2 + 6 or 6 + 2), so it's validated: the
      // pieces must sum to n and price out to the claimed revenue.
      driverCode: `function __judgeRod(prices, n) {
  const result = rodCutting(prices, n);
  if (!Array.isArray(result) || result.length !== 2) return "expected [revenue, cuts]";
  const [revenue, cuts] = result;
  if (!Array.isArray(cuts)) return "cuts is not a list";
  let total = 0, length = 0;
  for (const piece of cuts) {
    if (!Number.isInteger(piece) || piece < 1 || piece > prices.length) return "bad piece " + piece;
    total += prices[piece - 1];
    length += piece;
  }
  return { revenue, cutsValid: length === n && total === revenue };
}`,
      tests: [
        { name: "Classic table", input: [[1, 5, 8, 9, 10, 17, 17, 20], 8], expected: { revenue: 22, cutsValid: true } },
        { name: "Nothing to cut", input: [[1, 5, 8, 9, 10, 17, 17, 20], 0], expected: { revenue: 0, cutsValid: true } },
        { name: "Price table shorter than the rod", input: [[2, 5], 5], expected: { revenue: 12, cutsValid: true } },
        { name: "Whole rod is best", input: [[1, 2, 3, 4, 50], 5], expected: { revenue: 50, cutsValid: true } },
      ],
    },
  },
  {
    slug: "rod-cutting-with-cut-cost",
    title: "Rod Cutting with a Cost per Cut",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "The rod-cutting table again, charging for every cut and seeding the whole-rod sale.",
    prompt: `${rodSetup} Every cut costs \`cutCost\`; selling the rod whole makes zero cuts, and k pieces take k − 1 cuts. Return the maximum **net profit**: total price of the pieces minus the cost of the cuts.

\`\`\`
prices = [1, 5, 8, 9, 10, 17, 17, 20], n = 8
cutCost = 0    ->  22   (pieces 2 + 6, one free cut)
cutCost = 1    ->  21   (the same cut, now costing 1)
cutCost = 100  ->  20   (sell it whole)
\`\`\`

\`prices\` has an entry for every length from 1 to \`n\`.`,
    hints: [
      "Seed best[L] with selling length L whole — zero cuts. Then every split into a first piece plus the rest adds exactly one cut.",
      "best[L] = max(prices[L-1], max over p < L of prices[p-1] − cutCost + best[L-p]). The best[L-p] term already paid for its own cuts.",
    ],
    solution: `## Approach

The unbounded-knapsack table with one change: a split pays for its cut. Start each length at its whole-rod price (no cuts), then try every first piece shorter than the rod: that piece's price, minus one cut, plus the best net profit for the remainder — which already accounts for the remainder's own cuts.

\`\`\`python
def rod_cutting_with_cost(prices, n, cut_cost):
    best = [0] * (n + 1)
    for length in range(1, n + 1):
        best[length] = prices[length - 1] if length <= len(prices) else 0
        for piece in range(1, min(length - 1, len(prices)) + 1):
            best[length] = max(best[length], prices[piece - 1] - cut_cost + best[length - piece])
    return best[n]
\`\`\`

O(n²) time, O(n) space.

## Worth saying out loud

- Seeding with the whole-rod price is what keeps "zero cuts" free; charging per piece instead would overcount by one.
- A cut cost of 0 gives back the plain rod-cutting answer — a quick sanity check.`,
    judge: {
      starterCode: `/**
 * Maximum net profit when every cut costs cutCost (selling the rod whole
 * makes zero cuts). prices[i] sells a piece of length i + 1.
 * @param {number[]} prices
 * @param {number} n
 * @param {number} cutCost
 * @returns {number}
 */
function rodCuttingWithCost(prices, n, cutCost) {
  // Your code here
  return 0;
}
`,
      entry: "rodCuttingWithCost",
      tests: [
        { name: "Cuts too expensive to make", input: [[1, 5, 8, 9, 10, 17, 17, 20], 8, 100], expected: 20 },
        { name: "Free cuts match the base answer", input: [[1, 5, 8, 9, 10, 17, 17, 20], 8, 0], expected: 22 },
        { name: "A cut cost changes the answer", input: [[1, 5, 8, 9, 10, 17, 17, 20], 8, 1], expected: 21 },
        { name: "Many cheap pieces still win", input: [[3, 4, 5, 6], 4, 1], expected: 9 },
        { name: "Length one never cuts", input: [[7], 1, 5], expected: 7 },
      ],
    },
  },
  {
    slug: "rod-cutting-limited-pieces",
    title: "Rod Cutting with at Most k Pieces",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Add a piece-count dimension: dp[k][L] builds on dp[k − 1][L − p].",
    prompt: `${rodSetup} Cut the rod into **at most \`maxPieces\` pieces** (selling it whole is one piece) to maximize revenue, and return that revenue.

\`\`\`
prices = [1, 5, 8, 9, 10, 17, 17, 20], n = 8
maxPieces = 1  ->  20   (sell it whole)
maxPieces = 2  ->  22   (pieces 2 + 6)
\`\`\`

\`prices\` has an entry for every length from 1 to \`n\`, and \`maxPieces\` is at least 1.`,
    hints: [
      "The one-dimensional table forgets how many pieces it used. Add that as a dimension: dp[k][L] is the best revenue for length L using at most k pieces.",
      "dp[k][L] = max(dp[k-1][L], max over p of dp[k-1][L-p] + prices[p-1]). Unreachable states start at negative infinity, and dp[0][0] = 0.",
    ],
    solution: `## Approach

Add the piece count as a dimension. \`dp[k][L]\` is the best revenue for exactly length \`L\` using at most \`k\` pieces: either it doesn't need the k-th piece (\`dp[k-1][L]\`), or its last piece has length \`p\` and the rest used at most \`k − 1\` pieces. Only \`dp[0][0]\` is reachable with zero pieces; everything else starts at negative infinity.

\`\`\`python
import math


def rod_cutting_limited(prices, n, max_pieces):
    NEG = -math.inf
    dp = [[NEG] * (n + 1) for _ in range(max_pieces + 1)]
    dp[0][0] = 0
    for k in range(1, max_pieces + 1):
        for length in range(n + 1):
            dp[k][length] = dp[k - 1][length]
            for piece in range(1, min(length, len(prices)) + 1):
                if dp[k - 1][length - piece] != NEG:
                    dp[k][length] = max(dp[k][length], dp[k - 1][length - piece] + prices[piece - 1])
    return dp[max_pieces][n]
\`\`\`

O(k · n²) time and O(k · n) space; only the previous row is read, so it rolls to O(n).

## Worth saying out loud

- A constraint the recurrence can't see (a piece count, a budget) becomes a state dimension — the general move for knapsack variants.
- Once \`maxPieces\` reaches \`n\`, the limit stops binding and the answer equals plain rod cutting.`,
    judge: {
      starterCode: `/**
 * Maximum revenue cutting a rod of length n into at most maxPieces pieces.
 * prices[i] sells a piece of length i + 1.
 * @param {number[]} prices
 * @param {number} n
 * @param {number} maxPieces
 * @returns {number}
 */
function rodCuttingLimited(prices, n, maxPieces) {
  // Your code here
  return 0;
}
`,
      entry: "rodCuttingLimited",
      tests: [
        { name: "At most one piece", input: [[1, 5, 8, 9, 10, 17, 17, 20], 8, 1], expected: 20 },
        { name: "Two pieces suffice", input: [[1, 5, 8, 9, 10, 17, 17, 20], 8, 2], expected: 22 },
        { name: "The limit stops the small pieces", input: [[3, 4, 5, 6], 4, 2], expected: 8 },
        { name: "Enough pieces to cut freely", input: [[3, 4, 5, 6], 4, 4], expected: 12 },
        { name: "Nothing to cut", input: [[1, 5], 0, 1], expected: 0 },
      ],
    },
  },
];
