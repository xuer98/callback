"use server";

import { and, eq } from "drizzle-orm";
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
 * A saved document's key: a language for the judged editor, or "ui:<file>"
 * for a UI-workspace file. UI keys are checked against the problem's own
 * file list, so the table can't accumulate rows for files that don't exist.
 */
async function validSlot(slug: string, slot: string): Promise<boolean> {
  if ((LANGUAGES as readonly string[]).includes(slot)) return true;
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
