import Link from "next/link";
import { listCompanies, listProblems, listTracks } from "@/lib/data";

export const revalidate = 300;

const pillars = [
  {
    title: "Software engineering",
    body: "Algorithms, data structures, frontend, and SQL — the coding rounds, end to end.",
    href: "/problems",
    cta: "Browse problems",
  },
  {
    title: "Broad tech prep",
    body: "System design and behavioral practice for the rounds that decide senior offers.",
    href: "/tracks",
    cta: "Follow a track",
  },
  {
    title: "Company-specific prep",
    body: "Real loop structures and frequently asked questions, organized by company.",
    href: "/companies",
    cta: "Pick a company",
  },
] as const;

export default async function Home() {
  const [problems, companies, tracks] = await Promise.all([
    listProblems(),
    listCompanies(),
    listTracks(),
  ]);

  return (
    <div>
      <section className="py-16 text-center sm:py-24">
        <p className="font-mono text-sm text-indigo-400">
          interview prep for engineers
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Practice until the phone rings.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-zinc-400">
          Coding, system design, behavioral, and company-specific prep in one
          place — so your next interview ends with a callback.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/problems"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            Start practicing
          </Link>
          <Link
            href="/companies"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            Prep for a company
          </Link>
        </div>
        <p className="mt-10 text-xs text-zinc-500">
          {problems.length} problems · {companies.length} company guides ·{" "}
          {tracks.length} curated tracks — and counting
        </p>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <h2 className="font-medium text-zinc-100">{pillar.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
              {pillar.body}
            </p>
            <Link
              href={pillar.href}
              className="mt-4 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              {pillar.cta} →
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
