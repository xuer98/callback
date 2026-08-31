"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createProblem,
  saveProblem,
  type ProblemPayload,
} from "@/lib/admin-actions";
import { CATEGORIES, CATEGORY_LABELS, DIFFICULTIES } from "@/lib/types";

// The admin editor for one problem. Everything is plain controlled inputs;
// the server action does the real validation and reports one error at a
// time. Tests and the judge config are edited as JSON — the split keeps the
// common case (add a test case) approachable without a six-language IDE.

export function AdminProblemForm({
  mode,
  slug: existingSlug,
  initial,
}: {
  mode: "create" | "edit";
  slug?: string;
  initial: ProblemPayload;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(existingSlug ?? "");
  const [values, setValues] = useState<ProblemPayload>(initial);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const set = <K extends keyof ProblemPayload>(
    key: K,
    value: ProblemPayload[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setStatus({ kind: "idle" });
  };

  const setHint = (index: number, value: string) => {
    set(
      "hints",
      values.hints.map((hint, i) => (i === index ? value : hint)),
    );
  };

  const submit = async () => {
    if (status.kind === "saving") return;
    setStatus({ kind: "saving" });
    const result =
      mode === "create"
        ? await createProblem(slug.trim(), values)
        : await saveProblem(existingSlug, values);
    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    setStatus({ kind: "saved" });
    if (mode === "create") {
      router.push(`/admin/problems/${slug.trim()}`);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {mode === "create" && (
        <Field label="Slug" hint="lowercase-words-with-hyphens; becomes the URL and can't change later">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="design-rate-limiter"
            className={inputClass}
          />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title">
          <input
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Companies" hint="comma-separated slugs, e.g. pinterest, google">
          <input
            value={values.companies}
            onChange={(e) => set("companies", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Category">
          <select
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Difficulty">
          <select
            value={values.difficulty}
            onChange={(e) => set("difficulty", e.target.value)}
            className={inputClass}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Summary" hint="one-line teaser on list cards; inline markdown">
        <input
          value={values.summary}
          onChange={(e) => set("summary", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Prompt" hint="full problem statement, markdown">
        <textarea
          value={values.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          rows={14}
          className={textareaClass}
        />
      </Field>

      <Field label="Hints" hint="one markdown block each; empty ones are dropped">
        <div className="flex flex-col gap-2">
          {values.hints.map((hint, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={hint}
                onChange={(e) => setHint(i, e.target.value)}
                rows={2}
                className={textareaClass}
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "hints",
                    values.hints.filter((_, j) => j !== i),
                  )
                }
                className="self-start rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
                aria-label={`Remove hint ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("hints", [...values.hints, ""])}
            className="self-start rounded-md border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            Add hint
          </button>
        </div>
      </Field>

      <Field label="Solution" hint="markdown behind the Solution tab; empty = no solution yet">
        <textarea
          value={values.solution}
          onChange={(e) => set("solution", e.target.value)}
          rows={12}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Rubric"
        hint="system-design only — grading criteria for AI review, never shown to users"
      >
        <textarea
          value={values.rubric}
          onChange={(e) => set("rubric", e.target.value)}
          rows={6}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Tests"
        hint='JSON array: [{"name": "…", "input": [args…], "expected": …}, …]'
      >
        <textarea
          value={values.testsJson}
          onChange={(e) => set("testsJson", e.target.value)}
          rows={12}
          spellCheck={false}
          className={monoClass}
        />
      </Field>

      <Field
        label="Judge config"
        hint="JSON: starterCode, entry, optional driverCode and per-language {python, typescript, java, cpp, go}; leave both this and Tests empty for document/whiteboard problems"
      >
        <textarea
          value={values.judgeConfigJson}
          onChange={(e) => set("judgeConfigJson", e.target.value)}
          rows={12}
          spellCheck={false}
          className={monoClass}
        />
      </Field>

      <Field
        label="UI workspace"
        hint='frontend live-preview problems only — JSON {"framework": "react", "files": [{"name", "contents"}]}'
      >
        <textarea
          value={values.uiJson}
          onChange={(e) => set("uiJson", e.target.value)}
          rows={6}
          spellCheck={false}
          className={monoClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void submit()}
          disabled={status.kind === "saving"}
          className="rounded-md bg-indigo-500 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-indigo-500"
        >
          {status.kind === "saving"
            ? "Saving…"
            : mode === "create"
              ? "Create problem"
              : "Save changes"}
        </button>
        {status.kind === "saved" && (
          <span className="text-sm text-emerald-400">Saved.</span>
        )}
        {status.kind === "error" && (
          <span className="text-sm text-red-400">{status.message}</span>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-200 ring-1 ring-inset ring-zinc-800 focus:outline-none focus:ring-indigo-500";
const textareaClass = `${inputClass} leading-6 resize-y`;
const monoClass = `${textareaClass} font-mono text-[13px]`;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-300">
        {label}
        {hint && <span className="ml-2 font-normal text-zinc-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
