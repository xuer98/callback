import "server-only";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  max,
  not,
  notExists,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import type { FilterRow, ProblemFilter } from "./problem-filter";
import type { CompanyQuestion, Difficulty, Timeframe } from "./types";

// The LeetCode questions companies are known to ask: an imported snapshot
// of listings (title, difficulty, topics, a link out) that /problems shows
// under Callback's own problems. The filter rows are evaluated here in SQL;
// the authored problems evaluate the same rows in memory (problem-filter.ts).

export const QUESTIONS_PER_PAGE = 50;

export interface QuestionQuery {
  timeframe: Timeframe;
  filter: ProblemFilter;
  /** A company the page is about: required whatever the match mode. */
  company?: string;
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

/**
 * Companies the /questions filter can select: any with imported listings or
 * with authored Callback problems, so a company that only has the latter is
 * still reachable.
 */
export async function listCompaniesWithQuestions(): Promise<
  { slug: string; name: string }[]
> {
  return db
    .select({
      slug: schema.companies.slug,
      name: schema.companies.name,
    })
    .from(schema.companies)
    .where(
      or(
        exists(
          db
            .select({ one: sql`1` })
            .from(schema.companyQuestions)
            .where(eq(schema.companyQuestions.companyId, schema.companies.id)),
        ),
        exists(
          db
            .select({ one: sql`1` })
            .from(schema.problemCompanies)
            .where(eq(schema.problemCompanies.companyId, schema.companies.id)),
        ),
      ),
    )
    .orderBy(asc(schema.companies.name));
}

/**
 * Per question, within one time range: the best frequency and how many
 * companies ask it, over the companies the filter names (under "match all")
 * or every company. Both the list and the count join to this.
 */
function askedBy(timeframe: Timeframe, companySlugs: string[]) {
  return db
    .select({
      questionId: schema.companyQuestions.questionId,
      frequency: max(schema.companyQuestions.frequency).as("frequency"),
      companyCount: countDistinct(schema.companyQuestions.companyId).as(
        "company_count",
      ),
    })
    .from(schema.companyQuestions)
    .innerJoin(
      schema.companies,
      eq(schema.companies.id, schema.companyQuestions.companyId),
    )
    .where(
      and(
        eq(schema.companyQuestions.timeframe, timeframe),
        companySlugs.length > 0
          ? inArray(schema.companies.slug, companySlugs)
          : undefined,
      ),
    )
    .groupBy(schema.companyQuestions.questionId)
    .as("asked");
}

/** Whether any listing names the company, in any time range. */
export async function companyHasListings(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ one: sql<number>`1` })
    .from(schema.companyQuestions)
    .innerJoin(
      schema.companies,
      eq(schema.companies.id, schema.companyQuestions.companyId),
    )
    .where(eq(schema.companies.slug, slug))
    .limit(1);
  return row !== undefined;
}

function shownCompanies(filter: ProblemFilter): string[] {
  if (filter.match !== "all") return [];
  return [
    ...new Set(
      filter.rows.flatMap((row) =>
        row.field === "company" && row.op === "is" ? row.values : [],
      ),
    ),
  ];
}

/** LIKE treats these as wildcards; the search is for the literal text. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * One filter row as a condition on a listing. Status and language are
 * Callback-only, so those rows are false here (and topics and frequency are
 * false for the authored problems, in problem-filter.ts).
 */
function listingCondition(
  row: FilterRow,
  timeframe: Timeframe,
  asked: ReturnType<typeof askedBy>,
): SQL {
  const question = schema.leetcodeQuestions;
  switch (row.field) {
    case "company": {
      const asks = db
        .select({ one: sql`1` })
        .from(schema.companyQuestions)
        .innerJoin(
          schema.companies,
          eq(schema.companies.id, schema.companyQuestions.companyId),
        )
        .where(
          and(
            eq(schema.companyQuestions.questionId, question.id),
            eq(schema.companyQuestions.timeframe, timeframe),
            inArray(schema.companies.slug, row.values),
          ),
        );
      return row.op === "is" ? exists(asks) : notExists(asks);
    }
    case "difficulty": {
      const values = row.values as Difficulty[];
      return row.op === "is"
        ? inArray(question.difficulty, values)
        : notInArray(question.difficulty, values);
    }
    case "topic": {
      const tagged = sql`${question.topics} ?| array[${sql.join(
        row.values.map((topic) => sql`${topic}`),
        sql`, `,
      )}]::text[]`;
      return row.op === "is" ? tagged : not(tagged);
    }
    case "frequency":
      return (
        and(
          row.min === undefined ? undefined : gte(asked.frequency, row.min),
          row.max === undefined ? undefined : lte(asked.frequency, row.max),
        ) ?? sql`true`
      );
    default:
      return sql`false`;
  }
}

/**
 * Questions matching the filter, one row per question. Without a company
 * row the same question is asked at many companies, so each row reports how
 * many and its best frequency; with one, every count is 1 and the frequency
 * is that company's own score.
 */
export async function queryQuestions(
  query: QuestionQuery,
): Promise<{ rows: CompanyQuestion[]; total: number; page: number }> {
  const { timeframe, filter, company } = query;
  const question = schema.leetcodeQuestions;
  const asked = askedBy(
    timeframe,
    company ? [company] : shownCompanies(filter),
  );
  const conditions = filter.rows.map((row) =>
    listingCondition(row, timeframe, asked),
  );
  const where = and(
    company
      ? listingCondition(
          { field: "company", op: "is", values: [company] },
          timeframe,
          asked,
        )
      : undefined,
    conditions.length === 0
      ? undefined
      : filter.match === "all"
        ? and(...conditions)
        : or(...conditions),
    filter.search
      ? ilike(question.title, `%${escapeLike(filter.search)}%`)
      : undefined,
  );

  // Count first so an out-of-range ?page lands on the last real page rather
  // than an empty list that reads like "no matches".
  const [totals] = await db
    .select({ total: count() })
    .from(question)
    .innerJoin(asked, eq(asked.questionId, question.id))
    .where(where);
  const total = totals?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE));
  const page = Math.min(lastPage, Math.max(1, query.page ?? 1));

  const rows = await db
    .select({
      slug: question.slug,
      title: question.title,
      difficulty: question.difficulty,
      topics: question.topics,
      frequency: asked.frequency,
      companyCount: asked.companyCount,
    })
    .from(question)
    .innerJoin(asked, eq(asked.questionId, question.id))
    .where(where)
    .orderBy(
      desc(asked.companyCount),
      desc(asked.frequency),
      asc(question.title),
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
