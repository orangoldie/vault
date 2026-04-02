# 09 — PDF Travel Album Export: Design Plan

## Vision

Turn a trip into a printed travel book. A single "PDF Album" action generates a magazine-style landscape PDF — cover page, chapter openers, and photo spreads that arrange images by aspect ratio into varied editorial layouts. The result is a designed artifact the user can print, share, or archive alongside the offline HTML export.

This is the *print* expression of Journey Vault's promise: your memories, beautifully composed, permanently yours.

---

## User Flow

1. User is viewing a trip at `/trip/[slug]`.
2. User clicks the **Export** button (top-right) and selects **PDF Album** from the dropdown.
3. The export progress dialog appears, showing real-time status:
   - "Composing album..." (indeterminate — no per-photo progress available)
4. The browser triggers a PDF download: `<trip-name>-album.pdf`.
5. The dialog shows a success state with file size.
6. User opens the PDF — a landscape travel album with cover, chapter openers, and photo spreads.

---

## Technology: `@react-pdf/renderer`

The PDF is generated client-side using `@react-pdf/renderer` — a React renderer that outputs PDF binary directly (not via DOM rendering or screenshots). This gives pixel-perfect control over page layout, typography, and image placement.

**Why not screenshot-based (html2canvas + jsPDF)?**
- Rasterizes text (not selectable/searchable)
- Documented quality issues: blurry images, fuzzy fonts
- Memory-intensive for large trips
- No proper page break control

**Why not `window.print()` / CSS `@media print`?**
- No programmatic download (user must manually "Save as PDF")
- Inconsistent across browsers
- No control over page size or layout precision

**Why `@react-pdf/renderer`?**
- Proper PDF text (selectable, searchable)
- Flexbox layout for magazine-style grids
- Built-in page breaks, headers, footers, page numbers
- `pdf().toBlob()` API — headless generation, no rendering to screen
- Web Worker support for large documents
- 860K+ weekly downloads, actively maintained

**Trade-off:** Components cannot reuse the app's Tailwind/Framer Motion tree. The PDF has its own component tree using `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Image`, `Text`) with its own `StyleSheet` API. This is the same pattern as the offline export (separate viewer, same data, different rendering).

---

## Page Format

- **Orientation:** Landscape
- **Page size:** A4 landscape (297mm × 210mm / 11.69" × 8.27")
- **Margins:** 12mm on all sides (content area: 273mm × 186mm)
- **Bleed pages:** Some layouts extend photos edge-to-edge (0mm margins)
- **Color profile:** sRGB (standard for screen + consumer printing)

---

## Page Flow

The album follows a fixed structure. Each section is detailed below.

### 1. Cover Page (1 page)

Full-bleed cover photo with trip title overlay. If no cover photo exists, a solid-color page with the vault theme palette.

| Element | Detail |
|---|---|
| **Background** | Cover photo, full bleed (no margins), `objectFit: "cover"` with absolute positioning |
| **Trip name** | Noto Serif, 48pt, white, centered, bottom third of page |
| **Date range** | Noto Sans, 14pt, white/80% opacity, below trip name |
| **Overlay** | Semi-transparent dark overlay (bottom 30%) for text legibility |
| **No-cover fallback** | Solid `#e8e1d4` (vault earth) background, dark text, includes flag route |

### 2. Summary Page (1 page)

Trip-level stats and overview. Mirrors the web trip summary's information density but in a print layout.

| Element | Detail |
|---|---|
| **Trip name** | Noto Serif, 32pt, centered |
| **Date range** | Editorial format ("January – March 2024"), Noto Sans 14pt |
| **Stats row** | Duration · Distance · Photos · Chapters — Noto Sans 12pt, spaced horizontally |
| **Country route** | Flags + country names in reading order |
| **Summary text** | `trip.summary` if present, Noto Serif italic 14pt, centered, max 4 lines |

### 3. Chapter Sections (repeated per chapter)

