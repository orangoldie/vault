import { Zip, ZipDeflate, ZipPassThrough } from "fflate"

import type { Trip, Chapter, Photo } from "@/types/trip"
import { getTrip, getChaptersByTrip, getPhotosByChapter } from "@/stores/db"
import { readPhoto } from "@/stores/photo-storage"

import { decomposeCoverPhotoId } from "@/features/trip-detail/lib/decompose-cover-photo-id"
import { deriveExportSlug } from "@/features/export/lib/derive-export-slug"

import {
  encodeUtf8,
  arrayBufferToBase64,
  buildAssetScript,
  buildFontScript,
  buildSpriteScript,
  buildWorkerScript,
} from "./asset-encoder"
import { buildHtml } from "./build-html"
import {
  MAP_FONT_PATHS,
  MAP_SPRITE_PATHS,
  PMTILES_PATH,
} from "./map-asset-manifest"

export type ExportPhase =
  | "preparing"
  | "map-assets"
  | "archiving"
  | "complete"
  | "error"

export interface ExportProgress {
  phase: ExportPhase
  current: number
  total: number
  /** Set on completion */
  fileSize?: number
  /** Photos that could not be found in OPFS */
  skippedPhotos?: Photo[]
  /** Error message if phase is "error" */
  errorMessage?: string
}

interface ExportOptions {
  tripId: number
  onProgress: (progress: ExportProgress) => void
  signal?: AbortSignal
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError")
}

/** Add a file entry to the streaming ZIP */
function addToZip(
  zip: Zip,
  path: string,
  data: Uint8Array,
  compress: boolean = true
): void {
  const entry = compress
    ? new ZipDeflate(path, { level: 6 })
    : new ZipPassThrough(path)
  zip.add(entry)
  entry.push(data, true)
}

/**
 * Fetch a local asset from the app's public directory.
 * Works in both dev (Next.js dev server) and production (static hosting).
 */
async function fetchLocalAsset(
  path: string,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  const response = await fetch(`/${path}`, { signal })
  if (!response.ok) {
    throw new Error(`Failed to fetch /${path}: ${response.status}`)
  }
  return response.arrayBuffer()
}

async function fetchLocalText(
  path: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`/${path}`, { signal })
  if (!response.ok) {
    throw new Error(`Failed to fetch /${path}: ${response.status}`)
  }
  return response.text()
}

/**
 * Main export orchestrator. Gathers trip data, reads photos from OPFS,
 * packages map assets, and streams everything into a ZIP for download.
 */
