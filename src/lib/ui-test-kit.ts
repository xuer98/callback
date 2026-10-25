// The test harness inside the UI workspace's sandboxed test iframe. Never
// imported by the app: /api/test-runtime bundles this file with esbuild,
// together with React's development build (act() exists only there),
// Testing Library, user-event, the jest-dom matchers, Vitest's expect and
// spies, and fake timers, so the candidate's components and tests share one
// React. The document built by preview.ts loads the bundle, then calls
// window.__testkit.run with a loader for the test file and a channel back
// to the workspace.
//
// The API is Vitest's, as globals and as the "vitest" module: describe /
// test / it (with .skip, .only, .todo, .each) and the four hooks from
// ui-test-runner.ts, expect, and vi with mocks and fake timers. After each
// test Testing Library unmounts what it rendered and real timers return.

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as JsxRuntime from "react/jsx-runtime";
import * as JsxDevRuntime from "react/jsx-dev-runtime";
import * as RTL from "@testing-library/react";
import * as DOM from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import * as domMatchers from "@testing-library/jest-dom/matchers";
import {
  ASYMMETRIC_MATCHERS_OBJECT,
  chai,
  GLOBAL_EXPECT,
  getState,
  JestAsymmetricMatchers,
  JestChaiExpect,
  JestExtend,
  setState,
  type ExpectStatic,
} from "@vitest/expect";
import * as spy from "@vitest/spy";
import { processError } from "@vitest/utils/error";
import { withGlobal, type FakeMethod } from "@sinonjs/fake-timers";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  finishCollecting,
  runAll,
  show,
  test,
} from "./ui-test-runner";
import type { TestMessage } from "./ui-tests";

const MAX_ERROR_CHARS = 6_000;
const realDateNow = Date.now.bind(Date);

type Loose = Record<string | symbol, unknown>;

// -- expect ------------------------------------------------------------------

chai.use(JestExtend);
chai.use(JestChaiExpect);
chai.use(JestAsymmetricMatchers);

type Expect = ExpectStatic & {
  assertions(expected: number): void;
  hasAssertions(): void;
};

/** Vitest's own expect, minus snapshots and soft/poll assertions. */
function createExpect(): Expect {
  const expect = ((value: unknown, message?: string) => {
    const { assertionCalls } = getState(expect);
    setState({ assertionCalls: assertionCalls + 1 }, expect);
    return chai.expect(value, message);
  }) as unknown as Expect;
  Object.assign(expect, chai.expect);
  Object.assign(
    expect,
    (globalThis as unknown as Loose)[ASYMMETRIC_MATCHERS_OBJECT],
  );
  expect.getState = () => getState(expect);
  expect.setState = (state) => setState(state, expect);
  expect.extend = (matchers) =>
    (
      chai.expect as unknown as { extend: (e: unknown, m: unknown) => void }
    ).extend(expect, matchers);
  expect.assertions = (expected) =>
    setState({ expectedAssertionsNumber: expected }, expect);
  expect.hasAssertions = () =>
    setState({ isExpectingAssertions: true }, expect);
  return expect;
}

const expect = createExpect();
(globalThis as unknown as Loose)[GLOBAL_EXPECT] = expect;
expect.extend(domMatchers as unknown as Parameters<Expect["extend"]>[0]);

function checkAssertionCount() {
  const state = getState(expect);
  const wanted = state.expectedAssertionsNumber;
  if (typeof wanted === "number" && state.assertionCalls !== wanted) {
    throw new Error(
      `expected number of assertions to be ${wanted}, but got ${state.assertionCalls}`,
    );
  }
  if (state.isExpectingAssertions && state.assertionCalls === 0) {
    throw new Error("expected any number of assertions, but got none");
  }
}

// -- vi: mocks and fake timers ----------------------------------------------

const timers = withGlobal(globalThis);
type Clock = ReturnType<typeof timers.install>;
let clock: Clock | null = null;

// The timers a browser has: Vitest's defaults minus Node's setImmediate.
const FAKED: FakeMethod[] = [
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "Date",
];

function installed(): Clock {
  if (clock === null) {
    throw new Error("Timers are not mocked. Call vi.useFakeTimers() first.");
  }
  return clock;
}

function restoreTimers() {
  clock?.uninstall();
  clock = null;
}

const vi = {
  fn: spy.fn,
  spyOn: spy.spyOn,
  isMockFunction: spy.isMockFunction,
  mocked: <T>(value: T): T => value,
  clearAllMocks: () => (spy.clearAllMocks(), vi),
  resetAllMocks: () => (spy.resetAllMocks(), vi),
  restoreAllMocks: () => (spy.restoreAllMocks(), vi),
  useFakeTimers(config: { now?: number | Date; toFake?: FakeMethod[] } = {}) {
    restoreTimers();
    clock = timers.install({
      now: config.now ?? realDateNow(),
      toFake: config.toFake ?? FAKED,
      loopLimit: 10_000,
    });
    return vi;
  },
  useRealTimers: () => (restoreTimers(), vi),
  isFakeTimers: () => clock !== null,
  advanceTimersByTime: (ms: number) => (installed().tick(ms), vi),
  advanceTimersByTimeAsync: async (ms: number) => {
    await installed().tickAsync(ms);
    return vi;
  },
  advanceTimersToNextTimer: () => (installed().next(), vi),
  runAllTimers: () => (installed().runAll(), vi),
  runAllTimersAsync: async () => {
    await installed().runAllAsync();
    return vi;
  },
  runOnlyPendingTimers: () => (installed().runToLast(), vi),
  runOnlyPendingTimersAsync: async () => {
    await installed().runToLastAsync();
    return vi;
  },
  clearAllTimers: () => (installed().reset(), vi),
  getTimerCount: () => installed().countTimers(),
  setSystemTime: (time: number | string | Date) => (
    installed().setSystemTime(new Date(time)),
    vi
  ),
  getRealSystemTime: () => realDateNow(),
};

