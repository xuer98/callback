import type { Metadata } from "next";
import Link from "next/link";
import { listCompaniesWithCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Companies" };

export const revalidate = 300;

export default async function CompaniesPage() {
  const companies = await listCompaniesWithCounts();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Loop structure and frequently asked questions, company by company.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {companies.map((company) => {
          const count = company.problemCount;
          return (
            <Link
              key={company.slug}
              href={`/companies/${company.slug}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium text-zinc-100">{company.name}</h2>
                <span className="text-xs text-zinc-500">
                  {count} {count === 1 ? "problem" : "problems"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {company.blurb}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
