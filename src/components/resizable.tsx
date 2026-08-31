"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

// Pane chrome: a two-pane split with a draggable divider, plus the tab
// button both panes use for their headers.
//
// Below the `lg` breakpoint the panes simply stack and the divider
// disappears — dragging a 375px-wide column into two is worse than
// scrolling it.
//
// The split is applied entirely through CSS: the dragged fraction rides in
// a custom property and only an `lg:` flex-basis class consumes it, in the
// same media query that tiles the panes. Sizing never mirrors the viewport
// in JS, so a window resize — including across the breakpoint — can't
// strand the layout half-switched behind a missed resize event.
//
// The stored fraction is applied only after mount (via a mounted gate
// rather than an effect) so the server and hydrating client agree on the
// default.

const subscribeNoop = () => () => {};

function readStoredFraction(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function SplitPane({
  direction,
  storageKey,
  initial,
  min = 0.2,
  max = 0.8,
  first,
  second,
  className = "",
}: {
  direction: "horizontal" | "vertical";
  storageKey: string;
  /** Fraction of the container given to the first pane, 0–1. */
  initial: number;
  min?: number;
  max?: number;
  first: React.ReactNode;
  second: React.ReactNode;
  className?: string;
}) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fraction, setFraction] = useState<number | null>(null);

  // Clamped on the way in too: a stale or hand-edited stored value must not
  // be able to collapse a pane.
  const effective = Math.min(
    max,
    Math.max(
      min,
      fraction ?? (mounted ? readStoredFraction(storageKey) : null) ?? initial,
    ),
  );
  const horizontal = direction === "horizontal";

  const commit = useCallback(
    (next: number) => {
      const clamped = Math.min(max, Math.max(min, next));
      setFraction(clamped);
      try {
        localStorage.setItem(storageKey, String(clamped));
      } catch {
        // Preference only — dragging still works without persistence.
      }
    },
    [max, min, storageKey],
  );

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    commit(
      horizontal
        ? (event.clientX - rect.left) / rect.width
        : (event.clientY - rect.top) / rect.height,
    );
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    if (event.key !== back && event.key !== forward) return;
    event.preventDefault();
    commit(effective + (event.key === back ? -0.02 : 0.02));
  };

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 flex-col gap-4 lg:gap-0 ${
        horizontal ? "lg:flex-row" : "lg:flex-col"
      } ${className}`}
    >
      {/* flex-basis resolves along the container's main axis, so the same
          class sizes the pane's width in a horizontal split and its height
          in a vertical one — the direction classes above pick which. */}
      <div
        className="flex min-h-0 min-w-0 flex-col lg:shrink-0 lg:grow-0 lg:basis-[var(--split)]"
        style={{ "--split": `${effective * 100}%` } as React.CSSProperties}
      >
        {first}
      </div>

      <div
        role="separator"
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-label="Resize panes"
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
        }}
        onDoubleClick={() => commit(initial)}
        onKeyDown={onKeyDown}
        className={`group hidden shrink-0 touch-none items-center justify-center lg:flex ${
          horizontal ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize"
        } focus:outline-none`}
      >
        <span
          className={`rounded-full transition-colors ${
            horizontal ? "h-10 w-[3px]" : "h-[3px] w-10"
          } ${
            dragging
              ? "bg-indigo-500"
              : "bg-zinc-800 group-hover:bg-zinc-600 group-focus:bg-indigo-500"
          }`}
        />
      </div>

      {/* An overlay during the drag keeps the pointer from being stolen by
          the CodeMirror surface or by text selection. */}
      {dragging && <div className="fixed inset-0 z-50 cursor-grabbing" />}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{second}</div>
    </div>
  );
}

/** Header tab used by the description and console panes. */
export function PaneTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-xs transition-colors ${
        active
          ? "border-zinc-300 text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
