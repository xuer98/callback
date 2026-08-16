import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemRow } from "@/components/problem-row";
import { getTrack, trackProblems, tracks } from "@/lib/data";

export function generateStaticParams() {
  return tracks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: getTrack(slug)?.name ?? "Track" };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();

  const ordered = trackProblems(track);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">{track.name}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        {track.description}
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {ordered.map((problem, i) => (
          <div key={problem.slug} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-right font-mono text-sm text-zinc-600">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <ProblemRow problem={problem} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
