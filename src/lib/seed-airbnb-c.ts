import type { Problem, UiFile, UiWorkspace } from "./types";

// Airbnb frontend tech-screen bank, part C: the widgets candidates report
// building in vanilla HTML/CSS/JS — tabs with an initTabs(node) follow-up, a
// star rating inside a form, and shuffle-and-deal cards. Each ships as an
// HTML/CSS/JS template (the default, matching the reports) and a React one;
// both carry complete reference files for the Solution tab.

// -- tabs ---------------------------------------------------------------------

const tabsHtml: UiFile = {
  name: "index.html",
  contents: `<main class="page">
  <section data-tabs class="tabs" aria-label="Listing">
    <div role="tablist">
      <button role="tab">Overview</button>
      <button role="tab">Amenities</button>
      <button role="tab">Reviews</button>
    </div>
    <div role="tabpanel"><p>A bright two-bedroom flat two blocks from the water. Sleeps four.</p></div>
    <div role="tabpanel"><p>Wi-Fi · Kitchen · Washer · Workspace · Free parking</p></div>
    <div role="tabpanel"><p>4.9 · 128 reviews. “Spotless, quiet, and the host replied within minutes.”</p></div>
  </section>

  <section data-tabs class="tabs" aria-label="Host">
    <div role="tablist">
      <button role="tab">About</button>
      <button role="tab">Policies</button>
    </div>
    <div role="tabpanel"><p>Hosted by Maya since 2016. Superhost, 340 reviews.</p></div>
    <div role="tabpanel"><p>Check-in after 3pm · Checkout by 11am · No parties · No smoking</p></div>
  </section>
</main>
`,
};

const tabsCss: UiFile = {
  name: "styles.css",
  contents: `.page {
  display: grid;
  gap: 24px;
  max-width: 560px;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

.tabs {
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  overflow: hidden;
}

[role="tablist"] {
  display: flex;
  border-bottom: 1px solid #e4e4e7;
  background: #fafafa;
}

[role="tab"] {
  padding: 10px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  font: inherit;
  color: #71717a;
  cursor: pointer;
}

[role="tab"]:hover {
  color: #18181b;
}

[role="tab"].tab--active {
  color: #18181b;
  border-bottom-color: #18181b;
}

[role="tab"]:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

[role="tabpanel"] {
  padding: 16px;
}

[hidden] {
  display: none !important;
}
`,
};

const tabsReactStarter = `import { useState } from "react";

const LISTING_TABS = [
  { id: "overview", label: "Overview", content: "A bright two-bedroom flat two blocks from the water. Sleeps four." },
  { id: "amenities", label: "Amenities", content: "Wi-Fi · Kitchen · Washer · Workspace · Free parking" },
  { id: "reviews", label: "Reviews", content: "4.9 · 128 reviews. “Spotless, quiet, and the host replied within minutes.”" },
];
const HOST_TABS = [
  { id: "about", label: "About", content: "Hosted by Maya since 2016. Superhost, 340 reviews." },
  { id: "policies", label: "Policies", content: "Check-in after 3pm · Checkout by 11am · No parties · No smoking" },
];

// items: [{ id, label, content }]. Two instances share the page.
export function Tabs({ items, defaultIndex = 0, onChange }) {
  // Your code here: one active index, unique ids per instance, arrow keys.
  return (
    <div className="tabs">
      <div role="tablist">
        {items.map((item) => (
          <button key={item.id} type="button" role="tab">
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div key={item.id} role="tabpanel">
          <p>{item.content}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <main className="page">
      <Tabs items={LISTING_TABS} />
      <Tabs items={HOST_TABS} />
    </main>
  );
}
`;

