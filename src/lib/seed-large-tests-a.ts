import { REFERENCE } from "./judge-gen";
import type { JudgeTest } from "./types";

// Large generated cases, part one: array, string, hashing, interval and
// graph problems. See seed-large-tests.ts for how they are merged and
// checked, and src/lib/judge-gen.ts for the spec language. Sizes aim at
// 10^5 elements where the intended solution is linear or n log n, so a
// quadratic one needs ~10^10 steps, and lower where the intended solution
// is itself quadratic, so the Python runtime still finishes comfortably.

const ref = REFERENCE;
const int = (min: number, max: number) => ({ $gen: "int", min, max });
const ints = (
  n: number,
  seed: number,
  min: number,
  max: number,
  extra = {},
) => ({
  $gen: "ints",
  n,
  seed,
  min,
  max,
  ...extra,
});
const list = (n: number, seed: number, item: unknown) => ({
  $gen: "list",
  n,
  seed,
  item,
});
const pick = (...from: unknown[]) => ({ $gen: "pick", from });
const words = (
  n: number,
  seed: number,
  length: number | [number, number],
  alphabet: string,
) => ({
  $gen: "words",
  n,
  seed,
  length,
  alphabet,
});
const string = (n: number, alphabet: string, seed?: number) => ({
  $gen: "string",
  n,
  alphabet,
  seed,
});
const concat = (seed: number | undefined, ...parts: unknown[]) => ({
  $gen: "concat",
  seed,
  parts,
});
const join = (n: number, item: unknown, sep = "", seed?: number) => ({
  $gen: "join",
  n,
  item,
  sep,
  seed,
});

