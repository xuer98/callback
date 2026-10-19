import type { JudgeLanguage } from "./types";
import { TREE_BUILDER_PY } from "./seed-python-snowflake-c";

// Python judges for the 2026 interview-report prompts in
// seed-snowflake-trend.ts and the study guide's toolkit prompts in
// seed-snowflake-guide.ts, keyed by slug and merged into judge.python by the
// seed script like seed-python.ts.

export const snowflakePythonJudgesX: Record<string, JudgeLanguage> = {
  "boundary-of-full-binary-tree": {
    entry: "__judge_boundary",
    starterCode: `def boundary(root):
    """Nodes have .val, .left and .right; the tree is full. The boundary anti-clockwise from the root, each node once."""
    # Your code here
    return []
`,
    solutionCode: `def boundary(root):
    # Left spine, then leaves left to right, then the right spine reversed.
    if root is None:
        return []

    def is_leaf(node):
        return node.left is None and node.right is None

    if is_leaf(root):
        return [root.val]
    out = [root.val]
    node = root.left
    while not is_leaf(node):
        out.append(node.val)
        node = node.left
    stack = [root]
    while stack:
        node = stack.pop()
        if is_leaf(node):
            out.append(node.val)
        else:
            stack.append(node.right)
            stack.append(node.left)      # popped first
    right = []
    node = root.right
    while not is_leaf(node):
        right.append(node.val)
        node = node.right
    out.extend(reversed(right))
    return out
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_boundary(values):
    return boundary(__build_tree(values))
`,
  },
  "workflow-dependencies": {
    entry: "__judge_workflow",
    starterCode: `class Workflow:
    def __init__(self):
        # Your state here
        pass

    def add_task(self, name):
        pass

    def add_dependency(self, task, depends_on):
        """True if recorded, False if it would create a cycle."""
        return False

    def order(self):
        """Every task after everything it depends on; earliest added first among ready tasks."""
        return []

    def deep_copy(self):
        """An independent copy."""
        return Workflow()
`,
    solutionCode: `class Workflow:
    # Tasks in insertion order plus a dependency set per task; cycles are refused on arrival.
    def __init__(self):
        self.tasks = []          # names, in the order added
        self.deps = {}           # task -> set of the tasks it depends on

    def add_task(self, name):
        if name in self.deps:
            return
        self.tasks.append(name)
        self.deps[name] = set()

    def reaches(self, start, target):
        """Does start depend on target, directly or through other tasks?"""
        stack, seen = [start], set()
        while stack:
            node = stack.pop()
            if node == target:
                return True
            if node in seen:
                continue
            seen.add(node)
            stack.extend(self.deps[node])
        return False

    def add_dependency(self, task, depends_on):
        if task not in self.deps or depends_on not in self.deps:
            raise KeyError("unknown task")
        if self.reaches(depends_on, task):      # task == depends_on included
            return False
        self.deps[task].add(depends_on)
        return True

    def order(self):
        unmet = {task: len(self.deps[task]) for task in self.tasks}
        dependents = {task: [] for task in self.tasks}
        for task, deps in self.deps.items():
            for dep in deps:
                dependents[dep].append(task)
        out, done = [], set()
        while len(out) < len(self.tasks):
            nxt = next(t for t in self.tasks if t not in done and unmet[t] == 0)
            done.add(nxt)
            out.append(nxt)
            for task in dependents[nxt]:
                unmet[task] -= 1
        return out

    def deep_copy(self):
        copy = Workflow()
        for task in self.tasks:
            copy.add_task(task)
        for task, deps in self.deps.items():
            copy.deps[task] = set(deps)
        return copy
`,
    driverCode: `def __judge_workflow(operations):
    import re
    slots = {"a": Workflow()}
    out = []
    for op, slot, *args in operations:
        if op == "copy":
            slots[args[0]] = slots[slot].deep_copy()
            out.append(None)
            continue
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", op).lower()
        out.append(getattr(slots[slot], name)(*args))
    return out
`,
  },
  "longest-common-substring": {
    entry: "longest_common_substring",
    starterCode: `def longest_common_substring(a, b):
    """The longest substring of both; among ties, the one that starts earliest in a."""
    # Your code here
    return ""
`,
    solutionCode: `def longest_common_substring(a, b):
    # Two rows of the common-suffix table; the best only moves on a strictly longer match.
    prev = [0] * (len(b) + 1)
    best_length = best_end = 0
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1] + 1
                if cur[j] > best_length:
                    best_length, best_end = cur[j], i
        prev = cur
    return a[best_end - best_length:best_end]
`,
  },
  "topological-sort": {
    entry: "topological_sort",
    starterCode: `def topological_sort(graph):
    """graph maps each node to the nodes it points to; every node is a key.
    The lexicographically smallest topological order, or [] when there is a cycle."""
    # Your code here
    return []
`,
    solutionCode: `import heapq


def topological_sort(graph):
    # Kahn's algorithm with a min-heap, so the smallest ready node always goes next.
    indegree = {node: 0 for node in graph}
    for node in graph:
        for nxt in graph[node]:
            indegree[nxt] += 1
    ready = [node for node in graph if indegree[node] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        node = heapq.heappop(ready)
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                heapq.heappush(ready, nxt)
    return order if len(order) == len(graph) else []
`,
  },
  "happy-number-cycle": {
    entry: "happy_cycle",
    starterCode: `def happy_cycle(n):
    """The loop the digit-square sequence enters, from the first value visited twice."""
    # Your code here
    return []
`,
    solutionCode: `def digit_square_sum(n):
    total = 0
    while n:
        n, digit = divmod(n, 10)
        total += digit * digit
    return total


def happy_cycle(n):
    # Walk until a value repeats; the loop is the path from that value's first visit.
    path, seen_at = [], {}
    value = n
    while value not in seen_at:
        seen_at[value] = len(path)
        path.append(value)
        value = digit_square_sum(value)
    return path[seen_at[value]:]
`,
  },
  "happy-numbers-up-to-n": {
    entry: "happy_numbers_up_to",
    starterCode: `def happy_numbers_up_to(n):
    """Every happy number from 1 to n, ascending."""
    # Your code here
    return []
`,
    solutionCode: `def digit_square_sum(n):
    total = 0
    while n:
        n, digit = divmod(n, 10)
        total += digit * digit
    return total


def happy_numbers_up_to(n):
    # One memo for every start: a walk stops at a known value or at a repeat, and the whole path takes that answer.
    fate = {1: True}
    out = []
    for start in range(1, n + 1):
        path, on_path = [], set()
        value = start
        while value not in fate and value not in on_path:
            on_path.add(value)
            path.append(value)
            value = digit_square_sum(value)
        happy = fate.get(value, False)
        for visited in path:
            fate[visited] = happy
        if fate[start]:
            out.append(start)
    return out
`,
  },
};
