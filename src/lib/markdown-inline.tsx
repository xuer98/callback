import type { ReactNode } from "react";

/**
 * The inline half of the problem-content markdown: everything that happens
 * inside a line — `code`, **strong**, *emphasis*, ~~strikethrough~~,
 * [links](url), ![images](url), <autolinks>, and backslash escapes.
 *
 * The emphasis rules are CommonMark's flanking rules rather than a naive split
 * on the delimiter, which is what keeps `max_width` from turning into italics
 * halfway through a sentence and `2 * 3` from doing the same across one.
 *
 * Block structure lives in src/components/markdown.tsx, which is also where
 * the public entry points are.
 */

/** Compact drops block layout and chrome: one line, inside an existing link. */
export type Variant = "prose" | "compact";

// -- text classification -----------------------------------------------------

function isSpace(ch: string): boolean {
  // Start- and end-of-string count as whitespace, per CommonMark.
  return ch === "" || /\s/.test(ch);
}

function isPunct(ch: string): boolean {
  return ch !== "" && !/[\p{L}\p{N}\s]/u.test(ch);
}

/** How many copies of `ch` start at `i`. */
function runLength(text: string, i: number, ch: string): number {
  let n = 0;
  while (text[i + n] === ch) n++;
  return n;
}

/**
 * CommonMark's flanking test for the delimiter run at [start, end). A run can
 * only open emphasis if it hugs the text on its right, and only close if it
 * hugs the text on its left — which is why `2 * 3 = 6` and `precedence, *`
 * stay literal asterisks.
 */
function flanking(text: string, start: number, end: number) {
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  const left =
    !isSpace(after) && (!isPunct(after) || isSpace(before) || isPunct(before));
  const right =
    !isSpace(before) && (!isPunct(before) || isSpace(after) || isPunct(after));
  return { left, right };
}

/** `_` additionally refuses to open or close inside a word: `max_width`. */
function canOpen(text: string, ch: string, start: number, end: number) {
  const { left, right } = flanking(text, start, end);
  if (ch !== "_") return left;
  return left && (!right || isPunct(text[start - 1] ?? ""));
}

function canClose(text: string, ch: string, start: number, end: number) {
  const { left, right } = flanking(text, start, end);
  if (ch !== "_") return right;
  return right && (!left || isPunct(text[end] ?? ""));
}

// -- links -------------------------------------------------------------------

/**
 * Content is trusted, but a bad paste should never become a `javascript:` URL,
 * so the scheme is allow-listed at the boundary. Returns null to render the
 * link as plain text instead.
 */
function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (url === "") return null;
  if (/^(https?:|mailto:)/i.test(url)) return url;
  // Same-origin references: paths, anchors, and query strings.
  if (/^[/#?]/.test(url)) return url;
  // A bare scheme-looking prefix is rejected; anything else is relative.
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? null : url;
}

/**
 * Reads `](destination "title")` starting at the `]`. Returns the destination
 * and the index just past the closing paren, or null if it isn't a link.
 */
function readDestination(text: string, close: number) {
  if (text[close + 1] !== "(") return null;
  let depth = 1;
  let i = close + 2;
  for (; i < text.length && depth > 0; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
  }
  if (depth > 0) return null;
  const inner = text.slice(close + 2, i - 1);
  // Drop an optional "title" — it has no place to render here.
  const dest = inner.replace(/\s+["'(][\s\S]*$/, "").trim();
  return { dest: dest.replace(/^<|>$/g, ""), next: i };
}

/** The matching `]` for the `[` at `open`, skipping nested brackets. */
function matchBracket(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === "[") depth++;
    else if (text[i] === "]" && --depth === 0) return i;
  }
  return -1;
}

// -- inline scanning ---------------------------------------------------------

/** Index of a run that can close `len` copies of `ch`, or -1. */
function findCloser(
  text: string,
  ch: string,
  len: number,
  from: number,
): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text[i] === "`") {
      // Code spans win over emphasis, so `a*b` can't close an open run.
      const run = runLength(text, i, "`");
      const end = text.indexOf("`".repeat(run), i + run);
      i = end === -1 ? i + run - 1 : end + run - 1;
      continue;
    }
    if (text[i] !== ch) continue;
    const n = runLength(text, i, ch);
    if (n >= len && canClose(text, ch, i, i + n)) return i;
    i += n - 1;
  }
  return -1;
}

const CODE_CLASS = {
  prose:
    "rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300 ring-1 ring-inset ring-zinc-800",
  compact: "font-mono text-[0.95em] text-zinc-400",
} as const;

