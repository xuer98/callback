import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, LeetCode tag part I: design-a-class problems —
// a trie, a wildcard word dictionary, and a randomized set; part L continues
// them. Tests drive a sequence of operations: the first entry constructs the
// class, the rest call methods, and a method that returns nothing yields
// null. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-k.ts.

export const snowflakeLcProblemsI: Problem[] = [
  {
    slug: "implement-trie",
    title: "Implement Trie (Prefix Tree)",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A node per character with a terminal flag; search and startsWith are the same walk with a different ending.",
    prompt: [
      "Implement `Trie`:",
      "",
      "- `insert(word)` adds a word.",
      "- `search(word)` returns whether that exact word was inserted.",
      "- `startsWith(prefix)` returns whether any inserted word begins with the prefix.",
      "",
      "```",
      "t = Trie()",
      "t.insert(\"apple\")",
      "t.search(\"apple\")      ->  true",
      "t.search(\"app\")        ->  false",
      "t.startsWith(\"app\")    ->  true",
      "```",
    ].join("\n"),
    hints: [
      "Each node holds a map from character to child and a flag marking the end of a word.",
      "Walk the characters; `search` requires the final node's flag, `startsWith` only requires that the walk completes.",
    ],
    solution: [
      "## Approach",
      "",
      "A tree of maps. Inserting walks the characters, creating children as needed, and flags the last node as a word end. Both queries walk the same way and fail on a missing child; `search` additionally checks the end flag. A shared private walk keeps the two queries to one line each.",
      "",
      "## Complexity",
      "",
      "O(L) per operation for a word of length L; O(total characters) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Arrays of 26 children are faster for lowercase words; maps handle any alphabet and waste less on sparse tries.",
      "- The trie is the base for [Add and Search Words](/problems/add-and-search-words) and for [Word Search on a Letter Grid](/problems/word-search-trie).",
    ].join("\n"),
    judge: {
      solutionCode: `class Trie {
  constructor() {
    this.root = { children: new Map(), end: false };
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false });
      node = node.children.get(ch);
    }
    node.end = true;
  }

  walk(s) {
    let node = this.root;
    for (const ch of s) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }

  search(word) {
    const node = this.walk(word);
    return node !== null && node.end;
  }

  startsWith(prefix) {
    return this.walk(prefix) !== null;
  }
}
`,
      starterCode: `class Trie {
  constructor() {
    // Your state here
  }

  /** @param {string} word */
  insert(word) {}

  /** @param {string} word @returns {boolean} */
  search(word) {
    return false;
  }

  /** @param {string} prefix @returns {boolean} */
  startsWith(prefix) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("Trie"),
      tests: [
        {
          name: "Prompt example",
          input: [["Trie", "insert", "search", "search", "startsWith", "insert", "search"], [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]],
          expected: [null, null, true, false, true, null, true],
        },
        {
          name: "Nothing inserted yet",
          input: [["Trie", "search", "startsWith", "insert", "startsWith", "search"], [[], ["a"], ["a"], ["a"], ["a"], ["a"]]],
          expected: [null, false, false, null, true, true],
        },
        {
          name: "A prefix of a word is not a word",
          input: [["Trie", "insert", "insert", "search", "search", "startsWith", "startsWith"], [[], ["ab"], ["abc"], ["a"], ["ab"], ["abc"], ["abcd"]]],
          expected: [null, null, null, false, true, true, false],
        },
      ],
    },
  },
  {
    slug: "add-and-search-words",
    title: "Design Add and Search Words Data Structure",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A trie where a dot branches into every child — depth-first search over the trie with the pattern as the guide.",
    prompt: [
      "Implement `WordDictionary`:",
      "",
      "- `addWord(word)` adds a word.",
      "- `search(pattern)` returns whether any added word matches the pattern, where `.` matches any single letter.",
      "",
      "```",
      "d = WordDictionary()",
      "d.addWord(\"bad\"); d.addWord(\"dad\"); d.addWord(\"mad\")",
      "d.search(\"pad\")   ->  false",
      "d.search(\".ad\")   ->  true",
      "d.search(\"b..\")   ->  true",
      "```",
    ].join("\n"),
    hints: [
      "Store the words in a trie. Searching is a recursive walk over (node, index): a letter follows one child, a dot tries every child.",
      "A match needs the walk to end on a node flagged as a word end, so `.ad` does not match `bad` plus an extra letter.",
    ],
    solution: [
      "## Approach",
      "",
      "A trie with a recursive matcher. At each pattern position, a letter descends into that child if it exists; a dot descends into every child and succeeds if any branch succeeds. Reaching the end of the pattern succeeds only on a node that ends a word. Without dots the search is a plain trie lookup; dots cost a branch per child.",
      "",
      "## Complexity",
      "",
      "O(L) to add; O(26^dots × L) worst case to search, O(L) without dots.",
      "",
      "## Worth saying out loud",
      "",
      "- Bucketing words by length prunes the search before the trie does; combining both is the production answer.",
      "- A pattern of only dots matches any word of that length — a quick test for the end-flag check.",
    ].join("\n"),
    judge: {
      solutionCode: `class WordDictionary {
  constructor() {
    this.root = { children: new Map(), end: false };
  }

  addWord(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false });
      node = node.children.get(ch);
    }
    node.end = true;
  }

  search(pattern) {
    const match = (node, i) => {
      if (i === pattern.length) return node.end;
      const ch = pattern[i];
      if (ch !== ".") {
        const child = node.children.get(ch);
        return child ? match(child, i + 1) : false;
      }
      for (const child of node.children.values()) if (match(child, i + 1)) return true;
      return false;
    };
    return match(this.root, 0);
  }
}
`,
      starterCode: `class WordDictionary {
  constructor() {
    // Your state here
  }

  /** @param {string} word */
  addWord(word) {}

  /** @param {string} pattern letters and "." @returns {boolean} */
  search(pattern) {
    return false;
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("WordDictionary"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["WordDictionary", "addWord", "addWord", "addWord", "search", "search", "search", "search"],
            [[], ["bad"], ["dad"], ["mad"], ["pad"], ["bad"], [".ad"], ["b.."]],
          ],
          expected: [null, null, null, null, false, true, true, true],
        },
        {
          name: "Dots must match the whole word",
          input: [["WordDictionary", "addWord", "search", "search", "search"], [[], ["bad"], ["...."], ["."], ["..."]]],
          expected: [null, null, false, false, true],
        },
        {
          name: "Empty dictionary",
          input: [["WordDictionary", "search", "search"], [[], ["a"], ["."]]],
          expected: [null, false, false],
        },
      ],
    },
  },
  {
    slug: "insert-delete-getrandom",
    title: "Insert Delete GetRandom O(1)",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "An array for random access plus a map from value to index; delete by swapping the victim with the last element.",
    prompt: [
      "Implement `RandomizedSet` with every operation in average O(1):",
      "",
      "- `insert(val)` returns `true` if the value was not present and adds it.",
      "- `remove(val)` returns `true` if the value was present and removes it.",
      "- `getRandom()` returns a uniformly random element of the current set.",
      "",
      "The grader checks that `getRandom` returns a member, and on a `getRandomCovers` call that 300 draws from a small set return every member at least once.",
    ].join("\n"),
    hints: [
      "Keep the values in an array (for `getRandom`) and a map from value to its index (for O(1) lookup).",
      "To remove, move the last array element into the victim's slot, update its index in the map, then pop.",
    ],
    solution: [
      "## Approach",
      "",
      "Two structures kept in sync: an array of the values and a map from value to array index. Insert appends and records the index. Remove looks up the index, copies the last element into that slot (updating its map entry), pops the array and deletes the map entry — constant time without leaving a hole. A random index into the array is a uniform random element.",
      "",
      "## Complexity",
      "",
      "O(1) average per operation; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- The swap-with-last trick is the whole problem: deleting from the middle of an array is O(n), and a hash set alone cannot pick uniformly.",
      "- With duplicates allowed, the map holds a set of indices per value and the same swap applies.",
    ].join("\n"),
    judge: {
      solutionCode: `class RandomizedSet {
  constructor() {
    this.values = [];
    this.index = new Map();
  }

  insert(val) {
    if (this.index.has(val)) return false;
    this.index.set(val, this.values.length);
    this.values.push(val);
    return true;
  }

  remove(val) {
    const i = this.index.get(val);
    if (i === undefined) return false;
    const last = this.values[this.values.length - 1];
    this.values[i] = last;
    this.index.set(last, i);
    this.values.pop();
    this.index.delete(val);
    return true;
  }

  getRandom() {
    return this.values[Math.floor(Math.random() * this.values.length)];
  }
}
`,
      starterCode: `class RandomizedSet {
  constructor() {
    // Your state here
  }

  /** @param {number} val @returns {boolean} true if it was not already present */
  insert(val) {
    return false;
  }

  /** @param {number} val @returns {boolean} true if it was present */
  remove(val) {
    return false;
  }

  /** @returns {number} a uniformly random member */
  getRandom() {
    return 0;
  }
}
`,
      entry: "__runRandomizedSet",
      driverCode: `function __runRandomizedSet(operations, args) {
  let target = null;
  const mirror = new Set();
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const a = args[i];
    if (op === "RandomizedSet") {
      target = new RandomizedSet(...a);
      out.push(null);
    } else if (op === "insert") {
      out.push(target.insert(...a));
      mirror.add(a[0]);
    } else if (op === "remove") {
      out.push(target.remove(...a));
      mirror.delete(a[0]);
    } else if (op === "getRandom") {
      out.push(mirror.has(target.getRandom()));
    } else if (op === "getRandomCovers") {
      const seen = new Set();
      let members = true;
      for (let t = 0; t < 300; t++) {
        const v = target.getRandom();
        if (!mirror.has(v)) members = false;
        seen.add(v);
      }
      out.push(members && seen.size === mirror.size);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt sequence",
          input: [["RandomizedSet", "insert", "remove", "insert", "getRandom", "remove", "insert", "getRandom"], [[], [1], [2], [2], [], [1], [2], []]],
          expected: [null, true, false, true, true, true, false, true],
        },
        {
          name: "Every member can be drawn",
          input: [["RandomizedSet", "insert", "insert", "insert", "getRandomCovers", "remove", "getRandomCovers"], [[], [1], [2], [3], [], [2], []]],
          expected: [null, true, true, true, true, true, true],
        },
        {
          name: "Remove the last and middle elements",
          input: [["RandomizedSet", "insert", "insert", "insert", "remove", "remove", "insert", "getRandom", "remove"], [[], [5], [6], [7], [7], [5], [5], [], [6]]],
          expected: [null, true, true, true, true, true, true, true, true],
        },
      ],
    },
  },
];
