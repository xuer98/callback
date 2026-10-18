"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  listSubmissions,
  type AlgoSubmission,
  type SubmissionHistory as History,
} from "@/lib/workspace-actions";
import { LANGUAGE_LABELS, type Language } from "@/lib/types";

// The Submissions tab beside Description and Solution: every graded attempt
// at this problem, newest first, with the code a click away and a route back
// into the editor. The history is shared across the two panes through this
// context — the workspace's Submit prepends to it and lends it a restore
// function; the tab reads it. It loads the first time the tab opens rather
// than on page load, so a problem the user only reads costs nothing.

type Restorer = (submission: AlgoSubmission) => void;

interface SubmissionsStore {
  signedIn: boolean;
  /** null until the first load finishes. */
  submissions: AlgoSubmission[] | null;
  /** How many exist in all; `submissions` holds the newest of them. */
  total: number;
  /** The workspace is running or submitting, so Restore waits. */
  busy: boolean;
  /** The submission opened from the list, if any; Submit closes it. */
  openId: number | null;
  setOpenId: (id: number | null) => void;
  load: () => void;
  /** Submit archived one: put it on top and tell the panes. */
  recorded: (submission: AlgoSubmission) => void;
  restore: Restorer;
  setRestorer: (restorer: Restorer | null) => void;
  setBusy: (busy: boolean) => void;
}

const noop = () => {};

// The defaults let the workspace render outside a provider (nothing is
// recorded anywhere visible, which is also what happens signed out).
const SubmissionsContext = createContext<SubmissionsStore>({
  signedIn: false,
  submissions: null,
  total: 0,
  busy: false,
  openId: null,
  setOpenId: noop,
  load: noop,
  recorded: noop,
  restore: noop,
  setRestorer: noop,
  setBusy: noop,
});

export function useSubmissions() {
  return useContext(SubmissionsContext);
}

export function SubmissionsProvider({
  slug,
  onRecorded,
  children,
}: {
  slug: string;
  /** Called after Submit archives a row — the panes open the tab on it. */
  onRecorded?: () => void;
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id ?? null;
  const signedIn = userId !== null;
  // Keyed by owner, as the progress store is: signing out or switching
  // accounts never shows a stale list, and needs no reset in an effect.
  const [history, setHistory] = useState<{
    forUser: string;
    data: History;
  } | null>(null);
  const current = history && history.forUser === userId ? history.data : null;
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const currentRef = useRef(current);
  const restorer = useRef<Restorer | null>(null);
  const onRecordedRef = useRef(onRecorded);
  // A fetch is superseded (its result dropped) when a newer one starts, so a
  // list requested before Submit's insert can never overwrite one after it.
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  }, [onRecorded]);

  const fetchHistory = useCallback(
    (force: boolean) => {
      if (userId === null || (inFlight.current && !force)) return;
      const mine = ++generation.current;
      inFlight.current = true;
      listSubmissions(slug)
        .then((result) => {
          if (generation.current !== mine) return;
          inFlight.current = false;
          setHistory({ forUser: userId, data: result });
        })
        .catch(() => {
          if (generation.current === mine) inFlight.current = false;
        });
    },
    [userId, slug],
  );

  const load = useCallback(() => fetchHistory(false), [fetchHistory]);

  const recorded = useCallback(
    (submission: AlgoSubmission) => {
      if (currentRef.current) {
        setHistory((prev) =>
          prev
            ? {
                forUser: prev.forUser,
                data: {
                  rows: [submission, ...prev.data.rows],
                  total: prev.data.total + 1,
                },
              }
            : prev,
        );
      } else {
        // Nothing to prepend to yet: whatever arrives must include this row.
        fetchHistory(true);
      }
      // Back to the list, where the new row sits on top.
      setOpenId(null);
      onRecordedRef.current?.();
    },
    [fetchHistory],
  );

  const restore = useCallback<Restorer>((submission) => {
    restorer.current?.(submission);
  }, []);
  const setRestorer = useCallback((next: Restorer | null) => {
    restorer.current = next;
  }, []);

  const value = useMemo<SubmissionsStore>(
    () => ({
      signedIn,
      submissions: current?.rows ?? null,
      total: current?.total ?? 0,
      busy,
      openId,
      setOpenId,
      load,
      recorded,
      restore,
      setRestorer,
      setBusy,
    }),
    [signedIn, current, busy, openId, load, recorded, restore, setRestorer],
  );

  return (
    <SubmissionsContext.Provider value={value}>
      {children}
    </SubmissionsContext.Provider>
  );
}

const STATUS_LABELS: Record<AlgoSubmission["status"], string> = {
  pass: "Accepted",
  fail: "Wrong Answer",
  error: "Runtime Error",
  timeout: "Time Limit Exceeded",
};

