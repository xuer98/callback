import { REFERENCE } from "./judge-gen";
import type { JudgeTest } from "./types";

// Large generated cases, part two: graphs, trees and the class-based
// problems whose op sequences come from the `calls` generator. See
// seed-large-tests.ts for how they are merged and checked.

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
const seq = (start = 0, step = 1) => ({ $gen: "seq", start, step });
const string = (n: number, alphabet: string) => ({
  $gen: "string",
  n,
  alphabet,
});
const concat = (...parts: unknown[]) => ({ $gen: "concat", parts });
const dag = (n: number, m: number, seed: number) => ({
  $gen: "edges",
  n,
  m,
  seed,
  acyclic: true,
});
/** A rooted tree as [parent, child] edges with the root at 0. */
const treeEdges = (n: number, seed: number) => ({
  $gen: "edges",
  n,
  m: n - 1,
  seed,
  connected: true,
  acyclic: true,
  plain: true,
});
/** A node number 1..49999 as text, without a leading zero. */
const nodeId = pick(
  string(1, "123456789"),
  string(2, "123456789"),
  string(3, "123456789"),
  string(4, "123456789"),
);
const adjacency = (n: number, m: number, seed: number, extra = {}) => ({
  $gen: "adjacency",
  n,
  m,
  seed,
  prefix: "n",
  ...extra,
});
/** The class-call pair: a constructor, an optional fixed prefix, then n random calls. */
const calls = (
  n: number,
  seed: number,
  first: [string, unknown[]],
  methods: [string, unknown[], number?][],
  prefix?: unknown,
) => ({ $gen: "calls", n, seed, first, methods, prefix, spread: true });

