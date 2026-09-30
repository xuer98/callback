import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank, UI part D: a star rating with half stars, a thousand
// stars and updates that touch only what changed. HTML/CSS/JS is the default
// template; a React template is the alternate. Both carry complete
// reference files.

const starCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.page {
  padding: 16px;
}

section + section {
  margin-top: 20px;
}

h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.stars {
  display: flex;
  flex-wrap: wrap; /* a thousand stars wrap inside their container */
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

.stars:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 4px;
}

.star {
  color: #d4d4d8;
}

.star[data-fill="full"] {
  color: #f5b301;
}

/* Half a star: a two-color gradient clipped to the glyph. */
.star[data-fill="half"] {
  background: linear-gradient(90deg, #f5b301 50%, #d4d4d8 50%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.large {
  max-height: 160px;
  overflow: auto;
  padding: 4px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
}

.large .stars {
  font-size: 18px;
}

.readout {
  margin: 8px 0 0;
  font-size: 13px;
  color: #52525b;
}
`,
};

// -- HTML/CSS/JS ------------------------------------------------------------------

const starHtml: UiFile = {
  name: "index.html",
  contents: `<main class="page">
  <section>
    <h2>Five stars</h2>
    <div id="small"></div>
    <p class="readout">Value: <output id="small-value">0</output></p>
  </section>
  <section>
    <h2>A thousand stars</h2>
    <div class="large"><div id="large"></div></div>
    <p class="readout">
      Value: <output id="large-value">0</output>. The last change touched
      <output id="large-touched">0</output> star elements.
    </p>
  </section>
</main>
`,
};

const starDemo: UiFile = {
  name: "demo.js",
  contents: `// Wiring for the page. Your code goes in star-rating.js.
import { createStarRating } from "./star-rating.js";

const small = createStarRating(document.getElementById("small"), {
  max: 5,
  value: 3,
  onChange: (value) => {
    document.getElementById("small-value").textContent = value;
  },
});
document.getElementById("small-value").textContent = small.value;

const largeRoot = document.getElementById("large");
const large = createStarRating(largeRoot, {
  max: 1000,
  value: 400,
  onChange: (value) => {
    document.getElementById("large-value").textContent = value;
  },
});
document.getElementById("large-value").textContent = large.value;

// Count the star elements each change writes to or inserts. An optimised
// update touches only the stars between the old and the new value.
new MutationObserver((records) => {
  const touched = new Set();
  for (const record of records) {
    if (record.type === "childList") record.addedNodes.forEach((node) => touched.add(node));
    else if (record.target !== largeRoot) touched.add(record.target);
  }
  document.getElementById("large-touched").textContent = touched.size;
}).observe(largeRoot, { attributes: true, childList: true, subtree: true });
`,
};

const starVanillaStarter = `/**
 * Render \`max\` stars into root and make them a rating control.
 * Returns { value, set(next) }; calls onChange(value) after every change.
 */
export function createStarRating(root, { max = 5, value = 0, onChange } = {}) {
  let current = value;

  // Your code here: half stars, the keyboard, and updates that touch
  // only the stars that change. This version rebuilds every star on
  // each click, and only knows whole stars.
  const render = () => {
    root.replaceChildren();
    for (let i = 0; i < max; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = "★";
      star.dataset.fill = i < current ? "full" : "none";
      star.addEventListener("click", () => {
        current = i + 1;
        render();
        onChange?.(current);
      });
      root.append(star);
    }
  };
  root.classList.add("stars");
  render();

  return {
    get value() {
      return current;
    },
    set(next) {
      current = next;
      render();
    },
  };
}
`;

const starVanillaSolution = `export function createStarRating(root, { max = 5, value = 0, onChange } = {}) {
  root.classList.add("stars");
  root.tabIndex = 0;
  root.setAttribute("role", "slider");
  root.setAttribute("aria-label", "Rating");
  root.setAttribute("aria-valuemin", "0");
  root.setAttribute("aria-valuemax", String(max));

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < max; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.dataset.index = String(i);
    star.textContent = "★";
    fragment.append(star);
  }
  root.append(fragment); // one DOM insertion, however many stars
  const stars = root.children;

  let current = 0;
  const paint = (next) => {
    // Touch only the stars between the old and the new value.
    const from = Math.floor(Math.min(current, next));
    const to = Math.min(max, Math.ceil(Math.max(current, next)));
    for (let i = from; i < to; i++) {
      stars[i].dataset.fill = next >= i + 1 ? "full" : next >= i + 0.5 ? "half" : "none";
    }
    current = next;
    root.setAttribute("aria-valuenow", String(current));
    root.setAttribute("aria-valuetext", current + " of " + max + " stars");
  };
  const set = (next) => {
    const clamped = Math.max(0, Math.min(max, Math.round(next * 2) / 2)); // halves only
    if (clamped === current) return;
    paint(clamped);
    onChange?.(current);
  };

  // One listener for all the stars.
  root.addEventListener("click", (event) => {
    const star = event.target.closest(".star");
    if (!star) return;
    const box = star.getBoundingClientRect();
    const leftHalf = event.clientX - box.left < box.width / 2;
    set(Number(star.dataset.index) + (leftHalf ? 0.5 : 1));
  });
  root.addEventListener("keydown", (event) => {
    const steps = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 };
    if (event.key in steps) set(current + steps[event.key]);
    else if (event.key === "Home") set(0);
    else if (event.key === "End") set(max);
    else return;
    event.preventDefault();
  });

  paint(Math.max(0, Math.min(max, value)));
  return {
    get value() {
      return current;
    },
    set,
  };
}
`;

// -- React ----------------------------------------------------------------------------

const starReactApp = `import { useState } from "react";
import { StarRating } from "./StarRating.jsx";