const tabsReactSolution = `import { useId, useRef, useState } from "react";

const LISTING_TABS = [
  { id: "overview", label: "Overview", content: "A bright two-bedroom flat two blocks from the water. Sleeps four." },
  { id: "amenities", label: "Amenities", content: "Wi-Fi · Kitchen · Washer · Workspace · Free parking" },
  { id: "reviews", label: "Reviews", content: "4.9 · 128 reviews. “Spotless, quiet, and the host replied within minutes.”" },
];
const HOST_TABS = [
  { id: "about", label: "About", content: "Hosted by Maya since 2016. Superhost, 340 reviews." },
  { id: "policies", label: "Policies", content: "Check-in after 3pm · Checkout by 11am · No parties · No smoking" },
];

// items: [{ id, label, content }]
export function Tabs({ items, defaultIndex = 0, onChange }) {
  const [active, setActive] = useState(defaultIndex);
  const baseId = useId();                       // unique per instance → many Tabs on one page
  const tabRefs = useRef([]);

  const select = (i) => {
    setActive(i);
    onChange?.(items[i], i);
    tabRefs.current[i]?.focus();
  };

  // WAI-ARIA tabs pattern: arrow keys move + activate, Home/End jump, roving tabindex.
  const onKeyDown = (e) => {
    const n = items.length;
    const next = { ArrowRight: (active + 1) % n, ArrowLeft: (active - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next);
  };

  return (
    <div className="tabs">
      <div role="tablist" aria-orientation="horizontal" onKeyDown={onKeyDown}>
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={\`\${baseId}-tab-\${item.id}\`}
            ref={(el) => { tabRefs.current[i] = el; }}
            aria-selected={i === active}
            aria-controls={\`\${baseId}-panel-\${item.id}\`}
            tabIndex={i === active ? 0 : -1}
            className={i === active ? "tab tab--active" : "tab"}
            onClick={() => select(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          role="tabpanel"
          id={\`\${baseId}-panel-\${item.id}\`}
          aria-labelledby={\`\${baseId}-tab-\${item.id}\`}
          hidden={i !== active}
          tabIndex={0}
        >
          <p>{item.content}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <main className="page">
      <Tabs items={LISTING_TABS} />
      <Tabs items={HOST_TABS} />
    </main>
  );
}
`;

const tabsUi: UiWorkspace = {
  framework: "vanilla",
  files: [
    tabsHtml,
    {
      name: "script.js",
      contents: `// Wire up one tab set. Called once per [data-tabs] element — the two sets on
// the page must not interfere with each other.
function initTabs(root, { defaultIndex = 0 } = {}) {
  // Your code here
  return { activate() {} };
}

document.querySelectorAll("[data-tabs]").forEach((el) => initTabs(el));
`,
    },
    tabsCss,
  ],
  solution: [
    tabsHtml,
    {
      name: "script.js",
      contents: `// Markup contract (author writes this; the "library" wires it up):
// <div data-tabs>
//   <div role="tablist">
//     <button role="tab">Overview</button><button role="tab">Reviews</button>
//   </div>
//   <div role="tabpanel">…</div><div role="tabpanel">…</div>
// </div>
let instanceCounter = 0;

function initTabs(root, { defaultIndex = 0 } = {}) {
  const tablist = root.querySelector(':scope > [role="tablist"]');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll(':scope > [role="tabpanel"]')];
  const uid = \`tabs-\${++instanceCounter}\`;   // instance-scoped ids → independent instances

  tabs.forEach((tab, i) => {
    tab.id = \`\${uid}-tab-\${i}\`;
    panels[i].id = \`\${uid}-panel-\${i}\`;
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.type = 'button';
  });

  function activate(index) {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('tab--active', on);
      panels[i].hidden = !on;
    });
  }

  // One delegated listener per instance instead of one per tab.
  tablist.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab && tablist.contains(tab)) activate(tabs.indexOf(tab));
  });

  tablist.addEventListener('keydown', (e) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const next = (current + delta + tabs.length) % tabs.length;
    activate(next);
    tabs[next].focus();
  });

  activate(defaultIndex);
  return { activate };                        // tiny public API, like a jQuery plugin
}

// Auto-init every instance on the page.
function initAllTabs(doc = document) {
  return [...doc.querySelectorAll('[data-tabs]')].map((el) => initTabs(el));
}

initAllTabs();
`,
    },
    tabsCss,
  ],
  alternate: {
    framework: "react",
    files: [{ name: "App.jsx", contents: tabsReactStarter }, tabsCss],
    solution: [{ name: "App.jsx", contents: tabsReactSolution }, tabsCss],
  },
};

// -- star rating --------------------------------------------------------------

const starHtml: UiFile = {
  name: "index.html",
  contents: `<form id="review" class="review">
  <div data-rating="cleanliness" data-label="Cleanliness"></div>
  <div data-rating="location" data-label="Location"></div>
  <button type="submit">Submit review</button>
  <pre id="output" aria-live="polite">Submit to see the form data.</pre>
</form>
`,
};

