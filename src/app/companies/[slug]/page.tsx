import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProblemRow } from "@/components/problem-row";
import { QuestionList } from "@/components/question-list";
import {
  getCompany,
  listCompanies,
  problemsForCompany,
  queryQuestions,
} from "@/lib/data";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listCompanies()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await getCompany(slug))?.name ?? "Company" };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const asked = await problemsForCompany(company.slug);
  // Imported listings, all-time and most frequent first. The time-range views
  // live on /questions so this page can stay statically rendered.
  const { rows: questions, total: questionCount } = await queryQuestions({
    timeframe: "all",
    company: company.slug,
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{company.blurb}</p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-100">Typical loop</h2>
        <ol className="mt-3 space-y-2">
          {company.process.map((stage, i) => (
            <li key={stage} className="flex gap-3 text-sm text-zinc-300">
              <span className="w-5 shrink-0 text-right font-mono text-zinc-600">
                {i + 1}
              </span>
              {stage}
            </li>
          ))}
        </ol>
      </section>

      {asked.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-100">
            Practice questions
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {asked.map((p) => (
              <ProblemRow key={p.slug} problem={p} />
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">
              Asked on LeetCode
            </h2>
            <Link
              href={`/problems?company=${company.slug}`}
              className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              All {questionCount.toLocaleString()} by time range &rarr;
            </Link>
          </div>
          <QuestionList rows={questions.slice(0, 8)} />
        </section>
      )}
    </div>
  );
}
