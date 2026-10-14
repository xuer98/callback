import type { Problem } from "./types";

// Blind 75 for the Snowflake backend screen, part G: the rest of the string
// group, plus Grid Game, the frontend round's named algorithm prompt.
// Python in seed-python-snowflake-t.ts.

export const snowflakeBlindProblemsG: Problem[] = [
  {
    slug: "longest-repeating-character-replacement",
    title: "Longest Repeating Character Replacement",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A window is valid while (length − count of its most common letter) ≤ k; the window never needs to shrink below the best.",
    prompt: [
      "You may change at most `k` characters of the uppercase string `s`. Return the length of the longest substring that can be made of one repeated letter.",
      "",
      "```",
      "characterReplacement(\"ABAB\", 2)     ->  4",
      "characterReplacement(\"AABABBA\", 1)  ->  4",
      "```",
    ].join("\n"),
    hints: [
      "A window can be made uniform with k changes when its length minus the count of its most frequent letter is at most k.",
      "Slide the right edge; when the window becomes invalid, move the left edge one step. The max-count seen so far never needs to decrease.",
    ],
    solution: [
      "## Approach",
      "",
      "Sliding window with letter counts and `maxCount`, the largest count seen in any window. Grow the right edge; if `window length - maxCount > k`, shrink the left edge by one. The answer is the largest valid window. Not lowering `maxCount` on shrink is safe because a window shorter than the current best never improves the answer.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(26) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The stale `maxCount` trick is the subtle part; be ready to argue why it cannot produce a wrong answer.",
      "- The per-letter version (try each of the 26 letters as the target) is easier to justify and only 26× slower.",
    ].join("\n"),
    judge: {
      solutionCode: `function characterReplacement(s, k) {
  const counts = new Map();
  let maxCount = 0;
  let start = 0;
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    counts.set(s[i], (counts.get(s[i]) ?? 0) + 1);
    maxCount = Math.max(maxCount, counts.get(s[i]));
    if (i - start + 1 - maxCount > k) {
      counts.set(s[start], counts.get(s[start]) - 1);
      start++;
    }
    best = Math.max(best, i - start + 1);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {string} s uppercase letters
 * @param {number} k changes allowed
 * @returns {number} longest substring that can become one repeated letter
 */
function characterReplacement(s, k) {
  // Your code here
  return 0;
}
`,
      entry: "characterReplacement",
      tests: [
        { name: "Prompt example", input: ["ABAB", 2], expected: 4 },
        { name: "One change", input: ["AABABBA", 1], expected: 4 },
        { name: "No change needed", input: ["AAAA", 0], expected: 4 },
        { name: "All different", input: ["ABCDE", 1], expected: 2 },
        { name: "Empty", input: ["", 0], expected: 0 },
      ],
    },
  },
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Count letters of one, subtract the other; every count must return to zero.",
    prompt: [
      "Return `true` if `t` is an anagram of `s`: the same letters with the same multiplicities, in any order.",
      "",
      "```",
      "isAnagram(\"anagram\", \"nagaram\")  ->  true",
      "isAnagram(\"rat\", \"car\")          ->  false",
      "```",
    ].join("\n"),
    hints: ["Different lengths mean false. Otherwise count characters of s and decrement for t; any count that goes negative means false."],
    solution: [
      "## Approach",
      "",
      "A count map: add one per character of `s`, subtract one per character of `t`. If the lengths match and no count goes negative, they are anagrams.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(alphabet) space; sorting both is O(n log n).",
      "",
      "## Worth saying out loud",
      "",
      "- Unicode input is the follow-up: count code points (iterate with `for...of`), not UTF-16 units.",
      "- Group Anagrams reuses the sorted string or the count signature as a key.",
    ].join("\n"),
    judge: {
      solutionCode: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  for (const ch of t) {
    const left = (counts.get(ch) ?? 0) - 1;
    if (left < 0) return false;
    counts.set(ch, left);
  }
  return true;
}
`,
      starterCode: `/**
 * @param {string} s
 * @param {string} t
 * @returns {boolean}
 */
function isAnagram(s, t) {
  // Your code here
  return false;
}
`,
      entry: "isAnagram",
      tests: [
        { name: "Prompt example", input: ["anagram", "nagaram"], expected: true },
        { name: "Not an anagram", input: ["rat", "car"], expected: false },
        { name: "Both empty", input: ["", ""], expected: true },
        { name: "Different lengths", input: ["a", "ab"], expected: false },
        { name: "Same letters, different counts", input: ["aacc", "ccac"], expected: false },
      ],
    },
  },
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Two pointers that skip anything non-alphanumeric and compare case-insensitively.",
    prompt: [
      "Return `true` if `s` reads the same forwards and backwards once every non-alphanumeric character is removed and case is ignored.",
      "",
      "```",
      "isPalindrome(\"A man, a plan, a canal: Panama\")  ->  true",
      "isPalindrome(\"race a car\")                      ->  false",
      "isPalindrome(\" \")                               ->  true",
      "```",
    ].join("\n"),
    hints: [
      "Pointers at both ends; advance each past non-alphanumeric characters, then compare lowercased.",
      "Filtering into a new string and comparing with its reverse is fine too, at O(n) extra space.",
    ],
    solution: [
      "## Approach",
      "",
      "Two pointers moving inward. Skip characters that are not letters or digits on either side, compare the lowercase forms, and stop at the first mismatch.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Define \"alphanumeric\" with the interviewer: ASCII only, or Unicode letters?",
      "- Valid Palindrome II (delete at most one character) branches once at the first mismatch.",
    ].join("\n"),
    judge: {
      solutionCode: `function isPalindrome(s) {
  const keep = (ch) => /[a-z0-9]/i.test(ch);
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi) {
    while (lo < hi && !keep(s[lo])) lo++;
    while (lo < hi && !keep(s[hi])) hi--;
    if (s[lo].toLowerCase() !== s[hi].toLowerCase()) return false;
    lo++;
    hi--;
  }
  return true;
}
`,
      starterCode: `/**
 * @param {string} s
 * @returns {boolean} palindrome after dropping non-alphanumerics, ignoring case
 */
function isPalindrome(s) {
  // Your code here
  return false;
}
`,
      entry: "isPalindrome",
      tests: [
        { name: "Prompt example", input: ["A man, a plan, a canal: Panama"], expected: true },
        { name: "Not a palindrome", input: ["race a car"], expected: false },
        { name: "Only a space", input: [" "], expected: true },
        { name: "Digit and letter", input: ["0P"], expected: false },
        { name: "Question mark", input: ["Was it a car or a cat I saw?"], expected: true },
      ],
    },
  },
  {
    slug: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Expand around every centre — 2n − 1 of them, counting the gaps between characters.",
    prompt: [
      "Return the longest palindromic substring of `s`. The tests use inputs with exactly one longest palindrome.",
      "",
      "```",
      "longestPalindrome(\"cbbd\")     ->  \"bb\"",
      "longestPalindrome(\"bananas\")  ->  \"anana\"",
      "```",
    ].join("\n"),
    hints: [
      "Every palindrome has a centre: a character (odd length) or a gap between two characters (even length).",
      "From each of the 2n − 1 centres expand outward while the ends match; keep the longest.",
    ],
    solution: [
      "## Approach",
      "",
      "For each index, expand around `(i, i)` and `(i, i + 1)` while the characters match, and record the longest span. Return the slice.",
      "",
      "## Complexity",
      "",
      "O(n²) time, O(1) space; the O(n²)-space table and Manacher's O(n) algorithm are the alternatives to name.",
      "",
      "## Worth saying out loud",
      "",
      "- Interviewers want the even-length centre handled; `\"cbbd\"` is the test.",
      "- Manacher's exists; nobody expects it written in an hour.",
    ].join("\n"),
    judge: {
      solutionCode: `function longestPalindrome(s) {
  let bestStart = 0;
  let bestLength = 0;
  const expand = (lo, hi) => {
    while (lo >= 0 && hi < s.length && s[lo] === s[hi]) {
      lo--;
      hi++;
    }
    if (hi - lo - 1 > bestLength) {
      bestStart = lo + 1;
      bestLength = hi - lo - 1;
    }
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }
  return s.slice(bestStart, bestStart + bestLength);
}
`,
      starterCode: `/**
 * @param {string} s
 * @returns {string} the longest palindromic substring
 */
function longestPalindrome(s) {
  // Your code here
  return "";
}
`,
      entry: "longestPalindrome",
      tests: [
        { name: "Prompt example", input: ["cbbd"], expected: "bb" },
        { name: "Odd length", input: ["bananas"], expected: "anana" },
        { name: "Whole string", input: ["racecar"], expected: "racecar" },
        { name: "One character", input: ["a"], expected: "a" },
        { name: "Long middle", input: ["forgeeksskeegfor"], expected: "geeksskeeg" },
        { name: "Empty", input: [""], expected: "" },
      ],
    },
  },
  {
    slug: "palindromic-substrings",
    title: "Palindromic Substrings",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Same centre expansion as the longest-palindrome problem, counting every successful step.",
    prompt: [
      "Return how many substrings of `s` are palindromes. Substrings at different positions count separately even when they read the same.",
      "",
      "```",
      "countSubstrings(\"abc\")  ->  3",
      "countSubstrings(\"aaa\")  ->  6",
      "```",
    ].join("\n"),
    hints: [
      "Expand around each of the 2n − 1 centres; every expansion step that still matches is one more palindrome.",
    ],
    solution: [
      "## Approach",
      "",
      "For each centre (character or gap), expand while the ends match and add one per match. The total over all centres is the answer.",
      "",
      "## Complexity",
      "",
      "O(n²) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The dp table `isPal[i][j] = s[i] === s[j] && isPal[i+1][j-1]` gives the same count with O(n²) space.",
      "- Counting distinct palindromic substrings is a different, harder question (suffix structures or a set).",
    ].join("\n"),
    judge: {
      solutionCode: `function countSubstrings(s) {
  let count = 0;
  for (let centre = 0; centre < 2 * s.length - 1; centre++) {
    let lo = Math.floor(centre / 2);
    let hi = lo + (centre % 2);
    while (lo >= 0 && hi < s.length && s[lo] === s[hi]) {
      count++;
      lo--;
      hi++;
    }
  }
  return count;
}
`,
      starterCode: `/**
 * @param {string} s
 * @returns {number} how many substrings are palindromes
 */
function countSubstrings(s) {
  // Your code here
  return 0;
}
`,
      entry: "countSubstrings",
      tests: [
        { name: "Prompt example", input: ["abc"], expected: 3 },
        { name: "All the same", input: ["aaa"], expected: 6 },
        { name: "Even palindrome", input: ["abba"], expected: 6 },
        { name: "Empty", input: [""], expected: 0 },
        { name: "Odd palindrome", input: ["aba"], expected: 4 },
      ],
    },
  },
  {
    slug: "grid-game",
    title: "Grid Game",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Robot 1's path is one column where it steps down; one scan with a top suffix sum and a bottom prefix sum decides it.",
    prompt: [
      "A `2 × n` grid holds points. Robot 1 walks from the top-left to the bottom-right moving only right or down and zeroes every cell it visits. Robot 2 then walks the same way and collects points. Robot 1 plays to minimise what robot 2 can collect; robot 2 plays to maximise it. Return the points robot 2 collects.",
      "",
      "```",
      "gridGame([[2, 5, 4], [1, 5, 1]])  ->  4",
      "gridGame([[3, 3, 1], [8, 5, 2]])  ->  4",
      "```",
    ].join("\n"),
    hints: [
      "Robot 1's path is fixed by the single column where it moves down. After it, robot 2's best is either the top row to the right of that column or the bottom row to the left of it.",
      "Try every column with a running suffix sum of the top row and prefix sum of the bottom row; robot 1 picks the column minimising the larger of the two.",
    ],
    solution: [
      "## Approach",
      "",
      "For each column `i` as robot 1's step-down point, robot 2 can only collect `top[i+1..]` (going right along the top before dropping) or `bottom[..i-1]` (dropping at once). Robot 2 takes the larger; robot 1 takes the column where that larger value is smallest. One left-to-right scan maintains both sums.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The trap is modelling it as a two-player dynamic program; the path structure collapses it to a scan.",
      "- Sums can exceed 32 bits in other languages; JavaScript numbers are fine up to 2⁵³.",
    ].join("\n"),
    judge: {
      solutionCode: `function gridGame(grid) {
  let topSuffix = grid[0].reduce((a, b) => a + b, 0);
  let bottomPrefix = 0;
  let best = Infinity;
  for (let i = 0; i < grid[0].length; i++) {
    topSuffix -= grid[0][i];
    best = Math.min(best, Math.max(topSuffix, bottomPrefix));
    bottomPrefix += grid[1][i];
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[][]} grid two rows of points
 * @returns {number} the points robot 2 collects under best play by both
 */
function gridGame(grid) {
  // Your code here
  return 0;
}
`,
      entry: "gridGame",
      tests: [
        { name: "Prompt example", input: [[[2, 5, 4], [1, 5, 1]]], expected: 4 },
        { name: "Second example", input: [[[3, 3, 1], [8, 5, 2]]], expected: 4 },
        { name: "Four columns", input: [[[1, 3, 1, 15], [1, 3, 3, 1]]], expected: 7 },
        {
          name: "Ten columns",
          input: [[[20, 3, 20, 17, 2, 12, 15, 17, 4, 15], [20, 10, 13, 14, 15, 5, 2, 3, 14, 3]]],
          expected: 63,
        },
        { name: "All ones", input: [[[1, 1], [1, 1]]], expected: 1 },
      ],
    },
  },
];
