import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RememberList } from "@/components/back-to-list";
import { LinkChip } from "@/components/chips";
import { Pagination } from "@/components/pagination";
import { ProblemFilters } from "@/components/problem-filters";
import { ProblemRow } from "@/components/problem-row";
import { QuestionList } from "@/components/question-list";
import { auth } from "@/lib/auth";
import {
  favoriteSlugs,
  getCompany,
  guidesForCompany,
  lastWorkedAt,
  listProblemCards,
  progressBySlug,
} from "@/lib/data";
import {
  describeFilter,
  excludes,
  FILTER_FIELDS,
  filterEntries,
  isFiltering,
  matchesProblem,
  parseFilter,
  type ProgressMap,
} from "@/lib/problem-filter";
import { parseSort, sortCards, sortEntries } from "@/lib/problem-sort";
import {
  companyHasListings,
  listTopics,
  queryQuestions,
  QUESTIONS_PER_PAGE,
} from "@/lib/question-listings";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TIMEFRAME_LABELS,
  TIMEFRAMES,
  type Category,
  type CompanyQuestion,
  type ProblemCard,
  type Timeframe,
} from "@/lib/types";

// The company is fixed by the route, so the filter panel offers every row
// but Companies, and the page is rendered per request like /problems.
const COMPANY_PAGE_FIELDS = FILTER_FIELDS.filter(
  (field) => field !== "company",
);

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await getCompany(slug))?.name ?? "Company" };
}

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Params>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const company = await getCompany(slug);
  if (!company) notFound();

  const timeframeParam = one(query, "timeframe");
  const timeframe: Timeframe = (TIMEFRAMES as readonly string[]).includes(
    timeframeParam,
  )
    ? (timeframeParam as Timeframe)
    : "all";
  const pageParam = Number.parseInt(one(query, "page"), 10);
  const requestedPage =
    Number.isFinite(pageParam) && pageParam > 1 ? pageParam : 1;

  // Company rows in the URL are dropped: this page is one company already.
  const [topics, hasListings, guides] = await Promise.all([
    listTopics(),
    companyHasListings(company.slug),
    guidesForCompany(company.slug),
  ]);
  const filter = parseFilter(query, { companies: [], topics });
  const sort = parseSort(query);
  const session =
    filter.favorites ||
    sort.key === "recent" ||
    filter.rows.some((row) => row.field === "status")
      ? await auth.api.getSession({ headers: await headers() })
      : null;

  // The same split as /problems: authored problems on the first page only,
  // listings paged, and a query skipped when no row of its kind could hold.
  const [listings, cards, progress, starred, workedAt] = await Promise.all([
    hasListings && !excludes(filter, "listing")
      ? queryQuestions({
          timeframe,
          filter,
          company: company.slug,
          sort,
          page: requestedPage,
        })
      : Promise.resolve({ rows: [] as CompanyQuestion[], total: 0, page: 1 }),
    requestedPage === 1 && !excludes(filter, "problem")
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
  const practice = sortCards(
    cards.filter(
      (card) =>
        card.companies.includes(company.slug) &&
        matchesProblem(card, filter, progress, favorites),
    ),
    sort,
    workedAt,
  );

  // The practice list's category chips live in the URL, as on /problems, so
  // a trip to a problem and back lands on the same view. Chips only appear
  // for categories the company actually has, and not at all for just one.
  const categoryParam = one(query, "category");
  const category = (CATEGORIES as readonly string[]).includes(categoryParam)
    ? (categoryParam as Category)
    : undefined;
  const present = CATEGORIES.filter((c) =>
    practice.some((card) => card.category === c),
  );
  const shown = category
    ? practice.filter((card) => card.category === category)
    : practice;

  const filtering = isFiltering(filter) || timeframe !== "all";
  const described = describeFilter(filter, new Map());
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
    const text = next.toString();
    return text
      ? `/companies/${company.slug}?${text}`
      : `/companies/${company.slug}`;
  };
  const linkFor = (nextPage: number) => hrefFor(category, nextPage);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <RememberList href={hrefFor(category, page)} label={company.name} />
      <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{company.blurb}</p>
      {guides.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guide/${guide.slug}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-50"
            >
              Interview guide: {guide.title} →
            </Link>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">Typical loop</h2>
        <ol className="mt-3 space-y-2">
          {company.process.map((stage, i) => (
            <li key={stage} className="flex gap-3 text-sm text-zinc-300">
              <span className="w-5 shrink-0 text-right font-mono text-zinc-600">
                {i + 1}
              </span>
              {stage}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">Questions</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Callback&apos;s practice questions and the LeetCode questions{" "}
          {company.name} has been asking, filtered together.
        </p>
        <ProblemFilters
          companies={[]}
          topics={topics}
          filter={filter}
          sort={sort}
          timeframe={timeframe}
          basePath={`/companies/${company.slug}`}
          fields={COMPANY_PAGE_FIELDS}
        />
      </section>

      {practice.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-100">
            Practice questions
          </h2>
          {present.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <LinkChip
                href={hrefFor(undefined, 1)}
                label="All"
                active={!category}
              />
              {present.map((c) => (
                <LinkChip
                  key={c}
                  href={hrefFor(c, 1)}
                  label={CATEGORY_LABELS[c]}
                  active={category === c}
                />
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2">
            {shown.map((card) => (
              <ProblemRow key={card.slug} problem={card} />
            ))}
          </div>
        </section>
      )}

      {/* A company with no listings at all keeps the section away, even
          under a filter; one with listings shows the empty state. */}
      {hasListings && (rows.length > 0 || filtering) && (
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
            <QuestionList rows={rows} />
          )}
          <Pagination page={page} lastPage={lastPage} hrefFor={linkFor} />
        </section>
      )}
    </div>
  );
}