const STATUS_COLORS: Record<AlgoSubmission["status"], string> = {
  pass: "text-emerald-400",
  fail: "text-rose-400",
  error: "text-rose-400",
  timeout: "text-amber-400",
};

function languageLabel(language: string): string {
  return LANGUAGE_LABELS[language as Language] ?? language;
}

function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoment(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRuntime(ms: number | null): string {
  return ms === null ? "—" : `${ms} ms`;
}

/** The tab's contents: the list, or one submission opened from it. */
export function SubmissionHistory() {
  const {
    signedIn,
    submissions,
    total,
    busy,
    openId,
    setOpenId,
    load,
    restore,
  } = useSubmissions();

  useEffect(() => {
    if (signedIn && submissions === null) load();
  }, [signedIn, submissions, load]);

  if (!signedIn) {
    return (
      <Note>
        <Link
          href="/signin"
          className="text-zinc-300 underline underline-offset-2 hover:text-zinc-50"
        >
          Sign in
        </Link>{" "}
        to keep a history of your submissions.
      </Note>
    );
  }
  if (submissions === null) return <Note>Loading submissions…</Note>;
  if (submissions.length === 0) {
    return (
      <Note>
        No submissions yet. Submit grades every test and archives the attempt
        here.
      </Note>
    );
  }

  const openIndex = submissions.findIndex((s) => s.id === openId);
  if (openIndex !== -1) {
    return (
      <SubmissionDetail
        submission={submissions[openIndex]}
        number={total - openIndex}
        busy={busy}
        onBack={() => setOpenId(null)}
        onRestore={restore}
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-zinc-500">
              <th scope="col" className="w-8 pb-2 pr-2 font-normal">
                <span className="sr-only">Number</span>
              </th>
              <th scope="col" className="pb-2 pr-3 font-normal">
                Status
              </th>
              <th scope="col" className="pb-2 pr-3 font-normal">
                Language
              </th>
              <th scope="col" className="pb-2 pr-3 font-normal">
                Runtime
              </th>
              <th scope="col" className="pb-2 font-normal">
                Cases
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission, i) => (
              // The row opens on click; the status is a real button so the
              // keyboard reaches the same place (its click bubbles here).
              <tr
                key={submission.id}
                onClick={() => setOpenId(submission.id)}
                className="cursor-pointer border-t border-zinc-800/80 transition-colors odd:bg-zinc-900/30 hover:bg-zinc-800/50"
              >
                <td className="py-2.5 pr-2 align-top tabular-nums text-zinc-600">
                  {total - i}
                </td>
                <td className="py-2.5 pr-3 align-top">
                  <button
                    type="button"
                    className={`font-medium ${STATUS_COLORS[submission.status]}`}
                  >
                    {STATUS_LABELS[submission.status]}
                  </button>
                  <p
                    title={formatMoment(submission.createdAt)}
                    className="mt-0.5 whitespace-nowrap text-zinc-500"
                  >
                    {formatDay(submission.createdAt)}
                  </p>
                </td>
                <td className="py-2.5 pr-3 align-top">
                  <span className="whitespace-nowrap rounded-full bg-zinc-800/80 px-2 py-0.5 text-zinc-300">
                    {languageLabel(submission.language)}
                  </span>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3 align-top tabular-nums text-zinc-400">
                  {formatRuntime(submission.runtimeMs)}
                </td>
                <td className="whitespace-nowrap py-2.5 align-top tabular-nums text-zinc-400">
                  {submission.passed}/{submission.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {submissions.length < total && (
        <p className="mt-3 text-xs text-zinc-600">
          Showing the latest {submissions.length} of {total}.
        </p>
      )}
    </div>
  );
}

function SubmissionDetail({
  submission,
  number,
  busy,
  onBack,
  onRestore,
}: {
  submission: AlgoSubmission;
  number: number;
  busy: boolean;
  onBack: () => void;
  onRestore: Restorer;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
      >
        ← All submissions
      </button>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          className={`text-lg font-semibold ${STATUS_COLORS[submission.status]}`}
        >
          {STATUS_LABELS[submission.status]}
        </h2>
        <span className="text-xs text-zinc-500">
          #{number} · {languageLabel(submission.language)} ·{" "}
          {formatMoment(submission.createdAt)}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Runtime" value={formatRuntime(submission.runtimeMs)} />
        <Stat
          label="Test cases"
          value={`${submission.passed}/${submission.total}`}
        />
      </dl>
      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-zinc-300">Code</h3>
        <button
          type="button"
          onClick={() => onRestore(submission)}
          disabled={busy}
          title="Load this submission's code back into the editor"
          className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-60"
        >
          Restore to editor
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-mono text-xs leading-5 text-zinc-300">
        {submission.code}
      </pre>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
      {children}
    </div>
  );
}
