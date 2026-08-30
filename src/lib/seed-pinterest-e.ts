import type { Problem } from "./types";

// Pinterest onsite bank, part E: bank tellers and prefix search — the two
// "easy until the follow-ups" screens.

export const pinterestProblemsE: Problem[] = [
  {
    slug: "bank-teller-wait-time",
    title: "Bank Tellers: Wait Time",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "A min-heap simulation, then binary search on the answer.",
    prompt: `## Part (a) — how long until I'm served?

A bank has N agents; agent i always takes times[i] minutes per customer. Customers wait in one queue and there are M customers **ahead of you**. All agents are free at time 0; whenever one frees up, the next customer walks over. If several free up at the same moment, the **lowest-numbered** agent takes the next customer. Return the time at which an agent starts serving you.

\`\`\`
times = [2, 3, 1, 5], M = 5  =>  2
t=0: customers 1-4 take agents 0,1,2,3 (free again at 2,3,1,5)
t=1: agent 2 frees -> customer 5 (free again at 2)
t=2: agents 0 and 2 both free -> you go to agent 0
\`\`\`

## Part (b) — minimum time to finish M customers

Same agents, but customers are assigned optimally and agents serve back to back: the smallest T with sum over i of floor(T / times[i]) >= M.

\`\`\`
times = [2, 3, 1, 5], M = 5  =>  3     (T=2: 1+0+2+0 = 3; T=3: 1+1+3+0 = 5)
\`\`\`

N up to 10^5, times[i] up to 10^7, M up to 10^9.

## Follow-ups

- Why does the heap break ties toward the lowest agent correctly?
- What is a cheap, safe upper bound for the binary search?
- M is 10^9 — can part (a) avoid simulating every customer?
- What changes when each customer needs a different amount of service?`,
    hints: [
      "Part (a): a min-heap of (freeTime, agentIndex). Tuple ordering gives the tie-break for free — equal times pop the lower index first.",
      "Serve the M customers ahead of you by popping and pushing (freeTime + times[agent], agent); your start time is the freeTime of the next pop.",
      "Part (b) is monotone in T, so binary search it: lo = 0, hi = min(times) × M is always enough.",
    ],
    solution: `## Approach

**Part (a)** is a simulation over a min-heap keyed by (freeTime, agentIndex) — the tuple comparison implements the "lowest index wins ties" rule with no extra code. Pop the earliest-free agent M times, each time re-pushing it at freeTime + its service time; the next pop's freeTime is when you get served.

**Part (b)** flips to math: in time T, agent i finishes floor(T / times[i]) customers, and that total is monotone non-decreasing in T — binary search the smallest T reaching M.

\`\`\`python
import heapq


def wait_time(times, m):
    heap = [(0, i) for i in range(len(times))]
    heapq.heapify(heap)
    for _ in range(m):
        free_at, agent = heapq.heappop(heap)
        heapq.heappush(heap, (free_at + times[agent], agent))
    return heap[0][0]


def min_time_to_serve(times, m):
    if m == 0:
        return 0
    lo, hi = 1, min(times) * m
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(mid // t for t in times) >= m:
            hi = mid
        else:
            lo = mid + 1
    return lo
\`\`\`

Part (a) is O(M log N); part (b) is O(N log(min(times) × M)). The follow-up about M = 10^9 in part (a) is answered by part (b)'s idea run backward: binary search the time T at which M customers have **started**, i.e. sum of (floor((T - 1) / times[i]) + 1) over agents reaches M + 1 — the heap version is what interviews expect first, the search is the scale answer.`,
    judge: {
      starterCode: `/**
 * Part (a): with M customers ahead of you, when does your service start?
 * @param {number[]} times
 * @param {number} m
 * @returns {number}
 */
function waitTime(times, m) {
  // Your code here
  return 0;
}

/**
 * Part (b): smallest T with sum(floor(T / times[i])) >= m.
 * @returns {number}
 */
function minTimeToServe(times, m) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeTellers",
      driverCode: `function __judgeTellers(op, times, m) {
  return op === "wait" ? waitTime(times, m) : minTimeToServe(times, m);
}`,
      tests: [
        { name: "Screen example: five ahead of you", input: ["wait", [2, 3, 1, 5], 5], expected: 2 },
        { name: "Empty queue means no wait", input: ["wait", [4, 7], 0], expected: 0 },
        { name: "Fewer customers than agents", input: ["wait", [5, 5, 5], 2], expected: 0 },
        { name: "Single slow agent", input: ["wait", [3], 4], expected: 12 },
        { name: "Ties go to the lowest agent", input: ["wait", [2, 2], 3], expected: 2 },
        { name: "Screen example, part (b)", input: ["finish", [2, 3, 1, 5], 5], expected: 3 },
        { name: "Zero customers finish at zero", input: ["finish", [2, 3], 0], expected: 0 },
        { name: "One agent does all the work", input: ["finish", [7], 3], expected: 21 },
      ],
    },
  },
  {
    slug: "first-word-with-prefix",
    title: "First Word Containing a Prefix",
    category: "algorithms",
    difficulty: "easy",
    companies: ["pinterest"],
    summary: "lower_bound on the prefix itself — the follow-ups are the round.",
    prompt: `You are given words, sorted ascending (duplicates allowed), and a prefix. Return the index of the **first** word that starts with prefix, or -1. Aim for O(log n) string comparisons.

\`\`\`
words = ["a", "apple", "appz", "b"]
prefix "ap"  => 1
prefix "b"   => 3
prefix "c"   => -1
prefix ""    => 0     (every word starts with "")
\`\`\`

Up to 10^5 words of lowercase a-z, lengths up to 100.

## Follow-ups (these carry the round)

- Return the whole inclusive range [first, last] of matching indexes, or [-1, -1]: matchRange(words, prefix).
- Many queries against one list — preprocess so each query costs O(len(prefix)) regardless of n. (A trie storing first index and count per node.)`,
    hints: [
      "Every word starting with prefix is >= prefix, and every word < prefix can't start with it — so lower_bound(prefix) is either the answer or proof there is none.",
      "Check startswith once after the search; the binary search alone can't confirm the match.",
      "For the range: matches are contiguous, and every match is < prefix with its last character incremented — upper-bound on that boosted string finds the end.",
    ],
    solution: `## Approach

The insight worth saying out loud: words matching the prefix form a **contiguous block**, and that block is exactly the smallest words that are >= prefix. So lower_bound(words, prefix) lands on the first match if one exists — verify with startswith. For the range follow-up, every match sorts strictly below the prefix with its final character bumped (\\"ap\\" -> \\"aq\\"), so lower_bound on the bumped string, minus one, is the last match.

\`\`\`python
def lower_bound(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


def first_match(words, prefix):
    i = lower_bound(words, prefix)
    if i < len(words) and words[i].startswith(prefix):
        return i
    return -1


def match_range(words, prefix):
    first = first_match(words, prefix)
    if first == -1:
        return [-1, -1]
    if prefix == "":
        return [0, len(words) - 1]
    bumped = prefix[:-1] + chr(ord(prefix[-1]) + 1)
    return [first, lower_bound(words, bumped) - 1]
\`\`\`

O(L log n) per query for prefix length L. The empty prefix matches everything (handle it before bumping a nonexistent last character). For many queries, build a trie once — each node stores the index of the first word through it and how many pass through — and a query walks len(prefix) nodes flat.`,
    judge: {
      starterCode: `/**
 * Index of the first word starting with prefix, or -1.
 * @param {string[]} words - sorted ascending, duplicates allowed
 * @param {string} prefix
 * @returns {number}
 */
function firstMatch(words, prefix) {
  // Your code here
  return -1;
}

/**
 * Inclusive [first, last] of matching indexes, or [-1, -1].
 * @returns {[number, number]}
 */
function matchRange(words, prefix) {
  // Your code here
  return [-1, -1];
}
`,
      entry: "__judgePrefix",
      driverCode: `function __judgePrefix(op, words, prefix) {
  return op === "first" ? firstMatch(words, prefix) : matchRange(words, prefix);
}`,
      tests: [
        { name: "Middle of the list", input: ["first", ["a", "apple", "appz", "b"], "ap"], expected: 1 },
        { name: "Last word", input: ["first", ["a", "apple", "appz", "b"], "b"], expected: 3 },
        { name: "No match", input: ["first", ["a", "apple", "appz", "b"], "c"], expected: -1 },
        { name: "Empty prefix matches everything", input: ["first", ["a", "apple", "appz", "b"], ""], expected: 0 },
        { name: "Empty word list", input: ["first", [], "a"], expected: -1 },
        { name: "Prefix between words", input: ["first", ["ab", "ad"], "ac"], expected: -1 },
        { name: "Range across duplicates", input: ["range", ["ap", "app", "apple", "apple", "aq"], "app"], expected: [1, 3] },
        { name: "Range with prefix ending in z", input: ["range", ["az", "azz", "b"], "az"], expected: [0, 1] },
        { name: "Empty prefix range is the whole list", input: ["range", ["a", "b", "c"], ""], expected: [0, 2] },
        { name: "Range with no match", input: ["range", ["a", "b"], "q"], expected: [-1, -1] },
      ],
    },
  },
];
