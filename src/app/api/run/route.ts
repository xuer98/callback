import { getProblem } from "@/lib/data";
import { isJudge0Configured, runOnJudge0 } from "@/lib/judge0";

const MAX_CODE_BYTES = 64 * 1024;

// Executes a solution against a problem's judge on Judge0. The judge is
// loaded server-side by slug so clients can't submit doctored test cases.
export async function POST(request: Request) {
  if (!isJudge0Configured()) {
    // Distinct status so the client knows to fall back to in-browser runs.
    return Response.json(
      { error: "Judge0 is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { slug, code } = (body ?? {}) as { slug?: unknown; code?: unknown };
  if (typeof slug !== "string" || typeof code !== "string") {
    return Response.json(
      { error: "Expected { slug: string, code: string }." },
      { status: 400 },
    );
  }
  if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) {
    return Response.json(
      { error: "Solution is too large (64 KB limit)." },
      { status: 413 },
    );
  }

  const problem = await getProblem(slug);
  if (!problem?.judge) {
    return Response.json(
      { error: "No runnable judge for that problem." },
      { status: 404 },
    );
  }

  const result = await runOnJudge0(code, problem.judge);
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
