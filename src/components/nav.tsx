import Link from "next/link";
import { AuthMenu } from "./auth-menu";

const links = [
  { href: "/problems", label: "Problems" },
  { href: "/questions", label: "Questions" },
  { href: "/companies", label: "Companies" },
  { href: "/tracks", label: "Tracks" },
] as const;

export function Nav() {
  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight text-zinc-100"
        >
          call<span className="text-indigo-400">(back)</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
