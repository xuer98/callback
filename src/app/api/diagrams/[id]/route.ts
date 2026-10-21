import { adminEmail } from "@/lib/admin-actions";
import {
  illustrationResponse,
  loadIllustration,
} from "@/lib/illustration-store";

// A drawn diagram, by its content-addressed id: the SVG that
// `![caption](/api/diagrams/<id>)` in problem content points at. With
// `?scene`, the Excalidraw scene it was exported from, so the admin console
// can reopen it for editing — admins only, since it is authoring data.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await loadIllustration(id, "diagram");
  if (!row) return new Response("Not found", { status: 404 });
  if (new URL(request.url).searchParams.has("scene")) {
    if (!(await adminEmail())) {
      return new Response("Not found", { status: 404 });
    }
    return Response.json(row.scene, {
      headers: { "cache-control": "no-store" },
    });
  }
  return illustrationResponse(row);
}
