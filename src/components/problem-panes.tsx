"use client";

import { useState } from "react";
import { PaneTab, SplitPane } from "./resizable";
import { SubmissionHistory, SubmissionsProvider } from "./submissions";

// The judged-problem layout: a tabbed description pane beside the workspace,
// with a draggable divider between them. The tab contents are server-rendered
// and passed in, so the prompt stays static HTML. Hints live inside the
// description (collapsed) rather than behind their own tab. Judged problems
// add a Submissions tab (the signed-in user's graded attempts), which the
// workspace's Submit opens. Every problem gets an Assistant tab, and design
// problems an Interviewer tab as well; both chats stay mounted so a reply
// keeps streaming while the candidate reads the prompt.
export function ProblemPanes({
  slug,
  description,
  solution,
  workspace,
  hasSolution,
  hasSubmissions,
  assistant,
  chat,
}: {
  slug: string;
  description: React.ReactNode;
  solution: React.ReactNode;
  workspace: React.ReactNode;
  hasSolution: boolean;
  hasSubmissions: boolean;
  assistant?: React.ReactNode;
  chat?: React.ReactNode;
}) {
  const [tab, setTab] = useState<
    "description" | "solution" | "submissions" | "assistant" | "chat"
  >("description");

  const panes = (
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
            {hasSubmissions && (
              <PaneTab
                active={tab === "submissions"}
                onClick={() => setTab("submissions")}
              >
                Submissions
              </PaneTab>
            )}
            {chat !== undefined && (
              <PaneTab active={tab === "chat"} onClick={() => setTab("chat")}>
                Interviewer
              </PaneTab>
            )}
            {assistant !== undefined && (
              <PaneTab
                active={tab === "assistant"}
                onClick={() => setTab("assistant")}
              >
                Assistant
              </PaneTab>
            )}
          </div>
          <div
            className={
              tab === "chat" || tab === "assistant"
                ? "hidden"
                : "min-h-0 flex-1 overflow-y-auto px-5 py-5"
            }
          >
            {tab === "submissions" ? (
              <SubmissionHistory />
            ) : tab === "solution" ? (
              solution
            ) : (
              description
            )}
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
          {assistant !== undefined && (
            <div
              className={
                tab === "assistant" ? "flex min-h-0 flex-1 flex-col" : "hidden"
              }
            >
              {assistant}
            </div>
          )}
        </section>
      }
      second={workspace}
    />
  );

  // The provider sits above both panes so Submit (right) and the tab (left)
  // share one history; without a judge there is nothing to share.
  return hasSubmissions ? (
    <SubmissionsProvider slug={slug} onRecorded={() => setTab("submissions")}>
      {panes}
    </SubmissionsProvider>
  ) : (
    panes
  );
}
