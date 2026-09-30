import type { Problem } from "./types";

// Apple front-end bank, part F: the first duplicate character (and its
// index), and merging arrays with unique values (each value once, values
// seen once, and objects by key). The product and run-length prompts are in
// seed-apple-js-k.ts. Python variants live in seed-python-apple-c.ts and
// seed-python-apple-e.ts.

export const appleJsProblemsF: Problem[] = [
  {
    slug: "first-duplicate-character",
    title: "First Duplicate Character",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "The first character whose second occurrence comes earliest — one pass with a set, emoji included.",
    prompt: [
      "Find the first character that repeats: the one whose **second** occurrence comes earliest. `firstDuplicate(str)` returns that character, or `null` when nothing repeats.",
      "",
      "```",
      "firstDuplicate(\"abca\")      // \"a\"",
      "firstDuplicate(\"abcdefe\")   // \"e\"",
      "firstDuplicate(\"abcdef\")    // null",
      "```",
      "",
      "Comparison is case-sensitive, spaces are characters, and an emoji counts as a single character.",
    ].join("\n"),
    hints: [
      "One pass with a `Set` of the characters seen so far. The first character already in the set is the answer.",
      "In JavaScript, `for...of` walks code points, so an emoji arrives whole. Indexing with `str[i]` walks UTF-16 units and splits it in two.",
    ],
    solution: [
      "## Approach",
      "",
      "Scan left to right with a set of characters seen so far. The first character that is already in the set is the one whose second occurrence comes earliest, so return it at once. Reaching the end means nothing repeats.",
      "",
      "## Worth saying out loud",
      "",
      "- O(n) time and O(k) space for an alphabet of k characters. For lowercase ASCII, a 26-bit mask is the same idea with no allocation.",
      "- \"First duplicate\" is ambiguous: the first character that repeats, or the character whose first occurrence is earliest among those that repeat? In `\"abba\"`, the first reading gives `\"b\"` and the second gives `\"a\"`. Ask.",
      "- `for...of` handles emoji; `str[i]` does not. A family emoji built with joiners spans several code points, and grapheme clusters need `Intl.Segmenter`.",
    ].join("\n"),
    judge: {
      starterCode: `/** The first character whose second occurrence comes earliest, or null. */
function firstDuplicate(str) {
  // Your code here
  return null;
}
`,
      solutionCode: `function firstDuplicate(str) {
  const seen = new Set();
  for (const ch of str) {
    // for...of walks code points, so an emoji arrives whole
    if (seen.has(ch)) return ch;
    seen.add(ch);
  }
  return null;
}
`,
      entry: "__judgeDuplicate",
      driverCode: `function __judgeDuplicate(s) {
  var ch = firstDuplicate(s);
  return ch === undefined ? null : ch;
}`,
      tests: [
        { name: "\"abca\" repeats a", input: ["abca"], expected: "a" },
        { name: "\"abcdefe\" repeats e", input: ["abcdefe"], expected: "e" },
        { name: "No repeats gives null", input: ["abcdef"], expected: null },
        { name: "The earliest second occurrence wins", input: ["abba"], expected: "b" },
        { name: "An empty string", input: [""], expected: null },
        { name: "Case-sensitive", input: ["aA"], expected: null },
        { name: "Spaces are characters", input: ["a b c "], expected: " " },
        { name: "An emoji is one character", input: ["🙂a🙂"], expected: "🙂" },
      ],
    },
  },
  {
    slug: "first-duplicate-index",
    title: "Index of the First Repeated Character",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Where the earliest second occurrence sits — the same set scan, returning an index.",
    prompt: [
      "Return the position of the first repeat: the index of the character whose **second** occurrence comes earliest, or `-1` when nothing repeats. `firstDuplicateIndex(str)`.",
      "",
      "```",
      "firstDuplicateIndex(\"abca\")     // 3   (the second \"a\")",
      "firstDuplicateIndex(\"abba\")     // 2   (the second \"b\")",
      "firstDuplicateIndex(\"abcdef\")   // -1",
      "```",
      "",
      "Comparison is case-sensitive, and spaces are characters. Inputs contain no emoji, so the index is the same in every language.",
    ].join("\n"),
    hints: [
      "Walk the indices with a `Set` of the characters seen so far; the first index whose character is already in the set is the answer.",
    ],
    solution: [
      "## Approach",
      "",
      "Scan the indices left to right with a set of characters seen. The first index whose character is already in the set is the earliest second occurrence.",
      "",
      "## Worth saying out loud",
      "",
      "- O(n) time and O(k) space for an alphabet of k characters.",
      "- With emoji in the input, \"index\" becomes ambiguous — UTF-16 units in JavaScript, code points in Python — which is why this version keeps to plain characters.",
    ].join("\n"),
    judge: {
      starterCode: `/** The index of the earliest second occurrence of any character, or -1. */
function firstDuplicateIndex(str) {
  // Your code here
  return -1;
}
`,
      solutionCode: `function firstDuplicateIndex(str) {
  const seen = new Set();
  for (let i = 0; i < str.length; i++) {
    if (seen.has(str[i])) return i;
    seen.add(str[i]);
  }
  return -1;
}
`,
      entry: "firstDuplicateIndex",
      tests: [
        { name: "The index version", input: ["abca"], expected: 3 },
        { name: "Index of the earliest second occurrence", input: ["abba"], expected: 2 },
        { name: "No repeats gives -1", input: ["abcdef"], expected: -1 },
        { name: "Index of an empty string", input: [""], expected: -1 },
        { name: "Spaces count", input: ["a b "], expected: 3 },
      ],
    },
  },
  {
    slug: "merge-arrays-unique-values",
    title: "Merge Two Arrays, Keep Unique Values",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Every value once, in first-seen order — a Set keeps insertion order.",
    prompt: [
      "Concatenate two arrays and keep every value once, in first-seen order: `union(a, b)`.",
      "",
      "```",
      "union([1, 2, 2, 3], [3, 4])   // [1, 2, 3, 4]",
      "```",
      "",
      "Values are numbers and strings, and `1` and `\"1\"` are different values.",
    ].join("\n"),
    hints: [
      "`union` is a `Set` over both arrays, and a `Set` keeps insertion order.",
    ],
    solution: [
      "## Approach",
      "",
      "Spread both arrays into a `Set`, which drops repeats and keeps first-seen order, then spread it back into an array.",
      "",
      "## Worth saying out loud",
      "",
      "- \"Unique\" has two readings: each value once, or only the values that occur exactly once. For `[1, 2, 2, 3]` and `[3, 4]` they give `[1, 2, 3, 4]` and `[1, 4]`. Ask which is meant.",
      "- `Set` compares with SameValueZero: `NaN` equals `NaN`, `1` differs from `\"1\"`, and objects compare by reference.",
      "- O(n + m). Nested `includes` calls are O(n·m) and the usual first draft.",
    ].join("\n"),
    judge: {
      starterCode: `/** Every value once, in first-seen order. */
function union(a, b) {
  // Your code here
  return [];
}
`,
      solutionCode: `function union(a, b) {
  return [...new Set([...a, ...b])]; // a Set keeps insertion order
}
`,
      entry: "union",
      tests: [
        { name: "union keeps each value once", input: [[1, 2, 2, 3], [3, 4]], expected: [1, 2, 3, 4] },
        { name: "union keeps first-seen order", input: [[3, 1], [2, 1, 3]], expected: [3, 1, 2] },
        { name: "1 and \"1\" are different values", input: [[1, "1"], ["1", 2]], expected: [1, "1", 2] },
        { name: "Two empty arrays", input: [[], []], expected: [] },
        { name: "Strings keep first-seen order", input: [["b", "a"], ["a", "c", "b"]], expected: ["b", "a", "c"] },
      ],
    },
  },
  {
    slug: "values-appearing-once",
    title: "Values That Appear Once Across Two Arrays",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Count every value across both arrays in a Map, then keep the ones counted exactly once.",
    prompt: [
      "Given two arrays, return only the values that occur **exactly once** across both, in first-seen order: `appearOnce(a, b)`.",
      "",
      "```",
      "appearOnce([1, 2, 2, 3], [3, 4])   // [1, 4]",
      "```",
      "",
      "Values are numbers and strings, and `1` and `\"1\"` are different values. Repeats within one array count too.",
    ].join("\n"),
    hints: [
      "Count every value in a `Map` over both arrays, then keep the values whose count is 1. A `Map` keeps first-seen order.",
    ],
    solution: [
      "## Approach",
      "",
      "Count occurrences across both arrays in a `Map`, which remembers the order keys were first inserted, then keep the values counted exactly once.",
      "",
      "## Worth saying out loud",
      "",
      "- A `Set` alone can't answer this — it forgets how many times a value appeared.",
      "- O(n + m) time and space.",
    ].join("\n"),
    judge: {
      starterCode: `/** The values that occur exactly once across both arrays, in first-seen order. */
function appearOnce(a, b) {
  // Your code here
  return [];
}
`,
      solutionCode: `function appearOnce(a, b) {
  const counts = new Map();
  for (const v of [...a, ...b]) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].filter(([, n]) => n === 1).map(([v]) => v);
}
`,
      entry: "appearOnce",
      tests: [
        { name: "appearOnce keeps values seen once", input: [[1, 2, 2, 3], [3, 4]], expected: [1, 4] },
        { name: "Repeats within one array count too", input: [[5, 5], [6]], expected: [6] },
        { name: "appearOnce with an empty side", input: [[], [1, 1, 2]], expected: [2] },
        { name: "When everything repeats", input: [[1, 2], [2, 1]], expected: [] },
      ],
    },
  },
  {
    slug: "merge-arrays-unique-by-key",
    title: "Merge Arrays of Objects, Unique by Key",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Objects compare by reference, so deduplicate on a property — the first object with each key wins.",
    prompt: [
      "Concatenate two arrays of objects and keep one object per value of the property `key`: `unionBy(a, b, key)`. The first object with each key wins, and the result keeps first-seen order.",
      "",
      "```",
      "unionBy([{ id: 1, n: \"a\" }, { id: 2, n: \"b\" }], [{ id: 2, n: \"B\" }, { id: 3, n: \"c\" }], \"id\")",
      "  // [{ id: 1, n: \"a\" }, { id: 2, n: \"b\" }, { id: 3, n: \"c\" }]",
      "```",
    ].join("\n"),
    hints: [
      "A `Set` of objects compares references, so two equal-looking objects both survive. Track the keys instead.",
      "Keep a set of keys already taken and push an object only when its key is new.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk both arrays with a set of keys seen. An object whose key is new is pushed and its key recorded; later objects with the same key are skipped.",
      "",
      "## Worth saying out loud",
      "",
      "- Objects compare by reference in `Set` and `Map`, which is why this needs a key at all.",
      "- \"Last one wins\" is the other policy: build a `Map` from key to object and let later entries overwrite — say which one the caller wants.",
    ].join("\n"),
    judge: {
      starterCode: `/** Deduplicate objects by the property \`key\`; the first object with each key wins. */
function unionBy(a, b, key) {
  // Your code here
  return [];
}
`,
      solutionCode: `function unionBy(a, b, key) {
  const seen = new Set();
  const out = [];
  for (const item of [...a, ...b]) {
    if (seen.has(item[key])) continue;
    seen.add(item[key]);
    out.push(item);
  }
  return out;
}
`,
      entry: "unionBy",
      tests: [
        { name: "unionBy compares objects by key", input: [[{ id: 1, n: "a" }, { id: 2, n: "b" }], [{ id: 2, n: "B" }, { id: 3, n: "c" }], "id"], expected: [{ id: 1, n: "a" }, { id: 2, n: "b" }, { id: 3, n: "c" }] },
        { name: "unionBy drops repeats within one array", input: [[{ id: 1, n: "a" }, { id: 1, n: "z" }], [], "id"], expected: [{ id: 1, n: "a" }] },
        { name: "Keys can be strings", input: [[{ tag: "x", v: 1 }], [{ tag: "y", v: 2 }, { tag: "x", v: 3 }], "tag"], expected: [{ tag: "x", v: 1 }, { tag: "y", v: 2 }] },
      ],
    },
  },
];
