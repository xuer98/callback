import type { Problem } from "./types";

// Anduril phone-screen bank, part C: the brace-expansion parser (with its
// reported nested follow-up) and the 30-minute nested-transaction KV store.

export const andurilProblemsC: Problem[] = [
  {
    slug: "brace-expansion",
    title: "Brace Expansion",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "A three-line grammar turns the nested follow-up into a tiny recursive-descent parser.",
    prompt: `A pattern describes a set of strings: a brace group \`{a,b}\` means "one of these characters", and everything else is a literal. Return **all strings the pattern can produce**, sorted.

\`\`\`
"{a,b}c{d,e}f"  ->  ["acdf", "acef", "bcdf", "bcef"]
"abcd"          ->  ["abcd"]
\`\`\`

## Phase 2 — nested braces

Groups can now **nest**, and a comma unions whole sub-expressions, not just single characters:

\`\`\`
"{a,b}{c,{d,e}}"  ->  ["ac", "ad", "ae", "bc", "bd", "be"]
\`\`\`

## Worth asking out loud

Is nesting allowed (it decides your whole design)? Can a comma appear at the top level? Deduplicate? Sorted output? The output is exponential in the number of groups — is there a size bound?`,
    hints: [
      "Flat version: split the pattern into groups (each brace group's sorted options, each literal as a one-item group), then build the cartesian product left to right.",
      "Nested version: write the grammar as a comment first — expr := term (',' term)* is a union, term := factor+ is a product, factor := letter | '{' expr '}' — then each rule becomes one small function returning a set.",
    ],
    solution: `## Approach

The flat version is tokenize-then-product: collect each group's choices in order and fold a cartesian product across them. The nested follow-up is where candidates sink or swim — juggling stacks works but gets messy live. Writing the grammar as a comment first turns it into three tiny mutually recursive functions, one per rule, each returning a set of strings.

\`\`\`python
from typing import List

def brace_expansion(s: str) -> List[str]:                # flat groups only
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
    return sorted(out)

def brace_expansion_ii(expression: str) -> List[str]:    # nested, recursive descent
    pos = 0
    #  expr   := term (',' term)*        -> union
    #  term   := factor+                 -> product
    #  factor := letter | '{' expr '}'
    def parse_expr() -> set:
        nonlocal pos
        result = parse_term()
        while pos < len(expression) and expression[pos] == ',':
            pos += 1
            result |= parse_term()
        return result

    def parse_term() -> set:
        nonlocal pos
        result = {''}
        while pos < len(expression) and expression[pos] not in ',}':
            f = parse_factor()
            result = {a + b for a in result for b in f}
        return result

    def parse_factor() -> set:
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

Output-bound: O(K · L) for K result strings of length L, plus the final sort. Say the exponential blow-up out loud before coding — it's a clarifying-question point, not a surprise to discover.

## Worth saying out loud

- The grammar comment **is** the deliverable: it shows the follow-up was a design change you anticipated, not a rewrite.
- Sets give deduplication for free (\`{a,{a}}\` collapses); sorting once at the end beats keeping everything ordered mid-parse.
- If the interviewer bans recursion, each rule converts mechanically to an explicit stack — say so rather than doing it.`,
    judge: {
      starterCode: `/** Flat groups only: "{a,b}c{d,e}f" -> every string it produces, sorted. */
function braceExpansion(s) {
  // Your code here
  return [];
}

/** Phase 2: groups nest and commas union whole sub-expressions. Sorted, deduplicated. */
function braceExpansionNested(expression) {
  return [];
}
`,
      entry: "__judgeBraces",
      driverCode: `function __judgeBraces(kind, s) {
  return kind === "flat" ? braceExpansion(s) : braceExpansionNested(s);
}`,
      tests: [
        { name: "Two groups", input: ["flat", "{a,b}c{d,e}f"], expected: ["acdf", "acef", "bcdf", "bcef"] },
        { name: "No groups", input: ["flat", "abcd"], expected: ["abcd"] },
        { name: "Options come out sorted", input: ["flat", "{c,a}x"], expected: ["ax", "cx"] },
        { name: "Duplicate options collapse", input: ["flat", "{a,a}b"], expected: ["ab"] },
        { name: "Nested", input: ["nested", "{a,b}{c,{d,e}}"], expected: ["ac", "ad", "ae", "bc", "bd", "be"] },
        { name: "Union with duplicates", input: ["nested", "{{a,z},a{b,c},{ab,z}}"], expected: ["a", "ab", "ac", "z"] },
        { name: "Plain string through the nested parser", input: ["nested", "abc"], expected: ["abc"] },
        { name: "Nested product", input: ["nested", "a{b,c}{d,e}"], expected: ["abd", "abe", "acd", "ace"] },
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
    prompt: `Build an in-memory key-value store — reported as a strict **30-minute** exercise:

\`\`\`
get(key)      -> value or None
set(key, value)
delete(key)
begin()       -> open a transaction
commit()      -> apply the innermost open transaction
rollback()    -> discard the innermost open transaction
\`\`\`

Transactions **nest**: a \`begin\` inside a transaction opens an inner one. Reads must see uncommitted writes. Committing an inner transaction makes its writes visible to the **outer** transaction only; rolling back the outer transaction must undo them too.

\`\`\`
set a 1 · begin · set a 2 · get a -> 2 · begin · delete a · get a -> None
rollback · get a -> 2 · commit · get a -> 2
\`\`\`

## Worth asking out loud

What do \`commit\`/\`rollback\` return with no open transaction? Must reads inside a transaction see uncommitted writes (yes)? Thread safety (assume single-threaded unless told)? Is \`delete\` of a missing key an error?`,
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
