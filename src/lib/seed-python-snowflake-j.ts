import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake LeetCode-tag bank, parts G and H (array
// dynamic programming and mixed classics), keyed by slug and merged into
// judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesJ: Record<string, JudgeLanguage> = {
  "painting-the-walls": {
    entry: "paint_walls",
    starterCode: `def paint_walls(cost, time):
    """Minimum cost to paint every wall with a paid and a free painter."""
    # Your code here
    return 0
`,
    solutionCode: `def paint_walls(cost, time):
    # Knapsack: paying for wall i covers time[i] + 1 walls.
    n = len(cost)
    dp = [float("inf")] * (n + 1)
    dp[0] = 0
    for i in range(n):
        for j in range(n, 0, -1):
            dp[j] = min(dp[j], dp[max(0, j - time[i] - 1)] + cost[i])
    return dp[n]
`,
  },
  "max-upgradable-servers": {
    entry: "max_upgrades",
    starterCode: `def max_upgrades(count, upgrade, sell, money):
    """Per data centre, the most servers that can be upgraded after selling some."""
    # Your code here
    return []
`,
    solutionCode: `def max_upgrades(count, upgrade, sell, money):
    return [min(c, (money[i] + c * sell[i]) // (upgrade[i] + sell[i])) for i, c in enumerate(count)]
`,
  },
  "min-array-length-after-pair-removals": {
    entry: "min_length_after_removals",
    starterCode: `def min_length_after_removals(nums):
    """nums is sorted; remove pairs i < j with nums[i] < nums[j]. The smallest reachable length."""
    # Your code here
    return 0
`,
    solutionCode: `def min_length_after_removals(nums):
    n = len(nums)
    max_freq = run = 0
    for i, v in enumerate(nums):
        run = run + 1 if i and nums[i - 1] == v else 1
        max_freq = max(max_freq, run)
    return max(2 * max_freq - n, n % 2)
`,
  },
  "paint-fence": {
    entry: "num_ways",
    starterCode: `def num_ways(n, k):
    """Colourings of n posts with k colours, no three consecutive posts alike."""
    # Your code here
    return 0
`,
    solutionCode: `def num_ways(n, k):
    if n == 0:
        return 0
    same, diff = 0, k
    for _ in range(2, n + 1):
        same, diff = diff, (same + diff) * (k - 1)
    return same + diff
`,
  },
  "patching-array": {
    entry: "min_patches",
    starterCode: `def min_patches(nums, n):
    """The fewest numbers to add so every sum 1..n is a subset sum."""
    # Your code here
    return 0
`,
    solutionCode: `def min_patches(nums, n):
    miss, patches, i = 1, 0, 0
    while miss <= n:
        if i < len(nums) and nums[i] <= miss:
            miss += nums[i]
            i += 1
        else:
            miss += miss
            patches += 1
    return patches
`,
  },
  "min-absolute-difference-two-values": {
    entry: "min_absolute_difference",
    starterCode: `def min_absolute_difference(a, b):
    """The smallest |a[i] - b[j]| over all pairs."""
    # Your code here
    return 0
`,
    solutionCode: `def min_absolute_difference(a, b):
    x, y = sorted(a), sorted(b)
    i = j = 0
    best = float("inf")
    while i < len(x) and j < len(y):
        best = min(best, abs(x[i] - y[j]))
        if x[i] < y[j]:
            i += 1
        else:
            j += 1
    return best
`,
  },
  "maximum-length-good-subsequence": {
    entry: "maximum_length",
    starterCode: `def maximum_length(nums, k):
    """The longest subsequence with at most k adjacent pairs that differ."""
    # Your code here
    return 0
`,
    solutionCode: `def maximum_length(nums, k):
    # best[j]: value -> longest with exactly j changes ending in value; top[j]: two best distinct values.
    best = [{} for _ in range(k + 1)]
    top = [[[0, None], [0, None]] for _ in range(k + 1)]
    answer = 0
    for x in nums:
        for j in range(k, -1, -1):
            length = best[j].get(x, 0) + 1
            if j > 0:
                first, second = top[j - 1]
                other = second[0] if first[1] == x else first[0]
                length = max(length, other + 1)
            if length > best[j].get(x, 0):
                best[j][x] = length
                t = top[j]
                if t[0][1] == x:
                    t[0][0] = length
                elif length > t[0][0]:
                    t[1] = t[0]
                    t[0] = [length, x]
                elif length > t[1][0]:
                    t[1] = [length, x]
            answer = max(answer, length)
    return answer
`,
  },
  "single-element-in-sorted-array": {
    entry: "single_non_duplicate",
    starterCode: `def single_non_duplicate(nums):
    """Sorted, every value twice except one. Find it in O(log n)."""
    # Your code here
    return 0
`,
    solutionCode: `def single_non_duplicate(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if mid % 2 == 1:
            mid -= 1
        if nums[mid] == nums[mid + 1]:
            lo = mid + 2
        else:
            hi = mid
    return nums[lo]
`,
  },
  "add-two-numbers": {
    entry: "add_two_numbers",
    starterCode: `def add_two_numbers(l1, l2):
    """Digits least significant first; return the sum's digits the same way."""
    # Your code here
    return []
`,
    solutionCode: `def add_two_numbers(l1, l2):
    out, carry, i = [], 0, 0
    while i < len(l1) or i < len(l2) or carry:
        total = (l1[i] if i < len(l1) else 0) + (l2[i] if i < len(l2) else 0) + carry
        out.append(total % 10)
        carry = total // 10
        i += 1
    return out
`,
  },
  "word-search": {
    entry: "exist",
    starterCode: `def exist(board, word):
    """Can word be traced through adjacent cells without reuse?"""
    # Your code here
    return False
`,
    solutionCode: `def exist(board, word):
    rows, cols = len(board), len(board[0])
    used = [[False] * cols for _ in range(rows)]

    def search(r, c, i):
        if i == len(word):
            return True
        if r < 0 or r >= rows or c < 0 or c >= cols or used[r][c] or board[r][c] != word[i]:
            return False
        used[r][c] = True
        found = (search(r + 1, c, i + 1) or search(r - 1, c, i + 1)
                 or search(r, c + 1, i + 1) or search(r, c - 1, i + 1))
        used[r][c] = False
        return found

    return any(search(r, c, 0) for r in range(rows) for c in range(cols))
`,
  },
  "remove-sub-folders": {
    entry: "remove_subfolders",
    starterCode: `def remove_subfolders(folder):
    """Drop every folder that lies under another; return the rest sorted."""
    # Your code here
    return []
`,
    solutionCode: `def remove_subfolders(folder):
    kept = []
    for path in sorted(folder):
        if kept and path.startswith(kept[-1] + "/"):
            continue
        kept.append(path)
    return kept
`,
  },
  "max-events-attended-ii": {
    entry: "max_value",
    starterCode: `def max_value(events, k):
    """[start, end, value] events, end inclusive; the best total of at most k non-overlapping events."""
    # Your code here
    return 0
`,
    solutionCode: `import bisect


def max_value(events, k):
    ordered = sorted(events, key=lambda e: e[1])
    ends = [e[1] for e in ordered]
    n = len(ordered)
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        start, _, value = ordered[i - 1]
        p = bisect.bisect_left(ends, start, 0, i - 1)
        for j in range(1, k + 1):
            dp[i][j] = max(dp[i - 1][j], dp[p][j - 1] + value)
    return dp[n][k]
`,
  },
};
