import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// Apple front-end bank (the JavaScript interview guide, 2026), part B: the
// promise-sequencing prompts — run tasks one after another (with the
// generator runner the interviewer hinted at), then map with a concurrency
// limit. TypeScript variants live in seed-typescript-apple.ts.

export const appleJsProblemsB: Problem[] = [
  {
    slug: "run-promises-in-sequence",
    title: "Run Promises in Sequence",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Clarify that you need functions, not promises, then chain them three ways, including the generator runner the interviewer hints at.",
    prompt: [
      "The question, as a Glassdoor report put it: \"What is promise, how can you execute array of promise sequence by sequence\", with a hint to use generators.",
      "",
      "**Clarify the input first.** A promise starts its work when it is created, so an array of promises is already running in parallel. Sequencing needs an array of *tasks*: functions that each return a promise.",
      "",
      "## Part 1: `runInSequence(tasks)`",
      "",
      "Call each task only after the previous one has settled. Resolve with the results in task order. If a task rejects, reject with that reason and never start the tasks after it. An empty list resolves to `[]`.",
      "",
      "## Part 2: `run(genFn)`, the generator runner",
      "",
      "This is the hint, and how `async`/`await` worked before it was syntax. `run` starts the generator and returns a promise. Each time the generator yields a value, `run` waits for it (plain values count as already resolved) and resumes the generator with the result. A rejection is thrown into the generator at the `yield`, where a `try`/`catch` can handle it. `run` resolves with the generator's return value and rejects if the generator throws.",
      "",
      "```",
      "run(function* () {",
      "  const user = yield fetchUser(1);        // resumes with the user",
      "  try { yield fetchPosts(user.id); }       // a rejection lands here",
      "  catch (err) { return \"no posts: \" + err.message; }",
      "});",
      "```",
      "",
      "The grader runs your code on a virtual clock. Tasks record when they start and settle, so the checks see exactly when each one ran.",
      "",
      "*Reported in: Glassdoor (Dec 2019) and BFE.dev's Apple tag. Expect \"now run at most N at a time\" next: that is [mapAsync and mapAsyncLimit](/problems/map-async-limit).*",
    ].join("\n"),
    hints: [
      "The shortest correct version is a `for...of` loop that awaits each `task()` and pushes the result. A rejection throws out of the loop, so later tasks never start.",
      "The pre-async version reduces into a chain: start from `Promise.resolve([])`, and have each step call the task inside the previous step's `.then`.",
      "For `run`, write a `step(method, arg)` that calls `it[method](arg)` inside a `try`. Resolve when the result is `done`. Otherwise wrap the value in `Promise.resolve` and continue with `step(\"next\", value)` or `step(\"throw\", err)`.",
    ],
    solution: [
      "## Approach",
      "",
      "Three shapes of the same idea: never call the next task until the previous promise settles.",
      "",
      "```js",
      "// 1. reduce into a chain",
      "const runInSequenceChain = (tasks) =>",
      "  tasks.reduce(",
      "    (chain, task) => chain.then((results) => task().then((r) => [...results, r])),",
      "    Promise.resolve([]),",
      "  );",
      "",
      "// 2. async/await",
      "async function runInSequence(tasks) {",
      "  const results = [];",
      "  for (const task of tasks) results.push(await task());",
      "  return results;",
      "}",
      "```",
      "",
      "The third is the generator runner the interviewer hinted at. `yield` hands a promise out, the runner waits, then resumes the generator with the value or throws the error back in. With it, sequencing is a generator that yields each `task()` in turn.",
      "",
      "## Worth saying out loud",
      "",
      "- An array of promises can't be sequenced: they already started. Ask for functions.",
      "- All three stop at the first rejection and never start the remaining tasks.",
      "- `run` is the essence of `async`/`await`: `await` is `yield` plus a runner that the engine provides.",
      "- A generator that catches the error can keep going. A runner that only ever calls `it.next` cannot deliver the rejection to that `catch`.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Run each task (a function returning a promise) after the previous one settles.
 * @param {Array<() => Promise<any>>} tasks
 * @returns {Promise<any[]>}
 */
async function runInSequence(tasks) {
  // Your code here
  return [];
}

/**
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
      solutionCode: `async function runInSequence(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task()); // a rejection throws out; later tasks never start
  }
  return results;
}

function run(genFn) {
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
      entry: "__judgeSequence",
      driverCode: `${virtualClock}

async function __judgeSequence(kind, spec) {
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
    var out;
    if (kind === "sequence") {
      var tasks = spec.map(function (t, i) {
        return function () {
          log.push("start " + i + " @" + clock.time());
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              if ("fail" in t) {
                log.push("fail " + i + " @" + clock.time());
                reject(new Error(t.fail));
              } else {
                log.push("end " + i + " @" + clock.time());
                resolve(t.value);
              }
            }, t.ms);
          });
        };
      });
      out = await clock.run(function () { return runInSequence(tasks); });
    } else if (kind === "generator") {
      out = await clock.run(function () { return run(generators[spec]); });
    } else {
      throw new Error("unknown case " + kind);
    }
    await clock.drain();
    var report = "error" in out ? { error: out.error, at: out.at } : { result: out.value, at: out.at };
    report.log = log;
    return report;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        {
          name: "Results arrive in task order",
          input: ["sequence", [{ ms: 30, value: "a" }, { ms: 10, value: "b" }, { ms: 20, value: "c" }]],
          expected: { result: ["a", "b", "c"], at: 60, log: ["start 0 @0", "end 0 @30", "start 1 @30", "end 1 @40", "start 2 @40", "end 2 @60"] },
        },
        {
          name: "Each task waits for the previous one to settle",
          input: ["sequence", [{ ms: 0, value: 1 }, { ms: 0, value: 2 }]],
          expected: { result: [1, 2], at: 0, log: ["start 0 @0", "end 0 @0", "start 1 @0", "end 1 @0"] },
        },
        {
          name: "Stops at the first rejection",
          input: ["sequence", [{ ms: 10, value: 1 }, { ms: 5, fail: "boom" }, { ms: 5, value: 3 }]],
          expected: { error: "boom", at: 15, log: ["start 0 @0", "end 0 @10", "start 1 @10", "fail 1 @15"] },
        },
        {
          name: "A failing first task starts nothing else",
          input: ["sequence", [{ ms: 0, fail: "early" }, { ms: 1, value: 2 }]],
          expected: { error: "early", at: 0, log: ["start 0 @0", "fail 0 @0"] },
        },
        {
          name: "An empty list resolves to []",
          input: ["sequence", []],
          expected: { result: [], at: 0, log: [] },
        },
        {
          name: "Results can be any value",
          input: ["sequence", [{ ms: 5, value: null }, { ms: 5, value: { k: 1 } }]],
          expected: { result: [null, { k: 1 }], at: 10, log: ["start 0 @0", "end 0 @5", "start 1 @5", "end 1 @10"] },
        },
        { name: "run resumes the generator with each value", input: ["generator", "inOrder"], expected: { result: [1, 2], at: 30, log: [] } },
        { name: "run throws a rejection into the generator", input: ["generator", "catches"], expected: { result: "caught nope", at: 5, log: [] } },
        { name: "run accepts plain yielded values", input: ["generator", "plainValues"], expected: { result: 15, at: 0, log: [] } },
        { name: "A synchronous throw rejects", input: ["generator", "syncThrow"], expected: { error: "sync", at: 0, log: [] } },
        { name: "An uncaught rejection rejects, and the generator stops", input: ["generator", "uncaught"], expected: { error: "bad", at: 3, log: [] } },
        { name: "A generator that returns at once", input: ["generator", "immediate"], expected: { result: 42, at: 0, log: [] } },
      ],
    },
  },
  {
    slug: "map-async-limit",
    title: "mapAsync and mapAsyncLimit",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Map through an async function with at most N calls in flight: a sliding window, results in input order, nothing new after a failure.",
    prompt: [
      "Implement two helpers over an async mapping function `fn(item)` that returns a promise:",
      "",
      "- `mapAsync(items, fn)` calls `fn` on every item at once and resolves with the results in input order.",
      "- `mapAsyncLimit(items, fn, size = Infinity)` does the same with **at most `size` calls in flight**. When a call settles, the next item starts right away.",
      "",
      "## Rules",
      "",
      "- Results come back in input order, whatever order the calls finish in.",
      "- `items` can be any iterable, not only an array. An empty input resolves to `[]`.",
      "- Both reject with the first rejection. After it, `mapAsyncLimit` starts no new calls. Calls already in flight may finish, but their results are ignored.",
      "- Use a sliding window, not fixed chunks. Awaiting `Promise.all` on one slice at a time makes every chunk wait for its slowest call, and the grader sees it in the start times.",
      "",
      "Your helpers run on a virtual clock, and the grader's `fn` logs when each call starts and settles.",
      "",
      "*Listed under Apple by GreatFrontEnd, with no date or role. It generalizes [Run Promises in Sequence](/problems/run-promises-in-sequence): a limit of 1 is sequential, and no limit is `Promise.all`.*",
    ].join("\n"),
    hints: [
      "`mapAsync` is one line over `Promise.all`. For the limit, start `min(size, n)` workers. Each loops: take the next index, `await fn(items[i])`, store the result at index `i`, repeat.",
      "`const i = next++` is safe without locks. JavaScript runs it synchronously between awaits, so two workers never take the same index.",
      "Keep a `failed` flag. The worker whose call rejects sets it, and every worker checks it before taking another item.",
    ],
    solution: [
      "## Approach",
      "",
      "`mapAsync` hands the whole list to `Promise.all`, which keeps input order. `mapAsyncLimit` runs a small pool: `min(size, n)` async workers share one `next` index. Each worker takes an index, awaits the call, writes the result into that slot, and loops until the list runs out or a call has failed. `Promise.all` over the workers resolves once they all drain, and rejects with the first failure.",
      "",
      "## Worth saying out loud",
      "",
      "- **Completion order must not decide result order.** Write by index; never push.",
      "- **A sliding window beats fixed chunks.** A chunk waits for its slowest call, while a pool starts the next item the moment a slot frees.",
      "- Without the `failed` flag, the other workers keep taking items after a rejection and burn requests nobody will read.",
      "- In-flight calls can't be cancelled by the helper. Real cancellation passes an `AbortSignal` into `fn`.",
      "- A limit of 1 is sequential, and no limit is `Promise.all`. Saying so shows you see the family.",
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

/**
 * Like mapAsync, with at most \`size\` calls in flight.
 * @param {Iterable<any>} items
 * @param {(item: any) => Promise<any>} fn
 * @param {number} [size=Infinity]
 * @returns {Promise<any[]>}
 */
function mapAsyncLimit(items, fn, size = Infinity) {
  // Your code here
  return Promise.resolve([]);
}
`,
      solutionCode: `function mapAsync(items, fn) {
  return Promise.all(Array.from(items, (item) => fn(item)));
}

async function mapAsyncLimit(items, fn, size = Infinity) {
  const list = Array.from(items);
  const results = new Array(list.length);
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < list.length) {
      const i = next++; // synchronous between awaits, so no two workers share an index
      try {
        results[i] = await fn(list[i]);
      } catch (err) {
        failed = true; // no new calls after the first rejection
        throw err;
      }
    }
  };
  const count = Math.min(size, list.length);
  await Promise.all(Array.from({ length: count }, worker));
  return results;
}
`,
      entry: "__judgeMapAsync",
      driverCode: `${virtualClock}

async function __judgeMapAsync(kind, items, size, asIterable) {
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
    var out = await clock.run(function () {
      if (kind === "mapAsync") return mapAsync(source, mapper);
      if (size === "default") return mapAsyncLimit(source, mapper);
      return mapAsyncLimit(source, mapper, size);
    });
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
          input: ["mapAsync", [{ id: 0, ms: 30, value: "a" }, { id: 1, ms: 10, value: "b" }, { id: 2, ms: 20, value: "c" }], null, false],
          expected: { result: ["a", "b", "c"], at: 30, maxInFlight: 3, log: ["start 0 @0", "start 1 @0", "start 2 @0", "end 1 @10", "end 2 @20", "end 0 @30"] },
        },
        {
          name: "Size 2 is a sliding window, not fixed chunks",
          input: ["limit", [{ id: 0, ms: 30, value: "a" }, { id: 1, ms: 10, value: "b" }, { id: 2, ms: 20, value: "c" }, { id: 3, ms: 5, value: "d" }], 2, false],
          expected: { result: ["a", "b", "c", "d"], at: 35, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "end 1 @10", "start 2 @10", "end 0 @30", "start 3 @30", "end 2 @30", "end 3 @35"] },
        },
        {
          name: "Size 1 runs one call at a time",
          input: ["limit", [{ id: 0, ms: 5, value: 1 }, { id: 1, ms: 5, value: 2 }], 1, false],
          expected: { result: [1, 2], at: 10, maxInFlight: 1, log: ["start 0 @0", "end 0 @5", "start 1 @5", "end 1 @10"] },
        },
        {
          name: "No size means no limit",
          input: ["limit", [{ id: 0, ms: 5, value: 1 }, { id: 1, ms: 5, value: 2 }, { id: 2, ms: 5, value: 3 }], "default", false],
          expected: { result: [1, 2, 3], at: 5, maxInFlight: 3, log: ["start 0 @0", "start 1 @0", "start 2 @0", "end 0 @5", "end 1 @5", "end 2 @5"] },
        },
        {
          name: "A rejection fails the map and starts nothing new",
          input: ["limit", [{ id: 0, ms: 10, value: 1 }, { id: 1, ms: 5, fail: "x" }, { id: 2, ms: 1, value: 3 }, { id: 3, ms: 1, value: 4 }], 2, false],
          expected: { error: "x", at: 5, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "fail 1 @5", "end 0 @10"] },
        },
        {
          name: "mapAsync rejects with the first rejection",
          input: ["mapAsync", [{ id: 0, ms: 10, fail: "late" }, { id: 1, ms: 5, fail: "early" }], null, false],
          expected: { error: "early", at: 5, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "fail 1 @5", "fail 0 @10"] },
        },
        {
          name: "An empty list resolves to []",
          input: ["limit", [], 2, false],
          expected: { result: [], at: 0, maxInFlight: 0, log: [] },
        },
        {
          name: "Any iterable works",
          input: ["limit", [{ id: 0, ms: 5, value: "x" }, { id: 1, ms: 5, value: "y" }, { id: 2, ms: 5, value: "z" }], 2, true],
          expected: { result: ["x", "y", "z"], at: 10, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "end 0 @5", "start 2 @5", "end 1 @5", "end 2 @10"] },
        },
        {
          name: "A size larger than the list",
          input: ["limit", [{ id: 0, ms: 3, value: 1 }, { id: 1, ms: 1, value: 2 }], 10, false],
          expected: { result: [1, 2], at: 3, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "end 1 @1", "end 0 @3"] },
        },
      ],
    },
  },
];
