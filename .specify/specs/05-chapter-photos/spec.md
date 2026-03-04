# 05 — Chapter Photos

** CRUCIAL: DO NOT WORK ON THIS FILE UNTIL IT WAS APPROVED AGAIN BY /PRODUCT ** 

## Overview

Display photos within each chapter on the trip detail page, loaded from OPFS with lazy loading and proper memory management. This adds the visual layer to the chapter timeline built in spec 04.

## Problem

The trip detail view (spec 04) shows trip metadata and chapter text, but the photos — the most emotionally important part of any travel memory — are still invisible. They sit in OPFS storage with no way to see them. A trip detail without photos is like a diary without illustrations.

## User Stories

1. **As a** user viewing a chapter, **I want to** see the photos I took there alongside the location and description **so that** the visual and written memories are connected.
2. **As a** user with a large trip (many chapters, many photos), **I want** the page to remain fast and responsive **so that** browsing my memories isn't frustrating.

## Acceptance Criteria

### Photo Display

- [ ] Each chapter shows the photos associated with it, loaded from OPFS
- [ ] Photos within a chapter are displayed in their current storage order (no re-sorting)
- [ ] Photos are displayed in a grid or flowing layout within the chapter
- [ ] A chapter with no photos renders cleanly (no empty grid, no placeholder)
- [ ] If a photo file is missing from OPFS (orphaned metadata), it is silently skipped — no broken image shown

### Loading & Performance

- [ ] Photos are loaded lazily — only photos near the viewport are fetched from OPFS
- [ ] Photos load progressively — the page is usable before all photos have loaded
- [ ] While a photo is loading, a placeholder (skeleton or subtle background) is shown at the correct aspect ratio or a fixed size to prevent layout shift
- [ ] Object URLs created for photos are revoked when the component unmounts or when the photo scrolls far out of view (no memory leaks)
- [ ] A trip with 100+ photos across many chapters does not freeze or crash the page

### Accessibility

- [ ] All images have descriptive alt text (using chapter location name and position, e.g., "Photo 3 from Amsterdam")
- [ ] Photo grid is navigable by keyboard

## Out of Scope

- Photo lightbox / full-screen viewer (tapping a photo to enlarge)
- Photo reordering, deletion, or any write operations
- Video playback
- Photo captions or metadata display (EXIF, date taken)
- Photo zoom or pan

## Open Questions

None — ready for design.
