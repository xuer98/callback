import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import {
  companies as seedCompanies,
  problems as seedProblems,
  tracks as seedTracks,
} from "../lib/seed-data";
import { pythonJudges } from "../lib/seed-python";
import { typescriptJudges } from "../lib/seed-typescript";
import { javaJudges } from "../lib/seed-java";
import { cppJudges } from "../lib/seed-cpp";
import { goJudges } from "../lib/seed-go";

// Idempotent: upserts rows by slug and rebuilds the join tables, so it is
// safe to run after every content edit in src/lib/seed-data.ts.
async function main() {
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
    `Seeded ${seedProblems.length} problems, ${seedCompanies.length} companies, ${seedTracks.length} tracks.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
