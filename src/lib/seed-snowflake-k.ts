import type { Problem } from "./types";

// Snowflake coding bank, part K: a board win check, the validity of a
// tic-tac-toe position, and flights with a stop limit. Judged in JavaScript
// and Python; the Python judges live in seed-python-snowflake-d.ts.

export const snowflakeProblemsK: Problem[] = [
  {
    slug: "connect-four-winning-move",
    title: "Does This Connect Four Move Win?",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Only the four lines through the last move can have changed, so count outward in each direction from it.",
    prompt: [
      "A Connect Four board is a grid of numbers: `0` empty, `1` and `2` the two players. A piece was just placed at `(row, col)`. Return whether it completed a line of **four or more** of that player's pieces — horizontally, vertically or on either diagonal.",
      "",
      "```",
      "board = [[0, 0, 0, 0, 0],",
      "         [0, 0, 0, 0, 0],",
      "         [2, 2, 0, 0, 0],",
      "         [1, 1, 1, 1, 2]]",
      "isWinningMove(board, 3, 3)  ->  true",
      "isWinningMove(board, 2, 1)  ->  false",
      "```",
    ].join("\n"),
    hints: [
      "Do not rescan the board. For each of the four directions, count the matching pieces outward from the move both ways; the run length is 1 plus the two counts.",
      "A run of five or more also wins — compare with >= 4, not == 4.",
    ],
    solution: [
      "## Approach",
      "",
      "A move can only complete a line that passes through it, so check the four lines through `(row, col)`: for each direction vector, walk outward in both senses while the cell holds the same player, and add the two counts to 1. Any run of four or more is a win. The board's size never enters the cost.",
      "",
      "## Complexity",
      "",
      "O(1) per move on a standard board, O(max(R, C)) in general; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Scanning every line of the board after each move is the correct-but-slow answer; say why the local check is enough.",
      "- The same function serves the drop logic in a playable game: compute the landing row, place the piece, then call this once.",
    ].join("\n"),
    judge: {
      solutionCode: `// Count outward from the move along each of the four line directions.
function isWinningMove(board, row, col) {
  const player = board[row][col];
  if (!player) return false;
  const rows = board.length;
  const cols = board[0].length;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    let run = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] === player) {
        run++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (run >= 4) return true;
  }
  return false;
}
`,
      starterCode: `/**
 * @param {number[][]} board 0 empty, 1 and 2 the players
 * @param {number} row the row of the piece just placed
 * @param {number} col its column
 * @returns {boolean} whether that piece completed four or more in a line
 */
function isWinningMove(board, row, col) {
  // Your code here
  return false;
}
`,
      entry: "isWinningMove",
      tests: [
        {
          name: "A horizontal win",
          input: [
            [
              [0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0],
              [2, 2, 0, 0, 0],
              [1, 1, 1, 1, 2],
            ],
            3,
            3,
          ],
          expected: true,
        },
        {
          name: "Two in a row is not a win",
          input: [
            [
              [0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0],
              [2, 2, 0, 0, 0],
              [1, 1, 1, 1, 2],
            ],
            2,
            1,
          ],
          expected: false,
        },
        {
          name: "A vertical win",
          input: [
            [
              [0, 0],
              [2, 0],
              [2, 0],
              [2, 1],
              [2, 1],
              [1, 1],
            ],
            1,
            0,
          ],
          expected: true,
        },
        {
          name: "A diagonal win",
          input: [
            [
              [0, 0, 0, 1],
              [0, 0, 1, 2],
              [0, 1, 2, 2],
              [1, 2, 1, 2],
            ],
            0,
            3,
          ],
          expected: true,
        },
        {
          name: "An anti-diagonal win checked from the middle",
          input: [
            [
              [2, 0, 0, 0],
              [1, 2, 0, 0],
              [1, 1, 2, 0],
              [2, 1, 1, 2],
            ],
            1,
            1,
          ],
          expected: true,
        },
        {
          name: "Three in a row",
          input: [
            [
              [0, 0, 0, 0],
              [1, 1, 1, 0],
            ],
            1,
            2,
          ],
          expected: false,
        },
        { name: "A gap breaks the line", input: [[[1, 1, 2, 1, 1]], 0, 4], expected: false },
        { name: "Five in a row still wins", input: [[[1, 1, 1, 1, 1]], 0, 2], expected: true },
        { name: "An empty cell never wins", input: [[[0, 0, 0, 0]], 0, 0], expected: false },
      ],
    },
  },
  {
    slug: "valid-tic-tac-toe-state",
    title: "Valid Tic-Tac-Toe State",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Count the pieces, then check who has a line: X leads by one if X won, counts are equal if O won, and both cannot win.",
    prompt: [
      "An `n × n` tic-tac-toe board is given as `n` strings of `X`, `O` and spaces. `X` moves first, players alternate, and the game stops as soon as someone has `n` in a row, column or diagonal. Return whether the board could have been reached by a real game.",
      "",
      "```",
      'validTicTacToe(["XOX", " X ", "   "])  ->  false     // X moved twice in a row',
      'validTicTacToe(["XOX", "O O", "XOX"])  ->  true',
      'validTicTacToe(["XXX", "   ", "OOO"])  ->  false     // both cannot have won',
      "```",
    ].join("\n"),
    hints: [
      "Count X and O: X equals O or leads by exactly one, always.",
      "If X has a line, X must lead by one (X made the last move); if O has a line, the counts must be equal. Both having a line is impossible, because the game stopped at the first.",
    ],
    solution: [
      "## Approach",
      "",
      "Two facts about any legal position: `countX − countO` is 0 or 1, and a win ends the game. So compute the counts and whether each player has a full row, column or diagonal. Invalid if the difference is wrong, if both have a line, if X has a line without leading by one, or if O has a line while X leads. Everything else is reachable.",
      "",
      "## Complexity",
      "",
      "O(n²) time, O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The board size is a parameter here; the line check is the only place `n` appears, so write it as a loop over rows, columns and the two diagonals rather than hard-coding eight lines.",
      "- A board where both players have a line is unreachable because play stops at the first win — that is the case people miss.",
    ].join("\n"),
    judge: {
      solutionCode: `// Piece counts plus a line check per player decide reachability.
function validTicTacToe(board) {
  const n = board.length;
  let xs = 0;
  let os = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === "X") xs++;
      else if (cell === "O") os++;
    }
  }
  const hasLine = (p) => {
    const full = (cells) => cells.every((c) => c === p);
    for (let i = 0; i < n; i++) {
      if (full([...board[i]])) return true;
      if (full(board.map((row) => row[i]))) return true;
    }
    return full(board.map((row, i) => row[i])) || full(board.map((row, i) => row[n - 1 - i]));
  };
  if (xs !== os && xs !== os + 1) return false;
  const xWins = hasLine("X");
  const oWins = hasLine("O");
  if (xWins && oWins) return false;
  if (xWins && xs !== os + 1) return false;
  if (oWins && xs !== os) return false;
  return true;
}
`,
      starterCode: `/**
 * @param {string[]} board n rows of X, O and spaces; n in a row wins
 * @returns {boolean} whether a real game could reach this position
 */
function validTicTacToe(board) {
  // Your code here
  return false;
}
`,
      entry: "validTicTacToe",
      tests: [
        { name: "O cannot move first", input: [["O  ", "   ", "   "]], expected: false },
        { name: "X moved twice in a row", input: [["XOX", " X ", "   "]], expected: false },
        { name: "A finished draw", input: [["XOX", "O O", "XOX"]], expected: true },
        { name: "Both cannot have won", input: [["XXX", "   ", "OOO"]], expected: false },
        { name: "X won with the last move", input: [["XXX", "OO ", "   "]], expected: true },
        { name: "O won, so the counts are equal", input: [["XX ", "OOO", "X  "]], expected: true },
        { name: "O cannot win while X leads", input: [["XXO", "XOX", "O  "]], expected: false },
        { name: "An empty board", input: [["   ", "   ", "   "]], expected: true },
        { name: "A 4 by 4 win", input: [["XXXX", "OOO ", "    ", "    "]], expected: true },
        { name: "A 4 by 4 double win", input: [["XXXX", "OOOO", "    ", "    "]], expected: false },
        { name: "A 4 by 4 position in progress", input: [["XO  ", " XO ", "    ", "    "]], expected: true },
      ],
    },
  },
  {
    slug: "cheapest-flights-k-stops",
    title: "Cheapest Flights Within K Stops",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Bellman-Ford for exactly k + 1 rounds, relaxing from a frozen copy so a round adds at most one edge.",
    prompt: [
      "There are `n` cities and flights `[from, to, price]`. Return the cheapest price from `src` to `dst` using at most `k` stops (so at most `k + 1` flights), or `-1` if there is no such route.",
      "",
      "```",
      "findCheapestPrice(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1)  ->  700",
      "findCheapestPrice(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1)                           ->  200",
      "findCheapestPrice(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0)                           ->  500",
      "```",
    ].join("\n"),
    hints: [
      "Plain Dijkstra does not respect the stop limit. Run Bellman-Ford for k + 1 rounds: each round allows one more flight.",
      "Relax every flight against a copy of the previous round's costs, so a round cannot chain two flights together.",
    ],
    solution: [
      "## Approach",
      "",
      "Bellman-Ford bounded by the number of flights. Start with `cost[src] = 0` and infinity elsewhere; repeat `k + 1` times: copy the costs, and for every flight update the copy's destination from the *previous* round's source cost. The copy is what keeps a round to one flight — relaxing in place would let a round use two. After the rounds, `cost[dst]` is the answer or infinity.",
      "",
      "## Complexity",
      "",
      "O(k · E) time, O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Dijkstra with the stop count in the state also works (and is usually faster), but the plain version fails because the cheapest way to a city may use too many stops.",
      "- Write your own tests here — the two example graphs plus an unreachable destination and k = 0 — before saying done.",
    ].join("\n"),
    judge: {
      solutionCode: `// Bellman-Ford for k + 1 rounds against a frozen copy of the previous round.
function findCheapestPrice(n, flights, src, dst, k) {
  let cost = new Array(n).fill(Infinity);
  cost[src] = 0;
  for (let round = 0; round <= k; round++) {
    const next = cost.slice();
    for (const [from, to, price] of flights) {
      if (cost[from] + price < next[to]) next[to] = cost[from] + price;
    }
    cost = next;
  }
  return cost[dst] === Infinity ? -1 : cost[dst];
}
`,
      starterCode: `/**
 * @param {number} n cities 0..n-1
 * @param {number[][]} flights [from, to, price]
 * @param {number} src
 * @param {number} dst
 * @param {number} k at most k stops
 * @returns {number} the cheapest price, or -1
 */
function findCheapestPrice(n, flights, src, dst, k) {
  // Your code here
  return -1;
}
`,
      entry: "findCheapestPrice",
      tests: [
        {
          name: "One stop",
          input: [
            4,
            [
              [0, 1, 100],
              [1, 2, 100],
              [2, 0, 100],
              [1, 3, 600],
              [2, 3, 200],
            ],
            0,
            3,
            1,
          ],
          expected: 700,
        },
        {
          name: "The cheap route fits the limit",
          input: [
            3,
            [
              [0, 1, 100],
              [1, 2, 100],
              [0, 2, 500],
            ],
            0,
            2,
            1,
          ],
          expected: 200,
        },
        {
          name: "No stops allowed",
          input: [
            3,
            [
              [0, 1, 100],
              [1, 2, 100],
              [0, 2, 500],
            ],
            0,
            2,
            0,
          ],
          expected: 500,
        },
        { name: "Unreachable", input: [3, [[0, 1, 100]], 0, 2, 5], expected: -1 },
        { name: "Source is the destination", input: [2, [[0, 1, 5]], 0, 0, 0], expected: 0 },
        {
          name: "More stops than needed",
          input: [
            4,
            [
              [0, 1, 1],
              [1, 2, 1],
              [2, 3, 1],
              [0, 3, 10],
            ],
            0,
            3,
            5,
          ],
          expected: 3,
        },
        {
          name: "A cycle is never worth it",
          input: [
            3,
            [
              [0, 1, 1],
              [1, 0, 1],
              [1, 2, 5],
            ],
            0,
            2,
            3,
          ],
          expected: 6,
        },
      ],
    },
  },
];
