import {
  expandTests,
  GenError,
  isReference,
  type ExpandedTest,
} from "./judge-gen";
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
/** The reference solution's own run on the generated tests, before judging. */
const REFERENCE_LIMIT_MS = 10_000;
/** Longest value the verdicts carry back; a 100,000-element answer is cut. */
export const MAX_SHOWN_CHARS = 4000;

// Runs entirely inside a Web Worker: user code never touches the page's
// scope, and an infinite loop can be killed by terminating the worker. In
// `collect` mode it runs the same way but hands back the raw outputs
// instead of verdicts — how the reference solution's answers to generated
// tests are taken. Keep this string free of `${` — it is a template literal.
const WORKER_SOURCE = `
"use strict";

const MAX_SHOWN_CHARS = ` + MAX_SHOWN_CHARS + `;

function display(value) {
  if (value === undefined) return "undefined";
  let text;
  try {
    const json = JSON.stringify(value);
    text = json === undefined ? String(value) : json;
  } catch {
    text = String(value);
  }
  return text.length > MAX_SHOWN_CHARS
    ? text.slice(0, MAX_SHOWN_CHARS) + "… (" + text.length + " chars)"
    : text;
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
  const { code, driverCode, entry, tests, collect } = event.data;

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
  const outputs = [];
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    logs = [];
    const started = performance.now();
    const base = {
      name: test.name || "Case " + (i + 1),
      input: test.display !== undefined ? test.display : test.input.map(display).join(", "),
      expected: display(test.expected),
    };
    try {
      // Awaited so a driver may be async — fake-timer or microtask-ordering
      // scenarios settle before the verdict is taken.
      const got = await entryFn(...structuredClone(test.input));
      if (collect) {
        outputs.push(got === undefined ? null : got);
        continue;
      }
      verdicts.push({
        ...base,
        pass: deepEqual(got, test.expected),
        got: display(got),
        timeMs: performance.now() - started,
        logs,
      });
    } catch (err) {
      if (collect) {
        self.postMessage({
          status: "error",
          message:
            "The reference solution failed on " + base.name + ": " +
            (err instanceof Error ? err.message : String(err)),
        });
        return;
      }
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

  if (collect) {
    self.postMessage({ status: "collected", outputs });
    return;
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

export type PreparedTests =
  | { ok: true; tests: ExpandedTest[] }
  | { ok: false; result: RunResult };

/**
 * The tests ready to judge against: generator specs expanded, and every
 * `REFERENCE` expected value replaced by what the problem's JavaScript
 * reference solution returns for that input (run in the same worker, under
 * its own time limit). Shared by every in-browser runner, since the Python
 * harness takes concrete expected values too.
 */
export async function prepareTests(judge: Judge): Promise<PreparedTests> {
  let tests: ExpandedTest[];
  try {
    tests = expandTests(judge.tests);
  } catch (err) {
    return {
      ok: false,
      result: {
        status: "error",
        message: `This problem's generated tests are misconfigured: ${
          err instanceof GenError ? err.message : String(err)
        }`,
      },
    };
  }
  const pending = tests.filter((test) => isReference(test.expected));
  if (pending.length === 0) return { ok: true, tests };
  if (!judge.solutionCode) {
    return {
      ok: false,
      result: {
        status: "error",
        message:
          "This problem's generated tests need its JavaScript reference solution, which it doesn't have yet.",
      },
    };
  }
  const collected = await runWorker({
    code: judge.solutionCode,
    driverCode: judge.driverCode ?? "",
    entry: judge.entry,
    tests: pending,
    collect: true,
    limitMs: REFERENCE_LIMIT_MS,
  });
  if (collected.status !== "collected") {
    return {
      ok: false,
      result:
        collected.status === "timeout"
          ? {
              status: "error",
              message:
                "The reference solution timed out on a generated test, so it can't be judged right now.",
            }
          : (collected as RunResult),
    };
  }
  pending.forEach((test, i) => {
    test.expected = collected.outputs[i];
  });
  return { ok: true, tests };
}

type WorkerReply = RunResult | { status: "collected"; outputs: unknown[] };

function runWorker(message: {
  code: string;
  driverCode: string;
  entry: string;
  tests: ExpandedTest[];
  collect: boolean;
  limitMs: number;
}): Promise<WorkerReply> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(
      new Blob([WORKER_SOURCE], { type: "text/javascript" }),
    );
    const worker = new Worker(url);

    let settled = false;
    const finish = (result: WorkerReply) => {
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
        message: `Time limit exceeded (${message.limitMs / 1000}s). Check for an infinite loop.`,
      });
    }, message.limitMs);

    worker.onmessage = (event) => finish(event.data as WorkerReply);
    worker.onerror = (event) =>
      finish({ status: "error", message: event.message || "Worker failed." });

    worker.postMessage(message);
  });
}

export async function runJudge(code: string, judge: Judge): Promise<RunResult> {
  const prepared = await prepareTests(judge);
  if (!prepared.ok) return prepared.result;
  const reply = await runWorker({
    code,
    driverCode: judge.driverCode ?? "",
    entry: judge.entry,
    tests: prepared.tests,
    collect: false,
    limitMs: TIME_LIMIT_MS,
  });
  return reply.status === "collected"
    ? { status: "error", message: "The runner returned no verdicts." }
    : reply;
}
