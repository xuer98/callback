// Worked solutions for the Pinterest-tagged algorithm problems defined in
// seed-data.ts, referenced there as `solution:` fields. Split across three
// files (-a, -b, -c) to keep each under the repo's file-size guideline.
// Every fenced Python implementation is verified against the problem's own
// judge tests (via the Python driver contract in seed-python.ts) before
// shipping — the code shown to users is code that passes.

export const maxWidthSolution = `## Approach

Two separable jobs: **greedy packing** decides which words share a line, and **rendering** turns a packed line into exactly \`max_width\` characters.

Packing is provably greedy: keep appending words while they still fit with single spaces between them (\`letters + gaps + next word <= max_width\`, where \`gaps\` equals the current word count). Moving a word to the next line never helps a later line, so no lookahead is needed.

Rendering distributes \`spaces = max_width - letters\` across \`gaps = words - 1\` slots: every gap gets \`spaces // gaps\`, and the leftmost \`spaces % gaps\` gaps get one extra — that reproduces \`"example  of text"\`. A one-word line has no gaps, so all its spaces pad the right edge.

\`\`\`python
def justify(words, max_width):
    lines = []
    line = []
    letters = 0
    for word in words:
        # len(line) = spaces needed if word joins this line
        if line and letters + len(line) + len(word) > max_width:
            lines.append(render(line, letters, max_width))
            line = []
            letters = 0
        line.append(word)
        letters += len(word)
    if line:
        lines.append(render(line, letters, max_width))
    return lines


def render(line, letters, max_width):
    if len(line) == 1:
        return line[0].ljust(max_width)
    spaces = max_width - letters
    gaps = len(line) - 1
    base, extra = divmod(spaces, gaps)
    out = line[0]
    for g in range(gaps):
        out += " " * (base + (1 if g < extra else 0)) + line[g + 1]
    return out
\`\`\`

## Complexity

O(total characters) time — each word is placed once and each output character is written once. O(max_width) extra space beyond the output.

## Worth saying out loud

- The prompt's "excess spaces on the right-hand side" phrasing is about where the *leftover padding* visually accumulates; the worked example pins the actual rule — the leftmost gaps take the extra spaces. Restate the rule from the example before coding.
- This variant justifies every line the same way. The classic LeetCode 68 variant left-justifies the final line; the judge's cases don't distinguish the two, but an interviewer will expect you to ask.
- Off-by-one bait: the fits-check must count the space *before* the incoming word — \`letters + len(line) + len(word)\`, not \`+ len(line) - 1\`.`;

export const roundNumericStringsSolution = `## Approach

Floats are a trap the prompt sets on purpose — \`float("123456789123456789123456789.5")\` silently loses the digits that decide the answer. Stay in string land.

Split off the sign, then split on the dot. Only the **first fractional digit** matters under round-half-away-from-zero: the magnitude rounds up exactly when that digit is \`"5"\` or more (everything after it can only push further in the same direction). Rounding up is big-integer increment: walk the integer digits right to left turning \`9\`s into \`0\`s until a digit absorbs the carry, prepending \`"1"\` if none does. Reattach the sign only when the result isn't \`"0"\`.

\`\`\`python
def round_numeric_string(s):
    sign = ""
    if s and s[0] in "+-":
        sign = "-" if s[0] == "-" else ""
        s = s[1:]
    int_part, _, frac = s.partition(".")
    int_part = int_part.lstrip("0") or "0"
    if frac and frac[0] >= "5":
        int_part = add_one(int_part)
    return "0" if int_part == "0" else sign + int_part


def add_one(digits):
    out = list(digits)
    for i in range(len(out) - 1, -1, -1):
        if out[i] == "9":
            out[i] = "0"
        else:
            out[i] = str(int(out[i]) + 1)
            return "".join(out)
    return "1" + "".join(out)


def round_all(csv):
    if not csv:
        return ""
    return ",".join(round_numeric_string(v) for v in csv.split(","))
\`\`\`

## Complexity

O(n) per value — one pass to split, at worst one pass for the carry (\`"999…9.5"\` ripples the whole way). Part 2 is a split-map-join over the same routine.

## Worth saying out loud

- Rounding direction depends only on \`frac[0] >= "5"\` — comparing characters works because digits are ASCII-ordered. Summing or inspecting deeper fractional digits is wasted work and a float-thinking tell.
- Python's integers are arbitrary precision, so \`str(int(int_part) + 1)\` would do the carry in one line — say that, then do the digit walk anyway: the question is testing whether you can, since most languages can't.
- The \`"-0"\` rule falls out of ordering: normalize the magnitude first, attach the sign last.
- Normalize \`"007"\` before the carry, not after — \`add_one("007")\` walking into padding zeros still works, but returning \`"008"\` un-stripped does not.`;