Each chapter produces:
- **1 chapter opener page** (always)
- **N photo spread pages** (variable, based on photo count)

#### 3a. Chapter Opener (1 page per chapter)

Full-width text content with chapter metadata on a single line.

| Element | Detail |
|---|---|
| **Chapter name** | Noto Serif 28pt |
| **Metadata line** | Flag emoji + location + date + weather (dot-separated), Noto Sans 11pt, muted |
| **Description** | Chapter description — Noto Serif 12pt, max ~200 words. Overflow truncated with "..." |

#### 3b. Photo Spreads (variable pages per chapter)

Photos are arranged into magazine-style grids. The layout engine selects a **spread template** based on the number of remaining photos and their aspect ratios.

**Aspect ratio classification:**
Each photo is classified before layout:
- **Landscape**: width/height > 1.2
- **Portrait**: width/height < 0.8
- **Square**: 0.8 ≤ width/height ≤ 1.2

Photo dimensions are read during OPFS blob loading (via `createImageBitmap()` or an `Image()` element to get `naturalWidth`/`naturalHeight`).

**Spread templates:**

The engine has a library of 6–8 layout templates. Each template specifies how many photos it consumes and what aspect ratios it prefers. The engine greedily matches the next batch of photos to the best-fitting template.

| Template | Photos | Description | Preferred aspects |
|---|---|---|---|
| **Hero** | 1 | Single photo, full bleed (no margins) | Any — best for standout shots |
| **Duo landscape** | 2 | Two landscape photos side by side, equal height | 2× landscape |
| **Duo portrait** | 2 | Two portrait photos side by side, equal height | 2× portrait |
| **Trio feature** | 3 | 1 large (60% width) + 2 stacked small (40% width) | 1× landscape + 2× any |
| **Trio row** | 3 | Three photos in a row, equal height | 3× landscape or 3× square |
| **Quad grid** | 4 | 2×2 grid, equal cells | 4× square or mixed |
| **Quint mosaic** | 5 | 1 large top (full width) + 4 small bottom row | 1× landscape + 4× any |
| **Strip** | 2–3 | Narrow horizontal strip across full width, photos cropped to same height | Mixed aspects |

**Template selection algorithm:**

```
while (unplaced photos remain):
  for each template (ordered by photo count descending):
    if remaining count >= template.photoCount:
      score = aspectMatchScore(nextN photos, template.preferredAspects)
      candidates.push({ template, score })
  select candidate with highest score
  place photos into template
  advance to next page
```

**Fallback:** If fewer photos remain than the smallest template, place them in a simple row layout.

**Gutters:** 3mm between photos within a spread. Full-bleed templates have 0mm margins; framed templates use the standard 12mm page margins.

**Photo quality:** Images are embedded at their original resolution (from OPFS). `@react-pdf/renderer`'s `<Image>` component accepts base64 data URLs. Each photo is read from OPFS, converted to a data URL, placed, then the source data is discarded (same streaming pattern as the ZIP export).

### 4. Back Cover (1 page)

Minimal closing page.

| Element | Detail |
|---|---|
| **Text** | "Made with Journey Vault" — Noto Sans 10pt, centered, muted |
| **Optional** | Small vault logo or decorative rule |

---

## Export Process (Client-Side)

Orchestrated by `exportTripPdf(tripId)` in `src/features/export/lib/export-trip-pdf.ts`.

### Step-by-Step

#### 1. Gather Trip Data

Same as the ZIP export — read trip, chapters, and photo metadata from IndexedDB.

#### 2. Classify Photo Aspect Ratios

For each photo, load just enough data to determine dimensions:

```typescript
async function getPhotoDimensions(
  tripId: number, chapterId: number, filename: string
): Promise<{ width: number; height: number }> {
  const blob = await readPhoto(tripId, chapterId, filename)
  if (!blob) return { width: 1, height: 1 }
  const bitmap = await createImageBitmap(blob)
  const dims = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dims
}
```

