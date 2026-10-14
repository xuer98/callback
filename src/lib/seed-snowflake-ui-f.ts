import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part F: Pixel Art and Nested Checkboxes from
// GreatFrontEnd's list, in React, each with one template and complete
// reference files.

const BASE_CSS = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}
`;

// -- pixel art (React) --------------------------------------------------------

const pixelCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.pixel {
  padding: 16px;
}

.pixel__tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.swatch {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.swatch[aria-pressed="true"] {
  border-color: #18181b;
}

.pixel__tools button:not(.swatch) {
  padding: 4px 10px;
  border: 1px solid #a1a1aa;
  border-radius: 6px;
  background: white;
  font: inherit;
  cursor: pointer;
}

.pixel__tools button[aria-pressed="true"]:not(.swatch) {
  background: #18181b;
  color: white;
}

.pixel__canvas {
  display: grid;
  grid-template-columns: repeat(15, 24px);
  border: 1px solid #a1a1aa;
  width: max-content;
  user-select: none;
  touch-action: none;
}

.px {
  width: 24px;
  height: 24px;
  box-shadow: inset 0 0 0 1px #e4e4e7;
  background: white;
}
`,
};

const pixelShared = `const SIZE = 15;
const PALETTE = ["#18181b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
`;

const pixelReactStarter = `import { useState } from "react";

${pixelShared}
export default function App() {
  const [color, setColor] = useState(PALETTE[0]);
  // TODO: paint cells with the chosen colour on click and while dragging,
  // an erase mode that clears them, and a Clear button.
  return (
    <main className="pixel">
      <div className="pixel__tools">
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className="swatch"
            style={{ background: swatch }}
            aria-label={"Colour " + swatch}
            aria-pressed={color === swatch}
            onClick={() => setColor(swatch)}
          />
        ))}
        <button type="button" aria-pressed={true}>Draw</button>
        <button type="button" aria-pressed={false}>Erase</button>
        <button type="button">Clear</button>
      </div>
      <div className="pixel__canvas" role="grid" aria-label="Pixel canvas">
        {Array.from({ length: SIZE * SIZE }, (_, index) => (
          <div key={index} role="gridcell" className="px" />
        ))}
      </div>
    </main>
  );
}
`;

const pixelReactSolution = `import { useEffect, useState } from "react";

${pixelShared}
export default function App() {
  const [color, setColor] = useState(PALETTE[0]);
  const [mode, setMode] = useState("draw"); // "draw" | "erase"
  const [pixels, setPixels] = useState(() => Array(SIZE * SIZE).fill(null));
  const [painting, setPainting] = useState(false);

  // A press starts a stroke; releasing anywhere ends it.
  useEffect(() => {
    if (!painting) return;
    const stop = () => setPainting(false);
    document.addEventListener("pointerup", stop);
    return () => document.removeEventListener("pointerup", stop);
  }, [painting]);

  function paint(index) {
    const next = mode === "erase" ? null : color;
    setPixels((prev) => (prev[index] === next ? prev : prev.map((px, i) => (i === index ? next : px))));
  }

  return (
    <main className="pixel">
      <div className="pixel__tools">
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className="swatch"
            style={{ background: swatch }}
            aria-label={"Colour " + swatch}
            aria-pressed={mode === "draw" && color === swatch}
            onClick={() => {
              setColor(swatch);
              setMode("draw");
            }}
          />
        ))}
        <button type="button" aria-pressed={mode === "draw"} onClick={() => setMode("draw")}>Draw</button>
        <button type="button" aria-pressed={mode === "erase"} onClick={() => setMode("erase")}>Erase</button>
        <button type="button" onClick={() => setPixels(Array(SIZE * SIZE).fill(null))}>Clear</button>
      </div>
      <div className="pixel__canvas" role="grid" aria-label="Pixel canvas">
        {pixels.map((px, index) => (
          <div
            key={index}
            role="gridcell"
            className="px"
            style={px ? { background: px } : undefined}
            onPointerDown={() => {
              setPainting(true);
              paint(index);
            }}
            onPointerEnter={() => {
              if (painting) paint(index);
            }}
          />
        ))}
      </div>
    </main>
  );
}
`;

// -- nested checkboxes (React) ------------------------------------------------

const nestedCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.tree {
  padding: 16px;
}

.tree ul {
  list-style: none;
  margin: 0;
  padding-left: 24px;
}

.tree > ul {
  padding-left: 0;
}

.tree label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
}

.tree input {
  width: 16px;
  height: 16px;
}
`,
};

const nestedShared = `const TREE = [
  {
    id: "electronics",
    name: "Electronics",
    children: [
      {
        id: "mobile",
        name: "Mobile phones",
        children: [
          { id: "iphone", name: "iPhone" },
          { id: "android", name: "Android" },
        ],
      },
      {
        id: "laptops",
        name: "Laptops",
        children: [
          { id: "macbook", name: "MacBook" },
          { id: "surface", name: "Surface Pro" },
        ],
      },
    ],
  },
  {
    id: "books",
    name: "Books",
    children: [
      { id: "fiction", name: "Fiction" },
      { id: "nonfiction", name: "Non-fiction" },
    ],
  },
  { id: "toys", name: "Toys" },
];

/** The ids of the leaves under a node (the node itself when it has no children). */
function leafIds(node) {
  return node.children ? node.children.flatMap(leafIds) : [node.id];
}
`;

const nestedReactStarter = `import { useState } from "react";

