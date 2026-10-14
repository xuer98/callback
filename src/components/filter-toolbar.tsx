"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  defaultDirection,
  SORT_KEYS,
  SORT_LABELS,
  type ProblemSort,
} from "@/lib/problem-sort";

// The buttons at the head of the filter toolbar: the sort menu, the funnel
// that opens the panel, badged with how much is active, and the Starred
// toggle. The panel component owns the state and hands each its handler.

const TOOLBAR_BUTTON =
  "flex h-[34px] shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors";

/**
 * One key at a time, picked from a menu; picking the active key again
 * reverses its order. The default order needs no second pick, so it closes.
 */
export function SortMenu({
  sort,
  onChange,
}: {
  sort: ProblemSort;
  onChange: (next: ProblemSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const sorted = sort.key !== "default";
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((shown) => !shown)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={sorted ? `Sorted by ${SORT_LABELS[sort.key]}` : "Sort"}
        title="Sort"
        className={`${TOOLBAR_BUTTON} w-[34px] ${
          open || sorted
            ? "bg-zinc-800 text-zinc-100 ring-zinc-700"
            : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-100"
        }`}
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
          <path d="M5 2.5v11M2.5 11 5 13.5 7.5 11M11 13.5v-11M8.5 5 11 2.5 13.5 5" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Sort by"
          className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl shadow-black/60"
        >
          {SORT_KEYS.map((key) => {
            const current = sort.key === key;
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                onClick={() => {
                  onChange(
                    current && key !== "default"
                      ? {
                          key,
                          direction: sort.direction === "asc" ? "desc" : "asc",
                        }
                      : { key, direction: defaultDirection(key) },
                  );
                  if (key === "default") setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  current
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {SORT_LABELS[key]}
                {current && (
                  <span aria-hidden className="text-xs text-zinc-400">
                    {key === "default"
                      ? "\u2713"
                      : sort.direction === "asc"
                        ? "\u2191"
                        : "\u2193"}
                  </span>
                )}
              </button>
            );
          })}
          <p className="px-2.5 pb-1 pt-2 text-[11px] leading-4 text-zinc-500">
            Pick the same key again to reverse it. Frequency orders the
            listings; last worked on, your own problems.
          </p>
        </div>
      )}
    </div>
  );
}

export function FilterButton({
  buttonRef,
  open,
  activeCount,
  panelId,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  activeCount: number;
  panelId: string;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={
        activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"
      }
      aria-expanded={open}
      aria-controls={panelId}
      title="Filters"
      className={`${TOOLBAR_BUTTON} relative w-[34px] ${
        open || activeCount > 0
          ? "bg-zinc-800 text-zinc-100 ring-zinc-700"
          : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-100"
      }`}
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
        <path d="M2.5 3.5h11L9.5 8.5v4l-3 1.5v-5.5z" />
      </svg>
      {activeCount > 0 && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold leading-none text-white"
        >
          {activeCount}
        </span>
      )}
    </button>
  );
}

/** Stars are the viewer's own, so for a visitor the toggle leads to sign-in. */
export function StarredToggle({
  on,
  signedIn,
  onClick,
}: {
  on: boolean;
  signedIn: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={signedIn ? "Only starred problems" : "Sign in to star problems"}
      className={`flex h-[34px] items-center gap-1.5 rounded-md px-2.5 text-xs font-medium ring-1 ring-inset transition-colors ${
        on
          ? "bg-amber-500/10 text-amber-300 ring-amber-500/40"
          : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:text-zinc-100"
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="m8 1.75 1.9 4.05 4.4.5-3.25 3.05.85 4.4L8 11.6l-3.9 2.15.85-4.4L1.7 6.3l4.4-.5z" />
      </svg>
      Starred
    </button>
  );
}
