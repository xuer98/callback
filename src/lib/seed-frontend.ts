import type { Problem, UiWorkspace } from "./types";

// UI-workspace frontend questions: starter files for the live-preview
// editor. Starters compile and render as-is; the behavior is the exercise.

/** The vanilla playground attached to implement-debounce in seed-data. */
export const debouncePlayground: UiWorkspace = {
  framework: "vanilla",
  files: [
    {
      name: "app.ts",
      contents: `type AnyFn = (...args: any[]) => void;

function debounce(fn: AnyFn, wait: number): AnyFn & { cancel(): void } {
  // Your code here: delay fn until wait ms after the last call.
  const wrapped: AnyFn = (...args) => fn(...args);
  return Object.assign(wrapped, { cancel() {} });
}

// -- demo wiring: mash the button and watch the two counters ----------------

const button = document.querySelector("#press") as HTMLButtonElement;
const cancel = document.querySelector("#cancel") as HTMLButtonElement;
const rawEl = document.querySelector("#raw") as HTMLElement;
const settledEl = document.querySelector("#settled") as HTMLElement;

let presses = 0;
let fires = 0;

const onSettle = debounce(() => {
  fires += 1;
  settledEl.textContent = String(fires);
  console.log("debounced fire #" + fires);
}, 500);

button.addEventListener("click", () => {
  presses += 1;
  rawEl.textContent = String(presses);
  onSettle();
});

cancel.addEventListener("click", () => {
  onSettle.cancel();
  console.log("pending call cancelled");
});
`,
    },
    {
      name: "index.html",
      contents: `<div class="demo">
  <button id="press">Click me fast</button>
  <button id="cancel" class="ghost">Cancel pending</button>
  <p>Clicks: <b id="raw">0</b></p>
  <p>Debounced fires: <b id="settled">0</b></p>
</div>
`,
    },
    {
      name: "styles.css",
      contents: `.demo {
  display: grid;
  gap: 8px;
  max-width: 280px;
  font-size: 14px;
}

button {
  padding: 8px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #18181b;
  color: #fafafa;
  font-size: 14px;
  cursor: pointer;
}

button.ghost {
  background: #ffffff;
  color: #18181b;
}

p {
  margin: 0;
}
`,
    },
  ],
};

const counterUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `export default function App() {
  // Your code here: wire the buttons to real state.
  return (
    <div className="counter">
      <span className="count">0</span>
      <div className="row">
        <button>-1</button>
        <button>+1</button>
        <button className="ghost">Reset</button>
      </div>
    </div>
  );
}
`,
    },
    {
      name: "styles.css",
      contents: `.counter {
  display: grid;
  gap: 12px;
  justify-items: center;
  max-width: 220px;
  padding: 16px;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
}

.count {
  font-size: 40px;
  font-weight: 600;
}

.row {
  display: flex;
  gap: 8px;
}

button {
  padding: 6px 14px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #18181b;
  color: #fafafa;
  font-size: 14px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}

button.ghost {
  background: #ffffff;
  color: #18181b;
}
`,
    },
  ],
};

const todoUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `export default function App() {
  // Your code here: make the form add tasks and the buttons remove them.
  return (
    <div className="todos">
      <form className="row">
        <input placeholder="Add a task" aria-label="New task" />
        <button type="submit">Add</button>
      </form>
      <ul>
        <li>
          <span>Walk the dog</span>
          <button className="delete" aria-label="Delete Walk the dog">
            &times;
          </button>
        </li>
      </ul>
    </div>
  );
}
`,
    },
    {
      name: "styles.css",
      contents: `.todos {
  display: grid;
  gap: 12px;
  max-width: 320px;
}

.row {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  font-size: 14px;
}

button {
  padding: 8px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #18181b;
  color: #fafafa;
  font-size: 14px;
  cursor: pointer;
}

ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  font-size: 14px;
}

button.delete {
  padding: 2px 8px;
  background: #ffffff;
  color: #71717a;
}
`,
    },
  ],
};

const tabsUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `const TABS = [
  { id: "html", label: "HTML", panel: "The skeleton: elements and structure." },
  { id: "css", label: "CSS", panel: "The skin: layout, color, and motion." },
  { id: "js", label: "JavaScript", panel: "The muscles: state and behavior." },
];

export default function App() {
  // Your code here: show one panel at a time and mark its tab active.
  return (
    <div className="tabs">
      <div role="tablist">
        {TABS.map((tab) => (
          <button key={tab.id} role="tab" className="active">
            {tab.label}
          </button>
        ))}
      </div>
      <p role="tabpanel">{TABS[0].panel}</p>
    </div>
  );
}
`,
    },
    {
      name: "styles.css",
      contents: `.tabs {
  max-width: 360px;
  display: grid;
  gap: 12px;
}

[role="tablist"] {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e4e4e7;
}

[role="tab"] {
  padding: 8px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: #71717a;
  font-size: 14px;
  cursor: pointer;
}

[role="tab"].active {
  border-bottom-color: #18181b;
  color: #18181b;
}

[role="tabpanel"] {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}
`,
    },
  ],
};

const accordionUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `const SECTIONS = [
  {
    id: "http",
    title: "What happens when you type a URL?",
    body: "DNS resolves the name, TCP and TLS handshake, the request goes out, and the browser parses, lays out, and paints the response.",
  },
  {
    id: "cors",
    title: "What is CORS?",
    body: "A browser policy: cross-origin responses are hidden from scripts unless the server opts in with Access-Control-Allow-Origin.",
  },
  {
    id: "closure",
    title: "What is a closure?",
    body: "A function bundled with the variables it captured from the scope where it was created.",
  },
];

export default function App() {
  // Your code here: clicking a title toggles its section, independently.
  return (
    <div className="accordion">
      {SECTIONS.map((section) => (
        <section key={section.id}>
          <button aria-expanded="true">
            {section.title}
            <span aria-hidden className="chevron">v</span>
          </button>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}
`,
    },
    {
      name: "styles.css",
      contents: `.accordion {
  max-width: 420px;
  display: grid;
  gap: 8px;
}

section {
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  overflow: hidden;
}

section > button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: #fafafa;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.chevron {
  color: #a1a1aa;
  transition: transform 0.15s;
}

button[aria-expanded="true"] .chevron {
  transform: rotate(180deg);
}

section > p {
  margin: 0;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #3f3f46;
}
`,
    },
  ],
};

export const frontendProblems: Problem[] = [
  {
    slug: "react-counter",
    title: "Build a Counter",
    category: "frontend",
    difficulty: "easy",
    companies: ["google", "meta"],
    summary: "The React warm-up: state, events, and a derived disable.",
    prompt: `Build a counter component. The buttons are already on screen — make them work.

## Requirements

- **+1** and **-1** change the displayed count.
- The count never goes below zero: **-1** is disabled at 0.
- **Reset** returns the count to 0.

Talk through where the state lives and why the disabled state should be derived from it rather than stored separately.`,
    hints: [
      "One `useState(0)` is the only state this needs — everything else on screen is derived from it.",
      "Disable with `disabled={count === 0}` instead of tracking a second boolean; two sources of truth drift.",
    ],
    ui: counterUi,
  },
  {
    slug: "react-todo-list",
    title: "Build a Todo List",
    category: "frontend",
    difficulty: "medium",
    companies: ["meta", "amazon", "airbnb"],
    summary: "List state done right: keys, controlled input, and deletes.",
    prompt: `Build a todo list. The markup ships with a hardcoded task — replace it with real state.

## Requirements

- Typing a task and pressing **Add** (or Enter) appends it to the list and clears the input.
- Submitting an empty or whitespace-only input does nothing.
- Each task has a delete button that removes exactly that task.
- New tasks get a stable identity — deleting the second of three identical tasks must not confuse React about which row went away.

## Follow-up

Where would completion toggles and an "N items left" counter fit? What changes if tasks must survive a reload?`,
    hints: [
      "Model tasks as objects with an id (`crypto.randomUUID()` or a counter in a ref), not bare strings — the id is your `key` and your delete handle.",
      "Make the input controlled and handle `onSubmit` on the form, calling `preventDefault()` — that gives you Enter for free.",
      "Delete with `setTasks(tasks.filter((t) => t.id !== id))` — never `splice` state in place.",
    ],
    ui: todoUi,
  },
  {
    slug: "react-tabs",
    title: "Build Tabs",
    category: "frontend",
    difficulty: "easy",
    companies: ["meta", "pinterest"],
    summary: "One active index drives the whole component.",
    prompt: `Build a tabbed interface from the provided \`TABS\` data. The starter renders every tab as active and only the first panel — fix both.

## Requirements

- Exactly one panel is visible at a time.
- Clicking a tab shows its panel and moves the active styling.
- The first tab is selected on load.
- Set \`aria-selected\` on the active tab, since the markup already uses tab roles.

## Follow-up

What would keyboard support look like (arrow keys between tabs)? When would you render all panels and hide the inactive ones instead of unmounting them?`,
    hints: [
      "A single `activeId` (or index) in state is the entire model — active styling and the visible panel both derive from it.",
      "Apply the class conditionally: `className={tab.id === activeId ? 'active' : ''}` — and put `aria-selected` on the same condition.",
    ],
    ui: tabsUi,
  },
  {
    slug: "react-accordion",
    title: "Build an Accordion",
    category: "frontend",
    difficulty: "medium",
    companies: ["amazon", "atlassian"],
    summary: "Independent toggles — a Set of open ids, not N booleans.",
    prompt: `Build an accordion from the provided \`SECTIONS\` data. The starter renders every section expanded — make each one toggle on its own.

## Requirements

- Clicking a section's title expands or collapses that section.
- Sections toggle independently: any number can be open at once.
- All sections start collapsed.
- Keep \`aria-expanded\` on each title button in sync (the chevron flips off it).

## Follow-up

How would you change the model so only one section can be open at a time — and which of the two models would you ship as a reusable component's default?`,
    hints: [
      "Track open sections as a `Set` of ids in one state value; a section is open when the set has its id.",
      "State must be replaced, not mutated: copy with `new Set(open)`, then add or delete, then set the copy.",
      "Collapse by not rendering the body (`open.has(id) && <p>…</p>`) — the aria-expanded attribute belongs on the button either way.",
    ],
    ui: accordionUi,
  },
];
