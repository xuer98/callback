import type { Problem } from "./types";

// Snowflake coding bank, part I: string problems — brackets, anagram windows,
// reversing alphanumeric runs, and grep with context lines. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-c.ts.

export const snowflakeProblemsI: Problem[] = [
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "A stack of expected closers; the string is valid when every closer matches the top and nothing is left.",
    prompt: [
      "A string holds only the characters `()[]{}`. It is valid when every opening bracket is closed by the same kind of bracket, in the correct order, and every closer has an opener.",
      "",
      "```",
      'isValid("()[]{}")  ->  true',
      'isValid("([)]")    ->  false',
      'isValid("{[]}")    ->  true',
      "```",
    ].join("\n"),
    hints: [
      "Push the matching closer for every opener. A closer must equal the top of the stack; otherwise the string is invalid.",
      "At the end the stack must be empty — unclosed openers are a failure too.",
    ],
    solution: [
      "## Approach",
      "",
      "Scan once with a stack. For an opener push the closer it expects; for a closer, pop and compare — a mismatch or an empty stack means invalid. The string is valid exactly when the scan finishes with an empty stack. Pushing the expected closer, rather than the opener, keeps the comparison to a single equality.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      '- An early exit when a closer arrives on an empty stack, and a final emptiness check, are the two halves people forget — name the tests `")("` and `"("`.',
      "- The same stack handles any bracket alphabet; expression parsers extend it with operand and operator handling.",
    ].join("\n"),
    judge: {
      solutionCode: `// Push the expected closer; every closer must match the top.
function isValid(s) {
  const closer = { "(": ")", "[": "]", "{": "}" };
  const stack = [];
  for (const ch of s) {
    if (closer[ch]) stack.push(closer[ch]);
    else if (stack.pop() !== ch) return false;
  }
  return stack.length === 0;
}
`,
      starterCode: `/**
 * @param {string} s only ()[]{}
 * @returns {boolean}
 */
function isValid(s) {
  // Your code here
  return false;
}
`,
      entry: "isValid",
      tests: [
        { name: "Three pairs", input: ["()[]{}"], expected: true },
        { name: "Interleaved", input: ["([)]"], expected: false },
        { name: "Nested", input: ["{[]}"], expected: true },
        { name: "Wrong kind", input: ["(]"], expected: false },
        { name: "Empty", input: [""], expected: true },
        { name: "Unclosed", input: ["("], expected: false },
        { name: "Closer first", input: [")("], expected: false },
        { name: "Deep nesting", input: ["((([[{{}}]])))"], expected: true },
      ],
    },
  },
  {
    slug: "find-all-anagrams",
    title: "Find All Anagrams in a String",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A fixed-size sliding window with a 26-slot count, updated by one add and one remove per step.",
    prompt: [
      "Return the start indices, in order, of every substring of `s` that is an anagram of `p`. Both strings hold lowercase letters.",
      "",
      "```",
      'findAnagrams("cbaebabacd", "abc")  ->  [0, 6]',
      'findAnagrams("abab", "ab")         ->  [0, 1, 2]',
      "```",
    ].join("\n"),
    hints: [
      "Count the letters of p. Slide a window of length p over s, adding the entering letter and removing the leaving one.",
      "Track how many of the 26 counts match rather than comparing whole arrays each step, so each move is O(1).",
    ],
    solution: [
      "## Approach",
      "",
      "Keep a count of each letter in `p` and a count for the current window of `s` of the same length; compare them as the window slides one letter at a time. The reference keeps a `matches` tally of letters whose counts agree, adjusted when a count enters or leaves agreement, so each step is constant time and a window is an anagram exactly when all 26 agree.",
      "",
      "## Complexity",
      "",
      "O(|s|) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Comparing two 26-element arrays per step is also O(|s|·26) and perfectly acceptable; the matches counter is the refinement to mention, not a requirement.",
      "- Unicode input turns the arrays into maps; the sliding logic does not change.",
    ].join("\n"),
    judge: {
      solutionCode: `// Fixed window with letter counts and a tally of how many counts agree.
function findAnagrams(s, p) {
  const out = [];
  if (p.length > s.length) return out;
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  const code = (ch) => ch.charCodeAt(0) - 97;
  for (const ch of p) need[code(ch)]++;
  let matches = 0;
  for (let i = 0; i < 26; i++) if (need[i] === have[i]) matches++;
  const adjust = (letter, delta) => {
    if (need[letter] === have[letter]) matches--;
    have[letter] += delta;
    if (need[letter] === have[letter]) matches++;
  };
  for (let i = 0; i < s.length; i++) {
    adjust(code(s[i]), 1);
    if (i >= p.length) adjust(code(s[i - p.length]), -1);
    if (i >= p.length - 1 && matches === 26) out.push(i - p.length + 1);
  }
  return out;
}
`,
      starterCode: `/**
 * @param {string} s lowercase letters
 * @param {string} p lowercase letters
 * @returns {number[]} start indices of substrings of s that are anagrams of p
 */
function findAnagrams(s, p) {
  // Your code here
  return [];
}
`,
      entry: "findAnagrams",
      tests: [
        { name: "Prompt example", input: ["cbaebabacd", "abc"], expected: [0, 6] },
        { name: "Overlapping windows", input: ["abab", "ab"], expected: [0, 1, 2] },
        { name: "p longer than s", input: ["a", "ab"], expected: [] },
        { name: "Every position", input: ["aaaa", "a"], expected: [0, 1, 2, 3] },
        { name: "No match", input: ["abcdef", "xyz"], expected: [] },
        { name: "Repeated letters in p", input: ["aabaabaa", "aab"], expected: [0, 1, 2, 3, 4, 5] },
        { name: "Exactly one window", input: ["abc", "cba"], expected: [0] },
      ],
    },
  },
  {
    slug: "reverse-alphanumeric-runs",
    title: "Reverse Each Alphanumeric Run",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Two pointers per run: find where the run ends, reverse it in place, carry on from there.",
    prompt: [
      "Reverse every maximal run of alphanumeric characters (`A`–`Z`, `a`–`z`, `0`–`9`) in a string, keeping every other character where it is.",
      "",
      "```",
      'reverseRuns("ab-cd ef")       ->  "ba-dc fe"',
      'reverseRuns("hello, world!")  ->  "olleh, dlrow!"',
      'reverseRuns("a1b2 c3")        ->  "2b1a 3c"',
      "```",
    ].join("\n"),
    hints: [
      "Walk the string; when you hit an alphanumeric character, scan forward to the end of the run, reverse that slice, and continue after it.",
      "In a language with mutable arrays, reverse in place with two pointers; otherwise collect pieces and join.",
    ],
    solution: [
      "## Approach",
      "",
      "One pass with a cursor. At an alphanumeric character, find the end of its run, swap inward with two pointers (or reverse the slice) and jump the cursor past it; at any other character, copy it and move on. Working on an array of characters makes the reversal in place.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) for the character array in languages with immutable strings, O(1) extra otherwise.",
      "",
      "## Worth saying out loud",
      "",
      "- Define alphanumeric before you start: ASCII letters and digits here. Unicode letters are a one-line change to the predicate if the interviewer wants them.",
      "- Streaming version: buffer the current run and flush it reversed when a non-alphanumeric character or the end arrives.",
    ].join("\n"),
    judge: {
      solutionCode: `// Find each run's end, reverse it in place, continue after it.
function reverseRuns(s) {
  const chars = [...s];
  const isAlnum = (ch) => /^[A-Za-z0-9]$/.test(ch);
  let i = 0;
  while (i < chars.length) {
    if (!isAlnum(chars[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < chars.length && isAlnum(chars[j + 1])) j++;
    for (let a = i, b = j; a < b; a++, b--) [chars[a], chars[b]] = [chars[b], chars[a]];
    i = j + 1;
  }
  return chars.join("");
}
`,
      starterCode: `/**
 * @param {string} s
 * @returns {string} s with every maximal run of ASCII letters and digits reversed
 */
function reverseRuns(s) {
  // Your code here
  return s;
}
`,
      entry: "reverseRuns",
      tests: [
        { name: "Prompt example", input: ["ab-cd ef"], expected: "ba-dc fe" },
        { name: "Punctuation stays put", input: ["hello, world!"], expected: "olleh, dlrow!" },
        { name: "Digits are part of a run", input: ["a1b2 c3"], expected: "2b1a 3c" },
        { name: "Empty", input: [""], expected: "" },
        { name: "No runs", input: ["---"], expected: "---" },
        { name: "One run", input: ["abc"], expected: "cba" },
        { name: "Non-ASCII letters break runs", input: ["ab-é-cd"], expected: "ba-é-dc" },
        { name: "Single characters are unchanged", input: ["a b c"], expected: "a b c" },
      ],
    },
  },
  {
    slug: "grep-with-context",
    title: "Grep With Context Lines",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Turn each match into a clipped line range, merge ranges that touch, and print a separator between the groups left.",
    prompt: [
      "Implement the core of `grep -B before -A after`: given the lines of a file and a `pattern`, return the output lines. A line matches when it **contains** `pattern`. Each match is shown with up to `before` lines above and `after` lines below; groups of lines that overlap or touch are merged, every line is shown at most once, and non-adjacent groups are separated by a line `--`.",
      "",
      "```",
      'grep(["a", "b", "match", "c", "d", "e", "match", "f"], "match", 1, 1)',
      '  ->  ["b", "match", "c", "--", "e", "match", "f"]',
      "```",
    ].join("\n"),
    hints: [
      "Map every matching line index i to the range [i − before, i + after], clipped to the file. Ranges that overlap or sit next to each other merge into one group.",
      'Emit each group\'s lines in order, with "--" before every group except the first.',
    ],
    solution: [
      "## Approach",
      "",
      "Treat each match as a line range, clipped to the file, and merge as you go: because matches are found in order, a new range either extends the last group (when it starts at or before one past the group's end) or opens a new one. Then print the groups with `--` between them. Two linear passes.",
      "",
      "## Complexity",
      "",
      "O(n · |pattern|) for the matching, O(n) for the output.",
      "",
      "## Worth saying out loud",
      "",
      "- Adjacent groups merge without a separator: `-A 1` on matches at lines 0 and 2 prints lines 0 through 2 once. That rule is the whole difficulty.",
      "- Streaming version: keep a ring buffer of the last `before` lines and a countdown of lines still to print after a match; print `--` only when a match arrives after the countdown has expired.",
      "- Real grep also supports regular expressions, inverted matches and line numbers; each is a small addition to the matching step or the output step.",
    ].join("\n"),
    judge: {
      solutionCode: `// Each match becomes a clipped range; touching ranges merge; groups print with -- between.
function grep(lines, pattern, before, after) {
  const groups = [];
  lines.forEach((line, i) => {
    if (!line.includes(pattern)) return;
    const start = Math.max(0, i - before);
    const end = Math.min(lines.length - 1, i + after);
    const last = groups[groups.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else groups.push([start, end]);
  });
  const out = [];
  groups.forEach(([start, end], g) => {
    if (g > 0) out.push("--");
    for (let i = start; i <= end; i++) out.push(lines[i]);
  });
  return out;
}
`,
      starterCode: `/**
 * @param {string[]} lines the file
 * @param {string} pattern a line matches when it contains this
 * @param {number} before context lines above each match
 * @param {number} after context lines below each match
 * @returns {string[]} the output lines, with "--" between separate groups
 */
function grep(lines, pattern, before, after) {
  // Your code here
  return [];
}
`,
      entry: "grep",
      tests: [
        {
          name: "Prompt example",
          input: [["a", "b", "match", "c", "d", "e", "match", "f"], "match", 1, 1],
          expected: ["b", "match", "c", "--", "e", "match", "f"],
        },
        { name: "Overlapping context merges", input: [["x", "m", "y", "m", "z"], "m", 1, 1], expected: ["x", "m", "y", "m", "z"] },
        { name: "Touching groups merge", input: [["m", "a", "m"], "m", 0, 1], expected: ["m", "a", "m"] },
        { name: "A gap of one line separates", input: [["m", "a", "b", "m"], "m", 0, 1], expected: ["m", "a", "--", "m"] },
        { name: "No context", input: [["m", "a", "m"], "m", 0, 0], expected: ["m", "--", "m"] },
        { name: "Adjacent matches", input: [["m", "m"], "m", 0, 0], expected: ["m", "m"] },
        { name: "Context is clipped to the file", input: [["m", "a"], "m", 5, 5], expected: ["m", "a"] },
        { name: "No match", input: [["a", "b"], "zzz", 1, 1], expected: [] },
        { name: "Substring matches", input: [["error: disk", "ok", "no errors"], "error", 0, 0], expected: ["error: disk", "--", "no errors"] },
      ],
    },
  },
];
