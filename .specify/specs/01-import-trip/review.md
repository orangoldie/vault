# 01 — Import a Polarsteps Trip Export — Code Review

## Summary

**Approved with suggestions**

This is a solid, well-structured first feature. The code is clean, well-typed, and follows the constitution's principles. Tests pass (33/33), the state machine is sound, and the spec's acceptance criteria are largely met. There are a few medium-severity issues that should be addressed before moving on.

---

## Spec Compliance

| Acceptance Criteria | Status | Notes |
|---|---|---|
| File picker for `.zip` | ✅ | |
| ZIP extraction in-browser | ✅ | fflate `unzipSync` |
| Multi-trip: earliest `start_date` | ✅ | With alphabetical fallback |
| Parse `trip.json` metadata | ✅ | |
| Parse steps from `all_steps[]` | ✅ | |
| Read photos from step dirs | ✅ | |
| Persist to IndexedDB | ✅ | |
| Progress indicator | ✅ | Determinate, 3-phase |
| Success summary | ✅ | Trip name, steps, photos, dates, km |
| Error messages (invalid ZIP, missing trip.json, etc.) | ✅ | All 7 codes covered |
| Storage quota error | ✅ | Catches `QuotaExceededError` |
| Safe upsert (re-import) | ✅ | Old data preserved on failure, orphans cleaned |
| XSS sanitization | ✅ | HTML tags stripped |
| RTL/LTR text | ✅ | `dir="auto"` + `<bdi>` |
| 500 MB file size warning | ✅ | Confirmation dialog |
| **Web Worker for photo storage** | ❌ | **Not implemented** — see below |
| **Component/E2E tests** | ❌ | **Not implemented** — only unit tests for lib + db |

### Gaps

1. **No Web Worker** — The plan explicitly calls for photo blob storage in a Web Worker to avoid blocking the main thread (plan.md Step 4, lines 7+). The current implementation stores photos sequentially on the main thread (`import-trip.ts:50-80`). For trips with hundreds of large photos, this will freeze the UI.

2. **No component tests or E2E tests** — The plan specifies component tests (Step 7b) and a Playwright E2E test. Only unit tests for lib functions and the DB layer exist. The spec says "No feature ships without tests" and the plan calls for testing each UI component and the full import flow.

---

## Pros

- **Clean type system**: Discriminated union for `ImportState`, separate raw/domain types, proper error class with typed codes. The types are the backbone of this feature and they're well-designed.
- **Safe re-import strategy**: Using `put` (upsert) instead of delete-then-insert means a failed mid-import never destroys existing data. Orphan cleanup only runs after full success. This is exactly right.
- **Solid HTML sanitization**: `sanitizeText` strips tags at parse-time, not render-time. The risk surface is small because data never touches `dangerouslySetInnerHTML`.
- **Good accessibility foundations**: `aria-live` on progress, `dir="auto"` + `<bdi>` on user text, `aria-label` on hidden file input, focus management via ref.
- **Reduced motion support**: Full implementation — detects `prefers-reduced-motion` and swaps Framer Motion variants to instant transitions.
- **Test coverage on logic**: The lib functions and IndexedDB store have meaningful tests that verify behavior (not implementation). Orphan cleanup, failure recovery, and multi-trip selection are all tested.
- **Follows conventions**: kebab-case files, PascalCase components, named exports, `@/` imports, import grouping, Tailwind-only styling, `"use client"` only where needed.

---

## Cons / Issues

### Must Fix (Medium)

**M1. `unzipSync` loads entire ZIP into memory**
`extract-zip.ts:9-11` — The plan specifically calls for fflate's streaming/callback `unzip` API to process entries one at a time. The implementation uses `unzipSync` which decompresses the entire archive into memory at once. For a 500 MB ZIP with hundreds of photos, this could easily consume 1-2 GB of RAM and crash the browser tab.

> **File:** `src/features/import/lib/extract-zip.ts:9-11`
> **Fix:** Switch to the async `unzip()` callback API from fflate, or at minimum add a comment justifying why sync was chosen.

**M2. Photos stored on main thread — no Web Worker**
`import-trip.ts:50-80` — The plan explicitly states "Photo storage is delegated to a Web Worker to avoid blocking the main thread" (plan.md, Step 4, line 7). The current implementation runs a sequential `for` loop on the main thread, calling `savePhoto` for each photo. For 200+ photos, the UI will be unresponsive during import despite the progress bar updating.

> **File:** `src/features/import/lib/import-trip.ts:50-80`
> **Fix:** Move photo blob creation + IndexedDB writes into a Web Worker that posts progress back via `postMessage`. This was a deliberate architectural decision in the plan.

