"use client";

import { uiFileKind, type UiWorkspace } from "./types";

// Builds the sandboxed document the UI workspace renders into its preview
// iframe. Script files are transpiled with sucrase (JSX + TypeScript) in the
// browser, then shipped into the iframe inside a JSON payload — never spliced
// into markup — so no source text can break out of a <script> tag. The iframe
// runs with sandbox="allow-scripts" only: an opaque origin with no access to
// this app's storage, cookies, or DOM.

export type PreviewBuild =
  | { ok: true; srcdoc: string }
  | { ok: false; file: string; message: string };

/** One captured console entry, posted from the iframe to the parent. */
export interface PreviewLog {
  level: "log" | "info" | "warn" | "error";
  text: string;
}

export const PREVIEW_MESSAGE_SOURCE = "callback-preview";

interface Payload {
  framework: UiWorkspace["framework"];
  css: string[];
  html: string;
  /** Module id → transpiled CommonJS source. */
  modules: Record<string, string>;
  /** Ids in file order — vanilla runs them all; react mounts the entry. */
  order: string[];
  entry: string | null;
}

// The React runtime is fetched once from our own origin and inlined into the
// document. The sandbox gives the iframe an opaque origin — a non-secure
// context whose requests to localhost Chrome's private-network-access checks
// block — so the preview must arrive with no subresources to fetch.
let runtimePromise: Promise<string> | null = null;

function fetchRuntime(): Promise<string> {
  runtimePromise ??= fetch("/api/preview-runtime").then(async (res) => {
    if (!res.ok) throw new Error(`runtime request failed (${res.status})`);
    return res.text();
  });
  // A failed fetch shouldn't poison every later build.
  return runtimePromise.catch((err) => {
    runtimePromise = null;
    throw err;
  });
}