const starSharedCss = `.review {
  display: grid;
  gap: 16px;
  max-width: 360px;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

.rating legend {
  width: 100%;
  margin-bottom: 4px;
  font-weight: 600;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

button {
  justify-self: start;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #18181b;
  color: #fafafa;
  font: inherit;
  cursor: pointer;
}

pre {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f4f4f5;
  font-size: 12px;
}
`;

const starVanillaCss: UiFile = {
  name: "styles.css",
  contents: `/* row-reverse: DOM order is 5 -> 1 so the ~ sibling selector can light up
   "every star to the left"; the visual order comes out 1 -> 5. */
.rating {
  display: inline-flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  border: 0;
  padding: 0;
  margin: 0;
}

.rating legend {
  float: right;
}

.rating label,
.star-placeholder {
  font-size: 2rem;
  line-height: 1;
  color: #ccc;
  cursor: pointer;
}

.rating input:checked ~ label,
.rating label:hover,
.rating label:hover ~ label {
  color: #f5b301;
}

.rating input:focus-visible + label {
  outline: 2px solid #222;
  outline-offset: 2px;
}

${starSharedCss}`,
};

const starReactCss: UiFile = {
  name: "styles.css",
  contents: `.rating {
  display: inline-flex;
  gap: 2px;
  border: 0;
  padding: 0;
  margin: 0;
}

.star {
  font-size: 2rem;
  line-height: 1;
  color: #ccc;
  cursor: pointer;
}

.star--on {
  color: #f5b301;
}

.rating input:focus-visible + label {
  outline: 2px solid #222;
  outline-offset: 2px;
}

${starSharedCss}`,
};

const starReactStarter = `import { useId, useState } from "react";

// A rating that lives inside a <form>: submitting must include name -> value,
// keyboard must work, and two instances share the page.
export function StarRating({ name, label, max = 5, defaultValue = 0, onChange }) {
  // Your code here: real radio inputs named \`name\`, hover preview, unique ids per instance.
  return (
    <fieldset className="rating">
      <legend>{label}</legend>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="star">★</span>
      ))}
    </fieldset>
  );
}

export default function App() {
  const [submitted, setSubmitted] = useState(null);
  return (
    <form
      className="review"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <StarRating name="cleanliness" label="Cleanliness" />
      <StarRating name="location" label="Location" />
      <button type="submit">Submit review</button>
      <pre aria-live="polite">{submitted ? JSON.stringify(submitted, null, 2) : "Submit to see the form data."}</pre>
    </form>
  );
}
`;

const starReactSolution = `import React, { useId, useState } from "react";

// A star rating that is a real form control: radio inputs named \`name\`,
// so <form> submission / FormData picks it up with zero extra wiring,
// keyboard works for free (arrows/space), and many instances coexist.
export function StarRating({ name, label, max = 5, defaultValue = 0, onChange }) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const baseId = useId();
  const shown = hover || value;

  return (
    <fieldset className="rating" onMouseLeave={() => setHover(0)}>
      <legend>{label}</legend>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const id = \`\${baseId}-\${star}\`;
        return (
          <React.Fragment key={star}>
            <input
              className="visually-hidden"
              type="radio"
              id={id}
              name={name}
              value={star}
              checked={value === star}
              onChange={() => { setValue(star); onChange?.(star); }}
            />
            <label
              htmlFor={id}
              className={star <= shown ? "star star--on" : "star"}
              onMouseEnter={() => setHover(star)}
              aria-label={\`\${star} star\${star > 1 ? "s" : ""}\`}
            >
              ★
            </label>
          </React.Fragment>
        );
      })}
    </fieldset>
  );
}

// Inside a form the values arrive as regular fields: { cleanliness: '4', location: '5' }.
export default function App() {
  const [submitted, setSubmitted] = useState(null);
  return (
    <form
      className="review"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <StarRating name="cleanliness" label="Cleanliness" />
      <StarRating name="location" label="Location" />
      <button type="submit">Submit review</button>
      <pre aria-live="polite">{submitted ? JSON.stringify(submitted, null, 2) : "Submit to see the form data."}</pre>
    </form>
  );
}
`;

