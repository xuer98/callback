import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part L: two top-K prompts and two linked-list
// classics done over arrays and plain nodes. Judged in JavaScript and
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
  {
    slug: "merge-k-sorted-lists",
    title: "Merge K Sorted Lists",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Divide and conquer pairs of lists, or a heap of heads — both O(N log k), and both beat merging one list at a time.",
    prompt: [
      "Merge `k` sorted arrays of integers into one sorted array.",
      "",
      "```",
      "mergeKSorted([[1, 4, 5], [1, 3, 4], [2, 6]])  ->  [1, 1, 2, 3, 4, 4, 5, 6]",
      "```",
      "",
      "Aim for O(N log k) over the N values in total.",
    ].join("\n"),
    hints: [
      "Merging the lists one after another is O(N · k). Merge them in pairs instead, halving the number of lists each round.",
      "A min-heap holding one head per list is the other O(N log k) approach, and the one that works on streams.",
    ],
    solution: [
      "## Approach",
      "",
      "Divide and conquer: merge lists in pairs, then merge the results in pairs, and so on for `log k` rounds; each round touches every value once, so the total is O(N log k). The two-list merge is the two-pointer routine from [Merge Two Sorted Lists](/problems/merge-two-sorted-lists). A min-heap of the k current heads gives the same bound and extends to inputs that arrive as streams.",
      "",
      "## Complexity",
      "",
      "O(N log k) time; O(N) output, O(log k) recursion.",
      "",
      "## Worth saying out loud",
      "",
      "- Say why one-at-a-time merging is O(N · k): the growing accumulator is re-scanned at every step.",
      "- With linked lists the heap version runs in O(k) extra space because nodes are relinked rather than copied.",
    ].join("\n"),
    judge: {
      solutionCode: `// Pairwise merging: log k rounds, each touching every value once.
function mergeKSorted(lists) {
  const mergeTwo = (a, b) => {
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
    return out.concat(a.slice(i), b.slice(j));
  };
  if (lists.length === 0) return [];
  let round = lists;
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      next.push(i + 1 < round.length ? mergeTwo(round[i], round[i + 1]) : round[i]);
    }
    round = next;
  }
  return round[0];
}
`,
      starterCode: `/**
 * @param {number[][]} lists sorted arrays
 * @returns {number[]} one sorted array with every value
 */
function mergeKSorted(lists) {
  // Your code here
  return [];
}
`,
      entry: "mergeKSorted",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [1, 4, 5],
              [1, 3, 4],
              [2, 6],
            ],
          ],
          expected: [1, 1, 2, 3, 4, 4, 5, 6],
        },
        { name: "No lists", input: [[]], expected: [] },
        { name: "One empty list", input: [[[]]], expected: [] },
        { name: "Two single values", input: [[[1], [0]]], expected: [0, 1] },
        { name: "One list", input: [[[1, 2, 3]]], expected: [1, 2, 3] },
        { name: "Duplicates and negatives", input: [[[-3, 0, 0], [-5, 7], [], [0]]], expected: [-5, -3, 0, 0, 0, 7] },
        { name: "Many short lists", input: [[[9], [8], [7], [6], [5], [4], [3], [2], [1]]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      ],
    },
  },
  {
    slug: "copy-list-with-random-pointer",
    title: "Copy a List With Random Pointers",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "First pass clones every node into a map keyed by the original; second pass wires next and random through the map.",
    prompt: [
      "Each node of a linked list has `val`, `next` and `random`, where `random` points at any node in the list or is `null`. Return a **deep copy**: new nodes with the same values and the same shape, sharing no node with the original.",
      "",
      "The grader builds the list from `[value, randomIndex]` pairs, hands you the head, and serialises your copy the same way after checking it shares nothing with the original.",
      "",
      "```",
      "copyRandomList(head of [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]])",
      "  ->  a new list that serialises to [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]",
      "```",
    ].join("\n"),
    hints: [
      "Walk the list once creating a copy of each node and recording original → copy in a map.",
      "Walk it again setting copy.next = map(original.next) and copy.random = map(original.random); null maps to null.",
    ],
    solution: [
      "## Approach",
      "",
      "Two passes with a map from original node to its clone. The first pass creates every clone with only its value, so the map is complete before any pointer is set; the second pass sets each clone's `next` and `random` by looking the originals up. Nulls map to null. The interleaving trick — weaving clones between originals so no map is needed — is the O(1) extra space variant.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) space for the map (O(1) extra with interleaving).",
      "",
      "## Worth saying out loud",
      "",
      "- The failure the grader checks for: returning or reusing original nodes. A copy must have no node in common with the source.",
      "- Interleaving: insert each clone after its original, set `clone.random = original.random.next`, then unzip the two lists — mention it, write it only if asked.",
    ].join("\n"),
    judge: {
      solutionCode: `// Two passes over a map from original to clone.
function copyRandomList(head) {
  const clones = new Map();
  for (let node = head; node; node = node.next) {
    clones.set(node, { val: node.val, next: null, random: null });
  }
  for (let node = head; node; node = node.next) {
    const clone = clones.get(node);
    clone.next = node.next ? clones.get(node.next) : null;
    clone.random = node.random ? clones.get(node.random) : null;
  }
  return head ? clones.get(head) : null;
}
`,
      starterCode: `/**
 * Nodes are { val, next, random }; next and random are null when absent.
 * @returns the head of a deep copy, or null for an empty list
 */
function copyRandomList(head) {
  // Your code here
  return null;
}
`,
      entry: "__judgeCopy",
      driverCode: `function __judgeCopy(spec) {
  const nodes = spec.map(([val]) => ({ val, next: null, random: null }));
  spec.forEach(([, random], i) => {
    nodes[i].next = nodes[i + 1] ?? null;
    nodes[i].random = random === null ? null : nodes[random];
  });
  const result = copyRandomList(nodes[0] ?? null);
  if (nodes.length === 0) return result === null ? [] : "expected null for an empty list";
  const originals = new Set(nodes);
  const copy = [];
  const seen = new Set();
  for (let node = result; node; node = node.next) {
    if (originals.has(node)) return "the copy shares a node with the original";
    if (seen.has(node) || copy.length > nodes.length) return "the copy is longer than the original";
    seen.add(node);
    copy.push(node);
  }
  if (copy.length !== nodes.length) return "the copy has " + copy.length + " nodes, not " + nodes.length;
  const index = new Map(copy.map((node, i) => [node, i]));
  const out = [];
  for (let i = 0; i < copy.length; i++) {
    if (copy[i].val !== nodes[i].val) return "node " + i + " has the wrong value";
    if (copy[i].random === null) out.push([copy[i].val, null]);
    else if (!index.has(copy[i].random)) return "node " + i + " points at a node outside the copy";
    else out.push([copy[i].val, index.get(copy[i].random)]);
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [7, null],
              [13, 0],
              [11, 4],
              [10, 2],
              [1, 0],
            ],
          ],
          expected: [
            [7, null],
            [13, 0],
            [11, 4],
            [10, 2],
            [1, 0],
          ],
        },
        {
          name: "Randoms pointing at the same node",
          input: [
            [
              [1, 1],
              [2, 1],
            ],
          ],
          expected: [
            [1, 1],
            [2, 1],
          ],
        },
        {
          name: "Mostly null randoms",
          input: [
            [
              [3, null],
              [3, 0],
              [3, null],
            ],
          ],
          expected: [
            [3, null],
            [3, 0],
            [3, null],
          ],
        },
        { name: "Empty list", input: [[]], expected: [] },
        { name: "A node pointing at itself", input: [[[1, 0]]], expected: [[1, 0]] },
        {
          name: "Duplicate values are told apart by position",
          input: [
            [
              [5, 2],
              [5, 2],
              [5, 0],
            ],
          ],
          expected: [
            [5, 2],
            [5, 2],
            [5, 0],
          ],
        },
      ],
    },
  },
];