export async function buildPreview(
  ui: UiWorkspace,
  contents: Record<string, string>,
): Promise<PreviewBuild> {
  const { transform } = await import("sucrase");

  const payload: Payload = {
    framework: ui.framework,
    css: [],
    html: "",
    modules: {},
    order: [],
    entry: null,
  };

  for (const file of ui.files) {
    const source = contents[file.name] ?? file.contents;
    const kind = uiFileKind(file.name);
    if (kind === "css") {
      payload.css.push(source);
      continue;
    }
    if (kind === "html") {
      payload.html = source;
      continue;
    }
    try {
      const { code } = transform(source, {
        transforms: ["jsx", "typescript", "imports"],
        jsxRuntime: "automatic",
        production: true,
        filePath: file.name,
      });
      payload.modules[file.name] = code;
      payload.order.push(file.name);
    } catch (err) {
      return {
        ok: false,
        file: file.name,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // React mounts the default export of App.* if present, else the first
  // component file.
  if (ui.framework === "react") {
    payload.entry =
      payload.order.find((name) => name.startsWith("App.")) ??
      payload.order[0] ??
      null;
    if (payload.entry === null) {
      return {
        ok: false,
        file: ui.files[0]?.name ?? "App.jsx",
        message: "A React workspace needs at least one component file.",
      };
    }
  }

  let runtime = "";
  if (ui.framework === "react") {
    try {
      runtime = await fetchRuntime();
    } catch {
      return {
        ok: false,
        file: payload.entry ?? "App.jsx",
        message: "The React runtime failed to load — is the server reachable?",
      };
    }
  }

  return { ok: true, srcdoc: documentFor(payload, runtime) };
}

/** Serialize for embedding inside a <script>: "<" can never close the tag. */
function embed(payload: Payload): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/**
 * Break any "</script" inside the bundle so it can sit in an inline tag. The
 * sequence can only occur in string/regex/comment position, where "<\/" and
 * "</" mean the same thing.
 */
function inlinable(js: string): string {
  return js.replace(/<\/script/gi, "<\\/script");
}

function documentFor(payload: Payload, runtimeJs: string): string {
  const runtime = runtimeJs === "" ? "" : `<script>${inlinable(runtimeJs)}</script>`;

  // The bootstrap below runs inside the sandbox. It reports console traffic
  // and uncaught errors to the parent via postMessage, then evaluates each
  // user module through new Function with a tiny CommonJS loader.
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0;
    padding: 12px;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    background: #ffffff;
    color: #18181b;
  }
</style>
</head>
<body>
<div id="root"></div>
${runtime}
<script>
"use strict";
(function () {
  var DATA = ${embed(payload)};

  function fmt(value) {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.name + ": " + value.message;
    try {
      var json = JSON.stringify(value);
      return json === undefined ? String(value) : json;
    } catch (_) {
      return String(value);
    }
  }

  function send(level, parts) {
    parent.postMessage(
      {
        source: ${JSON.stringify(PREVIEW_MESSAGE_SOURCE)},
        level: level,
        text: parts.map(fmt).join(" "),
      },
      "*"
    );
  }

  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level].bind(console);
    console[level] = function () {
      original.apply(null, arguments);
      send(level, Array.prototype.slice.call(arguments));
    };
  });
  window.addEventListener("error", function (event) {
    send("error", [event.message]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("error", ["Unhandled rejection: " + fmt(event.reason)]);
  });

  function fail(message) {
    send("error", [message]);
    var pre = document.createElement("pre");
    pre.style.cssText =
      "margin:0;padding:12px;white-space:pre-wrap;font:12px/1.5 ui-monospace,monospace;" +
      "color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;";
    pre.textContent = message;
    document.getElementById("root").replaceChildren(pre);
  }

  DATA.css.forEach(function (css) {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  });
  if (DATA.html) {
    document.getElementById("root").innerHTML = DATA.html;
  }

  // CommonJS-style loader over the transpiled files. Bare ids resolve to the
  // React runtime bundle; "./name" resolves to another file, with or without
  // its extension; CSS imports are inert (the styles are already injected).
  var cache = {};
  function resolve(id) {
    if (id.slice(0, 2) !== "./" && id.slice(0, 3) !== "../") return null;
    var name = id.replace(/^\\.\\//, "");
    if (DATA.modules[name] !== undefined) return name;
    var extensions = [".jsx", ".tsx", ".js", ".ts"];
    for (var i = 0; i < extensions.length; i++) {
      if (DATA.modules[name + extensions[i]] !== undefined) {
        return name + extensions[i];
      }
    }
    return null;
  }
  function load(id, from) {
    var runtime = window.__preview;
    if (runtime && runtime[id] !== undefined) return runtime[id];
    if (/\\.css$/.test(id)) return {};
    var name = resolve(id);
    if (name === null) {
      throw new Error('Cannot find module "' + id + '" (from ' + from + ")");
    }
    if (cache[name] === undefined) {
      var module = { exports: {} };
      cache[name] = module.exports;
      new Function("exports", "require", "module", DATA.modules[name])(
        module.exports,
        function (dep) {
          return load(dep, name);
        },
        module
      );
      cache[name] = module.exports;
    }
    return cache[name];
  }

  try {
    if (DATA.framework === "react") {
      var component = load("./" + DATA.entry, "preview").default;
      if (typeof component !== "function") {
        fail(DATA.entry + " must export default a React component.");
        return;
      }
      var runtime = window.__preview;
      if (!runtime) {
        fail("The React runtime failed to load. Is the dev server reachable?");
        return;
      }
      var react = runtime["react"];
      var client = runtime["react-dom/client"];
      client
        .createRoot(document.getElementById("root"))
        .render(react.createElement(component));
    } else {
      DATA.order.forEach(function (name) {
        load("./" + name, "preview");
      });
    }
  } catch (err) {
    fail(err instanceof Error ? (err.stack || err.message) : String(err));
  }
})();
</script>
</body>
</html>`;
}
