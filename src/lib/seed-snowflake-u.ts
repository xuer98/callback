import type { Problem } from "./types";

// Snowflake coding bank, part U: two more readings of permission inheritance
// down a DAG — allows that flow with a local disallow, and letter allows and
// denies that both flow. Judged in JavaScript and Python; the Python judges
// live in seed-python-snowflake-u.ts. The boolean allow/deny reading is in
// seed-snowflake-y.ts and the subtree-pruning questions in seed-snowflake-v.ts.

export const snowflakeProblemsU: Problem[] = [
  {
    slug: "dag-permissions-inherited-allow",
    title: "DAG Permissions II",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Allows flow down from every ancestor and a disallow stays local: OR the parents' allow sets in topological order, then subtract the node's own disallow.",
    prompt: [
      "Each node of a DAG is `[name, allow, disallow]`: a name and two strings of distinct lowercase letters. Edges are `[parent, child]` pairs of names.",
      "",
      "A letter is allowed at a node when the node itself or **any** ancestor allows it — allows flow all the way down. A disallow does not flow: it removes letters from its own node only, and the node still passes those letters on.",
      "",
      'Return `[name, letters]` for every node, sorted by name, where `letters` is the node\'s effective letters in alphabetical order (`""` when it has none).',
      "",
      "```",
      'effectiveAllow([["a", "ab", ""], ["b", "c", "b"], ["c", "", ""]], [["a", "b"], ["b", "c"]])',
      '  ->  [["a", "ab"], ["b", "ac"], ["c", "abc"]]',
      "```",
      "",
      "`b` drops its own `b` but still hands it down, so `c` ends up with `abc`.",
    ].join("\n"),
    hints: [
      "Topological order again: a node's allow set is complete once every parent's is, so OR each parent's set into the child as the parent finishes.",
      "Keep the set that flows separate from the set you report: children inherit the allows, not the result after the disallow.",
    ],
    solution: [
      "## Approach",
      "",
      "Map names to indexes and treat each letter set as a 26-bit mask. Kahn's algorithm gives an order in which every parent is finished before its child; when a parent leaves the queue, OR its accumulated allow mask into each child. A node's effective mask is its accumulated allows with its own disallow mask cleared — computed from the accumulated set, never fed back into it. Sort the rows by name at the end.",
      "",
      "## Complexity",
      "",
      "O(V + E) for the propagation with constant-time set operations, O(V log V) for the final sort; O(V) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Spell out the difference from [DAG Permissions I](/problems/dag-letter-permissions): there a child gets only what every parent's **final** state allows; here any ancestor's allow is enough and disallows never travel. The two give different answers as soon as a parent disallows something it inherited.",
      "- The test that catches a wrong model: a parent that disallows an inherited letter while its child still receives it.",
    ].join("\n"),
    judge: {
      solutionCode: `// Allows accumulate down the DAG as 26-bit masks; a disallow only edits the node's own result.
function effectiveAllow(nodes, edges) {
  const index = new Map(nodes.map(([name], i) => [name, i]));
  const n = nodes.length;
  const mask = (letters) => {
    let m = 0;
    for (const ch of letters) m |= 1 << (ch.charCodeAt(0) - 97);
    return m;
  };
  const children = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [parent, child] of edges) {
    children[index.get(parent)].push(index.get(child));
    indegree[index.get(child)]++;
  }
  const allowed = nodes.map(([, allow]) => mask(allow));
  const queue = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of children[u]) {
      allowed[v] |= allowed[u];
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  if (queue.length !== n) throw new Error("the edges form a cycle");
  const letters = (m) => {
    let out = "";
    for (let b = 0; b < 26; b++) if ((m >> b) & 1) out += String.fromCharCode(97 + b);
    return out;
  };
  return nodes
    .map(([name, , disallow], i) => [name, letters(allowed[i] & ~mask(disallow))])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}
`,
      starterCode: `/**
 * @param {Array<[string, string, string]>} nodes [name, allow, disallow]; the letters are distinct and lowercase
 * @param {string[][]} edges [parent, child] pairs of names; acyclic
 * @returns {Array<[string, string]>} [name, effective letters] for every node, sorted by name
 */
function effectiveAllow(nodes, edges) {
  // Your code here
  return [];
}
`,
      entry: "effectiveAllow",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              ["a", "ab", ""],
              ["b", "c", "b"],
              ["c", "", ""],
            ],
            [
              ["a", "b"],
              ["b", "c"],
            ],
          ],
          expected: [
            ["a", "ab"],
            ["b", "ac"],
            ["c", "abc"],
          ],
        },
        {
          name: "A diamond: the leaf unions both paths and drops only its own letter",
          input: [
            [
              ["root", "az", ""],
              ["left", "b", "z"],
              ["right", "c", ""],
              ["leaf", "d", "a"],
            ],
            [
              ["root", "left"],
              ["root", "right"],
              ["left", "leaf"],
              ["right", "leaf"],
            ],
          ],
          expected: [
            ["leaf", "bcdz"],
            ["left", "ab"],
            ["right", "acz"],
            ["root", "az"],
          ],
        },
        {
          name: "A node that disallows its own allow",
          input: [[["x", "ab", "ab"]], []],
          expected: [["x", ""]],
        },
        {
          name: "Two roots, nothing shared",
          input: [
            [
              ["p", "a", ""],
              ["q", "b", ""],
            ],
            [],
          ],
          expected: [
            ["p", "a"],
            ["q", "b"],
          ],
        },
        {
          name: "Letters come out alphabetical",
          input: [
            [
              ["m", "zy", ""],
              ["n", "ca", ""],
            ],
            [["m", "n"]],
          ],
          expected: [
            ["m", "yz"],
            ["n", "acyz"],
          ],
        },
        {
          name: "Rows are sorted by name, not input order",
          input: [
            [
              ["zeta", "z", ""],
              ["alpha", "a", ""],
            ],
            [["zeta", "alpha"]],
          ],
          expected: [
            ["alpha", "az"],
            ["zeta", "z"],
          ],
        },
      ],
    },
  },
  {
    slug: "dag-permissions-inherited-deny",
    title: "DAG Permissions IV",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Both allows and denies flow down the DAG as letter sets; a node's letters are its inherited allows minus its inherited denies.",
    prompt: [
      "A DAG has `n` nodes, `0` to `n - 1`, and `[parent, child]` edges. `allow[i]` and `deny[i]` are strings of lowercase letters: the rules set directly on node `i`.",
      "",
      "Both kinds of rule flow down to every descendant. A node's effective letters are every letter allowed on it or on any ancestor, minus every letter denied on it or on any ancestor — wherever an allow and a deny meet, the deny wins.",
      "",
      'Return each node\'s effective letters as a sorted string (`""` when it has none).',
      "",
      "```",
      'effectivePermissions(4, [[0, 1], [0, 2], [1, 3], [2, 3]], ["a", "b", "c", "d"], ["", "a", "b", ""])',
      '  ->  ["a", "b", "ac", "cd"]',
      "```",
      "",
      "Node 3 inherits the allows `a`, `b`, `c`, `d` and the denies `a`, `b`, which leaves `cd`.",
    ].join("\n"),
    hints: [
      "Two masks per node, both accumulated down the DAG with OR; the answer is one AND NOT at the end.",
      "A topological order makes every parent's masks final before any child reads them.",
    ],
    solution: [
      "## Approach",
      "",
      "Keep two 26-bit masks per node, `allowed` and `denied`, seeded from the node's own strings. Kahn's algorithm orders the nodes so parents finish first; as each parent leaves the queue, OR both of its masks into each child. The effective set is `allowed & ~denied`, rendered as letters.",
      "",
      "## Complexity",
      "",
      "O(V + E) time with constant-time set operations, O(V) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Where the deny is applied changes the answer: subtracting at every node and passing the result on would let a child re-allow a letter an ancestor denied. Here denies accumulate separately, so an ancestor's deny holds all the way down.",
      "- This is the third merge rule in the family; see [DAG Permissions I](/problems/dag-letter-permissions) and [DAG Permissions II](/problems/dag-permissions-inherited-allow).",
    ].join("\n"),
    judge: {
      solutionCode: `// Allows and denies accumulate separately down the DAG; subtract once at the end.
function effectivePermissions(n, edges, allow, deny) {
  const mask = (letters) => {
    let m = 0;
    for (const ch of letters) m |= 1 << (ch.charCodeAt(0) - 97);
    return m;
  };
  const children = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [parent, child] of edges) {
    children[parent].push(child);
    indegree[child]++;
  }
  const allowed = allow.map(mask);
  const denied = deny.map(mask);
  const queue = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of children[u]) {
      allowed[v] |= allowed[u];
      denied[v] |= denied[u];
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  if (queue.length !== n) throw new Error("the edges form a cycle");
  return allowed.map((m, i) => {
    let out = "";
    const effective = m & ~denied[i];
    for (let b = 0; b < 26; b++) if ((effective >> b) & 1) out += String.fromCharCode(97 + b);
    return out;
  });
}
`,
      starterCode: `/**
 * @param {number} n nodes 0..n-1
 * @param {number[][]} edges [parent, child] pairs; acyclic
 * @param {string[]} allow lowercase letters allowed directly on each node
 * @param {string[]} deny lowercase letters denied directly on each node
 * @returns {string[]} each node's effective letters, sorted, or ""
 */
function effectivePermissions(n, edges, allow, deny) {
  // Your code here
  return [];
}
`,
      entry: "effectivePermissions",
      tests: [
        {
          name: "One node, deny beats allow",
          input: [1, [], ["abc"], ["b"]],
          expected: ["ac"],
        },
        {
          name: "Prompt example: a diamond",
          input: [
            4,
            [
              [0, 1],
              [0, 2],
              [1, 3],
              [2, 3],
            ],
            ["a", "b", "c", "d"],
            ["", "a", "b", ""],
          ],
          expected: ["a", "b", "ac", "cd"],
        },
        {
          name: "An ancestor's deny holds all the way down",
          input: [
            3,
            [
              [0, 1],
              [1, 2],
            ],
            ["", "a", "a"],
            ["a", "", ""],
          ],
          expected: ["", "", ""],
        },
        {
          name: "Nothing denied: allows simply accumulate",
          input: [
            3,
            [
              [0, 1],
              [1, 2],
            ],
            ["c", "b", "a"],
            ["", "", ""],
          ],
          expected: ["c", "bc", "abc"],
        },
        {
          name: "Two roots, no edges",
          input: [2, [], ["z", "y"], ["", "y"]],
          expected: ["z", ""],
        },
        {
          name: "A deny on a sibling does not cross over",
          input: [
            3,
            [
              [0, 1],
              [0, 2],
            ],
            ["ab", "", ""],
            ["", "a", ""],
          ],
          expected: ["ab", "b", "ab"],
        },
      ],
    },
  },
];
