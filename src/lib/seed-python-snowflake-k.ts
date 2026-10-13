import type { JudgeLanguage } from "./types";
import { RUN_OPERATIONS_PY } from "./seed-python-snowflake-b";

// Python judges for the Snowflake LeetCode-tag bank, parts I and J (design-
// a-class problems), keyed by slug and merged into judge.python by the seed
// script like seed-python.ts. Operation sequences run through the shared
// __run_operations driver, which calls methods by their snake_case names.

export const snowflakePythonJudgesK: Record<string, JudgeLanguage> = {
  "implement-trie": {
    entry: "__run_operations",
    starterCode: `class Trie:
    def __init__(self):
        # Your state here
        pass

    def insert(self, word):
        pass

    def search(self, word):
        return False

    def starts_with(self, prefix):
        return False
`,
    solutionCode: `class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.get(ch)
            if node is None:
                return None
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and "$" in node

    def starts_with(self, prefix):
        return self._walk(prefix) is not None
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "add-and-search-words": {
    entry: "__run_operations",
    starterCode: `class WordDictionary:
    def __init__(self):
        # Your state here
        pass

    def add_word(self, word):
        pass

    def search(self, pattern):
        """Letters and '.', which matches any single letter."""
        return False
`,
    solutionCode: `class WordDictionary:
    def __init__(self):
        self.root = {}

    def add_word(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def search(self, pattern):
        def match(node, i):
            if i == len(pattern):
                return "$" in node
            ch = pattern[i]
            if ch != ".":
                child = node.get(ch)
                return child is not None and match(child, i + 1)
            return any(match(child, i + 1) for key, child in node.items() if key != "$")

        return match(self.root, 0)
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "insert-delete-getrandom": {
    entry: "__run_randomized_set",
    starterCode: `import random


class RandomizedSet:
    def __init__(self):
        # Your state here
        pass

    def insert(self, val):
        """True if val was not already present."""
        return False

    def remove(self, val):
        """True if val was present."""
        return False

    def get_random(self):
        """A uniformly random member."""
        return 0
`,
    solutionCode: `import random


class RandomizedSet:
    def __init__(self):
        self.values = []
        self.index = {}

    def insert(self, val):
        if val in self.index:
            return False
        self.index[val] = len(self.values)
        self.values.append(val)
        return True

    def remove(self, val):
        i = self.index.get(val)
        if i is None:
            return False
        last = self.values[-1]
        self.values[i] = last
        self.index[last] = i
        self.values.pop()
        del self.index[val]
        return True

    def get_random(self):
        return random.choice(self.values)
`,
    driverCode: `def __run_randomized_set(operations, args):
    target, mirror, out = None, set(), []
    for op, a in zip(operations, args):
        if op == "RandomizedSet":
            target = RandomizedSet(*a)
            out.append(None)
        elif op == "insert":
            out.append(target.insert(*a))
            mirror.add(a[0])
        elif op == "remove":
            out.append(target.remove(*a))
            mirror.discard(a[0])
        elif op == "getRandom":
            out.append(target.get_random() in mirror)
        elif op == "getRandomCovers":
            seen, members = set(), True
            for _ in range(300):
                v = target.get_random()
                if v not in mirror:
                    members = False
                seen.add(v)
            out.append(members and len(seen) == len(mirror))
    return out
`,
  },
  "design-hit-counter": {
    entry: "__run_operations",
    starterCode: `class HitCounter:
    def __init__(self):
        # Your state here
        pass

    def hit(self, timestamp):
        """Timestamps are seconds and never decrease."""
        pass

    def get_hits(self, timestamp):
        """Hits in (timestamp - 300, timestamp]."""
        return 0
`,
    solutionCode: `from collections import deque


class HitCounter:
    def __init__(self):
        self.queue = deque()   # [second, count]
        self.total = 0

    def hit(self, timestamp):
        if self.queue and self.queue[-1][0] == timestamp:
            self.queue[-1][1] += 1
        else:
            self.queue.append([timestamp, 1])
        self.total += 1

    def get_hits(self, timestamp):
        while self.queue and self.queue[0][0] <= timestamp - 300:
            self.total -= self.queue.popleft()[1]
        return self.total
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "time-based-key-value-store": {
    entry: "__run_operations",
    starterCode: `class TimeMap:
    def __init__(self):
        # Your state here
        pass

    def set(self, key, value, timestamp):
        """Timestamps increase per key."""
        pass

    def get(self, key, timestamp):
        """The value at the largest timestamp <= timestamp, or ''."""
        return ""
`,
    solutionCode: `import bisect


class TimeMap:
    def __init__(self):
        self.store = {}   # key -> ([timestamps], [values])

    def set(self, key, value, timestamp):
        times, values = self.store.setdefault(key, ([], []))
        times.append(timestamp)
        values.append(value)

    def get(self, key, timestamp):
        if key not in self.store:
            return ""
        times, values = self.store[key]
        i = bisect.bisect_right(times, timestamp)
        return values[i - 1] if i else ""
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "snapshot-array": {
    entry: "__run_operations",
    starterCode: `class SnapshotArray:
    def __init__(self, length):
        # Your state here
        pass

    def set(self, index, val):
        pass

    def snap(self):
        """The new snapshot's id, starting at 0."""
        return 0

    def get(self, index, snap_id):
        return 0
`,
    solutionCode: `import bisect


class SnapshotArray:
    def __init__(self, length):
        self.ids = [[] for _ in range(length)]      # per index: snapshot ids of writes
        self.values = [[] for _ in range(length)]   # per index: the values written
        self.snap_id = 0

    def set(self, index, val):
        if self.ids[index] and self.ids[index][-1] == self.snap_id:
            self.values[index][-1] = val
        else:
            self.ids[index].append(self.snap_id)
            self.values[index].append(val)

    def snap(self):
        self.snap_id += 1
        return self.snap_id - 1

    def get(self, index, snap_id):
        i = bisect.bisect_right(self.ids[index], snap_id)
        return self.values[index][i - 1] if i else 0
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "design-log-storage-system": {
    entry: "__run_operations",
    starterCode: `class LogSystem:
    def __init__(self):
        # Your state here
        pass

    def put(self, id, timestamp):
        """timestamp: 'Year:Month:Day:Hour:Minute:Second', zero-padded."""
        pass

    def retrieve(self, start, end, granularity):
        """Ids within [start, end] at the granularity, ascending."""
        return []
`,
    solutionCode: `class LogSystem:
    PREFIX = {"Year": 4, "Month": 7, "Day": 10, "Hour": 13, "Minute": 16, "Second": 19}

    def __init__(self):
        self.logs = []

    def put(self, id, timestamp):
        self.logs.append((id, timestamp))

    def retrieve(self, start, end, granularity):
        n = self.PREFIX[granularity]
        lo, hi = start[:n], end[:n]
        return sorted(id for id, ts in self.logs if lo <= ts[:n] <= hi)
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "design-file-system": {
    entry: "__run_operations",
    starterCode: `class FileSystem:
    def __init__(self):
        # Your state here
        pass

    def create_path(self, path, value):
        """False if the path exists or its parent does not."""
        return False

    def get(self, path):
        """The value, or -1."""
        return -1
`,
    solutionCode: `class FileSystem:
    def __init__(self):
        self.values = {}

    def create_path(self, path, value):
        if path in self.values:
            return False
        parent = path[: path.rfind("/")]
        if parent and parent not in self.values:
            return False
        self.values[path] = value
        return True

    def get(self, path):
        return self.values.get(path, -1)
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "design-circular-deque": {
    entry: "__run_operations",
    starterCode: `class MyCircularDeque:
    def __init__(self, k):
        # Your state here
        pass

    def insert_front(self, value):
        return False

    def insert_last(self, value):
        return False

    def delete_front(self):
        return False

    def delete_last(self):
        return False

    def get_front(self):
        return -1

    def get_rear(self):
        return -1

    def is_empty(self):
        return True

    def is_full(self):
        return False
`,
    solutionCode: `class MyCircularDeque:
    def __init__(self, k):
        self.buffer = [0] * k
        self.capacity = k
        self.head = 0
        self.size = 0

    def insert_front(self, value):
        if self.size == self.capacity:
            return False
        self.head = (self.head - 1) % self.capacity
        self.buffer[self.head] = value
        self.size += 1
        return True

    def insert_last(self, value):
        if self.size == self.capacity:
            return False
        self.buffer[(self.head + self.size) % self.capacity] = value
        self.size += 1
        return True

    def delete_front(self):
        if self.size == 0:
            return False
        self.head = (self.head + 1) % self.capacity
        self.size -= 1
        return True

    def delete_last(self):
        if self.size == 0:
            return False
        self.size -= 1
        return True

    def get_front(self):
        return -1 if self.size == 0 else self.buffer[self.head]

    def get_rear(self):
        return -1 if self.size == 0 else self.buffer[(self.head + self.size - 1) % self.capacity]

    def is_empty(self):
        return self.size == 0

    def is_full(self):
        return self.size == self.capacity
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "my-calendar-i": {
    entry: "__run_operations",
    starterCode: `class MyCalendar:
    def __init__(self):
        # Your state here
        pass

    def book(self, start, end):
        """Half-open [start, end); False when it overlaps an existing booking."""
        return False
`,
    solutionCode: `import bisect


class MyCalendar:
    def __init__(self):
        self.starts = []
        self.ends = []

    def book(self, start, end):
        i = bisect.bisect_left(self.starts, start)
        if i > 0 and self.ends[i - 1] > start:
            return False
        if i < len(self.starts) and self.starts[i] < end:
            return False
        self.starts.insert(i, start)
        self.ends.insert(i, end)
        return True
`,
    driverCode: RUN_OPERATIONS_PY,
  },
};
