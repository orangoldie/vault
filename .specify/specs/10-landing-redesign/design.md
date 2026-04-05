# 10 — Landing Page Redesign: Design Plan

## Vision

Strip the landing page down to its essence. The current page reads like a SaaS marketing brochure — three value-prop rows, a how-it-works section, trust badges. Journey Vault doesn't need to be sold; it needs to be experienced.

The redesign reduces the page to three beats: **identity** (hero), **product** (showcase reveal), **action** (CTA). Everything else either moves to the import page (how-it-works), moves to the footer (privacy), or gets deleted (value props, album preview mockup).

The page should feel like opening a luxury publisher's portfolio — not reading a feature list.

---

## User Flow

1. User lands on `/`. The header is transparent, showing the rotating mini-vault icon and "Journey Vault" wordmark.
2. The hero fills the viewport: the CartographicDrift canvas with the vault mechanism, the title, subtitle, and a scroll indicator.
3. As the user scrolls past the hero, the header gains a subtle background. The page transitions into the **showcase reveal** — an abstract visual composition suggesting the richness of what the product produces (routes, photos, journal pages), accompanied by two lines of text.
4. Below the showcase, a clean CTA: "Get started" linking to `/import`.
5. A quiet footer closes the page: copyright, privacy signal.

Total page: ~2.5 viewport heights. No filler.

---

## Structure (top to bottom)

### 1. Header (new)

A persistent, sticky header across the top of the page.

#### Layout

- Full width, `fixed top-0 z-40`
- Inner container: `max-w-5xl mx-auto`, horizontal flex, vertically centered
- Left: mini vault icon + "Journey Vault" wordmark
- Right: "Get started" text link

#### Mini Vault Icon

A small version of the vault mechanism rendered on a `<canvas>` via p5.js — **not** the full CartographicDrift scene. Only the inner mechanism (combination dial, compass rose, cross, hub) at ~32px, slowly rotating (~1 RPM). No stars, no constellation lines, no parallax.

This keeps the icon lightweight and avoids running two heavy p5 sketches simultaneously.

- Size: `32px` (`size-8`)
- Rotation: purely ambient, no scroll coupling
- Reduced motion: static SVG fallback (reuse the `VaultDoor` component at small size with `rotation={0}`)

#### Wordmark

- "Journey Vault" in serif font (`font-serif`), `text-base`, `font-semibold`, `tracking-wide`
- Vertically aligned with the icon
- Together, icon + wordmark form a clickable link to `/` (or scroll-to-top on the landing page)

#### "Get started" Link

- `text-sm`, `font-medium`, `tracking-wide`
- Text color: `text-vault-text-dim`, hover: `text-vault-text`
- No button styling — just a refined text link with a subtle hover transition
- Links to `/import`

#### Scroll State

- **At top (scrollY = 0):** fully transparent background, no border
- **On scroll (scrollY > 0):** `bg-vault-bg/80 backdrop-blur-md border-b border-vault-gold/10`
- Transition: 200ms ease on background and border opacity
- Implementation: `useScroll` or a simple scroll listener with a boolean state

#### Spacing

- Height: `h-14` (56px)
- Horizontal padding: `px-6 sm:px-8`
- The hero section needs a corresponding top offset or the header should overlay transparently — no gap between header and hero content

---

### 2. Hero (exists — minor adjustments)

The existing hero section stays largely intact. It's the strongest part of the current page.

#### What stays

- `CartographicDrift` p5.js canvas with star field + vault mechanism
- `VaultDoor` SVG fallback for reduced motion
- Scroll-driven opacity and scale fade-out
- Radial glow behind vault
- Grain overlay (global)

#### What changes

- **Title:** "Journey Vault" stays as `h1`
- **Subtitle:** Change from *"Your memories deserve a permanent home."* to *"Your memories deserve a permanent home."* — keep the original. It's aspirational and pairs well with the showcase's concrete "from your travel app to a personal archive" line below. The hero is emotional; the showcase is practical
- **Scroll indicator:** stays as-is
- **No CTA button in hero.** The header provides persistent access to `/import`. The hero is purely atmospheric.

---

### 3. Showcase Reveal (new — replaces Value Props, How It Works, and Trust Signals)

The centrepiece of the redesign. A single section that communicates the product's output through abstract visual language rather than words.

#### Concept

