import type { Problem } from "./types";

// Pinterest onsite bank, part E: bank tellers (when am I served, and how
// long do M customers take) and prefix search over a sorted list (the first
// match, and the whole matching range).

export const pinterestProblemsE: Problem[] = [
  {
    slug: "bank-teller-wait-time",
    title: "Bank Tellers: Wait Time",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "A min-heap of (free time, agent) — tuple order breaks the ties.",
    prompt: `A bank has N agents; agent i always takes times[i] minutes per customer. Customers wait in one queue and there are M customers **ahead of you**. All agents are free at time 0; whenever one frees up, the next customer walks over. If several free up at the same moment, the **lowest-numbered** agent takes the next customer. Return the time at which an agent starts serving you.

\`\`\`
times = [2, 3, 1, 5], M = 5  =>  2
t=0: customers 1-4 take agents 0,1,2,3 (free again at 2,3,1,5)
t=1: agent 2 frees -> customer 5 (free again at 2)
t=2: agents 0 and 2 both free -> you go to agent 0
\`\`\`

N up to 10^5, times[i] up to 10^7.`,
    hints: [
      "A min-heap of (freeTime, agentIndex). Tuple ordering gives the tie-break for free — equal times pop the lower index first.",
      "Serve the M customers ahead of you by popping and pushing (freeTime + times[agent], agent); your start time is the freeTime of the next pop.",
    ],
    solution: `## Approach

A simulation over a min-heap keyed by (freeTime, agentIndex) — the tuple comparison implements the "lowest index wins ties" rule with no extra code. Pop the earliest-free agent M times, each time re-pushing it at freeTime + its service time; the next pop's freeTime is when you get served.

\`\`\`python
import heapq


def wait_time(times, m):
    heap = [(0, i) for i in range(len(times))]
    heapq.heapify(heap)
    for _ in range(m):
        free_at, agent = heapq.heappop(heap)
        heapq.heappush(heap, (free_at + times[agent], agent))
    return heap[0][0]
\`\`\`

O(N + M log N).

## Worth saying out loud

- Why the heap breaks ties correctly: among agents free at the same time, the tuple (time, index) compares indexes next, so the lowest-numbered one pops first — exactly the rule.
- When M is around 10^9, simulating every customer is too slow. Binary search the time T at which M + 1 customers have **started** — agent i has started floor((T − 1) / times[i]) + 1 customers by time T — and that T is when you are served.
- If each customer needs a different amount of service, the heap still works; each push adds that customer's duration instead of the agent's fixed time.`,
    judge: {
      starterCode: `/**
 * With M customers ahead of you, when does your service start?
 * @param {number[]} times - agent i takes times[i] minutes per customer
 * @param {number} m
 * @returns {number}
 */
function waitTime(times, m) {
  // Your code here
  return 0;
}
`,
      entry: "waitTime",
      tests: [
        { name: "Five customers ahead of you", input: [[2, 3, 1, 5], 5], expected: 2 },
        { name: "Empty queue means no wait", input: [[4, 7], 0], expected: 0 },
        { name: "Fewer customers than agents", input: [[5, 5, 5], 2], expected: 0 },
        { name: "Single slow agent", input: [[3], 4], expected: 12 },
        { name: "Ties go to the lowest agent", input: [[2, 2], 3], expected: 2 },
      ],
    },
  },
  {
    slug: "bank-tellers-finish-time",
    title: "Bank Tellers: Minimum Time to Serve Everyone",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "The count served by time T is monotone — binary search T.",
    prompt: `A bank has N agents; agent i takes times[i] minutes per customer and serves customers back to back. M customers are waiting, and you may assign them to agents however you like. Return the **minimum time** by which all M customers have been served — the smallest T such that the sum over agents of floor(T / times[i]) is at least M.

\`\`\`
times = [2, 3, 1, 5], M = 5  =>  3
T = 2: 1 + 0 + 2 + 0 = 3 customers done
T = 3: 1 + 1 + 3 + 0 = 5 customers done
\`\`\`

N up to 10^5, times[i] up to 10^7, M up to 10^9.`,
    hints: [
      "In time T, agent i finishes floor(T / times[i]) customers. That total never decreases as T grows.",
      "So binary search T: lo = 1 and hi = min(times) × M, since the fastest agent alone finishes everyone by then.",
    ],
    solution: `## Approach

Flip the question around: instead of assigning customers, ask how many can be done by time T. Agent i finishes floor(T / times[i]) of them, and the total is monotone non-decreasing in T, so binary search the smallest T that reaches M. The fastest agent working alone gives a safe upper bound of min(times) × M.

\`\`\`python
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

O(N log(min(times) × M)).

## Worth saying out loud

- Name the pattern: binary search on the answer, which works whenever "can it be done by T?" is monotone in T.
- The upper bound matters for overflow: min(times) × M reaches 10^16, beyond 32-bit integers but well within 64-bit ones (and exact in a double up to 2^53).`,
    judge: {
      starterCode: `/**
 * Smallest T with sum(floor(T / times[i])) >= m.
 * @param {number[]} times - agent i takes times[i] minutes per customer
 * @param {number} m
 * @returns {number}
 */
function minTimeToServe(times, m) {
  // Your code here
  return 0;
}
`,
      entry: "minTimeToServe",
      tests: [
        { name: "Five customers across four agents", input: [[2, 3, 1, 5], 5], expected: 3 },
        { name: "Zero customers finish at zero", input: [[2, 3], 0], expected: 0 },
        { name: "One agent does all the work", input: [[7], 3], expected: 21 },
        { name: "Equal agents share evenly", input: [[4, 4, 4], 7], expected: 12 },
        { name: "A billion customers", input: [[1, 2], 1000000000], expected: 666666667 },
      ],
    },
  },
  {
    slug: "first-word-with-prefix",
    title: "First Word Containing a Prefix",
    category: "algorithms",
    difficulty: "easy",
    companies: ["pinterest"],
    summary: "lower_bound on the prefix itself, then one startswith check.",
    prompt: `You are given words, sorted ascending (duplicates allowed), and a prefix. Return the index of the **first** word that starts with prefix, or -1. Aim for O(log n) string comparisons.

\`\`\`
words = ["a", "apple", "appz", "b"]
prefix "ap"  => 1
prefix "b"   => 3
prefix "c"   => -1
prefix ""    => 0     (every word starts with "")
\`\`\`

Up to 10^5 words of lowercase a-z, lengths up to 100.`,
    hints: [
      "Every word starting with prefix is >= prefix, and every word < prefix can't start with it — so lower_bound(prefix) is either the answer or proof there is none.",
      "Check startswith once after the search; the binary search alone can't confirm the match.",
    ],
    solution: `## Approach

The insight worth saying out loud: words matching the prefix form a **contiguous block**, and that block is exactly the smallest words that are >= prefix. So lower_bound(words, prefix) lands on the first match if one exists — verify with startswith.

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
\`\`\`

O(L log n) per query for prefix length L.

## Worth saying out loud

- For many queries against one list, build a trie once — each node stores the index of the first word through it and how many words pass through — and a query walks len(prefix) nodes regardless of n.
- The whole block of matches is one more binary search away: see [Range of Words Matching a Prefix](/problems/prefix-match-range).`,
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
`,
      entry: "firstMatch",
      tests: [
        { name: "Middle of the list", input: [["a", "apple", "appz", "b"], "ap"], expected: 1 },
        { name: "Last word", input: [["a", "apple", "appz", "b"], "b"], expected: 3 },
        { name: "No match", input: [["a", "apple", "appz", "b"], "c"], expected: -1 },
        { name: "Empty prefix matches everything", input: [["a", "apple", "appz", "b"], ""], expected: 0 },
        { name: "Empty word list", input: [[], "a"], expected: -1 },
        { name: "Prefix between words", input: [["ab", "ad"], "ac"], expected: -1 },
      ],
    },
  },
  {
    slug: "prefix-match-range",
    title: "Range of Words Matching a Prefix",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Matches are contiguous: lower_bound the prefix, then the prefix bumped by one.",
    prompt: `You are given words, sorted ascending (duplicates allowed), and a prefix. Return the inclusive range [first, last] of the indexes of the words that start with prefix, or [-1, -1] if none do. Aim for O(log n) string comparisons.

\`\`\`
words = ["ap", "app", "apple", "apple", "aq"]
prefix "app"  => [1, 3]
prefix "b"    => [-1, -1]
prefix ""     => [0, 4]     (every word starts with "")
\`\`\`

Up to 10^5 words of lowercase a-z, lengths up to 100.`,
    hints: [
      "The matches are contiguous, and the first one is lower_bound(prefix) — if the word there starts with prefix at all.",
      "Every match sorts strictly below the prefix with its last character incremented (\"ap\" -> \"aq\"). lower_bound on that bumped string, minus one, is the last match.",
      "The empty prefix has no last character to bump — it matches the whole list.",
    ],
    solution: `## Approach

Words matching the prefix form a **contiguous block**. Its start is lower_bound(words, prefix), confirmed with startswith. For its end, note that every match sorts strictly below the prefix with its final character bumped ("ap" -> "aq"), while every word after the block sorts at or above it — so lower_bound on the bumped string, minus one, is the last match.

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


def match_range(words, prefix):
    first = lower_bound(words, prefix)
    if first == len(words) or not words[first].startswith(prefix):
        return [-1, -1]
    if prefix == "":
        return [0, len(words) - 1]
    bumped = prefix[:-1] + chr(ord(prefix[-1]) + 1)
    return [first, lower_bound(words, bumped) - 1]
\`\`\`

O(L log n) for prefix length L.

## Worth saying out loud

- Bumping "z" gives "{", which sorts after every lowercase letter, so prefixes ending in z need no special case.
- The alternative to bumping is a second binary search with a custom predicate: the first index whose word is greater than the prefix and does not start with it.`,
    judge: {
      starterCode: `/**
 * Inclusive [first, last] of the indexes of words starting with prefix,
 * or [-1, -1].
 * @param {string[]} words - sorted ascending, duplicates allowed
 * @param {string} prefix
 * @returns {[number, number]}
 */
function matchRange(words, prefix) {
  // Your code here
  return [-1, -1];
}
`,
      entry: "matchRange",
      tests: [
        { name: "Range across duplicates", input: [["ap", "app", "apple", "apple", "aq"], "app"], expected: [1, 3] },
        { name: "Range with prefix ending in z", input: [["az", "azz", "b"], "az"], expected: [0, 1] },
        { name: "Empty prefix range is the whole list", input: [["a", "b", "c"], ""], expected: [0, 2] },
        { name: "Range with no match", input: [["a", "b"], "q"], expected: [-1, -1] },
        { name: "Single match at the end", input: [["a", "apple", "appz", "b"], "b"], expected: [3, 3] },
        { name: "Empty word list", input: [[], "a"], expected: [-1, -1] },
      ],
    },
  },
];
