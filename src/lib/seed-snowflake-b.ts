import type { Problem } from "./types";

// Snowflake coding bank, part B: the batch timing model for a course
// schedule, where courses run in waves. Judged in JavaScript and Python; the
// Python judges live in seed-python-snowflake-a.ts. The any-prerequisite
// model and the tree-height problem are in seed-snowflake-o.ts.

export const COURSE_PARAMS = `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites [a, b] means b must be finished before a; acyclic
 * @param {number[]} time time[c] is how long course c takes
 * @returns {number}
 */`;

export const snowflakeProblemsB: Problem[] = [
  {
    slug: "course-batches-time",
    title: "Course Completion Time I",
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
      "- With every duration equal to 1 the total is the number of batches, which is Parallel Courses: the minimum number of semesters when any number of ready courses can be taken at once.",
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