export const largeTestsB: Record<string, JudgeTest[]> = {
  "topological-sort": [
    {
      name: "Large: 50,000 nodes and 100,000 edges",
      input: [adjacency(50000, 100000, 40, { acyclic: true })],
      expected: ref,
    },
  ],
  "breadth-first-search-order": [
    {
      name: "Large: 50,000 nodes and 100,000 edges",
      input: [adjacency(50000, 100000, 41, { connected: true }), "n0"],
      expected: ref,
    },
  ],
  "dijkstra-shortest-distances": [
    {
      name: "Large: 30,000 nodes and 90,000 weighted edges",
      input: [
        adjacency(30000, 90000, 42, { connected: true, weights: [1, 100] }),
        "n0",
      ],
      expected: ref,
    },
  ],
  "course-batches-time": [
    {
      name: "Large: 50,000 courses and 100,000 prerequisites",
      input: [50000, dag(50000, 100000, 43), ints(50000, 44, 1, 100)],
      expected: ref,
    },
  ],
  "course-any-prerequisite-time": [
    {
      name: "Large: 50,000 courses and 100,000 prerequisites",
      input: [50000, dag(50000, 100000, 45), ints(50000, 46, 1, 100)],
      expected: ref,
    },
  ],
  "prerequisite-route": [
    {
      name: "Large: 50,000 courses and 100,000 prerequisites",
      input: [50000, dag(50000, 100000, 47), 12345],
      expected: ref,
    },
  ],
  "dag-letter-permissions": [
    {
      name: "Large: 50,000 nodes and 100,000 edges",
      input: [
        50000,
        dag(50000, 100000, 48),
        list(50000, 49, pick("", "", "A", "AB", "C", "ABCD", "Z")),
        list(50000, 50, pick("", "", "", "B", "D", "AZ")),
      ],
      expected: ref,
    },
  ],
  "dag-permissions-allow-deny": [
    {
      name: "Large: 50,000 named nodes and 100,000 edges",
      input: [
        { $gen: "range", n: 50000, seed: 51, prefix: "n" },
        {
          $gen: "edges",
          n: 50000,
          m: 100000,
          seed: 51,
          acyclic: true,
          plain: true,
          prefix: "n",
        },
        list(2000, 52, concat("n", nodeId)),
        list(500, 53, concat("n", nodeId)),
      ],
      expected: ref,
    },
  ],
  "height-after-deleting-nodes": [
    {
      name: "Large: a 50,000-node tree with 2,000 deletions",
      input: [
        treeEdges(50000, 54),
        0,
        ints(2000, 55, 1, 49999, { distinct: true }),
      ],
      expected: ref,
    },
  ],
  "fewest-deletions-for-height": [
    {
      name: "Large: a 50,000-node tree cut to height 12",
      input: [treeEdges(50000, 56), 0, 12],
      expected: ref,
    },
  ],
  "subtree-pruning-remaining-depth": [
    {
      name: "Large: 100,000 nodes and 5,000 deletions",
      input: [
        100000,
        { $gen: "parents", n: 100000, seed: 57 },
        ints(5000, 58, 0, 99999),
      ],
      expected: ref,
    },
  ],
  "subtree-pruning-depth-limit": [
    {
      name: "Large: 100,000 nodes, depth limit 10",
      input: [{ $gen: "parents", n: 100000, seed: 59 }, 10],
      expected: ref,
    },
  ],
  "subtree-pruning-deepest-cuts": [
    {
      name: "Large: 100,000 nodes, depth limit 10",
      input: [100000, { $gen: "parents", n: 100000, seed: 60 }, 10],
      expected: ref,
    },
  ],
  "delete-node-in-parent-array-forest": [
    {
      name: "Large: a 100,000-node forest",
      input: [{ $gen: "parents", n: 100000, seed: 61, roots: 3 }, 7],
      expected: ref,
    },
  ],
  "boundary-of-full-binary-tree": [
    {
      name: "Large: a full tree of 20,001 nodes",
      input: [
        {
          $gen: "tree",
          n: 20001,
          seed: 62,
          min: 1,
          max: 1000000,
          kind: "full",
        },
      ],
      expected: ref,
    },
  ],
  "preorder-skipping-marked-nodes": [
    {
      name: "Large: a 50,000-node tree with 500 marked",
      input: [
        { $gen: "tree", n: 50000, seed: 63, min: 1, max: 1000000 },
        ints(500, 64, 1, 1000000, { distinct: true }),
      ],
      expected: ref,
    },
  ],
  "fewest-clicks-between-pages": [
    {
      name: "Large: 50,000 pages and 100,000 links",
      input: [
        adjacency(50000, 100000, 65, { directed: true, prefix: "p" }),
        "p0",
        "p49999",
      ],
      expected: ref,
    },
  ],
  "crawl-reachable-pages": [
    {
      name: "Large: 50,000 pages and 100,000 links",
      input: [
        adjacency(50000, 100000, 66, { directed: true, prefix: "p" }),
        "p0",
      ],
      expected: ref,
    },
  ],
  "sort-colors-with-api": [
    {
      name: "Large: 200,000 colours",
      input: [ints(200000, 68, 0, 2)],
      expected: ref,
    },
  ],
  "min-stack": [
    {
      name: "Large: 400,000 operations",
      input: [
        calls(
          400000,
          69,
          ["MinStack", []],
          [
            ["push", [int(-1000000, 1000000)], 3],
            ["pop", [], 1],
            ["getMin", [], 4],
          ],
          list(200, 69, ["push", [int(-1000000, 1000000)]]),
        ),
      ],
      expected: ref,
    },
  ],
  "design-hashmap": [
    {
      name: "Large: 200,000 operations over 200,000 keys",
      input: [
        calls(
          200000,
          70,
          ["MyHashMap", []],
          [
            ["put", [int(0, 200000), int(0, 1000000)], 2],
            ["get", [int(0, 200000)], 2],
            ["remove", [int(0, 200000)], 1],
          ],
        ),
      ],
      expected: ref,
    },
  ],
  "streaming-median": [
    {
      name: "Large: 100,000 adds and medians",
      input: [
        calls(
          100000,
          71,
          ["ExactStreamingMedian", []],
          [
            ["add", [int(-1000000, 1000000)], 3],
            ["median", [], 1],
          ],
        ),
      ],
      expected: ref,
    },
  ],
  "histogram-quantile": [
    {
      name: "Large: 100,000 adds across 1,000 buckets",
      input: [
        calls(
          100000,
          72,
          ["HistogramQuantile", [0, 100000, 1000]],
          [
            ["add", [int(0, 100000)], 5],
            ["quantile", [pick(0.1, 0.5, 0.9, 0.99)], 1],
          ],
        ),
      ],
      expected: ref,
    },
  ],
  "ranked-ballot-counter": [
    {
      name: "Large: 50,000 ballots of eight candidates",
      input: [
        calls(
          50000,
          73,
          ["RankedBallotCounter", [10]],
          [
            ["add", [{ $gen: "range", n: 8, shuffle: true, prefix: "c" }], 20],
            ["results", [], 1],
          ],
        ),
      ],
      expected: ref,
    },
  ],
  "sliding-window-rate-limiter": [
    {
      name: "Large: 100,000 requests over five keys",
      input: [
        calls(
          100000,
          74,
          ["SlidingWindowLimiter", [50, 1000]],
          [["allow", [pick("a", "b", "c", "d", "e"), seq(0, 3)]]],
        ),
      ],
      expected: ref,
    },
  ],
  "count-events-in-range": [
    {
      name: "Large: 200,000 events and counts",
      input: [
        calls(
          200000,
          75,
          ["EventCounter", []],
          [
            ["receive", [pick("view", "click", "buy"), seq(0, 2)], 4],
            [
              "count",
              [pick("view", "click", "buy"), int(0, 1000), int(100000, 200000)],
              1,
            ],
          ],
        ),
      ],
      expected: ref,
    },
  ],
  "priority-task-executor": [
    {
      name: "Large: 200,000 adds and executes",
      input: [
        calls(
          200000,
          76,
          ["TaskExecutor", []],
          [
            ["addTask", [string(6, "abcdefgh"), int(1, 100), seq(1)], 3],
            ["executeTask", [], 2],
          ],
        ),
      ],
      expected: ref,
    },
  ],
};
