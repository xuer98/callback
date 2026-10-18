import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake coding bank, parts W, Y and Z — the
// prerequisite route and batched lookups, the event window and prefix
// calculator, and the people-and-cakes grid questions — keyed by slug and
// merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesV: Record<string, JudgeLanguage> = {
  "prerequisite-route": {
    entry: "prerequisite_route",
    starterCode: `def prerequisite_route(num_courses, prerequisites, target):
    """prerequisites: [course, prerequisite] pairs, duplicates possible.
    The target and everything it depends on, prerequisites first, smallest
    available course first; [] when the required courses contain a cycle."""
    # Your code here
    return []
`,
    solutionCode: `import heapq


def prerequisite_route(num_courses, prerequisites, target):
    # DFS for the required set, then smallest-first Kahn's algorithm over just that set.
    needs = [[] for _ in range(num_courses)]
    seen_pair = set()
    for course, prerequisite in prerequisites:
        if (course, prerequisite) in seen_pair:
            continue
        seen_pair.add((course, prerequisite))
        needs[course].append(prerequisite)
    required = {target}
    stack = [target]
    while stack:
        course = stack.pop()
        for p in needs[course]:
            if p not in required:
                required.add(p)
                stack.append(p)
    pending = {course: len(needs[course]) for course in required}
    unlocks = {}
    for course in required:
        for p in needs[course]:
            unlocks.setdefault(p, []).append(course)
    heap = [course for course, count in pending.items() if count == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        course = heapq.heappop(heap)
        order.append(course)
        for nxt in unlocks.get(course, []):
            pending[nxt] -= 1
            if pending[nxt] == 0:
                heapq.heappush(heap, nxt)
    return order if len(order) == len(required) else []
`,
  },
  "recent-event-window": {
    entry: "event_window",
    starterCode: `def event_window(m, operations):
    """Only the newest m additions are retained. Operations are
    ["add", timestamp, key] -> None, ["unique_before", t] -> count of
    distinct retained keys with timestamp <= t, ["top_before", t] -> the
    most frequent such key (smallest on a tie) or None. One result each."""
    # Your code here
    return []
`,
    solutionCode: `def event_window(m, operations):
    # The newest m events in arrival order; each query tallies the prefix that fits under t.
    retained = []
    head = 0
    results = []
    for op in operations:
        if op[0] == "add":
            retained.append((op[1], op[2]))
            if len(retained) - head > m:
                head += 1
            results.append(None)
            continue
        limit = op[1]
        counts = {}
        i = head
        while i < len(retained) and retained[i][0] <= limit:
            key = retained[i][1]
            counts[key] = counts.get(key, 0) + 1
            i += 1
        if op[0] == "unique_before":
            results.append(len(counts))
            continue
        best = None
        for key, count in counts.items():
            if best is None or count > counts[best] or (count == counts[best] and key < best):
                best = key
        results.append(best)
    return results
`,
  },
  "repeated-lookups-sorted": {
    entry: "locate_all",
    starterCode: `def locate_all(values, queries):
    """values is sorted (duplicates possible). The first index of each
    query, or -1 when absent, in query order. Do not modify the inputs."""
    # Your code here
    return []
`,
    solutionCode: `def locate_all(values, queries):
    # One pass records where each run starts; queries are dict lookups.
    first = {}
    for i, value in enumerate(values):
        if value not in first:
            first[value] = i
    return [first.get(value, -1) for value in queries]
`,
  },
  "prefix-command-calculator": {
    entry: "evaluate_prefix",
    starterCode: `def evaluate_prefix(expression):
    """expr := integer | ( OP expr expr ) with OP in ADD, SUB, MULT, DIV;
    a top-level bare OP expr means (OP 0 expr). DIV truncates toward zero."""
    # Your code here
    return 0
`,
    solutionCode: `def evaluate_prefix(expression):
    # Recursive descent over space-separated tokens; the top level allows the bare OP expr shorthand.
    tokens = expression.replace("(", " ( ").replace(")", " ) ").split()
    pos = 0

    def truncated(a, b):
        q = abs(a) // abs(b)
        return q if (a >= 0) == (b > 0) else -q

    def apply(op, a, b):
        if op == "ADD":
            return a + b
        if op == "SUB":
            return a - b
        if op == "MULT":
            return a * b
        return truncated(a, b)

    def expr():
        nonlocal pos
        token = tokens[pos]
        pos += 1
        if token != "(":
            return int(token)
        op = tokens[pos]
        pos += 1
        a = expr()
        b = expr()
        pos += 1                           # the closing parenthesis
        return apply(op, a, b)

    if tokens[0].isalpha():
        op = tokens[0]
        pos = 1
        return apply(op, 0, expr())
    return expr()
`,
  },
  "person-cake-distances": {
    entry: "cake_distances",
    starterCode: `def cake_distances(hallway):
    """hallway cells: 0 empty, 1 a person, 2 a cake. Each person's distance
    to the nearest cake, in order; -1 each when there is no cake."""
    # Your code here
    return []
`,
    solutionCode: `def cake_distances(hallway):
    # Nearest cake on the left and on the right, one sweep each.
    n = len(hallway)
    inf = float("inf")
    distance = [inf] * n
    last_cake = -1
    for i in range(n):
        if hallway[i] == 2:
            last_cake = i
        if last_cake != -1:
            distance[i] = i - last_cake
    last_cake = -1
    for i in range(n - 1, -1, -1):
        if hallway[i] == 2:
            last_cake = i
        if last_cake != -1:
            distance[i] = min(distance[i], last_cake - i)
    return [-1 if distance[i] == inf else distance[i] for i in range(n) if hallway[i] == 1]
`,
  },
  "closest-cake-in-grid": {
    entry: "closest_pair",
    starterCode: `def closest_pair(grid):
    """Every cell is 1 (a person) or 2 (a cake). The smallest Manhattan
    distance between a person and a cake, or -1 if one kind is missing."""
    # Your code here
    return -1
`,
    solutionCode: `def closest_pair(grid):
    # A full grid with both kinds present always has an adjacent person-cake pair.
    person = any(cell == 1 for row in grid for cell in row)
    cake = any(cell == 2 for row in grid for cell in row)
    return 1 if person and cake else -1
`,
  },
  "cake-a-person-eats": {
    entry: "cake_for",
    starterCode: `def cake_for(grid, row, col):
    """Every cell is 1 (a person) or 2 (a cake). The [row, col] of the
    unique cake nearest, by Manhattan distance, to the person at
    (row, col)."""
    # Your code here
    return [0, 0]
`,
    solutionCode: `def cake_for(grid, row, col):
    # One scan, keeping the nearest cake by Manhattan distance.
    best = None
    best_distance = float("inf")
    for r, cells in enumerate(grid):
        for c, cell in enumerate(cells):
            if cell != 2:
                continue
            distance = abs(r - row) + abs(c - col)
            if distance < best_distance:
                best_distance = distance
                best = [r, c]
    return best
`,
  },
};
