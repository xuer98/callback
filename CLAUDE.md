# Callback

Tech-interview prep platform (think LeetCode / PracHub / Interview Query): coding, system design, behavioral, and company-specific prep. Brand voice: "get the callback" — the nav logo renders as `call(back)`.

## Stack

- Next.js 16 (App Router, TypeScript, `src/` layout, `@/*` alias)
- pnpm (pinned via `packageManager`; postinstall scripts for esbuild/unrs-resolver are blocked by pnpm 10 defaults and not needed — their prebuilt binaries are used)
- Tailwind CSS v4 (CSS-first config in `src/app/globals.css`; dark-only theme, zinc neutrals + indigo accent)
- ESLint 9 flat config (`pnpm lint`)
- CodeMirror 6 (`@uiw/react-codemirror`, oneDark theme) for the in-browser editor
- Postgres + Drizzle ORM (`node-postgres` driver). Content is served from the DB; `src/lib/seed-data.ts` is the canonical content source, synced via `pnpm db:seed` (idempotent upserts). `DATABASE_URL` comes from `.env`.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build; also the type check. Run before finishing any work. Needs the database reachable (prerender queries the DB).
- `pnpm lint`
- `pnpm db:generate` — emit a SQL migration after editing `src/db/schema.ts`
- `pnpm db:migrate` — apply migrations
- `pnpm db:seed` — sync `seed-data.ts` into the DB (run after any content edit)
- `pnpm db:studio` — Drizzle Studio data browser

## Structure

- `src/app` — routes: `/` landing, `/problems` (+ `[slug]`), `/companies` (+ `[slug]`), `/tracks` (+ `[slug]`). Detail pages are statically generated via `generateStaticParams`; `/problems` reads `searchParams` for category filtering.
- `src/lib/types.ts` — domain model: `Problem`, `Company`, `Track`, `Category`, `Difficulty`, plus `CATEGORY_LABELS`.
- `src/lib/data.ts` — async, `server-only` accessors (`getProblem`, `problemsForCompany`, `trackProblems`, …) mapping Drizzle rows to the domain types. The single content read path.
- `src/lib/seed-data.ts` — canonical content arrays (problems/companies/tracks with judges).
- `src/db/schema.ts` — Drizzle tables: `problems`, `companies`, `tracks`, join tables `problem_companies` and ordered `track_problems`; `hints`/`process`/`judge` are JSONB. `src/db/index.ts` is the pooled client; `src/db/seed.ts` the seeder; `drizzle/` holds SQL migrations.
- `src/lib/run-judge.ts` — client-side judge: runs user JS in a Web Worker (4s limit), deep-equal compare, per-case verdicts.
- `src/components` — shared UI: `Nav`, `ProblemRow`, `DifficultyBadge`, `Workspace` (client component: editor + run + results).

## Conventions

- Server components by default; add `"use client"` only when interactivity requires it.
- All content reads go through the accessors in `src/lib/data.ts` — keep that the single read path. Content edits go in `seed-data.ts`, then `pnpm db:seed`; schema changes go in `src/db/schema.ts`, then `db:generate` + `db:migrate`.
- Content pages use `revalidate = 300` (ISR), so DB content updates appear without a rebuild in production.
- App Router style: `params` and `searchParams` are Promises — await them.
- Company/problem/track cross-references are by slug; `trackProblems` filters out dangling slugs.
- Problem prompts are mostly plain text split into paragraphs on blank lines, but ``` fenced blocks render preformatted (used for worked examples with meaningful whitespace). No other markdown is supported.
- To make a problem runnable, add a `judge` block to it in `seed-data.ts`: `starterCode`, `entry` (function the runner calls), `tests` (JSON-serializable `input` args + `expected`), and optional `driverCode` for class-based problems (defines the entry function that drives the user's class — see lru-cache). Results are deep-equal compared, so craft test inputs with exactly one correct answer. User code is saved per-problem in localStorage (`callback:code:<slug>`).

## Open decisions (not made yet — ask before assuming)

- Auth provider, payments/monetization.
- Server-side code execution (more languages, hidden tests) — the current judge is client-side JavaScript only.
- Production database hosting (local Postgres only so far).
