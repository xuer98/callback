import type { Problem, UiFile, UiWorkspace } from "./types";

// Airbnb frontend bank, part F: the Transfer List — the third question of a
// reported 2024 loop (after Debounce and Promise), where the candidate ran out
// of time. React template (as reported) plus an HTML/CSS/JS one, both with
// complete reference files.

const transferCss: UiFile = {
  name: "styles.css",
  contents: `.transfer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: start;
  max-width: 560px;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

.transfer__list {
  margin: 0;
  min-height: 200px;
  padding: 10px 12px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
}

.transfer__list legend {
  padding: 0 4px;
  font-weight: 600;
}

.transfer__list ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.transfer__list label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.transfer__empty {
  margin: 0;
  color: #a1a1aa;
}

.transfer__controls {
  display: grid;
  gap: 6px;
  align-self: center;
}

.transfer__controls button {
  min-width: 36px;
  padding: 6px 10px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}

.transfer__controls button:disabled {
  opacity: 0.4;
  cursor: default;
}
`,
};

const itemsFixture = `const ITEMS = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "kitchen", label: "Kitchen" },
  { id: "washer", label: "Washer" },
  { id: "pool", label: "Pool" },
  { id: "parking", label: "Free parking" },
  { id: "workspace", label: "Dedicated workspace" },
];
`;

const transferReactStarter = `import { useId, useState } from "react";

${itemsFixture}
// items: [{ id, label }]. Ids are unique across both lists.
export function TransferList({ initialLeft, initialRight = [] }) {
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);
  // Your code here: one Set of checked ids, move checked / move all, buttons
  // disabled when nothing applies.
  return (
    <div className="transfer">
      <ListBox title="Available" items={left} />
      <div className="transfer__controls">
        <button type="button" aria-label="Move all right">≫</button>
        <button type="button" aria-label="Move selected right">›</button>
        <button type="button" aria-label="Move selected left">‹</button>
        <button type="button" aria-label="Move all left">≪</button>
      </div>
      <ListBox title="Chosen" items={right} />
    </div>
  );
}

function ListBox({ title, items }) {
  const id = useId();
  return (
    <fieldset className="transfer__list">
      <legend>{title} ({items.length})</legend>
      {items.length === 0 && <p className="transfer__empty">Empty</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label htmlFor={\`\${id}-\${item.id}\`}>
              <input id={\`\${id}-\${item.id}\`} type="checkbox" />
              {item.label}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export default function App() {
  return <TransferList initialLeft={ITEMS} />;
}
`;

const transferReactSolution = `import { useId, useState } from "react";

${itemsFixture}
// Transfer List (reported 2024 FE loop): two lists with checkboxes; move checked items across;
// "move all" buttons; buttons disabled when nothing applies.
// items: [{ id, label }]
export function TransferList({ initialLeft, initialRight = [] }) {
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);
  const [checked, setChecked] = useState(() => new Set());   // ids checked on either side

  const toggle = (id) => setChecked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Move every checked item that lives in \`from\` to \`to\`; keep original order on both sides.
  const move = (from, to, setFrom, setTo, ids = checked) => {
    const moving = from.filter((item) => ids.has(item.id));
    if (moving.length === 0) return;
    setFrom(from.filter((item) => !ids.has(item.id)));
    setTo([...to, ...moving]);
    setChecked((prev) => { const next = new Set(prev); moving.forEach((m) => next.delete(m.id)); return next; });
  };
  const all = (list) => new Set(list.map((i) => i.id));

  const leftChecked = left.filter((i) => checked.has(i.id)).length;
  const rightChecked = right.filter((i) => checked.has(i.id)).length;

  return (
    <div className="transfer">
      <ListBox title="Available" items={left} checked={checked} onToggle={toggle} />
      <div className="transfer__controls">
        <button type="button" onClick={() => move(left, right, setLeft, setRight, all(left))} disabled={left.length === 0} aria-label="Move all right">≫</button>
        <button type="button" onClick={() => move(left, right, setLeft, setRight)} disabled={leftChecked === 0} aria-label="Move selected right">›</button>
        <button type="button" onClick={() => move(right, left, setRight, setLeft)} disabled={rightChecked === 0} aria-label="Move selected left">‹</button>
        <button type="button" onClick={() => move(right, left, setRight, setLeft, all(right))} disabled={right.length === 0} aria-label="Move all left">≪</button>
      </div>
      <ListBox title="Chosen" items={right} checked={checked} onToggle={toggle} />
    </div>
  );
}

function ListBox({ title, items, checked, onToggle }) {
  const id = useId();
  return (
    <fieldset className="transfer__list">
      <legend>{title} ({items.length})</legend>
      {items.length === 0 && <p className="transfer__empty">Empty</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label htmlFor={\`\${id}-\${item.id}\`}>
              <input
                id={\`\${id}-\${item.id}\`}
                type="checkbox"
                checked={checked.has(item.id)}
                onChange={() => onToggle(item.id)}
              />
              {item.label}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export default function App() {
  return <TransferList initialLeft={ITEMS} />;
}
`;

