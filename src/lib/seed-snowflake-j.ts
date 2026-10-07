import type { Problem } from "./types";
import { runOperationsDriver } from "./seed-snowflake-e";

// Snowflake coding bank, part J: two object-design prompts — a JSON parser
// and a document store queried with boolean expressions. Judged in
// JavaScript and Python; the Python judges live in seed-python-snowflake-d.ts.

export const snowflakeProblemsJ: Problem[] = [
  {
    slug: "json-parser",
    title: "JSON Parser",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "Recursive descent with one cursor: a value function that dispatches on the next character, and a parser per kind.",
    prompt: [
      'Parse a JSON document into native values without using the built-in parser: objects, arrays, strings with the standard escapes (`\\"`, `\\\\`, `\\/`, `\\b`, `\\f`, `\\n`, `\\r`, `\\t`, `\\uXXXX`), numbers (negative, fractional, exponent), `true`, `false` and `null`, with whitespace anywhere JSON allows it. Throw on invalid input, including trailing characters.',
      "",
      "```",
      'parseJson(\'{"a": [1, 2.5, -3e2, true, null], "b": {"c": "d\\\\n"}}\')',
      '  ->  { a: [1, 2.5, -300, true, null], b: { c: "d\\n" } }',
      "```",
      "",
      'The grader disables the built-in parser while your function runs, and records `"invalid"` when it throws.',
    ].join("\n"),
    hints: [
      'Keep one index into the text. `value()` skips whitespace, looks at the next character and dispatches: `{` object, `[` array, `"` string, `t`/`f`/`n` literal, otherwise number.',
      "Arrays and objects are loops: read a value (or key, colon, value), then expect a comma to continue or the closing bracket to stop. A trailing comma is an error because a value must follow it.",
      "After the top-level value, skip whitespace and require the end of the text.",
    ],
    solution: [
      "## Approach",
      "",
      "Recursive descent over a shared cursor. `value()` dispatches on the next non-space character to one small parser per kind; arrays and objects call `value()` back for their elements, which is where the recursion lives. Strings are scanned character by character with a small escape table and `\\u` handled by four hex digits; numbers are matched with one regular expression anchored at the cursor and converted. Every parser leaves the cursor just after what it consumed, and the top level insists the cursor reaches the end.",
      "",
      "## Complexity",
      "",
      "O(n) time; O(depth) stack plus the output.",
      "",
      "## Worth saying out loud",
      "",
      "- The error cases are the grading: trailing commas, a missing colon, an unterminated string, trailing characters. Say which ones you handle and test two.",
      "- Surrogate pairs in `\\u` escapes need combining in languages where a lone surrogate is not a character; a streaming parser would need an explicit stack instead of recursion.",
      "- Duplicate keys: JSON leaves it open; last one wins here.",
    ].join("\n"),
    judge: {
      solutionCode: `// Recursive descent over one cursor; each parser leaves the cursor after what it consumed.
function parseJson(text) {
  let i = 0;
  const fail = (what) => {
    throw new SyntaxError(what + " at position " + i);
  };
  const skip = () => {
    while (i < text.length && " \\t\\n\\r".includes(text[i])) i++;
  };
  const literal = (word, result) => {
    if (!text.startsWith(word, i)) fail("bad literal");
    i += word.length;
    return result;
  };
  const number = () => {
    const match = /^-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(text.slice(i));
    if (!match) fail("bad number");
    i += match[0].length;
    return Number(match[0]);
  };
  const escapes = { '"': '"', "\\\\": "\\\\", "/": "/", b: "\\b", f: "\\f", n: "\\n", r: "\\r", t: "\\t" };
  const string = () => {
    i++;                                        // opening quote
    let out = "";
    while (i < text.length) {
      const ch = text[i++];
      if (ch === '"') return out;
      if (ch !== "\\\\") {
        out += ch;
        continue;
      }
      const esc = text[i++];
      if (esc === "u") {
        const hex = text.slice(i, i + 4);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("bad unicode escape");
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else if (esc in escapes) {
        out += escapes[esc];
      } else {
        fail("bad escape");
      }
    }
    fail("unterminated string");
  };
  const array = () => {
    i++;
    const out = [];
    skip();
    if (text[i] === "]") {
      i++;
      return out;
    }
    for (;;) {
      out.push(value());
      skip();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "]") {
        i++;
        return out;
      }
      fail("expected , or ]");
    }
  };
  const object = () => {
    i++;
    const out = {};
    skip();
    if (text[i] === "}") {
      i++;
      return out;
    }
    for (;;) {
      skip();
      if (text[i] !== '"') fail("expected a key");
      const key = string();
      skip();
      if (text[i] !== ":") fail("expected :");
      i++;
      out[key] = value();
      skip();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "}") {
        i++;
        return out;
      }
      fail("expected , or }");
    }
  };
  function value() {
    skip();
    const ch = text[i];
    if (ch === "{") return object();
    if (ch === "[") return array();
    if (ch === '"') return string();
    if (ch === "t") return literal("true", true);
    if (ch === "f") return literal("false", false);
    if (ch === "n") return literal("null", null);
    if (ch === "-" || (ch >= "0" && ch <= "9")) return number();
    return fail("unexpected character");
  }
  const result = value();
  skip();
  if (i !== text.length) fail("trailing characters");
  return result;
}
`,
      starterCode: `/**
 * @param {string} text a JSON document
 * @returns {*} the parsed value; throws on invalid input
 */
function parseJson(text) {
  // Your code here
  return null;
}
`,
      entry: "__judgeJson",
      // The built-in parser is replaced for the duration of the call.
      driverCode: `function __judgeJson(text) {
  const native = JSON.parse;
  JSON.parse = () => {
    throw new Error("JSON.parse is off limits here");
  };
  try {
    return parseJson(text);
  } catch (err) {
    return "invalid";
  } finally {
    JSON.parse = native;
  }
}`,
      tests: [
        {
          name: "Prompt example",
          input: ['{"a": [1, 2.5, -3e2, true, null], "b": {"c": "d\\n"}}'],
          expected: { a: [1, 2.5, -300, true, null], b: { c: "d\n" } },
        },
        { name: "An empty array with spaces", input: ["  [ ]  "], expected: [] },
        { name: "String escapes", input: ['"\\u0041\\"x\\\\y"'], expected: 'A"x\\y' },
        { name: "A bare number", input: ["12"], expected: 12 },
        { name: "A negative fraction", input: ["-0.5"], expected: -0.5 },
        { name: "Nested empties", input: ['{"empty": {}, "list": [[], [[]]]}'], expected: { empty: {}, list: [[], [[]]] } },
        { name: "Whitespace everywhere", input: [' { "a" : [ 1 , 2 ] } '], expected: { a: [1, 2] } },
        { name: "Tabs, quotes and slashes", input: ['["tab\\there", "quote\\"inside", "slash\\/"]'], expected: ["tab\there", 'quote"inside', "slash/"] },
        { name: "A truncated literal is invalid", input: ["tru"], expected: "invalid" },
        { name: "A trailing comma is invalid", input: ["[1,]"], expected: "invalid" },
        { name: "Trailing characters are invalid", input: ['{"a": 1} x'], expected: "invalid" },
        { name: "An unterminated string is invalid", input: ['"abc'], expected: "invalid" },
      ],
    },
  },
  {
    slug: "document-store-predicates",
    title: "Document Store With Boolean Queries",
    category: "algorithms",
    difficulty: "hard",
    companies: ["snowflake"],
    summary: "An inverted index plus a tiny expression parser whose values are sets of document ids.",
    prompt: [
      "Design `DocumentStore`:",
      "",
      "```",
      "insertDoc(id, text)    // text is words separated by whitespace; inserting an id again replaces its document",
      "query(expression)      // the ids of the documents that satisfy the expression, sorted",
      "```",
      "",
      "An expression is built from words, `&&`, `||`, `!` and parentheses, with `!` binding tightest and `&&` tighter than `||`. A document satisfies a word when it contains that word exactly (case-sensitive).",
      "",
      "```",
      'insertDoc("d1", "apple banana") · insertDoc("d2", "banana cherry") · insertDoc("d3", "cherry apple pie")',
      'query("apple && banana")               ->  ["d1"]',
      'query("(apple || banana) && !cherry")  ->  ["d1"]',
      'query("!banana")                       ->  ["d3"]',
      "```",
    ].join("\n"),
    hints: [
      "Keep an inverted index, word → set of ids, plus each id's current word set so a re-insert can remove the old postings.",
      "Parse with recursive descent: or-expression → and-expressions → not-expressions → a word or a parenthesised expression. Evaluate as you parse, with sets as the values: union, intersection, and complement against all ids.",
    ],
    solution: [
      "## Approach",
      "",
      "Two parts that stay separate. The index maps each word to the set of ids containing it, and each id to its words so that a replacement removes stale postings. The query is a recursive-descent parser over the grammar `or := and ('||' and)*`, `and := not ('&&' not)*`, `not := '!' not | word | '(' or ')'`, where every production returns a set: a word looks up the index, `&&` intersects, `||` unions, `!` subtracts from the set of all ids. Sorting the final set is the only step that is not set algebra.",
      "",
      "## Complexity",
      "",
      "O(words) per insert; a query is O(expression · documents) in the worst case because of set operations, and typically far less.",
      "",
      "## Worth saying out loud",
      "",
      "- Negation is the design decision: `!word` needs the universe of ids, so the store has to know every document, not only the postings.",
      "- Phrases, prefixes and case folding each change the index, not the parser; that separation is the point of the design.",
      "- The same parser shape handles arithmetic, SQL `WHERE` clauses and JSON — say so when asked to extend it.",
    ].join("\n"),
    judge: {
      solutionCode: `// An inverted index, and a recursive-descent parser whose values are id sets.
class DocumentStore {
  constructor() {
    this.postings = new Map();                 // word -> Set of ids
    this.words = new Map();                    // id -> Set of words
  }

  insertDoc(id, text) {
    for (const word of this.words.get(id) ?? []) this.postings.get(word).delete(id);
    const words = new Set(text.split(/\\s+/).filter(Boolean));
    this.words.set(id, words);
    for (const word of words) {
      if (!this.postings.has(word)) this.postings.set(word, new Set());
      this.postings.get(word).add(id);
    }
  }

  query(expression) {
    const tokens = expression.match(/[A-Za-z0-9_]+|&&|\\|\\||!|\\(|\\)/g) ?? [];
    let at = 0;
    const peek = () => tokens[at];
    const take = () => tokens[at++];
    const all = () => new Set(this.words.keys());
    const or = () => {
      let result = and();
      while (peek() === "||") {
        take();
        result = new Set([...result, ...and()]);
      }
      return result;
    };
    const and = () => {
      let result = not();
      while (peek() === "&&") {
        take();
        const right = not();
        result = new Set([...result].filter((id) => right.has(id)));
      }
      return result;
    };
    const not = () => {
      if (peek() === "!") {
        take();
        const inner = not();
        return new Set([...all()].filter((id) => !inner.has(id)));
      }
      if (peek() === "(") {
        take();
        const inner = or();
        if (take() !== ")") throw new SyntaxError("expected )");
        return inner;
      }
      const word = take();
      if (word === undefined) throw new SyntaxError("expected a word");
      return new Set(this.postings.get(word) ?? []);
    };
    const result = or();
    if (at !== tokens.length) throw new SyntaxError("unexpected " + peek());
    return [...result].sort();
  }
}
`,
      starterCode: `class DocumentStore {
  constructor() {
    // Your state here
  }

  /** text is words separated by whitespace; inserting an id again replaces its document. */
  insertDoc(id, text) {}

  /** @returns {string[]} sorted ids of the documents satisfying the expression */
  query(expression) {
    return [];
  }
}
`,
      entry: "__runOperations",
      driverCode: runOperationsDriver("DocumentStore"),
      tests: [
        {
          name: "Prompt example",
          input: [
            ["DocumentStore", "insertDoc", "insertDoc", "insertDoc", "query", "query", "query", "query", "query", "query"],
            [
              [],
              ["d1", "apple banana"],
              ["d2", "banana cherry"],
              ["d3", "cherry apple pie"],
              ["apple"],
              ["apple && banana"],
              ["apple || cherry"],
              ["!banana"],
              ["(apple || banana) && !cherry"],
              ["cherry && !(apple || banana)"],
            ],
          ],
          expected: [null, null, null, null, ["d1", "d3"], ["d1"], ["d1", "d2", "d3"], ["d3"], ["d1"], []],
        },
        {
          name: "Unknown words and their negation",
          input: [
            ["DocumentStore", "insertDoc", "insertDoc", "query", "query"],
            [[], ["a", "x"], ["b", "y"], ["kiwi"], ["!kiwi"]],
          ],
          expected: [null, null, null, [], ["a", "b"]],
        },
        {
          name: "Re-inserting an id replaces the document",
          input: [
            ["DocumentStore", "insertDoc", "insertDoc", "query", "insertDoc", "query", "query"],
            [[], ["d1", "apple"], ["d3", "apple pie"], ["apple"], ["d1", "kiwi"], ["apple"], ["kiwi"]],
          ],
          expected: [null, null, null, ["d1", "d3"], null, ["d3"], ["d1"]],
        },
        {
          name: "&& binds tighter than ||",
          input: [
            ["DocumentStore", "insertDoc", "insertDoc", "insertDoc", "query"],
            [[], ["d1", "apple banana"], ["d2", "banana cherry"], ["d3", "cherry apple pie"], ["apple || banana && cherry"]],
          ],
          expected: [null, null, null, null, ["d1", "d2", "d3"]],
        },
        {
          name: "Double negation and spacing",
          input: [
            ["DocumentStore", "insertDoc", "insertDoc", "query", "query"],
            [[], ["d1", "apple  banana"], ["d2", "cherry"], ["!!apple"], ["(  !cherry )"]],
          ],
          expected: [null, null, null, ["d1"], ["d1"]],
        },
        {
          name: "An empty store",
          input: [
            ["DocumentStore", "query"],
            [[], ["apple || !apple"]],
          ],
          expected: [null, []],
        },
      ],
    },
  },
];
