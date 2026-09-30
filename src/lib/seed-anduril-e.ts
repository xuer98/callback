import type { Problem } from "./types";

// Anduril bank, part E: surveillance footage as interval covering — the
// fewest clips, which clips, and the uncovered gaps. Judged in JavaScript and
// Python; the Python judges live in seed-python.ts and seed-python-splits.ts.

export const andurilProblemsE: Problem[] = [
  {
    slug: "surveillance-footage",
    title: "Surveillance Footage",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary:
      "Interval greedy: extend coverage with the farthest-reaching clip that still connects.",
    prompt: `Cameras produced footage clips, each covering a time interval \`[start, end]\`. Return the **fewest clips** whose union covers the whole window \`[0, T]\`, or -1 when it's impossible.

\`\`\`
clips = [[0,2], [4,6], [8,10], [1,9], [1,5], [5,9]], T = 10
->  3   ([0,2] + [1,9] + [8,10])
\`\`\`

Clips arrive in any order and may overlap arbitrarily; touching clips such as \`[0, 2]\` and \`[2, 5]\` leave no hole.`,
    hints: [
      "Sort by start. Among every clip that starts at or before the point you've covered so far, only one matters: the one reaching farthest right.",
      "If no candidate reaches past your current coverage, you're stuck — that's the impossible case, detected mid-sweep rather than up front.",
    ],
    solution: `## Approach

Sort clips by start and grow a covered prefix \`[0, covered]\`. Each round, scan every clip starting at or before \`covered\` and take the farthest right end among them — choosing anything shorter can't beat it, and clips starting later would leave a hole. Each round adds one clip, so the count is minimal (a standard greedy exchange argument).

\`\`\`python
def min_clips(clips, T):
    clips = sorted(clips)
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
\`\`\`

## Complexity

O(n log n) for the sort; the sweep is linear. If the clips arrive already sorted, the whole thing is O(n).

## Worth saying out loud

- State the greedy invariant before coding: "everything in [0, covered] is covered by the clips chosen so far."
- Clips with a **cost** break the greedy — it becomes \`dp[t] = min cost to cover [0, t]\`, O(n·T). Needing **k-fold** coverage → sweep with a heap of active clip ends.
- Streaming clips: you can't commit until you've seen every clip starting ≤ \`covered\`, so buffer by start time.`,
    judge: {
      starterCode: `/**
 * Fewest clips whose union covers [0, T], or -1 when impossible.
 * @param {number[][]} clips - [start, end] pairs, in any order
 * @param {number} T
 * @returns {number}
 */
function minClips(clips, T) {
  // Your code here
  return -1;
}
`,
      entry: "minClips",
      tests: [
        { name: "Classic count", input: [[[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10], expected: 3 },
        { name: "A hole makes it impossible", input: [[[0, 3], [5, 9]], 10], expected: -1 },
        { name: "One clip covers everything", input: [[[0, 10]], 10], expected: 1 },
        {
          name: "Reach matters more than order",
          input: [[[0, 1], [1, 2], [0, 4], [4, 5], [2, 5], [5, 6]], 6],
          expected: 3,
        },
        { name: "Nothing starts at zero", input: [[[1, 10]], 10], expected: -1 },
      ],
    },
  },
  {
    slug: "surveillance-footage-clip-choice",
    title: "Surveillance Footage: Which Clips?",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "The farthest-reach greedy again, remembering which clip won each round.",
    prompt: `Cameras produced footage clips, each covering a time interval \`[start, end]\`. Return the clips themselves — a **smallest set** whose union covers the whole window \`[0, T]\` — or \`null\` when no set covers it. Any minimal set is accepted, in any order.

\`\`\`
clips = [[0,2], [4,6], [8,10], [1,9], [1,5], [5,9]], T = 10
->  [[0,2], [1,9], [8,10]]
\`\`\`

Clips arrive in any order and may overlap arbitrarily; touching clips such as \`[0, 2]\` and \`[2, 5]\` leave no hole.`,
    hints: [
      "Sort by start and grow a covered prefix. Among the clips that start at or before the covered point, pick the one reaching farthest — and keep a reference to it.",
      "When the best candidate doesn't reach past the covered point, no set works: return null.",
    ],
    solution: `## Approach

The same greedy as counting clips, keeping the winners. Sort by start; each round, among the clips starting at or before \`covered\`, remember the one with the farthest end, append it, and move \`covered\` to its end. A round whose best clip doesn't extend coverage means a hole, so return \`None\`.

\`\`\`python
def min_clips_with_choice(clips, T):
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
\`\`\`

## Complexity

O(n log n) for the sort, O(n) for the sweep, O(k) for the chosen clips.

## Worth saying out loud

- Several minimal sets can exist when clips tie in reach; any of them is correct, so say which one your tie-break returns.
- Reconstructing a choice is the same as counting plus bookkeeping — the proof of minimality doesn't change.`,
    judge: {
      starterCode: `/**
 * A smallest set of clips whose union covers [0, T], or null when none does.
 * @param {number[][]} clips - [start, end] pairs, in any order
 * @param {number} T
 * @returns {number[][] | null}
 */
function minClipsWithChoice(clips, T) {
  // Your code here
  return null;
}
`,
      entry: "__judgeChoice",
      // Many minimal clip sets exist, so the choice is validated: every clip
      // must come from the input, and the set must cover [0, T].
      driverCode: `function __judgeChoice(clips, T) {
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
          name: "Which clips",
          input: [[[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], 10],
          expected: { clips: 3, covers: true },
        },
        { name: "Which clips, when impossible", input: [[[0, 3], [5, 9]], 10], expected: "impossible" },
        { name: "One clip covers everything", input: [[[2, 4], [0, 10]], 10], expected: { clips: 1, covers: true } },
        {
          name: "Reach matters more than order",
          input: [[[0, 1], [1, 2], [0, 4], [4, 5], [2, 5], [5, 6]], 6],
          expected: { clips: 3, covers: true },
        },
      ],
    },
  },
  {
    slug: "surveillance-footage-gaps",
    title: "Surveillance Footage: Uncovered Gaps",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary: "Sweep sorted clips tracking the farthest end; a start past it opens a gap.",
    prompt: `Cameras produced footage clips, each covering a time interval \`[start, end]\`. Some of the window \`[0, T]\` may be unrecoverable. Return every sub-interval of \`[0, T]\` that **no clip covers**, as \`[start, end]\` pairs in order.

\`\`\`
clips = [[1, 2], [5, 7]], T = 10   ->  [[0, 1], [2, 5], [7, 10]]
clips = [[0, 4], [3, 10]], T = 10  ->  []
\`\`\`

Clips arrive in any order and may overlap arbitrarily; touching clips such as \`[0, 2]\` and \`[2, 5]\` leave no gap.`,
    hints: [
      "Sort by start and track the farthest end seen so far, starting from 0.",
      "Whenever a clip starts past that end, the space in between was never covered. Whatever is left after the last clip, up to T, is one more gap.",
    ],
    solution: `## Approach

Sort by start and sweep, tracking \`end\`, the farthest point covered so far (starting at 0). A clip that starts after \`end\` exposes the gap \`[end, start]\`; either way \`end\` becomes the max of itself and the clip's end. After the last clip, anything between \`end\` and \`T\` is a final gap.

\`\`\`python
def uncovered_gaps(clips, T):
    gaps, end = [], 0
    for s, e in sorted(clips):
        if s > end:
            gaps.append([end, s])
        end = max(end, e)
    if end < T:
        gaps.append([end, T])
    return gaps
\`\`\`

## Complexity

O(n log n) for the sort, O(n) for the sweep.

## Worth saying out loud

- This is merge-intervals read the other way: the gaps are the complement of the merged clips within \`[0, T]\`.
- The \`max\` matters — a long clip can swallow several later ones, and only the farthest end decides where the next gap starts.`,
    judge: {
      starterCode: `/**
 * Every [start, end] sub-interval of [0, T] that no clip covers, in order.
 * @param {number[][]} clips - [start, end] pairs, in any order
 * @param {number} T
 * @returns {number[][]}
 */
function uncoveredGaps(clips, T) {
  // Your code here
  return [];
}
`,
      entry: "uncoveredGaps",
      tests: [
        { name: "Gaps at both ends and the middle", input: [[[1, 2], [5, 7]], 10], expected: [[0, 1], [2, 5], [7, 10]] },
        { name: "No gaps", input: [[[0, 4], [3, 10]], 10], expected: [] },
        { name: "No footage at all", input: [[], 10], expected: [[0, 10]] },
        { name: "A long clip swallows later ones", input: [[[0, 8], [2, 3], [9, 10]], 10], expected: [[8, 9]] },
        { name: "Touching clips leave no gap", input: [[[5, 10], [0, 2], [2, 5]], 10], expected: [] },
      ],
    },
  },
];
