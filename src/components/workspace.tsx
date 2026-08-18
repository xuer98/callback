"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { acceptCompletion } from "@codemirror/autocomplete";
import { jsCompletions, pythonCompletions } from "@/lib/editor-completions";
import { PaneTab, SplitPane } from "./resizable";
import { useProgress } from "./progress";
import {
  runJudge,
  runOnServer,
  runTypeScriptJudge,
  type RunResult,
  type TestVerdict,
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

const EXTENSIONS = {
  javascript: [javascript(), ...jsCompletions, EDITOR_KEYMAP],
  typescript: [
    javascript({ typescript: true }),
    ...jsCompletions,
    EDITOR_KEYMAP,
  ],
  python: [python(), ...pythonCompletions, EDITOR_KEYMAP],
  java: [java(), EDITOR_KEYMAP],
  cpp: [cpp(), EDITOR_KEYMAP],
  go: [go(), EDITOR_KEYMAP],
} satisfies Record<Language, unknown[]>;

// The JavaScript key predates multi-language support — keep it stable so
// existing saved solutions survive.
function storageKeyFor(slug: string, language: Language) {
  return language === "javascript"
    ? `callback:code:${slug}`
    : `callback:code:${slug}:${language}`;
}

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable — the editor still works.
  }
}

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
  const [running, setRunning] = useState(false);
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const { reportRun } = useProgress();

  const onChange = useCallback(
    (value: string) => {
      setCode(value);
      writeStored(storageKeyFor(slug, language), value);
    },
    [slug, language],
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
    try {
      localStorage.removeItem(storageKeyFor(slug, language));
    } catch {
      // Ignore, same as above.
    }
  };

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

function display(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

// The sample cases the judge will run, visible before pressing Run. They are
// read-only: tests are loaded server-side by slug so a client can't submit
// doctored ones.
function TestcasePanel({ tests }: { tests: Judge["tests"] }) {
  const [selected, setSelected] = useState(0);
  const test = tests[Math.min(selected, tests.length - 1)];
  if (!test) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tests.map((t, i) => (
          <button
            key={t.name ?? i}
            onClick={() => setSelected(i)}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              i === selected
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            {t.name ?? `Case ${i + 1}`}
          </button>
        ))}
      </div>
      <Field label="Input">
        {test.input.map((arg) => display(arg)).join("\n")}
      </Field>
      <Field label="Expected">{display(test.expected)}</Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <pre className="mt-1 overflow-x-auto rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-mono text-xs leading-5 text-zinc-200">
        {children}
      </pre>
    </div>
  );
}

function ResultsPanel({
  result,
  running,
  testCount,
  note,
}: {
  result: RunResult | null;
  running: boolean;
  testCount: number;
  note: string | null;
}) {
  if (running) {
    return (
      <Panel className="text-zinc-400">
        Running {testCount} cases…
        {note && <span className="text-zinc-500"> ({note})</span>}
      </Panel>
    );
  }
  if (!result) {
    return (
      <Panel className="text-zinc-500">
        Run your solution against {testCount} sample cases.
      </Panel>
    );
  }
  if (result.status === "error") {
    return (
      <Panel className="border-rose-500/30">
        <p className="text-xs font-semibold text-rose-400">Error</p>
        <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-rose-300">
          {result.message}
        </pre>
      </Panel>
    );
  }
  if (result.status === "timeout") {
    return (
      <Panel className="border-amber-500/30">
        <p className="text-xs font-semibold text-amber-400">Timed out</p>
        <p className="mt-2 text-xs text-amber-300">{result.message}</p>
      </Panel>
    );
  }

  const passed = result.verdicts.filter((v) => v.pass).length;
  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-sm font-medium ${
          result.status === "pass" ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {result.status === "pass"
          ? `All ${result.verdicts.length} cases passed`
          : `${passed}/${result.verdicts.length} cases passed`}
      </p>
      {result.verdicts.map((verdict) => (
        <VerdictRow key={verdict.name} verdict={verdict} />
      ))}
    </div>
  );
}

function VerdictRow({ verdict }: { verdict: TestVerdict }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        verdict.pass
          ? "border-zinc-800 bg-zinc-900/40"
          : "border-rose-500/30 bg-rose-500/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={verdict.pass ? "text-emerald-400" : "text-rose-400"}>
          {verdict.pass ? "✓" : "✕"} {verdict.name}
        </span>
        <span className="shrink-0 text-zinc-600">
          {verdict.timeMs.toFixed(1)} ms
        </span>
      </div>
      {!verdict.pass && (
        <div className="mt-2 space-y-1 whitespace-pre-wrap break-all font-mono text-xs text-zinc-400">
          <p>Input: {verdict.input}</p>
          <p>
            Expected: <span className="text-zinc-200">{verdict.expected}</span>
          </p>
          <p>
            {verdict.error ? "Threw" : "Got"}:{" "}
            <span className="text-rose-300">
              {verdict.error ?? verdict.got}
            </span>
          </p>
        </div>
      )}
      {verdict.logs.length > 0 && (
        <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-zinc-600">
          {verdict.logs.join("\n")}
        </pre>
      )}
    </div>
  );
}

function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm ${className}`}
    >
      {children}
    </div>
  );
}
