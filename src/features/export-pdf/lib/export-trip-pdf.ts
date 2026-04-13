import { pdf } from "@react-pdf/renderer"
import React from "react"

import type { Trip, Chapter, Photo } from "@/types/trip"
import { getTrip, getChaptersByTrip, getPhotosByChapter } from "@/stores/db"
import { readPhoto } from "@/stores/photo-storage"
import { decomposeCoverPhotoId } from "@/features/trip-detail/lib/decompose-cover-photo-id"
import { getCountryRoute } from "@/features/trip-detail/lib/country-route"

import { classifyAspect, type ClassifiedPhoto } from "./classify-photos"
import { packChapterPages } from "./plan-photo-layouts"
import { registerPdfFonts } from "./pdf-fonts"
import { loadFontMetrics } from "./measure-text"
import {
  TripAlbumDocument,
  type ChapterSection,
} from "../components/trip-album-document"

export type PdfExportPhase =
  | "preparing"
  | "composing"
  | "complete"
  | "error"

export interface PdfExportProgress {
  phase: PdfExportPhase
  current: number
  total: number
  fileSize?: number
  errorMessage?: string
}

interface PdfExportOptions {
  tripId: number
  onProgress: (progress: PdfExportProgress) => void
  signal?: AbortSignal
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError")
}

/**
 * Convert a Blob to a base64 data URL.
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Main PDF export orchestrator.
 * Gathers trip data, classifies photos, plans layouts with the two-phase algorithm,
 * renders PDF, and triggers download.
 */
export async function exportTripPdf({
  tripId,
  onProgress,
  signal,
}: PdfExportOptions): Promise<void> {
  try {
    // ── Step 1: Gather trip data ──
    onProgress({ phase: "preparing", current: 0, total: 0 })
    checkAbort(signal)

    const trip = await getTrip(tripId)
    if (!trip) throw new Error(`Trip ${tripId} not found`)

    const chapters = await getChaptersByTrip(tripId)
    const sortedChapters = [...chapters].sort(
      (a, b) => a.startTime - b.startTime
    )

    // Gather all photos grouped by chapter
    const photosByChapter = new Map<number, Photo[]>()
    let totalPhotos = 0
    for (const chapter of sortedChapters) {
      const chapterPhotos = await getPhotosByChapter(chapter.id)
      photosByChapter.set(chapter.id, chapterPhotos)
      totalPhotos += chapterPhotos.length
    }

    checkAbort(signal)

    // Country route
    const countryCodes = getCountryRoute(sortedChapters)

    // Cover photo
    let coverPhotoDataUrl: string | null = null
    if (trip.coverPhotoId) {
      try {
        const { tripId: coverTripId, subdir, filename } =
          decomposeCoverPhotoId(trip.coverPhotoId)
        const blob = await readPhoto(coverTripId, subdir, filename)
        if (blob) {
          coverPhotoDataUrl = await blobToDataUrl(blob)
        }
      } catch {
        // Cover unavailable — proceed without
      }
    }

    checkAbort(signal)

    // ── Step 2: Register fonts & load metrics for layout planning ──
    await registerPdfFonts()
    // Load the display font metrics (used for description text measurement)
    const fontMetrics = await loadFontMetrics("Noto Serif")

    checkAbort(signal)

    // ── Step 3: Classify + resolve data URLs + pack pages (per chapter) ──
    // Single pass per photo: read blob once → get dimensions → classify → convert to data URL.
    // Each chapter is processed independently to cap peak memory.
    onProgress({ phase: "composing", current: 0, total: totalPhotos })

    const sections: ChapterSection[] = []
    let photosProcessed = 0

    for (const chapter of sortedChapters) {
      checkAbort(signal)

      const photos = photosByChapter.get(chapter.id) ?? []

      // Single-pass: classify and convert to data URL from the same blob read
      const classified: ClassifiedPhoto[] = []
      const dataUrlsByFilename = new Map<string, string | null>()

      for (const photo of photos) {
        checkAbort(signal)
        const blob = await readPhoto(photo.tripId, photo.chapterId, photo.filename)
        if (!blob) {
          classified.push({
            tripId: photo.tripId,
            chapterId: photo.chapterId,
            filename: photo.filename,
            width: 1,
            height: 1,
            aspect: "square",
          })
          dataUrlsByFilename.set(photo.filename, null)
          continue
        }

        const bitmap = await createImageBitmap(blob)
        const { width, height } = bitmap
        bitmap.close()

        classified.push({
          tripId: photo.tripId,
          chapterId: photo.chapterId,
          filename: photo.filename,
          width,
          height,
          aspect: classifyAspect(width, height),
        })
        dataUrlsByFilename.set(photo.filename, await blobToDataUrl(blob))
        onProgress({ phase: "composing", current: ++photosProcessed, total: totalPhotos })
      }

      // Pack chapter text + photos into pages via two-phase layout algorithm
      const pages = packChapterPages(chapter, classified, fontMetrics)

      sections.push({ pages, dataUrlsByFilename })
    }

    checkAbort(signal)

    // ── Step 4: Render PDF ──
    const document = React.createElement(TripAlbumDocument, {
      trip,
      coverPhotoDataUrl,
      countryCodes,
      chapterCount: sortedChapters.length,
      photoCount: totalPhotos,
      sections,
      fontMetrics,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf's pdf() typing is overly strict with React element types
    const blob = await pdf(document as any).toBlob()

    checkAbort(signal)

    // ── Step 5: Trigger download ──
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement("a")
    a.href = url
    a.download = `${trip.slug}-album.pdf`
    a.click()
    URL.revokeObjectURL(url)

    onProgress({
      phase: "complete",
      current: totalPhotos,
      total: totalPhotos,
      fileSize: blob.size,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return
    }
    onProgress({
      phase: "error",
      current: 0,
      total: 0,
      errorMessage:
        err instanceof Error ? err.message : "An unexpected error occurred",
    })
  }
}
