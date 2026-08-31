import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminProblemForm } from "@/components/admin-problem-form";
import { adminEmail } from "@/lib/admin-actions";
import { getProblem } from "@/lib/data";

export const metadata: Metadata = { title: "Edit problem" };

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await adminEmail())) notFound();
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  // The judge splits into the tests array (the common edit) and everything
  // else (starter/entry/drivers/per-language) as one JSON blob that
  // round-trips untouched fields.
  const { tests, ...judgeConfig } = problem.judge ?? { tests: undefined };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link
            href="/admin"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            &larr; Admin
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {problem.title}
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{slug}</p>
        </div>
        <Link
          href={`/problems/${slug}`}
          className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
        >
          View live &rarr;
        </Link>
      </div>
      <div className="mt-6">
        <AdminProblemForm
          mode="edit"
          slug={slug}
          initial={{
            title: problem.title,
            summary: problem.summary,
            category: problem.category,
            difficulty: problem.difficulty,
            companies: problem.companies.join(", "),
            prompt: problem.prompt,
            hints: problem.hints.length > 0 ? problem.hints : [""],
            solution: problem.solution ?? "",
            rubric: problem.rubric ?? "",
            testsJson: tests ? JSON.stringify(tests, null, 2) : "",
            judgeConfigJson: problem.judge
              ? JSON.stringify(judgeConfig, null, 2)
              : "",
            uiJson: problem.ui ? JSON.stringify(problem.ui, null, 2) : "",
          }}
        />
      </div>
    </div>
  );
}
