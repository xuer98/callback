"use client";

import { useState } from "react";
import { ProblemRow, type ProblemCardData } from "./problem-row";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

/**
 * The company page's practice-question list with category chips. Filtering
 * is client state over the handful of rows already in the page, so company
 * pages stay statically rendered. Chips only appear for categories the
 * company actually has, and not at all when there's just one.
 */
export function CompanyProblems({
  problems,
}: {
  problems: ProblemCardData[];
}) {
  const [active, setActive] = useState<Category | null>(null);
  const present = CATEGORIES.filter((c) =>
    problems.some((p) => p.category === c),
  );
  const visible = active
    ? problems.filter((p) => p.category === active)
    : problems;

  return (
    <>
      {present.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All"
            active={active === null}
            onClick={() => setActive(null)}
          />
          {present.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c]}
              active={active === c}
              onClick={() => setActive(c)}
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        {visible.map((p) => (
          <ProblemRow key={p.slug} problem={p} />
        ))}
      </div>
    </>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-indigo-500 text-white"
          : "bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:text-zinc-100"
      }`}
    >
      {label}
    </button>
  );
}