const transferHtml: UiFile = {
  name: "index.html",
  contents: `<div class="transfer">
  <fieldset class="transfer__list" data-list="left">
    <legend>Available</legend>
    <p class="transfer__empty" hidden>Empty</p>
    <ul></ul>
  </fieldset>
  <div class="transfer__controls">
    <button type="button" data-action="all-right" aria-label="Move all right">≫</button>
    <button type="button" data-action="right" aria-label="Move selected right">›</button>
    <button type="button" data-action="left" aria-label="Move selected left">‹</button>
    <button type="button" data-action="all-left" aria-label="Move all left">≪</button>
  </div>
  <fieldset class="transfer__list" data-list="right">
    <legend>Chosen</legend>
    <p class="transfer__empty" hidden>Empty</p>
    <ul></ul>
  </fieldset>
</div>
`,
};

const transferVanillaStarter = `${itemsFixture}
// Wire one transfer list: a Set of checked ids, move checked / move all across
// the two lists, buttons disabled when nothing applies.
function initTransferList(root, { initialLeft, initialRight = [] }) {
  const state = { left: [...initialLeft], right: [...initialRight] };
  const lists = { left: root.querySelector('[data-list="left"]'), right: root.querySelector('[data-list="right"]') };

  function renderList(side) {
    const items = state[side];
    lists[side].querySelector("ul").replaceChildren(
      ...items.map((item) => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        label.append(input, document.createTextNode(item.label));
        li.append(label);
        return li;
      }),
    );
  }

  // Your code here: checked state, the four moves, disabled buttons, legends with counts.
  renderList("left");
  renderList("right");
  return { state };
}

initTransferList(document.querySelector(".transfer"), { initialLeft: ITEMS });
`;

const transferVanillaSolution = `${itemsFixture}
// Transfer List: two lists with checkboxes, move checked / move all across,
// buttons disabled when nothing applies. Same model as the React version —
// two arrays and one Set of checked ids — with the state in a closure.
function initTransferList(root, { initialLeft, initialRight = [] }) {
  const state = { left: [...initialLeft], right: [...initialRight], checked: new Set() };
  const lists = { left: root.querySelector('[data-list="left"]'), right: root.querySelector('[data-list="right"]') };
  const titles = { left: "Available", right: "Chosen" };
  const buttons = [...root.querySelectorAll("[data-action]")];

  function renderList(side) {
    const box = lists[side];
    const items = state[side];
    box.querySelector("legend").textContent = \`\${titles[side]} (\${items.length})\`;
    box.querySelector(".transfer__empty").hidden = items.length > 0;
    box.querySelector("ul").replaceChildren(
      ...items.map((item) => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = state.checked.has(item.id);
        input.dataset.id = item.id;
        label.append(input, document.createTextNode(item.label));
        li.append(label);
        return li;
      }),
    );
  }

  function render() {
    renderList("left");
    renderList("right");
    const leftChecked = state.left.filter((i) => state.checked.has(i.id)).length;
    const rightChecked = state.right.filter((i) => state.checked.has(i.id)).length;
    const enabled = {
      "all-right": state.left.length > 0,
      right: leftChecked > 0,
      left: rightChecked > 0,
      "all-left": state.right.length > 0,
    };
    for (const button of buttons) button.disabled = !enabled[button.dataset.action];
  }

  // Move every item in \`ids\` from one side to the other; keep original order on both sides.
  function move(from, to, ids) {
    const moving = state[from].filter((item) => ids.has(item.id));
    if (moving.length === 0) return;
    state[from] = state[from].filter((item) => !ids.has(item.id));
    state[to] = [...state[to], ...moving];
    moving.forEach((m) => state.checked.delete(m.id));
    render();
  }
  const all = (side) => new Set(state[side].map((i) => i.id));

  // One change listener covers every checkbox on both sides.
  root.addEventListener("change", (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    const id = input.dataset.id;
    if (state.checked.has(id)) state.checked.delete(id);
    else state.checked.add(id);
    render();
  });

  root.querySelector(".transfer__controls").addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "all-right") move("left", "right", all("left"));
    else if (action === "right") move("left", "right", state.checked);
    else if (action === "left") move("right", "left", state.checked);
    else if (action === "all-left") move("right", "left", all("right"));
  });

  render();
  return { state, move };
}

initTransferList(document.querySelector(".transfer"), { initialLeft: ITEMS });
`;