export default function App() {
  const [small, setSmall] = useState(3);
  const [large, setLarge] = useState(400);
  return (
    <main className="page">
      <section>
        <h2>Five stars</h2>
        <StarRating max={5} value={small} onChange={setSmall} label="Five-star rating" />
        <p className="readout">Value: {small}</p>
      </section>
      <section>
        <h2>A thousand stars</h2>
        <div className="large">
          <StarRating max={1000} value={large} onChange={setLarge} label="Thousand-star rating" />
        </div>
        <p className="readout">Value: {large}</p>
      </section>
    </main>
  );
}
`;

const starReactStarter = `/**
 * A controlled rating: renders \`max\` stars for \`value\` and calls
 * onChange(next). Your code here: half stars, the keyboard, and a
 * thousand stars that stay fast. This version only knows whole stars.
 */
export function StarRating({ max = 5, value, onChange, label = "Rating" }) {
  const stars = [];
  for (let i = 0; i < max; i++) {
    stars.push(
      <span key={i} className="star" data-fill={i < value ? "full" : "none"} onClick={() => onChange(i + 1)}>
        ★
      </span>,
    );
  }
  return (
    <div className="stars" aria-label={label}>
      {stars}
    </div>
  );
}
`;

const starReactSolution = `import { memo } from "react";

// Memoized with primitive props: a change re-renders only the stars whose fill changed.
const Star = memo(function Star({ index, fill }) {
  return (
    <span className="star" data-index={index} data-fill={fill}>
      ★
    </span>
  );
});

