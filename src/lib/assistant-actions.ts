"use server";

import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "./auth";

// Reads and the one write the assistant panel needs besides the streaming
// route: the signed-in user's thread for a problem, and wiping it for a new
// chat. Anonymous callers get nothing, mirroring workspace-actions.

export interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Server timestamp, ms epoch — serializable across the action boundary. */
  createdAt: number;
}

/** Mirrors the route's per-thread ceiling. */
const MAX_THREAD_MESSAGES = 80;

async function ownThread(
  problemSlug: unknown,
): Promise<{ userId: string; problemId: number } | null> {
  if (typeof problemSlug !== "string") return null;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id;
  if (!userId) return null;
  const row = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, problemSlug),
    columns: { id: true },
  });
  return row ? { userId, problemId: row.id } : null;
}

/** The signed-in user's assistant thread for one problem, oldest first. */
export async function listAssistantChat(
  problemSlug: unknown,
): Promise<AssistantMessage[]> {
  const thread = await ownThread(problemSlug);
  if (!thread) return [];
  const rows = await db
    .select({
      id: schema.assistantMessages.id,
      role: schema.assistantMessages.role,
      content: schema.assistantMessages.content,
      createdAt: schema.assistantMessages.createdAt,
    })
    .from(schema.assistantMessages)
    .where(
      and(
        eq(schema.assistantMessages.userId, thread.userId),
        eq(schema.assistantMessages.problemId, thread.problemId),
      ),
    )
    .orderBy(
      asc(schema.assistantMessages.createdAt),
      asc(schema.assistantMessages.id),
    )
    .limit(MAX_THREAD_MESSAGES);
  return rows.map((row) => ({
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    createdAt: row.createdAt.getTime(),
  }));
}

/** Wipe the signed-in user's assistant thread for one problem (New chat). */
export async function clearAssistantChat(problemSlug: unknown): Promise<void> {
  const thread = await ownThread(problemSlug);
  if (!thread) return;
  await db
    .delete(schema.assistantMessages)
    .where(
      and(
        eq(schema.assistantMessages.userId, thread.userId),
        eq(schema.assistantMessages.problemId, thread.problemId),
      ),
    );
}