export const largeTestsA: Record<string, JudgeTest[]> = {
  "group-anagrams": [
    {
      name: "Large: 60,000 words over eight letters",
      input: [words(60000, 1, [3, 6], "abcdefgh")],
      expected: ref,
    },
  ],
  "top-n-frequent-logs": [
    {
      name: "Large: 100,000 lines, tens of thousands distinct",
      input: [words(100000, 2, [2, 5], "abcdefgh"), 10],
      expected: ref,
    },
  ],
  "merge-arrays-unique-values": [
    {
      name: "Large: two lists of 300,000",
      input: [ints(300000, 3, 0, 500000), ints(300000, 4, 0, 500000)],
      expected: ref,
    },
  ],
  "values-appearing-once": [
    {
      name: "Large: two lists of 300,000",
      input: [ints(300000, 5, 0, 500000), ints(300000, 6, 0, 500000)],
      expected: ref,
    },
  ],
  "merge-arrays-unique-by-key": [
    {
      name: "Large: two lists of 50,000 records",
      input: [
        list(50000, 7, { id: int(0, 80000), n: string(3, "abc") }),
        list(50000, 8, { id: int(0, 80000), n: string(3, "xyz") }),
        "id",
      ],
      expected: ref,
    },
  ],
  "product-of-others": [
    {
      name: "Large: 100,000 signs",
      input: [list(100000, 9, pick(-1, 1))],
      expected: ref,
    },
  ],
  "reverse-alphanumeric-runs": [
    {
      name: "Large: a 100,000-character line",
      input: [string(100000, "abcde-_ ", 10)],
      expected: ref,
    },
  ],
  "repeated-lookups-sorted": [
    {
      name: "Large: 200,000 values and 200,000 queries",
      input: [
        ints(200000, 11, 0, 1000000, { sort: true }),
        ints(200000, 12, 0, 1000000),
      ],
      expected: ref,
    },
  ],
  "document-coverage-window": [
    {
      name: "Large: a 100,000-word document whose rarest term sits in the middle",
      input: [
        concat(
          13,
          words(50000, 13, [1, 2], "abcdef"),
          ["zzz"],
          words(50000, 14, [1, 2], "abcdef"),
        ),
        ["a", "bb", "cd", "zzz"],
      ],
      expected: ref,
    },
  ],
  "basic-calculator-ii": [
    {
      name: "Large: an expression of 24,000 terms",
      input: [
        concat(
          14,
          join(
            8000,
            concat(
              undefined,
              string(2, "123456789"),
              pick("+", "-"),
              string(2, "123456789"),
              "*",
              string(1, "123456789"),
            ),
            "-",
          ),
          "-1",
        ),
      ],
      expected: ref,
    },
  ],
  "json-parser": [
    {
      name: "Large: a 10,000-object array",
      input: [
        concat(
          15,
          "[",
          join(
            10000,
            concat(
              undefined,
              '{"id": ',
              string(5, "123456789"),
              ', "tag": "',
              string(4, "xyz"),
              '", "ok": true}',
            ),
            ", ",
          ),
          "]",
        ),
      ],
      expected: ref,
    },
  ],
  "longest-common-substring": [
    {
      name: "Large: two 1,400-character strings",
      input: [string(1400, "abc", 16), string(1400, "abc", 17)],
      expected: ref,
    },
  ],
  "merge-sort": [
    {
      name: "Large: 300,000 values",
      input: [ints(300000, 18, -1000000000, 1000000000)],
      expected: ref,
    },
  ],
  "insert-interval": [
    {
      name: "Large: 80,000 intervals",
      input: [
        {
          $gen: "intervals",
          n: 80000,
          seed: 19,
          max: 0,
          maxLen: 10,
          gap: [1, 5],
        },
        [300000, 320000],
      ],
      expected: ref,
    },
  ],
  "sessionize-events": [
    {
      name: "Large: 100,000 events across 100 users",
      input: [
        list(100000, 20, [
          concat(undefined, "u", string(2, "0123456789")),
          int(0, 1000000),
        ]),
        50,
      ],
      expected: ref,
    },
  ],
  "dropped-request-times": [
    {
      name: "Large: 200,000 requests under two rules",
      input: [
        ints(200000, 21, 0, 20000000, { sort: true }),
        [
          [1000, 50],
          [100000, 500],
        ],
      ],
      expected: ref,
    },
  ],
  "top-k-search-terms": [
    {
      name: "Large: 100,000 queries, 1,000 users, 100 terms",
      input: [
        list(100000, 22, [
          concat(undefined, "u", string(3, "0123456789")),
          concat(undefined, "t", string(2, "0123456789")),
        ]),
        10,
      ],
      expected: ref,
    },
  ],
  "synonym-groups": [
    {
      name: "Large: 60,000 pairs over a 260,000-word vocabulary",
      input: [list(60000, 23, [string(6, "abcdefgh"), string(6, "abcdefgh")])],
      expected: ref,
    },
  ],
  "closest-person-cake-distance": [
    {
      name: "Large: a 200,000-cell hallway",
      input: [list(200000, 24, pick(0, 0, 1, 2))],
      expected: ref,
    },
  ],
  "person-cake-distances": [
    {
      name: "Large: a 200,000-cell hallway",
      input: [list(200000, 25, pick(0, 0, 1, 2))],
      expected: ref,
    },
  ],
  "closest-cake-in-grid": [
    {
      name: "Large: a 400 by 400 room",
      input: [
        { $gen: "matrix", rows: 400, cols: 400, seed: 26, min: 1, max: 2 },
      ],
      expected: ref,
    },
  ],
  "nearest-bathroom-distances": [
    {
      name: "Large: a 300 by 300 floor",
      input: [
        { $gen: "grid", rows: 300, cols: 300, seed: 27, alphabet: "______D#B" },
      ],
      expected: ref,
    },
  ],
  "number-of-islands": [
    {
      name: "Large: a 300 by 300 grid",
      input: [{ $gen: "grid", rows: 300, cols: 300, seed: 28, alphabet: "01" }],
      expected: ref,
    },
  ],
  "is-graph-bipartite": [
    {
      name: "Large: a bipartite graph of 50,000 nodes",
      input: [
        50000,
        {
          $gen: "edges",
          n: 50000,
          m: 100000,
          seed: 29,
          bipartite: true,
          connected: true,
        },
      ],
      expected: ref,
    },
    {
      name: "Large: a random graph of 50,000 nodes",
      input: [50000, { $gen: "edges", n: 50000, m: 100000, seed: 30 }],
      expected: ref,
    },
  ],
  "word-ladder": [
    {
      name: "Large: 30,000 six-letter words",
      input: [
        "aaaaaa",
        "ffffff",
        concat(31, words(30000, 31, 6, "abcdef"), ["ffffff"]),
      ],
      expected: ref,
    },
  ],
  "word-search-trie": [
    {
      name: "Large: a 30 by 30 board and 3,000 words",
      input: [
        { $gen: "grid", rows: 30, cols: 30, seed: 32, alphabet: "abcd" },
        words(3000, 33, [3, 5], "abcd"),
      ],
      expected: ref,
    },
  ],
  "contiguous-recipes": [
    {
      name: "Large: 300,000 ingredients and 30,000 recipes",
      input: [
        ints(300000, 34, 1, 50),
        list(
          30000,
          35,
          pick(
            [int(1, 50), int(1, 50), int(1, 50), int(1, 50)],
            [int(1, 50), int(1, 50), int(1, 50), int(1, 50), int(1, 50)],
          ),
        ),
      ],
      expected: ref,
    },
  ],
  "kth-symbol-in-grammar": [
    {
      name: "Large: row 30",
      input: [30, 400000001],
      expected: ref,
    },
  ],
};
