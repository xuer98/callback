import "server-only";
import { createContext, runInContext } from "node:vm";
import {
  expandTests,
  GenError,
  isReference,
  type ExpandedTest,
} from "./judge-gen";
import { MAX_SHOWN_CHARS, type RunResult } from "./run-judge";
import type { Judge } from "./types";

// The server half of prepareTests (run-judge.ts), for the Judge0 path:
// generated inputs are expanded here, and the JavaScript reference solution
// runs in a fresh vm context to supply every `REFERENCE` expected value, so
// each harness — the compiled ones included — receives concrete tests.

/** The reference solution's run on generated tests, synchronous part. */
const REFERENCE_LIMIT_MS = 10_000;

/** The tests ready for a harness, or the error to show instead. */
export async function prepareOnServer(
  judge: Judge,
): Promise<
  { ok: true; tests: ExpandedTest[] } | { ok: false; result: RunResult }
> {
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
  const context = createContext({
    console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
  });
  try {
    runInContext(
      `var __entry = (function () { ${judge.solutionCode}\n;\n${judge.driverCode ?? ""}\nreturn ${judge.entry}; })();`,
      context,
      { timeout: REFERENCE_LIMIT_MS },
    );
    for (const test of pending) {
      context.__args = JSON.stringify(test.input);
      const got: unknown = await runInContext(
        "__entry(...JSON.parse(__args))",
        context,
        { timeout: REFERENCE_LIMIT_MS },
      );
      // Back through JSON so the value is a plain host object, as a test's
      // literal expected value would be.
      test.expected =
        got === undefined ? null : JSON.parse(JSON.stringify(got));
    }
  } catch (err) {
    return {
      ok: false,
      result: {
        status: "error",
        message: `The reference solution failed on a generated test: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
    };
  }
  return { ok: true, tests };
}

/**
 * The verdicts with each generated test's spec'd display as its input and
 * long values cut — the compiled harnesses render whatever they were given.
 */
export function presentVerdicts(
  result: RunResult,
  tests: ExpandedTest[],
): RunResult {
  if (result.status !== "pass" && result.status !== "fail") return result;
  const cut = (text: string) =>
    text.length > MAX_SHOWN_CHARS
      ? `${text.slice(0, MAX_SHOWN_CHARS)}… (${text.length} chars)`
      : text;
  return {
    ...result,
    verdicts: result.verdicts.map((verdict, i) => ({
      ...verdict,
      input: tests[i]?.display ?? cut(verdict.input),
      expected: cut(verdict.expected),
      got: cut(verdict.got),
    })),
  };
}
