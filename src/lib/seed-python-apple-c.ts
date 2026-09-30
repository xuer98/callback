import type { JudgeLanguage } from "./types";

// Python judge definitions for the language-neutral problems of the Apple
// front-end bank (seed-apple-js-f.ts and seed-apple-js-g.ts), merged into
// each problem's judge by the seed script like the other Apple maps. Drivers
// mirror the JavaScript ones case for case; names are snake_case.

export const applePythonJudgesC: Record<string, JudgeLanguage> = {
  "first-duplicate-character": {
    entry: "first_duplicate",
    starterCode: `def first_duplicate(s):
    """The first character whose second occurrence comes earliest, or None."""
    # Your code here
    return None
`,
    solutionCode: `def first_duplicate(s):
    seen = set()
    for ch in s:  # a Python str iterates code points, so an emoji arrives whole
        if ch in seen:
            return ch
        seen.add(ch)
    return None
`,
  },
  "merge-arrays-unique-values": {
    entry: "union",
    starterCode: `def union(a, b):
    """Every value once, in first-seen order."""
    # Your code here
    return []
`,
    solutionCode: `def union(a, b):
    return list(dict.fromkeys(a + b))  # dicts keep insertion order
`,
  },
  "product-of-others": {
    entry: "product_of_others",
    starterCode: `def product_of_others(nums):
    """Each position gets the product of every other element, without division."""
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
`,
  },
  "run-length-compress": {
    entry: "__judge_compress",
    starterCode: `def compress_runs(s):
    """Each run as its length then its character: "AAABBAA" -> "3A2B2A"."""
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
  "min-stack": {
    entry: "__run_stack",
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
`,
    driverCode: `def __run_stack(operations, args):
    names = {"push": "push", "pop": "pop", "getMin": "get_min"}
    stack = None
    out = []
    for op, a in zip(operations, args):
        if op == "MinStack":
            stack = MinStack()
            out.append(None)
            continue
        out.append(getattr(stack, names[op])(*a))
    return out
`,
  },
  "string-to-integer": {
    entry: "__judge_to_int",
    starterCode: `def to_int(s):
    """"1234" -> 1234 without int() or float() on the string; float("nan") when invalid."""
    # Your code here
    return float("nan")
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
`,
    driverCode: `def __judge_to_int(s):
    result = to_int(s)
    return "NaN" if isinstance(result, float) and result != result else result
`,
  },
};
