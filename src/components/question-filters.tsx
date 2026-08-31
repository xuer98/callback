"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  DIFFICULTIES,
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  type Timeframe,
} from "@/lib/types";

interface Option {
  value: string;
  label: string;
}

/**
 * The dropdown query controls for /problems — company, topic, time range,
 * and difficulty. The category filter is the chip row the page renders above
 * this component; `selected.category` is still passed so Clear knows a
 * filtered view is active. Each change rewrites the URL, so a filtered view
 * is linkable and the server does the actual filtering.
 */
export function QuestionFilters({
  companies,
  topics,
  selected,
}: {
  companies: { slug: string; name: string }[];
  topics: string[];
  selected: {
    category: string;
    company: string;
    topic: string;
    difficulty: string;
    timeframe: Timeframe;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Any filter change invalidates the current page number.
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.push(query ? `/problems?${query}` : "/problems"));
  };

  const filtered =
    selected.category || selected.company || selected.topic || selected.difficulty
      ? true
      : false;

  return (
    <div
      className={`mt-4 flex flex-wrap items-end gap-3 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <Select
        label="Company"
        value={selected.company}
        placeholder="All companies"
        options={companies.map((c) => ({ value: c.slug, label: c.name }))}
        onChange={(value) => apply("company", value)}
      />
      <Select
        label="Topic"
        value={selected.topic}
        placeholder="All topics"
        options={topics.map((t) => ({ value: t, label: t }))}
        onChange={(value) => apply("topic", value)}
      />
      <Select
        label="Time range"
        value={selected.timeframe}
        options={TIMEFRAMES.map((t) => ({
          value: t,
          label: TIMEFRAME_LABELS[t],
        }))}
        onChange={(value) => apply("timeframe", value)}
      />
      <Select
        label="Difficulty"
        value={selected.difficulty}
        placeholder="Any"
        options={DIFFICULTIES.map((d) => ({
          value: d,
          label: d[0].toUpperCase() + d.slice(1),
        }))}
        onChange={(value) => apply("difficulty", value)}
      />
      {filtered && (
        <button
          onClick={() => startTransition(() => router.push("/problems"))}
          className="h-[34px] rounded-md border border-zinc-800 px-3 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md bg-zinc-900 py-1.5 pl-2.5 pr-8 text-xs text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors hover:text-white focus:outline-none focus:ring-indigo-500"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500"
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
      </span>
    </label>
  );
}
