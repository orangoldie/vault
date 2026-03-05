# 04 — Trip Detail View: Header & Chapter Timeline — Design

## User Flow

```
1. User is on the home screen (trip list) and taps a trip card
   -> navigates to /trip/[slug]
   -> loading skeleton appears while data is fetched from IndexedDB

2a. Trip found, chapters exist
   -> full trip detail page renders: hero cover photo, trip header, chapter timeline
   -> user scrolls down through chapters in chronological order

2b. Trip found, zero chapters (defensive guard)
   -> trip header renders normally
   -> in place of the timeline, a gentle "No chapters recorded" message appears

2c. Trip not found (slug doesn't match any trip)
   -> "Trip not found" message with a link back to the trip list

2d. IndexedDB read fails
   -> error message with a "Try Again" button that re-attempts the data load

3. User scrolls through the chapter timeline
   -> chapters are displayed sequentially, each showing location, date, weather (if present), description
   -> the page feels like reading a travel journal — one chapter after another, with breathing room

4. User navigates back
   -> back button in the header or browser back returns to the trip list (/)
```

## Screens / Views

This feature introduces a new page at `/trip/[slug]`. It is a full-page, scrollable view with distinct vertical sections.

### Section 1: Hero Cover Photo

The emotional first impression. A full-bleed cover image that fills the viewport width above the header content.

- If `coverPhotoId` exists: display the photo as a large hero image spanning the full width of the page, with a maximum height constraint so it doesn't push all content below the fold
- The cover photo is loaded from OPFS by decomposing the `coverPhotoId` composite key (`tripId-chapterId-filename`) into its parts and calling `readPhoto(tripId, chapterId, filename)`. Because filenames may contain hyphens, the decomposition must split on the first two hyphens only (not a naive split on all hyphens)
- A subtle dark gradient overlay at the bottom of the image ensures the trip name (overlaid on the image) is always legible
- If no cover photo exists: the hero area is omitted entirely — no empty gap, no placeholder. The trip header starts at the top of the page with comfortable top padding instead

### Section 2: Trip Header

The at-a-glance summary of the entire trip. Sits directly below the hero (or at the top of the page if no hero).

- **Trip name**: the dominant element — large, bold, serving as the page's h1. If a cover photo exists, the trip name is overlaid on the bottom of the hero image (white text on the gradient). If no cover photo, the trip name sits at the top of the content area in the standard text color
- **Date range**: formatted start-to-end date (using the existing `formatDateRange` utility)
- **Summary text**: the trip's full summary, preserving line breaks, displayed in full (no truncation). Supports bidirectional text via `dir="auto"`
- **Stats row**: a horizontal row of compact stats — total distance (km), chapter count, photo count. Each stat is an icon + value pair, using the same icon set as the trip list (MapPin, ImageIcon, Route)

### Section 3: Chapter Timeline

The heart of the page. A vertical, chronological list of all chapters.

- Chapters are ordered by `startTime` ascending (earliest first)
- A subtle vertical timeline line runs along the left edge, connecting chapters visually and reinforcing the chronological, journal-like progression
- Each chapter is a distinct card-like section along the timeline

### Section 4: Back Navigation

- A fixed or sticky back button at the top-left of the page that returns to `/`
- Uses an arrow-left icon with "Back" label (or just the icon on mobile)
- Always visible, even while scrolling

## Components

### TripDetailPage

The page-level component at `/trip/[slug]`. Responsible for:

- Reading the slug from the URL
- Looking up the trip by slug in IndexedDB
- Fetching chapters for the trip
- Rendering the appropriate state (loading, error, not-found, success)
- This is a client component (needs IndexedDB access, state management)

### BackButton

A navigation element that returns the user to the trip list.

- Arrow-left icon (ChevronLeft or ArrowLeft from Lucide)
- Positioned at top-left of the page
- Semi-transparent background so it floats over the hero image without obscuring it
- Solid background when no hero image is present
- Keyboard accessible, focus-visible ring

### HeroCover

The full-bleed cover photo area.

- Receives the `coverPhotoId` and renders the image
- Handles its own loading state (shows a subtle placeholder shimmer while the photo blob is being read from OPFS)
- Applies a bottom gradient overlay for text legibility
- The trip name is rendered inside this component, positioned at the bottom-left over the gradient
- Aspect ratio: roughly 16:9 on desktop, taller (closer to 4:3) on mobile, with a max-height so it never dominates the entire viewport
- The image uses `object-fit: cover` to fill the frame without distortion

### TripHeader

The metadata area below the hero (or at the top if no hero).

