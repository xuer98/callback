import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake LeetCode-tag bank part K and the custom
// long-tail prompts of part S, keyed by slug and merged into judge.python by
// the seed script like seed-python.ts.

export const snowflakePythonJudgesL: Record<string, JudgeLanguage> = {
  "task-scheduler": {
    entry: "least_interval",
    starterCode: `def least_interval(tasks, n):
    """The least total time with a cooldown of n between runs of the same task."""
    # Your code here
    return 0
`,
    solutionCode: `from collections import Counter


def least_interval(tasks, n):
    counts = Counter(tasks)
    max_freq = max(counts.values())
    tied = sum(1 for c in counts.values() if c == max_freq)
    return max(len(tasks), (max_freq - 1) * (n + 1) + tied)
`,
  },
  "document-coverage-window": {
    entry: "shortest_coverage",
    starterCode: `def shortest_coverage(words, terms):
    """[start, end] of the shortest span covering every term (earliest on ties), or []."""
    # Your code here
    return []
`,
    solutionCode: `def shortest_coverage(words, terms):
    need = {t: 1 for t in terms}
    missing = len(need)
    best = []
    left = 0
    for right, w in enumerate(words):
        if w in need:
            need[w] -= 1
            if need[w] == 0:
                missing -= 1
        while missing == 0:
            if not best or right - left < best[1] - best[0]:
                best = [left, right]
            out = words[left]
            left += 1
            if out in need:
                need[out] += 1
                if need[out] == 1:
                    missing += 1
    return best
`,
  },
  "max-revenue-query-type": {
    entry: "best_query_type",
    starterCode: `def best_query_type(durations, revenues, k):
    """The index of the type earning the most in k minutes (lowest index on ties), or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def best_query_type(durations, revenues, k):
    best, index = 0, -1
    for i, (d, r) in enumerate(zip(durations, revenues)):
        total = (k // d) * r
        if total > best:
            best, index = total, i
    return index
`,
  },
  "reach-target-with-three-moves": {
    entry: "__judge_reach",
    starterCode: `def reach_target(a, b):
    """Moves from "+2", "*2", "/2" turning a into b; [] when a == b."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def reach_target(a, b):
    # BFS over values bounded by 2 * max(a, b) + 2, reconstructing the moves.
    limit = 2 * max(a, b) + 2
    prev = {a: None}
    queue = deque([a])
    while queue and b not in prev:
        x = queue.popleft()
        steps = [(x + 2, "+2"), (x * 2, "*2")]
        if x % 2 == 0:
            steps.append((x // 2, "/2"))
        for y, move in steps:
            if 1 <= y <= limit and y not in prev:
                prev[y] = (x, move)
                queue.append(y)
    moves = []
    cur = b
    while prev[cur] is not None:
        cur, move = prev[cur]
        moves.append(move)
    return moves[::-1]
`,
    driverCode: `def __judge_reach(a, b):
    moves = reach_target(a, b)
    if not isinstance(moves, list):
        return "not a list"
    if len(moves) > 1000:
        return "too many moves"
    x = a
    for move in moves:
        if move == "+2":
            x += 2
        elif move == "*2":
            x *= 2
        elif move == "/2":
            if x % 2 != 0:
                return "halved an odd number"
            x //= 2
        else:
            return "unknown move " + str(move)
    return "valid" if x == b else "ended at " + str(x)
`,
  },
  "grid-drop-and-remove": {
    entry: "crush",
    starterCode: `def crush(board):
    """Clear runs of three or more, drop the columns, repeat until stable."""
    # Your code here
    return board
`,
    solutionCode: `def crush(board):
    rows, cols = len(board), len(board[0])
    grid = [row[:] for row in board]
    while True:
        marked = [[False] * cols for _ in range(rows)]
        found = False
        for r in range(rows):
            for c in range(cols - 2):
                v = grid[r][c]
                if v and v == grid[r][c + 1] == grid[r][c + 2]:
                    marked[r][c] = marked[r][c + 1] = marked[r][c + 2] = True
                    found = True
        for c in range(cols):
            for r in range(rows - 2):
                v = grid[r][c]
                if v and v == grid[r + 1][c] == grid[r + 2][c]:
                    marked[r][c] = marked[r + 1][c] = marked[r + 2][c] = True
                    found = True
        if not found:
            return grid
        for c in range(cols):
            write = rows - 1
            for r in range(rows - 1, -1, -1):
                if not marked[r][c] and grid[r][c] != 0:
                    grid[write][c] = grid[r][c]
                    write -= 1
            while write >= 0:
                grid[write][c] = 0
                write -= 1
`,
  },
  "course-schedule-with-retries": {
    entry: "__judge_retries",
    starterCode: `def schedule_courses(courses, did_fail):
    """courses: [{"id", "prerequisites"}] in input order; did_fail(id) -> bool.
    The attempted ids, in order."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def schedule_courses(courses, did_fail):
    passed, queued, attempts = set(), set(), []
    queue = deque()
    for course in courses:
        if not course["prerequisites"]:
            queue.append(course)
            queued.add(course["id"])
    while queue:
        course = queue.popleft()
        attempts.append(course["id"])
        if did_fail(course["id"]):
            queue.append(course)
            continue
        passed.add(course["id"])
        for candidate in courses:
            if candidate["id"] in queued or candidate["id"] in passed:
                continue
            if all(p in passed for p in candidate["prerequisites"]):
                queue.append(candidate)
                queued.add(candidate["id"])
    return attempts
`,
    driverCode: `def __judge_retries(courses, failures):
    remaining = dict(failures)

    def did_fail(course_id):
        n = remaining.get(str(course_id), 0)
        if n > 0:
            remaining[str(course_id)] = n - 1
            return True
        return False

    return schedule_courses(courses, did_fail)
`,
  },
  "service-failure-root-cause": {
    entry: "root_causes",
    starterCode: `def root_causes(services, dependencies, logs):
    """dependencies: [a, b] means a depends on b; logs: [time, service, "ok" | "fail"].
    Services whose first failure no dependency explains, by failure time then name."""
    # Your code here
    return []
`,
    solutionCode: `def root_causes(services, dependencies, logs):
    first_fail = {}
    for time, service, status in logs:
        if status == "fail" and (service not in first_fail or time < first_fail[service]):
            first_fail[service] = time
    depends_on = {s: [] for s in services}
    for a, b in dependencies:
        depends_on[a].append(b)

    def explained(service):
        own = first_fail[service]
        seen, stack = {service}, [service]
        while stack:
            for dep in depends_on.get(stack.pop(), []):
                if dep in seen:
                    continue
                seen.add(dep)
                if dep in first_fail and first_fail[dep] <= own:
                    return True
                stack.append(dep)
        return False

    roots = [s for s in first_fail if not explained(s)]
    return sorted(roots, key=lambda s: (first_fail[s], s))
`,
  },
  "string-command-calculator": {
    entry: "evaluate_commands",
    starterCode: `def evaluate_commands(program):
    """ADD / SUB / MULT commands separated by ';', operands are integers or (sub-programs)."""
    # Your code here
    return 0
`,
    solutionCode: `def evaluate_commands(program):
    pos = 0

    def skip_spaces():
        nonlocal pos
        while pos < len(program) and program[pos] == " ":
            pos += 1

    def parse_operand():
        nonlocal pos
        skip_spaces()
        if program[pos] == "(":
            pos += 1
            value = parse_program()
            if program[pos] != ")":
                raise ValueError("expected )")
            pos += 1
            return value
        sign = 1
        if program[pos] == "-":
            sign = -1
            pos += 1
        start = pos
        while pos < len(program) and program[pos].isdigit():
            pos += 1
        if start == pos:
            raise ValueError("expected a number at %d" % pos)
        return sign * int(program[start:pos])

    def parse_program():
        nonlocal pos
        acc = 0
        while True:
            skip_spaces()
            if pos >= len(program) or program[pos] == ")":
                return acc
            start = pos
            while pos < len(program) and program[pos].isupper():
                pos += 1
            word = program[start:pos]
            x = parse_operand()
            if word == "ADD":
                acc += x
            elif word == "SUB":
                acc -= x
            elif word == "MULT":
                acc *= x
            else:
                raise ValueError("unknown command " + word)
            skip_spaces()
            if pos < len(program) and program[pos] == ";":
                pos += 1

    result = parse_program()
    if pos != len(program):
        raise ValueError("unexpected ) at %d" % pos)
    return result
`,
  },
  "count-nodes-by-messages": {
    entry: "__judge_count",
    starterCode: `class TreeNode:
    def __init__(self, node_id, neighbors, send):
        """send(from_id, to_id, kind, request_id, count) delivers later, maybe twice."""
        self.id = node_id
        self.neighbors = neighbors
        self.send = send
        self.result = None   # set on the starting node when the count completes

    def start_count(self, request_id):
        pass

    def receive(self, sender, kind, request_id, count=0):
        """sender is None when this node started the count; kind is "REQUEST" or "REPLY"."""
        pass
`,
    solutionCode: `class TreeNode:
    def __init__(self, node_id, neighbors, send):
        self.id = node_id
        self.neighbors = set(neighbors)
        self.send = send
        self.pending = {}   # request_id -> [awaiting, total, reply_to]
        self.done = {}      # request_id -> total
        self.result = None

    def start_count(self, request_id):
        self.receive(None, "REQUEST", request_id)

    def receive(self, sender, kind, request_id, count=0):
        if kind == "REQUEST":
            self._on_request(sender, request_id)
        else:
            self._on_reply(sender, request_id, count)

    def _on_request(self, sender, request_id):
        if request_id in self.done:
            if sender is not None:
                self.send(self.id, sender, "REPLY", request_id, self.done[request_id])
            return
        if request_id in self.pending:
            return
        to_ask = self.neighbors - ({sender} if sender is not None else set())
        if not to_ask:
            self._finish(request_id, 1, sender)
            return
        self.pending[request_id] = [set(to_ask), 1, sender]
        for n in to_ask:
            self.send(self.id, n, "REQUEST", request_id, 0)

    def _on_reply(self, sender, request_id, count):
        state = self.pending.get(request_id)
        if state is None or sender not in state[0]:
            return
        state[0].discard(sender)
        state[1] += count
        if state[0]:
            return
        del self.pending[request_id]
        self._finish(request_id, state[1], state[2])

    def _finish(self, request_id, total, reply_to):
        self.done[request_id] = total
        if reply_to is None:
            self.result = total
        else:
            self.send(self.id, reply_to, "REPLY", request_id, total)
`,
    driverCode: `def __judge_count(neighbors, start, duplicate_every, seed):
    queue = []
    sent = [0]

    def send(from_id, to_id, kind, request_id, count=0):
        sent[0] += 1
        queue.append((from_id, to_id, kind, request_id, count))
        if duplicate_every and sent[0] % duplicate_every == 0:
            queue.append((from_id, to_id, kind, request_id, count))

    nodes = [TreeNode(i, nb, send) for i, nb in enumerate(neighbors)]
    nodes[start].start_count("req-1")
    state = seed
    delivered = 0
    while queue:
        state = (state * 1103515245 + 12345) % 2147483648
        from_id, to_id, kind, request_id, count = queue.pop(state % len(queue))
        nodes[to_id].receive(from_id, kind, request_id, count)
        delivered += 1
        if delivered > 100000:
            return "too many messages"
    return nodes[start].result
`,
  },
  "serialize-dictionary-trie": {
    entry: "__judge_trie",
    starterCode: `def serialize_trie(words):
    """Children in alphabetical order: letter, '*' if a word ends, '(' children ')' if any."""
    # Your code here
    return ""


class DeserializedTrie:
    def contains(self, word):
        return False


def deserialize_trie(s):
    """Return an object with contains(word)."""
    # Your code here
    return DeserializedTrie()
`,
    solutionCode: `def _build(words):
    root = {}
    for word in words:
        node = root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True
    return root


def serialize_trie(words):
    def write(node):
        out = []
        for ch in sorted(k for k in node if k != "$"):
            child = node[ch]
            kids = [k for k in child if k != "$"]
            out.append(ch + ("*" if "$" in child else "") + ("(" + write(child) + ")" if kids else ""))
        return "".join(out)

    return write(_build(words))


class DeserializedTrie:
    def __init__(self, root):
        self.root = root

    def contains(self, word):
        node = self.root
        for ch in word:
            node = node.get(ch)
            if node is None:
                return False
        return "$" in node


def deserialize_trie(s):
    pos = 0

    def parse_children(parent):
        nonlocal pos
        while pos < len(s) and s[pos] != ")":
            child = {}
            parent[s[pos]] = child
            pos += 1
            if pos < len(s) and s[pos] == "*":
                child["$"] = True
                pos += 1
            if pos < len(s) and s[pos] == "(":
                pos += 1
                parse_children(child)
                pos += 1   # the matching ")"

    root = {}
    parse_children(root)
    return DeserializedTrie(root)
`,
    driverCode: `def __judge_trie(kind, words, queries):
    if kind == "serialize":
        return serialize_trie(words)
    trie = deserialize_trie(serialize_trie(words))
    return [trie.contains(q) for q in queries]
`,
  },
};
