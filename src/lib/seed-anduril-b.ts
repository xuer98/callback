import type { Problem } from "./types";

// Anduril phone-screen bank, part B: pathfinding phases, the sensor-network
// graph question, and the rod-cutting DP reported on a senior screen.

export const andurilProblemsB: Problem[] = [
  {
    slug: "shortest-path-with-obstacles",
    title: "Shortest Path, Then Obstacles",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Euclid, then BFS, then A*, then Dijkstra — the problem grows a phase at a time.",
    prompt: `## Phase 1

Find the shortest distance between two points.

## Phase 2

What if the points are in space (3-D)?

## Phase 3

The world is a grid now (\`0\` = free, \`1\` = obstacle), movement is one cell per step, and there are **obstacles you can't pass through**. Return the length of the shortest path from \`src\` to \`dst\`, or \`-1\`.

## Phase 4

The map is huge and you're computing many routes. How do you avoid exploring most of it?

## Phase 5

Cells have **terrain costs** instead of unit steps. What changes?

## Worth asking out loud

Grid or continuous space? 4- or 8-directional movement? Are obstacles cells or polygons? Unit cost per step or terrain cost? Length or the actual path?`,
    hints: [
      "Phases 1–2 are one formula — Euclidean distance generalizes to any dimension with the same line of code. The interviewer is watching whether you ask what changed.",
      "Obstacles + unit steps = BFS: first time you pop the destination, the depth is the answer. 8-directional movement makes diagonal steps length √2, not 1 — say it.",
      "Big map → A* with an admissible heuristic (Manhattan for 4-dir, Chebyshev for 8-dir). Terrain costs → Dijkstra: same loop, priority queue keyed by accumulated cost.",
    ],
    solution: `## Approach

Each phase swaps the algorithm, not the code shape. Free space is a formula; a grid with obstacles and unit steps is BFS (the frontier expands in distance order, so the first arrival is optimal); a big map wants A* (same answer, far fewer cells, provided the heuristic never overestimates); terrain costs want Dijkstra (BFS's queue becomes a priority queue).

\`\`\`python
import heapq, math
from collections import deque
from typing import List, Tuple

# Phase 1 + 2: works for any dimension
def euclid(p: Tuple[float, ...], q: Tuple[float, ...]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(p, q)))

# Phase 3: grid with obstacles -> BFS (unit cost). 0 = free, 1 = blocked.
def shortest_path_grid(grid: List[List[int]], src: Tuple[int, int], dst: Tuple[int, int],
                       diagonal: bool = False) -> int:
    R, C = len(grid), len(grid[0])
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

# Phase 4: big map -> A* (same answer, explores far fewer cells)
def astar_grid(grid: List[List[int]], src: Tuple[int, int], dst: Tuple[int, int]) -> int:
    R, C = len(grid), len(grid[0])
    h = lambda r, c: abs(r - dst[0]) + abs(c - dst[1])   # Manhattan: admissible for 4-dir
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

# Phase 5: terrain cost -> Dijkstra. cost[r][c] = cost to enter, -1 = obstacle.
def dijkstra_grid(cost: List[List[int]], src: Tuple[int, int], dst: Tuple[int, int]) -> int:
    R, C = len(cost), len(cost[0])
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

## Complexity

BFS O(R·C); Dijkstra O(RC log RC); A* is bounded by BFS and usually far under it. Path reconstruction for any of them: store \`parent[(nr, nc)] = (r, c)\` on first visit and walk back from \`dst\`.

## Worth saying out loud

- The heuristic must be **admissible** or A* stops being optimal: Manhattan for 4-dir, Chebyshev for 8-dir, Euclid in continuous space.
- Negative costs break Dijkstra → Bellman-Ford (rare in practice; name it and move on).
- Continuous space with polygon obstacles → visibility graph + Dijkstra, O(V² log V). Mention, don't implement.
- Scale answers: tile the map, hierarchical pathfinding, and D*-Lite for incremental re-planning when the world changes mid-flight.`,
  },
  {
    slug: "sensor-network-cycles",
    title: "Sensor Network: Cycles and Components",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Kahn or three colors for directed cycles; Union-Find hands you components for free.",
    prompt: `Given a network of connected field sensors, write an algorithm to **detect cycles** and **identify disconnected components**, using DFS or Union-Find.

Edges arrive as \`(u, v)\` pairs over \`n\` sensors.

## Phase 2

The links are **directed** (data flows one way — think dependencies). Detect whether a cycle exists, and if none does, produce an order in which the sensors can be processed.

## Worth asking out loud

Directed or undirected? Node ids ints or strings? Self-loops or duplicate edges possible? Do I return a boolean, the cycle itself, or the components?`,
    hints: [
      "Undirected: Union-Find does both jobs in one pass — an edge whose endpoints already share a root closes a cycle, and components = n minus successful unions.",
      "Directed: Kahn's algorithm (peel indegree-0 nodes); if you can't pop all n, the leftovers are exactly the nodes stuck in cycles. DFS three-coloring finds a cycle as a back edge to a GRAY node and yields a topological order for free.",
    ],
    solution: `## Approach

Pick the tool by edge direction. Undirected: Union-Find answers both questions in a single pass over the edges. Directed: Kahn's algorithm (BFS by indegree) or a three-color DFS — the DFS also emits a topological order, which is the natural answer to "what order can I process sensors in?"

\`\`\`python
from collections import deque
from typing import List, Tuple

# Directed: Kahn's algorithm. Cycle <=> some node never reaches indegree 0.
def has_cycle_directed(n: int, edges: List[Tuple[int, int]]) -> bool:
    adj, indeg = [[] for _ in range(n)], [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    seen = 0
    while q:
        u = q.popleft()
        seen += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return seen != n

# Directed: DFS three-color, also yields a topological order. [] if cyclic.
def topo_order(n: int, edges: List[Tuple[int, int]]) -> List[int]:
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    WHITE, GRAY, BLACK = 0, 1, 2
    color, order = [WHITE] * n, []

    def dfs(u: int) -> bool:
        color[u] = GRAY
        for v in adj[u]:
            if color[v] == GRAY:           # back edge -> cycle
                return False
            if color[v] == WHITE and not dfs(v):
                return False
        color[u] = BLACK
        order.append(u)
        return True

    for i in range(n):
        if color[i] == WHITE and not dfs(i):
            return []
    return order[::-1]

# Undirected: Union-Find gives cycle + component count in one pass.
class DSU:
    def __init__(self, n: int):
        self.p, self.sz = list(range(n)), [1] * n

    def find(self, x: int) -> int:
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]  # path halving
            x = self.p[x]
        return x

    def union(self, a: int, b: int) -> bool:
        a, b = self.find(a), self.find(b)
        if a == b:
            return False                   # edge closes a cycle
        if self.sz[a] < self.sz[b]:
            a, b = b, a
        self.p[b] = a
        self.sz[a] += self.sz[b]
        return True

def undirected_cycle_and_components(n: int, edges: List[Tuple[int, int]]) -> Tuple[bool, int]:
    dsu, cyclic, comps = DSU(n), False, n
    for u, v in edges:
        if dsu.union(u, v):
            comps -= 1
        else:
            cyclic = True
    return cyclic, comps
\`\`\`

## Complexity

Kahn and DFS: O(V + E). Union-Find: O(E · α(V)) — effectively linear — and it's naturally streaming-friendly: edges can arrive one at a time.

## Worth saying out loud

- Kahn's leftovers (nodes never popped) are precisely the nodes involved in or downstream of cycles — useful when the follow-up is "which sensors are stuck?"
- String ids → put a \`dict\` id-mapper in front of the DSU; don't rewrite it.
- "Which link do we remove to break the cycle?" is Redundant Connection: the first edge whose \`union\` returns False.
- Deleting edges over time is the hard direction — offline reverse-union (process deletions backwards as unions) is the phrase to say; link-cut trees are the mention-only escalation.`,
  },
  {
    slug: "rod-cutting-profit",
    title: "Rod Cutting",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Unbounded knapsack in disguise — say that out loud, then roll a 1-D table.",
    prompt: `You have a rod of length \`n\` and a price table: \`prices[i]\` is what a piece of length \`i + 1\` sells for. Cut the rod (or don't) to **maximize revenue**, and report the cuts.

\`\`\`
prices = [1, 5, 8, 9, 10, 17, 17, 20], n = 8
->  22   (pieces 2 + 6: 5 + 17)
\`\`\`

Reported on a **senior** phone screen — expect the follow-ups, not just the base recurrence.

## Phase 2

Every cut costs \`cut_cost\` (selling the rod whole makes zero cuts). Maximize net profit.

## Phase 3

You may produce **at most k pieces**.

## Worth asking out loud

Can the price table be shorter than \`n\` (lengths beyond it unsellable)? Revenue only, or the actual cuts? Cost per cut? A limit on pieces?`,
    hints: [
      "best[L] = max over first-piece lengths p of prices[p-1] + best[L-p]. One dimension, filled left to right — this is unbounded knapsack with weight = length, value = price.",
      "To recover the cuts, store the winning first-piece length per L and walk it back. For \"at most k pieces\", add a piece-count dimension: dp[k][L] from dp[k-1][L-p].",
    ],
    solution: `## Approach

Classic unbounded knapsack: for each length, try every legal first piece and recurse on the remainder. The 1-D table plus a \`choice\` array (the winning first piece per length) gives both the revenue and the reconstruction. The follow-ups bolt on cleanly: a per-cut cost turns the recurrence's "+ price" into "+ price − cut_cost" with the whole-rod sale seeded first; a piece limit adds a dimension.

\`\`\`python
import math
from typing import List, Tuple

def rod_cutting(prices: List[int], n: int) -> Tuple[int, List[int]]:
    """best[L] = max revenue for length L. Returns (revenue, piece lengths)."""
    best, choice = [0] * (n + 1), [0] * (n + 1)
    for length in range(1, n + 1):
        for piece in range(1, min(length, len(prices)) + 1):
            cand = prices[piece - 1] + best[length - piece]
            if cand > best[length]:
                best[length], choice[length] = cand, piece
    cuts, rem = [], n
    while rem > 0:                          # reconstruct
        cuts.append(choice[rem])
        rem -= choice[rem]
    return best[n], cuts

def rod_cutting_with_cost(prices: List[int], n: int, cut_cost: int) -> int:
    """Phase 2: each cut costs cut_cost (selling a rod whole = 0 cuts)"""
    best = [0] * (n + 1)
    for length in range(1, n + 1):
        best[length] = prices[length - 1] if length <= len(prices) else 0
        for piece in range(1, min(length - 1, len(prices)) + 1):
            best[length] = max(best[length], prices[piece - 1] - cut_cost + best[length - piece])
    return best[n]

def rod_cutting_limited(prices: List[int], n: int, max_pieces: int) -> int:
    """Phase 3: at most k pieces -> add a dimension"""
    NEG = -math.inf
    dp = [[NEG] * (n + 1) for _ in range(max_pieces + 1)]
    dp[0][0] = 0
    for k in range(1, max_pieces + 1):
        for length in range(n + 1):
            dp[k][length] = dp[k - 1][length]
            for piece in range(1, min(length, len(prices)) + 1):
                if dp[k - 1][length - piece] != NEG:
                    dp[k][length] = max(dp[k][length], dp[k - 1][length - piece] + prices[piece - 1])
    return dp[max_pieces][n]
\`\`\`

## Complexity

O(n · min(n, len(prices))) time and O(n) space; the piece-limited version is O(n·k) space. Sanity example to trace out loud: \`prices=[1,5,8,9,10,17,17,20], n=8 → 22\` from pieces 2 + 6.

## Worth saying out loud

- Name the shape — "unbounded knapsack, weight = piece length, value = price" — before writing code; the senior signal is recognizing it, not deriving it.
- Top-down with \`@lru_cache\` is the same recurrence; write whichever is fastest for you, mention the other.
- "Input is massive" here means the table: it rolls to O(n) because \`best[length]\` only reads earlier entries; memoize only reachable states in the top-down form.`,
  },
];
