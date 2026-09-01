import type { JudgeLanguage } from "./types";

// Python judge definitions, keyed by problem slug, merged into each
// problem's judge as judge.python by the seed script. Tests are shared
// across languages; where test payloads carry camelCase operation names,
// the Python driver maps them onto snake_case implementations.

export const pythonJudges: Record<string, JudgeLanguage> = {
  "pair-sum-sorted": {
    entry: "pair_sum",
    starterCode: `def pair_sum(numbers, target):
    """numbers is sorted ascending. Return [i, j] with i < j, or [-1, -1]."""
    # Your code here
    return [-1, -1]
`,
  },
  "merge-intervals": {
    entry: "merge_intervals",
    starterCode: `def merge_intervals(intervals):
    """intervals are [start, end] pairs in any order.
    Return the merged intervals sorted by start."""
    # Your code here
    return intervals
`,
  },
  "lru-cache": {
    entry: "__run_operations",
    starterCode: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity

    def get(self, key):
        """Return the value, or -1 if absent."""
        return -1

    def put(self, key, value):
        # Your code here
        pass
`,
    driverCode: `def __run_operations(operations, args):
    instance = None
    out = []
    for op, a in zip(operations, args):
        if op == "LRUCache":
            instance = LRUCache(*a)
            out.append(None)
        else:
            out.append(getattr(instance, op)(*a))
    return out
`,
  },
  "course-schedule": {
    entry: "can_finish",
    starterCode: `def can_finish(num_courses, prerequisites):
    """prerequisites [a, b] means b must come before a.
    Return True if all courses can be finished."""
    # Your code here
    return True
`,
  },
  "max-width": {
    entry: "justify",
    starterCode: `def justify(words, max_width):
    """Return the justified lines, each exactly max_width characters."""
    # Your code here
    return []
`,
  },
  "round-numeric-strings": {
    entry: "__dispatch",
    starterCode: `def round_numeric_string(s):
    """Part 1: round one numeric string to the nearest integer, rounding
    half away from zero. No leading zeros in the result, and never "-0".
    Values can exceed any built-in numeric type - stay in string land."""
    # Your code here
    return s


def round_all(csv):
    """Part 2: round every value in a comma-separated list."""
    # Your code here
    return csv
`,
    driverCode: `def __dispatch(kind, value):
    return round_all(value) if kind == "csv" else round_numeric_string(value)
`,
  },
  "violation-log-analyzer": {
    entry: "__run_operations",
    starterCode: `class ViolationLog:
    def __init__(self):
        # Your state here
        pass

    def record(self, timestamp, user_id, violation_type):
        # timestamps are non-decreasing across calls
        pass

    def count_recent(self, user_id, window):
        """Violations by user_id in (latest - window, latest]."""
        return 0

    def top_k(self, k):
        """Top-k users by all-time count, ties lexicographic ->
        [(user, count), ...]"""
        return []

    def should_ban(self, user_id, max_violations, window):
        """True if user_id ever had >= max_violations in any
        window-second span."""
        return False
`,
    driverCode: `def __run_operations(operations, args):
    methods = {
        "record": "record",
        "countRecent": "count_recent",
        "topK": "top_k",
        "shouldBan": "should_ban",
    }
    log = None
    out = []
    for op, a in zip(operations, args):
        if op == "ViolationLog":
            log = ViolationLog(*a)
            out.append(None)
        else:
            out.append(getattr(log, methods[op])(*a))
    return out
`,
  },
  "nested-set-equality": {
    entry: "nested_set_equal",
    starterCode: `def nested_set_equal(a, b):
    """Nested sets are given as (possibly nested) lists of integers.
    Return True when a and b are equal as sets, at every depth."""
    # Your code here
    return False
`,
  },
  "assign-pins-shortest-columns": {
    entry: "assign_pins",
    starterCode: `def assign_pins(heights, k):
    """Return the column index assigned to each pin, in order."""
    # Your code here
    return []
`,
  },
  "collect-reachable-pins": {
    entry: "collect_reachable_pins",
    starterCode: `def collect_reachable_pins(boards, start):
    """boards: dict of board id -> list of pin ids.
    Return every reachable pin id as a SORTED list; [] if start unknown."""
    # Your code here
    return []
`,
  },
  "stream-line-reader": {
    entry: "__dispatch",
    starterCode: `class LineReader:
    def __init__(self, read_chunk):
        """read_chunk() returns the next chunk, or "" once the stream ends."""
        # Your state here
        pass

    def read_line(self):
        """Next complete line without the newline; None once exhausted.
        Call read_chunk lazily."""
        return None


def settle_from_stream(read_chunk):
    """Part 2: lines are "payer,payee,amount" (integer amounts).
    Return the minimum number of transactions to settle all balances
    (use your LineReader)."""
    # Your code here
    return 0
`,
    driverCode: `def __dispatch(kind, chunks, cap):
    it = iter(chunks)

    def read_chunk():
        return next(it, "")

    if kind == "settle":
        return settle_from_stream(read_chunk)
    reader = LineReader(read_chunk)
    out = []
    for _ in range(cap):
        line = reader.read_line()
        out.append(line)
        if line is None:
            break
    return out
`,
  },
  "escape-room-leaderboard": {
    entry: "__run_operations",
    starterCode: `class EscapeRoomGame:
    def __init__(self, player_ids, max_room):
        # Rooms run 0..max_room; player_ids fixes the room-0 tie order.
        pass

    def advance(self, player_id):
        """Move the player forward one room; at the last room, a no-op. O(1)."""
        pass

    def get_room(self, player_id):
        """The player's current room. O(1)."""
        return -1

    def leaderboard(self, k):
        """Up to k ids: room desc, ties by earliest entry. O(N + k)."""
        return []
`,
    driverCode: `def __run_operations(operations, args):
    methods = {"advance": "advance", "getRoom": "get_room", "leaderboard": "leaderboard"}
    game = None
    out = []
    for op, a in zip(operations, args):
        if op == "EscapeRoomGame":
            game = EscapeRoomGame(*a)
            out.append(None)
        else:
            out.append(getattr(game, methods[op])(*a))
    return out
`,
  },
  "rebalance-experiment-buckets": {
    entry: "__judge_rebalance",
    starterCode: `def rebalance_buckets(current, targets):
    """current: per-bucket group name or None. targets: group -> count.
    Return a new assignment meeting targets exactly while changing as
    few buckets as possible."""
    # Your code here
    return current
`,
    driverCode: `def __judge_rebalance(current, targets):
    result = rebalance_buckets(list(current), dict(targets))
    if not isinstance(result, (list, tuple)) or len(result) != len(current):
        return {"validShape": False}
    counts = {}
    for g in result:
        if g is not None:
            counts[g] = counts.get(g, 0) + 1
    targets_met = all(
        counts.get(g, 0) == targets[g] for g in targets
    ) and all(g in targets for g in counts)
    changes = sum(1 for a, b in zip(current, result) if a != b)
    return {"targetsMet": targets_met, "changes": changes}
`,
  },
  "list-unallocated-buckets": {
    entry: "unallocated_ranges",
    starterCode: `def unallocated_ranges(n, allocated):
    """allocated: inclusive [start, end] ranges, any order, possibly
    overlapping or partly out of bounds (clamp them).
    Return the minimal sorted list of free inclusive ranges."""
    # Your code here
    return []
`,
  },
  "adjustable-id-allocator": {
    entry: "__run_operations",
    starterCode: `class IDAllocator:
    def __init__(self, capacity):
        """IDs live in [0, capacity)."""
        # Your state here
        pass

    def allocate(self):
        """Smallest available ID, or -1 if none."""
        return -1

    def release(self, id_):
        """True only if id_ was currently allocated."""
        return False

    def set_capacity(self, c):
        """Adjust capacity up or down; already-issued IDs stay valid."""
        pass
`,
    driverCode: `def __run_operations(operations, args):
    methods = {
        "allocate": "allocate",
        "release": "release",
        "setCapacity": "set_capacity",
    }
    a = None
    out = []
    for op, arg in zip(operations, args):
        if op == "IDAllocator":
            a = IDAllocator(*arg)
            out.append(None)
        else:
            out.append(getattr(a, methods[op])(*arg))
    return out
`,
  },
  "design-adjustable-id-allocator": {
    entry: "__run_allocator_case",
    starterCode: `def pack_buckets(requests):
    """requests: [name, size] pairs. Pack from ID 0 into [0, 999],
    preserving order; a zero-size bucket packs as [name, -1, -1] and
    doesn't advance the cursor. Raise ValueError on a negative size or
    when the sizes sum past 1000."""
    # Your code here
    return []


def resize_buckets(buckets, name, new_size):
    """Resize one bucket of a packed layout to exactly new_size IDs; the
    target keeps its start and later buckets shift by the delta. Must NOT
    mutate buckets when the resize is rejected. Raise KeyError on an
    unknown name, ValueError on a negative size or an overfull layout."""
    # Your code here
    return buckets
`,
    driverCode: `def __run_allocator_case(op, data, name, size):
    snapshot = [list(row) for row in data]
    try:
        if op == "pack":
            return pack_buckets(data)
        return resize_buckets(data, name, size)
    except Exception:
        if data == snapshot:
            return "threw"
        return "threw but mutated its input"
`,
  },
  "settle-debts": {
    entry: "__judge_settle",
    starterCode: `def settle(payments):
    """payments: dicts {payer, amount, payees}; amount splits equally, the
    first amount % len(payees) payees owe one cent extra. Return transfers
    [frm, to, amount] settling everyone, at most n - 1 of them."""
    # Your code here
    return []


def min_transfers(debts):
    """debts: (debtor, creditor, amount) triples. Minimum transfers that
    settle all balances."""
    # Your code here
    return 0
`,
    driverCode: `def __judge_settle(op, payments, debts):
    if op == "min":
        return min_transfers(debts)
    bal = {}

    def add(who, delta):
        bal[who] = bal.get(who, 0) + delta

    for p in payments:
        share, rem = divmod(p["amount"], len(p["payees"]))
        add(p["payer"], p["amount"])
        for i, payee in enumerate(p["payees"]):
            add(payee, -(share + (1 if i < rem else 0)))
    nonzero = sum(1 for b in bal.values() if b != 0)
    transfers = settle(payments)
    if not isinstance(transfers, list):
        return "not a list"
    for t in transfers:
        if len(t) != 3 or not isinstance(t[2], int) or t[2] <= 0:
            return "malformed transfer"
        add(t[0], t[2])
        add(t[1], -t[2])
    return {
        "settled": all(b == 0 for b in bal.values()),
        "withinBound": len(transfers) <= max(0, nonzero - 1),
    }
`,
  },
  "reconstruct-itinerary": {
    entry: "__judge_itinerary",
    starterCode: `def find_itinerary(tickets, start):
    """Use every [frm, to] ticket exactly once from start; return the
    lexicographically smallest itinerary as a list of airports."""
    # Your code here
    return []


def has_loop(tickets, start):
    """Does that itinerary ever revisit an airport?"""
    # Your code here
    return False
`,
    driverCode: `def __judge_itinerary(op, tickets, start):
    if op == "loop":
        return has_loop(tickets, start)
    return find_itinerary(tickets, start)
`,
  },
  "access-log-query": {
    entry: "__run_operations",
    starterCode: `class AccessLog:
    def __init__(self):
        # Your state here
        pass

    def add(self, user_id, action, ts):
        """Records arrive in non-decreasing ts order."""
        pass

    def get_user_actions(self, user_id, start, end):
        """That user's actions with start <= ts <= end, in time order."""
        return []

    def count_unique_users(self, start, end):
        """Distinct users with at least one record in [start, end]."""
        return 0
`,
    driverCode: `def __run_operations(operations, args):
    methods = {
        "add": "add",
        "getUserActions": "get_user_actions",
        "countUniqueUsers": "count_unique_users",
    }
    log = None
    out = []
    for op, arg in zip(operations, args):
        if op == "AccessLog":
            log = AccessLog()
            out.append(None)
        else:
            out.append(getattr(log, methods[op])(*arg))
    return out
`,
  },
  "bus-routes-min-transfers": {
    entry: "num_buses_to_destination",
    starterCode: `def num_buses_to_destination(routes, source, target):
    """Minimum number of buses from stop source to stop target, or -1."""
    # Your code here
    return -1
`,
  },
  "board-exact-jumps": {
    entry: "__judge_board",
    starterCode: `def can_reach_end(board, start):
    """Can you reach the last index moving exactly board[i] steps?"""
    # Your code here
    return False


def min_moves_to_end(board, start):
    """Minimum moves to reach the last index, or -1."""
    # Your code here
    return -1
`,
    driverCode: `def __judge_board(op, board, start):
    if op == "reach":
        return can_reach_end(board, start)
    return min_moves_to_end(board, start)
`,
  },
  "restaurant-free-intervals": {
    entry: "free_intervals",
    starterCode: `def free_intervals(open_t, close_t, capacity, reservations, n):
    """All maximal [a, b] within opening hours where free seats >= n.
    Reservations are (start, end, ppl), half-open [start, end)."""
    # Your code here
    return []
`,
  },
  "count-visible-pins": {
    entry: "max_visible_pins",
    starterCode: `def max_visible_pins(pins, screen_len):
    """pins: (top, bottom, column) with column "L" or "R"; same-column pins
    never overlap. Max pins fully visible in any window of screen_len."""
    # Your code here
    return 0
`,
  },
  "count-subarrays-score": {
    entry: "count_subarrays",
    starterCode: `def count_subarrays(nums, k):
    """Count non-empty subarrays of positive nums whose
    (sum * length) is strictly less than k."""
    # Your code here
    return 0
`,
  },
  "count-pixel-objects": {
    entry: "__judge_pixels",
    starterCode: `def count_objects(grid):
    """Count distinct objects via the API:
    grid.height(), grid.width(), grid.is_background(r, c),
    grid.is_same_object(r1, c1, r2, c2)  # for 4-adjacent in-bounds pixels
    Avoid recursion; the grid can be 2000 x 2000."""
    # Your code here
    return 0
`,
    driverCode: `class __PixelGrid:
    def __init__(self, rows):
        self.rows = rows

    def height(self):
        return len(self.rows)

    def width(self):
        return len(self.rows[0]) if self.rows else 0

    def is_background(self, r, c):
        return self.rows[r][c] == "."

    def is_same_object(self, r1, c1, r2, c2):
        if abs(r1 - r2) + abs(c1 - c2) != 1:
            return False
        a, b = self.rows[r1][c1], self.rows[r2][c2]
        return a != "." and b != "." and a == b


def __judge_pixels(rows):
    return count_objects(__PixelGrid(rows))
`,
  },
  "roads-with-switches": {
    entry: "__judge_roads",
    starterCode: `def min_flips(roads, src, dst):
    """roads: directed (u, v, is_open). Minimum closed roads to flip to
    drive src -> dst, or -1 if unreachable with unlimited flips."""
    # Your code here
    return -1


def can_reach(roads, src, dst, k):
    """True iff min_flips(roads, src, dst) is in [0, k]."""
    # Your code here
    return False
`,
    driverCode: `def __judge_roads(op, roads, src, dst, k):
    if op == "min":
        return min_flips(roads, src, dst)
    return can_reach(roads, src, dst, k)
`,
  },
  "bank-teller-wait-time": {
    entry: "__judge_tellers",
    starterCode: `def wait_time(times, m):
    """Agent i takes times[i] minutes; m customers are ahead of you; ties
    go to the lowest-numbered agent. When does your service start?"""
    # Your code here
    return 0


def min_time_to_serve(times, m):
    """Smallest T with sum(T // times[i]) >= m."""
    # Your code here
    return 0
`,
    driverCode: `def __judge_tellers(op, times, m):
    if op == "wait":
        return wait_time(times, m)
    return min_time_to_serve(times, m)
`,
  },
  "first-word-with-prefix": {
    entry: "__judge_prefix",
    starterCode: `def first_match(words, prefix):
    """words is sorted ascending. Index of the first word starting with
    prefix, or -1. O(log n) comparisons."""
    # Your code here
    return -1


def match_range(words, prefix):
    """Inclusive [first, last] of matching indexes, or [-1, -1]."""
    # Your code here
    return [-1, -1]
`,
    driverCode: `def __judge_prefix(op, words, prefix):
    if op == "first":
        return first_match(words, prefix)
    return match_range(words, prefix)
`,
  },
  "autocomplete-session": {
    entry: "__run_operations",
    starterCode: `class AutocompleteSystem:
    def __init__(self, sentences, times):
        # Your state here
        pass

    def input(self, c):
        """c is a lowercase letter, " ", or "#". Return the top 3 matches
        for the query typed so far (frequency desc, then lexicographic);
        "#" records the typed sentence and resets."""
        return []
`,
    driverCode: `def __run_operations(operations, args):
    system = None
    out = []
    for op, arg in zip(operations, args):
        if op == "AutocompleteSystem":
            system = AutocompleteSystem(*arg)
            out.append(None)
        else:
            out.append(system.input(*arg))
    return out
`,
  },
  "reverse-count-and-say": {
    entry: "__judge_reverse_say",
    starterCode: `def reverse_count_and_say(s):
    """All originals whose count-and-say step produces s, sorted
    ascending. s == "" returns [""]; unparseable s returns []."""
    # Your code here
    return []


def count_originals(s):
    """Just how many originals there are."""
    # Your code here
    return 0
`,
    driverCode: `def __judge_reverse_say(op, s):
    if op == "all":
        return reverse_count_and_say(s)
    return count_originals(s)
`,
  },
  "flag-spam-numbers": {
    entry: "flag_spam_numbers",
    starterCode: `def flag_spam_numbers(call_log, reports, min_reports):
    """call_log: [caller, callee] pairs. reports: [reporter, number] pairs.
    Flag numbers with >= min_reports distinct valid reporters; return
    them sorted."""
    # Your code here
    return []
`,
  },
  "sparse-matrix-operations": {
    entry: "__judge_sparse",
    starterCode: `class SparseMatrix:
    def __init__(self, n_rows, n_cols):
        self.n_rows = n_rows
        self.n_cols = n_cols
        # Your storage here

    @classmethod
    def from_dense(cls, dense):
        # Your code here
        return cls(len(dense), len(dense[0]) if dense else 0)

    def get(self, r, c):
        return 0

    def set(self, r, c, v):
        """Storing 0 must remove the entry."""
        pass

    def add(self, other):
        """Raise on dimension mismatch."""
        return self

    def multiply(self, other):
        """Raise on dimension mismatch."""
        return self

    def to_dense(self):
        return []

    def nnz(self):
        """Count of stored nonzero entries."""
        return 0
`,
    driverCode: `def __judge_sparse(op, dense_a, dense_b, extra):
    a = SparseMatrix.from_dense(dense_a)
    if op == "get":
        return a.get(*extra)
    if op == "set":
        a.set(*extra)
        return {"dense": a.to_dense(), "nnz": a.nnz()}
    b = SparseMatrix.from_dense(dense_b)
    try:
        out = a.add(b) if op == "add" else a.multiply(b)
    except Exception:
        return "error"
    return {"dense": out.to_dense(), "nnz": out.nnz()}
`,
  },
  "nearest-eligible-elevator": {
    entry: "select_elevator",
    starterCode: `def select_elevator(elevators, floor, direction):
    """elevators: dicts with "id", "floor", "direction"
    ("up" | "down" | "idle"), and "serviced" (list of floors).
    Return the nearest eligible elevator's id (ties -> lowest id), or -1."""
    # Your code here
    return -1
`,
  },
  "subsequence-expression-target": {
    entry: "can_reach_target",
    starterCode: `def can_reach_target(nums, target):
    """Can some subsequence with + and * (standard precedence) evaluate
    exactly to target?"""
    # Your code here
    return False
`,
  },
  "cleaning-robot-coverage": {
    entry: "robot_coverage",
    starterCode: `def robot_coverage(grid, start):
    """grid: list of strings of '.' and '#'. start: [row, col], open.
    The robot slides until blocked. Return [cleanableCells, restCells]."""
    # Your code here
    return [0, 0]
`,
  },
  "warehouse-boxes": {
    entry: "max_boxes",
    starterCode: `def max_boxes(heights, boxes):
    """heights: room ceilings, entrance at index 0. boxes: box heights.
    Return the maximum number of boxes that can be stored."""
    # Your code here
    return 0
`,
  },
  "mark-and-compact-subtree": {
    entry: "__judge_mark_compact",
    starterCode: `def mark_and_compact(heap_array, k):
    """heap_array: implicit binary tree (children of i at 2i+1, 2i+2);
    None means no node. Collect the subtree at k, compact survivors,
    and return [new_array, remap] where remap maps old index -> new."""
    # Your code here
    return [[], {}]
`,
    driverCode: `def __judge_mark_compact(heap_array, k):
    result = mark_and_compact(list(heap_array), k)
    if not isinstance(result, (list, tuple)) or len(result) != 2:
        return {"validShape": False}
    return {"newArray": result[0], "remap": result[1]}
`,
  },
  "single-tab-browser-history": {
    entry: "solution",
    starterCode: `def solution(operations, args):
    class BrowserSession:
        def __init__(self, homepage):
            # TODO: initialize history at homepage
            pass

        def visit(self, url):
            # TODO: navigate to url, clearing forward history
            pass

        def back(self, steps):
            # TODO: move up to \`steps\` back, return current url
            pass

        def forward(self, steps):
            # TODO: move up to \`steps\` forward, return current url
            pass

        def haveVisited(self, url):
            # TODO: has url ever been visited?
            pass

    obj = None
    res = []
    for op, arg in zip(operations, args):
        if op == 'BrowserSession':
            obj = BrowserSession(*arg)
            res.append(None)
        elif op == 'visit':
            obj.visit(*arg)
            res.append(None)
        elif op == 'back':
            res.append(obj.back(*arg))
        elif op == 'forward':
            res.append(obj.forward(*arg))
        elif op == 'haveVisited':
            res.append(obj.haveVisited(*arg))
    return res
`,
  },
};
