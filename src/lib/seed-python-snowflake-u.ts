import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake coding bank, parts U, V and X —
// permission inheritance down a DAG, subtree pruning, and contiguous recipe
// lookup — keyed by slug and merged into judge.python by the seed script
// like seed-python.ts.

export const snowflakePythonJudgesU: Record<string, JudgeLanguage> = {
  "dag-permissions-inherited-allow": {
    entry: "effective_allow",
    starterCode: `def effective_allow(nodes, edges):
    """nodes: [name, allow, disallow] rows of distinct lowercase letters;
    edges: [parent, child] pairs of names, acyclic. Allows flow down from
    every ancestor, a disallow edits its own node only. Return
    [name, letters] for every node, sorted by name, letters alphabetical."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def effective_allow(nodes, edges):
    # Allows accumulate down the DAG as 26-bit masks; a disallow only edits the node's own result.
    index = {name: i for i, (name, _, _) in enumerate(nodes)}
    n = len(nodes)

    def mask(letters):
        m = 0
        for ch in letters:
            m |= 1 << (ord(ch) - 97)
        return m

    children = [[] for _ in range(n)]
    indegree = [0] * n
    for parent, child in edges:
        children[index[parent]].append(index[child])
        indegree[index[child]] += 1
    allowed = [mask(allow) for _, allow, _ in nodes]
    queue = deque(i for i in range(n) if indegree[i] == 0)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        for v in children[u]:
            allowed[v] |= allowed[u]
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    if seen != n:
        raise ValueError("the edges form a cycle")

    def letters(m):
        return "".join(chr(97 + b) for b in range(26) if m >> b & 1)

    rows = [[name, letters(allowed[i] & ~mask(disallow))] for i, (name, _, disallow) in enumerate(nodes)]
    rows.sort(key=lambda row: row[0])
    return rows
`,
  },
  "dag-permissions-allow-deny": {
    entry: "resolve_permissions",
    starterCode: `def resolve_permissions(names, edges, allow, deny):
    """edges: [parent, child] pairs of names (acyclic, duplicates possible);
    allow and deny list node names. A node has access when an allow reached
    it or an ancestor and no deny did. One boolean per node, in names order."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def resolve_permissions(names, edges, allow, deny):
    # Two bits per node, ORed down the DAG in topological order.
    index = {name: i for i, name in enumerate(names)}
    n = len(names)
    children = [[] for _ in range(n)]
    indegree = [0] * n
    for parent, child in edges:
        children[index[parent]].append(index[child])
        indegree[index[child]] += 1
    allowed = [False] * n
    denied = [False] * n
    for name in allow:
        allowed[index[name]] = True
    for name in deny:
        denied[index[name]] = True
    queue = deque(i for i in range(n) if indegree[i] == 0)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        for v in children[u]:
            allowed[v] = allowed[v] or allowed[u]
            denied[v] = denied[v] or denied[u]
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    if seen != n:
        raise ValueError("the edges form a cycle")
    return [allowed[i] and not denied[i] for i in range(n)]
`,
  },
  "dag-permissions-inherited-deny": {
    entry: "effective_permissions",
    starterCode: `def effective_permissions(n, edges, allow, deny):
    """edges: [parent, child] pairs over nodes 0..n-1, acyclic; allow[i] and
    deny[i] are lowercase letters set on node i. Both flow down; a deny
    beats an allow. Each node's effective letters as a sorted string."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def effective_permissions(n, edges, allow, deny):
    # Allows and denies accumulate separately down the DAG; subtract once at the end.
    def mask(letters):
        m = 0
        for ch in letters:
            m |= 1 << (ord(ch) - 97)
        return m

    children = [[] for _ in range(n)]
    indegree = [0] * n
    for parent, child in edges:
        children[parent].append(child)
        indegree[child] += 1
    allowed = [mask(s) for s in allow]
    denied = [mask(s) for s in deny]
    queue = deque(i for i in range(n) if indegree[i] == 0)
    seen = 0
    while queue:
        u = queue.popleft()
        seen += 1
        for v in children[u]:
            allowed[v] |= allowed[u]
            denied[v] |= denied[u]
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    if seen != n:
        raise ValueError("the edges form a cycle")
    return [
        "".join(chr(97 + b) for b in range(26) if (allowed[i] & ~denied[i]) >> b & 1)
        for i in range(n)
    ]
`,
  },
  "subtree-pruning-remaining-depth": {
    entry: "deepest_remaining",
    starterCode: `def deepest_remaining(n, parent, deletions):
    """parent[i] is node i's parent, -1 for the root (depth 0). Deleting a
    node removes its whole subtree. The deepest remaining original depth,
    or -1 when nothing remains."""
    # Your code here
    return -1
`,
    solutionCode: `from collections import deque


def deepest_remaining(n, parent, deletions):
    # BFS from the root that never steps into a deleted node; depths are original depths.
    children = [[] for _ in range(n)]
    root = -1
    for i in range(n):
        if parent[i] == -1:
            root = i
        else:
            children[parent[i]].append(i)
    gone = set(deletions)
    if root == -1 or root in gone:
        return -1
    deepest = 0
    queue = deque([(root, 0)])
    while queue:
        node, depth = queue.popleft()
        deepest = max(deepest, depth)
        for child in children[node]:
            if child not in gone:
                queue.append((child, depth + 1))
    return deepest
`,
  },
  "subtree-pruning-depth-limit": {
    entry: "fewest_cuts",
    starterCode: `def fewest_cuts(parent, k):
    """parent[0] is -1; the root (depth 0) cannot be deleted and nodes
    within the limit must stay. Deleting a node removes its subtree. The
    fewest deletions leaving every remaining node at depth <= k."""
    # Your code here
    return 0
`,
    solutionCode: `from collections import deque


def fewest_cuts(parent, k):
    # Every node at depth k + 1 must be cut, and those cuts remove all deeper nodes.
    n = len(parent)
    children = [[] for _ in range(n)]
    for i in range(1, n):
        children[parent[i]].append(i)
    cuts = 0
    queue = deque([(0, 0)])
    while queue:
        node, depth = queue.popleft()
        if depth == k + 1:
            cuts += 1                      # nothing below it needs a look
            continue
        for child in children[node]:
            queue.append((child, depth + 1))
    return cuts
`,
  },
  "subtree-pruning-deepest-cuts": {
    entry: "best_cuts",
    starterCode: `def best_cuts(n, parent, max_depth):
    """parent[0] is -1; any non-root node may be deleted, subtree included.
    Fewest deletions leaving every remaining node at depth <= max_depth,
    then the largest total original depth of the deleted nodes:
    [deletions, depth_sum]."""
    # Your code here
    return [0, 0]
`,
    solutionCode: `def best_cuts(n, parent, max_depth):
    # One cut per root branch with a too-deep node, at the deepest ancestor-or-self of all of them.
    children = [[] for _ in range(n)]
    for i in range(1, n):
        children[parent[i]].append(i)
    depth = [0] * n
    order = [0]
    for u in order:                        # grows while we iterate: a BFS order
        for v in children[u]:
            depth[v] = depth[u] + 1
            order.append(v)
    too_deep = [0] * n                     # too-deep nodes in each subtree
    for u in reversed(order):
        if depth[u] > max_depth:
            too_deep[u] += 1
        if u != 0:
            too_deep[parent[u]] += too_deep[u]
    cuts = 0
    depth_sum = 0
    for top in children[0]:
        if too_deep[top] == 0:
            continue
        u = top
        while depth[u] <= max_depth:       # a too-deep node is itself the cut
            only = -1
            for v in children[u]:
                if too_deep[v] == too_deep[u]:
                    only = v
                    break
            if only == -1:                 # the offenders split here
                break
            u = only
        cuts += 1
        depth_sum += depth[u]
    return [cuts, depth_sum]
`,
  },
  "contiguous-recipes": {
    entry: "recipes_found",
    starterCode: `def recipes_found(ingredients, recipes):
    """Whether each recipe appears in ingredients as a contiguous run; an
    empty recipe counts as found. Elements are ints or strings."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def recipes_found(ingredients, recipes):
    # Aho-Corasick: one trie over all recipes, one pass over the ingredients.
    nxt = [{}]                             # transitions per node, keyed by element
    fail = [0]
    out = [[]]                             # recipes that end at this node (or a suffix of it)
    found = [len(recipe) == 0 for recipe in recipes]
    for r, recipe in enumerate(recipes):
        if not recipe:
            continue
        node = 0
        for item in recipe:
            child = nxt[node].get(item)
            if child is None:
                child = len(nxt)
                nxt[node][item] = child
                nxt.append({})
                fail.append(0)
                out.append([])
            node = child
        out[node].append(r)
    queue = deque(nxt[0].values())         # depth-1 nodes fail to the root
    while queue:
        node = queue.popleft()
        for item, child in nxt[node].items():
            f = fail[node]
            while f and item not in nxt[f]:
                f = fail[f]
            fail[child] = nxt[f].get(item, 0)
            out[child] = out[child] + out[fail[child]]
            queue.append(child)
    node = 0
    for item in ingredients:
        while node and item not in nxt[node]:
            node = fail[node]
        node = nxt[node].get(item, 0)
        for r in out[node]:
            found[r] = True
    return found
`,
  },
  "contiguous-recipes-stream": {
    entry: "__judge_recipe_stream",
    starterCode: `def recipes_in_stream(stream, recipes):
    """stream: an iterator over the ingredients, readable once; recipes are
    known up front. Whether each recipe appears as a contiguous run
    somewhere in the stream; an empty recipe counts as found."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def recipes_in_stream(stream, recipes):
    # The Aho-Corasick automaton is built from the recipes; the stream is consumed once.
    nxt = [{}]
    fail = [0]
    out = [[]]
    found = [len(recipe) == 0 for recipe in recipes]
    for r, recipe in enumerate(recipes):
        if not recipe:
            continue
        node = 0
        for item in recipe:
            child = nxt[node].get(item)
            if child is None:
                child = len(nxt)
                nxt[node][item] = child
                nxt.append({})
                fail.append(0)
                out.append([])
            node = child
        out[node].append(r)
    queue = deque(nxt[0].values())
    while queue:
        node = queue.popleft()
        for item, child in nxt[node].items():
            f = fail[node]
            while f and item not in nxt[f]:
                f = fail[f]
            fail[child] = nxt[f].get(item, 0)
            out[child] = out[child] + out[fail[child]]
            queue.append(child)
    node = 0
    for item in stream:                    # one pass; nothing is kept
        while node and item not in nxt[node]:
            node = fail[node]
        node = nxt[node].get(item, 0)
        for r in out[node]:
            found[r] = True
    return found
`,
    driverCode: `def __judge_recipe_stream(items, recipes):
    # A plain iterator can be read once, front to back, like a real stream.
    return recipes_in_stream(iter(items), recipes)
`,
  },
};
