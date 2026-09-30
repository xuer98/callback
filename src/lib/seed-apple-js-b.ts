import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// Apple front-end bank, part B: running async tasks one after another, and
// mapping with a concurrency limit. The generator runner and the unlimited
// mapAsync are in seed-apple-js-i.ts. TypeScript variants live in
// seed-typescript-apple.ts.

export const appleJsProblemsB: Problem[] = [
  {
    slug: "run-promises-in-sequence",
    title: "Run Promises in Sequence",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Take functions, not promises — then never call the next task until the previous one settles.",
    prompt: [
      "Execute an array of asynchronous tasks one after another.",
      "",
      "**Clarify the input first.** A promise starts its work when it is created, so an array of promises is already running in parallel. Sequencing needs an array of *tasks*: functions that each return a promise.",
      "",
      "Implement `runInSequence(tasks)`: call each task only after the previous one has settled. Resolve with the results in task order. If a task rejects, reject with that reason and never start the tasks after it. An empty list resolves to `[]`.",
      "",
      "The grader runs your code on a virtual clock. Tasks record when they start and settle, so the checks see exactly when each one ran.",
    ].join("\n"),
    hints: [
      "The shortest correct version is a `for...of` loop that awaits each `task()` and pushes the result. A rejection throws out of the loop, so later tasks never start.",
      "The pre-async version reduces into a chain: start from `Promise.resolve([])`, and have each step call the task inside the previous step's `.then`.",
    ],
    solution: [
      "## Approach",
      "",
      "Two shapes of the same idea: never call the next task until the previous promise settles.",
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
      "A third shape is a generator that yields each `task()` in turn, driven by a small runner — see [Drive a Generator Like async/await](/problems/generator-async-runner).",
      "",
      "## Worth saying out loud",
      "",
      "- An array of promises can't be sequenced: they already started. Ask for functions.",
      "- Both versions stop at the first rejection and never start the remaining tasks.",
      "- \"Now run at most N at a time\" is the natural next step: a limit of 1 is this function, and no limit is `Promise.all` — see [mapAsyncLimit](/problems/map-async-limit).",
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
`,
      solutionCode: `async function runInSequence(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task()); // a rejection throws out; later tasks never start
  }
  return results;
}
`,
      entry: "__judgeSequence",
      driverCode: `${virtualClock}

async function __judgeSequence(spec) {
  var clock = __virtualClock();
  var log = [];
  try {
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
    var out = await clock.run(function () { return runInSequence(tasks); });
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
          input: [[{ ms: 30, value: "a" }, { ms: 10, value: "b" }, { ms: 20, value: "c" }]],
          expected: { result: ["a", "b", "c"], at: 60, log: ["start 0 @0", "end 0 @30", "start 1 @30", "end 1 @40", "start 2 @40", "end 2 @60"] },
        },
        {
          name: "Each task waits for the previous one to settle",
          input: [[{ ms: 0, value: 1 }, { ms: 0, value: 2 }]],
          expected: { result: [1, 2], at: 0, log: ["start 0 @0", "end 0 @0", "start 1 @0", "end 1 @0"] },
        },
        {
          name: "Stops at the first rejection",
          input: [[{ ms: 10, value: 1 }, { ms: 5, fail: "boom" }, { ms: 5, value: 3 }]],
          expected: { error: "boom", at: 15, log: ["start 0 @0", "end 0 @10", "start 1 @10", "fail 1 @15"] },
        },
        {
          name: "A failing first task starts nothing else",
          input: [[{ ms: 0, fail: "early" }, { ms: 1, value: 2 }]],
          expected: { error: "early", at: 0, log: ["start 0 @0", "fail 0 @0"] },
        },
        {
          name: "An empty list resolves to []",
          input: [[]],
          expected: { result: [], at: 0, log: [] },
        },
        {
          name: "Results can be any value",
          input: [[{ ms: 5, value: null }, { ms: 5, value: { k: 1 } }]],
          expected: { result: [null, { k: 1 }], at: 10, log: ["start 0 @0", "end 0 @5", "start 1 @5", "end 1 @10"] },
        },
      ],
    },
  },
  {
    slug: "map-async-limit",
    title: "mapAsyncLimit: At Most N Calls in Flight",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "A sliding window of N workers: results in input order, nothing new after a failure.",
    prompt: [
      "Implement `mapAsyncLimit(items, fn, size = Infinity)`: map every item through an async function `fn(item)` that returns a promise, with **at most `size` calls in flight**, and resolve with the results. When a call settles, the next item starts right away.",
      "",
      "## Rules",
      "",
      "- Results come back in input order, whatever order the calls finish in.",
      "- `items` can be any iterable, not only an array. An empty input resolves to `[]`.",
      "- Reject with the first rejection, and start no new calls after it. Calls already in flight may finish, but their results are ignored.",
      "- Use a sliding window, not fixed chunks. Awaiting `Promise.all` on one slice at a time makes every chunk wait for its slowest call, and the grader sees it in the start times.",
      "",
      "Your helper runs on a virtual clock, and the grader's `fn` logs when each call starts and settles.",
    ].join("\n"),
    hints: [
      "Start `min(size, n)` workers. Each loops: take the next index, `await fn(items[i])`, store the result at index `i`, repeat.",
      "`const i = next++` is safe without locks. JavaScript runs it synchronously between awaits, so two workers never take the same index.",
      "Keep a `failed` flag. The worker whose call rejects sets it, and every worker checks it before taking another item.",
    ],
    solution: [
      "## Approach",
      "",
      "A small pool: `min(size, n)` async workers share one `next` index. Each worker takes an index, awaits the call, writes the result into that slot, and loops until the list runs out or a call has failed. `Promise.all` over the workers resolves once they all drain, and rejects with the first failure.",
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
 * Map every item through fn with at most \`size\` calls in flight; results
 * in input order.
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
      solutionCode: `async function mapAsyncLimit(items, fn, size = Infinity) {
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
      entry: "__judgeMapAsyncLimit",
      driverCode: `${virtualClock}

async function __judgeMapAsyncLimit(items, size, asIterable) {
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
          name: "Size 2 is a sliding window, not fixed chunks",
          input: [[{ id: 0, ms: 30, value: "a" }, { id: 1, ms: 10, value: "b" }, { id: 2, ms: 20, value: "c" }, { id: 3, ms: 5, value: "d" }], 2, false],
          expected: { result: ["a", "b", "c", "d"], at: 35, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "end 1 @10", "start 2 @10", "end 0 @30", "start 3 @30", "end 2 @30", "end 3 @35"] },
        },
        {
          name: "Size 1 runs one call at a time",
          input: [[{ id: 0, ms: 5, value: 1 }, { id: 1, ms: 5, value: 2 }], 1, false],
          expected: { result: [1, 2], at: 10, maxInFlight: 1, log: ["start 0 @0", "end 0 @5", "start 1 @5", "end 1 @10"] },
        },
        {
          name: "No size means no limit",
          input: [[{ id: 0, ms: 5, value: 1 }, { id: 1, ms: 5, value: 2 }, { id: 2, ms: 5, value: 3 }], "default", false],
          expected: { result: [1, 2, 3], at: 5, maxInFlight: 3, log: ["start 0 @0", "start 1 @0", "start 2 @0", "end 0 @5", "end 1 @5", "end 2 @5"] },
        },
        {
          name: "A rejection fails the map and starts nothing new",
          input: [[{ id: 0, ms: 10, value: 1 }, { id: 1, ms: 5, fail: "x" }, { id: 2, ms: 1, value: 3 }, { id: 3, ms: 1, value: 4 }], 2, false],
          expected: { error: "x", at: 5, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "fail 1 @5", "end 0 @10"] },
        },
        {
          name: "An empty list resolves to []",
          input: [[], 2, false],
          expected: { result: [], at: 0, maxInFlight: 0, log: [] },
        },
        {
          name: "Any iterable works",
          input: [[{ id: 0, ms: 5, value: "x" }, { id: 1, ms: 5, value: "y" }, { id: 2, ms: 5, value: "z" }], 2, true],
          expected: { result: ["x", "y", "z"], at: 10, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "end 0 @5", "start 2 @5", "end 1 @5", "end 2 @10"] },
        },
        {
          name: "A size larger than the list",
          input: [[{ id: 0, ms: 3, value: 1 }, { id: 1, ms: 1, value: 2 }], 10, false],
          expected: { result: [1, 2], at: 3, maxInFlight: 2, log: ["start 0 @0", "start 1 @0", "end 1 @1", "end 0 @3"] },
        },
      ],
    },
  },
];
