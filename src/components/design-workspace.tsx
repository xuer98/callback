"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { RichText } from "./markdown";
import { useProgress } from "./progress";
import { boardStorageKey, Whiteboard } from "./whiteboard";
import {
  listDesignFeedback,
  type DesignFeedback,
} from "@/lib/workspace-actions";
import {
  readStored,
  storageKeyFor,
  useSolutionSync,
  writeSavedAt,
  writeStored,
} from "@/lib/workspace-sync";

// The workspace for system-design problems: the whiteboard canvas, a written
// explanation, and AI review. Submit exports the board as a PNG, sends it
// with the write-up to /api/problems/[slug]/grade, and streams the returned
// markdown review into the Feedback tab. The write-up persists through the
// same slot machinery as code ("design" slot); the board persists itself.

const WRITEUP_SLOT = "design";
/** Mirrors the route's cap (~3 MB decoded PNG). */
const MAX_IMAGE_BASE64_CHARS = 4_200_000;
const MAX_DIAGRAM_TEXT_CHARS = 8_000;

type Tab = "board" | "writeup" | "feedback";

const subscribeNoop = () => () => {};

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Export the saved board scene as a base64 PNG plus its text labels. Returns
 * a null image for an empty board; throws when even a downscaled export is
 * over the request cap (huge pasted images).
 */
async function exportBoard(
  slug: string,
): Promise<{ image: string | null; diagramText: string }> {
  let scene: { elements?: unknown[]; files?: unknown } | null = null;
  try {
    const raw = readStored(boardStorageKey(slug));
    scene = raw ? JSON.parse(raw) : null;
  } catch {
    scene = null;
  }
  const elements = Array.isArray(scene?.elements) ? scene.elements : [];
  const live = elements.filter(
    (el) => !(el as { isDeleted?: boolean }).isDeleted,
  );
  if (live.length === 0) return { image: null, diagramText: "" };

  const diagramText = live
    .map((el) => (el as { text?: unknown }).text)
    .filter((t): t is string => typeof t === "string" && t.trim() !== "")
    .map((t) => t.trim())
    .join("\n")
    .slice(0, MAX_DIAGRAM_TEXT_CHARS);

  const { exportToBlob } = await import("@excalidraw/excalidraw");
  for (const maxWidthOrHeight of [1600, 1000]) {
    const blob = await exportToBlob({
      elements: live,
      files: scene?.files ?? null,
      appState: {
        exportBackground: true,
        viewBackgroundColor: "#ffffff",
        exportWithDarkMode: false,
      },
      mimeType: "image/png",
      maxWidthOrHeight,
    } as Parameters<typeof exportToBlob>[0]);
    const image = await blobToBase64(blob);
    if (image.length <= MAX_IMAGE_BASE64_CHARS) return { image, diagramText };
  }
  throw new Error(
    "The diagram export is too large to submit — trim pasted images and try again.",
  );
}

