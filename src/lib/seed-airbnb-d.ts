import type { Problem, UiWorkspace } from "./types";

// Airbnb frontend tech-screen bank, part D: the React widgets candidates
// report — a typeahead with keyboard navigation, a carousel with a per-slide
// countdown, and Connect Four. The starters render the static shell against
// in-file fixtures (the preview sandbox has no network), and the Solution tab
// holds the doc's tested implementation.

const typeaheadUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `import { useEffect, useId, useRef, useState } from "react";

const DESTINATIONS = [
  "Paris", "Palm Springs", "Portland", "Porto", "Prague", "Puerto Rico",
  "San Diego", "San Francisco", "Santa Fe", "Seattle", "Seoul", "Sydney",
  "Tokyo", "Toronto", "Tulum",
].map((label, i) => ({ id: i + 1, label }));

/** The "endpoint": resolves after a jittered delay and honors an AbortSignal. */
export function fetchSuggestions(query, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(DESTINATIONS.filter((d) => d.label.toLowerCase().startsWith(query.toLowerCase())));
    }, 300 + Math.random() * 400); // jittered, so a stale response really can arrive late
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
    });
  });
}

export function useDebouncedValue(value, delay) {
  // Your code here
  return value;
}

export function Typeahead({ fetchSuggestions, onSelect, minChars = 1, delay = 250 }) {
  const [query, setQuery] = useState("");
  // Your code here: debounce the query, fetch (aborting stale requests), cache,
  // keyboard navigation, and ARIA combobox wiring.
  return (
    <div className="typeahead">
      <input
        type="text"
        placeholder="Where to?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}

export default function App() {
  const [picked, setPicked] = useState(null);
  return (
    <div className="page">
      <Typeahead fetchSuggestions={fetchSuggestions} onSelect={setPicked} />
      <p className="picked">{picked ? \`Selected: \${picked.label}\` : "Nothing selected yet."}</p>
    </div>
  );
}
`,
    },
    {
      name: "styles.css",
      contents: `.page {
  display: grid;
  gap: 12px;
  max-width: 360px;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

.typeahead {
  position: relative;
}

.typeahead input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  font: inherit;
}

.typeahead input:focus {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}

.typeahead [role="listbox"] {
  position: absolute;
  inset: calc(100% + 4px) 0 auto 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.option {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.option--active,
.option:hover {
  background: #f4f4f5;
}

.empty {
  padding: 8px 10px;
  color: #71717a;
}

.picked {
  margin: 0;
  color: #52525b;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
`,
    },
  ],
};

const carouselUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `import { useEffect, useState } from "react";

// Each slide has its own duration (seconds).
const SLIDES = [
  { id: "living", title: "Living room", color: "#f97316", duration: 3 },
  { id: "kitchen", title: "Kitchen", color: "#22c55e", duration: 5 },
  { id: "bedroom", title: "Bedroom", color: "#3b82f6", duration: 2 },
  { id: "rooftop", title: "Rooftop", color: "#a855f7", duration: 4 },
];

export function Carousel({ slides }) {
  const [index, setIndex] = useState(0);
  // Your code here: auto-advance after each slide's own duration, show a
  // countdown, halt on the last slide, pause on hover.
  const slide = slides[index];
  return (
    <section className="carousel" aria-roledescription="carousel" aria-label="Listing photos">
      <div className="carousel__img" style={{ background: slide.color }}>
        {slide.title}
      </div>
      <div className="carousel__bar">
        <button type="button" aria-label="Previous slide">‹</button>
        <span aria-live="polite">
          {index + 1} / {slides.length}
        </span>
        <button type="button" aria-label="Next slide">›</button>
      </div>
    </section>
  );
}

export default function App() {
  return <Carousel slides={SLIDES} />;
}
`,
    },
    {
      name: "styles.css",
      contents: `.carousel {
  display: grid;
  gap: 10px;
  width: 360px;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

.carousel__img {
  display: grid;
  place-items: center;
  height: 220px;
  border-radius: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.carousel__bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.carousel__bar span {
  flex: 1;
  text-align: center;
  color: #52525b;
}

button {
  min-width: 36px;
  padding: 6px 10px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}

button[aria-pressed="true"] {
  background: #18181b;
  color: #fff;
}
`,
    },
  ],
};

