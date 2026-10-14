import type { JudgeLanguage } from "./types";

// Python judges for Blind 75 part G (strings and Grid Game), keyed by slug
// and merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesT: Record<string, JudgeLanguage> = {
  "longest-repeating-character-replacement": {
    entry: "character_replacement",
    starterCode: `def character_replacement(s, k):
    """Longest substring that at most k changes can make one repeated letter."""
    # Your code here
    return 0
`,
    solutionCode: `def character_replacement(s, k):
    counts, max_count, start, best = {}, 0, 0, 0
    for i, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        max_count = max(max_count, counts[ch])
        if i - start + 1 - max_count > k:
            counts[s[start]] -= 1
            start += 1
        best = max(best, i - start + 1)
    return best
`,
  },
  "valid-anagram": {
    entry: "is_anagram",
    starterCode: `def is_anagram(s, t):
    # Your code here
    return False
`,
    solutionCode: `from collections import Counter


def is_anagram(s, t):
    return len(s) == len(t) and Counter(s) == Counter(t)
`,
  },
  "valid-palindrome": {
    entry: "is_palindrome",
    starterCode: `def is_palindrome(s):
    """Palindrome after dropping non-alphanumerics, ignoring case."""
    # Your code here
    return False
`,
    solutionCode: `def is_palindrome(s):
    lo, hi = 0, len(s) - 1
    while lo < hi:
        while lo < hi and not s[lo].isalnum():
            lo += 1
        while lo < hi and not s[hi].isalnum():
            hi -= 1
        if s[lo].lower() != s[hi].lower():
            return False
        lo += 1
        hi -= 1
    return True
`,
  },
  "longest-palindromic-substring": {
    entry: "longest_palindrome",
    starterCode: `def longest_palindrome(s):
    # Your code here
    return ""
`,
    solutionCode: `def longest_palindrome(s):
    best = ""
    for i in range(len(s)):
        for lo, hi in ((i, i), (i, i + 1)):
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                lo -= 1
                hi += 1
            if hi - lo - 1 > len(best):
                best = s[lo + 1 : hi]
    return best
`,
  },
  "palindromic-substrings": {
    entry: "count_substrings",
    starterCode: `def count_substrings(s):
    """How many substrings are palindromes (positions count separately)."""
    # Your code here
    return 0
`,
    solutionCode: `def count_substrings(s):
    count = 0
    for centre in range(2 * len(s) - 1):
        lo = centre // 2
        hi = lo + centre % 2
        while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
            count += 1
            lo -= 1
            hi += 1
    return count
`,
  },
  "grid-game": {
    entry: "grid_game",
    starterCode: `def grid_game(grid):
    """Points robot 2 collects on the 2 x n grid under best play by both."""
    # Your code here
    return 0
`,
    solutionCode: `def grid_game(grid):
    top_suffix, bottom_prefix, best = sum(grid[0]), 0, float("inf")
    for i in range(len(grid[0])):
        top_suffix -= grid[0][i]
        best = min(best, max(top_suffix, bottom_prefix))
        bottom_prefix += grid[1][i]
    return best
`,
  },
};
