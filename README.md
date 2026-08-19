# Callback

Interview prep platform for engineers — practice until the phone rings.

Callback covers the whole loop, in the spirit of LeetCode, PracHub, and Interview Query:

- **Software engineering** — algorithms, data structures, frontend, and SQL problems.
- **Broad tech prep** — system design and behavioral practice.
- **Company-specific prep** — loop structures and frequently asked questions per company, plus curated tracks like "Amazon Loop in 2 Weeks".

## Status

Content (problems, companies, tracks) lives in Postgres, accessed through [Drizzle ORM](https://orm.drizzle.team). Canonical seed content is typed data in [`src/lib/seed-data.ts`](src/lib/seed-data.ts), with per-language judge variants in `src/lib/seed-{typescript,python,java,cpp,go}.ts`, synced with `pnpm db:seed`.

Runnable problems have a LeetCode-style workspace in **six languages**, all judged against one shared set of test cases:

| Language | In-browser | Judge0 sandbox |
| --- | --- | --- |
| JavaScript | Web Worker | ✓ |
| TypeScript | types stripped, then judged as JS | ✓ |
| Python | Pyodide (WASM) worker | ✓ |
| Java, C++, Go | — | ✓ (required) |

Everything prefers the Judge0 sandbox when `JUDGE0_URL` is set and falls back to the in-browser runner otherwise. Java, C++, and Go have no browser runtime, so they need `JUDGE0_URL`; the workspace says so rather than failing quietly. Their harnesses live in `src/lib/{java,cpp,go}-harness.ts` and compile the user's code together with a per-problem driver that unpacks the shared JSON test payload.

## Getting started

Requires [pnpm](https://pnpm.io) and a Postgres database (local Homebrew/Postgres.app/Docker, or hosted).

```bash
pnpm install
createdb callback     # if using local Postgres
cp .env.example .env  # set DATABASE_URL for your database
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000. Other scripts: `pnpm build` (production build + type check; needs the database reachable), `pnpm lint`, `pnpm db:generate` (new migration after schema changes), `pnpm db:studio` (data browser).

## Structure

- `src/app` — App Router pages: landing, `/problems`, `/problems/[slug]`, `/companies`, `/companies/[slug]`, `/tracks`, `/tracks/[slug]`.
- `src/lib/types.ts` — domain model: `Problem`, `Company`, `Track`, categories, difficulty.
- `src/lib/data.ts` — async accessor functions every page reads through (Drizzle queries).
- `src/lib/seed-data.ts` — canonical typed content, loaded into Postgres by `pnpm db:seed`.
- `src/lib/seed-<language>.ts` — per-language starters and judge drivers, merged into each problem's judge at seed time.
- `src/db` — Drizzle schema, client, and seed script; SQL migrations live in `drizzle/`.
- `src/components` — shared UI (nav, problem rows, badges, editor workspace).

## Roadmap

- [x] In-browser code editor for algorithm problems (CodeMirror, with autocomplete; six languages, client-side or Judge0)
- [x] Database + ORM (Postgres + Drizzle; content served from the DB)
- [x] Auth and user accounts (Better Auth: email/password + optional Google OAuth via `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`)
- [x] Progress tracking (judge runs auto-record attempted/solved; manual mark-done elsewhere)
- [x] Whiteboard on system-design problems (Excalidraw; sketches persist per problem)
- [x] Account-backed saving of code and sketches (localStorage always; synced to Postgres when signed in, newest wins)
- [ ] Hidden test cases and a real Run/Submit split
- [ ] Submission history and spaced repetition
- [ ] Richer problem content (solutions, complexity discussion, editor-quality markdown)
- [ ] Company data pipeline (question frequency, recency)
- [ ] Mock interview mode (timed sessions, rubric scoring)
