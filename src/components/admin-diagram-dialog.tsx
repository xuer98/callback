"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "./theme";
import { illustrationPath } from "@/lib/illustrations";

// The admin editor's drawing dialog: an Excalidraw canvas over the page, a
// caption, and Insert — which exports the drawing as SVG, stores it with its
// scene (POST /api/illustrations) and hands the caller the URL to reference.
// Reopening a diagram loads its scene by id. Excalidraw is loaded
// client-side only and code-split, like the whiteboard, so the console's
// other pages never download it.

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-zinc-900/40" />
    ),
  },
);

// Structural minimums of the imperative API the dialog reads, so the
// callback stays assignable without importing the library's deep type paths
// (the whiteboard does the same for its onChange).
interface SceneElement {
  type?: string;
  fileId?: string | null;
}
interface DrawingApi {
  getSceneElements: () => readonly SceneElement[];
  getFiles: () => Record<string, unknown>;
}

type InitialData = React.ComponentProps<typeof Excalidraw>["initialData"];

export interface DiagramResult {
  url: string;
  caption: string;
}

export function DiagramDialog({
  editId,
  initialCaption,
  onInsert,
  onCancel,
}: {
  /** The diagram being reopened, or undefined for a fresh canvas. */
  editId?: string;
  initialCaption: string;
  onInsert: (result: DiagramResult) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const api = useRef<DrawingApi | null>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [scene, setScene] = useState<InitialData | "loading">(
    editId ? "loading" : null,
  );
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    fetch(`${illustrationPath("diagram", editId)}?scene`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Couldn't load the diagram's scene.");
        return (await res.json()) as { elements?: unknown[]; files?: unknown };
      })
      .then((saved) => {
        if (cancelled) return;
        setScene({
          elements: saved.elements ?? [],
          files: saved.files ?? undefined,
          scrollToContent: true,
        } as InitialData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setScene(null);
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't load it.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const insert = async () => {
    const drawing = api.current;
    if (!drawing || status.kind === "busy") return;
    const elements = drawing.getSceneElements();
    if (elements.length === 0) {
      setStatus({ kind: "error", message: "Draw something first." });
      return;
    }
    setStatus({ kind: "busy" });
    try {
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      // Only the files live image elements still point at; the API keeps
      // every file ever pasted, deleted elements' included.
      const used = new Set(
        elements.flatMap((el) =>
          el.type === "image" && el.fileId ? [el.fileId] : [],
        ),
      );
      const files = Object.fromEntries(
        Object.entries(drawing.getFiles()).filter(([id]) => used.has(id)),
      );
      // Dark strokes on a transparent background: the canonical light-mode
      // drawing, which the page inverts in dark mode.
      const svg = await exportToSvg({
        elements,
        files,
        appState: {
          exportBackground: false,
          exportWithDarkMode: false,
          exportEmbedScene: false,
        },
        exportPadding: 16,
      } as Parameters<typeof exportToSvg>[0]);
      const markup = new XMLSerializer().serializeToString(svg);

      const form = new FormData();
      form.set("kind", "diagram");
      form.set(
        "file",
        new Blob([markup], { type: "image/svg+xml" }),
        "diagram.svg",
      );
      form.set("scene", JSON.stringify({ elements, files }));
      const res = await fetch("/api/illustrations", {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.url) {
        throw new Error(body?.error ?? `Upload failed (${res.status}).`);
      }
      onInsert({ url: body.url, caption: caption.trim() });
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Export failed.",
      });
    }
  };

  const title = editId ? "Edit diagram" : "Insert diagram";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 p-3 sm:p-5"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption, shown under the diagram"
            aria-label="Caption"
            className="min-w-0 flex-1 rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-200 ring-1 ring-inset ring-zinc-800 focus:outline-none focus:ring-indigo-500"
          />
          {status.kind === "error" && (
            <span className="text-xs text-red-400">{status.message}</span>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void insert()}
            disabled={status.kind === "busy" || scene === "loading"}
            className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-indigo-500"
          >
            {status.kind === "busy"
              ? "Inserting…"
              : editId
                ? "Replace diagram"
                : "Insert diagram"}
          </button>
        </div>
        <div className="min-h-0 flex-1">
          {scene === "loading" ? (
            <div className="h-full w-full animate-pulse bg-zinc-900/40" />
          ) : (
            <Excalidraw
              theme={theme}
              initialData={scene}
              excalidrawAPI={(instance) => {
                api.current = instance;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
