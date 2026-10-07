import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part N: a circular queue, N-Queens, and the
// encoded-strings equivalence. Judged in JavaScript and Python; the Python
// judges live in seed-python-snowflake-e.ts.

export const snowflakeProblemsN: Problem[] = [
  {
    slug: "design-circular-queue",
    title: "Design a Circular Queue",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A fixed array, a head index and a count — the count is what tells empty from full.",
    prompt: [
      "Design a fixed-capacity FIFO queue on a ring buffer:",
      "",
      "```",
      "new MyCircularQueue(k)",
      "enQueue(value)  -> true if inserted, false when full",
      "deQueue()       -> true if removed, false when empty",
      "Front()         -> the front value, or -1 when empty",
      "Rear()          -> the back value, or -1 when empty",
      "isEmpty()",
      "isFull()",
      "```",
    ].join("\n"),
    hints: [
      "Store the elements in an array of length k with a head index and a count; the tail is (head + count) mod k.",
      "Tracking the count avoids the classic ambiguity where head equals tail for both an empty and a full queue.",
    ],
    solution: [
      "## Approach",
      "",
      "A ring buffer: an array of size `k`, `head`, and `size`. Enqueue writes at `(head + size) % k` and increments `size`; dequeue advances `head` modulo `k` and decrements `size`; `Rear` lives at `(head + size - 1) % k`. Keeping the size explicit makes empty and full distinct without wasting a slot.",
      "",
      "## Complexity",
      "",
      "O(1) per operation, O(k) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The alternative sentinel — leave one slot unused so head == tail means empty — is the design to mention if asked why size is stored.",
      "- Thread safety is a lock around each operation, or a single-producer single-consumer design where head and tail are owned by different threads.",
    ].join("\n"),
    judge: {
      solutionCode: `// Ring buffer with an explicit size, so empty and full are distinct.
class MyCircularQueue {
  constructor(k) {
    this.data = new Array(k);
    this.head = 0;
    this.size = 0;
  }

  enQueue(value) {
    if (this.isFull()) return false;
    this.data[(this.head + this.size) % this.data.length] = value;
    this.size++;
    return true;
  }

  deQueue() {
    if (this.isEmpty()) return false;
    this.head = (this.head + 1) % this.data.length;
    this.size--;
    return true;
  }

  Front() {
    return this.isEmpty() ? -1 : this.data[this.head];
  }

  Rear() {
    return this.isEmpty() ? -1 : this.data[(this.head + this.size - 1) % this.data.length];
  }

  isEmpty() {
    return this.size === 0;
  }

  isFull() {
    return this.size === this.data.length;
  }
}
`,
      starterCode: `class MyCircularQueue {
  constructor(k) {
    // Your state here
  }

  enQueue(value) {
    return false;
  }

  deQueue() {
    return false;
  }

  Front() {
    return -1;
  }

  Rear() {
    return -1;
  }

  isEmpty() {
    return true;
  }

  isFull() {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("MyCircularQueue"),
      tests: [
        {
          name: "Fill, read the rear, wrap around",
          input: [
            ["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull", "deQueue", "enQueue", "Rear"],
            [[3], [1], [2], [3], [4], [], [], [], [4], []],
          ],
          expected: [null, true, true, true, false, 3, true, true, true, 4],
        },
        {
          name: "Empty queue answers",
          input: [
            ["MyCircularQueue", "Front", "Rear", "deQueue", "isEmpty", "isFull"],
            [[2], [], [], [], [], []],
          ],
          expected: [null, -1, -1, false, true, false],
        },
        {
          name: "Front moves as items leave",
          input: [
            ["MyCircularQueue", "enQueue", "enQueue", "Front", "deQueue", "Front", "deQueue", "isEmpty"],
            [[2], [5], [6], [], [], [], [], []],
          ],
          expected: [null, true, true, 5, true, 6, true, true],
        },
        {
          name: "Capacity one",
          input: [
            ["MyCircularQueue", "enQueue", "enQueue", "Front", "Rear", "deQueue", "enQueue", "Rear"],
            [[1], [9], [8], [], [], [], [7], []],
          ],
          expected: [null, true, false, 9, 9, true, true, 7],
        },
      ],
    },
  },
  {
    slug: "n-queens",
    title: "N-Queens",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Backtrack row by row, with three sets — columns and the two diagonal families — deciding in O(1) whether a square is attacked.",
    prompt: [
      "Place `n` queens on an `n × n` board so that no two attack each other. Return every solution as a board of `n` strings, with `Q` for a queen and `.` for an empty square. Any order of solutions is accepted.",
      "",
      "```",
      'solveNQueens(4)  ->  [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]]',
      "```",
    ].join("\n"),
    hints: [
      "One queen per row, so recurse over rows and choose a column for each.",
      "A square (r, c) is attacked iff column c, diagonal r − c or anti-diagonal r + c already holds a queen; three sets make that an O(1) check.",
    ],
    solution: [
      "## Approach",
      "",
      "Backtracking by row. For row `r`, try each column `c` not in the `columns` set and whose diagonals `r − c` and `r + c` are unused; place, recurse to the next row, remove. When `r` reaches `n`, render the current placement as strings. The three sets replace scanning the board for conflicts.",
      "",
      "## Complexity",
      "",
      "Exponential in n (the solution count itself grows that way); O(n) space for the recursion and sets.",
      "",
      "## Worth saying out loud",
      "",
      "- Bitmasks for the three sets make the inner loop a few bit operations and are the usual speed-up for counting solutions.",
      "- Counting solutions and listing them share the recursion; only the base case differs.",
    ].join("\n"),
    judge: {
      solutionCode: `// Backtrack over rows; three sets answer "is this square attacked" in O(1).
function solveNQueens(n) {
  const solutions = [];
  const columns = new Set();
  const diagonals = new Set();
  const antiDiagonals = new Set();
  const placement = [];
  const place = (row) => {
    if (row === n) {
      solutions.push(placement.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (columns.has(c) || diagonals.has(row - c) || antiDiagonals.has(row + c)) continue;
      columns.add(c);
      diagonals.add(row - c);
      antiDiagonals.add(row + c);
      placement.push(c);
      place(row + 1);
      placement.pop();
      columns.delete(c);
      diagonals.delete(row - c);
      antiDiagonals.delete(row + c);
    }
  };
  place(0);
  return solutions;
}
`,
      starterCode: `/**
 * @param {number} n
 * @returns {string[][]} every solution as n rows of Q and .
 */
function solveNQueens(n) {
  // Your code here
  return [];
}
`,
      entry: "__judgeQueens",
      // Any order of solutions is accepted: the driver sorts them.
      driverCode: `function __judgeQueens(n) {
  const boards = solveNQueens(n).map((board) => board.slice());
  return boards.sort((a, b) => (a.join("") < b.join("") ? -1 : a.join("") > b.join("") ? 1 : 0));
}`,
      tests: [
        {
          name: "Four queens",
          input: [4],
          expected: [
            ["..Q.", "Q...", "...Q", ".Q.."],
            [".Q..", "...Q", "Q...", "..Q."],
          ],
        },
        { name: "One queen", input: [1], expected: [["Q"]] },
        { name: "Two queens: impossible", input: [2], expected: [] },
        { name: "Three queens: impossible", input: [3], expected: [] },
        {
          name: "Six queens",
          input: [6],
          expected: [
            ["....Q.", "..Q...", "Q.....", ".....Q", "...Q..", ".Q...."],
            ["...Q..", "Q.....", "....Q.", ".Q....", ".....Q", "..Q..."],
            ["..Q...", ".....Q", ".Q....", "....Q.", "Q.....", "...Q.."],
            [".Q....", "...Q..", ".....Q", "Q.....", "..Q...", "....Q."],
          ],
        },
      ],
    },
  },
  {
    slug: "original-string-exists",
    title: "Could Two Encoded Strings Match?",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Memoised search over (i, j, balance): digits are wildcards of unknown split, and the balance records which side is ahead.",
    prompt: [
      'A string of lowercase letters can be encoded by replacing some non-empty, non-adjacent substrings with their lengths: `"internationalization"` can become `"i18n"` or `"i5a11o1"`. A number may be any positive integer without leading zeros, and a run of digits in the encoding may represent several adjacent numbers (`"123"` could be 123, 12 then 3, 1 then 23, or 1, 2, 3).',
      "",
      "Given two encoded strings `s1` and `s2`, return whether there exists **one** original string that both could encode.",
      "",
      "```",
      'possiblyEquals("internationalization", "i18n")  ->  true',
      'possiblyEquals("l123e", "44")                   ->  true',
      'possiblyEquals("a5b", "c5b")                    ->  false',
      "```",
    ].join("\n"),
    hints: [
      "Search over (i, j, balance), where balance is how many characters s2 has accounted for beyond s1 — positive means s1 must catch up with letters or numbers, negative the reverse.",
      "At a digit, try every way to read the next 1 to 3 digits as one number and adjust the balance. At letters: with balance 0 they must match; otherwise the side that is behind consumes one letter against a pending wildcard.",
      "Memoise on the triple; the balance stays within ±999, so the state space is small.",
    ],
    solution: [
      "## Approach",
      "",
      "Treat every number as a wildcard of that many letters and let a `balance` track how far one side's wildcards run ahead of the other. From state `(i, j, balance)`: if `s1[i]` is a digit, try each number formed by the next one to three digits and subtract it from the balance; symmetrically add for `s2[j]`. Otherwise, with balance 0 the two letters must be equal and both advance; with a positive balance `s1`'s letter is swallowed by `s2`'s pending wildcard (advance `i`, balance − 1); with a negative one the mirror. Success is both strings consumed with balance 0. Memoising the triple bounds the work.",
      "",
      "## Complexity",
      "",
      "O(|s1| · |s2| · 2000) states, each O(1) apart from the digit loop; same order of space.",
      "",
      "## Worth saying out loud",
      "",
      "- The leading-zero rule is why a digit run is read as at most three-digit chunks with the first digit non-zero here; say what you assume about zeros.",
      "- Write the tests from the examples before the recursion; this problem is won or lost on the balance sign conventions.",
    ].join("\n"),
    judge: {
      solutionCode: `// Memoised search over (i, j, balance); balance = letters s2 has accounted for beyond s1.
function possiblyEquals(s1, s2) {
  const memo = new Map();
  const isDigit = (ch) => ch >= "0" && ch <= "9";
  const dfs = (i, j, balance) => {
    if (i === s1.length && j === s2.length) return balance === 0;
    const key = i + "," + j + "," + balance;
    if (memo.has(key)) return memo.get(key);
    let result = false;
    if (i < s1.length && isDigit(s1[i])) {
      let value = 0;
      for (let k = i; k < s1.length && k < i + 3 && isDigit(s1[k]) && !result; k++) {
        value = value * 10 + Number(s1[k]);
        result = dfs(k + 1, j, balance - value);
      }
    } else if (j < s2.length && isDigit(s2[j])) {
      let value = 0;
      for (let k = j; k < s2.length && k < j + 3 && isDigit(s2[k]) && !result; k++) {
        value = value * 10 + Number(s2[k]);
        result = dfs(i, k + 1, balance + value);
      }
    } else if (balance === 0) {
      result = i < s1.length && j < s2.length && s1[i] === s2[j] && dfs(i + 1, j + 1, 0);
    } else if (balance > 0) {
      result = i < s1.length && dfs(i + 1, j, balance - 1);     // s2's wildcard swallows s1's letter
    } else {
      result = j < s2.length && dfs(i, j + 1, balance + 1);     // and the mirror
    }
    memo.set(key, result);
    return result;
  };
  return dfs(0, 0, 0);
}
`,
      starterCode: `/**
 * @param {string} s1 lowercase letters and digits
 * @param {string} s2 lowercase letters and digits
 * @returns {boolean} whether one original string could produce both encodings
 */
function possiblyEquals(s1, s2) {
  // Your code here
  return false;
}
`,
      entry: "possiblyEquals",
      tests: [
        { name: "A classic abbreviation", input: ["internationalization", "i18n"], expected: true },
        { name: "Numbers on both sides", input: ["l123e", "44"], expected: true },
        { name: "Different letters", input: ["a5b", "c5b"], expected: false },
        { name: "Digits read in several ways", input: ["112s", "g841"], expected: true },
        { name: "A length that does not fit", input: ["ab", "a2"], expected: false },
        { name: "Identical plain strings", input: ["abc", "abc"], expected: true },
        { name: "One wildcard for the whole word", input: ["abc", "3"], expected: true },
        { name: "Wildcards of different totals", input: ["a1", "3"], expected: false },
      ],
    },
  },
];
