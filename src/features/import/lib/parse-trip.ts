import type { RawTrip } from "@/types/travel-export"
import type { Trip, Chapter } from "@/types/trip"
import { ImportError, type ScannedTrip } from "@/types/import"
import type { ZipEntries } from "./extract-zip"

/** Strip HTML tags from text to prevent XSS */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return ""
  return text.replace(/<[^>]*>/g, "")
}

/** Find all trip.json paths in the ZIP without parsing them */
function findTripJsonPaths(entries: ZipEntries): { path: string; entryKey: string }[] {
  const results: { path: string; entryKey: string }[] = []

  for (const entryKey of Object.keys(entries)) {
    // Match patterns like trip/<slug>_<id>/trip.json or user_data/trip/<slug>_<id>/trip.json
    const match = entryKey.match(/(?:^|\/)(trip\/[^/]+\/)trip\.json$/)
    if (match) {
      results.push({ path: match[1], entryKey })
    }
  }

  return results
}

/**
 * Scan all trip directories in the ZIP and return lightweight metadata.
 * Silently skips directories with invalid or unreadable data.
 * Returns trips sorted newest-first (descending by start date).
 */
export function scanTrips(entries: ZipEntries): ScannedTrip[] {
  const decoder = new TextDecoder()
  const tripPaths = findTripJsonPaths(entries)
  const results: ScannedTrip[] = []

  for (const { path, entryKey } of tripPaths) {
    try {
      const json = decoder.decode(entries[entryKey])
      const raw = JSON.parse(json) as RawTrip

      if (!raw.id || !raw.start_date || !raw.end_date || !raw.all_steps || raw.all_steps.length === 0) continue

      results.push({
        id: raw.id,
        name: sanitizeText(raw.name),
        startDate: raw.start_date,
        endDate: raw.end_date,
        chapterCount: raw.step_count ?? raw.all_steps.length,
        tripDirPath: path,
      })
    } catch {
      // Silently skip directories with invalid data
    }
  }

  // Sort newest-first (descending by start date)
  results.sort((a, b) => b.startDate - a.startDate)

  return results
}

export interface ParsedTripData {
  trip: Trip
  chapters: Chapter[]
  tripDirPath: string
  /** S3 URLs to try in order for the cover photo (full-res may be in Glacier). */
  coverPhotoS3Candidates: string[]
}

export function parseTrip(entries: ZipEntries, tripDirPath: string): ParsedTripData {
  const tripJsonPaths = findTripJsonPaths(entries)
  const match = tripJsonPaths.find((p) => p.path === tripDirPath)

  if (!match) {
    throw new ImportError("MISSING_TRIP_JSON", "No trip.json found in ZIP")
  }

  let raw: RawTrip
  try {
    const decoder = new TextDecoder()
    const json = decoder.decode(entries[match.entryKey])
    raw = JSON.parse(json) as RawTrip
  } catch {
    throw new ImportError("MALFORMED_JSON", "trip.json contains invalid JSON")
  }

  if (!raw.all_steps || raw.all_steps.length === 0) {
    throw new ImportError("EMPTY_TRIP", "This trip has no chapters")
  }

  // Build a prioritised list of URLs to try: full-res first, then thumbnails.
  // Full-res images may be in S3 Glacier Deep Archive (403 InvalidObjectState).
  const coverPhotoS3Candidates: string[] = []
  if (raw.cover_photo?.path) coverPhotoS3Candidates.push(raw.cover_photo.path)
  if (raw.cover_photo?.large_thumbnail_path) coverPhotoS3Candidates.push(raw.cover_photo.large_thumbnail_path)
  if (raw.cover_photo?.small_thumbnail_path) coverPhotoS3Candidates.push(raw.cover_photo.small_thumbnail_path)

  const trip: Trip = {
    id: raw.id,
    name: sanitizeText(raw.name),
    slug: raw.slug,
    startDate: raw.start_date,
    endDate: raw.end_date,
    summary: sanitizeText(raw.summary),
    coverPhotoId: null,
    chapterCount: raw.step_count ?? raw.all_steps.length,
    photoCount: 0,
    totalKm: raw.total_km ?? 0,
    uuid: raw.uuid,
    importedAt: Date.now(),
  }

  const chapters: Chapter[] = raw.all_steps.map((rawStep) => ({
    id: rawStep.id,
    tripId: raw.id,
    displayName: sanitizeText(rawStep.display_name),
    description: rawStep.description ? sanitizeText(rawStep.description) : null,
    slug: rawStep.slug,
    startTime: rawStep.start_time,
    endTime: rawStep.end_time ?? null,
    location: {
      name: sanitizeText(rawStep.location?.name),
      detail: sanitizeText(rawStep.location?.detail),
      fullDetail: sanitizeText(rawStep.location?.full_detail),
      countryCode: rawStep.location?.country_code ?? "",
      lat: rawStep.location?.lat ?? 0,
      lon: rawStep.location?.lon ?? 0,
    },
    weatherCondition: rawStep.weather_condition ?? null,
    weatherTemperature: rawStep.weather_temperature ?? null,
    uuid: rawStep.uuid,
  }))

  return { trip, chapters, tripDirPath, coverPhotoS3Candidates }
}
