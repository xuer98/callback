import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), UI part A:
// nested tabs built from a flat list (an IC3 technical round, 2025) and the
// CSS-only masonry round (a senior full-stack loop, 2025). Both ship one
// template with complete reference files; the preview has no network, so
// fixtures live in the files.

// -- nested tabs --------------------------------------------------------------

const tabsData: UiFile = {
  name: "data.js",
  contents: `// Flat rows, as an API returns them. A child can come before its parent,
// and one row points at a parent that isn't in the list.
export const ITEMS = [
  { id: 12, name: "Pro", parentId: 11, content: "The larger, faster model." },
  { id: 1, name: "Laptops", parentId: null },
  { id: 4, name: "13-inch", parentId: 1, content: "Light enough to forget it's in the bag." },
  { id: 2, name: "Phones", parentId: null },
  { id: 5, name: "15-inch", parentId: 1, content: "More screen, same thin frame." },
  { id: 10, name: "Standard", parentId: 2, content: "The everyday model." },
  { id: 11, name: "Pro models", parentId: 2 },
  { id: 13, name: "Pro Max", parentId: 11, content: "The biggest screen in the range." },
  { id: 3, name: "Watches", parentId: null },
  { id: 14, name: "Sport", parentId: 3, content: "Water-resistant to 50 m." },
  { id: 15, name: "Outdoor", parentId: 3, content: "Titanium case, two-day battery." },
  { id: 16, name: "Gift cards", parentId: 99, content: "Its parent (99) isn't in the list, so it shows at the top level." },
];
`,
};

const tabsCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.tabs-demo {
  padding: 16px;
}

h1 {
  margin: 0 0 12px;
  font-size: 18px;
}

.tablist {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-bottom: 1px solid #e4e4e7;
}

.tab {
  padding: 6px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  font: inherit;
  color: #52525b;
  cursor: pointer;
}

.tab[aria-selected="true"] {
  border-bottom-color: #2563eb;
  color: #18181b;
}

.tab:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.panel {
  padding: 12px 0 0 12px;
}

.panel p {
  margin: 0;
  color: #3f3f46;
}

.raw {
  color: #52525b;
  font-size: 14px;
}
`,
};

const tabsStarter = `import { ITEMS } from "./data.js";

// The rows arrive flat: { id, name, parentId, content? }. Build the tree,
// then render each level as a row of tabs under its selected parent.

/** Return the top-level nodes, each with a \`children\` array. */
export function buildTree(items) {
  // Your code here
  return [];
}

