import type { JudgeLanguage } from "./types";

// Python judge definitions for the second Apple batch (seed-apple-l.ts and
// seed-apple-m.ts), merged into each problem's judge by the seed script the
// same way as seed-python-apple.ts. Drivers map camelCase operation names
// onto snake_case methods.

export const applePythonJudgesB: Record<string, JudgeLanguage> = {
  "socket-message-reader": {
    entry: "__judge_reader",
    starterCode: `class MessageReader:
    def __init__(self, sock, max_size=1 << 20):
        """sock.recv(k) returns at most k bytes; b"" means EOF."""
        self.sock = sock
        self.max_size = max_size

    def read_message(self):
        """One payload (bytes) per call; None at a clean EOF;
        raise on a truncated or oversized message."""
        # Your code here
        return None


class LineReader:
    def __init__(self, sock):
        self.sock = sock

    def read_line(self):
        """The next line as str (UTF-8) without its newline; None once exhausted."""
        # Your code here
        return None
`,
    solutionCode: `class _BufferedSocket:
    def __init__(self, sock):
        self._sock = sock
        self._buf = bytearray()  # deleting from the front of a bytearray is cheap
        self._eof = False

    def _fill(self):
        """One recv. Returns False once the peer has closed."""
        if self._eof:
            return False
        chunk = self._sock.recv(4096)
        if not chunk:
            self._eof = True
            return False
        self._buf += chunk
        return True


class MessageReader(_BufferedSocket):
    def __init__(self, sock, max_size=1 << 20):
        super().__init__(sock)
        self._max_size = max_size

    def read_message(self):
        while len(self._buf) < 4:
            if not self._fill():
                if not self._buf:
                    return None  # clean EOF between messages
                raise EOFError("truncated header")
        size = int.from_bytes(self._buf[:4], "big")  # big-endian, unsigned
        if size > self._max_size:
            raise ValueError("message too large: %d" % size)
        while len(self._buf) < 4 + size:
            if not self._fill():
                raise EOFError("truncated message")
        payload = bytes(self._buf[4:4 + size])
        del self._buf[:4 + size]
        return payload


class LineReader(_BufferedSocket):
    def __init__(self, sock):
        super().__init__(sock)
        self._scanned = 0  # bytes already searched for a newline

    def read_line(self):
        while True:
            at = self._buf.find(b"\\n", self._scanned)
            if at != -1:
                line = bytes(self._buf[:at])
                del self._buf[:at + 1]
                self._scanned = 0
                return line.decode("utf-8")
            self._scanned = len(self._buf)
            if not self._fill():
                self._scanned = 0
                if not self._buf:
                    return None
                line = bytes(self._buf)  # final unterminated line
                self._buf.clear()
                return line.decode("utf-8")
`,
    driverCode: `def __judge_reader(kind, pieces, cuts, calls, options=None):
    options = options or {}

    def expand(piece):
        return piece[0] * piece[1] if isinstance(piece, list) else piece

    if kind == "framed":
        stream = bytearray()
        for piece in pieces:
            body = expand(piece).encode("latin-1")
            stream += len(body).to_bytes(4, "big") + body
        data = bytes(stream)
    else:
        data = "".join(expand(piece) for piece in pieces).encode("utf-8")
    if options.get("truncate"):
        data = data[: len(data) - options["truncate"]]
    bounds = [c for c in cuts if 0 < c < len(data)] + [len(data)]

    class FakeSocket:
        def __init__(self):
            self.pos = 0
            self.chunk = 0

        def recv(self, k=None):
            if self.pos >= len(data):
                return b""
            while bounds[self.chunk] <= self.pos:
                self.chunk += 1
            limit = self.pos + k if isinstance(k, int) and k > 0 else len(data)
            end = min(bounds[self.chunk], limit)
            out = data[self.pos:end]
            self.pos = end
            return out

    sock = FakeSocket()
    if kind == "framed":
        reader = MessageReader(sock, options.get("maxSize", 1 << 20))
    else:
        reader = LineReader(sock)

    def show(text):
        return "len:%d:%s:%s" % (len(text), text[:4], text[-4:]) if len(text) > 32 else text

    out = []
    for _ in range(calls):
        try:
            value = reader.read_message() if kind == "framed" else reader.read_line()
            if value is None:
                out.append(None)
            elif kind == "framed":
                out.append(show(bytes(value).decode("latin-1")))
            else:
                out.append(show(str(value)))
        except Exception:
            out.append("error")
            break
    return out
`,
  },
  "idempotent-create-endpoint": {
    entry: "__run_operations",
    starterCode: `class OrdersApi:
    def __init__(self, tokens):
        """tokens: bearer token -> {"userId": str, "scopes": [str]}"""
        self.tokens = tokens

    def create_order(self, request):
        """POST /orders. request = {"headers": {...}, "body": ...}
        Return {"status": int, "body": dict}."""
        # Your code here
        return {"status": 500, "body": {"error": "not_implemented"}}

    def count(self):
        """How many orders exist."""
        return 0
`,
    solutionCode: `import re

SKU = re.compile(r"[A-Za-z0-9_-]{1,40}")
ALLOWED = {"sku", "quantity", "note"}


def _error(status, code, **extra):
    return {"status": status, "body": {"error": code, **extra}}


def _strip_control(text):
    return "".join(ch for ch in text if ord(ch) >= 32 and ord(ch) != 127).strip()


def _validate(body):
    """Return (clean, None) or (None, fields) -- every bad field, not just the first."""
    fields = {name for name in body if name not in ALLOWED}

    sku = body.get("sku")
    sku = sku.strip() if isinstance(sku, str) else ""
    if not SKU.fullmatch(sku):
        fields.add("sku")

    quantity = body.get("quantity")
    if not isinstance(quantity, int) or isinstance(quantity, bool) or not 1 <= quantity <= 100:
        fields.add("quantity")

    note = None
    raw = body.get("note")
    if raw is not None:
        if not isinstance(raw, str):
            fields.add("note")
        else:
            cleaned = _strip_control(raw)
            if len(cleaned) > 200:
                fields.add("note")
            else:
                note = cleaned or None
    if fields:
        return None, sorted(fields)
    return {"sku": sku, "quantity": quantity, "note": note}, None


class OrdersApi:
    def __init__(self, tokens):
        self.tokens = tokens
        self.orders = []
        self.keys = {}  # (user_id, key) -> (fingerprint, response)

    def create_order(self, request):
        headers = {str(name).lower(): value for name, value in (request.get("headers") or {}).items()}

        # 1-2. who is calling, and may they?
        auth = headers.get("authorization")
        caller = self.tokens.get(auth[7:]) if isinstance(auth, str) and auth.startswith("Bearer ") else None
        if not caller:
            return _error(401, "unauthorized")
        if "orders:write" not in caller["scopes"]:
            return _error(403, "forbidden")

        # 3-5. is the request usable?
        raw_key = headers.get("idempotency-key")
        key = raw_key.strip() if isinstance(raw_key, str) else ""
        if not 1 <= len(key) <= 64:
            return _error(400, "invalid_idempotency_key")
        body = request.get("body")
        if not isinstance(body, dict):
            return _error(400, "invalid_body")
        clean, fields = _validate(body)
        if fields:
            return _error(422, "validation_failed", fields=fields)

        # 6. have we answered this before?
        slot = (caller["userId"], key)
        fingerprint = (clean["sku"], clean["quantity"], clean["note"])
        seen = self.keys.get(slot)
        if seen:
            return seen[1] if seen[0] == fingerprint else _error(409, "idempotency_key_reused")

        # 7. create, and remember the answer
        order = {"id": "ord_%d" % (len(self.orders) + 1), **clean, "createdBy": caller["userId"]}
        self.orders.append(order)
        response = {"status": 201, "body": order}
        self.keys[slot] = (fingerprint, response)
        return response

    def count(self):
        return len(self.orders)
`,
    driverCode: `def __run_operations(operations, args):
    names = {"createOrder": "create_order"}
    api = None
    out = []
    for op, a in zip(operations, args):
        if op == "OrdersApi":
            api = OrdersApi(*a)
            out.append(None)
        else:
            out.append(getattr(api, names.get(op, op))(*a))
    return out
`,
  },
};
