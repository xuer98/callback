import type { Problem } from "./types";

// Pinterest onsite bank, part A: settling debts and reconstructing an
// itinerary, one question per problem. Judged in JavaScript and Python.

export const pinterestProblemsA: Problem[] = [
  {
    slug: "settle-debts",
    title: "Settle Debts",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Net the balances, then match debtors to creditors greedily.",
    prompt: `Friends on a trip pay for each other. Payments are recorded as {payer, amount, payees}: the amount is split **equally** among the payees (the payer may be a payee). Amounts are integer cents; when the split isn't exact, the first amount mod len(payees) payees owe one cent extra.

Implement settle(payments): compute everyone's net balance and return a list of transfers [from, to, amount] that settles all debts. Any valid settlement is accepted, but it must use **at most n − 1 transfers** for n people with a nonzero balance.

\`\`\`
[ {payer: "alice", amount: 4000, payees: ["bob", "jess", "alice", "sam"]},
  {payer: "bob",   amount: 1000, payees: ["alice"]},
  {payer: "sam",   amount: 1000, payees: ["alice"]} ]
=> [["jess", "alice", 1000]]
\`\`\``,
    hints: [
      "Only net balances matter: payer +amount, each payee −share. Anyone at zero drops out of the problem entirely.",
      "Repeatedly match the largest debtor with the largest creditor and transfer min(|debt|, credit) — one side hits zero each round, so at most n − 1 transfers.",
    ],
    solution: `## Approach

Bookkeeping plus a greedy. Net every balance (payer gains the full amount, each payee loses their share, remainder cents to the first payees). Then match the most-negative against the most-positive balance; each transfer zeroes at least one of them, which bounds the count at n − 1. The balances always sum to zero, so both lists run out together.

\`\`\`python
from collections import defaultdict


def settle(payments):
    bal = defaultdict(int)
    for p in payments:
        payer, amount, payees = p["payer"], p["amount"], p["payees"]
        share, rem = divmod(amount, len(payees))
        bal[payer] += amount
        for i, payee in enumerate(payees):
            bal[payee] -= share + (1 if i < rem else 0)

    debtors = sorted((b, name) for name, b in bal.items() if b < 0)
    creditors = sorted(
        ((b, name) for name, b in bal.items() if b > 0), reverse=True
    )
    transfers = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        owed, frm = debtors[i]
        due, to = creditors[j]
        amount = min(-owed, due)
        transfers.append([frm, to, amount])
        debtors[i] = (owed + amount, frm)
        creditors[j] = (due - amount, to)
        if debtors[i][0] == 0:
            i += 1
        if creditors[j][0] == 0:
            j += 1
    return transfers
\`\`\`

O(P + n log n) for P payee entries. n − 1 is an upper bound, not the minimum: finding the fewest transfers is a different, NP-hard problem — see [Minimum Transfers to Settle Debts](/problems/minimum-debt-transfers).`,
    judge: {
      starterCode: `/**
 * Net the balances, return transfers [from, to, amount] that settle
 * everyone, using at most n - 1 transfers.
 * @param {Array<{payer: string, amount: number, payees: string[]}>} payments
 * @returns {Array<[string, string, number]>}
 */
function settle(payments) {
  // Your code here
  return [];
}
`,
      entry: "__judgeSettle",
      // settle() has many valid outputs, so it is validated, not compared:
      // apply the returned transfers to the net balances and require all
      // zeros within the n - 1 bound.
      driverCode: `function __judgeSettle(payments) {
  const bal = new Map();
  const add = (who, delta) => bal.set(who, (bal.get(who) ?? 0) + delta);
  for (const p of payments) {
    const share = Math.floor(p.amount / p.payees.length);
    const rem = p.amount % p.payees.length;
    add(p.payer, p.amount);
    p.payees.forEach((payee, i) => add(payee, -(share + (i < rem ? 1 : 0))));
  }
  const nonzero = [...bal.values()].filter((b) => b !== 0).length;
  const transfers = settle(payments);
  if (!Array.isArray(transfers)) return "not a list";
  for (const t of transfers) {
    if (!Array.isArray(t) || t.length !== 3 || typeof t[2] !== "number" || t[2] <= 0) {
      return "malformed transfer";
    }
    add(t[0], t[2]);
    add(t[1], -t[2]);
  }
  const settled = [...bal.values()].every((b) => b === 0);
  return {
    settled,
    withinBound: transfers.length <= Math.max(0, nonzero - 1),
  };
}`,
      tests: [
        {
          name: "Trip example settles",
          input: [
            [
              { payer: "alice", amount: 4000, payees: ["bob", "jess", "alice", "sam"] },
              { payer: "bob", amount: 1000, payees: ["alice"] },
              { payer: "sam", amount: 1000, payees: ["alice"] },
            ],
          ],
          expected: { settled: true, withinBound: true },
        },
        {
          name: "Uneven split: remainder cents to the first payees",
          input: [[{ payer: "a", amount: 100, payees: ["b", "c", "d"] }]],
          expected: { settled: true, withinBound: true },
        },
        {
          name: "Already even means no transfers",
          input: [[{ payer: "a", amount: 300, payees: ["a"] }]],
          expected: { settled: true, withinBound: true },
        },
        {
          name: "Several payers and overlapping payees",
          input: [
            [
              { payer: "a", amount: 900, payees: ["a", "b", "c"] },
              { payer: "b", amount: 500, payees: ["c", "d"] },
              { payer: "d", amount: 70, payees: ["a", "b", "c", "d"] },
            ],
          ],
          expected: { settled: true, withinBound: true },
        },
      ],
    },
  },
  {
    slug: "minimum-debt-transfers",
    title: "Minimum Transfers to Settle Debts",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Split the nonzero balances into as many zero-sum groups as possible.",
    prompt: `Debts arrive as (debtor, creditor, amount) triples: the debtor owes the creditor that amount. Return the **minimum number** of transfers that settles everyone. A transfer moves any amount from one person to another.

\`\`\`
debts = [[0, 1, 10], [1, 0, 1], [1, 2, 5], [2, 0, 5]]
=> 1        (person 1 pays person 0 four; everyone else nets to zero)
\`\`\`

Around 20 people can carry a nonzero balance. The general problem is NP-hard, so a search with good pruning is expected.`,
    hints: [
      "Only net balances matter: debtor −amount, creditor +amount. Anyone at zero drops out of the problem entirely.",
      "A group of g people whose balances sum to zero settles internally in g − 1 transfers. So the answer is n − (the most disjoint zero-sum groups you can form).",
      "Backtracking: settle balance i against each later balance of the opposite sign, recurse, and undo. Skipping a value you already tried at this level prunes most of the tree.",
    ],
    solution: `## Approach

Net the triples into balances and drop the zeros. The reframing that makes it tractable: a set of people whose balances sum to zero can settle among themselves with size − 1 transfers, so minimizing transfers means maximizing the number of disjoint zero-sum groups. Backtracking over the balances with pruning (skip zeros, only pair opposite signs, never retry a value already tried at this depth) fits the n ≈ 20 constraint.

\`\`\`python
from collections import defaultdict


def min_transfers(debts):
    bal = defaultdict(int)
    for debtor, creditor, amount in debts:
        bal[debtor] -= amount
        bal[creditor] += amount
    balances = [b for b in bal.values() if b != 0]

    def settle_from(i):
        while i < len(balances) and balances[i] == 0:
            i += 1
        if i == len(balances):
            return 0
        best = float("inf")
        seen = set()
        for j in range(i + 1, len(balances)):
            opposite = balances[i] * balances[j] < 0
            if opposite and balances[j] not in seen:
                seen.add(balances[j])
                balances[j] += balances[i]
                best = min(best, 1 + settle_from(i + 1))
                balances[j] -= balances[i]
        return best

    return settle_from(0) if balances else 0
\`\`\`

Exponential with heavy pruning — say that plainly. The subset-DP alternative counts zero-sum groups over bitmasks: dp[mask] = the most groups within mask, O(2^n · n) with prefix sums of the mask, which is the version to reach for when n is exactly 20 and the balances are adversarial.`,
    judge: {
      starterCode: `/**
 * Minimum number of transfers to settle (debtor, creditor, amount) triples.
 * @param {Array<[unknown, unknown, number]>} debts
 * @returns {number}
 */
function minTransfers(debts) {
  // Your code here
  return 0;
}
`,
      entry: "minTransfers",
      tests: [
        {
          name: "Four debts collapse to one transfer",
          input: [[[0, 1, 10], [1, 0, 1], [1, 2, 5], [2, 0, 5]]],
          expected: 1,
        },
        {
          name: "Two independent pairs need two",
          input: [[[0, 1, 5], [2, 3, 5]]],
          expected: 2,
        },
        {
          name: "Chain that nets to zero",
          input: [[[0, 1, 4], [1, 2, 4], [2, 0, 4]]],
          expected: 0,
        },
        {
          name: "Largest-debtor-first greedy needs one more",
          input: [[[2, 1, 2], [3, 0, 2], [4, 0, 3], [0, 1, 1]]],
          expected: 3,
        },
        {
          name: "No debts",
          input: [[]],
          expected: 0,
        },
      ],
    },
  },
  {
    slug: "reconstruct-itinerary",
    title: "Reconstruct Itinerary",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Use every ticket once: Hierholzer's walk, smallest destination first.",
    prompt: `You are given flight tickets as [from, to] pairs and a starting airport. Every ticket must be used **exactly once**. Reconstruct the full itinerary; if several are valid, return the **lexicographically smallest** one as a list of airports.

\`\`\`
tickets = [["MUC","LHR"], ["JFK","MUC"], ["SFO","SJC"], ["LHR","SFO"]], start = "JFK"
=> ["JFK", "MUC", "LHR", "SFO", "SJC"]

tickets = [["JFK","SFO"], ["JFK","ATL"], ["SFO","ATL"], ["ATL","JFK"], ["ATL","SFO"]], start = "JFK"
=> ["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"]
\`\`\`

Up to 300 tickets; airport codes are three uppercase letters. The tickets always form at least one valid itinerary from start.`,
    hints: [
      "Greedy DFS taking the smallest unused destination. When an airport has no unused tickets left, it must be the END of the route — append it and backtrack. Reverse at the end (Hierholzer's algorithm).",
      "Store each adjacency list in reverse-sorted order so pop() hands you the smallest destination in O(1).",
    ],
    solution: `## Approach

This is an Eulerian path — use every **edge** once — so vertex-visited DFS is the wrong tool. Hierholzer's algorithm: walk greedily, always taking the lexicographically smallest unused ticket; when an airport runs out of tickets it is the end of the itinerary, so append it to the route and backtrack. The route, reversed, is the answer. Sorting each adjacency list in reverse lets pop() consume destinations smallest-first.

\`\`\`python
from collections import defaultdict


def find_itinerary(tickets, start):
    graph = defaultdict(list)
    for frm, to in tickets:
        graph[frm].append(to)
    for dests in graph.values():
        dests.sort(reverse=True)

    route = []
    stack = [start]
    while stack:
        while graph[stack[-1]]:
            stack.append(graph[stack[-1]].pop())
        route.append(stack.pop())
    route.reverse()
    return route
\`\`\`

O(E log E) for the sort, O(E) for the walk.

## Worth saying out loud

- Why greedy-smallest plus backtracking stays correct: the stuck airport is forced to be terminal — postpone it and the rest still completes.
- If the start airport isn't given, it is the one whose out-degree is one more than its in-degree; when every airport is balanced the route is a circuit and any airport on it works.
- If the tickets might not form a valid itinerary, check the degree conditions and that every ticket's airport is reachable before walking, or compare the route's length with tickets + 1 afterwards.`,
    judge: {
      starterCode: `/**
 * Use every ticket exactly once, starting at start; return the
 * lexicographically smallest itinerary as a list of airports.
 * @param {Array<[string, string]>} tickets
 * @param {string} start
 * @returns {string[]}
 */
function findItinerary(tickets, start) {
  // Your code here
  return [];
}
`,
      entry: "findItinerary",
      tests: [
        {
          name: "Straight line",
          input: [[["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]], "JFK"],
          expected: ["JFK", "MUC", "LHR", "SFO", "SJC"],
        },
        {
          name: "Lexicographic choice matters",
          input: [[["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]], "JFK"],
          expected: ["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"],
        },
        {
          name: "Greedy-smallest dead-ends; backtracking recovers",
          input: [[["JFK", "AAA"], ["JFK", "BBB"], ["BBB", "JFK"]], "JFK"],
          expected: ["JFK", "BBB", "JFK", "AAA"],
        },
        {
          name: "Single ticket",
          input: [[["JFK", "SFO"]], "JFK"],
          expected: ["JFK", "SFO"],
        },
      ],
    },
  },
  {
    slug: "itinerary-revisits-airport",
    title: "Does the Itinerary Revisit an Airport?",
    category: "algorithms",
    difficulty: "hard",
    companies: ["pinterest"],
    summary: "Rebuild the itinerary with Hierholzer's walk, then look for a repeat.",
    prompt: `You are given flight tickets as [from, to] pairs and a starting airport. The itinerary uses every ticket **exactly once**, starting at start; when several are valid, it is the **lexicographically smallest** one.

Return whether that itinerary ever **revisits** an airport it has already been through.

\`\`\`
tickets = [["MUC","LHR"], ["JFK","MUC"], ["SFO","SJC"], ["LHR","SFO"]], start = "JFK"
itinerary JFK, MUC, LHR, SFO, SJC                     => false

tickets = [["JFK","SFO"], ["JFK","ATL"], ["SFO","ATL"], ["ATL","JFK"], ["ATL","SFO"]], start = "JFK"
itinerary JFK, ATL, JFK, SFO, ATL, SFO                => true
\`\`\`

Up to 300 tickets; airport codes are three uppercase letters. The tickets always form at least one valid itinerary from start.`,
    hints: [
      "First reconstruct the itinerary: greedy DFS over reverse-sorted adjacency lists, appending an airport to the route when it has no tickets left, then reversing (Hierholzer's algorithm).",
      "The question is about the finished route: any airport appearing twice is a revisit — a set comparison, not another graph algorithm.",
    ],
    solution: `## Approach

Two steps. Reconstruct the itinerary with Hierholzer's algorithm — walk greedily taking the smallest unused ticket, append an airport to the route once it has no tickets left, reverse at the end. Then the itinerary revisits an airport exactly when the route contains a duplicate.

\`\`\`python
from collections import defaultdict


def find_itinerary(tickets, start):
    graph = defaultdict(list)
    for frm, to in tickets:
        graph[frm].append(to)
    for dests in graph.values():
        dests.sort(reverse=True)

    route = []
    stack = [start]
    while stack:
        while graph[stack[-1]]:
            stack.append(graph[stack[-1]].pop())
        route.append(stack.pop())
    route.reverse()
    return route


def has_loop(tickets, start):
    route = find_itinerary(tickets, start)
    return len(route) != len(set(route))
\`\`\`

O(E log E) overall.

## Worth saying out loud

- The graph question and the route question differ. A cycle in the ticket graph does not have to show up as a repeat in some orderings, but the itinerary is fixed by the lexicographic rule, so check the route itself.
- Revisits are common, not an error case: any airport with two outgoing tickets is necessarily passed through twice.`,
    judge: {
      starterCode: `/**
 * Does the lexicographically smallest itinerary that uses every ticket
 * exactly once, starting at start, ever revisit an airport?
 * @param {Array<[string, string]>} tickets
 * @param {string} start
 * @returns {boolean}
 */
function hasLoop(tickets, start) {
  // Your code here
  return false;
}
`,
      entry: "hasLoop",
      tests: [
        {
          name: "No revisit on a straight line",
          input: [[["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]], "JFK"],
          expected: false,
        },
        {
          name: "Airports repeat",
          input: [[["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]], "JFK"],
          expected: true,
        },
        {
          name: "Single ticket",
          input: [[["JFK", "SFO"]], "JFK"],
          expected: false,
        },
        {
          name: "Returning to the start counts",
          input: [[["JFK", "SFO"], ["SFO", "JFK"]], "JFK"],
          expected: true,
        },
      ],
    },
  },
];
