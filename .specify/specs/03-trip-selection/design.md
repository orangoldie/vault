# 03 — Trip Selection on Import: Design

## User Flow

1. User is on the home screen (import prompt or vault trip list)
2. User taps "Import Trip" and selects a ZIP file
3. If the file is >500 MB, the existing large-file warning appears first
4. The app extracts the ZIP and scans for valid trips (brief loading moment)
5. **One trip found** → skip selection, proceed directly to import (current behavior)
6. **Multiple trips found** → show the trip selection screen
7. **Zero valid trips found** → show existing "no trip found" error
8. On the selection screen, user sees all valid trips listed as tappable cards
9. User taps a trip card:
   - **Not yet imported** → card enters a brief loading/disabled state, then import begins
   - **Already imported** → confirmation prompt appears first
10. User can dismiss the selection screen via a back/close action to return to where they were
11. After import completes, the existing success summary is shown

## Screens / Views

### A. Extraction Loading State

A brief transitional view shown while the ZIP is being scanned for trips. This replaces the first phase of the current import progress screen.

**Purpose**: Give feedback that the ZIP is being read, before the selection screen appears.

### B. Trip Selection Screen

The primary new screen. Shows all valid trips found in the ZIP.

**Purpose**: Let the user identify and choose which trip to import.

### C. Re-import Confirmation Prompt

An inline confirmation that appears when the user taps a trip already in their vault.

**Purpose**: Prevent accidental re-imports; let the user proceed intentionally.

## Components

### ExtractionSpinner

A small, centered loading indicator with a text label.

- Shows a spinner animation and the text "Reading your travel data…"
- No progress bar (extraction for scanning is fast — this is just reading JSON metadata, not photos)
- Appears briefly, then transitions to the selection screen or error

### TripSelectionList

The main selection screen layout.

- **Header**: "Select a trip" as the screen title
- **Subtitle**: "Found {n} trips in your export" as context. When some trips are already imported, the subtitle appends: "Found {n} trips in your export ({m} already in your vault)"
- **Sort order**: Trips are listed newest-first (descending by start date)
- **List**: Vertical stack of TripSelectionCard components
- **Dismiss action**: An "X" (close) icon button in the top-right corner, or a "Cancel" text button below the list
- **Sticky header**: The header area (title, subtitle, close button) remains fixed at the top while the card list scrolls beneath it. Adequate spacing between header and first card prevents overlap.
- Scrollable if the list exceeds the viewport

### TripSelectionCard

An interactive card representing one trip. Reuses the visual language of the existing trip cards in TripList but adds tap affordance and status indicators.

- **Trip name**: Displayed with `dir="auto"` and `<bdi>` for RTL safety. Sanitized (no raw HTML).
- **Date range**: Formatted start–end dates using the existing `formatDateRange` utility
- **Chapter count**: Icon + "{n} chapters" (same MapPin + text pattern as TripList)
- **No photo count**: Intentionally omitted per spec (too slow to scan at this stage)
- **Already-imported badge**: If the trip ID matches one in the vault, a subtle "Already imported" label appears on the card
- **Trip name truncation**: Trip name is limited to 2 lines maximum, with text-overflow ellipsis on the second line. This keeps the list scannable regardless of name length.
- **Tap target**: The entire card is tappable/clickable. Cursor changes to pointer. Focus ring on keyboard navigation.

### ReimportConfirmation

An inline confirmation that replaces or overlays the tapped card's area, or appears as a small dialog.

- **Text**: "This trip is already in your vault. Import again to update it?"
- **Actions**: "Cancel" (outline button) and "Import" (primary button)
- Appears contextually — not a full-page takeover

## Interactions

### Transitions

All transitions use the existing Framer Motion pattern (fade + slight vertical slide, respecting `prefers-reduced-motion`).

1. **Import prompt / trip list → Extraction loading**: Fade out current view, fade in spinner
2. **Extraction loading → Trip selection screen**: Fade out spinner, fade in selection list
3. **Trip selection screen → Import progress**: Fade out selection, fade in progress (existing)
4. **Trip selection screen → Dismiss**: Fade out selection, fade in previous screen

### Loading State (Extraction)

- Centered spinner with "Reading your travel data…" text
- No cancel button (extraction is fast for metadata-only scanning)
- If extraction takes more than a few seconds, the text remains static — no percentage needed

### Empty State

- If the ZIP has zero valid trips, the selection screen is never shown
- The existing "no trip found" error view handles this case
- No special empty state needed for this feature

### Error State

- If ZIP extraction itself fails, the existing import error view handles it (e.g., INVALID_ZIP, CORRUPT_ZIP)
- Individual trip directories with bad data are silently skipped — they simply don't appear in the list

### Already-Imported Indicator

- A small, muted label "Already imported" positioned below the chapter count on the card
- Uses a subtle color treatment (muted foreground text, possibly with a small check icon) — not alarming, just informative
- The card is still fully tappable; the label is informational, not blocking

### Re-import Confirmation

