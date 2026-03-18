import { describe, it, expect, vi, afterEach } from "vitest"

import {
  formatDateRangeEditorial,
  formatTimeAgo,
  getTripDurationDays,
} from "@/lib/format-date"

describe("formatDateRangeEditorial", () => {
  it("shows single month when start and end are in the same month", () => {
    // Jan 5, 2024 = 1704412800, Jan 20, 2024 = 1705708800
    expect(formatDateRangeEditorial(1704412800, 1705708800)).toBe("January 2024")
  })

  it("shows month range when same year, different months", () => {
    // Jan 5, 2024 = 1704412800, Mar 15, 2024 = 1710460800
    expect(formatDateRangeEditorial(1704412800, 1710460800)).toBe(
      "January – March 2024"
    )
  })

  it("shows cross-year range with both years", () => {
    // Dec 1, 2023 = 1701388800, Feb 15, 2024 = 1707955200
    expect(formatDateRangeEditorial(1701388800, 1707955200)).toBe(
      "December 2023 – February 2024"
    )
  })
})

describe("formatTimeAgo", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns null for trips less than 6 months old", () => {
    // Set "now" to March 16, 2026
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"))

    // Trip ended Jan 1, 2026 (less than 3 months ago)
    const jan2026 = Math.floor(new Date("2026-01-01").getTime() / 1000)
    expect(formatTimeAgo(jan2026)).toBeNull()
  })

  it("returns months for trips 6–11 months old", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"))

    // Trip ended Aug 1, 2025 (~7 months ago)
    const aug2025 = Math.floor(new Date("2025-08-01").getTime() / 1000)
    const result = formatTimeAgo(aug2025)
    expect(result).not.toBeNull()
    expect(result).toContain("month")
  })

  it("returns years for trips 12+ months old", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"))

    // Trip ended Jan 1, 2024 (~2 years ago)
    const jan2024 = Math.floor(new Date("2024-01-01").getTime() / 1000)
    const result = formatTimeAgo(jan2024)
    expect(result).not.toBeNull()
    expect(result).toContain("year")
  })

  it("returns null for future dates", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"))

    const future = Math.floor(new Date("2027-01-01").getTime() / 1000)
    expect(formatTimeAgo(future)).toBeNull()
  })
})

describe("getTripDurationDays", () => {
  it("returns 1 for a same-day trip", () => {
    // Jan 5, 2024 08:00 = 1704441600, Jan 5, 2024 20:00 = 1704484800
    expect(getTripDurationDays(1704441600, 1704484800)).toBe(1)
  })

  it("returns 3 for a trip spanning Jan 1–3", () => {
    // Jan 1, 2024 10:00 = 1704103200, Jan 3, 2024 15:00 = 1704294000
    expect(getTripDurationDays(1704103200, 1704294000)).toBe(3)
  })

  it("counts calendar days, not 24h blocks", () => {
    // Jan 1, 2024 12:00 UTC = 1704106800, Jan 2, 2024 12:00 UTC = 1704193200
    // Even though it's exactly 24h, it spans 2 calendar days
    expect(getTripDurationDays(1704106800, 1704193200)).toBe(2)
  })
})
