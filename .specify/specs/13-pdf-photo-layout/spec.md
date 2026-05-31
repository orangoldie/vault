# PDF Export — Photo Layout Revision (No-Crop Fit)

**Status:** Implemented (2026-05-31)

This document specifies the 2026-05-31 revision of the photo layout engine. It
builds on `09-pdf-export/photo-layout-algorithm.md`, replacing the page-fill step
so photos are never cropped, and adding area-optimal row-grouping selection.

## Problem

The prior engine filled each photo page edge-to-edge by scaling row *height*
only, leaving width untouched. When a page wasn't naturally page-shaped (a lone
photo, a short row of portraits, a sparse page), the box aspect ratio diverged
from the photo's and `objectFit: cover` cropped the sides. Worst case — a single
portrait on a landscape page — lost ~25% off each edge, slicing faces. The crop
was invisible in the planning math because the distortion lived in the renderer.

## Goals

- Never crop a photo — every box matches its source aspect ratio
- Fill as much of the page as possible without distortion
- Prefer balanced row groupings over lopsided exact fits
- Keep dense pages looking as before (≈ full bleed)
- Pure aspect-ratio geometry — no image re-decoding; runs per page

## Non-goals

- Crop budget (`maxCropRatio`) — deliberately superseded; no crop at all
- Chronological photo ordering (still sorted by aspect ratio)
- Text/photo mixing on a page (unchanged — text owns its own page)
- Page assignment changes (Phase 1 global strip unchanged)

## Key Insight

`justifiedLayout` always fills the page *width*; the only free variable is how
many photos go per row. **Once that grouping is fixed, the row heights are fixed
too** — the photos determine them, not the target. So block height is a step
function of the target row height, and choosing a layout reduces to choosing a
grouping.

## Implementation

In `plan-photo-layouts.ts`, Phase 2's `scalePageToFill()`:

### `selectBestLayout()` — area-optimal grouping

Sweep 49 candidate target row heights (40pt → page height). Each yields a
grouping. Score each by final covered area `s²·A`, where `A` is the block's
natural photo area and `s = min(widthFit, heightFit)` is the uniform fit scale.
Pick the highest score. The `s²` term penalises overshoot quadratically, so the
maximum lands on the grouping whose block height sits nearest the page height.

### `scalePageToFill()` — uniform fit + center

Apply `s` to every box on both axes (aspect preserved → cover never crops), then
center each row horizontally and the block vertically. The non-binding axis
carries honest centered whitespace.

### Behaviour by case

- **Single photo / sparse** — one grouping; pillarbox/letterbox, centered margins
- **Dense pages** — winning grouping fills width with `s ≈ 1`; ≈ unchanged
- **Middle cases** (4 squarish landscapes, 3-3-1) — balanced, largest-photo
  grouping wins over a lopsided exact fit (2-2 not 3-1; 2 rows not 3)

## Acceptance Criteria

- [x] Every box's aspect ratio matches its source photo (no crop), all page types
- [x] Single-photo page shows the whole photo, centered, no face-slicing
- [x] 3-3-1-style pages consolidate to fuller rows, not 65%-width blocks
- [x] 4 squarish landscapes lay out balanced (2-2), not lopsided (3-1)
- [x] Dense multi-row pages still fill the page width
- [x] Deterministic; no image re-decoding (pure aspect-ratio math)

## Notes

Accepted trade-off: **whitespace, never crop**. Pages whose photos don't match
the page's landscape aspect carry centered margins rather than filling
edge-to-edge — unavoidable geometry once cropping is off the table.

Dead theme constants `maxCropRatio`, `minPhotosPerPage`, `minDimension` remain
unused; `maxCropRatio` encoded the crop-budget approach this revision supersedes.
Candidates for a future cleanup.

Evolution: height-only stretch (cropped) → uniform scale at fixed `H/2` grouping
(no crop, wasted space on sparse pages) → uniform scale with area-optimal
grouping selection (no crop, minimal wasted space).
