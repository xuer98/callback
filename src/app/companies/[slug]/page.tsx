import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CompanyProblems } from "@/components/company-problems";
import { Pagination } from "@/components/pagination";
import { ProblemFilters } from "@/components/problem-filters";
import { QuestionList } from "@/components/question-list";
import { auth } from "@/lib/auth";
import { getCompany, listProblemCards, progressBySlug } from "@/lib/data";
import {
  describeFilter,
  excludes,
  FILTER_FIELDS,
  filterEntries,
  isFiltering,
  LISTING_FIELDS,
  matchesProblem,
  parseFilter,
  PROBLEM_FIELDS,
  type ProgressMap,
} from "@/lib/problem-filter";
import {
  companyHasListings,
  listQuestionTopics,
  queryQuestions,
  QUESTIONS_PER_PAGE,
} from "@/lib/question-listings";
import {
  TIMEFRAME_LABELS,
  TIMEFRAMES,
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
  const [topics, hasListings] = await Promise.all([
    listQuestionTopics(),
    companyHasListings(company.slug),
  ]);
  const filter = parseFilter(query, { companies: [], topics });
  const session = filter.rows.some((row) => row.field === "status")
    ? await auth.api.getSession({ headers: await headers() })
    : null;

  // The same split as /problems: authored problems on the first page only,
  // listings paged, and a query skipped when no row of its kind could hold.
  const [listings, cards, progress] = await Promise.all([
    hasListings && !excludes(filter, LISTING_FIELDS)
      ? queryQuestions({
          timeframe,
          filter,
          company: company.slug,
          page: requestedPage,
        })
      : Promise.resolve({ rows: [] as CompanyQuestion[], total: 0, page: 1 }),
    requestedPage === 1 && !excludes(filter, PROBLEM_FIELDS)
      ? listProblemCards()
      : Promise.resolve([] as ProblemCard[]),
    session
      ? progressBySlug(session.user.id)
      : Promise.resolve({} as ProgressMap),
  ]);
  const { rows, total, page } = listings;
  const practice = cards.filter(
    (card) =>
      card.companies.includes(company.slug) &&
      matchesProblem(card, filter, progress),
  );

  const filtering = isFiltering(filter) || timeframe !== "all";
  const described = describeFilter(filter, new Map());
  const lastPage = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE));
  const hrefFor = (nextPage: number) => {
    const next = new URLSearchParams();
    if (timeframe !== "all") next.set("timeframe", timeframe);
    for (const [name, value] of filterEntries(filter)) next.append(name, value);
    if (nextPage > 1) next.set("page", String(nextPage));
    const text = next.toString();
    return text
      ? `/companies/${company.slug}?${text}`
      : `/companies/${company.slug}`;
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{company.blurb}</p>

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
          {/* Slim payload: the client chips only need the card fields. */}
          <CompanyProblems
            problems={practice.map(
              ({ slug, title, category, difficulty, summary }) => ({
                slug,
                title,
                category,
                difficulty,
                summary,
              }),
            )}
          />
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
              {excludes(filter, LISTING_FIELDS)
                ? "Status and language describe Callback's own problems, so no LeetCode listing can match all of these filters. Match any of them instead, or remove those rows."
                : "No LeetCode listings match those filters. Try a wider time range, or clear a filter."}
            </p>
          ) : (
            <QuestionList rows={rows} />
          )}
          <Pagination page={page} lastPage={lastPage} hrefFor={hrefFor} />
        </section>
      )}
    </div>
  );
}
