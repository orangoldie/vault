# 03 — Trip Selection on Import: Code Review

## Summary

**Approved with suggestions.** The implementation is solid, well-structured, and closely follows the spec and plan. All 106 tests pass. The two-phase scan→select→import architecture is clean. A few issues worth addressing before merge.

## Spec Compliance

All acceptance criteria are met:

- [x] ZIP extraction finds all trip directories
- [x] Single-trip ZIP imports immediately (no selection screen)
- [x] Multi-trip ZIP shows selection screen with name, date range, chapter count
- [x] Already-imported trips marked with "Already imported" badge (matched by `trip.id`)
- [x] Tapping already-imported trip shows inline confirmation prompt
- [x] Single selection (not batch)
- [x] Success shows existing summary (detail view deferred to spec 04)
- [x] Dismiss returns to previous screen
- [x] Invalid trip directories silently skipped
- [x] Zero valid trips → existing error
- [x] RTL/LTR support (`dir="auto"`, `<bdi>`)
- [x] Large file warning still fires before extraction
- [x] Trip names sanitized (HTML stripped)
- [x] Escape key behavior (close confirmation first, then dismiss screen)
- [x] Focus management (heading on mount, cancel button on confirmation)

### Minor gaps

1. **Framer Motion animation on ReimportConfirmation**: The design calls for animated expand/collapse with `AnimatePresence` + height animation on the reimport confirmation. The current implementation renders it with a static `{expanded && ...}` — no animation. This is a nice-to-have, not a blocker.

2. **Spinner flash on single-trip shortcut**: The plan explicitly calls out a minimum display time or skip pattern for the `scanning → importing` transition to avoid a jarring flash. This wasn't implemented. For small ZIPs the spinner will flash briefly then disappear. Low priority but worth noting.

## Code Quality

**Strengths:**
- Clean separation: `scanTrips()` returns `ScannedTrip[]` (no vault context), `scanTripsFromFile()` enriches with `alreadyImported`. Good boundary.
- `findTripJsonPaths()` extracted as shared helper per plan option (a) — `findTripDirectories()` and `scanTrips()` both use it cleanly.
- `selectTrip()` deleted entirely — no dead code left behind.
- `TripSelectionCard` uses `<button>` for accessibility, builds a proper `aria-label`, supports `aria-expanded`.
- Tests are thorough and behavioral (not implementation-detail-coupled).

**Issues:**

### Must fix

1. **`parseTrip()` re-scans all directories unnecessarily** (`parse-trip.ts:122-126`)
   `parseTrip(entries, tripDirPath)` calls `findTripDirectories(entries)` which parses *every* trip.json in the ZIP, then does `dirs.find(d => d.path === tripDirPath)` to pick the one we already know about. Since we already have the `tripDirPath`, we should just read and parse that single `trip.json` directly. This is wasteful for ZIPs with many trips — the full import already re-extracts the ZIP, so parsing all trip JSONs a second time adds unnecessary work.

2. **`scanTrips()` skips trips with missing `id`** (`parse-trip.ts:65`) but doesn't skip trips missing `start_date`/`end_date`. If a trip has `start_date: undefined`, it will propagate as `NaN` into `ScannedTrip.startDate`, which could cause sorting issues and UI display bugs (`formatDateRange` with `NaN`). Add a guard: `if (!raw.id || !raw.start_date || !raw.end_date || ...)`

### Nice to have

3. **`ExtractionSpinner` has `"use client"` but doesn't need it** (`extraction-spinner.tsx:1`). It uses no state, effects, event handlers, or browser APIs. It only renders a Loader2 icon and text. The `"use client"` directive is unnecessary per project rules. (It would need it if Framer Motion animation were added, but currently it's just static JSX with a CSS animation class.)

4. **`bg-surface` class** in `trip-selection-card.tsx:41` — verify this is a defined Tailwind token. If it's not in the Tailwind config, it silently produces no background style. The existing card components in the codebase may use `bg-card` instead.

5. **`size="icon-sm"` Button variant** in `trip-selection-list.tsx:74` — verify this exists in the shadcn Button config. If not, it falls through to default sizing. The close button might not meet the 44×44px minimum tap target called out in the design doc.

## Potential Bugs

1. **`chapterCount` uses `step_count` with fallback to `all_steps.length`** (`parse-trip.ts:71`): `raw.step_count ?? raw.all_steps.length`. The `??` nullish coalescing means `step_count: 0` would be used as-is (showing "0 chapters"). If `step_count` can be `0` while `all_steps` has entries, this would be misleading. Consider using `||` instead if `0` should trigger the fallback, or validate this matches the data shape.

2. **Escape key listener on `document`** (`trip-selection-list.tsx:38-41`): This is a global listener. If other components also listen for Escape (e.g., modals, the large-file confirmation), they could conflict. Currently this is probably fine since TripSelectionList only renders when `state.status === "selecting"` and other views are unmounted. But if the architecture changes (e.g., overlays), this could cause issues. Not a bug today, just a fragility note.

## Performance

No concerns. The scan phase reads only `trip.json` files (small JSON, no photos). The double-extraction trade-off is well-documented in the plan and acceptable. `Set`-based lookup for `alreadyImported` matching is O(1).

## Test Coverage

Excellent. 106 tests all passing. Coverage includes:

- `scanTrips()`: multiple valid, mixed valid/invalid, zero valid, empty steps, HTML sanitization, chapter count, path
- `TripSelectionList`: rendering, badges, card tap, confirmation flow, Escape behavior, dismiss, subtitles
- `ImportFlow`: multi-trip selection, zero-trip error, scan failure error, dismiss back to idle
- All existing `importTrip` tests updated with `tripDirPath` parameter

**Missing test**: No test for the single-trip auto-import shortcut path through `ImportFlow`. The `setupSingleTripScan()` helper configures this as the default, so it's exercised implicitly by existing tests, but an explicit test documenting this behavior would be good.

## Suggestions

| # | Priority | File | Suggestion |
|---|----------|------|-----------|
| 1 | Must fix | `parse-trip.ts:122-126` | `parseTrip()` should read only the specified `tripDirPath/trip.json` entry directly, not scan all directories |
| 2 | Must fix | `parse-trip.ts:65` | Add guard for missing `start_date`/`end_date` in `scanTrips()` |
| 3 | Nice to have | `extraction-spinner.tsx:1` | Remove `"use client"` — component is purely presentational |
| 4 | Nice to have | `trip-selection-card.tsx:41` | Verify `bg-surface` is a valid Tailwind token; may need `bg-card` |
| 5 | Nice to have | `trip-selection-list.tsx:74` | Verify `size="icon-sm"` exists in Button variants; ensure 44×44px tap target |
| 6 | Nice to have | `reimport-confirmation.tsx` | Add Framer Motion expand/collapse animation per design doc |
| 7 | Nice to have | `import-flow.tsx:87-88` | Add minimum display time for scanning spinner per plan's "Spinner flash" section |
| 8 | Nice to have | `import-flow.test.tsx` | Add explicit test for single-trip auto-import shortcut |

## Verdict

**Approved with suggestions.** Items 1 and 2 should be fixed before merge — they're small changes (< 10 lines each). The rest are polish items that can be addressed in a follow-up.
