import "server-only";
import type { Judge } from "./types";
import type { RunResult, TestVerdict } from "./run-judge";

// Judge0 client: wraps the user's code in a Node harness with the same
// semantics as the in-browser worker (sandboxed console, deep equality,
// per-case verdicts) and runs it in a real sandbox via the Judge0 API.
//
// Configure with JUDGE0_URL (e.g. http://localhost:2358 for self-hosted, or
// https://judge0-ce.p.rapidapi.com with JUDGE0_API_KEY for RapidAPI).

// JavaScript (Node.js) in Judge0 CE. Overridable because self-hosted
// instances may carry newer Node runtimes under different ids.
const DEFAULT_JS_LANGUAGE_ID = 63;

const CPU_TIME_LIMIT_S = 5;
const WALL_TIME_LIMIT_S = 10;
const POLL_INTERVAL_MS = 500;
const POLL_DEADLINE_MS = 20_000;

const RESULT_MARKER = "__CALLBACK_JUDGE0_RESULT__";

export function isJudge0Configured(): boolean {
  return Boolean(process.env.JUDGE0_URL);
}

export async function runOnJudge0(
  code: string,
  judge: Judge,
): Promise<RunResult> {
  const baseUrl = process.env.JUDGE0_URL;
  if (!baseUrl) {
    return { status: "error", message: "Judge0 is not configured." };
  }

  let submission;
  try {
    submission = await submit(baseUrl, buildHarness(code, judge));
  } catch (err) {
    return {
      status: "error",
      message: `Code execution service unavailable: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
  return toRunResult(submission);
}

interface Judge0Submission {
  status_id: number;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
}

async function submit(
  baseUrl: string,
  sourceCode: string,
): Promise<Judge0Submission> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const apiKey = process.env.JUDGE0_API_KEY;
  if (apiKey) {
    const host = new URL(baseUrl).host;
    if (host.endsWith(".rapidapi.com")) {
      headers["x-rapidapi-key"] = apiKey;
      headers["x-rapidapi-host"] = host;
    } else {
      // Self-hosted instances use X-Auth-Token when auth is enabled.
      headers["x-auth-token"] = apiKey;
    }
  }

  const base = baseUrl.replace(/\/$/, "");
  const languageId = Number(
    process.env.JUDGE0_JS_LANGUAGE_ID ?? DEFAULT_JS_LANGUAGE_ID,
  );

  const createRes = await fetch(`${base}/submissions?base64_encoded=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      language_id: languageId,
      source_code: Buffer.from(sourceCode, "utf8").toString("base64"),
      cpu_time_limit: CPU_TIME_LIMIT_S,
      wall_time_limit: WALL_TIME_LIMIT_S,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Judge0 rejected the submission (HTTP ${createRes.status}).`);
  }
  const { token } = (await createRes.json()) as { token?: string };
  if (!token) {
    throw new Error("Judge0 returned no submission token.");
  }

  const fields = "status_id,stdout,stderr,compile_output,message";
  const deadline = Date.now() + POLL_DEADLINE_MS;
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(
      `${base}/submissions/${token}?base64_encoded=true&fields=${fields}`,
      { headers },
    );
    if (!res.ok) {
      throw new Error(`Judge0 poll failed (HTTP ${res.status}).`);
    }
    const body = (await res.json()) as {
      status_id: number;
      stdout: string | null;
      stderr: string | null;
      compile_output: string | null;
      message: string | null;
    };
    // 1 = In Queue, 2 = Processing; anything above is terminal.
    if (body.status_id > 2) {
      return {
        status_id: body.status_id,
        stdout: decode(body.stdout),
        stderr: decode(body.stderr),
        compile_output: decode(body.compile_output),
        message: decode(body.message),
      };
    }
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for Judge0.");
    }
  }
}

function decode(value: string | null): string | null {
  return value === null ? null : Buffer.from(value, "base64").toString("utf8");
}

function toRunResult(submission: Judge0Submission): RunResult {
  const { status_id } = submission;

  if (status_id === 5) {
    return {
      status: "timeout",
      message: `Time limit exceeded (${CPU_TIME_LIMIT_S}s). Check for an infinite loop.`,
    };
  }
  if (status_id !== 3) {
    // 6 = compile error, 7–12 = runtime crashes, 13/14 = Judge0 errors.
    const detail =
      submission.compile_output?.trim() ||
      submission.stderr?.trim() ||
      submission.message?.trim() ||
      `Execution failed (Judge0 status ${status_id}).`;
    return { status: "error", message: detail };
  }

  // The harness prints the verdicts as one marker-prefixed line, so user
  // console output can never be mistaken for the result.
  const line = (submission.stdout ?? "")
    .split("\n")
    .reverse()
    .find((l) => l.startsWith(RESULT_MARKER));
  if (!line) {
    const detail = submission.stderr?.trim();
    return {
      status: "error",
      message: detail
        ? `Your code crashed the runner:\n${detail}`
        : "The runner produced no result.",
    };
  }
  try {
    return JSON.parse(line.slice(RESULT_MARKER.length)) as {
      status: "pass" | "fail";
      verdicts: TestVerdict[];
    };
  } catch {
    return { status: "error", message: "Could not parse the runner's output." };
  }
}

// Mirrors the in-browser worker in run-judge.ts — same sandboxed console,
// deep-equality check, and verdict shape — so both backends judge identically.
// Inputs are JSON-cloned (JudgeTest values are JSON-serializable by contract)
// because Node 12, Judge0 CE's default runtime, lacks structuredClone.
// Exported for tests; must stay valid Node 12 syntax.
export function buildHarness(code: string, judge: Judge): string {
  return `"use strict";
const CODE = ${JSON.stringify(code)};
const DRIVER = ${JSON.stringify(judge.driverCode ?? "")};
const ENTRY = ${JSON.stringify(judge.entry)};
const TESTS = ${JSON.stringify(judge.tests)};
const MARKER = ${JSON.stringify(RESULT_MARKER)};

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

function emit(result) {
  process.stdout.write("\\n" + MARKER + JSON.stringify(result) + "\\n");
}

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
  const source = CODE + "\\n;\\n" + DRIVER + "\\nreturn " + ENTRY + ";";
  entryFn = new Function("console", source)(sandboxConsole);
  if (typeof entryFn !== "function") {
    throw new Error(JSON.stringify(ENTRY) + " is not a function");
  }
} catch (err) {
  emit({
    status: "error",
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(0);
}

const verdicts = [];
for (let i = 0; i < TESTS.length; i++) {
  const test = TESTS[i];
  logs = [];
  const started = process.hrtime.bigint();
  const elapsedMs = () => Number(process.hrtime.bigint() - started) / 1e6;
  const base = {
    name: test.name || "Case " + (i + 1),
    input: test.input.map(display).join(", "),
    expected: display(test.expected),
  };
  try {
    const got = entryFn(...JSON.parse(JSON.stringify(test.input)));
    verdicts.push({
      ...base,
      pass: deepEqual(got, test.expected),
      got: display(got),
      timeMs: elapsedMs(),
      logs,
    });
  } catch (err) {
    verdicts.push({
      ...base,
      pass: false,
      got: "\\u2014",
      error: err instanceof Error ? err.message : String(err),
      timeMs: elapsedMs(),
      logs,
    });
  }
}

emit({
  status: verdicts.every((v) => v.pass) ? "pass" : "fail",
  verdicts,
});
`;
}