export async function exportTrip({
  tripId,
  onProgress,
  signal,
}: ExportOptions): Promise<void> {
  try {
    // ── Step 1: Gather trip data from IndexedDB ──
    onProgress({ phase: "preparing", current: 0, total: 0 })
    checkAbort(signal)

    const trip = await getTrip(tripId)
    if (!trip) throw new Error(`Trip ${tripId} not found`)

    const chapters = await getChaptersByTrip(tripId)
    const sortedChapters = [...chapters].sort(
      (a, b) => a.startTime - b.startTime
    )

    // Gather all photos across all chapters
    const allPhotos: Photo[] = []
    for (const chapter of sortedChapters) {
      const chapterPhotos = await getPhotosByChapter(chapter.id)
      allPhotos.push(...chapterPhotos)
    }

    checkAbort(signal)

    // ── Step 2: Fetch map assets ──
    onProgress({ phase: "map-assets", current: 0, total: 0 })

    // PMTiles
    const pmtilesBuffer = await fetchLocalAsset(PMTILES_PATH, signal)
    const pmtilesBase64 = arrayBufferToBase64(pmtilesBuffer)

    // Font PBF files — fetch in parallel batches
    const fontFiles = new Map<string, ArrayBuffer>()
    const BATCH_SIZE = 20
    for (let i = 0; i < MAP_FONT_PATHS.length; i += BATCH_SIZE) {
      checkAbort(signal)
      const batch = MAP_FONT_PATHS.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((p) => fetchLocalAsset(p, signal))
      )
      batch.forEach((p, j) => fontFiles.set(p, results[j]))
    }

    // Sprite files
    const spriteFiles = new Map<string, ArrayBuffer>()
    const spriteResults = await Promise.all(
      MAP_SPRITE_PATHS.map((p) => fetchLocalAsset(p, signal))
    )
    MAP_SPRITE_PATHS.forEach((p, i) => spriteFiles.set(p, spriteResults[i]))

    // Viewer bundle
    const viewerJs = await fetchLocalText("export/export-viewer.js", signal)
    const viewerCss = await fetchLocalText("export/export-viewer.css", signal)

    // Display fonts — discover all files in export/fonts/
    const fontManifestResponse = await fetch("/export/fonts/manifest.json", { signal })
    const displayFontFiles: Array<{ name: string; data: ArrayBuffer }> = []
    if (fontManifestResponse.ok) {
      const fontFileNames: string[] = await fontManifestResponse.json()
      for (const name of fontFileNames) {
        checkAbort(signal)
        const data = await fetchLocalAsset(`export/fonts/${name}`, signal)
        displayFontFiles.push({ name, data })
      }
    }

    // MapLibre worker source
    const workerSource = await fetchLocalText(
      "export/maplibre-worker.js",
      signal
    )

    checkAbort(signal)

    // ── Step 3: Stream the ZIP ──
    onProgress({ phase: "archiving", current: 0, total: allPhotos.length })

    const zipChunks: Uint8Array[] = []
    const skippedPhotos: Photo[] = []

    const zipResult = await new Promise<Uint8Array>((resolve, reject) => {
      const zip = new Zip((err, chunk, final) => {
        if (err) {
          reject(err)
          return
        }
        zipChunks.push(chunk)
        if (final) {
          // Concatenate all chunks
          const totalLength = zipChunks.reduce((sum, c) => sum + c.length, 0)
          const result = new Uint8Array(totalLength)
          let offset = 0
          for (const c of zipChunks) {
            result.set(c, offset)
            offset += c.length
          }
          resolve(result)
        }
      })

      // We need to process async steps but the Zip callback is sync.
      // Use an async IIFE inside the promise.
      ;(async () => {
        try {
          // Determine cover photo path
          let coverPhotoPath: string | null = null
          if (trip.coverPhotoId) {
            try {
              const { tripId: coverTripId, subdir, filename } =
                decomposeCoverPhotoId(trip.coverPhotoId)
              const blob = await readPhoto(coverTripId, subdir, filename)
              if (blob) {
                coverPhotoPath = `photos/cover/${filename}`
                addToZip(
                  zip,
                  coverPhotoPath,
                  new Uint8Array(await blob.arrayBuffer()),
                  false // JPEGs are already compressed
                )
              }
            } catch {
              // Cover photo unavailable — proceed without it
            }
          }

          // index.html
          const html = buildHtml({
            trip,
            chapters: sortedChapters,
            photos: allPhotos,
            coverPhotoPath,
          })
          addToZip(zip, "index.html", encodeUtf8(html))

          // Viewer bundle
          addToZip(zip, "assets/viewer.js", encodeUtf8(viewerJs))
          addToZip(zip, "assets/viewer.css", encodeUtf8(viewerCss))

          // Map asset JS files
          addToZip(
            zip,
            "assets/globe-data.js",
            encodeUtf8(buildAssetScript("pmtiles:globe", pmtilesBase64))
          )
          addToZip(
            zip,
            "assets/map-fonts.js",
            encodeUtf8(buildFontScript(fontFiles))
          )
          addToZip(
            zip,
            "assets/map-sprites.js",
            encodeUtf8(buildSpriteScript(spriteFiles))
          )
          addToZip(
            zip,
            "assets/maplibre-worker.js",
            encodeUtf8(buildWorkerScript(workerSource))
          )

          // Display fonts (all subsets)
          for (const { name, data } of displayFontFiles) {
            addToZip(
              zip,
              `fonts/${name}`,
              new Uint8Array(data),
              // Don't compress WOFF2 (already compressed) or CSS (small)
              name.endsWith(".woff2") ? false : true
            )
          }

          // Structured trip data for power users
          addToZip(
            zip,
            "data/trip.json",
            encodeUtf8(
              JSON.stringify(
                { trip, chapters: sortedChapters, photos: allPhotos },
                null,
                2
              )
            )
          )

          // Stream photos one at a time
          for (let i = 0; i < allPhotos.length; i++) {
            checkAbort(signal)
            const photo = allPhotos[i]
            const blob = await readPhoto(
              photo.tripId,
              photo.chapterId,
              photo.filename
            )
            if (!blob) {
              skippedPhotos.push(photo)
              onProgress({
                phase: "archiving",
                current: i + 1,
                total: allPhotos.length,
              })
              continue
            }
            const data = new Uint8Array(await blob.arrayBuffer())
            addToZip(
              zip,
              `photos/${photo.chapterId}/${photo.filename}`,
              data,
              false // JPEGs are already compressed
            )
            onProgress({
              phase: "archiving",
              current: i + 1,
              total: allPhotos.length,
            })
          }

          zip.end()
        } catch (err) {
          reject(err)
        }
      })()
    })

    checkAbort(signal)

    // ── Step 4: Trigger download ──
    const blob = new Blob([zipResult.buffer as ArrayBuffer], { type: "application/zip" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${deriveExportSlug(trip.name, trip.startDate, trip.slug)}.zip`
    a.click()
    URL.revokeObjectURL(url)

    onProgress({
      phase: "complete",
      current: allPhotos.length,
      total: allPhotos.length,
      fileSize: zipResult.byteLength,
      skippedPhotos: skippedPhotos.length > 0 ? skippedPhotos : undefined,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Cancelled — don't report as error
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
