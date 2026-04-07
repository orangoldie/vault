"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { FeedbackButton } from "@/features/feedback/components/feedback-button"
import { SiteHeader } from "@/features/landing/components/site-header"
import { TripHeaderActions } from "@/features/export/components/trip-header-actions"
import { OverlayProvider } from "../lib/overlay-context"
import { PhotoSourceProvider } from "../lib/photo-source-context"
import { opfsPhotoSource } from "../lib/opfs-photo-source"
import { useTripDetail } from "../lib/use-trip-detail"
import { TripDetailView } from "./trip-detail-view"
import { TripNotFound } from "./trip-not-found"
import { TripDetailError } from "./trip-detail-error"
import { TripDetailSkeleton } from "./trip-detail-skeleton"

interface TripHeaderProps {
  tripId: number | null
  hasCover: boolean
  pastSummary: boolean
}

function TripHeader({ tripId, hasCover, pastSummary }: TripHeaderProps) {
  return (
    <SiteHeader
      visible={hasCover ? pastSummary : undefined}
      rightSlot={tripId !== null ? <TripHeaderActions tripId={tripId} /> : null}
    />
  )
}

interface TripDetailPageProps {
  slug: string
}

export function TripDetailPage({ slug }: TripDetailPageProps) {
  const { status, trip, chapters, coverPhotoUrl, photoCountsByChapter, retry } = useTripDetail(slug)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pastSummary, setPastSummary] = useState(false)

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

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const fadeProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 } as const,
        animate: { opacity: 1 } as const,
        transition: { duration: 0.25, ease: [0.45, 0, 0.55, 1] as const },
      }

  return (
    <OverlayProvider>
      <TripHeader
        tripId={status === "success" && trip ? trip.id : null}
        hasCover={Boolean(coverPhotoUrl)}
        pastSummary={pastSummary}
      />

      <FeedbackButton />
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
              onPastSummary={setPastSummary}
            />
          </PhotoSourceProvider>
        )}
      </div>
    </OverlayProvider>
  )
}