**M3. `Blob` creation uses unsafe `as ArrayBuffer` cast**
`import-trip.ts:56` — `entry.data.slice().buffer as ArrayBuffer` is not guaranteed to be an `ArrayBuffer` — it could be a `SharedArrayBuffer`, and `slice()` on a `Uint8Array` returns a new `Uint8Array` whose `.buffer` may have a non-zero `byteOffset`. The `Blob` constructor accepts `Uint8Array` directly.

> **File:** `src/features/import/lib/import-trip.ts:56`
> **Fix:** `new Blob([entry.data], { type: "image/jpeg" })` — simpler and correct.

**M4. `formatDateRange` is duplicated**
`import-summary.tsx:14-35` and `trip-list.tsx:13-28` contain two slightly different implementations of the same date formatting logic. The summary version handles cross-year ranges; the trip-list version doesn't show the start year at all. This divergence will cause inconsistent date display.

> **Files:** `src/features/import/components/import-summary.tsx:14-35`, `src/features/import/components/trip-list.tsx:13-28`
> **Fix:** Extract to a shared utility in `src/lib/` or `src/features/import/lib/`.

**M5. Trip list photo count shows wrong data**
`trip-list.tsx:59` — The trip card shows `"imported"` or `"no photos"` based on `trip.stepCount > 0`, which has nothing to do with photos. The `Trip` type doesn't store a photo count, so there's no way to display it from the trip record alone.

> **File:** `src/features/import/components/trip-list.tsx:59`
> **Fix:** Either add `photoCount` to the `Trip` interface (stored at import time) or query the photo store count from IndexedDB. Using `stepCount` as a proxy is misleading.

**M6. `handleFileSelected` has a stale closure over `startImport`**
`import-flow.tsx:66-75` — `handleFileSelected` is wrapped in `useCallback` with an empty dependency array, but it calls `startImport` which is a regular function that captures current state. The `useCallback` memoization means `startImport` could reference stale closures. While it works today because `startImport` doesn't read state synchronously, it's fragile.

> **File:** `src/features/import/components/import-flow.tsx:66-75`
> **Fix:** Either include `startImport` in the dependency array (and memoize it), or use `useRef` for the import function, or convert to a non-memoized handler since this isn't in a hot render path.

**M7. Dead code in progress callback**
`import-flow.tsx:91-94` — The `onProgress` callback contains a no-op `if` block that checks for `progress.phase === "reading"` with a comment "Trip name will be set when we get the result." This is dead code that adds confusion.

> **File:** `src/features/import/components/import-flow.tsx:91-94`
> **Fix:** Remove the dead conditional block.

---

## Performance

- **M1 (sync unzip) is the main risk.** For large ZIPs this will spike memory and block the main thread during extraction.
- **M2 (no worker) means the UI freezes** during photo storage on trips with many photos.
- Photo-by-photo IndexedDB writes (`savePhoto` per photo) open a new transaction each time. Batching into chunks (e.g., 10-20 photos per transaction) would significantly reduce overhead.
- `getPhotosByTrip` before import (line 40) fetches all existing photo keys. For a trip with thousands of photos, this could be slow. Not critical for v1 but worth noting.

---

## Suggestions (nice-to-have, non-blocking)

- The `confirm-large-file` dialog (`import-flow.tsx:190-213`) uses raw `<button>` elements with inline Tailwind instead of the `Button` component used everywhere else. Use `Button` for consistency.
- `sanitizeText` (`parse-trip.ts:9`) uses a regex to strip HTML tags. This works for the threat model (imported data, not user input), but a note in the comment explaining why a regex is sufficient (vs. DOMParser) would be helpful.
- Consider adding `aria-describedby` on the Import button to link it to the helper text below it.
- The `loadTrips` error handler (`import-flow.tsx:50-52`) silently swallows all errors. A `console.error` would help debugging without affecting UX.

---

## Verdict

**Approved with suggestions.** The feature is well-built and meets most of the spec. The two main concerns are:

1. **`unzipSync` instead of async/streaming extraction** (M1) — real memory risk for large files
2. **No Web Worker for photo storage** (M2) — UI will freeze on large imports

These were deliberate architectural decisions in the plan that didn't make it into the implementation. They should be addressed before shipping, especially since the spec explicitly supports imports over 500 MB. The remaining issues (M3-M7) are lower risk but worth fixing for correctness and maintainability.

All 33 unit tests pass. Component and E2E tests are still needed per the plan.
