// Worked solutions for the Pinterest-tagged algorithm problems in
// seed-data.ts — part 3 of 3. See seed-pinterest-solutions-a.ts.

export const sparseMatrixSolution = `## Approach

Dict-of-rows: \`rows: Map(row → Map(col → nonzero value))\`. The representation *is* the invariant — zeros are never stored, so route every write through \`set\`, which deletes on zero. That one choice makes cancellation handling automatic everywhere else.

- **add** iterates both operands' nonzeros and accumulates through \`set\` — when \`+2\` meets \`−2\`, the second write stores zero and the entry vanishes.
- **multiply** iterates only A's nonzeros \`(r, k, va)\`, and for each one only B's row-k nonzeros \`(k, c, vb)\` — cost proportional to *matching* nonzero pairs, never to the dense dimensions.

\`\`\`js
class SparseMatrix {
  constructor(nRows, nCols) {
    this.nRows = nRows;
    this.nCols = nCols;
    this.rows = new Map(); // row -> Map(col -> nonzero value)
  }

  static fromDense(dense) {
    const m = new SparseMatrix(dense.length, dense[0]?.length ?? 0);
    for (let r = 0; r < dense.length; r++) {
      for (let c = 0; c < dense[r].length; c++) {
        if (dense[r][c] !== 0) m.set(r, c, dense[r][c]);
      }
    }
    return m;
  }

  get(r, c) {
    return this.rows.get(r)?.get(c) ?? 0;
  }

  set(r, c, v) {
    if (v === 0) {
      const row = this.rows.get(r);
      if (row) {
        row.delete(c);
        if (row.size === 0) this.rows.delete(r);
      }
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
    for (const m of [this, other]) {
      for (const [r, row] of m.rows) {
        for (const [c, v] of row) out.set(r, c, out.get(r, c) + v);
      }
    }
    return out;
  }

  multiply(other) {
    if (this.nCols !== other.nRows) throw new Error("dimension mismatch");
    const out = new SparseMatrix(this.nRows, other.nCols);
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
    const dense = Array.from({ length: this.nRows }, () =>
      new Array(this.nCols).fill(0),
    );
    for (const [r, row] of this.rows) {
      for (const [c, v] of row) dense[r][c] = v;
    }
    return dense;
  }

  nnz() {
    let count = 0;
    for (const row of this.rows.values()) count += row.size;
    return count;
  }
}
\`\`\`

## Complexity

With nnz(A) = a and nnz(B) = b: \`add\` is O(a + b); \`multiply\` is O(Σ over A's nonzeros of |matching B row|) — at most a·(max row of B), typically far less, and never O(n³). \`get\`/\`set\` O(1) expected. Storage O(nnz), which was the assignment.

## Worth saying out loud

- Cancellation is the planted trap: \`add\` producing a zero must *remove* the entry, or \`nnz\` lies and storage grows monotonically. Routing every write through \`set\` fixes it in one place instead of three.
- The multiply iteration order (A's entries drive; only B's matching row is touched) is why row-major storage is right for the left operand. If you'd also multiply on the right often, keep a column index too — that trade-off is the follow-up.
- \`fromDense\` legitimately scans the dense input (it must read it); the *operations* are what must never iterate the dense dimensions.
- Real recommender pipelines put this in CSR format — three flat arrays, cache-friendly, no per-entry Map overhead. Dict-of-rows is the mutable builder; CSR is the frozen compute format. Naming both is senior signal.`;

export const nearestElevatorSolution = `## Approach

Write the eligibility predicate as its own function with early rejections, then one linear scan keeps the best \`(distance, id)\` pair. An elevator is eligible when it services the hail floor AND is idle, or is moving in the hailed direction on the correct side of the floor — an "up" elevator at or below it, a "down" elevator at or above it (sitting exactly on the hail floor counts as toward).

\`\`\`js
function selectElevator(elevators, floor, direction) {
  const eligible = (e) => {
    if (!e.serviced.includes(floor)) return false;
    if (e.direction === "idle") return true;
    if (e.direction !== direction) return false;
    return direction === "up" ? e.floor <= floor : e.floor >= floor;
  };

  let bestId = -1;
  let bestDistance = Infinity;
  for (const e of elevators) {
    if (!eligible(e)) continue;
    const distance = Math.abs(e.floor - floor);
    if (
      distance < bestDistance ||
      (distance === bestDistance && e.id < bestId)
    ) {
      bestId = e.id;
      bestDistance = distance;
    }
  }
  return bestId;
}
\`\`\`

## Complexity

O(n·s) time for n elevators with serviced lists of length s (make \`serviced\` a Set for O(n) total), O(1) space. Every elevator must be examined once, so the scan is optimal.

## Worth saying out loud

- This is a requirements-gathering exercise wearing a simulation costume — the grading is in the questions you ask: does an elevator *at* the hail floor moving the hailed direction count (yes, here)? Is a wrong-direction elevator at the floor eligible (no)? Distance in floors or travel time?
- Separating the predicate from the selection loop is what makes each rule auditable — burying five conditions in one expression is where the wrong-side bug hides.
- Real dispatchers don't pick nearest-eligible: they minimize estimated wait across pending hails, batch stops, and reposition idle cars. Nearest-eligible is the greedy baseline you'd A/B against — say so when asked "is this how real elevators work?".`;

