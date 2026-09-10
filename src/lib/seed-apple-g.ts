import type { Problem } from "./types";

// Apple phone-screen bank, part G: median of a huge stream and evaluation
// metrics as code. Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsG: Problem[] = [
  {
    slug: "streaming-median",
    title: "Median of a Huge Stream",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary:
      "Two heaps for the exact answer, then a fixed-bucket histogram when the stream will not fit in memory.",
    prompt: [
      "> \"Write a function to find the median of a large dataset efficiently. How would you optimise it for memory?\"",
      "",
      "Reported for an Apple data-engineering phone screen; the memory clause is part of the prompt, not a follow-up. Two independent Apple reports ask for a metric over a large input *and* its memory bound — it is the strongest pattern across the reports.",
      "",
      "## Phase 1 — `ExactStreamingMedian`",
      "",
      "`add(x)` takes the next number; `median()` returns the median of everything added so far — the mean of the two middle values for an even count — or `null` before anything is added.",
      "",
      "## Phase 2 — `HistogramQuantile(lo, hi, buckets)`",
      "",
      "Fixed memory regardless of stream length. Bucket width is `w = (hi - lo) / buckets`; `add(x)` counts `x` in the underflow bucket when `x < lo`, the overflow bucket when `x >= hi`, otherwise bucket `floor((x - lo) / w)`. `quantile(q)` (for `0 < q <= 1`) walks underflow, buckets `0 … buckets - 1`, overflow, accumulating counts, and answers from the first bucket whose cumulative count reaches `q × n`: `lo` for underflow, `hi` for overflow, otherwise the bucket's midpoint `lo + (j + 0.5) × w`. `null` when empty.",
      "",
      "```",
      "h = HistogramQuantile(0, 100, 10)         // width 10",
      "for x in 5, 15, 25, ..., 95: h.add(x)     // one value per bucket",
      "h.quantile(0.5)   ->  45                  // midpoint of the fifth bucket",
      "h.quantile(0.99)  ->  95",
      "h.add(150)                                // overflow",
      "h.quantile(1.0)   ->  100",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Does the data fit in memory, or is the bound the point? Do you need the exact median or a quantile within a tolerance? Is the value range known in advance? Will p99 be asked next — and does the structure have to merge across shards?",
    ].join("\n"),
    hints: [
      "Exact: a max-heap for the lower half and a min-heap for the upper half, rebalanced so the lower half is the same size or one larger. The median is the lower top, or the mean of both tops.",
      "Histogram: an array of buckets + 2 counters. Adding is one index computation; a quantile is a prefix-sum walk. Error is bounded by half a bucket width, and memory does not depend on the stream at all.",
    ],
    solution: [
      "## Approach",
      "",
      "Give the two-heap solution first, then immediately name its limit: O(n) memory, which fails the premise. Every `add` pushes onto the lower max-heap, moves that heap's top to the upper min-heap, and moves the upper top back if the upper half grew larger — so the lower half always holds the median for an odd count. Then the real answer — a fixed-bucket histogram, O(buckets) memory regardless of stream length, with a bounded error of half a bucket width. Quote the trade as a number: 1000 buckets over a 0–100 range give ±0.05 absolute error for 8 KB of state.",
      "",
      "## Complexity",
      "",
      "Exact: O(log n) per insert, O(1) per median, O(n) space. Histogram: O(1) per insert, O(buckets) per quantile, O(buckets) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **What about p99?** The histogram gives every quantile for the same memory, which the two heaps do not. That is the argument for it, and it is why every metrics system ships one.",
      "- **Unknown range?** Name t-digest or DDSketch: relative error, no pre-declared bounds, mergeable across shards. Mergeability is the property that matters for distributed evaluation runs.",
      "- **Exact median, data on disk?** External merge sort, or two passes of counting on the high bits then the low bits. O(1) memory, two reads.",
      "- **Even-length trap:** the median of an even count is the mean of the two middles. Interviewers check it.",
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

// Fixed memory: O(buckets) regardless of stream length, error of half a bucket width.
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

class HistogramQuantile {
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
    if (op === "ExactStreamingMedian") {
      stat = new ExactStreamingMedian();
      out.push(null);
    } else if (op === "HistogramQuantile") {
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
          name: "Exact: odd then even count",
          input: [["ExactStreamingMedian", "add", "add", "add", "median", "add", "median"], [[], [1], [2], [3], [], [4], []]],
          expected: [null, null, null, null, 2, null, 2.5],
        },
        { name: "Exact: empty", input: [["ExactStreamingMedian", "median"], [[], []]], expected: [null, null] },
        {
          name: "Exact: negatives and duplicates",
          input: [["ExactStreamingMedian", "add", "add", "add", "median", "add", "median"], [[], [-5], [-5], [10], [], [10], []]],
          expected: [null, null, null, null, -5, null, 2.5],
        },
        {
          name: "Exact: interleaved adds and medians",
          input: [
            ["ExactStreamingMedian", "add", "median", "add", "median", "add", "median", "add", "median", "add", "median"],
            [[], [10], [], [1], [], [5], [], [7], [], [3], []],
          ],
          expected: [null, null, 10, null, 5.5, null, 5, null, 6, null, 5],
        },
        {
          name: "Histogram: prompt example",
          input: [
            ["HistogramQuantile", "add", "add", "add", "add", "add", "add", "add", "add", "add", "add", "quantile", "quantile", "quantile", "add", "quantile", "quantile"],
            [[0, 100, 10], [5], [15], [25], [35], [45], [55], [65], [75], [85], [95], [0.5], [0.99], [0.1], [150], [1], [0.5]],
          ],
          expected: [null, null, null, null, null, null, null, null, null, null, null, 45, 95, 5, null, 100, 55],
        },
        {
          name: "Histogram: underflow, overflow and the bucket edges",
          input: [
            ["HistogramQuantile", "add", "add", "add", "add", "add", "quantile", "quantile", "quantile", "quantile", "quantile"],
            [[0, 10, 4], [-1], [0], [2.5], [9.99], [10], [0.2], [0.4], [0.6], [0.8], [1]],
          ],
          expected: [null, null, null, null, null, null, 0, 1.25, 3.75, 8.75, 10],
        },
        {
          name: "Histogram: a thousand buckets over 0-100 resolves to 0.1",
          input: [["HistogramQuantile", "add", "quantile", "quantile"], [[0, 100, 1000], [12.34], [0.5], [1]]],
          expected: [null, null, 12.35, 12.35],
        },
        { name: "Histogram: empty", input: [["HistogramQuantile", "quantile"], [[0, 1, 10], [0.5]]], expected: [null, null] },
      ],
    },
  },
  {
    slug: "eval-metrics-as-code",
    title: "Evaluation Metrics as Code",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Precision/recall/F1, NDCG, Cohen's kappa and unbiased pass@k — the domain credential in one sitting.",
    prompt: [
      "The job description names \"metrics\", \"scoring frameworks\" and \"model-based judging\" as the work; one reported Apple MLE round was a code walkthrough of an evaluation codebase. If a metric shows up as a coding problem, it will be one of these. Implement all four; the harness rounds results to six decimals.",
      "",
      "- `precisionRecallF1(tp, fp, fn)` → `[precision, recall, f1]`, each `0` when its denominator is `0`.",
      "- `ndcgAtK(rankedRels, k, ideal)` → NDCG@k for graded relevances in the order your system returned them, with `DCG = Σ rel_i / log2(i + 2)` over 0-based positions. When `ideal` (the relevances of every relevant item) is given, the ideal DCG comes from it; otherwise from the ranked list itself. `0` when the ideal DCG is `0`.",
      "- `cohensKappa(a, b)` → inter-annotator agreement corrected for chance over two equal-length label lists: `(po − pe) / (1 − pe)`, and `1` when `pe` is `1`.",
      "- `passAtK(n, c, k)` → the unbiased estimator `1 − C(n − c, k) / C(n, k)` for `n` samples of which `c` passed; `1` when `n − c < k`. Compute it as a product, not with factorials.",
      "",
      "```",
      "precisionRecallF1(8, 2, 4)              ->  [0.8, 0.666667, 0.727273]",
      "ndcgAtK([3, 2, 3, 0, 1, 2], 6, null)     ->  0.960808",
      "cohensKappa([1]*19 + [0], [1]*20)        ->  0        // 95% raw agreement, zero kappa",
      "passAtK(10, 3, 5)                        ->  0.916667",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Binary or graded relevance? Is the ideal ranking known or taken from the returned list? Two annotators or more (Fleiss, Krippendorff)? For pass@k, is the naive \"fraction with at least one success\" acceptable, or do you want the unbiased estimator?",
    ].join("\n"),
    hints: [
      "Guard every denominator: precision needs tp + fp, recall tp + fn, F1 p + r, NDCG the ideal DCG, kappa 1 − pe. Returning 0 (or 1 for kappa at pe = 1) is part of the contract.",
      "pass@k as a product: Π_{i=0}^{k−1} (n − c − i) / (n − i) is C(n−c, k) / C(n, k) without any large factorial. Kappa's chance agreement is Σ over labels of (count in a / n) × (count in b / n).",
    ],
    solution: [
      "## Approach",
      "",
      "These are cheap to prepare and disproportionately convincing, because most candidates for an evaluation role cannot write NDCG from memory. Precision, recall and F1 are three guarded divisions. DCG discounts each graded relevance by `log2(position + 2)`; NDCG divides by the DCG of the ideal ordering — the sorted `ideal` list when one is supplied, otherwise the sorted ranked list — and is 0 when nothing relevant exists. Cohen's kappa compares observed agreement `po` with chance agreement `pe`, the sum over labels of the product of each annotator's marginal rates. The one to be fluent in is pass@k: the naive \"fraction of samples with at least one success\" is a biased estimator, and the unbiased form is `1 − C(n−c, k)/C(n, k)`, computed as a running product so nothing overflows.",
      "",
      "## Complexity",
      "",
      "NDCG O(k log k) for the ideal sort; kappa O(n); pass@k O(k); all O(1) extra space beyond the inputs.",
      "",
      "## Worth saying out loud",
      "",
      "- **How do you know your human labels are good?** Cohen's kappa for two annotators, Fleiss' for more, Krippendorff's alpha when labels are ordinal or missing. Raw agreement misleads on a skewed label set: 95% agreement can be zero kappa.",
      "- **Model A scored 0.7 points above model B?** Ask for the confidence interval before believing it. Bootstrap the benchmark mean, or paired-bootstrap the difference, which is tighter because it cancels item difficulty.",
      "- **What is wrong with LLM-as-judge?** Position bias, verbosity bias, self-preference — and correlated judge errors, so a panel carries far fewer independent votes than its size suggests.",
      "- **Contamination-resistant benchmarks:** held-out private splits, canary strings, perturbed or freshly generated items, and n-gram overlap checks against training data.",
    ].join("\n"),
    judge: {
      solutionCode: `function precisionRecallF1(tp, fp, fn) {
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return [precision, recall, f1];
}

function dcg(rels) {
  return rels.reduce((sum, rel, i) => sum + rel / Math.log2(i + 2), 0);
}

// rankedRels: graded relevance in the order the system returned items.
function ndcgAtK(rankedRels, k, ideal = null) {
  const cut = rankedRels.slice(0, k);
  const best = [...(ideal ?? rankedRels)].sort((a, b) => b - a).slice(0, k);
  const idcg = dcg(best);
  return idcg ? dcg(cut) / idcg : 0;
}

// Inter-annotator agreement corrected for chance.
function cohensKappa(a, b) {
  const n = a.length;
  let agreed = 0;
  const countA = new Map(), countB = new Map();
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agreed++;
    countA.set(a[i], (countA.get(a[i]) ?? 0) + 1);
    countB.set(b[i], (countB.get(b[i]) ?? 0) + 1);
  }
  const po = agreed / n;
  let pe = 0;
  for (const label of new Set([...countA.keys(), ...countB.keys()])) {
    pe += ((countA.get(label) ?? 0) / n) * (countB.get(label) ?? 0) / n;
  }
  return pe === 1 ? 1 : (po - pe) / (1 - pe);
}

// Unbiased pass@k: 1 - C(n-c, k) / C(n, k), as a product so nothing overflows.
function passAtK(n, c, k) {
  if (n - c < k) return 1;
  let missAll = 1;
  for (let i = 0; i < k; i++) missAll *= (n - c - i) / (n - i);
  return 1 - missAll;
}
`,
      starterCode: `/** @returns {[number, number, number]} [precision, recall, f1], 0 where undefined */
function precisionRecallF1(tp, fp, fn) {
  // Your code here
  return [0, 0, 0];
}

/**
 * @param {number[]} rankedRels graded relevance in returned order
 * @param {number} k
 * @param {number[]|null} ideal relevances of every relevant item, when known
 */
function ndcgAtK(rankedRels, k, ideal = null) {
  // Your code here
  return 0;
}

/** @param {*[]} a labels from annotator A  @param {*[]} b labels from annotator B */
function cohensKappa(a, b) {
  // Your code here
  return 0;
}

/** @param {number} n samples  @param {number} c passing samples  @param {number} k */
function passAtK(n, c, k) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeMetric",
      driverCode: `function __judgeMetric(kind, ...args) {
  const round = (v) => Math.round(v * 1e6) / 1e6;
  const fns = { prf: precisionRecallF1, ndcg: ndcgAtK, kappa: cohensKappa, passAtK };
  const value = fns[kind](...args);
  return Array.isArray(value) ? value.map(round) : round(value);
}`,
      tests: [
        { name: "P/R/F1: prompt example", input: ["prf", 8, 2, 4], expected: [0.8, 0.666667, 0.727273] },
        { name: "P/R/F1: nothing predicted, nothing relevant", input: ["prf", 0, 0, 0], expected: [0, 0, 0] },
        { name: "P/R/F1: perfect", input: ["prf", 5, 0, 0], expected: [1, 1, 1] },
        { name: "P/R/F1: only false positives", input: ["prf", 0, 3, 0], expected: [0, 0, 0] },
        { name: "NDCG: graded list at k = 6", input: ["ndcg", [3, 2, 3, 0, 1, 2], 6, null], expected: 0.960808 },
        { name: "NDCG: same list cut at k = 3", input: ["ndcg", [3, 2, 3, 0, 1, 2], 3, null], expected: 0.977781 },
        { name: "NDCG: already ideal", input: ["ndcg", [3, 2, 1], 3, null], expected: 1 },
        { name: "NDCG: reversed order", input: ["ndcg", [1, 2, 3], 3, null], expected: 0.789998 },
        { name: "NDCG: nothing relevant", input: ["ndcg", [0, 0], 2, null], expected: 0 },
        { name: "NDCG: ideal grades supplied separately", input: ["ndcg", [1, 0, 0], 3, [3, 2, 1]], expected: 0.210002 },
        { name: "Kappa: identical labels", input: ["kappa", [1, 0, 1, 1], [1, 0, 1, 1]], expected: 1 },
        { name: "Kappa: partial agreement", input: ["kappa", ["a", "a", "b", "b", "a", "b"], ["a", "b", "b", "b", "a", "a"]], expected: 0.333333 },
        {
          name: "Kappa: 95% raw agreement on a skewed set is zero",
          input: ["kappa", [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
          expected: 0,
        },
        { name: "Kappa: one label everywhere", input: ["kappa", [1, 1, 1], [1, 1, 1]], expected: 1 },
        { name: "pass@1 is the pass rate", input: ["passAtK", 10, 3, 1], expected: 0.3 },
        { name: "pass@5 of 10 with 3 passing", input: ["passAtK", 10, 3, 5], expected: 0.916667 },
        { name: "pass@k with no passes", input: ["passAtK", 10, 0, 5], expected: 0 },
        { name: "pass@k when failures cannot fill k", input: ["passAtK", 5, 3, 3], expected: 1 },
        { name: "pass@n with one pass", input: ["passAtK", 4, 1, 4], expected: 1 },
      ],
    },
  },
];
