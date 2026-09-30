import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// Apple front-end bank, part J: promise helpers from scratch (promiseAll and
// withTimeout) and two closure utilities (curry and once). TypeScript
// variants live in seed-typescript-splits.ts.

export const appleJsProblemsJ: Problem[] = [
  {
    slug: "implement-promise-all",
    title: "Implement Promise.all",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Store results by index, count down, resolve an empty input at once, reject on the first failure.",
    prompt: [
      "Implement `promiseAll(iterable)`, which behaves like `Promise.all` without calling it. `Promise.all`, `allSettled`, `race` and `any` are switched off while it runs.",
      "",
      "- Resolve with the results in **input order**, whatever order the promises settle in.",
      "- Accept plain values beside promises, and any iterable, not only arrays.",
      "- Resolve an empty input at once, with `[]`.",
      "- Reject with the first rejection.",
      "",
      "Everything runs on a virtual clock, so the grader sees exactly when the result settles.",
    ].join("\n"),
    hints: [
      "Store each result by index and count down. Pushing results in completion order is the classic bug.",
      "The empty input must resolve immediately, because nothing will ever count down. Wrap each item in `Promise.resolve(item)` so plain values sit beside promises.",
    ],
    solution: [
      "## Approach",
      "",
      "Spread the iterable into an array, allocate the results by length, and count down as each item fulfills, writing each value at its own index. The first rejection rejects the outer promise; later settlements are ignored, because a promise settles only once.",
      "",
      "## Worth saying out loud",
      "",
      "- **Settled is final.** A second `resolve` or `reject` is ignored, which is why `promiseAll` needs no \"already failed\" flag.",
      "- `Promise.resolve(item)` lets plain values sit beside promises, and adopts other thenables.",
      "- The siblings are small changes: `allSettled` never rejects and records `{status, value | reason}`; `any` resolves on the first fulfillment and rejects with an `AggregateError` when all fail; `race` settles with whichever settles first.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Promise.all, without calling it. */
function promiseAll(iterable) {
  // Your code here
  return Promise.resolve([]);
}
`,
      solutionCode: `function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];
    const results = new Array(items.length);
    let pending = items.length;
    if (pending === 0) {
      resolve(results); // nothing will ever count down
      return;
    }
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value; // by index, never in completion order
        pending -= 1;
        if (pending === 0) resolve(results);
      }, reject);
    });
  });
}
`,
      entry: "__judgePromiseAll",
      driverCode: `${virtualClock}

