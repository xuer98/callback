"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

// Where a problem page's back button goes: the list the problem was opened
// from — /problems, a company page or a track — with the filters, sort and
// page that were in its URL. List pages record themselves as they render
// and the problem page reads the record, so problem pages stay static. The
// record is per tab, since it describes this tab's journey; a problem opened
// cold falls back to the unfiltered list.

interface ListTarget {
  href: string;
  label: string;
}

const STORAGE_KEY = "callback:list";
const FALLBACK: ListTarget = { href: "/problems", label: "Problems" };

/** Rendered by a list page: remembers its URL and name for the back button. */
export function RememberList({ href, label }: ListTarget) {
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ href, label }));
    } catch {
      // Storage blocked: the button falls back to /problems.
    }
  }, [href, label]);
  return null;
}

// useSyncExternalStore wants the same object back while nothing changed.
let cachedRaw: string | null | undefined;
let cachedTarget: ListTarget = FALLBACK;

function readTarget(): ListTarget {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Unreadable storage: fall back.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTarget = parseTarget(raw) ?? FALLBACK;
  }
  return cachedTarget;
}

/** Only a same-site path with a name counts; anything else is ignored. */
function parseTarget(raw: string | null): ListTarget | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ListTarget>;
    if (
      typeof value.href === "string" &&
      value.href.startsWith("/") &&
      !value.href.startsWith("//") &&
      typeof value.label === "string" &&
      value.label.trim() !== ""
    ) {
      return { href: value.href, label: value.label };
    }
  } catch {
    // Not ours.
  }
  return null;
}

const subscribeNoop = () => () => {};

export function BackToList() {
  const target = useSyncExternalStore(
    subscribeNoop,
    readTarget,
    () => FALLBACK,
  );
  return (
    <Link
      href={target.href}
      aria-label={`Back to ${target.label}`}
      title={`Back to ${target.label}`}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 8H3M7 4 3 8l4 4" />
      </svg>
    </Link>
  );
}
