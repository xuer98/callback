import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake coding bank, parts A to C, keyed by slug
// and merged into judge.python by the seed script like seed-python.ts. The
// wiki-page problems and the request limiter continue in
// seed-python-snowflake-f.ts.

export const snowflakePythonJudgesA: Record<string, JudgeLanguage> = {
  "nearest-bathroom-distances": {
    entry: "desks_to_bathrooms",
    starterCode: `def desks_to_bathrooms(grid):
    """grid: rows of B (bathroom), D (desk), _ (floor) and # (wall).
    Return a grid of each desk's steps to the nearest bathroom (-1 if none
    is reachable); every other cell is -1."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def desks_to_bathrooms(grid):
    # Multi-source BFS: every bathroom starts in the queue at distance 0.
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    dist = [[-1] * cols for _ in range(rows)]
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "B":
                dist[r][c] = 0
                queue.append((r, c))
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return [[dist[r][c] if grid[r][c] == "D" else -1 for c in range(cols)] for r in range(rows)]
`,
  },
  "closest-person-cake-distance": {
    entry: "min_person_cake_gap",
    starterCode: `def min_person_cake_gap(line):
    """line: 0 = empty, 1 = person, 2 = cake. Smallest person-to-cake
    distance, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def min_person_cake_gap(line):
    # One pass: the nearest partner behind you is always the last one seen.
    best = float("inf")
    last_person = last_cake = -1
    for i, v in enumerate(line):
        if v == 1:
            if last_cake != -1:
                best = min(best, i - last_cake)
            last_person = i
        elif v == 2:
            if last_person != -1:
                best = min(best, i - last_person)
            last_cake = i
    return -1 if best == float("inf") else best
`,
  },
  "assign-people-to-cakes": {
    entry: "__judge_assign",
    starterCode: `def assign_cakes(line):
    """line: 0 = empty, 1 = person, 2 = cake; at least as many cakes as
    people. Return [total, pairs]: the minimum total distance and
    [person_index, cake_index] pairs, one per person."""
    # Your code here
    return [0, []]
`,
    solutionCode: `def assign_cakes(line):
    # Sorted people, sorted cakes: an optimal matching never crosses, so
    # dp[i][j] = cheapest way to seat the first i people in the first j cakes.
    people = [i for i, v in enumerate(line) if v == 1]
    cakes = [i for i, v in enumerate(line) if v == 2]
    if len(people) > len(cakes):
        raise ValueError("more people than cakes")
    INF = float("inf")
    dp = [[0] * (len(cakes) + 1)] + [[INF] * (len(cakes) + 1) for _ in people]
    for i in range(1, len(people) + 1):
        for j in range(i, len(cakes) + 1):
            dp[i][j] = min(dp[i][j - 1], dp[i - 1][j - 1] + abs(people[i - 1] - cakes[j - 1]))
    pairs = []
    i, j = len(people), len(cakes)
    while i:                                   # walk back: skipped cake, or a match
        if dp[i][j] == dp[i][j - 1]:
            j -= 1
        else:
            pairs.append([people[i - 1], cakes[j - 1]])
            i -= 1
            j -= 1
    pairs.reverse()
    return [dp[len(people)][len(cakes)], pairs]
`,
    driverCode: `def __judge_assign(line):
    people = [i for i, v in enumerate(line) if v == 1]
    cakes = [i for i, v in enumerate(line) if v == 2]
    INF = float("inf")
    dp = [[0] * (len(cakes) + 1)] + [[INF] * (len(cakes) + 1) for _ in people]
    for i in range(1, len(people) + 1):
        for j in range(i, len(cakes) + 1):
            dp[i][j] = min(dp[i][j - 1], dp[i - 1][j - 1] + abs(people[i - 1] - cakes[j - 1]))
    best = dp[len(people)][len(cakes)]
    result = assign_cakes(line)
    if not isinstance(result, (list, tuple)) or len(result) != 2 or not isinstance(result[1], (list, tuple)):
        return "expected [total, pairs]"
    total, pairs = result
    if len(pairs) != len(people):
        return "every person needs exactly one cake"
    used_people, used_cakes, total_seen = set(), set(), 0
    for pair in pairs:
        p, c = pair
        if line[p] != 1 or line[c] != 2 or p in used_people or c in used_cakes:
            return "invalid pair " + str(list(pair))
        used_people.add(p)
        used_cakes.add(c)
        total_seen += abs(p - c)
    if total_seen != total:
        return "the pairs add up to " + str(total_seen) + ", not " + str(total)
    if total != best:
        return "total " + str(total) + " is not minimal (" + str(best) + ")"
    return "total " + str(total) + ", valid"
`,
  },
  "course-order": {
    entry: "__judge_order",
    starterCode: `def find_order(num_courses, prerequisites):
    """prerequisites: [a, b] pairs, b before a. A valid order, or [] when
    none exists."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def find_order(num_courses, prerequisites):
    # Kahn's algorithm: the order courses leave the queue is a schedule.
    unlocks = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        unlocks[prereq].append(course)
        indegree[course] += 1
    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    order = []
    while queue:
        course = queue.popleft()
        order.append(course)
        for nxt in unlocks[course]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == num_courses else []   # short means a cycle
`,
    driverCode: `def __judge_order(num_courses, prerequisites):
    order = find_order(num_courses, prerequisites)
    indegree = [0] * num_courses
    unlocks = [[] for _ in range(num_courses)]
    for a, b in prerequisites:
        unlocks[b].append(a)
        indegree[a] += 1
    queue = [c for c in range(num_courses) if indegree[c] == 0]
    head = 0
    while head < len(queue):
        for nxt in unlocks[queue[head]]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
        head += 1
    if len(queue) != num_courses:
        if isinstance(order, (list, tuple)) and len(order) == 0:
            return "impossible"
        return "returned an order although the courses form a cycle"
    order = list(order) if isinstance(order, (list, tuple)) else None
    if order is None or len(order) != num_courses or set(order) != set(range(num_courses)):
        return "not an ordering of every course"
    position = {c: i for i, c in enumerate(order)}
    for a, b in prerequisites:
        if position[b] > position[a]:
            return "course " + str(b) + " must come before course " + str(a)
    return "valid order of " + str(num_courses) + " courses"
`,
  },
  "course-finish-time": {
    entry: "earliest_finish",
    starterCode: `def earliest_finish(num_courses, prerequisites, time):
    """prerequisites: [a, b] pairs, b finished before a starts (acyclic);
    time[c] is course c's duration. Earliest time everything is done."""
    # Your code here
    return 0
`,
    solutionCode: `from collections import deque


def earliest_finish(num_courses, prerequisites, time):
    # Longest path in a DAG by time: finish[v] = time[v] + max(finish of prerequisites).
    unlocks = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        unlocks[prereq].append(course)
        indegree[course] += 1
    finish = [0] * num_courses
    queue = deque()
    for c in range(num_courses):
        if indegree[c] == 0:
            finish[c] = time[c]
            queue.append(c)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        for v in unlocks[u]:
            finish[v] = max(finish[v], finish[u] + time[v])
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    if seen != num_courses:
        raise ValueError("the prerequisites form a cycle")
    return max(finish, default=0)
`,
  },
  "course-batches-time": {
    entry: "batches_time",
    starterCode: `def batches_time(num_courses, prerequisites, time):
    """Courses run in batches; the next batch starts when the whole current
    batch has finished. Total time until the last batch finishes."""
    # Your code here
    return 0
`,
    solutionCode: `def batches_time(num_courses, prerequisites, time):
    # Kahn's algorithm by levels: each level is a batch and costs its slowest course.
    unlocks = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        unlocks[prereq].append(course)
        indegree[course] += 1
    level = [c for c in range(num_courses) if indegree[c] == 0]
    total = seen = 0
    while level:
        total += max(time[c] for c in level)
        seen += len(level)
        nxt = []
        for u in level:
            for v in unlocks[u]:
                indegree[v] -= 1
                if indegree[v] == 0:
                    nxt.append(v)
        level = nxt
    if seen != num_courses:
        raise ValueError("the prerequisites form a cycle")
    return total
`,
  },
  "course-any-prerequisite-time": {
    entry: "any_prerequisite_time",
    starterCode: `def any_prerequisite_time(num_courses, prerequisites, time):
    """A course may start once any one of its prerequisites has finished.
    Earliest time everything is done."""
    # Your code here
    return 0
`,
    solutionCode: `from collections import deque


def any_prerequisite_time(num_courses, prerequisites, time):
    # Topological relaxation with a minimum: start at the earliest prerequisite finish.
    unlocks = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        unlocks[prereq].append(course)
        indegree[course] += 1
    start = [float("inf")] * num_courses
    finish = [0] * num_courses
    queue = deque()
    for c in range(num_courses):
        if indegree[c] == 0:
            start[c] = 0
            queue.append(c)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        finish[u] = start[u] + time[u]
        for v in unlocks[u]:
            start[v] = min(start[v], finish[u])
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    if seen != num_courses:
        raise ValueError("the prerequisites form a cycle")
    return max(finish, default=0)
`,
  },
  "height-after-deleting-nodes": {
    entry: "height_after_deletions",
    starterCode: `def height_after_deletions(edges, root, deleted):
    """edges: [parent, child] pairs of a rooted tree; deleted nodes hand
    their children to the nearest surviving ancestor. Height in nodes."""
    # Your code here
    return 0
`,
    solutionCode: `from collections import defaultdict


def height_after_deletions(edges, root, deleted):
    # Traverse with a running depth: survivors add a level, deleted nodes pass it through.
    children = defaultdict(list)
    for parent, child in edges:
        children[parent].append(child)
    gone = set(deleted)
    best = 0
    stack = [(root, 0)]
    while stack:
        node, above = stack.pop()
        depth = above + (0 if node in gone else 1)
        best = max(best, depth)
        for child in children.get(node, ()):
            stack.append((child, depth))
    return best
`,
  },
  "fewest-deletions-for-height": {
    entry: "__judge_deletions",
    starterCode: `def fewest_deletions(edges, root, k):
    """A smallest set of non-root nodes whose deletion brings the height
    (in nodes) down to at most k."""
    # Your code here
    return []
`,
    solutionCode: `from collections import defaultdict


def fewest_deletions(edges, root, k):
    # h[u] = node-count height of u's subtree. Deleting every non-root node
    # with h[u] >= k caps the height at k, and no smaller set does.
    children = defaultdict(list)
    for parent, child in edges:
        children[parent].append(child)
    order, stack = [], [root]
    while stack:
        node = stack.pop()
        order.append(node)
        stack.extend(children.get(node, ()))
    height = {}
    for node in reversed(order):               # children before parents
        height[node] = 1 + max((height[c] for c in children.get(node, ())), default=0)
    return [node for node in order if node != root and height[node] >= k]
`,
    driverCode: `def __judge_deletions(edges, root, k):
    children = {}
    nodes = {root}
    for parent, child in edges:
        children.setdefault(parent, []).append(child)
        nodes.add(parent)
        nodes.add(child)
    order, stack = [], [root]
    while stack:
        node = stack.pop()
        order.append(node)
        stack.extend(children.get(node, ()))
    height = {}
    for node in reversed(order):
        height[node] = 1 + max((height[c] for c in children.get(node, ())), default=0)
    optimum = sum(1 for node in order if node != root and height[node] >= k)
    result = fewest_deletions(edges, root, k)
    if not isinstance(result, (list, tuple, set)):
        return "expected a list of node ids"
    deleted = set(result)
    if len(deleted) != len(result):
        return "a node is listed twice"
    if root in deleted:
        return "the root may not be deleted"
    for node in deleted:
        if node not in nodes:
            return "unknown node " + str(node)
    after = 0
    walk = [(root, 0)]
    while walk:
        node, above = walk.pop()
        depth = above + (0 if node in deleted else 1)
        after = max(after, depth)
        for child in children.get(node, ()):
            walk.append((child, depth))
    if after > k:
        return "height " + str(after) + " is still above " + str(k)
    if len(deleted) > optimum:
        return "deleted " + str(len(deleted)) + ", but " + str(optimum) + " suffice"
    return "deleted " + str(len(deleted)) + ", height " + str(after)
`,
  },
  "dag-letter-permissions": {
    entry: "final_allowed",
    starterCode: `def final_allowed(n, edges, allow, disallow):
    """edges: [parent, child] pairs of a DAG over nodes 0..n-1; allow and
    disallow hold capital letters per node. Each node's final letters in
    alphabetical order, or "-"."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def final_allowed(n, edges, allow, disallow):
    # Letter sets as 26-bit masks, resolved in topological order.
    ALL = (1 << 26) - 1

    def mask(letters):
        m = 0
        for ch in letters:
            m |= 1 << (ord(ch) - 65)
        return m

    children = [[] for _ in range(n)]
    indegree = [0] * n
    for parent, child in edges:
        children[parent].append(child)
        indegree[child] += 1
    inherited = [ALL] * n                       # identity for AND
    final = [0] * n
    queue = deque()
    for i in range(n):
        if indegree[i] == 0:
            inherited[i] = 0                     # sources inherit nothing
            queue.append(i)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        final[u] = (inherited[u] | mask(allow[u])) & ~mask(disallow[u])
        for v in children[u]:
            inherited[v] &= final[u]
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    if seen != n:
        raise ValueError("the edges form a cycle")
    return ["".join(chr(65 + b) for b in range(26) if m >> b & 1) or "-" for m in final]
`,
  },
};