const globals = {
  describe,
  test,
  it: test,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
};

// -- running -----------------------------------------------------------------

/**
 * The test iframe never has system focus (the candidate clicked a button in
 * the page around it), and an unfocused document moves activeElement on
 * focus() without firing a single focus or blur event. user-event prepares
 * an input for React's onChange on that focus event, and onFocus/onBlur
 * handlers listen for them too, so fire them as a focused page (or jsdom)
 * would: blur and focusout on the old element, then focus and focusin.
 */
function emulateFocusEvents() {
  const nativeFocus = HTMLElement.prototype.focus;
  const nativeBlur = HTMLElement.prototype.blur;
  const fire = (
    target: Element,
    plain: string,
    bubbling: string,
    related: Element | null,
  ) => {
    target.dispatchEvent(new FocusEvent(plain, { relatedTarget: related }));
    target.dispatchEvent(
      new FocusEvent(bubbling, { bubbles: true, relatedTarget: related }),
    );
  };
  HTMLElement.prototype.focus = function (options?: FocusOptions) {
    const before = document.activeElement;
    nativeFocus.call(this, options);
    if (document.hasFocus() || document.activeElement !== this) return;
    if (before === this) return;
    if (before && before !== document.body)
      fire(before, "blur", "focusout", this);
    fire(this, "focus", "focusin", before === document.body ? null : before);
  };
  HTMLElement.prototype.blur = function () {
    const wasActive = document.activeElement === this;
    nativeBlur.call(this);
    if (document.hasFocus() || !wasActive || document.activeElement === this) {
      return;
    }
    fire(this, "blur", "focusout", null);
  };
}

function formatError(err: unknown): string {
  let text: string;
  if (err !== null && typeof err === "object" && "message" in err) {
    const shown = processError(err) as {
      name?: string;
      message?: string;
      diff?: string;
    };
    const label =
      shown.name && shown.name !== "Error" && shown.name !== "AssertionError"
        ? `${shown.name}: `
        : "";
    const diff = shown.diff ? `\n\n${shown.diff}` : "";
    text = `${label}${shown.message ?? ""}${diff}`;
  } else {
    text = `Thrown: ${show(err)}`;
  }
  text = text.replace(/\u001b\[[0-9;]*m/g, "");
  if (text.length <= MAX_ERROR_CHARS) return text;
  const more = text.length - MAX_ERROR_CHARS;
  return `${text.slice(0, MAX_ERROR_CHARS)}\n… (${more} more characters)`;
}

function run(options: {
  load: () => void;
  post: (message: TestMessage) => void;
}) {
  const { post } = options;
  Object.assign(globalThis, globals, { jest: vi });
  (globalThis as unknown as Loose).IS_REACT_ACT_ENVIRONMENT = true;
  emulateFocusEvents();

  // As in jsdom, a submitted form or a followed link never navigates away:
  // here it would unload the iframe mid-run.
  window.addEventListener("submit", (event) => event.preventDefault());
  window.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (link && !link.getAttribute("href")!.startsWith("#")) {
      event.preventDefault();
    }
  });
  let uncaught: unknown[] = [];
  window.addEventListener("error", (event) => {
    uncaught.push(event.error ?? new Error(event.message));
  });
  window.addEventListener("unhandledrejection", (event) => {
    uncaught.push(event.reason);
  });

  try {
    options.load();
  } catch (err) {
    const message = `The test file failed to load.\n\n${formatError(err)}`;
    post({ kind: "fatal", message });
    return;
  }
  if (finishCollecting() === 0) {
    post({
      kind: "fatal",
      message:
        'No tests found. Add one with test("what it does", () => { ... }).',
    });
    return;
  }

  const started = performance.now();
  runAll({
    beforeTest(name) {
      uncaught = [];
      setState(
        {
          assertionCalls: 0,
          isExpectingAssertions: false,
          expectedAssertionsNumber: null,
          currentTestName: name,
        },
        expect,
      );
    },
    checkTest: checkAssertionCount,
    afterTest() {
      // Unmount first, so effect cleanups clear timers on the clock that
      // set them; then put the real timers back.
      try {
        RTL.cleanup();
      } finally {
        restoreTimers();
      }
    },
    uncaught: () => uncaught,
    report(name, status, duration, error) {
      post({
        kind: "test",
        report: {
          name,
          status,
          duration: Math.round(duration),
          ...(error === undefined ? {} : { error: formatError(error) }),
        },
      });
    },
  }).then(
    () =>
      post({ kind: "done", duration: Math.round(performance.now() - started) }),
    (err) => post({ kind: "fatal", message: formatError(err) }),
  );
}

// What the test file can import, by module id; the document's loader looks
// bare ids up here before its own files.
const globalsModule = { __esModule: true, ...globals };

Object.assign(window, {
  __preview: {
    react: React,
    "react-dom": ReactDOM,
    "react-dom/client": ReactDOMClient,
    "react/jsx-runtime": JsxRuntime,
    "react/jsx-dev-runtime": JsxDevRuntime,
    "@testing-library/react": RTL,
    "@testing-library/dom": DOM,
    "@testing-library/user-event": {
      __esModule: true,
      default: userEvent,
      userEvent,
    },
    "@testing-library/jest-dom": {},
    "@testing-library/jest-dom/vitest": {},
    "@testing-library/jest-dom/matchers": domMatchers,
    vitest: globalsModule,
    "@jest/globals": { ...globalsModule, jest: vi },
  },
  __testkit: { run },
});
