# 03 — Trip Selection on Import: Implementation Plan

## Architecture

The current import flow is a single pipeline: `extractZip → parseTrip → collectPhotos → store`. The `parseTrip()` function internally calls `selectTrip()` which picks the earliest trip and discards the rest.

This feature splits the flow into two phases:

1. **Scan phase** — Extract ZIP, find all trip directories, parse lightweight metadata for each (name, dates, chapter count). No photos.
2. **Import phase** — User picks a trip, we parse that specific trip directory fully and run the existing import pipeline.

The scan phase is new. The import phase reuses existing logic with a minor change: accepting a specific trip directory path instead of auto-selecting.

### Where changes land

| Layer | File | Change |
|---|---|---|
| Types | `src/types/import.ts` | Add `TripSummary` type; add `scanning` and `selecting` states to `ImportState` |
| Lib | `src/features/import/lib/parse-trip.ts` | Extract `scanTrips()` function (metadata-only scan of all trips); modify `parseTrip()` to accept a specific trip directory |
| Lib | `src/features/import/lib/import-trip.ts` | Add `scanTripsFromFile()` orchestrator; modify `importTrip()` to accept required `tripDirPath` |
| UI | `src/features/import/components/import-flow.tsx` | Add `scanning` and `selecting` states to the state machine; wire scan → select → import flow |
| UI (new) | `src/features/import/components/extraction-spinner.tsx` | Loading indicator during scan |
| UI (new) | `src/features/import/components/trip-selection-list.tsx` | Selection screen with header, subtitle, card list |
| UI (new) | `src/features/import/components/trip-selection-card.tsx` | Individual trip card with tap-to-import and already-imported badge |
| UI (new) | `src/features/import/components/reimport-confirmation.tsx` | Inline confirmation for already-imported trips |
| Tests | `tests/features/import/lib/parse-trip.test.ts` | Add unit tests for `scanTrips()` (extends existing test file) |
| Tests | `tests/features/import/components/trip-selection-list.test.tsx` | Component tests for selection UI |

## Data Model

### New type: `TripSummary`

A lightweight representation of a trip found during scanning. No photos, no full chapter data.

```typescript
/** Metadata-only representation returned by scanTrips(). No photos, no full chapter data. */
export interface ScannedTrip {
  id: number
  name: string              // sanitized
  startDate: number         // Unix timestamp (seconds)
  endDate: number           // Unix timestamp (seconds)
  chapterCount: number
  tripDirPath: string       // path within ZIP, needed to import later
}

/** ScannedTrip enriched with vault context. Returned by scanTripsFromFile(). */
export interface TripSummary extends ScannedTrip {
  alreadyImported: boolean  // matched against vault by trip id
}
```

### New `ImportState` variants

```typescript
| { status: "scanning"; file: File }
| { status: "selecting"; file: File; trips: TripSummary[] }
```

