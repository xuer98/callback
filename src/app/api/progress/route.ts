import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";

// Per-user progress map, fetched client-side so content pages stay static.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({}, { headers: { "cache-control": "no-store" } });
  }

  const rows = await db
    .select({ slug: schema.problems.slug, status: schema.problemProgress.status })
    .from(schema.problemProgress)
    .innerJoin(
      schema.problems,
      eq(schema.problemProgress.problemId, schema.problems.id),
    )
    .where(eq(schema.problemProgress.userId, session.user.id));

  return Response.json(
    Object.fromEntries(rows.map((row) => [row.slug, row.status])),
    { headers: { "cache-control": "no-store" } },
  );
}