As the user scrolls past the hero, a visual composition fades and rises into view. It suggests — without being literal — the elements of a preserved trip: route lines, photo frames, journal texture, map grids. Abstract, not wireframe-y. Think: a folio page from a luxury publisher, not a product screenshot.

#### Layout

- Full-width section with `max-w-4xl mx-auto` content constraint
- Vertically stacked: **visual composition** above, **text** below
- Generous vertical padding: `py-20 md:py-28`

#### Visual Composition

An abstract arrangement of vault-palette elements that evokes "travel archive" without depicting literal UI. All rendered in the existing colour tokens — no new colours.

Elements within the composition (layered, overlapping, asymmetric):

1. **Route thread** — A curved gold line (`vault-gold/30`) with subtle dashes, tracing a gentle S-curve across the composition. Small gold dots at intervals suggest stops. Evokes the route visual but is not a literal map.

2. **Photo frames** — 3–4 rectangles of varying aspect ratios (landscape, portrait, square), filled with warm gradients (`vault-gold/[0.06]` to `vault-gold/[0.14]`). Slightly overlapping, rotated 1–3 degrees for an organic, scattered feel — like photos laid out on a table. No grey placeholders — the gold gradients feel intentional.

3. **Journal lines** — A cluster of thin horizontal lines (`vault-gold/15`) of varying widths, grouped with a subtle left border accent, suggesting a page of handwritten text. Placed to one side of the composition, partially overlapping a photo frame.

4. **Map grid** — A faint rectilinear grid (`vault-gold/[0.04]`) underlying the whole composition, with latitude/longitude-style lines. Barely visible — atmospheric, not informational.

5. **Ornamental details** — Small diamond markers (reusing the `OrnamentalRule` diamond motif), a thin circular arc (suggesting a compass or globe curvature), scattered gold dots of varying opacity.

The composition should be a single `<div>` with absolutely-positioned child elements, sized to roughly `aspect-[16/9]` on desktop, collapsing to a taller ratio on mobile. All elements are `aria-hidden="true"`.

**Important:** This is not a grid of three cards. It's one unified, art-directed arrangement. The elements bleed into each other, overlap, and create depth through layering and opacity.

#### Text

Below the visual composition, centered:

```
From your travel app to a personal archive.
Export as PDF or interactive website — yours to keep forever.
```

- Line 1: `font-serif`, `text-xl md:text-2xl`, `font-semibold`, `text-vault-text`, `tracking-wide`
- Line 2: `text-base`, `text-vault-text-dim`, `font-light`, `tracking-wide`
- Gap between lines: `mt-2`
- Gap from visual composition: `mt-10 md:mt-14`
- Max width on text block: `max-w-lg mx-auto`

#### Entrance Animation

The showcase section uses the existing `Reveal` wrapper (scroll-triggered fade + rise):

1. Visual composition fades in as a unit (delay 0)
2. Line 1 of text (delay 0.15s)
3. Line 2 of text (delay 0.25s)

Within the visual composition, individual elements can have subtle staggered entrances (photo frames scale from 0.95, route line draws itself via stroke-dashoffset, journal lines widen from 0). These are CSS-only or Framer Motion — no additional p5.js canvas.

Reduced motion: everything renders statically, no animation.

---

### 4. CTA (simplified from current)

#### Layout

- Centered section, `py-16 md:py-20`
- Subtle radial glow behind (keep existing `vault-gold/[0.06]` blur)

#### Content

- **Heading:** *"Your memories are waiting"* — `font-serif`, `text-3xl md:text-4xl`, `font-semibold`, `text-vault-text`
- **Button:** "Get started" with right arrow icon
  - `rounded-full bg-vault-gold px-10 py-4 text-base font-medium tracking-wide text-white`
  - Hover: `bg-vault-gold/90`, shadow lift
  - Links to `/import`
  - `mt-6` below the heading

#### What's removed

- `AlbumPreview` mockup — the showcase section now carries the visual weight
- The current CTA section's extensive copy

---

### 5. Footer (new)

A minimal, quiet footer that grounds the page.

#### Layout

- Full width, `border-t border-vault-gold/10`
- Inner container: `max-w-4xl mx-auto`, `py-8 px-6 sm:px-8`
- Single row on desktop (flex, space-between), stacked on mobile (flex-col, centered)

#### Content

