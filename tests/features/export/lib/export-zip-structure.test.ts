import { describe, it, expect, vi, beforeEach } from "vitest"
import { unzipSync } from "fflate"

import type { Trip, Chapter, Photo } from "@/types/trip"

// These mocks MUST be before the import of export-trip to prevent
// maplibre-gl from trying to initialize WebGL in jsdom.
// vi.mock is hoisted by vitest, so declaration order doesn't matter.
vi.mock("maplibre-gl", () => ({
  default: { addProtocol: vi.fn() },
  addProtocol: vi.fn(),
  setWorkerUrl: vi.fn(),
  Map: vi.fn(),
}))

vi.mock("pmtiles", () => ({
  Protocol: vi.fn().mockImplementation(() => ({ tile: vi.fn() })),
}))

vi.mock("@vis.gl/react-maplibre", () => ({
  Map: () => null,
  Marker: () => null,
  Source: () => null,
  Layer: () => null,
}))

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}))

const mockTrip: Trip = {
  id: 1,
  name: "Test Trip",
  slug: "test-trip",
  startDate: 1700000000,
  endDate: 1700500000,
  summary: "A test trip",
  coverPhotoId: "1-cover-cover.jpg",
  chapterCount: 1,
  photoCount: 2,
  totalKm: 100,
  uuid: "uuid-1",
  importedAt: 1700000000,
}

const mockChapter: Chapter = {
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
}

const mockPhotos: Photo[] = [
  { id: "p1", tripId: 1, chapterId: 10, filename: "img1.jpg" },
  { id: "p2", tripId: 1, chapterId: 10, filename: "img2.jpg" },
]

vi.mock("@/stores/db", () => {
  const trip = {
    id: 1, name: "Test Trip", slug: "test-trip", startDate: 1700000000,
    endDate: 1700500000, summary: "A test trip", coverPhotoId: "1-cover-cover.jpg",
    chapterCount: 1, photoCount: 2, totalKm: 100, uuid: "uuid-1", importedAt: 1700000000,
  }
  const chapter = {
    id: 10, tripId: 1, displayName: "Bangkok", description: "Great city",
    slug: "bangkok", startTime: 1700000000, endTime: 1700100000,
    location: { name: "Bangkok", detail: "Thailand", fullDetail: "Bangkok, Thailand",
      countryCode: "TH", lat: 13.7563, lon: 100.5018 },
    weatherCondition: null, weatherTemperature: null, uuid: "uuid-ch-10",
  }
  const photos = [
    { id: "p1", tripId: 1, chapterId: 10, filename: "img1.jpg" },
    { id: "p2", tripId: 1, chapterId: 10, filename: "img2.jpg" },
  ]
  return {
    getTrip: vi.fn().mockResolvedValue(trip),
    getChaptersByTrip: vi.fn().mockResolvedValue([chapter]),
    getPhotosByChapter: vi.fn().mockResolvedValue(photos),
  }
})

vi.mock("@/stores/photo-storage", () => ({
  readPhoto: vi.fn().mockImplementation(() => {
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    return Promise.resolve(new Blob([data], { type: "image/jpeg" }))
  }),
}))

vi.mock("@/features/export/lib/map-asset-manifest", () => ({
  MAP_FONT_PATHS: ["map-assets/fonts/Noto Sans Regular/0-255.pbf"],
  MAP_SPRITE_PATHS: ["map-assets/sprites/light.json"],
  PMTILES_PATH: "textures/globe.pmtiles",
}))

// Mock fetch for local assets
const originalFetch = globalThis.fetch
vi.stubGlobal(
  "fetch",
  vi.fn().mockImplementation(async (url: string, _opts?: RequestInit) => {
    if (url === "/export/fonts/manifest.json") {
      return {
        ok: true,
        json: async () => ["cormorant.css", "cormorant-0.woff2", "outfit.css", "outfit-0.woff2"],
      }
    }
    // Text assets
    if (url.endsWith(".js") || url.endsWith(".css")) {
      return {
        ok: true,
        text: async () => "/* mock content */",
        arrayBuffer: async () => new TextEncoder().encode("/* mock */").buffer,
      }
    }
    // Binary assets
    return {
      ok: true,
      arrayBuffer: async () => new Uint8Array([0, 1, 2, 3]).buffer,
    }
  })
)

