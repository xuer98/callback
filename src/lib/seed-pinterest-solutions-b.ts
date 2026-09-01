// Worked solutions for the Pinterest-tagged algorithm problems in
// seed-data.ts — part 2 of 3. See seed-pinterest-solutions-a.ts.

export const streamLineReaderSolution = `## Approach

Two pieces of state carry the whole reader: a queue of **complete lines** ready to serve, and the **fragments** of the current unterminated line. A chunk's \`split("\\n")\` tells you everything — every piece except the last completes a line (the first of them joined with the pending fragments), and the last piece is the new partial. Pull chunks only while the queue is empty (the lazy requirement), and at end-of-stream flush any pending fragments as the final, newline-less line.

Part 2 layers the settle logic on top: net every balance from the parsed lines, drop the zeros, and search for the fewest transactions.

\`\`\`python
class LineReader:
    def __init__(self, read_chunk):
        self.read_chunk = read_chunk
        self.lines = []    # complete lines ready to serve (deque in production)
        self.partial = []  # fragments of the current unterminated line
        self.eof = False

    def read_line(self):
        while not self.lines and not self.eof:
            chunk = self.read_chunk()
            if chunk == "":
                self.eof = True
                if self.partial:
                    self.lines.append("".join(self.partial))
                    self.partial = []
                break
            pieces = chunk.split("\\n")
            for piece in pieces[:-1]:
                self.partial.append(piece)
                self.lines.append("".join(self.partial))
                self.partial = []
            if pieces[-1]:
                self.partial.append(pieces[-1])
        return self.lines.pop(0) if self.lines else None


def settle_from_stream(read_chunk):
    reader = LineReader(read_chunk)
    balance = {}
    while True:
        line = reader.read_line()
        if line is None:
            break
        if not line:
            continue
        payer, payee, amount = line.split(",")
        balance[payer] = balance.get(payer, 0) + int(amount)
        balance[payee] = balance.get(payee, 0) - int(amount)
    balances = [b for b in balance.values() if b != 0]

    def settle_from(i):
        while i < len(balances) and balances[i] == 0:
            i += 1
        if i == len(balances):
            return 0
        best = float("inf")
        seen = set()
        for j in range(i + 1, len(balances)):
            if balances[i] * balances[j] < 0 and balances[j] not in seen:
                seen.add(balances[j])
                balances[j] += balances[i]
                best = min(best, 1 + settle_from(i + 1))
                balances[j] -= balances[i]
        return best

    return settle_from(0) if balances else 0
\`\`\`

## Complexity

Reading is O(total characters) — each character is split once and joined once. The settle search is exponential in the number of *nonzero* balances (with same-value pruning via \`seen\`); that's expected and worth saying plainly — few distinct people stay nonzero, and minimizing transfers is NP-hard in general.

## Worth saying out loud

- The empty-string subtleties are the interview: \`"a\\n\\nb"\` must yield an empty middle line (the loop produces it naturally), while a stream ending in \`"\\n"\` must *not* yield a trailing empty line — which is why the tail piece is only buffered when non-empty.
- Join fragments **once, when the line completes** — concatenating the partial on every chunk makes a line spanning k chunks cost O(k²).
- \`lines.pop(0)\` is O(n) on a list; \`collections.deque\` with \`popleft\` is the production container — one sentence, free points.
- Laziness is graded behavior, not style: \`read_line\` pulls at most until it owns one complete line, so a huge stream costs only what you consume.`;