${nestedShared}
function Branch({ nodes }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          <label>
            <input type="checkbox" />
            {node.name}
          </label>
          {node.children && <Branch nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const [checked, setChecked] = useState(() => new Set());
  // TODO: checking a parent checks everything under it; a parent shows as
  // checked when all its leaves are, and indeterminate when only some are.
  return (
    <main className="tree">
      <Branch nodes={TREE} />
    </main>
  );
}
`;

const nestedReactSolution = `import { useState } from "react";

${nestedShared}
function Branch({ nodes, checked, onToggle }) {
  return (
    <ul>
      {nodes.map((node) => {
        const leaves = leafIds(node);
        const count = leaves.filter((id) => checked.has(id)).length;
        const all = count === leaves.length;
        const some = count > 0 && !all;
        return (
          <li key={node.id}>
            <label>
              <input
                type="checkbox"
                checked={all}
                // indeterminate is a DOM property, not an attribute: set it on the node.
                ref={(input) => {
                  if (input) input.indeterminate = some;
                }}
                onChange={() => onToggle(leaves, !all)}
              />
              {node.name}
            </label>
            {node.children && <Branch nodes={node.children} checked={checked} onToggle={onToggle} />}
          </li>
        );
      })}
    </ul>
  );
}

export default function App() {
  // Only leaves are stored; every parent's state is derived from its leaves.
  const [checked, setChecked] = useState(() => new Set());

  function toggle(leaves, on) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const id of leaves) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  return (
    <main className="tree">
      <Branch nodes={TREE} checked={checked} onToggle={toggle} />
    </main>
  );
}
`;

export const snowflakeUiProblemsF: Problem[] = [
  {
    slug: "pixel-art",
    title: "Pixel Art",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A flat array of 225 colours, a palette, draw and erase modes, and a stroke that paints while the pointer is held.",
    prompt: [
      "Build a pixel-art editor: a 15 by 15 canvas, a palette of colours, Draw and Erase modes, and a Clear button.",
      "",
      "## Requirements",
      "",
      "- Clicking a cell paints it with the selected colour (or clears it in Erase mode).",
      "- Pressing and dragging paints every cell the pointer passes over, until release anywhere on the page.",
      "- Picking a swatch selects that colour and switches back to Draw mode; the active swatch and mode are visibly marked.",
      "- Clear empties the canvas.",
      "- Painting a cell with the colour it already has does not re-render the canvas.",
    ].join("\n"),
    hints: [
      "One flat array of `SIZE * SIZE` colour strings (or null) is the whole drawing; the cell index is the array index.",
      "Painting while dragging is `onPointerDown` (start the stroke and paint) plus `onPointerEnter` (paint if a stroke is active), with a document `pointerup` listener to end it.",
      "Return the previous array unchanged when nothing changes, so React skips the render.",
    ],
    solution: [
      "## Approach",
      "",
      "State is the colour, the mode, the pixel array and a `painting` flag. Painting maps the array to a new one with the single changed cell, or returns the old array when the cell already has the target value. The stroke is tracked with the same pointer pattern as a selectable grid: start on press, extend on enter, end on a document-level release.",
      "",
      "## Worth saying out loud",
      "",
      "- Event delegation on the canvas with `dataset` indices scales better than 225 handlers; mention it.",
      "- Export as PNG (draw the array onto a `<canvas>`), undo (a stack of pixel arrays) and a fill bucket (BFS over same-coloured neighbours) are the follow-ups.",
      "- `aria-pressed` on the swatches and mode buttons announces the tool state.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: pixelReactStarter }, pixelCss],
      solution: [{ name: "App.jsx", contents: pixelReactSolution }, pixelCss],
    },
  },
  {
    slug: "nested-checkboxes",
    title: "Nested Checkboxes",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Store only the leaves; every parent's checked and indeterminate state is derived from the leaves beneath it.",
    prompt: [
      "Build a tree of checkboxes from the nested data in the starter.",
      "",
      "## Requirements",
      "",
      "- Checking or unchecking a parent sets every checkbox beneath it the same way.",
      "- A parent shows as checked when all of its descendants are checked, unchecked when none are, and **indeterminate** (the dash state) when some are.",
      "- Changing a leaf updates every ancestor accordingly.",
      "- The tree renders recursively to any depth, with each level indented.",
    ].join("\n"),
    hints: [
      "Keep a set of checked **leaf** ids only. A parent's state is then a count: all leaves checked, none, or some.",
      "A helper that returns the leaf ids under a node drives both the derived state and the toggle.",
      "`indeterminate` is not an HTML attribute; set it on the input element through a ref callback.",
    ],
    solution: [
      "## Approach",
      "",
      "A recursive `Branch` component renders each node. For every node it computes the leaves beneath it and how many are in the checked set: all → checked, some → indeterminate (set via a ref callback, since it is a DOM property), none → unchecked. Toggling a node adds or removes all of its leaves from the set, which makes parents and children consistent by construction.",
      "",
      "## Worth saying out loud",
      "",
      "- Storing a checked flag on every node means two sources of truth; the leaves-only model has none.",
      "- Recomputing leaves on each render is O(n) per node; memoise a node-to-leaves map for big trees.",
      "- The control is a tree: `role=\"tree\"`/`treeitem` with `aria-checked` is the fuller accessible version.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: nestedReactStarter }, nestedCss],
      solution: [{ name: "App.jsx", contents: nestedReactSolution }, nestedCss],
    },
  },
];
