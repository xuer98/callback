import "server-only";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  inArray,
  max,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import type {
  Category,
  Company,
  CompanyQuestion,
  Difficulty,
  Problem,
  Timeframe,
  Track,
} from "./types";

// The single content read path. Pages call these accessors and get the same
// Problem/Company/Track shapes the UI has always used; only the storage moved.

const withCompanies = {
  problemCompanies: { with: { company: { columns: { slug: true } } } },
} as const;

type ProblemRow = typeof schema.problems.$inferSelect & {
  problemCompanies: { company: { slug: string } }[];
};

function toProblem(row: ProblemRow): Problem {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    companies: row.problemCompanies.map((link) => link.company.slug),
    summary: row.summary,
    prompt: row.prompt,
    hints: row.hints,
    judge: row.judge ?? undefined,
    ui: row.ui ?? undefined,
  };
}

function toCompany(row: typeof schema.companies.$inferSelect): Company {
  return {
    slug: row.slug,
    name: row.name,
    blurb: row.blurb,
    process: row.process,
  };
}

export async function listProblems(category?: Category): Promise<Problem[]> {
  const rows = await db.query.problems.findMany({
    where: category ? eq(schema.problems.category, category) : undefined,
    with: withCompanies,
    orderBy: (problems, { asc }) => [asc(problems.id)],
  });
  return rows.map(toProblem);
}

export async function getProblem(slug: string): Promise<Problem | undefined> {
  const row = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, slug),
    with: withCompanies,
  });
  return row ? toProblem(row) : undefined;
}

export async function listCompanies(): Promise<Company[]> {
  const rows = await db.query.companies.findMany({
    orderBy: (companies, { asc }) => [asc(companies.id)],
  });
  return rows.map(toCompany);
}

export async function listCompaniesWithCounts(): Promise<
  (Company & { problemCount: number })[]
> {
  const rows = await db.query.companies.findMany({
    with: { problemCompanies: { columns: { problemId: true } } },
    orderBy: (companies, { asc }) => [asc(companies.id)],
  });
  return rows.map((row) => ({
    ...toCompany(row),
    problemCount: row.problemCompanies.length,
  }));
}

export async function getCompany(slug: string): Promise<Company | undefined> {
  const row = await db.query.companies.findFirst({
    where: eq(schema.companies.slug, slug),
  });
  return row ? toCompany(row) : undefined;
}

export async function problemsForCompany(
  companySlug: string,
): Promise<Problem[]> {
  const links = await db
    .select({ problemId: schema.problemCompanies.problemId })
    .from(schema.problemCompanies)
    .innerJoin(
      schema.companies,
      eq(schema.problemCompanies.companyId, schema.companies.id),
    )
    .where(eq(schema.companies.slug, companySlug));
  if (links.length === 0) return [];

  const rows = await db.query.problems.findMany({
    where: inArray(
      schema.problems.id,
      links.map((link) => link.problemId),
    ),
    with: withCompanies,
    orderBy: (problems, { asc }) => [asc(problems.id)],
  });
  return rows.map(toProblem);
}

function toTrack(
  row: typeof schema.tracks.$inferSelect & {
    trackProblems: { problem: { slug: string } }[];
  },
): Track {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    problemSlugs: row.trackProblems.map((link) => link.problem.slug),
  };
}

export async function listTracks(): Promise<Track[]> {
  const rows = await db.query.tracks.findMany({
    with: {
      trackProblems: {
        orderBy: (trackProblems, { asc }) => [asc(trackProblems.position)],
        with: { problem: { columns: { slug: true } } },
      },
    },
    orderBy: (tracks, { asc }) => [asc(tracks.id)],
  });
  return rows.map(toTrack);
}

export async function getTrack(slug: string): Promise<Track | undefined> {
  const row = await db.query.tracks.findFirst({
    where: eq(schema.tracks.slug, slug),
    with: {
      trackProblems: {
        orderBy: (trackProblems, { asc }) => [asc(trackProblems.position)],
        with: { problem: { columns: { slug: true } } },
      },
    },
  });
  return row ? toTrack(row) : undefined;
}

