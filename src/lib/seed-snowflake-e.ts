import type { Problem } from "./types";

// Snowflake coding bank, part E: the tiered token bucket, an event counter
// over time ranges, and a tiny interpreter. Judged in JavaScript and Python;
// the Python judges live in seed-python-snowflake-b.ts.

/**
 * The operations driver for class problems: the operation naming the class
 * constructs it, every other one calls a method, and void results read as
 * null.
 */
export const runOperationsDriver = (className: string) => `function __runOperations(operations, args) {
  let target = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "${className}") {
      target = new ${className}(...args[i]);
      out.push(null);
    } else {
      out.push(target[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`;

export const snowflakeProblemsE: Problem[] = [
  {
    slug: "tiered-token-bucket-limiter",
    title: "Tiered Token-Bucket Limiter",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Per-client (tokens, last seen), a tier config read on every call, and an explicit fallback for clients with no valid tier.",
    prompt: [
      "Implement a token-bucket rate limiter whose limits come from **tiers** that can change at runtime. Time is passed in explicitly, in seconds.",
      "",
      "```",
      "limiter = TieredLimiter(defaultAllow)",
      "limiter.setTier(tier, capacity, refillRate)   // create or update a tier; refillRate is tokens per second",
      "limiter.assignClient(client, tier)",
      "limiter.allow(client, now)                    // true to serve the request, false to reject it",
      "```",
      "",
      "## Rules",
      "",
      "- A client's bucket is full the first time it is seen. Each `allow` refills it at the tier's rate for the time elapsed, never above the capacity, and takes one token if one is available.",
      "- The tier's configuration is read on **every** call. Lowering a capacity caps the balance at the new capacity; raising one mints no tokens.",
      "- A client's balance travels with it when it is moved to another tier.",
      "- A client with no tier, an unknown tier, or a tier with a negative capacity or rate gets the global fallback: `defaultAllow`.",
    ].join("\n"),
    hints: [
      "State per client is just (tokens, lastSeen). Refill lazily: tokens = min(capacity, tokens + (now − lastSeen) × rate), then compare with 1.",
      "Look the tier up on every call rather than caching capacity in the client state — that is what makes configuration changes take effect, and the min against capacity is what makes a lowered limit bite.",
      "Decide the fallback explicitly and test it: an unknown client is the most common production request, not a corner case.",
    ],
    solution: [
      "## Approach",
      "",
      "A token bucket needs only `(tokens, lastSeen)` per client. On `allow`, fetch the client's tier configuration, refill proportionally to the elapsed time, cap at the capacity, and admit when at least one token remains. Reading the configuration on every call makes tier changes immediate: the cap applies a lowered capacity, and a raised one simply allows the refill to climb higher. Clients without a usable tier return the configured default.",
      "",
      "## Complexity",
      "",
      "O(1) per call; O(1) state per client.",
      "",
      "## Worth saying out loud",
      "",
      "- Why this algorithm: a token bucket allows bursts up to the capacity with O(1) state; a fixed window admits double the limit across a boundary; a sliding-window log is exact but stores every timestamp; a leaky bucket smooths output to a constant rate.",
      "- Test refill with an injected clock: the time is a parameter, so a test advances it instead of sleeping.",
      "- If the handler fails after a token was taken, treat the token as a reservation and refund it. Throttled requests that must not be dropped go into a delayed queue keyed by their next eligible time and are re-checked when they wake.",
      "- Distributed version: move bucket state to a shared store with an atomic check-and-decrement (a server-side script), then decide clock skew and fail-open versus fail-closed when that store is slow or down.",
      "- Thread safety in one process is a lock around the read-modify-write of a client's state.",
    ].join("\n"),
    judge: {
      solutionCode: `// Token bucket per client; tier configuration is read on every call.
class TieredLimiter {
  constructor(defaultAllow = false) {
    this.defaultAllow = defaultAllow;
    this.tiers = new Map();        // tier -> { capacity, refillRate }
    this.clientTier = new Map();   // client -> tier
    this.state = new Map();        // client -> { tokens, lastSeen }
  }

  setTier(tier, capacity, refillRate) {
    this.tiers.set(tier, { capacity, refillRate });
  }

  assignClient(client, tier) {
    this.clientTier.set(client, tier);
  }

  allow(client, now) {
    const config = this.tiers.get(this.clientTier.get(client));
    if (!config || config.capacity < 0 || config.refillRate < 0) return this.defaultAllow;
    const { capacity, refillRate } = config;
    const state = this.state.get(client) ?? { tokens: capacity, lastSeen: now };   // first request: full bucket
    let tokens = Math.min(capacity, state.tokens + (now - state.lastSeen) * refillRate);
    const ok = tokens >= 1;
    if (ok) tokens -= 1;
    this.state.set(client, { tokens, lastSeen: now });
    return ok;
  }
}
`,
      starterCode: `class TieredLimiter {
  /** @param {boolean} defaultAllow the verdict for clients without a valid tier */
  constructor(defaultAllow = false) {
    // Your state here
  }

  /** Create or update a tier. refillRate is tokens per second. */
  setTier(tier, capacity, refillRate) {}

  assignClient(client, tier) {}

  /** @returns {boolean} whether the request at time now (seconds) is served */
  allow(client, now) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("TieredLimiter"),
      tests: [
        {
          name: "A burst, then refill",
          input: [
            ["TieredLimiter", "setTier", "assignClient", "allow", "allow", "allow", "allow", "allow"],
            [[false], ["gold", 2, 1], ["c", "gold"], ["c", 0], ["c", 0], ["c", 0], ["c", 0.5], ["c", 1]],
          ],
          expected: [null, null, null, true, true, false, false, true],
        },
        {
          name: "An unknown client is denied by default",
          input: [
            ["TieredLimiter", "allow"],
            [[false], ["x", 0]],
          ],
          expected: [null, false],
        },
        {
          name: "An unknown client is allowed when the default says so",
          input: [
            ["TieredLimiter", "allow"],
            [[true], ["x", 0]],
          ],
          expected: [null, true],
        },
        {
          name: "A tier that does not exist is the fallback too",
          input: [
            ["TieredLimiter", "assignClient", "allow"],
            [[false], ["c", "nope"], ["c", 0]],
          ],
          expected: [null, null, false],
        },
        {
          name: "Lowering the capacity caps the balance",
          input: [
            ["TieredLimiter", "setTier", "assignClient", "allow", "setTier", "allow", "allow", "allow"],
            [[false], ["g", 5, 0], ["c", "g"], ["c", 0], ["g", 2, 0], ["c", 0], ["c", 0], ["c", 0]],
          ],
          expected: [null, null, null, true, null, true, true, false],
        },
        {
          name: "Raising the capacity mints nothing",
          input: [
            ["TieredLimiter", "setTier", "assignClient", "allow", "setTier", "allow"],
            [[false], ["g", 1, 0], ["c", "g"], ["c", 0], ["g", 5, 0], ["c", 0]],
          ],
          expected: [null, null, null, true, null, false],
        },
        {
          name: "Refill stops at the capacity",
          input: [
            ["TieredLimiter", "setTier", "assignClient", "allow", "allow", "allow", "allow"],
            [[false], ["g", 2, 1], ["c", "g"], ["c", 0], ["c", 100], ["c", 100], ["c", 100]],
          ],
          expected: [null, null, null, true, true, true, false],
        },
        {
          name: "A client moved to a smaller tier keeps its balance, capped",
          input: [
            ["TieredLimiter", "setTier", "setTier", "assignClient", "allow", "allow", "assignClient", "allow", "allow"],
            [[false], ["big", 3, 0], ["small", 1, 0], ["c", "big"], ["c", 0], ["c", 0], ["c", "small"], ["c", 0], ["c", 0]],
          ],
          expected: [null, null, null, null, true, true, null, true, false],
        },
        {
          name: "Zero capacity rejects; a negative configuration is the fallback",
          input: [
            ["TieredLimiter", "setTier", "setTier", "assignClient", "assignClient", "allow", "allow"],
            [[true], ["zero", 0, 1], ["bad", -1, 1], ["a", "zero"], ["b", "bad"], ["a", 0], ["b", 0]],
          ],
          expected: [null, null, null, null, null, false, true],
        },
        {
          name: "Clients do not share a bucket",
          input: [
            ["TieredLimiter", "setTier", "assignClient", "assignClient", "allow", "allow", "allow"],
            [[false], ["g", 1, 0], ["a", "g"], ["b", "g"], ["a", 0], ["b", 0], ["a", 0]],
          ],
          expected: [null, null, null, null, true, true, false],
        },
      ],
    },
  },
  {
    slug: "count-events-in-range",
    title: "Count Events in a Time Range",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "Timestamps arrive in order, so each type's list is already sorted and a count is two binary searches.",
    prompt: [
      "Events arrive as `(type, timestamp)` with timestamps that never decrease. Design `EventCounter`:",
      "",
      "```",
      "receive(type, timestamp)",
      "count(type, start, end)   // events of that type with start <= timestamp <= end",
      "```",
      "",
      "```",
      'receive("view", 1) · receive("click", 2) · receive("view", 5) · receive("view", 9)',
      'count("view", 2, 9)   ->  2',
      'count("click", 3, 9)  ->  0',
      "```",
      "",
      "Many `count` calls follow the receives, over arbitrary windows, so make them fast.",
    ].join("\n"),
    hints: [
      "Keep one list of timestamps per type. Because arrivals are in order, appending keeps each list sorted for free.",
      "count is upperBound(end) − lowerBound(start) on that type's list: the first index with timestamp > end minus the first index with timestamp >= start.",
    ],
    solution: [
      "## Approach",
      "",
      "One sorted list of timestamps per type, kept sorted by the arrival order itself. A count is the difference of two binary searches: the first position past `end` minus the first position at or after `start`. Receives are O(1) and counts are O(log n), whatever the window.",
      "",
      "## Complexity",
      "",
      "O(1) per receive, O(log n) per count; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- If timestamps could arrive out of order, say so and switch to a sorted container or a Fenwick tree over bucketed time; the append-only list depends on the ordering guarantee.",
      "- Both bounds are inclusive here; confirm that, since half-open ranges are at least as common.",
      "- For a very long-running stream, bucket old data by minute or hour and keep exact timestamps only for the recent tail.",
    ].join("\n"),
    judge: {
      solutionCode: `// One sorted list per type; a count is two binary searches.
class EventCounter {
  constructor() {
    this.timestamps = new Map();
  }

  receive(type, timestamp) {
    if (!this.timestamps.has(type)) this.timestamps.set(type, []);
    this.timestamps.get(type).push(timestamp);           // arrivals are in order
  }

  count(type, start, end) {
    const list = this.timestamps.get(type) ?? [];
    return Math.max(0, this.firstAbove(list, end) - this.firstAtLeast(list, start));   // an inverted window is empty
  }

  firstAtLeast(list, value) {                           // lower bound
    let lo = 0;
    let hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  firstAbove(list, value) {                             // upper bound
    let lo = 0;
    let hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid] <= value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
`,
      starterCode: `class EventCounter {
  constructor() {
    // Your state here
  }

  /** Timestamps never decrease across calls. */
  receive(type, timestamp) {}

  /** @returns {number} events of that type with start <= timestamp <= end */
  count(type, start, end) {
    return 0;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("EventCounter"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["EventCounter", "receive", "receive", "receive", "receive", "count", "count", "count", "count"],
            [[], ["view", 1], ["click", 2], ["view", 5], ["view", 9], ["view", 2, 9], ["view", 1, 1], ["click", 3, 9], ["view", 0, 100]],
          ],
          expected: [null, null, null, null, null, 2, 1, 0, 3],
        },
        {
          name: "An unknown type",
          input: [
            ["EventCounter", "receive", "count"],
            [[], ["a", 1], ["b", 0, 10]],
          ],
          expected: [null, null, 0],
        },
        {
          name: "Both ends are inclusive",
          input: [
            ["EventCounter", "receive", "receive", "count", "count"],
            [[], ["a", 10], ["a", 20], ["a", 10, 20], ["a", 11, 19]],
          ],
          expected: [null, null, null, 2, 0],
        },
        {
          name: "Several events at one instant",
          input: [
            ["EventCounter", "receive", "receive", "receive", "count"],
            [[], ["a", 5], ["a", 5], ["a", 5], ["a", 5, 5]],
          ],
          expected: [null, null, null, null, 3],
        },
        {
          name: "An empty window",
          input: [
            ["EventCounter", "receive", "count"],
            [[], ["a", 5], ["a", 9, 1]],
          ],
          expected: [null, null, 0],
        },
      ],
    },
  },
  {
    slug: "snowcal-interpreter",
    title: "SnowCal Interpreter",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "One register, a dictionary of recorded bodies, and a mode flag that says whether a line runs or is being stored.",
    prompt: [
      "SnowCal is a tiny language with one integer register `X`, which starts at `0`. A program is a list of lines:",
      "",
      "```",
      "ADD y      X = X + y",
      "MUL y      X = X * y",
      "FUN name   start recording a function body (the lines until END are stored, not run)",
      "END        stop recording",
      "INV name   run the recorded body of name",
      "```",
      "",
      "Bodies hold only `ADD` and `MUL` lines and are not nested. A function may be invoked any number of times; defining a name again replaces the earlier body. Return `X` after the last line.",
      "",
      "```",
      'snowcal(["FUN f", "ADD 1", "MUL 2", "END", "INV f", "INV f"])  ->  6',
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from function name to its list of recorded (op, argument) lines, and a pointer to the body currently being recorded — null when you are executing.",
      "Executing a line is one function used in two places: the top level, and the loop that replays a body on INV.",
    ],
    solution: [
      "## Approach",
      "",
      "A two-mode scan. While a body is being recorded, lines are appended to it instead of run; `END` leaves recording mode. Otherwise `ADD` and `MUL` update the register, and `INV` replays the stored body through the same apply function. Separating parsing a line from applying it keeps the replay loop a one-liner.",
      "",
      "## Complexity",
      "",
      "O(total lines executed); O(program) space for the bodies.",
      "",
      "## Worth saying out loud",
      "",
      "- Confirm that the program arrives as one list and not as a stream; recording a body needs its END before any INV can run it.",
      "- If bodies may call other functions, ask about recursion and switch the replay to a recursive executor with a depth guard.",
      "- Error cases to decide: INV of an unknown name, END without FUN, a malformed number — raise, or ignore, but say which.",
    ].join("\n"),
    judge: {
      solutionCode: `// Two modes: record a body, or run a line. INV replays a body through the same apply.
function snowcal(program) {
  const functions = new Map();
  let recording = null;                        // the body being recorded, or null
  let x = 0;
  const apply = (op, arg, value) => (op === "ADD" ? value + arg : value * arg);
  for (const line of program) {
    const space = line.indexOf(" ");
    const op = space === -1 ? line : line.slice(0, space);
    const arg = space === -1 ? "" : line.slice(space + 1).trim();
    if (op === "FUN") {
      recording = [];
      functions.set(arg, recording);
    } else if (op === "END") {
      recording = null;
    } else if (recording !== null) {
      recording.push([op, Number(arg)]);     // stored, not executed
    } else if (op === "INV") {
      for (const [bodyOp, bodyArg] of functions.get(arg) ?? []) x = apply(bodyOp, bodyArg, x);
    } else {
      x = apply(op, Number(arg), x);
    }
  }
  return x;
}
`,
      starterCode: `/**
 * @param {string[]} program lines: "ADD y", "MUL y", "FUN name", "END", "INV name"
 * @returns {number} the register X after the last line
 */
function snowcal(program) {
  // Your code here
  return 0;
}
`,
      entry: "snowcal",
      tests: [
        { name: "Prompt example", input: [["FUN f", "ADD 1", "MUL 2", "END", "INV f", "INV f"]], expected: 6 },
        { name: "Plain arithmetic", input: [["ADD 2", "MUL 3"]], expected: 6 },
        { name: "A body is not run when defined", input: [["FUN f", "ADD 5", "END"]], expected: 0 },
        { name: "Lines around a definition still run", input: [["ADD 5", "FUN g", "MUL 10", "END", "ADD 1", "INV g"]], expected: 60 },
        { name: "Negative numbers", input: [["ADD -4", "MUL -2"]], expected: 8 },
        { name: "Redefining a function replaces it", input: [["FUN f", "ADD 1", "END", "FUN f", "ADD 10", "END", "INV f"]], expected: 10 },
        { name: "Two functions", input: [["FUN a", "ADD 1", "END", "FUN b", "MUL 3", "END", "INV a", "INV b", "INV a"]], expected: 4 },
        { name: "An empty program", input: [[]], expected: 0 },
      ],
    },
  },
];
