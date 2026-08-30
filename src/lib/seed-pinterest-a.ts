import type { Problem } from "./types";

// Pinterest onsite bank, part A: settle-debts and reconstruct-itinerary.
// Sourced from reported phone screens and onsites; prompts keep the original
// wording's semantics. Judged in JavaScript and Python.

export const pinterestProblemsA: Problem[] = [
  {
    slug: "settle-debts",
    title: "Settle Debts",
    category: "algorithms",
    difficulty: "medium",
    companies: ["pinterest"],
    summary: "Net the balances, then match debtors to creditors greedily.",
    prompt: `Friends on a trip pay for each other. Payments are recorded as {payer, amount, payees}: the amount is split **equally** among the payees (the payer may be a payee). Amounts are integer cents; when the split isn't exact, the first amount mod len(payees) payees owe one cent extra.

## Part 1 — settle(payments)

Compute everyone's net balance and return a list of transfers [from, to, amount] that settles all debts. Any valid settlement is accepted, but it must use **at most n − 1 transfers** for n people with a nonzero balance.

\`\`\`
[ {payer: "alice", amount: 4000, payees: ["bob", "jess", "alice", "sam"]},
  {payer: "bob",   amount: 1000, payees: ["alice"]},
  {payer: "sam",   amount: 1000, payees: ["alice"]} ]
=> [["jess", "alice", 1000]]
\`\`\`

## Part 2 — minTransfers(debts)

Debts arrive as (debtor, creditor, amount) triples. Return the **minimum number** of transfers that settles everyone — around 20 people can carry a nonzero balance, and the general problem is NP-hard, so search with pruning is expected.

\`\`\`
debts = [[0, 1, 10], [1, 0, 1], [1, 2, 5], [2, 0, 5]]
=> 1
\`\`\`

## Worth asking out loud

Do the net balances have to sum to zero? (Yes — otherwise the input is inconsistent.) Who eats the remainder cent on an uneven split? Concrete transfers or just the count?`,
    hints: [
      "Only net balances matter: payer +amount, each payee −share. Anyone at zero drops out of the problem entirely.",
      "For Part 1, repeatedly match the largest debtor with the largest creditor and transfer min(|debt|, credit) — one side hits zero each round, so at most n − 1 transfers.",
      "Part 2 is really: partition the nonzero balances into as many zero-sum groups as possible — a group of size g settles internally in g − 1 transfers, so the answer is n − groups.",
    ],
    solution: `## Approach

**Part 1** is bookkeeping plus a greedy. Net every balance (payer gains the full amount, each payee loses their share, remainder cents to the first payees). Then match the most-negative against the most-positive balance; each transfer zeroes at least one of them, which bounds the count at n − 1.

**Part 2** is the NP-hard half. The classic reframing: a set of people whose balances sum to zero can settle among themselves with size − 1 transfers, so minimizing transfers means maximizing the number of disjoint zero-sum groups. Backtracking over balances with pruning (skip zeros, don't pair same-sign values) is what fits the n ≈ 20 constraint.

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

Part 1 runs in O(P + n log n) for P payee entries. Part 2 is exponential with heavy pruning — say that plainly, and mention the subset-DP alternative (count zero-sum groups over bitmasks) for the same bound in O(3^n).`,
    judge: {
      starterCode: `/**
 * Part 1: net the balances, return transfers [from, to, amount] that
 * settle everyone, using at most n - 1 transfers.
 * @param {Array<{payer: string, amount: number, payees: string[]}>} payments
 * @returns {Array<[string, string, number]>}
 */
function settle(payments) {
  // Your code here
  return [];
}

/**
 * Part 2: minimum number of transfers to settle (debtor, creditor, amount)
 * triples.
 * @param {Array<[unknown, unknown, number]>} debts
 * @returns {number}
 */
function minTransfers(debts) {
  // Your code here
  return 0;
}
`,
      entry: "__judgeSettle",
      // settle() has many valid outputs, so it is validated, not compared:
      // apply the returned transfers to the net balances and require all
      // zeros within the n - 1 bound.
      driverCode: `function __judgeSettle(op, payments, debts) {
  if (op === "min") return minTransfers(debts);
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
          name: "Trip from the write-up settles",
          input: [
            "settle",
            [
              { payer: "alice", amount: 4000, payees: ["bob", "jess", "alice", "sam"] },
              { payer: "bob", amount: 1000, payees: ["alice"] },
              { payer: "sam", amount: 1000, payees: ["alice"] },
            ],
            [],
          ],
          expected: { settled: true, withinBound: true },
        },
        {
          name: "Uneven split: remainder cents to the first payees",
          input: [
            "settle",
            [{ payer: "a", amount: 100, payees: ["b", "c", "d"] }],
            [],
          ],
          expected: { settled: true, withinBound: true },
        },
        {
          name: "Already even means no transfers",
          input: ["settle", [{ payer: "a", amount: 300, payees: ["a"] }], []],
          expected: { settled: true, withinBound: true },
        },
        {
          name: "Minimum transfers from the write-up",
          input: ["min", [], [[0, 1, 10], [1, 0, 1], [1, 2, 5], [2, 0, 5]]],
          expected: 1,
        },
        {
          name: "Two independent pairs need two",
          input: ["min", [], [[0, 1, 5], [2, 3, 5]]],
          expected: 2,
        },
        {
          name: "Chain that nets to zero",
          input: ["min", [], [[0, 1, 4], [1, 2, 4], [2, 0, 4]]],
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
    summary: "Hierholzer's walk, plus the loop question that fails candidates.",
    prompt: `You are given flight tickets as [from, to] pairs and a starting airport. Every ticket must be used **exactly once**. Reconstruct the full itinerary; if several are valid, return the **lexicographically smallest** one as a list of airports.

\`\`\`
tickets = [["MUC","LHR"], ["JFK","MUC"], ["SFO","SJC"], ["LHR","SFO"]], start = "JFK"
=> ["JFK", "MUC", "LHR", "SFO", "SJC"]

tickets = [["JFK","SFO"], ["JFK","ATL"], ["SFO","ATL"], ["ATL","JFK"], ["ATL","SFO"]], start = "JFK"
=> ["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"]
\`\`\`

## The follow-up that fails candidates

**Does the itinerary contain a loop?** — that is, does it ever revisit an airport it has already been through? Implement hasLoop(tickets, start) for the same inputs.

## Also be ready for

- The start airport isn't given: find the airport with out-degree = in-degree + 1, else any airport on the circuit.
- The tickets may not form a valid itinerary at all: validate before walking.

Up to 300 tickets; airport codes are three uppercase letters.`,
    hints: [
      "Greedy DFS taking the smallest unused destination. When an airport has no unused tickets left, it must be the END of the route — append it and backtrack. Reverse at the end (Hierholzer's algorithm).",
      "Store each adjacency list in reverse-sorted order so pop() hands you the smallest destination in O(1).",
      "The loop question is about the finished route: any airport appearing twice is a revisit — a set comparison, not another graph algorithm.",
    ],
    solution: `## Approach

This is an Eulerian path — use every **edge** once — so vertex-visited DFS is the wrong tool. Hierholzer's algorithm: walk greedily, always taking the lexicographically smallest unused ticket; when an airport runs out of tickets it is the end of the itinerary, so append it to the route and backtrack. The route, reversed, is the answer. Sorting each adjacency list in reverse lets pop() consume destinations smallest-first.

The loop follow-up needs no graph theory: the itinerary revisits an airport exactly when the route contains a duplicate.

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

O(E log E) for the sort, O(E) for the walk. Two things to say in the room: why greedy-smallest plus backtracking stays correct (the stuck airport is forced to be terminal — postpone it and the rest still completes), and that the second example revisits JFK, ATL, and SFO — so "loops exist" is often the expected answer, not an error case.`,
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

/**
 * Does that itinerary ever revisit an airport?
 * @returns {boolean}
 */
function hasLoop(tickets, start) {
  // Your code here
  return false;
}
`,
      entry: "__judgeItinerary",
      driverCode: `function __judgeItinerary(op, tickets, start) {
  if (op === "loop") return hasLoop(tickets, start);
  return findItinerary(tickets, start);
}`,
      tests: [
        {
          name: "Straight line from the write-up",
          input: ["route", [["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]], "JFK"],
          expected: ["JFK", "MUC", "LHR", "SFO", "SJC"],
        },
        {
          name: "Lexicographic choice matters",
          input: ["route", [["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]], "JFK"],
          expected: ["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"],
        },
        {
          name: "Greedy-smallest dead-ends; backtracking recovers",
          input: ["route", [["JFK", "AAA"], ["JFK", "BBB"], ["BBB", "JFK"]], "JFK"],
          expected: ["JFK", "BBB", "JFK", "AAA"],
        },
        {
          name: "No loop on the straight line",
          input: ["loop", [["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]], "JFK"],
          expected: false,
        },
        {
          name: "Loops exist when airports repeat",
          input: ["loop", [["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]], "JFK"],
          expected: true,
        },
        {
          name: "Single ticket",
          input: ["route", [["JFK", "SFO"]], "JFK"],
          expected: ["JFK", "SFO"],
        },
      ],
    },
  },
];
