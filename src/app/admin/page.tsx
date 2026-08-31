import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { adminEmail } from "@/lib/admin-actions";
import { listProblems } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Admin" };

// The admin console index: every problem with an edit link. Gated on
// ADMIN_EMAILS — anyone else gets the 404, same as if the route didn't
// exist. The actions re-check on every write, so this gate is cosmetic.

export default async function AdminPage() {
  if (!(await adminEmail())) notFound();
  const problems = await listProblems();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <Link
          href="/admin/problems/new"
          className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
        >
          New problem
        </Link>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {problems.length} problems. Heads up: <code>pnpm db:seed</code>{" "}
        overwrites seeded slugs with the repo&apos;s content, so console edits
        to those last only until the next seed — problems created here are
        left alone.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {problems.map((problem) => (
          <li key={problem.slug}>
            <Link
              href={`/admin/problems/${problem.slug}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {problem.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {problem.slug} · {CATEGORY_LABELS[problem.category]}
                  {problem.judge ? " · judge" : ""}
                  {problem.ui ? " · ui" : ""}
                  {problem.solution ? " · solution" : ""}
                </p>
              </div>
              <DifficultyBadge difficulty={problem.difficulty} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
