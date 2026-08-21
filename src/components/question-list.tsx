import { DifficultyBadge } from "./difficulty-badge";
import { leetcodeUrl, type CompanyQuestion } from "@/lib/types";

const MAX_TOPICS = 4;

/**
 * Imported question listings. Every row links out to LeetCode — Callback
 * stores the metadata, not the prompt.
 */
export function QuestionList({
  rows,
  showCompanyCount = false,
}: {
  rows: CompanyQuestion[];
  showCompanyCount?: boolean;
}) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {rows.map((question) => (
        <li key={question.slug}>
          <a
            href={leetcodeUrl(question.slug)}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <span className="text-sm text-zinc-200 group-hover:text-white">
              {question.title}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
            <span className="flex flex-wrap gap-1.5">
              {question.topics.slice(0, MAX_TOPICS).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400"
                >
                  {topic}
                </span>
              ))}
              {question.topics.length > MAX_TOPICS && (
                <span className="px-1 py-0.5 text-[11px] text-zinc-600">
                  +{question.topics.length - MAX_TOPICS}
                </span>
              )}
            </span>
            <span className="ml-auto whitespace-nowrap text-xs text-zinc-500">
              {showCompanyCount && question.companyCount
                ? `${question.companyCount} ${
                    question.companyCount === 1 ? "company" : "companies"
                  }`
                : `frequency ${question.frequency.toFixed(1)}`}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
