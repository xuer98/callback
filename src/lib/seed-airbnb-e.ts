import type { Problem } from "./types";

// Airbnb bank, part E: the general-track phone screen's string slot (boxed
// sentence, URL query parser, review token tagging — 1point3acres, Aug 2026),
// the AI-coding round's retry wrapper, and the FIFO order allocator from the
// same loop's coding round. Judged in JavaScript and TypeScript, with a
// reference implementation in each.

export const airbnbProblemsE: Problem[] = [
  {
    slug: "boxed-sentence",
    title: "Boxed Sentence",
    category: "algorithms",
    difficulty: "easy",
    companies: ["airbnb"],
    summary:
      "Greedy word wrap inside ASCII borders — the phone-screen string slot's most-reported prompt.",
    prompt: `Given a sentence and a width: **(1)** print the sentence in a box, **(2)** wrap it at the width, **(3)** bonus: several sentences with *different* widths in the same box. Reported on an Airbnb general-track phone screen (Aug 2026); the 2016 frontend onsite asked it as "text justification".

\`\`\`
renderBox("one two three four", 8)
+----------+
| one two  |
| three    |
| four     |
+----------+
\`\`\`

## Rules

- Wrap greedily: keep appending words while the line stays within the width. **Never split a word** — a word longer than the width gets a line of its own.
- **A line must never start with punctuation** (\`. , ; : ! ?\`): a punctuation "word" joins the current line even if that overflows the width.
- Borders are \`+---+\` (width + 2 dashes) and \`| … |\`; body lines are padded to the width. Return the picture as lines joined by \`"\\n"\`.
- The bonus box is as wide as its widest block; blocks are separated by a \`| ---- |\` line of dashes.

\`\`\`
renderMultiBox([{ text: "one two three four", width: 8 }, { text: "a much longer sentence here", width: 16 }])
+------------------+
| one two          |
| three            |
| four             |
| ---------------- |
| a much longer    |
| sentence here    |
+------------------+
\`\`\`

## Worth asking out loud

Multiple spaces between words? What about a word longer than the width? Ragged right, or full justification with spread spaces? Does the separator line count toward anything?`,
    hints: [
      "Split on whitespace and accumulate greedily: start a new line only when `line.length + 1 + word.length` would exceed the width.",
      "The punctuation rule is one extra OR in that fit check — a word matching `^[.,;:!?]` is appended no matter what.",
      "For the multi-width bonus, every block wraps at its *own* width but pads to the widest one; the separator is a line of dashes as wide as the inner box.",
    ],
    solution: `## Approach

Wrapping is a greedy scan: append a word while the line still fits, otherwise start a new line — and never split a word, so an oversized word simply owns its line. The punctuation rule is a second clause in the same fit check: a word that starts with punctuation is appended even when it overflows, because the alternative (a line beginning with a comma) is the thing the prompt forbids. Boxing is \`padEnd\` inside \`| … |\` between two \`+---+\` rules. The multi-width bonus wraps each block at its own width but pads to the widest block, with a dashed separator line between blocks.

## Worth saying out loud

- Say the greedy invariant before coding: "a line holds the most words that fit, in order" — that's what makes the output deterministic.
- \`padEnd\` is the whole alignment story; hand-rolled space counting is where box drawings go wrong.
- Full justification (LeetCode 68) is the cousin question: distribute the slack across the gaps, left-heavy, last line left-justified. Name it if the interviewer asks about "even spacing".`,
    judge: {
      solutionCode: `// Word wrap → boxed sentence (phone screen, Aug 2026; FE onsite 2016 as "text justification")
// Greedy: append words while they fit; never split a word; a line never starts with punctuation.
const LEADING_PUNCT = /^[.,;:!?]/;

function wrapWords(sentence, width) {
  const lines = [];
  let line = '';
  for (const word of sentence.split(/\\s+/).filter(Boolean)) {
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width || LEADING_PUNCT.test(word)) line += \` \${word}\`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

// Part 1/2: one sentence in a box, wrapped at \`width\`.
function renderBox(sentence, width) {
  const rule = \`+\${'-'.repeat(width + 2)}+\`;
  const body = wrapWords(sentence, width).map((l) => \`| \${l.padEnd(width)} |\`);
  return [rule, ...body, rule].join('\\n');
}

// Part 3 (bonus): several sentences, each with its OWN wrap width, inside one aligned outer box.
function renderMultiBox(blocks /* [{ text, width }] */) {
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
      starterCode: `/** Greedy word wrap: never split a word; a line never starts with punctuation. */
function wrapWords(sentence, width) {
  // Your code here
  return [sentence];
}

/** One sentence in a box, wrapped at width. Lines joined by "\\n". */
function renderBox(sentence, width) {
  return "";
}

/** Bonus: several sentences, each with its own wrap width, in one aligned box. blocks: [{ text, width }] */
function renderMultiBox(blocks) {
  return "";
}
`,
      entry: "__judgeBox",
      driverCode: `function __judgeBox(kind, a, b) {
  if (kind === "wrap") return wrapWords(a, b);
  if (kind === "box") return renderBox(a, b);
  return renderMultiBox(a);
}`,
      tests: [
        { name: "Wrap the example", input: ["wrap", "one two three four", 8], expected: ["one two", "three", "four"] },
        { name: "Wrap at sixteen", input: ["wrap", "a much longer sentence here", 16], expected: ["a much longer", "sentence here"] },
        { name: "An exact fit stays on one line", input: ["wrap", "ab cd", 5], expected: ["ab cd"] },
        { name: "A long word is never split", input: ["wrap", "extraordinary day", 5], expected: ["extraordinary", "day"] },
        { name: "Punctuation never starts a line", input: ["wrap", "wait , what", 5], expected: ["wait ,", "what"] },
        { name: "Extra whitespace collapses", input: ["wrap", "  spaced   out  ", 6], expected: ["spaced", "out"] },
        {
          name: "One sentence in a box",
          input: ["box", "one two three four", 8],
          expected: "+----------+\n| one two  |\n| three    |\n| four     |\n+----------+",
        },
        { name: "An empty sentence is an empty box", input: ["box", "", 4], expected: "+------+\n+------+" },
        {
          name: "Two widths in one box",
          input: ["multi", [{ text: "one two three four", width: 8 }, { text: "a much longer sentence here", width: 16 }]],
          expected:
            "+------------------+\n| one two          |\n| three            |\n| four             |\n| ---------------- |\n| a much longer    |\n| sentence here    |\n+------------------+",
        },
        {
          name: "Three widths in one box",
          input: [
            "multi",
            [
              { text: "check in after three", width: 15 },
              { text: "no parties or smoking", width: 16 },
              { text: "quiet hours from ten to eight", width: 32 },
            ],
          ],
          expected:
            "+----------------------------------+\n| check in after                   |\n| three                            |\n| -------------------------------- |\n| no parties or                    |\n| smoking                          |\n| -------------------------------- |\n| quiet hours from ten to eight    |\n+----------------------------------+",
        },
      ],
    },
  },
  {
    slug: "parse-query-string",
    title: "URL Query-String Parser",
    category: "algorithms",
    difficulty: "easy",
    companies: ["airbnb"],
    summary:
      "Split first, decode second — the ordering that makes the encoded-ampersand case work.",
    prompt: `Parse the query string of a URL into an object — one of the three prompts rotating through Airbnb's general-track phone-screen string slot (last reported Aug 2026).

\`\`\`
parseQuery("?a=b&c=d")   ->  { a: "b", c: "d" }
\`\`\`

## Rules

- A key with no \`=\` is a flag: its value is \`true\`.
- A repeated key collects its values into an array, in order.
- Percent-decode keys and values **after** splitting on \`&\` and \`=\`, so \`%26\` inside a value stays a literal \`&\`. \`+\` decodes to a space.
- Ignore everything from \`#\` on (the fragment) and empty segments (\`a=1&&b=2&\`).
- No \`?\` in the URL → \`{}\`. A value that fails to decode is returned as-is rather than throwing.

## Worth asking out loud

Typed values (\`"2"\` → \`2\`, \`"true"\` → \`true\`)? Bracket syntax like \`a[]=1\`? Should a repeated key keep only the last value instead? Is the input a full URL or just the query?`,
    hints: [
      "Slice from the first `?`, cut at `#`, then split on `&` and then on the first `=` per part — decoding only after both splits is what keeps `%26` from being treated as a separator.",
      "Wrap `decodeURIComponent` in a try/catch (malformed input like `%E0%A4%A` throws) and replace `+` with a space before decoding.",
      "First value wins the slot; a second occurrence turns the slot into an array; further ones push onto it.",
    ],
    solution: `## Approach

Cut the string down before doing anything clever: everything from the first \`?\`, nothing from \`#\` on. Then split on \`&\`, and each part on its **first** \`=\` — a value can legitimately contain more \`=\` — and decode key and value only after both splits, which is exactly why an encoded ampersand survives. The shape rules are small: a bare key is \`true\`, a repeated key upgrades its slot to an array, empty parts are skipped, and a value that won't decode is passed through instead of taking the whole parse down.

## Worth saying out loud

- Decode-after-split is the one-sentence insight; say it before the interviewer asks about \`%26\`.
- \`decodeURIComponent\` throws on malformed sequences — a query parser that can crash on user input is a bug, hence the try/catch pass-through.
- Typed values (numbers, booleans, \`!flag\`) and bracket syntax (\`a[]=1\`) are real variants; clarify which dialect you're parsing before adding either.`,
    judge: {
      solutionCode: `// URL query-string parser (phone screen, Aug 2026)
// ?a=b&c=d → {a:'b', c:'d'}; bare key → true; repeated key → array; percent-decoding after splitting.
const decode = (s) => { try { return decodeURIComponent(s.replace(/\\+/g, ' ')); } catch { return s; } };

function parseQuery(url) {
  const q = url.indexOf('?');
  if (q === -1) return {};
  const query = url.slice(q + 1).split('#')[0];                       // drop the fragment
  const out = {};
  for (const part of query.split('&')) {
    if (!part) continue;                                              // trailing "&" / "&&" are no-ops
    const eq = part.indexOf('=');
    const key = decode(eq === -1 ? part : part.slice(0, eq));         // decode AFTER splitting on & and =
    const value = eq === -1 ? true : decode(part.slice(eq + 1));
    if (!(key in out)) out[key] = value;
    else if (Array.isArray(out[key])) out[key].push(value);
    else out[key] = [out[key], value];
  }
  return out;
}
`,
      starterCode: `/**
 * "?a=b&c=d" -> { a: "b", c: "d" }. A bare key is true; a repeated key becomes
 * an array; percent-decode after splitting; drop the #fragment; no "?" -> {}.
 */
function parseQuery(url) {
  // Your code here
  return {};
}
`,
      entry: "parseQuery",
      tests: [
        { name: "Two pairs", input: ["?a=b&c=d"], expected: { a: "b", c: "d" } },
        { name: "A bare key is a flag", input: ["https://x.com/rooms?guests=2&pets"], expected: { guests: "2", pets: true } },
        { name: "A repeated key collects an array", input: ["?tag=pool&tag=wifi&tag=parking"], expected: { tag: ["pool", "wifi", "parking"] } },
        { name: "Decode after splitting", input: ["?q=a%26b%3Dc"], expected: { q: "a&b=c" } },
        { name: "Plus is a space", input: ["?q=palm+springs"], expected: { q: "palm springs" } },
        { name: "The fragment is dropped", input: ["/search?a=1#b=2"], expected: { a: "1" } },
        { name: "No query string", input: ["/search"], expected: {} },
        { name: "Empty segments are skipped", input: ["?a=1&&b=2&"], expected: { a: "1", b: "2" } },
        { name: "A malformed value is kept as-is", input: ["?q=%E0%A4%A"], expected: { q: "%E0%A4%A" } },
        { name: "An empty value is an empty string", input: ["?a="], expected: { a: "" } },
        { name: "Keys decode too", input: ["?a%20b=1"], expected: { "a b": "1" } },
        { name: "A lone question mark", input: ["?"], expected: {} },
      ],
    },
  },
  {
    slug: "review-token-tagging",
    title: "Review Token Tagging",
    category: "algorithms",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Case-insensitive, longest match wins, original text preserved — a trie walk from every offset.",
    prompt: `Tag the tokens in a guest review — reported on an Airbnb senior phone screen (Aug 2026). Given the review text and a map of token → label, wrap each **case-insensitive** occurrence of a token as \`[label]{original text}\`, keeping the review's original casing inside the braces.

\`\`\`
tagTokens("Great WiFi here", { wifi: "amenity" })   ->  "Great [amenity]{WiFi} here"
\`\`\`

## Rules

- Multi-word tokens (\`"hot tub"\`) match across the space.
- When several tokens match at the same position, the **longest** wins: with \`pool\` and \`pool view\` both defined, \`"pool view"\` is tagged once, as the longer token.
- Every occurrence is tagged; text that matches nothing is passed through unchanged. An empty token map returns the review untouched.

## Worth asking out loud

Should matches respect word boundaries (does \`pool\` match inside \`carpool\`)? Can tagged regions overlap or nest? Tens of thousands of tokens — does the algorithm need to be linear in the review length?`,
    hints: [
      "Build a trie over the lowercased tokens and store the label on each token's final node. Then walk from every offset of the lowercased review.",
      "Don't stop at the first terminal node — keep walking while the trie still has a path and remember the last terminal you passed. That's what makes the longest match win.",
      "Slice the *original* review for the braces, advance past the match, and fall through one character at a time when nothing matches.",
    ],
    solution: `## Approach

A trie over the lowercased tokens, walked from every offset of the lowercased review. At each offset, follow the trie as far as the text allows and remember the *last* terminal node passed — that is the longest match — then emit \`[label]{…}\` around the slice of the **original** review (so casing survives) and jump past it; with no match, copy one character and move on. Hash-set lookups per length would be O(n · k) per offset; the trie makes each offset cost the length of the longest candidate instead.

## Worth saying out loud

- "Longest match wins" is the clarifying question that scores; the trie walk answers it for free by continuing after the first terminal.
- Word boundaries are a real question (\`pool\` inside \`carpool\`) — ask before assuming either way.
- Tens of thousands of tokens and long reviews: Aho–Corasick gives one linear pass; say the name, don't write it.`,
    judge: {
      solutionCode: `// Review token tagging (senior phone screen, Aug 2026)
// Wrap each case-insensitive occurrence of a token as [label]{original text}; multi-word tokens
// match across whitespace; longest match wins at a given offset. Trie over lowercased tokens.
function tagTokens(review, tokens) {
  const root = {};
  for (const [token, label] of Object.entries(tokens)) {
    let node = root;
    for (const ch of token.toLowerCase()) node = node[ch] ??= {};
    node.$ = label;                                                    // terminal marker
  }
  const lower = review.toLowerCase();
  let out = '';
  let i = 0;
  while (i < lower.length) {
    let node = root;
    let best = null;                                                   // { end, label }
    for (let j = i; j < lower.length && (node = node[lower[j]]); j++) {
      if (node.$) best = { end: j + 1, label: node.$ };                // keep going → longest match
    }
    if (best) { out += \`[\${best.label}]{\${review.slice(i, best.end)}}\`; i = best.end; }
    else { out += review[i]; i++; }
  }
  return out;
}
`,
      starterCode: `/**
 * Wrap each case-insensitive occurrence of a token as [label]{original text}.
 * Multi-word tokens match across a space; the longest match wins at an offset.
 * @param {string} review
 * @param {Record<string, string>} tokens - token -> label
 */
function tagTokens(review, tokens) {
  // Your code here
  return review;
}
`,
      entry: "tagTokens",
      tests: [
        { name: "Case-insensitive, original casing kept", input: ["Great WiFi here", { wifi: "amenity" }], expected: "Great [amenity]{WiFi} here" },
        { name: "The longest match wins", input: ["loved the pool view", { pool: "amenity", "pool view": "view" }], expected: "loved the [view]{pool view}" },
        { name: "Multi-word tokens", input: ["The hot tub was warm", { "hot tub": "amenity" }], expected: "The [amenity]{hot tub} was warm" },
        { name: "Every occurrence is tagged", input: ["Pool, pool, POOL", { pool: "amenity" }], expected: "[amenity]{Pool}, [amenity]{pool}, [amenity]{POOL}" },
        { name: "No match, no change", input: ["Quiet street", { pool: "amenity" }], expected: "Quiet street" },
        { name: "No tokens, no change", input: ["Anything", {}], expected: "Anything" },
        { name: "A token at the very end", input: ["Close to the beach", { beach: "location" }], expected: "Close to the [location]{beach}" },
        { name: "Adjacent tokens", input: ["kitchen wifi", { kitchen: "amenity", wifi: "amenity" }], expected: "[amenity]{kitchen} [amenity]{wifi}" },
        { name: "A longer token that isn't present doesn't block the shorter", input: ["the view", { view: "view", viewpoint: "place" }], expected: "the [view]{view}" },
        { name: "Labels are per token", input: ["Host Maya was great", { maya: "host" }], expected: "Host [host]{Maya} was great" },
      ],
    },
  },
  {
    slug: "retry-wrapper",
    title: "Retry Wrapper",
    category: "algorithms",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Pluggable backoff, a retryable filter, hooks, and an abort signal — the AI-coding round's prompt.",
    prompt: `Implement a retry wrapper — the prompt of Airbnb's new (2026) AI-coding round, where Claude Code is available but you still own the code: *"verify exception boundaries, attempt counting, sleep placement, and tests instead of accepting a generated wrapper as-is."*

\`\`\`
const retryer = new Retryer({ maxAttempts: 3, backoff: backoff.exponentialJitter(200), isRetryable: (err) => err.status >= 500 });
await retryer.run((attempt) => fetchJson(url));       // resolves with fn's value, or rethrows
const safeFetch = retryer.wrap(fetchJson);              // decorator form
\`\`\`

## Contract

- \`backoff\` strategies map an attempt number (0-based) to a delay in ms: \`fixed(ms)\`, \`linear(ms)\` (ms × (attempt + 1)), \`exponential(base, cap)\` (min(cap, base × 2^attempt)), and \`exponentialJitter(base, cap, random)\` (the exponential delay × [0.5, 1.5), using the injected \`random\`).
- \`new Retryer({ maxAttempts = 3, backoff, isRetryable = () => true, onAttempt, onFailure, sleep })\`. \`sleep(ms)\` defaults to a real timer; the grader injects one that only records the delay.
- \`run(fn, { signal })\`: call \`fn(attempt)\` up to \`maxAttempts\` times. Before each attempt call \`signal?.throwIfAborted?.()\`, then \`onAttempt(attempt)\`. On failure call \`onFailure(err, attempt)\`; rethrow immediately if the error isn't retryable or this was the last attempt; otherwise \`await sleep(backoff(attempt))\` and try again. Resolve with \`fn\`'s value.
- \`wrap(fn)\` returns \`(...args) => run(() => fn(...args))\`.

## Worth asking out loud

Is the operation idempotent — should the caller pass an idempotency key? Must cancellation be honored mid-sleep as well as between attempts? Which errors are retryable by default? Where do logging and metrics hook in?`,
    hints: [
      "Loop over attempts; put the `await fn(attempt)` *inside* the try so async rejections are caught, and rethrow when the error fails `isRetryable` or you're on the last attempt.",
      "Sleep only *between* attempts — after a failure that will be retried — never after the last one. The injected `sleep` makes that ordering observable.",
      "Keep the strategies as tiny factories returning `(attempt) => ms`; jitter multiplies by `0.5 + random()` so a fleet of clients doesn't retry in lockstep.",
    ],
    solution: `## Approach

Compose three pluggable pieces — a backoff strategy, a retryable-error filter, and hooks — around one loop. The loop's shape is the whole test: check the abort signal, call the attempt hook, \`await fn(attempt)\` **inside** a try so async rejections are caught, and on failure decide between rethrowing (last attempt or non-retryable) and sleeping for \`backoff(attempt)\` before the next round. Injecting \`sleep\` (and \`random\` for jitter) keeps every path unit-testable without waiting.

## Worth saying out loud

- The signal in an AI-assisted round is the review and the tests, not the generation: write the failure-path tests yourself (non-retryable → one call; exhausted → last error rethrown; the backoff sequence) and fix what the tool got wrong out loud.
- Retrying a non-idempotent operation is the discussion edge case — surface an idempotency key in the API rather than pretending retries are free.
- Don't swallow cancellation: an abort should propagate as its own error, never be retried, and ideally interrupt a sleep in progress.
- Extensions that fit the shape: a circuit breaker in front of \`run\`, a retry budget shared across callers, and metrics from the two hooks.`,
    judge: {
      solutionCode: `// Retryer (onsite "AI coding" round, Aug 2026 — Claude Code available; you still own the code).
// Composes three pluggable pieces: backoff strategy, retryable-error filter, hooks.
const backoff = {
  fixed: (ms) => () => ms,
  linear: (ms) => (attempt) => ms * (attempt + 1),
  exponential: (base, cap = 30_000) => (attempt) => Math.min(cap, base * 2 ** attempt),
  // jitter prevents synchronized retry storms: delay * [0.5, 1.5)
  exponentialJitter: (base, cap = 30_000, random = Math.random) => (attempt) =>
    Math.min(cap, base * 2 ** attempt) * (0.5 + random()),
};

class Retryer {
  constructor({
    maxAttempts = 3,
    backoff: delayFor = backoff.exponentialJitter(200),
    isRetryable = () => true,                         // e.g. (err) => err.status >= 500
    onAttempt = () => {},                             // hooks: logging / metrics
    onFailure = () => {},
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = {}) {
    Object.assign(this, { maxAttempts, delayFor, isRetryable, onAttempt, onFailure, sleep });
  }

  async run(fn, { signal } = {}) {
    for (let attempt = 0; ; attempt++) {
      signal?.throwIfAborted?.();
      this.onAttempt(attempt);
      try {
        return await fn(attempt);                     // await INSIDE try so async rejections are caught
      } catch (err) {
        const last = attempt === this.maxAttempts - 1;
        this.onFailure(err, attempt);
        if (last || !this.isRetryable(err)) throw err; // re-raise the last / non-retryable error
        await this.sleep(this.delayFor(attempt));
      }
    }
  }

  // Decorator form: const safeFetch = retryer.wrap(fetchJson)
  wrap(fn) { return (...args) => this.run(() => fn(...args)); }
}
`,
      starterCode: `// Backoff strategies: (attempt) => delay in ms, attempt starting at 0.
const backoff = {
  fixed: (ms) => () => ms,
  linear: (ms) => (attempt) => 0,
  exponential: (base, cap = 30_000) => (attempt) => 0,
  /** Jitter spreads synchronized retries: delay * [0.5, 1.5). */
  exponentialJitter: (base, cap = 30_000, random = Math.random) => (attempt) => 0,
};

class Retryer {
  constructor({
    maxAttempts = 3,
    backoff: delayFor = backoff.exponentialJitter(200),
    isRetryable = () => true,
    onAttempt = () => {},
    onFailure = () => {},
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {}) {
    // Your state here
  }

  /** Run fn(attempt) until it resolves; rethrow the last (or a non-retryable) error. Honors signal.throwIfAborted(). */
  async run(fn, { signal } = {}) {
    return fn(0);
  }

  /** Decorator form: retryer.wrap(fetchJson) returns a retrying version. */
  wrap(fn) {
    return (...args) => this.run(() => fn(...args));
  }
}
`,
      entry: "__runRetryScenario",
      // Scenarios inject a recording sleep and a fixed random, so backoff
      // sequences are observed exactly and no time passes.
      driverCode: `async function __runRetryScenario(kind) {
  const log = [];
  const sleeps = [];
  const sleep = async (ms) => { sleeps.push(ms); };
  let calls = 0;
  const failingUntil = (n, result = "ok") => async () => {
    calls++;
    if (calls <= n) {
      const err = new Error("fail " + calls);
      err.retryable = true;
      throw err;
    }
    return result;
  };
  const summarize = async (promise) => {
    try {
      const result = await promise;
      return { result, calls, sleeps, log };
    } catch (err) {
      return { error: err.message, name: err.name, calls, sleeps, log };
    }
  };
  switch (kind) {
    case "first-try":
      return summarize(new Retryer({ sleep }).run(failingUntil(0)));
    case "retries-then-succeeds":
      return summarize(new Retryer({ maxAttempts: 3, backoff: backoff.fixed(100), sleep }).run(failingUntil(2)));
    case "exhausted":
      return summarize(new Retryer({ maxAttempts: 3, backoff: backoff.fixed(50), sleep }).run(failingUntil(99)));
    case "non-retryable":
      return summarize(
        new Retryer({ maxAttempts: 5, backoff: backoff.fixed(50), sleep, isRetryable: (err) => err.retryable === true }).run(async () => {
          calls++;
          const err = new Error("bad request");
          err.retryable = false;
          throw err;
        }),
      );
    case "exponential":
      return summarize(new Retryer({ maxAttempts: 4, backoff: backoff.exponential(100, 350), sleep }).run(failingUntil(99)));
    case "linear":
      return summarize(new Retryer({ maxAttempts: 4, backoff: backoff.linear(100), sleep }).run(failingUntil(99)));
    case "jitter":
      return summarize(new Retryer({ maxAttempts: 3, backoff: backoff.exponentialJitter(100, 30000, () => 0.25), sleep }).run(failingUntil(99)));
    case "hooks":
      return summarize(
        new Retryer({
          maxAttempts: 3,
          backoff: backoff.fixed(10),
          sleep,
          onAttempt: (attempt) => log.push("attempt " + attempt),
          onFailure: (err, attempt) => log.push("failure " + attempt + ": " + err.message),
        }).run(failingUntil(1)),
      );
    case "aborted": {
      const signal = {
        aborted: true,
        throwIfAborted() {
          const err = new Error("Aborted");
          err.name = "AbortError";
          throw err;
        },
      };
      return summarize(new Retryer({ sleep }).run(failingUntil(0), { signal }));
    }
    default: {
      const retryer = new Retryer({ maxAttempts: 2, backoff: backoff.fixed(5), sleep });
      const add = retryer.wrap(async (a, b) => { calls++; return a + b; });
      return summarize(add(2, 3));
    }
  }
}`,
      tests: [
        { name: "Succeeds on the first try", input: ["first-try"], expected: { result: "ok", calls: 1, sleeps: [], log: [] } },
        { name: "Retries, then succeeds", input: ["retries-then-succeeds"], expected: { result: "ok", calls: 3, sleeps: [100, 100], log: [] } },
        { name: "Exhausted attempts rethrow the last error", input: ["exhausted"], expected: { error: "fail 3", name: "Error", calls: 3, sleeps: [50, 50], log: [] } },
        { name: "A non-retryable error stops immediately", input: ["non-retryable"], expected: { error: "bad request", name: "Error", calls: 1, sleeps: [], log: [] } },
        { name: "Exponential backoff with a cap", input: ["exponential"], expected: { error: "fail 4", name: "Error", calls: 4, sleeps: [100, 200, 350], log: [] } },
        { name: "Linear backoff", input: ["linear"], expected: { error: "fail 4", name: "Error", calls: 4, sleeps: [100, 200, 300], log: [] } },
        { name: "Jitter uses the injected random", input: ["jitter"], expected: { error: "fail 3", name: "Error", calls: 3, sleeps: [75, 150], log: [] } },
        { name: "Hooks fire per attempt and per failure", input: ["hooks"], expected: { result: "ok", calls: 2, sleeps: [10], log: ["attempt 0", "failure 0: fail 1", "attempt 1"] } },
        { name: "An aborted signal is honored before the first call", input: ["aborted"], expected: { error: "Aborted", name: "AbortError", calls: 0, sleeps: [], log: [] } },
        { name: "wrap forwards arguments", input: ["wrap"], expected: { result: 5, calls: 1, sleeps: [], log: [] } },
      ],
    },
  },
  {
    slug: "fifo-order-allocator",
    title: "FIFO Order Allocator",
    category: "algorithms",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Consume the oldest stock first and say which lots an order drew from — an implementation prompt with tie-break rules.",
    prompt: `Reported from an Airbnb general-track coding round (Aug 2026) as: *"quantity in, existing stock, consume the oldest stock first, output with reference ids — implementation plus tie-break rules, no algorithm."* The report was one line; the exact rules below are Callback's, chosen to be the natural ones.

\`\`\`
allocator.receive(lotId, quantity, receivedAt)   // add stock
allocator.allocate(orderId, quantity)            // -> [{ lotId, quantity }, ...] or null
allocator.available()                            // -> total units in stock
allocator.lots()                                 // -> remaining lots in consumption order
\`\`\`

## Rules

- Orders draw from the **oldest** lot first (smallest \`receivedAt\`); lots with the same \`receivedAt\` are consumed in the order they were received.
- A lot may be consumed partially; the remainder stays at the front. Exhausted lots disappear from \`lots()\`.
- Allocation is **all-or-nothing**: if stock can't cover the whole order, return \`null\` and change nothing.
- \`allocate\` returns the lots drawn from, in consumption order, with the quantity taken from each. A quantity of 0 allocates nothing and returns \`[]\`.
- Lots can arrive out of \`receivedAt\` order.

## Worth asking out loud

Partial fills or all-or-nothing? What breaks a tie on \`receivedAt\`? Can the same \`lotId\` be received twice? Do we need an order → allocations ledger for auditing, or reversals when an order is cancelled?`,
    hints: [
      "Keep the lots as an array sorted by (receivedAt, arrival sequence) — a stamp you assign on receive() makes the tie-break explicit rather than relying on sort stability.",
      "Check `available() >= quantity` before touching anything, so all-or-nothing falls out naturally; then walk from the front taking min(lot.quantity, remaining) until remaining hits zero.",
    ],
    solution: `## Approach

Keep the lots in one array sorted by \`(receivedAt, arrival sequence)\` — the sequence stamp makes the tie-break explicit instead of leaning on sort stability. \`allocate\` first checks the total, so all-or-nothing costs nothing extra, then walks from the front taking \`min(lot.quantity, remaining)\` from each lot, trimming partial lots and dropping exhausted ones. The output is exactly the trail of that walk: which lots, how much from each, in consumption order.

## Worth saying out loud

- Ask the two rule questions before coding — partial vs all-or-nothing and the tie-break — they're what the interviewer is grading on an "implementation, no algorithm" prompt.
- The sorted-on-insert array is O(n log n) per receive; a heap keyed by \`(receivedAt, seq)\` makes receive O(log n) and keeps allocate a front-pop loop. Name it, don't switch unless asked.
- A ledger (\`orderId → allocations\`) is one Map away and is what makes cancellations and audits possible — the \`orderId\` parameter is the hook for it.`,
    judge: {
      solutionCode: `// FIFO stock allocation: consume the oldest lot first, partially if needed,
// and hand back which lots an order drew from. All-or-nothing on shortage.
class StockAllocator {
  #lots = [];   // [{ lotId, quantity, receivedAt, seq }] kept sorted: receivedAt asc, then arrival order
  #seq = 0;

  receive(lotId, quantity, receivedAt) {
    if (quantity <= 0) return;
    this.#lots.push({ lotId, quantity, receivedAt, seq: this.#seq++ });
    this.#lots.sort((a, b) => a.receivedAt - b.receivedAt || a.seq - b.seq);
  }

  available() {
    return this.#lots.reduce((sum, lot) => sum + lot.quantity, 0);
  }

  lots() {
    return this.#lots.map(({ lotId, quantity, receivedAt }) => ({ lotId, quantity, receivedAt }));
  }

  allocate(orderId, quantity) {
    if (quantity <= 0) return [];
    if (this.available() < quantity) return null;    // all-or-nothing: leave the stock untouched
    const allocations = [];
    let remaining = quantity;
    while (remaining > 0) {
      const lot = this.#lots[0];                       // the oldest lot is always at the front
      const take = Math.min(lot.quantity, remaining);
      allocations.push({ lotId: lot.lotId, quantity: take });
      lot.quantity -= take;
      remaining -= take;
      if (lot.quantity === 0) this.#lots.shift();
    }
    return allocations;
  }
}
`,
      starterCode: `class StockAllocator {
  constructor() {
    // Your state here
  }

  /** Add a lot of stock. Lots are consumed oldest receivedAt first; ties in the order received. */
  receive(lotId, quantity, receivedAt) {
    // Your code here
  }

  /**
   * Fill an order from the oldest stock. All-or-nothing: null (and no change) when stock is short.
   * @returns {Array<{ lotId: string, quantity: number }> | null}
   */
  allocate(orderId, quantity) {
    return null;
  }

  /** Total units still in stock. */
  available() {
    return 0;
  }

  /** Remaining lots in consumption order: [{ lotId, quantity, receivedAt }] */
  lots() {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let allocator = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "StockAllocator") {
      allocator = new StockAllocator();
      out.push(null);
    } else {
      out.push(allocator[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "The oldest lot goes first",
          input: [["StockAllocator", "receive", "receive", "allocate", "available", "lots"], [[], ["A", 5, 1], ["B", 5, 2], ["o1", 3], [], []]],
          expected: [null, null, null, [{ lotId: "A", quantity: 3 }], 7, [{ lotId: "A", quantity: 2, receivedAt: 1 }, { lotId: "B", quantity: 5, receivedAt: 2 }]],
        },
        {
          name: "An order can span lots",
          input: [["StockAllocator", "receive", "receive", "receive", "allocate", "lots"], [[], ["A", 2, 1], ["B", 5, 2], ["C", 4, 3], ["o1", 6], []]],
          expected: [null, null, null, null, [{ lotId: "A", quantity: 2 }, { lotId: "B", quantity: 4 }], [{ lotId: "B", quantity: 1, receivedAt: 2 }, { lotId: "C", quantity: 4, receivedAt: 3 }]],
        },
        {
          name: "Shortage is all-or-nothing",
          input: [["StockAllocator", "receive", "allocate", "available", "lots"], [[], ["A", 3, 1], ["o1", 5], [], []]],
          expected: [null, null, null, 3, [{ lotId: "A", quantity: 3, receivedAt: 1 }]],
        },
        {
          name: "Ties keep the order received",
          input: [["StockAllocator", "receive", "receive", "allocate"], [[], ["A", 1, 5], ["B", 1, 5], ["o1", 2]]],
          expected: [null, null, null, [{ lotId: "A", quantity: 1 }, { lotId: "B", quantity: 1 }]],
        },
        {
          name: "Lots can arrive out of order",
          input: [["StockAllocator", "receive", "receive", "allocate"], [[], ["B", 3, 10], ["A", 3, 1], ["o1", 4]]],
          expected: [null, null, null, [{ lotId: "A", quantity: 3 }, { lotId: "B", quantity: 1 }]],
        },
        {
          name: "Exact depletion empties the stock",
          input: [["StockAllocator", "receive", "allocate", "available", "lots", "allocate"], [[], ["A", 4, 1], ["o1", 4], [], [], ["o2", 1]]],
          expected: [null, null, [{ lotId: "A", quantity: 4 }], 0, [], null],
        },
        {
          name: "Restocking after depletion",
          input: [["StockAllocator", "receive", "allocate", "receive", "allocate"], [[], ["A", 1, 1], ["o1", 1], ["C", 2, 9], ["o2", 2]]],
          expected: [null, null, [{ lotId: "A", quantity: 1 }], null, [{ lotId: "C", quantity: 2 }]],
        },
        {
          name: "A zero-quantity order allocates nothing",
          input: [["StockAllocator", "receive", "allocate", "available"], [[], ["A", 2, 1], ["o1", 0], []]],
          expected: [null, null, [], 2],
        },
      ],
    },
  },
];
