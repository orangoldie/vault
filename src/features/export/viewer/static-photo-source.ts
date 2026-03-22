import type { Photo } from "@/types/trip"
import type { PhotoSource } from "@/features/trip-detail/lib/photo-source-context"

interface ExportPhoto extends Photo {
  exportPath: string
}

/**
 * PhotoSource implementation for the export viewer.
 * Photos are pre-loaded from __VAULT_DATA__ and URLs are static file paths.
 */
export function createStaticPhotoSource(
  photos: ExportPhoto[]
): PhotoSource {
  // Index photos by chapterId for fast lookup
  const byChapter = new Map<number, ExportPhoto[]>()
  const pathById = new Map<string, string>()

  for (const photo of photos) {
    const list = byChapter.get(photo.chapterId) ?? []
    list.push(photo)
    byChapter.set(photo.chapterId, list)
    pathById.set(photo.id, photo.exportPath)
  }

  return {
    getPhotos: async (chapterId: number) => {
      return byChapter.get(chapterId) ?? []
    },
    resolveUrl: async (photo: Photo) => {
      return pathById.get(photo.id) ?? null
    },
    revokeUrl: () => {
      // No-op — static file paths don't need revocation
    },
  }
}
