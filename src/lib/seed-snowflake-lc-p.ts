import type { Problem } from "./types";

// Snowflake coding bank, part P (custom prompts, continued): reaching a
// target with three moves, a drop-and-crush grid, and course scheduling with
// retries. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-l.ts.

export const snowflakeLcProblemsP: Problem[] = [
  {
    slug: "reach-target-with-three-moves",
    title: "Reach a Target With +2, Double and Halve",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Any sequence counts, so think constructively: +2 keeps parity, doubling then +2s then halving shifts it, and halving is how you get smaller.",
    prompt: [
      "Starting from a positive integer `a`, the moves are `+2`, `*2` (double) and `/2` (halve, allowed only on an even number). Return any sequence of moves that reaches `b`, as a list of the strings `\"+2\"`, `\"*2\"` and `\"/2\"`; an empty list when `a === b`. The grader replays your moves and checks the result; keep the sequence under 1000 moves.",
      "",
      "```",
      "reachTarget(3, 4)  ->  [\"*2\", \"+2\", \"/2\"]      // 3, 6, 8, 4",
      "reachTarget(7, 2)  ->  [\"*2\", \"+2\", \"/2\", \"/2\", \"/2\"]   // 7, 14, 16, 8, 4, 2",
      "```",
    ].join("\n"),
    hints: [
      "+2 only reaches numbers of the same parity. To go from a to a + 1, double, add 2, and halve: 2a → 2a + 2 → a + 1.",
      "To get smaller, reach a multiple of a power of two above the target and halve down. A breadth-first search over values up to about twice the larger number also finds a short path and is the easy correct answer.",
    ],
    solution: [
      "## Approach",
      "",
      "The interviewer wanted the simplest loop rather than a search, and the constructive rules are short: to move up by an even amount, repeat `+2`; to move up by one, double, add 2, halve; to move down, raise the value to a power-of-two multiple of the target with those two rules and halve repeatedly. A breadth-first search over the integers up to roughly twice the larger of the two numbers finds a shortest sequence with no case analysis, and is what the reference below does.",
      "",
      "## Complexity",
      "",
      "O(max(a, b)) for the search; the constructive sequence is O(max(a, b)) moves long in the worst case.",
      "",
      "## Worth saying out loud",
      "",
      "- Halving an odd number is the illegal move to guard against; say that the replay will reject it.",
      "- Bounding the search space (values up to 2 × max(a, b) + 2) is what makes the BFS terminate quickly; argue that a path exists inside that range.",
    ].join("\n"),
    judge: {
      solutionCode: `// BFS over values bounded by 2 * max(a, b) + 2, reconstructing the moves.
function reachTarget(a, b) {
  const limit = 2 * Math.max(a, b) + 2;
  const prev = new Map([[a, null]]);
  const queue = [a];
  let head = 0;
  while (head < queue.length && !prev.has(b)) {
    const x = queue[head++];
    const next = [[x + 2, "+2"], [x * 2, "*2"]];
    if (x % 2 === 0) next.push([x / 2, "/2"]);
    for (const [y, move] of next) {
      if (y >= 1 && y <= limit && !prev.has(y)) {
        prev.set(y, [x, move]);
        queue.push(y);
      }
    }
  }
  const moves = [];
  for (let cur = b; prev.get(cur) !== null; cur = prev.get(cur)[0]) moves.push(prev.get(cur)[1]);
  return moves.reverse();
}
`,
      starterCode: `/**
 * @param {number} a start, positive
 * @param {number} b target, positive
 * @returns {string[]} moves from "+2", "*2", "/2" that turn a into b
 */
function reachTarget(a, b) {
  // Your code here
  return [];
}
`,
      entry: "__judgeReach",
      driverCode: `function __judgeReach(a, b) {
  const moves = reachTarget(a, b);
  if (!Array.isArray(moves)) return "not a list";
  if (moves.length > 1000) return "too many moves";
  let x = a;
  for (const move of moves) {
    if (move === "+2") x += 2;
    else if (move === "*2") x *= 2;
    else if (move === "/2") {
      if (x % 2 !== 0) return "halved an odd number";
      x /= 2;
    } else return "unknown move " + move;
  }
  return x === b ? "valid" : "ended at " + x;
}`,
      tests: [
        { name: "Up by one", input: [3, 4], expected: "valid" },
        { name: "Down to an odd number", input: [5, 3], expected: "valid" },
        { name: "Down to an even number", input: [7, 2], expected: "valid" },
        { name: "Already there", input: [1, 1], expected: "valid" },
        { name: "Far up", input: [2, 100], expected: "valid" },
        { name: "Far down", input: [100, 1], expected: "valid" },
        { name: "Odd to odd, up", input: [9, 25], expected: "valid" },
      ],
    },
  },
  {
    slug: "grid-drop-and-remove",
    title: "Drop and Remove Runs in a Grid",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Mark every horizontal and vertical run of three or more, clear them all at once, let columns fall, and repeat until nothing is marked.",
    prompt: [
      "A grid holds positive integers, with `0` for an empty cell. Repeatedly: find every horizontal or vertical run of three or more equal non-zero cells and clear all of them at the same time; then let every column's cells drop down over the empty cells. Stop when a pass clears nothing, and return the grid.",
      "",
      "```",
      "crush([[1, 1, 1]])              ->  [[0, 0, 0]]",
      "crush([[1, 2, 3], [1, 4, 4],",
      "       [1, 2, 3], [2, 2, 2]])   ->  [[0, 0, 0], [0, 2, 3], [0, 4, 4], [0, 2, 3]]",
      "```",
    ].join("\n"),
    hints: [
      "Mark cells instead of clearing them immediately: a cell can belong to both a horizontal and a vertical run, and clearing one run before scanning the other would miss cells.",
      "Gravity per column is a write pointer from the bottom: copy non-zero cells downward, then fill the rest with zeros.",
    ],
    solution: [
      "## Approach",
      "",
      "Each pass has two phases. First scan every row and every column for runs of three or more equal non-zero values, marking the cells in a separate set (or by negating them) so that overlapping runs are both found. If nothing was marked, stop. Otherwise zero the marked cells, then for each column move the non-zero cells to the bottom in order and fill the top with zeros. Repeat, because the drop can create new runs.",
      "",
      "## Complexity",
      "",
      "O(passes × rows × cols) time; O(1) extra space with in-place marking.",
      "",
      "## Worth saying out loud",
      "",
      "- Marking by negation keeps the pass in place; a boolean grid is clearer under interview pressure.",
      "- The number of passes is bounded by the number of cells, since every productive pass clears at least three.",
    ].join("\n"),
    judge: {
      solutionCode: `function crush(board) {
  const rows = board.length;
  const cols = board[0].length;
  const grid = board.map((row) => row.slice());
  for (;;) {
    const marked = grid.map((row) => row.map(() => false));
    let any = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c + 2 < cols; c++) {
        const v = grid[r][c];
        if (v !== 0 && v === grid[r][c + 1] && v === grid[r][c + 2]) {
          marked[r][c] = marked[r][c + 1] = marked[r][c + 2] = true;
          any = true;
        }
      }
    }
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r + 2 < rows; r++) {
        const v = grid[r][c];
        if (v !== 0 && v === grid[r + 1][c] && v === grid[r + 2][c]) {
          marked[r][c] = marked[r + 1][c] = marked[r + 2][c] = true;
          any = true;
        }
      }
    }
    if (!any) return grid;
    for (let c = 0; c < cols; c++) {
      let write = rows - 1;
      for (let r = rows - 1; r >= 0; r--) {
        if (!marked[r][c] && grid[r][c] !== 0) grid[write--][c] = grid[r][c];
      }
      while (write >= 0) grid[write--][c] = 0;
    }
  }
}
`,
      starterCode: `/**
 * @param {number[][]} board positive integers, 0 for empty
 * @returns {number[][]} the stable board
 */
function crush(board) {
  // Your code here
  return board;
}
`,
      entry: "crush",
      tests: [
        { name: "One row", input: [[[1, 1, 1]]], expected: [[0, 0, 0]] },
        { name: "A column clears and the rest drop", input: [[[1, 2, 3], [1, 4, 4], [1, 2, 3], [2, 2, 2]]], expected: [[0, 0, 0], [0, 2, 3], [0, 4, 4], [0, 2, 3]] },
        { name: "Nothing to clear", input: [[[1, 1], [2, 2]]], expected: [[1, 1], [2, 2]] },
        { name: "Three vertical runs", input: [[[1, 2, 3], [1, 2, 3], [1, 2, 3]]], expected: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] },
        {
          name: "Chain reactions",
          input: [[[110, 5, 112, 113, 114], [210, 211, 5, 213, 214], [310, 311, 3, 313, 314], [410, 411, 412, 5, 414], [5, 1, 512, 3, 3], [610, 4, 1, 613, 614], [710, 1, 2, 713, 714], [810, 1, 2, 1, 1], [1, 1, 2, 2, 2], [4, 1, 4, 4, 1014]]],
          expected: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [110, 0, 0, 0, 114], [210, 0, 0, 0, 214], [310, 0, 0, 113, 314], [410, 0, 0, 213, 414], [610, 211, 112, 313, 614], [710, 311, 412, 613, 714], [810, 411, 512, 713, 1014]],
        },
      ],
    },
  },
  {
    slug: "course-schedule-with-retries",
    title: "Course Schedule With Retries",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Kahn's queue over course objects; a failed attempt goes to the back of the queue and its dependants stay locked until it passes.",
    prompt: [
      "Courses arrive as objects `{ id, prerequisites }`, and an external function `didFail(id)` reports whether an attempt at a course failed. Schedule attempts with a queue: start with every course that has no prerequisites, in input order; take the front course and attempt it; if it fails, push it to the back of the queue; if it passes, push (in input order) every course not yet queued or passed whose prerequisites have all passed. Return the list of attempted ids in order. Courses that can never become ready are simply never attempted.",
      "",
      "```",
      "courses = [{ id: \"A\", prerequisites: [] }, { id: \"B\", prerequisites: [\"A\"] }, { id: \"C\", prerequisites: [\"A\"] }]",
      "didFail fails \"A\" once  ->  [\"A\", \"A\", \"B\", \"C\"]",
      "```",
    ].join("\n"),
    hints: [
      "Keep three sets: queued, passed, and the queue itself. Only a pass can unlock dependants, so the unlock scan runs after a pass, over the courses in input order.",
      "Re-queueing a failed course at the back is the whole retry rule; no other state changes on a failure.",
    ],
    solution: [
      "## Approach",
      "",
      "Kahn's algorithm with course objects and a retry rule. Seed a FIFO queue with the prerequisite-free courses in input order and remember which ids are queued. Pop the front, record the attempt, and ask `didFail`. A failure pushes the course back; a pass marks it done and then walks the course list in input order pushing any course that is neither queued nor passed and whose prerequisites are all passed. The loop ends when the queue empties; unreachable courses (cycles or missing prerequisites) never enter it.",
      "",
      "## Complexity",
      "",
      "O(attempts + passes × n) with the simple rescan, which is fine for interview sizes; indegree counting makes the unlock O(dependants).",
      "",
      "## Worth saying out loud",
      "",
      "- The plain version without failures is [Course Order](/problems/course-order); the retry just re-enqueues.",
      "- A course that fails forever would loop; say what the real system would do (a retry limit, then mark it failed and report its dependants).",
    ].join("\n"),
    judge: {
      solutionCode: `function scheduleCourses(courses, didFail) {
  const passed = new Set();
  const queued = new Set();
  const queue = [];
  const attempts = [];
  for (const course of courses) {
    if (course.prerequisites.length === 0) {
      queue.push(course);
      queued.add(course.id);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const course = queue[head++];
    attempts.push(course.id);
    if (didFail(course.id)) {
      queue.push(course);
      continue;
    }
    passed.add(course.id);
    for (const candidate of courses) {
      if (queued.has(candidate.id) || passed.has(candidate.id)) continue;
      if (candidate.prerequisites.every((p) => passed.has(p))) {
        queue.push(candidate);
        queued.add(candidate.id);
      }
    }
  }
  return attempts;
}
`,
      starterCode: `/**
 * @param {{ id: string, prerequisites: string[] }[]} courses in input order
 * @param {(id: string) => boolean} didFail true when an attempt at id fails
 * @returns {string[]} the attempted ids, in order
 */
function scheduleCourses(courses, didFail) {
  // Your code here
  return [];
}
`,
      entry: "__judgeRetries",
      driverCode: `function __judgeRetries(courses, failures) {
  const remaining = new Map(Object.entries(failures));
  const didFail = (id) => {
    const n = remaining.get(String(id)) ?? 0;
    if (n > 0) {
      remaining.set(String(id), n - 1);
      return true;
    }
    return false;
  };
  return scheduleCourses(courses, didFail);
}`,
      tests: [
        {
          name: "Prompt example",
          input: [[{ id: "A", prerequisites: [] }, { id: "B", prerequisites: ["A"] }, { id: "C", prerequisites: ["A"] }], { A: 1 }],
          expected: ["A", "A", "B", "C"],
        },
        {
          name: "A dependant waits through two failures",
          input: [[{ id: "A", prerequisites: [] }, { id: "B", prerequisites: [] }, { id: "C", prerequisites: ["A", "B"] }], { B: 2 }],
          expected: ["A", "B", "B", "B", "C"],
        },
        {
          name: "No failures is plain topological order",
          input: [[{ id: "X", prerequisites: ["Y"] }, { id: "Y", prerequisites: [] }, { id: "Z", prerequisites: ["X", "Y"] }], {}],
          expected: ["Y", "X", "Z"],
        },
        {
          name: "A cycle is never attempted",
          input: [[{ id: "A", prerequisites: ["B"] }, { id: "B", prerequisites: ["A"] }, { id: "C", prerequisites: [] }], { C: 1 }],
          expected: ["C", "C"],
        },
        { name: "No courses", input: [[], {}], expected: [] },
      ],
    },
  },
];
