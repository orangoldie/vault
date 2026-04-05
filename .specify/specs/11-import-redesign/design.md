# 11 — Import Page Redesign: Design Plan

## Vision

The import page is the vault's intake desk — the first functional moment after the atmospheric landing. It should feel like stepping into a private archive: structured, clear, and quietly refined. Every element earns its place.

The current page is a bare-bones `ImportFlow` rendered in a centered box with no context, no guidance, no identity. The redesign promotes it to a full page with the site header and footer, a source picker for the two supported travel app formats, a one-line prompt linking to the official export guide, the existing trip archive when trips are present, and a legal disclaimer.

The aesthetic stays in the vault palette — warm cream, gold accents, serif headings — but the energy shifts from atmospheric to purposeful. No hero canvas. No ambient animation. Just clarity.

> **Platform names — spec exception:** This spec document is the **only place in the project** where the names **Polarsteps** and **FindPenguins** may appear. The project constitution prohibits these names everywhere else (UI text, code, comments, types, file names, and all other docs). Implementation must use only generic language: "your travel app", "data export", "ZIP archive". This exception exists so the spec remains unambiguous for the developer reading it.

---

## User Flow

### First-time visitor (no trips)

1. User arrives at `/import` from the landing page "Get started" link.
2. The site header is visible. The page title and a one-line description orient the user.
3. A **source picker** presents two options side by side: Polarsteps (active) and FindPenguins (coming soon, dimmed).
4. User clicks Polarsteps — the card gains a gold selection ring. Below it, an **instruction panel** slides in with a one-line prompt linking to the Polarsteps export page, and an upload zone.
5. User uploads their ZIP file → existing import flow takes over (scanning → selecting → importing → redirect).

### Returning visitor (trips exist)

1. User arrives at `/import`.
2. **Archive section** at the top lists their existing trips as refined cards linking to `/trip/:slug`.
3. Below the archive, an **"Add another trip"** section with the source picker is always visible.
4. User selects Polarsteps → instruction panel slides in + upload zone appears, identical to the first-time flow.
5. Disclaimer sits at the bottom of the page, above the footer.

### Import sub-states (unchanged logic)

The existing `ImportFlow` state machine (idle → scanning → selecting → importing → error) is preserved. Only the visual shell and the idle state are redesigned.

---

## Structure (top to bottom)

### 1. Header

Reuse `SiteHeader` exactly as-is from the landing page. It is already implemented and correct. No changes.

The header link "Get started" remains in the header even when the user is on `/import` — it is a persistent nav element, not a page-specific CTA. On the import page, it links to itself (no visual change needed; acceptable).

---

### 2. Page intro

A small, text-only section just below the header (accounting for `pt-14` to clear the fixed nav).

#### Layout

- `max-w-3xl mx-auto px-6 sm:px-8`
- `pt-20 pb-10` (generous top padding, moderate bottom)

#### Content

```
Archive your travels
Import your travel data export and preserve your trips in Journey Vault.
```

- **Heading:** `font-serif`, `text-3xl md:text-4xl`, `font-semibold`, `text-vault-text`, `tracking-wide`
- **Subtext:** `text-base`, `text-vault-text-dim`, `font-light`, `mt-2`, `max-w-lg`

The heading is `<h1>`. No decorative canvas or illustration — the page's job is clarity, not atmosphere.

---

### 3. Archive section (conditional — only when trips exist)

Shown above the import section when `trips.length > 0`.

#### Layout

- `max-w-3xl mx-auto px-6 sm:px-8`
- `pb-10`
- Section label + trip grid

#### Section label

```
Your archive
```

- `text-xs font-medium tracking-[0.12em] uppercase text-vault-gold/70`
- A thin `border-b border-vault-gold/15` below the label, `mb-5`

#### Trip cards

Refined over the current `TripList` cards. Same data (name, date range, chapter count, photo count), better vault-aligned styling:

