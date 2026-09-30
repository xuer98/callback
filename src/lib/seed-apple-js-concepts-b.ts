import type { Problem } from "./types";

// Apple front-end bank: spoken knowledge questions about the browser — the
// DOM, rendering and performance — one question per document, each with an
// answer short enough to say in under a minute.

export const appleBrowserConceptProblems: Problem[] = [
  {
    slug: "event-bubbling-explained",
    title: "What Is Event Bubbling?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Capture down, target, bubble up — and why delegation depends on it.",
    prompt: [
      "What is event bubbling?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Name the three phases, and one feature that depends on bubbling.",
    ],
    solution: [
      "## Answer",
      "",
      "An event travels in three phases: capture down from `window`, the target, then bubble back up. Listeners run in the bubble phase unless registered with `{ capture: true }`. Event delegation, one listener on a parent that handles events for its children, depends on bubbling. `focus`, `blur`, `mouseenter` and `mouseleave` do not bubble; `focusin` and `focusout` are their bubbling twins.",
    ].join("\n"),
  },
  {
    slug: "prevent-default-vs-stop-propagation",
    title: "preventDefault or stopPropagation?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "One cancels the browser's default action; the other stops the event traveling.",
    prompt: [
      "`preventDefault` or `stopPropagation` — what does each do?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say what still happens after each: does the event keep propagating, does the default action still run?",
    ],
    solution: [
      "## Answer",
      "",
      "`preventDefault` cancels the browser's default action, such as following a link or submitting a form, and the event still propagates. `stopPropagation` stops the event reaching further elements, and the default action still happens. **`stopImmediatePropagation` also skips the remaining listeners on the same element**.",
    ].join("\n"),
  },
  {
    slug: "doctype-and-quirks-mode",
    title: "Why <!DOCTYPE html>, and What Is Quirks Mode?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "The doctype selects standards mode; without it, browsers emulate 1990s layout.",
    prompt: [
      "Why start a page with `<!DOCTYPE html>`? What is quirks mode?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say which rendering mode the doctype selects, and give one behavior that differs without it.",
    ],
    solution: [
      "## Answer",
      "",
      "The doctype selects standards mode. Without it, browsers use quirks mode, which emulates 1990s layout behavior: unitless CSS lengths are accepted, and tables don't inherit the font size, for example. A third mode, limited quirks, comes from a few old doctypes.",
    ].join("\n"),
  },
  {
    slug: "compositing-layers",
    title: "What Is a Compositing Layer?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "A GPU texture the compositor can move or fade without layout or paint.",
    prompt: [
      "What is a compositing layer in CSS?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Say what promotes an element to its own layer, what that buys for animation, and what it costs.",
    ],
    solution: [
      "## Answer",
      "",
      "A part of the page painted into its own GPU texture. `transform`, `opacity` and `will-change` promote an element. The compositor can then move or fade it without layout or paint, which is why those two properties animate smoothly. Each layer costs memory, so promote sparingly.",
    ].join("\n"),
  },
  {
    slug: "web-accessibility",
    title: "How Do You Make a Page Accessible?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Native elements first, then names, keyboard, contrast, motion — and a real example.",
    prompt: [
      "How do you make a page accessible? What accessibility work have you done?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Start from native HTML elements, then list what you check; bring one real fix you made.",
    ],
    solution: [
      "## Answer",
      "",
      "Native elements first, since they bring role, focus and keyboard behavior for free. Then: a text name for every control, full keyboard operation with a visible focus ring, contrast of at least 4.5 to 1 for body text, `prefers-reduced-motion`, and ARIA only where no native element exists. Say you test with VoiceOver, and bring a real example of something you fixed.",
    ].join("\n"),
  },
  {
    slug: "light-and-dark-themes",
    title: "How Would You Implement Light and Dark Themes?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Custom properties on the root, prefers-color-scheme by default, and no flash of the wrong theme.",
    prompt: [
      "How would you implement light and dark themes?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Where do the colors live, what decides the default, and how do you stop the wrong theme flashing on load?",
    ],
    solution: [
      "## Answer",
      "",
      "Colors as CSS custom properties on the root. Follow `prefers-color-scheme` by default, and let a `data-theme` attribute on `<html>` override it. Store the choice, and set the attribute from an inline script in `<head>`, so the wrong theme never flashes before the stylesheet applies.",
    ].join("\n"),
  },
  {
    slug: "css-box-model",
    title: "How Do You Adjust a Border or a Margin?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Content, padding, border, margin — and what border-box changes about width.",
    prompt: [
      "How do you adjust a border or a margin?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Walk the box model from the inside out, and say what `box-sizing` changes.",
    ],
    solution: [
      "## Answer",
      "",
      "The box model from the inside out: content, padding, border, margin. `box-sizing: border-box` makes `width` include the padding and border, which is why most resets set it everywhere.",
    ].join("\n"),
  },
  {
    slug: "what-is-an-api",
    title: "What Is an API?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "A contract for how one piece of software calls another.",
    prompt: [
      "What is an API?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Define it as a contract, and name what the contract covers.",
    ],
    solution: [
      "## Answer",
      "",
      "An API is a contract for how one piece of software calls another: the operations, their inputs and outputs, and the errors.",
    ].join("\n"),
  },
  {
    slug: "critical-rendering-path",
    title: "How Does the Browser Turn HTML Into Pixels?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "DOM, CSSOM, render tree, layout, paint, composite — six numbered steps.",
    prompt: [
      "Walk through how the browser turns HTML into pixels.",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Learn the pipeline as six numbered steps, and say which of them scripts and CSS can block.",
    ],
    solution: [
      "## Answer",
      "",
      "1. **Parse HTML into the DOM.** A plain `<script>` pauses the parser; `defer` and `async` do not.",
      "2. **Parse CSS into the CSSOM.** CSS blocks rendering, and it also blocks any script that follows it.",
      "3. **Build the render tree** from the visible nodes and their computed styles. `display: none` nodes are left out.",
      "4. **Layout**, also called reflow: compute every box's size and position.",
      "5. **Paint** pixels into layers.",
      "6. **Composite** the layers on the GPU.",
    ].join("\n"),
  },
  {
    slug: "reflow-vs-repaint",
    title: "Repaint or Reflow?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Which pipeline steps each kind of change re-runs — and how reads force layout.",
    prompt: [
      "What is the difference between a repaint and a reflow?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Answer by naming which rendering steps each kind of change re-runs, then say what forces layout early.",
    ],
    solution: [
      "## Answer",
      "",
      "A geometry change (size, position, font, adding nodes) re-runs steps 4 to 6. A visual-only change, such as a color, re-runs 5 and 6. `transform` and `opacity` re-run only step 6. Reading `offsetHeight` after a write forces layout immediately, and alternating reads and writes in a loop is layout thrashing: batch the reads, then the writes.",
    ].join("\n"),
  },
  {
    slug: "fcp-and-lcp",
    title: "What Are FCP and LCP?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "First Contentful Paint and Largest Contentful Paint, with their good thresholds.",
    prompt: [
      "What are FCP and LCP?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Define each, give the \"good\" threshold, and name the other Core Web Vitals.",
    ],
    solution: [
      "## Answer",
      "",
      "First Contentful Paint is when the first text or image appears; 1.8 s or less is good. Largest Contentful Paint is when the largest image or text block in the viewport appears; 2.5 s or less is good. LCP is one of the three Core Web Vitals, with Interaction to Next Paint and Cumulative Layout Shift.",
    ].join("\n"),
  },
  {
    slug: "debug-blank-page",
    title: "How Would You Debug a Blank Page?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Console, network, DOM, then bisect the deploys.",
    prompt: [
      "How would you debug a blank page?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Give an order: which tool do you open first, and what does each step rule out?",
    ],
    solution: [
      "## Answer",
      "",
      "Console first, for a thrown error. Then the network tab: did the HTML, the bundle and the API calls return 200 with the right content type? Then the DOM: is the root element empty, or is content present but hidden by CSS? Then bisect recent deploys.",
    ].join("\n"),
  },
  {
    slug: "make-site-faster",
    title: "How Would You Make a Site Faster?",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Measure first, then ship less, unblock rendering, cache, and move work.",
    prompt: [
      "How would you make a site faster?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Start with \"measure first\" and name the tool (the Performance panel, Lighthouse, real-user metrics) before listing fixes.",
    ],
    solution: [
      "## Answer",
      "",
      "Measure first. Then ship less: code-split, tree-shake, compress, and use modern image formats. Unblock rendering: `defer` scripts, inline critical CSS, and lazy-load below the fold. Cache: hashed filenames with a long `max-age`, and never cache the HTML. Move work: a CDN, server rendering, and parallel API calls instead of a waterfall.",
    ].join("\n"),
  },
  {
    slug: "handling-slow-api",
    title: "How Do You Deal With a Slow API?",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary: "Show a shell at once, cache and parallelize, cancel stale requests — then fix the server.",
    prompt: [
      "How do you deal with a slow API?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "Separate what the client can do to hide latency from what actually removes it.",
    ],
    solution: [
      "## Answer",
      "",
      "Show the page shell with a skeleton at once. Cache and revalidate, paginate, request in parallel, and cancel stale requests with `AbortController`. Then fix the cause on the server, because the client can only hide latency.",
    ].join("\n"),
  },
  {
    slug: "heavy-calculation-freezes-ui",
    title: "A Heavy Calculation Freezes the UI",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Move it to a Web Worker — or chunk it and yield when a worker isn't an option.",
    prompt: [
      "A heavy calculation over sales data freezes a React UI. What do you do?",
      "",
      "Answer out loud in under a minute: a definition, one concrete example, and one pitfall or trade-off.",
    ].join("\n"),
    hints: [
      "The main thread can't paint while it computes. Where else can the work run — and if nowhere else, how do you let the browser breathe?",
    ],
    solution: [
      "## Answer",
      "",
      "Move it to a Web Worker, pass the data with `postMessage` (or transfer an `ArrayBuffer` to avoid copying), and terminate the worker in the effect's cleanup. Without a worker, split the work into chunks and yield to the event loop between them. `setImmediate` doesn't exist in browsers, and `requestIdleCallback` was not enabled by default in Safari as of 18.1, so feature-detect and fall back to `setTimeout`. `useDeferredValue` keeps typing responsive while React renders the expensive result.",
    ].join("\n"),
  },
];
