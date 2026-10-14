"use client";

import type { RefObject } from "react";

// The two buttons at the head of the filter toolbar: the funnel that opens
// the panel, badged with how much is active, and the Starred toggle. The
// panel component owns the state and hands both their handlers.

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
      className={`relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors ${
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
