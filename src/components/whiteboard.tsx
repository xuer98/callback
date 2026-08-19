"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import "@excalidraw/excalidraw/index.css";

// The whiteboard pane for system-design problems: an Excalidraw canvas with
// the sketch persisted per problem in localStorage, mirroring how solutions
// persist per problem/language. Excalidraw touches window at module scope,
// so it is loaded client-side only — and code-split, so problem pages
// without a whiteboard never download it.
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-zinc-900/40" />
    ),
  },
);

const SAVE_DEBOUNCE_MS = 400;

function storageKeyFor(slug: string) {
  return `callback:board:${slug}`;
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable — the board still works, unsaved.
  }
}

// Structural minimums of what the onChange handler reads; the real
// Excalidraw types are subtypes, so the handler stays assignable without
// importing the library's deep type paths.
interface SceneElement {
  isDeleted?: boolean;
}
interface SceneView {
  scrollX: number;
  scrollY: number;
  zoom: unknown;
}

export function Whiteboard({ slug }: { slug: string }) {
  const storageKey = storageKeyFor(slug);

  // Read once per mount; the page keys this component by slug. Server-side
  // this resolves to null, which only ever feeds the ssr:false child.
  const initialData = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<string | null>(null);

  const handleChange = (
    elements: readonly SceneElement[],
    appState: SceneView,
    files: unknown,
  ) => {
    // Excalidraw keeps deleted elements as tombstones; don't persist them.
    pending.current = JSON.stringify({
      elements: elements.filter((el) => !el.isDeleted),
      appState: {
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      },
      files,
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (pending.current !== null) writeStored(storageKey, pending.current);
    }, SAVE_DEBOUNCE_MS);
  };

  // Flush the last unsaved change when navigating away mid-debounce.
  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      if (pending.current !== null) writeStored(storageKey, pending.current);
    };
  }, [storageKey]);

  return (
    <section className="flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="font-mono text-xs text-zinc-600">
            ▦
          </span>
          <span className="text-xs font-medium text-zinc-300">Whiteboard</span>
        </div>
        <span className="text-xs text-zinc-600">
          sketches save in this browser
        </span>
      </header>
      {/* Positioned, not percentage-sized, for the same reason as the code
          editor: stacked on mobile the pane's height comes from flex. */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <Excalidraw
            theme="dark"
            initialData={initialData}
            onChange={handleChange}
          />
        </div>
      </div>
    </section>
  );
}
