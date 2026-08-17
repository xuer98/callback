"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { useProgress } from "./progress";
import {
  runJudge,
  runOnServer,
  type RunResult,
  type TestVerdict,
} from "@/lib/run-judge";
import { isPythonReady, runPythonJudge } from "@/lib/run-python";
import type { Judge, Language } from "@/lib/types";

const EXTENSIONS = {
  javascript: [javascript(), keymap.of([indentWithTab])],
  python: [python(), keymap.of([indentWithTab])],
} satisfies Record<Language, unknown[]>;

const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: "JavaScript",
  python: "Python",
};

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

  const available: Language[] = judge.python
    ? ["javascript", "python"]
    : ["javascript"];

  const [language, setLanguage] = useState<Language>(() => {
    const preferred = readStored("callback:lang") as Language | null;
    return preferred && available.includes(preferred)
      ? preferred
      : "javascript";
  });

  const starterFor = useCallback(
    (lang: Language) =>
      lang === "python" ? judge.python!.starterCode : judge.starterCode,
    [judge],
  );

  const [code, setCode] = useState(
    () => readStored(storageKeyFor(slug, language)) ?? starterFor(language),
  );
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
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
    setCode(readStored(storageKeyFor(slug, lang)) ?? starterFor(lang));
    writeStored("callback:lang", lang);
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    // Prefer the Judge0 sandbox; fall back to the in-browser runner when
    // the server route reports it isn't configured (or is unreachable).
    const runResult =
      language === "python"
        ? ((await runOnServer(slug, code, "python")) ??
          (await runPythonJudge(code, judge)))
        : ((await runOnServer(slug, code, "javascript")) ??
          (await runJudge(code, judge)));
    setResult(runResult);
    setRunning(false);
    if (runResult.status === "pass" || runResult.status === "fail") {
      void reportRun(slug, runResult.status === "pass");
    }
  };

  const reset = () => {
    setCode(starterFor(language));
    setResult(null);
    try {
      localStorage.removeItem(storageKeyFor(slug, language));
    } catch {
      // Ignore, same as above.
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-7" />
        <div className="h-[420px] rounded-lg border border-zinc-800 bg-zinc-900/40 lg:h-[calc(100vh-360px)] lg:min-h-[420px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-md bg-zinc-900 p-0.5 ring-1 ring-inset ring-zinc-800">
          {available.map((lang) => (
            <button
              key={lang}
              onClick={() => switchLanguage(lang)}
              className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
                lang === language
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            disabled={running}
            className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-60"
          >
            Reset
          </button>
          <button
            onClick={run}
            disabled={running}
            className="rounded-md bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-default disabled:opacity-60"
          >
            {running ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      <div className="h-[420px] overflow-hidden rounded-lg border border-zinc-800 text-[13px] lg:h-[calc(100vh-360px)] lg:min-h-[420px]">
        <CodeMirror
          value={code}
          onChange={onChange}
          theme={oneDark}
          extensions={EXTENSIONS[language]}
          height="100%"
          className="h-full"
        />
      </div>

      <ResultsPanel
        result={result}
        running={running}
        testCount={judge.tests.length}
        coldPython={running && language === "python" && !isPythonReady()}
      />
    </div>
  );
}

function ResultsPanel({
  result,
  running,
  testCount,
  coldPython,
}: {
  result: RunResult | null;
  running: boolean;
  testCount: number;
  coldPython: boolean;
}) {
  if (running) {
    return (
      <Panel className="text-zinc-400">
        Running {testCount} cases…
        {coldPython && (
          <span className="text-zinc-500">
            {" "}
            (first Python run downloads the runtime — give it a few seconds)
          </span>
        )}
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
