"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  recordRunResult,
  toggleProblemDone,
  type ProgressStatus,
} from "@/lib/progress-actions";

type ProgressMap = Record<string, "attempted" | "solved">;

const ProgressContext = createContext<{
  signedIn: boolean;
  statuses: ProgressMap;
  reportRun: (slug: string, passed: boolean) => Promise<void>;
  toggleDone: (slug: string) => Promise<void>;
}>({
  signedIn: false,
  statuses: {},
  reportRun: async () => {},
  toggleDone: async () => {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

const subscribeNoop = () => () => {};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  // Same hydration trap as the nav menu: the session can settle while React is
  // still retrying the hydration render, and consumers below branch their
  // markup on `signedIn`. Report signed-out until mounted so that first render
  // matches the server, which never has a session to report.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  // Keyed by owner so a signed-out (or switched) user never sees stale
  // markers — no synchronous state reset needed.
  const [progress, setProgress] = useState<{
    forUser: string | null;
    map: ProgressMap;
  }>({ forUser: null, map: {} });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch("/api/progress", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((map: ProgressMap) => {
        if (!cancelled) setProgress({ forUser: userId, map });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const statuses = progress.forUser === userId ? progress.map : {};

  const apply = useCallback(
    (slug: string, status: ProgressStatus) => {
      setProgress((prev) => {
        const map = { ...prev.map };
        if (status === null) delete map[slug];
        else map[slug] = status;
        return { forUser: prev.forUser ?? userId ?? null, map };
      });
    },
    [userId],
  );

  const reportRun = useCallback(
    async (slug: string, passed: boolean) => {
      try {
        const status = await recordRunResult(slug, passed);
        if (status !== null) apply(slug, status);
      } catch {
        // Progress is best-effort; never break the run flow.
      }
    },
    [apply],
  );

  const toggleDone = useCallback(
    async (slug: string) => {
      try {
        apply(slug, await toggleProblemDone(slug));
      } catch {
        // Ignore; the next full fetch corrects any drift.
      }
    },
    [apply],
  );

  return (
    <ProgressContext.Provider
      value={{
        signedIn: mounted && Boolean(userId),
        statuses,
        reportRun,
        toggleDone,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

/** Small status marker shown on problem rows. */
export function ProgressMarker({ slug }: { slug: string }) {
  const { statuses } = useProgress();
  const status = statuses[slug];
  if (!status) return null;
  if (status === "solved") {
    return (
      <span title="Solved" className="text-xs text-emerald-400">
        ✓
      </span>
    );
  }
  return (
    <span
      title="Attempted"
      className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
    />
  );
}

/** Manual toggle for problems without an in-browser judge. */
export function MarkDoneButton({ slug }: { slug: string }) {
  const { signedIn, statuses, toggleDone } = useProgress();
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <Link
        href="/signin"
        className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Sign in to track progress
      </Link>
    );
  }

  const solved = statuses[slug] === "solved";
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await toggleDone(slug);
        setBusy(false);
      }}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        solved
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/20"
          : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
      }`}
    >
      {solved ? "✓ Done" : "Mark as done"}
    </button>
  );
}

/** "n/total solved" chip for a list of problem slugs (tracks, companies). */
export function SolvedCount({ slugs }: { slugs: string[] }) {
  const { signedIn, statuses } = useProgress();
  if (!signedIn || slugs.length === 0) return null;
  const solved = slugs.filter((slug) => statuses[slug] === "solved").length;
  return (
    <span
      className={`text-xs ${solved === slugs.length ? "text-emerald-400" : "text-zinc-500"}`}
    >
      {solved}/{slugs.length} solved
    </span>
  );
}
