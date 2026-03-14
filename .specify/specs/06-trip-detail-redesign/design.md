# 06 — Trip Detail Redesign: Design Plan

## Vision

Transform the trip detail page from a text-only timeline into a cinematic, immersive travel journal. The user should feel like they're re-living the trip — not reading a log. Photos are the heroes, the globe grounds you geographically, and scroll-driven motion creates a sense of progression through time and space.

This is the flagship experience of Journey Vault: the payoff for importing your data.

---

## Phasing

The redesign is too large for a single spec. It splits into three phases, each shippable on its own:

| Phase | Scope | New Dependencies |
|---|---|---|
| **P1 — Chapter Showcase** ✅ | Full-bleed chapter sections, photo grids, postcard layout, photo lightbox, sticky chapter nav | None |
| **P2 — Globe** ✅ | 280px interactive globe with compass rose frame, scroll-synced rotation, expanded map overlay, route arcs, chapter pins | `maplibre-gl`, `@vis.gl/react-maplibre`, `pmtiles`, `@protomaps/basemaps` |
| **P3 — Motion & Atmosphere** | Paper-unfold entrance, parallax depth layers, crossfade transitions, weather-driven ambient color, hand-drawn route line, scroll-to-top button | None |

Each phase has its own section below. A phase builds on the previous one but does not break the page if shipped alone.

---

## P1 — Chapter Showcase

### User Flow

1. User clicks a trip card on the trip list. The page navigates to `/trip/[slug]`.
2. A skeleton loads briefly while trip + chapter + photo data is fetched from IndexedDB.
3. The page renders:
   - **Cover hero** (existing, full-bleed with trip name overlay — no changes needed)
   - **Trip header** (existing — name, dates, summary, stats)
   - **Sticky chapter nav** (new — appears after scrolling past the header)
   - **Chapter sections** (new — replaces the current chapter timeline)
4. The user scrolls through chapters. Each chapter is a full scene: hero photo, metadata, description, photo spread.
5. Clicking any photo opens a full-screen lightbox with swipe navigation.
6. The sticky nav highlights the current chapter and allows jumping to any chapter.

### Sticky Chapter Nav

**Desktop (screen >= 1280px):** a fixed sidebar on the left side of the viewport, vertically centered. It appears once the user scrolls past the trip header.

```
      ● Tokyo            ┃
      │                   ┃   [ chapter content area ]
      ● Kyoto            ┃
      │                   ┃
      ◉ Bangkok    ←      ┃
      │                   ┃
      ○ Hanoi            ┃
      │                   ┃
      ○ Siem Reap        ┃
```

- Each node shows the **country flag emoji** (derived from `countryCode` via a small util) and the **chapter display name**, truncated with ellipsis if longer than ~20 characters.
- Filled dot (●) = scrolled past. Active ring (◉) = currently in view (with `vault-gold` color). Hollow dot (○) = not yet reached.
- The connecting vertical line has a **gold gradient fill** that grows as the user scrolls, representing trip progress.
- Clicking a node smooth-scrolls to that chapter section.
- The nav fades in/out with a short opacity transition tied to scroll position (visible once past header, hidden if scrolled back to top).
- **Overflow handling:** the sidebar content is scrollable (`max-h-[80vh] overflow-y-auto`, hidden scrollbar) with the active dot always scrolled into view. This handles trips with 20+ chapters gracefully.

**Tablet (screen 768px–1279px):** the sidebar is hidden. A compact **floating pill** appears fixed at the bottom-center of the viewport:

```
  ┌─────────────────────────────────┐
  │  ◉ Bangkok  ·  3 of 12         │
  └─────────────────────────────────┘
```

- Shows current chapter name and position (e.g., "3 of 12").
- Tapping it opens a scrollable dropdown/popover listing all chapters with flags, allowing quick jump.

**Mobile (screen < 768px):** same floating pill as tablet, positioned at the bottom-center. Tapping opens a scrollable chapter list popover. This avoids a noisy fixed strip at the top that competes with the back button and content.

**Scroll detection:** use `IntersectionObserver` on each chapter section's sentinel element (a zero-height div at the top of each section). The chapter whose sentinel is closest to the top of the viewport is "active."

### Chapter Sections

Each chapter renders as a distinct full-width section with clear visual separation. The layout within a section, from top to bottom:

1. **Chapter metadata bar** — always the first element in a chapter section. Contains:
   - Chapter display name (h2, large, serif/display font)
   - Location detail (smaller, muted)
   - Date or date range (smaller, muted)
   - Weather condition + temperature if available (smaller, muted, inline with date)
   - Country flag emoji before the location name
   All within the content column (`max-w-[720px]`, centered, with `px-4 md:px-8`).

2. **Chapter description** — the user's text, rendered as a paragraph with `whitespace-pre-line`. Full width within the content column. Bidirectional text support via `dir="auto"` and `<bdi>`.

3. **Photo spread** — all photos for this chapter. Layout depends on photo count — see "Scattered Postcard Layout" below. There is no separate "hero" photo — since photo ordering is not deterministic (no timestamps or meaningful filenames), all photos are treated equally in the postcard spread.

4. **Chapter divider** — moderate whitespace (`py-8 md:py-14`) between chapters. No hard line — just breathing room. Not too much — chapters should feel connected as parts of one journey.

### Scattered Postcard Layout

The signature visual element. Photos are presented as if scattered on a surface — slightly rotated, overlapping edges, with drop shadows. This replaces a conventional grid.

**How it works:**

- Each photo is rendered as a "postcard": the image with a white border (8px on sides, 8px on top, 20px on bottom — like a Polaroid) and a subtle `box-shadow`.
- Each postcard has a small random rotation applied (`rotate` between -4deg and +4deg), determined by a seeded random value based on the photo ID so it's stable across renders.
- Postcards have minimal overlap — just enough to feel organic (small negative margins) without obscuring content. Generous spacing so photos breathe.
- Layout uses a CSS grid (`grid-cols-2 md:grid-cols-3`) so photos fill available space evenly — always 3 per row on desktop, 2 on mobile.

**Adaptive behavior based on photo count:**

| Count | Layout |
|---|---|
| 0 | No photo section rendered |
| 1 | Single centered postcard, no rotation |
| 2–4 | "Tossed on table" — postcards fanned out with slight overlap, centered in the content column |
| 5–12 | Two loose rows, staggered, with varied rotation. Some postcards overlap neighbors |
| 13+ | Three or more rows flowing naturally within the page. No inner scroll container — the page itself scrolls. The chapter nav allows skipping past long photo sections |

**Interaction:**

- **Hover** (desktop): the hovered postcard lifts (slight `translateY(-8px)` + stronger shadow), straightens (rotation goes to 0), and scales up slightly (`scale(1.05)`). Transition: 200ms ease-out. The postcard also gets a higher `z-index` so it appears above neighbors.
- **Tap** (mobile): tapping a postcard opens the lightbox (no hover state).
- **Reduced motion:** no rotation, no hover transform. Photos render as a clean grid with the Polaroid-style border.

### Photo Lightbox

A full-screen overlay for viewing photos one at a time.

**Opening:** when a user clicks/taps a postcard photo, the lightbox opens with a quick opacity fade-in. The background fades to a near-black overlay (`bg-black/90`). (We tried Framer Motion `layoutId` shared layout animation here but it caused jank — the exit animation would snap the photo back to its grid position when navigating between photos. Simple opacity crossfade is cleaner and more reliable.)

**Inside the lightbox:**

- The photo is displayed as large as possible while fitting the viewport (contain, not cover), centered.
- **Navigation:** left/right arrow buttons on desktop (positioned at screen edges, semi-transparent, visible on hover). Swipe left/right on mobile/touch. Keyboard: left/right arrows, Escape to close.
- **Photo context:** a subtle bar at the bottom shows the chapter name and photo position (e.g., "Bangkok — 3 of 17"). Fades in/out on mouse movement (desktop) or is always visible (mobile).
- **Close:** click the X button (top-right), press Escape, click outside the photo, or swipe down.

**Closing animation:** the lightbox fades out with a quick opacity transition (matching the opening).

**Photo loading:** since photos come from OPFS, they may take a moment. Show a centered spinner on the dark background while loading. Preload the next and previous photos in the background.

**Accessibility:**
- Focus is trapped inside the lightbox while open.
- The lightbox has `role="dialog"` and `aria-label="Photo viewer"`.
- Arrow buttons have `aria-label="Previous photo"` / `"Next photo"`.
- Escape closes the lightbox. Focus returns to the photo that was clicked.

### Photo Loading Strategy

