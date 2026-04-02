import { describe, it, expect } from "vitest"

import { countryCodeToFlagEmoji } from "@/features/export-pdf/lib/country-flag-emoji"

describe("countryCodeToFlagEmoji", () => {
  it("converts US to flag emoji", () => {
    expect(countryCodeToFlagEmoji("US")).toBe("\u{1F1FA}\u{1F1F8}")
  })

  it("converts lowercase codes", () => {
    expect(countryCodeToFlagEmoji("nl")).toBe("\u{1F1F3}\u{1F1F1}")
  })

  it("returns input for invalid codes", () => {
    expect(countryCodeToFlagEmoji("X")).toBe("X")
    expect(countryCodeToFlagEmoji("")).toBe("")
    expect(countryCodeToFlagEmoji("ABC")).toBe("ABC")
  })

  it("produces different emoji for different countries", () => {
    const us = countryCodeToFlagEmoji("US")
    const fr = countryCodeToFlagEmoji("FR")
    const jp = countryCodeToFlagEmoji("JP")
    expect(us).not.toBe(fr)
    expect(fr).not.toBe(jp)
  })
})
