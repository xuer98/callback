import type { Problem } from "./types";

// Apple coding bank, part F: the lazy nested-list iterator and reservoir
// sampling. Same conventions as seed-apple-a.ts; the compound iterator and
// the weighted and stratified samplers live in seed-apple-o.ts.

export const appleProblemsF: Problem[] = [
  {
    slug: "lazy-nested-iterator",
    title: "Lazy Nested-List Iterator",
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
      "Calling `hasNext()` repeatedly must not consume anything.",
    ].join("\n"),
    hints: [
      "Keep a stack of iterators, one per list you are inside; memory is O(depth). Advancing means: take the next item from the top iterator, pop when it is exhausted, push when the item is itself a list, stop when it is an integer.",
      "Hold a one-element lookahead buffer so hasNext() can answer truthfully after skipping empty lists — and so peek() is later a one-liner.",
    ],
    solution: [
      "## Approach",
      "",
      "The wrong answer is flattening into a list in the constructor, and it is wrong for a reason you should say before they ask: it is O(total) memory and it does work the caller may never need. Push iterators onto a stack instead, so memory is O(depth). Keep a one-element lookahead: `advance()` walks the stack until it finds a real element or runs out, `hasNext()` just reports whether the lookahead is filled, and `next()` returns it and advances again. That is what handles `[[], [[]], [[], [3]]]` — the empties are skipped while filling the lookahead, not while answering.",
      "",
      "## Complexity",
      "",
      "O(1) amortised per element; O(depth) memory.",
      "",
      "## Worth saying out loud",
      "",
      "- **Add `remove()`?** Forces you to keep the underlying container, not just the iterator, and raises concurrent-modification semantics — the reason the question is often asked in Java.",
      "- **Make it a generator instead?** Four lines in Python with `yield from`. Show it, then note that the explicit stack is what you need when the interface is fixed by a caller you do not control.",
      "- **Peek without consuming?** The lookahead buffer is already there; `peek()` is a one-liner.",
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
          input: [["NestedIterator", "drain"], [[[[1, 1], 2, [1, 1]]], []]],
          expected: [null, [1, 1, 2, 1, 1]],
        },
        {
          name: "Arbitrarily deep empty lists",
          input: [["NestedIterator", "hasNext", "next", "hasNext"], [[[[], [[]], [[], [3]]]], [], [], []]],
          expected: [null, true, 3, false],
        },
        { name: "Empty input", input: [["NestedIterator", "hasNext"], [[[]], []]], expected: [null, false] },
        {
          name: "Interleaved hasNext and next",
          input: [
            ["NestedIterator", "hasNext", "next", "next", "hasNext", "next", "hasNext"],
            [[[1, [4, [6]]]], [], [], [], [], [], []],
          ],
          expected: [null, true, 1, 4, true, 6, false],
        },
        {
          name: "hasNext is idempotent",
          input: [["NestedIterator", "hasNext", "hasNext", "hasNext", "drain"], [[[[[7]]]], [], [], [], []]],
          expected: [null, true, true, true, [7]],
        },
      ],
    },
  },
  {
    slug: "reservoir-sampling",
    title: "Reservoir Sampling",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "One pass and O(k) memory: item i replaces a random slot with probability k/(i+1).",
    prompt: [
      "Sample `k` items **uniformly without replacement** from a stream of unknown length, in one pass and O(k) memory: `reservoirSample(items, k, random)`. Return fewer than `k` items when the stream is shorter than `k`.",
      "",
      "`random` is a function returning a uniform float in `[0, 1)`. Use **only** it for randomness (derive integers as `floor(random() * m)`), so the harness can seed it and check your output statistically.",
      "",
      "```",
      "reservoirSample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, random)  ->  e.g. [7, 2, 9]",
      "```",
      "",
      "The harness runs your function thousands of times with a seeded generator and checks sizes, membership, and that every item is chosen with probability `k / n` within a tolerance — its result is `\"ok\"` or a message saying what was off.",
    ].join("\n"),
    hints: [
      "Keep the first k items. For item i (0-based, i ≥ k), draw j uniformly in [0, i] and replace slot j when j < k.",
      "Every item ends with probability k/n — prove it by induction if asked: item i is kept with probability k/(i+1), and each resident survives that step with probability i/(i+1).",
    ],
    solution: [
      "## Approach",
      "",
      "A stream of unknown length means reservoir sampling — say the name. Keep the first k items; for item i, draw a slot uniformly from `[0, i]` and replace it when the slot is inside the reservoir, which happens with probability k/(i+1).",
      "",
      "## Complexity",
      "",
      "O(n) time, O(k) space, one pass.",
      "",
      "## Worth saying out loud",
      "",
      "- **Prove it is uniform:** induction — item i is kept with probability k/(i+1), and each resident survives with probability i/(i+1), so every item ends at k/n. Then run the empirical check, which is what the harness does.",
      "- **Distribute it?** Per-shard reservoirs merge correctly only if you weight each shard by how many items it saw. Getting that wrong over-represents small shards, and it is a real production bug.",
      "- **Reproducibility?** Seed it, and store the seed alongside the eval run. An unseeded sample is an unauditable benchmark.",
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
`,
      entry: "__judgeReservoir",
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

function __judgeReservoir(items, k, trials, tolerance) {
  const random = __mulberry32(12345);
  const counts = new Map();
  const allowed = new Set(items);
  const size = Math.min(k, items.length);
  for (let t = 0; t < trials; t++) {
    const sample = reservoirSample(items, k, random);
    const problem = __checkSample(sample, size, allowed);
    if (problem) return problem;
    for (const value of sample) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const expected = items.length ? size / items.length : 0;
  for (const value of items) {
    const freq = (counts.get(value) ?? 0) / trials;
    if (Math.abs(freq - expected) > tolerance) {
      return "item " + JSON.stringify(value) + " was selected " + freq.toFixed(3) + " of the time; expected " + expected.toFixed(3) + " ± " + tolerance;
    }
  }
  return "ok";
}`,
      tests: [
        { name: "3 of 10 is uniform", input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, 12000, 0.03], expected: "ok" },
        { name: "k larger than the stream returns everything", input: [["a", "b", "c"], 5, 50, 0.001], expected: "ok" },
        { name: "k = 0", input: [[1, 2, 3], 0, 10, 0.001], expected: "ok" },
        { name: "Empty stream", input: [[], 3, 10, 0.001], expected: "ok" },
        { name: "1 of 5 is uniform", input: [["v", "w", "x", "y", "z"], 1, 10000, 0.03], expected: "ok" },
      ],
    },
  },
];
