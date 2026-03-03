# 01 — Import a Polarsteps Trip Export — Design

## User Flow

```
1. User opens the app (no trips yet)
   → sees the Empty State: welcome message + import prompt

2. User clicks "Import Trip"
   → file picker opens (filtered to .zip files)

3a. User selects a valid Polarsteps export ZIP
   → picker closes, Import Progress view appears
   → ZIP is extracted in-browser, trip data and photos are read
   → progress bar fills as steps and photos are stored
   → on completion, Success Summary appears

3b. User selects an invalid file (not a ZIP, no trip.json inside, malformed data)
   → picker closes, Error State appears with a clear message
   → user can try again

3c. User cancels the file picker
   → nothing happens, stays on Empty State

4. After successful import
   → user sees the Success Summary with trip stats
   → "Import Another" and "Done" actions available
```

## Screens / Views

This feature lives on the **home page** (`/`). It has four visual states, all rendered in the same viewport — no page navigation.

### State 1: Empty State (no trips imported yet)

The first thing any new user sees. Must feel welcoming, not empty.

- App logo / name at top
- Headline: "Your travels, your archive"
- Subtext: brief explanation that this app preserves Polarsteps exports
- A single, prominent "Import Trip" button
- Small helper text below the button: "Select your Polarsteps export ZIP file"

### State 2: Import Progress

Replaces the empty state content while an import is running. User should feel confident things are working.

- Trip name displayed at top (extracted from `trip.json` immediately)
- A determinate progress bar showing overall progress
- Live counter text: "Extracting ZIP..." then "Importing step 12 of 56..." then "Importing photos... 47 of 213"
- The import has three visible phases:
  1. **Extracting ZIP** (fast — unzipping the archive in-browser)
  2. **Reading trip data** (fast — parsing JSON, extracting step metadata)
  3. **Storing photos** (slower — persisting image blobs to IndexedDB)
- No cancel button in v1 (import is fast enough and non-destructive)

### State 3: Success Summary

Appears when import completes. Gives the user confidence their data is safe.

- A checkmark or success icon
- Trip name (large, prominent) — respects text direction (RTL/LTR)
- Summary stats in a compact card:
  - Number of steps (e.g., "56 steps")
  - Number of photos (e.g., "213 photos")
  - Date range (e.g., "Feb 9 – Jun 10, 2025")
  - Total distance (e.g., "23,175 km")
- Two actions:
  - **"Import Another Trip"** — returns to the import prompt
  - **"Done"** (primary) — in v1, since there's no trip viewer yet, this returns to the home screen which shows a simple list of imported trips and an "Import Trip" button. Each trip in the list shows: trip name (with `dir="auto"`), date range, step count, and photo count. This post-import home state is minimal — just enough to confirm data exists. See wireframe below.

### State 4: Error State

Appears when the selected folder can't be parsed. Must be helpful, not scary.

- A warning icon (not red/alarming — amber/orange)
- Headline: "We couldn't read this file"
- Specific, plain-language message based on the error type:
  - Invalid file: "This doesn't appear to be a ZIP file. Please select the ZIP file you downloaded from Polarsteps."
  - Missing trip data: "No trip data was found in this file. Make sure you're selecting a Polarsteps export ZIP (it should contain a trip.json file)."
  - Corrupted data: "The trip data in this file appears to be damaged. Try re-downloading your export from Polarsteps."
  - Empty trip: "This trip doesn't contain any steps or photos to import."
  - Storage full: "There isn't enough storage space to import this trip. Try closing other tabs or clearing browser data to free up space."
  - File too large (after user dismisses warning): "The file may be too large to process in the browser. Try a smaller export or free up system memory."
- A single **"Try Again"** button that returns to the import prompt

## Components

### ImportPrompt

The welcome/empty state with the import call-to-action.

- Logo or app wordmark
- Headline + subtext
- Primary action button ("Import Trip")
- Helper text

### ImportProgress

The progress view during an active import.

- Trip name header
- Progress bar (determinate, 0–100%)
- Phase label + counter text
- Subtle animated indicator (pulsing dot or similar) to show activity

