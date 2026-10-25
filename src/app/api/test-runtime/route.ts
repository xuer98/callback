import { join } from "node:path";
import { build } from "esbuild";

// The script the UI workspace's test iframe loads: the harness in
// src/lib/ui-test-kit.ts bundled with React, Testing Library, user-event,
// jest-dom, Vitest's expect and spies, and fake timers. Built from this
// app's own installed packages, like /api/preview-runtime, so nothing
// third-party is fetched from a CDN. React is the development build here,
// unlike the preview's: act(), which Testing Library wraps every render and
// event in, exists only in development builds.
//
// force-static renders this once at build. In dev, where the route executes
// per request, it is rebuilt and never cached, so edits to the harness show
// up on the next page load (the page fetches it once per load).

export const dynamic = "force-static";

const DEV = process.env.NODE_ENV === "development";

let cached: string | null = null;

export async function GET() {
  if (cached === null || DEV) {
    const result = await build({
      entryPoints: [join(process.cwd(), "src/lib/ui-test-kit.ts")],
      bundle: true,
      minify: true,
      format: "iife",
      platform: "browser",
      target: "es2022",
      write: false,
      legalComments: "none",
      define: { "process.env.NODE_ENV": '"development"' },
      // Fake timers require Node's util only when `process` exists, which
      // it never does in the iframe.
      external: ["util"],
    });
    cached = result.outputFiles[0].text;
  }
  return new Response(cached, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": DEV ? "no-store" : "public, max-age=3600",
    },
  });
}
