import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part E: two more of GreatFrontEnd's grid
// games — Whack-a-Mole and Selectable Cells — in React, each with one
// template and complete reference files.

const BASE_CSS = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}
`;

// -- whack-a-mole (React) -----------------------------------------------------

const moleCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.mole {
  padding: 16px;
}

.mole__bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.mole__bar button {
  padding: 6px 12px;
  border: 0;
  border-radius: 6px;
  background: #18181b;
  color: white;
  font: inherit;
  cursor: pointer;
}

.mole__grid {
  display: grid;
  grid-template-columns: repeat(3, 80px);
  gap: 10px;
}

.hole {
  width: 80px;
  height: 80px;
  border: 0;
  border-radius: 50%;
  background: #78350f;
  box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.4);
  font-size: 36px;
  cursor: pointer;
}

.hole--mole {
  background: #b45309;
}
`,
};

const moleShared = `const HOLES = 9;
const ROUND_SECONDS = 20;
const MOLE_INTERVAL = 700;
const MOLE = "\\uD83D\\uDC39";
`;

const moleReactStarter = `import { useState } from "react";

${moleShared}
export default function App() {
  const [score, setScore] = useState(0);
  // TODO: a Start button runs a 20-second round; a mole hops to a random
  // hole every 700 ms; clicking the hole with the mole scores a point.
  return (
    <main className="mole">
      <div className="mole__bar">
        <button type="button">Start</button>
        <span>Score: {score}</span>
        <span>Time: {ROUND_SECONDS}s</span>
      </div>
      <div className="mole__grid">
        {Array.from({ length: HOLES }, (_, index) => (
          <button key={index} type="button" className="hole" aria-label={"Hole " + (index + 1)} />
        ))}
      </div>
    </main>
  );
}
`;

const moleReactSolution = `import { useEffect, useState } from "react";

${moleShared}
export default function App() {
  const [running, setRunning] = useState(false);
  const [mole, setMole] = useState(null); // the hole showing the mole, or null
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);

  // Both timers live only while a round runs; the cleanup stops them.
  useEffect(() => {
    if (!running) return;
    const hop = setInterval(() => {
      setMole((current) => {
        let next = current;
        while (next === current) next = Math.floor(Math.random() * HOLES);
        return next;
      });
    }, MOLE_INTERVAL);
    const tick = setInterval(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => {
      clearInterval(hop);
      clearInterval(tick);
    };
  }, [running]);

  // Ending the round is a state transition driven by the clock reaching zero.
  useEffect(() => {
    if (secondsLeft === 0) {
      setRunning(false);
      setMole(null);
    }
  }, [secondsLeft]);

  function start() {
    setScore(0);
    setSecondsLeft(ROUND_SECONDS);
    setMole(null);
    setRunning(true);
  }

  function whack(index) {
    if (!running || index !== mole) return;
    setScore((points) => points + 1);
    setMole(null); // the mole hides until the next hop
  }

  return (
    <main className="mole">
      <div className="mole__bar">
        <button type="button" onClick={start} disabled={running}>
          {running ? "Playing..." : "Start"}
        </button>
        <span aria-live="polite">Score: {score}</span>
        <span>Time: {secondsLeft}s</span>
        {!running && secondsLeft === 0 && <span>Round over!</span>}
      </div>
      <div className="mole__grid">
        {Array.from({ length: HOLES }, (_, index) => (
          <button
            key={index}
            type="button"
            className={"hole" + (mole === index ? " hole--mole" : "")}
            aria-label={"Hole " + (index + 1) + (mole === index ? ", mole!" : "")}
            onClick={() => whack(index)}
          >
            {mole === index ? MOLE : ""}
          </button>
        ))}
      </div>
    </main>
  );
}
`;

// -- selectable cells (React) -------------------------------------------------

const selectCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.select {
  padding: 16px;
}

.select__status {
  margin: 0 0 12px;
}

.select__grid {
  display: grid;
  grid-template-columns: repeat(10, 32px);
  gap: 4px;
  user-select: none;
  touch-action: none;
}

.cell {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #e4e4e7;
}

.cell--selected {
  background: #4f46e5;
}
`,
};

const selectShared = `const ROWS = 8;
const COLS = 10;
`;

const selectReactStarter = `${selectShared}
export default function App() {
  // TODO: press on a cell and drag to select the rectangle between the first
  // cell and the one under the pointer; show how many cells are selected.
  return (
    <main className="select">
      <p className="select__status">0 cells selected</p>
      <div className="select__grid" role="grid" aria-label="Selectable cells">
        {Array.from({ length: ROWS * COLS }, (_, index) => (
          <div key={index} role="gridcell" className="cell" aria-selected={false} />
        ))}
      </div>
    </main>
  );
}
`;

const selectReactSolution = `import { useEffect, useState } from "react";

