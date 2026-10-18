import type { Problem, UiFile } from "./types";

// The JavaScript-coding track, part C: Data Selection (filter and merge
// records, judged) and getElementsByTagName (a DOM walk, built in the
// HTML/CSS/JS workspace against a fixture page with the browser as oracle).

const sessions = [
  { user: 8, duration: 50, equipment: ["bench"] },
  { user: 7, duration: 150, equipment: ["dumbbell", "kettlebell"] },
  { user: 1, duration: 10, equipment: ["barbell"] },
  { user: 7, duration: 100, equipment: ["bike", "kettlebell"] },
  { user: 7, duration: 200, equipment: ["bike"] },
  { user: 2, duration: 200, equipment: ["treadmill"] },
  { user: 2, duration: 200, equipment: ["bike"] },
];

const tagQueryCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.page {
  max-width: 560px;
  padding: 16px;
}

.query {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.query input {
  padding: 8px 10px;
  border: 1px solid #a1a1aa;
  border-radius: 6px;
  font: inherit;
}

.summary {
  min-height: 20px;
  margin: 8px 0 12px;
  font-size: 14px;
}

.summary--ok {
  color: #15803d;
}

.summary--bad {
  color: #b91c1c;
}

.fixture {
  padding: 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #ffffff;
}

.card {
  padding: 8px 10px;
  margin-bottom: 8px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 15px;
}

.row {
  display: flex;
  gap: 12px;
  margin: 4px 0;
}

.hit {
  outline: 2px solid #f59e0b;
  outline-offset: 1px;
  background: #fef3c7;
}
`,
};

const tagQueryHtml: UiFile = {
  name: "index.html",
  contents: `<main class="page">
  <label class="query">
    Tag name
    <input id="tag" type="search" value="div" autocomplete="off" spellcheck="false" />
  </label>
  <p id="summary" class="summary"></p>

  <div id="fixture" class="fixture">
    <div class="card">
      <h2>Trail notes</h2>
      <p>Three loops, <em>two</em> with water.</p>
      <ul>
        <li><a href="#">North ridge</a></li>
        <li><a href="#">River <span>bend</span></a></li>
        <li>Quarry <!-- closed in winter --> road</li>
      </ul>
    </div>
    <div class="card">
      <h2>Gear</h2>
      <div class="row"><span>Boots</span><span>Poles</span></div>
      <div class="row"><span>Map</span><div><span>Spare</span> laces</div></div>
      <p>Text with no tags at all.</p>
    </div>
    <section>
      <p>A <b>bold</b> claim and a <a href="#">link</a>.</p>
      <div class="shout">One more div, inside a section.</div>
    </section>
  </div>
</main>
`,
};

const tagQueryDemo: UiFile = {
  name: "demo.js",
  contents: `import { getElementsByTagName } from "./dom-query.js";

// Page wiring only: highlight what your function returns and compare it with
// the browser's own answer (querySelectorAll is allowed here, as the oracle).
const fixture = document.querySelector("#fixture");
const input = document.querySelector("#tag");
const summary = document.querySelector("#summary");

function run() {
  const tag = input.value.trim();
  for (const el of fixture.querySelectorAll(".hit")) el.classList.remove("hit");
  if (!tag) {
    summary.textContent = "Type a tag name.";
    summary.className = "summary";
    return;
  }
  const mine = getElementsByTagName(fixture, tag);
  let theirs = [];
  try {
    theirs = Array.from(fixture.querySelectorAll(tag));
  } catch (err) {
    theirs = [];
  }
  for (const el of mine) if (el instanceof Element) el.classList.add("hit");
  const same =
    mine.length === theirs.length && mine.every((el, i) => el === theirs[i]);
  summary.textContent = same
    ? mine.length + " found, in document order; matches the browser"
    : mine.length + " found; the browser finds " + theirs.length;
  summary.className = "summary " + (same ? "summary--ok" : "summary--bad");
}

input.addEventListener("input", run);
run();
`,
};

const tagQueryStarter = `/**
 * Every descendant element of \`element\` whose tag is \`tagName\`, in document
 * order, as an array. Do not call element.getElementsByTagName or querySelectorAll.
 * @param {Element} element
 * @param {string} tagName
 * @returns {Element[]}
 */
export function getElementsByTagName(element, tagName) {
  // Your code here
  return [];
}
`;

const tagQuerySolution = `export function getElementsByTagName(element, tagName) {
  const wanted = tagName.toUpperCase(); // HTML elements report tagName in upper case
  const matches = [];
  function walk(node) {
    for (const child of node.children) {
      // children holds elements only, so text and comment nodes never appear
      if (child.tagName === wanted) matches.push(child);
      walk(child); // depth-first, children in order: document order for free
    }
  }
  walk(element);
  return matches;
}
`;

export const jsPlaybookProblemsC: Problem[] = [
  {
    slug: "data-selection",
    title: "Data Selection",
    category: "frontend",
    difficulty: "hard",
    companies: ["amazon", "meta", "openai", "palantir", "stripe", "tiktok"],
    summary:
      "Merge per user with a Map re-inserted on every session so order follows the last one, then filter the merged rows.",
    prompt: [
      "A data set of gym sessions looks like this. Each row has the user's id, the session's `duration` in minutes, and the `equipment` used, in alphabetical order (there are only five kinds).",
      "",
      "```js",
      "const sessions = [",
      '  { user: 8, duration: 50, equipment: ["bench"] },',
      '  { user: 7, duration: 150, equipment: ["dumbbell", "kettlebell"] },',
      '  { user: 1, duration: 10, equipment: ["barbell"] },',
      '  { user: 7, duration: 100, equipment: ["bike", "kettlebell"] },',
      '  { user: 7, duration: 200, equipment: ["bike"] },',
      '  { user: 2, duration: 200, equipment: ["treadmill"] },',
      '  { user: 2, duration: 200, equipment: ["bike"] },',
      "];",
      "```",
      "",
      "Implement `selectData(sessions, options)`, which returns the sessions selected by these options:",
      "",
      "- `user`: only this user's sessions.",
      "- `minDuration`: only sessions at least this long.",
      "- `equipment`: only sessions that used **at least one** of these.",
      "- `merge`: when `true`, sessions of the same user become one row: durations summed, equipment combined, de-duplicated and sorted. Merged rows are ordered by each user's **last** position in the input, so the user sequence 8, 7, 1, 7, 7, 2, 2 becomes 8, 1, 7, 2. The other options filter the **merged** rows.",
      "",
      "Without `merge`, rows keep their input order. Never modify the input objects.",
      "",
      "```js",
      "selectData(sessions, { merge: true });",
      "// [",
      '//   { user: 8, duration: 50, equipment: ["bench"] },',
      '//   { user: 1, duration: 10, equipment: ["barbell"] },',
      '//   { user: 7, duration: 450, equipment: ["bike", "dumbbell", "kettlebell"] },',
      '//   { user: 2, duration: 400, equipment: ["bike", "treadmill"] },',
      "// ]",
      "selectData(sessions, { merge: true, minDuration: 400 }); // users 7 and 2",
      "```",
    ].join("\n"),
    hints: [
      "Merge first, filter second: the options describe the rows that come out, and after a merge those rows are the merged ones.",
      "A `Map` keeps insertion order. To make a user's position follow their *last* session, delete the entry and set it again each time that user appears.",
      "Build new objects when merging — `[...a, ...b]` into a `Set`, then sort — so the input is never touched.",
    ],
    solution: [
      "## Approach",
      "",
      "- Two stages: optionally merge, then filter. Filtering is one `every`-style predicate per row: each option that is present must hold, each that is absent is ignored.",
      "- Merging walks the sessions once with a `Map` from user to the merged row. On a repeat user, delete the entry and set it again with the summed duration and the union of equipment, so the Map's insertion order ends up being each user's last position. `[...map.values()]` is then already in the required order.",
      "- Equipment union is `new Set([...a, ...b])`, spread and sorted. Every merged row is a fresh object with a fresh array, so the input objects are never mutated; without `merge`, returning the original objects is fine because nothing changes them.",
      "",
      "## Worth saying out loud",
      "",
      "- Ask which order the interviewer wants for merged rows before coding: first position, last position, and by user id are all plausible, and the delete-and-set trick only exists for *last*.",
      '- `equipment` matching is "any of" here; "all of" is `every(... includes ...)` and worth confirming.',
      "- Check `=== undefined`, not truthiness, for the options: `user: 0` and `minDuration: 0` are valid filters.",
    ].join("\n"),
    judge: {
      starterCode: `/**
 * @param {Array<{ user: number, duration: number, equipment: string[] }>} sessions
 * @param {{ user?: number, minDuration?: number, equipment?: string[], merge?: boolean }} [options]
 * @returns {Array<{ user: number, duration: number, equipment: string[] }>}
 */
function selectData(sessions, options = {}) {
  // Your code here
  return sessions;
}
`,
      solutionCode: `function selectData(sessions, options = {}) {
  const { user, minDuration, equipment, merge } = options;

  let rows = sessions;
  if (merge) {
    const byUser = new Map();
    for (const session of sessions) {
      const existing = byUser.get(session.user);
      if (existing) {
        byUser.delete(session.user); // re-insert so the order follows the user's last session
        byUser.set(session.user, {
          user: session.user,
          duration: existing.duration + session.duration,
          equipment: [...new Set([...existing.equipment, ...session.equipment])].sort(),
        });
      } else {
        byUser.set(session.user, {
          user: session.user,
          duration: session.duration,
          equipment: [...session.equipment],
        });
      }
    }
    rows = [...byUser.values()];
  }

  return rows.filter(
    (row) =>
      (user === undefined || row.user === user) &&
      (minDuration === undefined || row.duration >= minDuration) &&
      (equipment === undefined || equipment.some((item) => row.equipment.includes(item))),
  );
}
`,
      entry: "__judgeSelectData",
      driverCode: `function __judgeSelectData(sessions, options, mode) {
  var snapshot = JSON.stringify(sessions);
  var result = options === null ? selectData(sessions) : selectData(sessions, options);
  if (mode === "input-unchanged") return JSON.stringify(sessions) === snapshot;
  return result;
}`,
      tests: [
        {
          name: "no options: everything, in order",
          input: [sessions, null, null],
          expected: sessions,
        },
        {
          name: "user",
          input: [sessions, { user: 2 }, null],
          expected: [sessions[5], sessions[6]],
        },
        {
          name: "minDuration",
          input: [sessions, { minDuration: 200 }, null],
          expected: [sessions[4], sessions[5], sessions[6]],
        },
        {
          name: "minDuration nobody reaches",
          input: [sessions, { minDuration: 400 }, null],
          expected: [],
        },
        {
          name: "equipment: any of",
          input: [sessions, { equipment: ["bike", "dumbbell"] }, null],
          expected: [sessions[1], sessions[3], sessions[4], sessions[6]],
        },
        {
          name: "merge: summed, unioned, ordered by last position",
          input: [sessions, { merge: true }, null],
          expected: [
            { user: 8, duration: 50, equipment: ["bench"] },
            { user: 1, duration: 10, equipment: ["barbell"] },
            {
              user: 7,
              duration: 450,
              equipment: ["bike", "dumbbell", "kettlebell"],
            },
            { user: 2, duration: 400, equipment: ["bike", "treadmill"] },
          ],
        },
        {
          name: "merge, then minDuration",
          input: [sessions, { merge: true, minDuration: 400 }, null],
          expected: [
            {
              user: 7,
              duration: 450,
              equipment: ["bike", "dumbbell", "kettlebell"],
            },
            { user: 2, duration: 400, equipment: ["bike", "treadmill"] },
          ],
        },
        {
          name: "merge, then user",
          input: [sessions, { merge: true, user: 7 }, null],
          expected: [
            {
              user: 7,
              duration: 450,
              equipment: ["bike", "dumbbell", "kettlebell"],
            },
          ],
        },
        {
          name: "merge, then equipment",
          input: [sessions, { merge: true, equipment: ["treadmill"] }, null],
          expected: [
            { user: 2, duration: 400, equipment: ["bike", "treadmill"] },
          ],
        },
        {
          name: "the input is not modified by a merge",
          input: [sessions, { merge: true }, "input-unchanged"],
          expected: true,
        },
      ],
    },
  },
  {
    slug: "get-elements-by-tag-name",
    title: "Implement getElementsByTagName",
    category: "frontend",
    difficulty: "medium",
    companies: ["amazon", "dropbox", "google", "netflix"],
    summary:
      "A depth-first walk over `children` comparing upper-cased tag names: document order for free, text nodes never seen.",
    prompt: [
      "Implement `getElementsByTagName(element, tagName)` in `dom-query.js`: a pure function that returns an **array** of the element's descendants with that tag name — like the DOM's own method, but without calling it, and without `querySelectorAll`, which would make the question trivial.",
      "",
      "- Only descendants are searched, never the element itself.",
      '- Tag names are case-insensitive: `"div"` and `"DIV"` find the same elements.',
      "- Results come back in document order.",
      "- Text and comment nodes are never results and must not break the walk.",
      "",
      "The page has a nested fixture: type a tag name and the matches are highlighted, counted, and checked against the browser's own answer.",
    ].join("\n"),
    hints: [
      "`node.children` is the element-only view of a node's contents; `childNodes` includes text and comments. Pick the one that makes the type check disappear.",
      "An HTML element's `tagName` is upper case, so upper-case the argument once and compare with `===`.",
      "Recurse into each child *after* testing it and before moving to its sibling: that is pre-order depth-first, which is document order.",
    ],
    solution: [
      "## Approach",
      "",
      "A pre-order depth-first walk starting from the element's `children`, never the element itself. Each child is tested — `tagName` upper-cased against the upper-cased argument — and then walked before its next sibling, which yields document order with no sorting. Because the walk uses `children` rather than `childNodes`, text and comment nodes are never visited, so no type check is needed.",
      "",
      "## Worth saying out loud",
      "",
      "- The real method returns a *live* `HTMLCollection` that changes as the DOM does; this returns a snapshot array, like `querySelectorAll` does. Say which the caller gets.",
      "- Recursion depth is the DOM's depth, which is never a problem; an explicit stack version is the same code with `stack.push(...children)` reversed to keep order.",
      "- In a mixed document, SVG and other namespaced elements keep their `tagName` case; comparing lower-cased `localName` handles both worlds.",
      "- `TreeWalker` with `NodeFilter.SHOW_ELEMENT` is the built-in way to do this walk, and a good thing to name.",
    ].join("\n"),
    ui: {
      framework: "vanilla",
      files: [
        tagQueryHtml,
        { name: "dom-query.js", contents: tagQueryStarter },
        tagQueryDemo,
        tagQueryCss,
      ],
      solution: [
        tagQueryHtml,
        { name: "dom-query.js", contents: tagQuerySolution },
        tagQueryDemo,
        tagQueryCss,
      ],
    },
  },
];
