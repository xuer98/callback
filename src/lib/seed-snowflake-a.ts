import type { Problem } from "./types";

// Snowflake coding bank, part A: the nearest-bathroom grid, its one-line
// cousins, and a topological order. Judged in JavaScript and Python; the
// Python judges live in seed-python-snowflake-a.ts.

export const snowflakeProblemsA: Problem[] = [
  {
    slug: "nearest-bathroom-distances",
    title: "Nearest Bathroom for Every Desk",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Seed the queue with every bathroom and expand once — one BFS for the whole floor, not one per desk.",
    prompt: [
      "An office floor is a grid of characters: `B` is a bathroom, `D` a desk, `_` open floor and `#` a wall. From any cell you can step up, down, left or right into any cell that is not a wall; desks and bathrooms are walkable.",
      "",
      "Return a grid of the same shape holding, for every desk, the number of steps to its nearest bathroom, or `-1` if no bathroom is reachable. Every cell that is not a desk is `-1`.",
      "",
      "```",
      'desksToBathrooms(["B_D",',
      '                  "_#_",',
      '                  "D_B"])',
      "  ->  [[-1, -1, 2],",
      "       [-1, -1, -1],",
      "       [ 2, -1, -1]]",
      "```",
    ].join("\n"),
    hints: [
      "Start the BFS from every bathroom at once, all at distance 0. The first time the wave reaches a cell is its shortest distance, so each cell is labelled once.",
      "Use the distance grid itself as the visited set (-1 means unvisited) and skip walls; at the end, blank out every cell that is not a desk.",
    ],
    solution: [
      "## Approach",
      "",
      "One BFS per desk is O(D · R · C) and is the version to talk your way out of. Put every bathroom in the queue at distance 0 and expand once: the wave reaches each cell first along a shortest path from the nearest source, so a single O(R · C) pass labels the whole floor. The distance grid doubles as the visited set, and walls are simply never entered. The last step keeps the distance only where the grid has a desk.",
      "",
      "## Complexity",
      "",
      "O(R · C) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Ask before coding: are there walls, can a floor have no bathroom, and is the answer per desk or a single number. Each changes the output, not the algorithm.",
      "- O(1) extra space: write distances into the input grid in place (the grid is the visited set); the queue is the only extra memory, and it is bounded by the frontier.",
      "- A streaming version — bathrooms added one at a time — re-runs the BFS from the new source only, lowering distances where it wins.",
    ].join("\n"),
    judge: {
      solutionCode: `// Multi-source BFS: every bathroom starts in the queue at distance 0, so one
// pass labels the whole floor. A BFS per desk would be O(D x R x C).
function desksToBathrooms(grid) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  const queue = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "B") {
        dist[r][c] = 0;
        queue.push([r, c]);
      }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === "#" || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;
      queue.push([nr, nc]);
    }
  }
  return dist.map((row, r) => row.map((d, c) => (grid[r][c] === "D" ? d : -1)));
}
`,
      starterCode: `/**
 * @param {string[]} grid rows of B (bathroom), D (desk), _ (floor) and # (wall)
 * @returns {number[][]} each desk's steps to the nearest bathroom, or -1; every other cell -1
 */
function desksToBathrooms(grid) {
  // Your code here
  return [];
}
`,
      entry: "desksToBathrooms",
      tests: [
        {
          name: "Prompt example",
          input: [["B_D", "_#_", "D_B"]],
          expected: [
            [-1, -1, 2],
            [-1, -1, -1],
            [2, -1, -1],
          ],
        },
        { name: "The nearer of two bathrooms wins", input: [["B__D___B"]], expected: [[-1, -1, -1, 3, -1, -1, -1, -1]] },
        {
          name: "A wall forces a detour",
          input: [["B#D", "___"]],
          expected: [
            [-1, -1, 4],
            [-1, -1, -1],
          ],
        },
        { name: "A walled-off desk is -1", input: [["B#D"]], expected: [[-1, -1, -1]] },
        { name: "No bathroom at all", input: [["D_D"]], expected: [[-1, -1, -1]] },
        { name: "Desks are walkable", input: [["BDD"]], expected: [[-1, 1, 2]] },
        { name: "Empty floor", input: [[]], expected: [] },
        {
          name: "A bigger floor",
          input: [["B____", "_###_", "_#D#_", "_#_#_", "____B"]],
          expected: [
            [-1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1],
            [-1, -1, 4, -1, -1],
            [-1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1],
          ],
        },
      ],
    },
  },
  {
    slug: "closest-person-cake-distance",
    title: "Closest Person to a Cake",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "One pass and two remembered indexes — the last person and the last cake seen.",
    prompt: [
      "A hallway is a list of cells: `0` is empty, `1` holds a person and `2` holds a cake. Return the smallest distance between any person and any cake, measured in cells, or `-1` if the hallway lacks one or the other.",
      "",
      "```",
      "minPersonCakeGap([1, 0, 0, 2])              ->  3",
      "minPersonCakeGap([2, 0, 1, 0, 0, 2])        ->  2",
      "minPersonCakeGap([1, 0, 0, 0])              ->  -1",
      "```",
      "",
      "One pass, constant extra space.",
    ].join("\n"),
    hints: [
      "Walk the line once remembering the index of the last person and the last cake. Whenever you see one kind, the closest partner of the other kind behind you is the last one seen.",
      "Checking only backwards is enough: every person–cake pair is seen when the later of the two is reached.",
    ],
    solution: [
      "## Approach",
      "",
      "Every person–cake pair has a later element; when the walk reaches it, the nearest earlier partner is the most recently seen one of the other kind, because anything earlier is farther away. So remember the last index of each kind and, at every 1 or 2, compare against the other kind's last index. No sorting, no second pass.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- This is the streaming version already: the two indexes are the whole state, so cells can arrive one at a time.",
      "- The grid version of the same question is [Nearest Bathroom for Every Desk](/problems/nearest-bathroom-distances); the global version, where every person must get a distinct cake, is [Assign People to Cakes](/problems/assign-people-to-cakes).",
    ].join("\n"),
    judge: {
      solutionCode: `// One pass: the nearest partner behind you is always the last one seen.
function minPersonCakeGap(line) {
  let best = Infinity;
  let lastPerson = -1;
  let lastCake = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === 1) {
      if (lastCake !== -1) best = Math.min(best, i - lastCake);
      lastPerson = i;
    } else if (line[i] === 2) {
      if (lastPerson !== -1) best = Math.min(best, i - lastPerson);
      lastCake = i;
    }
  }
  return best === Infinity ? -1 : best;
}
`,
      starterCode: `/**
 * @param {number[]} line 0 = empty, 1 = person, 2 = cake
 * @returns {number} smallest person-to-cake distance, or -1
 */
function minPersonCakeGap(line) {
  // Your code here
  return -1;
}
`,
      entry: "minPersonCakeGap",
      tests: [
        { name: "Prompt example", input: [[1, 0, 0, 2]], expected: 3 },
        { name: "Cake on both sides", input: [[2, 0, 1, 0, 0, 2]], expected: 2 },
        { name: "No cake", input: [[1, 0, 0, 0]], expected: -1 },
        { name: "No person", input: [[2, 2]], expected: -1 },
        { name: "Adjacent", input: [[2, 1]], expected: 1 },
        { name: "Several of each", input: [[1, 2, 0, 0, 1, 0, 2]], expected: 1 },
        { name: "Empty hallway", input: [[]], expected: -1 },
      ],
    },
  },
  {
    slug: "assign-people-to-cakes",
    title: "Assign People to Cakes",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Nearest-cake greedy is wrong; with both lists sorted, an optimal matching never crosses, so a 2-D DP finds it.",
    prompt: [
      "A hallway is a list of cells: `0` empty, `1` a person, `2` a cake. Give every person a **distinct** cake so that the total walking distance is as small as possible. There are at least as many cakes as people.",
      "",
      "Return `[total, pairs]`: the minimum total distance and the assignment as `[personIndex, cakeIndex]` pairs, one per person, in any order. Any assignment with the minimum total is accepted.",
      "",
      "```",
      "assignCakes([1, 2, 0, 1, 0, 0, 2])  ->  [4, [[0, 1], [3, 6]]]",
      "```",
      "",
      "Here both people are closest to the cake at index 1; sending the person at index 3 to the cake at index 6 is what makes the total 4.",
    ].join("\n"),
    hints: [
      "Greedy nearest-cake fails as soon as two people want the same cake. Work with the sorted index lists of people and cakes instead.",
      "In an optimal matching no two assignments cross, so dp[i][j] = cheapest way to seat the first i people using only the first j cakes: either cake j is skipped, or person i takes cake j.",
      "Recover the pairs by walking the table backwards: when dp[i][j] equals dp[i][j - 1] the cake was skipped, otherwise person i took it.",
    ],
    solution: [
      "## Approach",
      "",
      "Nearest-cake greedy is wrong — in the example both people want the cake at index 1. Because people and cakes come sorted by position, an optimal matching never crosses (uncrossing two crossed pairs never increases the total), so the problem is a classic alignment: `dp[i][j]` is the minimum cost of matching the first `i` people into the first `j` cakes, with `dp[i][j] = min(dp[i][j-1], dp[i-1][j-1] + |p_i - c_j|)`. Walk the table back to recover one optimal assignment.",
      "",
      "## Complexity",
      "",
      "O(P · C) time and space for P people and C cakes.",
      "",
      "## Worth saying out loud",
      "",
      "- Say which question is being asked before coding: nearest cake per person is a one-pass sweep; a global assignment is this DP. They give different answers on the same input.",
      "- Space drops to O(C) by keeping two rows, at the price of the backtrack; keep the full table when the pairs are wanted.",
      "- Test with more people than cakes (refuse, or ask), with no people, and against brute force over permutations on short hallways.",
    ].join("\n"),
    judge: {
      solutionCode: `// Sorted people, sorted cakes: an optimal matching never crosses, so
// dp[i][j] = cheapest way to seat the first i people in the first j cakes.
function assignCakes(line) {
  const people = [];
  const cakes = [];
  line.forEach((v, i) => {
    if (v === 1) people.push(i);
    else if (v === 2) cakes.push(i);
  });
  const P = people.length;
  const C = cakes.length;
  if (P > C) throw new Error("more people than cakes");
  const dp = Array.from({ length: P + 1 }, () => new Array(C + 1).fill(Infinity));
  for (let j = 0; j <= C; j++) dp[0][j] = 0;
  for (let i = 1; i <= P; i++) {
    for (let j = i; j <= C; j++) {
      dp[i][j] = Math.min(dp[i][j - 1], dp[i - 1][j - 1] + Math.abs(people[i - 1] - cakes[j - 1]));
    }
  }
  const pairs = [];
  let i = P;
  let j = C;
  while (i > 0) {                            // walk back: skipped cake, or a match
    if (dp[i][j] === dp[i][j - 1]) j--;
    else {
      pairs.push([people[i - 1], cakes[j - 1]]);
      i--;
      j--;
    }
  }
  return [dp[P][C], pairs.reverse()];
}
`,
      starterCode: `/**
 * @param {number[]} line 0 = empty, 1 = person, 2 = cake; cakes >= people
 * @returns {[number, number[][]]} [minimum total distance, [personIndex, cakeIndex] pairs]
 */
function assignCakes(line) {
  // Your code here
  return [0, []];
}
`,
      entry: "__judgeAssign",
      // Any minimum-total assignment is accepted: the driver checks the pairs
      // and compares the total with its own optimum.
      driverCode: `function __judgeAssign(line) {
  const people = [];
  const cakes = [];
  line.forEach((v, i) => {
    if (v === 1) people.push(i);
    else if (v === 2) cakes.push(i);
  });
  const dp = Array.from({ length: people.length + 1 }, () => new Array(cakes.length + 1).fill(Infinity));
  for (let j = 0; j <= cakes.length; j++) dp[0][j] = 0;
  for (let i = 1; i <= people.length; i++) {
    for (let j = i; j <= cakes.length; j++) {
      dp[i][j] = Math.min(dp[i][j - 1], dp[i - 1][j - 1] + Math.abs(people[i - 1] - cakes[j - 1]));
    }
  }
  const best = dp[people.length][cakes.length];
  const result = assignCakes(line);
  if (!Array.isArray(result) || result.length !== 2 || !Array.isArray(result[1])) return "expected [total, pairs]";
  const [total, pairs] = result;
  if (pairs.length !== people.length) return "every person needs exactly one cake";
  const usedPeople = new Set();
  const usedCakes = new Set();
  let sum = 0;
  for (const pair of pairs) {
    const [p, c] = pair;
    if (line[p] !== 1 || line[c] !== 2 || usedPeople.has(p) || usedCakes.has(c)) return "invalid pair " + JSON.stringify(pair);
    usedPeople.add(p);
    usedCakes.add(c);
    sum += Math.abs(p - c);
  }
  if (sum !== total) return "the pairs add up to " + sum + ", not " + total;
  return total === best ? "total " + total + ", valid" : "total " + total + " is not minimal (" + best + ")";
}`,
      tests: [
        { name: "Prompt example", input: [[1, 2, 0, 1, 0, 0, 2]], expected: "total 4, valid" },
        { name: "One person, one cake", input: [[1, 2]], expected: "total 1, valid" },
        { name: "A cake on either side", input: [[2, 1, 2]], expected: "total 1, valid" },
        { name: "Two people between two cakes", input: [[2, 1, 1, 0, 0, 2]], expected: "total 4, valid" },
        { name: "Neighbours", input: [[1, 1, 2, 2]], expected: "total 4, valid" },
        { name: "Spare cakes", input: [[2, 0, 1, 0, 2, 0, 0, 2]], expected: "total 2, valid" },
        { name: "No people", input: [[2, 0, 2]], expected: "total 0, valid" },
        { name: "Empty hallway", input: [[]], expected: "total 0, valid" },
      ],
    },
  },
  {
    slug: "course-order",
    title: "Course Order",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Kahn's algorithm, and the order courses leave the queue is the schedule.",
    prompt: [
      "There are `numCourses` courses labelled `0` to `numCourses - 1`, and prerequisite pairs `[a, b]` meaning course `b` must be taken before course `a`. Return an order in which every course can be taken, or an empty list if no such order exists.",
      "",
      "```",
      "findOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]])  ->  [0, 1, 2, 3]  (or [0, 2, 1, 3])",
      "findOrder(2, [[1, 0], [0, 1]])                  ->  []",
      "```",
      "",
      "Any valid order is accepted.",
    ].join("\n"),
    hints: [
      "Count each course's prerequisites (its in-degree) and start with the courses that have none. Taking a course lowers the in-degree of everything it unlocks; whatever hits zero joins the queue.",
      "If the order ends up shorter than numCourses, the leftover courses sit on a cycle: return the empty list.",
    ],
    solution: [
      "## Approach",
      "",
      "Kahn's algorithm. Build the adjacency list from prerequisite to course and count in-degrees; seed a queue with every course whose in-degree is zero; pop, record, and decrement the in-degree of each unlocked course, enqueueing it when it reaches zero. The recorded sequence is a valid schedule, and it is complete exactly when the graph is acyclic — a cycle leaves its members with positive in-degree forever.",
      "",
      "## Complexity",
      "",
      "O(V + E) time and space.",
      "",
      "## Worth saying out loud",
      "",
      "- Confirm the pair direction and 0- or 1-indexing before writing a line; both are easy to flip.",
      "- Tests to name: zero courses, no prerequisites (any order), a single chain (one order), a two-node cycle, a self-loop.",
      "- The same queue drives the timed versions: [Course Finish Time](/problems/course-finish-time) for per-course durations, [Course Batches Time](/problems/course-batches-time) for wave scheduling, and [Course Time With Any Prerequisite](/problems/course-any-prerequisite-time) for the start-when-any-finishes rule.",
    ].join("\n"),
    judge: {
      solutionCode: `// Kahn's algorithm: the order courses leave the queue is a schedule.
function findOrder(numCourses, prerequisites) {
  const unlocks = Array.from({ length: numCourses }, () => []);
  const indegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    unlocks[prereq].push(course);
    indegree[course]++;
  }
  const order = [];
  for (let c = 0; c < numCourses; c++) if (indegree[c] === 0) order.push(c);
  for (let head = 0; head < order.length; head++) {
    for (const next of unlocks[order[head]]) {
      if (--indegree[next] === 0) order.push(next);
    }
  }
  return order.length === numCourses ? order : [];     // short means a cycle
}
`,
      starterCode: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites [a, b] means b must come before a
 * @returns {number[]} a valid order, or [] when none exists
 */
function findOrder(numCourses, prerequisites) {
  // Your code here
  return [];
}
`,
      entry: "__judgeOrder",
      // Many orders are valid, so the driver checks the returned one.
      driverCode: `function __judgeOrder(numCourses, prerequisites) {
  const order = findOrder(numCourses, prerequisites);
  const indegree = new Array(numCourses).fill(0);
  const unlocks = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) {
    unlocks[b].push(a);
    indegree[a]++;
  }
  const queue = [];
  for (let c = 0; c < numCourses; c++) if (indegree[c] === 0) queue.push(c);
  for (let head = 0; head < queue.length; head++) {
    for (const next of unlocks[queue[head]]) if (--indegree[next] === 0) queue.push(next);
  }
  if (queue.length !== numCourses) {
    return Array.isArray(order) && order.length === 0 ? "impossible" : "returned an order although the courses form a cycle";
  }
  if (!Array.isArray(order) || order.length !== numCourses || new Set(order).size !== numCourses ||
      order.some((c) => !Number.isInteger(c) || c < 0 || c >= numCourses)) {
    return "not an ordering of every course";
  }
  const position = new Map(order.map((c, i) => [c, i]));
  for (const [a, b] of prerequisites) {
    if (position.get(b) > position.get(a)) return "course " + b + " must come before course " + a;
  }
  return "valid order of " + numCourses + " courses";
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            4,
            [
              [1, 0],
              [2, 0],
              [3, 1],
              [3, 2],
            ],
          ],
          expected: "valid order of 4 courses",
        },
        {
          name: "A two-course cycle",
          input: [
            2,
            [
              [1, 0],
              [0, 1],
            ],
          ],
          expected: "impossible",
        },
        { name: "One prerequisite", input: [2, [[1, 0]]], expected: "valid order of 2 courses" },
        { name: "No prerequisites", input: [3, []], expected: "valid order of 3 courses" },
        { name: "A self-loop", input: [1, [[0, 0]]], expected: "impossible" },
        {
          name: "A long chain",
          input: [
            5,
            [
              [1, 0],
              [2, 1],
              [3, 2],
              [4, 3],
            ],
          ],
          expected: "valid order of 5 courses",
        },
        {
          name: "A cycle hidden behind a chain",
          input: [
            4,
            [
              [1, 0],
              [2, 1],
              [3, 2],
              [1, 3],
            ],
          ],
          expected: "impossible",
        },
      ],
    },
  },
];
