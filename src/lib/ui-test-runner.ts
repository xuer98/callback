import type { TestStatus } from "./ui-tests";

// The test runner of the UI workspace's test harness (ui-test-kit.ts):
// Vitest-style describe / test / hooks that collect a tree while the test
// file loads, then run it one test at a time. What happens around each test
// (expect state, Testing Library cleanup, timers) and where results go is
// the harness's business, passed in as a RunEnv.

// Vitest's own default when it runs tests in a browser: timers there can be
// throttled (a background tab, a hidden frame), where Node's 5 s is tight.
const DEFAULT_TIMEOUT_MS = 15_000;

// Captured at load, before any test can install fake timers over them.
const realSetTimeout = globalThis.setTimeout.bind(globalThis);
const realClearTimeout = globalThis.clearTimeout.bind(globalThis);
const now = () => performance.now();

export interface RunEnv {
  /** Before a test's beforeEach hooks, with its full name. */
  beforeTest(name: string): void;
  /** After the test body succeeded; throws to fail it (assertion counts). */
  checkTest(): void;
  /** After the afterEach hooks, pass or fail; throws to fail the test. */
  afterTest(): void;
  /** Errors raised outside the test's own promise while it ran. */
  uncaught(): unknown[];
  report(
    name: string[],
    status: TestStatus,
    duration: number,
    error?: unknown,
  ): void;
}

type Mode = "run" | "skip" | "only" | "todo";
type Hook = (done?: (err?: unknown) => void) => unknown;

interface Suite {
  kind: "suite";
  name: string;
  mode: Mode;
  parent: Suite | null;
  children: (Suite | Case)[];
  beforeAll: Hook[];
  afterAll: Hook[];
  beforeEach: Hook[];
  afterEach: Hook[];
}

interface Case {
  kind: "case";
  name: string;
  mode: Mode;
  parent: Suite;
  fn: Hook | null;
  timeout: number;
}

function newSuite(name: string, mode: Mode, parent: Suite | null): Suite {
  return {
    kind: "suite",
    name,
    mode,
    parent,
    children: [],
    beforeAll: [],
    afterAll: [],
    beforeEach: [],
    afterEach: [],
  };
}

const root = newSuite("", "run", null);
let current = root;
let collecting = true;

function whileCollecting(what: string) {
  if (!collecting) {
    throw new Error(`${what} cannot be called inside a running test.`);
  }
}

function addSuite(name: unknown, fn: () => unknown, mode: Mode) {
  whileCollecting("describe()");
  const suite = newSuite(String(name), mode, current);
  current.children.push(suite);
  const outer = current;
  current = suite;
  try {
    if (fn() instanceof Promise) {
      throw new Error(
        `describe("${suite.name}") must be synchronous; await inside test() instead.`,
      );
    }
  } finally {
    current = outer;
  }
}

function addCase(
  name: unknown,
  fn: Hook | undefined,
  timeout: unknown,
  mode: Mode,
) {
  whileCollecting("test()");
  current.children.push({
    kind: "case",
    name: String(name),
    mode: fn === undefined ? "todo" : mode,
    parent: current,
    fn: fn ?? null,
    timeout: typeof timeout === "number" ? timeout : DEFAULT_TIMEOUT_MS,
  });
}

/** A value as a test title shows it. */
export function show(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "function") return value.name || "[Function]";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** The title of one row of .each: printf tokens, then $field for objects. */
function eachTitle(title: string, args: unknown[], index: number): string {
  let next = 0;
  let out = title.replace(/%[sdifjoOp#%]/g, (token) => {
    if (token === "%%") return "%";
    if (token === "%#") return String(index);
    const value = args[next++];
    if (token === "%d" || token === "%f") return String(Number(value));
    if (token === "%i") return String(Math.trunc(Number(value)));
    return show(value);
  });
  const [only] = args;
  if (args.length === 1 && only !== null && typeof only === "object") {
    out = out.replace(/\$([\w.]+)/g, (whole, path: string) => {
      let value: unknown = only;
      for (const key of path.split(".")) {
        value =
          value === null || value === undefined
            ? undefined
            : (value as Record<string, unknown>)[key];
      }
      return value === undefined ? whole : show(value);
    });
  }
  return out;
}

function each(
  register: (title: string, run: () => unknown, timeout?: number) => void,
) {
  return (table: readonly unknown[]) =>
    (title: string, fn: (...args: unknown[]) => unknown, timeout?: number) =>
      table.forEach((row, index) => {
        const args = Array.isArray(row) ? row : [row];
        register(eachTitle(title, args, index), () => fn(...args), timeout);
      });
}

export const describe = Object.assign(
  (name: unknown, fn: () => unknown) => addSuite(name, fn, "run"),
  {
    skip: (name: unknown, fn: () => unknown) => addSuite(name, fn, "skip"),
    only: (name: unknown, fn: () => unknown) => addSuite(name, fn, "only"),
    todo: (name: unknown) => addSuite(name, () => {}, "todo"),
    each: each((title, run) => addSuite(title, run, "run")),
  },
);

