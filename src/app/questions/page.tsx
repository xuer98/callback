import type { Metadata } from "next";
import Link from "next/link";
import { QuestionFilters } from "@/components/question-filters";
import { QuestionList } from "@/components/question-list";
import {
  listCompaniesWithQuestions,
  listQuestionTopics,
  queryQuestions,
  QUESTIONS_PER_PAGE,
} from "@/lib/data";
import {
  DIFFICULTIES,
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  type Difficulty,
  type Timeframe,
} from "@/lib/types";

export const metadata: Metadata = { title: "Questions" };

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // Everything is validated against the known values, so a hand-edited URL
  // falls back to the default view instead of reaching the query.
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

  // queryQuestions clamps the page to the last one that has rows.
  const { rows, total, page } = await queryQuestions({
    timeframe,
    company: company || undefined,
    topic: topic || undefined,
    difficulty,
    page: requestedPage,
  });

  const companyName = companies.find((c) => c.slug === company)?.name;
  const lastPage = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE));
  const linkFor = (nextPage: number) => {
    const next = new URLSearchParams();
    if (company) next.set("company", company);
    if (topic) next.set("topic", topic);
    if (difficulty) next.set("difficulty", difficulty);
    if (timeframe !== "all") next.set("timeframe", timeframe);
    if (nextPage > 1) next.set("page", String(nextPage));
    const query = next.toString();
    return query ? `/questions?${query}` : "/questions";
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Questions</h1>
      <p className="mt-1 text-sm text-zinc-400">
        LeetCode questions companies have been asking, filterable by company,
        category, and how recently they showed up.
      </p>

      <QuestionFilters
        companies={companies}
        topics={topics}
        selected={{ company, topic, difficulty: difficulty ?? "", timeframe }}
      />

      <p className="mt-6 text-xs text-zinc-500">
        {total.toLocaleString()} {total === 1 ? "question" : "questions"}
        {companyName ? ` at ${companyName}` : ""}
        {topic ? ` tagged ${topic}` : ""}
        {difficulty ? `, ${difficulty}` : ""} ·{" "}
        {TIMEFRAME_LABELS[timeframe].toLowerCase()}
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400">
          No questions match those filters. Try a wider time range, or clear the
          category.
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
    </div>
  );
}
