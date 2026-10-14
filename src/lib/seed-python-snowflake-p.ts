import type { JudgeLanguage } from "./types";

// Python judges for Blind 75 part C (dynamic programming), keyed by slug and
// merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesP: Record<string, JudgeLanguage> = {
  "coin-change": {
    entry: "coin_change",
    starterCode: `def coin_change(coins, amount):
    """Fewest coins making amount exactly, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def coin_change(coins, amount):
    dp = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a and dp[a - coin] + 1 < dp[a]:
                dp[a] = dp[a - coin] + 1
    return -1 if dp[amount] == float("inf") else dp[amount]
`,
  },
  "longest-increasing-subsequence": {
    entry: "length_of_lis",
    starterCode: `def length_of_lis(nums):
    """Length of the longest strictly increasing subsequence."""
    # Your code here
    return 0
`,
    solutionCode: `import bisect


def length_of_lis(nums):
    tails = []
    for value in nums:
        i = bisect.bisect_left(tails, value)
        if i == len(tails):
            tails.append(value)
        else:
            tails[i] = value
    return len(tails)
`,
  },
  "longest-common-subsequence": {
    entry: "longest_common_subsequence",
    starterCode: `def longest_common_subsequence(text1, text2):
    # Your code here
    return 0
`,
    solutionCode: `def longest_common_subsequence(text1, text2):
    prev = [0] * (len(text2) + 1)
    for a in text1:
        row = [0] * (len(text2) + 1)
        for j, b in enumerate(text2, 1):
            row[j] = prev[j - 1] + 1 if a == b else max(prev[j], row[j - 1])
        prev = row
    return prev[-1]
`,
  },
  "word-break": {
    entry: "word_break",
    starterCode: `def word_break(s, word_dict):
    """Whether s splits into words from word_dict (reuse allowed)."""
    # Your code here
    return False
`,
    solutionCode: `def word_break(s, word_dict):
    words = set(word_dict)
    longest = max((len(w) for w in word_dict), default=0)
    dp = [True] + [False] * len(s)
    for i in range(1, len(s) + 1):
        for j in range(max(0, i - longest), i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]
`,
  },
  "combination-sum-iv": {
    entry: "combination_sum4",
    starterCode: `def combination_sum4(nums, target):
    """Ordered sequences of nums (with repetition) summing to target."""
    # Your code here
    return 0
`,
    solutionCode: `def combination_sum4(nums, target):
    ways = [1] + [0] * target
    for t in range(1, target + 1):
        ways[t] = sum(ways[t - x] for x in nums if x <= t)
    return ways[target]
`,
  },
  "house-robber": {
    entry: "rob",
    starterCode: `def rob(nums):
    # Your code here
    return 0
`,
    solutionCode: `def rob(nums):
    with_prev = without_prev = 0
    for money in nums:
        with_prev, without_prev = without_prev + money, max(without_prev, with_prev)
    return max(with_prev, without_prev)
`,
  },
};
