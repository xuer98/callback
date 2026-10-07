import type { Problem } from "./types";

// Snowflake coding bank, part G: three interval problems — meeting rooms, the
// most events attendable one per day, and weighted job scheduling. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-b.ts.

export const snowflakeProblemsG: Problem[] = [
  {
    slug: "minimum-meeting-rooms",
    title: "Minimum Meeting Rooms",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "The answer is the most meetings in progress at any instant: sort starts and ends and sweep.",
    prompt: [
      "Given meeting intervals `[start, end)`, return the fewest rooms needed so that no two meetings share a room while they overlap. A meeting may start exactly when another ends in the same room.",
      "",
      "```",
      "minMeetingRooms([[0, 30], [5, 10], [15, 20]])  ->  2",
      "minMeetingRooms([[7, 10], [2, 4]])              ->  1",
      "```",
    ].join("\n"),
    hints: [
      "Rooms needed equals the maximum number of meetings in progress at once. Sort the start times and the end times separately and walk both lists.",
      "At each start, if the earliest unfinished end is at or before it, that room frees up; otherwise open a room. Ends that equal a start free the room first.",
    ],
    solution: [
      "## Approach",
      "",
      "Two sorted arrays. Walk the starts in order with a pointer into the ends: when the earliest pending end is at or before the current start, a meeting has finished and its room is reused, so advance the end pointer; otherwise a new room opens. The number of rooms open at the end is the peak concurrency. A min-heap of end times is the same idea with a different container.",
      "",
      "## Complexity",
      "",
      "O(n log n) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Half-open intervals: a meeting ending at 10 and one starting at 10 share a room. State it before writing the comparison.",
      "- With buses that have to be at the right station, the pools become per-location: [Minimum Bus Fleet](/problems/minimum-bus-fleet).",
    ].join("\n"),
    judge: {
      solutionCode: `// Peak concurrency: sweep sorted starts against sorted ends.
function minMeetingRooms(intervals) {
  const starts = intervals.map((m) => m[0]).sort((a, b) => a - b);
  const ends = intervals.map((m) => m[1]).sort((a, b) => a - b);
  let rooms = 0;
  let freed = 0;                                 // index into ends
  for (const start of starts) {
    if (ends[freed] <= start) freed++;           // a room has come free
    else rooms++;
  }
  return rooms;
}
`,
      starterCode: `/**
 * @param {number[][]} intervals [start, end) meetings
 * @returns {number} the fewest rooms needed
 */
function minMeetingRooms(intervals) {
  // Your code here
  return 0;
}
`,
      entry: "minMeetingRooms",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [0, 30],
              [5, 10],
              [15, 20],
            ],
          ],
          expected: 2,
        },
        {
          name: "No overlap",
          input: [
            [
              [7, 10],
              [2, 4],
            ],
          ],
          expected: 1,
        },
        {
          name: "Touching meetings share a room",
          input: [
            [
              [1, 5],
              [5, 10],
            ],
          ],
          expected: 1,
        },
        {
          name: "All overlapping",
          input: [
            [
              [1, 5],
              [2, 6],
              [3, 7],
            ],
          ],
          expected: 3,
        },
        { name: "No meetings", input: [[]], expected: 0 },
        {
          name: "Rooms free up again",
          input: [
            [
              [1, 3],
              [2, 4],
              [3, 5],
              [4, 6],
            ],
          ],
          expected: 2,
        },
      ],
    },
  },
  {
    slug: "max-events-attended",
    title: "Maximum Events Attended",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Day by day, attend the open event that ends soonest.",
    prompt: [
      "Each event is `[startDay, endDay]`, inclusive, and you can attend an event on any day in its range. You can attend at most one event per day. Return the maximum number of events you can attend.",
      "",
      "```",
      "maxEvents([[1, 2], [2, 3], [3, 4]])          ->  3",
      "maxEvents([[1, 2], [2, 3], [3, 4], [1, 2]])  ->  4",
      "```",
    ].join("\n"),
    hints: [
      "Sweep the days. On each day, add every event that starts that day to a min-heap keyed by end day, drop the ones that already ended, and attend the one ending soonest.",
      "Greedy by earliest deadline is optimal: of all open events, the one ending soonest is the one most at risk of being lost.",
    ],
    solution: [
      "## Approach",
      "",
      "Sort events by start. For each day from the first start to the last end, push the events starting that day onto a min-heap of end days, pop any whose end is already past, and attend the top one if there is any. Earliest-deadline-first is the exchange argument: swapping the attended event for one that ends later never loses a future option. The sweep can jump straight to the next start when the heap is empty.",
      "",
      "## Complexity",
      "",
      "O((n + D) log n) for D distinct days, or O(n log n) with the jump; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Why not sort by end and take greedily: an event with a late end but an early start can still be attended early; the heap makes that choice day by day.",
      "- Weighted variants need DP instead: [Maximum Profit in Job Scheduling](/problems/job-scheduling-max-profit).",
    ].join("\n"),
    judge: {
      solutionCode: `// Earliest-deadline-first with a min-heap of end days.
function maxEvents(events) {
  const sorted = [...events].sort((a, b) => a[0] - b[0]);
  const heap = [];
  const push = (v) => {
    heap.push(v);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      for (let i = 0; ; ) {
        let m = i;
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && heap[c] < heap[m]) m = c;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  let attended = 0;
  let next = 0;
  let day = sorted.length > 0 ? sorted[0][0] : 0;
  while (next < sorted.length || heap.length > 0) {
    if (heap.length === 0) day = Math.max(day, sorted[next][0]);     // jump to the next start
    while (next < sorted.length && sorted[next][0] <= day) push(sorted[next++][1]);
    while (heap.length > 0 && heap[0] < day) pop();                   // already over
    if (heap.length > 0) {
      pop();
      attended++;
    }
    day++;
  }
  return attended;
}
`,
      starterCode: `/**
 * @param {number[][]} events [startDay, endDay], inclusive
 * @returns {number} the most events attendable at one per day
 */
function maxEvents(events) {
  // Your code here
  return 0;
}
`,
      entry: "maxEvents",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [1, 2],
              [2, 3],
              [3, 4],
            ],
          ],
          expected: 3,
        },
        {
          name: "Overlapping events on separate days",
          input: [
            [
              [1, 2],
              [2, 3],
              [3, 4],
              [1, 2],
            ],
          ],
          expected: 4,
        },
        {
          name: "A crowded week",
          input: [
            [
              [1, 4],
              [4, 4],
              [2, 2],
              [3, 4],
              [1, 1],
            ],
          ],
          expected: 4,
        },
        {
          name: "Two events on one day",
          input: [
            [
              [1, 1],
              [1, 1],
            ],
          ],
          expected: 1,
        },
        { name: "No events", input: [[]], expected: 0 },
        {
          name: "A gap between events",
          input: [
            [
              [1, 1],
              [100, 100],
            ],
          ],
          expected: 2,
        },
        {
          name: "Three events, two days",
          input: [
            [
              [1, 2],
              [1, 2],
              [1, 2],
            ],
          ],
          expected: 2,
        },
      ],
    },
  },
  {
    slug: "job-scheduling-max-profit",
    title: "Maximum Profit in Job Scheduling",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Sort by end time, binary-search the last compatible job, and take the better of skipping or taking.",
    prompt: [
      "Jobs are given as parallel arrays `startTime[i]`, `endTime[i]` and `profit[i]`. Choose jobs that do not overlap — a job may start exactly when another ends — to maximise total profit. Return that profit.",
      "",
      "```",
      "jobScheduling([1, 2, 3, 3], [3, 4, 5, 6], [50, 10, 40, 70])  ->  120     // jobs 1 and 4",
      "```",
    ].join("\n"),
    hints: [
      "Sort jobs by end time. dp[i] is the best profit using the first i jobs.",
      "For job i, binary-search the number of jobs ending at or before its start; dp[i] = max(dp[i − 1], profit_i + dp[that count]).",
    ],
    solution: [
      "## Approach",
      "",
      "Weighted interval scheduling. Sort by end time; for each job find, by binary search over the sorted end times, how many jobs finish by its start — the latest compatible predecessor. Then `dp[i] = max(dp[i-1], profit_i + dp[p(i)])`, and `dp[n]` is the answer. Greedy by profit or by end time alone both fail; the DP is what makes the choice exact.",
      "",
      "## Complexity",
      "",
      "O(n log n) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- With a cap on how many jobs may be taken, the table gains a dimension: [Most Credits With at Most K Classes](/problems/max-credits-with-k-classes).",
      "- Recovering the chosen jobs is a backtrack from dp[n]: where the take branch won, the job is in, and you jump to its predecessor.",
    ].join("\n"),
    judge: {
      solutionCode: `// Weighted interval scheduling: sort by end, binary-search the compatible predecessor.
function jobScheduling(startTime, endTime, profit) {
  const jobs = startTime.map((s, i) => [s, endTime[i], profit[i]]).sort((a, b) => a[1] - b[1]);
  const ends = jobs.map((j) => j[1]);
  const dp = new Array(jobs.length + 1).fill(0);
  for (let i = 1; i <= jobs.length; i++) {
    const [start, , value] = jobs[i - 1];
    let lo = 0;
    let hi = i - 1;
    while (lo < hi) {                            // jobs among the first i-1 that end by start
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= start) lo = mid + 1;
      else hi = mid;
    }
    dp[i] = Math.max(dp[i - 1], value + dp[lo]);
  }
  return dp[jobs.length];
}
`,
      starterCode: `/**
 * @param {number[]} startTime
 * @param {number[]} endTime
 * @param {number[]} profit
 * @returns {number} the maximum profit from non-overlapping jobs
 */
function jobScheduling(startTime, endTime, profit) {
  // Your code here
  return 0;
}
`,
      entry: "jobScheduling",
      tests: [
        {
          name: "Prompt example",
          input: [
            [1, 2, 3, 3],
            [3, 4, 5, 6],
            [50, 10, 40, 70],
          ],
          expected: 120,
        },
        {
          name: "Five jobs",
          input: [
            [1, 2, 3, 4, 6],
            [3, 5, 10, 6, 9],
            [20, 20, 100, 70, 60],
          ],
          expected: 150,
        },
        {
          name: "All overlapping",
          input: [
            [1, 1, 1],
            [2, 3, 4],
            [5, 6, 4],
          ],
          expected: 6,
        },
        {
          name: "Touching jobs are compatible",
          input: [
            [1, 3],
            [3, 5],
            [10, 10],
          ],
          expected: 20,
        },
        { name: "One job", input: [[4], [9], [7]], expected: 7 },
        {
          name: "A long job loses to two short ones",
          input: [
            [1, 1, 4],
            [8, 4, 8],
            [10, 6, 6],
          ],
          expected: 12,
        },
      ],
    },
  },
];
