// Worked solutions for the Pinterest-tagged algorithm problems defined in
// seed-data.ts, referenced there as `solution:` fields. Split across three
// files (-a, -b, -c) to keep each under the repo's file-size guideline.
// Every fenced implementation is verified against the problem's own judge
// tests before shipping — the code shown to users is code that passes.

export const maxWidthSolution = `## Approach

Two separable jobs: **greedy packing** decides which words share a line, and **rendering** turns a packed line into exactly \`maxWidth\` characters.

Packing is provably greedy: keep appending words while they still fit with single spaces between them (\`letters + gaps + nextWord <= maxWidth\`, where \`gaps\` equals the current word count). Moving a word to the next line never helps a later line, so no lookahead is needed.

Rendering distributes \`spaces = maxWidth - letters\` across \`gaps = words - 1\` slots: every gap gets \`floor(spaces / gaps)\`, and the leftmost \`spaces % gaps\` gaps get one extra — that reproduces \`"example  of text"\`. A one-word line has no gaps, so all its spaces pad the right edge.

\`\`\`js
function justify(words, maxWidth) {
  const lines = [];
  let line = [];
  let letters = 0;
  for (const word of words) {
    // line.length = spaces needed if word joins this line
    if (line.length && letters + line.length + word.length > maxWidth) {
      lines.push(render(line, letters, maxWidth));
      line = [];
      letters = 0;
    }
    line.push(word);
    letters += word.length;
  }
  if (line.length) lines.push(render(line, letters, maxWidth));
  return lines;
}

function render(line, letters, maxWidth) {
  if (line.length === 1) return line[0] + " ".repeat(maxWidth - letters);
  const spaces = maxWidth - letters;
  const gaps = line.length - 1;
  const base = Math.floor(spaces / gaps);
  const extra = spaces % gaps;
  let out = line[0];
  for (let g = 0; g < gaps; g++) {
    out += " ".repeat(base + (g < extra ? 1 : 0)) + line[g + 1];
  }
  return out;
}
\`\`\`

## Complexity

O(total characters) time — each word is placed once and each output character is written once. O(maxWidth) extra space beyond the output.

## Worth saying out loud

- The prompt's "excess spaces on the right-hand side" phrasing is about where the *leftover padding* visually accumulates; the worked example pins the actual rule — the leftmost gaps take the extra spaces. Restate the rule from the example before coding.
- This variant justifies every line the same way. The classic LeetCode 68 variant left-justifies the final line; the judge's cases don't distinguish the two, but an interviewer will expect you to ask.
- Off-by-one bait: the fits-check must count the space *before* the incoming word — \`letters + line.length + word.length\`, not \`+ line.length - 1\`.`;

export const roundNumericStringsSolution = `## Approach

Floats are a trap the prompt sets on purpose — \`parseFloat("123456789123456789123456789.5")\` silently loses the digits that decide the answer. Stay in string land.

Split off the sign, then split on the dot. Only the **first fractional digit** matters under round-half-away-from-zero: the magnitude rounds up exactly when that digit is \`'5'\` or more (everything after it can only push further in the same direction). Rounding up is big-integer increment: walk the integer digits right to left turning \`9\`s into \`0\`s until a digit absorbs the carry, prepending \`"1"\` if none does. Reattach the sign only when the result isn't \`"0"\`.

\`\`\`js
function roundNumericString(s) {
  let sign = "";
  if (s[0] === "-" || s[0] === "+") {
    if (s[0] === "-") sign = "-";
    s = s.slice(1);
  }
  const dot = s.indexOf(".");
  let intPart = dot === -1 ? s : s.slice(0, dot);
  const frac = dot === -1 ? "" : s.slice(dot + 1);
  intPart = intPart.replace(/^0+/, "") || "0";
  if (frac && frac[0] >= "5") intPart = addOne(intPart);
  return intPart === "0" ? "0" : sign + intPart;
}

function addOne(digits) {
  const out = digits.split("");
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] === "9") {
      out[i] = "0";
    } else {
      out[i] = String(Number(out[i]) + 1);
      return out.join("");
    }
  }
  return "1" + out.join("");
}

function roundAll(csv) {
  if (csv === "") return "";
  return csv.split(",").map(roundNumericString).join(",");
}
\`\`\`

## Complexity

O(n) per value — one pass to split, at worst one pass for the carry (\`"999…9.5"\` ripples the whole way). Part 2 is a map-join over the same routine.

## Worth saying out loud

- Rounding direction depends only on \`frac[0] >= "5"\` — comparing characters works because digits are ASCII-ordered. Summing or inspecting deeper fractional digits is wasted work and a float-thinking tell.
- The \`"-0"\` rule falls out of ordering: normalize the magnitude first, attach the sign last.
- Normalize \`"007"\` before the carry, not after — \`addOne("007")\` walking into padding zeros still works, but returning \`"008"\` un-stripped does not.`;

