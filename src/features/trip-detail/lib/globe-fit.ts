import { useEffect, useState } from "react"

/**
 * Geometry for deciding whether — and at what size — the desktop mini globe
 * fits in the gutter beside the centered content column.
 *
 * The old approach hardcoded a `min-[1500px]` viewport breakpoint as a proxy
 * for "is there room?". That broke under OS display scaling / browser zoom
 * (e.g. 1920px @ 150% → a 1280px CSS viewport hides the globe even though the
 * gutter can still fit a slightly smaller one) and silently drifted whenever
 * the content width or globe size changed. Instead we measure the real gutter
 * and fluidly scale the globe to fit, hiding only when it gets too small.
 */

/**
 * Width of the centered content column in CSS px. Must stay in sync with the
 * `max-w-[720px]` class on the column in `trip-detail-view.tsx` and
 * `chapter-showcase.tsx`.
 */
export const CONTENT_MAX_WIDTH = 720

/** Full (preferred) size of the compass-rose globe frame in px. */
export const GLOBE_FRAME_MAX = 340

/** Smallest frame worth showing; below this we fall back to the mobile FAB. */
export const GLOBE_FRAME_MIN = 220

/** Right-edge margin (the `1rem` offset). */
const EDGE_MARGIN = 16

/** Breathing gap kept between the globe's left edge and the text column. */
const TEXT_GAP = 16

export interface GlobeFit {
  /** Whether the desktop globe has room to show at all. */
  show: boolean
  /** Frame size in px, clamped to [GLOBE_FRAME_MIN, GLOBE_FRAME_MAX]. */
  frameSize: number
  /** CSS scale relative to the full frame (frameSize / GLOBE_FRAME_MAX). */
  scale: number
}

/**
 * Decide whether the desktop globe fits beside the content column for a given
 * viewport width, and at what scale.
 */
export function computeGlobeFit(viewportWidth: number): GlobeFit {
  const gutter = (viewportWidth - CONTENT_MAX_WIDTH) / 2
  const available = gutter - EDGE_MARGIN - TEXT_GAP

  if (available < GLOBE_FRAME_MIN) {
    return {
      show: false,
      frameSize: GLOBE_FRAME_MIN,
      scale: GLOBE_FRAME_MIN / GLOBE_FRAME_MAX,
    }
  }

  const frameSize = Math.min(available, GLOBE_FRAME_MAX)
  return { show: true, frameSize, scale: frameSize / GLOBE_FRAME_MAX }
}

const HIDDEN_FIT: GlobeFit = {
  show: false,
  frameSize: GLOBE_FRAME_MIN,
  scale: GLOBE_FRAME_MIN / GLOBE_FRAME_MAX,
}

/**
 * Live globe-fit measurement. Starts hidden (matching SSR) and recomputes on
 * every viewport resize — which also covers browser zoom and OS scale changes.
 */
export function useGlobeFit(): GlobeFit {
  const [fit, setFit] = useState<GlobeFit>(HIDDEN_FIT)

  useEffect(() => {
    const update = () => setFit(computeGlobeFit(window.innerWidth))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return fit
}
