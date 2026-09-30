import type { Problem } from "./types";

// Apple front-end bank, part H: Array.prototype.filter, reduce and concat
// rewrites. The TypeScript variants live in seed-typescript-splits.ts. Tests
// write an array hole as the string "<hole>", which the drivers turn into a
// real empty slot and back, so every case stays JSON.

const holeHelpers = `  var HOLE = "<hole>";
  function build(v) {
    if (Array.isArray(v)) {
      var out = new Array(v.length);
      for (var i = 0; i < v.length; i++) if (v[i] !== HOLE) out[i] = build(v[i]);
      return out;
    }
    if (v && typeof v === "object" && Array.isArray(v.spreadable)) {
      var like = { length: v.spreadable.length };
      for (var j = 0; j < v.spreadable.length; j++) like[j] = build(v.spreadable[j]);
      like[Symbol.isConcatSpreadable] = true;
      return like;
    }
    return v;
  }
  function render(v) {
    if (!Array.isArray(v)) return v;
    var out = [];
    for (var i = 0; i < v.length; i++) out.push(i in v ? render(v[i]) : HOLE);
    return out;
  }`;

const nativeGuard = `  var NATIVE_NAMES = ["map", "filter", "reduce", "concat"];
  function guarded(run) {
    var saved = {};
    var banned = function () {
      throw new Error("Write it yourself: the native map, filter, reduce and concat are off limits here");
    };
    for (var n = 0; n < NATIVE_NAMES.length; n++) {
      saved[NATIVE_NAMES[n]] = Array.prototype[NATIVE_NAMES[n]];
      Array.prototype[NATIVE_NAMES[n]] = banned;
    }
    try {
      return run();
    } finally {
      for (var m = 0; m < NATIVE_NAMES.length; m++) Array.prototype[NATIVE_NAMES[m]] = saved[NATIVE_NAMES[m]];
    }
  }
  function typeErrorOf(run) {
    try {
      guarded(run);
      return "no error";
    } catch (err) {
      return err instanceof TypeError ? "TypeError" : "threw " + (err && err.message);
    }
  }`;

