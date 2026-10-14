import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// JavaScript function prompts from GreatFrontEnd's list, the practice set the
// recruiter's email points at for the Snowflake frontend round: the ones the
// bank did not already hold.

export const snowflakeJsProblems: Problem[] = [
  {
    slug: "event-emitter",
    title: "Implement an Event Emitter",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A map from event name to listener list; copy the list before emitting so listeners can unsubscribe mid-emit.",
    prompt: [
      "Write a class `EventEmitter` with:",
      "",
      "- `on(event, listener)` — subscribe; returns the emitter so calls chain. The same listener may be added more than once and then fires once per subscription.",
      "- `off(event, listener)` — remove one subscription of that listener (the most recently added), if any; returns the emitter.",
      "- `emit(event, ...args)` — call every listener of the event with the arguments, in subscription order; returns `true` if there was at least one listener, else `false`.",
      "",
      "```js",
      "const emitter = new EventEmitter();",
      "emitter.on(\"sum\", (a, b) => console.log(a + b)).on(\"sum\", (a, b) => console.log(a * b));",
      "emitter.emit(\"sum\", 2, 3);   // logs 5 then 6, returns true",
      "emitter.emit(\"nothing\");     // false",
      "```",
    ].join("\n"),
    hints: [
      "A `Map` from event name to an array of listeners keeps subscription order and allows duplicates.",
      "Iterate over a copy of the array in `emit`: a listener that calls `off` on itself must not shift the others out of the loop.",
    ],
    solution: [
      "## Approach",
      "",
      "`on` appends to the event's array, creating it on first use. `off` removes the last matching entry with `lastIndexOf` and `splice`. `emit` snapshots the array, calls each listener with the spread arguments, and reports whether anything was called.",
      "",
      "## Worth saying out loud",
      "",
      "- Returning an unsubscribe function from `on` is the ergonomic alternative; the follow-up usually asks for it, or for `once`.",
      "- Node's EventEmitter also throws on an unhandled `error` event and warns past a listener count; neither belongs in the interview version.",
    ].join("\n"),
    judge: {
      starterCode: `class EventEmitter {
  constructor() {
    // Your state here
  }

  on(event, listener) {
    return this;
  }

  off(event, listener) {
    return this;
  }

  emit(event, ...args) {
    return false;
  }
}
`,
      solutionCode: `class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    const list = this.listeners.get(event);
    const index = list ? list.lastIndexOf(listener) : -1;
    if (index >= 0) list.splice(index, 1);
    return this;
  }

  emit(event, ...args) {
    const list = this.listeners.get(event);
    if (!list || list.length === 0) return false;
    for (const listener of [...list]) listener(...args); // a copy: listeners may unsubscribe mid-emit
    return true;
  }
}
`,
      entry: "__judgeEmitter",
      driverCode: `function __judgeEmitter(kind) {
  var log = [];
  var emitter = new EventEmitter();
  var sum = function (a, b) { log.push("sum " + (a + b)); };
  var product = function (a, b) { log.push("product " + (a * b)); };
  if (kind === "basics") {
    var chained = emitter.on("calc", sum).on("calc", product) === emitter;
    log.push("returned " + emitter.emit("calc", 2, 3));
    log.push("unknown " + emitter.emit("nothing"));
    log.push("chained " + chained);
    return log;
  }
  if (kind === "off") {
    emitter.on("calc", sum).on("calc", product).off("calc", sum);
    emitter.emit("calc", 4, 5);
    emitter.off("calc", product);
    log.push("after both off " + emitter.emit("calc", 1, 1));
    emitter.off("missing", sum);
    return log;
  }
  if (kind === "duplicates") {
    emitter.on("calc", sum).on("calc", sum);
    emitter.emit("calc", 1, 2);
    emitter.off("calc", sum);
    emitter.emit("calc", 3, 4);
    return log;
  }
  if (kind === "unsubscribeDuringEmit") {
    var once = function (a, b) { log.push("once " + (a + b)); emitter.off("calc", once); };
    emitter.on("calc", once).on("calc", sum);
    emitter.emit("calc", 1, 1);
    emitter.emit("calc", 2, 2);
    return log;
  }
  return log;
}`,
      tests: [
        { name: "Two listeners, in order, chainable", input: ["basics"], expected: ["sum 5", "product 6", "returned true", "unknown false", "chained true"] },
        { name: "off removes just that listener", input: ["off"], expected: ["product 20", "after both off false"] },
        { name: "Duplicates fire twice, off removes one", input: ["duplicates"], expected: ["sum 3", "sum 3", "sum 7"] },
        { name: "Unsubscribing mid-emit", input: ["unsubscribeDuringEmit"], expected: ["once 2", "sum 2", "sum 4"] },
      ],
    },
  },
  {
    slug: "deep-equal",
    title: "Implement deepEqual",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Primitives by value (NaN equals NaN), arrays by length and elements, plain objects by key set and values, recursively.",
    prompt: [
      "Write `deepEqual(a, b)` returning whether two values are structurally equal. Values are primitives, arrays, or plain objects, nested to any depth, with no cycles.",
      "",
      "- Primitives compare by value; `NaN` equals `NaN`, and `0` equals `-0`.",
      "- Arrays are equal when they have the same length and pairwise-equal elements; an array never equals an object.",
      "- Objects are equal when they have the same own keys and equal values for each key. A key present with the value `undefined` is still a key.",
      "",
      "```js",
      "deepEqual({ a: [1, { b: null }] }, { a: [1, { b: null }] })  // true",
      "deepEqual([1, 2], [2, 1])                                    // false",
      "deepEqual({ a: 1 }, { a: 1, b: undefined })                  // false",
      "```",
    ].join("\n"),
    hints: [
      "Handle the leaf cases first: strict equality or both NaN, then type and null checks that rule out mismatched shapes.",
      "For arrays compare lengths then recurse by index; for objects compare key counts, then check every key of one exists in the other and recurse.",
    ],
    solution: [
      "## Approach",
      "",
      "Return true for `a === b` or two NaNs. If either is not a non-null object, they differ. If exactly one is an array, they differ. Arrays: same length and every element deepEqual. Objects: same number of own keys, every key of `a` is an own key of `b`, and the values are deepEqual.",
      "",
      "## Worth saying out loud",
      "",
      "- `JSON.stringify` comparison is the tempting shortcut and fails on key order, `undefined`, and `NaN`.",
      "- Dates, Maps, Sets, typed arrays and cycles are the follow-ups; each needs its own branch (and cycles a visited map of pairs).",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * @param {*} a
 * @param {*} b
 * @returns {boolean} whether a and b are structurally equal
 */
function deepEqual(a, b) {
  // Your code here
  return a === b;
}
`,
      solutionCode: `function deepEqual(a, b) {
  if (a === b || (Number.isNaN(a) && Number.isNaN(b))) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((value, i) => deepEqual(value, b[i]));
  }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
}
`,
      entry: "__judgeDeepEqual",
      driverCode: `function __judgeDeepEqual(kind) {
  var pairs = {
    primitives: [[1, 1], [1, "1"], [NaN, NaN], [null, undefined], [0, -0], ["a", "a"], [true, false]],
    arrays: [[[1, 2], [1, 2]], [[1, 2], [2, 1]], [[1, [2, 3]], [1, [2, 3]]], [[1, 2], [1, 2, 3]], [[], []]],
    objects: [
      [{ a: 1, b: 2 }, { b: 2, a: 1 }],
      [{ a: 1 }, { a: 1, b: undefined }],
      [{ a: { b: [1] } }, { a: { b: [1] } }],
      [{}, []],
      [{ a: 1 }, { a: 2 }],
    ],
    mixed: [
      [[{ a: [1, { b: null }] }], [{ a: [1, { b: null }] }]],
      [{ a: [1] }, { a: [1, 2] }],
      [null, {}],
      [[null], [undefined]],
      [{ a: NaN }, { a: NaN }],
    ],
  }[kind];
  return pairs.map(function (pair) { return deepEqual(pair[0], pair[1]); });
}`,
      tests: [
        { name: "Primitives", input: ["primitives"], expected: [true, false, true, false, true, true, false] },
        { name: "Arrays", input: ["arrays"], expected: [true, false, true, false, true] },
        { name: "Objects", input: ["objects"], expected: [true, false, true, false, false] },
        { name: "Mixed nesting", input: ["mixed"], expected: [true, false, false, false, true] },
      ],
    },
  },
  {
    slug: "json-stringify",
    title: "Implement JSON.stringify",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A recursive serializer with the real rules: undefined vanishes from objects but becomes null in arrays, and strings need escaping.",
    prompt: [
      "Write `jsonStringify(value)` producing the same output as `JSON.stringify(value)` with no indentation, for these inputs: `null`, booleans, numbers, strings, arrays, and plain objects, nested.",
      "",
      "- Non-finite numbers (`NaN`, `Infinity`) serialize as `null`.",
      "- In an array, `undefined` and functions become `null`; in an object, keys with those values are omitted.",
      "- Strings are wrapped in double quotes with `\"`, `\\`, and control characters escaped.",
      "- A top-level `undefined` or function returns `undefined`.",
      "",
      "```js",
      "jsonStringify({ a: 1, b: [true, null, undefined], c: undefined })   // '{\"a\":1,\"b\":[true,null,null]}'",
      "jsonStringify(\"say \\\"hi\\\"\")                                      // '\"say \\\\\"hi\\\\\"\"'",
      "```",
    ].join("\n"),
    hints: [
      "Dispatch on type: null and finite numbers and booleans print as `String(value)`; strings get quoted and escaped; arrays and objects recurse.",
      "Objects need the key quoted too, and a value that serializes to `undefined` means skip the key.",
    ],
    solution: [
      "## Approach",
      "",
      "One recursive function. Primitives: `null`, booleans and finite numbers via `String`; other numbers become `\"null\"`; strings go through an escaper that handles quote, backslash and the control range. Arrays map each element, substituting `\"null\"` when the element serializes to `undefined`, and join with commas. Objects keep only own keys whose serialized value is defined.",
      "",
      "## Worth saying out loud",
      "",
      "- `toJSON` (Dates), `BigInt` (throws), symbols as keys (skipped), and cycles (throws) are the real implementation's remaining rules; name them, implement on request.",
      "- Escaping is where hand-rolled serializers go wrong; test a string containing a quote and a newline.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * @param {*} value
 * @returns {string | undefined} the JSON text, or undefined for a value JSON cannot represent at the top level
 */
function jsonStringify(value) {
  // Your code here
  return "";
}
`,
      solutionCode: String.raw`const ESCAPES = { '"': '\\"', "\\": "\\\\", "\n": "\\n", "\r": "\\r", "\t": "\\t", "\b": "\\b", "\f": "\\f" };

function quote(text) {
  const escaped = text.replace(/["\\\u0000-\u001f]/g, (ch) =>
    ESCAPES[ch] ?? "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );
  return '"' + escaped + '"';
}

function jsonStringify(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "string") return quote(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => jsonStringify(item) ?? "null").join(",") + "]";
  }
  if (typeof value === "object") {
    const parts = [];
    for (const key of Object.keys(value)) {
      const item = jsonStringify(value[key]);
      if (item !== undefined) parts.push(quote(key) + ":" + item);
    }
    return "{" + parts.join(",") + "}";
  }
  return undefined; // undefined, functions, symbols
}
`,
      entry: "__judgeStringify",
      driverCode: String.raw`function __judgeStringify(kind) {
  var cases = {
    scalars: [null, true, false, 42, -1.5, NaN, Infinity, "plain", ""],
    strings: ['say "hi"', "back\\slash", "line\nbreak\ttab", "\u0001control"],
    arrays: [[], [1, "two", null, true], [undefined, function () {}, [null]], [[[]]]],
    objects: [{}, { a: 1, b: "x" }, { a: undefined, b: function () {}, c: null }, { nested: { list: [1, { deep: true }] } }, { "key with space": 1 }],
    topLevel: [undefined, function () {}],
  }[kind];
  return cases.map(function (value) {
    var out = jsonStringify(value);
    return out === undefined ? "<undefined>" : out;
  });
}`,
      tests: [
        { name: "Scalars", input: ["scalars"], expected: ["null", "true", "false", "42", "-1.5", "null", "null", '"plain"', '""'] },
        { name: "String escaping", input: ["strings"], expected: ['"say \\"hi\\""', '"back\\\\slash"', '"line\\nbreak\\ttab"', '"\\u0001control"'] },
        { name: "Arrays", input: ["arrays"], expected: ["[]", '[1,"two",null,true]', "[null,null,[null]]", "[[[]]]"] },
        {
          name: "Objects",
          input: ["objects"],
          expected: ["{}", '{"a":1,"b":"x"}', '{"c":null}', '{"nested":{"list":[1,{"deep":true}]}}', '{"key with space":1}'],
        },
        { name: "Top-level undefined", input: ["topLevel"], expected: ["<undefined>", "<undefined>"] },
      ],
    },
  },
  {
    slug: "undo-redo-manager",
    title: "Undo/Redo Manager",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Two stacks: a new value pushes the old one onto undo and clears redo; undo and redo move values between them.",
    prompt: [
      "Write a class `UndoRedo` that tracks a single value's history:",
      "",
      "- `new UndoRedo(initial)` starts with `initial` as the current value.",
      "- `set(value)` makes `value` current and discards any redo history.",
      "- `undo()` restores the previous value and returns it, or returns `null` and changes nothing when there is nothing to undo.",
      "- `redo()` re-applies the most recently undone value and returns it, or `null` when there is nothing to redo.",
      "- `value()`, `canUndo()`, `canRedo()` report the state.",
      "",
      "```js",
      "const history = new UndoRedo(\"a\");",
      "history.set(\"b\"); history.set(\"c\");",
      "history.undo();   // \"b\"",
      "history.redo();   // \"c\"",
      "history.undo(); history.set(\"d\");",
      "history.canRedo();   // false — the set cleared it",
      "```",
    ].join("\n"),
    hints: [
      "Keep `current`, an `undo` stack of past values and a `redo` stack of undone ones.",
      "`set` pushes the current value onto undo and empties redo; `undo` pushes current onto redo and pops undo; `redo` is the mirror image.",
    ],
    solution: [
      "## Approach",
      "",
      "Three fields: the current value and two arrays. Every operation moves at most one value between them, so each is O(1). Clearing the redo stack on `set` is what keeps the history a straight line rather than a tree.",
      "",
      "## Worth saying out loud",
      "",
      "- A bounded history (drop the oldest undo entry past N) and a `clear()` are the usual follow-ups.",
      "- For large documents, store diffs or immutable snapshots rather than copies; the stack logic stays identical.",
    ].join("\n"),
    judge: {
      starterCode: `class UndoRedo {
  constructor(initial) {
    // Your state here
  }

  set(value) {}

  undo() {
    return null;
  }

  redo() {
    return null;
  }

  value() {
    return null;
  }

  canUndo() {
    return false;
  }

  canRedo() {
    return false;
  }
}
`,
      solutionCode: `class UndoRedo {
  constructor(initial) {
    this.current = initial;
    this.past = [];
    this.future = [];
  }

  set(value) {
    this.past.push(this.current);
    this.current = value;
    this.future = []; // a new branch of history makes the old redo path unreachable
  }

  undo() {
    if (this.past.length === 0) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    return this.current;
  }

  redo() {
    if (this.future.length === 0) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    return this.current;
  }

  value() {
    return this.current;
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("UndoRedo"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["UndoRedo", "set", "set", "undo", "redo", "undo", "set", "canRedo", "value"],
            [["a"], ["b"], ["c"], [], [], [], ["d"], [], []],
          ],
          expected: [null, null, null, "b", "c", "b", null, false, "d"],
        },
        {
          name: "Nothing to undo or redo",
          input: [
            ["UndoRedo", "undo", "redo", "canUndo", "canRedo", "value"],
            [[1], [], [], [], [], []],
          ],
          expected: [null, null, null, false, false, 1],
        },
        {
          name: "Undo all the way back, then redo all the way forward",
          input: [
            ["UndoRedo", "set", "set", "undo", "undo", "undo", "redo", "redo", "redo", "value"],
            [[0], [1], [2], [], [], [], [], [], [], []],
          ],
          expected: [null, null, null, 1, 0, null, 1, 2, null, 2],
        },
      ],
    },
  },
];
