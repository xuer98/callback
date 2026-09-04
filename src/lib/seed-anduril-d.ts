import type { Problem } from "./types";

// Anduril phone-screen bank, part D: the no-built-ins string question (with
// the reported "Encode String" / "Digit Encoder" RLE variants) and the
// drone-zone OOD class.

export const andurilProblemsD: Problem[] = [
  {
    slug: "replace-without-builtins",
    title: "Replace Without Built-ins",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary:
      "Two-pointer scans with no library calls — the point is proving you can.",
    prompt: `Given a string like \`"amaaba"\`, replace **every occurrence** of \`"aa"\` with another string — **without using built-in string methods** (no \`replace\`, \`find\`, \`split\`).

\`\`\`
replace_all("amaaba", "aa", "x")   ->  "amxba"
replace_all("aaa",    "aa", "x")   ->  "xa"      (non-overlapping, left to right)
\`\`\`

## Phase 2 — Encode String / Digit Encoder

Run-length encode a string, and decode it back (counts can be multi-digit):

\`\`\`
encode("aaabcc")   ->  "a3b1c2"
decode("a3b1c12")  ->  "aaab" + "c" * 12
\`\`\`

## Phase 3

Compress **in place**: given a list of characters, rewrite it as char + count (count omitted when 1) and return the new length, using O(1) extra space.

## Worth asking out loud

Overlapping matches (\`"aaa"\` against \`"aa"\` — one replacement or two)? Empty pattern? Case sensitivity? Multi-digit counts? Can the source contain digits (RLE then needs an escape scheme)?`,
    hints: [
      "Outer pointer walks the text; at each position, an inner pointer checks the pattern character by character. On a full match, emit the replacement and jump the pattern's length; otherwise emit one character and step once.",
      "RLE both ways is the same two-pointer scan: find the run's end (or the number's end), emit, jump. In-place compression is a read pointer and a write pointer over the same list — write never overtakes read.",
    ],
    solution: `## Approach

All three phases are the same discipline: an index-walking scan with explicit pointers, building output as you go. The interviewer has banned the standard library precisely to watch loop hygiene — off-by-ones at the boundary, the jump after a match, and the final partial run.

\`\`\`python
from typing import List

def replace_all(s: str, old: str, new: str) -> str:
    """non-overlapping, left-to-right; no str.replace / find / split"""
    if not old:
        return s
    out, i, n, m = [], 0, len(s), len(old)
    while i < n:
        j = 0
        while j < m and i + j < n and s[i + j] == old[j]:
            j += 1
        if j == m:
            out.append(new)
            i += m
        else:
            out.append(s[i])
            i += 1
    return ''.join(out)                     # if even join is banned: build a list and index

def rle_encode(s: str) -> str:              # 'aaabcc' -> 'a3b1c2'
    out, i = [], 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        out.append(f"{s[i]}{j - i}")
        i = j
    return ''.join(out)

def rle_decode(s: str) -> str:              # 'a3b1c12' -> 'aaab' + 'c'*12
    out, i = [], 0
    while i < len(s):
        ch, i = s[i], i + 1
        j = i
        while j < len(s) and s[j].isdigit():
            j += 1
        out.append(ch * int(s[i:j]))
        i = j
    return ''.join(out)

def compress_inplace(chars: List[str]) -> int:   # O(1) extra space
    write = read = 0
    while read < len(chars):
        ch, start = chars[read], read
        while read < len(chars) and chars[read] == ch:
            read += 1
        chars[write] = ch
        write += 1
        if read - start > 1:
            for d in str(read - start):
                chars[write] = d
                write += 1
    return write
\`\`\`

The reported **"File Validation"** title is the same family: a stack for bracket balance, or a line-oriented state machine (header → records → footer) that reports *which line* failed and *why*.

\`\`\`python
def valid_brackets(s: str) -> bool:
    pairs, stack = {')': '(', ']': '[', '}': '{'}, []
    for ch in s:
        if ch in pairs.values():
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack
\`\`\`

## Complexity

All O(n); \`replace_all\` is O(n·m) worst case — mention KMP for O(n + m) and move on rather than writing it.

## Worth saying out loud

- State the overlap rule before coding — \`"aaa"\` → \`"xa"\` under non-overlapping left-to-right is the case the interviewer will test.
- Edge cases to volunteer: pattern longer than the text, a match ending exactly at the last character, digits in the RLE source (needs an escape scheme — ask).
- The in-place version's invariant — the write pointer never passes the read pointer — is worth one spoken sentence; it's why counts of 1 dropping a digit is safe.`,
  },
  {
    slug: "drone-zone-sensor",
    title: "Drone Zone Sensor",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary:
      "Injected transport, upserts keyed by id, a dirty set — a small class with senior signals.",
    prompt: `A drone senses objects in a zone and reports that data. **Create a class with two methods**: one to retrieve the data, one to send it to an external source.

That's the entire reported prompt — the underspecification is the test. Decide (out loud) what the data looks like, what "external source" means, and what each method guarantees.

## Worth asking out loud

Is an object re-detected an update or a new record? Retrieve per zone or everything? What does the external source look like — can I inject it? Should \`send\` clear what it sent, or resend everything each time?`,
    hints: [
      "A hashmap of hashmaps — zone → object id → latest detection — makes re-detections upserts instead of duplicates. That single choice answers half the follow-ups.",
      "Take the transport as a constructor argument (anything with a send method) and track which zones changed since the last send — injected dependency and incremental sends are the two senior signals in a five-minute class.",
    ],
    solution: `## Approach

The reported answer is "hashmap", but what separates seniors is the shape around it: detections keyed by object id so a re-detection is an upsert; the transport injected rather than hard-coded (testable with a fake); and a dirty set so \`send\` ships only zones that changed. The class stays small enough for a phone screen while leaving hooks for every follow-up.

\`\`\`python
from collections import defaultdict
from typing import Dict, List, Optional

class DroneZoneSensor:
    def __init__(self, transport):                      # anything with .send(payload)
        self._zones: Dict[str, Dict[str, dict]] = defaultdict(dict)   # zone -> id -> detection
        self._transport = transport
        self._dirty: set = set()                        # zones changed since last send

    def sense(self, zone: str, object_id: str, **attrs) -> None:
        self._zones[zone][object_id] = {"id": object_id, **attrs}     # upsert
        self._dirty.add(zone)

    def retrieve(self, zone: str) -> List[dict]:
        return list(self._zones.get(zone, {}).values())

    def send(self, zone: Optional[str] = None) -> int:
        zones = [zone] if zone else sorted(self._dirty)
        for z in zones:
            self._transport.send({"zone": z, "objects": self.retrieve(z)})
            self._dirty.discard(z)
        return len(zones)
\`\`\`

## Complexity

\`sense\` and \`retrieve\` are O(1) map operations (retrieve copies one zone's values); \`send\` is O(objects in dirty zones). Space is O(total tracked objects).

## Worth saying out loud

- Dependency-inject the transport and you can unit-test with a fake that records payloads — say "testable" explicitly.
- Upserting by object id is a de-duplication decision; name the alternative (append-only detection log) and why you didn't pick it.
- Failure handling is the real follow-up: transport down → buffer and retry with backoff, and decide at-least-once vs exactly-once delivery (idempotent upserts on the receiver make at-least-once safe).
- Two producer threads → a lock around the maps or a queue per producer; single-threaded until stated otherwise, but say the assumption.`,
  },
];
