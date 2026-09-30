import type { Problem } from "./types";

// Airbnb bank, part G: problems split out of multi-part prompts — the
// abortable promise (from implement-promise) and throttle (from the debounce
// problem). Judged in JavaScript and TypeScript; the typed judges live in
// seed-typescript-splits-b.ts.

const THROTTLE_DRIVER = `function __runThrottleScenario(wait, script) {
  var timers = new Map();
  var base = 1000000;
  var now = base;
  var nextId = 1;
  globalThis.setTimeout = function (fn, delay) {
    var rest = Array.prototype.slice.call(arguments, 2);
    var id = nextId++;
    timers.set(id, { due: now + Math.max(0, Number(delay) || 0), fn: fn, rest: rest });
    return id;
  };
  globalThis.clearTimeout = function (id) {
    timers.delete(id);
  };
  Date.now = function () {
    return now;
  };

  var fires = [];
  var record = function () {
    fires.push({ at: now - base, args: Array.prototype.slice.call(arguments) });
  };
  var wrapped = throttle(record, wait);

  function advanceTo(t) {
    for (;;) {
      var bestId = null;
      var bestDue = Infinity;
      timers.forEach(function (timer, id) {
        if (timer.due <= t && timer.due < bestDue) {
          bestDue = timer.due;
          bestId = id;
        }
      });
      if (bestId === null) break;
      var next = timers.get(bestId);
      timers.delete(bestId);
      now = next.due;
      next.fn.apply(null, next.rest);
    }
    now = t;
  }

  for (var i = 0; i < script.length; i++) {
    var step = script[i];
    advanceTo(base + step[0]);
    if (step[1] === "call") wrapped.apply(null, step.slice(2));
  }
  advanceTo(base + 1000000);
  return fires;
}`;

// Timers are virtual (fired in due order); promise callbacks are native, so a
// real macrotask is awaited before each timer to let them run.
const ABORT_DRIVER = `const __realSetTimeout = globalThis.setTimeout.bind(globalThis);
async function __runAbortScenario(kind) {
  const saved = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  const timers = [];
  let seq = 0;
  globalThis.setTimeout = (fn, delay, ...rest) => {
    const id = ++seq;
    timers.push({ id, due: Number(delay) || 0, fn, rest });
    return id;
  };
  globalThis.clearTimeout = (id) => {
    const at = timers.findIndex((t) => t.id === id);
    if (at >= 0) timers.splice(at, 1);
  };
  const order = [];
  const push = (v) => order.push(String(v));
  const report = (p) => p.then((v) => push("value:" + v), (e) => push("rejected:" + (e && e.name ? e.name : e)));
  const scenarios = {
    "abort-pending": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        const id = setTimeout(() => resolve("late"), 1000);
        onAbort(() => { push("cleanup"); clearTimeout(id); });
      });
      report(p);
      p.abort();
    },
    "no-abort": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        const id = setTimeout(() => resolve("done"), 1000);
        onAbort(() => { push("cleanup"); clearTimeout(id); });
      });
      report(p);
    },
    "abort-error-shape": () => {
      const p = new AbortablePromise(() => {});
      p.catch((e) => push(String(e instanceof Error) + ":" + e.name));
      p.abort();
    },
    "abort-with-reason": () => {
      const p = new AbortablePromise(() => {});
      p.catch((r) => push("reason:" + r));
      p.abort("user left");
    },
    "abort-after-resolve": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        onAbort(() => push("cleanup"));
        resolve("done");
      });
      report(p);
      p.abort();
    },
    "abort-after-reject": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        onAbort(() => push("cleanup"));
        reject(new Error("failed"));
      });
      p.catch((e) => push("rejected:" + e.message));
      p.abort();
    },
    "abort-after-settling-later": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        const id = setTimeout(() => resolve("done"), 10);
        onAbort(() => { push("cleanup"); clearTimeout(id); });
      });
      report(p);
      setTimeout(() => p.abort(), 20);
    },
    "double-abort": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        onAbort(() => push("cleanup"));
      });
      report(p);
      p.abort();
      p.abort("again");
    },
    "abort-without-cleanup": () => {
      const p = new AbortablePromise((resolve) => {
        setTimeout(() => resolve("late"), 1000);
      });
      report(p);
      p.abort();
    },
    "executor-throws": () => {
      new AbortablePromise(() => {
        throw new Error("boom");
      }).catch((e) => push("rejected:" + e.message));
    },
    "chaining": () => {
      new AbortablePromise((resolve) => {
        setTimeout(() => resolve(1), 10);
      })
        .then((v) => v + 1)
        .then((v) => push("value:" + v));
    },
    "is-a-promise": () => {
      const p = new AbortablePromise((resolve) => resolve(1));
      push(p instanceof Promise);
      Promise.all([p]).then((values) => push("all:" + values[0]));
    },
  };
  try {
    scenarios[kind]();
    for (let round = 0; round < 50; round++) {
      await new Promise((resolve) => __realSetTimeout(resolve, 0));
      if (timers.length === 0) break;
      timers.sort((a, b) => a.due - b.due || a.id - b.id);
      const t = timers.shift();
      t.fn(...t.rest);
    }
  } finally {
    globalThis.setTimeout = saved.setTimeout;
    globalThis.clearTimeout = saved.clearTimeout;
  }
  return order;
}`;

