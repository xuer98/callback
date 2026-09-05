"use client";

import { useState } from "react";
import { RichText } from "./markdown";
import {
  judgeFor,
  LANGUAGE_LABELS,
  LANGUAGES,
  UI_FRAMEWORK_LABELS,
  uiTemplates,
  type Judge,
  type Language,
  type UiFramework,
  type UiWorkspace,
} from "@/lib/types";

// The Solution tab for problems whose reference comes in more than one shape:
// judged problems (one implementation per language) and UI problems (one file
// set per framework). The approach prose comes first, then the code —
// switchable the same way the editor is — then the interview-signal notes.

const WORTH_SAYING = "\n## Worth saying out loud";

/** Split the prose so the notes can follow the code they talk about. */
function splitProse(
  prose: string | undefined,
): [string | undefined, string | undefined] {
  if (!prose) return [undefined, undefined];
  const at = prose.indexOf(WORTH_SAYING);
  return at === -1 ? [prose, undefined] : [prose.slice(0, at), prose.slice(at + 1)];
}

const CODE_CLASS =
  "overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs leading-6 text-zinc-200";

/** Solutions for a judged problem: one reference implementation per language that has one. */
export function JudgeSolution({
  judge,
  prose,
}: {
  judge: Judge;
  prose?: string;
}) {
  const options = LANGUAGES.flatMap((language) => {
    const code = judgeFor(judge, language)?.solutionCode;
    return code ? [{ language, code }] : [];
  });
  const [language, setLanguage] = useState<Language>(
    options[0]?.language ?? "javascript",
  );
  const current = options.find((o) => o.language === language) ?? options[0];
  const [before, after] = splitProse(prose);

  return (
    <div className="space-y-5">
      {before && (
        <RichText text={before} className="text-sm leading-6 text-zinc-300" />
      )}
      {current && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-zinc-100">
              Reference implementation
            </h2>
            {options.length > 1 && (
              <div className="flex gap-1.5">
                {options.map((o) => (
                  <ChipButton
                    key={o.language}
                    active={o.language === current.language}
                    onClick={() => setLanguage(o.language)}
                  >
                    {LANGUAGE_LABELS[o.language]}
                  </ChipButton>
                ))}
              </div>
            )}
          </div>
          <pre className={CODE_CLASS}>{current.code}</pre>
        </section>
      )}
      {after && (
        <RichText text={after} className="text-sm leading-6 text-zinc-300" />
      )}
    </div>
  );
}

/** Solutions for a UI problem: complete reference files per framework, switchable by file. */
export function UiSolution({
  ui,
  prose,
}: {
  ui: UiWorkspace;
  prose?: string;
}) {
  const solved = uiTemplates(ui).filter(
    (t) => t.solution !== undefined && t.solution.length > 0,
  );
  const [framework, setFramework] = useState<UiFramework>(
    solved[0]?.framework ?? ui.framework,
  );
  const template = solved.find((t) => t.framework === framework) ?? solved[0];
  const [fileName, setFileName] = useState(
    template?.solution?.[0]?.name ?? "",
  );
  const file =
    template?.solution?.find((f) => f.name === fileName) ??
    template?.solution?.[0];

  const pickFramework = (fw: UiFramework) => {
    setFramework(fw);
    setFileName(
      solved.find((t) => t.framework === fw)?.solution?.[0]?.name ?? "",
    );
  };

  const [before, after] = splitProse(prose);

  return (
    <div className="space-y-5">
      {before && (
        <RichText text={before} className="text-sm leading-6 text-zinc-300" />
      )}
      {template && file && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-zinc-100">
              Reference files
            </h2>
            {solved.length > 1 && (
              <div className="flex gap-1.5">
                {solved.map((t) => (
                  <ChipButton
                    key={t.framework}
                    active={t.framework === framework}
                    onClick={() => pickFramework(t.framework)}
                  >
                    {UI_FRAMEWORK_LABELS[t.framework]}
                  </ChipButton>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {template.solution!.map((f) => (
              <ChipButton
                key={f.name}
                active={f.name === file.name}
                onClick={() => setFileName(f.name)}
              >
                {f.name}
              </ChipButton>
            ))}
          </div>
          <pre className={CODE_CLASS}>{file.contents}</pre>
        </section>
      )}
      {after && (
        <RichText text={after} className="text-sm leading-6 text-zinc-300" />
      )}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
        active
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
