"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Company } from "@/lib/types";

// Search over the company directory. Every company is already on the page
// (the route renders all of them), so filtering happens here rather than
// through the URL like /problems does — no round trip, results per keystroke.
// The seeded order is meaningful (curated companies first), so matches keep it.

type CompanyCard = Company & { problemCount: number };

export function CompanySearch({ companies }: { companies: CompanyCard[] }) {
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return companies;
    // Slug as well as name, so "apollo-io" finds Apollo.io and "anduril"
    // finds Anduril Industries.
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(needle) ||
        company.slug.includes(needle),
    );
  }, [companies, needle]);

  return (
    <>
      <div className="mt-6 flex items-center gap-3">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Search companies</span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search companies"
            className="w-full rounded-md bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-200 ring-1 ring-inset ring-zinc-800 transition-colors placeholder:text-zinc-600 hover:ring-zinc-700 focus:outline-none focus:ring-indigo-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </label>
        <span aria-live="polite" className="text-xs text-zinc-500">
          {needle
            ? `${matches.length} of ${companies.length}`
            : `${companies.length} companies`}
        </span>
      </div>

      {matches.length === 0 ? (
        <p className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500">
          No company matches “{query.trim()}”.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {matches.map((company) => {
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
      )}
    </>
  );
}