export function DesignWorkspace({ slug }: { slug: string }) {
  // Render a skeleton until mounted: initial state reads localStorage, so
  // the server skeleton and the client's hydration render must agree.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const { signedIn } = useProgress();
  const writeupKey = storageKeyFor(slug, WRITEUP_SLOT);

  const [tab, setTab] = useState<Tab>("board");
  // The write-up is authored as markdown; Preview renders it with the same
  // RichText used everywhere else, so what you see is what a reviewer sees.
  const [writeupView, setWriteupView] = useState<"write" | "preview">("write");
  const [writeup, setWriteup] = useState(
    () => readStored(storageKeyFor(slug, WRITEUP_SLOT)) ?? "",
  );
  const [attempts, setAttempts] = useState<DesignFeedback[]>([]);
  /** Non-null while a review streams in ("" until the first token). */
  const [streamText, setStreamText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const grading = streamText !== null;

  const { queueSave, flushSave } = useSolutionSync({
    slug,
    slots: [WRITEUP_SLOT],
    enabled: mounted,
    onPulled: () => setWriteup(readStored(writeupKey) ?? ""),
  });

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void listDesignFeedback(slug).then((rows) => {
      if (!cancelled) setAttempts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, slug]);

  const onWriteupChange = (value: string) => {
    setWriteup(value);
    writeStored(writeupKey, value);
    writeSavedAt(writeupKey, Date.now());
    queueSave(WRITEUP_SLOT, value);
  };

  const submit = async () => {
    if (grading) return;
    setError(null);
    if (!signedIn) {
      setTab("feedback");
      setError("Sign in to submit for review — attempts are saved to your account.");
      return;
    }
    flushSave(WRITEUP_SLOT, writeup);
    setTab("feedback");
    setStreamText("");
    try {
      const board = await exportBoard(slug);
      if (board.image === null && writeup.trim() === "") {
        setStreamText(null);
        setError(
          "Nothing to review yet — sketch the design or explain it on the Write-up tab first.",
        );
        return;
      }
      const res = await fetch(
        `/api/problems/${encodeURIComponent(slug)}/grade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            writeup,
            image: board.image,
            diagramText: board.diagramText,
          }),
        },
      );
      if (!res.ok || !res.body) {
        let message = "Review failed — try again.";
        try {
          message =
            ((await res.json()) as { error?: string }).error ?? message;
        } catch {
          // Non-JSON error body; keep the fallback message.
        }
        setStreamText(null);
        setError(message);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }
      full += decoder.decode();
      setAttempts((prev) => [
        { id: Date.now(), feedback: full, createdAt: Date.now() },
        ...prev,
      ]);
      setStreamText(null);
    } catch (err) {
      setStreamText(null);
      setError(
        err instanceof Error && err.message !== ""
          ? err.message
          : "Review failed — check your connection and try again.",
      );
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[480px] flex-1 rounded-lg border border-zinc-800 bg-zinc-900/40 lg:min-h-0" />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "board", label: "Whiteboard" },
    { id: "writeup", label: "Write-up" },
    {
      id: "feedback",
      label: attempts.length > 0 ? `Feedback (${attempts.length})` : "Feedback",
    },
  ];

  return (
    <section className="flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 lg:min-h-0">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`-mb-px shrink-0 border-b-2 px-2.5 py-2 text-xs transition-colors ${
                tab === id
                  ? "border-zinc-300 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 py-1">
          <span className="hidden text-xs text-zinc-600 sm:inline">
            {signedIn ? "saves to your account" : "saves in this browser"}
          </span>
          <button
            onClick={() => void submit()}
            disabled={grading}
            className="rounded-md bg-indigo-500 px-4 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-indigo-500"
          >
            {grading ? "Reviewing…" : "Submit for review"}
          </button>
        </div>
      </header>
      {/* All three panes stay mounted — the board keeps its canvas state and
          a streaming review keeps rendering while another tab is open. */}
      <div className="relative min-h-0 flex-1">
        <Pane active={tab === "board"}>
          <Whiteboard slug={slug} />
        </Pane>
        <Pane active={tab === "writeup"}>
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 px-3 py-1.5">
              <div className="flex gap-1.5">
                <WriteupModeButton
                  active={writeupView === "write"}
                  onClick={() => setWriteupView("write")}
                >
                  Write
                </WriteupModeButton>
                <WriteupModeButton
                  active={writeupView === "preview"}
                  onClick={() => setWriteupView("preview")}
                >
                  Preview
                </WriteupModeButton>
              </div>
              <span className="text-[11px] text-zinc-600">
                Markdown — headings, lists, tables, code blocks
              </span>
            </div>
            {writeupView === "write" ? (
              <textarea
                value={writeup}
                onChange={(e) => onWriteupChange(e.target.value)}
                spellCheck={false}
                placeholder={
                  "Explain the design like you would to your interviewer: requirements and scope, scale estimates, API and data model, how the pieces talk, and the tradeoffs you're making.\n\nMarkdown is supported — structure it like a real design doc.\n\nThe review grades this together with the whiteboard."
                }
                className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 text-[13px] leading-6 text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {writeup.trim() === "" ? (
                  <p className="text-sm leading-6 text-zinc-600">
                    Nothing to preview yet — write something first.
                  </p>
                ) : (
                  <RichText
                    text={writeup}
                    className="text-sm leading-6 text-zinc-300"
                  />
                )}
              </div>
            )}
          </div>
        </Pane>
        <Pane active={tab === "feedback"}>
          <div className="h-full overflow-y-auto p-4">
            {error && (
              <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            {grading && (
              <div className="mb-6">
                <p className="animate-pulse text-xs text-zinc-500">
                  {streamText === ""
                    ? "The reviewer is reading your design — first feedback usually lands within a minute…"
                    : "Reviewing…"}
                </p>
                {streamText !== "" && (
                  <RichText
                    text={streamText}
                    className="mt-3 text-sm leading-6 text-zinc-300"
                  />
                )}
              </div>
            )}
            {!grading && !error && attempts.length === 0 && (
              <p className="text-sm leading-6 text-zinc-500">
                Sketch the architecture, explain your approach on the Write-up
                tab, then submit — a senior-engineer-style AI review of your
                design lands here, graded against this problem&apos;s rubric.
                {!signedIn && " Sign in first; attempts save to your account."}
              </p>
            )}
            {attempts.map((attempt, i) => (
              <details
                key={attempt.id}
                open={i === 0 && !grading}
                className="group mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <summary className="cursor-pointer select-none text-sm text-zinc-400 group-open:text-zinc-200">
                  Review · {new Date(attempt.createdAt).toLocaleString()}
                </summary>
                <RichText
                  text={attempt.feedback}
                  className="mt-3 text-sm leading-6 text-zinc-300"
                />
              </details>
            ))}
          </div>
        </Pane>
      </div>
    </section>
  );
}

function WriteupModeButton({
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
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function Pane({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 ${active ? "" : "invisible pointer-events-none"}`}
    >
      {children}
    </div>
  );
}
