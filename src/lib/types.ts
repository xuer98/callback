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
  /**
   * One-line teaser shown on list cards. Inline markup only — `code`, **bold**,
   * *italics*, ~~strikethrough~~ — since the card is itself a link and truncates
   * to a single line. See src/components/markdown.tsx.
   */
  summary: string;
  /**
   * Full prompt shown on the problem page, as markdown: paragraphs, "#"-"######"
   * headings, "-"/"1." lists (nestable), ``` fenced code, > quotes, --- rules,
   * GFM tables, and the inline marks above plus [links](url) and ![images](url).
   */
  prompt: string;
  /** One markdown block each; same syntax as `prompt`. */
  hints: string[];
  /**
   * Reference approach shown behind the Solution tab (or a collapsed section
   * on document pages); same markdown as `prompt`. Absent = no solution yet.
   */
  solution?: string;
  /**
   * Grading rubric for the AI design review (markdown criteria list). Read
   * server-side by the grade route only — never rendered in the UI. Absent =
   * the generic system-design rubric applies.
   */
  rubric?: string;
  /** Present when the problem is runnable in the in-browser editor. */
  judge?: Judge;
  /** Present when the problem is built in the UI workspace (live preview). */
  ui?: UiWorkspace;
}

/** One starter file in a UI (frontend) workspace. */
export interface UiFile {
  /** Shown on the editor tab and used as the module id, e.g. "App.jsx". */
  name: string;
  contents: string;
}

/**
 * A frontend question solved by building an actual interface: the editor
 * shows one tab per file and renders the result live in a sandboxed iframe.
 * "react" mounts the default export of the entry component; "vanilla" mounts
 * index.html and runs each script file.
 */
export interface UiWorkspace {
  framework: "react" | "vanilla";
  files: UiFile[];
}

export type UiFileKind = "script" | "css" | "html";

/** What a UI file holds, by extension — drives editing and preview alike. */
export function uiFileKind(name: string): UiFileKind {
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".html")) return "html";
  return "script";
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

/**
 * How recently a company was asking a question, from the upstream snapshot.
 * "all" is the union across every window, with its own frequency score.
 */
export const TIMEFRAMES = [
  "thirty-days",
  "three-months",
  "six-months",
  "more-than-six-months",
  "all",
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "thirty-days": "Last 30 days",
  "three-months": "Last 3 months",
  "six-months": "Last 6 months",
  "more-than-six-months": "Over 6 months ago",
  all: "All time",
};

/** A LeetCode question a company is known to ask. */
export interface CompanyQuestion {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  /** Relative how-often score within a company and timeframe, 0-100. */
  frequency: number;
  /** Set when the rows are not filtered to a single company. */
  companyCount?: number;
}

export function leetcodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
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
