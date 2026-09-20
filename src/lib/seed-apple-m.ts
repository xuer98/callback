import type { Problem } from "./types";

// Apple phone-screen bank, part M: the idempotent REST create method reported
// in PracHub's Apple list (technical screen, Jul 2025). Same conventions as
// seed-apple-a.ts; the Python variant lives in seed-python-apple-b.ts.

const TOKENS = {
  tok_ann: { userId: "ann", scopes: ["orders:write"] },
  tok_bob: { userId: "bob", scopes: ["orders:read", "orders:write"] },
  tok_rae: { userId: "rae", scopes: ["orders:read"] },
};

const ann = (key: string, body: unknown) => ({
  headers: { Authorization: "Bearer tok_ann", "Idempotency-Key": key },
  body,
});

export const appleProblemsM: Problem[] = [
  {
    slug: "idempotent-create-endpoint",
    title: "Implement a Robust REST Create Method",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Authenticate, validate, sanitise — then make POST safe to retry with an Idempotency-Key scoped to the caller.",
    prompt: [
      "Implement the handler behind `POST /orders`. It must be safe to retry: a client that times out and sends the same request again must not create a second order. Answer in code — `OrdersApi(tokens)` with `createOrder(request)` returning `{ status, body }`, where `request` is `{ headers, body }` — and be ready to discuss logging, rate limiting, tests, and what changes when two identical requests arrive at the same instant.",
      "",
      "`tokens` maps a bearer token to `{ userId, scopes }`. Header names are case-insensitive. Apply the checks **in this order**; the first failure wins:",
      "",
      "1. **Authenticate** — `Authorization: Bearer <token>` with a known token, else `401 { error: \"unauthorized\" }`.",
      "2. **Authorise** — the caller needs the `orders:write` scope, else `403 { error: \"forbidden\" }`.",
      "3. **Idempotency key** — an `Idempotency-Key` header of 1–64 characters after trimming, else `400 { error: \"invalid_idempotency_key\" }`.",
      "4. **Body shape** — the body must be a JSON object, else `400 { error: \"invalid_body\" }`.",
      "5. **Validate and sanitise** — else `422 { error: \"validation_failed\", fields: [...] }` naming every offending field, sorted:",
      "   - `sku`: a string that, once trimmed, is 1–40 characters of letters, digits, `_` or `-`;",
      "   - `quantity`: an integer from 1 to 100 (a numeric string or a boolean is invalid);",
      "   - `note`: optional; a string of at most 200 characters once control characters (codes below 32, and 127) are removed and it is trimmed; an empty or missing note is stored as `null`;",
      "   - any other field is rejected by name.",
      "6. **Idempotency** — keys are scoped to the authenticated user. A key seen before with the **same sanitised request** returns the original response again and creates nothing. A key seen before with a **different** request is `409 { error: \"idempotency_key_reused\" }`. A request that failed validation does not consume its key.",
      "7. **Create** — ids are `ord_1`, `ord_2`, … in creation order; respond `201 { id, sku, quantity, note, createdBy }` with the sanitised values.",
      "",
      "`count()` returns how many orders exist.",
      "",
      "```",
      "createOrder({ headers: { Authorization: \"Bearer tok_ann\", \"Idempotency-Key\": \"k1\" }, body: { sku: \" ABC-1 \", quantity: 2 } })",
      "  ->  { status: 201, body: { id: \"ord_1\", sku: \"ABC-1\", quantity: 2, note: null, createdBy: \"ann\" } }",
      "the same call again  ->  the same response; count() is still 1",
      "```",
      "",
      "## Worth asking out loud",
      "",
      "Is the key scoped per user, per endpoint, or global? What should a reused key with a different payload return? How long are keys remembered? Does a replay return the original status code? Are validation failures stored against the key? What happens when the first request is still in flight?",
    ].join("\n"),
    hints: [
      "Write the pipeline as a sequence of early returns in the stated order. Look headers up case-insensitively once, at the top, so the rest of the code never thinks about casing.",
      "Validate into a sanitised copy and collect the names of bad fields as you go, instead of returning on the first one. Everything after validation — the fingerprint, the stored order — uses the sanitised values.",
      "The idempotency store maps (userId, key) to a fingerprint of the sanitised request plus the response you sent. Same fingerprint: return the stored response. Different fingerprint: 409. Only write to it when an order is actually created.",
    ],
    solution: [
      "## Approach",
      "",
      "The handler is a pipeline of guards, each returning early with a precise status: `401` when we do not know who is calling, `403` when we know and they may not, `400` when the request is malformed at the protocol level (no usable idempotency key, a body that is not an object), `422` when it is well-formed but semantically invalid. Normalising header names to lower case once removes a whole class of bugs.",
      "",
      "Validation builds a **sanitised copy** — trimmed `sku`, control characters stripped from `note`, empty note collapsed to `null` — and collects every bad field rather than stopping at the first, because a client fixing one error per round trip is a miserable API. Unknown fields are rejected by name: accepting and ignoring them is how mass-assignment bugs start.",
      "",
      "Idempotency keys are scoped to the authenticated user, so two tenants cannot collide or probe each other's keys. The store maps `(userId, key)` to a fingerprint of the sanitised request and the response that was sent. A retry with the same fingerprint gets the stored response — same status, same body — and nothing is created. The same key with a different fingerprint is a client bug, answered with `409`. A validation failure is not stored: nothing started executing, so the client may correct the body and reuse the key.",
      "",
      "## Complexity",
      "",
      "O(size of the request) per call; O(orders + remembered keys) space. In production the key store has a time-to-live — 24 hours is typical — so it does not grow without bound.",
      "",
      "## Worth saying out loud",
      "",
      "- **Concurrency:** two identical requests arriving together both miss the lookup and both create. The fix is to make the key insert the first write, protected by a unique constraint on `(user_id, key)` inside the same transaction as the order insert: the loser of the race gets a constraint violation and either waits for the winner's stored response or returns `409` with a retry hint. Check-then-insert in application code is the race.",
      "- **Data model:** `orders(id, user_id, sku, quantity, note, created_at)` and `idempotency_keys(user_id, key, request_hash, response_status, response_body, created_at)` with a unique index and an expiry job.",
      "- **Logging:** one structured line per request — request id, user id, key, status, replayed or not, latency — and never the bearer token or free-text fields.",
      "- **Rate limiting:** a token bucket per user at the gateway, `429` with `Retry-After`; replays should be cheap and may be limited separately.",
      "- **Tests:** unit tests per guard and per validation rule, a property test that any accepted request replays identically, and an integration test that fires the same request concurrently and asserts exactly one row.",
      "- **Status for a reused key:** `409` here; some public APIs use `400` or `422`. Pick one, document it.",
    ].join("\n"),
    judge: {
      solutionCode: `const SKU = /^[A-Za-z0-9_-]{1,40}$/;
const ALLOWED = new Set(["sku", "quantity", "note"]);
const error = (status, code, extra = {}) => ({ status, body: { error: code, ...extra } });

function stripControl(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code !== 127) out += ch;
  }
  return out.trim();
}

// Returns { clean } or { fields } — every bad field, not just the first.
function validate(body) {
  const fields = new Set();
  for (const name of Object.keys(body)) if (!ALLOWED.has(name)) fields.add(name);

  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  if (!SKU.test(sku)) fields.add("sku");

  const quantity = body.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) fields.add("quantity");

  let note = null;
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== "string") fields.add("note");
    else {
      const cleaned = stripControl(body.note);
      if (cleaned.length > 200) fields.add("note");
      else note = cleaned === "" ? null : cleaned;
    }
  }
  if (fields.size > 0) return { fields: [...fields].sort() };
  return { clean: { sku, quantity, note } };
}

class OrdersApi {
  constructor(tokens) {
    this.tokens = tokens;
    this.orders = [];
    this.keys = new Map(); // userId + "\\n" + key -> { fingerprint, response }
  }

  createOrder(request) {
    const headers = {};
    for (const [name, value] of Object.entries(request.headers ?? {})) headers[name.toLowerCase()] = value;

    // 1–2. who is calling, and may they?
    const auth = typeof headers.authorization === "string" ? headers.authorization : "";
    const caller = auth.startsWith("Bearer ") ? this.tokens[auth.slice(7)] : undefined;
    if (!caller) return error(401, "unauthorized");
    if (!caller.scopes.includes("orders:write")) return error(403, "forbidden");

    // 3–5. is the request usable?
    const rawKey = headers["idempotency-key"];
    const key = typeof rawKey === "string" ? rawKey.trim() : "";
    if (key.length < 1 || key.length > 64) return error(400, "invalid_idempotency_key");
    const body = request.body;
    if (typeof body !== "object" || body === null || Array.isArray(body)) return error(400, "invalid_body");
    const result = validate(body);
    if (result.fields) return error(422, "validation_failed", { fields: result.fields });

    // 6. have we answered this before?
    const slot = caller.userId + "\\n" + key;
    const fingerprint = JSON.stringify([result.clean.sku, result.clean.quantity, result.clean.note]);
    const seen = this.keys.get(slot);
    if (seen) return seen.fingerprint === fingerprint ? seen.response : error(409, "idempotency_key_reused");

    // 7. create, and remember the answer
    const order = { id: "ord_" + (this.orders.length + 1), ...result.clean, createdBy: caller.userId };
    this.orders.push(order);
    const response = { status: 201, body: order };
    this.keys.set(slot, { fingerprint, response });
    return response;
  }

  count() {
    return this.orders.length;
  }
}
`,
      starterCode: `class OrdersApi {
  /** @param {Record<string, { userId: string, scopes: string[] }>} tokens bearer token -> caller */
  constructor(tokens) {
    this.tokens = tokens;
  }

  /**
   * POST /orders
   * @param {{ headers: Record<string, string>, body: unknown }} request
   * @returns {{ status: number, body: object }}
   */
  createOrder(request) {
    // Your code here
    return { status: 500, body: { error: "not_implemented" } };
  }

  /** @returns {number} how many orders exist */
  count() {
    return 0;
  }
}
`,
      entry: "__runOperations",
      driverCode: `function __runOperations(operations, args) {
  let api = null;
  const out = [];
  for (let i = 0; i < operations.length; i++) {
    if (operations[i] === "OrdersApi") {
      api = new OrdersApi(...args[i]);
      out.push(null);
    } else {
      out.push(api[operations[i]](...args[i]) ?? null);
    }
  }
  return out;
}`,
      tests: [
        {
          name: "Create, then a retry replays the original response",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "count"],
            [[TOKENS], [ann("k1", { sku: " ABC-1 ", quantity: 2 })], [ann("k1", { sku: " ABC-1 ", quantity: 2 })], []],
          ],
          expected: [
            null,
            { status: 201, body: { id: "ord_1", sku: "ABC-1", quantity: 2, note: null, createdBy: "ann" } },
            { status: 201, body: { id: "ord_1", sku: "ABC-1", quantity: 2, note: null, createdBy: "ann" } },
            1,
          ],
        },
        {
          name: "A reused key with a different request is a conflict",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "createOrder", "count"],
            [[TOKENS], [ann("k1", { sku: "A", quantity: 1 })], [ann("k1", { sku: "A", quantity: 2 })], [ann("k2", { sku: "A", quantity: 2 })], []],
          ],
          expected: [
            null,
            { status: 201, body: { id: "ord_1", sku: "A", quantity: 1, note: null, createdBy: "ann" } },
            { status: 409, body: { error: "idempotency_key_reused" } },
            { status: 201, body: { id: "ord_2", sku: "A", quantity: 2, note: null, createdBy: "ann" } },
            2,
          ],
        },
        {
          name: "Authentication and authorisation come first",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "createOrder", "createOrder", "count"],
            [
              [TOKENS],
              [{ headers: { "Idempotency-Key": "k" }, body: { sku: "A", quantity: 1 } }],
              [{ headers: { Authorization: "Bearer nope", "Idempotency-Key": "k" }, body: { sku: "A", quantity: 1 } }],
              [{ headers: { Authorization: "Basic tok_ann", "Idempotency-Key": "k" }, body: { sku: "A", quantity: 1 } }],
              [{ headers: { Authorization: "Bearer tok_rae" }, body: null }],
              [],
            ],
          ],
          expected: [
            null,
            { status: 401, body: { error: "unauthorized" } },
            { status: 401, body: { error: "unauthorized" } },
            { status: 401, body: { error: "unauthorized" } },
            { status: 403, body: { error: "forbidden" } },
            0,
          ],
        },
        {
          name: "The idempotency key is required and bounded",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "createOrder", "createOrder"],
            [
              [TOKENS],
              [{ headers: { Authorization: "Bearer tok_ann" }, body: { sku: "A", quantity: 1 } }],
              [ann("   ", { sku: "A", quantity: 1 })],
              [ann("k".repeat(65), { sku: "A", quantity: 1 })],
              [ann("k".repeat(64), { sku: "A", quantity: 1 })],
            ],
          ],
          expected: [
            null,
            { status: 400, body: { error: "invalid_idempotency_key" } },
            { status: 400, body: { error: "invalid_idempotency_key" } },
            { status: 400, body: { error: "invalid_idempotency_key" } },
            { status: 201, body: { id: "ord_1", sku: "A", quantity: 1, note: null, createdBy: "ann" } },
          ],
        },
        {
          name: "Body shape and field validation name every bad field",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "createOrder", "createOrder", "createOrder", "createOrder", "createOrder", "createOrder", "count"],
            [
              [TOKENS],
              [ann("a", null)],
              [ann("b", [1, 2])],
              [ann("c", { quantity: 0 })],
              [ann("d", { sku: "A", quantity: "3" })],
              [ann("e", { sku: "AB C", quantity: true })],
              [ann("f", { sku: "A", quantity: 1, price: 5 })],
              [ann("g", { sku: "A", quantity: 101, note: 7 })],
              [ann("h", { sku: "S".repeat(41), quantity: 1, note: "n".repeat(201) })],
              [],
            ],
          ],
          expected: [
            null,
            { status: 400, body: { error: "invalid_body" } },
            { status: 400, body: { error: "invalid_body" } },
            { status: 422, body: { error: "validation_failed", fields: ["quantity", "sku"] } },
            { status: 422, body: { error: "validation_failed", fields: ["quantity"] } },
            { status: 422, body: { error: "validation_failed", fields: ["quantity", "sku"] } },
            { status: 422, body: { error: "validation_failed", fields: ["price"] } },
            { status: 422, body: { error: "validation_failed", fields: ["note", "quantity"] } },
            { status: 422, body: { error: "validation_failed", fields: ["note", "sku"] } },
            0,
          ],
        },
        {
          name: "Sanitised values are stored, and header names are case-insensitive",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "count"],
            [
              [TOKENS],
              [{ headers: { authorization: "Bearer tok_bob", "idempotency-key": " key-1 " }, body: { sku: "  ABC_9 ", quantity: 100, note: "  gift\u0007 wrap " } }],
              [{ headers: { AUTHORIZATION: "Bearer tok_bob", "IDEMPOTENCY-KEY": "key-1" }, body: { sku: "ABC_9", quantity: 100, note: "gift wrap" } }],
              [],
            ],
          ],
          expected: [
            null,
            { status: 201, body: { id: "ord_1", sku: "ABC_9", quantity: 100, note: "gift wrap", createdBy: "bob" } },
            { status: 201, body: { id: "ord_1", sku: "ABC_9", quantity: 100, note: "gift wrap", createdBy: "bob" } },
            1,
          ],
        },
        {
          name: "A failed validation does not consume the key",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "count"],
            [[TOKENS], [ann("k1", { sku: "", quantity: 1 })], [ann("k1", { sku: "FIXED", quantity: 1 })], []],
          ],
          expected: [
            null,
            { status: 422, body: { error: "validation_failed", fields: ["sku"] } },
            { status: 201, body: { id: "ord_1", sku: "FIXED", quantity: 1, note: null, createdBy: "ann" } },
            1,
          ],
        },
        {
          name: "Keys are scoped to the caller; an empty note is null",
          input: [
            ["OrdersApi", "createOrder", "createOrder", "createOrder", "count"],
            [
              [TOKENS],
              [ann("shared", { sku: "A", quantity: 1, note: "   " })],
              [{ headers: { Authorization: "Bearer tok_bob", "Idempotency-Key": "shared" }, body: { sku: "B", quantity: 5, note: null } }],
              [ann("shared", { sku: "A", quantity: 1 })],
              [],
            ],
          ],
          expected: [
            null,
            { status: 201, body: { id: "ord_1", sku: "A", quantity: 1, note: null, createdBy: "ann" } },
            { status: 201, body: { id: "ord_2", sku: "B", quantity: 5, note: null, createdBy: "bob" } },
            { status: 201, body: { id: "ord_1", sku: "A", quantity: 1, note: null, createdBy: "ann" } },
            2,
          ],
        },
      ],
    },
  },
];
