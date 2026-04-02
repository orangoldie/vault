# Photo Layout Algorithm — Requirements

## Goal

Lay out photos across PDF pages using `better-justified-layout` (Flickr fork with `row` index on each box). The algorithm is a **global row distribution** approach: sort photos, build a full justified strip across all photos, distribute the resulting rows evenly across pages, scale each page to fill. One unified code path handles all photo counts — no special cases for 1-2 photos.

## Why not greedy strip-and-cut

A greedy forward-packing approach (run justified-layout on remaining photos, cut at page boundary, repeat) produces imbalanced pages:

- The strip is computed on all remaining photos using `targetRowHeight = availableHeight / 2`. This determines row groupings for the entire remainder, not just what fits on one page.
- The cut is irreversible — once N photos are committed to page K, there is no redistribution even if page K+1 ends up with 1 photo.
- A widow-prevention patch (re-layout last two pages) fails because: it only checks the final photo page; re-layout uses the same heuristic that produced the imbalance in the first place; and a threshold of `< minPhotosPerPage` only catches 0–1 photo orphans, not a page with 2 photos next to a page with 8.

## Algorithm: Sort → Strip → Distribute → Scale

### Step 1: Sort by aspect ratio

Photos arrive in arbitrary order from Polarsteps. Sort by aspect ratio descending (landscapes first, portraits last), filename as tiebreaker for determinism. This groups similar ratios together so justified-layout produces uniform rows naturally.

### Step 2: Build the global strip

Run `better-justified-layout` on ALL photos once with `targetRowHeight = fullPageHeight / 2`:

```ts
justifiedLayout(aspectRatios, {
  containerWidth: contentWidth,   // 773.89pt
  boxSpacing: photoGutter,        // 8.5pt
  targetRowHeight: fullPageHeight / 2,
})
```

Using `fullPageHeight / 2` (≈ 263pt) as the target biases toward 1–2 generous rows per page. This produces R total rows with their photo groupings fixed. The global strip is used only to determine **page boundaries** — which photos belong together on each page. Per-page rendering is handled independently.

Each output box has a `row` index. Group all boxes by row index — this gives the complete row structure for the chapter.

### Step 3: Distribute rows evenly across pages

Compute the target page count:

```
P = ceil(R / 2)   // targeting 2 rows per page
```

Distribute rows evenly: give `floor(R / P)` rows to each page, then give 1 extra row to the first `R mod P` pages (so earlier pages are never sparser than later ones).

**1-row last page:** If after distribution the last page has exactly 1 row, absorb it into the previous page unconditionally. `scalePageToFill` handles any number of rows gracefully.

### Step 4: Scale each page to fill

For each page's assigned photos, run `scalePageToFill(photos, fullPageHeight)`:

1. Run `justifiedLayout` once at `targetRowHeight = availableHeight / 2` to get the row grouping.
2. Scale all boxes vertically: `yScale = availableHeight / containerHeight`. Apply to `top` and `height`.
3. Center each row horizontally: compute `rowWidth` (rightmost edge of the row), then `left += (contentWidth - rowWidth) / 2`. For full rows `rowWidth ≈ contentWidth` so the offset is ~0. For partial rows (e.g. a single orphan photo) the row is centered.

The slight vertical aspect-ratio shift from `yScale` is invisible because photos render with `objectFit: cover`.

## Text and photos are separated

Text always gets its own page. Photo pages are all full-height (`fullPageHeight`). There is no mixing of text and photos on the same page in the current implementation. This keeps the photo layout algorithm clean — no reduced-height first pages, no text/photo interaction.

The chapter header (`chapterHeader`) is always emitted on a standalone page with `photos: []`. All photo pages have no `chapterHeader`.

## Aspect ratio handling

Photos are either 1280×960 (landscape, 4:3) or 960×1280 (portrait, 3:4). After sorting:

- **Landscapes** (ratio 1.33): 2 per row at `fullPageHeight / 2` target (~260pt tall each)
- **Portraits** (ratio 0.75): 3 per row at the same target
- **Transition row**: where landscapes end and portraits begin, the library handles the mixed row naturally

Photos render with `objectFit: "cover"`. With aspect-ratio-sorted input, cropping is minimal (typically < 10%). No explicit crop constraint enforcement needed — sorting solves it at the source.

