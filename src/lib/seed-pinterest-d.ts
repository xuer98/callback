import type { Problem } from "./types";

// Pinterest onsite bank, part D: the pixel-grid API problem and roads with
// switches. Both judge against an interface, not raw data — the pixel grid
// arrives as an opaque object built by the driver.

export const pinterestProblemsD: Problem[] = [
  {
    slug: "count-pixel-objects",
    title: "Count Objects in a Pixel Grid via an API",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Flood fill through an opaque API — isSameObject is the catch.",
    prompt: `A pin image is an H × W grid of pixels. You do **not** get the raw pixels; you get an opaque grid object:

\`\`\`
grid.height() -> int
grid.width()  -> int
grid.isBackground(r, c) -> bool
grid.isSameObject(r1, c1, r2, c2) -> bool
    // defined for two 4-adjacent, in-bounds pixels; true iff both are
    // non-background AND belong to the same object
\`\`\`

Count the distinct objects. An object is a maximal set of non-background pixels connected through 4-adjacent pairs for which isSameObject is true. Diagonal contact does not connect — and two touching non-background pixels may still be **different** objects (isSameObject says false).

\`\`\`
A A . B          A B          A .
A . . B                       . A
. . C .
=> 3             => 2         => 2
\`\`\`

H and W up to 2000 — **avoid recursion**; a 2000 × 2000 object blows the stack. Each API call is O(1).

## Follow-ups

- Solve it again with union-find over pixel ids.
- The grid isn't available at all: you drive a robot with move(direction), isBackground(), and isSameObject(direction), starting on an unknown pixel — count the pixels of the object you are standing on (track relative coordinates).`,
    hints: [
      "This is Number of Islands with one twist: adjacency is not \"both non-background\" but \"isSameObject says so.\" Wire your neighbor check through the API and the rest is standard flood fill.",
      "Iterate every cell; when you find a non-background pixel you haven't visited, that is one new object — BFS it to mark the rest.",
      "Use an explicit queue or stack, not recursion — the constraint is written to fail recursive DFS.",
    ],
    solution: `## Approach

Standard component counting, with the adjacency relation swapped out: two 4-adjacent pixels are connected only when the API's isSameObject approves, so touching pixels can still be different objects. Scan every cell; each unvisited non-background pixel starts one component, and an iterative BFS claims the rest of it.

\`\`\`python
from collections import deque


def count_objects(grid):
    h, w = grid.height(), grid.width()
    seen = [[False] * w for _ in range(h)]
    count = 0
    for r in range(h):
        for c in range(w):
            if seen[r][c] or grid.is_background(r, c):
                continue
            count += 1
            seen[r][c] = True
            q = deque([(r, c)])
            while q:
                cr, cc = q.popleft()
                for nr, nc in ((cr - 1, cc), (cr + 1, cc), (cr, cc - 1), (cr, cc + 1)):
                    if (
                        0 <= nr < h
                        and 0 <= nc < w
                        and not seen[nr][nc]
                        and not grid.is_background(nr, nc)
                        and grid.is_same_object(cr, cc, nr, nc)
                    ):
                        seen[nr][nc] = True
                        q.append((nr, nc))
    return count
\`\`\`

O(H × W) time and space — each pixel is enqueued at most once and each adjacent pair is tested a constant number of times. For the union-find follow-up: union every 4-adjacent pair that isSameObject approves, then count distinct roots among non-background pixels. For the robot variant, track your position relative to the start and flood fill over relative coordinates in a visited set.`,
    judge: {
      starterCode: `/**
 * Count distinct objects reachable through the grid API.
 * @param {{
 *   height: () => number,
 *   width: () => number,
 *   isBackground: (r: number, c: number) => boolean,
 *   isSameObject: (r1: number, c1: number, r2: number, c2: number) => boolean,
 * }} grid
 * @returns {number}
 */
function countObjects(grid) {
  // Your code here
  return 0;
}
`,
      entry: "__judgePixels",
      // Builds the opaque API over a label matrix: "." is background, equal
      // letters on 4-adjacent cells are the same object.
      driverCode: `function __judgePixels(rows) {
  const grid = {
    height: () => rows.length,
    width: () => (rows.length === 0 ? 0 : rows[0].length),
    isBackground: (r, c) => rows[r][c] === ".",
    isSameObject: (r1, c1, r2, c2) => {
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;
      const a = rows[r1][c1];
      const b = rows[r2][c2];
      return a !== "." && b !== "." && a === b;
    },
  };
  return countObjects(grid);
}`,
      tests: [
        { name: "Three objects from the write-up", input: [["AA.B", "A..B", "..C."]], expected: 3 },
        { name: "Touching but different objects", input: [["AB"]], expected: 2 },
        { name: "Diagonal contact does not connect", input: [["A.", ".A"]], expected: 2 },
        { name: "Empty grid", input: [[]], expected: 0 },
        { name: "All background", input: [["...", "..."]], expected: 0 },
        { name: "One object wrapping a hole", input: [["AAA", "A.A", "AAA"]], expected: 1 },
        { name: "Same letter twice, separated", input: [["A.A"]], expected: 2 },
      ],
    },
  },
  {
    slug: "roads-with-switches",
    title: "Roads with Switches",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Open roads cost 0, closed cost 1 — textbook 0-1 BFS.",
    prompt: `A city map is a directed graph. Every one-way road (u, v) has a switch and is currently OPEN (drivable) or CLOSED. You may flip closed roads open, each flip spending one of your allowed flips; open roads cost nothing.

\`\`\`
minFlips(roads, src, dst) -> minimum flips to drive src -> dst,
                             or -1 if unreachable even with unlimited flips
canReach(roads, src, dst, k) -> minFlips is in [0, k]
\`\`\`

\`\`\`
roads = [["A","B",true], ["B","C",false], ["A","D",false], ["D","C",false]]
minFlips(roads, "A", "C") => 1        (A->B open, flip B->C)
canReach(roads, "A", "C", 0) => false
canReach(roads, "A", "C", 1) => true
minFlips(roads, "C", "A") => -1       (roads are one-way)
minFlips(roads, "A", "A") => 0
\`\`\`

Up to 10^5 nodes and 10^6 roads; node ids are arbitrary; src or dst may appear on no road at all (then only src == dst is reachable). Expected O(V + E).

## Follow-up (the grid variant, LC 1293)

An m × n grid of 0s and 1s; you may walk through at most k obstacles. Minimum steps corner to corner — every step costs 1, so plain BFS over (r, c, obstaclesUsed) states; and when k >= m + n − 3 the answer is just the Manhattan distance.`,
    hints: [
      "Weights are only 0 (open) and 1 (closed) — that is 0-1 BFS: a deque where 0-cost edges push front and 1-cost edges push back. Dijkstra with a heap also works, one log factor slower.",
      "The deque invariant: distances popped are non-decreasing, so the first time dst pops, its flip count is final.",
      "src == dst is 0 before any graph work — and ids missing from every road only reach themselves.",
    ],
    solution: `## Approach

Shortest path where open roads weigh 0 and closed roads weigh 1 — the textbook 0-1 BFS. Keep a deque of nodes: relaxing an open road pushes the neighbor to the **front** (same distance), a closed road to the **back** (distance + 1). Popped distances are then non-decreasing, exactly like Dijkstra, without the heap.

\`\`\`python
from collections import defaultdict, deque


def min_flips(roads, src, dst):
    if src == dst:
        return 0
    graph = defaultdict(list)
    for u, v, is_open in roads:
        graph[u].append((v, 0 if is_open else 1))

    dist = {src: 0}
    dq = deque([src])
    while dq:
        u = dq.popleft()
        if u == dst:
            return dist[u]
        for v, cost in graph[u]:
            nd = dist[u] + cost
            if v not in dist or nd < dist[v]:
                dist[v] = nd
                if cost == 0:
                    dq.appendleft(v)
                else:
                    dq.append(v)
    return -1


def can_reach(roads, src, dst, k):
    flips = min_flips(roads, src, dst)
    return 0 <= flips <= k
\`\`\`

O(V + E) time and space. Worth saying in the room: why the deque preserves the Dijkstra invariant (front pushes never decrease the head distance), and that the grid follow-up is uniform-cost, so its trick is not 0-1 BFS but the extra state dimension — plus the k >= m + n − 3 shortcut that makes eliminations unlimited in practice.`,
    judge: {
      starterCode: `/**
 * Minimum closed roads to flip to drive src -> dst, or -1.
 * @param {Array<[string, string, boolean]>} roads - directed [u, v, isOpen]
 * @returns {number}
 */
function minFlips(roads, src, dst) {
  // Your code here
  return -1;
}

/** @returns {boolean} true iff minFlips(roads, src, dst) is in [0, k] */
function canReach(roads, src, dst, k) {
  // Your code here
  return false;
}
`,
      entry: "__judgeRoads",
      driverCode: `function __judgeRoads(op, roads, src, dst, k) {
  return op === "min" ? minFlips(roads, src, dst) : canReach(roads, src, dst, k);
}`,
      tests: [
        {
          name: "One flip through the open road",
          input: ["min", [["A", "B", true], ["B", "C", false], ["A", "D", false], ["D", "C", false]], "A", "C", 0],
          expected: 1,
        },
        {
          name: "Zero flips is not enough",
          input: ["reach", [["A", "B", true], ["B", "C", false], ["A", "D", false], ["D", "C", false]], "A", "C", 0],
          expected: false,
        },
        {
          name: "One flip is enough",
          input: ["reach", [["A", "B", true], ["B", "C", false], ["A", "D", false], ["D", "C", false]], "A", "C", 1],
          expected: true,
        },
        {
          name: "Roads are one-way",
          input: ["min", [["A", "B", true], ["B", "C", false], ["A", "D", false], ["D", "C", false]], "C", "A", 0],
          expected: -1,
        },
        {
          name: "Already at the destination",
          input: ["min", [["A", "B", true]], "A", "A", 0],
          expected: 0,
        },
        {
          name: "All-open path beats a shorter closed one",
          input: ["min", [["A", "Z", false], ["A", "B", true], ["B", "C", true], ["C", "Z", true]], "A", "Z", 0],
          expected: 0,
        },
        {
          name: "Node on no road",
          input: ["min", [["A", "B", true]], "A", "Q", 0],
          expected: -1,
        },
      ],
    },
  },
];
