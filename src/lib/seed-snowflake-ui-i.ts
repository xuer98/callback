import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part I: Data Table II from GreatFrontEnd's
// list — the generic table from part I grows per-column filters — in React,
// with one template and complete reference files.

const filterTableCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.tables {
  display: grid;
  gap: 24px;
  padding: 16px;
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

table {
  border-collapse: collapse;
  width: 100%;
  max-width: 720px;
  background: white;
}

th,
td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #e4e4e7;
  vertical-align: top;
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

th input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  padding: 4px 6px;
  border: 1px solid #a1a1aa;
  border-radius: 4px;
  font: inherit;
  font-size: 13px;
  font-weight: 400;
}

.range {
  display: flex;
  gap: 4px;
}

.empty {
  color: #71717a;
  text-align: center;
}

.table__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
`,
};

const filterTableShared = `const NAMES = ["Alice", "Ben", "Chloe", "Dev", "Erin", "Farah", "Gus", "Hana", "Ivan", "Jo", "Kai", "Lena", "Mo", "Nia", "Omar", "Pia", "Quinn", "Ravi", "Sol", "Tess", "Uma", "Vik", "Wren", "Xi", "Yara", "Zed"];
const JOBS = ["Engineer", "Designer", "Analyst", "Manager", "Writer"];

const USERS = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  age: 22 + ((i * 7) % 40),
  occupation: JOBS[i % JOBS.length],
}));

const STREETS = ["Maple Ave", "Oak St", "Pine Rd", "Cedar Ln", "Elm Dr", "Birch Ct"];

const HOUSES = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  address: 100 + i * 13 + " " + STREETS[i % STREETS.length],
  price: 250000 + ((i * 97) % 23) * 25000,
  bedrooms: 1 + ((i * 5) % 5),
  bathrooms: 1 + ((i * 3) % 3),
}));

// A column says how its values compare and which filter, if any, it offers.
const USER_COLUMNS = [
  { key: "id", label: "ID", type: "number" },
  { key: "name", label: "Name", type: "string", filter: "text" },
  { key: "age", label: "Age", type: "number", filter: "range" },
  { key: "occupation", label: "Occupation", type: "string", filter: "text" },
];

const HOUSE_COLUMNS = [
  { key: "id", label: "ID", type: "number" },
  { key: "address", label: "Address", type: "string", filter: "text" },
  { key: "price", label: "Price", type: "number", filter: "range", render: (value) => "$" + value.toLocaleString() },
  { key: "bedrooms", label: "Beds", type: "number", filter: "range" },
  { key: "bathrooms", label: "Baths", type: "number", filter: "range" },
];

const PAGE_SIZES = [5, 10, 20];

function compare(a, b, column) {
  return column.type === "number"
    ? a[column.key] - b[column.key]
    : String(a[column.key]).localeCompare(String(b[column.key]));
}

export default function App() {
  return (
    <main className="tables">
      <section>
        <h2>Users</h2>
        <DataTable data={USERS} columns={USER_COLUMNS} />
      </section>
      <section>
        <h2>Houses</h2>
        <DataTable data={HOUSES} columns={HOUSE_COLUMNS} />
      </section>
    </main>
  );
}
`;

const filterTableFooter = `      <div className="table__footer">
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
        <button type="button" disabled={current === pageCount} onClick={() => setPage(current + 1)}>Next</button>`;

const filterTableReactStarter = `import { useState } from "react";

${filterTableShared}
function DataTable({ data, columns }) {
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null); // { key, direction: "asc" | "desc" } or null
  // TODO: per-column filters. A column with filter: "text" gets a search
  // input in its header; filter: "range" gets min and max inputs. Filter
  // before sorting and paging, ignore empty or invalid inputs, and return to
  // page 1 whenever a filter changes.

  const sortColumn = sort && columns.find((column) => column.key === sort.key);
  const sorted = sortColumn
    ? [...data].sort((a, b) => {
        const order = compare(a, b, sortColumn);
        return sort.direction === "asc" ? order : -order;
      })
    : data;
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
    <div className="table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort && sort.key === column.key;
              const direction = active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
              return (
                <th key={column.key} scope="col" aria-sort={direction || "none"}>
                  <button type="button" data-direction={direction} onClick={() => toggleSort(column.key)}>
                    {column.label}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row[column.key]) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
${filterTableFooter}
        <span>{data.length} rows</span>
      </div>
    </div>
  );
}
`;

const filterTableReactSolution = `import { useState } from "react";

${filterTableShared}
/** A numeric bound, or null when the input is empty or not a number. */
function bound(text) {
  if (text === undefined || text === null || String(text).trim() === "") return null;
  const n = Number(text);
  return Number.isNaN(n) ? null : n;
}

/** Whether the row passes the column's filter; a blank filter passes everything. */
function matches(row, column, filter) {
  const value = row[column.key];
  if (column.filter === "text") {
    const needle = (filter || "").trim().toLowerCase();
    return needle === "" || String(value).toLowerCase().includes(needle);
  }
  if (column.filter === "range") {
    const min = bound(filter && filter.min);
    const max = bound(filter && filter.max);
    return (min === null || value >= min) && (max === null || value <= max);
  }
  return true;
}

