# 04 — Trip Detail View: Implementation Plan

## Architecture

### How it fits into the existing system

This feature adds a new **page route** (`/trip/[slug]`) and a new **feature module** (`src/features/trip-detail/`). It reads existing data from IndexedDB (trips, chapters) and OPFS (cover photo) using the stores already in place (`src/stores/db.ts`, `src/stores/photo-storage.ts`).

The trip list on the home page (`TripList` component) currently handles trip clicks inline by showing an `ImportSummary` in "viewing" mode. This must be changed so clicking a trip card **navigates** to `/trip/[slug]` instead.

Key integration points:
- **IndexedDB**: needs a new `getTripBySlug(slug)` query (the DB currently only has `getTrip(id)` and `getAllTrips()`)
- **OPFS photo storage**: uses existing `readPhoto(tripId, chapterId, filename)` — no changes needed
- **Routing**: new dynamic route at `src/app/trip/[slug]/page.tsx`
- **Utilities**: uses existing `formatDateRange` from `src/lib/format-date.ts`; needs a new `formatDate` helper for single chapter dates
- **Design tokens**: uses existing Tailwind theme (warm palette, border, accent, muted-foreground, etc.)

### No new state management

The page is read-only. Data is fetched from IndexedDB on mount. No global state or context is needed — local component state (`useState`/`useEffect`) is sufficient, following the same pattern as `ImportFlow`.

## Data Model

### No new types or stores

All data structures already exist:
- `Trip` (id, name, slug, startDate, endDate, summary, coverPhotoId, chapterCount, photoCount, totalKm)
- `Chapter` (id, tripId, displayName, description, slug, startTime, endTime, location, weatherCondition, weatherTemperature)
- `Photo` (id, tripId, chapterId, filename)

### New DB query: `getTripBySlug`

A new function in `src/stores/db.ts` that iterates all trips and finds the one matching the slug. Since the trips store doesn't have a slug index and the total trip count is small (tens at most), a full scan via `getAllTrips()` + `.find()` is acceptable.

```ts
export async function getTripBySlug(slug: string): Promise<Trip | undefined> {
  const trips = await getAllTrips()
  return trips.find((t) => t.slug === slug)
}
```

### Cover photo ID decomposition

The `coverPhotoId` is a composite key: `{tripId}-{chapterId}-{filename}`. Since filenames may contain hyphens, split on the **first two hyphens only**:

```ts
function decomposeCoverPhotoId(id: string): { tripId: number; chapterId: number; filename: string } {
  const first = id.indexOf("-")
  const second = id.indexOf("-", first + 1)
  return {
    tripId: Number(id.slice(0, first)),
    chapterId: Number(id.slice(first + 1, second)),
    filename: id.slice(second + 1),
  }
}
```

This utility lives in the trip-detail feature module.

## Implementation Steps

### Step 1: Add `getTripBySlug` to the DB store

**File**: `src/stores/db.ts`

- Add `getTripBySlug(slug: string): Promise<Trip | undefined>` function
- Simple: get all trips, find by slug

**Dependencies**: None

### Step 2: Add `formatDate` helper

**File**: `src/lib/format-date.ts`

- Add `formatDate(timestamp: number): string` alongside the existing `formatDateRange`
- Formats a single Unix timestamp as e.g. "Feb 9, 2025"
- Uses `Intl.DateTimeFormat` with `month: "short", day: "numeric", year: "numeric"`
- The chapter card needs this for single-day chapters (where start === end or end is null)

**Dependencies**: None

### Step 3: Create the trip detail feature module structure

**Directory**: `src/features/trip-detail/`

Create the feature directory with co-located components:

```
src/features/trip-detail/
  components/
    trip-detail-page.tsx    — Main page component (client, orchestrates data loading + states)
    hero-cover.tsx          — Full-bleed cover photo with gradient overlay
    trip-header.tsx         — Trip metadata (name, date, summary, stats)
    trip-stats.tsx          — Horizontal stats row (distance, chapters, photos)
    chapter-timeline.tsx    — Timeline container with vertical line
    chapter-card.tsx        — Individual chapter in the timeline
    back-button.tsx         — Sticky back navigation
    trip-not-found.tsx      — Not-found state
    trip-detail-error.tsx   — Error state with retry
    trip-detail-skeleton.tsx — Loading skeleton
  lib/
    decompose-cover-photo-id.ts — Utility to split coverPhotoId into parts
    use-trip-detail.ts      — Custom hook for data fetching (trip + chapters + cover photo)
```

**Dependencies**: Steps 1, 2

### Step 4: Implement `useTripDetail` hook

**File**: `src/features/trip-detail/lib/use-trip-detail.ts`

A custom hook that encapsulates the data-fetching logic:

- Takes a `slug: string` parameter
- Returns `{ status: "loading" | "not-found" | "error" | "success", trip?, chapters?, coverPhotoUrl? }`
- On mount: calls `getTripBySlug(slug)`, then `getChaptersByTrip(tripId)`, then optionally loads the cover photo via `readPhoto`
- Sorts chapters by `startTime` ascending
- Creates an object URL from the cover photo blob (and cleans it up on unmount)
- Provides a `retry()` function for the error state
- Catches errors and sets status to "error"

**Dependencies**: Step 1

### Step 5: Implement `decomposeCoverPhotoId`

**File**: `src/features/trip-detail/lib/decompose-cover-photo-id.ts`

- Pure function, split on first two hyphens
- Returns `{ tripId: number; chapterId: number; filename: string }`
- **Coupling note**: this must stay in sync with the construction site in `src/features/import/lib/parse-trip.ts` (`resolveCoverPhotoId`), which builds the composite key as `` `${raw.id}-${chapterId}-${filename}` ``
- Edge cases to handle: filenames with hyphens (e.g., `photo-2025-01-01.jpg`), dots, multi-segment names

**Dependencies**: None

### Step 6: Implement presentational components (bottom-up)

These components are pure/presentational and can be built in parallel.

#### 6a: `BackButton`

**File**: `src/features/trip-detail/components/back-button.tsx`

