import type { JudgeLanguage } from "./types";

// Python judges for Blind 75 part B (binary), keyed by slug and merged into
// judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesO: Record<string, JudgeLanguage> = {
  "sum-of-two-integers": {
    entry: "get_sum",
    starterCode: `def get_sum(a, b):
    """a + b for 32-bit signed integers, without + or -."""
    # Your code here
    return 0
`,
    solutionCode: `def get_sum(a, b):
    mask = 0xFFFFFFFF
    a, b = a & mask, b & mask
    while b:
        carry = ((a & b) << 1) & mask
        a = (a ^ b) & mask
        b = carry
    return a if a < 0x80000000 else ~(a ^ mask)
`,
  },
  "number-of-1-bits": {
    entry: "hamming_weight",
    starterCode: `def hamming_weight(n):
    """How many bits of the unsigned 32-bit integer n are set."""
    # Your code here
    return 0
`,
    solutionCode: `def hamming_weight(n):
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count
`,
  },
  "counting-bits": {
    entry: "count_bits",
    starterCode: `def count_bits(n):
    """Set-bit counts of 0..n, in O(n)."""
    # Your code here
    return []
`,
    solutionCode: `def count_bits(n):
    bits = [0] * (n + 1)
    for i in range(1, n + 1):
        bits[i] = bits[i >> 1] + (i & 1)
    return bits
`,
  },
  "missing-number": {
    entry: "missing_number",
    starterCode: `def missing_number(nums):
    """nums holds n distinct numbers from 0..n; return the missing one."""
    # Your code here
    return 0
`,
    solutionCode: `def missing_number(nums):
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)
`,
  },
  "reverse-bits": {
    entry: "reverse_bits",
    starterCode: `def reverse_bits(n):
    """The 32 bits of the unsigned integer n, reversed."""
    # Your code here
    return 0
`,
    solutionCode: `def reverse_bits(n):
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result
`,
  },
  "climbing-stairs": {
    entry: "climb_stairs",
    starterCode: `def climb_stairs(n):
    # Your code here
    return 0
`,
    solutionCode: `def climb_stairs(n):
    prev, current = 1, 1
    for _ in range(2, n + 1):
        prev, current = current, prev + current
    return current
`,
  },
};
