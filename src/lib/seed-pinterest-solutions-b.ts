// Worked solutions for the Pinterest-tagged algorithm problems in
// seed-data.ts — part 2 of 3. See seed-pinterest-solutions-a.ts.

export const streamLineReaderSolution = `## Approach

Two pieces of state carry the whole reader: a queue of **complete lines** ready to serve, and the **fragments** of the current unterminated line. A chunk's \`split("\\n")\` tells you everything — every piece except the last completes a line (the first of them joined with the pending fragments), and the last piece is the new partial. Pull chunks only while the queue is empty (the lazy requirement), and at end-of-stream flush any pending fragments as the final, newline-less line.

Part 2 layers the settle logic on top: net every balance from the parsed lines, drop the zeros, and search for the fewest transactions.

\`\`\`js
class LineReader {
  constructor(readChunk) {
    this.readChunk = readChunk;
    this.lines = [];   // complete lines ready to serve
    this.partial = []; // fragments of the current unterminated line
    this.eof = false;
  }

  readLine() {
    while (this.lines.length === 0 && !this.eof) {
      const chunk = this.readChunk();
      if (chunk === "") {
        this.eof = true;
        if (this.partial.length) {
          this.lines.push(this.partial.join(""));
          this.partial = [];
        }
        break;
      }
      const pieces = chunk.split("\\n");
      for (let i = 0; i < pieces.length - 1; i++) {
        this.partial.push(pieces[i]);
        this.lines.push(this.partial.join(""));
        this.partial = [];
      }
      const tail = pieces[pieces.length - 1];
      if (tail !== "") this.partial.push(tail);
    }
    return this.lines.shift() ?? null;
  }
}

function settleFromStream(readChunk) {
  const reader = new LineReader(readChunk);
  const balance = new Map();
  let line;
  while ((line = reader.readLine()) !== null) {
    if (line === "") continue;
    const [payer, payee, amount] = line.split(",");
    balance.set(payer, (balance.get(payer) ?? 0) + Number(amount));
    balance.set(payee, (balance.get(payee) ?? 0) - Number(amount));
  }
  const balances = [...balance.values()].filter((b) => b !== 0);

  const settleFrom = (i) => {
    while (i < balances.length && balances[i] === 0) i++;
    if (i === balances.length) return 0;
    let best = Infinity;
    const seen = new Set();
    for (let j = i + 1; j < balances.length; j++) {
      if (balances[i] * balances[j] < 0 && !seen.has(balances[j])) {
        seen.add(balances[j]);
        balances[j] += balances[i];
        best = Math.min(best, 1 + settleFrom(i + 1));
        balances[j] -= balances[i];
      }
    }
    return best;
  };
  return balances.length ? settleFrom(0) : 0;
}
\`\`\`

## Complexity

Reading is O(total characters) — each character is split once and joined once. The settle search is exponential in the number of *nonzero* balances (with same-value pruning via \`seen\`); that's expected and worth saying plainly — few distinct people stay nonzero, and minimizing transfers is NP-hard in general.

## Worth saying out loud

- The empty-string subtleties are the interview: \`"a\\n\\nb"\` must yield an empty middle line (the loop produces it naturally), while a stream ending in \`"\\n"\` must *not* yield a trailing empty line — which is why the tail piece is only buffered when non-empty.
- Join fragments **once, when the line completes** — repeated string concatenation on every chunk makes a line spanning k chunks cost O(k²).
- Laziness is graded behavior, not style: \`readLine\` pulls at most until it owns one complete line, so a huge stream costs only what you consume.`;

export const escapeRoomLeaderboardSolution = `## Approach

The standings are fully determined by one map: team → best time (an attempt only matters when it beats the stored best — regressions are ignored at insert time, not query time). Both queries read the entries ordered by \`(bestTime, name)\`; ordering by the pair gives the alphabetical tie-break for free.

\`\`\`js
class Leaderboard {
  constructor() {
    this.best = new Map(); // team -> best (lowest) time
  }

  addResult(team, time) {
    const current = this.best.get(team);
    if (current === undefined || time < current) this.best.set(team, time);
  }

  standings() {
    return [...this.best.entries()].sort(
      (a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1),
    );
  }

  rank(team) {
    if (!this.best.has(team)) return -1;
    return this.standings().findIndex(([name]) => name === team) + 1;
  }

  topK(k) {
    return this.standings().slice(0, k).map(([name]) => name);
  }
}
\`\`\`

## Complexity

\`addResult\` O(1). Each query re-sorts: O(n log n) for n teams. That's the honest baseline — then name the upgrade path instead of hand-waving it: keep a sorted structure incrementally (order-statistic tree / skip list keyed by \`(time, name)\`) for O(log n) \`addResult\` and \`rank\`, and O(k + log n) \`topK\`. JavaScript has no built-in ordered map, which is exactly why saying the words matters more than writing one in the interview.

## Worth saying out loud

- The data-structure trade-off *is* the question: sort-per-query wins when reads are rare, the incremental structure wins when \`rank\` is hot. State the read/write mix you're assuming.
- \`rank\` needs the position among *distinct teams by best time* — a heap can't answer that without draining; that observation is what justifies the order-statistic tree.
- Watch the equal-time re-attempt: \`time < current\` (strict) means an equal result changes nothing — no re-insert, no tie-order churn.`;

