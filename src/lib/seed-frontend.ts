import type { Problem, UiWorkspace } from "./types";

// UI-workspace frontend questions: starter files for the live-preview
// editor. Starters compile and render as-is; the behavior is the exercise.

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

// -- reference solutions and HTML/CSS/JS alternates ----------------------------
// Each React exercise above also ships as a vanilla template, and both carry
// complete reference files for the Solution tab. Attached here so the starters
// above stay readable on their own.

counterUi.solution = [
  {
    name: "App.jsx",
    contents: `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);            // the only state; everything else derives from it
  return (
    <div className="counter">
      <span className="count">{count}</span>
      <div className="row">
        <button onClick={() => setCount((c) => c - 1)} disabled={count === 0}>
          -1
        </button>
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
        <button className="ghost" onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
    </div>
  );
}
`,
  },
  counterUi.files[1],
];

counterUi.alternate = {
  framework: "vanilla",
  files: [
    {
      name: "index.html",
      contents: `<div class="counter">
  <span class="count" data-role="count">0</span>
  <div class="row">
    <button type="button" data-action="dec">-1</button>
    <button type="button" data-action="inc">+1</button>
    <button type="button" class="ghost" data-action="reset">Reset</button>
  </div>
</div>
`,
    },
    {
      name: "script.js",
      contents: `const root = document.querySelector(".counter");
const display = root.querySelector('[data-role="count"]');
let count = 0;

function render() {
  display.textContent = String(count);
  // Your code here: derive the -1 button's disabled state from count.
}

// Your code here: one delegated click listener on .row that reads data-action.
render();
`,
    },
    counterUi.files[1],
  ],
  solution: [
    {
      name: "index.html",
      contents: `<div class="counter">
  <span class="count" data-role="count">0</span>
  <div class="row">
    <button type="button" data-action="dec">-1</button>
    <button type="button" data-action="inc">+1</button>
    <button type="button" class="ghost" data-action="reset">Reset</button>
  </div>
</div>
`,
    },
    {
      name: "script.js",
      contents: `const root = document.querySelector(".counter");
const display = root.querySelector('[data-role="count"]');
const dec = root.querySelector('[data-action="dec"]');
let count = 0;

function render() {
  display.textContent = String(count);
  dec.disabled = count === 0;              // derived from the one piece of state, never stored separately
}

// One delegated listener; the button's data-action names the transition.
root.querySelector(".row").addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (action === "inc") count += 1;
  else if (action === "dec") count = Math.max(0, count - 1);
  else if (action === "reset") count = 0;
  else return;
  render();
});

render();
`,
    },
    counterUi.files[1],
  ],
};

