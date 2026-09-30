import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), UI part G: an
// image carousel with previous, next and page buttons, wrap-around, any
// image fitted inside a fixed frame, and one image element in the DOM
// (GreatFrontEnd's Apple list). React is the default template and
// HTML/CSS/JS the alternate. Images are generated SVGs in five aspect
// ratios, since the preview has no network.

const carouselImages: UiFile = {
  name: "images.js",
  contents: `// Generated images in five aspect ratios: the preview has no network.
const svg = (width, height, fill, label) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
      '<rect width="100%" height="100%" fill="' + fill + '"/>' +
      '<text x="50%" y="50%" fill="#fff" font-family="system-ui, sans-serif" font-size="' +
      Math.round(Math.min(width, height) / 7) +
      '" text-anchor="middle" dominant-baseline="middle">' + label + "</text></svg>",
  );

export const IMAGES = [
  { src: svg(1600, 900, "#2563eb", "Wide 16:9"), alt: "A wide blue panel" },
  { src: svg(900, 1600, "#16a34a", "Tall 9:16"), alt: "A tall green panel" },
  { src: svg(1000, 1000, "#db2777", "Square"), alt: "A square pink panel" },
  { src: svg(2400, 600, "#ea580c", "Panorama"), alt: "A very wide orange panel" },
  { src: svg(600, 800, "#7c3aed", "Portrait"), alt: "A purple portrait panel" },
];
`,
};

const carouselCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.carousel {
  max-width: 480px;
  padding: 16px;
}

.carousel:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

/* A fixed frame: every image fits inside it without cropping or
   distortion, and nothing around it moves when the image changes. */
.frame {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  background: #18181b;
  overflow: hidden;
}

.frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.arrow {
  width: 36px;
  height: 36px;
  border: 1px solid #d4d4d8;
  border-radius: 50%;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
}

.pages {
  display: flex;
  gap: 8px;
}

.page {
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #d4d4d8;
  cursor: pointer;
}