const starRatingUi: UiWorkspace = {
  framework: "vanilla",
  files: [
    starHtml,
    {
      name: "script.js",
      contents: `// Build one rating control. The form must submit \`name\` -> the chosen star
// with no extra JavaScript, the keyboard must work, and any number of
// instances must coexist on the page.
function createStarRating({ name, label, max = 5 }) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "rating";
  fieldset.innerHTML = \`<legend>\${label}</legend>\`;
  // Your code here: replace these inert stars with real form controls.
  for (let star = 1; star <= max; star++) {
    fieldset.insertAdjacentHTML("beforeend", \`<span class="star-placeholder">★</span>\`);
  }
  return fieldset;
}

const form = document.getElementById("review");
for (const mount of form.querySelectorAll("[data-rating]")) {
  mount.replaceWith(createStarRating({ name: mount.dataset.rating, label: mount.dataset.label }));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  document.getElementById("output").textContent = JSON.stringify(data, null, 2);
});
`,
    },
    starVanillaCss,
  ],
  solution: [
    starHtml,
    {
      name: "script.js",
      contents: `// Zero-JS star rating: radios + labels + CSS. Works without JavaScript,
// submits with the form, keyboard accessible, any number of instances.
function createStarRating({ name, label, max = 5 }) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'rating';
  fieldset.innerHTML = \`<legend>\${label}</legend>\`;
  // Render 5 → 1 so the CSS sibling selector (~) can light up "all stars to the left".
  for (let star = max; star >= 1; star--) {
    const id = \`\${name}-\${star}\`;
    fieldset.insertAdjacentHTML(
      'beforeend',
      \`<input class="visually-hidden" type="radio" id="\${id}" name="\${name}" value="\${star}">
       <label for="\${id}" aria-label="\${star} star\${star > 1 ? 's' : ''}">★</label>\`,
    );
  }
  return fieldset;
}

const form = document.getElementById('review');
for (const mount of form.querySelectorAll('[data-rating]')) {
  mount.replaceWith(createStarRating({ name: mount.dataset.rating, label: mount.dataset.label }));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  document.getElementById('output').textContent = JSON.stringify(data, null, 2);
});
`,
    },
    starVanillaCss,
  ],
  alternate: {
    framework: "react",
    files: [{ name: "App.jsx", contents: starReactStarter }, starReactCss],
    solution: [{ name: "App.jsx", contents: starReactSolution }, starReactCss],
  },
};

// -- cards --------------------------------------------------------------------

const cardsCss: UiFile = {
  name: "styles.css",
  contents: `.table {
  display: grid;
  gap: 16px;
  justify-items: start;
  font: 14px/1.5 system-ui, sans-serif;
  color: #18181b;
}

button {
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #18181b;
  color: #fafafa;
  font: inherit;
  cursor: pointer;
}

.hand {
  display: flex;
  gap: 12px;
  min-height: 130px;
  perspective: 800px;
}

.card {
  position: relative;
  width: 90px;
  height: 130px;
  border: 1px solid #999;
  border-radius: 8px;
  background: #fff;
  font: 600 20px/1 system-ui;
  display: grid;
  place-items: center;
  animation: reveal 400ms ease-out both;
}

.card--red { color: #c1121f; }
.card--black { color: #111; }

.card__corner { position: absolute; font-size: 14px; }
.card__corner--top { top: 6px; left: 8px; }
.card__corner--bottom { bottom: 6px; right: 8px; transform: rotate(180deg); }
.card__pip { font-size: 40px; }

.result {
  margin: 0;
  color: #52525b;
}

@keyframes reveal {
  from { transform: rotateY(90deg) translateY(20px); opacity: 0; }
  to { transform: none; opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .card { animation: none; }
}
`,
};

const cardsHtml: UiFile = { name: "index.html", contents: `<div id="app" class="table"></div>\n` };

