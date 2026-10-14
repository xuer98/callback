import { favoriteSlugs } from "@/lib/data";
import { auth } from "@/lib/auth";

// The signed-in user's starred problems, fetched client-side like progress
// so content pages stay static. An empty list for anonymous visitors.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const slugs = session ? await favoriteSlugs(session.user.id) : [];
  return Response.json(slugs, { headers: { "cache-control": "no-store" } });
}