export const airbnbProblemsG: Problem[] = [
  {
    slug: "abortable-promise",
    title: "Abortable Promise",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Promises can't be cancelled, so cancel the work — and reject once, with an AbortError, only while pending.",
    prompt: `Native promises can't be cancelled. Build \`AbortablePromise\`, a \`Promise\` subclass whose work can be stopped from outside.

\`\`\`
const p = new AbortablePromise((resolve, reject, onAbort) => {
  const id = setTimeout(() => resolve("done"), 1000);
  onAbort(() => clearTimeout(id));   // how to stop the work
});
p.abort();                           // runs the cleanup, rejects p with an AbortError
\`\`\`

## Rules

- The executor receives a third argument, \`onAbort(cleanup)\`, which registers the function that stops the work.
- \`p.abort(reason?)\` on a **pending** promise runs the cleanup, if one was registered, and rejects \`p\` with \`reason\` — by default an \`Error\` whose \`name\` is \`"AbortError"\`.
- Once \`p\` has settled — resolved, rejected, or already aborted — \`abort()\` does nothing: no cleanup, no change of outcome.
- Everything else behaves like a native promise: a throwing executor rejects, \`then\` and \`catch\` chain, and \`p instanceof Promise\` holds.

The grader stubs \`setTimeout\` and \`clearTimeout\` with a virtual clock and records what your callbacks see, in order.`,
    hints: [
      "Native promises don't expose their state, so track it yourself: wrap the resolve and reject you pass to the executor so they set a `settled` flag, and have abort() return early when it is set.",
      "Capture the real reject and the registered cleanup in closures inside the function you hand to super(); after super() returns, store an abort function on the instance. `this` isn't available before super().",
      "Wrap the executor call in try/catch and reject through the same guarded path, so a throwing executor also marks the promise settled.",
    ],
    solution: `## Approach

A promise can't be cancelled; the *work* can. So the executor registers how to stop its work, and \`abort()\` runs that and rejects — but only while the promise is still pending. Native promises don't expose their state, so the subclass keeps a \`settled\` flag of its own: the \`resolve\` and \`reject\` handed to the executor are wrapped to set it, a throwing executor goes through the same guarded \`reject\`, and \`abort()\` returns early once it is set. That one flag gives all three rules — no cleanup after settling, no second abort, and a late \`resolve\` ignored after an abort.

\`this\` isn't usable before \`super()\` returns, so the closures live inside the function passed to \`super()\`, and the constructor stores the abort function on a private field afterwards.

## Complexity

O(1) per call.

## Worth saying out loud

- \`Symbol.species\`: \`then\` on a subclass constructs another instance of the subclass. Returning plain \`Promise\` from \`static get [Symbol.species]\` makes derived promises ordinary — aborting one of them couldn't stop this promise's work anyway.
- The platform answer is \`AbortController\`: pass \`controller.signal\` to \`fetch\` and call \`controller.abort()\`; \`fetch\` rejects with a \`DOMException\` named \`AbortError\`. In React the effect cleanup calls \`controller.abort()\`.
- If the cleanup throws, the promise should still reject — run the cleanup in a \`try\` and reject in the \`finally\`.
- The promise itself is from [Implement a Promise](/problems/implement-promise); this is the same idea on top of a native one.`,
    judge: {
      solutionCode: `// Promises can't be cancelled, so cancel the work: the executor registers a
// cleanup, and abort() runs it and rejects — only while still pending.
const abortError = () => Object.assign(new Error("Aborted"), { name: "AbortError" });

class AbortablePromise extends Promise {
  #abort;

  constructor(executor) {
    let abort = () => {};
    super((resolve, reject) => {
      let settled = false;           // native promises hide their state, so track it
      let cleanup = null;
      const once = (fn) => (value) => {
        if (settled) return;
        settled = true;
        fn(value);
      };
      abort = (reason) => {
        if (settled) return;         // settled or already aborted: nothing to do
        settled = true;
        try {
          if (cleanup) cleanup();    // stop the work: clearTimeout, controller.abort(), ...
        } finally {
          reject(reason);
        }
      };
      const guardedReject = once(reject);
      try {
        executor(once(resolve), guardedReject, (fn) => { cleanup = fn; });
      } catch (err) {
        guardedReject(err);
      }
    });
    this.#abort = abort;
  }

  abort(reason = abortError()) {
    this.#abort(reason);
  }

  // Derived promises (then/catch/finally) are plain promises.
  static get [Symbol.species]() {
    return Promise;
  }
}
`,
      starterCode: `class AbortablePromise extends Promise {
  /** executor(resolve, reject, onAbort): onAbort(cleanup) registers how to stop the work. */
  constructor(executor) {
    super((resolve, reject) => executor(resolve, reject, () => {}));
  }

  /** Pending: run the cleanup, then reject with reason (default: an Error named "AbortError"). Settled: do nothing. */
  abort(reason) {}
}
`,
      entry: "__runAbortScenario",
      driverCode: ABORT_DRIVER,
      tests: [
        { name: "abort() runs the cleanup and rejects with AbortError", input: ["abort-pending"], expected: ["cleanup", "rejected:AbortError"] },
        { name: "Without abort() it resolves normally", input: ["no-abort"], expected: ["value:done"] },
        { name: "The default reason is an Error named AbortError", input: ["abort-error-shape"], expected: ["true:AbortError"] },
        { name: "abort(reason) rejects with that reason", input: ["abort-with-reason"], expected: ["reason:user left"] },
        { name: "abort() after resolving does nothing", input: ["abort-after-resolve"], expected: ["value:done"] },
        { name: "abort() after rejecting does nothing", input: ["abort-after-reject"], expected: ["rejected:failed"] },
        { name: "abort() after a later resolve does nothing", input: ["abort-after-settling-later"], expected: ["value:done"] },
        { name: "A second abort() is ignored", input: ["double-abort"], expected: ["cleanup", "rejected:AbortError"] },
        { name: "Aborting with no cleanup still rejects", input: ["abort-without-cleanup"], expected: ["rejected:AbortError"] },
        { name: "A throwing executor rejects", input: ["executor-throws"], expected: ["rejected:boom"] },
        { name: "then chains as usual", input: ["chaining"], expected: ["value:2"] },
        { name: "It is a real Promise", input: ["is-a-promise"], expected: ["true", "all:1"] },
      ],
    },
  },
  {
    slug: "implement-throttle",
    title: "Implement Throttle",
    category: "frontend",
    difficulty: "medium",
    // Apple: debounce and throttle top the utility list in the Apple
    // JavaScript guide.
    companies: ["airbnb", "apple"],
    summary:
      "A leading call, then at most one call per window — with a trailing call that carries the latest arguments.",
    prompt: `Write \`throttle(fn, wait)\`: the returned function calls \`fn\` at most once per \`wait\` ms.

\`\`\`
const onScroll = throttle(update, 100);
// calls at 0, 30 and 60 ms  ->  update runs at 0 (with the first call's arguments)
//                               and at 100 (with the call at 60's arguments)
\`\`\`

## Rules

- The first call fires **immediately**.
- Calls inside the window collapse into **one** trailing fire at the window's end, with the **latest** arguments; that fire starts the next window.
- A call after a quiet window fires immediately again.
- Return a real \`function\`, not an arrow, so a caller's \`this\` is forwarded.

The grader replays timed call scripts on a virtual clock — \`setTimeout\`, \`clearTimeout\`, and \`Date.now\` are stubbed — so build on those, not on \`performance.now\` or promises. Each case's input is the wait and a script of \`[ms, "call", ...args]\` steps; the expected output lists every fire as \`{at, args}\`.`,
    hints: [
      "Track the time of the last fire. If `wait` ms have passed since then, fire now; otherwise arm a single trailing timer for the rest of the window.",
      "Overwrite the saved arguments (and `this`) on every call so the trailing fire uses the newest ones, and record the fire time when the trailing call actually runs.",
    ],
    solution: `## Approach

A closure over three pieces of state: when \`fn\` last fired, the pending trailing timer, and the latest call's \`args\` and \`this\`. A call at least \`wait\` ms after the last fire runs immediately and starts a window. A call inside the window only saves its arguments and, if no timer is pending, arms one for the rest of the window; when that timer fires it runs \`fn\` with the newest saved arguments and starts the next window.

## Complexity

O(1) per call; O(1) state.

## Worth saying out loud

- Where you'd use it: **throttle guarantees a rate** — scroll position, drag, pointer tracking, analytics. Debounce waits for silence instead (see [Debounce with Cancel and Flush](/problems/debounce-cancel-flush)).
- Leading and trailing are options in lodash (\`{ leading, trailing }\`); this version does both. Dropping the trailing call loses the last update, which is usually the one the user cares about.
- Why \`function\`, not an arrow: it forwards the caller's \`this\`.
- For visual updates, a \`requestAnimationFrame\` throttle coalesces to one call per frame instead of a time window.
- \`cancel()\` is the natural addition: clear the timer and reset the last-fire time, so the next call fires immediately.`,
    judge: {
      solutionCode: `// Throttle: run at most once per \`wait\` ms (leading call + trailing call with latest args).
function throttle(fn, wait) {
  let last = 0;
  let timer = null;
  let lastArgs;
  let lastThis;
  return function throttled(...args) {      // function, not arrow: keep caller's \`this\`
    const now = Date.now();
    lastArgs = args;
    lastThis = this;
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      last = now;
      fn.apply(this, args);
    } else if (timer === null) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(lastThis, lastArgs);
      }, remaining);
    }
  };
}
`,
      starterCode: `/** Leading call, then at most one call per wait ms, with a trailing call carrying the latest args. */
function throttle(fn, wait) {
  return function throttled(...args) {
    fn.apply(this, args);
  };
}
`,
      entry: "__runThrottleScenario",
      // Virtual clock: setTimeout/clearTimeout/Date.now are replaced by a
      // scheduler the driver advances, so scenarios are deterministic and
      // instant. The clock starts well above zero, as a real one would.
      driverCode: THROTTLE_DRIVER,
      tests: [
        { name: "The first call fires immediately", input: [100, [[0, "call", 1]]], expected: [{ at: 0, args: [1] }] },
        { name: "Calls inside the window collapse to one trailing fire", input: [100, [[0, "call", 1], [30, "call", 2], [60, "call", 3]]], expected: [{ at: 0, args: [1] }, { at: 100, args: [3] }] },
        { name: "A call after a quiet window fires immediately", input: [100, [[0, "call", 1], [150, "call", 2]]], expected: [{ at: 0, args: [1] }, { at: 150, args: [2] }] },
        { name: "A call exactly one window later fires immediately", input: [100, [[0, "call", 1], [100, "call", 2]]], expected: [{ at: 0, args: [1] }, { at: 100, args: [2] }] },
        { name: "Trailing fire, then a new window", input: [100, [[0, "call", 1], [50, "call", 2], [120, "call", 3]]], expected: [{ at: 0, args: [1] }, { at: 100, args: [2] }, { at: 200, args: [3] }] },
        {
          name: "Steady calls fire once per window",
          input: [100, [[0, "call", 0], [25, "call", 25], [50, "call", 50], [75, "call", 75], [100, "call", 100], [125, "call", 125], [150, "call", 150], [175, "call", 175], [200, "call", 200], [225, "call", 225], [250, "call", 250]]],
          expected: [{ at: 0, args: [0] }, { at: 100, args: [75] }, { at: 200, args: [175] }, { at: 300, args: [250] }],
        },
        { name: "Throttle forwards every argument", input: [50, [[0, "call", "a", "b"]]], expected: [{ at: 0, args: ["a", "b"] }] },
      ],
    },
  },
];