const cardsLogicSolution = `// Cards: build a deck, shuffle (Fisher–Yates), deal N, evaluate a 5-card hand (follow-up).
const SUITS = [
  { name: 'spades', symbol: '♠', color: 'black' },
  { name: 'hearts', symbol: '♥', color: 'red' },
  { name: 'diamonds', symbol: '♦', color: 'red' },
  { name: 'clubs', symbol: '♣', color: 'black' },
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank, i) => ({ rank, value: i + 1, suit: suit.name, symbol: suit.symbol, color: suit.color })),
  );
}

// In-place Fisher–Yates: every permutation equally likely, O(n).
// (Do NOT use arr.sort(() => Math.random() - 0.5) — biased and not a valid comparator.)
function shuffle(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function deal(deck, n = 5) {
  if (deck.length < n) throw new Error(\`Only \${deck.length} cards left\`);
  return deck.splice(0, n);              // mutates: removes dealt cards from the deck
}

// Follow-up: classify a 5-card poker hand.
function evaluateHand(hand) {
  const values = hand.map((c) => c.value).sort((a, b) => a - b);
  const counts = Object.values(values.reduce((m, v) => ((m[v] = (m[v] || 0) + 1), m), {}))
    .sort((a, b) => b - a);
  const flush = hand.every((c) => c.suit === hand[0].suit);
  const distinct = new Set(values).size === 5;
  const straight = distinct && (values[4] - values[0] === 4 || values.join() === '1,10,11,12,13'); // A-high
  if (straight && flush) return 'Straight flush';
  if (counts[0] === 4) return 'Four of a kind';
  if (counts[0] === 3 && counts[1] === 2) return 'Full house';
  if (flush) return 'Flush';
  if (straight) return 'Straight';
  if (counts[0] === 3) return 'Three of a kind';
  if (counts[0] === 2 && counts[1] === 2) return 'Two pair';
  if (counts[0] === 2) return 'One pair';
  return 'High card';
}
`;

const cardsReactStarter = `import { useRef, useState } from "react";

const SUITS = [
  { name: "spades", symbol: "♠", color: "black" },
  { name: "hearts", symbol: "♥", color: "red" },
  { name: "diamonds", symbol: "♦", color: "red" },
  { name: "clubs", symbol: "♣", color: "black" },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** 52 cards: { rank, value, suit, symbol, color } */
export function createDeck() {
  // Your code here
  return [];
}

/** Uniform in-place shuffle. (Not arr.sort(() => Math.random() - 0.5).) */
export function shuffle(deck) {
  return deck;
}

/** Remove and return the top n cards. */
export function deal(deck, n = 5) {
  return [];
}

function Card({ card, index }) {
  return (
    <div
      className={\`card card--\${card.color}\`}
      style={{ animationDelay: \`\${index * 120}ms\` }}
      aria-label={\`\${card.rank} of \${card.suit}\`}
    >
      <span className="card__corner card__corner--top">{card.rank}{card.symbol}</span>
      <span className="card__pip">{card.symbol}</span>
      <span className="card__corner card__corner--bottom">{card.rank}{card.symbol}</span>
    </div>
  );
}

export default function App() {
  const [hand, setHand] = useState([]);
  // Your code here: keep the deck between deals (a ref), reshuffle when it runs low.
  return (
    <div className="table">
      <button type="button">Deal 5</button>
      <div className="hand" aria-live="polite">
        {hand.map((card, i) => (
          <Card key={\`\${card.rank}\${card.suit}\`} card={card} index={i} />
        ))}
      </div>
      <p className="result"></p>
    </div>
  );
}
`;

const cardsReactSolution = `import { useRef, useState } from "react";

${cardsLogicSolution}
function Card({ card, index }) {
  return (
    <div
      className={\`card card--\${card.color}\`}
      style={{ animationDelay: \`\${index * 120}ms\` }}   // staggered reveal
      aria-label={\`\${card.rank} of \${card.suit}\`}
    >
      <span className="card__corner card__corner--top">{card.rank}{card.symbol}</span>
      <span className="card__pip">{card.symbol}</span>
      <span className="card__corner card__corner--bottom">{card.rank}{card.symbol}</span>
    </div>
  );
}

export default function App() {
  const deck = useRef(shuffle(createDeck()));   // survives re-renders, unlike state it never needs to trigger one
  const [hand, setHand] = useState([]);
  const [dealCount, setDealCount] = useState(0);
  const [result, setResult] = useState("");

  const dealHand = () => {
    if (deck.current.length < 5) deck.current = shuffle(createDeck());   // reshuffle when the deck runs low
    const cards = deal(deck.current, 5);
    setHand(cards);
    setDealCount((n) => n + 1);                  // part of each card's key → fresh nodes → the CSS animation restarts
    setResult(\`\${evaluateHand(cards)} · \${deck.current.length} cards left\`);
  };

  return (
    <div className="table">
      <button type="button" onClick={dealHand}>Deal 5</button>
      <div className="hand" aria-live="polite">
        {hand.map((card, i) => (
          <Card key={\`\${dealCount}-\${card.rank}\${card.suit}\`} card={card} index={i} />
        ))}
      </div>
      <p className="result">{result}</p>
    </div>
  );
}
`;

