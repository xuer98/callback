import {
  DIFFICULTIES,
  LANGUAGE_LABELS,
  LANGUAGES,
  type Language,
  type ProblemCard,
} from "./types";

// The /problems filter: rows that each test one field, combined with "all"
// (every row must hold) or "any" (one is enough). Callback's own problems
// and the imported LeetCode listings share the same rows; a field one kind
// does not have — frequency belongs to the listings, status and language to
// the authored problems — is simply false for it. The filter
// lives in the URL, so a filtered view is a link: this module parses and
// serialises it and evaluates it over the authored problems in memory; the
// listings evaluate the same rows in SQL (data.ts).

export const STATUSES = ["todo", "attempted", "solved"] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  todo: "To do",
  attempted: "Attempted",
  solved: "Solved",
};

/** Fields whose rows pick a set of values. */
export const SET_FIELDS = [
  "company",
  "status",
  "difficulty",
  "topic",
  "language",
] as const;

export type SetField = (typeof SET_FIELDS)[number];

export type FilterField = SetField | "frequency";

/** The rows the panel shows by default, in order. */
export const FILTER_FIELDS: readonly FilterField[] = [
  "company",
  "frequency",
  "status",
  "difficulty",
  "topic",
  "language",
];

export const FIELD_LABELS: Record<FilterField, string> = {
  company: "Companies",
  frequency: "Frequency",
  status: "Status",
  difficulty: "Difficulty",
  topic: "Topics",
  language: "Language",
};

/** Rows that can be true for an authored problem / for a listing. */
export const PROBLEM_FIELDS: ReadonlySet<FilterField> = new Set([
  "company",
  "status",
  "difficulty",
  "topic",
  "language",
]);
export const LISTING_FIELDS: ReadonlySet<FilterField> = new Set([
  "company",
  "frequency",
  "difficulty",
  "topic",
]);

export type SetOp = "is" | "not";

export interface SetRow {
  field: SetField;
  op: SetOp;
  /** Any of these ("is") or none of them ("not"). */
  values: string[];
}

/** Frequency within the chosen time range, 0-100; either bound may be open. */
export interface FrequencyRow {
  field: "frequency";
  min?: number;
  max?: number;
}

export type FilterRow = SetRow | FrequencyRow;

export type MatchMode = "all" | "any";

export interface ProblemFilter {
  match: MatchMode;
  rows: FilterRow[];
  /** Case-insensitive title search; applies whatever the match mode. */
  search: string;
  /** Only the viewer's starred problems; applies whatever the match mode. */
  favorites: boolean;
}

export const EMPTY_FILTER: ProblemFilter = {
  match: "all",
  rows: [],
  search: "",
  favorites: false,
};

export const MAX_SEARCH_LENGTH = 80;

/** What the two data-driven fields may take; the rest are fixed lists. */
export interface FilterOptions {
  companies: readonly string[];
  topics: readonly string[];
}

export type ProgressMap = Record<string, "attempted" | "solved">;

type Params = Record<string, string | string[] | undefined>;