${selectShared}
export default function App() {
  const [anchor, setAnchor] = useState(null); // [row, col] where the drag started
  const [corner, setCorner] = useState(null); // [row, col] under the pointer now
  const [dragging, setDragging] = useState(false);

  // The pointer may be released anywhere, so listen on the document.
  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    document.addEventListener("pointerup", stop);
    return () => document.removeEventListener("pointerup", stop);
  }, [dragging]);

  const bounds = anchor && corner && {
    top: Math.min(anchor[0], corner[0]),
    bottom: Math.max(anchor[0], corner[0]),
    left: Math.min(anchor[1], corner[1]),
    right: Math.max(anchor[1], corner[1]),
  };
  const isSelected = (row, col) =>
    Boolean(bounds) && row >= bounds.top && row <= bounds.bottom && col >= bounds.left && col <= bounds.right;
  const count = bounds ? (bounds.bottom - bounds.top + 1) * (bounds.right - bounds.left + 1) : 0;

  return (
    <main className="select">
      <p className="select__status" aria-live="polite">{count} cells selected</p>
      <div className="select__grid" role="grid" aria-label="Selectable cells">
        {Array.from({ length: ROWS * COLS }, (_, index) => {
          const row = Math.floor(index / COLS);
          const col = index % COLS;
          const selected = isSelected(row, col);
          return (
            <div
              key={index}
              role="gridcell"
              aria-selected={selected}
              className={"cell" + (selected ? " cell--selected" : "")}
              onPointerDown={() => {
                setAnchor([row, col]);
                setCorner([row, col]);
                setDragging(true);
              }}
              onPointerEnter={() => {
                if (dragging) setCorner([row, col]);
              }}
            />
          );
        })}
      </div>
    </main>
  );
}
`;

export const snowflakeUiProblemsE: Problem[] = [
  {
    slug: "whack-a-mole",
    title: "Whack-a-Mole",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Two intervals owned by one effect keyed on the running flag, and a round that ends when the clock hits zero.",
    prompt: [
      "Build Whack-a-Mole: nine holes, a Start button, a 20-second round. While a round runs, a mole appears in a random hole every 700 ms (never the same hole twice in a row). Clicking the hole with the mole scores a point and the mole hides until the next hop.",
      "",
      "## Requirements",
      "",
      "- The countdown and score are visible; the round ends at zero and shows a round-over message.",
      "- Start is disabled during a round; pressing it afterwards resets the score and clock.",
      "- The timers stop when the round ends and when the component unmounts.",
      "- Clicking an empty hole does nothing.",
      "- Holes are buttons whose labels say when they hold the mole.",
    ].join("\n"),
    hints: [
      "One effect depending on `running` starts both intervals (mole hop, clock tick) and clears both in its cleanup.",
      "Use the functional form of `setMole` to pick a hole different from the current one; the interval callback must not read stale state.",
      "A second effect turns `secondsLeft === 0` into \"stop the round\", so the end condition lives in one place.",
    ],
    solution: [
      "## Approach",
      "",
      "State: `running`, the mole's hole, the score, and seconds left. An effect keyed on `running` sets up the hop interval and the one-second tick, and its cleanup clears them, so stopping the round or unmounting kills the timers. A second effect reacts to the clock reaching zero. Clicks score only when the clicked hole matches the mole, then hide it.",
      "",
      "## Worth saying out loud",
      "",
      "- Reading `mole` inside the interval callback would be stale; the updater function form avoids that.",
      "- A difficulty follow-up (faster hops over time) is a derived interval length from the elapsed time; several simultaneous moles is a set instead of an index.",
      "- Keyboard play (number keys 1–9) is a document keydown listener in the same effect.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: moleReactStarter }, moleCss],
      solution: [{ name: "App.jsx", contents: moleReactSolution }, moleCss],
    },
  },
  {
    slug: "selectable-cells",
    title: "Selectable Cells",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Two corners in state and a derived rectangle; pointer events on cells plus one document listener for the release.",
    prompt: [
      "Build a grid of 8 by 10 cells where the user can select a rectangle by pressing on one cell and dragging to another.",
      "",
      "## Requirements",
      "",
      "- The selection is every cell inside the rectangle spanned by the cell where the press started and the cell currently under the pointer, in any drag direction.",
      "- The selection updates live while dragging and stays after release.",
      "- Starting a new press replaces the previous selection.",
      "- The status line shows the number of selected cells.",
      "- No text gets selected while dragging, and it works with a mouse and a touch pointer.",
    ].join("\n"),
    hints: [
      "Store only the anchor cell and the current corner cell; whether any cell is selected is derived from the min/max of their rows and columns.",
      "`onPointerDown` on a cell sets both corners and a dragging flag; `onPointerEnter` updates the corner while dragging; a `pointerup` listener on the document ends the drag.",
      "`user-select: none` and `touch-action: none` on the grid keep the browser from selecting text or scrolling instead.",
    ],
    solution: [
      "## Approach",
      "",
      "State is the anchor, the current corner, and a dragging flag. Each cell derives its selected state from the rectangle between the two corners, so the render has no per-cell state and the count is arithmetic on the corners. The document-level `pointerup` listener, attached only while dragging, ends the gesture wherever the pointer is released.",
      "",
      "## Worth saying out loud",
      "",
      "- A per-cell `selected` array would need updating on every pointer move; deriving from two corners is O(1) per update.",
      "- For large grids, event delegation on the grid container with `dataset` coordinates replaces 80 handlers with one.",
      "- Keyboard selection (shift + arrows) is a follow-up on the same two-corner model.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: selectReactStarter }, selectCss],
      solution: [{ name: "App.jsx", contents: selectReactSolution }, selectCss],
    },
  },
];
