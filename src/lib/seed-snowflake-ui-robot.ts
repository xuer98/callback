import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part C continued: the robot that eats candies
// on a grid, in plain JavaScript, with one template and complete reference
// files. Its walk to the nearest candy is a requestAnimationFrame loop.

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

const STEP_MS = 150; // one cell per 150 ms while walking

const game = createGame();
const render = mount(game, document.getElementById("app"));
render();

document.addEventListener("keydown", (event) => {
  // TODO: an arrow key cancels a walk in progress first.
  if (step(game, event.key)) {
    event.preventDefault();
    render();
  }
});

document.getElementById("auto").addEventListener("click", () => {
  // TODO: walk the path to the nearest candy one cell every STEP_MS, driven
  // by requestAnimationFrame.
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

const STEP_MS = 150;

const game = createGame();
const render = mount(game, document.getElementById("app"));
render();

// The walk in progress: its path, the next index, when it last stepped, and
// the pending frame, so a key press can cancel it.
let walk = null;

function stopWalk() {
  if (walk) cancelAnimationFrame(walk.frame);
  walk = null;
}

function tick(now) {
  if (walk.last === null) walk.last = now; // the first frame starts the clock
  const elapsed = now - walk.last;
  if (elapsed >= STEP_MS) {
    // Keep the cadence, but after a long gap (a hidden tab gets no frames)
    // resume one cell at a time rather than jumping ahead.
    walk.last = elapsed > 2 * STEP_MS ? now : walk.last + STEP_MS;
    const [r, c] = walk.path[walk.i++];
    game.robot = { r, c };
    if (game.candies.delete(key(r, c))) game.eaten++;
    render();
  }
  if (walk.i < walk.path.length) walk.frame = requestAnimationFrame(tick);
  else walk = null;
}

document.addEventListener("keydown", (event) => {
  if (!DIRS[event.key]) return;
  stopWalk(); // the player takes over from wherever the robot stands
  if (step(game, event.key)) {
    event.preventDefault();
    render();
  }
});

document.getElementById("auto").addEventListener("click", () => {
  if (walk) return; // one walk at a time
  const path = pathToNearestCandy(game);
  if (path.length === 0) return;
  walk = { path, i: 0, last: null, frame: requestAnimationFrame(tick) };
});
`;

export const snowflakeUiRobotProblems: Problem[] = [
  {
    slug: "robot-eats-candies",
    title: "Robot Eats Candies on a Grid",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Keyboard movement with walls and edges, then a breadth-first path to the nearest candy walked by a requestAnimationFrame loop.",
    prompt: [
      "A grid is already rendered, with walls, candies and a robot, and helper functions for cells are provided. Write the JavaScript that moves the robot and removes candies as it reaches them.",
      "",
      "## Requirements",
      "",
      "- Arrow keys move the robot one cell; walls and the grid edge block the move. A candy on the destination is eaten and the status line counts it.",
      "- The **Eat the nearest candy** button finds the shortest path to the closest reachable candy and walks it one cell every `STEP_MS` milliseconds, eating on arrival.",
      "- Drive the walk with `requestAnimationFrame`, not `setInterval` or `setTimeout`. Decide when to step from the frame timestamps, so the pace does not depend on the display's frame rate.",
      "- A second click during a walk does nothing. An arrow key cancels the walk with `cancelAnimationFrame`, then moves the robot from where it stands.",
      "- When no candy is reachable the button does nothing.",
      "- Re-rendering only toggles classes on the existing cells; the grid is not rebuilt.",
      "",
      "Clarify first, as the reports differ: does the player drive the robot or does it move by itself? Here it is both.",
    ].join("\n"),
    hints: [
      "`step` is a direction lookup plus the `inBounds` check; `Set.delete` returns whether a candy was there, so it doubles as the eat check.",
      "Breadth-first search from the robot with a predecessor map; the first candy dequeued is the nearest, and walking the map back from it gives the path. Use an index pointer over the queue array instead of `shift()`.",
      "Keep one walk object: the path, the next index, the timestamp of the last step and the pending frame ID. Each frame steps only when `now - last >= STEP_MS`, then requests the next frame until the path runs out.",
      "Store the ID `requestAnimationFrame` returns: `cancelAnimationFrame` needs it when a key press interrupts, and a non-null walk is also what makes a second click a no-op.",
    ],
    solution: [
      "## Approach",
      "",
      "`step` applies the arrow's delta, rejects walls and edges, moves the robot and eats. `pathToNearestCandy` runs BFS over the grid as an implicit graph, storing one predecessor per cell; the first candy reached is the nearest, and the path is rebuilt from the predecessor map.",
      "",
      "The button walks that path with a `requestAnimationFrame` loop. A single `walk` object holds the path, the next index, the timestamp of the last step and the pending frame ID. Each `tick` receives the frame's timestamp, steps one cell once `STEP_MS` has passed since the last step, and requests another frame until the path ends. Advancing `last` by exactly `STEP_MS` keeps the cadence even when frames land unevenly, and resetting it after a long gap stops the robot from jumping several cells when a hidden tab comes back. A keydown cancels the pending frame before stepping, so the walk can never move the robot back onto its old path.",
      "",
      "## Worth saying out loud",
      "",
      "- Eating every candy in the shortest total route is a travelling-salesman problem; nearest-first is the practical answer.",
      "- `requestAnimationFrame` over `setInterval`: callbacks run just before paint, at most once per frame, and pause in background tabs, while an interval keeps firing in the background and drifts against the display.",
      "- The loop decides on timestamps, never on frame counts, because displays run at 60, 120 or 144 Hz.",
      "- Gliding between cells is the next step: draw the robot as one element above the grid and, each frame, set its `transform` to a point between the two cells using `(now - last) / STEP_MS`.",
      "- Other follow-ups: a score, and diagonal moves (add four more directions).",
      "- Keyboard handling on `document` is fine for a game; a focused grid with `tabIndex` is the accessible version.",
    ].join("\n"),
    ui: {
      framework: "vanilla",
      files: [robotHtml, { name: "script.js", contents: robotVanillaStarter }, robotCss],
      solution: [robotHtml, { name: "script.js", contents: robotVanillaSolution }, robotCss],
    },
  },
];
