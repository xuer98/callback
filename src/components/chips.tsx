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
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className={`${CHIP} ${active ? ACTIVE : IDLE}`}>
      {label}
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
