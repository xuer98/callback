import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { MarkDoneButton } from "@/components/progress";
import { Workspace } from "@/components/workspace";
import { getCompany, getProblem, listProblems } from "@/lib/data";
import { CATEGORY_LABELS, type Company, type Problem } from "@/lib/types";

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
  const details = (
    <>
      <Prompt problem={problem} />
      <Hints problem={problem} />
      <AskedAt problem={problem} />
    </>
  );

  return (
    <div className={judge ? "w-full" : "mx-auto w-full max-w-2xl"}>
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
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {problem.title}
        </h1>
      </header>

      {judge ? (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
          <div>{details}</div>
          <Workspace slug={problem.slug} judge={judge} />
        </div>
      ) : (
        details
      )}
    </div>
  );
}

function Prompt({ problem }: { problem: Problem }) {
  // Odd-indexed segments sit between ``` fences and render preformatted.
  const segments = problem.prompt.split("```");
  return (
    <div
      className={`space-y-4 text-[15px] leading-7 text-zinc-300 ${
        problem.judge ? "" : "mt-8"
      }`}
    >
      {segments.map((segment, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs leading-6"
          >
            {segment.trim()}
          </pre>
        ) : (
          segment
            .split("\n\n")
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, j) => <p key={`${i}-${j}`}>{paragraph}</p>)
        ),
      )}
    </div>
  );
}

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
            <p className="mt-2 text-sm leading-6 text-zinc-300">{hint}</p>
          </details>
        ))}
      </div>
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