**Print quality note:** Source images are 1280×960 at 96 DPI. At full A4 landscape width (273mm), this is ~119 DPI — below the 150 DPI "acceptable" threshold for print but the best available from Polarsteps. At half-page width it's fine (~240 DPI). We use the pixels we have.

## Constants (pdf-theme.ts)

| Constant | Value | Purpose |
|---|---|---|
| `minDimension` | 120 (pt) | Minimum photo width or height |
| `minPhotosPerPage` | 2 | Minimum photos per page (for edge case checks) |
| `photoGutter` | 8.5 (pt) | Gap between photos (horizontal and vertical) |
| `contentWidth` | 773.89 (pt) | Usable width inside margins |
| `fullPageHeight` | 527.28 (pt) | Usable height inside margins |

`targetRowHeight` is always `fullPageHeight / 2` — never a fixed constant.

## Determinism

Same photos + same chapter = identical layout every run. Guaranteed by:
- Aspect ratio sort with filename tiebreaker (stable)
- `justified-layout` is deterministic given same input
- Row-to-page mapping is computed from a fixed formula (no random seeding)

## Architecture

### Relevant files
- `src/features/export-pdf/lib/plan-photo-layouts.ts` — `packChapterPages()`, `scalePageToFill()`, `measureChapterText()`
- `src/features/export-pdf/lib/pdf-theme.ts` — theme constants
- `src/features/export-pdf/lib/measure-text.ts` — `twoColumnCapacity()`, `measureParagraphLineCount()`, `FontMetrics`
- `src/features/export-pdf/lib/better-justified-layout.d.ts` — type declarations for the library
- `src/features/export-pdf/components/photo-spread-page.tsx` — renders `PhotoGrid`, `ContentPage`, `TextContinuationPage`
- `src/features/export-pdf/components/trip-album-document.tsx` — orchestrates pages

### Key types
```typescript
interface PhotoBox {
  photo: ClassifiedPhoto
  left: number
  top: number
  width: number
  height: number
}

interface PageContent {
  chapterHeader?: {
    chapter: Chapter
    textHeight: number
    useTwoColumns: boolean
  }
  /** When set, photos render below continuation text on this page. */
  continuationTextHeight?: number
  photos: PhotoBox[]
}
```

### Rendering
- `PhotoGrid` wraps all photos in a single `<View>` with `position: relative` and computed `height: maxBottom`
- Each photo is `position: absolute` with explicit `left/top/width/height` from `PhotoBox`
- Photos use `objectFit: "cover"` with `objectPosition: "center"`
- The algorithm outputs `PhotoBox[]` per page; the renderer just places them

## Library: `better-justified-layout`

Drop-in replacement for `justified-layout` (Flickr). Same algorithm, same API, but adds:
- `row` index on each output box (eliminates hacky row detection by top values)
- ESM + CJS support

Install: `pnpm add better-justified-layout`

## Acceptance criteria

All use source photos of 1280×960 (landscape, 4:3) or 960×1280 (portrait, 3:4).

### Case 1: 6 landscapes, no description
- **Expected: 1–3 photo pages, all placed, generous sizing**

### Case 2: 12 landscapes, no description
- **Expected: multiple pages, balanced photo count across pages — max and min photos per page differ by ≤ 4**

### Case 3: 3 portraits + 5 landscapes
- Sorted to: 5 landscapes, 3 portraits
- **Expected: 1–2 pages, landscapes and portraits in separate rows**

### Case 4: 1 photo, no description
- **Expected: 1 photo page, photo fills available space**

### Case 5: 2 photos, long description (text continuation)
- **Expected: text page first (header, no photos), then photo page**

### Case 6: 20 landscapes, short description
- **Expected: multiple pages (3–10), all placed, rows distributed evenly — no page with 1 row while another has 4**

### Case 7: 10 portraits, no description
- **Expected: 1–4 pages, balanced**

### Case 8: Short text + 8 mixed photos
- **Expected: text page first, then photo pages with even row distribution**

### Case 9: 8 landscapes, no description (the 7+1 regression)
- **Expected: even split — never 7+1. Max minus min photo count per page ≤ 3**

## Test file
- `tests/features/export-pdf/lib/plan-photo-layouts.test.ts`
