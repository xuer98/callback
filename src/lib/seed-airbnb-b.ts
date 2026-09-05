import type { Problem } from "./types";

// Airbnb frontend tech-screen bank, part B: the DSA/OOD wildcards a minority
// of frontend candidates report in the screen — the in-memory file system
// ("build a cloud storage mechanism") and Pour Water with its print-the-terrain
// warm-up. Judged in JavaScript, since the screen is.

export const airbnbProblemsB: Problem[] = [
  {
    slug: "in-memory-file-system",
    title: "In-Memory File System",
    category: "algorithms",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "A tree of nodes keyed by path segment — the OOD-style prompt where the implementation is the test.",
    prompt: `Build an in-memory file system keyed by slash-separated paths — reported at Airbnb as "build a cloud storage mechanism" and "an online storage system": an OOD-style prompt where the logic is simple and the implementation is what's graded.

\`\`\`
fs.create(path, value?)   // true if created; false if it already exists; throws if the parent is missing
fs.get(path)              // the node's value, or undefined when the path doesn't exist
fs.set(path, value)       // overwrite; throws when the path doesn't exist
fs.list(path = "")        // child names, sorted; [] for a missing path
\`\`\`

Paths look like \`"a/b/c"\`; leading and trailing slashes are ignored, so \`"/a/"\` names the same node as \`"a"\`. \`create\` is \`mkdir\` without \`-p\`: \`"a/b"\` needs \`"a"\` to exist first. Every node can hold a value **and** children.

## Follow-ups to be ready for

\`delete(path)\` recursively, \`move(src, dst)\`, quotas ("reject writes over N bytes"), TTLs, versioning.

## Worth asking out loud

Are files and directories different things, or is every node the same shape? Does a duplicate \`create\` return false or throw? Should \`set\` create missing intermediate nodes?`,
    hints: [
      "One node shape — {children: Map, value} — for everything; the root is a node with no name. Split the path on '/' and drop empty segments so slashes at either end are harmless.",
      "Write one private walk(path) that follows segments and returns the node or null; create, get, set, and list are each a few lines on top of it.",
    ],
    solution: `## Approach

A tree of identical nodes (\`{children: Map, value}\`) hanging off an anonymous root. One private \`#walk(path)\` follows the segments (empty ones dropped, so \`"/a/"\` is \`"a"\`) and returns the node or \`null\`; every public method is a thin layer on it. \`create\` walks to the parent and refuses when it's missing — that's the "without \`-p\`" semantics — and returns \`false\` for an existing name rather than clobbering it.

\`\`\`js
// In-memory file system: create(path) / get(path) / set(path, value) / list(path)
// Paths look like "a/b/c". Tree of nodes; each node may hold a value and children.
class FileSystem {
  #root = { children: new Map(), value: undefined };

  #walk(path, { create = false } = {}) {
    let node = this.#root;
    for (const part of path.split('/').filter(Boolean)) {
      let next = node.children.get(part);
      if (!next) {
        if (!create) return null;
        next = { children: new Map(), value: undefined };
        node.children.set(part, next);
      }
      node = next;
    }
    return node;
  }

  // Create a path; parent must exist (like \`mkdir\` without -p). Returns false if it exists already.
  create(path, value = undefined) {
    const parts = path.split('/').filter(Boolean);
    const parent = this.#walk(parts.slice(0, -1).join('/'));
    if (!parent) throw new Error(\`Parent of "\${path}" does not exist\`);
    const name = parts[parts.length - 1];
    if (parent.children.has(name)) return false;
    parent.children.set(name, { children: new Map(), value });
    return true;
  }

  get(path) {
    const node = this.#walk(path);
    return node ? node.value : undefined;
  }

  set(path, value) {
    const node = this.#walk(path);
    if (!node) throw new Error(\`"\${path}" does not exist\`);
    node.value = value;
  }

  list(path = '') {
    const node = this.#walk(path);
    return node ? [...node.children.keys()].sort() : [];
  }
}
\`\`\`

## Complexity

Every operation is O(depth) for the walk; \`list\` adds O(k log k) for the sort. Space is one node per created path.

## Worth saying out loud

- Ask whether files and directories differ before you model them — one node shape with an optional value covers both and keeps every method tiny.
- \`#walk\` already has a \`create\` option: that's \`mkdir -p\` for free if the interviewer relaxes the parent rule, and it's how \`set\` could auto-create.
- Follow-ups fall out of the tree: \`delete\` removes a child from its parent's Map (recursive for free); \`move\` is delete plus re-attach; quotas track bytes on write; TTL stores \`expiresAt\` and checks on read; versioning keeps an array of \`{value, ts}\` per node.`,
    judge: {
      starterCode: `class FileSystem {
  constructor() {
    // Your state here — a tree of nodes keyed by path segment
  }

  /** true if created; false if the path already exists; throws when the parent is missing. */
  create(path, value = undefined) {
    return false;
  }

  /** The node's value, or undefined when the path doesn't exist. */
  get(path) {
    return undefined;
  }

  /** Overwrite the node's value; throws when the path doesn't exist. */
  set(path, value) {}

  /** Child names, sorted; [] for a missing path. */
  list(path = "") {
    return [];
  }
}
`,
      entry: "__runOperations",
      // A thrown error is reported as the string "error" so tests can expect it.
      driverCode: `function __runOperations(operations, args) {
  let fs = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const a = args[i];
    if (op === "FileSystem") {
      fs = new FileSystem();
      out.push(null);
      continue;
    }
    try {
      const result = fs[op](...a);
      out.push(result === undefined ? null : result);
    } catch (err) {
      out.push("error");
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Create, then read back",
          input: [["FileSystem", "create", "get", "create", "get"], [[], ["a"], ["a"], ["a/b", 5], ["a/b"]]],
          expected: [null, true, null, true, 5],
        },
        { name: "The parent must exist", input: [["FileSystem", "create"], [[], ["x/y"]]], expected: [null, "error"] },
        { name: "A duplicate create returns false", input: [["FileSystem", "create", "create"], [[], ["a"], ["a"]]], expected: [null, true, false] },
        {
          name: "set overwrites; set on a missing path throws",
          input: [["FileSystem", "create", "set", "get", "set"], [[], ["a", 1], ["a", 7], ["a"], ["a/zzz", 1]]],
          expected: [null, true, null, 7, "error"],
        },
        {
          name: "list is sorted",
          input: [["FileSystem", "create", "create", "create", "list", "list"], [[], ["a"], ["a/c"], ["a/b"], ["a"], [""]]],
          expected: [null, true, true, true, ["b", "c"], ["a"]],
        },
        { name: "Missing paths read as undefined and list as empty", input: [["FileSystem", "get", "list"], [[], ["nope"], ["nope"]]], expected: [null, null, []] },
        {
          name: "Deep paths",
          input: [["FileSystem", "create", "create", "create", "get", "list"], [[], ["a"], ["a/b"], ["a/b/c", "deep"], ["a/b/c"], ["a/b"]]],
          expected: [null, true, true, true, "deep", ["c"]],
        },
        {
          name: "Surrounding slashes are ignored",
          input: [["FileSystem", "create", "create", "get"], [[], ["a", 1], ["/a/"], ["/a/"]]],
          expected: [null, true, false, 1],
        },
        {
          name: "A node can hold a value and children",
          input: [["FileSystem", "create", "create", "get", "list"], [[], ["a", "dir-value"], ["a/b", "leaf"], ["a"], ["a"]]],
          expected: [null, true, true, "dir-value", ["b"]],
        },
      ],
    },
  },
  {
    slug: "pour-water",
    title: "Pour Water, Then Print the Terrain",
    category: "algorithms",
    difficulty: "medium",
    companies: ["airbnb"],
    summary:
      "Simulate one unit at a time — left, then right, else stay — and draw it as ASCII rows.",
    prompt: `Reported on a senior frontend loop as a two-parter: **first write a function that prints the terrain**, then pour the water (LeetCode 755, Airbnb-tagged).

\`heights[i]\` is the terrain height at index \`i\`. \`volume\` units of water are dropped at index \`k\`, one unit at a time. Each unit:

1. moves **left** if it can reach a strictly lower resting spot without ever climbing;
2. otherwise moves **right** under the same rule;
3. otherwise stays at \`k\`.

A unit settles on the lowest reachable spot (the first such spot in its direction of travel) and raises that column by one. Return the final heights.

\`\`\`
pourWater([2,1,1,2,1,2,2], 4, 3)  ->  [2,2,2,3,2,2,2]
\`\`\`

## Part 1 — print the terrain

\`printTerrain(heights, water)\` takes the ground and the final heights after pouring and returns the picture as rows from the top down, joined by \`"\\n"\`: \`#\` for ground, \`~\` for water, a space for air. Rows are as wide as the terrain (spaces are kept).

\`\`\`
   ~
#~~#~##
#######
\`\`\`

## Worth asking out loud

Does water prefer left over right when both are lower? What if the lowest reachable spot ties — which one wins (the first encountered while walking)? Can \`k\` be at an edge?`,
    hints: [
      "Simulate each unit: walk left while the next cell is not higher, remembering the lowest cell seen; if that lowest cell is lower than k, drop the water there. Otherwise repeat to the right. Otherwise it stays at k.",
      "For the picture, iterate levels from max(water) down to 1 and emit one character per column: ground if level ≤ heights[i], water if level ≤ water[i], else space.",
    ],
    solution: `## Approach

Direct simulation is the intended solution at this size: for each unit, walk left while the next column isn't higher, tracking the lowest column seen; if it's strictly lower than \`k\`, the unit lands there. Otherwise do the same to the right; otherwise it stays at \`k\`. The terrain printer iterates height levels from the top down, emitting ground, water, or air per column — the "write the printer first" ordering is the interviewer handing you a debugging tool.

\`\`\`js
// Pour Water (LeetCode 755, Airbnb-tagged)
// heights[i] = terrain height; drop \`volume\` units at index k, one unit at a time.
// Each unit tries to move LEFT to a strictly lower final resting spot, then RIGHT, else stays.
function pourWater(heights, volume, k) {
  const h = [...heights];
  for (let v = 0; v < volume; v++) {
    let landed = false;
    for (const dir of [-1, 1]) {                // left first, then right
      let best = k;
      let i = k;
      while (i + dir >= 0 && i + dir < h.length && h[i + dir] <= h[i]) {
        i += dir;
        if (h[i] < h[best]) best = i;           // lowest point reachable without climbing
      }
      if (best !== k) { h[best]++; landed = true; break; }
    }
    if (!landed) h[k]++;
  }
  return h;
}

// Follow-up that was reported alongside it: print the terrain + water as ASCII rows.
function printTerrain(heights, water) {
  const top = Math.max(...water);
  const rows = [];
  for (let level = top; level >= 1; level--) {
    rows.push(heights.map((ground, i) => (level <= ground ? '#' : level <= water[i] ? '~' : ' ')).join(''));
  }
  return rows.join('\\n');
}
\`\`\`

## Complexity

O(volume · n) for the pour — each unit may scan the whole row — and O(n · maxHeight) for the picture.

## Worth saying out loud

- The walk condition is "not higher" (\`<=\`), but the landing condition is "strictly lower" (\`<\`) — flat ground is traversable, not a destination. Say that distinction; it's where most bugs live.
- Left-before-right and first-lowest-wins are conventions from the problem statement — confirm them before coding.
- The printer is a test harness in disguise: run it after every unit while debugging.`,
    judge: {
      starterCode: `/** Rows from the top down (height max(water)), joined by "\\n": "#" ground, "~" water, " " air. */
function printTerrain(heights, water) {
  return "";
}

/** Final heights after dropping volume units at index k, one unit at a time. */
function pourWater(heights, volume, k) {
  return heights;
}
`,
      entry: "__judgeWater",
      driverCode: `function __judgeWater(kind, heights, a, b) {
  return kind === "print" ? printTerrain(heights, a) : pourWater(heights, a, b);
}`,
      tests: [
        { name: "Classic example", input: ["pour", [2, 1, 1, 2, 1, 2, 2], 4, 3], expected: [2, 2, 2, 3, 2, 2, 2] },
        { name: "Water flows left downhill", input: ["pour", [1, 2, 3, 4], 2, 2], expected: [2, 3, 3, 4] },
        { name: "A basin fills then overflows both ways", input: ["pour", [3, 1, 3], 5, 1], expected: [4, 4, 4] },
        { name: "No volume, no change", input: ["pour", [1, 2, 3], 0, 1], expected: [1, 2, 3] },
        { name: "A single column just stacks", input: ["pour", [5], 3, 0], expected: [8] },
        { name: "Right only when left can't go lower", input: ["pour", [2, 2, 1], 1, 1], expected: [2, 2, 2] },
        { name: "Print the classic", input: ["print", [2, 1, 1, 2, 1, 2, 2], [2, 2, 2, 3, 2, 2, 2]], expected: "   ~   \n#~~#~##\n#######" },
        { name: "Print with no water", input: ["print", [1, 2], [1, 2]], expected: " #\n##" },
      ],
    },
  },
];
