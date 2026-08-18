"use client";

import { useState } from "react";
import { PaneTab, SplitPane } from "./resizable";

// The judged-problem layout: a tabbed description pane beside the workspace,
// with a draggable divider between them. The tab contents are server-rendered
// and passed in, so the prompt stays static HTML.
export function ProblemPanes({
  description,
  hints,
  workspace,
  hasHints,
}: {
  description: React.ReactNode;
  hints: React.ReactNode;
  workspace: React.ReactNode;
  hasHints: boolean;
}) {
  const [tab, setTab] = useState<"description" | "hints">("description");

  return (
    <SplitPane
      direction="horizontal"
      storageKey="callback:split:main"
      initial={0.42}
      min={0.25}
      max={0.65}
      className="min-h-0 lg:flex-1"
      first={
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          <div
            role="tablist"
            aria-label="Problem"
            className="flex shrink-0 items-center gap-1 border-b border-zinc-800 px-2"
          >
            <PaneTab
              active={tab === "description"}
              onClick={() => setTab("description")}
            >
              Description
            </PaneTab>
            {hasHints && (
              <PaneTab active={tab === "hints"} onClick={() => setTab("hints")}>
                Hints
              </PaneTab>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {tab === "description" ? description : hints}
          </div>
        </section>
      }
      second={workspace}
    />
  );
}