- When a hero exists: contains date range, summary, and stats (the trip name is in the hero)
- When no hero exists: also contains the trip name as an h1
- Summary text is rendered with `whitespace-pre-line` to preserve line breaks, `dir="auto"` for bidirectional text. If the summary is empty or absent, the summary element is omitted entirely — no empty space or placeholder, same collapse behavior as chapter descriptions
- Stats are displayed as a horizontal row with subtle icon + value pairs

### TripStats

A horizontal row of trip statistics.

- Distance: Route icon + "{n} km" (formatted with thousands separator)
- Chapters: MapPin icon + "{n} chapters"
- Photos: ImageIcon icon + "{n} photos"
- Each stat uses `body-small` size, `text-secondary` color
- On narrow screens, the stats wrap to a second line if needed (flex-wrap)

### ChapterTimeline

The container for the chronological chapter list.

- Renders the vertical timeline line on the left
- Maps over sorted chapters and renders a ChapterCard for each
- Handles the "no chapters" empty state internally

### ChapterCard

An individual chapter in the timeline.

- **Timeline dot**: a small circle on the timeline line, marking this chapter's position
- **Location name**: the chapter's `displayName` — prominent, serving as an h2. Supports bidirectional text
- **Country/region**: the `location.detail` or `location.fullDetail` below the location name, in muted text
- **Date**: formatted date or date range for the chapter. Uses the chapter's `startTime` (and `endTime` if present and different from start). Format: same locale-friendly style as the trip header (e.g., "Feb 9, 2025" for a single date, or "Feb 9 – Feb 14, 2025" for a range). Use the existing `formatDateRange` utility for ranges and a consistent `formatDate` helper for single dates. Displayed in `body-small`, `text-secondary`
- **Weather** (conditional): if `weatherCondition` and/or `weatherTemperature` are present, display as a compact text line: "{condition}, {temperature}°C". If only temperature is present, show just the temperature. If only condition, show just the condition label. No icons — text only
- **Description** (conditional): the chapter's description text, preserving line breaks (`whitespace-pre-line`), `dir="auto"` for bidirectional text. Displayed in full, no truncation. If no description, this element is simply absent — no empty space
- Chapters without a description still render cleanly: location, date, and weather (if any) are sufficient

### TripNotFound

A simple centered message for when the slug doesn't match any trip.

- Headline: "Trip not found"
- Subtext: "This trip doesn't exist or may have been removed."
- A link/button: "Back to your trips" that navigates to `/`

### TripDetailError

An error state for when the IndexedDB read fails.

- Warning icon (AlertTriangle, amber)
- Headline: "Something went wrong"
- Subtext: "We couldn't load this trip. This might be a temporary issue."
- "Try Again" button that re-attempts the data fetch

### TripDetailSkeleton

A loading skeleton that mirrors the layout of the real content.

- A large rectangular shimmer block where the hero image would be
- Shimmer lines for the trip name, date, and summary
- Several shimmer blocks for chapter cards in the timeline
- Provides spatial continuity so the page doesn't jump when real content loads

## Interactions

All transitions use the existing Framer Motion pattern and motion tokens established in design 01 (`duration-normal` / 250ms, `ease-in-out` for crossfades). Reduced-motion behavior uses the same `prefers-reduced-motion` guard (0ms durations when active).

### Page Load Transition

- The skeleton appears immediately on navigation
- Once data is loaded, content fades in using Framer Motion (a single, gentle opacity transition with `duration-normal` timing)
- If the user has `prefers-reduced-motion`, content appears instantly (no fade)

### Scroll Behavior

- The page is a natural, vertically scrollable document — no custom scroll containers or snap points
- The hero image scrolls with the page (no parallax in v1 — keep it simple)
- The back button remains accessible at all times (sticky positioning)

### Cover Photo Loading

- The cover photo may take a moment to load from OPFS
- While loading: the hero area shows a muted shimmer placeholder at the expected dimensions
- On load: the image fades in gently (200ms opacity transition)
- On failure: the hero area is removed and the page renders as if no cover photo exists — no broken image indicator

### Back Navigation

- Tapping the back button navigates to `/` (the trip list)
- Browser back button also works (standard Next.js routing)
- Keyboard: the back button is focusable and activatable with Enter/Space

### States

- **Loading**: skeleton shimmer for hero, header, and chapter timeline areas
- **Success**: full content rendered — hero (if cover photo), header, chapter timeline
- **Error (data fetch failed)**: centered error message with retry button. Retry re-fetches from IndexedDB
- **Not found (invalid slug)**: centered "trip not found" message with back link
- **Empty chapters (defensive)**: trip header renders normally; in place of the chapter timeline, a muted message: "No chapters recorded for this trip"

## Wireframe Descriptions

### Full Trip Detail (with cover photo)

