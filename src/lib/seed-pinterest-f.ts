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
    summary: "A typing session over search counts: top three by frequency, then alphabetically.",
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

Up to 100 initial sentences, length <= 100, up to 5000 input() calls.`,
    hints: [
      "Keep the frequency table plus the current typed query as session state. Every non-# keystroke extends the query; # commits and clears it.",
      "The comparator is the whole trick: sort matches by (-frequency, sentence) and take three.",
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

With <= 100 stored sentences this scan is O(S · L + S log S) per keystroke and comfortably fits the constraints — say that before optimizing.

## Worth saying out loud

- Where the time goes: every keystroke rescans every sentence. A **trie with a session cursor** descends one node per keystroke instead of re-walking the prefix; storing a small ranked candidate list (or counts) per node avoids walking subtrees.
- Once the cursor falls off the trie, no later keystroke in that query can match, so mark the query dead and return [] without work until "#".
- Top-k instead of top-3 falls out of the same per-node ordering.`,
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
          name: "Example session",
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

Return the originals **sorted ascending**. Originals can be exponentially long, so build them as (count, digit) runs and expand at the end — s stays short (<= 20) when materializing.`,
    hints: [
      "Scan positions: at index i, the count is s[i..j) and the digit is s[j], for every j > i — then recurse from j + 1. A count may not start with \"0\".",
      "Carry the previous digit through the recursion and reject a pair whose digit equals it — that is the forward step's maximal-run rule reflected backward.",
    ],
    solution: `## Approach

Backward parsing with backtracking. At position i, every split "count = s[i..j), digit = s[j]" is a candidate pair — counts can be any length, so j ranges over the rest of the string — subject to: the count has no leading zero, and the digit differs from the previous pair's digit (equal digits would have been a single longer run in the forward step). Originals are built in compact (count, digit) run form and expanded only at the end, since a count like 121 expands to 121 characters.

\`\`\`python
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
\`\`\`

Exponential in the worst case, because the output itself can be.

## Worth saying out loud

- Ambiguity comes entirely from where each count ends — "1213" can end its first count at "1" or at "121" — so a near-identical input with fewer valid count boundaries can have a single parse.
- The adjacent-digits rule exists because the forward step always emits **maximal** runs: two adjacent pairs with the same digit could never have been produced.`,
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
`,
      entry: "reverseCountAndSay",
      tests: [
        {
          name: "The classic ambiguity",
          input: ["1213"],
          expected: ["23", "3".repeat(121)],
        },
        { name: "Single pair", input: ["11"], expected: ["1"] },
        { name: "Two ones", input: ["21"], expected: ["11"] },
        { name: "Count one, digit zero", input: ["10"], expected: ["0"] },
        {
          name: "Adjacent equal digits are rejected",
          input: ["11112"],
          expected: ["1".repeat(11) + "2", "1" + "2".repeat(11), "2".repeat(1111)],
        },
        { name: "Leading zero count", input: ["01"], expected: [] },
        { name: "Odd leftover digit", input: ["1"], expected: [] },
        { name: "Empty round trip", input: [""], expected: [""] },
      ],
    },
  },
  {
    slug: "count-count-and-say-originals",
    title: "Count the Originals of a Count-and-Say String",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "The reverse parse, memoized on (index, previous digit) — count, don't build.",
    prompt: `The count-and-say step reads a digit string run by run and writes count then digit for each run: "23" -> "1213" (one 2, one 3); "3" repeated 121 times -> "1213" as well; "11" -> "21"; "0" -> "10".

You are given a string s that is the output of **exactly one** such step. Return **how many** original strings produce s.

## A valid parse of s

- s splits left to right into pairs (count, digit): count is a positive integer with no leading zero (multi-digit counts like "121" are legal), digit is exactly one character 0-9.
- Consecutive pairs must have **different** digits — equal digits would have been one longer run.
- If s cannot be parsed, the answer is 0. s = "" has exactly one original, "".

\`\`\`
"1213"  => 2     ("23" and "3" x 121)
"11112" => 3     ((1,1)(1,1)(1,2) is rejected: two consecutive runs of "1")
"0"     => 0
\`\`\`

s can be up to 2000 characters long, so the originals can't be listed — count them.`,
    hints: [
      "At index i, the count is s[i..j) and the digit is s[j], for every j > i. The number of parses from i onward depends only on i and the previous pair's digit.",
      "Memoize ways(i, prevDigit): 1 at the end of the string, 0 when s[i] is not a digit or is \"0\", otherwise the sum over valid j of ways(j + 1, s[j]).",
      "Up to 2000 characters means deep recursion — fill the table bottom-up from the end. A running total per digit turns the inner loop into a subtraction.",
    ],
    solution: `## Approach

The same parse as listing the originals, but the number of ways to finish from position i depends only on i and the previous pair's digit, so count per (i, prev) instead of building. A pair starting at i has a count s[i..j) with no leading zero and a digit s[j] that must differ from prev. Every character is part of a count or is a pair's digit, so a string with anything but digits has no parse.

Filling the table from the end avoids 2000-deep recursion, and a running sum per digit removes the inner loop: acc[d] totals ways[j + 1][d] over the positions j > i holding digit d, so the parses from i with previous digit p are sum(acc) − acc[p].

\`\`\`python
def count_originals(s):
    n = len(s)
    if n == 0:
        return 1
    if not s.isdigit():
        return 0
    # ways[i][p]: parses of s[i:] when the previous pair's digit is p (10 = none)
    ways = [[0] * 11 for _ in range(n + 1)]
    ways[n] = [1] * 11
    acc = [0] * 10
    for i in range(n - 1, -1, -1):
        if s[i] != "0":
            total = sum(acc)
            for p in range(11):
                ways[i][p] = total - (acc[p] if p < 10 else 0)
        d = int(s[i])
        acc[d] += ways[i + 1][d]
    return ways[0][10]
\`\`\`

O(n · 10) time and space. The counts grow fast; Python's integers don't overflow, and in a fixed-width language you would say what bound the input promises.

## Worth saying out loud

- Counting is polynomial even though listing is exponential: the answer only needs how many ways each suffix parses, not the parses themselves.
- The previous digit is the only history that matters, which is why the state is (i, prev) and not the whole prefix.`,
    judge: {
      starterCode: `/**
 * How many originals does the count-and-say string s have?
 * @param {string} s
 * @returns {number}
 */
function countOriginals(s) {
  // Your code here
  return 0;
}
`,
      entry: "countOriginals",
      tests: [
        { name: "Count the classic", input: ["1213"], expected: 2 },
        { name: "Count the triple", input: ["11112"], expected: 3 },
        { name: "Count invalid", input: ["0"], expected: 0 },
        { name: "Empty string has one original", input: [""], expected: 1 },
        { name: "Single pair", input: ["21"], expected: 1 },
        { name: "Too many parses to list", input: ["12".repeat(50)], expected: 670976837021 },
        { name: "Two thousand characters", input: ["1".repeat(2000)], expected: 1 },
      ],
    },
  },
];