- Container: `rounded-2xl border border-vault-gold/20 bg-vault-surface p-5`
- On hover: `border-vault-gold/40`, `bg-vault-surface` (stays), subtle `shadow-sm`
- Transition: 200ms ease
- **Trip name:** `font-serif text-lg font-semibold text-vault-text`
- **Date range:** `text-sm text-vault-text-dim font-light mt-1`
- **Stats row:** `text-xs text-vault-text-dim flex gap-5 mt-3` — MapPin icon + chapter count, ImageIcon + photo count. Icons at `size-3.5 text-vault-gold/50`
- A thin ornamental line at top-right of each card: a small `◈` glyph at `text-vault-gold/25 text-xs`, absolutely positioned

Cards are `<Link href={/trip/:slug}>` — full card is clickable.

Layout: Single column on mobile. Two-column grid (`grid-cols-2`) on `sm:` and up, with `gap-4`.

---

### 4. Import section

The core of the page. Adapts based on whether trips exist.

#### When no trips exist

The import section fills the main content area. No "Add another trip" label — just the source picker directly.

#### When trips exist

The import section is introduced with a label:

```
Add another trip
```

- Same label style as "Your archive"
- A thin horizontal rule above it (`border-t border-vault-gold/15 pt-8 mb-5`)

#### 4a. Source picker

Two cards side by side. On mobile, stacked vertically.

**Layout:**
- `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Each card: `rounded-2xl border p-5 cursor-pointer transition-all duration-200`

**Polarsteps card (active option):**

- Default state: `border-vault-gold/20 bg-vault-surface`
- Selected state: `border-vault-gold/60 bg-vault-gold/[0.04] ring-2 ring-vault-gold/20`
- Hover (unselected): `border-vault-gold/35 bg-vault-surface`
- Icon area: a simple `Archive` or `FolderOpen` lucide icon at `size-8 text-vault-gold/60`
- Label: `font-serif text-base font-semibold text-vault-text mt-3`
- Subtext: `text-xs text-vault-text-dim mt-1 font-light` — "GPS route-based travel exports"

**FindPenguins card (coming soon):**

- Always: `border-vault-gold/10 bg-vault-surface/50 opacity-60 cursor-not-allowed`
- No hover state
- Same icon treatment but greyed: `text-vault-text-dim/40`
- Label: same serif style but `text-vault-text-dim`
- "Coming soon" badge: `text-xs bg-vault-gold/10 text-vault-gold/70 rounded-full px-2 py-0.5 font-medium` — inline, next to the label
- Clicking: no-op (does not trigger selection)

The source picker is a controlled UI element. Only one card can be selected at a time. Default: nothing selected (no card is highlighted). After selecting Polarsteps, it stays selected until the user navigates away.

**Accessibility:**
- Each card is a `<button role="radio">` within a `role="radiogroup"`
- `aria-checked` reflects selection state
- `aria-disabled="true"` on the FindPenguins card
- `aria-label` descriptions for screen readers

---

#### 4b. Instruction panel (Polarsteps selected)

Appears below the source picker when Polarsteps is selected, via a slide-down + fade-in animation.

**Layout:**
- `mt-6 rounded-2xl border border-vault-gold/20 bg-vault-gold/[0.03] p-6 md:p-8`
- Entrance: `height: 0 → auto`, `opacity: 0 → 1`, 300ms, ease `[0.16, 1, 0.3, 1]`

**Instruction content:**

A single short prompt directing the user to export from the Polarsteps website, then return and upload:

```
Export your data from Polarsteps, then upload the ZIP file below.
```

- `text-sm text-vault-text-dim leading-relaxed`
- The word "Polarsteps" is a clickable external link opening in a new tab:
  `https://support.polarsteps.com/hc/en-us/articles/24266264821138-How-can-I-export-a-copy-of-my-data`
  Styled as `text-vault-text font-medium underline underline-offset-2 decoration-vault-gold/40 hover:decoration-vault-gold/70 transition-colors`
