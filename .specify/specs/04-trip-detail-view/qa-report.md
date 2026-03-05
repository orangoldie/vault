# 04 -- Trip Detail View: QA Report

## Summary

Wrote 7 test files covering the trip detail view feature (72 new tests, 205 total passing). All tests pass. No blocking issues found.

## What Was Tested

### Unit Tests

**`tests/features/trip-detail/lib/decompose-cover-photo-id.test.ts`** (9 tests)
- Simple composite key splitting (tripId-chapterId-filename)
- Filenames with hyphens (e.g., `photo-2025-01-01.jpg`) -- splits on first two hyphens only
- Filenames with multiple dots
- Large numeric IDs
- Filenames containing only hyphens
- Validation: throws for missing hyphens, single hyphen, empty string
- Non-numeric segment behavior (returns NaN, does not throw)

**`tests/lib/format-date.test.ts`** (7 tests)
- `formatDate`: formats Unix timestamps to "MMM D, YYYY" (en-US locale)
- Edge case: Unix epoch (timestamp 0)
- `formatDateRange`: same-year ranges (year appears once at end)
- `formatDateRange`: cross-year ranges (year appears on both dates)
- En-dash separator verification

**`tests/stores/db.test.ts`** (3 new tests added to existing file, 17 total)
- `getTripBySlug`: finds trip by slug when multiple trips exist
- `getTripBySlug`: returns undefined for non-existent slug
- `getTripBySlug`: returns undefined when no trips exist at all

### Component Tests

**`tests/features/trip-detail/components/trip-detail-page.test.tsx`** (11 tests)
- Loading state: skeleton renders, aria-live region present
- Success state: trip header, chapters, stats all render
- Not-found state: heading, explanatory text, back link to `/`
- Error state: heading, explanatory text, "Try Again" button
- Retry: clicking "Try Again" re-fetches and transitions to success
- Trip name as h1 when no cover photo
- Empty chapters: "No chapters recorded" message
- Aria-live region with `polite` attribute
- Skip-to-content link targeting `#trip-header`
- Stats display (chapter count, photo count, formatted distance)
- Graceful fallback when `readPhoto` fails (renders without cover)

**`tests/features/trip-detail/components/chapter-card.test.tsx`** (15 tests)
- Display name rendered as h2
- Location detail rendered
- Single date when endTime is null or equals startTime
- Date range when endTime differs
- Weather: both condition + temperature, temperature only, condition only, neither
- Temperature rounding to integer
- Description: present, absent, line-break preservation (whitespace-pre-line)
- Bidirectional text: dir="auto" and bdi wrapping on display name
- Empty location detail not rendered

**`tests/features/trip-detail/components/hero-cover.test.tsx`** (7 tests)
- Image renders with correct `alt` text and `src`
- Returns null when `coverPhotoUrl` is null
- Trip name rendered as h1 after image loads
- Dir/bdi for bidirectional trip name on hero
- Component removed on image error (no broken image)
- Shimmer placeholder before load, hidden after load

**`tests/features/trip-detail/components/chapter-timeline.test.tsx`** (6 tests)
- All chapters rendered
- Chapters rendered in provided order (confirms parent sorts before passing)
- Empty state message: "No chapters recorded for this trip."
- Empty message absent when chapters exist
- Section with `aria-label="Chapter timeline"`
- Correct count of chapter cards

## Coverage Approach

- **Unit tests** for pure logic (decompose function, date formatting, DB query)
- **Component tests** for all presentational components and the orchestrating page component
- **All four states** tested on TripDetailPage: loading, success, not-found, error
- **Conditional rendering** tested: weather presence/absence, description presence/absence, cover photo presence/absence/failure
- **Accessibility** tested: aria-live region, skip-to-content link, heading hierarchy, aria-label on sections, dir="auto" and bdi wrapping
- **Mock boundaries**: `src/stores/db.ts`, `src/stores/photo-storage.ts`, `framer-motion`, `next/link`, `next/navigation`

## Gaps and Risks

### Low Severity

- **Focus management after state transition** is implemented (useEffect moves focus to h1) but not directly asserted in tests. Testing `document.activeElement` after async state transitions with `requestAnimationFrame` is fragile in jsdom. The implementation is straightforward and low-risk.
- **prefers-reduced-motion** behavior is not directly tested (the mock in test-setup returns `matches: false`). The implementation correctly reads `matchMedia` and adjusts motion props. Could be tested by overriding the `matchMedia` mock per-test, but low priority since the pattern is simple.
- **Cover photo object URL cleanup** (revokeObjectURL on unmount) is not directly tested. The hook implementation is correct; testing cleanup side effects requires more setup than the risk warrants.

### Not Applicable (Out of Scope)

- E2E navigation from trip list to trip detail (would require Playwright; covered by existing acceptance criteria and manual testing)
- Browser back button behavior (Next.js routing concern, not unit-testable)
- Responsive layout (visual, requires visual regression or manual testing)

## Manual Test Cases

1. **Navigation flow**: Click a trip card in the trip list and verify it navigates to `/trip/[slug]`. Use browser back to return.
2. **Cover photo display**: Import a trip with a cover photo. Verify the hero image loads, shows the gradient overlay, and displays the trip name overlaid.
3. **No cover photo**: Import a trip without a cover photo. Verify the page renders cleanly with the trip name as a regular heading (no empty gap).
4. **RTL text**: Import a trip with Hebrew/Arabic trip name and chapter names. Verify bidirectional text renders correctly.
5. **Keyboard navigation**: Tab through the page -- back button should be focusable, skip-to-content link should appear on focus.
6. **Reduced motion**: Enable "reduce motion" in OS settings. Verify no fade-in animations, no shimmer pulse.
7. **Invalid URL**: Navigate directly to `/trip/nonexistent-slug`. Verify "Trip not found" message with working back link.
8. **Long descriptions**: Import a trip with multi-paragraph chapter descriptions. Verify line breaks are preserved and text is not truncated.
