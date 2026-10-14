import type { JudgeLanguage } from "./types";
import { LIST_BUILDER_PY } from "./seed-python-snowflake-r";

// Python judges for Blind 75 part F (linked lists, matrices, one string),
// keyed by slug and merged into judge.python by the seed script like
// seed-python.ts.

export const snowflakePythonJudgesS: Record<string, JudgeLanguage> = {
  "remove-nth-node-from-end": {
    entry: "__judge_remove_nth",
    starterCode: `def remove_nth_from_end(head, n):
    """Nodes have .val and .next. Return the head after removing the n-th from the end."""
    # Your code here
    return head
`,
    solutionCode: `class _Dummy:
    def __init__(self, nxt):
        self.val = 0
        self.next = nxt


def remove_nth_from_end(head, n):
    dummy = _Dummy(head)
    lead = trail = dummy
    for _ in range(n + 1):
        lead = lead.next
    while lead:
        lead, trail = lead.next, trail.next
    trail.next = trail.next.next
    return dummy.next
`,
    driverCode: `${LIST_BUILDER_PY}

def __judge_remove_nth(values, n):
    return __to_list(remove_nth_from_end(__build_list(values), n))
`,
  },
  "reorder-list": {
    entry: "__judge_reorder",
    starterCode: `def reorder_list(head):
    """Nodes have .val and .next. Reorder in place; return nothing."""
    # Your code here
`,
    solutionCode: `def reorder_list(head):
    if not head or not head.next:
        return
    slow = fast = head
    while fast.next and fast.next.next:
        slow, fast = slow.next, fast.next.next
    second, slow.next = slow.next, None
    prev = None
    while second:
        second.next, prev, second = prev, second, second.next
    first, second = head, prev
    while second:
        first.next, second.next, first, second = second, first.next, first.next, second.next
`,
    driverCode: `${LIST_BUILDER_PY}

def __judge_reorder(values):
    head = __build_list(values)
    reorder_list(head)
    return __to_list(head)
`,
  },
  "set-matrix-zeroes": {
    entry: "__judge_zeroes",
    starterCode: `def set_zeroes(matrix):
    """Zero every row and column holding a zero, in place; return nothing."""
    # Your code here
`,
    solutionCode: `def set_zeroes(matrix):
    rows, cols = len(matrix), len(matrix[0]) if matrix else 0
    first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_zero = any(matrix[r][0] == 0 for r in range(rows))
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = matrix[0][c] = 0
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0
    if first_row_zero:
        for c in range(cols):
            matrix[0][c] = 0
    if first_col_zero:
        for r in range(rows):
            matrix[r][0] = 0
`,
    driverCode: `def __judge_zeroes(matrix):
    set_zeroes(matrix)
    return matrix
`,
  },
  "spiral-matrix": {
    entry: "spiral_order",
    starterCode: `def spiral_order(matrix):
    # Your code here
    return []
`,
    solutionCode: `def spiral_order(matrix):
    out = []
    if not matrix:
        return out
    top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        out.extend(matrix[top][c] for c in range(left, right + 1))
        top += 1
        out.extend(matrix[r][right] for r in range(top, bottom + 1))
        right -= 1
        if top <= bottom:
            out.extend(matrix[bottom][c] for c in range(right, left - 1, -1))
            bottom -= 1
        if left <= right:
            out.extend(matrix[r][left] for r in range(bottom, top - 1, -1))
            left += 1
    return out
`,
  },
  "rotate-image": {
    entry: "__judge_rotate",
    starterCode: `def rotate(matrix):
    """Rotate the square matrix 90 degrees clockwise in place; return nothing."""
    # Your code here
`,
    solutionCode: `def rotate(matrix):
    n = len(matrix)
    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
    for row in matrix:
        row.reverse()
`,
    driverCode: `def __judge_rotate(matrix):
    rotate(matrix)
    return matrix
`,
  },
  "longest-substring-without-repeating-characters": {
    entry: "length_of_longest_substring",
    starterCode: `def length_of_longest_substring(s):
    # Your code here
    return 0
`,
    solutionCode: `def length_of_longest_substring(s):
    last_seen, start, best = {}, 0, 0
    for i, ch in enumerate(s):
        if last_seen.get(ch, -1) >= start:
            start = last_seen[ch] + 1
        last_seen[ch] = i
        best = max(best, i - start + 1)
    return best
`,
  },
};
