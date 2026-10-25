import { curatedNeighbours } from "./similar-curated";
import type { Category, Difficulty, ProblemFormat, Track } from "./types";

// "Similar problems" for a problem page: the problems in the same category
// that look most like it, scored from what the rows already carry rather
// than curated by hand. Each problem becomes one bag of terms: its topic
// tags and the words of its slug, title, summary and prompt. Terms are
// IDF-weighted within the category, so a rare topic ("Eulerian Circuit") or
// a rare word ("itinerary") counts for much more than "Sorting" or "react",
// and a term in more than half the rows counts for nothing. Two problems' cosine
// similarity is the score; sharing a track, a format or a difficulty nudges
// the order. The parts of one question ("Base I/II/III") share most of a
// slug and title, so they land first, then the problems built on the same
// technique. Companies are left out: a tag shared by 150 problems says
// nothing about which two are alike. Where words fail, mostly the
// system-design prompts, similar-curated.ts names the neighbours by hand
// and they go first.

/** What the scorer reads: the list row plus how the problem is worked on. */
export interface SimilarityRow {
  slug: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  summary: string;
  /** The full prompt; its words count for less than the summary's. */
  prompt: string;
  topics: string[];
  format: ProblemFormat;
}

export const SIMILAR_LIMIT = 6;

/** Below this the overlap is a coincidence of ordinary words; show nothing. */
const MIN_SIMILARITY = 0.05;

/** A curated list is only topped up with a computed match this clear. */
const CURATED_FILL = 0.1;

/**
 * In a category this small every problem is a neighbour of every other
 * (the behavioral prompts, the SQL questions), so the threshold is waived.
 */
const SMALL_CATEGORY = 12;

// How much each kind of term weighs against a word of the summary. Topics
// are curated and name the technique, so one counts double; a word of the
// title or slug names the problem, so it counts more than one of the blurb.
const TOPIC_WEIGHT = 2;
const TITLE_WEIGHT = 1.5;
const PROMPT_WEIGHT = 0.5;

const SAME_TRACK = 0.05;
const SAME_FORMAT = 0.05;
const SAME_DIFFICULTY = 0.01;

// Words that say nothing about what a problem is about: English function
// words plus the verbs every prompt in a category opens with.
const STOPWORDS = new Set(
  (
    "a an the and or of to in on for with from by at as is are be was were " +
    "it its this that these those your you we they them their there here " +
    "then than so if not no but into out up down over under per via only " +
    "one two three all any each every both same other another more most " +
    "when where which who whom what how why while without within between " +
    "can could should would will may might must do does did done " +
    "has have had get got given use used using make made build implement " +
    "design write return returns returning find count number numbers " +
    "list lists array arrays string strings value values input output " +
    "problem problems question questions know explain explained classic " +
    "part base i ii iii iv"
  ).split(" "),
);

/** Plurals and simple verb forms fold onto one stem: intervals, sorted, merging. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed") && !word.endsWith("eed"))
    return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss"))
    return word.slice(0, -1);
  return word;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word))
    .map(stem);
}

/** Each term with its weight before IDF; keys are prefixed so kinds never collide. */
function terms(row: SimilarityRow): Map<string, number> {
  const out = new Map<string, number>();
  for (const word of words(row.prompt)) out.set(`w:${word}`, PROMPT_WEIGHT);
  for (const word of words(row.summary)) out.set(`w:${word}`, 1);
  for (const word of words(`${row.slug.replace(/-/g, " ")} ${row.title}`)) {
    out.set(`w:${word}`, TITLE_WEIGHT);
  }
  for (const topic of row.topics) out.set(`t:${topic}`, TOPIC_WEIGHT);
  return out;
}

type Vector = Map<string, number>;

/** IDF-weighted, unit-length term vectors, so a dot product is a cosine. */
function vectors(rows: readonly SimilarityRow[]): Vector[] {
  const bags = rows.map(terms);
  const df = new Map<string, number>();
  for (const bag of bags) {
    for (const term of bag.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const n = rows.length;
  return bags.map((bag) => {
    const vector: Vector = new Map();
    let norm = 0;
    for (const [term, base] of bag) {
      const idf = Math.log(n / (2 * (df.get(term) ?? n)));
      if (idf <= 0) continue;
      const weight = base * idf;
      vector.set(term, weight);
      norm += weight * weight;
    }
    if (norm > 0) {
      const scale = 1 / Math.sqrt(norm);
      for (const [term, weight] of vector) vector.set(term, weight * scale);
    }
    return vector;
  });
}

function dot(a: Vector, b: Vector): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [term, weight] of small) sum += weight * (large.get(term) ?? 0);
  return sum;
}

export interface SimilarityMatch {
  row: SimilarityRow;
  /** The cosine similarity alone, 0–1. */
  similarity: number;
  /** The similarity plus the ordering nudges. */
  score: number;
}

/**
 * Every other problem in `slug`'s category, best first, with its scores.
 * Empty when the problem is unknown.
 */
export function rankSimilar(
  slug: string,
  all: readonly SimilarityRow[],
  tracks: readonly Track[],
): SimilarityMatch[] {
  const self = all.find((row) => row.slug === slug);
  if (!self) return [];
  const rows = all.filter((row) => row.category === self.category);
  const at = rows.indexOf(self);
  const space = vectors(rows);

  const trackMates = new Set(
    tracks
      .filter((track) => track.problemSlugs.includes(slug))
      .flatMap((track) => track.problemSlugs),
  );

  const matches = rows.flatMap((row, i) => {
    if (i === at) return [];
    const similarity = dot(space[at], space[i]);
    const score =
      similarity +
      (trackMates.has(row.slug) ? SAME_TRACK : 0) +
      (row.format === self.format ? SAME_FORMAT : 0) +
      (row.difficulty === self.difficulty ? SAME_DIFFICULTY : 0);
    return [{ row, similarity, score }];
  });
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * The problems most like `slug`, best first, from the same category: the
 * curated neighbours, then the computed ones. Empty when the problem is
 * unknown or nothing in its category resembles it.
 */
export function similarProblems(
  slug: string,
  all: readonly SimilarityRow[],
  tracks: readonly Track[],
  limit = SIMILAR_LIMIT,
): SimilarityRow[] {
  const self = all.find((row) => row.slug === slug);
  if (!self) return [];
  const curated = curatedNeighbours(slug).flatMap((other) => {
    const row = all.find((r) => r.slug === other);
    return row && row.category === self.category ? [row] : [];
  });
  const taken = new Set(curated.map((row) => row.slug));

  const ranked = rankSimilar(slug, all, tracks);
  const small = ranked.length < SMALL_CATEGORY;
  const bar = curated.length > 0 ? CURATED_FILL : MIN_SIMILARITY;
  const computed = ranked
    .filter(
      (match) =>
        !taken.has(match.row.slug) && (small || match.similarity >= bar),
    )
    .map((match) => match.row);
  return [...curated, ...computed].slice(0, limit);
}
