import type { Problem } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), part F: the
// short string and array prompts from Glassdoor and Medium screens — first
// duplicate character, merging with unique values, the ambiguous
// [3, 4, 5] -> [20, 15, 12], and run-length compression. JavaScript judges
// here; the Python variants live in seed-python-apple-c.ts.

export const appleJsProblemsF: Problem[] = [
  {
    slug: "first-duplicate-character",
    title: "First Duplicate Character",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "The first character that repeats, and its position, in one pass with a set, treating emoji as single characters.",
    prompt: [
      "Find the first character that repeats: the one whose **second** occurrence comes earliest. `\"abca\"` gives `\"a\"`, `\"abcdefe\"` gives `\"e\"`, and `\"abcdef\"` gives `null`.",
      "",
      "The Glassdoor wording asks for the position instead, so write both, and confirm which one the interviewer wants:",
      "",
      "- `firstDuplicate(str)` returns the character, or `null` when nothing repeats.",
      "- `firstDuplicateIndex(str)` returns the index of that second occurrence, or `-1`.",
      "",
      "Comparison is case-sensitive, and spaces are characters. `firstDuplicate` treats an emoji as a single character. Inputs to `firstDuplicateIndex` contain no emoji, so its index is the same in every language.",
      "",
      "*Reported in: Glassdoor (Dec 2019) and BFE.dev's Apple tag.*",
    ].join("\n"),
    hints: [
      "One pass with a `Set` of the characters seen so far. The first character already in the set is the answer.",
      "In JavaScript, `for...of` walks code points, so an emoji arrives whole. Indexing with `str[i]` walks UTF-16 units and splits it in two.",
    ],
    solution: [
      "## Approach",
      "",
      "Scan left to right with a set of characters seen so far. The first character that is already in the set is the one whose second occurrence comes earliest, so return it, or its index, at once. Reaching the end means nothing repeats.",
      "",
      "## Worth saying out loud",
      "",
      "- Both versions are O(n) time and O(k) space for an alphabet of k characters. For lowercase ASCII, a 26-bit mask is the same idea with no allocation.",
      "- \"First duplicate\" is ambiguous: the first character that repeats, or the character whose first occurrence is earliest among those that repeat? In `\"abba\"`, the first reading gives `\"b\"` and the second gives `\"a\"`. Ask.",
      "- `for...of` handles emoji; `str[i]` does not. A family emoji built with joiners spans several code points, and grapheme clusters need `Intl.Segmenter`.",
    ].join("\n"),
    judge: {
      starterCode: `/** The first character whose second occurrence comes earliest, or null. */
function firstDuplicate(str) {
  // Your code here
  return null;
}

/** The index of that second occurrence, or -1. */
function firstDuplicateIndex(str) {
  // Your code here
  return -1;
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

function firstDuplicateIndex(str) {
  const seen = new Set();
  for (let i = 0; i < str.length; i++) {
    if (seen.has(str[i])) return i;
    seen.add(str[i]);
  }
  return -1;
}
`,
      entry: "__judgeDuplicate",
      driverCode: `function __judgeDuplicate(kind, s) {
  if (kind === "char") {
    var ch = firstDuplicate(s);
    return ch === undefined ? null : ch;
  }
  if (kind === "index") return firstDuplicateIndex(s);
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "\"abca\" repeats a", input: ["char", "abca"], expected: "a" },
        { name: "\"abcdefe\" repeats e", input: ["char", "abcdefe"], expected: "e" },
        { name: "No repeats gives null", input: ["char", "abcdef"], expected: null },
        { name: "The earliest second occurrence wins", input: ["char", "abba"], expected: "b" },
        { name: "An empty string", input: ["char", ""], expected: null },
        { name: "Case-sensitive", input: ["char", "aA"], expected: null },
        { name: "Spaces are characters", input: ["char", "a b c "], expected: " " },
        { name: "An emoji is one character", input: ["char", "🙂a🙂"], expected: "🙂" },
        { name: "The index version", input: ["index", "abca"], expected: 3 },
        { name: "Index of the earliest second occurrence", input: ["index", "abba"], expected: 2 },
        { name: "No repeats gives -1", input: ["index", "abcdef"], expected: -1 },
        { name: "Index of an empty string", input: ["index", ""], expected: -1 },
      ],
    },
  },
  {
    slug: "merge-arrays-unique-values",
    title: "Merge Two Arrays, Keep Unique Values",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "\"Unique\" has two readings, each value once or values that occur once, and objects need a key.",
    prompt: [
      "Concatenate two arrays and keep the unique values. The report gives no example, and \"unique\" has two readings, so ask which one is meant. Here you write both, then handle objects:",
      "",
      "- `union(a, b)`: every value once, in first-seen order.",
      "- `appearOnce(a, b)`: only the values that occur exactly once across both arrays, in first-seen order.",
      "- `unionBy(a, b, key)`: objects are compared by reference, so deduplicate by the property `key` instead. The first object with each key wins.",
      "",
      "```",
      "union([1, 2, 2, 3], [3, 4])       // [1, 2, 3, 4]",
      "appearOnce([1, 2, 2, 3], [3, 4])  // [1, 4]",
      "```",
      "",
      "Values are numbers and strings, and `1` and `\"1\"` are different values.",
      "",
      "*Reported in: Glassdoor (Dec 2019), by topic only.*",
    ].join("\n"),
    hints: [
      "`union` is a `Set` over both arrays, and a `Set` keeps insertion order.",
      "`appearOnce` counts every value in a `Map` over both arrays, then keeps the values whose count is 1. A `Map` also keeps first-seen order.",
      "`unionBy` keeps a set of keys already taken and pushes an object only when its key is new.",
    ],
    solution: [
      "## Approach",
      "",
      "`union` spreads both arrays into a `Set`, which drops repeats and keeps first-seen order. `appearOnce` counts occurrences across both arrays in a `Map` and keeps the values counted exactly once. `unionBy` walks both arrays with a set of keys seen and keeps the first object for each key.",
      "",
      "## Worth saying out loud",
      "",
      "- Asking which reading is meant *is* the answer the report hints at. For `[1, 2, 2, 3]` and `[3, 4]`, the readings give `[1, 2, 3, 4]` and `[1, 4]`.",
      "- `Set` and `Map` compare with SameValueZero: `NaN` equals `NaN`, `1` differs from `\"1\"`, and objects compare by reference, which is why `unionBy` exists.",
      "- All three are O(n + m). Nested `includes` calls are O(n·m) and the usual first draft.",
    ].join("\n"),
    judge: {
      starterCode: `/** Every value once, in first-seen order. */
function union(a, b) {
  // Your code here
  return [];
}

/** The values that occur exactly once across both arrays, in first-seen order. */
function appearOnce(a, b) {
  // Your code here
  return [];
}

/** Deduplicate objects by the property \`key\`; the first object with each key wins. */
function unionBy(a, b, key) {
  // Your code here
  return [];
}
`,
      solutionCode: `function union(a, b) {
  return [...new Set([...a, ...b])]; // a Set keeps insertion order
}

function appearOnce(a, b) {
  const counts = new Map();
  for (const v of [...a, ...b]) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].filter(([, n]) => n === 1).map(([v]) => v);
}

function unionBy(a, b, key) {
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
      entry: "__judgeMerge",
      driverCode: `function __judgeMerge(kind, a, b, key) {
  if (kind === "union") return union(a, b);
  if (kind === "once") return appearOnce(a, b);
  if (kind === "unionBy") return unionBy(a, b, key);
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "union keeps each value once", input: ["union", [1, 2, 2, 3], [3, 4]], expected: [1, 2, 3, 4] },
        { name: "appearOnce keeps values seen once", input: ["once", [1, 2, 2, 3], [3, 4]], expected: [1, 4] },
        { name: "union keeps first-seen order", input: ["union", [3, 1], [2, 1, 3]], expected: [3, 1, 2] },
        { name: "Repeats within one array count too", input: ["once", [5, 5], [6]], expected: [6] },
        { name: "1 and \"1\" are different values", input: ["union", [1, "1"], ["1", 2]], expected: [1, "1", 2] },
        { name: "Two empty arrays", input: ["union", [], []], expected: [] },
        { name: "appearOnce with an empty side", input: ["once", [], [1, 1, 2]], expected: [2] },
        { name: "When everything repeats", input: ["once", [1, 2], [2, 1]], expected: [] },
        { name: "Strings keep first-seen order", input: ["union", ["b", "a"], ["a", "c", "b"]], expected: ["b", "a", "c"] },
        { name: "unionBy compares objects by key", input: ["unionBy", [{ id: 1, n: "a" }, { id: 2, n: "b" }], [{ id: 2, n: "B" }, { id: 3, n: "c" }], "id"], expected: [{ id: 1, n: "a" }, { id: 2, n: "b" }, { id: 3, n: "c" }] },
        { name: "unionBy drops repeats within one array", input: ["unionBy", [{ id: 1, n: "a" }, { id: 1, n: "z" }], [], "id"], expected: [{ id: 1, n: "a" }] },
      ],
    },
  },
  {
    slug: "array-products-two-readings",
    title: "[3, 4, 5] to [20, 15, 12]",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "One example, two rules that fit it: the product of every other element, or of the next two with wrap-around.",
    prompt: [
      "The report gives only one example: `[3, 4, 5]` becomes `[20, 15, 12]`. Two rules produce it, and they differ on longer arrays, so ask which is meant. Here you write both:",
      "",
      "- `productOfOthers(nums)`: each position gets the product of every *other* element. No division, O(n) time.",
      "- `productOfNextTwo(nums)`: each position gets the product of the next two elements, wrapping around the end.",
      "",
      "```",
      "productOfOthers([1, 2, 3, 4])   // [24, 12, 8, 6]",
      "productOfNextTwo([1, 2, 3, 4])  // [6, 12, 4, 2]",
      "```",
      "",
      "Inputs are integers and may include zeros and negatives. `productOfNextTwo` inputs have at least three elements.",
      "",
      "*Reported in: Glassdoor (Dec 2019), with that one example.*",
    ].join("\n"),
    hints: [
      "For `productOfOthers`, fill the output with the product of everything to the left of each index, then sweep from the right and multiply in the product of everything to its right.",
      "Division looks easier, but a single zero breaks it. The two sweeps need no special case.",
      "`productOfNextTwo` is one `map` with indices `(i + 1) % n` and `(i + 2) % n`.",
    ],
    solution: [
      "## Approach",
      "",
      "`productOfOthers` makes two passes: left to right, each slot gets the running product of everything before it; right to left, each slot is multiplied by the running product of everything after it. `productOfNextTwo` reads two neighbors with modular indices.",
      "",
      "## Worth saying out loud",
      "",
      "- Asking which rule is meant is the point: both fit the one example, and they differ at length 4.",
      "- **The prefix and suffix passes avoid division, so a zero in the input needs no special case.** With division, one zero means dividing by zero, and two zeros make every product 0.",
      "- The output array doesn't count as extra space, so the two-pass version is O(1) extra.",
      "- In JavaScript, a product of `0` and a negative number is `-0`. It prints as `0` but fails an `Object.is` comparison.",
    ].join("\n"),
    judge: {
      starterCode: `/** Each position gets the product of every other element, without division. */
function productOfOthers(nums) {
  // Your code here
  return [];
}

/** Each position gets the product of the next two elements, wrapping around. */
function productOfNextTwo(nums) {
  // Your code here
  return [];
}
`,
      solutionCode: `function productOfOthers(nums) {
  const out = new Array(nums.length).fill(1);
  let left = 1;
  for (let i = 0; i < nums.length; i++) {
    out[i] = left; // product of everything before i
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    out[i] *= right; // times everything after i
    right *= nums[i];
  }
  return out;
}

function productOfNextTwo(nums) {
  const n = nums.length;
  return nums.map((_, i) => nums[(i + 1) % n] * nums[(i + 2) % n]);
}
`,
      entry: "__judgeProducts",
      // -0 prints as 0 but fails Object.is; normalize it so only real
      // mistakes fail.
      driverCode: `function __judgeProducts(kind, nums) {
  var out;
  if (kind === "others") out = productOfOthers(nums);
  else if (kind === "nextTwo") out = productOfNextTwo(nums);
  else throw new Error("unknown case " + kind);
  if (!Array.isArray(out)) return out;
  return out.map(function (v) { return v === 0 ? 0 : v; });
}`,
      tests: [
        { name: "The reported example, every other element", input: ["others", [3, 4, 5]], expected: [20, 15, 12] },
        { name: "The reported example, the next two", input: ["nextTwo", [3, 4, 5]], expected: [20, 15, 12] },
        { name: "Every other element, length 4", input: ["others", [1, 2, 3, 4]], expected: [24, 12, 8, 6] },
        { name: "The next two, length 4", input: ["nextTwo", [1, 2, 3, 4]], expected: [6, 12, 4, 2] },
        { name: "One zero needs no special case", input: ["others", [2, 0, 3]], expected: [0, 6, 0] },
        { name: "Two zeros", input: ["others", [0, 2, 0]], expected: [0, 0, 0] },
        { name: "Negative numbers", input: ["others", [-1, 2, -3]], expected: [-6, 3, -2] },
        { name: "A single element", input: ["others", [7]], expected: [1] },
        { name: "The next two wrap around", input: ["nextTwo", [2, 5, 1, 3]], expected: [5, 3, 6, 10] },
        { name: "The next two with a zero and negatives", input: ["nextTwo", [0, -2, 3]], expected: [-6, 0, 0] },
        { name: "Larger values", input: ["others", [100000, 3000, 7]], expected: [21000, 700000, 300000000] },
      ],
    },
  },
  {
    slug: "run-length-compress",
    title: "Compress AAABB to 3A2B",
    category: "algorithms",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "Runs or totals? The candidate got both, and only one of them can be decoded back.",
    prompt: [
      "The candidate was taken through two variants on `\"AAABBAA\"`, then asked which one can be undone. Write all three:",
      "",
      "- `compressRuns(s)` writes each run as its length and character: `\"AAABBAA\"` gives `\"3A2B2A\"`.",
      "- `compressTotals(s)` writes each character's total count, in first-seen order: `\"AAABBAA\"` gives `\"5A2B\"`.",
      "- `decodeRuns(encoded)` reverses `compressRuns`, with counts of any length: `\"12A1B\"` gives twelve `A`s and a `B`.",
      "",
      "Inputs contain letters only, so a digit in `encoded` is always part of a count.",
      "",
      "*Reported in: a senior front-end loop in Hyderabad (Medium, 2022).*",
    ].join("\n"),
    hints: [
      "For runs, keep two indices: `i` at the start of a run, and `j` walking forward while `s[j] === s[i]`. Append `(j - i) + s[i]`, then jump `i` to `j`.",
      "For totals, count into a `Map`. It keeps insertion order, which is exactly first-seen order.",
      "For decoding, build the count digit by digit (`count * 10 + digit`) until you hit a letter, then repeat that letter.",
    ],
    solution: [
      "## Approach",
      "",
      "Runs: two pointers mark each run, and its length and character are appended. Totals: one counting pass into a `Map`, emitted in insertion order. Decoding: read digits into a number until a letter arrives, then write the letter that many times.",
      "",
      "## Worth saying out loud",
      "",
      "- **Only the run version can be decoded back.** Totals throw away the order.",
      "- Counts can have several digits. Reading one digit at a time is the classic decoding bug.",
      "- Building a string with `+=` in a loop is fine in modern engines. For very large inputs, push parts into an array and `join` once.",
      "- Run-length encoding only saves space on runs: `\"ABC\"` grows to `\"1A1B1C\"`. The classic variant writes a count only when it is above 1, which is still decodable.",
    ].join("\n"),
    judge: {
      starterCode: `/** Each run as its length then its character: "AAABBAA" -> "3A2B2A". */
function compressRuns(s) {
  // Your code here
  return "";
}

/** Each character's total count, in first-seen order: "AAABBAA" -> "5A2B". */
function compressTotals(s) {
  // Your code here
  return "";
}

/** Undo compressRuns; counts may have several digits: "12A1B". */
function decodeRuns(encoded) {
  // Your code here
  return "";
}
`,
      solutionCode: `function compressRuns(s) {
  let out = "";
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    out += j - i + s[i];
    i = j;
  }
  return out;
}

function compressTotals(s) {
  const counts = new Map(); // insertion order is first-seen order
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  return [...counts].map(([ch, n]) => n + ch).join("");
}

function decodeRuns(encoded) {
  let out = "";
  let count = 0;
  for (const ch of encoded) {
    if (ch >= "0" && ch <= "9") {
      count = count * 10 + (ch.charCodeAt(0) - 48); // counts may have several digits
    } else {
      out += ch.repeat(count);
      count = 0;
    }
  }
  return out;
}
`,
      entry: "__judgeCompress",
      driverCode: `function __judgeCompress(kind, s) {
  if (kind === "runs") return compressRuns(s);
  if (kind === "totals") return compressTotals(s);
  if (kind === "decode") return decodeRuns(s);
  if (kind === "roundTrip") return decodeRuns(compressRuns(s)) === s;
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "Runs of AAABB", input: ["runs", "AAABB"], expected: "3A2B" },
        { name: "Runs of AAABBAA", input: ["runs", "AAABBAA"], expected: "3A2B2A" },
        { name: "Runs of an empty string", input: ["runs", ""], expected: "" },
        { name: "A single character", input: ["runs", "A"], expected: "1A" },
        { name: "No repeats", input: ["runs", "ABC"], expected: "1A1B1C" },
        { name: "A run of twelve", input: ["runs", "AAAAAAAAAAAA"], expected: "12A" },
        { name: "Totals of AAABBAA", input: ["totals", "AAABBAA"], expected: "5A2B" },
        { name: "Totals keep first-seen order", input: ["totals", "BAB"], expected: "2B1A" },
        { name: "Totals of an empty string", input: ["totals", ""], expected: "" },
        { name: "Decode 3A2B2A", input: ["decode", "3A2B2A"], expected: "AAABBAA" },
        { name: "Decode a two-digit count", input: ["decode", "12A1B"], expected: "AAAAAAAAAAAAB" },
        { name: "Decode an empty string", input: ["decode", ""], expected: "" },
        { name: "Runs round-trip", input: ["roundTrip", "WWWWWWWWWWWWBWWWWWWWWWWWWBBBWWWWWWWWWWWWWWWWWWWWWWWWBWWWWWWWWWWWWWW"], expected: true },
      ],
    },
  },
];