const connectFourUi: UiWorkspace = {
  framework: "react",
  files: [
    {
      name: "App.jsx",
      contents: `import { useState } from "react";

export const ROWS = 6;
export const COLS = 7;

export const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

/** Drop a piece into column col: { board, row } with a NEW board, or null if the column is full. */
export function dropPiece(board, col, player) {
  // Your code here
  return null;
}

/** Did the piece just placed at (row, col) make four in a row? */
export function isWin(board, row, col) {
  return false;
}

export function ConnectFour() {
  const [board, setBoard] = useState(emptyBoard);
  const [player, setPlayer] = useState("red");
  const [winner, setWinner] = useState(null);

  const play = (col) => {
    // Your code here: drop, check for a win or a draw, switch players.
  };

  return (
    <div className="c4">
      <p aria-live="polite">{winner ? \`\${winner} wins!\` : \`\${player}'s turn\`}</p>
      <div className="c4__board" role="grid" aria-label="Connect Four board">
        {board.map((cells, r) => (
          <div key={r} role="row" className="c4__row">
            {cells.map((cell, c) => (
              <button
                key={c}
                type="button"
                role="gridcell"
                className={\`c4__cell \${cell ? \`c4__cell--\${cell}\` : ""}\`}
                aria-label={cell ? \`\${cell} piece\` : \`Drop in column \${c + 1}\`}
                onClick={() => play(c)}
              />
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="reset">Reset</button>
    </div>
  );
}

export default function App() {
  return <ConnectFour />;
}
`,
    },
    {
      name: "styles.css",
      contents: `.c4 {
  display: grid;
  gap: 12px;
  justify-items: start;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

.c4 p {
  margin: 0;
  font-weight: 600;
  text-transform: capitalize;
}

.c4__board {
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  background: #1d4ed8;
}

.c4__row {
  display: flex;
  gap: 6px;
}

.c4__cell {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #eff6ff;
  cursor: pointer;
  transition: transform 120ms ease-out;
}

.c4__cell:hover:not(:disabled) {
  transform: scale(1.06);
}

.c4__cell:disabled {
  cursor: default;
}

.c4__cell--red {
  background: #dc2626;
}

.c4__cell--yellow {
  background: #facc15;
}

.reset {
  padding: 6px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
`,
    },
  ],
};

