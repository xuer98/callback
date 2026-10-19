import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RememberList } from "@/components/back-to-list";
import { RichText } from "@/components/markdown";
import { getCompany, getGuide, listGuides } from "@/lib/data";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listGuides()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await getGuide(slug))?.title ?? "Guide" };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  const company = guide.company ? await getCompany(guide.company) : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      {/* A problem opened from the guide comes back to the guide. */}
      <RememberList href={`/guide/${guide.slug}`} label={guide.title} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-zinc-500">
          <li className="flex items-center gap-1.5">
            <Link
              href="/guide"
              className="transition-colors hover:text-zinc-200"
            >
              Guides
            </Link>
            <span aria-hidden className="text-zinc-700">
              /
            </span>
          </li>
          <li>
            <span aria-current="page" className="text-zinc-300">
              {guide.title}
            </span>
          </li>
        </ol>
      </nav>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{guide.title}</h1>
        {company && (
          <p className="mt-2 text-xs text-zinc-500">
            <Link
              href={`/companies/${company.slug}`}
              className="transition-colors hover:text-zinc-200"
            >
              {company.name} question bank →
            </Link>
          </p>
        )}
        <p className="mt-3 text-sm leading-6 text-zinc-400">{guide.summary}</p>
      </header>

      <RichText
        text={guide.body}
        className="mt-8 text-[15px] leading-7 text-zinc-300"
      />

      {guide.sources.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-100">Sources</h2>
          <ul className="mt-3 space-y-2">
            {guide.sources.map((source) => (
              <li key={source.url} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-300 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-50"
                >
                  {source.label}
                </a>
                <span className="ml-1.5 text-xs text-zinc-600">↗</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
