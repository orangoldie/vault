"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { useTripDetail } from "../lib/use-trip-detail"
import { BackButton } from "./back-button"
import { HeroCover } from "./hero-cover"
import { TripHeader } from "./trip-header"
import { ChapterShowcase } from "./chapter-showcase"
import { TripGlobe } from "./trip-globe"
import { TripNotFound } from "./trip-not-found"
import { TripDetailError } from "./trip-detail-error"
import { TripDetailSkeleton } from "./trip-detail-skeleton"
import { ScrollToTopButton } from "./scroll-to-top-button"

interface TripDetailPageProps {
  slug: string
}

export function TripDetailPage({ slug }: TripDetailPageProps) {
  const { status, trip, chapters, coverPhotoUrl, photoCountsByChapter, retry } = useTripDetail(slug)
  const containerRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [globeActiveIndex, setGlobeActiveIndex] = useState(0)
  const [globeVisible, setGlobeVisible] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

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

  // Show globe once scrolled past the header
  useEffect(() => {
    function handleScroll() {
      setGlobeVisible(window.scrollY > 400)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleActiveIndexChange = useCallback((index: number) => {
    setGlobeActiveIndex(index)
  }, [])

  const handleGlobeNavigate = useCallback(
    (index: number) => {
      setGlobeActiveIndex(index)
    },
    []
  )

  const hasCover = Boolean(coverPhotoUrl)

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 } as const,
        animate: { opacity: 1 } as const,
        transition: { duration: 0.25, ease: [0.45, 0, 0.55, 1] as const },
      }

  // Paper-unfold entrance via clip-path: reveals content from a narrow
  // vertical strip outward without distorting layout.
  // Only plays on initial page load, not re-renders.
  const hasPlayedRef = useRef(false)
  const shouldUnfold = status === "success" && !hasPlayedRef.current && !prefersReducedMotion
  useEffect(() => {
    if (status === "success") {
      hasPlayedRef.current = true
    }
  }, [status])

  const unfoldProps = shouldUnfold
    ? {
        initial: {
          clipPath: "inset(0 49.5% 0 49.5%)",
          opacity: 0,
        } as const,
        animate: {
          clipPath: "inset(0 0% 0 0%)",
          opacity: 1,
        } as const,
        transition: {
          clipPath: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3, delay: 0.15, ease: "easeOut" },
        },
      }
    : motionProps

  return (
    <div ref={containerRef} aria-live="polite">
      {/* Skip to content link */}
      <a
        href="#trip-header"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-40 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <BackButton hasCover={status === "success" && hasCover} />

      {status === "loading" && <TripDetailSkeleton />}

      {status === "not-found" && (
        <motion.div {...motionProps}>
          <TripNotFound />
        </motion.div>
      )}

      {status === "error" && (
        <motion.div {...motionProps}>
          <TripDetailError onRetry={retry} />
        </motion.div>
      )}

      {status === "success" && trip && chapters && (
        <motion.div {...unfoldProps}>
          {hasCover && (
            <HeroCover
              coverPhotoUrl={coverPhotoUrl ?? null}
              tripName={trip.name}
            />
          )}

          <div className="mx-auto w-full max-w-[720px] px-4 py-8 md:px-8">
            <TripHeader
              trip={trip}
              hasCover={hasCover}
            />
          </div>
          <ChapterShowcase
            chapters={chapters}
            photoCountsByChapter={photoCountsByChapter ?? new Map()}
            onActiveIndexChange={handleActiveIndexChange}
          />
          <TripGlobe
            chapters={chapters}
            activeIndex={globeActiveIndex}
            visible={globeVisible}
            onNavigate={handleGlobeNavigate}
          />
          <ScrollToTopButton prefersReducedMotion={prefersReducedMotion} />
        </motion.div>
      )}
    </div>
  )
}
