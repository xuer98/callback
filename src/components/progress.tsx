"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  recordRunResult,
  toggleFavorite as toggleFavoriteAction,
  toggleProblemDone,
  type ProgressStatus,
} from "@/lib/progress-actions";

type ProgressMap = Record<string, "attempted" | "solved">;

const NO_FAVORITES: ReadonlySet<string> = new Set();

const ProgressContext = createContext<{
  signedIn: boolean;
  statuses: ProgressMap;
  /** Slugs the viewer has starred. */
  favorites: ReadonlySet<string>;
  reportRun: (slug: string, passed: boolean) => Promise<void>;
  toggleDone: (slug: string) => Promise<void>;
  toggleFavorite: (slug: string) => Promise<void>;
}>({
  signedIn: false,
  statuses: {},
  favorites: NO_FAVORITES,
  reportRun: async () => {},
  toggleDone: async () => {},
  toggleFavorite: async () => {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  // Keyed by owner so a signed-out (or switched) user never sees stale
  // markers — no synchronous state reset needed.
  const [progress, setProgress] = useState<{
    forUser: string | null;
    map: ProgressMap;
    stars: ReadonlySet<string>;
  }>({ forUser: null, map: {}, stars: NO_FAVORITES });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = (path: string) =>
      fetch(path, { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : null,
      );
    Promise.all([load("/api/progress"), load("/api/favorites")])
      .then(([map, slugs]: [ProgressMap | null, string[] | null]) => {
        if (!cancelled) {
          setProgress({
            forUser: userId,
            map: map ?? {},
            stars: new Set(slugs ?? []),
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const own = progress.forUser === userId;
  const statuses = own ? progress.map : {};
  const favorites = own ? progress.stars : NO_FAVORITES;

  const apply = useCallback(
    (slug: string, status: ProgressStatus) => {
      setProgress((prev) => {
        const map = { ...prev.map };
        if (status === null) delete map[slug];
        else map[slug] = status;
        return { ...prev, forUser: prev.forUser ?? userId ?? null, map };
      });
    },
    [userId],
  );

  const toggleFavorite = useCallback(
    async (slug: string) => {
      try {
        const starred = await toggleFavoriteAction(slug);
        if (starred === null) return;
        setProgress((prev) => {
          const stars = new Set(prev.stars);
          if (starred) stars.add(slug);
          else stars.delete(slug);
          return { ...prev, forUser: prev.forUser ?? userId ?? null, stars };
        });
      } catch {
        // Best-effort, like progress; the next full fetch corrects drift.
      }
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
        signedIn: Boolean(userId),
        statuses,
        favorites,
        reportRun,
        toggleDone,
        toggleFavorite,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * The leading mark of a problem row: a check once solved, a half-filled
 * circle while attempted, and the same width of nothing otherwise so titles
 * line up.
 */
export function StatusMark({ slug }: { slug: string }) {
  const { statuses } = useProgress();
  const status = statuses[slug];
  const box = "flex h-4 w-4 shrink-0 items-center justify-center";
  if (status === "solved") {
    return (
      <span className={`${box} text-emerald-400`}>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2.5 8.5 3.5 3.5 7.5-8" />
        </svg>
        <span className="sr-only">Solved</span>
      </span>
    );
  }
  if (status === "attempted") {
    return (
      <span className={`${box} text-amber-400`}>
        <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor" />
        </svg>
        <span className="sr-only">Attempted</span>
      </span>
    );
  }
  return <span aria-hidden className={box} />;
}

/**
 * The star on a problem row or page header. Signed out, it is a link to
 * sign in; signed in, it toggles the viewer's star.
 */
export function FavoriteStar({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const { signedIn, favorites, toggleFavorite } = useProgress();
  const [busy, setBusy] = useState(false);
  const starred = favorites.has(slug);
  const icon = (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill={starred ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="m8 1.75 1.9 4.05 4.4.5-3.25 3.05.85 4.4L8 11.6l-3.9 2.15.85-4.4L1.7 6.3l4.4-.5z" />
    </svg>
  );
  const shape = `flex h-7 w-7 items-center justify-center rounded-md transition-colors ${className}`;

  if (!signedIn) {
    return (
      <Link
        href="/signin"
        title="Sign in to star problems"
        className={`${shape} text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300`}
      >
        {icon}
        <span className="sr-only">Sign in to star problems</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={starred}
      aria-label={starred ? "Unstar" : "Star"}
      title={starred ? "Unstar" : "Star"}
      onClick={async () => {
        setBusy(true);
        await toggleFavorite(slug);
        setBusy(false);
      }}
      className={`${shape} disabled:opacity-60 ${
        starred
          ? "text-amber-400 hover:bg-zinc-800"
          : "text-zinc-600 hover:bg-zinc-800 hover:text-amber-300"
      }`}
    >
      {icon}
    </button>
  );
}

/**
 * Manual toggle for problems without an in-browser judge. The header variant
 * sits with the category and difficulty; the toolbar variant takes the slot
 * where the coding workspace puts Submit, so a UI problem's done control is
 * where the eye looks for it.
 */
export function MarkDoneButton({
  slug,
  variant = "header",
}: {
  slug: string;
  variant?: "header" | "toolbar";
}) {
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
      className={`rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-60 ${
        variant === "toolbar" ? "py-1" : "py-1.5"
      } ${
        solved
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/20"
          : variant === "toolbar"
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
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
