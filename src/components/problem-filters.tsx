"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { copyText } from "@/lib/clipboard";
import { FilterRowItem } from "./filter-row";
import { FilterButton, SortMenu, StarredToggle } from "./filter-toolbar";
import type { Option } from "./filter-select";
import { useProgress } from "./progress";
import { Select } from "./select";
import {
  EMPTY_FILTER,
  FIELD_LABELS,
  FILTER_FIELDS,
  filterEntries,
  filterKey,
  isActiveRow,
  isFiltering,
  MAX_SEARCH_LENGTH,
  STATUS_LABELS,
  STATUSES,
  type FilterField,
  type FilterRow,
  type MatchMode,
  type ProblemFilter,
  type SetField,
} from "@/lib/problem-filter";
import { sortEntries, type ProblemSort } from "@/lib/problem-sort";
import {
  DIFFICULTIES,
  LANGUAGE_LABELS,
  LANGUAGES,
  TIMEFRAME_LABELS,
  TIMEFRAMES,
  type Timeframe,
} from "@/lib/types";

// The toolbar of /problems and of a company page: the time-range select and
// the Filters button, which opens a panel of filter rows — match all or any
// of "companies is …", "frequency 20–80%", "status is not solved", and so
// on — over a title search. Every change rewrites the URL, so the server
// does the filtering and the view is a link. The panel keeps only what the
// URL cannot hold: blank rows, and the order the rows were added in.

/** The query keys the panel owns; category and timeframe pass through. */
const OWNED_KEYS: readonly string[] = [
  ...FILTER_FIELDS,
  "match",
  "q",
  "favorites",
  "page",
];

/** A row in the panel: stable identity for React, whatever gets removed. */
interface DraftRow {
  id: string;
  row: FilterRow;
}

interface Draft {
  match: MatchMode;
  rows: DraftRow[];
  search: string;
  favorites: boolean;
}

function blankRow(field: FilterField, id: string): DraftRow {
  return {
    id,
    row: field === "frequency" ? { field } : { field, op: "is", values: [] },
  };
}

/** The default rows in order, each holding its active rows or one blank. */
function draftFor(
  filter: ProblemFilter,
  fields: readonly FilterField[],
): Draft {
  const rows: DraftRow[] = [];
  for (const field of fields) {
    const active = filter.rows.filter((row) => row.field === field);
    rows.push(
      ...(active.length > 0
        ? active.map((row, i) => ({ id: `${field}:${i}`, row }))
        : [blankRow(field, `${field}:0`)]),
    );
  }
  return {
    match: filter.match,
    rows,
    search: filter.search,
    favorites: filter.favorites,
  };
}

function activeFilter(draft: Draft): ProblemFilter {
  return {
    match: draft.match,
    rows: draft.rows.map(({ row }) => row).filter(isActiveRow),
    search: draft.search.trim().slice(0, MAX_SEARCH_LENGTH),
    favorites: draft.favorites,
  };
}

