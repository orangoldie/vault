# 02 — Move Photo Storage from IndexedDB to OPFS — Code Review

## Summary

**Approved with suggestions** — The implementation is clean, well-structured, and faithfully follows the spec. The OPFS storage module is properly encapsulated, the import pipeline correctly writes to both OPFS and IndexedDB, and the orphan cleanup logic is sound. There are a few issues to address: missing unit tests (a hard constraint violation), a potential data consistency concern in the import pipeline, and minor robustness improvements.

---

## Spec Compliance

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Photo blobs stored in OPFS, not IndexedDB | Pass | `writePhoto()` writes to OPFS; `savePhoto()` stores metadata only |
| Photo metadata remains in IndexedDB with same query capabilities | Pass | Same indexes (tripId, chapterId) preserved |
| Importing stores each photo as individual OPFS file, organized by trip/chapter | Pass | `photos/<tripId>/<chapterId>/<filename>` structure |
| Deleting a trip removes IndexedDB metadata + OPFS files | Pass | `deleteTrip()` calls `deletePhotosByTrip()` |
| Re-import cleans up orphaned OPFS files | Pass | Fetches orphan metadata via `getPhotosByIds()`, then `deletePhotoFiles()` |
| Quota error shows clear message | Pass | Catches `QuotaExceededError` and message-based detection |
| Function exists to retrieve photo by metadata | Pass | `readPhoto(tripId, chapterId, filename)` returns `Blob \| null` |
| Graceful handling of missing OPFS file | Pass | `readPhoto()` returns `null` on any error |
| All existing import behavior preserved | Pass | Progress reporting, error handling, upsert semantics unchanged |
| **Unit tests** | **Fail** | **No unit tests exist.** Plan specifies `photo-storage.test.ts`, `db.test.ts`, and `import-trip.test.ts` — none were created |

---

## Code Quality

### `src/stores/photo-storage.ts` — Good

- Clean, focused module with a single responsibility. No other module touches OPFS directly — good encapsulation.
- `getPhotosRoot()` lazy caching is a nice pattern; avoids repeated async lookups.
- `resetPhotosRoot()` export for testing is appropriate.
- `getOrCreateDir()` helper is simple and effective.

### `src/stores/db.ts` — Good

- Schema upgrade logic (`oldVersion < 1` / `oldVersion >= 1 && oldVersion < 2`) is correct and handles both fresh installs and upgrades.
- `getPhotosByIds()` correctly fetches metadata before orphan deletion (avoiding ID string parsing as the plan specifies).

- `deleteTrip()` properly cleans up OPFS after the IndexedDB transaction completes.

### `src/features/import/lib/import-trip.ts` — Good

- Import flow is clear and well-structured.
- Orphan cleanup logic at lines 98-104 correctly fetches full metadata before OPFS deletion.
- Progress reporting remains unchanged.

### `src/types/trip.ts` — Good

- `Photo` interface is clean metadata-only shape as specified.

---

## Potential Bugs

### 1. OPFS write succeeds but IndexedDB metadata write fails (must fix)

**File:** `src/features/import/lib/import-trip.ts:60-69`

If `writePhoto()` succeeds but `savePhoto()` throws, the photo binary exists in OPFS with no corresponding metadata. On re-import, orphan cleanup only knows about photos that have IndexedDB records — so these orphaned OPFS files would never be cleaned up.

**Severity:** Medium — This is the same partial-write risk the plan acknowledges (Risk #2), and re-import _of the same trip_ would overwrite the file. However, if the import is abandoned entirely, the OPFS file lingers forever.

**Suggestion:** Wrap both writes so that if `savePhoto()` fails, the OPFS file is removed:

```typescript
try {
  await writePhoto(entry.tripId, entry.chapterId, entry.filename, data)
} catch (err) {
  // ...quota handling...
}

try {
  await savePhoto({ id: photoId, tripId: entry.tripId, chapterId: entry.chapterId, filename: entry.filename })
} catch (err) {
  // Best-effort cleanup of the OPFS file we just wrote
  await deletePhotoFiles([{ tripId: entry.tripId, chapterId: entry.chapterId, filename: entry.filename }]).catch(() => {})
  throw err
}
```

### 2. `writePhoto` passes a potentially detached ArrayBuffer (nice to have)

**File:** `src/stores/photo-storage.ts:30`

```typescript
await writable.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer)
```

The `data.buffer` reference accesses the underlying `ArrayBuffer` which may be larger than the `Uint8Array` view if the original buffer was a slice. The `.slice()` call handles this correctly, but the `as ArrayBuffer` cast is technically unnecessary — `ArrayBuffer.prototype.slice` already returns `ArrayBuffer`. Minor nit; no runtime risk.

### 3. `deleteTrip` OPFS cleanup happens after IndexedDB transaction (nice to have)

**File:** `src/stores/db.ts:128-129`

If `deletePhotosByTrip()` fails (e.g., browser bug, permission issue), the trip metadata is already deleted from IndexedDB but OPFS files remain orphaned. This is acceptable for v1 (and the inverse ordering has the same problem in reverse), but worth noting.

---

## Performance

### No concerns for v1

- Photos are written sequentially in a `for` loop, which is correct — parallel OPFS writes could cause contention and are not guaranteed to be faster.
- `getPhotosByIds()` uses individual `db.get()` calls in a loop (lines 104-108 in `db.ts`). For small orphan sets this is fine. If re-imports regularly produce hundreds of orphans, a single transaction with a cursor would be more efficient — but premature to optimize now.

---

## Suggestions

### Must Fix

1. **Add unit tests** — The plan explicitly calls for `photo-storage.test.ts`, `db.test.ts`, and `import-trip.test.ts`. The constitution states "No feature ships without tests" as a hard constraint. At minimum:
   - `photo-storage.test.ts`: Mock OPFS APIs, test write/read/delete flows, test missing file returns null
   - `import-trip.test.ts`: Test that import writes to both OPFS and IndexedDB, test orphan cleanup, test quota error handling

2. **Handle IndexedDB write failure after OPFS write** — See Potential Bug #1 above. Best-effort cleanup prevents permanent orphans.

### Nice to Have

3. **E2E test for OPFS storage** — The plan mentions adding a smoke test verifying photos are in OPFS (or at least that IndexedDB metadata lacks a blob field). The existing E2E tests pass because user-facing behavior is unchanged, but a verification that the storage split actually happened would increase confidence.

4. **Simplify `writePhoto` buffer handling** (`photo-storage.ts:30`) — Could be simplified to:
   ```typescript
   await writable.write(data)
   ```
   `FileSystemWritableFileStream.write()` accepts `BufferSource` directly (which includes `Uint8Array`). The manual `.buffer.slice()` is defensive but unnecessary — `data` in `import-trip.ts:58` is already a fresh copy via `.slice()`.

5. **E2E cleanup should also clear OPFS** — `e2e/import-trip.spec.ts` beforeEach only clears IndexedDB. After this change, OPFS may retain files from previous test runs. Add:
   ```typescript
   await page.evaluate(async () => {
     const root = await navigator.storage.getDirectory()
     for await (const name of root.keys()) {
       await root.removeEntry(name, { recursive: true })
     }
   })
   ```

---

## Verdict

**Approved with suggestions.** The core implementation is solid and spec-compliant. The OPFS module is well-encapsulated, the import pipeline is clean, and the schema migration is correct.

**Blocking issue:** Unit tests must be added before shipping — this is a hard constraint per the constitution. The OPFS write → IndexedDB write consistency issue (suggestion #2) should also be addressed.

Everything else is minor polish. Good work.
