import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part B: graphs — a tree check, keys
// and rooms, stones sharing rows and columns, parallel courses with a
// per-semester cap, campus bikes, and the most profitable path in a tree.
// Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-g.ts.

export const snowflakeLcProblemsB: Problem[] = [
  {
    slug: "graph-valid-tree",
    title: "Graph Valid Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A tree on n nodes has exactly n − 1 edges and no cycle; union-find checks the second condition in one pass.",
    prompt: [
      "Given `n` nodes labelled `0` to `n - 1` and a list of undirected edges, return whether the edges form a valid tree: connected and acyclic.",
      "",
      "```",
      "validTree(5, [[0, 1], [0, 2], [0, 3], [1, 4]])          ->  true",
      "validTree(5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]])  ->  false   // 1-2-3 is a cycle",
      "```",
    ].join("\n"),
    hints: [
      "A tree has exactly n − 1 edges; with that many edges, acyclic and connected are equivalent, so you only need to check one.",
      "Union-find: an edge whose endpoints already share a root closes a cycle.",
    ],
    solution: [
      "## Approach",
      "",
      "Reject immediately unless there are exactly n − 1 edges. Then union the endpoints of each edge; finding an edge whose endpoints are already connected means a cycle. With n − 1 edges and no cycle, the graph is connected, so no separate connectivity check is needed.",
      "",
      "## Complexity",
      "",
      "O(n α(n)) time with path compression; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The edge-count shortcut is the insight; without it you need both a cycle check and a connectivity check.",
      "- A DFS from node 0 that visits every node without seeing a back edge (ignoring the edge to the parent) is the equivalent traversal answer.",
    ].join("\n"),
    judge: {
      solutionCode: `// n - 1 edges plus no cycle (union-find) is a tree.
function validTree(n, edges) {
  if (edges.length !== n - 1) return false;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return false;
    parent[a] = b;
  }
  return true;
}
`,
      starterCode: `/**
 * @param {number} n nodes 0..n-1
 * @param {number[][]} edges undirected [u, v] pairs
 * @returns {boolean}
 */
function validTree(n, edges) {
  // Your code here
  return false;
}
`,
      entry: "validTree",
      tests: [
        { name: "A tree", input: [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], expected: true },
        { name: "A cycle", input: [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], expected: false },
        { name: "A single node", input: [1, []], expected: true },
        { name: "Two nodes, no edge", input: [2, []], expected: false },
        { name: "Two components", input: [4, [[0, 1], [2, 3]]], expected: false },
        { name: "Too many edges", input: [3, [[0, 1], [1, 2], [2, 0]]], expected: false },
      ],
    },
  },
  {
    slug: "keys-and-rooms",
    title: "Keys and Rooms",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Rooms are nodes and keys are edges: one traversal from room 0, then compare the visited count with the room count.",
    prompt: [
      "There are `n` rooms numbered `0` to `n - 1`, all locked except room `0`. Each room holds a list of keys, and a key for room `j` opens room `j`. Starting in room `0`, return whether every room can be entered.",
      "",
      "```",
      "canVisitAllRooms([[1], [2], [3], []])          ->  true",
      "canVisitAllRooms([[1, 3], [3, 0, 1], [2], [0]]) ->  false   // nothing opens room 2",
      "```",
    ].join("\n"),
    hints: ["Depth-first search from room 0 over the keys; the answer is whether the visited set reaches size n."],
    solution: [
      "## Approach",
      "",
      "The keys define a directed graph. Traverse it from room 0 — a stack or a queue, either works — adding each newly opened room to a visited set and pushing its keys. Every room is reachable exactly when the visited set has n entries.",
      "",
      "## Complexity",
      "",
      "O(n + keys) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Keys may repeat or point back to room 0; the visited set makes both harmless.",
      "- The question is reachability from a single source, not connectivity: a room that can reach 0 but not be reached from it still counts as locked.",
    ].join("\n"),
    judge: {
      solutionCode: `// Reachability from room 0 over the key graph.
function canVisitAllRooms(rooms) {
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const room = stack.pop();
    for (const key of rooms[room]) {
      if (!seen.has(key)) {
        seen.add(key);
        stack.push(key);
      }
    }
  }
  return seen.size === rooms.length;
}
`,
      starterCode: `/**
 * @param {number[][]} rooms rooms[i] lists the keys found in room i
 * @returns {boolean} whether every room can be entered starting from room 0
 */
function canVisitAllRooms(rooms) {
  // Your code here
  return false;
}
`,
      entry: "canVisitAllRooms",
      tests: [
        { name: "A chain of keys", input: [[[1], [2], [3], []]], expected: true },
        { name: "A room nobody can open", input: [[[1, 3], [3, 0, 1], [2], [0]]], expected: false },
        { name: "Only room 0", input: [[[]]], expected: true },
        { name: "Room 0 holds the only key", input: [[[1], []]], expected: true },
        { name: "The key is in the locked room", input: [[[], [0]]], expected: false },
        { name: "Duplicate keys", input: [[[1, 1, 2], [2], [1]]], expected: true },
      ],
    },
  },
  {
    slug: "most-stones-removed",
    title: "Most Stones Removed With Same Row or Column",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Stones that share a row or column form components; each component can be reduced to one stone.",
    prompt: [
      "Stones sit at integer coordinates, at most one per cell. A stone can be removed if another stone remains in its row or its column. Return the largest number of stones that can be removed.",
      "",
      "```",
      "removeStones([[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]])  ->  5",
      "removeStones([[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]])          ->  3",
      "removeStones([[0, 0]])                                          ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Connect two stones when they share a row or a column. Within a connected component you can always remove all stones but one, working inward from the leaves of a spanning tree.",
      "So the answer is stones − components. Union-find over row ids and column ids (offset so they never collide) finds the components without building stone-to-stone edges.",
    ],
    solution: [
      "## Approach",
      "",
      "Think of each row and each column as a node and each stone as an edge joining its row node to its column node. Stones in one connected component can be removed one at a time until a single stone remains — remove the stone farthest from the component's spanning-tree root first — and no stone can leave its component. Union the row and column node of every stone, count the distinct roots among nodes that were touched, and return stones minus that count.",
      "",
      "## Complexity",
      "",
      "O(stones α) time; O(stones) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Keying rows and columns as separate node spaces (a prefix, or an offset of 10 001) is what turns a stone into one union instead of a scan for every other stone in the same row.",
      "- Only touched rows and columns count as nodes; an untouched coordinate is not an empty component.",
    ].join("\n"),
    judge: {
      solutionCode: `// Each stone unions its row node with its column node; answer = stones - components.
function removeStones(stones) {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  for (const [r, c] of stones) {
    const a = find("r" + r);
    const b = find("c" + c);
    if (a !== b) parent.set(a, b);
  }
  const roots = new Set();
  for (const node of parent.keys()) roots.add(find(node));
  return stones.length - roots.size;
}
`,
      starterCode: `/**
 * @param {number[][]} stones [row, col] positions
 * @returns {number} the most stones that can be removed
 */
function removeStones(stones) {
  // Your code here
  return 0;
}
`,
      entry: "removeStones",
      tests: [
        { name: "Prompt example", input: [[[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]]], expected: 5 },
        { name: "Two groups", input: [[[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]]], expected: 3 },
        { name: "A single stone", input: [[[0, 0]]], expected: 0 },
        { name: "Nothing shares a line", input: [[[0, 0], [1, 1]]], expected: 0 },
        { name: "An L shape", input: [[[0, 0], [0, 1], [1, 1]]], expected: 2 },
        { name: "One row", input: [[[3, 0], [3, 1], [3, 2], [3, 3]]], expected: 3 },
      ],
    },
  },
  {
    slug: "parallel-courses-ii",
    title: "Parallel Courses II",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "n ≤ 15 is the hint: a bitmask of taken courses, and from each state take any k of the courses whose prerequisites are done.",
    prompt: [
      "There are `n` courses labelled `1` to `n` and prerequisite pairs `[a, b]` meaning `a` must be completed before `b`. In one semester you may take at most `k` courses, any of whose prerequisites are already complete. Return the minimum number of semesters needed to finish every course. The prerequisites contain no cycle and `n ≤ 15`.",
      "",
      "```",
      "minNumberOfSemesters(4, [[2, 1], [3, 1], [1, 4]], 2)          ->  3",
      "minNumberOfSemesters(5, [[2, 1], [3, 1], [4, 1], [1, 5]], 2)  ->  4",
      "minNumberOfSemesters(11, [], 2)                               ->  6",
      "```",
    ].join("\n"),
    hints: [
      "Greedy by the longest remaining chain is not always right; with n ≤ 15 the intended solution is dynamic programming over the set of completed courses as a bitmask.",
      "From a state, compute the courses whose prerequisite mask is a subset of the state. If there are at most k of them take them all; otherwise try every subset of exactly k.",
    ],
    solution: [
      "## Approach",
      "",
      "Let `dp[mask]` be the fewest semesters that complete exactly the courses in `mask`. From each reachable mask, the available courses are those not yet taken whose prerequisite bitmask is contained in `mask`. If at most k are available, taking all of them is optimal and there is one transition; otherwise enumerate the subsets of the available set that have exactly k bits (the `sub = (sub - 1) & avail` walk) and relax `dp[mask | sub]`. The answer is `dp[full]`.",
      "",
      "## Complexity",
      "",
      "O(2ⁿ × 2^|avail|) in the worst case, which is fine for n ≤ 15; O(2ⁿ) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Why not greedy: taking the courses with the most dependants first fails on small adversarial inputs, which is why the constraint is so small.",
      "- Storing each course's prerequisites as a bitmask makes the availability test one AND per course.",
    ].join("\n"),
    judge: {
      solutionCode: `// Bitmask DP over completed courses; take all available if <= k, else every k-subset.
function minNumberOfSemesters(n, relations, k) {
  const prereq = Array(n).fill(0);
  for (const [a, b] of relations) prereq[b - 1] |= 1 << (a - 1);
  const full = (1 << n) - 1;
  const dp = Array(1 << n).fill(Infinity);
  dp[0] = 0;
  const bits = (m) => {
    let count = 0;
    while (m) {
      m &= m - 1;
      count++;
    }
    return count;
  };
  for (let mask = 0; mask < full; mask++) {
    if (dp[mask] === Infinity) continue;
    let avail = 0;
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i)) && (prereq[i] & mask) === prereq[i]) avail |= 1 << i;
    }
    if (bits(avail) <= k) {
      const next = mask | avail;
      if (dp[mask] + 1 < dp[next]) dp[next] = dp[mask] + 1;
      continue;
    }
    for (let sub = avail; sub > 0; sub = (sub - 1) & avail) {
      if (bits(sub) !== k) continue;
      const next = mask | sub;
      if (dp[mask] + 1 < dp[next]) dp[next] = dp[mask] + 1;
    }
  }
  return dp[full];
}
`,
      starterCode: `/**
 * @param {number} n courses 1..n (n <= 15)
 * @param {number[][]} relations [a, b]: a before b
 * @param {number} k courses per semester
 * @returns {number} the fewest semesters
 */
function minNumberOfSemesters(n, relations, k) {
  // Your code here
  return 0;
}
`,
      entry: "minNumberOfSemesters",
      tests: [
        { name: "Prompt example", input: [4, [[2, 1], [3, 1], [1, 4]], 2], expected: 3 },
        { name: "Three prerequisites, two per semester", input: [5, [[2, 1], [3, 1], [4, 1], [1, 5]], 2], expected: 4 },
        { name: "No prerequisites", input: [11, [], 2], expected: 6 },
        { name: "Everything at once", input: [3, [], 3], expected: 1 },
        { name: "A chain, one at a time", input: [4, [[1, 2], [2, 3], [3, 4]], 1], expected: 4 },
        { name: "Three short chains", input: [6, [[1, 2], [3, 4], [5, 6]], 3], expected: 2 },
      ],
    },
  },
  {
    slug: "campus-bikes",
    title: "Campus Bikes",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Sort every (worker, bike) pair by distance, then worker, then bike, and hand out bikes greedily in that order.",
    prompt: [
      "Workers and bikes sit on a grid. Repeatedly pick the unassigned (worker, bike) pair with the smallest Manhattan distance — ties broken by the smaller worker index, then the smaller bike index — and assign it, until every worker has a bike. Return `answer[i]`, the bike index assigned to worker `i`. There are at least as many bikes as workers.",
      "",
      "```",
      "assignBikes([[0, 0], [2, 1]], [[1, 2], [3, 3]])                   ->  [1, 0]",
      "assignBikes([[0, 0], [1, 1], [2, 0]], [[1, 0], [2, 2], [2, 1]])    ->  [0, 2, 1]",
      "```",
    ].join("\n"),
    hints: [
      "Generate all worker × bike pairs with their distance, sort by (distance, worker, bike), and walk the list skipping pairs whose worker or bike is already taken.",
      "Distances are small integers, so bucketing pairs by distance replaces the sort with a counting pass.",
    ],
    solution: [
      "## Approach",
      "",
      "The rule describes a greedy order exactly, so materialise it: every pair with its distance, sorted by distance, then worker index, then bike index. Walk the sorted pairs; if the worker is unassigned and the bike untaken, assign them. Stop once every worker has a bike.",
      "",
      "## Complexity",
      "",
      "O(W × B log(W × B)) time for the sort; O(W × B) space. Bucket sort by distance brings it to O(W × B).",
      "",
      "## Worth saying out loud",
      "",
      "- This is not an optimal matching problem: the prompt fixes the greedy order, and following it exactly is the whole task.",
      "- The follow-up that minimises the total distance over all assignments is a different problem (small W, bitmask DP).",
    ].join("\n"),
    judge: {
      solutionCode: `// Sort pairs by (distance, worker, bike) and assign greedily.
function assignBikes(workers, bikes) {
  const pairs = [];
  for (let w = 0; w < workers.length; w++) {
    for (let b = 0; b < bikes.length; b++) {
      const d = Math.abs(workers[w][0] - bikes[b][0]) + Math.abs(workers[w][1] - bikes[b][1]);
      pairs.push([d, w, b]);
    }
  }
  pairs.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
  const answer = Array(workers.length).fill(-1);
  const taken = Array(bikes.length).fill(false);
  let assigned = 0;
  for (const [, w, b] of pairs) {
    if (answer[w] !== -1 || taken[b]) continue;
    answer[w] = b;
    taken[b] = true;
    if (++assigned === workers.length) break;
  }
  return answer;
}
`,
      starterCode: `/**
 * @param {number[][]} workers [x, y] per worker
 * @param {number[][]} bikes [x, y] per bike
 * @returns {number[]} the bike index assigned to each worker
 */
function assignBikes(workers, bikes) {
  // Your code here
  return [];
}
`,
      entry: "assignBikes",
      tests: [
        { name: "Prompt example", input: [[[0, 0], [2, 1]], [[1, 2], [3, 3]]], expected: [1, 0] },
        { name: "Ties by worker then bike", input: [[[0, 0], [1, 1], [2, 0]], [[1, 0], [2, 2], [2, 1]]], expected: [0, 2, 1] },
        { name: "One of each", input: [[[0, 0]], [[1, 1]]], expected: [0] },
        { name: "Nearest bike is listed second", input: [[[0, 0]], [[5, 5], [1, 1]]], expected: [1] },
        { name: "Equal distances resolve by index", input: [[[0, 0], [0, 1]], [[0, 2], [1, 0]]], expected: [1, 0] },
      ],
    },
  },
  {
    slug: "most-profitable-path-in-a-tree",
    title: "Most Profitable Path in a Tree",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Bob's route to the root is fixed, so timestamp it; then one DFS scores Alice's gates by who arrives first.",
    prompt: [
      "An undirected tree of `n` nodes is rooted at `0`. Alice starts at `0` and walks to some leaf; Bob starts at node `bob` and walks to `0`. They move one edge per second. Each node has a gate worth `amount[i]`: a negative value is a toll, a positive one a reward. The first to reach a gate opens it and takes its full amount; if both reach it at the same second they split it (`amount[i]` is even). A gate Bob has already opened is worth nothing to Alice. Return the maximum net income Alice can have by choosing her leaf.",
      "",
      "```",
      "mostProfitablePath([[0, 1], [1, 2], [1, 3], [3, 4]], 3, [-2, 4, 2, -4, 6])  ->  6",
      "mostProfitablePath([[0, 1]], 1, [-7280, 2350])                              ->  -7280",
      "```",
    ].join("\n"),
    hints: [
      "Bob's path is forced: it is the parent chain from bob to 0. Record the time Bob reaches each node on it.",
      "DFS from 0 with Alice's time: she gets the full amount when her time is smaller than Bob's, half when equal, nothing when larger. Take the best leaf below each node.",
    ],
    solution: [
      "## Approach",
      "",
      "Build parent pointers from the root with one traversal. Walk from `bob` up the parents to 0, stamping each node with the second Bob arrives. Then evaluate Alice bottom-up over the same traversal order reversed: a node's gain is the full amount if Alice's depth is less than Bob's stamp, half if equal, zero otherwise, and its value is that gain plus the best child value — or the gain alone at a leaf. The root's value is the answer.",
      "",
      "## Complexity",
      "",
      "O(n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Nodes off Bob's path get an infinite stamp, so the comparison needs no special case.",
      "- The root is never a leaf for Alice even when it has one child; handle n = 2 by that rule, as the second example shows.",
    ].join("\n"),
    judge: {
      solutionCode: `// Stamp Bob's arrival times along his forced path, then score Alice bottom-up.
function mostProfitablePath(edges, bob, amount) {
  const n = amount.length;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const parent = Array(n).fill(-1);
  const depth = Array(n).fill(0);
  parent[0] = 0;
  const order = [0];
  for (let i = 0; i < order.length; i++) {
    const u = order[i];
    for (const v of adj[u]) {
      if (parent[v] === -1) {
        parent[v] = u;
        depth[v] = depth[u] + 1;
        order.push(v);
      }
    }
  }
  const bobTime = Array(n).fill(Infinity);
  for (let u = bob, t = 0; ; u = parent[u], t++) {
    bobTime[u] = t;
    if (u === 0) break;
  }
  const best = Array(n).fill(0);
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i];
    let gain = 0;
    if (depth[u] < bobTime[u]) gain = amount[u];
    else if (depth[u] === bobTime[u]) gain = amount[u] / 2;
    let childBest = -Infinity;
    for (const v of adj[u]) {
      if (v !== parent[u] || u === 0) childBest = Math.max(childBest, best[v]);
    }
    best[u] = childBest === -Infinity ? gain : gain + childBest;
  }
  return best[0];
}
`,
      starterCode: `/**
 * @param {number[][]} edges undirected tree edges; node 0 is the root
 * @param {number} bob Bob's starting node
 * @param {number[]} amount gate values (even)
 * @returns {number} Alice's best net income
 */
function mostProfitablePath(edges, bob, amount) {
  // Your code here
  return 0;
}
`,
      entry: "mostProfitablePath",
      tests: [
        { name: "Prompt example", input: [[[0, 1], [1, 2], [1, 3], [3, 4]], 3, [-2, 4, 2, -4, 6]], expected: 6 },
        { name: "Two nodes", input: [[[0, 1]], 1, [-7280, 2350]], expected: -7280 },
        { name: "Avoid Bob's branch", input: [[[0, 1], [0, 2]], 2, [0, 10, 20]], expected: 10 },
        { name: "They meet in the middle", input: [[[0, 1], [1, 2]], 2, [2, 4, 6]], expected: 4 },
        { name: "A reward far from Bob", input: [[[0, 1], [1, 2], [2, 3], [0, 4]], 3, [10, -20, 30, 40, 50]], expected: 60 },
      ],
    },
  },
];
