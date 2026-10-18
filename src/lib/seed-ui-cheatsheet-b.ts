import type { Problem, UiFile } from "./types";

// The UI-cheatsheet track, part B: the like button (network states) in
// React, with complete reference files.

const likeCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.page {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px;
}

.demo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #52525b;
}

.like {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.like__button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 2px solid #888;
  border-radius: 9999px;
  background: #ffffff;
  color: #888;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.like__button:hover {
  border-color: #f00;
  color: #f00;
}

.like__button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.like__button--liked,
.like__button--liked:hover {
  border-color: #f00;
  background: #f00;
  color: #ffffff;
}

.like__button[aria-disabled="true"] {
  cursor: progress;
}

.like__icon {
  width: 18px;
  height: 18px;
}

.like__spinner {
  animation: like-spin 0.8s linear infinite;
}

@keyframes like-spin {
  to {
    transform: rotate(360deg);
  }
}

.like__error {
  min-height: 18px;
  margin: 0;
  font-size: 13px;
  color: #b91c1c;
}
`,
};

const likeApi: UiFile = {
  name: "api.js",
  contents: `// Pretend this is fetch("/api/like", { method: "POST", body: { action } }).
// It answers after a short delay and fails about half the time, so every
// branch of the button is easy to reach.
export function toggleLike(action) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.5) {
        reject(new Error("Could not " + action + " right now. Please try again."));
      } else {
        resolve({ liked: action === "like" });
      }
    }, 600 + Math.random() * 600);
  });
}
`,
};

const likeIcons = `function HeartIcon({ filled }) {
  return (
    <svg
      className="like__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="like__icon like__spinner"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
`;

const likeDemo = `
export default function App() {
  return (
    <main className="page">
      <section className="demo">
        <h2>Default</h2>
        <LikeButton />
      </section>
      <section className="demo">
        <h2>Starts liked</h2>
        <LikeButton initialLiked />
      </section>
      <section className="demo">
        <h2>Optimistic</h2>
        <LikeButton optimistic />
      </section>
    </main>
  );
}
`;

const likeReactStarter =
  `import { useState } from "react";
import { toggleLike } from "./api.js";

` +
  likeIcons +
  `
// TODO: default, hovered, loading and liked states; toggleLike("like" | "unlike")
// on click; the error under the button; aria-pressed from the server's answer.
export function LikeButton({ initialLiked = false, optimistic = false }) {
  const [liked] = useState(initialLiked);
  return (
    <div className="like">
      <button type="button" className="like__button" aria-pressed={liked}>
        <HeartIcon filled={liked} />
        Like
      </button>
      <p className="like__error" role="alert"></p>
    </div>
  );
}
` +
  likeDemo;

const likeReactSolution =
  `import { useEffect, useRef, useState } from "react";
import { toggleLike } from "./api.js";

` +
  likeIcons +
  `
export function LikeButton({ initialLiked = false, optimistic = false }) {
  const [liked, setLiked] = useState(initialLiked); // what the server has confirmed
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleClick() {
    if (pending) return; // one request at a time, and the button keeps focus
    const next = !liked;
    setPending(true);
    setError("");
    if (optimistic) setLiked(next); // show the expected answer now
    try {
      const result = await toggleLike(next ? "like" : "unlike");
      if (mounted.current) setLiked(result.liked);
    } catch (err) {
      if (!mounted.current) return;
      if (optimistic) setLiked(!next); // the server disagreed: take it back
      setError(err.message);
    } finally {
      if (mounted.current) setPending(false);
    }
  }

  return (
    <div className="like">
      <button
        type="button"
        className={"like__button" + (liked ? " like__button--liked" : "")}
        aria-pressed={liked}
        aria-disabled={pending}
        aria-busy={pending}
        onClick={handleClick}
      >
        {pending ? <SpinnerIcon /> : <HeartIcon filled={liked} />}
        Like
      </button>
      <p className="like__error" role="alert">
        {error}
      </p>
    </div>
  );
}
` +
  likeDemo;

export const uiCheatsheetProblemsB: Problem[] = [
  {
    slug: "like-button",
    title: "Like Button",
    category: "frontend",
    difficulty: "medium",
    companies: ["amazon", "coinbase", "openai"],
    summary:
      "Three states the server confirms and one it hasn't: pending blocks a second click, failure shows its message, the label never changes.",
    prompt: [
      "Build a like button that talks to a server.",
      "",
      'The starter\'s `api.js` provides `toggleLike(action)`, a stand-in for a `POST`: it resolves after a short delay for `"like"` or `"unlike"`, and fails about half the time with an `Error` whose message says why. Three buttons render on the page; each must work on its own.',
      "",
      "## Requirements",
      "",
      "- **Default**: grey outline heart. **Hovered**: red outline. **Liked**: filled heart on a red background. Use `#f00` and `#888`; the look is not the point, the states are.",
      '- Clicking in the default state enters a **loading** state: the heart becomes a spinner, a second click does nothing, and `toggleLike("like")` is sent. On success the button becomes liked. On failure it returns to default (or hovered, if the pointer is still over it) and the error message appears under the button.',
      '- Clicking while liked does the reverse with `"unlike"`.',
      "- The visible label stays **Like** in every state. `aria-pressed` is `false` until the server confirms a like and `true` after, and a screen reader hears the error without focus moving.",
      "- `initialLiked` starts the button liked. `optimistic` flips the heart as soon as it is clicked and flips it back if the request fails.",
    ].join("\n"),
    hints: [
      "Three pieces of state cover every picture: `liked` (what the server has confirmed), `pending`, and `error`. Hovered is CSS, not state.",
      "Guard the click with `pending` rather than relying on `disabled`: a disabled button drops keyboard focus, so whoever pressed Enter loses their place when the answer arrives. `aria-disabled` tells assistive tech the same thing.",
      "Optimistic means setting the next value before the request and setting it back in `catch`. Anything that runs after an `await` should first check the component is still mounted.",
    ],
    solution: [
      "## Approach",
      "",
      "- `liked` holds what the server has confirmed; `pending` and `error` describe the request. Everything visible is derived: the class, the icon, `aria-pressed`, the message. Hover is `:hover` in CSS, so a pointer still over the button after a failure needs no code.",
      '- The click handler returns at once while `pending`, then sends `toggleLike(next ? "like" : "unlike")`. Success writes the server\'s answer, failure writes the message, `finally` clears `pending`, and every write after the `await` checks a mounted ref first.',
      "- `aria-disabled` plus the early return instead of `disabled`: the button stays focusable, so a keyboard user who pressed Enter is still on it when the answer lands.",
      '- The error lives in a `role="alert"` paragraph that is always in the DOM. Setting its text announces it, and `min-height` keeps the layout from jumping.',
      "- `optimistic` writes `next` before the request and `!next` in `catch`. The pending guard is what makes that safe: with one request in flight there is exactly one value to revert to.",
      "",
      "## Worth saying out loud",
      "",
      "- If clicks could overlap (no guard, or a queue), responses can arrive out of order and a stale one must be ignored: stamp each request with a counter and apply only the latest.",
      "- A like count is derived too: keep the number the server gave, add one while optimistic, never store both.",
      "- Retrying after a failure is a product decision; expose it as a prop rather than deciding inside the button.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [
        { name: "App.jsx", contents: likeReactStarter },
        likeApi,
        likeCss,
      ],
      solution: [
        { name: "App.jsx", contents: likeReactSolution },
        likeApi,
        likeCss,
      ],
    },
  },
];
