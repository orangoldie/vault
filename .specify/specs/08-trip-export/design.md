# 08 — Static Trip Export: Design Plan

## Vision

Let travelers take their trip with them — permanently. A single "Export" action produces a self-contained ZIP that, when unzipped and opened in any browser, renders the trip exactly as it appears in the app: interactive globe, animated chapter transitions, photo lightbox, everything. No server, no internet, no dependencies. The exported trip is a standalone artifact the user owns forever, immune to service shutdowns, API deprecations, or browser storage evictions.

This is the ultimate expression of Journey Vault's core promise: **your memories, fully yours.**

---

## User Flow

1. User is viewing a trip at `/trip/[slug]`.
2. User clicks the **Export** button in the trip toolbar area (top-right, alongside any existing actions).
3. An export progress dialog appears, showing real-time status:
   - "Packaging map assets..."
   - "Exporting photos..." (with count: 45 / 312)
4. The browser triggers a ZIP download: `<trip-name>.zip` (slugified).
5. The dialog shows a success state with file size and instructions: *"Unzip and open index.html in your browser."*
6. User unzips the file, double-clicks `index.html`, and sees their trip — fully interactive, fully offline.

---

## Architecture

### The `file://` Problem

When a user double-clicks `index.html`, the browser opens it via the `file://` protocol. This blocks:

- **`fetch()`** — browsers enforce CORS restrictions, blocking network-style requests to local files
- **Web Workers** — `new Worker("./file.js")` is blocked from `file://` origins
- **ES modules** — `<script type="module">` with relative imports fails

What **does** work from `file://`:

- `<img src="./relative/path.jpg">` — image tags with relative paths load fine
- `<script src="./relative/path.js">` — classic script tags execute normally
- Inline `<script>` and `<style>` blocks — always work
- `new Worker(URL.createObjectURL(blob))` — blob-URL workers bypass the file restriction

### Solution: Script-Tag Asset Loading + Blob Workers

The export uses two strategies to work around `file://` limitations:

1. **Binary assets (PMTiles, fonts, sprites) are encoded as base64 strings inside `.js` files.** The HTML loads them via `<script src="./assets/globe-data.js">`, which works from `file://`. Each script registers its data into a global asset registry (`window.__VAULT_ASSETS__`). At boot, the viewer decodes base64 to `ArrayBuffer` and serves them to MapLibre via custom protocol handlers.

2. **MapLibre's web worker source is inlined as a string and loaded via `URL.createObjectURL()`.** This creates a blob-URL worker, which browsers allow even from `file://`.

3. **Photos stay as separate image files** in the ZIP, referenced by `<img src="./photos/...">` — which works natively from `file://`.

4. **Trip data is embedded in the HTML** as `window.__VAULT_DATA__ = { trip, chapters, photos }` inside a `<script>` tag. No fetch needed.

### Standalone Viewer Bundle

The current app is a Next.js App Router application — its built output cannot run standalone. The export uses a **separate viewer bundle**: a plain React SPA (no Next.js, no router) that renders the trip detail experience from embedded data.

**Code reuse strategy:** The viewer imports the same trip-detail components (`TripDetailPage`, `HeroCover`, `TripSummary`, `ChapterSection`, `TripGlobe`, `PhotoLightbox`, etc.) but wraps them in a different data layer:

- A `StaticPhotoProvider` context that resolves photo IDs to relative file paths (`./photos/<chapterId>/<filename>`) instead of OPFS blob URLs
- A `StaticMapProvider` that registers custom MapLibre protocol handlers serving from the in-memory asset registry
- A thin `ExportViewer` root component that reads `window.__VAULT_DATA__` and passes props to `TripDetailPage`

**Build:** A separate Vite config (`vite.export.config.ts`) bundles the viewer entry point into:
- `export-viewer.js` — single JS bundle (React, Framer Motion, MapLibre, all components)
- `export-viewer.css` — extracted Tailwind styles

These are built during `pnpm build` (as a post-build step) and placed in `public/export/`. The export assembler reads them at runtime via `fetch("/export/export-viewer.js")`.