function DataTable({ data, columns }) {
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null); // { key, direction: "asc" | "desc" } or null
  const [filters, setFilters] = useState({}); // column key -> text, or { min, max }

  // Filter, then sort, then page: each step is derived from the one before,
  // and the only stored values are the controls.
  const filtered = data.filter((row) => columns.every((column) => matches(row, column, filters[column.key])));
  const sortColumn = sort && columns.find((column) => column.key === sort.key);
  const sorted = sortColumn
    ? [...filtered].sort((a, b) => {
        const order = compare(a, b, sortColumn);
        return sort.direction === "asc" ? order : -order;
      })
    : filtered;
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

  function changeFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort && sort.key === column.key;
              const direction = active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
              const range = filters[column.key] || { min: "", max: "" };
              return (
                <th key={column.key} scope="col" aria-sort={direction || "none"}>
                  <button type="button" data-direction={direction} onClick={() => toggleSort(column.key)}>
                    {column.label}
                  </button>
                  {column.filter === "text" && (
                    <input
                      type="search"
                      placeholder="Search"
                      aria-label={"Filter " + column.label}
                      value={filters[column.key] || ""}
                      onChange={(e) => changeFilter(column.key, e.target.value)}
                    />
                  )}
                  {column.filter === "range" && (
                    <div className="range">
                      <input
                        type="number"
                        placeholder="Min"
                        aria-label={"Minimum " + column.label}
                        value={range.min}
                        onChange={(e) => changeFilter(column.key, { ...range, min: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        aria-label={"Maximum " + column.label}
                        value={range.max}
                        onChange={(e) => changeFilter(column.key, { ...range, max: e.target.value })}
                      />
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row[column.key]) : row[column.key]}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="empty" colSpan={columns.length}>No matching rows</td>
            </tr>
          )}
        </tbody>
      </table>
${filterTableFooter}
        <span>{filtered.length} of {data.length} rows</span>
      </div>
    </div>
  );
}
`;

export const snowflakeUiProblemsI: Problem[] = [
  {
    slug: "data-table-filters",
    title: "Data Table II",
    category: "frontend",
    difficulty: "hard",
    companies: ["snowflake"],
    summary:
      "Filters live in the column config and in one state object; rows are filtered, then sorted, then paged.",
    prompt: [
      "The starter generalises [Data Table I](/problems/data-table): a `DataTable` component takes `data` and a `columns` config, pages and sorts any dataset, and is rendered twice, over users and over houses. Add per-column filtering.",
      "",
      "## Requirements",
      "",
      '- A column opts into a filter in its config: `filter: "text"` renders a search input in its header cell, `filter: "range"` renders min and max inputs.',
      "- A text filter keeps the rows whose value contains the input, case-insensitively.",
      "- A range filter keeps the rows whose value lies between min and max, inclusive. Either end may be left open.",
      "- An empty or non-numeric input is ignored, and a row must pass every active filter.",
      '- Filtering happens before sorting and paging, the page count follows the filtered rows, a filter change returns to the first page, and an empty result says "No matching rows".',
      "- `DataTable` stays generic: nothing in it mentions users or houses. Check both tables.",
    ].join("\n"),
    hints: [
      'The column config already carries a `type`; let it also declare its `filter`. The table keeps every filter value in one object keyed by column key: `{ name: "al", price: { min: "", max: "400000" } }`.',
      'An inactive filter — empty text, or a min or max that is not a number — is no constraint at all, not "match nothing". Normalise each bound to a number or `null` before comparing.',
      "Filter, then sort, then page: filtering changes the row count that paging depends on, and sorting fewer rows is cheaper. Resetting the page on every filter change keeps the user off a page that no longer exists.",
    ],
    solution: [
      "## Approach",
      "",
      "One more piece of state, `filters`, holds the raw input strings per column. Each render derives `filtered` by asking every column whether the row passes its filter: text columns compare lowercased strings, range columns parse each bound to a number or `null` and compare only the bounds that parsed. The existing sort and page logic then runs over `filtered` instead of `data`, and page 1 is restored whenever a filter changes. The header cell renders the right control from the column's `filter` field, so a new dataset needs nothing but a column config.",
      "",
      "## Worth saying out loud",
      "",
      "- Keeping the raw strings in state and parsing at filter time means a half-typed `-` or `1e` never throws the row set into an odd state; it is simply inactive until it parses.",
      "- Debounce the text inputs when the data is large, or move filter, sort and page to the server and put all three in the URL.",
      "- Column filters compose with the sort cycle from [Data Table I](/problems/data-table) because every step is derived data; the only stored values are the controls.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [
        { name: "App.jsx", contents: filterTableReactStarter },
        filterTableCss,
      ],
      solution: [
        { name: "App.jsx", contents: filterTableReactSolution },
        filterTableCss,
      ],
    },
  },
];
