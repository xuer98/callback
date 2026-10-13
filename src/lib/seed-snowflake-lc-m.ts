import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, LeetCode tag part M: a single-booking calendar,
// key-card alerts, and the most frequent id after each update. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-k.ts
// and seed-python-snowflake-m.ts.

export const snowflakeLcProblemsM: Problem[] = [
  {
    slug: "my-calendar-i",
    title: "My Calendar I",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Half-open intervals overlap when start < other.end and other.start < end; a sorted list makes the check a neighbour comparison.",
    prompt: [
      "Implement `MyCalendar` with `book(start, end)`, which adds the half-open event `[start, end)` and returns `true`, or returns `false` without adding it when it would overlap an existing booking. Events that touch (`end === start`) do not overlap.",
      "",
      "```",
      "c = MyCalendar()",
      "c.book(10, 20)   ->  true",
      "c.book(15, 25)   ->  false",
      "c.book(20, 30)   ->  true",
      "```",
    ].join("\n"),
    hints: [
      "Two half-open intervals overlap exactly when `start < b.end && b.start < end`; checking every booking is O(n) per call and correct.",
      "Keep the bookings sorted by start; then only the predecessor and successor of the new start need checking, found by binary search.",
    ],
    solution: [
      "## Approach",
      "",
      "Store bookings in a list sorted by start. For a new event, binary-search the insertion point; the only possible conflicts are the booking just before it (its end must not exceed the new start) and the booking just after it (its start must not be below the new end). If both are clear, insert at that point. The brute-force scan with the same overlap test is the acceptable first version.",
      "",
      "## Complexity",
      "",
      "O(log n) to find the spot and O(n) to insert into an array, O(n) space; a balanced tree makes insertion O(log n) too.",
      "",
      "## Worth saying out loud",
      "",
      "- Get the overlap predicate right once for half-open intervals and reuse it; the touching case is where off-by-ones live.",
      "- My Calendar II and III allow double and k-fold bookings and move to a sweep over start/end counts.",
    ].join("\n"),
    judge: {
      solutionCode: `class MyCalendar {
  constructor() {
    this.events = [];   // [start, end], sorted by start
  }

  book(start, end) {
    let lo = 0;
    let hi = this.events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.events[mid][0] < start) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0 && this.events[lo - 1][1] > start) return false;
    if (lo < this.events.length && this.events[lo][0] < end) return false;
    this.events.splice(lo, 0, [start, end]);
    return true;
  }
}
`,
      starterCode: `class MyCalendar {
  constructor() {
    // Your state here
  }

  /** @param {number} start @param {number} end half-open [start, end) @returns {boolean} */
  book(start, end) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("MyCalendar"),
      tests: [
        {
          name: "Prompt example",
          input: [["MyCalendar", "book", "book", "book"], [[], [10, 20], [15, 25], [20, 30]]],
          expected: [null, true, false, true],
        },
        {
          name: "Touching on both sides",
          input: [["MyCalendar", "book", "book", "book", "book"], [[], [10, 20], [0, 10], [20, 30], [9, 11]]],
          expected: [null, true, true, true, false],
        },
        {
          name: "A booking that contains another",
          input: [["MyCalendar", "book", "book", "book"], [[], [5, 10], [1, 20], [10, 15]]],
          expected: [null, true, false, true],
        },
      ],
    },
  },
  {
    slug: "alert-using-same-key-card",
    title: "Alert Using Same Key-Card Three or More Times in a One Hour Period",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Group times by name, sort them, and look for any three consecutive uses spanning at most 60 minutes.",
    prompt: [
      "`keyName[i]` used a key-card at `keyTime[i]` (`\"HH:MM\"`, all on the same day). A worker triggers an alert if they used their card three or more times within any one-hour period — `\"10:00\"`, `\"10:40\"` and `\"11:00\"` count, `\"10:00\"` to `\"11:01\"` does not. Return the alerted names sorted alphabetically.",
      "",
      "```",
      "alertNames([\"daniel\", \"daniel\", \"daniel\", \"luis\", \"luis\", \"luis\", \"luis\"],",
      "           [\"10:00\", \"10:40\", \"11:00\", \"09:00\", \"11:00\", \"13:00\", \"15:00\"])  ->  [\"daniel\"]",
      "```",
    ].join("\n"),
    hints: [
      "Convert each time to minutes since midnight and collect them per name.",
      "Sort each list; the person alerts if any `times[i + 2] − times[i] ≤ 60`.",
    ],
    solution: [
      "## Approach",
      "",
      "Bucket the minute values by name, sort each bucket, and slide a window of three: if the third use is at most 60 minutes after the first, three uses fall inside one hour. Collect the names that satisfy it and sort them.",
      "",
      "## Complexity",
      "",
      "O(n log n) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Checking consecutive triples is enough: any three uses within an hour include three consecutive sorted uses within that hour.",
      "- The inclusive hour (`≤ 60`) is the boundary to confirm before coding.",
    ].join("\n"),
    judge: {
      solutionCode: `function alertNames(keyName, keyTime) {
  const byName = new Map();
  for (let i = 0; i < keyName.length; i++) {
    const [h, m] = keyTime[i].split(":").map(Number);
    if (!byName.has(keyName[i])) byName.set(keyName[i], []);
    byName.get(keyName[i]).push(h * 60 + m);
  }
  const alerted = [];
  for (const [name, times] of byName) {
    times.sort((a, b) => a - b);
    for (let i = 2; i < times.length; i++) {
      if (times[i] - times[i - 2] <= 60) {
        alerted.push(name);
        break;
      }
    }
  }
  return alerted.sort();
}
`,
      starterCode: `/**
 * @param {string[]} keyName
 * @param {string[]} keyTime "HH:MM", same day
 * @returns {string[]} alerted names, sorted
 */
function alertNames(keyName, keyTime) {
  // Your code here
  return [];
}
`,
      entry: "alertNames",
      tests: [
        {
          name: "Prompt example",
          input: [["daniel", "daniel", "daniel", "luis", "luis", "luis", "luis"], ["10:00", "10:40", "11:00", "09:00", "11:00", "13:00", "15:00"]],
          expected: ["daniel"],
        },
        {
          name: "Unsorted times",
          input: [["alice", "alice", "alice", "bob", "bob", "bob", "bob"], ["12:01", "12:00", "18:00", "21:00", "21:20", "21:30", "23:00"]],
          expected: ["bob"],
        },
        { name: "A single use", input: [["a"], ["00:00"]], expected: [] },
        { name: "Midnight does not wrap", input: [["x", "x", "x"], ["23:00", "23:59", "00:00"]], expected: [] },
        { name: "Exactly one hour counts", input: [["z", "z", "z"], ["09:00", "09:30", "10:00"]], expected: ["z"] },
      ],
    },
  },
  {
    slug: "most-frequent-ids",
    title: "Most Frequent IDs",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Counts in a map and a max-heap of (count, id) with lazy deletion: pop until the top matches the current count.",
    prompt: [
      "Process steps in order: step `i` adds `freq[i]` copies of id `nums[i]` to a collection (removing copies when `freq[i]` is negative; the count never goes below zero). After each step, report the count of the most frequent id, or `0` when the collection is empty.",
      "",
      "```",
      "mostFrequentIDs([2, 3, 2, 1], [3, 2, -3, 1])  ->  [3, 3, 2, 2]",
      "mostFrequentIDs([5, 5, 3], [2, -2, 1])        ->  [2, 0, 1]",
      "```",
    ].join("\n"),
    hints: [
      "Keep a map from id to count and push every new (count, id) onto a max-heap.",
      "Before reading the top, pop entries whose count no longer matches the map — lazy deletion — then the top count is the answer.",
    ],
    solution: [
      "## Approach",
      "",
      "Maintain the counts in a map. After each update push the id's new count onto a max-heap; stale entries are left in place and discarded when they reach the top, by comparing the heap entry's count with the map's current count. The surviving top is the current maximum; an empty heap means an empty collection.",
      "",
      "## Complexity",
      "",
      "O(n log n) time; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Lazy deletion avoids a heap with decrease-key; an ordered multiset of counts is the other standard answer.",
      "- [Top K Selling Books After Each Sale](/problems/top-k-books-after-each-update) asks for the k leaders instead of the single maximum.",
    ].join("\n"),
    judge: {
      solutionCode: `function mostFrequentIDs(nums, freq) {
  const count = new Map();
  const heap = [];
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] >= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let m = i;
        const l = 2 * i + 1;
        const r = l + 1;
        if (l < heap.length && heap[l][0] > heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] > heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    const next = Math.max(0, (count.get(nums[i]) ?? 0) + freq[i]);
    count.set(nums[i], next);
    push([next, nums[i]]);
    while (heap.length && heap[0][0] !== count.get(heap[0][1])) pop();
    out.push(heap.length ? heap[0][0] : 0);
  }
  return out;
}
`,
      starterCode: `/**
 * @param {number[]} nums ids
 * @param {number[]} freq copies added (negative removes)
 * @returns {number[]} the top count after each step
 */
function mostFrequentIDs(nums, freq) {
  // Your code here
  return [];
}
`,
      entry: "mostFrequentIDs",
      tests: [
        { name: "Prompt example", input: [[2, 3, 2, 1], [3, 2, -3, 1]], expected: [3, 3, 2, 2] },
        { name: "The collection empties", input: [[5, 5, 3], [2, -2, 1]], expected: [2, 0, 1] },
        { name: "One step", input: [[1], [1]], expected: [1] },
        { name: "Removing drops below another id", input: [[1, 2, 1], [1, 1, -1]], expected: [1, 1, 1] },
        { name: "The leader changes twice", input: [[1, 2, 2, 1], [5, 3, 3, -4]], expected: [5, 5, 6, 6] },
      ],
    },
  },
];
