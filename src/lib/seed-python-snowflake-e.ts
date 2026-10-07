import type { JudgeLanguage } from "./types";
import { RUN_OPERATIONS_PY } from "./seed-python-snowflake-b";

// Python judges for the Snowflake coding bank, parts L and M, keyed by slug
// and merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesE: Record<string, JudgeLanguage> = {
  "top-k-search-terms": {
    entry: "top_search_terms",
    starterCode: `def top_search_terms(queries, k):
    """queries: [user, term] pairs. The k terms with the most distinct
    users, ties alphabetical."""
    # Your code here
    return []
`,
    solutionCode: `from collections import defaultdict


def top_search_terms(queries, k):
    # A set of users per term, then sort by (score desc, term asc).
    users = defaultdict(set)
    for user, term in queries:
        users[term].add(user)
    ranked = sorted(users, key=lambda term: (-len(users[term]), term))
    return ranked[:k]
`,
  },
  "top-k-books-after-each-update": {
    entry: "__run_operations",
    starterCode: `class TopSellers:
    def __init__(self, k):
        # Your state here
        pass

    def sale(self, book, quantity):
        """The top k books after this sale: highest total first, ties
        alphabetical."""
        return []
`,
    solutionCode: `class TopSellers:
    # Totals in a dict; the top k is re-ranked after each sale.
    def __init__(self, k):
        self.k = k
        self.totals = {}

    def sale(self, book, quantity):
        self.totals[book] = self.totals.get(book, 0) + quantity
        ranked = sorted(self.totals, key=lambda title: (-self.totals[title], title))
        return ranked[:self.k]
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "merge-k-sorted-lists": {
    entry: "merge_k_sorted",
    starterCode: `def merge_k_sorted(lists):
    """lists: sorted lists of integers. One sorted list with every value."""
    # Your code here
    return []
`,
    solutionCode: `import heapq


def merge_k_sorted(lists):
    # A heap of one head per list: O(N log k).
    heap = [(values[0], i, 0) for i, values in enumerate(lists) if values]
    heapq.heapify(heap)
    out = []
    while heap:
        value, i, at = heapq.heappop(heap)
        out.append(value)
        if at + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][at + 1], i, at + 1))
    return out
`,
  },
  "copy-list-with-random-pointer": {
    entry: "__judge_copy",
    starterCode: `def copy_random_list(head):
    """Nodes have .val, .next and .random (None when absent). The head of a
    deep copy, or None for an empty list."""
    # Your code here
    return None
`,
    solutionCode: `class _Clone:
    def __init__(self, val):
        self.val = val
        self.next = None
        self.random = None


def copy_random_list(head):
    # Two passes over a dict from original to clone.
    clones = {}
    node = head
    while node is not None:
        clones[id(node)] = _Clone(node.val)
        node = node.next
    node = head
    while node is not None:
        clone = clones[id(node)]
        clone.next = clones[id(node.next)] if node.next is not None else None
        clone.random = clones[id(node.random)] if node.random is not None else None
        node = node.next
    return clones[id(head)] if head is not None else None
`,
    driverCode: `class _Node:
    def __init__(self, val):
        self.val = val
        self.next = None
        self.random = None


def __judge_copy(spec):
    nodes = [_Node(val) for val, _ in spec]
    for i, (_, random) in enumerate(spec):
        nodes[i].next = nodes[i + 1] if i + 1 < len(nodes) else None
        nodes[i].random = nodes[random] if random is not None else None
    result = copy_random_list(nodes[0] if nodes else None)
    if not nodes:
        return [] if result is None else "expected None for an empty list"
    originals = {id(n) for n in nodes}
    copy, seen, node = [], set(), result
    while node is not None:
        if id(node) in originals:
            return "the copy shares a node with the original"
        if id(node) in seen or len(copy) > len(nodes):
            return "the copy is longer than the original"
        seen.add(id(node))
        copy.append(node)
        node = node.next
    if len(copy) != len(nodes):
        return "the copy has " + str(len(copy)) + " nodes, not " + str(len(nodes))
    index = {id(n): i for i, n in enumerate(copy)}
    out = []
    for i, n in enumerate(copy):
        if n.val != nodes[i].val:
            return "node " + str(i) + " has the wrong value"
        if n.random is None:
            out.append([n.val, None])
        elif id(n.random) not in index:
            return "node " + str(i) + " points at a node outside the copy"
        else:
            out.append([n.val, index[id(n.random)]])
    return out
`,
  },
  "merge-two-sorted-lists": {
    entry: "merge_sorted",
    starterCode: `def merge_sorted(a, b):
    """Every value of the two sorted lists, sorted."""
    # Your code here
    return []
`,
    solutionCode: `def merge_sorted(a, b):
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    return out + a[i:] + b[j:]
`,
  },
  "happy-number": {
    entry: "is_happy",
    starterCode: `def is_happy(n):
    # Your code here
    return False
`,
    solutionCode: `def is_happy(n):
    # Floyd's cycle detection over the digit-square sequence.
    def step(x):
        return sum(int(d) ** 2 for d in str(x))

    slow, fast = n, step(n)
    while fast != 1 and slow != fast:
        slow = step(slow)
        fast = step(step(fast))
    return fast == 1
`,
  },
  "sort-colors-with-api": {
    entry: "__judge_sort_colors",
    starterCode: `def sort_colors(n, api):
    """api.get_color(i) and api.swap(i, j) are the only access to the hidden
    array of n colours (0, 1, 2). Sort it in place in one pass."""
    # Your code here
    pass
