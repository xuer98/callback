import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// The JavaScript-coding track, part B: the Promise.all siblings the bank
// lacked (allSettled and any), on the virtual clock so the grader sees
// exactly when each result settles.

// Each spec is { plain } for a non-promise value, or { ms, value } / { ms, fail }
// for a promise that settles after ms. Rejections carry the plain reason so the
// verdict can show it.
const settleHelpers = `function __settleAfter(spec) {
  if ("plain" in spec) return spec.plain;
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if ("fail" in spec) reject(spec.fail);
      else resolve(spec.value);
    }, spec.ms);
  });
}

function __withoutCombinators(run) {
  var names = ["all", "allSettled", "race", "any"];
  var saved = {};
  names.forEach(function (name) {
    saved[name] = Promise[name];
    Promise[name] = function () {
      throw new Error("Write it yourself: Promise." + name + " is off limits here");
    };
  });
  try {
    return run();
  } finally {
    names.forEach(function (name) {
      Promise[name] = saved[name];
    });
  }
}`;

export const jsPlaybookProblemsB: Problem[] = [
  {
    slug: "implement-promise-all-settled",
    title: "Implement Promise.allSettled",
    category: "frontend",
    difficulty: "medium",
    companies: ["ebay"],
    summary:
      "Record every outcome by index as `{ status, value | reason }`; it never rejects, and an empty input resolves at once.",
    prompt: [
      "Implement `promiseAllSettled(promises)`, which behaves like `Promise.allSettled` for an array, without calling it. `Promise.all`, `allSettled`, `race` and `any` are switched off while it runs.",
      "",
      '- Resolve once every input has settled, with one outcome object per input in **input order**: `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`.',
      "- Accept plain values beside promises.",
      "- Never reject, whatever the inputs do.",
      "- Resolve an empty input at once, with `[]`.",
      "",
      "Everything runs on a virtual clock, so the grader sees exactly when the result settles.",
    ].join("\n"),
    hints: [
      'The structure is `Promise.all` with the rejection handler changed: instead of rejecting the outer promise, record `{ status: "rejected", reason }` at that index and count down like any other settlement.',
      "Give `then` both handlers, and do the count-down in a second `then` so fulfilment and rejection share one path.",
    ],
    solution: [
      "## Approach",
      "",
      "Allocate the results by length and count down. Each input is wrapped in `Promise.resolve` so plain values behave like promises; its `then` gets two handlers that each write an outcome object at the input's own index, and a trailing `then` decrements the counter and resolves when it reaches zero. Nothing ever calls `reject`, which is the whole point of the method. The empty input resolves immediately because nothing would ever count down.",
      "",
      "## Worth saying out loud",
      "",
      "- `allSettled` is what you want for independent tasks whose failures are per-item information, not a reason to abandon the batch — form uploads, prefetches, analytics.",
      "- The outcome objects are the API: consumers filter on `status` rather than catching, which is why the method never rejects even when every input does.",
      "- The spec takes any iterable; spreading it into an array first makes this version identical.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Promise.allSettled for an array, without calling it. */
function promiseAllSettled(promises) {
  // Your code here
  return Promise.resolve([]);
}
`,
      solutionCode: `function promiseAllSettled(promises) {
  return new Promise((resolve) => {
    const results = new Array(promises.length);
    let pending = promises.length;
    if (pending === 0) {
      resolve(results); // nothing will ever count down
      return;
    }
    promises.forEach((item, i) => {
      Promise.resolve(item)
        .then(
          (value) => {
            results[i] = { status: "fulfilled", value };
          },
          (reason) => {
            results[i] = { status: "rejected", reason }; // recorded, never thrown
          },
        )
        .then(() => {
          pending -= 1;
          if (pending === 0) resolve(results);
        });
    });
  });
}
`,
      entry: "__judgeAllSettled",
      driverCode: `${virtualClock}

${settleHelpers}

async function __judgeAllSettled(specs) {
  var clock = __virtualClock();
  try {
    return await clock.run(function () {
      return __withoutCombinators(function () {
        return promiseAllSettled(specs.map(__settleAfter));
      });
    });
  } finally {
    clock.restore();
  }
}`,
      tests: [
        {
          name: "mixed outcomes, in input order",
          input: [[{ ms: 30, value: 1 }, { ms: 10, fail: "x" }, { plain: 3 }]],
          expected: {
            value: [
              { status: "fulfilled", value: 1 },
              { status: "rejected", reason: "x" },
              { status: "fulfilled", value: 3 },
            ],
            at: 30,
          },
        },
        {
          name: "an empty input resolves at once",
          input: [[]],
          expected: { value: [], at: 0 },
        },
        {
          name: "every input rejecting still resolves",
          input: [
            [
              { ms: 5, fail: "a" },
              { ms: 1, fail: "b" },
            ],
          ],
          expected: {
            value: [
              { status: "rejected", reason: "a" },
              { status: "rejected", reason: "b" },
            ],
            at: 5,
          },
        },
        {
          name: "waits for the slowest even after an early failure",
          input: [
            [
              { ms: 50, value: "slow" },
              { ms: 1, fail: "fast" },
            ],
          ],
          expected: {
            value: [
              { status: "fulfilled", value: "slow" },
              { status: "rejected", reason: "fast" },
            ],
            at: 50,
          },
        },
        {
          name: "plain values only",
          input: [[{ plain: 1 }, { plain: "two" }]],
          expected: {
            value: [
              { status: "fulfilled", value: 1 },
              { status: "fulfilled", value: "two" },
            ],
            at: 0,
          },
        },
      ],
    },
  },
  {
    slug: "implement-promise-any",
    title: "Implement Promise.any",
    category: "frontend",
    difficulty: "medium",
    companies: [],
    summary:
      "Resolve on the first fulfilment; reject only when every input has failed, with an AggregateError whose errors follow input order.",
    prompt: [
      "Implement `promiseAny(promises)`, which behaves like `Promise.any` for an array, without calling it. `Promise.all`, `allSettled`, `race` and `any` are switched off while it runs.",
      "",
      "- Resolve with the value of the **first input to fulfil**, however many others have already rejected.",
      "- Reject only once every input has rejected, with an `AggregateError` whose `errors` array holds the reasons in **input order** (its message may be anything).",
      "- Accept plain values beside promises.",
      "- An empty input rejects at once, with an `AggregateError` whose `errors` is `[]`.",
      "",
      "Everything runs on a virtual clock, so the grader sees exactly when the result settles.",
    ].join("\n"),
    hints: [
      "`Promise.all` inverted: pass `resolve` straight through as the fulfilment handler, and do the counting in the rejection handler.",
      "Store each reason at its input's index, not in arrival order, so the `errors` array reads like the input did.",
    ],
    solution: [
      "## Approach",
      "",
      "Every input's fulfilment handler is the outer `resolve` itself, so the first one to fulfil wins and later ones are ignored, because a promise settles once. The rejection handler writes the reason at the input's index and counts down; only when the count hits zero does the outer promise reject, with `new AggregateError(errors)`. The empty array has nothing to count down, so it rejects immediately.",
      "",
      "## Worth saying out loud",
      "",
      "- `any` is for redundancy: several mirrors or caches where the first good answer is enough and a failure only matters if they all fail.",
      "- `race` settles on the first settlement of either kind; `any` ignores rejections until they are unanimous. Interviewers like to hear the difference stated.",
      "- `AggregateError` is an `Error` subclass with an `errors` array; before it existed, libraries rejected with a plain array and lost the stack.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Promise.any for an array, without calling it. */
function promiseAny(promises) {
  // Your code here
  return new Promise(() => {});
}
`,
      solutionCode: `function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    const errors = new Array(promises.length);
    let pending = promises.length;
    if (pending === 0) {
      reject(new AggregateError(errors, "All promises were rejected"));
      return;
    }
    promises.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (reason) => {
        errors[i] = reason; // input order, not failure order
        pending -= 1;
        if (pending === 0) {
          reject(new AggregateError(errors, "All promises were rejected"));
        }
      });
    });
  });
}
`,
      entry: "__judgePromiseAny",
      driverCode: `${virtualClock}

${settleHelpers}

async function __judgePromiseAny(specs) {
  var clock = __virtualClock();
  try {
    var outcome = await clock.run(function () {
      return __withoutCombinators(function () {
        return promiseAny(specs.map(__settleAfter)).then(
          function (value) {
            return { ok: true, value: value };
          },
          function (err) {
            return {
              ok: false,
              type: err instanceof AggregateError ? "AggregateError" : String(err),
              errors: err && err.errors,
            };
          },
        );
      });
    });
    var result = outcome.value || { ok: false, type: outcome.error };
    result.at = outcome.at;
    return result;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        {
          name: "the first fulfilment wins",
          input: [[{ plain: 42 }, { ms: 100, value: 21 }]],
          expected: { ok: true, value: 42, at: 0 },
        },
        {
          name: "a later rejection changes nothing",
          input: [
            [
              { ms: 100, value: 42 },
              { ms: 400, fail: "Err!" },
            ],
          ],
          expected: { ok: true, value: 42, at: 100 },
        },
        {
          name: "an early rejection is ignored",
          input: [
            [
              { ms: 300, fail: "a" },
              { ms: 50, value: "b" },
              { ms: 10, fail: "c" },
            ],
          ],
          expected: { ok: true, value: "b", at: 50 },
        },
        {
          name: "all rejected: AggregateError in input order",
          input: [
            [
              { ms: 400, fail: 42 },
              { ms: 100, fail: "Err!" },
            ],
          ],
          expected: {
            ok: false,
            type: "AggregateError",
            errors: [42, "Err!"],
            at: 400,
          },
        },
        {
          name: "an empty input rejects at once",
          input: [[]],
          expected: { ok: false, type: "AggregateError", errors: [], at: 0 },
        },
      ],
    },
  },
];
