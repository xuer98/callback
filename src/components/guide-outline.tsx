"use client";

import { useEffect, useState } from "react";

// The "On this page" outline beside a guide: one numbered entry per
// section, the one under the reader highlighted, a check on each section
// already scrolled past, and how far through the article they are. The
// entries are plain hash links, so a section's URL can be bookmarked or
// shared and the browser's own jump handles the click.

export interface OutlineSection {
  id: string;
  title: string;
}

/** The viewport line a heading has to cross to count as the current one. */
const READING_LINE = 96;

export function GuideOutline({
  sections,
  articleId,
  labelled = true,
}: {
  sections: OutlineSection[];
  /** The element whose height the read percentage is measured against. */
  articleId: string;
  /** False when the container already says "On this page" (the mobile fold). */
  labelled?: boolean;
}) {
  const [{ active, percent }, setPosition] = useState({
    active: 0,
    percent: 0,
  });

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    const headings = sections.map((section) =>
      document.getElementById(section.id),
    );
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = 0;
      headings.forEach((heading, i) => {
        if (heading && heading.getBoundingClientRect().top <= READING_LINE) {
          current = i;
        }
      });
      const { top, height } = article.getBoundingClientRect();
      const span = height - window.innerHeight;
      const read =
        span <= 0
          ? 100
          : Math.round(Math.min(1, Math.max(0, -top / span)) * 100);
      // The last section can be shorter than a screen, so it never reaches
      // the reading line; the end of the page counts as being in it.
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atEnd) current = sections.length - 1;
      setPosition((prev) =>
        prev.active === current && prev.percent === read
          ? prev
          : { active: current, percent: read },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections, articleId]);

  return (
    <nav aria-label="On this page" className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={
            labelled
              ? "text-xs font-semibold uppercase tracking-wider text-zinc-400"
              : "sr-only"
          }
        >
          On this page
        </p>
        <span className="text-xs tabular-nums text-zinc-500">
          {percent}% read
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Read"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-px w-full bg-zinc-800"
      >
        <div
          className="h-px bg-indigo-400 transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-3 space-y-0.5">
        {sections.map((section, i) => {
          const current = i === active;
          const read = i < active;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={current ? "location" : undefined}
                className={`flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors ${
                  current
                    ? "bg-indigo-500/10 font-medium text-indigo-300"
                    : read
                      ? "text-zinc-500 hover:text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <span className="flex w-5 shrink-0 justify-end font-mono text-xs text-zinc-600">
                  {read ? (
                    <svg
                      aria-hidden
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3.5 8.5 3 3 6-7" />
                    </svg>
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                  {read && <span className="sr-only">Read:</span>}
                </span>
                <span className="truncate">{section.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
