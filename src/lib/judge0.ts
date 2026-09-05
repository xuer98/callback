import "server-only";
import { PYTHON_HARNESS_BODY } from "./python-harness";
import { buildJavaSource } from "./java-harness";
import { buildCppSource } from "./cpp-harness";
import { buildGoSource } from "./go-harness";
import { transpileTypeScript } from "./transpile-ts";
import { judgeFor, type Judge, type Language } from "./types";
import type { RunResult, TestVerdict } from "./run-judge";

// Judge0 client: wraps the user's code in a Node harness with the same
// semantics as the in-browser worker (sandboxed console, deep equality,
// per-case verdicts) and runs it in a real sandbox via the Judge0 API.
//
// Configure with JUDGE0_URL (e.g. http://localhost:2358 for self-hosted, or
// https://judge0-ce.p.rapidapi.com with JUDGE0_API_KEY for RapidAPI).

// Judge0 CE language ids. Overridable because self-hosted instances may
// carry newer runtimes under different ids. TypeScript deliberately has no
// id of its own: it is transpiled to JavaScript and run as JavaScript, so
// its semantics match the browser worker exactly.
const DEFAULT_LANGUAGE_IDS: Record<Language, number> = {
  javascript: 63, // Node.js
  typescript: 63, // transpiled, then run as JavaScript
  python: 71, // Python 3
  java: 62, // OpenJDK
  cpp: 54, // g++
  go: 60, // Go
};

const LANGUAGE_ID_ENV: Record<Language, string> = {
  javascript: "JUDGE0_JS_LANGUAGE_ID",
  typescript: "JUDGE0_JS_LANGUAGE_ID",
  python: "JUDGE0_PY_LANGUAGE_ID",
  java: "JUDGE0_JAVA_LANGUAGE_ID",
  cpp: "JUDGE0_CPP_LANGUAGE_ID",
  go: "JUDGE0_GO_LANGUAGE_ID",
};

function languageId(language: Language): number {
  const override = process.env[LANGUAGE_ID_ENV[language]];
  return Number(override ?? DEFAULT_LANGUAGE_IDS[language]);
}

const COMPILED_BUILDERS = {
  java: buildJavaSource,
  cpp: buildCppSource,
  go: buildGoSource,
} as const;

type CompiledLanguage = keyof typeof COMPILED_BUILDERS;

function isCompiled(language: Language): language is CompiledLanguage {
  return language in COMPILED_BUILDERS;
}

const CPU_TIME_LIMIT_S = 5;
const WALL_TIME_LIMIT_S = 10;
const POLL_INTERVAL_MS = 500;
const POLL_DEADLINE_MS = 20_000;
// Compiled languages pay for a compile step before they run, and a cold
// queue can add more, so give them a longer window before giving up.
const COMPILED_POLL_DEADLINE_MS = 60_000;

const RESULT_MARKER = "__CALLBACK_JUDGE0_RESULT__";

export function isJudge0Configured(): boolean {
  return Boolean(process.env.JUDGE0_URL);
}

export async function runOnJudge0(
  code: string,
  judge: Judge,
  language: Language = "javascript",
): Promise<RunResult> {
  const baseUrl = process.env.JUDGE0_URL;
  if (!baseUrl) {
    return { status: "error", message: "Judge0 is not configured." };
  }
  const variant = judgeFor(judge, language);
  if (!variant) {
    return {
      status: "error",
      message: `This problem has no ${language} judge yet.`,
    };
  }

  let source: string;
  // Compiled languages report errors against the assembled program (harness
  // + solution), so a raw "line 246" is meaningless to someone looking at a
  // ten-line editor. Track where the solution starts to explain the offset.
  let solutionStartLine: number | null = null;
  if (isCompiled(language)) {
    const payloadB64 = Buffer.from(
      JSON.stringify({ tests: judge.tests }),
      "utf8",
    ).toString("base64");
    source = COMPILED_BUILDERS[language](
      code,
      variant.driverCode ?? "",
      variant.entry,
      payloadB64,
      RESULT_MARKER,
    );
    const before = source.indexOf(code);
    if (before > 0) {
      solutionStartLine = source.slice(0, before).split("\n").length;
    }
  } else if (language === "python") {
    source = buildPythonHarness(code, judge);
  } else if (language === "typescript") {
    // Strip types, then judge as JavaScript against the JS driver.
    const transpiled = await transpileTypeScript(code);
    if (!transpiled.ok) {
      return { status: "error", message: transpiled.message };
    }
    source = buildHarness(transpiled.code, judge);
  } else {
    source = buildHarness(code, judge);
  }

  let submission;
  try {
    submission = await submit(
      baseUrl,
      source,
      languageId(language),
      isCompiled(language) ? COMPILED_POLL_DEADLINE_MS : POLL_DEADLINE_MS,
    );
  } catch (err) {
    return {
      status: "error",
      message: `Code execution service unavailable: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
  return toRunResult(submission, solutionStartLine);
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
  languageId: number,
  pollDeadlineMs: number,
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
  const deadline = Date.now() + pollDeadlineMs;
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

function toRunResult(
  submission: Judge0Submission,
  solutionStartLine: number | null = null,
): RunResult {
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
    const note =
      status_id === 6 && solutionStartLine !== null
        ? `Line numbers below count from the start of the compiled program, where your solution begins at line ${solutionStartLine} — subtract ${solutionStartLine - 1} to find the line in your editor.\n\n`
        : "";
    return { status: "error", message: note + detail };
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

// Python program for Judge0: the shared harness body (also used by the
// Pyodide worker) fed a base64-embedded payload, emitting the verdicts as
// one marker-prefixed line exactly like the Node harness below.
export function buildPythonHarness(code: string, judge: Judge): string {
  const payload = JSON.stringify({
    code,
    driverCode: judge.python?.driverCode ?? "",
    entry: judge.python?.entry ?? "",
    tests: judge.tests,
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64");
  return [
    "import base64",
    `__payload_json = base64.b64decode(${JSON.stringify(payloadB64)}).decode("utf-8")`,
    PYTHON_HARNESS_BODY,
    `print("\\n" + ${JSON.stringify(RESULT_MARKER)} + json.dumps(__run()))`,
  ].join("\n");
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

(async () => {
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
    const got = await entryFn(...JSON.parse(JSON.stringify(test.input)));
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
})();
`;
}