function many(params: Params, key: string): string[] {
  const value = params[key];
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function clampPercent(text: string): number {
  return Math.min(100, Math.max(0, Number(text)));
}

/**
 * The filter in a page's query string. Every value is checked against the
 * known ones, so a hand-edited URL loses the bad values rather than reaching
 * the query. A bare value with no operator ("company=apple", the form older
 * links use) means "is".
 */
export function parseFilter(
  params: Params,
  options: FilterOptions,
): ProblemFilter {
  const allowed: Record<SetField, readonly string[]> = {
    company: options.companies,
    status: STATUSES,
    difficulty: DIFFICULTIES,
    topic: options.topics,
    language: LANGUAGES,
  };
  const rows: FilterRow[] = [];
  for (const field of SET_FIELDS) {
    const known = new Set(allowed[field]);
    for (const raw of many(params, field)) {
      const match = /^(is|not):([\s\S]*)$/.exec(raw);
      const op: SetOp = match?.[1] === "not" ? "not" : "is";
      const values = [
        ...new Set(
          (match ? match[2] : raw)
            .split(",")
            .map((value) => value.trim())
            .filter((value) => known.has(value)),
        ),
      ];
      if (values.length > 0) rows.push({ field, op, values });
    }
  }
  for (const raw of many(params, "frequency")) {
    const match = /^(\d{0,3})-(\d{0,3})$/.exec(raw.trim());
    if (!match) continue;
    let min = match[1] ? clampPercent(match[1]) : undefined;
    let max = match[2] ? clampPercent(match[2]) : undefined;
    if (min === undefined && max === undefined) continue;
    if (min !== undefined && max !== undefined && min > max)
      [min, max] = [max, min];
    rows.push({ field: "frequency", min, max });
  }
  const search = many(params, "q")[0] ?? "";
  return {
    match: many(params, "match")[0] === "any" ? "any" : "all",
    rows,
    search: search.trim().slice(0, MAX_SEARCH_LENGTH),
    favorites: many(params, "favorites")[0] === "1",
  };
}

/** The query-string entries for a filter: none when nothing is active. */
export function filterEntries(filter: ProblemFilter): [string, string][] {
  const entries: [string, string][] = [];
  if (filter.match === "any") entries.push(["match", "any"]);
  for (const row of filter.rows) {
    if (!isActiveRow(row)) continue;
    entries.push(
      row.field === "frequency"
        ? ["frequency", `${row.min ?? ""}-${row.max ?? ""}`]
        : [row.field, `${row.op}:${row.values.join(",")}`],
    );
  }
  if (filter.search) entries.push(["q", filter.search]);
  if (filter.favorites) entries.push(["favorites", "1"]);
  return entries;
}

/** A row with something in it; blank rows are the panel's, not the filter's. */
export function isActiveRow(row: FilterRow): boolean {
  return row.field === "frequency"
    ? row.min !== undefined || row.max !== undefined
    : row.values.length > 0;
}

export function isFiltering(filter: ProblemFilter): boolean {
  return (
    filter.search !== "" || filter.favorites || filter.rows.some(isActiveRow)
  );
}

/** What a filter selects, as a string: the same selection gives the same key, whatever the row order. */
export function filterKey(filter: ProblemFilter): string {
  const rows = filter.rows
    .filter(isActiveRow)
    .map((row) =>
      row.field === "frequency"
        ? `frequency:${row.min ?? ""}-${row.max ?? ""}`
        : `${row.field}:${row.op}:${[...row.values].sort().join(",")}`,
    )
    .sort();
  return JSON.stringify({
    match: filter.match,
    search: filter.search,
    favorites: filter.favorites,
    rows,
  });
}

/**
 * True when nothing of the given kind can match: stars are Callback-only,
 * and under "match all" a row the kind cannot have rules everything out,
 * so the section may as well say so.
 */
export function excludes(
  filter: ProblemFilter,
  kind: "problem" | "listing",
): boolean {
  if (filter.favorites && kind === "listing") return true;
  const fields = kind === "problem" ? PROBLEM_FIELDS : LISTING_FIELDS;
  return (
    filter.match === "all" &&
    filter.rows.some((row) => isActiveRow(row) && !fields.has(row.field))
  );
}

/** The filter over one of Callback's own problems; status and stars are the viewer's. */
export function matchesProblem(
  card: ProblemCard,
  filter: ProblemFilter,
  progress: ProgressMap,
  favorites: ReadonlySet<string>,
): boolean {
  if (
    filter.search &&
    !card.title.toLowerCase().includes(filter.search.toLowerCase())
  ) {
    return false;
  }
  if (filter.favorites && !favorites.has(card.slug)) return false;
  const rows = filter.rows.filter(isActiveRow);
  if (rows.length === 0) return true;
  const holds = (row: FilterRow) => rowMatchesProblem(card, row, progress);
  return filter.match === "all" ? rows.every(holds) : rows.some(holds);
}

function rowMatchesProblem(
  card: ProblemCard,
  row: FilterRow,
  progress: ProgressMap,
): boolean {
  if (row.field === "frequency") return false;
  const have: readonly string[] =
    row.field === "company"
      ? card.companies
      : row.field === "difficulty"
        ? [card.difficulty]
        : row.field === "status"
          ? [progress[card.slug] ?? "todo"]
          : row.field === "topic"
            ? card.topics
            : card.languages;
  const hit = have.some((value) => row.values.includes(value));
  return row.op === "is" ? hit : !hit;
}

/** The values the "is" rows of one field select, for lighting the chips that stand for them. */
export function selectedValues(
  filter: ProblemFilter,
  field: SetField,
): string[] {
  return filter.rows.flatMap((row) =>
    row.field === field && row.op === "is" ? row.values : [],
  );
}

/**
 * The filter with one value of a set field toggled: taken out of the "is"
 * row that holds it (dropping the row when it empties), or added to the
 * field's first "is" row, or to a new one. What a chip for the value links to.
 */
export function toggleValue(
  filter: ProblemFilter,
  field: SetField,
  value: string,
): ProblemFilter {
  const rows = [...filter.rows];
  const holder = rows.findIndex(
    (row) =>
      row.field === field && row.op === "is" && row.values.includes(value),
  );
  if (holder !== -1) {
    const row = rows[holder] as SetRow;
    const values = row.values.filter((held) => held !== value);
    if (values.length === 0) rows.splice(holder, 1);
    else rows[holder] = { ...row, values };
    return { ...filter, rows };
  }
  const first = rows.findIndex((row) => row.field === field && row.op === "is");
  if (first === -1) {
    rows.push({ field, op: "is", values: [value] });
  } else {
    const row = rows[first] as SetRow;
    rows[first] = { ...row, values: [...row.values, value] };
  }
  return { ...filter, rows };
}

/** A short clause for the results line: "at Apple or Meta, not easy, tagged Array". */
export function describeFilter(
  filter: ProblemFilter,
  companyNames: ReadonlyMap<string, string>,
): string {
  const rows = filter.rows.filter(isActiveRow);
  const clauses = rows.map((row) => {
    if (row.field === "frequency") {
      return `frequency ${row.min ?? 0}–${row.max ?? 100}%`;
    }
    const list = row.values
      .map((value) =>
        row.field === "company"
          ? (companyNames.get(value) ?? value)
          : row.field === "status"
            ? STATUS_LABELS[value as Status].toLowerCase()
            : row.field === "language"
              ? LANGUAGE_LABELS[value as Language]
              : value,
      )
      .join(" or ");
    const not = row.op === "not";
    switch (row.field) {
      case "company":
        return not ? `not at ${list}` : `at ${list}`;
      case "topic":
        return not ? `not tagged ${list}` : `tagged ${list}`;
      case "language":
        return not ? `not in ${list}` : `in ${list}`;
      default:
        return not ? `not ${list}` : list;
    }
  });
  const joined = clauses.join(
    filter.match === "any" && clauses.length > 1 ? " or " : ", ",
  );
  return [
    filter.search ? `matching “${filter.search}”` : "",
    filter.favorites ? "starred" : "",
    joined,
  ]
    .filter(Boolean)
    .join(", ");
}
