import { getPhotosByChapter } from "@/stores/db"
import { readPhoto } from "@/stores/photo-storage"

import type { PhotoSource } from "./photo-source-context"

/**
 * PhotoSource backed by IndexedDB (photo metadata) and OPFS (photo blobs).
 * This is the default source used by the main app.
 */
export const opfsPhotoSource: PhotoSource = {
  getPhotos: (chapterId) => getPhotosByChapter(chapterId),
  resolveUrl: async (photo) => {
    const blob = await readPhoto(photo.tripId, photo.chapterId, photo.filename)
    return blob ? URL.createObjectURL(blob) : null
  },
  revokeUrl: (url) => URL.revokeObjectURL(url),
}
