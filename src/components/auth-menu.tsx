"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const subscribeNoop = () => () => {};

export function AuthMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  // The session store has no hydration-stable snapshot — better-auth reads it
  // through `useSyncExternalStore(subscribe, get, get)`, so the hydrating
  // client sees whatever the store holds right then. The server always renders
  // the pending placeholder, but on the client `/get-session` can land while
  // React is still retrying the hydration render (it retries for as long as
  // the page's client chunks are loading). Pin the first client render to the
  // placeholder so it matches the HTML no matter when the session settles.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!mounted || isPending) return <span className="w-14" />;

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
