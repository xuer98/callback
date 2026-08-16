import type { Metadata } from "next";
import Link from "next/link";
import { listTracks } from "@/lib/data";

export const metadata: Metadata = { title: "Tracks" };

export const revalidate = 300;

export default async function TracksPage() {
  const tracks = await listTracks();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Tracks</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Curated sequences that take you from warm-up to loop-ready.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tracks.map((track) => (
          <Link
            key={track.slug}
            href={`/tracks/${track.slug}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium text-zinc-100">{track.name}</h2>
              <span className="text-xs text-zinc-500">
                {track.problemSlugs.length} problems
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {track.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
