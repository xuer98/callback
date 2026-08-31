import Link from "next/link";
import { AuthMenu } from "./auth-menu";

const links = [
  { href: "/problems", label: "Problems" },
  { href: "/companies", label: "Companies" },
  { href: "/tracks", label: "Tracks" },
] as const;

export function Nav() {
  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-5 sm:gap-8">
          <Link
            href="/"
            className="shrink-0 font-mono text-sm font-semibold tracking-tight text-zinc-100"
          >
            call<span className="text-indigo-400">(back)</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm text-zinc-400 sm:gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap transition-colors hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <AuthMenu />
      </div>
    </header>
  );
}
