import type { Problem } from "./types";

// Apple phone-screen bank, part F: lazy/compound iterators and sampling that
// preserves a distribution. Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsF: Problem[] = [
  {
    slug: "lazy-nested-iterator",
    title: "Lazy and Compound Iterators",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Flatten behind hasNext/next with O(depth) memory — and survive [[], [[]], [[], [3]]].",
    prompt: [
      "Flatten a nested list behind an iterator interface — `hasNext()` and `next()` — **lazily**: do not flatten everything in the constructor. Elements are integers or lists, nested arbitrarily deep.",
      "",
      "```",
      "it = NestedIterator([[1, 1], 2, [1, 1]])",
      "// next() until hasNext() is false  ->  1, 1, 2, 1, 1",
      "",
      "it = NestedIterator([[], [[]], [[], [3]]])",
      "it.hasNext()  ->  true      // must skip arbitrarily deep empty nesting",
      "it.next()     ->  3",
      "it.hasNext()  ->  false",
      "```",
      "",
      "## Phase 2 — `CompoundIterator(...iterables)`",
      "",
      "Chain any number of flat iterables into one iterator with the same `hasNext()` / `next()` interface, skipping the empty ones. Calling `hasNext()` repeatedly must not consume anything.",
      "",
      "```",
      "it = CompoundIterator([1, 2], [], [3], [], [], [4, 5])   ->  1, 2, 3, 4, 5",
      "```",
      "",
      "\"Implement Java iterators\" is reported in an Apple phone screen alongside top-k frequent; \"implement a compound iterator\" appears independently in an Apple technical-screen list. Two sources, same shape — and for a scorer library, iterators over eval records are the daily object.",
      "",
      "## Worth asking out loud",
      "",
      "Can I flatten eagerly, or must memory stay O(depth)? Can nested lists be empty at any depth? Is `hasNext()` allowed to do work (advance past empties)? Is `remove()` or `peek()` coming?",
    ].join("\n"),
    hints: [
      "Keep a stack of iterators, one per list you are inside; memory is O(depth). Advancing means: take the next item from the top iterator, pop when it is exhausted, push when the item is itself a list, stop when it is an integer.",
      "Hold a one-element lookahead buffer so hasNext() can answer truthfully after skipping empty lists — and so peek() is later a one-liner. The compound iterator is the same loop over a queue of iterators.",
    ],
    solution: [
      "## Approach",
      "",
      "The wrong answer is flattening into a list in the constructor, and it is wrong for a reason you should say before they ask: it is O(total) memory and it does work the caller may never need. Push iterators onto a stack instead, so memory is O(depth). Both classes keep a one-element lookahead: `advance()` walks the stack (or the queue of iterables) until it finds a real element or runs out, `hasNext()` just reports whether the lookahead is filled, and `next()` returns it and advances again. That is what handles `[[], [[]], [[], [3]]]` — the empties are skipped while filling the lookahead, not while answering.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per element; O(depth) memory for the nested iterator, O(k) for the compound one over k iterables.",
      "",
      "## Worth saying out loud",
      "",
      "- **Add `remove()`?** Forces you to keep the underlying container, not just the iterator, and raises concurrent-modification semantics. This is the Java version of the question and the reason it gets asked in Java.",
      "- **Make it a generator instead?** Four lines in Python with `yield from`. Show it, then note that the explicit stack is what you need when the interface is fixed by a caller you do not control.",
      "- **Peek without consuming?** The lookahead buffer is already there; `peek()` is a one-liner. Say so.",
    ].join("\n"),
    judge: {
      solutionCode: `// Lazy: a stack of iterators (O(depth)) plus a one-element lookahead.
class NestedIterator {
  constructor(nested) {
    this.stack = [nested[Symbol.iterator]()];
    this.lookahead = undefined;
    this.filled = false;
    this.advance();
  }

  advance() {
    this.filled = false;
    while (this.stack.length > 0) {
      const step = this.stack[this.stack.length - 1].next();
      if (step.done) {
        this.stack.pop();
      } else if (Array.isArray(step.value)) {
        this.stack.push(step.value[Symbol.iterator]());
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

// Chain k flat iterables, skipping empty ones; the same lookahead idea.
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
      starterCode: `class NestedIterator {
  /** @param {Array<number|Array>} nested integers and lists, nested arbitrarily deep */
  constructor(nested) {
    // Your state here — do not flatten eagerly
  }

  hasNext() {
    return false;
  }

  next() {
    return undefined;
  }
}

class CompoundIterator {
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
    if (op === "NestedIterator") {
      iterator = new NestedIterator(args[i][0]);
      out.push(null);
    } else if (op === "CompoundIterator") {
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
          name: "Nested: prompt example",
          input: [["NestedIterator", "drain"], [[[[1, 1], 2, [1, 1]]], []]],
          expected: [null, [1, 1, 2, 1, 1]],
        },
        {
          name: "Nested: arbitrarily deep empty lists",
          input: [["NestedIterator", "hasNext", "next", "hasNext"], [[[[], [[]], [[], [3]]]], [], [], []]],
          expected: [null, true, 3, false],
        },
        { name: "Nested: empty input", input: [["NestedIterator", "hasNext"], [[[]], []]], expected: [null, false] },
        {
          name: "Nested: interleaved hasNext and next",
          input: [
            ["NestedIterator", "hasNext", "next", "next", "hasNext", "next", "hasNext"],
            [[[1, [4, [6]]]], [], [], [], [], [], []],
          ],
          expected: [null, true, 1, 4, true, 6, false],
        },
        {
          name: "Nested: hasNext is idempotent",
          input: [["NestedIterator", "hasNext", "hasNext", "hasNext", "drain"], [[[[[7]]]], [], [], [], []]],
          expected: [null, true, true, true, [7]],
        },
        {
          name: "Compound: prompt example",
          input: [["CompoundIterator", "drain"], [[[[1, 2], [], [3], [], [], [4, 5]]], []]],
          expected: [null, [1, 2, 3, 4, 5]],
        },
        { name: "Compound: all empty", input: [["CompoundIterator", "hasNext"], [[[[], []]], []]], expected: [null, false] },
        {
          name: "Compound: hasNext does not consume",
          input: [["CompoundIterator", "hasNext", "hasNext", "next", "hasNext", "hasNext"], [[[[7]]], [], [], [], [], []]],
          expected: [null, true, true, 7, false, false],
        },
        { name: "Compound: no iterables", input: [["CompoundIterator", "hasNext"], [[[]], []]], expected: [null, false] },
      ],
    },
  },
  {
    slug: "distribution-preserving-sampling",
    title: "Sampling That Holds a Distribution",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary:
      "Reservoir, weighted reservoir (A-Res), and stratified with largest-remainder rounding — judged statistically.",
    prompt: [
      "> \"Given a dataset, sample n items while maintaining the original probability distribution.\"",
      "",
      "From the onsite of the same ICT3 ML-platform loop that produced an offer. Sampling is not a puzzle in this org — it is how evaluation sets get built.",
      "",
      "Every function takes a `random` argument: a function returning a uniform float in `[0, 1)`. Use **only** it for randomness (derive integers as `floor(random() * m)`), so the harness can seed it and check your output statistically.",
      "",
      "## Phase 1 — `reservoirSample(items, k, random)`",
      "",
      "One pass over `items` (treat it as a stream of unknown length), O(k) memory, returning `k` items chosen uniformly without replacement — fewer if the stream is shorter than `k`.",
      "",
      "## Phase 2 — `weightedSample(items, k, random)`",
      "",
      "`items` is a list of `[value, weight]` pairs. Return `k` distinct values chosen so that the inclusion probability follows the weights; values with weight `<= 0` are never chosen. (A-Res: keep the `k` items with the largest `random() ^ (1 / weight)`.)",
      "",
      "## Phase 3 — `stratifiedSample(items, n, random)`",
      "",
      "`items` is a list of `[value, stratum]` pairs. Allocate `n` proportionally to stratum size using **largest-remainder rounding** — floor every share, then hand the leftover slots to the strata with the largest fractional parts, ties broken by stratum name ascending — and choose uniformly within each stratum. Return the chosen values in any order.",
      "",
      "```",
      "100 items: 50 \"en\", 30 \"fr\", 15 \"de\", 5 \"ja\";  n = 10",
      "exact shares 5, 3, 1.5, 0.5  ->  floors 5, 3, 1, 0  ->  one slot left  ->  \"de\" (remainder .5, before \"ja\" by name)",
      "allocation: en 5, fr 3, de 2, ja 0",
      "```",
      "",
      "The harness runs each function thousands of times with a seeded generator and checks sizes, membership, and selection frequencies against tolerance — its result is `\"ok\"` or a message saying what was off.",
      "",
      "## Worth asking out loud",
      "",
      "Is the stream length known — if not, is this reservoir sampling? Weighted by what, and are weights probabilities or arbitrary positives? For an eval set, do you want stratification so the smallest locales stay visible? Must runs be reproducible — is the seed stored with the run?",
    ].join("\n"),
    hints: [
      "Reservoir: keep the first k items; for item i (0-based, i ≥ k) draw j uniformly in [0, i] and replace slot j when j < k. Every item ends with probability k/n — prove it by induction if asked.",
      "Weighted reservoir (A-Res) assigns each item the key random()^(1/weight) and keeps the k largest keys. Stratified: compute exact shares, floor, distribute the shortfall by largest remainder with a name tie-break, then reservoir-sample each stratum with its allocation.",
    ],
    solution: [
      "## Approach",
      "",
      "Ask one question first: is the stream length known? If not, this is reservoir sampling and you should say the name. Then the extension nobody prepares: weighted reservoir via A-Res, keeping the k items with the largest `u^(1/w)`. And for an eval set specifically, volunteer stratified sampling — proportional allocation per locale or capability — because uniform sampling of a skewed corpus gives you a benchmark that cannot see your smallest locales at all.",
      "",
      "Reservoir keeps the first k items and, for item i, replaces a random slot with probability k/(i+1). A-Res draws one key per item and keeps the k largest — a sort is fine for the room, a min-heap of size k is the streaming version. Stratified groups by stratum, computes exact shares, floors them, hands the shortfall to the largest remainders (ties by name so the result is deterministic), and reservoir-samples inside each stratum with its allocation.",
      "",
      "## Complexity",
      "",
      "Reservoir O(n) time, O(k) space. A-Res O(n log k) with a heap, O(k) space. Stratified O(n) grouping plus the per-stratum reservoirs.",
      "",
      "## Worth saying out loud",
      "",
      "- **Prove it is uniform:** induction — item i is kept with probability k/i, and each resident survives with probability (i−1)/i, so every item ends at k/n. Then run the empirical check, which is what the harness does.",
      "- **Distribute it?** Per-shard reservoirs merge correctly only if you weight each shard by how many items it saw. Getting that wrong over-represents small shards, and it is a real production bug.",
      "- **Reproducibility?** Seed it, and store the seed alongside the eval run. An unseeded sample is an unauditable benchmark.",
      "- Largest-remainder rounding is what makes the strata sum to exactly n; floor-everything silently loses items. A minimum-one-per-stratum rule is the follow-up when small strata must stay visible.",
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

// A-Res: keep the k items with the largest random()^(1/weight).
function weightedSample(items, k, random) {
  const keyed = [];
  for (const [value, weight] of items) {
    if (weight > 0) keyed.push([Math.pow(random(), 1 / weight), value]);
  }
  keyed.sort((a, b) => b[0] - a[0]); // a size-k min-heap is the streaming version
  return keyed.slice(0, k).map((entry) => entry[1]);
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
 * @param {Iterable<*>} items a stream of unknown length
 * @param {number} k
 * @param {() => number} random uniform in [0, 1) — the only randomness you may use
 * @returns {Array} k items chosen uniformly without replacement (fewer if the stream is shorter)
 */
function reservoirSample(items, k, random) {
  // Your code here
  return [];
}

/**
 * @param {[*, number][]} items [value, weight] pairs; weight <= 0 is never chosen
 * @returns {Array} k distinct values with inclusion probability following the weights
 */
function weightedSample(items, k, random) {
  // Your code here
  return [];
}

/**
 * @param {[*, string][]} items [value, stratum] pairs
 * @param {number} n total sample size, allocated by largest-remainder rounding
 * @returns {Array} the chosen values, any order
 */
function stratifiedSample(items, n, random) {
  // Your code here
  return [];
}
`,
      entry: "__judgeSampling",
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

function __judgeSampling(kind, spec, k, trials, tolerance) {
  const random = __mulberry32(12345);
  const counts = new Map();
  const bump = (value) => counts.set(value, (counts.get(value) ?? 0) + 1);
  if (kind === "reservoir") {
    const allowed = new Set(spec);
    const size = Math.min(k, spec.length);
    for (let t = 0; t < trials; t++) {
      const sample = reservoirSample(spec, k, random);
      const problem = __checkSample(sample, size, allowed);
      if (problem) return problem;
      sample.forEach(bump);
    }
    const expected = spec.length ? size / spec.length : 0;
    for (const value of spec) {
      const freq = (counts.get(value) ?? 0) / trials;
      if (Math.abs(freq - expected) > tolerance) {
        return "item " + JSON.stringify(value) + " was selected " + freq.toFixed(3) + " of the time; expected " + expected.toFixed(3) + " ± " + tolerance;
      }
    }
    return "ok";
  }
  if (kind === "weighted") {
    const positive = spec.filter((pair) => pair[1] > 0);
    const allowed = new Set(positive.map((pair) => pair[0]));
    const size = Math.min(k, positive.length);
    for (let t = 0; t < trials; t++) {
      const sample = weightedSample(spec, k, random);
      const problem = __checkSample(sample, size, allowed);
      if (problem) return problem;
      sample.forEach(bump);
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
  }
  // stratified: spec is [[stratum, size], ...]; values are stratum-1 .. stratum-size
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
      bump(value);
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
        { name: "Reservoir: 3 of 10 is uniform", input: ["reservoir", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, 12000, 0.03], expected: "ok" },
        { name: "Reservoir: k larger than the stream returns everything", input: ["reservoir", ["a", "b", "c"], 5, 50, 0.001], expected: "ok" },
        { name: "Reservoir: k = 0", input: ["reservoir", [1, 2, 3], 0, 10, 0.001], expected: "ok" },
        { name: "Reservoir: empty stream", input: ["reservoir", [], 3, 10, 0.001], expected: "ok" },
        {
          name: "Weighted: single draw follows the weights; zero weight never appears",
          input: ["weighted", [["a", 1], ["b", 2], ["c", 3], ["d", 4], ["z", 0]], 1, 12000, 0.03],
          expected: "ok",
        },
        {
          name: "Weighted: two draws stay distinct and monotone in weight",
          input: ["weighted", [["a", 1], ["b", 5], ["c", 20], ["z", 0]], 2, 4000, 0.05],
          expected: "ok",
        },
        {
          name: "Stratified: prompt example allocation (en 5, fr 3, de 2, ja 0)",
          input: ["stratified", [["en", 50], ["fr", 30], ["de", 15], ["ja", 5]], 10, 3000, 0.05],
          expected: "ok",
        },
        { name: "Stratified: exact shares", input: ["stratified", [["en", 20], ["fr", 20]], 4, 2000, 0.05], expected: "ok" },
        { name: "Stratified: n = 0", input: ["stratified", [["en", 3], ["fr", 2]], 0, 5, 0.001], expected: "ok" },
      ],
    },
  },
];
