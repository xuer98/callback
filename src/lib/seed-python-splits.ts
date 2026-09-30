import type { JudgeLanguage } from "./types";

// Python judges for problems split out of multi-question prompts in the
// Pinterest and Anduril banks, keyed by slug and merged into judge.python by
// the seed script like seed-python.ts.

export const splitPythonJudges: Record<string, JudgeLanguage> = {
  "minimum-debt-transfers": {
    entry: "min_transfers",
    starterCode: `def min_transfers(debts):
    """debts: (debtor, creditor, amount) triples. Minimum transfers that
    settle all balances."""
    # Your code here
    return 0
`,
  },
  "itinerary-revisits-airport": {
    entry: "has_loop",
    starterCode: `def has_loop(tickets, start):
    """Does the lexicographically smallest itinerary that uses every
    [frm, to] ticket exactly once from start ever revisit an airport?"""
    # Your code here
    return False
`,
  },
  "board-exact-jumps-min-moves": {
    entry: "min_moves_to_end",
    starterCode: `def min_moves_to_end(board, start):
    """Minimum moves to reach the last index moving exactly board[i]
    steps at a time, or -1."""
    # Your code here
    return -1
`,
  },
  "bank-tellers-finish-time": {
    entry: "min_time_to_serve",
    starterCode: `def min_time_to_serve(times, m):
    """Smallest T with sum(T // times[i]) >= m."""
    # Your code here
    return 0
`,
  },
  "prefix-match-range": {
    entry: "match_range",
    starterCode: `def match_range(words, prefix):
    """words is sorted ascending. Inclusive [first, last] of the indexes of
    words starting with prefix, or [-1, -1]."""
    # Your code here
    return [-1, -1]
`,
  },
  "count-count-and-say-originals": {
    entry: "count_originals",
    starterCode: `def count_originals(s):
    """How many originals does the count-and-say string s have?"""
    # Your code here
    return 0
`,
  },
  "round-numeric-string-list": {
    entry: "round_all",
    starterCode: `def round_all(csv):
    """Round every value in a comma-separated list of numeric strings to
    the nearest integer, rounding half away from zero. No leading zeros,
    never "-0". Values can exceed any built-in numeric type - stay in
    string land."""
    # Your code here
    return csv
`,
  },
  "settle-debts-from-stream": {
    entry: "__settle_stream",
    starterCode: `def settle_from_stream(read_chunk):
    """read_chunk() returns the next chunk, or "" once the stream ends.
    Lines are "payer,payee,amount" (integer amounts) and may be split
    across chunks. Return the minimum number of transactions to settle
    all balances."""
    # Your code here
    return 0
`,
    driverCode: `def __settle_stream(chunks):
    it = iter(chunks)

    def read_chunk():
        return next(it, "")

    return settle_from_stream(read_chunk)
`,
  },
  "team-photo-uneven-teams": {
    entry: "can_arrange_with_gaps",
    starterCode: `def can_arrange_with_gaps(front, back):
    """Rows have max(len(front), len(back)) slots; an empty slot blocks
    nobody. Can every faced back-row player be strictly taller than the
    front-row player ahead of them?"""
    # Your code here
    return False
`,
  },
  "team-photo-rows": {
    entry: "__judge_rows",
    starterCode: `def arrange_with_gaps(front, back):
    """[front_row, back_row], each with max(len(front), len(back)) slots and
    None for an empty slot, or None when no valid arrangement exists."""
    # Your code here
    return None
`,
    driverCode: `def __judge_rows(front, back):
    rows = arrange_with_gaps(front, back)
    if rows is None:
        return "impossible"
    if not isinstance(rows, (list, tuple)) or len(rows) != 2:
        return "not two rows"
    row_f, row_b = rows
    n = max(len(front), len(back))
    if len(row_f) != n or len(row_b) != n:
        return "wrong row length"
    if sorted(h for h in row_f if h is not None) != sorted(front):
        return "front row changed"
    if sorted(h for h in row_b if h is not None) != sorted(back):
        return "back row changed"
    for i, (f, b) in enumerate(zip(row_f, row_b)):
        if f is not None and b is not None and not b > f:
            return "blocked at slot " + str(i)
    return "valid"
`,
  },
  "fewest-towers-to-cover-crossings": {
    entry: "min_towers_to_cover",
    starterCode: `def min_towers_to_cover(crossings, r):
    """Fewest towers of range r (a tower at x covers [x - r, x + r]) that
    cover every crossing. crossings are unsorted and may repeat."""
    # Your code here
    return 0
`,
  },
  "surveillance-footage-clip-choice": {
    entry: "__judge_choice",
    starterCode: `def min_clips_with_choice(clips, T):
    """A smallest set of clips whose union covers [0, T], or None when
    none does."""
    # Your code here
    return None
`,
    driverCode: `def __judge_choice(clips, T):
    known = {tuple(c) for c in clips}
    chosen = min_clips_with_choice(clips, T)
    if chosen is None:
        return "impossible"
    if not isinstance(chosen, (list, tuple)):
        return "not a list"
    for c in chosen:
        if not isinstance(c, (list, tuple)) or len(c) != 2 or tuple(c) not in known:
            return "unknown clip"
    covered = 0
    for s, e in sorted(chosen):
        if s <= covered:
            covered = max(covered, e)
    return {"clips": len(chosen), "covers": covered >= T}
`,
  },
  "surveillance-footage-gaps": {
    entry: "uncovered_gaps",
    starterCode: `def uncovered_gaps(clips, T):
    """Every [start, end] sub-interval of [0, T] that no clip covers, in
    order."""
    # Your code here
    return []
`,
  },
  "distance-between-points": {
    entry: "distance",
    starterCode: `def distance(p, q):
    """Straight-line distance between two points of the same dimension."""
    # Your code here
    return 0.0
`,
  },
  "a-star-grid-search": {
    entry: "__judge_astar",
    starterCode: `def astar_grid(grid, src, dst):
    """A* over a grid of 0 (free) / 1 (blocked), 4-directional unit steps.
    src and dst are (row, col) tuples. Shortest path length, or -1."""
    # Your code here
    return -1
`,
    driverCode: `def __judge_astar(grid, src, dst):
    return astar_grid(grid, tuple(src), tuple(dst))
`,
  },
  "shortest-path-terrain-costs": {
    entry: "__judge_terrain",
    starterCode: `def dijkstra_grid(cost, src, dst):
    """cost[r][c] is the cost to enter a cell, -1 = obstacle. src and dst
    are (row, col) tuples. Cheapest path cost, or -1. The start cell's cost
    isn't paid."""
    # Your code here
    return -1
`,
    driverCode: `def __judge_terrain(cost, src, dst):
    return dijkstra_grid(cost, tuple(src), tuple(dst))
`,
  },
  "sensor-network-components": {
    entry: "count_components",
    starterCode: `def count_components(n, edges):
    """Undirected edges (u, v) over sensors 0..n-1: how many components?"""
    # Your code here
    return 0
`,
  },
  "sensor-processing-order": {
    entry: "__judge_order",
    starterCode: `def topo_order(n, edges):
    """Directed edges (u, v), u before v, over sensors 0..n-1: an order that
    respects every edge, or [] when there's a cycle."""
    # Your code here
    return []
`,
    driverCode: `def __judge_order(n, edges):
    order = topo_order(n, edges)
    if not isinstance(order, (list, tuple)):
        return "not a list"
    if len(order) == 0:
        return "empty"
    if sorted(order) != list(range(n)):
        return "not a permutation"
    pos = {v: i for i, v in enumerate(order)}
    for u, v in edges:
        if pos[u] > pos[v]:
            return "violates edge " + str(u) + "->" + str(v)
    return "valid-order"
`,
  },
  "rod-cutting-with-cut-cost": {
    entry: "rod_cutting_with_cost",
    starterCode: `def rod_cutting_with_cost(prices, n, cut_cost):
    """Maximum net profit when every cut costs cut_cost (selling the rod
    whole makes zero cuts). prices[i] sells a piece of length i + 1."""
    # Your code here
    return 0
`,
  },
  "rod-cutting-limited-pieces": {
    entry: "rod_cutting_limited",
    starterCode: `def rod_cutting_limited(prices, n, max_pieces):
    """Maximum revenue cutting a rod of length n into at most max_pieces
    pieces. prices[i] sells a piece of length i + 1."""
    # Your code here
    return 0
`,
  },
  "nested-brace-expansion": {
    entry: "brace_expansion_ii",
    starterCode: `def brace_expansion_ii(expression):
    """Groups nest and commas union whole sub-expressions. Every distinct
    string the pattern produces, sorted."""
    # Your code here
    return []
`,
  },
  "run-length-encode-decode": {
    entry: "__judge_rle",
    starterCode: `def rle_encode(s):
    """'aaabcc' -> 'a3b1c2'"""
    # Your code here
    return ""


def rle_decode(s):
    """'a3b1c12' -> 'aaab' + 'c' * 12 (counts can be multi-digit)."""
    # Your code here
    return ""
`,
    driverCode: `def __judge_rle(direction, s):
    return rle_encode(s) if direction == "encode" else rle_decode(s)
`,
  },
  "string-compression-in-place": {
    entry: "__judge_compress",
    starterCode: `def compress_inplace(chars):
    """Rewrite the list in place as char + count (count omitted when 1),
    O(1) extra space. Return the new length."""
    # Your code here
    return len(chars)
`,
    driverCode: `def __judge_compress(chars):
    chars = list(chars)
    n = compress_inplace(chars)
    return [n, chars[:n]]
`,
  },
};