- Link has `target="_blank" rel="noopener noreferrer"` and an `ExternalLink` icon at `size-3 inline ml-0.5 align-middle text-vault-gold/50`

No numbered steps, no icons, no sub-headings. One sentence is enough.

**Upload zone:**

Below the note, a refined file drop/pick area:

- Container: `mt-6 rounded-xl border-2 border-dashed border-vault-gold/25 bg-vault-bg/50 py-8 text-center transition-colors duration-200`
- Drag-over state: `border-vault-gold/60 bg-vault-gold/[0.04]`
- Icon: `Upload` at `size-8 text-vault-gold/50 mx-auto mb-3`
- Primary label: `text-sm font-medium text-vault-text` — "Drop your ZIP file here"
- Secondary label: `text-xs text-vault-text-dim mt-1` — "or"
- Button: `mt-3 rounded-full bg-vault-gold px-6 py-2 text-sm font-medium tracking-wide text-white hover:bg-vault-gold/90 transition-colors`
  - Label: "Select file"
- File type note: `text-xs text-vault-text-dim/60 mt-3` — "Accepts .zip files"

The upload zone triggers the existing `ImportFlow` logic via the `onFileSelected` callback.

**Reduced motion:** instruction panel appears instantly (no slide animation). Upload zone drag states still apply (visual only, no motion).

---

#### 4c. Import sub-states (scanning, selecting, progress, error)

When the user drops or selects a file, the import sub-states (scanning, selecting, progress, error) overlay the import section. These use the existing `ImportFlow` components (`ExtractionSpinner`, `TripSelectionList`, `ImportProgress`, `ImportErrorView`) but rendered within the page layout — not the old centered narrow box.

The existing `AnimatePresence` / `motion.div` transitions are preserved.

After successful import: redirect to `/trip/:slug` as before.

---

### 5. Disclaimer

A legal notice at the bottom of the page content, above the footer.

#### Layout

- `max-w-3xl mx-auto px-6 sm:px-8`
- `pt-16 pb-8`
- Separated from import section by an `OrnamentalRule` (existing component)

#### Content

```
Journey Vault is an independent tool and is not affiliated with, endorsed by, or
in any way officially connected to Polarsteps, FindPenguins, or their parent companies.
All trademarks and brand names belong to their respective owners.
```

- Container: `rounded-2xl border border-vault-gold/20 bg-vault-surface px-7 py-6` (flex layout, icon leading)
- Text: `text-sm text-vault-text-dim leading-relaxed`
- A `Scale` icon at `size-4 text-vault-gold/50 shrink-0 mt-0.5` leads the block, aligned to first line

---

### 6. Footer

Reuse `SiteFooter` exactly as-is. No changes.

---

## Visual Design

### Typography

No new fonts. Same serif + sans pairing as the landing page.

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Page heading | Serif | `text-3xl / md:text-4xl` | Semibold | `vault-text` |
| Page subtext | Sans | `text-base` | Light | `vault-text-dim` |
| Section labels | Sans | `text-xs` | Medium | `vault-gold/70` |
| Trip card name | Serif | `text-lg` | Semibold | `vault-text` |
| Trip card meta | Sans | `text-sm` | Light | `vault-text-dim` |
| Source card label | Serif | `text-base` | Semibold | `vault-text` |
| Source card subtext | Sans | `text-xs` | Light | `vault-text-dim` |
| Instruction prompt | Sans | `text-sm` | Normal | `vault-text-dim` |
| Upload labels | Sans | `text-sm` | Medium | `vault-text` |
| Disclaimer | Sans | `text-xs` | Normal | `vault-text-dim/70` |

### Color

No new colour tokens. Full vault palette.

