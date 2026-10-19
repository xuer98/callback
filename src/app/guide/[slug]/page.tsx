import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RememberList } from "@/components/back-to-list";
import { GuideOutline, type OutlineSection } from "@/components/guide-outline";
import { headingAnchors, RichText } from "@/components/markdown";
import { getCompany, getGuide, listGuides } from "@/lib/data";

const ARTICLE_ID = "guide";

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

  // The outline: the header as an overview, the body's top-level headings
  // (the ids RichText gives them), and the sources at the end.
  const sections: OutlineSection[] = [
    { id: "overview", title: "Overview" },
    ...headingAnchors(guide.body)
      .filter((heading) => heading.level <= 2)
      .map((heading) => ({ id: heading.id, title: heading.text })),
    ...(guide.sources.length > 0 ? [{ id: "sources", title: "Sources" }] : []),
  ];
  const outline = (labelled: boolean) => (
    <GuideOutline
      sections={sections}
      articleId={ARTICLE_ID}
      labelled={labelled}
    />
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 lg:grid lg:grid-cols-[minmax(0,42rem)_13rem] lg:justify-center lg:gap-14">
      <article id={ARTICLE_ID} className="min-w-0">
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
        <header id="overview" className="scroll-mt-24">
          <h1 className="text-3xl font-semibold tracking-tight">
            {guide.title}
          </h1>
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
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {guide.summary}
          </p>
        </header>

        {/* Below lg the outline folds up above the body instead of a sidebar. */}
        <details className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 lg:hidden">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-400">
            On this page
          </summary>
          <div className="mt-3">{outline(false)}</div>
        </details>

        <RichText
          text={guide.body}
          anchors
          className="mt-8 text-[15px] leading-7 text-zinc-300"
        />

        {guide.sources.length > 0 && (
          <section id="sources" className="mt-10 scroll-mt-24">
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
      </article>
      <aside className="hidden lg:block">
        <div className="sticky top-10">{outline(true)}</div>
      </aside>
    </div>
  );
}
