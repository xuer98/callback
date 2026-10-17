"use client";

import { useEffect, useSyncExternalStore } from "react";

// The colour scheme is an attribute on <html>: ThemeScript sets it before
// the first paint from the stored choice, else the system setting, and the
// toggle flips it. Styling keys off html[data-theme] (globals.css); the
// pieces that draw their own chrome — the code editors, the whiteboard —
// read it through useTheme.

export type Theme = "light" | "dark";

const STORAGE_KEY = "callback:theme";

// Runs inline in <head>, so it is plain ES5 and never throws.
const BOOT = `(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`;

/** Applies the scheme before React hydrates, so the page never flashes. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The scheme in effect; "dark" while rendering on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => "dark");
}

/** Switches schemes and remembers the choice on this device. */
export function setTheme(theme: Theme) {
  apply(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private windows and blocked storage: the choice lasts for the page.
  }
}

const SUN =
  "M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const MOON = "M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z";

export function ThemeToggle() {
  const theme = useTheme();

  // Keep the attribute in step with the stored choice, else the system
  // setting as it changes. The first pass also repairs a page React had to
  // re-render from scratch after a hydration mismatch, which resets <html>
  // to its props and loses what the boot script set.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: light)");
    const sync = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch {
        // Unreadable storage counts as no choice.
      }
      const wanted: Theme =
        stored === "light" || stored === "dark"
          ? stored
          : media.matches
            ? "light"
            : "dark";
      if (current() !== wanted) apply(wanted);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={theme === "dark" ? MOON : SUN} />
      </svg>
    </button>
  );
}
