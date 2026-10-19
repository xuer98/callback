import type { JudgeLanguage } from "./types";
import { TREE_BUILDER_PY } from "./seed-python-snowflake-c";

// Python judges for the 2026 interview-report prompts in
// seed-snowflake-trend.ts, keyed by slug and merged into judge.python by the
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
};
