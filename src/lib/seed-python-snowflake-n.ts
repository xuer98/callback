import type { JudgeLanguage } from "./types";

// Python judges for Blind 75 part A (arrays), keyed by slug and merged into
// judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesN: Record<string, JudgeLanguage> = {
  "contains-duplicate": {
    entry: "contains_duplicate",
    starterCode: `def contains_duplicate(nums):
    # Your code here
    return False
`,
    solutionCode: `def contains_duplicate(nums):
    seen = set()
    for value in nums:
        if value in seen:
            return True
        seen.add(value)
    return False
`,
  },
  "maximum-subarray": {
    entry: "max_sub_array",
    starterCode: `def max_sub_array(nums):
    """nums is non-empty; the largest sum of a contiguous subarray."""
    # Your code here
    return 0
`,
    solutionCode: `def max_sub_array(nums):
    best = current = nums[0]
    for value in nums[1:]:
        current = max(value, current + value)
        best = max(best, current)
    return best
`,
  },
  "maximum-product-subarray": {
    entry: "max_product",
    starterCode: `def max_product(nums):
    """nums is non-empty; the largest product of a contiguous subarray."""
    # Your code here
    return 0
`,
    solutionCode: `def max_product(nums):
    best = high = low = nums[0]
    for value in nums[1:]:
        candidates = (value, value * high, value * low)
        high, low = max(candidates), min(candidates)
        best = max(best, high)
    return best
`,
  },
  "find-minimum-in-rotated-sorted-array": {
    entry: "find_min",
    starterCode: `def find_min(nums):
    """Sorted, distinct, then rotated; O(log n)."""
    # Your code here
    return 0
`,
    solutionCode: `def find_min(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]
`,
  },
  "search-in-rotated-sorted-array": {
    entry: "search",
    starterCode: `def search(nums, target):
    """Sorted, distinct, then rotated; the index of target or -1, in O(log n)."""
    # Your code here
    return -1
`,
    solutionCode: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        elif nums[mid] < target <= nums[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
  },
  "three-sum": {
    entry: "__judge_three_sum",
    starterCode: `def three_sum(nums):
    """Unique triplets summing to zero, in any order."""
    # Your code here
    return []
`,
    solutionCode: `def three_sum(nums):
    nums = sorted(nums)
    out = []
    for i in range(len(nums) - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        lo, hi = i + 1, len(nums) - 1
        while lo < hi:
            total = nums[i] + nums[lo] + nums[hi]
            if total < 0:
                lo += 1
            elif total > 0:
                hi -= 1
            else:
                out.append([nums[i], nums[lo], nums[hi]])
                while lo < hi and nums[lo] == nums[lo + 1]:
                    lo += 1
                while lo < hi and nums[hi] == nums[hi - 1]:
                    hi -= 1
                lo += 1
                hi -= 1
    return out
`,
    driverCode: `def __judge_three_sum(nums):
    triplets = sorted({tuple(sorted(t)) for t in three_sum(nums)})
    return [list(t) for t in triplets]
`,
  },
  "container-with-most-water": {
    entry: "max_area",
    starterCode: `def max_area(height):
    # Your code here
    return 0
`,
    solutionCode: `def max_area(height):
    lo, hi, best = 0, len(height) - 1, 0
    while lo < hi:
        best = max(best, (hi - lo) * min(height[lo], height[hi]))
        if height[lo] < height[hi]:
            lo += 1
        else:
            hi -= 1
    return best
`,
  },
};
