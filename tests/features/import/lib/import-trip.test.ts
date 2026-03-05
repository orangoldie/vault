import { describe, it, expect, beforeEach, vi } from "vitest"
import "fake-indexeddb/auto"

import { shouldWarnAboutSize, scanTripsFromFile } from "@/features/import/lib/import-trip"
import { getTrip, getPhotosByTrip, resetDb, saveTrip, saveChapters, savePhoto } from "@/stores/db"
import type { ImportProgress } from "@/types/import"

// Mock extractZip to bypass jsdom File.arrayBuffer() issues
vi.mock("@/features/import/lib/extract-zip", () => ({
  extractZip: vi.fn(),
}))

// Mock OPFS photo storage
vi.mock("@/stores/photo-storage", () => ({
  writePhoto: vi.fn().mockResolvedValue(undefined),
  deletePhotoFiles: vi.fn().mockResolvedValue(undefined),
  deletePhotosByTrip: vi.fn().mockResolvedValue(undefined),
  resetPhotosRoot: vi.fn(),
}))

import { importTrip } from "@/features/import/lib/import-trip"
import { extractZip } from "@/features/import/lib/extract-zip"
import { writePhoto, deletePhotoFiles } from "@/stores/photo-storage"

const mockExtractZip = vi.mocked(extractZip)

function makeTripJsonString() {
  return JSON.stringify({
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
    all_steps: [
      {
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
      },
    ],
  })
}

function makeZipEntries(files: Record<string, string | Uint8Array>) {
  const encoder = new TextEncoder()
  const entries: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    entries[path] =
      typeof content === "string" ? encoder.encode(content) : content
  }
  return entries
}

beforeEach(() => {
  resetDb()
  indexedDB = new IDBFactory()
  vi.clearAllMocks()
})

describe("shouldWarnAboutSize", () => {
  it("returns null for files under 500 MB", () => {
    const file = new File(["x"], "test.zip")
    expect(shouldWarnAboutSize(file)).toBeNull()
  })

  it("returns size in MB for files over 500 MB", () => {
    const file = new File(["x"], "test.zip")
    Object.defineProperty(file, "size", { value: 600 * 1024 * 1024 })
    expect(shouldWarnAboutSize(file)).toBe(600)
  })
})

