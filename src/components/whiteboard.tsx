"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { useProgress } from "./progress";
import { saveBoard } from "@/lib/workspace-actions";
import {
  fetchWorkspace,
  readSavedAt,
  readStored,
  writeSavedAt,
  writeStored,
} from "@/lib/workspace-sync";

// The whiteboard canvas for system-design problems: an Excalidraw scene
// persisted per problem — localStorage always, and the account when signed
// in (reconciled on load, newest wins, mirroring solution code). The pane
// chrome (tabs, save note, submit) lives in DesignWorkspace; this component
// is just the canvas and its persistence. Excalidraw touches window at
// module scope, so it is loaded client-side only — and code-split, so
// problem pages without a whiteboard never download it.
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-zinc-900/40" />
    ),
  },
);

const LOCAL_DEBOUNCE_MS = 400;
const REMOTE_DEBOUNCE_MS = 1500;

/** The localStorage key for a problem's board scene — shared with the
 * submit flow in DesignWorkspace, which exports the scene for review. */
export function boardStorageKey(slug: string) {
  return `callback:board:${slug}`;
}

function readLocalScene(key: string): unknown {
  const raw = readStored(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function elementsJson(scene: unknown): string {
  const elements = (scene as { elements?: unknown[] } | null)?.elements ?? [];
  return JSON.stringify(elements);
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

/** Excalidraw's own initialData prop type, via the dynamic wrapper. */
type InitialData = React.ComponentProps<typeof Excalidraw>["initialData"];

export function Whiteboard({ slug }: { slug: string }) {
  const storageKey = boardStorageKey(slug);
  const { signedIn } = useProgress();

  // The scene Excalidraw mounts with; adopting a newer server copy swaps it
  // and bumps the epoch to remount (Excalidraw is uncontrolled).
  const [initialData, setInitialData] = useState<InitialData>(() =>
    typeof window === "undefined"
      ? null
      : (readLocalScene(storageKey) as InitialData),
  );
  const [boardEpoch, setBoardEpoch] = useState(0);

  const localTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pending = useRef<string | null>(null);
  // Sketched since load? Baseline is the mounted scene's elements; scroll
  // and zoom changes don't count. A dirty board is never overwritten.
  const baseline = useRef<string>(elementsJson(initialData));
  const dirty = useRef(false);

  const pushRemote = useCallback(
    (payload: string) => {
      void saveBoard(slug, payload).then((ms) => {
        if (ms !== null) writeSavedAt(boardStorageKey(slug), ms);
      });
    },
    [slug],
  );

  // Reconcile with the account copy once signed in: newer remote scene is
  // adopted (unless sketched on meanwhile); newer local scene is pushed up.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void fetchWorkspace(slug).then((remote) => {
      if (cancelled || !remote?.signedIn) return;
      const key = boardStorageKey(slug);
      const local = readStored(key);
      const localAt = readSavedAt(key);
      const theirs = remote.board;
      if (theirs && theirs.updatedAt > localAt && !dirty.current) {
        const payload = JSON.stringify(theirs.scene);
        if (payload !== local) {
          writeStored(key, payload);
          baseline.current = elementsJson(theirs.scene);
          setInitialData(theirs.scene as InitialData);
          setBoardEpoch((epoch) => epoch + 1);
        }
        writeSavedAt(key, theirs.updatedAt);
      } else if (local && (!theirs || localAt > theirs.updatedAt)) {
        pushRemote(local);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, slug, pushRemote]);

  const handleChange = (
    elements: readonly SceneElement[],
    appState: SceneView,
    files: unknown,
  ) => {
    // Excalidraw keeps deleted elements as tombstones; don't persist them.
    const live = elements.filter((el) => !el.isDeleted);
    if (JSON.stringify(live) !== baseline.current) dirty.current = true;
    pending.current = JSON.stringify({
      elements: live,
      appState: {
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      },
      files,
    });
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      if (pending.current !== null) {
        writeStored(storageKey, pending.current);
        writeSavedAt(storageKey, Date.now());
      }
    }, LOCAL_DEBOUNCE_MS);
    if (signedIn && dirty.current) {
      clearTimeout(remoteTimer.current);
      remoteTimer.current = setTimeout(() => {
        if (pending.current !== null) pushRemote(pending.current);
      }, REMOTE_DEBOUNCE_MS);
    }
  };

  // Flush the last unsaved change when navigating away mid-debounce.
  useEffect(() => {
    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(remoteTimer.current);
      if (pending.current !== null) {
        writeStored(storageKey, pending.current);
        writeSavedAt(storageKey, Date.now());
        if (dirty.current) pushRemote(pending.current);
      }
    };
  }, [storageKey, pushRemote]);

  return (
    <div className="h-full w-full">
      <Excalidraw
        key={boardEpoch}
        theme="dark"
        initialData={initialData}
        onChange={handleChange}
      />
    </div>
  );
}
