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
      {/* Brand, links, and the account control don't fit one 375px row, so
          below `sm` the links wrap onto their own line (w-full, ordered last)
          instead of colliding with the account control. From `sm` up it is
          the single 56px row it has always been. */}
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:gap-x-8 sm:py-0">
        <Link
          href="/"
          className="shrink-0 font-mono text-sm font-semibold tracking-tight text-zinc-100"
        >
          call<span className="text-indigo-400">(back)</span>
        </Link>
        <nav className="order-last flex w-full items-center gap-4 text-sm text-zinc-400 sm:order-none sm:w-auto sm:gap-6">
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
        <div className="ml-auto shrink-0">
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
