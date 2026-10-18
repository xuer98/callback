import type { Problem } from "./types";

// Snowflake coding bank, part W: the prerequisite route for one target
// course and batched first-index lookups in a sorted array. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-v.ts.

export const snowflakeProblemsW: Problem[] = [
  {
    slug: "prerequisite-route",
    title: "Prerequisite Route to a Target Course",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Collect the courses the target depends on, then order just those with a smallest-first topological sort; a cycle among them means no route.",
    prompt: [
      "Courses are numbered `0` to `numCourses - 1`. Each pair `[course, prerequisite]` means the prerequisite must be finished before the course. Pairs may repeat; a repeated pair is one edge.",
      "",
      "For one `target`, return an order containing **exactly** the target and every course it depends on, directly or indirectly, with every prerequisite before the courses that need it. Whenever several of those courses could come next, take the smallest number. Courses the target does not depend on are left out — including any cycles among them. If the courses the target needs contain a cycle, return `[]`.",
      "",
      "```",
      "prerequisiteRoute(7, [[4, 2], [4, 3], [2, 1], [6, 5]], 4)  ->  [1, 2, 3, 4]",
      "prerequisiteRoute(3, [], 2)                              ->  [2]",
      "```",
      "",
      "After `1`, both `2` and `3` are available; `2` is smaller, so it goes first. Courses `5` and `6` play no part.",
    ].join("\n"),
    hints: [
      "Two passes: first find the set of courses the target needs (a search from the target along prerequisite edges), then order only that set.",
      "Kahn's algorithm with a min-heap instead of a queue takes the smallest available course each time; count what came out to detect a cycle.",
    ],
    solution: [
      "## Approach",
      "",
      "Depth-first search from the target over prerequisite edges collects the required set, which is closed: every prerequisite of a required course is required. Restrict the graph to that set, count each required course's prerequisites (after deduplicating pairs), and run Kahn's algorithm with a min-heap so the smallest course whose prerequisites are all done always comes next. If the heap empties before every required course is placed, the required part has a cycle and the answer is `[]`.",
      "",
      "## Complexity",
      "",
      "O((V + E) log V) time for the heap, O(V + E) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Determinism is the point of the smallest-first rule: without it any topological order would do, and two correct solutions could disagree.",
      "- A cycle elsewhere in the graph must not poison the answer — only the required subgraph is checked.",
      "- Deduplicate pairs before counting in-degrees, or a repeated pair leaves a course waiting for a prerequisite that is only finished once.",
    ].join("\n"),
    judge: {
      solutionCode: `// DFS for the required set, then smallest-first Kahn's algorithm over just that set.
function prerequisiteRoute(numCourses, prerequisites, target) {
  const needs = Array.from({ length: numCourses }, () => []);
  const seenPair = new Set();
  for (const [course, prerequisite] of prerequisites) {
    const key = course * numCourses + prerequisite;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    needs[course].push(prerequisite);
  }
  const required = new Set([target]);
  const stack = [target];
  while (stack.length) {
    const course = stack.pop();
    for (const p of needs[course]) {
      if (!required.has(p)) {
        required.add(p);
        stack.push(p);
      }
    }
  }
  const pending = new Map();                 // required course -> prerequisites not yet done
  const unlocks = new Map();                 // prerequisite -> required courses waiting on it
  for (const course of required) {
    pending.set(course, needs[course].length);
    for (const p of needs[course]) {
      if (!unlocks.has(p)) unlocks.set(p, []);
      unlocks.get(p).push(course);
    }
  }
  const heap = [];
  const push = (x) => {
    heap.push(x);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = left + 1;
        if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
        if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top;
  };
  for (const [course, count] of pending) if (count === 0) push(course);
  const order = [];
  while (heap.length) {
    const course = pop();
    order.push(course);
    for (const next of unlocks.get(course) ?? []) {
      const left = pending.get(next) - 1;
      pending.set(next, left);
      if (left === 0) push(next);
    }
  }
  return order.length === required.size ? order : [];
}
`,
      starterCode: `/**
 * @param {number} numCourses courses 0..numCourses-1
 * @param {number[][]} prerequisites [course, prerequisite] pairs; duplicates possible
 * @param {number} target the course to plan for
 * @returns {number[]} the target and its prerequisites in a valid, smallest-first order, or []
 */
function prerequisiteRoute(numCourses, prerequisites, target) {
  // Your code here
  return [];
}
`,
      entry: "prerequisiteRoute",
      tests: [
        {
          name: "Prompt example",
          input: [
            7,
            [
              [4, 2],
              [4, 3],
              [2, 1],
              [6, 5],
            ],
            4,
          ],
          expected: [1, 2, 3, 4],
        },
        { name: "No prerequisites", input: [3, [], 2], expected: [2] },
        {
          name: "Smallest available first, even when it unlocks nothing",
          input: [
            6,
            [
              [3, 5],
              [3, 1],
              [5, 4],
            ],
            3,
          ],
          expected: [1, 4, 5, 3],
        },
        {
          name: "A cycle among the required courses",
          input: [
            3,
            [
              [2, 1],
              [1, 0],
              [0, 1],
            ],
            2,
          ],
          expected: [],
        },
        {
          name: "A cycle the target does not depend on is ignored",
          input: [
            4,
            [
              [3, 2],
              [0, 1],
              [1, 0],
            ],
            3,
          ],
          expected: [2, 3],
        },
        {
          name: "Duplicate pairs count once",
          input: [
            2,
            [
              [1, 0],
              [1, 0],
            ],
            1,
          ],
          expected: [0, 1],
        },
        {
          name: "A diamond of prerequisites",
          input: [
            4,
            [
              [0, 1],
              [0, 2],
              [1, 3],
              [2, 3],
            ],
            0,
          ],
          expected: [3, 1, 2, 0],
        },
        {
          name: "The target depends on itself through a chain",
          input: [
            2,
            [
              [0, 1],
              [1, 0],
            ],
            0,
          ],
          expected: [],
        },
      ],
    },
  },
  {
    slug: "repeated-lookups-sorted",
    title: "Repeated Lookups in a Sorted Array",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "Many queries against one sorted array: record each value's first index once and answer every query from that, never searching twice.",
    prompt: [
      "`values` is sorted in non-decreasing order and may contain duplicates. For each query in `queries`, return the index of the **first** occurrence of that value in `values`, or `-1` when it is absent, keeping the queries' order.",
      "",
      "Both lists can hold 200,000 entries and queries repeat, so do the work for each distinct value once. Do not modify either input.",
      "",
      "```",
      "locateAll([1, 2, 2, 2, 5], [2, 5, 3, 2])  ->  [1, 4, -1, 1]",
      "locateAll([], [1, 1])                     ->  [-1, -1]",
      "```",
    ].join("\n"),
    hints: [
      "Sorted means the first occurrence of each distinct value is where a run starts; one pass finds them all.",
      "A map from value to first index answers every query in O(1), repeats included; binary search is the fallback when the array is too large to pre-scan.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk `values` once and record the index of each value the first time it appears; because the array is sorted, that is the start of its run. Answer each query from the map, `-1` when the value is missing. Nothing is searched twice, and repeated queries cost the same as new ones.",
      "",
      "## Complexity",
      "",
      "O(n + q) time, O(distinct values) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The expected alternative is binary search for the leftmost position (lower bound) per query with a cache of answers — O(q log n) time and only O(distinct queries) extra space — which wins when the array is huge and the queries few.",
      "- Leftmost, not any match: a plain binary search that stops at the first hit returns a wrong index inside a run of duplicates.",
    ].join("\n"),
    judge: {
      solutionCode: `// One pass records where each run starts; queries are map lookups.
function locateAll(values, queries) {
  const first = new Map();
  for (let i = 0; i < values.length; i++) {
    if (!first.has(values[i])) first.set(values[i], i);
  }
  return queries.map((value) => first.get(value) ?? -1);
}
`,
      starterCode: `/**
 * @param {number[]} values sorted, non-decreasing, duplicates possible; do not modify
 * @param {number[]} queries values to look up, in order; do not modify
 * @returns {number[]} the first index of each query, or -1
 */
function locateAll(values, queries) {
  // Your code here
  return [];
}
`,
      entry: "locateAll",
      tests: [
        {
          name: "Prompt example",
          input: [
            [1, 2, 2, 2, 5],
            [2, 5, 3, 2],
          ],
          expected: [1, 4, -1, 1],
        },
        { name: "Both empty", input: [[], []], expected: [] },
        { name: "Nothing to find", input: [[], [1, 1]], expected: [-1, -1] },
        {
          name: "First index inside a run",
          input: [[7, 7, 7], [7]],
          expected: [0],
        },
        {
          name: "Negative values",
          input: [
            [-5, -5, 0, 3],
            [-5, 3, 0, -6],
          ],
          expected: [0, 3, 2, -1],
        },
        {
          name: "Queries in any order",
          input: [
            [1, 3, 5],
            [5, 1, 3, 4],
          ],
          expected: [2, 0, 1, -1],
        },
        {
          name: "A repeated miss",
          input: [
            [2, 4],
            [3, 3, 3],
          ],
          expected: [-1, -1, -1],
        },
      ],
    },
  },
];
