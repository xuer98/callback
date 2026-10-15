import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part L: two top-K prompts. Judged in JavaScript and
// Python; the Python judges live in seed-python-snowflake-e.ts.

export const snowflakeProblemsL: Problem[] = [
  {
    slug: "top-k-search-terms",
    title: "Top K Search Terms, One Vote per User",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Dedupe (user, term) pairs before counting, then sort by count with the term as the tie-break.",
    prompt: [
      "Search queries arrive as `[user, term]` pairs. A term's score is the number of **distinct** users who searched for it — a user searching the same term ten times counts once. Return the `k` highest-scoring terms, highest first, breaking ties alphabetically.",
      "",
      "```",
      'topSearchTerms([["u1", "apple"], ["u1", "apple"], ["u2", "apple"], ["u1", "pear"], ["u3", "pear"], ["u4", "pear"], ["u1", "kiwi"]], 2)',
      '  ->  ["pear", "apple"]',
      "```",
    ].join("\n"),
    hints: [
      "Keep a set of users per term; its size is the score. A set makes the once-per-user rule free.",
      "Sort the terms by (score descending, term ascending) and take k. A heap of size k is the refinement when there are far more terms than k.",
    ],
    solution: [
      "## Approach",
      "",
      "Map each term to the set of users who searched it; the set does the deduplication. Then order terms by score descending with the term itself as the tie-break and return the first `k`. For very many terms a bounded min-heap of size `k` avoids the full sort.",
      "",
      "## Complexity",
      "",
      "O(q) to build the sets, O(t log t) to sort t terms (or O(t log k) with a heap).",
      "",
      "## Worth saying out loud",
      "",
      "- The once-per-user rule is the only twist; name it and show the set. Counting rows instead of distinct users is the bug to avoid.",
      "- Streaming version: the per-term sets grow without bound; HyperLogLog gives an approximate distinct count in constant memory.",
    ].join("\n"),
    judge: {
      solutionCode: `// A set of users per term, then sort by (score desc, term asc).
function topSearchTerms(queries, k) {
  const users = new Map();
  for (const [user, term] of queries) {
    if (!users.has(term)) users.set(term, new Set());
    users.get(term).add(user);
  }
  return [...users.entries()]
    .sort((a, b) => b[1].size - a[1].size || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, k)
    .map(([term]) => term);
}
`,
      starterCode: `/**
 * @param {string[][]} queries [user, term] pairs
 * @param {number} k
 * @returns {string[]} the k terms with the most distinct users, ties alphabetical
 */
function topSearchTerms(queries, k) {
  // Your code here
  return [];
}
`,
      entry: "topSearchTerms",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              ["u1", "apple"],
              ["u1", "apple"],
              ["u2", "apple"],
              ["u1", "pear"],
              ["u3", "pear"],
              ["u4", "pear"],
              ["u1", "kiwi"],
            ],
            2,
          ],
          expected: ["pear", "apple"],
        },
        {
          name: "Ties are alphabetical",
          input: [
            [
              ["u1", "b"],
              ["u2", "a"],
            ],
            2,
          ],
          expected: ["a", "b"],
        },
        { name: "k larger than the number of terms", input: [[["u1", "x"]], 5], expected: ["x"] },
        { name: "k = 0", input: [[["u1", "x"]], 0], expected: [] },
        {
          name: "One user counts once",
          input: [
            [
              ["u1", "x"],
              ["u1", "x"],
              ["u1", "x"],
              ["u2", "y"],
            ],
            1,
          ],
          expected: ["x"],
        },
        { name: "No queries", input: [[], 3], expected: [] },
      ],
    },
  },
  {
    slug: "top-k-books-after-each-update",
    title: "Top K Selling Books After Each Sale",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Totals in a map; the top K is recomputed from the map on each update, or kept in a bounded structure when K is small and the catalogue huge.",
    prompt: [
      "Design `TopSellers(k)`. Each call `sale(book, quantity)` adds to the book's total and returns the current top `k` books: highest total first, ties broken alphabetically.",
      "",
      "```",
      "top = TopSellers(2)",
      'top.sale("A", 5)   ->  ["A"]',
      'top.sale("B", 7)   ->  ["B", "A"]',
      'top.sale("A", 3)   ->  ["A", "B"]',
      'top.sale("C", 8)   ->  ["A", "C"]',
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from book to total. The straightforward version sorts the map's entries after each sale and slices k.",
      "When the catalogue is large and k small, keep the current top k as a sorted list: a sale can move its book up within the list or into it, and nothing else changes.",
    ],
    solution: [
      "## Approach",
      "",
      "The totals live in a map. After each sale the simplest correct answer sorts the entries by total descending, then title, and slices `k` — O(n log n) per update, fine for a catalogue of thousands. For a large catalogue, note that only the sold book's rank can change: keep the top `k` as a small sorted list, and on a sale either reposition the book within it or compare it against the current last entry.",
      "",
      "## Complexity",
      "",
      "O(n log n) per sale for the sort-everything version; O(k) per sale with the bounded list.",
      "",
      "## Worth saying out loud",
      "",
      "- State the tie rule and the behaviour for quantities that take a total to zero or below before coding.",
      "- Full ranking of everything on every update is the trap when the catalogue is a million books and k is ten; the incremental version is what the follow-up wants.",
    ].join("\n"),
    judge: {
      solutionCode: `// Totals in a map; the top k is re-ranked after each sale.
class TopSellers {
  constructor(k) {
    this.k = k;
    this.totals = new Map();
  }

  sale(book, quantity) {
    this.totals.set(book, (this.totals.get(book) ?? 0) + quantity);
    return [...this.totals.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .slice(0, this.k)
      .map(([title]) => title);
  }
}
`,
      starterCode: `class TopSellers {
  constructor(k) {
    // Your state here
  }

  /** @returns {string[]} the top k books after this sale: highest total first, ties alphabetical */
  sale(book, quantity) {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("TopSellers"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["TopSellers", "sale", "sale", "sale", "sale", "sale"],
            [[2], ["A", 5], ["B", 7], ["A", 3], ["C", 8], ["B", 2]],
          ],
          expected: [null, ["A"], ["B", "A"], ["A", "B"], ["A", "C"], ["B", "A"]],
        },
        {
          name: "Ties are alphabetical",
          input: [
            ["TopSellers", "sale", "sale"],
            [[1], ["b", 1], ["a", 1]],
          ],
          expected: [null, ["b"], ["a"]],
        },
        {
          name: "k = 0",
          input: [
            ["TopSellers", "sale"],
            [[0], ["a", 1]],
          ],
          expected: [null, []],
        },
        {
          name: "Fewer books than k",
          input: [
            ["TopSellers", "sale", "sale"],
            [[5], ["x", 2], ["y", 1]],
          ],
          expected: [null, ["x"], ["x", "y"]],
        },
      ],
    },
  },
];
