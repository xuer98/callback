"use client";

import { useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import { PROBLEM_FORMAT_LABELS, type ProblemIndexEntry } from "@/lib/types";

/** One row of the problem side menu: progress, title, format, difficulty. */
export function ProblemMenuRow({
  problem,
  status,
  current,
  onClose,
}: {
  problem: ProblemIndexEntry;
  status: "attempted" | "solved" | undefined;
  current: boolean;
  onClose: () => void;
}) {
  // Prefetch on intent rather than on sight: the list is long, and each
  // problem page is a full static payload.
  const [intent, setIntent] = useState(false);
  return (
    <li>
      <Link
        href={`/problems/${problem.slug}`}
        prefetch={intent ? null : false}
        onMouseEnter={() => setIntent(true)}
        onFocus={() => setIntent(true)}
        // Any other row closes the menu by navigating; this one is already
        // on screen, so a plain click just puts the menu away. A modified
        // click (new tab, new window) is left to the browser.
        onClick={
          current
            ? (event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                onClose();
              }
            : undefined
        }
        aria-current={current ? "page" : undefined}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          current
            ? "bg-zinc-900 text-zinc-100"
            : "text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-100"
        }`}
      >
        <RowMarker status={status} />
        <span className="min-w-0 flex-1 truncate">{problem.title}</span>
        <span className="hidden w-24 shrink-0 truncate text-xs text-zinc-500 sm:block">
          {PROBLEM_FORMAT_LABELS[problem.format]}
        </span>
        <span className="flex w-[4.5rem] shrink-0 justify-end">
          <DifficultyBadge difficulty={problem.difficulty} />
        </span>
      </Link>
    </li>
  );
}

/**
 * The leading circle: progress at rest, a spinner while the row's link is
 * navigating. One fixed size for every state, so nothing shifts.
 */
function RowMarker({ status }: { status: "attempted" | "solved" | undefined }) {
  const { pending } = useLinkStatus();
  const box =
    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full";
  if (pending) {
    return (
      <span
        aria-hidden
        className={`${box} animate-spin border-2 border-zinc-700 border-t-zinc-300`}
      />
    );
  }
  if (status === "solved") {
    return (
      <span className={`${box} bg-emerald-500 text-zinc-950`}>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
        <span className="sr-only">Solved</span>
      </span>
    );
  }
  if (status === "attempted") {
    return (
      <span className={`${box} border border-amber-400/70`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span className="sr-only">Attempted</span>
      </span>
    );
  }
  return <span aria-hidden className={`${box} border border-zinc-700`} />;
}