todoUi.solution = [
  {
    name: "App.jsx",
    contents: `import { useRef, useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([{ id: 0, text: "Walk the dog" }]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);                        // stable ids without a library (and without crypto)

  const add = (e) => {
    e.preventDefault();                            // Enter and the Add button both land here
    const text = draft.trim();
    if (!text) return;
    setTasks([...tasks, { id: nextId.current++, text }]);
    setDraft("");
  };

  return (
    <div className="todos">
      <form className="row" onSubmit={add}>
        <input
          placeholder="Add a task"
          aria-label="New task"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.text}</span>
            <button
              className="delete"
              aria-label={\`Delete \${task.text}\`}
              onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
  },
  todoUi.files[1],
];

todoUi.alternate = {
  framework: "vanilla",
  files: [
    {
      name: "index.html",
      contents: `<div class="todos">
  <form class="row">
    <input placeholder="Add a task" aria-label="New task">
    <button type="submit">Add</button>
  </form>
  <ul>
    <li>
      <span>Walk the dog</span>
      <button type="button" class="delete" aria-label="Delete Walk the dog">&times;</button>
    </li>
  </ul>
</div>
`,
    },
    {
      name: "script.js",
      contents: `const root = document.querySelector(".todos");
const form = root.querySelector("form");
const input = form.querySelector("input");
const list = root.querySelector("ul");

// Your code here: submitting appends a task (and clears the input); each
// delete button removes exactly its own task. Give tasks a stable id.
`,
    },
    todoUi.files[1],
  ],
  solution: [
    {
      name: "index.html",
      contents: `<div class="todos">
  <form class="row">
    <input placeholder="Add a task" aria-label="New task">
    <button type="submit">Add</button>
  </form>
  <ul></ul>
</div>
`,
    },
    {
      name: "script.js",
      contents: `const root = document.querySelector(".todos");
const form = root.querySelector("form");
const input = form.querySelector("input");
const list = root.querySelector("ul");
let nextId = 1;
const tasks = [{ id: nextId++, text: "Walk the dog" }];

function render() {
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = document.createElement("li");
      li.dataset.id = String(task.id);               // stable identity for the delete handler
      const label = document.createElement("span");
      label.textContent = task.text;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete";
      remove.setAttribute("aria-label", \`Delete \${task.text}\`);
      remove.textContent = "×";
      li.append(label, remove);
      return li;
    }),
  );
}

form.addEventListener("submit", (e) => {
  e.preventDefault();                                // Enter and the Add button both land here
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ id: nextId++, text });
  input.value = "";
  render();
});

// One delegated listener on the list; the li's data-id says which task.
list.addEventListener("click", (e) => {
  const button = e.target.closest(".delete");
  if (!button) return;
  const id = Number(button.closest("li").dataset.id);
  tasks.splice(tasks.findIndex((t) => t.id === id), 1);
  render();
});

render();
`,
    },
    todoUi.files[1],
  ],
};

const TABS_DATA = `const TABS = [
  { id: "html", label: "HTML", panel: "The skeleton: elements and structure." },
  { id: "css", label: "CSS", panel: "The skin: layout, color, and motion." },
  { id: "js", label: "JavaScript", panel: "The muscles: state and behavior." },
];
`;

tabsUi.solution = [
  {
    name: "App.jsx",
    contents: `import { useState } from "react";

${TABS_DATA}
export default function App() {
  const [activeId, setActiveId] = useState(TABS[0].id);   // the entire model
  const active = TABS.find((tab) => tab.id === activeId);
  return (
    <div className="tabs">
      <div role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeId}
            className={tab.id === activeId ? "active" : ""}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p role="tabpanel">{active.panel}</p>
    </div>
  );
}
`,
  },
  tabsUi.files[1],
];

tabsUi.alternate = {
  framework: "vanilla",
  files: [
    {
      name: "index.html",
      contents: `<div class="tabs">
  <div role="tablist"></div>
  <p role="tabpanel"></p>
</div>
`,
    },
    {
      name: "script.js",
      contents: `${TABS_DATA}
const tablist = document.querySelector('[role="tablist"]');
const panel = document.querySelector('[role="tabpanel"]');

// Your code here: show one panel at a time and mark its tab active.
tablist.replaceChildren(
  ...TABS.map((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.className = "active";
    button.textContent = tab.label;
    return button;
  }),
);
panel.textContent = TABS[0].panel;
`,
    },
    tabsUi.files[1],
  ],
  solution: [
    {
      name: "index.html",
      contents: `<div class="tabs">
  <div role="tablist"></div>
  <p role="tabpanel"></p>
</div>
`,
    },
    {
      name: "script.js",
      contents: `${TABS_DATA}
const tablist = document.querySelector('[role="tablist"]');
const panel = document.querySelector('[role="tabpanel"]');
let activeId = TABS[0].id;                        // the entire model

function render() {
  tablist.replaceChildren(
    ...TABS.map((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(tab.id === activeId));
      button.className = tab.id === activeId ? "active" : "";
      button.dataset.id = tab.id;
      button.textContent = tab.label;
      return button;
    }),
  );
  panel.textContent = TABS.find((tab) => tab.id === activeId).panel;
}

// One delegated listener; the button's data-id is the whole model update.
tablist.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-id]");
  if (!tab) return;
  activeId = tab.dataset.id;
  render();
});

render();
`,
    },
    tabsUi.files[1],
  ],
};

const SECTIONS_DATA = `const SECTIONS = [
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
`;

accordionUi.solution = [
  {
    name: "App.jsx",
    contents: `import { useState } from "react";

${SECTIONS_DATA}
export default function App() {
  const [open, setOpen] = useState(() => new Set());   // ids of expanded sections — any number may be open

  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev);                        // replace, never mutate state
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="accordion">
      {SECTIONS.map((section) => {
        const expanded = open.has(section.id);
        return (
          <section key={section.id}>
            <button aria-expanded={expanded} onClick={() => toggle(section.id)}>
              {section.title}
              <span aria-hidden className="chevron">v</span>
            </button>
            {expanded && <p>{section.body}</p>}
          </section>
        );
      })}
    </div>
  );
}
`,
  },
  accordionUi.files[1],
];

accordionUi.alternate = {
  framework: "vanilla",
  files: [
    { name: "index.html", contents: `<div class="accordion"></div>\n` },
    {
      name: "script.js",
      contents: `${SECTIONS_DATA}
const root = document.querySelector(".accordion");

// Your code here: clicking a title toggles its section, independently; all start collapsed.
root.replaceChildren(
  ...SECTIONS.map((section) => {
    const el = document.createElement("section");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-expanded", "true");
    button.textContent = section.title;
    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "v";
    button.append(chevron);
    const body = document.createElement("p");
    body.textContent = section.body;
    el.append(button, body);
    return el;
  }),
);
`,
    },
    accordionUi.files[1],
  ],
  solution: [
    { name: "index.html", contents: `<div class="accordion"></div>\n` },
    {
      name: "script.js",
      contents: `${SECTIONS_DATA}
const root = document.querySelector(".accordion");
const open = new Set();                            // ids of expanded sections — any number may be open

function render() {
  root.replaceChildren(
    ...SECTIONS.map((section) => {
      const expanded = open.has(section.id);
      const el = document.createElement("section");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.id = section.id;
      button.setAttribute("aria-expanded", String(expanded));
      button.textContent = section.title;
      const chevron = document.createElement("span");
      chevron.className = "chevron";
      chevron.setAttribute("aria-hidden", "true");
      chevron.textContent = "v";
      button.append(chevron);
      el.append(button);
      if (expanded) {
        const body = document.createElement("p");
        body.textContent = section.body;
        el.append(body);
      }
      return el;
    }),
  );
}

// One delegated listener; toggling flips membership in the Set.
root.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-id]");
  if (!button) return;
  const id = button.dataset.id;
  if (open.has(id)) open.delete(id);
  else open.add(id);
  render();
});

render();
`,
    },
    accordionUi.files[1],
  ],
};
