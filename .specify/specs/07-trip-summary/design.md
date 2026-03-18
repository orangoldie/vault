# 07 — Trip Summary Section: Design Plan

## Vision

Replace the utilitarian trip header with a journal-style opening spread that sets the emotional tone before the reader drops into chapters. The summary should feel like the first page of a travel journal — grounding the reader in where, when, how far, and (if the traveler wrote one) why.

This is the narrative bridge between the cinematic hero cover and the chapter-by-chapter journey below.

---

## User Flow

1. User navigates to `/trip/[slug]`. The page loads with the paper-unfold entrance (P3).
2. If a cover photo exists, the `HeroCover` renders full-bleed with the trip name overlaid.
3. Directly below the hero (or at the top if no cover), the **Trip Summary** section appears:
   - Date range in editorial format (with relative time hint for older trips)
   - Country route with flags
   - Stats as achievement blocks (duration, distance, photos) with count-up animation
   - Personal summary text (if present)
4. The user absorbs the trip's shape at a glance, then scrolls into the chapter showcase.

---

## Component: `TripSummary`

Replaces the current `TripHeader` component. Rendered by `TripDetailPage` in the same position — below `HeroCover`, above `ChapterShowcase`, inside the `max-w-[720px]` content column.

### Props

```typescript
interface TripSummaryProps {
  trip: Trip
  chapters: Chapter[]
  hasCover: boolean
}
```

The component derives all display data from these props. No new data fetching required.

### Layout (top to bottom)

#### 1. Trip Name

Only rendered when `hasCover` is `false` (when a cover exists, the hero already displays the name as an `h1` overlay).

- `h1`, display/serif font (`font-serif`), `text-[1.875rem]`, `font-semibold`, `tracking-[-0.02em]`
- Bidirectional text support: `dir="auto"` with `<bdi>` wrapper
- Matches the current `TripHeader` h1 styling for consistency with the hero overlay

#### 2. Date Range

Editorial format that prioritizes readability over precision. The exact dates live in each chapter — the summary level gives a broad sense of when.

- Format by case:
  - Same month: `"January 2024"`
  - Same year, different months: `"January – March 2024"`
  - Cross-year: `"December 2023 – February 2024"`
- Uses full month names (not abbreviated) for the editorial feel
- A new `formatDateRangeEditorial(startDate: number, endDate: number): string` utility in `src/lib/format-date.ts`
- `text-sm`, `text-muted-foreground`

**"Time ago" hint:** Below the date range, display a relative time label for trips older than 6 months. e.g., *"2 years ago"*. This adds emotional distance-in-time alongside the geographic distance.

- Uses `Intl.RelativeTimeFormat("en", { numeric: "auto" })` to produce natural labels
- Granularity: years if ≥ 1 year ago, months if ≥ 6 months ago, hidden otherwise
- `text-xs`, `text-muted-foreground/70`, `italic`
- Calculated from `trip.endDate` relative to the current date
- Same line or line below the date range, separated by `" · "` if inline

#### 3. Country Route

The most evocative data point — countries visited in order, derived from `chapters[].location.countryCode`, deduplicated by first appearance.

**Derivation logic:**

```typescript
function getCountryRoute(chapters: Chapter[]): string[] {
  const seen = new Set<string>()
  const route: string[] = []
  for (const chapter of chapters) {
    const code = chapter.location.countryCode
    if (code && !seen.has(code)) {
      seen.add(code)
      route.push(code)
    }
  }
  return route
}
```

**Display adapts to trip length:**

| Countries | Display |
|---|---|
| **1** | Single flag + country name, no arrows. e.g., `🇯🇵 Japan` |
| **2–5** | Full route with flags and names. e.g., `🇮🇱 Israel → 🇹🇭 Thailand → 🇱🇦 Laos → 🇻🇳 Vietnam` |
| **6–10** | Flags only, no country names. e.g., `🇮🇱 → 🇹🇭 → 🇱🇦 → 🇻🇳 → 🇹🇼 → 🇨🇳 → 🇰🇭 → 🇲🇲` — country names available as `title` attribute on each flag for hover/screen reader |
| **11+** | Condensed: first 3 flags, a "…" separator, last 2 flags, then a label. e.g., `🇮🇱 → 🇹🇭 → 🇱🇦 … 🇹🇼 → 🇨🇳 · 14 countries` |

