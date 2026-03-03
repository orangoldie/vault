import type { ZipEntries } from "./extract-zip"

export interface PhotoEntry {
  tripId: number
  stepId: number
  filename: string
  data: Uint8Array
}

/**
 * Scans ZIP entries for photo files within step directories.
 * Step directories follow the pattern: <step-slug>_<step-id>/photos/<filename>
 */
export function collectPhotos(
  entries: ZipEntries,
  tripDirPath: string,
  tripId: number
): PhotoEntry[] {
  const photos: PhotoEntry[] = []

  for (const [path, data] of Object.entries(entries)) {
    if (!path.startsWith(tripDirPath)) continue
    if (!path.includes("/photos/")) continue

    // Skip directories (empty entries)
    if (data.length === 0) continue

    const relPath = path.slice(tripDirPath.length)
    // Match: <step-slug>_<step-id>/photos/<filename>
    const match = relPath.match(/^[^/]+_(\d+)\/photos\/([^/]+)$/)
    if (!match) continue

    const stepId = parseInt(match[1], 10)
    const filename = match[2]

    photos.push({ tripId, stepId, filename, data })
  }

  return photos
}