const transferUi: UiWorkspace = {
  framework: "react",
  files: [{ name: "App.jsx", contents: transferReactStarter }, transferCss],
  solution: [{ name: "App.jsx", contents: transferReactSolution }, transferCss],
  alternate: {
    framework: "vanilla",
    files: [transferHtml, { name: "script.js", contents: transferVanillaStarter }, transferCss],
    solution: [transferHtml, { name: "script.js", contents: transferVanillaSolution }, transferCss],
  },
};

export const airbnbProblemsF: Problem[] = [
  {
    slug: "transfer-list",
    title: "Transfer List",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Two arrays and one Set of checked ids — the widget a 2024 candidate ran out of time on.",
    prompt: `Implement a Transfer List — the MUI-style widget: two lists of items with checkboxes, buttons to move the checked items right or left, plus "move all" in each direction. Reported as the third question of a 2024 Airbnb loop (after Debounce and a Promise); the candidate ran out of time here and was rejected, so aim for a **working version in ~15 minutes**, then polish. Available as a React template and an HTML/CSS/JS one.

## Requirements

- Each item has a checkbox; items can be checked on either side.
- **›** moves the checked items from Available to Chosen; **‹** moves the checked items back. Moved items land at the end of the other list and become unchecked.
- **≫** / **≪** move everything regardless of checkboxes.
- Each button is disabled when it would do nothing (nothing checked on that side; that side empty).
- Each list shows its count in the legend and an "Empty" note when it has no items.
- Order is preserved within each list.

## Follow-up

A "select all" header checkbox with an indeterminate state. Searching within a list without losing items. Making it controlled (\`value\` / \`onChange\`). 1000+ items. Drag and drop as sugar on top of the accessible buttons.

## Worth asking out loud

Does order matter after moving — keep original order or append? Can items be checked on both sides at once? Does "move all" ignore the checkboxes? Controlled or self-contained?`,
    hints: [
      "State is two arrays plus one Set of checked ids — ids are unique across both sides, so one Set covers both lists. Moving is filter-out-of-one, append-to-the-other, then drop the moved ids from the Set.",
      "Write one move(from, to, ids) and call it four ways: the two arrow buttons pass the checked Set, the two move-all buttons pass a Set of every id on that side.",
      "Real checkboxes inside labels give you keyboard support for free; derive each button's disabled state from the arrays and the Set instead of tracking it.",
    ],
    solution: `## Approach

State is \`left\`, \`right\` (arrays of items) plus a single \`Set\` of checked ids — ids are unique across both sides, so one Set is enough. Moving is a filter out of one array, an append to the other, and a delete of the moved ids from the Set; one \`move(from, to, ids)\` serves all four buttons, with the move-all buttons passing a Set of every id on that side. Real checkboxes inside \`<label>\`s give keyboard support for free, \`fieldset\`/\`legend\` name each list, and every disabled state is derived rather than stored. The vanilla version keeps the same model in a closure, re-renders both lists from it, and listens once for \`change\` and once for \`click\`.

## Worth saying out loud

- Derive, don't store: counts, empty states, and the four disabled flags all come from the two arrays and the Set — there's nothing to keep in sync.
- Preserving order on both sides is one clarifying question worth asking; appending keeps the model trivial and matches MUI.
- "Select all" is a header checkbox whose \`indeterminate\` property is set through a ref; search filters the *visible* items while the source arrays stay intact; 1000+ items means virtualizing each list; drag and drop is sugar — the buttons stay as the accessible path.`,
    ui: transferUi,
  },
];
