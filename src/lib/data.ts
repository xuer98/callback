import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import type { Category, Company, Problem, Track } from "./types";

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
