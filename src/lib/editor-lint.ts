// Inline diagnostics for the workspace editors: syntax errors underlined
// where they happen, plus the warnings a linter can see, each with a gutter
// marker and a hover message. The checkers are the parsers the editors
// already ship for Format — Prettier's Babel parser for JavaScript and
// TypeScript, Ruff for Python — and CodeMirror's own grammars for the rest.
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import {
  linter,
  lintGutter,
  type Diagnostic,
  type LintSource,
} from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import { loadRuff } from "./editor-format";
import type { Language } from "./types";

type EditorState = EditorView["state"];
type Text = EditorState["doc"];

/** What checks the document. */
export type LintKind = "javascript" | "typescript" | "python" | "syntax";

export function lintKindForLanguage(language: Language): LintKind {
  return language === "javascript" ||
    language === "typescript" ||
    language === "python"
    ? language
    : "syntax";
}

/** UI workspace files by extension; markup and styles get the grammar check. */
export function lintKindForFile(name: string): LintKind {
  if (name.endsWith(".css") || name.endsWith(".html")) return "syntax";
  return /\.tsx?$/.test(name) ? "typescript" : "javascript";
}

export interface LintContext {
  /** The file's name, so JSX is expected in .jsx and .tsx files. */
  filename?: string;
  /**
   * Code the judge runs alongside the document. Python's checker treats its
   * top-level names (a TreeNode class, say) as defined rather than missing.
   */
  harness?: string;
}

const LINT_DELAY_MS = 500;
/** Transaction user event that asks for a fresh pass once a checker loads. */
const CHECKER_READY = "lint.checker";

/** The lint extension for one editor: underlines, gutter markers, tooltips. */
export function editorLint(kind: LintKind, context: LintContext = {}) {
  return [
    linter(sourceFor(kind, context), {
      delay: LINT_DELAY_MS,
      needsRefresh: (update) =>
        update.transactions.some((tr) => tr.isUserEvent(CHECKER_READY)),
    }),
    lintGutter(),
  ];
}

function sourceFor(kind: LintKind, context: LintContext): LintSource {
  switch (kind) {
    case "javascript":
    case "typescript": {
      const parser = kind === "typescript" ? "babel-ts" : "babel";
      const filepath =
        context.filename ?? `solution.${kind === "typescript" ? "ts" : "js"}`;
      return deferred(babel, (plugin, state) =>
        babelDiagnostics(plugin, state, parser, filepath),
      );
    }
    case "python": {
      const builtins = harnessNames(context.harness ?? "");
      return deferred(
        ruff,
        (module, state) => ruffDiagnostics(module, state, builtins),
        syntaxDiagnostics,
      );
    }
    case "syntax":
      return (view) => syntaxDiagnostics(view.state);
  }
}

// ---------------------------------------------------------------------------
// Checkers that download on demand
// ---------------------------------------------------------------------------

/** A checker fetched on first use; a failed download stays failed. */
class Lazy<T> {
  current: T | null = null;
  failed = false;
  private promise: Promise<T> | null = null;

  constructor(private readonly load: () => Promise<T>) {}

  start(): Promise<T> {
    this.promise ??= this.load().then(
      (loaded) => {
        this.current = loaded;
        return loaded;
      },
      (err: unknown) => {
        this.failed = true;
        throw err;
      },
    );
    return this.promise;
  }
}

type BabelPlugin = typeof import("prettier/plugins/babel");
type RuffModule = Awaited<ReturnType<typeof loadRuff>>;

const babel = new Lazy<BabelPlugin>(() => import("prettier/plugins/babel"));
const ruff = new Lazy<RuffModule>(loadRuff);

/**
 * A source whose checker loads on demand. Nothing downloads until the
 * document has been edited (starters are valid, and Ruff alone is 11 MB);
 * `meanwhile` answers until then, and the editor re-lints as soon as the
 * checker lands.
 */
function deferred<T>(
  checker: Lazy<T>,
  run: (loaded: T, state: EditorState) => Diagnostic[] | Promise<Diagnostic[]>,
  meanwhile: (state: EditorState) => Diagnostic[] = () => [],
): LintSource {
  const opened = new WeakMap<EditorView, Text>();
  const waiting = new WeakSet<EditorView>();
  return (view) => {
    if (checker.current) return run(checker.current, view.state);
    const { state } = view;
    if (!opened.has(view)) {
      opened.set(view, state.doc);
    } else if (
      !checker.failed &&
      !waiting.has(view) &&
      opened.get(view) !== state.doc
    ) {
      waiting.add(view);
      checker.start().then(
        () => {
          if (view.dom.isConnected) view.dispatch({ userEvent: CHECKER_READY });
        },
        () => {},
      );
    }
    return meanwhile(state);
  };
}

// ---------------------------------------------------------------------------
// JavaScript and TypeScript: Prettier's Babel parser
// ---------------------------------------------------------------------------

type ParseOptions = Parameters<BabelPlugin["parsers"]["babel"]["parse"]>[1];

/** Babel stops at the first syntax error, so this is zero or one diagnostic. */
export async function babelDiagnostics(
  plugin: BabelPlugin,
  state: EditorState,
  parser: "babel" | "babel-ts",
  filepath: string,
): Promise<Diagnostic[]> {
  try {
    await plugin.parsers[parser].parse(state.doc.toString(), {
      filepath,
    } as ParseOptions);
    return [];
  } catch (err) {
    const error = err as {
      message?: unknown;
      loc?: { start?: { line?: unknown; column?: unknown } };
    };
    const start = error.loc?.start;
    // Anything without a location is the parser failing, not the code.
    if (typeof start?.line !== "number") return [];
    const { doc } = state;
    const line = doc.line(clamp(start.line, 1, doc.lines));
    const column = typeof start.column === "number" ? start.column - 1 : 0;
    const from = Math.min(line.from + Math.max(column, 0), line.to);
    const message =
      typeof error.message === "string"
        ? error.message.replace(/\s*\(\d+:\d+\)$/, "")
        : "Syntax error";
    return [
      {
        from,
        to: tokenEnd(doc, from),
        severity: "error",
        source: "SyntaxError",
        message,
      },
    ];
  }
}