### ImportSummary

The success confirmation after import.

- Success icon
- Trip name (auto-direction for RTL/LTR)
- Stats grid (steps, photos, dates, distance)
- Action buttons

### ImportError

The error state with recovery action.

- Warning icon
- Error headline
- Descriptive message
- "Try Again" button

## Interactions & Transitions

### Transitions between states

- **Empty → Progress**: Smooth crossfade. The "Import Trip" button area transitions into the progress view.
- **Progress → Success**: The progress bar fills to 100%, brief hold (300ms), then crossfade to the summary.
- **Progress → Error**: Crossfade. Progress bar stops and fades out.
- **Success → Empty / Error → Empty**: Simple crossfade back to the import prompt.

### Loading / progress behavior

- The progress bar is **determinate** — it tracks actual progress, not a fake animation.
- Progress is weighted: extracting ZIP + reading trip data = 10%, storing photos = 90% (photos are the bulk of the work).
- Counter text updates in real-time as each photo is stored.
- If the import is very fast (< 1 second, e.g., a trip with no photos), skip the progress view and go straight to the success summary.

### File picker behavior

- Use a standard `<input type="file" accept=".zip">` file picker. This works consistently across all modern browsers (Chrome, Firefox, Safari).
- No need for directory picker APIs or browser-specific fallbacks — ZIP file selection is universally supported.

### Re-import behavior

- If the user imports a trip that already exists (same trip `id`), the new import **silently replaces** the old data. No confirmation dialog needed — the user's intent is clear and the action is non-destructive (they still have the original export folder).

## Layout — Wireframes

All states are **centered on the page**, vertically and horizontally. Maximum content width of ~480px. The design is minimal and focused — one thing at a time.

### Empty State

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              ◆ Polarsteps Vault              │
│                                              │
│          Your travels, your archive.         │
│   Import your Polarsteps data export and     │
│    turn it into a beautiful travel album.    │
│                                              │
│           ┌──────────────────┐               │
│           │   Import Trip    │               │
│           └──────────────────┘               │
│                                              │
│      Select your Polarsteps export            │
│               ZIP file                       │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

### Import Progress

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│         אלי ואורן במזרח                      │
│         (or LTR trip name)                   │
│                                              │
│     ████████████████░░░░░░░░░░  63%          │
│                                              │
│      Importing photos… 134 of 213            │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

### Success Summary

```
┌──────────────────────────────────────────────┐
│                                              │
│                   ✓                          │
│                                              │
│         אלי ואורן במזרח                      │
│       imported successfully                  │
│                                              │
│     ┌──────────────────────────┐             │
│     │  56 steps · 213 photos   │             │
│     │  Feb 9 – Jun 10, 2025   │             │
│     │  23,175 km               │             │
│     └──────────────────────────┘             │
│                                              │
│   ┌────────────────┐  ┌────────────┐        │
│   │ Import Another │  │    Done    │        │
│   └────────────────┘  └────────────┘        │
│                                              │
└──────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────┐
│                                              │
│                   ⚠                          │
│                                              │
│       We couldn't read this file           │
│                                              │
│    No trip data was found in this file.       │
│    Make sure you're selecting a Polarsteps    │
│    export ZIP (it should contain a            │
│    trip.json file).                          │
│                                              │
│           ┌──────────────────┐               │
│           │    Try Again     │               │
│           └──────────────────┘               │
│                                              │
└──────────────────────────────────────────────┘
```

### Post-Import Home (trips exist)

```
┌──────────────────────────────────────────────┐
│                                              │
│              ◆ Polarsteps Vault              │
│                                              │
│     ┌──────────────────────────────────┐     │
│     │  אלי ואורן במזרח                 │     │
│     │  Feb 9 – Jun 10, 2025            │     │
│     │  56 steps · 213 photos           │     │
│     └──────────────────────────────────┘     │
│                                              │
│     ┌──────────────────────────────────┐     │
│     │  Europe Summer 2024              │     │
│     │  Jul 1 – Aug 15, 2024            │     │
│     │  32 steps · 148 photos           │     │
│     └──────────────────────────────────┘     │
│                                              │
│           ┌──────────────────┐               │
│           │   Import Trip    │               │
│           └──────────────────┘               │
│                                              │
└──────────────────────────────────────────────┘
```

