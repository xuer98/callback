import type { Guide } from "./types";

// Interview guides: how one company's loop runs and what it asks, with the
// problems here that drill each part. The body is the same markdown the
// problem pages render. Sources are the pages the process and question data
// came from; the prose itself is ours.

export const guides: Guide[] = [
  {
    slug: "snowflake-software-engineer",
    title: "Snowflake Software Engineer",
    company: "snowflake",
    summary:
      "How Snowflake's SWE loop runs in 2026, the four coding families that cover half the questions, the follow-up trio every problem escalates into, the two designs to prepare, and a three-week plan.",
    sources: [
      {
        label: "PracHub — Snowflake Software Engineer Interview Guide 2026",
        url: "https://prachub.com/interview-guide/snowflake-software-engineer-interview-guide",
      },
      {
        label: "1Point3Acres — Snowflake Interview Trend Analysis (2026 Q2)",
        url: "https://www.1point3acres.com/interview/guides/interview-trend-snowflake-2026q2",
      },
    ],
    body: `Based on the hiring process Snowflake publishes and forty-odd interview reports from January to May 2026. Last checked October 2026.

## The loop

Snowflake describes four stages, and the 2026 reports fill in what each one holds.

| Stage | Length | What happens |
| --- | --- | --- |
| Recruiter screen | 30 min | Background, role fit, logistics. Interns and some new grads get an online assessment instead, and the intern one has been two hard dynamic-programming problems. |
| Technical screens | 2 × 60 min | Almost always two coding rounds, back to back or split across two days. |
| Panel | 3–5 × 60 min | Typically two more coding rounds, one system design and one behavioral. Some levels add a 30-minute tech talk on a project of yours. |
| Decision | — | Reference and pre-employment checks follow the panel. |

Expect two to four weeks end to end, with variation by team. One coding interview is in person. Snowflake's AI policy from January 2026 allows AI while you prepare but not during assessments, take-homes or coding interviews, so practise with no assistant open.

## What gets asked

Coding carries the loop. Across a hundred tagged questions and the 2026 reports, roughly two thirds to seven in ten are coding, about a fifth are system design, and the rest split between fundamentals and behavioral. Difficulty sits upper-middle: two in three questions are medium, almost a third are hard, and easy ones are rare. The base problems are mostly known, so the pass decision comes down to the follow-ups and whether your tests were complete.

## The coding rounds

Four families cover close to half of the coding questions reported. Start here.

| Family | What it looks like | Drill it here |
| --- | --- | --- |
| Course schedule and topological sort | Prerequisite graphs with cycle detection, batched execution, completion times, retries. | [Course Completion Time I](/problems/course-batches-time), [Course Completion Time II](/problems/course-any-prerequisite-time), [Course Schedule With Retries](/problems/course-schedule-with-retries), [Prerequisite Route to a Target Course](/problems/prerequisite-route) |
| Tree deletion and height | Delete nodes, lift their children, report the new height; then the fewest deletions that bring the height under a limit. | [Tree Height After Deletions I](/problems/height-after-deleting-nodes), [Tree Height After Deletions II](/problems/fewest-deletions-for-height), [Subtree Pruning II](/problems/subtree-pruning-depth-limit) |
| Grid multi-source BFS | People and cakes, desks and bathrooms, walls and gates: the nearest distance from many sources at once. | [People and Cakes I](/problems/closest-person-cake-distance), [People and Cakes II](/problems/assign-people-to-cakes), [Nearest Bathroom for Every Desk](/problems/nearest-bathroom-distances), [Shortest Path Around Obstacles](/problems/shortest-path-with-obstacles) |
| Transactional key-value store | get, put and delete with begin, commit and rollback; then concurrency; then constant-time operations. | [Nested-Transaction KV Store](/problems/transactional-kv-store), [Key-Value Store With Prefix Scan](/problems/kv-store-with-prefix-scan) |

The rest of the recurring set:

- Classics the panel draws from: [In-Memory File System](/problems/in-memory-file-system), meeting rooms with a min-heap ([Minimum Bus Fleet](/problems/minimum-bus-fleet)), interval scheduling for profit or credits ([Most Credits With at Most K Classes](/problems/max-credits-with-k-classes)), and the boundary of a binary tree.
- Counting over time: [Count Events in a Time Range](/problems/count-events-in-range), [Recent Event Window Queries](/problems/recent-event-window), and a rate limiter that logs the requests it drops under two rules ([Dropped Requests Under Two Rules](/problems/dropped-request-times), [Sliding-Window Rate Limiter](/problems/sliding-window-rate-limiter)).
- New in early 2026: a document store answering boolean predicate queries ([Document Store With Boolean Queries](/problems/document-store-predicates)), the warehouse query type that earns the most ([Pick the Query Type That Maximises Revenue](/problems/max-revenue-query-type)), recipe matching over a stream ([Contiguous Recipe Lookup I](/problems/contiguous-recipes), [Contiguous Recipe Lookup II](/problems/contiguous-recipes-stream)), and counting a cluster's nodes through asynchronous messages ([Count the Nodes of a Tree by Messages](/problems/count-nodes-by-messages)).
- Simulation and parsing: [String-Command Calculator I](/problems/string-command-calculator), [Fewest Coins When Change Is Given](/problems/fewest-coins-with-change), [Valid Tic-Tac-Toe State](/problems/valid-tic-tac-toe-state), [Pre-Order Traversal Skipping Marked Nodes](/problems/preorder-skipping-marked-nodes), [Top K Search Terms, One Vote per User](/problems/top-k-search-terms), [Priority Task Executor](/problems/priority-task-executor).
- Front-end loops get a JavaScript grid instead: [Robot Eats Candies on a Grid](/problems/robot-eats-candies).

Everything tagged Snowflake, including the LeetCode listings, is on the [Snowflake company page](/companies/snowflake).

## The follow-up trio

Interviewers rarely stop at the base problem, and they keep asking until time runs out. Three follow-ups come up so consistently that every problem above deserves a prepared answer to all three.

1. **Streaming input.** The data no longer fits in memory, or arrives one record at a time. Keep a state machine or a sliding window, and say what you can no longer answer exactly.
2. **Multithreading.** Several callers at once. Name the shared state, choose the lock granularity, and be ready to write the acquire and release rather than say "add a mutex". Python's threading module or Java's synchronized blocks are both fine.
3. **Constant extra space.** Two pointers or in-place mutation, with the trade-off against readability and against an input that is read-only.

Coding questions also escalate into design: the key-value store, the predicate store and the cluster counter all end in sharding and replication when time allows. Have one sentence ready on how you would partition each.

## System design

The round leans toward infrastructure problems and wants engineering depth rather than a template. Two designs account for most reports:

- [Design a Distributed Key-Value Store](/problems/design-distributed-kv-store): list the non-functional requirements first, then consistency against availability, large values that live on disk, and lock contention on hot keys.
- [Design a Distributed Job Scheduler](/problems/design-distributed-job-scheduler): cron-style schedules, a pause that lets running jobs finish, resume, and a worker pool that may be unbounded.

Also reported: [Design a Logging Library for Web and Mobile Clients](/problems/design-client-logging-library) with batching and backpressure, [Design an ACL Check Service](/problems/design-acl-check-service), a blob store that deduplicates uploads ([Design a Blob Storage Service](/problems/design-blob-storage)), and [Design a Distributed Metrics System](/problems/design-distributed-metrics-system). Expect to be asked for pseudocode around locks, batch backpressure and replica or shard placement, not only boxes and arrows.

For the depth questions, know the storage vocabulary: [Transaction Isolation Levels](/problems/transaction-isolation-levels), [What Is a Write-Ahead Log?](/problems/write-ahead-log-explained), [What Is MVCC?](/problems/mvcc-explained), [LSM Tree vs B-Tree](/problems/lsm-tree-vs-b-tree), [Snowflake's Three Layers](/problems/snowflake-three-layer-architecture) and [What Is a Micro-Partition?](/problems/micro-partitions-explained).

## Behavioral and the tech talk

The behavioral round sticks to a short list: a conflict, a tight deadline, mentoring someone, the project you are proudest of, and a failure. Prepare one story for each with the decision you made and what you measured afterwards: [Tell Me About a Conflict](/problems/conflict-with-teammate), [Delivering Under a Tight Deadline](/problems/delivering-under-tight-deadline), [Mentoring Someone](/problems/mentoring-someone), [The Project You Are Most Proud Of](/problems/project-you-are-most-proud-of), [Your Hardest Situation at Work](/problems/hardest-situation-at-work). Expect [Why Are You Leaving, and Why Snowflake?](/problems/why-leaving-and-why-snowflake) and, given the AI policy, [How Do You Use AI Tools?](/problems/how-do-you-use-ai-tools).

If a tech talk is scheduled, pick a project you actually owned. Lead with the user problem and the constraints, show the alternative you rejected and why, name a bottleneck or failure you observed and the measurement that changed, and draw one operation end to end plus one failure timeline. If you never collected a metric, say what evidence you had instead of inventing a percentage.

## How to run a round

- Spend the first minute or two restating the problem with a small example, and confirm the input and output shapes. Several lost rounds came down to solving a different question than the interviewer meant.
- Write your own tests before you are asked. Assume no examples will be given: one happy path, one edge case, one large input.
- When a requirement changes, say which invariant it changes and revise your earlier examples before touching the code.
- If the interviewer insists on a particular approach, write theirs first, then discuss alternatives.
- Keep your own timeline. Recruiter communication is uneven in the reports, so follow up yourself, and ask whether a tech talk is required at your level.

## A three-week plan

| Week | Focus | What you should have at the end |
| --- | --- | --- |
| 1 | The four coding families and the transactional store | Each base problem solved from a blank editor, with your own tests. |
| 2 | The follow-up trio and the two designs | A streaming, a threaded and a constant-space variant of every week-one problem; the key-value store and the scheduler designs with lock pseudocode. |
| 3 | Behavioral stories, the tech talk and mocks | Five stories with measurements, a talk you can give in ten minutes, and your week-one weaknesses re-tested. |`,
  },
];
