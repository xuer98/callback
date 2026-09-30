import type { Problem } from "./types";

// Apple coding bank, part O: the compound iterator, weighted sampling (A-Res)
// and stratified sampling with largest-remainder allocation. Python variants
// live in seed-python-apple-d.ts.

export const appleProblemsO: Problem[] = [
  {
    slug: "compound-iterator",
    title: "Compound Iterator",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Chain iterables behind hasNext/next with a lookahead that skips the empty ones.",
    prompt: [
      "Chain any number of iterables into one iterator with a `hasNext()` / `next()` interface: `CompoundIterator(...iterables)` yields every element of the first iterable, then the second, and so on, skipping the empty ones. Calling `hasNext()` repeatedly must not consume anything.",
      "",
      "```",
      "it = CompoundIterator([1, 2], [], [3], [], [], [4, 5])   ->  1, 2, 3, 4, 5",
      "```",
    ].join("\n"),
    hints: [
      "Keep a queue of iterators. Advancing takes the next element from the front iterator and drops iterators as they run out.",
      "Fill a one-element lookahead in the constructor and after every next(); hasNext() only reports whether it is filled, so asking twice never skips anything.",
    ],
    solution: [
      "## Approach",
      "",
      "A queue of the underlying iterators plus a one-element lookahead. `advance()` pulls from the front iterator, dropping it when it is exhausted, until it finds an element or the queue is empty. `hasNext()` reports whether the lookahead is filled, and `next()` returns it and advances again — so empty iterables are skipped while filling the lookahead, and `hasNext()` is side-effect free.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per element, O(k) memory for k iterables.",
      "",
      "## Worth saying out loud",
      "",
      "- **Why a lookahead?** Without it, `hasNext()` has to peek into the next non-empty iterable, and most iterator protocols can't un-read an element.",
      "- **As a generator?** `for it in iterables: yield from it` — show it, then note the explicit class is what a fixed `hasNext`/`next` interface needs.",
      "- **Round-robin instead of one after another?** Rotate the queue after each element instead of draining the front iterator.",
    ].join("\n"),
    judge: {
      solutionCode: `// Chain k flat iterables, skipping empty ones; the same lookahead idea.
class CompoundIterator {
  constructor(...iterables) {
    this.queue = iterables.map((it) => it[Symbol.iterator]());
    this.lookahead = undefined;
    this.filled = false;
    this.advance();
  }

  advance() {
    this.filled = false;
    while (this.queue.length > 0) {
      const step = this.queue[0].next();
      if (step.done) {
        this.queue.shift();
      } else {
        this.lookahead = step.value;
        this.filled = true;
        return;
      }
    }
  }

  hasNext() {
    return this.filled;
  }

  next() {
    const value = this.lookahead;
    this.advance();
    return value;
  }
}
`,
      starterCode: `class CompoundIterator {
  /** @param {...Iterable<number>} iterables chained in order, empties skipped */
  constructor(...iterables) {
    // Your state here
  }

  hasNext() {
    return false;
  }

  next() {
    return undefined;
  }
}
`,
      entry: "__runOperations",
      // "drain" pulls everything through hasNext/next to keep long tests readable.
      driverCode: `function __runOperations(operations, args) {
  let iterator = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op === "CompoundIterator") {
      iterator = new CompoundIterator(...args[i][0]);
      out.push(null);
    } else if (op === "drain") {
      const drained = [];
      while (iterator.hasNext()) drained.push(iterator.next());
      out.push(drained);
    } else {
      out.push(iterator[op](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [["CompoundIterator", "drain"], [[[[1, 2], [], [3], [], [], [4, 5]]], []]],
          expected: [null, [1, 2, 3, 4, 5]],
        },
        { name: "All empty", input: [["CompoundIterator", "hasNext"], [[[[], []]], []]], expected: [null, false] },
        {
          name: "hasNext does not consume",
          input: [["CompoundIterator", "hasNext", "hasNext", "next", "hasNext", "hasNext"], [[[[7]]], [], [], [], [], []]],
          expected: [null, true, true, 7, false, false],
        },
        { name: "No iterables", input: [["CompoundIterator", "hasNext"], [[[]], []]], expected: [null, false] },
        {
          name: "Leading empties",
          input: [["CompoundIterator", "next", "next", "hasNext"], [[[[], [], [8, 9]]], [], [], []]],
          expected: [null, 8, 9, false],
        },
      ],
    },
  },
  {
    slug: "weighted-sampling",
    title: "Weighted Sampling Without Replacement",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary: "A-Res: key each item by random()^(1/weight) and keep the k largest keys.",
    prompt: [
      "`items` is a list of `[value, weight]` pairs. `weightedSample(items, k, random)` returns `k` **distinct** values chosen so that each value's chance of inclusion follows its weight — heavier values are picked more often, and with `k = 1` each value's probability is its weight over the total. Values with weight `<= 0` are never chosen; return fewer than `k` when fewer are eligible.",
      "",
      "`random` is a function returning a uniform float in `[0, 1)`. Use **only** it for randomness, so the harness can seed it and check your output statistically.",
      "",
      "```",
      "weightedSample([[\"a\", 1], [\"b\", 2], [\"c\", 3], [\"d\", 4], [\"z\", 0]], 1, random)",
      "  ->  \"d\" about 40% of the time, \"a\" about 10%, \"z\" never",
      "```",
      "",
      "The harness runs your function thousands of times with a seeded generator and checks sizes, membership, single-draw frequencies, and that a lighter value is never picked more often than a heavier one — its result is `\"ok\"` or a message saying what was off.",
    ].join("\n"),
    hints: [
      "Drawing one value at a time and removing it works but is fiddly. A-Res does it in one pass: give each item the key random()^(1/weight) and keep the k items with the largest keys.",
      "Skip items with weight <= 0 before drawing their keys. A size-k min-heap keyed on the A-Res key makes it streaming.",
    ],
    solution: [
      "## Approach",
      "",
      "Efraimidis–Spirakis A-Res: draw one key per item, `u^(1/w)` with `u` uniform, and keep the k items with the largest keys. Heavier weights push the key toward 1, so they win more often, and taking the top k at once gives sampling without replacement in the right proportions. A sort is fine for the room; a min-heap of size k is the streaming version.",
      "",
      "## Complexity",
      "",
      "O(n log n) with a sort, O(n log k) with a heap; O(k) space for the heap.",
      "",
      "## Worth saying out loud",
      "",
      "- **Why not normalize and draw k times?** Each draw has to remove the winner and renormalize — O(nk), and easy to get subtly wrong. The key trick needs one pass.",
      "- **Weights as probabilities or arbitrary positives?** A-Res doesn't care; only ratios matter.",
      "- **For an eval set,** weighted sampling tilts toward what you care about, but record the weights so metrics can be re-weighted back to the population.",
    ].join("\n"),
    judge: {
      solutionCode: `// A-Res: keep the k items with the largest random()^(1/weight).
function weightedSample(items, k, random) {
  const keyed = [];
  for (const [value, weight] of items) {
    if (weight > 0) keyed.push([Math.pow(random(), 1 / weight), value]);
  }
  keyed.sort((a, b) => b[0] - a[0]); // a size-k min-heap is the streaming version
  return keyed.slice(0, k).map((entry) => entry[1]);
}
`,
      starterCode: `/**
 * @param {[*, number][]} items [value, weight] pairs; weight <= 0 is never chosen
 * @param {number} k
 * @param {() => number} random uniform in [0, 1) — the only randomness you may use
 * @returns {Array} k distinct values with inclusion probability following the weights
 */
function weightedSample(items, k, random) {
  // Your code here
  return [];
}
`,
      entry: "__judgeWeighted",
      // Seeded generator plus frequency checks; the verdict is "ok" or what was off.
      driverCode: `function __mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function __checkSample(sample, size, allowed) {
  if (!Array.isArray(sample)) return "expected an array, got " + typeof sample;
  if (sample.length !== size) return "expected a sample of size " + size + ", got " + sample.length;
  const seen = new Set();
  for (const value of sample) {
    if (!allowed.has(value)) return "sample contains " + JSON.stringify(value) + ", which was not eligible";
    if (seen.has(value)) return "sample repeats " + JSON.stringify(value);
    seen.add(value);
  }
  return null;
}

function __judgeWeighted(items, k, trials, tolerance) {
  const random = __mulberry32(12345);
  const counts = new Map();
  const positive = items.filter((pair) => pair[1] > 0);
  const allowed = new Set(positive.map((pair) => pair[0]));
  const size = Math.min(k, positive.length);
  for (let t = 0; t < trials; t++) {
    const sample = weightedSample(items, k, random);
    const problem = __checkSample(sample, size, allowed);
    if (problem) return problem;
    for (const value of sample) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const total = positive.reduce((sum, pair) => sum + pair[1], 0);
  for (const [value, weight] of positive) {
    const freq = (counts.get(value) ?? 0) / trials;
    if (k === 1 && Math.abs(freq - weight / total) > tolerance) {
      return "item " + JSON.stringify(value) + " was selected " + freq.toFixed(3) + " of the time; expected " + (weight / total).toFixed(3) + " ± " + tolerance;
    }
    for (const [other, otherWeight] of positive) {
      if (otherWeight < weight && (counts.get(other) ?? 0) / trials > freq + tolerance) {
        return "lighter item " + JSON.stringify(other) + " was selected more often than heavier " + JSON.stringify(value);
      }
    }
  }
  return "ok";
}`,
      tests: [
        {
          name: "Single draw follows the weights; zero weight never appears",
          input: [[["a", 1], ["b", 2], ["c", 3], ["d", 4], ["z", 0]], 1, 12000, 0.03],
          expected: "ok",
        },
        {
          name: "Two draws stay distinct and monotone in weight",
          input: [[["a", 1], ["b", 5], ["c", 20], ["z", 0]], 2, 4000, 0.05],
          expected: "ok",
        },
        { name: "k larger than the eligible items", input: [[["a", 1], ["b", 0], ["c", 2]], 5, 50, 0.001], expected: "ok" },
        { name: "Nothing eligible", input: [[["a", 0], ["b", -1]], 2, 10, 0.001], expected: "ok" },
      ],
    },
  },
  {
    slug: "stratified-sampling",
    title: "Stratified Sampling with Largest-Remainder Allocation",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary: "Floor each proportional share, give leftovers to the largest remainders, sample within each stratum.",
    prompt: [
      "`items` is a list of `[value, stratum]` pairs — think evaluation examples tagged by locale. `stratifiedSample(items, n, random)` returns `n` values whose strata keep the original proportions, chosen uniformly within each stratum, in any order.",
      "",
      "Allocate `n` proportionally to stratum size using **largest-remainder rounding**: floor every exact share, then hand the leftover slots, one each, to the strata with the largest fractional parts, ties broken by stratum name ascending.",
      "",
      "```",
      "100 items: 50 \"en\", 30 \"fr\", 15 \"de\", 5 \"ja\";  n = 10",
      "exact shares 5, 3, 1.5, 0.5  ->  floors 5, 3, 1, 0  ->  one slot left  ->  \"de\" (remainder .5, before \"ja\" by name)",
      "allocation: en 5, fr 3, de 2, ja 0",
      "```",
      "",
      "`random` is a function returning a uniform float in `[0, 1)`. Use **only** it for randomness, so the harness can seed it and check your output statistically. The harness runs your function thousands of times and checks sizes, membership, each stratum's count, and per-item frequencies — its result is `\"ok\"` or a message saying what was off.",
    ].join("\n"),
    hints: [
      "Group the values by stratum, compute each exact share size × n / total, and floor it.",
      "The shortfall n − sum(floors) goes one slot each to the strata with the largest remainders (name ascending on ties). Then draw each stratum's allocation uniformly — a reservoir sample per stratum works.",
    ],
    solution: [
      "## Approach",
      "",
      "Uniform sampling of a skewed corpus gives a benchmark that cannot see its smallest strata, so allocate first. Group by stratum, compute exact proportional shares, floor them, and hand the shortfall to the largest remainders (ties by name so the result is deterministic). Then sample uniformly inside each stratum with its allocation — the reference reuses reservoir sampling.",
      "",
      "## Complexity",
      "",
      "O(n) grouping, O(s log s) to rank s strata by remainder, plus the per-stratum samples.",
      "",
      "## Worth saying out loud",
      "",
      "- Largest-remainder rounding is what makes the strata sum to exactly n; flooring everything silently loses items, and rounding each share independently can overshoot.",
      "- A minimum-one-per-stratum rule is the next requirement when small strata must stay visible — take those slots first, then allocate the rest proportionally.",
      "- **Reproducibility?** Seed it and store the seed alongside the eval run.",
    ].join("\n"),
    judge: {
      solutionCode: `// Uniform k-sample from a stream of unknown length: O(k) memory, one pass.
function reservoirSample(items, k, random) {
  const reservoir = [];
  let i = 0;
  for (const item of items) {
    if (i < k) reservoir.push(item);
    else {
      const j = Math.floor(random() * (i + 1));
      if (j < k) reservoir[j] = item;
    }
    i++;
  }
  return reservoir;
}

// Proportional allocation with largest-remainder rounding, then uniform within each stratum.
function stratifiedSample(items, n, random) {
  const strata = new Map();
  for (const [value, stratum] of items) {
    if (!strata.has(stratum)) strata.set(stratum, []);
    strata.get(stratum).push(value);
  }
  const names = [...strata.keys()].sort();
  const exact = names.map((name) => (strata.get(name).length * n) / items.length);
  const allocation = exact.map(Math.floor);
  const shortfall = n - allocation.reduce((sum, a) => sum + a, 0);
  const byRemainder = names
    .map((name, i) => i)
    .sort((a, b) => exact[b] - allocation[b] - (exact[a] - allocation[a]) || (names[a] < names[b] ? -1 : 1));
  for (const i of byRemainder.slice(0, shortfall)) allocation[i]++;
  const out = [];
  names.forEach((name, i) => out.push(...reservoirSample(strata.get(name), allocation[i], random)));
  return out;
}
`,
      starterCode: `/**
 * @param {[*, string][]} items [value, stratum] pairs
 * @param {number} n total sample size, allocated by largest-remainder rounding
 * @param {() => number} random uniform in [0, 1) — the only randomness you may use
 * @returns {Array} the chosen values, any order
 */
function stratifiedSample(items, n, random) {
  // Your code here
  return [];
}
`,
      entry: "__judgeStratified",
      // Seeded generator plus frequency checks; the verdict is "ok" or what was off.
      // spec is [[stratum, size], ...]; values are stratum-1 .. stratum-size.
      driverCode: `function __mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function __checkSample(sample, size, allowed) {
  if (!Array.isArray(sample)) return "expected an array, got " + typeof sample;
  if (sample.length !== size) return "expected a sample of size " + size + ", got " + sample.length;
  const seen = new Set();
  for (const value of sample) {
    if (!allowed.has(value)) return "sample contains " + JSON.stringify(value) + ", which was not eligible";
    if (seen.has(value)) return "sample repeats " + JSON.stringify(value);
    seen.add(value);
  }
  return null;
}

function __judgeStratified(spec, k, trials, tolerance) {
  const random = __mulberry32(12345);
  const counts = new Map();
  const items = [];
  const sizes = new Map();
  for (const [stratum, size] of spec) {
    sizes.set(stratum, size);
    for (let i = 1; i <= size; i++) items.push([stratum + "-" + i, stratum]);
  }
  const names = [...sizes.keys()].sort();
  const exact = names.map((name) => (sizes.get(name) * k) / items.length);
  const allocation = exact.map(Math.floor);
  const shortfall = k - allocation.reduce((sum, a) => sum + a, 0);
  names
    .map((name, i) => i)
    .sort((a, b) => exact[b] - allocation[b] - (exact[a] - allocation[a]) || (names[a] < names[b] ? -1 : 1))
    .slice(0, shortfall)
    .forEach((i) => allocation[i]++);
  const allowed = new Set(items.map((pair) => pair[0]));
  for (let t = 0; t < trials; t++) {
    const sample = stratifiedSample(items, k, random);
    const problem = __checkSample(sample, k, allowed);
    if (problem) return problem;
    const perStratum = new Map();
    for (const value of sample) {
      const stratum = value.slice(0, value.lastIndexOf("-"));
      perStratum.set(stratum, (perStratum.get(stratum) ?? 0) + 1);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    for (let i = 0; i < names.length; i++) {
      if ((perStratum.get(names[i]) ?? 0) !== allocation[i]) {
        return "stratum " + names[i] + " got " + (perStratum.get(names[i]) ?? 0) + " items; largest-remainder allocation is " + allocation[i];
      }
    }
  }
  for (const [value, stratum] of items) {
    const expected = allocation[names.indexOf(stratum)] / sizes.get(stratum);
    const freq = (counts.get(value) ?? 0) / trials;
    if (Math.abs(freq - expected) > tolerance) {
      return "item " + value + " was selected " + freq.toFixed(3) + " of the time; expected " + expected.toFixed(3) + " ± " + tolerance;
    }
  }
  return "ok";
}`,
      tests: [
        {
          name: "Prompt example allocation (en 5, fr 3, de 2, ja 0)",
          input: [[["en", 50], ["fr", 30], ["de", 15], ["ja", 5]], 10, 3000, 0.05],
          expected: "ok",
        },
        { name: "Exact shares", input: [[["en", 20], ["fr", 20]], 4, 2000, 0.05], expected: "ok" },
        { name: "n = 0", input: [[["en", 3], ["fr", 2]], 0, 5, 0.001], expected: "ok" },
        { name: "Name breaks a remainder tie", input: [[["b", 1], ["a", 1]], 1, 2000, 0.05], expected: "ok" },
      ],
    },
  },
];
