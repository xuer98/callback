// Completion sources for the workspace editor. The language packages already
// contribute keyword snippets and local-variable completion; this adds the
// piece an interview editor is missing: suggestions after a dot (arr., s.,
// Math., heapq.) plus Python stdlib module members. The completion UI itself
// comes from basicSetup, so these plug in via languageData.
import {
  completeFromList,
  ifNotIn,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import {
  javascriptLanguage,
  scopeCompletionSource,
} from "@codemirror/lang-javascript";
import { pythonLanguage } from "@codemirror/lang-python";

// Syntax nodes where completing makes no sense.
const JS_NO_COMPLETE = [
  "String",
  "TemplateString",
  "RegExp",
  "LineComment",
  "BlockComment",
];
const PY_NO_COMPLETE = ["String", "FormatString", "Comment"];

// ---------------------------------------------------------------------------
// Shared member-completion machinery
// ---------------------------------------------------------------------------

// Completes `receiver.<prefix>`. When the receiver names a known module the
// module's members are offered; otherwise the generic method list is. Returns
// null for spreads (`...`), number literals (`12.`), and skipped receivers.
function memberCompletion(
  context: CompletionContext,
  modules: Record<string, Completion[]> | null,
  generic: Completion[],
  skipReceiver: (name: string) => boolean,
): CompletionResult | null {
  const word = context.matchBefore(/\.[\w$]*$/);
  if (!word) return null;
  const line = context.state.doc.lineAt(word.from);
  const before = line.text.slice(0, word.from - line.from);
  if (/[.\d]$/.test(before)) return null;
  const receiver = /([A-Za-z_$][\w$]*)$/.exec(before)?.[1];
  if (receiver && skipReceiver(receiver)) return null;
  const options = (receiver && modules?.[receiver]) || generic;
  return { from: word.from + 1, options, validFor: /^[\w$]*$/ };
}

function completions(
  names: string,
  type: string,
  detail?: string,
): Completion[] {
  return names.split(" ").map((label) => ({ label, type, detail }));
}

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------

// Globals available in the judge worker. Doubles as the scope for
// scopeCompletionSource, which resolves paths like `Math.` precisely.
const JS_GLOBALS: Record<string, unknown> = {
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  BigInt,
  Symbol,
  Map,
  Set,
  WeakMap,
  WeakSet,
  Promise,
  RegExp,
  Date,
  Error,
  TypeError,
  RangeError,
  console,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Infinity,
  NaN,
};

const JS_MEMBER_SKIP = new Set([
  "constructor",
  "valueOf",
  "toLocaleString",
  // Deprecated Annex B string methods — legal but never what anyone wants.
  "anchor",
  "big",
  "blink",
  "bold",
  "fixed",
  "fontcolor",
  "fontsize",
  "italics",
  "link",
  "small",
  "strike",
  "sub",
  "sup",
  "substr",
]);

// Derive the generic `something.` list from the real prototypes so it never
// drifts from the runtime (includes at/flat/findLast/union/etc. for free).
function collectMembers(
  into: Map<string, Completion>,
  proto: object,
  detail: string,
) {
  for (const label of Object.getOwnPropertyNames(proto)) {
    if (JS_MEMBER_SKIP.has(label) || label.startsWith("__")) continue;
    const existing = into.get(label);
    if (existing) {
      if (existing.detail && !existing.detail.includes(detail)) {
        existing.detail += `/${detail}`;
      }
      continue;
    }
    const desc = Object.getOwnPropertyDescriptor(proto, label);
    into.set(label, {
      label,
      type: typeof desc?.value === "function" ? "method" : "property",
      detail,
    });
  }
}

const jsMemberMap = new Map<string, Completion>();
collectMembers(jsMemberMap, Array.prototype, "array");
collectMembers(jsMemberMap, String.prototype, "string");
collectMembers(jsMemberMap, Map.prototype, "map");
collectMembers(jsMemberMap, Set.prototype, "set");
collectMembers(jsMemberMap, Number.prototype, "number");
const JS_MEMBERS = [...jsMemberMap.values()];

function jsMemberSource(context: CompletionContext): CompletionResult | null {
  // Resolvable globals (Math., console.) are handled exactly by the scope
  // source; `this.` has unknowable members, so offer nothing rather than noise.
  return memberCompletion(
    context,
    null,
    JS_MEMBERS,
    (name) => name === "this" || Object.hasOwn(JS_GLOBALS, name),
  );
}

export const jsCompletions = [
  javascriptLanguage.data.of({
    autocomplete: ifNotIn(JS_NO_COMPLETE, scopeCompletionSource(JS_GLOBALS)),
  }),
  javascriptLanguage.data.of({
    autocomplete: ifNotIn(JS_NO_COMPLETE, jsMemberSource),
  }),
];

// ---------------------------------------------------------------------------
// Python
// ---------------------------------------------------------------------------

const PY_MODULES: Record<string, Completion[]> = {
  heapq: completions(
    "heapify heappop heappush heappushpop heapreplace merge nlargest nsmallest",
    "function",
    "heapq",
  ),
  math: [
    ...completions(
      "ceil comb dist exp fabs factorial floor fmod gcd hypot isqrt lcm log log10 log2 perm pow sqrt trunc",
      "function",
      "math",
    ),
    ...completions("e inf nan pi tau", "constant", "math"),
  ],
  collections: completions(
    "ChainMap Counter OrderedDict defaultdict deque namedtuple",
    "class",
    "collections",
  ),
  itertools: completions(
    "accumulate chain combinations combinations_with_replacement compress count cycle dropwhile groupby islice pairwise permutations product repeat starmap takewhile zip_longest",
    "function",
    "itertools",
  ),
  bisect: completions(
    "bisect bisect_left bisect_right insort insort_left insort_right",
    "function",
    "bisect",
  ),
  functools: completions(
    "cache cmp_to_key lru_cache partial reduce",
    "function",
    "functools",
  ),
  re: completions(
    "compile findall finditer fullmatch match search split sub",
    "function",
    "re",
  ),
  random: completions(
    "choice randint random sample shuffle uniform",
    "function",
    "random",
  ),
  string: completions(
    "ascii_letters ascii_lowercase ascii_uppercase digits punctuation whitespace",
    "constant",
    "string",
  ),
  sys: [
    ...completions("setrecursionlimit", "function", "sys"),
    ...completions("maxsize", "constant", "sys"),
  ],
};

// Generic `something.` methods, merged across the builtin types.
const PY_METHOD_TABLE: Array<[detail: string, names: string]> = [
  [
    "list",
    "append clear copy count extend index insert pop remove reverse sort",
  ],
  ["dict", "clear copy get items keys pop popitem setdefault update values"],
  [
    "set",
    "add clear copy difference discard intersection isdisjoint issubset issuperset pop remove symmetric_difference union update",
  ],
  [
    "str",
    "capitalize center count endswith find format index isalnum isalpha isdecimal isdigit islower isnumeric isspace isupper join ljust lower lstrip partition removeprefix removesuffix replace rfind rindex rjust rpartition rsplit rstrip split splitlines startswith strip title upper zfill",
  ],
  ["deque", "appendleft extendleft popleft rotate"],
  ["Counter", "elements most_common subtract total"],
];

const pyMemberMap = new Map<string, Completion>();
for (const [detail, names] of PY_METHOD_TABLE) {
  for (const label of names.split(" ")) {
    const existing = pyMemberMap.get(label);
    if (existing) {
      if (existing.detail && !existing.detail.includes(detail)) {
        existing.detail += `/${detail}`;
      }
      continue;
    }
    pyMemberMap.set(label, { label, type: "method", detail });
  }
}
const PY_MEMBERS = [...pyMemberMap.values()];

function pyMemberSource(context: CompletionContext): CompletionResult | null {
  // `self.`/`cls.` attributes are unknowable — offer nothing rather than
  // suggesting list methods on every instance.
  return memberCompletion(
    context,
    PY_MODULES,
    PY_MEMBERS,
    (name) => name === "self" || name === "cls",
  );
}

// Module names as identifier completions (handy after `import `, and a nudge
// that the import is needed). Boosted down so user locals rank first.
const PY_MODULE_NAMES: Completion[] = Object.keys(PY_MODULES).map((label) => ({
  label,
  type: "namespace",
  detail: "module",
  boost: -1,
}));

export const pythonCompletions = [
  pythonLanguage.data.of({
    autocomplete: ifNotIn(PY_NO_COMPLETE, pyMemberSource),
  }),
  pythonLanguage.data.of({
    autocomplete: ifNotIn(PY_NO_COMPLETE, completeFromList(PY_MODULE_NAMES)),
  }),
];
