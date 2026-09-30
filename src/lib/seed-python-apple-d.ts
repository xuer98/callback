import type { JudgeLanguage } from "./types";

// Python judges for Apple problems split out of multi-question prompts
// (seed-apple-n.ts to seed-apple-p.ts), keyed by slug and merged into
// judge.python by the seed script like seed-python-apple.ts. The socket line
// reader and the JavaScript-guide splits continue in seed-python-apple-e.ts.

export const applePythonJudgesD: Record<string, JudgeLanguage> = {
  "sessionize-events": {
    entry: "sessionize",
    starterCode: `def sessionize(events, gap):
    """events: unordered [entity, timestamp] pairs.
    Return {entity: [[start, end, count], ...]} with sessions in time order."""
    # Your code here
    return {}
`,
    solutionCode: `def sessionize(events, gap):
    """Sort by (entity, time), then one sweep with one open session per entity."""
    out = {}
    for entity, ts in sorted(events):
        sessions = out.setdefault(entity, [])
        if sessions and ts - sessions[-1][1] <= gap:
            sessions[-1][1] = ts
            sessions[-1][2] += 1
        else:
            sessions.append([ts, ts, 1])
    return out
`,
  },
  "unit-conversion-queries": {
    entry: "query_conversions",
    starterCode: `MOD = 10**9 + 7


def query_conversions(n, conversions, queries):
    """Tree of conversions rooted at unit 0. Each [a, b] query: units of b
    per one unit of a, modulo MOD."""
    # Your code here
    return [0] * len(queries)
`,
    solutionCode: `from collections import defaultdict

MOD = 10**9 + 7


def base_unit_conversions(n, conversions):
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


def query_conversions(n, conversions, queries):
    """1 unit of a == ans[b] * inverse(ans[a]) units of b; Fermat inverse since MOD is prime."""
    ans = base_unit_conversions(n, conversions)
    return [ans[b] * pow(ans[a], MOD - 2, MOD) % MOD for a, b in queries]
`,
  },
  "token-bucket-rate-limiter": {
    entry: "__run_operations",
    starterCode: `class TokenBucket:
    def __init__(self, capacity, rate):
        """Buckets start full; tokens refill at \`rate\` per unit time up to \`capacity\`."""
        self.capacity = capacity
        self.rate = rate

    def allow(self, key, now, cost=1):
        """Return whether \`cost\` tokens were available (and deducted)."""
        return False
`,
    solutionCode: `class TokenBucket:
    """Bursts up to capacity, refills at rate per unit time, O(1) memory per key."""

    def __init__(self, capacity, rate):
        self.capacity = capacity
        self.rate = rate
        self.state = {}  # key -> (tokens, last_seen)

    def allow(self, key, now, cost=1):
        tokens, last = self.state.get(key, (float(self.capacity), now))
        tokens = min(self.capacity, tokens + (now - last) * self.rate)
        if tokens >= cost:
            self.state[key] = (tokens - cost, now)
            return True
        self.state[key] = (tokens, now)
        return False
`,
    driverCode: `def __run_operations(operations, args):
    bucket = None
    out = []
    for op, a in zip(operations, args):
        if op == "TokenBucket":
            bucket = TokenBucket(*a)
            out.append(None)
        else:
            out.append(getattr(bucket, op)(*a))
    return out
`,
  },
  "compound-iterator": {
    entry: "__run_operations",
    starterCode: `class CompoundIterator:
    def __init__(self, *iterables):
        """Chain the iterables in order, skipping empty ones."""
        # Your state here
        pass

    def has_next(self):
        return False

    def next(self):
        return None
`,
    solutionCode: `from collections import deque


class CompoundIterator:
    """Chain k iterables, skipping empty ones, behind a one-element lookahead."""

    def __init__(self, *iterables):
        self.queue = deque(iter(it) for it in iterables)
        self._lookahead = None
        self._filled = False
        self._advance()

    def _advance(self):
        self._filled = False
        while self.queue:
            try:
                self._lookahead = next(self.queue[0])
                self._filled = True
                return
            except StopIteration:
                self.queue.popleft()

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
        if op == "CompoundIterator":
            iterator = CompoundIterator(*a[0])
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
  "weighted-sampling": {
    entry: "__judge_weighted",
    starterCode: `def weighted_sample(items, k, random):
    """items: [value, weight] pairs; weight <= 0 is never chosen. random():
    uniform in [0, 1) -- the only randomness you may use.
    Return k distinct values with inclusion probability following the weights."""
    # Your code here
    return []
`,
    solutionCode: `def weighted_sample(items, k, random):
    """A-Res: keep the k items with the largest random() ** (1 / weight)."""
    keyed = [(random() ** (1.0 / weight), value) for value, weight in items if weight > 0]
    keyed.sort(key=lambda pair: -pair[0])  # a size-k min-heap is the streaming version
    return [value for _, value in keyed[:k]]
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


def __judge_weighted(items, k, trials, tolerance):
    random = __random_module.Random(12345).random
    counts = {}
    positive = [pair for pair in items if pair[1] > 0]
    allowed = set(pair[0] for pair in positive)
    size = min(k, len(positive))
    for _ in range(trials):
        sample = weighted_sample(items, k, random)
        problem = __check_sample(sample, size, allowed)
        if problem:
            return problem
        for value in sample:
            counts[value] = counts.get(value, 0) + 1
    total = sum(pair[1] for pair in positive)
    for value, weight in positive:
        freq = counts.get(value, 0) / trials
        if k == 1 and abs(freq - weight / total) > tolerance:
            return "item %r was selected %.3f of the time; expected %.3f +/- %s" % (value, freq, weight / total, tolerance)
        for other, other_weight in positive:
            if other_weight < weight and counts.get(other, 0) / trials > freq + tolerance:
                return "lighter item %r was selected more often than heavier %r" % (other, value)
    return "ok"
`,
  },
  "stratified-sampling": {
    entry: "__judge_stratified",
    starterCode: `def stratified_sample(items, n, random):
    """items: [value, stratum] pairs. Allocate n by largest-remainder rounding
    (ties by stratum name), choose uniformly within each stratum. random():
    uniform in [0, 1) -- the only randomness you may use."""
    # Your code here
    return []
`,
    solutionCode: `def reservoir_sample(items, k, random):
    reservoir = []
    for i, item in enumerate(items):
        if i < k:
            reservoir.append(item)
        else:
            j = int(random() * (i + 1))
            if j < k:
                reservoir[j] = item
    return reservoir


def stratified_sample(items, n, random):
    """Proportional allocation with largest-remainder rounding, then uniform within each stratum."""
    strata = {}
    for value, stratum in items:
        strata.setdefault(stratum, []).append(value)
    names = sorted(strata)
    exact = {name: len(strata[name]) * n / len(items) for name in names}
    allocation = {name: int(exact[name]) for name in names}
    shortfall = n - sum(allocation.values())
    for name in sorted(names, key=lambda name: (-(exact[name] - allocation[name]), name))[:shortfall]:
        allocation[name] += 1
    out = []
    for name in names:
        out.extend(reservoir_sample(strata[name], allocation[name], random))
    return out
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


def __judge_stratified(spec, k, trials, tolerance):
    random = __random_module.Random(12345).random
    counts = {}
    items = []
    sizes = {}
    for stratum, size in spec:
        sizes[stratum] = size
        for i in range(1, size + 1):
            items.append([stratum + "-" + str(i), stratum])
    names = sorted(sizes)
    exact = {name: sizes[name] * k / len(items) for name in names}
    allocation = {name: int(exact[name]) for name in names}
    shortfall = k - sum(allocation.values())
    for name in sorted(names, key=lambda name: (-(exact[name] - allocation[name]), name))[:shortfall]:
        allocation[name] += 1
    allowed = set(pair[0] for pair in items)
    for _ in range(trials):
        sample = stratified_sample(items, k, random)
        problem = __check_sample(sample, k, allowed)
        if problem:
            return problem
        per_stratum = {}
        for value in sample:
            stratum = value[: value.rindex("-")]
            per_stratum[stratum] = per_stratum.get(stratum, 0) + 1
            counts[value] = counts.get(value, 0) + 1
        for name in names:
            if per_stratum.get(name, 0) != allocation[name]:
                return "stratum %s got %d items; largest-remainder allocation is %d" % (name, per_stratum.get(name, 0), allocation[name])
    for value, stratum in items:
        expected = allocation[stratum] / sizes[stratum]
        freq = counts.get(value, 0) / trials
        if abs(freq - expected) > tolerance:
            return "item %s was selected %.3f of the time; expected %.3f +/- %s" % (value, freq, expected, tolerance)
    return "ok"
`,
  },
  "histogram-quantile": {
    entry: "__run_operations",
    starterCode: `class HistogramQuantile:
    def __init__(self, lo, hi, buckets):
        """Fixed memory: buckets of width (hi - lo) / buckets, plus underflow and overflow."""
        self.lo = lo
        self.hi = hi
        self.buckets = buckets

    def add(self, x):
        # Your code here
        pass

    def quantile(self, q):
        """lo, hi, or the answering bucket's midpoint; None when empty."""
        return None
`,
    solutionCode: `class HistogramQuantile:
    """Fixed memory: O(buckets) regardless of stream length, error of half a bucket width."""

    def __init__(self, lo, hi, buckets):
        self.lo, self.hi = lo, hi
        self.width = (hi - lo) / buckets
        self.counts = [0] * (buckets + 2)  # [underflow, buckets..., overflow]
        self.n = 0

    def add(self, x):
        self.n += 1
        if x < self.lo:
            self.counts[0] += 1
        elif x >= self.hi:
            self.counts[-1] += 1
        else:
            self.counts[1 + int((x - self.lo) / self.width)] += 1

    def quantile(self, q):
        if self.n == 0:
            return None
        target = q * self.n
        running = 0
        for i, count in enumerate(self.counts):
            running += count
            if running >= target:
                if i == 0:
                    return self.lo
                if i == len(self.counts) - 1:
                    return self.hi
                return self.lo + (i - 1 + 0.5) * self.width
        return self.hi
`,
    driverCode: `def __run_operations(operations, args):
    stat = None
    out = []
    for op, a in zip(operations, args):
        if op == "HistogramQuantile":
            stat = HistogramQuantile(*a)
            out.append(None)
        else:
            value = getattr(stat, op)(*a)
            out.append(round(value, 6) if isinstance(value, float) else value)
    return out
`,
  },
  "ndcg-at-k": {
    entry: "__judge_metric",
    starterCode: `def ndcg_at_k(ranked_rels, k, ideal=None):
    """ranked_rels: graded relevance in returned order; ideal: relevances of every
    relevant item when known, else taken from ranked_rels. 0 when the ideal DCG is 0."""
    # Your code here
    return 0.0
`,
    solutionCode: `import math


def dcg(rels):
    return sum(rel / math.log2(i + 2) for i, rel in enumerate(rels))


def ndcg_at_k(ranked_rels, k, ideal=None):
    """ranked_rels: graded relevance in the order the system returned items."""
    cut = ranked_rels[:k]
    best = sorted(ideal if ideal is not None else ranked_rels, reverse=True)[:k]
    idcg = dcg(best)
    return dcg(cut) / idcg if idcg else 0.0
`,
    driverCode: `def __judge_metric(*args):
    return round(ndcg_at_k(*args), 6)
`,
  },
  "cohens-kappa": {
    entry: "__judge_metric",
    starterCode: `def cohens_kappa(a, b):
    """Agreement corrected for chance over two equal-length label lists; 1 when pe == 1."""
    # Your code here
    return 0.0
`,
    solutionCode: `from collections import Counter


def cohens_kappa(a, b):
    """Inter-annotator agreement corrected for chance."""
    n = len(a)
    po = sum(x == y for x, y in zip(a, b)) / n
    count_a, count_b = Counter(a), Counter(b)
    pe = sum(count_a[label] / n * count_b[label] / n for label in set(count_a) | set(count_b))
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)
`,
    driverCode: `def __judge_metric(*args):
    return round(cohens_kappa(*args), 6)
`,
  },
  "pass-at-k": {
    entry: "__judge_metric",
    starterCode: `def pass_at_k(n, c, k):
    """Unbiased 1 - C(n - c, k) / C(n, k), as a product; 1 when n - c < k."""
    # Your code here
    return 0.0
`,
    solutionCode: `import math


def pass_at_k(n, c, k):
    """Unbiased pass@k: 1 - C(n-c, k) / C(n, k), as a product so nothing overflows."""
    if n - c < k:
        return 1.0
    return 1.0 - math.prod((n - c - i) / (n - i) for i in range(k))
`,
    driverCode: `def __judge_metric(*args):
    return round(pass_at_k(*args), 6)
`,
  },
};
