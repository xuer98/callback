import Link from "next/link";

/** Previous and Next around "Page x of y"; nothing when there is one page. */
export function Pagination({
  page,
  lastPage,
  hrefFor,
}: {
  page: number;
  lastPage: number;
  hrefFor: (page: number) => string;
}) {
  if (lastPage <= 1) return null;
  const link =
    "rounded-md border border-zinc-800 px-3 py-1.5 transition-colors hover:bg-zinc-900 hover:text-zinc-200";
  return (
    <nav className="mt-6 flex items-center justify-between text-xs text-zinc-400">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={link}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-zinc-500">
        Page {page} of {lastPage.toLocaleString()}
      </span>
      {page < lastPage ? (
        <Link href={hrefFor(page + 1)} className={link}>
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
