import type { Problem } from "./types";

// Apple front-end bank: spoken knowledge questions about the JavaScript
// language, the network, security and day-to-day practice — one question per
// document, each with an answer short enough to say in under a minute. The
// browser and rendering questions are in seed-apple-js-concepts-b.ts.

export const appleConceptProblems: Problem[] = [
  {
    slug: "closures-explained",
    title: "What Is a Closure?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "A function plus the bindings of the scope it was created in — bindings, not snapshots.",
    prompt: [
      "What is a closure?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Have one line of code ready that shows it: a counter factory is the classic.",
    ],
    solution: [
      "## Answer",
      "",
      "A function plus the variables of the scope it was created in. Those bindings stay alive after the outer function returns. **A closure captures the binding, not a snapshot of the value**, which is why a `var` loop counter is shared by every callback while `let` gives each iteration its own. Uses: private state (a counter factory), callbacks, and every utility like `debounce` and `once`.",
    ].join("\n"),
  },
  {
    slug: "promise-states-explained",
    title: "What Are the States of a Promise?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Pending, then fulfilled or rejected — settled is final, and handlers always run later.",
    prompt: [
      "What are the states of a promise? How do `then`, `catch` and `finally` behave?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say what \"settled is final\" means for a second `resolve`, and when a handler on an already-settled promise runs.",
    ],
    solution: [
      "## Answer",
      "",
      "Pending, then fulfilled or rejected, and settled is final: a later `resolve` or `reject` is ignored. `then`, `catch` and `finally` each return a new promise, which is what makes chaining work. Handlers always run as microtasks, never synchronously, even on an already-settled promise. `finally` sees neither the value nor the reason, and passes the original outcome through unless it throws.",
      "",
      "Promise sequencing in code is [Run Promises in Sequence](/problems/run-promises-in-sequence).",
    ].join("\n"),
  },
  {
    slug: "es6-improvements",
    title: "What Were the Best Improvements in ES6?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Pick two features and say which bug each one removed.",
    prompt: [
      "What are the best improvements in ES6?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Pick two and say what bug each one removed, rather than listing twelve features.",
    ],
    solution: [
      "## Answer",
      "",
      "Block scope with `let` and `const`; arrow functions with lexical `this`; classes; modules; promises; destructuring and spread; template literals; `Map` and `Set`; iterators and generators. Pick two and say what each removed: `let` ended the shared-loop-variable bug, and modules ended global-namespace collisions between scripts.",
    ].join("\n"),
  },
  {
    slug: "inheritance-vs-composition",
    title: "Inheritance or Composition?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "\"Is a\" ties the child to the parent; \"has a\" combines small parts.",
    prompt: [
      "Inheritance or composition — which do you reach for, and why?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say what each models (\"is a\" versus \"has a\") and what a change in a base class does to its children.",
    ],
    solution: [
      "## Answer",
      "",
      "Inheritance models \"is a\" and ties the child to the parent's implementation, so a change in the base class ripples down. Composition models \"has a\" and combines small parts. Prefer composition when behaviors vary independently. In React, hooks and `children` are composition, which is why class hierarchies of components are rare.",
      "",
      "How inheritance works in JavaScript, in code, is [Inheritance Without class](/problems/inheritance-without-class).",
    ].join("\n"),
  },
  {
    slug: "endianness-explained",
    title: "What Is Endianness?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "The byte order of multi-byte values — and where JavaScript makes you care.",
    prompt: [
      "What is endianness?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Define big- and little-endian with one four-byte example, then say where it shows up in JavaScript.",
    ],
    solution: [
      "## Answer",
      "",
      "The byte order of multi-byte values. Big-endian stores the most significant byte first and is network byte order. x86 and Apple silicon are little-endian. In JavaScript it matters for binary data: typed arrays use the platform's order, while `DataView` defaults to big-endian unless told otherwise.",
    ].join("\n"),
  },
  {
    slug: "oop-shared-features",
    title: "What Do Object-Oriented Languages Share?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Encapsulation, inheritance and polymorphism — and how JavaScript gets inheritance.",
    prompt: [
      "Name three things object-oriented languages share.",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Three words, each with a one-line example.",
    ],
    solution: [
      "## Answer",
      "",
      "Encapsulation, inheritance and polymorphism. Add abstraction if a fourth is welcome, and note that JavaScript gets inheritance from prototypes rather than classes.",
    ].join("\n"),
  },
  {
    slug: "cors-explained",
    title: "What Is CORS?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Browsers block cross-origin reads unless the server opts in — it protects users, not servers.",
    prompt: [
      "What is CORS?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say what the browser blocks, how a server opts in, and when a preflight happens.",
    ],
    solution: [
      "## Answer",
      "",
      "Browsers block a page from reading responses from another origin (scheme, host and port) unless the server opts in with `Access-Control-Allow-Origin`. Requests that are not \"simple\" trigger an `OPTIONS` preflight first. With credentials, the origin must be named exactly, and a wildcard is refused. CORS protects users, not servers: any non-browser client can still call the API.",
    ].join("\n"),
  },
  {
    slug: "cookies-vs-web-storage",
    title: "Cookies, localStorage or sessionStorage?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Size, lifetime and who can read it — HttpOnly cookies survive XSS.",
    prompt: [
      "Cookies, `localStorage` or `sessionStorage` — when do you use each?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Compare size, lifetime and whether it's sent with requests — then give the security difference.",
    ],
    solution: [
      "## Answer",
      "",
      "Cookies are sent automatically with every matching request, hold about 4 KB each, and can expire. `localStorage` holds about 5 MB per origin, is never sent, and is synchronous. `sessionStorage` has the same API, but belongs to one tab and is cleared when the tab closes. **The security difference is the point:** an `HttpOnly` cookie can't be read by script, so a session token in one survives XSS, and anything in `localStorage` does not.",
    ].join("\n"),
  },
  {
    slug: "securing-a-website",
    title: "How Do You Secure a Site?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "HTTPS, CSP, cookie flags and escaping — each named with the attack it stops.",
    prompt: [
      "How do you secure a site: HTTPS, CSP, cookies?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Name the attack each measure stops: HTTPS stops eavesdropping, CSP limits XSS, and `SameSite` with CSRF tokens stops cross-site request forgery.",
    ],
    solution: [
      "## Answer",
      "",
      "HTTPS everywhere, with HSTS. A Content Security Policy that allows scripts only from named sources or nonces limits XSS. Session cookies get `Secure`, `HttpOnly` and `SameSite`, plus CSRF tokens on state-changing requests. Escape output by default (React does for text), and never pass user input to `innerHTML`.",
    ].join("\n"),
  },
  {
    slug: "axios-vs-fetch",
    title: "Axios or fetch?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "fetch resolves on a 500; Axios rejects, parses JSON and intercepts.",
    prompt: [
      "Axios or `fetch` — which do you use, and why?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "What does `fetch` do on a 404 or a 500, and what does Axios add on top?",
    ],
    solution: [
      "## Answer",
      "",
      "`fetch` is built in, but **it resolves on a 404 or a 500**, so check `res.ok`. It needs `AbortSignal.timeout` for timeouts. Axios rejects on error statuses, parses JSON and has interceptors, at the cost of a dependency. Its cancel tokens are deprecated in favor of `AbortController`, which both now share.",
    ].join("\n"),
  },
  {
    slug: "graphql-tradeoffs",
    title: "What Do You Think of GraphQL?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "One round trip and typed data, paid for in caching, query cost and N+1 resolvers.",
    prompt: [
      "What do you think of GraphQL?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Give what it solves, what it costs on the server and for caching, and when it pays off.",
    ],
    solution: [
      "## Answer",
      "",
      "One round trip and no over-fetching for nested UI data, with a typed schema. In exchange: HTTP caching is harder, query cost must be limited on the server, and N+1 resolvers need batching. It pays off with many clients and deep data, less so for simple CRUD.",
    ].join("\n"),
  },
  {
    slug: "build-npm-package",
    title: "How Do You Build an npm Package?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "package.json fields, ESM builds with types, peer dependencies, and a dry-run before publishing.",
    prompt: [
      "How do you build an npm package?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Walk from `package.json` to `npm publish`, naming the fields that decide what consumers get.",
    ],
    solution: [
      "## Answer",
      "",
      "`package.json` with `name`, `version`, `exports`, `types` and a `files` allow-list. Build to ESM, plus CommonJS if consumers need it, with type declarations. Frameworks go in `peerDependencies`. Check the contents with `npm pack --dry-run`, then `npm publish`, and bump by semver.",
    ].join("\n"),
  },
  {
    slug: "good-code-review",
    title: "What Makes a Good Code Review?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Correctness first, then readability and tests — small diffs, specific comments.",
    prompt: [
      "What makes a good code review?",
      "",
      "Answer out loud in under a minute, from your own work first.",
    ].join("\n"),
    hints: [
      "Answer from your own reviews first, then generalize: what do you check, and in what order?",
    ],
    solution: [
      "## Answer",
      "",
      "Correctness and edge cases first, then readability and naming, tests, and consistency with the codebase. Small diffs, specific comments, and a clear split between blocking issues and preferences.",
    ].join("\n"),
  },
  {
    slug: "structure-new-repo",
    title: "How Would You Structure a Repo From Scratch?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Group by feature, keep tests beside code, and wire checks into CI from the first commit.",
    prompt: [
      "How would you structure a repo from scratch?",
      "",
      "Answer out loud in under a minute, from your own work first.",
    ].join("\n"),
    hints: [
      "Say how you group folders, where tests live, and what runs in CI.",
    ],
    solution: [
      "## Answer",
      "",
      "Group by feature, not by file type. Shared UI and utilities get their own folders, tests sit beside the code, and lint, format, type-check and test are wired into CI from the first commit.",
    ].join("\n"),
  },
  {
    slug: "jest-experience",
    title: "Have You Used Jest?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Name what you test with it — including timers with fake timers.",
    prompt: [
      "Have you used Jest? What do you test with it?",
      "",
      "Answer out loud in under a minute, from your own work first.",
    ].join("\n"),
    hints: [
      "Answer from your own work: which kinds of code, and one technique such as fake timers.",
    ],
    solution: [
      "## Answer",
      "",
      "Be ready to name what you test with it: pure functions, component behavior through Testing Library, and timers with fake timers, which is how you would test `debounce` without waiting.",
    ].join("\n"),
  },
  {
    slug: "usememo-usecallback",
    title: "When Would You Use useMemo or useCallback?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "They cache a value and a function identity — and only matter when something compares them.",
    prompt: [
      "What is your relationship with React hooks? When would you use `useMemo` or `useCallback`?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say what each caches, and name the situations where that caching actually changes anything.",
    ],
    solution: [
      "## Answer",
      "",
      "`useMemo` caches a computed value, and `useCallback` caches a function's identity. Both matter only when the result feeds a memoized child, a dependency array, or a costly calculation. Used everywhere, they add cost and noise, and the React Compiler increasingly applies them automatically.",
    ].join("\n"),
  },
];
