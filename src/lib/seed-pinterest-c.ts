import type { Problem } from "./types";

// Pinterest onsite bank, part C: interval sweeps and the sliding window —
// restaurant seating, two-column pin visibility, and subarray scores.

export const pinterestProblemsC: Problem[] = [
  {
    slug: "restaurant-free-intervals",
    title: "Restaurant Seating: Free Intervals",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "A +ppl/−ppl sweep; occupancy is constant between events.",
    prompt: `A restaurant is open from openT to closeT and has capacity seats. Existing reservations are (start, end, ppl) — half-open [start, end), and times may be fractional. Given a party size n, return **all maximal time intervals [a, b]** within opening hours during which the party could be seated: free seats >= n for the whole interval.

\`\`\`
open 9, close 22, capacity 5
reservations = [(10,14,3), (11,13,2), (13.5,15,1), (16,20,2)]
n = 2  =>  [[9,11], [13,13.5], [14,22]]
n = 3  =>  [[9,10], [14,22]]
n = 6  =>  []
\`\`\`

## Follow-ups

- The party also needs a slot at least duration long — filter the intervals.
- Book the party into the first feasible slot (now state mutates) — what structure keeps this fast?
- Many queries with different n — precompute the occupancy step function once, answer each query in O(#segments).
- Peak occupancy / max party size at time t — the classic Meeting Rooms II questions.`,
    hints: [
      "Turn each reservation into two events: +ppl at start, −ppl at end. Occupancy only changes at events, so it is constant on each segment between consecutive event times.",
      "Walk the timeline once: open a free interval when capacity − occupied >= n, close it when that stops holding, and merge adjacent qualifying segments.",
      "Half-open reservations mean a −ppl and a +ppl at the same instant must net before you judge that instant — process both before emitting.",
    ],
    solution: `## Approach

Sweep line. Each reservation contributes +ppl at its start and −ppl at its end; between consecutive event times the occupancy is a constant, so opening hours split into O(m) segments each with a fixed number of free seats. Walk the segments in order, opening a "free" interval when free seats >= n and extending it while that keeps holding — adjacent qualifying segments merge into one maximal interval. Clipping reservations to [openT, closeT) first keeps out-of-hours bookings from corrupting the sweep.

\`\`\`python
from collections import defaultdict


def free_intervals(open_t, close_t, capacity, reservations, n):
    delta = defaultdict(int)
    for s, e, ppl in reservations:
        s, e = max(s, open_t), min(e, close_t)
        if s < e:
            delta[s] += ppl
            delta[e] -= ppl

    times = [open_t] + sorted(t for t in delta if open_t < t < close_t)
    out = []
    occupied = 0
    for i, t in enumerate(times):
        occupied += delta.get(t, 0)
        seg_end = times[i + 1] if i + 1 < len(times) else close_t
        if capacity - occupied >= n:
            if out and out[-1][1] == t:
                out[-1][1] = seg_end
            else:
                out.append([t, seg_end])
    return out
\`\`\`

O(m log m) for the sort, O(m) for the walk. The half-open convention does the subtle work: a reservation ending at 14 and another starting at 14 never overlap, because the −ppl lands on the same event time as the +ppl and both are applied before the segment [14, …] is judged.`,
    judge: {
      starterCode: `/**
 * All maximal [a, b] within [openT, closeT] where free seats >= n.
 * Reservations are [start, end, ppl], half-open [start, end).
 * @param {number} openT
 * @param {number} closeT
 * @param {number} capacity
 * @param {Array<[number, number, number]>} reservations
 * @param {number} n
 * @returns {Array<[number, number]>}
 */
function freeIntervals(openT, closeT, capacity, reservations, n) {
  // Your code here
  return [];
}
`,
      entry: "freeIntervals",
      tests: [
        {
          name: "Party of 2 from the write-up",
          input: [9, 22, 5, [[10, 14, 3], [11, 13, 2], [13.5, 15, 1], [16, 20, 2]], 2],
          expected: [[9, 11], [13, 13.5], [14, 22]],
        },
        {
          name: "Party of 3 loses the midday gap",
          input: [9, 22, 5, [[10, 14, 3], [11, 13, 2], [13.5, 15, 1], [16, 20, 2]], 3],
          expected: [[9, 10], [14, 22]],
        },
        {
          name: "Party larger than capacity",
          input: [9, 22, 5, [[10, 14, 3], [11, 13, 2], [13.5, 15, 1], [16, 20, 2]], 6],
          expected: [],
        },
        {
          name: "Empty book means the whole day",
          input: [9, 22, 4, [], 4],
          expected: [[9, 22]],
        },
        {
          name: "Back-to-back reservations never overlap",
          input: [0, 10, 2, [[0, 5, 1], [5, 10, 1]], 1],
          expected: [[0, 10]],
        },
        {
          name: "Full house splits the day exactly",
          input: [0, 10, 2, [[3, 7, 2]], 1],
          expected: [[0, 3], [7, 10]],
        },
      ],
    },
  },
  {
    slug: "count-visible-pins",
    title: "Count Pins on a Two-Column Screen",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Only n scroll offsets matter — slide the window to a pin's top.",
    prompt: `The home feed is **two columns** of pins. Each pin is (top, bottom, column) with top < bottom and column "L" or "R"; pins in the same column never overlap. The screen shows a vertical window of length screenLen, scrolled to any offset. Return the **maximum number of pins fully visible at once**.

\`\`\`
pins = [(1,4,"L"), (2,3,"R"), (4,8,"R"), (6,9,"L")], screenLen = 5  =>  2
window [1,6] shows (1,4,L) and (2,3,R); window [4,9] shows (4,8,R) and (6,9,L)
\`\`\`

Up to 100,000 pins; coordinates up to 10^9 and possibly fractional; input unsorted.

## Follow-ups

- Return the scroll offset that achieves the maximum.
- K columns instead of two.
- Count pins with **any** overlap instead of full visibility — which technique replaces this one? (A +1/−1 sweep.)`,
    hints: [
      "An optimal window can always be slid down until its top edge touches some pin's top without losing a fully visible pin — so only the n pin tops matter as candidate offsets.",
      "Within one column, non-overlapping pins sorted by top are also sorted by bottom, so the fully visible ones for window [y, y + L] form one contiguous run.",
      "Binary search each column: first pin with top >= y, last pin with bottom <= y + L. The run length is the count.",
    ],
    solution: `## Approach

Two observations carry the whole problem. First, a best window can be slid down until its top edge sits exactly on some pin's top — sliding down never evicts a pin that was fully visible unless the window top passes a pin top — so only n candidate offsets need checking. Second, within a column the pins never overlap, so sorted by top they are also sorted by bottom, and the pins fully inside [y, y + L] form one contiguous run: binary search the first top >= y and the last bottom <= y + L.

\`\`\`python
from bisect import bisect_left, bisect_right
from collections import defaultdict


def max_visible_pins(pins, screen_len):
    by_col = defaultdict(list)
    for top, bottom, col in pins:
        by_col[col].append((top, bottom))
    tops, bottoms = {}, {}
    for col, ps in by_col.items():
        ps.sort()
        tops[col] = [p[0] for p in ps]
        bottoms[col] = [p[1] for p in ps]

    best = 0
    for top, _, _ in pins:
        y = top
        total = 0
        for col in by_col:
            lo = bisect_left(tops[col], y)
            hi = bisect_right(bottoms[col], y + screen_len)
            total += max(0, hi - lo)
        best = max(best, total)
    return best
\`\`\`

O(n log n) — n candidate offsets, two binary searches each. The hi − lo count is exactly the run because lo is the first pin starting inside the window and hi is one past the last pin ending inside it; the same-column non-overlap guarantee is what makes those two indexes bracket a single run.`,
    judge: {
      starterCode: `/**
 * Max pins fully visible in any window of length screenLen.
 * @param {Array<[number, number, string]>} pins - [top, bottom, "L"|"R"]
 * @param {number} screenLen
 * @returns {number}
 */
function maxVisiblePins(pins, screenLen) {
  // Your code here
  return 0;
}
`,
      entry: "maxVisiblePins",
      tests: [
        {
          name: "Feed from the write-up",
          input: [[[1, 4, "L"], [2, 3, "R"], [4, 8, "R"], [6, 9, "L"]], 5],
          expected: 2,
        },
        {
          name: "Everything fits one screen",
          input: [[[0, 2, "L"], [0, 3, "R"], [2, 4, "L"]], 10],
          expected: 3,
        },
        {
          name: "Pin taller than the screen",
          input: [[[0, 9, "L"]], 5],
          expected: 0,
        },
        {
          name: "Exact fit counts",
          input: [[[3, 8, "L"]], 5],
          expected: 1,
        },
        {
          name: "Best window is not at the first pin",
          input: [[[0, 4, "L"], [10, 11, "L"], [10.5, 11.5, "R"], [11.5, 12, "R"]], 2],
          expected: 3,
        },
        {
          name: "No pins",
          input: [[], 5],
          expected: 0,
        },
      ],
    },
  },
  {
    slug: "count-subarrays-score",
    title: "Count Subarrays with Score Below K",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Positives make sum × length monotone — a two-pointer window.",
    prompt: `Given an array nums of **positive** integers and an integer k, the score of a subarray is (sum of its elements) × (its length). Count the non-empty contiguous subarrays whose score is **strictly less than** k.

\`\`\`
nums = [2, 1, 4, 3, 5], k = 10  =>  6
    [2]=2, [1]=1, [4]=4, [3]=3, [5]=5, [2,1] = 3×2 = 6
    ([1,4] = 5×2 = 10 is not < 10)

nums = [1, 1, 1], k = 5  =>  5
    [1], [1], [1], [1,1], [1,1]   ([1,1,1] = 3×3 = 9)
\`\`\`

n up to 10^5, values up to 10^5, k up to 10^15 — target O(n).

## Follow-ups

- Why does a sliding window work here, and what breaks if nums can contain zeros or negatives?
- Reported from the same phone screen: LC 1235 Maximum Profit in Job Scheduling — sort by end time, DP with binary search over end times.`,
    hints: [
      "With positive values, fixing the right end and moving the left end rightward strictly shrinks both the sum and the length — so the score is monotone and valid left ends form a suffix.",
      "Keep a window [left, right] with score < k: for each right, shrink from the left while sum × length >= k, then every start in [left, right] works — add right − left + 1.",
      "Zeros break strict monotonicity and negatives break it entirely — that is the follow-up answer.",
    ],
    solution: `## Approach

The two-pointer argument, stated precisely: for a fixed right end r, moving the left end right strictly decreases both the sum and the length, so the score strictly decreases — valid left ends for r form a suffix [left, r]. And growing r never turns an invalid left end valid (every window only gets bigger), so left moves monotonically rightward across the whole scan. Each element enters and leaves the window once.

\`\`\`python
def count_subarrays(nums, k):
    count = 0
    window_sum = 0
    left = 0
    for right, value in enumerate(nums):
        window_sum += value
        while window_sum * (right - left + 1) >= k:
            window_sum -= nums[left]
            left += 1
        count += right - left + 1
    return count
\`\`\`

O(n) time, O(1) space. The while loop can never push left past right + 1 — a single positive element has score value × 1, and if even that is >= k the window empties and contributes zero. Zeros would make the shrink non-strict (score stuck), negatives would break the suffix structure outright; both invalidate the window and push you toward prefix sums with different machinery.`,
    judge: {
      starterCode: `/**
 * Count non-empty subarrays with (sum × length) strictly less than k.
 * @param {number[]} nums - positive integers
 * @param {number} k
 * @returns {number}
 */
function countSubarrays(nums, k) {
  // Your code here
  return 0;
}
`,
      entry: "countSubarrays",
      tests: [
        { name: "Example from the write-up", input: [[2, 1, 4, 3, 5], 10], expected: 6 },
        { name: "All ones", input: [[1, 1, 1], 5], expected: 5 },
        { name: "Nothing qualifies", input: [[5], 5], expected: 0 },
        { name: "Everything qualifies", input: [[1, 1], 100], expected: 3 },
        { name: "A big value splits the window", input: [[1, 9, 1, 1], 8], expected: 4 },
        { name: "Single small element", input: [[3], 4], expected: 1 },
      ],
    },
  },
];