| Token | Value | Usage |
|---|---|---|
| `vault-bg` | `hsl(38 30% 95%)` | Page background |
| `vault-surface` | `hsl(36 22% 90%)` | Card backgrounds |
| `vault-gold` | `hsl(32 55% 38%)` | Selection ring, step numbers, upload button, icons |
| `vault-gold-dim` | `hsl(32 25% 65%)` | Decorative elements, dimmed icons |
| `vault-text` | `hsl(25 22% 16%)` | Primary text |
| `vault-text-dim` | `hsl(25 12% 46%)` | Secondary text, metadata |

### Spacing

| Section | Vertical Padding |
|---|---|
| Page intro | `pt-20 pb-10` (plus `pt-14` for header offset) |
| Archive section | `pb-10` |
| Import section | `pb-12` |
| Disclaimer | `pt-16 pb-8` |
| Footer | `py-8` (unchanged) |

---

## Motion

### Source picker selection

- Selected card: border and ring transition over 200ms ease
- FindPenguins card: no state transitions

### Instruction panel entrance

- Framer Motion `AnimatePresence` on the panel
- `initial: { height: 0, opacity: 0 }` → `animate: { height: "auto", opacity: 1 }` → `exit: { height: 0, opacity: 0 }`
- Duration: 300ms, ease `[0.16, 1, 0.3, 1]`
- Uses `overflow: hidden` during animation

### Import sub-state transitions

- Existing `AnimatePresence` + `motion.div` with `opacity` and `translateY` variants
- Unchanged from current implementation

### Reduced motion

- Instruction panel appears/disappears instantly (`duration: 0`)
- All card hover transitions remain (they are visual, not temporal)
- Import sub-state transitions: instant (existing `reducedMotionVariants` already handles this)

---

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Mobile (< 640px)** | Source picker: single column (cards stacked). Trip archive: single column. Instruction panel padding reduced to `p-5`. Upload zone slightly shorter. |
| **Tablet (640–1023px)** | Source picker: 2-column. Trip archive: 2-column. Full layout. |
| **Desktop (1024px+)** | Full layout. Max content width `max-w-3xl` prevents overstretch. |

---

## Components

| Component | Status | Notes |
|---|---|---|
| `ImportPage` | **Modify** | Add `SiteHeader`, `SiteFooter`, page intro, archive section, disclaimer. Replace bare `ImportFlow` wrapper. |
| `SourcePicker` | **New** | Two-card radiogroup: Polarsteps (selectable) + FindPenguins (coming soon). Emits `onSelect(source)`. |
| `PolarstepsInstructions` | **New** | Instruction panel for Polarsteps: one-line prompt linking to the export guide + upload zone. Wraps existing file input logic. Animated entrance. |
| `ArchiveSection` | **New** | Refined trip card grid. Reuses data from existing `getAllTrips()`. Replaces `TripList`. |
| `ImportDisclaimer` | **New** | Legal disclaimer block with icon. Server component. |
| `ImportFlow` | **Modify** | The state machine logic stays. The idle state is now handled by the page-level components (`SourcePicker` + `PolarstepsInstructions`). The flow states (scanning, selecting, importing, error) render inline within the import section. |
| `TripList` | **Remove** | Replaced by `ArchiveSection`. |
| `ImportPrompt` | **Remove** | Replaced by `PolarstepsInstructions` + `SourcePicker`. |
| `SiteHeader` | **Reuse** | Imported from `features/landing`. No changes. |
| `SiteFooter` | **Reuse** | Imported from `features/landing`. No changes. |
| `OrnamentalRule` | **Reuse** | Used above disclaimer. Extract to `components/ornamental-rule.tsx` (shared) if not already. |

---

## States

