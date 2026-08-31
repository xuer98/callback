import Link from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import { RichLine } from "./markdown";
import { ProgressMarker } from "./progress";
import { CATEGORY_LABELS, type Problem } from "@/lib/types";

/**
 * Just the fields the row renders — callers with a full Problem still fit,
 * and client components can pass a slim payload instead of serializing
 * prompts and judges into the page.
 */
export type ProblemCardData = Pick<
  Problem,
  "slug" | "title" | "category" | "difficulty" | "summary"
>;

export function ProblemRow({ problem }: { problem: ProblemCardData }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-zinc-100">
          {problem.title}
          <ProgressMarker slug={problem.slug} />
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {CATEGORY_LABELS[problem.category]} ·{" "}
          <RichLine text={problem.summary} />
        </p>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
    </Link>
  );
}