**Estimated viewer bundle size:** ~500KB–1MB minified. Compresses well inside the ZIP.

---

## ZIP Structure

```
<trip-name>/
├── index.html                     # Lightweight shell: meta tags, script/link tags, mount point
├── assets/
│   ├── viewer.js                  # Standalone React viewer bundle
│   ├── viewer.css                 # Extracted Tailwind + component styles
│   ├── globe-data.js              # PMTiles binary as base64 (~20MB)
│   ├── map-fonts.js               # All PBF glyph files as base64 map (~16MB)
│   ├── map-sprites.js             # Sprite JSON + PNGs as base64 (< 100KB)
│   └── maplibre-worker.js         # MapLibre worker source (loaded as blob URL)
├── photos/
│   ├── cover/
│   │   └── cover.jpg              # Cover photo (if present)
│   └── <chapterId>/
│       ├── photo-001.jpg
│       ├── photo-002.jpg
│       └── ...
├── data/
│   └── trip.json                  # Structured trip data (trip, chapters, photos) for power users
└── fonts/                         # App display fonts (Cormorant, Outfit) as WOFF2
    ├── cormorant-v11-latin.woff2
    └── outfit-v11-latin.woff2
```

### `index.html` Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{trip.name} — Journey Vault</title>

  <!-- App display fonts (self-hosted WOFF2) + CSS variable wiring -->
  <style>
    @font-face { font-family: 'Cormorant'; src: url('./fonts/cormorant-v11-latin.woff2') format('woff2'); }
    @font-face { font-family: 'Outfit'; src: url('./fonts/outfit-v11-latin.woff2') format('woff2'); }
    :root {
      --font-display: 'Cormorant', serif;
      --font-body: 'Outfit', sans-serif;
    }
  </style>

  <!-- Viewer styles -->
  <link rel="stylesheet" href="./assets/viewer.css">
