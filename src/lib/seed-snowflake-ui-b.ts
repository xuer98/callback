import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part B: a grid game (Lights Out) in plain
// JavaScript, with one template and complete reference files.

// -- lights out (vanilla) -----------------------------------------------------

const lightsHtml: UiFile = { name: "index.html", contents: `<div id="app" class="lights"></div>\n` };

const lightsCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.lights {
  padding: 16px;
  max-width: 360px;
}

.lights__status {
  margin: 0 0 12px;
  min-height: 1.5em;
}

.lights__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.cell {
  aspect-ratio: 1;
  border: 0;
  border-radius: 8px;
  background: #3f3f46;
  cursor: pointer;
  transition: background 120ms;
}

.cell[aria-pressed="true"] {
  background: #facc15;
  box-shadow: 0 0 12px #fde047;
}

.lights__reset {
  margin-top: 12px;
  padding: 6px 12px;
  border: 0;
  border-radius: 6px;
  background: #18181b;
  color: white;
  font: inherit;
  cursor: pointer;
}
`,
};

const lightsLogic = `const SIZE = 5;

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
}
`;

const lightsVanillaStarter = `${lightsLogic}
// TODO: clicking a cell toggles it and its four neighbours; count moves,
// announce the win when every light is off, and start each game from a
// random board that is guaranteed to be solvable.
function init(root) {
  const state = { board: emptyBoard(), moves: 0 };
  const status = document.createElement("p");
  status.className = "lights__status";
  status.setAttribute("aria-live", "polite");
  const grid = document.createElement("div");
  grid.className = "lights__grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "Lights Out board");
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "lights__reset";
  reset.textContent = "New game";
  root.append(status, grid, reset);

  function render() {
    status.textContent = "Moves: " + state.moves;
    grid.replaceChildren(
      ...state.board.flatMap((row, r) =>
        row.map((on, c) => {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "cell";
          cell.dataset.r = String(r);
          cell.dataset.c = String(c);
          cell.setAttribute("aria-pressed", String(on));
          cell.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1));
          return cell;
        })
      )
    );
  }

  render();
}

init(document.getElementById("app"));
`;

const lightsVanillaSolution = `${lightsLogic}
// Returns a new board with (r, c) and its four neighbours flipped.
function toggle(board, r, c) {
  const next = board.map((row) => row.slice());
  for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) next[nr][nc] = !next[nr][nc];
  }
  return next;
}

function isSolved(board) {
  return board.every((row) => row.every((on) => !on));
}

// Applying random moves to the solved board gives a board that those same
// moves solve, so every game is winnable.
function scramble(moves) {
  let board = emptyBoard();
  for (let i = 0; i < moves; i++) {
    board = toggle(board, Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE));
  }
  return isSolved(board) ? toggle(board, 2, 2) : board;
}

function init(root) {
  const state = { board: scramble(8), moves: 0 };
  const status = document.createElement("p");
  status.className = "lights__status";
  status.setAttribute("aria-live", "polite");
  const grid = document.createElement("div");
  grid.className = "lights__grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "Lights Out board");
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "lights__reset";
  reset.textContent = "New game";
  root.append(status, grid, reset);

  function render() {
    const won = isSolved(state.board);
    status.textContent = won ? "Solved in " + state.moves + " moves!" : "Moves: " + state.moves;
    grid.replaceChildren(
      ...state.board.flatMap((row, r) =>
        row.map((on, c) => {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "cell";
          cell.dataset.r = String(r);
          cell.dataset.c = String(c);
          cell.disabled = won;
          cell.setAttribute("aria-pressed", String(on));
          cell.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + (on ? ", on" : ", off"));
          return cell;
        })
      )
    );
  }

  // One listener for the whole grid: the cell is read off the event target.
  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".cell");
    if (!cell || isSolved(state.board)) return;
    state.board = toggle(state.board, Number(cell.dataset.r), Number(cell.dataset.c));
    state.moves += 1;
    render();
  });

  reset.addEventListener("click", () => {
    state.board = scramble(8);
    state.moves = 0;
    render();
  });

  render();
}

init(document.getElementById("app"));
`;

export const snowflakeUiProblemsB: Problem[] = [
  {
    slug: "lights-out-grid-game",
    title: "Grid Game: Lights Out",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "State in one object, a pure toggle that flips a cell and its neighbours, one delegated click listener, and a render from state.",
    prompt: [
      "Build Lights Out on a 5 × 5 grid in plain JavaScript. The starter renders the grid from a board of booleans; make it a game.",
      "",
      "## Requirements",
      "",
      "- Clicking a cell toggles it **and its four neighbours** (edges and corners have fewer).",
      "- Count moves and show them; when every light is off, announce the win with the move count and stop accepting clicks.",
      "- \"New game\" starts from a random board that is **guaranteed solvable**.",
      "- Render from state: the grid is rebuilt from the board after every change, not patched cell by cell.",
      "- One click listener on the grid (event delegation), not one per cell.",
      "- Cells are buttons with `aria-pressed` reflecting their state, and the status line is a live region.",
    ].join("\n"),
    hints: [
      "Keep `toggle(board, r, c)` pure: copy the rows, flip the five positions that are in bounds, return the copy.",
      "A random board made by applying random toggles to the solved board is solvable by construction — the same toggles undo it.",
      "Read the clicked cell with `event.target.closest(\".cell\")` and its `data-r` / `data-c`; ignore clicks once the game is won.",
    ],
    solution: [
      "## Approach",
      "",
      "All state lives in one object: the board and the move count. `toggle` is a pure function returning a new board with the clicked cell and its in-bounds neighbours flipped; `isSolved` checks for all-off. The grid listens once and reads the row and column from the clicked button's data attributes, updates the state, and calls `render`, which rebuilds the buttons from the board with `aria-pressed` set. A new game scrambles by applying random toggles to the empty board, which guarantees a solution exists.",
      "",
      "## Worth saying out loud",
      "",
      "- Not every 5 × 5 configuration is solvable (the move matrix is singular over GF(2)), which is why scrambling from the solved state matters more than it looks.",
      "- Rebuilding 25 buttons per move is fine; the optimisation, if asked, is toggling `aria-pressed` on the five affected cells.",
      "- Extensions: a solver that highlights the next move (chase the lights row by row, then fix the last row from a lookup), an undo stack of boards, and an N × N size parameter.",
    ].join("\n"),
    ui: {
      framework: "vanilla",
      files: [lightsHtml, { name: "script.js", contents: lightsVanillaStarter }, lightsCss],
      solution: [lightsHtml, { name: "script.js", contents: lightsVanillaSolution }, lightsCss],
    },
  },
];
