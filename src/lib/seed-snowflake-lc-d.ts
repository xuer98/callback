import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part D: strings and parsing — Unix
// path simplification, a calculator with parentheses, nested run decoding,
// Roman numerals, English number words, and reversing only the letters.
// Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-h.ts.

export const snowflakeLcProblemsD: Problem[] = [
  {
    slug: "simplify-path",
    title: "Simplify Path",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Split on slashes and keep a stack of directory names: `.` is skipped, `..` pops, everything else pushes.",
    prompt: [
      "Convert an absolute Unix path to its canonical form: it starts with a single `/`, directories are separated by single slashes, there is no trailing slash, and no `.` or `..` components remain. A `..` at the root stays at the root. Any other name made only of dots, such as `...`, is an ordinary directory name.",
      "",
      "```",
      "simplifyPath(\"/home/\")              ->  \"/home\"",
      "simplifyPath(\"/../\")                ->  \"/\"",
      "simplifyPath(\"/home//foo/\")         ->  \"/home/foo\"",
      "simplifyPath(\"/a/./b/../../c/\")     ->  \"/c\"",
      "```",
    ].join("\n"),
    hints: ["Split on `/`; empty parts and `.` are ignored, `..` pops the stack if it can, and anything else is pushed. Join the stack with slashes under a leading one."],
    solution: [
      "## Approach",
      "",
      "Splitting on `/` turns the path into components where empty strings represent repeated or trailing slashes. Walk them with a stack: skip empty and `.`, pop on `..` (popping an empty stack is a no-op, which handles the root case), push anything else. The answer is a slash followed by the stack joined with slashes.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- `...` and longer runs of dots are valid names on Unix; only the exact strings `.` and `..` are special.",
      "- The same stack handles relative paths if you keep the `..` that cannot be popped instead of dropping it.",
    ].join("\n"),
    judge: {
      solutionCode: `function simplifyPath(path) {
  const stack = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return "/" + stack.join("/");
}
`,
      starterCode: `/**
 * @param {string} path an absolute Unix path
 * @returns {string} the canonical path
 */
function simplifyPath(path) {
  // Your code here
  return "/";
}
`,
      entry: "simplifyPath",
      tests: [
        { name: "Trailing slash", input: ["/home/"], expected: "/home" },
        { name: "Parent of the root", input: ["/../"], expected: "/" },
        { name: "Double slash", input: ["/home//foo/"], expected: "/home/foo" },
        { name: "Dots and parents", input: ["/a/./b/../../c/"], expected: "/c" },
        { name: "Extra parents at the root", input: ["/a/../../b/../c//.//"], expected: "/c" },
        { name: "Three dots is a name", input: ["/..."], expected: "/..." },
      ],
    },
  },
  {
    slug: "basic-calculator",
    title: "Basic Calculator",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "One pass with a running result and sign; a parenthesis pushes both onto a stack and a close pops and combines.",
    prompt: [
      "Evaluate an expression of non-negative integers, `+`, `-`, parentheses and spaces. A `-` may precede a parenthesis as a unary minus. Do not use `eval` or a built-in expression evaluator.",
      "",
      "```",
      "calculate(\"1 + 1\")                    ->  2",
      "calculate(\" 2-1 + 2 \")                ->  3",
      "calculate(\"(1+(4+5+2)-3)+(6+8)\")      ->  23",
      "calculate(\"-(2+3)\")                   ->  -5",
      "```",
    ].join("\n"),
    hints: [
      "Keep `result`, the current `sign` and the number being read. On `+` or `-`, fold the number into the result and set the sign.",
      "On `(` push the result and sign, then start fresh; on `)` fold the number, pop, and combine: `result = saved + savedSign * inner`.",
    ],
    solution: [
      "## Approach",
      "",
      "Scan once. Digits accumulate into a number. An operator folds `sign × number` into the running result and records the next sign. An opening parenthesis saves the running result and the sign that applies to the whole group, then resets both; the matching close folds the pending number, pops the saved pair, and applies the saved sign to the group's value. At the end, fold the last number.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(depth) stack space.",
      "",
      "## Worth saying out loud",
      "",
      "- Unary minus before a parenthesis falls out of the design: the sign pushed with the group is applied when the group closes.",
      "- Adding `*` and `/` is [Basic Calculator II](/problems/basic-calculator-ii), where a stack of signed terms defers additions; [String-Command Calculator](/problems/string-command-calculator) is the same idea over a command language.",
    ].join("\n"),
    judge: {
      solutionCode: `// Running result and sign; parentheses save and restore them on a stack.
function calculate(s) {
  let result = 0;
  let sign = 1;
  let number = 0;
  const stack = [];
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      number = number * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === "+" || ch === "-") {
      result += sign * number;
      number = 0;
      sign = ch === "+" ? 1 : -1;
    } else if (ch === "(") {
      stack.push(result, sign);
      result = 0;
      sign = 1;
    } else if (ch === ")") {
      result += sign * number;
      number = 0;
      const savedSign = stack.pop();
      const saved = stack.pop();
      result = saved + savedSign * result;
      sign = 1;
    }
  }
  return result + sign * number;
}
`,
      starterCode: `/**
 * @param {string} s digits, + - ( ) and spaces
 * @returns {number}
 */
function calculate(s) {
  // Your code here
  return 0;
}
`,
      entry: "calculate",
      tests: [
        { name: "Addition", input: ["1 + 1"], expected: 2 },
        { name: "Mixed signs with spaces", input: [" 2-1 + 2 "], expected: 3 },
        { name: "Nested parentheses", input: ["(1+(4+5+2)-3)+(6+8)"], expected: 23 },
        { name: "Unary minus on a group", input: ["-(2+3)"], expected: -5 },
        { name: "A large number", input: ["2147483647"], expected: 2147483647 },
        { name: "Minus a nested group", input: ["- (3 + (4 + 5))"], expected: -12 },
      ],
    },
  },
  {
    slug: "decode-string",
    title: "Decode String",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Two stacks — counts and the string built so far — and a close bracket repeats the inner string onto the outer one.",
    prompt: [
      "Decode a string where `k[encoded]` means `encoded` repeated `k` times. Encodings nest, `k` is a positive integer of any length, and the plain letters outside brackets are kept as they are.",
      "",
      "```",
      "decodeString(\"3[a]2[bc]\")       ->  \"aaabcbc\"",
      "decodeString(\"3[a2[c]]\")        ->  \"accaccacc\"",
      "decodeString(\"2[abc]3[cd]ef\")   ->  \"abcabccdcdcdef\"",
      "```",
    ].join("\n"),
    hints: [
      "Keep the string being built and the number being read. On `[` push both and start fresh; on `]` pop and set current = popped string + current repeated popped count times.",
      "Digits can be several characters: build the count as `k * 10 + digit`.",
    ],
    solution: [
      "## Approach",
      "",
      "A stack of pending (count, prefix) pairs. Letters append to the current string; digits accumulate a count. An open bracket pushes the count and the current string and resets both. A close bracket pops them and replaces the current string with the saved prefix followed by the inner string repeated. What remains at the end is the answer.",
      "",
      "## Complexity",
      "",
      "O(output length) time; O(depth + output) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The recursive version parses one bracket group per call with a shared index; the stack version is the same recursion made explicit.",
      "- Repeating by string concatenation inside deeply nested groups is where quadratic time hides; `repeat` is fine here.",
    ].join("\n"),
    judge: {
      solutionCode: `function decodeString(s) {
  const counts = [];
  const prefixes = [];
  let current = "";
  let k = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      k = k * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === "[") {
      counts.push(k);
      prefixes.push(current);
      k = 0;
      current = "";
    } else if (ch === "]") {
      current = prefixes.pop() + current.repeat(counts.pop());
    } else {
      current += ch;
    }
  }
  return current;
}
`,
      starterCode: `/**
 * @param {string} s letters, digits and square brackets
 * @returns {string} the decoded string
 */
function decodeString(s) {
  // Your code here
  return "";
}
`,
      entry: "decodeString",
      tests: [
        { name: "Two groups", input: ["3[a]2[bc]"], expected: "aaabcbc" },
        { name: "Nested", input: ["3[a2[c]]"], expected: "accaccacc" },
        { name: "Letters outside brackets", input: ["2[abc]3[cd]ef"], expected: "abcabccdcdcdef" },
        { name: "No brackets", input: ["abc"], expected: "abc" },
        { name: "A two-digit count", input: ["10[a]"], expected: "aaaaaaaaaa" },
        { name: "Empty", input: [""], expected: "" },
      ],
    },
  },
  {
    slug: "roman-to-integer",
    title: "Roman to Integer",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "A symbol smaller than the one after it is subtracted; everything else is added.",
    prompt: [
      "Convert a Roman numeral to an integer. Symbols are `I` 1, `V` 5, `X` 10, `L` 50, `C` 100, `D` 500, `M` 1000; a smaller symbol placed before a larger one is subtracted, as in `IV` for 4 and `XC` for 90. Inputs are valid numerals from 1 to 3999.",
      "",
      "```",
      "romanToInt(\"III\")      ->  3",
      "romanToInt(\"LVIII\")    ->  58",
      "romanToInt(\"MCMXCIV\")  ->  1994",
      "```",
    ].join("\n"),
    hints: ["Walk left to right: if the current value is less than the next one, subtract it, otherwise add it."],
    solution: [
      "## Approach",
      "",
      "One pass comparing each symbol with its successor. Because subtractive pairs are the only place a smaller symbol precedes a larger one, the rule \"subtract when smaller than the next, add otherwise\" handles every valid numeral without listing the six pairs.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The reverse direction, integer to Roman, is greedy over the thirteen values including the subtractive pairs.",
      "- Validating a numeral is a different problem; the comparison rule assumes well-formed input.",
    ].join("\n"),
    judge: {
      solutionCode: `function romanToInt(s) {
  const value = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const current = value[s[i]];
    if (i + 1 < s.length && current < value[s[i + 1]]) total -= current;
    else total += current;
  }
  return total;
}
`,
      starterCode: `/**
 * @param {string} s a valid Roman numeral
 * @returns {number}
 */
function romanToInt(s) {
  // Your code here
  return 0;
}
`,
      entry: "romanToInt",
      tests: [
        { name: "Three", input: ["III"], expected: 3 },
        { name: "Fifty-eight", input: ["LVIII"], expected: 58 },
        { name: "Three subtractive pairs", input: ["MCMXCIV"], expected: 1994 },
        { name: "Four", input: ["IV"], expected: 4 },
        { name: "The largest numeral", input: ["MMMCMXCIX"], expected: 3999 },
        { name: "Forty", input: ["XL"], expected: 40 },
      ],
    },
  },
  {
    slug: "integer-to-english-words",
    title: "Integer to English Words",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Spell three digits at a time and attach Thousand, Million or Billion; the only hard part is leaving out empty groups.",
    prompt: [
      "Convert a non-negative integer below 2³¹ to its English words, capitalised and separated by single spaces, with no hyphens or \"and\".",
      "",
      "```",
      "numberToWords(123)      ->  \"One Hundred Twenty Three\"",
      "numberToWords(12345)    ->  \"Twelve Thousand Three Hundred Forty Five\"",
      "numberToWords(1234567)  ->  \"One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven\"",
      "numberToWords(0)        ->  \"Zero\"",
      "```",
    ].join("\n"),
    hints: [
      "Write a helper that spells 1 to 999 from three tables: the words below twenty, the tens, and \"Hundred\".",
      "Peel the number into three-digit groups from the right, pairing each non-zero group with its scale word, and join the non-empty pieces.",
    ],
    solution: [
      "## Approach",
      "",
      "A helper spells any number from 1 to 999: hundreds digit plus \"Hundred\", then either a word below twenty or a tens word plus a units word. The main loop takes the number modulo 1000 repeatedly, spelling each non-zero group with its scale — nothing, Thousand, Million, Billion — and prepends the piece. Zero is the one special case.",
      "",
      "## Complexity",
      "",
      "O(1): at most four groups.",
      "",
      "## Worth saying out loud",
      "",
      "- The bugs are all about empty groups: 1 000 000 must not produce \"One Million Thousand\", and a group of zero skips its scale word entirely.",
      "- Building a list of pieces and joining once avoids the double-space and trailing-space problems of string concatenation.",
    ].join("\n"),
    judge: {
      solutionCode: `function numberToWords(num) {
  if (num === 0) return "Zero";
  const below20 = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const group = (n) => {
    const words = [];
    if (n >= 100) {
      words.push(below20[Math.floor(n / 100)], "Hundred");
      n %= 100;
    }
    if (n >= 20) {
      words.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) words.push(below20[n]);
    return words.join(" ");
  };
  const scales = ["", "Thousand", "Million", "Billion"];
  const pieces = [];
  for (let i = 0; num > 0; i++, num = Math.floor(num / 1000)) {
    const n = num % 1000;
    if (n > 0) pieces.unshift(scales[i] ? group(n) + " " + scales[i] : group(n));
  }
  return pieces.join(" ");
}
`,
      starterCode: `/**
 * @param {number} num 0 <= num < 2^31
 * @returns {string} the number in English words
 */
function numberToWords(num) {
  // Your code here
  return "";
}
`,
      entry: "numberToWords",
      tests: [
        { name: "Three digits", input: [123], expected: "One Hundred Twenty Three" },
        { name: "Thousands", input: [12345], expected: "Twelve Thousand Three Hundred Forty Five" },
        { name: "Millions", input: [1234567], expected: "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven" },
        { name: "Zero", input: [0], expected: "Zero" },
        { name: "An empty middle group", input: [1000000], expected: "One Million" },
        { name: "Exactly one hundred", input: [100], expected: "One Hundred" },
        { name: "The largest input", input: [2147483647], expected: "Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Seven" },
        { name: "Teens", input: [15], expected: "Fifteen" },
      ],
    },
  },
  {
    slug: "reverse-only-letters",
    title: "Reverse Only Letters",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Two pointers that each skip non-letters, swapping when both sit on a letter.",
    prompt: [
      "Reverse the letters of a string while every non-letter character stays where it is.",
      "",
      "```",
      "reverseOnlyLetters(\"ab-cd\")                  ->  \"dc-ba\"",
      "reverseOnlyLetters(\"a-bC-dEf-ghIj\")          ->  \"j-Ih-gfE-dCba\"",
      "reverseOnlyLetters(\"Test1ng-Leet=code-Q!\")   ->  \"Qedo1ct-eeLg=ntse-T!\"",
      "```",
    ].join("\n"),
    hints: ["Left and right pointers: advance whichever is not on a letter; when both are, swap and move both inward."],
    solution: [
      "## Approach",
      "",
      "Convert to an array of characters and run two pointers inward. If the left one is not a letter, move it right; if the right one is not a letter, move it left; otherwise swap and move both. Non-letters never move because they are never swapped.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(n) space for the character array (O(1) extra in a language with mutable strings).",
      "",
      "## Worth saying out loud",
      "",
      "- Collecting the letters, reversing them and writing them back in a second pass is the same answer with a second allocation.",
      "- [Reverse Each Alphanumeric Run](/problems/reverse-alphanumeric-runs) is the variant where runs reverse independently instead of the whole string.",
    ].join("\n"),
    judge: {
      solutionCode: `function reverseOnlyLetters(s) {
  const chars = s.split("");
  const isLetter = (ch) => /[A-Za-z]/.test(ch);
  let i = 0;
  let j = chars.length - 1;
  while (i < j) {
    if (!isLetter(chars[i])) i++;
    else if (!isLetter(chars[j])) j--;
    else {
      [chars[i], chars[j]] = [chars[j], chars[i]];
      i++;
      j--;
    }
  }
  return chars.join("");
}
`,
      starterCode: `/**
 * @param {string} s
 * @returns {string} s with its letters reversed and everything else in place
 */
function reverseOnlyLetters(s) {
  // Your code here
  return "";
}
`,
      entry: "reverseOnlyLetters",
      tests: [
        { name: "One dash", input: ["ab-cd"], expected: "dc-ba" },
        { name: "Mixed case", input: ["a-bC-dEf-ghIj"], expected: "j-Ih-gfE-dCba" },
        { name: "Digits and punctuation", input: ["Test1ng-Leet=code-Q!"], expected: "Qedo1ct-eeLg=ntse-T!" },
        { name: "Empty", input: [""], expected: "" },
        { name: "No letters", input: ["7_28]"], expected: "7_28]" },
        { name: "A single letter", input: ["a"], expected: "a" },
      ],
    },
  },
];
