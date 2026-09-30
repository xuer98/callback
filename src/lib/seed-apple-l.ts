import type { Problem } from "./types";

// Apple coding bank, part L: the robust length-prefixed socket message
// reader. Same conventions as seed-apple-a.ts; the Python variant lives in
// seed-python-apple-b.ts, and the newline-delimited reader in seed-apple-q.ts.

export const appleProblemsL: Problem[] = [
  {
    slug: "socket-message-reader",
    title: "Robust Socket Message Reader",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "TCP is a byte stream: buffer across calls, frame by length prefix, and tell a clean EOF from a truncated message.",
    prompt: [
      "You are given a connected TCP socket. `socket.recv(k)` returns **at most** `k` bytes — possibly fewer, possibly just one — and returns an empty result once the peer has closed the connection (EOF). A message can arrive split across many `recv` calls, and one `recv` can contain several messages back to back.",
      "",
      "Build `MessageReader(socket, maxSize)` on top of it, keeping an internal buffer between calls. Every message is a **4-byte big-endian unsigned length** followed by that many payload bytes. `readMessage()` returns exactly one payload per call (as bytes), in order.",
      "",
      "- A zero-length message is valid and returns an empty payload — which is not the same as EOF.",
      "- At a clean EOF, with nothing buffered between messages, return `null`.",
      "- EOF in the middle of a header or a payload is an error: throw.",
      "- A header announcing more than `maxSize` bytes is an error: throw **before** trying to read the payload.",
      "",
      "```",
      "stream: 00 00 00 05 h e l l o 00 00 00 00      chunks arrive as [00 00] [00 05 h e] [l l o 00 00 00 00]",
      "readMessage() -> \"hello\",  readMessage() -> \"\" (empty payload),  readMessage() -> null",
      "```",
      "",
      "The harness feeds your reader from a fake socket that fragments the stream at chosen offsets, calls `readMessage` a fixed number of times, and records each result — `\"error\"` for a throw. Results longer than 32 characters are shown as `len:N:head:tail`.",
    ].join("\n"),
    hints: [
      "Loop: while the buffer does not yet hold a complete frame, call recv and append; when recv returns nothing, decide whether the buffer is empty (clean EOF) or holds a partial frame.",
      "Wait for 4 bytes, decode them as a big-endian unsigned integer, check the limit, then wait for 4 + length bytes before consuming anything. Never assume one recv equals one message.",
    ],
    solution: [
      "## Approach",
      "",
      "TCP delivers a byte stream, not messages — framing is the application's job, and `recv` boundaries mean nothing. Keep a buffer that survives between calls and a `fill()` that performs one `recv`, appends what it got, and remembers EOF. `readMessage` loops: *is a complete frame in the buffer? if not, fill; if fill hits EOF, decide.*",
      "",
      "Wait until four bytes are buffered; if EOF arrives first, an empty buffer is a clean end (`null`) and anything else is a truncated header. Decode the length as big-endian and unsigned (`>>> 0` in JavaScript, because bitwise operators are signed), reject it against `maxSize` before reading further — a hostile or corrupt header must not make you allocate gigabytes — then wait for `4 + length` bytes and consume exactly that. Anything left in the buffer belongs to the next message, which is how back-to-back messages in a single `recv` come out one per call.",
      "",
      "The reference keeps a growable byte buffer with start and end offsets, compacting when it must grow, so consuming a frame is a slice rather than a rebuild. In Python a `bytearray` does the same job, and deleting from its front is cheap.",
      "",
      "## Complexity",
      "",
      "O(n) total over n stream bytes — each byte is appended once and copied out once; O(largest frame) buffer space, bounded by `maxSize`.",
      "",
      "## Worth saying out loud",
      "",
      "- **Tests to list:** one byte per recv; several messages in one recv; a zero-length message; EOF at a boundary, inside a header and inside a payload; an oversized header.",
      "- **Blocking and timeouts:** a real socket blocks in `recv`; production code sets a read deadline so a peer that sends half a message cannot hold a thread forever, and handles interrupted reads and connection resets as errors distinct from EOF.",
      "- **Endianness and signedness** are the classic bugs: network order is big-endian, and a length with the top bit set must not become negative.",
    ].join("\n"),
    judge: {
      solutionCode: `// A growable byte queue: append at the end, consume from the front.
class ByteBuffer {
  constructor() {
    this.data = new Uint8Array(4096);
    this.start = 0;
    this.end = 0;
  }

  get length() {
    return this.end - this.start;
  }

  append(chunk) {
    if (this.end + chunk.length > this.data.length) {
      const live = this.length;
      let capacity = this.data.length;
      while (capacity < live + chunk.length) capacity *= 2;
      const next = new Uint8Array(capacity);
      next.set(this.data.subarray(this.start, this.end)); // compact while growing
      this.data = next;
      this.start = 0;
      this.end = live;
    }
    this.data.set(chunk, this.end);
    this.end += chunk.length;
  }

  byteAt(i) {
    return this.data[this.start + i];
  }

  indexOf(byte, from) {
    const at = this.data.subarray(this.start, this.end).indexOf(byte, from);
    return at;
  }

  take(n) {
    const out = this.data.slice(this.start, this.start + n);
    this.start += n;
    if (this.start === this.end) this.start = this.end = 0;
    return out;
  }
}

class BufferedSocket {
  constructor(socket) {
    this.socket = socket;
    this.buffer = new ByteBuffer();
    this.eof = false;
  }

  // One recv. Returns false once the peer has closed.
  fill() {
    if (this.eof) return false;
    const chunk = this.socket.recv(4096);
    if (chunk.length === 0) {
      this.eof = true;
      return false;
    }
    this.buffer.append(chunk);
    return true;
  }
}

class MessageReader extends BufferedSocket {
  constructor(socket, maxSize = 1 << 20) {
    super(socket);
    this.maxSize = maxSize;
  }

  readMessage() {
    const buffer = this.buffer;
    while (buffer.length < 4) {
      if (!this.fill()) {
        if (buffer.length === 0) return null; // clean EOF between messages
        throw new Error("truncated header");
      }
    }
    // Big-endian, unsigned: >>> 0 undoes the sign of the 32-bit bitwise result.
    const size =
      ((buffer.byteAt(0) << 24) | (buffer.byteAt(1) << 16) | (buffer.byteAt(2) << 8) | buffer.byteAt(3)) >>> 0;
    if (size > this.maxSize) throw new Error("message too large: " + size);
    while (buffer.length < 4 + size) {
      if (!this.fill()) throw new Error("truncated message");
    }
    buffer.take(4);
    return buffer.take(size);
  }
}
`,
      starterCode: `class MessageReader {
  /**
   * @param {{ recv(k: number): Uint8Array }} socket recv returns at most k bytes; length 0 means EOF
   * @param {number} maxSize largest payload to accept
   */
  constructor(socket, maxSize = 1 << 20) {
    this.socket = socket;
    this.maxSize = maxSize;
  }

  /** @returns {Uint8Array|null} one payload per call; null at a clean EOF; throws on truncation or oversize */
  readMessage() {
    // Your code here
    return null;
  }
}
`,
      entry: "__judgeFramed",
      // pieces: payload strings or [unit, times] pairs, each framed with a
      // 4-byte length. cuts: offsets the fake socket never reads across.
      // options: { truncate, maxSize }.
      driverCode: `function __judgeFramed(pieces, cuts, calls, options) {
  options = options || {};
  const expand = (piece) => (Array.isArray(piece) ? piece[0].repeat(piece[1]) : piece);
  const parts = [];
  let total = 0;
  for (const piece of pieces) {
    const body = Uint8Array.from(expand(piece), (ch) => ch.charCodeAt(0) & 0xff);
    const header = new Uint8Array(4);
    new DataView(header.buffer).setUint32(0, body.length);
    parts.push(header, body);
    total += 4 + body.length;
  }
  let bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  if (options.truncate) bytes = bytes.slice(0, bytes.length - options.truncate);
  const bounds = cuts.filter((c) => c > 0 && c < bytes.length).concat([bytes.length]);
  let pos = 0;
  let chunk = 0;
  const socket = {
    recv(k) {
      if (pos >= bytes.length) return new Uint8Array(0);
      while (bounds[chunk] <= pos) chunk++;
      const limit = Number.isFinite(k) && k > 0 ? pos + k : Infinity;
      const end = Math.min(bounds[chunk], limit);
      const out = bytes.slice(pos, end);
      pos = end;
      return out;
    },
  };
  const reader = new MessageReader(socket, options.maxSize ?? 1 << 20);
  const show = (s) => (s.length > 32 ? "len:" + s.length + ":" + s.slice(0, 4) + ":" + s.slice(-4) : s);
  const out = [];
  for (let i = 0; i < calls; i++) {
    try {
      const value = reader.readMessage();
      if (value === null || value === undefined) out.push(null);
      else out.push(show(Array.from(value, (b) => String.fromCharCode(b)).join("")));
    } catch (err) {
      out.push("error");
      break;
    }
  }
  return out;
}`,
      tests: [
        { name: "two messages in one recv", input: [["hello", "world"], [], 3, {}], expected: ["hello", "world", null] },
        {
          name: "one byte per recv",
          input: [["hello", "world"], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 3, {}],
          expected: ["hello", "world", null],
        },
        { name: "zero-length messages are not EOF", input: [["", "a", ""], [3, 5, 9], 4, {}], expected: ["", "a", "", null] },
        { name: "header split across reads", input: [["hello", ""], [2, 7], 3, {}], expected: ["hello", "", null] },
        { name: "EOF inside a header", input: [["abc"], [], 1, { truncate: 5 }], expected: ["error"] },
        { name: "EOF inside a payload", input: [["ok", "broken"], [4], 2, { truncate: 3 }], expected: ["ok", "error"] },
        {
          name: "oversized header is rejected before the payload",
          input: [["tiny", "this one is too large"], [], 2, { maxSize: 8 }],
          expected: ["tiny", "error"],
        },
        { name: "payload bytes are not interpreted", input: [["a\nbÿc"], [5], 2, {}], expected: ["a\nbÿc", null] },
        { name: "empty stream, EOF is sticky", input: [[], [], 2, {}], expected: [null, null] },
        {
          name: "a payload larger than one recv",
          input: [[["ab", 3000], "z"], [4096], 3, {}],
          expected: ["len:6000:abab:abab", "z", null],
        },
      ],
    },
  },
];
