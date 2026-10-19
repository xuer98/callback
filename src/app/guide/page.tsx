import type { Metadata } from "next";
import Link from "next/link";
import { listCompanies, listGuides } from "@/lib/data";

export const metadata: Metadata = { title: "Guides" };

export const revalidate = 300;

export default async function GuidesPage() {
  const [guides, companies] = await Promise.all([
    listGuides(),
    listCompanies(),
  ]);
  const companyNames = new Map(companies.map((c) => [c.slug, c.name]));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Guides</h1>
      <p className="mt-1 text-sm text-zinc-400">
        How a company&apos;s loop runs and what it asks, with the problems here
        that drill each part.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guide/${guide.slug}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium text-zinc-100">{guide.title}</h2>
              {guide.company && (
                <span className="shrink-0 text-xs text-zinc-500">
                  {companyNames.get(guide.company) ?? guide.company}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {guide.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
