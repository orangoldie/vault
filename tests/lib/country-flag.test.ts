import { describe, it, expect } from "vitest"

import { countryFlagClass } from "@/lib/country-flag"

describe("countryFlagClass", () => {
  it("converts US to flag-icons CSS classes", () => {
    expect(countryFlagClass("US")).toBe("fi fi-us fis")
  })

  it("converts TH to flag-icons CSS classes", () => {
    expect(countryFlagClass("TH")).toBe("fi fi-th fis")
  })

  it("handles lowercase input", () => {
    expect(countryFlagClass("jp")).toBe("fi fi-jp fis")
  })

  it("returns empty string for invalid length", () => {
    expect(countryFlagClass("")).toBe("")
    expect(countryFlagClass("A")).toBe("")
    expect(countryFlagClass("USA")).toBe("")
  })
})
