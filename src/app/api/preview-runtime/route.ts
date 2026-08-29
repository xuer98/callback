import { build } from "esbuild";

// The script the UI-workspace preview iframe loads to get React. Bundled from
// this app's own installed react/react-dom (so the version practiced against
// is the version the app ships) instead of a CDN — previews keep working
// offline and nothing third-party runs in users' browsers. The iframe is
// sandboxed without allow-same-origin, and classic scripts load fine from an
// opaque origin, so no CORS headers are needed.
//
// force-static renders this once at build; the module-level cache covers dev,
// where the route executes per request.

export const dynamic = "force-static";

const ENTRY = `
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as JsxRuntime from "react/jsx-runtime";

declare global {
  interface Window {
    __preview: Record<string, unknown>;
  }
}

window.__preview = {
  react: React,
  "react-dom": ReactDOM,
  "react-dom/client": ReactDOMClient,
  "react/jsx-runtime": JsxRuntime,
};
`;

let cached: string | null = null;

export async function GET() {
  if (cached === null) {
    const result = await build({
      stdin: {
        contents: ENTRY,
        resolveDir: process.cwd(),
        loader: "ts",
      },
      bundle: true,
      minify: true,
      format: "iife",
      platform: "browser",
      write: false,
      define: { "process.env.NODE_ENV": '"production"' },
    });
    cached = result.outputFiles[0].text;
  }
  return new Response(cached, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
