import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part Q: a stream filter whose blacklist changes
// under it. Judged in JavaScript and Python; the Python judge lives in
// seed-python-snowflake-d.ts.

export const snowflakeProblemsQ: Problem[] = [
  {
    slug: "dynamic-blacklist-filter",
    title: "Filter With a Dynamic Blacklist",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Emitted items are final; held items wait in publish order and are re-checked whenever a word is unblocked.",
    prompt: [
      "Design `BlacklistFilter`, a stream filter whose blacklist changes while items flow:",
      "",
      "```",
      "publish(item)    // item is words separated by spaces",
      "block(word)      // from now on, items containing word are held back",
      "unblock(word)    // held items that no longer contain any blocked word are emitted now, in publish order",
      "emitted()        // every item emitted so far, in order",
      "```",
      "",
      "An item is held if **any** of its words is blocked at publish time. Emitting is final: blocking a word later never retracts an item.",
      "",
      "```",
      'block("spam") · publish("buy spam now") · publish("hello")',
      'emitted()  ->  ["hello"]',
      'unblock("spam") · emitted()  ->  ["hello", "buy spam now"]',
      "```",
    ].join("\n"),
    hints: [
      "Three pieces of state: the blocked set, the held list in publish order, and the emitted list.",
      "publish checks the item against the set and routes it; unblock walks the held list once, emitting what is now clean and keeping the rest in order.",
    ],
    solution: [
      "## Approach",
      "",
      "A set of blocked words, a held list and an emitted list. `publish` splits the item into words and either emits it or appends it to the held list. `unblock` removes the word and then sweeps the held list in order, moving items that no longer contain any blocked word to the emitted list and keeping the others. `block` only adds to the set — it affects future publishes and future sweeps, never what was already emitted.",
      "",
      "## Complexity",
      "",
      "O(words) per publish; O(held · words) per unblock; O(1) per block.",
      "",
      "## Worth saying out loud",
      "",
      "- Decide the semantics out loud before coding: word match versus substring match, whether `block` retracts, and the order of re-emission. The tests follow from those three answers.",
      "- A large held list makes the unblock sweep expensive; an index from blocked word to the held items that contain it turns the sweep into a lookup, at the cost of maintaining it on publish.",
    ].join("\n"),
    judge: {
      solutionCode: `// Blocked set, held list in publish order, emitted list; unblock sweeps the held list.
class BlacklistFilter {
  constructor() {
    this.blocked = new Set();
    this.held = [];
    this.out = [];
  }

  isBlocked(item) {
    return item.split(" ").some((word) => this.blocked.has(word));
  }

  publish(item) {
    if (this.isBlocked(item)) this.held.push(item);
    else this.out.push(item);
  }

  block(word) {
    this.blocked.add(word);
  }

  unblock(word) {
    this.blocked.delete(word);
    const still = [];
    for (const item of this.held) {
      if (this.isBlocked(item)) still.push(item);
      else this.out.push(item);
    }
    this.held = still;
  }

  emitted() {
    return this.out.slice();
  }
}
`,
      starterCode: `class BlacklistFilter {
  constructor() {
    // Your state here
  }

  /** item is words separated by spaces; held if any word is blocked. */
  publish(item) {}

  block(word) {}

  /** Held items that are now clean are emitted, in publish order. */
  unblock(word) {}

  /** @returns {string[]} everything emitted so far, in order */
  emitted() {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("BlacklistFilter"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["BlacklistFilter", "block", "publish", "publish", "emitted", "unblock", "emitted"],
            [[], ["spam"], ["buy spam now"], ["hello"], [], ["spam"], []],
          ],
          expected: [null, null, null, null, ["hello"], null, ["hello", "buy spam now"]],
        },
        {
          name: "Blocking never retracts",
          input: [
            ["BlacklistFilter", "publish", "block", "emitted", "publish", "emitted", "unblock", "emitted"],
            [[], ["x"], ["x"], [], ["x again"], [], ["x"], []],
          ],
          expected: [null, null, null, ["x"], null, ["x"], null, ["x", "x again"]],
        },
        {
          name: "An item with two blocked words needs both unblocked",
          input: [
            ["BlacklistFilter", "block", "block", "publish", "publish", "unblock", "emitted", "unblock", "emitted"],
            [[], ["a"], ["b"], ["a b"], ["a"], ["a"], [], ["b"], []],
          ],
          expected: [null, null, null, null, null, null, ["a"], null, ["a", "a b"]],
        },
        {
          name: "Re-emission keeps publish order",
          input: [
            ["BlacklistFilter", "block", "publish", "publish", "publish", "unblock", "emitted"],
            [[], ["z"], ["z 1"], ["ok"], ["z 2"], ["z"], []],
          ],
          expected: [null, null, null, null, null, null, ["ok", "z 1", "z 2"]],
        },
        {
          name: "Unblocking a word that was never blocked",
          input: [
            ["BlacklistFilter", "publish", "unblock", "emitted"],
            [[], ["a"], ["q"], []],
          ],
          expected: [null, null, null, ["a"]],
        },
        {
          name: "Whole words only",
          input: [
            ["BlacklistFilter", "block", "publish", "emitted"],
            [[], ["spam"], ["spammer"], []],
          ],
          expected: [null, null, null, ["spammer"]],
        },
      ],
    },
  },
];