export const violationLogSolution = `## Approach

Timestamps arrive in non-decreasing order, so per-user **append-only arrays stay sorted for free** — no balanced tree needed. Keep three pieces of state: \`times\` (user → ascending timestamps), \`counts\` (user → all-time total), and \`latest\` (largest timestamp seen).

- \`countRecent\` binary-searches the user's array for the first timestamp strictly greater than \`latest - window\` — the half-open \`(T − W, T]\` convention means *strictly* greater.
- \`topK\` sorts the count entries by count descending, name ascending.
- \`shouldBan\` is a classic two-pointer sweep over one user's history: for each right endpoint, advance \`left\` while \`times[left] <= times[right] - window\` (a span *equal* to the window falls outside it), then check the window's size.

\`\`\`js
class ViolationLog {
  constructor() {
    this.times = new Map();  // user -> ascending timestamps
    this.counts = new Map(); // user -> all-time count
    this.latest = -Infinity;
  }

  record(timestamp, userId, violationType) {
    if (!this.times.has(userId)) this.times.set(userId, []);
    this.times.get(userId).push(timestamp);
    this.counts.set(userId, (this.counts.get(userId) ?? 0) + 1);
    this.latest = timestamp;
  }

  countRecent(userId, window) {
    const times = this.times.get(userId) ?? [];
    const cutoff = this.latest - window;
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] > cutoff) hi = mid;
      else lo = mid + 1;
    }
    return times.length - lo;
  }

  topK(k) {
    return [...this.counts.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, k);
  }

  shouldBan(userId, maxViolations, window) {
    const times = this.times.get(userId) ?? [];
    let left = 0;
    for (let right = 0; right < times.length; right++) {
      while (times[left] <= times[right] - window) left++;
      if (right - left + 1 >= maxViolations) return true;
    }
    return false;
  }
}
\`\`\`

## Complexity

\`record\` O(1) amortized. \`countRecent\` O(log m) for the user's m events. \`shouldBan\` O(m) — each pointer moves forward only. \`topK\` O(u log u) over u users; say the heap (O(u log k)) or count-bucketing upgrade rather than hand-waving it.

## Worth saying out loud

- The boundary convention is where these interviews are lost: \`(T − W, T]\` means events at \`t = 0\` and \`t = 10\` do **not** share a 10-second window. Both queries above encode it as a strict comparison; write the two events down and test the edge before submitting.
- \`shouldBan\` scans history, but the two pointers make it linear, not quadratic — every index enters and leaves the window once.
- In a real system you'd bound memory: countRecent-style queries only need a deque pruned below \`latest − maxWindow\`, but \`shouldBan\`'s any-window-ever semantics need either full history or a per-user running flag updated at record time. Flagging that tension is senior signal.`;

export const nestedSetEqualitySolution = `## Approach

Two sets are equal when they have the same canonical form, so **canonicalize bottom-up**: an integer maps to its own text, and a set maps to \`"{" + sorted unique child forms + "}"\`. Sorting erases order, a \`Set\` erases duplicates, and the braces keep \`2\` distinct from \`{2}\` — the three requirements, one per operation. Equality is then a string comparison.

\`\`\`js
function nestedSetEqual(a, b) {
  return canonical(a) === canonical(b);
}

function canonical(value) {
  if (!Array.isArray(value)) return String(value);
  const children = [...new Set(value.map(canonical))].sort();
  return "{" + children.join(",") + "}";
}
\`\`\`

Recursion depth equals nesting depth; a stack-based version is the answer to "what if it's 100,000 levels deep?".

## Complexity

For total input size n and depth d, each level sorts its children: O(n log n) per level in the worst case, O(n·d·log n) overall — in practice dominated by the sort of the widest level. Space O(n) for the canonical strings.

## Worth saying out loud

- Dedup must happen on **canonical** children, not raw ones — \`[[1,2],[2,1]]\` contains one set, not two, and only the canonical forms reveal it.
- \`[[]]\` vs \`[]\` is the classic probe: canonicalization gives \`"{{}}"\` vs \`"{}"\` without any special-casing. If your design needs an if-statement for it, the representation is wrong.
- Why not compare recursively without canonicalizing? Matching children across two unordered collections is a bipartite-matching headache; canonical forms reduce it to sorting. Cheaper and easier to prove correct.`;

