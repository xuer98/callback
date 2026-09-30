import type { JudgeLanguage } from "./types";

// TypeScript judges for the Airbnb problems split out of multi-part prompts
// (seed-airbnb-b.ts, seed-airbnb-g.ts and seed-airbnb-h.ts), keyed by slug and
// merged into judge.typescript by the seed script. TypeScript is type-stripped
// and run against the JavaScript driver, so entries mirror the JavaScript
// judge.

export const splitTypescriptJudgesB: Record<string, JudgeLanguage> = {
  "abortable-promise": {
    entry: "__runAbortScenario",
    starterCode: `type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;
type OnAbort = (cleanup: () => void) => void;

class AbortablePromise<T> extends Promise<T> {
  /** executor(resolve, reject, onAbort): onAbort(cleanup) registers how to stop the work. */
  constructor(executor: (resolve: Resolve<T>, reject: Reject, onAbort: OnAbort) => void) {
    super((resolve, reject) => executor(resolve, reject, () => {}));
  }

  /** Pending: run the cleanup, then reject with reason (default: an Error named "AbortError"). Settled: do nothing. */
  abort(reason?: unknown): void {}
}
`,
    solutionCode: `type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;
type OnAbort = (cleanup: () => void) => void;

// Promises can't be cancelled, so cancel the work: the executor registers a
// cleanup, and abort() runs it and rejects — only while still pending.
const abortError = (): Error => Object.assign(new Error("Aborted"), { name: "AbortError" });

class AbortablePromise<T> extends Promise<T> {
  #abort: (reason: unknown) => void;

  constructor(executor: (resolve: Resolve<T>, reject: Reject, onAbort: OnAbort) => void) {
    let abort: (reason: unknown) => void = () => {};
    super((resolve, reject) => {
      let settled = false;           // native promises hide their state, so track it
      let cleanup: (() => void) | null = null;
      const resolveOnce: Resolve<T> = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const rejectOnce: Reject = (reason) => {
        if (settled) return;
        settled = true;
        reject(reason);
      };
      abort = (reason) => {
        if (settled) return;         // settled or already aborted: nothing to do
        settled = true;
        try {
          if (cleanup) cleanup();    // stop the work: clearTimeout, controller.abort(), ...
        } finally {
          reject(reason);
        }
      };
      try {
        executor(resolveOnce, rejectOnce, (fn) => { cleanup = fn; });
      } catch (err) {
        rejectOnce(err);
      }
    });
    this.#abort = abort;
  }

  abort(reason: unknown = abortError()): void {
    this.#abort(reason);
  }

  // Derived promises (then/catch/finally) are plain promises.
  static get [Symbol.species](): PromiseConstructor {
    return Promise;
  }
}
`,
  },
  "implement-throttle": {
    entry: "__runThrottleScenario",
    starterCode: `/** Leading call, then at most one call per wait ms, with a trailing call carrying the latest args. */
function throttle<A extends unknown[]>(fn: (this: unknown, ...args: A) => void, wait: number) {
  return function throttled(this: unknown, ...args: A): void {
    fn.apply(this, args);
  };
}
`,
    solutionCode: `// Throttle: run at most once per \`wait\` ms (leading call + trailing call with latest args).
function throttle<A extends unknown[]>(fn: (this: unknown, ...args: A) => void, wait: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | undefined;
  let lastThis: unknown;
  return function throttled(this: unknown, ...args: A): void {   // function, not arrow: keep caller's \`this\`
    const now = Date.now();
    lastArgs = args;
    lastThis = this;
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      last = now;
      fn.apply(this, args);
    } else if (timer === null) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(lastThis, lastArgs as A);
      }, remaining);
    }
  };
}
`,
  },
  "print-terrain": {
    entry: "printTerrain",
    starterCode: `/** Rows from the top down (height max(water)), joined by "\\n": "#" ground, "~" water, " " air. */
function printTerrain(heights: number[], water: number[]): string {
  return "";
}
`,
    solutionCode: `// Draw terrain + water as ASCII rows, top level first.
function printTerrain(heights: number[], water: number[]): string {
  const top = Math.max(...water);
  const rows: string[] = [];
  for (let level = top; level >= 1; level--) {
    rows.push(heights.map((ground, i) => (level <= ground ? '#' : level <= water[i] ? '~' : ' ')).join(''));
  }
  return rows.join('\\n');
}
`,
  },
  "boxed-sentences-mixed-widths": {
    entry: "renderMultiBox",
    starterCode: `interface Block {
  text: string;
  width: number;
}

/** Greedy word wrap: never split a word; a line never starts with punctuation. */
function wrapWords(sentence: string, width: number): string[] {
  // Your code here
  return [sentence];
}

/** Several sentences, each wrapped at its own width, in one aligned box. */
function renderMultiBox(blocks: Block[]): string {
  return "";
}
`,
    solutionCode: `// Several sentences, each wrapped at its OWN width, inside one aligned box.
interface Block {
  text: string;
  width: number;
}

const LEADING_PUNCT = /^[.,;:!?]/;

// Greedy: append words while they fit; never split a word; a line never starts with punctuation.
function wrapWords(sentence: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of sentence.split(/\\s+/).filter(Boolean)) {
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width || LEADING_PUNCT.test(word)) line += \` \${word}\`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function renderMultiBox(blocks: Block[]): string {
  const inner = Math.max(...blocks.map((b) => b.width));
  const rule = \`+\${'-'.repeat(inner + 2)}+\`;
  const out = [rule];
  blocks.forEach((b, i) => {
    if (i > 0) out.push(\`| \${'-'.repeat(inner)} |\`);              // separator between sentences
    wrapWords(b.text, b.width).forEach((l) => out.push(\`| \${l.padEnd(inner)} |\`));
  });
  out.push(rule);
  return out.join('\\n');
}
`,
  },
  "poker-hand-category": {
    entry: "handCategory",
    starterCode: `type Category =
  | "Straight flush"
  | "Four of a kind"
  | "Full house"
  | "Flush"
  | "Straight"
  | "Three of a kind"
  | "Two pair"
  | "One pair"
  | "High card";

/**
 * @param hand - five distinct cards like "10H", "AS", "QD"
 * @returns the best category that applies
 */
function handCategory(hand: string[]): Category {
  // Your code here
  return "High card";
}
`,
    solutionCode: `type Category =
  | "Straight flush"
  | "Four of a kind"
  | "Full house"
  | "Flush"
  | "Straight"
  | "Three of a kind"
  | "Two pair"
  | "One pair"
  | "High card";

// Classify a five-card hand: a rank histogram plus "flush" and "straight".
const FACE_VALUES: Record<string, number> = { A: 1, J: 11, Q: 12, K: 13 };

function handCategory(hand: string[]): Category {
  const values = hand
    .map((card) => {
      const rank = card.slice(0, -1);            // "10H" is the one three-character card
      return FACE_VALUES[rank] ?? Number(rank);
    })
    .sort((a, b) => a - b);
  const suits = new Set(hand.map((card) => card.slice(-1)));
  const byRank = new Map<number, number>();
  for (const v of values) byRank.set(v, (byRank.get(v) ?? 0) + 1);
  const counts = [...byRank.values()].sort((a, b) => b - a);

  const flush = suits.size === 1;
  const straight =
    counts.length === 5 && (values[4] - values[0] === 4 || values.join() === "1,10,11,12,13"); // ace high

  if (straight && flush) return "Straight flush";
  if (counts[0] === 4) return "Four of a kind";
  if (counts[0] === 3 && counts[1] === 2) return "Full house";
  if (flush) return "Flush";
  if (straight) return "Straight";
  if (counts[0] === 3) return "Three of a kind";
  if (counts[0] === 2 && counts[1] === 2) return "Two pair";
  if (counts[0] === 2) return "One pair";
  return "High card";
}
`,
  },
};