export const rebalanceBucketsSolution = `## Approach

Count what each group may keep: at most \`min(currentCount, target)\` of its buckets — keep them greedily in a first pass. Everything else assigned is **surplus** and must change no matter what (it's over its group's target, or its group vanished from the targets). So the minimum number of changes is forced:

\`\`\`
changes = surplus + max(0, deficit - surplus)
\`\`\`

where \`deficit = Σ max(0, target − current)\`. Fill deficits from surplus buckets first — their change is already paid for — and only then from never-assigned buckets, each of which adds one new change. Leftover surplus goes to null.

\`\`\`js
function rebalanceBuckets(current, targets) {
  const result = current.slice();
  const kept = new Map(Object.keys(targets).map((g) => [g, 0]));
  const surplus = []; // assigned buckets that must change anyway
  const empty = [];

  for (let i = 0; i < current.length; i++) {
    const group = current[i];
    if (group === null) {
      empty.push(i);
    } else if (group in targets && kept.get(group) < targets[group]) {
      kept.set(group, kept.get(group) + 1);
    } else {
      surplus.push(i);
    }
  }

  for (const group of Object.keys(targets)) {
    let deficit = targets[group] - kept.get(group);
    while (deficit > 0) {
      const i = surplus.length ? surplus.shift() : empty.shift();
      result[i] = group;
      deficit--;
    }
  }
  for (const i of surplus) result[i] = null;
  return result;
}
\`\`\`

## Complexity

O(n + g) time for n buckets and g groups — two passes over the buckets, one over the groups. O(n) space for the result and index lists.

## Worth saying out loud

- The optimality argument is short — give it: every surplus bucket must change (its group has too many or no longer exists), and every deficit unit needs *some* bucket; reusing a surplus bucket satisfies both with one change, so surplus-first is exact, not heuristic.
- A bucket going from a group to null **counts as a change** — forgetting that makes "shrink A" look free and breaks the minimum.
- Real experiment frameworks add a constraint worth volunteering: keep assignments *sticky* per user (consistent hashing into the bucket space) so a rebalance only disrupts the moved buckets — which is precisely why this problem minimizes moved buckets.`;

export const unallocatedBucketsSolution = `## Approach

Sort the allocated ranges by start and sweep once with a cursor holding the smallest bucket not yet proven allocated. For each range: anything between the cursor and its start is a free range; then advance the cursor with \`max(cursor, end + 1)\` — the \`max\` is what absorbs overlapping and fully-contained ranges. Clamp out-of-bounds input up front, and emit the tail after the last range.

\`\`\`js
function unallocatedRanges(n, allocated) {
  const clamped = [];
  for (const [start, end] of allocated) {
    const s = Math.max(0, start);
    const e = Math.min(n - 1, end);
    if (s <= e) clamped.push([s, e]);
  }
  clamped.sort((a, b) => a[0] - b[0]);

  const free = [];
  let cursor = 0;
  for (const [start, end] of clamped) {
    if (start > cursor) free.push([cursor, start - 1]);
    cursor = Math.max(cursor, end + 1);
  }
  if (cursor <= n - 1) free.push([cursor, n - 1]);
  return free;
}
\`\`\`

## Complexity

O(k log k) for k allocated ranges — the sort dominates; the sweep is linear in k. Space O(k). Crucially, nothing is proportional to n.

## Worth saying out loud

- The n-independence is the design point: a boolean array over the bucket space is the obvious O(n) answer and dies the moment n is 2³² hash buckets. Say why the sweep only touches range *endpoints*.
- \`max(cursor, end + 1)\` carries three edge cases at once — overlap, containment, exact adjacency; if you write \`cursor = end + 1\` instead, a contained range drags the cursor backwards and re-frees allocated buckets.
- Ranges that clamp to nothing (\`end < 0\` or \`start >= n\`) must be dropped before the sweep, or a negative start seeds a phantom free range.`;

