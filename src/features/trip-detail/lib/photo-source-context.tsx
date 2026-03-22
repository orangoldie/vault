"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"

import type { Photo } from "@/types/trip"

/**
 * Abstraction over where chapter photos come from (IndexedDB + OPFS vs static paths).
 * The app provides an OPFS-backed source; the export viewer provides a static source.
 */
export interface PhotoSource {
  getPhotos(chapterId: number): Promise<Photo[]>
  resolveUrl(photo: Photo): Promise<string | null>
  revokeUrl(url: string): void
}

/**
 * Default no-op source. The app wraps with OpfsPhotoSourceProvider;
 * the export viewer wraps with StaticPhotoSourceProvider.
 * This avoids importing IndexedDB/OPFS modules at the context level,
 * which would break in file:// contexts (export viewer).
 */
const noopPhotoSource: PhotoSource = {
  getPhotos: async () => [],
  resolveUrl: async () => null,
  revokeUrl: () => {},
}

const PhotoSourceContext = createContext<PhotoSource>(noopPhotoSource)

export function usePhotoSource(): PhotoSource {
  return useContext(PhotoSourceContext)
}

export function PhotoSourceProvider({
  source,
  children,
}: {
  source: PhotoSource
  children: ReactNode
}) {
  return (
    <PhotoSourceContext.Provider value={source}>
      {children}
    </PhotoSourceContext.Provider>
  )
}
