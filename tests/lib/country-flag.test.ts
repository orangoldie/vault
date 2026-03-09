import { describe, it, expect } from "vitest"

import { countryCodeToFlag } from "@/lib/country-flag"

describe("countryCodeToFlag", () => {
  it("converts US to the US flag emoji", () => {
    expect(countryCodeToFlag("US")).toBe("🇺🇸")
  })

  it("converts TH to the Thailand flag emoji", () => {
    expect(countryCodeToFlag("TH")).toBe("🇹🇭")
  })

  it("handles lowercase input", () => {
    expect(countryCodeToFlag("jp")).toBe("🇯🇵")
  })

  it("returns empty string for invalid length", () => {
    expect(countryCodeToFlag("")).toBe("")
    expect(countryCodeToFlag("A")).toBe("")
    expect(countryCodeToFlag("USA")).toBe("")
  })
})
