import type { Metadata } from "next";
import Link from "next/link";
import { ProblemRow } from "@/components/problem-row";
import { QuestionFilters } from "@/components/question-filters";
import { QuestionList } from "@/components/question-list";
import {
  listCompaniesWithQuestions,
  listProblems,
  listQuestionTopics,
  problemsForCompany,
  queryQuestions,
  QUESTIONS_PER_PAGE,
} from "@/lib/data";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DIFFICULTIES,
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  type Category,
  type CompanyQuestion,
  type Difficulty,
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
  const difficultyParam = one(params, "difficulty");
  const difficulty = (DIFFICULTIES as readonly string[]).includes(
    difficultyParam,
  )
    ? (difficultyParam as Difficulty)
    : undefined;
  const pageParam = Number.parseInt(one(params, "page"), 10);
  const requestedPage = Number.isFinite(pageParam) && pageParam > 1 ? pageParam : 1;

  const [companies, topics] = await Promise.all([
    listCompaniesWithQuestions(),
    listQuestionTopics(),
  ]);

  const company = companies.some((c) => c.slug === one(params, "company"))
    ? one(params, "company")
    : "";
  const topic = topics.includes(one(params, "topic"))
    ? one(params, "topic")
    : "";

  // The imported listings are LeetCode coding questions, so they only render
  // when the category could contain them. Without them there is no
  // pagination either, so a stale ?page falls back to the first page.
  const showListings = !category || category === "algorithms";
  const listingsPage = showListings ? requestedPage : 1;

  // Callback's own problems render above the imported listings, on the first
  // page only. Category, company, and difficulty apply to them; topic and
  // timeframe are listing-only concepts, so a topic filter hides the section
  // rather than pretending to match. queryQuestions clamps the page to the
  // last one that has rows.
  const [{ rows, total, page }, asked] = await Promise.all([
    showListings
      ? queryQuestions({
          timeframe,
          company: company || undefined,
          topic: topic || undefined,
          difficulty,
          page: listingsPage,
        })
      : Promise.resolve({ rows: [] as CompanyQuestion[], total: 0, page: 1 }),
    !topic && listingsPage === 1
      ? company
        ? problemsForCompany(company)
        : listProblems()
      : Promise.resolve([]),
  ]);
  const callbackProblems = asked.filter(
    (p) =>
      (!category || p.category === category) &&
      (!difficulty || p.difficulty === difficulty),
  );

  const companyName = companies.find((c) => c.slug === company)?.name;
  const lastPage = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE));
  const linkFor = (nextPage: number) => {
    const next = new URLSearchParams();
    if (category) next.set("category", category);
    if (company) next.set("company", company);
    if (topic) next.set("topic", topic);
    if (difficulty) next.set("difficulty", difficulty);
    if (timeframe !== "all") next.set("timeframe", timeframe);
    if (nextPage > 1) next.set("page", String(nextPage));
    const query = next.toString();
    return query ? `/problems?${query}` : "/problems";
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Callback&apos;s own problems and the LeetCode questions companies have
        been asking, in one place — filter by category, company, topic,
        difficulty, and how recently a question showed up.
      </p>

      <QuestionFilters
        companies={companies}
        topics={topics}
        categories={CATEGORIES.map((c) => ({
          value: c,
          label: CATEGORY_LABELS[c],
        }))}
        selected={{
          category: category ?? "",
          company,
          topic,
          difficulty: difficulty ?? "",
          timeframe,
        }}
      />

      {callbackProblems.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-100">
            Solve on Callback
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {callbackProblems.length}{" "}
            {callbackProblems.length === 1 ? "problem" : "problems"}
            {companyName ? ` asked at ${companyName}` : ""}
            {category ? ` · ${CATEGORY_LABELS[category]}` : ""}
            {difficulty ? `, ${difficulty}` : ""} — full prompts you can work
            right here.
          </p>
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
            {companyName ? ` at ${companyName}` : ""}
            {topic ? ` tagged ${topic}` : ""}
            {difficulty ? `, ${difficulty}` : ""} ·{" "}
            {TIMEFRAME_LABELS[timeframe].toLowerCase()}
          </p>

          {rows.length === 0 ? (
            <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400">
              No LeetCode listings match those filters. Try a wider time range,
              or clear the topic.
            </p>
          ) : (
            <QuestionList rows={rows} showCompanyCount={!company} />
          )}

          {lastPage > 1 && (
            <nav className="mt-6 flex items-center justify-between text-xs text-zinc-400">
              {page > 1 ? (
                <Link
                  href={linkFor(page - 1)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-zinc-500">
                Page {page} of {lastPage.toLocaleString()}
              </span>
              {page < lastPage ? (
                <Link
                  href={linkFor(page + 1)}
                  className="rounded-md border border-zinc-800 px-3 py-1.5 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

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
