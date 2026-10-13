import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, reported for frontend-role screens, part A:
// a kanban board in React. One template with complete reference files; the
// preview has no network, so the data lives in the file. The grid game is
// seed-snowflake-ui-b.ts.

// -- kanban board (React) -----------------------------------------------------

const kanbanCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.board {
  display: flex;
  gap: 12px;
  padding: 16px;
  align-items: flex-start;
  overflow-x: auto;
}

.column {
  flex: 1 0 220px;
  background: #e4e4e7;
  border-radius: 10px;
  padding: 10px;
  min-height: 160px;
}

.column h2 {
  margin: 0 0 8px;
  font-size: 15px;
  display: flex;
  justify-content: space-between;
}

.count {
  font-weight: normal;
  color: #52525b;
}

.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 24px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: grab;
}

.card--dragging {
  opacity: 0.4;
}

.card__actions button {
  border: 0;
  background: #f4f4f5;
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
}

.card__actions button:disabled {
  opacity: 0.3;
  cursor: default;
}

.add {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.add input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
  font: inherit;
}

.add button {
  padding: 6px 10px;
  border: 0;
  border-radius: 6px;
  background: #18181b;
  color: white;
  font: inherit;
  cursor: pointer;
}
`,
};

const kanbanData = `const INITIAL_COLUMNS = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: 1, title: "Write the brief" },
      { id: 2, title: "Pick a palette" },
      { id: 3, title: "Book the kickoff" },
    ],
  },
  { id: "doing", title: "In progress", cards: [{ id: 4, title: "Build the board" }] },
  { id: "done", title: "Done", cards: [{ id: 5, title: "Set up the repo" }] },
];
`;

const kanbanReactStarter = `import { useState } from "react";

