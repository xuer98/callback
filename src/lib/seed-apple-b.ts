import type { Problem } from "./types";

// Apple phone-screen bank, part B: ballot counter, top-N frequent logs and
// synonym groups.
// Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsB: Problem[] = [
  {
    slug: "ranked-ballot-counter",
    title: "Memory-Bounded Ranked Ballot Counter",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Millions of ballots, Borda scoring, and memory that stays O(candidates) — the constraint is the question.",
    prompt: [
      "> \"Build a class to read millions of votes from a ballot list and perform rank-based vote counting. Had to handle batching to solve for memory usage.\"",
      "",
      "Reported verbatim from an ICT3 phone screen in Cupertino that ended in an offer; the memory constraint was in the prompt, not a follow-up.",
      "",
      "A **ballot** is a list of candidate names, most preferred first. Score it Borda-style: a ballot of `n` names gives `n - 1` points to its first name, `n - 2` to the second, and so on down to `0` for the last. Implement `RankedBallotCounter(batchSize)`:",
      "",
      "- `add(ballot)` — buffer the ballot; **as soon as the buffer holds `batchSize` ballots, flush it** into the running totals and empty it. Never keep every ballot.",
      "- `extend(ballots)` — `add` each one.",
      "- `results(topK?)` — flush whatever is buffered, then return `[[candidate, score], ...]` sorted by score descending, then name ascending; `topK` truncates when given.",
      "- `firstPlaceCounts()` — flush, then return `[[candidate, ballotsRankingThemFirst], ...]` with the same ordering.",
      "- `stats()` — `{ ballotsSeen, batchesFlushed, buffered }` without flushing: ballots counted so far by flushes, the number of non-empty flushes, and how many ballots are still buffered.",
      "",
      "Every candidate that appears on any ballot appears in `results()`, even with a score of 0. An empty ballot is a ballot: it counts toward `ballotsSeen` and scores nobody.",
      "",
      "```",
      "counter = RankedBallotCounter(10)",
      "counter.add([\"alice\", \"bob\", \"carol\"])   // alice 2, bob 1, carol 0",
      "counter.add([\"bob\", \"alice\", \"carol\"])   // bob 2, alice 1",
      "counter.add([\"alice\", \"carol\", \"bob\"])   // alice 2, carol 1",
      "counter.results()  ->  [[\"alice\", 5], [\"bob\", 3], [\"carol\", 1]]",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Which counting rule — plurality, Borda, or instant-runoff? Do ballots always list every candidate? How are ties broken? Is the input an iterator I can stream, or a list already in memory?",
    ].join("\n"),
    hints: [
      "The score is a sum over ballots, so the state you need is one counter per candidate — O(candidates), independent of how many ballots arrive. The buffer exists only to model batch processing; flushing it means folding each buffered ballot into the counters and clearing it.",
      "Sort the results with a compound key: score descending, then name ascending. Deterministic tie-breaks matter more in an evaluation harness than anywhere else, because a flaky ranking looks like a regression.",
    ],
    solution: [
      "## Approach",
      "",
      "The constraint is the question. Say \"millions of ballots means I will not hold the input — I expose `add()` and flush in batches, so memory is O(candidates), not O(ballots)\" before writing a line, then name the three counting rules (plurality, Borda, instant-runoff) and pick Borda as the safe reading of \"rank-based\".",
      "",
      "The class keeps a small buffer, a score counter and a first-place counter. `add` appends to the buffer and flushes when it reaches `batchSize`; a flush walks the buffered ballots, awards `n - 1 - i` points to the name at index `i`, credits the first name's first-place count, bumps `ballotsSeen`, then clears the buffer and counts one batch. `results` and `firstPlaceCounts` flush first so a partial batch is never lost, then sort by `(-score, name)`.",
      "",
      "## Complexity",
      "",
      "O(total ranks) time to score everything and O(c log c) to sort c candidates; O(c + batchSize) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **Instant-runoff?** Needs multiple passes over the ballots, so a single stream no longer works: either persist ballots in batches or keep counts keyed by the remaining-candidate set. It is a real change of shape, and naming it beats bluffing.",
      "- **Distribute it?** Per-shard counters, then sum — the score is a commutative monoid, so the merge is trivially parallel.",
      "- **Ties?** The sort key is already `(-score, name)`; a deterministic order is part of the contract.",
      "- Same problem in a different suit: swap ballots for graded model responses and candidates for models, and this is a preference-evaluation leaderboard.",
    ].join("\n"),
    judge: {
      solutionCode: `function byScoreThenName(a, b) {
  return b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
}

class RankedBallotCounter {
  constructor(batchSize = 10000) {
    this.batchSize = batchSize;
    this.buffer = [];
    this.scores = new Map();      // candidate -> Borda points
    this.firstPlace = new Map();  // candidate -> ballots ranking them first
    this.ballotsSeen = 0;
    this.batchesFlushed = 0;
  }

  add(ballot) {
    this.buffer.push(ballot);
    if (this.buffer.length >= this.batchSize) this.flush();
  }

  extend(ballots) {
    for (const ballot of ballots) this.add(ballot);
  }

  // Fold the buffered batch into the counters; memory stays O(candidates).
  flush() {
    if (this.buffer.length === 0) return;
    for (const ballot of this.buffer) {
      const n = ballot.length;
      if (n > 0) this.firstPlace.set(ballot[0], (this.firstPlace.get(ballot[0]) ?? 0) + 1);
      ballot.forEach((name, i) => {
        this.scores.set(name, (this.scores.get(name) ?? 0) + (n - 1 - i));
      });
      this.ballotsSeen++;
    }
    this.buffer = [];
    this.batchesFlushed++;
  }

  results(topK = null) {
    this.flush();
    const ordered = [...this.scores].sort(byScoreThenName);
    return topK ? ordered.slice(0, topK) : ordered;
  }

  firstPlaceCounts() {
    this.flush();
    return [...this.firstPlace].sort(byScoreThenName);
  }

  stats() {
    return {
      ballotsSeen: this.ballotsSeen,
      batchesFlushed: this.batchesFlushed,
      buffered: this.buffer.length,
    };
  }
}
`,
      starterCode: `class RankedBallotCounter {
  /** @param {number} batchSize flush the buffer once it holds this many ballots */
  constructor(batchSize = 10000) {
    this.batchSize = batchSize;
  }

  /** @param {string[]} ballot candidate names, most preferred first */
  add(ballot) {
    // Your code here
  }

  extend(ballots) {
    for (const ballot of ballots) this.add(ballot);
  }

  /** @returns {[string, number][]} [candidate, score] by score desc, then name asc */
  results(topK = null) {
    return [];
  }

  /** @returns {[string, number][]} [candidate, first-place ballots], same ordering */
  firstPlaceCounts() {
    return [];
  }

  /** @returns {{ ballotsSeen: number, batchesFlushed: number, buffered: number }} */
  stats() {
    return { ballotsSeen: 0, batchesFlushed: 0, buffered: 0 };
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let counter = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "RankedBallotCounter") {
      counter = new RankedBallotCounter(...args[i]);
      out.push(null);
    } else {
      out.push(counter[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example: Borda scores",
          input: [
            ["RankedBallotCounter", "add", "add", "add", "results"],
            [[10], [["alice", "bob", "carol"]], [["bob", "alice", "carol"]], [["alice", "carol", "bob"]], []],
          ],
          expected: [null, null, null, null, [["alice", 5], ["bob", 3], ["carol", 1]]],
        },
        {
          name: "Ties break by name",
          input: [
            ["RankedBallotCounter", "add", "add", "results"],
            [[10], [["b", "a"]], [["a", "b"]], []],
          ],
          expected: [null, null, null, [["a", 1], ["b", 1]]],
        },
        {
          name: "Batches flush at batchSize; results flushes the remainder",
          input: [
            ["RankedBallotCounter", "add", "add", "add", "add", "add", "stats", "results", "stats"],
            [[2], [["x", "y"]], [["x", "y"]], [["x", "y"]], [["x", "y"]], [["x", "y"]], [], [], []],
          ],
          expected: [
            null, null, null, null, null, null,
            { ballotsSeen: 4, batchesFlushed: 2, buffered: 1 },
            [["x", 5], ["y", 0]],
            { ballotsSeen: 5, batchesFlushed: 3, buffered: 0 },
          ],
        },
        {
          name: "extend, topK and first-place counts",
          input: [
            ["RankedBallotCounter", "extend", "results", "firstPlaceCounts"],
            [[3], [[["a", "b", "c"], ["a", "c", "b"], ["c", "a", "b"], ["b", "a", "c"]]], [2], []],
          ],
          expected: [null, null, [["a", 6], ["b", 3]], [["a", 2], ["b", 1], ["c", 1]]],
        },
        {
          name: "Empty and single-name ballots",
          input: [
            ["RankedBallotCounter", "add", "add", "stats", "results", "firstPlaceCounts"],
            [[1], [[]], [["solo"]], [], [], []],
          ],
          expected: [
            null, null, null,
            { ballotsSeen: 2, batchesFlushed: 2, buffered: 0 },
            [["solo", 0]],
            [["solo", 1]],
          ],
        },
        {
          name: "Results before any ballot",
          input: [["RankedBallotCounter", "results", "stats"], [[5], [], []]],
          expected: [null, [], { ballotsSeen: 0, batchesFlushed: 0, buffered: 0 }],
        },
      ],
    },
  },
  {
    slug: "top-n-frequent-logs",
    title: "Top-N Frequent Log Lines",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Bucket sort when the multiset fits, a size-N heap when it's a stream — say both.",
    prompt: [
      "Return the `n` most frequent entries in a log stream. Ties are broken lexicographically (the smaller string first).",
      "",
      "```",
      "topNFrequent([\"a\", \"b\", \"a\", \"c\", \"b\", \"a\"], 2)  ->  [\"a\", \"b\"]",
      "topNFrequent([\"x\", \"y\", \"z\", \"y\", \"x\", \"z\"], 2)  ->  [\"x\", \"y\"]   // all tied, lexicographic",
      "```",
      "",
      "If fewer than `n` distinct lines exist, return all of them in order; `n = 0` returns nothing.",
      "",
      "Reported for an Apple AI Engineer phone screen; the plain top-k-frequent version appears independently in another Apple screen.",
      "",
      "## Worth asking out loud",
      "",
      "Does the full multiset fit in memory, or is this a stream where memory should be bounded by `n`? Is `n` small relative to the number of distinct lines? Are ties expected to be deterministic?",
    ].join("\n"),
    hints: [
      "Count first. With the counts in hand there are two finishes: bucket the distinct lines by frequency and walk the buckets from the top (O(d) time, O(d) space), or keep a min-heap of size n keyed by (count, reversed lexicographic order) so memory is bounded by n.",
      "Whichever finish you pick, ties inside a frequency must come out in lexicographic order — sort each bucket, or make the heap key compare strings in reverse so the lexicographically smaller line wins.",
    ],
    solution: [
      "## Approach",
      "",
      "Two answers, and saying both is the point. Bucket sort is O(d) once the counts exist: index an array by frequency, drop each distinct line into its bucket, walk the buckets from the highest frequency down, sorting each bucket lexicographically before emitting. A bounded heap is O(d log n) but keeps only n entries in memory — and for a *log stream*, that is the one they want. Ask which you are optimising, then write that one; the reference shows the bucket version in JavaScript and the bounded-heap version in Python.",
      "",
      "## Complexity",
      "",
      "Counting is O(m) over m lines. Bucket finish: O(d + d log d) worst case for the per-bucket sorts, O(d) space. Heap finish: O(d log n) time, O(n) space beyond the counts.",
      "",
      "## Worth saying out loud",
      "",
      "- **The stream does not fit in memory at all?** Exact top-k is impossible in sublinear space. Name Count-Min Sketch or Space-Saving / Misra-Gries and state the trade: approximate counts, bounded error, fixed memory.",
      "- **Over a sliding hour?** Counters need eviction — bucketed sub-windows summed over the live buckets, the same trick as a sliding-window rate limiter.",
      "- The Python heap key `(count, reversed string)` is how one min-heap gives a max on frequency and a min on the string at the same time; `heapq.nsmallest` with a `(-count, line)` key hides the trick and is fine in the room.",
    ].join("\n"),
    judge: {
      solutionCode: `// Bucket sort: O(d) after counting, with each bucket sorted for deterministic ties.
function topNFrequent(lines, n) {
  const counts = new Map();
  for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1);
  const buckets = Array.from({ length: lines.length + 1 }, () => []);
  for (const [line, count] of counts) buckets[count].push(line);
  const out = [];
  for (let f = buckets.length - 1; f > 0 && out.length < n; f--) {
    for (const line of buckets[f].sort()) {
      if (out.length === n) break;
      out.push(line);
    }
  }
  return out;
}
`,
      starterCode: `/**
 * @param {string[]} lines
 * @param {number} n
 * @returns {string[]} the n most frequent lines, most frequent first; ties lexicographic
 */
function topNFrequent(lines, n) {
  // Your code here
  return [];
}
`,
      entry: "topNFrequent",
      tests: [
        { name: "Prompt example", input: [["a", "b", "a", "c", "b", "a"], 2], expected: ["a", "b"] },
        { name: "All tied: lexicographic order", input: [["x", "y", "z", "y", "x", "z"], 2], expected: ["x", "y"] },
        { name: "Fewer distinct lines than n", input: [["err", "warn", "err"], 5], expected: ["err", "warn"] },
        { name: "n = 0", input: [["a", "b"], 0], expected: [] },
        {
          name: "Ties inside a frequency band",
          input: [["login failed", "timeout", "login failed", "disk full", "timeout", "cache miss"], 3],
          expected: ["login failed", "timeout", "cache miss"],
        },
        { name: "Empty stream", input: [[], 3], expected: [] },
        { name: "One dominant line", input: [["q", "q", "q", "q", "q", "r", "s", "r"], 2], expected: ["q", "r"] },
      ],
    },
  },
  {
    slug: "synonym-groups",
    title: "Synonym Groups",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "\"Bidirectional and transitive\" means connected components — union-find, keyed by the smallest word.",
    prompt: [
      "Given a list of string pairs, each meaning the two words are synonyms — a relation that is **bidirectional and transitive** — merge all related words into groups. Return a map whose key is the lexicographically smallest word in each group and whose value is the group sorted ascending.",
      "",
      "```",
      "synonymGroups([[\"a\", \"b\"], [\"b\", \"c\"], [\"d\", \"e\"]])",
      "  ->  { \"a\": [\"a\", \"b\", \"c\"], \"d\": [\"d\", \"e\"] }",
      "```",
      "",
      "Pairs may repeat, may arrive in any order, and a word may be paired with itself — it still forms a group. Comparison is plain string order (`\"Mango\"` sorts before `\"apple\"`).",
      "",
      "## Follow-up",
      "",
      "Pairs keep streaming in after the first answer. Which structure lets each new pair cost near-constant time instead of re-walking the graph?",
      "",
      "## Worth asking out loud",
      "",
      "Is the relation symmetric and transitive — so I'm computing connected components? Can words appear in no pair at all? Is the comparison case-sensitive? Will pairs keep arriving after the first answer?",
    ].join("\n"),
    hints: [
      "Restate the relation as connected components of an undirected graph. Union-find fits because the relation is incremental: register both words, union them, then group every word by its root.",
      "DFS over an adjacency list also works and is easier to write; offer both and let the interviewer pick. Either way, sort each group and key it by its first element.",
    ],
    solution: [
      "## Approach",
      "",
      "Say \"bidirectional and transitive\" back as \"connected components\" — that single reframing is most of the credit. Then union-find: `find` with path compression, `union` by rank, and a `find` call for each word before the union so that a word paired only with itself still registers as a singleton. Afterwards, bucket every registered word by its root, sort each bucket, and key the map by the bucket's first word.",
      "",
      "## Complexity",
      "",
      "O(p α(w)) for p pairs over w distinct words, plus O(w log w) to sort the groups; O(w) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **Pairs keep streaming in?** That is exactly why union-find and not DFS: each new pair is near-O(1), whereas DFS re-walks the graph.",
      "- **\"Merge accounts, not words\"** is LeetCode 721 — same skeleton, but the union key is the email and the output carries the name. Recognising it as the same problem is worth saying.",
      "- **Watch for:** a word that appears in no pair still forms a group of one; path compression plus union by rank is what keeps `find` flat, so mention both.",
    ].join("\n"),
    judge: {
      solutionCode: `class DSU {
  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }
  find(x) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root);
    while (this.parent.get(x) !== root) { // path compression
      const next = this.parent.get(x);
      this.parent.set(x, root);
      x = next;
    }
    return root;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank.get(ra) < this.rank.get(rb)) [ra, rb] = [rb, ra];
    this.parent.set(rb, ra);
    if (this.rank.get(ra) === this.rank.get(rb)) this.rank.set(ra, this.rank.get(ra) + 1);
    return true;
  }
}

function synonymGroups(pairs) {
  const dsu = new DSU();
  for (const [a, b] of pairs) dsu.union(a, b); // find() inside union registers singletons
  const groups = new Map();
  for (const word of dsu.parent.keys()) {
    const root = dsu.find(word);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(word);
  }
  const out = {};
  for (const group of groups.values()) {
    group.sort();
    out[group[0]] = group;
  }
  return out;
}
`,
      starterCode: `/**
 * @param {[string, string][]} pairs
 * @returns {Record<string, string[]>} smallest word -> the whole group, sorted
 */
function synonymGroups(pairs) {
  // Your code here
  return {};
}
`,
      entry: "synonymGroups",
      tests: [
        {
          name: "Prompt example",
          input: [[["a", "b"], ["b", "c"], ["d", "e"]]],
          expected: { a: ["a", "b", "c"], d: ["d", "e"] },
        },
        {
          name: "Late pair merges two groups",
          input: [[["x", "y"], ["p", "q"], ["y", "q"]]],
          expected: { p: ["p", "q", "x", "y"] },
        },
        { name: "A word paired with itself is a group of one", input: [[["k", "k"]]], expected: { k: ["k"] } },
        {
          name: "Duplicate and reversed pairs",
          input: [[["m", "n"], ["n", "m"], ["m", "n"]]],
          expected: { m: ["m", "n"] },
        },
        { name: "No pairs", input: [[]], expected: {} },
        {
          name: "Plain string order: uppercase sorts first",
          input: [[["Zebra", "apple"], ["apple", "Mango"]]],
          expected: { Mango: ["Mango", "Zebra", "apple"] },
        },
        {
          name: "A chain and a separate pair",
          input: [[["c", "b"], ["b", "a"], ["e", "d"], ["a", "z"]]],
          expected: { a: ["a", "b", "c", "z"], d: ["d", "e"] },
        },
      ],
    },
  },
];
