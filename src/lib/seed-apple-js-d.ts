import type { Problem } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), part D: the
// utility rewrites the guide lists as "have cold". None is confirmed for
// Apple by name: two candidates were asked to "implement a Lodash method"
// without being told which, and GreatFrontEnd's Apple guide says to practice
// utilities. This part holds cloneDeep and memoize/curry/once. TypeScript
// variants live in seed-typescript-apple.ts.

export const appleJsProblemsD: Problem[] = [
  {
    slug: "implement-clone-deep",
    title: "Implement cloneDeep",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Cycles, shared references, `Date`, `RegExp`, `Map`, `Set`, prototypes and symbol keys: everything spread and JSON get wrong.",
    prompt: [
      "Write `cloneDeep(value)`: a copy that shares no mutable state with the original. It is the natural follow-up after showing that `{ ...obj }` is only a shallow copy.",
      "",
      "## Rules",
      "",
      "- Primitives and functions come back as they are.",
      "- Arrays stay arrays, and plain objects are copied property by property, including symbol keys.",
      "- A `Date` becomes a new `Date` with the same time. A `RegExp` becomes a new `RegExp` with the same source and flags.",
      "- A `Map` or `Set` becomes a new one of the same kind, with its keys and values deep-cloned.",
      "- The copy keeps the original's prototype, so a class instance is still an instance of its class. A null-prototype object stays one.",
      "- **Cycles and shared references survive.** An object that refers to itself yields a clone that refers to *itself*. Two properties pointing at one object point at one copy.",
      "",
      "`structuredClone` is switched off while your code runs. It would also fail two of the rules above.",
      "",
      "*The guide lists this as the follow-up to its shallow-copy output question. Utility rewrites like this come from reports of \"implement a Lodash method\" rounds that don't name the method, so treat it as likely rather than confirmed.*",
    ].join("\n"),
    hints: [
      "Keep a `WeakMap` from each original object to its copy. Check it first, and register the new copy **before** recursing into the object's children, or a cycle recurses forever.",
      "Handle the special types before the generic case: `Date`, `RegExp`, `Map`, `Set`. For everything else, `Object.create(Object.getPrototypeOf(value))` keeps the prototype, or use `[]` for arrays.",
      "`Reflect.ownKeys` returns string and symbol keys alike, so a single loop copies both.",
    ],
    solution: [
      "## Approach",
      "",
      "A recursive copy with a memo. Primitives and functions return immediately. Every object is looked up in a `WeakMap` first. On a miss, the function creates the copy, records it, and only then fills it in, so a cycle finds the half-built copy instead of recursing forever. Special types get their own constructors. Everything else is created with the original's prototype and filled from `Reflect.ownKeys`.",
      "",
      "## Worth saying out loud",
      "",
      "- **Register the copy in `seen` before recursing**, or a cycle recurses forever.",
      "- `JSON.parse(JSON.stringify(x))` drops `undefined` and functions, turns dates into strings, loses `Map`, `Set` and prototypes, and throws on cycles.",
      "- `structuredClone` is the built-in answer. It handles cycles, `Map`, `Set` and `Date`, but it throws on functions and does not keep prototypes.",
      "- What should happen to a DOM node, a `WeakMap` or a class with private `#fields`? None can be copied faithfully. Asking shows you know where deep copying stops.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Deep-copy value: cycles, shared references, Date, RegExp, Map, Set,
 * prototypes and symbol keys all survive.
 */
function cloneDeep(value) {
  // Your code here
  return value;
}
`,
      solutionCode: `function cloneDeep(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value; // primitives and functions
  if (seen.has(value)) return seen.get(value); // cycles and shared references

  if (value instanceof Date) {
    const copy = new Date(value.getTime());
    seen.set(value, copy);
    return copy;
  }
  if (value instanceof RegExp) {
    const copy = new RegExp(value.source, value.flags);
    seen.set(value, copy);
    return copy;
  }
  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy); // register before recursing
    value.forEach((v, k) => copy.set(cloneDeep(k, seen), cloneDeep(v, seen)));
    return copy;
  }
  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => copy.add(cloneDeep(v, seen)));
    return copy;
  }

  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length") continue;
    copy[key] = cloneDeep(value[key], seen);
  }
  return copy;
}
`,
      entry: "__judgeCloneDeep",
      driverCode: `function __judgeCloneDeep(kind) {
  var savedClone = globalThis.structuredClone;
  globalThis.structuredClone = function () {
    throw new Error("Write it yourself: structuredClone is off limits here");
  };
  try {
    if (kind === "plain") {
      var v = { a: 1, b: { c: [1, 2, { d: 3 }] }, s: "x", n: null };
      var c = cloneDeep(v);
      return {
        equal: JSON.stringify(c) === JSON.stringify(v),
        same: c === v,
        nestedShared: c.b === v.b || c.b.c === v.b.c || c.b.c[2] === v.b.c[2],
      };
    }
    if (kind === "independent") {
      var orig = { list: [1, { d: 3 }] };
      var copy = cloneDeep(orig);
      copy.list.push(4);
      copy.list[1].d = 9;
      return [orig.list.length, orig.list[1].d];
    }
    if (kind === "arrays") {
      var arr = [1, [2, [3]], { x: [4] }];
      var ca = cloneDeep(arr);
      return [Array.isArray(ca), Array.isArray(ca[1][1]), ca[1] !== arr[1], JSON.stringify(ca)];
    }
    if (kind === "primitives") {
      return [cloneDeep(5), cloneDeep("s"), cloneDeep(null), cloneDeep(true), String(cloneDeep(undefined))];
    }
    if (kind === "functions") {
      var fn = function () { return 1; };
      var withFn = { f: fn };
      var cf = cloneDeep(withFn);
      return [cf.f === fn, cf !== withFn];
    }
    if (kind === "cycle") {
      var o = { name: "o" };
      o.self = o;
      var co = cloneDeep(o);
      return [co.self === co, co !== o, co.name];
    }
    if (kind === "deepCycle") {
      var x = {};
      var y = { x: x };
      x.y = y;
      var cx = cloneDeep(x);
      return [cx.y.x === cx, cx.y !== y];
    }
    if (kind === "shared") {
      var shared = { n: 1 };
      var holder = { a: shared, b: [shared] };
      var ch = cloneDeep(holder);
      return [ch.a === ch.b[0], ch.a !== shared];
    }
    if (kind === "date") {
      var withDate = { d: new Date(86400000) };
      var cd = cloneDeep(withDate);
      return [cd.d instanceof Date, cd.d !== withDate.d, cd.d.getTime()];
    }
    if (kind === "regexp") {
      var re = /ab+c/gi;
      var cr = cloneDeep({ r: re }).r;
      return [cr instanceof RegExp, cr !== re, cr.source, cr.flags];
    }
    if (kind === "map") {
      var key = { k: 1 };
      var m = new Map([[key, { v: 1 }], ["s", 2]]);
      var cm = cloneDeep(m);
      var keys = Array.from(cm.keys());
      return [cm instanceof Map, cm !== m, cm.size, keys[0] !== key, keys[0].k, cm.get(keys[0]).v, cm.get(keys[0]) !== m.get(key), cm.get("s")];
    }
    if (kind === "set") {
      var item = { a: 1 };
      var s = new Set([item, 2]);
      var cs = cloneDeep(s);
      var vals = Array.from(cs);
      return [cs instanceof Set, cs !== s, cs.size, vals[0] !== item, vals[0].a, vals[1]];
    }
    if (kind === "prototype") {
      function Point(px, py) {
        this.x = px;
        this.y = py;
      }
      Point.prototype.sum = function () {
        return this.x + this.y;
      };
      var p = new Point(1, 2);
      var cp = cloneDeep(p);
      return [cp instanceof Point, cp !== p, cp.sum(), Object.keys(cp)];
    }
    if (kind === "classInstance") {
      class Temperature {
        constructor(celsius) {
          this.celsius = celsius;
        }
        get fahrenheit() {
          return (this.celsius * 9) / 5 + 32;
        }
      }
      var t = cloneDeep(new Temperature(100));
      return [t instanceof Temperature, t.fahrenheit];
    }
    if (kind === "symbols") {
      var sym = Symbol("k");
      var withSym = { n: 1 };
      withSym[sym] = { deep: true };
      var csym = cloneDeep(withSym);
      return [csym[sym] !== undefined && csym[sym] !== withSym[sym], csym[sym] && csym[sym].deep, csym.n];
    }
    if (kind === "nullProto") {
      var bare = Object.create(null);
      bare.a = { b: 1 };
      var cb = cloneDeep(bare);
      return [Object.getPrototypeOf(cb) === null, cb.a.b, cb.a !== bare.a];
    }
    throw new Error("unknown case " + kind);
  } finally {
    globalThis.structuredClone = savedClone;
  }
}`,
      tests: [
        { name: "Plain objects are copied all the way down", input: ["plain"], expected: { equal: true, same: false, nestedShared: false } },
        { name: "Changing the copy leaves the original alone", input: ["independent"], expected: [2, 3] },
        { name: "Arrays stay arrays", input: ["arrays"], expected: [true, true, true, "[1,[2,[3]],{\"x\":[4]}]"] },
        { name: "Primitives come back as they are", input: ["primitives"], expected: [5, "s", null, true, "undefined"] },
        { name: "Functions are shared, not copied", input: ["functions"], expected: [true, true] },
        { name: "A self-reference points at the copy", input: ["cycle"], expected: [true, true, "o"] },
        { name: "A longer cycle survives", input: ["deepCycle"], expected: [true, true] },
        { name: "Shared references stay shared", input: ["shared"], expected: [true, true] },
        { name: "Dates are copied", input: ["date"], expected: [true, true, 86400000] },
        { name: "RegExps keep their source and flags", input: ["regexp"], expected: [true, true, "ab+c", "gi"] },
        { name: "Maps are copied, keys and values included", input: ["map"], expected: [true, true, 2, true, 1, 1, true, 2] },
        { name: "Sets are copied, members included", input: ["set"], expected: [true, true, 2, true, 1, 2] },
        { name: "The prototype is kept", input: ["prototype"], expected: [true, true, 3, ["x", "y"]] },
        { name: "Class instances keep their getters", input: ["classInstance"], expected: [true, 212] },
        { name: "Symbol keys are copied", input: ["symbols"], expected: [true, true, 1] },
        { name: "Null-prototype objects stay that way", input: ["nullProto"], expected: [true, 1, true] },
      ],
    },
  },
  {
    slug: "memoize-curry-once",
    title: "memoize, curry, and once",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Closure questions in code form: a cache keyed on all arguments, currying by `fn.length`, and a function that runs once.",
    prompt: [
      "Three utilities that are really closure questions.",
      "",
      "## `memoize(fn, resolver)`",
      "",
      "Return a function that caches `fn`'s result per key. The key is `resolver(...args)`, and by default `JSON.stringify(args)`, so all arguments count. A cached result is reused even when it is `0` or `undefined`. The wrapper forwards `this`, and each memoized function has its own cache.",
      "",
      "## `curry(fn)`",
      "",
      "Collect arguments across calls until at least `fn.length` of them have arrived, then call `fn` with all of them. Any call may pass several arguments, and extra ones are passed through. Partial applications are reusable: `const add1 = add(1)` can be called many times without the calls affecting each other. A function with no parameters is called on the first call, and `this` is forwarded.",
      "",
      "## `once(fn)`",
      "",
      "Call `fn` on the first call only, with that call's arguments and `this`. Every later call returns the first result without calling `fn` again, even when that result was `undefined`.",
      "",
      "*The guide lists these as closure questions in code form. Utility rewrites like this come from reports of \"implement a Lodash method\" rounds that don't name the method, so treat them as likely rather than confirmed.*",
    ].join("\n"),
    hints: [
      "`memoize` closes over a `Map`. Test membership with `cache.has(key)`, not a truthy lookup, so cached `0` and `undefined` results count as hits.",
      "`curry` returns a function that compares the arguments collected so far against `fn.length`. With too few, it returns a new function that closes over the arguments so far. Never mutate a shared array, or partials start affecting each other.",
      "`once` needs a flag, not a check on the result: `if (!called)`, never `if (result === undefined)`.",
    ],
    solution: [
      "## Approach",
      "",
      "Each utility is a closure over private state. `memoize` keeps a `Map` from key to result. `curry` keeps the arguments seen so far, and builds a new array on every call so partials stay independent. `once` keeps a `called` flag and the first result. All three return a `function` rather than an arrow and invoke `fn` with `apply(this, ...)`, so a method stays a method.",
      "",
      "## Worth saying out loud",
      "",
      "- Lodash's `memoize` keys on the **first argument only** unless you pass a resolver. Keying on `JSON.stringify(args)` covers every argument, but it fails for arguments that don't serialize, such as functions, and treats two distinct objects with the same content as one key.",
      "- **Check with `cache.has`, not truthiness**, so a cached `0` or `undefined` is still a hit.",
      "- An unbounded cache is a memory leak with a nicer name. Mention an LRU bound, or a `WeakMap` when the key is an object.",
      "- `curry` depends on `fn.length`, which doesn't count rest parameters or parameters with defaults. `curry((a, b = 1) => a + b)` fires after one argument.",
    ].join("\n"),
    judge: {
      starterCode: `/** Cache fn's results per resolver(...args); JSON.stringify(args) by default. */