**Flag rendering:** Use the existing `countryFlagClass(code)` utility from `src/lib/country-flag.ts`, which returns flag-icons CSS classes (`fi fi-xx fis`). This is the same approach used in chapter sections and ensures consistent flag rendering across all OS/browsers (emoji flags render differently on Windows vs macOS vs Android). Each flag is rendered as a `<span>` with the appropriate CSS class.

**Country names for display and aria-labels:** Use `Intl.DisplayNames("en", { type: "region" })` to resolve ISO country codes to human-readable names. This avoids hardcoded mappings and handles all standard codes.

**Styling:**
- Flags at 1em size via flag-icons `fis` (square) class, arrows (`→`) in `text-vault-gold-dim`
- The "N countries" label in the 11+ case: `text-sm`, `text-muted-foreground`, separated by a middle dot (`·`)
- Horizontal layout, wraps naturally on mobile
- `aria-label` on the container describes the full route for screen readers regardless of visual truncation: e.g., `"Route: Israel, Thailand, Laos, Vietnam, Taiwan, China"` (names resolved via `Intl.DisplayNames`)

#### 4. Stats Row

Three stat blocks displayed side by side. Each stat is a small visual unit — Lucide icon, large number, and small label beneath. This replaces the current `TripStats` icon-and-text row.

**Icons:** Each stat block has a Lucide icon above the number, colored `text-vault-gold` with `strokeWidth={1.8}` and `size-5`:
- Duration: `Calendar`
- Distance: `Route`
- Photos: `Camera`

**Stats shown:**

| Stat | Value | Label | Condition |
|---|---|---|---|
| Duration | Calendar days (see calculation below) | "day" / "days" | Always shown |
| Distance | Formatted with `Intl.NumberFormat` (comma-separated, no decimals) | "km" | Hidden if `totalKm === 0` |
| Photos | Raw count | "photo" / "photos" | Hidden if `photoCount === 0` |

**Duration calculation — calendar days touched:**

```typescript
function getTripDurationDays(startDate: number, endDate: number): number {
  const start = new Date(startDate * 1000)
  const end = new Date(endDate * 1000)
  // Zero out time components to count calendar days (UTC to avoid timezone drift)
  start.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}
```

This gives "calendar days touched" — a trip from Jan 1 to Jan 3 = "3 days", which matches how travelers think about duration. The `+ 1` ensures a same-day trip shows "1 day".

**Singular/plural labels:** All stat labels use singular form when the value is exactly 1: "1 day", "1 km", "1 photo". Plural otherwise: "47 days", "2,841 km", "312 photos".

**Count-up animation:** When the stats row enters the viewport, each number animates from 0 to its final value over 1400ms using `requestAnimationFrame`. The animation uses an ease-out curve for a satisfying deceleration. Numbers are rounded to integers during the animation to avoid flickering decimals. All three stats animate simultaneously (they share the same entrance delay). Skipped entirely when `prefers-reduced-motion` is active — numbers render at their final value immediately.

**Layout:**
- Centered horizontal row with even spacing (`flex items-center justify-center gap-8`)
- Each block: number in `text-4xl font-bold tabular-nums tracking-tight sm:text-5xl text-primary`, label in `text-xs uppercase tracking-widest text-muted-foreground` below
- On mobile (`< sm`): same horizontal row, tighter gap (`gap-6`). Three compact blocks still fit comfortably at these sizes
- `role="list"` on the container, `role="listitem"` on each stat, with `aria-label` combining value and label (e.g., `"47 days"`) for screen readers

#### 5. Summary Text

The user's personal opening note. Optional — collapses entirely when `trip.summary` is empty or whitespace-only.