export const idAllocatorSolution = `## Approach

Three pieces of state, each answering one question:

- \`watermark\` — smallest ID never handed out; everything at or above it is virgin territory.
- \`allocated\` — currently outstanding IDs, for O(1) release validation.
- \`released\` — IDs returned to the pool. Every released ID is below the watermark by construction, so the smallest available ID is *the best eligible released ID if any exists, else the watermark*.

\`setCapacity\` just stores the number — that's the trick. Shrinking strands nothing: outstanding IDs above capacity stay valid (release still validates against \`allocated\`), and released IDs at or above capacity simply sit dormant in the pool, filtered out of \`allocate\` until capacity grows back over them.

\`\`\`js
class IDAllocator {
  constructor(capacity) {
    this.capacity = capacity;
    this.watermark = 0;         // smallest never-issued ID
    this.allocated = new Set(); // currently outstanding
    this.released = new Set();  // returned; may hold IDs >= capacity
  }

  allocate() {
    let best = this.watermark < this.capacity ? this.watermark : -1;
    for (const id of this.released) {
      if (id < this.capacity && (best === -1 || id < best)) best = id;
    }
    if (best === -1) return -1;
    if (best === this.watermark) this.watermark++;
    else this.released.delete(best);
    this.allocated.add(best);
    return best;
  }

  release(id) {
    if (!this.allocated.has(id)) return false;
    this.allocated.delete(id);
    this.released.add(id);
    return true;
  }

  setCapacity(c) {
    this.capacity = c;
  }
}
\`\`\`

## Complexity

As written, \`allocate\` scans the released pool: O(r). The production answer keys the pool with a **min-heap**: O(log r) allocate/release, popping heap minima that are ≥ capacity back off later is handled by peek-and-skip (they re-enter consideration when capacity grows only if you retain them — so *peek*, don't discard). \`release\` and \`setCapacity\` O(1). Space O(outstanding + released).

## Worth saying out loud

- Lazy capacity is the answer to the "adjustable" twist. Eager designs that rebuild a free-list on every \`setCapacity\` do O(capacity) work to change one integer, and get the shrink semantics wrong by invalidating outstanding IDs.
- The invariant that keeps the min logic honest: released IDs are always below the watermark, so the two sources never interleave — the smallest eligible released ID beats the watermark whenever one exists.
- With a heap, don't pop dormant over-capacity IDs off — they must come back when capacity grows. A heap plus a "dormant" holding set, or a skip-scan on peek, both work; say which and why.`;

export const flagSpamSolution = `## Approach

Say the words "hash join" — that's what this is. Build the join index from the call log: number → set of people it actually called. Stream the reports through it, keeping only reports where the reporter really received a call from that number (the cross-reference that kills fake reports). Count **distinct** valid reporters per number with a set — the same user reporting twice is one voice — then threshold and sort.

\`\`\`js
function flagSpamNumbers(callLog, reports, minReports) {
  const calledBy = new Map(); // number -> set of people it called
  for (const [caller, callee] of callLog) {
    if (!calledBy.has(caller)) calledBy.set(caller, new Set());
    calledBy.get(caller).add(callee);
  }

  const validReporters = new Map(); // number -> distinct valid reporters
  for (const [reporter, number] of reports) {
    if (!calledBy.get(number)?.has(reporter)) continue;
    if (!validReporters.has(number)) validReporters.set(number, new Set());
    validReporters.get(number).add(reporter);
  }

  return [...validReporters.entries()]
    .filter(([, reporters]) => reporters.size >= minReports)
    .map(([number]) => number)
    .sort();
}
\`\`\`

## Complexity

O(C + R) expected time for C calls and R reports — build one index, stream the other side through it — plus O(F log F) to sort the flagged numbers. Space O(C) for the index.

## Worth saying out loud

- Index the *smaller or reusable* side: here the call log is the lookup table because reports are the stream being validated. In SQL this is \`JOIN calls ON reporter = callee AND number = caller\`, then \`GROUP BY number HAVING COUNT(DISTINCT reporter) >= k\` — offering the SQL framing shows you see the shape.
- Distinctness lives at *both* levels: sets for who-was-called (duplicate calls collapse) and sets for who-reported (duplicate reports collapse). Counting report rows instead of distinct reporters is the common miss.
- Scale follow-up: if the logs don't fit memory, this becomes a sort-merge join or a two-pass MapReduce keyed by (number, reporter) — the in-memory hash join is the same algorithm with a different shuffle.`;
