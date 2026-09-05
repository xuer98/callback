"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { acceptCompletion } from "@codemirror/autocomplete";
import { jsCompletions } from "@/lib/editor-completions";
import { formatDocument } from "@/lib/editor-format";
import { shortcutHint, useEditorShortcuts } from "@/lib/editor-shortcuts";
import { RichText } from "./markdown";
import { PaneTab, SplitPane } from "./resizable";
import { useProgress } from "./progress";
import {
  buildPreview,
  PREVIEW_MESSAGE_SOURCE,
  type PreviewLog,
} from "@/lib/preview";
import {
  readStored,
  removeStored,
  storageKeyFor,
  useSolutionSync,
  writeSavedAt,
  writeStored,
} from "@/lib/workspace-sync";
import {
  UI_FRAMEWORK_LABELS,
  uiFileKind,
  uiSlot,
  uiTemplates,
  type UiFramework,
  type UiTemplate,
  type UiWorkspace as UiWorkspaceSpec,
} from "@/lib/types";

// The frontend-question workspace: one editor tab per starter file and a live
// preview beside a captured console. Edits rebuild the preview on a debounce;
// the sandboxed iframe reloads from scratch each time, so component state in
// the user's app resets on every run — same trade GreatFrontend makes.
//
// A problem may ship the same exercise as a React template and an HTML/CSS/JS
// one; the framework select swaps the file set, and each template keeps its
// own drafts.

const REBUILD_DEBOUNCE_MS = 800;
const MAX_LOGS = 300;

// Tab accepts an open completion first, then falls through to indenting.
const EDITOR_KEYMAP = keymap.of([
  { key: "Tab", run: acceptCompletion },
  indentWithTab,
]);

// Two spaces across the board — the starters are all web-styled.
const INDENT_UNIT = indentUnit.of("  ");

function extensionsFor(name: string) {
  const kind = uiFileKind(name);
  if (kind === "css") return [css(), EDITOR_KEYMAP, INDENT_UNIT];
  if (kind === "html") return [html(), EDITOR_KEYMAP, INDENT_UNIT];
  return [
    javascript({ jsx: true, typescript: /\.tsx?$/.test(name) }),
    ...jsCompletions,
    EDITOR_KEYMAP,
    INDENT_UNIT,
  ];
}

const subscribeNoop = () => () => {};

