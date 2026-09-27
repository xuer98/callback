"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "./markdown";
import { useProgress } from "./progress";
import { boardTextLabels } from "./whiteboard";
import {
  clearDesignChat,
  listDesignChat,
  type DesignChatMessage,
} from "@/lib/workspace-actions";
import { readStored, storageKeyFor } from "@/lib/workspace-sync";

// The interviewer chat on system-design problems: clarifying questions and
// requests for a nudge go to /api/problems/[slug]/chat with the current
// write-up and diagram labels, and the reply streams into the thread. The
// thread itself is stored per account; this component only mirrors it.

const MAX_MESSAGE_CHARS = 2_000;
/** Mirrors the route's caps. */
const MAX_WRITEUP_CHARS = 20_000;
const MAX_DIAGRAM_TEXT_CHARS = 8_000;

const STARTERS = [
  "What scale should I design for — users, traffic, data size?",
  "Which parts are in scope, and what can I leave out?",
  "I'm stuck — what should I be thinking about next?",
];

type Message = Pick<DesignChatMessage, "role" | "content"> & {
  id: number | string;
};

export function DesignChat({ slug }: { slug: string }) {
  const { signedIn } = useProgress();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  /** Non-null while a reply streams in ("" until the first token). */
  const [streamText, setStreamText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const busy = streamText !== null;

  // Signed out, the early return below hides the thread; signing back in
  // refetches it here, so nothing needs clearing in between.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void listDesignChat(slug).then((rows) => {
      if (cancelled) return;
      setMessages(rows);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, slug]);

  // Keep the newest turn in view as it streams.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, streamText]);

  const send = async () => {
    const text = input.trim();
    if (busy || text === "") return;
    setError(null);
    setInput("");
    const pending: Message = { id: `pending-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, pending]);
    setStreamText("");
    // On any failure the question comes back into the box to retry.
    const rollBack = (message: string) => {
      setMessages((prev) => prev.filter((m) => m !== pending));
      setInput(text);
      setStreamText(null);
      setError(message);
    };
    try {
      const res = await fetch(`/api/problems/${encodeURIComponent(slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          writeup: (readStored(storageKeyFor(slug, "design")) ?? "").slice(
            0,
            MAX_WRITEUP_CHARS,
          ),
          diagramText: boardTextLabels(slug, MAX_DIAGRAM_TEXT_CHARS),
        }),
      });
      if (!res.ok || !res.body) {
        let message = "The interviewer didn't answer — try again.";
        try {
          message = ((await res.json()) as { error?: string }).error ?? message;
        } catch {
          // Non-JSON error body; keep the fallback message.
        }
        rollBack(message);
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
      setMessages((prev) => [
        ...prev,
        { id: `reply-${Date.now()}`, role: "assistant", content: full },
      ]);
      setStreamText(null);
    } catch (err) {
      rollBack(
        err instanceof Error && err.message !== ""
          ? err.message
          : "The interviewer didn't answer — check your connection and try again.",
      );
    }
  };

  const startOver = async () => {
    if (busy) return;
    setMessages([]);
    setError(null);
    await clearDesignChat(slug);
  };

  if (!signedIn) {
    return (
      <p className="p-5 text-sm leading-6 text-zinc-500">
        Sign in to talk to the interviewer — ask what&apos;s in scope, what
        scale to design for, or for a nudge when you&apos;re stuck.
        Conversations save to your account.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loaded && messages.length === 0 && !busy && (
          <div>
            <p className="text-sm leading-6 text-zinc-500">
              Treat this like the interviewer in the room: ask what&apos;s in
              scope, what scale to design for, or for a hint when you&apos;re
              stuck. They read your write-up and diagram labels, nudge rather
              than solve, and don&apos;t grade you here — that&apos;s Submit
              for review.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setInput(starter)}
                  className="rounded-full bg-zinc-900 px-3 py-1 text-left text-xs text-zinc-300 ring-1 ring-inset ring-zinc-800 transition-colors hover:text-white"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        {busy &&
          (streamText === "" ? (
            <p className="animate-pulse text-xs text-zinc-500">
              The interviewer is thinking…
            </p>
          ) : (
            <Bubble
              message={{ id: "stream", role: "assistant", content: streamText }}
            />
          ))}
        {error && (
          <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="shrink-0 border-t border-zinc-800 p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Ask a clarifying question, or for a hint…"
          className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[13px] leading-5 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void startOver()}
            disabled={busy || messages.length === 0}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:invisible"
          >
            Start over
          </button>
          <span className="hidden text-[11px] text-zinc-600 sm:inline">
            Enter to send · Shift+Enter for a new line
          </span>
          <button
            type="submit"
            disabled={busy || input.trim() === ""}
            className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-indigo-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-indigo-500/15 px-3 py-2 text-sm leading-6 text-zinc-200 ring-1 ring-inset ring-indigo-500/30">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-3 flex">
      <div className="max-w-[92%] rounded-lg bg-zinc-900/60 px-3 py-2 ring-1 ring-inset ring-zinc-800">
        <RichText
          text={message.content}
          className="text-sm leading-6 text-zinc-300"
        />
      </div>
    </div>
  );
}
