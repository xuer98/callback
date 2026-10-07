import type { Problem } from "./types";

// Snowflake coding bank, part R: graph three-colouring and paying with
// change. Judged in JavaScript and Python; the Python judges live in
// seed-python-snowflake-d.ts.

export const snowflakeProblemsR: Problem[] = [
  {
    slug: "three-colorable-graph",
    title: "Is the Graph Three-Colourable?",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Backtracking over the vertices: try each colour not used by a coloured neighbour, undo on failure.",
    prompt: [
      "An undirected graph has `n` vertices, `0` to `n - 1`, and `edges`. Return whether the vertices can be coloured with three colours so that no edge joins two vertices of the same colour.",
      "",
      "```",
      "isThreeColorable(3, [[0, 1], [1, 2], [2, 0]])                              ->  true",
      "isThreeColorable(4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]])      ->  false   // K4",
      "```",
    ].join("\n"),
    hints: [
      "Assign colours vertex by vertex. For vertex i, try each of the three colours that no already-coloured neighbour has; recurse; undo and try the next colour when the recursion fails.",
      "Fix the first vertex's colour to 0 — the three colourings that differ only by renaming are the same, and skipping them cuts the search by a factor of three.",
    ],
    solution: [
      "## Approach",
      "",
      "Backtracking search. Keep a colour per vertex (−1 for none). Colour vertex `i` with each colour that none of its coloured neighbours uses, recurse on `i + 1`, and undo on failure; success when every vertex is coloured. The search is exponential in the worst case — three-colouring is NP-complete — but pruning by neighbours and fixing the first vertex's colour make it fast on interview-sized graphs.",
      "",
      "## Complexity",
      "",
      "O(3ⁿ · (n + E)) in the worst case; O(n) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Two colours is a different problem: bipartiteness, checked in linear time with BFS. Three is where the hardness starts, and saying so is part of the answer.",
      "- Heuristics that matter in practice: colour high-degree vertices first, and check consistency as soon as a neighbour is coloured rather than at the end.",
    ].join("\n"),
    judge: {
      solutionCode: `// Backtracking with pruning by coloured neighbours; the first vertex is fixed to colour 0.
function isThreeColorable(n, edges) {
  const adjacent = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adjacent[a].push(b);
    adjacent[b].push(a);
  }
  const colour = new Array(n).fill(-1);
  const extend = (vertex) => {
    if (vertex === n) return true;
    for (let c = 0; c < (vertex === 0 ? 1 : 3); c++) {
      if (adjacent[vertex].some((other) => colour[other] === c)) continue;
      colour[vertex] = c;
      if (extend(vertex + 1)) return true;
      colour[vertex] = -1;
    }
    return false;
  };
  return extend(0);
}
`,
      starterCode: `/**
 * @param {number} n vertices 0..n-1
 * @param {number[][]} edges undirected [a, b] pairs
 * @returns {boolean} whether three colours suffice
 */
function isThreeColorable(n, edges) {
  // Your code here
  return false;
}
`,
      entry: "isThreeColorable",
      tests: [
        {
          name: "A triangle",
          input: [
            3,
            [
              [0, 1],
              [1, 2],
              [2, 0],
            ],
          ],
          expected: true,
        },
        {
          name: "K4 needs four colours",
          input: [
            4,
            [
              [0, 1],
              [0, 2],
              [0, 3],
              [1, 2],
              [1, 3],
              [2, 3],
            ],
          ],
          expected: false,
        },
        { name: "No edges", input: [5, []], expected: true },
        {
          name: "An even cycle",
          input: [
            4,
            [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 0],
            ],
          ],
          expected: true,
        },
        {
          name: "A wheel around an odd cycle",
          input: [
            6,
            [
              [0, 1],
              [0, 2],
              [0, 3],
              [0, 4],
              [0, 5],
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
              [5, 1],
            ],
          ],
          expected: false,
        },
        {
          name: "A wheel around an even cycle",
          input: [
            7,
            [
              [0, 1],
              [0, 2],
              [0, 3],
              [0, 4],
              [0, 5],
              [0, 6],
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
              [5, 6],
              [6, 1],
            ],
          ],
          expected: true,
        },
        {
          name: "K4 minus an edge",
          input: [
            4,
            [
              [0, 1],
              [0, 2],
              [0, 3],
              [1, 2],
              [1, 3],
            ],
          ],
          expected: true,
        },
        {
          name: "The Petersen graph",
          input: [
            10,
            [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 0],
              [0, 5],
              [1, 6],
              [2, 7],
              [3, 8],
              [4, 9],
              [5, 7],
              [7, 9],
              [9, 6],
              [6, 8],
              [8, 5],
            ],
          ],
          expected: true,
        },
        { name: "No vertices", input: [0, []], expected: true },
      ],
    },
  },
  {
    slug: "fewest-coins-with-change",
    title: "Fewest Coins When Change Is Given",
    category: "algorithms",
    difficulty: "medium",
    companies: ["snowflake"],
    summary: "Overpaying can save coins: minimise coins handed over plus coins handed back, over every payment up to one large coin above the price.",
    prompt: [
      "You pay a price with coins of `1, 5, 10, 50, 100` and `200`, and the cashier gives change in the same coins. You may overpay. Return the fewest coins that change hands in total — the coins you pay plus the coins you get back.",
      "",
      "```",
      "fewestCoinsWithChange(95)  ->  2      // pay 100, get 5 back",
      "fewestCoinsWithChange(7)   ->  3      // pay 5 + 1 + 1",
      "fewestCoinsWithChange(0)   ->  0",
      "```",
    ].join("\n"),
    hints: [
      "coins(x), the fewest coins making exactly x, is the classic coin-change DP (or greedy, since these denominations are canonical).",
      "Try every payment P from the price up to the price plus 199: the total is coins(P) + coins(P − price). Change of 200 or more is never optimal, because both sides could drop a 200 coin.",
    ],
    solution: [
      "## Approach",
      "",
      "Split the exchange into the amount paid `P` and the change `P − price`, each made with the fewest coins. `coins(x)` comes from one DP over amounts (unbounded coin change), and the answer is the minimum of `coins(P) + coins(P − price)` over `P` from the price upward. The search stops at `price + 199`: if the change were 200 or more, both the payment and the change could lose one 200 coin and improve. With canonical denominations like these, `coins(x)` is also just the greedy count.",
      "",
      "## Complexity",
      "",
      "O((price + 200) · denominations) time; O(price + 200) space.",
      "",
      "## Worth saying out loud",
      "",
      "- Justify the search bound, not just the DP; it is the step that turns an unbounded problem into a finite one.",
      "- For arbitrary denominations greedy fails (think 1, 3, 4 for 6), so the DP is the general tool and greedy is the shortcut you may take here.",
    ].join("\n"),
    judge: {
      solutionCode: `// Minimise coins paid plus coins returned over every payment up to one 200 above the price.
function fewestCoinsWithChange(price) {
  const denominations = [1, 5, 10, 50, 100, 200];
  const limit = price + 200;
  const coins = new Array(limit + 1).fill(Infinity);    // fewest coins making exactly x
  coins[0] = 0;
  for (let x = 1; x <= limit; x++) {
    for (const d of denominations) {
      if (d <= x && coins[x - d] + 1 < coins[x]) coins[x] = coins[x - d] + 1;
    }
  }
  let best = Infinity;
  for (let paid = price; paid < price + 200; paid++) {
    best = Math.min(best, coins[paid] + coins[paid - price]);
  }
  return best;
}
`,
      starterCode: `/**
 * @param {number} price a non-negative integer
 * @returns {number} the fewest coins that change hands, paying with 1, 5, 10, 50, 100 and 200
 */
function fewestCoinsWithChange(price) {
  // Your code here
  return 0;
}
`,
      entry: "fewestCoinsWithChange",
      tests: [
        { name: "Overpay and get change", input: [95], expected: 2 },
        { name: "Exact is better", input: [7], expected: 3 },
        { name: "Nothing to pay", input: [0], expected: 0 },
        { name: "One coin", input: [1], expected: 1 },
        { name: "A single coin and one back", input: [199], expected: 2 },
        { name: "Two ways to two coins", input: [150], expected: 2 },
        { name: "Round up to the next big coin", input: [90], expected: 2 },
        { name: "Exact with two coins", input: [60], expected: 2 },
        { name: "Overpay by five", input: [45], expected: 2 },
        { name: "Pay with big coins, one coin back", input: [249], expected: 3 },
        { name: "A large price", input: [999], expected: 6 },
      ],
    },
  },
];
