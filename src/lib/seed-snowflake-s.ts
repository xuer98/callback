import type { Problem } from "./types";

// Snowflake coding bank, part S: long-tail custom prompts — root causes from
// logs and a dependency graph, a string-command calculator with nesting, a
// distributed node count by messages, and a serialised dictionary trie.
// Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-l.ts.

export const snowflakeProblemsS: Problem[] = [
  {
    slug: "service-failure-root-cause",
    title: "Service-Failure Forensics",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A failure is explained if something it depends on, transitively, failed first; the unexplained failures are the root causes.",
    prompt: [
      "You have a list of services, dependency pairs `[a, b]` meaning `a` depends on `b`, and log lines `[time, service, status]` where status is `\"ok\"` or `\"fail\"`. Consider each service's **first** failure. It is explained when some service it depends on — directly or transitively — failed at or before that time. Return the services whose first failure is not explained, ordered by that failure time and then by name.",
      "",
      "```",
      "rootCauses([\"api\", \"db\", \"cache\"], [[\"api\", \"db\"], [\"api\", \"cache\"]],",
      "           [[1, \"db\", \"fail\"], [2, \"api\", \"fail\"], [3, \"cache\", \"ok\"]])  ->  [\"db\"]",
      "```",
    ].join("\n"),
    hints: [
      "First pass over the logs: the earliest failure time per service. Services that never failed are not suspects.",
      "For each failed service, walk its dependency closure (DFS over the dependency edges); if any dependency's first failure is at or before its own, it is explained.",
    ],
    solution: [
      "## Approach",
      "",
      "Index the logs into the first failure time of each service. For every failed service run a depth-first search along its dependency edges, collecting everything it transitively relies on; if any of those has a first failure no later than its own, the failure propagated and the service is not a root cause. Sort the survivors by failure time, then name.",
      "",
      "## Complexity",
      "",
      "O(logs + failed × (V + E)) time; O(V + E) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Clarify the time rule: a dependency that fails at the same instant counts as the cause here; a stricter version requires it to fail earlier.",
      "- Recoveries (`ok` after `fail`) and repeated failures are the natural extension — track failure intervals instead of first failures.",
    ].join("\n"),
    judge: {
      solutionCode: `function rootCauses(services, dependencies, logs) {
  const firstFail = new Map();
  for (const [time, service, status] of logs) {
    if (status === "fail" && (!firstFail.has(service) || time < firstFail.get(service))) firstFail.set(service, time);
  }
  const dependsOn = new Map(services.map((s) => [s, []]));
  for (const [a, b] of dependencies) dependsOn.get(a).push(b);
  const explained = (service) => {
    const own = firstFail.get(service);
    const seen = new Set([service]);
    const stack = [service];
    while (stack.length) {
      for (const dep of dependsOn.get(stack.pop()) ?? []) {
        if (seen.has(dep)) continue;
        seen.add(dep);
        if (firstFail.has(dep) && firstFail.get(dep) <= own) return true;
        stack.push(dep);
      }
    }
    return false;
  };
  return [...firstFail.keys()]
    .filter((s) => !explained(s))
    .sort((x, y) => firstFail.get(x) - firstFail.get(y) || (x < y ? -1 : x > y ? 1 : 0));
}
`,
      starterCode: `/**
 * @param {string[]} services
 * @param {string[][]} dependencies [a, b]: a depends on b
 * @param {[number, string, string][]} logs [time, service, "ok" | "fail"]
 * @returns {string[]} root-cause services, by first failure time then name
 */
function rootCauses(services, dependencies, logs) {
  // Your code here
  return [];
}
`,
      entry: "rootCauses",
      tests: [
        {
          name: "Prompt example",
          input: [["api", "db", "cache"], [["api", "db"], ["api", "cache"]], [[1, "db", "fail"], [2, "api", "fail"], [3, "cache", "ok"]]],
          expected: ["db"],
        },
        {
          name: "Failing before your dependencies makes you a root cause",
          input: [["web", "api", "db"], [["web", "api"], ["api", "db"]], [[5, "web", "fail"], [6, "api", "fail"], [7, "db", "fail"]]],
          expected: ["web", "api", "db"],
        },
        { name: "Ties by name", input: [["b", "a"], [], [[1, "b", "fail"], [1, "a", "fail"]]], expected: ["a", "b"] },
        { name: "No failures", input: [["a"], [], [[1, "a", "ok"]]], expected: [] },
        {
          name: "Transitive dependency explains it",
          input: [["a", "b", "c"], [["a", "b"], ["b", "c"]], [[1, "c", "fail"], [2, "a", "fail"]]],
          expected: ["c"],
        },
        {
          name: "First failure is what counts",
          input: [["a", "b"], [["a", "b"]], [[1, "a", "fail"], [2, "b", "fail"], [3, "a", "fail"]]],
          expected: ["a", "b"],
        },
      ],
    },
  },
  {
    slug: "string-command-calculator",
    title: "String-Command Calculator",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A recursive-descent parser: a command's operand is either an integer or a parenthesised sub-program evaluated from zero.",
    prompt: [
      "A program is a string of commands separated by `;`: `ADD x`, `SUB x` or `MULT x`, applied in order to an accumulator that starts at `0`. The operand `x` is an integer (possibly negative) or a parenthesised sub-program, which is evaluated from `0` with the same rules. Sub-programs may nest. Whitespace around tokens is allowed. Return the final value.",
      "",
      "```",
      "evaluateCommands(\"ADD 2; MULT 3\")                  ->  6",
      "evaluateCommands(\"ADD 2; MULT (ADD 3; MULT 2)\")    ->  12",
      "evaluateCommands(\"ADD 10; SUB (ADD 2; ADD 3)\")     ->  5",
      "```",
    ].join("\n"),
    hints: [
      "Write `parseProgram(pos)` that reads commands until a `)` or the end and returns the value plus the position reached.",
      "An operand starting with `(` recurses into `parseProgram`; otherwise read an optional sign and digits.",
    ],
    solution: [
      "## Approach",
      "",
      "Recursive descent over the string with a shared cursor. A program is a sequence of commands separated by semicolons and terminated by a closing parenthesis or the end of input; each command is a keyword, whitespace, and an operand. If the operand begins with `(`, recurse to evaluate the sub-program and consume its `)`; otherwise parse an integer. Apply the command to the accumulator and continue.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(nesting depth) stack.",
      "",
      "## Worth saying out loud",
      "",
      "- The sub-program starts from zero, so `MULT (ADD 3)` multiplies by 3 — say the rule before coding, since the other reading (sub-program starts from the current accumulator) is also plausible.",
      "- Unknown commands, missing operands and unbalanced parentheses should raise; the parser's structure makes each check one line.",
      "- The same shape handles [Basic Calculator](/problems/basic-calculator) and the [SnowCal Interpreter](/problems/snowcal-interpreter).",
    ].join("\n"),
    judge: {
      solutionCode: `function evaluateCommands(program) {
  let pos = 0;
  const skipSpaces = () => {
    while (pos < program.length && program[pos] === " ") pos++;
  };
  const parseOperand = () => {
    skipSpaces();
    if (program[pos] === "(") {
      pos++;
      const value = parseProgram();
      if (program[pos] !== ")") throw new Error("expected )");
      pos++;
      return value;
    }
    let sign = 1;
    if (program[pos] === "-") {
      sign = -1;
      pos++;
    }
    let value = 0;
    if (!(program[pos] >= "0" && program[pos] <= "9")) throw new Error("expected a number at " + pos);
    while (pos < program.length && program[pos] >= "0" && program[pos] <= "9") value = value * 10 + (program.charCodeAt(pos++) - 48);
    return sign * value;
  };
  const parseProgram = () => {
    let acc = 0;
    for (;;) {
      skipSpaces();
      if (pos >= program.length || program[pos] === ")") return acc;
      let word = "";
      while (pos < program.length && program[pos] >= "A" && program[pos] <= "Z") word += program[pos++];
      const x = parseOperand();
      if (word === "ADD") acc += x;
      else if (word === "SUB") acc -= x;
      else if (word === "MULT") acc *= x;
      else throw new Error("unknown command " + word);
      skipSpaces();
      if (program[pos] === ";") pos++;
    }
  };
  const result = parseProgram();
  if (pos !== program.length) throw new Error("unexpected ) at " + pos);
  return result;
}
`,
      starterCode: `/**
 * @param {string} program e.g. "ADD 2; MULT (ADD 3; MULT 2)"
 * @returns {number} the accumulator's final value
 */
function evaluateCommands(program) {
  // Your code here
  return 0;
}
`,
      entry: "evaluateCommands",
      tests: [
        { name: "Flat commands", input: ["ADD 2; MULT 3"], expected: 6 },
        { name: "A nested sub-program", input: ["ADD 2; MULT (ADD 3; MULT 2)"], expected: 12 },
        { name: "Subtracting a group", input: ["ADD 10; SUB (ADD 2; ADD 3)"], expected: 5 },
        { name: "Two levels of nesting", input: ["ADD (ADD 1; ADD (ADD 2; MULT 5)); SUB 1"], expected: 10 },
        { name: "Multiplying zero", input: ["MULT 5"], expected: 0 },
        { name: "Negative operands", input: ["ADD -3; MULT -2"], expected: 6 },
        { name: "Extra whitespace", input: ["  ADD   4 ;MULT( ADD 2 ) "], expected: 8 },
      ],
    },
  },
  {
    slug: "count-nodes-by-messages",
    title: "Count the Nodes of a Tree by Messages",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "A node asks every neighbour except the one that asked it, sums the replies plus one, and remembers answers so duplicates are harmless.",
    prompt: [
      "Every node of a tree is a separate machine that can message only its neighbours, asynchronously. Write the per-node logic as a class `TreeNode(id, neighbors, send)`, where `send(from, to, kind, requestId, count)` delivers a message later — possibly out of order, possibly **twice**. Two message kinds exist: `\"REQUEST\"` and `\"REPLY\"`.",
      "",
      "- `startCount(requestId)` begins a count at this node.",
      "- `receive(sender, kind, requestId, count)` is called for every delivered message.",
      "- When the count completes, the node that started it sets `this.result` to the number of nodes in the tree.",
      "",
      "The grader runs the simulation with a scrambled delivery order and duplicated messages and reads `result` on the starting node.",
    ].join("\n"),
    hints: [
      "On a request, ask every neighbour except the sender and remember who you are waiting for; a leaf replies at once with 1. When the last awaited reply arrives, reply to whoever asked you with 1 plus the sum.",
      "Duplicates: ignore a reply from a neighbour you are no longer waiting for; ignore a repeated request while you are working on it; answer a repeated request again from a cache once you have finished.",
    ],
    solution: [
      "## Approach",
      "",
      "Treat the first node to send a request as the temporary parent, so any node can start. On a request, the node records the set of neighbours it is awaiting (all but the sender) and a running total of 1, and forwards the request; a node with nothing to await finishes immediately. On a reply from an awaited neighbour, remove it from the set and add the count; when the set empties, the node is done: it caches the total, replies to its parent, or — if it started the count — stores the result. The cache answers repeated requests after completion, the awaited set drops repeated replies, and a request repeated mid-count is ignored, which together make duplicated and reordered delivery safe.",
      "",
      "## Complexity",
      "",
      "2(n − 1) messages without duplicates; time proportional to the tree's depth with parallel delivery.",
      "",
      "## Worth saying out loud",
      "",
      "- Lost messages are the third part of the question: an outbox that resends with backoff until an acknowledgement arrives, with the receiver acknowledging every copy and processing the first — the duplicate handling above absorbs the resends.",
      "- What the lock protects in a threaded version: the pending and done maps, never the send call.",
      "- The design-round version is [Count the Nodes in a Tree of Servers](/problems/design-count-nodes-in-server-tree).",
    ].join("\n"),
    judge: {
      solutionCode: `class TreeNode {
  constructor(id, neighbors, send) {
    this.id = id;
    this.neighbors = new Set(neighbors);
    this.send = send;
    this.pending = new Map();   // requestId -> { awaiting, total, replyTo }
    this.done = new Map();      // requestId -> total
    this.result = null;
  }

  startCount(requestId) {
    this.receive(null, "REQUEST", requestId, 0);
  }

  receive(sender, kind, requestId, count) {
    if (kind === "REQUEST") this.onRequest(sender, requestId);
    else this.onReply(sender, requestId, count);
  }

  onRequest(sender, requestId) {
    if (this.done.has(requestId)) {
      if (sender !== null) this.send(this.id, sender, "REPLY", requestId, this.done.get(requestId));
      return;
    }
    if (this.pending.has(requestId)) return;
    const toAsk = [...this.neighbors].filter((n) => n !== sender);
    if (toAsk.length === 0) {
      this.finish(requestId, 1, sender);
      return;
    }
    this.pending.set(requestId, { awaiting: new Set(toAsk), total: 1, replyTo: sender });
    for (const n of toAsk) this.send(this.id, n, "REQUEST", requestId, 0);
  }

  onReply(sender, requestId, count) {
    const state = this.pending.get(requestId);
    if (!state || !state.awaiting.has(sender)) return;
    state.awaiting.delete(sender);
    state.total += count;
    if (state.awaiting.size > 0) return;
    this.pending.delete(requestId);
    this.finish(requestId, state.total, state.replyTo);
  }

  finish(requestId, total, replyTo) {
    this.done.set(requestId, total);
    if (replyTo === null) this.result = total;
    else this.send(this.id, replyTo, "REPLY", requestId, total);
  }
}
`,
      starterCode: `class TreeNode {
  /**
   * @param {number} id this node
   * @param {number[]} neighbors parent and children, unordered
   * @param {(from: number, to: number, kind: "REQUEST" | "REPLY", requestId: string, count: number) => void} send
   */
  constructor(id, neighbors, send) {
    this.id = id;
    this.neighbors = neighbors;
    this.send = send;
    this.result = null;   // set on the starting node when the count completes
  }

  /** @param {string} requestId */
  startCount(requestId) {}

  /**
   * @param {number | null} sender null when this node started the count
   * @param {"REQUEST" | "REPLY"} kind
   * @param {string} requestId
   * @param {number} count the subtree total carried by a REPLY
   */
  receive(sender, kind, requestId, count) {}
}
`,
      entry: "__judgeCount",
      driverCode: `function __judgeCount(neighbors, start, duplicateEvery, seed) {
  const queue = [];
  let sent = 0;
  const send = (from, to, kind, requestId, count) => {
    sent++;
    queue.push([from, to, kind, requestId, count ?? 0]);
    if (duplicateEvery && sent % duplicateEvery === 0) queue.push([from, to, kind, requestId, count ?? 0]);
  };
  const nodes = neighbors.map((nb, id) => new TreeNode(id, nb, send));
  nodes[start].startCount("req-1");
  let state = seed;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
  let delivered = 0;
  while (queue.length) {
    const [from, to, kind, requestId, count] = queue.splice(rand() % queue.length, 1)[0];
    nodes[to].receive(from, kind, requestId, count);
    if (++delivered > 100000) return "too many messages";
  }
  return nodes[start].result;
}`,
      tests: [
        { name: "A chain from one end", input: [[[1], [0, 2], [1, 3], [2]], 0, 0, 1], expected: 4 },
        { name: "A star started from a leaf, every second message duplicated", input: [[[1, 2, 3], [0], [0], [0]], 1, 2, 7], expected: 4 },
        { name: "Seven nodes started mid-tree", input: [[[1, 2], [0, 3, 4], [0, 5], [1], [1, 6], [2], [4]], 3, 3, 42], expected: 7 },
        { name: "Every message duplicated", input: [[[1, 2], [0, 3, 4], [0, 5], [1], [1, 6], [2], [4]], 0, 1, 5], expected: 7 },
        { name: "A single node", input: [[[]], 0, 0, 3], expected: 1 },
      ],
    },
  },
  {
    slug: "serialize-dictionary-trie",
    title: "Serialize a Dictionary Trie",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Pre-order with explicit end-of-word marks and parentheses around children; parsing it back is a recursive descent.",
    prompt: [
      "Build a trie from a list of words and serialise it: write each node's children in alphabetical order, each as its letter, then `*` if a word ends there, then its own children wrapped in parentheses when it has any. The root's children are written without a wrapper. Then write the inverse: `deserializeTrie(s)` returns an object with `contains(word)`.",
      "",
      "```",
      "serializeTrie([\"app\", \"apple\", \"bat\"])  ->  \"a(p(p*(l(e*))))b(a(t*))\"",
      "serializeTrie([\"to\", \"tea\", \"ted\"])     ->  \"t(e(a*d*)o*)\"",
      "serializeTrie([\"a\", \"ab\"])              ->  \"a*(b*)\"",
      "```",
    ].join("\n"),
    hints: [
      "Serialising is a pre-order walk that sorts each node's children; the grammar is child := letter '*'? ( '(' children ')' )?.",
      "Deserialising is a recursive parser with a cursor: read a letter, an optional star, and if the next character is `(` parse the children until the matching `)`.",
    ],
    solution: [
      "## Approach",
      "",
      "Insert the words into a trie of maps with an end flag per node. To serialise, recurse from the root: for each child in sorted order emit its letter, a star when it ends a word, and, if it has children, their serialisation in parentheses. To deserialise, walk the string with an index: each letter starts a child, a following star sets its flag, and a following parenthesis recurses into its children; the matching `)` returns to the parent. Membership is the usual trie walk ending on a flagged node.",
      "",
      "## Complexity",
      "",
      "O(total characters) for both directions, plus the sort per node.",
      "",
      "## Worth saying out loud",
      "",
      "- Sorting children makes the output canonical: two tries with the same words serialise identically, which is what makes this testable and diffable.",
      "- A compressed (radix) trie stores runs of single-child nodes as one edge; the format extends by writing the whole run instead of one letter.",
    ].join("\n"),
    judge: {
      solutionCode: `function buildTrie(words) {
  const root = { children: new Map(), end: false };
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false });
      node = node.children.get(ch);
    }
    node.end = true;
  }
  return root;
}

function serializeTrie(words) {
  const write = (node) =>
    [...node.children.keys()]
      .sort()
      .map((ch) => {
        const child = node.children.get(ch);
        return ch + (child.end ? "*" : "") + (child.children.size ? "(" + write(child) + ")" : "");
      })
      .join("");
  return write(buildTrie(words));
}

function deserializeTrie(s) {
  let pos = 0;
  const parseChildren = (parent) => {
    while (pos < s.length && s[pos] !== ")") {
      const child = { children: new Map(), end: false };
      parent.children.set(s[pos++], child);
      if (s[pos] === "*") {
        child.end = true;
        pos++;
      }
      if (s[pos] === "(") {
        pos++;
        parseChildren(child);
        pos++;   // the matching ")"
      }
    }
  };
  const root = { children: new Map(), end: false };
  parseChildren(root);
  return {
    contains(word) {
      let node = root;
      for (const ch of word) {
        node = node.children.get(ch);
        if (!node) return false;
      }
      return node.end;
    },
  };
}
`,
      starterCode: `/**
 * @param {string[]} words
 * @returns {string} the trie in the format from the prompt
 */
function serializeTrie(words) {
  // Your code here
  return "";
}

/**
 * @param {string} s a string produced by serializeTrie
 * @returns {{ contains(word: string): boolean }}
 */
function deserializeTrie(s) {
  // Your code here
  return { contains: () => false };
}
`,
      entry: "__judgeTrie",
      driverCode: `function __judgeTrie(kind, words, queries) {
  if (kind === "serialize") return serializeTrie(words);
  const trie = deserializeTrie(serializeTrie(words));
  return queries.map((q) => trie.contains(q));
}`,
      tests: [
        { name: "Prompt example", input: ["serialize", ["app", "apple", "bat"], []], expected: "a(p(p*(l(e*))))b(a(t*))" },
        { name: "Siblings and a word at a branch", input: ["serialize", ["to", "tea", "ted"], []], expected: "t(e(a*d*)o*)" },
        { name: "A word that is a prefix of another", input: ["serialize", ["a", "ab"], []], expected: "a*(b*)" },
        { name: "No words", input: ["serialize", [], []], expected: "" },
        { name: "Children are sorted regardless of insertion order", input: ["serialize", ["cat", "car", "bat"], []], expected: "b(a(t*))c(a(r*t*))" },
        { name: "Round trip", input: ["roundTrip", ["app", "apple", "bat"], ["app", "apple", "appl", "bat", "ba", "cat", ""]], expected: [true, true, false, true, false, false, false] },
        { name: "Round trip with a prefix word", input: ["roundTrip", ["a", "ab", "abc"], ["a", "ab", "abc", "abcd", "b"]], expected: [true, true, true, false, false] },
      ],
    },
  },
];
