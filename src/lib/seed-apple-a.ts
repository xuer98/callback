import type { Problem } from "./types";

// Apple phone-screen bank, part A. Sourced from candidate reports of Apple
// technical phone screens (1point3acres, LeetCode Discuss, Blind, Glassdoor)
// collected for the AIML Evaluation role; prompts keep the reported wording
// and the screen's habit of adding a requirement once the first version
// works. Continues in seed-apple-b.ts onward; Python variants live in
// seed-python-apple.ts.

export const appleProblemsA: Problem[] = [
  {
    slug: "access-log-metrics",
    title: "Access-Log Request Metrics",
    category: "algorithms",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Parse, validate, count — and pick the right denominator for the failure rate.",
    prompt: [
      "Given a list of HTTP access-log lines, each meant to hold an IP address, a timestamp, a URL path and a status code: parse each line, decide whether it is a valid log, and report the number of 4xx and 5xx responses, the failure percentage, and the total request count.",
      "",
      "A line is four fields separated by single spaces:",
      "",
      "```",
      "10.0.0.7 2026-03-01T12:00:00Z /api/users 200",
      "```",
      "",
      "It is **valid** only when every field checks out:",
      "",
      "- the IP is four dotted decimal octets, each `0`–`255` with no leading zeros (`01.1.1.1` is invalid);",
      "- the timestamp is `YYYY-MM-DDTHH:MM:SSZ` and names a real calendar date and time (`2023-02-29` and hour `24` are invalid);",
      "- the path starts with `/`;",
      "- the status is exactly three digits in `100`–`599`.",
      "",
      "Anything else is **malformed**: counted in the total, excluded from every other number.",
      "",
      "Return a report:",
      "",
      "```",
      "{",
      "  totalLines, valid, malformed,",
      "  count4xx, count5xx,",
      "  failurePct,   // (count4xx + count5xx) / valid * 100, rounded to 2 decimals; 0 when nothing is valid",
      "  endpoints     // [[path, hits, failures], ...] over valid lines,",
      "                // sorted by failures desc, then hits desc, then path asc",
      "}",
      "```",
      "",
      "A 3xx is not a failure. `failurePct` is computed over **valid** lines, not all lines.",
      "",
      "## Follow-up",
      "",
      "The file is 200 GB. Structure the code so it streams: one pass, nothing retained per line, state proportional to the number of distinct endpoints. Be ready to say what `merge()` of two partial reports would look like.",
      "",
      "## Worth asking out loud",
      "",
      "What counts as invalid? Is the denominator for the failure rate all lines or valid lines? Do you want per-endpoint numbers now or later? Can I assume one pass over the input?",
    ].join("\n"),
    hints: [
      "Validate with one anchored pattern for the shape — four single-space fields, a three-digit status — then check each field's semantics separately. Leading zeros, octets over 255, impossible dates and a status outside 100–599 are the cases interviewers test.",
      "Keep counters, not lines: total, valid, 4xx, 5xx and a map from path to [hits, failures]. The report is derived at the end, and the division must guard against zero valid lines.",
    ],
    solution: [
      "## Approach",
      "",
      "This is the job itself: parse records, compute a metric, defend the edge cases. Match the line shape with one anchored pattern (`^(\\S+) (\\S+) (\\S+) (\\d{3})$`), then validate each field on its own — the IP by splitting into four octets that match `0|[1-9]\\d{0,2}` and fit in 255, the timestamp by shape plus a real-calendar check with leap years, the path by its leading slash, the status by range. Every valid line bumps a handful of counters and a per-path `[hits, failures]` pair; nothing else is retained, so memory is flat in the number of lines.",
      "",
      "The report is derived once at the end. The denominator for the failure percentage is the valid count, and it is guarded so that zero valid lines yields 0 rather than a division error. Endpoints come out sorted by failures, hits, then path so the ranking is deterministic.",
      "",
      "## Complexity",
      "",
      "O(n) over the lines with O(1) work per line; O(d) space for d distinct endpoints, plus O(d log d) to rank them once.",
      "",
      "## Worth saying out loud",
      "",
      "- **200 GB file?** Already handled: the loop holds no history. Add a `merge()` that sums two reports' counters and endpoint maps and you have the map-reduce version for free.",
      "- **p99 latency next?** Counters no longer suffice; that is a quantile sketch or a bounded histogram — the streaming-median problem.",
      "- **Per-endpoint error rates, worst first?** The endpoint map is already there; ranking it is a top-k over a counter.",
      "- **Traps:** leading zeros in an octet are invalid; a 3xx is not a failure; the failure rate must not divide by zero.",
    ].join("\n"),
    judge: {
      solutionCode: `const LINE = /^(\\S+) (\\S+) (\\S+) (\\d{3})$/;
const OCTET = /^(0|[1-9]\\d{0,2})$/;
const STAMP = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})Z$/;

function validIp(s) {
  const parts = s.split(".");
  return parts.length === 4 && parts.every((p) => OCTET.test(p) && Number(p) <= 255);
}

function validTimestamp(s) {
  const m = STAMP.exec(s);
  if (!m) return false;
  const [y, mo, d, h, mi, sec] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || h > 23 || mi > 59 || sec > 59) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
  return d >= 1 && d <= days;
}

// Streaming: one pass, counters only, state proportional to distinct endpoints.
function logMetrics(lines) {
  let total = 0, valid = 0, count4xx = 0, count5xx = 0;
  const perEndpoint = new Map(); // path -> [hits, failures]
  for (const line of lines) {
    total++;
    const m = LINE.exec(line);
    if (!m) continue;
    const [, ip, stamp, path, code] = m;
    const status = Number(code);
    if (!validIp(ip) || !validTimestamp(stamp) || !path.startsWith("/") || status < 100 || status > 599) continue;
    valid++;
    const entry = perEndpoint.get(path) ?? [0, 0];
    entry[0]++;
    if (status >= 400) entry[1]++;
    if (status >= 400 && status < 500) count4xx++;
    else if (status >= 500) count5xx++;
    perEndpoint.set(path, entry);
  }
  const failures = count4xx + count5xx;
  const endpoints = [...perEndpoint]
    .map(([path, [hits, fails]]) => [path, hits, fails])
    .sort((a, b) => b[2] - a[2] || b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return {
    totalLines: total,
    valid,
    malformed: total - valid,
    count4xx,
    count5xx,
    failurePct: valid ? Math.round((failures / valid) * 10000) / 100 : 0,
    endpoints,
  };
}
`,
      starterCode: `/**
 * @param {string[]} lines
 * @returns {{ totalLines: number, valid: number, malformed: number,
 *             count4xx: number, count5xx: number, failurePct: number,
 *             endpoints: [string, number, number][] }}
 */
function logMetrics(lines) {
  // Your code here
  return {
    totalLines: 0,
    valid: 0,
    malformed: 0,
    count4xx: 0,
    count5xx: 0,
    failurePct: 0,
    endpoints: [],
  };
}
`,
      entry: "logMetrics",
      tests: [
        {
          name: "Mixed statuses across three endpoints",
          input: [
            [
              "10.0.0.1 2026-03-01T12:00:00Z /api/users 200",
              "10.0.0.2 2026-03-01T12:00:01Z /api/users 404",
              "10.0.0.3 2026-03-01T12:00:02Z /api/orders 500",
              "10.0.0.4 2026-03-01T12:00:03Z /api/orders 503",
              "10.0.0.5 2026-03-01T12:00:04Z /health 301",
            ],
          ],
          expected: {
            totalLines: 5,
            valid: 5,
            malformed: 0,
            count4xx: 1,
            count5xx: 2,
            failurePct: 60,
            endpoints: [["/api/orders", 2, 2], ["/api/users", 2, 1], ["/health", 1, 0]],
          },
        },
        {
          name: "Malformed lines count toward the total only",
          input: [
            [
              "10.0.0.1 2026-03-01T12:00:00Z /api 200",
              "garbage line",
              "10.0.0.1 2026-03-01T12:00:00Z /api",
              "10.0.0.1 2026-03-01T12:00:00Z /api 404",
            ],
          ],
          expected: {
            totalLines: 4,
            valid: 2,
            malformed: 2,
            count4xx: 1,
            count5xx: 0,
            failurePct: 50,
            endpoints: [["/api", 2, 1]],
          },
        },
        {
          name: "IP validation: leading zeros, out-of-range and short addresses",
          input: [
            [
              "01.1.1.1 2026-01-01T00:00:00Z /a 200",
              "256.1.1.1 2026-01-01T00:00:00Z /a 200",
              "1.1.1 2026-01-01T00:00:00Z /a 200",
              "0.0.0.0 2026-01-01T00:00:00Z /a 200",
              "255.255.255.255 2026-01-01T00:00:00Z /a 500",
            ],
          ],
          expected: {
            totalLines: 5,
            valid: 2,
            malformed: 3,
            count4xx: 0,
            count5xx: 1,
            failurePct: 50,
            endpoints: [["/a", 2, 1]],
          },
        },
        {
          name: "Timestamp validation: leap day, bad month, bad day, hour 24, missing Z",
          input: [
            [
              "1.1.1.1 2024-02-29T23:59:59Z /a 200",
              "1.1.1.1 2023-02-29T00:00:00Z /a 200",
              "1.1.1.1 2026-13-01T00:00:00Z /a 200",
              "1.1.1.1 2026-06-31T00:00:00Z /a 200",
              "1.1.1.1 2026-06-30T24:00:00Z /a 200",
              "1.1.1.1 2026-06-30T12:00:00 /a 200",
            ],
          ],
          expected: {
            totalLines: 6,
            valid: 1,
            malformed: 5,
            count4xx: 0,
            count5xx: 0,
            failurePct: 0,
            endpoints: [["/a", 1, 0]],
          },
        },
        {
          name: "Status and path validation; a 3xx is not a failure",
          input: [
            [
              "1.1.1.1 2026-01-01T00:00:00Z api 200",
              "1.1.1.1 2026-01-01T00:00:00Z /api 99",
              "1.1.1.1 2026-01-01T00:00:00Z /api 600",
              "1.1.1.1 2026-01-01T00:00:00Z /api 099",
              "1.1.1.1 2026-01-01T00:00:00Z /api 302",
              "1.1.1.1 2026-01-01T00:00:00Z /api 499",
              "1.1.1.1 2026-01-01T00:00:00Z /api 599",
            ],
          ],
          expected: {
            totalLines: 7,
            valid: 3,
            malformed: 4,
            count4xx: 1,
            count5xx: 1,
            failurePct: 66.67,
            endpoints: [["/api", 3, 2]],
          },
        },
        {
          name: "No valid lines must not divide by zero",
          input: [["nope", ""]],
          expected: {
            totalLines: 2,
            valid: 0,
            malformed: 2,
            count4xx: 0,
            count5xx: 0,
            failurePct: 0,
            endpoints: [],
          },
        },
        {
          name: "Empty input",
          input: [[]],
          expected: {
            totalLines: 0,
            valid: 0,
            malformed: 0,
            count4xx: 0,
            count5xx: 0,
            failurePct: 0,
            endpoints: [],
          },
        },
        {
          name: "Endpoint ranking: failures desc, hits desc, then path",
          input: [
            [
              "1.1.1.1 2026-01-01T00:00:00Z /b 500",
              "1.1.1.1 2026-01-01T00:00:00Z /a 500",
              "1.1.1.1 2026-01-01T00:00:00Z /a 200",
              "1.1.1.1 2026-01-01T00:00:00Z /c 200",
              "1.1.1.1 2026-01-01T00:00:00Z /c 200",
              "1.1.1.1 2026-01-01T00:00:00Z /d 200",
            ],
          ],
          expected: {
            totalLines: 6,
            valid: 6,
            malformed: 0,
            count4xx: 0,
            count5xx: 2,
            failurePct: 33.33,
            endpoints: [["/a", 2, 1], ["/b", 1, 1], ["/c", 2, 0], ["/d", 1, 0]],
          },
        },
      ],
    },
  },
];
