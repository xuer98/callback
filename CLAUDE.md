# Callback

Tech-interview prep platform (think LeetCode / PracHub / Interview Query): coding, system design, behavioral, and company-specific prep. Brand voice: "get the callback" — the nav logo renders as `call(back)`.

## Stack

- Next.js 16 (App Router, TypeScript, `src/` layout, `@/*` alias)
- Tailwind CSS v4 (CSS-first config in `src/app/globals.css`; dark-only theme, zinc neutrals + indigo accent)
- ESLint 9 flat config (`npm run lint`)
- No database yet — all content is typed seed data in `src/lib/data.ts`.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build; also the type check. Run before finishing any work.
- `npm run lint`

## Structure

- `src/app` — routes: `/` landing, `/problems` (+ `[slug]`), `/companies` (+ `[slug]`), `/tracks` (+ `[slug]`). Detail pages are statically generated via `generateStaticParams`; `/problems` reads `searchParams` for category filtering.
- `src/lib/types.ts` — domain model: `Problem`, `Company`, `Track`, `Category`, `Difficulty`, plus `CATEGORY_LABELS`.
- `src/lib/data.ts` — seed content + accessors (`getProblem`, `problemsForCompany`, `trackProblems`, …).
- `src/components` — shared UI: `Nav`, `ProblemRow`, `DifficultyBadge`.

## Conventions

- Server components by default; add `"use client"` only when interactivity requires it.
- All content reads go through the accessors in `src/lib/data.ts` — keep that the single read path so swapping in a database stays cheap.
- App Router style: `params` and `searchParams` are Promises — await them.
- Company/problem/track cross-references are by slug; `trackProblems` filters out dangling slugs.

## Open decisions (not made yet — ask before assuming)

- Database & ORM, auth provider, code-execution sandbox for submissions, payments/monetization.
