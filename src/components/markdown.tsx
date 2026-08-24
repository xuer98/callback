import type { ReactNode } from "react";
import { inlineNodes } from "@/lib/markdown-inline";

/**
 * The rich-text renderer for problem content, shared by the description body,
 * the hints, and the one-line summaries on list cards.
 *
 * It is a pragmatic subset of CommonMark + GFM rather than a full parser: the
 * content is authored in this repo, not submitted by users, so the goal is
 * predictable rendering of the constructs a problem statement actually needs.
 * Inline marks live in src/lib/markdown-inline.tsx.
 *
 * Everything here renders on the server — no client bundle, no hydration.
 */

// -- block scanning ----------------------------------------------------------

const FENCE = /^(```|~~~)(.*)$/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*$/;
const BREAK = /^ {0,3}([-*_])(\s*\1){2,}\s*$/;
const BULLET = /^(\s*)([-*+])\s+(.*)$/;
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const DIVIDER = /^\s*\|?(\s*:?-{1,}:?\s*\|)+(\s*:?-{1,}:?\s*)\|?\s*$/;

const HEADING_CLASS: Record<number, string> = {
  1: "pt-2 text-base font-semibold text-zinc-100",
  2: "pt-2 text-[15px] font-semibold text-zinc-100",
  3: "pt-2 text-[15px] font-semibold text-zinc-100",
  4: "pt-1 text-sm font-semibold text-zinc-200",
};

/** Splits a table row on unescaped pipes, dropping the outer ones. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "\\" && line[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (line[i] === "|") {
      cells.push(cell);
      cell = "";
    } else {
      cell += line[i];
    }
  }
  cells.push(cell);
  if (cells[0].trim() === "") cells.shift();
  if (cells.length > 0 && cells[cells.length - 1].trim() === "") cells.pop();
  return cells.map((c) => c.trim());
}

function alignOf(spec: string): "left" | "center" | "right" {
  const s = spec.trim();
  if (s.startsWith(":") && s.endsWith(":")) return "center";
  if (s.endsWith(":")) return "right";
  return "left";
}

/** Leading-space count, with tabs counted as four. */
function indentOf(text: string): number {
  return text.replace(/\t/g, "    ").match(/^ */)![0].length;
}

/**
 * Turns lines into blocks. Lists recurse through here for their item bodies,
 * so a bullet can hold a paragraph, a nested list, or a fenced example.
 */
function parseBlocks(lines: string[], tight = false): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  const key = () => out.length;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    const fence = FENCE.exec(trimmed);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence
      out.push(
        <pre
          key={key()}
          className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs leading-6"
        >
          {dedent(body).join("\n").replace(/\n+$/, "")}
        </pre>,
      );
      continue;
    }

    if (BREAK.test(line)) {
      out.push(<hr key={key()} className="border-zinc-800" />);
      i++;
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      // The page owns the h1, so content headings start one level down.
      const Tag = (["h2", "h2", "h3", "h4", "h5", "h6"] as const)[level - 1];
      out.push(
        <Tag key={key()} className={HEADING_CLASS[Math.min(level, 4)]}>
          {inlineNodes(heading[2], "prose")}
        </Tag>,
      );
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && (QUOTE.test(lines[i]) || body.length === 0)) {
        const q = QUOTE.exec(lines[i]);
        if (!q) break;
        body.push(q[1]);
        i++;
      }
      out.push(
        <blockquote
          key={key()}
          className="space-y-3 border-l-2 border-zinc-700 pl-4 text-zinc-400"
        >
          {parseBlocks(body)}
        </blockquote>,
      );
      continue;
    }

    // A table needs its delimiter row on the very next line.
    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      DIVIDER.test(lines[i + 1]) &&
      splitRow(trimmed).length === splitRow(lines[i + 1].trim()).length
    ) {
      const header = splitRow(trimmed);
      const aligns = splitRow(lines[i + 1].trim()).map(alignOf);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(splitRow(lines[i].trim()));
        i++;
      }
      out.push(table(key(), header, aligns, rows));
      continue;
    }

    if (BULLET.test(line) || ORDERED.test(line)) {
      const [list, next] = parseList(lines, i, key());
      out.push(list);
      i = next;
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length) {
      const next = lines[i];
      if (
        next.trim() === "" ||
        FENCE.test(next.trim()) ||
        HEADING.test(next.trim()) ||
        BREAK.test(next) ||
        QUOTE.test(next) ||
        BULLET.test(next) ||
        ORDERED.test(next)
      ) {
        break;
      }
      paragraph.push(next.trim());
      i++;
    }
    const text = paragraph.join(" ");
    // Inside a list item the text is already wrapped, so a <p> would only add
    // vertical rhythm the item doesn't want.
    out.push(
      tight ? (
        <span key={key()}>{inlineNodes(text, "prose")}</span>
      ) : (
        <p key={key()}>{inlineNodes(text, "prose")}</p>
      ),
    );
  }

  return out;
}

function table(
  key: number,
  header: string[],
  aligns: ("left" | "center" | "right")[],
  rows: string[][],
) {
  const align = (i: number) =>
    aligns[i] === "center"
      ? "text-center"
      : aligns[i] === "right"
        ? "text-right"
        : "text-left";
  return (
    <div
      key={key}
      className="overflow-x-auto rounded-lg border border-zinc-800"
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/60">
            {header.map((cell, c) => (
              <th
                key={c}
                className={`px-3 py-2 font-semibold text-zinc-200 ${align(c)}`}
              >
                {inlineNodes(cell, "prose")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-zinc-800/60 last:border-0">
              {header.map((_, c) => (
                <td key={c} className={`px-3 py-2 text-zinc-300 ${align(c)}`}>
                  {inlineNodes(row[c] ?? "", "prose")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Consumes one list starting at `start`, including any deeper lists nested
 * under its items. Returns the element and the line after the list.
 */
function parseList(
  lines: string[],
  start: number,
  key: number,
): [ReactNode, number] {
  const first = BULLET.exec(lines[start]) ?? ORDERED.exec(lines[start])!;
  const ordered = ORDERED.test(lines[start]) && !BULLET.test(lines[start]);
  const baseIndent = indentOf(first[1]);
  const items: string[][] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      // A blank line ends the list unless the next line continues an item.
      const next = lines[i + 1];
      if (next === undefined || next.trim() === "") break;
      if (
        indentOf(next) <= baseIndent &&
        !BULLET.test(next) &&
        !ORDERED.test(next)
      ) {
        break;
      }
      items[items.length - 1]?.push("");
      i++;
      continue;
    }

    const marker = BULLET.exec(line) ?? ORDERED.exec(line);
    const indent = indentOf(line);
    if (marker && indent <= baseIndent) {
      // A different marker type at the same level starts a new list.
      const isOrdered = ORDERED.test(line) && !BULLET.test(line);
      if (indent < baseIndent || isOrdered !== ordered) break;
      items.push([marker[3]]);
      i++;
      continue;
    }
    if (indent <= baseIndent && items.length > 0) break;
    if (items.length === 0) break;
    // Continuation: strip one level of indent so nested blocks parse cleanly.
    items[items.length - 1].push(line.slice(Math.min(indent, baseIndent + 2)));
    i++;
  }

  const rendered = items.map((body, n) => (
    <li key={n} className="space-y-2">
      {parseBlocks(dedentContinuations(body), true)}
    </li>
  ));

  const Tag = ordered ? "ol" : "ul";
  const element = (
    <Tag
      key={key}
      className={
        ordered
          ? "list-decimal space-y-1.5 pl-5 marker:text-zinc-500"
          : "list-disc space-y-1.5 pl-5 marker:text-zinc-600"
      }
      start={ordered && first[2] !== "1" ? Number(first[2]) : undefined}
    >
      {rendered}
    </Tag>
  );
  return [element, i];
}

/** Removes the shared leading indent so nested content starts at column 0. */
function dedent(lines: string[]): string[] {
  const widths = lines.filter((l) => l.trim() !== "").map(indentOf);
  const min = widths.length > 0 ? Math.min(...widths) : 0;
  return lines.map((l) => l.slice(min));
}

/** The item's own first line is already unindented; the rest may not be. */
function dedentContinuations(body: string[]): string[] {
  return [body[0], ...dedent(body.slice(1))];
}

// -- public components -------------------------------------------------------

/**
 * Block-level rich text: headings, paragraphs, bullet and numbered lists,
 * fenced code, tables, block quotes, rules, images, and every inline mark.
 */
export function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {parseBlocks(text.split("\n"))}
    </div>
  );
}

/**
 * Inline-only rich text for places that are already a single line — the
 * summary on a list card. Block syntax is left as written, links render as
 * their label, and code loses its chip so it fits a small muted line.
 */
export function RichLine({ text }: { text: string }) {
  return <>{inlineNodes(text, "compact")}</>;
}
