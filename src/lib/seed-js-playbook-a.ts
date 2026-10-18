import type { Problem } from "./types";

// The JavaScript-coding track, part A: how to run the round as a discussion
// question, then two closure classics the bank lacked — Function.prototype.bind
// and classNames — each judged in the browser.

export const jsPlaybookProblemsA: Problem[] = [
  {
    slug: "js-question-approach",
    title: "How Do You Approach a JavaScript Coding Question?",
    category: "frontend",
    difficulty: "medium",
    companies: [],
    summary:
      "Clarify the runtime and the edges, say which spec cases you are skipping, then dodge the one bug each classic is known for.",
    prompt: [
      "You are handed a JavaScript coding question — implement `debounce`, say, or `Promise.all`, or `cloneDeep` — with thirty-five minutes on the clock. Walk through how you run the round, from the first thing you ask to the last thing you say.",
      "",
      "Talk for about three minutes: what you clarify before coding, how you decide what to handle and what to only mention, and the mistake you watch for in each of the common question families.",
    ].join("\n"),
    hints: [
      "The questions worth asking first are the ones that change the code: which runtime, which syntax, leading or trailing edge, cycles or not, how big the input is.",
      "Each classic has one bug interviewers see every week: a debounce that never clears the previous timer, a `Promise.all` that pushes in completion order, a clone through JSON, a `var` loop with `setTimeout`.",
    ],
    solution: [
      "## The shape of the round",
      "",
      "- **Clarify first.** Browser or Node, which syntax is allowed, whether you can run the code. Then the question's own switches: leading or trailing edge, fixed or variadic arity, cycles or not, how big the input is, whether the callback gets a `this`. Each answer changes the code, so ask before writing.",
      "- **Say the spec, build the core.** Name the edge cases you know about — sparse arrays, `thisArg`, mutation during iteration, thenables, cycles — and say which you will handle. Mentioning them earns most of the credit; skipping them silently earns none.",
      "- **Propose, then code aloud.** These questions rarely need a clever algorithm, so go straight to the right data structure and keep talking while you type.",
      "- **Read it back, then test.** One pass for typos and variables used before they exist, then three cases: the example, the empty input, the nasty one.",
      "- **Close with trade-offs:** what you left out, what you would change with more time, and the complexity if it matters.",
      "",
      "## The pitfall in each family",
      "",
      "**Debounce and throttle.** Forgetting to clear the previous timer turns a debounce into a throttle. Calling `fn()` instead of `fn.apply(this, args)` loses both the receiver and the arguments. Ask about edges, and about cancel. → [Implement debounce()](/problems/implement-debounce), [Implement Throttle](/problems/implement-throttle)",
      "",
      "**Promise combinators.** Write results by index, never push on completion. Resolve `[]` for an empty input instead of hanging. `Promise.resolve(item)` normalises plain values. `all` fails fast, `allSettled` never rejects, `any` rejects only once everything has, with an `AggregateError`. → [Implement Promise.all](/problems/implement-promise-all), [Implement Promise.allSettled](/problems/implement-promise-all-settled), [Implement Promise.any](/problems/implement-promise-any)",
      "",
      "**Deep clone.** `JSON.parse(JSON.stringify(x))` drops `undefined`, turns a `Date` into a string and `NaN` into `null`, and throws on cycles. Carry a `WeakMap` of visited objects, keep prototypes, and recurse into `Map` and `Set` values too. → [Implement cloneDeep](/problems/implement-clone-deep)",
      "",
      "**Closures and `this`.** `var` in a loop with `setTimeout` prints the final value every time; `let` or a closure fixes it. `this` inside a callback is not the outer object. Classes are hoisted, but sit in the temporal dead zone until their line runs. → [Predict the Output: var and let in a Loop With Timers](/problems/var-let-loop-closure-quiz), [Implement Function.prototype.bind](/problems/implement-function-bind)",
      "",
      "**Polyfills.** `map` passes value, index and array, honours `thisArg`, keeps holes, and fixes its range before the first callback. → [Implement Array.prototype.map](/problems/implement-array-map)",
      "",
      "**The DOM.** Cache a `querySelectorAll` result instead of querying inside a loop. Replacing `innerHTML` drops every listener attached beneath it. `getElementsByTagName` returns a live collection; `querySelectorAll` a static one. → [Implement getElementsByTagName](/problems/get-elements-by-tag-name)",
      "",
      "## Worth saying out loud",
      "",
      "- Ask whether you may assume a queue or a heap exists; interviewers usually let you.",
      "- Prefer pure functions, never mutate the input, and say a word about callbacks that mutate the array you are iterating.",
      "- When recursion is the natural shape, ask about depth and cycles before writing it.",
    ].join("\n"),
  },
  {
    slug: "implement-function-bind",
    title: "Implement Function.prototype.bind",
    category: "frontend",
    difficulty: "easy",
    companies: [
      "adobe",
      "amazon",
      "atlassian",
      "bytedance",
      "rippling",
      "tiktok",
    ],
    summary:
      "A closure over thisArg and the leading arguments; the original runs later, with the call's own arguments appended.",
    prompt: [
      "Implement `Function.prototype.myBind(thisArg, ...boundArgs)` without calling the native `bind`. It returns a new function that, when called, invokes the original with `this` set to `thisArg` and `boundArgs` placed before the call's own arguments.",
      "",
      "```js",
      "const john = { age: 42, getAge() { return this.age; } };",
      "const unbound = john.getAge;",
      "unbound();                  // undefined",
      "john.getAge.myBind(john)(); // 42",
      "```",
      "",
      "- Nothing runs until the returned function is called.",
      "- Arguments given to `myBind` come first, then the arguments of each call.",
      "- Calling the bound function as a method of some other object must not change its `this`.",
      "",
      "The grader runs scripted scenarios against your `myBind`; the native `bind` is switched off while they run.",
    ].join("\n"),
    hints: [
      "Inside `myBind`, `this` is the function it was called on. Capture it in a variable before returning the wrapper.",
      "The wrapper is `function (...callArgs) { return original.apply(thisArg, [...boundArgs, ...callArgs]); }`. `apply` is allowed; only `bind` is not.",
    ],
    solution: [
      "## Approach",
      "",
      "`myBind` runs once and remembers three things in a closure: the function it was called on (`this` at that moment), the receiver, and the leading arguments. The function it returns does the actual call with `apply`, concatenating the remembered arguments with the new ones. Because the wrapper decides the receiver itself, calling it as `other.method()` changes nothing.",
      "",
      "## Worth saying out loud",
      "",
      "- The native `bind` ignores `thisArg` when the bound function is invoked with `new`; a wrapper that checks `new.target` and constructs the original instead covers that.",
      "- A bound function's `length` and `name` are also adjusted by the real `bind`; the one-liner leaves them alone.",
      "- `call`, `apply` and `bind` are the same idea in three tenses: now with a list, now with an array, later.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Like Function.prototype.bind, without calling it.
 * @param {*} thisArg  the receiver for every call of the bound function
 * @param {...*} boundArgs  arguments placed before each call's own
 * @returns {Function}
 */
Function.prototype.myBind = function (thisArg, ...boundArgs) {
  // Your code here
};
`,
      solutionCode: `Function.prototype.myBind = function (thisArg, ...boundArgs) {
  const original = this; // the function myBind was called on
  return function (...callArgs) {
    return original.apply(thisArg, [...boundArgs, ...callArgs]);
  };
};
`,
      entry: "__judgeBind",
      driverCode: `function __judgeBind(scenario) {
  var savedBind = Function.prototype.bind;
  Function.prototype.bind = function () {
    throw new Error("Write it yourself: the native bind is off limits here");
  };
  try {
    if (scenario.kind === "receiver") {
      var john = { age: 42, getAge: function () { return this.age; } };
      return john.getAge.myBind(john)();
    }
    if (scenario.kind === "args") {
      var list = function () {
        return [this.name].concat(Array.prototype.slice.call(arguments));
      };
      var bound = list.myBind.apply(list, [{ name: "ctx" }].concat(scenario.bound));
      return bound.apply(undefined, scenario.call);
    }
    if (scenario.kind === "rebind") {
      var jane = { age: 42, getAge: function () { return this.age; } };
      var other = { age: 7, getAge: jane.getAge.myBind(jane) };
      return other.getAge();
    }
    if (scenario.kind === "lazy") {
      var calls = 0;
      var tick = function () { calls += 1; return calls; };
      var later = tick.myBind(null);
      var before = calls;
      var result = later();
      return [before, result, calls];
    }
    if (scenario.kind === "twice") {
      var greet = function (greeting, punctuation) {
        return greeting + ", " + this.name + punctuation;
      };
      var hi = greet.myBind({ name: "Ada" }, "Hi");
      return [hi("!"), hi("?")];
    }
    throw new Error("unknown scenario " + scenario.kind);
  } finally {
    Function.prototype.bind = savedBind;
  }
}`,
      tests: [
        {
          name: "this is fixed to the bound receiver",
          input: [{ kind: "receiver" }],
          expected: 42,
        },
        {
          name: "bound arguments come before call arguments",
          input: [{ kind: "args", bound: [1, 2], call: [3, 4] }],
          expected: ["ctx", 1, 2, 3, 4],
        },
        {
          name: "calling it as another object's method does not rebind",
          input: [{ kind: "rebind" }],
          expected: 42,
        },
        {
          name: "nothing runs until the bound function is called",
          input: [{ kind: "lazy" }],
          expected: [0, 1, 1],
        },
        {
          name: "the bound function can be called again and again",
          input: [{ kind: "twice" }],
          expected: ["Hi, Ada!", "Hi, Ada?"],
        },
      ],
    },
  },
  {
    slug: "implement-classnames",
    title: "Implement classNames",
    category: "frontend",
    difficulty: "easy",
    companies: ["meta"],
    summary:
      "Strings and numbers pass through, objects add their truthy keys, arrays recurse, falsy values vanish, one space between.",
    prompt: [
      "Implement `classNames(...args)`, the utility that conditionally joins CSS class names.",
      "",
      "```js",
      'classNames("foo", "bar");                      // "foo bar"',
      'classNames("foo", { bar: true, baz: false });  // "foo bar"',
      'classNames({ "foo-bar": true });               // "foo-bar"',
      'classNames("a", ["b", { c: true, d: false }]); // "a b c"',
      'classNames(null, false, "bar", 0, { baz: null }, ""); // "bar"',
      "```",
      "",
      "- Strings and numbers are added as they are; `0` is falsy and skipped like every other falsy value.",
      "- An object adds each key whose value is truthy.",
      "- Arrays are flattened recursively, by the same rules.",
      "- The result has single spaces between names and none at either end.",
    ].join("\n"),
    hints: [
      "One recursive `collect(arg)` that pushes onto a shared list handles every shape; arrays just call it on each item.",
      "Check falsiness first and strings or numbers second, so the object branch only ever sees real objects.",
    ],
    solution: [
      "## Approach",
      "",
      "One inner function sorts each argument by type: falsy values are dropped, strings and numbers are pushed, arrays recurse into the same function, and objects contribute their truthy keys. Collecting into one list and joining with a single space at the end gives clean spacing without any trimming.",
      "",
      "## Worth saying out loud",
      "",
      '- The real library does not de-duplicate: `classNames("a", "a")` is `"a a"`. A `Set` makes that a one-line follow-up if asked.',
      "- `Object.keys` ignores inherited keys; `for...in` would not.",
      "- `clsx` is the same contract, smaller; both are why the signature takes a rest parameter rather than one array.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * Conditionally join class names.
 * @param {...*} args  strings, numbers, objects of { name: condition }, or arrays of those
 * @returns {string}
 */
function classNames(...args) {
  // Your code here
  return "";
}
`,
      solutionCode: `function classNames(...args) {
  const classes = [];
  function collect(arg) {
    if (!arg) return; // null, undefined, false, 0, ""
    if (typeof arg === "string" || typeof arg === "number") {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      arg.forEach(collect); // flatten by the same rules
    } else if (typeof arg === "object") {
      for (const key of Object.keys(arg)) {
        if (arg[key]) classes.push(key);
      }
    }
  }
  args.forEach(collect);
  return classes.join(" ");
}
`,
      entry: "classNames",
      tests: [
        { name: "two strings", input: ["foo", "bar"], expected: "foo bar" },
        {
          name: "a string and an object",
          input: ["foo", { bar: true, baz: false }],
          expected: "foo bar",
        },
        {
          name: "an object with one truthy key",
          input: [{ "foo-bar": true }],
          expected: "foo-bar",
        },
        {
          name: "an object with mixed values",
          input: [{ foo: true, bar: false, qux: true }],
          expected: "foo qux",
        },
        {
          name: "arrays flatten recursively",
          input: ["a", ["b", { c: true, d: false }]],
          expected: "a b c",
        },
        {
          name: "falsy values vanish",
          input: [null, false, "bar", 0, { baz: null }, ""],
          expected: "bar",
        },
        {
          name: "deep nesting and a number",
          input: ["foo", ["bar", ["baz", { qux: 1 }]], 42],
          expected: "foo bar baz qux 42",
        },
        { name: "nothing at all", input: [], expected: "" },
      ],
    },
  },
];
