# Backlog

Ideas, open questions, and future features that don't belong to a specific spec yet.

## Open Questions

- **Photo ordering within a chapter**: Travel exports don't include explicit photo ordering metadata. Filenames are UUID-based, so alphabetical order is effectively random. Need to investigate if there's a timestamp in EXIF data or if the export preserves any implicit ordering (e.g., file position in the ZIP, or a photos array in the JSON). Also investigate whether we can infer which photo should be the "hero" for each chapter (e.g., cover photo metadata, first photo in the export array, EXIF timestamp closest to chapter start time). Currently P1 uses arbitrary IndexedDB return order — revisit once we understand the data better.

## Bugs

- **ChapterNavPill popover doesn't close on scroll**: The scroll listener in `chapter-nav-pill.tsx` is wired up correctly (`useEffect` + `window.addEventListener("scroll", ...)`) but never fires. Console logs confirmed the effect doesn't run, suggesting the component may not be mounting — possibly a caching issue or stale build. Need to inspect the rendered pill element in DevTools to confirm which component is actually rendering. Code: `src/features/trip-detail/components/chapter-nav-pill.tsx` lines 37-45.

## Future Feature Ideas

- **Weather condition icons**: Map Dark Sky condition slugs (`clear-day`, `clear-night`, `partly-cloudy-day`, `partly-cloudy-night`, `cloudy`, `rain`, `snow`, `wind`, `fog`) to visual icons in the chapter timeline. Include fallback for unknown slugs and accessible labels. Extracted from spec 04 to keep scope tight.

- **Photo lightbox / full-screen viewer**: tap a photo to view it enlarged with swipe navigation
- **Map view**: plot chapters on a world map using GPS coordinates, import `locations.json` track data
- **Static HTML export**: generate a self-contained website per trip that works forever without any app
- **PDF photo book export**: formatted, printable document with cover, chapters, photos, maps
- **Trip editing**: modify text, descriptions, reorder photos
- **AI-assisted organization**: use AI to help organize/curate photos within a trip
- **"On this day" feature**: surface memories from the same date in previous years
- **Statistics dashboard**: countries visited, total distance, days traveling, photos taken
- **Multi-trip import**: batch-select and import multiple trips from a ZIP at once
- **User profile import**: import `user.json` data from the export
- **Video support**: import and play video files from chapter directories
- **GPS track import**: import `locations.json` route data for map display
- **Data portability export**: export to markdown + images, structured JSON, or other open formats
