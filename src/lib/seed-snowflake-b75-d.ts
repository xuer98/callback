import type { Problem } from "./types";

// Blind 75 for the Snowflake backend screen, part D: the rest of the
// dynamic-programming group and the first graph problems. Python in
// seed-python-snowflake-q.ts.

export const snowflakeBlindProblemsD: Problem[] = [
  {
    slug: "house-robber-ii",
    title: "House Robber II",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A circle means the first and last house exclude each other: solve the line twice and take the better.",
    prompt: [
      "The houses now form a circle, so the first and last are neighbours too. Return the most you can take without robbing two adjacent houses.",
      "",
      "```",
      "rob([2, 3, 2])     ->  3",
      "rob([1, 2, 3, 1])  ->  4",
      "rob([1, 2, 3])     ->  3",
      "```",
    ].join("\n"),
    hints: [
      "Either the first house is skipped or the last is. Each case is the straight-street problem on a slice.",
      "Handle a single house separately: both slices would be empty.",
    ],
    solution: [
      "## Approach",
      "",
      "Run the linear House Robber on `nums[1..]` and on `nums[..n-1]` and return the larger. Since the two ends cannot both be robbed, one of the two slices contains an optimal plan.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The reduction is the whole answer; say it before coding.",
      "- One house is the edge case both slices miss.",
    ].join("\n"),
    judge: {
      solutionCode: `function rob(nums) {
  if (nums.length === 1) return nums[0];
  const line = (from, to) => {
    let withPrev = 0;
    let withoutPrev = 0;
    for (let i = from; i < to; i++) {
      const take = withoutPrev + nums[i];
      withoutPrev = Math.max(withoutPrev, withPrev);
      withPrev = take;
    }
    return Math.max(withPrev, withoutPrev);
  };
  return Math.max(line(1, nums.length), line(0, nums.length - 1));
}
`,
      starterCode: `/**
 * @param {number[]} nums money in each house, arranged in a circle
 * @returns {number} the most that can be taken without robbing neighbours
 */
function rob(nums) {
  // Your code here
  return 0;
}
`,
      entry: "rob",
      tests: [
        { name: "Prompt example", input: [[2, 3, 2]], expected: 3 },
        { name: "Four houses", input: [[1, 2, 3, 1]], expected: 4 },
        { name: "Three houses", input: [[1, 2, 3]], expected: 3 },
        { name: "One house", input: [[1]], expected: 1 },
        { name: "Two houses", input: [[1, 2]], expected: 2 },
        { name: "Skip the first", input: [[200, 3, 140, 20, 10]], expected: 340 },
      ],
    },
  },
  {
    slug: "decode-ways",
    title: "Decode Ways",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Fibonacci-shaped dp over the digits, where zeros and numbers above 26 close doors.",
    prompt: [
      "Letters A–Z were encoded as 1–26 and the digits concatenated. Return how many ways the digit string `s` can be decoded. `\"06\"` is not a valid code for F; only `\"6\"` is.",
      "",
      "```",
      "numDecodings(\"12\")   ->  2     // AB, L",
      "numDecodings(\"226\")  ->  3     // BZ, VF, BBF",
      "numDecodings(\"06\")   ->  0",
      "```",
    ].join("\n"),
    hints: [
      "ways(i) for the first i digits: add ways(i-1) if digit i is 1–9, and ways(i-2) if digits i-1..i form 10–26.",
      "A leading zero in either piece contributes nothing.",
    ],
    solution: [
      "## Approach",
      "",
      "Two rolling counts. For each position, a non-zero digit can stand alone (take the count one back); a two-digit value between 10 and 26 can pair with the previous digit (take the count two back). Zero as a single digit contributes nothing, which is how `\"0\"` and `\"06\"` end at 0.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Cases to test out loud: `\"10\"`, `\"27\"`, `\"100\"`, `\"2101\"`.",
      "- Decode Ways II adds `*` wildcards and multiplies branch counts; the structure is identical.",
    ].join("\n"),
    judge: {
      solutionCode: `function numDecodings(s) {
  let twoBack = 1;
  let oneBack = s[0] === "0" ? 0 : 1;
  for (let i = 1; i < s.length; i++) {
    let current = s[i] === "0" ? 0 : oneBack;
    const pair = Number(s.slice(i - 1, i + 1));
    if (pair >= 10 && pair <= 26) current += twoBack;
    twoBack = oneBack;
    oneBack = current;
  }
  return oneBack;
}
`,
      starterCode: `/**
 * @param {string} s digits, non-empty
 * @returns {number} how many ways to decode it
 */
function numDecodings(s) {
  // Your code here
  return 0;
}
`,
      entry: "numDecodings",
      tests: [
        { name: "Prompt example", input: ["12"], expected: 2 },
        { name: "Three ways", input: ["226"], expected: 3 },
        { name: "Leading zero", input: ["06"], expected: 0 },
        { name: "Lone zero", input: ["0"], expected: 0 },
        { name: "Ten", input: ["10"], expected: 1 },
        { name: "Zeros inside", input: ["2101"], expected: 1 },
        { name: "Above 26", input: ["27"], expected: 1 },
        { name: "Longer", input: ["11106"], expected: 2 },
      ],
    },
  },
  {
    slug: "unique-paths",
    title: "Unique Paths",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Each cell is reached from above or from the left; one rolling row holds the whole grid.",
    prompt: [
      "A robot starts at the top-left of an `m × n` grid and may only move right or down. Return how many distinct paths reach the bottom-right.",
      "",
      "```",
      "uniquePaths(3, 7)  ->  28",
      "uniquePaths(3, 2)  ->  3",
      "```",
    ].join("\n"),
    hints: [
      "paths(r, c) = paths(r-1, c) + paths(r, c-1), with the first row and column all 1.",
      "Row by row, the running row only needs itself: row[c] += row[c-1].",
    ],
    solution: [
      "## Approach",
      "",
      "Dynamic programming with a single row of length n initialised to 1 (the first row). For each further row, sweep left to right adding the cell to the left: the old value is the count from above, the left neighbour the count from the left.",
      "",
      "## Complexity",
      "",
      "O(m × n) time, O(n) space; the closed form C(m+n-2, m-1) is O(min(m, n)) with care about overflow.",
      "",
      "## Worth saying out loud",
      "",
      "- Obstacles (Unique Paths II) zero out blocked cells in the same sweep.",
      "- The binomial formula is the fastest but needs incremental multiplication to stay exact.",
    ].join("\n"),
    judge: {
      solutionCode: `function uniquePaths(m, n) {
  const row = new Array(n).fill(1);
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) row[c] += row[c - 1];
  }
  return row[n - 1];
}
`,
      starterCode: `/**
 * @param {number} m rows
 * @param {number} n columns
 * @returns {number} paths from top-left to bottom-right moving right or down
 */
function uniquePaths(m, n) {
  // Your code here
  return 0;
}
`,
      entry: "uniquePaths",
      tests: [
        { name: "Prompt example", input: [3, 7], expected: 28 },
        { name: "Narrow", input: [3, 2], expected: 3 },
        { name: "One cell", input: [1, 1], expected: 1 },
        { name: "Square", input: [10, 10], expected: 48620 },
        { name: "Large", input: [23, 12], expected: 193536720 },
      ],
    },
  },
  {
    slug: "jump-game",
    title: "Jump Game",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Track the farthest index reachable so far; the moment the scan passes it, you are stuck.",
    prompt: [
      "`nums[i]` is the maximum jump length from index i. Starting at index 0, return whether the last index can be reached.",
      "",
      "```",
      "canJump([2, 3, 1, 1, 4])  ->  true",
      "canJump([3, 2, 1, 0, 4])  ->  false",
      "```",
    ].join("\n"),
    hints: [
      "Keep the farthest index reachable. If the current index is beyond it, no path exists.",
      "Otherwise extend it with i + nums[i]; success once it covers the last index.",
    ],
    solution: [
      "## Approach",
      "",
      "Greedy sweep: `reach = max(reach, i + nums[i])` for each `i <= reach`. If `i` ever exceeds `reach`, the answer is false; if `reach` ever covers the last index, true.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The backwards version (keep the leftmost index from which the end is reachable) is just as short.",
      "- Jump Game II asks for the fewest jumps: the same reach idea in levels.",
    ].join("\n"),
    judge: {
      solutionCode: `function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}
`,
      starterCode: `/**
 * @param {number[]} nums maximum jump length at each index
 * @returns {boolean} whether the last index is reachable from index 0
 */
function canJump(nums) {
  // Your code here
  return false;
}
`,
      entry: "canJump",
      tests: [
        { name: "Prompt example", input: [[2, 3, 1, 1, 4]], expected: true },
        { name: "Stuck on a zero", input: [[3, 2, 1, 0, 4]], expected: false },
        { name: "Already there", input: [[0]], expected: true },
        { name: "Zeros that do not matter", input: [[2, 0, 0]], expected: true },
        { name: "Zero before the end", input: [[1, 0, 1]], expected: false },
      ],
    },
  },
  {
    slug: "clone-graph",
    title: "Clone Graph",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A map from original node to its copy does the cycle handling; BFS or DFS fills it.",
    prompt: [
      "Return a deep copy of a connected undirected graph given one of its nodes. Nodes are `{ val, neighbors }` where `val` is a unique integer and `neighbors` an array of nodes; the copy must share no node with the original.",
      "",
      "The tests describe graphs as adjacency lists indexed from 1 — `[[2, 4], [1, 3], [2, 4], [1, 3]]` is a square — build the original, call your function with node 1, and read the copy back the same way.",
      "",
      "```",
      "cloneGraph(node1 of [[2, 4], [1, 3], [2, 4], [1, 3]])  ->  a copy with the same adjacency",
      "cloneGraph(null)                                       ->  null",
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from original node to its clone. A node whose clone exists is returned from the map, which is what stops cycles.",
      "Visit with BFS or DFS; for each original, create its clone once, then clone each neighbour (through the map) and push it onto the clone's list.",
    ],
    solution: [
      "## Approach",
      "",
      "BFS from the given node with a `Map` of original to copy. Pop an original, and for each neighbour create its copy if absent (and enqueue the neighbour), then append the neighbour's copy to this copy's list. Every edge is handled twice (once per end) and every node once.",
      "",
      "## Complexity",
      "",
      "O(V + E) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- The map is the visited set; forgetting it on a cycle recurses forever.",
      "- The same idea copies a linked list with random pointers or any object graph.",
    ].join("\n"),
    judge: {
      solutionCode: `/** Nodes are { val, neighbors }. */
function cloneGraph(node) {
  if (!node) return null;
  const copies = new Map([[node, { val: node.val, neighbors: [] }]]);
  const queue = [node];
  while (queue.length) {
    const original = queue.shift();
    const copy = copies.get(original);
    for (const neighbor of original.neighbors) {
      if (!copies.has(neighbor)) {
        copies.set(neighbor, { val: neighbor.val, neighbors: [] });
        queue.push(neighbor);
      }
      copy.neighbors.push(copies.get(neighbor));
    }
  }
  return copies.get(node);
}
`,
      starterCode: `/**
 * Nodes are { val, neighbors }; neighbors is an array of nodes.
 * @param {{ val: number, neighbors: object[] } | null} node
 * @returns {{ val: number, neighbors: object[] } | null} a deep copy
 */
function cloneGraph(node) {
  // Your code here
  return null;
}
`,
      entry: "__judgeClone",
      driverCode: `function __judgeClone(adjacency) {
  const nodes = adjacency.map((_, i) => ({ val: i + 1, neighbors: [] }));
  adjacency.forEach((list, i) => {
    nodes[i].neighbors = list.map((v) => nodes[v - 1]);
  });
  const copy = cloneGraph(nodes[0] ?? null);
  if (adjacency.length === 0) return copy === null ? [] : "expected null for an empty graph";
  const originals = new Set(nodes);
  const seen = new Set([copy]);
  const queue = [copy];
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node.val !== "number" || !Array.isArray(node.neighbors)) {
      return "every node needs a numeric val and a neighbors array";
    }
    if (originals.has(node)) return "the copy shares a node with the original";
    for (const next of node.neighbors) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  const out = adjacency.map(() => null);
  for (const node of seen) {
    if (node.val < 1 || node.val > out.length || out[node.val - 1] !== null) {
      return "val " + node.val + " is unexpected or repeated in the copy";
    }
    out[node.val - 1] = node.neighbors.map((n) => n.val).sort((a, b) => a - b);
  }
  if (out.some((list) => list === null)) return "the copy is missing nodes";
  return out;
}`,
      tests: [
        { name: "A square", input: [[[2, 4], [1, 3], [2, 4], [1, 3]]], expected: [[2, 4], [1, 3], [2, 4], [1, 3]] },
        { name: "One node, no edges", input: [[[]]], expected: [[]] },
        { name: "Empty graph", input: [[]], expected: [] },
        { name: "Two nodes", input: [[[2], [1]]], expected: [[2], [1]] },
        { name: "Triangle with a tail", input: [[[2, 3], [1, 3], [1, 2, 4], [3]]], expected: [[2, 3], [1, 3], [1, 2, 4], [3]] },
      ],
    },
  },
  {
    slug: "pacific-atlantic-water-flow",
    title: "Pacific Atlantic Water Flow",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Flow uphill from each ocean's edge instead of downhill from every cell; the answer is the intersection.",
    prompt: [
      "`heights[r][c]` is the height of a cell. The Pacific touches the top and left edges, the Atlantic the bottom and right. Water flows from a cell to a neighbour of equal or lower height. Return every cell `[r, c]` from which water can reach both oceans, in any order.",
      "",
      "```",
      "pacificAtlantic([[1, 2, 2, 3, 5],",
      "                 [3, 2, 3, 4, 4],",
      "                 [2, 4, 5, 3, 1],",
      "                 [6, 7, 1, 4, 5],",
      "                 [5, 1, 1, 2, 4]])  ->  [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]",
      "```",
    ].join("\n"),
    hints: [
      "Reverse the flow: from the ocean's edge cells, move to neighbours of equal or greater height. Everything reached can drain to that ocean.",
      "Run the reverse flood once per ocean and intersect the two reachable sets.",
    ],
    solution: [
      "## Approach",
      "",
      "Two BFS or DFS floods, seeded with the Pacific edges and the Atlantic edges respectively, each moving only to neighbours at least as high. Cells marked by both floods are the answer. A flood from every cell would be O((mn)²); the reverse flood is linear.",
      "",
      "## Complexity",
      "",
      "O(m × n) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- The reversal of the rule (uphill from the sinks) is the insight; say it before coding.",
      "- Order of the output is not specified; sort it only if the interviewer wants determinism.",
    ].join("\n"),
    judge: {
      solutionCode: `function pacificAtlantic(heights) {
  const rows = heights.length;
  const cols = rows ? heights[0].length : 0;
  const flood = (seeds) => {
    const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const queue = seeds;
    for (const [r, c] of queue) seen[r][c] = true;
    for (let head = 0; head < queue.length; head++) {
      const [r, c] = queue[head];
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue;
        if (heights[nr][nc] < heights[r][c]) continue;
        seen[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
    return seen;
  };
  const pacific = [];
  const atlantic = [];
  for (let r = 0; r < rows; r++) {
    pacific.push([r, 0]);
    atlantic.push([r, cols - 1]);
  }
  for (let c = 0; c < cols; c++) {
    pacific.push([0, c]);
    atlantic.push([rows - 1, c]);
  }
  const fromPacific = flood(pacific);
  const fromAtlantic = flood(atlantic);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) if (fromPacific[r][c] && fromAtlantic[r][c]) out.push([r, c]);
  }
  return out;
}
`,
      starterCode: `/**
 * @param {number[][]} heights
 * @returns {number[][]} cells [r, c] draining to both oceans, any order
 */
function pacificAtlantic(heights) {
  // Your code here
  return [];
}
`,
      entry: "__judgePacific",
      driverCode: `function __judgePacific(heights) {
  return pacificAtlantic(heights)
    .map(([r, c]) => [r, c])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}`,
      tests: [
        {
          name: "Prompt example",
          input: [[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]],
          expected: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]],
        },
        { name: "One cell", input: [[[1]]], expected: [[0, 0]] },
        { name: "Two by two", input: [[[1, 2], [4, 3]]], expected: [[0, 1], [1, 0], [1, 1]] },
        { name: "Flat", input: [[[1, 1], [1, 1]]], expected: [[0, 0], [0, 1], [1, 0], [1, 1]] },
      ],
    },
  },
];
