export type Category =
  | "algorithms"
  | "system-design"
  | "behavioral"
  | "frontend"
  | "sql";

export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  slug: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  /** Slugs of companies known to ask this (or a close variant). */
  companies: string[];
  /** One-line teaser shown on list cards. */
  summary: string;
  /** Full prompt shown on the problem page; paragraphs separated by blank lines. */
  prompt: string;
  hints: string[];
}

export interface Company {
  slug: string;
  name: string;
  blurb: string;
  /** Typical interview loop, in order. */
  process: string[];
}

export interface Track {
  slug: string;
  name: string;
  description: string;
  /** Ordered problem slugs. */
  problemSlugs: string[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  algorithms: "Algorithms & Data Structures",
  "system-design": "System Design",
  behavioral: "Behavioral",
  frontend: "Frontend",
  sql: "SQL & Data",
};
