# Callback

Interview prep platform for engineers — practice until the phone rings.

Callback covers the whole loop, in the spirit of LeetCode, PracHub, and Interview Query:

- **Software engineering** — algorithms, data structures, frontend, and SQL problems.
- **Broad tech prep** — system design and behavioral practice.
- **Company-specific prep** — loop structures and frequently asked questions per company, plus curated tracks like "Amazon Loop in 2 Weeks".

## Status

Content (problems, companies, tracks) lives in Postgres, accessed through [Drizzle ORM](https://orm.drizzle.team). Canonical seed content is typed data in [`src/lib/seed-data.ts`](src/lib/seed-data.ts) (Python judge variants in [`src/lib/seed-python.ts`](src/lib/seed-python.ts)), synced with `pnpm db:seed`. Runnable problems have a LeetCode-style workspace in JavaScript and Python: JS runs client-side in a Web Worker, Python in a Pyodide (WASM) worker, and both prefer a Judge0 server sandbox when `JUDGE0_URL` is configured.

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
- `src/lib/seed-data.ts` — canonical typed content, loaded into Postgres by `npm run db:seed`.
- `src/db` — Drizzle schema, client, and seed script; SQL migrations live in `drizzle/`.
- `src/components` — shared UI (nav, problem rows, badges, editor workspace).

## Roadmap

- [x] In-browser code editor for algorithm problems (CodeMirror; JavaScript + Python judges, client-side or Judge0)
- [x] Database + ORM (Postgres + Drizzle; content served from the DB)
- [x] Auth and user accounts (Better Auth: email/password + optional Google OAuth via `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`)
- [x] Progress tracking (judge runs auto-record attempted/solved; manual mark-done elsewhere)
- [ ] Server-side code execution (more languages, hidden tests, resource limits)
- [ ] Submission history and spaced repetition
- [ ] Richer problem content (solutions, complexity discussion, editor-quality markdown)
- [ ] Company data pipeline (question frequency, recency)
- [ ] Mock interview mode (timed sessions, rubric scoring)
