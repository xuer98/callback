import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), UI part E:
// tic-tac-toe on an N by N board with M in a row to win (GreatFrontEnd's
// Apple list), which also covers the plain 3 by 3 game from a 2017
// Glassdoor report. HTML/CSS/JS is the default template; React is the
// alternate. Both carry complete reference files.

const tttCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.ttt {
  padding: 16px;
}

.settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 14px;
}

.settings input {
  width: 3.5em;
  padding: 4px 6px;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
  font: inherit;
}

.status {
  margin: 12px 0;
  font-weight: 600;
}

.board {
  display: grid;
  gap: 4px;
  width: min(100%, 360px);
}

.cell {
  aspect-ratio: 1;
  border: 0;
  border-radius: 6px;
  background: #f4f4f5;
  font: 600 clamp(12px, 5vw, 28px) system-ui, sans-serif;
  cursor: pointer;
}

.cell:disabled {
  cursor: default;
}

.cell[data-mark="X"] {
  color: #2563eb;
}

.cell[data-mark="O"] {
  color: #dc2626;
}

button {
  padding: 4px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
`,
};

const winLogic = `/**
 * Did the mark just placed at (row, col) complete m in a row?
 * Checks only the four lines through that cell.
 */
export function isWinningMove(board, row, col, m) {
  const n = board.length;
  const mark = board[row][col];
  const count = (dr, dc) => {
    let k = 0;
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < n && c >= 0 && c < n && board[r][c] === mark) {
      k++;
      r += dr;
      c += dc;
    }
    return k;
  };
  // Each line is counted outward both ways, so a move joining two runs counts.
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  return directions.some(([dr, dc]) => 1 + count(dr, dc) + count(-dr, -dc) >= m);
}
`;

const winLogicStarter = `/**
 * Did the mark just placed at (row, col) complete m in a row?
 * Check only the four lines through that cell.
 */
export function isWinningMove(board, row, col, m) {
  // Your code here
  return false;
}
`;

// -- HTML/CSS/JS ----------------------------------------------------------------

const tttHtml: UiFile = {
  name: "index.html",
  contents: `<main class="ttt">
  <form class="settings" id="settings">
    <label>Board size <input id="size" type="number" min="3" max="10" value="3" /></label>
    <label>In a row <input id="win" type="number" min="3" max="10" value="3" /></label>
    <button type="submit">New game</button>
  </form>
  <p class="status" id="status" aria-live="polite"></p>
  <div class="board" id="board" aria-label="Board"></div>
</main>
`,
};

const tttVanillaStarter = `${winLogicStarter}
const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");

// Your code here: read N and M from the form, build an N by N board of
// buttons, alternate X and O, check for a win or a draw after every move,
// and start over on "New game". This version draws a fixed 3 by 3 board.
boardEl.style.gridTemplateColumns = "repeat(3, 1fr)";
for (let i = 0; i < 9; i++) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "cell";
  boardEl.append(cell);
}
statusEl.textContent = "X's turn";
`;

const tttVanillaSolution = `${winLogic}
const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");
const sizeInput = document.getElementById("size");
const winInput = document.getElementById("win");

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
let game;

function newGame() {
  const n = clamp(Math.floor(Number(sizeInput.value)) || 3, 3, 10);
  const m = clamp(Math.floor(Number(winInput.value)) || 3, 3, n);
  sizeInput.value = n;
  winInput.value = m;
  game = { n, m, board: Array.from({ length: n }, () => Array(n).fill(null)), player: "X", winner: null, moves: 0 };

  // Build the grid once per game; each move then updates a single cell.
  boardEl.style.gridTemplateColumns = "repeat(" + n + ", 1fr)";
  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + ", empty");
      cells.push(cell);
    }
  }
  boardEl.replaceChildren(...cells);
  renderStatus();
}

function renderStatus() {
  const draw = !game.winner && game.moves === game.n * game.n;
  statusEl.textContent = game.winner ? game.winner + " wins!" : draw ? "Draw!" : game.player + "'s turn";
  if (game.winner || draw) {
    for (const cell of boardEl.children) cell.disabled = true;
  }
}

function play(cell) {
  const r = Number(cell.dataset.row);
  const c = Number(cell.dataset.col);
  if (game.winner || game.board[r][c]) return;
  game.board[r][c] = game.player;
  game.moves++;
  cell.textContent = game.player;
  cell.dataset.mark = game.player;
  cell.disabled = true;
  cell.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + ", " + game.player);
  if (isWinningMove(game.board, r, c, game.m)) game.winner = game.player;
  else game.player = game.player === "X" ? "O" : "X";
  renderStatus();
}

// One listener for every cell, whatever the board size.
boardEl.addEventListener("click", (event) => {
  const cell = event.target.closest("button[data-row]");
  if (cell) play(cell);
});
document.getElementById("settings").addEventListener("submit", (event) => {
  event.preventDefault();
  newGame();
});

newGame();
`;

// -- React --------------------------------------------------------------------------

const tttReactStarter = `import { useState } from "react";

${winLogicStarter}
// Your code here: N and M from the inputs, an N by N board, alternating
// X and O, a win or draw check after every move, and a New game button.
// This version draws a fixed 3 by 3 board that does nothing.
export default function App() {
  const [board] = useState(() => Array.from({ length: 3 }, () => Array(3).fill(null)));
  return (
    <main className="ttt">
      <p className="status">X's turn</p>
      <div className="board" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {board.flatMap((cells, r) =>
          cells.map((mark, c) => (
            <button key={r + "-" + c} type="button" className="cell">
              {mark}
            </button>
          )),
        )}
      </div>
    </main>
  );
}
`;

const tttReactSolution = `import { useState } from "react";

