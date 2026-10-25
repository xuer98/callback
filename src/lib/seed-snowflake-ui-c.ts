import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part C: the two prompts the recruiter's email
// and the reports name for the frontend hour — a chessboard in React and a
// robot that eats candies on a grid in plain JavaScript (the robot lives in
// seed-snowflake-ui-robot.ts). Each has one template with complete reference
// files.

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
];