`,
    solutionCode: `def sort_colors(n, api):
    # Dutch national flag: 0s before low, 2s after high, unread between mid and high.
    low, mid, high = 0, 0, n - 1
    while mid <= high:
        colour = api.get_color(mid)
        if colour == 0:
            api.swap(low, mid)
            low += 1
            mid += 1
        elif colour == 2:
            api.swap(mid, high)        # the swapped-in value is still unread
            high -= 1
        else:
            mid += 1
`,
    driverCode: `def __judge_sort_colors(colors):
    data = list(colors)
    reads = [0]

    class Api:
        def get_color(self, i):
            reads[0] += 1
            return data[i]

        def swap(self, i, j):
            data[i], data[j] = data[j], data[i]

    sort_colors(len(data), Api())
    if reads[0] > 2 * len(data):
        return "too many reads (" + str(reads[0]) + ")"
    return data
`,
  },
  "amount-paid-in-taxes": {
    entry: "__judge_tax",
    starterCode: `def calculate_tax(brackets, income):
    """brackets: [upper, percent] sorted by upper. The total tax."""
    # Your code here
    return 0
`,
    solutionCode: `def calculate_tax(brackets, income):
    tax = 0
    previous = 0
    for upper, percent in brackets:
        if income <= previous:
            break
        tax += (min(income, upper) - previous) * percent / 100
        previous = upper
    return tax
`,
    driverCode: `def __judge_tax(brackets, income):
    return round(calculate_tax(brackets, income), 5)
`,
  },
  "design-circular-queue": {
    entry: "__run_operations",
    starterCode: `class MyCircularQueue:
    def __init__(self, k):
        # Your state here
        pass

    def en_queue(self, value):
        return False

    def de_queue(self):
        return False

    def front(self):
        return -1

    def rear(self):
        return -1

    def is_empty(self):
        return True

    def is_full(self):
        return False
`,
    solutionCode: `class MyCircularQueue:
    # Ring buffer with an explicit size, so empty and full are distinct.
    def __init__(self, k):
        self.data = [None] * k
        self.head = 0
        self.size = 0

    def en_queue(self, value):
        if self.is_full():
            return False
        self.data[(self.head + self.size) % len(self.data)] = value
        self.size += 1
        return True

    def de_queue(self):
        if self.is_empty():
            return False
        self.head = (self.head + 1) % len(self.data)
        self.size -= 1
        return True

    def front(self):
        return -1 if self.is_empty() else self.data[self.head]

    def rear(self):
        return -1 if self.is_empty() else self.data[(self.head + self.size - 1) % len(self.data)]

    def is_empty(self):
        return self.size == 0

    def is_full(self):
        return self.size == len(self.data)
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "n-queens": {
    entry: "__judge_queens",
    starterCode: `def solve_n_queens(n):
    """Every solution as n rows of Q and ., in any order."""
    # Your code here
    return []
`,
    solutionCode: `def solve_n_queens(n):
    # Backtrack over rows; three sets answer "is this square attacked" in O(1).
    solutions = []
    columns, diagonals, anti_diagonals, placement = set(), set(), set(), []

    def place(row):
        if row == n:
            solutions.append(["." * c + "Q" + "." * (n - c - 1) for c in placement])
            return
        for c in range(n):
            if c in columns or (row - c) in diagonals or (row + c) in anti_diagonals:
                continue
            columns.add(c)
            diagonals.add(row - c)
            anti_diagonals.add(row + c)
            placement.append(c)
            place(row + 1)
            placement.pop()
            columns.discard(c)
            diagonals.discard(row - c)
            anti_diagonals.discard(row + c)

    place(0)
    return solutions
`,
    driverCode: `def __judge_queens(n):
    return sorted((list(board) for board in solve_n_queens(n)), key=lambda board: "".join(board))
`,
  },
  "original-string-exists": {
    entry: "possibly_equals",
    starterCode: `def possibly_equals(s1, s2):
    """Whether one original string could produce both encodings."""
    # Your code here
    return False
`,
    solutionCode: `from functools import lru_cache


def possibly_equals(s1, s2):
    # Memoised search over (i, j, balance); balance = letters s2 has accounted for beyond s1.
    @lru_cache(maxsize=None)
    def dfs(i, j, balance):
        if i == len(s1) and j == len(s2):
            return balance == 0
        if i < len(s1) and s1[i].isdigit():
            value = 0
            for k in range(i, min(i + 3, len(s1))):
                if not s1[k].isdigit():
                    break
                value = value * 10 + int(s1[k])
                if dfs(k + 1, j, balance - value):
                    return True
            return False
        if j < len(s2) and s2[j].isdigit():
            value = 0
            for k in range(j, min(j + 3, len(s2))):
                if not s2[k].isdigit():
                    break
                value = value * 10 + int(s2[k])
                if dfs(i, k + 1, balance + value):
                    return True
            return False
        if balance == 0:
            return i < len(s1) and j < len(s2) and s1[i] == s2[j] and dfs(i + 1, j + 1, 0)
        if balance > 0:
            return i < len(s1) and dfs(i + 1, j, balance - 1)      # s2's wildcard swallows s1's letter
        return j < len(s2) and dfs(i, j + 1, balance + 1)          # and the mirror

    return dfs(0, 0, 0)
`,
  },
};
