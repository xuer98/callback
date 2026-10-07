import type { JudgeLanguage } from "./types";
import { RUN_OPERATIONS_PY } from "./seed-python-snowflake-b";

// Python judges for the Snowflake coding bank, parts J and K, keyed by slug
// and merged into judge.python by the seed script like seed-python.ts.

export const snowflakePythonJudgesD: Record<string, JudgeLanguage> = {
  "json-parser": {
    entry: "__judge_json",
    starterCode: `def parse_json(text):
    """The parsed value of a JSON document; raise on invalid input. The
    json module is unavailable while this runs."""
    # Your code here
    return None
`,
    solutionCode: `import re


def parse_json(text):
    # Recursive descent over one cursor; each parser leaves the cursor after what it consumed.
    pos = 0
    number_re = re.compile(r"-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+-]?[0-9]+)?")
    escapes = {'"': '"', "\\\\": "\\\\", "/": "/", "b": "\\b", "f": "\\f", "n": "\\n", "r": "\\r", "t": "\\t"}

    def fail(what):
        raise ValueError(what + " at position " + str(pos))

    def skip():
        nonlocal pos
        while pos < len(text) and text[pos] in " \\t\\n\\r":
            pos += 1

    def literal(word, result):
        nonlocal pos
        if not text.startswith(word, pos):
            fail("bad literal")
        pos += len(word)
        return result

    def number():
        nonlocal pos
        match = number_re.match(text, pos)
        if not match:
            fail("bad number")
        pos = match.end()
        token = match.group(0)
        return float(token) if any(c in token for c in ".eE") else int(token)

    def string():
        nonlocal pos
        pos += 1                                  # opening quote
        out = []
        while pos < len(text):
            ch = text[pos]
            pos += 1
            if ch == '"':
                return "".join(out)
            if ch != "\\\\":
                out.append(ch)
                continue
            esc = text[pos]
            pos += 1
            if esc == "u":
                hex_digits = text[pos:pos + 4]
                if not re.fullmatch(r"[0-9a-fA-F]{4}", hex_digits):
                    fail("bad unicode escape")
                out.append(chr(int(hex_digits, 16)))
                pos += 4
            elif esc in escapes:
                out.append(escapes[esc])
            else:
                fail("bad escape")
        fail("unterminated string")

    def array():
        nonlocal pos
        pos += 1
        out = []
        skip()
        if text[pos:pos + 1] == "]":
            pos += 1
            return out
        while True:
            out.append(value())
            skip()
            if text[pos:pos + 1] == ",":
                pos += 1
                continue
            if text[pos:pos + 1] == "]":
                pos += 1
                return out
            fail("expected , or ]")

    def obj():
        nonlocal pos
        pos += 1
        out = {}
        skip()
        if text[pos:pos + 1] == "}":
            pos += 1
            return out
        while True:
            skip()
            if text[pos:pos + 1] != '"':
                fail("expected a key")
            key = string()
            skip()
            if text[pos:pos + 1] != ":":
                fail("expected :")
            pos += 1
            out[key] = value()
            skip()
            if text[pos:pos + 1] == ",":
                pos += 1
                continue
            if text[pos:pos + 1] == "}":
                pos += 1
                return out
            fail("expected , or }")

    def value():
        skip()
        ch = text[pos:pos + 1]
        if ch == "{":
            return obj()
        if ch == "[":
            return array()
        if ch == '"':
            return string()
        if ch == "t":
            return literal("true", True)
        if ch == "f":
            return literal("false", False)
        if ch == "n":
            return literal("null", None)
        if ch == "-" or ch.isdigit():
            return number()
        fail("unexpected character")

    result = value()
    skip()
    if pos != len(text):
        fail("trailing characters")
    return result
`,
    driverCode: `import json as _json


def __judge_json(text):
    native_loads, native_load = _json.loads, _json.load

    def banned(*args, **kwargs):
        raise RuntimeError("json.loads is off limits here")

    _json.loads = banned
    _json.load = banned
    try:
        return parse_json(text)
    except Exception:
        return "invalid"
    finally:
        _json.loads = native_loads
        _json.load = native_load
`,
  },
  "document-store-predicates": {
    entry: "__run_operations",
    starterCode: `class DocumentStore:
    def __init__(self):
        # Your state here
        pass

    def insert_doc(self, doc_id, text):
        """text is words separated by whitespace; inserting an id again
        replaces its document."""
        pass

    def query(self, expression):
        """Sorted ids of the documents satisfying the expression."""
        return []
`,
    solutionCode: `import re


class DocumentStore:
    # An inverted index, and a recursive-descent parser whose values are id sets.
    def __init__(self):
        self.postings = {}     # word -> set of ids
        self.words = {}        # id -> set of words

    def insert_doc(self, doc_id, text):
        for word in self.words.get(doc_id, ()):
            self.postings[word].discard(doc_id)
        words = set(text.split())
        self.words[doc_id] = words
        for word in words:
            self.postings.setdefault(word, set()).add(doc_id)

    def query(self, expression):
        tokens = re.findall(r"[A-Za-z0-9_]+|&&|\\|\\||!|\\(|\\)", expression)
        at = 0

        def peek():
            return tokens[at] if at < len(tokens) else None

        def take():
            nonlocal at
            at += 1
            return tokens[at - 1]

        def or_expr():
            result = and_expr()
            while peek() == "||":
                take()
                result = result | and_expr()
            return result

        def and_expr():
            result = not_expr()
            while peek() == "&&":
                take()
                result = result & not_expr()
            return result

        def not_expr():
            if peek() == "!":
                take()
                return set(self.words) - not_expr()
            if peek() == "(":
                take()
                inner = or_expr()
                if take() != ")":
                    raise SyntaxError("expected )")
                return inner
            word = peek()
            if word is None:
                raise SyntaxError("expected a word")
            take()
            return set(self.postings.get(word, ()))

        result = or_expr()
        if at != len(tokens):
            raise SyntaxError("unexpected " + str(peek()))
        return sorted(result)
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "dynamic-blacklist-filter": {
    entry: "__run_operations",
    starterCode: `class BlacklistFilter:
    def __init__(self):
        # Your state here
        pass

    def publish(self, item):
        """item is words separated by spaces; held if any word is blocked."""
        pass

    def block(self, word):
        pass

    def unblock(self, word):
        """Held items that are now clean are emitted, in publish order."""
        pass

    def emitted(self):
        """Everything emitted so far, in order."""
        return []
`,
    solutionCode: `class BlacklistFilter:
    # Blocked set, held list in publish order, emitted list; unblock sweeps the held list.
    def __init__(self):
        self.blocked = set()
        self.held = []
        self.out = []

    def is_blocked(self, item):
        return any(word in self.blocked for word in item.split(" "))

    def publish(self, item):
        (self.held if self.is_blocked(item) else self.out).append(item)

    def block(self, word):
        self.blocked.add(word)

    def unblock(self, word):
        self.blocked.discard(word)
        still = []
        for item in self.held:
            (still if self.is_blocked(item) else self.out).append(item)
        self.held = still

    def emitted(self):
        return list(self.out)
`,
    driverCode: RUN_OPERATIONS_PY,
  },
  "connect-four-winning-move": {
    entry: "is_winning_move",
    starterCode: `def is_winning_move(board, row, col):
    """board: 0 empty, 1 and 2 the players; the piece at (row, col) was
    just placed. Whether it completed four or more in a line."""
    # Your code here
    return False
`,
    solutionCode: `def is_winning_move(board, row, col):
    # Count outward from the move along each of the four line directions.
    player = board[row][col]
    if not player:
        return False
    rows, cols = len(board), len(board[0])
    for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
        run = 1
        for sign in (1, -1):
            r, c = row + dr * sign, col + dc * sign
            while 0 <= r < rows and 0 <= c < cols and board[r][c] == player:
                run += 1
                r += dr * sign
                c += dc * sign
        if run >= 4:
            return True
    return False
`,
  },
  "valid-tic-tac-toe-state": {
    entry: "valid_tic_tac_toe",
    starterCode: `def valid_tic_tac_toe(board):
    """board: n rows of X, O and spaces; n in a row wins. Whether a real
    game could reach this position."""
    # Your code here
    return False
`,
    solutionCode: `def valid_tic_tac_toe(board):
    # Piece counts plus a line check per player decide reachability.
    n = len(board)
    xs = sum(row.count("X") for row in board)
    os = sum(row.count("O") for row in board)

    def has_line(p):
        lines = [list(row) for row in board]
        lines += [[row[i] for row in board] for i in range(n)]
        lines.append([board[i][i] for i in range(n)])
        lines.append([board[i][n - 1 - i] for i in range(n)])
        return any(all(c == p for c in line) for line in lines)

    if xs != os and xs != os + 1:
        return False
    x_wins, o_wins = has_line("X"), has_line("O")
    if x_wins and o_wins:
        return False
    if x_wins and xs != os + 1:
        return False
    if o_wins and xs != os:
        return False
    return True
`,
  },
  "cheapest-flights-k-stops": {
    entry: "find_cheapest_price",
    starterCode: `def find_cheapest_price(n, flights, src, dst, k):
    """flights: [from, to, price]. The cheapest price from src to dst with
    at most k stops, or -1."""
    # Your code here
    return -1
`,
    solutionCode: `def find_cheapest_price(n, flights, src, dst, k):
    # Bellman-Ford for k + 1 rounds against a frozen copy of the previous round.
    INF = float("inf")
    cost = [INF] * n
    cost[src] = 0
    for _ in range(k + 1):
        nxt = cost[:]
        for frm, to, price in flights:
            if cost[frm] + price < nxt[to]:
                nxt[to] = cost[frm] + price
        cost = nxt
    return -1 if cost[dst] == INF else cost[dst]
`,
  },
  "three-colorable-graph": {
    entry: "is_three_colorable",
    starterCode: `def is_three_colorable(n, edges):
    """Undirected graph on vertices 0..n-1. Whether three colours suffice."""
    # Your code here
    return False
`,
    solutionCode: `def is_three_colorable(n, edges):
    # Backtracking with pruning by coloured neighbours; the first vertex is fixed to colour 0.
    adjacent = [[] for _ in range(n)]
    for a, b in edges:
        adjacent[a].append(b)
        adjacent[b].append(a)
    colour = [-1] * n

    def extend(vertex):
        if vertex == n:
            return True
        for c in range(1 if vertex == 0 else 3):
            if any(colour[other] == c for other in adjacent[vertex]):
                continue
            colour[vertex] = c
            if extend(vertex + 1):
                return True
            colour[vertex] = -1
        return False

    return extend(0)
`,
  },
  "fewest-coins-with-change": {
    entry: "fewest_coins_with_change",
    starterCode: `def fewest_coins_with_change(price):
    """The fewest coins that change hands, paying a non-negative price with
    1, 5, 10, 50, 100 and 200 and receiving change in the same coins."""
    # Your code here
    return 0
`,
    solutionCode: `def fewest_coins_with_change(price):
    # Minimise coins paid plus coins returned over every payment up to one 200 above the price.
    denominations = (1, 5, 10, 50, 100, 200)
    limit = price + 200
    coins = [0] + [float("inf")] * limit          # fewest coins making exactly x
    for x in range(1, limit + 1):
        coins[x] = min(coins[x - d] + 1 for d in denominations if d <= x)
    return min(coins[paid] + coins[paid - price] for paid in range(price, price + 200))
`,
  },
};
