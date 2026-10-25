import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part K: a React and TypeScript kanban board
// whose tasks move between statuses with left and right controls instead of
// drag-and-drop, then the follow-up that sends every moved task to the
// bottom of its destination. Part II's starter is part I's reference.

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
  flex: 1 0 200px;
  background: #e4e4e7;
  border-radius: 10px;
  padding: 10px;
  min-height: 160px;
}

.column h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.tasks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task {
  background: white;
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.task__moves {
  display: flex;
  gap: 4px;
}

.task__moves button {
  border: 0;
  background: #f4f4f5;
  color: inherit;
  border-radius: 6px;
  padding: 2px 8px;
  font: inherit;
  cursor: pointer;
}

.task__moves button:hover {
  background: #e4e4e7;
}
`,
};

// The data both parts share: the status order and tasks in the order an API
// returned them, statuses interleaved.
const kanbanData = `const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
] as const;

type Status = (typeof STATUSES)[number]["id"];

interface Task {
  id: string;
  title: string;
  status: Status;
}

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Write the spec", status: "todo" },
  { id: "t4", title: "Build the API", status: "in-progress" },
  { id: "t2", title: "Design the schema", status: "todo" },
  { id: "t6", title: "Fix the login bug", status: "done" },
  { id: "t3", title: "Set up CI", status: "todo" },
  { id: "t5", title: "Review the mockups", status: "in-progress" },
  { id: "t7", title: "Ship the beta", status: "done" },
];`;

const kanbanStarter = `${kanbanData}

