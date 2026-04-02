import { describe, it, expect } from "vitest"

import { buildHtml } from "@/features/export-web/lib/build-html"
import type { Trip, Chapter, Photo } from "@/types/trip"

function makeTripFixture(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 1,
    name: "Test Trip",
    slug: "test-trip",
    startDate: 1700000000,
    endDate: 1700500000,
    summary: "A test trip",
    coverPhotoId: null,
    chapterCount: 1,
    photoCount: 2,
    totalKm: 100,
    uuid: "uuid-1",
    importedAt: 1700000000,
    ...overrides,
  }
}

function makeChapterFixture(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 10,
    tripId: 1,
    displayName: "Bangkok",
    description: "Great city",
    slug: "bangkok",
    startTime: 1700000000,
    endTime: 1700100000,
    location: {
      name: "Bangkok",
      detail: "Thailand",
      fullDetail: "Bangkok, Thailand",
      countryCode: "TH",
      lat: 13.7563,
      lon: 100.5018,
    },
    weatherCondition: null,
    weatherTemperature: null,
    uuid: "uuid-ch-10",
    ...overrides,
  }
}

function makePhotoFixture(overrides: Partial<Photo> = {}): Photo {
  return {
    id: "photo-1",
    tripId: 1,
    chapterId: 10,
    filename: "img001.jpg",
    ...overrides,
  }
}

describe("buildHtml", () => {
  const trip = makeTripFixture()
  const chapters = [makeChapterFixture()]
  const photos = [makePhotoFixture()]

  it("produces valid HTML with doctype", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toMatch(/^<!DOCTYPE html>/)
  })

  it("includes the trip name in the title", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain("<title>Test Trip — Journey Vault</title>")
  })

  it("escapes HTML entities in the title tag", () => {
    const html = buildHtml({
      trip: makeTripFixture({ name: "A <script>alert('xss')</script> Trip" }),
      chapters,
      photos,
      coverPhotoPath: null,
    })
    // The <title> should have escaped angle brackets
    expect(html).toContain(
      "<title>A &lt;script&gt;alert('xss')&lt;/script&gt; Trip"
    )
  })

  it("embeds trip data in __VAULT_DATA__", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain("window.__VAULT_DATA__")
    expect(html).toContain('"name":"Test Trip"')
  })

  it("includes export photo paths in the embedded data", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain("./photos/10/img001.jpg")
  })

  it("sets cover photo path when provided", () => {
    const html = buildHtml({
      trip,
      chapters,
      photos,
      coverPhotoPath: "photos/cover/cover.jpg",
    })
    expect(html).toContain("photos/cover/cover.jpg")
  })

  it("includes font CSS links", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain('./fonts/cormorant.css')
    expect(html).toContain('./fonts/outfit.css')
  })

  it("sets CSS variables for font families", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain("--font-display")
    expect(html).toContain("--font-body")
  })

  it("includes body classes for font and antialiasing", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain('class="font-sans antialiased"')
  })

  it("includes script tags for assets and viewer", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain('src="./assets/viewer.js"')
    expect(html).toContain('href="./assets/viewer.css"')
    expect(html).toContain('src="./assets/globe-data.js"')
    expect(html).toContain('src="./assets/map-fonts.js"')
    expect(html).toContain('src="./assets/map-sprites.js"')
    expect(html).toContain('src="./assets/maplibre-worker.js"')
  })

  it("includes a noscript fallback", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain("<noscript>")
  })

  it("includes vault-export-version meta tag", () => {
    const html = buildHtml({ trip, chapters, photos, coverPhotoPath: null })
    expect(html).toContain('name="vault-export-version"')
  })
})
