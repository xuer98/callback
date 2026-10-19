"use client";

import { useId, useState } from "react";
import { LinkChip } from "./chips";

// The topic tags under the category chips of /problems, LeetCode-style:
// every tag in the current view with how many problems carry it, the picked
// ones lit and listed first. Each chip links to the view with that tag
// toggled in the filter's Topics row, so the strip is just another way to
// write the URL. Folded to the most common tags until expanded; folding by
// leaving chips out, rather than clipping them, keeps the hidden ones out of
// the tab order too.

export interface TopicChip {
  name: string;
  count: number;
  href: string;
  active: boolean;
}

const FOLDED = 12;

export function TopicStrip({ topics }: { topics: TopicChip[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (topics.length === 0) return null;
  const shown = expanded ? topics : topics.slice(0, FOLDED);
  const hidden = topics.length - shown.length;
  return (
    <ul
      id={listId}
      aria-label="Topics"
      className="mt-3 flex flex-wrap items-center gap-2"
    >
      {shown.map((topic) => (
        <li key={topic.name}>
          <LinkChip
            href={topic.href}
            label={topic.name}
            active={topic.active}
            count={topic.count}
          />
        </li>
      ))}
      {topics.length > FOLDED && (
        <li>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((shown) => !shown)}
            className="rounded-full px-2 py-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            {expanded ? "Show fewer" : `+${hidden} more`}
          </button>
        </li>
      )}
    </ul>
  );
}
