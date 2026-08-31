"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { LANGUAGES } from "./types";
import { auth } from "./auth";

// Writes for the account-backed workspace: saved code per problem/language
// and the whiteboard scene per problem. Every action validates its inputs
// at the boundary and silently no-ops for anonymous users, mirroring
// progress-actions — the workspace must keep working signed out.

const MAX_CODE_BYTES = 64 * 1024; // matches /api/run
const MAX_SCENE_BYTES = 1024 * 1024; // sketches, incl. pasted images

async function sessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

async function problemIdBySlug(slug: string): Promise<number | null> {
  const row = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, slug),
    columns: { id: true },
  });
  return row?.id ?? null;
}

/**
 * A saved document's key: a language for the judged editor, "ui:<file>" for
 * a UI-workspace file, or "design" for a system-design write-up. UI keys are
 * checked against the problem's own file list and "design" against the
 * category, so the table can't accumulate rows that don't belong.
 */
async function validSlot(slug: string, slot: string): Promise<boolean> {
  if ((LANGUAGES as readonly string[]).includes(slot)) return true;
  if (slot === "design") {
    const row = await db.query.problems.findFirst({
      where: eq(schema.problems.slug, slug),
      columns: { category: true },
    });
    return row?.category === "system-design";
  }
  if (!slot.startsWith("ui:")) return false;
  const row = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, slug),
    columns: { ui: true },
  });
  const name = slot.slice("ui:".length);
  return row?.ui?.files.some((file) => file.name === name) ?? false;
}

/**
 * Upsert the user's solution for one problem/language. Returns the server
 * timestamp (ms) so the client can align its local copy, or null when the
 * save didn't happen.
 */
export async function saveSolution(
  problemSlug: unknown,
  language: unknown,
  code: unknown,
): Promise<number | null> {
  if (typeof problemSlug !== "string" || typeof code !== "string") return null;
  if (typeof language !== "string" || !(await validSlot(problemSlug, language))) {
    return null;
  }
  if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) return null;
  const userId = await sessionUserId();
  if (!userId) return null;
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return null;

  const updatedAt = new Date();
  await db
    .insert(schema.solutions)
    .values({ userId, problemId, language, code, updatedAt })
    .onConflictDoUpdate({
      target: [
        schema.solutions.userId,
        schema.solutions.problemId,
        schema.solutions.language,
      ],
      set: { code, updatedAt },
    });
  return updatedAt.getTime();
}

/** Remove a saved solution — the server half of the editor's Reset. */
export async function deleteSolution(
  problemSlug: unknown,
  language: unknown,
): Promise<void> {
  if (typeof problemSlug !== "string" || typeof language !== "string") return;
  const userId = await sessionUserId();
  if (!userId) return;
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return;

  await db
    .delete(schema.solutions)
    .where(
      and(
        eq(schema.solutions.userId, userId),
        eq(schema.solutions.problemId, problemId),
        eq(schema.solutions.language, language),
      ),
    );
}

export interface DesignFeedback {
  id: number;
  feedback: string;
  /** Server timestamp, ms epoch — serializable across the action boundary. */
  createdAt: number;
}

/** The signed-in user's past AI design reviews for one problem, newest first. */
export async function listDesignFeedback(
  problemSlug: unknown,
): Promise<DesignFeedback[]> {
  if (typeof problemSlug !== "string") return [];
  const userId = await sessionUserId();
  if (!userId) return [];
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return [];

  const rows = await db
    .select({
      id: schema.designSubmissions.id,
      feedback: schema.designSubmissions.feedback,
      createdAt: schema.designSubmissions.createdAt,
    })
    .from(schema.designSubmissions)
    .where(
      and(
        eq(schema.designSubmissions.userId, userId),
        eq(schema.designSubmissions.problemId, problemId),
      ),
    )
    .orderBy(desc(schema.designSubmissions.createdAt))
    .limit(20);
  return rows.map((row) => ({
    id: row.id,
    feedback: row.feedback,
    createdAt: row.createdAt.getTime(),
  }));
}

export interface AlgoSubmission {
  id: number;
  language: string;
  code: string;
  status: "pass" | "fail" | "error" | "timeout";
  passed: number;
  total: number;
  runtimeMs: number | null;
  /** Server timestamp, ms epoch — serializable across the action boundary. */
  createdAt: number;
}

const SUBMISSION_STATUSES = ["pass", "fail", "error", "timeout"] as const;
/** Generous ceilings — no judge has anywhere near this many tests. */
const MAX_SUBMISSION_TESTS = 500;
const MAX_RUNTIME_MS = 3_600_000;

