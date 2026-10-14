import type { JudgeLanguage } from "./types";
import { TREE_BUILDER_PY } from "./seed-python-snowflake-c";
import { TREE_SERIALIZER_PY } from "./seed-python-snowflake-h";

// Python judges for Blind 75 part I (trees, second half, and Serialize and
// Deserialize BST), keyed by slug and merged into judge.python by the seed
// script like seed-python.ts.

const TREE_NODE_CLASS = `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
`;

const CODEC_DRIVER_PY = `${TREE_BUILDER_PY}
${TREE_SERIALIZER_PY}

def __judge_codec(values, mode):
    data = serialize(__build_tree(values))
    if not isinstance(data, str):
        return "serialize must return a string"
    if mode == "compact":
        digits = sum(len(str(v)) for v in values if v is not None)
        return len(data) <= digits + len(values) + 1
    return __to_level_order(deserialize(data))
`;

export const snowflakePythonJudgesV: Record<string, JudgeLanguage> = {
  "serialize-and-deserialize-binary-tree": {
    entry: "__judge_codec",
    starterCode: `${TREE_NODE_CLASS}

def serialize(root):
    """Nodes have .val, .left and .right. Any string format, as long as it round-trips."""
    # Your code here
    return ""


def deserialize(data):
    """Return the root TreeNode (None for an empty tree)."""
    # Your code here
    return None
`,
    solutionCode: `${TREE_NODE_CLASS}

def serialize(root):
    out = []

    def walk(node):
        if node is None:
            out.append("#")
            return
        out.append(str(node.val))
        walk(node.left)
        walk(node.right)

    walk(root)
    return " ".join(out)


def deserialize(data):
    tokens = iter(data.split(" "))

    def build():
        token = next(tokens)
        if token == "#":
            return None
        node = TreeNode(int(token))
        node.left = build()
        node.right = build()
        return node

    return build()
`,
    driverCode: CODEC_DRIVER_PY,
  },
  "serialize-and-deserialize-bst": {
    entry: "__judge_codec",
    starterCode: `${TREE_NODE_CLASS}

def serialize(root):
    """A BST with distinct values; make the string as compact as you can."""
    # Your code here
    return ""


def deserialize(data):
    """Return the root TreeNode (None for an empty tree)."""
    # Your code here
    return None
`,
    solutionCode: `from collections import deque


${TREE_NODE_CLASS}

def serialize(root):
    out = []

    def walk(node):
        if node is None:
            return
        out.append(str(node.val))
        walk(node.left)
        walk(node.right)

    walk(root)
    return " ".join(out)


def deserialize(data):
    values = deque(int(x) for x in data.split()) if data else deque()

    def build(lo, hi):
        if values and lo < values[0] < hi:
            val = values.popleft()
            node = TreeNode(val)
            node.left = build(lo, val)
            node.right = build(val, hi)
            return node
        return None

    return build(float("-inf"), float("inf"))
`,
    driverCode: CODEC_DRIVER_PY,
  },
  "subtree-of-another-tree": {
    entry: "__judge_subtree",
    starterCode: `def is_subtree(root, sub_root):
    """Nodes have .val, .left and .right (None when absent)."""
    # Your code here
    return False
`,
    solutionCode: `def is_subtree(root, sub_root):
    def same(a, b):
        if a is None and b is None:
            return True
        if a is None or b is None or a.val != b.val:
            return False
        return same(a.left, b.left) and same(a.right, b.right)

    def walk(node):
        if node is None:
            return False
        return same(node, sub_root) or walk(node.left) or walk(node.right)

    return walk(root)
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_subtree(a, b):
    return is_subtree(__build_tree(a), __build_tree(b))
`,
  },
  "validate-binary-search-tree": {
    entry: "__judge_valid_bst",
    starterCode: `def is_valid_bst(root):
    """Nodes have .val, .left and .right (None when absent)."""
    # Your code here
    return False
`,
    solutionCode: `def is_valid_bst(root):
    def valid(node, low, high):
        if node is None:
            return True
        if not low < node.val < high:
            return False
        return valid(node.left, low, node.val) and valid(node.right, node.val, high)

    return valid(root, float("-inf"), float("inf"))
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_valid_bst(values):
    return is_valid_bst(__build_tree(values))
`,
  },
  "kth-smallest-element-in-a-bst": {
    entry: "__judge_kth",
    starterCode: `def kth_smallest(root, k):
    """Nodes have .val, .left and .right; k is 1-indexed."""
    # Your code here
    return 0
`,
    solutionCode: `def kth_smallest(root, k):
    stack, node = [], root
    while node or stack:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    return -1
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_kth(values, k):
    return kth_smallest(__build_tree(values), k)
`,
  },
  "lowest-common-ancestor-of-a-bst": {
    entry: "__judge_lca",
    starterCode: `def lowest_common_ancestor(root, p, q):
    """Nodes have .val, .left and .right; p and q are nodes in the BST. Return the ancestor node."""
    # Your code here
    return root
`,
    solutionCode: `def lowest_common_ancestor(root, p, q):
    node = root
    while node:
        if p.val < node.val and q.val < node.val:
            node = node.left
        elif p.val > node.val and q.val > node.val:
            node = node.right
        else:
            return node
    return None
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_lca(values, p_val, q_val):
    root = __build_tree(values)

    def find(target):
        stack = [root]
        while stack:
            node = stack.pop()
            if node is None:
                continue
            if node.val == target:
                return node
            stack.extend((node.left, node.right))
        return None

    answer = lowest_common_ancestor(root, find(p_val), find(q_val))
    return None if answer is None else answer.val
`,
  },
};
