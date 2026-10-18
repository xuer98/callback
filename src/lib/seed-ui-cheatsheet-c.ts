import type { Problem, UiFile } from "./types";

// The UI-cheatsheet track, part C: the windowed list (too many items) in
// React, with complete reference files.

const windowCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.page {
  max-width: 480px;
  padding: 16px;
}

.viewport {
  overflow-y: auto;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #ffffff;
}

.viewport:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.spacer {
  position: relative;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  padding: 0 12px;
  border-bottom: 1px solid #f4f4f5;
}

.row__id {
  width: 48px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #71717a;
}

.footer {
  margin: 8px 0 0;
  font-size: 13px;
  color: #52525b;
}
`,
};

const windowData = `const WORDS = [
  "alder", "birch", "cedar", "elm", "fir", "hazel", "larch",
  "maple", "oak", "pine", "rowan", "spruce", "willow", "yew",
];

const ROWS = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  label: WORDS[i % WORDS.length] + " " + WORDS[(i * 7) % WORDS.length],
}));
`;

const windowDemo = `
export default function App() {
  return (
    <main className="page">
      <WindowedList
        rows={ROWS}
        rowHeight={36}
        height={400}
        renderRow={(row) => (
          <>
            <span className="row__id">{row.id}</span>
            <span>{row.label}</span>
          </>
        )}
      />
    </main>
  );
}
`;

const windowReactStarter =
  `import { useState } from "react";

` +
  windowData +
  `
// TODO: render only the rows inside the viewport (plus a little overscan),
// keep the scrollbar honest with a full-height spacer, and keep keys stable.
export function WindowedList({ rows, rowHeight, height, renderRow }) {
  return (
    <>
      <div className="viewport" style={{ height }} tabIndex={0}>
        {rows.map((row) => (
          <div key={row.id} className="row" style={{ height: rowHeight }}>
            {renderRow(row)}
          </div>
        ))}
      </div>
      <p className="footer">
        Rendering {rows.length} of {rows.length} rows
      </p>
    </>
  );
}
` +
  windowDemo;

const windowReactSolution =
  `import { useState } from "react";

` +
  windowData +
  `
export function WindowedList({ rows, rowHeight, height, renderRow, overscan = 4 }) {
  const [scrollTop, setScrollTop] = useState(0);

  // Everything below is derived from scrollTop: which rows exist, and where.
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const last = Math.min(
    rows.length,
    Math.ceil((scrollTop + height) / rowHeight) + overscan,
  );
  const visible = rows.slice(first, last);

  return (
    <>
      <div
        className="viewport"
        style={{ height }}
        tabIndex={0}
        role="list"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {/* As tall as the whole list, so the scrollbar is honest. */}
        <div className="spacer" style={{ height: rows.length * rowHeight }}>
          {visible.map((row, i) => (
            <div
              key={row.id}
              role="listitem"
              aria-setsize={rows.length}
              aria-posinset={first + i + 1}
              className="row"
              style={{
                position: "absolute",
                top: (first + i) * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
              }}
            >
              {renderRow(row)}
            </div>
          ))}
        </div>
      </div>
      <p className="footer">
        Rendering {visible.length} of {rows.length} rows
      </p>
    </>
  );
}
` +
  windowDemo;

export const uiCheatsheetProblemsC: Problem[] = [
  {
    slug: "windowed-list",
    title: "Windowed List",
    category: "frontend",
    difficulty: "medium",
    companies: [],
    summary:
      "One state value, scrollTop; a spacer as tall as the whole list; and only the rows under the viewport in the DOM, keyed by id.",
    prompt: [
      "Render ten thousand rows in a box 400 px tall without putting ten thousand nodes in the DOM.",
      "",
      "The starter's `WindowedList` renders every row of `ROWS` inside a scrolling viewport. Make it a window instead.",
      "",
      "## Requirements",
      "",
      "- Only the rows that intersect the viewport exist in the DOM, plus a small overscan above and below so fast scrolling doesn't flash blank. The footer's **Rendering N of 10000 rows** must report the real count.",
      "- The scrollbar reflects the whole list: its range matches `rows.length × rowHeight`, and dragging the thumb to the bottom lands on the last row.",
      "- Row height is fixed and passed in; what a row looks like comes from `renderRow(row)`. The component must not know what a row is.",
      "- Keys stay stable as the window slides, so a row that stays visible is not remounted.",
      "- Scrolling stays smooth: nothing reads layout during render, and no listener is added per render.",
    ].join("\n"),
    hints: [
      "The only state is `scrollTop`. The first visible index is `floor(scrollTop / rowHeight)`, the last is `ceil((scrollTop + height) / rowHeight)`. Widen both by the overscan and clamp to the list.",
      "A spacer `div` as tall as the whole list gives the viewport its scroll range; position each rendered row absolutely at `index × rowHeight` inside it. One element to size, no top and bottom spacers to keep in sync.",
      "Key by the row's id, not its index in the slice: as the window slides, index 0 is a different row every time.",
    ],
    solution: [
      "## Approach",
      "",
      "- One state value, `scrollTop`, written by the viewport's `onScroll`. The visible range is derived from it every render: `first = floor(scrollTop / rowHeight) − overscan`, `last = ceil((scrollTop + height) / rowHeight) + overscan`, both clamped.",
      "- The viewport holds one spacer whose height is `rows.length × rowHeight`; the browser draws a real scrollbar from that. Each rendered row sits absolutely at `top: index × rowHeight`, so sliding the window moves nothing: rows mount and unmount, and the ones that stay don't move.",
      "- Keys are row ids. With index keys React would reuse the same nodes for different rows and re-render all of them on every scroll; with ids it mounts only the few that entered.",
      '- `role="list"` on the viewport and `aria-setsize` / `aria-posinset` on each item tell a screen reader how long the list really is, since it cannot count rows that aren\'t rendered. The viewport is focusable so the arrow keys scroll it.',
      "- A render per scroll event is fine: it touches `visible.length` rows and reads no layout. `rowHeight` is a prop, not a measurement.",
      "",
      "## Worth saying out loud",
      "",
      "- Variable row heights are the real follow-up: measure rows after they mount (`ResizeObserver`), keep a prefix-sum array of offsets, and binary-search `scrollTop` for the first index.",
      "- Horizontal windowing is the same arithmetic on columns; a grid does both — see [Design a Collaborative Spreadsheet (Front End)](/problems/design-collaborative-spreadsheet).",
      "- Ten thousand rows made the DOM the bottleneck; a million makes the data the bottleneck, and the list should page from the server behind the same `rows` prop.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: windowReactStarter }, windowCss],
      solution: [{ name: "App.jsx", contents: windowReactSolution }, windowCss],
    },
  },
];
