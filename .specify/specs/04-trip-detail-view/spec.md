# 04 — Trip Detail View: Header & Chapter Timeline

## Overview

Display a single imported trip as a scrollable page with a trip header and chronological chapter timeline (text content only, no photos). This is the core viewing experience that gives users a window into their archived memories.

## Experience Intent

The trip detail view should feel like opening a travel journal, not reading a log file. The user's first impression is a full-bleed cover photo and trip title — immersive and emotional. Chapters are explored sequentially, one at a time or in small groups, with a sense of progression. The design should reward the user for having recorded their trip, not make them work to consume it. Prioritize visual impact and pacing over information density.

## Problem

Users can import their travel data, but have no way to actually see their memories. The trip list shows only names and stats. The places, dates, descriptions, and weather that make a trip meaningful are locked inside IndexedDB with no way to experience them. Without a detail view, the app is an archive with no window.

## User Stories

1. **As a** user who has imported a trip, **I want to** click on it and see my chapters and details **so that** I can relive my travel memories.
2. **As a** user viewing a trip, **I want to** scroll through my chapters in chronological order **so that** the trip unfolds naturally, the way I experienced it.
3. **As a** user viewing a trip, **I want to** see the trip's name, dates, summary, and stats at the top **so that** I get an immediate sense of the trip as a whole.
4. **As a** user viewing a trip, **I want to** navigate back to my trip list **so that** I can switch between trips.

## Acceptance Criteria

### Navigation

- [ ] Clicking a trip card in the trip list navigates to that trip's detail page
- [ ] The URL uses the trip slug (e.g., `/trip/[slug]`); the slug is used to look up the trip
- [ ] A back action (button or browser back) returns to the trip list
- [ ] Navigating to a slug that doesn't exist shows a clear "trip not found" message with a link back to the trip list

### Trip Header

- [ ] Displays the trip name, date range (formatted), summary text, total distance (in km), and chapter/photo counts
- [ ] Chapter count and photo count use the stored Trip fields (`chapterCount`, `photoCount`)
- [ ] If a cover photo exists (`coverPhotoId`), it is displayed as a hero image at the top. Note: the cover photo is a regular Photo record; `coverPhotoId` is a composite key (`tripId-chapterId-filename`) that must be decomposed to retrieve the file
- [ ] If no cover photo exists, the header still looks complete (no broken image, no empty gap)
- [ ] Trip name and summary support bidirectional text
- [ ] Summary text preserves line breaks and is displayed in full — no truncation

### Chapter Timeline

- [ ] All chapters are displayed in chronological order (by `startTime`)
- [ ] Each chapter displays: location name, country/region, date(s), and description (if present)
- [ ] Chapter descriptions preserve line breaks and are displayed in full — no truncation
- [ ] Chapter descriptions support bidirectional text
- [ ] Chapters without a description still render cleanly (no empty space or broken layout)

### Weather

- [ ] If a chapter has weather data, the weather condition label and temperature are displayed as text alongside the chapter's location/date info
- [ ] Temperature is displayed in °C (integer, no decimal)
- [ ] Chapters without weather data render cleanly — no placeholder or empty space

### States

- [ ] **Loading**: while trip data is being read, the user sees a skeleton or loading indicator
- [ ] **Success**: the full trip detail (header + chapter timeline) renders as described above
- [ ] **Error**: if IndexedDB read fails, the user sees a friendly error message with a retry option
- [ ] **Empty chapter list**: (defensive guard — the import pipeline rejects trips with zero chapters, but if it ever happens) display the trip header with a message like "No chapters recorded for this trip"

### Accessibility

- [ ] The page has a logical heading hierarchy (trip name as h1, chapter names as h2 or similar)
- [ ] The page is navigable by keyboard
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Weather text is readable by screen readers

## Out of Scope

- Weather condition icons (text labels only for now; icon mapping is in the backlog)
- Chapter photo grids (covered in spec 05) — the cover photo hero image in the trip header IS in scope
- Photo lightbox / full-screen viewer
- Editing trip or chapter content
- Map view or GPS track display
- Video playback
- Sharing or exporting
- Chapter reordering or any write operations

## Open Questions

None — ready for design.