Photos are stored in OPFS and must be read as blobs, then converted to object URLs.

- **Lazy loading:** only load photos for chapters that are near the viewport. Use `IntersectionObserver` with a `rootMargin` of `"200% 0px"` (two viewports ahead) to start loading chapter photos before the user scrolls to them.
- **Per-chapter batching:** when a chapter enters the load zone, fetch all its photo metadata from IndexedDB (`getPhotosByChapter`), then load blobs from OPFS in parallel (with a concurrency limit of 4 to avoid overwhelming OPFS).
- **Placeholders:** before a photo loads, render a placeholder div with `bg-muted` at the postcard's dimensions. The placeholder has the same rotation/position as the final postcard to avoid layout shift.
- **Object URL cleanup:** revoke object URLs when a chapter scrolls far out of view (more than 3 viewports away). Re-create them if the user scrolls back. Track active URLs in a `Map<string, string>` in a context or hook. The observer-based margin is the sole eviction mechanism — a separate memory budget was removed because it conflicted with the observer (two systems writing to the same eviction state) and could evict chapters the user was currently viewing. The 300% observer margin implicitly caps active URLs by limiting how many chapters can be loaded simultaneously. **Exception:** never evict URLs for the chapter currently displayed in the lightbox — pin that chapter until the lightbox closes.

### States

| State | What the user sees |
|---|---|
| **Loading** | Existing skeleton (trip header shimmer + placeholder chapter blocks) |
| **Success** | Full chapter showcase with sticky nav, photos, etc. |
| **Error** | Existing error state with retry button |
| **Not found** | Existing 404 state |
| **Chapter with no photos** | Chapter renders with metadata + description only, no photo section, no hero. Looks clean — like a text journal entry |
| **Chapter with no description** | Metadata + photo spread. No empty paragraph |
| **Chapter with nothing** | Metadata bar only (name, location, date). Still a valid entry in the timeline |

### Components

| Component | Status | Notes |
|---|---|---|
| `HeroCover` | Exists | No changes — the trip-level cover remains as-is |
| `TripHeader` | Exists | No changes |
| `TripStats` | Exists | No changes |
| `BackButton` | Exists | No changes |
| `TripDetailPage` | Exists | **Modify** — replace `ChapterTimeline` with new `ChapterShowcase`, add `ChapterNav` |
| `ChapterShowcase` | **New** | Renders all chapter sections with scroll observation |
| `ChapterSection` | **New** | Single chapter: metadata + description + photo spread (no hero) |
| `ChapterNav` | **New** | Sticky sidebar (desktop) / floating pill (tablet + mobile) |
| `ChapterNavSidebar` | **New** | Desktop sidebar variant (scrollable for many chapters) |
| `ChapterNavPill` | **New** | Tablet + mobile floating pill variant |
| `PostcardGrid` | **New** | Scattered postcard photo layout |
| `PostcardPhoto` | **New** | Single photo with polaroid border, rotation, hover lift |
| `PhotoLightbox` | **New** | Full-screen photo viewer with navigation |
| `ChapterCard` | Exists | **Remove** — replaced by `ChapterSection` |
| `ChapterTimeline` | Exists | **Remove** — replaced by `ChapterShowcase` |

### New Data Requirements

The `useTripDetail` hook currently loads the trip and chapters but no photos. For P1:

- Add a `getPhotosByChapter(chapterId: number): Promise<Photo[]>` function to `db.ts` (the index already exists).
- Add a new hook `useChapterPhotos(chapterId: number)` that lazily loads photos for a chapter when triggered. Returns `{ photos: Photo[], photoUrls: Map<string, string>, status }`.
- The `ChapterShowcase` component manages which chapters should load photos based on viewport proximity.

---

## P2 — Globe

### 3D Globe with Compass Rose

An interactive globe rendered with MapLibre GL (`globe` projection) and Protomaps vector tiles, fixed to the right side of the viewport on desktop, or hidden behind a floating button on mobile. Map tiles are self-hosted as a bundled PMTiles file (`public/textures/globe.pmtiles`), with fonts and sprites in `public/map-assets/`. No external CDN dependencies at runtime.

**Visual design:**