- **Left (or top on mobile):** `OrnamentalRule` — the diamond + line divider, reused from current page
- **Center:** Privacy signal — *"Your data never leaves your browser"* — `text-xs`, `text-vault-text-dim`, with a small `Shield` icon
- **Right (or bottom on mobile):** Copyright — `"Journey Vault"` + current year — `text-xs`, `text-vault-text-dim`

No links, no navigation. Just a clean sign-off.

---

## Visual Design

### Typography

No new fonts. Uses the existing serif (`font-serif`) and sans stack throughout.

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Header wordmark | Serif | `text-base` | Semibold | `vault-text` |
| Header link | Sans | `text-sm` | Medium | `vault-text-dim` → `vault-text` on hover |
| Hero title | Serif | `text-5xl` / `md:text-7xl` / `lg:text-8xl` | Semibold | `vault-text` |
| Hero subtitle | Sans | `text-base` / `md:text-lg` | Light | `vault-text-dim` |
| Showcase line 1 | Serif | `text-xl` / `md:text-2xl` | Semibold | `vault-text` |
| Showcase line 2 | Sans | `text-base` | Light | `vault-text-dim` |
| CTA heading | Serif | `text-3xl` / `md:text-4xl` | Semibold | `vault-text` |
| CTA button | Sans | `text-base` | Medium | White on `vault-gold` |
| Footer text | Sans | `text-xs` | Normal | `vault-text-dim` |

### Color

Uses the existing vault palette exclusively. No new colour tokens.

- `vault-bg` — hsl(38 30% 95%) — warm cream background
- `vault-surface` — hsl(36 22% 90%) — subtle surface differentiation
- `vault-gold` — hsl(32 55% 38%) — primary accent, CTA button, icon highlights
- `vault-gold-dim` — hsl(32 25% 65%) — secondary accent, decorative elements
- `vault-text` — hsl(25 22% 16%) — primary text
- `vault-text-dim` — hsl(25 12% 46%) — secondary text

### Spacing

The page uses generous vertical rhythm. Sections breathe.

| Section | Vertical Padding |
|---|---|
| Header | `h-14` (56px, fixed) |
| Hero | `min-h-svh` (full viewport) |
| Showcase | `py-20 md:py-28` |
| CTA | `py-16 md:py-20` |
| Footer | `py-8` |

---

## Motion

### Header Scroll Transition

- Background opacity: `0 → 0.8` over first 100px of scroll
- Border opacity: `0 → 1` over first 100px
- Duration: CSS transition, 200ms ease

### Hero (unchanged)

- Parallax fade-out and scale on scroll (existing `useScroll` + `useTransform`)
- CartographicDrift ambient rotation + scroll-driven dial rotation
- Title/subtitle fade-in on load

### Showcase Entrance

- `Reveal` wrapper: `translateY(32px) → 0`, `opacity: 0 → 1`, 700ms, ease `[0.16, 1, 0.3, 1]`
- Visual composition enters as a unit
- Text lines stagger: 150ms, 250ms delay
- Within the composition (optional, subtle):
  - Route line: stroke-dashoffset animation (draws itself over 1.2s)
  - Photo frames: `scale(0.95) → scale(1)` with 100ms stagger
  - Journal lines: `width: 0 → full` with 80ms stagger

### Reduced Motion

All animations disabled. Content renders statically. Mini vault icon in header uses static SVG fallback. CartographicDrift replaced by static VaultDoor (existing behavior).

---

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Mobile (< 640px)** | Header: icon + wordmark left, "Get started" right (same layout, tighter padding). Showcase composition: taller aspect ratio, elements stack more vertically. Footer: stacked and centered |
| **Tablet (640–1023px)** | Default layout. Comfortable margins |
| **Desktop (1024px+)** | Full layout. Showcase composition at `aspect-[16/9]`, elements spread wide |

---

## Components

