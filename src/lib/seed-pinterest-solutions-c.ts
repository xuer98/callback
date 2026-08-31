// Worked solutions for the Pinterest-tagged algorithm problems in
// seed-data.ts — part 3 of 3. See seed-pinterest-solutions-a.ts.

export const sparseMatrixSolution = `## Approach

Dict-of-rows: \`rows: {row: {col: nonzero value}}\`. The representation *is* the invariant — zeros are never stored, so route every write through \`set\`, which deletes on zero. That one choice makes cancellation handling automatic everywhere else.

- **add** iterates both operands' nonzeros and accumulates through \`set\` — when \`+2\` meets \`−2\`, the second write stores zero and the entry vanishes.
- **multiply** iterates only A's nonzeros \`(r, k, va)\`, and for each one only B's row-k nonzeros \`(k, c, vb)\` — cost proportional to *matching* nonzero pairs, never to the dense dimensions.

\`\`\`python
class SparseMatrix:
    def __init__(self, n_rows, n_cols):
        self.n_rows = n_rows
        self.n_cols = n_cols
        self.rows = {}  # row -> {col: nonzero value}

    @classmethod
    def from_dense(cls, dense):
        m = cls(len(dense), len(dense[0]) if dense else 0)
        for r, row in enumerate(dense):
            for c, v in enumerate(row):
                if v != 0:
                    m.set(r, c, v)
        return m

    def get(self, r, c):
        return self.rows.get(r, {}).get(c, 0)

    def set(self, r, c, v):
        if v == 0:
            row = self.rows.get(r)
            if row:
                row.pop(c, None)
                if not row:
                    del self.rows[r]
            return
        self.rows.setdefault(r, {})[c] = v

    def add(self, other):
        if self.n_rows != other.n_rows or self.n_cols != other.n_cols:
            raise ValueError("dimension mismatch")
        out = SparseMatrix(self.n_rows, self.n_cols)
        for m in (self, other):
            for r, row in m.rows.items():
                for c, v in row.items():
                    out.set(r, c, out.get(r, c) + v)
        return out

    def multiply(self, other):
        if self.n_cols != other.n_rows:
            raise ValueError("dimension mismatch")
        out = SparseMatrix(self.n_rows, other.n_cols)
        for r, row in self.rows.items():
            for k, va in row.items():
                for c, vb in other.rows.get(k, {}).items():
                    out.set(r, c, out.get(r, c) + va * vb)
        return out

    def to_dense(self):
        dense = [[0] * self.n_cols for _ in range(self.n_rows)]
        for r, row in self.rows.items():
            for c, v in row.items():
                dense[r][c] = v
        return dense

    def nnz(self):
        return sum(len(row) for row in self.rows.values())
\`\`\`

## Complexity

With nnz(A) = a and nnz(B) = b: \`add\` is O(a + b); \`multiply\` is O(Σ over A's nonzeros of |matching B row|) — at most a·(max row of B), typically far less, and never O(n³). \`get\`/\`set\` O(1) expected. Storage O(nnz), which was the assignment.

## Worth saying out loud

- Cancellation is the planted trap: \`add\` producing a zero must *remove* the entry, or \`nnz\` lies and storage grows monotonically. Routing every write through \`set\` fixes it in one place instead of three.
- The multiply iteration order (A's entries drive; only B's matching row is touched) is why row-major storage is right for the left operand. If you'd also multiply on the right often, keep a column index too — that trade-off is the follow-up.
- \`from_dense\` legitimately scans the dense input (it must read it); the *operations* are what must never iterate the dense dimensions.
- Real recommender pipelines put this in CSR format — three flat arrays, cache-friendly, no per-entry dict overhead (scipy.sparse is exactly this). Dict-of-rows is the mutable builder; CSR is the frozen compute format. Naming both is senior signal.`;

