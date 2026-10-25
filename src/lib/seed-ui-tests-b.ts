// More of the tests React UI problems ship with (see seed-ui-tests.ts, which
// merges these in): the TypeScript kanban board's two parts and the React
// version of the candy-eating robot.

/** The line every shipped test file starts its body with. */
export const HEADER = `// This problem's tests. Edit them or add your own; Reset restores them.
`;

const kanbanHelpers = `const column = (name: string) => screen.getByRole("region", { name });

const control = (title: string, direction: "left" | "right") =>
  screen.queryByRole("button", { name: \`Move \${title} \${direction}\` });

async function move(title: string, direction: "left" | "right") {
  const button = control(title, direction);
  expect(button).not.toBeNull();
  await userEvent.click(button!);
}`;

const kanbanMoves = `import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

${HEADER}
${kanbanHelpers}

test("each task starts in its own column", () => {
  render(<App />);
  expect(within(column("To Do")).getByText("Write the spec")).toBeVisible();
  expect(within(column("In Progress")).getByText("Build the API")).toBeVisible();
  expect(within(column("Done")).getByText("Ship the beta")).toBeVisible();
});

test("the right and left arrows move a task to the adjacent column", async () => {
  render(<App />);
  await move("Write the spec", "right");
  expect(within(column("In Progress")).getByText("Write the spec")).toBeVisible();
  expect(within(column("To Do")).queryByText("Write the spec")).toBeNull();
  await move("Write the spec", "left");
  expect(within(column("To Do")).getByText("Write the spec")).toBeVisible();
});

test("an arrow is hidden where the task cannot move", () => {
  render(<App />);
  expect(control("Write the spec", "left")).toBeNull();
  expect(control("Write the spec", "right")).not.toBeNull();
  expect(control("Build the API", "left")).not.toBeNull();
  expect(control("Build the API", "right")).not.toBeNull();
  expect(control("Ship the beta", "left")).not.toBeNull();
  expect(control("Ship the beta", "right")).toBeNull();
});

test("the arrows follow a task to the last column", async () => {
  render(<App />);
  await move("Design the schema", "right");
  await move("Design the schema", "right");
  expect(within(column("Done")).getByText("Design the schema")).toBeVisible();
  expect(control("Design the schema", "right")).toBeNull();
  expect(control("Design the schema", "left")).not.toBeNull();
});
`;

const kanbanAppend = `import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

${HEADER}
${kanbanHelpers}

const TITLES = [
  "Write the spec",
  "Design the schema",
  "Set up CI",
  "Build the API",
  "Review the mockups",
  "Fix the login bug",
  "Ship the beta",
];

/** The task titles in one column, top to bottom. */
const titlesIn = (name: string) =>
  within(column(name))
    .queryAllByRole("listitem")
    .map((item) => TITLES.find((title) => within(item).queryByText(title)));

test("a task moved right lands at the bottom of its new column", async () => {
  render(<App />);
  await move("Write the spec", "right");
  expect(titlesIn("In Progress")).toEqual([
    "Build the API",
    "Review the mockups",
    "Write the spec",
  ]);
});

test("a task moved left lands at the bottom too", async () => {
  render(<App />);
  await move("Fix the login bug", "left");
  expect(titlesIn("In Progress").at(-1)).toBe("Fix the login bug");
});

test("the source column keeps its order", async () => {
  render(<App />);
  await move("Design the schema", "right");
  expect(titlesIn("To Do")).toEqual(["Write the spec", "Set up CI"]);
});

test("two moves of the same task leave one copy at the bottom", async () => {
  render(<App />);
  await move("Set up CI", "right");
  await move("Set up CI", "right");
  expect(titlesIn("Done").at(-1)).toBe("Set up CI");
  expect(titlesIn("In Progress")).not.toContain("Set up CI");
  expect(screen.getAllByText("Set up CI")).toHaveLength(1);
});

test("a task that comes back goes to the bottom again", async () => {
  render(<App />);
  await move("Build the API", "right");
  await move("Build the API", "left");
  expect(titlesIn("In Progress")).toEqual([
    "Review the mockups",
    "Build the API",
  ]);
});
`;

