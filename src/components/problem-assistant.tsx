"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "./markdown";
import { useProgress } from "./progress";
import { boardTextLabels } from "./whiteboard";
import {
  clearAssistantChat,
  listAssistantChat,
  type AssistantMessage,
} from "@/lib/assistant-actions";
import {
  LANGUAGE_LABELS,
  uiSlot,
  uiTemplates,
  type Language,
  type UiFramework,
  type UiWorkspace,
} from "@/lib/types";
import { uiEditableFiles } from "@/lib/ui-tests";
import { readStored, storageKeyFor } from "@/lib/workspace-sync";

// The study assistant on a problem page: questions about the problem, hints
// and reviews go to /api/problems/[slug]/assistant with the user's current
// work — the editor's code, the UI workspace's drafted files, or the design
// write-up and diagram labels, read from the same localStorage the
// workspaces keep — and the reply streams into the thread. The thread is
// stored per account; this component only mirrors it. Quick commands are
// ordinary messages, so they show in the thread like anything typed.

/** Which workspace the problem has, which decides the commands and the work sent. */
export type AssistantKind = "code" | "ui" | "design" | "quiz";

const MAX_MESSAGE_CHARS = 4_000;
/** Mirror the route's caps. */
const MAX_WORK_CHARS = 20_000;
const MAX_DIAGRAM_TEXT_CHARS = 8_000;

interface QuickCommand {
  label: string;
  message: string;
}

const QUICK_COMMANDS: Record<AssistantKind, QuickCommand[]> = {
  code: [
    {
      label: "Explain the problem",
      message:
        "Explain this problem in your own words: what it asks, the constraints that matter, and one worked example.",
    },
    {
      label: "Give me a hint",
      message:
        "Give me one hint toward the approach, without revealing the solution.",
    },
    {
      label: "Pseudocode outline",
      message: "Outline an approach in pseudocode, without full code.",
    },
    {
      label: "Review my code",
      message:
        "Review my current code against the examples and edge cases: what is wrong or missing, and its time and space complexity.",
    },
  ],
  ui: [
    {
      label: "Plan the build",
      message:
        "Break this interface into components and state, and suggest the order to build it in.",
    },
    {
      label: "Give me a hint",
      message:
        "Give me one hint toward the next thing to build, without writing it for me.",
    },
    {
      label: "Review my code",
      message:
        "Review my current files against the requirements: behaviour, edge cases, and accessibility.",
    },
    {
      label: "Accessibility checklist",
      message:
        "List what this interface needs to be accessible — keyboard, focus, roles, labels — and check my files against it.",
    },
  ],
  design: [
    {
      label: "Plan my approach",
      message:
        "Help me plan how to attack this design question: what to clarify, what to estimate, and what to draw first.",
    },
    {
      label: "Give me a hint",
      message:
        "Give me one hint about what my design should address next, without laying it out for me.",
    },
    {
      label: "Review my write-up",
      message:
        "Review my current write-up and diagram labels: what is solid, and what an interviewer would probe next.",
    },
  ],
  quiz: [
    {
      label: "What are they looking for?",
      message:
        "What is the interviewer really assessing with this question, and what separates a strong answer from an average one?",
    },
    {
      label: "Structure my answer",
      message:
        "Give me a structure for a strong answer, with what each part should cover.",
    },
    {
      label: "Give me a hint",
      message:
        "Give me one hint toward a good answer, without giving the answer itself.",
    },
  ],
};

interface WorkItem {
  name: string;
  language?: string;
  content: string;
}

const FENCES: Record<string, string> = {
  jsx: "jsx",
  tsx: "tsx",
  js: "javascript",
  ts: "typescript",
  css: "css",
  html: "html",
};

function fenceFor(fileName: string): string {
  return FENCES[fileName.slice(fileName.lastIndexOf(".") + 1)] ?? "";
}

/**
 * The user's current work, from the storage the workspace of this kind
 * keeps it in. Untouched starters are not stored, so they are not sent:
 * the route tells the model the starter is untouched instead.
 */
