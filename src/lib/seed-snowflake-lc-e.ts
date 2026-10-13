import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part E: strings with dynamic
// programming and greedy scans — regular expressions, word abbreviations,
// removing digits, vowel substrings, forming a target from a dictionary, and
// counting suffix rotations. Judged in JavaScript and Python; the Python
// judges live in seed-python-snowflake-i.ts.

export const snowflakeLcProblemsE: Problem[] = [
  {
    slug: "regular-expression-matching",
    title: "Regular Expression Matching",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "dp[i][j] = does s[i:] match p[j:]; a star either matches nothing or consumes one character and stays.",
    prompt: [
      "Implement matching for a pattern with `.` (any single character) and `*` (zero or more of the preceding element). The match must cover the **entire** string.",
      "",
      "```",
      "isMatch(\"aa\", \"a\")    ->  false",
      "isMatch(\"aa\", \"a*\")   ->  true",
      "isMatch(\"ab\", \".*\")   ->  true",
      "isMatch(\"aab\", \"c*a*b\") ->  true",
      "```",
    ].join("\n"),
    hints: [
      "Define match(i, j) for suffixes. If p[j + 1] is `*`: either skip the pair (match(i, j + 2)) or, when s[i] fits p[j], consume s[i] and stay at j.",
      "Memoise on (i, j); the table is (n + 1) × (m + 1).",
    ],
    solution: [
      "## Approach",
      "",
      "Dynamic programming over suffixes. `match(i, j)` is true when the string from `i` matches the pattern from `j`. If the pattern element at `j` is followed by a star, the pair can be skipped entirely, or — if the current character fits the element — one character is consumed while the pattern stays put. Without a star, the character must fit and both advance. The base case is an exhausted pattern, which matches only an exhausted string.",
      "",
      "## Complexity",
      "",
      "O(n × m) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Write the star case as \"zero or more\" literally: the two branches are the whole insight.",
      "- Wildcard matching (`?` and `*` matching any sequence) is the sibling problem with a simpler star rule.",
    ].join("\n"),
    judge: {
      solutionCode: `// Bottom-up over suffixes: dp[i][j] = s[i:] matches p[j:].
function isMatch(s, p) {
  const n = s.length;
  const m = p.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(false));
  dp[n][m] = true;
  for (let i = n; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const first = i < n && (p[j] === "." || p[j] === s[i]);
      if (j + 1 < m && p[j + 1] === "*") {
        dp[i][j] = dp[i][j + 2] || (first && dp[i + 1][j]);
      } else {
        dp[i][j] = first && dp[i + 1][j + 1];
      }
    }
  }
  return dp[0][0];
}
`,
      starterCode: `/**
 * @param {string} s lowercase letters
 * @param {string} p lowercase letters, "." and "*"
 * @returns {boolean} whether p matches all of s
 */
function isMatch(s, p) {
  // Your code here
  return false;
}
`,
      entry: "isMatch",
      tests: [
        { name: "Too short", input: ["aa", "a"], expected: false },
        { name: "A star repeats", input: ["aa", "a*"], expected: true },
        { name: "Dot star matches anything", input: ["ab", ".*"], expected: true },
        { name: "A star can match nothing", input: ["aab", "c*a*b"], expected: true },
        { name: "A near miss", input: ["mississippi", "mis*is*p*."], expected: false },
        { name: "Empty string", input: ["", "a*"], expected: true },
        { name: "Trailing literal", input: ["ab", ".*c"], expected: false },
      ],
    },
  },
  {
    slug: "valid-word-abbreviation",
    title: "Valid Word Abbreviation",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Two pointers; a number skips that many letters, and a leading zero makes the abbreviation invalid.",
    prompt: [
      "An abbreviation replaces some non-overlapping, non-adjacent substrings of a word with their lengths. Return whether `abbr` is a valid abbreviation of `word`. A number may not have leading zeros, so `\"a0b\"` and `\"01\"` are invalid.",
      "",
      "```",
      "validWordAbbreviation(\"internationalization\", \"i12iz4n\")  ->  true",
      "validWordAbbreviation(\"apple\", \"a2e\")                      ->  false",
      "```",
    ].join("\n"),
    hints: ["Walk both strings: on a digit, reject a leading zero, read the whole number, and advance the word pointer by it; on a letter, the letters must match. Both pointers must end together."],
    solution: [
      "## Approach",
      "",
      "One pointer into the word and one into the abbreviation. A letter must equal the current word letter and both advance. A digit starts a number: a `0` here is a leading zero and fails; otherwise read the full number and jump the word pointer by it. The abbreviation is valid when both pointers reach their ends at the same time — a jump past the end fails.",
      "",
      "## Complexity",
      "",
      "O(n + m) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The leading-zero rule is the only thing that makes this more than a pointer walk; test `\"a01\"` style inputs explicitly.",
      "- Generalised abbreviations (listing every valid abbreviation) is the backtracking sibling.",
    ].join("\n"),
    judge: {
      solutionCode: `function validWordAbbreviation(word, abbr) {
  let i = 0;
  let j = 0;
  while (j < abbr.length) {
    const ch = abbr[j];
    if (ch >= "0" && ch <= "9") {
      if (ch === "0") return false;
      let count = 0;
      while (j < abbr.length && abbr[j] >= "0" && abbr[j] <= "9") count = count * 10 + (abbr.charCodeAt(j++) - 48);
      i += count;
    } else {
      if (i >= word.length || word[i] !== ch) return false;
      i++;
      j++;
    }
  }
  return i === word.length;
}
`,
      starterCode: `/**
 * @param {string} word
 * @param {string} abbr letters and numbers
 * @returns {boolean}
 */
function validWordAbbreviation(word, abbr) {
  // Your code here
  return false;
}
`,
      entry: "validWordAbbreviation",
      tests: [
        { name: "Prompt example", input: ["internationalization", "i12iz4n"], expected: true },
        { name: "Wrong letter", input: ["apple", "a2e"], expected: false },
        { name: "One number", input: ["substitution", "s10n"], expected: true },
        { name: "Two numbers", input: ["substitution", "sub4u4"], expected: true },
        { name: "The whole word", input: ["substitution", "12"], expected: true },
        { name: "Too long", input: ["substitution", "s55n"], expected: false },
        { name: "Leading zero", input: ["substitution", "s010n"], expected: false },
        { name: "Zero alone", input: ["a", "01"], expected: false },
      ],
    },
  },
  {
    slug: "remove-k-digits",
    title: "Remove K Digits",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A monotonic stack: pop a bigger digit whenever a smaller one arrives, while removals remain.",
    prompt: [
      "Remove `k` digits from a non-negative integer given as a string so that the result is the smallest possible number. Return it without leading zeros, and as `\"0\"` if nothing is left.",
      "",
      "```",
      "removeKdigits(\"1432219\", 3)  ->  \"1219\"",
      "removeKdigits(\"10200\", 1)    ->  \"200\"",
      "removeKdigits(\"10\", 2)       ->  \"0\"",
      "```",
    ].join("\n"),
    hints: [
      "Keep a stack of digits. For each new digit, while removals remain and the top is larger than it, pop. Push the digit.",
      "If removals remain at the end, drop from the end; then strip leading zeros.",
    ],
    solution: [
      "## Approach",
      "",
      "The number shrinks most when a digit that is larger than its right neighbour is removed, so scan left to right with a stack that stays non-decreasing: pop while the top exceeds the incoming digit and removals remain. Leftover removals come off the end, where the digits are largest. Strip leading zeros, returning `\"0\"` for an empty result.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- The greedy is exact because removing a \"peak\" digit never hurts a later choice; say why before coding.",
      "- Leading zeros appear naturally (`\"10200\"`) and must be stripped after the removals, not before.",
    ].join("\n"),
    judge: {
      solutionCode: `function removeKdigits(num, k) {
  const stack = [];
  for (const d of num) {
    while (k > 0 && stack.length && stack[stack.length - 1] > d) {
      stack.pop();
      k--;
    }
    stack.push(d);
  }
  while (k-- > 0) stack.pop();
  const out = stack.join("").replace(/^0+/, "");
  return out === "" ? "0" : out;
}
`,
      starterCode: `/**
 * @param {string} num digits, no leading zeros unless "0"
 * @param {number} k digits to remove
 * @returns {string} the smallest result
 */
function removeKdigits(num, k) {
  // Your code here
  return "0";
}
`,
      entry: "removeKdigits",
      tests: [
        { name: "Prompt example", input: ["1432219", 3], expected: "1219" },
        { name: "Leading zero appears", input: ["10200", 1], expected: "200" },
        { name: "Everything removed", input: ["10", 2], expected: "0" },
        { name: "One digit, one removal", input: ["9", 1], expected: "0" },
        { name: "Equal digits", input: ["112", 1], expected: "11" },
        { name: "Increasing digits drop from the end", input: ["12345", 2], expected: "123" },
        { name: "Zeros collapse", input: ["100", 1], expected: "0" },
      ],
    },
  },
  {
    slug: "count-vowel-substrings",
    title: "Count Vowel Substrings of a String",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Within each run of vowels, count the windows that contain all five by tracking each vowel's latest position.",
    prompt: [
      "Count the substrings that consist only of vowels (`a`, `e`, `i`, `o`, `u`) and contain **all five** of them.",
      "",
      "```",
      "countVowelSubstrings(\"aeiouu\")         ->  2",
      "countVowelSubstrings(\"unicornarihan\")  ->  0",
      "countVowelSubstrings(\"cuaieuouac\")     ->  7",
      "```",
    ].join("\n"),
    hints: [
      "A consonant breaks every substring, so handle each maximal run of vowels separately.",
      "For each right end inside a run, once all five vowels have appeared since the run began, the valid left ends are from the run start up to the smallest latest-position among the five.",
    ],
    solution: [
      "## Approach",
      "",
      "Scan once. A consonant resets the run start and the latest positions of the five vowels. For each vowel at position `r`, record it; if every vowel has been seen in the current run, every left end from the run start to the minimum of the five latest positions gives a substring containing all five, so add `min − start + 1`.",
      "",
      "## Complexity",
      "",
      "O(n) time (five lookups per character); O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The brute force checks every substring with a set and is O(n²), fine for the LeetCode limits; the linear version is what to say when asked to do better.",
      "- The same \"min of latest positions\" trick counts substrings containing all characters of any small alphabet.",
    ].join("\n"),
    judge: {
      solutionCode: `function countVowelSubstrings(word) {
  const vowels = "aeiou";
  let last = {};
  let start = 0;
  let count = 0;
  for (let r = 0; r < word.length; r++) {
    const ch = word[r];
    if (!vowels.includes(ch)) {
      start = r + 1;
      last = {};
      continue;
    }
    last[ch] = r;
    if (Object.keys(last).length === 5) count += Math.min(...Object.values(last)) - start + 1;
  }
  return count;
}
`,
      starterCode: `/**
 * @param {string} word lowercase letters
 * @returns {number} substrings made only of vowels that contain all five
 */
function countVowelSubstrings(word) {
  // Your code here
  return 0;
}
`,
      entry: "countVowelSubstrings",
      tests: [
        { name: "Prompt example", input: ["aeiouu"], expected: 2 },
        { name: "No valid substring", input: ["unicornarihan"], expected: 0 },
        { name: "A longer run", input: ["cuaieuouac"], expected: 7 },
        { name: "Consonants inside", input: ["bbaeixoubb"], expected: 0 },
        { name: "Exactly the five", input: ["aeiou"], expected: 1 },
        { name: "A repeated first vowel", input: ["aaeiou"], expected: 2 },
      ],
    },
  },
  {
    slug: "number-of-ways-to-form-target",
    title: "Number of Ways to Form a Target String Given a Dictionary",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Count each column's letters once, then run a knapsack over columns where dp[j] is the ways to build the first j target letters.",
    prompt: [
      "All words have the same length. Form `target` by picking its characters left to right from the words: the `i`-th character picked must come from a column strictly to the right of the previous pick, and the character at that column of the chosen word must match. Any word may supply any column. Return the number of ways modulo `1 000 000 007`.",
      "",
      "```",
      "numWays([\"acca\", \"bbbb\", \"caca\"], \"aba\")  ->  6",
      "numWays([\"abba\", \"baab\"], \"bab\")          ->  4",
      "```",
    ].join("\n"),
    hints: [
      "The words only matter through `count[column][letter]`: how many words have that letter in that column.",
      "Process columns left to right with `dp[j]` = ways to have matched the first `j` target letters; for each column, update `dp[j + 1] += dp[j] × count[column][target[j]]`, iterating `j` downward so a column is used at most once.",
    ],
    solution: [
      "## Approach",
      "",
      "Collapse the dictionary into per-column letter counts. Then it is a knapsack over columns: `dp[j]` is the number of ways the first `j` letters of the target have been matched using the columns seen so far. For each column, for `j` from high to low, add `dp[j] × count[column][target[j]]` to `dp[j + 1]`. The downward order ensures each column contributes at most one pick. The answer is `dp[target.length]`.",
      "",
      "## Complexity",
      "",
      "O(words × length + length × target) time; O(26 × length + target) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Once the counts exist, the words themselves are irrelevant — that reduction is the whole problem.",
      "- Iterate `j` only up to `min(column, target.length − 1)`: you cannot have matched more letters than columns consumed.",
    ].join("\n"),
    judge: {
      solutionCode: `function numWays(words, target) {
  const MOD = 1000000007n;
  const m = words[0].length;
  const n = target.length;
  const counts = Array.from({ length: m }, () => new Map());
  for (const word of words) {
    for (let i = 0; i < m; i++) counts[i].set(word[i], (counts[i].get(word[i]) ?? 0) + 1);
  }
  const dp = Array(n + 1).fill(0n);
  dp[0] = 1n;
  for (let col = 0; col < m; col++) {
    for (let j = Math.min(col, n - 1); j >= 0; j--) {
      const c = counts[col].get(target[j]) ?? 0;
      if (c) dp[j + 1] = (dp[j + 1] + dp[j] * BigInt(c)) % MOD;
    }
  }
  return Number(dp[n]);
}
`,
      starterCode: `/**
 * @param {string[]} words all of the same length
 * @param {string} target
 * @returns {number} ways modulo 1e9 + 7
 */
function numWays(words, target) {
  // Your code here
  return 0;
}
`,
      entry: "numWays",
      tests: [
        { name: "Prompt example", input: [["acca", "bbbb", "caca"], "aba"], expected: 6 },
        { name: "Two words", input: [["abba", "baab"], "bab"], expected: 4 },
        { name: "One letter", input: [["a"], "a"], expected: 1 },
        { name: "Columns must advance", input: [["ab", "ba"], "aa"], expected: 1 },
        { name: "Choose two of three columns", input: [["aaa"], "aa"], expected: 3 },
        { name: "Impossible", input: [["abc"], "cb"], expected: 0 },
      ],
    },
  },
  {
    slug: "string-transformation",
    title: "String Transformation",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Every operation is a rotation, so count the rotations of s that equal t and the k-step walks on a cycle of n positions.",
    prompt: [
      "Strings `s` and `t` have the same length `n`. One operation removes a suffix of `s` of length `l` (`0 < l < n`) and prepends it. Count the ways to turn `s` into `t` with **exactly** `k` operations, modulo `1 000 000 007`. Two ways differ if any operation differs; `k` may be as large as `10¹⁵`.",
      "",
      "```",
      "numberOfWays(\"abcd\", \"cdab\", 2)      ->  2",
      "numberOfWays(\"ababab\", \"ababab\", 1)  ->  2",
      "```",
    ].join("\n"),
    hints: [
      "An operation rotates the string, so the result after k operations is a rotation of s by the sum of the suffix lengths modulo n. Count the rotation amounts that make s equal t — find t in s + s with KMP.",
      "Let f(k) be the number of k-operation sequences whose total rotation is 0 (mod n) and g(k) the number for one specific non-zero total. Then f(k) = (n − 1) g(k − 1) and g(k) = f(k − 1) + (n − 2) g(k − 1); use fast matrix exponentiation for huge k.",
    ],
    solution: [
      "## Approach",
      "",
      "Each operation is a rotation by some amount in 1..n − 1, so a sequence of operations is a walk on the cycle of n rotation amounts, and only the total matters. Let `f(k)` count walks of length k ending at rotation 0 and `g(k)` count walks ending at any one fixed non-zero rotation. Starting from f(0) = 1, g(0) = 0, each step gives `f = (n − 1)·g` and `g = f + (n − 2)·g`, so k steps are a 2 × 2 matrix power, computed in O(log k). Separately, find which rotation amounts turn s into t by searching for t in s + s (KMP) — amount 0 counts only if s = t. The answer is `f(k)` for the zero amount plus `g(k)` for every other matching amount.",
      "",
      "## Complexity",
      "",
      "O(n + log k) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- A closed form exists — g(k) = ((n − 1)^k − (−1)^k) / n — but the matrix is easier to get right under time pressure.",
      "- Use the search, not n string comparisons: n can be 5 × 10⁵.",
    ].join("\n"),
    judge: {
      solutionCode: `// Rotations matching t (KMP on s + s) times the number of k-step walks on the cycle.
function numberOfWays(s, t, k) {
  const n = s.length;
  const MOD = 1000000007n;
  const lps = Array(n).fill(0);
  for (let i = 1, len = 0; i < n; ) {
    if (t[i] === t[len]) lps[i++] = ++len;
    else if (len) len = lps[len - 1];
    else lps[i++] = 0;
  }
  const text = s + s;
  let matches = 0;
  for (let i = 0, j = 0; i < 2 * n - 1; i++) {
    while (j && text[i] !== t[j]) j = lps[j - 1];
    if (text[i] === t[j]) j++;
    if (j === n) {
      matches++;
      j = lps[j - 1];
    }
  }
  const zero = s === t ? 1 : 0;
  const mul = (A, B) => [
    [(A[0][0] * B[0][0] + A[0][1] * B[1][0]) % MOD, (A[0][0] * B[0][1] + A[0][1] * B[1][1]) % MOD],
    [(A[1][0] * B[0][0] + A[1][1] * B[1][0]) % MOD, (A[1][0] * B[0][1] + A[1][1] * B[1][1]) % MOD],
  ];
  let result = [[1n, 0n], [0n, 1n]];
  let base = [[0n, BigInt(n - 1)], [1n, BigInt(n - 2)]];
  for (let e = BigInt(k); e > 0n; e >>= 1n) {
    if (e & 1n) result = mul(result, base);
    base = mul(base, base);
  }
  const f = result[0][0];
  const g = result[1][0];
  return Number((BigInt(zero) * f + BigInt(matches - zero) * g) % MOD);
}
`,
      starterCode: `/**
 * @param {string} s
 * @param {string} t same length as s
 * @param {number} k operations, up to 1e15
 * @returns {number} ways modulo 1e9 + 7
 */
function numberOfWays(s, t, k) {
  // Your code here
  return 0;
}
`,
      entry: "numberOfWays",
      tests: [
        { name: "Prompt example", input: ["abcd", "cdab", 2], expected: 2 },
        { name: "Already equal, one operation", input: ["ababab", "ababab", 1], expected: 2 },
        { name: "Two letters, one swap", input: ["ab", "ba", 1], expected: 1 },
        { name: "Two operations return home", input: ["ab", "ab", 2], expected: 1 },
        { name: "Three letters, back to the start", input: ["abc", "abc", 2], expected: 2 },
        { name: "Every rotation matches", input: ["aaaa", "aaaa", 3], expected: 27 },
        { name: "A single rotation", input: ["abc", "bca", 1], expected: 1 },
        { name: "A huge k", input: ["abcd", "cdab", 1000000000000000], expected: 117151711 },
        { name: "A huge k with several matching rotations", input: ["ababab", "ababab", 1000000000000000], expected: 205071942 },
      ],
    },
  },
];
