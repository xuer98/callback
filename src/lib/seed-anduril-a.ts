import type { Problem } from "./types";

// Anduril phone-screen bank, part A. Sourced from candidate reports
// (Exponent, interviewing.io, Blind, interviewdb, 1point3acres); prompts keep
// the reported wording's semantics and the screen's multi-phase style: the
// prompt is deliberately underspecified and grows, and clarifying questions
// are part of what's graded.

export const andurilProblemsA: Problem[] = [
  {
    slug: "team-photo-arrangement",
    title: "Team Photo Arrangement",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Sort both teams and pair i-th against i-th — gaps turn it into a greedy matching.",
    prompt: `You're photographing two teams arranged in two rows. Order them so that nobody in the front row blocks a taller player behind them: every back-row player must be **strictly taller** than the front-row player directly in front of them.

## Phase 1

Given the heights of two teams of equal size, can one team stand behind the other? Which team goes in front?

## Phase 2

The teams have **different sizes**. Rows have \`max(len)\` slots, so the smaller team's row has empty spaces — an empty slot blocks nobody and is blocked by nobody. Can a valid arrangement exist now?

## Phase 3

Return the actual rows (use \`None\` for an empty slot), or report that it's impossible.

\`\`\`
front = [170, 160], back = [180, 165]   ->  possible: 160/165, 170/180
front = [170],      back = [160, 180]   ->  possible: 170 faces 180, 160 unfaced
front = [180],      back = [160, 170]   ->  impossible: nobody is taller than 180
\`\`\`

## Worth asking out loud

Is equal height blocked (strict \`>\`)? Are rows exactly as long as the larger team? Do I return a boolean, the ordering, or the rows themselves? What do I return when it's impossible?`,
    hints: [
      "Sort both teams. If the i-th shortest back player clears the i-th shortest front player for every i, the arrangement works — and if any arrangement works, this paired one does (exchange argument: swapping two back players in a valid lineup keeps it valid).",
      "With unequal sizes only aligned pairs matter, so the smaller team must be injectively matched into the larger one. Greedy on sorted arrays: give each front player the smallest back player who still clears them (or each back player the tallest front player they still clear).",
    ],
    solution: `## Approach

Sort both teams. For equal sizes, pair i-th shortest against i-th shortest: if that pairing fails anywhere, no pairing works — in any valid arrangement you can swap back-row players into sorted order without creating a block, so the sorted pairing is the easiest one to satisfy. With unequal sizes and empty slots, only the aligned pairs constrain anything, so the smaller team needs an injective match into the larger: walk the smaller team in sorted order and greedily consume the smallest qualifying partner.

\`\`\`python
from typing import List, Optional, Tuple

# Phase 1 — equal sizes
def can_stand_behind(front: List[int], back: List[int]) -> bool:
    if len(front) != len(back):
        return False
    return all(b > f for f, b in zip(sorted(front), sorted(back)))

# Phase 1b — which team is in front?
def photo_order(team_a: List[int], team_b: List[int]) -> Optional[Tuple[str, str]]:
    if can_stand_behind(team_a, team_b):
        return ("A", "B")
    if can_stand_behind(team_b, team_a):
        return ("B", "A")
    return None                                    # impossible indicator

# Phase 2 — different sizes, empty slots allowed (rows have max(len) slots)
def can_arrange_with_gaps(front: List[int], back: List[int]) -> bool:
    front, back = sorted(front), sorted(back)
    if len(front) <= len(back):            # back fills every slot -> every front player is faced
        j = 0
        for f in front:                    # ascending: grab the SMALLEST back player > f
            while j < len(back) and back[j] <= f:
                j += 1
            if j == len(back):
                return False
            j += 1
        return True
    else:                                  # front fills every slot -> every back player is faced
        i = len(front) - 1
        for b in reversed(back):           # descending: grab the TALLEST front player < b
            while i >= 0 and front[i] >= b:
                i -= 1
            if i < 0:
                return False
            i -= 1
        return True

# Phase 3 — return the actual rows (None = empty slot)
def arrange_with_gaps(front: List[int], back: List[int]) -> Optional[Tuple[list, list]]:
    front_s, back_s = sorted(front), sorted(back)
    n = max(len(front_s), len(back_s))
    row_f, row_b = [None] * n, [None] * n
    if len(front_s) <= len(back_s):
        row_b = list(back_s)
        j = 0
        for f in front_s:
            while j < n and back_s[j] <= f:
                j += 1
            if j == n:
                return None
            row_f[j] = f
            j += 1
    else:
        row_f = list(front_s)
        i = n - 1
        for b in reversed(back_s):
            while i >= 0 and front_s[i] >= b:
                i -= 1
            if i < 0:
                return None
            row_b[i] = b
            i -= 1
    return row_f, row_b
\`\`\`

## Complexity

O(n log n + m log m) for the sorts; the matching sweeps are linear. O(n + m) space for the sorted copies and rows.

## Worth saying out loud

- The exchange argument is the whole proof — say it, don't hand-wave: any valid arrangement can be rearranged into the sorted pairing without breaking validity.
- "Ties allowed" is a one-character change (\`<=\` becomes \`<\` in the skip loops) — keep the comparison in one place so the follow-up is cheap.
- Three rows → run the pairwise check on adjacent rows.
- "Heights arrive as a stream" → you need them all before sorting; say so. Bounded integer heights → counting sort, O(n + range), which is also the answer to "millions of players".`,
    judge: {
      starterCode: `/** Phase 1: equal sizes — does every back player clear the front player ahead of them? */
function canStandBehind(front, back) {
  // Your code here
  return false;
}

/** Phase 1: ["A", "B"] if team A stands in front, ["B", "A"] if B does, null if neither works. */
function photoOrder(teamA, teamB) {
  return null;
}

/** Phase 2: different sizes, empty slots allowed (rows have max(len) slots). */
function canArrangeWithGaps(front, back) {
  return false;
}

/** Phase 3: [frontRow, backRow] with null for empty slots, or null when impossible. */
function arrangeWithGaps(front, back) {
  return null;
}
`,
      entry: "__judgeTeamPhoto",
      // arrangeWithGaps has many valid answers, so "rows" cases are validated:
      // both rows keep their team's heights, and every faced pair clears.
      driverCode: `function __judgeTeamPhoto(kind, front, back) {
  if (kind === "behind") return canStandBehind(front, back);
  if (kind === "order") return photoOrder(front, back);
  if (kind === "gaps") return canArrangeWithGaps(front, back);
  const rows = arrangeWithGaps(front, back);
  if (rows === null || rows === undefined) return "impossible";
  if (!Array.isArray(rows) || rows.length !== 2) return "not two rows";
  const [rowF, rowB] = rows;
  const n = Math.max(front.length, back.length);
  if (!Array.isArray(rowF) || !Array.isArray(rowB) || rowF.length !== n || rowB.length !== n) {
    return "wrong row length";
  }
  const heights = (row) => row.filter((h) => h !== null && h !== undefined).sort((a, b) => a - b).join(",");
  if (heights(rowF) !== [...front].sort((a, b) => a - b).join(",")) return "front row changed";
  if (heights(rowB) !== [...back].sort((a, b) => a - b).join(",")) return "back row changed";
  for (let i = 0; i < n; i++) {
    const f = rowF[i], b = rowB[i];
    if (f !== null && f !== undefined && b !== null && b !== undefined && !(b > f)) {
      return "blocked at slot " + i;
    }
  }
  return "valid";
}`,
      tests: [
        { name: "Equal sizes, valid", input: ["behind", [170, 160], [180, 165]], expected: true },
        { name: "Equal height blocks", input: ["behind", [170], [170]], expected: false },
        { name: "Different sizes fail the equal-size check", input: ["behind", [1], [2, 3]], expected: false },
        { name: "Team A in front", input: ["order", [1, 2], [3, 4]], expected: ["A", "B"] },
        { name: "Team B in front", input: ["order", [3, 4], [1, 2]], expected: ["B", "A"] },
        { name: "Neither order works", input: ["order", [1, 4], [2, 3]], expected: null },
        { name: "Smaller front team with gaps", input: ["gaps", [170], [160, 180]], expected: true },
        { name: "Nobody taller than the front player", input: ["gaps", [180], [160, 170]], expected: false },
        { name: "Larger front team", input: ["gaps", [150, 160, 170], [165]], expected: true },
        { name: "Rows for a smaller front team", input: ["rows", [170], [160, 180]], expected: "valid" },
        { name: "Rows for a larger front team", input: ["rows", [150, 160, 170], [165, 155]], expected: "valid" },
        { name: "Rows when it's impossible", input: ["rows", [180], [160, 170]], expected: "impossible" },
      ],
    },
  },
  {
    slug: "largest-sensor-distance",
    title: "Largest Sensor Distance",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "The largest nearest-tower gap **is** the minimum radius — sort one side, sweep the other.",
    prompt: `For any integer in \`array1\`, the closest integer in \`array2\` is its **sensor**, and the absolute difference between the two is its **sensor distance**. Return the **largest sensor distance**.

\`\`\`
array1 = [1, 5, 11], array2 = [4, 12]
distances: 1->4 is 3, 5->4 is 1, 11->12 is 1   ->  3
\`\`\`

## Phase 2 — Border Security

The same question in the field: border **crossings** sit at known positions along a line, and each **tower** covers every crossing within range \`r\` in either direction. Find the minimum range \`r\` so that every crossing is covered by at least one tower. (Convince yourself it's the same number.)

## Phase 3

The range is fixed at \`r\` — what's the **fewest towers** you'd need to cover every crossing, placing them anywhere?

## Worth asking out loud

Are the arrays sorted? Which side is huge? Can a crossing sit exactly on a tower (distance 0)? Empty arrays? Integer or float positions?`,
    hints: [
      "Sort the sensors once. For each target, its closest sensor is one of the two neighbors of its insertion point — \`bisect\` gives you both in O(log m).",
      "If both sides are sorted, you never need binary search: sweep a single tower pointer forward while the next tower is at least as close — it never moves backward across targets.",
      "Phase 3 is a classic greedy: place each tower as far right as it can be while still covering the leftmost uncovered crossing, then skip everything it covers.",
    ],
    solution: `## Approach

Sort the sensors; each target's nearest sensor is adjacent to its binary-search insertion point. The Border Security phrasing is the same computation viewed from the other side: the minimum radius that covers every crossing is exactly the largest nearest-tower distance — any smaller radius strands the crossing that produced the maximum.

\`\`\`python
import bisect, math
from typing import List

def nearest_gap(x: int, sorted_arr: List[int]) -> int:
    """distance from x to its closest element in sorted_arr"""
    i = bisect.bisect_left(sorted_arr, x)
    best = math.inf
    if i < len(sorted_arr):
        best = sorted_arr[i] - x
    if i > 0:
        best = min(best, x - sorted_arr[i - 1])
    return best

def largest_sensor_distance(targets: List[int], sensors: List[int]) -> int:
    if not targets or not sensors:
        return 0
    sensors = sorted(sensors)
    return max(nearest_gap(t, sensors) for t in targets)

min_tower_range = largest_sensor_distance          # Border Security is the same function

def min_tower_range_two_pointer(crossings: List[int], towers: List[int]) -> int:
    """no binary search: sort both, sweep towers forward while they get closer"""
    crossings, towers = sorted(crossings), sorted(towers)
    j, radius = 0, 0
    for c in crossings:
        while j + 1 < len(towers) and abs(towers[j + 1] - c) <= abs(towers[j] - c):
            j += 1
        radius = max(radius, abs(towers[j] - c))
    return radius

def min_towers_to_cover(crossings: List[int], r: int) -> int:
    """Phase 3: range is fixed at r — how many towers do we need? (greedy)"""
    crossings = sorted(crossings)
    count, i, n = 0, 0, len(crossings)
    while i < n:
        count += 1
        center = crossings[i] + r          # furthest-right tower that still covers crossings[i]
        while i < n and crossings[i] <= center + r:
            i += 1
    return count
\`\`\`

## Complexity

Bisect version: O(m log m + n log m) — sort the sensors once, then a log per target; the right shape when targets stream in. Two pointers: O(n log n + m log m) with a linear merge after sorting. Fixed-radius count: O(n log n).

## Worth saying out loud

- Name the reduction: "largest nearest-neighbor gap = minimum covering radius". That one sentence is the Border Security phase.
- Sort-and-sweep only works in 1-D. In 2-D, nearest neighbor becomes grid buckets or a k-d tree — say it before the interviewer asks.
- Towers with **different** ranges stop being a max-of-mins and become interval covering — see the surveillance-footage problem.
- The "binary-search the answer" variant ("is radius r enough?") is the fixed-radius sweep inside a search over r, O(n log range).`,
    judge: {
      starterCode: `/**
 * Largest distance from any target to its closest sensor.
 * Neither list is sorted. Return 0 when either list is empty.
 */
function largestSensorDistance(targets, sensors) {
  // Your code here
  return 0;
}

/** Phase 3: fewest towers of range r (covering [x - r, x + r]) that cover every crossing. */
function minTowersToCover(crossings, r) {
  return 0;
}
`,
      entry: "__judgeSensors",
      driverCode: `function __judgeSensors(kind, a, b) {
  return kind === "largest" ? largestSensorDistance(a, b) : minTowersToCover(a, b);
}`,
      tests: [
        { name: "Prompt example", input: ["largest", [1, 5, 11], [4, 12]], expected: 3 },
        { name: "One sensor in the middle", input: ["largest", [1, 2, 3], [2]], expected: 1 },
        { name: "Target exactly on a sensor", input: ["largest", [4], [4, 10]], expected: 0 },
        { name: "Unsorted inputs", input: ["largest", [11, 1, 5], [12, 4]], expected: 3 },
        { name: "No targets", input: ["largest", [], [1, 2]], expected: 0 },
        { name: "Negative positions", input: ["largest", [-10, 0, 10], [-3]], expected: 13 },
        { name: "Fixed range, two towers", input: ["count", [1, 2, 3, 10], 1], expected: 2 },
        { name: "Range zero means one tower per distinct crossing", input: ["count", [5, 5, 7], 0], expected: 2 },
        { name: "One tower covers everyone", input: ["count", [1, 4, 7], 3], expected: 1 },
      ],
    },
  },
  {
    slug: "surveillance-footage",
    title: "Surveillance Footage",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Interval greedy: extend coverage with the farthest-reaching clip that still connects.",
    prompt: `Cameras produced footage clips, each covering a time interval \`[start, end]\`. Pick the **fewest clips** whose union covers the whole window \`[0, T]\`, or report that it's impossible.

\`\`\`
clips = [[0,2], [4,6], [8,10], [1,9], [1,5], [5,9]], T = 10
->  3   ([0,2] + [1,9] + [8,10])
\`\`\`

## Phase 2

Return **which clips**, not just how many.

## Phase 3

Some of the window may be unrecoverable — return every sub-interval of \`[0, T]\` that **no clip covers at all**.

## Worth asking out loud

Inclusive or exclusive ends? Are the clips sorted? Can they overlap arbitrarily? Count or the actual clips? Is \`T\` guaranteed reachable?`,
    hints: [
      "Sort by start. Among every clip that starts at or before the point you've covered so far, only one matters: the one reaching farthest right.",
      "If no candidate reaches past your current coverage, you're stuck — that's the impossible case, detected mid-sweep rather than up front.",
      "The gaps phase is the mirror image: sweep sorted clips tracking the farthest end seen; every time a start jumps past it, the space between was never covered.",
    ],
    solution: `## Approach

Sort clips by start and grow a covered prefix \`[0, covered]\`. Each round, scan every clip starting at or before \`covered\` and take the farthest right end among them — choosing anything shorter can't beat it, and clips starting later would leave a hole. Each round adds one chosen clip, so the count is minimal (a standard greedy exchange argument).

\`\`\`python
from typing import List, Optional

def min_clips(clips: List[List[int]], T: int) -> int:
    clips.sort()
    count, covered, farthest, i = 0, 0, 0, 0
    while covered < T:
        while i < len(clips) and clips[i][0] <= covered:   # every clip that can extend coverage
            farthest = max(farthest, clips[i][1])
            i += 1
        if farthest <= covered:                             # nothing reaches past covered
            return -1
        covered = farthest
        count += 1
    return count

def min_clips_with_choice(clips: List[List[int]], T: int) -> Optional[List[List[int]]]:
    """Phase 2: which clips?"""
    clips = sorted(clips)
    chosen, covered, i = [], 0, 0
    while covered < T:
        best = None
        while i < len(clips) and clips[i][0] <= covered:
            if best is None or clips[i][1] > best[1]:
                best = clips[i]
            i += 1
        if best is None or best[1] <= covered:
            return None
        chosen.append(best)
        covered = best[1]
    return chosen

def uncovered_gaps(clips: List[List[int]], T: int) -> List[List[int]]:
    """Phase 3: which parts of [0, T] have NO footage?"""
    gaps, end = [], 0
    for s, e in sorted(clips):
        if s > end:
            gaps.append([end, s])
        end = max(end, e)
    if end < T:
        gaps.append([end, T])
    return gaps

def merge_intervals(intervals: List[List[int]]) -> List[List[int]]:
    """the toolkit move the other interval variants reduce to"""
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
\`\`\`

## Complexity

Everything is O(n log n) from the sort with O(1) extra (O(k) for the chosen list). If the clips arrive already sorted, the greedy is O(n) — say that; a reported candidate passed an interval variant with a plain linear sweep, no binary search.

## Worth saying out loud

- State the greedy invariant before coding: "everything in [0, covered] is covered by the clips chosen so far."
- Clips with a **cost** break the greedy — it becomes \`dp[t] = min cost to cover [0, t]\`, O(n·T). Needing **k-fold** coverage → sweep with a heap of active clip ends.
- Streaming clips: you can't commit until you've seen every clip starting ≤ \`covered\`, so buffer by start time — that's the honest "it's a live stream" answer.`,
    judge: {
      starterCode: `/** Fewest clips whose union covers [0, T], or -1 when impossible. */
function minClips(clips, T) {
  // Your code here
  return -1;
}

/** Phase 2: the chosen clips themselves (any minimal set), or null when impossible. */
function minClipsWithChoice(clips, T) {
  return null;
}

/** Phase 3: every [start, end] sub-interval of [0, T] that no clip covers, in order. */
function uncoveredGaps(clips, T) {
  return [];
}
`,
      entry: "__judgeFootage",
      // Many minimal clip sets exist, so "choice" is validated: every clip
      // must come from the input, and the set must cover [0, T].
      driverCode: `function __judgeFootage(kind, clips, T) {
  if (kind === "count") return minClips(clips, T);
  if (kind === "gaps") return uncoveredGaps(clips, T);
  const known = new Set(clips.map((c) => c.join(",")));
  const chosen = minClipsWithChoice(clips, T);
  if (chosen === null || chosen === undefined) return "impossible";
  if (!Array.isArray(chosen)) return "not a list";
  for (const c of chosen) {
    if (!Array.isArray(c) || c.length !== 2 || !known.has(c.join(","))) return "unknown clip";
  }
  let covered = 0;
  for (const [s, e] of [...chosen].sort((x, y) => x[0] - y[0])) {
    if (s <= covered) covered = Math.max(covered, e);
  }
  return { clips: chosen.length, covers: covered >= T };
}`,
      tests: [
        {
          name: "Classic count",
          input: ["count", [[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10],
          expected: 3,
        },
        { name: "A hole makes it impossible", input: ["count", [[0, 3], [5, 9]], 10], expected: -1 },
        { name: "One clip covers everything", input: ["count", [[0, 10]], 10], expected: 1 },
        {
          name: "Reach matters more than order",
          input: ["count", [[0, 1], [1, 2], [0, 4], [4, 5], [2, 5], [5, 6]], 6],
          expected: 3,
        },
        {
          name: "Which clips",
          input: ["choice", [[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10],
          expected: { clips: 3, covers: true },
        },
        { name: "Which clips, when impossible", input: ["choice", [[0, 3], [5, 9]], 10], expected: "impossible" },
        { name: "Gaps at both ends and the middle", input: ["gaps", [[1, 2], [5, 7]], 10], expected: [[0, 1], [2, 5], [7, 10]] },
        { name: "No gaps", input: ["gaps", [[0, 4], [3, 10]], 10], expected: [] },
      ],
    },
  },
];