## Responsive Behavior

- The centered card layout works naturally on both desktop and mobile.
- Max width 480px, horizontal padding of 24px on small screens.
- The file picker is a native OS dialog, so it adapts to the device automatically.
- Touch targets for buttons: minimum 44x44px.

## Accessibility Notes

1. **RTL/LTR text direction**: Use `dir="auto"` on all user-generated text (trip names, step names, descriptions) so the browser auto-detects direction. Do not hardcode direction.
2. **Progress bar**: Use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Include a visually hidden live region (`aria-live="polite"`) that announces progress milestones (e.g., "50% complete", "Import finished").
3. **Focus management**: After the folder picker closes, return focus to the relevant content area. After import completes, move focus to the success heading or error heading.
4. **Reduced motion**: All crossfade transitions and progress bar animations must respect `prefers-reduced-motion: reduce` — use instant transitions instead.
5. **Keyboard navigation**: The "Import Trip" button and all action buttons must be reachable and activatable via keyboard (Tab + Enter/Space).
6. **Color independence**: Don't rely solely on color to indicate success (green) or error (amber). Always pair with icons and text.
7. **Screen reader announcements**: Import completion and errors should be announced via `aria-live` regions.

## Visual Direction

- **Minimal and calm**. Generous whitespace. The UI should feel like a blank canvas waiting for memories.
- **Muted palette** — no bright colors competing with the user's photos. Neutral backgrounds, subtle borders.
- **Typography-forward** — the trip name is the hero of the success screen. Large, confident type.
- **The import flow is a moment of anticipation** — the user is about to see their memories. The progress state should feel purposeful, not utilitarian.

---

## Design System — Foundations

### Color Palette

The palette is built around warm neutrals — the app is a frame for the user's photos, not a competitor. Colors are defined as HSL values for easy Tailwind CSS variable mapping.

#### Light Mode (default)

| Token              | Value               | Usage                                        |
|--------------------|---------------------|----------------------------------------------|
| `background`       | `hsl(40, 20%, 98%)` | Page background — warm off-white, not sterile |
| `surface`          | `hsl(40, 15%, 95%)` | Cards, stats box, elevated containers        |
| `surface-hover`    | `hsl(40, 12%, 91%)` | Hover state for interactive surfaces         |
| `border`           | `hsl(40, 10%, 87%)` | Subtle borders, dividers                     |
| `text-primary`     | `hsl(30, 10%, 15%)` | Headings, trip names, primary content        |
| `text-secondary`   | `hsl(30, 6%, 45%)`  | Subtext, helper text, counter labels         |
| `text-muted`       | `hsl(30, 4%, 62%)`  | Disabled text, placeholder text              |
| `accent`           | `hsl(220, 55%, 50%)`| Primary button background, progress bar fill |
| `accent-hover`     | `hsl(220, 55%, 43%)`| Primary button hover                         |
| `accent-foreground`| `hsl(0, 0%, 100%)`  | Text on accent-colored backgrounds           |
| `success`          | `hsl(152, 45%, 42%)`| Success icon, checkmark                      |
| `success-surface`  | `hsl(152, 35%, 95%)`| Subtle success background tint               |
| `warning`          | `hsl(38, 80%, 52%)` | Warning/error icon                           |
| `warning-surface`  | `hsl(38, 60%, 95%)` | Subtle warning background tint               |

#### Dark Mode

