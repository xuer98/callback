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
  /** Present when the problem is runnable in the in-browser editor. */
  judge?: Judge;
}

/** One sample case; values must be JSON-serializable and have a unique correct answer. */
export interface JudgeTest {
  name?: string;
  /** Arguments passed to the entry function, in order. */
  input: unknown[];
  expected: unknown;
}

export interface Judge {
  /** JavaScript shown in the editor on first load. */
  starterCode: string;
  /**
   * Name of the function the runner calls with each test's input.
   * Either defined directly by the user's code, or by `driverCode`.
   */
  entry: string;
  /**
   * Optional harness appended after the user's code — used for class-based
   * problems where the entry function drives a sequence of operations.
   */
  driverCode?: string;
  tests: JudgeTest[];
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