${kanbanData}
export default function App() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  // TODO: add a card to a column, move cards with the buttons and by drag
  // and drop, and keep every update immutable.
  return (
    <main className="board" aria-label="Kanban board">
      {columns.map((column) => (
        <section className="column" key={column.id} aria-labelledby={column.id + "-title"}>
          <h2 id={column.id + "-title"}>
            {column.title} <span className="count">{column.cards.length}</span>
          </h2>
          <ul className="cards">
            {column.cards.map((card) => (
              <li className="card" key={card.id}>
                {card.title}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
`;

const kanbanReactSolution = `import { useState } from "react";

${kanbanData}
let nextId = 100;

// Removes the card from wherever it is and inserts it into column toId,
// before beforeId or at the end. Returns new objects only along the path
// that changed.
function moveCard(columns, cardId, toId, beforeId) {
  const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
  if (!card || cardId === beforeId) return columns;
  return columns.map((column) => {
    const cards = column.cards.filter((c) => c.id !== cardId);
    if (column.id !== toId) {
      return cards.length === column.cards.length ? column : { ...column, cards };
    }
    const index = beforeId == null ? -1 : cards.findIndex((c) => c.id === beforeId);
    const at = index === -1 ? cards.length : index;
    return { ...column, cards: [...cards.slice(0, at), card, ...cards.slice(at)] };
  });
}

export default function App() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [drafts, setDrafts] = useState({});
  const [dragging, setDragging] = useState(null);

  function addCard(columnId) {
    const title = (drafts[columnId] || "").trim();
    if (!title) return;
    const card = { id: nextId++, title };
    setColumns((cols) => cols.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, card] } : c)));
    setDrafts((d) => ({ ...d, [columnId]: "" }));
  }

  function shift(cardId, columnIndex, direction) {
    const target = columns[columnIndex + direction];
    if (!target) return;
    setColumns((cols) => moveCard(cols, cardId, target.id, null));
  }

  function drop(event, toId, beforeId) {
    event.preventDefault();
    event.stopPropagation();
    const id = Number(event.dataTransfer.getData("text/plain")) || dragging;
    if (id == null) return;
    setColumns((cols) => moveCard(cols, id, toId, beforeId));
    setDragging(null);
  }

  return (
    <main className="board" aria-label="Kanban board">
      {columns.map((column, columnIndex) => (
        <section
          className="column"
          key={column.id}
          aria-labelledby={column.id + "-title"}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => drop(e, column.id, null)}
        >
          <h2 id={column.id + "-title"}>
            {column.title} <span className="count">{column.cards.length}</span>
          </h2>
          <ul className="cards">
            {column.cards.map((card) => (
              <li
                className={"card" + (dragging === card.id ? " card--dragging" : "")}
                key={card.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(card.id));
                  e.dataTransfer.effectAllowed = "move";
                  setDragging(card.id);
                }}
                onDragEnd={() => setDragging(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => drop(e, column.id, card.id)}
              >
                <span className="card__title">{card.title}</span>
                <span className="card__actions">
                  <button
                    type="button"
                    aria-label={"Move " + card.title + " left"}
                    disabled={columnIndex === 0}
                    onClick={() => shift(card.id, columnIndex, -1)}
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    aria-label={"Move " + card.title + " right"}
                    disabled={columnIndex === columns.length - 1}
                    onClick={() => shift(card.id, columnIndex, 1)}
                  >
                    &rarr;
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <form
            className="add"
            onSubmit={(e) => {
              e.preventDefault();
              addCard(column.id);
            }}
          >
            <input
              aria-label={"New card in " + column.title}
              placeholder="Add a card"
              value={drafts[column.id] || ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [column.id]: e.target.value }))}
            />
            <button type="submit">Add</button>
          </form>
        </section>
      ))}
    </main>
  );
}
`;

export const snowflakeUiProblems: Problem[] = [
  {
    slug: "kanban-board",
    title: "Kanban Board",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Columns of cards with immutable moves: one pure moveCard function serves the buttons and the drag-and-drop alike.",
    prompt: [
      "Build a kanban board with three columns — To do, In progress, Done — from the data in the starter. Cards can be added to a column and moved between columns.",
      "",
      "## Requirements",
      "",
      "- Each column shows its title, its card count, and its cards in order.",
      "- A form at the bottom of each column adds a card with the typed title; blank titles are ignored and the input clears after adding.",
      "- Every card has left and right buttons that move it to the neighbouring column (disabled at the edges), so the board works without a mouse.",
      "- Cards can also be dragged: dropping on a column appends the card; dropping on another card inserts before it. Dropping on a card in the same column reorders.",
      "- All updates are **immutable**: replace the column and card arrays, never mutate them.",
      "- The buttons carry `aria-label`s naming the card and direction; the column headings label their sections.",
    ].join("\n"),
    hints: [
      "Write one pure `moveCard(columns, cardId, toColumnId, beforeCardId)` that filters the card out of every column and inserts it at the right index of the target; both the buttons and the drop handler call it.",
      "HTML5 drag and drop needs `draggable`, `onDragStart` storing the card id in `dataTransfer`, `onDragOver` calling `preventDefault()` (otherwise drop never fires), and `onDrop` on both cards and columns — stop propagation on the card so the column handler does not also run.",
      "Keep the per-column draft text in one object keyed by column id so the inputs stay controlled without a component per column.",
    ],
    solution: [
      "## Approach",
      "",
      "State is the array of columns, each with its cards. A single pure function moves a card: remove it from whichever column holds it, then insert it into the target column before a given card or at the end. The arrow buttons call it with the neighbouring column; the drop handlers call it with the column (append) or the card dropped on (insert before). Drag start writes the card id into `dataTransfer`, drag over prevents the default so drop can fire, and the card's drop handler stops propagation so the column's handler does not move the card twice.",
      "",
      "## Worth saying out loud",
      "",
      "- Immutability is what keeps React rendering correctly and what makes undo trivial later: keep a history of column arrays.",
      "- The buttons are not a fallback; they are the accessible path. Drag and drop has no keyboard story in the HTML5 API.",
      "- Extensions: persist to `localStorage`, edit a card inline, a column limit (WIP cap) that disables drops when full, and TypeScript types for `Column` and `Card` if the template allowed them.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: kanbanReactStarter }, kanbanCss],
      solution: [{ name: "App.jsx", contents: kanbanReactSolution }, kanbanCss],
    },
  },
];
