import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
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
import { applePythonJudges } from "../lib/seed-python-apple";
import { applePythonJudgesB } from "../lib/seed-python-apple-b";
import { applePythonJudgesC } from "../lib/seed-python-apple-c";
import { applePythonJudgesD } from "../lib/seed-python-apple-d";
import { applePythonJudgesE } from "../lib/seed-python-apple-e";
import { splitPythonJudges } from "../lib/seed-python-splits";
import { snowflakePythonJudgesA } from "../lib/seed-python-snowflake-a";
import { snowflakePythonJudgesB } from "../lib/seed-python-snowflake-b";
import { snowflakePythonJudgesC } from "../lib/seed-python-snowflake-c";
import { snowflakePythonJudgesD } from "../lib/seed-python-snowflake-d";
import { snowflakePythonJudgesE } from "../lib/seed-python-snowflake-e";
import { snowflakePythonJudgesF } from "../lib/seed-python-snowflake-f";
import { snowflakePythonJudgesG } from "../lib/seed-python-snowflake-g";
import { snowflakePythonJudgesH } from "../lib/seed-python-snowflake-h";
import { snowflakePythonJudgesI } from "../lib/seed-python-snowflake-i";
import { snowflakePythonJudgesJ } from "../lib/seed-python-snowflake-j";
import { snowflakePythonJudgesK } from "../lib/seed-python-snowflake-k";
import { snowflakePythonJudgesL } from "../lib/seed-python-snowflake-l";
import { snowflakePythonJudgesM } from "../lib/seed-python-snowflake-m";
import { typescriptJudges } from "../lib/seed-typescript";
import { appleTypescriptJudges } from "../lib/seed-typescript-apple";
import { appleTypescriptJudgesB } from "../lib/seed-typescript-apple-b";
import { splitTypescriptJudges } from "../lib/seed-typescript-splits";
import { splitTypescriptJudgesB } from "../lib/seed-typescript-splits-b";
import { javaJudges } from "../lib/seed-java";
import { cppJudges } from "../lib/seed-cpp";
import { goJudges } from "../lib/seed-go";
import {
  cppSplitJudges,
  goSplitJudges,
  javaSplitJudges,
} from "../lib/seed-compiled-splits";

/**
 * Problems whose slug changed when a multi-part prompt was split into
 * separate problems. The first part keeps the original row under its new
 * slug, and with it every user's progress, drafts and submissions, which
 * reference the row id.
 */
const RENAMED_SLUGS: Record<string, string> = {
  "insert-interval-sessionize": "insert-interval",
  "distribution-preserving-sampling": "reservoir-sampling",
  "eval-metrics-as-code": "precision-recall-f1",
  "array-method-polyfills": "implement-array-map",
  "promise-basics-and-helpers": "promise-basics",
  "memoize-curry-once": "implement-memoize",
  "chunk-and-group-by": "implement-chunk",
  "array-products-two-readings": "product-of-others",
  "min-stack-and-multiply": "min-stack",
  "screen-warm-ups": "string-to-integer",
  "javascript-output-quiz": "promise-timer-order-quiz",
  "react-output-quiz": "redux-reducer-state-quiz",
  "javascript-language-concepts": "closures-explained",
  "browser-rendering-concepts": "event-bubbling-explained",
  "web-security-and-tooling-concepts": "cors-explained",
  "load-css-and-tooltips": "load-css-on-demand",
  "debounce-cancel-flush-throttle": "debounce-cancel-flush",
};

/**
 * Problems that turned out to duplicate an existing one and were folded
 * into it: duplicate slug -> surviving slug. The duplicate's progress,
 * drafts, boards and submissions move to the survivor before its row is
 * deleted, so nothing a user did on either page is lost. A console-edited
 * duplicate is left alone, like a renamed one.
 */
const MERGED_SLUGS: Record<string, string> = {
  "conflict-with-colleague-or-stakeholder": "conflict-with-teammate",
  "run-length-compress": "run-length-encode-decode",
};

type Tx = Parameters<
  Parameters<NodePgDatabase<typeof schema>["transaction"]>[0]
>[0];

/**
 * Re-points every per-user row from one problem to another. Where a user
 * already has a row on the survivor, "solved" beats "attempted" and the
 * newer draft or board wins; history tables simply move.
 */
async function moveUserData(tx: Tx, from: number, to: number) {
  await tx.execute(sql`
    insert into problem_progress (user_id, problem_id, status, updated_at)
    select user_id, ${to}::int, status, updated_at
    from problem_progress where problem_id = ${from}
    on conflict (user_id, problem_id) do update set
      status = case
        when excluded.status = 'solved' or problem_progress.status = 'solved'
        then 'solved'::progress_status else 'attempted'::progress_status end,
      updated_at = greatest(problem_progress.updated_at, excluded.updated_at)`);
  await tx.execute(sql`
    insert into solutions (user_id, problem_id, language, code, updated_at)
    select user_id, ${to}::int, language, code, updated_at
    from solutions where problem_id = ${from}
    on conflict (user_id, problem_id, language) do update set
      code = case when excluded.updated_at > solutions.updated_at
        then excluded.code else solutions.code end,
      updated_at = greatest(solutions.updated_at, excluded.updated_at)`);
  await tx.execute(sql`
    insert into boards (user_id, problem_id, scene, updated_at)
    select user_id, ${to}::int, scene, updated_at
    from boards where problem_id = ${from}
    on conflict (user_id, problem_id) do update set
      scene = case when excluded.updated_at > boards.updated_at
        then excluded.scene else boards.scene end,
      updated_at = greatest(boards.updated_at, excluded.updated_at)`);
  for (const table of [
    schema.designSubmissions,
    schema.designChatMessages,
    schema.algoSubmissions,
  ]) {
    await tx
      .update(table)
      .set({ problemId: to })
      .where(eq(table.problemId, from));
  }
}

