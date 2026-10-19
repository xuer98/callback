import Link from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import { RichLine } from "./markdown";
import { FavoriteStar, StatusMark } from "./progress";
import { CATEGORY_LABELS, type Problem } from "@/lib/types";

/**
 * Just the fields the row renders — callers with a full Problem still fit,
 * and client components can pass a slim payload instead of serializing
 * prompts and judges into the page.
 */
export type ProblemCardData = Pick<
  Problem,
  "slug" | "title" | "category" | "difficulty" | "summary" | "topics"
>;

const MAX_TOPICS = 3;

/**
 * A card that is one link: the title's pseudo-element stretches over the
 * whole card, and the star sits above it so it stays its own control.
 */
export function ProblemRow({ problem }: { problem: ProblemCardData }) {
  const topics = problem.topics ?? [];
  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 py-3 pl-4 pr-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <StatusMark slug={problem.slug} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">
          <Link
            href={`/problems/${problem.slug}`}
            className="after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-indigo-500"
          >
            {problem.title}
          </Link>
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {CATEGORY_LABELS[problem.category]} ·{" "}
          <RichLine text={problem.summary} />
        </p>
      </div>
      {/* The topic tags, as on the listing rows; the title keeps the room
          on narrow screens. */}
      {topics.length > 0 && (
        <span
          title={topics.join(", ")}
          className="hidden shrink-0 items-center gap-1.5 md:flex"
        >
          {topics.slice(0, MAX_TOPICS).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {topic}
            </span>
          ))}
          {topics.length > MAX_TOPICS && (
            <span className="px-1 py-0.5 text-[11px] text-zinc-600">
              +{topics.length - MAX_TOPICS}
            </span>
          )}
        </span>
      )}
      <DifficultyBadge difficulty={problem.difficulty} />
      <FavoriteStar slug={problem.slug} className="relative z-10" />
    </div>
  );
}
