import type { Problem } from "./types";

// Snowflake coding bank, part K: a board win check and the validity of an
// n-by-n tic-tac-toe position. Judged in JavaScript and Python; the Python
// judges live in seed-python-snowflake-d.ts.

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
      "- A numeric board interface — 0 empty, 1 and 2 for the players — changes nothing but the comparison; keep the win check independent of how cells are encoded.",
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
];
