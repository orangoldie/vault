# QA Report — Spec 02: Move Photo Storage from IndexedDB to OPFS

## What Was Tested

### Unit Tests (Vitest) — 107 total, all passing

#### `tests/stores/photo-storage.test.ts` (9 tests)
- Write and read a photo round-trip
- Returns null for missing photo (graceful handling)
- Deletes all photos for a trip (recursive)
- No-throw on deleting non-existent trip
- Deletes specific photo files (selective cleanup)
- No-throw on deleting non-existent files
- **[NEW]** Overwrites an existing photo file (idempotent write)
- **[NEW]** Isolates photos across different trips (trip deletion doesn't leak)
- **[NEW]** Isolates photos across different chapters in the same trip

#### `tests/stores/db.test.ts` (14 tests)
- Trip CRUD (save, get, getAll, upsert)
- Chapter save and retrieval by tripId
- Photo metadata CRUD (save, getByTrip, getByIds, delete)
- deleteTrip removes all records AND calls `deletePhotosByTrip()` for OPFS cleanup
- Empty input edge cases (deletePhotos([]), getPhotosByIds([]))
- Skips non-existent IDs in batch fetch
- **[NEW]** Photo metadata has no `blob` field (schema v2 validation)
- **[NEW]** deleteTrip removes all associated chapters

#### `tests/features/import/lib/import-trip.test.ts` (12 tests)
- Basic import with metadata and chapters
- Photos written to OPFS and metadata to IndexedDB (dual-write verified)
- Error handling: INVALID_ZIP, MISSING_TRIP_JSON
- Orphan cleanup on re-import (removes OPFS files + IndexedDB records)
- QUOTA_EXCEEDED via `QuotaExceededError` name
- **[NEW]** QUOTA_EXCEEDED via error message containing "quota"
- **[NEW]** Best-effort OPFS cleanup when `savePhoto()` fails after `writePhoto()` succeeds
- **[NEW]** Progress reaches 100% for trips with zero photos

#### `tests/features/import/components/import-flow.test.tsx` (12 tests)
- All existing state transitions preserved
- **[NEW]** QUOTA_EXCEEDED error shows "isn't enough storage space" message

#### Other existing test files (unchanged, all passing)
- `collect-photos.test.ts` (5 tests) — photo entry collection from ZIP
- `parse-trip.test.ts` (8 tests) — trip.json parsing, sanitization, multi-trip selection
- `extract-zip.test.ts` (3 tests) — ZIP extraction error handling
- `import-prompt.test.tsx` (7 tests) — file input UX
- `import-progress.test.tsx` (7 tests) — progress bar and accessibility
- `import-summary.test.tsx` (10 tests) — success state rendering
- `import-error.test.tsx` (11 tests) — all 7 error codes including QUOTA_EXCEEDED
- `trip-list.test.tsx` (9 tests) — trip listing

### E2E Tests (Playwright) — 10 total, all passing

- All 8 existing E2E tests pass unchanged
- **[NEW]** `stores photo data in OPFS, not as blobs in IndexedDB` — imports trip, verifies IndexedDB photo records have no `blob` field, verifies OPFS contains 2 photo files
- **[NEW]** `OPFS photos persist after page reload` — imports trip, reloads page, verifies OPFS files survive

## Coverage Approach

| Acceptance Criterion | Unit Test | E2E Test |
|---|---|---|
| Photo blobs stored in OPFS, not IndexedDB | `import-trip.test.ts` (writePhoto mock verified) | `stores photo data in OPFS` |
| Photo metadata in IndexedDB (no blob) | `db.test.ts` (no blob field) | `stores photo data in OPFS` |
| Photos organized by trip/chapter in OPFS | `photo-storage.test.ts` (isolation tests) | `stores photo data in OPFS` |
| Deleting trip removes metadata + OPFS files | `db.test.ts` (deletePhotosByTrip called) | — |
| Re-import cleans up orphaned files | `import-trip.test.ts` (orphan cleanup) | — |
| Quota error shows clear message | `import-trip.test.ts` + `import-flow.test.tsx` | — |
| Missing OPFS file handled gracefully | `photo-storage.test.ts` (returns null) | — |
| All import behavior preserved | All existing tests pass unchanged | All 8 existing E2E tests pass |
| Data persists after reload | — | `OPFS photos persist after page reload` |
| Best-effort cleanup on partial failure | `import-trip.test.ts` (savePhoto failure) | — |

## Gaps and Risks

### Low Risk
- **No E2E test for trip deletion OPFS cleanup** — Unit test covers this via mock verification, but no E2E test directly verifies OPFS files are removed after trip deletion. Mitigated by the fact that `deletePhotosByTrip` is a simple OPFS `removeEntry` call.
- **No E2E test for re-import orphan cleanup** — The existing re-import E2E test clears the DB (not a true re-import). Unit test covers orphan cleanup well.

### Medium Risk
- **Partial import failure leaves trip/chapter metadata** — If photo import fails after `saveTrip`/`saveChapters` succeed, the trip record persists without photos. This is existing behavior (not new to spec 02) and may be acceptable for v1.

### Not Testable in CI
- **Browser compatibility** — OPFS is tested only in Chromium via Playwright. Firefox and Safari require manual testing.
- **Large file performance** — No automated benchmark. Manual testing recommended for exports > 100 MB.
- **Real quota exhaustion** — Simulated via mock; real browser quota behavior may differ.

## Manual Test Cases

1. **Firefox OPFS compatibility** — Import a trip in Firefox, verify photos load correctly
2. **Safari 26+ OPFS compatibility** — Same as above for Safari
3. **Large export (>100 MB)** — Import a real travel export with 50+ photos, verify smooth progress and no timeouts
4. **Storage pressure** — Fill browser storage near quota, attempt import, verify clear error message
5. **v1→v2 migration** — If any users have existing v1 databases, verify the schema upgrade drops and recreates the photos store correctly
