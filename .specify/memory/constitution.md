# Journey Vault — Project Constitution

## What Is This?

Journey Vault is a digital archive and album tool that preserves and beautifully presents travel memories. It imports travel data exports and transforms them into a browsable, visually rich personal travel archive.

## Target Users

Digital memory keepers who want to own their travel memories long-term — independent of any platform's continued existence.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Animation | Framer Motion |
| Unit/Integration Testing | Vitest + React Testing Library |
| E2E Testing | Playwright |
| Package Manager | pnpm |
| Persistence | IndexedDB (client-side only) |

## Architecture

### v1 — Fully Client-Side

- No server-side database or file storage.
- All processing (zip parsing, image handling, data transformation) happens in the browser.
- IndexedDB is the single persistence layer.
- The app is a static export / SPA in terms of data — Next.js provides routing and SSG structure only.
- Server components are the default; `"use client"` only when state, effects, or browser APIs are needed.

### v2+ (Future)

- Server-side storage and sync may be introduced. Do not pre-build for this — design clean boundaries so it can be added later without rewriting v1.

## Core Principles

### 1. UI/UX First

- Visual polish is a **shipping requirement**, not a nice-to-have.
- Every feature needs defined user flows and states (empty, loading, error, success) before code is written.
- Framer Motion for meaningful animations — always respect `prefers-reduced-motion`.
- Photos and content are the heroes, not the chrome. UI should recede and let memories shine.

### 2. Small Features, Always

- Every feature must fit in a single, focused spec.
- If it feels big, split it. Each deliverable should be reviewable in one sitting.
- Small diff, small context. Acceptance criteria countable on one hand.
- Scope creep is the enemy.

### 3. No Over-Engineering

- Build for today's requirements, not hypothetical futures.
- No premature abstractions. Three similar lines > a clever helper used once.
- No feature flags or backwards-compatibility shims — just change the code.
- Delete dead code; don't comment it out.

## Code Standards

### Naming & Files

- **Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Components**: `PascalCase`
- **Utilities / functions / variables**: `camelCase`
- **Exports**: Named exports only (no default exports)
- **Tests**: Co-located — `foo.test.ts` next to `foo.ts`

### TypeScript

- `strict: true` in tsconfig. No exceptions.
- No `any` without a justifying comment.
- Prefer `interface` for object shapes, `type` for unions/intersections.

### Styling

- Tailwind CSS only. No inline styles, no CSS modules, no styled-components.
- Use `cn()` (from `lib/utils`) for conditional class composition.
- Design tokens and theming via Tailwind config / CSS variables.

### Components

- Server components by default.
- `"use client"` only when the component uses state, effects, event handlers, or browser APIs.
- shadcn/ui as the base — customize via Tailwind, don't fork internals.

### Imports

- Use path aliases (`@/` mapped to project root).
- Group imports: external libs → internal modules → relative imports, separated by blank lines.

## Testing

- **No feature ships without tests.**
- Vitest + React Testing Library for unit and integration tests.
- Playwright for E2E / critical user flows.
- Test **behavior**, not implementation details.
- Mock at the boundary (IndexedDB, file system, network) — not internal modules.
- Descriptive test names: `it("shows an error message when the zip file is corrupted")`.

## Project Structure (Planned)

```
vault/
├── src/
│   ├── app/              # Next.js App Router pages & layouts
│   ├── components/       # Shared UI components
│   │   └── ui/           # shadcn/ui primitives
│   ├── features/         # Feature modules (co-located logic + components + tests)
│   ├── lib/              # Shared utilities, helpers, cn()
│   ├── stores/           # Client-side state (IndexedDB access, context)
│   └── types/            # Shared TypeScript types
├── public/               # Static assets
├── e2e/                  # Playwright E2E tests
├── data/                 # Local data exports (gitignored in prod)
├── .specify/             # Spec system memory
└── .claude/              # Claude Code config
```

## Terminology

This app imports data from a third-party travel app but is **not affiliated with or endorsed by any travel platform**. To avoid trademark issues:

- **Never** use the word "Polarsteps" or "polar steps" anywhere in the codebase — not in UI text, code, comments, types, file names, or docs.
- **Never** use "step" to refer to a location/stop within a trip. Use **"chapter"** instead (e.g., `Chapter`, `chapterId`, `chapterCount`, "3 chapters").
- "step" is acceptable only in its generic programming sense (e.g., "next step in the process").
- The app name is **Journey Vault**. The IndexedDB database is `journey-vault`. The npm package is `journey-vault`.
- Refer to imported data generically: "travel export", "travel data", "your travel app" — never name the source platform.

## Hard Constraints

1. **No server-side storage in v1.** Everything runs and persists in the browser.
2. **No `any` without justification.** TypeScript strict is non-negotiable.
3. **No feature without tests.** Coverage is not optional.
4. **No styling outside Tailwind.** No inline styles, no CSS-in-JS.
5. **No large PRs.** If a spec can't be reviewed in one sitting, break it down.
6. **Accessibility matters.** Respect `prefers-reduced-motion`, use semantic HTML, ensure keyboard navigation.
