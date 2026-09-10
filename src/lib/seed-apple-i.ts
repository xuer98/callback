import type { Problem } from "./types";

// Apple phone-screen bank, part I: the voting system API. Same sourcing and
// conventions as seed-apple-a.ts.

export const appleProblemsI: Problem[] = [
  {
    slug: "voting-service-api",
    title: "Voting System API",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Idempotent writes, a separate read model, and an audit log — the JD asks for all three by name.",
    prompt: [
      "> \"Design the APIs for a voting system.\"",
      "",
      "The second half of an Apple Senior Software Engineer screen that opened with the access-log metrics problem — parse-and-measure, then design-the-surface. Answer in code: a `VotingService` whose methods stand in for the endpoints and return HTTP-style status objects.",
      "",
      "- `createPoll(pollId, options)` → `POST /polls`. `{ status: 201, options }` with the options sorted; `{ status: 409 }` if the poll exists; `{ status: 422 }` if the options are empty or repeat.",
      "- `castVote(pollId, voter, option)` → `PUT /polls/{id}/votes/{voter}` — a **PUT**, so a retried request cannot double-count. `{ status: 404 }` for an unknown poll, `{ status: 409 }` if it is closed, `{ status: 422 }` for an unknown option, `{ status: 201, result: \"recorded\" }` for a voter's first vote, `{ status: 200, result: \"unchanged\" }` for the same vote again, `{ status: 200, result: \"changed\" }` when the voter switches.",
      "- `closePoll(pollId)` → `{ status: 204 }`, or `{ status: 404 }`.",
      "- `results(pollId)` → `{ status: 200, results: [[option, count], ...] }` for options with at least one vote, sorted by count descending then option ascending; `{ status: 404 }` for an unknown poll. Results stay readable after the poll closes.",
      "- `audit()` → every successful mutation, in order: `[\"createPoll\", pollId, options]` (as requested), `[\"vote\", pollId, voter, previousOption | null, option]`, `[\"closePoll\", pollId]`.",
      "",
      "```",
      "svc.createPoll(\"p1\", [\"b\", \"a\"])       ->  { status: 201, options: [\"a\", \"b\"] }",
      "svc.castVote(\"p1\", \"v1\", \"a\")         ->  { status: 201, result: \"recorded\" }",
      "svc.castVote(\"p1\", \"v1\", \"a\")         ->  { status: 200, result: \"unchanged\" }   // safe retry",
      "svc.castVote(\"p1\", \"v1\", \"b\")         ->  { status: 200, result: \"changed\" }",
      "svc.results(\"p1\")                     ->  { status: 200, results: [[\"b\", 1]] }",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Can a voter change their vote, or only cast once? Do results need to be exact and immediate, or is eventual consistency acceptable? Who may close a poll? How is the audit trail consumed — replay, debugging, compliance?",
    ].join("\n"),
    hints: [
      "Key the vote store by (pollId, voter). A cast looks up the previous option: none means recorded, the same means unchanged, different means changed — decrement the old tally and increment the new one so the read model stays consistent.",
      "Keep the tally as its own structure updated on every write, so reads never rescan votes, and append one audit entry per successful mutation before returning.",
    ],
    solution: [
      "## Approach",
      "",
      "Three sentences, in this order, cover what the job description explicitly asks for. One: the vote write is idempotent, so it is `PUT /polls/{id}/votes/{voter}` rather than a POST, and a retried request cannot double-count — the dedupe key is `(poll, voter)`. Two: the tally is a separate read model, updated on every write, so reads never contend with writes or rescan. Three: every mutation appends to an audit log, because a tally you cannot replay is a tally you cannot defend. The reference keeps polls, a `(poll, voter) → option` map, a per-poll tally and the audit list; `castVote` classifies the request by the previous vote and moves one count between options when a voter changes their mind.",
      "",
      "## Complexity",
      "",
      "O(1) per vote, O(options log options) to render results; O(voters + options) space per poll.",
      "",
      "## Worth saying out loud",
      "",
      "- **A voter changes their mind?** The old option is decremented and the new one incremented, and the audit row records both. Handling changes rather than just casts is what makes this a design answer instead of a counter.",
      "- **A million votes a minute?** Append votes to a log (Kafka), materialise the tally asynchronously, serve reads from a cache. Then be honest about what you gave up: results are eventually consistent, so say what staleness the product can tolerate.",
      "- **Stop double voting?** The `(poll, voter)` key is the mechanism, and it needs a uniqueness guarantee at the storage layer, not just in application code.",
      "- **Status codes matter:** 409 on a closed poll, 422 on an unknown option, 200 on an unchanged retry rather than a spurious 201.",
      "- Swap \"poll\" for \"benchmark\" and \"voter\" for \"human rater\" and this is a rating-collection service. Say that out loud in this interview.",
    ].join("\n"),
    judge: {
      solutionCode: `class VotingService {
  constructor() {
    this.polls = new Map();  // pollId -> { options: Set, open }
    this.votes = new Map();  // "pollId\\u0000voter" -> option   (dedupe key)
    this.tally = new Map();  // pollId -> Map(option -> count)   (read model)
    this.log = [];           // every successful mutation
  }

  // POST /polls
  createPoll(pollId, options) {
    if (this.polls.has(pollId)) return { status: 409 };
    if (options.length === 0 || new Set(options).size !== options.length) return { status: 422 };
    this.polls.set(pollId, { options: new Set(options), open: true });
    this.tally.set(pollId, new Map());
    this.log.push(["createPoll", pollId, [...options]]);
    return { status: 201, options: [...options].sort() };
  }

  // PUT /polls/{id}/votes/{voter} — idempotent by construction
  castVote(pollId, voter, option) {
    const poll = this.polls.get(pollId);
    if (!poll) return { status: 404 };
    if (!poll.open) return { status: 409 };
    if (!poll.options.has(option)) return { status: 422 };
    const key = pollId + "\\u0000" + voter;
    const previous = this.votes.get(key) ?? null;
    if (previous === option) return { status: 200, result: "unchanged" }; // safe retry
    const counts = this.tally.get(pollId);
    if (previous !== null) counts.set(previous, counts.get(previous) - 1);
    counts.set(option, (counts.get(option) ?? 0) + 1);
    this.votes.set(key, option);
    this.log.push(["vote", pollId, voter, previous, option]);
    return previous === null ? { status: 201, result: "recorded" } : { status: 200, result: "changed" };
  }

  // POST /polls/{id}/close
  closePoll(pollId) {
    const poll = this.polls.get(pollId);
    if (!poll) return { status: 404 };
    poll.open = false;
    this.log.push(["closePoll", pollId]);
    return { status: 204 };
  }

  // GET /polls/{id}/results
  results(pollId) {
    const counts = this.tally.get(pollId);
    if (!counts) return { status: 404 };
    const results = [...counts]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return { status: 200, results };
  }

  audit() {
    return this.log.map((entry) => [...entry]);
  }
}
`,
      starterCode: `class VotingService {
  constructor() {
    // Your state here: polls, votes keyed by (poll, voter), a tally, an audit log
  }

  /** POST /polls  -> { status: 201, options } | { status: 409 } | { status: 422 } */
  createPoll(pollId, options) {
    return { status: 422 };
  }

  /** PUT /polls/{id}/votes/{voter} -> { status, result? } */
  castVote(pollId, voter, option) {
    return { status: 404 };
  }

  /** POST /polls/{id}/close -> { status: 204 } | { status: 404 } */
  closePoll(pollId) {
    return { status: 404 };
  }

  /** GET /polls/{id}/results -> { status: 200, results: [[option, count], ...] } | { status: 404 } */
  results(pollId) {
    return { status: 404 };
  }

  /** Every successful mutation, in order. */
  audit() {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let service = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "VotingService") {
      service = new VotingService();
      out.push(null);
    } else {
      out.push(service[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Prompt lifecycle with an audit trail",
          input: [
            ["VotingService", "createPoll", "castVote", "castVote", "castVote", "castVote", "results", "closePoll", "castVote", "results", "audit"],
            [[], ["p1", ["b", "a"]], ["p1", "v1", "a"], ["p1", "v1", "a"], ["p1", "v2", "b"], ["p1", "v1", "b"], ["p1"], ["p1"], ["p1", "v3", "a"], ["p1"], []],
          ],
          expected: [
            null,
            { status: 201, options: ["a", "b"] },
            { status: 201, result: "recorded" },
            { status: 200, result: "unchanged" },
            { status: 201, result: "recorded" },
            { status: 200, result: "changed" },
            { status: 200, results: [["b", 2]] },
            { status: 204 },
            { status: 409 },
            { status: 200, results: [["b", 2]] },
            [["createPoll", "p1", ["b", "a"]], ["vote", "p1", "v1", null, "a"], ["vote", "p1", "v2", null, "b"], ["vote", "p1", "v1", "a", "b"], ["closePoll", "p1"]],
          ],
        },
        {
          name: "Validation and unknown resources",
          input: [
            ["VotingService", "createPoll", "createPoll", "createPoll", "createPoll", "castVote", "castVote", "closePoll", "results", "audit"],
            [[], ["p", []], ["p", ["x", "x"]], ["p", ["x"]], ["p", ["y"]], ["nope", "v", "x"], ["p", "v", "zzz"], ["nope"], ["nope"], []],
          ],
          expected: [
            null,
            { status: 422 },
            { status: 422 },
            { status: 201, options: ["x"] },
            { status: 409 },
            { status: 404 },
            { status: 422 },
            { status: 404 },
            { status: 404 },
            [["createPoll", "p", ["x"]]],
          ],
        },
        {
          name: "Results order: count descending, then option",
          input: [
            ["VotingService", "createPoll", "castVote", "castVote", "castVote", "castVote", "results"],
            [[], ["p", ["a", "b", "c"]], ["p", "v1", "a"], ["p", "v2", "b"], ["p", "v3", "c"], ["p", "v4", "b"], ["p"]],
          ],
          expected: [
            null,
            { status: 201, options: ["a", "b", "c"] },
            { status: 201, result: "recorded" },
            { status: 201, result: "recorded" },
            { status: 201, result: "recorded" },
            { status: 201, result: "recorded" },
            { status: 200, results: [["b", 2], ["a", 1], ["c", 1]] },
          ],
        },
        {
          name: "Changing back and forth keeps the tally consistent",
          input: [
            ["VotingService", "createPoll", "castVote", "castVote", "castVote", "results", "audit"],
            [[], ["p", ["a", "b"]], ["p", "v1", "a"], ["p", "v1", "b"], ["p", "v1", "a"], ["p"], []],
          ],
          expected: [
            null,
            { status: 201, options: ["a", "b"] },
            { status: 201, result: "recorded" },
            { status: 200, result: "changed" },
            { status: 200, result: "changed" },
            { status: 200, results: [["a", 1]] },
            [["createPoll", "p", ["a", "b"]], ["vote", "p", "v1", null, "a"], ["vote", "p", "v1", "a", "b"], ["vote", "p", "v1", "b", "a"]],
          ],
        },
        {
          name: "A poll with no votes has empty results; closing twice is fine",
          input: [["VotingService", "createPoll", "results", "closePoll", "closePoll", "results"], [[], ["p", ["a"]], ["p"], ["p"], ["p"], ["p"]]],
          expected: [null, { status: 201, options: ["a"] }, { status: 200, results: [] }, { status: 204 }, { status: 204 }, { status: 200, results: [] }],
        },
      ],
    },
  },
];
