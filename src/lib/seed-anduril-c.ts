import type { Problem } from "./types";

// Anduril bank, part C: brace expansion (flat groups, then nested groups
// with a recursive-descent parser) and the nested-transaction KV store.

export const andurilProblemsC: Problem[] = [
  {
    slug: "brace-expansion",
    title: "Brace Expansion",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Tokenize into groups of choices, then fold a cartesian product across them.",
    prompt: `A pattern describes a set of strings: a brace group \`{a,b}\` means "one of these characters", and everything else is a literal. Groups don't nest, and commas only appear inside groups. Return **all strings the pattern can produce**, sorted and without duplicates.

\`\`\`
"{a,b}c{d,e}f"  ->  ["acdf", "acef", "bcdf", "bcef"]
"abcd"          ->  ["abcd"]
\`\`\``,
    hints: [
      "Split the pattern into groups: each brace group becomes its sorted, deduplicated options, and each literal becomes a one-item group.",
      "Build the cartesian product left to right: every prefix so far times every option of the next group.",
    ],
    solution: `## Approach

Tokenize, then take a product. Walk the pattern once, turning each brace group into its sorted set of options and each literal into a one-option group. Then fold a cartesian product across the groups, left to right.

\`\`\`python
def brace_expansion(s):
    groups, i = [], 0
    while i < len(s):
        if s[i] == '{':
            j = s.index('}', i)
            groups.append(sorted(set(s[i + 1:j].split(','))))
            i = j + 1
        else:
            groups.append([s[i]])
            i += 1
    out = ['']
    for g in groups:                                     # cartesian product, left to right
        out = [prefix + ch for prefix in out for ch in g]
    return sorted(set(out))
\`\`\`

## Complexity

Output-bound: O(K · L) for K result strings of length L, plus the final sort. Say the exponential blow-up out loud before coding — k groups of m options produce m^k strings.

## Worth saying out loud

- Sorting each group up front makes the product come out already sorted; the final sort is then a safety net, not the algorithm.
- If groups could nest, tokenizing stops working — that needs a small recursive-descent parser over a grammar of unions and products.`,
    judge: {
      starterCode: `/**
 * Flat groups only: "{a,b}c{d,e}f" -> every string it produces, sorted.
 * @param {string} s
 * @returns {string[]}
 */
function braceExpansion(s) {
  // Your code here
  return [];
}
`,
      entry: "braceExpansion",
      tests: [
        { name: "Two groups", input: ["{a,b}c{d,e}f"], expected: ["acdf", "acef", "bcdf", "bcef"] },
        { name: "No groups", input: ["abcd"], expected: ["abcd"] },
        { name: "Options come out sorted", input: ["{c,a}x"], expected: ["ax", "cx"] },
        { name: "Duplicate options collapse", input: ["{a,a}b"], expected: ["ab"] },
        { name: "Only a group", input: ["{z,y,x}"], expected: ["x", "y", "z"] },
      ],
    },
  },
  {
    slug: "nested-brace-expansion",
    title: "Nested Brace Expansion",
    category: "algorithms",
    difficulty: "hard",
    companies: ["anduril"],
    summary:
      "A three-line grammar turns nested braces into a tiny recursive-descent parser.",
    prompt: `A pattern describes a set of strings. A letter is a literal. A brace group \`{e1,e2,...}\` is the **union** of its comma-separated sub-expressions, and writing expressions next to each other is a **product** (every string from the first followed by every string from the second). Groups can nest to any depth.

Return **all distinct strings** the pattern produces, sorted.

\`\`\`
"{a,b}{c,{d,e}}"          ->  ["ac", "ad", "ae", "bc", "bd", "be"]
"{{a,z},a{b,c},{ab,z}}"   ->  ["a", "ab", "ac", "z"]
"abc"                     ->  ["abc"]
\`\`\``,
    hints: [
      "Write the grammar as a comment first: expr := term (',' term)* is a union, term := factor+ is a product, factor := letter | '{' expr '}'.",
      "Each rule becomes one small function returning a set of strings, sharing one position pointer into the pattern.",
      "Sets give deduplication for free; sort once at the end.",
    ],
    solution: `## Approach

Juggling stacks works but gets messy fast. Writing the grammar down first turns the parser into three tiny mutually recursive functions, one per rule, each returning a set of strings: an expression is a union of terms, a term is a product of factors, and a factor is a letter or a braced expression.

\`\`\`python
def brace_expansion_ii(expression):
    pos = 0
    #  expr   := term (',' term)*        -> union
    #  term   := factor+                 -> product
    #  factor := letter | '{' expr '}'
    def parse_expr():
        nonlocal pos
        result = parse_term()
        while pos < len(expression) and expression[pos] == ',':
            pos += 1
            result |= parse_term()
        return result

    def parse_term():
        nonlocal pos
        result = {''}
        while pos < len(expression) and expression[pos] not in ',}':
            f = parse_factor()
            result = {a + b for a in result for b in f}
        return result

    def parse_factor():
        nonlocal pos
        if expression[pos] == '{':
            pos += 1
            inner = parse_expr()
            pos += 1                                     # consume '}'
            return inner
        ch = expression[pos]
        pos += 1
        return {ch}

    return sorted(parse_expr())
\`\`\`

## Complexity

Output-bound: O(K · L) for K result strings of length L, plus the final sort. The output can be exponential in the number of groups — say that before coding.

## Worth saying out loud

- The grammar comment maps one-to-one onto the code, which is what keeps the parser correct under pressure.
- Sets give deduplication for free (\`{a,{a}}\` collapses); sorting once at the end beats keeping everything ordered mid-parse.
- If recursion is off the table, each rule converts mechanically to an explicit stack — say so rather than doing it.`,
    judge: {
      starterCode: `/**
 * Groups nest and commas union whole sub-expressions. Every distinct string
 * the pattern produces, sorted.
 * @param {string} expression
 * @returns {string[]}
 */
function braceExpansionNested(expression) {
  // Your code here
  return [];
}
`,
      entry: "braceExpansionNested",
      tests: [
        { name: "Nested", input: ["{a,b}{c,{d,e}}"], expected: ["ac", "ad", "ae", "bc", "bd", "be"] },
        { name: "Union with duplicates", input: ["{{a,z},a{b,c},{ab,z}}"], expected: ["a", "ab", "ac", "z"] },
        { name: "Plain string", input: ["abc"], expected: ["abc"] },
        { name: "Nested product", input: ["a{b,c}{d,e}"], expected: ["abd", "abe", "acd", "ace"] },
        { name: "Deep nesting", input: ["{a,{b,{c,d}}}x"], expected: ["ax", "bx", "cx", "dx"] },
      ],
    },
  },
  {
    slug: "transactional-kv-store",
    title: "Nested-Transaction KV Store",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "An undo log per open transaction: rollback replays it, commit hands it to the parent.",
    prompt: `Build an in-memory key-value store:

\`\`\`
get(key)      -> value or None
set(key, value)
delete(key)
begin()       -> open a transaction
commit()      -> apply the innermost open transaction
rollback()    -> discard the innermost open transaction
\`\`\`

Transactions **nest**: a \`begin\` inside a transaction opens an inner one. Reads must see uncommitted writes. Committing an inner transaction makes its writes visible to the **outer** transaction only; rolling back the outer transaction must undo them too. \`commit\` and \`rollback\` return \`true\`, or \`false\` when no transaction is open; deleting a missing key does nothing.

\`\`\`
set a 1 · begin · set a 2 · get a -> 2 · begin · delete a · get a -> None
rollback · get a -> 2 · commit · get a -> 2
\`\`\``,
    hints: [
      "Don't copy the store per transaction — record how to undo. Every write inside a transaction logs (key, previous value) once; rollback replays the log backwards.",
      "Nesting falls out of a stack of logs: begin pushes an empty log, rollback pops and replays, commit pops and appends the log onto the parent's — so the parent's rollback can still undo the child's committed writes.",
      "The alternative design is a stack of overlay dicts (get walks top-down). Know both: undo-log reads are O(1), overlay rollback is O(1) — name the trade-off you're taking.",
    ],
    solution: `## Approach

One flat dict holds the truth; each open transaction keeps an **undo log** — for every write, the key and the value it replaced (or a MISSING sentinel). \`rollback\` replays its log backwards. \`commit\` doesn't touch the data at all: the writes are already live, so it just splices its log onto the parent's, keeping the invariant that the parent can still undo everything beneath it. Reads are always O(1) against the live dict, which is the property that makes this design the interview-friendly one.

\`\`\`python
from typing import Dict, List, Optional, Tuple

class TransactionalKV:
    """Undo-log design: every write inside a txn records (key, previous value).
    rollback replays the log backwards; commit hands the log to the parent."""
    _MISSING = object()

    def __init__(self):
        self.data: Dict[str, str] = {}
        self.undo: List[List[Tuple[str, object]]] = []       # one log per open txn

    def get(self, key: str) -> Optional[str]:
        return self.data.get(key)

    def set(self, key: str, value: str) -> None:
        if self.undo:
            self.undo[-1].append((key, self.data.get(key, self._MISSING)))
        self.data[key] = value

    def delete(self, key: str) -> None:
        if key in self.data:
            if self.undo:
                self.undo[-1].append((key, self.data[key]))
            del self.data[key]

    def begin(self) -> None:
        self.undo.append([])

    def rollback(self) -> bool:
        if not self.undo:
            return False
        for key, prev in reversed(self.undo.pop()):
            if prev is self._MISSING:
                self.data.pop(key, None)
            else:
                self.data[key] = prev
        return True

    def commit(self) -> bool:
        if not self.undo:
            return False
        log = self.undo.pop()
        if self.undo:                       # nested: parent must still be able to undo us
            self.undo[-1].extend(log)
        return True
\`\`\`

## Complexity

\`get\`/\`set\`/\`delete\` O(1). \`rollback\` O(writes in that transaction); \`commit\` O(writes) to merge the log upward — or O(1) if the logs are a linked list. Space is O(total uncommitted writes).

## Worth saying out loud

- Name the alternative: a stack of **overlay dicts** where \`get\` walks from the top — O(depth) reads, O(1) rollback, O(writes) commit. The undo log flips those costs toward reads, which is usually what a store wants.
- The MISSING sentinel matters: "key didn't exist" and "key was empty-string" must roll back differently.
- \`count(value)\` follow-up → maintain a \`Counter\` updated through the same undo log. "Commit all" → loop \`commit\` until the stack empties. Durability → append-only write-ahead log, the same idea aimed at disk.`,
    judge: {
      starterCode: `class TransactionalKV {
  constructor() {
    // Your state here
  }

  /** @returns {string|null} the current value, or null */
  get(key) {
    return null;
  }

  set(key, value) {
    // Your code here
  }

  delete(key) {
    // Your code here
  }

  /** Open a (possibly nested) transaction. */
  begin() {
    // Your code here
  }

  /** @returns {boolean} false when no transaction is open */
  commit() {
    return false;
  }

  /** @returns {boolean} false when no transaction is open */
  rollback() {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let kv = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "TransactionalKV") {
      kv = new TransactionalKV();
      out.push(null);
    } else {
      out.push(kv[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            ["TransactionalKV", "set", "begin", "set", "get", "begin", "delete", "get", "rollback", "get", "commit", "get"],
            [[], ["a", "1"], [], ["a", "2"], ["a"], [], ["a"], ["a"], [], ["a"], [], ["a"]],
          ],
          expected: [null, null, null, null, "2", null, null, null, true, "2", true, "2"],
        },
        {
          name: "No open transaction",
          input: [["TransactionalKV", "commit", "rollback", "get"], [[], [], [], ["x"]]],
          expected: [null, false, false, null],
        },
        {
          name: "Outer rollback undoes a committed inner",
          input: [
            ["TransactionalKV", "begin", "set", "begin", "set", "commit", "get", "rollback", "get"],
            [[], [], ["b", "1"], [], ["b", "2"], [], ["b"], [], ["b"]],
          ],
          expected: [null, null, null, null, null, true, "2", true, null],
        },
        {
          name: "Rollback restores a deleted key",
          input: [["TransactionalKV", "set", "begin", "delete", "rollback", "get"], [[], ["k", "v"], [], ["k"], [], ["k"]]],
          expected: [null, null, null, null, true, "v"],
        },
        {
          name: "Rollback of repeated writes restores the original",
          input: [
            ["TransactionalKV", "set", "begin", "set", "set", "rollback", "get"],
            [[], ["k", "0"], [], ["k", "1"], ["k", "2"], [], ["k"]],
          ],
          expected: [null, null, null, null, null, true, "0"],
        },
        {
          name: "A top-level commit is permanent",
          input: [["TransactionalKV", "begin", "set", "commit", "rollback", "get"], [[], [], ["k", "1"], [], [], ["k"]]],
          expected: [null, null, null, true, false, "1"],
        },
        {
          name: "Deleting a missing key is harmless",
          input: [["TransactionalKV", "delete", "get", "begin", "delete", "rollback", "get"], [[], ["k"], ["k"], [], ["k"], [], ["k"]]],
          expected: [null, null, null, null, null, true, null],
        },
        {
          name: "Reads see uncommitted writes at every depth",
          input: [
            ["TransactionalKV", "begin", "set", "begin", "get", "set", "get", "rollback", "get", "rollback", "get"],
            [[], [], ["k", "1"], [], ["k"], ["k", "2"], ["k"], [], ["k"], [], ["k"]],
          ],
          expected: [null, null, null, null, "1", null, "2", true, "1", true, null],
        },
      ],
    },
  },
];
