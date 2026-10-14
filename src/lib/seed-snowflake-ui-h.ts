import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part H: the useDebounce hook from
// GreatFrontEnd's list, in React, with one template and complete reference
// files. The demo around it shows the hook's effect.

const debounceCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.search {
  padding: 16px;
  max-width: 420px;
}

.search label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search input {
  padding: 8px 10px;
  border: 1px solid #a1a1aa;
  border-radius: 6px;
  font: inherit;
}

.search p {
  margin: 12px 0 4px;
}

.search ol {
  margin: 4px 0 0;
  padding-left: 20px;
  color: #52525b;
}
`,
};

const debounceDemo = `export default function App() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [requests, setRequests] = useState([]);

  // Stands in for the network call: fires once per settled value.
  useEffect(() => {
    if (debouncedQuery.trim()) setRequests((sent) => [...sent, debouncedQuery]);
  }, [debouncedQuery]);

  return (
    <main className="search">
      <label>
        Search
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type, then pause" />
      </label>
      <p>
        Typing: <strong>{query || "(nothing)"}</strong>
      </p>
      <p>
        Debounced: <strong>{debouncedQuery || "(nothing)"}</strong>
      </p>
      <p>Requests sent: {requests.length}</p>
      <ol>
        {requests.map((sent, index) => (
          <li key={index}>{sent}</li>
        ))}
      </ol>
    </main>
  );
}
`;

const debounceReactStarter = `import { useEffect, useState } from "react";

/**
 * The latest value, updated only once it has stopped changing for delay ms.
 * TODO: right now it returns the value immediately.
 */
export function useDebounce(value, delay) {
  return value;
}

${debounceDemo}`;

const debounceReactSolution = `import { useEffect, useState } from "react";

/** The latest value, updated only once it has stopped changing for delay ms. */
export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  // Every change arms a timer and disarms the previous one; only a value that
  // survives delay ms without being replaced reaches the state.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

${debounceDemo}`;

export const snowflakeUiProblemsH: Problem[] = [
  {
    slug: "use-debounce-hook",
    title: "useDebounce Hook",
    category: "frontend",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "A state copy of the value and one effect whose cleanup cancels the pending update on every change.",
    prompt: [
      "Implement `useDebounce(value, delay)`: a hook that returns `value`, but only updates its result once `value` has stopped changing for `delay` milliseconds. The demo around it counts how many \"requests\" a search box would send.",
      "",
      "## Requirements",
      "",
      "- The returned value starts equal to the initial `value`.",
      "- While the value keeps changing within `delay`, the returned value stays unchanged; it catches up `delay` ms after the last change.",
      "- Changing `delay` restarts the wait.",
      "- No timer is left behind when the component unmounts.",
      "- With the hook working, typing a word quickly in the demo sends one request, not one per keystroke.",
    ].join("\n"),
    hints: [
      "Keep the debounced value in `useState`, initialised from `value`.",
      "One `useEffect` on `[value, delay]` sets a timeout that copies `value` into state and returns a cleanup that clears it. Each change cancels the previous timeout before scheduling a new one.",
    ],
    solution: [
      "## Approach",
      "",
      "State holds the debounced copy. An effect keyed on the value and delay schedules the copy after `delay` ms; its cleanup clears the timeout, so a rapid sequence of changes keeps cancelling until one change is followed by silence. Unmount runs the same cleanup.",
      "",
      "## Worth saying out loud",
      "",
      "- The difference from a debounced callback (`useDebouncedCallback`): this debounces a value and re-renders when it settles, which composes with `useEffect` for fetching.",
      "- Leading-edge or max-wait options mean a ref for the last fire time; the shape stays one effect with cleanup.",
      "- In tests, fake timers (`vi.useFakeTimers`) and `act` advance the clock deterministically.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: debounceReactStarter }, debounceCss],
      solution: [{ name: "App.jsx", contents: debounceReactSolution }, debounceCss],
    },
  },
];