This runs before layout planning. The blobs are read again later for embedding — but dimension scanning is fast and the blob is immediately released.

**Progress:** No separate progress phase — this is fast (metadata only, no encoding).

#### 3. Plan Photo Layouts

The layout engine runs the template selection algorithm per chapter, producing a `PagePlan[]`:

```typescript
interface PagePlan {
  template: TemplateName
  photos: Array<{
    photo: Photo
    width: number
    height: number
    aspect: "landscape" | "portrait" | "square"
  }>
}
```

This is a pure computation step — no I/O, instant.

#### 4. Render PDF

Build the `@react-pdf/renderer` component tree and generate the PDF blob:

```typescript
import { pdf } from "@react-pdf/renderer"
import { TripAlbumDocument } from "../pdf/trip-album-document"

const blob = await pdf(
  <TripAlbumDocument
    trip={trip}
    chapters={sortedChapters}
    pagePlans={pagesByChapter}
    coverPhotoDataUrl={coverDataUrl}
  />
).toBlob()
```

**Photo loading during render:** The `<Image>` components receive photo data URLs. To avoid loading all photos into memory at once, the document component loads photos on-demand using a `resolve` callback that reads from OPFS and returns a base64 data URL. Each photo is loaded, embedded by the renderer, then eligible for GC.

**Progress:** "Composing album..." — indeterminate spinner. `pdf().toBlob()` provides no per-page or per-image callbacks, so granular progress is not available. The composing phase runs in a Web Worker to keep the UI responsive.

#### 5. Trigger Download

Same pattern as the ZIP export:

```typescript
const url = URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.download = `${trip.slug}-album.pdf`
a.click()
URL.revokeObjectURL(url)
```

---

## Export UI Changes

### Export Menu

The existing `ExportMenu` dropdown gains a second option:

```
┌─────────────────┐
│ 🌐 Offline Album │  ← existing
│ 📄 PDF Album     │  ← new
└─────────────────┘
```

- **Icon:** `FileText` from Lucide for PDF Album
- Both options use the same `ExportProgressDialog`

### Export Progress Dialog

No structural changes needed. The dialog already supports phased progress. New phases:

| Phase | Display |
|---|---|
| **preparing** | "Preparing export..." (existing) |
| **composing** | "Composing album..." — indeterminate (no per-photo hooks available from `pdf().toBlob()`) (new) |
| **complete** | Success state with file size (existing) |
| **error** | Error state with retry (existing) |

Update `ExportPhase` type to include `"composing"`.

---

## Components

### New PDF Components

All PDF components use `@react-pdf/renderer` primitives. They live in `src/features/export/pdf/` — completely separate from DOM components.

| Component | Purpose |
|---|---|
| `TripAlbumDocument` | Root `<Document>` — orchestrates all pages |
| `CoverPage` | Full-bleed cover with title overlay |
| `SummaryPage` | Trip stats and overview |
| `ChapterOpenerPage` | Chapter title + map snapshot |
| `PhotoSpreadPage` | Single spread page with one template layout |
| `SpreadHero` | Template: 1 full-bleed photo |
| `SpreadDuoLandscape` | Template: 2 landscape photos side by side |
| `SpreadDuoPortrait` | Template: 2 portrait photos side by side |
| `SpreadTrioFeature` | Template: 1 large + 2 stacked |
| `SpreadTrioRow` | Template: 3 in a row |
| `SpreadQuadGrid` | Template: 2×2 grid |
| `SpreadQuintMosaic` | Template: 1 large + 4 small |
| `SpreadStrip` | Template: 2–3 photos in a cropped strip |
| `PageNumber` | Fixed footer with page number on every page |

### New Modules