export const escapeRoomLeaderboardSolution = `## Approach

A "bucket per room" whose arrival order matters is a doubly-linked list per room — exactly the LRU-cache trick. \`advance()\` unlinks the player's node from room \`r\` and appends it to the tail of room \`r + 1\`, both O(1); because movement is forward-only, nobody ever enters a room twice, so each room's list head→tail *is* its earliest-entry order — no timestamps needed. \`leaderboard()\` walks rooms from the highest occupied one down, reading each list head→tail. Sorting on every call is the stated auto-fail: O(N log N) per query for an answer the structure already holds.

One integer, \`_top\`, tracks the highest occupied room. It never decreases (forward-only again), so maintaining it is a single \`max\` on advance — no heap.

\`\`\`python
from typing import Dict, List, Optional

class _Node:
    __slots__ = ("pid", "room", "prev", "next")

    def __init__(self, pid: int, room: int):
        self.pid, self.room = pid, room
        self.prev: Optional["_Node"] = None
        self.next: Optional["_Node"] = None

class EscapeRoomGame:
    def __init__(self, player_ids: List[int], R: int):
        self.R = R
        self._head: List[Optional[_Node]] = [None] * (R + 1)   # per-room list head (earliest)
        self._tail: List[Optional[_Node]] = [None] * (R + 1)   # per-room list tail (latest)
        self._nodes: Dict[int, _Node] = {}
        self._top = 0                                           # highest occupied room
        for pid in player_ids:                                  # O(N)
            node = _Node(pid, 0)
            self._nodes[pid] = node
            self._append(node)

    # -- linked-list helpers (all O(1)) --
    def _append(self, node: _Node) -> None:
        r = node.room
        node.prev, node.next = self._tail[r], None
        if self._tail[r] is None:
            self._head[r] = node
        else:
            self._tail[r].next = node
        self._tail[r] = node

    def _unlink(self, node: _Node) -> None:
        r = node.room
        if node.prev: node.prev.next = node.next
        else:         self._head[r] = node.next
        if node.next: node.next.prev = node.prev
        else:         self._tail[r] = node.prev
        node.prev = node.next = None

    # -- API --
    def advance(self, pid: int) -> None:            # O(1)
        node = self._nodes[pid]
        if node.room == self.R:
            return                                  # stays; order unchanged (clarify with interviewer)
        self._unlink(node)
        node.room += 1
        self._append(node)                          # newest arrival goes to the tail
        if node.room > self._top:
            self._top = node.room                   # players only move forward -> top never decreases

    def get_room(self, pid: int) -> int:            # O(1)
        return self._nodes[pid].room

    def leaderboard(self, k: int) -> List[int]:     # O(R + k) worst case; O(k) when rooms are dense
        out: List[int] = []
        r = self._top
        while r >= 0 and len(out) < k:
            node = self._head[r]
            while node is not None and len(out) < k:
                out.append(node.pid)
                node = node.next
            r -= 1
        return out
\`\`\`

## The R >> N follow-up

The walk above visits empty rooms between clusters, so a sparse board costs O(R) per query. Fix: keep a *second* doubly-linked list — of non-empty rooms, ordered by room index. When a player moves \`r → r + 1\` and \`r + 1\` was empty, splice \`r + 1\` in right above \`r\` (\`r\` is non-empty at that instant — the player was just there): O(1). If \`r\` then became empty, unlink it: O(1). \`leaderboard()\` now hops only occupied rooms, so it's O(k). Building on the class above:

\`\`\`python
class EscapeRoomGameSparse(EscapeRoomGame):
    def __init__(self, player_ids: List[int], R: int):
        super().__init__(player_ids, R)
        self._next_room: Dict[int, Optional[int]] = {0: None}   # non-empty room -> next lower non-empty room
        self._prev_room: Dict[int, Optional[int]] = {0: None}   # non-empty room -> next higher non-empty room

    def advance(self, pid: int) -> None:
        node = self._nodes[pid]
        if node.room == self.R:
            return
        r = node.room
        self._unlink(node)
        node.room = r + 1
        self._append(node)
        if r + 1 not in self._next_room:                 # r+1 just became non-empty: splice above r
            higher = self._prev_room[r]
            self._prev_room[r + 1], self._next_room[r + 1] = higher, r
            self._prev_room[r] = r + 1
            if higher is None: self._top = r + 1
            else:              self._next_room[higher] = r + 1
        if self._head[r] is None:                        # r became empty: unlink it
            higher, lower = self._prev_room.pop(r), self._next_room.pop(r)
            if higher is None: self._top = lower if lower is not None else 0
            else:              self._next_room[higher] = lower
            if lower is not None: self._prev_room[lower] = higher

    def leaderboard(self, k: int) -> List[int]:      # O(k)
        out: List[int] = []
        r: Optional[int] = self._top
        while r is not None and len(out) < k:
            node = self._head[r]
            while node is not None and len(out) < k:
                out.append(node.pid)
                node = node.next
            r = self._next_room.get(r)
        return out
\`\`\`

## Complexity

\`advance\` and \`get_room\`: O(1). \`leaderboard(k)\`: O(R + k) with the plain walk, O(k) with the non-empty-room list. Space O(N + R) (the per-room head/tail arrays), or O(N) if the sparse version also swaps those arrays for dicts.

## Worth saying out loud

- Forward-only movement is what makes "earliest entry" free: append order *is* entry order, and \`_top\` only ever grows. Say that invariant — it's the whole design.
- The no-op at room R must not re-append the node: the player keeps their original arrival slot. Whether a re-\`advance\` at the cap should refresh tie order is genuinely ambiguous — ask, then codify (here: unchanged).
- Backward moves break both halves of the invariant: \`_top\` can shrink and a room can be re-entered, so "earliest entry" needs per-entry timestamps or re-append semantics — and the non-empty-room list stops being optional. Naming that is the point of the follow-up.
- Python's insertion-ordered \`dict\` per room (\`del\` is O(1), iteration is insertion order) gives the same behavior without hand-rolling the links — a \`LinkedHashSet\` in Java. Offer it as the pragmatic version; write the nodes to show you can.
- Many readers: \`leaderboard\` is pure read, so an RW-lock works — or have writers maintain a small immutable top-k snapshot readers grab without locking.`;

