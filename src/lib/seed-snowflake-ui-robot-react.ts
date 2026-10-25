// The React template of "Robot Eats Candies on a Grid" (the problem itself is
// in seed-snowflake-ui-robot.ts, which adds the shared styles.css): the board
// data and inBounds in game.js, a starter App.jsx that only draws the
// starting position, and a reference with a reducer, a requestAnimationFrame
// walk and a debounced hint.

export const robotGameJs = `// The board and the rules the grid needs. Cells are "r,c" keys.
export const ROWS = 6;
export const COLS = 8;
export const DIRS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};
export const key = (r, c) => r + "," + c;

export function createGame() {
  const candies = new Set(["1,3", "4,1", "5,7", "2,6", "0,5"]);
  const walls = new Set(["1,1", "2,1", "3,1", "3,4", "4,4", "1,5", "2,5"]);
  return {
    robot: { r: 0, c: 0 },
    candies,
    walls,
    eaten: 0,
    total: candies.size,
  };
}

/** Whether (r, c) is on the grid and not a wall. */
export function inBounds(g, r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && !g.walls.has(key(r, c));
}
`;

const robotReactGrid = `  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = key(r, c);
      const classes = ["cell"];
      if (game.walls.has(k)) classes.push("cell--wall");
      if (game.candies.has(k)) classes.push("cell--candy");
__HINT__      if (game.robot.r === r && game.robot.c === c) classes.push("cell--robot");
      cells.push(<div key={k} className={classes.join(" ")} role="gridcell" />);
    }
  }
`;

const robotReactMarkup = `  return (
    <main className="game">
      <p className="game__status">
        {game.eaten === game.total
          ? "All " + game.total + " candies eaten!"
          : "Eaten " + game.eaten + " of " + game.total}
      </p>
      <div className="grid" role="grid" aria-label="Candy grid">
        {cells}
      </div>
      <div className="game__controls">
__BUTTON__
        <span className="game__hint">
          Arrow keys move the robot. Stand still to see the way to the nearest
          candy.
        </span>
      </div>
    </main>
  );
}
`;

export const robotReactStarter = `import { COLS, ROWS, createGame, key } from "./game";

const STEP_MS = 150; // one cell per 150 ms while walking
const HINT_MS = 400; // stand still this long to see the way to the nearest candy

const START = createGame();

export default function App() {
  // Your code here: arrow keys, the walk to the nearest candy, and the
  // debounced hint. For now the grid only draws the starting position.
  const game = START;

${robotReactGrid.replace("__HINT__", "")}
${robotReactMarkup.replace(
  "__BUTTON__",
  '        <button type="button">Eat the nearest candy</button>',
)}`;

export const robotReactSolution = `import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { COLS, DIRS, ROWS, createGame, inBounds, key } from "./game";

const STEP_MS = 150;
const HINT_MS = 400;

/** The game with the robot on (r, c), eating a candy there; never mutates g. */
function moveTo(g, r, c) {
  const here = key(r, c);
  if (!g.candies.has(here)) return { ...g, robot: { r, c } };
  const candies = new Set(g.candies);
  candies.delete(here);
  return { ...g, robot: { r, c }, candies, eaten: g.eaten + 1 };
}

function reducer(g, action) {
  switch (action.type) {
    case "STEP": {
      const [dr, dc] = DIRS[action.key];
      const r = g.robot.r + dr;
      const c = g.robot.c + dc;
      return inBounds(g, r, c) ? moveTo(g, r, c) : g;
    }
    case "GOTO":
      return moveTo(g, action.r, action.c);
    default:
      return g;
  }
}

/** The path (cells after the start) to the nearest candy, or [] if none is reachable. */
function pathToNearestCandy(g) {
  const start = key(g.robot.r, g.robot.c);
  const prev = new Map([[start, null]]);
  const queue = [[g.robot.r, g.robot.c]];
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    const here = key(r, c);
    if (g.candies.has(here)) {
      const path = [];
      for (let k = here; k !== start; k = prev.get(k)) {
        path.push(k.split(",").map(Number));
      }
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

/** fn, run once ms have passed without another call; .cancel() drops a pending call. */
function debounce(fn, ms) {
  let timer = null;
  function debounced(...args) {
    clearTimeout(timer); // every call pushes the deadline back
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  }
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

/**
 * A debounced callback made once per component. It runs the latest fn
 * through a ref, so a call that fires later never sees an old render's state.
 */
function useDebounced(fn, ms) {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  const [debounced] = useState(() => debounce(() => latest.current(), ms));
  useEffect(() => () => debounced.cancel(), [debounced]);
  return debounced;
}

export default function App() {
  const [game, dispatch] = useReducer(reducer, undefined, createGame);
  const [hint, setHint] = useState(() => new Set());
  const walk = useRef(null); // { path, i, last, frame } while walking

  const showHint = useDebounced(() => {
    const path = pathToNearestCandy(game);
    setHint(new Set(path.map(([r, c]) => key(r, c))));
  }, HINT_MS);

  const stopWalk = useCallback(() => {
    if (walk.current) cancelAnimationFrame(walk.current.frame);
    walk.current = null;
  }, []);

  // Standing still from the start counts too; unmounting stops a walk.
  useEffect(() => {
    showHint();
    return stopWalk;
  }, [showHint, stopWalk]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!DIRS[event.key]) return;
      event.preventDefault();
      stopWalk(); // the player takes over from wherever the robot stands
      dispatch({ type: "STEP", key: event.key });
      setHint(new Set()); // hide the hint at once
      showHint(); // and bring it back once the keys go quiet
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showHint, stopWalk]);

  function eatNearest() {
    if (walk.current) return; // one walk at a time
    const path = pathToNearestCandy(game);
    if (path.length === 0) return;
    showHint.cancel();
    setHint(new Set());
    function tick(now) {
      const w = walk.current;
      if (!w) return;
      if (w.last === null) w.last = now; // the first frame starts the clock
      const elapsed = now - w.last;
      if (elapsed >= STEP_MS) {
        // Keep the cadence, but after a long gap resume one cell at a time.
        w.last = elapsed > 2 * STEP_MS ? now : w.last + STEP_MS;
        const [r, c] = w.path[w.i++];
        dispatch({ type: "GOTO", r, c });
      }
      if (w.i < w.path.length) {
        w.frame = requestAnimationFrame(tick);
      } else {
        walk.current = null;
        showHint(); // the robot is still again
      }
    }
    walk.current = {
      path,
      i: 0,
      last: null,
      frame: requestAnimationFrame(tick),
    };
  }

${robotReactGrid.replace("__HINT__", '      if (hint.has(k)) classes.push("cell--hint");\n')}
${robotReactMarkup.replace(
  "__BUTTON__",
  '        <button type="button" onClick={eatNearest}>\n          Eat the nearest candy\n        </button>',
)}`;