export const test = Object.assign(
  (name: unknown, fn?: Hook, timeout?: number) =>
    addCase(name, fn, timeout, "run"),
  {
    skip: (name: unknown, fn?: Hook, timeout?: number) =>
      addCase(name, fn, timeout, "skip"),
    only: (name: unknown, fn?: Hook, timeout?: number) =>
      addCase(name, fn, timeout, "only"),
    todo: (name: unknown) => addCase(name, undefined, undefined, "todo"),
    each: each((title, run, timeout) => addCase(title, run, timeout, "run")),
  },
);

function hook(kind: "beforeAll" | "afterAll" | "beforeEach" | "afterEach") {
  return (fn: Hook) => {
    whileCollecting(`${kind}()`);
    current[kind].push(fn);
  };
}

export const beforeAll = hook("beforeAll");
export const afterAll = hook("afterAll");
export const beforeEach = hook("beforeEach");
export const afterEach = hook("afterEach");

// -- running -----------------------------------------------------------------

/** A test or hook as a promise, whether it returns one or takes `done`. */
function invoke(fn: Hook): Promise<unknown> {
  if (fn.length > 0) {
    return new Promise((resolve, reject) => {
      fn((err) => (err ? reject(err) : resolve(undefined)));
    });
  }
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

function withTimeout(fn: Hook, ms: number, what: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = realSetTimeout(() => {
      reject(
        new Error(
          `${what} timed out in ${ms}ms. If it waits on fake timers, advance them with vi.advanceTimersByTime, or pass { advanceTimers: vi.advanceTimersByTime } to userEvent.setup().`,
        ),
      );
    }, ms);
    invoke(fn).then(
      (value) => {
        realClearTimeout(timer);
        resolve(value);
      },
      (err) => {
        realClearTimeout(timer);
        reject(err);
      },
    );
  });
}

function cases(suite: Suite): Case[] {
  return suite.children.flatMap((child) =>
    child.kind === "case" ? [child] : cases(child),
  );
}

function hasOnly(suite: Suite): boolean {
  return suite.children.some(
    (child) =>
      child.mode === "only" || (child.kind === "suite" && hasOnly(child)),
  );
}

let onlyMode = false;

function runnable(test: Case): boolean {
  if (test.mode === "skip" || test.mode === "todo") return false;
  let only = test.mode === "only";
  for (let suite: Suite | null = test.parent; suite; suite = suite.parent) {
    if (suite.mode === "skip" || suite.mode === "todo") return false;
    if (suite.mode === "only") only = true;
  }
  return onlyMode ? only : true;
}

/** A test's name below `suite`: the describe titles between, then its own. */
function nameWithin(suite: Suite, test: Case): string[] {
  const names = [test.name];
  for (let s = test.parent; s !== suite && s.parent; s = s.parent) {
    names.unshift(s.name);
  }
  return names;
}

async function runCase(env: RunEnv, test: Case, name: string[]) {
  if (!runnable(test)) {
    env.report(name, test.mode === "todo" ? "todo" : "skip", 0);
    return;
  }
  env.beforeTest(name.join(" > "));
  const started = now();
  const chain: Suite[] = [];
  for (let s: Suite | null = test.parent; s; s = s.parent) chain.unshift(s);
  let error: unknown;
  try {
    for (const suite of chain) {
      for (const fn of suite.beforeEach) {
        await withTimeout(fn, test.timeout, "beforeEach hook");
      }
    }
    await withTimeout(test.fn!, test.timeout, "Test");
    env.checkTest();
  } catch (err) {
    error = err;
  }
  for (const suite of [...chain].reverse()) {
    for (const fn of suite.afterEach) {
      try {
        await withTimeout(fn, test.timeout, "afterEach hook");
      } catch (err) {
        error ??= err;
      }
    }
  }
  try {
    env.afterTest();
  } catch (err) {
    error ??= err;
  }
  error ??= env.uncaught()[0];
  env.report(
    name,
    error === undefined ? "pass" : "fail",
    now() - started,
    error,
  );
}

async function runSuite(env: RunEnv, suite: Suite, path: string[]) {
  const all = cases(suite);
  if (!all.some(runnable)) {
    for (const test of all) {
      const status = test.mode === "todo" ? "todo" : "skip";
      env.report([...path, ...nameWithin(suite, test)], status, 0);
    }
    return;
  }
  let setupError: unknown;
  for (const fn of suite.beforeAll) {
    try {
      await withTimeout(fn, DEFAULT_TIMEOUT_MS, "beforeAll hook");
    } catch (err) {
      setupError = err;
      break;
    }
  }
  for (const child of suite.children) {
    if (setupError === undefined) {
      if (child.kind === "suite") {
        await runSuite(env, child, [...path, child.name]);
      } else {
        await runCase(env, child, [...path, child.name]);
      }
      continue;
    }
    const failed = child.kind === "suite" ? cases(child) : [child];
    for (const test of failed.filter(runnable)) {
      env.report([...path, ...nameWithin(suite, test)], "fail", 0, setupError);
    }
  }
  for (const fn of suite.afterAll) {
    try {
      await withTimeout(fn, DEFAULT_TIMEOUT_MS, "afterAll hook");
    } catch (err) {
      env.report([...path, "afterAll hook"], "fail", 0, err);
    }
  }
}

/** Ends collection; the number of tests the file declared. */
export function finishCollecting(): number {
  collecting = false;
  onlyMode = hasOnly(root);
  return cases(root).length;
}

export function runAll(env: RunEnv): Promise<void> {
  return runSuite(env, root, []);
}
