import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part G: Data Table and File Explorer from
// GreatFrontEnd's list, in React, each with one template and complete
// reference files.

const BASE_CSS = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}
`;

// -- data table (React) -------------------------------------------------------

const tableCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.table {
  padding: 16px;
}

table {
  border-collapse: collapse;
  width: 100%;
  max-width: 560px;
  background: white;
}

th,
td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #e4e4e7;
}

th button {
  all: unset;
  cursor: pointer;
  font-weight: 600;
}

th button::after {
  content: " \\2195";
  color: #a1a1aa;
}

th button[data-direction="ascending"]::after {
  content: " \\2191";
  color: #18181b;
}

th button[data-direction="descending"]::after {
  content: " \\2193";
  color: #18181b;
}

.table__footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.table__footer button,
.table__footer select {
  padding: 4px 10px;
  border: 1px solid #a1a1aa;
  border-radius: 6px;
  background: white;
  font: inherit;
}

.table__footer button:disabled {
  opacity: 0.4;
}
`,
};

const tableShared = `const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "occupation", label: "Occupation" },
];

const NAMES = ["Alice", "Ben", "Chloe", "Dev", "Erin", "Farah", "Gus", "Hana", "Ivan", "Jo", "Kai", "Lena", "Mo", "Nia", "Omar", "Pia", "Quinn", "Ravi", "Sol", "Tess", "Uma", "Vik", "Wren", "Xi", "Yara", "Zed"];
const JOBS = ["Engineer", "Designer", "Analyst", "Manager", "Writer"];

const USERS = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  age: 22 + ((i * 7) % 40),
  occupation: JOBS[i % JOBS.length],
}));

const PAGE_SIZES = [5, 10, 20];
`;

const tableReactStarter = `import { useState } from "react";

${tableShared}
export default function App() {
  const [pageSize, setPageSize] = useState(5);
  // TODO: show one page of users, with Previous and Next, a page-size
  // selector, and sorting by clicking a column header.
  const rows = USERS.slice(0, pageSize);
  return (
    <main className="table">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} scope="col">
                <button type="button">{column.label}</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id}>
              {COLUMNS.map((column) => (
                <td key={column.key}>{user[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table__footer">
        <label>
          Show{" "}
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled>Previous</button>
        <span>Page 1 of 1</span>
        <button type="button" disabled>Next</button>
      </div>
    </main>
  );
}
`;

const tableReactSolution = `import { useState } from "react";

${tableShared}
export default function App() {
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null); // { key, direction: "asc" | "desc" } or null

  // Sorted and paged rows are derived; the state is just the three controls.
  const sorted = sort
    ? [...USERS].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        const order = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
        return sort.direction === "asc" ? order : -order;
      })
    : USERS;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  function toggleSort(key) {
    // Click cycles: ascending, descending, then back to the original order.
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
    setPage(1);
  }

  function changePageSize(size) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <main className="table">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort && sort.key === column.key;
              return (
                <th key={column.key} scope="col" aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" data-direction={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined} onClick={() => toggleSort(column.key)}>
                    {column.label}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id}>
              {COLUMNS.map((column) => (
                <td key={column.key}>{user[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table__footer">
        <label>
          Show{" "}
          <select value={pageSize} onChange={(e) => changePageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
        <span aria-live="polite">Page {current} of {pageCount}</span>
        <button type="button" disabled={current === pageCount} onClick={() => setPage(current + 1)}>Next</button>
      </div>
    </main>
  );
}
`;

// -- file explorer (React) ----------------------------------------------------

const explorerCss: UiFile = {
  name: "styles.css",
  contents: `${BASE_CSS}
.explorer {
  padding: 16px;
}

.explorer ul {
  list-style: none;
  margin: 0;
  padding-left: 20px;
}

.explorer > ul {
  padding-left: 0;
}

.entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-radius: 4px;
}

.entry--file {
  padding-left: 24px;
}

.entry button {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.entry button::before {
  content: "\\25B6";
  display: inline-block;
  width: 12px;
  font-size: 10px;
  color: #71717a;
  transition: transform 120ms;
}

.entry button[aria-expanded="true"]::before {
  transform: rotate(90deg);
}
`,
};

const explorerShared = `const FILES = [
  {
    id: 1,
    name: "README.md",
  },
  {
    id: 2,
    name: "Documents",
    children: [
      { id: 3, name: "Word.doc" },
      { id: 4, name: "Powerpoint.ppt" },
    ],
  },
  {
    id: 5,
    name: "Downloads",
    children: [
      { id: 6, name: "unnamed.txt" },
      {
        id: 7,
        name: "Misc",
        children: [
          { id: 8, name: "foo.txt" },
          { id: 9, name: "bar.txt" },
        ],
      },
    ],
  },
];

/** Directories first, then files, each group alphabetical. */
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const aDir = Boolean(a.children);
    const bDir = Boolean(b.children);
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
`;

