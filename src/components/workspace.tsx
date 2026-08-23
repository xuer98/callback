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
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { acceptCompletion } from "@codemirror/autocomplete";
import { jsCompletions, pythonCompletions } from "@/lib/editor-completions";
import { formatDocument } from "@/lib/editor-format";
import { shortcutHint, useEditorShortcuts } from "@/lib/editor-shortcuts";
import { PaneTab, SplitPane } from "./resizable";
import { ResultsPanel, TestcasePanel } from "./workspace-console";
import { useProgress } from "./progress";
import {
  readStored,
  removeStored,
  storageKeyFor,
  useSolutionSync,
  writeSavedAt,
  writeStored,
} from "@/lib/workspace-sync";
import {
  runJudge,
  runOnServer,
  runTypeScriptJudge,
  type RunResult,
} from "@/lib/run-judge";
import { isPythonReady, runPythonJudge } from "@/lib/run-python";
import {
  isServerOnly,
  judgeFor,
  languagesFor,
  LANGUAGE_LABELS,
  type Judge,
  type Language,
} from "@/lib/types";

// Tab accepts an open completion first, then falls through to indenting.
// The component's own indentWithTab binding is disabled so this order wins.
const EDITOR_KEYMAP = keymap.of([
  { key: "Tab", run: acceptCompletion },
  indentWithTab,
]);

// What Tab inserts and what Format re-indents to. CodeMirror defaults to two
// spaces for every language; these match each starter's own house style, so
// formatting a solution doesn't rewrite indentation the problem shipped with.
const INDENT = {
  javascript: "  ",
  typescript: "  ",
  python: "    ",
  java: "    ",
  cpp: "    ",
  go: "\t",
} satisfies Record<Language, string>;

const EXTENSIONS = {
  javascript: [
    javascript(),
    ...jsCompletions,
    EDITOR_KEYMAP,
    indentUnit.of(INDENT.javascript),
  ],
  typescript: [
    javascript({ typescript: true }),
    ...jsCompletions,
    EDITOR_KEYMAP,
    indentUnit.of(INDENT.typescript),
  ],
  python: [
    python(),
    ...pythonCompletions,
    EDITOR_KEYMAP,
    indentUnit.of(INDENT.python),
  ],
  java: [java(), EDITOR_KEYMAP, indentUnit.of(INDENT.java)],
  cpp: [cpp(), EDITOR_KEYMAP, indentUnit.of(INDENT.cpp)],
  go: [go(), EDITOR_KEYMAP, indentUnit.of(INDENT.go)],
} satisfies Record<Language, unknown[]>;

const subscribeNoop = () => () => {};