- Globe uses a custom "vault" color flavor (defined in `globe-style.ts`): warm beige landmasses, muted slate-blue oceans, parchment-toned roads and labels. Based on the Protomaps `light` flavor with all color tokens overridden to match the vault palette.
- The globe sits inside a **compass rose frame**: a decorative SVG border with cardinal direction markers (N, S, E, W) rendered in `vault-gold-dim`, positioned outside the outer ring for clarity. The compass rose includes concentric rings, cardinal/intercardinal tick marks, and minor 15-degree ticks. It gives the globe a "navigator's instrument" feel rather than a floating sphere.

**Size and position:**

- Desktop (`lg`+): 280px map canvas inside a 340px compass rose frame (30px padding around the canvas). Fixed to the right side (`right-4`), vertically centered on the viewport (`top-1/2 -translate-y-1/2`). Z-index 30. Appears after scrolling past 400px (past the trip header). The globe is a prominent navigational element, not a tucked-away widget.
- Mobile (below `lg`): hidden by default. A 44px circular FAB (globe icon) fixed at `bottom-20 right-4`. Styled with `bg-vault-surface`, `ring-1 ring-vault-gold/20`, hover transitions to `bg-vault-gold`. Tapping opens the expanded overlay.

**Scroll-synced rotation:**

- As the user scrolls through chapters, the globe smoothly rotates to center on the active chapter's `lat`/`lon`.
- A glowing dot in `vault-gold` pulses at the active chapter's coordinates on the globe surface (`pulse-glow` CSS keyframe animation, 2s cycle).
- The rotation uses MapLibre's `flyTo` for smooth movement between chapter positions.
- Rotation is driven by the same `IntersectionObserver` that powers the sticky nav — when the active chapter changes, the globe animates to the new position over ~800ms.

**Interaction:**

- **Clicking the globe** (or a small "expand" button on the compass rose frame) triggers the expanded map overlay.

### Expanded Map Overlay

Clicking the globe opens a full-viewport overlay showing the globe at large scale with all chapter locations visible.

**Layout:**

- The globe is centered on the viewport at ~70% width, with the chapter sidebar positioned absolutely to its left. Dark backdrop (`bg-black/95`).
- All chapter locations are rendered as **pin markers** on the globe surface (no floating labels — the popover reveals the name on click). Pins use `vault-gold` for the active/selected state and `vault-gold-dim` for others. Connected by a dotted arc line (GeoJSON LineString with `line-dasharray`, globe projection handles great-circle curvature automatically).
- The currently active chapter's pin is highlighted (larger, brighter glow) by default when the overlay opens.

**Interaction in expanded mode:**

The overlay is an **exploration-first** tool. Clicking a pin selects it for preview — navigation requires a second deliberate action.

- Drag to rotate the globe and explore all chapter locations.
- **Selecting a pin:** clicking a pin (teardrop SVG marker) on the globe selects it — the pin enlarges and a small **popover** appears above it showing the chapter name and a "Go" button. The corresponding entry in the chapter sidebar also highlights. Clicking a different pin deselects the previous one and selects the new one. Clicking the same pin again deselects it. Selected markers render at a higher z-index so the popover is never obscured by neighboring pins.
- **Selecting from the sidebar:** clicking a chapter in the sidebar list selects that pin — the globe flies to center on it and shows the popover. This mirrors the pin interaction in reverse.
- **Navigating:** clicking "Go to chapter" in the popover (or a similar action button in the sidebar) closes the overlay and smooth-scrolls to that chapter on the page.
- **Backdrop click** always closes the overlay (no intermediate deselect step).
- Close button (top-right) or Escape to close.

**Mobile:** the expanded globe fills the full screen.

### Performance Considerations

- The globe canvas renders at device pixel ratio capped at 2 to save GPU.
- When the mini globe is not visible (scrolled back to top), the render loop pauses via `map.stop()` and resumes with `map.triggerRepaint()` when visible again. The overlay globe doesn't need this — it unmounts when closed.
- Map tiles are bundled as a PMTiles vector tile file (`public/textures/globe.pmtiles`). Fonts (3 Noto Sans stacks, 768 .pbf files) and sprites are self-hosted in `public/map-assets/`, tracked via Git LFS. No runtime CDN dependencies.
- The globe uses `"use client"` with `typeof window` guards to avoid SSR issues with WebGL/MapLibre. No `next/dynamic` needed — the globe will be visible on initial page load in future iterations.

---

## P3 — Motion & Atmosphere

### Paper-Unfold Entrance

When the trip detail page first loads (after data is ready), instead of a simple fade-in, the content "unfolds" like a paper map being opened.