export const rebalanceBucketsSolution = `## Approach

Count what each group may keep: at most \`min(current_count, target)\` of its buckets — keep them greedily in a first pass. Everything else assigned is **surplus** and must change no matter what (it's over its group's target, or its group vanished from the targets). So the minimum number of changes is forced:

\`\`\`
changes = surplus + max(0, deficit - surplus)
\`\`\`

where \`deficit = Σ max(0, target − current)\`. Fill deficits from surplus buckets first — their change is already paid for — and only then from never-assigned buckets, each of which adds one new change. Leftover surplus goes to \`None\`.

\`\`\`python
def rebalance_buckets(current, targets):
    result = list(current)
    kept = {g: 0 for g in targets}
    surplus = []  # assigned buckets that must change anyway
    empty = []

    for i, group in enumerate(current):
        if group is None:
            empty.append(i)
        elif group in targets and kept[group] < targets[group]:
            kept[group] += 1
        else:
            surplus.append(i)

    for group in targets:
        deficit = targets[group] - kept[group]
        for _ in range(deficit):
            i = surplus.pop(0) if surplus else empty.pop(0)
            result[i] = group
    for i in surplus:
        result[i] = None
    return result
\`\`\`

## Complexity

O(n + g) time for n buckets and g groups — two passes over the buckets, one over the groups (the \`pop(0)\` calls are O(total pops) overall; use \`deque\` or an index pointer if you want to be strict about it). O(n) space for the result and index lists.

## Worth saying out loud

- The optimality argument is short — give it: every surplus bucket must change (its group has too many or no longer exists), and every deficit unit needs *some* bucket; reusing a surplus bucket satisfies both with one change, so surplus-first is exact, not heuristic.
- A bucket going from a group to \`None\` **counts as a change** — forgetting that makes "shrink A" look free and breaks the minimum.
- Real experiment frameworks add a constraint worth volunteering: keep assignments *sticky* per user (consistent hashing into the bucket space) so a rebalance only disrupts the moved buckets — which is precisely why this problem minimizes moved buckets.`;

