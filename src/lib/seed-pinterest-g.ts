import type { Problem } from "./types";

// Pinterest bank, part G: rounding a comma-separated list of numeric strings
// and settling the balances carried by a chunked stream. Judged in all six
// languages; the non-JavaScript judges live in seed-python-splits.ts,
// seed-typescript-splits.ts and seed-compiled-splits.ts.

export const pinterestProblemsG: Problem[] = [
  {
    slug: "round-numeric-string-list",
    title: "Round a List of Numeric Strings",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Split, round each value with string arithmetic, join — floats need not apply.",
    prompt: `You are given a comma-separated string of numeric values, for example "2.5,-2.5,9.99,-0.4". The values may be far too large for built-in integer or float types in most languages, and converting to float would lose precision — so treat this as pure string manipulation.

Round every value to the nearest integer, rounding half away from zero, and return the rounded values comma-separated in the same order. Each result has no leading zeros and is never "-0". An empty string returns an empty string.

\`\`\`
"2.5,-2.5,9.99,-0.4"   -> "3,-3,10,0"
"999.5"                -> "1000"
"123456789123456789123456789.5,-0.5" -> "123456789123456789123456790,-1"
\`\`\``,
    hints: [
      "Only the first fractional digit matters for direction: with half-away-from-zero, the magnitude rounds up exactly when that digit is 5 or more.",
      "Round the magnitude and reattach the sign only when the result is not 0. Rounding up is big-integer addition: walk the integer digits right to left carrying a 1, and prepend a digit if the carry survives (999 to 1000).",
      "The list itself is a split on commas, a map over the values, and a join.",
    ],
    solution: `## Approach

Write the single-value rounding first, then map it over the list. Split off the sign, then split on the dot. Only the **first fractional digit** matters under round-half-away-from-zero: the magnitude rounds up exactly when that digit is \`"5"\` or more. Rounding up is big-integer increment: walk the integer digits right to left turning \`9\`s into \`0\`s until a digit absorbs the carry, prepending \`"1"\` if none does. Reattach the sign only when the result isn't \`"0"\`.

\`\`\`python
def round_numeric_string(s):
    sign = ""
    if s and s[0] in "+-":
        sign = "-" if s[0] == "-" else ""
        s = s[1:]
    int_part, _, frac = s.partition(".")
    int_part = int_part.lstrip("0") or "0"
    if frac and frac[0] >= "5":
        int_part = add_one(int_part)
    return "0" if int_part == "0" else sign + int_part


def add_one(digits):
    out = list(digits)
    for i in range(len(out) - 1, -1, -1):
        if out[i] == "9":
            out[i] = "0"
        else:
            out[i] = str(int(out[i]) + 1)
            return "".join(out)
    return "1" + "".join(out)


def round_all(csv):
    if not csv:
        return ""
    return ",".join(round_numeric_string(v) for v in csv.split(","))
\`\`\`

## Complexity

O(n) over the whole string — each value is split once and carried at most once.

## Worth saying out loud

- Floats are the trap: \`float("123456789123456789123456789.5")\` silently loses the digits that decide the answer.
- The empty string is its own case: splitting it on commas yields one empty value, which would round to "0".
- The \`"-0"\` rule falls out of ordering: normalize the magnitude first, attach the sign last.`,
    judge: {
      starterCode: `/**
 * Round every value in a comma-separated list of numeric strings to the
 * nearest integer, rounding half away from zero. No leading zeros in the
 * results, and never "-0". Values can exceed any built-in numeric type —
 * stay in string land.
 * @param {string} csv - e.g. "2.5,-2.5,9.99"
 * @returns {string}
 */
function roundAll(csv) {
  // Your code here
  return csv;
}
`,
      entry: "roundAll",
      tests: [
        { name: "Ties, carries and a negative zero", input: ["2.5,-2.5,9.99,-0.4"], expected: "3,-3,10,0" },
        { name: "A single value", input: ["999.5"], expected: "1000" },
        { name: "Empty list", input: [""], expected: "" },
        {
          name: "Bigger than any float",
          input: ["123456789123456789123456789.5,-0.5,7.499"],
          expected: "123456789123456789123456790,-1,7",
        },
        { name: "Leading zeros and plain integers", input: ["007.4,42,-0"], expected: "7,42,0" },
        {
          name: "Negative carry ripples all the way",
          input: ["-99999999999999999999.9,0.5"],
          expected: "-100000000000000000000,1",
        },
      ],
    },
  },
  {
    slug: "settle-debts-from-stream",
    title: "Settle Balances From a Chunked Stream",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Reassemble the lines, net the balances, then search for the fewest transfers.",
    prompt: `You are given an API you cannot modify:

\`\`\`
readChunk() -> string    // next chunk of a log stream; "" means end of stream
\`\`\`

The judge implements readChunk and passes it **into** your code: it is the argument settleFromStream receives (a plain callback in JavaScript, TypeScript, and Python; a Supplier<String> in Java; a function<string()> in C++; a func() string in Go). Don't define it yourself, and don't call it as a global — use the one handed to you.

Each line of the stream is payer,payee,amount with an integer amount: the payer paid that amount on the payee's behalf. Chunks split arbitrarily — one chunk may hold several lines, and one line may span several chunks — and the final line may lack a trailing newline. Blank lines carry nothing.

Implement settleFromStream(readChunk): parse the stream, compute each person's net balance, and return the **minimum number of transactions** needed to settle everyone.

\`\`\`
chunks: ["a,b,5\\na,c", ",5\\nb,c,5"]   lines a,b,5  a,c,5  b,c,5   => 1
chunks: ["a,b,1\\nc,d,1"]                                         => 2
\`\`\``,
    hints: [
      "Reassembling lines is its own job: keep the fragments of the current unterminated line, and every newline in a chunk completes one. Flush the last fragment when the stream ends.",
      "Only net balances matter — people who net to zero drop out entirely.",
      "Settling the remaining balances in the fewest transactions is a backtracking search: match each nonzero balance against later opposite-sign ones, skipping values already tried at the same depth.",
    ],
    solution: `## Approach

Two layers. A line reader turns chunks into lines: keep the fragments of the unterminated line, let each newline in a chunk complete one, and flush the partial at end of stream. Then net the balances from the parsed lines, drop the zeros, and search for the fewest transactions — a group of people whose balances sum to zero settles in size − 1 transfers, so the search maximizes the number of zero-sum groups.

\`\`\`python
class LineReader:
    def __init__(self, read_chunk):
        self.read_chunk = read_chunk
        self.lines = []
        self.partial = []
        self.eof = False

    def read_line(self):
        while not self.lines and not self.eof:
            chunk = self.read_chunk()
            if chunk == "":
                self.eof = True
                if self.partial:
                    self.lines.append("".join(self.partial))
                    self.partial = []
                break
            pieces = chunk.split("\\n")
            for piece in pieces[:-1]:
                self.partial.append(piece)
                self.lines.append("".join(self.partial))
                self.partial = []
            if pieces[-1]:
                self.partial.append(pieces[-1])
        return self.lines.pop(0) if self.lines else None


def settle_from_stream(read_chunk):
    reader = LineReader(read_chunk)
    balance = {}
    while True:
        line = reader.read_line()
        if line is None:
            break
        if not line:
            continue
        payer, payee, amount = line.split(",")
        balance[payer] = balance.get(payer, 0) + int(amount)
        balance[payee] = balance.get(payee, 0) - int(amount)
    balances = [b for b in balance.values() if b != 0]

    def settle_from(i):
        while i < len(balances) and balances[i] == 0:
            i += 1
        if i == len(balances):
            return 0
        best = float("inf")
        seen = set()
        for j in range(i + 1, len(balances)):
            if balances[i] * balances[j] < 0 and balances[j] not in seen:
                seen.add(balances[j])
                balances[j] += balances[i]
                best = min(best, 1 + settle_from(i + 1))
                balances[j] -= balances[i]
        return best

    return settle_from(0) if balances else 0
\`\`\`

## Complexity

Parsing is O(total characters). The settle search is exponential in the number of *nonzero* balances (with same-value pruning via \`seen\`); minimizing transfers is NP-hard in general, so say that plainly.

## Worth saying out loud

- Keep the reader and the settlement separate: the reader is testable on its own, and the settle step never sees a chunk boundary.
- An amount split across chunks ("1" then "0\\n") is why the parsing waits for whole lines instead of splitting chunks on commas.`,
    judge: {
      starterCode: `/**
 * Lines are "payer,payee,amount" (amount is an integer) and may be split
 * across chunks.
 * @param {() => string} readChunk - returns "" once the stream ends
 * @returns {number} minimum number of transactions to settle all balances
 */
function settleFromStream(readChunk) {
  // Your code here
  return 0;
}
`,
      entry: "__settleStream",
      driverCode: `function __settleStream(chunks) {
  let i = 0;
  const readChunk = () => (i < chunks.length ? chunks[i++] : "");
  return settleFromStream(readChunk);
}`,
      tests: [
        { name: "Middleman nets to zero", input: [["a,b,5\na,c", ",5\nb,c,5"]], expected: 1 },
        { name: "Everyone already even", input: [["a,b,1\nb,c,1\nc,a,1\n"]], expected: 0 },
        { name: "Two independent debts", input: [["a,b,1\nc,d,1"]], expected: 2 },
        { name: "Amounts split across chunks", input: [["x,y,1", "0\nz,w,", "10\n"]], expected: 2 },
        { name: "Empty stream", input: [[]], expected: 0 },
        { name: "Blank lines carry nothing", input: [["a,b,3\n\n", "b,a,1\n"]], expected: 1 },
      ],
    },
  },
];
