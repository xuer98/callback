import type { Problem } from "./types";

// Anduril bank, part A: team photo arrangements (equal teams, uneven teams,
// and building the rows) and sensor coverage (the largest nearest-sensor
// distance, and the fewest towers of a fixed range). Judged in JavaScript and
// Python; the Python judges live in seed-python.ts and seed-python-splits.ts.

const photoSetup = `You're photographing two teams arranged in two rows. Every back-row player must be **strictly taller** than the front-row player directly in front of them.`;

const unevenRows = `The teams can have **different sizes**. Each row has \`max(len(front), len(back))\` slots, so the smaller team's row has empty slots — an empty slot blocks nobody and is blocked by nobody. You may order each row however you like.`;

export const andurilProblemsA: Problem[] = [
  {
    slug: "team-photo-arrangement",
    title: "Team Photo Arrangement",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary: "Sort both teams, pair i-th against i-th, and try both orders.",
    prompt: `${photoSetup}

Two teams of **equal size** each fill one row, and you may order each row however you like. Return which team goes in front: \`["A", "B"]\` when team A can stand in front of team B, \`["B", "A"]\` when team B can stand in front of team A, and \`null\` when neither works.

\`\`\`
teamA = [170, 160], teamB = [180, 165]   ->  ["A", "B"]   (160 before 165, 170 before 180)
teamA = [3, 4],     teamB = [1, 2]       ->  ["B", "A"]
teamA = [170],      teamB = [170]        ->  null         (equal height blocks)
\`\`\``,
    hints: [
      "Sort both teams. If the i-th shortest back player clears the i-th shortest front player for every i, the arrangement works — and if any arrangement works, this sorted pairing does.",
      "Check team A in front of team B, then the reverse. Both can't succeed at once.",
    ],
    solution: `## Approach

Sort both teams and pair the i-th shortest against the i-th shortest. If that pairing fails anywhere, no pairing works: in any valid arrangement you can swap back-row players into sorted order without creating a block, so the sorted pairing is the easiest one to satisfy. Run the check with A in front, then with B in front.

\`\`\`python
def can_stand_behind(front, back):
    if len(front) != len(back):
        return False
    return all(b > f for f, b in zip(sorted(front), sorted(back)))


def photo_order(team_a, team_b):
    if can_stand_behind(team_a, team_b):
        return ["A", "B"]
    if can_stand_behind(team_b, team_a):
        return ["B", "A"]
    return None
\`\`\`

## Complexity

O(n log n) for the sorts; the check is linear.

## Worth saying out loud

- The exchange argument is the whole proof — say it, don't hand-wave: any valid arrangement can be rearranged into the sorted pairing without breaking validity.
- "Ties allowed" is a one-character change (\`>\` becomes \`>=\`) — keep the comparison in one place.
- Three rows → run the pairwise check on adjacent rows.
- Bounded integer heights → counting sort, O(n + range), which is also the answer to "millions of players".`,
    judge: {
      starterCode: `/**
 * ["A", "B"] if team A can stand in front of team B, ["B", "A"] if team B
 * can stand in front of team A, null if neither works. Equal sizes.
 * @param {number[]} teamA
 * @param {number[]} teamB
 * @returns {[string, string] | null}
 */
function photoOrder(teamA, teamB) {
  // Your code here
  return null;
}
`,
      entry: "photoOrder",
      tests: [
        { name: "Team A in front", input: [[170, 160], [180, 165]], expected: ["A", "B"] },
        { name: "Equal height blocks", input: [[170], [170]], expected: null },
        { name: "Shorter team in front", input: [[1, 2], [3, 4]], expected: ["A", "B"] },
        { name: "Team B in front", input: [[3, 4], [1, 2]], expected: ["B", "A"] },
        { name: "Neither order works", input: [[1, 4], [2, 3]], expected: null },
        { name: "Sorting finds the pairing", input: [[5, 1, 3], [4, 6, 2]], expected: ["A", "B"] },
      ],
    },
  },
  {
    slug: "team-photo-uneven-teams",
    title: "Team Photo with Uneven Teams",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Only faced pairs matter: greedily match the smaller team into the larger.",
    prompt: `${photoSetup}

${unevenRows} Team \`front\` stands in the front row and team \`back\` in the back row. Return whether a valid arrangement exists.

\`\`\`
front = [170],           back = [160, 180]   ->  true    (170 faces 180; 160 has nobody in front)
front = [180],           back = [160, 170]   ->  false   (nobody is taller than 180)
front = [150, 160, 170], back = [165]        ->  true    (165 stands behind 150 or 160)
\`\`\``,
    hints: [
      "Only aligned pairs constrain anything, so the smaller team must be matched one-to-one into the larger one.",
      "Greedy on sorted arrays: give each front player the smallest back player who still clears them — or, when the front row is the full one, give each back player the tallest front player they still clear.",
    ],
    solution: `## Approach

With empty slots, only the faced pairs matter, so the question is whether the smaller team can be matched one-to-one into the larger one. Sort both. When the back row is at least as long, every front player must be faced: walk the front players from shortest up and give each the smallest back player who still clears them — taking a taller one could only rob a later, taller front player. When the front row is longer, mirror it: walk the back players from tallest down and give each the tallest front player they still clear.

\`\`\`python
def can_arrange_with_gaps(front, back):
    front, back = sorted(front), sorted(back)
    if len(front) <= len(back):
        j = 0
        for f in front:
            while j < len(back) and back[j] <= f:
                j += 1
            if j == len(back):
                return False
            j += 1
        return True
    i = len(front) - 1
    for b in reversed(back):
        while i >= 0 and front[i] >= b:
            i -= 1
        if i < 0:
            return False
        i -= 1
    return True
\`\`\`

## Complexity

O(n log n + m log m) for the sorts; each matching sweep is linear.

## Worth saying out loud

- Why greedy is safe: the smallest qualifying partner is never needed by an earlier (shorter) player, and anything taller is at least as useful later.
- Equal sizes are just the special case where every slot is filled; the same sweep answers it.`,
    judge: {
      starterCode: `/**
 * Rows have max(len(front), len(back)) slots; an empty slot blocks nobody.
 * Can every faced back-row player be strictly taller than the front-row
 * player ahead of them?
 * @param {number[]} front
 * @param {number[]} back
 * @returns {boolean}
 */
function canArrangeWithGaps(front, back) {
  // Your code here
  return false;
}
`,
      entry: "canArrangeWithGaps",
      tests: [
        { name: "Smaller front team with gaps", input: [[170], [160, 180]], expected: true },
        { name: "Nobody taller than the front player", input: [[180], [160, 170]], expected: false },
        { name: "Larger front team", input: [[150, 160, 170], [165]], expected: true },
        { name: "One short player, two tall ones", input: [[1], [2, 3]], expected: true },
        { name: "Equal sizes still work", input: [[170, 160], [180, 165]], expected: true },
        { name: "Equal sizes, blocked", input: [[170], [170]], expected: false },
        { name: "Larger front team, blocked", input: [[160, 170, 180], [150, 155]], expected: false },
      ],
    },
  },
  {
    slug: "team-photo-rows",
    title: "Team Photo: Build the Rows",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "The greedy match, written into two rows with empty slots.",
    prompt: `${photoSetup}

${unevenRows} Team \`front\` stands in the front row and team \`back\` in the back row.

Return the rows as \`[frontRow, backRow]\`, each with \`max(len(front), len(back))\` slots and \`null\` in an empty slot, or \`null\` when no valid arrangement exists. Any valid arrangement is accepted.

\`\`\`
front = [170],       back = [160, 180]   ->  [[null, 170], [160, 180]]
front = [170, 160],  back = [180, 165]   ->  [[160, 170], [165, 180]]
front = [180],       back = [160, 170]   ->  null
\`\`\``,
    hints: [
      "Sort both teams. The larger team fills its row in sorted order; the smaller team's players are then placed one by one in front of (or behind) partners from that row.",
      "When the back row is full, give each front player, shortest first, the leftmost unused back slot whose player clears them — that is where they stand. Mirror it when the front row is full.",
    ],
    solution: `## Approach

Sort both teams. The larger team fills its row in sorted order, and the smaller team is matched into it greedily: when the back row is full, walk the front players from shortest up and place each in front of the smallest unused back player who clears them; when the front row is full, walk the back players from tallest down and place each behind the tallest unused front player they clear. Unfilled slots stay \`None\`.

\`\`\`python
def arrange_with_gaps(front, back):
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
    return [row_f, row_b]
\`\`\`

## Complexity

O(n log n + m log m) for the sorts, then a linear sweep; O(n + m) for the rows.

## Worth saying out loud

- Build the answer the same way you would check it: the matching that proves feasibility is also the arrangement.
- Returning rows instead of a boolean is where off-by-one slots creep in; place by index into a row of \`None\`s rather than appending.`,
    judge: {
      starterCode: `/**
 * [frontRow, backRow], each with max(len(front), len(back)) slots and null
 * for an empty slot, or null when no valid arrangement exists.
 * @param {number[]} front
 * @param {number[]} back
 * @returns {[Array<number | null>, Array<number | null>] | null}
 */
function arrangeWithGaps(front, back) {
  // Your code here
  return null;
}
`,
      entry: "__judgeRows",
      // Many arrangements are valid, so the rows are checked, not compared:
      // both rows keep their team's heights, and every faced pair clears.
      driverCode: `function __judgeRows(front, back) {
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
        { name: "Rows for a smaller front team", input: [[170], [160, 180]], expected: "valid" },
        { name: "Rows for a larger front team", input: [[150, 160, 170], [165, 155]], expected: "valid" },
        { name: "Rows when it's impossible", input: [[180], [160, 170]], expected: "impossible" },
        { name: "Equal sizes", input: [[170, 160], [180, 165]], expected: "valid" },
        { name: "Equal sizes, blocked", input: [[170], [170]], expected: "impossible" },
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
      "The largest nearest-sensor gap — sort one side, binary search from the other.",
    prompt: `For any integer in \`array1\`, the closest integer in \`array2\` is its **sensor**, and the absolute difference between the two is its **sensor distance**. Return the **largest sensor distance**.

\`\`\`
array1 = [1, 5, 11], array2 = [4, 12]
distances: 1->4 is 3, 5->4 is 1, 11->12 is 1   ->  3
\`\`\`

Neither array is sorted, and positions may be negative. Return 0 when either array is empty.`,
    hints: [
      "Sort the sensors once. For each target, its closest sensor is one of the two neighbors of its insertion point — `bisect` gives you both in O(log m).",
      "If both sides are sorted, you never need binary search: sweep a single sensor pointer forward while the next sensor is at least as close — it never moves backward across targets.",
    ],
    solution: `## Approach

Sort the sensors; each target's nearest sensor is adjacent to its binary-search insertion point, so its sensor distance costs one \`bisect\`. The answer is the maximum over the targets.

\`\`\`python
import bisect, math


def nearest_gap(x, sorted_arr):
    """distance from x to its closest element in sorted_arr"""
    i = bisect.bisect_left(sorted_arr, x)
    best = math.inf
    if i < len(sorted_arr):
        best = sorted_arr[i] - x
    if i > 0:
        best = min(best, x - sorted_arr[i - 1])
    return best


def largest_sensor_distance(targets, sensors):
    if not targets or not sensors:
        return 0
    sensors = sorted(sensors)
    return max(nearest_gap(t, sensors) for t in targets)


def largest_sensor_distance_two_pointer(targets, sensors):
    """no binary search: sort both, sweep sensors forward while they get closer"""
    if not targets or not sensors:
        return 0
    targets, sensors = sorted(targets), sorted(sensors)
    j, radius = 0, 0
    for t in targets:
        while j + 1 < len(sensors) and abs(sensors[j + 1] - t) <= abs(sensors[j] - t):
            j += 1
        radius = max(radius, abs(sensors[j] - t))
    return radius
\`\`\`

## Complexity

Bisect version: O(m log m + n log m) — sort the sensors once, then a log per target; the right shape when targets stream in. Two pointers: O(n log n + m log m) with a linear merge after sorting.

## Worth saying out loud

- The same number answers a coverage question: if crossings sit at \`array1\` and towers at \`array2\`, the minimum range that lets every crossing see a tower is exactly the largest sensor distance — any smaller range strands the crossing that produced the maximum.
- Sort-and-sweep only works in 1-D. In 2-D, nearest neighbor becomes grid buckets or a k-d tree.
- Towers with **different** ranges stop being a max-of-mins and become interval covering.`,
    judge: {
      starterCode: `/**
 * Largest distance from any target to its closest sensor.
 * Neither list is sorted. Return 0 when either list is empty.
 * @param {number[]} targets
 * @param {number[]} sensors
 * @returns {number}
 */
function largestSensorDistance(targets, sensors) {
  // Your code here
  return 0;
}
`,
      entry: "largestSensorDistance",
      tests: [
        { name: "Prompt example", input: [[1, 5, 11], [4, 12]], expected: 3 },
        { name: "One sensor in the middle", input: [[1, 2, 3], [2]], expected: 1 },
        { name: "Target exactly on a sensor", input: [[4], [4, 10]], expected: 0 },
        { name: "Unsorted inputs", input: [[11, 1, 5], [12, 4]], expected: 3 },
        { name: "No targets", input: [[], [1, 2]], expected: 0 },
        { name: "Negative positions", input: [[-10, 0, 10], [-3]], expected: 13 },
      ],
    },
  },
  {
    slug: "fewest-towers-to-cover-crossings",
    title: "Fewest Towers to Cover Every Crossing",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "Greedy: place each tower as far right as the leftmost uncovered crossing allows.",
    prompt: `Border crossings sit at known integer positions along a line. A tower placed at any position \`x\` covers every crossing in \`[x − r, x + r]\`. Return the **fewest towers** that cover every crossing.

\`\`\`
crossings = [1, 2, 3, 10], r = 1   ->  2    (towers at 2 and 10)
crossings = [5, 5, 7],     r = 0   ->  2
crossings = [1, 4, 7],     r = 3   ->  1    (one tower at 4)
\`\`\`

The positions are unsorted and may repeat. No crossings need no towers.`,
    hints: [
      "Sort the crossings. The leftmost uncovered crossing has to be covered by some tower — and placing that tower as far right as possible can only help the crossings after it.",
      "So each tower goes at leftmost + r, and it covers everything up to leftmost + 2r. Skip past those and repeat.",
    ],
    solution: `## Approach

Sort the crossings. The leftmost uncovered crossing must be covered by some tower; among all positions that cover it, the rightmost one — \`crossing + r\` — covers a superset of what any other would cover to its right. So place a tower there, skip every crossing up to \`crossing + 2r\`, and repeat. That exchange argument makes the greedy count minimal.

\`\`\`python
def min_towers_to_cover(crossings, r):
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

O(n log n) for the sort; the sweep is linear.

## Worth saying out loud

- Name the pattern: interval point cover, solved by "place at the latest point that still covers the earliest unsatisfied demand".
- If towers could only stand at given sites, it becomes choosing sites: sort the sites too and pick, for the leftmost uncovered crossing, the farthest-right site within r of it.
- "Is range r enough for k towers?" is this count compared with k — binary-search r over that check to find the smallest range for a fixed budget.`,
    judge: {
      starterCode: `/**
 * Fewest towers of range r (a tower at x covers [x - r, x + r]) that cover
 * every crossing.
 * @param {number[]} crossings - unsorted, may repeat
 * @param {number} r
 * @returns {number}
 */
function minTowersToCover(crossings, r) {
  // Your code here
  return 0;
}
`,
      entry: "minTowersToCover",
      tests: [
        { name: "Fixed range, two towers", input: [[1, 2, 3, 10], 1], expected: 2 },
        { name: "Range zero means one tower per distinct crossing", input: [[5, 5, 7], 0], expected: 2 },
        { name: "One tower covers everyone", input: [[1, 4, 7], 3], expected: 1 },
        { name: "No crossings", input: [[], 2], expected: 0 },
        { name: "Unsorted input", input: [[10, 1, 3, 2], 1], expected: 2 },
        { name: "Edge of the range still counts", input: [[0, 4, 8, 12], 2], expected: 2 },
      ],
    },
  },
];