- Appears inline below the tapped card, pushing subsequent cards down (not a modal overlay)
- After the card expands, the view auto-scrolls so the confirmation buttons are fully visible in the viewport
- Two buttons: "Cancel" (outline) returns to the normal selection list; "Import" (primary) begins the import
- Only one confirmation can be open at a time — tapping a different card closes any open confirmation

### Tap-to-Import Loading State

- When the user taps a card (or taps "Import" in the re-import confirmation), the tapped card immediately shows a subtle loading indicator (e.g., spinner replacing the chapter count line) and the entire card list becomes non-interactive (pointer-events disabled, reduced opacity on other cards)
- This prevents double-taps and gives instant feedback before the transition to the import progress screen fires

### Keyboard Interaction

- **Tab** moves focus between cards in the list (standard tab order)
- **Enter / Space** on a focused card triggers the same action as a tap
- When the inline re-import confirmation opens, focus moves to the "Cancel" button (first action). Tab moves between "Cancel" and "Import"
- **Escape** while a confirmation is open closes the confirmation and returns focus to the card. Escape with no confirmation open dismisses the entire selection screen

### Dismiss / Back

- Close button (X icon) in the top-right corner of the selection screen
- Keyboard: Escape key dismisses the selection screen
- Returns the user to wherever they were before (import prompt if no trips in vault, trip list if trips exist)

## Wireframe Descriptions

### Extraction Loading State

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│          ⟳ (spinner)            │
│   Reading your travel data…     │
│                                 │
│                                 │
└─────────────────────────────────┘
```

Centered vertically and horizontally. Same container width as other import screens.

### Trip Selection Screen

```
┌─────────────────────────────────┐
│                            [✕]  │
│                                 │
│        Select a trip            │  ← h2, same size as other screen headings
│   Found 4 trips in your export  │  ← muted subtitle
│                                 │
│  ┌─────────────────────────┐    │
│  │ Summer in Japan          │    │  ← trip name (bold)
│  │ Jun 12 – Jul 3, 2024    │    │  ← date range (muted)
│  │ 📍 8 chapters            │    │  ← chapter count with icon
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Weekend in Paris         │    │
│  │ Mar 8 – Mar 10, 2024    │    │
│  │ 📍 3 chapters            │    │
│  │ ✓ Already imported       │    │  ← muted badge, only if in vault
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Road Trip California     │    │
│  │ Aug 1 – Aug 18, 2023    │    │
│  │ 📍 12 chapters           │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Christmas in London      │    │
│  │ Dec 20 – Dec 28, 2023   │    │
│  │ 📍 5 chapters            │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

- Cards are full-width within the container, stacked vertically with consistent gap
- Close button is top-right, outside the heading area
- Cards have the same border/rounded/shadow treatment as existing TripList cards
- Entire card is a tap target with hover/focus states

### Re-import Confirmation (inline)

```
│  ┌─────────────────────────┐    │
│  │ Weekend in Paris         │    │  ← tapped card (slightly highlighted)
│  │ Mar 8 – Mar 10, 2024    │    │
│  │ 📍 3 chapters            │    │
│  │ ✓ Already imported       │    │
│  │                          │    │
│  │ This trip is already in  │    │  ← confirmation text
│  │ your vault. Import again │    │
│  │ to update it?            │    │
│  │                          │    │
│  │  [Cancel]  [Import]      │    │  ← outline + primary buttons
│  └─────────────────────────┘    │
```

The confirmation content appears inside the expanded card. The card visually expands to accommodate the extra content, smoothly animated.

### Mobile Considerations

- Cards stretch full width of the container (already the case with existing card pattern)
- Close (X) button has a minimum tap target of 44×44px
- Card tap targets are large by nature (full card width, comfortable height)
- Confirmation buttons are adequately sized (same h-11 as existing buttons)
- List scrolls naturally within the page — no custom scroll containers needed

## Accessibility Notes

- **Focus management**: When the selection screen appears, focus moves to the "Select a trip" heading (using the existing `headingRef` + `tabIndex={-1}` pattern from ImportFlow)
- **Screen reader announcements**: The `aria-live="polite"` region on the parent container announces view transitions
- **Card semantics**: Each card is a `<button>` (not a div with onClick) for proper keyboard and screen reader support. Screen reader label: "{trip name}, {date range}, {n} chapters" (plus "already imported" if applicable)
- **Close button**: `aria-label="Close trip selection"`, keyboard accessible
- **Escape key**: Dismisses the selection screen (same pattern as the large-file confirmation)
- **Re-import confirmation**: When expanded, focus moves to the confirmation text or the first action button. Confirmation is associated with the card via `aria-expanded`
- **RTL support**: Trip names use `dir="auto"` and `<bdi>` as specified. Layout direction does not change (LTR layout is fine for the chrome)
- **Reduced motion**: All transitions respect `prefers-reduced-motion` via the existing motion variant pattern (instant transitions when reduced motion is preferred)
- **Color contrast**: "Already imported" badge text meets WCAG AA contrast against the card background
