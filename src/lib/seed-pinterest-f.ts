import type { Problem } from "./types";

// Pinterest onsite bank, part F: the stateful autocomplete session and
// reverse count-and-say.

export const pinterestProblemsF: Problem[] = [
  {
    slug: "autocomplete-session",
    title: "Stateful Search Autocomplete Session",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "LC 642: a typing session over historical search frequencies.",
    prompt: `Design a search-autocomplete session over historical sentences and their search counts: sentences[i] was searched times[i] times. The user then types one character at a time.

\`\`\`
AutocompleteSystem(sentences, times)
input(c) -> string[]
\`\`\`

Each c is a lowercase letter, a space, or "#":

- c != "#": append c to the current query and return the **top 3** historical sentences whose prefix equals everything typed so far — ordered by frequency descending, ties broken lexicographically ascending (ASCII, so space sorts before "a"). Fewer than 3 if fewer match; [] if none.
- c == "#": the query typed so far is a finished sentence. Record it (frequency + 1; a never-seen sentence starts at 1), reset the session, and return []. A bare "#" with nothing typed records nothing.

\`\`\`
s = new AutocompleteSystem(["i love you", "island", "iroman", "i love leetcode"],
                           [5, 3, 2, 2])
s.input("i")  => ["i love you", "island", "i love leetcode"]
                 ("iroman" ties "i love leetcode" at 2; the latter sorts first)
s.input(" ")  => ["i love you", "i love leetcode"]
s.input("a")  => []
s.input("#")  => []          "i a" is stored with frequency 1
s.input("i")  => ["i love you", "island", "i love leetcode"]
s.input(" ")  => ["i love you", "i love leetcode", "i a"]
\`\`\`

Up to 100 initial sentences, length <= 100, up to 5000 input() calls.

## Follow-ups

- Make input(c) cheaper than rescanning every sentence — where does the time go?
- Generalize to top-k.
- The user types a prefix nothing matches — avoid wasted work for the rest of that query.`,
    hints: [
      "Keep the frequency table plus the current typed query as session state. Every non-# keystroke extends the query; # commits and clears it.",
      "The comparator is the whole trick: sort matches by (-frequency, sentence) and take three.",
      "The scale follow-up wants a trie with a cursor: descend one node per keystroke instead of re-walking the prefix, and remember when you have fallen off the trie so the rest of the query costs nothing.",
    ],
    solution: `## Approach

Session state is a frequency map plus the query typed so far. A keystroke extends the query and reports the top three matches under the comparator (-frequency, sentence) — that single sort key encodes both rules, including space sorting before letters. A "#" commits the typed sentence (new sentences start at 1) and resets.

\`\`\`python
class AutocompleteSystem:
    def __init__(self, sentences, times):
        self.freq = dict(zip(sentences, times))
        self.query = ""

    def input(self, c):
        if c == "#":
            if self.query:
                self.freq[self.query] = self.freq.get(self.query, 0) + 1
            self.query = ""
            return []
        self.query += c
        matches = [s for s in self.freq if s.startswith(self.query)]
        matches.sort(key=lambda s: (-self.freq[s], s))
        return matches[:3]
\`\`\`

With <= 100 stored sentences this scan is O(S · L + S log S) per keystroke and comfortably fits the constraints — say that, then answer the follow-up: a **trie with a session cursor** makes each keystroke O(1) to descend (store per-node candidate lists or counts to avoid walking subtrees), falling off the trie marks the rest of the query dead, and top-k falls out of the same per-node ordering. That is the difference between the working answer and the design answer this question is really probing for.`,
    judge: {
      starterCode: `class AutocompleteSystem {
  /**
   * @param {string[]} sentences
   * @param {number[]} times - historical search counts, aligned by index
   */
  constructor(sentences, times) {
    // Your state here
  }

  /**
   * @param {string} c - lowercase letter, " ", or "#"
   * @returns {string[]} top 3 matches (frequency desc, then lexicographic)
   */
  input(c) {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let system = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "AutocompleteSystem") {
      system = new AutocompleteSystem(...args[i]);
      out.push(null);
    } else {
      out.push(system.input(...args[i]));
    }
  }
  return out;
}`,
      tests: [
        {
          name: "The LC 642 session, verbatim",
          input: [
            ["AutocompleteSystem", "input", "input", "input", "input", "input", "input"],
            [
              [["i love you", "island", "iroman", "i love leetcode"], [5, 3, 2, 2]],
              ["i"], [" "], ["a"], ["#"], ["i"], [" "],
            ],
          ],
          expected: [
            null,
            ["i love you", "island", "i love leetcode"],
            ["i love you", "i love leetcode"],
            [],
            [],
            ["i love you", "island", "i love leetcode"],
            ["i love you", "i love leetcode", "i a"],
          ],
        },
        {
          name: "Repeating a sentence outranks the old leader",
          input: [
            ["AutocompleteSystem", "input", "input", "input", "input", "input", "input", "input", "input"],
            [
              [["hat", "hip"], [2, 2]],
              ["h"], ["i"], ["p"], ["#"],
              ["h"], ["i"], ["p"], ["#"],
            ],
          ],
          expected: [
            null,
            ["hat", "hip"],
            ["hip"],
            ["hip"],
            [],
            ["hip", "hat"],
            ["hip"],
            ["hip"],
            [],
          ],
        },
        {
          name: "A bare # records nothing",
          input: [
            ["AutocompleteSystem", "input", "input"],
            [[["ab"], [1]], ["#"], ["a"]],
          ],
          expected: [null, [], ["ab"]],
        },
        {
          name: "Fourth-place match is cut",
          input: [
            ["AutocompleteSystem", "input"],
            [[["aa", "ab", "ac", "ad"], [1, 1, 1, 1]], ["a"]],
          ],
          expected: [null, ["aa", "ab", "ac"]],
        },
      ],
    },
  },
  {
    slug: "reverse-count-and-say",
    title: "Reverse Count-and-Say",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Parse (count, digit) pairs backward — adjacent runs must differ.",
    prompt: `The count-and-say step reads a digit string run by run and writes count then digit for each run: "23" -> "1213" (one 2, one 3); "3" repeated 121 times -> "1213" as well; "11" -> "21"; "0" -> "10".

You are given a string s that is the output of **exactly one** such step. Return **all** original strings that produce s.

## A valid parse of s

- s splits left to right into pairs (count, digit): count is a positive integer with no leading zero (multi-digit counts like "121" are legal), digit is exactly one character 0-9.
- Consecutive pairs must have **different** digits — equal digits would have been one longer run.
- If s cannot be parsed, return []. s = "" returns [""], keeping the round trip consistent.

\`\`\`
"1213"  => ["23", "3" x 121]     (12,1)(3…) leaves a lone digit — invalid
"11"    => ["1"]
"21"    => ["11"]
"10"    => ["0"]
"11112" => ["1" x 11 + "2", "1" + "2" x 11, "2" x 1111]
          (1,1)(1,1)(1,2) is rejected: two consecutive runs of "1"
"0", "01", "1", "a1"  =>  []
\`\`\`

Return the originals **sorted ascending**. Originals can be exponentially long, so build them as (count, digit) runs and expand at the end — s stays short (<= 20) when materializing.

## Part (b)

countOriginals(s): just the number of originals, for s up to length 2000.

## Follow-ups

- Why can one input be unambiguous while a near-identical one explodes?
- Where exactly does the "adjacent digits differ" rule come from in the forward step?`,
    hints: [
      "Scan positions: at index i, the count is s[i..j) and the digit is s[j], for every j > i — then recurse from j + 1. A count may not start with \"0\".",
      "Carry the previous digit through the recursion and reject a pair whose digit equals it — that is the forward step's maximal-run rule reflected backward.",
      "Part (b) is the same recursion memoized on (index, previousDigit) — counting parses instead of materializing them.",
    ],
    solution: `## Approach

Backward parsing with backtracking. At position i, every split "count = s[i..j), digit = s[j]" is a candidate pair — counts can be any length, so j ranges over the rest of the string — subject to: the count has no leading zero, and the digit differs from the previous pair's digit (equal digits would have been a single longer run in the forward step). Originals are built in compact (count, digit) run form and expanded only at the end, since a count like 121 expands to 121 characters.

\`\`\`python
from functools import lru_cache


def reverse_count_and_say(s):
    results = []

    def backtrack(i, prev, runs):
        if i == len(s):
            results.append("".join(d * c for c, d in runs))
            return
        if not s[i].isdigit() or s[i] == "0":
            return
        for j in range(i + 1, len(s)):
            digit = s[j]
            if not digit.isdigit() or digit == prev:
                continue
            runs.append((int(s[i:j]), digit))
            backtrack(j + 1, digit, runs)
            runs.pop()

    if s == "":
        return [""]
    backtrack(0, "", [])
    return sorted(results)


def count_originals(s):
    @lru_cache(maxsize=None)
    def ways(i, prev):
        if i == len(s):
            return 1
        if not s[i].isdigit() or s[i] == "0":
            return 0
        total = 0
        for j in range(i + 1, len(s)):
            digit = s[j]
            if digit.isdigit() and digit != prev:
                total += ways(j + 1, digit)
        return total

    return 1 if s == "" else ways(0, "")
\`\`\`

Counting runs in O(n² · 10) with memoization on (index, previous digit). The follow-up answer: ambiguity comes entirely from where the count ends — "1213" can end its first count at "1" or "121" — while the adjacent-digits rule exists because the forward step always emits **maximal** runs, so two adjacent pairs with the same digit could never have been produced.`,
    judge: {
      starterCode: `/**
 * All originals whose count-and-say step produces s, sorted ascending.
 * @param {string} s
 * @returns {string[]}
 */
function reverseCountAndSay(s) {
  // Your code here
  return [];
}

/**
 * Just how many originals there are.
 * @returns {number}
 */
function countOriginals(s) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeReverseSay",
      driverCode: `function __judgeReverseSay(op, s) {
  return op === "all" ? reverseCountAndSay(s) : countOriginals(s);
}`,
      tests: [
        {
          name: "The classic ambiguity",
          input: ["all", "1213"],
          expected: ["23", "3".repeat(121)],
        },
        { name: "Single pair", input: ["all", "11"], expected: ["1"] },
        { name: "Two ones", input: ["all", "21"], expected: ["11"] },
        { name: "Count one, digit zero", input: ["all", "10"], expected: ["0"] },
        {
          name: "Adjacent equal digits are rejected",
          input: ["all", "11112"],
          expected: ["1".repeat(11) + "2", "1" + "2".repeat(11), "2".repeat(1111)],
        },
        { name: "Leading zero count", input: ["all", "01"], expected: [] },
        { name: "Odd leftover digit", input: ["all", "1"], expected: [] },
        { name: "Empty round trip", input: ["all", ""], expected: [""] },
        { name: "Count the classic", input: ["count", "1213"], expected: 2 },
        { name: "Count the triple", input: ["count", "11112"], expected: 3 },
        { name: "Count invalid", input: ["count", "0"], expected: 0 },
      ],
    },
  },
];
