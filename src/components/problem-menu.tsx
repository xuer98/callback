"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import type { ProblemIndex } from "@/lib/types";
import {
  NO_FILTERS,
  ProblemMenuPanel,
  type MenuFilters,
} from "./problem-menu-panel";

// The problem side menu: a drawer listing every problem, opened from a
// problem page to move to another one without a trip back to /problems.
//
// The provider sits in the /problems layout — above the dynamic segment —
// so the filters and the fetched list outlive the navigation they cause.
// The list comes from /api/problems the first time the menu is wanted:
// problem pages are static, and none of them should carry the whole index.

const ProblemMenuContext = createContext<{
  open: () => void;
  preload: () => void;
}>({ open: () => {}, preload: () => {} });

export function ProblemMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug?: string }>();
  const here = params.slug ?? "";
  // The problem the menu was opened on. "Open" means "opened on this
  // problem", so the drawer puts itself away once a pick has navigated.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === here;

  const [index, setIndex] = useState<ProblemIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [filters, setFilters] = useState<MenuFilters>(NO_FILTERS);
  const requested = useRef(false);

  const preload = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setFailed(false);
    fetch("/api/problems")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .then((data: ProblemIndex) => setIndex(data))
      .catch(() => {
        // Leave the door open for the next hover, open, or Try again.
        requested.current = false;
        setFailed(true);
      });
  }, []);

  const open = useCallback(() => {
    preload();
    setOpenedOn(here);
  }, [here, preload]);
  const close = useCallback(() => setOpenedOn(null), []);

  // A native modal dialog supplies the focus trap, Escape, the backdrop, and
  // focus restoration. Opened in a layout effect so that by the time the
  // panel's own effects run, it is on screen and can be measured.
  const dialogRef = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // Typing to search is the fast path with a keyboard. On touch,
      // focusing the field would raise the on-screen keyboard over the list.
      if (window.matchMedia("(pointer: fine)").matches) {
        dialog.querySelector("input")?.focus();
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // The backdrop is part of the dialog element, and the panel covers the
  // rest of it, so a click whose press and release both land on the dialog
  // itself is a click outside. Checking the press too keeps a drag that
  // starts in the search field and ends outside from closing the menu.
  const pressedOutside = useRef(false);

  const value = useMemo(() => ({ open, preload }), [open, preload]);

  return (
    <ProblemMenuContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        data-problem-menu
        aria-label="All problems"
        onClose={close}
        onPointerDown={(event) => {
          pressedOutside.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (pressedOutside.current && event.target === event.currentTarget) {
            close();
          }
        }}
        className="fixed inset-y-0 left-0 right-auto h-full max-h-none w-[min(36rem,100vw)] max-w-none flex-col overflow-hidden border-r border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/60 open:flex motion-safe:open:animate-[problem-menu-in_150ms_ease-out]"
      >
        {isOpen && (
          <ProblemMenuPanel
            index={index}
            failed={failed}
            onRetry={preload}
            currentSlug={here}
            filters={filters}
            onFilters={setFilters}
            onClose={close}
          />
        )}
      </dialog>
    </ProblemMenuContext.Provider>
  );
}

/** Opens the side menu; sits at the start of a problem page's breadcrumb. */
export function ProblemMenuButton() {
  const { open, preload } = useContext(ProblemMenuContext);
  return (
    <button
      type="button"
      onClick={open}
      // Start fetching the list on intent, so it is usually there by the
      // time the drawer has opened.
      onPointerEnter={preload}
      onFocus={preload}
      aria-label="All problems"
      aria-haspopup="dialog"
      title="All problems"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M2.5 4h.5M6 4h7.5M2.5 8h.5M6 8h7.5M2.5 12h.5M6 12h7.5" />
      </svg>
    </button>
  );
}