// Capture the blob passed to createObjectURL for the download
let capturedBlob: Blob | null = null
const realCreateObjectURL = URL.createObjectURL
vi.spyOn(URL, "createObjectURL").mockImplementation((obj: Blob | MediaSource) => {
  if (obj instanceof Blob) capturedBlob = obj
  return "blob:mock"
})
vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})

// Mock the download anchor
const mockClick = vi.fn()
const originalCreateElement = document.createElement.bind(document)
vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
  if (tag === "a") {
    const el = originalCreateElement("a")
    el.click = mockClick
    return el
  }
  return originalCreateElement(tag)
})

import {
  exportTrip,
  type ExportProgress,
} from "@/features/export/lib/export-trip"

describe("exportTrip ZIP structure", () => {
  let progressUpdates: ExportProgress[]
  let zipData: Uint8Array | null

  beforeEach(async () => {
    progressUpdates = []
    zipData = null
    capturedBlob = null

    await exportTrip({
      tripId: 1,
      onProgress: (p) => progressUpdates.push({ ...p }),
    })

    if (capturedBlob) {
      const buffer = await capturedBlob.arrayBuffer()
      zipData = new Uint8Array(buffer)
    }
  })

  it("produces a valid ZIP file", () => {
    expect(zipData).not.toBeNull()
    const files = unzipSync(zipData!)
    expect(Object.keys(files).length).toBeGreaterThan(0)
  })

  it("contains index.html with embedded trip data", () => {
    const files = unzipSync(zipData!)
    expect(files["index.html"]).toBeDefined()

    const html = new TextDecoder().decode(files["index.html"])
    expect(html).toContain("<!DOCTYPE html>")
    expect(html).toContain("Test Trip")
    expect(html).toContain("__VAULT_DATA__")
  })

  it("contains viewer bundle", () => {
    const files = unzipSync(zipData!)
    expect(files["assets/viewer.js"]).toBeDefined()
    expect(files["assets/viewer.css"]).toBeDefined()
  })

  it("contains map asset scripts", () => {
    const files = unzipSync(zipData!)
    expect(files["assets/globe-data.js"]).toBeDefined()
    expect(files["assets/map-fonts.js"]).toBeDefined()
    expect(files["assets/map-sprites.js"]).toBeDefined()
    expect(files["assets/maplibre-worker.js"]).toBeDefined()
  })

  it("contains photo files", () => {
    const files = unzipSync(zipData!)
    expect(files["photos/10/img1.jpg"]).toBeDefined()
    expect(files["photos/10/img2.jpg"]).toBeDefined()
  })

  it("contains cover photo", () => {
    const files = unzipSync(zipData!)
    expect(files["photos/cover/cover.jpg"]).toBeDefined()
  })

  it("contains display font files", () => {
    const files = unzipSync(zipData!)
    expect(files["fonts/cormorant.css"]).toBeDefined()
    expect(files["fonts/cormorant-0.woff2"]).toBeDefined()
  })

  it("contains data/trip.json for power users", () => {
    const files = unzipSync(zipData!)
    expect(files["data/trip.json"]).toBeDefined()

    const json = JSON.parse(new TextDecoder().decode(files["data/trip.json"]))
    expect(json.trip.name).toBe("Test Trip")
    expect(json.chapters).toHaveLength(1)
    expect(json.photos).toHaveLength(2)
  })

  it("all files referenced in HTML exist in the ZIP", () => {
    const files = unzipSync(zipData!)
    const html = new TextDecoder().decode(files["index.html"])

    const refs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map(
      (m) => m[1]
    )
    expect(refs.length).toBeGreaterThan(0)

    for (const ref of refs) {
      expect(files[ref], `missing file: ${ref}`).toBeDefined()
    }
  })

  it("reports progress through all phases ending in complete", () => {
    const phases = progressUpdates.map((p) => p.phase)
    expect(phases).toContain("preparing")
    expect(phases).toContain("map-assets")
    expect(phases).toContain("archiving")
    expect(phases).toContain("complete")
  })

  it("reports file size on completion", () => {
    const complete = progressUpdates.find((p) => p.phase === "complete")
    expect(complete).toBeDefined()
    expect(complete!.fileSize).toBeGreaterThan(0)
  })

  it("triggers a download", () => {
    expect(mockClick).toHaveBeenCalled()
  })
})