The `file` is kept in state so we can re-extract when the user picks a trip (the ZIP entries are not held in memory between phases — they'd be too large).

## Implementation Steps

### Step 1: Add `ScannedTrip`, `TripSummary` types and new `ImportState` variants

**File**: `src/types/import.ts`

- Add `ScannedTrip` interface (metadata returned by the scan function)
- Add `TripSummary` interface (extends `ScannedTrip` with `alreadyImported` flag, set by the orchestrator)
- Add `scanning` and `selecting` variants to the `ImportState` union
- No breaking changes — existing states remain unchanged

### Step 2: Extract `scanTrips()` from parse-trip.ts

**File**: `src/features/import/lib/parse-trip.ts`

- **`findTripDirectories()` caveat**: This function currently throws `ImportError("MALFORMED_JSON")` on any JSON parse failure, which means a single bad trip directory would abort the entire scan. `scanTrips()` must NOT delegate JSON parsing to `findTripDirectories()`. Instead, `scanTrips()` should reuse the directory-finding regex logic but do its own per-trip JSON parsing inside a try/catch. Options:
  - (a) Extract the path-matching logic from `findTripDirectories()` into a shared helper (e.g., `findTripJsonPaths(entries): string[]`) that only finds paths without parsing, then `scanTrips()` and `findTripDirectories()` both call it, or
  - (b) Have `scanTrips()` duplicate the regex scan (it's 3 lines) and parse independently.
  - Option (a) is cleaner. `findTripDirectories()` continues to throw on bad JSON (used by the full import path where failure is appropriate). `scanTrips()` catches per-trip and skips.
- Add new exported function `scanTrips(entries: ZipEntries): ScannedTrip[]`:
  - Finds all `trip/*/trip.json` paths via shared helper
  - For each, reads and parses the JSON inside a try/catch — extracts: id, name (sanitized), start_date, end_date, counts chapters from `all_steps`
  - Silently skips directories with invalid/unreadable data
  - Sorts by start date descending (newest first, per design)
  - Returns `ScannedTrip[]` (no `alreadyImported` — that's the caller's job, requires IndexedDB access)
- Modify `parseTrip()` signature to `parseTrip(entries: ZipEntries, tripDirPath: string): ParsedTripData`:
  - `tripDirPath` becomes a required **input** parameter
  - Uses that directory directly instead of calling `selectTrip()`
  - Still returns `tripDirPath` in the output (downstream consumers like `collectPhotos()` need it)
  - Remove `selectTrip()` — it's no longer needed

### Step 3: Add `scanTripsFromFile()` orchestrator

**File**: `src/features/import/lib/import-trip.ts`

- New exported function `scanTripsFromFile(file: File): Promise<TripSummary[]>`:
  - Extracts ZIP
  - Calls `scanTrips(entries)` → gets `ScannedTrip[]`
  - Fetches all trip IDs from IndexedDB via `getAllTrips()`
  - Maps each `ScannedTrip` to `TripSummary` by adding `alreadyImported` (matched by `trip.id`)
  - Returns the list (or throws `ImportError` if extraction fails)
- Modify `importTrip()` signature to require `tripDirPath`:
  - `importTrip(file: File, options: ImportOptions & { tripDirPath: string })`
  - `importTrip()` still calls `extractZip(file)` internally (the ZIP is re-extracted for the full import, as discussed in Risks)
  - Passes `tripDirPath` through to `parseTrip(entries, tripDirPath)`

### Step 4: Build `ExtractionSpinner` component

**File**: `src/features/import/components/extraction-spinner.tsx`

- Simple centered layout: spinner + "Reading your travel data…" text
- Reuses existing styling patterns (same container width, centered)
- `"use client"` directive (uses Framer Motion)

### Step 5: Build `TripSelectionCard` component

**File**: `src/features/import/components/trip-selection-card.tsx`

- Renders as a `<button>` element for accessibility
- Shows: trip name (`<bdi>`, `dir="auto"`, 2-line truncation), date range (`formatDateRange`), chapter count (`MapPin` icon)
- "Already imported" badge with check icon when applicable
- Hover/focus states, cursor pointer, focus ring
- Props: `trip: TripSummary`, `onSelect: () => void`, `disabled: boolean`, `loading: boolean`, `expanded: boolean`
- When `loading`: shows spinner replacing chapter count, visually indicates active state
- When `expanded`: renders `ReimportConfirmation` inline inside the card

### Step 6: Build `ReimportConfirmation` component

**File**: `src/features/import/components/reimport-confirmation.tsx`

- Inline content: confirmation text + Cancel (outline) / Import (primary) buttons
- Animated expand/collapse with Framer Motion (`AnimatePresence` + height animation)
- Focus management: moves focus to Cancel button when opened
- Props: `onCancel: () => void`, `onConfirm: () => void`

### Step 7: Build `TripSelectionList` component

**File**: `src/features/import/components/trip-selection-list.tsx`

- Header: "Select a trip" (h2), subtitle with trip count (and already-imported count if > 0)
- Close button (X icon, top-right) with `aria-label="Close trip selection"`
- Vertical list of `TripSelectionCard` components
- Manages which card has an open confirmation (single at a time)
- Manages loading state (which card is importing, disable others)
- Escape key: closes confirmation if open, otherwise dismisses selection screen
- Focus management: focus heading on mount (`tabIndex={-1}` + ref pattern)
- Props: `trips: TripSummary[]`, `onSelectTrip: (trip: TripSummary) => void`, `onDismiss: () => void`
- `"use client"` directive

### Step 8: Wire into `ImportFlow` state machine

**File**: `src/features/import/components/import-flow.tsx`

Changes to the state machine:

1. **`handleFileSelected()`** — after size check, set state to `{ status: "scanning", file }` instead of calling `startImport()` directly
2. **New `startScan(file)`** — triggered by a `useEffect` watching for `state.status === "scanning"` (consistent with how the existing import is triggered by state changes):
   - Calls `scanTripsFromFile(file)`
   - If result has 0 trips → set error state (`MISSING_TRIP_JSON`)
   - If result has 1 trip → skip selection, call `startImport(file, trip.tripDirPath)` directly
   - If result has multiple trips → set state to `{ status: "selecting", file, trips }`
3. **`handleTripSelected(trip)`** — called from selection screen:
   - Sets state to `{ status: "importing", ... }`
   - Calls modified `importTrip(file, { tripDirPath: trip.tripDirPath, onProgress })`
4. **Render `scanning`** → `ExtractionSpinner`
5. **Render `selecting`** → `TripSelectionList`
6. **Dismiss handler** → returns to `idle` state

Animation transitions follow existing pattern (AnimatePresence with motionVariants).

**Escape key scope**: All Escape key handling is owned by `TripSelectionList`, not `ImportFlow`. The existing `import-flow.tsx` has no flow-level Escape handling — each view manages its own keyboard interactions. `TripSelectionList` handles: Escape with confirmation open → close confirmation; Escape with no confirmation → call `onDismiss`.

### Step 9: Write tests

> **Note**: Tests follow the project's actual convention — mirrored under `tests/` at the root, not co-located with source files.

**File**: `tests/features/import/lib/parse-trip.test.ts` (extend existing file)

- `scanTrips()` with multiple valid trip directories → returns all, sorted newest-first
- `scanTrips()` with one valid + one invalid directory → returns only the valid one
- `scanTrips()` with zero valid directories → returns empty array
- `scanTrips()` sanitizes HTML in trip names
- `parseTrip()` with explicit `tripDirPath` → uses that directory (no auto-selection)

**File**: `tests/features/import/components/trip-selection-list.test.tsx` (new file)

- Renders all trips as cards with correct info
- Shows "Already imported" badge for matching trips
- Tapping a card calls `onSelectTrip`
- Tapping already-imported card shows confirmation first
- Cancel in confirmation closes it
- Import in confirmation calls `onSelectTrip`
- Escape closes confirmation
- Escape with no confirmation calls `onDismiss`
- Close button calls `onDismiss`
- Subtitle shows correct count + already-imported count

## Risks & Considerations

### Re-extracting the ZIP

The scan phase extracts the ZIP once to read metadata, then discards the entries. When the user picks a trip, we extract the ZIP again for the full import (photos included). This means the ZIP is extracted twice. This is intentional:

- Holding the full `ZipEntries` (potentially hundreds of MB of photo data) in memory between phases would cause memory pressure
- Extraction for a typical travel ZIP takes <2 seconds — acceptable UX cost
- The `File` object remains valid across phases (kept in state), so re-reading is reliable

### Single-trip shortcut

When only one trip is found, we skip the selection screen entirely and go straight to import. This preserves the current behavior for single-trip ZIPs and avoids a pointless selection step.

**Spinner flash**: In the single-trip case, the flow goes `scanning → importing`, so `ExtractionSpinner` appears briefly before `ImportProgress` replaces it. If the scan completes very fast (common for small ZIPs), this could cause a jarring flash. Apply the same minimum-display-time pattern used by `importStartTime` — if the scan completes in under ~400ms, delay the transition so the spinner is visible for at least that long, or skip straight to `ImportProgress` without showing the spinner at all (similar to how the existing flow skips the progress view for sub-1s imports).

### No backwards compatibility needed for `parseTrip()`

`parseTrip()` is only called from `importTrip()`, which we're also changing. So we make `tripDirPath` required and delete `selectTrip()` entirely — no optional parameter, no fallback path.

### Memory: trip metadata only

`TripSummary` holds only scalar metadata (name, dates, count). No photo data, no chapter details, no binary content. Even a ZIP with 50 trips would produce a negligible metadata array.

### Already-imported matching

We match by `trip.id` (numeric ID from the travel export). This is the same ID stored in IndexedDB. If a user imports the same trip from different export files, the ID will match. This is the correct behavior — it's the same trip.