| Module | Location | Purpose |
|---|---|---|
| `export-trip-pdf.ts` | `src/features/export/lib/` | Main PDF export orchestrator |
| `classify-photos.ts` | `src/features/export/lib/` | Aspect ratio classification from OPFS |
| `plan-photo-layouts.ts` | `src/features/export/lib/` | Template selection algorithm |
| `spread-templates.ts` | `src/features/export/pdf/` | Template definitions (photo count, aspect preferences, layout geometry) |
| `pdf-theme.ts` | `src/features/export/pdf/` | Colors, font sizes, spacing constants for the PDF |
| `trip-album-document.tsx` | `src/features/export/pdf/` | Root document component |

### Modified Modules

| Module | Change |
|---|---|
| `export-menu.tsx` | Add "PDF Album" option |
| `export-toolbar.tsx` | Wire up PDF export alongside offline export |
| `use-export-trip.ts` | Support both export types (ZIP vs PDF) |
| `export-trip.ts` | Extract shared `ExportPhase` type |

---

## Fonts

`@react-pdf/renderer` requires TTF format (not WOFF2).

**Why Noto Serif / Noto Sans instead of Cormorant / Outfit?**
Cormorant and Outfit only cover Latin/Cyrillic scripts. Travel albums frequently contain place names in Arabic, Hebrew, Thai, CJK, Devanagari, etc. Noto's family provides consistent coverage across all scripts with a unified design language. The main app still uses Cormorant/Outfit for the web UI (where the browser's font stack handles fallback); the PDF needs explicit font registration per script.

### Font Registration

Fonts are registered from Google Fonts CDN URLs at the start of PDF generation (`pdf-fonts.ts`):

- **Noto Serif** (regular, bold, italic) — display/heading font
- **Noto Sans** (regular, bold, italic) — body/UI font
- **Script-specific Noto Sans variants** — Hebrew, Arabic, Thai, JP, KR, SC, Devanagari
- **Twemoji** — emoji rendering via CDN PNG source

A `resolveLineStyle()` helper detects the dominant script of each text line and returns the correct `fontFamily` + RTL direction, working around react-pdf's broken font stack feature.

---

## Styling

The PDF uses a dedicated theme that mirrors the vault aesthetic but is adapted for print.

### `pdf-theme.ts`

```typescript
export const pdfTheme = {
  colors: {
    primary: "#5c5550",        // Dark warm grey — headings
    muted: "#8a8078",          // Warm grey — secondary text
    background: "#faf8f5",     // Warm off-white — page background
    surface: "#e8e1d4",        // Vault earth — decorative elements
    accent: "#b8965a",         // Vault gold — accents, rules
    white: "#ffffff",
  },
  fonts: {
    display: "Noto Serif",     // See pdf-fonts.ts for script-specific variants
    body: "Noto Sans",
  },
  sizes: {
    coverTitle: 48,
    chapterTitle: 28,
    summaryTitle: 32,
    body: 12,
    caption: 10,
    meta: 11,
    pageNumber: 9,
  },
  spacing: {
    pageMargin: 12,            // mm → converted to pt (1mm = 2.835pt)
    photoGutter: 3,            // mm between photos in a spread
  },
}
```

---

## States

| State | What the user sees |
|---|---|
| **Normal trip view** | Export dropdown with "Offline Album" and "PDF Album" options |
| **PDF composition in progress** | Dialog: "Composing album..." |
| **PDF complete** | Dialog: success checkmark, file size, "Your travel album is ready." |
| **PDF cancelled** | Dialog closes, partial data discarded |
| **PDF error** | Dialog: error message, "Try again" button |
| **No photos** | PDF still generates — cover + summary + chapter openers without photo spreads |
| **No cover photo** | Cover page uses solid-color fallback |
| **Large trip (500+ photos)** | Same flow, longer duration. Consider Web Worker for rendering |

---

## Performance Considerations

### Memory

The primary concern is holding photo data during PDF rendering. Strategy:

- **Photo dimensions:** Scanned via `createImageBitmap()` then immediately closed. ~0 retained memory.
- **Photo embedding:** `@react-pdf/renderer` processes pages sequentially. Each photo is read from OPFS → converted to data URL → passed to `<Image>` → then eligible for GC. Peak: largest single photo + renderer working buffer.
- **PDF blob:** The final PDF for a 200-photo trip at landscape A4 could be 50–200MB depending on image quality. This is assembled in memory before download.

**Peak memory estimate:** ~100–300MB for a medium trip. Mobile browsers may struggle with very large trips (500+ photos). A warning could be shown for trips exceeding a threshold.

### Duration Estimates

| Trip Size | Photos | Estimated Time |
|---|---|---|
| Small (weekend) | 20–50 | 5–10 seconds |
| Medium (2 weeks) | 100–200 | 15–30 seconds |
| Large (multi-month) | 300–500+ | 1–3 minutes |

Photo embedding is I/O-bound (OPFS reads).

### Web Worker

`pdf().toBlob()` is a single async call with no per-page yield points — it will block the main thread for the entire render duration. The `@react-pdf/renderer` docs recommend Web Worker rendering for documents with 30+ pages. Since most trips will exceed this, **v1 uses a Web Worker** for PDF rendering to keep the progress dialog responsive.

**Implication for progress:** The "Composing album..." progress counter cannot track individual photos during `toBlob()` since there are no render hooks. Instead, progress updates during the composing phase to show an indeterminate state ("Composing album...") rather than a per-photo count. Per-photo progress is only shown during the earlier data-loading phase (reading photos from OPFS).

---

## Accessibility

### Export UI
- "PDF Album" menu item is keyboard accessible (existing dropdown behavior)
- Progress dialog announces phase changes via `aria-live="polite"` (existing)

### PDF Document
- Text is real PDF text (selectable, searchable, screen-reader compatible)
- Images should include alt text where available (photo filename as fallback)
- Document metadata: title, author ("Journey Vault"), creation date
- Logical reading order follows the document flow

---

## Decisions

- **`@react-pdf/renderer` over html2canvas/jsPDF.** Screenshot-based approaches produce blurry, non-searchable PDFs. `@react-pdf/renderer` gives proper text, precise layout control, and flexbox — essential for a magazine-style album. The trade-off (separate component tree) is acceptable; the offline export already established this pattern.

- **Landscape A4 over portrait.** Travel photos are predominantly landscape orientation. A landscape page format maximizes photo display area and creates a natural "album spread" feel when viewing two pages side by side.

- **Aspect-ratio-aware template selection over fixed grids.** A fixed grid (e.g., always 2×2) wastes space and crops awkwardly. Matching templates to actual photo aspects produces tighter, more intentional layouts — the difference between a generic grid and a designed magazine.

- **Noto Serif/Sans over Cormorant/Outfit for PDF.** The web UI uses Cormorant/Outfit, but the PDF needs explicit per-script font registration. Noto provides consistent coverage across Latin, Cyrillic, Arabic, Hebrew, Thai, CJK, and Devanagari — essential for travel albums with international place names. Fonts are registered from Google Fonts CDN URLs.

- **Separate orchestrator (`export-trip-pdf.ts`) over extending `export-trip.ts`.** The ZIP and PDF exports share data-gathering logic but diverge completely at the assembly step. A shared base with two orchestrators is cleaner than a single function with branching. Shared utilities (progress types, data fetching) are extracted to common modules.

- **Full-bleed hero template for standout photos.** Every chapter should have at least one photo that gets the full-page treatment. The layout engine can select the "best" photo per chapter (e.g., first photo, or largest resolution) for the hero slot.

- **Page numbers on every page except cover.** Subtle, bottom-center, Noto Sans 9pt. The `fixed` prop in `@react-pdf/renderer` makes this trivial — one component rendered on all pages.

- **No image compression/downscaling for v1.** Photos are embedded at original quality. This keeps the album print-ready. File size is a secondary concern — the user chose "PDF Album" knowing it's a large file. Can revisit with a quality selector if needed.
