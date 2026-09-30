import type { Problem } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), part A: the
// two built-in rewrites that recur across the most reports — Array.prototype
// .flat and map/filter/reduce/concat. JavaScript judges here; the TypeScript
// variants live in seed-typescript-apple.ts. Tests write an array hole as
// the string "<hole>", which the drivers turn into a real empty slot and
// back, so every case stays JSON.

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

export const appleJsProblemsA: Problem[] = [
  {
    slug: "implement-array-flat",
    title: "Implement Array.prototype.flat",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Depth, holes and `Infinity`, then the follow-up that always comes: do it without recursion.",
    prompt: [
      "Implement `Array.prototype.myFlat(depth = 1)` so it behaves like the built-in `flat`, without calling `flat` or `flatMap`. The grader swaps both out while your code runs.",
      "",
      "```",
      "[1, [2], [3, [4]]].myFlat()           // [1, 2, 3, [4]]",
      "[1, [2], [3, [4]]].myFlat(2)          // [1, 2, 3, 4]",
      "[1, [2, [3, [4]]]].myFlat(Infinity)   // [1, 2, 3, 4]",
      "```",
      "",
      "## Rules",
      "",
      "- Only real arrays are flattened (`Array.isArray`). Strings, plain objects and array-likes are elements like any other.",
      "- `depth` defaults to 1 and `Infinity` is valid. A depth of 0 or less copies one level without flattening anything.",
      "- Holes (`[1, , 3]`) are skipped at every level the method walks, the top level included, even at depth 0. A nested array past the depth is kept as it is, holes and all.",
      "- Return a new array and leave the input alone. Define the method with `function`, not an arrow, so `this` is the array.",
      "",
      "## Follow-up",
      "",
      "The usual next question is \"now without recursion\". The last test nests 100,000 levels deep and flattens with `Infinity`. A recursive walk overflows the call stack there, so that case only passes with an explicit stack.",
      "",
      "Tests write a hole as the string `\"<hole>\"`. The grader turns it into a real empty slot before calling you, and back into `\"<hole>\"` when it reads your result.",
      "",
      "*Reported in: Glassdoor (UI Engineer, Aug 2020; Nov 2021), BFE.dev's Apple tag and GreatFrontEnd's Apple list. It is one of the three prompts that recur across the most independent reports.*",
    ].join("\n"),
    hints: [
      "Walk with an index loop and use `i in arr` to skip holes. An element that is an array, with depth left, is walked with `depth - 1`; everything else is pushed.",
      "To drop the recursion, keep a stack of `[value, depth]` pairs. Push children in reverse so popping yields them in order.",
      "`Infinity - 1` is still `Infinity`, so the same code handles \"flatten everything\".",
    ],
    solution: [
      "## Approach",
      "",
      "The recursive version comes first, and it is what most candidates write in the first five minutes:",
      "",
      "```js",
      "Array.prototype.myFlat = function (depth = 1) {",
      "  const out = [];",
      "  const walk = (arr, d) => {",
      "    for (let i = 0; i < arr.length; i++) {",
      "      if (!(i in arr)) continue; // skip holes, as the native does",
      "      const v = arr[i];",
      "      if (Array.isArray(v) && d > 0) walk(v, d - 1);",
      "      else out.push(v);",
      "    }",
      "  };",
      "  walk(this, depth);",
      "  return out;",
      "};",
      "```",
      "",
      "Every nesting level costs a stack frame, so `Infinity` on very deep input throws `RangeError`. The reference replaces the call stack with an array of `[value, depth]` pairs. It pushes children in reverse so they pop in their original order.",
      "",
      "## Worth saying out loud",
      "",
      "- **`flat` skips holes**: `[1, , 3].flat()` is `[1, 3]`, and so is `flat(0)`. That is why depth 0 is not simply `slice`.",
      "- `Infinity` is a legal depth. It is also how you would write the fully flattening `flatten(value)` that GreatFrontEnd lists.",
      "- `out.push(...flatten(item))` looks tidy, but it passes every element as an argument and throws on a very large sub-array. Push in a loop.",
      "- Assigning to `Array.prototype` creates an enumerable property that shows up in `for...in` over arrays. `Object.defineProperty` keeps it non-enumerable, like the built-ins.",
      "- In real code, don't extend built-in prototypes. The standard method is called `flat` rather than `flatten` because an old library had already put a `flatten` on `Array.prototype`.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Flatten this array up to \`depth\` levels, like the native flat.
 * Don't call flat or flatMap.
 * @param {number} [depth=1]
 * @returns {Array}
 */
Array.prototype.myFlat = function (depth = 1) {
  // Your code here
  return [];
};
`,
      solutionCode: `// Iterative, so 100,000 levels of nesting can't overflow the call stack.
Array.prototype.myFlat = function (depth = 1) {
  const out = [];
  const stack = [];
  // Push in reverse so the first element is popped first.
  for (let i = this.length - 1; i >= 0; i--) {
    if (i in this) stack.push([this[i], depth]); // skip holes, as the native does
  }
  while (stack.length > 0) {
    const [value, d] = stack.pop();
    if (Array.isArray(value) && d > 0) {
      for (let i = value.length - 1; i >= 0; i--) {
        if (i in value) stack.push([value[i], d - 1]);
      }
    } else {
      out.push(value);
    }
  }
  return out;
};
`,
      entry: "__judgeFlat",
      driverCode: `function __judgeFlat(kind, input, depth) {
${holeHelpers}
  if (typeof Array.prototype.myFlat !== "function") {
    throw new Error("Array.prototype.myFlat is not defined");
  }
  var native = { flat: Array.prototype.flat, flatMap: Array.prototype.flatMap };
  var banned = function () {
    throw new Error("Build it yourself: the native flat and flatMap are off limits here");
  };
  function call(arr, d) {
    Array.prototype.flat = banned;
    Array.prototype.flatMap = banned;
    try {
      if (d === "default") return arr.myFlat();
      return arr.myFlat(d === "Infinity" ? Infinity : d);
    } finally {
      Array.prototype.flat = native.flat;
      Array.prototype.flatMap = native.flatMap;
    }
  }
  if (kind === "flat") return render(call(build(input), depth));
  if (kind === "unchanged") {
    var arr = build(input);
    var before = JSON.stringify(render(arr));
    call(arr, depth);
    return JSON.stringify(render(arr)) === before;
  }
  if (kind === "fresh") {
    var source = build(input);
    return call(source, depth) !== source;
  }
  if (kind === "deep") {
    var nested = [1];
    for (var k = 0; k < input; k++) nested = [nested];
    return call(nested, depth);
  }
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "Depth defaults to 1", input: ["flat", [1, [2], [3, [4]]], "default"], expected: [1, 2, 3, [4]] },
        { name: "Depth 2", input: ["flat", [1, [2], [3, [4]]], 2], expected: [1, 2, 3, 4] },
        { name: "Infinity flattens every level", input: ["flat", [1, [2, [3, [4, [5]]]]], "Infinity"], expected: [1, 2, 3, 4, 5] },
        { name: "Depth 0 copies one level", input: ["flat", [1, [2, [3]]], 0], expected: [1, [2, [3]]] },
        { name: "A negative depth acts like 0", input: ["flat", [[1], 2], -1], expected: [[1], 2] },
        { name: "Holes are dropped where it flattens", input: ["flat", [1, "<hole>", [2, "<hole>", 3]], 1], expected: [1, 2, 3] },
        { name: "Even depth 0 drops top-level holes", input: ["flat", [1, "<hole>", 3], 0], expected: [1, 3] },
        { name: "Holes past the depth stay", input: ["flat", [[1, [2, "<hole>", 3]]], 1], expected: [1, [2, "<hole>", 3]] },
        { name: "Empty arrays disappear", input: ["flat", [[], [[]], 1], 1], expected: [[], 1] },
        { name: "Strings and objects are not flattened", input: ["flat", ["ab", { "0": "x", length: 1 }, [["c"]]], 1], expected: ["ab", { "0": "x", length: 1 }, ["c"]] },
        { name: "null elements are kept", input: ["flat", [null, [null, [null]]], "Infinity"], expected: [null, null, null] },
        { name: "The input is left alone", input: ["unchanged", [1, [2, [3, "<hole>"]]], "Infinity"], expected: true },
        { name: "Returns a new array", input: ["fresh", [1, 2], 0], expected: true },
        { name: "100,000 levels deep, no recursion", input: ["deep", 100000, "Infinity"], expected: [1] },
      ],
    },
  },
  {
    slug: "array-method-polyfills",
    title: "map, filter, reduce, and concat From Scratch",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Holes, `thisArg`, a missing versus an `undefined` initial value, and why `concat` spreads one level.",
    prompt: [
      "Implement array prototype methods yourself, \"like flat, map, reduce, concat\", as a Glassdoor report put it. Write `myMap`, `myFilter`, `myReduce` and `myConcat` on `Array.prototype` so they match the built-ins. The grader disables the native four while your code runs.",
      "",
      "## Rules",
      "",
      "- `myMap(cb, thisArg)` and `myFilter(cb, thisArg)` call `cb.call(thisArg, value, index, array)`. A callback that isn't a function throws `TypeError`.",
      "- `myMap` returns an array of the same length and **keeps holes**, never calling back for them. `myFilter` and `myReduce` skip holes.",
      "- `myReduce(cb, initial)` uses `initial` whenever that argument was passed, even as `undefined`. Otherwise it starts from the first element that exists. With no initial value and nothing to reduce, it throws `TypeError`.",
      "- `myConcat(...items)` spreads arrays one level, plus objects whose `Symbol.isConcatSpreadable` is true, keeping their holes. Every other value is appended as it is, strings included. It always returns a new array.",
      "",
      "Tests write a hole as `\"<hole>\"`, as in the flat question. Callbacks are named in each test's input and supplied by the grader.",
      "",
      "*Reported in: Glassdoor (Nov 2021) and GreatFrontEnd's Apple list. Pair it with [Implement Array.prototype.flat](/problems/implement-array-flat).*",
    ].join("\n"),
    hints: [
      "`i in this` tells a hole from a stored `undefined`. `myMap` pre-sizes its output with `new Array(len)` and writes only the indices it visits, so holes stay holes.",
      "A default parameter can't carry the initial value, because `reduce(fn, undefined)` must count as supplied. Take `...rest` and check `rest.length`.",
      "For `myConcat`, walk `[this, ...items]`. Spread a value when it is an object whose `Symbol.isConcatSpreadable` is true, or, when that is undefined, when it is an array. Set `out.length` at the end so trailing holes survive.",
    ],
    solution: [
      "## Approach",
      "",
      "All four are loops over `this`, with `i in this` doing the hole handling. `myMap` pre-sizes its result and assigns by index, so holes stay holes. `myFilter` and `myReduce` skip holes and build their output as they go. `myReduce` decides between the two starting states with `rest.length`, because a default parameter cannot tell `reduce(fn)` from `reduce(fn, undefined)`. `myConcat` writes by index with its own counter and fixes `length` at the end, which is what keeps a trailing hole.",
      "",
      "## Worth saying out loud",
      "",
      "- **`map` keeps holes; `filter` and `reduce` skip them.** That is why `map` pre-sizes its output and the others push.",
      "- **`reduce` takes `...rest`, not a default parameter.** `reduce(fn, undefined)` is a supplied initial value.",
      "- **`concat` spreads one level only**, and only arrays or objects marked with `Symbol.isConcatSpreadable`. A string is never spread.",
      "- Define each polyfill with `function` and never an arrow, so that `this` is the array.",
      "- Real polyfills also handle array-likes through `Object(this)` and `ToLength`. Mention it rather than write it.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Array.prototype.map: keeps holes, forwards thisArg. */
Array.prototype.myMap = function (cb, thisArg) {
  // Your code here
  return [];
};

/** Like Array.prototype.filter: skips holes. */
Array.prototype.myFilter = function (cb, thisArg) {
  // Your code here
  return [];
};

/** Like Array.prototype.reduce: an initial value counts whenever it is passed. */
Array.prototype.myReduce = function (cb, ...rest) {
  // Your code here
  return undefined;
};

/** Like Array.prototype.concat: spreads arrays one level. */
Array.prototype.myConcat = function (...items) {
  // Your code here
  return [];
};
`,
      solutionCode: `Array.prototype.myMap = function (cb, thisArg) {
  if (typeof cb !== "function") throw new TypeError(cb + " is not a function");
  const len = this.length;
  const out = new Array(len); // pre-sized, so holes stay holes
  for (let i = 0; i < len; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this);
  }
  return out;
};

Array.prototype.myFilter = function (cb, thisArg) {
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

// ...rest, not a default parameter: reduce(fn, undefined) supplies a value.
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

Array.prototype.myConcat = function (...items) {
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
      entry: "__judgeArrayMethods",
      driverCode: `function __judgeArrayMethods(kind, input, a, b) {
${holeHelpers}
  var calls = 0;
  var callbacks = {
    double: function (v) { calls++; return v * 2; },
    indexPlusLength: function (v, i, arr) { calls++; return i + arr.length; },
    plusThis: function (v) { calls++; return this.k + v; },
    even: function (v) { calls++; return v % 2 === 0; },
    always: function () { calls++; return true; },
    sum: function (acc, v) { calls++; return acc + v; },
    joinText: function (acc, v) { calls++; return String(acc) + v; },
    indexTrail: function (acc, v, i) { calls++; return acc + "," + i; },
    mustNotRun: function () { calls++; throw new Error("the callback should not run"); },
  };
  var names = ["map", "filter", "reduce", "concat"];
  function guarded(run) {
    var saved = {};
    var banned = function () {
      throw new Error("Write it yourself: the native map, filter, reduce and concat are off limits here");
    };
    for (var n = 0; n < names.length; n++) {
      saved[names[n]] = Array.prototype[names[n]];
      Array.prototype[names[n]] = banned;
    }
    try {
      return run();
    } finally {
      for (var m = 0; m < names.length; m++) Array.prototype[names[m]] = saved[names[m]];
    }
  }
  function reduceArgs(cb, initial) {
    if (initial && initial.none) return [cb];
    if (initial && initial.undefined) return [cb, undefined];
    return [cb, initial.value];
  }
  var arr = build(input);
  if (kind === "map") return render(guarded(function () { return arr.myMap(callbacks[a], b); }));
  if (kind === "mapCalls") {
    guarded(function () { return arr.myMap(callbacks[a]); });
    return calls;
  }
  if (kind === "filter") return render(guarded(function () { return arr.myFilter(callbacks[a], b); }));
  if (kind === "reduce") {
    return guarded(function () { return arr.myReduce.apply(arr, reduceArgs(callbacks[a], b)); });
  }
  if (kind === "throws") {
    var target = build(a);
    try {
      guarded(function () {
        if (input === "myReduce") return target.myReduce.apply(target, reduceArgs(callbacks.sum, b));
        return target[input](b);
      });
      return "no error";
    } catch (err) {
      return err instanceof TypeError ? "TypeError" : "threw " + (err && err.message);
    }
  }
  if (kind === "concat") {
    var args = [];
    for (var k = 0; k < a.length; k++) args.push(build(a[k]));
    return render(guarded(function () { return arr.myConcat.apply(arr, args); }));
  }
  if (kind === "concatFresh") return guarded(function () { return arr.myConcat(); }) !== arr;
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "map doubles", input: ["map", [1, 2, 3], "double"], expected: [2, 4, 6] },
        { name: "map passes the index and the array", input: ["map", [5, 6, 7], "indexPlusLength"], expected: [3, 4, 5] },
        { name: "map uses thisArg", input: ["map", [1, 2], "plusThis", { k: 10 }], expected: [11, 12] },
        { name: "map keeps holes", input: ["map", [1, "<hole>", 3], "double"], expected: [2, "<hole>", 6] },
        { name: "map never calls back for a hole", input: ["mapCalls", [1, "<hole>", "<hole>", 4], "double"], expected: 2 },
        { name: "filter keeps matches", input: ["filter", [1, 2, 3, 4], "even"], expected: [2, 4] },
        { name: "filter skips holes", input: ["filter", [1, "<hole>", 2], "always"], expected: [1, 2] },
        { name: "reduce with an initial value", input: ["reduce", [1, 2, 3], "sum", { value: 10 }], expected: 16 },
        { name: "reduce starts from the first element", input: ["reduce", [1, 2, 3], "sum", { none: true }], expected: 6 },
        { name: "An explicit undefined is an initial value", input: ["reduce", [1, 2], "joinText", { undefined: true }], expected: "undefined12" },
        { name: "reduce skips leading holes", input: ["reduce", ["<hole>", 2, 3], "sum", { none: true }], expected: 5 },
        { name: "reduce passes the index", input: ["reduce", [9, 9, 9], "indexTrail", { value: "i" }], expected: "i,0,1,2" },
        { name: "Without an initial value, reduce starts at index 1", input: ["reduce", [9, 9, 9], "indexTrail", { none: true }], expected: "9,1,2" },
        { name: "A lone element is returned without a call", input: ["reduce", [7], "mustNotRun", { none: true }], expected: 7 },
        { name: "Empty with no initial value throws TypeError", input: ["throws", "myReduce", [], { none: true }], expected: "TypeError" },
        { name: "map rejects a non-function", input: ["throws", "myMap", [1], null], expected: "TypeError" },
        { name: "filter rejects a non-function", input: ["throws", "myFilter", [1], 42], expected: "TypeError" },
        { name: "concat spreads one level", input: ["concat", [1], [[2, [3]], 4]], expected: [1, 2, [3], 4] },
        { name: "concat keeps holes", input: ["concat", [1, "<hole>"], [[2, "<hole>"]]], expected: [1, "<hole>", 2, "<hole>"] },
        { name: "concat spreads isConcatSpreadable objects", input: ["concat", [1], [{ spreadable: [2, 3] }]], expected: [1, 2, 3] },
        { name: "concat leaves strings and objects whole", input: ["concat", [1], ["ab", { a: 1 }]], expected: [1, "ab", { a: 1 }] },
        { name: "concat with no arguments copies", input: ["concatFresh", [1, 2]], expected: true },
      ],
    },
  },
];
