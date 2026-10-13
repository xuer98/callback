import type { JudgeLanguage } from "./types";
import { TREE_BUILDER_PY } from "./seed-python-snowflake-c";

// Python judges for the Snowflake coding bank part T (the long-tail tree
// prompts) and the two scans of LeetCode-tag part M, keyed by slug and
// merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesM: Record<string, JudgeLanguage> = {
  "preorder-skipping-marked-nodes": {
    entry: "__judge_preorder",
    starterCode: `def preorder_skipping(root, marked):
    """Nodes have .val, .left and .right. Pre-order, skipping marked nodes and their subtrees."""
    # Your code here
    return []
`,
    solutionCode: `def preorder_skipping(root, marked):
    skip = set(marked)
    out, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        if node.val in skip:
            continue
        out.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return out
`,
    driverCode: `${TREE_BUILDER_PY}

def __judge_preorder(values, marked):
    return preorder_skipping(__build_tree(values), marked)
`,
  },
  "delete-node-in-parent-array-forest": {
    entry: "delete_node",
    starterCode: `def delete_node(parent, x):
    """parent[i] is i's parent, -1 for a root. Delete x: children move to x's parent; x becomes None."""
    # Your code here
    return parent
`,
    solutionCode: `def delete_node(parent, x):
    up = parent[x]
    out = [up if p == x else p for p in parent]
    out[x] = None
    return out
`,
  },
  "complete-tree-subtree-sums": {
    entry: "subtree_sums",
    starterCode: `def subtree_sums(a, b):
    """Merge two complete trees in array form by index, then replace each node by its subtree sum."""
    # Your code here
    return []
`,
    solutionCode: `def subtree_sums(a, b):
    n = max(len(a), len(b))
    sums = [(a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0) for i in range(n)]
    for i in range(n - 1, 0, -1):
        sums[(i - 1) // 2] += sums[i]
    return sums
`,
  },
  "alert-using-same-key-card": {
    entry: "alert_names",
    starterCode: `def alert_names(key_name, key_time):
    """Names with three or more uses within one hour (inclusive), sorted."""
    # Your code here
    return []
`,
    solutionCode: `def alert_names(key_name, key_time):
    by_name = {}
    for name, time in zip(key_name, key_time):
        h, m = time.split(":")
        by_name.setdefault(name, []).append(int(h) * 60 + int(m))
    alerted = []
    for name, times in by_name.items():
        times.sort()
        if any(times[i] - times[i - 2] <= 60 for i in range(2, len(times))):
            alerted.append(name)
    return sorted(alerted)
`,
  },
  "most-frequent-ids": {
    entry: "most_frequent_ids",
    starterCode: `def most_frequent_ids(nums, freq):
    """The top count after each step (0 when the collection is empty)."""
    # Your code here
    return []
`,
    solutionCode: `import heapq


def most_frequent_ids(nums, freq):
    count, heap, out = {}, [], []
    for value, delta in zip(nums, freq):
        nxt = max(0, count.get(value, 0) + delta)
        count[value] = nxt
        heapq.heappush(heap, (-nxt, value))
        while heap and -heap[0][0] != count[heap[0][1]]:
            heapq.heappop(heap)
        out.append(-heap[0][0] if heap else 0)
    return out
`,
  },
};
