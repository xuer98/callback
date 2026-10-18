import type { Problem } from "./types";

// Snowflake coding bank, part Y: the boolean allow/deny reading of DAG
// permissions, queries over a bounded window of recent events, and the
// prefix form of the string-command calculator. Judged in JavaScript and
// Python; the Python judges live in seed-python-snowflake-u.ts (the
// permissions) and seed-python-snowflake-v.ts (the rest).

export const snowflakeProblemsY: Problem[] = [
  {
    slug: "dag-permissions-allow-deny",
    title: "DAG Permissions III",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "Two bits flow down the DAG, allowed and denied; a node has access when it inherited an allow and no deny.",
    prompt: [
      "The nodes of a DAG are named, and edges are `[parent, child]` pairs of names. Two lists hold the access-control entries: `allow` names the nodes granted access and `deny` names the nodes refused it.",
      "",
      "Entries are inherited down every edge, and a deny anywhere on the way wins: a node has access when **no** deny applies to it or to any ancestor and **some** allow applies to it or to an ancestor. A node that inherits no decision at all is denied.",
      "",
      "Return one boolean per node, in the order of `names`. Nodes may have several parents, the graph may have several roots and disconnected parts, and duplicate edges or entries may appear.",
      "",
      "```",
      'resolvePermissions(["root", "teamA", "teamB", "service"],',
      '                   [["root", "teamA"], ["root", "teamB"], ["teamA", "service"], ["teamB", "service"]],',
      '                   ["root"], ["teamB"])',
      "  ->  [true, true, false, false]",
      "```",
      "",
      "`service` inherits root's allow through `teamA`, but `teamB`'s deny reaches it too, and a deny wins.",
    ].join("\n"),
    hints: [
      "Each node needs just two facts: did an allow reach me, did a deny reach me. Both are ORs over the parents plus the node's own entries.",
      "Process nodes in topological order so both facts are settled at every parent before a child reads them.",
    ],
    solution: [
      "## Approach",
      "",
      "Index the names, mark each node's own `allowed` and `denied` bits from the two lists, and run Kahn's algorithm: as a node leaves the queue, OR its two bits into every child. Duplicate edges only bump the in-degree and get decremented the same number of times, so they need no special handling. The answer for a node is `allowed && !denied`.",
      "",
      "## Complexity",
      "",
      "O(V + E) time and O(V) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The default matters: a node nothing reaches is denied, which falls out of starting both bits at false.",
      "- Compare with the letter versions, [DAG Permissions I](/problems/dag-letter-permissions) and [DAG Permissions II](/problems/dag-permissions-inherited-allow): same traversal, different merge rule per node.",
    ].join("\n"),
    judge: {
      solutionCode: `// Two bits per node, ORed down the DAG in topological order.
function resolvePermissions(names, edges, allow, deny) {
  const index = new Map(names.map((name, i) => [name, i]));
  const n = names.length;
  const children = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [parent, child] of edges) {
    children[index.get(parent)].push(index.get(child));
    indegree[index.get(child)]++;
  }
  const allowed = new Array(n).fill(false);
  const denied = new Array(n).fill(false);
  for (const name of allow) allowed[index.get(name)] = true;
  for (const name of deny) denied[index.get(name)] = true;
  const queue = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of children[u]) {
      allowed[v] = allowed[v] || allowed[u];
      denied[v] = denied[v] || denied[u];
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  if (queue.length !== n) throw new Error("the edges form a cycle");
  return names.map((_, i) => allowed[i] && !denied[i]);
}
`,
      starterCode: `/**
 * @param {string[]} names every node, unique
 * @param {string[][]} edges [parent, child] pairs of names; acyclic, duplicates possible
 * @param {string[]} allow nodes granted access
 * @param {string[]} deny nodes refused access
 * @returns {boolean[]} access per node, in the order of names
 */
function resolvePermissions(names, edges, allow, deny) {
  // Your code here
  return [];
}
`,
      entry: "resolvePermissions",
      tests: [
        {
          name: "Prompt example: a deny on one path wins",
          input: [
            ["root", "teamA", "teamB", "service"],
            [
              ["root", "teamA"],
              ["root", "teamB"],
              ["teamA", "service"],
              ["teamB", "service"],
            ],
            ["root"],
            ["teamB"],
          ],
          expected: [true, true, false, false],
        },
        {
          name: "Inherited grant, redundant grant, local deny",
          input: [
            ["project", "reader", "blocked"],
            [
              ["project", "reader"],
              ["project", "blocked"],
            ],
            ["project", "reader"],
            ["blocked"],
          ],
          expected: [true, true, false],
        },
        {
          name: "No decision means denied",
          input: [["lonely"], [], [], []],
          expected: [false],
        },
        {
          name: "A deny on an ancestor reaches every descendant",
          input: [
            ["a", "b", "c"],
            [
              ["a", "b"],
              ["b", "c"],
            ],
            ["c"],
            ["a"],
          ],
          expected: [false, false, false],
        },
        {
          name: "Duplicate edges and entries change nothing",
          input: [
            ["a", "b"],
            [
              ["a", "b"],
              ["a", "b"],
            ],
            ["a", "a"],
            [],
          ],
          expected: [true, true],
        },
        {
          name: "Disconnected parts resolve on their own",
          input: [
            ["x", "y", "p", "q"],
            [
              ["x", "y"],
              ["p", "q"],
            ],
            ["x"],
            ["p"],
          ],
          expected: [true, true, false, false],
        },
      ],
    },
  },
  {
    slug: "recent-event-window",
    title: "Recent Event Window Queries",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Keep the newest m events in arrival order; a query counts over the prefix whose timestamps fit, which is small because m is.",
    prompt: [
      "Events arrive with non-decreasing integer timestamps, and only the **most recent `m` additions** are retained — an add beyond that evicts the oldest. Process `operations` in order:",
      "",
      "```",
      '["add", timestamp, key]       store the event; result null',
      '["unique_before", t]          how many distinct retained keys have timestamp <= t',
      '["top_before", t]             the most frequent retained key with timestamp <= t,',
      "                              smallest key on a tie; null when none qualifies",
      "```",
      "",
      "Return the result of every operation, in order.",
      "",
      "```",
      "eventWindow(3, [",
      '  ["add", 1, "a"], ["add", 2, "b"], ["add", 3, "a"],',
      '  ["unique_before", 2], ["top_before", 3],',
      '  ["add", 4, "c"], ["unique_before", 4],',
      "])",
      '  ->  [null, null, null, 2, "a", null, 3]',
      "```",
      "",
      "Adding `c` evicts the first `a`, so the last count sees `b`, `a`, `c`. `m` is at most 5,000.",
    ].join("\n"),
    hints: [
      "The retained events are a queue: push on add, drop from the front when it holds more than m.",
      "Timestamps never decrease, so the events with timestamp <= t are a prefix of the queue — stop scanning at the first one that is too late.",
    ],
    solution: [
      "## Approach",
      "",
      "Hold the retained events in arrival order with a head pointer; an add appends and advances the head once the window exceeds `m`. Because arrivals are time-ordered, the retained events with timestamp at most `t` form a prefix, so a query scans from the head until the first timestamp past `t`, tallying keys in a map. `unique_before` is the map's size; `top_before` is the key with the largest count, breaking ties toward the smaller key, or `null` when the prefix is empty.",
      "",
      "## Complexity",
      "",
      "O(1) per add and O(m) per query, so O(ops · m) overall with `m` at most 5,000; O(m) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The bound on `m`, not on the number of events, is what makes the per-query scan acceptable; say so before reaching for anything cleverer.",
      "- Keep the tie-break and the inclusive boundary explicit in tests: two keys with equal counts, and a query exactly at an event's timestamp.",
      "- If queries always used the current time, counts could be maintained incrementally; the historical cutoff is what forces the scan.",
    ].join("\n"),
    judge: {
      solutionCode: `// The newest m events in arrival order; each query tallies the prefix that fits under t.
function eventWindow(m, operations) {
  const retained = [];
  let head = 0;
  const results = [];
  for (const op of operations) {
    if (op[0] === "add") {
      retained.push([op[1], op[2]]);
      if (retained.length - head > m) head++;
      results.push(null);
      continue;
    }
    const limit = op[1];
    const counts = new Map();
    for (let i = head; i < retained.length && retained[i][0] <= limit; i++) {
      const key = retained[i][1];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    if (op[0] === "unique_before") {
      results.push(counts.size);
      continue;
    }
    let best = null;
    for (const [key, count] of counts) {
      if (best === null || count > counts.get(best) || (count === counts.get(best) && key < best)) best = key;
    }
    results.push(best);
  }
  return results;
}
`,
      starterCode: `/**
 * @param {number} m how many of the newest additions are retained
 * @param {Array<[string, ...any[]]>} operations ["add", timestamp, key], ["unique_before", t] or ["top_before", t]
 * @returns {Array<null|number|string>} one result per operation
 */
function eventWindow(m, operations) {
  // Your code here
  return [];
}
`,
      entry: "eventWindow",
      tests: [
        {
          name: "Prompt example",
          input: [
            3,
            [
              ["add", 1, "a"],
              ["add", 2, "b"],
              ["add", 3, "a"],
              ["unique_before", 2],
              ["top_before", 3],
              ["add", 4, "c"],
              ["unique_before", 4],
            ],
          ],
          expected: [null, null, null, 2, "a", null, 3],
        },
        {
          name: "Queries over an empty window",
          input: [
            2,
            [
              ["unique_before", 0],
              ["top_before", 0],
            ],
          ],
          expected: [0, null],
        },
        {
          name: "Ties go to the smaller key",
          input: [
            5,
            [
              ["add", 1, "b"],
              ["add", 1, "a"],
              ["top_before", 1],
            ],
          ],
          expected: [null, null, "a"],
        },
        {
          name: "The boundary is inclusive",
          input: [
            5,
            [
              ["add", 10, "x"],
              ["unique_before", 9],
              ["unique_before", 10],
            ],
          ],
          expected: [null, 0, 1],
        },
        {
          name: "Eviction changes the leader",
          input: [
            2,
            [
              ["add", 1, "a"],
              ["add", 2, "a"],
              ["add", 3, "b"],
              ["top_before", 3],
              ["add", 4, "b"],
              ["top_before", 4],
            ],
          ],
          expected: [null, null, null, "a", null, "b"],
        },
        {
          name: "Later events fall outside the cutoff",
          input: [
            5,
            [
              ["add", 1, "a"],
              ["add", 5, "b"],
              ["add", 5, "b"],
              ["top_before", 4],
              ["top_before", 5],
            ],
          ],
          expected: [null, null, null, "a", "b"],
        },
      ],
    },
  },
  {
    slug: "prefix-command-calculator",
    title: "String-Command Calculator II",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "The commands become a prefix grammar: an expression is an integer or (OP expr expr), evaluated by recursive descent over the tokens.",
    prompt: [
      "The calculator from [String-Command Calculator I](/problems/string-command-calculator) now takes nested prefix expressions:",
      "",
      "```",
      "expr := integer | ( OP expr expr )",
      "```",
      "",
      "`OP` is `ADD`, `SUB`, `MULT` or `DIV`; integers may be negative; `DIV` truncates toward zero. At the top level only, a bare `OP expr` is shorthand for `(OP 0 expr)`, so the old accumulator style still works. The input is valid and never divides by zero.",
      "",
      "```",
      'evaluatePrefix("ADD (MULT 3 (ADD 2 5))")        ->  21',
      'evaluatePrefix("(SUB (MULT 2 10) (DIV 9 2))")  ->  16',
      'evaluatePrefix("7")                            ->  7',
      "```",
    ].join("\n"),
    hints: [
      "Pad the parentheses with spaces and split: every token is then a parenthesis, an operator or an integer.",
      "One recursive function reads one expression from the current token: an integer returns at once; a `(` reads the operator, two sub-expressions and the `)`.",
    ],
    solution: [
      "## Approach",
      "",
      "Tokenise by surrounding each parenthesis with spaces and splitting on whitespace. A recursive `expr()` consumes one expression from a shared cursor: an integer token is its value; an opening parenthesis is followed by the operator, two recursive calls and the closing parenthesis. The top level checks for the bare-operator shorthand, evaluating `OP 0 expr`. Truncating division is `Math.trunc(a / b)` in JavaScript and needs care in Python, whose `//` floors.",
      "",
      "## Complexity",
      "",
      "O(length) time and O(nesting depth) stack.",
      "",
      "## Worth saying out loud",
      "",
      "- Truncation toward zero is the detail that bites: `(DIV -7 2)` is `-3`, not `-4`.",
      "- Deeply nested input turns recursion into a stack overflow; an explicit stack of pending operators handles it in the same time.",
      "- Compare with the accumulator form in part I: there a parenthesised group is a sub-program evaluated from zero, here it is a plain operand.",
    ].join("\n"),
    judge: {
      solutionCode: `// Recursive descent over space-separated tokens; the top level allows the bare OP expr shorthand.
function evaluatePrefix(expression) {
  const tokens = expression.replace(/\\(/g, " ( ").replace(/\\)/g, " ) ").trim().split(/\\s+/);
  let pos = 0;
  const apply = (op, a, b) => {
    if (op === "ADD") return a + b;
    if (op === "SUB") return a - b;
    if (op === "MULT") return a * b;
    return Math.trunc(a / b);
  };
  const expr = () => {
    const token = tokens[pos++];
    if (token !== "(") return Number(token);
    const op = tokens[pos++];
    const a = expr();
    const b = expr();
    pos++;                                   // the closing parenthesis
    return apply(op, a, b);
  };
  if (/^[A-Z]+$/.test(tokens[0])) {
    const op = tokens[pos++];
    return apply(op, 0, expr());
  }
  return expr();
}
`,
      starterCode: `/**
 * @param {string} expression an integer, (OP expr expr), or a top-level OP expr shorthand
 * @returns {number} the value; DIV truncates toward zero
 */
function evaluatePrefix(expression) {
  // Your code here
  return 0;
}
`,
      entry: "evaluatePrefix",
      tests: [
        {
          name: "Prompt example: shorthand with nesting",
          input: ["ADD (MULT 3 (ADD 2 5))"],
          expected: 21,
        },
        {
          name: "Prompt example: fully parenthesised",
          input: ["(SUB (MULT 2 10) (DIV 9 2))"],
          expected: 16,
        },
        { name: "A bare integer", input: ["7"], expected: 7 },
        { name: "A negative literal", input: ["(ADD -3 5)"], expected: 2 },
        {
          name: "Division truncates toward zero",
          input: ["(DIV -7 2)"],
          expected: -3,
        },
        { name: "Shorthand with SUB negates", input: ["SUB 5"], expected: -5 },
        {
          name: "Deeper nesting on both sides",
          input: ["(MULT (ADD 1 (SUB 4 2)) (DIV (MULT 3 3) 2))"],
          expected: 12,
        },
        {
          name: "Extra spaces are fine",
          input: ["(  ADD   1   2 )"],
          expected: 3,
        },
      ],
    },
  },
];
