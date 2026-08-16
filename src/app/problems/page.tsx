import type { Metadata } from "next";
import Link from "next/link";
import { ProblemRow } from "@/components/problem-row";
import { listProblems } from "@/lib/data";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

export const metadata: Metadata = { title: "Problems" };

const categories = Object.keys(CATEGORY_LABELS) as Category[];

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.category === "string" ? params.category : undefined;
  const active = categories.find((c) => c === raw);
  const problems = await listProblems();
  const visible = active
    ? problems.filter((p) => p.category === active)
    : problems;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {problems.length} questions across coding, design, behavioral, and
        data.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href="/problems" label="All" active={!active} />
        {categories.map((c) => (
          <FilterChip
            key={c}
            href={`/problems?category=${c}`}
            label={CATEGORY_LABELS[c]}
            active={active === c}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {visible.map((p) => (
          <ProblemRow key={p.slug} problem={p} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-indigo-500 text-white"
          : "bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:text-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}
