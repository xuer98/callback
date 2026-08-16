# Callback

Interview prep platform for engineers — practice until the phone rings.

Callback covers the whole loop, in the spirit of LeetCode, PracHub, and Interview Query:

- **Software engineering** — algorithms, data structures, frontend, and SQL problems.
- **Broad tech prep** — system design and behavioral practice.
- **Company-specific prep** — loop structures and frequently asked questions per company, plus curated tracks like "Amazon Loop in 2 Weeks".

## Status

v0 scaffold. All content is typed seed data in [`src/lib/data.ts`](src/lib/data.ts) — no database, auth, or submissions yet. The routes, domain model, and page shells are real; the product decisions that need infrastructure are listed in the roadmap.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Other scripts: `npm run build` (production build + type check), `npm run lint`.

## Structure

- `src/app` — App Router pages: landing, `/problems`, `/problems/[slug]`, `/companies`, `/companies/[slug]`, `/tracks`, `/tracks/[slug]`.
- `src/lib/types.ts` — domain model: `Problem`, `Company`, `Track`, categories, difficulty.
- `src/lib/data.ts` — seed content and the accessor functions every page reads through.
- `src/components` — shared UI (nav, problem rows, badges).

## Roadmap

- [ ] Database + ORM (move content out of `data.ts`)
- [ ] Auth and user accounts
- [ ] In-browser code editor and execution sandbox for coding problems
- [ ] Submissions, progress tracking, and spaced repetition
- [ ] Richer problem content (solutions, complexity discussion, editor-quality markdown)
- [ ] Company data pipeline (question frequency, recency)
- [ ] Mock interview mode (timed sessions, rubric scoring)
