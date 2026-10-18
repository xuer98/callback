import type { Problem } from "./types";

// Snowflake coding bank, part X: contiguous recipe lookup over a list and
// over a stream. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-u.ts.

export const snowflakeProblemsX: Problem[] = [
  {
    slug: "contiguous-recipes",
    title: "Contiguous Recipe Lookup I",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary:
      "Many patterns, one text: a trie of the recipes with failure links finds every recipe in a single pass over the ingredients.",
    prompt: [
      "`ingredients` is an ordered list, and each recipe in `recipes` is an ordered list too. A recipe is **found** when it appears in `ingredients` as a contiguous run — every element in order, with nothing in between. An empty recipe always counts as found.",
      "",
      "Return one boolean per recipe. Elements are numbers or strings and compare by value.",
      "",
      "```",
      "recipesFound([1, 2, 3, 4, 5], [[2, 3], [4, 5], [3, 5], [1], []])",
      "  ->  [true, true, false, true, true]",
      "",
      'recipesFound(["egg", "milk", "flour", "sugar"],',
      '             [["milk", "flour"], ["flour", "milk"], ["sugar"], ["egg", "milk", "flour", "sugar", "vanilla"]])',
      "  ->  [true, false, true, false]",
      "```",
      "",
      "Both lists can hold 200,000 entries, so checking each recipe against each position is too slow.",
    ].join("\n"),
    hints: [
      "Scanning the ingredients once per recipe is O(n · recipes). Turn it around: scan the ingredients once and match every recipe at the same time.",
      "Put all recipes in a trie and add failure links (Aho–Corasick): each ingredient advances one state, and the state's output list says which recipes just ended here.",
    ],
    solution: [
      "## Approach",
      "",
      "Aho–Corasick. Insert every non-empty recipe into a trie whose edges are keyed by element; record at each terminal node which recipes end there. A breadth-first pass sets each node's failure link — the longest proper suffix of its path that is also a path in the trie — and merges the failure target's outputs into the node, so a node also reports recipes that end as a suffix of its path. Then walk the ingredients once: on each element follow failure links until a transition exists, take it, and mark every recipe in the node's output list as found. Empty recipes are marked found up front.",
      "",
      "## Complexity",
      "",
      "O(total recipe length + ingredients + matches) time, O(total recipe length) space.",
      "",
      "## Worth saying out loud",
      "",
      "- If memory is tight and tries are off the table, each recipe can be matched on its own with a rolling hash or KMP in O(1) extra space per recipe — that is the usual follow-up, and it trades the single pass for one pass per recipe.",
      "- Merging output lists through failure links is what catches a recipe that is a suffix of another; a test with `[a, b]` and `[b]` finds the bug.",
      "- The same automaton processes a stream, which is [Contiguous Recipe Lookup II](/problems/contiguous-recipes-stream).",
    ].join("\n"),
    judge: {
      solutionCode: `// Aho–Corasick: one trie over all recipes, one pass over the ingredients.
function recipesFound(ingredients, recipes) {
  const next = [new Map()];               // transitions per node, keyed by element
  const fail = [0];
  const out = [[]];                        // recipes that end at this node (or a suffix of it)
  const found = recipes.map((recipe) => recipe.length === 0);
  recipes.forEach((recipe, r) => {
    if (recipe.length === 0) return;
    let node = 0;
    for (const item of recipe) {
      let child = next[node].get(item);
      if (child === undefined) {
        child = next.length;
        next[node].set(item, child);
        next.push(new Map());
        fail.push(0);
        out.push([]);
      }
      node = child;
    }
    out[node].push(r);
  });
  const queue = [...next[0].values()];    // depth-1 nodes fail to the root
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    for (const [item, child] of next[node]) {
      let f = fail[node];
      while (f !== 0 && !next[f].has(item)) f = fail[f];
      fail[child] = next[f].get(item) ?? 0;
      out[child] = out[child].concat(out[fail[child]]);
      queue.push(child);
    }
  }
  let node = 0;
  for (const item of ingredients) {
    while (node !== 0 && !next[node].has(item)) node = fail[node];
    node = next[node].get(item) ?? 0;
    for (const r of out[node]) found[r] = true;
  }
  return found;
}
`,
      starterCode: `/**
 * @param {(number|string)[]} ingredients the list to search
 * @param {(number|string)[][]} recipes the runs to look for
 * @returns {boolean[]} whether each recipe appears as a contiguous run
 */
function recipesFound(ingredients, recipes) {
  // Your code here
  return [];
}
`,
      entry: "recipesFound",
      tests: [
        {
          name: "Prompt example with numbers",
          input: [
            [1, 2, 3, 4, 5],
            [[2, 3], [4, 5], [3, 5], [1], []],
          ],
          expected: [true, true, false, true, true],
        },
        {
          name: "Prompt example with strings",
          input: [
            ["egg", "milk", "flour", "sugar"],
            [
              ["milk", "flour"],
              ["flour", "milk"],
              ["sugar"],
              ["egg", "milk", "flour", "sugar", "vanilla"],
            ],
          ],
          expected: [true, false, true, false],
        },
        {
          name: "A recipe that is a suffix of another",
          input: [
            ["a", "b"],
            [["a", "b"], ["b"]],
          ],
          expected: [true, true],
        },
        {
          name: "Overlapping occurrences",
          input: [
            ["a", "b", "a", "b"],
            [["a", "b"], ["b", "a", "b"], ["a", "a"], []],
          ],
          expected: [true, true, false, true],
        },
        {
          name: "The whole list",
          input: [
            [1, 2, 3],
            [
              [1, 2, 3],
              [1, 2, 3, 4],
            ],
          ],
          expected: [true, false],
        },
        {
          name: "No ingredients",
          input: [[], [[1], []]],
          expected: [false, true],
        },
        { name: "No recipes", input: [[1, 2], []], expected: [] },
        {
          name: "Numbers and strings do not mix",
          input: [
            [1, "1"],
            [["1"], [1, 1]],
          ],
          expected: [true, false],
        },
        {
          name: "A partial match that restarts",
          input: [
            ["a", "a", "b"],
            [
              ["a", "b"],
              ["a", "a", "a"],
            ],
          ],
          expected: [true, false],
        },
      ],
    },
  },
  {
    slug: "contiguous-recipes-stream",
    title: "Contiguous Recipe Lookup II",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary:
      "The ingredients arrive once and cannot be stored: the recipe automaton advances one state per element and never looks back.",
    prompt: [
      "All recipes are known up front, but the ingredients arrive as a **stream** that is too large to store: `stream` is an iterator you can read from front to back exactly once. Return one boolean per recipe — whether it appears somewhere in the stream as a contiguous run. An empty recipe always counts as found.",
      "",
      "```",
      "recipesInStream(stream of [1, 2, 3, 2, 3, 4], [[2, 3], [3, 4], [4, 5], []])",
      "  ->  [true, true, false, true]",
      "",
      'recipesInStream(stream of ["egg", "milk", "flour", "milk", "flour", "sugar"],',
      '                [["milk", "flour"], ["flour", "sugar"], ["egg", "sugar"]])',
      "  ->  [true, true, false]",
      "```",
      "",
      "Memory may grow with the total size of the recipes, not with the stream.",
    ].join("\n"),
    hints: [
      "Everything the matching needs about the past is one state in an automaton built from the recipes, so nothing read so far has to be kept.",
      "Build the Aho–Corasick automaton before touching the stream; then each element is one transition plus the outputs of the state it lands on.",
    ],
    solution: [
      "## Approach",
      "",
      "The automaton from [Contiguous Recipe Lookup I](/problems/contiguous-recipes) already works online: its state after reading a prefix of the text is the longest suffix of that prefix that is a trie path, and that is the only history matching needs. Build the trie and failure links from the recipes first, then pull elements from the stream one at a time, follow failure links until a transition matches, and mark the recipes in the new state's output list. Memory is the trie plus one state.",
      "",
      "## Complexity",
      "",
      "O(total recipe length) to build, O(1) amortised per streamed element; O(total recipe length) space, independent of the stream.",
      "",
      "## Worth saying out loud",
      "",
      "- A per-recipe sliding buffer would also work in one pass but needs memory for the longest recipe and time per element proportional to the number of recipes; the automaton does the matching for all recipes at once.",
      "- Say what happens when the stream ends mid-recipe: nothing — only completed runs count, so no flush step is needed.",
    ].join("\n"),
    judge: {
      solutionCode: `// The Aho–Corasick automaton is built from the recipes; the stream is consumed once, one state at a time.
function recipesInStream(stream, recipes) {
  const next = [new Map()];
  const fail = [0];
  const out = [[]];
  const found = recipes.map((recipe) => recipe.length === 0);
  recipes.forEach((recipe, r) => {
    if (recipe.length === 0) return;
    let node = 0;
    for (const item of recipe) {
      let child = next[node].get(item);
      if (child === undefined) {
        child = next.length;
        next[node].set(item, child);
        next.push(new Map());
        fail.push(0);
        out.push([]);
      }
      node = child;
    }
    out[node].push(r);
  });
  const queue = [...next[0].values()];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    for (const [item, child] of next[node]) {
      let f = fail[node];
      while (f !== 0 && !next[f].has(item)) f = fail[f];
      fail[child] = next[f].get(item) ?? 0;
      out[child] = out[child].concat(out[fail[child]]);
      queue.push(child);
    }
  }
  let node = 0;
  for (const item of stream) {             // one pass; nothing is kept
    while (node !== 0 && !next[node].has(item)) node = fail[node];
    node = next[node].get(item) ?? 0;
    for (const r of out[node]) found[r] = true;
  }
  return found;
}
`,
      starterCode: `/**
 * @param {Iterator<number|string> & Iterable<number|string>} stream the ingredients, readable once with for...of
 * @param {(number|string)[][]} recipes the runs to look for, known up front
 * @returns {boolean[]} whether each recipe appears as a contiguous run somewhere in the stream
 */
function recipesInStream(stream, recipes) {
  // Your code here
  return [];
}
`,
      entry: "__judgeRecipeStream",
      driverCode: `function __judgeRecipeStream(items, recipes) {
  // A generator can be read once, front to back, like a real stream.
  function* stream() {
    yield* items;
  }
  return recipesInStream(stream(), recipes);
}`,
      tests: [
        {
          name: "Prompt example with numbers",
          input: [
            [1, 2, 3, 2, 3, 4],
            [[2, 3], [3, 4], [4, 5], []],
          ],
          expected: [true, true, false, true],
        },
        {
          name: "Prompt example with strings",
          input: [
            ["egg", "milk", "flour", "milk", "flour", "sugar"],
            [
              ["milk", "flour"],
              ["flour", "sugar"],
              ["egg", "sugar"],
            ],
          ],
          expected: [true, true, false],
        },
        {
          name: "A recipe that is a suffix of another",
          input: [
            ["x", "a", "b"],
            [["a", "b"], ["b"], ["x", "a", "b"]],
          ],
          expected: [true, true, true],
        },
        {
          name: "The stream ends mid-recipe",
          input: [
            [1, 2],
            [[1, 2, 3], [2]],
          ],
          expected: [false, true],
        },
        {
          name: "Repeated elements that almost match",
          input: [
            ["a", "a", "a", "b"],
            [
              ["a", "b"],
              ["a", "a", "b"],
              ["b", "a"],
            ],
          ],
          expected: [true, true, false],
        },
        {
          name: "Empty stream",
          input: [[], [[1], []]],
          expected: [false, true],
        },
        { name: "No recipes", input: [[1, 2, 3], []], expected: [] },
      ],
    },
  },
];
