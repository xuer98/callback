import type { JudgeLanguage } from "./types";
import { RUN_OPERATIONS_PY } from "./seed-python-snowflake-b";

// Python judges for the Snowflake coding bank, parts H and I, keyed by slug
// and merged into judge.python by the seed script like seed-python.ts.

/** Builds a tree of _TreeNode(val, left, right) from a level-order list. */
const TREE_BUILDER_PY = `class _TreeNode:
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
  "boundary-of-binary-tree": {
    entry: "__judge_boundary",
    starterCode: `def boundary_of_binary_tree(root):
    """Nodes have .val, .left and .right (None when absent). The boundary
    anti-clockwise from the root: root, left edge, leaves, right edge up."""
    # Your code here
    return []
`,
    solutionCode: `def boundary_of_binary_tree(root):
    # Root, left edge down (no leaves), leaves left to right, right edge back up (no leaves).
    if root is None:
        return []

    def is_leaf(node):
        return node.left is None and node.right is None

    out = [root.val]
    if is_leaf(root):
        return out
    node = root.left
    while node is not None:
        if not is_leaf(node):
            out.append(node.val)
        node = node.left if node.left is not None else node.right

    def leaves(node):
        if node is None:
            return
        if is_leaf(node):
            out.append(node.val)
        leaves(node.left)
        leaves(node.right)

    leaves(root.left)
    leaves(root.right)
    right = []
    node = root.right
    while node is not None:
        if not is_leaf(node):
            right.append(node.val)
        node = node.right if node.right is not None else node.left
    return out + right[::-1]
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_boundary(values):
    return boundary_of_binary_tree(__build_tree(values))
`,
  },
  "longest-univalue-path": {
    entry: "__judge_univalue",
    starterCode: `def longest_univalue_path(root):
    """Nodes have .val, .left and .right. Length in edges of the longest
    path whose nodes all share one value."""
    # Your code here
    return 0
`,
    solutionCode: `def longest_univalue_path(root):
    # Post-order: return the longest same-value arm, record arm + arm along the way.
    best = 0

    def arm(node):
        nonlocal best
        if node is None:
            return 0
        left, right = arm(node.left), arm(node.right)
        left_arm = left + 1 if node.left is not None and node.left.val == node.val else 0
        right_arm = right + 1 if node.right is not None and node.right.val == node.val else 0
        best = max(best, left_arm + right_arm)
        return max(left_arm, right_arm)

    arm(root)
    return best
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_univalue(values):
    return longest_univalue_path(__build_tree(values))
`,
  },
  "step-by-step-directions": {
    entry: "__judge_directions",
    starterCode: `def get_directions(root, start_value, dest_value):
    """Nodes have .val, .left and .right; values are unique. The shortest
    route from start to dest as a string of U, L and R."""
    # Your code here
    return ""
`,
    solutionCode: `def get_directions(root, start_value, dest_value):
    # Two root paths; strip the shared prefix; U's for what is left of the start path.
    def path_to(target):
        steps = []

        def search(node):
            if node is None:
                return False
            if node.val == target:
                return True
            steps.append("L")
            if search(node.left):
                return True
            steps[-1] = "R"
            if search(node.right):
                return True
            steps.pop()
            return False

        search(root)
        return "".join(steps)

    from_start, to_dest = path_to(start_value), path_to(dest_value)
    shared = 0
    while shared < len(from_start) and shared < len(to_dest) and from_start[shared] == to_dest[shared]:
        shared += 1
    return "U" * (len(from_start) - shared) + to_dest[shared:]
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_directions(values, start_value, dest_value):
    return get_directions(__build_tree(values), start_value, dest_value)
`,
  },
  "throne-inheritance": {
    entry: "__run_operations",
    starterCode: `class ThroneInheritance:
    def __init__(self, king_name):
        # Your state here
        pass

    def birth(self, parent_name, child_name):
        pass

    def death(self, name):
        pass

    def get_inheritance_order(self):
        """The living, in succession order."""
        return []
`,
    solutionCode: `class ThroneInheritance:
    # Pre-order over the family tree, skipping the dead.
    def __init__(self, king_name):
        self.king = king_name
        self.children = {}
        self.dead = set()

    def birth(self, parent_name, child_name):
        self.children.setdefault(parent_name, []).append(child_name)

    def death(self, name):
        self.dead.add(name)

    def get_inheritance_order(self):
        order, stack = [], [self.king]
        while stack:
            name = stack.pop()
            if name not in self.dead:
                order.append(name)
            stack.extend(reversed(self.children.get(name, [])))   # eldest on top
        return order
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "encode-decode-strings": {
    entry: "__judge_codec",
    starterCode: `def encode(strings):
    """One string that decode() turns back into the list."""
    # Your code here
    return ""


def decode(encoded):
    # Your code here
    return []
`,
    solutionCode: `def encode(strings):
    # length#data per string: the length is read before the data, so the data may contain anything.
    return "".join(str(len(s)) + "#" + s for s in strings)


def decode(encoded):
    out, i = [], 0
    while i < len(encoded):
        hash_at = encoded.index("#", i)
        length = int(encoded[i:hash_at])
        out.append(encoded[hash_at + 1:hash_at + 1 + length])
        i = hash_at + 1 + length
    return out
`,
    driverCode: `def __judge_codec(strings):
    encoded = encode(list(strings))
    if not isinstance(encoded, str):
        return "encode must return a string"
    return decode(encoded)
`,
  },
  "valid-parentheses": {
    entry: "is_valid",
    starterCode: `def is_valid(s):
    """s holds only ()[]{}."""
    # Your code here
    return False
`,
    solutionCode: `def is_valid(s):
    # Push the expected closer; every closer must match the top.
    closer = {"(": ")", "[": "]", "{": "}"}
    stack = []
    for ch in s:
        if ch in closer:
            stack.append(closer[ch])
        elif not stack or stack.pop() != ch:
            return False
    return not stack
`,
  },
  "find-all-anagrams": {
    entry: "find_anagrams",
    starterCode: `def find_anagrams(s, p):
    """Start indices of the substrings of s that are anagrams of p."""
    # Your code here
    return []
`,
    solutionCode: `def find_anagrams(s, p):
    # Fixed window with letter counts and a tally of how many counts agree.
    out = []
    if len(p) > len(s):
        return out
    need = [0] * 26
    have = [0] * 26
    for ch in p:
        need[ord(ch) - 97] += 1
    matches = sum(1 for i in range(26) if need[i] == have[i])

    def adjust(letter, delta):
        nonlocal matches
        if need[letter] == have[letter]:
            matches -= 1
        have[letter] += delta
        if need[letter] == have[letter]:
            matches += 1

    for i, ch in enumerate(s):
        adjust(ord(ch) - 97, 1)
        if i >= len(p):
            adjust(ord(s[i - len(p)]) - 97, -1)
        if i >= len(p) - 1 and matches == 26:
            out.append(i - len(p) + 1)
    return out
`,
  },
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
