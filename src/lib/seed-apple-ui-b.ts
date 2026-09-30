import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank, UI part B: loading a stylesheet on demand, and a
// plain-DOM tooltip library driven by data attributes. The preview has no
// network, so the stylesheets are blob URLs.

// -- load CSS on demand ----------------------------------------------------------

const loadCssHtml: UiFile = {
  name: "index.html",
  contents: `<main class="page">
  <h2>Load a stylesheet on demand</h2>
  <div class="row">
    <button type="button" id="load-theme">Load theme</button>
    <button type="button" id="load-again">Load it again</button>
    <button type="button" id="load-missing">Load a missing file</button>
  </div>
  <p id="css-status" class="status" aria-live="polite">No stylesheet loaded yet.</p>
  <p class="swatch">This box turns blue once the theme loads.</p>
</main>
`,
};

const loadCssDemo: UiFile = {
  name: "demo.js",
  contents: `// Wiring for the page. Your code goes in load-css.js.
import { loadCSS } from "./load-css.js";

// The preview has no network, so the "files" are blob URLs.
const themeUrl = URL.createObjectURL(
  new Blob([".swatch { background: #2563eb; color: #fff; }"], { type: "text/css" }),
);
const missingUrl = URL.createObjectURL(new Blob([""], { type: "text/css" }));
URL.revokeObjectURL(missingUrl); // revoked: loading it fails like a 404

const status = document.getElementById("css-status");
const report = (promise) =>
  promise.then(
    () => {
      status.textContent = "Loaded. Links in <head>: " + document.head.querySelectorAll("link").length;
    },
    (err) => {
      status.textContent = "Error: " + err.message;
    },
  );

document.getElementById("load-theme").addEventListener("click", () => report(loadCSS(themeUrl)));
document.getElementById("load-again").addEventListener("click", () => report(loadCSS(themeUrl)));
document.getElementById("load-missing").addEventListener("click", () => report(loadCSS(missingUrl)));
`,
};

const loadCssStyles: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.page {
  padding: 16px;
}

h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

button {
  padding: 6px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}

.status {
  margin: 8px 0;
  font-size: 13px;
  color: #52525b;
}

.swatch {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f4f4f5;
}
`,
};

const loadCssStarter = `/**
 * Add a <link rel="stylesheet"> for href. Resolve with the link once the
 * stylesheet has loaded; reject with new Error("Failed to load " + href).
 * Loading the same href twice must not add a second link.
 */
export function loadCSS(href) {
  // Your code here
  return Promise.reject(new Error("Not implemented yet"));
}
`;

const loadCssSolution = `const requests = new Map(); // href -> promise: a second call reuses the first

export function loadCSS(href) {
  if (requests.has(href)) return requests.get(href);
  const promise = new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => {
      link.remove();
      requests.delete(href); // let a later call retry
      reject(new Error("Failed to load " + href));
    };
    document.head.append(link);
  });
  requests.set(href, promise);
  return promise;
}
`;

const loadCssUi: UiWorkspace = {
  framework: "vanilla",
  files: [loadCssHtml, { name: "load-css.js", contents: loadCssStarter }, loadCssDemo, loadCssStyles],
  solution: [loadCssHtml, { name: "load-css.js", contents: loadCssSolution }, loadCssDemo, loadCssStyles],
};

// -- tooltip library -------------------------------------------------------------

const tooltipHtml: UiFile = {
  name: "index.html",
  contents: `<main class="page">
  <h2>Tooltips from data attributes</h2>
  <div class="row" id="toolbar">
    <button type="button" data-tooltip="Saves the draft">Save</button>
    <button type="button" data-tooltip="Sends it to your team">Share</button>
    <a href="#" data-tooltip="Opens the <b>history</b> panel">History</a>
  </div>
  <p><button type="button" id="add-button">Add a button</button></p>
</main>
`,
};

const tooltipDemo: UiFile = {
  name: "demo.js",
  contents: `// Wiring for the page. Your code goes in tooltips.js.
import { initTooltips } from "./tooltips.js";

initTooltips();

document.getElementById("add-button").addEventListener("click", () => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "New";
  button.dataset.tooltip = "Added after initTooltips ran";
  document.getElementById("toolbar").append(button);
});
`,
};

const tooltipStyles: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.page {
  padding: 16px;
}

h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

button {
  padding: 6px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}


.tooltip {
  position: fixed;
  z-index: 10;
  max-width: 220px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #18181b;
  color: #fff;
  font-size: 12px;
  pointer-events: none;
}
`,
};

const tooltipStarter = `/**
 * Show a tooltip for every element with a data-tooltip attribute inside
 * root, on hover and on keyboard focus, including elements added later.
 */
export function initTooltips(root = document) {
  // Your code here
}
`;

