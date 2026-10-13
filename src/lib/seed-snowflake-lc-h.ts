import type { Problem } from "./types";

// Snowflake coding bank, LeetCode tag part H: a good subsequence with
// bounded changes, the lone element of a sorted pairs array, adding two
// reversed numbers, word search on a grid, sub-folder removal, and the
// most valuable k events. Judged in JavaScript and Python; the Python judges
// live in seed-python-snowflake-j.ts.

export const snowflakeLcProblemsH: Problem[] = [
  {
    slug: "maximum-length-good-subsequence",
    title: "Find the Maximum Length of a Good Subsequence",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "dp by (changes used, last value); the O(nk) version keeps the two best values per change count so any other value is one lookup away.",
    prompt: [
      "A subsequence is **good** when at most `k` of its adjacent pairs differ. Return the length of the longest good subsequence of `nums`. The small version allows `n ≤ 200` and `k ≤ 25`; the large version allows `n ≤ 5000` and `k ≤ 50`, so aim for O(n × k).",
      "",
      "```",
      "maximumLength([1, 2, 1, 1, 3], 2)        ->  4    // [1, 2, 1, 1]",
      "maximumLength([1, 2, 3, 4, 5, 1], 0)     ->  2",
      "```",
    ].join("\n"),
    hints: [
      "State: the longest good subsequence ending in value v using exactly j changes. Extending with the same value keeps j; extending from a different value costs one change.",
      "O(n²k) compares every earlier index; O(nk) keeps, per j, a map from value to length plus the two largest lengths with distinct values, so \"best ending in a different value\" is a constant-time lookup.",
    ],
    solution: [
      "## Approach",
      "",
      "For each change budget `j` keep `best[j][v]`, the longest good subsequence using exactly `j` changes that ends in value `v`, plus the top two entries of that map with distinct values. Processing `x`, for `j` from `k` down to 0: extending a subsequence that already ends in `x` costs nothing (`best[j][x] + 1`), and extending one with `j − 1` changes that ends in a different value costs one change — the top-two structure gives the best such value whether or not the overall maximum happens to be `x`. Iterating `j` downward keeps the `j − 1` lookups free of the current element.",
      "",
      "## Complexity",
      "",
      "O(n × k) time; O(n × k) space in the worst case.",
      "",
      "## Worth saying out loud",
      "",
      "- The O(n²k) table over (index, changes) is the natural first answer and passes the small limits; the top-two trick is what the large limits are asking for.",
      "- \"Exactly j changes\" rather than \"at most\" keeps the transitions clean; the answer is the maximum over all j.",
    ].join("\n"),
    judge: {
      solutionCode: `// best[j]: value -> longest with exactly j changes ending in value; top[j]: two best distinct values.
function maximumLength(nums, k) {
  const best = Array.from({ length: k + 1 }, () => new Map());
  const top = Array.from({ length: k + 1 }, () => [[0, null], [0, null]]);
  let answer = 0;
  for (const x of nums) {
    for (let j = k; j >= 0; j--) {
      let len = (best[j].get(x) ?? 0) + 1;
      if (j > 0) {
        const [first, second] = top[j - 1];
        const other = first[1] === x ? second[0] : first[0];
        len = Math.max(len, other + 1);
      }
      if (len > (best[j].get(x) ?? 0)) {
        best[j].set(x, len);
        const t = top[j];
        if (t[0][1] === x) t[0][0] = len;
        else if (len > t[0][0]) {
          t[1] = t[0];
          t[0] = [len, x];
        } else if (len > t[1][0]) t[1] = [len, x];
      }
      answer = Math.max(answer, len);
    }
  }
  return answer;
}
`,
      starterCode: `/**
 * @param {number[]} nums
 * @param {number} k allowed adjacent pairs that differ
 * @returns {number} the longest good subsequence's length
 */
function maximumLength(nums, k) {
  // Your code here
  return 0;
}
`,
      entry: "maximumLength",
      tests: [
        { name: "Prompt example", input: [[1, 2, 1, 1, 3], 2], expected: 4 },
        { name: "No changes allowed", input: [[1, 2, 3, 4, 5, 1], 0], expected: 2 },
        { name: "One element", input: [[1], 0], expected: 1 },
        { name: "All equal", input: [[1, 1, 1], 0], expected: 3 },
        { name: "One change", input: [[1, 2, 3], 1], expected: 2 },
        { name: "Enough changes for everything", input: [[1, 2, 1, 2], 3], expected: 4 },
        { name: "Alternating with one change", input: [[1, 2, 1, 2], 1], expected: 3 },
      ],
    },
  },
  {
    slug: "single-element-in-sorted-array",
    title: "Single Element in a Sorted Array",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Before the single element, pairs start at even indices; after it, at odd ones — binary search on that parity.",
    prompt: [
      "A sorted array has every element appearing exactly twice except one, which appears once. Find it in O(log n) time and O(1) space.",
      "",
      "```",
      "singleNonDuplicate([1, 1, 2, 3, 3, 4, 4, 8, 8])  ->  2",
      "singleNonDuplicate([3, 3, 7, 7, 10, 11, 11])     ->  10",
      "```",
    ].join("\n"),
    hints: ["Look at an even index mid: if it equals its right neighbour the single element is to the right of the pair, otherwise it is at or to the left of mid."],
    solution: [
      "## Approach",
      "",
      "Binary search over even indices. Left of the single element, every pair occupies positions (even, odd); right of it, (odd, even). So at an even `mid`, `nums[mid] === nums[mid + 1]` means the lone element is further right (skip past the pair), and anything else means it is at `mid` or to the left. The loop ends with `lo` on the answer.",
      "",
      "## Complexity",
      "",
      "O(log n) time; O(1) space.",
      "",
      "## Worth saying out loud",
      "",
      "- XOR of the whole array finds it in O(n) and is the answer when the array is not sorted; the sorted order is what buys the log.",
      "- Forcing `mid` to be even (decrement when odd) is the one line that makes the parity argument hold.",
    ].join("\n"),
    judge: {
      solutionCode: `function singleNonDuplicate(nums) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo < hi) {
    let mid = (lo + hi) >> 1;
    if (mid % 2 === 1) mid--;
    if (nums[mid] === nums[mid + 1]) lo = mid + 2;
    else hi = mid;
  }
  return nums[lo];
}
`,
      starterCode: `/**
 * @param {number[]} nums sorted, every value twice except one
 * @returns {number} the value that appears once
 */
function singleNonDuplicate(nums) {
  // Your code here
  return 0;
}
`,
      entry: "singleNonDuplicate",
      tests: [
        { name: "Early single", input: [[1, 1, 2, 3, 3, 4, 4, 8, 8]], expected: 2 },
        { name: "Late single", input: [[3, 3, 7, 7, 10, 11, 11]], expected: 10 },
        { name: "One element", input: [[1]], expected: 1 },
        { name: "Single at the end", input: [[1, 1, 2]], expected: 2 },
        { name: "Single at the start", input: [[1, 2, 2]], expected: 1 },
        { name: "Single after two pairs", input: [[1, 1, 2, 2, 3]], expected: 3 },
      ],
    },
  },
  {
    slug: "add-two-numbers",
    title: "Add Two Numbers",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Digit-by-digit addition with a carry, least significant digit first, and a final carry that may add a digit.",
    prompt: [
      "Two non-negative integers are given as lists of digits in **reverse** order (least significant digit first), as a linked list would hold them. Return their sum in the same form, with no leading zeros except for the number `0` itself.",
      "",
      "```",
      "addTwoNumbers([2, 4, 3], [5, 6, 4])  ->  [7, 0, 8]     // 342 + 465 = 807",
      "addTwoNumbers([0], [0])              ->  [0]",
      "```",
    ].join("\n"),
    hints: ["Walk both lists together with a carry; keep going while either has digits left or the carry is set."],
    solution: [
      "## Approach",
      "",
      "Schoolbook addition, which the reversed order makes convenient: walk both lists from the front, add the two digits and the carry, emit the units digit, keep the tens as the next carry. Continue while either list has digits or a carry remains, so an extra final digit appears when needed.",
      "",
      "## Complexity",
      "",
      "O(max(m, n)) time and output.",
      "",
      "## Worth saying out loud",
      "",
      "- With real linked lists, a dummy head and a tail pointer keep the append simple; the loop is identical.",
      "- The forward-order variant (most significant digit first) reverses the lists or uses two stacks.",
    ].join("\n"),
    judge: {
      solutionCode: `function addTwoNumbers(l1, l2) {
  const out = [];
  let carry = 0;
  for (let i = 0; i < l1.length || i < l2.length || carry; i++) {
    const sum = (l1[i] ?? 0) + (l2[i] ?? 0) + carry;
    out.push(sum % 10);
    carry = Math.floor(sum / 10);
  }
  return out;
}
`,
      starterCode: `/**
 * @param {number[]} l1 digits, least significant first
 * @param {number[]} l2 digits, least significant first
 * @returns {number[]} the sum's digits, least significant first
 */
function addTwoNumbers(l1, l2) {
  // Your code here
  return [];
}
`,
      entry: "addTwoNumbers",
      tests: [
        { name: "Prompt example", input: [[2, 4, 3], [5, 6, 4]], expected: [7, 0, 8] },
        { name: "Zeros", input: [[0], [0]], expected: [0] },
        { name: "Carries ripple to a new digit", input: [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], expected: [8, 9, 9, 9, 0, 0, 0, 1] },
        { name: "Different lengths", input: [[1], [9, 9]], expected: [0, 0, 1] },
        { name: "A single carry", input: [[5], [5]], expected: [0, 1] },
      ],
    },
  },
  {
    slug: "word-search",
    title: "Word Search",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Backtracking from every cell: mark the cell, try the four neighbours for the next letter, unmark on the way out.",
    prompt: [
      "Return whether `word` can be traced in a grid of letters by moving between four-directionally adjacent cells without reusing a cell.",
      "",
      "```",
      "board = [[\"A\", \"B\", \"C\", \"E\"],",
      "         [\"S\", \"F\", \"C\", \"S\"],",
      "         [\"A\", \"D\", \"E\", \"E\"]]",
      "exist(board, \"ABCCED\")  ->  true",
      "exist(board, \"SEE\")     ->  true",
      "exist(board, \"ABCB\")    ->  false",
      "```",
    ].join("\n"),
    hints: [
      "Depth-first search carrying the index of the next letter; a cell qualifies when it is in bounds, unused and holds that letter.",
      "Mark the cell before recursing and unmark after, so other paths may use it.",
    ],
    solution: [
      "## Approach",
      "",
      "Try every cell as a start. The recursive step checks the current cell against the next letter of the word, marks it used, recurses into the four neighbours for the following letter, and unmarks it before returning. Finding the last letter returns true all the way up.",
      "",
      "## Complexity",
      "",
      "O(rows × cols × 3^L) time in the worst case; O(L) recursion depth.",
      "",
      "## Worth saying out loud",
      "",
      "- Pruning: give up early when the grid lacks a letter the word needs more copies of than exist.",
      "- Searching many words at once is [Word Search on a Letter Grid](/problems/word-search-trie), where a trie shares the prefixes.",
    ].join("\n"),
    judge: {
      solutionCode: `function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  const used = board.map((row) => row.map(() => false));
  const search = (r, c, i) => {
    if (i === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols || used[r][c] || board[r][c] !== word[i]) return false;
    used[r][c] = true;
    const found = search(r + 1, c, i + 1) || search(r - 1, c, i + 1) || search(r, c + 1, i + 1) || search(r, c - 1, i + 1);
    used[r][c] = false;
    return found;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (search(r, c, 0)) return true;
    }
  }
  return false;
}
`,
      starterCode: `/**
 * @param {string[][]} board single letters
 * @param {string} word
 * @returns {boolean}
 */
function exist(board, word) {
  // Your code here
  return false;
}
`,
      entry: "exist",
      tests: [
        { name: "A winding path", input: [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCCED"], expected: true },
        { name: "A short word", input: [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "SEE"], expected: true },
        { name: "Cells cannot be reused", input: [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCB"], expected: false },
        { name: "One cell", input: [[["a"]], "a"], expected: true },
        { name: "Around the square", input: [[["a", "b"], ["c", "d"]], "abdc"], expected: true },
        { name: "Not enough letters", input: [[["a", "a"]], "aaa"], expected: false },
      ],
    },
  },
  {
    slug: "remove-sub-folders",
    title: "Remove Sub-Folders From the Filesystem",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Sort the paths; a folder is a sub-folder exactly when it starts with the last kept folder plus a slash.",
    prompt: [
      "Given folder paths, remove every folder that is a sub-folder of another in the list, and return the rest sorted. `/a/b` is a sub-folder of `/a`; `/a/bc` is not.",
      "",
      "```",
      "removeSubfolders([\"/a\", \"/a/b\", \"/c/d\", \"/c/d/e\", \"/c/f\"])  ->  [\"/a\", \"/c/d\", \"/c/f\"]",
      "removeSubfolders([\"/a/b/c\", \"/a/b/ca\", \"/a/b/d\"])          ->  [\"/a/b/c\", \"/a/b/ca\", \"/a/b/d\"]",
      "```",
    ].join("\n"),
    hints: ["After sorting, a parent comes right before all of its descendants. Keep a path unless it starts with the previously kept path followed by `/`."],
    solution: [
      "## Approach",
      "",
      "Sort the paths lexicographically so every folder precedes its sub-folders. Walk them keeping the last kept folder: the current path is dropped when it starts with that folder plus `/`, which rules out the `/a` versus `/ab` false positive; otherwise it is kept and becomes the new reference.",
      "",
      "## Complexity",
      "",
      "O(n log n × L) time; O(n) output.",
      "",
      "## Worth saying out loud",
      "",
      "- The trailing slash in the comparison is the whole correctness argument; test `/a` against `/ab`.",
      "- A trie of path segments answers it without sorting and is the better structure when paths arrive as a stream.",
    ].join("\n"),
    judge: {
      solutionCode: `function removeSubfolders(folder) {
  const sorted = [...folder].sort();
  const kept = [];
  for (const path of sorted) {
    if (kept.length && path.startsWith(kept[kept.length - 1] + "/")) continue;
    kept.push(path);
  }
  return kept;
}
`,
      starterCode: `/**
 * @param {string[]} folder absolute paths without trailing slashes
 * @returns {string[]} the paths that are not sub-folders, sorted
 */
function removeSubfolders(folder) {
  // Your code here
  return [];
}
`,
      entry: "removeSubfolders",
      tests: [
        { name: "Prompt example", input: [["/a", "/a/b", "/c/d", "/c/d/e", "/c/f"]], expected: ["/a", "/c/d", "/c/f"] },
        { name: "Everything under one root", input: [["/a", "/a/b/c", "/a/b/d"]], expected: ["/a"] },
        { name: "Prefixes that are not parents", input: [["/a/b/c", "/a/b/ca", "/a/b/d"]], expected: ["/a/b/c", "/a/b/ca", "/a/b/d"] },
        { name: "A single folder", input: [["/a"]], expected: ["/a"] },
        { name: "Output is sorted", input: [["/ab", "/a"]], expected: ["/a", "/ab"] },
      ],
    },
  },
  {
    slug: "max-events-attended-ii",
    title: "Maximum Number of Events That Can Be Attended II",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Sort by end day; dp[i][j] takes event i on top of the best j − 1 events that end before it starts, found by binary search.",
    prompt: [
      "Each event has a start day, an end day (inclusive) and a value. Attend at most `k` events, none overlapping even on a single day, and attend each chosen event in full. Return the maximum total value.",
      "",
      "```",
      "maxValue([[1, 2, 4], [3, 4, 3], [2, 3, 1]], 2)   ->  7",
      "maxValue([[1, 2, 4], [3, 4, 3], [2, 3, 10]], 2)  ->  10",
      "maxValue([[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]], 3)  ->  9",
      "```",
    ].join("\n"),
    hints: [
      "Sort events by end day. For event i, the events compatible with it are a prefix: those ending strictly before its start, found by binary search.",
      "dp[i][j] = best value using the first i events with at most j attended = max(skip, take): take = dp[p][j − 1] + value, where p is the compatible prefix length.",
    ],
    solution: [
      "## Approach",
      "",
      "Weighted interval scheduling with a count. Sort by end day; then for each event the set of earlier compatible events is a prefix of the sorted order, located by binary search on end days (strictly less than this start, since days are inclusive). The table `dp[i][j]` holds the best value from the first `i` events using at most `j`; each cell is the better of skipping event `i` and taking it on top of `dp[p][j − 1]`. The answer is `dp[n][k]`.",
      "",
      "## Complexity",
      "",
      "O(n log n + n × k) time; O(n × k) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Without the count limit this is the classic weighted interval scheduling problem, the same table with one column; [Maximum Profit in Job Scheduling](/problems/job-scheduling-max-profit) is exactly that.",
      "- Inclusive end days are the off-by-one trap: an event ending on day 3 conflicts with one starting on day 3.",
    ].join("\n"),
    judge: {
      solutionCode: `function maxValue(events, k) {
  const sorted = [...events].sort((a, b) => a[1] - b[1]);
  const n = sorted.length;
  const ends = sorted.map((e) => e[1]);
  const dp = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const [start, , value] = sorted[i - 1];
    let lo = 0;
    let hi = i - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] < start) lo = mid + 1;
      else hi = mid;
    }
    for (let j = 1; j <= k; j++) {
      dp[i][j] = Math.max(dp[i - 1][j], dp[lo][j - 1] + value);
    }
  }
  return dp[n][k];
}
`,
      starterCode: `/**
 * @param {number[][]} events [start, end, value], end inclusive
 * @param {number} k the most events to attend
 * @returns {number} the best total value
 */
function maxValue(events, k) {
  // Your code here
  return 0;
}
`,
      entry: "maxValue",
      tests: [
        { name: "Prompt example", input: [[[1, 2, 4], [3, 4, 3], [2, 3, 1]], 2], expected: 7 },
        { name: "One valuable event", input: [[[1, 2, 4], [3, 4, 3], [2, 3, 10]], 2], expected: 10 },
        { name: "Three of four", input: [[[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]], 3], expected: 9 },
        { name: "A single event", input: [[[1, 5, 10]], 1], expected: 10 },
        { name: "Inclusive end days overlap", input: [[[1, 2, 5], [2, 3, 6]], 2], expected: 6 },
        { name: "Only one allowed", input: [[[1, 1, 1], [2, 2, 2]], 1], expected: 2 },
      ],
    },
  },
];
