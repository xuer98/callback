import type { Problem } from "./types";

// Snowflake coding bank, part B: two timing models for a course schedule —
// each course starts when its own prerequisites finish, or courses run in
// batches. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-a.ts. The third model and the tree-height problem
// are in seed-snowflake-o.ts.

export const COURSE_PARAMS = `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites [a, b] means b must be finished before a; acyclic
 * @param {number[]} time time[c] is how long course c takes
 * @returns {number}
 */`;

export const snowflakeProblemsB: Problem[] = [
  {
    slug: "course-finish-time",
    title: "Course Finish Time",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A course starts the moment its own prerequisites finish: finish[v] = time[v] + max over prerequisites.",
    prompt: [
      "There are `numCourses` courses, prerequisite pairs `[a, b]` meaning `b` must be finished before `a` starts, and `time[c]`, how long course `c` takes. Any number of courses can run at the same time, and a course starts as soon as **all of its own prerequisites** have finished.",
      "",
      "Return the earliest time by which every course is finished. The prerequisites contain no cycle.",
      "",
      "```",
      "earliestFinish(4, [[1, 0], [3, 2]], [1, 10, 10, 1])  ->  11",
      "```",
      "",
      "Course 0 (1) then course 1 (10) finish at 11; course 2 (10) then course 3 (1) also finish at 11.",
    ].join("\n"),
    hints: [
      "Process courses in topological order. When a course is taken, its finish time is its own duration plus the latest finish among its prerequisites.",
      "Kahn's queue gives the order for free: when a prerequisite finishes, push max(finish) forward into each course it unlocks, and enqueue the course once its in-degree reaches zero.",
    ],
    solution: [
      "## Approach",
      "",
      "Topological order with one relaxation: `finish[v] = time[v] + max(finish[p])` over the prerequisites `p` of `v`, and the answer is the largest finish. Kahn's algorithm carries the maximum forward — when `u` leaves the queue, every course it unlocks takes `max(finish[v], finish[u] + time[v])`, and is enqueued once its last prerequisite is done. It is the longest path in a DAG, measured in time.",
      "",
      "## Complexity",
      "",
      "O(V + E) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- State the timing model before coding; the same input gives 11 here and 20 in [Course Batches Time](/problems/course-batches-time), where a wave waits for its slowest course.",
      "- Tests to name: no courses (0), all independent (the longest single course), a chain (the sum), a course with two prerequisites of different lengths.",
      "- Cycles would make this undefined; the order check from [Course Order](/problems/course-order) detects them if the input is not trusted.",
    ].join("\n"),
    judge: {
      solutionCode: `// Longest path in a DAG by time: finish[v] = time[v] + max(finish of its prerequisites).
function earliestFinish(numCourses, prerequisites, time) {
  const unlocks = Array.from({ length: numCourses }, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    unlocks[prereq].push(course);
    indegree[course]++;
  }
  const finish = new Array(numCourses).fill(0);
  const queue = [];
  for (let c = 0; c < numCourses; c++) {
    if (indegree[c] === 0) {
      queue.push(c);
      finish[c] = time[c];
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of unlocks[u]) {
      finish[v] = Math.max(finish[v], finish[u] + time[v]);
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  if (queue.length !== numCourses) throw new Error("the prerequisites form a cycle");
  return Math.max(0, ...finish);
}
`,
      starterCode: `${COURSE_PARAMS}
function earliestFinish(numCourses, prerequisites, time) {
  // Your code here
  return 0;
}
`,
      entry: "earliestFinish",
      tests: [
        {
          name: "Prompt example",
          input: [
            4,
            [
              [1, 0],
              [3, 2],
            ],
            [1, 10, 10, 1],
          ],
          expected: 11,
        },
        {
          name: "A chain adds up",
          input: [
            3,
            [
              [1, 0],
              [2, 1],
            ],
            [2, 3, 4],
          ],
          expected: 9,
        },
        {
          name: "A diamond waits for its slower side",
          input: [
            4,
            [
              [1, 0],
              [2, 0],
              [3, 1],
              [3, 2],
            ],
            [1, 2, 3, 4],
          ],
          expected: 8,
        },
        { name: "Independent courses run in parallel", input: [3, [], [3, 1, 2]], expected: 3 },
        {
          name: "Two prerequisites of different lengths",
          input: [
            3,
            [
              [2, 0],
              [2, 1],
            ],
            [5, 1, 1],
          ],
          expected: 6,
        },
        { name: "One course", input: [1, [], [5]], expected: 5 },
        { name: "No courses", input: [0, [], []], expected: 0 },
      ],
    },
  },
  {
    slug: "course-batches-time",
    title: "Course Batches Time",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Courses run in waves, and a wave takes as long as its slowest course.",
    prompt: [
      "There are `numCourses` courses, prerequisite pairs `[a, b]` meaning `b` must be finished before `a`, and `time[c]`, how long course `c` takes. Courses run in **batches**: the first batch is every course with no prerequisite; the next batch starts only when the whole current batch has finished, and holds every course whose prerequisites are now all done.",
      "",
      "Return the total time until the last batch finishes. The prerequisites contain no cycle.",
      "",
      "```",
      "batchesTime(4, [[1, 0], [3, 2]], [1, 10, 10, 1])  ->  20",
      "```",
      "",
      "Batch one is courses 0 and 2 and takes 10; batch two is courses 1 and 3 and takes 10.",
    ].join("\n"),
    hints: [
      "Run Kahn's algorithm level by level instead of with one queue: the current level is the batch, and the next level is everything whose in-degree hits zero while processing it.",
      "Add the maximum duration of each level to the total.",
    ],
    solution: [
      "## Approach",
      "",
      "Level-order Kahn's algorithm. The first level is every course with in-degree zero. Processing a level decrements the in-degree of each course it unlocks, and the ones that reach zero form the next level. Each level contributes its slowest course to the total, since the barrier waits for the whole batch.",
      "",
      "## Complexity",
      "",
      "O(V + E) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Name the model: this is the barrier version; [Course Finish Time](/problems/course-finish-time) lets each course start the moment its own prerequisites finish and gives 11 on the same example.",
      "- A single slow course in an early batch delays everything behind it — that is the cost of barriers, and the reason the other model exists.",
    ].join("\n"),
    judge: {
      solutionCode: `// Kahn's algorithm by levels: each level is a batch and costs its slowest course.
function batchesTime(numCourses, prerequisites, time) {
  const unlocks = Array.from({ length: numCourses }, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    unlocks[prereq].push(course);
    indegree[course]++;
  }
  let level = [];
  for (let c = 0; c < numCourses; c++) if (indegree[c] === 0) level.push(c);
  let total = 0;
  let seen = 0;
  while (level.length > 0) {
    total += Math.max(...level.map((c) => time[c]));
    seen += level.length;
    const next = [];
    for (const u of level) {
      for (const v of unlocks[u]) if (--indegree[v] === 0) next.push(v);
    }
    level = next;
  }
  if (seen !== numCourses) throw new Error("the prerequisites form a cycle");
  return total;
}
`,
      starterCode: `${COURSE_PARAMS}
function batchesTime(numCourses, prerequisites, time) {
  // Your code here
  return 0;
}
`,
      entry: "batchesTime",
      tests: [
        {
          name: "Prompt example",
          input: [
            4,
            [
              [1, 0],
              [3, 2],
            ],
            [1, 10, 10, 1],
          ],
          expected: 20,
        },
        {
          name: "A chain adds up",
          input: [
            3,
            [
              [1, 0],
              [2, 1],
            ],
            [2, 3, 4],
          ],
          expected: 9,
        },
        {
          name: "A diamond",
          input: [
            4,
            [
              [1, 0],
              [2, 0],
              [3, 1],
              [3, 2],
            ],
            [1, 2, 3, 4],
          ],
          expected: 8,
        },
        { name: "One batch", input: [3, [], [3, 1, 2]], expected: 3 },
        {
          name: "Two prerequisites, one batch each",
          input: [
            3,
            [
              [2, 0],
              [2, 1],
            ],
            [5, 1, 1],
          ],
          expected: 6,
        },
        {
          name: "A wide batch then a narrow one",
          input: [
            5,
            [
              [4, 0],
              [4, 1],
              [4, 2],
              [4, 3],
            ],
            [1, 2, 3, 4, 1],
          ],
          expected: 5,
        },
        { name: "No courses", input: [0, [], []], expected: 0 },
      ],
    },
  },
];
