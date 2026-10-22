import {
  bounds,
  count,
  distinctInts,
  GenError,
  num,
  pair,
  randInt,
  shuffle,
  type GenSpec,
  type Rng,
} from "./judge-gen-core";

// The structured generators behind `edges`, `adjacency`, `parents` and
// `tree` specs (see judge-gen.ts for the spec language): random graphs
// with the shape options a problem needs — acyclic, connected, bipartite,
// weighted — forests as parent arrays, and binary trees in level order.

type Edge = [number, number] | [number, number, number];

export function edges(spec: GenSpec, r: Rng): Edge[] {
  const n = count(spec);
  const m = count(spec, "m");
  const directed = Boolean(spec.directed);
  const acyclic = Boolean(spec.acyclic);
  const connected = Boolean(spec.connected);
  const bipartite = Boolean(spec.bipartite);
  const weights = pair(spec, "weights");
  const half = Math.floor(n / 2);
  const maxEdges = bipartite
    ? half * (n - half)
    : directed && !acyclic
      ? n * (n - 1)
      : (n * (n - 1)) / 2;
  if (m > maxEdges || (connected && m < n - 1)) {
    throw new GenError("edges: m does not fit n");
  }
  // A random relabelling so an acyclic graph's topological order, or a
  // bipartite graph's two sides, can't be read off the ids — unless the
  // caller needs to know them (`plain`).
  const ids = Array.from({ length: n }, (_, i) => i);
  const label = spec.plain ? ids : shuffle(ids, r);
  const seen = new Set<number>();
  const out: Edge[] = [];
  const add = (a: number, b: number) => {
    // Undirected and acyclic graphs key on the unordered pair.
    const key =
      directed && !acyclic ? a * n + b : Math.min(a, b) * n + Math.max(a, b);
    if (a === b || seen.has(key)) return;
    seen.add(key);
    const [u, v] = acyclic ? [Math.min(a, b), Math.max(a, b)] : [a, b];
    out.push(
      weights
        ? [label[u], label[v], randInt(r, weights[0], weights[1])]
        : [label[u], label[v]],
    );
  };
  // Bipartite: the first half of the unlabelled ids is one side.
  const side = (i: number) =>
    i < half ? randInt(r, half, n - 1) : randInt(r, 0, half - 1);
  if (connected) {
    for (let i = 1; i < n; i++) {
      add(bipartite ? side(i) : randInt(r, 0, i - 1), i);
    }
  }
  let guard = 0;
  while (out.length < m) {
    if (++guard > m * 50 + 1000) {
      throw new GenError("edges: could not place m distinct edges");
    }
    if (bipartite) add(randInt(r, 0, half - 1), randInt(r, half, n - 1));
    else add(randInt(r, 0, n - 1), randInt(r, 0, n - 1));
  }
  return out;
}

/** `edges` with string ids when the spec names a prefix. */
export function namedEdges(spec: GenSpec, r: Rng): unknown[] {
  const out = edges(spec, r);
  if (typeof spec.prefix !== "string") return out;
  const prefix = spec.prefix;
  return out.map(([u, v, w]) =>
    w === undefined
      ? [`${prefix}${u}`, `${prefix}${v}`]
      : [`${prefix}${u}`, `${prefix}${v}`, w],
  );
}

/** The same graphs as `edges`, as a name -> neighbours object. */
export function adjacency(spec: GenSpec, r: Rng): Record<string, unknown> {
  const n = count(spec);
  const prefix = typeof spec.prefix === "string" ? spec.prefix : "";
  const name = (i: number) => `${prefix}${i}`;
  const directed = Boolean(spec.directed) || Boolean(spec.acyclic);
  const weighted = spec.weights !== undefined;
  const out: Record<string, unknown> = {};
  for (let i = 0; i < n; i++) out[name(i)] = weighted ? {} : [];
  const link = (a: number, b: number, w: number | undefined) => {
    if (weighted) {
      (out[name(a)] as Record<string, number>)[name(b)] = w as number;
    } else {
      (out[name(a)] as string[]).push(name(b));
    }
  };
  for (const [u, v, w] of edges({ ...spec, directed, prefix: undefined }, r)) {
    link(u, v, w);
    if (!directed) link(v, u, w);
  }
  return out;
}

/** A random rooted forest as a parent array: parent[i] < i, roots are -1. */
export function parents(spec: GenSpec, r: Rng): number[] {
  const n = count(spec);
  const roots = Math.max(1, Math.floor(num(spec, "roots", 1)));
  return Array.from({ length: n }, (_, i) =>
    i < roots ? -1 : randInt(r, 0, i - 1),
  );
}

/**
 * A binary tree as its level-order array with nulls for missing children
 * (the TreeNode builders' input format). "random" inserts shuffled distinct
 * values into a BST, which keeps the depth logarithmic in practice;
 * "balanced" builds a complete tree from the sorted values; both are valid
 * binary search trees. "full" grows a tree where every node has zero or two
 * children by splitting random leaves (n must be odd); its values are
 * distinct but not ordered.
 */
export function tree(spec: GenSpec, r: Rng): (number | null)[] {
  const n = count(spec);
  const [min, max] = bounds(spec);
  if (n === 0) return [];
  const values = distinctInts(r, n, min, max);
  const left = new Int32Array(n).fill(-1);
  const right = new Int32Array(n).fill(-1);
  let root = 0;
  if (spec.kind === "balanced") {
    values.sort((a, b) => a - b);
    const build = (lo: number, hi: number): number => {
      if (lo > hi) return -1;
      const mid = (lo + hi) >> 1;
      left[mid] = build(lo, mid - 1);
      right[mid] = build(mid + 1, hi);
      return mid;
    };
    root = build(0, n - 1);
  } else if (spec.kind === "full") {
    if (n % 2 === 0) {
      throw new GenError("tree: a full binary tree has an odd number of nodes");
    }
    const leaves = [0];
    let next = 1;
    while (next < n) {
      const at = randInt(r, 0, leaves.length - 1);
      const leaf = leaves[at];
      leaves[at] = leaves[leaves.length - 1];
      leaves.pop();
      left[leaf] = next;
      right[leaf] = next + 1;
      leaves.push(next, next + 1);
      next += 2;
    }
  } else {
    for (let i = 1; i < n; i++) {
      let node = 0;
      for (;;) {
        const side = values[i] < values[node] ? left : right;
        if (side[node] === -1) {
          side[node] = i;
          break;
        }
        node = side[node];
      }
    }
  }
  const out: (number | null)[] = [];
  const queue = [root];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    if (node === -1) {
      out.push(null);
      continue;
    }
    out.push(values[node]);
    queue.push(left[node], right[node]);
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}
