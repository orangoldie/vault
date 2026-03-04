import { describe, it, expect, beforeEach, vi } from "vitest"
import "fake-indexeddb/auto"

// Mock OPFS cleanup called by deleteTrip
vi.mock("@/stores/photo-storage", () => ({
  deletePhotosByTrip: vi.fn().mockResolvedValue(undefined),
}))

import {
  saveTrip,
  saveChapters,
  savePhoto,
  getTrip,
  getAllTrips,
  getChaptersByTrip,
  getPhotosByTrip,
  getPhotosByIds,
  deleteTrip,
  deletePhotos,
  resetDb,
} from "@/stores/db"
import { deletePhotosByTrip } from "@/stores/photo-storage"
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
    chapterCount: 2,
    photoCount: 0,
    totalKm: 100,
    uuid: "uuid-trip-1",
    importedAt: Date.now(),
    ...overrides,
  }
}

function makeChapterFixture(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 100,
    tripId: 1,
    displayName: "Chapter 1",
    description: null,
    slug: "chapter-1",
    startTime: 1700000000,
    endTime: 1700100000,
    location: {
      name: "Bangkok",
      detail: "Thailand",
      fullDetail: "Thailand",
      countryCode: "TH",
      lat: 13.7,
      lon: 100.5,
    },
    weatherCondition: "sunny",
    weatherTemperature: 30,
    uuid: "uuid-chapter-1",
    ...overrides,
  }
}

function makePhotoFixture(overrides: Partial<Photo> = {}): Photo {
  return {
    id: "1-100-photo.jpg",
    tripId: 1,
    chapterId: 100,
    filename: "photo.jpg",
    ...overrides,
  }
}

// Reset the IndexedDB database between tests
beforeEach(() => {
  resetDb()
  // Clear all indexedDB databases
  indexedDB = new IDBFactory()
  vi.clearAllMocks()
})

describe("db", () => {
  it("saves and retrieves a trip", async () => {
    const trip = makeTripFixture()
    await saveTrip(trip)
    const retrieved = await getTrip(1)
    expect(retrieved).toEqual(trip)
  })

  it("returns undefined for non-existent trip", async () => {
    const retrieved = await getTrip(999)
    expect(retrieved).toBeUndefined()
  })

  it("gets all trips", async () => {
    await saveTrip(makeTripFixture({ id: 1, name: "Trip 1" }))
    await saveTrip(makeTripFixture({ id: 2, name: "Trip 2" }))
    const trips = await getAllTrips()
    expect(trips).toHaveLength(2)
  })

  it("saves and retrieves chapters", async () => {
    const chapters = [
      makeChapterFixture({ id: 100 }),
      makeChapterFixture({ id: 101, displayName: "Chapter 2" }),
    ]
    await saveChapters(chapters)

    const retrieved = await getChaptersByTrip(1)
    expect(retrieved).toHaveLength(2)
    expect(retrieved.map((s) => s.displayName)).toContain("Chapter 1")
    expect(retrieved.map((s) => s.displayName)).toContain("Chapter 2")
  })

  it("saves a photo and retrieves photo keys by trip", async () => {
    await savePhoto(makePhotoFixture({ id: "1-100-a.jpg" }))
    await savePhoto(makePhotoFixture({ id: "1-100-b.jpg", filename: "b.jpg" }))
    const keys = await getPhotosByTrip(1)
    expect(keys).toHaveLength(2)
    expect(keys).toContain("1-100-a.jpg")
    expect(keys).toContain("1-100-b.jpg")
  })

  it("upserts trip on save (put)", async () => {
    await saveTrip(makeTripFixture({ name: "Original" }))
    await saveTrip(makeTripFixture({ name: "Updated" }))
    const trip = await getTrip(1)
    expect(trip?.name).toBe("Updated")
  })

  it("deletes a trip with all chapters, photos, and OPFS files", async () => {
    await saveTrip(makeTripFixture())
    await saveChapters([makeChapterFixture()])
    await savePhoto(makePhotoFixture())

    await deleteTrip(1)

    const trip = await getTrip(1)
    expect(trip).toBeUndefined()
    const photos = await getPhotosByTrip(1)
    expect(photos).toHaveLength(0)
    expect(deletePhotosByTrip).toHaveBeenCalledWith(1)
  })

  it("deletes specific photos by ID", async () => {
    await savePhoto(makePhotoFixture({ id: "1-100-a.jpg" }))
    await savePhoto(makePhotoFixture({ id: "1-100-b.jpg" }))

    await deletePhotos(["1-100-a.jpg"])

    const keys = await getPhotosByTrip(1)
    expect(keys).toHaveLength(1)
    expect(keys).toContain("1-100-b.jpg")
  })

  it("handles empty deletePhotos gracefully", async () => {
    await expect(deletePhotos([])).resolves.toBeUndefined()
  })

  it("fetches photos by IDs", async () => {
    await savePhoto(makePhotoFixture({ id: "1-100-a.jpg", filename: "a.jpg" }))
    await savePhoto(makePhotoFixture({ id: "1-100-b.jpg", filename: "b.jpg" }))

    const photos = await getPhotosByIds(["1-100-a.jpg", "1-100-b.jpg"])
    expect(photos).toHaveLength(2)
    expect(photos.map((p) => p.filename)).toContain("a.jpg")
    expect(photos.map((p) => p.filename)).toContain("b.jpg")
  })

  it("returns empty array for getPhotosByIds with empty input", async () => {
    const photos = await getPhotosByIds([])
    expect(photos).toEqual([])
  })

  it("skips non-existent IDs in getPhotosByIds", async () => {
    await savePhoto(makePhotoFixture({ id: "1-100-a.jpg" }))
    const photos = await getPhotosByIds(["1-100-a.jpg", "1-100-missing.jpg"])
    expect(photos).toHaveLength(1)
  })

  it("stores photo metadata without a blob field", async () => {
    const photo = makePhotoFixture()
    await savePhoto(photo)

    const photos = await getPhotosByIds([photo.id])
    expect(photos).toHaveLength(1)
    expect(photos[0]).toEqual({
      id: photo.id,
      tripId: photo.tripId,
      chapterId: photo.chapterId,
      filename: photo.filename,
    })
    expect(photos[0]).not.toHaveProperty("blob")
  })

  it("deletes trip chapters when deleting a trip", async () => {
    await saveTrip(makeTripFixture())
    await saveChapters([
      makeChapterFixture({ id: 100 }),
      makeChapterFixture({ id: 101, displayName: "Chapter 2" }),
    ])

    await deleteTrip(1)

    const chapters = await getChaptersByTrip(1)
    expect(chapters).toHaveLength(0)
  })
})