// ---------------------------------------------------------------------------
// Python: Ruff
// ---------------------------------------------------------------------------

interface RuffPosition {
  row: number;
  column: number;
}

interface RuffMessage {
  /** A rule code, or (older builds: null) "invalid-syntax" for parse errors. */
  code: string | null;
  message: string;
  start_location: RuffPosition;
  end_location: RuffPosition;
}

// Pyflakes' real mistakes, the comparison and escape pitfalls from
// pycodestyle, mutable defaults, dangling expressions, and Pylint's error
// class. Style rules stay out: this is an interview editor, not CI.
const RUFF_RULES = [
  "F",
  "E703",
  "E711",
  "E712",
  "E713",
  "E714",
  "E721",
  "E722",
  "W605",
  "B006",
  "B018",
  "PLE",
];
const RUFF_TARGET = "py312"; // what Pyodide runs
/** Codes for what would raise at run time; everything else is a warning. */
const RUFF_ERROR = /^(?:invalid-syntax$|F7|F82|PLE)/;

export function ruffDiagnostics(
  module: RuffModule,
  state: EditorState,
  builtins: string[],
): Diagnostic[] {
  const workspace = new module.Workspace(
    { "target-version": RUFF_TARGET, builtins, lint: { select: RUFF_RULES } },
    module.PositionEncoding.Utf16,
  );
  try {
    const messages = workspace.check(state.doc.toString()) as RuffMessage[];
    return messages.map((found): Diagnostic => {
      const code = found.code ?? "invalid-syntax";
      const from = offsetAt(state.doc, found.start_location);
      return {
        from,
        to: Math.max(from, offsetAt(state.doc, found.end_location)),
        severity: RUFF_ERROR.test(code) ? "error" : "warning",
        source: code === "invalid-syntax" ? "SyntaxError" : code,
        message: found.message,
      };
    });
  } finally {
    workspace.free();
  }
}

/** Ruff's one-based row and UTF-16 column, clamped to the document. */
function offsetAt(doc: Text, { row, column }: RuffPosition): number {
  const line = doc.line(clamp(row, 1, doc.lines));
  return Math.min(line.from + Math.max(column - 1, 0), line.to);
}

const TOP_LEVEL =
  /^(?:(?:async\s+)?def\s+(\w+)|class\s+(\w+)|import\s+([\w.]+)(?:\s+as\s+(\w+))?|from\s+[\w.]+\s+import\s+([^#\n]+)|(\w+)\s*(?::[^=\n]*)?=(?!=))/gm;

/** Top-level names a Python harness defines: functions, classes, imports, assignments. */
export function harnessNames(code: string): string[] {
  const names = new Set<string>();
  for (const match of code.matchAll(TOP_LEVEL)) {
    const [, def, cls, module, alias, imports, assigned] = match;
    const single = def ?? cls ?? alias ?? module?.split(".")[0] ?? assigned;
    if (single) names.add(single);
    for (const item of imports?.split(",") ?? []) {
      const name = item
        .replace(/[()\s]+/g, " ")
        .trim()
        .split(" as ")
        .pop();
      if (name) names.add(name);
    }
  }
  return [...names];
}

// ---------------------------------------------------------------------------
// Everything else: the grammar's own error nodes
// ---------------------------------------------------------------------------

/**
 * Error nodes from the editor's own grammar. Grammars mounted inside it (the
 * JavaScript in an HTML file's <script>) are skipped: CodeMirror's JavaScript
 * grammar rejects some valid code, which is why JavaScript gets Babel.
 */
export function syntaxDiagnostics(state: EditorState): Diagnostic[] {
  const { doc } = state;
  const tree = ensureSyntaxTree(state, doc.length) ?? syntaxTree(state);
  const found: Diagnostic[] = [];
  let last = -1;
  tree.iterate({
    enter(node) {
      if (node.type.isTop && node.tree !== tree) return false;
      if (!node.type.isError) return;
      // Recovery can stack several error nodes on one spot; keep the first.
      if (node.from !== last) {
        last = node.from;
        found.push({
          from: node.from,
          to: node.to,
          severity: "error",
          source: "SyntaxError",
          message: unexpected(doc, node.from, node.to),
        });
      }
      return false;
    },
  });
  return found;
}

const TOKEN = /^(?:[\p{L}_$][\p{L}\p{N}_$]*|\d[\w.]*|\S)/u;
const LOOKAHEAD = 40;

/** Names the token at the error, or the end of the input when none follows. */
function unexpected(doc: Text, from: number, to: number): string {
  const ahead = doc.sliceString(
    from,
    to > from ? to : Math.min(doc.length, from + LOOKAHEAD),
  );
  const token = TOKEN.exec(ahead.trimStart())?.[0];
  return token
    ? `Unexpected "${token.slice(0, 20)}"`
    : "Unexpected end of input";
}

/** End of the token starting at `from`, so the underline covers it. */
function tokenEnd(doc: Text, from: number): number {
  const line = doc.lineAt(from);
  return (
    from + (TOKEN.exec(line.text.slice(from - line.from))?.[0].length ?? 0)
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