| Token              | Value               | Usage                                        |
|--------------------|---------------------|----------------------------------------------|
| `background`       | `hsl(30, 8%, 9%)`   | Page background — warm near-black            |
| `surface`          | `hsl(30, 6%, 13%)`  | Cards, elevated containers                   |
| `surface-hover`    | `hsl(30, 6%, 17%)`  | Hover state for interactive surfaces         |
| `border`           | `hsl(30, 5%, 20%)`  | Subtle borders                               |
| `text-primary`     | `hsl(35, 15%, 92%)` | Headings, primary content                    |
| `text-secondary`   | `hsl(30, 8%, 60%)`  | Subtext, helper text                         |
| `text-muted`       | `hsl(30, 5%, 40%)`  | Disabled, placeholder                        |
| `accent`           | `hsl(220, 55%, 60%)`| Primary button, progress bar                 |
| `accent-hover`     | `hsl(220, 55%, 53%)`| Primary button hover                         |
| `accent-foreground`| `hsl(0, 0%, 100%)`  | Text on accent backgrounds                   |
| `success`          | `hsl(152, 40%, 50%)`| Success icon                                 |
| `success-surface`  | `hsl(152, 20%, 14%)`| Subtle success background                    |
| `warning`          | `hsl(38, 70%, 55%)` | Warning icon                                 |
| `warning-surface`  | `hsl(38, 30%, 14%)` | Subtle warning background                    |

#### Design rationale

- **Warm, not cool**: The 30–40 hue range (golden/amber undertone) makes the app feel personal and inviting, like a photo album — not like a productivity tool.
- **Low saturation neutrals**: Backgrounds and text never compete with colorful travel photos.
- **Single accent color**: A calm blue serves for all interactive elements. Blue is neutral across cultures, doesn't evoke success/error, and works for both RTL and LTR audiences.
- **Success = green, Warning = amber**: Standard associations, but always paired with icons and text — never color alone.

### Typography

#### Font Stack

| Role        | Font                              | Fallback                                    |
|-------------|-----------------------------------|---------------------------------------------|
| **Headings**| Inter                             | system-ui, -apple-system, sans-serif        |
| **Body**    | Inter                             | system-ui, -apple-system, sans-serif        |
| **Mono**    | JetBrains Mono (if ever needed)   | ui-monospace, monospace                     |

**Why Inter?**
- Excellent Latin and Hebrew glyph coverage (critical for RTL support)
- Clean, geometric, highly legible at all sizes
- Variable font — one file covers all weights, smaller payload
- Free, open source, widely used in modern product design
- Pairs well with photo-heavy layouts without feeling decorative

#### Type Scale

All sizes use `rem` for accessibility (respects user font-size preferences). Line heights are unitless ratios.

| Token           | Size     | Weight   | Line height | Letter spacing | Usage                          |
|-----------------|----------|----------|-------------|----------------|--------------------------------|
| `display`       | 1.875rem (30px) | 600 (semi) | 1.2    | -0.02em        | Trip name on success screen    |
| `heading`       | 1.5rem (24px)   | 600 (semi) | 1.3    | -0.015em       | Trip name during import        |
| `title`         | 1.125rem (18px) | 500 (medium)| 1.4   | -0.01em        | "Your travels, your archive"   |
| `body`          | 1rem (16px)     | 400 (regular)| 1.5  | 0              | Descriptions, helper text      |
| `body-small`    | 0.875rem (14px) | 400 (regular)| 1.5  | 0.005em        | Counter text, stat labels      |
| `caption`       | 0.75rem (12px)  | 400 (regular)| 1.5  | 0.01em         | Folder hint, fine print        |

#### RTL typography notes

- Trip names and descriptions may be in any language/script. Use `dir="auto"` and `text-align: start` (not `left`) on all user-generated text.
- The UI chrome (buttons, labels, headings like "Your travels, your archive") is always LTR English.
- Mixed-direction text (e.g., a Hebrew trip name next to an English label) should use Unicode BiDi isolation (`<bdi>` element) to prevent reordering artifacts.

### Spacing Scale

Based on a 4px grid. Consistent spacing creates visual rhythm.

| Token | Value | Usage examples                              |
|-------|-------|---------------------------------------------|
| `xs`  | 4px   | Icon-to-text gap, tight internal padding    |
| `sm`  | 8px   | Between stat items, small element gaps      |
| `md`  | 16px  | Default element spacing, button padding     |
| `lg`  | 24px  | Section spacing, container padding          |
| `xl`  | 32px  | Between major content blocks                |
| `2xl` | 48px  | Top/bottom page margins, breathing room     |
| `3xl` | 64px  | Vertical centering offset, hero spacing     |

