import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import {
  ID_PATTERN,
  ILLUSTRATION_KINDS,
  illustrationPath,
  IMAGE_EXTENSIONS,
  MAX_ILLUSTRATION_BYTES,
  MAX_SCENE_BYTES,
  sniffImageMime,
  svgIsInert,
  type IllustrationKind,
  type ImageMime,
} from "./illustrations";

// The server half of src/lib/illustrations.ts: the upload's validation and
// insert, and the lookups and response the serving routes share. Everything
// the upload accepts is checked here, at the boundary; the routes only
// gate on the admin session and translate results to HTTP.

export type StoreResult =
  | { ok: true; id: string; url: string }
  | { ok: false; status: number; error: string };

function fail(status: number, error: string): StoreResult {
  return { ok: false, status, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates and stores one upload: `kind`, the `file`, and for a diagram its
 * Excalidraw `scene`. Identical bytes of the same kind land on the same id,
 * so re-inserting an unchanged diagram is a no-op that keeps its URL.
 */
export async function storeIllustration(form: FormData): Promise<StoreResult> {
  const kind = form.get("kind");
  if (
    typeof kind !== "string" ||
    !(ILLUSTRATION_KINDS as readonly string[]).includes(kind)
  ) {
    return fail(400, "Unknown kind.");
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return fail(400, "No file was sent.");
  if (file.size === 0) return fail(400, "The file is empty.");
  if (file.size > MAX_ILLUSTRATION_BYTES) {
    return fail(413, "The file is over the 2 MB limit.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageMime(bytes);
  if (!mime) return fail(415, "That isn't a PNG, JPEG, WebP, GIF or SVG.");
  if (kind === "diagram" && mime !== "image/svg+xml") {
    return fail(415, "A diagram is an SVG export.");
  }
  if (
    mime === "image/svg+xml" &&
    !svgIsInert(new TextDecoder().decode(bytes))
  ) {
    return fail(
      415,
      "The SVG contains scripting, which an illustration can't.",
    );
  }

  let scene: unknown = null;
  if (kind === "diagram") {
    const raw = form.get("scene");
    if (typeof raw !== "string" || raw === "") {
      return fail(400, "A diagram needs its scene.");
    }
    if (raw.length > MAX_SCENE_BYTES) {
      return fail(413, "The diagram's scene is over the 2 MB limit.");
    }
    try {
      scene = JSON.parse(raw);
    } catch {
      return fail(400, "The scene isn't valid JSON.");
    }
    if (!isRecord(scene) || !Array.isArray(scene.elements)) {
      return fail(400, "The scene needs an elements array.");
    }
  }

  const id = createHash("sha256")
    .update(kind)
    .update("\0")
    .update(bytes)
    .digest("hex")
    .slice(0, 24);
  await db
    .insert(schema.illustrations)
    .values({
      id,
      kind,
      mime,
      data: Buffer.from(bytes),
      scene,
    })
    // Same bytes, same id: keep the row, but take the newer scene so an
    // unchanged export still carries the latest arrangement.
    .onConflictDoUpdate({ target: schema.illustrations.id, set: { scene } });
  return { ok: true, id, url: illustrationPath(kind as IllustrationKind, id) };
}

export type StoredIllustration = typeof schema.illustrations.$inferSelect;

/** The row behind a URL, or null when the id is malformed, unknown, or of the other kind. */
export async function loadIllustration(
  id: string,
  kind: IllustrationKind,
): Promise<StoredIllustration | null> {
  if (!ID_PATTERN.test(id)) return null;
  const row = await db.query.illustrations.findFirst({
    where: and(
      eq(schema.illustrations.id, id),
      eq(schema.illustrations.kind, kind),
    ),
  });
  return row ?? null;
}

/**
 * The bytes as an image response. Content-addressed, so cached forever;
 * sandboxed and nosniffed, so an SVG opened on its own can't run anything
 * on this origin.
 */
export function illustrationResponse(row: StoredIllustration): Response {
  const mime = row.mime as ImageMime;
  const svg = mime === "image/svg+xml";
  return new Response(new Uint8Array(row.data), {
    headers: {
      "content-type": svg ? `${mime}; charset=utf-8` : mime,
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": `inline; filename="${row.id}.${IMAGE_EXTENSIONS[mime]}"`,
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; sandbox",
    },
  });
}