export function UiWorkspace({
  slug,
  ui,
}: {
  slug: string;
  ui: UiWorkspaceSpec;
}) {
  // Render nothing until mounted: initial state reads localStorage, so the
  // server skeleton and the client's first (hydration) render must agree.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const templates = uiTemplates(ui);
  const frameworkKey = `callback:ui-framework:${slug}`;
  const [framework, setFramework] = useState<UiFramework>(() => {
    const stored = readStored(frameworkKey) as UiFramework | null;
    return stored && templates.some((t) => t.framework === stored)
      ? stored
      : ui.framework;
  });
  const template =
    templates.find((t) => t.framework === framework) ?? templates[0];
  // Async continuations (preview rebuilds, account pulls) read the template
  // the editor is actually showing.
  const templateRef = useRef(template);
  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  const slotFor = useCallback(
    (name: string, fw: UiFramework = framework) => uiSlot(ui, fw, name),
    [ui, framework],
  );
  /** The template's files, with any saved draft taking precedence. */
  const loadFiles = useCallback(
    (t: UiTemplate) =>
      Object.fromEntries(
        t.files.map((file) => [
          file.name,
          readStored(storageKeyFor(slug, uiSlot(ui, t.framework, file.name))) ??
            file.contents,
        ]),
      ),
    [slug, ui],
  );

  const [files, setFiles] = useState<Record<string, string>>(() =>
    loadFiles(template),
  );
  const [active, setActive] = useState(template.files[0]?.name ?? "");
  // Remount the editor whenever contents are set from outside (file switch,
  // framework switch, reset, account pull) — same workaround as the judged
  // workspace.
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [previewEpoch, setPreviewEpoch] = useState(0);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [logs, setLogs] = useState<PreviewLog[]>([]);
  const [bottomTab, setBottomTab] = useState<"preview" | "console">("preview");
  const [note, setNote] = useState<string | null>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { signedIn } = useProgress();

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // -- preview ---------------------------------------------------------------

  const rebuild = useCallback(async () => {
    const result = await buildPreview(templateRef.current, filesRef.current);
    setLogs([]);
    if (result.ok) {
      setBuildError(null);
      setSrcdoc(result.srcdoc);
      setPreviewEpoch((epoch) => epoch + 1);
    } else {
      // Keep the last good preview on screen under the error strip.
      setBuildError(`${result.file}: ${result.message}`);
    }
  }, []);

  const rebuildTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRebuild = useCallback(() => {
    if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    rebuildTimer.current = setTimeout(() => void rebuild(), REBUILD_DEBOUNCE_MS);
  }, [rebuild]);
  useEffect(() => {
    return () => {
      if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    };
  }, []);

  // First render of the preview, once the client is up. Deferred a tick so
  // the effect body itself schedules no state updates.
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => void rebuild(), 0);
    return () => clearTimeout(timer);
  }, [mounted, rebuild]);

  // Console traffic arrives from the iframe via postMessage. The sandbox
  // makes its origin opaque ("null"), so filter on the payload shape.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: unknown; level?: unknown; text?: unknown }
        | null;
      if (data?.source !== PREVIEW_MESSAGE_SOURCE) return;
      if (typeof data.level !== "string" || typeof data.text !== "string")
        return;
      const entry = { level: data.level, text: data.text } as PreviewLog;
      setLogs((prev) => [...prev.slice(-(MAX_LOGS - 1)), entry]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // -- editing & persistence -------------------------------------------------

  const { queueSave, flushSave, dropSolution } = useSolutionSync({
    slug,
    slots: templates.flatMap((t) =>
      t.files.map((file) => uiSlot(ui, t.framework, file.name)),
    ),
    enabled: signedIn,
    onPulled: (slots) => {
      // Drafts for the other template landed in storage and will load on
      // switch; only the visible template needs re-reading now.
      const current = templateRef.current;
      const visible = new Set(
        current.files.map((file) => uiSlot(ui, current.framework, file.name)),
      );
      if (!slots.some((slot) => visible.has(slot))) return;
      setFiles(loadFiles(current));
      setEditorEpoch((epoch) => epoch + 1);
      scheduleRebuild();
    },
  });

  const onChange = useCallback(
    (value: string) => {
      setFiles((prev) => ({ ...prev, [active]: value }));
      const key = storageKeyFor(slug, slotFor(active));
      writeStored(key, value);
      writeSavedAt(key, Date.now());
      if (signedIn) queueSave(slotFor(active), value);
      scheduleRebuild();
    },
    [slug, active, signedIn, queueSave, scheduleRebuild, slotFor],
  );

  const switchFile = (name: string) => {
    if (name === active) return;
    setActive(name);
    setEditorEpoch((epoch) => epoch + 1);
  };

  const switchFramework = (fw: UiFramework) => {
    const next = templates.find((t) => t.framework === fw);
    if (!next || fw === framework) return;
    setFramework(fw);
    writeStored(frameworkKey, fw);
    templateRef.current = next;
    setFiles(loadFiles(next));
    setActive(next.files[0]?.name ?? "");
    setEditorEpoch((epoch) => epoch + 1);
    setLogs([]);
    if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    // State updates land next render; rebuild reads the refs, so defer.
    setTimeout(() => void rebuild(), 0);
  };

  const reset = () => {
    setFiles(Object.fromEntries(template.files.map((f) => [f.name, f.contents])));
    setEditorEpoch((epoch) => epoch + 1);
    for (const file of template.files) {
      const key = storageKeyFor(slug, slotFor(file.name));
      removeStored(key);
      removeStored(`${key}:savedAt`);
      if (signedIn) dropSolution(slotFor(file.name));
    }
    if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    setTimeout(() => void rebuild(), 0);
  };

  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (text: string) => {
    setNote(text);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 1600);
  };
  useEffect(() => () => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
  }, []);

  const save = () => {
    const key = storageKeyFor(slug, slotFor(active));
    writeStored(key, files[active] ?? "");
    writeSavedAt(key, Date.now());
    if (signedIn) flushSave(slotFor(active), files[active] ?? "");
    flash("Saved");
  };

  const format = () => {
    const view = editorRef.current?.view;
    if (!view) return;
    formatDocument(view);
    flash("Formatted");
  };

  const run = () => {
    if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    void rebuild();
  };

  useEditorShortcuts({ save, format, run, submit: run });

  if (!mounted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-[420px] flex-1 rounded-lg border border-zinc-800 bg-zinc-900/40" />
        <div className="h-[280px] shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/40" />
      </div>
    );
  }

  const errorCount = logs.filter((entry) => entry.level === "error").length;

  return (
    <SplitPane
      direction="vertical"
      storageKey="callback:split:ui"
      initial={0.55}
      min={0.2}
      max={0.85}
      className="min-h-0 flex-1"
      first={
        <section className="flex min-h-[380px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
              {template.files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => switchFile(file.name)}
                  className={`-mb-px shrink-0 border-b-2 px-2.5 py-2 font-mono text-xs transition-colors ${
                    active === file.name
                      ? "border-zinc-300 text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {file.name}
                </button>
              ))}
              <span
                aria-live="polite"
                className={`pl-1 text-xs text-emerald-400 transition-opacity ${
                  note ? "opacity-100" : "opacity-0"
                }`}
              >
                {note ?? ""}
              </span>
            </div>
            <div className="flex items-center gap-2 py-1">
              {templates.length > 1 && (
                <label className="relative">
                  <span className="sr-only">Framework</span>
                  <select
                    value={framework}
                    onChange={(e) =>
                      switchFramework(e.target.value as UiFramework)
                    }
                    className="cursor-pointer appearance-none rounded-md bg-zinc-900 py-1 pl-2.5 pr-7 font-mono text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors hover:text-white focus:outline-none focus:ring-indigo-500"
                  >
                    {templates.map((t) => (
                      <option key={t.framework} value={t.framework}>
                        {UI_FRAMEWORK_LABELS[t.framework]}
                      </option>
                    ))}
                  </select>
                  <svg
                    aria-hidden
                    viewBox="0 0 12 12"
                    className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500"
                  >
                    <path
                      d="M3 4.5 6 8l3-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </label>
              )}
              <button
                onClick={reset}
                className="rounded-md border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
              >
                Reset
              </button>
              <button
                onClick={run}
                title={`Rebuild the preview (${shortcutHint("run")} or ${shortcutHint("submit")})`}
                className="rounded-md bg-indigo-500 px-4 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-400"
              >
                Run
              </button>
            </div>
          </header>
          <div className="relative min-h-0 flex-1 overflow-hidden text-[13px]">
            <CodeMirror
              ref={editorRef}
              key={`${framework}:${active}:${editorEpoch}`}
              value={files[active] ?? ""}
              onChange={onChange}
              theme={oneDark}
              extensions={extensionsFor(active)}
              indentWithTab={false}
              height="100%"
              className="absolute inset-0"
            />
          </div>
        </section>
      }
      second={
        <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
          <div
            role="tablist"
            aria-label="Preview"
            className="flex shrink-0 items-center gap-1 border-b border-zinc-800 px-2"
          >
            <PaneTab
              active={bottomTab === "preview"}
              onClick={() => setBottomTab("preview")}
            >
              Preview
            </PaneTab>
            <PaneTab
              active={bottomTab === "console"}
              onClick={() => setBottomTab("console")}
            >
              Console
              {logs.length > 0 && (
                <span
                  className={
                    errorCount > 0 ? "text-rose-400" : "text-zinc-500"
                  }
                >
                  {" "}
                  ({logs.length})
                </span>
              )}
            </PaneTab>
            <span className="ml-auto pr-1 text-[11px] text-zinc-600">
              edits re-run automatically
            </span>
          </div>
          {buildError && (
            <p className="shrink-0 border-b border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-300">
              {buildError}
            </p>
          )}
          <div className="relative min-h-0 flex-1">
            {/* The iframe stays mounted while the console tab is open so the
                user's app keeps running (and logging) behind it. */}
            <iframe
              key={previewEpoch}
              srcDoc={srcdoc ?? "<!doctype html>"}
              sandbox="allow-scripts allow-modals allow-forms"
              title="Preview"
              className={`absolute inset-0 h-full w-full bg-white ${
                bottomTab === "preview" ? "" : "invisible"
              }`}
            />
            {bottomTab === "console" && (
              <div className="absolute inset-0 overflow-y-auto bg-zinc-950 p-2 font-mono text-xs leading-5">
                {logs.length === 0 ? (
                  <p className="px-1 py-0.5 text-zinc-600">
                    console.log output from the preview shows up here.
                  </p>
                ) : (
                  logs.map((entry, i) => (
                    <p
                      key={i}
                      className={`whitespace-pre-wrap break-all border-b border-zinc-900 px-1 py-0.5 ${
                        entry.level === "error"
                          ? "text-rose-300"
                          : entry.level === "warn"
                            ? "text-amber-300"
                            : "text-zinc-300"
                      }`}
                    >
                      {entry.text}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      }
    />
  );
}

const WORTH_SAYING = "\n## Worth saying out loud";

/**
 * The Solution tab for UI problems: the approach prose, then the complete
 * reference files — switchable by framework and by file, like the editor —
 * then the interview-signal notes.
 */
export function UiSolution({
  ui,
  prose,
}: {
  ui: UiWorkspaceSpec;
  prose?: string;
}) {
  const solved = uiTemplates(ui).filter(
    (t) => t.solution !== undefined && t.solution.length > 0,
  );
  const [framework, setFramework] = useState<UiFramework>(
    solved[0]?.framework ?? ui.framework,
  );
  const template = solved.find((t) => t.framework === framework) ?? solved[0];
  const [fileName, setFileName] = useState(
    template?.solution?.[0]?.name ?? "",
  );
  const file =
    template?.solution?.find((f) => f.name === fileName) ??
    template?.solution?.[0];

  const pickFramework = (fw: UiFramework) => {
    setFramework(fw);
    setFileName(
      solved.find((t) => t.framework === fw)?.solution?.[0]?.name ?? "",
    );
  };

  // Show the notes after the code they talk about.
  const split = prose?.indexOf(WORTH_SAYING) ?? -1;
  const before = split === -1 ? prose : prose!.slice(0, split);
  const after = split === -1 ? undefined : prose!.slice(split + 1);

  return (
    <div className="space-y-5">
      {before && (
        <RichText text={before} className="text-sm leading-6 text-zinc-300" />
      )}
      {template && file && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-zinc-100">
              Reference files
            </h2>
            {solved.length > 1 && (
              <div className="flex gap-1.5">
                {solved.map((t) => (
                  <ChipButton
                    key={t.framework}
                    active={t.framework === framework}
                    onClick={() => pickFramework(t.framework)}
                  >
                    {UI_FRAMEWORK_LABELS[t.framework]}
                  </ChipButton>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {template.solution!.map((f) => (
              <ChipButton
                key={f.name}
                active={f.name === file.name}
                onClick={() => setFileName(f.name)}
              >
                {f.name}
              </ChipButton>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs leading-6 text-zinc-200">
            {file.contents}
          </pre>
        </section>
      )}
      {after && (
        <RichText text={after} className="text-sm leading-6 text-zinc-300" />
      )}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
