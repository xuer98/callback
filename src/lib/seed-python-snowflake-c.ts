import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake coding bank, part I, keyed by slug and
// merged into judge.python by the seed script like seed-python.ts. The tree
// builder serves part T's judges in seed-python-snowflake-m.ts.

/** Builds a tree of _TreeNode(val, left, right) from a level-order list. */
export const TREE_BUILDER_PY = `class _TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def __build_tree(values):
    if not values or values[0] is None:
        return None
    nodes = [None if v is None else _TreeNode(v) for v in values]
    child = 1
    for node in nodes:
        if node is None:
            continue
        if child < len(nodes):
            node.left = nodes[child]
            child += 1
        if child < len(nodes):
            node.right = nodes[child]
            child += 1
    return nodes[0]
`;

export const snowflakePythonJudgesC: Record<string, JudgeLanguage> = {
  "reverse-alphanumeric-runs": {
    entry: "reverse_runs",
    starterCode: `def reverse_runs(s):
    """s with every maximal run of ASCII letters and digits reversed."""
    # Your code here
    return s
`,
    solutionCode: `def reverse_runs(s):
    # Find each run's end, reverse it in place, continue after it.
    chars = list(s)

    def is_alnum(ch):
        return ("a" <= ch <= "z") or ("A" <= ch <= "Z") or ("0" <= ch <= "9")

    i = 0
    while i < len(chars):
        if not is_alnum(chars[i]):
            i += 1
            continue
        j = i
        while j + 1 < len(chars) and is_alnum(chars[j + 1]):
            j += 1
        chars[i:j + 1] = chars[i:j + 1][::-1]
        i = j + 1
    return "".join(chars)
`,
  },
  "grep-with-context": {
    entry: "grep",
    starterCode: `def grep(lines, pattern, before, after):
    """The output lines of grep -B before -A after, with "--" between
    separate groups. A line matches when it contains pattern."""
    # Your code here
    return []
`,
    solutionCode: `def grep(lines, pattern, before, after):
    # Each match becomes a clipped range; touching ranges merge; groups print with -- between.
    groups = []
    for i, line in enumerate(lines):
        if pattern not in line:
            continue
        start, end = max(0, i - before), min(len(lines) - 1, i + after)
        if groups and start <= groups[-1][1] + 1:
            groups[-1][1] = max(groups[-1][1], end)
        else:
            groups.append([start, end])
    out = []
    for g, (start, end) in enumerate(groups):
        if g > 0:
            out.append("--")
        out.extend(lines[start:end + 1])
    return out
`,
  },
};