export const assignPinsSolution = `## Approach

Simulate exactly what the layout engine does: track each column's running height and give every pin to the current minimum, leftmost on ties.

\`\`\`js
function assignPins(heights, k) {
  const columns = new Array(k).fill(0);
  const out = [];
  for (const height of heights) {
    let best = 0;
    for (let c = 1; c < k; c++) {
      if (columns[c] < columns[best]) best = c;
    }
    out.push(best);
    columns[best] += height;
  }
  return out;
}
\`\`\`

The strict \`<\` is the whole tie-break rule: scanning left to right and only replacing on *strictly smaller* keeps the leftmost minimum.

## Complexity

O(n·k) time, O(k) space. For the feed's real k (a handful of columns) the scan is optimal in practice; for large k, a min-heap of \`(height, columnIndex)\` pairs drops it to O(n log k) — and ordering the pair by height first, index second makes the leftmost-on-ties rule fall out of the comparator for free.

## Worth saying out loud

- This greedy is the actual masonry algorithm, not an approximation of one — the problem *defines* placement as shortest-column-wins, so there is nothing to optimize, only to simulate faithfully.
- The follow-up an interviewer wants: this layout is deterministic given \`(heights, k)\`, which is why the server can precompute column assignments per device width and why resizing (k changes) reflows every pin.
- If asked to *minimize the tallest column* instead (offline version), that's a different problem — NP-hard partitioning, greedy-by-decreasing-height as the standard heuristic. Recognizing the switch is the point of the follow-up.`;

export const collectReachablePinsSolution = `## Approach

The tempting graph — an edge between every two boards sharing a pin — blows up: a pin saved to 10,000 boards contributes ~50M edges. Traverse the **bipartite** graph instead: from a board, visit its pins; from each newly seen pin, visit the boards that carry it (via an inverted pin → boards index built in one pass).

Mark pins *and* boards visited. The visited-pin set is the load-bearing one: a popular pin gets expanded once, no matter how many boards it sits on.

\`\`\`js
function collectReachablePins(boards, start) {
  if (!(start in boards)) return [];
  const boardsOfPin = new Map();
  for (const [board, pins] of Object.entries(boards)) {
    for (const pin of pins) {
      if (!boardsOfPin.has(pin)) boardsOfPin.set(pin, []);
      boardsOfPin.get(pin).push(board);
    }
  }

  const seenBoards = new Set([start]);
  const seenPins = new Set();
  const stack = [start];
  while (stack.length) {
    const board = stack.pop();
    for (const pin of boards[board]) {
      if (seenPins.has(pin)) continue;
      seenPins.add(pin);
      for (const next of boardsOfPin.get(pin)) {
        if (!seenBoards.has(next)) {
          seenBoards.add(next);
          stack.push(next);
        }
      }
    }
  }
  return [...seenPins].sort();
}
\`\`\`

## Complexity

Building the index and traversing both cost O(E) where E is the total number of (board, pin) memberships — every membership edge is crossed a constant number of times. The sort adds O(P log P) over the reachable pins. Space O(E) for the index.

## Worth saying out loud

- Say the counting argument, not just "BFS": *without* the visited-pin set the traversal is still correct but re-walks a hub pin's board list on every arrival — quadratic on exactly the graphs Pinterest has.
- DFS vs BFS is irrelevant here (any traversal collects the component); what matters is traversing the bipartite structure instead of materializing board–board edges.
- Production framing: this is a connected-component query, and at Pinterest scale you'd precompute components (union–find over memberships) rather than traverse per query — offer that when asked "what if this runs per request?".`;
