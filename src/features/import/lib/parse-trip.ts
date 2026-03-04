import type { RawTrip } from "@/types/travel-export"
import type { Trip, Chapter } from "@/types/trip"
import { ImportError } from "@/types/import"
import type { ZipEntries } from "./extract-zip"

/** Strip HTML tags from text to prevent XSS */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return ""
  return text.replace(/<[^>]*>/g, "")
}

interface TripDirectory {
  path: string
  tripJson: RawTrip
}

function findTripDirectories(entries: ZipEntries): TripDirectory[] {
  const tripDirs: TripDirectory[] = []
  const decoder = new TextDecoder()

  for (const [path, data] of Object.entries(entries)) {
    // Match patterns like trip/<slug>_<id>/trip.json or user_data/trip/<slug>_<id>/trip.json
    const match = path.match(/(?:^|\/)(trip\/[^/]+\/)trip\.json$/)
    if (!match) continue

    try {
      const json = decoder.decode(data)
      const parsed = JSON.parse(json) as RawTrip
      tripDirs.push({ path: match[1], tripJson: parsed })
    } catch {
      throw new ImportError("MALFORMED_JSON", "trip.json contains invalid JSON")
    }
  }

  return tripDirs
}

function selectTrip(dirs: TripDirectory[]): TripDirectory {
  if (dirs.length === 0) {
    throw new ImportError("MISSING_TRIP_JSON", "No trip.json found in ZIP")
  }

  // Sort by start_date (earliest first), fallback to alphabetical directory name
  dirs.sort((a, b) => {
    const dateA = a.tripJson.start_date ?? Infinity
    const dateB = b.tripJson.start_date ?? Infinity
    if (dateA !== dateB) return dateA - dateB
    return a.path.localeCompare(b.path)
  })

  return dirs[0]
}

function resolveCoverPhotoId(
  raw: RawTrip,
  tripDirPath: string,
  entries: ZipEntries
): string | null {
  if (!raw.cover_photo?.uuid) return null

  // The cover_photo.path in the export is an S3 URL, not a local path.
  // We need to find the matching photo file by UUID in the local chapter directories.
  const coverUuid = raw.cover_photo.uuid

  for (const filePath of Object.keys(entries)) {
    if (!filePath.startsWith(tripDirPath)) continue
    if (!filePath.includes("/photos/")) continue

    // Photo filenames are UUID-based like: uuid_uuid.jpg.jpg
    if (filePath.includes(coverUuid)) {
      // Extract chapter info to build the photo ID
      const relPath = filePath.slice(tripDirPath.length)
      const chapterMatch = relPath.match(/^([^/]+)_(\d+)\/photos\/(.+)$/)
      if (chapterMatch) {
        const chapterId = parseInt(chapterMatch[2], 10)
        const filename = chapterMatch[3]
        return `${raw.id}-${chapterId}-${filename}`
      }
    }
  }

  return null
}

export interface ParsedTripData {
  trip: Trip
  chapters: Chapter[]
  tripDirPath: string
}

export function parseTrip(entries: ZipEntries): ParsedTripData {
  const dirs = findTripDirectories(entries)
  const selected = selectTrip(dirs)
  const raw = selected.tripJson

  if (!raw.all_steps || raw.all_steps.length === 0) {
    throw new ImportError("EMPTY_TRIP", "This trip has no chapters")
  }

  const coverPhotoId = resolveCoverPhotoId(raw, selected.path, entries)

  const trip: Trip = {
    id: raw.id,
    name: sanitizeText(raw.name),
    slug: raw.slug,
    startDate: raw.start_date,
    endDate: raw.end_date,
    summary: sanitizeText(raw.summary),
    coverPhotoId,
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

  return { trip, chapters, tripDirPath: selected.path }
}
