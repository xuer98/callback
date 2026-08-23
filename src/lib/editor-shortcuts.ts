"use client";

import { useEffect, useRef } from "react";

/**
 * The workspace's keyboard shortcuts. They are matched on window in the
 * capture phase, which puts them ahead of both the browser (Cmd+S would
 * otherwise open Save Page) and CodeMirror's own keymap (Mod-Enter is bound
 * to insertBlankLine by default).
 */
export type ShortcutAction = "save" | "format" | "run" | "submit";

export type ShortcutHandlers = Partial<Record<ShortcutAction, () => void>>;

function isMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.userAgent)
  );
}

/** The chord for `action`, spelled the way this platform labels its keys. */
export function shortcutHint(action: ShortcutAction): string {
  const mac = isMac();
  switch (action) {
    case "save":
      return mac ? "⌘S" : "Ctrl+S";
    case "run":
      return mac ? "⌘'" : "Ctrl+'";
    case "submit":
      return mac ? "⌘↩" : "Ctrl+Enter";
    case "format":
      return mac ? "⌃⇧F" : "Ctrl+Shift+F";
  }
}

/**
 * Which action a keydown is asking for, or null. Cmd and Ctrl are
 * interchangeable for save/run/submit so the chords work on either platform;
 * format is the one that names Ctrl specifically.
 */
function match(event: KeyboardEvent): ShortcutAction | null {
  const key = event.key.toLowerCase();
  if (event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey) {
    return key === "f" ? "format" : null;
  }
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
    return null;
  }
  if (key === "s") return "save";
  if (key === "enter") return "submit";
  if (key === "'") return "run";
  return null;
}

export function useEditorShortcuts(handlers: ShortcutHandlers) {
  // The handlers close over the current code and language, so they are read
  // through a ref that each render refreshes — the listener binds once.
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = match(event);
      if (action === null) return;
      const handler = latest.current[action];
      if (!handler) return;
      event.preventDefault();
      event.stopPropagation();
      handler();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);
}