export const appleJsProblemsH: Problem[] = [
  {
    slug: "implement-array-filter",
    title: "Implement Array.prototype.filter",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Skip holes, forward `thisArg`, and keep the elements whose callback is truthy.",
    prompt: [
      "Write `Array.prototype.myFilter(cb, thisArg)` so it matches the built-in `filter`. The grader disables the native `map`, `filter`, `reduce` and `concat` while your code runs.",
      "",
      "## Rules",
      "",
      "- Call `cb.call(thisArg, value, index, array)` for each element and keep the elements whose result is truthy. A callback that isn't a function throws `TypeError`.",
      "- **Skip holes**: never call back for them, and never copy them into the result.",
      "- Return a new array. Define the method with `function`, not an arrow, so `this` is the array.",
      "",
      "```",
      "[1, 2, 3, 4].myFilter((v) => v % 2 === 0)   // [2, 4]",
      "[1, , 2].myFilter(() => true)               // [1, 2]",
      "```",
      "",
      "Tests write a hole as `\"<hole>\"`; the grader turns it into a real empty slot and back. Callbacks are named in each test's input and supplied by the grader.",
    ].join("\n"),
    hints: [
      "`i in this` tells a hole from a stored `undefined` — skip the holes entirely.",
      "Unlike map, filter's output is shorter than its input, so push the kept elements instead of writing by index.",
    ],
    solution: [
      "## Approach",
      "",
      "Loop over `this`, skip indices that are holes (`i in this`), call the callback with `thisArg` as its `this`, and push the element when the result is truthy.",
      "",
      "## Worth saying out loud",
      "",
      "- **`filter` skips holes; `map` keeps them.** A stored `undefined` is not a hole and is passed to the callback.",
      "- The callback's result is only tested for truthiness — returning `1` keeps the element just like `true`.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Array.prototype.filter: skips holes, forwards thisArg. */
Array.prototype.myFilter = function (cb, thisArg) {
  // Your code here
  return [];
};
`,
      solutionCode: `Array.prototype.myFilter = function (cb, thisArg) {
  if (typeof cb !== "function") throw new TypeError(cb + " is not a function");
  const len = this.length;
  const out = [];
  for (let i = 0; i < len; i++) {
    if (!(i in this)) continue;
    const v = this[i];
    if (cb.call(thisArg, v, i, this)) out.push(v);
  }
  return out;
};
`,
      entry: "__judgeFilter",
      driverCode: `function __judgeFilter(kind, input, a, b) {
${holeHelpers}
${nativeGuard}
  var callbacks = {
    even: function (v) { return v % 2 === 0; },
    always: function () { return true; },
    aboveThis: function (v) { return v > this.min; },
    evenIndex: function (v, i) { return i % 2 === 0; },
  };
  if (kind === "throws") return typeErrorOf(function () { return build(input).myFilter(a); });
  var arr = build(input);
  return render(guarded(function () { return arr.myFilter(callbacks[a], b); }));
}`,
      tests: [
        { name: "filter keeps matches", input: ["filter", [1, 2, 3, 4], "even"], expected: [2, 4] },
        { name: "filter skips holes", input: ["filter", [1, "<hole>", 2], "always"], expected: [1, 2] },
        { name: "filter uses thisArg", input: ["filter", [1, 2, 3, 4], "aboveThis", { min: 2 }], expected: [3, 4] },
        { name: "filter passes the index", input: ["filter", ["a", "b", "c"], "evenIndex"], expected: ["a", "c"] },
        { name: "filter rejects a non-function", input: ["throws", [1], 42], expected: "TypeError" },
      ],
    },
  },
  {
    slug: "implement-array-reduce",
    title: "Implement Array.prototype.reduce",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "A missing initial value versus an `undefined` one — and the TypeError when there's nothing to reduce.",
    prompt: [
      "Write `Array.prototype.myReduce(cb, initial)` so it matches the built-in `reduce`. The grader disables the native `map`, `filter`, `reduce` and `concat` while your code runs.",
      "",
      "## Rules",
      "",
      "- Call `cb(accumulator, value, index, array)` for each element, **skipping holes**. A callback that isn't a function throws `TypeError`.",
      "- Use `initial` whenever that argument was passed, **even as `undefined`**. Otherwise start from the first element that exists and continue after it.",
      "- With no initial value and nothing to reduce, throw `TypeError`.",
      "- Define the method with `function`, not an arrow, so `this` is the array.",
      "",
      "```",
      "[1, 2, 3].myReduce((a, v) => a + v, 10)         // 16",
      "[1, 2].myReduce((a, v) => String(a) + v, undefined)   // \"undefined12\"",
      "```",
      "",
      "Tests write a hole as `\"<hole>\"`; the grader turns it into a real empty slot. Callbacks are named in each test's input and supplied by the grader.",
    ].join("\n"),
    hints: [
      "A default parameter can't carry the initial value, because `reduce(fn, undefined)` must count as supplied. Take `...rest` and check `rest.length`.",
      "Without an initial value, skip leading holes to find the first real element; if there is none, throw `TypeError`.",
    ],
    solution: [
      "## Approach",
      "",
      "Decide between the two starting states with `rest.length`, because a default parameter cannot tell `reduce(fn)` from `reduce(fn, undefined)`. With an initial value, start at index 0; without one, skip leading holes, take the first real element as the accumulator and start after it — or throw when there is none. Then fold, skipping holes.",
      "",
      "## Worth saying out loud",
      "",
      "- **`reduce` takes `...rest`, not a default parameter.** `reduce(fn, undefined)` is a supplied initial value.",
      "- A single element with no initial value is returned without calling the callback at all.",
      "- `reduceRight` is the same loop walking backwards.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Array.prototype.reduce: an initial value counts whenever it is passed. */
Array.prototype.myReduce = function (cb, ...rest) {
  // Your code here
  return undefined;
};
`,
      solutionCode: `// ...rest, not a default parameter: reduce(fn, undefined) supplies a value.
Array.prototype.myReduce = function (cb, ...rest) {
  if (typeof cb !== "function") throw new TypeError(cb + " is not a function");
  const len = this.length;
  let i = 0;
  let acc;
  if (rest.length > 0) {
    acc = rest[0];
  } else {
    while (i < len && !(i in this)) i++;
    if (i >= len) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[i++];
  }
  for (; i < len; i++) {
    if (i in this) acc = cb(acc, this[i], i, this);
  }
  return acc;
};
`,
      entry: "__judgeReduce",
      driverCode: `function __judgeReduce(kind, input, a, b) {
${holeHelpers}
${nativeGuard}
  var callbacks = {
    sum: function (acc, v) { return acc + v; },
    joinText: function (acc, v) { return String(acc) + v; },
    indexTrail: function (acc, v, i) { return acc + "," + i; },
    mustNotRun: function () { throw new Error("the callback should not run"); },
  };
  function args(cb, initial) {
    if (initial && initial.none) return [cb];
    if (initial && initial.undefined) return [cb, undefined];
    return [cb, initial.value];
  }
  var arr = build(input);
  if (kind === "throws") {
    var cb = a === "notAFunction" ? null : callbacks[a];
    return typeErrorOf(function () { return arr.myReduce.apply(arr, args(cb, b)); });
  }
  return guarded(function () { return arr.myReduce.apply(arr, args(callbacks[a], b)); });
}`,
      tests: [
        { name: "reduce with an initial value", input: ["reduce", [1, 2, 3], "sum", { value: 10 }], expected: 16 },
        { name: "reduce starts from the first element", input: ["reduce", [1, 2, 3], "sum", { none: true }], expected: 6 },
        { name: "An explicit undefined is an initial value", input: ["reduce", [1, 2], "joinText", { undefined: true }], expected: "undefined12" },
        { name: "reduce skips leading holes", input: ["reduce", ["<hole>", 2, 3], "sum", { none: true }], expected: 5 },
        { name: "reduce passes the index", input: ["reduce", [9, 9, 9], "indexTrail", { value: "i" }], expected: "i,0,1,2" },
        { name: "Without an initial value, reduce starts at index 1", input: ["reduce", [9, 9, 9], "indexTrail", { none: true }], expected: "9,1,2" },
        { name: "A lone element is returned without a call", input: ["reduce", [7], "mustNotRun", { none: true }], expected: 7 },
        { name: "Empty with no initial value throws TypeError", input: ["throws", [], "sum", { none: true }], expected: "TypeError" },
        { name: "reduce rejects a non-function", input: ["throws", [1], "notAFunction", { value: 0 }], expected: "TypeError" },
      ],
    },
  },
  {
    slug: "implement-array-concat",
    title: "Implement Array.prototype.concat",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Spread arrays and `isConcatSpreadable` objects one level, keep holes, append everything else.",
    prompt: [
      "Write `Array.prototype.myConcat(...items)` so it matches the built-in `concat`. The grader disables the native `map`, `filter`, `reduce` and `concat` while your code runs.",
      "",
      "## Rules",
      "",
      "- Start from `this`, then each item in order. Spread arrays **one level**, plus objects whose `Symbol.isConcatSpreadable` is true, keeping their holes.",
      "- Every other value is appended as it is — strings and plain objects included.",
      "- Always return a new array, even with no arguments. Define the method with `function`, not an arrow.",
      "",
      "```",
      "[1].myConcat([2, [3]], 4)      // [1, 2, [3], 4]",
      "[1].myConcat(\"ab\", { a: 1 })  // [1, \"ab\", { a: 1 }]",
      "```",
      "",
      "Tests write a hole as `\"<hole>\"`; the grader turns it into a real empty slot and back. An input written `{ spreadable: [...] }` becomes an array-like object with `Symbol.isConcatSpreadable` set.",
    ].join("\n"),
    hints: [
      "Walk `[this, ...items]`. Spread a value when it is an object whose `Symbol.isConcatSpreadable` is true, or, when that is undefined, when it is an array.",
      "Write by index with your own counter, skipping holes, and set `out.length` at the end so trailing holes survive.",
    ],
    solution: [
      "## Approach",
      "",
      "Walk `this` followed by the items. A value is spread when it is an object whose `Symbol.isConcatSpreadable` is true — or, when that property is undefined, when it is an array. Spread values are copied index by index with a running counter, skipping holes so they stay holes; everything else is appended as a single element. Fixing `length` at the end is what keeps a trailing hole.",
      "",
      "## Worth saying out loud",
      "",
      "- **`concat` spreads one level only**, and only arrays or objects marked with `Symbol.isConcatSpreadable`. A string is never spread.",
      "- `concat` is the one of these methods that reads its *arguments* as arrays; that is why a nested array survives one level down.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Array.prototype.concat: spreads arrays one level. */
Array.prototype.myConcat = function (...items) {
  // Your code here
  return [];
};
`,
      solutionCode: `Array.prototype.myConcat = function (...items) {
  const out = [];
  let n = 0;
  for (const item of [this, ...items]) {
    const spreadable =
      item !== null &&
      typeof item === "object" &&
      (item[Symbol.isConcatSpreadable] ?? Array.isArray(item));
    if (spreadable) {
      for (let i = 0; i < item.length; i++, n++) {
        if (i in item) out[n] = item[i];
      }
    } else {
      out[n++] = item;
    }
  }
  out.length = n; // keeps a trailing hole
  return out;
};
`,
      entry: "__judgeConcat",
      driverCode: `function __judgeConcat(kind, input, items) {
${holeHelpers}
${nativeGuard}
  var arr = build(input);
  if (kind === "fresh") return guarded(function () { return arr.myConcat(); }) !== arr;
  var args = [];
  for (var k = 0; k < items.length; k++) args.push(build(items[k]));
  return render(guarded(function () { return arr.myConcat.apply(arr, args); }));
}`,
      tests: [
        { name: "concat spreads one level", input: ["concat", [1], [[2, [3]], 4]], expected: [1, 2, [3], 4] },
        { name: "concat keeps holes", input: ["concat", [1, "<hole>"], [[2, "<hole>"]]], expected: [1, "<hole>", 2, "<hole>"] },
        { name: "concat spreads isConcatSpreadable objects", input: ["concat", [1], [{ spreadable: [2, 3] }]], expected: [1, 2, 3] },
        { name: "concat leaves strings and objects whole", input: ["concat", [1], ["ab", { a: 1 }]], expected: [1, "ab", { a: 1 }] },
        { name: "concat with no arguments copies", input: ["fresh", [1, 2], []], expected: true },
      ],
    },
  },
];
