import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part C: the two prompts the recruiter's email
// and the reports name for the frontend hour — a chessboard in React and a
// robot that eats candies on a grid in plain JavaScript. Each has one
// template with complete reference files.

// -- chessboard (React) -------------------------------------------------------

const chessCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.chess {
  padding: 16px;
}

.chess__status {
  margin: 0 0 12px;
  min-height: 1.5em;
}

.board {
  display: grid;
  grid-template-columns: repeat(8, 48px);
  border: 2px solid #3f3f46;
  width: max-content;
}

.square {
  width: 48px;
  height: 48px;
  border: 0;
  padding: 0;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
}

.square--light {
  background: #eeeed2;
}

.square--dark {
  background: #769656;
}

.square--selected {
  box-shadow: inset 0 0 0 4px #facc15;
}

.square:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: -3px;
}
`,
};

const chessShared = `const FILES = "abcdefgh";

// The starting position, rank 8 first; lowercase is black, uppercase white.
const START = ["rnbqkbnr", "pppppppp", "8", "8", "8", "8", "PPPPPPPP", "RNBQKBNR"];

const GLYPHS = { k: "\\u265A", q: "\\u265B", r: "\\u265C", b: "\\u265D", n: "\\u265E", p: "\\u265F", K: "\\u2654", Q: "\\u2655", R: "\\u2656", B: "\\u2657", N: "\\u2658", P: "\\u2659" };

const NAMES = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };

/** Pieces keyed by "row,col" from the rank strings. */
export function initialPieces() {
  const pieces = {};
  START.forEach((rank, r) => {
    let c = 0;
    for (const ch of rank) {
      if (ch >= "1" && ch <= "8") c += Number(ch);
      else pieces[r + "," + c++] = ch;
    }
  });
  return pieces;
}

export function squareName(r, c) {
  return FILES[c] + (8 - r);
}

export function pieceName(piece) {
  if (!piece) return "";
  return (piece === piece.toUpperCase() ? "white " : "black ") + NAMES[piece.toLowerCase()];
}
`;

const chessReactStarter = `import { useState } from "react";

${chessShared}
export default function App() {
  const [pieces, setPieces] = useState(initialPieces);
  // TODO: render the 8x8 board with alternating colours and the pieces,
  // select a square on click, and move the selected piece on the next click.
  return (
    <main className="chess">
      <p className="chess__status">Click a piece to select it.</p>
      <div className="board" role="grid" aria-label="Chessboard" />
    </main>
  );
}
`;

const chessReactSolution = `import { useState } from "react";

${chessShared}
export default function App() {
  const [pieces, setPieces] = useState(initialPieces);
  const [selected, setSelected] = useState(null); // "row,col" of the picked-up piece

  function clickSquare(key) {
    if (selected === null) {
      if (pieces[key]) setSelected(key);
      return;
    }
    if (key !== selected) {
      // Move, capturing whatever was there. The old key is deleted from a copy.
      setPieces((prev) => {
        const next = { ...prev, [key]: prev[selected] };
        delete next[selected];
        return next;
      });
    }
    setSelected(null);
  }

  const status = selected
    ? "Selected " + pieceName(pieces[selected]) + " on " + squareName(...selected.split(",").map(Number)) + ". Click a destination."
    : "Click a piece to select it.";

  return (
    <main className="chess">
      <p className="chess__status" aria-live="polite">{status}</p>
      <div className="board" role="grid" aria-label="Chessboard">
        {Array.from({ length: 64 }, (_, i) => {
          const r = Math.floor(i / 8);
          const c = i % 8;
          const key = r + "," + c;
          const piece = pieces[key];
          const dark = (r + c) % 2 === 1;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-label={squareName(r, c) + (piece ? ", " + pieceName(piece) : "")}
              aria-pressed={selected === key}
              className={"square " + (dark ? "square--dark" : "square--light") + (selected === key ? " square--selected" : "")}
              onClick={() => clickSquare(key)}
            >
              {piece ? GLYPHS[piece] : ""}
            </button>
          );
        })}
      </div>
    </main>
  );
}
`;

// -- robot eats candies (vanilla) ---------------------------------------------

const robotHtml: UiFile = {
  name: "index.html",
  contents: `<main id="app" class="game">
  <p class="game__status" id="status"></p>
  <div class="grid" id="grid" role="grid" aria-label="Candy grid"></div>
  <div class="game__controls">
    <button type="button" id="auto">Eat the nearest candy</button>
    <span class="game__hint">Arrow keys move the robot.</span>
  </div>
