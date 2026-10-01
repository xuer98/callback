import { getProblemIndex } from "@/lib/data";

// The problem side menu's list. Fetched client-side the first time the menu
// opens, so problem pages stay static and none of them carries the whole
// index. Cached like those pages, and refreshed on the same schedule.
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  return Response.json(await getProblemIndex());
}
