"use client";

import Link from "next/link";

// The small pill controls the lists share: a link for state kept in the URL
// (the category chips on /problems and company pages) and a button for state
// kept on the client (the problem side menu's filters). Same look either way.

const CHIP = "rounded-full px-3 py-1 text-xs font-medium transition-colors";
const ACTIVE = "bg-indigo-500 text-white";
const IDLE =
  "bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:text-zinc-100";

export function LinkChip({
  href,
  label,
  active,
  count,
}: {
  href: string;
  label: string;
  active: boolean;
  /** How many the chip stands for, shown in a small badge after the label. */
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`${CHIP} ${count === undefined ? "" : "inline-flex items-center gap-1.5"} ${active ? ACTIVE : IDLE}`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 text-[10px] leading-4 tabular-nums ${
            active ? "bg-white/20" : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${CHIP} ${active ? ACTIVE : IDLE}`}
    >
      {label}
    </button>
  );
}
