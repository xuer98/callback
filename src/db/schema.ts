import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { CATEGORIES, DIFFICULTIES, type Judge } from "../lib/types";

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
