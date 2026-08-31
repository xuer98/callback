"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * The account control at the header's right end: a Sign in button when
 * signed out, otherwise an avatar — the account's image when it has one
 * (Google), the name's initial in a circle when not — opening a small menu
 * with the account details and sign-out.
 */
export function AuthMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (isPending) {
    return <span aria-hidden className="h-8 w-8 rounded-full bg-zinc-900" />;
  }

  if (!session) {
    return (
      <Link
        href="/signin"
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-900"
      >
        Sign in
      </Link>
    );
  }

  const user = session.user;
  const initial =
    (user.name || user.email || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-zinc-700 transition-shadow hover:ring-zinc-500"
      >
        {user.image ? (
          // Tiny external avatar (e.g. Google) — next/image optimization
          // would only add config and a proxy hop for a 32px circle.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-indigo-500 text-xs font-semibold text-white">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 shadow-lg shadow-black/40"
        >
          <div className="border-b border-zinc-800 px-3 pb-2 pt-1">
            <p className="truncate text-sm text-zinc-200">
              {user.name || "Account"}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <button
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await authClient.signOut();
              router.refresh();
            }}
            className="mt-1 w-full px-3 py-1.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