**The animation:**

1. The entire content area starts as a narrow vertical strip (scaleX: 0.05, full height) centered on screen, with a parchment-like background color.
2. It unfolds horizontally (scaleX animates to 1) over 600ms with an ease-out curve.
3. As it unfolds, the content fades in from 0 to 1 opacity (starting at 300ms, so the unfold is half-done before content appears).
4. A subtle paper-crease shadow runs down the center during the fold, fading as it opens.

**Constraints:**
- Only plays on initial page load, not on back-navigation or re-renders.
- Skipped entirely if `prefers-reduced-motion` is set (content just fades in normally).
- Uses Framer Motion's `animate` with `useReducedMotion`.

### Depth Layers & Crossfade

Each chapter section uses layered scroll effects to create depth and a sense of progression. Since photo ordering is not deterministic (no timestamps or meaningful filenames), there is no designated "hero photo" per chapter — this is consistent with P1's equal-treatment postcard model.

**Background layer — ambient crossfade:**

- Each chapter section has a full-width ambient background (driven by the weather tint from "Weather-Driven Ambient Color" above, or the default vault background if no weather data).
- As the user scrolls from one chapter to the next, the outgoing chapter's ambient tint crossfades into the incoming chapter's tint over ~100px of overlap in the divider space. This creates a dissolve transition between chapters rather than a hard cut.
- The crossfade is driven by `useScroll` + `useTransform`, scoped to the divider region between chapters.

**Content layer** (metadata, description): moves at normal 1x scroll speed. A subtle `translateY` entrance (20px → 0, opacity 0 → 1) triggers as each chapter scrolls into view, giving a gentle "rising into place" effect.

**Foreground details** (postcard photos): moves at 1x scroll speed but with a slightly delayed entrance relative to the content layer (staggered by ~100ms per row), so the postcards appear to settle onto the page after the text.

Implementation: Framer Motion `useScroll` + `useTransform` for the ambient crossfade. `useInView` with `once: true` for the content/postcard entrance animations. Each chapter section is its own scroll-tracking container.

Reduced motion: no crossfade, no entrance animations. Chapters are separated by whitespace, content and photos render statically.

### Weather-Driven Ambient Color

A subtle background color shift per chapter, derived from the chapter's weather and time of day.

**Color mapping:**

| Condition | Ambient tint |
|---|---|
| Clear / sunny (daytime) | Warm golden — `hsl(38 40% 94%)` |
| Cloudy / overcast | Cool grey — `hsl(220 10% 92%)` |
| Rainy / stormy | Slate blue — `hsl(210 15% 88%)` |
| Snow | Cool white — `hsl(200 20% 95%)` |
| No weather data | Default vault background — no tint |

The tint is applied as a full-width background gradient behind the chapter section, transitioning smoothly from one chapter's tint to the next over the divider space. The effect is subtle — a barely perceptible warmth or coolness that makes each chapter *feel* different without being distracting.

### Hand-Drawn Route Line

Between chapter sections (in the divider space), a decorative dotted line meanders down the page, connecting one chapter to the next — like a route drawn on a paper map.

**Visual:**

- The line is an SVG path with a hand-drawn aesthetic: slightly wobbly, not perfectly straight. Generated procedurally with small random offsets on control points.
- Stroke: `vault-gold-dim`, 1.5px, dashed (`stroke-dasharray: 6 4`).
- The line starts at the bottom-center of one chapter section and ends at the top-center of the next.
- It curves gently left or right (alternating per chapter pair) to avoid monotony.

**Scroll animation:** the line draws itself as the user scrolls into view, using `stroke-dashoffset` animated by scroll position. By the time the next chapter's hero is visible, the line is fully drawn.

Reduced motion: the line is fully drawn (no animation), rendered as a static decorative element.

### Scroll-to-Top Button

A floating button that appears once the user has scrolled past the first chapter section (~2 viewports down).

**Visual:** a small circular button (40px) in the bottom-right corner. Icon: upward chevron or arrow. Styled with `bg-vault-surface` and `vault-gold` icon, with a subtle shadow. Fades in/out based on scroll position.

**Behavior:** smooth-scrolls to the top of the page (trip header). The button disappears once the user is back at the top.

