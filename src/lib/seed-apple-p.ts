import type { Problem } from "./types";

// Apple coding bank, part P: evaluation metrics as code, one per problem —
// precision/recall/F1, NDCG@k, Cohen's kappa and unbiased pass@k. Results are
// rounded to six decimals by the drivers. Python variants live in
// seed-python-apple.ts (precision-recall-f1) and seed-python-apple-d.ts.

const roundDriver = (name: string, call: string) => `function ${name}(...args) {
  const round = (v) => Math.round(v * 1e6) / 1e6;
  const value = ${call}(...args);
  return Array.isArray(value) ? value.map(round) : round(value);
}`;

export const appleProblemsP: Problem[] = [
  {
    slug: "precision-recall-f1",
    title: "Precision, Recall and F1",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Three guarded divisions — and 0 wherever a denominator is 0.",
    prompt: [
      "Given counts of true positives `tp`, false positives `fp` and false negatives `fn`, return `[precision, recall, f1]`:",
      "",
      "- precision = `tp / (tp + fp)`",
      "- recall = `tp / (tp + fn)`",
      "- F1 = the harmonic mean of precision and recall, `2pr / (p + r)`",
      "",
      "Each is `0` when its denominator is `0`. Results are compared after rounding to six decimals.",
      "",
      "```",
      "precisionRecallF1(8, 2, 4)  ->  [0.8, 0.666667, 0.727273]",
      "precisionRecallF1(0, 0, 0)  ->  [0, 0, 0]",
      "```",
    ].join("\n"),
    hints: [
      "Guard every denominator: precision needs tp + fp, recall tp + fn, F1 p + r.",
      "F1 is the harmonic mean, which punishes imbalance: precision 1 with recall 0 gives F1 0, not 0.5.",
    ],
    solution: [
      "## Approach",
      "",
      "Three guarded divisions. Compute precision and recall, returning 0 when their denominators are 0, then F1 as their harmonic mean — also 0 when both are 0.",
      "",
      "## Complexity",
      "",
      "O(1).",
      "",
      "## Worth saying out loud",
      "",
      "- **Why the harmonic mean?** It is dominated by the smaller of the two, so a classifier can't buy a good F1 by maxing one side.",
      "- **Macro vs micro averaging** across classes: macro averages per-class F1 (every class counts equally), micro pools the counts (frequent classes dominate). Say which one a leaderboard uses.",
      "- **Model A scored 0.7 points above model B?** Ask for the confidence interval before believing it — bootstrap the metric, or paired-bootstrap the difference, which is tighter because it cancels item difficulty.",
    ].join("\n"),
    judge: {
      solutionCode: `function precisionRecallF1(tp, fp, fn) {
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return [precision, recall, f1];
}
`,
      starterCode: `/** @returns {[number, number, number]} [precision, recall, f1], 0 where undefined */
function precisionRecallF1(tp, fp, fn) {
  // Your code here
  return [0, 0, 0];
}
`,
      entry: "__judgeMetric",
      driverCode: roundDriver("__judgeMetric", "precisionRecallF1"),
      tests: [
        { name: "Prompt example", input: [8, 2, 4], expected: [0.8, 0.666667, 0.727273] },
        { name: "Nothing predicted, nothing relevant", input: [0, 0, 0], expected: [0, 0, 0] },
        { name: "Perfect", input: [5, 0, 0], expected: [1, 1, 1] },
        { name: "Only false positives", input: [0, 3, 0], expected: [0, 0, 0] },
        { name: "Recall without precision problems", input: [3, 0, 9], expected: [1, 0.25, 0.4] },
      ],
    },
  },
  {
    slug: "ndcg-at-k",
    title: "NDCG@k",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Discount each graded relevance by log2(position + 2), then divide by the ideal ordering's DCG.",
    prompt: [
      "`ndcgAtK(rankedRels, k, ideal)` scores a ranking. `rankedRels` holds graded relevances in the order your system returned the items. Using 0-based positions,",
      "",
      "```",
      "DCG@k = sum over the first k positions i of  rel_i / log2(i + 2)",
      "NDCG@k = DCG@k of the ranking / DCG@k of the ideal ordering",
      "```",
      "",
      "The ideal ordering sorts relevances from highest to lowest. When `ideal` (the relevances of every relevant item) is given, the ideal DCG comes from it; when it is `null`, from the ranked list itself. Return `0` when the ideal DCG is `0`. Results are compared after rounding to six decimals.",
      "",
      "```",
      "ndcgAtK([3, 2, 3, 0, 1, 2], 6, null)  ->  0.960808",
      "ndcgAtK([1, 0, 0], 3, [3, 2, 1])      ->  0.210002   // the best items were never returned",
      "```",
    ].join("\n"),
    hints: [
      "Write dcg(rels) once: the sum of rel / log2(i + 2) over 0-based positions. Both the numerator and the denominator use it.",
      "The ideal list is the sorted-descending relevances — of `ideal` when given, so items the system never returned still count against it.",
    ],
    solution: [
      "## Approach",
      "",
      "DCG discounts each graded relevance by `log2(position + 2)`, so a relevant item at the top counts fully and one further down counts less. NDCG divides by the DCG of the ideal ordering — the sorted `ideal` list when one is supplied, otherwise the sorted ranked list — and is 0 when nothing relevant exists. Truncate both lists at k.",
      "",
      "## Complexity",
      "",
      "O(n log n) for the ideal sort (O(n log k) with a partial sort); O(k) for the DCG sums.",
      "",
      "## Worth saying out loud",
      "",
      "- **Why supply `ideal` separately?** Computing the ideal from the returned list alone rewards a system for returning fewer relevant items; the full relevance set keeps missing items in the denominator.",
      "- **Binary relevance?** NDCG still works with 0/1 grades; with graded relevance some teams use `2^rel − 1` as the gain to reward highly relevant items more — say which convention you are using.",
    ].join("\n"),
    judge: {
      solutionCode: `function dcg(rels) {
  return rels.reduce((sum, rel, i) => sum + rel / Math.log2(i + 2), 0);
}

// rankedRels: graded relevance in the order the system returned items.
function ndcgAtK(rankedRels, k, ideal = null) {
  const cut = rankedRels.slice(0, k);
  const best = [...(ideal ?? rankedRels)].sort((a, b) => b - a).slice(0, k);
  const idcg = dcg(best);
  return idcg ? dcg(cut) / idcg : 0;
}
`,
      starterCode: `/**
 * @param {number[]} rankedRels graded relevance in returned order
 * @param {number} k
 * @param {number[]|null} ideal relevances of every relevant item, when known
 * @returns {number}
 */
function ndcgAtK(rankedRels, k, ideal = null) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeMetric",
      driverCode: roundDriver("__judgeMetric", "ndcgAtK"),
      tests: [
        { name: "Graded list at k = 6", input: [[3, 2, 3, 0, 1, 2], 6, null], expected: 0.960808 },
        { name: "Same list cut at k = 3", input: [[3, 2, 3, 0, 1, 2], 3, null], expected: 0.977781 },
        { name: "Already ideal", input: [[3, 2, 1], 3, null], expected: 1 },
        { name: "Reversed order", input: [[1, 2, 3], 3, null], expected: 0.789998 },
        { name: "Nothing relevant", input: [[0, 0], 2, null], expected: 0 },
        { name: "Ideal grades supplied separately", input: [[1, 0, 0], 3, [3, 2, 1]], expected: 0.210002 },
      ],
    },
  },
  {
    slug: "cohens-kappa",
    title: "Cohen's Kappa",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Observed agreement corrected for the agreement two annotators would reach by chance.",
    prompt: [
      "Two annotators labelled the same items. `cohensKappa(a, b)` measures their agreement corrected for chance over the two equal-length label lists:",
      "",
      "```",
      "po = fraction of items where a[i] == b[i]",
      "pe = sum over labels of (share of a with that label) × (share of b with that label)",
      "kappa = (po − pe) / (1 − pe),   and 1 when pe is 1",
      "```",
      "",
      "Labels can be any values. Results are compared after rounding to six decimals.",
      "",
      "```",
      "cohensKappa([\"a\", \"a\", \"b\", \"b\", \"a\", \"b\"], [\"a\", \"b\", \"b\", \"b\", \"a\", \"a\"])  ->  0.333333",
      "cohensKappa([1]*19 + [0], [1]*20)  ->  0        // 95% raw agreement, zero kappa",
      "```",
    ].join("\n"),
    hints: [
      "Count each label's occurrences in a and in b. Chance agreement pe is the sum over every label of (count in a / n) × (count in b / n).",
      "When both annotators always use the same single label, pe is 1 and the formula divides by zero — the definition makes that case 1.",
    ],
    solution: [
      "## Approach",
      "",
      "Observed agreement `po` is the fraction of positions where the labels match. Chance agreement `pe` is what two annotators with these label frequencies would agree on at random: the sum over labels of the product of each annotator's marginal rate. Kappa rescales `po` so that chance scores 0 and perfect agreement scores 1.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(labels) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **How do you know your human labels are good?** Cohen's kappa for two annotators, Fleiss' for more, Krippendorff's alpha when labels are ordinal or missing. Raw agreement misleads on a skewed label set: 95% agreement can be zero kappa.",
      "- **LLM-as-judge?** Measure judge-versus-human kappa before trusting it, and watch for position bias, verbosity bias and self-preference — correlated judge errors mean a panel carries fewer independent votes than its size suggests.",
    ].join("\n"),
    judge: {
      solutionCode: `// Inter-annotator agreement corrected for chance.
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
`,
      starterCode: `/**
 * @param {*[]} a labels from annotator A
 * @param {*[]} b labels from annotator B, same length
 * @returns {number}
 */
function cohensKappa(a, b) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeMetric",
      driverCode: roundDriver("__judgeMetric", "cohensKappa"),
      tests: [
        { name: "Identical labels", input: [[1, 0, 1, 1], [1, 0, 1, 1]], expected: 1 },
        { name: "Partial agreement", input: [["a", "a", "b", "b", "a", "b"], ["a", "b", "b", "b", "a", "a"]], expected: 0.333333 },
        {
          name: "95% raw agreement on a skewed set is zero",
          input: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
          expected: 0,
        },
        { name: "One label everywhere", input: [[1, 1, 1], [1, 1, 1]], expected: 1 },
        { name: "Systematic disagreement is negative", input: [["x", "y"], ["y", "x"]], expected: -1 },
      ],
    },
  },
  {
    slug: "pass-at-k",
    title: "Unbiased pass@k",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "1 − C(n − c, k) / C(n, k), computed as a running product so nothing overflows.",
    prompt: [
      "A model produced `n` samples for a task and `c` of them passed. `passAtK(n, c, k)` estimates the probability that at least one of `k` samples drawn from the `n` passes, using the unbiased estimator",
      "",
      "```",
      "pass@k = 1 − C(n − c, k) / C(n, k)",
      "```",
      "",
      "Return `1` when `n − c < k` (every draw of k must include a pass). Compute it as a product, not with factorials — `n` can be large. Results are compared after rounding to six decimals.",
      "",
      "```",
      "passAtK(10, 3, 1)  ->  0.3",
      "passAtK(10, 3, 5)  ->  0.916667",
      "```",
    ].join("\n"),
    hints: [
      "C(n − c, k) / C(n, k) is the chance that k draws without replacement all fail. Written as a product it is Π over i from 0 to k − 1 of (n − c − i) / (n − i).",
      "Handle n − c < k before the product: some factor would be zero or negative there, and the answer is 1.",
    ],
    solution: [
      "## Approach",
      "",
      "The naive estimate — the fraction of problems where at least one of k samples passed — is biased when you have more than k samples. The unbiased form counts, among all ways to draw k of the n samples, the fraction that contain at least one pass: `1 − C(n−c, k)/C(n, k)`. Computing the ratio as a running product of `(n − c − i)/(n − i)` avoids huge factorials.",
      "",
      "## Complexity",
      "",
      "O(k) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **Why n > k samples at all?** Drawing exactly k and reporting pass/fail has high variance; generating n ≥ k and using the unbiased estimator uses every sample.",
      "- **Contamination-resistant benchmarks:** held-out private splits, canary strings, perturbed or freshly generated items, and n-gram overlap checks against training data.",
      "- Average pass@k over problems, and report a confidence interval — a bootstrap over problems is the honest one.",
    ].join("\n"),
    judge: {
      solutionCode: `// Unbiased pass@k: 1 - C(n-c, k) / C(n, k), as a product so nothing overflows.
function passAtK(n, c, k) {
  if (n - c < k) return 1;
  let missAll = 1;
  for (let i = 0; i < k; i++) missAll *= (n - c - i) / (n - i);
  return 1 - missAll;
}
`,
      starterCode: `/**
 * @param {number} n samples
 * @param {number} c passing samples
 * @param {number} k
 * @returns {number}
 */
function passAtK(n, c, k) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeMetric",
      driverCode: roundDriver("__judgeMetric", "passAtK"),
      tests: [
        { name: "pass@1 is the pass rate", input: [10, 3, 1], expected: 0.3 },
        { name: "pass@5 of 10 with 3 passing", input: [10, 3, 5], expected: 0.916667 },
        { name: "No passes", input: [10, 0, 5], expected: 0 },
        { name: "Failures cannot fill k", input: [5, 3, 3], expected: 1 },
        { name: "pass@n with one pass", input: [4, 1, 4], expected: 1 },
        { name: "Many samples", input: [200, 10, 10], expected: 0.408548 },
      ],
    },
  },
];
