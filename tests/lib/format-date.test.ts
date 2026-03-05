import { describe, it, expect } from "vitest"

import { formatDate, formatDateRange } from "@/lib/format-date"

describe("formatDate", () => {
  it("formats a Unix timestamp as a readable date", () => {
    // Feb 9, 2025 00:00:00 UTC = 1739059200
    const result = formatDate(1739059200)
    // en-US locale: "Feb 9, 2025"
    expect(result).toBe("Feb 9, 2025")
  })

  it("formats a timestamp in a different month", () => {
    // Jun 10, 2025 00:00:00 UTC = 1749513600
    const result = formatDate(1749513600)
    expect(result).toBe("Jun 10, 2025")
  })

  it("formats a timestamp at the Unix epoch", () => {
    const result = formatDate(0)
    expect(result).toBe("Jan 1, 1970")
  })

  it("handles a timestamp from a different year", () => {
    // Jul 1, 2024 00:00:00 UTC = 1719792000
    const result = formatDate(1719792000)
    expect(result).toBe("Jul 1, 2024")
  })
})

describe("formatDateRange", () => {
  it("formats a date range within the same year", () => {
    // Feb 9, 2025 to Jun 10, 2025
    const result = formatDateRange(1739059200, 1749513600)
    expect(result).toContain("Feb")
    expect(result).toContain("Jun")
    expect(result).toContain("2025")
    // Should use en-dash separator
    expect(result).toContain("\u2013")
  })

  it("formats a date range across different years", () => {
    // Dec 25, 2024 to Jan 5, 2025
    // Dec 25, 2024 = 1735084800, Jan 5, 2025 = 1736035200
    const result = formatDateRange(1735084800, 1736035200)
    expect(result).toContain("2024")
    expect(result).toContain("2025")
  })

  it("includes the year only on the end date when same year", () => {
    // Feb 9, 2025 to Jun 10, 2025
    const result = formatDateRange(1739059200, 1749513600)
    // "Feb 9 – Jun 10, 2025" — year appears once at the end
    expect(result).toMatch(/Feb 9\s*\u2013\s*Jun 10, 2025/)
  })
})
