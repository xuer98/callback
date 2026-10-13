import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part A: grid searches — rotting
// oranges, the largest island, and the largest island after one flip; part N
// continues them. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-g.ts.

export const snowflakeLcProblemsA: Problem[] = [
  {
    slug: "rotting-oranges",
    title: "Rotting Oranges",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Multi-source BFS: every rotten orange starts in the queue, and each level of the search is one minute.",
    prompt: [
      "A grid holds `0` (empty), `1` (a fresh orange) and `2` (a rotten orange). Every minute, each fresh orange that is four-directionally adjacent to a rotten one becomes rotten. Return the number of minutes until no fresh orange remains, or `-1` if that never happens.",
      "",
      "```",
      "orangesRotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]])  ->  4",
      "orangesRotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]])  ->  -1   // the bottom-left orange is cut off",
      "orangesRotting([[0, 2]])                           ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Seed a queue with every rotten orange and count the fresh ones. Expand the queue one level at a time; each level is one minute.",
      "Stop when the fresh count hits zero. If the queue empties first, something fresh was unreachable.",
    ],
    solution: [
      "## Approach",
      "",
      "All rotten oranges spread at once, so they are all sources of one breadth-first search. Put every rotten cell in the queue, count the fresh cells, then process the queue level by level, rotting each fresh neighbour and decrementing the count. The number of levels processed before the count reaches zero is the answer; if the queue runs dry with fresh oranges left, return -1.",
      "",
      "## Complexity",
      "",
      "O(rows × cols) time and space: each cell enters the queue at most once.",
      "",
      "## Worth saying out loud",
      "",
      "- Level-by-level processing is what makes the minute count right; a plain queue with no level boundary counts cells, not minutes.",
      "- A grid with no fresh orange is 0 minutes, not -1 — check the count before the loop.",
      "- [Nearest Bathroom for Every Desk](/problems/nearest-bathroom-distances) is the same multi-source search returning each distance instead of the last one.",
    ].join("\n"),
    judge: {
      solutionCode: `// Multi-source BFS from every rotten orange; each level is a minute.
function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const state = grid.map((row) => row.slice());
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (state[r][c] === 2) queue.push([r, c]);
      else if (state[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  let head = 0;
  while (fresh > 0 && head < queue.length) {
    const levelEnd = queue.length;
    minutes++;
    while (head < levelEnd) {
      const [r, c] = queue[head++];
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && state[nr][nc] === 1) {
          state[nr][nc] = 2;
          fresh--;
          queue.push([nr, nc]);
        }
      }
    }
  }
  return fresh === 0 ? minutes : -1;
}
`,
      starterCode: `/**
 * @param {number[][]} grid 0 empty, 1 fresh, 2 rotten
 * @returns {number} minutes until nothing is fresh, or -1
 */
function orangesRotting(grid) {
  // Your code here
  return -1;
}
`,
      entry: "orangesRotting",
      tests: [
        { name: "Prompt example", input: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], expected: 4 },
        { name: "An unreachable orange", input: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], expected: -1 },
        { name: "Nothing fresh", input: [[[0, 2]]], expected: 0 },
        { name: "No rotten orange at all", input: [[[1]]], expected: -1 },
        { name: "Only empty cells", input: [[[0, 0], [0, 0]]], expected: 0 },
        { name: "Two sources meet in the middle", input: [[[2, 1, 1], [1, 1, 1], [0, 1, 2]]], expected: 2 },
      ],
    },
  },
  {
    slug: "max-area-of-island",
    title: "Max Area of Island",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Flood fill from every unvisited land cell and keep the largest count.",
    prompt: [
      "Given a grid of `0` (water) and `1` (land), an island is a maximal group of land cells connected four-directionally. Return the area of the largest island, or `0` if there is no land.",
      "",
      "```",
      "maxAreaOfIsland([[1, 1, 0], [0, 1, 0], [0, 0, 1]])  ->  3",
      "maxAreaOfIsland([[0, 0]])                           ->  0",
      "```",
    ].join("\n"),
    hints: [
      "Scan the grid; from each unvisited land cell, flood fill (DFS or BFS) counting cells and marking them visited as you go.",
      "Mark visited cells in a copy rather than mutating the input; the count of each fill is one island's area.",
    ],
    solution: [
      "## Approach",
      "",
      "One pass over the grid. Each time an unvisited land cell appears, flood fill from it — an explicit stack avoids recursion limits — marking cells as seen and counting them. The largest count wins.",
      "",
      "## Complexity",
      "",
      "O(rows × cols) time; O(rows × cols) space for the visited marks and the stack.",
      "",
      "## Worth saying out loud",
      "",
      "- [Number of Islands](/problems/number-of-islands) is the same fill counting islands instead of measuring them; [Making a Large Island](/problems/making-a-large-island) labels each island so a flipped cell can sum its neighbours.",
      "- Recursion depth equals the island size in the worst case, which is why the stack is explicit.",
    ].join("\n"),
    judge: {
      solutionCode: `// Iterative flood fill from each unvisited land cell.
function maxAreaOfIsland(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = grid.map((row) => row.map(() => false));
  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 1 || seen[r][c]) continue;
      let area = 0;
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        area++;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen[nr][nc]) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
      best = Math.max(best, area);
    }
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[][]} grid 0 water, 1 land
 * @returns {number} the largest island's area
 */
function maxAreaOfIsland(grid) {
  // Your code here
  return 0;
}
`,
      entry: "maxAreaOfIsland",
      tests: [
        { name: "Prompt example", input: [[[1, 1, 0], [0, 1, 0], [0, 0, 1]]], expected: 3 },
        { name: "All water", input: [[[0, 0]]], expected: 0 },
        { name: "One cell of land", input: [[[1]]], expected: 1 },
        { name: "All land", input: [[[1, 1], [1, 1]]], expected: 4 },
        { name: "Diagonals do not connect", input: [[[1, 0], [0, 1]]], expected: 1 },
        {
          name: "A larger map",
          input: [[[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]]],
          expected: 6,
        },
      ],
    },
  },
  {
    slug: "making-a-large-island",
    title: "Making a Large Island",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Label every island with its area first; then each water cell is worth 1 plus the areas of the distinct islands it touches.",
    prompt: [
      "Given an `n × n` grid of `0` and `1`, you may change at most one `0` to `1`. Return the largest island (four-directionally connected `1`s) that can result.",
      "",
      "```",
      "largestIsland([[1, 0], [0, 1]])  ->  3",
      "largestIsland([[1, 1], [1, 0]])  ->  4",
      "largestIsland([[1, 1], [1, 1]])  ->  4    // nothing to flip, the whole grid is one island",
      "```",
    ].join("\n"),
    hints: [
      "Flood fill once to give every island an id and record its area.",
      "For each water cell, collect the distinct ids of its four neighbours and sum their areas plus one. If there is no water, the answer is the whole grid.",
    ],
    solution: [
      "## Approach",
      "",
      "Two passes. The first labels each island with an id (ids start at 2 so they never collide with 0 and 1) and stores its area. The second visits every water cell, gathers the distinct ids among its four neighbours — a set, because two neighbours may belong to the same island — and scores the cell as 1 plus the sum of those areas. The answer is the best score, or the largest existing island if the grid has no water.",
      "",
      "## Complexity",
      "",
      "O(n²) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Deduplicating neighbour ids is the whole trick: a water cell between two arms of the same island must not count it twice.",
      "- Trying every flip with a fresh flood fill is O(n⁴); the labelling pass is what makes the second pass constant per cell.",
    ].join("\n"),
    judge: {
      solutionCode: `// Label islands with ids >= 2, then score each water cell by its distinct neighbours.
function largestIsland(grid) {
  const n = grid.length;
  const label = grid.map((row) => row.slice());
  const area = new Map();
  let nextId = 2;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (label[r][c] !== 1) continue;
      const id = nextId++;
      let size = 0;
      const stack = [[r, c]];
      label[r][c] = id;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        size++;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && label[nr][nc] === 1) {
            label[nr][nc] = id;
            stack.push([nr, nc]);
          }
        }
      }
      area.set(id, size);
    }
  }
  let best = Math.max(0, ...area.values());
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (label[r][c] !== 0) continue;
      const ids = new Set();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && label[nr][nc] >= 2) ids.add(label[nr][nc]);
      }
      let size = 1;
      for (const id of ids) size += area.get(id);
      best = Math.max(best, size);
    }
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[][]} grid n x n of 0 and 1
 * @returns {number} the largest island after flipping at most one 0
 */
function largestIsland(grid) {
  // Your code here
  return 0;
}
`,
      entry: "largestIsland",
      tests: [
        { name: "Diagonal pair", input: [[[1, 0], [0, 1]]], expected: 3 },
        { name: "One missing corner", input: [[[1, 1], [1, 0]]], expected: 4 },
        { name: "Already full", input: [[[1, 1], [1, 1]]], expected: 4 },
        { name: "All water", input: [[[0, 0], [0, 0]]], expected: 1 },
        { name: "Four islands around a flip", input: [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], expected: 4 },
        { name: "Both neighbours are the same island", input: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: 9 },
      ],
    },
  },
];