export const subsequenceExpressionSolution = `## Approach

Two classic ideas composed. **Precedence** is handled with the \`(total, last)\` state from Expression Add Operators: the running value is \`total + last\`, where \`last\` is the pending product. Appending \`+ v\` commits the product (\`total += last; last = v\`); appending \`* v\` extends it (\`last *= v\`). **Subsequence choice** layers on top: at each index, skip it, start the expression here if nothing is chosen yet, or extend with \`+\` or \`*\`.

Success can be checked at any point once something is chosen — choosing to stop *is* skipping the rest. Because every number is a positive integer, \`total + last\` never decreases along any extension, which gives a clean prune: once it exceeds the target, abandon the branch. Memoize visited states to kill re-exploration.

\`\`\`js
function canReachTarget(nums, target) {
  const seen = new Set();

  const search = (i, total, last, started) => {
    if (started && total + last === target) return true;
    if (i === nums.length) return false;
    if (started && total + last > target) return false; // positives only grow
    const key = i + "," + total + "," + last + "," + started;
    if (seen.has(key)) return false;
    seen.add(key);

    if (search(i + 1, total, last, started)) return true; // skip nums[i]
    if (!started) {
      return search(i + 1, 0, nums[i], true); // start the expression here
    }
    return (
      search(i + 1, total + last, nums[i], true) || // ... + nums[i]
      search(i + 1, total, last * nums[i], true)    // ... * nums[i]
    );
  };

  return search(0, 0, 0, false);
}
\`\`\`

## Complexity

Worst case exponential — the state space is (index × reachable totals × pending products), and saying that plainly is expected. The over-target prune and the memo set keep it fast for realistic inputs because positive values grow quickly; with 1s in the input the memo is what prevents blowup.

## Worth saying out loud

- The \`(total, last)\` decomposition is *the* insight: evaluating left to right with precedence is impossible with a single accumulator, because a later \`*\` reaches back into the previous term. Deferring the pending product makes every step local.
- The prune's correctness argument deserves one sentence: with all values ≥ 1, \`+\` strictly grows \`total + last\`, \`*\` grows or preserves it, and skipping preserves it — so an over-target state can never come back down. (With zeros or negatives allowed, the prune — and much of the memo's value — dies; flag that dependency.)
- "At least one element" is why \`started\` exists — without it, an empty expression would spuriously match \`target = 0\`.`;

export const robotCoverageSolution = `## Approach

Sliding movement changes what a "state" is: the robot can only *decide* anything at rest positions, so search over rest positions, not cells. BFS from the start; expanding a rest position simulates the four slides, adding every cell passed through to the \`cleaned\` set and enqueueing only each slide's **endpoint** (if it's a new rest position). Plain flood fill is the classic wrong answer here — it ignores the physics and overcounts both sets.

\`\`\`js
function robotCoverage(grid, start) {
  const rows = grid.length;
  const cols = grid[0].length;
  const open = (r, c) =>
    r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] !== "#";
  const key = (r, c) => r * cols + c;

  const cleaned = new Set([key(start[0], start[1])]);
  const rests = new Set([key(start[0], start[1])]);
  const queue = [start];

  while (queue.length) {
    const [r, c] = queue.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nr = r;
      let nc = c;
      while (open(nr + dr, nc + dc)) {
        nr += dr;
        nc += dc;
        cleaned.add(key(nr, nc));
      }
      if ((nr !== r || nc !== c) && !rests.has(key(nr, nc))) {
        rests.add(key(nr, nc));
        queue.push([nr, nc]);
      }
    }
  }
  return [cleaned.size, rests.size];
}
\`\`\`

## Complexity

Each rest position expands once, and each expansion slides at most the grid's width or height: O(R·max(rows, cols)) for R rest positions, bounded by O(rows·cols·max(rows, cols)) and much smaller in practice. Space O(rows·cols) for the two sets.

## Worth saying out loud

- Cleaned and restable are *different* sets with different membership rules — cells flown through are cleaned but not branchable. The open 3×3 grid makes the distinction vivid: the center gets cleaned by a passing slide but can never be a rest cell, and nothing ever stops there.
- A slide of zero cells is not a move — without the \`(nr, nc) !== (r, c)\` guard you'd re-enqueue the current cell forever.
- Termination argument: rest positions are finite and each enqueues once (the \`rests\` set doubles as visited), so cycles like corridor ping-pong are free.`;

