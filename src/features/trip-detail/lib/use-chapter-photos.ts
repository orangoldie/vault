"use client"

import { useState, useEffect, useCallback, useRef } from "react"

import type { Photo } from "@/types/trip"

import { usePhotoSource } from "./photo-source-context"

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
  const source = usePhotoSource()
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
      const photos = await source.getPhotos(chapterId)
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
              const url = await source.resolveUrl(photo)
              if (url && !abortRef.current) {
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
  }, [chapterId, source])

  const revoke = useCallback(() => {
    for (const url of urlsRef.current.values()) {
      source.revokeUrl(url)
    }
    urlsRef.current.clear()
    // Clear URLs but keep photos so the grid skeleton stays at the correct height.
    // Reset status to idle so blobs reload when the chapter re-enters the viewport.
    setState((prev) => ({ ...prev, photoUrls: new Map(), status: "idle" }))
  }, [source])

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
