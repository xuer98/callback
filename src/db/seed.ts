import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import {
  problems as seedProblems,
  tracks as seedTracks,
} from "../lib/seed-data";
import { companies as seedCompanies } from "../lib/seed-companies";
import type { Difficulty, Timeframe } from "../lib/types";

/**
 * Company question listings, built from the upstream snapshot (see the file's
 * own `source` field). Read at runtime rather than imported so the 600KB
 * payload never reaches the app bundle — only this script touches it.
 */
interface QuestionData {
  source: string;
  snapshot: string;
  topics: string[];
  /** [leetcode slug, title, difficulty, topic indices] */
  questions: [string, string, Difficulty, number[]][];
  /** company slug -> timeframe -> [question index, frequency] */
  companies: Record<string, Record<Timeframe, [number, number][]>>;
}

/** Postgres caps a statement at 65535 parameters; stay far under it. */
async function inBatches<T>(
  rows: T[],
  size: number,
  write: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += size) {
    await write(rows.slice(i, i + size));
  }
}
import { pythonJudges } from "../lib/seed-python";
import { typescriptJudges } from "../lib/seed-typescript";
import { javaJudges } from "../lib/seed-java";
import { cppJudges } from "../lib/seed-cpp";
import { goJudges } from "../lib/seed-go";
import { problemSolutions } from "../lib/seed-solutions";

// Idempotent: upserts rows by slug and rebuilds the join tables, so it is
// safe to run after every content edit in src/lib/seed-data.ts.
async function main() {
  let questionCount = 0;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://localhost:5432/callback",
  });
  const db = drizzle(pool, { schema });

  await db.transaction(async (tx) => {
    for (const company of seedCompanies) {
      const values = {
        slug: company.slug,
        name: company.name,
        blurb: company.blurb,
        process: company.process,
      };
      await tx
        .insert(schema.companies)
        .values(values)
        .onConflictDoUpdate({ target: schema.companies.slug, set: values });
    }

    for (const problem of seedProblems) {
      const values = {
        slug: problem.slug,
        title: problem.title,
        category: problem.category,
        difficulty: problem.difficulty,
        summary: problem.summary,
        prompt: problem.prompt,
        hints: problem.hints,
        // Solutions live in their own module, keyed by slug, like the
        // per-language judges below.
        solution: problemSolutions[problem.slug] ?? null,
        // Judges gain their per-language definitions at seed time.
        judge: problem.judge
          ? {
              ...problem.judge,
              python: pythonJudges[problem.slug],
              typescript: typescriptJudges[problem.slug],
              java: javaJudges[problem.slug],
              cpp: cppJudges[problem.slug],
              go: goJudges[problem.slug],
            }
          : null,
      };
      await tx
        .insert(schema.problems)
        .values(values)
        .onConflictDoUpdate({ target: schema.problems.slug, set: values });
    }

    for (const track of seedTracks) {
      const values = {
        slug: track.slug,
        name: track.name,
        description: track.description,
      };
      await tx
        .insert(schema.tracks)
        .values(values)
        .onConflictDoUpdate({ target: schema.tracks.slug, set: values });
    }

    const problemIds = new Map(
      (await tx.select().from(schema.problems)).map((p) => [p.slug, p.id]),
    );
    const companyIds = new Map(
      (await tx.select().from(schema.companies)).map((c) => [c.slug, c.id]),
    );
    const trackIds = new Map(
      (await tx.select().from(schema.tracks)).map((t) => [t.slug, t.id]),
    );

    const requireId = (map: Map<string, number>, slug: string, kind: string) => {
      const id = map.get(slug);
      if (id === undefined) throw new Error(`Unknown ${kind} slug: ${slug}`);
      return id;
    };

    await tx.delete(schema.problemCompanies);
    const companyLinks = seedProblems.flatMap((problem) =>
      problem.companies.map((companySlug) => ({
        problemId: requireId(problemIds, problem.slug, "problem"),
        companyId: requireId(companyIds, companySlug, "company"),
      })),
    );
    if (companyLinks.length > 0) {
      await tx.insert(schema.problemCompanies).values(companyLinks);
    }

    const questionData: QuestionData = JSON.parse(
      readFileSync(join(__dirname, "leetcode-questions.json"), "utf8"),
    );

    await inBatches(questionData.questions, 500, (chunk) =>
      tx
        .insert(schema.leetcodeQuestions)
        .values(
          chunk.map(([slug, title, difficulty, topicIds]) => ({
            slug,
            title,
            difficulty,
            topics: topicIds.map((t) => questionData.topics[t]),
          })),
        )
        .onConflictDoUpdate({
          target: schema.leetcodeQuestions.slug,
          set: {
            title: sql`excluded.title`,
            difficulty: sql`excluded.difficulty`,
            topics: sql`excluded.topics`,
          },
        }),
    );

    const questionIds = new Map(
      (await tx.select().from(schema.leetcodeQuestions)).map((q) => [
        q.slug,
        q.id,
      ]),
    );
    const askedLinks = Object.entries(questionData.companies).flatMap(
      ([companySlug, byTimeframe]) =>
        Object.entries(byTimeframe).flatMap(([timeframe, entries]) =>
          entries.map(([questionIndex, frequency]) => ({
            companyId: requireId(companyIds, companySlug, "company"),
            questionId: requireId(
              questionIds,
              questionData.questions[questionIndex][0],
              "question",
            ),
            timeframe: timeframe as Timeframe,
            frequency,
          })),
        ),
    );
    questionCount = askedLinks.length;
    await tx.delete(schema.companyQuestions);
    await inBatches(askedLinks, 2000, (chunk) =>
      tx.insert(schema.companyQuestions).values(chunk),
    );

    await tx.delete(schema.trackProblems);
    const trackLinks = seedTracks.flatMap((track) =>
      track.problemSlugs.map((problemSlug, position) => ({
        trackId: requireId(trackIds, track.slug, "track"),
        problemId: requireId(problemIds, problemSlug, "problem"),
        position,
      })),
    );
    if (trackLinks.length > 0) {
      await tx.insert(schema.trackProblems).values(trackLinks);
    }
  });

  console.log(
    `Seeded ${seedProblems.length} problems, ${seedCompanies.length} companies, ${seedTracks.length} tracks, ${questionCount} company question listings.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