async function __judgePromiseAll(specs, asIterable) {
  var clock = __virtualClock();
  function settleAfter(spec) {
    if ("plain" in spec) return spec.plain;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if ("fail" in spec) reject(new Error(spec.fail));
        else resolve(spec.value);
      }, spec.ms);
    });
  }
  var combinators = ["all", "allSettled", "race", "any"];
  function withoutCombinators(run) {
    var saved = {};
    combinators.forEach(function (name) {
      saved[name] = Promise[name];
      Promise[name] = function () {
        throw new Error("Write it yourself: Promise." + name + " is off limits here");
      };
    });
    try {
      return run();
    } finally {
      combinators.forEach(function (name) {
        Promise[name] = saved[name];
      });
    }
  }
  try {
    return await clock.run(function () {
      return withoutCombinators(function () {
        var values = specs.map(settleAfter);
        if (!asIterable) return promiseAll(values);
        return promiseAll((function* () {
          for (var i = 0; i < values.length; i++) yield values[i];
        })());
      });
    });
  } finally {
    clock.restore();
  }
}`,
      tests: [
        { name: "promiseAll keeps input order", input: [[{ ms: 30, value: 1 }, { ms: 10, value: 2 }, { plain: 3 }], false], expected: { value: [1, 2, 3], at: 30 } },
        { name: "promiseAll resolves [] at once", input: [[], false], expected: { value: [], at: 0 } },
        { name: "promiseAll rejects with the first rejection", input: [[{ ms: 30, value: 1 }, { ms: 10, fail: "x" }, { ms: 20, fail: "y" }], false], expected: { error: "x", at: 10, errorType: "Error" } },
        { name: "promiseAll takes any iterable", input: [[{ ms: 5, value: "a" }, { plain: "b" }], true], expected: { value: ["a", "b"], at: 5 } },
        { name: "Plain values only", input: [[{ plain: 1 }, { plain: 2 }], false], expected: { value: [1, 2], at: 0 } },
      ],
    },
  },
  {
    slug: "promise-with-timeout",
    title: "Promise With a Timeout",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Race the promise against a timer — and clear the timer when the promise wins.",
    prompt: [
      "Implement `withTimeout(promise, ms)`. It settles like `promise` if that happens within `ms`. Otherwise it rejects with `new Error(\"Timed out after <ms> ms\")`.",
      "",
      "When `promise` settles first, clear the timer: the grader counts timers left running.",
      "",
      "Everything runs on a virtual clock, so the grader sees exactly when each promise settles.",
    ].join("\n"),
    hints: [
      "Race the promise against a promise that rejects when a timer fires.",
      "Keep the timer id and clear it in `finally`, so a fast result leaves nothing running.",
    ],
    solution: [
      "## Approach",
      "",
      "Race the input against a promise that rejects when the timer fires, and clear the timer in `finally` so a fast result leaves nothing running. A rejection of the input passes straight through the race.",
      "",
      "## Worth saying out loud",
      "",
      "- `withTimeout` stops waiting, but it does not stop the work. Real cancellation passes an `AbortSignal` down, as `fetch` accepts one — `AbortSignal.timeout(ms)` is the built-in version.",
      "- Forgetting to clear the timer keeps a Node process alive and leaks one timer per call.",
      "- Other answers to \"something more advanced\": retry with exponential backoff (see [Retry Wrapper](/problems/retry-wrapper)), a promise pool with a concurrency limit, and `promiseAny` with an `AggregateError`.",
    ].join("\n"),
    judge: {
      starterCode: `/** Settle like promise within ms, else reject with new Error("Timed out after <ms> ms"). */
function withTimeout(promise, ms) {
  // Your code here
  return promise;
}
`,
      solutionCode: `function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out after " + ms + " ms")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
`,
      entry: "__judgeTimeout",
      driverCode: `${virtualClock}

async function __judgeTimeout(spec, ms) {
  var clock = __virtualClock();
  function settleAfter(spec) {
    if ("plain" in spec) return spec.plain;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if ("fail" in spec) reject(new Error(spec.fail));
        else resolve(spec.value);
      }, spec.ms);
    });
  }
  try {
    var out = await clock.run(function () { return withTimeout(settleAfter(spec), ms); });
    out.pendingTimers = clock.pending();
    return out;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        { name: "withTimeout passes a fast value through", input: [{ ms: 50, value: "ok" }, 100], expected: { value: "ok", at: 50, pendingTimers: 0 } },
        { name: "withTimeout rejects a slow promise", input: [{ ms: 200, value: "late" }, 100], expected: { error: "Timed out after 100 ms", at: 100, errorType: "Error", pendingTimers: 1 } },
        { name: "A promise that never settles still times out", input: [{ ms: 100000, value: "never" }, 50], expected: { error: "Timed out after 50 ms", at: 50, errorType: "Error", pendingTimers: 1 } },
        { name: "withTimeout passes a rejection through", input: [{ ms: 20, fail: "boom" }, 100], expected: { error: "boom", at: 20, errorType: "Error", pendingTimers: 0 } },
      ],
    },
  },
  {
    slug: "implement-curry",
    title: "Implement curry",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Collect arguments until `fn.length` have arrived — with a fresh array per call so partials stay independent.",
    prompt: [
      "Write `curry(fn)`: collect arguments across calls until at least `fn.length` of them have arrived, then call `fn` with all of them.",
      "",
      "- Any call may pass several arguments, and extra ones are passed through.",
      "- Partial applications are reusable: `const add1 = add(1)` can be called many times without the calls affecting each other.",
      "- A function with no parameters is called on the first call, and `this` is forwarded.",
      "",
      "```js",
      "const add3 = curry((a, b, c) => a + b + c);",
      "add3(1)(2)(3);  add3(1, 2)(3);  add3(1)(2, 3);  add3(1, 2, 3);   // all 6",
      "```",
    ].join("\n"),
    hints: [
      "`curry` returns a function that compares the arguments collected so far against `fn.length`. With enough, call `fn`.",
      "With too few, return a new function that closes over the arguments so far. Build a new array on every call — never mutate a shared one, or partials start affecting each other.",
    ],
    solution: [
      "## Approach",
      "",
      "A closure over the arguments seen so far. `curried(...args)` calls `fn.apply(this, args)` once there are at least `fn.length` arguments; otherwise it returns a function that calls `curried` again with the old arguments followed by the new ones, in a fresh array, so every partial application stays independent.",
      "",
      "## Worth saying out loud",
      "",
      "- `curry` depends on `fn.length`, which doesn't count rest parameters or parameters with defaults. `curry((a, b = 1) => a + b)` fires after one argument.",
      "- Mutating one shared `args` array is the classic bug: `const add1 = add(1)` then breaks the second time it is used.",
      "- Return a `function`, not an arrow, so `this` reaches `fn`.",
    ].join("\n"),
    judge: {
      starterCode: `/** Collect arguments until fn.length have arrived, then call fn. */
function curry(fn) {
  // Your code here
  return fn;
}
`,
      solutionCode: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function (...more) {
      return curried.apply(this, [...args, ...more]); // a new array: partials stay independent
    };
  };
}
`,
      entry: "__judgeCurry",
      driverCode: `function __judgeCurry(kind) {
  if (kind === "curryShapes") {
    var add3 = curry(function (a, b, c) { return a + b + c; });
    return [add3(1)(2)(3), add3(1, 2)(3), add3(1)(2, 3), add3(1, 2, 3)];
  }
  if (kind === "curryPartials") {
    var sum3 = curry(function (a, b, c) { return a + b + c; });
    var plus1 = sum3(1);
    var plus3 = plus1(2);
    return [plus3(3), plus1(10)(20), plus3(100)];
  }
  if (kind === "curryZeroArity") return curry(function () { return 42; })();
  if (kind === "curryExtraArgs") {
    var count = curry(function (a, b) { return arguments.length; });
    return count(1)(2, 3, 4);
  }
  if (kind === "curryThis") {
    var obj = { base: 100, add: curry(function (a, b) { return this.base + a + b; }) };
    return obj.add(1, 2);
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "curry takes arguments in any grouping", input: ["curryShapes"], expected: [6, 6, 6, 6] },
        { name: "Partials are reusable", input: ["curryPartials"], expected: [6, 31, 103] },
        { name: "A zero-parameter function runs at once", input: ["curryZeroArity"], expected: 42 },
        { name: "Extra arguments are passed through", input: ["curryExtraArgs"], expected: 4 },
        { name: "curry forwards this", input: ["curryThis"], expected: 103 },
      ],
    },
  },
  {
    slug: "implement-once",
    title: "Implement once",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "A `called` flag, not a check on the result — and the first call's `this` and arguments.",
    prompt: [
      "Write `once(fn)`: call `fn` on the first call only, with that call's arguments and `this`. Every later call returns the first result without calling `fn` again, even when that result was `undefined`.",
      "",
      "```js",
      "const init = once(() => setup());",
      "init(); init(); init();   // setup runs once; every call returns its result",
      "```",
    ].join("\n"),
    hints: [
      "`once` needs a flag, not a check on the result: `if (!called)`, never `if (result === undefined)`.",
      "Return a `function`, not an arrow, and call `fn.apply(this, args)` so the first call's `this` reaches `fn`.",
    ],
    solution: [
      "## Approach",
      "",
      "A closure over a `called` flag and the first result. The first call sets the flag, calls `fn.apply(this, args)` and stores the result; every call returns the stored result.",
      "",
      "## Worth saying out loud",
      "",
      "- Checking `result === undefined` instead of a flag re-runs `fn` whenever it returns nothing.",
      "- Drop the reference to `fn` after the first call if it closes over something large — the wrapper otherwise keeps it alive forever.",
      "- `once` is how lazy initialization, one-shot event handlers (`addEventListener(..., { once: true })`) and idempotent setup are built.",
    ].join("\n"),
    judge: {
      starterCode: `/** Call fn once; later calls return the first result. */
function once(fn) {
  // Your code here
  return fn;
}
`,
      solutionCode: `function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
`,
      entry: "__judgeOnce",
      driverCode: `function __judgeOnce(kind) {
  var calls = 0;
  if (kind === "onceCallsOnce") {
    var init = once(function () { calls++; return calls; });
    return { results: [init(), init(), init()], calls: calls };
  }
  if (kind === "onceFirstCall") {
    var greet = once(function (name) { return "hi " + name + " from " + this.who; });
    var ctx = { who: "a", greet: greet };
    var first = ctx.greet("ann");
    var second = greet.call({ who: "b" }, "bo");
    return [first, second];
  }
  if (kind === "onceIgnoresLaterArgs") {
    var doubled = once(function (x) { return x * 2; });
    return [doubled(2), doubled(5)];
  }
  if (kind === "onceIndependent") {
    var make = function () { calls++; return calls; };
    var a = once(make);
    var b = once(make);
    return [a(), b(), a(), b()];
  }
  if (kind === "onceUndefined") {
    var noop = once(function () { calls++; });
    noop();
    noop();
    return calls;
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "once calls fn a single time", input: ["onceCallsOnce"], expected: { results: [1, 1, 1], calls: 1 } },
        { name: "once uses the first call's arguments and this", input: ["onceFirstCall"], expected: ["hi ann from a", "hi ann from a"] },
        { name: "An undefined result still counts as called", input: ["onceUndefined"], expected: 1 },
        { name: "Later calls ignore their arguments", input: ["onceIgnoresLaterArgs"], expected: [4, 4] },
        { name: "Each wrapper runs its function once", input: ["onceIndependent"], expected: [1, 2, 1, 2] },
      ],
    },
  },
];