```
+--------------------------------------------------+
| [<- Back]                                        |
|                                                  |
|            ┌──────────────────────┐              |
|            |                      |              |
|            |   (cover photo,      |              |
|            |    full-bleed)       |              |
|            |                      |              |
|            |   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |  <- gradient |
|            |   Trip Name Here     |  <- overlaid |
|            └──────────────────────┘              |
|                                                  |
|  Feb 9 - Jun 10, 2025                           |
|                                                  |
|  This was an incredible journey through          |
|  Southeast Asia. We visited temples,             |
|  ate amazing food, and met wonderful people.     |
|                                                  |
|  📍 56 chapters  ·  🖼 213 photos  ·  🛤 23,175 km |
|                                                  |
|  ─────────────────────────────────────           |
|                                                  |
|  CHAPTER TIMELINE                                |
|                                                  |
|  ●─── Bangkok, Thailand                         |
|  |    Bangkok, Thailand                          |
|  |    Feb 9, 2025                                |
|  |    Partly Cloudy, 31°C                       |
|  |                                               |
|  |    Arrived in Bangkok late at night.           |
|  |    The heat hit us immediately...             |
|  |                                               |
|  ●─── Chiang Mai                                |
|  |    Chiang Mai, Thailand                       |
|  |    Feb 14, 2025                               |
|  |    Clear, 28°C                               |
|  |                                               |
|  |    The old city is surrounded by a moat       |
|  |    and ancient walls...                       |
|  |                                               |
|  ●─── Luang Prabang                             |
|  |    Luang Prabang, Laos                        |
|  |    Feb 20, 2025                               |
|  |                                               |
|  |    (no description — card still renders       |
|  |     cleanly with just location and date)      |
|  |                                               |
|  ●─── ...more chapters                          |
|                                                  |
+--------------------------------------------------+
```

### Full Trip Detail (no cover photo)

```
+--------------------------------------------------+
| [<- Back]                                        |
|                                                  |
|                                                  |
|  Trip Name Here                    <- h1, large  |
|                                                  |
|  Feb 9 - Jun 10, 2025                           |
|                                                  |
|  Summary text here, preserving                   |
|  line breaks as written...                       |
|                                                  |
|  📍 56 chapters  ·  🖼 213 photos  ·  🛤 23,175 km |
|                                                  |
|  ─────────────────────────────────────           |
|                                                  |
|  (chapter timeline, same as above)               |
|                                                  |
+--------------------------------------------------+
```

### Loading Skeleton

```
+--------------------------------------------------+
| [<- Back]                                        |
|                                                  |
|  ┌──────────────────────────────┐                |
|  |  ░░░░░░░░░░░░░░░░░░░░░░░░░  |  <- hero       |
|  |  ░░░░░░░░░░░░░░░░░░░░░░░░░  |     shimmer    |
|  |  ░░░░░░░░░░░░░░░░░░░░░░░░░  |                |
|  └──────────────────────────────┘                |
|                                                  |
|  ░░░░░░░░░░░░░░░░░░░  <- trip name shimmer      |
|  ░░░░░░░░░░░░  <- date shimmer                  |
|  ░░░░░░░░░░░░░░░░░░░░░░░  <- summary shimmer    |
|  ░░░░░░░░░░░░░░░░░  <- summary line 2           |
|                                                  |
|  ░░░░  ░░░░  ░░░░  <- stats shimmer             |
|                                                  |
|  ─────────────────────────────────────           |
|                                                  |
|  ●─── ░░░░░░░░░░░░░░  <- chapter shimmer        |
|  |    ░░░░░░░░░░                                 |
|  |    ░░░░░░░░░░░░░░░░░░░                        |
|  |                                               |
|  ●─── ░░░░░░░░░░░░░░                            |
|  |    ░░░░░░░░                                   |
|  |    ░░░░░░░░░░░░░░░░                           |
|                                                  |
+--------------------------------------------------+
```

### Trip Not Found

```
+--------------------------------------------------+
| [<- Back]                                        |
|                                                  |
|                                                  |
|                                                  |
|            Trip not found                        |
|                                                  |
|   This trip doesn't exist or may                 |
|   have been removed.                             |
|                                                  |
|          [Back to your trips]                    |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

### Error State

```
+--------------------------------------------------+
| [<- Back]                                        |
|                                                  |
|                                                  |
|                   ⚠                              |
|                                                  |
|          Something went wrong                    |
|                                                  |
|   We couldn't load this trip.                    |
|   This might be a temporary issue.               |
|                                                  |
|            [Try Again]                           |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

### Empty Chapters

```
+--------------------------------------------------+
| [<- Back]                                        |
|                                                  |
|  (hero or no hero — normal trip header)          |
|                                                  |
|  Trip Name Here                                  |
|  Feb 9 - Jun 10, 2025                           |
|  ...                                             |
|                                                  |
|  ─────────────────────────────────────           |
|                                                  |
|   No chapters recorded for this trip.            |
|                                                  |
+--------------------------------------------------+
```

