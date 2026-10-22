import { hasGeneratedTests, expandTests } from "./judge-gen";
import { largeTestsA } from "./seed-large-tests-a";
import { largeTestsB } from "./seed-large-tests-b";
import type { JudgeTest, Problem } from "./types";

// Large judge cases, keyed by slug and appended to the problem's tests at
// seed time (src/db/seed.ts), the way topics and the per-language judges
// are. Each is written as generator specs (src/lib/judge-gen.ts) with the
// expected value taken from the JavaScript reference solution when the
// test runs, so a brute-force solution that passes the hand-written samples
// times out here while the intended one finishes in milliseconds. Sizes are
// chosen so the reference runs well inside the Python runtime's budget too.

export const largeTests: Record<string, JudgeTest[]> = {
  ...largeTestsA,
  ...largeTestsB,
};

/** The large cases for one problem, in order; empty for most problems. */
export function largeTestsFor(slug: string): JudgeTest[] {
  return largeTests[slug] ?? [];
}

/**
 * Every large case must belong to a judged problem with a JavaScript
 * reference solution (that is what resolves its expected value), carry a
 * name the problem's own cases don't use, and expand without error.
 */
export function checkLargeTests(problems: readonly Problem[]): void {
  const bySlug = new Map(problems.map((problem) => [problem.slug, problem]));
  for (const [slug, tests] of Object.entries(largeTests)) {
    const problem = bySlug.get(slug);
    if (!problem?.judge) {
      throw new Error(`Large tests for "${slug}", which has no judge.`);
    }
    if (!problem.judge.solutionCode) {
      throw new Error(
        `Large tests for "${slug}", which has no JavaScript reference solution to compute their expected values.`,
      );
    }
    const names = new Set(problem.judge.tests.map((test) => test.name));
    for (const test of tests) {
      if (!test.name)
        throw new Error(`A large test for "${slug}" has no name.`);
      if (names.has(test.name)) {
        throw new Error(`"${slug}" already has a test named "${test.name}".`);
      }
      names.add(test.name);
    }
    if (!hasGeneratedTests(tests)) {
      throw new Error(`Large tests for "${slug}" generate nothing.`);
    }
    expandTests(tests);
  }
}
