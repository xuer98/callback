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
};
