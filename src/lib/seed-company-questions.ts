import type { Difficulty, Timeframe } from "./types";

/**
 * LeetCode listings curated by hand for companies the upstream snapshot
 * (src/db/leetcode-questions.json) does not cover. db:seed inserts the
 * questions the snapshot lacks from `meta`, then adds these company rows
 * after the snapshot's, which win on a clash.
 */
export interface CuratedQuestion {
  /** LeetCode's slug. */
  slug: string;
  /** LeetCode's 0-100 relative frequency, per window the source reports. */
  scores: Partial<Record<Timeframe, number>>;
  /** Title, difficulty and topics for a question the snapshot lacks. */
  meta?: { title: string; difficulty: Difficulty; topics: string[] };
}

export interface CuratedListing {
  company: string;
  questions: CuratedQuestion[];
}

/** Rows are [slug, all-time score, six-month score?, three-month score?]. */
type TagRow = [string, number, number?, number?];

/**
 * LeetCode's Snowflake tag as the SWE interview study guide read it on 12
 * Oct 2026: 100 questions with all-time scores, 20 of them asked in the
 * last six months and 3 in the last three, none in the last 30 days. The
 * guide gives no separate scores for the over-six-months window, so that
 * window stays empty rather than guessed.
 */
const SNOWFLAKE_TAG: TagRow[] = [
  // Asked in the last six months.
  ["parallel-courses-iii", 99.2, 100, 100],
  ["design-in-memory-file-system", 96.7, 75.4, 89],
  ["trapping-rain-water", 85.6, 75.4],
  ["throne-inheritance", 85.6, 75.4],
  ["calculate-amount-paid-in-taxes", 85.6, 75.4, 89],
  ["count-vowel-substrings-of-a-string", 80.9, 75.4],
  ["happy-number", 100, 68.9],
  ["course-schedule-ii", 96.7, 59.9],
  ["step-by-step-directions-from-a-binary-tree-node-to-another", 85.6, 59.9],
  ["course-schedule", 72.5, 59.9],
  ["parallel-courses", 69.8, 59.9],
  ["simplify-path", 66.7, 59.9],
  ["top-k-frequent-elements", 66.7, 59.9],
  ["shortest-word-distance", 63.2, 59.9],
  ["boundary-of-binary-tree", 63.2, 59.9],
  ["min-stack", 54, 59.9],
  ["count-nodes-equal-to-average-of-subtree", 47.5, 59.9],
  ["most-frequent-ids", 47.5, 59.9],
  ["construct-quad-tree", 38.4, 59.9],
  ["possible-bipartition", 38.4, 59.9],
  // High all-time score, not seen in the last six months.
  ["minimum-window-substring", 91.8],
  ["word-search-ii", 89.6],
  ["painting-the-walls", 85.6],
  ["find-all-anagrams-in-a-string", 82.6],
  ["maximum-profit-in-job-scheduling", 82.6],
  ["maximum-number-of-upgradable-servers", 77.1],
  ["string-transformation", 74.9],
  ["minimum-array-length-after-pair-removals", 72.5],
  ["find-the-maximum-length-of-a-good-subsequence-i", 72.5],
  ["merge-k-sorted-lists", 69.8],
  ["number-of-ways-to-form-a-target-string-given-a-dictionary", 69.8],
  ["find-the-maximum-length-of-a-good-subsequence-ii", 69.8],
  ["minimum-absolute-difference-between-two-values", 69.8],
  ["two-sum", 66.7],
  ["max-area-of-island", 66.7],
  ["basic-calculator", 63.2],
  ["time-based-key-value-store", 63.2],
  ["maximum-number-of-events-that-can-be-attended", 63.2],
  // The remaining 62, by all-time score.
  ["design-hit-counter", 54],
  ["insert-delete-getrandom-o1", 54],
  ["single-element-in-a-sorted-array", 54],
  ["design-log-storage-system", 54],
  ["design-hashmap", 54],
  ["maximize-distance-to-closest-person", 54],
  ["snapshot-array", 54],
  ["merge-two-sorted-lists", 59.1],
  ["copy-list-with-random-pointer", 59.1],
  ["lru-cache", 59.1],
  ["design-add-and-search-words-data-structure", 59.1],
  ["task-scheduler", 59.1],
  ["remove-sub-folders-from-the-filesystem", 59.1],
  ["web-crawler", 59.1],
  ["web-crawler-multithreaded", 59.1],
  ["maximum-number-of-events-that-can-be-attended-ii", 59.1],
  ["regular-expression-matching", 47.5],
  ["roman-to-integer", 47.5],
  ["graph-valid-tree", 47.5],
  ["integer-to-english-words", 47.5],
  ["longest-univalue-path", 47.5],
  ["cheapest-flights-within-k-stops", 47.5],
  ["making-a-large-island", 47.5],
  ["keys-and-rooms", 47.5],
  ["reverse-only-letters", 47.5],
  ["most-stones-removed-with-same-row-or-column", 47.5],
  ["rotting-oranges", 47.5],
  ["campus-bikes", 47.5],
  ["design-file-system", 47.5],
  ["parallel-courses-ii", 47.5],
  ["add-two-numbers", 38.4],
  ["jump-game-ii", 38.4],
  ["n-queens-ii", 38.4],
  ["sort-colors", 38.4],
  ["binary-tree-inorder-traversal", 38.4],
  ["construct-binary-tree-from-preorder-and-inorder-traversal", 38.4],
  ["populating-next-right-pointers-in-each-node", 38.4],
  ["populating-next-right-pointers-in-each-node-ii", 38.4],
  ["best-time-to-buy-and-sell-stock", 38.4],
  ["number-of-islands", 38.4],
  ["implement-trie-prefix-tree", 38.4],
  ["basic-calculator-ii", 38.4],
  ["meeting-rooms-ii", 38.4],
  ["encode-and-decode-strings", 38.4],
  ["paint-fence", 38.4],
  ["find-median-from-data-stream", 38.4],
  ["patching-array", 38.4],
  ["decode-string", 38.4],
  ["remove-k-digits", 38.4],
  ["valid-word-abbreviation", 38.4],
  ["the-maze", 38.4],
  ["design-circular-queue", 38.4],
  ["design-circular-deque", 38.4],
  ["my-calendar-i", 38.4],
  ["shortest-distance-to-a-character", 38.4],
  ["boats-to-save-people", 38.4],
  ["shortest-bridge", 38.4],
  ["design-browser-history", 38.4],
  ["alert-using-same-key-card-three-or-more-times-in-a-one-hour-period", 38.4],
  ["path-with-minimum-effort", 38.4],
  ["height-of-binary-tree-after-subtree-removal-queries", 38.4],
  ["most-profitable-path-in-a-tree", 38.4],
];

