import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import type { ProgressMap } from "./problem-filter";
import {
  LANGUAGES,
  type Category,
  type Company,
  type Problem,
  type ProblemCard,
  type ProblemIndex,
  type Track,
} from "./types";

// The content read path for Callback's own problems, companies, and tracks.
// Pages call these accessors and get the same Problem/Company/Track shapes
// the UI has always used; only the storage moved. The imported LeetCode
// listings have their own module, question-listings.ts.

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
    solution: row.solution ?? undefined,
    rubric: row.rubric ?? undefined,
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

/**
 * The slim list behind the problem side menu. Selects only what a row shows
 * and derives the format in SQL, so the judge and UI blobs never leave the
 * database.
 */
export async function getProblemIndex(): Promise<ProblemIndex> {
  const rows = await db.query.problems.findMany({
    columns: { slug: true, title: true, category: true, difficulty: true },
    extras: (problems) => ({
      hasJudge: sql<boolean>`${problems.judge} is not null`.as("has_judge"),
      hasUi: sql<boolean>`${problems.ui} is not null`.as("has_ui"),
    }),
    with: {
      problemCompanies: {
        with: { company: { columns: { slug: true, name: true } } },
      },
    },
    orderBy: (problems, { asc }) => [asc(problems.id)],
  });

  const companyNames = new Map<string, string>();
  for (const row of rows) {
    for (const { company } of row.problemCompanies) {
      companyNames.set(company.slug, company.name);
    }
  }

  return {
    problems: rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      category: row.category,
      difficulty: row.difficulty,
      companies: row.problemCompanies.map((link) => link.company.slug),
      // The same order the problem page picks its workspace in.
      format: row.hasJudge
        ? "code"
        : row.hasUi
          ? "ui"
          : row.category === "system-design"
            ? "design"
            : "quiz",
    })),
    companies: [...companyNames]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Judge languages other than JavaScript, as a SQL list of literals. */
const EXTRA_LANGUAGE_LIST = sql.raw(
  LANGUAGES.filter((language) => language !== "javascript")
    .map((language) => `'${language}'`)
    .join(", "),
);

/**
 * The /problems list. Like the index, it selects only what a row shows and
 * reads the languages out of the judge in SQL, so the prompts and judges of
 * a few hundred problems never leave the database.
 */
export async function listProblemCards(): Promise<ProblemCard[]> {
  const rows = await db.query.problems.findMany({
    columns: {
      slug: true,
      title: true,
      category: true,
      difficulty: true,
      summary: true,
    },
    extras: (problems) => ({
      hasJudge: sql<boolean>`${problems.judge} is not null`.as("has_judge"),
      hasUi: sql<boolean>`${problems.ui} is not null`.as("has_ui"),
      judgeLanguages: sql<string[]>`array(
        select key from jsonb_object_keys(coalesce(${problems.judge}, '{}'::jsonb)) as k(key)
        where key in (${EXTRA_LANGUAGE_LIST}))`.as("judge_languages"),
    }),
    with: withCompanies,
    orderBy: (problems, { asc }) => [asc(problems.id)],
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    summary: row.summary,
    companies: row.problemCompanies.map((link) => link.company.slug),
    // JavaScript lives in the judge's own fields, so every judged problem
    // has it; a UI workspace is JavaScript too.
    languages: row.hasJudge
      ? LANGUAGES.filter(
          (language) =>
            language === "javascript" || row.judgeLanguages.includes(language),
        )
      : row.hasUi
        ? ["javascript"]
        : [],
  }));
}

/** One user's progress keyed by problem slug, for the status filter. */
export async function progressBySlug(userId: string): Promise<ProgressMap> {
  const rows = await db
    .select({
      slug: schema.problems.slug,
      status: schema.problemProgress.status,
    })
    .from(schema.problemProgress)
    .innerJoin(
      schema.problems,
      eq(schema.problemProgress.problemId, schema.problems.id),
    )
    .where(eq(schema.problemProgress.userId, userId));
  return Object.fromEntries(rows.map((row) => [row.slug, row.status]));
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
