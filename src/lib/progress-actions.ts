"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "./auth";

export type ProgressStatus = "attempted" | "solved" | null;

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
 * Record the outcome of a judge run. Solved is sticky: a later failing run
 * never downgrades it. Silently no-ops for anonymous users or unknown slugs.
 */
export async function recordRunResult(
  problemSlug: unknown,
  passed: unknown,
): Promise<ProgressStatus> {
  if (typeof problemSlug !== "string" || typeof passed !== "boolean") {
    return null;
  }
  const userId = await sessionUserId();
  if (!userId) return null;
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return null;

  const status = passed ? "solved" : "attempted";
  const existing = await db.query.problemProgress.findFirst({
    where: and(
      eq(schema.problemProgress.userId, userId),
      eq(schema.problemProgress.problemId, problemId),
    ),
    columns: { status: true },
  });
  if (existing?.status === "solved") return "solved";

  await db
    .insert(schema.problemProgress)
    .values({ userId, problemId, status, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.problemProgress.userId, schema.problemProgress.problemId],
      set: { status, updatedAt: new Date() },
    });
  return status;
}

/** Manual toggle for problems without a judge. Solved ⇄ not tracked. */
export async function toggleProblemDone(
  problemSlug: unknown,
): Promise<ProgressStatus> {
  if (typeof problemSlug !== "string") return null;
  const userId = await sessionUserId();
  if (!userId) return null;
  const problemId = await problemIdBySlug(problemSlug);
  if (problemId === null) return null;

  const existing = await db.query.problemProgress.findFirst({
    where: and(
      eq(schema.problemProgress.userId, userId),
      eq(schema.problemProgress.problemId, problemId),
    ),
    columns: { status: true },
  });

  if (existing?.status === "solved") {
    await db
      .delete(schema.problemProgress)
      .where(
        and(
          eq(schema.problemProgress.userId, userId),
          eq(schema.problemProgress.problemId, problemId),
        ),
      );
    return null;
  }

  await db
    .insert(schema.problemProgress)
    .values({ userId, problemId, status: "solved", updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.problemProgress.userId, schema.problemProgress.problemId],
      set: { status: "solved", updatedAt: new Date() },
    });
  return "solved";
}