/**
 * LeetCode questions the guide names for Snowflake prep that the tag does
 * not score: the Blind 75 the recruiter's email points at for the backend
 * round, the email's own samples, and the long tail of interview reports.
 * Listed all-time only, at a nominal score under the tag's lowest (38.4),
 * so they sort after every tagged question.
 */
const GUIDE_PICK_SCORE = 20;
const SNOWFLAKE_GUIDE_PICKS: string[] = [
  "3sum",
  "find-first-and-last-position-of-element-in-sorted-array",
  "longest-substring-with-at-most-k-distinct-characters",
  "alien-dictionary",
  "binary-tree-level-order-traversal",
  "binary-tree-maximum-path-sum",
  "check-if-an-original-string-exists-given-two-encoded-strings",
  "climbing-stairs",
  "clone-graph",
  "coin-change",
  "combination-sum-iv",
  "container-with-most-water",
  "contains-duplicate",
  "counting-bits",
  "decode-ways",
  "find-minimum-in-rotated-sorted-array",
  "grid-game",
  "group-anagrams",
  "house-robber",
  "house-robber-ii",
  "insert-interval",
  "invert-binary-tree",
  "jump-game",
  "kth-smallest-element-in-a-bst",
  "linked-list-cycle",
  "longest-common-subsequence",
  "longest-consecutive-sequence",
  "longest-increasing-subsequence",
  "longest-palindromic-substring",
  "longest-repeating-character-replacement",
  "longest-substring-without-repeating-characters",
  "lowest-common-ancestor-of-a-binary-search-tree",
  "maximum-depth-of-binary-tree",
  "maximum-product-subarray",
  "maximum-subarray",
  "maximum-width-of-binary-tree",
  "meeting-rooms",
  "merge-intervals",
  "missing-number",
  "n-queens",
  "non-overlapping-intervals",
  "number-of-1-bits",
  "number-of-connected-components-in-an-undirected-graph",
  "pacific-atlantic-water-flow",
  "palindromic-substrings",
  "product-of-array-except-self",
  "remove-nth-node-from-end-of-list",
  "reorder-list",
  "reverse-bits",
  "reverse-linked-list",
  "rotate-image",
  "same-tree",
  "search-in-rotated-sorted-array",
  "serialize-and-deserialize-binary-tree",
  "serialize-and-deserialize-bst",
  "set-matrix-zeroes",
  "spiral-matrix",
  "subtree-of-another-tree",
  "sum-of-two-integers",
  "unique-paths",
  "valid-anagram",
  "valid-palindrome",
  "valid-parentheses",
  "validate-binary-search-tree",
  "word-break",
  "word-search",
];

