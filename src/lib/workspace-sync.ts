"use client";

import { useCallback, useEffect, useRef } from "react";
import { deleteSolution, saveSolution } from "./workspace-actions";
import type { Language } from "./types";

// Client half of account-backed persistence. localStorage stays the source
// of immediate truth (it works signed out and offline); when signed in,
// this module reconciles it with the server copy on load — newest wins —
// and pushes edits up on a debounce. Each stored value gets a `:savedAt`
// sidecar so local and remote timestamps are comparable; a value with no
// sidecar (saved before this feature) counts as oldest.

export function storageKeyFor(slug: string, language: Language) {
  // The JavaScript key predates multi-language support — keep it stable so
  // existing saved solutions survive.
  return language === "javascript"
    ? `callback:code:${slug}`
    : `callback:code:${slug}:${language}`;
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
 * signed in) it reconciles every language: newer remote copies land in
 * localStorage and are reported via onPulled so the editor can adopt the
 * open one; newer local copies are pushed up. After that, queueSave pushes
 * edits on a debounce and dropSolution mirrors Reset.
 */
export function useSolutionSync({
  slug,
  languages,
  enabled,
  onPulled,
}: {
  slug: string;
  languages: Language[];
  enabled: boolean;
  onPulled: (languages: Language[]) => void;
}) {
  // Latest-value refs so the reconcile effect depends only on
  // [enabled, slug] while its async continuation still sees current props.
  const languagesRef = useRef(languages);
  const onPulledRef = useRef(onPulled);
  useEffect(() => {
    languagesRef.current = languages;
    onPulledRef.current = onPulled;
  });

  /** Languages edited locally this session — never overwrite those. */
  const dirty = useRef<Set<Language>>(new Set());
  const pending = useRef<
    Map<Language, { timer: ReturnType<typeof setTimeout>; code: string }>
  >(new Map());

  const push = useCallback(
    (language: Language, code: string) => {
      void saveSolution(slug, language, code).then((ms) => {
        if (ms !== null) writeSavedAt(storageKeyFor(slug, language), ms);
      });
    },
    [slug],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchWorkspace(slug).then((remote) => {
      if (cancelled || !remote?.signedIn) return;
      const pulled: Language[] = [];
      for (const language of languagesRef.current) {
        const key = storageKeyFor(slug, language);
        const local = readStored(key);
        const localAt = readSavedAt(key);
        const theirs = remote.solutions[language];
        if (dirty.current.has(language)) continue;
        if (theirs && (local === null || theirs.updatedAt > localAt)) {
          if (local !== theirs.code) {
            writeStored(key, theirs.code);
            pulled.push(language);
          }
          writeSavedAt(key, theirs.updatedAt);
        } else if (local !== null && (!theirs || localAt > theirs.updatedAt)) {
          if (local !== theirs?.code) push(language, local);
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
      for (const [language, entry] of queue) {
        clearTimeout(entry.timer);
        push(language, entry.code);
      }
      queue.clear();
    };
  }, [slug, push]);

  const queueSave = (language: Language, code: string) => {
    dirty.current.add(language);
    const existing = pending.current.get(language);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
      pending.current.delete(language);
      push(language, code);
    }, SAVE_DEBOUNCE_MS);
    pending.current.set(language, { timer, code });
  };

  const dropSolution = (language: Language) => {
    dirty.current.add(language);
    const existing = pending.current.get(language);
    if (existing) {
      clearTimeout(existing.timer);
      pending.current.delete(language);
    }
    void deleteSolution(slug, language);
  };

  return { queueSave, dropSolution };
}
