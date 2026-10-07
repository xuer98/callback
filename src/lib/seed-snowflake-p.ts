import type { Problem } from "./types";

// Snowflake coding bank, part P: two scheduling problems — the most credits
// with a cap on the number of classes, and the smallest bus fleet. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-b.ts.

export const snowflakeProblemsP: Problem[] = [
  {
    slug: "max-credits-with-k-classes",
    title: "Most Credits With at Most K Classes",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Weighted interval scheduling with a count budget: sort by end, binary-search the compatible predecessor, add a dimension for the cap.",
    prompt: [
      "Each class is `[start, end, credits]`. Pick classes that do not overlap — a class may start exactly when another ends — and take **at most `k`** of them, so that the total credits are as large as possible. Return that total.",
      "",
      "```",
      "maxCredits([[0, 2, 3], [1, 3, 4], [2, 4, 5]], 1)  ->  5",
      "maxCredits([[0, 2, 3], [1, 3, 4], [2, 4, 5]], 2)  ->  8      // [0, 2] and [2, 4]",
      "```",
    ].join("\n"),
    hints: [
      "Sort by end time. For each class, binary-search the last class that ends at or before its start — the latest compatible predecessor.",
      "dp[i][j] = best credits using the first i classes with at most j picks: skip class i, or take it and add dp[predecessor][j − 1].",
    ],
    solution: [
      "## Approach",
      "",
      "Weighted interval scheduling with a budget. Sort by end time and, for each class, binary-search `p(i)`, the number of classes that end no later than its start. Then `dp[i][j] = max(dp[i-1][j], credits_i + dp[p(i)][j-1])` over `i` classes and `j ≤ k` picks; `dp[n][k]` is the answer. Without the cap the second dimension disappears and the recurrence is the classic one.",
      "",
      "## Complexity",
      "",
      "O(n log n + n · k) time; O(n · k) space, or O(n) with a rolling row if only the total is needed.",
      "",
      "## Worth saying out loud",
      "",
      "- Say whether touching intervals overlap before sorting; this version lets a class start when another ends.",
      "- The uncapped version is [Maximum Profit in Job Scheduling](/problems/job-scheduling-max-profit); counting how many events fit at one per day is [Maximum Events Attended](/problems/max-events-attended).",
      "- Recovering the chosen classes is a backtrack through the table, so keep it when the list is wanted.",
    ].join("\n"),
    judge: {
      solutionCode: `// Weighted interval scheduling with a cap on the number of picks.
function maxCredits(classes, k) {
  const sorted = [...classes].sort((a, b) => a[1] - b[1]);
  const n = sorted.length;
  const ends = sorted.map((c) => c[1]);
  const predecessor = sorted.map(([start]) => {   // how many classes end at or before start
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= start) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  });
  const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const credits = sorted[i - 1][2];
    for (let j = 1; j <= k; j++) {
      dp[i][j] = Math.max(dp[i - 1][j], credits + dp[predecessor[i - 1]][j - 1]);
    }
  }
  return dp[n][k];
}
`,
      starterCode: `/**
 * @param {number[][]} classes [start, end, credits]; a class may start when another ends
 * @param {number} k at most this many classes
 * @returns {number} the most credits possible
 */
function maxCredits(classes, k) {
  // Your code here
  return 0;
}
`,
      entry: "maxCredits",
      tests: [
        {
          name: "One class",
          input: [
            [
              [0, 2, 3],
              [1, 3, 4],
              [2, 4, 5],
            ],
            1,
          ],
          expected: 5,
        },
        {
          name: "Two classes",
          input: [
            [
              [0, 2, 3],
              [1, 3, 4],
              [2, 4, 5],
            ],
            2,
          ],
          expected: 8,
        },
        {
          name: "A cap above what fits changes nothing",
          input: [
            [
              [0, 2, 3],
              [1, 3, 4],
              [2, 4, 5],
            ],
            3,
          ],
          expected: 8,
        },
        {
          name: "Touching classes do not overlap",
          input: [
            [
              [0, 1, 1],
              [1, 2, 1],
              [2, 3, 1],
            ],
            2,
          ],
          expected: 2,
        },
        { name: "k = 0", input: [[[0, 1, 5]], 0], expected: 0 },
        { name: "No classes", input: [[], 3], expected: 0 },
        {
          name: "One long class beats two short ones",
          input: [
            [
              [0, 10, 100],
              [0, 1, 1],
              [1, 2, 1],
            ],
            2,
          ],
          expected: 100,
        },
        {
          name: "The best pair is not the two biggest",
          input: [
            [
              [1, 4, 3],
              [2, 5, 4],
              [4, 6, 2],
              [6, 7, 5],
            ],
            2,
          ],
          expected: 9,
        },
        {
          name: "Three fit",
          input: [
            [
              [1, 4, 3],
              [2, 5, 4],
              [4, 6, 2],
              [6, 7, 5],
            ],
            3,
          ],
          expected: 10,
        },
      ],
    },
  },
  {
    slug: "minimum-bus-fleet",
    title: "Minimum Bus Fleet",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Meeting rooms with stations: a bus is reusable only where it arrived, so keep the idle buses per station.",
    prompt: [
      "Each trip is `[from, departure, to, arrival]`: a bus leaves station `from` at `departure` and reaches station `to` at `arrival`. After a trip the bus is at `to`, and it can take any trip that departs from that station at or after its arrival. Buses start wherever they are first needed.",
      "",
      "Return the fewest buses that can run every trip.",
      "",
      "```",
      'minBuses([["A", 1, "B", 2], ["B", 3, "C", 4]])  ->  1     // the same bus continues from B',
      'minBuses([["A", 1, "B", 5], ["B", 3, "C", 4]])  ->  2     // it arrives at B too late',
      "```",
    ].join("\n"),
    hints: [
      "Process trips in departure order. At a departure, any bus idle at that station that arrived at or before the departure time can take the trip; otherwise a new bus is needed.",
      "Idle buses at the same station are interchangeable, so keep a sorted list (or a heap) of arrival times per station and pop the earliest.",
    ],
    solution: [
      "## Approach",
      "",
      "Meeting Rooms II with a location. Sort trips by departure and sweep. For a trip from station `s` at time `t`, reuse an idle bus at `s` whose arrival is at or before `t` if one exists, else add a bus; afterwards the bus is idle at the destination from its arrival time. Reusing is always safe: two idle buses at the same station at the same moment are interchangeable, so taking one never blocks a better plan. One heap of arrival times per station makes each step logarithmic.",
      "",
      "## Complexity",
      "",
      "O(n log n) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Without stations this is [Minimum Meeting Rooms](/problems/minimum-meeting-rooms); the per-station pools are the whole difference.",
      "- Say the exchange argument out loud: an optimal plan that starts a new bus while an idle one waits at the same station can be rewritten to reuse it, so greedy reuse is optimal.",
      "- Decide whether an arrival exactly at the departure time counts; here it does.",
    ].join("\n"),
    judge: {
      solutionCode: `// Sweep by departure; idle buses are pooled per station as sorted arrival times.
function minBuses(trips) {
  const sorted = [...trips].sort((a, b) => a[1] - b[1]);
  const idle = new Map();                       // station -> sorted arrival times
  let buses = 0;
  for (const [from, departure, to, arrival] of sorted) {
    const waiting = idle.get(from) ?? [];
    if (waiting.length > 0 && waiting[0] <= departure) waiting.shift();   // reuse the earliest arrival
    else buses++;
    const pool = idle.get(to) ?? [];
    let at = pool.length;
    while (at > 0 && pool[at - 1] > arrival) at--;
    pool.splice(at, 0, arrival);
    idle.set(to, pool);
  }
  return buses;
}
`,
      starterCode: `/**
 * @param {Array<[string, number, string, number]>} trips [from, departure, to, arrival]
 * @returns {number} the fewest buses that can run every trip
 */
function minBuses(trips) {
  // Your code here
  return 0;
}
`,
      entry: "minBuses",
      tests: [
        {
          name: "The same bus continues",
          input: [
            [
              ["A", 1, "B", 2],
              ["B", 3, "C", 4],
            ],
          ],
          expected: 1,
        },
        {
          name: "It arrives too late",
          input: [
            [
              ["A", 1, "B", 5],
              ["B", 3, "C", 4],
            ],
          ],
          expected: 2,
        },
        {
          name: "Two identical trips",
          input: [
            [
              ["A", 1, "B", 2],
              ["A", 1, "B", 2],
            ],
          ],
          expected: 2,
        },
        {
          name: "Arriving exactly on time counts",
          input: [
            [
              ["A", 1, "B", 2],
              ["B", 2, "A", 3],
            ],
          ],
          expected: 1,
        },
        {
          name: "Two separate loops",
          input: [
            [
              ["A", 1, "B", 2],
              ["C", 1, "D", 2],
              ["B", 3, "C", 4],
              ["D", 3, "A", 4],
            ],
          ],
          expected: 2,
        },
        {
          name: "Two buses weave through three stations",
          input: [
            [
              ["A", 0, "B", 10],
              ["A", 5, "C", 15],
              ["B", 10, "C", 20],
              ["C", 15, "A", 25],
              ["C", 20, "A", 30],
              ["A", 25, "B", 35],
            ],
          ],
          expected: 2,
        },
        {
          name: "A bus is only useful where it is",
          input: [
            [
              ["A", 1, "B", 2],
              ["C", 5, "D", 6],
            ],
          ],
          expected: 2,
        },
        { name: "No trips", input: [[]], expected: 0 },
      ],
    },
  },
];
