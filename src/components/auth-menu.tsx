"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <span className="w-14" />;

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

  return (
    <span className="flex items-center gap-3">
      <span className="hidden text-xs text-zinc-400 sm:inline">
        {session.user.name || session.user.email}
      </span>
      <button
        onClick={async () => {
          await authClient.signOut();
          router.refresh();
        }}
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-900"
      >
        Sign out
      </button>
    </span>
  );
}
