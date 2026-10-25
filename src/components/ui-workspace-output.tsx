"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaneTab } from "./resizable";
import { buildPreview, type PreviewLog } from "@/lib/preview";
import type { UiTemplate } from "@/lib/types";
import {
  TESTS_MESSAGE_SOURCE,
  type TestReport,
  type TestStatus,
} from "@/lib/ui-tests";

// The lower pane of the UI workspace: the live preview, the captured
// console, and, for React templates, the results of the last test run. A
// run builds its own sandboxed document from the current files plus the
// test file (see preview.ts) and loads it in an iframe that stays hidden
// behind the pane; the harness inside posts one message per test.

export type OutputTab = "preview" | "console" | "tests";

/**
 * A run with no test finishing for this long is abandoned and its iframe
 * removed. Measured between results rather than over the whole run, since a
 * background tab's throttled timers can stretch a healthy run a long way.
 */
const STALL_LIMIT_MS = 30_000;

const STATUSES: readonly TestStatus[] = ["pass", "fail", "skip", "todo"];

export interface TestRun {
  id: number;
  status: "running" | "done";
  reports: TestReport[];
  /** Milliseconds, once done. */
  duration?: number;
  /** Why the run produced no (or not all) results. */
  fatal?: string;
}

/** The iframe document of the run in progress. */
export interface TestDocument {
  id: number;
  srcdoc: string;
}

function asReport(value: unknown): TestReport | null {
  if (value === null || typeof value !== "object") return null;
  const { name, status, duration, error } = value as Record<string, unknown>;
  if (
    !Array.isArray(name) ||
    !name.every((part) => typeof part === "string") ||
    !STATUSES.includes(status as TestStatus) ||
    typeof duration !== "number" ||
    (error !== undefined && typeof error !== "string")
  ) {
    return null;
  }
  return { name, status: status as TestStatus, duration, error };
}

export function useTestRun() {
  const [run, setRun] = useState<TestRun | null>(null);
  const [doc, setDoc] = useState<TestDocument | null>(null);
  const latest = useRef(0);
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopLimit = () => {
    if (limit.current) clearTimeout(limit.current);
    limit.current = null;
  };

  const finish = useCallback((id: number, update: Partial<TestRun>) => {
    stopLimit();
    setDoc(null);
    setRun((prev) =>
      prev && prev.id === id ? { ...prev, ...update, status: "done" } : prev,
    );
  }, []);

  const watch = useCallback(
    (id: number) => {
      stopLimit();
      limit.current = setTimeout(
        () =>
          finish(id, {
            fatal: `No test finished for ${STALL_LIMIT_MS / 1000} s, so the run was stopped. A test may be waiting on something that never happens, or looping.`,
          }),
        STALL_LIMIT_MS,
      );
    },
    [finish],
  );

  // Results arrive from the sandboxed iframe, whose origin is opaque, so
  // they are recognised by shape and by the id of the run in progress.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null;
      if (data?.source !== TESTS_MESSAGE_SOURCE) return;
      const id = data.run;
      if (typeof id !== "number" || id !== latest.current) return;
      if (data.kind === "test") {
        const report = asReport(data.report);
        if (report === null) return;
        watch(id);
        setRun((prev) =>
          prev && prev.id === id
            ? { ...prev, reports: [...prev.reports, report] }
            : prev,
        );
      } else if (data.kind === "done") {
        finish(id, {
          duration: typeof data.duration === "number" ? data.duration : 0,
        });
      } else if (data.kind === "fatal") {
        finish(id, { fatal: String(data.message) });
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopLimit();
    };
  }, [finish, watch]);

  const start = useCallback(
    async (
      template: UiTemplate,
      files: Record<string, string>,
      testFile: string,
    ) => {
      const id = ++latest.current;
      stopLimit();
      setDoc(null);
      setRun({ id, status: "running", reports: [] });
      const built = await buildPreview(template, files, {
        tests: { file: testFile, run: id },
      });
      if (id !== latest.current) return;
      if (!built.ok) {
        finish(id, { fatal: `${built.file}: ${built.message}` });
        return;
      }
      setDoc({ id, srcdoc: built.srcdoc });
      watch(id);
    },
    [finish, watch],
  );

  /** Forgets the current run, e.g. when the template changes. */
  const clear = useCallback(() => {
    latest.current += 1;
    stopLimit();
    setDoc(null);
    setRun(null);
  }, []);

  return { run, doc, start, clear };
}

