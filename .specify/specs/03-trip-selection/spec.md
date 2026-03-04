# 03 — Trip Selection on Import

## Overview

After a user selects a travel export ZIP file, show them a list of all trips found inside and let them choose which one to import — instead of silently importing the earliest trip.

## Problem

A travel data export ZIP typically contains multiple trips, but the current import flow silently picks the trip with the earliest start date and ignores the rest. The user has no visibility into what's in their ZIP and no way to import any trip other than the first one. This makes the import feel like a black box and effectively locks out most of their data.

## User Stories

1. **As a** user importing a ZIP with multiple trips, **I want to** see all the trips inside it **so that** I can choose which one to import.
2. **As a** user looking at the trip list from my ZIP, **I want to** see enough detail (name, dates, chapter count) to identify each trip **so that** I pick the right one.
3. **As a** user who has already imported some trips, **I want to** see which trips from the ZIP are already in my vault **so that** I can make an informed choice before re-importing.

## Acceptance Criteria

- [ ] After selecting a ZIP file, the app extracts it and finds all trip directories inside
- [ ] If the ZIP contains exactly one trip, it imports immediately (current behavior, no selection screen)
- [ ] If the ZIP contains multiple trips, the user sees a selection screen listing all found trips
- [ ] Each trip in the selection list shows: trip name, date range, and chapter count (read from `trip.json` metadata — no photo counting at this stage)
- [ ] Trips already present in the vault (matched by trip `id`) are visually marked (e.g., "Already imported" label)
- [ ] Tapping an already-imported trip shows a confirmation prompt (e.g., "This trip is already in your vault. Import again to update it?") before proceeding
- [ ] The user taps a trip to begin importing it (single selection, not batch)
- [ ] After a successful import, the user is taken to the imported trip's detail view
- [ ] The user can dismiss the selection screen to return to the trip list / import prompt without importing anything
- [ ] If the ZIP contains zero valid trips, the existing "no trip found" error is shown
- [ ] The selection screen supports RTL/LTR trip names (`dir="auto"`, `<bdi>`)
- [ ] The large file warning (>500 MB) still appears before extraction, as it does today
- [ ] Trip names in the selection list are sanitized (no raw HTML)

## Out of Scope

- Batch selection (importing multiple trips at once)
- Photo count or preview in the selection screen (requires scanning photo directories, too slow for a selection phase)
- Sorting or filtering the trip list
- Importing multiple trips from the same ZIP in one session (user re-selects the ZIP for each additional trip)
- Any changes to the single-trip import pipeline itself — only the entry point changes

## Open Questions

None — ready for design.