export function ProblemFilters({
  companies,
  topics,
  filter,
  sort,
  timeframe,
  basePath = "/problems",
  fields = FILTER_FIELDS,
}: {
  companies: { slug: string; name: string }[];
  topics: string[];
  /** What the URL holds, as the server parsed it. */
  filter: ProblemFilter;
  sort: ProblemSort;
  timeframe: Timeframe;
  /** The page the filter rewrites the query string of. */
  basePath?: string;
  /** The rows the panel offers; a company page leaves out Companies. */
  fields?: readonly FilterField[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { signedIn } = useProgress();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const added = useRef(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFor(filter, fields));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  // The URL is the truth. When it changes under the panel — back button, a
  // link, a value the server dropped — the draft is rebuilt from it; the
  // panel's own pushes come back with the key they were sent with and
  // leave the draft (and its blank rows) alone.
  const key = filterKey(filter);
  const [sentKey, setSentKey] = useState(key);
  if (!pending && key !== sentKey) {
    setSentKey(key);
    setDraft(draftFor(filter, fields));
  }

  const hrefFor = (
    active: ProblemFilter,
    overrides: Record<string, string>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const owned of OWNED_KEYS) params.delete(owned);
    for (const [name, value] of filterEntries(active))
      params.append(name, value);
    for (const [name, value] of Object.entries(overrides)) {
      if (value) params.set(name, value);
      else params.delete(name);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  const navigate = (href: string) =>
    startTransition(() => router.push(href, { scroll: false }));

  const push = (next: Draft) => {
    const active = activeFilter(next);
    const nextKey = filterKey(active);
    if (nextKey === sentKey) return;
    setSentKey(nextKey);
    navigate(hrefFor(active, {}));
  };
  const update = (next: Draft) => {
    setDraft(next);
    push(next);
  };
  const setRow = (id: string, row: FilterRow) =>
    update({
      ...draft,
      rows: draft.rows.map((entry) => (entry.id === id ? { id, row } : entry)),
    });
  const removeRow = (id: string) =>
    update({ ...draft, rows: draft.rows.filter((entry) => entry.id !== id) });

  // Typing searches as you go, a beat after the last keystroke.
  const searchTimer = useRef<number | undefined>(undefined);
  const stopSearchTimer = useCallback(
    () => window.clearTimeout(searchTimer.current),
    [],
  );
  useEffect(() => stopSearchTimer, [stopSearchTimer]);
  const setSearch = (search: string) => {
    const next = { ...draft, search };
    setDraft(next);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => push(next), 350);
  };

  const setTimeframe = (value: string) =>
    navigate(
      hrefFor(activeFilter(draft), { timeframe: value === "all" ? "" : value }),
    );

  // A click outside or Escape closes the panel; Escape inside an open value
  // list closes that list instead (it marks the event handled first).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Typing is the fast path with a keyboard; on touch, focusing the field
  // would raise the on-screen keyboard over the rows.
  useEffect(() => {
    if (open && window.matchMedia("(pointer: fine)").matches) {
      searchRef.current?.focus();
    }
  }, [open]);

  const copyLink = async () => {
    const link = new URL(
      hrefFor(activeFilter(draft), {}),
      window.location.origin,
    ).href;
    const copied = await copyText(link);
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1500);
  };

  const options: Record<SetField, Option[]> = {
    company: companies.map((c) => ({ value: c.slug, label: c.name })),
    status: STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
    difficulty: DIFFICULTIES.map((d) => ({
      value: d,
      label: d[0].toUpperCase() + d.slice(1),
    })),
    topic: topics.map((t) => ({ value: t, label: t })),
    language: LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] })),
  };
  const activeCount =
    filter.rows.length + (filter.search ? 1 : 0) + (filter.favorites ? 1 : 0);
  const filtering = isFiltering(activeFilter(draft));
  const asksStatus = draft.rows.some(
    ({ row }) => row.field === "status" && isActiveRow(row),
  );

  return (
    <div className="relative mt-4">
      <div
        className={`flex flex-wrap items-end gap-3 ${pending ? "opacity-60" : ""}`}
      >
        <SortMenu
          sort={sort}
          onChange={(next) =>
            navigate(
              hrefFor(activeFilter(draft), {
                sort: "",
                dir: "",
                ...Object.fromEntries(sortEntries(next)),
              }),
            )
          }
        />
        <FilterButton
          buttonRef={buttonRef}
          open={open}
          activeCount={activeCount}
          panelId={panelId}
          onClick={() => setOpen((shown) => !shown)}
        />
        <StarredToggle
          on={filter.favorites}
          signedIn={signedIn}
          onClick={() =>
            signedIn
              ? update({ ...draft, favorites: !draft.favorites })
              : router.push("/signin")
          }
        />
        <Select
          label="Time range"
          value={timeframe}
          options={TIMEFRAMES.map((t) => ({
            value: t,
            label: TIMEFRAME_LABELS[t],
          }))}
          onChange={setTimeframe}
        />
      </div>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Filters"
          className="absolute left-0 top-full z-30 mt-2 w-[min(40rem,calc(100vw-2rem))] rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/60"
        >
          <label className="relative block">
            <span className="sr-only">Search by title</span>
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              role="searchbox"
              value={draft.search}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  window.clearTimeout(searchTimer.current);
                  push(draft);
                }
              }}
              placeholder="Search problems by title…"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="w-full rounded-xl bg-zinc-900 py-2.5 pl-10 pr-3 text-sm text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors placeholder:text-zinc-600 hover:ring-zinc-700 focus:outline-none focus:ring-indigo-500"
            />
          </label>

          <div className="mt-3 rounded-xl bg-zinc-900/60 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              Match
              <Select
                label="Match"
                hideLabel
                className="w-20"
                value={draft.match}
                options={[
                  { value: "all", label: "All" },
                  { value: "any", label: "Any" },
                ]}
                onChange={(match) =>
                  update({ ...draft, match: match as MatchMode })
                }
              />
              of the following filters:
            </div>

            <ul className="mt-3 flex flex-col gap-2.5">
              {draft.rows.map(({ id, row }) => (
                <FilterRowItem
                  key={id}
                  row={row}
                  options={options}
                  onChange={(next) => setRow(id, next)}
                  onRemove={() => removeRow(id)}
                />
              ))}
            </ul>

            <label className="mt-3 inline-flex">
              <span className="sr-only">Add a filter</span>
              <select
                value=""
                onChange={(event) => {
                  const field = event.target.value as FilterField;
                  if (!field) return;
                  added.current += 1;
                  setDraft({
                    ...draft,
                    rows: [
                      ...draft.rows,
                      blankRow(field, `add:${added.current}`),
                    ],
                  });
                }}
                className="h-8 w-8 cursor-pointer appearance-none rounded-md bg-transparent text-center text-lg leading-none text-zinc-400 ring-1 ring-inset ring-transparent transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-indigo-500"
              >
                <option value="" disabled hidden>
                  +
                </option>
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {FIELD_LABELS[field]}
                  </option>
                ))}
              </select>
            </label>

            <p className="mt-2 text-[11px] leading-4 text-zinc-500">
              Frequency describes the LeetCode listings; status and language,
              Callback&apos;s own problems.
              {asksStatus && !signedIn
                ? " Signed out, every problem counts as to do."
                : ""}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyLink}
              disabled={!filtering}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-indigo-400 transition-colors hover:bg-zinc-800 hover:text-indigo-300 disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-zinc-900"
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
                <path d="M6.5 9.5a3 3 0 0 0 4.24 0l2.12-2.12a3 3 0 0 0-4.24-4.24L7.5 4.25" />
                <path d="M9.5 6.5a3 3 0 0 0-4.24 0L3.14 8.62a3 3 0 0 0 4.24 4.24l1.12-1.11" />
              </svg>
              {copyState === "copied"
                ? "Link copied"
                : copyState === "failed"
                  ? "Couldn't copy"
                  : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => update(draftFor(EMPTY_FILTER, fields))}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
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
                <path d="M3 8a5 5 0 1 0 1.5-3.55" />
                <path d="M3 2.5v3h3" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
