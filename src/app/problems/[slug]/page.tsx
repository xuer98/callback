import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { MarkDoneButton } from "@/components/progress";
import { ProblemPanes } from "@/components/problem-panes";
import { Whiteboard } from "@/components/whiteboard";
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
          judge ? "text-xl" : "text-3xl"
        }`}
      >
        {problem.title}
      </h1>
    </header>
  );

  // Judged problems get the editor workspace; system-design problems get a
  // whiteboard to sketch the architecture on. Everything else is a document.
  const workspace = judge ? (
    <Workspace slug={problem.slug} judge={judge} />
  ) : problem.category === "system-design" ? (
    <Whiteboard slug={problem.slug} />
  ) : null;

  if (workspace) {
    return (
      <div
        data-workspace
        className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 lg:h-full lg:px-6"
      >
        {/* Keyed by slug so pane and editor state can't leak between
            problems on client-side navigation. */}
        <ProblemPanes
          key={problem.slug}
          hasHints={problem.hints.length > 0}
          description={
            <>
              {header}
              <Prompt problem={problem} />
              <AskedAt problem={problem} />
            </>
          }
          hints={<Hints problem={problem} bare />}
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
      <AskedAt problem={problem} />
    </div>
  );
}

function Prompt({ problem }: { problem: Problem }) {
  // Odd-indexed segments sit between ``` fences and render preformatted.
  const segments = problem.prompt.split("```");
  return (
    <div
      className={`mt-6 space-y-4 text-[15px] leading-7 text-zinc-300 ${
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
          <Blocks key={i} text={segment} />
        ),
      )}
    </div>
  );
}

/**
 * Prompt bodies outside ``` fences are light markdown: "## "/"### " headings,
 * "- " bullet lists, and `inline code`. Anything else is a paragraph, with
 * blank lines separating them. Returns a fragment so each block stays a direct
 * child of the prose container's vertical rhythm.
 */
function Blocks({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push(<p key={blocks.length}>{inline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
    if (bullets.length > 0) {
      blocks.push(
        <ul
          key={blocks.length}
          className="list-disc space-y-1.5 pl-5 marker:text-zinc-600"
        >
          {bullets.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flush();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      const Tag = heading[1].length === 2 ? "h2" : "h3";
      blocks.push(
        <Tag
          key={blocks.length}
          className="pt-2 text-[15px] font-semibold text-zinc-100"
        >
          {inline(heading[2])}
        </Tag>,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      if (paragraph.length > 0) flush();
      bullets.push(line.slice(2));
      continue;
    }
    if (bullets.length > 0) flush();
    paragraph.push(line);
  }
  flush();

  return <>{blocks}</>;
}

/** Backtick-delimited spans within a line render as code chips. */
function inline(text: string): React.ReactNode {
  const parts = text.split("`");
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300 ring-1 ring-inset ring-zinc-800"
      >
        {part}
      </code>
    ) : (
      part
    ),
  );
}

function Hints({
  problem,
  bare = false,
}: {
  problem: Problem;
  bare?: boolean;
}) {
  if (problem.hints.length === 0) return null;
  return (
    <section className={bare ? "" : "mt-10"}>
      {!bare && <h2 className="text-sm font-semibold text-zinc-100">Hints</h2>}
      <div className={bare ? "space-y-2" : "mt-3 space-y-2"}>
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
