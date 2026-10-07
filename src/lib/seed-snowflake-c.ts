import type { Problem } from "./types";

// Snowflake coding bank, part C: the deletion set that caps a tree's height,
// letter permissions flowing down a DAG, and the first of the wiki-page BFS
// problems. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-a.ts and, for the wiki pages, seed-python-snowflake-f.ts.

/**
 * A page-link fetcher over an adjacency object that refuses to serve the same
 * page twice: a crawler that forgets what it has seen fails loudly instead of
 * looping. Shared by the wiki-page drivers here and in part D.
 */
export const LINK_FETCHER = `function __linkFetcher(graph) {
  const fetched = new Set();
  return function getLinkedPages(uri) {
    if (fetched.has(uri)) throw new Error("fetched " + uri + " twice: remember the pages you have seen");
    fetched.add(uri);
    return (graph[uri] || []).slice();
  };
}`;

export const snowflakeProblemsC: Problem[] = [
  {
    slug: "fewest-deletions-for-height",
    title: "Fewest Deletions for a Height Limit",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Delete exactly the non-root nodes whose own subtree is k or more deep — one post-order pass, no DP.",
    prompt: [
      "A rooted tree is given as `[parent, child]` edges plus its `root`. Deleting a node promotes its children to its nearest surviving ancestor, as in [Tree Height After Deleting Nodes](/problems/height-after-deleting-nodes). Height is counted in nodes.",
      "",
      "Return a **smallest** set of non-root nodes whose deletion brings the height down to at most `k` (`k ≥ 1`). Any smallest set is accepted; return an empty list if the tree is already short enough.",
      "",
      "```",
      "edges = [[1, 2], [1, 3], [3, 4], [3, 5], [5, 6]], root = 1   // height 4",
      "fewestDeletions(edges, 1, 2)  ->  [3, 5]      // leaves 1 -> {2, 4, 6}",
      "fewestDeletions(edges, 1, 4)  ->  []",
      "```",
    ].join("\n"),
    hints: [
      "Compute each node's own height h[u] — the node-count height of its subtree in the original tree — with one post-order pass.",
      "Delete every non-root node with h[u] ≥ k. Along any root-to-leaf path h strictly decreases, so the survivors below the root have distinct values in 1..k-1: at most k-1 of them, which is a height of at most k.",
      "No smaller set works: a node taller than its remaining budget always has a descendant exactly at the budget, so deleting it never costs more than keeping it. The tree DP collapses to this count.",
    ],
    solution: [
      "## Approach",
      "",
      "Let `h[u]` be the height of `u`'s subtree in the original tree, in nodes. Delete every non-root node with `h[u] ≥ k`. It is enough: `h` strictly decreases down any path, so the surviving nodes below the root along one path have distinct heights in `1..k-1`, at most `k-1` of them, plus the root — height at most `k`. It is minimal: in the tree DP that keeps or deletes each node against the depth budget below it, a node taller than its budget always has a descendant exactly at that budget, so deleting the node never costs more than keeping it, and the DP collapses to this count. One post-order pass computes the heights; the answer is the nodes that fail the test.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Clarify three things first: height in nodes or edges, whether the root may go, and whether the count or the set is wanted. The rule picks the shallowest minimum set; a version that prefers deeper deletions needs the DP with a depth tie-break.",
      "- Check the claim on a tree you can enumerate by hand: a root with two leaves and `k = 1` needs both leaves gone; a chain `1-2-{3,4}` and `k = 2` needs only node 2.",
      "- Tests: a lone root, a chain, `k` at least the current height (nothing to delete), a wide shallow tree.",
    ].join("\n"),
    judge: {
      solutionCode: `// h[u] = node-count height of u's subtree. Deleting every non-root node with
// h[u] >= k caps the height at k, and no smaller set does.
function fewestDeletions(edges, root, k) {
  const children = new Map();
  for (const [parent, child] of edges) {
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(child);
  }
  const order = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    order.push(node);
    for (const child of children.get(node) ?? []) stack.push(child);
  }
  const height = new Map();
  for (let i = order.length - 1; i >= 0; i--) {   // children before parents
    const node = order[i];
    let tallest = 0;
    for (const child of children.get(node) ?? []) tallest = Math.max(tallest, height.get(child));
    height.set(node, tallest + 1);
  }
  return order.filter((node) => node !== root && height.get(node) >= k);
}
`,
      starterCode: `/**
 * @param {number[][]} edges [parent, child] pairs of a rooted tree
 * @param {number} root
 * @param {number} k the height limit, in nodes (k >= 1)
 * @returns {number[]} a smallest set of non-root nodes to delete
 */
function fewestDeletions(edges, root, k) {
  // Your code here
  return [];
}
`,
      entry: "__judgeDeletions",
      // Several smallest sets can exist, so the driver applies the returned
      // one and compares its size with the optimum.
      driverCode: `function __judgeDeletions(edges, root, k) {
  const children = new Map();
  const nodes = new Set([root]);
  for (const [parent, child] of edges) {
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(child);
    nodes.add(parent);
    nodes.add(child);
  }
  const order = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    order.push(node);
    for (const child of children.get(node) ?? []) stack.push(child);
  }
  const height = new Map();
  for (let i = order.length - 1; i >= 0; i--) {
    let tallest = 0;
    for (const child of children.get(order[i]) ?? []) tallest = Math.max(tallest, height.get(child));
    height.set(order[i], tallest + 1);
  }
  const optimum = order.filter((node) => node !== root && height.get(node) >= k).length;
  const result = fewestDeletions(edges, root, k);
  if (!Array.isArray(result)) return "expected a list of node ids";
  const deleted = new Set(result);
  if (deleted.size !== result.length) return "a node is listed twice";
  if (deleted.has(root)) return "the root may not be deleted";
  for (const node of deleted) if (!nodes.has(node)) return "unknown node " + node;
  let after = 0;
  const walk = [[root, 0]];
  while (walk.length > 0) {
    const [node, above] = walk.pop();
    const depth = above + (deleted.has(node) ? 0 : 1);
    if (depth > after) after = depth;
    for (const child of children.get(node) ?? []) walk.push([child, depth]);
  }
  if (after > k) return "height " + after + " is still above " + k;
  if (deleted.size > optimum) return "deleted " + deleted.size + ", but " + optimum + " suffice";
  return "deleted " + deleted.size + ", height " + after;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            2,
          ],
          expected: "deleted 2, height 2",
        },
        {
          name: "Already short enough",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            4,
          ],
          expected: "deleted 0, height 4",
        },
        {
          name: "One node shorter",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            3,
          ],
          expected: "deleted 1, height 3",
        },
        {
          name: "Down to the root",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            1,
          ],
          expected: "deleted 5, height 1",
        },
        {
          name: "A root with two leaves",
          input: [
            [
              [1, 2],
              [1, 3],
            ],
            1,
            1,
          ],
          expected: "deleted 2, height 1",
        },
        {
          name: "A chain with a fork",
          input: [
            [
              [1, 2],
              [2, 3],
              [2, 4],
            ],
            1,
            2,
          ],
          expected: "deleted 1, height 2",
        },
        { name: "A lone root", input: [[], 1, 1], expected: "deleted 0, height 1" },
        {
          name: "A long chain",
          input: [
            [
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
              [5, 6],
            ],
            1,
            3,
          ],
          expected: "deleted 3, height 3",
        },
      ],
    },
  },
  {
    slug: "dag-letter-permissions",
    title: "Letter Permissions Down a DAG",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Topological order with a 26-bit mask per node: inherited = AND of the parents, final = (inherited OR allow) AND NOT disallow.",
    prompt: [
      "A DAG has `n` nodes, `0` to `n - 1`, and directed `[parent, child]` edges. Each node has an `allow` string and a `disallow` string of capital letters `A`–`Z`. Permissions flow downward:",
      "",
      "- A source (no parents) inherits nothing.",
      "- Any other node inherits a letter only if **every** parent's final state allows it.",
      "- A node's final state is its inherited letters plus its own `allow`, minus its own `disallow`.",
      "",
      'Return each node\'s final allowed letters as a string in alphabetical order, or `"-"` when it allows nothing.',
      "",
      "```",
      'finalAllowed(3, [[0, 1], [1, 2]], ["A", "", "C"], ["", "B", ""])  ->  ["A", "A", "AC"]',
      'finalAllowed(3, [[0, 2], [1, 2]], ["AB", "A", ""], ["", "", ""])    ->  ["AB", "A", "A"]',
      "```",
    ].join("\n"),
    hints: [
      "Represent a letter set as a 26-bit mask; union, intersection and difference become OR, AND and AND NOT.",
      "Process nodes in topological order so every parent's final mask exists before a child needs it. Start each non-source at the all-ones mask and AND each parent's final into it.",
    ],
    solution: [
      "## Approach",
      "",
      "A letter set fits in a 26-bit mask, so the three rules are bit operations: `inherited = AND` over parents' finals (starting from all ones, the identity for AND, and from zero for a source), then `final = (inherited | allow) & ~disallow`. Kahn's algorithm supplies the topological order and the moment a node's parents are all finished; when a node leaves the queue, AND its final into each child's inherited mask. Finally print each mask as letters.",
      "",
      "## Complexity",
      "",
      "O(V + E) time with constant-time set operations; O(V) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The one clarification that matters: whether a child inherits each parent's **final** state (this version) or the parents' allow and disallow sets propagate separately. They differ as soon as a parent disallows something it inherited.",
      "- Keep a two-parent test ready: parents allowing `AB` and `A` give a child only `A`.",
      "- A cycle makes the rules undefined; a short queue at the end detects one.",
    ].join("\n"),
    judge: {
      solutionCode: `// Letter sets as 26-bit masks, resolved in topological order.
function finalAllowed(n, edges, allow, disallow) {
  const ALL = (1 << 26) - 1;
  const mask = (letters) => {
    let m = 0;
    for (const ch of letters) m |= 1 << (ch.charCodeAt(0) - 65);
    return m;
  };
  const children = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [parent, child] of edges) {
    children[parent].push(child);
    indegree[child]++;
  }
  const inherited = new Array(n).fill(ALL);       // identity for AND
  const final = new Array(n).fill(0);
  const queue = [];
  for (let i = 0; i < n; i++) {
    if (indegree[i] === 0) {
      inherited[i] = 0;                            // sources inherit nothing
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    final[u] = (inherited[u] | mask(allow[u])) & ~mask(disallow[u]);
    for (const v of children[u]) {
      inherited[v] &= final[u];
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  if (queue.length !== n) throw new Error("the edges form a cycle");
  return final.map((m) => {
    let letters = "";
    for (let b = 0; b < 26; b++) if ((m >> b) & 1) letters += String.fromCharCode(65 + b);
    return letters || "-";
  });
}
`,
      starterCode: `/**
 * @param {number} n nodes 0..n-1
 * @param {number[][]} edges [parent, child] pairs; acyclic
 * @param {string[]} allow capital letters each node allows
 * @param {string[]} disallow capital letters each node disallows
 * @returns {string[]} each node's final letters in alphabetical order, or "-"
 */
function finalAllowed(n, edges, allow, disallow) {
  // Your code here
  return [];
}
`,
      entry: "finalAllowed",
      tests: [
        {
          name: "A chain",
          input: [
            3,
            [
              [0, 1],
              [1, 2],
            ],
            ["A", "", "C"],
            ["", "B", ""],
          ],
          expected: ["A", "A", "AC"],
        },
        {
          name: "Two parents: only what both allow",
          input: [
            3,
            [
              [0, 2],
              [1, 2],
            ],
            ["AB", "A", ""],
            ["", "", ""],
          ],
          expected: ["AB", "A", "A"],
        },
        { name: "Disallow removes an inherited letter", input: [2, [[0, 1]], ["AB", ""], ["", "A"]], expected: ["AB", "B"] },
        { name: "Disallow beats allow on the same node", input: [1, [], ["A"], ["A"]], expected: ["-"] },
        {
          name: "A diamond",
          input: [
            4,
            [
              [0, 1],
              [0, 2],
              [1, 3],
              [2, 3],
            ],
            ["ABC", "", "", ""],
            ["", "A", "B", ""],
          ],
          expected: ["ABC", "BC", "AC", "C"],
        },
        { name: "Letters come out sorted", input: [1, [], ["CBA"], [""]], expected: ["ABC"] },
        { name: "Nothing anywhere", input: [2, [[0, 1]], ["", ""], ["", ""]], expected: ["-", "-"] },
        { name: "A child adds its own letters", input: [2, [[0, 1]], ["A", "Z"], ["", ""]], expected: ["A", "AZ"] },
      ],
    },
  },
  {
    slug: "fewest-clicks-between-pages",
    title: "Fewest Clicks Between Wiki Pages",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "BFS over an implicit graph, fetching each page exactly once.",
    prompt: [
      "You are given `getLinkedPages(uri)`, which fetches a wiki page and returns the URIs it links to. Return the fewest clicks needed to get from `start` to `target`, or `-1` if `target` cannot be reached. Going from a page to itself takes 0 clicks.",
      "",
      "```",
      "// A -> B, A -> C, B -> D, C -> D",
      'fewestClicks("A", "D", getLinkedPages)  ->  2',
      'fewestClicks("D", "A", getLinkedPages)  ->  -1',
      "```",
      "",
      "Fetching is expensive: the harness fails a run that fetches the same page twice. The harness's fetcher returns an empty list for pages it knows nothing about.",
    ].join("\n"),
    hints: [
      "Breadth-first search over an implicit graph: the queue holds pages, and expanding a page is one fetch. Visiting in BFS order means the first time you see the target is along a shortest path.",
      "Record a page as seen when it is first discovered — before it is fetched — so two parents cannot both enqueue it.",
    ],
    solution: [
      "## Approach",
      "",
      "A standard BFS where the neighbour list is a fetch. Keep a seen set and a frontier; expand the frontier one level at a time, counting levels as clicks. Mark pages as seen when they are discovered, not when they are fetched, so each page enters the queue once and is fetched at most once; check for the target on discovery, which saves fetching it at all.",
      "",
      "## Complexity",
      "",
      "O(V + E) time with one fetch per reachable page; O(V) space for the seen set and queue.",
      "",
      "## Worth saying out loud",
      "",
      "- Why BFS and not DFS: BFS discovers pages in order of click count, so the first hit is the shortest route; DFS finds *a* route and would need to search everything to prove it the shortest.",
      "- A real `getLinkedPages` fails and throttles: retry with backoff, cap how many fetches are in flight, and cache responses so a retry after a crash does not refetch.",
      "- The path itself is [Click Path Between Wiki Pages](/problems/click-path-between-pages); visiting every reachable page is [Crawl Every Reachable Page](/problems/crawl-reachable-pages). With several worker threads, the seen-set check-and-add must be atomic and termination must wait for in-flight fetches, not only for an empty queue.",
    ].join("\n"),
    judge: {
      solutionCode: `// BFS over the pages, one fetch per page.
function fewestClicks(start, target, getLinkedPages) {
  if (start === target) return 0;
  const seen = new Set([start]);
  let frontier = [start];
  for (let clicks = 1; frontier.length > 0; clicks++) {
    const next = [];
    for (const page of frontier) {
      for (const link of getLinkedPages(page)) {
        if (seen.has(link)) continue;
        if (link === target) return clicks;
        seen.add(link);
        next.push(link);
      }
    }
    frontier = next;
  }
  return -1;
}
`,
      starterCode: `/**
 * @param {string} start
 * @param {string} target
 * @param {(uri: string) => string[]} getLinkedPages fetches a page and returns the pages it links to
 * @returns {number} fewest clicks from start to target, or -1
 */
function fewestClicks(start, target, getLinkedPages) {
  // Your code here
  return -1;
}
`,
      entry: "__judgeClicks",
      driverCode: `${LINK_FETCHER}
function __judgeClicks(graph, start, target) {
  return fewestClicks(start, target, __linkFetcher(graph));
}`,
      tests: [
        { name: "Prompt example", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "A", "D"], expected: 2 },
        { name: "No way back", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "D", "A"], expected: -1 },
        { name: "Same page", input: [{ A: ["B"], B: [] }, "A", "A"], expected: 0 },
        { name: "One click", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "A", "B"], expected: 1 },
        { name: "A cycle must not loop", input: [{ A: ["B"], B: ["A", "C"], C: ["A"] }, "A", "C"], expected: 2 },
        { name: "Around the cycle", input: [{ A: ["B"], B: ["A", "C"], C: ["A"] }, "C", "B"], expected: 2 },
        { name: "A dangling link leads nowhere", input: [{ A: ["B"] }, "A", "C"], expected: -1 },
        {
          name: "A long chain",
          input: [
            {
              P0: ["P1"],
              P1: ["P2"],
              P2: ["P3"],
              P3: ["P4"],
              P4: ["P5"],
              P5: [],
            },
            "P0",
            "P5",
          ],
          expected: 5,
        },
      ],
    },
  },
];