/** Questions the snapshot lacks, with LeetCode's own metadata. */
const META: Record<string, NonNullable<CuratedQuestion["meta"]>> = {
  "maximum-number-of-upgradable-servers": {
    title: "Maximum Number of Upgradable Servers",
    difficulty: "medium",
    topics: ["Array", "Math", "Binary Search"],
  },
  "minimum-array-length-after-pair-removals": {
    title: "Minimum Array Length After Pair Removals",
    difficulty: "medium",
    topics: [
      "Array",
      "Hash Table",
      "Two Pointers",
      "Binary Search",
      "Greedy",
      "Counting",
    ],
  },
  "find-the-maximum-length-of-a-good-subsequence-i": {
    title: "Find the Maximum Length of a Good Subsequence I",
    difficulty: "medium",
    topics: ["Array", "Hash Table", "Dynamic Programming"],
  },
  "find-the-maximum-length-of-a-good-subsequence-ii": {
    title: "Find the Maximum Length of a Good Subsequence II",
    difficulty: "hard",
    topics: ["Array", "Hash Table", "Dynamic Programming"],
  },
  "minimum-absolute-difference-between-two-values": {
    title: "Minimum Absolute Difference Between Two Values",
    difficulty: "easy",
    topics: ["Array", "Enumeration"],
  },
};

export const curatedListings: CuratedListing[] = [
  {
    company: "snowflake",
    questions: [
      ...SNOWFLAKE_TAG.map(([slug, all, sixMonths, threeMonths]) => ({
        slug,
        scores: {
          all,
          ...(sixMonths !== undefined && { "six-months": sixMonths }),
          ...(threeMonths !== undefined && { "three-months": threeMonths }),
        },
        meta: META[slug],
      })),
      ...SNOWFLAKE_GUIDE_PICKS.map((slug) => ({
        slug,
        scores: { all: GUIDE_PICK_SCORE },
      })),
    ],
  },
];

/**
 * Authored copies of LeetCode questions that moved into the listings above,
 * Callback slug -> LeetCode slug. db:seed deletes the rows (none had user
 * data when they moved) and next.config.ts sends their old URLs to LeetCode.
 */
