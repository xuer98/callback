import Link from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import type { SimilarityRow } from "@/lib/similar-problems";

/**
 * The problems most like this one, as a collapsed list at the foot of the
 * description: title and difficulty per row, each a link. Closed by default
 * like the hints, so it never crowds the prompt; nothing at all when the
 * scorer found no neighbour.
 */
export function SimilarProblems({
  problems,
}: {
  problems: readonly SimilarityRow[];
}) {
  if (problems.length === 0) return null;
  return (
    <section className="mt-10">
      <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50">
        <summary className="flex cursor-pointer select-none list-none items-center gap-2.5 px-4 py-3 text-sm font-semibold text-zinc-100 [&::-webkit-details-marker]:hidden">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12h-8M21 6H8M21 18h-8" />
            <path d="M3 6v4c0 1.1.9 2 2 2h3M3 10v6c0 1.1.9 2 2 2h3" />
          </svg>
          Similar Problems
          <span className="ml-auto text-xs font-normal text-zinc-500">
            {problems.length}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </summary>
        <ul className="divide-y divide-zinc-800/70 border-t border-zinc-800">
          {problems.map((problem) => (
            <li key={problem.slug}>
              <Link
                href={`/problems/${problem.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-900"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                  {problem.title}
                </span>
                <DifficultyBadge difficulty={problem.difficulty} />
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