.page[aria-current="true"] {
  background: #2563eb;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
`,
};

// -- React --------------------------------------------------------------------------

const carouselReactStarter = `import { IMAGES } from "./images.js";

// Your code here: previous and next that wrap around, a page button per
// image, the current one marked, arrow keys, and every image fitted
// inside the frame. Keep one <img> in the DOM and swap what it shows.
export default function App() {
  const image = IMAGES[0];
  return (
    <section className="carousel" aria-label="Gallery">
      <div className="frame">
        <img src={image.src} alt={image.alt} />
      </div>
      <div className="controls">
        <button type="button" className="arrow" aria-label="Previous image">
          ‹
        </button>
        <button type="button" className="arrow" aria-label="Next image">
          ›
        </button>
      </div>
    </section>
  );
}
`;

const carouselReactSolution = `import { useState } from "react";
import { IMAGES } from "./images.js";

export default function App() {
  const [index, setIndex] = useState(0);
  const count = IMAGES.length;
  const go = (i) => setIndex(((i % count) + count) % count); // wraps both ways
  const image = IMAGES[index];

  const onKeyDown = (event) => {
    if (event.key === "ArrowLeft") go(index - 1);
    else if (event.key === "ArrowRight") go(index + 1);
    else return;
    event.preventDefault();
  };

  return (
    <section className="carousel" aria-roledescription="carousel" aria-label="Gallery" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="frame">
        {/* One element: React keeps this node and updates src and alt. */}
        <img src={image.src} alt={image.alt} />
      </div>
      <div className="controls">
        <button type="button" className="arrow" aria-label="Previous image" onClick={() => go(index - 1)}>
          ‹
        </button>
        <div className="pages">
          {IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className="page"
              aria-label={"Image " + (i + 1)}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="arrow" aria-label="Next image" onClick={() => go(index + 1)}>
          ›
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        Image {index + 1} of {count}
      </p>
    </section>
  );
}
`;

// -- HTML/CSS/JS ------------------------------------------------------------------

const carouselHtml: UiFile = {
  name: "index.html",
  contents: `<section class="carousel" id="carousel" aria-roledescription="carousel" aria-label="Gallery" tabindex="0">
  <div class="frame"><img id="image" alt="" /></div>
  <div class="controls">
    <button type="button" class="arrow" id="prev" aria-label="Previous image">‹</button>
    <div class="pages" id="pages"></div>
    <button type="button" class="arrow" id="next" aria-label="Next image">›</button>
  </div>
  <p class="sr-only" id="announce" aria-live="polite"></p>
</section>
`,
};

const carouselVanillaStarter = `import { IMAGES } from "./images.js";

// Your code here: previous and next that wrap around, a page button per
// image, the current one marked, arrow keys, and every image fitted
// inside the frame. Keep the one <img> and swap what it shows.
const image = document.getElementById("image");
image.src = IMAGES[0].src;
image.alt = IMAGES[0].alt;
`;

const carouselVanillaSolution = `import { IMAGES } from "./images.js";

const root = document.getElementById("carousel");
const image = document.getElementById("image"); // the only <img>, reused for every picture
const pages = document.getElementById("pages");
const announce = document.getElementById("announce");
const count = IMAGES.length;
let index = 0;

const pageButtons = IMAGES.map((_, i) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "page";
  button.setAttribute("aria-label", "Image " + (i + 1));
  button.addEventListener("click", () => go(i));
  return button;
});
pages.append(...pageButtons);

function go(i) {
  index = ((i % count) + count) % count; // wraps both ways
  image.src = IMAGES[index].src;
  image.alt = IMAGES[index].alt;
  pageButtons.forEach((button, j) => {
    if (j === index) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  announce.textContent = "Image " + (index + 1) + " of " + count;
}

document.getElementById("prev").addEventListener("click", () => go(index - 1));
document.getElementById("next").addEventListener("click", () => go(index + 1));
root.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") go(index - 1);
  else if (event.key === "ArrowRight") go(index + 1);
  else return;
  event.preventDefault();
});

go(0);
`;

const carouselUi: UiWorkspace = {
  framework: "react",
  files: [{ name: "App.jsx", contents: carouselReactStarter }, carouselImages, carouselCss],
  solution: [{ name: "App.jsx", contents: carouselReactSolution }, carouselImages, carouselCss],
  alternate: {
    framework: "vanilla",
    files: [carouselHtml, { name: "carousel.js", contents: carouselVanillaStarter }, carouselImages, carouselCss],
    solution: [carouselHtml, { name: "carousel.js", contents: carouselVanillaSolution }, carouselImages, carouselCss],
  },
};

export const appleUiProblemsG: Problem[] = [
  {
    slug: "image-carousel",
    title: "Image Carousel With One Image Element",
    category: "frontend",
    difficulty: "easy",
    companies: ["apple"],
    summary:
      "Previous, next and page buttons that wrap around, any aspect ratio fitted to a fixed frame, and a single `<img>`.",
    prompt: [
      "Build an image carousel with previous, next and page buttons. The probes: **wrap-around** navigation, fitting images of **any shape** inside a fixed frame, and keeping **only one image element** in the DOM. The default template is React, and an HTML/CSS/JS template is the alternate.",
      "",
      "## Requirements",
      "",
      "- Previous on the first image goes to the last, and Next on the last goes to the first.",
      "- One page button per image jumps straight to it. The current one is marked, visibly and with `aria-current`.",
      "- The five images have different aspect ratios. Each fits entirely inside the frame, without cropping or distortion, and the frame and controls never move as images change.",
      "- There is exactly one `<img>` in the DOM at any time, and navigation changes its `src` and `alt`.",
      "- With the carousel focused, ArrowLeft and ArrowRight navigate. A live region announces \"Image 2 of 5\".",
      "",
      "*Listed under Apple by GreatFrontEnd, with no date or role.*",
    ].join("\n"),
    hints: [
      "Wrap with a modulo that handles negatives: `((i % n) + n) % n`. A plain `i % n` gives `-1` for `i = -1`.",
      "A frame with a fixed `aspect-ratio`, holding an image with `width: 100%`, `height: 100%` and `object-fit: contain`, letterboxes any shape without distortion.",
      "In React, render a single `<img>` without a changing `key`, and React updates the same node. In plain DOM, keep a reference to the one element and set its `src` and `alt`.",
    ],
    solution: [
      "## Approach",
      "",
      "All the state is one index. `go` normalizes any integer into range with a modulo that works for negatives, so previous and next are `go(index - 1)` and `go(index + 1)`, and the page buttons are `go(i)`. The frame has a fixed aspect ratio, and the image fills it with `object-fit: contain`, so every shape letterboxes inside it and the layout never shifts. Only the `src` and `alt` of one `<img>` change.",
      "",
      "## Worth saying out loud",
      "",
      "- **`i % n` is negative for negative `i` in JavaScript.** Adding `n` before the second modulo fixes the wrap to the last image.",
      "- `object-fit: contain` letterboxes, and `cover` fills the frame by cropping. Ask which the design wants.",
      "- One element keeps the DOM small, but a swap shows a blank frame while the next image decodes. Preload neighbors with `new Image().src = next`, or `img.decode()` before swapping.",
      "- Follow-ups: swipe on touch, autoplay that pauses on hover and focus (see [Carousel with a Per-Slide Countdown](/problems/carousel-per-slide-countdown)), and `loading=\"lazy\"` on the rest when there are many images.",
    ].join("\n"),
    ui: carouselUi,
  },
];