export const unallocatedBucketsSolution = `## Approach

Sort the allocated ranges by start and sweep once with a cursor holding the smallest bucket not yet proven allocated. For each range: anything between the cursor and its start is a free range; then advance the cursor with \`max(cursor, end + 1)\` — the \`max\` is what absorbs overlapping and fully-contained ranges. Clamp out-of-bounds input up front, and emit the tail after the last range.

\`\`\`python
def unallocated_ranges(n, allocated):
    clamped = []
    for start, end in allocated:
        s, e = max(0, start), min(n - 1, end)
        if s <= e:
            clamped.append((s, e))
    clamped.sort()

    free = []
    cursor = 0
    for start, end in clamped:
        if start > cursor:
            free.append([cursor, start - 1])
        cursor = max(cursor, end + 1)
    if cursor <= n - 1:
        free.append([cursor, n - 1])
    return free
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
- \`released\` — a min-heap of returned IDs. Every released ID is below the watermark by construction, so the smallest available ID is *the heap's minimum when it's eligible, else the watermark*.

\`setCapacity\` just stores the number — that's the trick. Shrinking strands nothing: outstanding IDs above capacity stay valid (release still validates against \`allocated\`), and released IDs at or above capacity simply sit dormant in the heap. Dormancy costs zero code: **peek before you pop** — if the heap's minimum is at or above capacity, then *every* released ID is (it's the minimum), so nothing is eligible and the IDs stay put until capacity grows back over them.

\`\`\`python
import heapq


class IDAllocator:
    def __init__(self, capacity):
        self.capacity = capacity
        self.watermark = 0       # smallest never-issued ID
        self.allocated = set()   # currently outstanding
        self.released = []       # min-heap; may hold IDs >= capacity

    def allocate(self):
        if self.released and self.released[0] < self.capacity:
            best = heapq.heappop(self.released)
        elif self.watermark < self.capacity:
            best = self.watermark
            self.watermark += 1
        else:
            return -1
        self.allocated.add(best)
        return best

    def release(self, id_):
        if id_ not in self.allocated:
            return False
        self.allocated.discard(id_)
        heapq.heappush(self.released, id_)
        return True

    def set_capacity(self, c):
        self.capacity = c
\`\`\`

## Complexity

\`allocate\` and \`release\` O(log r) for r released IDs; \`set_capacity\` O(1). Space O(outstanding + released).

## Worth saying out loud

- Lazy capacity is the answer to the "adjustable" twist. Eager designs that rebuild a free-list on every \`set_capacity\` do O(capacity) work to change one integer, and get the shrink semantics wrong by invalidating outstanding IDs.
- Two invariants make the five-line \`allocate\` correct, and they're worth stating: released IDs are always below the watermark (so an eligible heap minimum always beats the watermark), and the heap minimum being ineligible proves the whole heap is (so falling through to the watermark is safe).
- Don't pop-and-discard dormant over-capacity IDs to "clean up" — they must come back when capacity grows. The peek guard is what keeps them recoverable.`;

export const flagSpamSolution = `## Approach

Say the words "hash join" — that's what this is. Build the join index from the call log: number → set of people it actually called. Stream the reports through it, keeping only reports where the reporter really received a call from that number (the cross-reference that kills fake reports). Count **distinct** valid reporters per number with a set — the same user reporting twice is one voice — then threshold and sort.

\`\`\`python
def flag_spam_numbers(call_log, reports, min_reports):
    called_by = {}  # number -> set of people it called
    for caller, callee in call_log:
        called_by.setdefault(caller, set()).add(callee)

    valid_reporters = {}  # number -> distinct valid reporters
    for reporter, number in reports:
        if reporter not in called_by.get(number, set()):
            continue
        valid_reporters.setdefault(number, set()).add(reporter)

    return sorted(
        number
        for number, reporters in valid_reporters.items()
        if len(reporters) >= min_reports
    )
\`\`\`

## Complexity

O(C + R) expected time for C calls and R reports — build one index, stream the other side through it — plus O(F log F) to sort the flagged numbers. Space O(C) for the index.

## Worth saying out loud

- Index the *smaller or reusable* side: here the call log is the lookup table because reports are the stream being validated. In SQL this is \`JOIN calls ON reporter = callee AND number = caller\`, then \`GROUP BY number HAVING COUNT(DISTINCT reporter) >= k\` — offering the SQL framing shows you see the shape.
- Distinctness lives at *both* levels: sets for who-was-called (duplicate calls collapse) and sets for who-reported (duplicate reports collapse). Counting report rows instead of distinct reporters is the common miss.
- Scale follow-up: if the logs don't fit memory, this becomes a sort-merge join or a two-pass MapReduce keyed by (number, reporter) — the in-memory hash join is the same algorithm with a different shuffle.`;