export const warehouseBoxesSolution = `## Approach

Two observations crack it. First, a room's *real* ceiling is the minimum of every ceiling on the way in — a box must pass all of them — so compute the prefix-min \`usable[i] = min(heights[0..i])\`, which is non-increasing by construction. Second, an exchange-argument greedy: sort the boxes ascending, walk the rooms deepest-first (most constrained first), and place the smallest unused box whenever it fits the room's usable ceiling.

\`\`\`js
function maxBoxes(heights, boxes) {
  const usable = heights.slice();
  for (let i = 1; i < usable.length; i++) {
    usable[i] = Math.min(usable[i], usable[i - 1]);
  }

  const sorted = boxes.slice().sort((a, b) => a - b);
  let next = 0; // smallest unused box
  let stored = 0;
  for (let i = usable.length - 1; i >= 0 && next < sorted.length; i--) {
    if (sorted[next] <= usable[i]) {
      stored++;
      next++;
    }
  }
  return stored;
}
\`\`\`

## Complexity

O(n + m log m) for n rooms and m boxes — the prefix-min pass, the sort, and one merged walk. O(n + m) space for the copies (or O(1) extra if you may overwrite inputs).

## Worth saying out loud

- The exchange argument, in one breath: if an optimal solution stores box b in the deepest usable room while a smaller box b′ sits shallower (or unused), swapping them stays legal — smaller boxes fit anywhere b fit and deeper rooms only have lower ceilings — so smallest-into-deepest never loses a box.
- Deepest-first matters because \`usable\` is non-increasing: burn your smallest boxes on the tightest rooms, save the big ceilings near the entrance for the big boxes.
- Boundary discipline: "equal heights pass" means every comparison is \`<=\`; and insertion order is a red herring the prompt grants you — pushing deeper boxes in first is always realizable, which is why pure counting works.`;

export const markAndCompactSolution = `## Approach

Garbage collection in miniature — two phases, exactly as named.

**Mark**: walk the implicit subtree from k with an explicit stack; the node at i has children at 2i+1 and 2i+2, and both out-of-range indices and null slots stop the walk (a null slot means no node, so nothing exists below it either). An invalid k marks nothing.

**Compact**: one left-to-right pass copies every surviving value — non-null and unmarked — to the front of a new array, recording \`old index → new index\` in the remap as it goes. Null slots are dropped by compaction regardless of the mark phase.

\`\`\`js
function markAndCompact(heapArray, k) {
  const marked = new Set();
  if (k >= 0 && k < heapArray.length && heapArray[k] !== null) {
    const stack = [k];
    while (stack.length) {
      const i = stack.pop();
      if (i >= heapArray.length || heapArray[i] === null) continue;
      marked.add(i);
      stack.push(2 * i + 1, 2 * i + 2);
    }
  }

  const newArray = [];
  const remap = {};
  for (let i = 0; i < heapArray.length; i++) {
    if (heapArray[i] === null || marked.has(i)) continue;
    remap[i] = newArray.length;
    newArray.push(heapArray[i]);
  }
  return [newArray, remap];
}
\`\`\`

## Complexity

O(n) time — the mark walk visits at most n indices once and compaction is a single pass — and O(n) space for the mark set, output, and remap.

## Worth saying out loud

- Why the remap must be returned is the design point, so voice it: compaction moves survivors, which breaks every index-based reference into the array (including the implicit parent/child arithmetic) — the remap is the patch table a real collector applies to the root set, exactly like the forwarding addresses in a compacting GC.
- Null slots prune the mark walk — index 2i+1 being null means the marked subtree simply doesn't extend there; marking "through" a hole would touch nodes that belong to other subtrees.
- Preserving original order (rather than heap-reordering survivors) is what makes the remap the *only* invalidation — a stable compaction is a one-pointer sweep, and stability is why order appears in the spec at all.`;
