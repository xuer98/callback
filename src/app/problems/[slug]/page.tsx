import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DesignWorkspace } from "@/components/design-workspace";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { MarkDoneButton } from "@/components/progress";
import { RichText } from "@/components/markdown";
import { ProblemPanes } from "@/components/problem-panes";
import { JudgeSolution, UiSolution } from "@/components/solution-panel";
import { UiWorkspace } from "@/components/ui-workspace";
import { Workspace } from "@/components/workspace";
import { getCompany, getProblem, listProblems } from "@/lib/data";
import {
  CATEGORY_LABELS,
  judgeFor,
  LANGUAGES,
  uiTemplates,
  type Company,
  type Problem,
} from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listProblems()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await getProblem(slug))?.title ?? "Problem" };
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  const judge = problem.judge;
  const compact = Boolean(judge || problem.ui);

  const header = (
    <header>
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>{CATEGORY_LABELS[problem.category]}</span>
        <span aria-hidden>·</span>
        <DifficultyBadge difficulty={problem.difficulty} />
        {!judge && (
          <span className="ml-auto">
            <MarkDoneButton slug={problem.slug} />
          </span>
        )}
      </div>
      <h1
        className={`mt-3 font-semibold tracking-tight ${
          compact ? "text-xl" : "text-3xl"
        }`}
      >
        {problem.title}
      </h1>
    </header>
  );

  // Judged problems get the editor workspace; frontend problems with starter
  // files get the live-preview UI workspace; system-design problems get the
  // whiteboard + write-up + AI-review workspace. Everything else is a
  // document.
  const workspace = judge ? (
    <Workspace slug={problem.slug} judge={judge} />
  ) : problem.ui ? (
    <UiWorkspace slug={problem.slug} ui={problem.ui} />
  ) : problem.category === "system-design" ? (
    <DesignWorkspace slug={problem.slug} />
  ) : null;

  if (workspace) {
    return (
      <div
        data-workspace
        className="mx-auto flex w-full max-w-[1600px] flex-col px-2 py-2 lg:h-full"
      >
        {/* Keyed by slug so pane and editor state can't leak between
            problems on client-side navigation. */}
        <ProblemPanes
          key={problem.slug}
          hasSolution={
            problem.solution !== undefined ||
            (judge !== undefined &&
              LANGUAGES.some((l) => judgeFor(judge, l)?.solutionCode)) ||
            (problem.ui !== undefined &&
              uiTemplates(problem.ui).some((t) => t.solution !== undefined))
          }
          description={
            <>
              {header}
              <Prompt problem={problem} />
              <Hints problem={problem} />
              <AskedAt problem={problem} />
            </>
          }
          solution={
            judge ? (
              <JudgeSolution judge={judge} prose={problem.solution} />
            ) : problem.ui ? (
              <UiSolution ui={problem.ui} prose={problem.solution} />
            ) : (
              problem.solution !== undefined && (
                <RichText
                  text={problem.solution}
                  className="text-sm leading-6 text-zinc-300"
                />
              )
            )
          }
          workspace={workspace}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      {header}
      <Prompt problem={problem} />
      <Hints problem={problem} />
      <Solution problem={problem} />
      <AskedAt problem={problem} />
    </div>
  );
}

function Prompt({ problem }: { problem: Problem }) {
  return (
    <RichText
      text={problem.prompt}
      className={`text-[15px] leading-7 text-zinc-300 ${
        problem.judge || problem.ui ? "mt-6" : "mt-8"
      }`}
    />
  );
}

/** Collapsed by default, so the description can carry them without spoiling. */
function Hints({ problem }: { problem: Problem }) {
  if (problem.hints.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-zinc-100">Hints</h2>
      <div className="mt-3 space-y-2">
        {problem.hints.map((hint, i) => (
          <details
            key={i}
            className="group rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
          >
            <summary className="cursor-pointer select-none text-sm text-zinc-400 group-open:text-zinc-200">
              Hint {i + 1}
            </summary>
            <RichText
              text={hint}
              className="mt-2 text-sm leading-6 text-zinc-300"
            />
          </details>
        ))}
      </div>
    </section>
  );
}

/** On document pages the solution hides behind a click, like a hint. */
function Solution({ problem }: { problem: Problem }) {
  if (problem.solution === undefined) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-zinc-100">Solution</h2>
      <details className="group mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <summary className="cursor-pointer select-none text-sm text-zinc-400 group-open:text-zinc-200">
          Show the approach
        </summary>
        <RichText
          text={problem.solution}
          className="mt-3 text-sm leading-6 text-zinc-300"
        />
      </details>
    </section>
  );
}

async function AskedAt({ problem }: { problem: Problem }) {
  const askedBy = (
    await Promise.all(problem.companies.map((slug) => getCompany(slug)))
  ).filter((c): c is Company => c !== undefined);
  if (askedBy.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-zinc-100">Asked at</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {askedBy.map((company) => (
          <Link
            key={company.slug}
            href={`/companies/${company.slug}`}
            className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-300 ring-1 ring-inset ring-zinc-800 transition-colors hover:text-white"
          >
            {company.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