export function UiOutputPane({
  tab,
  onTab,
  srcdoc,
  previewEpoch,
  buildError,
  logs,
  testFile,
  testRun,
  testDoc,
}: {
  tab: OutputTab;
  onTab: (tab: OutputTab) => void;
  srcdoc: string | null;
  previewEpoch: number;
  buildError: string | null;
  logs: PreviewLog[];
  /** The template's test file, or null when it has none (no Tests tab). */
  testFile: string | null;
  testRun: TestRun | null;
  testDoc: TestDocument | null;
}) {
  const errorCount = logs.filter((entry) => entry.level === "error").length;
  const ran = testRun?.reports.filter(
    (r) => r.status === "pass" || r.status === "fail",
  );
  const passed = ran?.filter((r) => r.status === "pass").length ?? 0;

  return (
    <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
      <div
        role="tablist"
        aria-label="Preview"
        className="flex shrink-0 items-center gap-1 border-b border-zinc-800 px-2"
      >
        <PaneTab active={tab === "preview"} onClick={() => onTab("preview")}>
          Preview
        </PaneTab>
        <PaneTab active={tab === "console"} onClick={() => onTab("console")}>
          Console
          {logs.length > 0 && (
            <span
              className={errorCount > 0 ? "text-rose-400" : "text-zinc-500"}
            >
              {" "}
              ({logs.length})
            </span>
          )}
        </PaneTab>
        {testFile !== null && (
          <PaneTab active={tab === "tests"} onClick={() => onTab("tests")}>
            Tests
            {ran !== undefined && ran.length > 0 && (
              <span
                className={
                  passed === ran.length ? "text-emerald-400" : "text-rose-400"
                }
              >
                {" "}
                ({passed}/{ran.length})
              </span>
            )}
          </PaneTab>
        )}
        <span className="ml-auto pr-1 text-[11px] text-zinc-600">
          edits re-run automatically
        </span>
      </div>
      {buildError && tab !== "tests" && (
        <p className="shrink-0 border-b border-rose-500/30 bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-300">
          {buildError}
        </p>
      )}
      <div className="relative min-h-0 flex-1">
        {/* The test run's iframe sits under everything, covered by each
            tab's opaque layer rather than hidden: Chrome throttles rendering,
            requestAnimationFrame included, in hidden cross-origin frames. No
            allow-modals: an alert() in a test must not block the page. */}
        {testDoc && (
          <iframe
            key={`test-${testDoc.id}`}
            srcDoc={testDoc.srcdoc}
            sandbox="allow-scripts allow-forms"
            title="Test runner"
            aria-hidden
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 h-full w-full bg-white"
          />
        )}
        {/* The preview stays mounted behind the other tabs, so the user's
            app keeps running (and logging). */}
        <iframe
          key={`preview-${previewEpoch}`}
          srcDoc={srcdoc ?? "<!doctype html>"}
          sandbox="allow-scripts allow-modals allow-forms"
          title="Preview"
          className={`absolute inset-0 h-full w-full bg-white ${
            tab === "preview" ? "" : "invisible"
          }`}
        />
        {tab === "console" && <ConsoleView logs={logs} />}
        {tab === "tests" && testFile !== null && (
          <TestResults run={testRun} testFile={testFile} />
        )}
      </div>
    </section>
  );
}

function ConsoleView({ logs }: { logs: PreviewLog[] }) {
  return (
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
  );
}

const MARKS: Record<TestStatus, { glyph: string; className: string }> = {
  pass: { glyph: "✓", className: "text-emerald-400" },
  fail: { glyph: "✕", className: "text-rose-400" },
  skip: { glyph: "○", className: "text-zinc-600" },
  todo: { glyph: "✎", className: "text-zinc-500" },
};

function TestResults({
  run,
  testFile,
}: {
  run: TestRun | null;
  testFile: string;
}) {
  if (run === null) {
    return (
      <div className="absolute inset-0 overflow-y-auto bg-zinc-950 px-4 py-3 text-xs leading-5 text-zinc-500">
        <p>
          Write tests in{" "}
          <span className="font-mono text-zinc-300">{testFile}</span>, then
          press Run tests. They run here in the browser with Testing Library,
          user-event and Vitest&apos;s expect and vi.
        </p>
      </div>
    );
  }

  const count = (status: TestStatus) =>
    run.reports.filter((r) => r.status === status).length;
  const summary = [
    { n: count("pass"), label: "passed", className: "text-emerald-400" },
    { n: count("fail"), label: "failed", className: "text-rose-400" },
    { n: count("skip"), label: "skipped", className: "text-zinc-500" },
    { n: count("todo"), label: "todo", className: "text-zinc-500" },
  ].filter((part) => part.n > 0);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-zinc-950 text-xs leading-5">
      <p className="sticky top-0 flex flex-wrap items-center gap-x-3 border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-400">
        {run.status === "running" && <span>Running tests…</span>}
        {summary.map((part) => (
          <span key={part.label} className={part.className}>
            {part.n} {part.label}
          </span>
        ))}
        {run.duration !== undefined && (
          <span className="ml-auto text-zinc-600">{run.duration} ms</span>
        )}
      </p>
      {run.fatal && (
        <pre className="m-3 whitespace-pre-wrap break-words rounded-md border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-[11px] leading-5 text-rose-300">
          {run.fatal}
        </pre>
      )}
      <ul>
        {run.reports.map((report, i) => {
          const mark = MARKS[report.status];
          const title = report.name.at(-1) ?? "";
          return (
            <li key={i} className="border-b border-zinc-900 px-3 py-1.5">
              <div className="flex items-baseline gap-2">
                <span aria-hidden className={`w-3 shrink-0 ${mark.className}`}>
                  {mark.glyph}
                </span>
                <span className="sr-only">{report.status}</span>
                <span className="min-w-0 flex-1 break-words">
                  {report.name.slice(0, -1).map((part, j) => (
                    <span key={j} className="text-zinc-500">
                      {part} ›{" "}
                    </span>
                  ))}
                  <span
                    className={
                      report.status === "skip" || report.status === "todo"
                        ? "text-zinc-500"
                        : "text-zinc-200"
                    }
                  >
                    {title}
                  </span>
                </span>
                {(report.status === "pass" || report.status === "fail") && (
                  <span className="shrink-0 text-zinc-600">
                    {report.duration} ms
                  </span>
                )}
              </div>
              {report.error && (
                <pre className="ml-5 mt-1.5 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-900 p-2 font-mono text-[11px] leading-5 text-rose-300">
                  {report.error}
                </pre>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
