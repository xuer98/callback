import type { Metadata } from "next";
import { headers } from "next/headers";
import { RememberList } from "@/components/back-to-list";
import { LinkChip } from "@/components/chips";
import { Pagination } from "@/components/pagination";
import { ProblemFilters } from "@/components/problem-filters";
import { ProblemRow } from "@/components/problem-row";
import { QuestionList } from "@/components/question-list";
import { auth } from "@/lib/auth";
import {
  favoriteSlugs,
  lastWorkedAt,
  listProblemCards,
  progressBySlug,
} from "@/lib/data";
import {
  describeFilter,
  excludes,
  filterEntries,
  matchesProblem,
  parseFilter,
  type ProgressMap,
} from "@/lib/problem-filter";
import { parseSort, sortCards, sortEntries } from "@/lib/problem-sort";
import {
  listCompaniesWithQuestions,
  listQuestionTopics,
  queryQuestions,
  QUESTIONS_PER_PAGE,
} from "@/lib/question-listings";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  type Category,
  type CompanyQuestion,
  type ProblemCard,
  type Timeframe,
} from "@/lib/types";

export const metadata: Metadata = { title: "Problems" };

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // Everything is validated against the known values, so a hand-edited URL
  // falls back to the default view instead of reaching the query.
  const categoryParam = one(params, "category");
  const category = (CATEGORIES as readonly string[]).includes(categoryParam)
    ? (categoryParam as Category)
    : undefined;
  const timeframeParam = one(params, "timeframe");
  const timeframe: Timeframe = (TIMEFRAMES as readonly string[]).includes(
    timeframeParam,
  )
    ? (timeframeParam as Timeframe)
    : "all";
  const pageParam = Number.parseInt(one(params, "page"), 10);
  const requestedPage =
    Number.isFinite(pageParam) && pageParam > 1 ? pageParam : 1;

  const [companies, topics] = await Promise.all([
    listCompaniesWithQuestions(),
    listQuestionTopics(),
  ]);
  const filter = parseFilter(params, {
    companies: companies.map((c) => c.slug),
    topics,
  });
  const sort = parseSort(params);

  // Status, stars and "last worked on" are the viewer's own, so the session
  // is read only when the filter or the sort asks for them.
  const session =
    filter.favorites ||
    sort.key === "recent" ||
    filter.rows.some((row) => row.field === "status")
      ? await auth.api.getSession({ headers: await headers() })
      : null;

  // The imported listings are LeetCode coding questions, so they only render
  // when the category could contain them. Without them there is no
  // pagination either, so a stale ?page falls back to the first page.
  const showListings = !category || category === "algorithms";
  const listingsPage = showListings ? requestedPage : 1;

  // Callback's own problems render above the imported listings, on the first
  // page only. Under "match all", a row one kind can never satisfy — a topic
  // for the authored problems, a status for the listings — skips that query
  // outright. queryQuestions clamps the page to the last one that has rows.
  const [listings, cards, progress, starred, workedAt] = await Promise.all([
    showListings && !excludes(filter, "listing")
      ? queryQuestions({ timeframe, filter, sort, page: listingsPage })
      : Promise.resolve({ rows: [] as CompanyQuestion[], total: 0, page: 1 }),
    listingsPage === 1 && !excludes(filter, "problem")
      ? listProblemCards()
      : Promise.resolve([] as ProblemCard[]),
    session
      ? progressBySlug(session.user.id)
      : Promise.resolve({} as ProgressMap),
    session && filter.favorites
      ? favoriteSlugs(session.user.id)
      : Promise.resolve([] as string[]),
    session && sort.key === "recent"
      ? lastWorkedAt(session.user.id)
      : Promise.resolve({} as Record<string, number>),
  ]);
  const { rows, total, page } = listings;
  const favorites = new Set(starred);
  const callbackProblems = sortCards(
    cards.filter(
      (card) =>
        (!category || card.category === category) &&
        matchesProblem(card, filter, progress, favorites),
    ),
    sort,
    workedAt,
  );

  const described = describeFilter(
    filter,
    new Map(companies.map((c) => [c.slug, c.name])),
  );
  // With the listings narrowed to named companies, every count would be 1;
  // the row shows that company's frequency instead.
  const namedCompanies =
    filter.match === "all" &&
    filter.rows.some((row) => row.field === "company" && row.op === "is");
  const lastPage = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE));
  // One href builder for both the category chips (which change the category
  // and reset the page) and pagination (which keeps the category).
  const hrefFor = (cat: Category | undefined, nextPage: number) => {
    const next = new URLSearchParams();
    if (cat) next.set("category", cat);
    if (timeframe !== "all") next.set("timeframe", timeframe);
    for (const [name, value] of filterEntries(filter)) next.append(name, value);
    for (const [name, value] of sortEntries(sort)) next.set(name, value);
    if (nextPage > 1) next.set("page", String(nextPage));
    const query = next.toString();
    return query ? `/problems?${query}` : "/problems";
  };
  const linkFor = (nextPage: number) => hrefFor(category, nextPage);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <RememberList href={hrefFor(category, page)} label="Problems" />
      <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Callback&apos;s own problems and the LeetCode questions companies have
        been asking, in one place — pick a category, then filter by company,
        frequency, status, difficulty, topic, and language.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkChip href={hrefFor(undefined, 1)} label="All" active={!category} />
        {CATEGORIES.map((c) => (
          <LinkChip
            key={c}
            href={hrefFor(c, 1)}
            label={CATEGORY_LABELS[c]}
            active={category === c}
          />
        ))}
      </div>

      <ProblemFilters
        companies={companies}
        topics={topics}
        filter={filter}
        sort={sort}
        timeframe={timeframe}
      />

      {callbackProblems.length > 0 && (
        <section className="mt-8">
          <div className="mt-3 flex flex-col gap-2">
            {callbackProblems.map((p) => (
              <ProblemRow key={p.slug} problem={p} />
            ))}
          </div>
        </section>
      )}

      {showListings && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-100">
            Asked on LeetCode
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {total.toLocaleString()} {total === 1 ? "question" : "questions"}
            {described ? ` ${described}` : ""} ·{" "}
            {TIMEFRAME_LABELS[timeframe].toLowerCase()}
          </p>

          {rows.length === 0 ? (
            <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400">
              {filter.favorites
                ? "Stars are for Callback's own problems, so the LeetCode listings sit this one out."
                : excludes(filter, "listing")
                  ? "Status and language describe Callback's own problems, so no LeetCode listing can match all of these filters. Match any of them instead, or remove those rows."
                  : "No LeetCode listings match those filters. Try a wider time range, or clear a filter."}
            </p>
          ) : (
            <QuestionList rows={rows} showCompanyCount={!namedCompanies} />
          )}

          <Pagination page={page} lastPage={lastPage} hrefFor={linkFor} />

          <p className="mt-10 text-xs leading-6 text-zinc-600">
            Listings only — titles, difficulty, and tags link out to LeetCode.
            Imported from the{" "}
            <a
              href="https://github.com/liquidslr/leetcode-company-wise-problems"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 hover:text-zinc-400"
            >
              leetcode-company-wise-problems
            </a>{" "}
            snapshot dated 1 June 2025. Frequency is that dataset&apos;s own
            relative score within a company and time range.
          </p>
        </section>
      )}

      {callbackProblems.length === 0 && !showListings && (
        <p className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400">
          No problems match those filters. Try clearing some of them.
        </p>
      )}
    </div>
  );
}
