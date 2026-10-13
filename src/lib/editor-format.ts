import { indentSelection } from "@codemirror/commands";
import { getIndentUnit, indentUnit } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import type { Plugin } from "prettier";
import type { Language } from "./types";

/**
 * What Format treats the document as. The web languages go through Prettier
 * and Python through Ruff's formatter; everything else falls back to
 * CodeMirror's indenter, which only rewrites leading whitespace and leaves
 * the rest of each line alone.
 */
export type FormatKind =
  "javascript" | "typescript" | "python" | "css" | "html" | "indent";

type FormatOutcome =
  | { ok: true; mode: "pretty" | "indent"; changed: boolean }
  | { ok: false; reason: string };

export function formatKindForLanguage(language: Language): FormatKind {
  return language === "javascript" ||
    language === "typescript" ||
    language === "python"
    ? language
    : "indent";
}

/** UI workspace files by extension; JSX rides the babel parser. */
export function formatKindForFile(name: string): FormatKind {
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".html")) return "html";
  if (/\.tsx?$/.test(name)) return "typescript";
  return "javascript";
}

type Notify = (text: string, ms: number) => void;

/**
 * Pretty-print or re-indent the whole document in a single transaction that
 * one undo reverses, keeping the cursor on the same character, then report
 * through `notify` (status text plus how long it should stay up). Prettier
 * and its parsers load on first use (about a megabyte for TypeScript), and
 * so does Ruff for Python, so pages that never press Format never pay for
 * them; a press while that load is still in flight is ignored rather than
 * raced.
 */
export function formatDocument(
  view: EditorView,
  kind: FormatKind,
  notify: Notify,
): void {
  void formatOnce(view, kind).then((outcome) => {
    if (!outcome) return;
    if (!outcome.ok) return notify(`Can't format — ${outcome.reason}`, 4000);
    notify(outcome.mode === "pretty" ? "Formatted" : "Re-indented", 1600);
  });
}

/**
 * Format on save: pretty-print, then hand whatever the document holds to
 * `persist`. A syntax error saves the code as written rather than blocking
 * the save, and the note says which of the two happened.
 */
export function saveFormatted(
  view: EditorView,
  kind: FormatKind,
  notify: Notify,
  persist: (code: string) => void,
): void {
  void formatOnce(view, kind).then((outcome) => {
    persist(view.state.doc.toString());
    if (outcome && !outcome.ok) {
      return notify(`Saved without formatting — ${outcome.reason}`, 4000);
    }
    if (!outcome?.changed) return notify("Saved", 1600);
    notify(
      outcome.mode === "pretty"
        ? "Formatted and saved"
        : "Re-indented and saved",
      1600,
    );
  });
}

const busy = new WeakSet<EditorView>();

/** One format per view at a time; a request during another resolves null. */
async function formatOnce(
  view: EditorView,
  kind: FormatKind,
): Promise<FormatOutcome | null> {
  if (busy.has(view)) return null;
  busy.add(view);
  try {
    return await runFormat(view, kind);
  } finally {
    busy.delete(view);
  }
}

async function runFormat(
  view: EditorView,
  kind: FormatKind,
): Promise<FormatOutcome> {
  if (kind === "indent") {
    const before = view.state.doc;
    reindent(view);
    return { ok: true, mode: "indent", changed: !view.state.doc.eq(before) };
  }

  const { state } = view;
  const source = state.doc.toString();
  let formatted: string;
  let cursorOffset: number;
  try {
    ({ formatted, cursorOffset } =
      kind === "python"
        ? await formatPython(state, source)
        : await formatWithPrettier(state, source, kind));
  } catch (err) {
    return { ok: false, reason: reportSyntaxError(view, err, source) };
  }

  // The awaits gave the user time to type (or switch languages, which
  // remounts the editor); never paste stale output over their edits.
  if (!view.dom.isConnected || !view.state.doc.eq(state.doc)) {
    return { ok: false, reason: "edited while formatting, try again" };
  }
  const changed = formatted !== source;
  if (changed) {
    view.dispatch({
      changes: { from: 0, to: state.doc.length, insert: formatted },
      selection: {
        anchor: Math.min(Math.max(cursorOffset, 0), formatted.length),
      },
      scrollIntoView: true,
    });
  }
  view.focus();
  return { ok: true, mode: "pretty", changed };
}

type Formatted = { formatted: string; cursorOffset: number };
type EditorState = EditorView["state"];

async function formatWithPrettier(
  state: EditorState,
  source: string,
  kind: Exclude<FormatKind, "indent" | "python">,
): Promise<Formatted> {
  const [{ formatWithCursor }, printer] = await Promise.all([
    import("prettier/standalone"),
    loadPrinter(kind),
  ]);
  return formatWithCursor(source, {
    ...printer,
    cursorOffset: state.selection.main.head,
    tabWidth: getIndentUnit(state),
    useTabs: state.facet(indentUnit).startsWith("\t"),
  });
}

/**
 * Ruff's formatter (Black-compatible) compiled to WebAssembly. The small
 * JavaScript glue is bundled; the wasm itself comes from the CDN the Python
 * runner already loads Pyodide from, pinned to the installed package version
 * and fetched once per page. Ruff reports the cursor nowhere, so the caret
 * stays on its line at the same distance into the code.
 */
const RUFF_VERSION = "0.17.0"; // the exact version in package.json
const RUFF_WASM_URL = `https://cdn.jsdelivr.net/npm/@astral-sh/ruff-wasm-web@${RUFF_VERSION}/ruff_wasm_bg.wasm`;

