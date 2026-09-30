import type { Problem } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), part E:
// Lodash's get, chunk and groupBy (from the guide's "have cold" list, not
// confirmed for Apple by name), and the key-paths question from a July 2025
// online screen. TypeScript variants live in seed-typescript-apple.ts.

export const appleJsProblemsE: Problem[] = [
  {
    slug: "implement-lodash-get",
    title: "Implement Lodash's get",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "Read a nested value by path, and return the fallback only when it is missing, never when it is merely falsy.",
    prompt: [
      "Write `get(obj, path, fallback)`: read a nested value by its path, and return `fallback` when the path leads nowhere.",
      "",
      "```",
      "get({ a: [{ b: { c: 3 } }] }, \"a[0].b.c\")             // 3",
      "get({ a: [{ b: { c: 3 } }] }, [\"a\", \"0\", \"b\", \"c\"])  // 3",
      "get({ a: {} }, \"a.b.c\", \"none\")                        // \"none\"",
      "```",
      "",
      "## Rules",
      "",
      "- `path` is a string of dots and bracketed indices (`\"a[0].b\"` or `\"a.0.b\"`), or an array of keys. An array key is used as it is, even when it contains a dot.",
      "- Walking into `null` or `undefined` returns `fallback`, and so does a final value of `undefined`.",
      "- Every other value comes back as stored, including `null`, `0`, `false` and `\"\"`. The fallback is for missing values, not falsy ones.",
      "- Properties of primitives work too: `\"name.length\"`.",
      "",
      "*The guide calls this the most common Lodash interview method. Utility rewrites like this come from reports of \"implement a Lodash method\" rounds that don't name the method, so treat it as likely rather than confirmed.*",
    ].join("\n"),
    hints: [
      "Normalize the path first. An array is used as it is. A string becomes keys by turning each `[n]` into `.n`, splitting on dots, and dropping empty pieces.",
      "Walk with `cur = cur[key]`, checking `cur == null` before each step. After the loop, only `undefined` means missing.",
    ],
    solution: [
      "## Approach",
      "",
      "Turn the path into a list of keys, then walk it one property at a time. `cur == null` catches both `null` and `undefined` in one comparison, so the walk stops safely before reading a property of nothing. At the end, only an `undefined` result falls back. A stored `null`, `0` or `false` is a real answer.",
      "",
      "## Worth saying out loud",
      "",
      "- **The fallback applies only to `undefined`.** A stored `null` or `0` is returned as it is.",
      "- Optional chaining is the built-in version when the path is known while writing the code: `obj?.a?.[0]?.b`. Pairing it with `?? fallback` also replaces a stored `null`, which Lodash would not.",
      "- The string form can't express a key that contains a dot or a bracket. That is what the array form is for.",
      "- Lodash also accepts quoted bracket keys, such as `a[\"b.c\"]`. Mention it rather than parse it.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Read a nested value by path ("a[0].b.c", "a.0.b.c" or ["a", "0", "b", "c"]).
 * Returns fallback when the path leads nowhere or ends at undefined.
 */
function get(obj, path, fallback) {
  // Your code here
  return fallback;
}
`,
      solutionCode: `function get(obj, path, fallback) {
  const keys = Array.isArray(path)
    ? path
    : String(path).replace(/\\[(\\w+)\\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const key of keys) {
    if (cur == null) return fallback; // null or undefined: nowhere to go
    cur = cur[key];
  }
  return cur === undefined ? fallback : cur; // null, 0 and false are real values
}
`,
      entry: "get",
      tests: [
        { name: "A dotted path with an index", input: [{ a: [{ b: { c: 3 } }] }, "a[0].b.c", "none"], expected: 3 },
        { name: "An array path", input: [{ a: [{ b: { c: 3 } }] }, ["a", "0", "b", "c"], "none"], expected: 3 },
        { name: "Dots work for indices too", input: [{ a: [{ b: { c: 3 } }] }, "a.0.b.c", "none"], expected: 3 },
        { name: "A missing step returns the fallback", input: [{ a: {} }, "a.b.c", "none"], expected: "none" },
        { name: "A null step returns the fallback", input: [{ a: null }, "a.b", "none"], expected: "none" },
        { name: "A stored null comes back", input: [{ a: { b: null } }, "a.b", "none"], expected: null },
        { name: "A stored 0 comes back", input: [{ a: { zero: 0 } }, "a.zero", "none"], expected: 0 },
        { name: "A stored false comes back", input: [{ flag: false }, "flag", "none"], expected: false },
        { name: "A stored empty string comes back", input: [{ s: "" }, "s", "none"], expected: "" },
        { name: "An index past the end", input: [{ a: [1] }, "a[3]", "none"], expected: "none" },
        { name: "Multi-digit indices", input: [{ a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, "a[11]", "none"], expected: 11 },
        { name: "Nested indices", input: [{ m: [[1, 2], [3, [4, 5]]] }, "m[1][1][0]", "none"], expected: 4 },
        { name: "An array key may contain a dot", input: [{ "a.b": 1, a: { b: 2 } }, ["a.b"], "none"], expected: 1 },
        { name: "The same key as a string path splits", input: [{ "a.b": 1, a: { b: 2 } }, "a.b", "none"], expected: 2 },
        { name: "Properties of primitives work", input: [{ s: "hello" }, "s.length", "none"], expected: 5 },
        { name: "Walking through a primitive falls back", input: [{ a: 5 }, "a.b.c", "none"], expected: "none" },
        { name: "A null object falls back", input: [null, "a", "none"], expected: "none" },
      ],
    },
  },
  {
    slug: "chunk-and-group-by",
    title: "chunk and groupBy",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "Two Lodash array methods, plus the key a plain object already has: `\"constructor\"`.",
    prompt: [
      "Two short Lodash array methods.",
      "",
      "## `chunk(array, size)`",
      "",
      "Split `array` into arrays of `size` elements; the last one may be shorter. `size` is rounded down, and a size below 1 returns `[]`. Leave the input alone.",
      "",
      "## `groupBy(array, iteratee)`",
      "",
      "Return an object mapping each key to the items that produced it, in input order. `iteratee` is a function, or a property name to read from each item, such as `\"length\"` or `\"type\"`. Keys are strings, as object keys always are.",
      "",
      "Every key must work, including `\"constructor\"` and `\"toString\"`, which a plain `{}` already inherits.",
      "",
      "`Object.groupBy` and `Map.groupBy` are switched off while your code runs. The functions named in the tests (`floor`, `identity` and `parity`) are supplied by the grader.",
      "",
      "*From the guide's list of short Lodash array methods. Utility rewrites like this come from reports of \"implement a Lodash method\" rounds that don't name the method, so treat them as likely rather than confirmed.*",
    ].join("\n"),
    hints: [
      "For `chunk`, step `i` by `size` and take `slice(i, i + size)`. Clamp the size first, because a size of 0 would loop forever.",
      "For `groupBy`, turn a string iteratee into `(item) => item[iteratee]` once, at the top.",
      "A plain `{}` answers `out.constructor` with the `Object` function, so `(out[key] ??= [])` finds a function and `.push` throws. Start from `Object.create(null)`, or check `Object.hasOwn(out, key)`.",
    ],
    solution: [
      "## Approach",
      "",
      "`chunk` walks the array in steps of `size` and slices. `groupBy` normalizes the iteratee to a function, then appends each item to its key's list. The accumulator is a null-prototype object, so no key is ever already taken by `Object.prototype`.",
      "",
      "## Worth saying out loud",
      "",
      "- **`Object.groupBy` is built in now.** It returns a null-prototype object for exactly the reason in the last hint. Say so before writing your own.",
      "- The quick `(out[key] ??= []).push(item)` over a plain `{}` breaks on `\"constructor\"` and `\"toString\"`. A key of `\"__proto__\"` is worse: assigning it changes the object's prototype instead of adding a group.",
      "- When keys can be objects or must keep their type, return a `Map`, which is what `Map.groupBy` does.",
      "- `chunk` with a size of 0 is an infinite loop in the naive version. Clamp inputs at the boundary.",
    ].join("\n"),
    judge: {
      starterCode: `/** Split array into arrays of \`size\` (rounded down); [] when size < 1. */
function chunk(array, size) {
  // Your code here
  return [];
}

/** Map each key (iteratee function or property name) to its items, in input order. */
function groupBy(array, iteratee) {
  // Your code here
  return {};
}
`,
      solutionCode: `function chunk(array, size) {
  const step = Math.floor(size);
  if (!(step >= 1)) return []; // also catches NaN; a size of 0 would loop forever
  const out = [];
  for (let i = 0; i < array.length; i += step) out.push(array.slice(i, i + step));
  return out;
}

function groupBy(array, iteratee) {
  const keyOf = typeof iteratee === "function" ? iteratee : (item) => item[iteratee];
  const out = Object.create(null); // no inherited keys like "constructor"
  for (const item of array) {
    const key = String(keyOf(item));
    if (!(key in out)) out[key] = [];
    out[key].push(item);
  }
  return out;
}
`,
      entry: "__judgeCollections",
      driverCode: `function __judgeCollections(kind, a, b) {
  var named = {
    floor: Math.floor,
    identity: function (x) { return x; },
    parity: function (n) { return n % 2 === 0 ? "even" : "odd"; },
  };
  if (kind === "chunk") return chunk(a, b);
  if (kind === "chunkUnchanged") {
    var before = JSON.stringify(a);
    chunk(a, b);
    return JSON.stringify(a) === before;
  }
  if (kind === "groupBy") {
    var iteratee = b && typeof b === "object" ? named[b.fn] : b;
    var saved = { object: Object.groupBy, map: Map.groupBy };
    var banned = function () {
      throw new Error("Write it yourself: Object.groupBy and Map.groupBy are off limits here");
    };
    Object.groupBy = banned;
    Map.groupBy = banned;
    try {
      return groupBy(a, iteratee);
    } finally {
      Object.groupBy = saved.object;
      Map.groupBy = saved.map;
    }
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "chunk by 2", input: ["chunk", [1, 2, 3, 4, 5], 2], expected: [[1, 2], [3, 4], [5]] },
        { name: "An exact multiple", input: ["chunk", [1, 2, 3, 4], 2], expected: [[1, 2], [3, 4]] },
        { name: "A size larger than the array", input: ["chunk", [1, 2], 5], expected: [[1, 2]] },
        { name: "An empty array", input: ["chunk", [], 3], expected: [] },
        { name: "A size of 0 returns []", input: ["chunk", [1, 2, 3], 0], expected: [] },
        { name: "A fractional size rounds down", input: ["chunk", [1, 2, 3], 2.9], expected: [[1, 2], [3]] },
        { name: "chunk leaves the input alone", input: ["chunkUnchanged", [1, 2, 3], 2], expected: true },
        { name: "groupBy with a function", input: ["groupBy", [6.1, 4.2, 6.3], { fn: "floor" }], expected: { "4": [4.2], "6": [6.1, 6.3] } },
        { name: "groupBy with a property name", input: ["groupBy", ["one", "two", "three"], "length"], expected: { "3": ["one", "two"], "5": ["three"] } },
        { name: "groupBy on objects", input: ["groupBy", [{ type: "a", n: 1 }, { type: "b", n: 2 }, { type: "a", n: 3 }], "type"], expected: { a: [{ type: "a", n: 1 }, { type: "a", n: 3 }], b: [{ type: "b", n: 2 }] } },
        { name: "Groups keep input order", input: ["groupBy", [1, 2, 3, 4, 5], { fn: "parity" }], expected: { odd: [1, 3, 5], even: [2, 4] } },
        { name: "Keys a plain object already has", input: ["groupBy", ["constructor", "toString", "a", "constructor"], { fn: "identity" }], expected: { constructor: ["constructor", "constructor"], toString: ["toString"], a: ["a"] } },
        { name: "An empty array groups to {}", input: ["groupBy", [], { fn: "identity" }], expected: {} },
      ],
    },
  },
  {
    slug: "nested-object-key-paths",
    title: "Key Paths of a Nested Object",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "The dotted path to every primitive in a nested object or array, then the follow-up: inputs with cycles.",
    prompt: [
      "Return the path to every primitive in a nested object or array.",
      "",
      "| Input | Output |",
      "|---|---|",
      "| `{ a: { b: { c: 1 }, d: 2 }, e: 3 }` | `[\"a.b.c\", \"a.d\", \"e\"]` |",
      "| `[1, { a: 2, b: [3, 4] }, 5]` | `[\"0\", \"1.a\", \"1.b.0\", \"1.b.1\", \"2\"]` |",
      "",
      "## Rules",
      "",
      "- A path joins keys with dots, and array indices are keys too.",
      "- A primitive is anything that is not an object, plus `null`. Empty objects and arrays contribute nothing.",
      "- Paths come out in visiting order: insertion order for objects, index order for arrays.",
      "- The input is always an object or an array.",
      "",
      "## Follow-up: cycles",
      "",
      "Inputs may contain cycles. Skip a reference to an object that is already on the current path. The same object reached along two different paths is listed under both.",
      "",
      "*Reported in: a 60-minute online screen for a Frontend Engineer role in Hyderabad (Medium, Jul 2025).*",
    ].join("\n"),
    hints: [
      "Recurse with the path so far. `typeof null` is `\"object\"`, so test `value === null` first.",
      "`Object.keys` returns index strings for arrays, so one loop covers both shapes.",
      "For cycles, keep a `Set` of the objects on the current path: add before descending, delete after. A visited set that never forgets would drop the second path to a shared object.",
    ],
    solution: [
      "## Approach",
      "",
      "A depth-first walk that carries the path. A primitive, `null` included, records the path. An object or array recurses into each of its keys, and `Object.keys` gives array indices as strings, so the two shapes share one loop. For cycles, the walk keeps the objects on its current path in a `Set`, adding one on the way down and removing it on the way back up. A reference back to an ancestor is skipped, while a shared object reached by another route is walked again.",
      "",
      "## Worth saying out loud",
      "",
      "- **`typeof null` is `\"object\"`**, so the null check has to come first.",
      "- Keys that contain a dot make paths ambiguous: `{ \"a.b\": 1 }` and `{ a: { b: 1 } }` both give `\"a.b\"`. Say so, and return arrays of keys if it matters.",
      "- Integer-like object keys are visited first, in ascending order: `{ b: 1, 2: 2 }` gives `[\"2\", \"b\"]`.",
      "- Recursion depth equals nesting depth. For untrusted input, switch to an explicit stack.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Dotted paths to every primitive (null included) in a nested object or array.
 * Skip references back to an object already on the current path.
 */
function fetchKeys(input) {
  // Your code here
  return [];
}
`,
      solutionCode: `function fetchKeys(input) {
  const out = [];
  const onPath = new Set(); // ancestors of the current value, for cycles
  const walk = (value, path) => {
    if (value === null || typeof value !== "object") {
      out.push(path); // typeof null is "object", so null is checked first
      return;
    }
    if (onPath.has(value)) return; // a cycle back to an ancestor
    onPath.add(value);
    for (const key of Object.keys(value)) {
      walk(value[key], path ? path + "." + key : key);
    }
    onPath.delete(value); // a shared object may be reached again by another route
  };
  walk(input, "");
  return out;
}
`,
      entry: "__judgeKeyPaths",
      driverCode: `function __judgeKeyPaths(kind, input) {
  if (kind === "paths") return fetchKeys(input);
  if (kind === "cycle") {
    var root = { a: 1, b: { c: 2 } };
    root.b.back = root;
    root.self = root;
    return fetchKeys(root);
  }
  if (kind === "shared") {
    var shared = { x: 1 };
    return fetchKeys({ a: shared, b: [shared] });
  }
  if (kind === "sharedAndCycle") {
    var node = { v: 1 };
    node.me = node;
    return fetchKeys({ left: node, right: { again: node } });
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "Nested objects", input: ["paths", { a: { b: { c: 1 }, d: 2 }, e: 3 }], expected: ["a.b.c", "a.d", "e"] },
        { name: "Arrays use their indices", input: ["paths", [1, { a: 2, b: [3, 4] }, 5]], expected: ["0", "1.a", "1.b.0", "1.b.1", "2"] },
        { name: "null is a primitive", input: ["paths", { a: null, b: { c: null } }], expected: ["a", "b.c"] },
        { name: "Empty containers add nothing", input: ["paths", { a: {}, b: [], c: 1 }], expected: ["c"] },
        { name: "Strings and booleans", input: ["paths", { name: "x", flag: false, nested: { s: "" } }], expected: ["name", "flag", "nested.s"] },
        { name: "An empty object", input: ["paths", {}], expected: [] },
        { name: "An empty array", input: ["paths", []], expected: [] },
        { name: "Deep nesting", input: ["paths", { a: { b: { c: { d: { e: 1 } } } } }], expected: ["a.b.c.d.e"] },
        { name: "Keys keep insertion order", input: ["paths", { z: 1, a: 2, m: { y: 3, b: 4 } }], expected: ["z", "a", "m.y", "m.b"] },
        { name: "Cycles are skipped", input: ["cycle"], expected: ["a", "b.c"] },
        { name: "A shared object is listed under both paths", input: ["shared"], expected: ["a.x", "b.0.x"] },
        { name: "A shared object that contains a cycle", input: ["sharedAndCycle"], expected: ["left.v", "right.again.v"] },
      ],
    },
  },
];
