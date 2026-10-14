import type { Problem } from "./types";

// Algorithm prompts from GreatFrontEnd's list, the practice set the
// recruiter's email points at for the Snowflake frontend round: graph
// traversal and sorting with plain data structures. Python in
// seed-python-snowflake-w.ts.

export const snowflakeGfeProblems: Problem[] = [
  {
    slug: "breadth-first-search-order",
    title: "Breadth-First Search Order",
    category: "algorithms",
    difficulty: "easy",
    companies: ["snowflake"],
    summary: "A queue with an index pointer, a visited set marked on enqueue, neighbours in the order given.",
    prompt: [
      "`graph` maps each node name to the array of its neighbours, in order. Return the nodes reachable from `source` in breadth-first order: the source, then its neighbours in the given order, then theirs, each node once.",
      "",
      "```",
      "bfs({ A: [\"B\", \"C\"], B: [\"D\", \"E\"], C: [\"F\", \"G\"], D: [], E: [], F: [], G: [] }, \"A\")  ->  [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\"]",
      "bfs({ A: [\"B\"], B: [\"C\"], C: [\"A\"] }, \"A\")                                         ->  [\"A\", \"B\", \"C\"]",
      "```",
    ].join("\n"),
    hints: [
      "Mark a node visited when it is enqueued, not when it is dequeued, or a node reachable two ways is listed twice.",
      "Walk the queue with an index instead of `shift()`, which is O(n) on long arrays.",
    ],
    solution: [
      "## Approach",
      "",
      "Seed a queue and a visited set with the source. Take nodes from the front; for each neighbour not yet visited, mark it and push it. The output is the queue itself, because every node enters it exactly once in visiting order.",
      "",
      "## Complexity",
      "",
      "O(V + E) time, O(V) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Depth-first is the same code with a stack, or recursion; the order differs.",
      "- Shortest paths in an unweighted graph fall out of BFS by recording each node's predecessor.",
    ].join("\n"),
    judge: {
      solutionCode: `function bfs(graph, source) {
  const order = [source];
  const seen = new Set(order);
  for (let head = 0; head < order.length; head++) {
    for (const next of graph[order[head]] ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        order.push(next);
      }
    }
  }
  return order;
}
`,
      starterCode: `/**
 * @param {Record<string, string[]>} graph node -> neighbours, in order
 * @param {string} source
 * @returns {string[]} reachable nodes in breadth-first order
 */
function bfs(graph, source) {
  // Your code here
  return [];
}
`,
      entry: "bfs",
      tests: [
        {
          name: "Prompt example",
          input: [{ A: ["B", "C"], B: ["D", "E"], C: ["F", "G"], D: [], E: [], F: [], G: [] }, "A"],
          expected: ["A", "B", "C", "D", "E", "F", "G"],
        },
        { name: "A cycle", input: [{ A: ["B"], B: ["C"], C: ["A"] }, "A"], expected: ["A", "B", "C"] },
        { name: "Lone source", input: [{ A: [] }, "A"], expected: ["A"] },
        { name: "Unreachable nodes stay out", input: [{ A: ["B"], B: [], C: ["D"], D: [] }, "A"], expected: ["A", "B"] },
        { name: "Neighbour order is kept", input: [{ A: ["C", "B"], B: ["D"], C: [], D: [] }, "A"], expected: ["A", "C", "B", "D"] },
        { name: "Diamond, each node once", input: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "A"], expected: ["A", "B", "C", "D"] },
      ],
    },
  },
  {
    slug: "merge-sort",
    title: "Merge Sort",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Split in half, sort each half, merge with two indices — stable, O(n log n), and the merge is the whole interview.",
    prompt: [
      "Implement merge sort: return a new array with the numbers of `arr` in ascending order, without using the built-in sort. Equal values must keep their relative order (stable).",
      "",
      "```",
      "mergeSort([9, 3, 6, 2, 1, 11])  ->  [1, 2, 3, 6, 9, 11]",
      "mergeSort([])                   ->  []",
      "```",
    ].join("\n"),
    hints: [
      "Base case: zero or one element is sorted. Otherwise sort the two halves recursively and merge.",
      "Merge with an index into each half, taking from the left on ties for stability, then append whatever remains.",
    ],
    solution: [
      "## Approach",
      "",
      "Recursively split until single elements, then merge pairs of sorted runs: compare the heads, take the smaller (the left one on ties), and append the leftover tail. Each level of recursion touches every element once and there are log n levels.",
      "",
      "## Complexity",
      "",
      "O(n log n) time in every case, O(n) extra space.",
      "",
      "## Worth saying out loud",
      "",
      "- Quick sort is in-place but O(n²) in the worst case and not stable; merge sort is the choice for linked lists and external sorting.",
      "- The bottom-up version (runs of 1, 2, 4, …) avoids recursion; mention it.",
    ].join("\n"),
    judge: {
      solutionCode: `function mergeSort(arr) {
  if (arr.length <= 1) return [...arr];
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) out.push(left[i] <= right[j] ? left[i++] : right[j++]);
  return out.concat(left.slice(i), right.slice(j));
}
`,
      starterCode: `/**
 * @param {number[]} arr
 * @returns {number[]} a new array, sorted ascending
 */
function mergeSort(arr) {
  // Your code here
  return [];
}
`,
      entry: "mergeSort",
      tests: [
        { name: "Prompt example", input: [[9, 3, 6, 2, 1, 11]], expected: [1, 2, 3, 6, 9, 11] },
        { name: "Empty", input: [[]], expected: [] },
        { name: "One element", input: [[5]], expected: [5] },
        { name: "Duplicates", input: [[2, 1, 2, 1]], expected: [1, 1, 2, 2] },
        { name: "Negatives", input: [[3, -1, -7, 0]], expected: [-7, -1, 0, 3] },
        {
          name: "Already sorted, and reversed",
          input: [Array.from({ length: 300 }, (_, i) => 300 - i)],
          expected: Array.from({ length: 300 }, (_, i) => i + 1),
        },
      ],
    },
  },
  {
    slug: "dijkstra-shortest-distances",
    title: "Dijkstra's Shortest Distances",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "A priority queue of tentative distances; a node's distance is final the first time it is popped.",
    prompt: [
      "`graph` maps each node to an object of `{ neighbour: weight }` with non-negative weights. Return an object mapping every node to its shortest distance from `source`, with `null` for nodes that cannot be reached.",
      "",
      "```",
      "dijkstra({ A: { B: 1, C: 4, D: 7 }, B: { C: 2, E: 5 }, C: { D: 1 }, D: { E: 3 }, E: {} }, \"A\")",
      "  ->  { A: 0, B: 1, C: 3, D: 4, E: 6 }",
      "```",
    ].join("\n"),
    hints: [
      "Start with distance 0 at the source and infinity elsewhere. Repeatedly take the unfinished node with the smallest distance and relax its edges.",
      "A binary heap makes the pick O(log n); with a stale-entry check (skip a popped entry whose distance is larger than the recorded one) you never need decrease-key.",
    ],
    solution: [
      "## Approach",
      "",
      "Min-heap of `(distance, node)` pairs seeded with the source. Pop the smallest; if its distance is stale, skip it; otherwise relax each edge, pushing improved distances. Non-negative weights guarantee the first pop of a node is its final distance. Nodes never popped stay unreachable.",
      "",
      "## Complexity",
      "",
      "O((V + E) log V) with a binary heap; O(V²) with a plain array scan, which is fine for small dense graphs.",
      "",
      "## Worth saying out loud",
      "",
      "- Negative edges break the finality argument; that is Bellman-Ford's job.",
      "- Returning the path needs a predecessor map updated on every successful relaxation.",
    ].join("\n"),
    judge: {
      solutionCode: `function dijkstra(graph, source) {
  const distance = Object.fromEntries(Object.keys(graph).map((node) => [node, null]));
  distance[source] = 0;
  // A tiny binary heap of [distance, node]; stale entries are skipped on pop.
  const heap = [[0, source]];
  const push = (entry) => {
    heap.push(entry);
    for (let i = heap.length - 1; i > 0; ) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        let small = i;
        for (const child of [2 * i + 1, 2 * i + 2]) {
          if (child < heap.length && heap[child][0] < heap[small][0]) small = child;
        }
        if (small === i) break;
        [heap[small], heap[i]] = [heap[i], heap[small]];
        i = small;
      }
    }
    return top;
  };
  while (heap.length) {
    const [dist, node] = pop();
    if (dist > distance[node]) continue;
    for (const [next, weight] of Object.entries(graph[node] ?? {})) {
      const candidate = dist + weight;
      if (distance[next] === null || candidate < distance[next]) {
        distance[next] = candidate;
        push([candidate, next]);
      }
    }
  }
  return distance;
}
`,
      starterCode: `/**
 * @param {Record<string, Record<string, number>>} graph node -> { neighbour: weight }
 * @param {string} source
 * @returns {Record<string, number | null>} shortest distance per node, null if unreachable
 */
function dijkstra(graph, source) {
  // Your code here
  return {};
}
`,
      entry: "dijkstra",
      tests: [
        {
          name: "Prompt example",
          input: [{ A: { B: 1, C: 4, D: 7 }, B: { C: 2, E: 5 }, C: { D: 1 }, D: { E: 3 }, E: {} }, "A"],
          expected: { A: 0, B: 1, C: 3, D: 4, E: 6 },
        },
        {
          name: "Nothing reachable from a sink",
          input: [{ A: { B: 1 }, B: { C: 1 }, C: {} }, "C"],
          expected: { A: null, B: null, C: 0 },
        },
        { name: "One unreachable node", input: [{ A: { B: 1 }, B: {}, C: {} }, "A"], expected: { A: 0, B: 1, C: null } },
        { name: "Longer path, lower cost", input: [{ A: { B: 10, C: 1 }, C: { B: 1 }, B: {} }, "A"], expected: { A: 0, B: 2, C: 1 } },
        { name: "Zero-weight edge", input: [{ A: { B: 0 }, B: { A: 0 } }, "B"], expected: { A: 0, B: 0 } },
      ],
    },
  },
];
