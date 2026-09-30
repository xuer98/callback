import type { Problem } from "./types";

// Apple coding bank, part Q: the newline-delimited socket line reader. Python
// variant in seed-python-apple-e.ts.

export const appleProblemsQ: Problem[] = [
  {
    slug: "socket-line-reader",
    title: "Socket Line Reader",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary: "Buffer bytes across recv calls, split on newlines, and decode only whole lines.",
    prompt: [
      "You are given a connected TCP socket. `socket.recv(k)` returns **at most** `k` bytes — possibly fewer, possibly just one — and returns an empty result once the peer has closed the connection (EOF). A line can arrive split across many `recv` calls, and one `recv` can contain several lines.",
      "",
      "Build `LineReader(socket)` on top of it, keeping an internal buffer between calls. `readLine()` returns the next line as text, decoded as UTF-8, **without** its `\\n`. Empty lines are preserved, a `\\r` before the newline is kept as data, a final line with no trailing newline is still returned, and after that every call returns `null`.",
      "",
      "```",
      "stream: \"a\\nbb\\n\\nccc\"                     readLine() -> \"a\", \"bb\", \"\", \"ccc\", null",
      "```",
      "",
      "The harness feeds your reader from a fake socket that fragments the stream at chosen offsets — sometimes in the middle of a multi-byte character — calls `readLine` a fixed number of times, and records each result. Results longer than 32 characters are shown as `len:N:head:tail`.",
    ].join("\n"),
    hints: [
      "Loop: search the buffer for a newline; if there is none, call recv and append; when recv returns nothing, return whatever is left as the final line, then null forever.",
      "Keep it linear: remember how far you already searched, so a long line arriving in small pieces is scanned once. Decode only once a full line is in hand, so a character split across two reads is never decoded in halves.",
    ],
    solution: [
      "## Approach",
      "",
      "TCP delivers a byte stream, so lines have to be cut out of a buffer that survives between calls. `fill()` performs one `recv`, appends what it got, and remembers EOF. `readLine` searches the buffer for byte 10, remembering how far the previous search got so a long line arriving in small pieces is scanned once, not once per piece. On a hit, take the bytes before it, drop the newline, decode, return. On EOF, return whatever remains as the final line, then `null`.",
      "",
      "Decoding only complete lines is what makes split UTF-8 characters safe: byte 10 never occurs inside a multi-byte sequence, so a line boundary can never cut a character in half.",
      "",
      "## Complexity",
      "",
      "O(n) total over n stream bytes — each byte is appended once, scanned once and copied out once; O(longest line) buffer space.",
      "",
      "## Worth saying out loud",
      "",
      "- **Tests to list:** one byte per recv; several lines in one recv; a final line without a newline; consecutive newlines; a multi-byte character split across reads.",
      "- **A line-length limit** belongs on the reader — an endless line is a memory attack.",
      "- **`\\r\\n`?** Kept as data here; a protocol that uses CRLF strips the `\\r` after splitting, never before.",
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

class LineReader extends BufferedSocket {
  constructor(socket) {
    super(socket);
    this.scanned = 0; // bytes already searched for a newline
    this.decoder = new TextDecoder();
  }

  readLine() {
    const buffer = this.buffer;
    for (;;) {
      const at = buffer.indexOf(10, this.scanned);
      if (at !== -1) {
        const line = buffer.take(at);
        buffer.take(1); // the newline itself
        this.scanned = 0;
        return this.decoder.decode(line);
      }
      this.scanned = buffer.length;
      if (!this.fill()) {
        this.scanned = 0;
        if (buffer.length === 0) return null;
        return this.decoder.decode(buffer.take(buffer.length)); // final unterminated line
      }
    }
  }
}
`,
      starterCode: `class LineReader {
  /** @param {{ recv(k: number): Uint8Array }} socket recv returns at most k bytes; length 0 means EOF */
  constructor(socket) {
    this.socket = socket;
  }

  /** @returns {string|null} the next line without its newline (UTF-8); null once the stream is exhausted */
  readLine() {
    // Your code here
    return null;
  }
}
`,
      entry: "__judgeLines",
      // pieces: strings or [unit, times] pairs, joined and UTF-8 encoded.
      // cuts: offsets the fake socket never reads across.
      driverCode: `function __judgeLines(pieces, cuts, calls) {
  const options = {};
  const expand = (piece) => (Array.isArray(piece) ? piece[0].repeat(piece[1]) : piece);
  let bytes = new TextEncoder().encode(pieces.map(expand).join(""));
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
  const reader = new LineReader(socket);
  const show = (s) => (s.length > 32 ? "len:" + s.length + ":" + s.slice(0, 4) + ":" + s.slice(-4) : s);
  const out = [];
  for (let i = 0; i < calls; i++) {
    try {
      const value = reader.readLine();
      out.push(value === null || value === undefined ? null : show(String(value)));
    } catch (err) {
      out.push("error");
      break;
    }
  }
  return out;
}`,
      tests: [
        { name: "several lines in one recv", input: [["a\nbb\n\nccc"], [], 5], expected: ["a", "bb", "", "ccc", null] },
        { name: "one byte per recv", input: [["a\nbb\n\nccc"], [1, 2, 3, 4, 5, 6, 7, 8], 5], expected: ["a", "bb", "", "ccc", null] },
        { name: "a UTF-8 character split across reads", input: [["héllo\nwörld\n"], [2, 9], 3], expected: ["héllo", "wörld", null] },
        { name: "final line without a newline", input: [["no newline at all"], [3, 10], 2], expected: ["no newline at all", null] },
        { name: "only newlines", input: [["\n\n"], [1], 3], expected: ["", "", null] },
        { name: "carriage return is data", input: [["a\r\nb"], [], 3], expected: ["a\r", "b", null] },
        { name: "empty stream, EOF is sticky", input: [[], [], 2], expected: [null, null] },
        {
          name: "a long line arriving in pieces",
          input: [[["ab", 3000], "\ntail"], [100, 2000, 4096, 5999], 3],
          expected: ["len:6000:abab:abab", "tail", null],
        },
      ],
    },
  },
];
