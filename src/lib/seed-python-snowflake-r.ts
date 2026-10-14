import type { JudgeLanguage } from "./types";

// Python judges for Blind 75 part E (graphs, intervals, linked lists), keyed
// by slug and merged into judge.python by the seed script like
// seed-python.ts. Linked lists arrive as arrays and are built into nodes
// with .val and .next by the shared driver below.

export const LIST_BUILDER_PY = `class _ListNode:
    def __init__(self, val):
        self.val = val
        self.next = None


def __build_list(values, pos=-1):
    nodes = [_ListNode(v) for v in values]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if pos >= 0 and nodes:
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None


def __to_list(head):
    out, node, count = [], head, 0
    while node is not None and count < 10000:
        out.append(node.val)
        node = node.next
        count += 1
    return out
`;

export const snowflakePythonJudgesR: Record<string, JudgeLanguage> = {
  "longest-consecutive-sequence": {
    entry: "longest_consecutive",
    starterCode: `def longest_consecutive(nums):
    """Length of the longest run of consecutive integers, in O(n)."""
    # Your code here
    return 0
`,
    solutionCode: `def longest_consecutive(nums):
    values = set(nums)
    best = 0
    for value in values:
        if value - 1 in values:
            continue
        length = 1
        while value + length in values:
            length += 1
        best = max(best, length)
    return best
`,
  },
  "alien-dictionary": {
    entry: "alien_order",
    starterCode: `def alien_order(words):
    """The alphabet the sorted words imply, or "" if none exists."""
    # Your code here
    return ""
`,
    solutionCode: `from collections import deque


def alien_order(words):
    after = {ch: set() for word in words for ch in word}
    indegree = {ch: 0 for ch in after}
    for a, b in zip(words, words[1:]):
        j = 0
        while j < len(a) and j < len(b) and a[j] == b[j]:
            j += 1
        if j == len(b) and len(a) > len(b):
            return ""
        if j < len(a) and j < len(b) and b[j] not in after[a[j]]:
            after[a[j]].add(b[j])
            indegree[b[j]] += 1
    queue = deque(ch for ch in indegree if indegree[ch] == 0)
    order = []
    while queue:
        ch = queue.popleft()
        order.append(ch)
        for nxt in after[ch]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return "".join(order) if len(order) == len(indegree) else ""
`,
  },
  "non-overlapping-intervals": {
    entry: "erase_overlap_intervals",
    starterCode: `def erase_overlap_intervals(intervals):
    """Fewest removals so that no two intervals overlap."""
    # Your code here
    return 0
`,
    solutionCode: `def erase_overlap_intervals(intervals):
    removed, end = 0, float("-inf")
    for start, finish in sorted(intervals, key=lambda it: it[1]):
        if start >= end:
            end = finish
        else:
            removed += 1
    return removed
`,
  },
  "meeting-rooms": {
    entry: "can_attend_meetings",
    starterCode: `def can_attend_meetings(intervals):
    # Your code here
    return False
`,
    solutionCode: `def can_attend_meetings(intervals):
    ordered = sorted(intervals)
    return all(b[0] >= a[1] for a, b in zip(ordered, ordered[1:]))
`,
  },
  "reverse-linked-list": {
    entry: "__judge_reverse",
    starterCode: `def reverse_list(head):
    """Nodes have .val and .next (None at the end). Return the new head."""
    # Your code here
    return head
`,
    solutionCode: `def reverse_list(head):
    prev, current = None, head
    while current:
        current.next, prev, current = prev, current, current.next
    return prev
`,
    driverCode: `${LIST_BUILDER_PY}

def __judge_reverse(values):
    return __to_list(reverse_list(__build_list(values)))
`,
  },
  "linked-list-cycle": {
    entry: "__judge_cycle",
    starterCode: `def has_cycle(head):
    """Nodes have .val and .next. O(1) extra space."""
    # Your code here
    return False
`,
    solutionCode: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False
`,
    driverCode: `${LIST_BUILDER_PY}

def __judge_cycle(values, pos):
    return has_cycle(__build_list(values, pos))
`,
  },
};