export const nearestElevatorSolution = `## Approach

Write the eligibility predicate as its own function with early rejections, then one linear scan keeps the best \`(distance, id)\` pair. An elevator is eligible when it services the hail floor AND is idle, or is moving in the hailed direction on the correct side of the floor — an "up" elevator at or below it, a "down" elevator at or above it (sitting exactly on the hail floor counts as toward).

\`\`\`python
def select_elevator(elevators, floor, direction):
    def eligible(e):
        if floor not in e["serviced"]:
            return False
        if e["direction"] == "idle":
            return True
        if e["direction"] != direction:
            return False
        if direction == "up":
            return e["floor"] <= floor
        return e["floor"] >= floor

    best_id = -1
    best_distance = float("inf")
    for e in elevators:
        if not eligible(e):
            continue
        distance = abs(e["floor"] - floor)
        if distance < best_distance or (
            distance == best_distance and e["id"] < best_id
        ):
            best_id = e["id"]
            best_distance = distance
    return best_id
\`\`\`

## Complexity

O(n·s) time for n elevators with serviced lists of length s (make \`serviced\` a set for O(n) total), O(1) space. Every elevator must be examined once, so the scan is optimal.

## Worth saying out loud

- This is a requirements-gathering exercise wearing a simulation costume — the grading is in the questions you ask: does an elevator *at* the hail floor moving the hailed direction count (yes, here)? Is a wrong-direction elevator at the floor eligible (no)? Distance in floors or travel time?
- Separating the predicate from the selection loop is what makes each rule auditable — burying five conditions in one expression is where the wrong-side bug hides.
- Real dispatchers don't pick nearest-eligible: they minimize estimated wait across pending hails, batch stops, and reposition idle cars. Nearest-eligible is the greedy baseline you'd A/B against — say so when asked "is this how real elevators work?".`;

export const subsequenceExpressionSolution = `## Approach

Two classic ideas composed. **Precedence** is handled with the \`(total, last)\` state from Expression Add Operators: the running value is \`total + last\`, where \`last\` is the pending product. Appending \`+ v\` commits the product (\`total += last; last = v\`); appending \`* v\` extends it (\`last *= v\`). **Subsequence choice** layers on top: at each index, skip it, start the expression here if nothing is chosen yet, or extend with \`+\` or \`*\`.

Success can be checked at any point once something is chosen — choosing to stop *is* skipping the rest. Because every number is a positive integer, \`total + last\` never decreases along any extension, which gives a clean prune: once it exceeds the target, abandon the branch. Memoize visited states to kill re-exploration.

\`\`\`python
def can_reach_target(nums, target):
    seen = set()

    def search(i, total, last, started):
        if started and total + last == target:
            return True
        if i == len(nums):
            return False
        if started and total + last > target:
            return False  # positive values only grow
        key = (i, total, last, started)
        if key in seen:
            return False
        seen.add(key)

        if search(i + 1, total, last, started):  # skip nums[i]
            return True
        if not started:
            return search(i + 1, 0, nums[i], True)  # start the expression here
        return (
            search(i + 1, total + last, nums[i], True)     # ... + nums[i]
            or search(i + 1, total, last * nums[i], True)  # ... * nums[i]
        )

    return search(0, 0, 0, False)
\`\`\`

## Complexity

Worst case exponential — the state space is (index × reachable totals × pending products), and saying that plainly is expected. The over-target prune and the memo set keep it fast for realistic inputs because positive values grow quickly; with 1s in the input the memo is what prevents blowup.

## Worth saying out loud

- The \`(total, last)\` decomposition is *the* insight: evaluating left to right with precedence is impossible with a single accumulator, because a later \`*\` reaches back into the previous term. Deferring the pending product makes every step local.
- The prune's correctness argument deserves one sentence: with all values ≥ 1, \`+\` strictly grows \`total + last\`, \`*\` grows or preserves it, and skipping preserves it — so an over-target state can never come back down. (With zeros or negatives allowed, the prune — and much of the memo's value — dies; flag that dependency.)
- "At least one element" is why \`started\` exists — without it, an empty expression would spuriously match \`target = 0\`.`;

export const robotCoverageSolution = `## Approach

Sliding movement changes what a "state" is: the robot can only *decide* anything at rest positions, so search over rest positions, not cells. BFS from the start; expanding a rest position simulates the four slides, adding every cell passed through to the \`cleaned\` set and enqueueing only each slide's **endpoint** (if it's a new rest position). Plain flood fill is the classic wrong answer here — it ignores the physics and overcounts both sets.

\`\`\`python
def robot_coverage(grid, start):
    rows, cols = len(grid), len(grid[0])

    def is_open(r, c):
        return 0 <= r < rows and 0 <= c < cols and grid[r][c] != "#"

    origin = (start[0], start[1])
    cleaned = {origin}
    rests = {origin}
    stack = [origin]
    while stack:
        r, c = stack.pop()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r, c
            while is_open(nr + dr, nc + dc):
                nr += dr
                nc += dc
                cleaned.add((nr, nc))
            if (nr, nc) != (r, c) and (nr, nc) not in rests:
                rests.add((nr, nc))
                stack.append((nr, nc))
    return [len(cleaned), len(rests)]
\`\`\`

## Complexity

Each rest position expands once, and each expansion slides at most the grid's width or height: O(R·max(rows, cols)) for R rest positions, bounded by O(rows·cols·max(rows, cols)) and much smaller in practice. Space O(rows·cols) for the two sets.

## Worth saying out loud

- Cleaned and restable are *different* sets with different membership rules — cells flown through are cleaned but not branchable. The open 3×3 grid makes the distinction vivid: the center gets cleaned by a passing slide but can never be a rest cell, and nothing ever stops there.
- A slide of zero cells is not a move — without the \`(nr, nc) != (r, c)\` guard you'd re-enqueue the current cell forever.
- Termination argument: rest positions are finite and each enqueues once (the \`rests\` set doubles as visited), so cycles like corridor ping-pong are free.`;