export const violationLogSolution = `## Approach

Timestamps arrive in non-decreasing order, so per-user **append-only lists stay sorted for free** — no balanced tree needed. Keep three pieces of state: \`times\` (user → ascending timestamps), \`counts\` (user → all-time total), and \`latest\` (largest timestamp seen).

- \`count_recent\` binary-searches the user's list for the first timestamp strictly greater than \`latest - window\` — \`bisect_right\` counts the elements at or below the cutoff, and the half-open \`(T − W, T]\` convention means *strictly* greater survives.
- \`top_k\` sorts the count entries by count descending, name ascending — one composite key.
- \`should_ban\` is a classic two-pointer sweep over one user's history: for each right endpoint, advance \`left\` while \`times[left] <= times[right] - window\` (a span *equal* to the window falls outside it), then check the window's size.

\`\`\`python
from bisect import bisect_right


class ViolationLog:
    def __init__(self):
        self.times = {}   # user -> ascending timestamps
        self.counts = {}  # user -> all-time count
        self.latest = float("-inf")

    def record(self, timestamp, user_id, violation_type):
        self.times.setdefault(user_id, []).append(timestamp)
        self.counts[user_id] = self.counts.get(user_id, 0) + 1
        self.latest = timestamp

    def count_recent(self, user_id, window):
        times = self.times.get(user_id, [])
        return len(times) - bisect_right(times, self.latest - window)

    def top_k(self, k):
        ranked = sorted(self.counts.items(), key=lambda e: (-e[1], e[0]))
        return ranked[:k]

    def should_ban(self, user_id, max_violations, window):
        times = self.times.get(user_id, [])
        left = 0
        for right in range(len(times)):
            while times[left] <= times[right] - window:
                left += 1
            if right - left + 1 >= max_violations:
                return True
        return False
\`\`\`

## Complexity

\`record\` O(1) amortized. \`count_recent\` O(log m) for the user's m events. \`should_ban\` O(m) — each pointer moves forward only. \`top_k\` O(u log u) over u users; say the heap (O(u log k)) or count-bucketing upgrade rather than hand-waving it.

## Worth saying out loud

- The boundary convention is where these interviews are lost: \`(T − W, T]\` means events at \`t = 0\` and \`t = 10\` do **not** share a 10-second window. Both queries above encode it as a strict comparison; write the two events down and test the edge before submitting.
- \`should_ban\` scans history, but the two pointers make it linear, not quadratic — every index enters and leaves the window once.
- In a real system you'd bound memory: count_recent-style queries only need a deque pruned below \`latest − max_window\`, but \`should_ban\`'s any-window-ever semantics need either full history or a per-user running flag updated at record time. Flagging that tension is senior signal.`;

export const nestedSetEqualitySolution = `## Approach

Two sets are equal when they have the same canonical form, so **canonicalize bottom-up** into a value that erases order and duplicates at every depth. Python hands you the perfect one: \`frozenset\` — unordered, deduplicating, hashable (so sets can contain sets), and compared structurally. An integer stays itself; a list becomes the frozenset of its children's canonical forms. Equality is then one \`==\`.

\`\`\`python
def nested_set_equal(a, b):
    return freeze(a) == freeze(b)


def freeze(value):
    if not isinstance(value, list):
        return value
    return frozenset(freeze(child) for child in value)
\`\`\`

Recursion depth equals nesting depth; an explicit stack is the answer to "what if it's 100,000 levels deep?".

## Complexity

O(n) expected time for total input size n — every element is frozen once, and frozenset construction hashes each child once. Space O(n) for the frozen structure. (In a language without hashable sets, canonicalize to strings instead — sort deduped child forms and wrap in braces — paying an extra O(n log n) per level.)

## Worth saying out loud

- Dedup must happen on **canonical** children, not raw ones — \`[[1, 2], [2, 1]]\` contains one set, not two, and only the canonical forms reveal it. Freezing bottom-up gets this for free; deduping raw lists doesn't.
- \`[[]]\` vs \`[]\` is the classic probe: \`frozenset({frozenset()})\` vs \`frozenset()\` differ without any special-casing. If your design needs an if-statement for it, the representation is wrong.
- Why not compare recursively without canonicalizing? Matching children across two unordered collections is a bipartite-matching headache; canonical forms reduce it to hashing. Cheaper and easier to prove correct.
- One Python subtlety worth voicing: \`True == 1\` inside sets, so mixed bool/int inputs would collide — the prompt's integers-only guarantee is what makes \`frozenset\` safe as-is.`;