</main>
`,
};

const robotCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.game {
  padding: 16px;
}

.game__status {
  margin: 0 0 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(8, 40px);
  gap: 3px;
}

.cell {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #e4e4e7;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.cell--wall {
  background: #3f3f46;
}

.cell--candy::after {
  content: "\\1F36C";
}

.cell--robot::after {
  content: "\\1F916";
}

.game__controls {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.game__controls button {
  padding: 6px 12px;
  border: 0;
  border-radius: 6px;
  background: #18181b;
  color: white;
  font: inherit;
  cursor: pointer;
}

.game__hint {
  font-size: 13px;
  color: #52525b;
}
`,
};

const robotShared = `const ROWS = 6;
const COLS = 8;
const DIRS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
const key = (r, c) => r + "," + c;

function createGame() {
  const candies = [[1, 3], [4, 1], [5, 7], [2, 6], [0, 5]];
  const walls = [[1, 1], [2, 1], [3, 1], [3, 4], [4, 4], [1, 5], [2, 5]];
  return {
    rows: ROWS,
    cols: COLS,
    robot: { r: 0, c: 0 },
    candies: new Set(candies.map(([r, c]) => key(r, c))),
    walls: new Set(walls.map(([r, c]) => key(r, c))),
    eaten: 0,
    total: candies.length,
  };
}

function inBounds(g, r, c) {
  return r >= 0 && r < g.rows && c >= 0 && c < g.cols && !g.walls.has(key(r, c));
}

// Builds the cells once and keeps them by key; render() only toggles classes.
function mount(g, root) {
  const grid = root.querySelector("#grid");
  const status = root.querySelector("#status");
  const cells = new Map();
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell" + (g.walls.has(key(r, c)) ? " cell--wall" : "");
      cell.setAttribute("role", "gridcell");
      grid.appendChild(cell);
      cells.set(key(r, c), cell);
    }
  }
  function render() {
    for (const [k, cell] of cells) {
      cell.classList.toggle("cell--candy", g.candies.has(k));
      cell.classList.toggle("cell--robot", k === key(g.robot.r, g.robot.c));
    }
    status.textContent = g.eaten === g.total ? "All " + g.total + " candies eaten!" : "Eaten " + g.eaten + " of " + g.total;
  }
  return render;
}
`;

const robotVanillaStarter = `${robotShared}
/** One key press moves the robot one cell; returns whether it moved. */
function step(g, arrowKey) {
  // TODO: move in the arrow's direction unless the cell is a wall or off the
  // grid; eat the candy there if any.
  return false;
}

/** The path (cells after the start) to the nearest candy, or [] if none is reachable. */
function pathToNearestCandy(g) {
  // TODO: breadth-first search from the robot.
  return [];
}

const game = createGame();
const render = mount(game, document.getElementById("app"));
render();

document.addEventListener("keydown", (event) => {
  if (step(game, event.key)) {
    event.preventDefault();
    render();
  }
});

document.getElementById("auto").addEventListener("click", () => {
  // TODO: walk the path to the nearest candy one cell at a time.
});
`;

const robotVanillaSolution = `${robotShared}
function step(g, arrowKey) {
  const d = DIRS[arrowKey];
  if (!d) return false;
  const r = g.robot.r + d[0];
  const c = g.robot.c + d[1];
  if (!inBounds(g, r, c)) return false;
  g.robot = { r, c };
  if (g.candies.delete(key(r, c))) g.eaten++;
  return true;
}

function pathToNearestCandy(g) {
  const start = key(g.robot.r, g.robot.c);
  const prev = new Map([[start, null]]);
  const queue = [[g.robot.r, g.robot.c]];
  for (let head = 0; head < queue.length; head++) { // index pointer: no shift()
    const [r, c] = queue[head];
    const here = key(r, c);
    if (g.candies.has(here)) {
      const path = [];
      for (let k = here; k !== start; k = prev.get(k)) path.push(k.split(",").map(Number));
      return path.reverse();
    }
    for (const [dr, dc] of Object.values(DIRS)) {
      const nr = r + dr;
      const nc = c + dc;
      const k = key(nr, nc);
      if (inBounds(g, nr, nc) && !prev.has(k)) {
        prev.set(k, here);
        queue.push([nr, nc]);
      }
    }
  }
  return [];
}

const game = createGame();
const render = mount(game, document.getElementById("app"));
render();

document.addEventListener("keydown", (event) => {
  if (step(game, event.key)) {
    event.preventDefault();
    render();
  }
});

let walking = null;
document.getElementById("auto").addEventListener("click", () => {
  if (walking) return;
  const path = pathToNearestCandy(game);
  let i = 0;
  walking = setInterval(() => {
    if (i >= path.length) {
      clearInterval(walking);
      walking = null;
      return;
    }
    const [r, c] = path[i++];
    game.robot = { r, c };
    if (game.candies.delete(key(r, c))) game.eaten++;
    render();
  }, 150);
});
`;