### Border Radius

| Token     | Value | Usage                                |
|-----------|-------|--------------------------------------|
| `sm`      | 6px   | Small elements, badges               |
| `md`      | 8px   | Buttons, input fields                |
| `lg`      | 12px  | Cards, stats box, modal-like areas   |
| `full`    | 9999px| Progress bar track and fill, pills   |

### Shadows

Minimal — depth is communicated through surface color changes, not heavy shadows.

| Token      | Value                                    | Usage                       |
|------------|------------------------------------------|-----------------------------|
| `sm`       | `0 1px 2px hsl(30 10% 15% / 0.05)`      | Buttons rest state          |
| `md`       | `0 2px 8px hsl(30 10% 15% / 0.08)`      | Stats card, elevated areas  |

In dark mode, shadows are near-invisible — surface color difference handles elevation instead.

### Icons

Use **Lucide** icons (the icon set bundled with shadcn/ui).

| Context        | Icon            | Size  | Color              |
|----------------|-----------------|-------|--------------------|
| Success        | `CircleCheck`   | 48px  | `success`          |
| Warning/Error  | `AlertTriangle` | 48px  | `warning`          |
| Import button  | `Upload`        | 20px  | `accent-foreground`|
| Steps stat     | `MapPin`        | 16px  | `text-secondary`   |
| Photos stat    | `Image`         | 16px  | `text-secondary`   |
| Date stat      | `Calendar`      | 16px  | `text-secondary`   |
| Distance stat  | `Route`         | 16px  | `text-secondary`   |

### Button Styles

#### Primary Button (e.g., "Import Trip", "Done")

- Background: `accent`
- Text: `accent-foreground`, weight 500, `body` size
- Padding: `12px 24px` (md vertical, lg horizontal)
- Border radius: `md` (8px)
- Shadow: `sm`
- Hover: background shifts to `accent-hover`, shadow lifts slightly
- Active/pressed: shadow drops to 0, slight scale-down (99%)
- Focus-visible: 2px `accent` ring with 2px offset
- Min height: 44px (touch target)
- Icon (if present): 20px, placed before text with `xs` (4px) gap

#### Secondary Button (e.g., "Import Another", "Try Again")

- Background: transparent
- Border: 1px solid `border`
- Text: `text-primary`, weight 500, `body` size
- Padding: same as primary
- Border radius: `md`
- Hover: background shifts to `surface-hover`
- Active: slight scale-down (99%)
- Focus-visible: same ring as primary

### Progress Bar

- **Track**: `surface` background, `full` radius, height 8px
- **Fill**: `accent` background, `full` radius, animated width
- **Transition**: width changes use a smooth ease-out (300ms) — feels organic, not mechanical
- **Reduced motion**: instant width changes, no transition
- **Percentage text**: `body-small`, `text-secondary`, right-aligned above the bar

### Stats Card (Success Screen)

- Background: `surface`
- Border: 1px solid `border`
- Border radius: `lg` (12px)
- Padding: `lg` (24px)
- Shadow: `md`
- Layout: 2x2 grid on wider screens, vertical stack on narrow
- Each stat: icon (16px, `text-secondary`) + value (`body`, `text-primary`, weight 500) + label (`caption`, `text-secondary`)

### Motion Tokens

All animations use these shared timing values:

| Token         | Value              | Usage                              |
|---------------|--------------------|------------------------------------|
| `duration-fast`   | 150ms         | Button hover/active, small toggles |
| `duration-normal` | 250ms         | Crossfade between states           |
| `duration-slow`   | 400ms         | Progress bar 100% → success hold   |
| `ease-out`        | cubic-bezier(0.16, 1, 0.3, 1) | State transitions, progress fill |
| `ease-in-out`     | cubic-bezier(0.45, 0, 0.55, 1) | Crossfades                      |

When `prefers-reduced-motion: reduce` is active: all durations become 0ms (instant transitions).