/**
 * Renders one line's worth of inline markup: `code`, **strong**, *emphasis*,
 * ~~strikethrough~~, [links](url), ![images](url), <https://autolinks>, and
 * backslash escapes.
 */
export function inlineNodes(text: string, variant: Variant): ReactNode[] {
  const out: ReactNode[] = [];
  let buffer = "";
  let key = 0;

  const flush = () => {
    if (buffer !== "") {
      out.push(buffer);
      buffer = "";
    }
  };
  const push = (node: ReactNode) => {
    flush();
    out.push(<span key={key++}>{node}</span>);
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (ch === "\\" && isPunct(text[i + 1] ?? "")) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      const run = runLength(text, i, "`");
      const end = text.indexOf("`".repeat(run), i + run);
      if (end !== -1) {
        let code = text.slice(i + run, end);
        // CommonMark strips one space from each end, so ``a ` b`` works.
        if (code.length > 2 && code.startsWith(" ") && code.endsWith(" ")) {
          code = code.slice(1, -1);
        }
        push(<code className={CODE_CLASS[variant]}>{code}</code>);
        i = end + run;
        continue;
      }
    }

    if (ch === "<") {
      const end = text.indexOf(">", i);
      const inner = end === -1 ? "" : text.slice(i + 1, end);
      if (/^(https?:\/\/|mailto:)\S+$/i.test(inner)) {
        push(anchor(inner, inner, variant));
        i = end + 1;
        continue;
      }
    }

    if (ch === "!" && text[i + 1] === "[") {
      const close = matchBracket(text, i + 1);
      const dest = close === -1 ? null : readDestination(text, close);
      if (dest) {
        const src = safeUrl(dest.dest);
        const alt = text.slice(i + 2, close);
        // Inline images only make sense in prose; a card shows the alt text.
        push(src && variant === "prose" ? image(src, alt) : alt);
        i = dest.next;
        continue;
      }
    }

    if (ch === "[") {
      const close = matchBracket(text, i);
      const dest = close === -1 ? null : readDestination(text, close);
      if (dest) {
        const label = inlineNodes(text.slice(i + 1, close), variant);
        const href = safeUrl(dest.dest);
        push(href ? anchor(href, label, variant) : label);
        i = dest.next;
        continue;
      }
    }

    if (ch === "*" || ch === "_" || ch === "~") {
      const n = runLength(text, i, ch);
      // ~~strike~~ is the only two-character form; * and _ nest as usual.
      const lengths = ch === "~" ? [2] : n >= 3 ? [3, 2, 1] : n >= 2 ? [2, 1] : [1];
      let matched = false;
      for (const len of lengths) {
        if (n < len || !canOpen(text, ch, i, i + n)) continue;
        const close = findCloser(text, ch, len, i + n);
        if (close === -1) continue;
        const inner = inlineNodes(text.slice(i + len, close), variant);
        push(wrap(ch, len, inner));
        i = close + len;
        matched = true;
        break;
      }
      if (matched) continue;
      buffer += ch.repeat(n);
      i += n;
      continue;
    }

    buffer += ch;
    i++;
  }

  flush();
  return out;
}

function wrap(ch: string, len: number, inner: ReactNode): ReactNode {
  if (ch === "~") return <s className="text-zinc-500">{inner}</s>;
  if (len === 3) {
    return (
      <strong className="font-semibold text-zinc-100">
        <em>{inner}</em>
      </strong>
    );
  }
  if (len === 2) {
    return <strong className="font-semibold text-zinc-100">{inner}</strong>;
  }
  return <em>{inner}</em>;
}

function anchor(href: string, label: ReactNode, variant: Variant): ReactNode {
  // List cards are wrapped in a Link already, and anchors can't nest.
  if (variant === "compact") return label;
  const external = /^(https?:|mailto:)/i.test(href);
  return (
    <a
      href={href}
      className="font-medium text-emerald-400 underline decoration-emerald-400/40 underline-offset-2 transition-colors hover:text-emerald-300 hover:decoration-emerald-300"
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
    >
      {label}
    </a>
  );
}

function image(src: string, alt: string): ReactNode {
  // Diagrams live on arbitrary hosts, which next/image would need registered
  // in next.config remotePatterns ahead of time — a plain img keeps authoring
  // a matter of pasting a URL.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="my-1 max-w-full rounded-lg border border-zinc-800 bg-zinc-900/40"
    />
  );
}