const tooltipSolution = `export function initTooltips(root = document) {
  // One tooltip node serves every target.
  const tip = document.createElement("div");
  tip.id = "tooltip";
  tip.className = "tooltip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);

  let owner = null;
  const targetOf = (event) =>
    event.target instanceof Element ? event.target.closest("[data-tooltip]") : null;

  const show = (el) => {
    owner = el;
    tip.textContent = el.dataset.tooltip; // text, never HTML
    tip.hidden = false;
    const box = el.getBoundingClientRect();
    tip.style.left = box.left + "px";
    tip.style.top = box.bottom + 8 + "px";
    el.setAttribute("aria-describedby", tip.id);
  };
  const hide = () => {
    if (!owner) return;
    owner.removeAttribute("aria-describedby");
    owner = null;
    tip.hidden = true;
  };

  // Delegated listeners: mouseover, mouseout, focusin and focusout bubble;
  // mouseenter and focus don't, so they can't be delegated.
  root.addEventListener("mouseover", (event) => {
    const el = targetOf(event);
    if (el && el !== owner) show(el);
  });
  root.addEventListener("mouseout", (event) => {
    const el = targetOf(event);
    if (el && !el.contains(event.relatedTarget)) hide(); // moving within the element isn't leaving
  });
  root.addEventListener("focusin", (event) => {
    const el = targetOf(event);
    if (el) show(el);
  });
  root.addEventListener("focusout", (event) => {
    if (targetOf(event)) hide();
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
}
`;

const tooltipUi: UiWorkspace = {
  framework: "vanilla",
  files: [tooltipHtml, { name: "tooltips.js", contents: tooltipStarter }, tooltipDemo, tooltipStyles],
  solution: [tooltipHtml, { name: "tooltips.js", contents: tooltipSolution }, tooltipDemo, tooltipStyles],
};

export const appleUiProblemsB: Problem[] = [
  {
    slug: "load-css-on-demand",
    title: "Load CSS on Demand",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "A promise around a `<link>`, memoized by href, that forgets failures so a retry can work.",
    prompt: [
      "Write `loadCSS(href)` in `load-css.js`; the page wiring is in `demo.js`.",
      "",
      "## Requirements",
      "",
      "- Add a `<link rel=\"stylesheet\">` for `href`, and return a promise.",
      "- Resolve with the link element once the stylesheet has loaded.",
      "- Reject with `new Error(\"Failed to load \" + href)` when it fails.",
      "- Calling it again with the same `href` must not add a second link.",
      "",
      "The demo loads stylesheets from blob URLs, because the preview has no network. A revoked one stands in for the missing file.",
    ].join("\n"),
    hints: [
      "`link.onload` and `link.onerror` settle the promise. Append the link after attaching the handlers.",
      "Keep a `Map` from `href` to its promise, so a second call returns the first promise — and delete the entry on failure so a retry can happen.",
    ],
    solution: [
      "## Approach",
      "",
      "`loadCSS` wraps a `<link>` in a promise and memoizes it by `href`, so repeated calls share one request and one element. A failure removes the link and forgets the entry, which lets a later call retry.",
      "",
      "## Worth saying out loud",
      "",
      "- **Memoize the promise, not the result** — a second call made while the first is still loading must not add a second link.",
      "- Removing the failed link and forgetting it is what makes retry possible; caching the rejection forever would not.",
      "- `media=\"print\"` plus an `onload` that switches it to `all` is the classic trick for loading a stylesheet without blocking render.",
    ].join("\n"),
    ui: loadCssUi,
  },
  {
    slug: "tooltip-library",
    title: "A Tooltip Library From data Attributes",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary: "One tooltip node, delegated listeners, keyboard focus and Escape — in plain DOM, not a component.",
    prompt: [
      "Build a native tooltip library driven by `data-` attributes rather than a React component: write `initTooltips(root = document)` in `tooltips.js`; the page wiring is in `demo.js`.",
      "",
      "## Requirements",
      "",
      "- Any element with a `data-tooltip` attribute shows that text in a tooltip on hover **and on keyboard focus**, and hides it on leave, on blur and on Escape.",
      "- It works for elements added after `initTooltips` ran. The demo's \"Add a button\" button tests this.",
      "- The tooltip has `role=\"tooltip\"`, and its target points at it with `aria-describedby` while it shows.",
      "- The text is shown as text. The History link's attribute contains markup that must not render.",
    ].join("\n"),
    hints: [
      "Create **one** tooltip node, and listen on `root`, not on each target. `mouseover`, `mouseout`, `focusin` and `focusout` bubble, which is what makes delegation work, while `mouseenter` and `focus` don't bubble.",
      "Find the target with `event.target.closest(\"[data-tooltip]\")`. On `mouseout`, ignore moves into a child of the same element: check `el.contains(event.relatedTarget)`.",
    ],
    solution: [
      "## Approach",
      "",
      "`initTooltips` creates a single tooltip element and five listeners on the root. Every show or hide finds its target with `closest`, so any number of targets works, including ones added later.",
      "",
      "## Worth saying out loud",
      "",
      "- **One tooltip node and delegated listeners** serve any number of targets, including ones added later.",
      "- `mouseover` and `focusin` bubble. `mouseenter` and `focus` do not, so they cannot be delegated.",
      "- Keyboard focus, `role=\"tooltip\"`, `aria-describedby` and Escape are the accessibility points to name.",
      "- **`textContent`, never `innerHTML`**, so attribute text can't inject markup.",
      "- A production tooltip also flips above the target near the bottom of the viewport, waits a moment before showing, and stays visible while the pointer moves onto it. Mention these rather than building them all.",
    ].join("\n"),
    ui: tooltipUi,
  },
];
