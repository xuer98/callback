import { adminEmail } from "@/lib/admin-actions";
import { storeIllustration } from "@/lib/illustration-store";

// Uploads from the admin console's editor: a drawn diagram (its SVG export
// plus the Excalidraw scene) or an illustration file, as multipart form
// data. Admin-only, like every console write; the store validates the rest.
export async function POST(request: Request) {
  if (!(await adminEmail())) {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected a multipart form." },
      { status: 400 },
    );
  }
  const result = await storeIllustration(form);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ id: result.id, url: result.url });
}
