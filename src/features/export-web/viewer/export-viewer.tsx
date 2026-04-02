"use client"

import { useEffect, useMemo, useState } from "react"

import type { Trip, Chapter, Photo } from "@/types/trip"
import { Providers } from "@/components/providers"
import { PhotoSourceProvider } from "@/features/trip-detail/lib/photo-source-context"
import { TripDetailView } from "@/features/trip-detail/components/trip-detail-view"

import { registerVaultProtocols } from "./register-vault-protocols"
import { createStaticPhotoSource } from "./static-photo-source"
import { createExportGlobeStyle } from "./export-globe-style"

interface VaultData {
  trip: Trip & { exportCoverPhotoPath: string | null }
  chapters: Chapter[]
  photos: Array<Photo & { exportPath: string }>
}

declare global {
  interface Window {
    __VAULT_DATA__: VaultData
    __VAULT_ASSETS__: Record<string, string>
  }
}

export function ExportViewer() {
  const [pmtilesUrl, setPmtilesUrl] = useState<string | null>(null)

  const { trip, chapters, photos } = window.__VAULT_DATA__

  // Register custom MapLibre protocols on mount
  useEffect(() => {
    const url = registerVaultProtocols(window.__VAULT_ASSETS__)
    setPmtilesUrl(url)
  }, [])

  const photoSource = useMemo(() => createStaticPhotoSource(photos), [photos])

  const photoCountsByChapter = useMemo(() => {
    const counts = new Map<number, number>()
    for (const photo of photos) {
      counts.set(photo.chapterId, (counts.get(photo.chapterId) ?? 0) + 1)
    }
    return counts
  }, [photos])

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.startTime - b.startTime),
    [chapters]
  )

  const coverPhotoUrl = trip.exportCoverPhotoPath
    ? `./${trip.exportCoverPhotoPath}`
    : null

  const ready = pmtilesUrl !== null

  const mapStyle = useMemo(
    () => (pmtilesUrl ? createExportGlobeStyle(pmtilesUrl) : undefined),
    [pmtilesUrl]
  )

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    )
  }

  return (
    <Providers>
      <PhotoSourceProvider source={photoSource}>
        <TripDetailView
          trip={trip}
          chapters={sortedChapters}
          coverPhotoUrl={coverPhotoUrl}
          photoCountsByChapter={photoCountsByChapter}
          mapStyle={mapStyle}
        />
      </PhotoSourceProvider>
    </Providers>
  )
}