| State | What the user sees |
|---|---|
| **Idle, no trips** | Header → Page intro → Source picker (unselected) → Disclaimer → Footer |
| **Idle, no trips, Polarsteps selected** | Header → Page intro → Source picker (Polarsteps highlighted) → Instruction panel (animated in) + upload zone → Disclaimer → Footer |
| **Idle, trips exist** | Header → Page intro → Archive section (trip cards) → "Add another trip" label → Source picker (unselected) → Disclaimer → Footer |
| **Idle, trips exist, Polarsteps selected** | Same as above but source picker shows Polarsteps highlighted + instruction panel |
| **Scanning** | The instruction/upload zone area transitions to `ExtractionSpinner` |
| **Selecting (multi-trip ZIP)** | The import section transitions to `TripSelectionList` |
| **Importing** | The import section transitions to `ImportProgress` |
| **Error** | The import section transitions to `ImportErrorView` with retry option |
| **Reduced motion** | All animations disabled; instruction panel appears instantly; all content renders statically |

---

## Accessibility

### Semantics

- Page: `<main id="main-content">` (for skip link from header)
- Page heading: `<h1>` ("Archive your travels")
- Section headings: `<h2>` ("Your archive", "Add another trip")
- Source picker: `<fieldset role="radiogroup">` wrapping two `<button role="radio">` elements
- Instruction panel: `<section aria-label="Export instructions">`
- Disclaimer: `<aside aria-label="Legal notice">`

### Keyboard

- Source picker cards: full keyboard navigation (arrow keys within radiogroup, Enter/Space to select)
- Upload zone: Tab-focusable, Enter triggers file picker
- Trip cards: Tab-focusable, Enter navigates to trip
- "Select file" button: standard button keyboard behaviour

### Screen Readers

- FindPenguins card: `aria-disabled="true"` + `aria-label="FindPenguins, coming soon"`
- Polarsteps card selected: `aria-checked="true"`
- Upload zone: `role="region" aria-label="File upload area"`
- Import progress states: `aria-live="polite"` (existing, unchanged)
- Disclaimer: readable as plain text; no decorative elements with meaning

---

## Decisions

- **Header and footer reuse, no forking.** `SiteHeader` and `SiteFooter` are extracted components. The import page composes them without modification. This ensures visual consistency and prevents divergence.

- **Archive above import.** Returning users care most about accessing existing trips. Showing the archive first respects their intent; the "add another" import section sits beneath naturally.

- **Source picker defaults to unselected.** We do not pre-select Polarsteps. Requiring an active choice reinforces that this is a meaningful action (choosing a source), not a default assumption. The instruction panel only appears after the user deliberately picks a source.

- **FindPenguins is present but disabled, not hidden.** "Coming soon" communicates roadmap without dead UI. Hiding it entirely would miss the opportunity to set expectations. A dimmed, non-interactive card with a badge is the right balance.

- **Instruction panel slides in; it doesn't navigate away.** The instructions are contextual to the source selection. A separate "instructions page" would add friction and lose the selection context. The slide-in panel keeps everything on one screen.

- **Platform names appear in the source picker and disclaimer only.** The source picker cards must display "Polarsteps" and "FindPenguins" by name — users cannot otherwise identify which option matches their data. The disclaimer also names them explicitly, which strengthens the legal notice (a generic "third-party platforms" disclaimer is weaker than one that names the specific platforms). These are the two deliberate exceptions to the constitution's no-platform-names rule. Everywhere else (instructions, upload zone, page intro) the UI uses only generic language: "your travel app", "data export", "ZIP file".

- **OrnamentalRule promoted to shared component.** Currently defined inline in `SiteFooter`. The import page reuses it above the disclaimer. Extract to `src/components/ornamental-rule.tsx`.

- **Disclaimer is permanent, not dismissible.** It is a legal notice, not a cookie banner. It should always be visible at the bottom of the page.

- **Upload zone replaces the old `ImportPrompt` button.** The dropzone is more discoverable and modern. The "Select file" button inside it serves users who prefer clicking over dragging. Both paths call the same `onFileSelected` handler.

- **`TripList` and `ImportPrompt` are removed.** Their roles are fully covered by `ArchiveSection` and `PolarstepsInstructions` respectively. No backwards-compatibility wrappers.
