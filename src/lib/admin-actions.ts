"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "./auth";
import {
  CATEGORIES,
  DIFFICULTIES,
  type Category,
  type Difficulty,
  type Judge,
  type UiWorkspace,
} from "./types";

// Admin console writes. Every action re-checks the caller against
// ADMIN_EMAILS — server actions are public endpoints, so the page-level
// guard is presentation, not security. Content edited here lands in the
// same problems table the seed script upserts into, so `pnpm db:seed`
// overwrites console edits to seeded slugs (console-created problems are
// untouched — the seed only writes its own slugs).

const MAX_TITLE = 200;
const MAX_SUMMARY = 1000;
const MAX_PROMPT = 64 * 1024;
const MAX_SOLUTION = 64 * 1024;
const MAX_RUBRIC = 16 * 1024;
const MAX_HINT = 8 * 1024;
const MAX_HINTS = 10;
const MAX_JSON = 512 * 1024;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function sessionAdminEmail(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email?.toLowerCase();
  return email && adminEmails().includes(email) ? email : null;
}

/** The signed-in admin's email, or null — the page-level gate. */
export async function adminEmail(): Promise<string | null> {
  return sessionAdminEmail();
}

/** Everything the admin form submits, all as strings. */
export interface ProblemPayload {
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  /** Comma-separated company slugs. */
  companies: string;
  prompt: string;
  hints: string[];
  solution: string;
  rubric: string;
  /** JSON array of judge tests ({name?, input[], expected}). */
  testsJson: string;
  /** JSON of the judge minus tests (starterCode, entry, driver, languages). */
  judgeConfigJson: string;
  /** JSON of the UI workspace ({framework, files}). */
  uiJson: string;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

interface ParsedProblem {
  title: string;
  summary: string;
  category: Category;
  difficulty: Difficulty;
  companySlugs: string[];
  prompt: string;
  hints: string[];
  solution: string | null;
  rubric: string | null;
  judge: Judge | null;
  ui: UiWorkspace | null;
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function parseJson(
  label: string,
  raw: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  if (raw.length > MAX_JSON) return { ok: false, error: `${label} is too large.` };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (err) {
    return {
      ok: false,
      error: `${label} isn't valid JSON: ${err instanceof Error ? err.message : "parse error"}`,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJudge(
  testsJson: string,
  configJson: string,
): { judge: Judge | null } | { error: string } {
  const hasTests = testsJson.trim() !== "";
  const hasConfig = configJson.trim() !== "";
  if (!hasTests && !hasConfig) return { judge: null };
  if (!hasTests || !hasConfig) {
    return {
      error:
        "A judge needs both parts: tests, and the judge config with starterCode and entry.",
    };
  }

  const testsResult = parseJson("Tests", testsJson);
  if (!testsResult.ok) return { error: testsResult.error };
  const tests = testsResult.value;
  if (!Array.isArray(tests) || tests.length === 0) {
    return { error: "Tests must be a non-empty JSON array." };
  }
  for (const [i, test] of tests.entries()) {
    if (!isRecord(test)) return { error: `Test ${i + 1} must be an object.` };
    if (!Array.isArray(test.input)) {
      return { error: `Test ${i + 1} needs an "input" array (the arguments).` };
    }
    if (!("expected" in test)) {
      return { error: `Test ${i + 1} needs an "expected" value.` };
    }
    if (test.name !== undefined && typeof test.name !== "string") {
      return { error: `Test ${i + 1}: "name" must be a string.` };
    }
  }

  const configResult = parseJson("Judge config", configJson);
  if (!configResult.ok) return { error: configResult.error };
  const config = configResult.value;
  if (!isRecord(config)) {
    return { error: "Judge config must be a JSON object." };
  }
  if (typeof config.starterCode !== "string" || config.starterCode === "") {
    return { error: "Judge config needs a non-empty \"starterCode\" string." };
  }
  if (typeof config.entry !== "string" || config.entry === "") {
    return { error: "Judge config needs a non-empty \"entry\" string." };
  }
  if ("tests" in config) {
    return {
      error: "Put tests in the Tests field, not inside the judge config.",
    };
  }
  for (const lang of ["python", "typescript", "java", "cpp", "go"] as const) {
    const entry = config[lang];
    if (entry === undefined) continue;
    if (
      !isRecord(entry) ||
      typeof entry.starterCode !== "string" ||
      typeof entry.entry !== "string"
    ) {
      return {
        error: `Judge config "${lang}" must be an object with starterCode and entry strings.`,
      };
    }
  }

  return {
    judge: { ...config, tests } as unknown as Judge,
  };
}

function parseUi(uiJson: string): { ui: UiWorkspace | null } | { error: string } {
  if (uiJson.trim() === "") return { ui: null };
  const uiResult = parseJson("UI workspace", uiJson);
  if (!uiResult.ok) return { error: uiResult.error };
  const parsed = uiResult.value;
  if (
    !isRecord(parsed) ||
    (parsed.framework !== "react" && parsed.framework !== "vanilla") ||
    !Array.isArray(parsed.files) ||
    parsed.files.length === 0
  ) {
    return {
      error:
        'UI workspace must be {"framework": "react" | "vanilla", "files": [{name, contents}, ...]}.',
    };
  }
  for (const file of parsed.files) {
    if (
      !isRecord(file) ||
      typeof file.name !== "string" ||
      file.name.trim() === "" ||
      typeof file.contents !== "string"
    ) {
      return { error: "Every UI file needs a name and contents string." };
    }
  }
  return { ui: parsed as unknown as UiWorkspace };
}

/** Boundary validation for the whole payload; DB is only touched afterwards. */
function parsePayload(raw: unknown): ParsedProblem | { error: string } {
  if (!isRecord(raw)) return { error: "Malformed submission." };
  const p = raw as Partial<Record<keyof ProblemPayload, unknown>>;
  const strings = [
    "title",
    "summary",
    "category",
    "difficulty",
    "companies",
    "prompt",
    "solution",
    "rubric",
    "testsJson",
    "judgeConfigJson",
    "uiJson",
  ] as const;
  for (const key of strings) {
    if (typeof p[key] !== "string") return { error: "Malformed submission." };
  }
  if (
    !Array.isArray(p.hints) ||
    p.hints.some((hint) => typeof hint !== "string")
  ) {
    return { error: "Malformed submission." };
  }

  const title = (p.title as string).trim();
  const summary = (p.summary as string).trim();
  const prompt = (p.prompt as string).trim();
  if (title === "" || title.length > MAX_TITLE) {
    return { error: `Title is required (max ${MAX_TITLE} chars).` };
  }
  if (summary === "" || summary.length > MAX_SUMMARY) {
    return { error: `Summary is required (max ${MAX_SUMMARY} chars).` };
  }
  if (prompt === "" || prompt.length > MAX_PROMPT) {
    return { error: "Prompt is required (max 64k chars)." };
  }
  if (!(CATEGORIES as readonly string[]).includes(p.category as string)) {
    return { error: "Pick a valid category." };
  }
  if (!(DIFFICULTIES as readonly string[]).includes(p.difficulty as string)) {
    return { error: "Pick a valid difficulty." };
  }

  const hints = (p.hints as string[])
    .map((hint) => hint.trim())
    .filter(Boolean);
  if (hints.length > MAX_HINTS) {
    return { error: `At most ${MAX_HINTS} hints.` };
  }
  if (hints.some((hint) => hint.length > MAX_HINT)) {
    return { error: "A hint is over the 8k-char limit." };
  }

  const solution = (p.solution as string).trim();
  if (solution.length > MAX_SOLUTION) {
    return { error: "Solution is over the 64k-char limit." };
  }
  const rubric = (p.rubric as string).trim();
  if (rubric.length > MAX_RUBRIC) {
    return { error: "Rubric is over the 16k-char limit." };
  }

  const judgeResult = parseJudge(
    p.testsJson as string,
    p.judgeConfigJson as string,
  );
  if ("error" in judgeResult) return { error: judgeResult.error };
  const uiResult = parseUi(p.uiJson as string);
  if ("error" in uiResult) return { error: uiResult.error };

  const companySlugs = [
    ...new Set(
      (p.companies as string)
        .split(",")
        .map((slug) => slug.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  return {
    title,
    summary,
    category: p.category as Category,
    difficulty: p.difficulty as Difficulty,
    companySlugs,
    prompt,
    hints,
    solution: solution === "" ? null : solution,
    rubric: rubric === "" ? null : rubric,
    judge: judgeResult.judge,
    ui: uiResult.ui,
  };
}

/** Company slugs -> ids, or the list of unknown slugs. */
async function companyIds(
  slugs: string[],
): Promise<number[] | { unknown: string[] }> {
  if (slugs.length === 0) return [];
  const rows = await db
    .select({ id: schema.companies.id, slug: schema.companies.slug })
    .from(schema.companies)
    .where(inArray(schema.companies.slug, slugs));
  const bySlug = new Map(rows.map((row) => [row.slug, row.id]));
  const unknown = slugs.filter((slug) => !bySlug.has(slug));
  if (unknown.length > 0) return { unknown };
  return slugs.map((slug) => bySlug.get(slug)!);
}

function refreshAfterWrite(slug: string) {
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/problems");
  revalidatePath("/companies/[slug]", "page");
  revalidatePath("/tracks/[slug]", "page");
}

async function writeLinks(problemId: number, ids: number[]) {
  await db
    .delete(schema.problemCompanies)
    .where(eq(schema.problemCompanies.problemId, problemId));
  if (ids.length > 0) {
    await db
      .insert(schema.problemCompanies)
      .values(ids.map((companyId) => ({ problemId, companyId })));
  }
}

/** Update an existing problem's content. */
export async function saveProblem(
  slug: unknown,
  payload: unknown,
): Promise<SaveResult> {
  if (!(await sessionAdminEmail())) return fail("Not authorized.");
  if (typeof slug !== "string") return fail("Malformed submission.");

  const parsed = parsePayload(payload);
  if ("error" in parsed) return fail(parsed.error);

  const existing = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, slug),
    columns: { id: true },
  });
  if (!existing) return fail("No such problem.");

  const ids = await companyIds(parsed.companySlugs);
  if (!Array.isArray(ids)) {
    return fail(`Unknown company slugs: ${ids.unknown.join(", ")}.`);
  }

  await db
    .update(schema.problems)
    .set({
      title: parsed.title,
      summary: parsed.summary,
      category: parsed.category,
      difficulty: parsed.difficulty,
      prompt: parsed.prompt,
      hints: parsed.hints,
      solution: parsed.solution,
      rubric: parsed.rubric,
      judge: parsed.judge,
      ui: parsed.ui,
    })
    .where(eq(schema.problems.id, existing.id));
  await writeLinks(existing.id, ids);

  refreshAfterWrite(slug);
  return { ok: true };
}

/** Create a new problem under a fresh slug. */
export async function createProblem(
  slug: unknown,
  payload: unknown,
): Promise<SaveResult> {
  if (!(await sessionAdminEmail())) return fail("Not authorized.");
  if (
    typeof slug !== "string" ||
    slug.length > 80 ||
    !SLUG_PATTERN.test(slug)
  ) {
    return fail("Slug must be lowercase words separated by hyphens.");
  }

  const parsed = parsePayload(payload);
  if ("error" in parsed) return fail(parsed.error);

  const existing = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, slug),
    columns: { id: true },
  });
  if (existing) return fail(`A problem with slug "${slug}" already exists.`);

  const ids = await companyIds(parsed.companySlugs);
  if (!Array.isArray(ids)) {
    return fail(`Unknown company slugs: ${ids.unknown.join(", ")}.`);
  }

  const [row] = await db
    .insert(schema.problems)
    .values({
      slug,
      title: parsed.title,
      summary: parsed.summary,
      category: parsed.category,
      difficulty: parsed.difficulty,
      prompt: parsed.prompt,
      hints: parsed.hints,
      solution: parsed.solution,
      rubric: parsed.rubric,
      judge: parsed.judge,
      ui: parsed.ui,
    })
    .returning({ id: schema.problems.id });
  await writeLinks(row.id, ids);

  refreshAfterWrite(slug);
  return { ok: true };
}
