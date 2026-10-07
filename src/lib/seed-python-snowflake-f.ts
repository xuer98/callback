import type { JudgeLanguage } from "./types";

// Python judges for the Snowflake coding bank, the wiki-page problems of
// parts C and D plus the request limiter, keyed by slug and merged into
// judge.python by the seed script like seed-python.ts.

const LINK_FETCHER = `def __link_fetcher(graph):
    fetched = set()
    def get_linked_pages(uri):
        if uri in fetched:
            raise RuntimeError("fetched " + uri + " twice: remember the pages you have seen")
        fetched.add(uri)
        return list(graph.get(uri, []))
    return get_linked_pages
`;

export const snowflakePythonJudgesF: Record<string, JudgeLanguage> = {
  "fewest-clicks-between-pages": {
    entry: "__judge_clicks",
    starterCode: `def fewest_clicks(start, target, get_linked_pages):
    """get_linked_pages(uri) fetches a page and returns the pages it links
    to. Fewest clicks from start to target, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def fewest_clicks(start, target, get_linked_pages):
    # BFS over the pages, one fetch per page.
    if start == target:
        return 0
    seen = {start}
    frontier = [start]
    clicks = 0
    while frontier:
        clicks += 1
        nxt = []
        for page in frontier:
            for link in get_linked_pages(page):
                if link in seen:
                    continue
                if link == target:
                    return clicks
                seen.add(link)
                nxt.append(link)
        frontier = nxt
    return -1
`,
    driverCode: `${LINK_FETCHER}

def __judge_clicks(graph, start, target):
    return fewest_clicks(start, target, __link_fetcher(graph))
`,
  },
  "click-path-between-pages": {
    entry: "__judge_click_path",
    starterCode: `def click_path(start, target, get_linked_pages):
    """A shortest path of pages from start to target, both included, or []
    when target cannot be reached."""
    # Your code here
    return []
`,
    solutionCode: `def click_path(start, target, get_linked_pages):
    # BFS with one predecessor per page; the path is rebuilt from the target.
    if start == target:
        return [start]
    previous = {start: None}
    queue = [start]
    head = 0
    while head < len(queue):
        page = queue[head]
        head += 1
        for link in get_linked_pages(page):
            if link in previous:
                continue
            previous[link] = page
            if link == target:
                path = []
                at = target
                while at is not None:
                    path.append(at)
                    at = previous[at]
                return path[::-1]
            queue.append(link)
    return []
`,
    driverCode: `${LINK_FETCHER}

def __judge_click_path(graph, start, target):
    path = click_path(start, target, __link_fetcher(graph))
    distance = {start: 0}
    queue = [start]
    head = 0
    while head < len(queue):
        page = queue[head]
        head += 1
        for link in graph.get(page, []):
            if link not in distance:
                distance[link] = distance[page] + 1
                queue.append(link)
    if target not in distance:
        if isinstance(path, (list, tuple)) and len(path) == 0:
            return "unreachable"
        return "returned a path to an unreachable page"
    if not isinstance(path, (list, tuple)) or len(path) == 0:
        return "no path returned"
    path = list(path)
    if path[0] != start or path[-1] != target:
        return "the path must run from " + start + " to " + target
    for i in range(1, len(path)):
        if path[i] not in graph.get(path[i - 1], []):
            return path[i - 1] + " does not link to " + path[i]
    if len(path) - 1 != distance[target]:
        return "path of " + str(len(path) - 1) + " clicks, but " + str(distance[target]) + " suffice"
    return "path of " + str(len(path) - 1) + " clicks"
`,
  },
  "crawl-reachable-pages": {
    entry: "__judge_crawl",
    starterCode: `def crawl(start, get_linked_pages):
    """Every page reachable from start, including start, in any order."""
    # Your code here
    return [start]
`,
    solutionCode: `def crawl(start, get_linked_pages):
    # The seen set is the answer: mark on discovery, fetch once.
    seen = {start}
    queue = [start]
    head = 0
    while head < len(queue):
        for link in get_linked_pages(queue[head]):
            if link not in seen:
                seen.add(link)
                queue.append(link)
        head += 1
    return list(seen)
`,
    driverCode: `${LINK_FETCHER}

def __judge_crawl(graph, start):
    return sorted(crawl(start, __link_fetcher(graph)))
`,
  },
  "dropped-request-times": {
    entry: "dropped_requests",
    starterCode: `def dropped_requests(times, rules):
    """times: request times in ms, non-decreasing. rules: [window, limit]
    pairs, at most limit accepted requests per window ms. The dropped
    request times, in order."""
    # Your code here
    return []
`,
    solutionCode: `from collections import deque


def dropped_requests(times, rules):
    # One queue of accepted timestamps per rule; evict, check every rule, then record.
    accepted = [deque() for _ in rules]
    dropped = []
    for t in times:
        for (window, _), queue in zip(rules, accepted):
            while queue and queue[0] <= t - window:
                queue.popleft()
        if all(len(queue) < limit for (_, limit), queue in zip(rules, accepted)):
            for queue in accepted:
                queue.append(t)
        else:
            dropped.append(t)
    return dropped
`,
  },
};