function gatherWork(
  kind: AssistantKind,
  slug: string,
  languages: Language[],
  ui: UiWorkspace | undefined,
): WorkItem[] {
  if (kind === "code") {
    const preferred = readStored("callback:lang") as Language | null;
    const language =
      preferred && languages.includes(preferred) ? preferred : "javascript";
    const code = readStored(storageKeyFor(slug, language));
    return code === null
      ? []
      : [
          {
            name: `Current code (${LANGUAGE_LABELS[language]})`,
            language,
            content: code.slice(0, MAX_WORK_CHARS),
          },
        ];
  }
  if (kind === "ui" && ui) {
    const templates = uiTemplates(ui);
    const stored = readStored(
      `callback:ui-framework:${slug}`,
    ) as UiFramework | null;
    const framework =
      stored && templates.some((t) => t.framework === stored)
        ? stored
        : ui.framework;
    const template =
      templates.find((t) => t.framework === framework) ?? templates[0];
    return uiEditableFiles(template).flatMap((file) => {
      const draft = readStored(
        storageKeyFor(slug, uiSlot(ui, template.framework, file.name)),
      );
      return draft === null
        ? []
        : [
            {
              name: file.name,
              language: fenceFor(file.name),
              content: draft.slice(0, MAX_WORK_CHARS),
            },
          ];
    });
  }
  if (kind === "design") {
    const writeup = readStored(storageKeyFor(slug, "design")) ?? "";
    const labels = boardTextLabels(slug, MAX_DIAGRAM_TEXT_CHARS);
    return [
      ...(writeup.trim() === ""
        ? []
        : [{ name: "Write-up", content: writeup.slice(0, MAX_WORK_CHARS) }]),
      ...(labels === ""
        ? []
        : [{ name: "Diagram text labels", content: labels }]),
    ];
  }
  return [];
}

type Message = Pick<AssistantMessage, "role" | "content"> & {
  id: number | string;
};

export function ProblemAssistant({
  slug,
  kind,
  languages = [],
  ui,
}: {
  slug: string;
  kind: AssistantKind;
  /** The languages a judged problem can be solved in. */
  languages?: Language[];
  /** The UI workspace, for the file slots its drafts are stored under. */
  ui?: UiWorkspace;
}) {
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
    void listAssistantChat(slug).then((rows) => {
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

  const send = async (raw: string) => {
    const text = raw.trim();
    if (busy || text === "") return;
    setError(null);
    setInput("");
    const pending: Message = {
      id: `pending-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, pending]);
    setStreamText("");
    // On any failure the message comes back into the box to retry.
    const rollBack = (message: string) => {
      setMessages((prev) => prev.filter((m) => m !== pending));
      setInput(text);
      setStreamText(null);
      setError(message);
    };
    try {
      const res = await fetch(
        `/api/problems/${encodeURIComponent(slug)}/assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            work: gatherWork(kind, slug, languages, ui),
          }),
        },
      );
      if (!res.ok || !res.body) {
        let message = "The assistant didn't answer — try again.";
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
          : "The assistant didn't answer — check your connection and try again.",
      );
    }
  };

  const newChat = async () => {
    if (busy) return;
    setMessages([]);
    setError(null);
    await clearAssistantChat(slug);
  };

  if (!signedIn) {
    return (
      <p className="p-5 text-sm leading-6 text-zinc-500">
        Sign in to use the assistant — ask what the problem means, get a hint
        when you&apos;re stuck, or have your current work reviewed.
        Conversations save to your account.
      </p>
    );
  }

  const empty = loaded && messages.length === 0 && !busy;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {empty && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-300">
              Ask anything about this problem.
            </p>
            <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
              The assistant reads the problem and your current work. Hints come
              one at a time, and the full solution only when you ask for it.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        {busy &&
          (streamText === "" ? (
            <p className="animate-pulse text-xs text-zinc-500">Thinking…</p>
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
          void send(input);
        }}
        className="shrink-0 border-t border-zinc-800 p-3"
      >
        {empty && (
          <div className="mb-2 flex flex-wrap gap-2">
            {QUICK_COMMANDS[kind].map((command) => (
              <button
                key={command.label}
                type="button"
                onClick={() => void send(command.message)}
                className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 ring-1 ring-inset ring-indigo-500/30 transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
              >
                {command.label}
              </button>
            ))}
          </div>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          placeholder="Ask about the problem, or for a hint…"
          aria-label="Message the assistant"
          className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[13px] leading-5 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void newChat()}
            disabled={busy || messages.length === 0}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300 disabled:invisible"
          >
            New chat
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
