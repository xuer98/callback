import type { Problem } from "./types";

// Airbnb frontend tech-screen bank, part A: the JavaScript class and utility
// prompts candidates report — StoreData, a Promise, debounce with controls,
// input validation. Sourced from candidate reports (LeetCode Discuss, Blind,
// Glassdoor, FrontendLead) and the curated company pages built from them.
// Judged in JavaScript only: the semantics under test (`this`, microtasks,
// timers) are the language's own.

export const airbnbProblemsA: Problem[] = [
  {
    slug: "store-data-change-listeners",
    title: "StoreData with Change Listeners",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "A Backbone.Model-style store: two Maps, one event-key normalizer, listeners that can't break each other.",
    prompt: `Implement \`StoreData\`, a Backbone.Model-style key/value store with change listeners — reported on a senior frontend phone screen.

\`\`\`
store.add(key, value)   // alias: set. Returns the store (chainable).
store.get(key)          // current value, or undefined
store.has(key)          // true while the key holds a value
store.remove(key)       // alias: unset. Soft-delete; true if something was removed
store.on(event, cb)     // register a listener; returns an unsubscribe function
store.once(event, cb)   // fires at most once
store.off(event, cb)    // remove one listener (all for the event when cb is omitted)
store.toJSON()          // plain object of the live keys
\`\`\`

## Events

- \`"change:name"\` and plain \`"name"\` mean the same thing: the key \`name\` changed.
- \`"change"\` is global — fires for every key that changes.
- \`"unset"\` fires when a key is removed.
- Every callback receives \`(oldValue, newValue, key)\`; a removal reports \`newValue\` as \`undefined\`.

## Rules

- A set that doesn't change the value (\`Object.is\`) fires nothing.
- Key listeners fire before global listeners.
- One throwing listener must not stop the others.
- Removal is a **soft delete**: \`has\` reports false and \`get\` returns \`undefined\`, but keep the tombstone.

## Worth asking out loud

Fire on a no-op set? Callback argument order? Should \`on\` return an unsubscribe? What if a key is literally named \`"change"\`?`,
    hints: [
      "Two Maps: attributes (key → {value, deleted}) and listeners (eventKey → Set of callbacks). Normalize every accepted event spelling to one internal key in a single place.",
      "Namespace attribute events (`attr:name`) so a key literally called \"change\" can't collide with the global event — that normalization bug is exactly what sank the original poster.",
      "When firing, iterate over a copy of the Set and wrap each call in try/catch: a listener may unsubscribe another mid-loop, and one that throws must not silence the rest.",
    ],
    solution: `## Approach

Two \`Map\`s — attributes (\`key → {value, deleted}\`) and listeners (\`eventKey → Set<cb>\`). Every event spelling is normalized once, in one static helper, and attribute events are namespaced (\`attr:name\`) so a key literally called \`"change"\` or \`"unset"\` can never collide with the global events. Writes compare with \`Object.is\` and fire nothing on a no-op; removal flips a tombstone and reports \`newValue\` as \`undefined\`. Dispatch iterates a copy of the listener set and isolates each call in try/catch.

\`\`\`js
// StoreData — a Backbone.Model-style key/value store with change listeners.
// Events accepted by on(): 'change:name' | 'name' (same thing), 'change' (any key), 'unset'.
// Listener signature: (oldValue, newValue, key)
class StoreData {
  #attrs = new Map();      // key -> { value, deleted }   (deleted = soft-delete tombstone)
  #listeners = new Map();  // eventKey -> Set<callback>

  // Normalize every accepted event spelling to one internal key.
  // Attribute events are namespaced ('attr:name') so a key literally called
  // "change" or "unset" can never collide with the global events.
  static #eventKey(event) {
    if (event === 'change' || event === 'unset') return event;
    const name = event.startsWith('change:') ? event.slice('change:'.length) : event;
    return \`attr:\${name}\`;
  }

  get(key) {
    const rec = this.#attrs.get(key);
    return rec && !rec.deleted ? rec.value : undefined;
  }

  has(key) {
    const rec = this.#attrs.get(key);
    return Boolean(rec) && !rec.deleted;
  }

  // add === set. Fires change events only when the value actually changes.
  add(key, value) {
    const rec = this.#attrs.get(key);
    const existed = Boolean(rec) && !rec.deleted;
    const oldValue = existed ? rec.value : undefined;
    if (existed && Object.is(oldValue, value)) return this; // no-op, no events
    this.#attrs.set(key, { value, deleted: false });
    this.#emitChange(key, oldValue, value);
    return this;
  }
  set(key, value) { return this.add(key, value); }

  // remove === unset. Soft delete: keep a tombstone so the old value is still
  // available to listeners / audit, and \`has\` reports false.
  remove(key) {
    const rec = this.#attrs.get(key);
    if (!rec || rec.deleted) return false;
    rec.deleted = true;
    this.#emitChange(key, rec.value, undefined);
    this.#fire('unset', rec.value, undefined, key);
    return true;
  }
  unset(key) { return this.remove(key); }

  on(event, callback) {
    const k = StoreData.#eventKey(event);
    if (!this.#listeners.has(k)) this.#listeners.set(k, new Set());
    this.#listeners.get(k).add(callback);
    return () => this.off(event, callback); // unsubscribe handle
  }

  once(event, callback) {
    const off = this.on(event, (...args) => { off(); callback(...args); });
    return off;
  }

  off(event, callback) {
    const set = this.#listeners.get(StoreData.#eventKey(event));
    if (!set) return;
    if (callback) set.delete(callback); else set.clear();
  }

  toJSON() {
    const out = {};
    for (const [k, rec] of this.#attrs) if (!rec.deleted) out[k] = rec.value;
    return out;
  }

  #emitChange(key, oldValue, newValue) {
    this.#fire(\`attr:\${key}\`, oldValue, newValue, key); // change:key listeners
    this.#fire('change', oldValue, newValue, key);      // global listeners
  }

  #fire(k, oldValue, newValue, key) {
    const set = this.#listeners.get(k);
    if (!set) return;
    for (const cb of [...set]) {          // copy: a listener may unsubscribe mid-loop
      try { cb(oldValue, newValue, key); }
      catch (err) { console.error(err); } // one bad listener must not break the others
    }
  }
}
\`\`\`

## Complexity

Every operation is O(1) apart from dispatch, which is O(listeners on that event). Tombstones cost O(removed keys) until compacted.

## Worth saying out loud

- Why \`Object.is\` and not \`===\`: \`NaN\` equals itself and \`+0\`/\`-0\` differ — the same bail-out rule React's \`useState\` uses.
- \`on\` returning an unsubscribe is the leak fix: components call it on unmount (\`useEffect\` cleanup).
- Batch follow-up: \`set({a: 1, b: 2})\` loops \`Object.entries\` → \`add\`; a \`silent\` flag plus \`changedAttributes()\` emits one \`'change'\` at the end.
- \`previous(key)\` is one more field on the record; a wildcard \`'change:*'\` is a \`startsWith\` check in \`#fire\`.
- Name the pattern: observer / pub-sub — Backbone models, Redux \`subscribe\`, \`EventTarget\`, \`useSyncExternalStore\`.`,
    judge: {
      starterCode: `class StoreData {
  constructor() {
    // Your state here
  }

  /** @returns the current value, or undefined */
  get(key) {
    return undefined;
  }

  has(key) {
    return false;
  }

  /** Alias of set. Fires change events only when the value actually changes; returns this. */
  add(key, value) {
    return this;
  }

  set(key, value) {
    return this.add(key, value);
  }

  /** Alias of unset. Soft delete; true if something was removed. */
  remove(key) {
    return false;
  }

  unset(key) {
    return this.remove(key);
  }

  /** @returns {() => void} an unsubscribe function */
  on(event, callback) {
    return () => {};
  }

  once(event, callback) {
    return () => {};
  }

  off(event, callback) {}

  toJSON() {
    return {};
  }
}
`,
      entry: "__runOperations",
      // Listeners are registered by the driver under a name; every fire is
      // appended to a log as "name key old->new", which "log" returns.
      driverCode: `function __runOperations(operations, args) {
  const show = (v) => (v === undefined ? "undefined" : String(v));
  let store = null;
  const log = [];
  const subs = new Map();
  const listener = (name) => (oldValue, newValue, key) => {
    log.push(name + " " + key + " " + show(oldValue) + "->" + show(newValue));
  };
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const a = args[i];
    if (op === "StoreData") {
      store = new StoreData();
      out.push(null);
    } else if (op === "on" || op === "once") {
      subs.set(a[1], store[op](a[0], listener(a[1])));
      out.push(null);
    } else if (op === "off") {
      const off = subs.get(a[0]);
      if (typeof off === "function") off();
      out.push(null);
    } else if (op === "throwing") {
      store.on(a[0], () => { throw new Error(a[1] + " threw"); });
      out.push(null);
    } else if (op === "log") {
      out.push(log.slice());
    } else if (op === "get") {
      const value = store.get(a[0]);
      out.push(value === undefined ? null : value);
    } else if (op === "add" || op === "set") {
      store[op](a[0], a[1]);
      out.push(null);
    } else {
      out.push(store[op](...a) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "A change listener sees old and new",
          input: [["StoreData", "on", "add", "add", "log"], [[], ["change:name", "L"], ["name", "Ann"], ["name", "Bob"], []]],
          expected: [null, null, null, null, ["L name undefined->Ann", "L name Ann->Bob"]],
        },
        {
          name: "A no-op set fires nothing",
          input: [["StoreData", "on", "add", "add", "log"], [[], ["change:name", "L"], ["name", "Ann"], ["name", "Ann"], []]],
          expected: [null, null, null, null, ["L name undefined->Ann"]],
        },
        {
          name: "get, has, remove",
          input: [
            ["StoreData", "add", "has", "get", "remove", "has", "get", "remove"],
            [[], ["name", "Ann"], ["name"], ["name"], ["name"], ["name"], ["name"], ["name"]],
          ],
          expected: [null, null, true, "Ann", true, false, null, false],
        },
        {
          name: "Both event spellings mean the key",
          input: [["StoreData", "on", "on", "add", "log"], [[], ["name", "A"], ["change:name", "B"], ["name", "X"], []]],
          expected: [null, null, null, null, ["A name undefined->X", "B name undefined->X"]],
        },
        {
          name: "The global listener sees every key",
          input: [["StoreData", "on", "add", "add", "remove", "log"], [[], ["change", "G"], ["a", 1], ["b", 2], ["a"], []]],
          expected: [null, null, null, null, true, ["G a undefined->1", "G b undefined->2", "G a 1->undefined"]],
        },
        {
          name: "Key listeners fire before global ones",
          input: [["StoreData", "on", "on", "add", "log"], [[], ["change", "G"], ["change:name", "K"], ["name", "Ann"], []]],
          expected: [null, null, null, null, ["K name undefined->Ann", "G name undefined->Ann"]],
        },
        {
          name: "A key named change is still just a key",
          input: [["StoreData", "on", "on", "add", "log"], [[], ["change", "G"], ["change:change", "C"], ["change", 5], []]],
          expected: [null, null, null, null, ["C change undefined->5", "G change undefined->5"]],
        },
        {
          name: "unset event and soft delete",
          input: [["StoreData", "on", "add", "remove", "get", "has", "log"], [[], ["unset", "U"], ["k", "v"], ["k"], ["k"], ["k"], []]],
          expected: [null, null, null, true, null, false, ["U k v->undefined"]],
        },
        {
          name: "on returns an unsubscribe",
          input: [["StoreData", "on", "off", "add", "log"], [[], ["change:name", "L"], ["L"], ["name", "Ann"], []]],
          expected: [null, null, null, null, []],
        },
        {
          name: "once fires a single time",
          input: [["StoreData", "once", "add", "add", "log"], [[], ["change:name", "O"], ["name", "A"], ["name", "B"], []]],
          expected: [null, null, null, null, ["O name undefined->A"]],
        },
        {
          name: "A throwing listener doesn't stop the others",
          input: [["StoreData", "throwing", "on", "add", "log"], [[], ["change:name", "T"], ["change:name", "L"], ["name", "A"], []]],
          expected: [null, null, null, null, ["L name undefined->A"]],
        },
        {
          name: "toJSON skips tombstones",
          input: [["StoreData", "add", "add", "remove", "toJSON"], [[], ["a", 1], ["b", 2], ["a"], []]],
          expected: [null, null, null, true, { b: 2 }],
        },
        {
          name: "Re-adding a removed key changes from undefined",
          input: [["StoreData", "on", "add", "remove", "add", "log"], [[], ["change:k", "L"], ["k", 1], ["k"], ["k", 2], []]],
          expected: [null, null, null, true, null, ["L k undefined->1", "L k 1->undefined", "L k undefined->2"]],
        },
      ],
    },
  },
  {
    slug: "implement-promise",
    title: "Implement a Promise",
    category: "frontend",
    difficulty: "hard",
    companies: ["airbnb"],
    summary:
      "A one-way state machine, a handler queue, and every callback in a microtask.",
    prompt: `Write a Promise from scratch — "write a simple promise" is a reported Airbnb phone-screen prompt. A Blind poster added chaining and was told it went beyond the ask, so build the core first and grow it in phases.

\`\`\`
new MyPromise((resolve, reject) => { ... })
p.then(onFulfilled, onRejected)   // returns a new MyPromise; chains
p.catch(onRejected)
p.finally(onFinally)
MyPromise.resolve(v) / MyPromise.reject(r) / MyPromise.all(iterable)
\`\`\`

## Rules the grader checks

- A promise settles **once**: later \`resolve\`/\`reject\` calls are ignored; an executor that throws rejects.
- Callbacks run **asynchronously** — schedule them with \`queueMicrotask\`, never synchronously and never with \`setTimeout\`. The grader stubs both to observe ordering: microtasks must run before timers.
- \`then\` returns a new promise whose fate is the callback's return value; a returned promise or thenable is **adopted**, not passed through; a throwing callback rejects.
- Missing handlers pass the value or reason through.
- \`all\` keeps input order and rejects on the first rejection.

## Bonus — abort()

\`AbortablePromise\` extends it: the executor receives a third argument \`onAbort(cleanup)\`; \`p.abort()\` runs the cleanup and rejects with an \`Error\` whose \`name\` is \`"AbortError"\` (a no-op once settled).

## Worth asking out loud

Spec-level (thenable adoption, microtask timing) or "works for the common case"? Is chaining in scope? What should \`abort()\` do about work already in flight?`,
    hints: [
      "State machine: pending → fulfilled | rejected, one way. Guard resolve/reject with a `called` flag so only the first call wins, and wrap the executor in try/catch.",
      "Keep a queue of {onFulfilled, onRejected, resolve, reject} handlers. `then` pushes one and returns the new promise those resolve/reject belong to; settling drains the queue, each in `queueMicrotask`.",
      "Resolution procedure: if the value has a callable `then`, call it and adopt whatever it settles with (recursively) — that's what makes `return anotherPromise` inside a callback work.",
    ],
    solution: `## Approach

A state machine (\`pending → fulfilled | rejected\`, one-way), a handler queue, and **every callback in a microtask** (\`queueMicrotask\`) so ordering matches native promises. \`then\` always returns a *new* promise whose fate is decided by the callback's return value; the resolution procedure unwraps thenables — including other \`MyPromise\`s — before settling.

\`\`\`js
// MyPromise — Promises/A+-shaped implementation: states, then-chaining,
// thenable adoption, async (microtask) callbacks, catch/finally, resolve/reject/all.
class MyPromise {
  #state = 'pending';   // 'pending' | 'fulfilled' | 'rejected'
  #value = undefined;
  #handlers = [];       // { onFulfilled, onRejected, resolve, reject }

  constructor(executor) {
    let called = false;                              // resolve/reject may only win once
    const once = (fn) => (v) => { if (!called) { called = true; fn(v); } };
    const resolve = once((value) => this.#resolve(value));
    const reject = once((reason) => this.#settle('rejected', reason));
    try { executor(resolve, reject); } catch (err) { reject(err); }
  }

  // Resolution procedure: unwrap thenables (including other MyPromises).
  #resolve(value) {
    if (value === this) return this.#settle('rejected', new TypeError('Chaining cycle detected'));
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      let then;
      try { then = value.then; } catch (err) { return this.#settle('rejected', err); }
      if (typeof then === 'function') {
        let called = false;
        try {
          then.call(
            value,
            (v) => { if (!called) { called = true; this.#resolve(v); } },
            (r) => { if (!called) { called = true; this.#settle('rejected', r); } },
          );
        } catch (err) {
          if (!called) { called = true; this.#settle('rejected', err); }
        }
        return;
      }
    }
    this.#settle('fulfilled', value);
  }

  #settle(state, value) {
    if (this.#state !== 'pending') return;
    this.#state = state;
    this.#value = value;
    this.#flush();
  }

  // Run queued handlers asynchronously (microtask), never synchronously.
  #flush() {
    if (this.#state === 'pending') return;
    const handlers = this.#handlers;
    this.#handlers = [];
    for (const h of handlers) queueMicrotask(() => this.#run(h));
  }

  #run({ onFulfilled, onRejected, resolve, reject }) {
    const cb = this.#state === 'fulfilled' ? onFulfilled : onRejected;
    if (typeof cb !== 'function') {                   // no handler: pass value/reason through
      return this.#state === 'fulfilled' ? resolve(this.#value) : reject(this.#value);
    }
    try { resolve(cb(this.#value)); } catch (err) { reject(err); }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.#handlers.push({ onFulfilled, onRejected, resolve, reject });
      this.#flush();                                   // already settled? schedule now
    });
  }

  catch(onRejected) { return this.then(undefined, onRejected); }

  finally(onFinally) {
    return this.then(
      (v) => MyPromise.resolve(onFinally()).then(() => v),
      (r) => MyPromise.resolve(onFinally()).then(() => { throw r; }),
    );
  }

  static resolve(v) { return v instanceof MyPromise ? v : new MyPromise((res) => res(v)); }
  static reject(r) { return new MyPromise((_, rej) => rej(r)); }

  static all(iterable) {
    return new MyPromise((resolve, reject) => {
      const items = [...iterable];
      const results = new Array(items.length);
      let remaining = items.length;
      if (remaining === 0) return resolve(results);
      items.forEach((item, i) => {
        MyPromise.resolve(item).then((v) => {
          results[i] = v;                              // keep input order, not completion order
          if (--remaining === 0) resolve(results);
        }, reject);                                    // first rejection wins
      });
    });
  }
}

// Bonus follow-up: an abortable promise. Native promises are not cancellable —
// cancellation lives in the *work* (AbortController), and the promise just rejects.
class AbortablePromise extends MyPromise {
  constructor(executor) {
    let rejectRef;
    let cleanup = () => {};
    super((resolve, reject) => {
      rejectRef = reject;
      executor(resolve, reject, (onAbort) => { cleanup = onAbort; });
    });
    this.abort = (reason = Object.assign(new Error('Aborted'), { name: 'AbortError' })) => {
      cleanup();           // e.g. clearTimeout / controller.abort()
      rejectRef(reason);   // no-op if already settled
    };
  }
}
\`\`\`

## Worth saying out loud

- Why microtasks and not \`setTimeout\`: native promises use the microtask queue — they run before the next macrotask and before a render. \`setTimeout(0)\` would reorder relative to real promises.
- \`resolve(anotherPromise)\` must *adopt* its state, not fulfill with the promise object — that's the thenable branch of \`#resolve\`.
- Promises can't be cancelled; **cancel the work** (\`AbortController\`, \`clearTimeout\`) and reject with an \`AbortError\`. In React the effect cleanup calls \`controller.abort()\`.
- \`allSettled\` / \`race\` / \`any\` reuse \`all\`'s skeleton: never reject and collect \`{status, value|reason}\`; settle with the first to finish; reject only when all reject (\`AggregateError\`).
- Unhandled rejections: natively tracked by whether a rejected promise gained a handler by the end of the microtask checkpoint — a flag set in \`then\`, checked after settling.`,
    judge: {
      starterCode: `class MyPromise {
  constructor(executor) {
    // Your state here: 'pending' | 'fulfilled' | 'rejected', the value, queued handlers
  }

  /** Always returns a new MyPromise; callbacks run in a microtask. */
  then(onFulfilled, onRejected) {
    return new MyPromise(() => {});
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally) {
    return this;
  }

  static resolve(value) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  static all(iterable) {
    return new MyPromise(() => {});
  }
}

/** Bonus: executor(resolve, reject, onAbort); abort() runs the cleanup and rejects with an AbortError. */
class AbortablePromise extends MyPromise {
  abort() {}
}
`,
      entry: "__runPromiseScenario",
      // queueMicrotask and setTimeout are stubbed with driver-owned queues so
      // ordering is observable: microtasks drain before any timer fires. A
      // real macrotask is awaited between drains so implementations that
      // schedule through native promises settle too.
      driverCode: `const __realSetTimeout = globalThis.setTimeout.bind(globalThis);
async function __runPromiseScenario(kind) {
  const micro = [];
  const timers = [];
  let seq = 0;
  globalThis.queueMicrotask = (fn) => { micro.push(fn); };
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
  const scenarios = {
    "callbacks-are-async": () => {
      new MyPromise((resolve) => { push("exec"); resolve(1); })
        .then((v) => { push("then:" + v); return v + 1; })
        .then((v) => push("then:" + v));
      push("sync");
    },
    "reject-catch": () => {
      new MyPromise((_, reject) => reject("bad")).then(() => push("no")).catch((r) => push("caught:" + r));
    },
    "executor-throws": () => {
      new MyPromise(() => { throw new Error("boom"); }).catch((e) => push(e.message));
    },
    "then-throws": () => {
      MyPromise.resolve(1).then(() => { throw new Error("x"); }).then(() => push("no"), (e) => push("rej:" + e.message));
    },
    "adopt-inner-promise": () => {
      MyPromise.resolve(1).then(() => new MyPromise((resolve) => resolve("inner"))).then((v) => push(v));
    },
    "adopt-thenable": () => {
      MyPromise.resolve(1).then(() => ({ then(resolve) { resolve("thenable"); } })).then((v) => push(v));
    },
    "settles-once": () => {
      new MyPromise((resolve, reject) => { resolve("a"); resolve("b"); reject("c"); }).then((v) => push(v), (r) => push("rej:" + r));
    },
    "pass-through": () => {
      MyPromise.resolve("v").then().then((v) => push(v));
      MyPromise.reject("r").then().catch((r) => push(r));
    },
    "microtasks-before-timers": () => {
      setTimeout(() => push("timer"), 0);
      MyPromise.resolve().then(() => push("micro"));
    },
    "all-keeps-order": () => {
      MyPromise.all([MyPromise.resolve("a"), "b", new MyPromise((resolve) => resolve("c"))]).then((r) => push(r.join(",")));
    },
    "all-rejects-fast": () => {
      MyPromise.all([MyPromise.resolve(1), MyPromise.reject("no")]).then(() => push("ok"), (r) => push("fail:" + r));
    },
    "all-empty": () => {
      MyPromise.all([]).then((r) => push("len:" + r.length));
    },
    "finally-passes-through": () => {
      MyPromise.resolve(5).finally(() => push("fin")).then((v) => push("v:" + v));
    },
    "abort": () => {
      const p = new AbortablePromise((resolve, reject, onAbort) => {
        const id = setTimeout(() => resolve("late"), 1000);
        onAbort(() => clearTimeout(id));
      });
      p.then((v) => push(v), (e) => push(e.name));
      p.abort();
    },
  };
  scenarios[kind]();
  for (let round = 0; round < 50; round++) {
    while (micro.length > 0) micro.shift()();
    await new Promise((resolve) => __realSetTimeout(resolve, 0));
    if (micro.length > 0) continue;
    if (timers.length === 0) break;
    timers.sort((a, b) => a.due - b.due || a.id - b.id);
    const t = timers.shift();
    t.fn(...t.rest);
  }
  return order;
}`,
      tests: [
        { name: "Callbacks run after the synchronous code", input: ["callbacks-are-async"], expected: ["exec", "sync", "then:1", "then:2"] },
        { name: "Rejection reaches catch", input: ["reject-catch"], expected: ["caught:bad"] },
        { name: "A throwing executor rejects", input: ["executor-throws"], expected: ["boom"] },
        { name: "A throwing then-callback rejects the next promise", input: ["then-throws"], expected: ["rej:x"] },
        { name: "A returned promise is adopted", input: ["adopt-inner-promise"], expected: ["inner"] },
        { name: "A returned thenable is adopted", input: ["adopt-thenable"], expected: ["thenable"] },
        { name: "Only the first settle wins", input: ["settles-once"], expected: ["a"] },
        { name: "Missing handlers pass through", input: ["pass-through"], expected: ["v", "r"] },
        { name: "Microtasks run before timers", input: ["microtasks-before-timers"], expected: ["micro", "timer"] },
        { name: "all keeps input order", input: ["all-keeps-order"], expected: ["a,b,c"] },
        { name: "all rejects on the first rejection", input: ["all-rejects-fast"], expected: ["fail:no"] },
        { name: "all of nothing resolves to []", input: ["all-empty"], expected: ["len:0"] },
        { name: "finally runs and passes the value through", input: ["finally-passes-through"], expected: ["fin", "v:5"] },
        { name: "abort() cleans up and rejects with AbortError", input: ["abort"], expected: ["AbortError"] },
      ],
    },
  },
  {
    slug: "debounce-cancel-flush-throttle",
    title: "Debounce II and Throttle",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Debounce waits for silence, throttle guarantees a rate — plus the cancel() and flush() follow-ups.",
    prompt: `Write \`debounce\` from scratch, then the follow-ups Airbnb adds: \`cancel()\` and \`flush()\`, and a \`throttle\` — and be ready to say where you'd use each.

\`\`\`
debounceWithControls(fn, wait)  // trailing-edge debounce
  .cancel()                     // drop the pending call
  .flush()                      // run the pending call now (no-op if nothing is pending)
throttle(fn, wait)              // leading call, then at most one call per wait ms,
                                // with a trailing call carrying the latest arguments
\`\`\`

The grader replays timed call scripts on a virtual clock — \`setTimeout\`, \`clearTimeout\`, and \`Date.now\` are stubbed — so build on those, not on \`performance.now\` or promises. Each case's input is the kind, the wait, and a script of \`[ms, action, ...args]\` steps; the expected output lists every fire as \`{at, args}\`.

## Rules

- Debounce fires once per burst, \`wait\` ms after the **last** call, with that call's arguments.
- \`flush\` runs the pending call immediately and clears the timer; \`cancel\` drops it. Later calls start a fresh cycle either way.
- Throttle fires **immediately** on the first call; calls inside the window collapse into one trailing fire at the window's end with the **latest** arguments; a call after a quiet window fires immediately again.
- Return real \`function\`s, not arrows, so a caller's \`this\` is forwarded.

## Worth asking out loud

Leading or trailing edge? Should \`flush\` fire when nothing is pending? Where would you use each? (Debounce: typeahead input, resize, autosave. Throttle: scroll tracking, drag, analytics pings.)`,
    hints: [
      "A closure over one timer id is all the state debounce needs; each call clears and re-arms it. For cancel/flush, also remember the pending args and `this` so flush can invoke them.",
      "Throttle tracks the time of the last fire: if enough time has passed, fire now; otherwise arm a single trailing timer for the remainder and keep overwriting the saved latest args.",
    ],
    solution: `## Approach

All three are closures over timer state. Debounce re-arms one timer on every call and fires with the last arguments once the calls stop; the controls version also keeps the pending \`args\`/\`this\` so \`flush\` can run them early and \`cancel\` can drop them. Throttle remembers when it last fired: a call after the window fires immediately, a call inside the window arms a single trailing timer for the remainder and keeps overwriting the saved latest arguments.

\`\`\`js
// Debounce: run fn only after calls have stopped for \`wait\` ms (trailing edge).
function debounce(fn, wait) {
  let timer = null;
  return function debounced(...args) {      // function, not arrow: keep caller's \`this\`
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}

// Debounce II: adds cancel() (drop the pending call) and flush() (run it now).
function debounceWithControls(fn, wait) {
  let timer = null;
  let pendingArgs;
  let pendingThis;

  const invoke = () => {
    timer = null;
    const args = pendingArgs;
    const ctx = pendingThis;
    pendingArgs = pendingThis = undefined;
    fn.apply(ctx, args);
  };

  function debounced(...args) {
    pendingArgs = args;
    pendingThis = this;
    clearTimeout(timer);
    timer = setTimeout(invoke, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
    pendingArgs = pendingThis = undefined;
  };

  debounced.flush = () => {
    if (timer !== null) {                    // only if something is pending
      clearTimeout(timer);
      invoke();
    }
  };

  return debounced;
}

// Throttle: run at most once per \`wait\` ms (leading call + trailing call with latest args).
function throttle(fn, wait) {
  let last = 0;
  let timer = null;
  let lastArgs;
  let lastThis;
  return function throttled(...args) {
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
\`\`\`

## Worth saying out loud

- Say where you'd use each unprompted: **debounce waits for silence** (typeahead, resize, autosave); **throttle guarantees a rate** (scroll position, drag, analytics).
- Why \`function\`, not an arrow, for the returned wrapper: it forwards the caller's \`this\` (a class method, an \`addEventListener\` target); an arrow would freeze \`this\` to the definition site.
- Leading-edge option: if no timer is pending on the first call, invoke immediately, then arm the timer and skip the trailing call unless new args arrived.
- In React: debounce the *value* (\`useDebouncedValue\`) or \`useMemo(() => debounce(fn, 300), [])\` — never create the debounced function inline in render (a new closure every render debounces nothing); clear timers in effect cleanup.
- For visual updates, a \`requestAnimationFrame\` throttle coalesces to one call per frame instead of a time window.`,
    judge: {
      starterCode: `/** Trailing-edge debounce with .cancel() and .flush(). */
function debounceWithControls(fn, wait) {
  // Your code here
  function debounced(...args) {
    fn.apply(this, args);
  }
  debounced.cancel = () => {};
  debounced.flush = () => {};
  return debounced;
}

/** Leading call, then at most one call per wait ms, with a trailing call carrying the latest args. */
function throttle(fn, wait) {
  return function throttled(...args) {
    fn.apply(this, args);
  };
}
`,
      entry: "__runTimingScenario",
      // Virtual clock: setTimeout/clearTimeout/Date.now are replaced by a
      // scheduler the driver advances, so scenarios are deterministic and
      // instant. The clock starts well above zero, as a real one would.
      driverCode: `function __runTimingScenario(kind, wait, script) {
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
  var wrapped = kind === "throttle" ? throttle(record, wait) : debounceWithControls(record, wait);

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
    else if (step[1] === "cancel") wrapped.cancel();
    else if (step[1] === "flush") wrapped.flush();
  }
  advanceTo(base + 1000000);
  return fires;
}`,
      tests: [
        { name: "A burst collapses to one trailing fire", input: ["debounce", 100, [[0, "call", 1], [30, "call", 2], [60, "call", 3]]], expected: [{ at: 160, args: [3] }] },
        { name: "cancel drops the pending call", input: ["debounce", 100, [[0, "call", 1], [50, "cancel"]]], expected: [] },
        { name: "flush runs the pending call now", input: ["debounce", 100, [[0, "call", 1], [20, "flush"]]], expected: [{ at: 20, args: [1] }] },
        { name: "flush with nothing pending is a no-op", input: ["debounce", 100, [[0, "flush"], [10, "call", 1]]], expected: [{ at: 110, args: [1] }] },
        { name: "A fresh cycle after flush", input: ["debounce", 100, [[0, "call", 1], [10, "flush"], [50, "call", 2]]], expected: [{ at: 10, args: [1] }, { at: 150, args: [2] }] },
        { name: "A fresh cycle after cancel", input: ["debounce", 100, [[0, "call", 1], [10, "cancel"], [20, "call", 2]]], expected: [{ at: 120, args: [2] }] },
        { name: "Debounce forwards every argument", input: ["debounce", 50, [[0, "call", "a", "b"]]], expected: [{ at: 50, args: ["a", "b"] }] },
        { name: "Throttle fires immediately", input: ["throttle", 100, [[0, "call", 1]]], expected: [{ at: 0, args: [1] }] },
        { name: "Calls inside the window collapse to one trailing fire", input: ["throttle", 100, [[0, "call", 1], [30, "call", 2], [60, "call", 3]]], expected: [{ at: 0, args: [1] }, { at: 100, args: [3] }] },
        { name: "A call after a quiet window fires immediately", input: ["throttle", 100, [[0, "call", 1], [150, "call", 2]]], expected: [{ at: 0, args: [1] }, { at: 150, args: [2] }] },
        { name: "Trailing fire, then a new window", input: ["throttle", 100, [[0, "call", 1], [50, "call", 2], [120, "call", 3]]], expected: [{ at: 0, args: [1] }, { at: 100, args: [2] }, { at: 200, args: [3] }] },
      ],
    },
  },
  {
    slug: "input-validation-rules",
    title: "Input Validation",
    category: "frontend",
    difficulty: "easy",
    companies: ["airbnb"],
    summary:
      "Declarative rules, first error per field, and the accessible display everyone forgets.",
    prompt: `Build the validation layer for a form: declarative rules per field, **one** error message per field — the first failing rule's — and \`{}\` when everything is valid. Reported on a senior frontend screen as simply "input validation".

\`\`\`
validate(values, schema) -> { fieldName: message }   // only the fields with errors
schema = { title: [rules.required(), rules.minLength(3)], email: [rules.required(), rules.email()] }
\`\`\`

\`rules\` is a set of factories returning validators \`(value) => message | null\`, with default messages the grader checks exactly. Every factory takes an optional custom message as its last argument.

| Factory | Default message |
|---|---|
| \`required(msg?)\` | \`Required\` — a missing, blank, or whitespace-only value is empty |
| \`minLength(n, msg?)\` | \`Must be at least {n} characters\` |
| \`pattern(regex, msg?)\` | \`Invalid format\` |
| \`email(msg?)\` | \`Enter a valid email\` |
| \`range(min, max, msg?)\` | \`Must be between {min} and {max}\` — non-numeric input fails too |

## Follow-up

How do you display these accessibly? \`aria-invalid\` on the input, the message in an element referenced by \`aria-describedby\`, validate on blur first (and on change only after the first error), and move focus to the first invalid field on submit.

## Worth asking out loud

Validate on every keystroke or on blur? Trim before checking? Does \`required\` treat \`0\` as present (yes — only blank strings are empty)?`,
    hints: [
      "Each rule is a tiny function (value) => message | null. `validate` walks each field's rules in order and stops at the first message — one error per field, not five.",
      "Write the factories to close over their parameters and default message: `minLength(n, msg = ...)` returns the validator; keep the messages in one place so the UI and tests agree.",
    ],
    solution: `## Approach

Rules are factories that return validators \`(value) => message | null\`, so a schema is just data: an ordered list of validators per field. \`validate\` runs each field's list in order and stops at the first message — one error per field, which is what a user can act on. Everything else (the accessible display) sits on top of this pure function.

\`\`\`js
// Input validation: declarative rules → { fieldName: firstErrorMessage }.
// Rules run in order; the first failing rule is the message shown (one error per field, not five).
const rules = {
  required: (msg = 'Required') => (v) => (String(v ?? '').trim() === '' ? msg : null),
  minLength: (n, msg = \`Must be at least \${n} characters\`) => (v) => (String(v).length < n ? msg : null),
  pattern: (re, msg = 'Invalid format') => (v) => (re.test(String(v)) ? null : msg),
  email: (msg = 'Enter a valid email') => rules.pattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, msg),
  range: (min, max, msg = \`Must be between \${min} and \${max}\`) => (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? null : msg;
  },
};

function validate(values, schema) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const message = rule(values[field]);
      if (message) { errors[field] = message; break; }
    }
  }
  return errors;                    // {} means valid
}

// Example schema for a listing form:
const listingSchema = {
  title: [rules.required(), rules.minLength(3)],
  email: [rules.required(), rules.email()],
  guests: [rules.required(), rules.range(1, 16)],
};
\`\`\`

## Worth saying out loud

- The accessible display is the part people forget: \`aria-invalid="true"\` on the input, the message in an element referenced by \`aria-describedby\`, validate on **blur** first and on change only after the first error, and move focus to the first invalid field on submit.
- Keep native \`required\`/\`pattern\` as progressive enhancement, but don't rely on them — native messages aren't styleable and differ per browser.
- Name the pattern: strategy — swap behavior by passing functions. Async rules (username taken?) return a promise; run them last and only when the sync rules pass.`,
    judge: {
      starterCode: `// Validators return an error message, or null when the value passes.
const rules = {
  required: (msg = "Required") => (value) => null,
  minLength: (n, msg = \`Must be at least \${n} characters\`) => (value) => null,
  pattern: (re, msg = "Invalid format") => (value) => null,
  email: (msg = "Enter a valid email") => (value) => null,
  range: (min, max, msg = \`Must be between \${min} and \${max}\`) => (value) => null,
};

/** @returns {Record<string, string>} the first failing rule's message per field; {} when valid */
function validate(values, schema) {
  // Your code here
  return {};
}
`,
      entry: "__judgeValidation",
      // The schema arrives as data — [ruleName, ...params] per field — and is
      // built with the user's own factories, so their defaults are what's judged.
      driverCode: `function __judgeValidation(values, spec) {
  const schema = {};
  for (const field of Object.keys(spec)) {
    schema[field] = spec[field].map((entry) => {
      const [name, ...params] = entry;
      const args = name === "pattern" ? [new RegExp(params[0]), ...params.slice(1)] : params;
      return rules[name](...args);
    });
  }
  return validate(values, schema);
}`,
      tests: [
        {
          name: "A valid form has no errors",
          input: [
            { title: "Cozy loft", email: "a@b.co", guests: "4" },
            { title: [["required"], ["minLength", 3]], email: [["required"], ["email"]], guests: [["required"], ["range", 1, 16]] },
          ],
          expected: {},
        },
        { name: "Required", input: [{ title: "" }, { title: [["required"]] }], expected: { title: "Required" } },
        { name: "A missing field is empty", input: [{}, { title: [["required"]] }], expected: { title: "Required" } },
        { name: "Whitespace-only is empty", input: [{ title: "   " }, { title: [["required"]] }], expected: { title: "Required" } },
        { name: "Zero counts as present", input: [{ count: "0" }, { count: [["required"]] }], expected: {} },
        { name: "The first failing rule wins", input: [{ email: "" }, { email: [["required"], ["email"]] }], expected: { email: "Required" } },
        { name: "minLength", input: [{ title: "ab" }, { title: [["required"], ["minLength", 3]] }], expected: { title: "Must be at least 3 characters" } },
        { name: "email", input: [{ email: "nope" }, { email: [["required"], ["email"]] }], expected: { email: "Enter a valid email" } },
        { name: "range", input: [{ guests: "20" }, { guests: [["range", 1, 16]] }], expected: { guests: "Must be between 1 and 16" } },
        { name: "range rejects non-numeric input", input: [{ guests: "many" }, { guests: [["range", 1, 16]] }], expected: { guests: "Must be between 1 and 16" } },
        { name: "pattern", input: [{ zip: "abc", ok: "94103" }, { zip: [["pattern", "^\\d{5}$"]], ok: [["pattern", "^\\d{5}$"]] }], expected: { zip: "Invalid format" } },
        { name: "A custom message replaces the default", input: [{ title: "" }, { title: [["required", "Title is required"]] }], expected: { title: "Title is required" } },
        {
          name: "Several fields, one message each",
          input: [
            { title: "", email: "x", guests: "0" },
            { title: [["required"], ["minLength", 3]], email: [["required"], ["email"]], guests: [["range", 1, 16]] },
          ],
          expected: { title: "Required", email: "Enter a valid email", guests: "Must be between 1 and 16" },
        },
      ],
    },
  },
];
