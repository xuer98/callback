import type { JudgeLanguage } from "./types";
import { TREE_BUILDER_PY } from "./seed-python-snowflake-c";

// Python judges for the Snowflake LeetCode-tag bank, parts C and D (binary
// trees and string parsing), keyed by slug and merged into judge.python by
// the seed script like seed-python.ts.

/** Serialises a tree of .val/.left/.right nodes to level order, trailing Nones trimmed. */
export const TREE_SERIALIZER_PY = `def __to_level_order(root):
    out = []
    queue = [root]
    head = 0
    while head < len(queue):
        node = queue[head]
        head += 1
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out
`;

export const snowflakePythonJudgesH: Record<string, JudgeLanguage> = {
  "binary-tree-inorder-traversal": {
    entry: "__judge_inorder",
    starterCode: `def inorder_traversal(root):
    """Nodes have .val, .left and .right (None when absent). Values in inorder, iteratively."""
    # Your code here
    return []
`,
    solutionCode: `def inorder_traversal(root):
    out, stack, node = [], [], root
    while node or stack:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        out.append(node.val)
        node = node.right
    return out
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_inorder(values):
    return inorder_traversal(__build_tree(values))
`,
  },
  "construct-binary-tree-from-preorder-and-inorder": {
    entry: "__judge_build",
    starterCode: `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def build_tree(preorder, inorder):
    """Rebuild the tree; return its root TreeNode (None for no nodes)."""
    # Your code here
    return None
`,
    solutionCode: `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def build_tree(preorder, inorder):
    index_of = {v: i for i, v in enumerate(inorder)}
    cursor = 0

    def build(lo, hi):
        nonlocal cursor
        if lo > hi:
            return None
        val = preorder[cursor]
        cursor += 1
        mid = index_of[val]
        node = TreeNode(val)
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node

    return build(0, len(inorder) - 1)
`,
    driverCode: `${TREE_SERIALIZER_PY}

def __judge_build(preorder, inorder):
    return __to_level_order(build_tree(preorder, inorder))
`,
  },
  "populating-next-right-pointers": {
    entry: "__judge_connect",
    starterCode: `def connect(root):
    """Set node.next on every node (None for the rightmost); return the root.
    Nodes have .val, .left and .right."""
    # Your code here
    return root
`,
    solutionCode: `def connect(root):
    # Thread each level through a dummy head using the previous level's next chain.
    level = root
    while level:
        dummy = type("Dummy", (), {})()
        dummy.next = None
        tail = dummy
        node = level
        while node:
            if node.left:
                tail.next = node.left
                tail = node.left
            if node.right:
                tail.next = node.right
                tail = node.right
            node = getattr(node, "next", None)
        tail.next = None
        level = dummy.next
    return root
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_connect(values):
    root = __build_tree(values)
    connect(root)
    levels = []
    level = root
    while level:
        row, first, node = [], None, level
        while node:
            row.append(node.val)
            if first is None:
                first = node.left or node.right
            if len(row) > 1000:
                raise Exception("next pointers form a cycle")
            node = getattr(node, "next", None)
        levels.append(row)
        level = first
    return levels
`,
  },
  "count-nodes-equal-to-average-of-subtree": {
    entry: "__judge_average",
    starterCode: `def average_of_subtree(root):
    """Nodes have .val, .left and .right. Count nodes equal to their subtree's floored average."""
    # Your code here
    return 0
`,
    solutionCode: `def average_of_subtree(root):
    count = 0

    def walk(node):
        nonlocal count
        if node is None:
            return 0, 0
        ls, lc = walk(node.left)
        rs, rc = walk(node.right)
        total, size = ls + rs + node.val, lc + rc + 1
        if total // size == node.val:
            count += 1
        return total, size

    walk(root)
    return count
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_average(values):
    return average_of_subtree(__build_tree(values))
`,
  },
  "construct-quad-tree": {
    entry: "__judge_quad",
    starterCode: `class QuadNode:
    def __init__(self, val, is_leaf, top_left=None, top_right=None, bottom_left=None, bottom_right=None):
        self.val = val
        self.is_leaf = is_leaf
        self.top_left = top_left
        self.top_right = top_right
        self.bottom_left = bottom_left
        self.bottom_right = bottom_right


def construct(grid):
    """Return the root QuadNode for an n x n grid of 0 and 1 (n a power of two)."""
    # Your code here
    return QuadNode(False, True)
`,
    solutionCode: `class QuadNode:
    def __init__(self, val, is_leaf, top_left=None, top_right=None, bottom_left=None, bottom_right=None):
        self.val = val
        self.is_leaf = is_leaf
        self.top_left = top_left
        self.top_right = top_right
        self.bottom_left = bottom_left
        self.bottom_right = bottom_right


def construct(grid):
    # Build quadrants bottom-up; four identical leaves collapse into one.
    def build(row, col, size):
        if size == 1:
            return QuadNode(grid[row][col] == 1, True)
        half = size // 2
        kids = [build(row, col, half), build(row, col + half, half),
                build(row + half, col, half), build(row + half, col + half, half)]
        if all(k.is_leaf and k.val == kids[0].val for k in kids):
            return QuadNode(kids[0].val, True)
        return QuadNode(True, False, *kids)

    return build(0, 0, len(grid))
`,
    driverCode: `def __judge_quad(grid):
    root = construct(grid)
    out, queue, head = [], [root], 0
    while head < len(queue):
        node = queue[head]
        head += 1
        if node is None:
            out.append(None)
            continue
        if node.is_leaf:
            out.append([1, 1 if node.val else 0])
            queue.extend([None, None, None, None])
        else:
            out.append([0, 1])
            queue.extend([node.top_left, node.top_right, node.bottom_left, node.bottom_right])
    while out and out[-1] is None:
        out.pop()
    return out
`,
  },
  "height-after-subtree-removal-queries": {
    entry: "__judge_tree_queries",
    starterCode: `def tree_queries(root, queries):
    """Nodes have .val (distinct 1..n), .left and .right. Height in edges after removing each query's subtree."""
    # Your code here
    return []
`,
    solutionCode: `def tree_queries(root, queries):
    depths, enter, exit_ = [], {}, {}

    def walk(node, depth):
        if node is None:
            return
        enter[node.val] = len(depths)
        depths.append(depth)
        walk(node.left, depth + 1)
        walk(node.right, depth + 1)
        exit_[node.val] = len(depths) - 1

    walk(root, 0)
    n = len(depths)
    prefix, suffix = [0] * n, [0] * n
    for i in range(n):
        prefix[i] = max(prefix[i - 1] if i else 0, depths[i])
    for i in range(n - 1, -1, -1):
        suffix[i] = max(suffix[i + 1] if i + 1 < n else 0, depths[i])
    out = []
    for q in queries:
        lo, hi = enter[q], exit_[q]
        before = prefix[lo - 1] if lo > 0 else 0
        after = suffix[hi + 1] if hi + 1 < n else 0
        out.append(max(before, after))
    return out
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_tree_queries(values, queries):
    return tree_queries(__build_tree(values), queries)
`,
  },
  "simplify-path": {
    entry: "simplify_path",
    starterCode: `def simplify_path(path):
    """The canonical form of an absolute Unix path."""
    # Your code here
    return "/"
`,
    solutionCode: `def simplify_path(path):
    stack = []
    for part in path.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if stack:
                stack.pop()
            continue
        stack.append(part)
    return "/" + "/".join(stack)
`,
  },
  "basic-calculator": {
    entry: "calculate",
    starterCode: `def calculate(s):
    """Evaluate digits, + - ( ) and spaces without eval."""
    # Your code here
    return 0
`,
    solutionCode: `def calculate(s):
    # Running result and sign; parentheses save and restore them on a stack.
    result, sign, number, stack = 0, 1, 0, []
    for ch in s:
        if ch.isdigit():
            number = number * 10 + int(ch)
        elif ch in "+-":
            result += sign * number
            number = 0
            sign = 1 if ch == "+" else -1
        elif ch == "(":
            stack.append((result, sign))
            result, sign = 0, 1
        elif ch == ")":
            result += sign * number
            number = 0
            saved, saved_sign = stack.pop()
            result = saved + saved_sign * result
            sign = 1
    return result + sign * number
`,
  },
  "decode-string": {
    entry: "decode_string",
    starterCode: `def decode_string(s):
    """k[encoded] repeats encoded k times; encodings nest."""
    # Your code here
    return ""
`,
    solutionCode: `def decode_string(s):
    counts, prefixes, current, k = [], [], "", 0
    for ch in s:
        if ch.isdigit():
            k = k * 10 + int(ch)
        elif ch == "[":
            counts.append(k)
            prefixes.append(current)
            k, current = 0, ""
        elif ch == "]":
            current = prefixes.pop() + current * counts.pop()
        else:
            current += ch
    return current
`,
  },
  "roman-to-integer": {
    entry: "roman_to_int",
    starterCode: `def roman_to_int(s):
    """A valid Roman numeral from 1 to 3999."""
    # Your code here
    return 0
`,
    solutionCode: `def roman_to_int(s):
    value = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, ch in enumerate(s):
        current = value[ch]
        if i + 1 < len(s) and current < value[s[i + 1]]:
            total -= current
        else:
            total += current
    return total
`,
  },
  "integer-to-english-words": {
    entry: "number_to_words",
    starterCode: `def number_to_words(num):
    """0 <= num < 2**31, in English words separated by single spaces."""
    # Your code here
    return ""
`,
    solutionCode: `def number_to_words(num):
    if num == 0:
        return "Zero"
    below20 = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
               "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def group(n):
        words = []
        if n >= 100:
            words += [below20[n // 100], "Hundred"]
            n %= 100
        if n >= 20:
            words.append(tens[n // 10])
            n %= 10
        if n > 0:
            words.append(below20[n])
        return " ".join(words)

    scales = ["", "Thousand", "Million", "Billion"]
    pieces = []
    i = 0
    while num > 0:
        n = num % 1000
        if n:
            pieces.insert(0, group(n) + (" " + scales[i] if scales[i] else ""))
        num //= 1000
        i += 1
    return " ".join(pieces)
`,
  },
  "reverse-only-letters": {
    entry: "reverse_only_letters",
    starterCode: `def reverse_only_letters(s):
    """Reverse the letters; every other character stays put."""
    # Your code here
    return ""
`,
    solutionCode: `def reverse_only_letters(s):
    chars = list(s)
    i, j = 0, len(chars) - 1
    while i < j:
        if not chars[i].isalpha():
            i += 1
        elif not chars[j].isalpha():
            j -= 1
        else:
            chars[i], chars[j] = chars[j], chars[i]
            i += 1
            j -= 1
    return "".join(chars)
`,
  },
};
