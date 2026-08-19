// The console under the editor: sample test cases (read-only — tests are
// loaded server-side by slug so a client can't submit doctored ones) and
// per-case run verdicts.
import { useState } from "react";
import type { RunResult, TestVerdict } from "@/lib/run-judge";
import type { Judge } from "@/lib/types";

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
export function TestcasePanel({ tests }: { tests: Judge["tests"] }) {
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

export function ResultsPanel({
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