export default function App() {
  // Your code here: nested tabs. The flat rows are listed for reference.
  return (
    <div className="tabs-demo">
      <h1>Catalog</h1>
      <ul className="raw">
        {ITEMS.map((item) => (
          <li key={item.id}>
            {item.name} (parent: {String(item.parentId)})
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

const tabsSolution = `import { useMemo, useState } from "react";
import { ITEMS } from "./data.js";

/** Link flat rows into a forest in O(n), even when a child precedes its parent. */
export function buildTree(items) {
  // Build the map first, then link: every parent exists before any lookup.
  const nodes = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parentId == null ? undefined : nodes.get(node.parentId);
    (parent ? parent.children : roots).push(node); // an unknown parent makes a root
  }
  return roots;
}

function TabGroup({ nodes, level, path, onSelect, label }) {
  const selected = nodes.find((node) => node.id === path[level]) ?? nodes[0];

  // Arrow keys move the selection along the row; roving tabindex keeps one tab stop.
  const onKeyDown = (event) => {
    const i = nodes.indexOf(selected);
    let next = null;
    if (event.key === "ArrowRight") next = (i + 1) % nodes.length;
    else if (event.key === "ArrowLeft") next = (i - 1 + nodes.length) % nodes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = nodes.length - 1;
    if (next === null) return;
    event.preventDefault();
    onSelect(level, nodes[next].id);
    event.currentTarget.children[next].focus();
  };

  return (
    <div className="tab-group">
      <div role="tablist" aria-label={label} className="tablist" onKeyDown={onKeyDown}>
        {nodes.map((node) => {
          const active = node === selected;
          return (
            <button
              key={node.id}
              type="button"
              role="tab"
              id={"tab-" + node.id}
              aria-selected={active}
              aria-controls={"panel-" + node.id}
              tabIndex={active ? 0 : -1}
              className="tab"
              onClick={() => onSelect(level, node.id)}
            >
              {node.name}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={"panel-" + selected.id} aria-labelledby={"tab-" + selected.id} className="panel">
        {selected.children.length > 0 ? (
          <TabGroup nodes={selected.children} level={level + 1} path={path} onSelect={onSelect} label={selected.name} />
        ) : (
          <p>{selected.content ?? "Nothing here yet."}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // The tree only changes when the list does.
  const tree = useMemo(() => buildTree(ITEMS), []);
  const [path, setPath] = useState([]); // the selected id at each level
  const select = (level, id) => setPath((prev) => [...prev.slice(0, level), id]);

  return (
    <div className="tabs-demo">
      <h1>Catalog</h1>
      {tree.length > 0 ? (
        <TabGroup nodes={tree} level={0} path={path} onSelect={select} label="Categories" />
      ) : (
        <p>No items.</p>
      )}
    </div>
  );
}
`;

const tabsUi: UiWorkspace = {
  framework: "react",
  files: [{ name: "App.jsx", contents: tabsStarter }, tabsData, tabsCss],
  solution: [{ name: "App.jsx", contents: tabsSolution }, tabsData, tabsCss],
};

// -- masonry ------------------------------------------------------------------

const CARD_HEIGHTS = [180, 260, 140, 320, 200, 150, 280, 230, 170, 300, 190, 250, 160, 270, 210, 140, 310, 180, 240, 200];
const CARD_COLORS = ["#fde68a", "#bfdbfe", "#fecaca", "#bbf7d0", "#ddd6fe", "#fed7aa", "#a5f3fc", "#fbcfe8"];
const CARD_CAPTIONS = [
  "Morning light",
  "A long caption that wraps onto a second line, like real ones do",
  "Tiles",
  "Ridge walk",
  "Market day, early",
  "Blue door",
  "Tide pools at low water",
  "Studio",
];

const masonryHtml: UiFile = {
  name: "index.html",
  contents: `<main class="page">
  <h1>Boards</h1>
  <section class="masonry" aria-label="Pins">
${CARD_HEIGHTS.map(
  (h, i) => `    <article class="card">
      <div class="card__media" style="height: ${h}px; background: ${CARD_COLORS[i % CARD_COLORS.length]}"></div>
      <p class="card__caption">${i + 1}. ${CARD_CAPTIONS[i % CARD_CAPTIONS.length]}</p>
    </article>`,
).join("\n")}
  </section>
</main>
`,
};

const masonryStarterCss = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}

.page {
  padding: 16px;
}

h1 {
  margin: 0 0 12px;
  font-size: 18px;
}

/* A plain grid: every row is as tall as its tallest card, so shorter cards
   leave gaps underneath. Turn this into a masonry layout. */
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.card {
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  overflow: hidden;
}

.card__media {
  width: 100%;
}

.card__caption {
  margin: 0;
  padding: 8px 10px 10px;
  font-size: 13px;
  line-height: 1.4;
}
`;

const masonrySolutionCss = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #fafafa;
}

.page {
  padding: 16px;
}

h1 {
  margin: 0 0 12px;
  font-size: 18px;
}

/* Multi-column layout: as many 220px-or-wider columns as fit, at most four.
   Cards stack down each column, so every column packs tight. */
.masonry {
  columns: 220px 4;
  column-gap: 16px;
}

.card {
  break-inside: avoid; /* never split a card across two columns */
  margin: 0 0 16px; /* the vertical gutter; column-gap is the horizontal one */
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  overflow: hidden;
}

.card__media {
  width: 100%;
}

.card__caption {
  margin: 0;
  padding: 8px 10px 10px;
  font-size: 13px;
  line-height: 1.4;
}
`;

const masonryUi: UiWorkspace = {
  framework: "vanilla",
  files: [masonryHtml, { name: "styles.css", contents: masonryStarterCss }],
  solution: [masonryHtml, { name: "styles.css", contents: masonrySolutionCss }],
};

export const appleUiProblemsA: Problem[] = [
  {
    slug: "flat-list-nested-tabs",
    title: "Nested Tabs From a Flat List",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Turn `{ id, name, parentId }` rows into a tree in one pass, then render every level as tabs under its parent.",
    prompt: [
      "The rows arrive flat, as an API returns them: `{ id, name, parentId, content? }`. Render each item under its parent as **nested tabs**. The top level is a row of tabs, the selected tab's children are another row beneath it, and a leaf shows its `content`.",
      "",
      "## Requirements",
      "",
      "- `buildTree(items)` links the rows into a tree in O(n). It must work when a child is listed before its parent, and it keeps input order among siblings.",
      "- A row whose `parentId` matches nothing becomes a top-level tab. The fixture has one, so you can see where it lands.",
      "- Each level starts on its first tab. Selecting a tab at one level resets the levels below it.",
      "- Each tab row is a `tablist` with `tab`s and a `tabpanel`. The selected tab is the only one in the Tab order, and the arrow keys move along the row.",
      "",
      "## Follow-up",
      "",
      "The round went on to `useMemo` and `useCallback`. Where does each belong here, and where would it add nothing?",
      "",
      "*Reported in: an IC3 front-end technical round (Medium and LeetCode, 2025), which asked for nested tabs or an accordion.*",
    ].join("\n"),
    hints: [
      "Build a `Map` from id to a copy of each row with an empty `children` array first, then link each node to its parent in a second pass. That is O(n), and order-independent.",
      "Keep one piece of state: the selected id at each level, as an array. Selecting at level L keeps the first L entries and replaces the rest with the new id.",
      "A recursive `TabGroup` renders one row of tabs plus a panel. The panel holds another `TabGroup` for the selected node's children, or the leaf's content.",
    ],
    solution: [
      "## Approach",
      "",
      "`buildTree` makes two passes: build the map, then link. Linking in the same pass as creating would miss parents listed later. The UI keeps a single `path` array, the selected id per level, and a recursive `TabGroup` reads its level's selection from it, falling back to the first tab. The tree is derived data, so it is computed once with `useMemo` rather than stored in state.",
      "",
      "## Worth saying out loud",
      "",
      "- **Build the map first, then link.** That makes it O(n), and correct when a child is listed before its parent.",
      "- An unknown `parentId` becomes a root here. Say so, or ask whether such rows should be dropped.",
      "- `useMemo` belongs on `buildTree`, keyed on the list. `useCallback` only matters once a child is memoized with `React.memo`, where a new callback on every render would defeat it.",
      "- Tabs with roving `tabIndex` and arrow keys follow the ARIA tabs pattern. An accordion with `aria-expanded` headings is the other valid answer the prompt allowed.",
    ].join("\n"),
    ui: tabsUi,
  },
  {
    slug: "masonry-layout",
    title: "Masonry Layout in CSS",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Pack cards of different heights into tight columns with CSS alone, then explain what CSS-only masonry cannot do.",
    prompt: [
      "Build a Pinterest-style masonry layout with **CSS only**: cards of different heights packed into columns, with no ragged gaps under the shorter ones. The markup and a plain grid are in the starter. The grid makes each row as tall as its tallest card, which is the problem to fix.",
      "",
      "## Requirements",
      "",
      "- Cards pack tightly down each column.",
      "- The column count adapts to the width, from 1 on a phone to at most 4.",
      "- Gutters are even, horizontally and vertically.",
      "- No card is ever split across two columns.",
      "- Change only `styles.css`.",
      "",
      "## Worth discussing",
      "",
      "What does the CSS-only version do to the **order** of the cards? When would you reach for JavaScript instead?",
      "",
      "*Reported in: a senior full-stack onsite that included \"a CSS masonry round\" (Front End Interview Handbook tips, Aug 2025).*",
    ].join("\n"),
    hints: [
      "CSS multi-column layout (`columns`) flows content down one column and into the next, which is masonry-shaped packing for free.",
      "`columns: 220px 4` means columns at least 220px wide, and at most four of them. The browser picks the count from the width, with no media queries.",
      "In a multi-column container, the vertical gutter is each card's bottom margin, and `break-inside: avoid` keeps a card whole.",
    ],
    solution: [
      "## Approach",
      "",
      "Swap the grid for multi-column layout. `columns: 220px 4` lets the browser choose one to four columns from the available width, and content flows down each column in turn, so every column packs tight. `break-inside: avoid` stops a card from splitting across columns, and a bottom margin supplies the vertical gutter that `column-gap` doesn't cover.",
      "",
      "## Worth saying out loud",
      "",
      "- **CSS columns fill top to bottom.** Cards 1 to 5 go down the first column, so reading order is column by column, not row by row. For a feed, where the newest items belong at the top of every column, place items with JavaScript in the shortest column. That is the algorithm in [Assign Pins to Shortest Columns](/problems/assign-pins-shortest-columns).",
      "- The other JavaScript route is CSS Grid with small fixed rows, where each card spans as many rows as its measured height needs.",
      "- A native masonry mode for CSS Grid is being specified and has shipped experimentally in some browsers. Check support before relying on it.",
      "- Images need their dimensions (`width` and `height` attributes, or `aspect-ratio`) before they load. Without them, every image that arrives shifts the columns.",
    ].join("\n"),
    ui: masonryUi,
  },
];
