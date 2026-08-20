export const CATEGORIES = [
  "algorithms",
  "system-design",
  "behavioral",
  "frontend",
  "sql",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Problem {
  slug: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  /** Slugs of companies known to ask this (or a close variant). */
  companies: string[];
  /** One-line teaser shown on list cards. */
  summary: string;
  /**
   * Full prompt shown on the problem page. Light markdown: blank-line-separated
   * paragraphs, ``` fenced blocks, "## "/"### " headings, "- " bullets, and
   * `inline code`.
   */
  prompt: string;
  hints: string[];
  /** Present when the problem is runnable in the in-browser editor. */
  judge?: Judge;
}

export const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "go",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  go: "Go",
};

/**
 * Languages with no in-browser runtime: they only run through the Judge0
 * server sandbox, so the workspace warns when it isn't configured.
 */
export const SERVER_ONLY_LANGUAGES = ["java", "cpp", "go"] as const;

export function isServerOnly(language: Language): boolean {
  return (SERVER_ONLY_LANGUAGES as readonly Language[]).includes(language);
}

/** Per-language solution scaffolding and harness glue. */
export interface JudgeLanguage {
  /** Code shown in the editor on first load. */
  starterCode: string;
  /** Name of the function the runner calls with each test's input. */
  entry: string;
  /** Optional harness appended after the user's code. */
  driverCode?: string;
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
  /**
   * Per-language starter/entry/driver. JavaScript lives in the fields above
   * (it predates multi-language support); every other language lands here.
   * Tests are shared across all languages.
   */
  python?: JudgeLanguage;
  typescript?: JudgeLanguage;
  java?: JudgeLanguage;
  cpp?: JudgeLanguage;
  go?: JudgeLanguage;
  tests: JudgeTest[];
}

/** The per-language scaffolding for `language`, or undefined if unsupported. */
export function judgeFor(
  judge: Judge,
  language: Language,
): JudgeLanguage | undefined {
  if (language === "javascript") {
    return {
      starterCode: judge.starterCode,
      entry: judge.entry,
      driverCode: judge.driverCode,
    };
  }
  return judge[language];
}

/** Languages this problem can actually be solved in, in display order. */
export function languagesFor(judge: Judge): Language[] {
  return LANGUAGES.filter((l) => judgeFor(judge, l) !== undefined);
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
