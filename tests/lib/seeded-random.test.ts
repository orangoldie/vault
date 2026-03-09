import { describe, it, expect } from "vitest"

import { seededRandom } from "@/lib/seeded-random"

describe("seededRandom", () => {
  it("returns a number between 0 and 1", () => {
    const result = seededRandom("test-photo-id")
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(1)
  })

  it("returns the same value for the same seed", () => {
    const a = seededRandom("photo-abc")
    const b = seededRandom("photo-abc")
    expect(a).toBe(b)
  })

  it("returns different values for different seeds", () => {
    const a = seededRandom("photo-1")
    const b = seededRandom("photo-2")
    expect(a).not.toBe(b)
  })
})
