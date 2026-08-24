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
  judge: jsonb("judge").$type<Judge>(),
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