export async function trackProblems(trackSlug: string): Promise<Problem[]> {
  const row = await db.query.tracks.findFirst({
    where: eq(schema.tracks.slug, trackSlug),
    with: {
      trackProblems: {
        orderBy: (trackProblems, { asc }) => [asc(trackProblems.position)],
        with: { problem: { with: withCompanies } },
      },
    },
  });
  return row?.trackProblems.map((link) => toProblem(link.problem)) ?? [];
}

// --- Company question listings (LeetCode, imported snapshot) ---------------

export const QUESTIONS_PER_PAGE = 50;

export interface QuestionQuery {
  timeframe: Timeframe;
  company?: string;
  topic?: string;
  difficulty?: Difficulty;
  page?: number;
}

/** Every topic tag present in the imported questions, for the filter menu. */
export async function listQuestionTopics(): Promise<string[]> {
  const result = await db.execute<{ topic: string }>(
    sql`select distinct jsonb_array_elements_text(${schema.leetcodeQuestions.topics}) as topic
        from ${schema.leetcodeQuestions} order by topic`,
  );
  return result.rows.map((row) => row.topic);
}

/** Companies that actually have imported questions, by name. */
export async function listCompaniesWithQuestions(): Promise<
  { slug: string; name: string }[]
> {
  return db
    .selectDistinct({
      slug: schema.companies.slug,
      name: schema.companies.name,
    })
    .from(schema.companyQuestions)
    .innerJoin(
      schema.companies,
      eq(schema.companies.id, schema.companyQuestions.companyId),
    )
    .orderBy(asc(schema.companies.name));
}

function questionFilters({ timeframe, company, topic, difficulty }: QuestionQuery) {
  const conditions = [eq(schema.companyQuestions.timeframe, timeframe)];
  if (company) conditions.push(eq(schema.companies.slug, company));
  if (difficulty)
    conditions.push(eq(schema.leetcodeQuestions.difficulty, difficulty));
  if (topic)
    conditions.push(
      sql`${schema.leetcodeQuestions.topics} @> ${JSON.stringify([topic])}::jsonb`,
    );
  return and(...conditions);
}

/**
 * Questions matching the filters, one row per question. Without a company
 * filter the same question is asked at many companies, so rows collapse to
 * the question and report how many companies ask it; with one selected,
 * every count is 1 and the frequency is that company's own score.
 */
export async function queryQuestions(
  query: QuestionQuery,
): Promise<{ rows: CompanyQuestion[]; total: number; page: number }> {
  const where = questionFilters(query);

  // Count first so an out-of-range ?page lands on the last real page rather
  // than an empty list that reads like "no matches".
  const [totals] = await db
    .select({ total: countDistinct(schema.companyQuestions.questionId) })
    .from(schema.companyQuestions)
    .innerJoin(
      schema.leetcodeQuestions,
      eq(schema.leetcodeQuestions.id, schema.companyQuestions.questionId),
    )
    .innerJoin(
      schema.companies,
      eq(schema.companies.id, schema.companyQuestions.companyId),
    )
    .where(where);
  const total = totals?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE));
  const page = Math.min(lastPage, Math.max(1, query.page ?? 1));

  const rows = await db
    .select({
      slug: schema.leetcodeQuestions.slug,
      title: schema.leetcodeQuestions.title,
      difficulty: schema.leetcodeQuestions.difficulty,
      topics: schema.leetcodeQuestions.topics,
      frequency: max(schema.companyQuestions.frequency),
      companyCount: countDistinct(schema.companyQuestions.companyId),
    })
    .from(schema.companyQuestions)
    .innerJoin(
      schema.leetcodeQuestions,
      eq(schema.leetcodeQuestions.id, schema.companyQuestions.questionId),
    )
    .innerJoin(
      schema.companies,
      eq(schema.companies.id, schema.companyQuestions.companyId),
    )
    .where(where)
    .groupBy(schema.leetcodeQuestions.id)
    .orderBy(
      desc(countDistinct(schema.companyQuestions.companyId)),
      desc(max(schema.companyQuestions.frequency)),
      asc(schema.leetcodeQuestions.title),
    )
    .limit(QUESTIONS_PER_PAGE)
    .offset((page - 1) * QUESTIONS_PER_PAGE);

  return {
    rows: rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      topics: row.topics,
      frequency: row.frequency ?? 0,
      companyCount: row.companyCount,
    })),
    total,
    page,
  };
}
