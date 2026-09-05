import { transpileTypeScript } from "./transpile-ts";
import type { Judge, Language } from "./types";

export interface TestVerdict {
  name: string;
  pass: boolean;
  /** Entry-function arguments, rendered for display. */
  input: string;
  expected: string;
  got: string;
  /** Present when the user's code threw for this case. */
  error?: string;
  timeMs: number;
  logs: string[];
}

export type RunResult =
  | { status: "pass" | "fail"; verdicts: TestVerdict[] }
  | { status: "error"; message: string }
  | { status: "timeout"; message: string };

/**
 * Runs the solution on the server (Judge0 sandbox) via /api/run.
 * Returns null when server-side execution isn't available — Judge0 not
 * configured (503) or the request never reached us — so the caller can
 * fall back to the in-browser worker below.
 */
export async function runOnServer(
  slug: string,
  code: string,
  language: Language = "javascript",
): Promise<RunResult | null> {
  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, code, language }),
    });
    if (res.status === 503) return null;
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        status: "error",
        message: body?.error ?? `Run failed (HTTP ${res.status}).`,
      };
    }
    return (await res.json()) as RunResult;
  } catch {
    return null;
  }
}

const TIME_LIMIT_MS = 4000;

// Runs entirely inside a Web Worker: user code never touches the page's
// scope, and an infinite loop can be killed by terminating the worker.
// Keep this string free of `${` — it is a template literal.
const WORKER_SOURCE = `
"use strict";

function display(value) {
  if (value === undefined) return "undefined";
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

self.onmessage = async (event) => {
  const { code, driverCode, entry, tests } = event.data;

  let logs = [];
  const sandboxConsole = {
    log: (...args) => {
      if (logs.length < 50) logs.push(args.map(display).join(" "));
    },
  };
  sandboxConsole.info = sandboxConsole.log;
  sandboxConsole.warn = sandboxConsole.log;
  sandboxConsole.error = sandboxConsole.log;
  sandboxConsole.debug = sandboxConsole.log;

  let entryFn;
  try {
    const source = code + "\\n;\\n" + driverCode + "\\nreturn " + entry + ";";
    entryFn = new Function("console", source)(sandboxConsole);
    if (typeof entryFn !== "function") {
      throw new Error(JSON.stringify(entry) + " is not a function");
    }
  } catch (err) {
    self.postMessage({
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const verdicts = [];
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    logs = [];
    const started = performance.now();
    const base = {
      name: test.name || "Case " + (i + 1),
      input: test.input.map(display).join(", "),
      expected: display(test.expected),
    };
    try {
      // Awaited so a driver may be async — fake-timer or microtask-ordering
      // scenarios settle before the verdict is taken.
      const got = await entryFn(...structuredClone(test.input));
      verdicts.push({
        ...base,
        pass: deepEqual(got, test.expected),
        got: display(got),
        timeMs: performance.now() - started,
        logs,
      });
    } catch (err) {
      verdicts.push({
        ...base,
        pass: false,
        got: "—",
        error: err instanceof Error ? err.message : String(err),
        timeMs: performance.now() - started,
        logs,
      });
    }
  }

  self.postMessage({
    status: verdicts.every((v) => v.pass) ? "pass" : "fail",
    verdicts,
  });
};
`;

/**
 * Runs TypeScript in the browser by stripping types and judging the result
 * as JavaScript — same worker, same driver, same semantics.
 */
export async function runTypeScriptJudge(
  code: string,
  judge: Judge,
): Promise<RunResult> {
  const transpiled = await transpileTypeScript(code);
  if (!transpiled.ok) {
    return { status: "error", message: transpiled.message };
  }
  return runJudge(transpiled.code, judge);
}

export function runJudge(code: string, judge: Judge): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(
      new Blob([WORKER_SOURCE], { type: "text/javascript" }),
    );
    const worker = new Worker(url);

    let settled = false;
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        status: "timeout",
        message: `Time limit exceeded (${TIME_LIMIT_MS / 1000}s). Check for an infinite loop.`,
      });
    }, TIME_LIMIT_MS);

    worker.onmessage = (event) => finish(event.data as RunResult);
    worker.onerror = (event) =>
      finish({ status: "error", message: event.message || "Worker failed." });

    worker.postMessage({
      code,
      driverCode: judge.driverCode ?? "",
      entry: judge.entry,
      tests: judge.tests,
    });
  });
}