export const warehouseBoxesSolution = `## Approach

Two observations crack it. First, a room's *real* ceiling is the minimum of every ceiling on the way in — a box must pass all of them — so compute the prefix-min \`usable[i] = min(heights[0..i])\`, which is non-increasing by construction. Second, an exchange-argument greedy: sort the boxes ascending, walk the rooms deepest-first (most constrained first), and place the smallest unused box whenever it fits the room's usable ceiling.

\`\`\`python
def max_boxes(heights, boxes):
    usable = list(heights)
    for i in range(1, len(usable)):
        usable[i] = min(usable[i], usable[i - 1])

    sorted_boxes = sorted(boxes)
    nxt = 0  # smallest unused box
    stored = 0
    for ceiling in reversed(usable):
        if nxt == len(sorted_boxes):
            break
        if sorted_boxes[nxt] <= ceiling:
            stored += 1
            nxt += 1
    return stored
\`\`\`

## Complexity

O(n + m log m) for n rooms and m boxes — the prefix-min pass, the sort, and one merged walk. O(n + m) space for the copies (or O(1) extra if you may overwrite inputs).

## Worth saying out loud

- The exchange argument, in one breath: if an optimal solution stores box b in the deepest usable room while a smaller box b′ sits shallower (or unused), swapping them stays legal — smaller boxes fit anywhere b fit and deeper rooms only have lower ceilings — so smallest-into-deepest never loses a box.
- Deepest-first matters because \`usable\` is non-increasing: burn your smallest boxes on the tightest rooms, save the big ceilings near the entrance for the big boxes.
- Boundary discipline: "equal heights pass" means every comparison is \`<=\`; and insertion order is a red herring the prompt grants you — pushing deeper boxes in first is always realizable, which is why pure counting works.`;

export const markAndCompactSolution = `## Approach

Garbage collection in miniature — two phases, exactly as named.

**Mark**: walk the implicit subtree from k with an explicit stack; the node at i has children at 2i+1 and 2i+2, and both out-of-range indices and \`None\` slots stop the walk (\`None\` means no node, so nothing exists below it either). An invalid k marks nothing.

**Compact**: one left-to-right pass copies every surviving value — non-\`None\` and unmarked — to the front of a new array, recording \`old index → new index\` in the remap as it goes. \`None\` slots are dropped by compaction regardless of the mark phase.

\`\`\`python
def mark_and_compact(heap_array, k):
    marked = set()
    if 0 <= k < len(heap_array) and heap_array[k] is not None:
        stack = [k]
        while stack:
            i = stack.pop()
            if i >= len(heap_array) or heap_array[i] is None:
                continue
            marked.add(i)
            stack.extend((2 * i + 1, 2 * i + 2))

    new_array = []
    remap = {}
    for i, value in enumerate(heap_array):
        if value is None or i in marked:
            continue
        remap[i] = len(new_array)
        new_array.append(value)
    return [new_array, remap]
\`\`\`

## Complexity

O(n) time — the mark walk visits at most n indices once and compaction is a single pass — and O(n) space for the mark set, output, and remap.

## Worth saying out loud

- Why the remap must be returned is the design point, so voice it: compaction moves survivors, which breaks every index-based reference into the array (including the implicit parent/child arithmetic) — the remap is the patch table a real collector applies to the root set, exactly like the forwarding addresses in a compacting GC.
- \`None\` slots prune the mark walk — index 2i+1 being \`None\` means the marked subtree simply doesn't extend there; marking "through" a hole would touch nodes that belong to other subtrees.
- Preserving original order (rather than heap-reordering survivors) is what makes the remap the *only* invalidation — a stable compaction is a one-pointer sweep, and stability is why order appears in the spec at all.`;
