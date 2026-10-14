"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface Option {
  value: string;
  label: string;
}

/**
 * The value control of a filter row: a button naming the picks, opening a
 * list of checkboxes with a search box when the list is long. It closes on
 * a click outside, when focus moves on, and on Escape — marked handled, so
 * the panel around it (which listens on the document, where React's own
 * listeners also live and a stopped event still arrives) stays open.
 */
export function FilterSelect({
  label,
  placeholder,
  options,
  values,
  onChange,
  searchable = false,
  className = "",
}: {
  label: string;
  placeholder: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(needle) ||
          option.value.toLowerCase().includes(needle),
      )
    : options;
  const picked = options.filter((option) => values.includes(option.value));
  const toggle = (value: string) =>
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    );

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open && !event.defaultPrevented) {
          event.preventDefault();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !rootRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((shown) => !shown)}
        className="flex w-full items-center gap-2 rounded-md bg-zinc-900 py-1.5 pl-2.5 pr-2 text-left text-xs ring-1 ring-inset ring-zinc-800 transition-colors hover:ring-zinc-700 focus:outline-none focus:ring-indigo-500"
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            picked.length > 0 ? "text-zinc-200" : "text-zinc-500"
          }`}
        >
          {picked.length > 0
            ? picked.map((option) => option.label).join(", ")
            : placeholder}
        </span>
        {picked.length > 1 && (
          <span className="rounded-full bg-zinc-800 px-1.5 text-[10px] leading-4 text-zinc-400">
            {picked.length}
          </span>
        )}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0 text-zinc-500"
        >
          <path
            d="M3 4.5 6 8l3-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          className="absolute left-0 top-full z-40 mt-1 w-full min-w-56 rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 shadow-xl shadow-black/50"
        >
          {searchable && (
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              aria-label={`Search ${label.toLowerCase()}`}
              autoComplete="off"
              spellCheck={false}
              className="mb-1 w-full rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-600 focus:outline-none focus:ring-indigo-500"
            />
          )}
          <ul
            role="group"
            aria-label={label}
            className="max-h-56 overflow-y-auto overscroll-contain"
          >
            {shown.length === 0 ? (
              <li className="px-2 py-1.5 text-xs text-zinc-500">No matches</li>
            ) : (
              shown.map((option) => (
                <li key={option.value}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
                    <input
                      type="checkbox"
                      checked={values.includes(option.value)}
                      onChange={() => toggle(option.value)}
                      className="h-3.5 w-3.5 accent-indigo-500"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
          {picked.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