</head>
<body>
  <div id="vault-root"></div>

  <!-- Trip data — embedded, no fetch required -->
  <script>
    window.__VAULT_DATA__ = {
      trip: { /* serialized Trip object */ },
      chapters: [ /* serialized Chapter[] */ ],
      photos: [ /* serialized Photo[] with relative paths */ ]
    };
    window.__VAULT_ASSETS__ = {};
  </script>

  <!-- Map assets — loaded via script tags (works from file://) -->
  <script src="./assets/globe-data.js"></script>
  <script src="./assets/map-fonts.js"></script>
  <script src="./assets/map-sprites.js"></script>

  <!-- MapLibre worker source (viewer reads this and creates blob URL) -->
  <script src="./assets/maplibre-worker.js"></script>

  <!-- Viewer app — boots after all data is available -->
  <script src="./assets/viewer.js"></script>
</body>
</html>
```

### Asset Data File Format

Each map asset JS file registers data into the global registry:

```javascript
// globe-data.js
window.__VAULT_ASSETS__["pmtiles:globe"] = "base64encodedstring...";

// map-fonts.js
window.__VAULT_ASSETS__["font:Noto Sans Regular/0-255.pbf"] = "base64...";
window.__VAULT_ASSETS__["font:Noto Sans Regular/256-511.pbf"] = "base64...";
// ... all glyph ranges for all 3 font faces

// map-sprites.js
window.__VAULT_ASSETS__["sprite:light.json"] = "base64...";
window.__VAULT_ASSETS__["sprite:light.png"] = "base64...";
window.__VAULT_ASSETS__["sprite:light@2x.json"] = "base64...";
window.__VAULT_ASSETS__["sprite:light@2x.png"] = "base64...";

// maplibre-worker.js
window.__VAULT_ASSETS__["maplibre:worker"] = "raw worker source string...";
```

---

## Export Process (Client-Side)

The export assembler runs entirely in the browser. Orchestrated by a single async function `exportTrip(tripId)` in `src/features/export/lib/export-trip.ts`.

### Step-by-Step

#### 1. Gather Trip Data

```typescript
const trip = await getTrip(tripId)          // from IndexedDB
const chapters = await getChaptersByTrip(tripId) // from IndexedDB
const photos = await getPhotosByTrip(tripId)     // metadata from IndexedDB
```

Serialize to plain JSON. Photo metadata is augmented with relative file paths for the viewer: `./photos/${photo.chapterId}/${photo.filename}`.

**Progress:** Instant — IndexedDB reads are fast. No progress update needed.

#### 2. (Photos are read during ZIP streaming — see step 7)

Photo reading is merged with ZIP assembly to avoid holding all photo data in memory. There is no separate "read all photos" phase.

#### 3. Read Map Assets

Fetch the map assets from the app's own `/public/` directory (served by Next.js dev server or static hosting):

```typescript
const globe = await fetch("/map-assets/textures/globe.pmtiles").then(r => r.arrayBuffer())
const fontFiles = await fetchAllFontFiles()   // glob known font paths
const spriteFiles = await fetchAllSpriteFiles() // 4 files
```

Each binary is base64-encoded and wrapped in a JS assignment string: `window.__VAULT_ASSETS__["key"] = "base64...";`

**Font file discovery:** The font directory structure is known (3 faces × N glyph ranges). The assembler fetches the font manifest or iterates known ranges. A simpler approach: fetch the font directory listing via a small API route (or hardcode the known ranges based on the PBF files present in the build).

Since we're client-side only (v1), the most pragmatic approach is to **maintain a manifest of map asset paths** in `src/features/export/lib/map-asset-manifest.ts` — a static list of all files under `/public/map-assets/`. This file is generated at build time by a script that scans the directory.

**Progress:** "Packaging map assets..." — single phase, quick (assets are local, not network).

#### 4. Read Viewer Bundle

```typescript
const viewerJs = await fetch("/export/export-viewer.js").then(r => r.text())
const viewerCss = await fetch("/export/export-viewer.css").then(r => r.text())
```

#### 5. Read Display Fonts

The app uses Google Fonts (Cormorant, Outfit) loaded via `next/font`. For the export, we need self-hosted WOFF2 files. These are pre-bundled in `public/export/fonts/` at build time.

```typescript
const cormorant = await fetch("/export/fonts/cormorant-v11-latin.woff2").then(r => r.arrayBuffer())
const outfit = await fetch("/export/fonts/outfit-v11-latin.woff2").then(r => r.arrayBuffer())
```

#### 6. Read MapLibre Worker Source

MapLibre's web worker source is extracted at build time and placed in `public/export/maplibre-worker.js`. The viewer loads it as a blob URL at runtime.

#### 7. Assemble the ZIP (Streaming)

Using **fflate**'s async streaming `Zip` class — already a project dependency. The streaming approach avoids loading all photo data into memory at once, which is critical for large trips (300+ photos could exceed 1GB).

```typescript
import { Zip, ZipDeflate, ZipPassThrough } from "fflate"

const chunks: Uint8Array[] = []
const zip = new Zip((err, chunk, final) => {
  if (err) throw err
  chunks.push(chunk)
  if (final) triggerDownload(concat(chunks))
})

// Add non-photo assets first (small, can be added synchronously)
addToZip(zip, "index.html", encode(buildHtml(trip, chapters, photos)))
addToZip(zip, "assets/viewer.js", encode(viewerJs))
addToZip(zip, "assets/viewer.css", encode(viewerCss))
addToZip(zip, "assets/globe-data.js", encode(buildAssetScript("pmtiles:globe", globeBase64)))
addToZip(zip, "assets/map-fonts.js", encode(buildFontScript(fontFiles)))
addToZip(zip, "assets/map-sprites.js", encode(buildSpriteScript(spriteFiles)))
addToZip(zip, "assets/maplibre-worker.js", encode(buildWorkerScript(workerSource)))
addToZip(zip, "fonts/cormorant-v11-latin.woff2", new Uint8Array(cormorant))
addToZip(zip, "fonts/outfit-v11-latin.woff2", new Uint8Array(outfit))
addToZip(zip, "data/trip.json", encode(JSON.stringify({ trip, chapters, photos }, null, 2)))

// Stream cover photo (if present)
// Cover photo uses a compound ID: "{tripId}-{subdir}-{filename}" (see decomposeCoverPhotoId)
if (trip.coverPhotoId) {
  const { tripId: coverTripId, subdir, filename } = decomposeCoverPhotoId(trip.coverPhotoId)
  const blob = await readPhoto(coverTripId, subdir, filename)
  if (blob) {
    addToZip(zip, `photos/cover/${filename}`, new Uint8Array(await blob.arrayBuffer()))
  }
}

// Stream chapter photos one at a time — read from OPFS, compress, discard
const skippedPhotos: Photo[] = []
for (const [i, photo] of photos.entries()) {
  const blob = await readPhoto(tripId, String(photo.chapterId), photo.filename)
  if (!blob) {
    skippedPhotos.push(photo)
    continue // OPFS file missing — skip gracefully, don't fail the export
  }
  const data = new Uint8Array(await blob.arrayBuffer())
  addToZip(zip, `photos/${photo.chapterId}/${photo.filename}`, data)
  onProgress({ phase: "archiving", current: i + 1, total: photos.length })
  // `data` is now eligible for GC — not held in memory
}

zip.end()
```

**Helper:** `addToZip` creates a `ZipDeflate` (for compressible data) or `ZipPassThrough` (for already-compressed JPEGs), pushes the data, and calls `.push(data, true)` to finalize each entry.

**Progress:** "Exporting photos... (45 / 312)" — single unified phase. Each photo is read from OPFS, compressed into the ZIP stream, then discarded. The streaming approach keeps the main thread responsive since each file is processed asynchronously with `await` yields between entries.

**Missing photos:** If a photo's OPFS file is missing (e.g., storage eviction, partial import), it is skipped and the export continues. On completion, if `skippedPhotos.length > 0`, the success dialog shows a warning: *"X photos could not be found and were excluded."*

**Memory profile:** Only one photo is in memory at a time (read → compress → discard). Peak memory ≈ largest single photo + accumulated compressed ZIP chunks. The final ZIP blob is assembled from chunks at the end.

#### 8. Trigger Download

```typescript
const blob = new Blob([zip], { type: "application/zip" })
const url = URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.download = `${trip.slug}.zip`
a.click()
URL.revokeObjectURL(url)
```

**Progress:** "Download started!" with file size display.

---

## Standalone Viewer

### Entry Point: `src/features/export/viewer/viewer-entry.tsx`

```typescript
import { createRoot } from "react-dom/client"
import { ExportViewer } from "./export-viewer"

const root = createRoot(document.getElementById("vault-root")!)
root.render(<ExportViewer />)
```

### Root Component: `ExportViewer`

Reads `window.__VAULT_DATA__`, decodes assets from `window.__VAULT_ASSETS__`, initializes MapLibre protocols, then renders the trip.

```typescript
function ExportViewer() {
  const { trip, chapters, photos } = window.__VAULT_DATA__

  // Register custom MapLibre protocols on mount
  useEffect(() => {
    registerVaultProtocols(window.__VAULT_ASSETS__)
  }, [])

  return (
    <StaticPhotoProvider photos={photos}>
      <TripDetailPage trip={trip} chapters={chapters} />
    </StaticPhotoProvider>
  )
}
```

### `StaticPhotoProvider`

Replaces the OPFS-based photo loading with static file path resolution.

The main app's photo loading flow uses `useChapterPhotos()` which reads from OPFS and creates blob URLs. The viewer needs the same interface but resolving to relative file paths.

**Implementation:** A React context (`PhotoContext`) with two implementations:
- **App mode** (default): resolves via OPFS + `URL.createObjectURL()` (existing behavior, extracted into a provider)
- **Export mode**: resolves to `./photos/<chapterId>/<filename>` (new, trivial implementation)

The trip-detail components consume photos via context, unaware of the source. This requires a refactor of `useChapterPhotos()` to use a context-based resolver, but the component tree stays identical.

### `registerVaultProtocols`

Registers MapLibre custom protocols to serve map data from the in-memory asset registry:

```typescript
function registerVaultProtocols(assets: Record<string, string>) {
  // Decode all base64 assets to ArrayBuffer on boot
  const decoded = new Map<string, ArrayBuffer>()
  for (const [key, b64] of Object.entries(assets)) {
    if (key === "maplibre:worker") continue
    decoded.set(key, base64ToArrayBuffer(b64))
  }

  // PMTiles protocol — serves tile requests from in-memory ArrayBuffer
  const pmtilesBuffer = decoded.get("pmtiles:globe")!
  // Use pmtiles library's FetchSource replacement that reads from ArrayBuffer
  // Register as pmtiles:// protocol handler

  // Font protocol — intercepts glyph requests (MapLibre v5 Promise-based API)
  maplibregl.addProtocol("vault-fonts", async (params) => {
    const key = params.url.replace("vault-fonts://", "font:")
    const data = decoded.get(key)
    if (!data) throw new Error(`Missing font asset: ${key}`)
    return { data }
  })

  // Sprite — MapLibre fetches sprite JSON and PNG via the sprite URL.
  // Override via transformRequest to return data URIs for sprite requests.

  // Worker — create blob URL from inlined source
  const workerBlob = new Blob([assets["maplibre:worker"]], { type: "text/javascript" })
  maplibregl.workerUrl = URL.createObjectURL(workerBlob)
}
```

### Globe Style Override

The viewer creates a modified `createGlobeStyle()` that points to custom protocol URLs:

```typescript
{
  glyphs: "vault-fonts://{fontstack}/{range}.pbf",
  sprite: "data:..." // or custom protocol
  sources: {
    protomaps: {
      type: "vector",
      url: "pmtiles://vault:globe" // custom PMTiles source backed by in-memory data
    }
  }
}
```

---

## Export UI

### Export Button

Placed in the trip detail page toolbar area. Appears alongside existing trip-level actions.

- **Icon:** `Download` from Lucide, `size-5`, `strokeWidth={1.8}`
- **Label:** "Export" (visible on desktop, icon-only on mobile with tooltip)
- **Style:** Ghost button matching existing toolbar style. `text-muted-foreground hover:text-primary`
- **Position:** Top-right of the trip detail page, fixed/sticky behavior matching the scroll-to-top pattern

### Export Progress Dialog

A modal dialog (shadcn `Dialog`) that appears when the export starts and tracks progress through all phases.

**States:**

| State | Display |
|---|---|
| **Packaging map** | Progress bar (indeterminate) + "Packaging map assets..." |
| **Exporting photos** | Progress bar (determinate) + "Exporting photos... (45 / 312)" |
| **Complete** | Checkmark icon + "Export complete" + file size + instruction text. Optional warning if photos were skipped |
| **Error** | Error icon + error message + "Try again" button |

**Progress bar:** Uses shadcn `Progress` component. Determinate during photo export (the longest phase — reads from OPFS and streams into ZIP), indeterminate during map asset packaging.

**Instruction text on completion:** *"Unzip the file and open index.html in your browser to view your trip offline."*

**Cancel:** The dialog has a cancel button during processing. Cancellation aborts OPFS reads and discards partial data. The `AbortController` pattern is used throughout the export pipeline.

**Auto-close:** The dialog does NOT auto-close after download starts — the user dismisses it manually. This avoids confusion if the browser's download prompt overlaps.

### Keyboard & Focus

- Export button is a standard `<button>`, focusable, activates on Enter/Space
- Dialog traps focus while open (shadcn Dialog default behavior)
- Escape closes the dialog (cancels if in progress, dismisses if complete)

---

## Components

| Component | Status | Notes |
|---|---|---|
| `ExportButton` | **New** | Trigger button for the trip detail toolbar |
| `ExportProgressDialog` | **New** | Modal showing export phases, progress, completion |
| `ExportViewer` | **New** | Standalone root component for the exported HTML |
| `StaticPhotoProvider` | **New** | Context provider resolving photos to relative file paths |
| `StaticMapProvider` | **New** | Registers custom MapLibre protocols from in-memory assets |
| `TripDetailPage` | Exists | **Modify** — add `ExportButton` to the toolbar area. Accept photo resolution via context |

### New Modules

| Module | Location | Purpose |
|---|---|---|
| `export-trip.ts` | `src/features/export/lib/` | Main orchestrator: gathers data, assembles ZIP, triggers download |
| `build-html.ts` | `src/features/export/lib/` | Generates the `index.html` string from templates and trip data |
| `asset-encoder.ts` | `src/features/export/lib/` | Base64 encoding utilities and asset script generators |
| `map-asset-manifest.ts` | `src/features/export/lib/` | Static list of map asset paths (generated at build time) |
| `register-vault-protocols.ts` | `src/features/export/viewer/` | Custom MapLibre protocol handlers for offline asset serving |
| `viewer-entry.tsx` | `src/features/export/viewer/` | Viewer app entry point |
| `vite.export.config.ts` | Project root | Vite config for building the standalone viewer bundle |
| `generate-map-manifest.ts` | `scripts/` | Build script that scans `/public/map-assets/` and writes the manifest |
| `generate-export-fonts.ts` | `scripts/` | Build script that downloads Google Fonts WOFF2 files to `public/export/fonts/` |

### Photo Context Refactor (Prerequisite PR)

The existing photo loading is tightly coupled to OPFS. It must be abstracted behind a context so both the app and the export viewer can provide photo URLs through the same interface. **This should land as a separate PR before the export feature.**

| Current | New |
|---|---|
| `useChapterPhotos(tripId, chapterId)` directly calls `readPhoto()` from OPFS and creates blob URLs | `useChapterPhotos(tripId, chapterId)` calls a `PhotoResolver` from context |
| Photo URL maps (`Map<string, string>`) are passed as props through `ChapterShowcase` → `PostcardPhoto` and into `PhotoLightbox` | Components consume URLs from the same context-based resolver |

**Files touched:**
- `src/features/trip-detail/lib/use-chapter-photos.ts` — extract OPFS logic into an `OpfsPhotoResolver`, consume resolver from context
- `src/features/trip-detail/components/trip-detail-page.tsx` — wrap tree in `<PhotoProvider resolver={opfsResolver}>`
- `src/features/trip-detail/components/chapter-showcase.tsx` — consume photos from context instead of props
- `src/features/trip-detail/components/postcard-photo.tsx` — consume from context
- `src/features/trip-detail/components/photo-lightbox.tsx` — consume from context
- New: `src/features/trip-detail/lib/photo-context.tsx` — defines `PhotoResolver` interface and `PhotoProvider`/`usePhotoUrl` context

**The component tree and rendering are unchanged.** Only the data source is swapped. The main app continues to load photos from OPFS exactly as it does today — the same `readPhoto()` calls and blob URLs, just moved into an `OpfsPhotoResolver` provided via context instead of being hardcoded inside the hook. No behavioral change for the app; this is purely a wiring abstraction. The export viewer then provides a `StaticPhotoResolver` that maps photo IDs to `./photos/<chapterId>/<filename>` — trivial implementation once the context exists.

---

## Build Pipeline

### Viewer Bundle Build

Add to `package.json`:

```json
{
  "scripts": {
    "build:export-viewer": "vite build --config vite.export.config.ts",
    "build:export-manifest": "tsx scripts/generate-map-manifest.ts",
    "build:export-fonts": "tsx scripts/generate-export-fonts.ts",
    "build": "next build && pnpm build:export-viewer && pnpm build:export-manifest",
    "postinstall": "pnpm build:export-fonts"
  }
}
```

### Vite Export Config

```typescript
// vite.export.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "public/export",
    lib: {
      entry: path.resolve(__dirname, "src/features/export/viewer/viewer-entry.tsx"),
      name: "VaultViewer",
      fileName: "export-viewer",
      formats: ["iife"],
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: "export-viewer.[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})

// Note: The viewer entry must import the same globals.css used by the app:
//   import "@/app/globals.css"
// This ensures Tailwind v4's @theme tokens, CSS variables, and utility classes
// are included in the extracted viewer.css. The @tailwindcss/vite plugin
// processes these directives identically to the Next.js build.
```

Output format is **IIFE** (immediately-invoked function expression) — no ES modules, works from `<script src>` tags without `type="module"`.

**Import boundary:** The viewer entry point must only import from `src/features/trip-detail/`, `src/features/export/`, `src/components/`, `src/lib/`, and `src/types/` — never from `src/app/` or anything that imports `next/*`. The Vite config should include a Rollup plugin that errors on `next/` imports to catch accidents at build time. Currently no trip-detail rendering components import from `next/*`, so this is a guard rail, not a migration task. Fonts are consumed via CSS variables (`--font-display`, `--font-body`) which the exported HTML sets via `@font-face` — no `next/font` dependency reaches the viewer.

### MapLibre Worker Extraction

During the viewer build, MapLibre's worker source needs to be extracted as a separate string. Approach:

1. MapLibre ships a worker file at `node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js`
2. The build script copies this to `public/export/maplibre-worker.js`
3. The export assembler reads it via `fetch("/export/maplibre-worker.js")`

---

## States

| State | What the user sees |
|---|---|
| **Normal trip view** | Export button visible in toolbar. No export UI otherwise |
| **Export in progress — map assets** | Dialog open, indeterminate progress bar, "Packaging map assets..." |
| **Export in progress — photos** | Dialog open, determinate progress bar, "Exporting photos... (45 / 312)" |
| **Export complete** | Dialog shows success checkmark, file size, instruction text. Download triggered. If photos were skipped: warning line *"X photos could not be found and were excluded."* |
| **Export cancelled** | Dialog closes, partial data discarded, no download |
| **Export error** | Dialog shows error message, "Try again" button |
| **No photos** | Export still works — ZIP contains map, HTML, viewer, but empty photos folder |
| **No cover photo** | Export works — `photos/cover/` omitted from ZIP. Viewer renders no-cover layout |
| **Large trip (500+ photos)** | Same flow, potentially slower. ZIP building may run in a worker for UI responsiveness |

### Exported Viewer States

| State | What the viewer shows |
|---|---|
| **Normal load** | Full trip experience identical to app: hero, summary, globe, chapters, lightbox |
| **Missing photo file** | Broken image placeholder (standard browser behavior). Graceful — rest of trip still works |
| **Missing map asset** | Globe renders without labels/tiles. Trip content (photos, text, nav) unaffected |
| **JavaScript disabled** | Blank page. This is a React SPA — JS is required. No fallback specified |

---

## Accessibility

### Export Button
- Standard `<button>` element, keyboard accessible
- `aria-label="Export trip as offline archive"` for screen readers
- Tooltip on hover/focus: "Export"

### Export Progress Dialog
- Uses shadcn `Dialog` (Radix UI) — focus trap, Escape to close, aria-labelledby/describedby
- Progress bar has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Phase text is live-announced via `aria-live="polite"` region
- Cancel and dismiss buttons are keyboard accessible

### Exported Viewer
- Inherits all accessibility features from the trip-detail components (semantic HTML, aria attributes, keyboard nav, reduced motion support)
- The exported HTML includes proper `<html lang="en">`, viewport meta, and document title

---

## Responsive Behavior

### Export Button
| Breakpoint | Display |
|---|---|
| **Mobile (< 640px)** | Icon-only button with tooltip |
| **Desktop (640px+)** | Icon + "Export" label |

### Export Progress Dialog
| Breakpoint | Display |
|---|---|
| **Mobile** | Full-width bottom sheet style (shadcn Dialog mobile behavior) |
| **Desktop** | Centered modal, max-width 420px |

### Exported Viewer
Identical responsive behavior to the main app — the same components and Tailwind breakpoints apply.

---

## Performance Considerations

### Memory During Export

The export uses fflate's **streaming `Zip` class** to avoid loading all data into memory at once. Photos are read from OPFS one at a time, compressed into the ZIP stream, then discarded.

**Peak memory estimate:**
- ~27MB map assets (base64-encoded, held until written to ZIP)
- ~1MB viewer bundle
- Largest single photo (~5–10MB)
- Accumulated compressed ZIP chunks (much smaller than raw data due to deflate)

**Total peak:** ~50–100MB regardless of trip size. This is safe for all devices including mobile browsers.

### Export Duration Estimates

| Trip Size | Photos | Estimated Time |
|---|---|---|
| Small (weekend trip) | 20–50 | 2–5 seconds |
| Medium (2-week trip) | 100–200 | 10–20 seconds |
| Large (multi-month) | 300–500+ | 30–60+ seconds |

Photo reading from OPFS is the bottleneck. Map asset packaging and ZIP compression are fast by comparison.

### Viewer Load Time

The exported viewer must decode base64 map assets (~36MB encoded) on page load. Estimated decode time: 1–3 seconds on modern hardware. The viewer should show a loading state (spinner or skeleton) while assets decode, then render the trip.

---

## Decisions

- **fflate streaming `Zip` over `zipSync`.** The project already uses fflate for ZIP extraction during import. The streaming `Zip` class processes files one at a time — critical for memory safety on large trips. Photos are read from OPFS, compressed into the stream, then discarded. Peak memory stays ~50–100MB regardless of trip size. No additional dependencies needed.

- **Separate viewer bundle, not page capture.** Capturing the rendered DOM (html2canvas, puppeteer-style) would lose interactivity. A standalone React SPA preserves all animations, the interactive globe, lightbox, and chapter navigation — identical to the app.

- **Base64 asset scripts over inlining into HTML.** Keeping map data in separate `.js` files (loaded via `<script src>`) keeps the HTML lightweight and parseable. Browsers handle multiple script tags well. The 33% base64 overhead is acceptable — the ZIP compresses it away.

- **Custom MapLibre protocols over fetch polyfills.** MapLibre's `addProtocol` API is the intended extension point. Registering `vault-fonts://` and serving from memory is cleaner and more reliable than trying to polyfill `fetch()` for `file://`.

- **Photo context refactor as prerequisite PR.** Abstracting photo resolution behind a `PhotoResolver` context enables the viewer without duplicating components. Scoped to 6 files in `src/features/trip-detail/`. Ships as a standalone refactor PR before the export feature — keeps the export diff focused on new code only.

- **Pre-built viewer bundle over on-demand bundling.** Building the viewer at deploy/build time (not at export time) is simpler, faster, and doesn't require bundler code in the browser. The ~500KB-1MB bundle is negligible compared to photo and map data.

- **No photo quality options for v1.** Photos are exported at original quality. Compression/resizing adds complexity and the user expects their memories at full resolution. Can revisit if ZIP sizes become a complaint.

- **No print/PDF export.** This spec covers the interactive HTML export only. A print-optimized layout is a separate feature if desired.

- **WOFF2 fonts self-hosted in export.** The app loads Cormorant and Outfit from Google Fonts via `next/font`. The export can't rely on external font CDNs (offline requirement), so WOFF2 files are bundled. A build script downloads them once and places them in `public/export/fonts/`.

- **Display font WOFF2 files loaded via `@font-face` with relative URLs.** Unlike map assets (which need base64 + script tags due to MapLibre's fetch-based loading), display fonts work natively from `file://` via CSS `@font-face url('./fonts/...')`. No base64 encoding needed for these.

- **`file://` as the primary target.** The export must work when double-clicked from a file explorer. This is the hardest constraint and drives all the asset-loading architecture. If served via HTTP (e.g., `npx serve`), everything works even more smoothly — no special handling needed.

- **Bonus `data/trip.json` in export.** The ZIP includes a `data/trip.json` with the raw structured data (trip, chapters, photos metadata). Zero extra cost — it's the same data embedded in `__VAULT_DATA__` but written as a standalone JSON file for power users who want to extract or process their data programmatically.