export const MOVED_TO_LEETCODE: Record<string, string> = {
  "contains-duplicate": "contains-duplicate",
  "maximum-subarray": "maximum-subarray",
  "maximum-product-subarray": "maximum-product-subarray",
  "find-minimum-in-rotated-sorted-array":
    "find-minimum-in-rotated-sorted-array",
  "search-in-rotated-sorted-array": "search-in-rotated-sorted-array",
  "three-sum": "3sum",
  "container-with-most-water": "container-with-most-water",
  "sum-of-two-integers": "sum-of-two-integers",
  "number-of-1-bits": "number-of-1-bits",
  "counting-bits": "counting-bits",
  "missing-number": "missing-number",
  "reverse-bits": "reverse-bits",
  "climbing-stairs": "climbing-stairs",
  "coin-change": "coin-change",
  "longest-increasing-subsequence": "longest-increasing-subsequence",
  "longest-common-subsequence": "longest-common-subsequence",
  "word-break": "word-break",
  "combination-sum-iv": "combination-sum-iv",
  "house-robber": "house-robber",
  "house-robber-ii": "house-robber-ii",
  "decode-ways": "decode-ways",
  "unique-paths": "unique-paths",
  "jump-game": "jump-game",
  "clone-graph": "clone-graph",
  "pacific-atlantic-water-flow": "pacific-atlantic-water-flow",
  "longest-consecutive-sequence": "longest-consecutive-sequence",
  "alien-dictionary": "alien-dictionary",
  "non-overlapping-intervals": "non-overlapping-intervals",
  "meeting-rooms": "meeting-rooms",
  "reverse-linked-list": "reverse-linked-list",
  "linked-list-cycle": "linked-list-cycle",
  "remove-nth-node-from-end": "remove-nth-node-from-end-of-list",
  "reorder-list": "reorder-list",
  "set-matrix-zeroes": "set-matrix-zeroes",
  "spiral-matrix": "spiral-matrix",
  "rotate-image": "rotate-image",
  "longest-substring-without-repeating-characters":
    "longest-substring-without-repeating-characters",
  "longest-repeating-character-replacement":
    "longest-repeating-character-replacement",
  "valid-anagram": "valid-anagram",
  "valid-palindrome": "valid-palindrome",
  "longest-palindromic-substring": "longest-palindromic-substring",
  "palindromic-substrings": "palindromic-substrings",
  "grid-game": "grid-game",
  "maximum-depth-of-binary-tree": "maximum-depth-of-binary-tree",
  "same-tree": "same-tree",
  "invert-binary-tree": "invert-binary-tree",
  "binary-tree-maximum-path-sum": "binary-tree-maximum-path-sum",
  "binary-tree-level-order-traversal": "binary-tree-level-order-traversal",
  "maximum-width-of-binary-tree": "maximum-width-of-binary-tree",
  "serialize-and-deserialize-binary-tree":
    "serialize-and-deserialize-binary-tree",
  "serialize-and-deserialize-bst": "serialize-and-deserialize-bst",
  "subtree-of-another-tree": "subtree-of-another-tree",
  "validate-binary-search-tree": "validate-binary-search-tree",
  "kth-smallest-element-in-a-bst": "kth-smallest-element-in-a-bst",
  "lowest-common-ancestor-of-a-bst":
    "lowest-common-ancestor-of-a-binary-search-tree",
  "course-order": "course-schedule-ii",
  "course-finish-time": "parallel-courses-iii",
  "minimum-meeting-rooms": "meeting-rooms-ii",
  "max-events-attended": "maximum-number-of-events-that-can-be-attended",
  "job-scheduling-max-profit": "maximum-profit-in-job-scheduling",
  "boundary-of-binary-tree": "boundary-of-binary-tree",
  "longest-univalue-path": "longest-univalue-path",
  "step-by-step-directions":
    "step-by-step-directions-from-a-binary-tree-node-to-another",
  "throne-inheritance": "throne-inheritance",
  "encode-decode-strings": "encode-and-decode-strings",
  "valid-parentheses": "valid-parentheses",
  "find-all-anagrams": "find-all-anagrams-in-a-string",
  "cheapest-flights-k-stops": "cheapest-flights-within-k-stops",
  "merge-k-sorted-lists": "merge-k-sorted-lists",
  "copy-list-with-random-pointer": "copy-list-with-random-pointer",
  "merge-two-sorted-lists": "merge-two-sorted-lists",
  "happy-number": "happy-number",
  "amount-paid-in-taxes": "calculate-amount-paid-in-taxes",
  "design-circular-queue": "design-circular-queue",
  "n-queens": "n-queens",
  "original-string-exists":
    "check-if-an-original-string-exists-given-two-encoded-strings",
  "rotting-oranges": "rotting-oranges",
  "max-area-of-island": "max-area-of-island",
  "making-a-large-island": "making-a-large-island",
  "graph-valid-tree": "graph-valid-tree",
  "keys-and-rooms": "keys-and-rooms",
  "most-stones-removed": "most-stones-removed-with-same-row-or-column",
  "parallel-courses-ii": "parallel-courses-ii",
  "campus-bikes": "campus-bikes",
  "most-profitable-path-in-a-tree": "most-profitable-path-in-a-tree",
  "binary-tree-inorder-traversal": "binary-tree-inorder-traversal",
  "construct-binary-tree-from-preorder-and-inorder":
    "construct-binary-tree-from-preorder-and-inorder-traversal",
  "populating-next-right-pointers":
    "populating-next-right-pointers-in-each-node",
  "simplify-path": "simplify-path",
  "basic-calculator": "basic-calculator",
  "decode-string": "decode-string",
  "roman-to-integer": "roman-to-integer",
  "integer-to-english-words": "integer-to-english-words",
  "reverse-only-letters": "reverse-only-letters",
  "regular-expression-matching": "regular-expression-matching",
  "valid-word-abbreviation": "valid-word-abbreviation",
  "remove-k-digits": "remove-k-digits",
  "count-vowel-substrings": "count-vowel-substrings-of-a-string",
  "number-of-ways-to-form-target":
    "number-of-ways-to-form-a-target-string-given-a-dictionary",
  "string-transformation": "string-transformation",
  "trapping-rain-water": "trapping-rain-water",
  "jump-game-ii": "jump-game-ii",
  "best-time-to-buy-and-sell-stock": "best-time-to-buy-and-sell-stock",
  "boats-to-save-people": "boats-to-save-people",
  "shortest-distance-to-a-character": "shortest-distance-to-a-character",
  "maximize-distance-to-closest-person": "maximize-distance-to-closest-person",
  "painting-the-walls": "painting-the-walls",
  "max-upgradable-servers": "maximum-number-of-upgradable-servers",
  "min-array-length-after-pair-removals":
    "minimum-array-length-after-pair-removals",
  "paint-fence": "paint-fence",
  "patching-array": "patching-array",
  "min-absolute-difference-two-values":
    "minimum-absolute-difference-between-two-values",
  "maximum-length-good-subsequence":
    "find-the-maximum-length-of-a-good-subsequence-ii",
  "single-element-in-sorted-array": "single-element-in-a-sorted-array",
  "add-two-numbers": "add-two-numbers",
  "word-search": "word-search",
  "remove-sub-folders": "remove-sub-folders-from-the-filesystem",
  "max-events-attended-ii": "maximum-number-of-events-that-can-be-attended-ii",
  "implement-trie": "implement-trie-prefix-tree",
  "add-and-search-words": "design-add-and-search-words-data-structure",
  "insert-delete-getrandom": "insert-delete-getrandom-o1",
  "design-log-storage-system": "design-log-storage-system",
  "design-file-system": "design-file-system",
  "design-circular-deque": "design-circular-deque",
  "task-scheduler": "task-scheduler",
  "design-hit-counter": "design-hit-counter",
  "time-based-key-value-store": "time-based-key-value-store",
  "snapshot-array": "snapshot-array",
  "my-calendar-i": "my-calendar-i",
  "alert-using-same-key-card":
    "alert-using-same-key-card-three-or-more-times-in-a-one-hour-period",
  "most-frequent-ids": "most-frequent-ids",
  "shortest-bridge": "shortest-bridge",
  "the-maze": "the-maze",
  "path-with-minimum-effort": "path-with-minimum-effort",
  "count-nodes-equal-to-average-of-subtree":
    "count-nodes-equal-to-average-of-subtree",
  "construct-quad-tree": "construct-quad-tree",
  "height-after-subtree-removal-queries":
    "height-of-binary-tree-after-subtree-removal-queries",
  "two-sum": "two-sum",
};