export const assignPinsSolution = `## Approach

Simulate exactly what the layout engine does: every pin goes to the currently shortest column, leftmost on ties. A min-heap of \`(height, column)\` pairs makes each placement O(log k) — and because tuples compare element-wise, equal heights fall back to the smaller column index, which *is* the leftmost-on-ties rule. No custom comparator, no special-casing.

\`\`\`python
import heapq


def assign_pins(heights, k):
    heap = [(0, c) for c in range(k)]  # (height, column)
    heapq.heapify(heap)
    out = []
    for height in heights:
        total, col = heapq.heappop(heap)
        out.append(col)
        heapq.heappush(heap, (total + height, col))
    return out
\`\`\`

## Complexity

O(n log k) time for n pins, O(k) space. The alternative — scan all k columns per pin with a strict \`<\` so the leftmost minimum wins — is O(n·k), and honestly fine for a feed's real k (a handful of columns); the heap is what you reach for when k grows.

## Worth saying out loud

- This greedy is the actual masonry algorithm, not an approximation of one — the problem *defines* placement as shortest-column-wins, so there is nothing to optimize, only to simulate faithfully.
- The tuple trick deserves a sentence in the interview: ordering by \`(height, column)\` encodes the tie-break in the data instead of in branching code, which is why the heap version stays five lines.
- The follow-up an interviewer wants: this layout is deterministic given \`(heights, k)\`, which is why the server can precompute column assignments per device width and why resizing (k changes) reflows every pin.
- If asked to *minimize the tallest column* instead (offline version), that's a different problem — NP-hard partitioning, greedy-by-decreasing-height as the standard heuristic. Recognizing the switch is the point of the follow-up.`;

export const collectReachablePinsSolution = `## Approach

The tempting graph — an edge between every two boards sharing a pin — blows up: a pin saved to 10,000 boards contributes ~50M edges. Traverse the **bipartite** graph instead: from a board, visit its pins; from each newly seen pin, visit the boards that carry it (via an inverted pin → boards index built in one pass).

Mark pins *and* boards visited. The visited-pin set is the load-bearing one: a popular pin gets expanded once, no matter how many boards it sits on.

\`\`\`python
def collect_reachable_pins(boards, start):
    if start not in boards:
        return []
    boards_of_pin = {}
    for board, pins in boards.items():
        for pin in pins:
            boards_of_pin.setdefault(pin, []).append(board)

    seen_boards = {start}
    seen_pins = set()
    stack = [start]
    while stack:
        board = stack.pop()
        for pin in boards[board]:
            if pin in seen_pins:
                continue
            seen_pins.add(pin)
            for nxt in boards_of_pin[pin]:
                if nxt not in seen_boards:
                    seen_boards.add(nxt)
                    stack.append(nxt)
    return sorted(seen_pins)
\`\`\`

## Complexity

Building the index and traversing both cost O(E) where E is the total number of (board, pin) memberships — every membership edge is crossed a constant number of times. The sort adds O(P log P) over the reachable pins. Space O(E) for the index.

## Worth saying out loud

- Say the counting argument, not just "BFS": *without* the visited-pin set the traversal is still correct but re-walks a hub pin's board list on every arrival — quadratic on exactly the graphs Pinterest has.
- DFS vs BFS is irrelevant here (any traversal collects the component); what matters is traversing the bipartite structure instead of materializing board–board edges.
- Production framing: this is a connected-component query, and at Pinterest scale you'd precompute components (union–find over memberships) rather than traverse per query — offer that when asked "what if this runs per request?".`;
