import type { JudgeLanguage } from "./types";

// Python judge definitions for the Apple bank (seed-apple-*.ts), keyed by
// problem slug and merged into each problem's judge as judge.python by the
// seed script — the same shape as seed-python.ts. Tests are shared with the
// JavaScript judge; drivers map camelCase operation names onto snake_case
// methods where a problem is class-based.

export const applePythonJudges: Record<string, JudgeLanguage> = {
  "access-log-metrics": {
    entry: "log_metrics",
    starterCode: `def log_metrics(lines):
    """Return {"totalLines", "valid", "malformed", "count4xx", "count5xx",
    "failurePct", "endpoints": [[path, hits, failures], ...]}."""
    # Your code here
    return {
        "totalLines": 0, "valid": 0, "malformed": 0,
        "count4xx": 0, "count5xx": 0, "failurePct": 0.0, "endpoints": [],
    }
`,
    solutionCode: `import re

LINE = re.compile(r"^(\\S+) (\\S+) (\\S+) (\\d{3})$")
OCTET = re.compile(r"^(0|[1-9]\\d{0,2})$")
STAMP = re.compile(r"^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})Z$")


def valid_ip(s):
    parts = s.split(".")
    return len(parts) == 4 and all(OCTET.match(p) and int(p) <= 255 for p in parts)


def valid_timestamp(s):
    m = STAMP.match(s)
    if not m:
        return False
    y, mo, d, h, mi, sec = map(int, m.groups())
    if not (1 <= mo <= 12 and h <= 23 and mi <= 59 and sec <= 59):
        return False
    leap = (y % 4 == 0 and y % 100 != 0) or y % 400 == 0
    days = [31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1]
    return 1 <= d <= days


def log_metrics(lines):
    """Streaming: one pass, counters only, state proportional to distinct endpoints."""
    total = valid = c4 = c5 = 0
    per_endpoint = {}  # path -> [hits, failures]
    for line in lines:
        total += 1
        m = LINE.match(line)
        if not m:
            continue
        ip, stamp, path, code = m.groups()
        status = int(code)
        if not (valid_ip(ip) and valid_timestamp(stamp) and path.startswith("/") and 100 <= status <= 599):
            continue
        valid += 1
        entry = per_endpoint.setdefault(path, [0, 0])
        entry[0] += 1
        if status >= 400:
            entry[1] += 1
        if 400 <= status < 500:
            c4 += 1
        elif status >= 500:
            c5 += 1
    failures = c4 + c5
    endpoints = sorted(([p, h, f] for p, (h, f) in per_endpoint.items()), key=lambda e: (-e[2], -e[1], e[0]))
    return {
        "totalLines": total,
        "valid": valid,
        "malformed": total - valid,
        "count4xx": c4,
        "count5xx": c5,
        "failurePct": round(100.0 * failures / valid, 2) if valid else 0.0,
        "endpoints": endpoints,
    }
`,
  },
  "ranked-ballot-counter": {
    entry: "__run_operations",
    starterCode: `class RankedBallotCounter:
    def __init__(self, batch_size=10000):
        """Flush the buffer as soon as it holds batch_size ballots."""
        self.batch_size = batch_size

    def add(self, ballot):
        """ballot: candidate names, most preferred first."""
        # Your code here
        pass

    def extend(self, ballots):
        for ballot in ballots:
            self.add(ballot)

    def results(self, top_k=None):
        """[[candidate, score], ...] by score desc, then name asc."""
        return []

    def first_place_counts(self):
        """[[candidate, ballots ranking them first], ...], same ordering."""
        return []

    def stats(self):
        return {"ballotsSeen": 0, "batchesFlushed": 0, "buffered": 0}
`,
    solutionCode: `from collections import Counter


class RankedBallotCounter:
    """Never materialise the input: buffer, flush in batches, keep O(candidates) state."""

    def __init__(self, batch_size=10000):
        self.batch_size = batch_size
        self._buffer = []
        self.scores = Counter()
        self.first_place = Counter()
        self.ballots_seen = 0
        self.batches_flushed = 0

    def add(self, ballot):
        self._buffer.append(ballot)
        if len(self._buffer) >= self.batch_size:
            self.flush()

    def extend(self, ballots):
        for ballot in ballots:
            self.add(ballot)

    def flush(self):
        if not self._buffer:
            return
        for ballot in self._buffer:
            n = len(ballot)
            if n:
                self.first_place[ballot[0]] += 1
            for i, name in enumerate(ballot):
                self.scores[name] += n - 1 - i
            self.ballots_seen += 1
        self._buffer.clear()
        self.batches_flushed += 1

    def results(self, top_k=None):
        self.flush()
        ordered = sorted(([name, score] for name, score in self.scores.items()), key=lambda kv: (-kv[1], kv[0]))
        return ordered[:top_k] if top_k else ordered

    def first_place_counts(self):
        self.flush()
        return sorted(([name, count] for name, count in self.first_place.items()), key=lambda kv: (-kv[1], kv[0]))

    def stats(self):
        return {
            "ballotsSeen": self.ballots_seen,
            "batchesFlushed": self.batches_flushed,
            "buffered": len(self._buffer),
        }
`,
    driverCode: `def __run_operations(operations, args):
    names = {"firstPlaceCounts": "first_place_counts"}
    counter = None
    out = []
    for op, a in zip(operations, args):
        if op == "RankedBallotCounter":
            counter = RankedBallotCounter(*a)
            out.append(None)
        else:
            out.append(getattr(counter, names.get(op, op))(*a))
    return out
`,
  },
  "top-n-frequent-logs": {
    entry: "top_n_frequent",
    starterCode: `def top_n_frequent(lines, n):
    """The n most frequent lines, most frequent first; ties lexicographic."""
    # Your code here
    return []
`,
    solutionCode: `import heapq
from collections import Counter


def top_n_frequent(lines, n):
    """Bounded heap: O(d log n) time, O(n) memory beyond the counts —
    the answer for a stream. (Bucket sort is the O(d) answer when the
    whole multiset is in memory anyway.)"""
    counts = Counter(lines)
    best = heapq.nsmallest(n, counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [line for line, _ in best]
`,
  },
  "synonym-groups": {
    entry: "synonym_groups",
    starterCode: `def synonym_groups(pairs):
    """Return {smallest word: sorted group} for every connected group."""
    # Your code here
    return {}
`,
    solutionCode: `class DSU:
    def __init__(self):
        self.parent = {}
        self.rank = {}

    def find(self, x):
        self.parent.setdefault(x, x)
        self.rank.setdefault(x, 0)
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:  # path compression
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True


def synonym_groups(pairs):
    dsu = DSU()
    for a, b in pairs:
        dsu.union(a, b)  # find() inside union registers singletons
    groups = {}
    for word in list(dsu.parent):
        groups.setdefault(dsu.find(word), []).append(word)
    return {min(group): sorted(group) for group in groups.values()}
`,
  },
  "number-of-islands": {
    entry: "count_islands",
    starterCode: `def count_islands(grid):
    """grid: rows of '0' (water) and '1' (land). Count the four-connected islands."""
    # Your code here
    return 0
`,
    solutionCode: `from collections import deque


def count_islands(grid):
    """BFS flood fill with a visited set: safe on one huge island, input untouched."""
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    seen = set()
    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or (r, c) in seen:
                continue
            islands += 1
            seen.add((r, c))
            queue = deque([(r, c)])
            while queue:
                x, y = queue.popleft()
                for a, b in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= a < rows and 0 <= b < cols and grid[a][b] == "1" and (a, b) not in seen:
                        seen.add((a, b))
                        queue.append((a, b))
    return islands
`,
  },
  "insert-interval": {
    entry: "insert_interval",
    starterCode: `def insert_interval(intervals, new_interval):
    """intervals: sorted, non-overlapping, closed [start, end] pairs.
    Insert new_interval, merging overlaps, without re-sorting."""
    # Your code here
    return intervals
`,
    solutionCode: `def insert_interval(intervals, new_interval):
    """O(n), no re-sort: before, overlapping (collapsed), after."""
    out, i, n = [], 0, len(intervals)
    start, end = new_interval
    while i < n and intervals[i][1] < start:
        out.append(list(intervals[i]))
        i += 1
    while i < n and intervals[i][0] <= end:
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    out.append([start, end])
    while i < n:
        out.append(list(intervals[i]))
        i += 1
    return out
`,
  },
  "design-hashmap": {
    entry: "__run_operations",
    starterCode: `class MyHashMap:
    def __init__(self):
        # Your buckets here -- no dict or set for the storage itself
        pass

    def put(self, key, value):
        # Your code here
        pass

    def get(self, key):
        """Return the value, or -1 if absent."""
        return -1

    def remove(self, key):
        # Your code here
        pass
`,
    solutionCode: `class MyHashMap:
    """Separate chaining; doubles the bucket array past a 0.75 load factor."""

    def __init__(self, capacity=16, load_factor=0.75):
        self._capacity = capacity
        self._load_factor = load_factor
        self._size = 0
        self._buckets = [[] for _ in range(capacity)]

    def _index(self, key):
        return (hash(key) & 0x7FFFFFFF) % self._capacity  # mask: hashes can be negative

    def _resize(self):
        old = self._buckets
        self._capacity *= 2
        self._buckets = [[] for _ in range(self._capacity)]
        for bucket in old:
            for pair in bucket:
                self._buckets[self._index(pair[0])].append(pair)

    def put(self, key, value):
        bucket = self._buckets[self._index(key)]
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])
        self._size += 1
        if self._size > self._load_factor * self._capacity:
            self._resize()

    def get(self, key):
        for k, v in self._buckets[self._index(key)]:
            if k == key:
                return v
        return -1

    def remove(self, key):
        bucket = self._buckets[self._index(key)]
        for i, pair in enumerate(bucket):
            if pair[0] == key:
                bucket.pop(i)
                self._size -= 1
                return
`,
    driverCode: `def __run_operations(operations, args):
    hashmap = None
    out = []
    for op, a in zip(operations, args):
        if op == "MyHashMap":
            hashmap = MyHashMap()
            out.append(None)
        elif op == "stress":
            n = a[0]
            for k in range(n):
                hashmap.put(k, k * 2)
            for k in range(0, n, 3):
                hashmap.remove(k)
            out.append(sum(hashmap.get(k) for k in range(n)))
        else:
            out.append(getattr(hashmap, op)(*a))
    return out
`,
  },
  "design-task-manager": {
    entry: "__run_operations",
    starterCode: `class TaskManager:
    def __init__(self, tasks):
        """tasks: [user_id, task_id, priority] triples."""
        # Your state here
        pass

    def add(self, user_id, task_id, priority):
        # Your code here
        pass

    def edit(self, task_id, new_priority):
        # Your code here
        pass

    def rmv(self, task_id):
        # Your code here
        pass

    def exec_top(self):
        """Run and remove the highest-priority task (ties: larger task id);
        return its user_id, or -1 when nothing is left."""
        return -1
`,
    solutionCode: `import heapq


class TaskManager:
    """Lazy-deletion heap: push on add/edit, validate against the map on pop."""

    def __init__(self, tasks):
        self.info = {}  # task_id -> (user_id, priority)   (authoritative)
        self.heap = []  # (-priority, -task_id)            (may hold stale entries)
        for user_id, task_id, priority in tasks:
            self.add(user_id, task_id, priority)

    def add(self, user_id, task_id, priority):
        self.info[task_id] = (user_id, priority)
        heapq.heappush(self.heap, (-priority, -task_id))

    def edit(self, task_id, new_priority):
        user_id, _ = self.info[task_id]
        self.info[task_id] = (user_id, new_priority)
        heapq.heappush(self.heap, (-new_priority, -task_id))  # old entry goes stale

    def rmv(self, task_id):
        self.info.pop(task_id, None)

    def exec_top(self):
        while self.heap:
            neg_priority, neg_task = heapq.heappop(self.heap)
            priority, task_id = -neg_priority, -neg_task
            current = self.info.get(task_id)
            if current is None or current[1] != priority:
                continue  # stale -> discard
            del self.info[task_id]
            return current[0]
        return -1
`,
    driverCode: `def __run_operations(operations, args):
    names = {"execTop": "exec_top"}
    manager = None
    out = []
    for op, a in zip(operations, args):
        if op == "TaskManager":
            manager = TaskManager(*a)
            out.append(None)
        else:
            out.append(getattr(manager, names.get(op, op))(*a))
    return out
`,
  },
  "unit-conversion-tree": {
    entry: "base_unit_conversions",
    starterCode: `MOD = 10**9 + 7


def base_unit_conversions(n, conversions):
    """ans[i] = units of i per one unit of 0, modulo MOD. Tree rooted at 0."""
    # Your code here
    return [0] * n
`,
    solutionCode: `from collections import defaultdict

MOD = 10**9 + 7


def base_unit_conversions(n, conversions):
    """One iterative DFS from the root multiplying factors down (the tree can be a path)."""
    children = defaultdict(list)
    for source, target, factor in conversions:
        children[source].append((target, factor))
    ans = [0] * n
    ans[0] = 1
    stack = [0]
    while stack:
        u = stack.pop()
        for v, factor in children[u]:
            ans[v] = ans[u] * factor % MOD
            stack.append(v)
    return ans
`,
  },
  "valid-sudoku": {
    entry: "is_valid_sudoku",
    starterCode: `def is_valid_sudoku(board):
    """board: nine strings of nine characters, '.' for empty."""
    # Your code here
    return False
`,
    solutionCode: `def is_valid_sudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    for i in range(9):
        for j in range(9):
            v = board[i][j]
            if v == ".":
                continue
            b = (i // 3) * 3 + j // 3
            if v in rows[i] or v in cols[j] or v in boxes[b]:
                return False
            rows[i].add(v)
            cols[j].add(v)
            boxes[b].add(v)
    return True
`,
  },
  "is-graph-bipartite": {
    entry: "is_bipartite",
    starterCode: `def is_bipartite(n, edges):
    """n nodes 0..n-1, undirected edges [u, v]. May be disconnected."""
    # Your code here
    return False
`,
    solutionCode: `from collections import deque


def is_bipartite(n, edges):
    adjacent = [[] for _ in range(n)]
    for u, v in edges:
        adjacent[u].append(v)
        adjacent[v].append(u)
    colour = [0] * n  # 0 unvisited, 1 / -1 the two colours
    for start in range(n):
        if colour[start]:
            continue
        colour[start] = 1
        queue = deque([start])
        while queue:
            u = queue.popleft()
            for v in adjacent[u]:
                if colour[v] == colour[u]:
                    return False  # same side (or a self-loop)
                if colour[v] == 0:
                    colour[v] = -colour[u]
                    queue.append(v)
    return True
`,
  },
  "kth-symbol-in-grammar": {
    entry: "kth_grammar",
    starterCode: `def kth_grammar(level, position):
    """Root is level 1; positions are 1-based within a level."""
    # Your code here
    return 0
`,
    solutionCode: `def kth_grammar(level, position):
    """Closed form: each set bit of position - 1 is a right turn, and each
    right turn flips the value, so the answer is the parity of the popcount."""
    return bin(position - 1).count("1") & 1
`,
  },
  "sliding-window-rate-limiter": {
    entry: "__run_operations",
    starterCode: `class SlidingWindowLimiter:
    def __init__(self, limit, window):
        """At most \`limit\` admissions per key within any (now - window, now]."""
        self.limit = limit
        self.window = window

    def allow(self, key, now):
        """Return whether the request at time \`now\` is admitted."""
        return False
`,
    solutionCode: `from collections import defaultdict, deque


class SlidingWindowLimiter:
    """Sliding-window log: exactly \`limit\` admissions per window, O(limit) memory per key."""

    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.log = defaultdict(deque)  # key -> admitted timestamps, oldest first

    def allow(self, key, now):
        queue = self.log[key]
        while queue and queue[0] <= now - self.window:
            queue.popleft()
        if len(queue) < self.limit:
            queue.append(now)
            return True
        return False
`,
    driverCode: `def __run_operations(operations, args):
    limiter = None
    out = []
    for op, a in zip(operations, args):
        if op == "SlidingWindowLimiter":
            limiter = SlidingWindowLimiter(*a)
            out.append(None)
        else:
            out.append(getattr(limiter, op)(*a))
    return out
`,
  },
  "lazy-nested-iterator": {
    entry: "__run_operations",
    starterCode: `class NestedIterator:
    def __init__(self, nested):
        """nested: integers and lists, nested arbitrarily deep. Do not flatten eagerly."""
        # Your state here
        pass

    def has_next(self):
        return False

    def next(self):
        return None
`,
    solutionCode: `class NestedIterator:
    """Lazy: a stack of iterators (O(depth)) plus a one-element lookahead."""

    def __init__(self, nested):
        self.stack = [iter(nested)]
        self._lookahead = None
        self._filled = False
        self._advance()

    def _advance(self):
        self._filled = False
        while self.stack:
            try:
                item = next(self.stack[-1])
            except StopIteration:
                self.stack.pop()
                continue
            if isinstance(item, list):
                self.stack.append(iter(item))
            else:
                self._lookahead = item
                self._filled = True
                return

    def has_next(self):
        return self._filled

    def next(self):
        value = self._lookahead
        self._advance()
        return value
`,
    driverCode: `def __run_operations(operations, args):
    names = {"hasNext": "has_next"}
    iterator = None
    out = []
    for op, a in zip(operations, args):
        if op == "NestedIterator":
            iterator = NestedIterator(a[0])
            out.append(None)
        elif op == "drain":
            drained = []
            while iterator.has_next():
                drained.append(iterator.next())
            out.append(drained)
        else:
            out.append(getattr(iterator, names.get(op, op))(*a))
    return out
`,
  },
  "reservoir-sampling": {
    entry: "__judge_reservoir",
    starterCode: `def reservoir_sample(items, k, random):
    """items: a stream of unknown length. random(): uniform in [0, 1) -- the only
    randomness you may use (derive integers as int(random() * m)).
    Return k items chosen uniformly without replacement (fewer if the stream is shorter)."""
    # Your code here
    return []
`,
    solutionCode: `def reservoir_sample(items, k, random):
    """Uniform k-sample from a stream of unknown length: O(k) memory, one pass."""
    reservoir = []
    for i, item in enumerate(items):
        if i < k:
            reservoir.append(item)
        else:
            j = int(random() * (i + 1))
            if j < k:
                reservoir[j] = item
    return reservoir
`,
    driverCode: `import random as __random_module


def __check_sample(sample, size, allowed):
    if not isinstance(sample, list):
        return "expected a list, got " + type(sample).__name__
    if len(sample) != size:
        return "expected a sample of size %d, got %d" % (size, len(sample))
    seen = set()
    for value in sample:
        if value not in allowed:
            return "sample contains %r, which was not eligible" % (value,)
        if value in seen:
            return "sample repeats %r" % (value,)
        seen.add(value)
    return None


def __judge_reservoir(items, k, trials, tolerance):
    random = __random_module.Random(12345).random
    counts = {}
    allowed = set(items)
    size = min(k, len(items))
    for _ in range(trials):
        sample = reservoir_sample(items, k, random)
        problem = __check_sample(sample, size, allowed)
        if problem:
            return problem
        for value in sample:
            counts[value] = counts.get(value, 0) + 1
    expected = size / len(items) if items else 0
    for value in items:
        freq = counts.get(value, 0) / trials
        if abs(freq - expected) > tolerance:
            return "item %r was selected %.3f of the time; expected %.3f +/- %s" % (value, freq, expected, tolerance)
    return "ok"
`,
  },
  "implement-mapreduce": {
    entry: "__run_job",
    starterCode: `def map_reduce(records, mapper, reducer, combiner, partition, num_reducers, chunk_size):
    """records are processed in chunks of chunk_size (one map task each);
    mapper(record) -> [(key, value), ...]; combiner(key, values) runs once per
    chunk when not None; partition(key) % num_reducers picks the reducer; each
    reducer handles its keys in sorted order.
    Return {"results": {key: reduced}, "reducers": [[keys of reducer 0, sorted], ...]}."""
    # Your code here
    return {"results": {}, "reducers": []}
`,
    solutionCode: `def map_reduce(records, mapper, reducer, combiner, partition, num_reducers, chunk_size):
    """map -> (combine per chunk) -> partition by partition(key) % R -> sort within partition -> reduce"""
    partitions = [{} for _ in range(num_reducers)]
    for start in range(0, len(records), chunk_size):
        pairs = []
        for record in records[start:start + chunk_size]:
            pairs.extend(mapper(record))
        if combiner:
            grouped = {}
            for key, value in pairs:
                grouped.setdefault(key, []).append(value)
            pairs = [(key, combiner(key, values)) for key, values in grouped.items()]
        for key, value in pairs:
            partitions[partition(key) % num_reducers].setdefault(key, []).append(value)
    results = {}
    reducers = []
    for part in partitions:
        keys = sorted(part)
        reducers.append(keys)
        for key in keys:
            results[key] = reducer(key, part[key])
    return {"results": results, "reducers": reducers}
`,
    driverCode: `def __run_job(job, records, num_reducers, chunk_size, use_combiner):
    def total(key, values):
        return sum(values)

    def biggest(key, values):
        return max(values)

    def mean(key, values):
        return round(sum(values) / len(values), 6)

    jobs = {
        "wordcount": (lambda line: [(w, 1) for w in line.split()], total, total),
        "maxlen": (lambda line: [(w[0], len(w)) for w in line.split()], biggest, biggest),
        "mean": (lambda record: [(record[0], record[1])], mean, None),  # a mean is not combinable
    }
    mapper, reduce, combine = jobs[job]
    reducer_inputs = {}

    def reducer(key, values):
        reducer_inputs[key] = len(values)
        return reduce(key, values)

    out = map_reduce(records, mapper, reducer, combine if use_combiner else None, lambda key: ord(key[0]), num_reducers, chunk_size)
    return {"results": out["results"], "reducers": out["reducers"], "reducerInputs": reducer_inputs}
`,
  },
  "hotel-booking-system": {
    entry: "__run_operations",
    starterCode: `class HotelBookingSystem:
    def __init__(self, room_ids):
        # Your state here
        pass

    def check_availability(self, start, end):
        """Rooms free for [start, end), sorted; [] for an invalid range."""
        return []

    def book_room(self, customer, room_id, start, end):
        """Return "B1", "B2", ... or None (unknown room, bad range, or conflict)."""
        return None

    def cancel(self, booking_id):
        return False
`,
    solutionCode: `import bisect
import threading


class HotelBookingSystem:
    """Sorted (start, end, booking_id) per room with a lock per room: check-then-insert
    is one atomic step, and only the neighbours of the insertion point can overlap."""

    def __init__(self, room_ids):
        self._rooms = {room: [] for room in room_ids}
        self._locks = {room: threading.Lock() for room in room_ids}
        self._bookings = {}  # booking_id -> (room_id, start, end)
        self._sequence = 0
        self._sequence_lock = threading.Lock()

    @staticmethod
    def _valid_range(start, end):
        return 0 <= start < end

    @staticmethod
    def _overlaps(a_start, a_end, b_start, b_end):
        return a_start < b_end and b_start < a_end

    def _conflicts(self, room_id, start, end):
        intervals = self._rooms[room_id]
        at = bisect.bisect_left(intervals, (start,))
        for j in (at - 1, at):
            if 0 <= j < len(intervals) and self._overlaps(start, end, intervals[j][0], intervals[j][1]):
                return True
        return False

    def check_availability(self, start, end):
        if not self._valid_range(start, end):
            return []
        free = []
        for room in self._rooms:
            with self._locks[room]:
                if not self._conflicts(room, start, end):
                    free.append(room)
        return sorted(free)

    def book_room(self, customer, room_id, start, end):
        if room_id not in self._rooms or not self._valid_range(start, end):
            return None
        with self._locks[room_id]:  # atomic check-then-insert
            if self._conflicts(room_id, start, end):
                return None
            with self._sequence_lock:
                self._sequence += 1
                booking_id = "B%d" % self._sequence
            bisect.insort(self._rooms[room_id], (start, end, booking_id))
            self._bookings[booking_id] = (room_id, start, end)
            return booking_id

    def cancel(self, booking_id):
        booking = self._bookings.pop(booking_id, None)
        if not booking:
            return False
        room_id, start, end = booking
        with self._locks[room_id]:
            self._rooms[room_id].remove((start, end, booking_id))
        return True
`,
    driverCode: `def __run_operations(operations, args):
    names = {"checkAvailability": "check_availability", "bookRoom": "book_room"}
    hotel = None
    out = []
    for op, a in zip(operations, args):
        if op == "HotelBookingSystem":
            hotel = HotelBookingSystem(*a)
            out.append(None)
        else:
            out.append(getattr(hotel, names.get(op, op))(*a))
    return out
`,
  },
  "streaming-median": {
    entry: "__run_operations",
    starterCode: `class ExactStreamingMedian:
    def __init__(self):
        # Your state here
        pass

    def add(self, x):
        # Your code here
        pass

    def median(self):
        """The median so far, or None when empty."""
        return None
`,
    solutionCode: `import heapq


class ExactStreamingMedian:
    """Two heaps, O(n) memory: fine up to what fits in RAM -- say this first."""

    def __init__(self):
        self.lower = []  # max-heap via negation
        self.upper = []  # min-heap

    def add(self, x):
        heapq.heappush(self.lower, -x)
        heapq.heappush(self.upper, -heapq.heappop(self.lower))
        if len(self.upper) > len(self.lower):
            heapq.heappush(self.lower, -heapq.heappop(self.upper))

    def median(self):
        if not self.lower:
            return None
        if len(self.lower) > len(self.upper):
            return -self.lower[0]
        return (-self.lower[0] + self.upper[0]) / 2
`,
    driverCode: `def __run_operations(operations, args):
    stat = None
    out = []
    for op, a in zip(operations, args):
        if op == "ExactStreamingMedian":
            stat = ExactStreamingMedian()
            out.append(None)
        else:
            value = getattr(stat, op)(*a)
            out.append(round(value, 6) if isinstance(value, float) else value)
    return out
`,
  },
  "precision-recall-f1": {
    entry: "__judge_metric",
    starterCode: `def precision_recall_f1(tp, fp, fn):
    """[precision, recall, f1], 0 where undefined."""
    # Your code here
    return [0.0, 0.0, 0.0]
`,
    solutionCode: `def precision_recall_f1(tp, fp, fn):
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return [precision, recall, f1]
`,
    driverCode: `def __judge_metric(*args):
    value = precision_recall_f1(*args)
    return [round(v, 6) for v in value]
`,
  },
  "voting-service-api": {
    entry: "__run_operations",
    starterCode: `class VotingService:
    def __init__(self):
        # Your state here: polls, votes keyed by (poll, voter), a tally, an audit log
        pass

    def create_poll(self, poll_id, options):
        """POST /polls -> {"status": 201, "options": sorted} | {"status": 409} | {"status": 422}"""
        return {"status": 422}

    def cast_vote(self, poll_id, voter, option):
        """PUT /polls/{id}/votes/{voter} -> {"status": ..., "result": ...}"""
        return {"status": 404}

    def close_poll(self, poll_id):
        """POST /polls/{id}/close -> {"status": 204} | {"status": 404}"""
        return {"status": 404}

    def results(self, poll_id):
        """GET /polls/{id}/results -> {"status": 200, "results": [[option, count], ...]} | {"status": 404}"""
        return {"status": 404}

    def audit(self):
        """Every successful mutation, in order."""
        return []
`,
    solutionCode: `class VotingService:
    """1. writes are idempotent (dedupe key = (poll, voter)) so retries are safe
    2. the tally is a separate read model, so reads never block writes
    3. every mutation is appended to an audit log"""

    def __init__(self):
        self.polls = {}  # poll_id -> {"options": set, "open": bool}
        self.votes = {}  # (poll_id, voter) -> option
        self.tally = {}  # poll_id -> {option: count}
        self.log = []

    # POST /polls
    def create_poll(self, poll_id, options):
        if poll_id in self.polls:
            return {"status": 409}
        if not options or len(set(options)) != len(options):
            return {"status": 422}
        self.polls[poll_id] = {"options": set(options), "open": True}
        self.tally[poll_id] = {}
        self.log.append(["createPoll", poll_id, list(options)])
        return {"status": 201, "options": sorted(options)}

    # PUT /polls/{id}/votes/{voter}  <- PUT, not POST: idempotent by construction
    def cast_vote(self, poll_id, voter, option):
        poll = self.polls.get(poll_id)
        if not poll:
            return {"status": 404}
        if not poll["open"]:
            return {"status": 409}
        if option not in poll["options"]:
            return {"status": 422}
        key = (poll_id, voter)
        previous = self.votes.get(key)
        if previous == option:
            return {"status": 200, "result": "unchanged"}  # safe retry
        counts = self.tally[poll_id]
        if previous is not None:
            counts[previous] -= 1
        counts[option] = counts.get(option, 0) + 1
        self.votes[key] = option
        self.log.append(["vote", poll_id, voter, previous, option])
        if previous is None:
            return {"status": 201, "result": "recorded"}
        return {"status": 200, "result": "changed"}

    # POST /polls/{id}/close
    def close_poll(self, poll_id):
        poll = self.polls.get(poll_id)
        if not poll:
            return {"status": 404}
        poll["open"] = False
        self.log.append(["closePoll", poll_id])
        return {"status": 204}

    # GET /polls/{id}/results
    def results(self, poll_id):
        counts = self.tally.get(poll_id)
        if counts is None:
            return {"status": 404}
        ranked = sorted(([o, c] for o, c in counts.items() if c > 0), key=lambda oc: (-oc[1], oc[0]))
        return {"status": 200, "results": ranked}

    def audit(self):
        return [list(entry) for entry in self.log]
`,
    driverCode: `def __run_operations(operations, args):
    names = {"createPoll": "create_poll", "castVote": "cast_vote", "closePoll": "close_poll"}
    service = None
    out = []
    for op, a in zip(operations, args):
        if op == "VotingService":
            service = VotingService()
            out.append(None)
        else:
            out.append(getattr(service, names.get(op, op))(*a))
    return out
`,
  },
  "group-anagrams": {
    entry: "group_anagrams",
    starterCode: `def group_anagrams(words):
    """Each group sorted; groups ordered by their first word."""
    # Your code here
    return []
`,
    solutionCode: `def group_anagrams(words):
    groups = {}
    for word in words:
        counts = [0] * 26
        for ch in word:
            counts[ord(ch) - 97] += 1
        groups.setdefault(tuple(counts), []).append(word)  # O(L) key, beats sorting
    return sorted((sorted(group) for group in groups.values()), key=lambda group: group[0])
`,
  },
  "basic-calculator-ii": {
    entry: "calculate",
    starterCode: `def calculate(s):
    """Digits, + - * / and spaces; division truncates toward zero."""
    # Your code here
    return 0
`,
    solutionCode: `def calculate(s):
    """One pass over the string with a stack of signed terms."""
    stack, number, op = [], 0, "+"
    for ch in s + "+":  # sentinel so the last number is applied
        if ch.isdigit():
            number = number * 10 + int(ch)
        elif ch != " ":
            if op == "+":
                stack.append(number)
            elif op == "-":
                stack.append(-number)
            elif op == "*":
                stack.append(stack.pop() * number)
            else:
                stack.append(int(stack.pop() / number))  # truncate toward zero
            number, op = 0, ch
    return sum(stack)
`,
  },
  "sorted-list-to-bst": {
    entry: "__judge_bst",
    starterCode: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def sorted_list_to_bst(iterator, n):
    """iterator: forward-only, next(iterator) yields the next sorted value; n values in all.
    Root of range [lo, hi] is index (lo + hi) // 2. Return the root TreeNode (or None)."""
    # Your code here
    return None
`,
    solutionCode: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


def sorted_list_to_bst(iterator, n):
    """In-order simulation: O(n) time, O(log n) stack, one pass over the iterator."""

    def build(lo, hi):
        if lo > hi:
            return None
        mid = (lo + hi) // 2
        left = build(lo, mid - 1)
        node = TreeNode(next(iterator))
        node.left = left
        node.right = build(mid + 1, hi)
        return node

    return build(0, n - 1)
`,
    driverCode: `from collections import deque


def __judge_bst(values):
    root = sorted_list_to_bst(iter(values), len(values))
    out = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out
`,
  },
  "word-search-trie": {
    entry: "find_words",
    starterCode: `def find_words(board, words):
    """board: rows of lowercase letters. Return the words found, sorted, no duplicates."""
    # Your code here
    return []
`,
    solutionCode: `def find_words(board, words):
    root = {}
    for word in words:
        node = root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = word  # end marker carrying the word
    rows, cols = len(board), len(board[0]) if board else 0
    grid = [list(row) for row in board]
    found = set()

    def dfs(r, c, node):
        ch = grid[r][c]
        nxt = node.get(ch)
        if nxt is None:
            return  # prefix does not exist: prune
        if "$" in nxt:
            found.add(nxt["$"])
        grid[r][c] = "#"
        for a, b in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= a < rows and 0 <= b < cols and grid[a][b] != "#":
                dfs(a, b, nxt)
        grid[r][c] = ch

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return sorted(found)
`,
  },
  "word-ladder": {
    entry: "ladder_length",
    starterCode: `def ladder_length(begin_word, end_word, word_list):
    """Words in the shortest one-letter-change sequence, or 0."""
    # Your code here
    return 0
`,
    solutionCode: `def ladder_length(begin_word, end_word, word_list):
    """Bidirectional BFS: expand the smaller frontier, stop when the sides meet."""
    words = set(word_list)
    if end_word not in words:
        return 0
    front, back, steps = {begin_word}, {end_word}, 1
    words.discard(begin_word)
    while front and back:
        if len(front) > len(back):
            front, back = back, front
        nxt = set()
        for word in front:
            for i in range(len(word)):
                for ch in "abcdefghijklmnopqrstuvwxyz":
                    candidate = word[:i] + ch + word[i + 1:]
                    if candidate in back:
                        return steps + 1
                    if candidate in words:
                        nxt.add(candidate)
                        words.discard(candidate)
        front = nxt
        steps += 1
    return 0
`,
  },
  "capture-stones-go": {
    entry: "capture_stones",
    starterCode: `def capture_stones(board, row, col, me, foe):
    """board: rows of 'e' (empty), 'b' (black), 'w' (white). After \`me\` plays at
    (row, col), how many \`foe\` stones are captured? -1 if the point is occupied."""
    # Your code here
    return 0
`,
    solutionCode: `def capture_stones(board, row, col, me, foe):
    """Flood-fill each adjacent foe group; a group with no empty neighbour is captured."""
    rows, cols = len(board), len(board[0])
    grid = [list(line) for line in board]
    if grid[row][col] != "e":
        return -1
    grid[row][col] = me

    def neighbours(r, c):
        for a, b in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= a < rows and 0 <= b < cols:
                yield a, b

    seen = set()
    captured = 0
    for a, b in neighbours(row, col):
        if grid[a][b] != foe or (a, b) in seen:
            continue
        group, alive, stack = [], False, [(a, b)]
        seen.add((a, b))
        while stack:
            x, y = stack.pop()
            group.append((x, y))
            for p, q in neighbours(x, y):
                if grid[p][q] == "e":
                    alive = True
                elif grid[p][q] == foe and (p, q) not in seen:
                    seen.add((p, q))
                    stack.append((p, q))
        if not alive:
            captured += len(group)
    return captured
`,
  },
};
