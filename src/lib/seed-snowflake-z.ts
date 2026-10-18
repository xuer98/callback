import type { Problem } from "./types";

// Snowflake coding bank, part Z: three more readings of the people-and-cakes
// hallway — a distance for every person, the grid where every cell is one
// or the other, and the cake one person walks to. Judged in JavaScript and
// Python; the Python judges live in seed-python-snowflake-v.ts.

export const snowflakeProblemsZ: Problem[] = [
  {
    slug: "person-cake-distances",
    title: "People and Cakes III",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "Two sweeps along the hallway — nearest cake on the left, nearest on the right — give every person a distance in one go.",
    prompt: [
      "The same hallway: a list of cells where `0` is empty, `1` holds a person and `2` holds a cake. For every person, in hallway order, return the distance to the nearest cake, measured in cells. If the hallway has no cake, every person gets `-1`.",
      "",
      "```",
      "cakeDistances([1, 0, 2, 0, 1, 2])  ->  [2, 1]",
      "cakeDistances([2, 1, 0, 0, 2, 1])  ->  [1, 1]",
      "cakeDistances([1, 0, 1])           ->  [-1, -1]",
      "```",
    ].join("\n"),
    hints: [
      "Each person's answer is the smaller of two things: the distance to the last cake seen going right, and to the last cake seen going left.",
      "Two passes, each carrying the index of the most recent cake, cover both directions in O(n).",
    ],
    solution: [
      "## Approach",
      "",
      "Sweep left to right remembering the index of the last cake; each cell's distance to it is a first answer (infinity before any cake). Sweep right to left the same way and keep the smaller of the two for every cell. Then read off the cells that hold a person, in order; if no cake exists both sweeps leave infinity, which becomes `-1`.",
      "",
      "## Complexity",
      "",
      "O(n) time, O(n) space for the per-cell distances (or O(people) with a little care).",
      "",
      "## Worth saying out loud",
      "",
      "- [People and Cakes I](/problems/closest-person-cake-distance) asks for the single smallest gap; this asks for every person's, so the two-sweep answer replaces the two-pointer one.",
      "- The empty-cell `0` is what makes distances larger than one possible; a hallway with no empties is the grid question, [People and Cakes IV](/problems/closest-cake-in-grid).",
    ].join("\n"),
    judge: {
      solutionCode: `// Nearest cake on the left and on the right, one sweep each.
function cakeDistances(hallway) {
  const n = hallway.length;
  const distance = new Array(n).fill(Infinity);
  let lastCake = -1;
  for (let i = 0; i < n; i++) {
    if (hallway[i] === 2) lastCake = i;
    if (lastCake !== -1) distance[i] = i - lastCake;
  }
  lastCake = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (hallway[i] === 2) lastCake = i;
    if (lastCake !== -1) distance[i] = Math.min(distance[i], lastCake - i);
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    if (hallway[i] === 1) out.push(distance[i] === Infinity ? -1 : distance[i]);
  }
  return out;
}
`,
      starterCode: `/**
 * @param {number[]} hallway cells: 0 empty, 1 a person, 2 a cake
 * @returns {number[]} each person's distance to the nearest cake, in order; -1 each when there is no cake
 */
function cakeDistances(hallway) {
  // Your code here
  return [];
}
`,
      entry: "cakeDistances",
      tests: [
        {
          name: "Prompt example",
          input: [[1, 0, 2, 0, 1, 2]],
          expected: [2, 1],
        },
        {
          name: "Cakes on both ends",
          input: [[2, 1, 0, 0, 2, 1]],
          expected: [1, 1],
        },
        { name: "No cake", input: [[1, 0, 1]], expected: [-1, -1] },
        { name: "No people", input: [[2, 0, 2]], expected: [] },
        { name: "Empty hallway", input: [[]], expected: [] },
        {
          name: "The nearer cake is on the right",
          input: [[2, 0, 0, 0, 1, 0, 2]],
          expected: [2],
        },
        {
          name: "Several people share one cake",
          input: [[1, 1, 1, 2]],
          expected: [3, 2, 1],
        },
      ],
    },
  },
  {
    slug: "closest-cake-in-grid",
    title: "People and Cakes IV",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "A grid with no empty cells: if there is a person and a cake at all, some pair is adjacent, so the answer is 1 before any search.",
    prompt: [
      "Now the room is a grid, and **every** cell holds either a person (`1`) or a cake (`2`) — there are no empty cells. Return the smallest Manhattan distance between any person and any cake, or `-1` if the grid lacks one of the two.",
      "",
      "```",
      "closestPair([[2, 1]])          ->  1",
      "closestPair([[2], [1]])        ->  1",
      "closestPair([[1, 1], [1, 1]])  ->  -1",
      "```",
      "",
      "Think before you search.",
    ].join("\n"),
    hints: [
      "Start at any cake and walk toward any person one step at a time. Every step lands on a person or a cake — so what happens on the first step that changes kind?",
      "If both kinds exist, that step is between neighbouring cells, so the minimum is always 1; the only work is checking that both exist.",
    ],
    solution: [
      "## Approach",
      "",
      "Because no cell is empty, any path from a cake to a person through neighbouring cells must at some step move from a cake cell to a person cell, and those two cells are adjacent — distance 1. So whenever the grid holds at least one of each, the answer is 1 without searching; the only computation is a scan to confirm both kinds exist, returning `-1` otherwise.",
      "",
      "## Complexity",
      "",
      "O(rows · columns) to check that both kinds appear, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Say the argument, not just the answer: the interviewer wants the observation that a full grid forces an adjacent pair.",
      "- Add an empty value back and the question becomes a real multi-source BFS — the shape of [Nearest Bathroom for Every Desk](/problems/nearest-bathroom-distances).",
      "- Which cake a particular person walks to is a different question: [People and Cakes V](/problems/cake-a-person-eats).",
    ].join("\n"),
    judge: {
      solutionCode: `// A full grid with both kinds present always has an adjacent person-cake pair.
function closestPair(grid) {
  let person = false;
  let cake = false;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === 1) person = true;
      else if (cell === 2) cake = true;
    }
  }
  return person && cake ? 1 : -1;
}
`,
      starterCode: `/**
 * @param {number[][]} grid every cell is 1 (a person) or 2 (a cake)
 * @returns {number} the smallest Manhattan distance between a person and a cake, or -1
 */
function closestPair(grid) {
  // Your code here
  return -1;
}
`,
      entry: "closestPair",
      tests: [
        { name: "Side by side", input: [[[2, 1]]], expected: 1 },
        { name: "One above the other", input: [[[2], [1]]], expected: 1 },
        {
          name: "Only people",
          input: [
            [
              [1, 1],
              [1, 1],
            ],
          ],
          expected: -1,
        },
        { name: "Only cakes", input: [[[2]]], expected: -1 },
        {
          name: "One cake in a corner of a big room",
          input: [
            [
              [1, 1, 1, 1],
              [1, 1, 1, 1],
              [1, 1, 1, 2],
            ],
          ],
          expected: 1,
        },
        {
          name: "A checkerboard",
          input: [
            [
              [1, 2, 1],
              [2, 1, 2],
            ],
          ],
          expected: 1,
        },
      ],
    },
  },
  {
    slug: "cake-a-person-eats",
    title: "People and Cakes V",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "One person, every cake: scan the grid once keeping the cake with the smallest Manhattan distance.",
    prompt: [
      "The same full grid of people (`1`) and cakes (`2`). The person at `[row, col]` walks to the cake nearest to them by Manhattan distance; that cake is unique. Return its `[row, col]`.",
      "",
      "```",
      "cakeFor([[2, 1, 1], [1, 1, 2], [1, 1, 1]], 2, 1)  ->  [1, 2]",
      "cakeFor([[2, 1, 1]], 0, 2)                        ->  [0, 0]",
      "```",
      "",
      "From `[2, 1]` the cake at `[0, 0]` is 3 away and the cake at `[1, 2]` is 2 away.",
    ].join("\n"),
    hints: [
      "Manhattan distance is `|dr| + |dc|`; there is nothing to search, only cakes to compare.",
      "One pass over the grid, remembering the best cake so far, is already optimal — every cell may hold a cake.",
    ],
    solution: [
      "## Approach",
      "",
      "Visit every cell; for each cake compute `|row - r| + |col - c|` and keep the position with the smallest value. The nearest cake is unique, so no tie-break is needed. Ring-by-ring expansion from the person stops earlier on average but has the same worst case, since the only cake may sit in the far corner.",
      "",
      "## Complexity",
      "",
      "O(rows · columns) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- If ties were possible, the problem would need a rule (first in reading order, say); ask before assuming uniqueness.",
      "- With many people asking in turn, a multi-source BFS from all cakes answers every query in O(1) after one pass — the follow-up worth offering.",
    ].join("\n"),
    judge: {
      solutionCode: `// One scan, keeping the nearest cake by Manhattan distance.
function cakeFor(grid, row, col) {
  let best = null;
  let bestDistance = Infinity;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== 2) continue;
      const distance = Math.abs(r - row) + Math.abs(c - col);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = [r, c];
      }
    }
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number[][]} grid every cell is 1 (a person) or 2 (a cake); at least one cake
 * @param {number} row the person's row
 * @param {number} col the person's column
 * @returns {[number, number]} the [row, col] of the unique nearest cake
 */
function cakeFor(grid, row, col) {
  // Your code here
  return [0, 0];
}
`,
      entry: "cakeFor",
      tests: [
        {
          name: "Prompt example",
          input: [
            [
              [2, 1, 1],
              [1, 1, 2],
              [1, 1, 1],
            ],
            2,
            1,
          ],
          expected: [1, 2],
        },
        { name: "The only cake", input: [[[2, 1, 1]], 0, 2], expected: [0, 0] },
        {
          name: "Nearest is not the first in reading order",
          input: [
            [
              [2, 1, 1, 1],
              [1, 1, 1, 1],
              [1, 1, 1, 2],
            ],
            2,
            2,
          ],
          expected: [2, 3],
        },
        {
          name: "A far cake in the opposite corner loses",
          input: [
            [
              [1, 1, 2],
              [1, 1, 1],
              [2, 1, 1],
            ],
            0,
            0,
          ],
          expected: [0, 2],
        },
        {
          name: "The cake right next door",
          input: [
            [
              [1, 2],
              [2, 2],
            ],
            0,
            0,
          ],
          expected: [0, 1],
        },
      ],
    },
  },
];
