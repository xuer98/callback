import type { JudgeLanguage } from "./types";

// Python judges for the GreatFrontEnd algorithm prompts, keyed by slug and
// merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesW: Record<string, JudgeLanguage> = {
  "breadth-first-search-order": {
    entry: "bfs",
    starterCode: `def bfs(graph, source):
    """graph maps a node to its neighbours in order; reachable nodes in BFS order."""
    # Your code here
    return []
`,
    solutionCode: `def bfs(graph, source):
    order, seen, head = [source], {source}, 0
    while head < len(order):
        for nxt in graph.get(order[head], []):
            if nxt not in seen:
                seen.add(nxt)
                order.append(nxt)
        head += 1
    return order
`,
  },
  "merge-sort": {
    entry: "merge_sort",
    starterCode: `def merge_sort(arr):
    """A new list, sorted ascending, without the built-in sort."""
    # Your code here
    return []
`,
    solutionCode: `def merge_sort(arr):
    if len(arr) <= 1:
        return list(arr)
    mid = len(arr) // 2
    left, right = merge_sort(arr[:mid]), merge_sort(arr[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    return out + left[i:] + right[j:]
`,
  },
  "dijkstra-shortest-distances": {
    entry: "dijkstra",
    starterCode: `def dijkstra(graph, source):
    """graph maps a node to {neighbour: weight}; distances per node, None if unreachable."""
    # Your code here
    return {}
`,
    solutionCode: `import heapq


def dijkstra(graph, source):
    distance = {node: None for node in graph}
    distance[source] = 0
    heap = [(0, source)]
    while heap:
        dist, node = heapq.heappop(heap)
        if dist > distance[node]:
            continue
        for nxt, weight in graph.get(node, {}).items():
            candidate = dist + weight
            if distance[nxt] is None or candidate < distance[nxt]:
                distance[nxt] = candidate
                heapq.heappush(heap, (candidate, nxt))
    return distance
`,
  },
};
