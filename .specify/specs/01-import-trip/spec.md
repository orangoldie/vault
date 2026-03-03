# 01 — Import a Polarsteps Trip Export

## Overview

Allow users to select a Polarsteps data-export ZIP file and import a single trip — including metadata, steps, and photos — into the app's local storage. This is the foundational data-entry point; nothing else in the app works without it.

## Problem

Polarsteps users who download their data export receive a ZIP file containing raw JSON files and image directories. There is no way to browse, view, or enjoy these memories without manually digging through files. The first step toward solving this is getting that data into the app.

## User Stories

1. **As a** Polarsteps user, **I want to** select my Polarsteps export ZIP file so that the app can read and store my trip data locally.
2. **As a** user importing a trip, **I want to** see clear progress and feedback during import so I know it's working and when it's done.
3. **As a** user importing a trip, **I want to** see a confirmation of what was imported (trip name, number of steps, number of photos) so I trust the import succeeded.
4. **As a** user, **I want to** see a helpful error message if the folder I selected doesn't contain valid Polarsteps data, so I know what went wrong.

## Acceptance Criteria

- [ ] User can select a `.zip` file via a file picker
- [ ] App extracts the ZIP in-browser and locates trip data inside `user_data/trip/<slug>_<id>/`
- [ ] If the ZIP contains multiple trips, the trip with the earliest `start_date` is imported (multi-trip support is out of scope)
- [ ] App reads and parses `trip.json` and extracts: trip name, slug, start/end dates, summary, cover photo (resolved via `cover_photo.path` relative to the trip directory), step count, total km
- [ ] App reads each step's data from `trip.json → all_steps[]` and extracts: display name, description, start/end time, location (name, country, lat/lon), weather
- [ ] App reads photo files from each step's `<step-slug>_<id>/photos/` subdirectory and stores them as blobs
- [ ] All imported data (trip metadata, steps, photos) is persisted in IndexedDB
- [ ] A progress indicator shows the import is in progress (step count / photo count)
- [ ] On success, user sees a summary: trip name, number of steps imported, number of photos imported
- [ ] On failure (not a valid ZIP, missing `trip.json`, malformed JSON, empty trip), user sees a clear, non-technical error message
- [ ] On failure due to browser storage quota exceeded, user sees a clear error explaining they don't have enough storage space
- [ ] Importing the same trip twice replaces the previous import (upsert by trip `id`). Old data is only removed after the new import fully succeeds — a failed re-import must not destroy existing data
- [ ] All user-generated text from the ZIP (trip names, step names, descriptions) is sanitized before rendering to prevent XSS — no raw HTML insertion
- [ ] RTL and LTR text in trip names, step names, and descriptions is stored and displayed correctly
- [ ] If the selected ZIP file exceeds 500 MB, user sees a warning before import begins (import still proceeds if confirmed)
- [ ] Works in latest Chrome, Firefox, and Safari

## Data Shape (from sample exports)

The import must handle this ZIP structure (`user_data.zip`):

```
user_data.zip
├── user/
│   └── user.json              ← user profile (id, name, location)
└── trip/
    └── <trip-slug>_<id>/
        ├── trip.json           ← trip metadata + all_steps[] array
        ├── locations.json      ← GPS track points (lat, lon, time)
        └── <step-slug>_<id>/
            ├── photos/         ← jpg files for this step (UUID-based filenames, .jpg.jpg extension)
            └── videos/         ← mp4 files for this step (future)
```

Key fields from `trip.json`:
- Trip level: `id` (number), `name`, `slug`, `start_date`, `end_date`, `summary`, `cover_photo` (object with `id`, `path` (relative to trip directory, e.g., `step-slug_123/photos/uuid.jpg.jpg`), `uuid`), `step_count`, `total_km`, `uuid`
- Step level (`all_steps[]`): `id` (number), `display_name`, `description`, `slug`, `start_time`, `end_time`, `location` (object with `name`, `detail` (country/region string), `full_detail`, `country_code`, `lat`, `lon`), `weather_condition`, `weather_temperature`, `uuid`

Note: The ZIP may contain multiple trip directories under `trip/`. In v1, import the trip with the earliest `start_date`. If dates are equal or missing, fall back to alphabetical directory name order.

## Out of Scope

- Video import (photos only in v1 of this feature)
- GPS track/route import (`locations.json` — separate future feature)
- Importing from an unzipped folder (ZIP only)
- User profile import (`user.json` — separate future feature)
- Importing multiple trips at once (one trip per import action)
- Any trip viewing or browsing UI (that's the next feature)
- Thumbnail generation or image optimization
- Cloud/server storage of any kind

## Decisions

1. **ZIP parsing**: Done client-side in the browser using a JS zip library (e.g., fflate). No server involved.
2. **Large imports**: No upper bound on trip size. If browser storage quota is exceeded, show a clear error. For ZIP files over 500 MB, show a warning before proceeding.
3. **RTL/LTR text**: The app must support both RTL and LTR text from the start. Trip names, step names, and descriptions can be in any language/direction.
4. **Text sanitization**: All user-generated text from the ZIP is rendered as plain text only — never injected as raw HTML. This prevents XSS even though the app is client-side (IndexedDB data could be manipulated by other scripts on the same origin).

## Open Questions

None — ready for design.