export const snowflakeUiProblemsC: Problem[] = [
  {
    slug: "react-chessboard",
    title: "Chessboard in React",
    category: "frontend",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Derive the 64 squares in render — no board in state — then add selection and a move with one piece of state.",
    prompt: [
      "Render an 8 by 8 chessboard with the pieces in their starting positions, then make it interactive. The starter parses the start position into a `pieces` object keyed by `\"row,col\"` and gives you `squareName` and `pieceName` helpers.",
      "",
      "## Requirements",
      "",
      "- Squares alternate colours; `a8` (top-left) is light, like a real board.",
      "- Each square is a button labelled with its name and the piece on it (`\"e1, white king\"`), so the board reads correctly to a screen reader.",
      "- Clicking a square with a piece selects it (visibly highlighted); clicking another square moves the piece there, capturing whatever was on it; clicking the selected square again deselects.",
      "- The status line says what is selected.",
      "- Keep every update immutable.",
      "",
      "Follow-ups to be ready for: legal-move highlighting for one piece type, an `n` by `n` board from a prop, and undo.",
    ].join("\n"),
    hints: [
      "The board pattern needs no state. Map over `Array.from({ length: 64 })`, derive `row = Math.floor(i / 8)`, `col = i % 8`, and colour by `(row + col) % 2`.",
      "One `selected` state holding a square key is enough; a click either selects, moves, or clears depending on it.",
      "To move, copy the pieces object, write the piece under the new key, and delete the old key.",
    ],
    solution: [
      "## Approach",
      "",
      "The board is derived in render from the index of each square; only the piece positions and the selected square are state. A click with nothing selected selects a piece; a click with a selection moves the piece (an immutable copy with the key moved) or clears the selection when it is the same square. `aria-pressed` marks the selected button and the status line is a live region.",
      "",
      "## Worth saying out loud",
      "",
      "- Storing the board in state and filling it in an effect, as some tutorials do, is the anti-pattern to call out: derive what you can.",
      "- Legal moves would add a `moves(piece, from)` function and a highlight class; the data model does not change.",
      "- A real app would hold the position as a FEN string or a 64-entry array; the object keyed by square is the simplest thing that supports a move.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: chessReactStarter }, chessCss],
      solution: [{ name: "App.jsx", contents: chessReactSolution }, chessCss],
    },
  },
  {
    slug: "robot-eats-candies",
    title: "Robot Eats Candies on a Grid",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Keyboard movement with walls and edges, then a breadth-first path to the nearest candy walked one cell at a time.",
    prompt: [
      "A grid is already rendered, with walls, candies and a robot, and helper functions for cells are provided. Write the JavaScript that moves the robot and removes candies as it reaches them.",
      "",
      "## Requirements",
      "",
      "- Arrow keys move the robot one cell; walls and the grid edge block the move. A candy on the destination is eaten and the status line counts it.",
      "- The **Eat the nearest candy** button finds the shortest path to the closest reachable candy and walks it one cell at a time, eating on arrival.",
      "- When no candy is reachable the button does nothing.",
      "- Re-rendering only toggles classes on the existing cells; the grid is not rebuilt.",
      "",
      "Clarify first, as the reports differ: does the player drive the robot or does it move by itself? Here it is both.",
    ].join("\n"),
    hints: [
      "`step` is a direction lookup plus the `inBounds` check; `Set.delete` returns whether a candy was there, so it doubles as the eat check.",
      "Breadth-first search from the robot with a predecessor map; the first candy dequeued is the nearest, and walking the map back from it gives the path.",
      "Use an index pointer over the queue array instead of `shift()`, and a `setInterval` for the walk so each step renders.",
    ],
    solution: [
      "## Approach",
      "",
      "`step` applies the arrow's delta, rejects walls and edges, moves the robot and eats. `pathToNearestCandy` runs BFS over the grid as an implicit graph, storing one predecessor per cell; the first candy reached is the nearest, and the path is rebuilt from the predecessor map. The button walks that path with an interval, guarded so a second click does not start a second walk.",
      "",
      "## Worth saying out loud",
      "",
      "- Eating every candy in the shortest total route is a travelling-salesman problem; nearest-first is the practical answer.",
      "- Follow-ups: an animation loop with `requestAnimationFrame`, a score, and diagonal moves (add four more directions).",
      "- Keyboard handling on `document` is fine for a game; a focused grid with `tabIndex` is the accessible version.",
    ].join("\n"),
    ui: {
      framework: "vanilla",
      files: [robotHtml, { name: "script.js", contents: robotVanillaStarter }, robotCss],
      solution: [robotHtml, { name: "script.js", contents: robotVanillaSolution }, robotCss],
    },
  },
];
