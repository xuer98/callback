import type { Problem } from "./types";
import { virtualClock } from "./seed-apple-js-clock";

// Apple front-end bank, part C: creating and consuming a promise, and
// inheritance written without \`class\`. promiseAll and withTimeout are in
// seed-apple-js-j.ts. TypeScript variants live in seed-typescript-apple.ts.

export const appleJsProblemsC: Problem[] = [
  {
    slug: "promise-basics",
    title: "Create and Consume a Promise",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "A promise that settles after a second, rejecting with an Error — then consumed with await and try/catch.",
    prompt: [
      "Write a function that returns a promise, and code that uses it.",
      "",
      "- `fetchData(success = true)` returns a promise that settles **1,000 ms** after the call. It resolves with `\"Data fetched successfully!\"`, or rejects with `new Error(\"Failed to fetch data.\")` when `success` is false.",
      "- `getData(success)` awaits `fetchData(success)` inside `try`/`catch`. It returns the value, or the error's `message` when it fails, so the grader can read what a `console.log` would have printed.",
      "",
      "Everything runs on a virtual clock, so the grader sees exactly when each promise settles.",
    ].join("\n"),
    hints: [
      "`fetchData` is a `new Promise` whose executor starts a 1,000 ms `setTimeout` and calls `resolve` or `reject` inside it. Reject with an `Error`, not a string, so callers get a stack and a `message`.",
      "`getData` is `try { return await fetchData(success); } catch (err) { return err.message; }` — the same consumption as `.then(...).catch(...)`.",
    ],
    solution: [
      "## Approach",
      "",
      "`fetchData` is the canonical executor: the timer is the async work, and the callback decides between `resolve` and `reject`. `getData` shows the same consumption as `.then(...).catch(...)`, written with `await`.",
      "",
      "## Worth saying out loud",
      "",
      "- **The states:** pending, then fulfilled or rejected — and settled is final. A second `resolve` or `reject` is ignored.",
      "- Every handler runs later, as a microtask, never synchronously — even on an already-settled promise.",
      "- Reject with `Error` objects, not strings: callers get a stack and a `message`, and `instanceof Error` checks work.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Settle 1,000 ms after the call: resolve "Data fetched successfully!",
 * or reject with new Error("Failed to fetch data.") when success is false.
 */
function fetchData(success = true) {
  // Your code here
  return Promise.resolve();
}

/** Await fetchData(success); return the value, or the error's message. */
async function getData(success) {
  // Your code here
}
`,
      solutionCode: `function fetchData(success = true) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) resolve("Data fetched successfully!");
      else reject(new Error("Failed to fetch data."));
    }, 1000);
  });
}

async function getData(success) {
  try {
    return await fetchData(success);
  } catch (err) {
    return err.message;
  }
}
`,
      entry: "__judgeBasics",
      driverCode: `${virtualClock}

