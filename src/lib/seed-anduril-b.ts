import type { Problem } from "./types";

// Anduril bank, part B: pathfinding, one question per problem — straight-line
// distance, BFS around obstacles, A* on a large map, and Dijkstra over terrain
// costs. Judged in JavaScript and Python; the Python judges live in
// seed-python.ts and seed-python-splits.ts.

export const andurilProblemsB: Problem[] = [
  {
    slug: "distance-between-points",
    title: "Distance Between Two Points",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary: "One formula for every dimension: the square root of the summed squared differences.",
    prompt: `Return the straight-line (Euclidean) distance between two points. The points have the same number of coordinates, which may be 2 (a plane), 3 (space) or any other dimension.

\`\`\`
distance([0, 0], [3, 4])        ->  5
distance([1, 2, 2], [0, 0, 0])  ->  3
\`\`\`

Results are compared as numbers, so return the exact floating-point distance.`,
    hints: [
      "In 2-D it's the Pythagorean theorem: sqrt(dx² + dy²). In 3-D add dz². The pattern doesn't stop at three.",
      "Zip the coordinates, sum the squared differences, take one square root — the same line works for any dimension.",
    ],
    solution: `## Approach

The Pythagorean theorem generalizes: the distance is the square root of the sum of squared coordinate differences. Writing it over zipped coordinates instead of named \`x\` and \`y\` means the 3-D version is the same code.

\`\`\`python
import math


def distance(p, q):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(p, q)))
\`\`\`

O(d) for d dimensions.

## Worth saying out loud

- Ask what "distance" means before writing anything: straight line, Manhattan (grid moves), or great-circle (points on a globe). Only the first is this formula.
- When you only compare distances, skip the square root — squared distance preserves the order and avoids floating-point work.
- \`math.hypot\` (and \`Math.hypot\`) computes the same value while avoiding overflow for huge coordinates.`,
    judge: {
      starterCode: `/**
 * Straight-line distance between two points of the same dimension.
 * @param {number[]} p
 * @param {number[]} q
 * @returns {number}
 */
function distance(p, q) {
  // Your code here
  return 0;
}
`,
      entry: "distance",
      tests: [
        { name: "Flat plane", input: [[0, 0], [3, 4]], expected: 5 },
        { name: "In space", input: [[1, 2, 2], [0, 0, 0]], expected: 3 },
        { name: "Same point", input: [[7, -2], [7, -2]], expected: 0 },
        { name: "Negative coordinates", input: [[-1, -1], [2, 3]], expected: 5 },
        { name: "One dimension", input: [[7], [3]], expected: 4 },
        { name: "Four dimensions", input: [[1, 1, 1, 1], [0, 0, 0, 0]], expected: 2 },
      ],
    },
  },
  {
    slug: "shortest-path-with-obstacles",
    title: "Shortest Path Around Obstacles",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Unit steps on a grid: BFS, and the first arrival is the answer.",
    prompt: `The world is a grid: \`0\` is a free cell and \`1\` is an obstacle you can't pass through. Movement is one cell per step — up, down, left or right, plus the four diagonals when \`diagonal\` is true. Return the number of steps on the shortest path from \`src\` to \`dst\` (each given as \`[row, col]\`), or \`-1\` when there is no path.

\`\`\`
grid = [[0, 1, 0],
        [0, 1, 0],
        [0, 0, 0]]
shortestPathGrid(grid, [0, 0], [0, 2], false)  ->  6

shortestPathGrid([[0, 0], [0, 0]], [0, 0], [1, 1], true)  ->  1
\`\`\`

A start or destination on an obstacle has no path.`,
    hints: [
      "Obstacles plus unit steps means BFS: the frontier expands in order of distance, so the first time you pop the destination, its depth is the answer.",
      "Mark cells visited when you enqueue them, not when you pop them, or the queue fills with duplicates.",
    ],
    solution: `## Approach

Every step costs the same, so breadth-first search from \`src\` visits cells in order of distance; the first time it reaches \`dst\`, that depth is the shortest path. The only thing \`diagonal\` changes is the list of neighbor offsets.

\`\`\`python
from collections import deque


def shortest_path_grid(grid, src, dst, diagonal=False):
    R, C = len(grid), len(grid[0])
    src, dst = tuple(src), tuple(dst)
    if grid[src[0]][src[1]] or grid[dst[0]][dst[1]]:
        return -1
    if diagonal:
        dirs = [(dr, dc) for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0)]
    else:
        dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    q, seen = deque([(src, 0)]), {src}
    while q:
        (r, c), d = q.popleft()
        if (r, c) == dst:
            return d
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and not grid[nr][nc] and (nr, nc) not in seen:
                seen.add((nr, nc))
                q.append(((nr, nc), d + 1))
    return -1
\`\`\`

O(R·C) time and space. To return the path itself, store \`parent[(nr, nc)] = (r, c)\` on first visit and walk back from \`dst\`.

## Worth saying out loud

- Counting a diagonal step as 1 is a modeling choice; if it should cost √2, steps stop being uniform and BFS becomes Dijkstra.
- On a huge map with many queries, BFS explores everything within the answer's radius; A* with an admissible heuristic reaches the same answer while expanding far fewer cells.`,
    judge: {
      starterCode: `/**
 * Grid of 0 (free) / 1 (blocked); src and dst are [row, col]. Steps along
 * the shortest path (8-directional when diagonal is true), or -1.
 * @param {number[][]} grid
 * @param {[number, number]} src
 * @param {[number, number]} dst
 * @param {boolean} diagonal
 * @returns {number}
 */
function shortestPathGrid(grid, src, dst, diagonal = false) {
  // Your code here
  return -1;
}
`,
      entry: "shortestPathGrid",
      tests: [
        { name: "Open grid", input: [[[0, 0], [0, 0]], [0, 0], [1, 1], false], expected: 2 },
        { name: "Diagonal steps", input: [[[0, 0], [0, 0]], [0, 0], [1, 1], true], expected: 1 },
        { name: "Walled off", input: [[[0, 1], [1, 0]], [0, 0], [1, 1], false], expected: -1 },
        { name: "Around a wall", input: [[[0, 1, 0], [0, 1, 0], [0, 0, 0]], [0, 0], [0, 2], false], expected: 6 },
        { name: "Start on an obstacle", input: [[[1, 0]], [0, 0], [0, 1], false], expected: -1 },
        { name: "Already there", input: [[[0]], [0, 0], [0, 0], false], expected: 0 },
      ],
    },
  },
  {
    slug: "a-star-grid-search",
    title: "Shortest Path on a Huge Map with A*",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "BFS's answer, found by expanding cells in order of cost-so-far plus an admissible estimate.",
    prompt: `The map is a huge grid (\`0\` = free, \`1\` = obstacle) and many routes have to be computed on it, so exploring every cell within reach of the start is too slow. Movement is one cell per step, up, down, left or right.

Implement **A\\*** search: return the length of the shortest path from \`src\` to \`dst\` (each \`[row, col]\`), or \`-1\` when there is none, while expanding cells in order of distance-so-far plus a heuristic estimate of the distance left.

\`\`\`
grid = [[0, 1, 0],
        [0, 1, 0],
        [0, 0, 0]]
astarGrid(grid, [0, 0], [0, 2])  ->  6
\`\`\`

The tests check the answer, which must match BFS exactly — a heuristic that overestimates will fail some of them.`,
    hints: [
      "A* is Dijkstra with a priority of g + h: g is the steps taken so far, h estimates the steps left. With 4-directional unit steps, the Manhattan distance to dst never overestimates.",
      "An admissible heuristic (never overestimating) keeps A* optimal. Keep the best g seen per cell and skip stale heap entries.",
    ],
    solution: `## Approach

A* orders the frontier by \`f = g + h\`: \`g\` is the true cost from the start, \`h\` a lower bound on the cost to the goal. With 4-directional unit steps the Manhattan distance is such a bound, so the first time the goal is popped, its \`g\` is optimal — the same answer BFS gives, reached by expanding mostly the cells that point toward the goal.

\`\`\`python
import heapq
import math


def astar_grid(grid, src, dst):
    R, C = len(grid), len(grid[0])
    src, dst = tuple(src), tuple(dst)
    if grid[src[0]][src[1]] or grid[dst[0]][dst[1]]:
        return -1

    def h(r, c):
        return abs(r - dst[0]) + abs(c - dst[1])   # Manhattan: admissible for 4-dir

    best = {src: 0}
    pq = [(h(*src), 0, src)]
    while pq:
        f, g, (r, c) = heapq.heappop(pq)
        if (r, c) == dst:
            return g
        if g > best.get((r, c), math.inf):
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and not grid[nr][nc]:
                ng = g + 1
                if ng < best.get((nr, nc), math.inf):
                    best[(nr, nc)] = ng
                    heapq.heappush(pq, (ng + h(nr, nc), ng, (nr, nc)))
    return -1
\`\`\`

Worst case O(RC log RC), like Dijkstra; in practice the heuristic prunes most of the map.

## Worth saying out loud

- The heuristic must be **admissible** or A* stops being optimal: Manhattan for 4-directional moves, Chebyshev for 8-directional, Euclidean in continuous space.
- Beyond A*: tile the map for hierarchical pathfinding, precompute landmarks for tighter bounds, and use D*-Lite for incremental re-planning when the world changes mid-route.`,
    judge: {
      starterCode: `/**
 * A* over a grid of 0 (free) / 1 (blocked), 4-directional unit steps.
 * Length of the shortest path from src to dst ([row, col]), or -1.
 * @param {number[][]} grid
 * @param {[number, number]} src
 * @param {[number, number]} dst
 * @returns {number}
 */
function astarGrid(grid, src, dst) {
  // Your code here
  return -1;
}
`,
      entry: "astarGrid",
      tests: [
        { name: "A* agrees with BFS", input: [[[0, 1, 0], [0, 1, 0], [0, 0, 0]], [0, 0], [0, 2]], expected: 6 },
        { name: "Straight shot", input: [[[0, 0, 0, 0]], [0, 0], [0, 3]], expected: 3 },
        { name: "Walled off", input: [[[0, 1], [1, 0]], [0, 0], [1, 1]], expected: -1 },
        {
          name: "Dead end pulls the heuristic the wrong way",
          input: [[[0, 0, 0, 0, 0], [1, 1, 1, 1, 0], [0, 0, 0, 1, 0], [0, 1, 0, 0, 0], [0, 1, 1, 1, 1]], [2, 0], [0, 0]],
          expected: 12,
        },
        {
          name: "A wide open map",
          input: [Array.from({ length: 40 }, () => Array(40).fill(0)), [0, 0], [39, 39]],
          expected: 78,
        },
      ],
    },
  },
  {
    slug: "shortest-path-terrain-costs",
    title: "Shortest Path with Terrain Costs",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Unequal step costs turn BFS's queue into Dijkstra's priority queue.",
    prompt: `Each cell of a grid has a **terrain cost**: \`cost[r][c]\` is what it costs to enter that cell, and \`-1\` marks an obstacle. Movement is up, down, left or right. Return the cheapest total cost of a path from \`src\` to \`dst\` (each \`[row, col]\`), or \`-1\` when there is none. The start cell's own cost is not paid.

\`\`\`
cost = [[0, 9, 1],
        [1, 9, 1],
        [1, 1, 1]]
dijkstraGrid(cost, [0, 0], [0, 2])  ->  6     (down and around beats crossing the 9s)

dijkstraGrid([[0, 2, 1]], [0, 0], [0, 2])  ->  3
\`\`\``,
    hints: [
      "With unequal costs, the first time BFS reaches a cell is no longer the cheapest. Order the frontier by accumulated cost instead — that's Dijkstra.",
      "Push (cost so far, cell) onto a min-heap; when a popped entry is worse than the best recorded for its cell, skip it.",
    ],
    solution: `## Approach

Dijkstra's algorithm over the grid: a min-heap of (cost so far, cell). Popping a cell for the first time with its best cost fixes it, because every other path to it costs at least as much. Entering a neighbor adds that neighbor's terrain cost; obstacles are skipped, and stale heap entries (worse than the recorded best) are ignored.

\`\`\`python
import heapq
import math


def dijkstra_grid(cost, src, dst):
    R, C = len(cost), len(cost[0])
    src, dst = tuple(src), tuple(dst)
    if cost[dst[0]][dst[1]] < 0:
        return -1
    dist, pq = {src: 0}, [(0, src)]
    while pq:
        d, (r, c) = heapq.heappop(pq)
        if (r, c) == dst:
            return d
        if d > dist[(r, c)]:
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and cost[nr][nc] >= 0:
                nd = d + cost[nr][nc]
                if nd < dist.get((nr, nc), math.inf):
                    dist[(nr, nc)] = nd
                    heapq.heappush(pq, (nd, (nr, nc)))
    return -1
\`\`\`

O(RC log RC) time, O(RC) space.

## Worth saying out loud

- Say exactly what changed from the unit-cost version: the queue became a priority queue keyed by accumulated cost.
- Negative costs break Dijkstra → Bellman-Ford. Rare for terrain; name it and move on.
- Adding an admissible heuristic (the minimum terrain cost times the Manhattan distance) turns this into A*.`,
    judge: {
      starterCode: `/**
 * cost[r][c] is the cost to enter a cell, -1 = obstacle. Cheapest path cost
 * from src to dst ([row, col]), or -1. The start cell's cost isn't paid.
 * @param {number[][]} cost
 * @param {[number, number]} src
 * @param {[number, number]} dst
 * @returns {number}
 */
function dijkstraGrid(cost, src, dst) {
  // Your code here
  return -1;
}
`,
      entry: "dijkstraGrid",
      tests: [
        { name: "Terrain: the detour is cheaper", input: [[[0, 9, 1], [1, 9, 1], [1, 1, 1]], [0, 0], [0, 2]], expected: 6 },
        { name: "Terrain: straight through", input: [[[0, 2, 1]], [0, 0], [0, 2]], expected: 3 },
        { name: "Start equals destination", input: [[[5, 5], [5, 5]], [1, 1], [1, 1]], expected: 0 },
        { name: "Obstacles cut it off", input: [[[0, -1], [-1, 3]], [0, 0], [1, 1]], expected: -1 },
        { name: "An obstacle forces the long way", input: [[[0, 1, 1], [-1, -1, 1], [1, 1, 1]], [0, 0], [2, 0]], expected: 6 },
      ],
    },
  },
];
