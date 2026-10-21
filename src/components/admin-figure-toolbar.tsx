"use client";

import { useRef, useState, type RefObject } from "react";
import { DiagramDialog } from "./admin-diagram-dialog";
import {
  diagramReferences,
  MAX_ILLUSTRATION_BYTES,
  type DiagramReference,
} from "@/lib/illustrations";

// The row under a markdown field in the admin editor: Insert diagram opens
// the drawing dialog, Insert image uploads a picture, and one chip per
// diagram the field already shows reopens it. Each puts a markdown image on
// a line of its own at the caret — a figure, see markdown.tsx — or, when
// re-editing, swaps the reference in place. The field stays a plain
// textarea the form owns; the toolbar only needs its ref for the caret.

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

/** `![caption](url)`, with the brackets the caption can't hold taken out. */
function reference(caption: string, url: string): string {
  return `![${caption.replace(/[[\]]/g, "")}](${url})`;
}

export function FigureToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
}) {
  const [dialog, setDialog] = useState<{
    editing?: DiagramReference;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const insertAtCaret = (snippet: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    // Blank lines around it make the image a paragraph of its own.
    const lead =
      before === "" || before.endsWith("\n\n")
        ? ""
        : before.endsWith("\n")
          ? "\n"
          : "\n\n";
    const trail =
      after === "" || after.startsWith("\n\n")
        ? ""
        : after.startsWith("\n")
          ? "\n"
          : "\n\n";
    const head = before + lead + snippet;
    onChange(head + trail + after);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(head.length, head.length);
    });
  };

  const upload = async (file: File) => {
    if (file.size > MAX_ILLUSTRATION_BYTES) {
      setError("Images are limited to 2 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("kind", "illustration");
      form.set("file", file);
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
      insertAtCaret(reference(file.name.replace(/\.[^.]+$/, ""), body.url));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const diagrams = diagramReferences(value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToolButton
        onClick={() => {
          setError(null);
          setDialog({});
        }}
      >
        Insert diagram
      </ToolButton>
      <ToolButton
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Insert image"}
      </ToolButton>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {diagrams.map((diagram, i) => (
        <ToolButton
          key={diagram.ref}
          onClick={() => {
            setError(null);
            setDialog({ editing: diagram });
          }}
        >
          <span className="text-zinc-600">Edit</span>{" "}
          <span className="inline-block max-w-[14rem] truncate align-bottom">
            {diagram.alt || `diagram ${i + 1}`}
          </span>
        </ToolButton>
      ))}
      {error && <span className="text-xs text-red-400">{error}</span>}
      {dialog && (
        <DiagramDialog
          editId={dialog.editing?.id}
          initialCaption={dialog.editing?.alt ?? ""}
          onCancel={() => setDialog(null)}
          onInsert={({ url, caption }) => {
            const next = reference(caption, url);
            if (dialog.editing) {
              onChange(value.replaceAll(dialog.editing.ref, next));
            } else {
              insertAtCaret(next);
            }
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function ToolButton({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-default disabled:opacity-60"
    >
      {children}
    </button>
  );
}
