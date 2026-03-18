# Backlog

Ideas, open questions, and future features that don't belong to a specific spec yet.

## Open Questions

- **Photo ordering within a chapter**: Travel exports don't include explicit photo ordering metadata. Filenames are UUID-based, so alphabetical order is effectively random. Need to investigate if there's a timestamp in EXIF data or if the export preserves any implicit ordering (e.g., file position in the ZIP, or a photos array in the JSON). Also investigate whether we can infer which photo should be the "hero" for each chapter (e.g., cover photo metadata, first photo in the export array, EXIF timestamp closest to chapter start time). Currently P1 uses arbitrary IndexedDB return order — revisit once we understand the data better.

## Bugs

- **ChapterNavPill popover doesn't close on scroll**: The scroll listener in `chapter-nav-pill.tsx` is wired up correctly (`useEffect` + `window.addEventListener("scroll", ...)`) but never fires. Console logs confirmed the effect doesn't run, suggesting the component may not be mounting — possibly a caching issue or stale build. Need to inspect the rendered pill element in DevTools to confirm which component is actually rendering. Code: `src/features/trip-detail/components/chapter-nav-pill.tsx` lines 37-45.

- **Duplicate trip slugs**: Multiple trips with the same name (e.g., "A New Adventure") produce identical URL slugs (`/trip/a-new-adventure`), causing routing collisions. Need a uniqueness strategy — e.g., append a short hash or numeric suffix when a slug already exists in IndexedDB (`a-new-adventure-2`, or `a-new-adventure-k7x`).

## Housekeeping

- **Create a LICENSE file**: Add a project license file that includes third-party attribution for OpenStreetMap (ODbL), Protomaps (BSD-3-Clause), and other open-source dependencies used in the project.

## Future Feature Ideas

- **Complete weather icon mapping**: Weather icons are implemented in `src/features/trip-detail/lib/weather-icon.ts` using Lucide icons, rendered inline in chapter metadata (`chapter-section.tsx`). The mapping uses Visual Crossing condition slugs (kebab-case, with optional `-day`/`-night` suffix). **Confirmed from real export data:** `partly-cloudy-day` → `CloudSun`, `clear-day` → `Sun`, `cloudy` → `Cloud`. **Unconfirmed (added speculatively):** `clear-night`, `partly-cloudy-night`, `rain`, `showers-day`, `showers-night`, `thunder-rain`, `thunder-showers-day`, `thunder-showers-night`, `snow`, `snow-showers-day`, `snow-showers-night`, `sleet`, `fog`, `wind`, `overcast`. Need more export data from different climates/seasons to verify the full set of possible values and ensure no conditions are missed. Unknown conditions gracefully fall back to no icon (temperature still shows).

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
- **Globe lat/lon grid lines**: Add subtle latitude/longitude strip lines to the globe so it feels more like a real earth/navigational instrument
- **Cross-chapter lightbox navigation**: When viewing chapter photos in the lightbox and reaching the last photo, allow navigating forward into the next chapter's photos seamlessly (and vice versa for the first photo going backwards)
- **Bookmarks**: Allow users to bookmark a specific chapter or position in a trip so they can quickly jump back to it later
- **Sidebar chapter grouping**: Group chapters in the sticky sidebar nav by country or city. Chapters sharing the same country (or city) would appear under a shared heading/divider, making long trips easier to scan. Useful for trips that revisit the same country or have many chapters in one location
- **Google Drive backup**: Allow users to save/sync their vault data (trips, photos) to Google Drive for cloud backup and cross-device access
- **Video trip summary**: Generate a short video recap of a trip — slideshow of photos with transitions, background music, overlaid text (trip name, dates, locations), and optional map animation showing the route
