import type { ZipEntries } from "./extract-zip"

export interface PhotoEntry {
  tripId: number
  chapterId: number
  filename: string
  data: Uint8Array
}

/**
 * Scans ZIP entries for photo files within chapter directories.
 * Chapter directories follow the pattern: <slug>_<id>/photos/<filename>
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
    // Match: <slug>_<id>/photos/<filename>
    const match = relPath.match(/^[^/]+_(\d+)\/photos\/([^/]+)$/)
    if (!match) continue

    const chapterId = parseInt(match[1], 10)
    const filename = match[2]

    photos.push({ tripId, chapterId, filename, data })
  }

  return photos
}
