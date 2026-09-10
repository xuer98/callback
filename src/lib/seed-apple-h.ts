import type { Problem } from "./types";

// Apple phone-screen bank, part H: Implement MapReduce and the hotel booking
// system. Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsH: Problem[] = [
  {
    slug: "implement-mapreduce",
    title: "Implement MapReduce",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Map, combine, partition, sort, reduce — the three parts a groupby does not have are the whole grade.",
    prompt: [
      "> \"Implement MapReduce using Python or other language of choice.\"",
      "",
      "Reported as the first technical round for an Apple Data Engineer, over Zoom with a team member. Build a single-machine model of the real thing, with the parts named explicitly:",
      "",
      "```",
      "mapReduce(records, mapper, reducer, combiner, partition, numReducers, chunkSize)",
      "  ->  { results: { key: reducedValue }, reducers: [[keys of reducer 0, sorted], [reducer 1], ...] }",
      "```",
      "",
      "- **Map tasks:** records are processed in chunks of `chunkSize` records; each chunk is one map task. `mapper(record)` returns a list of `[key, value]` pairs.",
      "- **Combiner:** when `combiner` is given, run it once per chunk — group that chunk's pairs by key and replace them with `[key, combiner(key, values)]` — before anything is shuffled. When it is `null`, pairs are shuffled as emitted.",
      "- **Partitioner:** every pair goes to reducer `partition(key) % numReducers`.",
      "- **Sort within each partition:** each reducer handles its keys in ascending order, and `reducers[i]` reports them in that order.",
      "- **Reduce:** `reducer(key, values)` produces `results[key]`.",
      "",
      "```",
      "records [\"a b a\", \"b c\", \"a\"], word-count job, numReducers 2, chunkSize 2, with a combiner:",
      "  chunk 1 emits a:1 b:1 a:1 b:1 c:1  ->  combined a:2 b:2 c:1",
      "  chunk 2 emits a:1",
      "  reducer for \"a\" sees [2, 1]  ->  results { a: 3, b: 2, c: 1 }",
      "```",
      "",
      "The harness supplies jobs (word count, max word length by first letter, mean by group) and a partitioner, wraps your reducer to record how many values it received per key, and reports `{ results, reducers, reducerInputs }`.",
      "",
      "## Worth asking out loud",
      "",
      "When is a combiner safe — must the reducer be commutative and associative? How are keys partitioned, and what happens with a hot key? Should map tasks be independent so a failed one can re-run? Is the sort within a partition part of the contract?",
    ].join("\n"),
    hints: [
      "Keep one map-of-lists per reducer. For each chunk: run the mapper over its records, optionally fold the chunk's pairs through the combiner grouped by key, then append each value to partitions[partition(key) % numReducers][key].",
      "Finish by walking each partition's keys in sorted order and calling the reducer once per key. The combiner changes how many values the reducer sees, not the answer — which is exactly why it is only legal for reducers like sum and max.",
    ],
    solution: [
      "## Approach",
      "",
      "The gap between a pass and a distinction is naming the three parts a groupby does not have: the **combiner** (a map-side pre-aggregation that cuts shuffle volume), the **partitioner** (`partition(key) % R`, which decides which reducer sees which key), and the **sort** within each partition. Write those explicitly even though a dictionary would be shorter. The reference walks the records in chunks, folds each chunk through the combiner when one is supplied, routes every pair into a per-reducer map of value lists, and finally reduces each partition's keys in sorted order.",
      "",
      "## Complexity",
      "",
      "O(records · emissions) time; O(distinct keys) space per reducer, plus one chunk's pairs at a time.",
      "",
      "## Worth saying out loud",
      "",
      "- **When can you not use a combiner?** When the reducer is not commutative and associative. Sum and max are fine; a mean or an exact distinct count is not — the harness's mean job runs without one for that reason.",
      "- **Skew?** One hot key sends everything to one reducer. Salt the key with a random suffix, aggregate, then strip the salt and aggregate again.",
      "- **How is Spark different?** A DAG of stages held in memory rather than one map-then-reduce written to disk between phases, so iterative work is not re-reading HDFS every pass.",
      "- **Failures?** Tasks must be deterministic and idempotent so a re-run of one lost task is safe; speculative execution depends on exactly that property.",
    ].join("\n"),
    judge: {
      solutionCode: `// map -> (combine per chunk) -> partition by partition(key) % R -> sort within partition -> reduce
function mapReduce(records, mapper, reducer, combiner, partition, numReducers, chunkSize) {
  const partitions = Array.from({ length: numReducers }, () => new Map());
  for (let start = 0; start < records.length; start += chunkSize) {
    let pairs = [];
    for (const record of records.slice(start, start + chunkSize)) pairs.push(...mapper(record));
    if (combiner) {
      const grouped = new Map();
      for (const [key, value] of pairs) {
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(value);
      }
      pairs = [...grouped].map(([key, values]) => [key, combiner(key, values)]);
    }
    for (const [key, value] of pairs) {
      const target = partitions[partition(key) % numReducers];
      if (!target.has(key)) target.set(key, []);
      target.get(key).push(value);
    }
  }
  const results = {};
  const reducers = [];
  for (const part of partitions) {
    const keys = [...part.keys()].sort();
    reducers.push(keys);
    for (const key of keys) results[key] = reducer(key, part.get(key));
  }
  return { results, reducers };
}
`,
      starterCode: `/**
 * @param {Array} records processed in chunks of chunkSize (one map task each)
 * @param {(record) => [string, *][]} mapper
 * @param {(key: string, values: *[]) => *} reducer
 * @param {((key: string, values: *[]) => *) | null} combiner run once per chunk when given
 * @param {(key: string) => number} partition reducer index before the modulo
 * @param {number} numReducers
 * @param {number} chunkSize
 * @returns {{ results: Record<string, *>, reducers: string[][] }} reducers[i] = its keys, sorted
 */
function mapReduce(records, mapper, reducer, combiner, partition, numReducers, chunkSize) {
  // Your code here
  return { results: {}, reducers: [] };
}
`,
      entry: "__runJob",
      driverCode: `function __runJob(job, records, numReducers, chunkSize, useCombiner) {
  const words = (line) => line.split(/\\s+/).filter(Boolean);
  const sum = (key, values) => values.reduce((a, b) => a + b, 0);
  const max = (key, values) => Math.max(...values);
  const jobs = {
    wordcount: { mapper: (line) => words(line).map((w) => [w, 1]), reduce: sum, combine: sum },
    maxlen: { mapper: (line) => words(line).map((w) => [w[0], w.length]), reduce: max, combine: max },
    mean: {
      mapper: (record) => [[record[0], record[1]]],
      reduce: (key, values) => Math.round((sum(key, values) / values.length) * 1e6) / 1e6,
      combine: null, // a mean is not combinable
    },
  };
  const spec = jobs[job];
  const reducerInputs = {};
  const reducer = (key, values) => {
    reducerInputs[key] = values.length;
    return spec.reduce(key, values);
  };
  const partition = (key) => key.charCodeAt(0);
  const out = mapReduce(records, spec.mapper, reducer, useCombiner ? spec.combine : null, partition, numReducers, chunkSize);
  return { results: out.results, reducers: out.reducers, reducerInputs };
}`,
      tests: [
        {
          name: "Word count with a combiner: the reducer sees one value per chunk",
          input: ["wordcount", ["a b a", "b c", "a"], 2, 2, true],
          expected: { results: { a: 3, b: 2, c: 1 }, reducers: [["b"], ["a", "c"]], reducerInputs: { a: 2, b: 1, c: 1 } },
        },
        {
          name: "Word count without a combiner: every emission reaches the reducer",
          input: ["wordcount", ["a b a", "b c", "a"], 2, 2, false],
          expected: { results: { a: 3, b: 2, c: 1 }, reducers: [["b"], ["a", "c"]], reducerInputs: { a: 3, b: 2, c: 1 } },
        },
        {
          name: "Max length by first letter, one record per chunk",
          input: ["maxlen", ["apple avocado", "banana", "apricot"], 3, 1, true],
          expected: { results: { a: 7, b: 6 }, reducers: [[], ["a"], ["b"]], reducerInputs: { a: 2, b: 1 } },
        },
        {
          name: "Mean by group runs without a combiner",
          input: ["mean", [["x", 1], ["x", 2], ["y", 10]], 1, 2, false],
          expected: { results: { x: 1.5, y: 10 }, reducers: [["x", "y"]], reducerInputs: { x: 2, y: 1 } },
        },
        {
          name: "No records",
          input: ["wordcount", [], 2, 3, true],
          expected: { results: {}, reducers: [[], []], reducerInputs: {} },
        },
        {
          name: "One chunk larger than the input",
          input: ["wordcount", ["a a a", "a"], 1, 10, true],
          expected: { results: { a: 4 }, reducers: [["a"]], reducerInputs: { a: 1 } },
        },
        {
          name: "Keys sort within each partition",
          input: ["wordcount", ["dog cat bird ant", "cat"], 2, 5, true],
          expected: {
            results: { ant: 1, bird: 1, cat: 2, dog: 1 },
            reducers: [["bird", "dog"], ["ant", "cat"]],
            reducerInputs: { ant: 1, bird: 1, cat: 1, dog: 1 },
          },
        },
      ],
    },
  },
  {
    slug: "hotel-booking-system",
    title: "Hotel Booking System, Then Make It Concurrent",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Half-open intervals per room, only neighbours can clash — and check-then-book must be one atomic step.",
    prompt: [
      "> \"OOD Coding: design a Hotel Booking System. Interface roughly `checkAvailability(dateRange)` and `bookRoom(customerName, roomId, dateRange)`. Follow-up: under concurrency, how do you guarantee bookings do not conflict?\"",
      "",
      "This was the entire first round of an Apple loop that ended in an offer. Build it for the follow-up from the start.",
      "",
      "Dates are integers and every range is **half-open** `[start, end)` with `0 <= start < end`, so a checkout at 14 and a check-in at 14 do not collide. Implement `HotelBookingSystem(roomIds)`:",
      "",
      "- `checkAvailability(start, end)` — the ids of rooms with no booking overlapping the range, sorted ascending; `[]` for an invalid range.",
      "- `bookRoom(customer, roomId, start, end)` — book and return a new id `\"B1\"`, `\"B2\"`, … (numbered by successful bookings), or `null` when the room is unknown, the range is invalid, or it overlaps an existing booking for that room.",
      "- `cancel(bookingId)` — free the slot and return `true`; `false` for an unknown or already-cancelled id.",
      "",
      "```",
      "hotel = HotelBookingSystem([\"101\", \"102\"])",
      "hotel.bookRoom(\"ann\", \"101\", 1, 3)   ->  \"B1\"",
      "hotel.checkAvailability(2, 4)        ->  [\"102\"]",
      "hotel.bookRoom(\"bob\", \"101\", 2, 4)   ->  null      // overlaps B1",
      "hotel.bookRoom(\"bob\", \"101\", 3, 5)   ->  \"B2\"      // half-open: 3 is free",
      "hotel.cancel(\"B1\")                  ->  true",
      "```",
      "",
      "## Follow-up",
      "",
      "Two threads book the same room and slot at once. Where exactly is the race, what is the smallest lock that closes it, and what does the answer become when the store is a database rather than a dictionary?",
      "",
      "## Worth asking out loud",
      "",
      "Closed or half-open ranges? Are room ids unique and known up front? Should availability accept an invalid range or reject it? Is concurrency in scope now or as a follow-up — and one process or many?",
    ].join("\n"),
    hints: [
      "Keep each room's bookings sorted by start. Two half-open ranges overlap when a.start < b.end and b.start < a.end; in a sorted, non-overlapping list only the neighbours of the insertion point can clash, so a binary search plus two checks decides a booking.",
      "Check-then-book must be one atomic step per room: between a passing availability check and the insert, another caller can book the same slot. One lock per room is the smallest granularity that keeps the invariant; a global lock serialises the whole hotel.",
    ],
    solution: [
      "## Approach",
      "",
      "Two things to say before writing: intervals are half-open `[start, end)`, and check-then-book must be one atomic step, because between a passing availability check and the insert another thread can book the same room. Then: one lock per room, not one global lock. The reference keeps a sorted list of `[start, end, bookingId]` per room; a conflict check binary-searches the insertion point and compares against the neighbour on each side, since in a sorted non-overlapping list only neighbours can clash. `bookRoom` validates, checks, allocates the next id and inserts in one step; `cancel` removes the entry through the booking map.",
      "",
      "## Complexity",
      "",
      "O(log b) to check and O(b) to insert into a room's list of b bookings (a balanced tree makes both logarithmic); O(bookings) space.",
      "",
      "## Worth saying out loud",
      "",
      "- **Why not one lock?** Correct, and it serialises the whole hotel. Per-room locking is the minimum granularity that still makes the invariant hold, since bookings for different rooms never interact.",
      "- **Now it is a database, not a dictionary.** This is where the round is won: a unique constraint on an exclusion range (Postgres `tstzrange` with `EXCLUDE USING gist`, so the database enforces it), or `SELECT … FOR UPDATE` on the room row, or an optimistic version column with retry on conflict. Naming the exclusion constraint specifically is unusual and lands well.",
      "- **Multiple rooms in one transaction?** Now you can deadlock. Acquire locks in a total order, such as sorted room id, and say why.",
      "- **How do you know the concurrency works?** Forty threads on a barrier racing the same slot, assert exactly one wins. Offering to write that test is a strong close.",
    ].join("\n"),
    judge: {
      solutionCode: `// Sorted [start, end, bookingId] per room; only the neighbours of the
// insertion point can overlap. In a threaded runtime, bookRoom's check and
// insert run under that room's lock.
class HotelBookingSystem {
  constructor(roomIds) {
    this.rooms = new Map(roomIds.map((id) => [id, []]));
    this.bookings = new Map(); // bookingId -> [roomId, start, end]
    this.sequence = 0;
  }

  static validRange(start, end) {
    return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && start < end;
  }

  static overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  insertionPoint(list, start) {
    let lo = 0, hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid][0] < start) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  conflicts(roomId, start, end) {
    const list = this.rooms.get(roomId);
    const at = this.insertionPoint(list, start);
    for (const j of [at - 1, at]) {
      if (j >= 0 && j < list.length && HotelBookingSystem.overlaps(start, end, list[j][0], list[j][1])) return true;
    }
    return false;
  }

  checkAvailability(start, end) {
    if (!HotelBookingSystem.validRange(start, end)) return [];
    return [...this.rooms.keys()].filter((id) => !this.conflicts(id, start, end)).sort();
  }

  bookRoom(customer, roomId, start, end) {
    if (!this.rooms.has(roomId) || !HotelBookingSystem.validRange(start, end)) return null;
    if (this.conflicts(roomId, start, end)) return null; // atomic check-then-insert per room
    const bookingId = "B" + ++this.sequence;
    const list = this.rooms.get(roomId);
    list.splice(this.insertionPoint(list, start), 0, [start, end, bookingId]);
    this.bookings.set(bookingId, [roomId, start, end]);
    return bookingId;
  }

  cancel(bookingId) {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;
    this.bookings.delete(bookingId);
    const list = this.rooms.get(booking[0]);
    list.splice(list.findIndex((entry) => entry[2] === bookingId), 1);
    return true;
  }
}
`,
      starterCode: `class HotelBookingSystem {
  /** @param {string[]} roomIds */
  constructor(roomIds) {
    // Your state here
  }

  /** @returns {string[]} rooms free for [start, end), sorted; [] for an invalid range */
  checkAvailability(start, end) {
    return [];
  }

  /** @returns {string|null} "B1", "B2", ... or null (unknown room, bad range, or conflict) */
  bookRoom(customer, roomId, start, end) {
    return null;
  }

  /** @returns {boolean} */
  cancel(bookingId) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let hotel = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "HotelBookingSystem") {
      hotel = new HotelBookingSystem(...args[i]);
      out.push(null);
    } else {
      out.push(hotel[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt example",
          input: [
            ["HotelBookingSystem", "checkAvailability", "bookRoom", "checkAvailability", "bookRoom", "bookRoom", "cancel", "checkAvailability", "cancel"],
            [[["101", "102"]], [1, 3], ["ann", "101", 1, 3], [2, 4], ["bob", "101", 2, 4], ["bob", "101", 3, 5], ["B1"], [1, 3], ["B1"]],
          ],
          expected: [null, ["101", "102"], "B1", ["102"], null, "B2", true, ["101", "102"], false],
        },
        {
          name: "Unknown rooms and invalid ranges",
          input: [
            ["HotelBookingSystem", "bookRoom", "bookRoom", "bookRoom", "checkAvailability", "checkAvailability", "bookRoom"],
            [[["101"]], ["x", "999", 1, 2], ["x", "101", 5, 5], ["x", "101", -1, 2], [5, 5], [3, 1], ["x", "101", 0, 1]],
          ],
          expected: [null, null, null, null, [], [], "B1"],
        },
        {
          name: "Only neighbours can clash",
          input: [
            ["HotelBookingSystem", "bookRoom", "bookRoom", "bookRoom", "bookRoom", "bookRoom", "bookRoom"],
            [[["101"]], ["a", "101", 1, 3], ["b", "101", 5, 7], ["c", "101", 3, 5], ["d", "101", 2, 6], ["e", "101", 0, 1], ["f", "101", 7, 8]],
          ],
          expected: [null, "B1", "B2", "B3", null, "B4", "B5"],
        },
        {
          name: "Ids count successful bookings only",
          input: [
            ["HotelBookingSystem", "bookRoom", "bookRoom", "bookRoom"],
            [[["101", "102"]], ["a", "101", 1, 3], ["b", "101", 1, 3], ["c", "102", 1, 3]],
          ],
          expected: [null, "B1", null, "B2"],
        },
        {
          name: "Cancel frees the slot; cancelling twice fails",
          input: [
            ["HotelBookingSystem", "bookRoom", "cancel", "bookRoom", "cancel", "cancel"],
            [[["101"]], ["a", "101", 1, 3], ["B1"], ["b", "101", 1, 3], ["B1"], ["B2"]],
          ],
          expected: [null, "B1", true, "B2", false, true],
        },
        {
          name: "Availability is sorted",
          input: [
            ["HotelBookingSystem", "checkAvailability", "bookRoom", "checkAvailability"],
            [[["b", "a", "c"]], [0, 1], ["x", "b", 0, 1], [0, 1]],
          ],
          expected: [null, ["a", "b", "c"], "B1", ["a", "c"]],
        },
      ],
    },
  },
];
