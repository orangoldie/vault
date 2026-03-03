# 02 — Move Photo Storage from IndexedDB to OPFS

## Overview

Move photo blob storage from IndexedDB to the Origin Private File System (OPFS), while keeping photo metadata (id, tripId, stepId, filename) in IndexedDB for querying. This separates structured data from binary file storage, improving import performance and keeping IndexedDB lightweight.

## Problem

Photo blobs are currently stored directly in IndexedDB alongside trip and step metadata. IndexedDB is not designed for large binary data — storing hundreds of travel photos (often 2–5 MB each) bloats the database, slows down writes during import, and degrades overall IndexedDB performance for metadata queries. As users import more trips with more photos, this will become increasingly noticeable.

## User Stories

1. **As a** user importing a trip, **I want** my photos to import quickly **so that** I don't have to wait a long time staring at a progress bar.
2. **As a** user with multiple imported trips, **I want** the app to stay fast and responsive **so that** accumulated data doesn't slow things down.
3. **As a** user re-importing a trip, **I want** old photos to be fully cleaned up **so that** my storage isn't wasted on orphaned files.

## Acceptance Criteria

- [ ] Photo blobs are stored as files in OPFS, not in IndexedDB
- [ ] Photo metadata (id, tripId, stepId, filename) remains in IndexedDB with the same query capabilities (lookup by tripId, by stepId)
- [ ] Importing a trip stores each photo as an individual file in OPFS, organized by trip and step
- [ ] Deleting a trip removes both its IndexedDB metadata and its OPFS photo files
- [ ] Re-importing a trip (same trip id) cleans up orphaned OPFS photo files that are no longer in the new import
- [ ] If the browser runs out of storage during photo writes, the user sees the same clear "not enough storage space" error as before
- [ ] A function exists to retrieve a photo by its metadata (tripId, stepId, filename) and return a usable Blob
- [ ] A photo file stored in OPFS can be read back and used to display an image (returns a valid Blob or File)
- [ ] If a photo's OPFS file is missing but its IndexedDB metadata exists, the app handles it gracefully (e.g., returns null or removes the orphaned metadata) rather than crashing
- [ ] All existing import behavior is preserved — progress reporting, error handling, upsert semantics, XSS sanitization — nothing changes from the user's perspective
- [ ] Works in latest Chrome, Firefox, and Safari (all support OPFS)

## Data Shape

### IndexedDB `photos` store (after migration)

The `photos` object store retains the same keys and indexes but no longer stores the `blob` field:

- `id` (string, key) — e.g., `"1-100-abc.jpg"`
- `tripId` (number, indexed)
- `stepId` (number, indexed)
- `filename` (string)

### OPFS file structure

Photo files are stored under a path derived from their metadata:

```
<opfs-root>/
  photos/
    <tripId>/
      <stepId>/
        <filename>
```

The OPFS path for a photo can always be derived from its IndexedDB metadata — no additional mapping is needed.

## Out of Scope

- Migrating existing IndexedDB photo data to OPFS (this is a v1 app — no users have production data to migrate yet)
- Thumbnail generation or image optimization
- Any changes to the import UI or user-facing flow
- Using OPFS Worker-based synchronous access handles (the async API is sufficient)
- Photo viewing or display UI (that's a separate future feature)
- Changing how trip or step data is stored — only photos move

## Decisions

1. **No data migration needed**: The app is pre-launch. No users have data that needs to be preserved across this change. A fresh IndexedDB schema (version bump) is acceptable.
2. **Async OPFS API only**: The synchronous `createSyncAccessHandle()` requires a Web Worker. The async API (`createWritable()`) works on the main thread and is sufficient for our needs. This avoids Worker complexity.
3. **File organization mirrors data relationships**: The `photos/<tripId>/<stepId>/<filename>` structure makes cleanup straightforward — deleting a trip means removing its entire `<tripId>/` directory.
4. **Shared storage quota**: OPFS and IndexedDB share the same browser storage quota. Moving blobs to OPFS does not grant additional space — the benefit is performance, not capacity.

## Open Questions

1. ~~**Safari OPFS `createWritable()` support**~~ — **Resolved.** Safari 26 (September 2025) added full support for `FileSystemWritableFileStream` and `createWritable()`. The async OPFS API now works across all major browsers. No Worker-based fallback needed.
2. **Constitution update**: The constitution currently lists IndexedDB as the single persistence layer. If this spec lands, OPFS becomes a second persistence layer. The constitution may need updating to reflect "IndexedDB + OPFS" as the storage story so future specs don't assume IndexedDB-only.
