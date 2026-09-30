import type { JudgeLanguage } from "./types";

// Python judge definitions for the language-neutral problems of the Apple
// front-end bank (seed-apple-js-f.ts and seed-apple-js-g.ts), merged into
// each problem's judge by the seed script like the other Apple maps. Drivers
// mirror the JavaScript ones case for case; names are snake_case.

export const applePythonJudgesC: Record<string, JudgeLanguage> = {
  "first-duplicate-character": {
    entry: "__judge_duplicate",
    starterCode: `def first_duplicate(s):
    """The first character whose second occurrence comes earliest, or None."""
    # Your code here
    return None


def first_duplicate_index(s):
    """The index of that second occurrence, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def first_duplicate(s):
    seen = set()
    for ch in s:  # a Python str iterates code points, so an emoji arrives whole
        if ch in seen:
            return ch
        seen.add(ch)
    return None


def first_duplicate_index(s):
    seen = set()
    for i, ch in enumerate(s):
        if ch in seen:
            return i
        seen.add(ch)
    return -1
`,
    driverCode: `def __judge_duplicate(kind, s):
    if kind == "char":
        return first_duplicate(s)
    if kind == "index":
        return first_duplicate_index(s)
    raise ValueError("unknown case " + kind)
`,
  },
  "merge-arrays-unique-values": {
    entry: "__judge_merge",
    starterCode: `def union(a, b):
    """Every value once, in first-seen order."""
    # Your code here
    return []


def appear_once(a, b):
    """The values that occur exactly once across both lists, in first-seen order."""
    # Your code here
    return []


def union_by(a, b, key):
    """Deduplicate dicts by item[key]; the first dict with each key wins."""
    # Your code here
    return []
`,
    solutionCode: `def union(a, b):
    return list(dict.fromkeys(a + b))  # dicts keep insertion order


def appear_once(a, b):
    counts = {}
    for v in a + b:
        counts[v] = counts.get(v, 0) + 1
    return [v for v, n in counts.items() if n == 1]


def union_by(a, b, key):
    seen = set()
    out = []
    for item in a + b:
        if item[key] in seen:
            continue
        seen.add(item[key])
        out.append(item)
    return out
`,
    driverCode: `def __judge_merge(kind, a, b, key=None):
    if kind == "union":
        return union(a, b)
    if kind == "once":
        return appear_once(a, b)
    if kind == "unionBy":
        return union_by(a, b, key)
    raise ValueError("unknown case " + kind)
`,
  },
  "array-products-two-readings": {
    entry: "__judge_products",
    starterCode: `def product_of_others(nums):
    """Each position gets the product of every other element, without division."""
    # Your code here
    return []


def product_of_next_two(nums):
    """Each position gets the product of the next two elements, wrapping around."""
    # Your code here
    return []
`,
    solutionCode: `def product_of_others(nums):
    out = [1] * len(nums)
    left = 1
    for i, v in enumerate(nums):
        out[i] = left  # product of everything before i
        left *= v
    right = 1
    for i in range(len(nums) - 1, -1, -1):
        out[i] *= right  # times everything after i
        right *= nums[i]
    return out


def product_of_next_two(nums):
    n = len(nums)
    return [nums[(i + 1) % n] * nums[(i + 2) % n] for i in range(n)]
`,
    driverCode: `def __judge_products(kind, nums):
    if kind == "others":
        return product_of_others(nums)
    if kind == "nextTwo":
        return product_of_next_two(nums)
    raise ValueError("unknown case " + kind)
`,
  },
  "run-length-compress": {
    entry: "__judge_compress",
    starterCode: `def compress_runs(s):
    """Each run as its length then its character: "AAABBAA" -> "3A2B2A"."""
    # Your code here
    return ""


def compress_totals(s):
    """Each character's total count, in first-seen order: "AAABBAA" -> "5A2B"."""
    # Your code here
    return ""


def decode_runs(encoded):
    """Undo compress_runs; counts may have several digits: "12A1B"."""
    # Your code here
    return ""
`,
    solutionCode: `def compress_runs(s):
    parts = []
    i = 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        parts.append(str(j - i) + s[i])
        i = j
    return "".join(parts)


def compress_totals(s):
    counts = {}  # dicts keep insertion order: first-seen order
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return "".join(str(n) + ch for ch, n in counts.items())


def decode_runs(encoded):
    parts = []
    count = 0
    for ch in encoded:
        if ch.isdigit():
            count = count * 10 + int(ch)  # counts may have several digits
        else:
            parts.append(ch * count)
            count = 0
    return "".join(parts)
`,
    driverCode: `def __judge_compress(kind, s):
    if kind == "runs":
        return compress_runs(s)
    if kind == "totals":
        return compress_totals(s)
    if kind == "decode":
        return decode_runs(s)
    if kind == "roundTrip":
        return decode_runs(compress_runs(s)) == s
    raise ValueError("unknown case " + kind)
`,
  },
  "domain-operation-simulator": {
    entry: "process_domain_operations",
    starterCode: `def process_domain_operations(operations):
    """operations: rows of [op, domain, ip]. Return the outputs of the GET and COUNT rows."""
    # Your code here
    return []
`,
    solutionCode: `def process_domain_operations(operations):
    ips = {}
    root = {"count": 0, "next": {}}
    out = []
    for row in operations:
        op, domain = row[0], row[1]
        if op == "PUT":
            if domain not in ips:
                # a new domain: count it once along its reversed labels
                node = root
                for label in reversed(domain.split(".")):
                    node = node["next"].setdefault(label, {"count": 0, "next": {}})
                    node["count"] += 1
            ips[domain] = row[2]
        elif op == "GET":
            out.append(ips.get(domain, "404"))
        elif op == "COUNT":
            node = root
            for label in reversed(domain.split(".")):
                node = node["next"].get(label) if node else None
            out.append(str(node["count"] if node else 0))
    return out
`,
  },
  "min-stack-and-multiply": {
    entry: "__judge_stack_and_multiply",
    starterCode: `class MinStack:
    def push(self, x):
        # Your code here
        pass

    def pop(self):
        """Remove and return the top value (None when empty)."""
        # Your code here
        return None

    def get_min(self):
        """The smallest value on the stack (None when empty)."""
        # Your code here
        return None


def multiply(a, b):
    """a times b without *, /, ** or a multiplying helper."""
    # Your code here
    return 0
`,
    solutionCode: `class MinStack:
    def __init__(self):
        self.items = []
        self.mins = []  # the minimum at each depth

    def push(self, x):
        self.items.append(x)
        self.mins.append(min(x, self.mins[-1]) if self.mins else x)

    def pop(self):
        if not self.items:
            return None
        self.mins.pop()
        return self.items.pop()

    def get_min(self):
        return self.mins[-1] if self.mins else None


def multiply(a, b):
    negative = (a < 0) != (b < 0)
    n, m = abs(a), abs(b)
    out = 0
    while m > 0:
        if m & 1:
            out += n  # this bit of m is set: add the current power-of-two multiple
        n += n  # double
        m >>= 1  # halve
    return -out if negative else out
`,
    driverCode: `def __judge_stack_and_multiply(kind, a, b=None):
    if kind == "multiply":
        return multiply(a, b)
    if kind == "stack":
        names = {"push": "push", "pop": "pop", "getMin": "get_min"}
        stack = None
        out = []
        for op, args in zip(a, b):
            if op == "MinStack":
                stack = MinStack()
                out.append(None)
                continue
            out.append(getattr(stack, names[op])(*args))
        return out
    raise ValueError("unknown case " + kind)
`,
  },
  "screen-warm-ups": {
    entry: "__judge_warmups",
    starterCode: `def to_int(s):
    """"1234" -> 1234 without int() or float() on the string; float("nan") when invalid."""
    # Your code here
    return float("nan")


def sum_to(n):
    """n + (n - 1) + ... + 1, recursively; 0 when n <= 0."""
    # Your code here
    return 0


def sqrt(x):
    """The square root without math.sqrt or ** 0.5; float("nan") when x < 0."""
    # Your code here
    return 0.0


def two_sum(nums, target):
    """Indices [i, j], i < j, of the pair that sums to target, or None."""
    # Your code here
    return None


def fibonacci():
    """Yield 0, 1, 1, 2, 3, 5, ... forever, exactly."""
    # Your code here
    yield 0
`,
    solutionCode: `DIGITS = {str(d): d for d in range(10)}


def to_int(s):
    i, sign = 0, 1
    if s[:1] in ("-", "+"):
        sign = -1 if s[0] == "-" else 1
        i = 1
    if i == len(s):
        return float("nan")  # no digits at all
    n = 0
    for ch in s[i:]:
        if ch not in DIGITS:
            return float("nan")
        n = n * 10 + DIGITS[ch]
    return sign * n


def sum_to(n):
    return 0 if n <= 0 else n + sum_to(n - 1)


def sqrt(x):
    if x < 0:
        return float("nan")
    lo, hi = 0.0, max(1.0, float(x))  # the root of x < 1 is larger than x
    for _ in range(200):  # a fixed count: an epsilon loop never ends for large x
        mid = (lo + hi) / 2
        if mid * mid > x:
            hi = mid
        else:
            lo = mid
    return lo


def two_sum(nums, target):
    seen = {}  # value -> index
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
    return None


def fibonacci():
    a, b = 0, 1  # Python integers never overflow
    while True:
        yield a
        a, b = b, a + b
`,
    driverCode: `import math as __math


def __judge_warmups(kind, a=None, b=None):
    def is_nan(v):
        return isinstance(v, float) and v != v

    if kind == "toInt":
        result = to_int(a)
        return "NaN" if is_nan(result) else result
    if kind == "sumTo":
        return sum_to(a)
    if kind == "sqrt":
        saved = (__math.sqrt, __math.pow, __math.isqrt)

        def banned(*args):
            raise RuntimeError("Write it yourself: math.sqrt is off limits here")

        __math.sqrt = __math.pow = __math.isqrt = banned
        try:
            root = sqrt(a)
        finally:
            __math.sqrt, __math.pow, __math.isqrt = saved
        if not isinstance(root, (int, float)):
            return root
        return "NaN" if is_nan(root) else "%.6f" % root
    if kind == "twoSum":
        return two_sum(a, b)
    if kind in ("fibonacci", "fibonacciNth"):
        it = fibonacci()
        values = []
        for _ in range(a):
            try:
                values.append(str(next(it)))
            except StopIteration:
                break
        if kind == "fibonacci":
            return values
        return values[-1] if values else None
    raise ValueError("unknown case " + kind)
`,
  },
};
