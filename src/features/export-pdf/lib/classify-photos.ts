import { readPhoto } from "@/stores/photo-storage"

export type AspectClass = "landscape" | "portrait" | "square"

export interface ClassifiedPhoto {
  tripId: number
  chapterId: number
  filename: string
  width: number
  height: number
  aspect: AspectClass
}

export function classifyAspect(width: number, height: number): AspectClass {
  const ratio = width / height
  if (ratio > 1.2) return "landscape"
  if (ratio < 0.8) return "portrait"
  return "square"
}

/**
 * Scan photo dimensions via createImageBitmap.
 * Decodes the full image briefly to read width/height, then closes.
 */
export async function classifyPhotos(
  photos: Array<{ tripId: number; chapterId: number; filename: string }>,
  signal?: AbortSignal
): Promise<ClassifiedPhoto[]> {
  const result: ClassifiedPhoto[] = []

  for (const photo of photos) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError")

    const blob = await readPhoto(photo.tripId, photo.chapterId, photo.filename)
    if (!blob) {
      // Skip missing photos — use 1:1 fallback
      result.push({
        ...photo,
        width: 1,
        height: 1,
        aspect: "square",
      })
      continue
    }

    const bitmap = await createImageBitmap(blob)
    const { width, height } = bitmap
    bitmap.close()

    result.push({
      ...photo,
      width,
      height,
      aspect: classifyAspect(width, height),
    })
  }

  return result
}
