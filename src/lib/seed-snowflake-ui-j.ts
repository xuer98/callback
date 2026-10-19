import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part J: the grid-path game the recruiter's
// note calls the most likely frontend question — Unique Paths with
// obstacles wrapped in a small React UI — with one template and complete
// reference files.

const pathsCss: UiFile = {
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
  gap: 3px;
  margin-bottom: 12px;
}

.cell {
  width: 44px;
  height: 44px;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
  background: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.cell--blocked {
  background: #27272a;
  border-color: #27272a;
}

.cell--path {
  background: #fde68a;
  border-color: #f59e0b;
}

.cell--end {
  color: #2563eb;
}
`,
};

const pathsShared = `const ROWS = 5;
const COLS = 6;

const makeGrid = (rows, cols) => Array.from({ length: rows }, () => new Array(cols).fill(0));
`;

const pathsReactStarter = `import { useMemo, useReducer } from "react";

${pathsShared}
// TODO: count the right/down routes from the top-left to the bottom-right over open cells (0).
function uniquePathsWithObstacles(grid) {
  return 0;
}

// TODO: one right/down route over open cells as [row, col] pairs, or null when none exists.
function findPath(grid) {
  return null;
}

// TODO: TOGGLE flips a cell's obstacle (never the start or home cell); RESET clears the grid.
function reducer(grid, action) {
  return grid;
}

export default function App() {
  const [grid, dispatch] = useReducer(reducer, [ROWS, COLS], ([rows, cols]) => makeGrid(rows, cols));
  const count = useMemo(() => uniquePathsWithObstacles(grid), [grid]);
  const onPath = useMemo(() => new Set((findPath(grid) ?? []).map(([r, c]) => r + "," + c)), [grid]);

  // TODO: render the status line, one button per cell (click toggles an
  // obstacle, the route is highlighted), and the Reset button.
  return (
    <main className="game">
      <p className="game__status" role="status"></p>
      <div className="grid" role="grid" aria-label="Robot grid" style={{ gridTemplateColumns: "repeat(" + COLS + ", 44px)" }} />
      <button type="button" onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </main>
  );
}
`;

const pathsReactSolution = `import { useMemo, useReducer } from "react";

${pathsShared}
// One row of DP: a blocked cell contributes 0; an open cell adds the count from above and from the left.
function uniquePathsWithObstacles(grid) {
  const cols = grid[0].length;
  const row = new Array(cols).fill(0);
  row[0] = grid[0][0] === 0 ? 1 : 0;
  for (const cells of grid) {
    for (let c = 0; c < cols; c++) {
      if (cells[c] === 1) row[c] = 0;
      else if (c > 0) row[c] += row[c - 1];
    }
  }
  return row[cols - 1];
}

// Mark, from home backwards, which cells can still reach it; then walk from the start preferring down.
function findPath(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const ok = Array.from({ length: rows }, () => new Array(cols).fill(false));
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      if (grid[r][c] === 1) continue;
      ok[r][c] = (r === rows - 1 && c === cols - 1) || (r + 1 < rows && ok[r + 1][c]) || (c + 1 < cols && ok[r][c + 1]);
    }
  }
  if (!ok[0][0]) return null;
  const path = [[0, 0]];
  let r = 0;
  let c = 0;
  while (r !== rows - 1 || c !== cols - 1) {
    if (r + 1 < rows && ok[r + 1][c]) r++;
    else c++;
    path.push([r, c]);
  }
  return path;
}

function reducer(grid, action) {
  switch (action.type) {
    case "TOGGLE": {
      const { r, c } = action;
      const isStart = r === 0 && c === 0;
      const isHome = r === grid.length - 1 && c === grid[0].length - 1;
      if (isStart || isHome) return grid; // the ends stay open
      return grid.map((row, i) => (i === r ? row.map((v, j) => (j === c ? 1 - v : v)) : row));
    }
    case "RESET":
      return makeGrid(grid.length, grid[0].length);
    default:
      return grid;
  }
}