// Idempotent: upserts rows by slug and rebuilds the join tables, so it is
// safe to run after every content edit in src/lib/seed-data.ts.
async function main() {
  let questionCount = 0;
  let skippedEdited = 0;
  let renamed = 0;
  let merged = 0;
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

    // Move renamed rows to their new slug first, so the upsert below updates
    // them instead of inserting fresh rows. A console-edited row keeps its
    // slug, and so does a row whose new slug is already taken.
    for (const [from, to] of Object.entries(RENAMED_SLUGS)) {
      const moved = await tx
        .update(schema.problems)
        .set({ slug: to })
        .where(
          and(
            eq(schema.problems.slug, from),
            isNull(schema.problems.editedAt),
            sql`not exists (select 1 from ${schema.problems} as taken where taken.slug = ${to})`,
          ),
        )
        .returning({ id: schema.problems.id });
      renamed += moved.length;
    }

    // Fold duplicates into their survivors: move the user data across, then
    // drop the duplicate row. With no survivor yet it is just a rename.
    for (const [from, to] of Object.entries(MERGED_SLUGS)) {
      const [dup] = await tx
        .select({ id: schema.problems.id, editedAt: schema.problems.editedAt })
        .from(schema.problems)
        .where(eq(schema.problems.slug, from));
      if (!dup || dup.editedAt !== null) continue;
      const [survivor] = await tx
        .select({ id: schema.problems.id })
        .from(schema.problems)
        .where(eq(schema.problems.slug, to));
      if (!survivor) {
        await tx
          .update(schema.problems)
          .set({ slug: to })
          .where(eq(schema.problems.id, dup.id));
        renamed += 1;
        continue;
      }
      await moveUserData(tx, dup.id, survivor.id);
      await tx.delete(schema.problems).where(eq(schema.problems.id, dup.id));
      merged += 1;
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
        solution: problem.solution ?? null,
        rubric: problem.rubric ?? null,
        // Judges gain their per-language definitions at seed time.
        judge: problem.judge
          ? {
              ...problem.judge,
              python:
                pythonJudges[problem.slug] ??
                applePythonJudges[problem.slug] ??
                applePythonJudgesB[problem.slug] ??
                applePythonJudgesC[problem.slug] ??
                applePythonJudgesD[problem.slug] ??
                applePythonJudgesE[problem.slug] ??
                splitPythonJudges[problem.slug] ??
                snowflakePythonJudgesA[problem.slug] ??
                snowflakePythonJudgesB[problem.slug] ??
                snowflakePythonJudgesC[problem.slug] ??
                snowflakePythonJudgesD[problem.slug] ??
                snowflakePythonJudgesE[problem.slug] ??
                snowflakePythonJudgesF[problem.slug] ??
                snowflakePythonJudgesG[problem.slug] ??
                snowflakePythonJudgesH[problem.slug] ??
                snowflakePythonJudgesI[problem.slug] ??
                snowflakePythonJudgesJ[problem.slug] ??
                snowflakePythonJudgesK[problem.slug] ??
                snowflakePythonJudgesL[problem.slug] ??
                snowflakePythonJudgesM[problem.slug],
              typescript:
                typescriptJudges[problem.slug] ??
                appleTypescriptJudges[problem.slug] ??
                appleTypescriptJudgesB[problem.slug] ??
                splitTypescriptJudges[problem.slug] ??
                splitTypescriptJudgesB[problem.slug],
              java: javaJudges[problem.slug] ?? javaSplitJudges[problem.slug],
              cpp: cppJudges[problem.slug] ?? cppSplitJudges[problem.slug],
              go: goJudges[problem.slug] ?? goSplitJudges[problem.slug],
            }
          : null,
        ui: problem.ui ?? null,
      };
      // Console-edited problems (edited_at set) belong to the admin console
      // until released — the seed inserts missing rows but never overwrites
      // an edited one.
      await tx
        .insert(schema.problems)
        .values(values)
        .onConflictDoUpdate({
          target: schema.problems.slug,
          set: values,
          setWhere: sql`${schema.problems.editedAt} is null`,
        });
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

    const problemRows = await tx.select().from(schema.problems);
    const problemIds = new Map(problemRows.map((p) => [p.slug, p.id]));
    const editedSlugs = new Set(
      problemRows.filter((p) => p.editedAt !== null).map((p) => p.slug),
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

    // Rebuild company links only for seeded problems the console doesn't
    // own — console-created and console-edited problems keep theirs.
    const linkable = seedProblems.filter(
      (problem) => !editedSlugs.has(problem.slug),
    );
    skippedEdited = seedProblems.length - linkable.length;
    const linkableIds = linkable.map((problem) =>
      requireId(problemIds, problem.slug, "problem"),
    );
    if (linkableIds.length > 0) {
      await tx
        .delete(schema.problemCompanies)
        .where(inArray(schema.problemCompanies.problemId, linkableIds));
    }
    const companyLinks = linkable.flatMap((problem) =>
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
  if (renamed > 0) {
    console.log(`Moved ${renamed} renamed problem(s) to their new slugs.`);
  }
  if (merged > 0) {
    console.log(`Merged ${merged} duplicate problem(s) into their survivors.`);
  }
  if (skippedEdited > 0) {
    console.log(
      `Left ${skippedEdited} console-edited problem(s) alone — release them in /admin to re-sync from the repo.`,
    );
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