describe("importTrip", () => {
  it("imports a trip with metadata and chapters", async () => {
    mockExtractZip.mockResolvedValue(
      makeZipEntries({
        "trip/test-trip_1/trip.json": makeTripJsonString(),
      })
    )

    const file = new File(["zip"], "test.zip")
    const progressUpdates: ImportProgress[] = []
    const result = await importTrip(file, {
      onProgress: (p) => progressUpdates.push({ ...p }),
      tripDirPath: "trip/test-trip_1/",
    })

    expect(result.tripName).toBe("Test Trip")
    expect(result.chapterCount).toBe(1)
    expect(result.photoCount).toBe(0)

    const trip = await getTrip(1)
    expect(trip).toBeDefined()
    expect(trip?.name).toBe("Test Trip")
  })

  it("imports photos to OPFS and metadata to IndexedDB", async () => {
    const photoData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])

    const entries = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries["trip/test-trip_1/bangkok_100/photos/photo1.jpg.jpg"] = photoData
    entries["trip/test-trip_1/bangkok_100/photos/photo2.jpg.jpg"] = photoData
    mockExtractZip.mockResolvedValue(entries)

    const file = new File(["zip"], "test.zip")
    const progressUpdates: ImportProgress[] = []
    const result = await importTrip(file, {
      onProgress: (p) => progressUpdates.push({ ...p }),
      tripDirPath: "trip/test-trip_1/",
    })

    expect(result.photoCount).toBe(2)

    // Photo metadata is in IndexedDB
    const photoKeys = await getPhotosByTrip(1)
    expect(photoKeys).toHaveLength(2)

    // Photo binaries were written to OPFS
    expect(writePhoto).toHaveBeenCalledTimes(2)
    expect(writePhoto).toHaveBeenCalledWith(
      1,
      100,
      expect.stringContaining("photo"),
      expect.any(Uint8Array)
    )

    const storingUpdates = progressUpdates.filter((p) => p.phase === "storing")
    expect(storingUpdates.length).toBeGreaterThan(0)
  })

  it("throws when extractZip fails with INVALID_ZIP", async () => {
    const { ImportError } = await import("@/types/import")
    mockExtractZip.mockRejectedValue(
      new ImportError("INVALID_ZIP", "Failed to extract ZIP: invalid zip data")
    )

    const file = new File(["not a zip"], "test.zip")

    await expect(
      importTrip(file, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    ).rejects.toThrow("Failed to extract ZIP")
  })

  it("throws MISSING_TRIP_JSON when no trip.json in zip", async () => {
    mockExtractZip.mockResolvedValue(
      makeZipEntries({ "some/file.txt": "hello" })
    )

    const file = new File(["zip"], "test.zip")

    await expect(
      importTrip(file, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    ).rejects.toThrow("No trip.json found")
  })

  it("cleans up orphaned photos on re-import including OPFS files", async () => {
    const photoData = new Uint8Array([1, 2, 3])

    // First import with 2 photos
    const entries1 = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries1["trip/test-trip_1/bangkok_100/photos/photo1.jpg"] = photoData
    entries1["trip/test-trip_1/bangkok_100/photos/photo2.jpg"] = photoData
    mockExtractZip.mockResolvedValue(entries1)

    const file1 = new File(["zip"], "test.zip")
    await importTrip(file1, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    let keys = await getPhotosByTrip(1)
    expect(keys).toHaveLength(2)

    // Re-import with only 1 photo
    const entries2 = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries2["trip/test-trip_1/bangkok_100/photos/photo1.jpg"] = photoData
    mockExtractZip.mockResolvedValue(entries2)

    const file2 = new File(["zip"], "test.zip")
    await importTrip(file2, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    keys = await getPhotosByTrip(1)
    expect(keys).toHaveLength(1)
    expect(keys).toContain("1-100-photo1.jpg")

    // OPFS orphan cleanup was called
    expect(deletePhotoFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tripId: 1, chapterId: 100, filename: "photo2.jpg" }),
      ])
    )
  })

  it("throws QUOTA_EXCEEDED when OPFS write fails with quota error", async () => {
    const photoData = new Uint8Array([1, 2, 3])

    const entries = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries["trip/test-trip_1/bangkok_100/photos/photo1.jpg"] = photoData
    mockExtractZip.mockResolvedValue(entries)

    vi.mocked(writePhoto).mockRejectedValueOnce(
      new DOMException("Quota exceeded", "QuotaExceededError")
    )

    const file = new File(["zip"], "test.zip")

    await expect(
      importTrip(file, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    ).rejects.toThrow("Not enough storage space")
  })

  it("cleans up OPFS file when savePhoto fails after writePhoto succeeds", async () => {
    const photoData = new Uint8Array([1, 2, 3])

    const entries = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries["trip/test-trip_1/bangkok_100/photos/photo1.jpg"] = photoData
    mockExtractZip.mockResolvedValue(entries)

    // Make writePhoto succeed but then fail on the second call (savePhoto is real IndexedDB).
    // Instead, simulate the OPFS-then-IDB failure by making writePhoto throw on
    // a second invocation — but the real test target is the cleanup path.
    // We spy on savePhoto from db module to make it fail.
    const dbModule = await import("@/stores/db")
    const savePhotoSpy = vi.spyOn(dbModule, "savePhoto")
    savePhotoSpy.mockRejectedValueOnce(new Error("IndexedDB write failed"))

    const file = new File(["zip"], "test.zip")

    await expect(
      importTrip(file, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    ).rejects.toThrow("IndexedDB write failed")

    // Best-effort OPFS cleanup should have been attempted
    expect(deletePhotoFiles).toHaveBeenCalledWith([
      { tripId: 1, chapterId: 100, filename: "photo1.jpg" },
    ])

    savePhotoSpy.mockRestore()
  })

  it("throws QUOTA_EXCEEDED when error message contains 'quota'", async () => {
    const photoData = new Uint8Array([1, 2, 3])

    const entries = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries["trip/test-trip_1/bangkok_100/photos/photo1.jpg"] = photoData
    mockExtractZip.mockResolvedValue(entries)

    // Simulate a quota error via message (not name)
    vi.mocked(writePhoto).mockRejectedValueOnce(
      new DOMException("The quota has been exceeded", "UnknownError")
    )

    const file = new File(["zip"], "test.zip")

    await expect(
      importTrip(file, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    ).rejects.toThrow("Not enough storage space")
  })

  it("reports correct progress for import with no photos", async () => {
    mockExtractZip.mockResolvedValue(
      makeZipEntries({
        "trip/test-trip_1/trip.json": makeTripJsonString(),
      })
    )

    const file = new File(["zip"], "test.zip")
    const progressUpdates: ImportProgress[] = []
    await importTrip(file, {
      onProgress: (p) => progressUpdates.push({ ...p }),
      tripDirPath: "trip/test-trip_1/",
    })

    // Should reach 100% even with 0 photos
    const lastUpdate = progressUpdates[progressUpdates.length - 1]
    expect(lastUpdate.percent).toBe(100)
    expect(lastUpdate.phase).toBe("storing")
  })

  it("uses the specified tripDirPath for import", async () => {
    const encoder = new TextEncoder()
    const tripA = JSON.stringify({
      id: 1, name: "Trip A", slug: "trip-a", start_date: 1700000000, end_date: 1700500000,
      summary: "", cover_photo: null, step_count: 1, total_km: 0, uuid: "a",
      all_steps: [{ id: 100, trip_id: 1, display_name: "Ch A", description: null, slug: "ch-a",
        start_time: 1700000000, end_time: 1700100000, location: { id: 1, name: "A", detail: "A",
        full_detail: "A", country_code: "US", lat: 0, lon: 0, uuid: "l" }, weather_condition: null,
        weather_temperature: null, uuid: "c" }],
    })
    const tripB = JSON.stringify({
      id: 2, name: "Trip B", slug: "trip-b", start_date: 1800000000, end_date: 1800500000,
      summary: "", cover_photo: null, step_count: 1, total_km: 0, uuid: "b",
      all_steps: [{ id: 200, trip_id: 2, display_name: "Ch B", description: null, slug: "ch-b",
        start_time: 1800000000, end_time: 1800100000, location: { id: 2, name: "B", detail: "B",
        full_detail: "B", country_code: "US", lat: 0, lon: 0, uuid: "l2" }, weather_condition: null,
        weather_temperature: null, uuid: "c2" }],
    })

    mockExtractZip.mockResolvedValue({
      "trip/a_1/trip.json": encoder.encode(tripA),
      "trip/b_2/trip.json": encoder.encode(tripB),
    })

    const file = new File(["zip"], "test.zip")
    const result = await importTrip(file, { onProgress: vi.fn(), tripDirPath: "trip/b_2/" })

    expect(result.tripName).toBe("Trip B")
    const trip = await getTrip(2)
    expect(trip).toBeDefined()
    expect(trip?.name).toBe("Trip B")
  })

  it("preserves old data if import fails midway", async () => {
    // First successful import
    const entries1 = makeZipEntries({
      "trip/test-trip_1/trip.json": makeTripJsonString(),
    })
    entries1["trip/test-trip_1/bangkok_100/photos/photo1.jpg"] = new Uint8Array([1])
    mockExtractZip.mockResolvedValue(entries1)

    const file1 = new File(["zip"], "test.zip")
    await importTrip(file1, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })

    // Second import with invalid data (no chapters)
    const noStepsTrip = JSON.stringify({
      id: 1,
      name: "Test Trip",
      slug: "test-trip",
      start_date: 1700000000,
      end_date: 1700500000,
      summary: "",
      cover_photo: null,
      step_count: 0,
      total_km: 0,
      uuid: "trip-uuid",
      all_steps: [],
    })
    mockExtractZip.mockResolvedValue(
      makeZipEntries({ "trip/test-trip_1/trip.json": noStepsTrip })
    )

    const file2 = new File(["zip"], "test.zip")
    await expect(
      importTrip(file2, { onProgress: vi.fn(), tripDirPath: "trip/test-trip_1/" })
    ).rejects.toThrow()

    // Original trip should still be intact
    const trip = await getTrip(1)
    expect(trip).toBeDefined()
    expect(trip?.name).toBe("Test Trip")
  })
})

