"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

import { ExportToolbar } from "@/features/export/components/export-toolbar"

import { PhotoSourceProvider } from "../lib/photo-source-context"
import { opfsPhotoSource } from "../lib/opfs-photo-source"
import { useTripDetail } from "../lib/use-trip-detail"
import { TripDetailView } from "./trip-detail-view"
import { TripNotFound } from "./trip-not-found"
import { TripDetailError } from "./trip-detail-error"
import { TripDetailSkeleton } from "./trip-detail-skeleton"

interface TripDetailPageProps {
  slug: string
}

export function TripDetailPage({ slug }: TripDetailPageProps) {
  const { status, trip, chapters, coverPhotoUrl, photoCountsByChapter, retry } = useTripDetail(slug)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus management after state transitions
  useEffect(() => {
    if (
      status === "success" ||
      status === "not-found" ||
      status === "error"
    ) {
      requestAnimationFrame(() => {
        const h1 = containerRef.current?.querySelector("h1")
        if (h1) {
          h1.setAttribute("tabindex", "-1")
          h1.focus()
        }
      })
    }
  }, [status])

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const fadeProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 } as const,
        animate: { opacity: 1 } as const,
        transition: { duration: 0.25, ease: [0.45, 0, 0.55, 1] as const },
      }

  return (
    <div ref={containerRef} aria-live="polite">
      {status === "loading" && <TripDetailSkeleton />}

      {status === "not-found" && (
        <motion.div {...fadeProps}>
          <TripNotFound />
        </motion.div>
      )}

      {status === "error" && (
        <motion.div {...fadeProps}>
          <TripDetailError onRetry={retry} />
        </motion.div>
      )}

      {status === "success" && trip && chapters && (
        <PhotoSourceProvider source={opfsPhotoSource}>
          <TripDetailView
            trip={trip}
            chapters={chapters}
            coverPhotoUrl={coverPhotoUrl}
            photoCountsByChapter={photoCountsByChapter ?? new Map()}
            toolbarSlot={<ExportToolbar tripId={trip.id} />}
          />
        </PhotoSourceProvider>
      )}
    </div>
  )
}