const robot = `import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

${HEADER}
const COLS = 8;

// Timers and animation frames run on a fake clock, so each test sets the time.
beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
  render(<App />);
});

const cells = () => [...document.querySelectorAll(".cell")];
const has = (r, c, name) => cells()[r * COLS + c].classList.contains(name);
const robot = () => {
  const i = cells().findIndex((cell) => cell.classList.contains("cell--robot"));
  return [Math.floor(i / COLS), i % COLS];
};
const hinted = () =>
  cells().filter((cell) => cell.classList.contains("cell--hint")).length;
const press = (key) => fireEvent.keyDown(document, { key });
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));
const eaten = (n) => screen.queryByText(\`Eaten \${n} of 5\`) !== null;
const eatNearest = () =>
  fireEvent.click(screen.getByRole("button", { name: "Eat the nearest candy" }));

test("arrow keys move the robot, and walls and edges block it", () => {
  press("ArrowLeft"); // the edge
  expect(robot()).toEqual([0, 0]);
  press("ArrowRight");
  expect(robot()).toEqual([0, 1]);
  press("ArrowDown"); // a wall
  expect(robot()).toEqual([0, 1]);
});

test("moving onto a candy eats it", () => {
  for (const key of ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowDown"]) {
    press(key);
  }
  expect(robot()).toEqual([1, 3]);
  expect(has(1, 3, "cell--candy")).toBe(false);
  expect(eaten(1)).toBe(true);
});

test("the walk steps one cell every 150 ms to the nearest candy", () => {
  eatNearest();
  // The nearest candy, at (1, 3), is four cells away: right and down only.
  const stepped = [];
  let cells = 0;
  for (let t = 1; t <= 1000; t++) {
    wait(1);
    const now = robot()[0] + robot()[1];
    if (now !== cells) {
      expect(now - cells).toBe(1);
      stepped.push(t);
      cells = now;
    }
  }
  expect(robot()).toEqual([1, 3]);
  expect(eaten(1)).toBe(true);
  for (let i = 1; i < stepped.length; i++) {
    expect(stepped[i] - stepped[i - 1]).toBeGreaterThanOrEqual(130);
    expect(stepped[i] - stepped[i - 1]).toBeLessThanOrEqual(170);
  }
});

test("a second click during the walk does not start a second one", () => {
  eatNearest();
  wait(200);
  eatNearest(); // a second walk would outlive the key press below
  wait(100);
  press("ArrowLeft");
  const after = robot();
  wait(2000);
  expect(robot()).toEqual(after);
  expect(eaten(0)).toBe(true);
});

test("an arrow key cancels the walk", () => {
  eatNearest();
  wait(400);
  expect(robot()).not.toEqual([0, 0]);
  press("ArrowLeft");
  const after = robot();
  wait(2000);
  expect(robot()).toEqual(after);
  expect(eaten(0)).toBe(true);
});

test("the hint shows the way after 400 ms of standing still", () => {
  wait(350);
  expect(hinted()).toBe(0);
  wait(100);
  expect(hinted()).toBe(4);
  expect(has(1, 3, "cell--hint")).toBe(true);
});

test("an arrow key hides the hint at once and restarts the wait", () => {
  wait(450);
  expect(hinted()).toBeGreaterThan(0);
  press("ArrowRight");
  expect(hinted()).toBe(0);
  wait(300);
  press("ArrowRight");
  wait(300);
  expect(hinted()).toBe(0); // 600 ms since the first key, 300 since the last
  wait(150);
  // From (0, 2) the candy at (1, 3) is two cells away: a hint built from
  // stale state would still show the four-cell path from (0, 0).
  expect(hinted()).toBe(2);
});

test("the button cancels a pending hint, which returns after the walk", () => {
  wait(200);
  eatNearest();
  for (let i = 0; i < 200 && !eaten(1); i++) {
    wait(10);
    expect(hinted()).toBe(0);
  }
  expect(eaten(1)).toBe(true);
  wait(300);
  expect(hinted()).toBe(0);
  wait(200);
  // From (1, 3) the nearest candy left, at (0, 5), is three cells away.
  expect(hinted()).toBe(3);
});
`;

export const uiTestsB: Record<string, string> = {
  "kanban-board-move-controls": kanbanMoves,
  "kanban-board-move-to-bottom": kanbanAppend,
  "robot-eats-candies": robot,
};
