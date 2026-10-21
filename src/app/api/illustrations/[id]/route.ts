import {
  illustrationResponse,
  loadIllustration,
} from "@/lib/illustration-store";

// An uploaded illustration, by its content-addressed id: what
// `![caption](/api/illustrations/<id>)` in problem content points at.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await loadIllustration(id, "illustration");
  if (!row) return new Response("Not found", { status: 404 });
  return illustrationResponse(row);
}
