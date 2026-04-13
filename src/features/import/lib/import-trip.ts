import { extractZip } from "./extract-zip"
import { parseTrip, scanTrips } from "./parse-trip"
import { collectPhotos } from "./collect-photos"
import { saveTrip, saveChapters, savePhoto, getPhotosByTrip, getPhotosByIds, deletePhotos, getAllTrips } from "@/stores/db"
import { writePhoto, deletePhotoFiles } from "@/stores/photo-storage"
import { ImportError, type ImportProgress, type ImportResult, type TripSummary } from "@/types/import"

const SIZE_WARNING_THRESHOLD_MB = 500

export interface ImportOptions {
  onProgress: (progress: ImportProgress) => void
  tripDirPath: string
}

export function shouldWarnAboutSize(file: File): number | null {
  const sizeMb = Math.round(file.size / (1024 * 1024))
  return sizeMb > SIZE_WARNING_THRESHOLD_MB ? sizeMb : null
}

/**
 * Scan a ZIP file for all valid trips and enrich with vault context.
 * Returns TripSummary[] sorted newest-first.
 */
export async function scanTripsFromFile(file: File): Promise<TripSummary[]> {
  const entries = await extractZip(file)
  const scanned = scanTrips(entries)

  const existingTrips = await getAllTrips()
  const existingIds = new Set(existingTrips.map((t) => t.id))

  return scanned.map((trip) => ({
    ...trip,
    alreadyImported: existingIds.has(trip.id),
  }))
}

export async function importTrip(
  file: File,
  { onProgress, tripDirPath }: ImportOptions
): Promise<ImportResult> {
  // Phase 1: Extract ZIP (10% of progress — fast)
  onProgress({ phase: "extracting", percent: 0, detail: "Extracting ZIP..." })

  const entries = await extractZip(file)

  onProgress({ phase: "extracting", percent: 5, detail: "Extracting ZIP..." })

  // Phase 2: Parse trip data (another 5% — fast)
  onProgress({ phase: "reading", percent: 8, detail: "Reading trip data..." })

  const { trip, chapters, coverPhotoS3Candidates } = parseTrip(entries, tripDirPath)

  onProgress({ phase: "reading", percent: 10, detail: "Reading trip data..." })

  // Collect photo entries before storing
  const photoEntries = collectPhotos(entries, tripDirPath, trip.id)

  // Remember existing photo IDs for cleanup after successful import
  const existingPhotoIds = await getPhotosByTrip(trip.id)

  // Phase 3: Store data (90% — photos are the slow part)
  // Save trip + chapters first (fast, uses put for upsert)
  trip.photoCount = photoEntries.length
  await saveTrip(trip)
  await saveChapters(chapters)

  const totalPhotos = photoEntries.length
  const newPhotoIds = new Set<string>()

  for (let i = 0; i < photoEntries.length; i++) {
    const entry = photoEntries[i]
    const photoId = `${entry.tripId}-${entry.chapterId}-${entry.filename}`
    newPhotoIds.add(photoId)

    try {
      const data = entry.data.slice()

      // Write binary data to OPFS
      await writePhoto(entry.tripId, entry.chapterId, entry.filename, data)

      // Write metadata to IndexedDB
      try {
        await savePhoto({
          id: photoId,
          tripId: entry.tripId,
          chapterId: entry.chapterId,
          filename: entry.filename,
        })
      } catch (err) {
        // Best-effort cleanup of the OPFS file we just wrote
        await deletePhotoFiles([{ tripId: entry.tripId, chapterId: entry.chapterId, filename: entry.filename }]).catch(() => {})
        throw err
      }
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "QuotaExceededError" ||
          err.message.includes("quota"))
      ) {
        throw new ImportError(
          "QUOTA_EXCEEDED",
          "Not enough storage space to import this trip"
        )
      }
      throw err
    }

    const percent = 10 + Math.round(((i + 1) / totalPhotos) * 90)
    onProgress({
      phase: "storing",
      percent,
      detail: `Importing photos\u2026 ${i + 1} of ${totalPhotos}`,
    })
  }

  // If no photos, jump to 100%
  if (totalPhotos === 0) {
    onProgress({ phase: "storing", percent: 100, detail: "Done" })
  }

  // Download cover photo from S3 — the export doesn't include it locally.
  // Try candidates in order (full-res first) since older full-res images may
  // be in S3 Glacier Deep Archive (returns 403 InvalidObjectState).
  for (const url of coverPhotoS3Candidates) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const blob = await res.blob()
      const data = new Uint8Array(await blob.arrayBuffer())
      const filename = "cover.jpg"
      await writePhoto(trip.id, "cover", filename, data)
      trip.coverPhotoId = `${trip.id}-cover-${filename}`
      await saveTrip(trip)
      break
    } catch {
      // Network error — try next candidate
    }
  }

  // Clean up orphaned photos from a previous import of this trip
  const orphanedIds = existingPhotoIds.filter((id) => !newPhotoIds.has(id))
  if (orphanedIds.length > 0) {
    // Fetch full metadata so we can delete OPFS files by path
    const orphanedPhotos = await getPhotosByIds(orphanedIds)
    await deletePhotoFiles(orphanedPhotos)
    await deletePhotos(orphanedIds)
  }

  return {
    tripName: trip.name,
    slug: trip.slug,
    chapterCount: chapters.length,
    photoCount: totalPhotos,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalKm: trip.totalKm,
  }
}
