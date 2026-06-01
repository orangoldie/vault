import { describe, it, expect } from "vitest"

import {
  computeGlobeFit,
  CONTENT_MAX_WIDTH,
  GLOBE_FRAME_MAX,
  GLOBE_FRAME_MIN,
} from "@/features/trip-detail/lib/globe-fit"

describe("computeGlobeFit", () => {
  it("shows the full-size globe on a wide viewport", () => {
    const fit = computeGlobeFit(1920)
    expect(fit.show).toBe(true)
    expect(fit.frameSize).toBe(GLOBE_FRAME_MAX)
    expect(fit.scale).toBe(1)
  })

  it("shows a scaled-down globe in a tight gutter (1920px @ 150% → 1280 CSS px)", () => {
    const fit = computeGlobeFit(1280)
    expect(fit.show).toBe(true)
    expect(fit.frameSize).toBeGreaterThanOrEqual(GLOBE_FRAME_MIN)
    expect(fit.frameSize).toBeLessThan(GLOBE_FRAME_MAX)
    expect(fit.scale).toBeCloseTo(fit.frameSize / GLOBE_FRAME_MAX)
  })

  it("hides the globe once the gutter can't fit the minimum size", () => {
    const fit = computeGlobeFit(1100)
    expect(fit.show).toBe(false)
  })

  it("treats the exact minimum-fit width as showable", () => {
    // available = (w - CONTENT)/2 - 16 - 16 === GLOBE_FRAME_MIN  →  show
    const exact = CONTENT_MAX_WIDTH + 2 * (GLOBE_FRAME_MIN + 16 + 16)
    const fit = computeGlobeFit(exact)
    expect(fit.show).toBe(true)
    expect(fit.frameSize).toBe(GLOBE_FRAME_MIN)
  })

  it("hides one pixel below the minimum-fit width", () => {
    const exact = CONTENT_MAX_WIDTH + 2 * (GLOBE_FRAME_MIN + 16 + 16)
    expect(computeGlobeFit(exact - 1).show).toBe(false)
  })

  it("never returns a frame size outside the clamp range", () => {
    for (const w of [600, 900, 1224, 1280, 1432, 1500, 2560]) {
      const { frameSize } = computeGlobeFit(w)
      expect(frameSize).toBeGreaterThanOrEqual(GLOBE_FRAME_MIN)
      expect(frameSize).toBeLessThanOrEqual(GLOBE_FRAME_MAX)
    }
  })
})
