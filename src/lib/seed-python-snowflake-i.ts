import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake LeetCode-tag bank, parts E and F (string
// dynamic programming and array classics), keyed by slug and merged into
// judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesI: Record<string, JudgeLanguage> = {
  "regular-expression-matching": {
    entry: "is_match",
    starterCode: `def is_match(s, p):
    """Does pattern p (letters, '.' and '*') match all of s?"""
    # Your code here
    return False
`,
    solutionCode: `def is_match(s, p):
    # Bottom-up over suffixes: dp[i][j] = s[i:] matches p[j:].
    n, m = len(s), len(p)
    dp = [[False] * (m + 1) for _ in range(n + 1)]
    dp[n][m] = True
    for i in range(n, -1, -1):
        for j in range(m - 1, -1, -1):
            first = i < n and p[j] in (".", s[i])
            if j + 1 < m and p[j + 1] == "*":
                dp[i][j] = dp[i][j + 2] or (first and dp[i + 1][j])
            else:
                dp[i][j] = first and dp[i + 1][j + 1]
    return dp[0][0]
`,
  },
  "valid-word-abbreviation": {
    entry: "valid_word_abbreviation",
    starterCode: `def valid_word_abbreviation(word, abbr):
    """Numbers replace that many letters; leading zeros are invalid."""
    # Your code here
    return False
`,
    solutionCode: `def valid_word_abbreviation(word, abbr):
    i = j = 0
    while j < len(abbr):
        ch = abbr[j]
        if ch.isdigit():
            if ch == "0":
                return False
            count = 0
            while j < len(abbr) and abbr[j].isdigit():
                count = count * 10 + int(abbr[j])
                j += 1
            i += count
        else:
            if i >= len(word) or word[i] != ch:
                return False
            i += 1
            j += 1
    return i == len(word)
`,
  },
  "remove-k-digits": {
    entry: "remove_k_digits",
    starterCode: `def remove_k_digits(num, k):
    """The smallest number after removing k digits, as a string without leading zeros."""
    # Your code here
    return "0"
`,
    solutionCode: `def remove_k_digits(num, k):
    stack = []
    for d in num:
        while k > 0 and stack and stack[-1] > d:
            stack.pop()
            k -= 1
        stack.append(d)
    if k > 0:
        stack = stack[:-k]
    out = "".join(stack).lstrip("0")
    return out or "0"
`,
  },
  "count-vowel-substrings": {
    entry: "count_vowel_substrings",
    starterCode: `def count_vowel_substrings(word):
    """Substrings made only of vowels that contain all five."""
    # Your code here
    return 0
`,
    solutionCode: `def count_vowel_substrings(word):
    last, start, count = {}, 0, 0
    for r, ch in enumerate(word):
        if ch not in "aeiou":
            start, last = r + 1, {}
            continue
        last[ch] = r
        if len(last) == 5:
            count += min(last.values()) - start + 1
    return count
`,
  },
  "number-of-ways-to-form-target": {
    entry: "num_ways",
    starterCode: `def num_ways(words, target):
    """Ways to form target from columns of the words, left to right, modulo 1e9 + 7."""
    # Your code here
    return 0
`,
    solutionCode: `def num_ways(words, target):
    MOD = 10**9 + 7
    m, n = len(words[0]), len(target)
    counts = [{} for _ in range(m)]
    for word in words:
        for i, ch in enumerate(word):
            counts[i][ch] = counts[i].get(ch, 0) + 1
    dp = [0] * (n + 1)
    dp[0] = 1
    for col in range(m):
        for j in range(min(col, n - 1), -1, -1):
            c = counts[col].get(target[j], 0)
            if c:
                dp[j + 1] = (dp[j + 1] + dp[j] * c) % MOD
    return dp[n]
`,
  },
  "string-transformation": {
    entry: "number_of_ways",
    starterCode: `def number_of_ways(s, t, k):
    """Ways to turn s into t with exactly k suffix-to-front moves, modulo 1e9 + 7."""
    # Your code here
    return 0
`,
    solutionCode: `def number_of_ways(s, t, k):
    # Rotations matching t (KMP on s + s) times the number of k-step walks on the cycle.
    MOD = 10**9 + 7
    n = len(s)
    lps = [0] * n
    length = 0
    i = 1
    while i < n:
        if t[i] == t[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            i += 1
    text = s + s
    matches = j = 0
    for i in range(2 * n - 1):
        while j and text[i] != t[j]:
            j = lps[j - 1]
        if text[i] == t[j]:
            j += 1
        if j == n:
            matches += 1
            j = lps[j - 1]
    zero = 1 if s == t else 0

    def mul(a, b):
        return [[(a[0][0] * b[0][0] + a[0][1] * b[1][0]) % MOD, (a[0][0] * b[0][1] + a[0][1] * b[1][1]) % MOD],
                [(a[1][0] * b[0][0] + a[1][1] * b[1][0]) % MOD, (a[1][0] * b[0][1] + a[1][1] * b[1][1]) % MOD]]

    result = [[1, 0], [0, 1]]
    base = [[0, n - 1], [1, n - 2]]
    e = k
    while e:
        if e & 1:
            result = mul(result, base)
        base = mul(base, base)
        e >>= 1
    f, g = result[0][0], result[1][0]
    return (zero * f + (matches - zero) * g) % MOD
`,
  },
  "trapping-rain-water": {
    entry: "trap",
    starterCode: `def trap(height):
    """Units of water trapped by the elevation map."""
    # Your code here
    return 0
`,
    solutionCode: `def trap(height):
    left, right = 0, len(height) - 1
    left_max = right_max = water = 0
    while left < right:
        if height[left] < height[right]:
            left_max = max(left_max, height[left])
            water += left_max - height[left]
            left += 1
        else:
            right_max = max(right_max, height[right])
            water += right_max - height[right]
            right -= 1
    return water
`,
  },
  "jump-game-ii": {
    entry: "jump",
    starterCode: `def jump(nums):
    """The fewest jumps from index 0 to the last index."""
    # Your code here
    return 0
`,
    solutionCode: `def jump(nums):
    jumps = range_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == range_end:
            jumps += 1
            range_end = farthest
    return jumps
`,
  },
  "best-time-to-buy-and-sell-stock": {
    entry: "max_profit",
    starterCode: `def max_profit(prices):
    """The best profit from one buy and one later sell, or 0."""
    # Your code here
    return 0
`,
    solutionCode: `def max_profit(prices):
    lowest, best = float("inf"), 0
    for price in prices:
        lowest = min(lowest, price)
        best = max(best, price - lowest)
    return best
`,
  },
  "boats-to-save-people": {
    entry: "num_rescue_boats",
    starterCode: `def num_rescue_boats(people, limit):
    """The fewest two-person boats of capacity limit."""
    # Your code here
    return 0
`,
    solutionCode: `def num_rescue_boats(people, limit):
    weights = sorted(people)
    light, heavy, boats = 0, len(weights) - 1, 0
    while light <= heavy:
        if weights[light] + weights[heavy] <= limit:
            light += 1
        heavy -= 1
        boats += 1
    return boats
`,
  },
  "shortest-distance-to-a-character": {
    entry: "shortest_to_char",
    starterCode: `def shortest_to_char(s, c):
    """Distance from each index to the nearest occurrence of c."""
    # Your code here
    return []
`,
    solutionCode: `def shortest_to_char(s, c):
    n = len(s)
    out = [0] * n
    last = float("-inf")
    for i, ch in enumerate(s):
        if ch == c:
            last = i
        out[i] = i - last
    last = float("inf")
    for i in range(n - 1, -1, -1):
        if s[i] == c:
            last = i
        out[i] = min(out[i], last - i)
    return out
`,
  },
  "maximize-distance-to-closest-person": {
    entry: "max_dist_to_closest",
    starterCode: `def max_dist_to_closest(seats):
    """1 occupied, 0 empty. The largest achievable distance to the nearest person."""
    # Your code here
    return 0
`,
    solutionCode: `def max_dist_to_closest(seats):
    best, prev = 0, -1
    for i, seat in enumerate(seats):
        if seat != 1:
            continue
        best = max(best, i if prev == -1 else (i - prev) // 2)
        prev = i
    return max(best, len(seats) - 1 - prev)
`,
  },
};