function memoize(fn, resolver = (...args) => JSON.stringify(args)) {
  // Your code here
  return fn;
}

/** Collect arguments until fn.length have arrived, then call fn. */
function curry(fn) {
  // Your code here
  return fn;
}

/** Call fn once; later calls return the first result. */
function once(fn) {
  // Your code here
  return fn;
}
`,
      solutionCode: `function memoize(fn, resolver = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function (...args) {
    const key = resolver(...args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args)); // has, not truthiness
    return cache.get(key);
  };
}

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function (...more) {
      return curried.apply(this, [...args, ...more]); // a new array: partials stay independent
    };
  };
}

function once(fn) {
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
      entry: "__judgeFunctional",
      driverCode: `function __judgeFunctional(kind) {
  var calls = 0;
  if (kind === "memoByArgs") {
    var add = memoize(function (a, b) { calls++; return a + b; });
    return { results: [add(1, 2), add(1, 2), add(2, 1)], calls: calls };
  }
  if (kind === "memoFalsy") {
    var f = memoize(function (x) { calls++; return x > 0 ? undefined : 0; });
    return { results: [f(0), f(0), String(f(1)), String(f(1))], calls: calls };
  }
  if (kind === "memoResolver") {
    var byId = memoize(
      function (user) { calls++; return user.name.toUpperCase(); },
      function (user) { return user.id; },
    );
    return { results: [byId({ id: 1, name: "ann" }), byId({ id: 1, name: "changed" }), byId({ id: 2, name: "bo" })], calls: calls };
  }
  if (kind === "memoThis") {
    var counter = { base: 10, add: memoize(function (x) { return this.base + x; }) };
    return counter.add(5);
  }
  if (kind === "memoSeparate") {
    var double = function (x) { calls++; return x * 2; };
    var m1 = memoize(double);
    var m2 = memoize(double);
    m1(3);
    m2(3);
    m1(3);
    return calls;
  }
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
  if (kind === "onceUndefined") {
    var noop = once(function () { calls++; });
    noop();
    noop();
    return calls;
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "memoize caches by all arguments", input: ["memoByArgs"], expected: { results: [3, 3, 3], calls: 2 } },
        { name: "Cached 0 and undefined still count", input: ["memoFalsy"], expected: { results: [0, 0, "undefined", "undefined"], calls: 2 } },
        { name: "A resolver chooses the key", input: ["memoResolver"], expected: { results: ["ANN", "ANN", "BO"], calls: 2 } },
        { name: "memoize forwards this", input: ["memoThis"], expected: 15 },
        { name: "Each memoized function has its own cache", input: ["memoSeparate"], expected: 2 },
        { name: "curry takes arguments in any grouping", input: ["curryShapes"], expected: [6, 6, 6, 6] },
        { name: "Partials are reusable", input: ["curryPartials"], expected: [6, 31, 103] },
        { name: "A zero-parameter function runs at once", input: ["curryZeroArity"], expected: 42 },
        { name: "Extra arguments are passed through", input: ["curryExtraArgs"], expected: 4 },
        { name: "curry forwards this", input: ["curryThis"], expected: 103 },
        { name: "once calls fn a single time", input: ["onceCallsOnce"], expected: { results: [1, 1, 1], calls: 1 } },
        { name: "once uses the first call's arguments and this", input: ["onceFirstCall"], expected: ["hi ann from a", "hi ann from a"] },
        { name: "An undefined result still counts as called", input: ["onceUndefined"], expected: 1 },
      ],
    },
  },
];
