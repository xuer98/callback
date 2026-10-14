import type { JudgeLanguage } from "./types";

// Python judges for Blind 75 part D (dynamic programming and graphs), keyed
// by slug and merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesQ: Record<string, JudgeLanguage> = {
  "house-robber-ii": {
    entry: "rob",
    starterCode: `def rob(nums):
    """The houses form a circle."""
    # Your code here
    return 0
`,
    solutionCode: `def rob(nums):
    if len(nums) == 1:
        return nums[0]

    def line(houses):
        with_prev = without_prev = 0
        for money in houses:
            with_prev, without_prev = without_prev + money, max(without_prev, with_prev)
        return max(with_prev, without_prev)

    return max(line(nums[1:]), line(nums[:-1]))
`,
  },
  "decode-ways": {
    entry: "num_decodings",
    starterCode: `def num_decodings(s):
    """Ways to decode a digit string where A..Z are 1..26."""
    # Your code here
    return 0
`,
    solutionCode: `def num_decodings(s):
    two_back, one_back = 1, 0 if s[0] == "0" else 1
    for i in range(1, len(s)):
        current = 0 if s[i] == "0" else one_back
        if 10 <= int(s[i - 1 : i + 1]) <= 26:
            current += two_back
        two_back, one_back = one_back, current
    return one_back
`,
  },
  "unique-paths": {
    entry: "unique_paths",
    starterCode: `def unique_paths(m, n):
    # Your code here
    return 0
`,
    solutionCode: `def unique_paths(m, n):
    row = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[-1]
`,
  },
  "jump-game": {
    entry: "can_jump",
    starterCode: `def can_jump(nums):
    # Your code here
    return False
`,
    solutionCode: `def can_jump(nums):
    reach = 0
    for i, step in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + step)
    return True
`,
  },
  "clone-graph": {
    entry: "__judge_clone",
    starterCode: `class Node:
    def __init__(self, val, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []


def clone_graph(node):
    """A deep copy of the graph reachable from node (None for None)."""
    # Your code here
    return None
`,
    solutionCode: `from collections import deque


class Node:
    def __init__(self, val, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []


def clone_graph(node):
    if node is None:
        return None
    copies = {node: Node(node.val)}
    queue = deque([node])
    while queue:
        original = queue.popleft()
        for neighbor in original.neighbors:
            if neighbor not in copies:
                copies[neighbor] = Node(neighbor.val)
                queue.append(neighbor)
            copies[original].neighbors.append(copies[neighbor])
    return copies[node]
`,
    driverCode: `class _Original:
    def __init__(self, val):
        self.val = val
        self.neighbors = []


def __judge_clone(adjacency):
    nodes = [_Original(i + 1) for i in range(len(adjacency))]
    for node, links in zip(nodes, adjacency):
        node.neighbors = [nodes[v - 1] for v in links]
    copy = clone_graph(nodes[0] if nodes else None)
    if not adjacency:
        return [] if copy is None else "expected None for an empty graph"
    originals = set(map(id, nodes))
    seen, queue = {id(copy): copy}, [copy]
    while queue:
        node = queue.pop()
        if node is None or not isinstance(getattr(node, "val", None), int):
            return "every node needs an integer val"
        if id(node) in originals:
            return "the copy shares a node with the original"
        for nxt in node.neighbors:
            if id(nxt) not in seen:
                seen[id(nxt)] = nxt
                queue.append(nxt)
    out = [None] * len(adjacency)
    for node in seen.values():
        if not 1 <= node.val <= len(out) or out[node.val - 1] is not None:
            return "val %d is unexpected or repeated in the copy" % node.val
        out[node.val - 1] = sorted(n.val for n in node.neighbors)
    if any(links is None for links in out):
        return "the copy is missing nodes"
    return out
`,
  },
  "pacific-atlantic-water-flow": {
    entry: "__judge_pacific",
    starterCode: `def pacific_atlantic(heights):
    """Cells [r, c] from which water reaches both oceans, any order."""
    # Your code here
    return []
`,
    solutionCode: `def pacific_atlantic(heights):
    rows, cols = len(heights), len(heights[0]) if heights else 0

    def flood(seeds):
        seen = set(seeds)
        queue = list(seeds)
        while queue:
            r, c = queue.pop()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                    if heights[nr][nc] >= heights[r][c]:
                        seen.add((nr, nc))
                        queue.append((nr, nc))
        return seen

    pacific = [(r, 0) for r in range(rows)] + [(0, c) for c in range(cols)]
    atlantic = [(r, cols - 1) for r in range(rows)] + [(rows - 1, c) for c in range(cols)]
    both = flood(pacific) & flood(atlantic)
    return [[r, c] for r in range(rows) for c in range(cols) if (r, c) in both]
`,
    driverCode: `def __judge_pacific(heights):
    return sorted([list(cell) for cell in pacific_atlantic(heights)])
`,
  },
};