export const airbnbProblemsD: Problem[] = [
  {
    slug: "typeahead-keyboard-nav",
    title: "Typeahead with Keyboard Navigation",
    category: "frontend",
    difficulty: "hard",
    companies: ["airbnb"],
    summary:
      "Debounce the query, abort the stale request, cache by query, wrap the arrow keys, wire the combobox.",
    prompt: `Build a typeahead: an input connected to a suggestions endpoint, with **keyboard navigation**. The endpoint is mocked in the starter (\`fetchSuggestions(query, signal)\` resolves after a jittered delay and honors an \`AbortSignal\`), so a slow old response really can arrive after a newer one.

## Requirements

- Debounce the query before fetching; ignore queries shorter than \`minChars\`.
- **A stale response must never overwrite a newer list** — abort the in-flight request when the query changes.
- Cache results by query so retyping a query doesn't refetch.
- Arrow keys move the highlight and **wrap around**; Enter selects the highlighted item; Escape closes the list; clicking an item selects it.
- Selecting an item fills the input and calls \`onSelect(item)\`.
- ARIA combobox wiring: \`role="combobox"\`, \`aria-expanded\`, \`aria-activedescendant\`, and a \`role="listbox"\` of \`role="option"\`s.
- Show loading, empty, and error states.

## Follow-up

Highlight the matched substring. Announce the result count to screen readers. Virtualize very long lists. The vanilla-JS version.

## Worth asking out loud

Endpoint or mock? Debounce interval and minimum characters? Select on Enter only, or also on click? Close on blur?`,
    hints: [
      "Debounce the value, not the handler: a `useDebouncedValue(query, delay)` hook whose effect sets the debounced value in a timeout and clears it in cleanup.",
      "Fetch in an effect keyed on the debounced query; create an AbortController per run and return `() => controller.abort()` as the cleanup — that single line is the race-condition fix.",
      "Keep `activeIndex` in state and wrap with modulo in the keydown handler; `onMouseDown={(e) => e.preventDefault()}` on options keeps the input focused so blur doesn't close the list before the click lands.",
    ],
    solution: `## Approach

Five things the interviewer is looking for: debounce the query, abort stale requests so a slow old response can't overwrite a newer list, cache by query, keyboard navigation with wrap-around plus Enter/Escape, and ARIA combobox wiring. The effect keyed on the debounced query does the heavy lifting — its cleanup aborts the previous controller, which is the whole race-condition fix.

\`\`\`jsx
import React, { useEffect, useId, useRef, useState } from 'react';

export function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);              // cleanup = the debounce
  }, [value, delay]);
  return debounced;
}

// fetchSuggestions(query, signal) => Promise<[{ id, label }]>
export function Typeahead({ fetchSuggestions, onSelect, minChars = 1, delay = 250, placeholder = 'Search…' }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const debouncedQuery = useDebouncedValue(query.trim(), delay);
  const cache = useRef(new Map());
  const fetchRef = useRef(fetchSuggestions);
  const listId = useId();
  useEffect(() => { fetchRef.current = fetchSuggestions; });

  useEffect(() => {
    if (debouncedQuery.length < minChars) { setItems([]); setOpen(false); return; }
    if (cache.current.has(debouncedQuery)) {
      setItems(cache.current.get(debouncedQuery)); setOpen(true); return;
    }
    const controller = new AbortController();
    setStatus('loading');
    fetchRef.current(debouncedQuery, controller.signal)
      .then((results) => {
        cache.current.set(debouncedQuery, results);
        setItems(results); setActiveIndex(-1); setOpen(true); setStatus('idle');
      })
      .catch((err) => { if (err.name !== 'AbortError') setStatus('error'); });
    return () => controller.abort();          // newer keystroke → cancel the stale request
  }, [debouncedQuery, minChars]);

  const choose = (item) => {
    setQuery(item.label); setOpen(false); setActiveIndex(-1);
    onSelect?.(item);
  };

  const onKeyDown = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + items.length) % items.length); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); choose(items[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className="typeahead">
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? \`\${listId}-\${activeIndex}\` : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      {status === 'loading' && <span className="visually-hidden" aria-live="polite">Loading…</span>}
      {status === 'error' && <div role="alert">Couldn't load suggestions.</div>}
      {open && items.length > 0 && (
        <ul id={listId} role="listbox">
          {items.map((item, i) => (
            <li
              key={item.id}
              id={\`\${listId}-\${i}\`}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'option option--active' : 'option'}
              onMouseDown={(e) => e.preventDefault()}   // keep input focus (blur would close the list first)
              onClick={() => choose(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {open && items.length === 0 && status === 'idle' && <div className="empty">No results</div>}
    </div>
  );
}

// The starter's mock endpoint and page, so this file is a complete App.jsx.
const DESTINATIONS = [
  'Paris', 'Palm Springs', 'Portland', 'Porto', 'Prague', 'Puerto Rico',
  'San Diego', 'San Francisco', 'Santa Fe', 'Seattle', 'Seoul', 'Sydney',
  'Tokyo', 'Toronto', 'Tulum',
].map((label, i) => ({ id: i + 1, label }));

export function fetchSuggestions(query, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(DESTINATIONS.filter((d) => d.label.toLowerCase().startsWith(query.toLowerCase())));
    }, 300 + Math.random() * 400);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    });
  });
}

export default function App() {
  const [picked, setPicked] = useState(null);
  return (
    <div className="page">
      <Typeahead fetchSuggestions={fetchSuggestions} onSelect={setPicked} />
      <p className="picked">{picked ? \`Selected: \${picked.label}\` : 'Nothing selected yet.'}</p>
    </div>
  );
}
\`\`\`

Against a real endpoint, \`fetchSuggestions\` is \`fetch(url, { signal })\` that throws on \`!res.ok\` and returns \`res.json()\`.

## Worth saying out loud

- The race, in one breath: "User types \`ap\` then \`apr\`. If the \`ap\` response lands last it would overwrite the \`apr\` list. The effect cleanup aborts the previous controller, so the stale response is never applied. If the API can't be aborted, keep a request id and ignore responses whose id isn't the latest."
- \`onMouseDown\` + \`preventDefault\` on options is the fix for "clicking a suggestion closes the list before the click registers" — blur fires first otherwise.
- Follow-ups: wrap the matched substring in \`<mark>\`; an \`aria-live="polite"\` span with "N results"; virtualize or cap at 10 for huge lists.
- Vanilla is the same five pieces: \`debounce\`, \`AbortController\`, one delegated click on the \`<ul>\`, and \`setAttribute\` for the ARIA state.`,
    ui: typeaheadUi,
  },
  {
    slug: "carousel-per-slide-countdown",
    title: "Carousel with a Per-Slide Countdown",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "One interval per slide, one batched update per advance — and the double-advance trap.",
    prompt: `Build an image carousel where **each slide has its own duration**, and which halts at the final slide. The follow-up the interviewer adds: display a **countdown** and auto-advance when it hits zero. (FEIH's note on this loop: "\`useEffect\` and \`setInterval\` are critical.") The slides are colored panels in the starter, since the preview has no network.

## Requirements

- Slide \`i\` shows for \`slides[i].duration\` seconds, then the carousel advances; it stops on the last slide.
- Show "next in Ns" counting down once per second; it resets to the new slide's duration on every change.
- Previous/Next buttons work and reset the countdown; Previous is disabled on the first slide, Next on the last.
- Pause on hover and on focus; a Play/Pause button too.
- No leaked timers when the slide changes or the component unmounts, and **never advance twice** when the countdown reaches zero.

## Follow-up

Timer drift (a 1s interval isn't exactly 1s). Loop instead of halt. Swipe. Preload the next image. Pause when the tab is hidden. Respect \`prefers-reduced-motion\`.

## Worth asking out loud

Halt or loop at the end? Pause on hover? Should manual navigation reset the countdown? Is the countdown visible or just the progress?`,
    hints: [
      "Two pieces of state — index and remaining — and a single `goTo(i)` that sets both together, so React batches them into one render. Separate effects that each set one of them are how you get the double-advance bug.",
      "The interval effect depends on `[index, paused, isLast]` and returns `clearInterval` — each slide gets a fresh timer, and none leak. A second small effect watches `remaining <= 0` and calls `goTo(index + 1)`.",
    ],
    solution: `## Approach

The trap: when the countdown hits 0 you change \`index\` *and* reset \`remaining\`. If those are two separate updates in two effects, one render sees \`index + 1\` with \`remaining === 0\` and advances **twice**. Fix: set both in one handler (\`goTo\`) so React batches them, and give the interval effect \`index\` as a dependency so each slide gets a fresh timer that the cleanup clears.

\`\`\`jsx
import React, { useEffect, useState } from 'react';

// slides: [{ id, title, color, duration }]  (duration in seconds, per slide)
// Auto-advances after each slide's own duration, shows a countdown, and stops on the last slide.
export function Carousel({ slides }) {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(slides[0].duration);
  const [paused, setPaused] = useState(false);
  const isLast = index === slides.length - 1;

  // Change slide and reset its countdown together (one batched update → no double-advance).
  const goTo = (i) => {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    setIndex(next);
    setRemaining(slides[next].duration);
  };

  // Tick once per second while running. Re-created whenever the slide changes or pause toggles.
  useEffect(() => {
    if (paused || isLast) return undefined;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);            // cleanup: no leaked timers on unmount/slide change
  }, [index, paused, isLast]);

  // Countdown hit zero → advance.
  useEffect(() => {
    if (remaining <= 0 && !isLast) goTo(index + 1);
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const slide = slides[index];
  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Listing photos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div key={slide.id} className="carousel__img" style={{ background: slide.color }}>
        {slide.title}
      </div>
      <div className="carousel__bar">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous slide">‹</button>
        <span aria-live="polite">
          {index + 1} / {slides.length}
          {!isLast && <span> · next in {remaining}s</span>}
        </span>
        <button type="button" onClick={() => goTo(index + 1)} disabled={isLast} aria-label="Next slide">›</button>
        <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} disabled={isLast}>
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
    </section>
  );
}

const SLIDES = [
  { id: 'living', title: 'Living room', color: '#f97316', duration: 3 },
  { id: 'kitchen', title: 'Kitchen', color: '#22c55e', duration: 5 },
  { id: 'bedroom', title: 'Bedroom', color: '#3b82f6', duration: 2 },
  { id: 'rooftop', title: 'Rooftop', color: '#a855f7', duration: 4 },
];

export default function App() {
  return <Carousel slides={SLIDES} />;
}
\`\`\`

With real photos the panel is an \`<img key={slide.src} src={slide.src} alt={slide.alt} />\`; the key forces a fresh element per slide so a fade-in animation restarts.

## Worth saying out loud

- Drift: a 1s interval isn't exactly 1s. Store \`deadline = Date.now() + duration * 1000\` and derive \`remaining\` each tick with \`Math.ceil((deadline - now) / 1000)\`; use \`requestAnimationFrame\` for a progress bar.
- Loop instead of halt: \`goTo((index + 1) % slides.length)\` and drop \`isLast\` from the interval guard.
- Swipe: \`pointerdown\`/\`pointerup\` delta over 40px → prev/next, or CSS \`scroll-snap\` and let the browser do it.
- Preload the next image (\`new Image().src = …\`), pause on \`visibilitychange\`, and honor \`prefers-reduced-motion\` (no auto-advance, or a longer duration).`,
    ui: carouselUi,
  },
  {
    slug: "connect-four",
    title: "Connect Four",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Immutable board updates, gravity in dropPiece, and a win check that only looks through the last move.",
    prompt: `Two players drop discs into a 7×6 grid; the first to line up four wins. The board renders in the starter — make it a game.

## Requirements

- Clicking any cell in a column drops the current player's disc into the **lowest** empty cell of that column; a full column does nothing.
- Players alternate (red, then yellow); the status line shows whose turn it is.
- Detect a win — horizontal, vertical, or either diagonal — and announce it; no more moves after a win.
- Detect a draw when the board fills.
- Reset starts a new game.
- Update the board **immutably** (React state must be replaced, not mutated).

## Follow-up

A drop animation. Undo. An AI opponent. N×M with K in a row.

## Worth asking out loud

Who starts? Highlight the winning four? Should full columns be disabled or just ignored? Is a draw announced?`,
    hints: [
      "Model the board as a 6×7 array of null | 'red' | 'yellow' in state. dropPiece scans the column from the bottom row up for the first null and returns a copied board plus the row it landed in — or null when the column is full.",
      "Don't scan the whole board for a win — only the four lines through the last move, counting outward in both directions along each of the 4 direction vectors; a count ≥ 4 is a win.",
      "Store a move counter for the draw check (moves === ROWS * COLS with no winner); disable every cell in a full column so the UI matches the rule.",
    ],
    solution: `## Approach

Board as a 6×7 array in state; \`dropPiece\` finds the lowest empty row in a column (gravity) and returns a **new** board; \`isWin\` checks only the four lines through the last move — walking outward both ways along each direction vector — rather than scanning the board. The component is thin: it calls the pure functions and stores the result.

\`\`\`jsx
import React, { useState } from 'react';

export const ROWS = 6;
export const COLS = 7;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // →, ↓, ↘, ↙ (each checked both ways)

export const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// Returns { board, row } for the new piece, or null if the column is full. Immutable update.
export function dropPiece(board, col, player) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      const next = board.map((r) => [...r]);
      next[row][col] = player;
      return { board: next, row };
    }
  }
  return null;
}

// Only check lines through the last move: O(4 * 2 * 3) instead of scanning the board.
export function isWin(board, row, col) {
  const player = board[row][col];
  return DIRS.some(([dr, dc]) => {
    let count = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++; r += dr * sign; c += dc * sign;
      }
    }
    return count >= 4;
  });
}

export function ConnectFour() {
  const [board, setBoard] = useState(emptyBoard);
  const [player, setPlayer] = useState('red');
  const [winner, setWinner] = useState(null);
  const [moves, setMoves] = useState(0);
  const draw = !winner && moves === ROWS * COLS;

  const play = (col) => {
    if (winner) return;
    const result = dropPiece(board, col, player);
    if (!result) return;                          // column full
    setBoard(result.board);
    setMoves(moves + 1);
    if (isWin(result.board, result.row, col)) setWinner(player);
    else setPlayer(player === 'red' ? 'yellow' : 'red');
  };

  const reset = () => { setBoard(emptyBoard()); setPlayer('red'); setWinner(null); setMoves(0); };

  return (
    <div className="c4">
      <p aria-live="polite">
        {winner ? \`\${winner} wins!\` : draw ? 'Draw' : \`\${player}'s turn\`}
      </p>
      <div className="c4__board" role="grid" aria-label="Connect Four board">
        {board.map((cells, r) => (
          <div key={r} role="row" className="c4__row">
            {cells.map((cell, c) => (
              <button
                key={c}
                type="button"
                role="gridcell"
                className={\`c4__cell \${cell ? \`c4__cell--\${cell}\` : ''}\`}
                aria-label={cell ? \`\${cell} piece\` : \`Drop in column \${c + 1}\`}
                onClick={() => play(c)}
                disabled={Boolean(winner) || board[0][c] !== null}
              />
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="reset" onClick={reset}>Reset</button>
    </div>
  );
}

export default function App() {
  return <ConnectFour />;
}
\`\`\`

## Worth saying out loud

- Pure functions first (\`dropPiece\`, \`isWin\`), then a thin component — they're unit-testable with two \`console.assert\`s and the interviewer can watch the logic without the JSX.
- The win check through the last move is O(1) per move; scanning the board is O(rows·cols·directions) and the classic "it works but…" answer.
- Follow-ups: a drop animation is a \`translateY\` transition from the top row; undo keeps a move stack (recompute or snapshot boards); an AI opponent is minimax with a depth limit or "win, else block, else center-out"; N×M with K in a row is parameters, nothing else changes.`,
    ui: connectFourUi,
  },
];