const cardsUi: UiWorkspace = {
  framework: "vanilla",
  files: [
    cardsHtml,
    {
      name: "script.js",
      contents: `// Cards: build a deck, shuffle it, deal five, and show them with a reveal animation.
const SUITS = [
  { name: "spades", symbol: "♠", color: "black" },
  { name: "hearts", symbol: "♥", color: "red" },
  { name: "diamonds", symbol: "♦", color: "red" },
  { name: "clubs", symbol: "♣", color: "black" },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** 52 cards: { rank, value, suit, symbol, color } */
function createDeck() {
  // Your code here
  return [];
}

/** Uniform in-place shuffle. (Not arr.sort(() => Math.random() - 0.5).) */
function shuffle(deck) {
  return deck;
}

/** Remove and return the top n cards. */
function deal(deck, n = 5) {
  return [];
}

function renderCard(card, index) {
  const el = document.createElement("div");
  el.className = \`card card--\${card.color}\`;
  el.textContent = \`\${card.rank}\${card.symbol}\`;
  return el;
}

function mountDealer(root) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Deal 5";
  const hand = document.createElement("div");
  hand.className = "hand";
  hand.setAttribute("aria-live", "polite");
  const result = document.createElement("p");
  result.className = "result";
  root.append(button, hand, result);
  // Your code here: shuffle a deck, deal on click, render the hand.
}

mountDealer(document.getElementById("app"));
`,
    },
    cardsCss,
  ],
  solution: [
    cardsHtml,
    {
      name: "script.js",
      contents: `${cardsLogicSolution}
// DOM layer for "shuffle and deal five cards with a reveal animation".
function renderCard(card, index) {
  const el = document.createElement('div');
  el.className = \`card card--\${card.color}\`;
  el.style.animationDelay = \`\${index * 120}ms\`;         // staggered reveal
  el.setAttribute('aria-label', \`\${card.rank} of \${card.suit}\`);
  el.innerHTML = \`
    <span class="card__corner card__corner--top">\${card.rank}\${card.symbol}</span>
    <span class="card__pip">\${card.symbol}</span>
    <span class="card__corner card__corner--bottom">\${card.rank}\${card.symbol}</span>\`;
  return el;
}

function mountDealer(root) {
  let deck = shuffle(createDeck());
  const hand = document.createElement('div');
  hand.className = 'hand';
  hand.setAttribute('aria-live', 'polite');
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Deal 5';
  const result = document.createElement('p');
  result.className = 'result';
  root.append(button, hand, result);

  function dealHand() {
    if (deck.length < 5) deck = shuffle(createDeck());   // reshuffle when the deck runs low
    const cards = deal(deck, 5);
    hand.replaceChildren(...cards.map(renderCard));      // replacing nodes re-triggers the CSS animation
    result.textContent = \`\${evaluateHand(cards)} · \${deck.length} cards left\`;
  }

  button.addEventListener('click', dealHand);
  dealHand();
  return { dealHand };
}

mountDealer(document.getElementById('app'));
`,
    },
    cardsCss,
  ],
  alternate: {
    framework: "react",
    files: [{ name: "App.jsx", contents: cardsReactStarter }, cardsCss],
    solution: [{ name: "App.jsx", contents: cardsReactSolution }, cardsCss],
  },
};

