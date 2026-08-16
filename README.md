# Callback

Interview prep platform for engineers — practice until the phone rings.

Callback covers the whole loop, in the spirit of LeetCode, PracHub, and Interview Query:

- **Software engineering** — algorithms, data structures, frontend, and SQL problems.
- **Broad tech prep** — system design and behavioral practice.
- **Company-specific prep** — loop structures and frequently asked questions per company, plus curated tracks like "Amazon Loop in 2 Weeks".

## Status

Content (problems, companies, tracks) lives in Postgres, accessed through [Drizzle ORM](https://orm.drizzle.team) — no auth or submissions yet. Canonical seed content is typed data in [`src/lib/seed-data.ts`](src/lib/seed-data.ts), synced with `npm run db:seed`. Algorithm problems have an in-browser editor: user JavaScript runs client-side in a Web Worker against sample test cases, so there is no server-side sandbox to operate yet.

## Getting started

Requires a local Postgres (Homebrew, Postgres.app, or Docker).

```bash
npm install
createdb callback
cp .env.example .env   # adjust DATABASE_URL if your Postgres needs credentials
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. Other scripts: `npm run build` (production build + type check; needs the database running), `npm run lint`, `npm run db:generate` (new migration after schema changes), `npm run db:studio` (data browser).

## Structure

- `src/app` — App Router pages: landing, `/problems`, `/problems/[slug]`, `/companies`, `/companies/[slug]`, `/tracks`, `/tracks/[slug]`.
- `src/lib/types.ts` — domain model: `Problem`, `Company`, `Track`, categories, difficulty.
- `src/lib/data.ts` — async accessor functions every page reads through (Drizzle queries).
- `src/lib/seed-data.ts` — canonical typed content, loaded into Postgres by `npm run db:seed`.
- `src/db` — Drizzle schema, client, and seed script; SQL migrations live in `drizzle/`.
- `src/components` — shared UI (nav, problem rows, badges, editor workspace).

## Roadmap

- [x] In-browser code editor for algorithm problems (CodeMirror + Web Worker judge, JavaScript only)
- [x] Database + ORM (Postgres + Drizzle; content served from the DB)
- [ ] Auth and user accounts
- [ ] Server-side code execution (more languages, hidden tests, resource limits)
- [ ] Submissions, progress tracking, and spaced repetition
- [ ] Richer problem content (solutions, complexity discussion, editor-quality markdown)
- [ ] Company data pipeline (question frequency, recency)
- [ ] Mock interview mode (timed sessions, rubric scoring)
