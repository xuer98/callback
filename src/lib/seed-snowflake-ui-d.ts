import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part D: two of GreatFrontEnd's grid games the
// recruiter's email points at — Grid Lights and a memory game — in React,
// each with one template and complete reference files.

const BASE_CSS = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}
`;

// -- grid lights (React) ------------------------------------------------------

const lightsCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.lights {
  padding: 16px;
}

.lights__grid {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  gap: 8px;
}

.cell {
  width: 72px;
  height: 72px;
  border: 2px solid #a1a1aa;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: background 120ms;
}

.cell[aria-pressed="true"] {
  background: #22c55e;
  border-color: #16a34a;
}

.cell:disabled {
  cursor: default;
}

.cell--gap {
  visibility: hidden;
}

.lights__status {
  margin: 12px 0 0;
  color: #52525b;
}
`,
};

const lightsShared = `// 1 is a cell, 0 is a gap; the classic layout leaves the centre empty.
const LAYOUT = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1],
];
const CELL_COUNT = LAYOUT.flat().filter(Boolean).length;
`;

const lightsReactStarter = `import { useState } from "react";

${lightsShared}
export default function App() {
  // TODO: light a cell when it is clicked, remember the order, and once every
  // cell is lit switch them off one at a time in reverse order.
  return (
    <main className="lights">
      <div className="lights__grid" role="grid" aria-label="Grid lights">
        {LAYOUT.flat().map((isCell, index) =>
          isCell ? (
            <button key={index} type="button" role="gridcell" className="cell" aria-pressed={false} aria-label={"Cell " + (index + 1)} />
          ) : (
            <span key={index} className="cell cell--gap" aria-hidden="true" />
          ),
        )}
      </div>
      <p className="lights__status">0 of {CELL_COUNT} lit</p>
    </main>
  );
}
`;

const lightsReactSolution = `import { useEffect, useState } from "react";

${lightsShared}
export default function App() {
  const [lit, setLit] = useState([]); // cell indices in the order they were lit
  const [draining, setDraining] = useState(false);

  // Once every cell is lit, switch them off one at a time in reverse order.
  // Each timeout removes the last-lit cell; the effect re-arms until empty.
  useEffect(() => {
    if (!draining) return;
    if (lit.length === 0) {
      setDraining(false);
      return;
    }
    const timer = setTimeout(() => setLit((order) => order.slice(0, -1)), 300);
    return () => clearTimeout(timer);
  }, [draining, lit]);

  function light(index) {
    if (draining || lit.includes(index)) return;
    const next = [...lit, index];
    setLit(next);
    if (next.length === CELL_COUNT) setDraining(true);
  }

  return (
    <main className="lights">
      <div className="lights__grid" role="grid" aria-label="Grid lights">
        {LAYOUT.flat().map((isCell, index) =>
          isCell ? (
            <button
              key={index}
              type="button"
              role="gridcell"
              className="cell"
              aria-pressed={lit.includes(index)}
              aria-label={"Cell " + (index + 1)}
              disabled={draining}
              onClick={() => light(index)}
            />
          ) : (
            <span key={index} className="cell cell--gap" aria-hidden="true" />
          ),
        )}
      </div>
      <p className="lights__status" aria-live="polite">
        {draining ? "Switching off..." : lit.length + " of " + CELL_COUNT + " lit"}
      </p>
    </main>
  );
}
`;

// -- memory game (React) ------------------------------------------------------

const memoryCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.memory {
  padding: 16px;
}

.memory__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.memory__bar button {
  padding: 6px 12px;
  border: 0;
  border-radius: 6px;
  background: #18181b;
  color: white;
  font: inherit;
  cursor: pointer;
}

.memory__grid {
  display: grid;
  grid-template-columns: repeat(4, 64px);
  gap: 8px;
}

.card {
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: 10px;
  background: #4f46e5;
  color: white;
  font-size: 28px;
  cursor: pointer;
  transition: background 150ms;
}

.card--up {
  background: white;
  color: #18181b;
  box-shadow: inset 0 0 0 2px #a1a1aa;
}

.card--matched {
  background: #dcfce7;
  box-shadow: inset 0 0 0 2px #22c55e;
  cursor: default;
}
`,
};

const memoryShared = `const FACES = ["\\u2605", "\\u25CF", "\\u25B2", "\\u25A0", "\\u2665", "\\u2663", "\\u2666", "\\u2660"];