export const airbnbProblemsC: Problem[] = [
  {
    slug: "tabs-init-node",
    title: "Tabs: initTabs(node)",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "The 15-minute tabs prompt, then the follow-up that matters: two independent instances from one initializer.",
    prompt: `Create a tab UI that switches panels when the tabs are clicked — reported as a 15–20 minute HTML/CSS/JS task. The follow-up is the real test: package it as \`initTabs(node)\`, a jQuery-plugin-style initializer, so the **two** tab sets already on the page work independently. (Prefer React? Switch the template — the same exercise is there as a \`Tabs\` component rendered twice.)

## Requirements

- Exactly one panel per tab set is visible; clicking a tab shows its panel and moves the active styling.
- The first tab is selected on load.
- \`initTabs(root)\` wires up one \`[data-tabs]\` element and returns a small API (\`activate(index)\`). Initializing the second set must not touch the first.
- Use "the right ID pattern": each tab's \`aria-controls\` points at its panel's id and each panel's \`aria-labelledby\` points back — unique across instances.
- Keep \`aria-selected\` in sync; hide inactive panels with the \`hidden\` attribute.

## Follow-up

Arrow-key navigation between tabs (WAI-ARIA tabs pattern: roving \`tabindex\`, Left/Right wrap around). URL-synced tabs. Lazy-rendering heavy panels.

## Worth asking out loud

Activate on click only, or also on arrow keys? Should inactive panels stay in the DOM or be removed? Is the markup given, or do I generate it?`,
    hints: [
      "Scope every query to the root: `root.querySelector(':scope > [role=\"tablist\"]')` and `:scope > [role=\"tabpanel\"]` — that's what stops nested or sibling tab sets from hijacking each other.",
      "An instance counter (`tabs-1`, `tabs-2`, …) gives each set unique ids for aria-controls / aria-labelledby; one delegated click listener on the tablist replaces one listener per tab. In React, `useId()` is that counter.",
      "Write a single `activate(index)` that sets aria-selected, tabIndex, the active class, and `hidden` for every tab/panel pair — click, keyboard, and the initial state all call it.",
    ],
    solution: `## Approach

Treat the markup as a contract (\`[data-tabs]\` → \`[role=tablist]\` with \`[role=tab]\`s, followed by \`[role=tabpanel]\`s) and write one initializer that closes over one instance's state. Everything scoring points lives in three decisions: \`:scope >\` queries so instances can't reach into each other, an instance counter that yields unique ids for the \`aria-controls\`/\`aria-labelledby\` links, and a single \`activate(index)\` that every path (click, arrow keys, initial state) goes through.

The React version keeps the same shape — one active index, \`useId()\` as the instance counter, a roving \`tabIndex\` and arrow keys on the tablist — and \`hidden={i !== active}\` on the panels.

## Worth saying out loud

- One delegated \`click\` on the tablist (not a listener per tab) keeps working when tabs are re-rendered and costs one listener per instance.
- \`hidden\` instead of a display class means the panels behave before CSS loads and stay hidden if a class name is renamed.
- Roving \`tabindex\` plus arrow keys is the WAI-ARIA tabs pattern — name it. Vertical tabs swap Up/Down and set \`aria-orientation="vertical"\`.
- \`useId()\` is the React answer to "the right ID pattern": unique per instance, stable across server and client.
- URL-synced tabs derive the active index from the hash or a search param and write it back in \`activate\`; heavy panels can render lazily while keeping the \`tabpanel\` shell for a11y.`,
    ui: tabsUi,
  },
  {
    slug: "star-rating-form",
    title: "Star Rating in a Form",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Real radio inputs behind the stars: the form submits itself, the keyboard works, N instances are N names.",
    prompt: `Build a star-rating widget that lives **inside a form** and submits the right value — reported in both the phone screen and an onsite round. The form, basic CSS, and two mount points are given; you add the control. Two ratings share the page, so **multiple instances** must work. Available as an HTML/CSS/JS template and a React one.

## Requirements

- Clicking a star selects that rating; the stars up to it light up.
- Submitting the form includes each rating as \`name → value\` (the page prints \`FormData\` under the button).
- Keyboard users can pick a rating; screen readers hear a labelled group.
- The two instances never interfere with each other.
- Hovering previews a rating without committing it.

## Follow-up

Half stars. A read-only display for an average like 4.3. Making it a controlled component with \`value\`/\`onChange\`.

## Worth asking out loud

Does the value have to submit with **no** JavaScript? Is hover preview required? Should the control be clearable back to zero? Which value does an unselected rating submit — nothing, or 0?`,
    hints: [
      "Say the key insight out loud: use real radio inputs. Then the form submits the value with zero JS, arrows/space work natively, screen readers get a radio group, and N instances are just N `name`s.",
      "Vanilla: render the radios 5 → 1 and lay the fieldset out with `flex-direction: row-reverse`, so `input:checked ~ label` lights every star to the left using only the sibling combinator. React: compute `star <= (hover || value)` per label instead.",
      "Hide the inputs visually, not with display:none — display:none removes them from the tab order. The given `.visually-hidden` class is there for exactly this.",
    ],
    solution: `## Approach

Use real radio inputs. Then the form submits \`name=value\` with no JavaScript (\`FormData\` just sees it), the keyboard works natively (arrows and space), screen readers get a radio group under the legend, and N instances are just N \`name\`s. The vanilla version renders the stars 5 → 1 with \`flex-direction: row-reverse\` so the CSS sibling selector \`input:checked ~ label\` lights up "every star to the left" — JavaScript only builds the markup, and even hover preview is pure CSS. The React version keeps the radios and adds a \`hover\` state to compute each label's class; \`useId()\` keeps ids unique per instance, and the parent form reads \`Object.fromEntries(new FormData(e.currentTarget))\` to get \`{ cleanliness: '4', location: '5' }\` with no extra wiring.

## Worth saying out loud

- Why not \`display: none\` on the input: it leaves the tab order; the visually-hidden pattern keeps it focusable.
- Half stars: ten radios valued \`0.5 … 5\` with the left half of each label clipped (\`clip-path: inset(0 50% 0 0)\`).
- Read-only average (4.3): a different component — no inputs, \`role="img"\` with \`aria-label="4.3 out of 5"\`, width-based fill.
- Controlled from a parent: add \`value\` + \`onChange\` props; keep \`defaultValue\` for the uncontrolled path.`,
    ui: starRatingUi,
  },
  {
    slug: "shuffle-deal-cards",
    title: "Shuffle and Deal Five Cards",
    category: "frontend",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Fisher–Yates, a splice, and fresh nodes per deal — the reveal animation comes free.",
    prompt: `With a deck of cards, shuffle, deal a five-card hand, and display it with a **reveal animation** — reported at Airbnb from 2019 through 2022 as "UI for a simple card game" / "dealing poker cards". The button, the hand container, and the card CSS (including the animation) are given, in an HTML/CSS/JS template and a React one.

## Requirements

- Build a standard 52-card deck; \`Deal 5\` shuffles once and deals from the remaining deck, reshuffling when fewer than five cards remain.
- Shuffle uniformly — \`arr.sort(() => Math.random() - 0.5)\` is the classic wrong answer.
- Render each card with its rank and suit, red suits in red, and stagger the reveal animation across the five cards.
- Show how many cards are left in the deck.

## Follow-up

Evaluate the hand (pair, two pair, … straight flush). Two players — who wins? A flip animation with two faces.

## Worth asking out loud

Jokers? Deal from the remaining deck or reshuffle every time? Stagger, flip, or fade for the reveal? Is hand evaluation in scope?`,
    hints: [
      "Pure logic first, no DOM: createDeck from SUITS × RANKS, an in-place Fisher–Yates shuffle (swap i with a random j ≤ i, from the end down), and deal via splice so the deck really shrinks.",
      "Make every deal produce fresh nodes so the CSS animation restarts: `hand.replaceChildren(...cards.map(renderCard))` in vanilla, or a deal counter folded into each card's `key` in React; set `animationDelay` per index for the stagger.",
      "Hand evaluation is a count histogram: sort the values, count duplicates, check flush (all one suit) and straight (five distinct values spanning 4, plus the A-high case).",
    ],
    solution: `## Approach

Separate the game logic from the rendering. \`createDeck\` is a product of suits and ranks; \`shuffle\` is an in-place Fisher–Yates (every permutation equally likely, O(n)); \`deal\` splices from the front so the deck genuinely shrinks. The vanilla layer renders fresh card nodes on every deal — \`replaceChildren\` restarts the CSS reveal animation with no reflow tricks — and staggers them with \`animationDelay\`. In React the deck lives in a \`useRef\` (it never needs to trigger a render) and a deal counter folded into each card's \`key\` gives the same fresh-nodes effect.

## Worth saying out loud

- Say why \`sort(() => Math.random() - 0.5)\` is wrong before anyone asks: the comparator is inconsistent, so the result is biased and engine-dependent. Fisher–Yates is O(n) and uniform.
- New nodes restart the animation because they're new; toggling a class on the same nodes would need the reflow trick.
- Two lines of \`console.assert\` (52 cards, no duplicates) beat a minute of hand-waving.
- Hand evaluation is a count histogram plus two booleans; "two players — who wins?" maps categories to ranks and tie-breaks on the sorted values. Flip animation: two faces with \`backface-visibility: hidden\` and \`rotateY(180deg)\`.`,
    ui: cardsUi,
  },
];
