import type { Problem } from "./types";

// Apple coding bank, part G: the median of a stream, exactly with two heaps
// and in fixed memory with a histogram. Same conventions as seed-apple-a.ts;
// the evaluation metrics live in seed-apple-p.ts.

export const appleProblemsG: Problem[] = [
  {
    slug: "streaming-median",
    title: "Running Median of a Stream",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary:
      "Two heaps — a max-heap for the lower half, a min-heap for the upper — rebalanced on every add.",
    prompt: [
      "Numbers arrive one at a time. Implement `ExactStreamingMedian`: `add(x)` takes the next number; `median()` returns the median of everything added so far — the mean of the two middle values for an even count — or `null` before anything is added.",
      "",
      "```",
      "m = ExactStreamingMedian()",
      "m.add(1); m.add(2); m.add(3)",
      "m.median()   ->  2",
      "m.add(4)",
      "m.median()   ->  2.5",
      "```",
      "",
      "Both operations should beat re-sorting: O(log n) per `add`, O(1) per `median`.",
    ].join("\n"),
    hints: [
      "A max-heap for the lower half and a min-heap for the upper half, rebalanced so the lower half is the same size or one larger.",
      "The median is the lower heap's top when the count is odd, otherwise the mean of both tops.",
    ],
    solution: [
      "## Approach",
      "",
      "Two heaps. Every `add` pushes onto the lower max-heap, moves that heap's top to the upper min-heap, and moves the upper top back if the upper half grew larger — so the lower half always holds the median for an odd count, and the two tops straddle it for an even one.",
      "",
      "## Complexity",
      "",
      "O(log n) per insert, O(1) per median, O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **Name the limit:** O(n) memory. When the stream won't fit in RAM, switch to a fixed-bucket histogram with bounded error — see [Fixed-Memory Quantiles](/problems/histogram-quantile).",
      "- **Exact median, data on disk?** External merge sort, or two passes of counting on the high bits then the low bits. O(1) memory, two reads.",
      "- **Even-length trap:** the median of an even count is the mean of the two middles. Check it.",
    ].join("\n"),
    judge: {
      solutionCode: `// A binary heap parameterised by "does a come before b".
class Heap {
  constructor(before) { this.before = before; this.a = []; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(x) {
    const a = this.a;
    a.push(x);
    for (let i = a.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (!this.before(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      for (let i = 0;;) {
        const l = 2 * i + 1, r = l + 1;
        let best = i;
        if (l < a.length && this.before(a[l], a[best])) best = l;
        if (r < a.length && this.before(a[r], a[best])) best = r;
        if (best === i) break;
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return top;
  }
}

// Two heaps, O(n) memory: fine up to what fits in RAM — say this first.
class ExactStreamingMedian {
  constructor() {
    this.lower = new Heap((a, b) => a > b); // max-heap
    this.upper = new Heap((a, b) => a < b); // min-heap
  }

  add(x) {
    this.lower.push(x);
    this.upper.push(this.lower.pop());
    if (this.upper.size() > this.lower.size()) this.lower.push(this.upper.pop());
  }

  median() {
    if (this.lower.size() === 0) return null;
    if (this.lower.size() > this.upper.size()) return this.lower.peek();
    return (this.lower.peek() + this.upper.peek()) / 2;
  }
}
`,
      starterCode: `class ExactStreamingMedian {
  constructor() {
    // Your state here
  }

  add(x) {
    // Your code here
  }

  /** @returns {number|null} the median so far, or null when empty */
  median() {
    return null;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let stat = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op === "ExactStreamingMedian") {
      stat = new ExactStreamingMedian();
      out.push(null);
    } else {
      const value = stat[op](...args[i]);
      out.push(typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "odd then even count",
          input: [["ExactStreamingMedian", "add", "add", "add", "median", "add", "median"], [[], [1], [2], [3], [], [4], []]],
          expected: [null, null, null, null, 2, null, 2.5],
        },
        { name: "empty", input: [["ExactStreamingMedian", "median"], [[], []]], expected: [null, null] },
        {
          name: "negatives and duplicates",
          input: [["ExactStreamingMedian", "add", "add", "add", "median", "add", "median"], [[], [-5], [-5], [10], [], [10], []]],
          expected: [null, null, null, null, -5, null, 2.5],
        },
        {
          name: "interleaved adds and medians",
          input: [
            ["ExactStreamingMedian", "add", "median", "add", "median", "add", "median", "add", "median", "add", "median"],
            [[], [10], [], [1], [], [5], [], [7], [], [3], []],
          ],
          expected: [null, null, 10, null, 5.5, null, 5, null, 6, null, 5],
        },
      ],
    },
  },
  {
    slug: "histogram-quantile",
    title: "Fixed-Memory Quantiles with a Histogram",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Buckets plus underflow and overflow: O(1) adds, any quantile, error within half a bucket.",
    prompt: [
      "Find the median — or any quantile — of a dataset too large to keep in memory. Implement `HistogramQuantile(lo, hi, buckets)`, which uses fixed memory regardless of stream length.",
      "",
      "Bucket width is `w = (hi - lo) / buckets`; `add(x)` counts `x` in the underflow bucket when `x < lo`, the overflow bucket when `x >= hi`, otherwise bucket `floor((x - lo) / w)`. `quantile(q)` (for `0 < q <= 1`) walks underflow, buckets `0 … buckets - 1`, overflow, accumulating counts, and answers from the first bucket whose cumulative count reaches `q × n`: `lo` for underflow, `hi` for overflow, otherwise the bucket's midpoint `lo + (j + 0.5) × w`. `null` when empty.",
      "",
      "```",
      "h = HistogramQuantile(0, 100, 10)         // width 10",
      "for x in 5, 15, 25, ..., 95: h.add(x)     // one value per bucket",
      "h.quantile(0.5)   ->  45                  // midpoint of the fifth bucket",
      "h.quantile(0.99)  ->  95",
      "h.add(150)                                // overflow",
      "h.quantile(1.0)   ->  100",
      "```",
    ].join("\n"),
    hints: [
      "An array of buckets plus two counters. Adding is one index computation.",
      "A quantile is a prefix-sum walk until the running count reaches q × n. The error is bounded by half a bucket width, and memory does not depend on the stream at all.",
    ],
    solution: [
      "## Approach",
      "",
      "A fixed-bucket histogram: O(buckets) memory regardless of stream length, with a bounded error of half a bucket width. Adding is one bucket increment; a quantile walks the cumulative counts to the first bucket that reaches `q × n` and answers with its midpoint (or the range edge for underflow and overflow). Quote the trade as a number: 1000 buckets over a 0–100 range give ±0.05 absolute error for 8 KB of state.",
      "",
      "## Complexity",
      "",
      "O(1) per insert, O(buckets) per quantile, O(buckets) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **What about p99?** The histogram gives every quantile for the same memory, which two heaps do not. That is why every metrics system ships one.",
      "- **Unknown range?** Name t-digest or DDSketch: relative error, no pre-declared bounds, mergeable across shards. Mergeability is the property that matters for distributed runs.",
      "- **Merge two histograms?** Add the counts bucket by bucket — possible only because both use the same boundaries.",
    ].join("\n"),
    judge: {
      solutionCode: `// Fixed memory: O(buckets) regardless of stream length, error of half a bucket width.
class HistogramQuantile {
  constructor(lo, hi, buckets) {
    this.lo = lo;
    this.hi = hi;
    this.width = (hi - lo) / buckets;
    this.counts = new Array(buckets + 2).fill(0); // [underflow, buckets..., overflow]
    this.n = 0;
  }

  add(x) {
    this.n++;
    if (x < this.lo) this.counts[0]++;
    else if (x >= this.hi) this.counts[this.counts.length - 1]++;
    else this.counts[1 + Math.floor((x - this.lo) / this.width)]++;
  }

  quantile(q) {
    if (this.n === 0) return null;
    const target = q * this.n;
    let running = 0;
    for (let i = 0; i < this.counts.length; i++) {
      running += this.counts[i];
      if (running >= target) {
        if (i === 0) return this.lo;
        if (i === this.counts.length - 1) return this.hi;
        return this.lo + (i - 1 + 0.5) * this.width;
      }
    }
    return this.hi;
  }
}
`,
      starterCode: `class HistogramQuantile {
  /** Fixed memory: buckets of width (hi - lo) / buckets, plus underflow and overflow. */
  constructor(lo, hi, buckets) {
    this.lo = lo;
    this.hi = hi;
    this.buckets = buckets;
  }

  add(x) {
    // Your code here
  }

  /** @returns {number|null} lo, hi, or the answering bucket's midpoint; null when empty */
  quantile(q) {
    return null;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let stat = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op === "HistogramQuantile") {
      stat = new HistogramQuantile(...args[i]);
      out.push(null);
    } else {
      const value = stat[op](...args[i]);
      out.push(typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "prompt example",
          input: [
            ["HistogramQuantile", "add", "add", "add", "add", "add", "add", "add", "add", "add", "add", "quantile", "quantile", "quantile", "add", "quantile", "quantile"],
            [[0, 100, 10], [5], [15], [25], [35], [45], [55], [65], [75], [85], [95], [0.5], [0.99], [0.1], [150], [1], [0.5]],
          ],
          expected: [null, null, null, null, null, null, null, null, null, null, null, 45, 95, 5, null, 100, 55],
        },
        {
          name: "underflow, overflow and the bucket edges",
          input: [
            ["HistogramQuantile", "add", "add", "add", "add", "add", "quantile", "quantile", "quantile", "quantile", "quantile"],
            [[0, 10, 4], [-1], [0], [2.5], [9.99], [10], [0.2], [0.4], [0.6], [0.8], [1]],
          ],
          expected: [null, null, null, null, null, null, 0, 1.25, 3.75, 8.75, 10],
        },
        {
          name: "a thousand buckets over 0-100 resolves to 0.1",
          input: [["HistogramQuantile", "add", "quantile", "quantile"], [[0, 100, 1000], [12.34], [0.5], [1]]],
          expected: [null, null, 12.35, 12.35],
        },
        { name: "empty", input: [["HistogramQuantile", "quantile"], [[0, 1, 10], [0.5]]], expected: [null, null] },
      ],
    },
  },
];
