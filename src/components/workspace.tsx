"use client";

import { useCallback, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { runJudge, type RunResult, type TestVerdict } from "@/lib/run-judge";
import type { Judge } from "@/lib/types";

const extensions = [javascript(), keymap.of([indentWithTab])];

export function Workspace({ slug, judge }: { slug: string; judge: Judge }) {
  const storageKey = `callback:code:${slug}`;
  // Restore saved code on the client; the editor itself only renders
  // client-side, so the server/client difference never reaches the DOM.
  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return judge.starterCode;
    try {
      return localStorage.getItem(storageKey) ?? judge.starterCode;
    } catch {
      return judge.starterCode;
    }
  });
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const onChange = useCallback(
    (value: string) => {
      setCode(value);
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        // Storage full or unavailable — the editor still works.
      }
    },
    [storageKey],
  );

  const run = async () => {
    setRunning(true);
    setResult(null);
    setResult(await runJudge(code, judge));
    setRunning(false);
  };

  const reset = () => {
    setCode(judge.starterCode);
    setResult(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore, same as above.
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-500">JavaScript</span>
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

      <div className="overflow-hidden rounded-lg border border-zinc-800 text-[13px]">
        <CodeMirror
          value={code}
          onChange={onChange}
          theme={oneDark}
          extensions={extensions}
          minHeight="320px"
          maxHeight="560px"
        />
      </div>

      <ResultsPanel
        result={result}
        running={running}
        testCount={judge.tests.length}
      />
    </div>
  );
}

function ResultsPanel({
  result,
  running,
  testCount,
}: {
  result: RunResult | null;
  running: boolean;
  testCount: number;
}) {
  if (running) {
    return <Panel className="text-zinc-400">Running {testCount} cases…</Panel>;
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
        <span
          className={verdict.pass ? "text-emerald-400" : "text-rose-400"}
        >
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