/** Two cards per face, shuffled (Fisher-Yates). */
function shuffledDeck() {
  const cards = [...FACES, ...FACES].map((face, id) => ({ id, face }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
`;

const memoryReactStarter = `import { useState } from "react";

${memoryShared}
export default function App() {
  const [cards, setCards] = useState(shuffledDeck);
  // TODO: flip cards two at a time, keep matched pairs face up, flip
  // mismatches back after a moment, count moves, and detect the win.
  return (
    <main className="memory">
      <div className="memory__bar">
        <span>Moves: 0</span>
        <button type="button" onClick={() => setCards(shuffledDeck())}>New game</button>
      </div>
      <div className="memory__grid">
        {cards.map((card, index) => (
          <button key={card.id} type="button" className="card" aria-label={"Card " + (index + 1) + ", face down"}>
            ?
          </button>
        ))}
      </div>
    </main>
  );
}
`;

const memoryReactSolution = `import { useEffect, useState } from "react";

${memoryShared}
export default function App() {
  const [cards, setCards] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState([]); // ids face up but not yet matched, at most two
  const [matched, setMatched] = useState(() => new Set()); // faces found
  const [moves, setMoves] = useState(0);

  // Two cards up: either they match and stay, or they turn back after a beat.
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped.map((id) => cards.find((card) => card.id === id));
    if (a.face === b.face) {
      setMatched((prev) => new Set([...prev, a.face]));
      setFlipped([]);
      return;
    }
    const timer = setTimeout(() => setFlipped([]), 800);
    return () => clearTimeout(timer);
  }, [flipped, cards]);

  function flip(card) {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.has(card.face)) return;
    if (flipped.length === 1) setMoves((count) => count + 1);
    setFlipped([...flipped, card.id]);
  }

  function reset() {
    setCards(shuffledDeck());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
  }

  const won = matched.size === FACES.length;

  return (
    <main className="memory">
      <div className="memory__bar">
        <span aria-live="polite">{won ? "You won in " + moves + " moves!" : "Moves: " + moves}</span>
        <button type="button" onClick={reset}>New game</button>
      </div>
      <div className="memory__grid">
        {cards.map((card, index) => {
          const isMatched = matched.has(card.face);
          const up = isMatched || flipped.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={"card" + (up ? " card--up" : "") + (isMatched ? " card--matched" : "")}
              aria-label={"Card " + (index + 1) + (up ? ", face up: " + card.face : ", face down")}
              disabled={isMatched}
              onClick={() => flip(card)}
            >
              {up ? card.face : "?"}
            </button>
          );
        })}
      </div>
    </main>
  );
}
`;

export const snowflakeUiProblemsD: Problem[] = [
  {
    slug: "grid-lights",
    title: "Grid Lights",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Remember the order cells were lit; when all are lit, a self-re-arming timeout switches them off in reverse.",
    prompt: [
      "Build the Grid Lights game: a 3 by 3 grid with the centre missing. Clicking a cell lights it green. When every cell is lit, the cells switch off one at a time, in the reverse of the order they were lit, 300 ms apart.",
      "",
      "## Requirements",
      "",
      "- A lit cell stays lit when clicked again; nothing else changes.",
      "- While the cells are switching off, clicks are ignored (the buttons are disabled).",
      "- The status line shows how many cells are lit, or that the grid is switching off.",
      "- Timers are cleaned up if the component unmounts mid-sequence.",
      "- The gap renders as an invisible cell so the layout stays a grid.",
    ].join("\n"),
    hints: [
      "Keep the lit cells as an array of indices in click order; the reverse order is then free.",
      "Drive the switch-off with an effect: while `draining` and the array is non-empty, set one timeout that drops the last index, and return a cleanup that clears it. The state change re-runs the effect for the next step.",
    ],
    solution: [
      "## Approach",
      "",
      "State is the ordered list of lit indices plus a `draining` flag. A click appends an index (ignored if present or draining) and sets `draining` when the list is full. One effect watches `draining` and the list: each run schedules a single timeout that removes the last index, and clears it on cleanup; when the list empties, draining ends.",
      "",
      "## Worth saying out loud",
      "",
      "- A single `setInterval` also works but needs a ref to the latest order; one timeout per step keeps the effect pure and cleanup trivial.",
      "- The layout array (1s and 0s) makes other shapes a data change; the count of real cells is derived from it.",
      "- `aria-pressed` on each cell gives the lit state to assistive tech.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: lightsReactStarter }, lightsCss],
      solution: [{ name: "App.jsx", contents: lightsReactSolution }, lightsCss],
    },
  },
  {
    slug: "memory-game",
    title: "Memory Game",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A shuffled deck, at most two face-up ids, a set of matched faces, and one effect that resolves each pair.",
    prompt: [
      "Build a memory game: 16 cards (8 pairs) face down in a 4 by 4 grid. The starter shuffles a deck of `{ id, face }` cards.",
      "",
      "## Requirements",
      "",
      "- Clicking a face-down card turns it up. With two cards up, a matching pair stays up (and its cards are disabled); a mismatch turns both back after about 800 ms.",
      "- While two cards are up, further clicks are ignored.",
      "- Count moves (one move per pair turned) and announce the win with the move count.",
      "- **New game** reshuffles and resets everything.",
      "- Cards are buttons with labels that say whether they are face up and what they show.",
    ].join("\n"),
    hints: [
      "Store the face-up cards as an array of ids (at most two) and matched pairs as a set of faces; a card is shown face up if either holds it.",
      "Resolve a pair in an effect that runs when the face-up array reaches two: match → move to the set, mismatch → a timeout clears the array, with cleanup.",
      "Fisher–Yates shuffles in place; wrap the deck creation in a function so New game can call it again.",
    ],
    solution: [
      "## Approach",
      "",
      "The deck is state so it can be reshuffled. Clicking pushes an id into `flipped` unless two are up or the card is already up or matched. An effect watches `flipped`: with two ids it compares faces, adds a match to the `matched` set, or schedules a timeout to turn mismatches back. The win is derived: every face matched.",
      "",
      "## Worth saying out loud",
      "",
      "- The 800 ms pause is where state bugs hide: the effect's cleanup cancels the flip-back if a new game starts mid-pause.",
      "- A timer or best-score persisted to `localStorage` are the usual follow-ups.",
      "- Disabling matched cards is both a UX nicety and what keeps the click handler simple.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: memoryReactStarter }, memoryCss],
      solution: [{ name: "App.jsx", contents: memoryReactSolution }, memoryCss],
    },
  },
];
