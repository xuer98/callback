"use client";

import { useCallback, useEffect, useRef } from "react";
import { deleteSolution, saveSolution } from "./workspace-actions";

// Client half of account-backed persistence. localStorage stays the source
// of immediate truth (it works signed out and offline); when signed in,
// this module reconciles it with the server copy on load — newest wins —
// and pushes edits up on a debounce. Each stored value gets a `:savedAt`
// sidecar so local and remote timestamps are comparable; a value with no
// sidecar (saved before this feature) counts as oldest.

/**
 * A slot names one saved document for a problem: a language ("python") for
 * the judged editor, or a UI-workspace file ("ui:App.jsx"). The server keeps
 * them in the same solutions table, keyed by this string.
 */
export function storageKeyFor(slug: string, slot: string) {
  // The JavaScript key predates multi-language support — keep it stable so
  // existing saved solutions survive.
  return slot === "javascript"
    ? `callback:code:${slug}`
    : `callback:code:${slug}:${slot}`;
}

export function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable — the editor still works.
  }
}

export function removeStored(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

export function readSavedAt(key: string): number {
  const raw = readStored(`${key}:savedAt`);
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function writeSavedAt(key: string, ms: number) {
  writeStored(`${key}:savedAt`, String(ms));
}

interface RemoteSolution {
  code: string;
  updatedAt: number;
}

export interface RemoteWorkspace {
  signedIn: boolean;
  solutions: Record<string, RemoteSolution>;
  board: { scene: unknown; updatedAt: number } | null;
}

export async function fetchWorkspace(
  slug: string,
): Promise<RemoteWorkspace | null> {
  try {
    const res = await fetch(`/api/workspace/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as RemoteWorkspace;
  } catch {
    return null;
  }
}

const SAVE_DEBOUNCE_MS = 1200;

/**
 * Keeps a problem's saved solutions in sync with the account. On load (once
 * signed in) it reconciles every slot: newer remote copies land in
 * localStorage and are reported via onPulled so the editor can adopt the
 * open one; newer local copies are pushed up. After that, queueSave pushes
 * edits on a debounce, flushSave pushes one immediately, and dropSolution
 * mirrors Reset.
 */
export function useSolutionSync({
  slug,
  slots,
  enabled,
  onPulled,
}: {
  slug: string;
  slots: string[];
  enabled: boolean;
  onPulled: (slots: string[]) => void;
}) {
  // Latest-value refs so the reconcile effect depends only on
  // [enabled, slug] while its async continuation still sees current props.
  const slotsRef = useRef(slots);
  const onPulledRef = useRef(onPulled);
  useEffect(() => {
    slotsRef.current = slots;
    onPulledRef.current = onPulled;
  });

  /** Slots edited locally this session — never overwrite those. */
  const dirty = useRef<Set<string>>(new Set());
  const pending = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; code: string }>
  >(new Map());

  const push = useCallback(
    (slot: string, code: string) => {
      void saveSolution(slug, slot, code).then((ms) => {
        if (ms !== null) writeSavedAt(storageKeyFor(slug, slot), ms);
      });
    },
    [slug],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchWorkspace(slug).then((remote) => {
      if (cancelled || !remote?.signedIn) return;
      const pulled: string[] = [];
      for (const slot of slotsRef.current) {
        const key = storageKeyFor(slug, slot);
        const local = readStored(key);
        const localAt = readSavedAt(key);
        const theirs = remote.solutions[slot];
        if (dirty.current.has(slot)) continue;
        if (theirs && (local === null || theirs.updatedAt > localAt)) {
          if (local !== theirs.code) {
            writeStored(key, theirs.code);
            pulled.push(slot);
          }
          writeSavedAt(key, theirs.updatedAt);
        } else if (local !== null && (!theirs || localAt > theirs.updatedAt)) {
          if (local !== theirs?.code) push(slot, local);
        }
      }
      if (pulled.length > 0) onPulledRef.current(pulled);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, slug, push]);

  // Flush pending saves when leaving the page mid-debounce.
  useEffect(() => {
    const queue = pending.current;
    return () => {
      for (const [slot, entry] of queue) {
        clearTimeout(entry.timer);
        push(slot, entry.code);
      }
      queue.clear();
    };
  }, [slug, push]);

  const queueSave = (slot: string, code: string) => {
    dirty.current.add(slot);
    const existing = pending.current.get(slot);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
      pending.current.delete(slot);
      push(slot, code);
    }, SAVE_DEBOUNCE_MS);
    pending.current.set(slot, { timer, code });
  };

  /** Push a slot's code now, cancelling any save still on the debounce. */
  const flushSave = (slot: string, code: string) => {
    dirty.current.add(slot);
    const existing = pending.current.get(slot);
    if (existing) {
      clearTimeout(existing.timer);
      pending.current.delete(slot);
    }
    push(slot, code);
  };

  const dropSolution = (slot: string) => {
    dirty.current.add(slot);
    const existing = pending.current.get(slot);
    if (existing) {
      clearTimeout(existing.timer);
      pending.current.delete(slot);
    }
    void deleteSolution(slug, slot);
  };

  return { queueSave, flushSave, dropSolution };
}
