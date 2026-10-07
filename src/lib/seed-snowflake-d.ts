import type { Problem } from "./types";
import { LINK_FETCHER } from "./seed-snowflake-c";

// Snowflake coding bank, part D: the rest of the wiki-page BFS family and the
// two-rule request limiter. Judged in JavaScript and Python; the Python
// judges live in seed-python-snowflake-f.ts.

export const snowflakeProblemsD: Problem[] = [
  {
    slug: "click-path-between-pages",
    title: "Click Path Between Wiki Pages",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Store one predecessor per page, not a path per queue entry, and walk it back from the target.",
    prompt: [
      "You are given `getLinkedPages(uri)`, which fetches a wiki page and returns the URIs it links to. Return a **shortest** sequence of pages from `start` to `target`, both included, or an empty list if `target` cannot be reached. From a page to itself the path is just `[start]`.",
      "",
      "```",
      "// A -> B, A -> C, B -> D, C -> D",
      'clickPath("A", "D", getLinkedPages)  ->  ["A", "B", "D"]   (or ["A", "C", "D"])',
      "```",
      "",
      "Any shortest path is accepted. Fetching is expensive: the harness fails a run that fetches the same page twice, and its fetcher returns an empty list for unknown pages.",
    ].join("\n"),
    hints: [
      "Same BFS as for the click count, but remember how each page was first reached: a map from page to the page it was discovered from.",
      "When the target is discovered, follow the predecessor map back to the start and reverse. Storing a whole path per queue entry costs O(V · path) memory instead of O(V).",
    ],
    solution: [
      "## Approach",
      "",
      "BFS discovers every page along a shortest route, so recording a single predecessor per page — the page that discovered it — is enough to rebuild one shortest path. When the target is first seen, walk predecessors back to the start and reverse. The predecessor map doubles as the seen set, so each page is fetched once.",
      "",
      "## Complexity",
      "",
      "O(V + E) time; O(V) space, where storing a path per queue entry would have been O(V · L).",
      "",
      "## Worth saying out loud",
      "",
      "- The predecessor trick is the memory answer the question is really after; mention it before being asked.",
      "- Tests: a cycle, a diamond (two shortest paths, either accepted), an unreachable target, start equal to target.",
      "- With a dict-backed fake `getLinkedPages` the tests run without a network, which is how to show them in the room.",
    ].join("\n"),
    judge: {
      solutionCode: `// BFS with one predecessor per page; the path is rebuilt from the target.
function clickPath(start, target, getLinkedPages) {
  if (start === target) return [start];
  const previous = new Map([[start, null]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const page = queue[head];
    for (const link of getLinkedPages(page)) {
      if (previous.has(link)) continue;
      previous.set(link, page);
      if (link === target) {
        const path = [];
        for (let at = target; at !== null; at = previous.get(at)) path.push(at);
        return path.reverse();
      }
      queue.push(link);
    }
  }
  return [];
}
`,
      starterCode: `/**
 * @param {string} start
 * @param {string} target
 * @param {(uri: string) => string[]} getLinkedPages fetches a page and returns the pages it links to
 * @returns {string[]} a shortest path from start to target, both included, or []
 */
function clickPath(start, target, getLinkedPages) {
  // Your code here
  return [];
}
`,
      entry: "__judgeClickPath",
      // Several shortest paths may exist, so the driver checks the returned
      // one against its own BFS distance.
      driverCode: `${LINK_FETCHER}
function __judgeClickPath(graph, start, target) {
  const path = clickPath(start, target, __linkFetcher(graph));
  const distance = new Map([[start, 0]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const page = queue[head];
    for (const link of graph[page] || []) {
      if (!distance.has(link)) {
        distance.set(link, distance.get(page) + 1);
        queue.push(link);
      }
    }
  }
  if (!distance.has(target)) {
    return Array.isArray(path) && path.length === 0 ? "unreachable" : "returned a path to an unreachable page";
  }
  if (!Array.isArray(path) || path.length === 0) return "no path returned";
  if (path[0] !== start || path[path.length - 1] !== target) return "the path must run from " + start + " to " + target;
  for (let i = 1; i < path.length; i++) {
    if (!(graph[path[i - 1]] || []).includes(path[i])) return path[i - 1] + " does not link to " + path[i];
  }
  if (path.length - 1 !== distance.get(target)) return "path of " + (path.length - 1) + " clicks, but " + distance.get(target) + " suffice";
  return "path of " + (path.length - 1) + " clicks";
}`,
      tests: [
        { name: "Prompt example", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "A", "D"], expected: "path of 2 clicks" },
        { name: "Same page", input: [{ A: ["B"], B: [] }, "A", "A"], expected: "path of 0 clicks" },
        { name: "Unreachable", input: [{ A: ["B"], B: [] }, "B", "A"], expected: "unreachable" },
        { name: "The short way around a cycle", input: [{ A: ["B"], B: ["A", "C"], C: ["A", "D"], D: [] }, "A", "D"], expected: "path of 3 clicks" },
        { name: "A shortcut beats the chain", input: [{ A: ["B", "E"], B: ["C"], C: ["D"], D: [], E: ["D"] }, "A", "D"], expected: "path of 2 clicks" },
        { name: "A dangling target", input: [{ A: ["B"] }, "A", "B"], expected: "path of 1 clicks" },
      ],
    },
  },
  {
    slug: "crawl-reachable-pages",
    title: "Crawl Every Reachable Page",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A BFS that keeps going after the target is gone — and the thread-safety story that comes with it.",
    prompt: [
      "You are given `getLinkedPages(uri)`, which fetches a wiki page and returns the URIs it links to. Return every page reachable from `start` by following links, including `start` itself, in any order.",
      "",
      "```",
      "// A -> B, A -> C, B -> D, C -> D, D -> A",
      'crawl("A", getLinkedPages)  ->  ["A", "B", "C", "D"]',
      "```",
      "",
      "Fetch each page exactly once: the harness fails a run that fetches the same page twice, and its fetcher returns an empty list for unknown pages.",
    ].join("\n"),
    hints: [
      "The visited set is the whole algorithm: add a page the moment it is discovered, fetch it once, and the cycle A -> B -> A ends by itself.",
      "Return the visited set when the queue is empty.",
    ],
    solution: [
      "## Approach",
      "",
      "BFS or DFS, it does not matter here — only that every page is marked as seen when discovered and fetched once. The seen set is the answer. The reference is iterative so a long chain of pages cannot overflow the stack.",
      "",
      "## Complexity",
      "",
      "O(V + E) with one fetch per page; O(V) space.",
      "",
      "## Worth saying out loud",
      "",
      "- With several workers, two things decide correctness: the seen-set check-and-add is one atomic step under a lock (a check followed by an add is a race), and termination counts in-flight work — an empty queue alone is not done. A work queue whose `join` waits for every `task_done` is the clean termination signal.",
      "- A real crawler bounds concurrency per host, retries failed fetches with backoff and stops on a page budget or a depth limit; the API is the bottleneck, not the data structure.",
      "- Fewest clicks and the path itself are [Fewest Clicks Between Wiki Pages](/problems/fewest-clicks-between-pages) and [Click Path Between Wiki Pages](/problems/click-path-between-pages).",
    ].join("\n"),
    judge: {
      solutionCode: `// The seen set is the answer: mark on discovery, fetch once.
function crawl(start, getLinkedPages) {
  const seen = new Set([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    for (const link of getLinkedPages(queue[head])) {
      if (!seen.has(link)) {
        seen.add(link);
        queue.push(link);
      }
    }
  }
  return [...seen];
}
`,
      starterCode: `/**
 * @param {string} start
 * @param {(uri: string) => string[]} getLinkedPages fetches a page and returns the pages it links to
 * @returns {string[]} every page reachable from start, including start, in any order
 */
function crawl(start, getLinkedPages) {
  // Your code here
  return [start];
}
`,
      entry: "__judgeCrawl",
      driverCode: `${LINK_FETCHER}
function __judgeCrawl(graph, start) {
  return [...crawl(start, __linkFetcher(graph))].sort();
}`,
      tests: [
        { name: "Prompt example", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: ["A"] }, "A"], expected: ["A", "B", "C", "D"] },
        { name: "Only what is downstream", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "B"], expected: ["B", "D"] },
        { name: "A page that links to itself", input: [{ A: ["A"] }, "A"], expected: ["A"] },
        { name: "A dangling link counts as a page", input: [{ A: ["B"] }, "A"], expected: ["A", "B"] },
        { name: "No links at all", input: [{ A: [] }, "A"], expected: ["A"] },
        { name: "A long cycle", input: [{ P0: ["P1"], P1: ["P2"], P2: ["P3"], P3: ["P0"] }, "P2"], expected: ["P0", "P1", "P2", "P3"] },
      ],
    },
  },
  {
    slug: "dropped-request-times",
    title: "Dropped Requests Under Two Rules",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "One queue of accepted timestamps per rule; dropped requests never enter either.",
    prompt: [
      "Requests arrive at non-decreasing times (in milliseconds). Each rule `[window, limit]` says: at most `limit` requests may be **accepted** in any window of `window` ms. A request at time `t` is accepted when, for every rule, fewer than `limit` accepted requests fall in `(t - window, t]`; otherwise it is dropped.",
      "",
      "Return the times of the dropped requests, in order. Dropped requests do not count toward any window.",
      "",
      "```",
      "droppedRequests([100, 200, 300, 400, 5000], [[1000, 3], [10000, 20]])  ->  [400]",
      "```",
    ].join("\n"),
    hints: [
      "Keep one queue of accepted timestamps per rule. For each request, evict timestamps at or before t - window from the front, then check every queue's length against its limit.",
      "Only on acceptance do you append the timestamp — to every rule's queue. Appending a dropped request is the classic bug and makes later requests fail that should pass.",
    ],
    solution: [
      "## Approach",
      "",
      "A sliding-window log per rule. For a request at `t`, drop everything at or before `t - window` from the front of each queue (the window is half-open, so a request exactly one window ago has aged out), then accept only if every queue is below its limit, and in that case push `t` onto all of them. Each timestamp enters and leaves each queue once.",
      "",
      "## Complexity",
      "",
      "O(n · rules) amortised time; O(limit) memory per rule.",
      "",
      "## Worth saying out loud",
      "",
      "- Clarify whether windows count accepted requests or all arrivals, and whether the boundary is inclusive — both change the answer on the boundary tests.",
      "- Write one test where the long rule binds while the short one passes: a request every 400 ms is fine for 3 per second and fails 20 per 10 seconds on the 21st request.",
      "- The per-client version is [Sliding-Window Rate Limiter](/problems/sliding-window-rate-limiter); the configurable tiered one is [Tiered Token-Bucket Limiter](/problems/tiered-token-bucket-limiter).",
    ].join("\n"),
    judge: {
      solutionCode: `// One queue of accepted timestamps per rule; evict, check every rule, then record.
function droppedRequests(times, rules) {
  const accepted = rules.map(() => []);
  const heads = rules.map(() => 0);
  const dropped = [];
  for (const t of times) {
    rules.forEach(([window], i) => {
      while (heads[i] < accepted[i].length && accepted[i][heads[i]] <= t - window) heads[i]++;
    });
    const allowed = rules.every(([, limit], i) => accepted[i].length - heads[i] < limit);
    if (allowed) accepted.forEach((queue) => queue.push(t));
    else dropped.push(t);
  }
  return dropped;
}
`,
      starterCode: `/**
 * @param {number[]} times request times in ms, non-decreasing
 * @param {number[][]} rules [window, limit] pairs: at most limit accepted requests per window ms
 * @returns {number[]} the dropped request times, in order
 */
function droppedRequests(times, rules) {
  // Your code here
  return [];
}
`,
      entry: "droppedRequests",
      tests: [
        {
          name: "Prompt example",
          input: [
            [100, 200, 300, 400, 5000],
            [
              [1000, 3],
              [10000, 20],
            ],
          ],
          expected: [400],
        },
        { name: "A request exactly one window later gets in", input: [[0, 1000], [[1000, 1]]], expected: [] },
        { name: "Dropped requests do not count", input: [[0, 500, 1000], [[1000, 1]]], expected: [500] },
        {
          name: "The long rule binds while the short one passes",
          input: [
            [
              0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400, 4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000, 8400, 8800, 9200, 9600,
              10000, 10400,
            ],
            [
              [1000, 3],
              [10000, 20],
            ],
          ],
          expected: [8000, 8400, 8800, 9200, 9600],
        },
        { name: "No rules, nothing dropped", input: [[1, 2, 3], []], expected: [] },
        { name: "Several at the same instant", input: [[0, 0, 0, 0], [[1000, 2]]], expected: [0, 0] },
        { name: "No requests", input: [[], [[1000, 3]]], expected: [] },
      ],
    },
  },
];