**When present:**
- Rendered in the serif/display font (`font-serif`) at `text-base`, `leading-relaxed`, `italic`
- A warm-gold left border: `border-l-2 border-accent pl-4` — visually separates it from the structured data above and signals "this is personal"
- `whitespace-pre-line break-words` to preserve the user's line breaks while preventing long unbroken strings (e.g., pasted URLs) from blowing out the layout
- Bidirectional text support: `dir="auto"` with `<bdi>` wrapper
- Top margin: `mt-4` from the stats row

**When absent:**
- Nothing renders. No placeholder, no "add a summary" prompt. Clean collapse.

#### 6. Chapter Anchor

A small navigational hint at the bottom of the summary section that communicates content depth and invites scrolling.

- Displays: `"12 chapters ↓"` (using `chapters.length`)
- Singular form for single-chapter trips: `"1 chapter ↓"`
- `text-sm`, `text-muted-foreground`, centered (`text-center`)
- Rendered as a `<button>` — clicking it smooth-scrolls to the `#chapter-showcase` element (the `ChapterShowcase` container's ID)
- Top margin: `mt-6` from the last content element (summary text or stats row)
- The `↓` arrow is a text character, not an icon — keeps it lightweight and journal-like
- Fades out once the user has scrolled past the summary section (driven by `IntersectionObserver` on the summary `<section>` — when it leaves the viewport, the anchor is no longer visible anyway, so this is just ensuring it doesn't linger during the entrance animation)
- Reduced motion: smooth-scroll replaced with instant scroll (`behavior: "auto"`)

---

## Visual Design

### Typography

- Trip name (when no cover): serif/display font, matching the hero overlay styling
- Date range: body font, small, muted
- Time-ago hint: body font, extra-small, muted, italic
- Country route: body font, flags via flag-icons CSS
- Stat numbers: body font, `text-4xl` / `sm:text-5xl`, bold, tabular-nums, tight tracking — the visual anchor of each block
- Stat labels: body font, `text-xs`, uppercase with wide tracking — quiet, label-like
- Summary text: serif/display font, italic — distinct from everything else, signals personal voice
- Chapter anchor: body font, small, muted — unobtrusive, functional

### Color

Uses the existing vault palette exclusively. No new color tokens.

- Stat icons: `text-vault-gold`
- Stat numbers: `text-primary`
- Stat labels: `text-muted-foreground`
- Date range: `text-muted-foreground`
- Time-ago hint: `text-muted-foreground/70`
- Route arrows: `text-vault-gold-dim`; route labels: `text-muted-foreground`
- Summary left border: `border-accent` (vault-gold in light mode, cool blue in dark mode)
- Summary text: `text-primary`

### Spacing

The section content is centered (`text-center`, `items-center`, `justify-center` throughout). The component lives inside the existing content column (`max-w-[720px]`, `px-4 md:px-8`). Internal spacing:

- Between trip name and date range: `gap-1` (tight, they're a unit)
- Between date range and country route: `gap-3`
- Between country route and stats row: `gap-4`
- Between stats row and summary text: `gap-4`
- Between last content element and chapter anchor: `mt-6`
- Overall section padding: `py-8` (matching current `TripHeader` placement)

### Visual Continuity with Hero Cover

When a cover photo is present, the hero is `sticky top-0 z-0 h-screen` and the summary section floats above it via `relative z-10`, creating a card-over-hero depth effect where the summary card appears to slide up over the cover as the user scrolls. The summary is wrapped in a card with `mx-4 mb-10` outer spacing and `rounded-2xl border border-border/50 bg-background px-6 pb-16 pt-10 shadow-sm sm:mx-8 sm:mb-14 sm:rounded-3xl sm:px-10 sm:pt-12`. This creates a clean, elevated surface that separates the structured trip data from the cinematic hero beneath.

When no cover photo is present, the summary section is the first visual element on the page. The trip name (`h1`) anchors the top.

---

## Motion

### Entrance Animation

The summary section's elements enter with a staggered fade-and-rise, creating a sense of the page "filling in":

1. Date range fades in first (0.1s delay)
2. Country route (0.25s delay) — arrows animate in sequentially (see below)
3. Stats row (0.4s delay) — numbers count up from 0 (see Stats Row section)
4. Summary text (0.55s delay)
5. Chapter anchor (0.7s delay)

Each element: `translateY(28px) → 0`, `opacity: 0 → 1`, duration 700ms, easing `[0.22, 1, 0.36, 1]`.

The trip name (when no cover) enters with the page's paper-unfold — it doesn't need its own animation since it's part of the initial reveal.

### Country Route Arrow Animation

After the country route fades in, the arrow separators (`→`) animate in sequentially, giving the route a "drawing itself" feel — like tracing a finger across a map:

- Flags render immediately with the route's entrance fade
- Each `→` arrow fades in (`opacity: 0 → 1`) with a 50ms stagger between each arrow
- First arrow starts 100ms after the route container's entrance completes
- Duration per arrow: 200ms, ease-out
- Total animation time for a 5-country route: ~300ms (4 arrows × 50ms stagger + 200ms last fade)
- Skipped entirely when `prefers-reduced-motion` is active

### Flag Animation

Flags animate in with a spring-like scale effect, staggered at 60ms intervals:
- Each flag scales from `0.6 → 1` with easing `[0.34, 1.56, 0.64, 1]` (spring overshoot)
- Combined with the arrow stagger, this gives the route a lively "popping in" feel
- Skipped entirely when `prefers-reduced-motion` is active

### Stat Count-Up Animation

See the Stats Row section above for details. In summary: numbers animate from 0 to final value over 1400ms with ease-out, all three simultaneously, triggered when the stats row enters the viewport. Skipped for reduced motion.

### Reduced Motion

All entrance animations, arrow staggering, and count-up animations are skipped. Content renders statically and immediately. Check `prefers-reduced-motion` via the same media query pattern used elsewhere in `TripDetailPage`.

---

## States

| State | What the user sees |
|---|---|
| **Full data** | All elements: name (if no cover), date range + time-ago hint, full country route, all three stats with count-up, summary text, chapter anchor |
| **No cover photo** | Trip name renders as h1 at the top of the summary. All other elements the same |
| **No summary text** | Summary text section is absent. Stats row is the last element. Clean bottom edge |
| **Zero km** | Distance stat hidden. Only duration + photos shown |
| **Zero photos** | Photo stat hidden. Only duration + distance shown |
| **Zero km AND zero photos** | Only duration stat shown, centered |
| **No country data** | Country route section hidden entirely (all chapters have empty `countryCode`) |
| **Single country** | Flag + country name, no arrow |
| **Many countries (11+)** | Condensed route: first 3 → … → last 2 · "N countries" |
| **Single day trip** | Duration shows "1 day" (singular) |
| **Recent trip (< 6 months)** | Time-ago hint hidden. Only editorial date range shown |
| **Older trip (≥ 6 months)** | Time-ago hint shown: e.g., "2 years ago" |

---

## Accessibility

### Semantics

- The component is a `<section>` with `aria-label="Trip summary"`
- Trip name is `<h1>` (matches current behavior)
- Stats use `role="list"` / `role="listitem"` with `aria-label` on each item
- Country route container has a descriptive `aria-label` listing all countries (via `Intl.DisplayNames`) regardless of visual truncation
- Stat count-up animation uses `aria-live="off"` — screen readers get the final value immediately, not intermediate animation frames

### Screen Readers

- Stats are announced as value + label pairs: "47 days", "2,841 km", "312 photos"
- Country route is announced as a full comma-separated list: "Route: Israel, Thailand, Laos, Vietnam, Taiwan, China"
- Summary text is a regular paragraph — no special annotation needed

### Keyboard

The chapter anchor button is the only interactive element. It is focusable and activates on Enter/Space (native `<button>` behavior). Focus management for the overall section is handled by the parent `TripDetailPage` (existing behavior: focuses the h1 after load).

---

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Mobile (< 640px)** | Stats row tightens gap (`gap-6`). Country route wraps naturally. Summary text full-width |
| **Tablet (640px–1023px)** | Default layout. Content column provides comfortable margins |
| **Desktop (1024px+)** | Same layout — the `max-w-[720px]` column keeps it readable. No side-by-side rearrangement needed |

The summary section is vertically stacked at all breakpoints. The content column constraint (`max-w-[720px]`) handles readability across screen sizes.

---

## Components

| Component | Status | Notes |
|---|---|---|
| `TripSummary` | **New** | Replaces `TripHeader`. Main summary section with all elements |
| `CountryRoute` | **New** | Renders the adaptive country flag route with arrow animation (extracted for clarity and testability) |
| `StatCountUp` | **New** | Animated number component — counts from 0 to target value (default 1200ms, TripSummary passes 1400ms). Accepts `value: number`, `duration?: number`. Falls back to static render for reduced motion |
| `TripHeader` | Exists | **Remove** — replaced by `TripSummary` |
| `TripStats` | Exists | **Remove** — replaced by inline stat blocks in `TripSummary` |
| `TripDetailPage` | Exists | **Modify** — swap `TripHeader` for `TripSummary`, pass `chapters` prop, add `id="chapter-showcase"` to `ChapterShowcase` container |
| `HeroCover` | Exists | **Modify** — now `sticky top-0 z-0 h-screen` (full viewport height, not aspect-ratio constrained). Trip name centered in viewport (`flex items-center justify-center`, `text-center font-serif text-4xl font-bold sm:text-5xl md:text-6xl`), not bottom-left. Includes a scroll-hint chevron (double `ChevronDown` from Lucide) that bounces and fades out once the user scrolls past 50px |

### New Utilities

| Utility | Location | Purpose |
|---|---|---|
| `formatDateRangeEditorial` | `src/lib/format-date.ts` | Full month name editorial date range formatting |
| `formatTimeAgo` | `src/lib/format-date.ts` | Returns relative time string (e.g., "2 years ago") or `null` if < 6 months. Uses `Intl.RelativeTimeFormat` |
| `getTripDurationDays` | `src/lib/format-date.ts` | Calendar-days-touched duration calculation |
| `getCountryRoute` | `src/features/trip-detail/lib/country-route.ts` | Deduplicates country codes from chapters in visit order |

Note: The existing `countryFlagClass` in `src/lib/country-flag.ts` is reused as-is. No new flag utility needed.

---

## Decisions

- **No globe in the summary.** The mini globe appears on scroll for chapter-level wayfinding — it serves a different purpose. The country route gives "journey shape" at the summary level.
- **No chapter count in stats.** Chapter count doesn't belong as an achievement metric. Instead it earns its place as the chapter anchor (`"12 chapters ↓"`) — functional, not decorative.
- **No "add a summary" CTA.** Editing features are out of scope for v1. Empty summary simply collapses.
- **Stats hide when zero, not show "0".** A trip with 0 km tracked shouldn't display "0 km" — it looks like a bug. Graceful omission.
- **Editorial date format.** Full month names, no day numbers. The precise dates are on each chapter. The summary gives temporal scope, not precision.
- **Country route truncation at 11+.** Long overland trips can hit 20+ countries. Enumerating all of them defeats the "at a glance" purpose. Show the arc (start → end) and the scale (N countries).
- **CSS flag-icons over emoji flags.** Emoji flags render inconsistently across platforms (Windows shows two-letter codes instead of flags). The existing `countryFlagClass` utility and flag-icons CSS library are already loaded for chapter sections — reuse them for visual consistency.
- **Calendar days over raw seconds.** `Math.ceil(seconds / 86400)` undercounts trips that span calendar day boundaries. Calendar-days-touched (`+ 1`) matches how travelers think: "I was there Jan 1 to Jan 3" = 3 days, not 2.
- **Singular/plural on all stat labels.** Consistent grammar across all stats — "1 day", "1 photo", "1 km" — not just duration and chapters.
- **Time-ago hint only for older trips.** Showing "2 days ago" on a recent trip is noise. The 6-month threshold ensures the hint adds emotional weight (nostalgia) rather than redundant information.
