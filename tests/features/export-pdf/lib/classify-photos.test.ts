import { describe, it, expect } from "vitest"

import { classifyAspect } from "@/features/export-pdf/lib/classify-photos"

describe("aspect classification", () => {

  it("classifies landscape photos (ratio > 1.2)", () => {
    expect(classifyAspect(1280, 960)).toBe("landscape")
    expect(classifyAspect(1920, 1080)).toBe("landscape")
    expect(classifyAspect(2000, 1000)).toBe("landscape")
  })

  it("classifies portrait photos (ratio < 0.8)", () => {
    expect(classifyAspect(960, 1280)).toBe("portrait")
    expect(classifyAspect(1080, 1920)).toBe("portrait")
    expect(classifyAspect(600, 1000)).toBe("portrait")
  })

  it("classifies square photos (0.8 <= ratio <= 1.2)", () => {
    expect(classifyAspect(1000, 1000)).toBe("square")
    expect(classifyAspect(1100, 1000)).toBe("square") // ratio 1.1
    expect(classifyAspect(900, 1000)).toBe("square")  // ratio 0.9
    expect(classifyAspect(1200, 1000)).toBe("square") // ratio 1.2 exactly
  })

  it("handles edge cases at boundaries", () => {
    // 1.2 is square (<=1.2), just above is landscape
    expect(classifyAspect(120, 100)).toBe("square")
    expect(classifyAspect(121, 100)).toBe("landscape")
    // 0.8 is square (>=0.8), just below is portrait
    expect(classifyAspect(80, 100)).toBe("square")
    expect(classifyAspect(79, 100)).toBe("portrait")
  })

  it("handles 1:1 aspect ratio", () => {
    expect(classifyAspect(500, 500)).toBe("square")
  })
})