function asCount(value: unknown, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max
    ? value
    : null;
}

/**
 * Archive one graded attempt (the Submit button; Run stays ephemeral).
 * The verdict is client-reported — it's the user's own practice record,
 * so the boundary checks shapes and ceilings, not honesty. Returns the
 * stored row for prepending to the history, or null when nothing was saved.
 */
export async function recordSubmission(
  problemSlug: unknown,
  language: unknown,
  code: unknown,
  outcome: unknown,
): Promise<AlgoSubmission | null> {
  if (typeof problemSlug !== "string" || typeof code !== "string") return null;
  if (
    typeof language !== "string" ||
    !(LANGUAGES as readonly string[]).includes(language)
  ) {
    return null;
  }
  if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) return null;
  if (typeof outcome !== "object" || outcome === null) return null;
  const { status, runtimeMs } = outcome as Record<string, unknown>;
  if (!(SUBMISSION_STATUSES as readonly unknown[]).includes(status)) return null;
  const passed = asCount((outcome as Record<string, unknown>).passed, MAX_SUBMISSION_TESTS);
  const total = asCount((outcome as Record<string, unknown>).total, MAX_SUBMISSION_TESTS);
  if (passed === null || total === null || passed > total) return null;
  const runtime =
    runtimeMs === null ? null : asCount(runtimeMs, MAX_RUNTIME_MS);
  if (runtime === null && runtimeMs !== null) return null;

  const userId = await sessionUserId();
  if (!userId) return null;
  const problem = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, problemSlug),
    columns: { id: true, judge: true },
  });
  // Submissions exist only for judged problems — that's what "graded" means.
  if (!problem || problem.judge === null) return null;

  const [row] = await db
    .insert(schema.algoSubmissions)
    .values({
      userId,
      problemId: problem.id,
      language,
      code,
      status: status as string,
      passed,
      total,
      runtimeMs: runtime,
    })
    .returning({
      id: schema.algoSubmissions.id,
      createdAt: schema.algoSubmissions.createdAt,
    });
  return {
    id: row.id,
    language,
    code,
    status: status as AlgoSubmission["status"],
    passed,
    total,
    runtimeMs: runtime,
    createdAt: row.createdAt.getTime(),
  };
}

/** The signed-in user's recent submissions for one problem, newest first. */
export async function listSubmissions(
  problemSlug: unknown,
): Promise<AlgoSubmission[]> {
  if (typeof problemSlug !== "string") return [];
  const userId = await sessionUserId();
  if (!userId) return [];
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return [];

  const rows = await db
    .select({
      id: schema.algoSubmissions.id,
      language: schema.algoSubmissions.language,
      code: schema.algoSubmissions.code,
      status: schema.algoSubmissions.status,
      passed: schema.algoSubmissions.passed,
      total: schema.algoSubmissions.total,
      runtimeMs: schema.algoSubmissions.runtimeMs,
      createdAt: schema.algoSubmissions.createdAt,
    })
    .from(schema.algoSubmissions)
    .where(
      and(
        eq(schema.algoSubmissions.userId, userId),
        eq(schema.algoSubmissions.problemId, problemId),
      ),
    )
    .orderBy(desc(schema.algoSubmissions.createdAt), desc(schema.algoSubmissions.id))
    .limit(20);
  return rows.map((row) => ({
    ...row,
    status: row.status as AlgoSubmission["status"],
    createdAt: row.createdAt.getTime(),
  }));
}

/**
 * Upsert the user's whiteboard scene for one problem. Takes the serialized
 * scene (the same string the client writes to localStorage) so both copies
 * are byte-identical. Returns the server timestamp (ms), or null.
 */
export async function saveBoard(
  problemSlug: unknown,
  sceneJson: unknown,
): Promise<number | null> {
  if (typeof problemSlug !== "string" || typeof sceneJson !== "string") {
    return null;
  }
  if (new TextEncoder().encode(sceneJson).length > MAX_SCENE_BYTES) return null;
  let scene: unknown;
  try {
    scene = JSON.parse(sceneJson);
  } catch {
    return null;
  }
  if (
    typeof scene !== "object" ||
    scene === null ||
    !Array.isArray((scene as { elements?: unknown }).elements)
  ) {
    return null;
  }
  const userId = await sessionUserId();
  if (!userId) return null;
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return null;

  const updatedAt = new Date();
  await db
    .insert(schema.boards)
    .values({ userId, problemId, scene, updatedAt })
    .onConflictDoUpdate({
      target: [schema.boards.userId, schema.boards.problemId],
      set: { scene, updatedAt },
    });
  return updatedAt.getTime();
}
