import { describe, it, expect } from "vitest"

import { collectPhotos } from "@/features/import/lib/collect-photos"
import type { ZipEntries } from "@/features/import/lib/extract-zip"

describe("collectPhotos", () => {
  it("collects photos from chapter directories", () => {
    const entries: ZipEntries = {
      "trip/test_1/bangkok_100/photos/photo1.jpg.jpg": new Uint8Array([1, 2, 3]),
      "trip/test_1/bangkok_100/photos/photo2.jpg.jpg": new Uint8Array([4, 5, 6]),
      "trip/test_1/chiang-mai_101/photos/photo3.jpg.jpg": new Uint8Array([7, 8, 9]),
    }

    const photos = collectPhotos(entries, "trip/test_1/", 1)

    expect(photos).toHaveLength(3)
    expect(photos[0].chapterId).toBe(100)
    expect(photos[0].filename).toBe("photo1.jpg.jpg")
    expect(photos[2].chapterId).toBe(101)
  })

  it("skips non-photo entries", () => {
    const entries: ZipEntries = {
      "trip/test_1/trip.json": new Uint8Array([1]),
      "trip/test_1/locations.json": new Uint8Array([2]),
      "trip/test_1/bangkok_100/videos/video.mp4": new Uint8Array([3]),
      "trip/test_1/bangkok_100/photos/photo.jpg": new Uint8Array([4]),
    }

    const photos = collectPhotos(entries, "trip/test_1/", 1)

    expect(photos).toHaveLength(1)
    expect(photos[0].filename).toBe("photo.jpg")
  })

  it("skips entries outside the trip directory", () => {
    const entries: ZipEntries = {
      "trip/other_2/bangkok_200/photos/photo.jpg": new Uint8Array([1]),
      "trip/test_1/bangkok_100/photos/photo.jpg": new Uint8Array([2]),
    }

    const photos = collectPhotos(entries, "trip/test_1/", 1)

    expect(photos).toHaveLength(1)
    expect(photos[0].tripId).toBe(1)
  })

  it("returns empty array when no photos exist", () => {
    const entries: ZipEntries = {
      "trip/test_1/trip.json": new Uint8Array([1]),
    }

    const photos = collectPhotos(entries, "trip/test_1/", 1)
    expect(photos).toHaveLength(0)
  })

  it("skips empty directory entries", () => {
    const entries: ZipEntries = {
      "trip/test_1/bangkok_100/photos/": new Uint8Array(0),
      "trip/test_1/bangkok_100/photos/photo.jpg": new Uint8Array([1]),
    }

    const photos = collectPhotos(entries, "trip/test_1/", 1)
    expect(photos).toHaveLength(1)
  })
})