**Position:** on desktop, bottom-right corner (`bottom-6 right-4`). The globe is vertically centered on the right edge — the scroll-to-top button sits below it with no overlap. On mobile, bottom-right corner with 16px margin, above the globe FAB (`bottom-32 right-4`) to avoid stacking on the same spot.

Reduced motion: instant scroll (`behavior: "auto"` instead of `"smooth"`).

---

## Visual Direction

### Typography

- Chapter display names: use the display/serif font (`font-serif` / `--font-display`) at `text-2xl` / `text-3xl`. This is the "journal entry title" moment — it should feel handwritten or editorial, distinct from body text.
- All other text (dates, locations, descriptions, stats): body font (`font-sans` / `--font-body`).
- Chapter descriptions: `text-base`, `leading-relaxed`, generous max-width for comfortable reading line length.

### Color

- Use the existing vault palette. No new color tokens except the weather ambient tints (P3), which are subtle background shifts and don't need tokens.
- The postcard border: light mode `hsl(0 0% 98%)` (slightly off-white, warmer than pure white, parchment feel); dark mode `hsl(30 6% 20%)` (matching `--surface-hover` tone so the Polaroid frame blends with the dark surface without jarring contrast).
- Accent dot on the timeline nav: `vault-gold`.
- Lightbox backdrop: `bg-black/90`.

### Spacing

- Between chapter sections: `py-8 md:py-14` — moderate breathing room.
- Content column remains `max-w-[720px]` with `px-4 md:px-8`.
- Postcard grid sits within the content column.

### Motion Principles

- All animations respect `prefers-reduced-motion`. Every animated component checks this and falls back to instant/static rendering.
- Scroll-driven animations use `will-change: transform` and `transform` only (no layout-triggering properties) to stay on the compositor thread.
- The globe render loop pauses when not visible.
- Framer Motion is the animation library for DOM elements. MapLibre GL handles 3D globe rendering.

---

## Accessibility

### Keyboard Navigation

- **Chapter nav:** all chapter nodes/dots are focusable buttons. Enter/Space triggers smooth-scroll to that chapter.
- **Postcard photos:** each photo is a focusable button. Enter/Space opens the lightbox.
- **Lightbox:** focus trapped. Arrow keys navigate photos. Escape closes. Focus returns to the trigger photo on close.
- **Globe:** the expand button is focusable. The 3D canvas itself is not keyboard-navigable (drag is mouse/touch only), but the expanded overlay's chapter labels are focusable buttons.

### Screen Readers

- Chapter sections use `<section aria-label="Chapter: {displayName}">`.
- Photo images use `alt="Photo {n} from {chapterName}"`.
- The chapter nav has `aria-label="Chapter navigation"` and each node has `aria-current="true"` when active.
- The globe expand button: `aria-label="View trip on globe"`.
- Lightbox: `role="dialog"`, `aria-label="Photo viewer"`, `aria-roledescription="carousel"`.

### Reduced Motion

Every section above specifies its reduced-motion fallback. The general rule: remove transforms, parallax, and drawing animations. Keep opacity fades (but make them instant, `duration: 0`). Render all content statically.

---

## Mobile Behavior

- **No hero photos** — all photos treated equally in postcard spread.
- **Postcard layout:** reduces to 2 columns max. Less rotation (max +-2deg) to avoid awkward clipping. Photos flow naturally within the page — no inner scroll containers.
- **Chapter nav:** floating pill at bottom-center (same as tablet). Tapping opens chapter list.
- **Globe:** hidden behind a 44px FAB (`bottom-20 right-4`). Tapping opens full-screen expanded overlay.
- **Lightbox:** swipe-to-navigate, swipe-down-to-close. Full-screen.
- **Crossfade & entrance animations (P3):** ambient tint crossfade is kept (lightweight). Content/postcard entrance animations are simplified — no stagger, just a single fade-in per chapter section.
- **Paper-unfold (P3):** simplified to a quick fade-in (200ms) on mobile.

---

## Decisions

- **Scroll to top:** Yes — floating button appears after scrolling past the first chapter. Included in P3.
- **Postcard layout toggle:** No — the postcard layout is the layout. No grid toggle.
- **Globe tiles:** Bundled as a PMTiles vector tile file (`public/textures/globe.pmtiles`) with self-hosted fonts and sprites in `public/map-assets/`. Works offline, no CDN dependency. Custom "vault" color flavor with warm beige landmasses and muted slate-blue oceans.
