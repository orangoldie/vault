# 02 — Move Photo Storage from IndexedDB to OPFS — Implementation Plan

## Open Question Resolution

### Safari `createWritable()` Support

**Resolved — no longer a concern.** Safari added `createWritable()` support in version 26.0 ([Can I Use](https://caniuse.com/mdn-api_filesystemfilehandle_createwritable)). All three target browsers (Chrome 86+, Firefox 111+, Safari 26+) now support the async OPFS API.

**Decision:** Use `createWritable()` everywhere. No Worker fallback needed. This confirms spec Decision #2 — async API only, no Worker complexity.

---

## Architecture

### Storage Split

| Data | Storage Layer | Purpose |
|---|---|---|
| Trip metadata | IndexedDB `trips` store | Structured queries |
| Chapter metadata | IndexedDB `chapters` store | Structured queries |
| Photo **metadata** | IndexedDB `photos` store (minus `blob` field) | Lookup by tripId/chapterId |
| Photo **binary data** | OPFS `photos/<tripId>/<chapterId>/<filename>` | Blob storage & retrieval |

### How It Fits Into the Existing System

The change is **internal to two layers** — everything above them stays the same:

1. **`src/stores/`** — New `photo-storage.ts` module for OPFS operations. Modified `db.ts` for schema v2 (drop `blob` from photos store).
2. **`src/features/import/lib/import-trip.ts`** — Swap `savePhoto()` calls to write metadata to IndexedDB + blob to OPFS separately.

No changes to: ZIP extraction, trip parsing, photo collection, import UI, progress reporting, error messages, or any component.

---

## Data Model

### IndexedDB `photos` store (v2) — metadata only

```typescript
export interface Photo {
  id: string        // "${tripId}-${chapterId}-${filename}"
  tripId: number
  chapterId: number
  filename: string
  // blob field removed
}
```

The `blob` field is removed from the `Photo` interface in `src/types/trip.ts`.

### OPFS directory structure

```
<opfs-root>/
  photos/
    <tripId>/
      <chapterId>/
        <filename>    ← raw JPEG binary
```

No mapping table needed — the OPFS path is always derivable from the IndexedDB metadata fields.

### DB version bump

IndexedDB version goes from `1` → `2`. The upgrade handler:
- Doesn't need to migrate data (per spec Decision #1 — no production users yet).
- Deletes and recreates the `photos` store without the blob field (same indexes: `tripId`, `chapterId`).

---

## Implementation Steps

### Step 1: Create OPFS storage module — `src/stores/photo-storage.ts`

New module encapsulating all OPFS file operations. **No other module touches OPFS directly.**

Functions:

| Function | Signature | Description |
|---|---|---|
| `writePhoto` | `(tripId: number, chapterId: number, filename: string, data: Uint8Array) => Promise<void>` | Creates `photos/<tripId>/<chapterId>/` dirs and writes the file via `createWritable()`. |
| `readPhoto` | `(tripId: number, chapterId: number, filename: string) => Promise<Blob \| null>` | Reads the file and returns as `Blob`, or `null` if missing. |
| `deletePhotosByTrip` | `(tripId: number) => Promise<void>` | Recursively removes the `photos/<tripId>/` directory. |
| `deletePhotoFiles` | `(photos: Array<{ tripId: number; chapterId: number; filename: string }>) => Promise<void>` | Deletes specific photo files (for orphan cleanup on re-import). |

Internal helpers:
- `getPhotosRoot()` — returns `photos/` directory handle (lazily cached).
- `getOrCreateDir(parent, name)` — `getDirectoryHandle(name, { create: true })`.

**Dependencies:** None (uses native browser APIs only).

### Step 2: Update `Photo` type — `src/types/trip.ts`

- Remove the `blob` field from `Photo` interface.
- The interface becomes the metadata-only shape: `{ id, tripId, chapterId, filename }`.

### Step 3: Bump IndexedDB schema — `src/stores/db.ts`

- `DB_VERSION` from `1` → `2`.
- In the `upgrade` callback, handle version 1→2:
  - Delete the old `photos` store, recreate it with the same key and indexes but without blob storage (the schema type change handles this at the TypeScript level).
- Update the `VaultDB` type to reflect the new `Photo` shape (no `blob`).
- `savePhoto` now accepts metadata-only (no blob).
- Add `getPhotosByIds(ids: string[])` to batch-fetch photo metadata records (needed by orphan cleanup to resolve tripId/chapterId/filename before deleting OPFS files).
- Remove `blob` from any internal references.

### Step 4: Update import pipeline — `src/features/import/lib/import-trip.ts`

Modify the photo storage loop (Phase 3):

```
Before:  savePhoto({ id, tripId, chapterId, filename, blob })
After:   writePhoto(tripId, chapterId, filename, data)   // OPFS
         savePhoto({ id, tripId, chapterId, filename })   // IndexedDB metadata
```

- `writePhoto` is called first — if it throws `QuotaExceededError`, catch and rethrow as `ImportError("QUOTA_EXCEEDED", ...)`.
- `savePhoto` writes the metadata record.
- Progress reporting stays identical.

Update orphan cleanup:
- After determining orphaned photo IDs, look up each orphan's metadata from IndexedDB (tripId, chapterId, filename) and call `deletePhotoFiles()` to remove OPFS files, then `deletePhotos()` to remove IndexedDB metadata (existing behavior).
- **Do not parse the photo ID string** to extract tripId/chapterId/filename — filenames can contain hyphens, making split-based parsing unreliable. Instead, fetch the photo record from IndexedDB before deleting it.

### Step 5: Update trip deletion — `src/stores/db.ts`

`deleteTrip(id)` must also remove OPFS files:

```
Before:  delete trip + chapters + photo metadata from IndexedDB
After:   delete trip + chapters + photo metadata from IndexedDB
         + deletePhotosByTrip(id) from OPFS
```

### Step 6: Tests

**Unit tests** (Vitest):
- `photo-storage.test.ts` — Mock OPFS APIs to test write/read/delete flows.
- `db.test.ts` — Test schema v2 upgrade. Test `savePhoto` without blob. Test `deleteTrip` calls OPFS cleanup.
- `import-trip.test.ts` — Test that import writes to both OPFS and IndexedDB. Test orphan cleanup deletes OPFS files. Test quota error handling.

**E2E tests** (Playwright):
- Existing `e2e/import-trip.spec.ts` tests should pass unchanged (user-facing behavior is identical).
- Add a smoke test verifying photos are stored in OPFS (if Playwright supports OPFS inspection — otherwise verify via IndexedDB metadata lacking blob field).

---

## File Change Summary

| File | Change |
|---|---|
| `src/stores/photo-storage.ts` | **New** — OPFS read/write/delete operations |
| `src/types/trip.ts` | **Modify** — Remove `blob` from `Photo` |
| `src/stores/db.ts` | **Modify** — Schema v2, update `savePhoto`, add `getPhotosByIds`, update `deleteTrip` |
| `src/features/import/lib/import-trip.ts` | **Modify** — Write photos to OPFS + metadata to IndexedDB |
| `tests/stores/photo-storage.test.ts` | **New** — Unit tests |
| `tests/stores/db.test.ts` | **New** — Unit tests |
| `tests/features/import/lib/import-trip.test.ts` | **New** — Unit tests |

---

## Risks & Considerations

### 1. OPFS Quota Errors Surface Differently
**Impact:** Medium — OPFS quota errors may throw different exception types than IndexedDB.
**Mitigation:** The `writePhoto` function catches both `QuotaExceededError` and any `DOMException` with relevant names/messages and normalizes to `ImportError("QUOTA_EXCEEDED", ...)`. Needs testing with actual quota pressure.

### 2. Partial Write on Import Failure
**Impact:** Medium — If import crashes midway, some photos may be written to OPFS but no metadata saved.
**Mitigation:** This is the same risk as the current IndexedDB-only approach (partial writes possible). On re-import, orphan cleanup handles it. Acceptable for v1.

### 3. OPFS Directory Deletion Is Recursive
**Impact:** Low — The `removeEntry({ recursive: true })` API is used for trip deletion. Well-supported across browsers.
**Mitigation:** Straightforward API usage. Test with nested directories.

### 4. Testing OPFS in Vitest (Node.js)
**Impact:** Medium — OPFS is a browser API with no Node.js equivalent (unlike IndexedDB which has `fake-indexeddb`).
**Mitigation:** Mock the OPFS API surface in tests. The mock needs to simulate `navigator.storage.getDirectory()`, `FileSystemDirectoryHandle`, and `FileSystemFileHandle`. Keep the mock minimal — it only needs to track files in a Map. For true confidence, rely on E2E tests in real browsers.

### 5. Constitution Update Needed
**Impact:** Low — Per spec Open Question #2, the constitution says IndexedDB is the single persistence layer.
**Mitigation:** Update `.specify/memory/constitution.md` after this feature lands to mention OPFS as a second persistence layer for binary data.
