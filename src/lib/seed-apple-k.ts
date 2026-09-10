import type { Problem } from "./types";

// Apple phone-screen bank, part K: recurring classics reported in Apple
// screens — trie-pruned word search, Word Ladder, and capturing stones on a
// Go board. Same sourcing and conventions as seed-apple-a.ts.

export const appleProblemsK: Problem[] = [
  {
    slug: "word-search-trie",
    title: "Trie, Then DFS the Board",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary:
      "Build the trie first and say why: it prunes the DFS the moment a prefix does not exist.",
    prompt: [
      "Given a grid of lowercase letters and a list of words, return every word that can be traced through four-directionally adjacent cells without reusing a cell. Return the found words sorted, without duplicates.",
      "",
      "```",
      "board = [\"oaan\",",
      "         \"etae\",",
      "         \"ihkr\",",
      "         \"iflv\"]",
      "findWords(board, [\"oath\", \"pea\", \"eat\", \"rain\"])  ->  [\"eat\", \"oath\"]",
      "```",
      "",
      "Reported for a 45-minute Apple iCloud phone screen. The candidate explained the logic and wrote code without finishing, was told to skip cases, and the community read was that this still passes a screen.",
      "",
      "## Worth asking out loud",
      "",
      "How many words versus how big a board — is searching per word acceptable? Can words share prefixes (the argument for a trie)? May a cell be reused? Is the board mutable for marking visited cells?",
    ].join("\n"),
    hints: [
      "Searching the board once per word repeats the same walks. Insert all words into a trie, then DFS from every cell following trie children only: a cell whose letter is not a child of the current node ends that branch immediately.",
      "Mark the current cell while exploring its neighbours (a visited set, or a temporary placeholder in a copied grid) and restore it afterwards. Record a word when the node carries an end marker, and add to a set to dedupe.",
    ],
    solution: [
      "## Approach",
      "",
      "Build the trie first and say why: it prunes the DFS the moment a prefix does not exist, which is the entire reason not to search each word separately. Every cell starts a DFS that follows only trie children; a visited set (or a temporary marker in a copied grid) prevents reuse, and an end marker on a node records a found word. Collect into a set so repeated paths or duplicate inputs do not repeat the answer.",
      "",
      "## Complexity",
      "",
      "O(W·L) to build the trie and O(M·N·4·3^(L−1)) worst case for the search, but the trie pruning makes the practical cost far smaller; O(W·L) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Pruning found words out of the trie (removing leaf nodes once matched) is the follow-up optimisation; mention it.",
      "- Copying the grid keeps the caller's board untouched; marking in place is faster but must be restored on backtrack.",
    ].join("\n"),
    judge: {
      solutionCode: `function findWords(board, words) {
  const root = {};
  for (const word of words) {
    let node = root;
    for (const ch of word) node = node[ch] ??= {};
    node.$ = word; // end marker carrying the word
  }
  const rows = board.length, cols = rows ? board[0].length : 0;
  const grid = board.map((row) => [...row]);
  const found = new Set();
  function dfs(r, c, node) {
    const ch = grid[r][c];
    const next = node[ch];
    if (!next) return; // prefix does not exist: prune
    if (next.$ !== undefined) found.add(next.$);
    grid[r][c] = "#";
    for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (a >= 0 && b >= 0 && a < rows && b < cols && grid[a][b] !== "#") dfs(a, b, next);
    }
    grid[r][c] = ch;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, root);
  return [...found].sort();
}
`,
      starterCode: `/**
 * @param {string[]} board rows of lowercase letters
 * @param {string[]} words
 * @returns {string[]} the words found, sorted, no duplicates
 */
function findWords(board, words) {
  // Your code here
  return [];
}
`,
      entry: "findWords",
      tests: [
        { name: "Prompt example", input: [["oaan", "etae", "ihkr", "iflv"], ["oath", "pea", "eat", "rain"]], expected: ["eat", "oath"] },
        { name: "No cell reuse", input: [["ab", "cd"], ["abcb"]], expected: [] },
        { name: "Single cell, no words", input: [["a"], []], expected: [] },
        { name: "Single cell with candidate words", input: [["a"], ["a", "aa"]], expected: ["a"] },
        {
          name: "Shared prefixes, diagonals do not count",
          input: [["abc", "def", "ghi"], ["abc", "abe", "adg", "aei", "ai"]],
          expected: ["abc", "abe", "adg"],
        },
        { name: "A word longer than any path", input: [["aa"], ["aaa"]], expected: [] },
        { name: "Duplicate words in the list", input: [["aa"], ["aa", "aa"]], expected: ["aa"] },
        { name: "Words found by several paths appear once", input: [["aba", "bab"], ["ab", "aba"]], expected: ["ab", "aba"] },
      ],
    },
  },
  {
    slug: "word-ladder",
    title: "Word Ladder",
    category: "algorithms",
    difficulty: "hard",
    companies: ["apple"],
    summary:
      "BFS, not DFS — shortest path — then mention bidirectional BFS, which roughly square-roots the frontier.",
    prompt: [
      "Given `beginWord`, `endWord` and a word list, return the length of the shortest transformation sequence from `beginWord` to `endWord` — every step changes exactly one letter, and every intermediate word (and `endWord`) must be in the list. Return `0` when no sequence exists. The length counts words, so `hit → hot → dot → dog → cog` is `5`.",
      "",
      "```",
      "ladderLength(\"hit\", \"cog\", [\"hot\", \"dot\", \"dog\", \"lot\", \"log\", \"cog\"])  ->  5",
      "ladderLength(\"hit\", \"cog\", [\"hot\", \"dot\", \"dog\", \"lot\", \"log\"])         ->  0",
      "```",
      "",
      "Reported in a one-hour Apple ICT3 phone screen in Cupertino that ended in an offer.",
      "",
      "## Worth asking out loud",
      "",
      "Is `beginWord` required to be in the list? Are all words the same length and lowercase? How large is the list — is generating 26 × L neighbours per word acceptable, or should I index by wildcard patterns?",
    ].join("\n"),
    hints: [
      "It is a shortest path in an implicit graph, so BFS by levels: from each frontier word, try every position and every letter, keep the candidates that are still in the word set, and remove them from the set as you enqueue them.",
      "Bidirectional BFS expands the smaller frontier from either end and stops when a candidate is in the other side; it roughly square-roots the explored space.",
    ],
    solution: [
      "## Approach",
      "",
      "BFS, not DFS — shortest path. Then mention bidirectional BFS, which roughly square-roots the frontier; the reference does it: keep a set for each side, always expand the smaller one, generate every one-letter neighbour, and stop as soon as a neighbour is in the other side. Words are deleted from the dictionary when discovered so nothing is expanded twice.",
      "",
      "## Complexity",
      "",
      "O(N·L·26) neighbour generation in the worst case, O(N) space; the bidirectional version explores far less in practice.",
      "",
      "## Worth saying out loud",
      "",
      "- If `endWord` is not in the list the answer is 0 before any search — check it first.",
      "- Indexing words by wildcard patterns (`h*t`) trades 26·L generation for L lookups per word; name it if the dictionary is huge.",
    ].join("\n"),
    judge: {
      solutionCode: `// Bidirectional BFS: expand the smaller frontier, stop when the sides meet.
function ladderLength(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  let front = new Set([beginWord]);
  let back = new Set([endWord]);
  let steps = 1;
  words.delete(beginWord);
  while (front.size > 0 && back.size > 0) {
    if (front.size > back.size) [front, back] = [back, front];
    const next = new Set();
    for (const word of front) {
      for (let i = 0; i < word.length; i++) {
        for (let code = 97; code <= 122; code++) {
          const candidate = word.slice(0, i) + String.fromCharCode(code) + word.slice(i + 1);
          if (back.has(candidate)) return steps + 1;
          if (words.has(candidate)) {
            next.add(candidate);
            words.delete(candidate);
          }
        }
      }
    }
    front = next;
    steps++;
  }
  return 0;
}
`,
      starterCode: `/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @returns {number} words in the shortest sequence, or 0
 */
function ladderLength(beginWord, endWord, wordList) {
  // Your code here
  return 0;
}
`,
      entry: "ladderLength",
      tests: [
        { name: "Prompt example", input: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], expected: 5 },
        { name: "End word missing from the list", input: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], expected: 0 },
        { name: "One step", input: ["a", "c", ["a", "b", "c"]], expected: 2 },
        { name: "No path", input: ["hot", "dog", ["hot", "dog"]], expected: 0 },
        { name: "Direct neighbour", input: ["hot", "dot", ["dot"]], expected: 2 },
        { name: "Two equally short routes", input: ["red", "tax", ["ted", "tex", "red", "tax", "tad", "den", "rex", "pee"]], expected: 4 },
        { name: "Longer chain", input: ["cold", "warm", ["cord", "card", "ward", "warm", "word", "worm"]], expected: 5 },
      ],
    },
  },
  {
    slug: "capture-stones-go",
    title: "Capture Stones on a Go Board",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "A group dies exactly when it has no adjacent empty point — flood fill each neighbouring enemy group.",
    prompt: [
      "A Go board is a grid of `'e'` (empty), `'b'` (black) and `'w'` (white). After `me` plays a stone at `(row, col)`, how many `foe` stones are captured? A group of same-coloured, four-directionally connected stones is captured when it has **no adjacent empty point** after the move. Only enemy groups touching the placed stone can be affected. Return `-1` if the point is occupied.",
      "",
      "```",
      "board = [\"ebe\",",
      "         \"bwe\",",
      "         \"ebe\"]",
      "captureStones(board, 1, 2, \"b\", \"w\")  ->  1     // the white stone loses its last liberty",
      "```",
      "",
      "Reported as an Apple ICT5 phone screen, with the board given as a literal grid of `e`/`b`/`w`.",
      "",
      "## Worth asking out loud",
      "",
      "Is suicide (my own group ending with no liberties) legal or out of scope? Do only groups adjacent to the placed stone matter? Should the board be mutated, or a copy used? Diagonals never connect, correct?",
    ].join("\n"),
    hints: [
      "Place the stone in a copy of the board, then for each of its four neighbours that holds an enemy stone not yet examined, flood-fill that group, collecting its stones and noting whether any neighbour of the group is empty.",
      "A group with no empty neighbour is captured: add its size. Track examined stones across groups so a group touching the placed stone on two sides is counted once.",
    ],
    solution: [
      "## Approach",
      "",
      "A group dies exactly when it has no adjacent empty point. So: place the stone on a copy of the board, then for each neighbouring enemy group, flood-fill it — collecting its stones and recording whether any liberty (empty neighbour) exists — and add its size when it has none. It is Number of Islands with a domain rule on top; a shared visited set keeps a group that touches the new stone on two sides from being counted twice.",
      "",
      "## Complexity",
      "",
      "O(M·N) worst case for the flood fills; O(M·N) space for the copy and the visited set.",
      "",
      "## Worth saying out loud",
      "",
      "- The stone must be placed before checking liberties — the move itself removes one.",
      "- Suicide and ko are the rules an interviewer may add next; naming them shows you know the domain without being asked.",
    ].join("\n"),
    judge: {
      solutionCode: `// After \`me\` plays at (row, col): flood-fill each adjacent foe group and
// count the ones left with no empty neighbour.
function captureStones(board, row, col, me, foe) {
  const rows = board.length, cols = board[0].length;
  const grid = board.map((line) => [...line]);
  if (grid[row][col] !== "e") return -1;
  grid[row][col] = me;
  const neighbours = (r, c) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]
    .filter(([a, b]) => a >= 0 && b >= 0 && a < rows && b < cols);
  const seen = new Set();
  let captured = 0;
  for (const [a, b] of neighbours(row, col)) {
    if (grid[a][b] !== foe || seen.has(a * cols + b)) continue;
    const group = [];
    let alive = false;
    const stack = [[a, b]];
    seen.add(a * cols + b);
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      group.push([x, y]);
      for (const [p, q] of neighbours(x, y)) {
        if (grid[p][q] === "e") alive = true;
        else if (grid[p][q] === foe && !seen.has(p * cols + q)) {
          seen.add(p * cols + q);
          stack.push([p, q]);
        }
      }
    }
    if (!alive) captured += group.length;
  }
  return captured;
}
`,
      starterCode: `/**
 * @param {string[]} board rows of 'e' (empty), 'b' (black), 'w' (white)
 * @param {number} row
 * @param {number} col
 * @param {"b"|"w"} me the colour being played
 * @param {"b"|"w"} foe the opposing colour
 * @returns {number} captured foe stones, or -1 if the point is occupied
 */
function captureStones(board, row, col, me, foe) {
  // Your code here
  return 0;
}
`,
      entry: "captureStones",
      tests: [
        { name: "Prompt example: one stone loses its last liberty", input: [["ebe", "bwe", "ebe"], 1, 2, "b", "w"], expected: 1 },
        { name: "A group of two", input: [["ebbe", "bwwb", "ebee"], 2, 2, "b", "w"], expected: 2 },
        { name: "No enemy adjacent", input: [["ebbe", "bwwb", "ebee"], 0, 0, "b", "w"], expected: 0 },
        { name: "The group keeps a liberty", input: [["ebbe", "bwwb", "eeee"], 2, 1, "b", "w"], expected: 0 },
        { name: "Two separate groups captured by one move", input: [["wew", "beb", "eee"], 0, 1, "b", "w"], expected: 2 },
        { name: "Occupied point", input: [["ebe", "bwe", "ebe"], 1, 1, "b", "w"], expected: -1 },
        { name: "Corner capture", input: [["we", "be"], 0, 1, "b", "w"], expected: 1 },
        { name: "A three-stone group with one liberty", input: [["bbbb", "bwwb", "bweb", "bbbb"], 2, 2, "b", "w"], expected: 3 },
        { name: "White captures black", input: [["wbe", "wbw", "ewe"], 0, 2, "w", "b"], expected: 2 },
      ],
    },
  },
];
