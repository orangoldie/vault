import { describe, it, expect, beforeEach, vi } from "vitest"
import "fake-indexeddb/auto"

vi.mock("@/stores/photo-storage", () => ({
  deletePhotosByTrip: vi.fn().mockResolvedValue(undefined),
}))

import {
  savePhoto,
  getPhotosByChapter,
  getPhotoCountsByTrip,
  resetDb,
} from "@/stores/db"
import type { Photo } from "@/types/trip"

function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: "1-100-photo.jpg",
    tripId: 1,
    chapterId: 100,
    filename: "photo.jpg",
    ...overrides,
  }
}

beforeEach(() => {
  resetDb()
  indexedDB = new IDBFactory()
})

describe("getPhotosByChapter", () => {
  it("returns photos for a specific chapter", async () => {
    await savePhoto(makePhoto({ id: "1-100-a.jpg", chapterId: 100 }))
    await savePhoto(makePhoto({ id: "1-100-b.jpg", chapterId: 100, filename: "b.jpg" }))
    await savePhoto(makePhoto({ id: "1-200-c.jpg", chapterId: 200, filename: "c.jpg" }))

    const photos = await getPhotosByChapter(100)
    expect(photos).toHaveLength(2)
    expect(photos.map((p) => p.id)).toContain("1-100-a.jpg")
    expect(photos.map((p) => p.id)).toContain("1-100-b.jpg")
  })

  it("returns empty array when no photos exist for a chapter", async () => {
    const photos = await getPhotosByChapter(999)
    expect(photos).toEqual([])
  })
})

describe("getPhotoCountsByTrip", () => {
  it("returns counts grouped by chapterId", async () => {
    await savePhoto(makePhoto({ id: "1-100-a.jpg", tripId: 1, chapterId: 100 }))
    await savePhoto(makePhoto({ id: "1-100-b.jpg", tripId: 1, chapterId: 100, filename: "b.jpg" }))
    await savePhoto(makePhoto({ id: "1-200-c.jpg", tripId: 1, chapterId: 200, filename: "c.jpg" }))

    const counts = await getPhotoCountsByTrip(1)
    expect(counts.get(100)).toBe(2)
    expect(counts.get(200)).toBe(1)
  })

  it("returns empty map when trip has no photos", async () => {
    const counts = await getPhotoCountsByTrip(999)
    expect(counts.size).toBe(0)
  })
})
