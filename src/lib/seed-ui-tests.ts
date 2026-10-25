import type { Problem, UiWorkspace } from "./types";

// The tests some React UI problems ship with, keyed by slug and merged into
// the React template's `tests` at seed time, like the per-language judges.
// They are the starting contents of the workspace's App.test.jsx: written
// against the contract the prompt and starter markup state, never against
// the reference solution's internals, and the candidate can edit or add to
// them. The seed refuses a slug without a React template.

const HEADER = `// This problem's tests. Edit them or add your own; Reset restores them.
`;

const counter = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

${HEADER}
function setup() {
  const user = userEvent.setup();
  const { container } = render(<App />);
  return {
    user,
    count: () => container.querySelector(".count"),
    button: (name) => screen.getByRole("button", { name }),
  };
}

test("starts at 0 with -1 disabled", () => {
  const { count, button } = setup();
  expect(count()).toHaveTextContent(/^0$/);
  expect(button("-1")).toBeDisabled();
});

test("+1 and -1 change the count", async () => {
  const { user, count, button } = setup();
  await user.click(button("+1"));
  await user.click(button("+1"));
  expect(count()).toHaveTextContent(/^2$/);
  await user.click(button("-1"));
  expect(count()).toHaveTextContent(/^1$/);
});

test("-1 is enabled above 0 and disabled again at 0", async () => {
  const { user, button } = setup();
  await user.click(button("+1"));
  expect(button("-1")).toBeEnabled();
  await user.click(button("-1"));
  expect(button("-1")).toBeDisabled();
});

test("Reset returns the count to 0", async () => {
  const { user, count, button } = setup();
  await user.click(button("+1"));
  await user.click(button("+1"));
  await user.click(button("Reset"));
  expect(count()).toHaveTextContent(/^0$/);
  expect(button("-1")).toBeDisabled();
});
`;

const todoList = `import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

${HEADER}
function setup() {
  const user = userEvent.setup();
  render(<App />);
  const input = screen.getByRole("textbox", { name: "New task" });
  return {
    user,
    input,
    rows: () => screen.queryAllByRole("listitem").length,
    add: async (text) => {
      await user.type(input, text);
      await user.click(screen.getByRole("button", { name: "Add" }));
    },
    remove: (row) => user.click(within(row).getByRole("button")),
  };
}

test("Add appends the task and clears the input", async () => {
  const { input, rows, add } = setup();
  const before = rows();
  await add("Buy milk");
  expect(screen.getByText("Buy milk")).toBeInTheDocument();
  expect(rows()).toBe(before + 1);
  expect(input).toHaveValue("");
});

test("Enter adds a task too", async () => {
  const { user, input, rows } = setup();
  const before = rows();
  await user.type(input, "Call mom{Enter}");
  expect(screen.getByText("Call mom")).toBeInTheDocument();
  expect(rows()).toBe(before + 1);
});

test("an empty or whitespace-only task adds nothing", async () => {
  const { user, input, rows, add } = setup();
  const before = rows();
  await user.click(screen.getByRole("button", { name: "Add" }));
  await add("   ");
  await user.type(input, "{Enter}");
  expect(rows()).toBe(before);
});

test("delete removes exactly that task", async () => {
  const { rows, add, remove } = setup();
  await add("Buy milk");
  await add("Call mom");
  await add("Pay rent");
  const before = rows();
  await remove(screen.getByText("Call mom").closest("li"));
  expect(screen.queryByText("Call mom")).not.toBeInTheDocument();
  expect(screen.getByText("Buy milk")).toBeInTheDocument();
  expect(screen.getByText("Pay rent")).toBeInTheDocument();
  expect(rows()).toBe(before - 1);
});

test("deleting one of three identical tasks removes just one", async () => {
  const { add, remove } = setup();
  await add("Same");
  await add("Same");
  await add("Same");
  await remove(screen.getAllByText("Same")[1].closest("li"));
  expect(screen.getAllByText("Same")).toHaveLength(2);
});
`;

const tabs = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

${HEADER}
test("the first tab is selected on load", () => {
  render(<App />);
  expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("HTML");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("The skeleton");
});

test("clicking a tab shows its panel and selects it", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: "CSS" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent("The skin");
  expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("CSS");
});

test("exactly one tab and one panel are active at a time", async () => {
  const user = userEvent.setup();
  render(<App />);
  for (const name of ["JavaScript", "HTML", "CSS"]) {
    await user.click(screen.getByRole("tab", { name }));
    expect(screen.getAllByRole("tab", { selected: true })).toHaveLength(1);
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  }
  expect(screen.getByRole("tabpanel")).toHaveTextContent("The skin");
});
`;

const accordion = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

${HEADER}
const CORS = "What is CORS?";
const CLOSURE = "What is a closure?";

const title = (name) => screen.getByRole("button", { name });
const body = (text) => screen.queryByText(text, { exact: false });

// A collapsed body may be removed or merely hidden; either is fine.
function expectHidden(text) {
  const element = body(text);
  if (element !== null) expect(element).not.toBeVisible();
}

test("all sections start collapsed", () => {
  render(<App />);
  for (const button of screen.getAllByRole("button")) {
    expect(button).toHaveAttribute("aria-expanded", "false");
  }
  expectHidden("cross-origin responses");
  expectHidden("bundled with the variables");
});

test("clicking a title expands that section only", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(title(CORS));
  expect(title(CORS)).toHaveAttribute("aria-expanded", "true");
  expect(body("cross-origin responses")).toBeVisible();
  expect(title(CLOSURE)).toHaveAttribute("aria-expanded", "false");
  expectHidden("bundled with the variables");
});

test("sections open independently", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(title(CORS));
  await user.click(title(CLOSURE));
  expect(body("cross-origin responses")).toBeVisible();
  expect(body("bundled with the variables")).toBeVisible();
});

test("clicking an open title collapses it", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(title(CORS));
  await user.click(title(CORS));
  expect(title(CORS)).toHaveAttribute("aria-expanded", "false");
  expectHidden("cross-origin responses");
});
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

export const uiTests: Record<string, string> = {
  "react-counter": counter,
  "react-todo-list": todoList,
  "react-tabs": tabs,
  "react-accordion": accordion,
  "kanban-board-move-controls": kanbanMoves,
  "kanban-board-move-to-bottom": kanbanAppend,
};

/** The problem's UI workspace with its tests merged into the React template. */
export function withUiTests(
  slug: string,
  ui: UiWorkspace | undefined,
): UiWorkspace | undefined {
  const tests = uiTests[slug];
  if (ui === undefined || tests === undefined) return ui;
  if (ui.framework === "react") return { ...ui, tests };
  if (ui.alternate?.framework === "react") {
    return { ...ui, alternate: { ...ui.alternate, tests } };
  }
  return ui;
}

export function checkUiTests(problems: readonly Problem[]): void {
  for (const slug of Object.keys(uiTests)) {
    const ui = problems.find((p) => p.slug === slug)?.ui;
    if (ui?.framework !== "react" && ui?.alternate?.framework !== "react") {
      throw new Error(`seed-ui-tests: "${slug}" has no React template`);
    }
  }
}