export default function App() {
  // Your code here: make the arrows move tasks, and hide the ones that can't.
  return (
    <div className="board">
      {STATUSES.map((status) => (
        <section
          key={status.id}
          className="column"
          aria-labelledby={\`column-\${status.id}\`}
        >
          <h2 id={\`column-\${status.id}\`}>{status.label}</h2>
          <ul className="tasks">
            {INITIAL_TASKS.filter((task) => task.status === status.id).map(
              (task) => (
                <li key={task.id} className="task">
                  <span>{task.title}</span>
                  <span className="task__moves">
                    <button aria-label={\`Move \${task.title} left\`}>←</button>
                    <button aria-label={\`Move \${task.title} right\`}>→</button>
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
`;

// Part I's reference, and part II's starter: one flat list, so a moved task
// keeps its place in that list.
const kanbanFlatSolution = `import { useReducer } from "react";

${kanbanData}

type Direction = -1 | 1;

type Action = { type: "MOVE_TASK"; id: string; direction: Direction };

const LAST = STATUSES.length - 1;

function positionOf(status: Status): number {
  return STATUSES.findIndex((s) => s.id === status);
}

// Pure, so it can be unit-tested without rendering anything.
function reducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case "MOVE_TASK": {
      const index = tasks.findIndex((task) => task.id === action.id);
      if (index === -1) return tasks;
      const target = positionOf(tasks[index].status) + action.direction;
      if (target < 0 || target > LAST) return tasks; // past an edge: no move
      const next = tasks.slice();
      next[index] = { ...tasks[index], status: STATUSES[target].id };
      return next;
    }
  }
}

export default function App() {
  const [tasks, dispatch] = useReducer(reducer, INITIAL_TASKS);
  const move = (id: string, direction: Direction) =>
    dispatch({ type: "MOVE_TASK", id, direction });

  return (
    <div className="board">
      {STATUSES.map((status, position) => (
        <section
          key={status.id}
          className="column"
          aria-labelledby={\`column-\${status.id}\`}
        >
          <h2 id={\`column-\${status.id}\`}>{status.label}</h2>
          <ul className="tasks">
            {tasks
              .filter((task) => task.status === status.id)
              .map((task) => (
                <li key={task.id} className="task">
                  <span>{task.title}</span>
                  <span className="task__moves">
                    {position > 0 && (
                      <button
                        aria-label={\`Move \${task.title} left\`}
                        onClick={() => move(task.id, -1)}
                      >
                        ←
                      </button>
                    )}
                    {position < LAST && (
                      <button
                        aria-label={\`Move \${task.title} right\`}
                        onClick={() => move(task.id, 1)}
                      >
                        →
                      </button>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
`;

const kanbanAppendSolution = `import { memo, useReducer } from "react";
import type { Dispatch } from "react";

${kanbanData}

type Direction = -1 | 1;

type Action = { type: "MOVE_TASK"; id: string; direction: Direction };

// Normalized: each task once by ID, plus one ordered ID list per status.
interface Board {
  tasksById: Record<string, Task>;
  idsByStatus: Record<Status, string[]>;
}

const LAST = STATUSES.length - 1;

function positionOf(status: Status): number {
  return STATUSES.findIndex((s) => s.id === status);
}

function toBoard(tasks: Task[]): Board {
  const board: Board = {
    tasksById: {},
    idsByStatus: { todo: [], "in-progress": [], done: [] },
  };
  for (const task of tasks) {
    board.tasksById[task.id] = task;
    board.idsByStatus[task.status].push(task.id);
  }
  return board;
}

// A move touches the source list, the destination list and one task.
function reducer(board: Board, action: Action): Board {
  switch (action.type) {
    case "MOVE_TASK": {
      const task = board.tasksById[action.id];
      if (!task) return board;
      const target = positionOf(task.status) + action.direction;
      if (target < 0 || target > LAST) return board; // past an edge: no move
      const from = task.status;
      const to = STATUSES[target].id;
      return {
        tasksById: { ...board.tasksById, [task.id]: { ...task, status: to } },
        idsByStatus: {
          ...board.idsByStatus,
          [from]: board.idsByStatus[from].filter((id) => id !== task.id),
          [to]: [...board.idsByStatus[to], task.id], // always the bottom
        },
      };
    }
  }
}

// Memoized on the task object, so a move re-renders only the moved row.
const TaskRow = memo(function TaskRow({
  task,
  position,
  dispatch,
}: {
  task: Task;
  position: number;
  dispatch: Dispatch<Action>;
}) {
  const move = (direction: Direction) =>
    dispatch({ type: "MOVE_TASK", id: task.id, direction });
  return (
    <li className="task">
      <span>{task.title}</span>
      <span className="task__moves">
        {position > 0 && (
          <button
            aria-label={\`Move \${task.title} left\`}
            onClick={() => move(-1)}
          >
            ←
          </button>
        )}
        {position < LAST && (
          <button
            aria-label={\`Move \${task.title} right\`}
            onClick={() => move(1)}
          >
            →
          </button>
        )}
      </span>
    </li>
  );
});

export default function App() {
  const [board, dispatch] = useReducer(reducer, INITIAL_TASKS, toBoard);
  return (
    <div className="board">
      {STATUSES.map((status, position) => (
        <section
          key={status.id}
          className="column"
          aria-labelledby={\`column-\${status.id}\`}
        >
          <h2 id={\`column-\${status.id}\`}>{status.label}</h2>
          <ul className="tasks">
            {board.idsByStatus[status.id].map((id) => (
              <TaskRow
                key={id}
                task={board.tasksById[id]}
                position={position}
                dispatch={dispatch}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
`;

const MARKUP =
  "- Keep the starter's markup: each column is a `<section>` labelled by its heading, each task a list item showing its title, and the controls are buttons labelled `Move <title> left` and `Move <title> right`.";

export const snowflakeUiProblemsK: Problem[] = [
  {
    slug: "kanban-board-move-controls",
    title: "TypeScript Kanban Board I",
    category: "frontend",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "Left and right arrows instead of drag-and-drop: one typed `MOVE_TASK` reducer action, and controls that disappear at the board's edges.",
    prompt: [
      "Build a kanban board in React and TypeScript. Tasks are grouped by status into columns, and each task moves to an adjacent status with left and right controls instead of drag-and-drop. The starter renders the board from `INITIAL_TASKS` with both arrows on every task, and neither arrow does anything yet.",
      "",
      "## Requirements",
      "",
      "- The left arrow moves a task to the previous status and the right arrow to the next one, in the order of `STATUSES`.",
      "- Hide a direction control when the task cannot move farther that way: no left arrow in the first column and no right arrow in the last.",
      "- Route every move through one reducer action, `MOVE_TASK`, and keep updates immutable. A move past either end changes nothing.",
      "- Type the state and the action. The order of tasks within a column is up to you.",
      MARKUP,
    ].join("\n"),
    hints: [
      "Keep the status order in one constant. A move is the task's position in it plus or minus one, rejected when it falls off either end.",
      "`useReducer` with a single `MOVE_TASK` action carrying `{ id, direction }` gives both arrows one code path. Return the same state when nothing changes.",
      "Whether an arrow shows depends only on the column's position in that constant: the first has no left arrow and the last no right one.",
    ],
    solution: [
      "## Approach",
      "",
      "`STATUSES` is the only definition of order, and `Status` is derived from it, so a new column is one line. The tasks stay one flat array in a reducer. `MOVE_TASK` carries an ID and a direction of -1 or 1; it finds the task, adds the direction to the position of its status, and returns the same array when the target falls off either end, otherwise a copy with that one task replaced. Each column filters the array by its status, and the arrows render only when `position > 0` or `position < LAST`, so the reducer's boundary check is a second line of defence rather than the only one.",
      "",
      "## Worth saying out loud",
      "",
      "- The reducer is pure, so left and right moves and both boundaries can be unit-tested without rendering.",
      "- Hiding a control removes the button that had focus when a task reaches an edge. Moving focus to the task's remaining control keeps keyboard users in place.",
      "- Hiding shifts the row's layout; `visibility: hidden` keeps the arrows aligned and still takes the button out of the accessibility tree.",
      "- Stable task IDs as keys keep each row's DOM and state attached to its task as it moves between columns.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.tsx", contents: kanbanStarter }, kanbanCss],
      solution: [{ name: "App.tsx", contents: kanbanFlatSolution }, kanbanCss],
    },
  },
  {
    slug: "kanban-board-move-to-bottom",
    title: "TypeScript Kanban Board II",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Every moved task lands at the bottom of its new column: normalized state with one ordered ID list per status, then the board at 100,000 tasks.",
    prompt: [
      "Extend the board from [TypeScript Kanban Board I](/problems/kanban-board-move-controls). The starter is a working board: the arrows move tasks between statuses and are hidden at the edges. But a moved task shows up wherever it sat in the original list, sometimes above tasks that were already in its new column.",
      "",
      "## Requirements",
      "",
      "- Whenever a task's status changes, place it at the bottom of its destination column. Every other task keeps its order.",
      "- Moving the same task again, or back, appends it again. It never appears twice.",
      "- Keep the single `MOVE_TASK` reducer action and immutable updates.",
      MARKUP,
      "",
      "Then be ready to discuss how the design changes when the board holds 100,000 tasks, both what it costs to render and what one move costs to compute.",
    ].join("\n"),
    hints: [
      'Filtering one flat array by status cannot express "last in this column" without reordering the whole array. Keep an ordered list of task IDs per status instead.',
      "Normalize the state as `tasksById` plus `idsByStatus`. A move removes the ID from the source list, updates the task's status once, and appends the ID to the destination list.",
      "Trace two moves of the same task by hand. The ID must leave its old list every time, or it will show up twice.",
    ],
    solution: [
      "## Approach",
      "",
      "The state becomes `tasksById` plus one ordered ID list per status. `MOVE_TASK` looks the task up, rejects a move past either edge by returning the same board, and otherwise builds a new board in which only three things change: the source list without the ID, the destination list with the ID appended, and the one task record with its new status. Appending is the follow-up, so the invariant lives in the reducer rather than in rendering. Each column maps its own ID list, so nothing filters the whole collection, and rows are a memoized `TaskRow` that receives `dispatch`, which never changes.",
      "",
      "## Worth saying out loud",
      "",
      "- At 100,000 tasks the DOM is the first problem: render only the visible rows of each column with a windowed list. Virtualization bounds the DOM, while normalized state bounds the work per move, and neither replaces the other.",
      "- With a flat array, every move re-filters all 100,000 tasks once per column and re-renders every row. With the normalized board, a move costs the source column's length for the `filter` plus a copy of the destination list, and memoized rows keep the other columns' rows from re-rendering.",
      "- If one column itself holds most of the 100,000, removing an ID by `filter` is still linear in that column. A position index per ID, or a linked order, makes removal constant time at the cost of more bookkeeping.",
      "- Profile reducer time and render time separately: the React profiler should show one row and two lists re-rendering per move, not the board.",
      "- Unit-test the reducer directly: left and right moves, both edges, a moved task becoming the last ID in its destination, and two consecutive moves of the same task leaving exactly one copy of its ID.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.tsx", contents: kanbanFlatSolution }, kanbanCss],
      solution: [
        { name: "App.tsx", contents: kanbanAppendSolution },
        kanbanCss,
      ],
    },
  },
];
