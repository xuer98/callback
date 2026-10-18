import type { Problem, UiFile } from "./types";

// Snowflake front-end prompts, part H: the useDebounce hook and the
// Traffic Light from GreatFrontEnd's list, in React, each with one template
// and complete reference files.

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

// -- traffic light (React) ----------------------------------------------------

const trafficCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.lights {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 16px;
}

.traffic-light {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background: #27272a;
}

.traffic-light--horizontal {
  flex-direction: row;
}

.light {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #52525b;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
`,
};

const trafficDemo = `// Listed in housing order, top to bottom; "next" is the cycle.
const CONFIG = {
  red: { color: "#ef4444", duration: 4000, next: "green" },
  yellow: { color: "#eab308", duration: 500, next: "red" },
  green: { color: "#22c55e", duration: 3000, next: "yellow" },
};

export default function App() {
  return (
    <main className="lights">
      <TrafficLight config={CONFIG} initialColor="green" />
      <TrafficLight config={CONFIG} initialColor="red" layout="horizontal" />
    </main>
  );
}
`;

const trafficReactStarter = `import { useEffect, useState } from "react";

${trafficDemo}
// TODO: light the current colour, move to config[current].next after
// config[current].duration ms, forever, and announce the current light.
function TrafficLight({ config, initialColor, layout = "vertical" }) {
  return (
    <div className={"traffic-light traffic-light--" + layout}>
      {Object.keys(config).map((color) => (
        <div key={color} className="light" />
      ))}
    </div>
  );
}
`;

const trafficReactSolution = `import { useEffect, useState } from "react";

${trafficDemo}
function TrafficLight({ config, initialColor, layout = "vertical" }) {
  const [current, setCurrent] = useState(initialColor);
  const { duration, next } = config[current];

  // One timeout per light rather than an interval, because the durations
  // differ. Keyed on the current colour, the effect re-arms after every
  // change, and its cleanup clears the pending timer on unmount.
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(next), duration);
    return () => clearTimeout(timer);
  }, [current, duration, next]);

  return (
    <div className={"traffic-light traffic-light--" + layout}>
      <span className="sr-only" aria-live="polite">
        Current light: {current}
      </span>
      {Object.keys(config).map((color) => (
        <div
          key={color}
          className="light"
          aria-hidden="true"
          style={{ backgroundColor: color === current ? config[color].color : undefined }}
        />
      ))}
    </div>
  );
}
`;

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
  {
    slug: "traffic-light",
    title: "Traffic Light",
    category: "frontend",
    difficulty: "easy",
    companies: ["snowflake"],
    summary:
      "One state value and one timeout per light, re-armed by an effect keyed on the colour; an interval can't do unequal durations.",
    prompt: [
      "Build a traffic light that cycles green, yellow, red and loops forever. The demo mounts two: a vertical one starting on green and a horizontal one starting on red.",
      "",
      "## Requirements",
      "",
      "- Each light stays lit for its own time: red 4000 ms, yellow 500 ms, green 3000 ms. The order is green, then yellow, then red, then green again.",
      "- `TrafficLight` reads the colours, durations and order from its `config` prop and starts on `initialColor`, so the two lights run independently.",
      "- Only the current light is lit; the others stay dim.",
      '- Assistive technology hears the current light through a polite live announcement such as "Current light: green"; the purely visual lights are hidden from it.',
      "- No timer survives the component's unmount.",
    ].join("\n"),
    hints: [
      "The state is one string, the current colour. Everything else — which lamp is lit, how long to wait, what comes next — is a lookup in `config`.",
      "`setInterval` fires at one fixed rate and the three durations differ. Schedule a single `setTimeout` for the current light's duration in an effect keyed on the current colour; when it fires and the colour changes, the effect runs again and arms the next one.",
      "Return `clearTimeout` from the effect: it cancels the pending change on unmount, and React also runs it before re-running the effect, so there is never more than one timer.",
    ],
    solution: [
      "## Approach",
      "",
      '`useState(initialColor)` holds the current colour. An effect on that colour schedules one timeout for `config[current].duration` that sets `config[current].next`; its cleanup clears the timeout. Each change re-runs the effect, so the cycle is a chain of timeouts rather than an interval, and unequal durations come for free. The lamps are plain divs with `aria-hidden`, lit by comparing their colour with the current one, and a visually hidden `aria-live="polite"` span carries the text that screen readers announce.',
      "",
      "## Worth saying out loud",
      "",
      "- A background tab throttles timers, so the real elapsed time can drift; if accuracy matters, compare `Date.now()` against the light's start time instead of trusting the timeout.",
      "- Pausing is a `paused` flag the effect reads: skip scheduling while paused, and store the remaining time if resuming must continue mid-light.",
      "- Turning the config into an ordered array makes the cycle explicit and lets a pedestrian or flashing phase be inserted without touching the component.",
    ].join("\n"),
    ui: {
      framework: "react",
      files: [{ name: "App.jsx", contents: trafficReactStarter }, trafficCss],
      solution: [
        { name: "App.jsx", contents: trafficReactSolution },
        trafficCss,
      ],
    },
  },
];
