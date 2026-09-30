import type { Problem } from "./types";

// Airbnb bank, part H: more problems split out of multi-part prompts — boxed
// sentences with mixed widths (from boxed-sentence) and the poker-hand
// classifier (from shuffle-deal-cards). Judged in JavaScript and TypeScript;
// the typed judges live in seed-typescript-splits-b.ts.

export const airbnbProblemsH: Problem[] = [
  {
    slug: "boxed-sentences-mixed-widths",
    title: "Boxed Sentences, Mixed Widths",
    category: "algorithms",
    difficulty: "easy",
    companies: ["airbnb"],
    summary:
      "Each sentence wraps at its own width; one box pads every line to the widest.",
    prompt: `Print several sentences in **one** ASCII box, each wrapped at its **own** width: \`renderMultiBox(blocks)\`, where \`blocks\` is \`[{ text, width }, ...]\`.

\`\`\`
renderMultiBox([{ text: "one two three four", width: 8 }, { text: "a much longer sentence here", width: 16 }])
+------------------+
| one two          |
| three            |
| four             |
| ---------------- |
| a much longer    |
| sentence here    |
+------------------+
\`\`\`

## Rules

- Wrap each block greedily at its own width: keep appending words while the line stays within the width, and **never split a word** — a word longer than the width gets a line of its own.
- **A line must never start with punctuation** (\`. , ; : ! ?\`): a punctuation "word" joins the current line even if that overflows the width.
- The box is as wide as the largest \`width\`: borders are \`+---+\` (that width + 2 dashes), and every body line is \`| … |\`, padded to that width.
- Consecutive blocks are separated by a \`| ---- |\` line whose dashes fill the inner width.
- Return the picture as lines joined by \`"\\n"\`.`,
    hints: [
      "Wrap each block with one greedy loop: start a new line only when `line.length + 1 + word.length` would exceed that block's width and the word doesn't start with punctuation.",
      "Compute the inner width once — the largest `width` — then pad every line to it, and emit a dashed separator before every block except the first.",
    ],
    solution: `## Approach

Wrap each block on its own with the greedy rule: append a word while the line fits that block's width, never split a word, and let a punctuation word overflow rather than start a line. Then draw once: the inner width is the largest \`width\`, every line is \`padEnd\`ed to it inside \`| … |\`, a dashed line separates consecutive blocks, and two \`+---+\` rules close the box.

## Complexity

O(total characters) to wrap and draw.

## Worth saying out loud

- Keep wrapping and drawing separate: \`wrapWords(text, width)\` is the same function as in [Boxed Sentence](/problems/boxed-sentence), and the box needs only the lines and one inner width.
- The box follows the declared widths, not the longest line — so a short sentence with a wide width still sets the box.
- A word longer than its width, or a trailing punctuation mark, can push a line past the border; ask whether to widen the box or hard-break the word.`,
    judge: {
      solutionCode: `// Several sentences, each wrapped at its OWN width, inside one aligned box.
const LEADING_PUNCT = /^[.,;:!?]/;

// Greedy: append words while they fit; never split a word; a line never starts with punctuation.
function wrapWords(sentence, width) {
  const lines = [];
  let line = '';
  for (const word of sentence.split(/\\s+/).filter(Boolean)) {
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width || LEADING_PUNCT.test(word)) line += \` \${word}\`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function renderMultiBox(blocks /* [{ text, width }] */) {
  const inner = Math.max(...blocks.map((b) => b.width));
  const rule = \`+\${'-'.repeat(inner + 2)}+\`;
  const out = [rule];
  blocks.forEach((b, i) => {
    if (i > 0) out.push(\`| \${'-'.repeat(inner)} |\`);              // separator between sentences
    wrapWords(b.text, b.width).forEach((l) => out.push(\`| \${l.padEnd(inner)} |\`));
  });
  out.push(rule);
  return out.join('\\n');
}
`,
      starterCode: `/** Greedy word wrap: never split a word; a line never starts with punctuation. */
function wrapWords(sentence, width) {
  // Your code here
  return [sentence];
}

/** Several sentences, each wrapped at its own width, in one aligned box. blocks: [{ text, width }] */
function renderMultiBox(blocks) {
  return "";
}
`,
      entry: "renderMultiBox",
      tests: [
        {
          name: "Two widths in one box",
          input: [[{ text: "one two three four", width: 8 }, { text: "a much longer sentence here", width: 16 }]],
          expected:
            "+------------------+\n| one two          |\n| three            |\n| four             |\n| ---------------- |\n| a much longer    |\n| sentence here    |\n+------------------+",
        },
        {
          name: "Three widths in one box",
          input: [
            [
              { text: "check in after three", width: 15 },
              { text: "no parties or smoking", width: 16 },
              { text: "quiet hours from ten to eight", width: 32 },
            ],
          ],
          expected:
            "+----------------------------------+\n| check in after                   |\n| three                            |\n| -------------------------------- |\n| no parties or                    |\n| smoking                          |\n| -------------------------------- |\n| quiet hours from ten to eight    |\n+----------------------------------+",
        },
        {
          name: "One block is a plain box",
          input: [[{ text: "one two three four", width: 8 }]],
          expected: "+----------+\n| one two  |\n| three    |\n| four     |\n+----------+",
        },
        {
          name: "The widest block can come first",
          input: [[{ text: "a much longer sentence here", width: 16 }, { text: "one two", width: 4 }]],
          expected:
            "+------------------+\n| a much longer    |\n| sentence here    |\n| ---------------- |\n| one              |\n| two              |\n+------------------+",
        },
        {
          name: "Punctuation joins the line even past its block's width",
          input: [[{ text: "wait , what", width: 4 }, { text: "fine", width: 8 }]],
          expected: "+----------+\n| wait ,   |\n| what     |\n| -------- |\n| fine     |\n+----------+",
        },
      ],
    },
  },
  {
    slug: "poker-hand-category",
    title: "Classify a Poker Hand",
    category: "algorithms",
    difficulty: "easy",
    companies: ["airbnb"],
    summary:
      "A rank histogram and two booleans name every category — the ace is the only edge case.",
    prompt: `Classify a five-card poker hand. Each card is a string: the rank (\`A\`, \`2\`–\`10\`, \`J\`, \`Q\`, \`K\`) followed by the suit (\`S\`, \`H\`, \`D\`, \`C\`). Return the best category that applies:

| Category | Meaning |
|---|---|
| \`Straight flush\` | a straight, all one suit |
| \`Four of a kind\` | four cards of one rank |
| \`Full house\` | three of one rank and two of another |
| \`Flush\` | all one suit |
| \`Straight\` | five consecutive ranks |
| \`Three of a kind\` | three cards of one rank |
| \`Two pair\` | two pairs |
| \`One pair\` | two cards of one rank |
| \`High card\` | none of the above |

An ace plays high or low in a straight — \`10 J Q K A\` and \`A 2 3 4 5\` both count — but a straight never wraps around: \`Q K A 2 3\` is not one. The five cards are distinct.

\`\`\`
handCategory(["10H", "JH", "QH", "KH", "AH"])  ->  "Straight flush"
handCategory(["2C", "2D", "9H", "9S", "KC"])   ->  "Two pair"
\`\`\``,
    hints: [
      "Parse the rank as everything but the last character — `10H` is the one three-character card — and map A, J, Q, K to 1, 11, 12, 13.",
      "Count each rank and sort the counts descending: [4, 1] is four of a kind, [3, 2] a full house, [3, 1, 1] three of a kind, [2, 2, 1] two pair, [2, 1, 1, 1] one pair.",
      "A flush is one distinct suit; a straight is five distinct values spanning exactly 4, plus the ace-high case A 10 J Q K. Check the categories best first and return the first that applies.",
    ],
    solution: `## Approach

Two booleans and a histogram. Parse each card into a rank value (ace = 1) and a suit. \`flush\` is "one distinct suit"; \`straight\` is "five distinct values spanning exactly 4", plus the ace-high case \`A 10 J Q K\`. Count each rank and sort the counts descending — the count pattern names every other category: \`[4, 1]\`, \`[3, 2]\`, \`[3, 1, 1]\`, \`[2, 2, 1]\`, \`[2, 1, 1, 1]\`. Then check the categories from best to worst and return the first that applies, so a straight flush is never reported as a flush.

## Complexity

O(1) for five cards — O(n log n) for an n-card hand.

## Worth saying out loud

- The ace is the edge case: low in \`A 2 3 4 5\`, high in \`10 J Q K A\`, never both at once — \`Q K A 2 3\` is not a straight.
- Comparing two hands extends this: compare categories first, then break ties on the ranks ordered by group size, then by rank — a pair of kings with an ace beats a pair of kings with a queen.
- The dealing side of a card game lives in [Shuffle and Deal Five Cards](/problems/shuffle-deal-cards); this is the scoring side.`,
    judge: {
      solutionCode: `// Classify a five-card hand: a rank histogram plus "flush" and "straight".
const FACE_VALUES = { A: 1, J: 11, Q: 12, K: 13 };

function handCategory(hand) {
  const values = hand
    .map((card) => {
      const rank = card.slice(0, -1);            // "10H" is the one three-character card
      return FACE_VALUES[rank] ?? Number(rank);
    })
    .sort((a, b) => a - b);
  const suits = new Set(hand.map((card) => card.slice(-1)));
  const byRank = new Map();
  for (const v of values) byRank.set(v, (byRank.get(v) ?? 0) + 1);
  const counts = [...byRank.values()].sort((a, b) => b - a);

  const flush = suits.size === 1;
  const straight =
    counts.length === 5 && (values[4] - values[0] === 4 || values.join() === "1,10,11,12,13"); // ace high

  if (straight && flush) return "Straight flush";
  if (counts[0] === 4) return "Four of a kind";
  if (counts[0] === 3 && counts[1] === 2) return "Full house";
  if (flush) return "Flush";
  if (straight) return "Straight";
  if (counts[0] === 3) return "Three of a kind";
  if (counts[0] === 2 && counts[1] === 2) return "Two pair";
  if (counts[0] === 2) return "One pair";
  return "High card";
}
`,
      starterCode: `/**
 * @param {string[]} hand five distinct cards like "10H", "AS", "QD"
 * @returns {string} the best category, e.g. "Full house"
 */
function handCategory(hand) {
  // Your code here
  return "High card";
}
`,
      entry: "handCategory",
      tests: [
        { name: "A royal flush is a straight flush", input: [["10H", "JH", "QH", "KH", "AH"]], expected: "Straight flush" },
        { name: "Ace-low straight flush", input: [["AS", "2S", "3S", "4S", "5S"]], expected: "Straight flush" },
        { name: "Four of a kind", input: [["9C", "9D", "9H", "9S", "2D"]], expected: "Four of a kind" },
        { name: "Full house", input: [["3C", "3D", "3S", "KH", "KD"]], expected: "Full house" },
        { name: "Flush", input: [["2H", "7H", "9H", "JH", "KH"]], expected: "Flush" },
        { name: "Straight in order", input: [["5C", "6D", "7H", "8S", "9C"]], expected: "Straight" },
        { name: "Straight out of order", input: [["9C", "5D", "8H", "6S", "7C"]], expected: "Straight" },
        { name: "Ace-low straight", input: [["AD", "2C", "3H", "4S", "5D"]], expected: "Straight" },
        { name: "Ace-high straight", input: [["10D", "JC", "QH", "KS", "AD"]], expected: "Straight" },
        { name: "No wrap-around straight", input: [["QD", "KC", "AH", "2S", "3D"]], expected: "High card" },
        { name: "Three of a kind", input: [["7C", "7D", "7H", "2S", "KD"]], expected: "Three of a kind" },
        { name: "Two pair", input: [["2C", "2D", "9H", "9S", "KC"]], expected: "Two pair" },
        { name: "One pair", input: [["JC", "JD", "3H", "5S", "9C"]], expected: "One pair" },
        { name: "High card", input: [["2C", "5D", "9H", "JS", "KC"]], expected: "High card" },
        { name: "Tens parse as one rank", input: [["10C", "10D", "10H", "4S", "4C"]], expected: "Full house" },
      ],
    },
  },
];
