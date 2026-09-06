import { indentSelection } from "@codemirror/commands";
import { getIndentUnit, indentUnit } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import type { Plugin } from "prettier";
import type { Language } from "./types";

/**
 * What Format treats the document as. The web languages go through Prettier;
 * everything else falls back to CodeMirror's indenter, which only rewrites
 * leading whitespace and leaves the rest of each line alone.
 */
export type FormatKind =
  "javascript" | "typescript" | "css" | "html" | "indent";

type FormatOutcome =
  { ok: true; mode: "pretty" | "indent" } | { ok: false; message: string };

export function formatKindForLanguage(language: Language): FormatKind {
  return language === "javascript" || language === "typescript"
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

/**
 * Pretty-print or re-indent the whole document in a single transaction that
 * one undo reverses, keeping the cursor on the same character, then report
 * through `notify` (status text plus how long it should stay up). Prettier
 * and its parsers load on first use (about a megabyte for TypeScript), so
 * pages that never press Format never pay for them; a press while that load
 * is still in flight is ignored rather than raced.
 */
export function formatDocument(
  view: EditorView,
  kind: FormatKind,
  notify: (text: string, ms: number) => void,
): void {
  if (busy.has(view)) return;
  busy.add(view);
  void runFormat(view, kind)
    .then((outcome) => {
      if (!outcome.ok) return notify(outcome.message, 4000);
      notify(outcome.mode === "pretty" ? "Formatted" : "Re-indented", 1600);
    })
    .finally(() => busy.delete(view));
}

const busy = new WeakSet<EditorView>();

async function runFormat(
  view: EditorView,
  kind: FormatKind,
): Promise<FormatOutcome> {
  if (kind === "indent") {
    reindent(view);
    return { ok: true, mode: "indent" };
  }

  const { state } = view;
  const source = state.doc.toString();
  let formatted: string;
  let cursorOffset: number;
  try {
    const [{ formatWithCursor }, printer] = await Promise.all([
      import("prettier/standalone"),
      loadPrinter(kind),
    ]);
    ({ formatted, cursorOffset } = await formatWithCursor(source, {
      ...printer,
      cursorOffset: state.selection.main.head,
      tabWidth: getIndentUnit(state),
      useTabs: state.facet(indentUnit).startsWith("\t"),
    }));
  } catch (err) {
    return { ok: false, message: reportSyntaxError(view, err) };
  }

  // The awaits gave the user time to type (or switch languages, which
  // remounts the editor); never paste stale output over their edits.
  if (!view.dom.isConnected || !view.state.doc.eq(state.doc)) {
    return { ok: false, message: "Edited while formatting — try again" };
  }
  if (formatted !== source) {
    view.dispatch({
      changes: { from: 0, to: state.doc.length, insert: formatted },
      selection: {
        anchor: Math.min(Math.max(cursorOffset, 0), formatted.length),
      },
      scrollIntoView: true,
    });
  }
  view.focus();
  return { ok: true, mode: "pretty" };
}

type Printer = { parser: string; plugins: Plugin[] };

// Prettier's plugin modules are plugins themselves (they export `parsers`
// and `printers`), so the namespaces go straight into the options.
async function loadPrinter(
  kind: Exclude<FormatKind, "indent">,
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
 * "(line:column)". Park the cursor on the offending spot so the note has
 * something to point at, and keep the note to one line.
 */
function reportSyntaxError(view: EditorView, err: unknown): string {
  const error = err as {
    message?: unknown;
    loc?: { start?: { line?: unknown; column?: unknown } };
  };
  const start = error.loc?.start;
  const { doc } = view.state;
  if (
    typeof start?.line === "number" &&
    start.line >= 1 &&
    start.line <= doc.lines
  ) {
    const line = doc.line(start.line);
    const column =
      typeof start.column === "number" ? Math.max(start.column - 1, 0) : 0;
    view.dispatch({
      selection: { anchor: Math.min(line.from + column, line.to) },
      scrollIntoView: true,
    });
    view.focus();
  }
  const message =
    typeof error.message === "string" && error.message.trim()
      ? error.message.split("\n")[0].trim()
      : "syntax error";
  return `Can't format — ${message}`;
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