- Client component (uses `useRouter` from `next/navigation`)
- Wrapped in a `<nav aria-label="Back navigation">` landmark (design accessibility note #2)
- Sticky top-left, semi-transparent bg over hero, solid bg otherwise
- ArrowLeft icon from Lucide, "Back" label on desktop, icon-only on mobile
- `aria-label="Back to trip list"`
- Links to `/` via `<Link>` (not router.back, for predictable behavior)

#### 6b: `TripStats`

**File**: `src/features/trip-detail/components/trip-stats.tsx`

- Server-compatible (no client directive needed — just props in)
- Route, MapPin, ImageIcon icons from Lucide
- Distance formatted with thousands separator (`Intl.NumberFormat`)
- Flex-wrap row for mobile

#### 6c: `TripHeader`

**File**: `src/features/trip-detail/components/trip-header.tsx`

- Receives `trip: Trip` and `hasCover: boolean`
- Wrapped in `<section aria-label="Trip summary">` landmark (design accessibility note #2)
- If no cover: renders trip name as h1
- Renders date range, summary (whitespace-pre-line, dir="auto"), and TripStats
- Summary omitted entirely if empty/null

#### 6d: `HeroCover`

**File**: `src/features/trip-detail/components/hero-cover.tsx`

- Client component (manages cover photo loading from OPFS, object URL lifecycle)
- Receives `coverPhotoUrl: string | null`, `tripName: string`, `isLoading: boolean`
- Full-bleed image with `object-fit: cover`, max-height constraint
- Image `alt` attribute: `"Cover photo for {trip name}"` (design accessibility note #4)
- Gradient overlay at bottom, trip name overlaid as h1 (white text)
- Shimmer placeholder while loading
- If photo load fails, component returns null (parent renders as if no cover — `alt` text is not exposed)
- Image fade-in (200ms opacity), respects prefers-reduced-motion

#### 6e: `ChapterCard`

**File**: `src/features/trip-detail/components/chapter-card.tsx`

- Receives a `Chapter`
- Timeline dot (small accent-colored circle)
- Location name as h2 (dir="auto", bdi-wrapped)
- Country/region detail in muted text
- Date: uses `formatDate` for single day, `formatDateRange` for multi-day
- Weather line (conditional): "{condition}, {temperature}" in muted text
- Description (conditional): whitespace-pre-line, dir="auto"

#### 6f: `ChapterTimeline`

**File**: `src/features/trip-detail/components/chapter-timeline.tsx`

- Receives `chapters: Chapter[]`
- Renders vertical timeline line on the left (thin border-colored line)
- Maps chapters to ChapterCard
- Empty state: "No chapters recorded for this trip" message
- `<section aria-label="Chapter timeline">`

#### 6g: `TripNotFound`

**File**: `src/features/trip-detail/components/trip-not-found.tsx`

- Centered message, "Trip not found" heading, subtext, link back to `/`

#### 6h: `TripDetailError`

**File**: `src/features/trip-detail/components/trip-detail-error.tsx`

- AlertTriangle icon (amber), "Something went wrong" heading, subtext, "Try Again" button
- Receives `onRetry` callback

#### 6i: `TripDetailSkeleton`

**File**: `src/features/trip-detail/components/trip-detail-skeleton.tsx`

- Shimmer blocks mimicking hero, header, and chapter timeline layout
- Animated shimmer respects prefers-reduced-motion (static muted bg when reduced)

**Dependencies**: Steps 2, 5

### Step 7: Implement `TripDetailPage` (orchestrator)

**File**: `src/features/trip-detail/components/trip-detail-page.tsx`

- `"use client"` — needs IndexedDB, state, effects
- Uses `useTripDetail(slug)` hook
- Renders a visually-hidden "Skip to content" link at the top of the page that jumps past the hero to the trip header content (design accessibility note #9). The link becomes visible on focus. Target is an `id` on the TripHeader section
- Renders BackButton always
- Renders the appropriate state:
  - Loading -> TripDetailSkeleton
  - Not found -> TripNotFound
  - Error -> TripDetailError with retry
  - Success -> HeroCover (if cover) + TripHeader + ChapterTimeline
- Framer Motion fade-in on content load (duration 250ms, ease-in-out)
- `aria-live="polite"` container for state announcements
- Focus management: after load, focus moves to h1

**Dependencies**: Steps 4, 6

### Step 8: Create the Next.js route

**File**: `src/app/trip/[slug]/page.tsx`

- Server component wrapper that extracts `params.slug` and renders `<TripDetailPage slug={slug} />`
- Minimal — delegates everything to the client component

**Dependencies**: Step 7

### Step 9: Update trip list navigation

**File**: `src/features/import/components/trip-list.tsx`

- Change `onTripClick` behavior: instead of calling the callback, navigate to `/trip/${trip.slug}` using Next.js `<Link>` or `useRouter`
- Wrap each trip card in a `<Link href={/trip/${trip.slug}}>` element (keeping the card styling)
- This also requires updating `ImportFlow` to remove the `handleTripClick` / "viewing" state since navigation now handles it

**File**: `src/features/import/components/import-flow.tsx`

- Remove the `handleTripClick` function and `"viewing"` state handling
- Remove the `onTripClick` prop from `<TripList>`
- Remove the `"viewing"` AnimatePresence branch

**File**: `src/types/import.ts`

- Remove the `| { status: "viewing"; result: ImportResult }` variant from the `ImportState` union type (no longer used)

**File**: `src/features/import/components/import-summary.tsx`

- Remove the `mode` prop (`"import" | "viewing"`) — it defaults to `"import"` and the `"viewing"` caller is gone
- Remove the `mode === "viewing"` / "Back" button branch (dead code)
- Remove the `mode === "import"` conditional guards — the remaining behavior is always the import path

**Dependencies**: Step 8

### Step 10: Write tests

Tests live in the `tests/` directory, mirroring the `src/` structure (per the existing vitest config: `include: ["tests/**/*.test.{ts,tsx}"]`). Test infrastructure (Vitest, React Testing Library, jest-dom, fake-indexeddb) is already configured — see `vitest.config.ts` and `src/test-setup.ts`.

#### Unit tests

- `tests/features/trip-detail/lib/decompose-cover-photo-id.test.ts` — tests split logic with various filename patterns (hyphens, dots, multi-segment). Must include edge cases like `"1-2-photo-2025-01-01.jpg"` to verify only the first two hyphens are split
- `tests/lib/format-date.test.ts` — tests for the new `formatDate` function
- `tests/stores/db.test.ts` (add to existing) — test `getTripBySlug`

#### Component tests (Vitest + React Testing Library)

- `tests/features/trip-detail/components/trip-detail-page.test.tsx` — tests all four states (loading, success, not-found, error)
- `tests/features/trip-detail/components/chapter-card.test.tsx` — tests rendering with/without weather, with/without description
- `tests/features/trip-detail/components/hero-cover.test.tsx` — tests cover photo display and fallback, verifies `alt` text
- `tests/features/trip-detail/components/chapter-timeline.test.tsx` — tests chronological order, empty state

Mock boundaries:
- Mock `src/stores/db.ts` (getTripBySlug, getChaptersByTrip)
- Mock `src/stores/photo-storage.ts` (readPhoto)
- Mock `next/navigation` (useRouter, useParams)

**Dependencies**: All previous steps

## Risks & Considerations

### Cover photo ID parsing

The `coverPhotoId` composite key (`tripId-chapterId-filename`) relies on splitting on the first two hyphens. This works because `tripId` and `chapterId` are numeric (no hyphens), but the filename portion can contain anything. The decomposition logic must be careful. A unit test with edge-case filenames (e.g., `photo-2025-01-01.jpg`) is essential.

### No slug index in IndexedDB

There is no index on `slug` in the trips object store. The `getTripBySlug` function does a full table scan. This is fine for v1 (small number of trips) but should be noted. Adding an index would require a DB version bump.

### Object URL cleanup

The cover photo is loaded as a Blob from OPFS and converted to an object URL. This must be revoked on unmount to avoid memory leaks. The `useTripDetail` hook handles this in its cleanup function.

### Trip list refactor scope

Changing the trip list from inline state management to route navigation is a small but visible change to existing code. The `ImportFlow` component loses its `"viewing"` state branch, which simplifies it. The `ImportSummary` component's `mode="viewing"` usage is removed. This is clean: the import summary should only show after a fresh import, not as a trip detail view.

### Content max-width change

The trip detail page uses a wider content area (~720px) than the import flow (~480px). This is intentional per the design spec — the detail page is a reading view. The page layout is independent of the home page layout, so no conflicts.

### Bidirectional text

All user-generated text (trip name, summary, chapter names, descriptions) must use `dir="auto"` and `<bdi>` wrapping. This is already done in the trip list cards and must be applied consistently in the new components.

### Accessibility: focus after state transition

When transitioning from skeleton to success, focus should move to the h1 (trip name). This follows the pattern in `ImportFlow` where the heading ref gets focus on state change. Use a `useEffect` triggered by status change.

### No `prefers-reduced-motion` hook exists yet

The import flow checks `prefers-reduced-motion` inline with `useState` + `useEffect`. Rather than duplicating this, consider extracting a `usePrefersReducedMotion()` hook into `src/lib/` and using it in both places. However, per the "no over-engineering" principle, it's acceptable to duplicate for now and extract later if a third consumer appears.
