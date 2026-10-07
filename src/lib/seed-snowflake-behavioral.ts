import type { Problem } from "./types";

// Snowflake behavioral questions. Each is a document problem: the question,
// what the answer has to contain, and what a strong one sounds like. Prepare
// a 60-second and a 3-minute version of each story.

const FRAMING =
  "Answer in the first person with your own decisions, in under three minutes, and have a 60-second version ready for a round that keeps interrupting.";

const behavioral = (slug: string, title: string, summary: string, prompt: string[], hints: string[], solution: string[]): Problem => ({
  slug,
  title,
  category: "behavioral",
  difficulty: "medium",
  companies: ["snowflake"],
  summary,
  prompt: [...prompt, "", FRAMING].join("\n"),
  hints,
  solution: solution.join("\n"),
});

export const snowflakeBehavioralProblems: Problem[] = [
  behavioral(
    "project-you-are-most-proud-of",
    "The Project You Are Most Proud Of",
    "Your flagship story: the goal, your role, the hardest technical problem, and a measurable result.",
    [
      "Tell me about the project you are most proud of.",
      "",
      "This question opens coding rounds as well as behavioral ones, so the story has to work at two lengths. Cover the goal, what you personally owned, the hardest technical problem and how you solved it, and a result you can put a number on.",
    ],
    [
      "Pick a project you can go three levels deep on: an interviewer will follow up on whichever part sounds hardest.",
      "Lead with the outcome, then the problem, then your decisions — not the chronology.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The goal in one sentence, and why it mattered to the business or the users.",
      "- Your role stated plainly: what you designed, built or decided, as distinct from the team.",
      "- The hardest technical problem, the options you weighed, and why you chose the one you did.",
      "- A measured result: latency, cost, adoption, incidents avoided.",
      "- One thing you would do differently, which is what turns a brag into judgment.",
    ],
  ),
  behavioral(
    "most-complex-backend-work",
    "Your Most Complex Back-End Work",
    "The same flagship project, told through its hardest design decision.",
    [
      "What was the most complex back-end work at your current company?",
      "",
      "Tell it through the design decision that made it hard: the constraint, the alternatives, the trade-off you accepted, and how you verified it in production.",
    ],
    [
      "Reuse your flagship project, but change the spine of the story from outcome to decision.",
      "Name the alternative you rejected and what it would have cost; complexity without a rejected alternative sounds like confusion.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The constraint that created the complexity: scale, consistency, latency, a legacy system.",
      "- Two or three designs you considered, each with the thing it would have given up.",
      "- The decision, the trade-off you accepted on purpose, and how you limited its downside.",
      "- How you knew it worked: load tests, shadow traffic, metrics after launch.",
    ],
  ),
  behavioral(
    "conflict-with-colleague-or-stakeholder",
    "A Conflict With a Colleague or Stakeholder",
    "A disagreement where you changed the outcome, or changed your mind.",
    [
      "Tell me about a conflict or disagreement with a colleague or a stakeholder.",
      "",
      "Describe what each side wanted and why, how you found out what the disagreement was really about, what you did, and how it ended — including what the relationship was like afterwards.",
    ],
    [
      "Choose a disagreement about substance — a design, a priority, a deadline — not a personality clash.",
      "The strongest endings are either that you changed the outcome with evidence, or that you changed your mind; both show how you handle being wrong.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- Both positions stated fairly, including the legitimate reason behind the one you disagreed with.",
      "- The move that resolved it: data you gathered, a prototype, a smaller experiment, a conversation that surfaced the real constraint.",
      "- The outcome and what you learned about how you argue.",
      "- No villain. Interviewers listen for whether you can disagree and still work with someone next week.",
    ],
  ),
  behavioral(
    "hardest-situation-at-work",
    "Your Hardest Situation at Work",
    "A deadline or an incident where you had to cut scope and manage risk.",
    [
      "What was the biggest challenge or the hardest situation you have faced at work?",
      "",
      "Pick a deadline or an incident. Explain what made it hard, the decisions you made under pressure — especially what you cut — and the result.",
    ],
    [
      "Scope cutting is the mark of judgment here: what did you decide not to do, and how did you decide?",
      "If it was an incident, include the follow-up that made the next one less likely.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The stakes and the constraint, in two sentences.",
      "- The decisions: what you prioritised, what you dropped or deferred, and who you told.",
      "- How you managed risk while moving fast — a rollback plan, a feature flag, extra monitoring.",
      "- The result, and the change you made afterwards so the situation would not recur.",
    ],
  ),
  behavioral(
    "time-you-pushed-back",
    "A Time You Pushed Back",
    "Declining or reshaping a request, with the reasoning and the result.",
    [
      "Tell me about a time you pushed back on a request.",
      "",
      "Describe the request, why you disagreed with it, how you said so, what you proposed instead, and what happened.",
    ],
    [
      "Push-back lands when it comes with an alternative; a refusal alone is a different story.",
      "Show that you understood the requester's goal and served it another way.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The request and the goal behind it, taken seriously.",
      "- Your specific objection — risk, cost, a better path — with the evidence you brought.",
      "- The alternative you proposed and how you got agreement.",
      "- The outcome, including whether you were right, and how you would handle it if you had been wrong.",
    ],
  ),
  behavioral(
    "delivering-under-tight-deadline",
    "Delivering Under a Tight Deadline",
    "What you did when the time was not enough: sequencing, trade-offs, communication.",
    [
      "Tell me about a time you had to deliver under a tight deadline.",
      "",
      "Explain how you decided what to build first, which corners you cut knowingly and which you refused to cut, and how you kept people informed.",
    ],
    [
      "Separate the corners you cut on purpose, with a plan to repay them, from the quality bar you held.",
      "Communication is half the answer: when did stakeholders learn what would and would not ship?",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The deadline and why it was fixed.",
      "- The ordering decision: the thinnest version that met the need, then increments.",
      "- Debt taken on deliberately, tracked, and paid down afterwards — and the line you did not cross, such as tests or data integrity.",
      "- Early, specific communication about scope, and the result.",
    ],
  ),
  behavioral(
    "mentoring-someone",
    "Mentoring Someone",
    "How you helped someone grow, and how you knew it worked.",
    ["Tell me about a time you mentored someone.", "", "Describe where they started, what you did that was specific to them, and how you measured the change."],
    [
      "Mentoring stories fail when they are generic; name the one skill or habit you worked on and the concrete technique you used.",
      "Include something you learned from them.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The gap you noticed and how you raised it with them.",
      "- The method: pairing, reviewing their design before the code, handing them a scoped piece of ownership, a feedback loop.",
      "- Evidence it worked: a project they led, a review they no longer needed, a promotion.",
      "- What changed in how you work because of it.",
    ],
  ),
  behavioral(
    "one-piece-of-advice-for-your-team",
    "One Piece of Advice for Your Team",
    "A specific process or technical improvement, its impact, and how you would measure it.",
    [
      "If you could give your current team one piece of advice, what would it be?",
      "",
      "Pick one specific process or technical change. Explain the problem it addresses, the impact you expect, how you would measure it, and why it has not happened yet.",
    ],
    [
      "One concrete change beats a theme: a review practice, a testing gap, an on-call fix, a service to retire.",
      "Saying why it has not happened yet shows you understand the organisation, not only the engineering.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The problem, with an example of the cost it causes today.",
      "- The change, scoped small enough to start next week.",
      "- The metric that would show it working.",
      "- The obstacle — time, ownership, incentives — and what you have already tried.",
    ],
  ),
  behavioral(
    "why-leaving-and-why-snowflake",
    "Why Are You Leaving, and Why Snowflake?",
    "Growth you want next, tied to something concrete about the work here.",
    [
      "Why are you leaving your current role, and why Snowflake?",
      "",
      "Explain what you want next in a way that is about growth rather than escape, and connect it to something specific about this company's technology or problems.",
    ],
    [
      "Say what you have finished learning where you are and what you want to learn next; never criticise the current employer.",
      "The Snowflake half should name a real technical problem — separating storage and compute, multi-cluster warehouses, query execution at scale — not the brand.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- A positive account of the current role and what you got from it.",
      "- The growth you want: a kind of system, a scale, a depth of ownership.",
      "- Why this company is the place for that, grounded in its architecture or its products rather than its reputation.",
      "- A question of your own that shows you have read about the team's work.",
    ],
  ),
  behavioral(
    "how-do-you-use-ai-tools",
    "How Do You Use AI Tools?",
    "Named tools, the tasks you use them for, a rough share of your coding, and how you verify the output.",
    [
      "How do you use AI tools in your work, and what share of your coding involves them?",
      "",
      "This comes up with recruiters, hiring managers and in automated screens. Name the tools, the tasks you hand them and the ones you do not, give a rough percentage, and explain how you check what they produce.",
    ],
    [
      "Specifics beat enthusiasm: which tool, for which tasks — scaffolding, tests, refactors, unfamiliar APIs — and where you stop trusting it.",
      "Verification is the part that distinguishes engineers: tests you write yourself, reading the diff, running it before you believe it.",
    ],
    [
      "## What a strong answer contains",
      "",
      "- The tools you use and a realistic share of your coding they touch.",
      "- Tasks where they help most and tasks you keep manual, with a reason for each.",
      "- How you verify output: your own tests, reviewing generated code line by line, checking exception boundaries and edge cases.",
      "- One example where the tool was wrong and how you caught it.",
    ],
  ),
];
