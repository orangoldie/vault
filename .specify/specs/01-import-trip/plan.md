# 01 — Import a Polarsteps Trip Export — Implementation Plan

## Architecture

### How it fits

This is the first feature and the first code in the project. We need to:

1. **Initialize the Next.js project** with the full tech stack (TypeScript, Tailwind v4, shadcn/ui, Framer Motion, Vitest, Playwright)
2. **Build the import feature** as a feature module in `src/features/import/`
3. **Set up IndexedDB persistence** in `src/stores/`
4. **Wire everything into the home page** at `src/app/page.tsx`

The home page is a single-view state machine with four states: `idle` (empty/prompt), `importing`, `success`, `error`. No routing needed — all states render in the same viewport.

### Key architectural decisions

- **State machine**: A simple React `useState` or `useReducer` in a client component manages the four import states. No external state library needed for this feature.
- **ZIP parsing**: Use `fflate` (lightweight, fast, modern zip library) to extract the ZIP file in-browser. Standard `<input type="file" accept=".zip">` for file selection — works across all browsers.
- **IndexedDB via idb**: Use the lightweight `idb` wrapper (typed Promise-based IndexedDB). No heavy ORM needed.
- **Photo storage**: Store photo blobs directly in IndexedDB. Each photo gets its own record keyed by a composite of `tripId + stepId + filename`.
- **ZIP extraction**: Use `fflate`'s streaming/callback API (`unzip`) to process entries one at a time instead of loading the entire ZIP into memory. This keeps memory usage proportional to a single file, not the entire archive.
- **Import logic**: Photo storage (the slow part) runs in a **Web Worker** to avoid blocking the main thread. The worker stores blobs to IndexedDB and posts progress messages back. ZIP extraction and JSON parsing happen on the main thread (they're fast).

## Data Model

### IndexedDB Schema (database: `polarsteps-vault`, version 1)

**Store: `trips`** (keyPath: `id`)

```typescript
interface Trip {
  id: number
  name: string
  slug: string
  startDate: number        // Unix timestamp
  endDate: number          // Unix timestamp
  summary: string
  coverPhotoId: string | null     // Photo record ID (`${tripId}-${stepId}-${filename}`) resolved from cover_photo.path
  stepCount: number
  totalKm: number
  uuid: string
  importedAt: number       // When we imported it
}
```

**Store: `steps`** (keyPath: `id`, index: `tripId`)

```typescript
interface Step {
  id: number
  tripId: number
  displayName: string
  description: string | null
  slug: string
  startTime: number        // Unix timestamp
  endTime: number | null
  location: {
    name: string
    detail: string          // Country or region (e.g., "Israel", "Thailand")
    fullDetail: string
    countryCode: string
    lat: number
    lon: number
  }
  weatherCondition: string | null
  weatherTemperature: number | null
  uuid: string
}
```

**Store: `photos`** (keyPath: `id`, index: `tripId`, index: `stepId`)

```typescript
interface Photo {
  id: string               // `${tripId}-${stepId}-${filename}`
  tripId: number
  stepId: number
  filename: string
  blob: Blob
}
```

## Implementation Steps

### Step 0: Project initialization

- `pnpm create next-app` with TypeScript, Tailwind v4, App Router, `@/` alias
- Configure `tsconfig.json` with `strict: true`
- Install dependencies: `framer-motion`, `idb`, `fflate`, `lucide-react`
- Install dev dependencies: `fake-indexeddb`, `@types/web` (for Web Worker types if needed)
- Initialize shadcn/ui (`pnpm dlx shadcn@latest init`)
- Add shadcn components: `button`, `progress`
- Set up Vitest config
- Set up Playwright config
- Apply the design system colors/typography to the Tailwind theme (CSS variables for light/dark mode)
- Add Inter font via `next/font/google`
- Create the project folder structure (`src/features/`, `src/stores/`, `src/types/`, `src/lib/`)

**Depends on**: nothing

### Step 1: TypeScript types

Create shared types in `src/types/`:

- `src/types/trip.ts` — `Trip`, `Step`, `Photo` interfaces (app-level, not raw JSON)
- `src/types/polarsteps-export.ts` — types for the raw Polarsteps JSON structure (`RawTrip`, `RawStep`)
- `src/types/import.ts` — import state types (`ImportState`, `ImportProgress`, `ImportError` including `INVALID_ZIP`, `QUOTA_EXCEEDED`)

**Depends on**: Step 0

### Step 2: IndexedDB store

Create `src/stores/db.ts`:

- Initialize the database with `idb` (`openDB`)
- Define the schema (trips, steps, photos stores with indexes)
- Export typed CRUD functions:
  - `saveTrip(trip: Trip): Promise<void>`
  - `saveSteps(steps: Step[]): Promise<void>`
  - `savePhoto(photo: Photo): Promise<void>`
  - `getTrip(id: number): Promise<Trip | undefined>`
  - `getAllTrips(): Promise<Trip[]>`
  - `deleteTrip(id: number): Promise<void>` (for upsert — delete old data before re-import)

**Depends on**: Step 1

### Step 3: ZIP extraction & parsing logic

Create `src/features/import/lib/`:

- `extract-zip.ts` — uses `fflate`'s callback-based `unzip` API to decompress the ZIP `File` in-browser. Processes entries via a callback instead of loading the entire archive into memory. For metadata files (`trip.json`), returns the parsed content. For photo files, yields entries one at a time for streaming storage. Throws `INVALID_ZIP` on corrupt/non-ZIP files.
- `parse-trip.ts` — finds `trip.json` files inside `trip/*/trip.json` in the extracted entries. If multiple trips exist, selects the one with the earliest `start_date` (falls back to alphabetical directory name). Validates required fields. Sanitizes all user-generated text fields (trip name, step names, descriptions) — strips HTML tags and ensures plain text only. Returns parsed trip metadata + steps. Throws typed errors (`MISSING_TRIP_JSON`, `MALFORMED_JSON`, `EMPTY_TRIP`).
- `collect-photos.ts` — scans the file map for photo files matching `trip/*/<step-slug>_<step-id>/photos/*`. Returns photo entries grouped by step ID.

**Depends on**: Step 1

### Step 4: Import orchestrator

Create `src/features/import/lib/import-trip.ts`:

- Orchestrates the full import flow:
  1. Check file size — if > 500 MB, emit a warning event (UI shows confirmation dialog before proceeding)
  2. Extract ZIP file using `fflate` (streaming, entry-by-entry)
  3. Parse trip.json → extract trip + steps (with text sanitization)
  4. Resolve `cover_photo.path` to a photo record ID by matching it against the step directory structure
  5. Save trip metadata to IndexedDB (`put` — overwrites if exists)
  6. Save all steps to IndexedDB (`put` — overwrites if exists)
  7. For each photo file: convert `Uint8Array` to blob, save to IndexedDB (`put`), report progress. Photo storage is delegated to a Web Worker to avoid blocking the main thread.
  8. On success: delete any orphaned photos from a previous import of this trip ID (photos that existed before but are not in the new import)
- **Safe upsert**: Old data is never deleted before the new import succeeds. Steps 5–7 use `put` (upsert by key). If import fails midway, the old trip/steps remain valid — only some new photos may have been added, which get cleaned up on the next successful import.
- Catches `QuotaExceededError` from IndexedDB and throws a typed `QUOTA_EXCEEDED` error
- Accepts a progress callback: `(progress: ImportProgress) => void`
- Returns `ImportResult` (trip name, step count, photo count, date range, total km)

**Depends on**: Steps 2, 3

### Step 5: UI components

Create `src/features/import/components/`:

- `import-prompt.tsx` — Empty state with welcome message and "Import Trip" button. Client component. Uses `<input type="file" accept=".zip">` for file selection.
- `import-progress.tsx` — Progress bar, trip name, counter text. Client component.
- `import-summary.tsx` — Success state with stats card and action buttons. Client component.
- `import-error.tsx` — Error state with message and "Try Again" button. Client component.

All components follow the design system (colors, typography, spacing, icons from design.md). Use Framer Motion for crossfade transitions between states. Respect `prefers-reduced-motion`.

**Depends on**: Step 0 (design system setup)

### Step 6: Home page integration

Wire everything together in `src/app/page.tsx`:

- Server component shell with centered layout (max-w ~480px, vertical centering)
- Client component `ImportFlow` that manages the state machine:
  - `idle` → shows `ImportPrompt`
  - `importing` → shows `ImportProgress`
  - `success` → shows `ImportSummary`
  - `error` → shows `ImportError`
- Handles transitions between states
- Manages focus for accessibility (focus heading after state change)
- Includes `aria-live` region for screen reader announcements

**Depends on**: Steps 4, 5

### Step 7a: Unit tests (logic)

- **Unit tests** (Vitest):
  - `extract-zip.test.ts` — valid ZIP extraction, invalid file, corrupt ZIP
  - `parse-trip.test.ts` — valid trip parsing, missing trip.json, malformed JSON, empty trip, multi-trip selection (earliest start_date), HTML sanitization of text fields
  - `collect-photos.test.ts` — photo collection from step directories
  - `import-trip.test.ts` — full import flow with mocked IndexedDB, quota exceeded handling, safe upsert (old data preserved on failure), orphan photo cleanup on success, file size warning threshold
  - `db.test.ts` — IndexedDB CRUD operations (using `fake-indexeddb`)

**Depends on**: Steps 2, 3, 4 (can be written alongside these steps)

### Step 7b: Component & E2E tests

- **Component tests** (Vitest + React Testing Library):
  - Each UI component: renders correctly, handles interactions
  - `ImportFlow` integration: state transitions work correctly
- **E2E test** (Playwright):
  - Full import flow: select ZIP → progress → success summary

**Depends on**: Step 6

## Risks & Considerations

### ZIP file size
- The ZIP is extracted using `fflate`'s callback API, processing entries one at a time to avoid loading the entire archive into memory. For ZIPs over 500 MB, the UI warns the user before proceeding. If the browser runs out of memory during extraction, a clear error is shown.

### Browser compatibility
- ZIP file selection via `<input type="file" accept=".zip">` works across all modern browsers. No browser-specific fallbacks needed.

### Large imports
- The sample data has trips with 50+ steps and potentially hundreds of photos. Storing all photo blobs in IndexedDB can use significant storage. IndexedDB has no hard limit, but browsers may prompt the user for permission on large storage. If quota is exceeded, we catch `QuotaExceededError` and show a clear error message.

### Photo file naming
- Photo filenames use UUID-based names with a `.jpg.jpg` double extension (observed in sample data). The import must handle any filename — just store whatever is in the `photos/` directory.

### Step-to-folder matching
- Step directories in the ZIP use the pattern `<step-slug>_<step-id>/`. We match steps from `all_steps[]` to their directories by step ID (the number after the underscore). If a step has no matching directory, it simply has no photos.

### Re-import (safe upsert)
- When re-importing a trip, we use `put` (upsert by key) for all records — trip, steps, and photos are overwritten in place. Old data is never deleted before the new import succeeds. After a successful import, orphaned photos from the previous import (photos whose keys no longer exist in the new data) are cleaned up. If the import fails midway, the original data remains intact.

### IndexedDB in tests
- Use `fake-indexeddb` package for unit testing IndexedDB operations. For E2E tests, Playwright uses a real browser with real IndexedDB.

### RTL text
- Trip names and descriptions from the sample data include Hebrew text. All user-generated text elements use `dir="auto"` and `text-align: start`. Mixed-direction text uses `<bdi>` elements.

### Multi-trip ZIP
- A Polarsteps export ZIP may contain multiple trip directories under `trip/`. In v1, we import the trip with the earliest `start_date` (falling back to alphabetical directory name order). Future versions may let the user choose.

### Main thread blocking
- Photo blob storage is the slowest part of import and can freeze the UI if done on the main thread. Photo storage is delegated to a Web Worker that communicates progress back via `postMessage`. ZIP extraction and JSON parsing remain on the main thread (they're fast enough).

### Text sanitization
- All user-generated text from the ZIP (trip names, step names, descriptions) is rendered as plain text only. The `parse-trip.ts` module strips any HTML tags during parsing. Components must never use `dangerouslySetInnerHTML` or equivalent with imported data.

### No-photos fast path
- Per the design, if import completes in < 1 second (e.g., a trip with no photos like the sample Hebrew trip), skip the progress view and go straight to success.
