"use client";

import { useState } from "react";
import { PaneTab, SplitPane } from "./resizable";

// The judged-problem layout: a tabbed description pane beside the workspace,
// with a draggable divider between them. The tab contents are server-rendered
// and passed in, so the prompt stays static HTML. Hints live inside the
// description (collapsed) rather than behind their own tab. Design problems
// add an Interviewer tab (the chat), which stays mounted so a reply keeps
// streaming while the candidate reads the prompt.
export function ProblemPanes({
  description,
  solution,
  workspace,
  hasSolution,
  chat,
}: {
  description: React.ReactNode;
  solution: React.ReactNode;
  workspace: React.ReactNode;
  hasSolution: boolean;
  chat?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"description" | "solution" | "chat">(
    "description",
  );

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
            {hasSolution && (
              <PaneTab
                active={tab === "solution"}
                onClick={() => setTab("solution")}
              >
                Solution
              </PaneTab>
            )}
            {chat !== undefined && (
              <PaneTab active={tab === "chat"} onClick={() => setTab("chat")}>
                Interviewer
              </PaneTab>
            )}
          </div>
          <div
            className={
              tab === "chat"
                ? "hidden"
                : "min-h-0 flex-1 overflow-y-auto px-5 py-5"
            }
          >
            {tab === "solution" ? solution : description}
          </div>
          {chat !== undefined && (
            <div
              className={
                tab === "chat" ? "flex min-h-0 flex-1 flex-col" : "hidden"
              }
            >
              {chat}
            </div>
          )}
        </section>
      }
      second={workspace}
    />
  );
}
