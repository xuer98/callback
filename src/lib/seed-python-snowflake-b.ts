import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake coding bank, parts E and F, keyed by slug
// and merged into judge.python by the seed script like seed-python.ts.

/** Constructs the class named by the first operation, then calls methods. */
export const RUN_OPERATIONS_PY = `def __run_operations(operations, args):
    import re
    target = None
    out = []
    for i, (op, arg) in enumerate(zip(operations, args)):
        if i == 0:
            target = globals()[op](*arg)
            out.append(None)
        else:
            name = re.sub(r"(?<!^)(?=[A-Z])", "_", op).lower()
            out.append(getattr(target, name)(*arg))
    return out
`;

export const snowflakePythonJudgesB: Record<string, JudgeLanguage> = {
  "tiered-token-bucket-limiter": {
    entry: "__run_operations",
    starterCode: `class TieredLimiter:
    def __init__(self, default_allow=False):
        """default_allow: the verdict for clients without a valid tier."""
        # Your state here
        pass

    def set_tier(self, tier, capacity, refill_rate):
        """Create or update a tier. refill_rate is tokens per second."""
        pass

    def assign_client(self, client, tier):
        pass

    def allow(self, client, now):
        """Whether the request at time now (seconds) is served."""
        return False
`,
    solutionCode: `class TieredLimiter:
    # Token bucket per client; tier configuration is read on every call.
    def __init__(self, default_allow=False):
        self.default_allow = default_allow
        self.tiers = {}          # tier -> (capacity, refill_rate)
        self.client_tier = {}    # client -> tier
        self.state = {}          # client -> (tokens, last_seen)

    def set_tier(self, tier, capacity, refill_rate):
        self.tiers[tier] = (capacity, refill_rate)

    def assign_client(self, client, tier):
        self.client_tier[client] = tier

    def allow(self, client, now):
        config = self.tiers.get(self.client_tier.get(client))
        if config is None or config[0] < 0 or config[1] < 0:
            return self.default_allow
        capacity, rate = config
        tokens, last_seen = self.state.get(client, (capacity, now))   # first request: full bucket
        tokens = min(capacity, tokens + (now - last_seen) * rate)
        ok = tokens >= 1
        if ok:
            tokens -= 1
        self.state[client] = (tokens, now)
        return ok
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "count-events-in-range": {
    entry: "__run_operations",
    starterCode: `class EventCounter:
    def __init__(self):
        # Your state here
        pass

    def receive(self, type, timestamp):
        """Timestamps never decrease across calls."""
        pass

    def count(self, type, start, end):
        """Events of that type with start <= timestamp <= end."""
        return 0
`,
    solutionCode: `import bisect
from collections import defaultdict


class EventCounter:
    # One sorted list per type; a count is two binary searches.
    def __init__(self):
        self.timestamps = defaultdict(list)

    def receive(self, type, timestamp):
        self.timestamps[type].append(timestamp)         # arrivals are in order

    def count(self, type, start, end):
        times = self.timestamps.get(type, [])
        return max(0, bisect.bisect_right(times, end) - bisect.bisect_left(times, start))   # an inverted window is empty
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "snowcal-interpreter": {
    entry: "snowcal",
    starterCode: `def snowcal(program):
    """program: lines "ADD y", "MUL y", "FUN name", "END", "INV name".
    The register X after the last line."""
    # Your code here
    return 0
`,
    solutionCode: `def snowcal(program):
    # Two modes: record a body, or run a line. INV replays a body through the same apply.
    functions = {}
    recording = None                   # the body being recorded, or None
    x = 0

    def apply(op, arg, value):
        return value + arg if op == "ADD" else value * arg

    for line in program:
        op, _, arg = line.partition(" ")
        arg = arg.strip()
        if op == "FUN":
            recording = []
            functions[arg] = recording
        elif op == "END":
            recording = None
        elif recording is not None:
            recording.append((op, int(arg)))     # stored, not executed
        elif op == "INV":
            for body_op, body_arg in functions.get(arg, []):
                x = apply(body_op, body_arg, x)
        else:
            x = apply(op, int(arg), x)
    return x
`,
  },
  "priority-task-executor": {
    entry: "__run_operations",
    starterCode: `class TaskExecutor:
    def __init__(self):
        # Your state here
        pass

    def add_task(self, task_id, priority, timestamp):
        """The same task may be added several times."""
        pass

    def execute_task(self):
        """Highest priority, then earliest timestamp, then added first;
        None when nothing is left. A task runs at most once."""
        return None
`,
    solutionCode: `import heapq


class TaskExecutor:
    # A heap on (-priority, timestamp, sequence) with lazy deletion of executed tasks.
    def __init__(self):
        self.heap = []
        self.done = set()
        self.sequence = 0

    def add_task(self, task_id, priority, timestamp):
        self.sequence += 1
        heapq.heappush(self.heap, (-priority, timestamp, self.sequence, task_id))

    def execute_task(self):
        while self.heap:
            *_, task_id = heapq.heappop(self.heap)
            if task_id not in self.done:               # stale entries are skipped here
                self.done.add(task_id)
                return task_id
        return None
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "kv-store-with-prefix-scan": {
    entry: "__run_operations",
    starterCode: `class PrefixStore:
    def __init__(self):
        # Your state here
        pass

    def put(self, key, value):
        pass

    def get(self, key):
        """The value, or None."""
        return None

    def delete(self, key):
        """True if the key existed."""
        return False

    def scan(self, prefix):
        """Every key starting with prefix, sorted."""
        return []
`,
    solutionCode: `import bisect


class PrefixStore:
    # A dict for point operations plus a sorted key list for ordered scans.
    def __init__(self):
        self.values = {}
        self.keys = []                      # sorted

    def put(self, key, value):
        if key not in self.values:
            bisect.insort(self.keys, key)
        self.values[key] = value

    def get(self, key):
        return self.values.get(key)

    def delete(self, key):
        if key not in self.values:
            return False
        del self.values[key]
        del self.keys[bisect.bisect_left(self.keys, key)]
        return True

    def scan(self, prefix):
        out = []
        i = bisect.bisect_left(self.keys, prefix)
        while i < len(self.keys) and self.keys[i].startswith(prefix):
            out.append(self.keys[i])
            i += 1
        return out
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "max-credits-with-k-classes": {
    entry: "max_credits",
    starterCode: `def max_credits(classes, k):
    """classes: [start, end, credits]; a class may start when another
    ends. The most credits from at most k non-overlapping classes."""
    # Your code here
    return 0
`,
    solutionCode: `import bisect


def max_credits(classes, k):
    # Weighted interval scheduling with a cap on the number of picks.
    ordered = sorted(classes, key=lambda c: c[1])
    ends = [c[1] for c in ordered]
    n = len(ordered)
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        start, _, credits = ordered[i - 1]
        predecessor = bisect.bisect_right(ends, start)   # classes ending at or before start
        for j in range(1, k + 1):
            dp[i][j] = max(dp[i - 1][j], credits + dp[predecessor][j - 1])
    return dp[n][k]
`,
  },
  "minimum-bus-fleet": {
    entry: "min_buses",
    starterCode: `def min_buses(trips):
    """trips: [from, departure, to, arrival]. The fewest buses that can
    run every trip."""
    # Your code here
    return 0
`,
    solutionCode: `import heapq
from collections import defaultdict


def min_buses(trips):
    # Sweep by departure; idle buses are pooled per station as a heap of arrival times.
    idle = defaultdict(list)
    buses = 0
    for origin, departure, destination, arrival in sorted(trips, key=lambda t: t[1]):
        waiting = idle[origin]
        if waiting and waiting[0] <= departure:
            heapq.heappop(waiting)                     # reuse the earliest arrival
        else:
            buses += 1
        heapq.heappush(idle[destination], arrival)
    return buses
`,
  },
};
