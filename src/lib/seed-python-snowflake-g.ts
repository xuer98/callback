import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake LeetCode-tag bank, parts A and B (grid
// searches and graphs), keyed by slug and merged into judge.python by the
// seed script like seed-python.ts.

export const snowflakePythonJudgesG: Record<string, JudgeLanguage> = {
  "rotting-oranges": {
    entry: "oranges_rotting",
    starterCode: `def oranges_rotting(grid):
    """0 empty, 1 fresh, 2 rotten. Minutes until nothing is fresh, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `from collections import deque


def oranges_rotting(grid):
    # Multi-source BFS from every rotten orange; each level is a minute.
    rows, cols = len(grid), len(grid[0])
    state = [row[:] for row in grid]
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if state[r][c] == 2:
                queue.append((r, c))
            elif state[r][c] == 1:
                fresh += 1
    minutes = 0
    while fresh and queue:
        minutes += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and state[nr][nc] == 1:
                    state[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
    return minutes if fresh == 0 else -1
`,
  },
  "max-area-of-island": {
    entry: "max_area_of_island",
    starterCode: `def max_area_of_island(grid):
    """0 water, 1 land. The largest island's area."""
    # Your code here
    return 0
`,
    solutionCode: `def max_area_of_island(grid):
    # Iterative flood fill from each unvisited land cell.
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1 or seen[r][c]:
                continue
            area = 0
            stack = [(r, c)]
            seen[r][c] = True
            while stack:
                cr, cc = stack.pop()
                area += 1
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                        seen[nr][nc] = True
                        stack.append((nr, nc))
            best = max(best, area)
    return best
`,
  },
  "making-a-large-island": {
    entry: "largest_island",
    starterCode: `def largest_island(grid):
    """n x n grid of 0 and 1. The largest island after flipping at most one 0."""
    # Your code here
    return 0
`,
    solutionCode: `def largest_island(grid):
    # Label islands with ids >= 2, then score each water cell by its distinct neighbours.
    n = len(grid)
    label = [row[:] for row in grid]
    area = {}
    next_id = 2
    for r in range(n):
        for c in range(n):
            if label[r][c] != 1:
                continue
            island, size = next_id, 0
            next_id += 1
            stack = [(r, c)]
            label[r][c] = island
            while stack:
                cr, cc = stack.pop()
                size += 1
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < n and 0 <= nc < n and label[nr][nc] == 1:
                        label[nr][nc] = island
                        stack.append((nr, nc))
            area[island] = size
    best = max(area.values(), default=0)
    for r in range(n):
        for c in range(n):
            if label[r][c] != 0:
                continue
            ids = set()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < n and 0 <= nc < n and label[nr][nc] >= 2:
                    ids.add(label[nr][nc])
            best = max(best, 1 + sum(area[i] for i in ids))
    return best
`,
  },
  "shortest-bridge": {
    entry: "shortest_bridge",
    starterCode: `def shortest_bridge(grid):
    """0 water, 1 land, exactly two islands. The fewest water cells to flip."""
    # Your code here
    return 0
`,
    solutionCode: `def shortest_bridge(grid):
    # Collect one island, then expand it level by level until it meets the other.
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))
    queue = []
    start = next((r, c) for r in range(rows) for c in range(cols) if grid[r][c] == 1)
    stack = [start]
    seen[start[0]][start[1]] = True
    while stack:
        r, c = stack.pop()
        queue.append((r, c))
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                seen[nr][nc] = True
                stack.append((nr, nc))
    flips = 0
    while queue:
        nxt = []
        for r, c in queue:
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if not (0 <= nr < rows and 0 <= nc < cols) or seen[nr][nc]:
                    continue
                if grid[nr][nc] == 1:
                    return flips
                seen[nr][nc] = True
                nxt.append((nr, nc))
        queue = nxt
        flips += 1
    return -1
`,
  },
  "the-maze": {
    entry: "has_path",
    starterCode: `def has_path(maze, start, destination):
    """0 empty, 1 wall. Whether the ball can stop at destination."""
    # Your code here
    return False
`,
    solutionCode: `from collections import deque


def has_path(maze, start, destination):
    # BFS over stopping points: roll in each direction until a wall or the edge.
    rows, cols = len(maze), len(maze[0])
    start, destination = tuple(start), tuple(destination)
    seen = {start}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if (r, c) == destination:
            return True
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r, c
            while 0 <= nr + dr < rows and 0 <= nc + dc < cols and maze[nr + dr][nc + dc] == 0:
                nr += dr
                nc += dc
            if (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc))
    return False
`,
  },
  "path-with-minimum-effort": {
    entry: "minimum_effort_path",
    starterCode: `def minimum_effort_path(heights):
    """The smallest possible largest step from top-left to bottom-right."""
    # Your code here
    return 0
`,
    solutionCode: `import heapq


def minimum_effort_path(heights):
    # Dijkstra with a bottleneck relaxation.
    rows, cols = len(heights), len(heights[0])
    best = [[float("inf")] * cols for _ in range(rows)]
    best[0][0] = 0
    heap = [(0, 0, 0)]
    while heap:
        effort, r, c = heapq.heappop(heap)
        if (r, c) == (rows - 1, cols - 1):
            return effort
        if effort > best[r][c]:
            continue
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols:
                nxt = max(effort, abs(heights[nr][nc] - heights[r][c]))
                if nxt < best[nr][nc]:
                    best[nr][nc] = nxt
                    heapq.heappush(heap, (nxt, nr, nc))
    return 0
`,
  },
  "graph-valid-tree": {
    entry: "valid_tree",
    starterCode: `def valid_tree(n, edges):
    """Whether the undirected edges on nodes 0..n-1 form a tree."""
    # Your code here
    return False
`,
    solutionCode: `def valid_tree(n, edges):
    # n - 1 edges plus no cycle (union-find) is a tree.
    if len(edges) != n - 1:
        return False
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        a, b = find(u), find(v)
        if a == b:
            return False
        parent[a] = b
    return True
`,
  },
  "keys-and-rooms": {
    entry: "can_visit_all_rooms",
    starterCode: `def can_visit_all_rooms(rooms):
    """rooms[i] lists the keys in room i. Can every room be entered from room 0?"""
    # Your code here
    return False
`,
    solutionCode: `def can_visit_all_rooms(rooms):
    # Reachability from room 0 over the key graph.
    seen = {0}
    stack = [0]
    while stack:
        room = stack.pop()
        for key in rooms[room]:
            if key not in seen:
                seen.add(key)
                stack.append(key)
    return len(seen) == len(rooms)
`,
  },
  "most-stones-removed": {
    entry: "remove_stones",
    starterCode: `def remove_stones(stones):
    """The most stones removable when a stone needs another in its row or column."""
    # Your code here
    return 0
`,
    solutionCode: `def remove_stones(stones):
    # Each stone unions its row node with its column node; answer = stones - components.
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for r, c in stones:
        a, b = find(("r", r)), find(("c", c))
        if a != b:
            parent[a] = b
    roots = {find(node) for node in list(parent)}
    return len(stones) - len(roots)
`,
  },
  "parallel-courses-ii": {
    entry: "min_number_of_semesters",
    starterCode: `def min_number_of_semesters(n, relations, k):
    """Courses 1..n (n <= 15), [a, b] means a before b, at most k per semester."""
    # Your code here
    return 0
`,
    solutionCode: `def min_number_of_semesters(n, relations, k):
    # Bitmask DP over completed courses; take all available if <= k, else every k-subset.
    prereq = [0] * n
    for a, b in relations:
        prereq[b - 1] |= 1 << (a - 1)
    full = (1 << n) - 1
    dp = [float("inf")] * (1 << n)
    dp[0] = 0
    for mask in range(full):
        if dp[mask] == float("inf"):
            continue
        avail = 0
        for i in range(n):
            if not mask & (1 << i) and prereq[i] & mask == prereq[i]:
                avail |= 1 << i
        if bin(avail).count("1") <= k:
            dp[mask | avail] = min(dp[mask | avail], dp[mask] + 1)
            continue
        sub = avail
        while sub:
            if bin(sub).count("1") == k:
                dp[mask | sub] = min(dp[mask | sub], dp[mask] + 1)
            sub = (sub - 1) & avail
    return dp[full]
`,
  },
  "campus-bikes": {
    entry: "assign_bikes",
    starterCode: `def assign_bikes(workers, bikes):
    """The bike index assigned to each worker, by the greedy nearest-pair rule."""
    # Your code here
    return []
`,
    solutionCode: `def assign_bikes(workers, bikes):
    # Sort pairs by (distance, worker, bike) and assign greedily.
    pairs = sorted(
        (abs(wx - bx) + abs(wy - by), w, b)
        for w, (wx, wy) in enumerate(workers)
        for b, (bx, by) in enumerate(bikes)
    )
    answer = [-1] * len(workers)
    taken = [False] * len(bikes)
    assigned = 0
    for _, w, b in pairs:
        if answer[w] != -1 or taken[b]:
            continue
        answer[w] = b
        taken[b] = True
        assigned += 1
        if assigned == len(workers):
            break
    return answer
`,
  },
  "most-profitable-path-in-a-tree": {
    entry: "most_profitable_path",
    starterCode: `def most_profitable_path(edges, bob, amount):
    """Alice's best net income walking from node 0 to a leaf while Bob walks to 0."""
    # Your code here
    return 0
`,
    solutionCode: `def most_profitable_path(edges, bob, amount):
    # Stamp Bob's arrival times along his forced path, then score Alice bottom-up.
    n = len(amount)
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    parent = [-1] * n
    depth = [0] * n
    parent[0] = 0
    order = [0]
    for u in order:
        for v in adj[u]:
            if parent[v] == -1:
                parent[v] = u
                depth[v] = depth[u] + 1
                order.append(v)
    bob_time = [float("inf")] * n
    u, t = bob, 0
    while True:
        bob_time[u] = t
        if u == 0:
            break
        u, t = parent[u], t + 1
    best = [0] * n
    for u in reversed(order):
        if depth[u] < bob_time[u]:
            gain = amount[u]
        elif depth[u] == bob_time[u]:
            gain = amount[u] // 2
        else:
            gain = 0
        children = [best[v] for v in adj[u] if v != parent[u] or u == 0]
        best[u] = gain + max(children) if children else gain
    return best[0]
`,
  },
};