## Layout & Responsive Behavior

### Desktop (>768px)

- Content area is constrained to a max-width of ~720px, centered on the page
- The hero cover photo extends full-bleed (edge to edge of the viewport) while the text content below stays within the max-width container
- Comfortable horizontal padding (24-32px)
- Chapter timeline has generous vertical spacing between cards

### Mobile (<768px)

- Content is full-width with 16-24px horizontal padding
- Hero image is full-bleed, taller aspect ratio (closer to 4:3)
- Trip name on the hero uses a slightly smaller font size to avoid overflow
- Stats row wraps if needed
- Chapter cards use slightly tighter vertical spacing to reduce scrolling
- Back button uses icon-only (no "Back" label) to save horizontal space
- Touch targets: all interactive elements are at least 44x44px

### Content Width

- Hero image: full viewport width (breaks out of the content container)
- All text content: max-width ~720px, centered. This is wider than the import flow's 480px because the trip detail is a reading view that benefits from more line length
- Timeline line: positioned within the content container, inset from the left edge

## Accessibility Notes

1. **Heading hierarchy**: Trip name is `h1`. Each chapter location name is `h2`. This creates a logical, scannable structure for screen readers.

2. **Landmark regions**: The trip header is within a `<header>` or `<section aria-label="Trip summary">`. The chapter timeline is within a `<section aria-label="Chapter timeline">`. The back button is within a `<nav>` element.

3. **Back button**: Has `aria-label="Back to trip list"` for screen readers that can't see the icon. Keyboard accessible (Tab + Enter/Space).

4. **Cover photo**: The hero image uses a meaningful `alt` attribute: "Cover photo for {trip name}". If the image fails to load, the `alt` text is not exposed (the element is removed).

5. **Bidirectional text**: All user-generated text (trip name, summary, chapter names, descriptions) uses `dir="auto"` and `<bdi>` wrapping. UI chrome remains LTR English.

6. **Weather text**: Weather info is plain text, naturally readable by screen readers. The temperature degree symbol is part of the text content (e.g., "31°C") — no special ARIA needed.

7. **Reduced motion**: The page load fade-in, cover photo fade-in, and any scroll-based animations respect `prefers-reduced-motion: reduce` by becoming instant. The skeleton shimmer animation also stops (shows a static muted background instead).

8. **Keyboard navigation**: The page is a standard scrollable document. Tab moves focus through the back button, then through any other focusable elements. Chapter cards are not individually focusable (they are read-only content, not interactive) — focus skipping them is correct behavior.

9. **Skip to content**: If the hero image is tall, a "Skip to content" link (visually hidden until focused) at the top of the page lets keyboard users jump past the hero to the trip header content.

10. **Aria-live region for state transitions**: The page container includes an `aria-live="polite"` region that announces state changes — e.g., when loading completes ("Trip loaded"), when an error occurs ("Error loading trip"), or when a not-found state is shown ("Trip not found"). This is consistent with the pattern established in prior designs (01, 03).

11. **Focus management after loading**: When the page transitions from the loading skeleton to the success state, focus moves to the trip name (`h1`). When transitioning to the error or not-found state, focus moves to the respective heading. This follows the same focus-after-transition pattern used in the import flow.

12. **Color contrast**: All text meets WCAG AA contrast. The white trip name on the hero gradient overlay must maintain sufficient contrast — the gradient should be dark enough (at least 4.5:1 ratio for normal text, 3:1 for large text). The trip name on the hero qualifies as large text (>= 18pt bold).

## Visual Direction

- **Journal-like, not dashboard-like**: generous vertical spacing between chapters, clear visual rhythm. Each chapter should feel like turning a page, not scanning a row in a table.
- **The cover photo is the emotional hook**: it should be large, vivid, and immediate. The gradient + overlaid trip name creates a cinematic, magazine-cover feel.
- **Typography carries the weight**: with no chapter photos in this spec, the text content is doing all the storytelling. Chapter locations should be prominent. Descriptions should be comfortable to read (good line length, generous line height).
- **The timeline line is a subtle structural element**: thin (1-2px), using the `border` color token. It's there for visual continuity, not as a heavy decorative element. The dots marking each chapter are small (8-10px diameter), filled with `accent` color.
- **Warm, receding palette**: consistent with the established design system — warm neutrals, the user's content is the hero. The UI chrome (back button, timeline line, stat icons) stays muted and secondary.
- **No decorative elements**: no illustrations, no empty-state artwork. The trip's own content — its name, summary, locations, descriptions, and cover photo — provides all the visual richness.
