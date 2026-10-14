import { DIFFICULTIES, type ProblemCard } from "./types";

// Sorting for /problems and the company pages: one key and a direction,
// carried in the URL beside the filter. Callback's own problems sort in
// memory here; the listings sort in SQL (question-listings.ts). A key one
// kind lacks — frequency for authored problems, last worked on for the
// listings — leaves that kind in its default order.

export const SORT_KEYS = [
  "default",
  "frequency",
  "difficulty",
  "title",
  "recent",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export type SortDirection = "asc" | "desc";

export interface ProblemSort {
  key: SortKey;
  direction: SortDirection;
}

export const SORT_LABELS: Record<SortKey, string> = {
  default: "Default",
  frequency: "Frequency",
  difficulty: "Difficulty",
  title: "Title",
  recent: "Last worked on",
};

export const DEFAULT_SORT: ProblemSort = { key: "default", direction: "asc" };

/** The order a key starts in: most frequent and most recent first, easiest and A first. */
export function defaultDirection(key: SortKey): SortDirection {
  return key === "frequency" || key === "recent" ? "desc" : "asc";
}

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** The sort in a page's query string; anything unknown is the default order. */
export function parseSort(params: Params): ProblemSort {
  const key = one(params, "sort");
  if (!(SORT_KEYS as readonly string[]).includes(key) || key === "default") {
    return DEFAULT_SORT;
  }
  const direction = one(params, "dir");
  return {
    key: key as SortKey,
    direction:
      direction === "asc" || direction === "desc"
        ? direction
        : defaultDirection(key as SortKey),
  };
}

/** The query-string entries for a sort: none for the default order. */
export function sortEntries(sort: ProblemSort): [string, string][] {
  if (sort.key === "default") return [];
  const entries: [string, string][] = [["sort", sort.key]];
  if (sort.direction !== defaultDirection(sort.key)) {
    entries.push(["dir", sort.direction]);
  }
  return entries;
}

/**
 * Callback's own problems in the chosen order. `workedAt` is when the viewer
 * last ran or marked each problem, in epoch milliseconds; problems never
 * worked on come last whichever way "last worked on" runs.
 */
export function sortCards(
  cards: ProblemCard[],
  sort: ProblemSort,
  workedAt: Record<string, number> = {},
): ProblemCard[] {
  if (sort.key === "default" || sort.key === "frequency") return cards;
  const sign = sort.direction === "asc" ? 1 : -1;
  const byTitle = (a: ProblemCard, b: ProblemCard) =>
    a.title.localeCompare(b.title);
  const compare = (a: ProblemCard, b: ProblemCard): number => {
    switch (sort.key) {
      case "difficulty":
        return (
          (DIFFICULTIES.indexOf(a.difficulty) -
            DIFFICULTIES.indexOf(b.difficulty)) *
            sign || byTitle(a, b)
        );
      case "title":
        return byTitle(a, b) * sign;
      default: {
        const at = workedAt[a.slug];
        const bt = workedAt[b.slug];
        if (at === undefined || bt === undefined) {
          return Number(at === undefined) - Number(bt === undefined);
        }
        return (at - bt) * sign;
      }
    }
  };
  return [...cards].sort(compare);
}
