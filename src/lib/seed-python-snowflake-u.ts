import type { JudgeLanguage } from "./types";
import { TREE_BUILDER_PY } from "./seed-python-snowflake-c";
import { TREE_SERIALIZER_PY } from "./seed-python-snowflake-h";

// Python judges for Blind 75 part H (trees, first half, and Maximum Width),
// keyed by slug and merged into judge.python by the seed script like
// seed-python.ts.

export const snowflakePythonJudgesU: Record<string, JudgeLanguage> = {
  "maximum-depth-of-binary-tree": {
    entry: "__judge_depth",
    starterCode: `def max_depth(root):
    """Nodes have .val, .left and .right (None when absent)."""
    # Your code here
    return 0
`,
    solutionCode: `def max_depth(root):
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_depth(values):
    return max_depth(__build_tree(values))
`,
  },
  "same-tree": {
    entry: "__judge_same",
    starterCode: `def is_same_tree(p, q):
    """Nodes have .val, .left and .right (None when absent)."""
    # Your code here
    return False
`,
    solutionCode: `def is_same_tree(p, q):
    if p is None and q is None:
        return True
    if p is None or q is None or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_same(a, b):
    return is_same_tree(__build_tree(a), __build_tree(b))
`,
  },
  "invert-binary-tree": {
    entry: "__judge_invert",
    starterCode: `def invert_tree(root):
    """Nodes have .val, .left and .right. Mirror the tree; return its root."""
    # Your code here
    return root
`,
    solutionCode: `def invert_tree(root):
    if root is None:
        return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
`,
    driverCode: `${TREE_BUILDER_PY}
${TREE_SERIALIZER_PY}

def __judge_invert(values):
    return __to_level_order(invert_tree(__build_tree(values)))
`,
  },
  "binary-tree-maximum-path-sum": {
    entry: "__judge_path_sum",
    starterCode: `def max_path_sum(root):
    """Nodes have .val, .left and .right; the tree is non-empty."""
    # Your code here
    return 0
`,
    solutionCode: `def max_path_sum(root):
    best = float("-inf")

    def gain(node):
        nonlocal best
        if node is None:
            return 0
        left = max(0, gain(node.left))
        right = max(0, gain(node.right))
        best = max(best, node.val + left + right)
        return node.val + max(left, right)

    gain(root)
    return best
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_path_sum(values):
    return max_path_sum(__build_tree(values))
`,
  },
  "binary-tree-level-order-traversal": {
    entry: "__judge_levels",
    starterCode: `def level_order(root):
    """Nodes have .val, .left and .right. Values per level, left to right."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def level_order(root):
    out = []
    queue = deque([root] if root else [])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        out.append(level)
    return out
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_levels(values):
    return level_order(__build_tree(values))
`,
  },
  "maximum-width-of-binary-tree": {
    entry: "__judge_width",
    starterCode: `def width_of_binary_tree(root):
    """Nodes have .val, .left and .right. The widest level, counting gaps."""
    # Your code here
    return 0
`,
    solutionCode: `def width_of_binary_tree(root):
    if root is None:
        return 0
    best, level = 0, [(root, 0)]
    while level:
        first = level[0][1]
        nxt, last = [], first
        for node, index in level:
            i = index - first
            last = i
            if node.left:
                nxt.append((node.left, 2 * i))
            if node.right:
                nxt.append((node.right, 2 * i + 1))
        best = max(best, last + 1)
        level = nxt
    return best
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_width(values):
    return width_of_binary_tree(__build_tree(values))
`,
  },
};
