import Link from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import { ProgressMarker } from "./progress";
import { CATEGORY_LABELS, type Problem } from "@/lib/types";

export function ProblemRow({ problem }: { problem: Problem }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-zinc-100">
          {problem.title}
          <ProgressMarker slug={problem.slug} />
          {problem.judge && (
            <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
              runnable
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {CATEGORY_LABELS[problem.category]} · {problem.summary}
        </p>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
    </Link>
  );
}
