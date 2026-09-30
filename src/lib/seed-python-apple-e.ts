import type { JudgeLanguage } from "./types";

// Python judges for the rest of the Apple split problems — the socket line
// reader (seed-apple-q.ts) and the JavaScript-guide splits — keyed by slug and
// merged into judge.python by the seed script like seed-python-apple-d.ts.

export const applePythonJudgesE: Record<string, JudgeLanguage> = {
  "socket-line-reader": {
    entry: "__judge_lines",
    starterCode: `class LineReader:
    def __init__(self, sock):
        """sock.recv(k) returns at most k bytes; b"" means EOF."""
        self.sock = sock

    def read_line(self):
        """The next line as str (UTF-8) without its newline; None once exhausted."""
        # Your code here
        return None
`,
    solutionCode: `class _BufferedSocket:
    def __init__(self, sock):
        self._sock = sock
        self._buf = bytearray()  # deleting from the front of a bytearray is cheap
        self._eof = False

    def _fill(self):
        """One recv. Returns False once the peer has closed."""
        if self._eof:
            return False
        chunk = self._sock.recv(4096)
        if not chunk:
            self._eof = True
            return False
        self._buf += chunk
        return True


class LineReader(_BufferedSocket):
    def __init__(self, sock):
        super().__init__(sock)
        self._scanned = 0  # bytes already searched for a newline

    def read_line(self):
        while True:
            at = self._buf.find(b"\\n", self._scanned)
            if at != -1:
                line = bytes(self._buf[:at])
                del self._buf[:at + 1]
                self._scanned = 0
                return line.decode("utf-8")
            self._scanned = len(self._buf)
            if not self._fill():
                self._scanned = 0
                if not self._buf:
                    return None
                line = bytes(self._buf)  # final unterminated line
                self._buf.clear()
                return line.decode("utf-8")
`,
    driverCode: `def __judge_lines(pieces, cuts, calls):
    def expand(piece):
        return piece[0] * piece[1] if isinstance(piece, list) else piece

    data = "".join(expand(piece) for piece in pieces).encode("utf-8")
    bounds = [c for c in cuts if 0 < c < len(data)] + [len(data)]

    class FakeSocket:
        def __init__(self):
            self.pos = 0
            self.chunk = 0

        def recv(self, k=None):
            if self.pos >= len(data):
                return b""
            while bounds[self.chunk] <= self.pos:
                self.chunk += 1
            limit = self.pos + k if isinstance(k, int) and k > 0 else len(data)
            end = min(bounds[self.chunk], limit)
            out = data[self.pos:end]
            self.pos = end
            return out

    reader = LineReader(FakeSocket())

    def show(text):
        return "len:%d:%s:%s" % (len(text), text[:4], text[-4:]) if len(text) > 32 else text

    out = []
    for _ in range(calls):
        try:
            value = reader.read_line()
            out.append(None if value is None else show(str(value)))
        except Exception:
            out.append("error")
            break
    return out
`,
  },
  "first-duplicate-index": {
    entry: "first_duplicate_index",
    starterCode: `def first_duplicate_index(s):
    """The index of the earliest second occurrence of any character, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def first_duplicate_index(s):
    seen = set()
    for i, ch in enumerate(s):
        if ch in seen:
            return i
        seen.add(ch)
    return -1
`,
  },
  "values-appearing-once": {
    entry: "appear_once",
    starterCode: `def appear_once(a, b):
    """The values that occur exactly once across both lists, in first-seen order."""
    # Your code here
    return []
`,
    solutionCode: `def appear_once(a, b):
    counts = {}
    for v in a + b:
        counts[v] = counts.get(v, 0) + 1
    return [v for v, n in counts.items() if n == 1]
`,
  },
  "merge-arrays-unique-by-key": {
    entry: "union_by",
    starterCode: `def union_by(a, b, key):
    """Deduplicate dicts by item[key]; the first dict with each key wins."""
    # Your code here
    return []
`,
    solutionCode: `def union_by(a, b, key):
    seen = set()
    out = []
    for item in a + b:
        if item[key] in seen:
            continue
        seen.add(item[key])
        out.append(item)
    return out
`,
  },
  "product-of-next-two": {
    entry: "product_of_next_two",
    starterCode: `def product_of_next_two(nums):
    """Each position gets the product of the next two elements, wrapping around."""
    # Your code here
    return []
`,
    solutionCode: `def product_of_next_two(nums):
    n = len(nums)
    return [nums[(i + 1) % n] * nums[(i + 2) % n] for i in range(n)]
`,
  },
  "character-totals-in-order": {
    entry: "compress_totals",
    starterCode: `def compress_totals(s):
    """Each character's total count, in first-seen order: "AAABBAA" -> "5A2B"."""
    # Your code here
    return ""
`,
    solutionCode: `def compress_totals(s):
    counts = {}  # dicts keep insertion order: first-seen order
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return "".join(str(n) + ch for ch, n in counts.items())
`,
  },
  "multiply-without-operator": {
    entry: "multiply",
    starterCode: `def multiply(a, b):
    """a times b without *, /, ** or a multiplying helper."""
    # Your code here
    return 0
`,
    solutionCode: `def multiply(a, b):
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
  },
  "recursive-sum-to-n": {
    entry: "sum_to",
    starterCode: `def sum_to(n):
    """n + (n - 1) + ... + 1, recursively; 0 when n <= 0."""
    # Your code here
    return 0
`,
    solutionCode: `def sum_to(n):
    return 0 if n <= 0 else n + sum_to(n - 1)
`,
  },
  "square-root-binary-search": {
    entry: "__judge_sqrt",
    starterCode: `def sqrt(x):
    """The square root without math.sqrt or ** 0.5; float("nan") when x < 0."""
    # Your code here
    return 0.0
`,
    solutionCode: `def sqrt(x):
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
`,
    driverCode: `import math as __math


def __judge_sqrt(x):
    saved = (__math.sqrt, __math.pow, __math.isqrt)

    def banned(*args):
        raise RuntimeError("Write it yourself: math.sqrt is off limits here")

    __math.sqrt = __math.pow = __math.isqrt = banned
    try:
        root = sqrt(x)
    finally:
        __math.sqrt, __math.pow, __math.isqrt = saved
    if not isinstance(root, (int, float)):
        return root
    return "NaN" if root != root else "%.6f" % root
`,
  },
  "two-sum": {
    entry: "two_sum",
    starterCode: `def two_sum(nums, target):
    """Indices [i, j], i < j, of the pair that sums to target, or None."""
    # Your code here
    return None
`,
    solutionCode: `def two_sum(nums, target):
    seen = {}  # value -> index
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
    return None
`,
  },
  "fibonacci-generator": {
    entry: "__judge_fibonacci",
    starterCode: `def fibonacci():
    """Yield 0, 1, 1, 2, 3, 5, ... forever, exactly."""
    # Your code here
    yield 0
`,
    solutionCode: `def fibonacci():
    a, b = 0, 1  # Python integers never overflow
    while True:
        yield a
        a, b = b, a + b
`,
    driverCode: `def __judge_fibonacci(kind, count):
    it = fibonacci()
    values = []
    for _ in range(count):
        try:
            values.append(str(next(it)))
        except StopIteration:
            break
    if kind == "first":
        return values
    return values[-1] if values else None
`,
  },
};
