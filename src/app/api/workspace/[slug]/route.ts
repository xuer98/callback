import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";

const NO_STORE = { "cache-control": "no-store" };

// The signed-in user's saved work for one problem — solution code per
// language plus the whiteboard scene — fetched client-side so content pages
// stay static. Timestamps are ms so the client can compare against its
// local copies (newest wins).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ signedIn: false }, { headers: NO_STORE });
  }

  const { slug } = await params;
  const problem = await db.query.problems.findFirst({
    where: eq(schema.problems.slug, slug),
    columns: { id: true },
  });
  if (!problem) {
    return Response.json(
      { signedIn: true, solutions: {}, board: null },
      { headers: NO_STORE },
    );
  }

  const [solutionRows, boardRow] = await Promise.all([
    db
      .select({
        language: schema.solutions.language,
        code: schema.solutions.code,
        updatedAt: schema.solutions.updatedAt,
      })
      .from(schema.solutions)
      .where(
        and(
          eq(schema.solutions.userId, session.user.id),
          eq(schema.solutions.problemId, problem.id),
        ),
      ),
    db.query.boards.findFirst({
      where: and(
        eq(schema.boards.userId, session.user.id),
        eq(schema.boards.problemId, problem.id),
      ),
      columns: { scene: true, updatedAt: true },
    }),
  ]);

  return Response.json(
    {
      signedIn: true,
      solutions: Object.fromEntries(
        solutionRows.map((row) => [
          row.language,
          { code: row.code, updatedAt: row.updatedAt.getTime() },
        ]),
      ),
      board: boardRow
        ? { scene: boardRow.scene, updatedAt: boardRow.updatedAt.getTime() }
        : null,
    },
    { headers: NO_STORE },
  );
}
