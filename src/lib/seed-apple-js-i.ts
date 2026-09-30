import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// Apple front-end bank, part I: the generator runner (async/await before it
// was syntax) and mapAsync without a limit. TypeScript variants live in
// seed-typescript-splits.ts.

export const appleJsProblemsI: Problem[] = [
  {
    slug: "generator-async-runner",
    title: "Drive a Generator Like async/await",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Resume the generator with each resolved value, and throw each rejection back in at the yield.",
    prompt: [
      "Before `async`/`await` was syntax, generators plus a small runner did the same job. Implement `run(genFn)`.",
      "",
      "`run` starts the generator and returns a promise. Each time the generator yields a value, `run` waits for it (plain values count as already resolved) and resumes the generator with the result. A rejection is thrown into the generator at the `yield`, where a `try`/`catch` can handle it. `run` resolves with the generator's return value and rejects if the generator throws.",
      "",
      "```",
      "run(function* () {",
      "  const user = yield fetchUser(1);        // resumes with the user",
      "  try { yield fetchPosts(user.id); }       // a rejection lands here",
      "  catch (err) { return \"no posts: \" + err.message; }",
      "});",
      "```",
      "",
      "The grader runs your code on a virtual clock, with generators that yield timed promises.",
    ].join("\n"),
    hints: [
      "Write a `step(method, arg)` that calls `it[method](arg)` inside a `try`. A throw there means the generator didn't catch it: reject.",
      "Resolve when the result is `done`. Otherwise wrap the value in `Promise.resolve` and continue with `step(\"next\", value)` or `step(\"throw\", err)`.",
    ],
    solution: [
      "## Approach",
      "",
      "`yield` hands a promise out, the runner waits, then resumes the generator with the value or throws the error back in. One recursive `step` does all of it: advance the iterator with `next` or `throw`, reject if that advance throws, resolve on `done`, and otherwise chain the next step onto `Promise.resolve(value)`.",
      "",
      "## Worth saying out loud",
      "",
      "- `run` is the essence of `async`/`await`: `await` is `yield` plus a runner that the engine provides.",
      "- A generator that catches the error can keep going. A runner that only ever calls `it.next` cannot deliver the rejection to that `catch`.",
      "- `Promise.resolve(value)` is what lets the generator yield plain values and thenables alike.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Drive a generator: wait for each yielded value, resume with the result,
 * throw rejections back in. Resolves with the generator's return value.
 * @param {() => Generator} genFn
 * @returns {Promise<any>}
 */
function run(genFn) {
  // Your code here
  return Promise.resolve(undefined);
}
`,
      solutionCode: `function run(genFn) {
  return new Promise((resolve, reject) => {
    const it = genFn();
    const step = (method, arg) => {
      let r;
      try {
        r = it[method](arg); // "next" resumes with a value, "throw" raises at the yield
      } catch (err) {
        reject(err); // the generator didn't catch it
        return;
      }
      if (r.done) {
        resolve(r.value);
        return;
      }
      Promise.resolve(r.value).then(
        (value) => step("next", value),
        (err) => step("throw", err),
      );
    };
    step("next", undefined);
  });
}
`,
      entry: "__judgeRun",
      driverCode: `${virtualClock}

async function __judgeRun(name) {
  var clock = __virtualClock();
  var log = [];
  function delayed(ms, value) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(value); }, ms);
    });
  }
  function failing(ms, message) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { reject(new Error(message)); }, ms);
    });
  }
  var generators = {
    inOrder: function* () {
      var a = yield delayed(20, 1);
      var b = yield delayed(10, a + 1);
      return [a, b];
    },
    catches: function* () {
      try {
        yield failing(5, "nope");
        return "not caught";
      } catch (err) {
        return "caught " + err.message;
      }
    },
    plainValues: function* () {
      var x = yield 5;
      var y = yield Promise.resolve(x * 2);
      return x + y;
    },
    syncThrow: function* () {
      throw new Error("sync");
    },
    uncaught: function* () {
      yield failing(3, "bad");
      log.push("resumed after the rejection");
      return "unreachable";
    },
    immediate: function* () {
      return 42;
    },
  };
  try {
    var out = await clock.run(function () { return run(generators[name]); });
    await clock.drain();
    var report = "error" in out ? { error: out.error, at: out.at } : { result: out.value, at: out.at };
    report.log = log;
    return report;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        { name: "run resumes the generator with each value", input: ["inOrder"], expected: { result: [1, 2], at: 30, log: [] } },
        { name: "run throws a rejection into the generator", input: ["catches"], expected: { result: "caught nope", at: 5, log: [] } },
        { name: "run accepts plain yielded values", input: ["plainValues"], expected: { result: 15, at: 0, log: [] } },
        { name: "A synchronous throw rejects", input: ["syncThrow"], expected: { error: "sync", at: 0, log: [] } },
        { name: "An uncaught rejection rejects, and the generator stops", input: ["uncaught"], expected: { error: "bad", at: 3, log: [] } },
        { name: "A generator that returns at once", input: ["immediate"], expected: { result: 42, at: 0, log: [] } },
      ],
    },
  },
  {
    slug: "map-async",
    title: "mapAsync: Map Through an Async Function",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Start every call at once and let Promise.all keep the input order.",
    prompt: [
      "Implement `mapAsync(items, fn)`: call an async mapping function `fn(item)` (it returns a promise) on every item **at once**, and resolve with the results in input order.",
      "",
      "- Results come back in input order, whatever order the calls finish in.",
      "- `items` can be any iterable, not only an array. An empty input resolves to `[]`.",
      "- Reject with the first rejection.",
      "",
      "Your helper runs on a virtual clock, and the grader's `fn` logs when each call starts and settles.",
    ].join("\n"),
    hints: [
      "`Array.from(items, fn)` turns any iterable into an array of promises, starting every call.",
      "`Promise.all` keeps input order and rejects with the first rejection.",
    ],
    solution: [
      "## Approach",
      "",
      "Start every call, then wait for them together. `Array.from(items, ...)` accepts any iterable and calls `fn` on each item immediately; `Promise.all` resolves with the results in input order and rejects as soon as one call rejects.",
      "",
      "## Worth saying out loud",
      "",
      "- **Completion order doesn't decide result order** — `Promise.all` places each result at its input index.",
      "- The other calls keep running after the first rejection; `Promise.all` just stops waiting. Use `Promise.allSettled` when every outcome matters.",
      "- Unbounded parallelism is the weakness: a thousand items fire a thousand requests. Capping it is [mapAsyncLimit](/problems/map-async-limit).",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Map every item through fn at once; results in input order.
 * @param {Iterable<any>} items
 * @param {(item: any) => Promise<any>} fn
 * @returns {Promise<any[]>}
 */
function mapAsync(items, fn) {
  // Your code here
  return Promise.resolve([]);
}
`,
      solutionCode: `function mapAsync(items, fn) {
  return Promise.all(Array.from(items, (item) => fn(item)));
}
`,
      entry: "__judgeMapAsync",
      driverCode: `${virtualClock}

async function __judgeMapAsync(items, asIterable) {
  var clock = __virtualClock();
  var log = [];
  var inFlight = 0;
  var maxInFlight = 0;
  function mapper(item) {
    log.push("start " + item.id + " @" + clock.time());
    inFlight++;
    if (inFlight > maxInFlight) maxInFlight = inFlight;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        inFlight--;
        if ("fail" in item) {
          log.push("fail " + item.id + " @" + clock.time());
          reject(new Error(item.fail));
        } else {
          log.push("end " + item.id + " @" + clock.time());
          resolve(item.value);
        }
      }, item.ms);
    });
  }
  var source = items;
  if (asIterable) {
    source = (function* () {
      for (var k = 0; k < items.length; k++) yield items[k];
    })();
  }
  try {
    var out = await clock.run(function () { return mapAsync(source, mapper); });
    await clock.drain();
    var report = "error" in out ? { error: out.error, at: out.at } : { result: out.value, at: out.at };
    report.maxInFlight = maxInFlight;
    report.log = log;
    return report;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        {
          name: "mapAsync starts every call at once",
          input: [[{ id: 0, ms: 30, value: "a" }, { id: 1, ms: 10, value: "b" }, { id: 2, ms: 20, value: "c" }], false],
          expected: { result: ["a", "b", "c"], at: 30, maxInFlight: 3, log: ["start 0 @0", "start 1 @0", "start 2 @0", "end 1 @10", "end 2 @20", "end 0 @30"] },
        },
        {
          name: "mapAsync rejects with the first rejection",
          input: [[{ id: 0, ms: 10, fail: "late" }, { id: 1, ms: 5, fail: "early" }], false],
          expected: { error: "early", at: 5, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "fail 1 @5", "fail 0 @10"] },
        },
        {
          name: "An empty list resolves to []",
          input: [[], false],
          expected: { result: [], at: 0, maxInFlight: 0, log: [] },
        },
        {
          name: "Any iterable works",
          input: [[{ id: 0, ms: 5, value: "x" }, { id: 1, ms: 5, value: "y" }, { id: 2, ms: 5, value: "z" }], true],
          expected: { result: ["x", "y", "z"], at: 5, maxInFlight: 3, log: ["start 0 @0", "start 1 @0", "start 2 @0", "end 0 @5", "end 1 @5", "end 2 @5"] },
        },
      ],
    },
  },
];