export function StarRating({ max = 5, value, onChange, label = "Rating" }) {
  const set = (next) => {
    const clamped = Math.max(0, Math.min(max, Math.round(next * 2) / 2)); // halves only
    if (clamped !== value) onChange(clamped);
  };

  // One handler on the container for all the stars.
  const onClick = (event) => {
    const star = event.target.closest(".star");
    if (!star) return;
    const box = star.getBoundingClientRect();
    set(Number(star.dataset.index) + (event.clientX - box.left < box.width / 2 ? 0.5 : 1));
  };
  const onKeyDown = (event) => {
    const steps = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 };
    if (event.key in steps) set(value + steps[event.key]);
    else if (event.key === "Home") set(0);
    else if (event.key === "End") set(max);
    else return;
    event.preventDefault();
  };

  const stars = [];
  for (let i = 0; i < max; i++) {
    const fill = value >= i + 1 ? "full" : value >= i + 0.5 ? "half" : "none";
    stars.push(<Star key={i} index={i} fill={fill} />);
  }
  return (
    <div
      className="stars"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={value + " of " + max + " stars"}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {stars}
    </div>
  );
}
`;

const starUi: UiWorkspace = {
  framework: "vanilla",
  files: [starHtml, { name: "star-rating.js", contents: starVanillaStarter }, starDemo, starCss],
  solution: [starHtml, { name: "star-rating.js", contents: starVanillaSolution }, starDemo, starCss],
  alternate: {
    framework: "react",
    files: [{ name: "App.jsx", contents: starReactApp }, { name: "StarRating.jsx", contents: starReactStarter }, starCss],
    solution: [{ name: "App.jsx", contents: starReactApp }, { name: "StarRating.jsx", contents: starReactSolution }, starCss],
  },
};

export const appleUiProblemsD: Problem[] = [
  {
    slug: "star-rating-half-stars",
    title: "Star Rating With Half Stars, at Scale",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Click to fill, half stars from the click position, a thousand stars, and updates that touch only what changed.",
    prompt: [
      "Build a star rating where a click fills every star up to the one clicked, then make it handle **half stars**, **a thousand stars**, and updates that are **well optimised**.",
      "",
      "The default template is HTML/CSS/JS: write `createStarRating(root, { max, value, onChange })` in `star-rating.js`, returning `{ value, set(next) }`. The React template asks for a controlled `<StarRating max value onChange />` instead.",
      "",
      "## Requirements",
      "",
      "- Clicking the left half of a star sets that star's half value (`2.5` for the third star), and the right half sets the whole value. Half stars look half-filled.",
      "- The rating is one focusable control: `role=\"slider\"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. The arrow keys step it by half a star, clamped at both ends.",
      "- With `max` at 1,000, the stars wrap inside their container, one listener serves all of them, and building them takes a single DOM insertion.",
      "- A change updates only the stars between the old and the new value. The HTML/CSS/JS demo counts the star elements each change writes to; the starter touches all 1,000.",
    ].join("\n"),
    hints: [
      "Decide half or whole from where the click landed: compare `event.clientX - box.left` with half the star's `getBoundingClientRect().width`.",
      "Build every star into a `DocumentFragment` and append it once. Put one click listener on the container, and find the star with `event.target.closest(\".star\")`.",
      "On a change from `a` to `b`, only stars with an index between `floor(min(a, b))` and `ceil(max(a, b))` can change their fill. Loop over just that range.",
    ],
    solution: [
      "## Approach",
      "",
      "The control is the container: it takes focus, carries the slider role, and owns the only click and keydown listeners. A click reads the clicked star's index and which half was hit. `set` clamps the value, snaps it to halves, and calls `paint`, which rewrites only the stars whose fill can have changed. Each star's fill is a `data-fill` attribute, and CSS draws the half with a gradient clipped to the glyph. In React, the same idea is `React.memo` on a `Star` with primitive props, so only stars whose fill changed re-render.",
      "",
      "| Requirement | How the reference meets it |",
      "|---|---|",
      "| Half stars | The click's position against half the star's width picks 0.5 or 1, and a gradient clipped to the glyph draws the half |",
      "| 1,000 stars | `flex-wrap` keeps them inside the container, one fragment inserts every node, and one delegated listener serves them all |",
      "| Optimised | A change repaints only the stars between the old and the new value. Going from 400 to 401.5 of 1,000 writes 2 attributes |",
      "",
      "## Worth saying out loud",
      "",
      "- Ask about precision up front: halves, tenths, or whole stars only? Half stars are the part most often skipped.",
      "- A thousand listeners and a full re-render on every change both work at 5 stars, and both are what \"well optimised\" is probing.",
      "- For a form, back the rating with real radio inputs, or submit it through a hidden input, so it participates in `FormData`. See [Star Rating in a Form](/problems/star-rating-form).",
      "- Screen readers announce `aria-valuetext`, such as \"3.5 of 5 stars\", which reads better than a bare number.",
    ].join("\n"),
    ui: starUi,
  },
];
