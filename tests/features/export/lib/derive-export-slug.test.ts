import { describe, it, expect } from "vitest"
import { deriveExportSlug } from "@/features/export/lib/derive-export-slug"

const TS_2024_03 = 1709251200 // 2024-03-01 UTC

describe("deriveExportSlug", () => {
  it("slugifies a plain Latin name", () => {
    expect(deriveExportSlug("A New Adventure", TS_2024_03, "fallback")).toBe(
      "A-New-Adventure-2024-03"
    )
  })

  it("preserves accented Latin characters", () => {
    expect(deriveExportSlug("Café du Nord", TS_2024_03, "fallback")).toContain("Caf")
  })

  it("preserves Hebrew characters", () => {
    expect(deriveExportSlug("מסע לאירופה", TS_2024_03, "fallback")).toBe(
      "מסע-לאירופה-2024-03"
    )
  })

  it("preserves Japanese characters", () => {
    expect(deriveExportSlug("日本の旅", TS_2024_03, "fallback")).toBe(
      "日本の旅-2024-03"
    )
  })

  it("collapses multiple spaces and separators into one dash", () => {
    expect(deriveExportSlug("Trip   to  Spain", TS_2024_03, "fallback")).toBe(
      "Trip-to-Spain-2024-03"
    )
  })

  it("strips OS-unsafe characters", () => {
    const result = deriveExportSlug('My Trip: "Europe" <2024>', TS_2024_03, "fallback")
    expect(result).not.toMatch(/[:"<>]/)
    expect(result).toContain("2024-03")
  })

  it("caps the name part at 50 characters", () => {
    const longName = "A".repeat(80)
    const result = deriveExportSlug(longName, TS_2024_03, "fallback")
    const namePart = result.replace(/-2024-03$/, "")
    expect(namePart.length).toBeLessThanOrEqual(50)
  })

  it("does not leave trailing dashes before the date after capping", () => {
    const result = deriveExportSlug("word ".repeat(15), TS_2024_03, "fallback")
    expect(result).not.toMatch(/--/)
  })

  it("falls back to the Polarsteps slug when name is empty", () => {
    expect(deriveExportSlug("", TS_2024_03, "some-guid-slug")).toBe(
      "some-guid-slug-2024-03"
    )
  })

  it("falls back to the Polarsteps slug when name yields only unsafe chars", () => {
    expect(deriveExportSlug('***///"""', TS_2024_03, "some-guid-slug")).toBe(
      "some-guid-slug-2024-03"
    )
  })

  it("appends the correct YYYY-MM suffix", () => {
    const ts = new Date("2019-07-15").getTime() / 1000
    expect(deriveExportSlug("Summer", ts, "fallback")).toBe("Summer-2019-07")
  })

  it("zero-pads single-digit months", () => {
    const ts = new Date("2024-01-01").getTime() / 1000
    expect(deriveExportSlug("Winter", ts, "fallback")).toMatch(/-2024-01$/)
  })
})