| Component | Status | Notes |
|---|---|---|
| `SiteHeader` | **New** | Sticky header with mini vault icon, wordmark, "Get started" link. Scroll-aware background |
| `MiniVault` | **New** | Small p5.js canvas (~32px) rendering only the vault mechanism at slow ambient rotation. Reduced-motion fallback: static `VaultDoor` SVG at small size |
| `ShowcaseReveal` | **New** | Abstract visual composition + two-line text. Scroll-triggered entrance |
| `SiteFooter` | **New** | Minimal footer: ornamental rule, privacy signal, copyright |
| `LandingPage` | **Modify** | Remove Value Props section, How It Works section, Trust Signals section, AlbumPreview. Add SiteHeader, ShowcaseReveal, SiteFooter. Simplify CTA section |
| `JournalVisual` | **Remove** | Replaced by abstract showcase composition |
| `RouteVisual` | **Remove** | Replaced by abstract showcase composition |
| `PhotosVisual` | **Remove** | Replaced by abstract showcase composition |
| `AlbumPreview` | **Remove** | No longer needed — showcase section carries the visual weight |
| `CartographicDrift` | **Keep** | No changes |
| `VaultDoor` | **Keep** | No changes (also used as reduced-motion fallback in MiniVault) |
| `GrainOverlay` | **Keep** | No changes |
| `OrnamentalRule` | **Keep** | Reused in footer |
| `Reveal` | **Keep** | Reused in showcase and CTA sections |

---

## What Gets Deleted

| Current Section | Reason |
|---|---|
| Value Props ("Built to last" + 3 alternating rows) | Too wordy, marketing-brochure energy. Replaced by the abstract showcase |
| How It Works ("Three turns of the key") | Onboarding content — belongs on the import page where the user actually needs it |
| Trust Signals section | Privacy signal moves to footer. The section itself is removed |
| `AlbumPreview` component | The showcase section replaces its role |
| `VALUE_PROPS` data array | No longer used |
| `STEPS` data array | No longer used |
| `TRUST_SIGNALS` data array | No longer used |
| `VISUAL_COMPONENTS` map | No longer used |

---

## States

| State | What the user sees |
|---|---|
| **Default (top of page)** | Transparent header overlaying hero. Full CartographicDrift animation. Title + subtitle |
| **Scrolled past hero** | Header gains background. Showcase section visible with entrance animation complete. CTA below |
| **Reduced motion** | Static VaultDoor in hero (existing). Static mini vault SVG in header. No entrance animations — all content renders immediately. No CartographicDrift canvas |
| **Mobile** | Same three-beat structure. Showcase composition adapts to portrait. Header stays compact |

---

## Accessibility

### Semantics

- Header: `<header>` with `role="banner"`
- Hero: Decorative (canvas is `aria-hidden`). Title is `<h1>`, subtitle is `<p>`
- Showcase: `<section>` with `aria-label="Product showcase"`. Visual composition is `aria-hidden`. Text is readable
- CTA: `<section>` with heading + link
- Footer: `<footer>` with `role="contentinfo"`

### Keyboard

- Header link ("Get started") and CTA button are focusable and keyboard-accessible
- Skip link (if not already present): consider adding `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` at the top of the page

### Screen Readers

- CartographicDrift canvas is `aria-hidden` (existing)
- Showcase visual composition is `aria-hidden`
- All meaningful content is in text elements with proper heading hierarchy: `h1` (hero) → `h2` (showcase text, CTA heading)

---

## Decisions

- **No zip/export language on the landing page.** The user doesn't know about data exports yet. The landing page speaks in terms of memories and travel — the import page handles the mechanics.
- **"Get started" over "Open Your Vault."** Lower friction. The vault metaphor lives in the visual design, not the CTA copy.
- **Mini vault icon, not a static logo.** The rotating mechanism is the product's visual identity. Shrinking it to icon-size and keeping it alive in the header makes the brand feel dynamic. Worth the small p5 cost.
- **One showcase section, not three cards.** A unified composition has more visual impact than repeated card layouts. It also avoids the "SaaS landing page" pattern of icon + title + description rows.
- **Abstract over literal.** The showcase doesn't show a product screenshot or a UI mockup. It evokes the feeling of a preserved trip through shapes, lines, and gold accents. This is higher-end and avoids the "grey box mockup" problem of the current visuals.
- **How-it-works moves to import page.** Step-by-step instructions are onboarding, not marketing. Showing them on the landing page is premature — the user hasn't committed to trying the product yet.
- **Footer is minimal.** No navigation links, no social icons, no newsletter signup. Just identity, privacy, and copyright. The product is simple; the footer should be too.
- **Header is persistent but unobtrusive.** Transparent at top, gains background on scroll. Always provides a way to start the import flow without scrolling back up.
