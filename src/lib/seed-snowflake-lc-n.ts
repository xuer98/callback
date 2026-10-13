import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part N (grid searches, continued):
// bridging two islands, a rolling ball, and the minimum-effort path. Judged
// in JavaScript and Python; the Python judges live in seed-python-snowflake-g.ts.

export const snowflakeLcProblemsN: Problem[] = [
  {
    slug: "shortest-bridge",
    title: "Shortest Bridge",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Flood fill one island to collect its cells, then BFS outward over water until the other island is touched.",
    prompt: [
      "A grid of `0` (water) and `1` (land) holds exactly two islands. Return the smallest number of `0` cells that must be flipped to `1` to connect them.",
      "",
      "```",
      "shortestBridge([[0, 1], [1, 0]])                   ->  1",
      "shortestBridge([[0, 1, 0], [0, 0, 0], [0, 0, 1]])  ->  2",
      "```",
    ].join("\n"),
    hints: [
      "Find any land cell and flood fill from it to collect the first island.",
      "Breadth-first search from all of its cells at once; the first time a step lands on land that is not the first island, the number of water cells crossed is the answer.",
    ],
    solution: [
      "## Approach",
      "",
      "Locate one land cell, flood fill to mark its whole island and seed a queue with every cell of it. Then search outward level by level: stepping onto water costs one level; stepping onto unmarked land means the second island is reached, and the number of water levels crossed so far is the bridge length.",
      "",
      "## Complexity",
      "",
      "O(rows × cols) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Seeding the queue with the entire first island is what makes this a shortest bridge rather than a shortest path from one cell.",
      "- The level counter increments only when a level finishes; the reaching step itself does not add a flipped cell.",
    ].join("\n"),
    judge: {
      solutionCode: `// Collect one island, then expand it level by level until it meets the other.
function shortestBridge(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = grid.map((row) => row.map(() => false));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let queue = [];
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        const stack = [[r, c]];
        seen[r][c] = true;
        while (stack.length) {
          const [cr, cc] = stack.pop();
          queue.push([cr, cc]);
          for (const [dr, dc] of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen[nr][nc]) {
              seen[nr][nc] = true;
              stack.push([nr, nc]);
            }
          }
        }
        break outer;
      }
    }
  }
  let flips = 0;
  while (queue.length) {
    const next = [];
    for (const [r, c] of queue) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue;
        if (grid[nr][nc] === 1) return flips;
        seen[nr][nc] = true;
        next.push([nr, nc]);
      }
    }
    queue = next;
    flips++;
  }
  return -1;
}
`,
      starterCode: `/**
 * @param {number[][]} grid 0 water, 1 land, exactly two islands
 * @returns {number} the fewest water cells to flip
 */
function shortestBridge(grid) {
  // Your code here
  return 0;
}
`,
      entry: "shortestBridge",
      tests: [
        { name: "Diagonal neighbours", input: [[[0, 1], [1, 0]]], expected: 1 },
        { name: "Across a corner", input: [[[0, 1, 0], [0, 0, 0], [0, 0, 1]]], expected: 2 },
        { name: "A ring around an island", input: [[[1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1]]], expected: 1 },
        { name: "A long gap", input: [[[1, 0, 0, 0, 1]]], expected: 3 },
        { name: "Big islands, short bridge", input: [[[1, 1, 0, 1, 1], [1, 1, 0, 1, 1], [0, 0, 0, 0, 0]]], expected: 1 },
      ],
    },
  },
  {
    slug: "the-maze",
    title: "The Maze",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "The ball rolls until it hits a wall, so the graph's nodes are stopping points, not cells.",
    prompt: [
      "A ball in a maze of `0` (empty) and `1` (wall) rolls up, down, left or right and does not stop until it hits a wall; then it may choose a new direction. Given the start and destination cells, return whether the ball can **stop** at the destination.",
      "",
      "```",
      "maze = [[0, 0, 1, 0, 0],",
      "        [0, 0, 0, 0, 0],",
      "        [0, 0, 0, 1, 0],",
      "        [1, 1, 0, 1, 1],",
      "        [0, 0, 0, 0, 0]]",
      "hasPath(maze, [0, 4], [4, 4])  ->  true",
      "hasPath(maze, [0, 4], [3, 2])  ->  false   // it rolls through [3, 2] but cannot stop there",
      "```",
    ].join("\n"),
    hints: [
      "From a stopping point, roll in each direction until the next cell is a wall or the edge; where the ball stops is a neighbour in the search graph.",
      "Breadth-first search over stopping points with a visited set; passing through the destination is not the same as stopping on it.",
    ],
    solution: [
      "## Approach",
      "",
      "Treat every place the ball can come to rest as a node. From a node, try the four directions: advance while the next cell is inside the grid and not a wall, and the cell where the advance ends is the neighbour. A breadth-first search from the start over these nodes, with a visited set of stopping points, answers whether the destination is reachable as a stop.",
      "",
      "## Complexity",
      "",
      "O(rows × cols × max(rows, cols)) time in the worst case — each stopping point rolls up to the grid's length in four directions; O(rows × cols) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Marking cells the ball rolls through as visited is the classic bug: it can stop at a cell only by arriving from a direction that ends there.",
      "- The shortest-distance version replaces the queue with Dijkstra keyed by cells rolled, since one roll can cover many cells.",
    ].join("\n"),
    judge: {
      solutionCode: `// BFS over stopping points: roll in each direction until a wall or the edge.
function hasPath(maze, start, destination) {
  const rows = maze.length;
  const cols = maze[0].length;
  const seen = new Set([start[0] * cols + start[1]]);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    if (r === destination[0] && c === destination[1]) return true;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nr = r;
      let nc = c;
      while (nr + dr >= 0 && nr + dr < rows && nc + dc >= 0 && nc + dc < cols && maze[nr + dr][nc + dc] === 0) {
        nr += dr;
        nc += dc;
      }
      const key = nr * cols + nc;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}
`,
      starterCode: `/**
 * @param {number[][]} maze 0 empty, 1 wall
 * @param {number[]} start [row, col]
 * @param {number[]} destination [row, col]
 * @returns {boolean} whether the ball can stop at the destination
 */
function hasPath(maze, start, destination) {
  // Your code here
  return false;
}
`,
      entry: "hasPath",
      tests: [
        {
          name: "Reachable stop",
          input: [[[0, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 1, 1], [0, 0, 0, 0, 0]], [0, 4], [4, 4]],
          expected: true,
        },
        {
          name: "Rolls through but cannot stop",
          input: [[[0, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 1, 1], [0, 0, 0, 0, 0]], [0, 4], [3, 2]],
          expected: false,
        },
        {
          name: "Walled off",
          input: [[[0, 0, 0, 0, 0], [1, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 0, 0, 1], [0, 1, 0, 0, 0]], [4, 3], [0, 1]],
          expected: false,
        },
        { name: "Start is the destination", input: [[[0]], [0, 0], [0, 0]], expected: true },
        { name: "Stops against the edge", input: [[[0, 1], [0, 0]], [0, 0], [1, 0]], expected: true },
      ],
    },
  },
  {
    slug: "path-with-minimum-effort",
    title: "Path With Minimum Effort",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Dijkstra where a path's cost is its largest step, not the sum — or binary search on the allowed step with a BFS.",
    prompt: [
      "A grid of heights is crossed from the top-left to the bottom-right cell, moving four-directionally. A route's effort is the **largest** absolute height difference between two consecutive cells on it. Return the minimum possible effort.",
      "",
      "```",
      "minimumEffortPath([[1, 2, 2], [3, 8, 2], [5, 3, 5]])  ->  2",
      "minimumEffortPath([[1, 2, 3], [3, 8, 4], [5, 3, 5]])  ->  1",
      "```",
    ].join("\n"),
    hints: [
      "Run Dijkstra with the relaxation `max(effortSoFar, |h[u] − h[v]|)` instead of a sum; the first time the target is popped, its effort is minimal.",
      "Alternatively, binary search the answer: can the end be reached using only steps of at most k? That check is a plain BFS.",
    ],
    solution: [
      "## Approach",
      "",
      "Dijkstra's algorithm works for any cost that never decreases along a path, and the maximum step qualifies. Keep a min-heap of (effort, cell), start from the corner at effort 0, and relax each neighbour with the larger of the current effort and the height difference across that edge. The effort recorded when the bottom-right cell is popped is the answer.",
      "",
      "## Complexity",
      "",
      "O(rows × cols × log(rows × cols)) time; O(rows × cols) space. The binary-search version is O(rows × cols × log(maxHeight)).",
      "",
      "## Worth saying out loud",
      "",
      "- A plain BFS is wrong because the cost is not uniform; a sum-based Dijkstra is wrong because the cost is the bottleneck step.",
      "- Union-find over edges sorted by weight gives a third solution: add edges in increasing order until the corners connect.",
    ].join("\n"),
    judge: {
      solutionCode: `// Dijkstra with a bottleneck relaxation; a small binary heap keeps it O(E log V).
function minimumEffortPath(heights) {
  const rows = heights.length;
  const cols = heights[0].length;
  const best = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  best[0][0] = 0;
  const heap = [[0, 0, 0]];
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let m = i;
        const l = 2 * i + 1;
        const r = l + 1;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [effort, r, c] = pop();
    if (r === rows - 1 && c === cols - 1) return effort;
    if (effort > best[r][c]) continue;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const next = Math.max(effort, Math.abs(heights[nr][nc] - heights[r][c]));
      if (next < best[nr][nc]) {
        best[nr][nc] = next;
        push([next, nr, nc]);
      }
    }
  }
  return 0;
}
`,
      starterCode: `/**
 * @param {number[][]} heights
 * @returns {number} the smallest possible largest step from top-left to bottom-right
 */
function minimumEffortPath(heights) {
  // Your code here
  return 0;
}
`,
      entry: "minimumEffortPath",
      tests: [
        { name: "Prompt example", input: [[[1, 2, 2], [3, 8, 2], [5, 3, 5]]], expected: 2 },
        { name: "Around the peak", input: [[[1, 2, 3], [3, 8, 4], [5, 3, 5]]], expected: 1 },
        { name: "A flat corridor exists", input: [[[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]]], expected: 0 },
        { name: "A single cell", input: [[[3]]], expected: 0 },
        { name: "No way around a cliff", input: [[[1, 10], [10, 1]]], expected: 9 },
        { name: "A single row", input: [[[1, 3, 6, 10]]], expected: 4 },
      ],
    },
  },
];
