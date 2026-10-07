import type { Problem } from "./types";
import { COURSE_PARAMS } from "./seed-snowflake-b";

// Snowflake coding bank, part O: the any-one-prerequisite timing model and
// the height of a tree after node deletions. Judged in JavaScript and
// Python; the Python judges live in seed-python-snowflake-a.ts.

export const snowflakeProblemsO: Problem[] = [
  {
    slug: "course-any-prerequisite-time",
    title: "Course Time With Any Prerequisite",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A course may start once any one prerequisite is done: swap the max for a min and relax in topological order.",
    prompt: [
      "There are `numCourses` courses, prerequisite pairs `[a, b]` meaning `b` is a prerequisite of `a`, and `time[c]`, how long course `c` takes. Under this rule a course may start as soon as **any one** of its prerequisites has finished — the others need not be done.",
      "",
      "Return the earliest time by which every course is finished. Any number of courses can run at once, and the prerequisites contain no cycle.",
      "",
      "```",
      "anyPrerequisiteTime(3, [[2, 0], [2, 1]], [5, 1, 1])  ->  5",
      "```",
      "",
      "Course 2 starts when course 1 finishes at 1 and is done at 2; the whole set waits for course 0.",
    ].join("\n"),
    hints: [
      "Same topological order as the all-prerequisites model, with the start time of a course being the minimum finish among its prerequisites instead of the maximum.",
      "A course's finish time is only final once every prerequisite has been processed — that is why the relaxation runs in topological order, even though only the minimum matters.",
    ],
    solution: [
      "## Approach",
      "",
      "Topological order again, with `start[v] = min(finish[p])` over the prerequisites and `finish[v] = start[v] + time[v]`. Kahn's queue carries the minimum forward: when `u` leaves the queue, each course it unlocks lowers its start to `finish[u]` if that is earlier, and is enqueued once all of its prerequisites have been seen — the minimum is only known then. Courses with no prerequisites start at 0.",
      "",
      "## Complexity",
      "",
      "O(V + E) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- The three models differ by one operator: max per course in [Course Finish Time](/problems/course-finish-time), max per batch in [Course Batches Time](/problems/course-batches-time), min per course here. Say which one the question means before writing it.",
      "- Processing in topological order still matters: a course's earliest-finishing prerequisite is only known after all of its prerequisites have been finished.",
    ].join("\n"),
    judge: {
      solutionCode: `// Topological relaxation with a minimum: a course starts at the earliest finish
// among its prerequisites.
function anyPrerequisiteTime(numCourses, prerequisites, time) {
  const unlocks = Array.from({ length: numCourses }, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    unlocks[prereq].push(course);
    indegree[course]++;
  }
  const start = new Array(numCourses).fill(Infinity);
  const finish = new Array(numCourses).fill(0);
  const queue = [];
  for (let c = 0; c < numCourses; c++) {
    if (indegree[c] === 0) {
      start[c] = 0;
      queue.push(c);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    finish[u] = start[u] + time[u];
    for (const v of unlocks[u]) {
      start[v] = Math.min(start[v], finish[u]);
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  if (queue.length !== numCourses) throw new Error("the prerequisites form a cycle");
  return Math.max(0, ...finish);
}
`,
      starterCode: `${COURSE_PARAMS}
function anyPrerequisiteTime(numCourses, prerequisites, time) {
  // Your code here
  return 0;
}
`,
      entry: "anyPrerequisiteTime",
      tests: [
        {
          name: "Prompt example",
          input: [
            3,
            [
              [2, 0],
              [2, 1],
            ],
            [5, 1, 1],
          ],
          expected: 5,
        },
        {
          name: "Single prerequisites behave as before",
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
          name: "A diamond takes the faster side",
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
          expected: 7,
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
        { name: "Independent courses", input: [3, [], [3, 1, 2]], expected: 3 },
        { name: "No courses", input: [0, [], []], expected: 0 },
      ],
    },
  },
  {
    slug: "height-after-deleting-nodes",
    title: "Tree Height After Deleting Nodes",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A deleted node hands its children to its nearest surviving ancestor, so it simply adds no level.",
    prompt: [
      "A rooted tree is given as `[parent, child]` edges plus its `root`. Some nodes are deleted: a deleted node's children are promoted to its nearest surviving ancestor, and its subtree is otherwise kept. The root is never deleted.",
      "",
      "Return the height of the tree afterwards, counted in **nodes** — a lone root has height 1.",
      "",
      "```",
      "edges = [[1, 2], [1, 3], [3, 4], [3, 5], [5, 6]], root = 1",
      "heightAfterDeletions(edges, 1, [3])  ->  3      // 1 -> 5 -> 6",
      "heightAfterDeletions(edges, 1, [])   ->  4      // 1 -> 3 -> 5 -> 6",
      "```",
    ].join("\n"),
    hints: [
      "Nothing needs rewiring. Walk the original tree carrying a depth, and have a deleted node pass its depth through unchanged while a surviving node adds one.",
      "One traversal, iterative or recursive; the answer is the largest depth seen at a surviving node.",
    ],
    solution: [
      "## Approach",
      "",
      'Promotion is a rewording of "a deleted node contributes no level": the surviving ancestor chain is the same either way. So traverse the original tree with the depth so far, add one at surviving nodes and nothing at deleted ones, and keep the maximum. No tree is rebuilt. The reference walks with an explicit stack to be safe on deep trees.',
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) space for the children map and stack.",
      "",
      "## Worth saying out loud",
      "",
      "- Ask whether height counts nodes or edges, and whether the root may be deleted — both change the answer by exactly the kind of off-by-one that costs a round.",
      "- The follow-up, choosing which nodes to delete so the height drops to a target, is [Fewest Deletions for a Height Limit](/problems/fewest-deletions-for-height).",
      "- Tests to name: a lone root, deleting a leaf (no change), deleting every non-root node (height 1), a long chain with its middle removed.",
    ].join("\n"),
    judge: {
      solutionCode: `// Traverse with a running depth: survivors add a level, deleted nodes pass it through.
function heightAfterDeletions(edges, root, deleted) {
  const children = new Map();
  for (const [parent, child] of edges) {
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(child);
  }
  const gone = new Set(deleted);
  let best = 0;
  const stack = [[root, 0]];
  while (stack.length > 0) {
    const [node, above] = stack.pop();
    const depth = above + (gone.has(node) ? 0 : 1);
    if (depth > best) best = depth;
    for (const child of children.get(node) ?? []) stack.push([child, depth]);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[][]} edges [parent, child] pairs of a rooted tree
 * @param {number} root
 * @param {number[]} deleted node ids to delete; never the root
 * @returns {number} height in nodes after the deletions
 */
function heightAfterDeletions(edges, root, deleted) {
  // Your code here
  return 0;
}
`,
      entry: "heightAfterDeletions",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            [3],
          ],
          expected: 3,
        },
        {
          name: "Nothing deleted",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            [],
          ],
          expected: 4,
        },
        {
          name: "Deleting a middle node",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            [5],
          ],
          expected: 3,
        },
        {
          name: "Two deletions on the long path",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            [3, 5],
          ],
          expected: 2,
        },
        {
          name: "Everything but the root",
          input: [
            [
              [1, 2],
              [1, 3],
              [3, 4],
              [3, 5],
              [5, 6],
            ],
            1,
            [2, 3, 4, 5, 6],
          ],
          expected: 1,
        },
        { name: "A lone root", input: [[], 7, []], expected: 1 },
        {
          name: "Deleting a leaf changes nothing",
          input: [
            [
              [1, 2],
              [1, 3],
            ],
            1,
            [2],
          ],
          expected: 2,
        },
        {
          name: "A chain with its middle removed",
          input: [
            [
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
            ],
            1,
            [2, 3, 4],
          ],
          expected: 2,
        },
      ],
    },
  },
];
