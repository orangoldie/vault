"use client"

import { useState, useEffect, useCallback, useRef } from "react"

import { getPhotosByChapter } from "@/stores/db"
import { readPhoto } from "@/stores/photo-storage"
import type { Photo } from "@/types/trip"

type ChapterPhotosStatus = "idle" | "loading" | "success" | "error"

interface ChapterPhotosState {
  photos: Photo[]
  photoUrls: Map<string, string>
  status: ChapterPhotosStatus
}

const CONCURRENCY_LIMIT = 4
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 200

export function useChapterPhotos(chapterId: number) {
  const [state, setState] = useState<ChapterPhotosState>({
    photos: [],
    photoUrls: new Map(),
    status: "idle",
  })
  const urlsRef = useRef<Map<string, string>>(new Map())
  const abortRef = useRef(false)

  const load = useCallback(async () => {
    abortRef.current = false
    setState((prev) => ({ ...prev, status: "loading" }))

    try {
      const photos = await getPhotosByChapter(chapterId)
      if (abortRef.current) return

      const urls = new Map<string, string>()
      const queue = [...photos]

      async function processNext(): Promise<void> {
        while (queue.length > 0) {
          if (abortRef.current) return
          const photo = queue.shift()!
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            if (abortRef.current) return
            try {
              const blob = await readPhoto(photo.tripId, photo.chapterId, photo.filename)
              if (blob && !abortRef.current) {
                const url = URL.createObjectURL(blob)
                urls.set(photo.id, url)
                urlsRef.current.set(photo.id, url)
              }
              break
            } catch {
              if (attempt < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
              }
            }
          }
        }
      }

      // Run workers in parallel up to the concurrency limit
      const workers = Array.from(
        { length: Math.min(CONCURRENCY_LIMIT, photos.length) },
        () => processNext()
      )
      await Promise.all(workers)

      if (!abortRef.current) {
        setState((prev) => ({
          ...prev,
          photos,
          photoUrls: new Map(urls),
          status: "success",
        }))
      }
    } catch {
      if (!abortRef.current) {
        setState((prev) => ({ ...prev, status: "error" }))
      }
    }
  }, [chapterId])

  const revoke = useCallback(() => {
    for (const url of urlsRef.current.values()) {
      URL.revokeObjectURL(url)
    }
    urlsRef.current.clear()
    // Clear URLs but keep photos so the grid skeleton stays at the correct height.
    // Reset status to idle so blobs reload when the chapter re-enters the viewport.
    setState((prev) => ({ ...prev, photoUrls: new Map(), status: "idle" }))
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true
      revoke()
    }
  }, [revoke])

  return {
    ...state,
    load,
    revoke,
  }
}
