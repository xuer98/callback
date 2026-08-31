import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  CATEGORIES,
  DIFFICULTIES,
  TIMEFRAMES,
  type Judge,
  type UiWorkspace,
} from "../lib/types";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const categoryEnum = pgEnum("category", CATEGORIES);
export const difficultyEnum = pgEnum("difficulty", DIFFICULTIES);

export const problems = pgTable("problems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: categoryEnum("category").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  summary: text("summary").notNull(),
  prompt: text("prompt").notNull(),
  hints: jsonb("hints").$type<string[]>().notNull(),
  solution: text("solution"),
  /** Grading rubric for AI design review (markdown). Never shown in the UI. */
  rubric: text("rubric"),
  judge: jsonb("judge").$type<Judge>(),
  ui: jsonb("ui").$type<UiWorkspace>(),
  /**
   * Stamped by every admin-console save. A non-null value means the console
   * owns this row: db:seed skips its fields and company links until the
   * admin releases it back to the repo (which clears the stamp).
   */
  editedAt: timestamp("edited_at"),
});

export const companies = pgTable("companies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull(),
  process: jsonb("process").$type<string[]>().notNull(),
});

export const problemCompanies = pgTable(
  "problem_companies",
  {
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.problemId, table.companyId] })],
);

export const tracks = pgTable("tracks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const trackProblems = pgTable(
  "track_problems",
  {
    trackId: integer("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => [primaryKey({ columns: [table.trackId, table.problemId] })],
);

export const progressStatusEnum = pgEnum("progress_status", [
  "attempted",
  "solved",
]);

export const problemProgress = pgTable(
  "problem_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    status: progressStatusEnum("status").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.problemId] })],
);

// Account-backed copies of what the workspace also keeps in localStorage:
// saved code per problem/language, and the whiteboard scene per problem.
// The client reconciles the two on load (newest wins). Language is text,
// not an enum, so adding a language never needs a migration — the server
// action validates against LANGUAGES instead.
export const solutions = pgTable(
  "solutions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    code: text("code").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.problemId, table.language] }),
  ],
);

export const boards = pgTable(
  "boards",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    /** Excalidraw scene: { elements, appState, files }. */
    scene: jsonb("scene").$type<unknown>().notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.problemId] })],
);

// One AI-graded system-design submission: the candidate's write-up at submit
// time and the streamed review that came back. The diagram itself is not
// stored — the latest scene already lives in `boards`, and the PNG sent for
// grading is transient. Token counts are kept for cost observability.
export const designSubmissions = pgTable(
  "design_submissions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    writeup: text("writeup").notNull(),
    feedback: text("feedback").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("design_submissions_user_problem_idx").on(
      table.userId,
      table.problemId,
      table.createdAt,
    ),
  ],
);

// One graded attempt at a judged problem: the code exactly as submitted,
// the language it ran in, and the verdict. Run stays ephemeral; Submit
// archives. Language and status are text, not enums, for the same
// no-migration reason as `solutions` — the server action validates.
export const algoSubmissions = pgTable(
  "algo_submissions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    code: text("code").notNull(),
    /** "pass" | "fail" | "error" | "timeout" */
    status: text("status").notNull(),
    passed: integer("passed").notNull(),
    total: integer("total").notNull(),
    /** Summed per-case runtime, ms; null when nothing ran (error/timeout). */
    runtimeMs: integer("runtime_ms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("algo_submissions_user_problem_idx").on(
      table.userId,
      table.problemId,
      table.createdAt,
    ),
  ],
);

// LeetCode questions companies are known to ask, imported from the
// liquidslr/leetcode-company-wise-problems snapshot. These are listings, not
// prompts: title, difficulty, topics, and a link out. Callback's own authored
// problems live in `problems` above and are unrelated to these rows.
export const questionTimeframeEnum = pgEnum("question_timeframe", TIMEFRAMES);

export const leetcodeQuestions = pgTable("leetcode_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** LeetCode's own slug, e.g. "two-sum" — the URL is derived from it. */
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  topics: jsonb("topics").$type<string[]>().notNull(),
});

export const companyQuestions = pgTable(
  "company_questions",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => leetcodeQuestions.id, { onDelete: "cascade" }),
    timeframe: questionTimeframeEnum("timeframe").notNull(),
    /** Relative how-often score within this company and timeframe, 0-100. */
    frequency: real("frequency").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.companyId, table.questionId, table.timeframe],
    }),
    index("company_questions_timeframe_idx").on(
      table.timeframe,
      table.frequency,
    ),
  ],
);

export const problemsRelations = relations(problems, ({ many }) => ({
  problemCompanies: many(problemCompanies),
  trackProblems: many(trackProblems),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  problemCompanies: many(problemCompanies),
}));

export const problemCompaniesRelations = relations(
  problemCompanies,
  ({ one }) => ({
    problem: one(problems, {
      fields: [problemCompanies.problemId],
      references: [problems.id],
    }),
    company: one(companies, {
      fields: [problemCompanies.companyId],
      references: [companies.id],
    }),
  }),
);

export const tracksRelations = relations(tracks, ({ many }) => ({
  trackProblems: many(trackProblems),
}));

export const trackProblemsRelations = relations(trackProblems, ({ one }) => ({
  track: one(tracks, {
    fields: [trackProblems.trackId],
    references: [tracks.id],
  }),
  problem: one(problems, {
    fields: [trackProblems.problemId],
    references: [problems.id],
  }),
}));
