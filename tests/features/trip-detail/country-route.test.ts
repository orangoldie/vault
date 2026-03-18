import { describe, it, expect } from "vitest"

import { getCountryRoute } from "@/features/trip-detail/lib/country-route"
import type { Chapter } from "@/types/trip"

function makeChapter(countryCode: string): Chapter {
  return {
    id: Math.random(),
    tripId: 1,
    displayName: "Test",
    description: null,
    slug: "test",
    startTime: 0,
    endTime: null,
    location: {
      name: "Test",
      detail: "",
      fullDetail: "",
      countryCode,
      lat: 0,
      lon: 0,
    },
    weatherCondition: null,
    weatherTemperature: null,
    uuid: "test",
  }
}

describe("getCountryRoute", () => {
  it("returns empty array for no chapters", () => {
    expect(getCountryRoute([])).toEqual([])
  })

  it("returns single country for one chapter", () => {
    expect(getCountryRoute([makeChapter("JP")])).toEqual(["JP"])
  })

  it("deduplicates countries preserving first-appearance order", () => {
    const chapters = [
      makeChapter("IL"),
      makeChapter("TH"),
      makeChapter("IL"),
      makeChapter("VN"),
      makeChapter("TH"),
    ]
    expect(getCountryRoute(chapters)).toEqual(["IL", "TH", "VN"])
  })

  it("skips chapters with empty country code", () => {
    const chapters = [
      makeChapter("IL"),
      makeChapter(""),
      makeChapter("TH"),
    ]
    expect(getCountryRoute(chapters)).toEqual(["IL", "TH"])
  })

  it("handles all chapters having empty country codes", () => {
    const chapters = [makeChapter(""), makeChapter("")]
    expect(getCountryRoute(chapters)).toEqual([])
  })
})
