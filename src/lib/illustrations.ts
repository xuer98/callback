// Diagrams and illustrations in problem content. Both are ordinary markdown
// images — `![caption](url)` — so the renderer, the seed files and the
// admin console all speak the same syntax; what differs is where the file
// lives and how it is themed:
//
//  - A diagram is line art drawn in the admin console's Excalidraw dialog:
//    exported as SVG with dark strokes on a transparent background, stored
//    with its scene so it can be reopened, and served from
//    /api/diagrams/<id>. Dark mode inverts it (globals.css), the way the
//    Excalidraw canvas inverts its own. A hand-written SVG under
//    public/diagrams/ gets the same treatment.
//  - An illustration is an uploaded picture (PNG, JPEG, WebP, GIF or SVG),
//    shown as-is from /api/illustrations/<id>.
//
// An id is a prefix of the SHA-256 of the kind and the bytes, so a URL never
// changes meaning and the routes can cache forever. This module is the
// shared, side-effect-free part: limits, the URL conventions, and the
// byte-level checks the upload runs at the boundary.

export const ILLUSTRATION_KINDS = ["diagram", "illustration"] as const;
export type IllustrationKind = (typeof ILLUSTRATION_KINDS)[number];

/** Uploads over this are refused — a diagram with a few pasted images fits. */
export const MAX_ILLUSTRATION_BYTES = 2 * 1024 * 1024;
export const MAX_SCENE_BYTES = 2 * 1024 * 1024;
export const ID_PATTERN = /^[a-f0-9]{24}$/;

export const IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;
export type ImageMime = (typeof IMAGE_MIMES)[number];

export const IMAGE_EXTENSIONS: Record<ImageMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export function illustrationPath(kind: IllustrationKind, id: string): string {
  return `/api/${kind}s/${id}`;
}

/** Image sources the renderer treats as line art to invert in dark mode. */
const DIAGRAM_SRC = /^\/(?:api\/)?diagrams\//;

export function isDiagramSrc(src: string): boolean {
  return DIAGRAM_SRC.test(src);
}

export interface DiagramReference {
  /** The whole `![caption](/api/diagrams/<id>)` as written. */
  ref: string;
  id: string;
  alt: string;
}

/** The drawn diagrams a markdown field refers to, for the editor's chips. */
export function diagramReferences(text: string): DiagramReference[] {
  const out: DiagramReference[] = [];
  const pattern = /!\[([^\]]*)\]\(\/api\/diagrams\/([a-f0-9]{24})\)/g;
  for (const match of text.matchAll(pattern)) {
    if (out.some((seen) => seen.ref === match[0])) continue;
    out.push({ ref: match[0], id: match[2], alt: match[1] });
  }
  return out;
}

function startsWith(bytes: Uint8Array, signature: number[], at = 0): boolean {
  return signature.every((byte, i) => bytes[at + i] === byte);
}

/**
 * What the bytes actually are, from their signature, so a renamed file or a
 * lying Content-Type can't put anything but an image behind an image URL.
 * Null for anything but the accepted types.
 */
export function sniffImageMime(bytes: Uint8Array): ImageMime | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  return looksLikeSvg(bytes) ? "image/svg+xml" : null;
}

/** An SVG document: the root element is <svg>, after any prolog. */
function looksLikeSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, 4096))
    .replace(/^﻿/, "")
    .replace(/^\s*<\?xml[^>]*\?>/i, "")
    .replace(/^(?:\s*<!--[\s\S]*?-->|\s*<!DOCTYPE[^>]*>)*/i, "")
    .trimStart();
  return /^<svg[\s>]/i.test(head);
}

/**
 * An SVG that only draws: no scripts, no event handlers, no embedded HTML,
 * no script URLs. Served SVGs are sandboxed as well, but a file that fails
 * this is not an illustration and is refused outright.
 */
export function svgIsInert(text: string): boolean {
  return !/<\s*(?:script|foreignObject)\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["']?\s*javascript:/i.test(
    text,
  );
}
