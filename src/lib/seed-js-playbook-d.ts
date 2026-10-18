import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// The JavaScript-coding track, part D: retry with exponential backoff, on
// the virtual clock so the grader sees when each attempt starts.

export const jsPlaybookProblemsD: Problem[] = [
  {
    slug: "promise-retry-backoff",
    title: "Retry With Exponential Backoff",
    category: "frontend",
    difficulty: "medium",
    companies: [],
    summary:
      "Try, wait, multiply the wait, try again: the first fulfilment wins, the last failure is the error, and no wait follows it.",
    prompt: [
      "Implement `retry(task, options)`: call `task()`, which returns a promise, and if it rejects, wait and call it again, waiting longer each time.",
      "",
      "```js",
      "retry(() => fetchJson(url), { retries: 3, delay: 100, factor: 2 });",
      "// attempt at 0 ms; on failure wait 100, 200, then 400 ms between attempts",
      "```",
      "",
      "- `retries` (default 3) is the number of **extra** attempts after the first; `delay` (default 100) is the first wait in ms; each later wait is the previous one times `factor` (default 2).",
      "- Resolve with the first fulfilment. After the last allowed attempt fails, reject with **that** error, without waiting again.",
      "- `shouldRetry(error)` (default: always) is consulted after each failure; when it returns `false`, reject with that error immediately.",
      "- Time spent inside `task()` is not part of the wait: the next wait starts when the failure arrives.",
      "",
      "Everything runs on a virtual clock, so the grader sees exactly when each attempt starts and when the result settles.",
    ].join("\n"),
    hints: [
      "An `async` function with a `for` loop reads best: `try { return await task(); } catch (error) { ... }`. The `await` inside `try` catches synchronous throws too.",
      "Decide to stop before you wait: if this was the last allowed attempt, or `shouldRetry` says no, rethrow; otherwise `await` a timeout and multiply the wait.",
    ],
    solution: [
      "## Approach",
      "",
      "A loop over attempts: `await task()` inside `try`, return on success. In `catch`, two checks end the loop by rethrowing — this was the last allowed attempt, or `shouldRetry(error)` says the error is not worth retrying. Otherwise await a `setTimeout` promise for the current wait, multiply the wait by the factor, and go round again. Because the wait happens after the failure arrives, slow tasks don't eat into it.",
      "",
      "## Worth saying out loud",
      "",
      "- Add jitter in production (`wait * (0.5 + Math.random())`): identical clients retrying on identical schedules stampede the server together.",
      "- Cap the wait, and accept an `AbortSignal` so a user navigating away stops the loop.",
      "- Only retry what is safe to repeat: a `GET`, or a `POST` with an idempotency key. And a `400` will fail again however long you wait; `shouldRetry` is where that knowledge goes.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Call task() until it fulfils, waiting delay, delay*factor, ... between tries.
 * @param {() => Promise<*>} task
 * @param {{ retries?: number, delay?: number, factor?: number, shouldRetry?: (error: *) => boolean }} [options]
 * @returns {Promise<*>}
 */
async function retry(task, options = {}) {
  // Your code here
  return task();
}
`,
      solutionCode: `async function retry(task, options = {}) {
  const { retries = 3, delay = 100, factor = 2, shouldRetry = () => true } = options;
  let wait = delay;
  for (let attempt = 0; ; attempt++) {
    try {
      return await task(); // a synchronous throw lands in the catch too
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) throw error; // the last failure is the answer
      await new Promise((resolve) => setTimeout(resolve, wait));
      wait *= factor;
    }
  }
}
`,
      entry: "__judgeRetry",
      driverCode: `${virtualClock}

async function __judgeRetry(outcomes, options) {
  var clock = __virtualClock();
  var attempts = [];
  var next = 0;
  function task() {
    attempts.push(clock.time());
    var spec = outcomes[Math.min(next, outcomes.length - 1)];
    next += 1;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if ("fail" in spec) reject(new Error(spec.fail));
        else resolve(spec.value);
      }, spec.ms || 0);
    });
  }
  var opts = Object.assign({}, options || {});
  if (opts.retryOnlyPrefix !== undefined) {
    var prefix = opts.retryOnlyPrefix;
    delete opts.retryOnlyPrefix;
    opts.shouldRetry = function (error) {
      return String(error.message).indexOf(prefix) === 0;
    };
  }
  try {
    var outcome = await clock.run(function () {
      return options === null ? retry(task) : retry(task, opts);
    });
    var result = "value" in outcome ? { ok: true, value: outcome.value } : { ok: false, error: outcome.error };
    result.at = outcome.at;
    result.attempts = attempts;
    return result;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        {
          name: "succeeds on the third attempt",
          input: [
            [{ fail: "a" }, { fail: "b" }, { value: "ok" }],
            { retries: 3, delay: 100 },
          ],
          expected: { ok: true, value: "ok", at: 300, attempts: [0, 100, 300] },
        },
        {
          name: "a first-try success never waits",
          input: [[{ value: 1 }], null],
          expected: { ok: true, value: 1, at: 0, attempts: [0] },
        },
        {
          name: "gives up with the last error, and no trailing wait",
          input: [
            [{ fail: "a" }, { fail: "b" }, { fail: "c" }, { fail: "d" }],
            { retries: 2, delay: 50 },
          ],
          expected: { ok: false, error: "c", at: 150, attempts: [0, 50, 150] },
        },
        {
          name: "the factor multiplies each wait",
          input: [
            [{ fail: "a" }, { fail: "b" }, { fail: "c" }, { value: 9 }],
            { retries: 3, delay: 10, factor: 3 },
          ],
          expected: { ok: true, value: 9, at: 130, attempts: [0, 10, 40, 130] },
        },
        {
          name: "defaults: 3 retries of 100, 200, 400",
          input: [
            [
              { fail: "a" },
              { fail: "b" },
              { fail: "c" },
              { fail: "d" },
              { value: 5 },
            ],
            null,
          ],
          expected: {
            ok: false,
            error: "d",
            at: 700,
            attempts: [0, 100, 300, 700],
          },
        },
        {
          name: "retries: 0 means a single attempt",
          input: [[{ fail: "nope" }, { value: 1 }], { retries: 0 }],
          expected: { ok: false, error: "nope", at: 0, attempts: [0] },
        },
        {
          name: "shouldRetry can stop at once",
          input: [
            [{ fail: "fatal: disk" }, { value: 1 }],
            { retries: 3, delay: 100, retryOnlyPrefix: "net" },
          ],
          expected: { ok: false, error: "fatal: disk", at: 0, attempts: [0] },
        },
        {
          name: "the wait starts when the failure arrives",
          input: [
            [
              { fail: "a", ms: 20 },
              { value: 2, ms: 5 },
            ],
            { retries: 1, delay: 100 },
          ],
          expected: { ok: true, value: 2, at: 125, attempts: [0, 120] },
        },
      ],
    },
  },
];