${winLogic}
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

function freshGame(n, m) {
  return { n, m, board: Array.from({ length: n }, () => Array(n).fill(null)), player: "X", winner: null, moves: 0 };
}

export default function App() {
  const [size, setSize] = useState("3");
  const [inARow, setInARow] = useState("3");
  const [game, setGame] = useState(() => freshGame(3, 3));
  const draw = !game.winner && game.moves === game.n * game.n;
  const over = Boolean(game.winner) || draw;

  const newGame = (event) => {
    event.preventDefault();
    const n = clamp(Math.floor(Number(size)) || 3, 3, 10);
    const m = clamp(Math.floor(Number(inARow)) || 3, 3, n);
    setSize(String(n));
    setInARow(String(m));
    setGame(freshGame(n, m));
  };

  const play = (r, c) => {
    if (over || game.board[r][c]) return;
    // Replace, never mutate: a new row array and a new board array.
    const board = game.board.map((row, i) => (i === r ? row.map((mark, j) => (j === c ? game.player : mark)) : row));
    const winner = isWinningMove(board, r, c, game.m) ? game.player : null;
    setGame({ ...game, board, winner, moves: game.moves + 1, player: winner ? game.player : game.player === "X" ? "O" : "X" });
  };

  return (
    <main className="ttt">
      <form className="settings" onSubmit={newGame}>
        <label>
          Board size <input type="number" min="3" max="10" value={size} onChange={(e) => setSize(e.target.value)} />
        </label>
        <label>
          In a row <input type="number" min="3" max="10" value={inARow} onChange={(e) => setInARow(e.target.value)} />
        </label>
        <button type="submit">New game</button>
      </form>
      <p className="status" aria-live="polite">
        {game.winner ? game.winner + " wins!" : draw ? "Draw!" : game.player + "'s turn"}
      </p>
      <div className="board" aria-label="Board" style={{ gridTemplateColumns: "repeat(" + game.n + ", 1fr)" }}>
        {game.board.flatMap((cells, r) =>
          cells.map((mark, c) => (
            <button
              key={r + "-" + c}
              type="button"
              className="cell"
              data-mark={mark ?? undefined}
              disabled={over || mark !== null}
              aria-label={"Row " + (r + 1) + ", column " + (c + 1) + ", " + (mark ?? "empty")}
              onClick={() => play(r, c)}
            >
              {mark}
            </button>
          )),
        )}
      </div>
    </main>
  );
}
`;

const tttUi: UiWorkspace = {
  framework: "vanilla",
  files: [tttHtml, { name: "game.js", contents: tttVanillaStarter }, tttCss],
  solution: [tttHtml, { name: "game.js", contents: tttVanillaSolution }, tttCss],
  alternate: {
    framework: "react",
    files: [{ name: "App.jsx", contents: tttReactStarter }, tttCss],
    solution: [{ name: "App.jsx", contents: tttReactSolution }, tttCss],
  },
};

export const appleUiProblemsE: Problem[] = [
  {
    slug: "tic-tac-toe-n-by-n",
    title: "Tic-Tac-Toe: N by N, M in a Row",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "A board of any size, a win check that looks only through the last move, and a status line for turn, winner or draw.",
    prompt: [
      "Build tic-tac-toe on an N by N board where M in a row wins. The plain game is `N = M = 3`. The default template is HTML/CSS/JS, and a React template is the alternate.",
      "",
      "## Requirements",
      "",
      "- Board size N (3 to 10) and win length M (3 to N) come from the inputs. \"New game\" applies them and resets the board. Out-of-range values are clamped.",
      "- Players alternate, X first. Clicking an empty cell places the current mark, and a filled cell can't be played again.",
      "- `isWinningMove(board, row, col, m)` decides a win by checking **only the lines through the last move**: horizontal, vertical and both diagonals.",
      "- The status line shows whose turn it is, the winner, or a draw when the board fills without one. No moves are allowed after the game ends.",
      "- Cells are buttons with labels such as \"Row 1, column 2, empty\", and the status is announced politely.",
      "",
      "*Listed under Apple by GreatFrontEnd, with no date or role. The plain 3 by 3 game in HTML, CSS and JS comes from a 2017 Glassdoor report.*",
    ].join("\n"),
    hints: [
      "A win can only be created by the mark just placed. From that cell, count matching marks outward in both directions along each of the four direction vectors. `1 + forward + backward >= m` is a win.",
      "Keep a move counter for the draw check: `moves === n * n` with no winner.",
      "In HTML/CSS/JS, build the grid once per game and put one click listener on the board that reads `data-row` and `data-col`. In React, replace the board immutably on every move.",
    ],
    solution: [
      "## Approach",
      "",
      "The game is a small state object: the board, the current player, the winner and a move count. Each move writes one cell, asks `isWinningMove` about that cell only, and then either records the winner or switches players. The status line is derived from that state, and a draw is simply a full board without a winner. The HTML/CSS/JS version builds the grid once per game and updates one button per move through a single delegated listener. The React version derives every cell from state and replaces the board immutably.",
      "",
      "## Worth saying out loud",
      "",
      "- **Check only the four lines through the last move.** A win can only be created by the mark just placed, so scanning the whole board after every turn is wasted work: O(n²) against O(m) per move.",
      "- Each line is counted outward in both directions from the new mark. That handles a move that joins two shorter runs, such as `X X _ X X` with M = 5.",
      "- A draw is a full board with no winner. Detecting a *forced* draw earlier, when no line can still be completed, is a good follow-up.",
      "- Follow-ups: undo with a move stack, highlight the winning line (return the cells instead of a boolean), and a simple AI that wins, else blocks, else takes the center.",
    ].join("\n"),
    ui: tttUi,
  },
];
