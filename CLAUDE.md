# Journey Vault

Digital archive and album tool that preserves and presents travel memories. Fully client-side (v1).

## Project Context

Read the full constitution before any work: `.specify/memory/constitution.md`

## Tech Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui · Framer Motion · IndexedDB · pnpm

## Code Rules

- **TypeScript**: `strict: true`, no `any` without a justifying comment
- **Files**: `kebab-case.ts` / `.tsx`
- **Components**: `PascalCase`, named exports only, server components by default
- **Utilities**: `camelCase`, named exports only
- **Styling**: Tailwind only — no inline styles, no CSS modules. Use `cn()` for conditional classes
- **Imports**: `@/` path alias. Group: external → internal → relative, separated by blank lines
- **Tests**: Co-located (`foo.test.ts` next to `foo.ts`). No feature ships without tests
- **`"use client"`**: Only when state, effects, event handlers, or browser APIs are needed

## Architecture (v1)

- Fully client-side. IndexedDB for persistence. No server-side storage.
- All processing (zip parsing, data handling) in the browser.
- Do not pre-build for v2 server features — keep clean boundaries so they can be added later.

## Project Structure

```
src/app/          — Pages & layouts (App Router)
src/components/   — Shared UI components (ui/ for shadcn primitives)
src/features/     — Feature modules (co-located logic + components + tests)
src/lib/          — Shared utilities, helpers, cn()
src/stores/       — Client-side state, IndexedDB access
src/types/        — Shared TypeScript types
e2e/              — Playwright E2E tests
```

## Workflow

- Use `/product` to write specs, `/design` for UI/UX, `/dev` to implement, `/qa` for tests, `/review` for code review
- Specs live in `.specify/specs/<feature-slug>/`
- Every feature needs defined states (empty, loading, error, success) before implementation
- Small features only — if it can't be reviewed in one sitting, split it
