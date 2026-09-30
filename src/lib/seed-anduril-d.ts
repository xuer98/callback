import type { Problem } from "./types";

// Anduril bank, part D: string scans without built-ins (replace-all, a
// run-length codec, in-place compression) and the drone-zone OOD class.

export const andurilProblemsD: Problem[] = [
  {
    slug: "replace-without-builtins",
    title: "Replace Without Built-ins",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary:
      "Two-pointer scans with no library calls — the point is proving you can.",
    prompt: `Given a string like \`"amaaba"\`, replace **every occurrence** of a pattern such as \`"aa"\` with another string — **without using built-in string methods** (no \`replace\`, \`find\`/\`indexOf\`, \`split\`).

\`\`\`
replace_all("amaaba", "aa", "x")   ->  "amxba"
replace_all("aaa",    "aa", "x")   ->  "xa"      (non-overlapping, left to right)
\`\`\`

Matches are non-overlapping and found left to right, and an empty pattern leaves the string unchanged.`,
    hints: [
      "Outer pointer walks the text; at each position, an inner pointer checks the pattern character by character.",
      "On a full match, emit the replacement and jump the pattern's length; otherwise emit one character and step once.",
    ],
    solution: `## Approach

An index-walking scan with explicit pointers, building output as you go. With the standard library off the table, what matters is loop hygiene — off-by-ones at the boundary, the jump after a match, and the case where the pattern runs past the end of the text.

\`\`\`python
def replace_all(s, old, new):
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
\`\`\`

## Complexity

O(n·m) worst case — mention KMP for O(n + m) and move on rather than writing it.

## Worth saying out loud

- State the overlap rule before coding — \`"aaa"\` → \`"xa"\` under non-overlapping left-to-right.
- Edge cases to volunteer: pattern longer than the text, a match ending exactly at the last character, an empty pattern.`,
    judge: {
      starterCode: `/**
 * Replace every non-overlapping, left-to-right occurrence of pattern with
 * replacement — no String.prototype helpers (no replace/indexOf/split).
 * @param {string} s
 * @param {string} pattern
 * @param {string} replacement
 * @returns {string}
 */
function replaceAll(s, pattern, replacement) {
  // Your code here
  return s;
}
`,
      entry: "replaceAll",
      tests: [
        { name: "Prompt example", input: ["amaaba", "aa", "x"], expected: "amxba" },
        { name: "Non-overlapping, left to right", input: ["aaa", "aa", "x"], expected: "xa" },
        { name: "Match at the very end", input: ["baa", "aa", "yz"], expected: "byz" },
        { name: "Pattern longer than the text", input: ["aa", "aaa", "x"], expected: "aa" },
        { name: "Empty pattern changes nothing", input: ["abc", "", "x"], expected: "abc" },
        { name: "Replacement contains the pattern", input: ["abab", "ab", "abab"], expected: "abababab" },
      ],
    },
  },
  {
    slug: "run-length-encode-decode",
    title: "Run-Length Encode and Decode",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary: "Find the end of each run (or each number), emit, jump.",
    prompt: `Run-length encode a string as each character followed by the length of its run, and decode such a string back. Counts can be more than one digit.

\`\`\`
encode("aaabcc")   ->  "a3b1c2"
decode("a3b1c12")  ->  "aaab" + "c" * 12
\`\`\`

Source strings contain letters only, so every digit in an encoded string belongs to a count.`,
    hints: [
      "Encoding: from each position, walk forward while the character repeats; emit the character and the run length, then jump to the end of the run.",
      "Decoding: read one character, then every digit after it as the count — counts can be longer than one digit.",
    ],
    solution: `## Approach

Both directions are the same two-pointer scan: find where the current run (or number) ends, emit, and jump there.

\`\`\`python
def rle_encode(s):              # 'aaabcc' -> 'a3b1c2'
    out, i = [], 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        out.append(f"{s[i]}{j - i}")
        i = j
    return ''.join(out)


def rle_decode(s):              # 'a3b1c12' -> 'aaab' + 'c'*12
    out, i = [], 0
    while i < len(s):
        ch, i = s[i], i + 1
        j = i
        while j < len(s) and s[j].isdigit():
            j += 1
        out.append(ch * int(s[i:j]))
        i = j
    return ''.join(out)
\`\`\`

O(n) for encoding, O(output) for decoding.

## Worth saying out loud

- Multi-digit counts are why decoding reads digits until the next non-digit instead of taking one character.
- If the source could contain digits, "a12" would be ambiguous — an escape scheme or a fixed-width count is needed.
- Always writing the count (even 1) keeps decoding unambiguous; dropping 1s saves space but only works when the source has no digits.`,
    judge: {
      starterCode: `/**
 * "aaabcc" -> "a3b1c2"
 * @param {string} s
 * @returns {string}
 */
function rleEncode(s) {
  // Your code here
  return "";
}

/**
 * "a3b1c12" -> "aaab" followed by twelve c's (counts can be multi-digit).
 * @param {string} s
 * @returns {string}
 */
function rleDecode(s) {
  // Your code here
  return "";
}
`,
      entry: "__judgeRle",
      driverCode: `function __judgeRle(direction, s) {
  return direction === "encode" ? rleEncode(s) : rleDecode(s);
}`,
      tests: [
        { name: "Encode runs", input: ["encode", "aaabcc"], expected: "a3b1c2" },
        { name: "Encode single characters", input: ["encode", "abc"], expected: "a1b1c1" },
        { name: "Encode an empty string", input: ["encode", ""], expected: "" },
        { name: "Encode a long run", input: ["encode", "zzzzzzzzzzzzz"], expected: "z13" },
        { name: "Decode multi-digit counts", input: ["decode", "a3b1c12"], expected: "aaabcccccccccccc" },
        { name: "Decode an empty string", input: ["decode", ""], expected: "" },
      ],
    },
  },
  {
    slug: "string-compression-in-place",
    title: "String Compression in Place",
    category: "algorithms",
    difficulty: "medium",
    companies: ["anduril"],
    summary: "A read pointer and a write pointer over the same array — write never passes read.",
    prompt: `Given a list of characters, compress it **in place**: each run becomes the character followed by the digits of its length, with the length omitted when the run is a single character. Return the new length; the first that many entries of the list hold the result. Use O(1) extra space.

\`\`\`
["a","a","b","b","b","c"]   ->  5, list starts ["a","2","b","3","c"]
["z"] * 12                  ->  3, list starts ["z","1","2"]
\`\`\``,
    hints: [
      "Keep a read pointer that finds the end of each run and a write pointer where the compressed output goes.",
      "The compressed form of a run is never longer than the run itself, so the write pointer can never overtake the read pointer.",
    ],
    solution: `## Approach

Two pointers over the same list. \`read\` finds the end of each run; \`write\` lays down the character and, for runs longer than one, the digits of the length. A run of k characters compresses to at most k entries, so writing never clobbers input that hasn't been read yet.

\`\`\`python
def compress_inplace(chars):
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

O(n) time, O(1) extra space (the digits of one count aside).

## Worth saying out loud

- The invariant — the write pointer never passes the read pointer — is worth one spoken sentence; it's why dropping the count for single characters is safe.
- A count of 12 is two entries, "1" and "2"; converting it with \`str\` is fine, or peel digits off with division and reverse them.`,
    judge: {
      starterCode: `/**
 * Rewrite chars in place as char + count (count omitted when 1), using O(1)
 * extra space. Return the new length.
 * @param {string[]} chars
 * @returns {number}
 */
function compressInPlace(chars) {
  // Your code here
  return chars.length;
}
`,
      entry: "__judgeCompress",
      driverCode: `function __judgeCompress(input) {
  const chars = [...input];
  const n = compressInPlace(chars);
  return [n, chars.slice(0, n)];
}`,
      tests: [
        { name: "Compress in place", input: [["a", "a", "b", "b", "b", "c"]], expected: [5, ["a", "2", "b", "3", "c"]] },
        {
          name: "Compress a long run",
          input: [["z", "z", "z", "z", "z", "z", "z", "z", "z", "z", "z", "z"]],
          expected: [3, ["z", "1", "2"]],
        },
        { name: "Nothing repeats", input: [["a", "b", "c"]], expected: [3, ["a", "b", "c"]] },
        { name: "One character", input: [["q"]], expected: [1, ["q"]] },
        { name: "Runs come back", input: [["a", "a", "b", "a", "a"]], expected: [5, ["a", "2", "b", "a", "2"]] },
      ],
    },
  },
  {
    slug: "drone-zone-sensor",
    title: "Drone Zone Sensor",
    category: "algorithms",
    difficulty: "easy",
    companies: ["anduril"],
    summary:
      "Injected transport, upserts keyed by id, a dirty set — a small class with senior signals.",
    prompt: `A drone senses objects in zones and reports that data to an external system. Build a \`DroneZoneSensor\` class:

\`\`\`
DroneZoneSensor(transport)     transport is anything with a send(payload) method
sense(zone, objectId, attrs)   record a detection; detecting the same object in
                               the zone again replaces the earlier record
retrieve(zone)                 every detection in the zone, each {id, ...attrs};
                               an unknown zone is empty
send(zone?)                    send every zone changed since the last send — or
                               just zone when given — as transport.send({zone, objects});
                               return the number of zones sent
\`\`\`

A zone that hasn't changed since it was last sent isn't sent again.`,
    hints: [
      "A hashmap of hashmaps — zone → object id → latest detection — makes re-detections upserts instead of duplicates. That single choice answers half the follow-ups.",
      "Take the transport as a constructor argument (anything with a send method) and track which zones changed since the last send — injected dependency and incremental sends are the two senior signals in a five-minute class.",
    ],
    solution: `## Approach

A hashmap is the core, but the shape around it is what matters: detections keyed by object id so a re-detection is an upsert; the transport injected rather than hard-coded (testable with a fake); and a dirty set so \`send\` ships only zones that changed. The class stays small enough to write in a few minutes while leaving hooks for every extension.

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
    judge: {
      starterCode: `class DroneZoneSensor {
  /** @param transport anything with a send(payload) method */
  constructor(transport) {
    // Your state here
  }

  /** Record (or update) one detected object in a zone; attrs is a plain object. */
  sense(zone, objectId, attrs) {
    // Your code here
  }

  /** @returns {object[]} every detection in the zone, each shaped {id, ...attrs} */
  retrieve(zone) {
    return [];
  }

  /**
   * Send every zone changed since the last send — or just \`zone\` when given —
   * as transport.send({zone, objects}). @returns {number} zones sent
   */
  send(zone = null) {
    return 0;
  }
}
`,
      entry: "__runOperations",
      // The judge injects a transport that records payloads; "log" returns
      // them. Object lists are sorted by id so storage order never matters.
      driverCode: `function __runOperations(operations, args) {
  const log = [];
  const transport = { send: (payload) => log.push(payload) };
  const byId = (list) => [...list].sort((x, y) => String(x.id).localeCompare(String(y.id)));
  let drone = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const a = args[i];
    if (op === "DroneZoneSensor") {
      drone = new DroneZoneSensor(transport);
      out.push(null);
    } else if (op === "sense") {
      drone.sense(a[0], a[1], a[2]);
      out.push(null);
    } else if (op === "retrieve") {
      out.push(byId(drone.retrieve(a[0])));
    } else if (op === "send") {
      out.push(drone.send(a[0] ?? null));
    } else {
      out.push(log.map((p) => ({ zone: p.zone, objects: byId(p.objects) })));
    }
  }
  return out;
}`,
      tests: [
        {
          name: "A re-detection is an update, not a duplicate",
          input: [
            ["DroneZoneSensor", "sense", "sense", "retrieve"],
            [[], ["z1", "obj1", { kind: "truck" }], ["z1", "obj1", { kind: "tank" }], ["z1"]],
          ],
          expected: [null, null, null, [{ id: "obj1", kind: "tank" }]],
        },
        {
          name: "Unknown zone is empty",
          input: [["DroneZoneSensor", "retrieve"], [[], ["nowhere"]]],
          expected: [null, []],
        },
        {
          name: "Send ships only changed zones, once",
          input: [
            ["DroneZoneSensor", "sense", "sense", "send", "send", "log"],
            [[], ["z1", "a", { kind: "x" }], ["z2", "b", { kind: "y" }], [null], [null], []],
          ],
          expected: [
            null, null, null, 2, 0,
            [
              { zone: "z1", objects: [{ id: "a", kind: "x" }] },
              { zone: "z2", objects: [{ id: "b", kind: "y" }] },
            ],
          ],
        },
        {
          name: "A new detection re-dirties its zone",
          input: [
            ["DroneZoneSensor", "sense", "send", "sense", "send", "log"],
            [[], ["z1", "a", { kind: "x" }], [null], ["z1", "c", { kind: "w" }], [null], []],
          ],
          expected: [
            null, null, 1, null, 1,
            [
              { zone: "z1", objects: [{ id: "a", kind: "x" }] },
              { zone: "z1", objects: [{ id: "a", kind: "x" }, { id: "c", kind: "w" }] },
            ],
          ],
        },
        {
          name: "Send one zone explicitly",
          input: [
            ["DroneZoneSensor", "sense", "sense", "send", "log"],
            [[], ["z1", "a", { kind: "x" }], ["z2", "b", { kind: "y" }], ["z2"], []],
          ],
          expected: [null, null, null, 1, [{ zone: "z2", objects: [{ id: "b", kind: "y" }] }]],
        },
        {
          name: "Retrieve returns every detection in the zone",
          input: [
            ["DroneZoneSensor", "sense", "sense", "retrieve"],
            [[], ["z", "q", { kind: "radar" }], ["z", "b", { kind: "bird" }], ["z"]],
          ],
          expected: [null, null, null, [{ id: "b", kind: "bird" }, { id: "q", kind: "radar" }]],
        },
      ],
    },
  },
];