export default function App() {
  const [grid, dispatch] = useReducer(reducer, [ROWS, COLS], ([rows, cols]) => makeGrid(rows, cols));
  const count = useMemo(() => uniquePathsWithObstacles(grid), [grid]);
  const onPath = useMemo(() => new Set((findPath(grid) ?? []).map(([r, c]) => r + "," + c)), [grid]);

  return (
    <main className="game">
      <p className="game__status" role="status">
        {count === 0 ? "Home is unreachable." : count + (count === 1 ? " route" : " routes") + " home."}
      </p>
      <div className="grid" role="grid" aria-label="Robot grid" style={{ gridTemplateColumns: "repeat(" + COLS + ", 44px)" }}>
        {grid.flatMap((row, r) =>
          row.map((blocked, c) => {
            const isStart = r === 0 && c === 0;
            const isHome = r === ROWS - 1 && c === COLS - 1;
            const key = r + "," + c;
            const role = isStart ? ", start" : isHome ? ", home" : blocked ? ", obstacle" : "";
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-label={"Row " + (r + 1) + ", column " + (c + 1) + role}
                aria-pressed={blocked === 1}
                className={"cell" + (blocked ? " cell--blocked" : "") + (onPath.has(key) ? " cell--path" : "") + (isStart || isHome ? " cell--end" : "")}
                onClick={() => dispatch({ type: "TOGGLE", r, c })}
              >
                {isStart ? "R" : isHome ? "H" : ""}
              </button>
            );
          }),
        )}
      </div>
      <button type="button" onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </main>
  );
}
`;

export const snowflakeUiProblemsJ: Problem[] = [
  {
    slug: "unique-paths-grid-game",
    title: "Unique Paths Grid Game",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "A grid of obstacle toggles in a reducer, with the route count and one highlighted route derived from the grid rather than stored.",
    prompt: [
      "Build the grid game behind Unique Paths in React. A robot starts at the top-left cell and walks only right or down to its home at the bottom-right. The starter renders an empty grid; make it a game.",
      "",
      "## Requirements",
      "",
      "- Clicking a cell toggles an obstacle on it; the start and home cells cannot be blocked.",
      "- A status line shows how many distinct routes reach home, updated after every click, and says so when home is unreachable.",
      "- While at least one route exists, one of them is highlighted on the grid, moving only right and down over open cells.",
      '- "Reset" clears every obstacle.',
      "- Keep the grid immutable in state, and derive the count and the route from it rather than storing them.",
      "- Cells are buttons with `aria-pressed` for the obstacle state and a label naming the cell; the status line is a live region.",
      "",
      "Follow-ups to be ready for: per-row and per-column costs with the cheapest route shown, animating the robot along the route, and a grid so large that the count overflows or the cells cannot all be rendered.",
    ].join("\n"),
    hints: [
      "`uniquePathsWithObstacles(grid)` is one row of dynamic programming: a blocked cell contributes 0; every other cell adds the count from above (already in the row) and from the left.",
      "For the route, mark from the far corner which cells can still reach home, then walk from the start choosing down whenever that stays on a reachable cell, otherwise right.",
      "A reducer with `TOGGLE` and `RESET` keeps the grid immutable; `useMemo` on the grid gives the count and the route without a second piece of state.",
    ],
    solution: [
      "## Approach",
      "",
      "The grid is the only state: a 2-D array of 0 and 1 held in a reducer whose `TOGGLE` returns a new grid with one cell flipped, refusing the start and home cells, and whose `RESET` rebuilds an empty grid. Everything shown is derived. `uniquePathsWithObstacles` runs the one-row DP over the grid; `findPath` marks, from the home cell backwards, which cells can still reach it, then walks forward from the start preferring down. Both are memoised on the grid, so a click costs one pass over rows × columns and nothing can fall out of step.",
      "",
      "## Worth saying out loud",
      "",
      "- Storing the count in state and updating it in an effect is the anti-pattern to name: it renders once stale and is one more thing to keep in sync.",
      "- The count is a number of combinations and overflows a double around a 60 by 60 grid; switch to `BigInt` or report it modulo a prime, and say which before you are asked.",
      "- Per-row and per-column costs turn the count into a cheapest route. Without obstacles the cost of any right-and-down route is fixed by the rows and columns it crosses, so it is a sum; with obstacles it becomes a shortest-path search.",
      "- Animating the robot is a `setInterval` over the route, cleared on unmount; a huge grid renders only the visible window.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: pathsReactStarter }, pathsCss],
      solution: [{ name: "App.jsx", contents: pathsReactSolution }, pathsCss],
    },
  },
];
