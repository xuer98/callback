import type { Problem } from "./types";

// Apple front-end bank, part A: built-in rewrites — Array.prototype.flat and
// Array.prototype.map (filter, reduce and concat are in seed-apple-js-h.ts).
// JavaScript judges here; the TypeScript variants live in
// seed-typescript-apple.ts. Tests write an array hole as
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

export const appleJsProblemsA: Problem[] = [
  {
    slug: "implement-array-flat",
    title: "Implement Array.prototype.flat",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Depth, holes and `Infinity` — without recursion, so 100,000 levels can't overflow the stack.",
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
      "- Don't recurse. The last test nests 100,000 levels deep and flattens with `Infinity`; a recursive walk overflows the call stack there, so that case only passes with an explicit stack.",
      "",
      "Tests write a hole as the string `\"<hole>\"`. The grader turns it into a real empty slot before calling you, and back into `\"<hole>\"` when it reads your result.",
    ].join("\n"),
    hints: [
      "Walk with an index loop and use `i in arr` to skip holes. An element that is an array, with depth left, is walked with `depth - 1`; everything else is pushed.",
      "To drop the recursion, keep a stack of `[value, depth]` pairs. Push children in reverse so popping yields them in order.",
      "`Infinity - 1` is still `Infinity`, so the same code handles \"flatten everything\".",
    ],
    solution: [
      "## Approach",
      "",
      "The recursive version is the natural first draft:",
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
      "- `Infinity` is a legal depth. It is also how you would write a fully flattening `flatten(value)`.",
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
    slug: "implement-array-map",
    title: "Implement Array.prototype.map",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Pre-size the output so holes stay holes, and forward `thisArg`.",
    prompt: [
      "Write `Array.prototype.myMap(cb, thisArg)` so it matches the built-in `map`. The grader disables the native `map`, `filter`, `reduce` and `concat` while your code runs.",
      "",
      "## Rules",
      "",
      "- Call `cb.call(thisArg, value, index, array)` for each element. A callback that isn't a function throws `TypeError`.",
      "- Return a new array of the same length that **keeps holes**, never calling back for them.",
      "- Define the method with `function`, not an arrow, so `this` is the array.",
      "",
      "```",
      "[1, 2, 3].myMap((v) => v * 2)        // [2, 4, 6]",
      "[1, , 3].myMap((v) => v * 2)         // [2, <hole>, 6]",
      "```",
      "",
      "Tests write a hole as `\"<hole>\"`; the grader turns it into a real empty slot and back. Callbacks are named in each test's input and supplied by the grader.",
    ].join("\n"),
    hints: [
      "`i in this` tells a hole from a stored `undefined`.",
      "Pre-size the output with `new Array(len)` and write only the indices you visit, so holes stay holes.",
    ],
    solution: [
      "## Approach",
      "",
      "A loop over `this` with `i in this` doing the hole handling. Pre-size the result with `new Array(len)` and assign by index, so an index you skip stays a hole, and call the callback with `thisArg` as its `this`.",
      "",
      "## Worth saying out loud",
      "",
      "- **`map` keeps holes; `filter` and `reduce` skip them.** That is why `map` pre-sizes its output and the others push.",
      "- Define the polyfill with `function` and never an arrow, so that `this` is the array.",
      "- Real polyfills also handle array-likes through `Object(this)` and `ToLength`. Mention it rather than write it.",
    ].join("\n"),
    judge: {
      starterCode: `/** Like Array.prototype.map: keeps holes, forwards thisArg. */
Array.prototype.myMap = function (cb, thisArg) {
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
`,
      entry: "__judgeMap",
      driverCode: `function __judgeMap(kind, input, a, b) {
${holeHelpers}
${nativeGuard}
  var calls = 0;
  var callbacks = {
    double: function (v) { calls++; return v * 2; },
    indexPlusLength: function (v, i, arr) { calls++; return i + arr.length; },
    plusThis: function (v) { calls++; return this.k + v; },
  };
  if (kind === "throws") return typeErrorOf(function () { return build(input).myMap(a); });
  var arr = build(input);
  var out = guarded(function () { return arr.myMap(callbacks[a], b); });
  return kind === "calls" ? calls : render(out);
}`,
      tests: [
        { name: "map doubles", input: ["map", [1, 2, 3], "double"], expected: [2, 4, 6] },
        { name: "map passes the index and the array", input: ["map", [5, 6, 7], "indexPlusLength"], expected: [3, 4, 5] },
        { name: "map uses thisArg", input: ["map", [1, 2], "plusThis", { k: 10 }], expected: [11, 12] },
        { name: "map keeps holes", input: ["map", [1, "<hole>", 3], "double"], expected: [2, "<hole>", 6] },
        { name: "map never calls back for a hole", input: ["calls", [1, "<hole>", "<hole>", 4], "double"], expected: 2 },
        { name: "map rejects a non-function", input: ["throws", [1], null], expected: "TypeError" },
      ],
    },
  },
];
