import { uiFileKind, type UiFile, type UiTemplate } from "./types";

// Tests for React UI problems: the extra test file a React template's
// workspace shows beside its starter files, and the messages the sandboxed
// test iframe posts back. The candidate edits the file like any other, and
// it is saved and synced under its own slot. A problem may ship its own
// tests as the file's starting contents (`UiTemplate.tests`); otherwise the
// file starts as a short example. The harness that runs it is
// ui-test-kit.ts, bundled by /api/test-runtime.

export const TESTS_MESSAGE_SOURCE = "callback-tests";

export type TestStatus = "pass" | "fail" | "skip" | "todo";

/** One test's outcome; `name` is the describe path then the test's title. */
export interface TestReport {
  name: string[];
  status: TestStatus;
  /** Milliseconds, hooks included. */
  duration: number;
  error?: string;
}

/** What the test iframe posts to the workspace, tagged with source and run. */
export type TestMessage =
  | { kind: "test"; report: TestReport }
  | { kind: "done"; duration: number }
  | { kind: "fatal"; message: string };

/**
 * The script file a React template mounts: App.* if there is one, else the
 * first script. The preview renders its default export; tests import it.
 */
export function uiEntryName(template: UiTemplate): string | null {
  const scripts = template.files
    .map((file) => file.name)
    .filter((name) => uiFileKind(name) === "script");
  return scripts.find((name) => name.startsWith("App.")) ?? scripts[0] ?? null;
}

function starterTests(entryBase: string): string {
  const component = /^[A-Z]\w*$/.test(entryBase) ? entryBase : "App";
  return `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ${component} from "./${entryBase}";

// Tests for your component, run in the browser with Testing Library.
// describe, test, expect, beforeEach and vi are globals, as in Vitest, and
// the jest-dom matchers (toBeInTheDocument, toHaveTextContent, ...) are on.

test("renders something", () => {
  const { container } = render(<${component} />);
  expect(container).not.toBeEmptyDOMElement();
});

// test("responds to a click", async () => {
//   const user = userEvent.setup();
//   render(<${component} />);
//   await user.click(screen.getByRole("button", { name: /add/i }));
//   expect(screen.getByText(/added/i)).toBeInTheDocument();
// });
`;
}

/**
 * The test file of a React template, named after its entry (App.test.jsx,
 * or .tsx for a TypeScript entry), holding the problem's own tests or the
 * starter example. Null for HTML/CSS/JS templates, which have no tests.
 */
export function uiTestFile(template: UiTemplate): UiFile | null {
  if (template.framework !== "react") return null;
  const entry = uiEntryName(template);
  if (entry === null) return null;
  const base = entry.replace(/\.[^.]+$/, "");
  const name = `${base}.test${/\.tsx?$/.test(entry) ? ".tsx" : ".jsx"}`;
  if (template.files.some((file) => file.name === name)) return null;
  return { name, contents: template.tests ?? starterTests(base) };
}

/** The files the workspace edits: the starter files, then the test file. */
export function uiEditableFiles(template: UiTemplate): UiFile[] {
  const tests = uiTestFile(template);
  return tests ? [...template.files, tests] : template.files;
}
