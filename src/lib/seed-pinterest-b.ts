import type { Problem } from "./types";

// Pinterest onsite bank, part B: the access-log query system, bus routes,
// and exact-jump board reachability with its minimum-moves counterpart.

export const pinterestProblemsB: Problem[] = [
  {
    slug: "access-log-query",
    title: "Access-Log Query System",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Two sorted indexes and a binary search you write by hand.",
    prompt: `You receive access-log records (userId, action, timestamp), appended in non-decreasing timestamp order. Design AccessLog:

\`\`\`
add(userId, action, ts)
getUserActions(userId, start, end)  // that user's actions with
                                    // start <= ts <= end, in time order
countUniqueUsers(start, end)        // distinct users with at least one
                                    // record in [start, end]
\`\`\`

\`\`\`
add: (u1,"view",1) (u2,"click",2) (u1,"save",5) (u3,"view",5) (u1,"view",9)
getUserActions("u1", 2, 9)  => ["save", "view"]
countUniqueUsers(2, 5)      => 3     (u2@2, u1@5, u3@5)
countUniqueUsers(6, 8)      => 0
\`\`\`

Both bounds are **inclusive**. Aim for logarithmic query time in the number of records, and write the binary searches yourself rather than reaching for a library.`,
    hints: [
      "Keep two indexes: per-user lists of (ts, action), and one global timestamp-sorted list of (ts, userId). Appends stay O(1) amortized because input arrives in time order.",
      "getUserActions is lowerBound(start) to upperBound(end) on that user's timestamps — first index with ts >= start, first index with ts > end.",
      "countUniqueUsers: bisect the global list to the window, then count distinct userIds in it with a set.",
    ],
    solution: `## Approach

Two indexes, both already sorted because records arrive in time order: a per-user list of (ts, action), and one global list of (ts, userId). Every query is then a pair of binary searches — lower_bound(start) for the first record at or after start, upper_bound(end) for the first strictly after end — and the slice between them is the answer. Saying the contract out loud ("first index with ts >= start; first with ts > end; the slice is inclusive of both bounds") is what prevents the off-by-one on inclusive bounds.

\`\`\`python
from collections import defaultdict


def lower_bound(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


def upper_bound(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] <= x:
            lo = mid + 1
        else:
            hi = mid
    return lo


class AccessLog:
    def __init__(self):
        self.by_user = defaultdict(lambda: ([], []))  # (timestamps, actions)
        self.all_ts = []
        self.all_users = []

    def add(self, user_id, action, ts):
        stamps, actions = self.by_user[user_id]
        stamps.append(ts)
        actions.append(action)
        self.all_ts.append(ts)
        self.all_users.append(user_id)

    def get_user_actions(self, user_id, start, end):
        stamps, actions = self.by_user[user_id]
        return actions[lower_bound(stamps, start):upper_bound(stamps, end)]

    def count_unique_users(self, start, end):
        lo = lower_bound(self.all_ts, start)
        hi = upper_bound(self.all_ts, end)
        return len(set(self.all_users[lo:hi]))
\`\`\`

add is O(1); getUserActions is O(log m + k); countUniqueUsers is O(log n + w) for a window of w records.

## Worth saying out loud

- Why two indexes: with only the per-user lists, countUniqueUsers has to visit every user; with only the global list, getUserActions scans every record in the window. Each query gets the index it needs.
- At millions of rows the window scan in countUniqueUsers is the part that hurts. Many queries can be answered offline — sort them by end and sweep with a last-seen map — or approximately with HyperLogLog sketches per time bucket.`,
    judge: {
      starterCode: `class AccessLog {
  constructor() {
    // Your state here
  }

  /** Records arrive in non-decreasing ts order. */
  add(userId, action, ts) {
    // Your code here
  }

  /** @returns {string[]} that user's actions with start <= ts <= end */
  getUserActions(userId, start, end) {
    return [];
  }

  /** @returns {number} distinct users with a record in [start, end] */
  countUniqueUsers(start, end) {
    return 0;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let log = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "AccessLog") {
      log = new AccessLog();
      out.push(null);
    } else {
      out.push(log[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Example session",
          input: [
            ["AccessLog", "add", "add", "add", "add", "add", "getUserActions", "countUniqueUsers", "countUniqueUsers"],
            [[], ["u1", "view", 1], ["u2", "click", 2], ["u1", "save", 5], ["u3", "view", 5], ["u1", "view", 9], ["u1", 2, 9], [2, 5], [6, 8]],
          ],
          expected: [null, null, null, null, null, null, ["save", "view"], 3, 0],
        },
        {
          name: "Bounds are inclusive on both ends",
          input: [
            ["AccessLog", "add", "add", "add", "getUserActions", "getUserActions", "countUniqueUsers"],
            [[], ["u1", "a", 10], ["u1", "b", 20], ["u1", "c", 30], ["u1", 10, 30], ["u1", 11, 29], [20, 20]],
          ],
          expected: [null, null, null, null, ["a", "b", "c"], ["b"], 1],
        },
        {
          name: "Duplicate timestamps all count",
          input: [
            ["AccessLog", "add", "add", "add", "getUserActions", "countUniqueUsers"],
            [[], ["u1", "x", 5], ["u1", "y", 5], ["u2", "z", 5], ["u1", 5, 5], [5, 5]],
          ],
          expected: [null, null, null, null, ["x", "y"], 2],
        },
        {
          name: "Unknown user and empty log",
          input: [
            ["AccessLog", "getUserActions", "countUniqueUsers"],
            [[], ["ghost", 0, 100], [0, 100]],
          ],
          expected: [null, [], 0],
        },
        {
          name: "Same user many times is one unique",
          input: [
            ["AccessLog", "add", "add", "add", "countUniqueUsers"],
            [[], ["u1", "a", 1], ["u1", "b", 2], ["u1", "c", 3], [1, 3]],
          ],
          expected: [null, null, null, null, 1],
        },
      ],
    },
  },
  {
    slug: "bus-routes-min-transfers",
    title: "Bus Routes: Minimum Transfers",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "BFS over routes, not stops — clear each stop as you expand it.",
    prompt: `routes[i] is the list of stops bus i visits in a loop, forever. You start at stop source (not on a bus) and want to reach stop target. Return the **minimum number of buses** you must take, or -1 if impossible.

\`\`\`
routes = [[1,2,7], [3,6,7]], source = 1, target = 6
=> 2   (bus 0 to stop 7, then bus 1 to stop 6)

routes = [[7,12], [4,5,15], [6], [15,19], [9,12,13]], source = 15, target = 12
=> -1
\`\`\`

Up to 500 routes and 100,000 total stops; stop ids can reach 1,000,000.`,
    hints: [
      "The graph to search is routes, not stops: taking a bus is one edge, and you can transfer wherever two routes share a stop.",
      "Build stop → routes once. Start the BFS from every route through the source with distance 1.",
      "After expanding a stop, clear its route list — every stop is expanded at most once, which is what keeps the whole search O(total stops).",
    ],
    solution: `## Approach

Model the search over **routes**. From the source, boarding any route through it costs one bus; from a route you can reach every stop it serves, and transfer to any not-yet-boarded route through those stops. BFS layers are therefore "number of buses boarded," which is exactly what's being minimized.

The performance trick: expand each stop once, then empty its stop → routes list. Without that, a hub stop shared by many routes gets rescanned per route and the search degrades to quadratic.

\`\`\`python
from collections import defaultdict, deque


def num_buses_to_destination(routes, source, target):
    if source == target:
        return 0
    stop_to_routes = defaultdict(list)
    for r, stops in enumerate(routes):
        for s in stops:
            stop_to_routes[s].append(r)
    if source not in stop_to_routes or target not in stop_to_routes:
        return -1

    boarded = [False] * len(routes)
    q = deque()
    for r in stop_to_routes[source]:
        boarded[r] = True
        q.append((r, 1))

    while q:
        r, buses = q.popleft()
        for s in routes[r]:
            if s == target:
                return buses
            for nr in stop_to_routes.pop(s, []):
                if not boarded[nr]:
                    boarded[nr] = True
                    q.append((nr, buses + 1))
    return -1
\`\`\`

O(total stops) time and space. The source == target early return matters (zero buses), and so does checking that both stops appear on some route at all.

## Worth saying out loud

- To output the buses taken, store each route's parent route when you enqueue it and walk back from the route that reached the target.
- If transfers cost different waiting times, the layers stop meaning "cost", so swap BFS for Dijkstra over the same route graph.
- A route-to-route adjacency matrix built by intersecting stop sets costs O(R² · S); the stop → routes map gives the same edges for O(total stops).`,
    judge: {
      starterCode: `/**
 * Minimum number of buses from stop source to stop target, or -1.
 * @param {number[][]} routes - routes[i] lists the stops bus i visits
 * @param {number} source
 * @param {number} target
 * @returns {number}
 */
function numBusesToDestination(routes, source, target) {
  // Your code here
  return -1;
}
`,
      entry: "numBusesToDestination",
      tests: [
        {
          name: "One transfer via the shared stop",
          input: [[[1, 2, 7], [3, 6, 7]], 1, 6],
          expected: 2,
        },
        {
          name: "Unreachable component",
          input: [[[7, 12], [4, 5, 15], [6], [15, 19], [9, 12, 13]], 15, 12],
          expected: -1,
        },
        {
          name: "Already there costs zero buses",
          input: [[[1, 2, 3]], 4, 4],
          expected: 0,
        },
        {
          name: "Single bus direct",
          input: [[[1, 2, 3, 4]], 1, 4],
          expected: 1,
        },
        {
          name: "Chain of three routes",
          input: [[[1, 2], [2, 3], [3, 4]], 1, 4],
          expected: 3,
        },
        {
          name: "Source not on any route",
          input: [[[1, 2], [2, 3]], 9, 3],
          expected: -1,
        },
      ],
    },
  },
  {
    slug: "board-exact-jumps",
    title: "Board Reachability with Exact Jumps",
    category: "algorithms",
    difficulty: "easy",
    companies: ["pinterest"],
    summary: "Two out-edges per index: a graph search with a visited array.",
    prompt: `You are given board, an array of non-negative integers, and a start index. From index i you may move **exactly** board[i] steps left or right, staying in bounds. Return whether you can reach the **last** index.

\`\`\`
board = [1, 2, 2, 2, 6, 1], start = 0  => true    (0 -> 1 -> 3 -> 5)
board = [3, 1, 1, 1],       start = 0  => true    (0 -> 3)
board = [2, 0, 1, 3],       start = 1  => false   (board[1] = 0 traps you)
\`\`\``,
    hints: [
      "Each index has at most two out-edges: i - board[i] and i + board[i]. That makes this a plain graph search, not DP.",
      "A zero cell is a self-loop — a visited array is what stops it from spinning forever.",
    ],
    solution: `## Approach

Treat indexes as nodes with at most two out-edges each (i ± board[i], in bounds) and search from start. The one trap: board[i] = 0 makes i its own neighbor, so mark visited when you push, not when you pop.

\`\`\`python
def can_reach_end(board, start):
    n = len(board)
    if n == 0 or not 0 <= start < n:
        return False
    seen = [False] * n
    seen[start] = True
    stack = [start]
    while stack:
        i = stack.pop()
        if i == n - 1:
            return True
        for j in (i - board[i], i + board[i]):
            if 0 <= j < n and not seen[j]:
                seen[j] = True
                stack.append(j)
    return False
\`\`\`

O(n) time and space — each index is pushed once.

## Worth saying out loud

- If the DFS is recursive, a 2000-element chain recurses one call per cell. The explicit stack avoids the overflow.
- Close relatives: when the target is any index holding 0, the same search works with a different stopping test; when moves are "up to" board[i] instead of exactly, a greedy farthest-reach sweep replaces the search.`,
    judge: {
      starterCode: `/**
 * Can you reach the last index moving exactly board[i] steps at a time?
 * @param {number[]} board
 * @param {number} start
 * @returns {boolean}
 */
function canReachEnd(board, start) {
  // Your code here
  return false;
}
`,
      entry: "canReachEnd",
      tests: [
        { name: "Hop chain reaches the end", input: [[1, 2, 2, 2, 6, 1], 0], expected: true },
        { name: "One exact jump", input: [[3, 1, 1, 1], 0], expected: true },
        { name: "Zero cell traps", input: [[2, 0, 1, 3], 1], expected: false },
        { name: "Start on the last index", input: [[5, 2, 7], 2], expected: true },
        { name: "The only path jumps left first", input: [[5, 1, 0, 9, 9, 9], 1], expected: true },
      ],
    },
  },
  {
    slug: "board-exact-jumps-min-moves",
    title: "Minimum Exact Jumps to the Last Index",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "BFS from the start: the layer where the last index appears is the answer.",
    prompt: `You are given board, an array of non-negative integers, and a start index. From index i you may move **exactly** board[i] steps left or right, staying in bounds. Return the **minimum number of moves** to reach the last index, or -1 if it can't be reached.

\`\`\`
board = [1, 2, 2, 2, 6, 1], start = 0  => 3    (0 -> 1 -> 3 -> 5)
board = [2, 0, 1, 3],       start = 1  => -1   (board[1] = 0 traps you)
board = [5, 2, 7],          start = 2  => 0
\`\`\``,
    hints: [
      "Each index has at most two out-edges: i - board[i] and i + board[i]. Every move costs one, so this is an unweighted shortest path.",
      "BFS assigns every reachable index its minimum move count. Mark an index visited when you enqueue it — a zero cell is its own neighbor.",
    ],
    solution: `## Approach

Indexes are nodes with at most two out-edges (i ± board[i], in bounds), and every move costs one, so BFS from start gives each reachable index its minimum move count. Return the distance the moment the last index is dequeued. Marking visited on enqueue keeps a zero cell (its own neighbor) from looping.

\`\`\`python
from collections import deque


def min_moves_to_end(board, start):
    n = len(board)
    if n == 0 or not 0 <= start < n:
        return -1
    dist = [-1] * n
    dist[start] = 0
    q = deque([start])
    while q:
        i = q.popleft()
        if i == n - 1:
            return dist[i]
        for j in (i - board[i], i + board[i]):
            if 0 <= j < n and dist[j] == -1:
                dist[j] = dist[i] + 1
                q.append(j)
    return -1
\`\`\`

O(n) time and space — each index enters the queue once.

## Worth saying out loud

- DFS finds *a* path, not the shortest; BFS layers are the move counts.
- When moves are "up to" board[i] instead of exactly, the greedy "farthest reach per jump" sweep gives the minimum in O(n) without a queue.`,
    judge: {
      starterCode: `/**
 * Minimum moves to reach the last index moving exactly board[i] steps at
 * a time, or -1.
 * @param {number[]} board
 * @param {number} start
 * @returns {number}
 */
function minMovesToEnd(board, start) {
  // Your code here
  return -1;
}
`,
      entry: "minMovesToEnd",
      tests: [
        { name: "Minimum moves on the hop chain", input: [[1, 2, 2, 2, 6, 1], 0], expected: 3 },
        { name: "Trapped means -1", input: [[2, 0, 1, 3], 1], expected: -1 },
        { name: "Start on the last index", input: [[5, 2, 7], 2], expected: 0 },
        { name: "The only path jumps left first", input: [[5, 1, 0, 9, 9, 9], 1], expected: 2 },
        { name: "One exact jump", input: [[3, 1, 1, 1], 0], expected: 1 },
      ],
    },
  },
];