let ruff: Promise<typeof import("@astral-sh/ruff-wasm-web")> | null = null;

function loadRuff(): Promise<typeof import("@astral-sh/ruff-wasm-web")> {
  if (!ruff) {
    ruff = import("@astral-sh/ruff-wasm-web").then(async (mod) => {
      await mod.default({ module_or_path: RUFF_WASM_URL });
      return mod;
    });
    // A failed download (offline, CDN down) must not poison later presses.
    ruff.catch(() => {
      ruff = null;
    });
  }
  return ruff;
}

async function formatPython(
  state: EditorState,
  source: string,
): Promise<Formatted> {
  const { Workspace, PositionEncoding } = await loadRuff();
  const workspace = new Workspace(
    {
      "line-length": 88,
      "indent-width": getIndentUnit(state),
      format: {
        "indent-style": state.facet(indentUnit).startsWith("\t")
          ? "tab"
          : "space",
        "quote-style": "double",
      },
    },
    PositionEncoding.Utf16,
  );
  try {
    const formatted = workspace.format(source);
    return { formatted, cursorOffset: cursorAfterFormat(state, formatted) };
  } finally {
    workspace.free();
  }
}

/** The same line, the same distance past the indentation, clamped. */
function cursorAfterFormat(state: EditorState, formatted: string): number {
  const { head } = state.selection.main;
  const before = state.doc.lineAt(head);
  const column = Math.max(0, head - before.from - indentWidth(before.text));
  const lines = formatted.split("\n");
  const number = Math.min(before.number, lines.length);
  let from = 0;
  for (let i = 1; i < number; i++) from += lines[i - 1].length + 1;
  const text = lines[number - 1];
  return Math.min(from + indentWidth(text) + column, from + text.length);
}

type Printer = { parser: string; plugins: Plugin[] };

// Prettier's plugin modules are plugins themselves (they export `parsers`
// and `printers`), so the namespaces go straight into the options.
async function loadPrinter(
  kind: Exclude<FormatKind, "indent" | "python">,
): Promise<Printer> {
  switch (kind) {
    case "javascript":
      return {
        parser: "babel",
        plugins: await Promise.all([
          import("prettier/plugins/estree"),
          import("prettier/plugins/babel"),
        ]),
      };
    case "typescript":
      return {
        parser: "typescript",
        plugins: await Promise.all([
          import("prettier/plugins/estree"),
          import("prettier/plugins/typescript"),
        ]),
      };
    case "css":
      return {
        parser: "css",
        plugins: [await import("prettier/plugins/postcss")],
      };
    case "html":
      // Inline <script> and <style> blocks are printed by their own parsers.
      return {
        parser: "html",
        plugins: await Promise.all([
          import("prettier/plugins/html"),
          import("prettier/plugins/estree"),
          import("prettier/plugins/babel"),
          import("prettier/plugins/postcss"),
        ]),
      };
  }
}

/**
 * Prettier's parse errors carry a `loc` and a message that already ends in
 * "(line:column)"; Ruff's end in "at byte range a..b" instead. Park the
 * cursor on the offending spot so the note has something to point at, and
 * return a one-line reason that names the line and column either way.
 */
function reportSyntaxError(
  view: EditorView,
  err: unknown,
  source: string,
): string {
  const error = err as {
    message?: unknown;
    loc?: { start?: { line?: unknown; column?: unknown } };
  };
  let message =
    typeof error.message === "string" && error.message.trim()
      ? error.message.split("\n")[0].trim()
      : "syntax error";
  const { doc } = view.state;
  let offset: number | null = null;
  const start = error.loc?.start;
  const byteRange = /\s+at byte range (\d+)\.\.\d+$/.exec(message);
  if (
    typeof start?.line === "number" &&
    start.line >= 1 &&
    start.line <= doc.lines
  ) {
    const line = doc.line(start.line);
    const column =
      typeof start.column === "number" ? Math.max(start.column - 1, 0) : 0;
    offset = Math.min(line.from + column, line.to);
  } else if (byteRange) {
    offset = Math.min(charOffsetForByte(source, Number(byteRange[1])), doc.length);
    const line = doc.lineAt(offset);
    message = `${message.slice(0, byteRange.index)} (${line.number}:${offset - line.from + 1})`;
  }
  if (offset !== null) {
    view.dispatch({ selection: { anchor: offset }, scrollIntoView: true });
    view.focus();
  }
  return message;
}

/** Ruff counts UTF-8 bytes; the document counts UTF-16 code units. */
function charOffsetForByte(source: string, byte: number): number {
  let bytes = 0;
  for (let i = 0; i < source.length; i++) {
    if (bytes >= byte) return i;
    const code = source.codePointAt(i) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (code >= 0x10000) i++;
  }
  return source.length;
}

function indentWidth(text: string): number {
  return /^[ \t]*/.exec(text)?.[0].length ?? 0;
}

/** CodeMirror's indenter over the whole document. */
function reindent(view: EditorView): void {
  const { doc, selection } = view.state;
  const before = doc.lineAt(selection.main.head);
  const line = before.number;
  const column = Math.max(
    0,
    selection.main.head - before.from - indentWidth(before.text),
  );
  view.dispatch({ selection: { anchor: 0, head: doc.length } });
  indentSelection({ state: view.state, dispatch: (tr) => view.dispatch(tr) });
  const after = view.state.doc.line(line);
  view.dispatch({
    selection: {
      anchor: Math.min(after.from + indentWidth(after.text) + column, after.to),
    },
    scrollIntoView: true,
  });
  view.focus();
}