const explorerReactStarter = `import { useState } from "react";

${explorerShared}
export default function App() {
  // TODO: render the tree with directories first, each directory a button
  // that expands and collapses its contents.
  return (
    <main className="explorer">
      <ul>
        {sortEntries(FILES).map((entry) => (
          <li key={entry.id}>
            <div className={"entry" + (entry.children ? "" : " entry--file")}>
              {entry.children ? <button type="button" aria-expanded={false}>{entry.name}</button> : entry.name}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

const explorerReactSolution = `import { useState } from "react";

${explorerShared}
function Entries({ entries, expanded, onToggle }) {
  return (
    <ul>
      {sortEntries(entries).map((entry) => {
        if (!entry.children) {
          return (
            <li key={entry.id}>
              <div className="entry entry--file">{entry.name}</div>
            </li>
          );
        }
        const open = expanded.has(entry.id);
        return (
          <li key={entry.id}>
            <div className="entry">
              <button type="button" aria-expanded={open} onClick={() => onToggle(entry.id)}>
                {entry.name}
              </button>
            </div>
            {open && <Entries entries={entry.children} expanded={expanded} onToggle={onToggle} />}
          </li>
        );
      })}
    </ul>
  );
}

export default function App() {
  const [expanded, setExpanded] = useState(() => new Set());

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="explorer">
      <Entries entries={FILES} expanded={expanded} onToggle={toggle} />
    </main>
  );
}
`;

export const snowflakeUiProblemsG: Problem[] = [
  {
    slug: "data-table",
    title: "Data Table",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Three pieces of state — page, page size, sort — and rows derived from them in render.",
    prompt: [
      "Build a users table with pagination and sorting over the data in the starter.",
      "",
      "## Requirements",
      "",
      "- Show one page of rows with Previous and Next buttons, disabled at the ends, and a \"Page x of y\" label.",
      "- A page-size selector (5, 10, 20) that returns to the first page when changed.",
      "- Clicking a column header sorts by that column: ascending, then descending on the second click, then back to the original order. Numbers sort numerically, text alphabetically.",
      "- Sorting resets to the first page, and the current sort is indicated on the header.",
      "- Never mutate the data array.",
    ].join("\n"),
    hints: [
      "Derive `sorted` from the sort state (copy before sorting), then `rows` from the page and page size; nothing else needs to be stored.",
      "Clamp the page to the last page when the page size grows, so a change never leaves an empty table.",
      "`aria-sort` on the header announces the direction to assistive tech.",
    ],
    solution: [
      "## Approach",
      "",
      "State holds the page, the page size and the sort `{ key, direction }`. Each render copies and sorts the data if a sort is set, computes the page count, clamps the page, and slices the current page. Header clicks cycle the sort through ascending, descending and none; page-size and sort changes reset the page to 1.",
      "",
      "## Worth saying out loud",
      "",
      "- Sorting on every render is O(n log n); memoise with `useMemo` keyed on the sort when the data is large, or sort on the server with the page and sort in the URL.",
      "- Column filters, row selection and virtualised rows are the usual follow-ups; each is more derived data, not more state.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: tableReactStarter }, tableCss],
      solution: [{ name: "App.jsx", contents: tableReactSolution }, tableCss],
    },
  },
  {
    slug: "file-explorer",
    title: "File Explorer",
    category: "frontend",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A recursive component over nested data, with a set of expanded ids as the only state.",
    prompt: [
      "Build a file explorer for the nested data in the starter.",
      "",
      "## Requirements",
      "",
      "- Directories come before files at every level; within each group entries are alphabetical.",
      "- A directory is a button that expands or collapses its contents; collapsed directories render nothing beneath them.",
      "- Nesting is unlimited and each level is indented.",
      "- Expanding one directory does not affect any other.",
      "- The button reports its state with `aria-expanded`.",
    ].join("\n"),
    hints: [
      "A component that renders a list of entries and calls itself for a directory's children handles any depth.",
      "Keep the expanded directory ids in a `Set` in the top-level component and pass it down with a toggle callback.",
      "Sort a copy of each level's entries: directories first, then by name.",
    ],
    solution: [
      "## Approach",
      "",
      "The top-level component owns a set of expanded ids and a toggle. A recursive `Entries` component sorts its level, renders files as plain rows and directories as buttons, and renders the children only when the directory's id is in the set. Because the set is the only state, collapsing and expanding anywhere in the tree is one update.",
      "",
      "## Worth saying out loud",
      "",
      "- Lazy-loading a directory's children on first expand (an async fetch keyed by id) is the realistic follow-up; the expanded set stays the same.",
      "- Keyboard navigation (arrow keys between items, right to expand) is the `role=\"tree\"` pattern.",
      "- Sorting per render is fine for small trees; memoise per node if the tree is large.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: explorerReactStarter }, explorerCss],
      solution: [{ name: "App.jsx", contents: explorerReactSolution }, explorerCss],
    },
  },
];
