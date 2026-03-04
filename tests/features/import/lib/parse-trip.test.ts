import { describe, it, expect } from "vitest"

import { parseTrip } from "@/features/import/lib/parse-trip"
import type { ZipEntries } from "@/features/import/lib/extract-zip"
import type { RawTrip, RawStep } from "@/types/travel-export"

function makeRawStep(overrides: Partial<RawStep> = {}): RawStep {
  return {
    id: 100,
    trip_id: 1,
    display_name: "Bangkok",
    description: null,
    slug: "bangkok",
    start_time: 1700000000,
    end_time: 1700100000,
    location: {
      id: 1,
      name: "Bangkok",
      detail: "Thailand",
      full_detail: "Thailand",
      country_code: "TH",
      lat: 13.7,
      lon: 100.5,
      uuid: "loc-uuid",
    },
    weather_condition: "sunny",
    weather_temperature: 30,
    uuid: "chapter-uuid",
    ...overrides,
  }
}

function makeRawTrip(overrides: Partial<RawTrip> = {}): RawTrip {
  return {
    id: 1,
    name: "Test Trip",
    slug: "test-trip",
    start_date: 1700000000,
    end_date: 1700500000,
    summary: "A summary",
    cover_photo: null,
    step_count: 1,
    total_km: 100,
    uuid: "trip-uuid",
    all_steps: [makeRawStep()],
    ...overrides,
  }
}

function makeEntries(tripPath: string, tripData: RawTrip): ZipEntries {
  const encoder = new TextEncoder()
  return {
    [`${tripPath}trip.json`]: encoder.encode(JSON.stringify(tripData)),
  }
}

describe("parseTrip", () => {
  it("parses a valid trip", () => {
    const raw = makeRawTrip()
    const entries = makeEntries("trip/test-trip_1/", raw)
    const result = parseTrip(entries)

    expect(result.trip.id).toBe(1)
    expect(result.trip.name).toBe("Test Trip")
    expect(result.trip.slug).toBe("test-trip")
    expect(result.trip.startDate).toBe(1700000000)
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].displayName).toBe("Bangkok")
    expect(result.tripDirPath).toBe("trip/test-trip_1/")
  })

  it("throws MISSING_TRIP_JSON when no trip.json found", () => {
    const entries: ZipEntries = {
      "some/other/file.txt": new Uint8Array(0),
    }
    expect(() => parseTrip(entries)).toThrow("No trip.json found")
  })

  it("throws MALFORMED_JSON for invalid JSON", () => {
    const encoder = new TextEncoder()
    const entries: ZipEntries = {
      "trip/test_1/trip.json": encoder.encode("not valid json{{{"),
    }
    expect(() => parseTrip(entries)).toThrow("invalid JSON")
  })

  it("throws EMPTY_TRIP when trip has no chapters", () => {
    const raw = makeRawTrip({ all_steps: [] })
    const entries = makeEntries("trip/test_1/", raw)
    expect(() => parseTrip(entries)).toThrow("no chapters")
  })

  it("selects trip with earliest start_date when multiple trips exist", () => {
    const encoder = new TextEncoder()
    const tripA = makeRawTrip({ id: 1, name: "Later Trip", start_date: 1800000000 })
    const tripB = makeRawTrip({ id: 2, name: "Earlier Trip", start_date: 1700000000 })

    const entries: ZipEntries = {
      "trip/later_1/trip.json": encoder.encode(JSON.stringify(tripA)),
      "trip/earlier_2/trip.json": encoder.encode(JSON.stringify(tripB)),
    }

    const result = parseTrip(entries)
    expect(result.trip.name).toBe("Earlier Trip")
  })

  it("sanitizes HTML from text fields", () => {
    const raw = makeRawTrip({
      name: '<script>alert("xss")</script>My Trip',
      summary: "Hello <b>world</b>",
      all_steps: [
        makeRawStep({
          display_name: '<img src=x onerror=alert(1)>Chapter',
          description: "Normal <em>text</em>",
        }),
      ],
    })

    const entries = makeEntries("trip/test_1/", raw)
    const result = parseTrip(entries)

    expect(result.trip.name).toBe('alert("xss")My Trip')
    expect(result.trip.summary).toBe("Hello world")
    expect(result.chapters[0].displayName).toBe("Chapter")
    expect(result.chapters[0].description).toBe("Normal text")
  })

  it("handles user_data/ prefix in path", () => {
    const raw = makeRawTrip()
    const encoder = new TextEncoder()
    const entries: ZipEntries = {
      "user_data/trip/test_1/trip.json": encoder.encode(JSON.stringify(raw)),
    }

    // The path pattern matches trip/<slug>/trip.json anywhere in the path
    const result = parseTrip(entries)
    expect(result.trip.id).toBe(1)
  })

  it("handles null location gracefully", () => {
    const raw = makeRawTrip({
      all_steps: [
        makeRawStep({
          location: undefined as unknown as RawStep["location"],
        }),
      ],
    })

    const entries = makeEntries("trip/test_1/", raw)
    const result = parseTrip(entries)

    expect(result.chapters[0].location.name).toBe("")
    expect(result.chapters[0].location.lat).toBe(0)
  })
})