async function __judgeBasics(kind, a) {
  var clock = __virtualClock();
  try {
    var out;
    if (kind === "fetchData") {
      out = await clock.run(function () { return fetchData(a); });
    } else if (kind === "fetchDataDefault") {
      out = await clock.run(function () { return fetchData(); });
    } else if (kind === "pendingAt") {
      var settled = false;
      var before = null;
      setTimeout(function () { before = settled ? "settled" : "pending"; }, a);
      out = await clock.run(function () {
        return fetchData(true).then(function (value) {
          settled = true;
          return value;
        });
      });
      out.before = before;
    } else if (kind === "getData") {
      out = await clock.run(function () { return getData(a); });
    } else {
      throw new Error("unknown case " + kind);
    }
    return out;
  } finally {
    clock.restore();
  }
}`,
      tests: [
        { name: "fetchData resolves after one second", input: ["fetchData", true], expected: { value: "Data fetched successfully!", at: 1000 } },
        { name: "fetchData(false) rejects with an Error", input: ["fetchData", false], expected: { error: "Failed to fetch data.", at: 1000, errorType: "Error" } },
        { name: "Still pending at 999 ms", input: ["pendingAt", 999], expected: { value: "Data fetched successfully!", at: 1000, before: "pending" } },
        { name: "success defaults to true", input: ["fetchDataDefault"], expected: { value: "Data fetched successfully!", at: 1000 } },
        { name: "getData returns the value", input: ["getData", true], expected: { value: "Data fetched successfully!", at: 1000 } },
        { name: "getData catches the failure", input: ["getData", false], expected: { value: "Failed to fetch data.", at: 1000 } },
      ],
    },
  },
  {
    slug: "inheritance-without-class",
    title: "Inheritance Without class",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "Explain the prototype chain, then rebuild a `class ... extends` pair from constructor functions, without the `new Parent()` trap.",
    prompt: [
      "Explain how inheritance works in JavaScript, then write this pair using functions only:",
      "",
      "```js",
      "class Polygon {",
      "  constructor(height, width) {",
      "    this.height = height;",
      "    this.width = width;",
      "  }",
      "  area() {",
      "    return this.height * this.width;",
      "  }",
      "}",
      "",
      "class Square extends Polygon {",
      "  constructor(side) {",
      "    super(side, side);",
      "  }",
      "  setSide(n) {",
      "    this.height = this.width = n;",
      "  }",
      "}",
      "```",
      "",
      "## Rules",
      "",
      "- `Polygon` and `Square` are constructor functions. The grader reads their source, so `class` syntax fails.",
      "- Fields live on instances, and methods live on prototypes, shared by every instance.",
      "- `Square.prototype` inherits from `Polygon.prototype`, `instanceof` works for both, and each prototype's `constructor` points back to its function.",
      "- `Square.prototype` carries no `height` or `width` of its own.",
    ].join("\n"),
    hints: [
      "`super(side, side)` becomes `Polygon.call(this, side, side)`: run the parent constructor against the new object.",
      "Link the prototypes with `Square.prototype = Object.create(Polygon.prototype)`, then put `Square.prototype.constructor = Square` back.",
      "Add `setSide` to `Square.prototype` after replacing it, or the new prototype will not have it.",
    ],
    solution: [
      "## Approach",
      "",
      "Property lookup walks the chain: `square` to `Square.prototype` to `Polygon.prototype` to `Object.prototype`, then gives `undefined`. `class` is syntax over this same chain. Rebuilding it takes three moves: call the parent constructor on `this` (the `super` call), make `Square.prototype` an object whose prototype is `Polygon.prototype`, and repair the `constructor` link that replacing the prototype lost.",
      "",
      "## Worth saying out loud",
      "",
      "- **Avoid `Square.prototype = new Polygon()`**, a common published answer. It runs the parent constructor with no arguments and leaves stray `height` and `width` properties, set to `undefined`, on the prototype.",
      "- `Object.setPrototypeOf(Square, Polygon)` also links the constructors, which `extends` does for static methods.",
      "- `class` adds guarantees the function version lacks. Calling a class without `new` throws, class bodies are strict, and methods are non-enumerable.",
      "- Prefer composition when behaviors vary independently. Inheritance ties the child to the parent's implementation.",
    ].join("\n"),
    judge: {
      starterCode: `/** A polygon with a height and a width; area() lives on the prototype. */
function Polygon(height, width) {
  // Your code here
}

/** A square is a Polygon with equal sides; setSide(n) changes both. */
function Square(side) {
  // Your code here
}
`,
      solutionCode: `function Polygon(height, width) {
  this.height = height;
  this.width = width;
}

Polygon.prototype.area = function () {
  return this.height * this.width;
};

function Square(side) {
  Polygon.call(this, side, side); // super(side, side)
}

Square.prototype = Object.create(Polygon.prototype); // inherit the methods
Square.prototype.constructor = Square; // repair the link

Square.prototype.setSide = function (n) {
  this.height = this.width = n;
};
`,
      entry: "__judgeInheritance",
      driverCode: `function __judgeInheritance(kind) {
  if (typeof Polygon !== "function" || typeof Square !== "function") {
    throw new Error("Define Polygon and Square as functions");
  }
  var own = function (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };
  var source = function (fn) {
    return Function.prototype.toString.call(fn);
  };
  if (kind === "polygonArea") return new Polygon(2, 3).area();
  if (kind === "polygonFields") {
    var p = new Polygon(2, 7);
    return [p.height, p.width];
  }
  if (kind === "squareArea") return new Square(4).area();
  if (kind === "setSide") {
    var s = new Square(4);
    s.setSide(5);
    return [s.height, s.width, s.area()];
  }
  if (kind === "instanceOf") {
    var q = new Square(2);
    return [q instanceof Square, q instanceof Polygon];
  }
  if (kind === "ownFields") return Object.keys(new Square(3)).sort();
  if (kind === "chain") return Object.getPrototypeOf(Square.prototype) === Polygon.prototype;
  if (kind === "constructorLink") {
    return [Square.prototype.constructor === Square, Polygon.prototype.constructor === Polygon];
  }
  if (kind === "noStrayFields") {
    return ["height", "width"].filter(function (key) { return own(Square.prototype, key); });
  }
  if (kind === "sharedMethods") {
    return new Square(1).area === new Polygon(1, 1).area && !own(new Square(1), "area");
  }
  if (kind === "squareOnly") return [typeof new Square(1).setSide, typeof new Polygon(1, 2).setSide];
  if (kind === "noClassSyntax") return [/^class\\b/.test(source(Polygon)), /^class\\b/.test(source(Square))];
  throw new Error("unknown case " + kind);
}`,
      tests: [
        { name: "A polygon computes its area", input: ["polygonArea"], expected: 6 },
        { name: "A polygon keeps its fields", input: ["polygonFields"], expected: [2, 7] },
        { name: "A square computes its area", input: ["squareArea"], expected: 16 },
        { name: "setSide updates both sides", input: ["setSide"], expected: [5, 5, 25] },
        { name: "A square is a Square and a Polygon", input: ["instanceOf"], expected: [true, true] },
        { name: "Instances own only their fields", input: ["ownFields"], expected: ["height", "width"] },
        { name: "Square.prototype inherits from Polygon.prototype", input: ["chain"], expected: true },
        { name: "The constructor links point back", input: ["constructorLink"], expected: [true, true] },
        { name: "No stray fields on Square.prototype", input: ["noStrayFields"], expected: [] },
        { name: "area is shared, not copied per instance", input: ["sharedMethods"], expected: true },
        { name: "Only squares get setSide", input: ["squareOnly"], expected: ["function", "undefined"] },
        { name: "Written without class syntax", input: ["noClassSyntax"], expected: [false, false] },
      ],
    },
  },
];
