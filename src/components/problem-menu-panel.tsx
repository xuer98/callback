"use client";

import { useEffect, useRef, useState } from "react";
import { Chip } from "./company-problems";
import { ProblemMenuRow } from "./problem-menu-row";
import { useProgress } from "./progress";
import { Select } from "./question-filters";
import {
  CATEGORIES,
  DIFFICULTIES,
  PROBLEM_FORMATS,
  PROBLEM_FORMAT_LABELS,
  type Category,
  type Difficulty,
  type ProblemFormat,
  type ProblemIndex,
} from "@/lib/types";

// What the problem side menu shows once it is open: search, the filters, and
// the list. Filtering is client state over the index already in memory — a
// few hundred rows — so every control answers per keystroke.

const STATUSES = ["todo", "attempted", "solved"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABELS: Record<Status, string> = {
  todo: "To do",
  attempted: "Attempted",
  solved: "Solved",
};

/** Tab labels — the full category names don't fit six to a row. */
const CATEGORY_TABS: Record<Category, string> = {
  algorithms: "Algorithms",
  "system-design": "System design",
  behavioral: "Behavioral",
  frontend: "Frontend",
  sql: "SQL",
};

export interface MenuFilters {
  query: string;
  category: Category | null;
  format: ProblemFormat | null;
  difficulties: Difficulty[];
  statuses: Status[];
  /** A company slug, or "" for any. */
  company: string;
}

export const NO_FILTERS: MenuFilters = {
  query: "",
  category: null,
  format: null,
  difficulties: [],
  statuses: [],
  company: "",
};

function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function ProblemMenuPanel({
  index,
  failed,
  onRetry,
  currentSlug,
  filters,
  onFilters,
  onClose,
}: {
  /** Null until the list has loaded. */
  index: ProblemIndex | null;
  failed: boolean;
  onRetry: () => void;
  currentSlug: string;
  filters: MenuFilters;
  onFilters: (next: MenuFilters) => void;
  onClose: () => void;
}) {
  const { signedIn, statuses: progress } = useProgress();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const apply = (next: MenuFilters) => {
    // A changed filter is a new list: show it from the top.
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    onFilters(next);
  };
  const set = (patch: Partial<MenuFilters>) => apply({ ...filters, ...patch });

  // Status needs an account, so a status filter left over from before a
  // sign-out must not go on hiding rows.
  const statuses = signedIn ? filters.statuses : [];
  // The filters tucked behind the Filters button — what its badge counts.
  const tucked =
    filters.difficulties.length + statuses.length + (filters.company ? 1 : 0);
  const [showFilters, setShowFilters] = useState(tucked > 0);

  const all = index?.problems ?? [];
  const categories = CATEGORIES.filter((category) =>
    all.some((p) => p.category === category),
  );
  const inCategory = filters.category
    ? all.filter((p) => p.category === filters.category)
    : all;
  // Format chips appear only where they would split the list: a category
  // (or All) that mixes formats.
  const formats = PROBLEM_FORMATS.filter((format) =>
    inCategory.some((p) => p.format === format),
  );
  const needle = filters.query.trim().toLowerCase();
  const visible = inCategory.filter(
    (p) =>
      (!filters.format || p.format === filters.format) &&
      (filters.difficulties.length === 0 ||
        filters.difficulties.includes(p.difficulty)) &&
      (statuses.length === 0 ||
        statuses.includes(progress[p.slug] ?? "todo")) &&
      (!filters.company || p.companies.includes(filters.company)) &&
      (!needle || p.title.toLowerCase().includes(needle)),
  );
  const filtering =
    needle !== "" ||
    filters.category !== null ||
    filters.format !== null ||
    tucked > 0;

  // The menu opens on the problem being viewed: centre its row once the
  // list is there. Set directly rather than with scrollIntoView, which
  // would be free to scroll the page behind the drawer too.
  const loaded = index !== null;
  useEffect(() => {
    const scroller = scrollerRef.current;
    const row = scroller?.querySelector<HTMLElement>("[aria-current]");
    if (!scroller || !row) return;
    scroller.scrollTop =
      row.offsetTop - (scroller.clientHeight - row.offsetHeight) / 2;
  }, [loaded]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-base font-semibold tracking-tight">All problems</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 px-5 pt-3">
        <label className="relative flex-1">
          <span className="sr-only">Search problems</span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          {/* A text field in the searchbox role rather than type="search",
              whose own Escape handling would clear the query instead of
              closing the drawer. */}
          <input
            type="text"
            role="searchbox"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search problems"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full rounded-md bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors placeholder:text-zinc-600 hover:ring-zinc-700 focus:outline-none focus:ring-indigo-500"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((shown) => !shown)}
          aria-label={tucked > 0 ? `Filters, ${tucked} active` : "Filters"}
          aria-expanded={showFilters}
          aria-controls="problem-menu-filters"
          title="Filters"
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors ${
            showFilters
              ? "bg-zinc-800 text-zinc-100 ring-zinc-700"
              : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-100"
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 3.5h11L9.5 8.5v4l-3 1.5v-5.5z" />
          </svg>
          {tucked > 0 && (
            <span
              aria-hidden
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold leading-none text-white"
            >
              {tucked}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          id="problem-menu-filters"
          className="mx-5 mt-3 flex shrink-0 flex-wrap items-start gap-x-5 gap-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
        >
          <FilterGroup label="Difficulty">
            {DIFFICULTIES.map((difficulty) => (
              <Chip
                key={difficulty}
                label={difficulty[0].toUpperCase() + difficulty.slice(1)}
                active={filters.difficulties.includes(difficulty)}
                onClick={() =>
                  set({
                    difficulties: toggled(filters.difficulties, difficulty),
                  })
                }
              />
            ))}
          </FilterGroup>
          {signedIn && (
            <FilterGroup label="Status">
              {STATUSES.map((status) => (
                <Chip
                  key={status}
                  label={STATUS_LABELS[status]}
                  active={filters.statuses.includes(status)}
                  onClick={() =>
                    set({ statuses: toggled(filters.statuses, status) })
                  }
                />
              ))}
            </FilterGroup>
          )}
          <Select
            label="Company"
            value={filters.company}
            placeholder="All companies"
            options={(index?.companies ?? []).map((company) => ({
              value: company.slug,
              label: company.name,
            }))}
            onChange={(company) => set({ company })}
          />
        </div>
      )}

      <div
        role="group"
        aria-label="Category"
        // On a phone the row scrolls sideways; a scrollbar under six short
        // tabs would be louder than the tabs.
        className="mt-3 flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-800 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Tab
          label="All"
          active={filters.category === null}
          onClick={() => set({ category: null, format: null })}
        />
        {categories.map((category) => (
          <Tab
            key={category}
            label={CATEGORY_TABS[category]}
            active={filters.category === category}
            // The format chips belong to a category, so changing it clears
            // the one that was picked.
            onClick={() => set({ category, format: null })}
          />
        ))}
      </div>

      {formats.length > 1 && (
        <div
          role="group"
          aria-label="Format"
          className="flex shrink-0 flex-wrap gap-2 px-5 pt-3"
        >
          {formats.map((format) => (
            <Chip
              key={format}
              label={PROBLEM_FORMAT_LABELS[format]}
              active={filters.format === format}
              onClick={() =>
                set({ format: filters.format === format ? null : format })
              }
            />
          ))}
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 text-xs text-zinc-500">
        <span aria-live="polite">
          {index
            ? filtering
              ? `${visible.length} of ${all.length} problems`
              : `${all.length} problems`
            : failed
              ? ""
              : "Loading…"}
        </span>
        {filtering && (
          <button
            type="button"
            onClick={() => apply(NO_FILTERS)}
            className="text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-200 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="relative mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4"
      >
        {failed ? (
          <p className="px-3 py-6 text-sm text-zinc-400">
            Couldn&apos;t load the problem list.{" "}
            <button
              type="button"
              onClick={onRetry}
              className="text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Try again
            </button>
          </p>
        ) : !index ? (
          <ul aria-hidden className="flex flex-col gap-1 px-1 pt-1">
            {Array.from({ length: 12 }, (_, i) => (
              <li
                key={i}
                className="h-9 animate-pulse rounded-md bg-zinc-900/70"
              />
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <p className="px-3 py-6 text-sm text-zinc-400">
            No problems match those filters.
          </p>
        ) : (
          <ul>
            {visible.map((problem) => (
              <ProblemMenuRow
                key={problem.slug}
                problem={problem}
                status={progress[problem.slug]}
                current={problem.slug === currentSlug}
                onClose={onClose}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap border-b-2 px-2.5 py-2 text-sm transition-colors ${
        active
          ? "border-zinc-300 text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