export function Workspace({ slug, judge }: { slug: string; judge: Judge }) {
  // Render nothing until mounted: initial state reads localStorage, so the
  // server skeleton and the client's first (hydration) render must agree.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const available = languagesFor(judge);

  const [language, setLanguage] = useState<Language>(() => {
    const preferred = readStored("callback:lang") as Language | null;
    return preferred && available.includes(preferred)
      ? preferred
      : "javascript";
  });

  const starterFor = useCallback(
    (lang: Language) => judgeFor(judge, lang)?.starterCode ?? judge.starterCode,
    [judge],
  );

  const [code, setCode] = useState(
    () => readStored(storageKeyFor(slug, language)) ?? starterFor(language),
  );
  // Remount the editor whenever code is set from outside (language switch,
  // reset). react-codemirror's external-value sync can wedge behind its
  // typing debounce and silently drop those updates; a fresh mount with the
  // new initial value sidesteps that entirely.
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  // Keyboard actions that have no button of their own say so here instead.
  const [note, setNote] = useState<string | null>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [running, setRunning] = useState(false);
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const { signedIn, reportRun } = useProgress();

  // Account sync: on load, newer server copies land in localStorage and the
  // open language is adopted below; edits are pushed up on a debounce.
  // Signed out, everything stays purely local.
  const { queueSave, flushSave, dropSolution } = useSolutionSync({
    slug,
    languages: available,
    enabled: signedIn,
    onPulled: (langs) => {
      if (langs.includes(languageRef.current)) {
        setCode(
          readStored(storageKeyFor(slug, languageRef.current)) ??
            starterFor(languageRef.current),
        );
        setEditorEpoch((epoch) => epoch + 1);
      }
    },
  });
  // The adopt callback runs from an async continuation; a ref keeps it
  // reading the language the editor is actually showing.
  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const onChange = useCallback(
    (value: string) => {
      setCode(value);
      const key = storageKeyFor(slug, language);
      writeStored(key, value);
      writeSavedAt(key, Date.now());
      if (signedIn) queueSave(language, value);
    },
    [slug, language, signedIn, queueSave],
  );

  const switchLanguage = (lang: Language) => {
    if (lang === language || running) return;
    setLanguage(lang);
    setResult(null);
    setBottomTab("testcase");
    setCode(readStored(storageKeyFor(slug, lang)) ?? starterFor(lang));
    setEditorEpoch((epoch) => epoch + 1);
    writeStored("callback:lang", lang);
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    // Prefer the Judge0 sandbox; fall back to the in-browser runner when
    // the server route reports it isn't configured (or is unreachable).
    // Java, C++, and Go have no browser runtime, so there is nothing to
    // fall back to — say so rather than failing silently.
    const runResult =
      (await runOnServer(slug, code, language)) ?? (await runInBrowser());
    setResult(runResult);
    setRunning(false);
    setBottomTab("result");
    if (runResult.status === "pass" || runResult.status === "fail") {
      void reportRun(slug, runResult.status === "pass");
    }
  };

  const runInBrowser = (): Promise<RunResult> => {
    if (isServerOnly(language)) {
      return Promise.resolve({
        status: "error",
        message: `${LANGUAGE_LABELS[language]} runs in the server sandbox, which isn't configured. Set JUDGE0_URL to run it, or switch to JavaScript, TypeScript, or Python — those run right here in the browser.`,
      });
    }
    if (language === "python") return runPythonJudge(code, judge);
    if (language === "typescript") return runTypeScriptJudge(code, judge);
    return runJudge(code, judge);
  };

  const reset = () => {
    setCode(starterFor(language));
    setEditorEpoch((epoch) => epoch + 1);
    setResult(null);
    const key = storageKeyFor(slug, language);
    removeStored(key);
    removeStored(`${key}:savedAt`);
    if (signedIn) dropSolution(language);
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

  // Every edit already writes localStorage and queues an account save, so
  // Cmd+S is really "stop waiting for the debounce" plus an acknowledgement.
  const save = () => {
    const key = storageKeyFor(slug, language);
    writeStored(key, code);
    writeSavedAt(key, Date.now());
    if (signedIn) flushSave(language, code);
    flash("Saved");
  };

  const format = () => {
    const view = editorRef.current?.view;
    if (!view) return;
    formatDocument(view);
    flash("Formatted");
  };

  // Run grades every test and records the outcome, so it is also what
  // Submit does — there is no separate sample-tests-only pass to run first.
  const runFromKeyboard = () => {
    if (!running) void run();
  };

  useEditorShortcuts({
    save,
    format,
    run: runFromKeyboard,
    submit: runFromKeyboard,
  });

  if (!mounted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-[420px] flex-1 rounded-lg border border-zinc-800 bg-zinc-900/40" />
        <div className="h-[200px] shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/40" />
      </div>
    );
  }

  const passed =
    result && (result.status === "pass" || result.status === "fail")
      ? result.verdicts.filter((v) => v.pass).length
      : null;

  return (
    <SplitPane
      direction="vertical"
      storageKey="callback:split:console"
      initial={0.62}
      min={0.25}
      max={0.85}
      className="min-h-0 flex-1"
      first={
        <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
            <div className="flex items-center gap-2">
              <span aria-hidden className="font-mono text-xs text-zinc-600">
                &lt;/&gt;
              </span>
              <span className="text-xs font-medium text-zinc-300">Code</span>
              <label className="relative ml-1">
                <span className="sr-only">Language</span>
                <select
                  value={language}
                  onChange={(e) => switchLanguage(e.target.value as Language)}
                  disabled={running}
                  className="cursor-pointer appearance-none rounded-md bg-zinc-900 py-1 pl-2.5 pr-7 font-mono text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors hover:text-white focus:outline-none focus:ring-indigo-500 disabled:opacity-60"
                >
                  {available.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
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
              <span
                aria-live="polite"
                className={`text-xs text-emerald-400 transition-opacity ${
                  note ? "opacity-100" : "opacity-0"
                }`}
              >
                {note ?? ""}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                disabled={running}
                className="rounded-md border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-60"
              >
                Reset
              </button>
              <button
                onClick={run}
                disabled={running}
                title={`Run all tests (${shortcutHint("run")} or ${shortcutHint(
                  "submit",
                )})`}
                className="rounded-md bg-indigo-500 px-4 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-default disabled:opacity-60"
              >
                {running ? "Running\u2026" : "Run"}
              </button>
            </div>
          </header>
          {/* Positioned rather than percentage-sized: when the pane's own
              height comes from flex (as it does stacked on mobile), a
              height:100% chain has nothing definite to resolve against and
              the editor collapses to its content. */}
          <div className="relative min-h-0 flex-1 overflow-hidden text-[13px]">
            <CodeMirror
              ref={editorRef}
              key={`${language}:${editorEpoch}`}
              value={code}
              onChange={onChange}
              theme={oneDark}
              extensions={EXTENSIONS[language]}
              indentWithTab={false}
              height="100%"
              className="absolute inset-0"
            />
          </div>
        </section>
      }
      second={
        <section className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
          <div
            role="tablist"
            aria-label="Console"
            className="flex shrink-0 items-center gap-1 border-b border-zinc-800 px-2"
          >
            <PaneTab
              active={bottomTab === "testcase"}
              onClick={() => setBottomTab("testcase")}
            >
              Testcase
            </PaneTab>
            <PaneTab
              active={bottomTab === "result"}
              onClick={() => setBottomTab("result")}
            >
              Test Result
            </PaneTab>
            {passed !== null && (
              <span
                className={`ml-auto pr-1 text-xs ${
                  result?.status === "pass"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {passed}/
                {result?.status === "pass" || result?.status === "fail"
                  ? result.verdicts.length
                  : 0}
              </span>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {bottomTab === "testcase" ? (
              <TestcasePanel tests={judge.tests} />
            ) : (
              <ResultsPanel
                result={result}
                running={running}
                testCount={judge.tests.length}
                note={
                  !running
                    ? null
                    : language === "python" && !isPythonReady()
                      ? "first Python run downloads the runtime \u2014 give it a few seconds"
                      : isServerOnly(language)
                        ? "compiling in the server sandbox"
                        : null
                }
              />
            )}
          </div>
        </section>
      }
    />
  );
}
