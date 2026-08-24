import type { Problem } from "./types";

// Reference solutions, keyed by problem slug, merged into each problem as
// `solution` by the seed script. Same light markdown as `prompt` (see the
// Problem type), and the same renderer draws both.
//
// Judged problems carry a JavaScript reference implementation because
// JavaScript is the judge's base language — the other five are per-language
// add-ons layered on in seed-python.ts and friends. Every implementation here
// passes that problem's own judge tests.

export const problemSolutions: Record<string, NonNullable<Problem["solution"]>> =
  {
    "pair-sum-sorted": `## Approach

The array is sorted, and that is the whole problem. Put one pointer at each end and read the current sum as a signal:

- Sum equals the target — done, and the pointers are already the indices.
- Sum is too small — only moving \`left\` right can help. Moving \`right\` left makes an already-too-small sum smaller.
- Sum is too large — symmetrically, only moving \`right\` left can help.

Each step discards exactly one candidate index and never discards the answer, so the scan is safe to run until the pointers meet.

## Complexity

- Time: O(n), one pass.
- Space: O(1).

## The follow-up

If the array is not sorted, you lose the signal that makes the pointers safe. Two options, and the interviewer wants the trade-off:

- Sort first, then two-pointer: O(n log n) time, O(1) extra space, but the indices you return are into the sorted array — keep the originals alongside if the caller needs them.
- Hash map of value to index in one pass: O(n) time and O(n) space, and it returns the original indices directly.

## Reference implementation

\`\`\`
function pairSum(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}
\`\`\``,

    "merge-intervals": `## Approach

Sorting by start time buys one invariant: when you reach an interval, every interval that could overlap it has already been merged into the last entry of the output. That reduces the whole problem to a single comparison per interval.

Sweep left to right holding the last merged interval:

- If the current start is at or before the last merged end, they touch — extend the last end to \`max(lastEnd, end)\`. The \`max\` matters for a fully contained interval like [2, 3] inside [1, 10].
- Otherwise there is a real gap, so push a new interval.

## Complexity

- Time: O(n log n), dominated by the sort; the sweep is O(n).
- Space: O(n) for the output (O(1) beyond it if you merge in place).

## The follow-up

For intervals arriving out of order in a stream you cannot sort — there is no end of input. Keep the merged set in a structure ordered by start (a balanced BST or skip list): for each arrival, find the last interval starting at or before it, then absorb forward while the next interval still overlaps. That is O(log n) plus the number of intervals the arrival swallows, and each is swallowed once overall.

## Reference implementation

\`\`\`
function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
\`\`\``,

    "lru-cache": `## Approach

Two requirements pull in different directions: O(1) lookup by key, and O(1) reordering by recency. One structure gives each.

- A hash map gives O(1) lookup, but has no order.
- A doubly linked list gives O(1) move-to-front and O(1) evict-from-back, but no lookup.

Combine them: the map's values are pointers to list nodes, so a lookup lands directly on the node and unlinking it is constant time.

In JavaScript, \`Map\` already is that combination — it preserves insertion order and lets you delete and re-insert in O(1), so \`delete\` then \`set\` is exactly move-to-front, and the first key from \`map.keys()\` is the least recently used. Say this out loud in an interview, then be ready to write the linked list by hand: that is the version the question is really asking for, and languages without an ordered map need it.

The one trap is \`put\` on an existing key. It is a use, not an insertion, so it must refresh recency and must never evict — deleting before setting handles both.

## Complexity

- Time: O(1) average for \`get\` and \`put\`.
- Space: O(capacity).

## What interviewers probe

- Thread safety: the map and the list must move together, so a single lock around both is the simple answer. Sharding by key hash reduces contention; a lock-free version is a research project, not an interview answer.
- LFU: recency is no longer the eviction key, so you need frequency counts plus a way to find the minimum frequency in O(1) — buckets of equal-frequency lists with a \`minFrequency\` pointer.

## Reference implementation

\`\`\`
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    // Re-inserting moves the key to the newest end of the iteration order.
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    // Delete first so an update refreshes recency instead of evicting.
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);
    }
  }
}
\`\`\``,

    "course-schedule": `## Approach

Read the prerequisites as directed edges \`prereq -> course\`. Finishing every course is possible exactly when that graph has no cycle, because a cycle is a set of courses each waiting on another.

Kahn's algorithm turns cycle detection into counting:

- Build the adjacency list and each node's in-degree.
- Seed a queue with every course of in-degree zero — nothing blocks them.
- Pop a course, count it as taken, and decrement each dependent's in-degree; a dependent that hits zero joins the queue.

If every course is eventually taken, the graph was acyclic. Anything left with a nonzero in-degree is stuck inside a cycle — including a self-loop \`[0, 0]\`, which starts at in-degree one and never drops.

## Complexity

- Time: O(V + E).
- Space: O(V + E).

## The follow-up

The order the queue pops courses in is a topological sort, so returning a valid ordering is free — collect the popped courses and return that list when the count reaches \`numCourses\`. The DFS alternative (three-color marking, cycle on a back edge, reverse post-order) produces the same answer; Kahn's is easier to get right under pressure and hands you the order without a reversal.

## Reference implementation

\`\`\`
function canFinish(numCourses, prerequisites) {
  const adjacency = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    adjacency[prereq].push(course);
    inDegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  // The queue doubles as the topological order — return it for the follow-up.
  let taken = 0;
  for (let head = 0; head < queue.length; head++) {
    taken++;
    for (const next of adjacency[queue[head]]) {
      if (--inDegree[next] === 0) queue.push(next);
    }
  }
  return taken === numCourses;
}
\`\`\``,

    "max-width": `## Approach

Two independent halves, and mixing them is what makes this problem fiddly.

Packing (greedy). Walk the words keeping a current line. A word fits when \`letters + gaps + word.length <= maxWidth\`, where \`gaps\` is the number of words already on the line — the minimum one space between each pair. Greedy is optimal here: pushing a word to the next line never lets an earlier line hold more.

Padding (arithmetic). For a full line with \`g\` gaps and \`s\` spaces to place, every gap gets \`floor(s / g)\` and the leftmost \`s mod g\` gaps get one extra. That is what turns \`example of text\` into \`example  of text\` — 5 spaces over 2 gaps is 2 then 1.

Two lines skip the distribution entirely and are the cases most submissions get wrong:

- The last line is left-justified: single spaces, padded on the right.
- A line holding one word has no gaps to divide, so it is also padded on the right.

## Complexity

- Time: O(total characters) — each word is packed once and copied once.
- Space: O(total characters) for the output.

## Reference implementation

\`\`\`
function justify(words, maxWidth) {
  const lines = [];
  let line = [];
  let letters = 0;

  for (const word of words) {
    // line.length is the number of gaps a new word would need.
    if (letters + line.length + word.length > maxWidth) {
      lines.push(spread(line, letters, maxWidth));
      line = [];
      letters = 0;
    }
    line.push(word);
    letters += word.length;
  }
  // The last line is left-justified, not spread.
  if (line.length > 0) lines.push(line.join(" ").padEnd(maxWidth, " "));
  return lines;
}

function spread(line, letters, maxWidth) {
  const gaps = line.length - 1;
  if (gaps === 0) return line[0].padEnd(maxWidth, " ");

  const spaces = maxWidth - letters;
  const base = Math.floor(spaces / gaps);
  const extra = spaces % gaps;
  let out = "";
  for (let i = 0; i < gaps; i++) {
    out += line[i] + " ".repeat(base + (i < extra ? 1 : 0));
  }
  return out + line[gaps];
}
\`\`\``,

    "round-numeric-strings": `## Approach

The premise is that the value does not fit any built-in numeric type, so every step has to stay in string land. Parsing to a float and rounding would pass the small cases and silently corrupt \`123456789123456789123456789.5\` — which is exactly the case the interviewer is watching for.

Three observations make it easy:

- Only the first fractional digit matters. Half away from zero rounds the magnitude up exactly when that digit is 5 or more; \`.4999\` and \`.4\` behave identically, so nothing after position one is ever read.
- Sign splits off cleanly. Round the magnitude, then reattach the minus — but not when the magnitude rounded to \`0\`, or you produce \`-0\`.
- Rounding up is big-integer addition. Walk the integer digits right to left turning \`9\` into \`0\` and carrying; the first non-nine absorbs the carry. If the carry survives past the leftmost digit, prepend a \`1\` — that is how \`999\` becomes \`1000\`.

Strip leading zeros at the end, and remember that stripping everything means the answer is \`0\`, not the empty string.

## Complexity

- Time: O(d) in the number of digits.
- Space: O(d).

## Part 2

Splitting on commas and mapping Part 1 across the pieces is the entire answer. The point of the second part is that Part 1 was written as a total function over one value — if rounding and formatting had been tangled into the parsing, this would not be a one-liner.

## Reference implementation

\`\`\`
function roundNumericString(s) {
  const value = s.trim();
  const negative = value[0] === "-";
  const body = negative || value[0] === "+" ? value.slice(1) : value;

  const dot = body.indexOf(".");
  const whole = dot === -1 ? body : body.slice(0, dot);
  const firstFractional = dot === -1 ? "0" : body[dot + 1] ?? "0";

  // Half away from zero: the magnitude rounds up on 5 or more.
  const rounded = firstFractional >= "5" ? addOne(whole) : whole;
  const magnitude = stripLeadingZeros(rounded);
  return negative && magnitude !== "0" ? "-" + magnitude : magnitude;
}

/** Big-integer +1: carry right to left, growing a digit if it survives. */
function addOne(digits) {
  const out = digits.split("");
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] !== "9") {
      out[i] = String(Number(out[i]) + 1);
      return out.join("");
    }
    out[i] = "0";
  }
  return "1" + out.join("");
}

function stripLeadingZeros(digits) {
  const trimmed = digits.replace(/^0+/, "");
  return trimmed === "" ? "0" : trimmed;
}

function roundAll(csv) {
  return csv.split(",").map((value) => roundNumericString(value)).join(",");
}
\`\`\``,

    "violation-log-analyzer": `## Approach

Timestamps arrive non-decreasing, and that single guarantee decides the whole design: a per-user list of timestamps is already sorted, so nothing ever needs re-sorting or binary-search insertion. Keep three pieces of state:

- \`timestamps\`: user to an append-only ascending list.
- \`totals\`: user to an all-time count, so \`topK\` never rescans the lists.
- \`latest\`: the newest timestamp seen, which is what \`countRecent\` measures from.

Each query then falls out:

- \`countRecent\` — walk that user's list backwards while \`t > latest - window\` and stop. The half-open window \`(T - W, T]\` is the detail to get right: an event exactly \`W\` seconds old is outside, so the comparison is strict.
- \`topK\` — sort the totals by count descending, name ascending. Comparing the pair gives the lexicographic tie-break for free.
- \`shouldBan\` — two pointers over the user's timestamps. Advance \`left\` while \`t[right] - t[left] >= window\`, which leaves a maximal in-window span ending at \`right\`; if it ever holds \`maxViolations\` events, the user tripped the rule at some point in history.

Note that \`violationType\` is recorded but no query filters by it. Say that out loud rather than silently dropping the parameter — if per-type limits arrive later, the map keys become \`(user, type)\` and every query above is unchanged.

## Complexity

- \`record\`: O(1) amortized.
- \`countRecent\`: O(k) in the number of events actually inside the window.
- \`topK\`: O(u log u) for \`u\` users; a heap makes it O(u log k), and an incrementally maintained order makes it O(k).
- \`shouldBan\`: O(m) for that user's \`m\` events — each pointer only moves forward.

## What interviewers probe

Memory. An append-only list per user grows forever. In production you either window the retention (drop events older than the longest ban window you support) or replace exact counts with a sketch — and \`shouldBan\` is the query that resists approximation, because it needs the actual arrival times.

## Reference implementation

\`\`\`
class ViolationLog {
  constructor() {
    this.timestamps = new Map(); // user -> ascending timestamps
    this.totals = new Map(); // user -> all-time count
    this.latest = null; // newest timestamp seen
  }

  record(timestamp, userId, violationType) {
    if (!this.timestamps.has(userId)) this.timestamps.set(userId, []);
    this.timestamps.get(userId).push(timestamp);
    this.totals.set(userId, (this.totals.get(userId) ?? 0) + 1);
    this.latest = timestamp;
  }

  countRecent(userId, window) {
    const times = this.timestamps.get(userId);
    if (!times || this.latest === null) return 0;
    // (latest - window, latest] — strictly greater, so W seconds old is out.
    const cutoff = this.latest - window;
    let count = 0;
    for (let i = times.length - 1; i >= 0 && times[i] > cutoff; i--) count++;
    return count;
  }

  topK(k) {
    return [...this.totals.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .slice(0, k);
  }

  shouldBan(userId, maxViolations, window) {
    const times = this.timestamps.get(userId);
    if (!times) return false;
    let left = 0;
    for (let right = 0; right < times.length; right++) {
      while (times[right] - times[left] >= window) left++;
      if (right - left + 1 >= maxViolations) return true;
    }
    return false;
  }
}
\`\`\``,

    "nested-set-equality": `## Approach

Comparing the structures directly means fighting order and duplicates at every level at once. Canonicalize instead: map each structure bottom-up to a form where order and duplicates cannot exist, then compare the two forms with \`===\`.

For a node:

- An integer canonicalizes to a tagged leaf.
- A list canonicalizes to its children's canonical forms, deduplicated, sorted, and wrapped in braces.

Deduplicating after recursing is what makes \`[1, 1, 2]\` and \`[2, 1]\` agree, and sorting is what makes order irrelevant — at every depth, because the children were canonical before they were sorted.

The tag on integers is the part that is easy to miss. Without it, \`2\` and \`[2]\` can both render as \`"2"\` and the function wrongly reports \`[1, [2]] === [1, 2]\`. Prefixing leaves and bracing sets keeps them in disjoint shapes — which is also why \`[[]]\` (\`{{}}\`) and \`[]\` (\`{}\`) stay different.

## Complexity

- Time: O(n log n) over the total number of nodes, from sorting each level.
- Space: O(n) for the canonical strings.

## Alternatives

Hashing the canonical form to an integer avoids building strings and is what you would do at scale; you then need a collision story. In Python the equivalent trick is \`frozenset\`, which is hashable and nests — the canonical form is then a real value rather than a string.

## Reference implementation

\`\`\`
function nestedSetEqual(a, b) {
  return canonical(a) === canonical(b);
}

/**
 * Erases order and duplicates at every depth. Integers are tagged so that
 * 2 and [2] can never collide on the same canonical form.
 */
function canonical(node) {
  if (!Array.isArray(node)) return "i" + node;
  const children = [...new Set(node.map((child) => canonical(child)))].sort();
  return "{" + children.join(",") + "}";
}
\`\`\``,

    "assign-pins-shortest-columns": `## Approach

This is the masonry layout every image feed uses, and the rule is exactly the greedy in the prompt: each arriving pin goes to the column that is currently shortest, leftmost on ties. There is no lookahead to design — pins arrive in feed order and must be placed immediately.

So the only state is a running height per column, and the only question is how fast you can find the minimum.

- A linear scan per pin is O(n·k) and, with \`k\` in the single digits as it is for a real feed, is the right answer.
- A min-heap of \`(height, columnIndex)\` pairs makes it O(n log k). Ordering pairs by height first and index second means the leftmost-on-tie rule falls straight out of the comparison — you never write tie-break logic.

Use strict \`<\` when scanning so the first minimum wins; \`<=\` silently gives you the rightmost column on ties and fails the all-equal cases.

## Complexity

- Time: O(n·k) as written, O(n log k) with a heap.
- Space: O(k).

## What interviewers probe

The greedy is optimal for balancing height only under this arrival constraint. If you could see all pins up front, minimizing the tallest column is multiway number partitioning — NP-hard, and longest-processing-time-first is the standard approximation. Knowing which problem you are not solving is the point.

## Reference implementation

\`\`\`
function assignPins(heights, k) {
  const columns = new Array(k).fill(0);
  const out = [];
  for (const height of heights) {
    // Strict < keeps the leftmost column on ties.
    let best = 0;
    for (let c = 1; c < k; c++) {
      if (columns[c] < columns[best]) best = c;
    }
    out.push(best);
    columns[best] += height;
  }
  return out;
}
\`\`\``,

    "collect-reachable-pins": `## Approach

The tempting first move is to build board-to-board edges and run a plain BFS. Do not: a single pin saved to \`m\` boards creates \`m²\` edges, and popular pins are the norm on Pinterest, so building the graph costs more than the traversal ever will.

Traverse the bipartite graph directly instead — boards on one side, pins on the other:

- Invert the input once into \`pin -> boards containing it\`.
- BFS from the start board. Expanding a board visits its pins; expanding a pin enqueues the boards that hold it.

Two visited sets do the real work. Marking boards prevents cycles. Marking pins is what keeps a hub pin from re-expanding its thousand boards every time another board mentions it — that set is the difference between linear and quadratic.

A missing start board short-circuits to an empty result before any of this runs.

## Complexity

- Time: O(B + P) where P is the total number of board-pin pairs — the inverted index and the traversal each touch every pair once.
- Space: O(B + P).

## What interviewers probe

This is connected components on a bipartite graph, so at real scale you would precompute components offline (union-find over the same pairs) and answer queries with a lookup rather than a traversal. The trade-off is staleness: components merge the moment someone saves an existing pin to a new board.

## Reference implementation

\`\`\`
function collectReachablePins(boards, start) {
  if (!(start in boards)) return [];

  // Invert once: pin -> boards holding it. Never materialize board-to-board
  // edges, or one popular pin becomes a quadratic blow-up.
  const boardsByPin = new Map();
  for (const [board, pins] of Object.entries(boards)) {
    for (const pin of pins) {
      if (!boardsByPin.has(pin)) boardsByPin.set(pin, []);
      boardsByPin.get(pin).push(board);
    }
  }

  const seenBoards = new Set([start]);
  const seenPins = new Set();
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    for (const pin of boards[queue[head]] ?? []) {
      if (seenPins.has(pin)) continue; // never re-expand a hub pin
      seenPins.add(pin);
      for (const board of boardsByPin.get(pin) ?? []) {
        if (!seenBoards.has(board)) {
          seenBoards.add(board);
          queue.push(board);
        }
      }
    }
  }
  return [...seenPins].sort();
}
\`\`\``,

    "stream-line-reader": `## Approach

The reader owns two pieces of state, and separating them is the whole trick:

- \`pending\` — complete lines already parsed and waiting to be served.
- \`fragments\` — the pieces of the line still being built.

\`chunk.split("\\n")\` tells you everything about a chunk: every piece except the last one terminates a line, and the last piece is the new partial. So each completed piece joins the accumulated fragments into a finished line, and the trailing piece becomes the fragment list for next time. Joining only when a line completes keeps the work proportional to the bytes read instead of re-concatenating a growing buffer per chunk.

Two details decide correctness:

- Never store an empty trailing fragment. If a chunk ends exactly on a newline, the trailing piece is \`""\`. Push it and \`fragments\` becomes non-empty with no content, and the end-of-stream flush invents a phantom empty final line. Skip empty trailing pieces and "mid-line" is simply "fragments is non-empty".
- Empty lines are real. \`"a\\n\\nb"\` splits to \`["a", "", "b"]\`, and the middle \`""\` completes a genuine empty line. That is the case the previous rule must not swallow.

The loop only calls \`readChunk\` while \`pending\` is empty, which is the laziness the prompt asks for. At end of stream, flush the fragments as a final unterminated line, then return \`null\` forever.

## Complexity

- Time: O(total bytes) across the whole stream.
- Space: O(longest line), not O(stream) — nothing is retained after it is served.

## Part 2

Two independent steps, and the first one does most of the work:

- Net the balances. Each line moves an amount from payer to payee. Anyone who nets to zero — the middleman in \`a->b\`, \`a->c\`, \`b->c\` — drops out entirely and needs no transaction at all.
- Settle the rest. Minimizing transactions over the remaining nonzero balances is the optimal-account-balancing problem, and it is NP-hard: the greedy "biggest creditor pays biggest debtor" is wrong on cases where a subset happens to cancel exactly. Backtracking over which opposite-sign balance each debt settles against is the honest answer, and it is fine here because netting leaves only a handful of nonzero balances. Say the complexity out loud rather than pretending the greedy is optimal.

## Reference implementation

\`\`\`
class LineReader {
  constructor(readChunk) {
    this.readChunk = readChunk;
    this.pending = []; // complete lines ready to serve
    this.fragments = []; // pieces of the line still being built
    this.done = false;
  }

  readLine() {
    // Only pull from the stream when we cannot already answer.
    while (this.pending.length === 0 && !this.done) {
      const chunk = this.readChunk();
      if (chunk === "") {
        this.done = true;
        const tail = this.fragments.join("");
        // A final line without a trailing newline still counts.
        if (tail !== "") this.pending.push(tail);
        this.fragments = [];
        break;
      }

      const pieces = chunk.split("\\n");
      for (let i = 0; i < pieces.length - 1; i++) {
        this.fragments.push(pieces[i]);
        this.pending.push(this.fragments.join(""));
        this.fragments = [];
      }
      // Skip an empty trailing piece: "mid-line" must mean "has content".
      const tail = pieces[pieces.length - 1];
      if (tail !== "") this.fragments.push(tail);
    }
    return this.pending.length > 0 ? this.pending.shift() : null;
  }
}

function settleFromStream(readChunk) {
  const reader = new LineReader(readChunk);
  const balances = new Map();
  for (let line = reader.readLine(); line !== null; line = reader.readLine()) {
    if (line === "") continue;
    const [payer, payee, amount] = line.split(",");
    const value = Number(amount);
    balances.set(payer, (balances.get(payer) ?? 0) + value);
    balances.set(payee, (balances.get(payee) ?? 0) - value);
  }
  // Netting first is what makes the exponential search tolerable.
  return minTransactions([...balances.values()].filter((v) => v !== 0), 0);
}

function minTransactions(debts, start) {
  while (start < debts.length && debts[start] === 0) start++;
  if (start === debts.length) return 0;

  let best = Infinity;
  for (let i = start + 1; i < debts.length; i++) {
    if (debts[start] * debts[i] < 0) {
      debts[i] += debts[start];
      best = Math.min(best, 1 + minTransactions(debts, start + 1));
      debts[i] -= debts[start];
    }
  }
  return best;
}
\`\`\``,

    "escape-room-leaderboard": `## Approach

A team's standing is its best time, so an attempt only matters when it beats what is stored — regressions are dropped on the way in, and every query reads a single map of team to best time.

Both queries are then the same ordering, so write it once:

- Sort by \`(bestTime, team)\`. Comparing the pair gives the alphabetical tie-break for free; a separate tie-break branch is a bug waiting to happen.
- \`rank\` is the 1-indexed position in that order, or \`-1\` for a team that never played — which is a different answer from "ranked last", so check membership rather than letting a lookup miss fall through.
- \`topK\` is the first \`k\` names of the same order.

## Complexity

- \`addResult\`: O(1).
- \`rank\` and \`topK\` as written: O(n log n), re-sorting per query.

## The data-structure conversation

Re-sorting per query is the honest starting point and the interviewer will push on it. The upgrade is an order-statistic structure keyed by \`(time, team)\` — a balanced BST with subtree sizes, or a skip list — giving O(log n) \`addResult\` and \`rank\` and O(k + log n) \`topK\`. An improvement is a delete of the old key plus an insert of the new one, which is why the best-time map has to stay: you need the old key to remove it.

Which one wins depends on the read/write mix. A leaderboard read far more often than it is written can also just keep a sorted array and pay O(n) on the rare write.

## Reference implementation

\`\`\`
class Leaderboard {
  constructor() {
    this.best = new Map(); // team -> best (lowest) time
  }

  addResult(team, time) {
    const current = this.best.get(team);
    if (current === undefined || time < current) this.best.set(team, time);
  }

  /** Teams ordered by (bestTime, team) — one ordering serves both queries. */
  standings() {
    return [...this.best.entries()]
      .sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map((entry) => entry[0]);
  }

  rank(team) {
    if (!this.best.has(team)) return -1;
    return this.standings().indexOf(team) + 1;
  }

  topK(k) {
    return this.standings().slice(0, k);
  }
}
\`\`\``,

    "rebalance-experiment-buckets": `## Approach

Every changed bucket disrupts real users, so the objective is to change as few as possible while hitting the targets exactly. Work out what is forced before deciding anything:

- A group can keep at most \`min(currentCount, target)\` buckets. Keep its buckets in one pass until it reaches its target; every additional bucket of that group is surplus and must change no matter what you do. Groups absent from the targets have a target of zero, so all of their buckets are surplus.
- After that pass, each group has a deficit of \`target - kept\`, and the deficits must come from somewhere.

The one real decision is where. A surplus bucket has already been counted as a change — it is losing its group either way — so reusing it for a deficit is free. A never-assigned \`null\` bucket costs a fresh change the moment you touch it. So spend surplus buckets first, then dip into \`null\`s. Whatever surplus is left over becomes \`null\`, a change that was already paid for.

That gives the minimum: the keep pass maximizes the buckets that stay put, and the fill order never spends a change it could have avoided.

## Complexity

- Time: O(n + g) for \`n\` buckets and \`g\` groups.
- Space: O(n).

## What interviewers probe

Why this is not just "reassign everything to match the targets". Both meet the targets; only one respects that a bucket is a live cohort of users whose experiment history breaks when it moves. The follow-up is usually consistent hashing — the same instinct, applied to the hash ring instead of the bucket table.

## Reference implementation

\`\`\`
function rebalanceBuckets(current, targets) {
  const result = current.slice();
  const kept = new Map();
  const surplus = []; // assigned buckets that cannot keep their group
  const free = []; // never-assigned buckets

  for (let i = 0; i < result.length; i++) {
    const group = result[i];
    if (group === null) {
      free.push(i);
      continue;
    }
    const heldSoFar = kept.get(group) ?? 0;
    if (heldSoFar < (targets[group] ?? 0)) kept.set(group, heldSoFar + 1);
    else surplus.push(i);
  }

  // Surplus buckets are already changing, so spend them before free ones.
  const order = [...surplus, ...free];
  let next = 0;
  for (const [group, target] of Object.entries(targets)) {
    for (let need = target - (kept.get(group) ?? 0); need > 0; need--) {
      result[order[next++]] = group;
    }
  }
  // Leftover surplus loses its group; untouched free buckets stay untouched.
  for (; next < surplus.length; next++) result[order[next]] = null;
  return result;
}
\`\`\``,

    "list-unallocated-buckets": `## Approach

The reflex answer is a boolean array of size \`n\` — mark every allocated bucket, then scan for runs of \`false\`. It works, and it is the wrong shape: the bucket space is the thing that is huge (millions of buckets), while the number of experiments holding ranges is small. Cost should scale with the ranges, not the space.

So sweep the ranges instead. Sort by start and carry a \`cursor\` holding the smallest bucket not yet proven allocated:

- A range starting past the cursor exposes a free run \`[cursor, start - 1]\`.
- Then advance with \`cursor = max(cursor, end + 1)\`. The \`max\` is what absorbs overlapping and fully contained ranges — without it, a range nested inside an earlier one would drag the cursor backwards and emit buckets that are already taken.
- After the last range, anything from the cursor to \`n - 1\` is a final free run.

Clamp each range into \`[0, n - 1]\` before sorting and drop any that inverts, which is how out-of-bounds input is handled without special cases later. Adjacent ranges need no special case either: \`[0, 1]\` then \`[2, 3]\` leaves \`start === cursor\`, and \`start > cursor\` is false, so no phantom empty gap is emitted.

## Complexity

- Time: O(m log m) for \`m\` ranges, from the sort.
- Space: O(m), and crucially independent of \`n\`.

## Reference implementation

\`\`\`
function unallocatedRanges(n, allocated) {
  const ranges = allocated
    .map(([start, end]) => [Math.max(0, start), Math.min(n - 1, end)])
    .filter(([start, end]) => start <= end) // fully out of bounds
    .sort((a, b) => a[0] - b[0]);

  const free = [];
  let cursor = 0; // smallest bucket not yet proven allocated
  for (const [start, end] of ranges) {
    if (start > cursor) free.push([cursor, start - 1]);
    cursor = Math.max(cursor, end + 1); // max absorbs nested ranges
  }
  if (cursor <= n - 1) free.push([cursor, n - 1]);
  return free;
}
\`\`\``,

    "adjustable-id-allocator": `## Approach

Three pieces of state cover every operation:

- \`watermark\` — the smallest ID never handed out. Fresh IDs come from here.
- \`released\` — IDs returned to the pool, kept in ascending order.
- \`allocated\` — the set currently outstanding, which is what makes \`release\` able to reject a double-release or an ID that was never issued.

The smallest free ID is then a two-way choice, and one observation collapses it: every released ID is below the watermark, because it was handed out before the watermark passed it. So if the pool holds any ID under the current capacity, it is smaller than the watermark and wins outright. Only when the pool has nothing usable do you mint \`watermark++\`.

The adjustable part. Make \`setCapacity\` lazy — store the number and do nothing else. Shrinking must not invalidate outstanding IDs, and it does not need to: an ID above the new capacity stays in \`allocated\` and stays releasable. A released ID above capacity simply stays in the pool, dormant, and because the pool is ordered ascending it can never block a smaller ID from being found. Grow the capacity back and it becomes allocatable again with no bookkeeping at all.

Eagerly reclaiming or rewriting state on shrink is the version that gets this wrong.

## Complexity

- \`allocate\`: O(1) when the smallest pooled ID is under capacity; the scan only walks IDs parked above it.
- \`release\`: O(log n) to find the insertion point, O(n) for the splice — a binary heap makes it O(log n), at the cost of not being able to scan past dormant IDs as directly.
- Space: O(outstanding + released).

## Reference implementation

\`\`\`
class IDAllocator {
  constructor(capacity) {
    this.capacity = capacity;
    this.watermark = 0; // smallest id never handed out
    this.released = []; // returned ids, ascending
    this.allocated = new Set();
  }

  allocate() {
    // Released ids are always below the watermark, so any released id under
    // the current capacity beats minting a fresh one.
    for (let i = 0; i < this.released.length; i++) {
      if (this.released[i] < this.capacity) {
        const id = this.released.splice(i, 1)[0];
        this.allocated.add(id);
        return id;
      }
    }
    if (this.watermark < this.capacity) {
      const id = this.watermark++;
      this.allocated.add(id);
      return id;
    }
    return -1;
  }

  release(id) {
    if (!this.allocated.delete(id)) return false; // never issued, or twice
    this.released.splice(lowerBound(this.released, id), 0, id);
    return true;
  }

  setCapacity(c) {
    // Lazy on purpose: outstanding ids above c stay valid, and released ids
    // above c stay dormant in the pool until capacity grows back over them.
    this.capacity = c;
  }
}

function lowerBound(sorted, value) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
}
\`\`\``,

    "flag-spam-numbers": `## Approach

Say the word: this is a hash join. Two logs, one join key, and the naive version is a nested loop that rescans the call log for every report.

- Build. Index the call log as \`number -> set of people it called\`. This is the build side, and it is built once.
- Probe. Stream the reports. A report is valid only if the reporter appears in that number's callee set — one hash lookup, no scan. This is the cross-referencing the prompt asks for, and it is what drops fake or mistaken reports.
- Aggregate. Count distinct valid reporters per number with a set, so one user reporting the same number five times still counts once. Then threshold and sort.

Choosing which side to build matters at scale: build the smaller relation, probe with the larger. Here the call log is typically the larger one, so if reports were the smaller side you would index those instead and stream calls — the interviewer may well ask.

## Complexity

- Time: O(C + R) for \`C\` calls and \`R\` reports, plus O(f log f) to sort the \`f\` flagged numbers.
- Space: O(C + R).

## What interviewers probe

Whether the call log fits in memory. When it does not, this is the textbook setup for a grace hash join (partition both sides by \`hash(number)\` and join partition by partition) or a plain map-reduce shuffle on the number — the same algorithm, spilled to disk.

## Reference implementation

\`\`\`
function flagSpamNumbers(callLog, reports, minReports) {
  // Build side: number -> everyone it called.
  const called = new Map();
  for (const [caller, callee] of callLog) {
    if (!called.has(caller)) called.set(caller, new Set());
    called.get(caller).add(callee);
  }

  // Probe side: a report counts only if that call actually happened.
  const validReporters = new Map();
  for (const [reporter, number] of reports) {
    if (!called.get(number)?.has(reporter)) continue;
    if (!validReporters.has(number)) validReporters.set(number, new Set());
    validReporters.get(number).add(reporter); // a set, so duplicates collapse
  }

  const flagged = [];
  for (const [number, reporters] of validReporters) {
    if (reporters.size >= minReports) flagged.push(number);
  }
  return flagged.sort();
}
\`\`\``,

    "sparse-matrix-operations": `## Approach

The whole design follows from one rule: a zero is never stored. Storage is a dict of rows, each row a dict of column to nonzero value, so a matrix with \`nnz\` nonzeros costs O(nnz) regardless of its declared dimensions.

Make \`set\` the single writer that enforces the rule — storing \`0\` deletes the entry (and drops the row once it empties). Every other operation routes its writes through \`set\`, which is how the cancellation trap is avoided for free.

Addition copies this matrix's nonzeros, then adds the other's on top. The trap is \`2 + (-2)\`: a correct-looking result that must not remain in storage. Routing through \`set\` deletes it. This is what \`nnz()\` is checking — a matrix that prints the right dense form but still holds cancelled zeros has failed the actual requirement.

Multiplication must never touch the dense dimensions. Iterate only A's nonzeros \`(r, k, va)\`, and for each one only row \`k\` of B; a missing row \`k\` in B contributes nothing and is skipped immediately. Cost is proportional to matching nonzeros, not to \`rows × cols × inner\`. This is the row-wise (Gustavson) formulation, and it is the reason the storage is a dict of rows — B is probed by row, which is exactly what it indexes.

Dimension mismatches throw rather than returning something plausible.

## Complexity

- \`get\` / \`set\`: O(1).
- \`add\`: O(nnz(A) + nnz(B)).
- \`multiply\`: O(sum over A's nonzeros of nnz of the matching B row) — never O(n³).
- Space: O(nnz).

## What interviewers probe

Why not CSR (compressed sparse row: three flat arrays)? Because CSR is immutable in practice — inserting a value shifts everything after it. Dict-of-rows is the right choice while a matrix is being built or mutated; CSR wins for a matrix that is built once and then multiplied repeatedly, since its contiguous arrays are far more cache-friendly. Naming both, and when each applies, is the answer.

## Reference implementation

\`\`\`
class SparseMatrix {
  constructor(nRows, nCols) {
    this.nRows = nRows;
    this.nCols = nCols;
    this.rows = new Map(); // row -> Map(col -> nonzero value)
  }

  static fromDense(dense) {
    const m = new SparseMatrix(dense.length, dense[0]?.length ?? 0);
    for (let r = 0; r < dense.length; r++) {
      for (let c = 0; c < dense[r].length; c++) m.set(r, c, dense[r][c]);
    }
    return m;
  }

  get(r, c) {
    return this.rows.get(r)?.get(c) ?? 0;
  }

  /** The only writer, so "no zero is ever stored" holds everywhere. */
  set(r, c, v) {
    if (v === 0) {
      const row = this.rows.get(r);
      if (!row) return;
      row.delete(c);
      if (row.size === 0) this.rows.delete(r);
      return;
    }
    if (!this.rows.has(r)) this.rows.set(r, new Map());
    this.rows.get(r).set(c, v);
  }

  add(other) {
    if (this.nRows !== other.nRows || this.nCols !== other.nCols) {
      throw new Error("dimension mismatch");
    }
    const out = new SparseMatrix(this.nRows, this.nCols);
    for (const [r, row] of this.rows) {
      for (const [c, v] of row) out.set(r, c, v);
    }
    // Through set(), so 2 + (-2) deletes rather than storing a zero.
    for (const [r, row] of other.rows) {
      for (const [c, v] of row) out.set(r, c, out.get(r, c) + v);
    }
    return out;
  }

  multiply(other) {
    if (this.nCols !== other.nRows) throw new Error("dimension mismatch");
    const out = new SparseMatrix(this.nRows, other.nCols);
    // Only A's nonzeros, and for each only the matching row of B.
    for (const [r, row] of this.rows) {
      for (const [k, va] of row) {
        const rowB = other.rows.get(k);
        if (!rowB) continue;
        for (const [c, vb] of rowB) out.set(r, c, out.get(r, c) + va * vb);
      }
    }
    return out;
  }

  toDense() {
    const dense = [];
    for (let r = 0; r < this.nRows; r++) {
      dense.push(new Array(this.nCols).fill(0));
      const row = this.rows.get(r);
      if (row) for (const [c, v] of row) dense[r][c] = v;
    }
    return dense;
  }

  nnz() {
    let total = 0;
    for (const row of this.rows.values()) total += row.size;
    return total;
  }
}
\`\`\``,

    "nearest-eligible-elevator": `## Approach

The algorithm is a linear scan — every elevator has to be looked at once, so there is nothing to optimize. The problem is really about pinning down "eligible" before writing any code, which is why it shows up as a requirements-gathering question wearing a simulation costume.

Eligibility has two independent clauses, and rejecting early keeps them readable:

- Services the floor. A freight elevator that skips floor 5 is out no matter where it is.
- Direction. An idle elevator matches any hail. A moving elevator must be going the hailed way and not have passed the floor: an \`up\` elevator must be at or below it, a \`down\` elevator at or above it. "At the hail floor, moving the right way" counts as toward — a decision worth stating explicitly rather than assuming.

Then keep the best \`(distance, id)\` pair over the scan. Comparing the pair gives the lowest-id tie-break with no extra branch.

## Complexity

- Time: O(n · s) for \`n\` elevators with \`s\` serviced floors; pre-hashing each serviced list into a set makes the check O(1).
- Space: O(1).

## What interviewers probe

That this greedy is not actually a good dispatcher. It ignores how many stops are already queued ahead of the hail, so the "nearest" elevator can be the slowest to arrive. Real controllers score candidates on estimated time to arrive, including queued stops and door dwell. The question is whether you can name that gap while still delivering the simple rule you were asked for.

## Reference implementation

\`\`\`
function selectElevator(elevators, floor, direction) {
  let bestId = -1;
  let bestDistance = Infinity;
  for (const elevator of elevators) {
    if (!isEligible(elevator, floor, direction)) continue;
    const distance = Math.abs(elevator.floor - floor);
    // The (distance, id) pair carries the lowest-id tie-break.
    if (distance < bestDistance || (distance === bestDistance && elevator.id < bestId)) {
      bestDistance = distance;
      bestId = elevator.id;
    }
  }
  return bestId;
}

function isEligible(elevator, floor, direction) {
  if (!elevator.serviced.includes(floor)) return false;
  if (elevator.direction === "idle") return true;
  if (elevator.direction !== direction) return false;
  // Moving the hailed way and not past the floor; "at" counts as toward.
  return direction === "up" ? elevator.floor <= floor : elevator.floor >= floor;
}
\`\`\``,

    "subsequence-expression-target": `## Approach

Two difficulties are stacked here, and they need separate machinery.

Precedence. You cannot evaluate left to right, because \`*\` binds tighter than \`+\`. The standard fix (the one from Expression Add Operators) is to carry two numbers instead of one:

- \`total\` — everything already committed by a \`+\`.
- \`last\` — the pending product that a future \`*\` could still extend.

The expression's value at any point is \`total + last\`. Appending \`+ v\` commits the pending product and starts a new one: \`total += last; last = v\`. Appending \`* v\` extends it in place: \`last *= v\`. That is precedence handled without a parser.

Subsequence choice. Layer the three moves at each index on top: skip it, start the expression here if nothing has been chosen yet, or extend the expression with \`+\` or \`*\`. The \`started\` flag is what keeps "no elements chosen" from being mistaken for a zero-valued expression — which is also why an empty array can never hit a target.

Check \`total + last === target\` at every node, not only at the end, because the expression is complete whenever you stop choosing.

## Complexity

Exponential in the worst case — say so rather than claiming the memo tames it. Memoizing visited \`(index, total, last, started)\` states prunes the overlap between different skip patterns that reach the same state, but the state space itself grows with the reachable values, so it is a real speedup and not a polynomial bound.

## What interviewers probe

Whether you notice this is not a knapsack. Positive integers give no monotonicity to prune on — \`*\` can shrink nothing but \`+\` and \`*\` interleave, so the reachable set is not an interval and there is no ordering that lets you cut branches. Recognizing that search is the honest answer is most of the grade.

## Reference implementation

\`\`\`
function canReachTarget(nums, target) {
  const seen = new Set();

  function search(index, total, last, started) {
    // The expression is complete whenever we stop choosing.
    if (started && total + last === target) return true;
    if (index === nums.length) return false;

    const key = index + ":" + total + ":" + last + ":" + started;
    if (seen.has(key)) return false;
    seen.add(key);

    const value = nums[index];
    if (search(index + 1, total, last, started)) return true; // skip
    if (!started) return search(index + 1, 0, value, true); // start here
    if (search(index + 1, total + last, value, true)) return true; // + commits
    return search(index + 1, total, last * value, true); // * extends
  }

  return search(0, 0, 0, false);
}
\`\`\``,

    "cleaning-robot-coverage": `## Approach

The classic wrong answer is a flood fill, which reports every open cell as reachable. It ignores the physics: the robot cannot stop mid-slide, so most cells it passes through are not places it can turn around.

The fix is to change what a search state is. States are rest positions, not cells. A cell the robot flies through gets cleaned, but it is not a node — you cannot branch from it. So BFS over rest positions, and each expansion simulates the four slides:

- Walk in the direction until the next cell is a wall or an obstacle.
- Add every cell passed through to the \`cleaned\` set.
- Enqueue only the slide's endpoint, and only if it is a new rest position.

That separation is the whole problem, and the two answers fall out of the two sets. A slide that cannot move at all ends where it started, which is already a known rest position, so it enqueues nothing and needs no special case.

The 3x3 open grid is the case that proves the point: the robot cleans 8 cells but can rest on only 4 — the center is passed through from either side and can never be stopped on.

## Complexity

- Time: O(R · C · max(R, C)) — each of up to R·C rest positions simulates four slides, each up to the grid's longer side. Caching each cell's slide endpoints per direction drops it to O(R · C).
- Space: O(R · C).

## Reference implementation

\`\`\`
function robotCoverage(grid, start) {
  const rows = grid.length;
  const cols = grid[0].length;
  const key = (r, c) => r * cols + c;

  const cleaned = new Set([key(start[0], start[1])]);
  const rests = new Set([key(start[0], start[1])]);
  const queue = [start];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // BFS over rest positions — cells flown through are cleaned, not expanded.
  for (let head = 0; head < queue.length; head++) {
    const [r0, c0] = queue[head];
    for (const [dr, dc] of directions) {
      let r = r0;
      let c = c0;
      while (
        r + dr >= 0 && r + dr < rows &&
        c + dc >= 0 && c + dc < cols &&
        grid[r + dr][c + dc] !== "#"
      ) {
        r += dr;
        c += dc;
        cleaned.add(key(r, c));
      }
      // A blocked slide ends where it began, so this is already a no-op.
      if (!rests.has(key(r, c))) {
        rests.add(key(r, c));
        queue.push([r, c]);
      }
    }
  }
  return [cleaned.size, rests.size];
}
\`\`\``,

    "warehouse-boxes": `## Approach

Two ideas, and the first one removes the geometry entirely.

Prefix minimum. A box pushed toward room \`i\` has to clear every ceiling on the way in, so room \`i\`'s real constraint is \`usable[i] = min(heights[0..i])\`, not \`heights[i]\`. That array is non-increasing by construction — which is why a low entrance chokes the whole warehouse no matter how tall the rooms behind it are.

Greedy matching. Now it is a matching problem: assign boxes to rooms with \`box <= usable[room]\`, one each, maximizing the count. Sort the boxes ascending and walk the rooms deepest-first — deepest is most constrained, since \`usable\` is non-increasing — placing the smallest unused box whenever it fits.

The exchange argument: suppose an optimal solution puts some box \`b\` in the deepest room the greedy fills with the smallest box \`s\`. Since \`s <= b\` and \`b\` fits, \`s\` fits too, and \`b\` fits anywhere \`s\` did (every other room's usable ceiling is at least as high). Swapping them keeps the solution valid and the same size, so the greedy choice is never worse. Induct on the remaining rooms.

If the smallest remaining box does not fit the current room, no box does, and the room stays empty.

## Complexity

- Time: O(n + m log m) — a linear pass for the prefix minima, and the sort dominates.
- Space: O(n + m).

## What interviewers probe

Why sorting rooms is unnecessary. The prefix minimum is already sorted (non-increasing), so walking it backwards is ascending order of capacity — a second sort is wasted work, and noticing that is the tell that you understood why the prefix min exists.

## Reference implementation

\`\`\`
function maxBoxes(heights, boxes) {
  // A room's real ceiling is the lowest one on the way in.
  const usable = [];
  let ceiling = Infinity;
  for (const height of heights) {
    ceiling = Math.min(ceiling, height);
    usable.push(ceiling);
  }

  const sorted = [...boxes].sort((a, b) => a - b);
  let box = 0;
  let stored = 0;
  // usable is non-increasing, so backwards is most-constrained-first, and
  // the smallest unused box is the only one worth trying.
  for (let room = usable.length - 1; room >= 0; room--) {
    if (box < sorted.length && sorted[box] <= usable[room]) {
      box++;
      stored++;
    }
  }
  return stored;
}
\`\`\``,

    "mark-and-compact-subtree": `## Approach

This is a mark-and-compact collector in miniature, and it keeps the real thing's two phases.

Mark. Walk the implicit subtree from \`k\` with an explicit stack, pushing \`2i+1\` and \`2i+2\`. Two conditions stop a branch: an index past the end of the array, and a \`null\` slot. The second one matters — a \`null\` means no node there, so nothing below it exists either, and the walk prunes the entire implicit subtree rather than marking phantom indices.

Compact. One left-to-right pass copying every surviving non-null value, recording \`old index -> new index\` as you go. Left-to-right is what preserves the original order.

Why the remap is returned at all is the design point of the question. The array was the tree: index arithmetic encoded the parent-child edges. Compaction destroys that encoding, so every outside reference holding an old index is now dangling — the remap is what patches them. Real collectors either return forwarding pointers like this or leave a forwarding address in the vacated slot; either way, moving objects and fixing references are inseparable.

Edge cases fall out for free: an out-of-range \`k\` or a \`k\` on a \`null\` slot marks nothing, but compaction still runs and still drops the \`null\` holes.

## Complexity

- Time: O(n) — each index is marked at most once and visited once during compaction.
- Space: O(n) for the mark set and the output.

## Reference implementation

\`\`\`
function markAndCompact(heapArray, k) {
  // Phase 1 — mark. A null slot prunes its whole implicit subtree.
  const garbage = new Set();
  const stack = [k];
  while (stack.length > 0) {
    const i = stack.pop();
    if (i < 0 || i >= heapArray.length || heapArray[i] === null) continue;
    if (garbage.has(i)) continue;
    garbage.add(i);
    stack.push(2 * i + 1, 2 * i + 2);
  }

  // Phase 2 — compact. Survivors keep their order; the remap patches every
  // outside reference, because compaction destroys the implicit indexing.
  const newArray = [];
  const remap = {};
  for (let i = 0; i < heapArray.length; i++) {
    if (heapArray[i] === null || garbage.has(i)) continue;
    remap[i] = newArray.length;
    newArray.push(heapArray[i]);
  }
  return [newArray, remap];
}
\`\`\``,

    "single-tab-browser-history": `## Approach

One array of urls plus a cursor index covers every navigation operation, and the cursor is what makes it a single-tab browser: there is exactly one current page, and back/forward move the cursor rather than restructuring anything.

- \`visit\` truncates before it appends. Everything after the cursor is forward history, and navigating from the current page destroys it — that is the behavior a real browser has, and the operation that makes the problem interesting.
- \`back\` / \`forward\` are clamped index arithmetic: \`max(0, cursor - steps)\` and \`min(length - 1, cursor + steps)\`. Clamping is the specified behavior, not an error case. Guard non-positive \`steps\` explicitly so a negative value cannot move the cursor the wrong way — \`cursor - (-3)\` would silently walk forward.
- \`haveVisited\` cannot read the history array. \`visit\` truncates urls that were genuinely visited, so a live-history lookup reports \`false\` for a page the session really did open. It needs a separate set that only ever grows: written once at construction with the homepage, then on every visit.

That last point is the whole question. Everything else is a cursor; the visited set is the piece that has to be recognized as different state with different lifetime.

## Complexity

- Time: O(1) amortized per operation — truncating is O(dropped), and each entry can only be dropped once.
- Space: O(n) over the session's total visits.

## The structure trade-off

Be ready to justify the choice, since the prompt asks for it directly:

- Dynamic array + cursor (this solution) — O(1) indexed jumps, so multi-step back/forward is a single arithmetic operation. Truncation is a length assignment. This is the best fit because \`back(steps)\` is a jump, not a walk.
- Two stacks (back and forward) — the classic answer, and clean for single steps, but \`back(steps)\` becomes \`steps\` pops and pushes, and \`haveVisited\` still needs its own set.
- Doubly linked list + cursor — O(1) truncation with no copying and no reallocation, but multi-step moves walk node by node, and it costs a pointer per entry.

## Reference implementation

\`\`\`
function solution(operations, args) {
  class BrowserSession {
    constructor(homepage) {
      this.history = [homepage];
      this.cursor = 0;
      // Separate lifetime: this set only ever grows.
      this.visited = new Set([homepage]);
    }

    visit(url) {
      // Everything after the cursor is forward history; it dies here.
      this.history.length = this.cursor + 1;
      this.history.push(url);
      this.cursor++;
      this.visited.add(url);
    }

    back(steps) {
      // Non-positive steps must not move the cursor.
      if (steps > 0) this.cursor = Math.max(0, this.cursor - steps);
      return this.history[this.cursor];
    }

    forward(steps) {
      if (steps > 0) {
        this.cursor = Math.min(this.history.length - 1, this.cursor + steps);
      }
      return this.history[this.cursor];
    }

    haveVisited(url) {
      // Not the live history — visit() truncates urls that were visited.
      return this.visited.has(url);
    }
  }

  let obj = null;
  const res = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const arg = args[i];
    if (op === "BrowserSession") {
      obj = new BrowserSession(...arg);
      res.push(null);
    } else if (op === "visit") {
      obj.visit(...arg);
      res.push(null);
    } else if (op === "back") {
      res.push(obj.back(...arg));
    } else if (op === "forward") {
      res.push(obj.forward(...arg));
    } else if (op === "haveVisited") {
      res.push(obj.haveVisited(...arg));
    }
  }
  return res;
}
\`\`\``,

    "implement-debounce": `## Approach

The only state is a pending timer id, held in a closure over the wrapper. Every call clears the timer that is already pending and schedules a fresh one, so \`fn\` runs only after \`wait\` milliseconds of quiet.

Three details separate a passing answer from a good one, and all three are about the wrapper being a faithful stand-in for \`fn\`:

- Argument forwarding. The timer fires later, so the arguments have to be captured now. The last call before the quiet period wins — that is the semantics users expect from a search box.
- \`this\` binding. Use a \`function\` expression rather than an arrow so the wrapper receives the caller's \`this\`, capture it, and apply it when the timer fires. An arrow wrapper silently breaks \`obj.debouncedMethod()\`.
- \`cancel()\`. Clear the timer and drop the id. Without it there is no way to abandon a pending call — which a component unmounting genuinely needs, or \`fn\` runs against a dead component.

## debounce vs throttle

They are different questions about the same stream of calls:

- Debounce waits for silence. During a continuous burst it fires once, after the burst ends. Right for "the user stopped typing".
- Throttle enforces a rate. During a continuous burst it fires at a steady interval throughout. Right for scroll and resize handlers, where you want updates during the gesture, not after it.

Debouncing a scroll handler is the classic misuse: the UI freezes for the whole gesture and updates once at the end.

## When leading edge matters

Trailing edge (the default above) means the first keystroke produces nothing — every call is delayed by \`wait\`. That is correct for a search box and wrong for a submit button, where the first click should act immediately and the rest should be swallowed as double-click protection. Leading edge fires on the first call when no timer is pending, then suppresses until things go quiet. \`{ leading, trailing }\` options exist because a burst's first and last call can each independently deserve to fire.

## Reference implementation

\`\`\`
type Debounced<F extends (...args: never[]) => unknown> = ((
  this: unknown,
  ...args: Parameters<F>
) => void) & { cancel: () => void };

function debounce<F extends (...args: never[]) => unknown>(
  fn: F,
  wait: number,
): Debounced<F> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  // A function expression, not an arrow: the wrapper needs the caller's this.
  const debounced = function (this: unknown, ...args: Parameters<F>) {
    clearTimeout(timer);
    const context = this;
    timer = setTimeout(() => {
      timer = undefined;
      fn.apply(context, args);
    }, wait);
  } as Debounced<F>;

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
\`\`\``,

    "top-earners-per-department": `## Approach

\`DENSE_RANK()\` partitioned by department and ordered by salary descending assigns rank 1 to every employee tied at the department maximum, which is exactly what "including ties" asks for. Then filter on the rank.

The filter cannot go in \`WHERE\`. Window functions are evaluated after \`WHERE\` — logically, \`WHERE\` decides which rows the window even sees — so referencing the rank there is a syntax error, not a subtlety. Compute the rank in a CTE or subquery and filter in the outer query.

Pick the ranking function deliberately, because the three differ exactly on ties:

- \`DENSE_RANK\` — ties share a rank and the next value gets the next integer. Salaries 100, 100, 90 rank 1, 1, 2. This is what you want for "the top three salary levels".
- \`RANK\` — ties share a rank and the next value skips: 1, 1, 3. Filtering \`<= 3\` here can return fewer than three distinct salary levels.
- \`ROW_NUMBER\` — no ties at all; it breaks them arbitrarily and would silently drop one of two employees earning exactly the same. Wrong for this question, and the mistake an interviewer is watching for.

## The follow-up: performance

The window version scans \`employees\` once, sorts within each partition, and joins departments — roughly O(n log n) overall, and a covering index on \`(department_id, salary DESC)\` can even supply the order directly.

A correlated subquery (\`WHERE salary IN (SELECT ... WHERE department_id = e.department_id ORDER BY salary DESC LIMIT 3)\`) re-executes per row, so it is O(n) executions of a per-department query. It can win in exactly one case: a small number of departments, an index on \`(department_id, salary)\`, and a top-N small enough that each subquery is an index range scan of a few rows — the pattern a loose index scan optimizes. Check the plan rather than asserting either way.

## Reference implementation

\`\`\`
WITH ranked AS (
  SELECT
    e.department_id,
    e.name,
    e.salary,
    DENSE_RANK() OVER (
      PARTITION BY e.department_id
      ORDER BY e.salary DESC
    ) AS salary_rank
  FROM employees e
)
SELECT
  d.name AS department,
  r.name AS employee,
  r.salary
FROM ranked r
JOIN departments d ON d.id = r.department_id
WHERE r.salary_rank = 1        -- top three: change to r.salary_rank <= 3
ORDER BY d.name, r.salary DESC, r.name;
\`\`\``,

    "design-rate-limiter": `## Requirements

Pin these down before naming an algorithm, because they decide it:

- Limit key — per API key, per user, per IP, or per (key, endpoint). Per-IP alone punishes shared NATs and is trivially evaded.
- Scale — requests per second across the fleet, number of distinct keys, number of nodes. This is what decides whether counters can live locally.
- Strictness — is exceeding the limit a billing problem (must be exact) or a protection problem (approximate is fine)? Almost always the latter, and it unlocks much cheaper designs.

## Algorithm choice

The three candidates differ on burst behavior, which is the only thing that really separates them:

- Fixed window — a counter per (key, minute). O(1) memory per key and trivial to implement, but it allows a 2x burst across a boundary: 100 requests at 11:59:59 and 100 more at 12:00:00. Fine when the limit is a safety valve, not a contract.
- Sliding window log — store every request timestamp and count those inside the window. Exact, no boundary artifact, and O(requests) memory per key — the version that gets you paged when someone scripts a loop.
- Sliding window counter — interpolate between the previous and current fixed window by how far into the current one you are. Nearly the accuracy of the log at the memory of the fixed window; this is the usual production answer.
- Token bucket — capacity plus a refill rate. Tokens accumulate while idle, so it deliberately permits a burst up to the bucket size and then settles to the refill rate. Two numbers per key (token count, last refill time) and a lazy refill on read. Best fit when bursty clients are legitimate, which for a public API they usually are.

Default to token bucket for a public API, sliding window counter when a stated "N per minute" contract has to look honest to the client.

## Where the counters live

The decision that actually matters in a multi-node deployment.

- Local per node — zero latency, no dependency, but N nodes means a client can get up to N times the limit. Acceptable if you divide the limit by node count and tolerate the skew from imperfect load balancing.
- Centralized (Redis) — one source of truth. Make the read-modify-write atomic with a Lua script or \`INCR\` plus \`EXPIRE\`; a get-then-set from application code races under exactly the load you built this for. Costs a network round trip on every request, so co-locate it and pipeline.
- Hybrid — enforce locally against a share of the budget and reconcile with the central store asynchronously. Bounded overshoot, no round trip on the hot path. This is where high-throughput systems land.

## Failure modes

- Counter store down. Fail open for a protective limiter — availability of the API matters more than perfect enforcement — and fail closed only when the limit guards something expensive or abusable. State the choice explicitly; interviewers want to hear that it is a deliberate trade-off, not a default.
- Hot key. One client can make a single Redis key a hotspot. Shard by (key, bucket-index) and sum, or push that client to local enforcement.
- Clock skew across nodes shifts window boundaries; use the store's clock, not each node's.

## The client-facing contract

- \`429 Too Many Requests\` with a \`Retry-After\` header. A limiter that does not tell clients when to come back produces synchronized retry storms.
- \`X-RateLimit-Limit\`, \`-Remaining\`, and \`-Reset\` on every response, not just rejections, so well-behaved clients can self-pace.
- Reject at the edge, before any expensive work, and make sure the rejection path itself is cheap.`,

    "design-url-shortener": `## Requirements and scale

- Create a short code for a long URL; redirect a code to its URL with minimal latency.
- Optional: custom aliases, expiry, per-link analytics.

Run the numbers, because they decide the architecture. Assume 100M new links per month — about 40 writes per second — and a 100:1 read/write ratio, so roughly 4K redirects per second, with peaks well above that. Five years of links is about 6 billion rows; at ~500 bytes each that is a few terabytes. Two conclusions: the dataset does not fit in memory but the hot set easily does, and this is overwhelmingly a read system.

Code length: 62^7 is about 3.5 trillion, so seven Base62 characters is plenty; six (57 billion) is enough for most plans.

## Encoding

- Base62 of an auto-incrementing id — shortest possible codes, no collisions by construction, and trivially reversible. It leaks two things: the total number of links created (a competitor can measure your growth by shortening two links an hour apart), and sequential codes are enumerable, so any "private" link is walkable. Fine for internal or public-by-design links.
- Random code with a uniqueness check — unguessable and leaks nothing, but needs a collision check on insert. At 6 billion rows in a 3.5-trillion space, collisions are rare enough that a unique constraint plus retry is cheap.
- Hash of the URL, truncated — gives free deduplication of identical URLs, but truncation means collisions must be handled anyway, and identical URLs from different users can no longer have separate analytics.

Take random codes as the default: the enumeration property of sequential ids is a security problem, not just an aesthetic one. If you do use a counter, hand out ranges to each writer from a central allocator (or use per-node offsets) rather than making every insert contend on one row.

## Storage

A key-value shaped workload: \`code -> (long_url, owner, created_at, expires_at)\`. Any store with fast primary-key lookups works; shard by \`code\` since every read is by code and no query crosses shards. Skip normalization — there are no joins here.

## The read path

This is where the design earns its latency:

- Cache. An LRU of hot codes absorbs the great majority of reads — link popularity is heavily skewed, so a small cache gets a very high hit rate. Cache misses fall through to the store and populate on the way back.
- CDN / edge. Redirects are the ideal edge workload: tiny responses, immutable-ish mappings. Serving them at the edge cuts both latency and origin load.
- 301 vs 302. A \`301\` is cached by browsers and intermediaries forever, which is the cheapest possible redirect and destroys your analytics and your ability to ever change or expire the link. Use \`302\` (or \`307\`) with a short TTL when analytics or mutability matter; \`301\` only for permanent, unmeasured links.

## Analytics without slowing the redirect

Never write to a database on the redirect path. Emit an event (Kafka or similar) asynchronously, or log and process offline, and aggregate in a stream job into per-link counters. The redirect returns as soon as it has the URL; the click record is fire-and-forget. Losing a small fraction of click events under load is an acceptable trade against adding a write to every read.

## What interviewers probe

- Hot links. A viral link can concentrate on one shard. The cache mostly handles this, since a hot key is by definition cached, but replicate the hottest entries across cache nodes to avoid a single-instance hotspot.
- Custom aliases share the code namespace, so they need the same uniqueness constraint and a reserved-word list.
- Deletion and expiry — a TTL column plus a lazy check at read time is simpler and cheaper than a sweeper job, and it means an expired link stops working immediately even before it is collected.`,

    "design-news-feed": `## Requirements

- Users follow other users; users post; each user gets a personalized timeline.
- Read-dominated by orders of magnitude: users scroll far more than they post.
- Timeline load must be fast (tens of milliseconds), while a post being visible a few seconds later is fine. That asymmetry is what the whole design exploits.

## The core trade-off

- Fan-out on write (push). On each post, append its id to every follower's precomputed timeline list. Reads become a single range scan of one list — a cache hit and nothing more. Writes cost O(followers), and a user with 50 million followers turns one post into 50 million list appends.
- Fan-out on read (pull). Store posts per author. On each timeline load, fetch the recent posts of everyone the user follows and merge them. Writes are O(1); reads cost O(following) fetches plus a merge, on the latency-critical path, for every scroll.

Neither works alone at scale, and the follower distribution is why: it is extremely heavy-tailed. Almost every user has few followers (push is cheap), and a tiny number have enormous followings (push is ruinous).

## Hybrid fan-out

Push for ordinary accounts, pull for celebrities:

- Posting from a normal account fans out to followers' timelines as usual.
- Accounts above a follower threshold are marked, and their posts are not fanned out.
- Reading a timeline reads the precomputed list, then fetches recent posts from the handful of celebrities that user follows and merges them in.

This bounds both sides: the fan-out queue never sees a celebrity's follower list, and the read-time merge is over a small number of authors, not the whole following set. The threshold is a tuning knob, and it is worth saying that it moves with load rather than being a constant in the code.

Two details that come up:

- Fan-out is asynchronous. Posts go on a queue and workers do the appends; the poster's write returns immediately. Followers see the post within seconds, which the requirements allow.
- Timelines are bounded and rebuildable. Store the most recent few hundred entries per user, not all of history — scrolling past the end falls back to a pull. Inactive users can be skipped by fan-out entirely and rebuilt on next login, which removes a large share of pointless writes.

## Storage and ranking

Separate the two problems, because they scale differently and change at different rates.

- What happened. Posts in a durable store keyed by post id, sharded by author. Timelines are lists of ids, so the post body is stored once and hydrated at read time — that keeps the fan-out payload tiny and means an edited or deleted post does not have to be chased through millions of lists.
- What to show first. A ranking service sits in the read path after candidate retrieval: take the merged candidate ids, hydrate features (author affinity, recency, engagement, predicted interaction), score, and order. Retrieval is a recall problem; ranking is a precision problem. Ranking changes weekly, storage does not.

A pure chronological feed is the degenerate ranker and a fine v1 — say that, then describe where the model plugs in.

## What interviewers probe

- Deletes and privacy. With push, a deleted post or a newly-private account leaves stale ids in millions of timelines. Filter at hydration time rather than trying to retract the fan-out.
- Consistency. Your own post should appear in your own timeline immediately; other people's can lag. Special-casing self-posts on read is the usual fix.
- Thundering herds. A celebrity posting causes a synchronized read spike, not a write spike, since the merge happens per reader. Cache the celebrity's recent posts aggressively — that one cache entry serves every reader.`,

    "conflict-with-teammate": `## What is actually being assessed

The interviewer is not grading the disagreement. They are checking three things:

- Do you engage or avoid? Silence and going along with something you believe is wrong reads as worse than conflict.
- Do you argue from evidence or from position? "I had more experience" is a red flag; "I pulled the latency numbers" is the answer.
- Does the relationship survive? Being right and leaving damage behind is a failing answer at every level.

Pick a story where someone changed their mind — you or them. Stalemates and "we escalated and the manager decided" are weak, because neither shows you moving the outcome. A story where you were persuaded is strong: it shows the position was held loosely and the evidence was allowed to win.

## Structure the answer with STAR

- Situation (2 sentences) — enough context to make the stakes legible, no more. What the project was and why the decision mattered.
- Task (1 sentence) — your specific responsibility in it. Not the team's; yours.
- Action (the bulk of the answer) — what you did, in first person singular. This is where the assessment happens, so spend your time here.
- Result (2 sentences) — the measurable outcome, plus what you would do differently.

The failure mode is spending three minutes on Situation and thirty seconds on Action. Rehearse the ratio, not the words.

## What belongs in Action

The specific moves that distinguish productive disagreement:

- You sought data. Name what you actually measured or looked up, and be ready for "what did the numbers say?"
- You steelmanned their position. Saying "their concern about migration risk was legitimate, and here is what convinced me it was manageable" shows you understood the objection rather than talking past it.
- You changed the venue when it helped. Moving from a thread to a 15-minute call, or writing a one-page comparison, is a concrete de-escalation move — name it.
- You escalated appropriately, if you did. Escalating with both options written up and a recommendation is good judgment. Escalating to win is not, and the difference is audible.
- You committed. If the decision went against you, say what you did next. "I disagreed, we went with their approach, and I made sure it succeeded" is the strongest possible ending.

## The Amazon framing

Map the story to Have Backbone; Disagree and Commit — the principle is literally about this scenario, and it has two halves. Most candidates tell the backbone half and skip the commit half, which is the half that shows seniority. If the disagreement was about scope or a deadline, Deliver Results or Customer Obsession may fit better; pick one and let the story demonstrate it rather than announcing it.

Have two versions ready: a two-minute version, and a longer one for the follow-ups, which are predictable —

- "What would you do differently?" — have a real answer. "Nothing" reads as no reflection.
- "How did they react?"
- "What if they had not come around?"
- "Have you ever been wrong in a disagreement like this?" — which is why a story where you changed your mind is worth preparing too.

## Ending it

End on the measurable result and the reflection, never on who turned out to be right. "We shipped on the original date and the error rate dropped by half; looking back I should have brought the data to the first conversation instead of the third" closes strong. "It turned out I was right" closes badly, whatever the facts were.`,
  };