describe("scanTripsFromFile", () => {
  it("returns trip summaries with alreadyImported flag", async () => {
    const encoder = new TextEncoder()
    const tripA = JSON.stringify({
      id: 1, name: "Trip A", slug: "a", start_date: 1700000000, end_date: 1700500000,
      summary: "", cover_photo: null, step_count: 2, total_km: 0, uuid: "a",
      all_steps: [{ id: 100, trip_id: 1, display_name: "Ch", description: null, slug: "ch",
        start_time: 1700000000, end_time: 1700100000, location: { id: 1, name: "X", detail: "X",
        full_detail: "X", country_code: "US", lat: 0, lon: 0, uuid: "l" }, weather_condition: null,
        weather_temperature: null, uuid: "c" }],
    })
    const tripB = JSON.stringify({
      id: 2, name: "Trip B", slug: "b", start_date: 1800000000, end_date: 1800500000,
      summary: "", cover_photo: null, step_count: 1, total_km: 0, uuid: "b",
      all_steps: [{ id: 200, trip_id: 2, display_name: "Ch2", description: null, slug: "ch2",
        start_time: 1800000000, end_time: 1800100000, location: { id: 2, name: "Y", detail: "Y",
        full_detail: "Y", country_code: "US", lat: 0, lon: 0, uuid: "l2" }, weather_condition: null,
        weather_temperature: null, uuid: "c2" }],
    })

    mockExtractZip.mockResolvedValue({
      "trip/a_1/trip.json": encoder.encode(tripA),
      "trip/b_2/trip.json": encoder.encode(tripB),
    })

    // Pre-save trip 1 so it should be marked as alreadyImported
    await saveTrip({
      id: 1, name: "Trip A", slug: "a", startDate: 1700000000, endDate: 1700500000,
      summary: "", coverPhotoId: null, chapterCount: 2, photoCount: 0, totalKm: 0,
      uuid: "a", importedAt: Date.now(),
    })

    const file = new File(["zip"], "test.zip")
    const result = await scanTripsFromFile(file)

    expect(result).toHaveLength(2)
    // Sorted newest first
    expect(result[0].name).toBe("Trip B")
    expect(result[0].alreadyImported).toBe(false)
    expect(result[1].name).toBe("Trip A")
    expect(result[1].alreadyImported).toBe(true)
  })

  it("returns empty array when no valid trips found", async () => {
    const encoder = new TextEncoder()
    mockExtractZip.mockResolvedValue({
      "trip/bad_1/trip.json": encoder.encode("not json"),
    })

    const file = new File(["zip"], "test.zip")
    const result = await scanTripsFromFile(file)
    expect(result).toHaveLength(0)
  })

  it("propagates extraction errors", async () => {
    const { ImportError } = await import("@/types/import")
    mockExtractZip.mockRejectedValue(
      new ImportError("INVALID_ZIP", "Bad zip")
    )

    const file = new File(["zip"], "test.zip")
    await expect(scanTripsFromFile(file)).rejects.toThrow("Bad zip")
  })
})
